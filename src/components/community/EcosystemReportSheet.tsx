"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Activity, PieChart, TrendingUp, 
    ShieldCheck, Heart, Zap, Award, 
    ChevronRight, ArrowUpRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface EcosystemReportSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onViewPassport?: () => void;
    pet: any;
    isSmartShopEnabled: boolean;
}

export function EcosystemReportSheet({ 
    isOpen, 
    onClose, 
    onViewPassport,
    pet, 
    isSmartShopEnabled 
}: EcosystemReportSheetProps) {
    const router = useRouter();
    
    // MOCK DATA BASED ON PET NAME
    const isMilo = pet?.name === "Milo";
    
    const stats = isMilo ? {
        wellness: 74,
        activity: 65,
        nutrition: 82,
        sleep: 88,
        mood: 75,
        breedRank: "Top %15",
        streak: 5,
        points: 2450
    } : {
        wellness: 92,
        activity: 95,
        nutrition: 90,
        sleep: 85,
        mood: 98,
        breedRank: "Top %5",
        streak: 22,
        points: 5800
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
                        className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md"
                    />

                    {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 inset-x-0 z-[3001] bg-background rounded-t-[3.5rem] border-t border-card-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                        >
                        {/* THEME DECORATION (Gradient glow) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[80px] pointer-events-none" />

                        {/* iOS Style Grab Handle */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white/10 rounded-full" />

                        {/* HEADER */}
                        <div className="px-8 pt-12 pb-6 flex items-center justify-between border-b border-card-border bg-foreground/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-cyan-500/20 p-0.5">
                                    <img src={pet?.avatar || pet?.cover_photo} className="w-full h-full rounded-[0.9rem] object-cover" alt={pet?.name} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground italic tracking-tighter leading-none flex items-center gap-2">
                                        {pet?.name} <span className="text-[10px] bg-accent text-background px-2 py-0.5 rounded-full not-italic tracking-widest font-black uppercase">PRO</span>
                                    </h3>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] mt-2 italic">Ekosistem Sağlık Raporu</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center border border-card-border hover:bg-foreground/10 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6 text-secondary" />
                            </button>
                        </div>

                        {/* SCROLLABLE CONTENT */}
                        <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar space-y-10 pb-20">
                            
                            {/* SECTION 1: OVERVIEW METRIC */}
                            <section>
                                <div className="bg-gradient-to-br from-foreground/[0.05] to-transparent border border-card-border rounded-[2.5rem] p-8 flex items-center justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl group-hover:bg-accent/10 transition-all duration-700" />
                                    
                                    <div>
                                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-1">Moffi Zindelik Skoru</p>
                                        <h4 className="text-6xl font-black text-foreground italic tracking-tighter leading-none">%{stats.wellness}</h4>
                                        <div className="flex items-center gap-2 mt-4 text-cyan-400">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">Çok Formda ✨</span>
                                        </div>
                                    </div>

                                    <div className="w-24 h-24 rounded-full border-8 border-white/5 p-1 relative">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                            <motion.circle 
                                                initial={{ strokeDashoffset: 282.7 }}
                                                animate={{ strokeDashoffset: 282.7 * (1 - (stats.wellness / 100)) }}
                                                cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="282.7" className="text-cyan-500" strokeLinecap="round" 
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: WELLNESS BREAKDOWN */}
                            <section>
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-2">
                                        <PieChart className="w-3.5 h-3.5" /> Metrik Analizi
                                    </h4>
                                    <Info className="w-4 h-4 text-white/20" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Aktivite", val: stats.activity, icon: Activity, color: "text-orange-400 bg-orange-400/10" },
                                        { label: "Beslenme", val: stats.nutrition, icon: Zap, color: "text-green-400 bg-green-400/10" },
                                        { label: "Uyku", val: stats.sleep, icon: Heart, color: "text-blue-400 bg-blue-400/10" },
                                        { label: "Ruh Hali", val: stats.mood, icon: Sparkles, color: "text-purple-400 bg-purple-400/10" }
                                    ].map((m, i) => (
                                        <div key={i} className="bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.color)}>
                                                    <m.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-black text-white italic">%{m.val}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">{m.label}</p>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${m.val}%` }}
                                                        className={cn("h-full", m.color.split(' ')[0].replace('text', 'bg'))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* SECTION 3: COMMUNITY STANDING */}
                            <section>
                                <div className="bg-card border border-card-border rounded-[2.5rem] p-6 relative group overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20">
                                            <Award className="w-7 h-7 text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-black text-foreground text-lg italic tracking-tight">Topluluk Sıralaması</h5>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">
                                                {pet?.name}, {pet?.breed} sahipleri arasında <span className="text-accent">{stats.breedRank}'lık</span> dilimde!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 h-3 w-full bg-white/5 rounded-full border border-white/5 p-0.5 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: isMilo ? "85%" : "95%" }}
                                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4: AI AUDIT */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5" /> AI Sağlık Denetimi
                                    </h4>
                                </div>
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] p-6 space-y-4">
                                    <p className="text-gray-300 text-sm leading-relaxed italic">
                                        "Moffi AI analizine göre {pet?.name} bu hafta olağanüstü bir performans sergiledi. Aktivite düzeyi normalden %12 daha yüksek ve uyku dengesi oldukça stabil. {isMilo ? "Aktivite sonrası su tüketimini artırman" : "Mükemmel kondisyonunu koruması için"} tavsiye edilir."
                                    </p>
                                    <div 
                                        onClick={() => router.push('/petshop')}
                                        className="flex items-center gap-4 pt-2 border-t border-purple-500/10 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{pet?.name || "Pati"} İÇİN TAVSİYE</span>
                                            <span className="text-xs font-bold text-white uppercase italic tracking-tighter">{pet?.breed === "Golden Retriever" ? "Premium Eklem Destekli Mama" : "Hassas Sindirim Destekli Mama"} 🍖</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-purple-400 ml-auto" />
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 5: UPCOMING */}
                            <section>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/20">
                                            <ShieldCheck className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h6 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Hatırlatıcı</h6>
                                            <p className="text-sm font-bold text-white uppercase italic">{isMilo ? "Karma Aşı (12 Gün)" : "Tüy Bakımı (2 Gün)"}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onViewPassport?.()}
                                        className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                                    >
                                        Pasaport →
                                    </button>
                                </div>
                            </section>

                            {/* FOOTER ACTIONS */}
                            <section className="flex gap-4">
                                <button 
                                    onClick={() => alert("Rapor paylaşım linki kopyalandı! 🔗")}
                                    className="flex-1 h-16 bg-foreground/[0.05] border border-card-border rounded-[1.8rem] flex items-center justify-center gap-2 group hover:bg-foreground hover:text-background transition-all"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-widest">Paylaş</span>
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => router.push('/petshop')}
                                    className="flex-[1.5] h-16 bg-cyan-500 text-black rounded-[1.8rem] flex items-center justify-center gap-2 shadow-2xl shadow-cyan-500/20 active:scale-95 transition-all"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-widest">Detayları İncele</span>
                                </button>
                            </section>

                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
