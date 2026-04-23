"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { Onboarding } from "@/components/auth/Onboarding";
import { AuthLanding, LoginForm, SignupForm, ResetForm } from "@/components/auth/AuthForms";
import { SetupWizard } from "@/components/auth/SetupWizard";
import { motion, AnimatePresence } from "framer-motion";

type FlowStep = 'loading' | 'splash' | 'onboarding' | 'landing' | 'login' | 'signup' | 'reset' | 'setup';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<FlowStep>('loading');

  // Session check — skip auth flow if already logged in
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace('/community');
    } else {
      const onboardingSeen = localStorage.getItem('moffipet_onboarding_seen');
      if (onboardingSeen) {
        setStep('landing');
      } else {
        setStep('splash');
      }
    }
  }, [user, isLoading, router]);

  const handleSplashComplete = () => setStep('onboarding');
  const handleOnboardingComplete = () => {
    localStorage.setItem('moffipet_onboarding_seen', 'true');
    setStep('landing');
  };
  const handleLoginComplete = () => router.replace('/community');
  const handleSignupComplete = () => setStep('setup');
  const handleSetupComplete = () => router.replace('/community');

  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" 
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050A] flex items-center justify-center font-sans overflow-hidden relative">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
          <motion.div 
              animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, 45, 0]
              }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full" 
          />
          <motion.div 
              animate={{ 
                  scale: [1.2, 1.4, 1.2],
                  opacity: [0.1, 0.3, 0.1],
                  rotate: [0, -45, 0]
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-purple-600/10 blur-[150px] rounded-full" 
          />
          {/* Noise/Grain Overlay for Premium Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="w-full max-w-md h-[100dvh] bg-transparent overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full"
            >
                {step === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}

                {step === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}

                {/* Auth Stack */}
                {step === 'landing' && <AuthLanding setView={(v) => setStep(v as FlowStep)} />}
                {step === 'login' && <LoginForm setView={(v) => setStep(v as FlowStep)} onComplete={handleLoginComplete} />}
                {step === 'signup' && <SignupForm setView={(v) => setStep(v as FlowStep)} onComplete={handleSignupComplete} />}
                {step === 'reset' && <ResetForm setView={(v) => setStep(v as FlowStep)} />}

                {/* Setup Stack */}
                {step === 'setup' && <SetupWizard onComplete={handleSetupComplete} />}
            </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
