"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ShoppingBag, Zap, ArrowRight,
    Star, Wallet, Package, RefreshCw,
    ChevronRight, Heart, Tag, Search, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { usePetShop } from "@/hooks/usePetShop";

interface MarketQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
}

export function MarketQuickSheet({ isOpen, onClose, petName = "Dostun" }: MarketQuickSheetProps) {
    const router = useRouter();
    const { products, addToCart, cart } = usePetShop();

    // Use products from the hook for deals
    const deals = products.slice(0, 3);

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
                        className="fixed bottom-0 inset-x-0 z-[3001] bg-white dark:bg-[#1C1C1E] rounded-t-[3rem] border-t border-zinc-200 dark:border-card-border shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full" />

                        <div className="px-4 sm:px-8 pt-8 sm:pt-10 pb-4 sm:pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">Moffi Petshop</h3>
                                <p className="text-[9px] sm:text-[10px] text-orange-500 dark:text-orange-400 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1.5 sm:mt-2">Hızlı Sipariş Paneli</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center border border-zinc-200 dark:border-card-border hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 dark:text-white/50" />
                            </button>
                        </div>

                        <div className="px-4 sm:px-8 pb-8 sm:pb-12 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* MOFFI COINS BALANCES */}
                            <section className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 dark:from-orange-500/20 dark:to-amber-500/10 border border-orange-500/20 rounded-[2.2rem] p-6 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                                {/* SEARCH & FILTER */}
                                <section className="flex gap-2 sm:gap-3 relative z-10">
                                    <div className="flex-1 bg-white/50 dark:bg-white/5 border border-orange-500/20 dark:border-card-border rounded-xl sm:rounded-2xl flex items-center px-3 sm:px-4 py-3 sm:py-4 focus-within:border-orange-500/50 transition-colors">
                                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 dark:text-white/40 mr-2 sm:mr-3 shrink-0" />
                                        <input 
                                            type="text" 
                                            placeholder={`${petName} için arama yap...`}
                                            className="bg-transparent border-none outline-none text-zinc-900 dark:text-white text-xs sm:text-sm font-bold w-full placeholder:text-zinc-400 dark:placeholder:text-white/30"
                                        />
                                    </div>
                                    <button className="ml-2 w-10 h-10 sm:w-14 sm:h-14 shrink-0 bg-white/50 dark:bg-white/5 border border-orange-500/20 dark:border-card-border rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-orange-500/10 dark:hover:bg-white/10 active:scale-95 transition-all">
                                        <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-white" />
                                    </button>
                                </section>
                            </section>

                            {/* FLASH DEALS SECTION */}
                            <section>
                                <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                                    <h4 className="text-[10px] sm:text-[11px] font-black text-zinc-400 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-current" /> {petName} için Fırsatlar
                                    </h4>
                                    <span className="text-[8px] sm:text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest cursor-pointer hover:text-zinc-600 dark:hover:text-white transition-colors">Yenile</span>
                                </div>

                                <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 -mx-2 px-2">
                                    {deals.map((product) => (
                                        <div key={product.id} className="min-w-[160px] sm:min-w-[200px] bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col group active:scale-[0.98] transition-all">
                                            <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-zinc-200 dark:border-card-border">
                                                <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                {product.tag && (
                                                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-tighter">
                                                        {product.tag}
                                                    </div>
                                                )}
                                                <button className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/40 backdrop-blur-md rounded-md sm:rounded-lg flex items-center justify-center border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                </button>
                                            </div>
                                            <h5 className="text-zinc-900 dark:text-white font-bold text-xs sm:text-sm mb-1 leading-tight line-clamp-2 sm:truncate">{product.name}</h5>
                                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-current" />
                                                    <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-white/60 font-black">{product.rating}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                <div className="flex flex-col">
                                                    {product.oldPrice && <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-white/30 line-through font-bold">{product.oldPrice} TL</span>}
                                                    <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white tracking-tight">{product.price} TL</span>
                                                </div>
                                                <button 
                                                    onClick={() => addToCart(product.id, 1)}
                                                    className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-orange-500/20"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* RECENT / QUICK ORDER */}
                            <section>
                                <h4 className="text-[9px] sm:text-[11px] font-black text-zinc-400 dark:text-white/20 uppercase tracking-[0.2em] mb-3 sm:mb-4 px-1 flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Hızlı Tekrar Sipariş
                                </h4>
                                
                                <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all group cursor-pointer">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 border border-zinc-200 dark:border-transparent">
                                            <img src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=200" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <h6 className="text-zinc-900 dark:text-white font-black text-xs sm:text-sm leading-tight line-clamp-1">Pro Plan Somonlu Yetişkin Köpek Maması 14KG</h6>
                                            <p className="text-[9px] sm:text-[10px] text-orange-500 dark:text-orange-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Son Sipariş: 12 Gün Önce</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => addToCart(3, 1)}
                                        className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-white/10 border border-zinc-200 dark:border-card-border rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white transition-all text-zinc-900 dark:text-white active:scale-90"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </section>

                            {/* CATEGORY QUICK LINKS */}
                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-[1.8rem] p-5 flex flex-col justify-between h-32 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20">
                                        <Tag className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                    </div>
                                    <span className="text-sm font-black text-zinc-900 dark:text-white uppercase italic leading-none">Kuponlarım</span>
                                </button>
                                <button className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-[1.8rem] p-5 flex flex-col justify-between h-32 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 rounded-xl flex items-center justify-center border border-pink-200 dark:border-pink-500/20">
                                        <Heart className="w-5 h-5 transition-transform group-hover:scale-125" />
                                    </div>
                                    <span className="text-sm font-black text-zinc-900 dark:text-white uppercase italic leading-none">Favorilerim</span>
                                </button>
                            </div>

                            {/* FOOTER: VIEW FULL STORE */}
                            <button
                                onClick={() => { router.push('/petshop'); onClose(); }}
                                className="w-full bg-orange-500 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 group hover:bg-orange-600 transition-all shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
                            >
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">Petshop'a Git</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform text-white" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
