"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, MapPin, Trophy, Flame, Timer, 
    Footprints, Play, ArrowRight, Star,
    Navigation, Activity, ChevronRight,
    Cookie, Sparkles, BrainCircuit, Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useActivity } from "@/context/ActivityContext";

interface WalkQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petId?: string;
}

export function WalkQuickSheet({ isOpen, onClose, petId = "pet-1" }: WalkQuickSheetProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { walkData, startWalk, stopWalk } = useActivity();

    // Helper to format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
                        className="fixed bottom-0 inset-x-0 z-[3001] bg-[#121212] rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* iOS Style Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                        <div className="px-8 pt-10 pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Yürüyüş</h3>
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.3em] mt-2",
                                    walkData.isActive ? "text-emerald-400 animate-pulse" : "text-orange-500"
                                )}>
                                    {walkData.isActive ? "Şu An Aktif" : "Günlük İstatistikler"}
                                </p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        <div className="px-8 pb-12 space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* AI INSIGHT CARD (Moffi AI Lab Feature) */}
                            {user?.settings?.ai?.walkAnalysis && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 rounded-[2.2rem] p-6 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-3">Moffi AI Analizi</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <BrainCircuit className="w-4 h-4 text-violet-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-tight italic">Optimal Saat: 18:30 - 19:45</p>
                                                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">Dostunun enerji seviyesi bu saatlerde zirve yapıyor.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                                    <p className="text-[7px] font-black text-white/30 uppercase mb-1">Rota Verimliliği</p>
                                                    <p className="text-xs font-black text-emerald-400 tracking-widest">%94 SKOR</p>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                                    <p className="text-[7px] font-black text-white/30 uppercase mb-1">Kalori Yakımı</p>
                                                    <p className="text-xs font-black text-orange-400 tracking-widest">+12% ARTIŞ</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Decorative mesh */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
                                </motion.div>
                            )}
                            
                            {/* 1. BENTO STATS BAR - LIVE SYNC */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className={cn(
                                    "bg-white/5 border rounded-[1.8rem] p-4 flex flex-col items-center justify-center gap-1 transition-all",
                                    walkData.isActive ? "border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "border-white/5"
                                )}>
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 mb-1">
                                        <Flame className="w-4 h-4" />
                                    </div>
                                    <span className="text-xl font-black text-white">
                                        {walkData.isActive ? Math.floor(walkData.distance / 12) : "240"}
                                    </span>
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Kcal</span>
                                </div>
                                <div className={cn(
                                    "bg-white/5 border rounded-[1.8rem] p-4 flex flex-col items-center justify-center gap-1 transition-all",
                                    walkData.isActive ? "border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-white/5"
                                )}>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mb-1">
                                        <Footprints className="w-4 h-4" />
                                    </div>
                                    <span className="text-xl font-black text-white">
                                        {walkData.isActive 
                                            ? (walkData.distance >= 1000 ? (walkData.distance / 1000).toFixed(1) : Math.floor(walkData.distance)) 
                                            : "3.2"}
                                    </span>
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        {walkData.isActive ? (walkData.distance >= 1000 ? 'Km' : 'Metre') : 'Km'}
                                    </span>
                                </div>
                                <div className={cn(
                                    "bg-white/5 border rounded-[1.8rem] p-4 flex flex-col items-center justify-center gap-1 transition-all",
                                    walkData.isActive ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-white/5"
                                )}>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-1">
                                        <Timer className="w-4 h-4" />
                                    </div>
                                    <span className="text-xl font-black text-white">
                                        {walkData.isActive ? formatTime(walkData.time) : "45"}
                                    </span>
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        {walkData.isActive ? "Canlı" : "Dk"}
                                    </span>
                                </div>
                            </div>

                            {/* 2. LEADERBOARD CARD */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-3 h-3 text-yellow-500" /> Global Arena
                                    </h4>
                                    <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Silver II</span>
                                </div>

                                <div className="bg-gradient-to-br from-[#240b36] to-[#c31432]/20 border border-white/10 rounded-[2.2rem] p-5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
                                    
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                                                <Trophy className="w-8 h-8 text-yellow-400 fill-current" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-white text-lg leading-tight uppercase italic">Sıralaman</h5>
                                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest font-mono">#6 Global Resident</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white tracking-tighter">2,450</div>
                                            <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Puan</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. LIVE RADAR / FRIENDS NEARBY */}
                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h6 className="text-white font-black text-sm uppercase tracking-tight italic">Çevrede Hareketlilik</h6>
                                        <p className="text-indigo-400/80 text-[10px] font-black uppercase tracking-widest mt-0.5">12 Moffi Arkadaşı Aktif</p>
                                    </div>
                                </div>
                                <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Radar
                                </div>
                            </div>

                            {/* 4. ACTIONS - SYNCED WITH GLOBAL STATE */}
                            <div className="space-y-4">
                                {walkData.isActive ? (
                                    <button
                                        onClick={() => { stopWalk(); onClose(); }}
                                        className="w-full h-16 bg-red-500 text-white rounded-[1.8rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
                                    >
                                        <Square className="w-6 h-6 fill-current" />
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">Yürüyüşü Bitir</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { startWalk(); router.push('/walk/tracking'); onClose(); }}
                                        className="w-full h-16 bg-white text-black rounded-[1.8rem] flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <Play className="w-6 h-6 fill-current" />
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">Yürüyüşü Başlat</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => { router.push('/walk'); onClose(); }}
                                    className="w-full bg-white/5 border border-white/10 py-5 rounded-[2rem] flex items-center justify-center gap-3 group hover:bg-white hover:text-black transition-all"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Detaylı Panele Git</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
