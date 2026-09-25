"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Star, ChevronRight, ShieldCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { VetClinic } from "@/types/domain";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

// Faz 25 — Ekran 2 (bkz. design-reference/vet-final/README.md). Baran'ın
// "şu anki UI oldukça kaba ve işlevsiz" bulgusu bu bileşenle ilgiliydi —
// ama veri katmanı (VetClinic[], useVet() üzerinden gerçek profiles/business
// sorgusu) tamamen gerçekti, SADECE görsel dil kaba/tutarsızdı (mor #5B4D9D,
// agresif büyük harf/italik). Bu turda SADECE görsel yeniden inşa edildi —
// prop arayüzü (isOpen/onClose/clinics/onSelectClinic/isLoading) AYNEN
// korunuyor, hiçbir çağıran nokta (vet/page.tsx, community/page.tsx,
// OverlaySystem.tsx) değişmedi.

interface ClinicListModalProps {
    isOpen: boolean;
    onClose: () => void;
    clinics: VetClinic[];
    onSelectClinic: (clinic: VetClinic) => void;
    isLoading?: boolean;
}

export function ClinicListModal({ isOpen, onClose, clinics, onSelectClinic, isLoading }: ClinicListModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredClinics = useMemo(() => {
        return clinics.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [clinics, searchQuery]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-card-border relative"
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full sm:hidden z-50" />

                <div className="px-6 pt-8 sm:pt-6 pb-4 bg-card sticky top-0 z-30 border-b border-card-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground font-sans">Veteriner</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                            <X className="w-4.5 h-4.5 text-foreground" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 h-11">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Veteriner, klinik veya hizmet ara..."
                            className="flex-1 bg-transparent text-[12px] font-bold text-foreground placeholder:text-slate-400 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isLoading ? (
                        <div className="space-y-2.5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredClinics.length > 0 ? (
                        <div className="space-y-2.5">
                            {filteredClinics.map((clinic, index) => (
                                <motion.button
                                    key={clinic.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.04 }}
                                    onClick={() => { haptics.tap(); onSelectClinic(clinic); }}
                                    className="w-full bg-card rounded-2xl p-3 flex items-center gap-3 border border-card-border shadow-moffi-card cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5">
                                        {clinic.imageUrl ? (
                                            <img src={clinic.imageUrl} className="w-full h-full object-cover" alt={clinic.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-xl font-black text-slate-400">{(clinic.name || 'K')[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[13px] font-black text-foreground truncate">{clinic.name}</span>
                                            {clinic.isPremium && <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-[11px] font-bold text-foreground">{clinic.rating || '—'}</span>
                                            <span className="text-[11px] font-bold text-slate-400">({clinic.reviewCount || 0})</span>
                                            {clinic.distance && (
                                                <>
                                                    <span className="text-slate-300 mx-0.5">·</span>
                                                    <span className="text-[11px] font-bold text-slate-400 truncate">{clinic.distance}</span>
                                                </>
                                            )}
                                        </div>
                                        {clinic.address && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                                                <span className="text-[10.5px] font-bold text-slate-400 truncate">{clinic.address}</span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Aradığınız kriterlere uygun<br />klinik bulunamadı.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
