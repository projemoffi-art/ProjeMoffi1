"use client";

/**
 * QUEST BENTO CARD — Yeniden Tasarım
 * Apple Watch halka sistemi + Glassmorphism + Likit animasyonlar
 */

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { useLiveEvents } from "@/context/LiveEventsContext";
import { usePet } from "@/context/PetContext";

// ─── SVG HALKA ────────────────────────────────────────────────────────────────

function Ring({
    radius, stroke, pct, color, trackColor, delay = 0, glow = false
}: {
    radius: number; stroke: number; pct: number;
    color: string; trackColor: string; delay?: number; glow?: boolean;
}) {
    const circ = 2 * Math.PI * radius;
    const offset = circ * (1 - Math.min(1, pct / 100));
    const size = (radius + stroke) * 2;

    return (
        <svg width={size} height={size} className="absolute inset-0 m-auto" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
            {/* Progress */}
            <motion.circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, delay, ease: [0.34, 1.56, 0.64, 1] }}
                style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
            />
        </svg>
    );
}

// ─── SAYAÇ ANİMASYONU ─────────────────────────────────────────────────────────

function AnimCounter({ value, className }: { value: number; className?: string }) {
    const motionVal = useMotionValue(0);
    const display = useTransform(motionVal, v => Math.round(v).toLocaleString());

    useEffect(() => {
        const controls = animate(motionVal, value, { duration: 1.2, ease: 'easeOut' });
        return controls.stop;
    }, [value, motionVal]);

    return <motion.span className={className}>{display}</motion.span>;
}

// ─── GÖREV CHİP ───────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
    activity: 'from-orange-500 to-red-500',
    pet:      'from-amber-400 to-yellow-500',
    social:   'from-blue-500 to-indigo-500',
    explore:  'from-purple-500 to-pink-500',
    health:   'from-emerald-500 to-teal-500',
};

