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

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";

export default function HealthPage() {
    const { getAllUsers, approveBusiness, rejectBusiness } = useAuth();
    const [activeTab, setActiveTab] = useState<'vets' | 'sos'>('vets');
    const [vets, setVets] = useState<any[]>([]);
    const [sosPets, setSosPets] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            if (activeTab === 'vets') {
                const users = await getAllUsers();
                const vetBusinesses = users.filter((u: any) => u.role === 'business' && u.businessType === 'vet');
                setVets(vetBusinesses);
            } else if (activeTab === 'sos') {
                const pets = await apiService.getLostPets();
                setSosPets(pets || []);
            }
        }
        loadData();
    }, [activeTab]);

    const handleApprove = async (id: string) => {
        await approveBusiness(id);
        setVets(prev => prev.map(v => v.id === id ? { ...v, kybStatus: 'approved' } : v));
    };

    const handleReject = async (id: string) => {
        await rejectBusiness(id);
        setVets(prev => prev.map(v => v.id === id ? { ...v, kybStatus: 'rejected' } : v));
    };
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
                        {vets.map(vet => (
                            <div key={vet.id} className="grid grid-cols-4 items-center py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="font-bold text-white text-sm">{vet.name || 'İsimsiz'}</div>
                                <div className="text-white/60 text-sm">{vet.businessName || '-'}</div>
                                <div className="text-white/60 text-sm font-mono">{vet.created_at ? new Date(vet.created_at).toLocaleDateString() : '-'}</div>
                                <div className="flex items-center justify-end gap-2">
                                    {(vet.kybStatus === 'pending' || !vet.kybStatus) && (
                                        <>
                                            <button onClick={() => handleApprove(vet.id)} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40"><CheckCircle2 className="w-5 h-5" /></button>
                                            <button onClick={() => handleReject(vet.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"><XCircle className="w-5 h-5" /></button>
                                        </>
                                    )}
                                    {vet.kybStatus === 'approved' && <span className="text-green-400 text-xs font-bold uppercase">Onaylandı</span>}
                                    {vet.kybStatus === 'rejected' && <span className="text-red-400 text-xs font-bold uppercase">Reddedildi</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {activeTab === 'sos' && (
                <GlassCard className="p-8">
                    <h3 className="text-white font-black uppercase tracking-widest mb-6">Aktif SOS (Kayıp) İlanları</h3>
                    {sosPets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-dashed border-rose-500/30 bg-rose-500/5 rounded-2xl">
                            <ShieldAlert className="w-16 h-16 text-rose-500/40 mb-4" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Aktif SOS Sinyali Yok</h3>
                            <p className="text-white/40 max-w-sm text-sm">Bölgedeki tüm sağlık sinyalleri normal düzeyde.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sosPets.map(pet => (
                                <div key={pet.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden shrink-0">
                                            {pet.img && <img src={pet.img} alt={pet.name} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{pet.name}</h4>
                                            <p className="text-rose-400 text-xs font-medium">{pet.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-xs bg-black/30 p-3 rounded-xl line-clamp-2">
                                        {pet.description || "Açıklama bulunmuyor."}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            )}
        </div>
    );
}
