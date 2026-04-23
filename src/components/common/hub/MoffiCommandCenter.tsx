'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Package, Truck, Heart, Activity, 
    Stethoscope, ShoppingBag, PawPrint, 
    ChevronRight, Bell, Zap, Compass, Lock,
    ArrowUpRight, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';
import { useHubData } from '@/hooks/useHubData';

interface MoffiCommandCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (id: string) => void;
}

export function MoffiCommandCenter({ isOpen, onClose, onNavigate }: MoffiCommandCenterProps) {
    const { activePet } = usePet();
    const { activeOrder, todayStats, nextHealthAlert, isPro, isLoading } = useHubData();
    const [currentTime, setCurrentTime] = useState('');

    // Simulated heart rate (Pro only)
    const [simHeartRate, setSimHeartRate] = useState(82);

    useEffect(() => {
        if (!isOpen) return;
        
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const timer = setInterval(updateTime, 60000);

        // Simulated pulse for Pro users
        const pulse = setInterval(() => {
            if (isPro) setSimHeartRate(80 + Math.floor(Math.random() * 6));
        }, 3000);

        return () => {
            clearInterval(timer);
            clearInterval(pulse);
        };
    }, [isOpen, isPro]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-2xl overflow-y-auto no-scrollbar"
                onClick={onClose}
            >
                {/* Main Hub Container */}
                <motion.div
                    initial={{ y: '100%', opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0.5 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 bg-[#0A0A0E] border-t border-white/10 rounded-t-[4rem] p-8 pb-12 shadow-[0_-30px_100px_rgba(0,0,0,0.9)] min-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Apple Style Grabber */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                    {/* TOP HEADER: Identity & Clock */}
                    <div className="flex justify-between items-start mt-4 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B4D9D] to-[#8B5CF6] p-[2px] shadow-lg shadow-purple-500/20">
                                <div className="w-full h-full rounded-2xl bg-[#0A0A0E] overflow-hidden">
                                     {activePet?.image && <img src={activePet.image} alt="Pet" className="w-full h-full object-cover opacity-80" />}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{activePet?.name || 'Moffi'}</h2>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Canlı Senkronize</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white italic tracking-tighter opacity-90">{currentTime}</p>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Komuta Merkezi</p>
                        </div>
                    </div>

                    {/* WIDGET GRID (Pro vs Free Pulse) */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Live Heartbeat (Pro Guard) */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.8rem] p-6 relative overflow-hidden group">
                            {!isPro && (
                                <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                                        <Crown className="text-yellow-500" size={18} />
                                    </div>
                                    <p className="text-[10px] text-white font-black uppercase tracking-widest">Moffi Pro</p>
                                    <button onClick={() => onNavigate('studio')} className="mt-2 px-3 py-1 bg-white/10 rounded-full text-[8px] font-bold uppercase hover:bg-white/20 transition-colors">Yükselt</button>
                                </div>
                            )}
                            
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Heart className="text-red-500" size={100} strokeWidth={1} />
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="text-red-400" size={16} />
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Anlık Nabız</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic">{isPro ? simHeartRate : '--'}</span>
                                <span className="text-xs text-red-400 font-bold uppercase italic tracking-tighter">BPM</span>
                            </div>
                            <div className="mt-4 flex gap-1 h-3 items-end">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div 
                                        key={i}
                                        animate={{ height: isPro ? [4, 12, 4] : 4 }}
                                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                        className="w-1.5 bg-red-500/30 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Daily Activity (Free/All) */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.8rem] p-6 relative overflow-hidden group">
                           <div className="flex items-center gap-3 mb-4">
                                <PawPrint className="text-yellow-400" size={16} />
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bugünkü Efor</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic">{todayStats.steps.toLocaleString()}</span>
                                <span className="text-xs text-yellow-500 font-bold uppercase italic tracking-tighter">Pati</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                     <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (todayStats.steps / 5000) * 100)}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">{todayStats.distanceKm}km</span>
                            </div>
                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-4 tracking-widest">Hedef: 5,000 PAti</p>
                        </div>
                    </div>

                    {/* LIVE LOGISTICS (Real Order Tracking) */}
                    {activeOrder && (
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 pl-4">Aktif Teslimat</h3>
                            <button 
                                onClick={() => onNavigate('orders')}
                                className="w-full bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-[3rem] p-6 flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-orange-500 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] group-hover:rotate-6 transition-transform">
                                        <Truck size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xl font-black text-white tracking-tighter uppercase italic">Moffi Express ⚡️</h4>
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">
                                            {activeOrder.status === 'shipped' ? 'YOLDA • KURYE YAKLAŞIYOR' : 'HAZIRLANIYOR'}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                                    <ArrowUpRight size={24} />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ACTIONS QUICK ACCESS (The Core Launcher) */}
                    <div className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-[3rem]">
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { id: 'market', icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                                { id: 'appointments', icon: Stethoscope, color: 'text-red-400', bg: 'bg-red-500/10' },
                                { id: 'routes', icon: Compass, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                                { id: 'radar', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                            ].map((item, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => onNavigate(item.id)}
                                    className="flex flex-col items-center gap-3 active:scale-95 transition-all"
                                >
                                    <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl border border-white/5", item.bg, item.color)}>
                                        <item.icon size={26} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HEALTH REMINDER BANNER */}
                    {nextHealthAlert && (
                        <button 
                            onClick={() => onNavigate('appointments')}
                            className="mt-auto w-full p-6 bg-white/[0.03] border border-white/5 rounded-[2.8rem] flex items-center justify-between group overflow-hidden"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2x bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                    <Stethoscope size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Sıradaki Sağlık Takibi</p>
                                    <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{nextHealthAlert.name}</h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-red-500 italic uppercase leading-none">{nextHealthAlert.daysLeft} GÜN</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">KALDI</p>
                            </div>
                        </button>
                    )}
                    
                    {!nextHealthAlert && (
                       <div className="mt-auto pt-4 text-center">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Moffi Ecosystem • 2026</p>
                       </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
