"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Quest, Badge, MonthlyResearch } from "@/context/QuestEngineContext";

// ─── Theme helper functions for high contrast & RPG aesthetic ────────────────
const getThemeTextColor = (category: string, isDark: boolean) => {
    const darkColors: Record<string, string> = {
        activity: '#ff8a75', // glowing coral
        social: '#60a5fa', // sky blue
        explore: '#c084fc', // amethyst
        pet: '#fbbf24', // golden sun
        health: '#34d399' // emerald rune
    };
    const lightColors: Record<string, string> = {
        activity: '#c2410c', // dark orange-700
        social: '#1d4ed8', // dark blue-700
        explore: '#6d28d9', // dark purple-700
        pet: '#b45309', // amber-800
        health: '#047857' // dark emerald-700
    };
    return isDark ? (darkColors[category] || '#ffffff') : (lightColors[category] || '#4c3522');
};

const getThemeBgColor = (category: string, isDark: boolean) => {
    const darkBgs: Record<string, string> = {
        activity: 'rgba(255,138,117,0.15)',
        social: 'rgba(96,165,250,0.15)',
        explore: 'rgba(192,132,252,0.15)',
        pet: 'rgba(251,191,36,0.15)',
        health: 'rgba(52,211,153,0.15)'
    };
    const lightBgs: Record<string, string> = {
        activity: '#ffedd5', // orange-100
        social: '#dbeafe', // blue-100
        explore: '#f3e8ff', // purple-100
        pet: '#fef3c7', // amber-100
        health: '#dcfce7' // emerald-100
    };
    return isDark ? (darkBgs[category] || 'rgba(255,255,255,0.08)') : (lightBgs[category] || '#fdfbf7');
};

const getThemeBorderColor = (category: string, isDark: boolean) => {
    const darkBorders: Record<string, string> = {
        activity: 'rgba(255,138,117,0.35)',
        social: 'rgba(96,165,250,0.35)',
        explore: 'rgba(192,132,252,0.35)',
        pet: 'rgba(251,191,36,0.35)',
        health: 'rgba(52,211,153,0.35)'
    };
    const lightBorders: Record<string, string> = {
        activity: '#fed7aa', // orange-200
        social: '#bfdbfe', // blue-200
        explore: '#e9d5ff', // purple-200
        pet: '#fde68a', // amber-200
        health: '#bbf7d0' // emerald-200
    };
    return isDark ? (darkBorders[category] || 'rgba(255,255,255,0.15)') : (lightBorders[category] || '#c0a684');
};


// ─── CONSTELLATION DOTS (Magic stardust in background) ───────────────────────
export function ConstellationBg() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    
    // Generate static stardust configuration
    const dots = Array.from({ length: 30 }, (_, i) => ({
        x: (i * 7.7) % 100, 
        y: (i * 13.3) % 100,
        size: (i % 3 === 0) ? 2 : 1,
        delay: (i * 0.15) % 3, 
        dur: 2 + (i % 3),
    }));
    
    if (!isDark) return null;
    
    return (
        <div className="absolute inset-0 overflow-hidden rounded-t-[2rem] pointer-events-none">
            {/* Ambient Purple & Blue Magical Mists */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.15, 1],
                    x: [-15, 15, -15],
                    y: [-10, 10, -10],
                    opacity: [0.12, 0.22, 0.12]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[90px]"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)' }}
            />
            <motion.div 
                animate={{ 
                    scale: [1.15, 1, 1.15],
                    x: [15, -15, 15],
                    y: [10, -10, 10],
                    opacity: [0.12, 0.25, 0.12]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
                className="absolute top-[35%] -right-32 w-96 h-96 rounded-full blur-[110px]"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)' }}
            />

            {dots.map((d, i) => (
                <motion.div key={i}
                    className="absolute rounded-full bg-purple-300"
                    style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
                    animate={{ opacity: [0.05, 0.45, 0.05] }}
                    transition={{ duration: d.dur, delay: d.delay, repeat: Infinity }}
                />
            ))}
        </div>
    );
}

