"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Gamepad2, Trophy, Zap, 
    Star, Heart, Coins, ChevronRight, 
    Play, Activity, Target, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface GameQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
    level?: number;
    xp?: number;
    dailyPoints?: number;
}

export function GameQuickSheet({ 
    isOpen, 
    onClose, 
    petName = "Moffi",
    level = 5,
    xp = 1250,
    dailyPoints = 20
}: GameQuickSheetProps) {
    const router = useRouter();
    const DAILY_CAP = 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 inset-x-0 z-[3001] bg-[#0A0A0A] rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                        <div className="px-8 pt-10 pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Arena</h3>
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2">Eğlence & Rekabet Merkezi</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        <div className="px-8 pb-12 space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* 1. DAILY PROGRESS */}
                            <section className="bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 rounded-[2.2rem] p-6 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                                <div className="flex items-center justify-between relative z-10 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                            <Coins className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest leading-none mb-1">Günlük Ödül Limiti</p>
                                            <h4 className="text-xl font-black text-white tracking-tight uppercase italic">{dailyPoints} / {DAILY_CAP} PC</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(dailyPoints / DAILY_CAP) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    />
                                </div>
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-3 text-right">Bugün {DAILY_CAP - dailyPoints} Puan Daha Kazanabilirsin</p>
                            </section>

                            {/* 2. PET STATUS BENTO */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 group hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-black text-white leading-none">Lv. {level}</span>
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Seviye</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 group hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-black text-white leading-none">%95</span>
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Mutluluk</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. AREADERBOARD PREVIEW */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Arena Sıralaması
                                    </h4>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Tümünü Gör</span>
                                </div>

                                <div className="bg-gradient-to-br from-[#1A1A1A] to-transparent border border-white/10 rounded-[2.2rem] p-5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                                            <Trophy className="w-7 h-7 text-yellow-500 relative z-10" />
                                            <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
                                        </div>
                                        <div>
                                            <h6 className="text-white font-black text-base italic uppercase tracking-tighter leading-none">Global Resident</h6>
                                            <p className="text-yellow-500/80 text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                <Target className="w-3 h-3" /> Sıralaman: #6
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-2 rounded-lg">
                                        <ChevronRight className="w-4 h-4 text-white/30" />
                                    </div>
                                </div>
                            </section>

                            {/* 4. RECENT ACTIVITIES */}
                            <section>
                                <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Son Aktiviteler
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                                                <Flame className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-white/80">Mama Yakala</span>
                                        </div>
                                        <span className="text-[10px] font-black text-green-400">+12 Puan</span>
                                    </div>
                                </div>
                            </section>

                            {/* FOOTER: PLAY GAMES */}
                            <button
                                onClick={() => { router.push('/game'); onClose(); }}
                                className="w-full bg-indigo-600 py-6 rounded-[2.2rem] flex items-center justify-center gap-4 group active:scale-[0.98] transition-all shadow-2xl shadow-indigo-600/20"
                            >
                                <span className="text-white text-sm font-black uppercase tracking-[0.3em]">Hemen Oyna</span>
                                <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
