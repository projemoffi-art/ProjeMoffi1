import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "@/services/apiService";
import { WalkSession, WalkStats } from "@/types/domain";

import { usePet } from "@/context/PetContext";

const REAL_USER_ID = '11a97534-a7a5-4d22-993b-680161231b2e';

export function useWalk() {
    const { activePet } = usePet();
    const [activeSession, setActiveSession] = useState<WalkSession | null>(null);
    const [history, setHistory] = useState<WalkSession[]>([]);
    const [stats, setStats] = useState<WalkStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const watchId = useRef<number | null>(null);
    const offlineQueue = useRef<{lat: number, lng: number, timestamp: string}[]>([]);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await apiService.getWalkHistory(REAL_USER_ID);
            setHistory(data);
        } catch (err) {
            console.error('Walk history error:', err);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        if (!activePet) return;
        try {
            const data = await apiService.getWalkStats(REAL_USER_ID);
            setStats(data);
        } catch (err) {
            console.error('Walk stats error:', err);
        }
    }, [activePet]);

    const startWalk = useCallback(async () => {
        if (!activePet) return null;
        setIsLoading(true);
        setError(null);
        try {
            const session = await apiService.startWalk(REAL_USER_ID, activePet.id);
            setActiveSession(session);

            // Start GPS tracking with Offline-First Sync
            if ('geolocation' in navigator) {
                watchId.current = navigator.geolocation.watchPosition(
                    async (pos) => {
                        const { latitude: lat, longitude: lng } = pos.coords;
                        const timestamp = new Date().toISOString();
                        const coord = { lat, lng, timestamp };

                        try {
                            // 1. Try Live Sync
                            if (navigator.onLine) {
                                await apiService.updateWalkLocation(session.id, lat, lng);
                            } else {
                                throw new Error("Offline");
                            }
                        } catch (err) {
                            // 2. Buffer to LocalStorage if offline or failed
                            console.log("📍 Offline Mode: Queueing coordinate...");
                            const currentQueue = JSON.parse(localStorage.getItem(`walk_queue_${session.id}`) || '[]');
                            localStorage.setItem(`walk_queue_${session.id}`, JSON.stringify([...currentQueue, coord]));
                            offlineQueue.current.push(coord);
                        }
                        
                        // 3. Update Local UI State (Always smooth)
                        setActiveSession(prev => {
                            if (!prev) return prev;
                            const newRoute = [...(prev.route || []), coord];
                            
                            // Haversine distance calculation
                            let newDist = prev.distanceKm;
                            if (prev.route && prev.route.length > 0) {
                                const last = prev.route[prev.route.length - 1];
                                const R = 6371;
                                const dLat = (lat - last.lat) * Math.PI / 180;
                                const dLon = (lng - last.lng) * Math.PI / 180;
                                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                          Math.cos(last.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                                          Math.sin(dLon/2) * Math.sin(dLon/2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                newDist += R * c;
                            }

                            return {
                                ...prev,
                                route: newRoute,
                                distanceKm: Math.round(newDist * 100) / 100
                            };
                        });
                    },
                    (err) => console.warn('GPS error:', err.message),
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
                );
            }
            return session;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yürüyüş başlatılamadı');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const endWalk = useCallback(async (mood?: WalkSession['mood'], notes?: string) => {
        if (!activeSession) return null;
        setIsLoading(true);
        try {
            // Stop GPS tracking
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }

            const completed = await apiService.endWalk(activeSession.id, { 
                mood, 
                notes,
                distanceKm: activeSession.distanceKm,
                durationMinutes: Math.round((new Date().getTime() - new Date(activeSession.startTime).getTime()) / 60000)
            });

            // Final cloud sync if any pending
            if (navigator.onLine) {
                const queueKey = `walk_queue_${activeSession.id}`;
                const pending = JSON.parse(localStorage.getItem(queueKey) || '[]');
                if (pending.length > 0) {
                    setIsSyncing(true);
                    for (const coord of pending) {
                        try { await apiService.updateWalkLocation(activeSession.id, coord.lat, coord.lng); } catch {}
                    }
                    localStorage.removeItem(queueKey);
                    setIsSyncing(false);
                }
            }

            setActiveSession(null);

            // Refresh data
            await Promise.all([fetchHistory(), fetchStats()]);
            return completed;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yürüyüş bitirilemedi');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [activeSession, fetchHistory, fetchStats]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, []);

    // Auto-Sync Effect
    useEffect(() => {
        const syncData = async () => {
            if (!activeSession || !navigator.onLine) return;
            
            const queueKey = `walk_queue_${activeSession.id}`;
            const pending = JSON.parse(localStorage.getItem(queueKey) || '[]');
            
            if (pending.length > 0) {
                console.log(`🌐 Syncing ${pending.length} pending locations...`);
                setIsSyncing(true);
                // Synchronous bulk sync (simplified for mock/api)
                for (const coord of pending) {
                    try {
                        await apiService.updateWalkLocation(activeSession.id, coord.lat, coord.lng);
                    } catch (err) {
                        console.error("Sync error, will retry later", err);
                        setIsSyncing(false);
                        return; // Stop if it fails again
                    }
                }
                localStorage.removeItem(queueKey);
                setIsSyncing(false);
                console.log("✅ Sync complete!");
            }
        };

        const handleOnline = () => syncData();
        window.addEventListener('online', handleOnline);
        const interval = setInterval(syncData, 10000); // Check every 10s if online

        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(interval);
        };
    }, [activeSession]);

    // Initial load & Re-fetch on Pet Switch
    useEffect(() => {
        if (activePet) {
            fetchHistory();
            fetchStats();
        }
    }, [fetchHistory, fetchStats, activePet?.id]);

    return {
        activeSession,
        history,
        stats,
        isLoading,
        isSyncing,
        error,
        startWalk,
        endWalk,
        refresh: () => Promise.all([fetchHistory(), fetchStats()]),
    };
}
