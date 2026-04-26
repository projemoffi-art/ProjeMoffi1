'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Coins, ArrowUpRight, ArrowDownLeft, Zap, Gift, 
    ShoppingBag, ChevronRight, Info, CreditCard, 
    ShieldCheck, Star, Award, Search, Plus, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WALLET_TRANSACTIONS } from '@/lib/mockData';

export function WalletTab() {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const balance = 1250;
    const transactions = WALLET_TRANSACTIONS;

    const cards = [
        { 
            id: 'main', 
            title: "Moffi PawCoin", 
            sub: "Dijital Varlık Cüzdanı", 
            color: "from-orange-400 via-orange-500 to-amber-700", 
            icon: <Coins className="w-8 h-8 text-white" />,
            value: `${balance.toLocaleString()} PC` 
        },
        { 
            id: 'pro', 
            title: "Moffi+ Pro", 
            sub: "Elite Membership", 
            color: "from-zinc-700 via-zinc-900 to-black", 
            icon: <Star className="w-8 h-8 text-orange-400" />,
            value: "PREMIUM" 
        },
        { 
            id: 'health', 
            title: "Sağlık Patisi", 
            sub: "Premium Sadakat Kartı", 
            color: "from-emerald-500 via-emerald-600 to-teal-900", 
            icon: <ShieldCheck className="w-8 h-8 text-white/80" />,
            value: "SILVER" 
        }
    ];

    return (
        <div className="space-y-12 pb-24 relative">
            
            {/* 1. ADVANCED APPLE WALLET STACK */}
            <div className="relative h-[420px] sm:h-[480px] mt-4 px-1 sm:px-2 perspective-[1500px]">
                <div className="relative h-full w-full">
                    {cards.map((card, index) => {
                        const isExpanded = expandedCard === card.id;
                        const isAnyExpanded = expandedCard !== null;
                        
                        // Calculate position based on state
                        let y = index * 45; // Tighter stack for mobile
                        let opacity = 1;
                        let scale = 1 - (index * 0.03);
                        let zIndex = 10 - index;
                        let rotateX = -10; // Base 3D tilt

                        if (isExpanded) {
                            y = 0;
                            scale = 1.02;
                            zIndex = 100;
                            rotateX = 0;
                        } else if (isAnyExpanded) {
                            y = 360 + (index * 15); // Push down more compactly
                            opacity = 0.4;
                            scale = 0.9;
                            rotateX = -15;
                        }

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                initial={{ y: 200, opacity: 0, rotateX: -30 }}
                                animate={{ 
                                    y, 
                                    opacity, 
                                    zIndex,
                                    scale,
                                    rotateX,
                                    transition: {
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 20
                                    }
                                }}
                                whileHover={{ 
                                    y: isExpanded ? 0 : (index * 45) - 10,
                                    transition: { duration: 0.2 } 
                                }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "absolute inset-x-0 h-56 sm:h-64 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border-t border-white/20 bg-gradient-to-br",
                                    card.color
                                )}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {/* Holographic/Metallic Shimmer Layer */}
                                <motion.div 
                                    animate={{ 
                                        background: [
                                            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                                            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0) 20%, rgba(255,255,255,0.1) 90%, transparent 100%)"
                                        ]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                                    className="absolute inset-0 pointer-events-none" 
                                />

                                {/* Glass Reflection */}
                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent rotate-12 pointer-events-none" />

                                <div className="flex flex-col h-full justify-between relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                                <p className="text-[9px] sm:text-[10px] font-black text-white/50 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{card.sub}</p>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">{card.title}</h3>
                                        </div>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-3xl rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center border border-white/20 shadow-2xl relative group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-white/5 rounded-2xl sm:rounded-[1.8rem] animate-pulse" />
                                            {React.cloneElement(card.icon as React.ReactElement, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center gap-1">
                                                 {[1,2,3,4].map(i => (
                                                     <div key={i} className="w-1 h-3 sm:w-1.5 sm:h-4 bg-white/20 rounded-full" />
                                                 ))}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-5 sm:w-10 sm:h-7 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded-md opacity-40 shadow-inner" />
                                                <p className="text-[9px] sm:text-[11px] font-black text-white/40 font-mono tracking-[0.2em] sm:tracking-[0.35em]">**** 2024</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{card.value}</p>
                                            <p className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Sizin Dünyanız</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* NFC Indicator */}
                                <div className="absolute top-1/2 right-10 translate-y-[-50%] flex flex-col gap-1 opacity-20">
                                     <div className="w-6 h-0.5 bg-white rounded-full rotate-[15deg]" />
                                     <div className="w-4 h-0.5 bg-white rounded-full rotate-[15deg]" />
                                     <div className="w-2 h-0.5 bg-white rounded-full rotate-[15deg]" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* 2. QUICK ACTIONS BAR */}
            <AnimatePresence>
                {!expandedCard && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex gap-4 px-2"
                    >
                        <button className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] py-8 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform shadow-lg border border-orange-500/20">
                                <Plus className="w-7 h-7" />
                            </div>
                            <span className="text-[11px] font-black text-white uppercase tracking-widest italic text-center">Yükleme Yap</span>
                        </button>
                        <button className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] py-8 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-lg border border-cyan-500/20">
                                <ArrowUpRight className="w-7 h-7" />
                            </div>
                            <span className="text-[11px] font-black text-white uppercase tracking-widest italic text-center">Transfer Et</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. TRANSACTION HISTORY */}
            <div className={cn("space-y-8 transition-all duration-500", expandedCard ? "opacity-20 blur-sm pointer-events-none scale-95" : "opacity-100")}>
                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-orange-500 rounded-full" />
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Son İşlemler</h3>
                    </div>
                    <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Nisan 2024</span>
                    </div>
                </div>

                <div className="space-y-4 px-1 sm:px-2">
                    {transactions.map(tx => (
                        <div key={tx.id} className="bg-white/[0.02] border border-white/5 p-4 sm:p-7 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-2xl border border-white/5">
                                    <div className="text-white/80 scale-75 sm:scale-100">{tx.icon}</div>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-black text-sm sm:text-base uppercase tracking-tight italic">{tx.label}</h4>
                                    <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                        <div className="w-1 h-1 rounded-full bg-orange-500" />
                                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{tx.date}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <p className={cn(
                                        "text-xl sm:text-2xl font-black italic tracking-tighter",
                                        tx.amount > 0 ? "text-emerald-400" : "text-white"
                                    )}>
                                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                                    </p>
                                    <span className="text-[9px] sm:text-[10px] font-black text-white/30 tracking-tighter uppercase">PC</span>
                                </div>
                                <p className="text-[8px] sm:text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mt-1">Tamamlandı</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* EARN INFO */}
            <div className={cn("px-1 sm:px-2 transition-all duration-500", expandedCard ? "opacity-0" : "opacity-100")}>
                <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col items-center text-center gap-4 sm:gap-6 relative overflow-hidden group">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-orange-500/10 blur-[80px] rounded-full" 
                    />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-white font-black text-xl sm:text-2xl uppercase italic tracking-tighter">İyilik İçin Harca</h4>
                        <p className="text-[10px] sm:text-[11px] text-orange-400/70 font-bold uppercase tracking-widest mt-2 sm:mt-4 leading-relaxed max-w-[280px] mx-auto">
                            Moffi'de kazandığın her PawCoin ile barınaklara yardım edebilir veya petin için premium ürünler alabilirsin.
                        </p>
                    </div>
                    <button className="relative z-10 mt-2 px-6 py-3 sm:px-8 sm:py-4 bg-orange-500 rounded-full text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-500/40">
                        Hemen Keşfet
                    </button>
                </div>
            </div>
        </div>
    );
}

