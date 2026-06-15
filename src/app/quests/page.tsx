"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { usePet } from "@/context/PetContext";
import { useLiveEvents } from "@/context/LiveEventsContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
        <div className={cn(
            "min-h-screen pb-24 relative overflow-hidden transition-all duration-500",
            isDark 
                ? "bg-gradient-to-b from-[#0e0a16] via-[#080d18] to-[#04060b]" 
                : "bg-gradient-to-b from-[#f9f6ef] via-[#f3edd9] to-[#e8dec4]"
        )}>
            {/* Dark mode magic stars */}
            <ConstellationBg />
            
            {/* Header: Designed like a wooden Guild Hall deck in light, obsidian frame in dark */}
            <div className={cn(
                "pt-safe sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300 px-4 py-3.5 flex items-center justify-between shadow-md",
                isDark 
                    ? "bg-[#140c24]/80 border-purple-500/10 shadow-black/20" 
                    : "bg-[#624730] border-[#4c3522] text-[#faf6eb] shadow-[#332115]/15"
            )}>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()} 
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-90",
                            isDark 
                                ? "bg-white/5 border-card-border text-white/70 hover:bg-white/10 hover:text-white" 
                                : "bg-[#faf6eb] border-[#c0a684] text-[#624730] hover:bg-[#e7dec4]"
                        )}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <p className={cn(
                            "text-[9px] font-black uppercase tracking-[0.25em] transition-colors duration-300",
                            isDark ? "text-purple-400/50" : "text-[#d97706]/80"
                        )}>
                            Tam Görev Merkezi
                        </p>
                        <h2 className={cn(
                            "text-base font-black leading-tight transition-colors duration-300",
                            isDark ? "text-white" : "text-[#faf6eb]"
                        )}>
                            {levelTitle} · Lv.{level}
                        </h2>
                    </div>
                </div>
                
                {/* Gold Coin Pouch badge */}
                <div className={cn(
                    "flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-all duration-300 shadow-sm",
                    isDark 
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
                        : "bg-[#faf6eb] border-[#c0a684] text-[#b45309]"
                )}>
                    <Star className="w-4 h-4 text-yellow-500 fill-current animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[11px] font-black tracking-tight">{totalPatiPuan.toLocaleString()} PP</span>
                </div>
            </div>

            {/* RPG Character HUD Area */}
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
                    
                    {/* Mana/XP Bar & Status Cards */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                                    isDark ? "text-white/30" : "text-[#624730]/60"
                                )}>
                                    Mana Seviyesi (XP)
                                </span>
                                <span className={cn(
                                    "text-[9px] font-black font-mono transition-colors duration-300",
                                    isDark ? "text-indigo-400" : "text-indigo-650"
                                )}>
                                    {levelXpCurrent}/{levelXpRequired}
                                </span>
                            </div>
                            
                            {/* Glowing Mana Bar */}
                            <div className={cn(
                                "h-2.5 rounded-full overflow-hidden border transition-all duration-300",
                                isDark ? "bg-white/5 border-white/[0.04]" : "bg-[#e7dec4] border-[#c0a684]/50 shadow-inner"
                            )}>
                                <motion.div
                                    className={cn(
                                        "h-full rounded-full",
                                        isDark ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpPct}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    style={{ 
                                        boxShadow: isDark 
                                            ? '0 0 10px rgba(168,85,247,0.7)' 
                                            : '0 0 6px rgba(16,185,129,0.4)' 
                                    }}
                                />
                            </div>
                        </div>

                        {/* RPG Stat Box Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: `${currentStreak}🔥`, label: 'Seri', color: isDark ? 'text-orange-400' : 'text-orange-600' },
                                { val: `${completedCount}/${totalCount}`, label: 'Görev', color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                                { val: `+${todayEarned.pp}`, label: 'Bugün PP', color: isDark ? 'text-yellow-400' : 'text-amber-600' },
                                { val: String(earnedBadges.length), label: 'Rozet 🏅', color: isDark ? 'text-purple-400' : 'text-purple-650' },
                            ].map((s, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "border rounded-xl p-2.5 flex flex-col items-center justify-center transition-all duration-300",
                                        isDark 
                                            ? "bg-white/[0.02] border-card-border" 
                                            : "bg-[#faf6eb] border-[#c0a684]/45 shadow-sm shadow-[#9c8b74]/5"
                                    )}
                                >
                                    <span className={cn("text-xs font-black", s.color)}>{s.val}</span>
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase mt-0.5 tracking-wider transition-colors duration-300",
                                        isDark ? "text-white/30" : "text-[#624730]/50"
                                    )}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Curved Treasure Trail Map */}
                <div className="mt-6">
                    <NumberedRoadMap weeklyStamps={weeklyStamps} maxStamps={maxWeeklyStamps} />
                </div>
            </div>

            {/* RPG Navigation Tabs (Stone / Ancient Folder Deck) */}
            <div className={cn(
                "px-4 sticky top-[72px] z-30 backdrop-blur-md pt-2.5 pb-3.5 flex gap-1.5 border-b transition-all duration-355 shadow-sm",
                isDark 
                    ? "bg-[#0e0a16]/90 border-purple-500/10 shadow-black/5" 
                    : "bg-[#f3edd9]/90 border-[#c0a684]/35 shadow-amber-900/5"
            )}>
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 border cursor-pointer active:scale-95",
                            activeTab === tab.id
                                ? isDark
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                                    : 'bg-[#faf6eb] text-[#624730] border-[#c0a684] shadow-md shadow-[#9c8b74]/8'
                                : isDark
                                    ? 'border-transparent text-white/35 hover:text-white/60 hover:bg-white/5'
                                    : 'border-transparent text-[#9c8b74] hover:text-[#624730] hover:bg-[#faf6eb]/50'
                        )}
                    >
                        <span className="text-sm shrink-0">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content area */}
            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'daily' && (
                        <motion.div 
                            key="daily" 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -12 }} 
                            className="space-y-3 flex justify-center w-full"
                        >
                            <QuestCarousel quests={dailyQuests} onManualComplete={completeManualQuest} />
                        </motion.div>
                    )}

                    {activeTab === 'league' && (
                        <motion.div 
                            key="league" 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -12 }} 
                            className="space-y-5"
                        >
                            {/* League ranking board */}
                            <div className={cn(
                                "border rounded-3xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm",
                                isDark 
                                    ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]" 
                                    : "bg-gradient-to-br from-[#faf6eb] to-[#f5ebd6] border-[#c0a684] shadow-[#9c8b74]/5"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl filter drop-shadow-md">🛡️</div>
                                    <div>
                                        <h4 className={cn(
                                            "text-sm font-black uppercase tracking-wider transition-colors duration-300",
                                            isDark ? "text-white" : "text-[#624730]"
                                        )}>
                                            Gümüş Lig
                                        </h4>
                                        <p className={cn(
                                            "text-[10px] font-bold mt-1 transition-colors duration-300",
                                            isDark ? "text-yellow-400" : "text-[#b45309]"
                                        )}>
                                            Kademe 2 • Yükselmeye %15 kaldı
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className={cn(
                                        "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner transition-colors duration-300",
                                        isDark ? "bg-white/10 text-white/70" : "bg-[#e7dec4] text-[#624730]"
                                    )}>
                                        ⏳ Kapanış: 3g 12s
                                    </div>
                                    <div className={cn(
                                        "text-[8px] font-black uppercase tracking-wider transition-colors duration-300",
                                        isDark ? "text-yellow-400/80" : "text-[#b45309]/80"
                                    )}>
                                        İlk 3'e 500 PP Ödül
                                    </div>
                                </div>
                            </div>

                            <MiniLeaderboard />

                            {/* Arena live event banner */}
                            <div className={cn(
                                "border rounded-3xl p-5 flex items-center justify-between transition-colors duration-300 shadow-sm",
                                isDark 
                                    ? "bg-indigo-500/5 border-indigo-500/10" 
                                    : "bg-[#e7dec4]/40 border-[#c0a684]/50"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h4 className={cn(
                                            "text-[11px] font-black uppercase tracking-widest transition-colors duration-300",
                                            isDark ? "text-white/70" : "text-[#624730]/70"
                                        )}>
                                            Canlı Etkinlik
                                        </h4>
                                        <p className={cn(
                                            "text-[11px] font-bold mt-1 transition-colors duration-300",
                                            isDark ? "text-indigo-300" : "text-[#6366f1]"
                                        )}>
                                            Şu an {liveWalkerCount} kişi yürüyor
                                        </p>
                                    </div>
                                </div>
                                <button className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer",
                                    isDark 
                                        ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30" 
                                        : "bg-[#faf6eb] border border-[#c0a684] text-[#624730] hover:bg-[#e7dec4]"
                                )}>
                                    Radar
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'research' && (
                        <motion.div 
                            key="research" 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {monthlyResearch
                                ? <ResearchPanel research={monthlyResearch} />
                                : <div className={cn("text-center py-10 text-xs transition-colors", isDark ? "text-white/20" : "text-[#624730]/40")}>Araştırma yükleniyor...</div>
                            }
                        </motion.div>
                    )}

                    {activeTab === 'badges' && (
                        <motion.div 
                            key="badges" 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -12 }} 
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                    isDark ? "text-white/30" : "text-[#624730]/65"
                                )}>
                                    Rozet Koleksiyonu
                                </span>
                                <span className={cn(
                                    "text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all duration-300",
                                    isDark 
                                        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" 
                                        : "bg-[#faf6eb] border-[#c0a684] text-[#b45309]"
                                )}>
                                    {earnedBadges.length}/{badges.length}
                                </span>
                            </div>
                            <BadgePanel badges={badges} earnedBadges={earnedBadges} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
