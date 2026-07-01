"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoginForm, SignupForm, ResetForm } from "@/components/auth/AuthForms";
import { motion, AnimatePresence } from "framer-motion";

type FlowStep = 'loading' | 'login' | 'signup' | 'reset';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<FlowStep>('loading');

  // Session check — skip auth flow if already logged in
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace('/community');
    } else if (step === 'loading') {
      // Giriş yapmamış kullanıcıyı direkt Giriş (login) ekranına gönder
      setTimeout(() => setStep('login'), 0);
    }

  }, [user, isLoading, router, step]);

  const handleLoginComplete = () => router.replace('/community');
  const handleSignupComplete = () => router.replace('/community');

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
    <main className="min-h-screen bg-[#F5F7FB] flex items-center justify-center font-sans overflow-hidden relative">
      {/* Soft Pastel Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
          <motion.div 
              animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.25, 0.45, 0.25],
                  rotate: [0, 45, 0]
              }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-violet-300/30 blur-[120px] rounded-full" 
          />
          <motion.div 
              animate={{ 
                  scale: [1.15, 1.3, 1.15],
                  opacity: [0.2, 0.35, 0.2],
                  rotate: [0, -45, 0]
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-teal-200/35 blur-[150px] rounded-full" 
          />
          {/* Subtle Noise Overlay for Texture */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="w-full max-w-[440px] sm:max-h-[92vh] h-[100dvh] sm:h-auto bg-white/50 backdrop-blur-3xl border border-white/60 shadow-[0_32px_96px_rgba(31,38,135,0.06)] rounded-none sm:rounded-[3rem] relative z-10 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full flex flex-col overflow-hidden"
            >
                {/* Auth Stack */}
                {step === 'login' && <LoginForm setView={(v) => setStep(v as FlowStep)} onComplete={handleLoginComplete} />}
                {step === 'signup' && <SignupForm setView={(v) => setStep(v as FlowStep)} onComplete={handleSignupComplete} />}
                {step === 'reset' && <ResetForm setView={(v) => setStep(v as FlowStep)} />}
            </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
