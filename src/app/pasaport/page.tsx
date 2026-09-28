'use client';

import React from 'react';
import { HealthHeader } from '@/components/health/HealthUI';
import { PetPicker } from '@/components/health/PetPicker';
import { useHealth } from '@/components/health/HealthProvider';
import { PassportHome } from '@/components/passport/PassportHome';

export default function PassportPage() {
    const { pets } = useHealth();
    return (
        <>
            <HealthHeader title="Pet Pasaportu" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {pets.length > 1 && <PetPicker />}
                <PassportHome />
            </main>
        </>
    );
}
