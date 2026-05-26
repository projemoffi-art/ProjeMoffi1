"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Lock, Shield } from "lucide-react";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { useLiveEvents } from "@/context/LiveEventsContext";
import { usePet } from "@/context/PetContext";
import { useRouter } from "next/navigation";
import type { Quest, Badge, MonthlyResearch } from "@/context/QuestEngineContext";

// ─── CONSTELLATION DOTS (arka plan yıldızlar) ────────────────────────────────
export function ConstellationBg() {
    const dots = Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        delay: Math.random() * 3, dur: 2 + Math.random() * 2,
    }));
    return (
        <div className="absolute inset-0 overflow-hidden rounded-t-[2rem] pointer-events-none">
            {/* Ambient Nebula Glows */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [-10, 10, -10],
                    y: [-10, 10, -10],
                    opacity: [0.15, 0.3, 0.15]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[80px]"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }}
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    x: [10, -10, 10],
                    y: [10, -10, 10],
                    opacity: [0.15, 0.35, 0.15]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute top-[40%] -right-24 w-96 h-96 rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)' }}
            />

            {dots.map((d, i) => (
                <motion.div key={i}
                    className="absolute rounded-full bg-white"
                    style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
                    animate={{ opacity: [0.05, 0.4, 0.05] }}
                    transition={{ duration: d.dur, delay: d.delay, repeat: Infinity }}
                />
            ))}
        </div>
    );
}

// ─── ORBITAL RING — REFERANS GÖRSELİYLE UYUMLU ───────────────────────────────
export function QuestOrbitalRing({ pct, petImage, petName, dayNumber, todayPP, streak, completedCount, totalCount }: {
    pct: number; petImage?: string; petName?: string;
    dayNumber: number; todayPP: number; streak: number;
    completedCount: number; totalCount: number;
}) {
    const R_OUT = 88; const R_MID = 68; const R_IN = 50;
    const cOut = 2 * Math.PI * R_OUT;
    const cMid = 2 * Math.PI * R_MID;
    const cIn  = 2 * Math.PI * R_IN;

    // 8 pati noktası dış halkada
    const PAWS = Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 360 - 90;
        const rad = a * Math.PI / 180;
        return { x: Math.cos(rad) * (R_OUT + 14), y: Math.sin(rad) * (R_OUT + 14), filled: i < Math.round(pct / 100 * 8) };
    });

    return (
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 220, height: 220 }}>
            {/* Ambient glow */}
            <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(249,115,22,0.15) 50%, transparent 70%)' }}
            />

            <svg width="220" height="220" className="absolute">
                <defs>
                    <linearGradient id="qg1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="qg2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="qg3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="qglow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                {/* Dekoratif dış ring kesikli */}
                <circle cx="110" cy="110" r="104" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="2 6" />

                {/* Dış halka — streak */}
                <circle cx="110" cy="110" r={R_OUT} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle cx="110" cy="110" r={R_OUT} fill="none"
                    stroke="url(#qg1)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={cOut}
                    initial={{ strokeDashoffset: cOut }}
                    animate={{ strokeDashoffset: cOut * (1 - Math.min(1, streak / 30)) }}
                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.8))' }}
                />

                {/* Orta halka — XP/level */}
                <circle cx="110" cy="110" r={R_MID} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                <motion.circle cx="110" cy="110" r={R_MID} fill="none"
                    stroke="url(#qg2)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={cMid}
                    initial={{ strokeDashoffset: cMid }}
                    animate={{ strokeDashoffset: cMid * (1 - pct / 100) }}
                    transition={{ duration: 1.3, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(139,92,246,0.7))' }}
                />

                {/* İç halka — görev */}
                <circle cx="110" cy="110" r={R_IN} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <motion.circle cx="110" cy="110" r={R_IN} fill="none"
                    stroke="url(#qg3)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={cIn}
                    initial={{ strokeDashoffset: cIn }}
                    animate={{ strokeDashoffset: cIn * (1 - pct / 100) }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    transform="rotate(-90 110 110)"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.7))' }}
                />

                {/* Pati izi noktaları — dış kenar */}
                {PAWS.map(({ x, y, filled }, i) => (
                    <g key={i} transform={`translate(${110 + x},${110 + y})`}>
                        <circle r="6" fill={filled ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.06)'}
                            stroke={filled ? '#c084fc' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5"
                            style={filled ? { filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' } : {}}
                        />
                        <text textAnchor="middle" dominantBaseline="central" fontSize="7" fill="white" opacity={filled ? 0.9 : 0.25}>🐾</text>
                    </g>
                ))}
            </svg>

            {/* Merkez içerik - 3D Pop-out ve Yavaş Dalgalanma (Floating) */}
            <motion.div 
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Taç - Pop-out üstte */}
                <motion.div 
                    animate={{ y: [-1, 1, -1], rotate: [-5, 5, -5] }} 
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-2xl mb-[-4px] z-20 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                >
                    👑
                </motion.div>

                {/* Pet fotoğrafı / 3D Pop-out Container */}
                <div className="relative w-[86px] h-[86px] flex items-center justify-center">
                    {/* Glowing Backing Pedestal */}
                    <div className="absolute inset-2 rounded-full border-2 border-purple-400/40 bg-purple-500/10 shadow-[0_0_24px_rgba(139,92,246,0.6)]" />
                    
                    {/* Avatar visual breaking out (scaling larger than the backing circle) */}
                    <div className="relative w-[78px] h-[78px] rounded-full overflow-hidden border border-white/20 z-10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                        {petImage ? (
                            <img src={petImage} alt={petName} className="w-full h-full object-cover scale-110" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-3xl">🐾</div>
                        )}
                    </div>

                    {/* Outer glowing aura ring */}
                    <motion.div 
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.12, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border border-purple-400/30 pointer-events-none" 
                    />
                </div>

                {/* Gün + puan — cam kapsül içinde */}
                <div className="text-center mt-1.5 bg-black/45 border border-white/10 rounded-full px-3 py-0.5 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10">
                    <p className="text-[10px] font-black text-white/90 leading-none">{dayNumber}. Gün</p>
                    {todayPP > 0 && <p className="text-[8px] font-black text-orange-400 leading-none mt-0.5">{todayPP} Pati Puan</p>}
                </div>
            </motion.div>
        </div>
    );
}

