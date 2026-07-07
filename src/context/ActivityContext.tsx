'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { WalkStats } from '@/types/domain';

type ActivityMode = 'none' | 'walk' | 'voice' | 'sos' | 'ai' | 'order';

interface WalkData {
    time: number;
    distance: number; // in meters
    isActive: boolean;
    isPaused: boolean;
    path: [number, number][]; // coordinates
    speed: number; // in km/h
    sessionId?: string;
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
        path: [],
        speed: 0
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

    const walkTimerRef = useRef<NodeJS.Timeout | null>(null);
    const watchIdRef = React.useRef<number | null>(null);
    const lastPosTimestampRef = React.useRef<number>(0);
    const recInterval = useRef<NodeJS.Timeout | null>(null);

    // Mapper function to support both Local and Backend WalkSession formats
    const mapSessionToRecord = useCallback((session: any): WalkRecord => {
        const distMeters = session.distance_meters || (session.distanceKm ? session.distanceKm * 1000 : 0) || (session.distance ? session.distance : 0);
        const durationMins = session.duration_minutes || session.durationMinutes || Math.round((session.time || 0) / 60) || 0;
        const pathCoords = session.route || session.path || [];
        const dateStr = session.ended_at || session.endTime
            ? safeParseDateStr(session.ended_at || session.endTime)
            : safeParseDateStr(session.started_at || session.startTime);
        
        return {
            id: session.id || String(Date.now()),
            date: dateStr,
            duration: `${durationMins}dk`,
            distance: distMeters >= 1000 ? `${(distMeters / 1000).toFixed(2)}km` : `${distMeters.toFixed(0)}m`,
            steps: Math.floor(distMeters * 1.4),
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
            const hist = await apiService.getWalkHistory(user.id);
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
        
        if (savedMode) setActiveMode(savedMode);
        if (savedWalk) {
            try {
                const parsed = JSON.parse(savedWalk);
                setWalkData({
                    time: parsed.time || 0,
                    distance: parsed.distance || 0,
                    isActive: parsed.isActive || false,
                    isPaused: parsed.isPaused || false,
                    path: Array.isArray(parsed.path) ? parsed.path : [],
                    speed: parsed.speed || 0,
                    sessionId: parsed.sessionId
                });
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
        localStorage.setItem('moffi_active_walk', JSON.stringify(walkData));
        localStorage.setItem('moffi_walk_history', JSON.stringify(walkHistory));
    }, [activeMode, walkData, walkHistory, isLoaded]);

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
            path: [],
            speed: 0,
            sessionId: sId
        });
        setIsLoading(false);
    };

    const pauseWalk = () => {
        setWalkData(prev => ({ ...prev, isPaused: true, speed: 0 }));
    };

    const resumeWalk = () => {
        setWalkData(prev => ({ ...prev, isPaused: false }));
    };

    const stopWalk = async (save = true) => {
        setIsLoading(true);
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
            path: [], 
            speed: 0 
        });
        localStorage.removeItem('moffi_active_walk');
        localStorage.removeItem('moffi_active_mode');
        setIsLoading(false);
    };

    // --- REAL GPS & TIMER LOGIC ---
    useEffect(() => {
        if (!isLoaded) return;

        if (walkData.isActive && !walkData.isPaused) {
            // 1. Start Timer & Simulated Movement in Development / Mock Mode
            if (!walkTimerRef.current) {
                walkTimerRef.current = setInterval(() => {
                    setWalkData(prev => {
                        const nextTime = prev.time + 1;
                        
                        // Real GPS: only update timer seconds
                        return { ...prev, time: nextTime };
                    });
                }, 1000);
            }

            // 2. Start GPS Tracking
            if (!watchIdRef.current && navigator.geolocation) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude, longitude, speed: gpsSpeed } = pos.coords;
                        const newCoord: [number, number] = [latitude, longitude];

                        setWalkData(prev => {
                            const currentPath = Array.isArray(prev.path) ? prev.path : [];
                            let newPath = currentPath;
                            let newDistance = prev.distance || 0;
                            let currentSpeed = 0;

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
                                if (distDelta > 15 && calcSpeedKmH < 25) {
                                    newPath = [...currentPath, newCoord];
                                    newDistance += distDelta;
                                    
                                    currentSpeed = gpsSpeed && gpsSpeed > 0 ? (gpsSpeed * 3.6) : calcSpeedKmH;
                                    lastPosTimestampRef.current = pos.timestamp;
                                    
                                    // Sync coordinate to server if online
                                    if (prev.sessionId && navigator.onLine) {
                                        apiService.updateWalkLocation(prev.sessionId, latitude, longitude)
                                            .catch(err => console.error("Error updating GPS location on DB:", err));
                                    }
                                } else {
                                    // Eğer hareket 3 metreden azsa veya imkansız bir sıçramaysa hızı sıfırla
                                    currentSpeed = 0;
                                }
                            } else {
                                // İlk koordinat
                                newPath = [newCoord];
                                lastPosTimestampRef.current = pos.timestamp;
                                if (prev.sessionId && navigator.onLine) {
                                    apiService.updateWalkLocation(prev.sessionId, latitude, longitude)
                                        .catch(err => console.error("Error updating initial GPS location on DB:", err));
                                }
                            }

                            return { ...prev, path: newPath, distance: newDistance, speed: currentSpeed };
                        });
                    },
                    (err) => {
                        console.error("GPS Watch Position Error:", err);
                        import('@/lib/utils').then(({ showToast }) => {
                            showToast("GPS Bağlantısı Sağlanamadı! Konum iznini veya HTTP bağlantı sınırlarını kontrol edin. Test için Simülasyon modunu açabilirsiniz.", "X", "text-red-500");
                        });
                    },
                    { enableHighAccuracy: true }
                );
            }
        } else {
            // Cleanup when inactive or paused
            if (walkTimerRef.current) {
                clearInterval(walkTimerRef.current);
                walkTimerRef.current = null;
            }
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        return () => {
            if (walkTimerRef.current) clearInterval(walkTimerRef.current);
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [walkData.isActive, walkData.isPaused, isLoaded]);

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
