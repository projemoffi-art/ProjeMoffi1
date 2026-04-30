'use client';

import React, { useState, useEffect } from 'react';
import OnboardingFlow from './OnboardingFlow';
import { apiService } from '@/services/apiService';

export function RootOnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Check if onboarding was completed before (UI state only)
        const hasCompletedOnboarding = localStorage.getItem('moffi_onboarded');
        if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleComplete = async (data: any) => {
        try {
            // Persist pet to Supabase if user has a pet in onboarding data
            if (data && (data.petName || data.name)) {
                await apiService.addPet({
                    name: data.petName || data.name,
                    species: data.species || 'dog',
                    breed: data.breed || '',
                    age: data.age ? parseInt(data.age) : undefined,
                    photo_url: data.photoUrl || data.avatar || '',
                    gender: data.gender || 'unknown'
                });
            }
        } catch (err) {
            console.error('Onboarding addPet error:', err);
            // Non-blocking: still complete onboarding even if pet sync fails
        }

        // Mark onboarding as done (localStorage is acceptable for this UI flag)
        localStorage.setItem('moffi_onboarded', 'true');
        setShowOnboarding(false);
    };

    return (
        <>
            {showOnboarding && <OnboardingFlow onComplete={handleComplete} />}
            {children}
        </>
    );
}
