"use client";

import { motion } from "framer-motion";
import { PawPrint, Heart, List, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

const MOCK_ADOPTIONS = [
    { id: 1, type: "Kedi", name: "Duman", status: "open", location: "Kadıköy Barınağı" },
    { id: 2, type: "Köpek", name: "Max", status: "pending", location: "Kullanıcı İlanı" },
    { id: 3, type: "Kedi", name: "Mia", status: "closed", location: "Beşiktaş Belediyesi" },
];

export default function AdoptionPage() {
    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <PawPrint className="w-8 h-8 text-amber-500" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        Sahiplendirme
                    </motion.h1>
                </div>
                <button className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl">
                    + Yeni İlan Oluştur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Toplam İlan", val: "1,248" },
                    { label: "Sahiplendirilen", val: "840" },
                    { label: "Bekleyen Başvuru", val: "156" },
                    { label: "Aktif Barınak", val: "24" },
                ].map((stat, i) => (
                    <GlassCard key={i} className="p-6">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className="text-3xl font-black text-white">{stat.val}</p>
                    </GlassCard>
                ))}
            </div>

            <GlassCard className="p-8">
                <h3 className="text-white font-black uppercase tracking-widest mb-8">Son İlanlar</h3>
                <div className="w-full text-left">
                    <div className="grid grid-cols-5 text-[10px] font-black text-white/40 uppercase tracking-widest pb-4 border-b border-white/10">
                        <div className="col-span-2">Dostumuz</div>
                        <div>Türü</div>
                        <div>Konum</div>
                        <div className="text-right">Durum</div>
                    </div>
                    {MOCK_ADOPTIONS.map(ad => (
                        <div key={ad.id} className="grid grid-cols-5 items-center py-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="col-span-2 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white/40" />
                                </div>
                                <span className="font-bold text-white">{ad.name}</span>
                            </div>
                            <div className="text-white/60 text-sm">{ad.type}</div>
                            <div className="text-white/60 text-sm">{ad.location}</div>
                            <div className="flex justify-end">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                    ad.status === 'open' ? "bg-green-500/20 text-green-400" :
                                    ad.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-white/10 text-white/40"
                                )}>
                                    {ad.status === 'open' ? 'Açık' : ad.status === 'pending' ? 'İnceleniyor' : 'Kapalı'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
