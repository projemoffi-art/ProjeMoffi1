import { useActivity } from "@/context/ActivityContext";

export function useWalk() {
    const { 
        walkData, 
        startWalk, 
        stopWalk, 
        walkHistory, 
        walkStats, 
        isLoading,
        refreshWalkData
    } = useActivity();

    // Map the local walkData structure to a mock/database WalkSession shape
    const activeSession = walkData.isActive ? {
        id: walkData.sessionId || 'current-active-session',
        distanceKm: walkData.distance / 1000,
        startTime: new Date(Date.now() - walkData.time * 1000).toISOString(),
        isPaused: walkData.isPaused,
        route: walkData.path
    } : null;

    return {
        activeSession,
        history: walkHistory,
        stats: walkStats,
        isLoading,
        isSyncing: false,
        error: null,
        startWalk,
        endWalk: stopWalk,
        refresh: refreshWalkData,
    };
}
