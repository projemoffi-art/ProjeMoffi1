'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Sparkles, Heart, 
    ShieldCheck, Zap, Star, 
    PawPrint, Check, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
    onComplete: (data: any) => void;
}

const STEPS = [
    {
        id: 'welcome',
        title: "Hoş Geldin",
        subtitle: "Moffi ile patili dostun için yeni bir dönem başlıyor.",
        image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80"
    },
    {
        id: 'identity',
        title: "Kimlik Oluştur",
        subtitle: "Onun adını dünyaya duyuralım.",
    },
    {
        id: 'photo',
        title: "En Güzel Hali",
        subtitle: "Dostunun bir fotoğrafını ekleyerek profilini canlandır.",
    },
    {
        id: 'aura',
        title: "Ruhunu Keşfet",
        subtitle: "Dostunun karakteri onun aurasıdır.",
    },
    {
        id: 'safety',
        title: "Her Zaman Güvende",
        subtitle: "Akıllı SOS ve Künye sistemiyle o asla yalnız değil.",
    }
];

const AURAS = [
    { id: 'brave', label: 'Cesur', color: 'bg-orange-500', glow: 'shadow-orange-500/50', icon: ShieldCheck },
    { id: 'playful', label: 'Oyuncu', color: 'bg-yellow-400', glow: 'shadow-yellow-400/50', icon: Sparkles },
    { id: 'calm', label: 'Sakin', color: 'bg-cyan-400', glow: 'shadow-cyan-400/50', icon: Heart },
    { id: 'loyal', label: 'Sadık', color: 'bg-purple-500', glow: 'shadow-purple-500/50', icon: Star }
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [petData, setPetData] = useState({
        name: '',
        type: 'dog',
        aura: 'calm',
        image: null as string | null
    });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isLastStep = currentStep === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete(petData);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPetData({ ...petData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
            {/* PROGRESS BAR */}
            <div className="absolute top-12 left-8 right-8 flex gap-1.5 z-50">
                {STEPS.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: i <= currentStep ? '100%' : '0%' }}
                            className="h-full bg-white transition-all duration-500"
                        />
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                    {/* STEP 1: WELCOME */}
                    {currentStep === 0 && (
                        <div className="space-y-12 max-w-md">
                            <div className="relative mx-auto w-64 h-64 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                <img src={STEPS[0].image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none">
                                    MOFFI'YE <br/> <span className="text-cyan-400">HOŞ GELDİN</span>
                                </h1>
                                <p className="text-white/40 text-sm font-medium leading-relaxed px-4">
                                    Patili dostun için tasarlanmış en premium ekosisteme ilk adımını attın.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: IDENTITY */}
                    {currentStep === 1 && (
                        <div className="space-y-10 w-full max-w-md">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mx-auto mb-4">
                                <PawPrint className="w-10 h-10 text-cyan-400" />
                            </div>
                            <div className="space-y-6 text-center">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight">Onun Adı Ne?</h2>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        autoFocus
                                        value={petData.name}
                                        onChange={(e) => setPetData({...petData, name: e.target.value})}
                                        className="w-full bg-white/5 border-b-2 border-white/10 py-6 px-4 text-4xl font-black text-center outline-none focus:border-cyan-400 transition-all placeholder:text-white/5"
                                        placeholder="Dostunun adı..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 pt-4">
                                {['dog', 'cat'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setPetData({...petData, type})}
                                        className={cn(
                                            "px-8 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all",
                                            petData.type === type ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40"
                                        )}
                                    >
                                        {type === 'dog' ? 'KÖPEK' : 'KEDİ'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PHOTO (NEW) */}
                    {currentStep === 2 && (
                        <div className="space-y-10 w-full max-w-md">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Onun En <br/> Güzel Hali</h2>
                                <p className="text-white/40 text-sm font-medium">Profilinde görünecek o meşhur kareyi seç.</p>
                            </div>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative w-64 h-64 mx-auto rounded-[3.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 hover:border-cyan-400/40 group overflow-hidden",
                                    petData.image ? "border-solid border-cyan-400" : ""
                                )}
                            >
                                {petData.image ? (
                                    <>
                                        <img src={petData.image} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Zap className="w-8 h-8 text-white/20 group-hover:text-cyan-400" />
                                        </div>
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Fotoğraf Yükle</span>
                                    </>
                                )}
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <button 
                                onClick={handleNext}
                                className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Şimdilik Atla
                            </button>
                        </div>
                    )}

                    {/* STEP 4: AURA */}
                    {currentStep === 3 && (
                        <div className="space-y-10 w-full max-w-md">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight">Dostunun Ruhu</h2>
                                <p className="text-white/40 text-sm font-medium">Bu seçim onun profil rengini ve aurasını belirleyecek.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {AURAS.map(aura => (
                                    <button
                                        key={aura.id}
                                        onClick={() => setPetData({...petData, aura: aura.id})}
                                        className={cn(
                                            "p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 relative overflow-hidden group",
                                            petData.aura === aura.id ? `bg-white/10 border-white/20 ${aura.glow} shadow-lg` : "bg-white/5 border-white/10"
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", aura.color)}>
                                            <aura.icon className="w-6 h-6 text-black" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">{aura.label}</span>
                                        {petData.aura === aura.id && (
                                            <motion.div layoutId="aura-check" className="absolute top-4 right-4">
                                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-black stroke-[4px]" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: SAFETY */}
                    {currentStep === 4 && (
                        <div className="space-y-10 max-w-md">
                            <div className="relative w-72 h-72 mx-auto">
                                <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full animate-pulse" />
                                <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-8">
                                    <ShieldCheck className="w-20 h-20 text-red-500 mb-6" />
                                    <h3 className="text-xl font-black uppercase italic text-center">GÜVENLİK <br/>AKTİF</h3>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Onu Asla <br/>Yalnız Bırakma</h2>
                                <p className="text-white/40 text-sm font-medium leading-relaxed">
                                    Akıllı SOS ve Moffi Pet-ID sistemiyle dostun her zaman bir tık uzağında.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* FOOTER ACTIONS */}
            <div className="p-12 flex flex-col items-center">
                <button 
                    onClick={handleNext}
                    disabled={currentStep === 1 && !petData.name}
                    className={cn(
                        "w-full max-w-md h-20 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95",
                        isLastStep ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20" : "bg-white text-black",
                        (currentStep === 1 && !petData.name) ? "opacity-50 cursor-not-allowed" : "opacity-100"
                    )}
                >
                    {isLastStep ? "MOFFI'Yİ KEŞFET" : "DEVAM ET"}
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div className="mt-6 flex items-center gap-2 opacity-20">
                    <Zap className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Moffi Premium Experience</span>
                </div>
            </div>
        </div>
    );
}
