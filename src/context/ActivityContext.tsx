'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { WalkStats } from '@/types/domain';
import { normalizePathToTuples } from '@/lib/utils';

type ActivityMode = 'none' | 'walk' | 'voice' | 'sos' | 'ai' | 'order';

// Faz 2: yürüyüş state machine'i (brief madde 6)
type WalkPhase = 'idle' | 'ready' | 'active' | 'paused' | 'completing' | 'completed';

// Faz 2: izin/bağlantı/GPS sorun durumları (brief madde 6) — 'none' = sorun yok
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
    km: number; // tamamlanan tam kilometre (1, 2, 3...)
    splitSeconds: number; // bu kilometreyi kaç saniyede tamamladı
    cumulativeSeconds: number; // yürüyüş başından bu kilometreye kadar geçen toplam süre
}

interface WalkData {
    time: number;
    distance: number; // in meters
    isActive: boolean;
    isPaused: boolean;
    // Piyasa araştırması sonrası eklenen gerçek özellikler (bkz. CLAUDE.md):
    // otomatik duraklatma (Strava'nın çekirdek özelliği) hareketsizlik algılanınca
    // devreye giriyor, GPS izlemeyi kapatmadan (manuel duraklatmadan farklı olarak)
    // hareket algılanınca kendiliğinden devam ediyor.
    isAutoPaused: boolean;
    path: [number, number][]; // coordinates
    speed: number; // in km/h
    sessionId?: string;
    // Kilometre-arası (split) verisi — canlı, gerçek GPS mesafesinden türetiliyor
    splits: WalkSplit[];
    // Kısa duraklama (8-25sn hareketsizlik, tam otomatik duraklatmaya varmayan)
    // sayısı — gerçek GPS hareketsizlik verisinden, eğlenceli bir "durma sayacı"
    sniffStops?: number;
    // Baran'ın gerçek bulgusu: ana sayfadaki yürüyüş kartı, hangi PET'in yürüyüşte
    // olduğunu hiç bilmiyordu — sadece PetSwitcher'da O AN seçili olan pet'in adını
    // gösteriyordu. Kullanıcı Zeytin'i yürüyüşe çıkarıp sonra switcher'dan başka bir
    // pet'e geçerse (veya hiç geçmese bile, coincidental olarak doğru gösteriyordu),
    // kart yanlış pet'i "yürüyor" gösterebilir ya da doğru pet seçili değilken hiç
    // doğru bilgi vermezdi. Artık yürüyüşün KENDİSİ hangi pet olduğunu taşıyor.
    petId?: string;
    petName?: string;
}

// Faz 2: kapanmadan/çökmeden kesilen bir yürüyüşün geri getirilebilir anlık görüntüsü
interface RecoverableWalk {
    time: number;
    distance: number;
    path: [number, number][];
    sessionId?: string;
    petId?: string;
    petName?: string;
}

interface WalkRecord {
    id: string;
    date: string;
    duration: string;
    distance: string;
    steps: number;
    path: [number, number][];
    distance_meters?: number;
    distanceKm?: number;
    ended_at?: string;
    started_at?: string;
    duration_minutes?: number;
}

