"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { Onboarding } from "@/components/auth/Onboarding";
import { AuthLanding, LoginForm, SignupForm, ResetForm } from "@/components/auth/AuthForms";
import { SetupWizard } from "@/components/auth/SetupWizard";

type FlowStep = 'loading' | 'splash' | 'onboarding' | 'landing' | 'login' | 'signup' | 'reset' | 'setup';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<FlowStep>('loading');

  // Session check — skip auth flow if already logged in
  useEffect(() => {
    if (isLoading) return; // Wait for AuthContext to finish loading

    if (user) {
      // Already logged in → go to home
      router.replace('/community');
    } else {
      // Not logged in → check if onboarding was seen before
      const onboardingSeen = localStorage.getItem('moffipet_onboarding_seen');
      if (onboardingSeen) {
        setStep('landing'); // Skip splash + onboarding
      } else {
        setStep('splash'); // First time → full flow
      }
    }
  }, [user, isLoading, router]);

  // Splash completion handler
  const handleSplashComplete = () => {
    setStep('onboarding');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    setStep('landing');
  };

  const handleLoginComplete = () => {
    router.replace('/community');
  };

  const handleSignupComplete = () => {
    setStep('setup');
  };

  const handleSetupComplete = () => {
    router.replace('/community');
  };

  // Show nothing while checking session
  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-md h-screen bg-white shadow-2xl overflow-hidden relative">

        {step === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}

        {step === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}

        {/* Auth Stack */}
        {step === 'landing' && <AuthLanding setView={(v) => setStep(v as FlowStep)} />}
        {step === 'login' && <LoginForm setView={(v) => setStep(v as FlowStep)} onComplete={handleLoginComplete} />}
        {step === 'signup' && <SignupForm setView={(v) => setStep(v as FlowStep)} onComplete={handleSignupComplete} />}
        {step === 'reset' && <ResetForm setView={(v) => setStep(v as FlowStep)} />}

        {/* Setup Stack */}
        {step === 'setup' && <SetupWizard onComplete={handleSetupComplete} />}

      </div>
    </main>
  );
}
