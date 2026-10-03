'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { geolocation, sensors, device } from "@/native";
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import type { WalkPoint } from '@/services/types';
import { WalkStats } from '@/types/domain';
import { normalizePathToTuples, showToast } from '@/lib/utils';


type WalkPhase = 'idle' | 'ready' | 'active' | 'paused' | 'completing' | 'completed';

// 'none' = sorun yok
type WalkIssue =
    | 'none'
    | 'location_permission_required'
    | 'gps_searching'
    | 'gps_weak'
    | 'location_lost'
    | 'network_unavailable'
    | 'background_permission_required'
    | 'error';

interface WalkSplit {
    km: number;
    splitSeconds: number;
    cumulativeSeconds: number;
}

interface WalkData {
    // Duraklamalar hariç geçen süre (sn). Saniye sayacı değil, zaman damgalarından hesaplanır:
    // telefon uygulamayı arka planda yavaşlatsa da doğru kalır.
    time: number;
    distance: number; // metre
    isActive: boolean;
    isPaused: boolean;
    // Hareketsizlikte kendiliğinden duraklama; GPS açık kalır ki hareket görülünce devam etsin.
    isAutoPaused: boolean;
    path: [number, number][];
    speed: number; // km/sa
    sessionId?: string;
    startedAt?: number; // ms
    splits: WalkSplit[];
    sniffStops?: number;
    // Yürüyen hayvan yürüyüşün kendisinde tutulur (seçili hayvan sonradan değişebilir).
    petId?: string;
    petName?: string;
    // İvmeölçerle sayılan gerçek adım (GPS'ten bağımsız). Sensör yoksa 0 kalır, uydurulmaz.
    realSteps: number;
}

// Uygulama kapanınca/çökünce kalan yürüyüş; kullanıcıya "devam mı, bitir mi" sorulur.
interface RecoverableWalk {
    time: number;
    distance: number;
    path: [number, number][];
    sessionId?: string;
    startedAt?: number;
    petId?: string;
    petName?: string;
    realSteps?: number;
    splits?: WalkSplit[];
    pendingPoints?: WalkPoint[];
}

export interface WalkRecord {
    id: string;
    petId?: string | null;
    started_at?: string;
    ended_at?: string;
    distance_meters: number;
    distanceKm: number;
    activeSeconds: number;
    duration_minutes: number;
    steps: number | null;
    calories: number;
    // Rota önizlemesi (en fazla ~60 nokta, ilk nokta = başlangıç)
    path: [number, number][];
    photoUrls: string[];
}

export type WalkFinishResult = { sessionId?: string; status: 'completed' | 'discarded' };
export type WalkFinishStage = 'points' | 'saved' | 'refreshed';

interface ActivityContextType {
    walkData: WalkData;
    walkHistory: WalkRecord[];
    walkStats: WalkStats | null;
    startWalk: () => Promise<void>;
    pauseWalk: () => void;
    resumeWalk: () => void;
    // Başarısız olursa hata fırlatır ve yürüyüşü SİLMEZ (tekrar denenebilir).
    stopWalk: (onStage?: (stage: WalkFinishStage) => void) => Promise<WalkFinishResult>;
    discardWalkRecord: (sessionId: string) => Promise<void>;
    isLoading: boolean;
    refreshWalkData: () => Promise<void>;
    walkPhase: WalkPhase;
    walkIssue: WalkIssue;
    recoverableWalk: RecoverableWalk | null;
    continueRecoveredWalk: () => void;
    discardRecoveredWalk: () => Promise<void>;
    acknowledgeWalkCompletion: () => void;
    enterReadyPhase: () => void;
    exitToIdlePhase: () => void;
    autoPauseEnabled: boolean;
    setAutoPauseEnabled: (v: boolean) => void;
    stepsSupported: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const ACTIVE_WALK_KEY = 'moffi_active_walk';
const AUTO_PAUSE_IDLE_MS = 25000;
const HISTORY_LIMIT = 400; // ~1 yıl, günlük yürüyen biri için

const EMPTY_WALK: WalkData = {
    time: 0, distance: 0, isActive: false, isPaused: false, isAutoPaused: false,
    path: [], speed: 0, splits: [], realSteps: 0,
};

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapSessionToRecord(s: any): WalkRecord {
    const meters = Number(s.distance_meters || 0);
    const activeSeconds = typeof s.active_seconds === 'number'
        ? s.active_seconds
        : (s.start_time && s.end_time ? Math.max(0, Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000)) : 0);
    return {
        id: s.id,
        petId: s.pet_id ?? null,
        started_at: s.start_time,
        ended_at: s.end_time,
        distance_meters: meters,
        distanceKm: meters / 1000,
        activeSeconds,
        duration_minutes: Math.round(activeSeconds / 60),
        steps: typeof s.steps === 'number' && s.steps > 0 ? s.steps : null,
        calories: s.calories_kcal ?? 0,
        path: normalizePathToTuples(s.route_preview ?? s.path_coordinates),
        photoUrls: Array.isArray(s.photo_urls) ? s.photo_urls : [],
    };
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { activePet } = usePet();