function QuestChip({ quest }: { quest: any }) {
    const isCompleted = !!quest.completedAt;
    const pct = Math.min(100, (quest.current / Math.max(0.001, quest.target)) * 100);
    const grad = CAT_COLORS[quest.category] || 'from-gray-500 to-gray-600';

    return (
        <motion.div
            layout
            className={`relative flex-shrink-0 w-[112px] rounded-2xl overflow-hidden border ${
                isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-white/[0.04] border-white/[0.08]'
            }`}
            whileTap={{ scale: 0.96 }}
        >
            {/* Progress fill bg */}
            {!isCompleted && (
                <motion.div
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${grad} opacity-10`}
                    initial={{ height: '0%' }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
            )}
            <div className="relative z-10 p-2.5 flex flex-col justify-between h-full min-h-[92px]">
                <div>
                    <div className="text-lg mb-1">{isCompleted ? '✅' : quest.icon}</div>
                    <p className={`text-[8.5px] font-black leading-tight line-clamp-2 ${
                        isCompleted ? 'text-emerald-400 line-through opacity-60' : 'text-white/80'
                    }`}>
                        {quest.title}
                    </p>
                </div>
                
                {/* Linear progress bar instead of rings */}
                <div className="mt-2">
                    <div className="flex items-center justify-between text-[6.5px] font-black text-white/30 mb-0.5">
                        <span>{isCompleted ? 'Tamamlandı' : `${Math.round(pct)}%`}</span>
                        <span className="text-orange-400">+{quest.reward.pp} PP</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : `bg-gradient-to-r ${grad}`}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function QuestBentoCard() {
    const {
        dailyQuests, completedCount, totalCount,
        totalPatiPuan, levelTitle, level,
        levelXpCurrent, levelXpRequired, currentStreak,
        todayEarned, weeklyStamps, maxWeeklyStamps
    } = useQuestEngine();
    const { liveWalkerCount } = useLiveEvents();
    const { activePet } = usePet();
    const router = useRouter();

    const questPct  = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const xpPct     = levelXpRequired > 0 ? (levelXpCurrent / levelXpRequired) * 100 : 0;

    const RING_SIZE = 52;

    const handleOpen = () => router.push('/quests');

    return (
        <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', damping: 20, stiffness: 200 }}
            onClick={handleOpen}
            className="relative overflow-hidden rounded-3xl cursor-pointer active:scale-[0.98] transition-transform"
            style={{
                background: 'linear-gradient(145deg, rgba(15,15,20,0.97) 0%, rgba(20,12,35,0.97) 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* Arka plan pulse aura */}
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5), transparent 70%)' }}
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)' }}
            />

            <div className="relative z-10 p-4">

                {/* ── ÜST ALAN: Halka + Bilgi ── */}
                <div className="flex items-center gap-4 mb-4">

                    {/* Tekli Progress Halka ve İçinde Pet Avatarı */}
                    <div className="relative flex-shrink-0" style={{ width: (RING_SIZE + 6) * 2, height: (RING_SIZE + 6) * 2 }}>
                        {/* Tek bir parlayan yeşil halka (günlük görevlerin ilerlemesi) */}
                        <Ring radius={RING_SIZE} stroke={6} pct={questPct} color="#10b981" trackColor="rgba(16,185,129,0.08)" delay={0} glow />

                        {/* Merkezdeki Pet Avatarı */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[78px] h-[78px] rounded-full overflow-hidden border border-white/10 bg-white/5 shadow-inner flex items-center justify-center">
                                {activePet?.avatar || activePet?.image ? (
                                    <img
                                        src={activePet.avatar || activePet.image}
                                        className="w-full h-full object-cover"
                                        alt={activePet?.name || 'Pet'}
                                    />
                                ) : (
                                    <span className="text-2xl">🐾</span>
                                )}
                            </div>
                        </div>

                        {/* Küçük seviye rozeti halka üzerinde */}
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-400 text-white text-[7px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                            L{level}
                        </div>
                    </div>

                    {/* Sağ bilgi */}
                    <div className="flex-1 min-w-0">
                        {/* Seviye başlığı */}
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Görev Merkezi</p>
                        <h3 className="text-xs font-black text-white leading-tight mb-2.5 truncate">{levelTitle}</h3>

                        {/* Stat grid 2x2 */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1.5 text-center">
                                <AnimCounter value={totalPatiPuan} className="block text-xs font-black text-orange-400 font-mono leading-none" />
                                <p className="text-[6px] font-black text-white/25 uppercase tracking-widest mt-1">PatiPuan</p>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1.5 text-center">
                                <div className="text-xs font-black text-red-400 leading-none">{currentStreak}<span className="text-[9px]">🔥</span></div>
                                <p className="text-[6px] font-black text-white/25 uppercase tracking-widest mt-1">Gün Seri</p>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1.5 text-center">
                                <div className="text-xs font-black text-emerald-400 leading-none">{completedCount}<span className="text-white/20">/{totalCount}</span></div>
                                <p className="text-[6px] font-black text-white/25 uppercase tracking-widest mt-1">Görev</p>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1.5 text-center">
                                <div className="text-xs font-black text-purple-400 leading-none">+{todayEarned.pp}</div>
                                <p className="text-[6px] font-black text-white/25 uppercase tracking-widest mt-1">PP Bugün</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── İLERLEME METRİKLERİ ── */}
                <div className="flex items-center gap-3.5 mb-3 px-0.5">
                    {[
                        { color: '#f97316', label: 'Yürüyüş Serisi', val: `${currentStreak} Gün` },
                        { color: '#8b5cf6', label: 'Sonraki Seviye', val: `${Math.round(xpPct)}%` },
                        { color: '#10b981', label: 'Görevler', val: `${completedCount}/${totalCount} Tamam` },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.color}` }} />
                            <span className="text-[7.5px] font-black text-white/40 uppercase tracking-wider">{item.label}</span>
                            <span className="text-[7.5px] font-black" style={{ color: item.color }}>{item.val}</span>
                        </div>
                    ))}
                    {liveWalkerCount > 0 && (
                        <div className="ml-auto flex items-center gap-1">
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-1 h-1 bg-emerald-400 rounded-full"
                            />
                            <span className="text-[7px] font-black text-emerald-400">{liveWalkerCount} aktif</span>
                        </div>
                    )}
                </div>

                {/* ── GÖREV CHİPLERİ (Yatay Kaydır) ── */}
                <div
                    className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {dailyQuests.map(q => (
                        <QuestChip key={q.id} quest={q} />
                    ))}
                    {dailyQuests.length === 0 && (
                        <div className="text-[9px] text-white/20 font-bold py-2">Görevler yükleniyor...</div>
                    )}
                </div>

                {/* ── HAFTALIK PUL BARI ── */}
                <div className="mt-3 flex items-center gap-2 px-0.5">
                    <span className="text-[6.5px] font-black text-white/20 uppercase tracking-widest shrink-0">Haftalık</span>
                    <div className="flex gap-1 flex-1">
                        {Array.from({ length: maxWeeklyStamps }, (_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.06, type: 'spring', stiffness: 300 }}
                                className={`flex-1 h-1.5 rounded-full ${
                                    i < weeklyStamps
                                        ? 'bg-yellow-450'
                                        : 'bg-white/[0.06]'
                                }`}
                                style={i < weeklyStamps ? { backgroundColor: '#facc15', boxShadow: '0 0 4px rgba(250,204,21,0.6)' } : {}}
                            />
                        ))}
                    </div>
                    <span className="text-[7.5px] font-black text-yellow-450 shrink-0" style={{ color: '#facc15' }}>{weeklyStamps}/7</span>
                </div>

                {/* ── CTA ── */}
                <motion.div
                    className="mt-3 flex items-center justify-center gap-1.5"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                >
                    <div className="w-1 h-1 bg-white/30 rounded-full" />
                    <p className="text-[7.5px] font-black text-white/30 uppercase tracking-[0.25em]">Detayları görmek için dokunun</p>
                    <div className="w-1 h-1 bg-white/30 rounded-full" />
                </motion.div>
            </div>
        </motion.div>
    );
}

