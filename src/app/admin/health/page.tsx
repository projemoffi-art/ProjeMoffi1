"use client";

import { motion } from "framer-motion";
import { HeartPulse, CheckCircle2, XCircle, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

const MOCK_VETS = [
    { id: 1, name: "Dr. Ahmet Yılmaz", clinic: "Mutlu Patiler Kliniği", status: "pending", date: "2023-10-24" },
    { id: 2, name: "Dr. Ayşe Demir", clinic: "Şifa Vet", status: "approved", date: "2023-10-23" },
    { id: 3, name: "Dr. Mehmet Kaya", clinic: "Can Dostlar", status: "rejected", date: "2023-10-22" },
];

export default function HealthPage() {
    const [activeTab, setActiveTab] = useState<'vets' | 'sos'>('vets');

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <HeartPulse className="w-8 h-8 text-rose-500" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        Sağlık & SOS
                    </motion.h1>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                    <button
                        onClick={() => setActiveTab('vets')}
                        className={cn("px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'vets' ? "bg-rose-500 text-white" : "text-white/40 hover:text-white")}
                    >
                        Veteriner Onayları
                    </button>
                    <button
                        onClick={() => setActiveTab('sos')}
                        className={cn("px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'sos' ? "bg-rose-500 text-white" : "text-white/40 hover:text-white")}
                    >
                        Aktif SOS
                    </button>
                </div>
            </div>

            {activeTab === 'vets' && (
                <GlassCard className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-white font-black uppercase tracking-widest">Bekleyen Başvurular</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                            <input type="text" placeholder="Doktor veya klinik ara..." className="bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 w-64" />
                        </div>
                    </div>

                    <div className="w-full text-left border-collapse">
                        <div className="grid grid-cols-4 text-[10px] font-black text-white/40 uppercase tracking-widest pb-4 border-b border-white/10">
                            <div>Doktor Adı</div>
                            <div>Klinik</div>
                            <div>Başvuru Tarihi</div>
                            <div className="text-right">İşlem</div>
                        </div>
                        {MOCK_VETS.map(vet => (
                            <div key={vet.id} className="grid grid-cols-4 items-center py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="font-bold text-white text-sm">{vet.name}</div>
                                <div className="text-white/60 text-sm">{vet.clinic}</div>
                                <div className="text-white/60 text-sm font-mono">{vet.date}</div>
                                <div className="flex items-center justify-end gap-2">
                                    {vet.status === 'pending' && (
                                        <>
                                            <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40"><CheckCircle2 className="w-5 h-5" /></button>
                                            <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"><XCircle className="w-5 h-5" /></button>
                                        </>
                                    )}
                                    {vet.status === 'approved' && <span className="text-green-400 text-xs font-bold uppercase">Onaylandı</span>}
                                    {vet.status === 'rejected' && <span className="text-red-400 text-xs font-bold uppercase">Reddedildi</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {activeTab === 'sos' && (
                <GlassCard className="p-16 flex flex-col items-center justify-center text-center border-dashed border-rose-500/30 bg-rose-500/5">
                    <ShieldAlert className="w-20 h-20 text-rose-500/40 mb-6" />
                    <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Aktif SOS Sinyali Yok</h3>
                    <p className="text-white/40 max-w-md">Bölgedeki tüm sağlık sinyalleri normal düzeyde. Kayıp veya acil durum sinyalleri anlık olarak buraya düşer.</p>
                </GlassCard>
            )}
        </div>
    );
}
