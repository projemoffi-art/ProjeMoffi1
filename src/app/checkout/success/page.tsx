"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Package } from "lucide-react";
import { motion } from "framer-motion";
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {

    useEffect(() => {
        // Fire confetti on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen dark: font-sans flex items-center justify-center p-6 relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5B4D9D]/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-card dark:bg-[#1A1A1A] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/50 dark:border-card-border text-center relative z-10"
            >
                <div className="mb-8 relative inline-block">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 text-white mx-auto relative z-10"
                    >
                        <Check className="w-10 h-10" strokeWidth={4} />
                    </motion.div>
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                </div>

                <h1 className="text-3xl font-black text-foreground dark:text-white mb-2 leading-tight">Siparişin Alındı!</h1>
                <p className="text-gray-500 font-medium mb-8">
                    Teşekkürler Moffi Sever! Siparişin hazırlanmaya başladı. Takip numaranı SMS ile göndereceğiz.
                </p>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-card dark:bg-black rounded-xl flex items-center justify-center text-[#5B4D9D] shadow-moffi-card">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">Tahmini Teslimat</div>
                        <div className="font-bold text-foreground dark:text-white">12 - 14 Aralık</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/walk">
                        <button className="w-full py-4 bg-[#5B4D9D] text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                            Yürüyüşe Çık
                        </button>
                    </Link>
                    <Link href="/studio">
                        <button className="w-full py-4 bg-card dark:bg-black text-foreground dark:text-white border-2 border-transparent hover:border-card-border dark:hover:border-card-border rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            Ana Sayfaya Dön
                        </button>
                    </Link>
                </div>

            </motion.div>
        </main>
    );
}
