'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Package, Truck, Heart, Activity, 
    Stethoscope, ShoppingBag, PawPrint, 
    ChevronRight, Bell, Zap, Compass, Mail
} from 'lucide-react';
import { useHubData } from '@/hooks/useHubData';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';

interface CommandCenterDemoProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandCenterDemo({ isOpen, onClose }: CommandCenterDemoProps) {
    const { activePet } = usePet();
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Simulation states
    const [stats, setStats] = useState({ heart: 82, steps: 4621 });
    const [courierDist, setCourierDist] = useState(1.4);

    useEffect(() => {
        if (!isOpen) return;
        
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setStats(prev => ({ 
                heart: 80 + Math.floor(Math.random() * 5),
                steps: prev.steps + Math.floor(Math.random() * 2)
            }));
            setCourierDist(prev => Math.max(0.1, +(prev - 0.01).toFixed(2)));
        }, 3000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    const { unreadMessageCount } = useHubData();
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[8000] bg-black/40 backdrop-blur-3xl overflow-y-auto no-scrollbar"
                onClick={onClose}
            >
                {/* Drawer Container */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 bg-white/5 border-t border-white/10 rounded-t-[3.5rem] p-8 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] flex flex-col min-h-[85vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Apple Handle */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

                    {/* Header: Title & Clock */}
                    <div className="flex justify-between items-start mt-4 mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Moffi Intelligence</p>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Command Center</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white italic opacity-80">{currentTime}</p>
                            <div className="flex items-center gap-1 justify-end mt-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Canlı Senkronize</span>
                            </div>
                        </div>
                    </div>

                    {/* LIVE STATUS WIDGETS (The Pulse) */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {/* Pet Heart Rate */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Heart className="text-red-500" size={60} strokeWidth={1} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <Activity className="text-red-400" size={16} />
                                </div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Anlık Nabız</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic">{stats.heart}</span>
                                <span className="text-xs text-red-400 font-bold uppercase italic">BPM</span>
                            </div>
                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-2">Durum: Normal • Sakin</p>
                        </div>

                        {/* Steps / Activity */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Zap className="text-yellow-500" size={60} strokeWidth={1} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <PawPrint className="text-yellow-400" size={16} />
                                </div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Günlük Efor</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic">{stats.steps.toLocaleString()}</span>
                                <span className="text-xs text-yellow-400 font-bold uppercase italic">Pati</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                                <div className="bg-yellow-500 h-full w-[65%]" />
                            </div>
                        </div>
                    </div>

                    {/* LIVE LOGISTICS (Delivery Tracking) */}
                    <div className="mb-10">
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 pl-4">Aktif Teslimatlar</h3>
                        <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 rounded-[3rem] p-6 flex flex-col gap-6 group hover:border-orange-500/20 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white italic tracking-tight uppercase">Moffi Express ⚡️</h4>
                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Yolda • Kurye Yaklaşıyor</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white italic tracking-tighter">{courierDist} km</p>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Mesafe</p>
                                </div>
                            </div>
                            
                            <div className="relative pt-2">
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        animate={{ width: `${(1.4 - courierDist + 0.1) / 1.5 * 100}%` }}
                                        className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                    />
                                </div>
                                <motion.div 
                                    animate={{ left: `${(1.4 - courierDist + 0.1) / 1.5 * 100}%` }}
                                    className="absolute top-2 -mt-1 w-3 h-3 bg-white border-2 border-orange-500 rounded-full shadow-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LAUNCHER GRID (Action Grid) */}
                    <div className="mb-10">
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 pl-4">Hızlı Aksiyonlar</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { icon: ShoppingBag, label: 'Market', color: 'orange' },
                                { icon: Stethoscope, label: 'Vet', color: 'red' },
                                { icon: Mail, label: 'Mesajlar', color: 'indigo', badge: unreadMessageCount },
                                { icon: Compass, label: 'Gezgin', color: 'blue' },
                                { icon: Bell, label: 'Bildirim', color: 'purple' },
                            ].map((item, i) => (
                                <button key={i} className="flex flex-col items-center gap-3 active:scale-95 transition-all relative group">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.8rem] bg-white/5 border border-white/5 flex items-center justify-center text-white shadow-xl hover:bg-white/10 transition-colors",
                                        `hover:border-${item.color}-500/30`
                                    )}>
                                        <item.icon size={24} />
                                    </div>

                                    {/* NOTIFICATION BADGE */}
                                    {(item as any).badge > 0 && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-0 -right-1 w-5 h-5 bg-red-500 border-2 border-[#0A0A0E] rounded-full flex items-center justify-center z-10 shadow-lg"
                                        >
                                            <span className="text-[9px] font-black text-white">{(item as any).badge}</span>
                                        </motion.div>
                                    )}

                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* BOTTOM BANNER: Next Appointment */}
                    <button className="mt-auto w-full p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative">
                         <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                                <Stethoscope size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sıradaki Randevu</p>
                                <p className="text-lg font-black text-white italic tracking-tight uppercase">Karma Aşı II</p>
                            </div>
                         </div>
                         <div className="text-right relative z-10">
                            <p className="text-sm font-black text-red-400 uppercase italic">3 GÜN KALDI</p>
                            <ChevronRight size={18} className="text-gray-700 ml-auto mt-1" />
                         </div>
                    </button>
                    
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
