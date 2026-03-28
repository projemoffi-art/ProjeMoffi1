'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Camera, MessageCircle, Heart, Search, 
    ShieldAlert, Sparkles, Map, User, Globe, ShoppingBag, Palette, Stethoscope, PawPrint, Gamepad2, ChevronRight, Radar
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface HubOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSOSClick: () => void;
    onMoffinetClick: () => void;
    onMarketClick: () => void;
    onWalkClick: () => void;
    onStudioClick: () => void;
    onVetClick: () => void;
    onGameClick: () => void;
    onSearchClick: () => void;
    onCommunityRadarClick: () => void;
}

export function HubOverlay({
    isOpen,
    onClose,
    onSOSClick,
    onMoffinetClick,
    onMarketClick,
    onWalkClick,
    onStudioClick,
    onVetClick,
    onGameClick,
    onSearchClick,
    onCommunityRadarClick
}: HubOverlayProps) {
    const mainActions = [
        { id: 'radar', label: 'Topluluk Radarı', sub: 'Kayıp / Sahiplen', icon: Radar, color: 'bg-gradient-to-br from-cyan-500 to-blue-600', onClick: onCommunityRadarClick },
    ];

    const services = [
        { icon: PawPrint, label: 'Yürüyüş', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', onClick: onWalkClick },
        { icon: Palette, label: 'Stüdyo', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', onClick: onStudioClick },
        { icon: Stethoscope, label: 'Veteriner', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', onClick: onVetClick },
        { icon: Gamepad2, label: 'Oyun', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', onClick: onGameClick },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[2000] backdrop-blur-3xl overflow-y-auto no-scrollbar flex flex-col pt-safe px-6 pb-20"
                    style={{ background: 'var(--background)' }}
                >
                    <div className="flex justify-between items-center py-8">
                        <div>
                            <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tighter">Moffi Hub</h2>

                        </div>
                        <button 
                            onClick={onClose}
                            className="w-14 h-14 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--foreground)] active:scale-95 transition-all"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="mt-10 space-y-4">
                        {/* HERO SOS BANNER */}
                        <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            onClick={() => { onSOSClick(); onClose(); }}
                            className="w-full relative overflow-hidden group active:scale-[0.98] transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-900 opacity-90 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            
                            <div className="relative p-6 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl relative overflow-hidden">
                                        <ShieldAlert className="w-8 h-8 text-white relative z-10" />
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                            <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.3em]">Moffi Güvencesi</p>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">ACİL DURUM KONTROLÜ</h3>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </motion.button>

                        {mainActions.map((action) => (
                            <motion.button
                                key={action.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => { action.onClick(); onClose(); }}
                                className="w-full h-44 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-6 flex flex-col justify-between items-start group relative overflow-hidden active:scale-95 transition-all shadow-xl shadow-black/20"
                            >
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl z-10", action.color)}>
                                    <action.icon className="w-6 h-6" />
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] text-[var(--secondary-text)] font-bold uppercase tracking-widest leading-none">{action.sub}</p>
                                    <h3 className="text-2xl font-black text-[var(--foreground)] mt-2">{action.label}</h3>
                                </div>
                                <div className={cn("absolute -right-4 -bottom-4 w-48 h-48 rounded-full opacity-10 blur-3xl z-0", action.color)} />
                            </motion.button>
                        ))}
                    </div>

                    {/* OFFICIAL CHANNELS BARS */}
                    <div className="space-y-4 mt-8">
                        <h3 className="text-[11px] font-black text-[var(--secondary-text)] uppercase tracking-[0.2em] mb-4 text-center">Moffi Lifestyle</h3>
                        
                        <button 
                            onClick={() => { onMoffinetClick(); onClose(); }}
                            className="w-full bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all p-5 rounded-[2.5rem] border border-white/10 flex items-center justify-between group shadow-xl shadow-black/20 active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-black text-sm uppercase tracking-wider">Moffi.net Portalı</h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">Hemen Keşfet</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20" />
                        </button>

                        <button 
                            onClick={() => { onMarketClick(); onClose(); }}
                            className="w-full bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all p-5 rounded-[2.5rem] border border-white/10 flex items-center justify-between group shadow-xl shadow-black/20 active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-black text-sm uppercase tracking-wider">Moffi Market</h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">Dünyanı Keşfet</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20" />
                        </button>
                    </div>

                    <div className="mt-12" />

                    {/* SERVICES GRID */}
                    <div className="space-y-6 mb-safe-bottom pb-12">
                        <div className="flex items-center gap-4">
                            <div className="grid grid-cols-4 gap-4 flex-1">
                                {services.map((service, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + (i * 0.05) }}
                                        onClick={() => { service.onClick(); onClose(); }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div className={cn("w-14 h-14 rounded-2xl bg-white/5 border flex items-center justify-center active:scale-90 transition-all", service.bg)}>
                                            <service.icon className={cn("w-6 h-6", service.color)} />
                                        </div>
                                        <span className="text-[8px] font-black text-[var(--secondary-text)] uppercase tracking-tight text-center">{service.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
