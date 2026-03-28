'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Radio, QrCode, Smartphone, 
    ChevronRight, CheckCircle2, ShieldCheck, 
    ArrowRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagPairingModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: { id: string, name: string, avatar: string } | null;
}

export function TagPairingModal({ isOpen, onClose, pet }: TagPairingModalProps) {
    const [step, setStep] = useState(1);
    const [pairingType, setPairingType] = useState<'nfc' | 'qr' | null>(null);
    const [isPairing, setIsPairing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleStartPairing = (type: 'nfc' | 'qr') => {
        setPairingType(type);
        setStep(2);
        
        // Simulate pairing process
        setIsPairing(true);
        setTimeout(() => {
            setIsPairing(false);
            setStep(3);
        }, 3000);
    };

    if (!pet) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-[#12121A] rounded-[3rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* DECORATIVE BACKGROUND */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />

                        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* STEP 1: CHOOSE METHOD */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-6 mx-auto border border-white/10">
                                        <Smartphone className="w-10 h-10 text-cyan-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-2">Künye Eşleştir</h2>
                                    <p className="text-gray-500 text-sm mb-8">
                                        Fiziksel Moffi künyeni <span className="text-white font-bold">{pet.name}</span> ile eşleştirerek onu her zaman güvende tut.
                                    </p>

                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleStartPairing('nfc')}
                                            className="w-full p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all flex items-center gap-4 group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                                <Radio className="w-6 h-6" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <h4 className="font-bold text-white">NFC ile Eşleştir</h4>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Dokun ve Tanımla</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-700" />
                                        </button>

                                        <button 
                                            onClick={() => handleStartPairing('qr')}
                                            className="w-full p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all flex items-center gap-4 group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                                <QrCode className="w-6 h-6" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <h4 className="font-bold text-white">QR Kod ile Eşleştir</h4>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kamera ile Tara</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-700" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: PAIRING ANIMATION */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full border-4 border-cyan-500/20 flex items-center justify-center">
                                            <div className="w-24 h-24 rounded-full border-4 border-cyan-500/40 border-t-cyan-500 animate-spin" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {pairingType === 'nfc' ? <Smartphone className="w-10 h-10 text-cyan-400" /> : <QrCode className="w-10 h-10 text-purple-400" />}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mt-8 mb-2">
                                        {pairingType === 'nfc' ? 'Künyeyi Yaklaştır' : 'Kodu Okut'}
                                    </h3>
                                    <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                                        {pairingType === 'nfc' 
                                            ? 'Telefonunuzun arkasını künyeye yavaşça dokundurun.' 
                                            : 'Kameranızı künyedeki QR koda odaklayın.'}
                                    </p>
                                </motion.div>
                            )}

                            {/* STEP 3: SUCCESS */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-8 mx-auto relative">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        >
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        </motion.div>
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                                    </div>
                                    
                                    <h2 className="text-2xl font-black text-white mb-2">Başarıyla Eşleşti!</h2>
                                    <p className="text-gray-500 text-sm mb-8 px-4">
                                        Artık <span className="text-white font-bold">{pet.name}</span> dijital dünyada tamamen güvende. Künye her tarandığında anlık bildirim alacaksınız.
                                    </p>

                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-8 flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                            <img src={pet.avatar} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Aktif Koruma</span>
                                            </div>
                                            <h4 className="font-bold text-white text-sm">Moffi Hybrid Tag v1.2</h4>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={onClose}
                                        className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Mükemmel <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
