"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PhoneCall, MapPin, MessageCircle, Heart, 
    ShieldAlert, BadgeCheck, AlertTriangle, ArrowLeft, 
    Send, PawPrint, Loader2, Coins, BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import { getPetStatusById } from '@/services/petIdService';
import { PetIDState } from '@/types/pet-id';

export default function PetIDPage() {
    const router = useRouter();
    const params = useParams();
    const petId = params?.petId as string || "";

    const [loading, setLoading] = useState(true);
    const [petData, setPetData] = useState<PetIDState | null>(null);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [anonMessage, setAnonMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showScanNotification, setShowScanNotification] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!petId) return;
            setLoading(true);
            try {
                const data = await getPetStatusById(petId);
                setPetData(data);
                
                // Simulate "Owner Notified" scan event
                if (data && data.status === 'lost') {
                    setTimeout(() => setShowScanNotification(true), 2000);
                }
            } catch (error) {
                console.error("Error fetching pet data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [petId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Moffi Kimlik Bilgileri Alınıyor...</p>
            </div>
        );
    }

    if (!petData) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Pet ID Bulunamadı</h1>
                <p className="text-white/50 text-sm mb-6">Girdiğiniz kimlik numarası sistemimizde kayıtlı görünmüyor.</p>
                <button onClick={() => router.push('/')} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold">Anasayfaya Dön</button>
            </div>
        );
    }

    const { pet, status, sosConfig } = petData;
    const isLost = status === 'lost';

    // --- SOS ACTIONS ---
    const handleCallOwner = () => {
        if (!sosConfig.allowProxyCalls) return;
        alert(`Sahibine 'Moffi Güvenli Arama' üzerinden bağlanılıyor...`);
    };

    const handleSendLocation = () => {
        if (navigator.geolocation) {
            alert("Konum izniniz isteniyor... Kabul edildiğinde anlık konumunuz sahibinin uygulamasına acil durum sinyali olarak düşecek!");
        } else {
            alert("Cihazınız konum özelliğini desteklemiyor.");
        }
    };

    const handleSendMessage = () => {
        if (!anonMessage.trim() || !sosConfig.allowAnonymousMessaging) return;
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setAnonMessage("");
            setShowMessageBox(false);
            alert("Mesajınız başarıyla ve anonim olarak sahibine iletildi!");
        }, 1500);
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white selection:bg-cyan-500/30 overflow-hidden relative">

            {/* SCAN NOTIFICATION TOAST (SIMULATION FOR FINDER TO SEE OWNER IS AWARE) */}
            <AnimatePresence>
                {showScanNotification && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 inset-x-0 z-[100] flex justify-center px-6 pointer-events-none"
                    >
                        <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/20">
                            <BellRing className="w-5 h-5 animate-ring" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-wider leading-none">Moffi Güvenlik</span>
                                <span className="text-xs font-bold">Sahibine tarama bildirimi iletildi!</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GRADIENT BACKDROP */}
            <div className="absolute inset-x-0 top-0 h-[60dvh] w-full pointer-events-none">
                <img src={pet.avatarUrl} className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black",
                    isLost ? "from-red-900/40" : "from-cyan-900/40"
                )} />
            </div>

            {/* HEADER */}
            <header className="relative z-10 p-5 flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 cursor-pointer active:scale-90 transition-transform" onClick={() => router.push('/')}>
                    <ArrowLeft className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                    {isLost ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <BadgeCheck className="w-4 h-4 text-cyan-400" />}
                    <span className="text-xs font-bold text-white tracking-wide">Moffi Pet-ID</span>
                </div>
            </header>

            {/* MAIN CONTENT PORTRAIT */}
            <main className="relative z-10 flex flex-col items-center px-6 pt-2 pb-32">

                {/* REWARD BADGE */}
                {isLost && sosConfig.rewardAmount && (
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: -5 }}
                        className="bg-amber-400 text-black px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl mb-4 flex items-center gap-2 z-20"
                    >
                        <Coins className="w-3.5 h-3.5" />
                        Ödüllü Kayıp: {sosConfig.rewardAmount} {sosConfig.rewardCurrency}
                    </motion.div>
                )}

                {/* PROFILE PICTURE */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative mb-6"
                >
                    <div className={cn(
                        "w-40 h-40 rounded-[2rem] p-1.5 shadow-2xl relative z-10 overflow-hidden",
                        isLost ? "bg-gradient-to-tr from-red-600 to-orange-500" : "bg-gradient-to-tr from-cyan-400 to-blue-600"
                    )}>
                        <img src={pet.avatarUrl} className="w-full h-full rounded-[1.6rem] object-cover" />
                    </div>
                    <div className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[40px] -z-10",
                        isLost ? "bg-red-500/50" : "bg-cyan-500/50"
                    )} />
                </motion.div>

                {/* NAME AND STATUS */}
                <div className="text-center mb-8 w-full max-w-sm">
                    <h1 className="text-4xl font-black mb-1 tracking-tight flex items-center justify-center gap-2">
                        {pet.name}
                    </h1>
                    <p className="text-white/60 text-sm font-medium mb-6 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                        {pet.breed} • {pet.age}
                    </p>

                    {/* STATUS BANNER */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                            "w-full rounded-[2.5rem] p-6 shadow-xl backdrop-blur-xl border border-white/10 relative overflow-hidden",
                            isLost ? "bg-red-500/10" : "bg-white/5"
                        )}
                    >
                        {isLost ? (
                            <>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-bounce">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Kayıp Alarmı! 🚨</h2>
                                    <p className="text-sm text-red-100/90 leading-relaxed font-medium">
                                        {sosConfig.emergencyMessage}
                                    </p>
                                    {sosConfig.criticalHealthAlert && (
                                        <div className="w-full bg-red-950/50 rounded-2xl p-3 border border-red-500/10 mt-2 flex flex-col items-start text-left">
                                            <span className="text-xs uppercase font-bold text-red-400 mb-1">⚕️ Sağlık Uyarısı</span>
                                            <p className="text-[13px] text-white/90 leading-snug">{sosConfig.criticalHealthAlert}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1">
                                    <Heart className="w-5 h-5" fill="currentColor" />
                                </div>
                                <h2 className="text-lg font-bold text-white tracking-wide">Ben Güvendeyim!</h2>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    Sahibim yanımda veya evimdeyim. Benimle karşılaştıysan sadece başımı okşa ve iyi olduğumu bil! 🐾
                                </p>
                                <div className="w-full h-[1px] bg-white/10 my-2" />
                                <p className="text-[13px] italic text-white/50">"{pet.bio}"</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ACTION BUTTONS (ONLY SHOW IF LOST) */}
                {isLost && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full max-w-sm flex flex-col gap-3"
                    >
                        {sosConfig.allowProxyCalls && (
                             <button onClick={handleCallOwner} className="w-full bg-white text-black hover:bg-gray-100 transition-colors rounded-[20px] p-4 flex items-center justify-center gap-3 font-bold text-[15px] shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95">
                                <PhoneCall className="w-5 h-5 text-emerald-600" />
                                Sahibini Hemen Ara (Gizli Arama)
                            </button>
                        )}

                        <div className="flex gap-3 w-full">
                            <button onClick={handleSendLocation} className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 transition-colors active:scale-95">
                                <MapPin className="w-6 h-6" />
                                <span className="font-semibold text-xs text-center leading-tight">Mevcut Konumumu Gönder</span>
                            </button>

                            {sosConfig.allowAnonymousMessaging && (
                                <button onClick={() => setShowMessageBox(!showMessageBox)} className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 transition-colors active:scale-95">
                                    <MessageCircle className="w-6 h-6" />
                                    <span className="font-semibold text-xs text-center leading-tight">Anonim Mesaj Bırak</span>
                                </button>
                            )}
                        </div>

                        {/* ANONYMOUS MESSAGE BOX */}
                        <AnimatePresence>
                            {showMessageBox && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-[#1C1C1E] rounded-3xl p-4 border border-white/10 shadow-xl mt-2 flex flex-col gap-3">
                                        <p className="text-xs text-white/50 text-center uppercase tracking-wide font-bold">Uygulamasız - Güvenli Mesaj</p>
                                        <textarea
                                            value={anonMessage}
                                            onChange={(e) => setAnonMessage(e.target.value)}
                                            placeholder="Örn: Migros'un arkasında gördüm, mama veriyorum..."
                                            className="w-full bg-black/50 border border-white/5 rounded-2xl p-3 text-sm text-white outline-none focus:border-cyan-500/50 placeholder:text-white/30 resize-none h-20"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={isSending || !anonMessage.trim()}
                                            className="w-full bg-cyan-500 disabled:opacity-50 disabled:bg-gray-700 text-black font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {isSending ? (
                                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <> Gönder <Send className="w-4 h-4" /> </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* BRANDING BOTTOM */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none opacity-40">
                <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                    Powered by <PawPrint className="w-3 h-3" /> Moffi
                </span>
            </div>
        </div>
    );
}