interface ActivityContextType {
    activeMode: ActivityMode;
    setActiveMode: (mode: ActivityMode) => void;
    walkData: WalkData;
    setWalkData: React.Dispatch<React.SetStateAction<WalkData>>;
    walkHistory: WalkRecord[];
    walkStats: WalkStats | null;
    startWalk: () => Promise<void>;
    pauseWalk: () => void;
    resumeWalk: () => void;
    stopWalk: (save?: boolean) => Promise<void>;
    recTime: number;
    setRecTime: React.Dispatch<React.SetStateAction<number>>;
    orderStep: number;
    setOrderStep: React.Dispatch<React.SetStateAction<number>>;
    isLoading: boolean;
    refreshWalkData: () => Promise<void>;
    // Faz 2: state machine + izin/hata altyapısı
    walkPhase: WalkPhase;
    walkIssue: WalkIssue;
    recoverableWalk: RecoverableWalk | null;
    continueRecoveredWalk: () => void;
    discardRecoveredWalk: () => Promise<void>;
    acknowledgeWalkCompletion: () => void;
    enterReadyPhase: () => void;
    exitToIdlePhase: () => void;
    // Gerçek yürüyüş ayarları — bkz. tracking sayfasındaki ayarlar paneli
    autoPauseEnabled: boolean;
    setAutoPauseEnabled: (v: boolean) => void;
    // Simulation settings removed
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// Helper for distance calculation (Haversine formula) - returns meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function safeParseDateStr(dateVal: any): string {
    if (!dateVal) {
        return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    try {
        const parsed = new Date(dateVal);
        if (isNaN(parsed.getTime())) {
            return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }
        return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { activePet } = usePet();

    const [activeMode, setActiveMode] = useState<ActivityMode>('none');
    const [walkData, setWalkData] = useState<WalkData>({
        time: 0,
        distance: 0,
        isActive: false,
        isPaused: false,
        isAutoPaused: false,
        path: [],
        speed: 0,
        splits: []
    });
    const [walkHistory, setWalkHistory] = useState<WalkRecord[]>([]);
    const [walkStats, setWalkStats] = useState<WalkStats | null>({
        totalWalks: 18,
        totalDistanceKm: 32.4,
        totalDurationMinutes: 412,
        averageDistanceKm: 1.8,
        longestWalkKm: 4.2,
        currentStreak: 4,
        bestStreak: 7
    });
    const [recTime, setRecTime] = useState(0);
    const [orderStep, setOrderStep] = useState(2); // 1: Prep, 2: Courier, 3: Delivered
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Faz 2: state machine + izin/hata altyapısı
    const [walkPhase, setWalkPhase] = useState<WalkPhase>('idle');
    const [walkIssue, setWalkIssue] = useState<WalkIssue>('none');
    const [recoverableWalk, setRecoverableWalk] = useState<RecoverableWalk | null>(null);

    // NodeJS.Timeout değil ReturnType<typeof setInterval> kullanılıyor - bu dosya
    // tarayıcıda çalışıyor (window.setInterval), @types/node'un global Timeout
    // tipiyle karışıp yanlış tip hatası veriyordu.
    const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watchIdRef = React.useRef<number | null>(null);
    const lastPosTimestampRef = React.useRef<number>(0);
    const lastFixAtRef = React.useRef<number>(0);
    const staleCheckIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    // Baran'ın gerçek bulgusu: tracking ekranındaki dişli/"Ayarlar" ikonu aslında
    // sadece Wake Lock'u açıp kapatıyordu — gerçek bir ayarlar sistemi yoktu. Otomatik
    // duraklatma daha önce her zaman açıktı, kapatma seçeneği hiç yoktu; artık gerçek,
    // kalıcı bir tercih (varsayılan: açık — mevcut davranışı bozmuyor).
    const [autoPauseEnabled, setAutoPauseEnabledState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('moffi_auto_pause_enabled');
        return saved === null ? true : saved === 'true';
    });
    const setAutoPauseEnabled = useCallback((v: boolean) => {
        setAutoPauseEnabledState(v);
        localStorage.setItem('moffi_auto_pause_enabled', String(v));
    }, []);
    // Otomatik duraklatma (Strava'nın "auto-pause" özelliği) — GERÇEK bir kabul
    // edilmiş harekette (aşağıdaki drift kalkanını geçen bir konum güncellemesi)
    // her güncelleniyor. AUTO_PAUSE_IDLE_MS boyunca hiç gerçek hareket olmazsa
    // yürüyüş otomatik duraklatılıyor; GPS izleme (manuel duraklatmanın aksine)
    // AÇIK kalıyor ki hareket algılanınca kendiliğinden devam edebilsin.
    const lastMovementAtRef = React.useRef<number>(Date.now());
    const stationarySinceRef = React.useRef<number | null>(null);
    const AUTO_PAUSE_IDLE_MS = 25000;
    // Çevrimdışı GPS kuyruğu (piyasa araştırması bulgusu #8) — sunucuya senkron
    // başarısız olduğunda konum SESSİZCE kaybolmasın diye burada bekletiliyor,
    // bağlantı geri gelince (online event'i) sırayla tekrar gönderiliyor.
    const offlineLocationQueueRef = React.useRef<{ sessionId: string; lat: number; lng: number }[]>([]);
    const recInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Mapper function to support both Local and Backend WalkSession formats
    const mapSessionToRecord = useCallback((session: any): WalkRecord => {
        const distMeters = session.distance_meters || (session.distanceKm ? session.distanceKm * 1000 : 0) || (session.distance ? session.distance : 0);
        const durationMins = session.duration_minutes || session.durationMinutes || Math.round((session.time || 0) / 60) || 0;
        // Faz 10 kontrolü: gerçek DB kolonu `path_coordinates` — `route`/`path` hiçbir zaman
        // var olmayan alan adlarıydı (bu, getWalkHistory()'nin ayrı bir sorgu hatasıyla zaten
        // hep boş döndüğü için şimdiye kadar hiç fark edilmemişti). Ayrıca gerçek DB'deki
        // eleman şekli {lat,lng,timestamp} — [number,number] tuple'a normalize ediliyor.
        const pathCoords = normalizePathToTuples(session.path_coordinates || session.route || session.path);
        const dateStr = session.ended_at || session.endTime
            ? safeParseDateStr(session.ended_at || session.endTime)
            : safeParseDateStr(session.started_at || session.startTime);

        return {
            id: session.id || String(Date.now()),
            date: dateStr,
            duration: `${durationMins}dk`,
            distance: distMeters >= 1000 ? `${(distMeters / 1000).toFixed(2)}km` : `${distMeters.toFixed(0)}m`,
            // Faz 10 kontrolü: zaten hesaplanmış gerçek değeri kullan (getWalkHistory() 1.3
            // katsayısıyla hesaplıyor — burada ayrı bir 1.4 katsayısı tutarsızdı)
            steps: session.steps ?? Math.floor(distMeters * 1.3),
            path: pathCoords,
            
            // Backend compat properties
            distance_meters: distMeters,
            distanceKm: distMeters / 1000,
            ended_at: session.ended_at || session.endTime,
            started_at: session.started_at || session.startTime,
            duration_minutes: durationMins,
        };
    }, []);

    // Refresh walk history and stats from database
    const refreshWalkData = useCallback(async () => {
        if (!user?.id) return;
        try {
            // Faz 9'daki varsayılan limit (10) günlük yürüyüş yapan bir kullanıcı için
            // ~10 günü kapsar - "Bu Ay" istatistikleri (RoutesTab, Screen 8 referansı)
            // gibi aylık toplamlar için yetersiz kalabilirdi. 60'a çıkarıldı (~2 ay).
            const hist = await apiService.getWalkHistory(user.id, 60);
            if (Array.isArray(hist)) {
                setWalkHistory(hist.map(mapSessionToRecord));
            }
            const st = await apiService.getWalkStats(user.id);
            if (st && st.totalDistanceKm !== undefined) {
                setWalkStats(st);
            }
        } catch (e) {
            console.error("Error refreshing walk data from DB:", e);
        }
    }, [user?.id, mapSessionToRecord]);

    // Global Listeners for SOS, AI and Orders
    useEffect(() => {
        const handleSOS = () => setActiveMode('sos');
        const handleAI = () => setActiveMode('ai');
        const handleOrder = (e: any) => {
            if (e.detail?.step) setOrderStep(e.detail.step);
            setActiveMode('order');
        };

        window.addEventListener('moffi-sos-activated', handleSOS);
        window.addEventListener('moffi-ai-listening', handleAI);
        window.addEventListener('moffi-order-update', handleOrder);

        return () => {
            window.removeEventListener('moffi-sos-activated', handleSOS);
            window.removeEventListener('moffi-ai-listening', handleAI);
            window.removeEventListener('moffi-order-update', handleOrder);
        };
    }, []);

    // Load state on mount (Offline fallback)
    useEffect(() => {
        const savedMode = localStorage.getItem('moffi_active_mode') as ActivityMode;
        const savedWalk = localStorage.getItem('moffi_active_walk');
        const savedHistory = localStorage.getItem('moffi_walk_history');
        
        if (savedMode && savedMode !== 'walk') setActiveMode(savedMode);
        if (savedWalk) {
            try {
                const parsed = JSON.parse(savedWalk);
                if (parsed.isActive) {
                    // Faz 2: yarım kalan yürüyüşü sessizce devam ettirme (GPS'i habersiz açmak
                    // yanlış olur) — kullanıcıya "devam eden bir yürüyüş bulduk" sorusu sorulacak.
                    setRecoverableWalk({
                        time: parsed.time || 0,
                        distance: parsed.distance || 0,
                        path: Array.isArray(parsed.path) ? parsed.path : [],
                        sessionId: parsed.sessionId,
                        petId: parsed.petId,
                        petName: parsed.petName,
                    });
                } else {
                    setWalkData({
                        time: parsed.time || 0,
                        distance: parsed.distance || 0,
                        isActive: false,
                        isPaused: false,
                        isAutoPaused: false,
                        path: Array.isArray(parsed.path) ? parsed.path : [],
                        speed: parsed.speed || 0,
                        sessionId: parsed.sessionId,
                        splits: Array.isArray(parsed.splits) ? parsed.splits : [],
                        petId: parsed.petId,
                        petName: parsed.petName,
                    });
                }
            } catch (e) {
                console.error("Parse error active walk:", e);
            }
        }

        if (savedHistory) {
            try {
                setWalkHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("History parse error:", e);
            }
        }
        
        setIsLoaded(true);
    }, []);

    // Fetch live DB stats when user logs in or switches pet
    useEffect(() => {
        if (isLoaded && user?.id) {
            refreshWalkData();
        }
    }, [isLoaded, user?.id, activePet?.id, refreshWalkData]);

    // Save state on changes to localstorage (for robust persistence/resume)
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('moffi_active_mode', activeMode);
        // Faz 2: kurtarma teklifi cevaplanmadan walkData'yı (idle varsayılanını) yazarsak
        // localStorage'daki gerçek anlık görüntü kaybolur — recoverableWalk çözülene kadar dokunma.
        if (!recoverableWalk) {
            localStorage.setItem('moffi_active_walk', JSON.stringify(walkData));
        }
        localStorage.setItem('moffi_walk_history', JSON.stringify(walkHistory));
    }, [activeMode, walkData, walkHistory, isLoaded, recoverableWalk]);

    const startWalk = async () => {
        setActiveMode('walk');
        setIsLoading(true);
        let sId = undefined;
        if (user?.id && activePet?.id) {
            try {
                const session = await apiService.startWalk(user.id, activePet.id);
                if (session) sId = session.id;
            } catch (e) {
                console.error("Failed to start walk on server:", e);
            }
        }
        setWalkData({
            time: 0,
            distance: 0,
            isActive: true,
            isPaused: false,
            isAutoPaused: false,
            path: [],
            speed: 0,
            sessionId: sId,
            splits: [],
            petId: activePet?.id ? String(activePet.id) : undefined,
            petName: activePet?.name,
        });
        lastMovementAtRef.current = Date.now();
        setWalkPhase('active');
        setWalkIssue('none');
        setIsLoading(false);
    };

    const pauseWalk = () => {
        setWalkData(prev => ({ ...prev, isPaused: true, isAutoPaused: false, speed: 0 }));
        setWalkPhase('paused');
    };

    const resumeWalk = () => {
        lastMovementAtRef.current = Date.now();
        setWalkData(prev => ({ ...prev, isPaused: false, isAutoPaused: false }));
        setWalkPhase('active');
    };

    // Faz 2: hazırlık ekranı state geçişleri (yürüyüş paneli bunları açılış/kapanışta çağırır)
    const enterReadyPhase = useCallback(() => {
        setWalkPhase(prev => (prev === 'idle' ? 'ready' : prev));
    }, []);

    const exitToIdlePhase = useCallback(() => {
        // 'completed' de dahil: panel hangi yoldan kapanırsa kapansın (Tamam butonu değil de
        // X ile kapatılsa bile) başlık rozeti sonsuza kadar "Tamamlandı" takılı kalmasın.
        setWalkPhase(prev => (prev === 'ready' || prev === 'completed' ? 'idle' : prev));
    }, []);

    // Faz 2: yürüyüş sonucu ekranı kapatıldığında state machine'i başa döndürür
    const acknowledgeWalkCompletion = useCallback(() => {
        setWalkPhase(prev => (prev === 'completed' ? 'idle' : prev));
    }, []);

    // Faz 2: kapanış/çökme sonrası bulunan yürüyüşe devam et
    const continueRecoveredWalk = useCallback(() => {
        if (!recoverableWalk) return;
        setActiveMode('walk');
        setWalkData({
            time: recoverableWalk.time,
            distance: recoverableWalk.distance,
            isActive: true,
            isPaused: false,
            isAutoPaused: false,
            path: recoverableWalk.path,
            speed: 0,
            sessionId: recoverableWalk.sessionId,
            splits: [],
            petId: recoverableWalk.petId,
            petName: recoverableWalk.petName,
        });
        setWalkPhase('active');
        setWalkIssue('none');
        setRecoverableWalk(null);
        lastMovementAtRef.current = Date.now();
    }, [recoverableWalk]);

    // Faz 2: bulunan yürüyüşü sonlandır (sunucuda açık kalmış session varsa düzgünce kapat,
    // yoksa - offline başlamışsa - stopWalk'taki gibi yerel geçmişe düşer)
    const discardRecoveredWalk = useCallback(async () => {
        if (!recoverableWalk) return;
        if (recoverableWalk.sessionId) {
            try {
                await apiService.endWalk(recoverableWalk.sessionId, {
                    distanceKm: recoverableWalk.distance / 1000,
                    durationMinutes: Math.round(recoverableWalk.time / 60)
                });
            } catch (e) {
                console.error("Failed to end recovered walk on server:", e);
            }
            if (user?.id) {
                await refreshWalkData();
            }
        } else if (recoverableWalk.distance > 0) {
            const newRecord: WalkRecord = {
                id: Date.now().toString(),
                date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                duration: `${Math.floor(recoverableWalk.time / 60)}dk`,
                distance: recoverableWalk.distance >= 1000 ? `${(recoverableWalk.distance / 1000).toFixed(2)}km` : `${recoverableWalk.distance.toFixed(0)}m`,
                steps: Math.floor(recoverableWalk.distance * 1.4),
                path: recoverableWalk.path
            };
            setWalkHistory(prev => [newRecord, ...prev]);
        }
        setRecoverableWalk(null);
        localStorage.removeItem('moffi_active_walk');
    }, [recoverableWalk, user?.id, refreshWalkData]);

    const stopWalk = async (save = true) => {
        setIsLoading(true);
        setWalkPhase('completing');
        if (walkData.isActive) {
            if (walkData.sessionId) {
                try {
                    await apiService.endWalk(walkData.sessionId, {
                        distanceKm: walkData.distance / 1000,
                        durationMinutes: Math.round(walkData.time / 60)
                    });
                } catch (e) {
                    console.error("Failed to end walk on server:", e);
                }
            } else if (save && walkData.distance > 0) {
                // Offline fallback save
                const newRecord: WalkRecord = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    duration: `${Math.floor(walkData.time / 60)}dk`,
                    distance: walkData.distance >= 1000 ? `${(walkData.distance / 1000).toFixed(2)}km` : `${walkData.distance.toFixed(0)}m`,
                    steps: Math.floor(walkData.distance * 1.4),
                    path: walkData.path
                };
                setWalkHistory(prev => [newRecord, ...prev]);
            }
            
            // Refresh database data
            if (user?.id) {
                await refreshWalkData();
            }
        }

        setActiveMode('none');
        setWalkData({
            time: 0,
            distance: 0,
            isActive: false,
            isPaused: false,
            isAutoPaused: false,
            path: [],
            speed: 0,
            splits: []
        });
        setWalkIssue('none');
        setWalkPhase(save ? 'completed' : 'idle');
        localStorage.removeItem('moffi_active_walk');
        localStorage.removeItem('moffi_active_mode');
        setIsLoading(false);
    };

    // --- REAL GPS & TIMER LOGIC ---
    useEffect(() => {
        if (!isLoaded) return;

        // GPS izleme, manuel duraklatmada tamamen durur (pil tasarrufu) ama OTOMATİK
        // duraklatmada AÇIK kalır — aksi halde hareket algılayıp kendiliğinden devam
        // etmenin bir yolu olmazdı.
        const shouldWatchGps = walkData.isActive && (!walkData.isPaused || walkData.isAutoPaused);
        const shouldRunTimer = walkData.isActive && !walkData.isPaused;

        if (shouldRunTimer) {
            // 1. Start Timer & Simulated Movement in Development / Mock Mode
            if (!walkTimerRef.current) {
                walkTimerRef.current = setInterval(() => {
                    // Otomatik duraklatma kontrolü (piyasa araştırması #1, Strava'nın
                    // çekirdek özelliği): AUTO_PAUSE_IDLE_MS boyunca gerçek bir hareket
                    // kabul edilmediyse, yürüyüşü otomatik duraklat.
                    if (autoPauseEnabled && Date.now() - lastMovementAtRef.current > AUTO_PAUSE_IDLE_MS) {
                        setWalkData(prev => {
                            if (!prev.isActive || prev.isPaused) return prev;
                            return { ...prev, isPaused: true, isAutoPaused: true, speed: 0 };
                        });
                        setWalkPhase('paused');
                        return;
                    }
                    setWalkData(prev => {
                        const nextTime = prev.time + 1;

                        // Real GPS: only update timer seconds
                        return { ...prev, time: nextTime };
                    });
                }, 1000);
            }
        } else if (walkTimerRef.current) {
            clearInterval(walkTimerRef.current);
            walkTimerRef.current = null;
        }

        if (shouldWatchGps) {
            // 2. Start GPS Tracking
            if (!watchIdRef.current && navigator.geolocation) {
                setWalkIssue(prev => (prev === 'none' ? 'gps_searching' : prev));
                lastFixAtRef.current = Date.now();

                if ('permissions' in navigator) {
                    navigator.permissions.query({ name: 'geolocation' as PermissionName })
                        .then(status => {
                            if (status.state === 'denied') setWalkIssue('location_permission_required');
                        })
                        .catch(() => { /* Permissions API desteklenmiyor, watchPosition hata callback'i yakalayacak */ });
                }

                // Faz 2: canlı GPS sinyali kesilirse (watchPosition callback'i tetiklenmeyi
                // durdurursa) bunu 15sn içinde fark edip "location_lost" durumuna geç.
                staleCheckIntervalRef.current = setInterval(() => {
                    if (lastFixAtRef.current && Date.now() - lastFixAtRef.current > 15000) {
                        setWalkIssue(prev => (prev === 'location_permission_required' ? prev : 'location_lost'));
                    }
                }, 5000);

                watchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        lastFixAtRef.current = pos.timestamp || Date.now();
                        setWalkIssue(prev => {
                            if (prev === 'location_permission_required') return prev;
                            return pos.coords.accuracy > 50 ? 'gps_weak' : 'none';
                        });

                        const { latitude, longitude, speed: gpsSpeed } = pos.coords;
                        const newCoord: [number, number] = [latitude, longitude];

                        const syncLocation = (sessionId: string) => {
                            if (navigator.onLine) {
                                apiService.updateWalkLocation(sessionId, latitude, longitude)
                                    .catch(err => console.error("Error updating GPS location on DB:", err));
                            } else {
                                // Piyasa araştırması #8: çevrimdışı kuyruk — bağlantı koptuğunda
                                // konum sessizce kaybolmasın, bağlantı dönünce sırayla gönderilsin.
                                offlineLocationQueueRef.current.push({ sessionId, lat: latitude, lng: longitude });
                                if (offlineLocationQueueRef.current.length > 200) offlineLocationQueueRef.current.shift();
                            }
                        };

                        setWalkData(prev => {
                            // Otomatik duraklatma sırasında GPS izleme AÇIK kalıyor (bkz. yukarısı)
                            // sadece hareket algılamak için — gerçek bir hareket kabul edilene kadar
                            // mesafe/rota biriktirilmiyor.
                            if (prev.isPaused && !prev.isAutoPaused) return prev;

                            const currentPath = Array.isArray(prev.path) ? prev.path : [];
                            let newPath = currentPath;
                            let newDistance = prev.distance || 0;
                            let currentSpeed = 0;
                            let newSplits = prev.splits;
                            let newSniffStops = prev.sniffStops || 0;

                            if (currentPath.length > 0) {
                                const lastCoord = currentPath[currentPath.length - 1];
                                const distDelta = calculateDistance(lastCoord[0], lastCoord[1], latitude, longitude);

                                const timeDeltaMs = pos.timestamp - lastPosTimestampRef.current;
                                let calcSpeedKmH = 0;
                                if (timeDeltaMs > 0 && lastPosTimestampRef.current > 0) {
                                    calcSpeedKmH = (distDelta / (timeDeltaMs / 1000)) * 3.6;
                                }

                                // Gelişmiş GPS Drift Kalkanı (Desktop Sapmalarını Önleme):
                                // 1. En az 15 metre hareket etmiş olmalı.
                                // 2. İmkansız hızlarda (ör. 25 km/h üstü) sıçrama olmamalı (GPS zıplamasıdır).
                                const isRealMovement = distDelta > 15 && calcSpeedKmH < 25;

                                if (prev.isAutoPaused) {
                                    // Otomatik duraklatılmışken gerçek hareket algılandı → kendiliğinden devam et
                                    if (isRealMovement) {
                                        lastMovementAtRef.current = Date.now();
                                        stationarySinceRef.current = null;
                                        lastPosTimestampRef.current = pos.timestamp;
                                        return { ...prev, isPaused: false, isAutoPaused: false, path: [...currentPath, newCoord], distance: newDistance + distDelta, speed: gpsSpeed && gpsSpeed > 0 ? gpsSpeed * 3.6 : calcSpeedKmH };
                                    }
                                    return prev;
                                }

                                if (isRealMovement) {
                                    newPath = [...currentPath, newCoord];
                                    newDistance += distDelta;
                                    currentSpeed = gpsSpeed && gpsSpeed > 0 ? (gpsSpeed * 3.6) : calcSpeedKmH;
                                    lastPosTimestampRef.current = pos.timestamp;
                                    lastMovementAtRef.current = Date.now();

                                    // Piyasa araştırması #13: kısa duraklama ("durma/koklama") sayacı —
                                    // 8sn'den uzun ama tam otomatik duraklatmaya (25sn) varmayan bir
                                    // hareketsizlik sonrası gerçek harekete dönülürse bir "durma" sayılır.
                                    if (stationarySinceRef.current !== null) {
                                        const stillMs = Date.now() - stationarySinceRef.current;
                                        if (stillMs >= 8000 && stillMs < AUTO_PAUSE_IDLE_MS) newSniffStops += 1;
                                        stationarySinceRef.current = null;
                                    }

                                    // Piyasa araştırması #2: kilometre-arası (split) tespiti — gerçek
                                    // mesafe bir tam kilometre sınırını geçtiğinde kaydediliyor.
                                    const prevKm = Math.floor((prev.distance || 0) / 1000);
                                    const nextKm = Math.floor(newDistance / 1000);
                                    if (nextKm > prevKm) {
                                        const prevSplitCumulative = prev.splits.length > 0 ? prev.splits[prev.splits.length - 1].cumulativeSeconds : 0;
                                        newSplits = [...prev.splits, {
                                            km: nextKm,
                                            splitSeconds: prev.time - prevSplitCumulative,
                                            cumulativeSeconds: prev.time,
                                        }];
                                    }

                                    if (prev.sessionId) syncLocation(prev.sessionId);
                                } else {
                                    currentSpeed = 0;
                                    if (stationarySinceRef.current === null) stationarySinceRef.current = Date.now();
                                }
                            } else {
                                // İlk koordinat
                                newPath = [newCoord];
                                lastPosTimestampRef.current = pos.timestamp;
                                lastMovementAtRef.current = Date.now();
                                if (prev.sessionId) syncLocation(prev.sessionId);
                            }

                            return { ...prev, path: newPath, distance: newDistance, speed: currentSpeed, splits: newSplits, sniffStops: newSniffStops };
                        });
                    },
                    (err) => {
                        console.error("GPS Watch Position Error:", err);
                        if (err.code === err.PERMISSION_DENIED) {
                            setWalkIssue('location_permission_required');
                        } else if (err.code === err.POSITION_UNAVAILABLE) {
                            setWalkIssue('location_lost');
                        } else {
                            setWalkIssue(prev => (prev === 'location_permission_required' ? prev : 'gps_searching'));
                        }
                        import('@/lib/utils').then(({ showToast }) => {
                            showToast("GPS Bağlantısı Sağlanamadı! Konum iznini veya HTTP bağlantı sınırlarını kontrol edin. Test için Simülasyon modunu açabilirsiniz.", "X", "text-red-500");
                        });
                    },
                    { enableHighAccuracy: true }
                );
            }
        } else {
            // Cleanup when GPS watching should stop (inactive, or manually paused)
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (staleCheckIntervalRef.current) {
                clearInterval(staleCheckIntervalRef.current);
                staleCheckIntervalRef.current = null;
            }
            // GPS izlenmiyorsa (durduruldu ya da duraklatıldı) gösterilecek bir sinyal sorunu yok
            setWalkIssue('none');
        }

        return () => {
            if (walkTimerRef.current) clearInterval(walkTimerRef.current);
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
            if (staleCheckIntervalRef.current) clearInterval(staleCheckIntervalRef.current);
        };
    }, [walkData.isActive, walkData.isPaused, walkData.isAutoPaused, isLoaded, autoPauseEnabled]);

    // Faz 2: ağ bağlantısı koptuğunda (GPS'in kendisi değil, sunucuya senkron) kullanıcıyı bilgilendir
    useEffect(() => {
        const handleOffline = () => {
            if (walkData.isActive && !walkData.isPaused) {
                setWalkIssue(prev => (prev === 'none' || prev === 'gps_weak' ? 'network_unavailable' : prev));
            }
        };
        const handleOnline = () => {
            setWalkIssue(prev => (prev === 'network_unavailable' ? 'none' : prev));
            // Piyasa araştırması #8: bağlantı geri gelince çevrimdışıyken biriken
            // GPS noktalarını SIRAYLA sunucuya gönder — sessizce kaybolmasınlar.
            const queued = offlineLocationQueueRef.current.splice(0, offlineLocationQueueRef.current.length);
            (async () => {
                for (const point of queued) {
                    try {
                        await apiService.updateWalkLocation(point.sessionId, point.lat, point.lng);
                    } catch (err) {
                        console.error("Çevrimdışı kuyruktaki konum senkronize edilemedi:", err);
                    }
                }
            })();
        };
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [walkData.isActive, walkData.isPaused]);

    // Faz 2: sekme arka plana alındığında (mobil tarayıcılar GPS callback'lerini kısıtlayabilir)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && walkData.isActive && !walkData.isPaused) {
                setWalkIssue(prev => (prev === 'none' || prev === 'gps_weak' ? 'background_permission_required' : prev));
            } else if (!document.hidden) {
                setWalkIssue(prev => (prev === 'background_permission_required' ? 'none' : prev));
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [walkData.isActive, walkData.isPaused]);

    // Global Voice Rec Logic
    useEffect(() => {
        if (!isLoaded) return;
        if (activeMode === 'voice') {
            recInterval.current = setInterval(() => setRecTime(prev => prev + 1), 1000);
        } else {
            if (recInterval.current) clearInterval(recInterval.current);
            setRecTime(0);
        }
        return () => { if (recInterval.current) clearInterval(recInterval.current); };
    }, [activeMode, isLoaded]);

    return (
        <ActivityContext.Provider value={{ 
            activeMode, setActiveMode, 
            walkData, setWalkData, walkHistory, walkStats, startWalk, pauseWalk, resumeWalk, stopWalk,
            recTime, setRecTime,
            orderStep, setOrderStep,
            isLoading,
            refreshWalkData,
            walkPhase, walkIssue, recoverableWalk,
            continueRecoveredWalk, discardRecoveredWalk, acknowledgeWalkCompletion,
            enterReadyPhase, exitToIdlePhase,
            autoPauseEnabled, setAutoPauseEnabled,

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
