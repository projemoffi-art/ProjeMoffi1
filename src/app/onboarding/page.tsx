"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { PetSetup } from "@/components/onboarding/PetSetup";

// İlk kurulum (design-reference/onboarding-final, ekranlar 4–9). Giriş yapmamış kullanıcı karşılamaya gider;
// kurulumu zaten bitirmiş (ya da atlamış) kullanıcı ana sayfaya.
export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const { isLoading: petsLoading } = usePet();
    const { loading: statusLoading, completed } = useOnboardingStatus(user?.id);

    useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace("/");
        else if (!statusLoading && completed) router.replace("/home");
    }, [isLoading, user, statusLoading, completed, router]);

    if (isLoading || !user || statusLoading || petsLoading) {
        return (
            <main className="theme-vet min-h-[100dvh] bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            </main>
        );
    }
    return <PetSetup />;
}
