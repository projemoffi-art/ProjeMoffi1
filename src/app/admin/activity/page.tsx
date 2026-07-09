"use client";

import { motion } from "framer-motion";
import { Gamepad2, Map as MapIcon, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

const MOCK_PARKS = [
    { name: "Yoğurtçu Parkı", active: 24, status: "high" },
    { name: "Moda Sahili", active: 15, status: "medium" },
    { name: "Caddebostan Sahil", active: 42, status: "high" },
    { name: "Maçka Parkı", active: 8, status: "low" },
];

export default function ActivityPage() {
    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        Yürüyüş & Oyun
                    </motion.h1>
                </div>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                    <button className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-500 text-white">Harita Görünümü</button>
                    <button className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-white/40 hover:text-white">Isı Haritası</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="p-8 lg:col-span-2 min-h-[500px] flex flex-col relative border-dashed border-emerald-500/30">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center">
                        <MapIcon className="w-24 h-24 text-emerald-500/20 mb-6" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Canlı Harita Yükleniyor</h3>
                        <p className="text-white/40 max-w-md">API entegrasyonu tamamlandıktan sonra anlık lokasyon bazlı harita verileri burada görüntülenecektir.</p>
                    </div>
                </GlassCard>

                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h4 className="text-white font-black uppercase tracking-widest mb-6">Aktif Bölgeler</h4>
                        <div className="space-y-4">
                            {MOCK_PARKS.map((park, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", park.status === 'high' ? "bg-rose-500" : park.status === 'medium' ? "bg-amber-500" : "bg-emerald-500")} />
                                        <span className="text-sm font-bold text-white">{park.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/40">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-mono">{park.active}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-gradient-to-br from-emerald-900/40 to-[#0A0A0E]">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
                            <MapPin className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-black text-white uppercase mb-2">Popüler Rotalar</h4>
                        <p className="text-white/60 text-xs mb-4">Moffi topluluğunun en çok tercih ettiği yürüyüş rotaları analiz ediliyor.</p>
                        <button className="w-full py-3 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                            Rapor Oluştur
                        </button>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
