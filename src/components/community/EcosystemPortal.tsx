'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Globe, Users, Coins, TrendingUp, 
    ShieldCheck, MessageSquare, Heart, 
    BarChart3, Zap, MapPin, ChevronRight,
    ArrowUpRight, Star, Award, Vote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface EcosystemPortalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EcosystemPortal({ isOpen, onClose }: EcosystemPortalProps) {
    const stats = [
        { label: 'Aktif Patiler', value: '1.2M+', icon: <Users className="w-5 h-5" />, color: 'text-cyan-400' },
        { label: 'Yardım Fonu', value: '450K ₺', icon: <Heart className="text-red-400" fill="currentColor" />, color: 'text-red-400' },
        { label: 'Sirkülasyon', value: '85M PC', icon: <Coins className="w-5 h-5" />, color: 'text-orange-400' },
    ];

    const proposals = [
        { id: 1, title: 'Kadıköy Yeni Köpek Parkı', votes: '12.4K', status: 'Oylamada', progress: 75 },
        { id: 2, title: 'Sokak Patileri Kış Desteği', votes: '45.1K', status: 'Kabul Edildi', progress: 100 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[3000] backdrop-blur-3xl overflow-y-auto no-scrollbar flex flex-col pt-safe bg-[#050505]/95"
                >
                    {/* AMBIENT BACKGROUND */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
                    </div>

                    {/* HEADER */}
                    <div className="px-8 py-10 flex items-center justify-between sticky top-0 z-20">
                        <div className="flex items-center gap-6">
                            <a 
                                href="https://moffi.net" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-16 h-16 rounded-[2rem] bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:scale-105 active:scale-95 transition-all"
                            >
                                <Globe className="w-8 h-8 animate-pulse" />
                            </a>
                            <div>
                                <a 
                                    href="https://moffi.net" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block group/title"
                                >
                                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none group-hover/title:text-cyan-400 transition-colors">Moffi.net</h2>
                                </a>
                                <a 
                                    href="https://moffi.net" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.4em] mt-1.5 underline decoration-cyan-500/30 hover:text-white transition-colors"
                                >
                                    Ecosystem Control ↗
                                </a>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all outline-none"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="px-6 pb-40 space-y-12 relative z-10">
                        
                        {/* 1. GLOBAL STATS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 border border-white/10 p-8 rounded-[3rem] flex flex-col gap-4 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", stat.color)}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{stat.label}</p>
                                        <p className="text-4xl font-black text-white tracking-tighter italic mt-1">{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 2. COMMUNITY GOVERNANCE (NEW) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Topluluk Oylamaları</h3>
                                <Vote className="w-5 h-5 text-purple-400 animate-bounce" />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {proposals.map((prop) => (
                                    <div key={prop.id} className="bg-[#12121A] border border-white/10 p-8 rounded-[3rem] space-y-6 group hover:border-purple-500/30 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">{prop.title}</h4>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Aktif Oylama: {prop.votes} Katılım</p>
                                            </div>
                                            <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                                {prop.status}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                <span>Hedef</span>
                                                <span>%{prop.progress}</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${prop.progress}%` }}
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                                                />
                                            </div>
                                        </div>
                                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                            Oyunu Kullan
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. ECOSYSTEM NEWS */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter px-2">Ekosistemden Haberler</h3>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                {[
                                    { title: 'Sokak Hayvanları İçin Yeni Bağış Modeli', date: 'Bugün', img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400' },
                                    { title: 'Global Akıllı Künye Ağı Genişliyor', date: 'Dün', img: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=400' },
                                    { title: 'Moffi+ Pro Üyelerine Özel Hediyeler', date: '12 Ara', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400' }
                                ].map((news, i) => (
                                    <div key={i} className="min-w-[280px] bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group active:scale-95 transition-all">
                                        <div className="h-44 relative overflow-hidden">
                                            <Image src={news.img} fill className="object-cover transition-transform group-hover:scale-110 duration-700" alt={news.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{news.date}</p>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="text-sm font-black text-white uppercase leading-snug tracking-tight">{news.title}</h4>
                                            <button className="flex items-center gap-2 mt-4 text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">
                                                Devamını Oku <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. FOOTER INFO */}
                        <div className="pt-12 border-t border-white/5 text-center">
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.4em] leading-relaxed">
                                Moffi Ecosystem © 2024<br/>
                                Global Verified Node: #2847-AX (İSTANBUL/KADIKÖY)
                            </p>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