// ─── YOL HARİTASI — KAVİSLİ YÖRÜNGE (referans görselle uyumlu) ─────────────
export function NumberedRoadMap({ weeklyStamps, maxStamps }: { weeklyStamps: number; maxStamps: number }) {
    const todayDOW = new Date().getDay();
    const todayIdx = todayDOW === 0 ? 6 : todayDOW - 1; // 0=Pzt

    const points = [
        { x: 6.8,  y: 64 }, // Gün 1
        { x: 21.1, y: 45 }, // Gün 2
        { x: 35.4, y: 31 }, // Gün 3
        { x: 50,   y: 25 }, // Gün 4
        { x: 64.5, y: 31 }, // Gün 5
        { x: 78.8, y: 45 }, // Gün 6
        { x: 93.1, y: 64 }, // Gün 7
    ];

    return (
        <div className="relative w-full px-2">
            <p className="text-[7.5px] font-black text-purple-400/50 uppercase tracking-[0.35em] text-center mb-4">Seri Yol Haritası</p>
            
            <div className="relative w-full h-16 min-h-[64px]">
                {/* SVG Curved Path */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 350 70" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(139,92,246,0.1)" />
                            <stop offset="25%" stopColor="rgba(139,92,246,0.6)" />
                            <stop offset="50%" stopColor="rgba(236,72,153,0.8)" />
                            <stop offset="75%" stopColor="rgba(249,115,22,0.6)" />
                            <stop offset="100%" stopColor="rgba(249,115,22,0.1)" />
                        </linearGradient>
                    </defs>
                    <path d="M 24 45 Q 175 14 326 45" fill="none" stroke="url(#orbitGrad)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>

                {/* Day Stamps */}
                {points.map((pt, i) => {
                    const isPast    = i < weeklyStamps;
                    const isCurrent = i === todayIdx;
                    const isFuture  = i > todayIdx;
                    
                    const isLastDay = i === maxStamps - 1;

                    return (
                        <div 
                            key={i}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
                            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        >
                            <motion.div
                                animate={isCurrent ? {
                                    scale: [1, 1.15, 1],
                                    boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 14px rgba(168,85,247,0.8)', '0 0 0px rgba(168,85,247,0)']
                                } : isPast ? {
                                    scale: [1, 1.05, 1]
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-[10px] font-black transition-all ${
                                    isPast
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                        : isCurrent
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 text-white scale-110 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                                            : 'bg-black/50 border-white/10 text-white/30 backdrop-blur-md'
                                }`}
                            >
                                {isLastDay ? (
                                    // 7. Gün Hediye Kutusu
                                    <motion.span 
                                        animate={!isPast ? { rotate: [-5, 5, -5] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-base select-none"
                                    >
                                        {isPast ? '🎁' : '🛍️'}
                                    </motion.span>
                                ) : (
                                    // Diğer günler - Pati Pulları
                                    isPast ? (
                                        <span className="text-xs select-none">🐾</span>
                                    ) : isCurrent ? (
                                        <span className="text-xs select-none animate-pulse">🐾</span>
                                    ) : (
                                        <span className="text-[8px] font-black">{i + 1}</span>
                                    )
                                )}
                            </motion.div>
                            
                            <span className={`text-[6.5px] font-black leading-none uppercase tracking-wide ${
                                isCurrent ? 'text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]' : isPast ? 'text-emerald-400' : 'text-white/20'
                            }`}>
                                {isCurrent ? 'Bugün' : `G${i + 1}`}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center mt-2.5">
                <span className="text-[8px] font-black text-purple-300 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    ✨ {weeklyStamps} / {maxStamps} Gün Tamamlandı
                </span>
            </div>
        </div>
    );
}

// ─── FLIP KART (panel için kompakt) ──────────────────────────────────────────
const CAT_THEME: Record<string, { grad: string; glow: string; label: string; icon: string; text: string; bg: string }> = {
    activity: { grad: 'from-[#ffb09c] to-[#ffcfb4]',  glow: 'rgba(255,176,156,0.18)',  label: 'Aktivite', icon: '🚶', text: '#ffb09c', bg: 'rgba(255,176,156,0.1)' },
    social:   { grad: 'from-[#a1c4fd] to-[#c2e9fb]',  glow: 'rgba(161,196,253,0.18)',  label: 'Sosyal',   icon: '🤝', text: '#a1c4fd', bg: 'rgba(161,196,253,0.1)' },
    explore:  { grad: 'from-[#e0c3fc] to-[#8ec5fc]',  glow: 'rgba(224,195,252,0.18)',  label: 'Keşif',    icon: '🔭', text: '#e0c3fc', bg: 'rgba(224,195,252,0.1)' },
    pet:      { grad: 'from-[#fde08e] to-[#fef9db]',  glow: 'rgba(253,224,142,0.18)',  label: 'Pet',      icon: '🐾', text: '#fde08e', bg: 'rgba(253,224,142,0.1)' },
    health:   { grad: 'from-[#c1dfc4] to-[#deecdd]',  glow: 'rgba(193,223,196,0.18)',  label: 'Sağlık',   icon: '❤️', text: '#c1dfc4', bg: 'rgba(193,223,196,0.1)' },
};

export function PanelQuestCard({ quest, index, onManualComplete }: {
    quest: Quest; index: number; onManualComplete?: (id: string) => void;
}) {
    const router = useRouter();
    const theme = CAT_THEME[quest.category] || CAT_THEME.explore;
    const isCompleted = !!quest.completedAt;
    const pct = Math.min(100, (quest.current / Math.max(0.001, quest.target)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18, delay: index * 0.05 }}
            className={`rounded-2xl border overflow-hidden ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-white/10 bg-white/[0.03]'}`}
            style={{ boxShadow: isCompleted ? '0 0 12px rgba(16,185,129,0.1)' : `0 0 10px ${theme.glow}` }}
        >
            <div className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                    {isCompleted ? '✅' : quest.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black leading-tight truncate ${isCompleted ? 'text-emerald-400 line-through opacity-60' : 'text-white/90'}`}>
                        {quest.title}
                    </p>
                    <p className="text-[8px] text-white/30 font-semibold mt-0.5 leading-tight line-clamp-1">{quest.description}</p>
                    
                    {/* Linear progress bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full bg-gradient-to-r ${isCompleted ? 'from-emerald-500 to-teal-400' : theme.grad}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="text-[7.5px] font-black shrink-0 font-mono" style={{ color: theme.text }}>+{quest.reward.pp} PP</span>
                    </div>
                </div>

                {/* Percentage Badge on the Right */}
                <div className={`px-2.5 py-1.5 rounded-xl font-mono text-[9px] font-black text-center shrink-0 min-w-[36px] ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/60'
                }`}>
                    {Math.round(pct)}%
                </div>
            </div>
            
            {/* ACTION BUTTONS */}
            {!isCompleted && (
                <div className="px-3 pb-3">
                    {quest.type === 'manual' && onManualComplete ? (
                        <button
                            onClick={() => onManualComplete(quest.id)}
                            className={`w-full py-2 rounded-xl text-[8px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r ${theme.grad} shadow-[0_0_12px_${theme.glow}] active:scale-95 transition-all`}
                        >
                            Tamamladım ✓
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (quest.category === 'activity' || quest.category === 'explore') {
                                    window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                } else if (quest.category === 'social') {
                                    router.push('/topluluk');
                                } else {
                                    window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                }
                            }}
                            className={`w-full py-2 rounded-xl text-[8px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r ${theme.grad} shadow-[0_0_12px_${theme.glow}] active:scale-95 transition-all opacity-90 hover:opacity-100`}
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

// ─── QUEST CAROUSEL (Yatay Kaydırılabilir RPG Kart Akışı) ─────────────────────
interface QuestCarouselProps {
    quests: Quest[];
    onManualComplete?: (id: string) => void;
}

export function QuestCarousel({ quests, onManualComplete }: QuestCarouselProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!quests || quests.length === 0) {
        return <div className="text-center py-10 text-white/20 text-xs">Görev bulunamadı...</div>;
    }

    const currentQuest = quests[currentIndex];
    const theme = CAT_THEME[currentQuest.category] || CAT_THEME.explore;
    const isCompleted = !!currentQuest.completedAt;
    const pct = Math.min(100, (currentQuest.current / Math.max(0.001, currentQuest.target)) * 100);

    const handleDragEnd = (event: any, info: any) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            // Swipe Left -> Next
            setCurrentIndex(prev => (prev + 1) % quests.length);
        } else if (info.offset.x > swipeThreshold) {
            // Swipe Right -> Prev
            setCurrentIndex(prev => (prev - 1 + quests.length) % quests.length);
        }
    };

    return (
        <div className="flex flex-col items-center w-full select-none">
            {/* Carousel Container */}
            <div className="relative w-full max-w-[310px] h-[350px] flex items-center justify-center overflow-visible my-3">
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
                        className={`absolute w-full h-full rounded-[2.5rem] border p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden ${
                            isCompleted 
                                ? 'border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl' 
                                : 'border-white/[0.06] bg-slate-950/40 backdrop-blur-xl'
                        }`}
                        style={{
                            boxShadow: isCompleted 
                                ? '0 12px 32px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' 
                                : `0 16px 36px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
                        }}
                    >
                        {/* Dynamic Neon Background Glow inside Card */}
                        <div 
                            className="absolute -top-24 -right-24 w-44 h-44 rounded-full blur-[50px] opacity-15 pointer-events-none"
                            style={{ backgroundColor: isCompleted ? '#10b981' : theme.text }}
                        />

                        {/* Top Badge */}
                        <div className="flex justify-between items-center z-10">
                            <span className={`text-[7.5px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-full border ${
                                isCompleted 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : 'bg-white/5 border-white/10 text-white/50'
                            }`}>
                                {isCompleted ? '✓ Tamamlandı' : `${theme.label} Görevi`}
                            </span>
                            
                            <span 
                                className="text-[8px] font-black px-2 py-0.5 rounded-lg shrink-0 font-mono border"
                                style={{
                                    color: isCompleted ? '#34d399' : theme.text,
                                    backgroundColor: isCompleted ? 'rgba(16,185,129,0.1)' : theme.bg,
                                    borderColor: isCompleted ? 'rgba(16,185,129,0.2)' : theme.bg.replace(/0\.1\)/, '0.2)')
                                }}
                            >
                                +{currentQuest.reward.pp} PP
                            </span>
                        </div>

                        {/* Center Icon with Glow Orb */}
                        <div className="relative flex flex-col items-center justify-center py-3 z-10">
                            <motion.div 
                                animate={isCompleted ? {} : { scale: [1, 1.08, 1], y: [-2, 2, -2] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner relative ${
                                    isCompleted ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5 border border-white/10'
                                }`}
                            >
                                <div className="absolute inset-0 rounded-full bg-inherit filter blur-md opacity-50" />
                                <span className="relative z-10">{isCompleted ? '✅' : currentQuest.icon}</span>
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center px-2 z-10">
                            <h3 className={`text-base font-black uppercase tracking-tight leading-tight ${isCompleted ? 'text-emerald-400 line-through opacity-60' : 'text-white'}`}>
                                {currentQuest.title}
                            </h3>
                            <p className="text-[9.5px] text-white/40 font-semibold mt-1 leading-normal max-w-[200px] mx-auto">
                                {currentQuest.description}
                            </p>
                        </div>

                        {/* Progress Bar & CTA */}
                        <div className="w-full space-y-4 z-10">
                            {/* Linear progress bar */}
                            <div className="px-1">
                                <div className="flex justify-between text-[7px] font-black text-white/30 mb-1">
                                    <span>İlerleme ({Math.round(pct)}%)</span>
                                    <span className="font-mono text-purple-300">{currentQuest.current}/{currentQuest.target}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                                    <motion.div
                                        className={`h-full rounded-full bg-gradient-to-r ${isCompleted ? 'from-emerald-500 to-teal-400' : theme.grad}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={!isCompleted ? { boxShadow: `0 0 6px ${theme.glow}` } : {}}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            {!isCompleted ? (
                                currentQuest.type === 'manual' && onManualComplete ? (
                                    <button
                                        onClick={() => onManualComplete(currentQuest.id)}
                                        className={`w-full py-3.5 rounded-2xl text-[9px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r ${theme.grad} shadow-[0_0_14px_${theme.glow}] active:scale-[0.97] transition-all`}
                                    >
                                        Tamamladım ✓
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (currentQuest.category === 'activity' || currentQuest.category === 'explore') {
                                                window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                            } else if (currentQuest.category === 'social') {
                                                router.push('/topluluk');
                                            } else {
                                                window.dispatchEvent(new CustomEvent('open-walk-panel'));
                                            }
                                        }}
                                        className={`w-full py-3.5 rounded-2xl text-[9px] font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r ${theme.grad} shadow-[0_0_14px_${theme.glow}] active:scale-[0.97] transition-all`}
                                    >
                                        {currentQuest.category === 'activity' || currentQuest.category === 'explore' ? '🚶 Yürüyüşe Başla' :
                                         currentQuest.category === 'social' ? '🤝 Topluluğa Git' : '🐾 Tamamla'}
                                    </button>
                                )
                            ) : (
                                <div className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-emerald-400 text-[8.5px] font-black uppercase tracking-widest">
                                    Ödül Toplandı 🏆
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots Indicator & Swipe Hint */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
                <div className="flex gap-1.5">
                    {quests.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentIndex 
                                    ? 'w-4 bg-purple-400' 
                                    : 'w-1.5 bg-white/20 hover:bg-white/45'
                            }`}
                        />
                    ))}
                </div>
                <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] animate-pulse">Sağa / Sola Kaydırarak Değiştir</p>
            </div>
        </div>
    );
}

// ─── GÜNÜN LİDERLERİ (mini) ──────────────────────────────────────────────────
const LEADERS = [
    { rank: 1, name: 'Oscar-Pug',    pts: 125, avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=80', medal: '🥇', ring: 'border-yellow-400', glow: '0 0 12px rgba(251,191,36,0.6)' },
    { rank: 2, name: 'Oscar-Corgi',  pts: 120, avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=80', medal: '🥈', ring: 'border-gray-300',   glow: '0 0 8px rgba(209,213,219,0.3)' },
    { rank: 3, name: 'Corner-Cat',   pts: 98,  avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=80', medal: '🥉', ring: 'border-orange-400',glow: '0 0 8px rgba(251,146,60,0.4)' },
];

export function MiniLeaderboard() {
    return (
        <div className="bg-gradient-to-br from-[#160e2a] to-[#0d0f1e] border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[8px] font-black text-purple-400/60 uppercase tracking-[0.3em]">Günün Liderleri</p>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span className="text-[7px] font-black text-red-400 uppercase">Canlı</span>
                </motion.div>
            </div>
            <div className="flex items-end justify-around">
                {[1, 0, 2].map((li, pi) => {
                    const l = LEADERS[li];
                    const sizes = [44, 56, 44];
                    const sz = sizes[pi];
                    return (
                        <motion.div key={l.rank}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pi * 0.1, type: 'spring' }}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="relative">
                                {li === 0 && (
                                    <motion.div animate={{ y: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-base">👑</motion.div>
                                )}
                                <img src={l.avatar} alt={l.name}
                                    className={`rounded-full object-cover border-2 ${l.ring}`}
                                    style={{ width: sz, height: sz, boxShadow: l.glow }}
                                />
                                <span className="absolute -bottom-1 -right-1 text-sm">{l.medal}</span>
                            </div>
                            <p className="text-[8px] font-black text-white/80 text-center mt-1 max-w-[55px] truncate">{l.name}</p>
                            <p className="text-[7px] text-orange-400 font-black">{l.pts} PP</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── ROZET PANEL ─────────────────────────────────────────────────────────────
export function BadgePanel({ badges, earnedBadges }: { badges: Badge[]; earnedBadges: Badge[] }) {
    const earnedIds = new Set(earnedBadges.map(b => b.id));
    const sorted = [...badges].sort((a, b) => {
        if (earnedIds.has(a.id) && !earnedIds.has(b.id)) return -1;
        if (!earnedIds.has(a.id) && earnedIds.has(b.id)) return 1;
        return 0;
    });
    return (
        <div className="grid grid-cols-3 gap-2">
            {sorted.map(badge => {
                const earned = earnedIds.has(badge.id);
                return (
                    <motion.div key={badge.id} whileHover={{ scale: earned ? 1.05 : 1 }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center ${
                            earned ? 'bg-white/[0.04] border-yellow-500/25' : 'bg-white/[0.02] border-white/[0.04] opacity-35'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${earned ? 'bg-white/10' : 'bg-white/5'}`}>
                            {earned ? badge.icon : <Lock className="w-4 h-4 text-white/20" />}
                        </div>
                        <p className={`text-[8px] font-black uppercase tracking-tight leading-tight ${earned ? 'text-white' : 'text-white/20'}`}>
                            {earned ? badge.name : '???'}
                        </p>
                        {earned && (
                            <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-full ${
                                badge.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                                badge.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                                badge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/10 text-white/40'
                            }`}>
                                {badge.rarity === 'legendary' ? '👑' : badge.rarity === 'epic' ? '⚡' : badge.rarity === 'rare' ? '💎' : '✦'}
                            </span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

// ─── ARAŞTIRMA PANEL ─────────────────────────────────────────────────────────
export function ResearchPanel({ research }: { research: MonthlyResearch }) {
    const currentStage = research.stages[research.currentStageIndex];
    const completedStages = research.stages.filter(s => s.completedAt).length;
    return (
        <div className="space-y-3">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🔭</span>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{research.name}</h4>
                        <p className="text-[8px] text-white/40">{completedStages}/{research.stages.length} Aşama Tamamlandı</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {research.stages.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 ${
                                s.completedAt ? 'bg-emerald-500 border-emerald-500 text-white' :
                                i === research.currentStageIndex ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' :
                                'bg-white/5 border-white/10 text-white/20'
                            }`}>{s.completedAt ? '✓' : s.emoji}</div>
                            {i < research.stages.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < research.currentStageIndex ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {currentStage && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{currentStage.emoji}</span>
                        <h5 className="text-[11px] font-black text-white uppercase">Aşama {research.currentStageIndex + 1}: {currentStage.title}</h5>
                    </div>
                    {currentStage.tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-2 p-2.5 rounded-xl border ${task.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                            <span className="text-sm shrink-0">{task.completed ? '✅' : task.icon}</span>
                            <div className="flex-1">
                                <p className={`text-[9px] font-bold ${task.completed ? 'text-emerald-400 line-through opacity-60' : 'text-white/70'}`}>{task.description}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${task.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (task.current / task.target) * 100)}%` }} />
                                    </div>
                                    <span className="text-[7px] text-white/30 font-mono">{Math.min(task.current, task.target)}/{task.target}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {research.stages.slice(research.currentStageIndex + 1).map((stage, i) => (
                <div key={stage.id} className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-3 flex items-center gap-3 opacity-40">
                    <Lock className="w-4 h-4 text-white/20 shrink-0" />
                    <p className="text-[9px] font-black text-white/30 uppercase">Aşama {research.currentStageIndex + i + 2}: {stage.title}</p>
                </div>
            ))}
        </div>
    );
}

// ─── ANA PANEL ───────────────────────────────────────────────────────────────
interface QuestPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'daily' | 'league' | 'research' | 'badges';

export function QuestPanel({ isOpen, onClose }: QuestPanelProps) {
    const router = useRouter();
    const {
        dailyQuests, completedCount, totalCount,
        monthlyResearch, badges, earnedBadges,
        totalPatiPuan, level, levelTitle, levelXpCurrent, levelXpRequired,
        todayEarned, currentStreak, streakShieldAvailable, useStreakShield,
        weeklyStamps, maxWeeklyStamps, completeManualQuest
    } = useQuestEngine();
    const { activePet } = usePet();
    const { liveWalkerCount } = useLiveEvents();

    const [activeTab, setActiveTab] = useState<TabType>('daily');

    const questPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const xpPct = levelXpRequired > 0 ? Math.min(100, (levelXpCurrent / levelXpRequired) * 100) : 0;


    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'daily',    label: 'Günlük',   icon: '⚡' },
        { id: 'league',   label: 'Lig',      icon: '🏆' },
        { id: 'research', label: 'Araştırma', icon: '🔭' },
        { id: 'badges',   label: 'Rozetler',  icon: '🏅' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed bottom-0 inset-x-0 z-[3101] rounded-t-[2rem] border-t border-purple-500/20 flex flex-col max-h-[95vh] overflow-hidden"
                        style={{ background: 'linear-gradient(180deg, #100820 0%, #080d18 50%, #060810 100%)' }}
                    >
                        {/* Constellation arka plan */}
                        <ConstellationBg />

                        {/* Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/15 rounded-full shrink-0" />

                        {/* ── HEADER — RPG Pet Profile Header ── */}
                        <div className="shrink-0 pt-6 pb-3.5 px-4 border-b border-purple-500/10 relative">

                            {/* Top level bar & Close btn */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Pet avatar with glowing border */}
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-white/5 flex items-center justify-center">
                                            {activePet?.avatar || activePet?.image || activePet?.image_url ? (
                                                <img
                                                    src={activePet.avatar || activePet.image || activePet.image_url}
                                                    className="w-full h-full object-cover"
                                                    alt={activePet?.name || 'Pet'}
                                                />
                                            ) : (
                                                <span className="text-xl">🐾</span>
                                            )}
                                        </div>
                                        {/* Level badge */}
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-indigo-500 border border-purple-300 text-white text-[7px] font-black w-5 h-5 rounded-xl flex items-center justify-center shadow-lg">
                                            L{level}
                                        </div>
                                    </div>

                                    {/* Pet name, level title, and XP bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-black text-white leading-none truncate">{activePet?.name || 'Moffi'}</h2>
                                            <span className="text-[7.5px] font-black text-purple-400 bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                                {levelTitle.replace(/🐾|🐕|🦊|🐺|🦁|👑\s*/g, '')}
                                            </span>
                                        </div>
                                        
                                        {/* Linear XP progress bar */}
                                        <div className="mt-2 w-[140px]">
                                            <div className="flex justify-between text-[6.5px] font-black text-white/30 mb-0.5">
                                                <span>XP İlerlemesi</span>
                                                <span className="font-mono text-purple-300">{levelXpCurrent}/{levelXpRequired}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${xpPct}%` }}
                                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                                    style={{ boxShadow: '0 0 6px rgba(139,92,246,0.6)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2.5 py-1.5 shrink-0">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                                        <span className="text-[10px] font-black text-yellow-400 font-mono">{totalPatiPuan.toLocaleString()}</span>
                                    </div>
                                    <button onClick={onClose} className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
                                        <X className="w-4 h-4 text-white/50" />
                                    </button>
                                </div>
                            </div>

                            {/* Stat cards (4 in a row) & Streak Shield */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {[
                                    { val: `${currentStreak}🔥`, label: 'Seri', color: 'text-orange-400' },
                                    { val: `${completedCount}/${totalCount}`, label: 'Görev', color: 'text-emerald-400' },
                                    { val: `+${todayEarned.pp}`, label: 'Bugün PP', color: 'text-yellow-400' },
                                    { val: String(earnedBadges.length), label: 'Rozetler', color: 'text-purple-400' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2 text-center shadow-sm">
                                        <p className={`text-xs font-black leading-none ${s.color}`}>{s.val}</p>
                                        <p className="text-[6.5px] font-black text-white/30 uppercase tracking-wider mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Streak shield & Walker Count line */}
                            <div className="flex items-center justify-between gap-3 mt-2">
                                {streakShieldAvailable ? (
                                    <button onClick={useStreakShield}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 text-[7.5px] font-black text-blue-400 uppercase tracking-widest active:scale-95 transition-all">
                                        <Shield className="w-3 h-3" /> Seri Kalkanı Aktif Et
                                    </button>
                                ) : (
                                    <div className="flex-1 text-[7.5px] font-black text-white/20 uppercase tracking-widest py-2">Seri Kalkanı Kullanıldı</div>
                                )}

                                {liveWalkerCount > 0 ? (
                                    <div className="flex items-center gap-1.5 py-2">
                                        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                        <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-wider">{liveWalkerCount} aktif kaşif</span>
                                    </div>
                                ) : (
                                    <div className="text-[7.5px] font-black text-white/20 uppercase tracking-wider py-2">Sessiz Arena</div>
                                )}
                            </div>

                            {/* Yol haritası — numaralı */}
                            <div className="mt-3">
                                <NumberedRoadMap weeklyStamps={weeklyStamps} maxStamps={maxWeeklyStamps} />
                            </div>
                        </div>

                        {/* ── TABS ── */}
                        <div className="px-4 pt-3 pb-2 shrink-0 flex gap-1">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                            : 'text-white/25 hover:text-white/50'
                                    }`}
                                >
                                    <span>{tab.icon}</span>{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── CONTENT ── */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-6">
                            <AnimatePresence mode="wait">

                                {activeTab === 'daily' && (
                                    <motion.div key="daily" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5 flex justify-center w-full">
                                        <QuestCarousel quests={dailyQuests} onManualComplete={completeManualQuest} />
                                    </motion.div>
                                )}

                                {activeTab === 'league' && (
                                    <motion.div key="league" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex-1 h-px bg-white/8" />
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] whitespace-nowrap">Mahalle Ligi Sıralaması</span>
                                            <div className="flex-1 h-px bg-white/8" />
                                        </div>
                                        
                                        {/* Lig Statü Kartı */}
                                        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">🛡️</span>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Gümüş Lig</h4>
                                                        <p className="text-[8px] font-bold text-yellow-400">Kademe 2 • Yükselmeye %15 kaldı</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="bg-white/10 px-2 py-1 rounded-md text-[8px] font-black text-white/50 uppercase">
                                                    ⏳ Kapanış: 3g 12s
                                                </div>
                                                <div className="text-[7px] font-black text-yellow-400/70 uppercase">
                                                    İlk 3'e 500 PP Ödül
                                                </div>
                                            </div>
                                        </div>

                                        <MiniLeaderboard />

                                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" />
                                                    </div>
                                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Canlı Etkinlik</h4>
                                                    <p className="text-[10px] font-bold text-indigo-300 mt-0.5">Şu an {liveWalkerCount} kişi yürüyor</p>
                                                </div>
                                            </div>
                                            <button className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-500/30 transition-colors">
                                                Radar
                                            </button>
                                        </div>
                                        <div className="h-4" />
                                    </motion.div>
                                )}

                                {activeTab === 'research' && (
                                    <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {monthlyResearch
                                            ? <ResearchPanel research={monthlyResearch} />
                                            : <div className="text-center py-8 text-white/20 text-[10px]">Araştırma yükleniyor...</div>
                                        }
                                    </motion.div>
                                )}

                                {activeTab === 'badges' && (
                                    <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Rozet Koleksiyonu</span>
                                            <span className="text-[8px] font-black text-yellow-400">{earnedBadges.length}/{badges.length}</span>
                                        </div>
                                        <BadgePanel badges={badges} earnedBadges={earnedBadges} />
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="px-4 pb-6 pt-2 border-t border-purple-500/10 shrink-0">
                            <button
                                onClick={() => { router.push('/quests'); onClose(); }}
                                className="w-full h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-500/20 active:scale-95 transition-all group"
                            >
                                <span className="text-[10px] font-black text-purple-300/80 uppercase tracking-[0.2em] group-hover:text-purple-300">
                                    Tam Görev Merkezi
                                </span>
                                <span className="text-purple-400 text-sm">→</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
