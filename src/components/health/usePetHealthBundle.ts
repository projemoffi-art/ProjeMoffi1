'use client';

// /health dışındaki ekranlar (ana sayfa gibi) için: bir evcil hayvanın Sağlık Kaydı.
// Karne ortak hafızadan gelir (healthService.loadBundle); sağlık ekranında bir değişiklik
// yapıldığında bu hook'u kullanan her ekran yeni hâli anında alır.
// Hesaplar src/lib/health/derive.ts'teki aynı fonksiyonlarla yapılır; ayrı bir sağlık hesabı tutulmaz.

import { useEffect, useState } from 'react';
import { healthService } from '@/services/healthService';
import type { HealthBundle } from '@/types/health';
import type { Pet } from '@/context/PetContext';
import { speciesOf } from '@/lib/health/derive';

export function usePetHealthBundle(pet: Pet | null) {
    const petId = pet?.id || null;
    const species = speciesOf(pet);
    const [bundle, setBundle] = useState<HealthBundle | null>(() => (petId ? healthService.peekBundle(petId) : null));

    useEffect(() => {
        let alive = true;
        if (!petId) { setBundle(null); return; }
        setBundle(healthService.peekBundle(petId));
        const unsubscribe = healthService.subscribeBundle(petId, b => { if (alive) setBundle(b); });
        healthService.loadBundle(petId, species).catch(() => { if (alive) setBundle(null); });
        return () => { alive = false; unsubscribe(); };
    }, [petId, species]);

    return bundle;
}
