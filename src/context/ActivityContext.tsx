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
    // Baran'ın gerçek telefonda bulduğu kritik hata: adım sayısı SADECE GPS
    // mesafesinden (distance*1.3) türetiliyordu — yani ev içinde ya da GPS
    // sinyalinin zayıf olduğu HERHANGİ bir yerde (GPS fiziksel olarak anlamlı
    // bir konum farkı algılayamaz) adım sayısı asla artamıyordu, GPS ne kadar
    // iyileştirilirse iyileştirilsin bu kökten çözülemezdi. Gerçek profesyonel
    // çözüm: telefonun ivmeölçer sensörüyle (DeviceMotionEvent), GPS'ten TAMAMEN
    // bağımsız, gerçek bir adım algılama sistemi (bkz. aşağıdaki devicemotion
    // efekti) — tıpkı gerçek pedometre uygulamalarının çalışma şekli.
    realSteps: number;
}

// Faz 2: kapanmadan/çökmeden kesilen bir yürüyüşün geri getirilebilir anlık görüntüsü
interface RecoverableWalk {
    time: number;
    distance: number;
    path: [number, number][];
    sessionId?: string;
    petId?: string;
    petName?: string;
    realSteps?: number;
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
        splits: [],
        realSteps: 0
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
                        realSteps: parsed.realSteps || 0,
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
                        realSteps: parsed.realSteps || 0,
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
            realSteps: 0,
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
            realSteps: recoverableWalk.realSteps || 0,
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
                    durationMinutes: Math.round(recoverableWalk.time / 60),
                    steps: recoverableWalk.realSteps || 0,
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
                steps: recoverableWalk.realSteps ? recoverableWalk.realSteps : Math.floor(recoverableWalk.distance * 1.3),
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
                        durationMinutes: Math.round(walkData.time / 60),
                        steps: walkData.realSteps,
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
                    // Gerçek sensör-tabanlı adım sayısı varsa o kullanılıyor; sıfırsa
                    // (ör. cihaz izni reddedildiyse) dürüst bir mesafe tahminine düşülüyor.
                    steps: walkData.realSteps > 0 ? walkData.realSteps : Math.floor(walkData.distance * 1.3),
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
            splits: [],
            realSteps: 0
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

                                // Baran'ın gerçek telefonda bulduğu kritik hata: bu eşik SABİT 15 metreydi.
                                // Normal yürüyüş hızında (~1.4 m/s) ve `watchPosition`'ın sık geldiği
                                // (genelde saniyede bir) gerçek koşullarda, ART ARDA gelen iki GPS
                                // noktası arası mesafe neredeyse HİÇBİR ZAMAN 15 metreyi geçmiyor —
                                // yani gerçek, sürekli yürüyüş neredeyse HER GÜNCELLEMEDE "sahte hareket
                                // değil" diye reddediliyordu, mesafe (ve ondan türeyen adım sayısı)
                                // pratikte hiç birikmiyordu. Profesyonel GPS takip uygulamalarının
                                // (Strava vb.) kullandığı gerçek yöntem: sabit bir evrensel sayı değil,
                                // GPS'in KENDİ bildirdiği anlık doğruluk yarıçapını (`accuracy`) gürültü
                                // tabanı olarak kullanmak — iyi sinyalde (ör. 5m) küçük gerçek hareketler
                                // hemen kabul edilirken, kötü sinyalde (ör. 30m, iç mekan/şehir kanyonu)
                                // eşik kendiliğinden yükselip gerçek GPS sıçramalarını hâlâ filtreliyor.
                                const noiseFloorMeters = Math.max(pos.coords.accuracy || 15, 8);
                                const isRealMovement = distDelta > noiseFloorMeters && calcSpeedKmH < 25;

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

