'use client';

import React, { useState, useEffect } from 'react';
import OnboardingFlow from './OnboardingFlow';
import { apiService } from '@/services/apiService';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';

function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export function RootOnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user, isLoading: authLoading } = useAuth();
    const { pets, isLoading: petsLoading, addPet } = usePet();

    useEffect(() => {
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
            if (data && data.name) {
                const emojiMap: Record<string, string> = {
                    dog: '🐶',
                    cat: '🐱',
                    rabbit: '🐰',
                    parrot: '🦜',
                    hamster: '🐹',
                    fish: '🐠',
                    snake: '🐍',
                    lizard: '🦎'
                };
                const petType = emojiMap[data.type] || '🐶';

                const auraMap: Record<string, string> = {
                    brave: 'Cesur',
                    playful: 'Oyuncu',
                    calm: 'Sakin',
                    loyal: 'Sadık'
                };
                const character = auraMap[data.aura] || '';

                let uploadedImageUrl = '';
                if (data.image && data.image.startsWith('data:')) {
                    try {
                        const file = dataURLtoFile(data.image, `${data.name}_avatar.png`);
                        uploadedImageUrl = await apiService.uploadMedia(file, 'avatars');
                    } catch (uploadErr) {
                        console.error('Onboarding image upload failed:', uploadErr);
                    }
                }

                const petPayload = {
                    name: data.name,
                    type: petType,
                    image: uploadedImageUrl,
                    avatar: uploadedImageUrl,
                    character: character,
                    breed: '',
                    gender: 'Dişi',
                    weight: '10 kg'
                };
                
                const savedPet = await apiService.addPet(petPayload as any);
                
                addPet(savedPet);
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

