'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShare } from '@/context/ShareContext';
import { X, Copy, CheckCircle2, MessageCircle, Twitter, Facebook, Link2 } from 'lucide-react';

export function GlobalShareSheet() {
    const { isShareOpen, closeShare, shareData } = useShare();
    const [copied, setCopied] = useState(false);

    if (!isShareOpen || !shareData) return null;

    const shareUrl = shareData.url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                closeShare();
            }, 2000);
        } catch (err) {
            console.error('Kopyalama başarısız:', err);
        }
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(`${shareData.title ? shareData.title + ' - ' : ''}${shareData.text ? shareData.text + ' ' : ''}${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        closeShare();
    };

    const handleTwitter = () => {
        const text = encodeURIComponent(shareData.title || 'Bunu incele!');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        closeShare();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    onClick={closeShare}
                />

                <motion.div
                    initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full sm:max-w-md bg-[var(--background)] rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden pointer-events-auto relative"
                >
                    <div className="flex justify-center p-3 shrink-0 sm:hidden">
                        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full" />
                    </div>

                    <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                        <h3 className="font-bold text-lg text-[var(--foreground)]">Paylaş</h3>
                        <button 
                            onClick={closeShare}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[var(--foreground)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Selected info */}
                        {(shareData.title || shareData.text) && (
                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col gap-1">
                                {shareData.title && <span className="font-bold text-sm text-[var(--foreground)]">{shareData.title}</span>}
                                {shareData.text && <span className="text-xs text-[var(--secondary-text)] line-clamp-2">{shareData.text}</span>}
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-4">
                            <button 
                                onClick={handleWhatsApp}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-[var(--secondary-text)]">WhatsApp</span>
                            </button>
                            
                            <button 
                                onClick={handleTwitter}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Twitter className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-[var(--secondary-text)]">X (Twitter)</span>
                            </button>

                            <button 
                                onClick={handleCopy}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                    copied 
                                        ? 'bg-emerald-500 text-white scale-110' 
                                        : 'bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110'
                                }`}>
                                    {copied ? <CheckCircle2 className="w-6 h-6" /> : <Link2 className="w-6 h-6" />}
                                </div>
                                <span className="text-xs font-medium text-[var(--secondary-text)]">
                                    {copied ? 'Kopyalandı' : 'Kopyala'}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
