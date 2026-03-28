"use client";

import { useState, useEffect } from "react";
import {
    X, HeartPulse, CheckCircle2, AlertTriangle,
    Smile, Play, Pause, RotateCcw, ChevronRight,
    Search, Award, Sparkles, BookOpen, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DentalCareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QUESTIONS = [
    {
        id: 1,
        question: "Nefesi nasıl kokuyor?",
        options: [
            { label: "Mis gibi / Nötr", score: 0, icon: "🍃" },
            { label: "Biraz ağır", score: 1, icon: "😐" },
            { label: "Dayanılmaz kötü", score: 3, icon: "🤢" }
        ]
    },
    {
        id: 2,
        question: "Dişlerinde renk değişimi var mı?",
        options: [
            { label: "Bembeyaz", score: 0, icon: "✨" },
            { label: "Diplerde hafif sarılık", score: 1, icon: "🟡" },
            { label: "Kahverengi tortular/taşlar", score: 3, icon: "🟤" }
        ]
    },
    {
        id: 3,
        question: "Diş etleri ne durumda?",
        options: [
            { label: "Pembe ve sağlıklı", score: 0, icon: "💗" },
            { label: "Kızarık veya şiş", score: 3, icon: "🔴" },
            { label: "Kanama oluyor", score: 3, icon: "🩸" }
        ]
    }
];

export function DentalCareModal({ isOpen, onClose }: DentalCareModalProps) {
    const [activeTab, setActiveTab] = useState<'checkup' | 'timer' | 'guide'>('checkup');
    const [currentStep, setCurrentStep] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const handleAnswer = (score: number) => {
        setTotalScore(prev => prev + score);
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowResult(true);
        }
    };

    const resetCheckup = () => {
        setCurrentStep(0);
        setTotalScore(0);
        setShowResult(false);
    };

    const getResultFeedback = () => {
        if (totalScore === 0) return { title: "Mükemmel Gülüş! 🦷✨", desc: "Mochi'nin diş sağlığı harika görünüyor. Rutin bakıma devam!", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
        if (totalScore <= 3) return { title: "Dikkatli Olalım 🤔", desc: "Ufak belirtiler var. Fırçalama sıklığını artırmalı ve takip etmelisin.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
        return { title: "Veteriner Kontrolü Şart 🚨", desc: "Diş taşı veya diş eti hastalığı riski yüksek. Lütfen randevu al.", color: "text-[#FF3B30]", bg: "bg-[#FF3B30]/10", border: "border-red-500/20" };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-2xl">
                                <Smile className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Ağız Sağlığı</h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2">DENTAL CARE 2.0</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* TABS - Apple Glass style */}
                    <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-[1.8rem]">
                        <button
                            onClick={() => setActiveTab('checkup')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                activeTab === 'checkup' ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <Search className="w-3.5 h-3.5" /> KONTROL
                        </button>
                        <button
                            onClick={() => setActiveTab('timer')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                activeTab === 'timer' ? "bg-emerald-500 text-white shadow-2xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <HeartPulse className="w-3.5 h-3.5" /> FIRÇALA
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                activeTab === 'guide' ? "bg-blue-500 text-white shadow-2xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" /> REHBER
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">

                    {/* 1. SMART CHECKUP */}
                    {activeTab === 'checkup' && (
                        <div className="h-full flex flex-col">
                            {!showResult ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex-1 flex flex-col justify-center py-6"
                                    >
                                        <div className="text-center mb-10">
                                            <div className="inline-block bg-white/5 text-white/40 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-white/5">
                                                SORU {currentStep + 1} / {QUESTIONS.length}
                                            </div>
                                            <h3 className="text-3xl font-black text-white leading-tight tracking-tighter uppercase italic">
                                                {QUESTIONS[currentStep].question}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            {QUESTIONS[currentStep].options.map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAnswer(opt.score)}
                                                    className="w-full bg-[#1C1C1E] p-6 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 group transition-all shadow-xl flex items-center gap-5 text-left active:scale-[0.98]"
                                                >
                                                    <span className="text-4xl group-hover:scale-125 transition-transform">{opt.icon}</span>
                                                    <span className="font-black text-white/70 uppercase tracking-tight text-lg">{opt.label}</span>
                                                    <ChevronRight className="ml-auto w-6 h-6 text-white/10 group-hover:text-emerald-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pt-8">
                                    <div className={cn("w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl", getResultFeedback().bg)}>
                                        {totalScore === 0 ? <Sparkles className={cn("w-12 h-12", getResultFeedback().color)} /> : <AlertTriangle className={cn("w-12 h-12", getResultFeedback().color)} />}
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">{getResultFeedback().title}</h3>
                                    <p className="text-white/40 font-bold mb-10 max-w-[90%] mx-auto leading-relaxed uppercase tracking-tight text-sm">{getResultFeedback().desc}</p>

                                    <div className="flex flex-col gap-4">
                                        {totalScore > 3 && (
                                            <button className="w-full h-16 rounded-[2rem] bg-[#FF3B30] text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all text-xs">
                                                VETERİNER RANDEVUSU AL
                                            </button>
                                        )}
                                        <button onClick={resetCheckup} className="w-full h-16 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-xs">
                                            TEKRAR KONTROL ET
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* 2. BRUSH TIMER */}
                    {activeTab === 'timer' && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-12 text-center">
                            <div className="relative mb-12">
                                {/* Progress Ring with subtle glow */}
                                <svg className="w-72 h-72 transform -rotate-90 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                    <circle
                                        cx="144" cy="144" r="130"
                                        stroke="currentColor" strokeWidth="10" fill="transparent"
                                        strokeDasharray={2 * Math.PI * 130}
                                        strokeDashoffset={2 * Math.PI * 130 * (1 - timeLeft / 120)}
                                        className="text-emerald-500 transition-all duration-1000 ease-linear"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-7xl font-black text-white tracking-tighter italic leading-none">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <div className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mt-4 animate-pulse">
                                        {isTimerRunning ? "FIRÇALAMAYA DEVAM! 🦷" : "SÜRE DOLDU!"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className={cn(
                                        "w-24 h-24 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-90 border-4 border-white/5",
                                        isTimerRunning ? "bg-[#FF9500] text-white" : "bg-emerald-500 text-white"
                                    )}
                                >
                                    {isTimerRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                                </button>
                                <button
                                    onClick={() => { setIsTimerRunning(false); setTimeLeft(120); }}
                                    className="w-16 h-16 rounded-full bg-white/5 text-white/30 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-90 border border-white/10"
                                >
                                    <RotateCcw className="w-7 h-7" />
                                </button>
                            </div>

                            <p className="mt-12 text-[10px] text-white/20 font-black uppercase tracking-[0.2em] max-w-[80%] leading-relaxed">
                                GÜNLÜK 2 DAKİKA FIRÇALAMA PLAK OLUŞUMUNU <span className="text-emerald-500/50">%80</span> AZALTIR.
                            </p>
                        </div>
                    )}

                    {/* 3. GUIDE */}
                    {activeTab === 'guide' && (
                        <div className="space-y-6">
                            <div className="bg-[#1C1C1E] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase mb-6 z-10 relative">Fırçalama Tekniği 101</h3>
                                <div className="space-y-5 relative z-10">
                                    {[
                                        "Dudakları nazikçe yukarı kaldırın.",
                                        "Fırçayı 45 derece açıyla tutun.",
                                        "Dairesel hareketlerle yüzeyleri fırçalayın."
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-emerald-500/20">{i + 1}</span>
                                            <p className="text-sm font-bold text-white/60 uppercase tracking-tight">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#FF3B30]/5 border border-red-500/10 p-6 rounded-[2.5rem] flex gap-5 items-center">
                                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-[#FF3B30] shrink-0 border border-red-500/10">
                                    <AlertTriangle className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-black text-[#FF3B30] text-[10px] uppercase tracking-widest block mb-1 italic">ASLA İNSAN MACUNU KULLANMA!</span>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-tight leading-relaxed">Florür köpekler için zehirlidir. Sadece evcil hayvan macunu kullan.</p>
                                </div>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2.5rem] flex gap-5 items-center">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/10">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-black text-blue-400 text-[10px] uppercase tracking-widest block mb-1 italic">MOFFİ ÖNERİYOR</span>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-tight leading-relaxed">Enzimli diş macunları mekanik fırçalama olmadan da temizlik sağlar.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </motion.div>
        </motion.div>
    );
}
