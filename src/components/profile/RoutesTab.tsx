'use client';

import React from 'react';
import { Map, ChevronRight, Activity, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoutesTab({ routes, activePet }: { routes: any[], activePet: any }) {
    if (routes.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center gap-6 opacity-40">
                <Map className="w-16 h-16 text-gray-500" />
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Henüz bir yürüyüş kaydı yok</p>
                <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest">Hemen Başla</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="px-2 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-cyan-500/10 border-2 border-cyan-500/30 p-1 relative">
                        <Map className="w-full h-full p-2 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Yürüyüş <span className="text-cyan-400">Geçmişi</span></h3>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">{activePet?.name || 'Milo'} Maratonları</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-[#12121A] border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Toplam Mesafe</span>
                    </div>
                    <p className="text-2xl font-black text-white leading-none">12.4 <span className="text-[10px] opacity-50 uppercase tracking-widest ml-1">KM</span></p>
                </div>
                <div className="bg-[#12121A] border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-purple-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Toplam Süre</span>
                    </div>
                    <p className="text-2xl font-black text-white leading-none">8.2 <span className="text-[10px] opacity-50 uppercase tracking-widest ml-1">SAAT</span></p>
                </div>
            </div>

            <div className="space-y-4 pt-6">
                {routes.map(route => (
                    <div key={route.id} className="bg-[#12121A]/50 border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between group hover:border-cyan-500/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-5">
                            <div className="bg-cyan-500/20 text-cyan-400 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-cyan-500/30 group-hover:scale-105 transition-transform">
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
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                                <Navigation className="w-3.5 h-3.5 text-gray-600 group-hover:text-cyan-400 rotate-45 transition-colors" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </div>

            {/* UPGRADE CARD */}
            <div className="bg-gradient-to-br from-[#12121A] via-[#0A0A0E] to-[#12121A] border border-white/10 p-10 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <h4 className="text-white font-black text-2xl italic tracking-tighter uppercase mb-4 leading-tight">Daha Fazla <span className="text-cyan-400">Rota</span> Keşfet</h4>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-10 max-w-[240px] mx-auto opacity-70">En popüler gezi rotalarını ve köpek parklarını harita üzerinde görüntüleyin.</p>
                    <button className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-all shadow-xl shadow-white/5">Premium Keşfet</button>
                </div>
            </div>
        </div>
    );
}
