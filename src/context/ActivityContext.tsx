'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type ActivityMode = 'none' | 'walk' | 'voice' | 'sos' | 'ai' | 'order';

interface WalkData {
    time: number;
    distance: number; // in meters
    isActive: boolean;
    isPaused: boolean;
    path: [number, number][]; // coordinates
    speed: number; // in km/h
}

interface WalkRecord {
    id: string;
    date: string;
    duration: string;
    distance: string;
    steps: number;
    path: [number, number][];
}

interface ActivityContextType {
    activeMode: ActivityMode;
    setActiveMode: (mode: ActivityMode) => void;
    walkData: WalkData;
    setWalkData: React.Dispatch<React.SetStateAction<WalkData>>;
    walkHistory: WalkRecord[];
    startWalk: () => void;
    pauseWalk: () => void;
    resumeWalk: () => void;
    stopWalk: (save?: boolean) => void;
    recTime: number;
    setRecTime: React.Dispatch<React.SetStateAction<number>>;
    orderStep: number;
    setOrderStep: React.Dispatch<React.SetStateAction<number>>;
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

export function ActivityProvider({ children }: { children: React.ReactNode }) {
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
    const [recTime, setRecTime] = useState(0);
    const [orderStep, setOrderStep] = useState(2); // 1: Prep, 2: Courier, 3: Delivered
    const [isLoaded, setIsLoaded] = useState(false);
    
    const walkTimerRef = useRef<NodeJS.Timeout | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const recInterval = useRef<NodeJS.Timeout | null>(null);

    // Global Listeners for SOS and AI
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

    // Load state on mount
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
                    speed: parsed.speed || 0
                });
            } catch (e) {
                console.error("Parse error:", e);
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

    // Save state on changes
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('moffi_active_mode', activeMode);
        localStorage.setItem('moffi_active_walk', JSON.stringify(walkData));
        localStorage.setItem('moffi_walk_history', JSON.stringify(walkHistory));
    }, [activeMode, walkData, walkHistory, isLoaded]);

    const startWalk = () => {
        setActiveMode('walk');
        setWalkData(prev => ({ 
            ...prev, 
            isActive: true, 
            isPaused: false,
            time: prev.time || 0, 
            distance: prev.distance || 0 
        }));
    };

    const pauseWalk = () => {
        setWalkData(prev => ({ ...prev, isPaused: true, speed: 0 }));
    };

    const resumeWalk = () => {
        setWalkData(prev => ({ ...prev, isPaused: false }));
    };

    const stopWalk = (save = true) => {
        if (save && walkData.distance > 0) {
            const newRecord: WalkRecord = {
                id: Date.now().toString(),
                date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                duration: `${Math.floor(walkData.time / 60)}dk`,
                distance: walkData.distance >= 1000 ? `${(walkData.distance / 1000).toFixed(2)}km` : `${walkData.distance.toFixed(0)}m`,
                steps: Math.floor(walkData.distance * 1.4), // Simulated steps
                path: walkData.path
            };
            setWalkHistory(prev => [newRecord, ...prev]);
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
    };

    // --- REAL GPS & TIMER LOGIC ---
    useEffect(() => {
        if (!isLoaded) return;

        if (walkData.isActive && !walkData.isPaused) {
            // 1. Start Timer
            if (!walkTimerRef.current) {
                walkTimerRef.current = setInterval(() => {
                    setWalkData(prev => ({ ...prev, time: prev.time + 1 }));
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
                            const newPath = [...currentPath, newCoord];
                            let newDistance = prev.distance || 0;
                            let currentSpeed = 0;

                            if (currentPath.length > 0) {
                                const lastCoord = currentPath[currentPath.length - 1];
                                const distDelta = calculateDistance(lastCoord[0], lastCoord[1], latitude, longitude);
                                
                                // Only add if movement is more than 2 meters
                                if (distDelta > 2) {
                                    newDistance += distDelta;
                                    currentSpeed = gpsSpeed ? (gpsSpeed * 3.6) : (distDelta * 3.6); 
                                }
                            }

                            return { ...prev, path: newPath, distance: newDistance, speed: currentSpeed };
                        });
                    },
                    (err) => console.error("GPS Error:", err),
                    { enableHighAccuracy: true, distanceFilter: 2 }
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
            walkData, setWalkData, walkHistory, startWalk, pauseWalk, resumeWalk, stopWalk,
            recTime, setRecTime,
            orderStep, setOrderStep
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
