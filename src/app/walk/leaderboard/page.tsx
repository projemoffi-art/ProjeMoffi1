"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Trophy, ChevronLeft, Crown, Medal, TrendingUp,
    Store, User, Shield, Flame, Globe2, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---

const LEAGUES = [
    { id: 'bronze', label: 'Bronz Lig', color: 'from-orange-700 to-orange-900', icon: Shield, minScore: 0 },
    { id: 'silver', label: 'Gümüş Lig', color: 'from-slate-300 to-slate-500', icon: Medal, minScore: 5000 },
    { id: 'gold', label: 'Altın Lig', color: 'from-yellow-300 to-yellow-600', icon: Trophy, minScore: 15000 },
    { id: 'diamond', label: 'Global Elit', color: 'from-cyan-400 to-blue-600', icon: Crown, minScore: 50000 },
];

const USERS = [
    { id: 1, name: "Atlas & Mochi", pet: "Golden Ret.", country: "TR", score: 62450, change: 2, avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop" },
    { id: 2, name: "Sarah & Max", pet: "Border Collie", country: "US", score: 58900, change: -1, avatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&h=150&fit=crop" },
    { id: 3, name: "Kenji & Hachi", pet: "Shiba Inu", country: "JP", score: 54200, change: 0, avatar: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&h=150&fit=crop" },
    { id: 4, name: "Elena & Luna", pet: "Husky", country: "ES", score: 48000, change: 5, avatar: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=150&h=150&fit=crop" },
    { id: 5, name: "Can & Dost", pet: "Labrador", country: "TR", score: 42100, change: 1, avatar: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&h=150&fit=crop" },
    { id: 6, name: "You", pet: "Poodle", country: "TR", score: 12500, change: 0, avatar: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&h=150&fit=crop" },
];

const BUSINESSES = [
    { id: 1, name: "Pati Cafe Moda", type: "Cafe", country: "TR", score: 120500, change: 0, image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&h=150&fit=crop" },
    { id: 2, name: "Royal Vet London", type: "Veteriner", country: "UK", score: 98000, change: 3, image: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=150&h=150&fit=crop" },
    { id: 3, name: "PetZone NY", type: "Shop", country: "US", score: 87500, change: -1, image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=150&h=150&fit=crop" },
];

export default function LeaderboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'business'>('users');
    const [currentLeagueIdx, setCurrentLeagueIdx] = useState(2); // Start at Gold

    // Cast to any to avoid TypeScript union type errors (User vs Business props)
    const currentData: any[] = activeTab === 'users' ? USERS : BUSINESSES;
    const league = LEAGUES[currentLeagueIdx];

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#121212] font-sans pb-10">

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-[#F8F9FC]/80 dark:bg-[#121212]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-card dark:bg-white/10 flex items-center justify-center shadow-moffi-card">
                    <ChevronLeft className="w-6 h-6 text-foreground dark:text-white" />
                </button>
                <h1 className="text-lg font-black bg-gradient-to-r from-[#5B4D9D] to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
                    Global Arena
                </h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </header>

            {/* LEAGUE SELECTOR (CAROUSEL) */}
            <div className="relative h-48 mb-6 overflow-hidden flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${league.color} opacity-20 blur-3xl rounded-full scale-150 animate-pulse`} />

                <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                        key={league.id}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        className="flex flex-col items-center"
                    >
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${league.color} flex items-center justify-center shadow-2xl mb-3 ring-4 ring-white/20`}>
                            <league.icon className="w-12 h-12 text-white drop-shadow-md" />
                        </div>
                        <h2 className="text-3xl font-black text-foreground dark:text-white uppercase tracking-tighter">{league.label}</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Haftalık Sıfırlama: 2 Gün</p>
                    </motion.div>

                    {/* League Switcher Arrows */}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-32 right-0 w-full flex justify-between px-12 pointer-events-none">
                        <button
                            className="pointer-events-auto p-2 bg-white/10 rounded-full backdrop-blur-md disabled:opacity-20"
                            disabled={currentLeagueIdx === 0}
                            onClick={() => setCurrentLeagueIdx(c => c - 1)}
                        ><ChevronLeft className="w-6 h-6 text-gray-500" /></button>
                        <button
                            className="pointer-events-auto p-2 bg-white/10 rounded-full backdrop-blur-md disabled:opacity-20"
                            disabled={currentLeagueIdx === LEAGUES.length - 1}
                            onClick={() => setCurrentLeagueIdx(c => c + 1)}
                        ><ChevronLeft className="w-6 h-6 text-gray-500 rotate-180" /></button>
                    </div>
                </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="px-6 mb-8">
                <div className="bg-card dark:bg-white/5 p-1 rounded-2xl flex relative shadow-moffi-card">
                    <motion.div
                        className="absolute top-1 bottom-1 w-[48%] bg-[#5B4D9D] rounded-xl shadow-md z-0"
                        animate={{ left: activeTab === 'users' ? '1%' : '51%' }}
                    />
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn("flex-1 py-3 relative z-10 font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2", activeTab === 'users' ? "text-white" : "text-gray-500")}
                    >
                        <User className="w-4 h-4" /> Kullanıcılar
                    </button>
                    <button
                        onClick={() => setActiveTab('business')}
                        className={cn("flex-1 py-3 relative z-10 font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2", activeTab === 'business' ? "text-white" : "text-gray-500")}
                    >
                        <Store className="w-4 h-4" /> İşletmeler
                    </button>
                </div>
            </div>

            {/* --- PODIUM (TOP 3) --- */}
            <div className="px-6 mb-8 flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-300 relative mb-2 shadow-lg">
                        <img src={currentData[1].avatar || currentData[1].image} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-2 inset-x-0 mx-auto w-6 h-6 bg-slate-300 text-white font-bold rounded-full flex items-center justify-center text-xs shadow">2</div>
                        <span className="absolute -top-1 -right-1 text-xl">🥈</span>
                    </div>
                    <div className="text-xs font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-20">{currentData[1].name}</div>
                    <div className="text-[10px] font-black text-[#5B4D9D]">{currentData[1].score.toLocaleString()} PC</div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-8">
                    <Crown className="w-8 h-8 text-yellow-500 mb-1 fill-yellow-500 animate-bounce" />
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 relative mb-2 shadow-xl shadow-yellow-500/20">
                        <img src={currentData[0].avatar || currentData[0].image} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-3 inset-x-0 mx-auto w-8 h-8 bg-yellow-400 text-white font-bold rounded-full flex items-center justify-center text-sm shadow">1</div>
                    </div>
                    <div className="text-sm font-black text-foreground dark:text-white text-center line-clamp-1 w-24">{currentData[0].name}</div>
                    <div className="text-xs font-black text-[#5B4D9D]">{currentData[0].score.toLocaleString()} PC</div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-400 relative mb-2 shadow-lg">
                        <img src={currentData[2].avatar || currentData[2].image} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-2 inset-x-0 mx-auto w-6 h-6 bg-orange-400 text-white font-bold rounded-full flex items-center justify-center text-xs shadow">3</div>
                        <span className="absolute -top-1 -right-1 text-xl">🥉</span>
                    </div>
                    <div className="text-xs font-bold text-foreground dark:text-gray-200 text-center line-clamp-1 w-20">{currentData[2].name}</div>
                    <div className="text-[10px] font-black text-[#5B4D9D]">{currentData[2].score.toLocaleString()} PC</div>
                </div>
            </div>

            {/* --- LIST --- */}
            <div className="px-4 space-y-3">
                {currentData.slice(3).map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={cn("bg-card dark:bg-[#1A1A1A] p-4 rounded-2xl flex items-center shadow-moffi-card border border-transparent transform transition-all active:scale-95",
                            item.name === 'You' ? "border-[#5B4D9D] bg-[#5B4D9D]/5" : "border-card-border dark:border-card-border"
                        )}
                    >
                        <div className="font-bold text-gray-400 w-6 text-center">{i + 4}</div>
                        <div className="w-12 h-12 rounded-full mx-4 relative">
                            <img src={item.avatar || (item as any).image} className="w-full h-full rounded-full object-cover" />
                            {/* Country Flag (Mock) */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-[10px] overflow-hidden">
                                {item.country === 'TR' ? '🇹🇷' : item.country === 'US' ? '🇺🇸' : item.country === 'JP' ? '🇯🇵' : '🇪🇺'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2">
                                {item.name}
                                {item.name === 'You' && <span className="bg-[#5B4D9D] text-white text-[9px] px-1.5 py-0.5 rounded uppercase">Sen</span>}
                            </div>
                            <div className="text-xs text-gray-500">{(item as any).pet || (item as any).type}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-black text-sm text-[#5B4D9D]">{item.score.toLocaleString()} PC</div>
                            <div className={cn("text-[10px] font-bold flex items-center justify-end gap-1", item.change > 0 ? "text-green-500" : item.change < 0 ? "text-red-500" : "text-gray-400")}>
                                {item.change !== 0 && <TrendingUp className={cn("w-3 h-3", item.change < 0 && "rotate-180")} />}
                                {item.change === 0 ? '-' : Math.abs(item.change)}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* STICKY USER RANK (If not in top 3) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-card-border dark:border-card-border z-40">
                <div className="bg-[#5B4D9D] rounded-xl p-3 flex items-center text-white shadow-xl shadow-purple-500/30">
                    <div className="font-black w-8 text-center text-white/50">#6</div>
                    <div className="w-10 h-10 rounded-full bg-white/20 mx-3 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&h=150&fit=crop" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-sm">Sen ve Poodle</div>
                        <div className="text-[10px] opacity-80">Gümüş Lige 2.500 Puan Kaldı!</div>
                    </div>
                    <div className="font-black text-lg">12.5k</div>
                </div>
            </div>

        </div>
    );
}
