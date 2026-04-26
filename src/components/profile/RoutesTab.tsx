'use client';

import React from 'react';
import { Map, ChevronRight, Activity, Clock, Navigation, Heart, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivity } from '@/context/ActivityContext';

export function RoutesTab({ routes = [], activePet }: { routes?: any[], activePet?: any }) {
    const { walkData } = useActivity();

    // Mock history data for demonstration
    const mockHistory = [
        { id: '1', distance: '1.2 km', duration: '15 dk', date: 'Bugün', path: 'Sahil Yolu Yürüyüşü' },
        { id: '2', distance: '0.8 km', duration: '10 dk', date: 'Dün', path: 'Mahalle Turu' },
        { id: '3', distance: '2.4 km', duration: '25 dk', date: '24 Nisan', path: 'Park Gezisi' },
    ];

    const displayRoutes = routes.length > 0 ? routes : mockHistory;

    return (
        <div className="space-y-6 pb-20">
            <div className="px-2 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-rose-500/10 border-2 border-rose-500/30 p-1 relative">
                        <Heart className="w-full h-full p-2 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Aktivite <span className="text-rose-500">Günlüğü</span></h3>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">{activePet?.name || 'Milo'} Egzersiz Raporu</p>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS - SYNCED WITH REAL DATA */}
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-[#12121A] border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 text-rose-500">
                        <Activity className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Haftalık Mesafe</span>
                    </div>
                    <p className="text-2xl font-black text-white leading-none">
                        {walkData.isActive ? (12.4 + (walkData.distance/1000)).toFixed(1) : "12.4"} 
                        <span className="text-[10px] opacity-50 uppercase tracking-widest ml-1">KM</span>
                    </p>
                </div>
                <div className="bg-[#12121A] border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 text-orange-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Haftalık Süre</span>
                    </div>
                    <p className="text-2xl font-black text-white leading-none">
                        {walkData.isActive ? (8.2 + (walkData.time/3600)).toFixed(1) : "8.2"}
                        <span className="text-[10px] opacity-50 uppercase tracking-widest ml-1">SAAT</span>
                    </p>
                </div>
            </div>

            {/* HISTORY LIST */}
            <div className="space-y-4 pt-6">
                <div className="flex items-center gap-2 px-2 mb-2">
                    <Calendar className="w-3 h-3 text-white/40" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Son Hareketler</span>
                </div>
                {displayRoutes.map(route => (
                    <div key={route.id} className="bg-[#12121A]/50 border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between group hover:border-rose-500/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-5">
                            <div className="bg-rose-500/20 text-rose-500 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-rose-500/30 group-hover:scale-105 transition-transform">
                                <span className="text-[8px] font-black leading-none italic pb-0.5 opacity-60">KM</span>
                                <span className="text-xl font-black leading-none">{route.distance.split(' ')[0]}</span>
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-black text-lg tracking-tight uppercase leading-none mb-1">{route.path}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{route.date}</span>
                                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{route.duration}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                                <Navigation className="w-3.5 h-3.5 text-gray-600 group-hover:text-rose-500 rotate-45 transition-colors" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </div>

            {/* CLOUD PROMO */}
            <div className="bg-gradient-to-br from-[#12121A] via-[#0A0A0E] to-[#12121A] border border-white/10 p-10 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <h4 className="text-white font-black text-2xl italic tracking-tighter uppercase mb-4 leading-tight">Verilerini <span className="text-rose-500">Buluta</span> Yedekle</h4>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-10 max-w-[240px] mx-auto opacity-70">Tüm aktivite geçmişini asla kaybetmemek için Moffi Cloud'u aktifleştir.</p>
                    <button className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-all shadow-xl shadow-white/5">Hemen Yükselt</button>
                </div>
            </div>
        </div>
    );
}
