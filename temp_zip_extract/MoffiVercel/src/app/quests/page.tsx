"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { usePet } from "@/context/PetContext";
import { useLiveEvents } from "@/context/LiveEventsContext";
import { 
    ConstellationBg, 
    QuestOrbitalRing, 
    NumberedRoadMap, 
    QuestCarousel, 
    MiniLeaderboard, 
    ResearchPanel, 
    BadgePanel 
} from "@/components/quests/QuestPanel";

type TabType = 'daily' | 'league' | 'research' | 'badges';

export default function FullQuestCenter() {
    const router = useRouter();
    const {
        dailyQuests, completedCount, totalCount,
        monthlyResearch, badges, earnedBadges,
        totalPatiPuan, level, levelTitle, levelXpCurrent, levelXpRequired,
        todayEarned, currentStreak, weeklyStamps, maxWeeklyStamps, completeManualQuest
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
        <div className="min-h-screen pb-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #100820 0%, #080d18 50%, #060810 100%)' }}>
            <ConstellationBg />
            
            {/* Header */}
            <div className="pt-safe sticky top-0 z-40 bg-[#100820]/80 backdrop-blur-xl border-b border-purple-500/10 shrink-0 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-card-border text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-purple-400/50 uppercase tracking-[0.3em]">Tam Görev Merkezi</p>
                        <h2 className="text-lg font-black text-white leading-tight">{levelTitle} · Lv.{level}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-[11px] font-black text-yellow-400">{totalPatiPuan.toLocaleString()} PP</span>
                </div>
            </div>

            {/* Orbital + Stats (Header Area) */}
            <div className="px-5 py-6">
                <div className="flex items-center gap-6">
                    <QuestOrbitalRing
                        pct={questPct}
                        petImage={activePet?.avatar || activePet?.image || activePet?.image_url || undefined}
                        petName={activePet?.name}
                        dayNumber={new Date().getDay() === 0 ? 7 : new Date().getDay()}
                        todayPP={todayEarned.pp}
                        streak={currentStreak}
                        completedCount={completedCount}
                        totalCount={totalCount}
                    />
                    
                    <div className="flex-1 space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Gelişim Seviyesi (XP)</span>
                                <span className="text-[9px] font-black text-indigo-400 font-mono">{levelXpCurrent}/{levelXpRequired}</span>
                            </div>
                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpPct}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: `${currentStreak}🔥`, label: 'Seri', color: 'text-orange-400' },
                                { val: `${completedCount}/${totalCount}`, label: 'Görev', color: 'text-emerald-400' },
                                { val: `+${todayEarned.pp}`, label: 'Bugün PP', color: 'text-yellow-400' },
                                { val: String(earnedBadges.length), label: 'Rozet 🏅', color: 'text-purple-400' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white/[0.02] border border-card-border rounded-xl p-2.5 flex flex-col items-center justify-center">
                                    <span className={`text-sm font-black ${s.color}`}>{s.val}</span>
                                    <span className="text-[8px] font-bold text-white/30 uppercase mt-0.5 tracking-wider">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <NumberedRoadMap weeklyStamps={weeklyStamps} maxStamps={maxWeeklyStamps} />
                </div>
            </div>

            {/* TABS */}
            <div className="px-4 sticky top-[80px] z-30 bg-[#100820]/80 backdrop-blur-md pt-2 pb-3 flex gap-1.5 border-b border-purple-500/10">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === tab.id
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : 'text-white/25 hover:text-white/50 hover:bg-white/5'
                        }`}
                    >
                        <span className="text-sm">{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'daily' && (
                        <motion.div key="daily" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3 flex justify-center w-full">
                            <QuestCarousel quests={dailyQuests} onManualComplete={completeManualQuest} />
                        </motion.div>
                    )}

                    {activeTab === 'league' && (
                        <motion.div key="league" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-3xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(234,179,8,0.05)]">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl filter drop-shadow-lg">🛡️</div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Gümüş Lig</h4>
                                        <p className="text-[10px] font-bold text-yellow-400 mt-1">Kademe 2 • Yükselmeye %15 kaldı</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="bg-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-black text-white/70 uppercase tracking-widest shadow-inner">
                                        ⏳ Kapanış: 3g 12s
                                    </div>
                                    <div className="text-[8px] font-black text-yellow-400/80 uppercase tracking-wider">
                                        İlk 3'e 500 PP Ödül
                                    </div>
                                </div>
                            </div>

                            <MiniLeaderboard />

                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white/70 uppercase tracking-widest">Canlı Etkinlik</h4>
                                        <p className="text-[11px] font-bold text-indigo-300 mt-1">Şu an {liveWalkerCount} kişi yürüyor</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/30 transition-colors">
                                    Radar
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'research' && (
                        <motion.div key="research" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {monthlyResearch
                                ? <ResearchPanel research={monthlyResearch} />
                                : <div className="text-center py-10 text-white/20 text-xs">Araştırma yükleniyor...</div>
                            }
                        </motion.div>
                    )}

                    {activeTab === 'badges' && (
                        <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Rozet Koleksiyonu</span>
                                <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">{earnedBadges.length}/{badges.length}</span>
                            </div>
                            <BadgePanel badges={badges} earnedBadges={earnedBadges} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
