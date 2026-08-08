'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Coins, ArrowUpRight, ArrowDownLeft, Zap, Gift, 
    ShoppingBag, ChevronRight, Info, CreditCard, 
    ShieldCheck, Star, Award, Search, Plus, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';
import { WalletTransaction } from '@/services/types';

export function WalletTab() {
    const { user } = useAuth();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const balance = user?.moffi_coins || 0;

    React.useEffect(() => {
        const fetchTxs = async () => {
            if (!user?.id) return;
            try {
                setIsLoading(true);
                const txs = await apiService.getWalletTransactions(user.id);
                setTransactions(txs);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTxs();
    }, [user?.id]);

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
            icon: <ShieldCheck className="w-8 h-8 text-black/80 dark:text-white/80" />,
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
                                    "absolute inset-x-0 h-56 sm:h-64 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border-t border-card-border bg-gradient-to-br",
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
                                                <p className="text-[9px] sm:text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{card.sub}</p>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">{card.title}</h3>
                                        </div>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/10 dark:bg-white/10 backdrop-blur-3xl rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center border border-card-border shadow-2xl relative group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-2xl sm:rounded-[1.8rem] animate-pulse" />
                                            {React.cloneElement(card.icon as React.ReactElement, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center gap-1">
                                                 {[1,2,3,4].map(i => (
                                                     <div key={i} className="w-1 h-3 sm:w-1.5 sm:h-4 bg-black/20 dark:bg-white/20 rounded-full" />
                                                 ))}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-5 sm:w-10 sm:h-7 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded-md opacity-40 shadow-inner" />
                                                <p className="text-[9px] sm:text-[11px] font-black text-black/50 dark:text-white/40 font-mono tracking-[0.2em] sm:tracking-[0.35em]">**** 2024</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{card.value}</p>
                                            <p className="text-[7px] sm:text-[8px] font-black text-black/40 dark:text-white/30 uppercase tracking-[0.3em] mt-1">Sizin Dünyanız</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* NFC Indicator */}
                                <div className="absolute top-1/2 right-10 translate-y-[-50%] flex flex-col gap-1 opacity-20">
                                     <div className="w-6 h-0.5 bg-card rounded-full rotate-[15deg]" />
                                     <div className="w-4 h-0.5 bg-card rounded-full rotate-[15deg]" />
                                     <div className="w-2 h-0.5 bg-card rounded-full rotate-[15deg]" />
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
                        <button className="flex-1 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-card-border rounded-[2.5rem] py-8 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden hover:bg-zinc-100 dark:hover:bg-white/[0.05]">
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 dark:from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform shadow-lg border border-orange-200 dark:border-orange-500/20">
                                <Plus className="w-7 h-7" />
                            </div>
                            <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest italic text-center">Yükleme Yap</span>
                        </button>
                        <button className="flex-1 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-card-border rounded-[2.5rem] py-8 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden hover:bg-zinc-100 dark:hover:bg-white/[0.05]">
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 dark:from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform shadow-lg border border-cyan-200 dark:border-cyan-500/20">
                                <ArrowUpRight className="w-7 h-7" />
                            </div>
                            <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest italic text-center">Transfer Et</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. TRANSACTION HISTORY */}
            <div className={cn("space-y-8 transition-all duration-500", expandedCard ? "opacity-20 blur-sm pointer-events-none scale-95" : "opacity-100")}>
                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-orange-500 rounded-full" />
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white italic tracking-tighter uppercase">Son İşlemler</h3>
                    </div>
                </div>

                <div className="space-y-4 px-1 sm:px-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-white/[0.02] rounded-[3rem] border border-zinc-200 dark:border-card-border">
                            <Coins className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Henüz İşlem Yok</h3>
                            <p className="text-sm text-zinc-500 dark:text-gray-400">Cüzdan hareketleriniz burada görünecektir.</p>
                        </div>
                    ) : (
                        transactions.map((tx: WalletTransaction, index) => {
                            const isPositive = tx.type === 'earned' || tx.type === 'system' || tx.type === 'gift';
                            let Icon = Zap;
                            if (tx.type === 'earned') Icon = ArrowUpRight;
                            else if (tx.type === 'spent') Icon = ShoppingBag;
                            else if (tx.type === 'gift') Icon = Gift;
                            else if (tx.type === 'system') Icon = Coins;

                            return (
                                <div key={tx.id || index} className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border p-4 sm:p-7 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-black/5 transition-all cursor-pointer relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-md dark:shadow-2xl border border-zinc-200 dark:border-card-border">
                                            <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8", isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-700 dark:text-white")} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-zinc-900 dark:text-white font-black text-sm sm:text-base uppercase tracking-tight italic">{tx.description}</h4>
                                            <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                                <span className="text-[10px] sm:text-xs font-black text-zinc-500 dark:text-gray-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <div className="flex flex-col items-end gap-1 sm:gap-1.5">
                                            <span className={cn(
                                                "text-lg sm:text-2xl font-black italic tracking-tighter drop-shadow-sm dark:drop-shadow-lg flex items-center gap-1",
                                                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"
                                            )}>
                                                {isPositive ? '+' : '-'}{tx.amount.toLocaleString()}
                                                <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                            </span>
                                            <span className="text-[8px] sm:text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest">{tx.type}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
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

