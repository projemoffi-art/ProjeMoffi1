'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Camera, MapPin, Activity, History, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';

export function MoffiUltimateHub({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { activePet, pets } = usePet();
    const petToUse = activePet || pets?.[0];

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognitionActive, setRecognitionActive] = useState(false);
    
    // Simulate finding nearby pets
    const [nearbyPets, setNearbyPets] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate some random nearby pets for the radar
            setNearbyPets([
                { id: 1, x: '20%', y: '30%', name: 'Leo', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=150&h=150&fit=crop' },
                { id: 2, x: '80%', y: '40%', name: 'Pamuk', img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=150&h=150&fit=crop' },
                { id: 3, x: '60%', y: '80%', name: 'Max', img: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=150&h=150&fit=crop' }
            ]);
        } else {
            setNearbyPets([]);
            setTranscript('');
            setIsListening(false);
        }
    }, [isOpen]);

    // Simple Speech Recognition Setup (Fallback for unsupported browsers)
    const handleStartListening = () => {
        setIsListening(true);
        setTranscript('Seni dinliyorum...');
        
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'tr-TR';
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event: any) => {
                    const speechResult = event.results[0][0].transcript;
                    setTranscript(speechResult);
                };

                recognition.onspeechend = () => {
                    recognition.stop();
                    setIsListening(false);
                };

                recognition.onerror = () => {
                    setIsListening(false);
                    setTranscript('Sesi anlayamadım. Tekrar dener misin?');
                };

                recognition.start();
            } else {
                setTimeout(() => {
                    setTranscript('Ses algılama tarayıcında desteklenmiyor, ama kalbimiz bir!');
                    setIsListening(false);
                }, 2000);
            }
        } catch (e) {
            setIsListening(false);
        }
    };

    const handleStopListening = () => {
        setIsListening(false);
    };

    // Camera Input for Capsule
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [capsulePhoto, setCapsulePhoto] = useState<string | null>(null);

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCapsulePhoto(url);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-xl flex flex-col overflow-hidden"
                >
                    {/* Header Controls */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50">
                        <div className="flex flex-col">
                            <h2 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cyan-400" /> Moffi Core
                            </h2>
                            <p className="text-cyan-400/80 text-xs font-medium tracking-widest uppercase mt-0.5">Quantum Hub</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                        
                        {/* THE RADAR SYSTEM */}
                        <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                            
                            {/* Radar Circles */}
                            <div className="absolute inset-0 border border-cyan-500/20 rounded-full"></div>
                            <div className="absolute inset-4 border border-cyan-500/10 rounded-full"></div>
                            <div className="absolute inset-12 border border-cyan-500/10 rounded-full"></div>
                            <div className="absolute inset-20 border border-cyan-500/20 rounded-full"></div>
                            <div className="absolute inset-28 border border-cyan-500/30 rounded-full border-dashed"></div>

                            {/* Sweeping Radar Line */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                className="absolute w-[50%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-400 origin-right left-0 top-1/2 rounded-full"
                                style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.4)' }}
                            />
                            {/* Radar Scan Gradient */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                className="absolute w-[50%] h-[50%] bg-gradient-to-tr from-cyan-500/20 to-transparent origin-bottom-right left-0 top-0 rounded-tl-full"
                            />

                            {/* Nearby Pets Blips */}
                            <AnimatePresence>
                                {nearbyPets.map((pet) => (
                                    <motion.div
                                        key={pet.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ duration: 0.5, delay: Math.random() * 2 }}
                                        className="absolute w-10 h-10 -ml-5 -mt-5"
                                        style={{ left: pet.x, top: pet.y }}
                                    >
                                        <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-30"></div>
                                        <img src={pet.img} className="w-10 h-10 rounded-full border-2 border-cyan-400 object-cover relative z-10" />
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">{pet.name}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* CENTER CORE: VOICE ASSISTANT */}
                            <motion.button
                                onPointerDown={handleStartListening}
                                onPointerUp={handleStopListening}
                                onPointerLeave={handleStopListening}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "relative z-20 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(34,211,238,0.3)]",
                                    isListening ? "bg-gradient-to-tr from-rose-500 to-purple-600 shadow-[0_0_60px_rgba(225,29,72,0.6)]" : "bg-gradient-to-tr from-cyan-500 to-blue-600"
                                )}
                            >
                                {/* Listening ripples */}
                                {isListening && (
                                    <>
                                        <div className="absolute inset-0 border-2 border-rose-400 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                        <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                    </>
                                )}
                                <Mic className={cn("w-10 h-10 transition-colors", isListening ? "text-white" : "text-white/90")} />
                                
                                {!isListening && (
                                    <div className="absolute -bottom-8 w-[200px] text-center text-cyan-200/80 text-[10px] uppercase tracking-widest font-bold">
                                        Konuşmak için basılı tut
                                    </div>
                                )}
                            </motion.button>
                        </div>

                        {/* Transcript Area */}
                        <div className="h-16 mt-12 flex items-center justify-center w-full max-w-xs px-4 text-center">
                            <AnimatePresence mode="wait">
                                {transcript && (
                                    <motion.p
                                        key={transcript}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-white font-medium text-lg leading-tight"
                                    >
                                        "{transcript}"
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>

                    {/* TOP/BOTTOM DAILY CAPSULE */}
                    <div className="absolute bottom-8 inset-x-0 px-6 z-50">
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handlePhotoCapture}
                        />
                        
                        {!capsulePhoto ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex items-center justify-between group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-3xl blur opacity-20 group-hover:opacity-40 animate-pulse transition-all"></div>
                                
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <h4 className="text-white font-bold text-lg">Günün Anısı</h4>
                                        <p className="text-white/70 text-xs">{petToUse?.name || 'Dostunun'} bugünkü kapsülü eksik!</p>
                                    </div>
                                </div>
                                <div className="relative z-10 bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-black">
                                    ÇEK
                                </div>
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full bg-white/10 backdrop-blur-md border border-emerald-500/50 rounded-3xl p-4 flex items-center gap-4"
                            >
                                <img src={capsulePhoto} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500" />
                                <div className="flex flex-col">
                                    <h4 className="text-emerald-400 font-bold text-base">Kapsül Mühürlendi!</h4>
                                    <p className="text-white/70 text-[11px]">2026 Anı Defterine eklendi 📸</p>
                                </div>
                                <button 
                                    onClick={() => setCapsulePhoto(null)}
                                    className="ml-auto w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white/50 hover:text-white"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
