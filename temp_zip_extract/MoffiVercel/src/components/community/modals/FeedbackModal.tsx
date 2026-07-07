"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Heart, Zap, Bug, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [step, setStep] = useState(1);
    const [comment, setComment] = useState('');
    const [category, setCategory] = useState<'idea' | 'bug' | 'love'>('idea');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
        setTimeout(() => {
            onClose();
            setTimeout(() => {
                setStep(1);
                setComment('');
            }, 500);
        }, 3000);
    };

    const categories = [
        { id: 'idea', label: 'Öneri', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { id: 'love', label: 'Sevgi', icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
        { id: 'bug', label: 'Hata', icon: Bug, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-glass backdrop-blur-3xl border border-glass-border rounded-[3rem] p-8 shadow-3xl overflow-hidden"
                    >
                        {step === 1 ? (
                            <>
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                                            <MessageSquare className="text-white w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tighter uppercase italic leading-none">Moffi Lab</h3>
                                            <p className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-1">Fikrini Fısılda</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full text-secondary transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2 mb-8">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id as any)}
                                            className={cn(
                                                "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                                category === cat.id 
                                                    ? "bg-foreground/5 border-accent" 
                                                    : "bg-transparent border-glass-border grayscale opacity-50"
                                            )}
                                        >
                                            <cat.icon className={cn("w-5 h-5", cat.color)} />
                                            <span className="text-[10px] font-black text-foreground uppercase">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Ekosistemi nasıl geliştirelim?"
                                        className="w-full h-32 bg-foreground/5 border border-glass-border rounded-[1.5rem] p-4 text-sm text-foreground placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none shadow-inner"
                                        required
                                    />

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-foreground text-background rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send size={14} />
                                        GÖNDER
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center text-center space-y-6">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                    className="w-20 h-20 bg-accent/20 rounded-[2rem] flex items-center justify-center border border-accent/20"
                                >
                                    <Sparkles className="w-10 h-10 text-accent" />
                                </motion.div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-foreground tracking-tighter uppercase">Harika!</h4>
                                    <p className="text-xs text-secondary leading-relaxed px-4">Fikrin Moffi Lab’e ulaştı. Ekosistemi birlikte büyütüyoruz. ✨</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
