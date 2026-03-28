"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Star, ChevronRight, Phone, ShieldCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { VetClinic } from "@/types/domain";
import { cn } from "@/lib/utils";

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
            className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full max-w-xl bg-[#111111] rounded-t-[3.5rem] sm:rounded-[4rem] h-[90vh] flex flex-col overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 relative"
            >
                {/* iOS Style Grab Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full sm:hidden z-50" />

                {/* HEADER */}
                <div className="p-8 pb-4 bg-[#111111]/80 backdrop-blur-3xl z-30 sticky top-0 border-b border-white/5">
                    <div className="flex justify-between items-center mb-8 mt-2 sm:mt-0">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#5B4D9D]/10 border border-[#5B4D9D]/20 text-[#5B4D9D] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[#5B4D9D]/5 animate-pulse" />
                                <ShieldCheck className="w-7 h-7 relative z-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Klinik Seçin</h2>
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">{clinics.length} KAYITLI NOKTA</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* SEARCH BOX */}
                    <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-[#5B4D9D]/10 rounded-3xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#5B4D9D] transition-colors" />
                        <input
                            type="text"
                            placeholder="Klinik ismi veya uzmanlık yazın..."
                            className="w-full h-16 pl-14 pr-6 bg-white/5 rounded-3xl border border-white/10 outline-none font-bold text-sm text-white placeholder:text-white/20 focus:border-[#5B4D9D]/50 focus:bg-white/[0.08] transition-all relative z-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-[#1C1C1E] h-32 rounded-[2.5rem] border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredClinics.length > 0 ? (
                                filteredClinics.map((clinic, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={clinic.id}
                                        onClick={() => onSelectClinic(clinic)}
                                        className={cn(
                                            "bg-[#1C1C1E] p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] cursor-pointer group hover:bg-[#252528] relative overflow-hidden",
                                            clinic.isPremium ? "border-yellow-500/20 shadow-[0_15px_40px_rgba(234,179,8,0.05)]" : "border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                                <img src={clinic.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black text-white tracking-tight uppercase italic truncate">{clinic.name}</h3>
                                                    {clinic.isPremium && <ShieldCheck className="w-4 h-4 text-yellow-500 shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-tight">
                                                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> {clinic.rating}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-orange-500" /> {clinic.address}</span>
                                                </div>
                                                <div className="flex gap-1.5 mt-3">
                                                    {clinic.features.slice(0, 2).map(f => (
                                                        <span key={f} className="text-[8px] font-black bg-white/5 text-white/20 px-2 py-1 rounded-md border border-white/5 uppercase tracking-tighter">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-[#5B4D9D] group-hover:text-white group-hover:border-[#5B4D9D] transition-all">
                                                <ChevronRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20 px-10">
                                    <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest leading-relaxed">Aradığınız kriterlere uygun<br/>klinik bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-[#111111]/80 backdrop-blur-3xl border-t border-white/5">
                    <button 
                        onClick={onClose}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl text-white/40 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all uppercase"
                    >
                        Pencereyi Kapat
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
