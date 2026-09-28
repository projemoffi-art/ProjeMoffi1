"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NutritionModal } from '@/components/vet/NutritionModal';
import { usePet } from '@/context/PetContext';

// 'open-care-hub' olayı her sayfadan fırlatılabilir. Sağlık/aşı artık kendi sayfası olan Sağlık
// Merkezi'ne gider (eski aşı penceresi kaldırıldı); beslenme penceresi burada global kalır.
export function GlobalCareModals() {
    const router = useRouter();
    const { activePet } = usePet();
    const [nutritionOpen, setNutritionOpen] = useState(false);

    useEffect(() => {
        const handleOpenCareHub = (e: Event) => {
            const tab = (e as CustomEvent).detail?.tab;
            if (tab === 'vaccine') router.push('/health/asilar');
            else if (tab === 'health') router.push('/health');
            else if (tab === 'nutrition') setNutritionOpen(true);
        };
        window.addEventListener('open-care-hub', handleOpenCareHub);
        return () => window.removeEventListener('open-care-hub', handleOpenCareHub);
    }, [router]);

    // Önceden petId verilmeden açılıyordu: plan hiç yüklenmiyor, kaydedilemiyordu.
    return <NutritionModal isOpen={nutritionOpen} onClose={() => setNutritionOpen(false)} petId={activePet?.id || ''} />;
}
