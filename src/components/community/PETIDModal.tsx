'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Download, Share2, ShieldCheck, Sparkles, Fingerprint } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface PETIDModalProps {
    pet: { name: string, id: string, avatar: string, breed?: string } | null;
    onClose: () => void;
}

export function PETIDModal({ pet, onClose }: PETIDModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Holographic transform logic
    const rotateX = useTransform(mouseY, [-200, 200], [10, -10]);
    const rotateY = useTransform(mouseX, [-200, 200], [-10, 10]);
    
    // Shimmer/Glow position
    const shimmerX = useTransform(mouseX, [-200, 200], ["0%", "100%"]);
    const shimmerY = useTransform(mouseY, [-200, 200], ["0%", "100%"]);

    const holographicBackground = useTransform(
        [shimmerX, shimmerY],
        ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.15) 0%, transparent 60%), 
                     linear-gradient(${x}, rgba(34,211,238,0.1) 0%, rgba(168,85,247,0.1) 50%, rgba(34,211,238,0.1) 100%)`
    );

    if (!pet) return null;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
                onClick={onClose}
            >
                <div className="perspective-1000">
                    <motion.div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d"
                        }}
                        initial={{ scale: 0.8, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 30, opacity: 0 }}
                        className="w-full max-w-sm bg-[#0A0A0E] rounded-[3.5rem] p-8 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HOLOGRAPHIC FOIL OVERLAY */}
                        <motion.div 
                            style={{ background: holographicBackground }}
                            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        />

                        {/* RAINBOW SHIMMER BORDER */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 via-pink-500 to-cyan-500 opacity-80" />
                        
                        <button onClick={onClose} className="absolute top-8 right-8 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="flex flex-col items-center relative z-10">
                            {/* OFFICIAL BADGE */}
                            <div className="flex items-center gap-2 mb-6 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Official Moffi ID</span>
                            </div>

                            {/* AVATAR BOX */}
                            <div className="relative mb-6">
                                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-2 border-white/20 shadow-2xl relative z-10">
                                    <img src={pet.avatar} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -inset-4 bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
                            </div>

                            <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase">{pet.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pet.breed || 'Moffi Citizen'}</span>
                                <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </div>

                            {/* QR CODE SECTION (PREMIUM GLASS) */}
                            <div className="mt-10 relative p-8 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(255,255,255,0.15)] group/qr">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-[3.2rem] opacity-20 group-hover/qr:opacity-40 transition-opacity blur-lg" />
                                <QRCodeSVG 
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/id/${pet.id}` : `https://moffi.com/id/${pet.id}`} 
                                    size={160} 
                                    level="H"
                                    includeMargin={false}
                                />
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                    <div className="w-1 h-1 bg-gray-200 rounded-full animate-ping" />
                                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.3em]">Scannable Tag</span>
                                </div>
                            </div>

                            {/* ID INFO */}
                            <div className="mt-10 w-full space-y-4">
                                <div className="relative group/id overflow-hidden bg-white/5 border border-white/10 rounded-[2rem] p-4 text-center transition-all hover:bg-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/id:translate-x-full transition-transform duration-1000" />
                                    <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest block mb-1">Registration Number</span>
                                    <span className="text-white font-mono font-black text-sm tracking-[0.3em]">{pet.id.toUpperCase()}</span>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button className="flex-1 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border border-white/5">
                                        <Download className="w-4 h-4" /> Save
                                    </button>
                                    <button className="flex-1 h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-white/10">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>
                            </div>

                            <p className="mt-8 text-[9px] text-gray-500 text-center font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                This ID is a high-security digital asset.<br/>Keep your Moffi tag secure.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
