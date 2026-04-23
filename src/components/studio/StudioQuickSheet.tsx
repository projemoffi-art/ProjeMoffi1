"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Palette, Shirt, 
    Coffee, Dog, ChevronRight, 
    ArrowRight, Star, Layers, Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Draft {
    id: string;
    title: string;
    image: string;
    date: string;
}

const RECENT_DRAFTS: Draft[] = [
    { id: "d1", title: "Mavi Aura Tshirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200", date: "2 saat önce" },
    { id: "d2", title: "Kış Kupası", image: "https://images.unsplash.com/photo-1544787210-2827448630aa?q=80&w=200", date: "1 gün önce" },
    { id: "d3", title: "Cyber Bandana", image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=200", date: "3 gün önce" },
];

interface StudioQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
}

export function StudioQuickSheet({ isOpen, onClose, petName = "Dostun" }: StudioQuickSheetProps) {
    const router = useRouter();

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
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Studio</h3>
                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mt-2">Kreatif Kontrol Merkezi</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        <div className="px-8 pb-12 space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* 1. CREATIVE PROGRESS (XP Section) */}
                            <section className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/20 rounded-[2.2rem] p-6 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
                                <div className="flex items-center justify-between relative z-10 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                            <Palette className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-purple-400/60 font-black uppercase tracking-widest leading-none mb-1">Tasarımcı Seviyen</p>
                                            <h4 className="text-xl font-black text-white tracking-tight italic uppercase">Master Crafter</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-white">4.8</span>
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 inline-block ml-1 mb-1" />
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "75%" }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    />
                                </div>
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-3 text-right">Sonraki Rozet: Stüdyo Lideri • 250 XP Kaldı</p>
                            </section>

                            {/* 2. RECENT DRAFTS */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-purple-400" /> Son Taslaklar
                                    </h4>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Tümünü Gör</span>
                                </div>

                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-2 px-2">
                                    {RECENT_DRAFTS.map((draft) => (
                                        <div key={draft.id} className="min-w-[160px] bg-white/5 border border-white/10 rounded-[2rem] p-3 flex flex-col group active:scale-[0.98] transition-all">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-white/5">
                                                <img src={draft.image} alt={draft.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ArrowRight className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <h5 className="text-white font-bold text-xs truncate mb-1">{draft.title}</h5>
                                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">{draft.date}</span>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={() => { router.push('/studio'); onClose(); }}
                                        className="min-w-[160px] border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-white/20 hover:text-purple-400 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Yeni Taslak</span>
                                    </button>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { router.push('/studio'); onClose(); }}
                                    className="bg-white/5 border border-white/10 rounded-[2rem] p-5 text-left flex flex-col justify-between h-40 hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h6 className="text-sm font-black text-white uppercase italic leading-none mb-1">Moffi Stüdyo</h6>
                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-tight">AI Tasarım Laboratuvarı</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { alert("Klasik koleksiyon çok yakında yeni arayüzle geri dönecek!"); onClose(); }}
                                    className="bg-white/5 border border-white/10 rounded-[2rem] p-5 text-left flex flex-col justify-between h-40 hover:bg-white/10 opacity-50 cursor-not-allowed group"
                                >
                                    <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-2xl flex items-center justify-center border border-pink-500/20">
                                        <Shirt className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h6 className="text-sm font-black text-white uppercase italic leading-none mb-1">Moffi Klasik</h6>
                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-tight">Hazır Koleksiyon (Yakında)</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => { router.push('/studio'); onClose(); }}
                                className="w-full bg-purple-600 py-6 rounded-[2.2rem] flex items-center justify-center gap-4 group active:scale-[0.98] transition-all shadow-2xl shadow-purple-600/20"
                            >
                                <span className="text-white text-sm font-black uppercase tracking-[0.3em]">Büyük Stüdyoyu Aç</span>
                                <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
