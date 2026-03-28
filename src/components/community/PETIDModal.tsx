'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PETIDModalProps {
    pet: { name: string, id: string, avatar: string } | null;
    onClose: () => void;
}

export function PETIDModal({ pet, onClose }: PETIDModalProps) {
    if (!pet) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 30 }}
                    className="w-full max-w-sm bg-gradient-to-b from-[#1C1C1E] to-[#0A0A0E] rounded-[3rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />
                    
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-cyan-400/50 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                            <img src={pet.avatar} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-2xl font-black text-white">{pet.name}</h3>
                        <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Dijital Moffi Kimliği</p>

                        <div className="mt-8 relative p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] group">
                            <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-[2.5rem] animate-pulse" />
                            <QRCodeSVG 
                                value={typeof window !== 'undefined' ? `${window.location.origin}/id/${pet.id}` : `https://moffi.com/id/${pet.id}`} 
                                size={180} 
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        <div className="mt-8 w-full space-y-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Kimlik Numarası</span>
                                <span className="text-white font-mono font-bold tracking-[0.2em]">{pet.id}</span>
                            </div>
                            
                            <div className="flex gap-3">
                                <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-95">
                                    <Download className="w-4 h-4" /> İndir
                                </button>
                                <button className="flex-1 py-4 bg-cyan-500 rounded-2xl flex items-center justify-center gap-2 text-black font-black text-sm transition-all active:scale-95 shadow-lg shadow-cyan-500/20">
                                    <Share2 className="w-4 h-4" /> Paylaş
                                </button>
                            </div>
                        </div>

                        <p className="mt-6 text-[10px] text-gray-500 text-center font-medium leading-relaxed px-4">
                            Bu QR kodu petinizin tasmasına ekleyerek kaybolduğunda güvende kalmasını sağlayabilirsiniz.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
