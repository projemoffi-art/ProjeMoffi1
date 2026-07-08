'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Camera, MapPin, Activity, History, Sparkles, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';
import { useRouter } from 'next/navigation';

export function MoffiUltimateHub({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const router = useRouter();
    const { activePet, pets } = usePet();
    const petToUse = activePet || pets?.[0];

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [actionFeedback, setActionFeedback] = useState<{text: string, icon: any} | null>(null);
    
    // Simulate finding nearby pets
    const [nearbyPets, setNearbyPets] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate some random nearby pets for the radar
            setNearbyPets([
                { id: 1, x: '20%', y: '30%', name: 'Leo', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=150&h=150&fit=crop', profileId: 'leo' },
                { id: 2, x: '80%', y: '40%', name: 'Pamuk', img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=150&h=150&fit=crop', profileId: 'pamuk' },
                { id: 3, x: '60%', y: '80%', name: 'Max', img: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=150&h=150&fit=crop', profileId: 'max' }
            ]);
        } else {
            setNearbyPets([]);
            setTranscript('');
            setIsListening(false);
            setActionFeedback(null);
        }
    }, [isOpen]);

    // Simple Speech Recognition Setup (Fallback for unsupported browsers)
    const handleStartListening = () => {
        setIsListening(true);
        setTranscript('Seni dinliyorum...');
        setActionFeedback(null);
        
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'tr-TR';
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event: any) => {
                    const speechResult = event.results[0][0].transcript.toLowerCase();
                    setTranscript(`"${speechResult}"`);
                    
                    // LOCAL INTENT PARSER (Zero-Cost Logic)
                    if (speechResult.includes('su') || speechResult.includes('içti')) {
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
                            setActionFeedback({ text: '100ml Su Eklendi!', icon: Activity });
                        }, 1000);
                    } else if (speechResult.includes('mama') || speechResult.includes('yedi') || speechResult.includes('besle')) {
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
                            setActionFeedback({ text: '1 Öğün Eklendi!', icon: Activity });
                        }, 1000);
                    } else if (speechResult.includes('yürü') || speechResult.includes('park') || speechResult.includes('dışarı')) {
                        setTimeout(() => {
                            router.push('/walk');
                            onClose();
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            setActionFeedback({ text: 'Anlaşılamadı, tekrar dener misin?', icon: X });
                        }, 1500);
                    }
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
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50">
                        <div className="flex flex-col relative">
                            <h2 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cyan-400" /> 
                                Moffi Core
                                <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded ml-1 border border-cyan-500/30">
                                    BETA
                                </span>
                            </h2>
                            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1 text-cyan-400/80 text-xs font-medium uppercase mt-1 cursor-pointer hover:text-cyan-300 transition-colors">
                                <Info className="w-3.5 h-3.5" /> Nasıl Çalışıyor?
                            </button>

                            <AnimatePresence>
                                {showInfo && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-2 left-0 w-64 bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 shadow-xl z-50"
                                    >
                                        <p className="text-white/80 text-[11px] leading-relaxed">
                                            <strong className="text-cyan-400">Gizlilik & Performans Odaklı:</strong> Şu anki "BETA" sürümünde sesin sadece kendi cihazında (yerel) işlenir, hiçbir sunucuya gönderilmez. Radardaki patiler yakın zamanda aktif olan kullanıcılardır. Anıların ise sadece senin galerinde güvenle tutulur. 
                                            <br/><br/>
                                            Büyük yapay zeka beyni ve canlı radar güncellemeleri önümüzdeki sürümlerde aktif edilecektir!
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                    <motion.button
                                        key={pet.id}
                                        onClick={() => {
                                            router.push(`/profile/${pet.profileId}`);
                                            onClose();
                                        }}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ duration: 0.5, delay: Math.random() * 2 }}
                                        className="absolute w-10 h-10 -ml-5 -mt-5 group"
                                        style={{ left: pet.x, top: pet.y }}
                                    >
                                        <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-30"></div>
                                        <img src={pet.img} className="w-10 h-10 rounded-full border-2 border-cyan-400 object-cover relative z-10 transition-transform group-hover:scale-110" />
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">{pet.name}</span>
                                    </motion.button>
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

                        {/* Transcript & Feedback Area */}
                        <div className="h-20 mt-12 flex flex-col items-center justify-center w-full max-w-xs px-4 text-center">
                            <AnimatePresence mode="wait">
                                {actionFeedback ? (
                                    <motion.div
                                        key="feedback"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full font-bold text-sm"
                                    >
                                        <actionFeedback.icon className="w-4 h-4" />
                                        {actionFeedback.text}
                                    </motion.div>
                                ) : transcript ? (
                                    <motion.p
                                        key={transcript}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-white font-medium text-lg leading-tight"
                                    >
                                        {transcript}
                                    </motion.p>
                                ) : null}
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
                                        <p className="text-white/70 text-[11px] font-medium">{petToUse?.name || 'Dostunun'} bugünkü kapsülü eksik!</p>
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
                                className="w-full bg-white/10 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-emerald-400 font-bold text-sm">Görev Tamamlandı!</h4>
                                        <p className="text-white/70 text-[10px]">+10 Pati Puan Kazandın 🏆</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-white text-[10px] bg-white/10 px-2 py-1 rounded-full mb-1">Cihazına Kaydedildi</span>
                                    <button 
                                        onClick={() => setCapsulePhoto(null)}
                                        className="text-white/50 hover:text-white text-[10px] underline"
                                    >
                                        Tekrar Çek
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