// ─── QUEST ORBITAL RING (Astrolabe and Guild Compass) ─────────────────────────
export function QuestOrbitalRing({ pct, petImage, petName, dayNumber, todayPP, streak, completedCount, totalCount }: {
    pct: number; petImage?: string; petName?: string;
    dayNumber: number; todayPP: number; streak: number;
    completedCount: number; totalCount: number;
}) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const R_OUT = 88; const R_MID = 68; const R_IN = 50;
    const cOut = 2 * Math.PI * R_OUT;
    const cMid = 2 * Math.PI * R_MID;
    const cIn  = 2 * Math.PI * R_IN;

    // 8 milestones on the astrolabe compass
    const PAWS = Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 360 - 90;
        const rad = a * Math.PI / 180;
        return { x: Math.cos(rad) * (R_OUT + 14), y: Math.sin(rad) * (R_OUT + 14), filled: i < Math.round(pct / 100 * 8) };
    });

    return (
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 220, height: 220 }}>
            {/* Compass Ambient Glow backing */}
            <motion.div animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ 
                    background: isDark 
                        ? 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(6,182,212,0.1) 50%, transparent 70%)' 
                        : 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(99,102,241,0.05) 50%, transparent 70%)' 
                }}
            />

            <svg width="220" height="220" className="absolute">
                <defs>
                    <linearGradient id="qg1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#ef4444" /><stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                    <linearGradient id="qg2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="qg3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>

                {/* Rotating Astrolabe Outer Dial */}
                <motion.g 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }} 
                    style={{ transformOrigin: '110px 110px' }}
                >
                    <circle cx="110" cy="110" r="104" fill="none" stroke={isDark ? "rgba(168,85,247,0.25)" : "rgba(180,83,9,0.35)"} strokeWidth="1.5" strokeDasharray="3 9" />
                    {/* Direction pointers */}
                    <polygon points="110,3 107,9 113,9" fill={isDark ? "#c084fc" : "#b45309"} />
                    <polygon points="110,217 107,211 113,211" fill={isDark ? "#c084fc" : "#b45309"} />
                    <polygon points="3,110 9,107 9,113" fill={isDark ? "#c084fc" : "#b45309"} />
                    <polygon points="217,110 211,107 211,113" fill={isDark ? "#c084fc" : "#b45309"} />
                </motion.g>

                {/* Counter-rotating Inner Magic Seal */}
                <motion.g 
                    animate={{ rotate: -360 }} 
                    transition={{ duration: 65, repeat: Infinity, ease: "linear" }} 
                    style={{ transformOrigin: '110px 110px' }}
                >
                    <circle cx="110" cy="110" r="78" fill="none" stroke={isDark ? "rgba(6,182,212,0.15)" : "rgba(99,102,241,0.2)"} strokeWidth="1" strokeDasharray="6 4" />
                </motion.g>

                {/* Concentric Streaks: Streak Bar */}
                <circle cx="110" cy="110" r={R_OUT} fill="none" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(141,110,83,0.1)"} strokeWidth="8" />
                <motion.circle cx="110" cy="110" r={R_OUT} fill="none"
                    stroke="url(#qg1)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={cOut}
                    initial={{ strokeDashoffset: cOut }}
                    animate={{ strokeDashoffset: cOut * (1 - Math.min(1, streak / 30)) }}
                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: isDark ? 'drop-shadow(0 0 5px rgba(249,115,22,0.6))' : 'none' }}
                />

                {/* Mid Ring: Level / XP (Mystic Blue/Purple) */}
                <circle cx="110" cy="110" r={R_MID} fill="none" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(141,110,83,0.08)"} strokeWidth="7" />
                <motion.circle cx="110" cy="110" r={R_MID} fill="none"
                    stroke="url(#qg2)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={cMid}
                    initial={{ strokeDashoffset: cMid }}
                    animate={{ strokeDashoffset: cMid * (1 - pct / 100) }}
                    transition={{ duration: 1.3, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: isDark ? 'drop-shadow(0 0 4px rgba(139,92,246,0.5))' : 'none' }}
                />

                {/* Inner Ring: Daily Tasks (Nature Emerald) */}
                <circle cx="110" cy="110" r={R_IN} fill="none" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(141,110,83,0.08)"} strokeWidth="6" />
                <motion.circle cx="110" cy="110" r={R_IN} fill="none"
                    stroke="url(#qg3)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={cIn}
                    initial={{ strokeDashoffset: cIn }}
                    animate={{ strokeDashoffset: cIn * (1 - pct / 100) }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: isDark ? 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' : 'none' }}
                />

                {/* Milestones / Runes */}
                {PAWS.map(({ x, y, filled }, i) => (
                    <g key={i} transform={`translate(${110 + x},${110 + y})`}>
                        <circle r="7" fill={filled ? (isDark ? '#a855f7' : '#059669') : (isDark ? '#23183a' : '#faf6eb')}
                            stroke={filled ? (isDark ? '#d8b4fe' : '#34d399') : (isDark ? 'rgba(76,29,149,0.2)' : '#c0a684')} strokeWidth="1.5"
                            style={filled && isDark ? { filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' } : {}}
                        />
                        <text textAnchor="middle" dominantBaseline="central" fontSize="7" fill={filled ? '#ffffff' : (isDark ? '#6b21a8' : '#8d6e53')} className="font-sans font-black">
                            {filled ? '✦' : String(i + 1)}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Floating Portrait Shield Center */}
            <motion.div 
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Crown decoration */}
                <motion.div 
                    animate={{ y: [-0.5, 0.5, -0.5], rotate: [-4, 4, -4] }} 
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="text-2xl mb-[-5px] z-25 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                >
                    👑
                </motion.div>

                {/* Guild Astrolabe Frame */}
                <div className="relative w-[86px] h-[86px] flex items-center justify-center">
                    {/* Gilded frame backing */}
                    <div className={cn(
                        "absolute inset-0 rounded-full border-2 transition-all duration-300", 
                        isDark 
                            ? "border-purple-400 bg-[#160d2e] shadow-[0_0_20px_rgba(139,92,246,0.55)]" 
                            : "border-amber-600 bg-amber-50 shadow-[0_4px_12px_rgba(180,83,9,0.25)]"
                    )} />
                    
                    {/* Image frame */}
                    <div className={cn(
                        "relative w-[76px] h-[76px] rounded-full overflow-hidden border-2 z-10 transition-all duration-300", 
                        isDark ? "border-[#4c1d95]" : "border-amber-700"
                    )}>
                        {petImage ? (
                            <img src={petImage} alt={petName} className="w-full h-full object-cover scale-110" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-950 flex items-center justify-center text-3xl">🐾</div>
                        )}
                    </div>
                </div>

                {/* Day status badge */}
                <div className={cn(
                    "text-center mt-2 border-2 rounded-full px-3 py-0.5 backdrop-blur-md shadow-md z-10 transition-all duration-300", 
                    isDark 
                        ? "bg-[#140b27] border-purple-500/40 text-purple-200" 
                        : "bg-[#fdfbf7] border-[#8d6e53] text-[#624730]"
                )}>
                    <p className="text-[9px] font-black leading-none uppercase tracking-wider">{dayNumber}. Gün</p>
                    {todayPP > 0 && <p className="text-[8px] font-bold leading-none mt-0.5 text-amber-600 dark:text-amber-400">+{todayPP} PP</p>}
                </div>
            </motion.div>
        </div>
    );
}

// ─── CURVED TREASURE TRAIL MAP (NumberedRoadMap) ──────────────────────────────
export function NumberedRoadMap({ weeklyStamps, maxStamps }: { weeklyStamps: number; maxStamps: number }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const todayDOW = new Date().getDay();
    const todayIdx = todayDOW === 0 ? 6 : todayDOW - 1; // Mon=0

    const points = [
        { x: 6.8,  y: 64 }, // Day 1
        { x: 21.1, y: 45 }, // Day 2
        { x: 35.4, y: 31 }, // Day 3
        { x: 50,   y: 25 }, // Day 4
        { x: 64.5, y: 31 }, // Day 5
        { x: 78.8, y: 45 }, // Day 6
        { x: 93.1, y: 64 }, // Day 7
    ];

    return (
        <div className={cn(
            "relative w-full px-4 py-4 rounded-3xl border transition-all duration-300",
            isDark 
                ? "bg-[#100722]/60 border-purple-500/10 shadow-inner" 
                : "bg-[#faf6eb] border-[#c0a684]/50 shadow-[#9c8b74]/5 shadow-inner"
        )}>
            <p className={cn(
                "text-[8.5px] font-black uppercase tracking-[0.35em] text-center mb-5 transition-colors", 
                isDark ? "text-purple-400" : "text-[#8d6e53]"
            )}>
                📜 SERİ YOL HARİTASI
            </p>
            
            <div className="relative w-full h-16 min-h-[64px]">
                {/* SVG Treasure Dotted Line Path */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 350 70" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={isDark ? "rgba(168,85,247,0.15)" : "rgba(141,110,83,0.15)"} />
                            <stop offset="50%" stopColor={isDark ? "#06b6d4" : "#b45309"} />
                            <stop offset="100%" stopColor={isDark ? "rgba(249,115,22,0.15)" : "rgba(141,110,83,0.15)"} />
                        </linearGradient>
                    </defs>
                    <path 
                        d="M 24 45 Q 175 14 326 45" 
                        fill="none" 
                        stroke="url(#orbitGrad)" 
                        strokeWidth="3.5" 
                        strokeDasharray="6 8" 
                        strokeLinecap="round" 
                    />
                </svg>

                {/* Day Nodes */}
                {points.map((pt, i) => {
                    const isPast    = i < weeklyStamps;
                    const isCurrent = i === todayIdx;
                    const isLastDay = i === maxStamps - 1;

                    return (
                        <div 
                            key={i}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
                            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.25, rotate: isLastDay ? [0, -8, 8, -8, 8, 0] : 0 }}
                                animate={isCurrent ? {
                                    scale: [1, 1.15, 1],
                                    boxShadow: isDark 
                                        ? ['0 0 0px rgba(6,182,212,0)', '0 0 14px rgba(6,182,212,0.8)', '0 0 0px rgba(6,182,212,0)']
                                        : ['0 0 0px rgba(217,119,6,0)', '0 0 12px rgba(217,119,6,0.6)', '0 0 0px rgba(217,119,6,0)']
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 text-[10px] font-black transition-all cursor-pointer ${
                                    isPast
                                        ? isDark
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                            : 'bg-gradient-to-br from-emerald-600 to-teal-500 border-emerald-750 text-white shadow-[0_4px_8px_rgba(4,120,87,0.3)]'
                                        : isCurrent
                                            ? isDark
                                                ? 'bg-gradient-to-br from-cyan-500 to-purple-600 border-cyan-300 text-white scale-110 shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                                                : 'bg-gradient-to-br from-amber-500 to-yellow-400 border-amber-600 text-white scale-110 shadow-[0_4px_10px_rgba(217,119,6,0.4)]'
                                            : isDark 
                                                ? 'bg-[#150f24] border-purple-500/20 text-purple-400/40' 
                                                : 'bg-[#ede5cc] border-[#c0a684] text-[#8d6e53]/55'
                                }`}
                            >
                                {isLastDay ? (
                                    <motion.span 
                                        animate={!isPast ? { rotate: [-5, 5, -5] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-base select-none animate-[bounce_1.5s_infinite]"
                                    >
                                        {isPast ? '🎁' : '🧰'}
                                    </motion.span>
                                ) : (
                                    isPast ? (
                                        <span className="text-xs select-none">🐾</span>
                                    ) : isCurrent ? (
                                        <span className="text-xs select-none">🧭</span>
                                    ) : (
                                        <span className="text-[8.5px] font-black">{i + 1}</span>
                                    )
                                )}
                            </motion.div>
                            
                            <span className={`text-[7px] font-black leading-none uppercase tracking-wider ${
                                isCurrent 
                                    ? isDark ? 'text-cyan-400 font-extrabold' : 'text-[#b45309] font-extrabold' 
                                    : isPast ? 'text-emerald-500' : (isDark ? 'text-purple-400/30' : 'text-[#8d6e53]/55')
                            }`}>
                                {isCurrent ? 'Bugün' : `G${i + 1}`}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center mt-3">
                <span className={cn(
                    "text-[8.5px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border transition-colors", 
                    isDark 
                        ? "text-cyan-400 bg-cyan-950/40 border-cyan-500/20" 
                        : "text-[#624730] bg-[#e7dec4]/50 border-[#c0a684]/45"
                )}>
                    ✨ HAFTALIK BAŞARI: {weeklyStamps} / {maxStamps} GÜN
                </span>
            </div>
        </div>
    );
}

// ─── CATEGORY CONSTANTS ──────────────────────────────────────────────────────
const CAT_THEME: Record<string, { grad: string; glow: string; label: string; icon: string; text: string; bg: string }> = {
    activity: { grad: 'from-[#ffb09c] to-[#ffcfb4]',  glow: 'rgba(255,176,156,0.18)',  label: 'Aktivite', icon: '🚶', text: '#ffb09c', bg: 'rgba(255,176,156,0.1)' },
    social:   { grad: 'from-[#a1c4fd] to-[#c2e9fb]',  glow: 'rgba(161,196,253,0.18)',  label: 'Sosyal',   icon: '🤝', text: '#a1c4fd', bg: 'rgba(161,196,253,0.1)' },
    explore:  { grad: 'from-[#e0c3fc] to-[#8ec5fc]',  glow: 'rgba(224,195,252,0.18)',  label: 'Keşif',    icon: '🔭', text: '#e0c3fc', bg: 'rgba(224,195,252,0.1)' },
    pet:      { grad: 'from-[#fde08e] to-[#fef9db]',  glow: 'rgba(253,224,142,0.18)',  label: 'Pet',      icon: '🐾', text: '#fde08e', bg: 'rgba(253,224,142,0.1)' },
    health:   { grad: 'from-[#c1dfc4] to-[#deecdd]',  glow: 'rgba(193,223,196,0.18)',  label: 'Sağlık',   icon: '❤️', text: '#c1dfc4', bg: 'rgba(193,223,196,0.1)' },
};

// ─── PANEL QUEST CARD (List component) ───────────────────────────────────────
export function PanelQuestCard({ quest, index, onManualComplete }: {
    quest: Quest; index: number; onManualComplete?: (id: string) => void;
}) {
    const { theme: appTheme } = useTheme();
    const isDark = appTheme === "dark";
    const router = useRouter();
    const theme = CAT_THEME[quest.category] || CAT_THEME.explore;
    const isCompleted = !!quest.completedAt;
    const pct = Math.min(100, (quest.current / Math.max(0.001, quest.target)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18, delay: index * 0.05 }}
            className={cn(
                "rounded-2xl border-2 overflow-hidden transition-all duration-300 relative",
                isCompleted 
                    ? isDark 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-emerald-600/35 bg-[#f0fbf6]'
                    : isDark 
                        ? 'border-purple-500/10 bg-[#140b24]/60' 
                        : 'border-[#c0a684]/40 bg-[#fdfbf7]'
            )}
            style={{ 
                boxShadow: isCompleted 
                    ? isDark ? '0 0 12px rgba(16,185,129,0.1)' : '0 2px 6px rgba(16,185,129,0.05)' 
                    : isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(141,110,83,0.08)'
            }}
        >
            {/* Scroll leather lining at the top in Light Mode */}
            {!isDark && !isCompleted && (
                <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-[#8d6e53] to-amber-700 opacity-60" />
            )}

            <div className="p-3.5 flex items-center gap-3">
                <div className={cn(
                    "w-9.5 h-9.5 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-colors", 
                    isCompleted 
                        ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-100 border-emerald-200" 
                        : isDark ? "bg-purple-950/60 border-purple-500/25" : "bg-[#ede5cc] border-[#c0a684]"
                )}>
                    {isCompleted ? '✅' : quest.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-[10px] font-black leading-tight truncate transition-colors", 
                        isCompleted 
                            ? "text-emerald-600/70 dark:text-emerald-400/60 line-through" 
                            : isDark ? "text-purple-100" : "text-[#4c3522]"
                    )}>
                        {quest.title}
                    </p>
                    <p className={cn(
                        "text-[8.5px] font-bold mt-0.5 leading-tight line-clamp-1 transition-colors", 
                        isDark ? "text-purple-300/40" : "text-[#8d6e53]/75"
                    )}>
                        {quest.description}
                    </p>
                    
                    {/* Quest linear progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                            "flex-1 h-1.5 rounded-full overflow-hidden border transition-colors", 
                            isDark ? "bg-purple-950/80 border-purple-900/20" : "bg-[#ede5cc] border-[#c0a684]/20"
                        )}>
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    isCompleted 
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                        : isDark 
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                            : 'bg-gradient-to-r from-amber-500 to-amber-650'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                        <span 
                            className="text-[8px] font-black shrink-0 font-mono" 
                            style={{ color: getThemeTextColor(quest.category, isDark) }}
                        >
                            +{quest.reward.pp} PP
                        </span>
                    </div>
                </div>

                {/* Percentage complete box */}
                <div className={cn(
                    "px-2.5 py-1.5 rounded-xl font-mono text-[9.5px] font-black text-center shrink-0 min-w-[38px] border transition-colors", 
                    isCompleted 
                        ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-100 border-emerald-250 text-emerald-700" 
                        : isDark ? "bg-purple-950/60 border-purple-900/30 text-purple-300" : "bg-[#ede5cc]/60 border-[#c0a684]/35 text-[#624730]"
                )}>
                    {Math.round(pct)}%
                </div>
            </div>
            
            {/* Action buttons */}
            {!isCompleted && (
                <div className="px-3 pb-3">
                    {quest.type === 'manual' && onManualComplete ? (
                        <button
                            onClick={() => onManualComplete(quest.id)}
                            className={cn(
                                "w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all duration-300 cursor-pointer",
                                isDark 
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30" 
                                    : "bg-gradient-to-r from-[#b45309] to-[#854d0e] hover:from-amber-600 hover:to-amber-700 text-white border border-[#78350f]"
                            )}
                        >
                            Tamamladım ✓
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (quest.category === 'activity' || quest.category === 'explore') {
                                    window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                } else if (quest.category === 'social') {
                                    router.push('/community');
                                } else {
                                    window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                }
                            }}
                            className={cn(
                                "w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all duration-300 cursor-pointer",
                                isDark 
                                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30" 
                                    : "bg-[#fdfbf7] border-2 border-[#8d6e53] text-[#624730] hover:bg-[#ede5cc]"
                            )}
                        >
                            {quest.category === 'activity' || quest.category === 'explore' ? '🚶 Yürüyüşe Başla' :
                             quest.category === 'social' ? '🤝 Topluluğa Git' : '🐾 Tamamla'}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// ─── QUEST CAROUSEL (Wanted Scrolls & Slabs) ──────────────────────────────────
interface QuestCarouselProps {
    quests: Quest[];
    onManualComplete?: (id: string) => void;
}

export function QuestCarousel({ quests, onManualComplete }: QuestCarouselProps) {
    const { theme: appTheme } = useTheme();
    const isDark = appTheme === "dark";
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!quests || quests.length === 0) {
        return <div className={cn("text-center py-10 text-xs transition-colors", isDark ? "text-purple-400/30" : "text-slate-400")}>Görev bulunamadı...</div>;
    }

    const safeIndex = currentIndex >= quests.length ? 0 : currentIndex;
    const currentQuest = quests[safeIndex];
    if (!currentQuest) return null;
    const theme = CAT_THEME[currentQuest.category] || CAT_THEME.explore;
    const isCompleted = !!currentQuest.completedAt;
    const pct = Math.min(100, (currentQuest.current / Math.max(0.001, currentQuest.target)) * 100);

    const handleDragEnd = (_event: unknown, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            setCurrentIndex(prev => (prev + 1) % quests.length);
        } else if (info.offset.x > swipeThreshold) {
            setCurrentIndex(prev => (prev - 1 + quests.length) % quests.length);
        }
    };

    return (
        <div className="flex flex-col items-center w-full select-none">
            {/* Card slider frame */}
            <div className="relative w-full max-w-[310px] sm:max-w-[340px] h-auto min-h-[360px] flex flex-col items-center justify-center overflow-visible my-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuest.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.5}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.92, x: 40 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.92, x: -40 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 240 }}
                        className={cn(
                            "absolute w-full h-full rounded-[2.5rem] border-2 p-6 pt-10 flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300", 
                            isCompleted 
                                ? isDark 
                                    ? 'border-emerald-500/30 bg-[#0c1a17] backdrop-blur-xl' 
                                    : 'border-emerald-600 bg-[#f4fcf8] shadow-md shadow-emerald-700/5' 
                                : isDark 
                                    ? 'border-purple-500/20 bg-[#160e28] backdrop-blur-xl' 
                                    : 'border-2 border-[#8d6e53] bg-[#fdfbf7] shadow-xl shadow-[#8d6e53]/5'
                        )}
                        style={{
                            boxShadow: isCompleted 
                                ? isDark ? '0 12px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 8px 20px rgba(16,185,129,0.06)' 
                                : isDark ? '0 16px 36px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 12px 28px rgba(141,110,83,0.15)'
                        }}
                    >
                        {/* Bounty Scroll Header Dowel in Light Mode */}
                        {!isDark && (
                            <div className="absolute top-0 inset-x-0 h-7.5 bg-gradient-to-r from-[#8d6e53] via-[#a18269] to-[#624730] flex items-center justify-center shadow-md">
                                <span className="text-[8.5px] font-black tracking-[0.25em] text-[#fdfbf7]">LONCA BOUNTY SÖZLEŞMESİ</span>
                            </div>
                        )}

                        {/* Cauldron/Runic header in Dark Mode */}
                        {isDark && (
                            <div className="absolute top-0 inset-x-0 h-7.5 bg-gradient-to-r from-[#3b0764] via-[#5b21b6] to-[#1e1b4b] flex items-center justify-center shadow-md border-b border-purple-500/10">
                                <span className="text-[8.5px] font-black tracking-[0.25em] text-purple-200 animate-pulse">EFSUNLU GÖREV TABLETİ</span>
                            </div>
                        )}

                        {/* Card Glow */}
                        <div 
                            className="absolute -top-24 -right-24 w-44 h-44 rounded-full blur-[50px] opacity-20 pointer-events-none"
                            style={{ backgroundColor: isCompleted ? '#10b981' : theme.text }}
                        />

                        {/* Top Badge */}
                        <div className="flex justify-between items-center z-10 mt-1">
                            <span className={cn(
                                "text-[7.5px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border transition-colors", 
                                isCompleted 
                                    ? isDark ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400" : "bg-emerald-100 border-emerald-250 text-emerald-700" 
                                    : isDark ? "bg-purple-950/60 border-purple-900/30 text-purple-300" : "bg-[#ede5cc] border-[#c0a684]/60 text-[#624730]"
                            )}>
                                {isCompleted ? '✓ Kontrat Tamam' : `${theme.label} Görevi`}
                            </span>
                            
                            <span 
                                className="text-[8.5px] font-black px-2 py-0.5 rounded-lg shrink-0 font-mono border"
                                style={{
                                    color: isCompleted ? (isDark ? '#34d399' : '#047857') : getThemeTextColor(currentQuest.category, isDark),
                                    backgroundColor: isCompleted ? (isDark ? 'rgba(16,185,129,0.1)' : '#dcfce7') : getThemeBgColor(currentQuest.category, isDark),
                                    borderColor: isCompleted ? (isDark ? 'rgba(16,185,129,0.2)' : '#bbf7d0') : getThemeBorderColor(currentQuest.category, isDark)
                                }}
                            >
                                +{currentQuest.reward.pp} PP
                            </span>
                        </div>

                        {/* Icon Sigil */}
                        <div className="relative flex flex-col items-center justify-center py-3.5 z-10">
                            <motion.div 
                                animate={isCompleted ? {} : { scale: [1, 1.08, 1], y: [-2, 2, -2] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className={cn(
                                    "w-22 h-22 rounded-full flex items-center justify-center text-4xl shadow-inner relative border transition-colors", 
                                    isCompleted 
                                        ? isDark ? "bg-emerald-950/40 border-emerald-500/30" : "bg-emerald-100 border-emerald-200" 
                                        : isDark ? "bg-[#1f1638] border-purple-500/25" : "bg-[#ede5cc] border-[#c0a684]"
                                )}
                            >
                                <div className="absolute inset-0 rounded-full bg-inherit filter blur-md opacity-40" />
                                <span className="relative z-10 filter drop-shadow-md">{isCompleted ? '✅' : currentQuest.icon}</span>
                            </motion.div>
                        </div>

                        {/* Title & Desc */}
                        <div className="text-center px-2 z-10 space-y-1">
                            <h3 className={cn(
                                "text-sm font-black uppercase tracking-wide leading-tight transition-colors", 
                                isCompleted ? "text-emerald-600/70 dark:text-emerald-400/50 line-through" : isDark ? "text-white" : "text-[#4c3522]"
                            )}>
                                {currentQuest.title}
                            </h3>
                            <p className={cn(
                                "text-[9.5px] font-bold leading-normal max-w-[210px] mx-auto transition-colors", 
                                isDark ? "text-purple-300/40" : "text-[#8d6e53]"
                            )}>
                                {currentQuest.description}
                            </p>
                        </div>

                        {/* Runic wax completed seal */}
                        {isCompleted && (
                            <motion.div 
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: -12 }}
                                className={cn(
                                    "absolute right-4 top-16 z-25 border-4 font-black text-[10px] uppercase tracking-[0.25em] px-3.5 py-1 rounded-xl rotate-[-12deg] select-none pointer-events-none font-serif shadow-md",
                                    isDark 
                                        ? "border-emerald-400/60 text-emerald-400 bg-emerald-950/20 backdrop-blur-[2px]" 
                                        : "border-[#dc2626]/80 text-[#dc2626] bg-[#fef2f2]/10 backdrop-blur-[2px]"
                                )}
                            >
                                MÜHÜRLENDİ
                            </motion.div>
                        )}

                        {/* Progress and CTA Button */}
                        <div className="w-full space-y-4.5 z-10">
                            <div className="px-1">
                                <div className={cn("flex justify-between text-[7px] font-black mb-1 transition-colors", isDark ? "text-purple-400/40" : "text-[#8d6e53]/70")}>
                                    <span>GÖREV İLERLEMESİ ({Math.round(pct)}%)</span>
                                    <span className="font-mono">{currentQuest.current}/{currentQuest.target}</span>
                                </div>
                                <div className={cn(
                                    "h-2.5 rounded-full overflow-hidden border transition-colors", 
                                    isDark ? "bg-[#0b0616] border-purple-900/20" : "bg-[#ede5cc] border-[#c0a684]/30"
                                )}>
                                    <motion.div
                                        className={cn(
                                            "h-full rounded-full",
                                            isCompleted 
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                                : isDark 
                                                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500' 
                                                    : 'bg-gradient-to-r from-amber-600 to-[#b45309]'
                                        )}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={!isCompleted && isDark ? { boxShadow: `0 0 8px rgba(168,85,247,0.5)` } : {}}
                                    />
                                </div>
                            </div>

                            {!isCompleted ? (
                                currentQuest.type === 'manual' && onManualComplete ? (
                                    <button
                                        onClick={() => onManualComplete(currentQuest.id)}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md active:scale-[0.97] transition-all duration-300 cursor-pointer",
                                            isDark 
                                                ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border border-purple-400/30" 
                                                : "bg-gradient-to-r from-amber-600 to-[#b45309] text-white border border-[#78350f]"
                                        )}
                                    >
                                        Tamamladım ✓
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (currentQuest.category === 'activity' || currentQuest.category === 'explore') {
                                                window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                            } else if (currentQuest.category === 'social') {
                                                router.push('/community');
                                            } else {
                                                window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                            }
                                        }}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md active:scale-[0.97] transition-all duration-300 cursor-pointer",
                                            isDark 
                                                ? "bg-[#251b47] hover:bg-[#31255c] border-2 border-purple-500/40 text-purple-200" 
                                                : "bg-[#fdfbf7] border-2 border-[#8d6e53] text-[#624730] hover:bg-[#ede5cc]"
                                        )}
                                    >
                                        {currentQuest.category === 'activity' || currentQuest.category === 'explore' ? '🚶 Yürüyüşe Başla' :
                                         currentQuest.category === 'social' ? '🤝 Topluluğa Git' : '🐾 Tamamla'}
                                    </button>
                                )
                            ) : (
                                <div className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center text-emerald-450 text-[8.5px] font-black uppercase tracking-widest">
                                    ÖDÜL TOPLANDI 🏆
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Indicator dots */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
                <div className="flex gap-1.5">
                    {quests.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300", 
                                idx === safeIndex 
                                    ? "w-4 bg-purple-500 dark:bg-purple-400" 
                                    : isDark ? "w-1.5 bg-purple-950 border border-purple-800/40" : "w-1.5 bg-[#ede5cc] border border-[#c0a684]/40"
                            )}
                        />
                    ))}
                </div>
                <p className={cn(
                    "text-[7px] font-black uppercase tracking-[0.2em] animate-pulse transition-colors", 
                    isDark ? "text-purple-400/35" : "text-[#8d6e53]/50"
                )}>
                    SAĞA / SOLA KAYDIRARAK GÖZ AT
                </p>
            </div>
        </div>
    );
}

// ─── BADGE PANEL (Artifact Collection Showcase) ──────────────────────────────
export function BadgePanel({ badges, earnedBadges }: { badges: Badge[]; earnedBadges: Badge[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const earnedIds = new Set(earnedBadges.map(b => b.id));
    const sorted = [...badges].sort((a, b) => {
        if (earnedIds.has(a.id) && !earnedIds.has(b.id)) return -1;
        if (!earnedIds.has(a.id) && earnedIds.has(b.id)) return 1;
        return 0;
    });

    return (
        <div className="grid grid-cols-3 gap-2.5">
            {sorted.map(badge => {
                const earned = earnedIds.has(badge.id);
                
                const rarityBg = 
                    badge.rarity === 'legendary' 
                        ? isDark ? 'bg-gradient-to-b from-[#3b0764] to-[#12071d] border-yellow-400/40 text-yellow-400' : 'bg-gradient-to-b from-[#fef3c7] to-[#fef08a] border-yellow-650 text-yellow-950'
                        : badge.rarity === 'epic'
                            ? isDark ? 'bg-gradient-to-b from-[#1e1b4b] to-[#0b0c15] border-purple-500/40 text-purple-400' : 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] border-purple-650 text-purple-950'
                            : badge.rarity === 'rare'
                                ? isDark ? 'bg-gradient-to-b from-[#0c4a6e] to-[#020617] border-blue-400/40 text-blue-400' : 'bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] border-blue-650 text-blue-950'
                                : isDark ? 'bg-[#150f24] border-purple-500/10 text-purple-200' : 'bg-[#fdfbf7] border-[#c0a684] text-[#624730]';

                const rarityShadow = 
                    earned
                        ? badge.rarity === 'legendary' 
                            ? isDark ? '0 0 15px rgba(234,179,8,0.25)' : '0 4px 10px rgba(217,119,6,0.15)'
                            : badge.rarity === 'epic'
                                ? isDark ? '0 0 12px rgba(168,85,247,0.2)' : '0 4px 8px rgba(139,92,246,0.1)'
                                : '0 2px 6px rgba(0,0,0,0.05)'
                        : 'none';

                return (
                    <motion.div 
                        key={badge.id} 
                        whileHover={{ scale: earned ? 1.05 : 1 }}
                        className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden", 
                            earned ? rarityBg : (isDark ? 'bg-black/40 border-purple-950/20 opacity-30' : 'bg-[#ede5cc]/50 border-[#c0a684]/35 opacity-40')
                        )}
                        style={{ boxShadow: rarityShadow }}
                    >
                        {earned && (badge.rarity === 'legendary' || badge.rarity === 'epic') && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite] pointer-events-none" />
                        )}

                        <div className={cn(
                            "w-10.5 h-10.5 rounded-2xl flex items-center justify-center text-2xl border transition-colors", 
                            earned 
                                ? isDark ? "bg-[#0b0616] border-purple-500/20" : "bg-[#fdfbf7] border-[#c0a684]/30" 
                                : isDark ? "bg-black/60 border-purple-950/40" : "bg-[#ede5cc]/40 border-[#c0a684]/50"
                        )}>
                            {earned ? badge.icon : <Lock className="w-4.5 h-4.5 text-purple-950/60 dark:text-purple-400/20" />}
                        </div>
                        <p className={cn(
                            "text-[8.5px] font-black uppercase tracking-wide leading-tight transition-colors", 
                            earned ? (isDark ? "text-purple-100" : "text-[#4c3522]") : (isDark ? "text-purple-400/20" : "text-[#8d6e53]/35")
                        )}>
                            {earned ? badge.name : 'KİLİTLİ'}
                        </p>
                        {earned && (
                            <span className={cn(
                                "text-[6.5px] font-black px-1.5 py-0.5 rounded-full border leading-none uppercase tracking-widest",
                                badge.rarity === 'legendary' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                badge.rarity === 'epic' ? 'bg-purple-500/10 border-purple-500/20 text-purple-650 dark:text-purple-400' :
                                badge.rarity === 'rare' ? 'bg-blue-500/10 border-blue-500/20 text-blue-650 dark:text-blue-400' :
                                'bg-purple-950/20 border-purple-900/10 text-purple-400 dark:text-purple-400/50'
                            )}>
                                {badge.rarity === 'legendary' ? 'Efsanevi' : badge.rarity === 'epic' ? 'Epik' : badge.rarity === 'rare' ? 'Nadir' : 'Yaygın'}
                            </span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

// ─── RESEARCH PANEL (Alchemy Lab Recipes Ledger) ──────────────────────────────
export function ResearchPanel({ research }: { research: MonthlyResearch }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const currentStage = research.stages[research.currentStageIndex];
    const completedStages = research.stages.filter(s => s.completedAt).length;

    return (
        <div className="space-y-4">
            {/* Alchemy Lab header block */}
            <div className={cn(
                "border-2 rounded-3xl p-4.5 transition-all duration-300 relative overflow-hidden", 
                isDark 
                    ? "bg-gradient-to-r from-[#170c3a] via-[#10072b] to-[#07051b] border-purple-500/25 shadow-inner" 
                    : "bg-gradient-to-r from-[#ede5cc] to-[#faf6eb] border-[#c0a684] shadow-inner"
            )}>
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500/15 text-[8px] font-black uppercase tracking-widest text-purple-400 dark:text-purple-300 rounded-bl-xl border-l border-b border-purple-500/10">
                    SİMYA TARİFİ
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl filter drop-shadow">🔮</span>
                    <div>
                        <h4 className={cn(
                            "text-[11.5px] font-black uppercase tracking-wide leading-tight transition-colors", 
                            isDark ? "text-purple-200" : "text-[#4c3522]"
                        )}>
                            {(research.name || '').replace(/🔬|🔭|🧪/g, '')} ARAŞTIRMASI
                        </h4>
                        <p className={cn(
                            "text-[8px] font-extrabold mt-0.5 uppercase tracking-wider transition-colors", 
                            isDark ? "text-purple-400/70" : "text-[#8d6e53]"
                        )}>
                            {completedStages} / {research.stages.length} AŞAMA MÜHÜRLENDİ
                        </p>
                    </div>
                </div>

                {/* Bubbling alchemy stage line */}
                <div className="flex items-center gap-1.5 px-1">
                    {research.stages.map((s, i) => {
                        const isDone = !!s.completedAt;
                        const isCurrent = i === research.currentStageIndex;

                        return (
                            <React.Fragment key={s.id}>
                                <div className={cn(
                                    "w-8.5 h-8.5 rounded-full flex items-center justify-center text-base font-black border-2 transition-all duration-300", 
                                    isDone 
                                        ? isDark 
                                            ? "bg-emerald-950 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                                            : "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                                        : isCurrent 
                                            ? isDark 
                                                ? "bg-purple-900/40 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]" 
                                                : "bg-[#fdfbf7] border-amber-600 text-amber-700 shadow-md" 
                                            : isDark 
                                                ? "bg-black/50 border-purple-950 text-purple-450/40" 
                                                : "bg-[#ede5cc]/60 border-[#c0a684]/60 text-[#8d6e53]/55"
                                )}>
                                    {isDone ? '✓' : s.emoji || '🧪'}
                                </div>
                                {i < research.stages.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-1 rounded-full transition-colors", 
                                        i < research.currentStageIndex 
                                            ? "bg-emerald-500" 
                                            : isDark ? "bg-purple-950 border border-purple-900/10" : "bg-[#ede5cc] border border-[#c0a684]/30"
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Current details stage ledger */}
            {currentStage && (
                <div className={cn(
                    "border-2 rounded-3xl p-4.5 space-y-3 transition-colors", 
                    isDark ? "bg-[#120725]/60 border-purple-500/10" : "bg-[#fdfbf7] border-[#c0a684]/40"
                )}>
                    <div className="flex items-center gap-2 pb-1 border-b border-dashed border-[#c0a684]/30 dark:border-purple-500/10">
                        <span className="text-base">{currentStage.emoji}</span>
                        <h5 className={cn(
                            "text-[10px] font-black uppercase tracking-wider transition-colors", 
                            isDark ? "text-purple-300" : "text-[#624730]"
                        )}>
                            AŞAMA {research.currentStageIndex + 1}: {currentStage.title}
                        </h5>
                    </div>

                    {/* Stage tasks */}
                    <div className="space-y-2.5">
                        {currentStage.tasks.map(task => (
                            <div 
                                key={task.id} 
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl border transition-colors", 
                                    task.completed 
                                        ? isDark 
                                            ? 'bg-emerald-950/20 border-emerald-500/25' 
                                            : 'bg-emerald-50/70 border-emerald-500/35' 
                                        : isDark 
                                            ? 'bg-black/30 border-purple-950/30' 
                                            : 'bg-[#ede5cc]/40 border-[#c0a684]/35'
                                )}
                            >
                                <span className="text-base shrink-0 filter drop-shadow">{task.completed ? '✅' : task.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-[9.5px] font-bold leading-tight transition-colors truncate", 
                                        task.completed 
                                            ? "text-emerald-600/70 dark:text-emerald-400/60 line-through" 
                                            : isDark ? "text-purple-200" : "text-[#4c3522]"
                                    )}>
                                        {task.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className={cn(
                                            "flex-1 h-1.5 rounded-full overflow-hidden transition-colors", 
                                            isDark ? "bg-[#0b0616]" : "bg-[#ede5cc]"
                                        )}>
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full",
                                                    task.completed 
                                                        ? 'bg-emerald-500' 
                                                        : isDark ? 'bg-purple-500' : 'bg-[#b45309]'
                                                )} 
                                                style={{ width: `${Math.min(100, (task.current / task.target) * 100)}%` }} 
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-[7px] font-black font-mono leading-none transition-colors", 
                                            isDark ? "text-purple-400/50" : "text-[#8d6e53]/70"
                                        )}>
                                            {Math.min(task.current, task.target)}/{task.target}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked stages */}
            {research.stages.slice(research.currentStageIndex + 1).map((stage, i) => (
                <div 
                    key={stage.id} 
                    className={cn(
                        "border-2 rounded-2xl p-3 flex items-center gap-3 opacity-35 transition-colors", 
                        isDark ? "bg-[#110620]/30 border-purple-950/20" : "bg-[#ede5cc]/30 border-[#c0a684]/35"
                    )}
                >
                    <Lock className="w-4 h-4 shrink-0 text-[#8d6e53] dark:text-purple-500" />
                    <p className={cn(
                        "text-[9px] font-black uppercase tracking-wider transition-colors", 
                        isDark ? "text-purple-400/50" : "text-[#8d6e53]/60"
                    )}>
                        KİLİTLİ TARİF AŞAMA {research.currentStageIndex + i + 2}: {stage.title}
                    </p>
                </div>
            ))}
        </div>
    );
}
