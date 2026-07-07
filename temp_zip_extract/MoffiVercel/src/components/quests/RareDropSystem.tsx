"use client";

/**
 * MOFFI RARE DROP SYSTEM — Aşama 2
 *
 * FOMO mekanizması:
 * - Günün belirli saatlerinde nadir ödül fırsatları çıkar
 * - Süre dolunca kaybolur — bir daha gelmeyebilir
 * - Rozet rarity sistemi (Common → Legendary)
 * - "Şu an aktif": Diğer kullanıcıların kazandığını göster
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeather } from '@/context/WeatherContext';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useActivity } from '@/context/ActivityContext';

// ─── RARE DROP POOL ───────────────────────────────────────────────────────────

interface RareDrop {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
    timeWindow: { startHour: number; endHour: number };
    condition?: (weather: any, walkStats: any) => boolean;
    reward: { pp: number; xp: number; badge?: string };
    expiresAt: number;
    claimedCount: number; // Simülasyon: kaç kişi aldı
    totalSlots: number;   // Sınırlı slot
    claimed: boolean;
    requiresWalk: boolean;
}

const RARE_DROP_TEMPLATES = [
    {
        id: 'golden_hour',
        name: '🌇 Altın Saat',
        description: 'Akşam 17:00-19:00 arası yürüyüş yap — nadiren çıkar!',
        icon: '🌇',
        rarity: 'rare' as const,
        timeWindow: { startHour: 17, endHour: 19 },
        reward: { pp: 150, xp: 200, badge: 'golden_hour' },
        totalSlots: 50,
        requiresWalk: true,
    },
    {
        id: 'sunrise_warrior',
        name: '🌅 Gündoğumu Savaşçısı',
        description: 'Sabah 06:00-07:30 arası 1 km yürü — efsane rozet!',
        icon: '🌅',
        rarity: 'epic' as const,
        timeWindow: { startHour: 6, endHour: 7 },
        reward: { pp: 250, xp: 350, badge: 'morning_bird' },
        totalSlots: 20,
        requiresWalk: true,
    },
    {
        id: 'midnight_phantom',
        name: '🦇 Gece Hayaleti',
        description: 'Gece 22:00-23:59 arası yürüyüş — sadece cesurlar için!',
        icon: '🦇',
        rarity: 'epic' as const,
        timeWindow: { startHour: 22, endHour: 24 },
        reward: { pp: 200, xp: 280, badge: 'night_walker' },
        totalSlots: 30,
        requiresWalk: true,
    },
    {
        id: 'storm_chaser',
        name: '⛈️ Fırtına Avcısı',
        description: 'Fırtınalı havada yürüyüş — Efsane rozet fırsatı!',
        icon: '⛈️',
        rarity: 'legendary' as const,
        timeWindow: { startHour: 0, endHour: 24 },
        condition: (weather: any) => weather && weather.walkScore < 30,
        reward: { pp: 500, xp: 700, badge: 'rain_hero' },
        totalSlots: 10,
        requiresWalk: true,
    },
    {
        id: 'lunch_sprinter',
        name: '🥗 Öğle Koşucusu',
        description: 'Öğle arası 12:00-13:30 hızlı yürüyüş — sınırlı slot!',
        icon: '🥗',
        rarity: 'uncommon' as const,
        timeWindow: { startHour: 12, endHour: 13 },
        reward: { pp: 80, xp: 110 },
        totalSlots: 100,
        requiresWalk: true,
    },
    {
        id: 'weekend_explorer',
        name: '🗺️ Hafta Sonu Kaşifi',
        description: 'Cumartesi veya Pazar 2 km+ yürüyüş — sadece bu hafta!',
        icon: '🗺️',
        rarity: 'rare' as const,
        timeWindow: { startHour: 8, endHour: 20 },
        condition: (_w: any, _s: any) => [0, 6].includes(new Date().getDay()),
        reward: { pp: 180, xp: 250 },
        totalSlots: 75,
        requiresWalk: true,
    },
];

const RARITY_CONFIG = {
    uncommon: { label: 'Sıradan Dışı', color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
    rare:     { label: 'Nadir', color: 'text-blue-400', bg: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/40', glow: 'shadow-blue-500/30' },
    epic:     { label: 'Destansı', color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/40', glow: 'shadow-purple-500/30' },
    legendary:{ label: 'Efsane', color: 'text-amber-400', bg: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/50', glow: 'shadow-amber-500/40' },
};

function getSecondsLeft(expiresAt: number): number {
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

function formatTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
    return `${s}sn`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function RareDropSystem() {
    const { weather } = useWeather();
    const { walkStats, walkData } = useActivity();
    const { triggerQuestEvent } = useQuestEngine();

    const [activeDrops, setActiveDrops] = useState<RareDrop[]>([]);
    const [claimedDrop, setClaimedDrop] = useState<RareDrop | null>(null);
    const [showClaimAnim, setShowClaimAnim] = useState(false);
    const [ticker, setTicker] = useState(0);
    const shownRef = useRef<Set<string>>(new Set());
    const claimedIdsRef = useRef<Set<string>>(
        new Set(JSON.parse(localStorage.getItem('moffi_claimed_drops') || '[]'))
    );

    // ── Aktif drop'ları hesapla ──────────────────────────────────────────────
    useEffect(() => {
        const hour = new Date().getHours();
        const now = Date.now();

        const drops: RareDrop[] = RARE_DROP_TEMPLATES
            .filter(t => {
                if (claimedIdsRef.current.has(t.id)) return false;
                if (hour < t.timeWindow.startHour || hour >= t.timeWindow.endHour) return false;
                if (t.condition && !t.condition(weather, walkStats)) return false;
                return true;
            })
            .map((t, i) => {
                // Pencerenin sonuna kadar süre
                const endDate = new Date();
                endDate.setHours(t.timeWindow.endHour === 24 ? 23 : t.timeWindow.endHour, 59, 59, 999);
                const rng = (t.id.charCodeAt(0) * 37 + i * 11) % 37;

                return {
                    ...t,
                    expiresAt: endDate.getTime(),
                    claimedCount: Math.floor(t.totalSlots * 0.3 + rng),
                    claimed: false,
                } as RareDrop;
            });

        setActiveDrops(drops);
    }, [weather, walkStats, ticker]);

    // ── Her dakika yenile ─────────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => setTicker(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // ── Claim handler ──────────────────────────────────────────────────────────
    const claimDrop = useCallback((drop: RareDrop) => {
        // Walk check
        if (drop.requiresWalk && !walkData.isActive) {
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: '🚶 Yürüyüş panelinden yürüyüşü başlatmalısın!' }
            }));
            window.dispatchEvent(new CustomEvent('open-walk-panel'));
            return;
        }

        claimedIdsRef.current.add(drop.id);
        localStorage.setItem('moffi_claimed_drops', JSON.stringify([...claimedIdsRef.current]));

        setClaimedDrop(drop);
        setShowClaimAnim(true);

        // Quest engine'e bildir
        triggerQuestEvent('rare_drop_claimed', { dropId: drop.id, reward: drop.reward });

        window.dispatchEvent(new CustomEvent('moffi-quest-trigger', {
            detail: { type: 'rare_drop_claimed' }
        }));

        window.dispatchEvent(new CustomEvent('moffi-toast', {
            detail: {
                message: `${drop.icon} ${drop.name} Kazandın! +${drop.reward.pp} PP!`
            }
        }));

        setActiveDrops(prev => prev.filter(d => d.id !== drop.id));
        setTimeout(() => setShowClaimAnim(false), 3000);
    }, [walkData, walkStats, triggerQuestEvent]);

    if (activeDrops.length === 0 && !showClaimAnim) return null;

    return (
        <div className="fixed bottom-36 right-4 z-[8980] flex flex-col gap-2 items-end max-w-[260px]">
            {/* ── Claim animasyonu ── */}
            <AnimatePresence>
                {showClaimAnim && claimedDrop && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2, y: -30 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="bg-gradient-to-br from-[#1a0a2e] to-[#0d0d14] border border-purple-500/50 rounded-2xl p-3 shadow-[0_0_40px_rgba(168,85,247,0.4)] text-center w-full"
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl mb-1"
                        >
                            {claimedDrop.icon}
                        </motion.div>
                        <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Kazandın!</p>
                        <p className="text-white font-black text-sm">{claimedDrop.name}</p>
                        <p className="text-emerald-400 font-black text-xs mt-1">+{claimedDrop.reward.pp} PP · +{claimedDrop.reward.xp} XP</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Aktif drop'lar ── */}
            <AnimatePresence>
                {activeDrops.slice(0, 2).map((drop, idx) => {
                    const cfg = RARITY_CONFIG[drop.rarity];
                    const secsLeft = getSecondsLeft(drop.expiresAt);
                    const remainSlots = drop.totalSlots - drop.claimedCount;
                    const pct = (drop.claimedCount / drop.totalSlots) * 100;
                    const isLegendary = drop.rarity === 'legendary';

                    return (
                        <motion.div
                            key={drop.id}
                            initial={{ opacity: 0, x: 60, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.8 }}
                            transition={{ delay: idx * 0.1, type: 'spring', damping: 18 }}
                            className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl bg-gradient-to-br ${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow} w-full`}
                        >
                            {/* Legendary pulse */}
                            {isLegendary && (
                                <motion.div
                                    animate={{ opacity: [0.15, 0.4, 0.15] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-amber-400/20 pointer-events-none"
                                />
                            )}

                            <div className="p-3 relative z-10">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{drop.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-black/30 ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-white font-black text-[10px] leading-tight">{drop.name}</p>
                                        </div>
                                    </div>
                                    {/* Countdown & Close */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <motion.p
                                            animate={{ opacity: secsLeft < 300 ? [1, 0.4, 1] : 1 }}
                                            transition={{ duration: 1, repeat: secsLeft < 300 ? Infinity : 0 }}
                                            className={`text-[9px] font-black font-mono ${secsLeft < 300 ? 'text-red-400' : 'text-white/50'}`}
                                        >
                                            ⏰ {formatTime(secsLeft)}
                                        </motion.p>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveDrops(prev => prev.filter(d => d.id !== drop.id)); }}
                                            className="text-white/30 hover:text-white/80 transition-colors -mt-2 -mr-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[8px] text-white/50 font-semibold mb-2 leading-tight">{drop.description}</p>

                                {/* Slot bar */}
                                <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[7px] text-white/40 font-bold">{drop.claimedCount} kişi aldı</span>
                                        <span className={`text-[7px] font-black ${remainSlots < 10 ? 'text-red-400' : 'text-white/40'}`}>
                                            {remainSlots} slot kaldı
                                        </span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className={`h-full rounded-full bg-gradient-to-r ${drop.rarity === 'legendary' ? 'from-amber-400 to-yellow-300' : drop.rarity === 'epic' ? 'from-purple-400 to-pink-400' : drop.rarity === 'rare' ? 'from-blue-400 to-indigo-400' : 'from-green-400 to-emerald-400'}`}
                                        />
                                    </div>
                                </div>

                                {/* Reward + CTA */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <span className="text-[8px] font-black text-orange-400">+{drop.reward.pp} PP</span>
                                        <span className="text-[8px] text-white/30 mx-1">·</span>
                                        <span className="text-[8px] font-black text-blue-400">+{drop.reward.xp} XP</span>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        whileHover={{ scale: 1.04 }}
                                        onClick={() => claimDrop(drop)}
                                        className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black text-white uppercase tracking-wide bg-gradient-to-r ${drop.rarity === 'legendary' ? 'from-amber-500 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : drop.rarity === 'epic' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-indigo-500'} transition-all`}
                                    >
                                        {drop.requiresWalk && !walkData.isActive ? '🚶 Yürü → Al' : '✨ Kazan'}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
