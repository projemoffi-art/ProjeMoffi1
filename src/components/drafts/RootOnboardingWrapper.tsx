'use client';

import React, { useState, useEffect } from 'react';
import OnboardingFlow from './OnboardingFlow';
import { apiService } from '@/services/apiService';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';

export function RootOnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user, isLoading: authLoading } = useAuth();
    const { pets, isLoading: petsLoading, addPet } = usePet();

    useEffect(() => {
        const isFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_ONBOARDING === 'true';

        if (!isFeatureEnabled) {
            setShowOnboarding(false);
            return;
        }

        if (!authLoading && !petsLoading) {
            if (!user) {
                // Not logged in -> hide onboarding slideshow entirely
                setShowOnboarding(false);
            } else if (pets.length > 0) {
                // Logged in and already has pets -> skip onboarding
                localStorage.setItem('moffi_onboarded', 'true');
                setShowOnboarding(false);
            } else {
                // Logged in but has no pets -> check if they need onboarding
                const hasCompletedOnboarding = localStorage.getItem('moffi_onboarded');
                if (!hasCompletedOnboarding) {
                    setShowOnboarding(true);
                } else {
                    setShowOnboarding(false);
                }
            }
        }
    }, [user, authLoading, pets, petsLoading]);

    const handleComplete = async (data: any) => {
        try {
            // Persist pet to Supabase if user has a pet in onboarding data
            if (data && (data.petName || data.name)) {
                const petPayload = {
                    name: data.petName || data.name,
                    species: data.species || 'dog',
                    breed: data.breed || '',
                    age: data.age ? parseInt(data.age) : undefined,
                    photo_url: data.photoUrl || data.avatar || '',
                    gender: data.gender || 'unknown'
                };
                
                const savedPet = await apiService.addPet(petPayload);
                
                addPet({
                    ...petPayload,
                    id: savedPet.id,
                    image: savedPet.image || petPayload.photo_url,
                    weight: savedPet.weight || '10 kg'
                } as any);
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

