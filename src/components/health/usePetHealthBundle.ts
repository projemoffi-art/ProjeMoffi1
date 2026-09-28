'use client';

// /health dışındaki ekranlar (ana sayfa gibi) için: bir evcil hayvanın Sağlık Kaydı'nı yükler.
// Hesaplar src/lib/health/derive.ts'teki aynı fonksiyonlarla yapılır; ayrı bir sağlık hesabı tutulmaz.

import { useEffect, useState } from 'react';
import { healthService } from '@/services/healthService';
import type { HealthBundle } from '@/types/health';
import type { Pet } from '@/context/PetContext';
import { speciesOf } from '@/lib/health/derive';

export function usePetHealthBundle(pet: Pet | null) {
    const [bundle, setBundle] = useState<HealthBundle | null>(null);
    const petId = pet?.id || null;
    const species = speciesOf(pet);

    useEffect(() => {
        let alive = true;
        setBundle(null);
        if (!petId) return;
        healthService.getBundle(petId, species)
            .then(b => { if (alive) setBundle(b); })
            .catch(() => { if (alive) setBundle(null); });
        return () => { alive = false; };
    }, [petId, species]);

    return bundle;
}
