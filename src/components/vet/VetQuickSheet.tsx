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
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface VetQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petId?: string;
}

// Faz 25 düzeltmesi (2026-09-25) — bu sheet .theme-vet'in DIŞINDA, global olarak
// render edildiği için bg-accent/bg-card gibi utility'ler yanlış (kişiselleştirme)
// rengi kullanırdı; kök root'a .theme-vet eklendi ki referansın sıcak turuncu/
// krem paleti burada da doğru aksın (bkz. CLAUDE.md Bölüm 8.27).
export function VetQuickSheet({ isOpen, onClose, petId = "pet-1" }: VetQuickSheetProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const handleOpenModal = (modalName: string) => {
        if (pathname === '/vet') {
            window.dispatchEvent(new CustomEvent('openVetModal', { detail: modalName }));
        } else {
            router.push(`/vet?open=${modalName}`);
        }
        onClose();
    };
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
                        className="theme-vet fixed bottom-0 inset-x-0 z-[3001] bg-background rounded-t-[3rem] border-t border-card-border shadow-[0_-20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* iOS Style Grab Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-foreground/10 rounded-full" />

                        <div className="px-4 sm:px-8 pt-8 sm:pt-10 pb-4 sm:pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">Veteriner hizmetleri</h3>
                                <p className="text-[10px] sm:text-[11px] text-secondary font-bold mt-1.5 sm:mt-2">Hızlı erişim paneli</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-card rounded-full flex items-center justify-center border border-card-border hover:bg-card-border/50 transition-all"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                            </button>
                        </div>

                        <div className="px-4 sm:px-8 pb-8 sm:pb-12 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">

                            {/* 1. NEAREST CLINIC HIGHLIGHT */}
                            <section>
                                <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                                    <h4 className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" /> En yakın klinik
                                    </h4>
                                    <span className="text-[9px] font-black text-accent-secondary bg-accent-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Açık</span>
                                </div>

                                {isVetLoading ? (
                                    <div className="h-32 bg-card-border/40 animate-pulse rounded-[1.5rem] sm:rounded-[2rem]" />
                                ) : nearestClinic ? (
                                    <div
                                        onClick={() => { router.push(`/vet?clinicId=${nearestClinic.id}`); onClose(); }}
                                        className="bg-card border border-card-border rounded-[1.5rem] sm:rounded-[2.2rem] p-4 sm:p-5 relative group overflow-hidden cursor-pointer active:scale-[0.98] hover:border-accent/30 transition-all"
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border border-card-border shrink-0">
                                                <img src={nearestClinic.imageUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-foreground text-base sm:text-lg mb-0.5 sm:mb-1">{nearestClinic.name}</h5>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-secondary font-bold">
                                                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-current" />
                                                        {nearestClinic.rating}
                                                    </div>
                                                    <div className="w-1 h-1 bg-secondary/30 rounded-full" />
                                                    <div className="text-[10px] sm:text-xs text-secondary font-semibold">
                                                        {nearestClinic.distance} mesafede
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4 sm:mt-5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${nearestClinic.phone || '02161234567'}`; }}
                                                className="flex-1 bg-foreground text-background h-10 sm:h-12 rounded-lg sm:rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-foreground/90 active:scale-95 transition-all"
                                            >
                                                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> Ara
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestClinic.name)}`, '_blank'); }}
                                                className="flex-1 bg-card-border/40 border border-card-border text-foreground h-10 sm:h-12 rounded-lg sm:rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-card-border/70 active:scale-95 transition-all"
                                            >
                                                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Yol tarifi
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </section>

                            {/* 2. NEXT VACCINE REMINDER */}
                            <section>
                                <h4 className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-wider mb-3 sm:mb-4 px-1 flex items-center gap-1.5">
                                    <Syringe className="w-3 h-3" /> Sağlık durumu
                                </h4>

                                {isVaccineLoading ? (
                                    <div className="h-16 sm:h-20 bg-card-border/40 animate-pulse rounded-xl sm:rounded-2xl" />
                                ) : nextVaccine ? (
                                    <div className="bg-accent/10 border border-accent/20 rounded-[1.2rem] sm:rounded-[1.8rem] p-3 sm:p-5 flex items-center justify-between group">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/15 rounded-xl sm:rounded-2xl flex items-center justify-center border border-accent/20">
                                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                                            </div>
                                            <div>
                                                <h6 className="text-foreground font-black text-sm sm:text-base">{nextVaccine.name}</h6>
                                                <p className="text-accent text-[10px] sm:text-[11px] font-bold mt-0.5">{nextVaccine.date}</p>
                                            </div>
                                        </div>
                                        <div className="bg-accent text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] font-black shadow-md shadow-accent/20">
                                            Hatırlat
                                        </div>
                                    </div>
                                ) : null}
                            </section>

                            {/* 3. QUICK ACTION GRID */}
                            <section className="grid grid-cols-2 gap-3 sm:gap-4">
                                <button
                                    onClick={() => handleOpenModal('vaccine')}
                                    className="bg-card border border-card-border rounded-[1.2rem] sm:rounded-[1.8rem] p-3 sm:p-5 text-left flex flex-col justify-between h-24 sm:h-32 hover:border-accent/30 transition-all group"
                                >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[12px] sm:text-sm font-black text-foreground leading-none whitespace-normal">Aşı karnesi</span>
                                </button>
                                <button
                                    onClick={() => handleOpenModal('appointment')}
                                    className="bg-card border border-card-border rounded-[1.2rem] sm:rounded-[1.8rem] p-3 sm:p-5 text-left flex flex-col justify-between h-24 sm:h-32 hover:border-accent/30 transition-all group"
                                >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[12px] sm:text-sm font-black text-foreground leading-none whitespace-normal">Klinik ara</span>
                                </button>
                            </section>

                            {/* 4. FOOTER: VIEW ALL */}
                            <button
                                onClick={() => { router.push('/vet'); onClose(); }}
                                className="w-full bg-card border border-card-border py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 group hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                            >
                                <span className="text-[11px] sm:text-xs font-black">Tüm detayları gör</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
