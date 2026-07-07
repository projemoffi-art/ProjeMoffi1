"use client";

import { useState, useEffect } from "react";
import {
    Trophy, ChevronLeft, Crown, Medal, TrendingUp,
    Store, User, Shield, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";

// --- MOCK LEAGUES ---
const LEAGUES = [
    { id: 'bronze', label: 'Bronz Lig', color: 'from-orange-700 to-orange-900', icon: Shield, minScore: 0 },
    { id: 'silver', label: 'Gümüş Lig', color: 'from-slate-300 to-slate-500', icon: Medal, minScore: 500 },
    { id: 'gold', label: 'Altın Lig', color: 'from-yellow-300 to-yellow-600', icon: Trophy, minScore: 5000 },
    { id: 'diamond', label: 'Global Elit', color: 'from-cyan-400 to-blue-600', icon: Crown, minScore: 20000 },
];

export function LeaderboardSection() {
    const { user: currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'users' | 'business'>('users');
    
    const [users, setUsers] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [userRank, setUserRank] = useState<number>(0);
    const [userScore, setUserScore] = useState<number>(0);
    
    const currentData = activeTab === 'users' ? users : businesses;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const [usersData, businessesData] = await Promise.all([
                    apiService.getLeaderboard('user', 50),
                    apiService.getLeaderboard('business', 50)
                ]);
                setUsers(usersData);
                setBusinesses(businessesData);

                if (currentUser) {
                    const rank = await apiService.getUserRank(currentUser.id);
                    setUserRank(rank);
                    
                    // Bulunduğu skoru tespit et (profilinden)
                    const profile = await apiService.getUserProfile(currentUser.id);
                    if (profile) {
                        setUserScore(profile.moffi_coins || 0);
                    }
                }
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [currentUser]);

    // Dinamik lig hesaplaması (En yüksek puana göre veya sabit sınırlarla)
    // Şimdilik test için score'a göre currentLeague belirliyoruz
    let targetLeagueIdx = 0;
    for (let i = LEAGUES.length - 1; i >= 0; i--) {
        if (userScore >= LEAGUES[i].minScore) {
            targetLeagueIdx = i;
            break;
        }
    }
    
    const [currentLeagueIdx, setCurrentLeagueIdx] = useState(targetLeagueIdx);
    
    useEffect(() => {
        setCurrentLeagueIdx(targetLeagueIdx);
    }, [targetLeagueIdx]);

    const league = LEAGUES[currentLeagueIdx];

    const isCurrentUserInTop3 = activeTab === 'users' && currentUser && currentData.slice(0, 3).some(u => u.id === currentUser.id);

    return (
        <div className="bg-transparent font-sans py-6 relative">
            
            <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Global Lig Arenası
                </h3>
            </div>

            {/* LEAGUE SELECTOR (CAROUSEL) */}
            <div className="relative h-48 mb-6 overflow-hidden flex items-center justify-center bg-card dark:bg-[#1A1A1A] rounded-3xl shadow-moffi-card border border-card-border/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${league.color} opacity-20 blur-3xl rounded-full scale-150 transition-all duration-700 animate-pulse`} />

                <div className="relative z-10 flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={league.id}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${league.color} flex items-center justify-center shadow-2xl mb-3 ring-4 ring-white/20 transition-all duration-500`}>
                                <league.icon className="w-12 h-12 text-white drop-shadow-md" />
                            </div>
                            <h2 className="text-3xl font-black text-foreground dark:text-white uppercase tracking-tighter">{league.label}</h2>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Haftalık Sıfırlama: 2 Gün</p>
                        </motion.div>
                    </AnimatePresence>

                    {/* League Switcher Arrows */}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-32 right-0 w-full flex justify-between px-10 pointer-events-none">
                        <button
                            className="pointer-events-auto p-2 bg-white/50 dark:bg-white/10 rounded-full backdrop-blur-md disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform"
                            disabled={currentLeagueIdx === 0}
                            onClick={() => setCurrentLeagueIdx(c => c - 1)}
                        ><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                        <button
                            className="pointer-events-auto p-2 bg-white/50 dark:bg-white/10 rounded-full backdrop-blur-md disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform"
                            disabled={currentLeagueIdx === LEAGUES.length - 1}
                            onClick={() => setCurrentLeagueIdx(c => c + 1)}
                        ><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 rotate-180" /></button>
                    </div>
                </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="mb-8">
                <div className="bg-card dark:bg-white/5 p-1 rounded-2xl flex relative shadow-moffi-card border border-card-border/50">
                    <motion.div
                        className="absolute top-1 bottom-1 w-[48%] bg-[#5B4D9D] rounded-xl shadow-md z-0"
                        animate={{ left: activeTab === 'users' ? '1%' : '51%' }}
                    />
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn("flex-1 py-2.5 relative z-10 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5", activeTab === 'users' ? "text-white" : "text-gray-500")}
                    >
                        <User className="w-3.5 h-3.5" /> Kullanıcılar
                    </button>
                    <button
                        onClick={() => setActiveTab('business')}
                        className={cn("flex-1 py-2.5 relative z-10 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5", activeTab === 'business' ? "text-white" : "text-gray-500")}
                    >
                        <Store className="w-3.5 h-3.5" /> İşletmeler
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sıralama Hesaplanıyor...</span>
                </div>
            ) : currentData.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Bu ligde henüz kimse yok.
                </div>
            ) : (
                <>
                    {/* --- PODIUM (TOP 3) --- */}
                    <div className="mb-8 flex items-end justify-center gap-3">
                        {/* 2nd Place */}
                        {currentData[1] && (
                            <div className="flex flex-col items-center">
                                <div className={cn("w-14 h-14 rounded-full border-4 border-slate-300 relative mb-2 shadow-lg", currentUser?.id === currentData[1].id ? "border-[#5B4D9D]" : "")}>
                                    <img src={currentData[1].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentData[1].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-5 h-5 bg-slate-300 text-white font-bold rounded-full flex items-center justify-center text-[10px] shadow">2</div>
                                    <span className="absolute -top-1 -right-1 text-base">🥈</span>
                                </div>
                                <div className="text-[10px] font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-16">{currentUser?.id === currentData[1].id ? 'Sen' : currentData[1].name}</div>
                                <div className="text-[9px] font-black text-[#5B4D9D] mt-0.5">{currentData[1].score.toLocaleString()} PC</div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {currentData[0] && (
                            <div className="flex flex-col items-center -mt-6">
                                <Crown className="w-7 h-7 text-yellow-500 mb-1 fill-yellow-500 animate-bounce" />
                                <div className={cn("w-20 h-20 rounded-full border-4 border-yellow-400 relative mb-2 shadow-xl shadow-yellow-500/20", currentUser?.id === currentData[0].id ? "ring-4 ring-[#5B4D9D]/30" : "")}>
                                    <img src={currentData[0].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentData[0].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                    <div className="absolute -bottom-2.5 inset-x-0 mx-auto w-6 h-6 bg-yellow-400 text-white font-bold rounded-full flex items-center justify-center text-[11px] shadow">1</div>
                                </div>
                                <div className="text-xs font-black text-foreground dark:text-white text-center line-clamp-1 w-20">{currentUser?.id === currentData[0].id ? 'Sen' : currentData[0].name}</div>
                                <div className="text-[10px] font-black text-[#5B4D9D] mt-0.5">{currentData[0].score.toLocaleString()} PC</div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {currentData[2] && (
                            <div className="flex flex-col items-center">
                                <div className={cn("w-14 h-14 rounded-full border-4 border-orange-400 relative mb-2 shadow-lg", currentUser?.id === currentData[2].id ? "border-[#5B4D9D]" : "")}>
                                    <img src={currentData[2].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentData[2].id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-5 h-5 bg-orange-400 text-white font-bold rounded-full flex items-center justify-center text-[10px] shadow">3</div>
                                    <span className="absolute -top-1 -right-1 text-base">🥉</span>
                                </div>
                                <div className="text-[10px] font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-16">{currentUser?.id === currentData[2].id ? 'Sen' : currentData[2].name}</div>
                                <div className="text-[9px] font-black text-[#5B4D9D] mt-0.5">{currentData[2].score.toLocaleString()} PC</div>
                            </div>
                        )}
                    </div>

                    {/* --- LIST --- */}
                    <div className="space-y-2.5">
                        {currentData.slice(3).map((item, i) => {
                            const isMe = currentUser?.id === item.id;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className={cn("bg-card dark:bg-[#1A1A1A] p-3.5 rounded-[1.25rem] flex items-center shadow-sm border transform transition-all",
                                        isMe ? "border-[#5B4D9D]/50 bg-[#5B4D9D]/5" : "border-card-border/50 dark:border-white/5"
                                    )}
                                >
                                    <div className="font-bold text-gray-400 w-5 text-center text-xs">{i + 4}</div>
                                    <div className="w-10 h-10 rounded-full mx-3 relative">
                                        <img src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.id}`} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                        {/* Country Flag */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-[8px] overflow-hidden">
                                            {item.country === 'TR' ? '🇹🇷' : '🇹🇷'}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-black text-[11px] text-foreground dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                                            {isMe ? 'Sen' : item.name}
                                            {isMe && <span className="bg-[#5B4D9D] text-white text-[7px] px-1.5 py-0.5 rounded">SEN</span>}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.pet}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-xs text-[#5B4D9D]">{item.score.toLocaleString()}</div>
                                        <div className={cn("text-[9px] font-bold flex items-center justify-end gap-0.5 mt-0.5", item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-500" : "text-gray-400")}>
                                            {item.change !== 0 && <TrendingUp className={cn("w-2.5 h-2.5", item.change < 0 && "rotate-180")} />}
                                            {item.change === 0 ? '-' : Math.abs(item.change)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STICKY USER RANK (If not in top 3 and user is looking at users tab) */}
            {currentUser && activeTab === 'users' && !isCurrentUserInTop3 && !loading && (
                <div className="mt-6">
                    <div className="bg-[#5B4D9D] rounded-2xl p-3.5 flex items-center text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        <div className="font-black w-8 text-center text-white/50 text-xs">#{userRank}</div>
                        <div className="w-10 h-10 rounded-full bg-white/20 mx-2 overflow-hidden shrink-0 border border-white/20">
                            <img src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="font-black text-[11px] uppercase tracking-wide truncate">Sen</div>
                            {userScore < LEAGUES[LEAGUES.length - 1].minScore ? (
                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-80 mt-0.5 truncate">
                                    Bir Sonraki Lige {LEAGUES[Math.min(LEAGUES.length - 1, targetLeagueIdx + 1)].minScore - userScore} Puan Kaldı!
                                </div>
                            ) : (
                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-80 mt-0.5 truncate text-yellow-300">
                                    En Üst Ligdesin!
                                </div>
                            )}
                        </div>
                        <div className="font-black text-sm shrink-0 pl-1">{userScore.toLocaleString()}</div>
                    </div>
                </div>
            )}

        </div>
    );
}