    const [walkData, setWalkData] = useState<WalkData>(EMPTY_WALK);
    const [walkHistory, setWalkHistory] = useState<WalkRecord[]>([]);
    const [walkStats, setWalkStats] = useState<WalkStats | null>({
        totalWalks: 0, totalDistanceKm: 0, totalDurationMinutes: 0, averageDistanceKm: 0,
        longestWalkKm: 0, currentStreak: 0, bestStreak: 0,
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [walkPhase, setWalkPhase] = useState<WalkPhase>('idle');
    const [walkIssue, setWalkIssue] = useState<WalkIssue>('none');
    const [recoverableWalk, setRecoverableWalk] = useState<RecoverableWalk | null>(null);
    const [stepsSupported] = useState(() => typeof window !== 'undefined' && sensors.isMotionSupported());

    const [autoPauseEnabled, setAutoPauseEnabledState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('moffi_auto_pause_enabled');
        return saved === null ? true : saved === 'true';
    });
    const setAutoPauseEnabled = useCallback((v: boolean) => {
        setAutoPauseEnabledState(v);
        localStorage.setItem('moffi_auto_pause_enabled', String(v));
    }, []);

    const stopWatchRef = useRef<(() => void) | null>(null);
    const staleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPosTimestampRef = useRef<number>(0);
    const lastFixAtRef = useRef<number>(0);
    const lastMovementAtRef = useRef<number>(Date.now());
    const stationarySinceRef = useRef<number | null>(null);
    const gpsErrorShownRef = useRef(false);

    // Süre: biten aktif dilimlerin toplamı + (çalışıyorsa) şu anki dilimin başlangıcı.
    const activeAccumMsRef = useRef(0);
    const segmentStartRef = useRef<number | null>(null);
    const currentActiveSeconds = () =>
        Math.floor((activeAccumMsRef.current + (segmentStartRef.current ? Date.now() - segmentStartRef.current : 0)) / 1000);
    const closeSegment = (endAt: number) => {
        if (segmentStartRef.current !== null) {
            activeAccumMsRef.current += Math.max(0, endAt - segmentStartRef.current);
            segmentStartRef.current = null;
        }
    };

    // Kabul edilen GPS noktaları burada birikir, 10 sn'de bir toplu gider; bağlantı yoksa burada bekler
    // ve yürüyüş anlık görüntüsüyle cihaza yazılır (uygulama kapansa da kaybolmaz).
    const pendingPointsRef = useRef<WalkPoint[]>([]);
    // Güncelleyici aynı noktayla iki kez çalışabilir; zaman damgası kontrolü noktanın iki kez girmesini engeller.
    const lastQueuedAtRef = useRef<number>(0);
    const flushingRef = useRef(false);
    const startingRef = useRef(false);
    const creatingSessionRef = useRef(false);
    const walkDataRef = useRef<WalkData>(EMPTY_WALK);
    useEffect(() => { walkDataRef.current = walkData; }, [walkData]);

    const queuePoint = (timestampMs: number, lat: number, lng: number) => {
        if (timestampMs <= lastQueuedAtRef.current) return;
        lastQueuedAtRef.current = timestampMs;
        pendingPointsRef.current.push({ lat, lng, timestamp: new Date(timestampMs).toISOString() });
    };

    const resetPointBuffer = (points: WalkPoint[] = []) => {
        pendingPointsRef.current = [...points];
        lastQueuedAtRef.current = points.length ? new Date(points[points.length - 1].timestamp).getTime() : 0;
    };

    // Çevrimdışı başlayan yürüyüşün sunucu kaydı, bağlantı gelince gerçek başlangıç saatiyle açılır.
    const ensureSession = useCallback(async (): Promise<string | undefined> => {
        const current = walkDataRef.current;
        if (current.sessionId) return current.sessionId;
        if (!user?.id || !device.isOnline() || creatingSessionRef.current) return undefined;
        creatingSessionRef.current = true;
        try {
            const session = await apiService.startWalk(current.petId, current.startedAt);
            walkDataRef.current = { ...walkDataRef.current, sessionId: session.id };
            setWalkData(prev => (prev.isActive && !prev.sessionId ? { ...prev, sessionId: session.id } : prev));
            return session.id;
        } catch (e) {
            console.error("Yürüyüş kaydı açılamadı, tekrar denenecek:", e);
            return undefined;
        } finally {
            creatingSessionRef.current = false;
        }
    }, [user?.id]);

    const flushPoints = useCallback(async () => {
        if (flushingRef.current || pendingPointsRef.current.length === 0 || !device.isOnline()) return;
        const sessionId = await ensureSession();
        if (!sessionId) return;
        flushingRef.current = true;
        const batch = pendingPointsRef.current.slice(0, 500);
        try {
            await apiService.appendWalkPoints(sessionId, batch);
            pendingPointsRef.current.splice(0, batch.length);
        } catch (err) {
            console.error("Yürüyüş noktaları gönderilemedi, tekrar denenecek:", err);
        } finally {
            flushingRef.current = false;
        }
    }, [ensureSession]);

    const refreshWalkData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [hist, st] = await Promise.all([
                apiService.getWalkHistory(user.id, HISTORY_LIMIT),
                apiService.getWalkStats(user.id),
            ]);
            if (Array.isArray(hist)) setWalkHistory(hist.map(mapSessionToRecord));
            if (st && st.totalDistanceKm !== undefined) setWalkStats(st);
        } catch (e) {
            console.error("Error refreshing walk data from DB:", e);
        }
    }, [user?.id]);

    // Açılışta yarım kalmış yürüyüş varsa sessizce devam ettirme; kullanıcıya sorulacak.
    useEffect(() => {
        localStorage.removeItem('moffi_walk_history'); // eski sürümlerin cihaz kopyası (başka hesaba sızıyordu)
        localStorage.removeItem('moffi_active_mode'); // eski kenar çubuğunun kapsül durumu, artık kullanılmıyor
        const savedWalk = localStorage.getItem(ACTIVE_WALK_KEY);
        if (savedWalk) {
            try {
                const parsed = JSON.parse(savedWalk);
                if (parsed.isActive) {
                    setRecoverableWalk({
                        time: parsed.time || 0,
                        distance: parsed.distance || 0,
                        path: Array.isArray(parsed.path) ? parsed.path : [],
                        sessionId: parsed.sessionId,
                        startedAt: parsed.startedAt,
                        petId: parsed.petId,
                        petName: parsed.petName,
                        realSteps: parsed.realSteps || 0,
                        splits: Array.isArray(parsed.splits) ? parsed.splits : [],
                        pendingPoints: Array.isArray(parsed.pendingPoints) ? parsed.pendingPoints : [],
                    });
                } else {
                    localStorage.removeItem(ACTIVE_WALK_KEY);
                }
            } catch (e) {
                console.error("Parse error active walk:", e);
                localStorage.removeItem(ACTIVE_WALK_KEY);
            }
        }
        setIsLoaded(true);
    }, []);

    // Hesap değişince önceki hesabın verisi ekranda kalmasın.
    useEffect(() => {
        setWalkHistory([]);
        setWalkStats({ totalWalks: 0, totalDistanceKm: 0, totalDurationMinutes: 0, averageDistanceKm: 0, longestWalkKm: 0, currentStreak: 0, bestStreak: 0 });
        if (isLoaded && user?.id) refreshWalkData();
    }, [isLoaded, user?.id, refreshWalkData]);

    // Yürüyüş anlık görüntüsü: her saniye değil, rota/durum değişince ya da 15 sn'de bir yazılır.
    // Kurtarma teklifi cevaplanmadan yazılmaz (gerçek görüntünün üstüne boş veri yazılmasın).
    const snapshotTick = Math.floor(walkData.time / 15);
    useEffect(() => {
        if (!isLoaded || recoverableWalk) return;
        if (!walkData.isActive) return;
        localStorage.setItem(ACTIVE_WALK_KEY, JSON.stringify({ ...walkData, pendingPoints: pendingPointsRef.current }));
    }, [isLoaded, recoverableWalk, walkData.isActive, walkData.isPaused, walkData.path.length, walkData.sessionId, snapshotTick]); // eslint-disable-line react-hooks/exhaustive-deps

    const beginWalk = (data: WalkData, accumulatedSeconds: number) => {
        activeAccumMsRef.current = accumulatedSeconds * 1000;
        segmentStartRef.current = Date.now();
        lastMovementAtRef.current = Date.now();
        stationarySinceRef.current = null;
        lastPosTimestampRef.current = 0;
        gpsErrorShownRef.current = false;
        walkDataRef.current = data;
        setWalkData(data);
        setWalkPhase('active');
        setWalkIssue('none');
    };

    // Yürüyüş anında başlar; sunucu kaydı arkadan açılır (bağlantı yoksa sonra, gerçek başlangıç saatiyle).
    const startWalk = async () => {
        if (startingRef.current || walkDataRef.current.isActive) return;
        startingRef.current = true;
        resetPointBuffer();
        beginWalk({
            ...EMPTY_WALK,
            isActive: true,
            startedAt: Date.now(),
            petId: activePet?.id ? String(activePet.id) : undefined,
            petName: activePet?.name,
        }, 0);
        try {
            await ensureSession();
        } finally {
            startingRef.current = false;
        }
    };

    const pauseWalk = () => {
        closeSegment(Date.now());
        setWalkData(prev => ({ ...prev, time: currentActiveSeconds(), isPaused: true, isAutoPaused: false, speed: 0 }));
        setWalkPhase('paused');
        flushPoints();
    };

    const resumeWalk = () => {
        if (segmentStartRef.current === null) segmentStartRef.current = Date.now();
        lastMovementAtRef.current = Date.now();
        setWalkData(prev => ({ ...prev, isPaused: false, isAutoPaused: false }));
        setWalkPhase('active');
    };

    const enterReadyPhase = useCallback(() => {
        setWalkPhase(prev => (prev === 'idle' ? 'ready' : prev));
    }, []);

    const exitToIdlePhase = useCallback(() => {
        setWalkPhase(prev => (prev === 'ready' || prev === 'completed' ? 'idle' : prev));
    }, []);

    const acknowledgeWalkCompletion = useCallback(() => {
        setWalkPhase(prev => (prev === 'completed' ? 'idle' : prev));
    }, []);

    const continueRecoveredWalk = useCallback(() => {
        if (!recoverableWalk) return;
        resetPointBuffer(recoverableWalk.pendingPoints || []);
        beginWalk({
            ...EMPTY_WALK,
            isActive: true,
            time: recoverableWalk.time,
            distance: recoverableWalk.distance,
            path: recoverableWalk.path,
            sessionId: recoverableWalk.sessionId,
            startedAt: recoverableWalk.startedAt,
            splits: recoverableWalk.splits || [],
            petId: recoverableWalk.petId,
            petName: recoverableWalk.petName,
            realSteps: recoverableWalk.realSteps || 0,
        }, recoverableWalk.time);
        setRecoverableWalk(null);
    }, [recoverableWalk]); // eslint-disable-line react-hooks/exhaustive-deps

    // "Burada bitir": bekleyen noktalar gönderilir, bitiş son kaydedilen konumun zamanıdır (uygulama
    // saatlerce kapalı kaldıysa o süre yürüyüşe eklenmez). Çevrimdışı başlamışsa kayıt şimdi açılır.
    const discardRecoveredWalk = useCallback(async () => {
        const rw = recoverableWalk;
        if (!rw) return;
        try {
            let sessionId = rw.sessionId;
            const points = rw.pendingPoints || [];
            if (!sessionId && user?.id && (rw.distance > 0 || points.length > 0)) {
                sessionId = (await apiService.startWalk(rw.petId, rw.startedAt)).id;
            }
            if (sessionId) {
                for (let i = 0; i + 500 < points.length; i += 500) {
                    await apiService.appendWalkPoints(sessionId, points.slice(i, i + 500));
                }
                await apiService.finishWalk(sessionId, {
                    activeSeconds: rw.time,
                    steps: rw.realSteps || 0,
                    points: points.slice(Math.floor(Math.max(0, points.length - 1) / 500) * 500),
                    endAtLastPoint: true,
                });
                await refreshWalkData();
            }
            setRecoverableWalk(null);
            localStorage.removeItem(ACTIVE_WALK_KEY);
        } catch (e) {
            console.error("Yarım kalan yürüyüş kaydedilemedi:", e);
            showToast("Yürüyüş kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.", "AlertCircle", "text-red-500");
        }
    }, [recoverableWalk, user?.id, refreshWalkData]);

    const stopWalk = async (onStage?: (stage: WalkFinishStage) => void): Promise<WalkFinishResult> => {
        const current = walkDataRef.current;
        if (!current.isActive) return { status: 'discarded' };
        setIsLoading(true);
        setWalkPhase('completing');
        closeSegment(Date.now());
        const activeSeconds = currentActiveSeconds();
        try {
            let result: WalkFinishResult = { status: 'discarded' };
            const hasContent = current.distance > 0 || current.realSteps > 0 || pendingPointsRef.current.length > 0;
            const sessionId = current.sessionId || (hasContent ? await ensureSession() : undefined);
            if (hasContent && !sessionId) {
                throw new Error(user?.id ? 'Sunucuya ulaşılamadı' : 'Giriş gerekli');
            }
            if (sessionId) {
                while (pendingPointsRef.current.length > 500) {
                    const before = pendingPointsRef.current.length;
                    await flushPoints();
                    if (pendingPointsRef.current.length === before) throw new Error('Konum noktaları gönderilemedi');
                }
                onStage?.('points');
                const row = await apiService.finishWalk(sessionId, {
                    activeSeconds,
                    steps: current.realSteps,
                    points: pendingPointsRef.current.slice(0, 500),
                });
                result = { sessionId, status: row?.status === 'completed' ? 'completed' : 'discarded' };
                onStage?.('saved');
                await refreshWalkData();
            } else {
                onStage?.('points');
                onStage?.('saved');
            }
            onStage?.('refreshed');

            resetPointBuffer();
            activeAccumMsRef.current = 0;
            segmentStartRef.current = null;
            walkDataRef.current = EMPTY_WALK;
            setWalkData(EMPTY_WALK);
            setWalkIssue('none');
            setWalkPhase('completed');
            localStorage.removeItem(ACTIVE_WALK_KEY);
            localStorage.removeItem('moffi_active_mode');
            return result;
        } catch (e) {
            // Yürüyüş silinmez: duraklatılmış hâlde kalır, kullanıcı tekrar deneyebilir.
            setWalkData(prev => ({ ...prev, time: activeSeconds, isPaused: true, isAutoPaused: false, speed: 0 }));
            setWalkPhase('paused');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const discardWalkRecord = useCallback(async (sessionId: string) => {
        await apiService.discardWalk(sessionId);
        await refreshWalkData();
    }, [refreshWalkData]);

    // Süre göstergesi: saniyede bir zaman damgalarından yeniden hesaplanır. Otomatik duraklama da
    // burada: son gerçek hareketten 25 sn geçtiyse durur ve bekleme süresi aktif süreden düşülür.
    useEffect(() => {
        if (!isLoaded || !walkData.isActive || walkData.isPaused) return;
        const timer = setInterval(() => {
            if (autoPauseEnabled && Date.now() - lastMovementAtRef.current > AUTO_PAUSE_IDLE_MS) {
                closeSegment(lastMovementAtRef.current);
                const t = currentActiveSeconds();
                setWalkData(prev => (!prev.isActive || prev.isPaused ? prev : { ...prev, time: t, isPaused: true, isAutoPaused: true, speed: 0 }));
                setWalkPhase('paused');
                return;
            }
            const t = currentActiveSeconds();
            setWalkData(prev => (prev.time === t ? prev : { ...prev, time: t }));
        }, 1000);
        return () => clearInterval(timer);
    }, [walkData.isActive, walkData.isPaused, isLoaded, autoPauseEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

    // Otomatik duraklamadan hareketle çıkıldığında süre dilimi yeniden başlar, faz 'active'e döner.
    useEffect(() => {
        if (walkData.isActive && !walkData.isPaused && segmentStartRef.current === null) {
            segmentStartRef.current = Date.now();
        }
        if (walkData.isActive && !walkData.isPaused) {
            setWalkPhase(prev => (prev === 'paused' ? 'active' : prev));
        }
    }, [walkData.isActive, walkData.isPaused]);

    // GPS: manuel duraklamada kapanır (pil), otomatik duraklamada açık kalır (hareketi görmek için).
    useEffect(() => {
        if (!isLoaded) return;
        const shouldWatchGps = walkData.isActive && (!walkData.isPaused || walkData.isAutoPaused);

        if (shouldWatchGps) {
            if (!stopWatchRef.current && geolocation.isSupported()) {
                setWalkIssue(prev => (prev === 'none' ? 'gps_searching' : prev));
                lastFixAtRef.current = Date.now();
                geolocation.permission().then(state => {
                    if (state === 'denied') setWalkIssue('location_permission_required');
                });
                staleCheckIntervalRef.current = setInterval(() => {
                    if (lastFixAtRef.current && Date.now() - lastFixAtRef.current > 15000) {
                        setWalkIssue(prev => (prev === 'location_permission_required' ? prev : 'location_lost'));
                    }
                }, 5000);

                stopWatchRef.current = geolocation.watch(
                    (fix) => {
                        lastFixAtRef.current = fix.timestamp || Date.now();
                        setWalkIssue(prev => {
                            if (prev === 'location_permission_required') return prev;
                            return fix.accuracy > 50 ? 'gps_weak' : 'none';
                        });

                        const { lat: latitude, lng: longitude, speed: gpsSpeed } = fix;
                        const newCoord: [number, number] = [latitude, longitude];
                        const fixAt = fix.timestamp || Date.now();

                        setWalkData(prev => {
                            if (prev.isPaused && !prev.isAutoPaused) return prev;

                            const currentPath = Array.isArray(prev.path) ? prev.path : [];
                            if (currentPath.length === 0) {
                                lastPosTimestampRef.current = fixAt;
                                lastMovementAtRef.current = Date.now();
                                queuePoint(fixAt, latitude, longitude);
                                return { ...prev, path: [newCoord] };
                            }

                            const lastCoord = currentPath[currentPath.length - 1];
                            const distDelta = distanceMeters(lastCoord[0], lastCoord[1], latitude, longitude);
                            const timeDeltaMs = fixAt - lastPosTimestampRef.current;
                            const calcSpeedKmH = timeDeltaMs > 0 && lastPosTimestampRef.current > 0
                                ? (distDelta / (timeDeltaMs / 1000)) * 3.6 : 0;
                            // Gürültü tabanı GPS'in kendi doğruluk yarıçapı (en az 8 m); 25 km/sa üstü sıçrama sayılmaz.
                            const noiseFloorMeters = Math.max(fix.accuracy || 15, 8);
                            const isRealMovement = distDelta > noiseFloorMeters && calcSpeedKmH < 25;

                            if (!isRealMovement) {
                                if (stationarySinceRef.current === null) stationarySinceRef.current = Date.now();
                                return prev.speed === 0 ? prev : { ...prev, speed: 0 };
                            }

                            lastPosTimestampRef.current = fixAt;
                            lastMovementAtRef.current = Date.now();
                            queuePoint(fixAt, latitude, longitude);
                            const newDistance = (prev.distance || 0) + distDelta;
                            const speed = gpsSpeed && gpsSpeed > 0 ? gpsSpeed * 3.6 : calcSpeedKmH;

                            if (prev.isAutoPaused) {
                                stationarySinceRef.current = null;
                                return { ...prev, isPaused: false, isAutoPaused: false, path: [...currentPath, newCoord], distance: newDistance, speed };
                            }

                            // 8-25 sn arası kısa duruş = durma/koklama molası
                            let sniffStops = prev.sniffStops || 0;
                            if (stationarySinceRef.current !== null) {
                                const stillMs = Date.now() - stationarySinceRef.current;
                                if (stillMs >= 8000 && stillMs < AUTO_PAUSE_IDLE_MS) sniffStops += 1;
                                stationarySinceRef.current = null;
                            }

                            let splits = prev.splits;
                            if (Math.floor(newDistance / 1000) > Math.floor((prev.distance || 0) / 1000)) {
                                const prevCumulative = prev.splits.length > 0 ? prev.splits[prev.splits.length - 1].cumulativeSeconds : 0;
                                splits = [...prev.splits, { km: Math.floor(newDistance / 1000), splitSeconds: prev.time - prevCumulative, cumulativeSeconds: prev.time }];
                            }

                            return { ...prev, path: [...currentPath, newCoord], distance: newDistance, speed, splits, sniffStops };
                        });
                    },
                    (err) => {
                        console.error("GPS Watch Position Error:", err);
                        if (err.code === 'denied') setWalkIssue('location_permission_required');
                        else if (err.code === 'unavailable') setWalkIssue('location_lost');
                        else setWalkIssue(prev => (prev === 'location_permission_required' ? prev : 'gps_searching'));
                        if (!gpsErrorShownRef.current) {
                            gpsErrorShownRef.current = true;
                            showToast(
                                err.code === 'denied'
                                    ? "Konum izni kapalı. Yürüyüşün kaydedilmesi için ayarlardan Moffi'ye konum izni ver."
                                    : "Konum alınamıyor. Açık alanda birkaç saniye bekle; yürüyüş sürüyor.",
                                "AlertCircle", "text-red-500");
                        }
                    },
                    { highAccuracy: true, background: true }
                );
            }
        } else {
            if (stopWatchRef.current) { stopWatchRef.current(); stopWatchRef.current = null; }
            if (staleCheckIntervalRef.current) { clearInterval(staleCheckIntervalRef.current); staleCheckIntervalRef.current = null; }
            setWalkIssue('none');
        }

        return () => {
            if (stopWatchRef.current) { stopWatchRef.current(); stopWatchRef.current = null; }
            if (staleCheckIntervalRef.current) { clearInterval(staleCheckIntervalRef.current); staleCheckIntervalRef.current = null; }
        };
    }, [walkData.isActive, walkData.isPaused, walkData.isAutoPaused, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pedometre (ivmeölçer, GPS'ten bağımsız). Sabit eşik (1.15 m/s²) + histerezis + 300-2000 ms adım
    // aralığı + 4'lü ritim onayı: sallama/tek darbe sayılmaz. Adaptif eşik kısır döngüye giriyor, kullanma
    // (bkz. CLAUDE.md 8.19-8.20).
    useEffect(() => {
        const shouldTrackSteps = walkData.isActive && (!walkData.isPaused || walkData.isAutoPaused);
        if (!shouldTrackSteps || !sensors.isMotionSupported()) return;

        let filteredMagnitude = 9.81;
        let awaitingValley = false;
        let lastPeakAt = 0;
        let lastIntervalMs = 0;
        let consistentStreak = 0;

        const ALPHA = 0.9;
        const STEP_THRESHOLD = 1.15;
        const VALLEY_THRESHOLD = STEP_THRESHOLD * 0.4;
        const MIN_STEP_INTERVAL_MS = 300;
        const MAX_STEP_INTERVAL_MS = 2000;
        const INTERVAL_TOLERANCE = 0.35;
        const REQUIRED_CONSISTENT_PEAKS = 4;

        const handleMotion = (acc: sensors.MotionSample) => {
            const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
            const deviation = Math.abs(magnitude - filteredMagnitude);
            if (deviation < STEP_THRESHOLD) {
                filteredMagnitude = ALPHA * filteredMagnitude + (1 - ALPHA) * magnitude;
            }
            const now = Date.now();
            if (!awaitingValley && deviation > STEP_THRESHOLD) {
                awaitingValley = true;
                const interval = lastPeakAt > 0 ? now - lastPeakAt : 0;
                lastPeakAt = now;
                const isPlausibleCadence = interval >= MIN_STEP_INTERVAL_MS && interval <= MAX_STEP_INTERVAL_MS;
                const isConsistentWithLast = lastIntervalMs > 0 && Math.abs(interval - lastIntervalMs) / lastIntervalMs <= INTERVAL_TOLERANCE;
                if (isPlausibleCadence && (consistentStreak === 0 || isConsistentWithLast)) {
                    consistentStreak += 1;
                    lastIntervalMs = interval;
                } else {
                    consistentStreak = isPlausibleCadence ? 1 : 0;
                    lastIntervalMs = isPlausibleCadence ? interval : 0;
                }
                if (consistentStreak >= REQUIRED_CONSISTENT_PEAKS) {
                    lastMovementAtRef.current = now;
                    stationarySinceRef.current = null;
                    setWalkData(prev => {
                        if (!prev.isActive || (prev.isPaused && !prev.isAutoPaused)) return prev;
                        const next = { ...prev, realSteps: prev.realSteps + 1 };
                        if (prev.isAutoPaused) { next.isPaused = false; next.isAutoPaused = false; }
                        return next;
                    });
                }
            } else if (awaitingValley && deviation < VALLEY_THRESHOLD) {
                awaitingValley = false;
            }
        };

        // İzin asıl olarak "Yürüyüşe Başla" dokunuşunda istenir (iOS); burası güvenlik ağı
        let cancelled = false;
        let stop: () => void = () => {};
        sensors.requestPermission().then(ok => { if (ok && !cancelled) stop = sensors.onMotion(handleMotion); });
        return () => { cancelled = true; stop(); };
    }, [walkData.isActive, walkData.isPaused, walkData.isAutoPaused]);

    // Biriken noktalar 10 sn'de bir gider; bağlantı gelince hemen.
    useEffect(() => {
        if (!walkData.isActive) return;
        const timer = setInterval(() => flushPoints(), 10000);
        return () => clearInterval(timer);
    }, [walkData.isActive, flushPoints]);

    useEffect(() => {
        return device.onNetworkChange(online => {
            if (online) {
                setWalkIssue(prev => (prev === 'network_unavailable' ? 'none' : prev));
                flushPoints();
            } else if (walkDataRef.current.isActive && !walkDataRef.current.isPaused) {
                setWalkIssue(prev => (prev === 'none' || prev === 'gps_weak' ? 'network_unavailable' : prev));
            }
        });
    }, [flushPoints]);

    // Tarayıcıda sekme arka plana geçince GPS kısıtlanabilir; telefon uygulamasında takip sürer.
    useEffect(() => {
        if (geolocation.supportsBackground()) return;
        return device.onForegroundChange(inForeground => {
            if (!inForeground && walkData.isActive && !walkData.isPaused) {
                setWalkIssue(prev => (prev === 'none' || prev === 'gps_weak' ? 'background_permission_required' : prev));
            } else if (inForeground) {
                setWalkIssue(prev => (prev === 'background_permission_required' ? 'none' : prev));
            }
        });
    }, [walkData.isActive, walkData.isPaused]);

    return (
        <ActivityContext.Provider value={{
            walkData, walkHistory, walkStats, startWalk, pauseWalk, resumeWalk, stopWalk, discardWalkRecord,
            isLoading,
            refreshWalkData,
            walkPhase, walkIssue, recoverableWalk,
            continueRecoveredWalk, discardRecoveredWalk, acknowledgeWalkCompletion,
            enterReadyPhase, exitToIdlePhase,
            autoPauseEnabled, setAutoPauseEnabled,
            stepsSupported,
        }}>
            {children}
        </ActivityContext.Provider>
    );
}

export function useActivity() {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
}
