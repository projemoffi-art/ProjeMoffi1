"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, MapPin, Phone, Star, Calendar, 
    Navigation, ChevronRight, Syringe, 
    ShieldCheck, Clock, ArrowRight,
    Stethoscope, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVet } from "@/hooks/useVet";
import { useVaccineSchedule } from "@/hooks/useVaccineSchedule";
import { useRouter } from "next/navigation";

interface VetQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petId?: string;
}

export function VetQuickSheet({ isOpen, onClose, petId = "pet-1" }: VetQuickSheetProps) {
    const router = useRouter();
    const { featuredClinics, isLoading: isVetLoading } = useVet();
    const { schedule, isLoading: isVaccineLoading } = useVaccineSchedule(petId);

    const nearestClinic = featuredClinics[0];
    const nextVaccine = schedule?.find(v => !v.completed) || schedule?.[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 inset-x-0 z-[3001] bg-[#1C1C1E] rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* iOS Style Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                        <div className="px-8 pt-10 pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Veteriner Hizmetleri</h3>
                                <p className="text-[10px] text-[#5B4D9D] font-black uppercase tracking-[0.3em] mt-2">Hızlı Erişim Paneli</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        <div className="px-8 pb-12 space-y-8 overflow-y-auto no-scrollbar">
                            
                            {/* 1. NEAREST CLINIC HIGHLIGHT */}
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> En Yakın Klinik
                                    </h4>
                                    <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Açık</span>
                                </div>

                                {isVetLoading ? (
                                    <div className="h-32 bg-white/5 animate-pulse rounded-[2rem]" />
                                ) : nearestClinic ? (
                                    <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.2rem] p-5 relative group overflow-hidden">
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                                <img src={nearestClinic.imageUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-white text-lg truncate mb-1">{nearestClinic.name}</h5>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-xs text-white/40 font-bold">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                        {nearestClinic.rating}
                                                    </div>
                                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                                    <div className="text-xs text-[#5B4D9D] font-black uppercase tracking-tighter">
                                                        {nearestClinic.distance} mesafede
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-5">
                                            <button className="flex-1 bg-white text-black h-12 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                                <Phone className="w-4 h-4 fill-current" /> Ara
                                            </button>
                                            <button className="flex-1 bg-white/5 border border-white/10 text-white h-12 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                                <Navigation className="w-4 h-4" /> Yol Tarifi
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </section>

                            {/* 2. NEXT VACCINE REMINDER */}
                            <section>
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                                    <Syringe className="w-3 h-3" /> Sağlık Durumu
                                </h4>
                                
                                {isVaccineLoading ? (
                                    <div className="h-20 bg-white/5 animate-pulse rounded-2xl" />
                                ) : nextVaccine ? (
                                    <div className="bg-[#5B4D9D]/10 border border-[#5B4D9D]/20 rounded-[1.8rem] p-5 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#5B4D9D]/20 rounded-2xl flex items-center justify-center border border-[#5B4D9D]/30">
                                                <Clock className="w-6 h-6 text-[#5B4D9D]" />
                                            </div>
                                            <div>
                                                <h6 className="text-white font-black text-base italic uppercase">{nextVaccine.name}</h6>
                                                <p className="text-[#5B4D9D] text-[10px] font-black uppercase tracking-widest mt-0.5">{nextVaccine.date}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#5B4D9D] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">
                                            Hatırlat
                                        </div>
                                    </div>
                                ) : null}
                            </section>

                            {/* 3. QUICK ACTION GRID */}
                            <section className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { router.push('/vet?modal=vaccine'); onClose(); }}
                                    className="bg-white/5 border border-white/10 rounded-[1.8rem] p-5 text-left flex flex-col justify-between h-32 hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase italic leading-none">Aşı Karnesi</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/vet?modal=clinicList'); onClose(); }}
                                    className="bg-white/5 border border-white/10 rounded-[1.8rem] p-5 text-left flex flex-col justify-between h-32 hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase italic leading-none">Klinik Ara</span>
                                </button>
                            </section>

                            {/* 4. FOOTER: VIEW ALL */}
                            <button
                                onClick={() => { router.push('/vet'); onClose(); }}
                                className="w-full bg-white/5 border border-white/10 py-5 rounded-[2rem] flex items-center justify-center gap-3 group hover:bg-white hover:text-black transition-all"
                            >
                                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Tüm Detayları Gör</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
