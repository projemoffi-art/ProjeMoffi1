"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Star, Zap, Layout, Bug, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';

const categories = [
    { id: 'performance', label: 'Performans', icon: Zap, color: 'text-yellow-400' },
    { id: 'design', label: 'Tasarım', icon: Layout, color: 'text-blue-400' },
    { id: 'bug', label: 'Hata', icon: Bug, color: 'text-red-400' },
    { id: 'idea', label: 'Öneri', icon: Lightbulb, color: 'text-green-400' },
];

export default function GlobalFeedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); 
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('performance');
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showNudge, setShowNudge] = useState(false);

    // Show a sweet nudge after 90 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setShowNudge(true);
        }, 90000);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, category, comment, timestamp: new Date().toISOString() }),
            });

            setStep(2);
            setTimeout(() => {
                setIsOpen(false);
                setTimeout(() => {
                    setStep(1);
                    setRating(0);
                    setComment('');
                }, 500);
            }, 3000);
        } catch (error) {
            console.error("Feedback failed:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* TRULY FLOATING Pill Button (Top-Right, Below Header) */}
            <div className="fixed top-24 right-4 z-[100] flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {showNudge && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className="pointer-events-auto mb-3 w-56 p-4 bg-white/95 backdrop-blur-2xl text-black rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-[12px] font-bold leading-tight border border-white"
                        >
                            <p className="pr-4">Moffi Demo deneyimin nasıl gidiyor? Geri bildirim bırakmak ister misin? 😊</p>
                            <div className="absolute top-1/2 -right-1 w-3 h-3 bg-white rotate-45 -translate-y-1/2" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowNudge(false); }}
                                className="absolute top-3 right-3 p-1 hover:bg-black/5 rounded-full transition-colors"
                            >
                                <X size={12} className="text-zinc-400" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ x: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setIsOpen(true); setShowNudge(false); }}
                    className="pointer-events-auto flex items-center gap-3 pl-4 pr-5 py-3 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:bg-black/60 hover:border-white/20 transition-all duration-500 group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <MessageSquare className="w-4 h-4 text-white group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Moffi Demo</span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-tight">Geri Bildirim</span>
                    </div>
                </motion.button>
            </div>

            {/* Feedback Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-white/5 to-transparent">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter">Moffi Demo</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Deneyimini bizimle paylaş, birlikte uçalım.</p>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-3 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8">
                                {step === 1 ? (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        {/* Rating */}
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Uygulama hızı nasıl?</label>
                                            <div className="flex justify-between gap-3">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setRating(num)}
                                                        className={clsx(
                                                            "flex-1 py-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-1",
                                                            rating === num 
                                                                ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] scale-110" 
                                                                : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <Star className={clsx("w-5 h-5", rating >= num && "fill-current")} />
                                                        <span className="text-[10px] font-bold mt-1">{num}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Categories */}
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Konu nedir?</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setCategory(cat.id)}
                                                        className={clsx(
                                                            "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                                                            category === cat.id
                                                                ? "bg-white/10 border-white/20 text-white ring-1 ring-white/10"
                                                                : "bg-white/5 border-transparent text-zinc-500 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <cat.icon className={clsx("w-4 h-4", category === cat.id ? cat.color : "")} />
                                                        <span className="text-[11px] font-bold uppercase tracking-tight">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Detaylar (Opsiyonel)</label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Neyi daha iyi yapabiliriz?"
                                                className="w-full h-32 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none shadow-inner"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={rating === 0 || isSending}
                                            className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black text-sm shadow-2xl hover:bg-zinc-200 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {isSending ? (
                                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    GÖNDER
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="py-16 flex flex-col items-center text-center space-y-6">
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                            className="w-24 h-24 bg-green-500/20 rounded-[2rem] flex items-center justify-center border border-green-500/30"
                                        >
                                            <Send className="w-12 h-12 text-green-500" />
                                        </motion.div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Harika!</h4>
                                            <p className="text-sm text-zinc-400">Geri bildirimin sisteme düştü. <br/> Moffi Demo seninle güçleniyor.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
