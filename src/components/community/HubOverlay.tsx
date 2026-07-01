'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ShieldAlert, HeartHandshake, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSOSClick?: () => void;
    onMoffinetClick?: () => void;
    onMarketClick?: () => void;
    onWalkClick?: () => void;
    onStudioClick?: () => void;
    onVetClick?: () => void;
    onGameClick?: () => void;
    onSearchClick?: () => void;
    onCommunityRadarClick?: () => void;
    onAIAsistantClick?: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
            type: "spring",
            stiffness: 300,
            damping: 24
        } 
    }
};

export function HubOverlay({
    isOpen,
    onClose
}: HubOverlayProps) {

    const handleCreatePost = () => {
        window.dispatchEvent(new CustomEvent('open-add-post'));
        onClose();
    };

    const handleCreateLostAd = () => {
        window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: 'radar' }));
        window.dispatchEvent(new CustomEvent('open-add-lost-pet'));
        onClose();
    };

    const handleCreateAdoptionAd = () => {
        window.dispatchEvent(new CustomEvent('moffi-change-tab', { detail: 'radar' }));
        window.dispatchEvent(new CustomEvent('open-add-adoption-pet'));
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[7000] flex items-end justify-center pb-12 px-4 pointer-events-none">
                    {/* Premium glass backdrop overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#1c1c1e]/40 backdrop-blur-lg pointer-events-auto"
                    />

                    {/* Compact Premium Apple-style Actions Menu */}
                    <motion.div
                        initial={{ opacity: 0, y: 80, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 80, scale: 0.96 }}
                        transition={{ type: "spring", damping: 26, stiffness: 220 }}
                        className="w-full max-w-sm bg-[var(--card-bg)]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col items-center gap-5 relative z-10 pointer-events-auto overflow-hidden"
                    >
                        {/* Subtle ambient glow behind title */}
                        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                        {/* Title header */}
                        <div className="text-center relative z-10 shrink-0">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">Moffi Paylaşım</span>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">Hızlı İlan Ekle</h3>
                        </div>

                        {/* Actions List with Staggered Animation */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="w-full flex flex-col gap-3 relative z-10"
                        >
                            {/* 1. YENİ GÖNDERİ PAYLAŞ */}
                            <motion.button 
                                variants={itemVariants}
                                whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleCreatePost}
                                className="w-full py-4 px-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-between transition-colors duration-200 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform duration-300">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-white leading-none uppercase tracking-wide">Yeni Gönderi Paylaş</h4>
                                        <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-wider">Topluluk akışında fotoğraf paylaş</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                            </motion.button>

                            {/* 2. KAYIP / SOS İLANI VER */}
                            <motion.button 
                                variants={itemVariants}
                                whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleCreateLostAd}
                                className="w-full py-4 px-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-between transition-colors duration-200 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.15)] group-hover:scale-105 transition-transform duration-300">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-white leading-none uppercase tracking-wide">Kayıp / SOS İlanı Ver</h4>
                                        <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-wider">Kayıp alarmı gönder ve haritada pinle</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                            </motion.button>

                            {/* 3. SAHİPLENDİRME İLANI VER */}
                            <motion.button 
                                variants={itemVariants}
                                whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleCreateAdoptionAd}
                                className="w-full py-4 px-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-between transition-colors duration-200 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.15)] group-hover:scale-105 transition-transform duration-300">
                                        <HeartHandshake className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-white leading-none uppercase tracking-wide">Sahiplendirme İlanı</h4>
                                        <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-wider">Dostlarımıza ömürlük yeni bir yuva bul</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                            </motion.button>
                        </motion.div>

                        {/* Close button with premium hover animation */}
                        <motion.button 
                            whileHover={{ scale: 1.08, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="mt-1 w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.05] flex items-center justify-center text-white transition-colors duration-300 relative z-10"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