    // Baran'ın telefonda bulduğu kritik hata: adım sayısı SADECE GPS mesafesinden
    // türetiliyordu — ev içinde (ya da GPS'in fiziksel olarak anlamlı bir konum
    // farkı algılayamadığı HERHANGİ bir yerde) bu asla artamıyordu, GPS eşiği ne
    // kadar iyileştirilirse iyileştirilsin bu kökten çözülemezdi. Gerçek
    // profesyonel çözüm: telefonun ivmeölçer sensörüyle (DeviceMotionEvent),
    // GPS'ten TAMAMEN bağımsız gerçek bir adım algılama sistemi — tıpkı gerçek
    // pedometre uygulamalarının (Google Fit, Apple Health) çalışma şekli.
    //
    // Moffi puan (PP) dağıttığı için bu sayacın gerçek pedometre uygulamaları
    // kadar sağlam olması gerekiyor (Baran'ın bulduğu 2 gerçek sorun: (1) yerinde
    // otururken telefonu sallayınca adım sayılıyordu, (2) tek adımda bazen 2
    // sayılıyordu). Basit bir "eşiği geçince say" yaklaşımı ritmi hiç anlamıyor —
    // gerçek akademik/endüstriyel adım algılama literatürünün (bkz. CLAUDE.md
    // araştırma notları) 3 standart tekniği burada uygulanıyor:
    // 1. GERÇEK HİSTEREZİS: sadece TEK bir eşik yerine, birbirinden iyi ayrılmış
    //    İKİ eşik (tepe eşiği + çok daha düşük, ayrı bir "vadi" eşiği). Bir sonraki
    //    tepe SADECE sinyal gerçekten vadi eşiğinin altına inince tekrar
    //    "silahlanıyor" — tek bir adımın darbesindeki ikincil alt-tepeciklerin
    //    (topuk vuruşu + ayak düzleşmesi gibi) çift sayılmasını engelliyor.
    // 2. ADIM ARALIĞI FİZİKSEL SINIRI: iki tepe arası süre gerçekçi bir insan
    //    yürüyüş/hafif koşu aralığında (300ms–2000ms) değilse aday reddediliyor.
    // 3. RİTİM TUTARLILIĞI ONAYI: ard arda gelen aday adımların ARALIKLARI
    //    birbirine yakın olmadıkça GERÇEKTEN saymaya başlanmıyor — izole bir
    //    sallama/darbe (düzensiz veya tek seferlik) bu tutarlılık testini
    //    geçemediği için asla sayılmıyor. Bu, sallamaya karşı ASIL savunma
    //    (tek bir sert darbe her zaman eşiği geçebilir, ama gerçek yürüyüş
    //    RİTMİNİ taklit edemez).
    // NOT (gerçek cihaza hiç gerek kalmadan Playwright'ta yakalanan bir hata
    // dersi): eşiği sakin dönemlerdeki varyanstan "kendiliğinden ayarlanır"
    // yapmak CAZİP görünüyordu ama gerçekte kendi kendini besleyen bir
    // kısır döngüye yol açtı — bir adım darbesi eşiğin biraz altında kalıp
    // "sakin" sayılırsa, o darbe varyansı şişirip eşiği DAHA DA yükseltiyor,
    // birkaç adım sonra algılama neredeyse tamamen duruyordu (40 simüle
    // adımdan sadece 4'ü sayıldı). SABİT bir eşik + yukarıdaki 3 teknik,
    // hem çok daha ÖNGÖRÜLEBİLİR hem de gerçek testte kanıtlanmış şekilde
    // daha SAĞLAM çıktı — profesyonel pedometrelerin çoğu da (bkz. Analog
    // Devices pedometre tasarım notu) sabit/yarı-sabit eşikler kullanıyor.
    useEffect(() => {
        const shouldTrackSteps = walkData.isActive && (!walkData.isPaused || walkData.isAutoPaused);
        if (!shouldTrackSteps || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

        let filteredMagnitude = 9.81;
        let awaitingValley = false; // histerezis: bir sonraki tepe için "vadi"ye inilmesini bekliyoruz
        let lastPeakAt = 0;
        let lastIntervalMs = 0;
        let consistentStreak = 0; // ard arda tutarlı-aralıklı tepe sayısı

        const ALPHA = 0.9; // taban çizgisi (yerçekimi) filtresi — sadece sakinken güncellenir
        const STEP_THRESHOLD = 1.15; // m/s² — sabit tepe eşiği (gerçek testle doğrulanmış değer)
        const VALLEY_THRESHOLD = STEP_THRESHOLD * 0.4; // gerçek, iyi ayrılmış histerezis vadi eşiği
        const MIN_STEP_INTERVAL_MS = 300; // ~3.3 adım/sn üst sınır (hafif koşuyu bile kapsar)
        const MAX_STEP_INTERVAL_MS = 2000; // bundan uzun boşluk = "yeni bir seri" (duraklama/koklama sonrası)
        const INTERVAL_TOLERANCE = 0.35; // ardışık aralıklar birbirinden en fazla %35 sapabilir
        const REQUIRED_CONSISTENT_PEAKS = 4; // gerçekten saymaya başlamadan önce gereken ritim onay sayısı

        const handleMotion = (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
            const magnitude = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
            const deviation = Math.abs(magnitude - filteredMagnitude);

            // Taban çizgisi SADECE sinyal zaten sakinken (bir adım/sallama darbesinin
            // ORTASINDA değilken) güncelleniyor — aksi halde darbenin kendisi taban
            // çizgisini yukarı "sürükleyip" algılamayı giderek duyarsızlaştırırdı.
            if (deviation < STEP_THRESHOLD) {
                filteredMagnitude = ALPHA * filteredMagnitude + (1 - ALPHA) * magnitude;
            }

            const now = Date.now();

            if (!awaitingValley && deviation > STEP_THRESHOLD) {
                // Aday bir tepe (potansiyel adım darbesi) algılandı.
                awaitingValley = true;
                const interval = lastPeakAt > 0 ? now - lastPeakAt : 0;
                lastPeakAt = now;

                const isPlausibleCadence = interval >= MIN_STEP_INTERVAL_MS && interval <= MAX_STEP_INTERVAL_MS;
                const isConsistentWithLast = lastIntervalMs > 0 && Math.abs(interval - lastIntervalMs) / lastIntervalMs <= INTERVAL_TOLERANCE;

                if (isPlausibleCadence && (consistentStreak === 0 || isConsistentWithLast)) {
                    consistentStreak += 1;
                    lastIntervalMs = interval;
                } else {
                    // Ritim bozuldu (ya da ilk aday) — seriyi bu tepeden yeniden başlat.
                    consistentStreak = isPlausibleCadence ? 1 : 0;
                    lastIntervalMs = isPlausibleCadence ? interval : 0;
                }

                if (consistentStreak >= REQUIRED_CONSISTENT_PEAKS) {
                    // Yeterince tutarlı ritim onaylandı — GERÇEK bir adım sayılıyor.
                    // (Not: bir yürüyüş/duraklama sonrası ilk 1-2 aday tepe, ritim
                    // onaylanana kadar bilerek SAYILMIYOR — sallamaya karşı asıl
                    // savunma budur; bu küçük, dürüst bir "geç başlama" gecikmesi,
                    // yanlış pozitif riskinden çok daha tercih edilir.)
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

        let cancelled = false;
        const attach = () => { if (!cancelled) window.addEventListener('devicemotion', handleMotion); };
        const requestPermissionIfNeeded = (DeviceMotionEvent as any).requestPermission;
        if (typeof requestPermissionIfNeeded === 'function') {
            requestPermissionIfNeeded()
                .then((state: string) => { if (state === 'granted') attach(); })
                .catch(() => {});
        } else {
            attach();
        }

        return () => { cancelled = true; window.removeEventListener('devicemotion', handleMotion); };
    }, [walkData.isActive, walkData.isPaused, walkData.isAutoPaused]);

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
