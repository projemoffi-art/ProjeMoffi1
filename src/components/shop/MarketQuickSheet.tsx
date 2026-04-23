"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ShoppingBag, Zap, ArrowRight,
    Star, Wallet, Package, RefreshCw,
    ChevronRight, Heart, Tag
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
                        className="fixed bottom-0 inset-x-0 z-[3001] bg-[#0A0A0A] rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                        <div className="px-8 pt-10 pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Market</h3>
                                <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.3em] mt-2">Premium PetShop Deneyimi</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        <div className="px-8 pb-12 space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* MOFFI COINS BALANCES */}
                            <section className="bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/20 rounded-[2.2rem] p-6 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                                            <Wallet className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-orange-400/60 font-black uppercase tracking-widest leading-none mb-1">Bakiyen</p>
                                            <h4 className="text-2xl font-black text-white tracking-tight">1,250 <span className="text-xs text-white/40 uppercase font-black">PC</span></h4>
                                        </div>
                                    </div>
                                    <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all active:scale-95 border border-white/10">
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </section>

                            {/* FLASH DEALS SECTION */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current" /> {petName} için Fırsatlar
                                    </h4>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Yenile</span>
                                </div>

                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-2 px-2">
                                    {deals.map((product) => (
                                        <div key={product.id} className="min-w-[200px] bg-white/5 border border-white/10 rounded-[2rem] p-4 flex flex-col group active:scale-[0.98] transition-all">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 border border-white/5">
                                                <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                {product.tag && (
                                                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
                                                        {product.tag}
                                                    </div>
                                                )}
                                                <button className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Heart className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <h5 className="text-white font-bold text-sm mb-1 truncate">{product.name}</h5>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                    <span className="text-[10px] text-white/60 font-black">{product.rating}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                <div className="flex flex-col">
                                                    {product.oldPrice && <span className="text-[10px] text-white/30 line-through font-bold">{product.oldPrice} TL</span>}
                                                    <span className="text-sm font-black text-white tracking-tight">{product.price} TL</span>
                                                </div>
                                                <button 
                                                    onClick={() => addToCart(product.id, 1)}
                                                    className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-orange-500/20"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* RECENT / QUICK ORDER */}
                            <section>
                                <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5" /> Hızlı Tekrar Sipariş
                                </h4>
                                
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center justify-between hover:bg-white/[0.08] transition-all group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center p-2">
                                            <img src="https://images.unsplash.com/photo-1548676632-4467d1656e6d?q=80&w=150" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <h6 className="text-white font-black text-base italic uppercase tracking-tighter leading-none">Nature's Best Kuzu Etli</h6>
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                <Package className="w-3 h-3" /> Son Alınan: 12 Mart
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:scale-105 transition-transform">
                                        Tekrarla
                                    </div>
                                </div>
                            </section>

                            {/* CATEGORY QUICK LINKS */}
                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-white/5 border border-white/10 rounded-[1.8rem] p-5 flex flex-col justify-between h-32 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20">
                                        <Tag className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase italic leading-none">Kuponlarım</span>
                                </button>
                                <button className="bg-white/5 border border-white/10 rounded-[1.8rem] p-5 flex flex-col justify-between h-32 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center border border-pink-500/20">
                                        <Heart className="w-5 h-5 transition-transform group-hover:scale-125" />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase italic leading-none">Favorilerim</span>
                                </button>
                            </div>

                            {/* FOOTER: VIEW FULL STORE */}
                            <button
                                onClick={() => { router.push('/petshop'); onClose(); }}
                                className="w-full bg-orange-500 py-6 rounded-[2.2rem] flex items-center justify-center gap-4 group active:scale-[0.98] transition-all shadow-2xl shadow-orange-500/20"
                            >
                                <span className="text-black text-sm font-black uppercase tracking-[0.3em]">Tüm Mağazayı Keşfet</span>
                                <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
