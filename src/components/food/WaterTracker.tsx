"use client";

import React, { useState, useEffect } from 'react';
import { usePet } from '@/context/PetContext';
import { Droplets, Plus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WaterTracker() {
    const { activePet } = usePet();
    const [water, setWater] = useState(0);
    const [showLoggedSplash, setShowLoggedSplash] = useState(false);
    const [splashAmount, setSplashAmount] = useState(0);

    const todayStr = new Date().toISOString().split('T')[0];
    const petId = activePet?.id || 'default-pet';
    const storageKey = `moffi_water_${petId}_${todayStr}`;
    
    // Map target percentage or custom target
    // If activePet has water_target (default e.g. 80), map 80 * 15 = 1200 ml, or default to 1500 ml
    const targetWater = activePet && typeof activePet.water_target === 'number' 
        ? activePet.water_target * 15 
        : 1500;

    // Load initial data
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setWater(Number(saved));
        } else {
            setWater(0);
        }
    }, [storageKey]);

    const addWater = (amount: number) => {
        setWater(prev => {
            const next = prev + amount;
            localStorage.setItem(storageKey, String(next));
            // Trigger global sync event
            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
            return next;
        });
        setSplashAmount(amount);
        setShowLoggedSplash(true);
        setTimeout(() => setShowLoggedSplash(false), 1000);
    };

    const resetWater = () => {
        if (confirm("Bugünkü su tüketim verisini sıfırlamak istiyor musunuz?")) {
            setWater(0);
            localStorage.setItem(storageKey, '0');
            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        }
    };

    const percent = Math.min(100, Math.round((water / targetWater) * 100));

    return (
        <div className="w-full bg-white dark:bg-white/5 rounded-3xl border border-gray-150 dark:border-white/5 p-6 shadow-sm relative overflow-hidden">
            {/* Wave animation background representation */}
            <div className="absolute inset-x-0 bottom-0 bg-blue-500/5 dark:bg-blue-500/10 pointer-events-none transition-all duration-500" style={{ height: `${percent}%` }} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="font-black text-[16px] text-gray-800 dark:text-white flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-500" /> Su Takibi
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Günlük Hidrasyon Koçu</p>
                </div>
                {water > 0 && (
                    <button 
                        onClick={resetWater}
                        className="p-1.5 rounded-full hover:bg-gray-105 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors"
                        title="Sıfırla"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Circular Progress & Wave visualizer */}
            <div className="flex flex-col items-center py-6 relative z-10">
                <div className="relative w-36 h-36 rounded-full border-4 border-blue-50 dark:border-blue-950 flex flex-col items-center justify-center bg-white dark:bg-black shadow-inner overflow-hidden">
                    {/* Dynamic water height fill */}
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: `${100 - percent}%` }}
                        transition={{ type: 'spring', damping: 20, stiffness: 80 }}
                        className="absolute inset-0 bg-gradient-to-t from-blue-500 to-blue-400 opacity-20 dark:opacity-30 rounded-full"
                    />

                    {/* Confetti bubble for splash effect */}
                    <AnimatePresence>
                        {showLoggedSplash && (
                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                                animate={{ scale: 1.1, opacity: 1, y: -10 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="absolute text-xs font-black text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 border border-blue-150 px-2.5 py-1 rounded-full z-20 shadow-md"
                            >
                                +{splashAmount} ML 💧
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest relative z-10">Tüketilen</span>
                    <h4 className="text-3xl font-black text-gray-800 dark:text-white mt-1 relative z-10">{water} <span className="text-xs text-gray-400 font-bold">ML</span></h4>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 relative z-10">Hedef: {targetWater} ML ({percent}%)</span>
                </div>
            </div>

            {/* Logging Buttons */}
            <div className="grid grid-cols-3 gap-3.5 mt-2 relative z-10">
                {[
                    { label: "150 ml", amount: 150, desc: "Küçük Bardak" },
                    { label: "250 ml", amount: 250, desc: "Büyük Bardak" },
                    { label: "500 ml", amount: 500, desc: "Su Kabı" }
                ].map((btn, index) => (
                    <button
                        key={index}
                        onClick={() => addWater(btn.amount)}
                        className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100/50 dark:border-blue-900/30 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer group"
                    >
                        <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-125 transition-transform" />
                        <span className="text-[11.5px] font-black text-blue-700 dark:text-blue-300">{btn.label}</span>
                        <span className="text-[8.5px] text-blue-500/60 dark:text-blue-400/50 font-bold uppercase">{btn.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
