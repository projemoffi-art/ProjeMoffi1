"use client";

import { useState, useEffect } from "react";
import { X, Lock, Radio, Bell, ShieldAlert, ChevronRight, Activity, Globe, MapPin, CheckCircle2, Siren } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuardianModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate: () => void;
}

export function GuardianModal({ isOpen, onClose, onActivate }: GuardianModalProps) {
    const [step, setStep] = useState<'idle' | 'activating' | 'active'>('idle');
    const [progress, setProgress] = useState(0);
    const [sliderValue, setSliderValue] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setStep('idle');
            setSliderValue(0);
            setLogs([]);
            setProgress(0);
        }
    }, [isOpen]);

    // Activation Sequence
    useEffect(() => {
        if (step === 'activating') {
            const sequence = async () => {
                // Step 1: Secure Connection
                await new Promise(r => setTimeout(r, 800));
                setLogs(prev => [...prev, "Tasma bağlantısı güvenli moda alındı."]);
                setProgress(25);

                // Step 2: Protocol Handshake
                await new Promise(r => setTimeout(r, 1000));
                setLogs(prev => [...prev, "Guardian Protokolü başlatılıyor..."]);
                setProgress(50);

                // Step 3: Broadcast
                await new Promise(r => setTimeout(r, 1200));
                setLogs(prev => [...prev, "15km çapındaki 124 kullanıcıya SOS sinyali gönderildi."]);
                setProgress(85);

                // Step 4: Finish
                await new Promise(r => setTimeout(r, 1000));
                setLogs(prev => [...prev, "Guardian Aktif. Takip başlatıldı."]);
                setProgress(100);
                setStep('active');
            };
            sequence();
        }
    }, [step]);


    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setSliderValue(val);
        if (val >= 95) {
            setStep('activating');
            setSliderValue(100);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">

            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px] animate-pulse" />
                {step !== 'idle' && (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 animate-ping-slow" />
                )}
            </div>

            <div className="w-full max-w-md p-6 relative z-10 text-center">

                {/* HEADERS */}
                <div className="mb-10">
                    <div className={cn("mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(220,38,38,0.5)] border-4 transition-all duration-500",
                        step === 'idle' ? "bg-gray-900 border-gray-700" : "bg-red-600 border-red-500 animate-pulse"
                    )}>
                        <ShieldAlert className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">GUARDIAN PROTOKOLÜ</h2>
                    <p className="text-gray-400 text-sm font-medium">Acil Durum Müdahale Sistemi</p>
                </div>

                {/* --- STATE: IDLE --- */}
                {step === 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="bg-white/5 border border-card-border rounded-2xl p-6 text-left mb-8">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-red-500" /> Sistem Durumu
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Tasma Bataryası</span>
                                    <span className="text-white font-mono font-bold">88%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">GPS Sinyali</span>
                                    <span className="text-green-500 font-bold">Güçlü</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Aktif Kullanıcılar (15km)</span>
                                    <span className="text-white font-mono font-bold">124</span>
                                </div>
                            </div>
                        </div>

                        {/* SLIDER */}
                        <div className="relative w-full h-16 bg-gray-800 rounded-full overflow-hidden border border-gray-700 select-none touch-none">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-xs pointer-events-none uppercase tracking-widest animate-pulse">
                                Aktifleştirmek için kaydır
                            </div>
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-red-600 transition-all duration-75"
                                style={{ width: `${sliderValue}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderValue}
                                onChange={handleSliderChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                            />
                            <div
                                className="absolute top-1 bottom-1 w-14 bg-card rounded-full shadow-lg flex items-center justify-center transition-all duration-75 pointer-events-none z-10"
                                style={{ left: `calc(${sliderValue}% - ${sliderValue > 10 ? '56px' : '0px'})` }} // Simple clamping logic
                            >
                                <ChevronRight className="w-6 h-6 text-red-600" />
                            </div>
                        </div>

                        <button onClick={onClose} className="mt-8 text-gray-500 text-xs font-bold hover:text-white transition-colors">
                            İptal Et
                        </button>
                    </motion.div>
                )}


                {/* --- STATE: ACTIVATING --- */}
                {step === 'activating' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left w-full max-w-sm mx-auto">
                        <div className="space-y-6">
                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-red-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* LOGS */}
                            <div className="space-y-3 font-mono text-xs">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 text-red-200"
                                    >
                                        <CheckCircle2 className="w-3 h-3 text-red-500 shrink-0" />
                                        {log}
                                    </motion.div>
                                ))}
                                <div className="h-4 w-2 bg-red-500 animate-pulse inline-block" />
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* --- STATE: ACTIVE --- */}
                {step === 'active' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="bg-red-500/10 border border-red-500/50 rounded-3xl p-8 mb-8">
                            <h3 className="text-2xl font-black text-white mb-2">PROTOKOL AKTİF</h3>
                            <p className="text-red-200 text-sm mb-6">Moffi Ağı Mochi&apos;yi arıyor.</p>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Radio className="w-4 h-4 text-red-400" />
                                    <span className="text-[10px] font-bold text-gray-400">SİNYAL</span>
                                    <span className="text-xs font-bold text-white">YÜKSEK</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Globe className="w-4 h-4 text-red-400" />
                                    <span className="text-[10px] font-bold text-gray-400">AĞ</span>
                                    <span className="text-xs font-bold text-white">GENİŞ</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center gap-1">
                                    <Siren className="w-4 h-4 text-red-400" />
                                    <span className="text-[10px] font-bold text-gray-400">DURUM</span>
                                    <span className="text-xs font-bold text-white animate-pulse">ACİL</span>
                                </div>
                            </div>

                            <button
                                onClick={onActivate}
                                className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black text-sm shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-4 h-4" /> HARİTAYA GİT
                            </button>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
