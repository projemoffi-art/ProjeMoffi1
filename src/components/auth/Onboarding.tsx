"use client";

import { useState } from "react";
import { ChevronRight, Sparkles, Shirt, MessageCircle, Dog, Zap, Globe, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingProps {
    onComplete: () => void;
}

const slides = [
    {
        id: 1,
        title: "Pet Odaklı Gelecek",
        desc: "Evcil dostunuz için tasarlanmış en akıllı dijital ekosisteme hoş geldiniz.",
        icon: Dog,
        color: "from-cyan-500/20 to-blue-500/10",
        accent: "text-cyan-400"
    },
    {
        id: 2,
        title: "Eğlen – Paylaş – Kazan",
        desc: "Moffi Universe içerisinde sosyalleşin ve gerçek ödüller kazanın.",
        icon: Zap,
        color: "from-orange-500/20 to-amber-500/10",
        accent: "text-orange-400"
    },
    {
        id: 3,
        title: "Üst Düzey Güvenlik",
        desc: "Pet ID ve SOS sistemleriyle dostunuz her an Moffi koruması altında.",
        icon: Globe,
        color: "from-purple-500/20 to-indigo-500/10",
        accent: "text-purple-400"
    }
];

export function Onboarding({ onComplete }: OnboardingProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-transparent relative overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                >
                    {/* Immersive Visual Area */}
                    <div className="relative mb-16">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={cn("absolute inset-0 blur-[80px] rounded-full bg-gradient-to-tr", slides[currentSlide].color)} 
                        />
                        <div className="w-48 h-48 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl flex items-center justify-center shadow-2xl relative z-10 overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                           {(() => {
                                const Icon = slides[currentSlide].icon;
                                return <Icon className={cn("w-20 h-20 transition-transform duration-700 group-hover:scale-110", slides[currentSlide].accent)} />;
                            })()}
                        </div>
                    </div>

                    <div className="space-y-6 max-w-[320px]">
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">
                            {slides[currentSlide].title}
                        </h2>

                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-relaxed">
                            {slides[currentSlide].desc}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="p-12 pb-16 relative z-10 bg-gradient-to-t from-[#05050A] via-[#05050A]/80 to-transparent">
                <div className="flex items-center justify-center gap-3 mb-10">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                i === currentSlide ? "w-10 bg-white" : "w-4 bg-white/10"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    className="group relative w-full bg-white text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] overflow-hidden active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {currentSlide === slides.length - 1 ? "Evrene Katıl" : "Sonraki Adım"}
                        <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", slides[currentSlide].accent)} />
                    </span>
                </button>
            </div>
        </div>
    );
}
