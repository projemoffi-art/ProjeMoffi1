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
        route: walkData.path,
        // Baran'ın gerçek bulgusu: ana sayfa kartı hangi pet'in yürüyüşte olduğunu
        // bilmiyordu, PetSwitcher'da o an seçili pet'i varsayıyordu. Artık yürüyüşün
        // KENDİSİ taşıdığı için tüketiciler (home/page.tsx) doğru pet'i gösterebilir.
        petId: walkData.petId,
        petName: walkData.petName,
        // Baran'ın telefonda bulduğu kritik hata: adım sayısı GPS mesafesinden
        // türetiliyordu — artık gerçek ivmeölçer tabanlı sayaç burada da erişilebilir.
        realSteps: walkData.realSteps,
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
