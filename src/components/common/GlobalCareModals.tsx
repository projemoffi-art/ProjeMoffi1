"use client";

import React, { useState, useEffect } from 'react';
import { VaccineModal } from '@/components/vet/VaccineModal';
import { NutritionModal } from '@/components/vet/NutritionModal';

export function GlobalCareModals() {
    const [activeModal, setActiveModal] = useState<'vaccine' | 'nutrition' | null>(null);

    useEffect(() => {
        const handleOpenCareHub = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.tab) {
                if (customEvent.detail.tab === 'health' || customEvent.detail.tab === 'vaccine') {
                    setActiveModal('vaccine');
                } else if (customEvent.detail.tab === 'nutrition') {
                    setActiveModal('nutrition');
                }
            }
        };

        window.addEventListener('open-care-hub', handleOpenCareHub);
        return () => window.removeEventListener('open-care-hub', handleOpenCareHub);
    }, []);

    return (
        <>
            <VaccineModal 
                isOpen={activeModal === 'vaccine'} 
                onClose={() => setActiveModal(null)} 
            />
            <NutritionModal 
                isOpen={activeModal === 'nutrition'} 
                onClose={() => setActiveModal(null)} 
            />
        </>
    );
}
