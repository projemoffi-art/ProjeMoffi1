import { useState, useEffect, useCallback, useRef } from "react";
import { IWalkService } from "@/services/interfaces";
import { WalkMockService } from "@/services/mock/WalkMockService";
import { WalkSession, WalkStats } from "@/types/domain";

const walkService: IWalkService = new WalkMockService();
const MOCK_USER_ID = 'user-1';
const MOCK_PET_ID = 'pet-1';

export function useWalk() {
    const [activeSession, setActiveSession] = useState<WalkSession | null>(null);
    const [history, setHistory] = useState<WalkSession[]>([]);
    const [stats, setStats] = useState<WalkStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const watchId = useRef<number | null>(null);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await walkService.getWalkHistory(MOCK_USER_ID);
            setHistory(data);
        } catch (err) {
            console.error('Walk history error:', err);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const data = await walkService.getWalkStats(MOCK_USER_ID);
            setStats(data);
        } catch (err) {
            console.error('Walk stats error:', err);
        }
    }, []);

    const startWalk = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const session = await walkService.startWalk(MOCK_USER_ID, MOCK_PET_ID);
            setActiveSession(session);

            // Start GPS tracking
            if ('geolocation' in navigator) {
                watchId.current = navigator.geolocation.watchPosition(
                    async (pos) => {
                        try {
                            await walkService.updateLocation(session.id, pos.coords.latitude, pos.coords.longitude);
                        } catch { /* silent */ }
                    },
                    (err) => console.warn('GPS error:', err.message),
                    { enableHighAccuracy: true, maximumAge: 5000 }
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

            const completed = await walkService.endWalk(activeSession.id, { mood, notes });
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

    // Initial load
    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, [fetchHistory, fetchStats]);

    return {
        activeSession,
        history,
        stats,
        isLoading,
        error,
        startWalk,
        endWalk,
        refresh: () => Promise.all([fetchHistory(), fetchStats()]),
    };
}
