"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    ArrowRight,
    ShieldCheck,
    Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { useShop } from "@/context/ShopContext";

export default function CartPage() {
    const router = useRouter();
    const { cart: cartItems, updateQuantity, removeFromCart, cartTotal } = useShop();

    // --- CALCS ---
    const subtotal = cartTotal;
    const shipping = subtotal > 750 ? 0 : 59;
    const total = subtotal + shipping;

    return (
        <main className="min-h-screen dark: font-sans pb-32">

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-card-border dark:border-card-border px-6 h-16 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-foreground dark:text-white" />
                </button>
                <span className="text-sm font-bold text-foreground dark:text-white uppercase tracking-widest">
                    Sepetim ({cartItems.length})
                </span>
                <div className="w-8" />
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* ITEMS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence>
                        {cartItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="bg-card dark:bg-[#1A1A1A] p-4 rounded-[2rem] shadow-moffi-card border border-card-border dark:border-card-border flex gap-4 overflow-hidden relative group"
                            >
                                {/* Image */}
                                <div className="w-28 h-32 bg-gray-50 dark:bg-black rounded-2xl overflow-hidden flex-shrink-0 relative">
                                    <img src={item.image} className="w-full h-full object-cover" />
                                    {item.customized && (
                                        <div className="absolute top-2 left-2 bg-[#5B4D9D] px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-lg">
                                            Özel Tasarım
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 py-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-foreground dark:text-white mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{item.variant}</p>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        {/* Stepper */}
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-7 h-7 bg-card dark:bg-black rounded-lg flex items-center justify-center shadow-moffi-card text-gray-600 dark:text-gray-400 hover:scale-105 active:scale-95 transition"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-7 h-7 bg-card dark:bg-black rounded-lg flex items-center justify-center shadow-moffi-card text-gray-600 dark:text-gray-400 hover:scale-105 active:scale-95 transition"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-lg font-black text-[#5B4D9D]">
                                                {item.price * item.quantity}₺
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Action (Hover/Mobile safe) */}
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {cartItems.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="font-bold">Sepetin Bomboş</p>
                            <p className="text-sm mt-2">Hadi harika bir şeyler tasarlayalım.</p>
                            <button
                                onClick={() => router.push('/studio')}
                                className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm"
                            >
                                Stüdyoya Dön
                            </button>
                        </div>
                    )}
                </div>

                {/* SUMMARY CARD */}
                <div className="lg:col-span-1">
                    <div className="bg-card dark:bg-[#1A1A1A] p-6 rounded-[2rem] shadow-xl border border-card-border dark:border-card-border sticky top-24">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-6">Sipariş Özeti</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Ara Toplam</span>
                                <span>{subtotal}₺</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-gray-500">
                                <span>Kargo</span>
                                {shipping === 0 ? (
                                    <span className="text-green-500 font-bold">Bedava</span>
                                ) : (
                                    <span>{shipping}₺</span>
                                )}
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-white/10 my-4" />
                            <div className="flex justify-between text-xl font-black text-foreground dark:text-white">
                                <span>Toplam</span>
                                <span>{total}₺</span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={() => router.push('/checkout')}
                            disabled={cartItems.length === 0}
                            className="w-full py-4 bg-[#5B4D9D] disabled:bg-gray-300 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all mb-4"
                        >
                            Ödemeye Geç <ArrowRight className="w-5 h-5" />
                        </button>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Güvenli Ödeme</span>
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Hızlı Kargo</span>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
