"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PawPrint, Sparkles } from "lucide-react";

interface SplashProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashProps) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-transparent relative overflow-hidden">
            {/* Pulsing Core */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-full animate-pulse" />
                <div className="w-32 h-32 bg-gradient-to-tr from-[#5B4D9D] to-[#8B5CF6] rounded-[2.8rem] flex items-center justify-center shadow-[0_20px_50px_rgba(91,77,157,0.4)] relative z-10">
                    <PawPrint className="w-16 h-16 text-white" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-10 text-center z-10"
            >
                <h1 className="text-4xl font-black text-white tracking-widest uppercase italic italic leading-none">
                    Moffi <span className="text-cyan-400">Core</span>
                </h1>
                <div className="flex items-center justify-center gap-3 mt-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">
                    <Sparkles className="w-3 h-3" />
                    Sistem Başlatılıyor
                </div>
            </motion.div>

            {/* Scanning Line Effect */}
            <motion.div 
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-20"
            />
        </div>
    );
}
