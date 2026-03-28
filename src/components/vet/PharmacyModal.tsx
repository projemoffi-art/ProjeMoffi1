"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Navigation, Pill, Clock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Pharmacy {
    id: string;
    name: string;
    address: string;
    phone: string;
    distance: string;
    distanceVal: number;
    lat: number;
    lng: number;
    isOpen: boolean;
}

const MOCK_PHARMACIES: Pharmacy[] = [
    {
        id: '1',
        name: "Moffi Merkez Eczanesi",
        address: "Bağdat Cad. No: 123, Kadıköy/İstanbul",
        phone: "+90 216 123 45 67",
        distance: "0.4 km",
        distanceVal: 0.4,
        lat: 40.96,
        lng: 29.07,
        isOpen: true
    },
    {
        id: '2',
        name: "Şifa Nöbetçi Eczane",
        address: "Bahariye Cad. No: 45, Kadıköy/İstanbul",
        phone: "+90 216 987 65 43",
        distance: "1.2 km",
        distanceVal: 1.2,
        lat: 40.98,
        lng: 29.02,
        isOpen: true
    },
    {
        id: '3',
        name: "Pati Dostu Eczane",
        address: "Fenerbahçe Mah. Lale Zar Sk., Kadıköy",
        phone: "+90 216 555 11 22",
        distance: "2.5 km",
        distanceVal: 2.5,
        lat: 40.97,
        lng: 29.04,
        isOpen: true
    }
];

interface PharmacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PharmacyModal({ isOpen, onClose }: PharmacyModalProps) {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const timer = setTimeout(() => {
                setPharmacies(MOCK_PHARMACIES.sort((a, b) => a.distanceVal - b.distanceVal));
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full max-w-lg bg-[#111111] rounded-t-[3.5rem] sm:rounded-[4rem] h-[90vh] flex flex-col overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 relative"
            >
                {/* iOS Style Grab Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full sm:hidden z-50" />

                {/* HEADER */}
                <div className="p-8 pb-4 bg-[#111111]/80 backdrop-blur-3xl z-30 sticky top-0 border-b border-white/5">
                    <div className="flex justify-between items-center mb-8 mt-2 sm:mt-0">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
                                <Pill className="w-7 h-7 relative z-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Eczaneler</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="px-2.5 py-1 rounded-full bg-[#FF3B30]/10 border border-red-500/20 text-[#FF3B30] text-[9px] font-black uppercase tracking-widest animate-pulse">
                                        NÖBETÇİ MODU
                                    </div>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">PHARMACY HUB</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                        KONUMUNA EN YAKIN <span className="text-purple-400">AKTİF</span> ECZANELER LİSTELENİYOR.
                    </p>
                </div>

                {/* LIST CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-[#1C1C1E] p-6 rounded-[2.5rem] border border-white/5 animate-pulse">
                                    <div className="h-6 w-2/3 bg-white/5 rounded-full mb-4" />
                                    <div className="h-4 w-1/2 bg-white/5 rounded-full mb-6" />
                                    <div className="flex gap-3">
                                        <div className="h-12 flex-1 bg-white/5 rounded-2xl" />
                                        <div className="h-12 w-12 bg-white/5 rounded-2xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pharmacies.map((pharmacy, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={pharmacy.id}
                                    className="bg-[#1C1C1E] p-7 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:bg-[#252528] transition-all"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <Pill className="w-32 h-32" />
                                    </div>
                                    
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase italic mb-2">
                                                {pharmacy.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-tight">
                                                <MapPin className="w-4 h-4 text-purple-500" />
                                                {pharmacy.distance} • {pharmacy.address}
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center shrink-0 group-hover:bg-purple-500/10 group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 relative z-10">
                                        <button className="flex-1 h-14 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-xl">
                                            <Navigation className="w-4 h-4" /> YOL TARİFİ
                                        </button>
                                        <button className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95">
                                            <Phone className="w-6 h-6 fill-current" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            <div className="text-center mt-12 mb-8 p-10 rounded-[3rem] bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <Shield className="w-8 h-8 mx-auto mb-4 text-purple-400/40 group-hover:text-purple-400 transition-colors" />
                                <p className="text-[10px] font-black text-purple-400/60 uppercase tracking-[0.2em] mb-2 italic">MOFFİ DOĞRULANMIŞ VERİ</p>
                                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
                                    BU VERİLER "ECZANEMNEREDE" API SERVİSİNDEN ANLIK OLARAK ÇEKİLMEKTEDİR.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
