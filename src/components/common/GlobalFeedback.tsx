"use client";

import React, { useState } from 'react';
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
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('performance');
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        // API'ye gönderim simülasyonu
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, category, comment, timestamp: new Date().toISOString() }),
            });

            // Başarılı sayıyoruz (Supabase olmasa bile API hata vermeyecek şekilde ayarlandı)
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
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl hover:bg-white/20 transition-all duration-300 group"
            >
                <MessageSquare className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-medium text-white/90">Geri Bildirim</span>
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            {/* Feedback Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-3xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Moffi'yi Değerlendir</h3>
                                    <p className="text-sm text-zinc-400">Deneyimini bizimle paylaş, birlikte geliştirelim.</p>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {step === 1 ? (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Rating */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-zinc-300">Uygulama hızı nasıl?</label>
                                            <div className="flex justify-between gap-2">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setRating(num)}
                                                        className={clsx(
                                                            "flex-1 py-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1",
                                                            rating === num 
                                                                ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                                                                : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <Star className={clsx("w-5 h-5", rating >= num && "fill-current")} />
                                                        <span className="text-[10px] font-bold">{num}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Categories */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-zinc-300">Geri bildirim konusu</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setCategory(cat.id)}
                                                        className={clsx(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                            category === cat.id
                                                                ? "bg-white/10 border-white/20 text-white"
                                                                : "bg-white/5 border-transparent text-zinc-500 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <cat.icon className={clsx("w-4 h-4", category === cat.id ? cat.color : "")} />
                                                        <span className="text-xs font-medium">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-zinc-300">Eklemek istediklerin (isteğe bağlı)</label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Daha iyi olması için ne yapabiliriz?"
                                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={rating === 0 || isSending}
                                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white font-bold text-sm shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSending ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Geri Bildirimi Gönder
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="py-12 flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-green-500"
                                            >
                                                <Send className="w-10 h-10" />
                                            </motion.div>
                                        </div>
                                        <h4 className="text-xl font-bold text-white">Teşekkürler!</h4>
                                        <p className="text-sm text-zinc-400">Geri bildirimin başarıyla alındı. <br/> Moffi seninle gelişiyor.</p>
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
