"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Moon, ArrowRight, Timer, Heart } from 'lucide-react';
import { useWellbeing } from '@/context/WellbeingContext';
import { cn } from '@/lib/utils';

export function WellbeingOverlay() {
    const { isLimitReached, ignoreLimitForNow, minutesUsed } = useWellbeing();

    return (
        <AnimatePresence>
            {isLimitReached && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                >
                    {/* Background Blur */}
                    <div className="absolute inset-0 bg-[#0A0A0E]/80 backdrop-blur-[40px]" />

                    {/* Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-[40px] p-8 text-center shadow-2xl overflow-hidden"
                    >
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-indigo-500/10 opacity-50" />

                        {/* Top Icon */}
                        <div className="relative mb-8 flex justify-center">
                            <div className="w-20 h-20 rounded-[30px] bg-gradient-to-tr from-amber-400 to-orange-600 p-[2px]">
                                <div className="w-full h-full rounded-[28px] bg-[#0A0A0E] flex items-center justify-center">
                                    <Coffee className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            
                            {/* Pulse effect */}
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl -z-10" 
                            />
                        </div>

                        {/* Title & Description */}
                        <div className="relative mb-8 space-y-3">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                Mola Zamanı <br/> Geldi ✨
                            </h2>
                            <p className="text-sm text-white/40 font-medium leading-relaxed">
                                Bugün tam <span className="text-white font-bold">{minutesUsed} dakika</span> boyunca Moffi Hub'daydın. Biraz dinlenmek sana ve dostuna iyi gelebilir.
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div className="relative grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5">
                                <Timer className="w-4 h-4 text-amber-400 mb-2 mx-auto" />
                                <span className="block text-[10px] font-black text-white/20 uppercase tracking-widest">Limit Doldu</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5">
                                <Heart className="w-4 h-4 text-pink-400 mb-2 mx-auto" />
                                <span className="block text-[10px] font-black text-white/20 uppercase tracking-widest">Sağlık Önce</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="relative space-y-3">
                            <button 
                                onClick={ignoreLimitForNow}
                                className="w-full py-5 rounded-3xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                15 Dakika Daha <ArrowRight className="w-4 h-4" />
                            </button>
                            
                            <button 
                                className="w-full py-5 rounded-3xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/5"
                            >
                                Uygulamayı Kapat
                            </button>
                        </div>

                        {/* Footer Hint */}
                        <p className="mt-8 text-[9px] font-bold text-white/10 uppercase tracking-widest italic">
                            Moffi Wellbeing Assistant • Sağlıklı Patiler
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
