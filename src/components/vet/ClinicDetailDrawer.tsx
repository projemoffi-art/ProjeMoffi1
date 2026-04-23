"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Phone, Navigation, Star, MapPin, 
    Calendar, Clock, ShieldCheck, ChevronRight,
    Users, MessageSquare, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { VetClinic } from "@/types/domain";

interface ClinicDetailDrawerProps {
    clinicId: string | null;
    onClose: () => void;
    onBookAppointment: (clinic: VetClinic) => void;
}

export function ClinicDetailDrawer({ clinicId, onClose, onBookAppointment }: ClinicDetailDrawerProps) {
    const [clinic, setClinic] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'doctors' | 'reviews'>('info');

    useEffect(() => {
        if (clinicId) {
            fetchDetails();
        } else {
            setClinic(null);
            setActiveTab('info');
        }
    }, [clinicId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await apiService.getClinicDetails(clinicId!);
            setClinic(data);
        } catch (err) {
            console.error("Clinic details fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {clinicId && (
                <>
                    {/* BACKDROP */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm sm:backdrop-blur-none"
                    />

                    {/* DRAWER PANEL (Apple Maps Style) */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-[120] w-full sm:w-[480px] h-full bg-[#111111] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 flex flex-col"
                    >
                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#5B4D9D]/20 border-t-[#5B4D9D] rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Bilgiler Getiriliyor...</p>
                            </div>
                        ) : clinic ? (
                            <>
                                {/* HEADER IMAGE & CLOSE */}
                                <div className="relative h-72 shrink-0 group">
                                    <img src={clinic.imageUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/40" />
                                    
                                    <button 
                                        onClick={onClose}
                                        className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="absolute bottom-6 left-8 right-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            {clinic.isPremium && (
                                                <span className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                                                    <ShieldCheck className="w-3 h-3" /> MOFFI VERIFIED
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none truncate">{clinic.name}</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="text-xs font-black text-white">{clinic.rating}</span>
                                                <span className="text-[10px] text-white/40 font-bold">({clinic.reviewCount})</span>
                                            </div>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{clinic.distance} Uzaklıkta</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK ACTIONS */}
                                <div className="grid grid-cols-3 gap-3 p-6 shrink-0 bg-white/5 border-b border-white/5">
                                    <button 
                                        onClick={() => window.location.href = `tel:${clinic.phone || '02161234567'}`}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-[#5B4D9D] rounded-2xl shadow-lg shadow-[#5B4D9D]/20 active:scale-95 transition-all group"
                                    >
                                        <Phone className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Şimdi Ara</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + " " + clinic.address)}`, '_blank')}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <Navigation className="w-5 h-5 text-emerald-400" />
                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Yol Tarifi</span>
                                    </button>
                                    <button 
                                        onClick={() => { alert("Bilgi: Mesajlaşma özelliği yakında Moffi Chat ile entegre edilecek! 🐾"); }}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Mesaj At</span>
                                    </button>
                                </div>

                                {/* TABS NAVIGATION */}
                                <div className="flex px-6 border-b border-white/5 bg-[#111111] sticky top-0 z-20">
                                    {[
                                        { id: 'info', label: 'Genel', icon: Info },
                                        { id: 'doctors', label: 'Hekimler', icon: Users },
                                        { id: 'reviews', label: 'Yorumlar', icon: Star }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                                activeTab === tab.id ? "text-white" : "text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-[#5B4D9D]" : "")} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-4 h-1 bg-[#5B4D9D] rounded-t-full shadow-[0_-5px_15px_rgba(91,77,157,0.5)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* CONTENT AREA */}
                                <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0D0D0E]">
                                    {activeTab === 'info' && (
                                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                                        <MapPin className="w-6 h-6 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Konum</p>
                                                        <p className="text-sm font-bold text-white/90 leading-snug">{clinic.address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#5B4D9D]/10 flex items-center justify-center border border-[#5B4D9D]/20 shrink-0">
                                                        <Clock className="w-6 h-6 text-[#5B4D9D]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Çalışma Durumu</p>
                                                        <p className="text-sm font-bold text-white/90 flex items-center gap-2">
                                                            {clinic.isOpenNow ? (
                                                                <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ŞU AN AÇIK</span>
                                                            ) : (
                                                                <span className="text-red-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /> ŞU AN KAPALI</span>
                                                            )}
                                                            <span className="text-white/20">•</span>
                                                            <span className="text-white/40">24 Saat Hizmet</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-1">Sunulan Hizmetler</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {clinic.features?.map((feature: string) => (
                                                        <div key={feature} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                            <span className="text-xs font-black text-white/80 uppercase tracking-tight">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'doctors' && (
                                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {clinic.doctors?.map((doctor: any) => (
                                                <div key={doctor.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 group hover:bg-white/[0.08] transition-all relative overflow-hidden text-left">
                                                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#5B4D9D]/10 blur-3xl rounded-full pointer-events-none" />
                                                    
                                                    <div className="flex items-start gap-5 relative z-10">
                                                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/5 group-hover:border-[#5B4D9D]/30 transition-all shrink-0">
                                                            <img src={doctor.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-[#5B4D9D]/20 text-[#5B4D9D] text-[8px] font-black px-2 py-0.5 rounded-md inline-block uppercase tracking-widest mb-2 border border-[#5B4D9D]/20">
                                                                {doctor.specialization}
                                                            </div>
                                                            <h4 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-3">{doctor.name}</h4>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Clock className="w-3.5 h-3.5 text-white/20" />
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{doctor.workingHours}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 p-4 bg-black/40 rounded-2xl border border-white/5 relative z-10">
                                                        <p className="text-[11px] text-white/60 font-medium leading-relaxed italic">
                                                            {doctor.bio}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!clinic.doctors || clinic.doctors.length === 0) && (
                                                <div className="py-20 text-center opacity-20">
                                                    <Users className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Henüz hekim bilgisi eklenmemiş</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'reviews' && (
                                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {clinic.reviews?.map((review: any) => (
                                                <div key={review.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 text-left">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={review.userAvatar} className="w-10 h-10 rounded-full border border-white/10" />
                                                            <div>
                                                                <p className="text-xs font-black text-white uppercase italic">{review.userName}</p>
                                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-yellow-500 fill-current" : "text-white/5")} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/70 leading-relaxed font-bold italic">"{review.comment}"</p>
                                                </div>
                                            ))}
                                            <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/20 uppercase tracking-widest hover:border-[#5B4D9D]/40 hover:text-[#5B4D9D] transition-all">
                                                TÜM YORUMLARI GÖR
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* STICKY FOOTER ACTION */}
                                <div className="p-8 bg-[#111111]/80 backdrop-blur-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                    <button 
                                        onClick={() => onBookAppointment(clinic)}
                                        className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-[#5B4D9D] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 group"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        RANDEVU TALEP ET
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
