'use client';

// Bugünkü öğün ve taze su kaydı (petCareService'in ortak hafızası). Açılan her ekran bir kez sunucudan tazeler.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { petCareService, type PetCareToday } from '@/services/petCareService';

export function usePetCare(petId: string | null, enabled = true) {
    const subscribe = useCallback((fn: () => void) => (petId ? petCareService.subscribe(petId, fn) : () => {}), [petId]);
    const care = useSyncExternalStore(
        subscribe,
        () => (petId ? petCareService.peek(petId) : null),
        () => null,
    );
    const [failed, setFailed] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !petId) return;
        let alive = true;
        petCareService.load(petId)
            .then(() => { if (alive) setFailed(null); })
            .catch(() => { if (alive) setFailed(petId); });
        return () => { alive = false; };
    }, [enabled, petId]);

    return { care: care as PetCareToday | null, error: failed !== null && failed === petId };
}
