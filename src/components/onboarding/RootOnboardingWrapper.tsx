'use client';

import React, { useState, useEffect } from 'react';
import OnboardingFlow from './OnboardingFlow';

export function RootOnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Check if onboarding was completed before
        const hasCompletedOnboarding = localStorage.getItem('moffi_onboarded');
        if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleComplete = (data: any) => {
        console.log("Onboarding completed with data:", data);
        
        // Save to localStorage
        localStorage.setItem('moffi_onboarded', 'true');
        localStorage.setItem('moffi_pet_data', JSON.stringify(data));
        
        // Hide overlay
        setShowOnboarding(false);
    };

    return (
        <>
            {showOnboarding && <OnboardingFlow onComplete={handleComplete} />}
            {children}
        </>
    );
}
