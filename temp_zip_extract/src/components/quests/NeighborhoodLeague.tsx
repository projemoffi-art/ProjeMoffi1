"use client";

/**
 * MOFFI NEIGHBORHOOD LEAGUE — Aşama 2
 *
 * Mahalle bazlı haftalık rekabet sistemi:
 * - Gerçek aktivite verisiyle skor hesaplanır
 * - Simüle rakip listesi (gerçek DB olmadan)
 * - Haftalık sıralama + ödül
 * - Podium animasyonu
 * - Hafta sonu özel bonus
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useActivity } from '@/context/ActivityContext';
import { useLiveEvents } from '@/context/LiveEventsContext';
import { Trophy, Flame, Footprints, TrendingUp } from 'lucide-react';

// ─── SIMULATED NEIGHBORS ──────────────────────────────────────────────────────

interface LeaguePlayer {
    rank: number;
    name: string;
    petName: string;
    avatar: string;
    petAvatar: string;
    score: number;
    distanceKm: number;
    streak: number;
    isMe: boolean;
    badge?: string;
    trend: 'up' | 'down' | 'same';
}

const NEIGHBOR_SEEDS = [
    { name: 'Ayşe K.', petName: 'Pamuk', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=80', badge: '🔥' },
    { name: 'Mehmet A.', petName: 'Duman', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=80', badge: '⭐' },
    { name: 'Zeynep D.', petName: 'Bal', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=80', badge: '🌟' },
    { name: 'Emre T.', petName: 'Boncuk', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=80', badge: '' },
    { name: 'Fatma S.', petName: 'Bulut', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1550697851-920b181d3280?q=80&w=80', badge: '' },
    { name: 'Ali R.', petName: 'Kartal', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=80', badge: '' },
    { name: 'Selin B.', petName: 'Şeker', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?q=80&w=80', badge: '' },
    { name: 'Can O.', petName: 'Mango', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=80', badge: '' },
    { name: 'Elif M.', petName: 'Tarçın', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=80', petAvatar: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?q=80&w=80', badge: '' },
];

function seedRand(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function getDaysUntilWeekend(): number {
    const day = new Date().getDay();
    const daysToSaturday = day === 0 ? 6 : 6 - day;
    return daysToSaturday;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const TREND_COLOR = { up: 'text-emerald-400', down: 'text-red-400', same: 'text-white/30' };
const TREND_ICON = { up: '↑', down: '↓', same: '—' };

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function NeighborhoodLeague() {
    const { totalPatiPuan, currentStreak, completedCount } = useQuestEngine();
    const { walkStats } = useActivity();
    const { neighborhoodRank, neighborhoodScore } = useLiveEvents();

    const myScore = useMemo(() => (
        (walkStats?.totalDistanceKm || 0) * 10 +
        (walkStats?.currentStreak || 0) * 50 +
        completedCount * 20 +
        Math.floor(totalPatiPuan * 0.01)
    ), [walkStats, completedCount, totalPatiPuan]);

    // Simüle edilmiş sıralama listesi
    const leaderboard = useMemo((): LeaguePlayer[] => {
        const rng = seedRand(new Date().getDay() * 1000 + 42);
        const trends: Array<'up' | 'down' | 'same'> = ['up', 'down', 'same'];

        const neighbors: LeaguePlayer[] = NEIGHBOR_SEEDS.map((n, i) => {
            const scoreVariance = rng() * 800 + 100;
            const baseScore = Math.max(10, (neighborhoodRank - 1) * 50 + i * 30 + scoreVariance);
            const dist = parseFloat((rng() * 15 + 1).toFixed(1));
            const streak = Math.floor(rng() * 14);
            return {
                rank: 0,
                name: n.name,
                petName: n.petName,
                avatar: n.avatar,
                petAvatar: n.petAvatar,
                score: Math.floor(baseScore),
                distanceKm: dist,
                streak,
                isMe: false,
                badge: n.badge,
                trend: trends[Math.floor(rng() * 3)],
            };
        });

        const me: LeaguePlayer = {
            rank: 0,
            name: 'Sen',
            petName: 'Patin',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80',
            petAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=80',
            score: myScore,
            distanceKm: parseFloat((walkStats?.totalDistanceKm || 0).toFixed(1)),
            streak: walkStats?.currentStreak || 0,
            isMe: true,
            badge: currentStreak >= 7 ? '🔥' : '',
            trend: 'up',
        };

        const all = [...neighbors, me].sort((a, b) => b.score - a.score);
        return all.map((p, i) => ({ ...p, rank: i + 1 })).slice(0, 10);
    }, [myScore, walkStats, currentStreak, neighborhoodRank]);

    const myEntry = leaderboard.find(p => p.isMe);
    const myRank = myEntry?.rank || neighborhoodRank;
    const daysLeft = getDaysUntilWeekend();
    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="space-y-4">
            {/* ── Hafta Özeti ── */}
            <div className="bg-gradient-to-br from-[#1a0a2e] to-[#0d1526] border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[8px] font-black text-purple-400/60 uppercase tracking-[0.3em]">Mahalle Yarışı</p>
                        <h3 className="text-base font-black text-white">Bu Haftanın Sıralaması</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider">{daysLeft} gün kaldı</p>
                        <p className="text-xs font-black text-purple-300">#{myRank} Konumsun</p>
                    </div>
                </div>

                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: <Footprints className="w-3 h-3" />, label: 'Mesafe', value: `${(walkStats?.totalDistanceKm || 0).toFixed(1)} km`, color: 'text-emerald-400' },
                        { icon: <Flame className="w-3 h-3" />, label: 'Seri', value: `${walkStats?.currentStreak || 0} gün`, color: 'text-orange-400' },
                        { icon: <TrendingUp className="w-3 h-3" />, label: 'Puanın', value: myScore.toLocaleString(), color: 'text-blue-400' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-2.5 text-center border border-card-border">
                            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                            <p className={`text-[11px] font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[7px] text-white/30 font-bold uppercase tracking-wider">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Podium (Top 3) ── */}
            <div className="flex items-end justify-center gap-3 px-2">
                {/* 2. */}
                {topThree[1] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`flex-1 flex flex-col items-center ${topThree[1].isMe ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
                    >
                        <div className="relative mb-2">
                            <img src={topThree[1].avatar} className="w-10 h-10 rounded-full border-2 border-silver object-cover" alt={topThree[1].name} />
                            <span className="absolute -bottom-1 -right-1 text-sm">🥈</span>
                        </div>
                        <p className="text-[8px] font-black text-white/80 text-center leading-tight">{topThree[1].isMe ? 'Sen' : topThree[1].name.split(' ')[0]}</p>
                        <div className="bg-white/10 rounded-t-xl w-full h-14 flex items-end justify-center pb-1.5 mt-1">
                            <span className="text-[9px] font-black text-white/60">{topThree[1].score.toLocaleString()}</span>
                        </div>
                    </motion.div>
                )}

                {/* 1. */}
                {topThree[0] && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        className={`flex-1 flex flex-col items-center ${topThree[0].isMe ? 'ring-2 ring-yellow-400 rounded-2xl' : ''}`}
                    >
                        <motion.div
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative mb-2"
                        >
                            <img src={topThree[0].avatar} className="w-14 h-14 rounded-full border-2 border-yellow-400 object-cover shadow-[0_0_16px_rgba(251,191,36,0.5)]" alt={topThree[0].name} />
                            <span className="absolute -bottom-1 -right-1 text-lg">🥇</span>
                        </motion.div>
                        <p className="text-[9px] font-black text-yellow-300 text-center">{topThree[0].isMe ? 'SEN!' : topThree[0].name.split(' ')[0]}</p>
                        <div className="bg-gradient-to-t from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 rounded-t-xl w-full h-20 flex items-end justify-center pb-1.5 mt-1">
                            <span className="text-[9px] font-black text-yellow-300">{topThree[0].score.toLocaleString()}</span>
                        </div>
                    </motion.div>
                )}

                {/* 3. */}
                {topThree[2] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`flex-1 flex flex-col items-center ${topThree[2].isMe ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
                    >
                        <div className="relative mb-2">
                            <img src={topThree[2].avatar} className="w-10 h-10 rounded-full border-2 border-orange-400 object-cover" alt={topThree[2].name} />
                            <span className="absolute -bottom-1 -right-1 text-sm">🥉</span>
                        </div>
                        <p className="text-[8px] font-black text-white/80 text-center leading-tight">{topThree[2].isMe ? 'Sen' : topThree[2].name.split(' ')[0]}</p>
                        <div className="bg-white/5 rounded-t-xl w-full h-10 flex items-end justify-center pb-1.5 mt-1">
                            <span className="text-[9px] font-black text-white/60">{topThree[2].score.toLocaleString()}</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Tam Liste ── */}
            <div className="space-y-1.5">
                {rest.map((player, idx) => (
                    <motion.div
                        key={player.name + player.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            player.isMe
                                ? 'bg-purple-500/15 border-purple-500/30 shadow-[0_0_16px_rgba(168,85,247,0.1)]'
                                : 'bg-white/[0.02] border-card-border hover:bg-white/5'
                        }`}
                    >
                        <span className="text-[11px] font-black text-white/30 w-5 text-center shrink-0">
                            {player.rank}
                        </span>
                        <img src={player.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt={player.name} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className={`text-[10px] font-black leading-none ${player.isMe ? 'text-purple-300' : 'text-white/80'}`}>
                                    {player.isMe ? 'Sen 👈' : player.name}
                                </p>
                                {player.badge && <span className="text-[9px]">{player.badge}</span>}
                            </div>
                            <p className="text-[8px] text-white/30 font-semibold">{player.petName} · {player.distanceKm} km · {player.streak}🔥</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[8px] font-black ${TREND_COLOR[player.trend]}`}>
                                {TREND_ICON[player.trend]}
                            </span>
                            <span className="text-[10px] font-black text-white/60 font-mono">{player.score.toLocaleString()}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Hafta Sonu Bonusu ── */}
            {daysLeft <= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-3"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🎁</span>
                        <div>
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Hafta Sonu Bonusu!</p>
                            <p className="text-[10px] text-white/70 font-semibold">
                                {daysLeft === 0 ? 'Bugün son gün!' : `${daysLeft} gün kaldı`} — İlk 3'e gir, x2 PP ödülü kazan!
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
