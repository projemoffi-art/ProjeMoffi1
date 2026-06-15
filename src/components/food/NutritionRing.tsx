"use client";

import React from 'react';
import { Flame, Activity, Sparkles } from 'lucide-react';

interface NutritionRingProps {
    calories: number;
    target: number;
    burned: number;
}

export function NutritionRing({ calories, target, burned }: NutritionRingProps) {
    const netCalories = Math.max(0, calories - burned);
    const percent = Math.min(100, Math.round((calories / target) * 100));

    // SVG parameters
    const radius = 50;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className="w-full bg-white dark:bg-white/5 rounded-3xl border border-gray-150 dark:border-white/5 p-6 shadow-sm flex flex-col items-center">
            
            <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <defs>
                        <linearGradient id="caloriesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F97316" />
                            <stop offset="100%" stopColor="#EA580C" />
                        </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle 
                        cx="60" 
                        cy="60" 
                        r={radius} 
                        fill="none" 
                        stroke="#FFF7ED" 
                        className="dark:stroke-orange-950/20"
                        strokeWidth={strokeWidth} 
                    />
                    {/* Active ring */}
                    <circle 
                        cx="60" 
                        cy="60" 
                        r={radius} 
                        fill="none" 
                        stroke="url(#caloriesGrad)" 
                        strokeWidth={strokeWidth} 
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                </svg>

                {/* Inner label */}
                <div className="absolute flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Kalori</span>
                    <h2 className="text-3xl font-black text-gray-800 dark:text-white mt-0.5">{netCalories}</h2>
                    <span className="text-[9.5px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">Hedef: {target} kcal</span>
                </div>
            </div>

            {/* Sub-metrics: Alınan & Yakılan */}
            <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-5 border-t border-gray-100 dark:border-white/5 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2">
                        <Flame className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Alınan</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white mt-0.5">{calories} kcal</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                        <Activity className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Egzersiz / Yakılan</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white mt-0.5">{burned} kcal</span>
                </div>
            </div>

            {/* Sparkle note banner */}
            <div className="w-full mt-5 bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/10 p-3.5 rounded-2xl flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 leading-snug">
                    Bugünkü öğünler ve egzersiz oranına göre kalori dengesi kusursuz düzeyde!
                </span>
            </div>
        </div>
    );
}
