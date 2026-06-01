"use client";

import { Bell, Battery, Users, Radio } from "lucide-react";

export function GuardianStatusOverlay() {
    return (
        <div className="absolute top-24 right-4 left-4 z-[5000] pointer-events-none">
            {/* Main Alert Bar */}
            <div className="bg-red-600 text-white rounded-2xl p-4 shadow-2xl shadow-red-900/50 flex items-center justify-between border border-red-400 animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <Bell className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm tracking-wide">GUARDIAN AKTİF</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-90">
                            <span className="w-2 h-2 bg-card rounded-full animate-ping" />
                            CANLI TAKİP
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black font-mono">15:00</div>
                    <div className="text-[10px] opacity-80 font-bold uppercase">Kalan Batarya</div>
                </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-black/80 backdrop-blur text-white p-2 rounded-xl border border-card-border flex flex-col items-center justify-center">
                    <Users className="w-4 h-4 text-red-500 mb-1" />
                    <span className="text-lg font-black leading-none">124</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Arama Timi</span>
                </div>
                <div className="bg-black/80 backdrop-blur text-white p-2 rounded-xl border border-card-border flex flex-col items-center justify-center">
                    <Radio className="w-4 h-4 text-green-500 mb-1" />
                    <span className="text-lg font-black leading-none">GPS</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Sinyal</span>
                </div>
                <div className="bg-black/80 backdrop-blur text-white p-2 rounded-xl border border-card-border flex flex-col items-center justify-center">
                    <Battery className="w-4 h-4 text-yellow-500 mb-1" />
                    <span className="text-lg font-black leading-none">88%</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Tasma</span>
                </div>
            </div>
        </div>
    );
}
