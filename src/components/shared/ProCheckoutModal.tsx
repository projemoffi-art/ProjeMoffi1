"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ShieldCheck, CreditCard, 
    Lock, Sparkles, Check, 
    ChevronRight, Loader2,
    Crown, BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import confetti from 'canvas-confetti';

interface ProCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProCheckoutModal({ isOpen, onClose, onSuccess }: ProCheckoutModalProps) {
    const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
    });
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        const { number, expiry, cvc, name } = cardData;
        setIsFormValid(number.length >= 16 && expiry.length === 5 && cvc.length === 3 && name.length > 2);
    }, [cardData]);

    const handleCheckout = async () => {
        if (!isFormValid) return;
        
        setStep('processing');
        
        // Simüle edilmiş banka onayı süreci
        await new Promise(r => setTimeout(r, 2500));
        
        try {
            await apiService.upgradeSubscription('pro');
            
            setStep('success');
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#FFFFFF', '#6366F1']
            });

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);
        } catch (err) {
            console.error("Ödeme hatası:", err);
            setStep('details');
        }
    };

    const formatCardNumber = (val: string) => {
        const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) return parts.join(' ');
        return val;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9500] bg-black/90 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-[9501] bg-[#0D0D12] border border-white/10 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Crown className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Moffi Pro</h3>
                                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Premium Yükseltme</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/10">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                            <AnimatePresence mode="wait">
                                {step === 'details' && (
                                    <motion.div 
                                        key="details"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        {/* Card Preview */}
                                        <div className="relative group perspective-1000">
                                            <div className="w-full aspect-[1.6/1] bg-gradient-to-br from-[#1C1C26] via-[#12121A] to-[#0A0A0F] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group-hover:rotate-x-2 transition-transform duration-500">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
                                                <div className="flex justify-between items-start mb-12">
                                                    <div className="w-12 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                                                        <div className="w-8 h-6 bg-yellow-500/20 rounded border border-yellow-500/20" />
                                                    </div>
                                                    <CreditCard className="w-8 h-8 text-white/20" />
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="text-2xl font-black text-white tracking-[0.2em] h-8 font-mono">
                                                        {cardData.number ? formatCardNumber(cardData.number) : '•••• •••• •••• ••••'}
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Kart Sahibi</p>
                                                            <p className="text-sm font-black text-white uppercase tracking-wider h-5">{cardData.name || 'MOFFI USER'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">EXP</p>
                                                            <p className="text-sm font-black text-white tracking-widest h-5">{cardData.expiry || 'MM/YY'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Card Type Glow */}
                                                <div className="absolute bottom-4 right-8 flex gap-1">
                                                    <div className="w-6 h-6 rounded-full bg-red-500/40 blur-sm" />
                                                    <div className="w-6 h-6 rounded-full bg-yellow-500/40 blur-sm -ml-3" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Kart Üzerindeki İsim</label>
                                                <input 
                                                    type="text"
                                                    value={cardData.name}
                                                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/10 uppercase"
                                                    placeholder="AD SOYAD"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Kart Numarası</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        maxLength={16}
                                                        value={cardData.number}
                                                        onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-mono font-bold text-lg outline-none focus:border-indigo-500/50 transition-all"
                                                        placeholder="0000 0000 0000 0000"
                                                    />
                                                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">Son Kullanma</label>
                                                    <input 
                                                        type="text"
                                                        maxLength={5}
                                                        value={cardData.expiry}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/\D/g, '');
                                                            if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2);
                                                            setCardData({...cardData, expiry: val});
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                        placeholder="AA/YY"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1">CVC / CVV</label>
                                                    <input 
                                                        type="text"
                                                        maxLength={3}
                                                        value={cardData.cvc}
                                                        onChange={(e) => setCardData({...cardData, cvc: e.target.value.replace(/\D/g, '')})}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                        placeholder="123"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-4">
                                            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-tight">
                                                Ödemeleriniz uçtan uca şifrelenmektedir. Moffi kart bilgilerinizi asla saklamaz ve <span className="text-white">PCIDSS</span> uyumludur.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={!isFormValid}
                                            className={cn(
                                                "w-full py-6 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-2xl shadow-indigo-500/20",
                                                isFormValid ? "bg-white text-black font-black uppercase tracking-[0.2em]" : "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                                            )}
                                        >
                                            {isFormValid ? (
                                                <>
                                                    Aboneliği Başlat
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            ) : (
                                                "Bilgileri Tamamla"
                                            )}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'processing' && (
                                    <motion.div 
                                        key="processing"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-[400px] flex flex-col items-center justify-center text-center space-y-8"
                                    >
                                        <div className="relative">
                                            <Loader2 className="w-20 h-20 text-indigo-500 animate-spin" />
                                            <div className="absolute inset-x-0 -bottom-12 flex flex-col items-center">
                                                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        animate={{ x: ["-100%", "100%"] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                        className="h-full w-1/2 bg-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">İşlem Yapılıyor</h4>
                                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Bankanızdan onay bekleniyor...</p>
                                        </div>
                                        <div className="bg-white/5 px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/5">
                                            <Lock className="w-4 h-4 text-indigo-400" />
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">3D SECURE ACTIVE</span>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div 
                                        key="success"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="h-[450px] flex flex-col items-center justify-center text-center space-y-10"
                                    >
                                        <div className="relative">
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-32 h-32 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center"
                                            >
                                                <Check className="w-16 h-16 text-emerald-500" />
                                            </motion.div>
                                            <motion.div 
                                                animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">Hoş Geldin!</h4>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 rounded-full flex items-center gap-2 shadow-xl shadow-indigo-500/20">
                                                    <Crown className="w-3 h-3 text-white" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Moffi Pro Active</span>
                                                </div>
                                                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest max-w-[280px]">Tüm kilitler açıldı. Artık Moffi ekosisteminde sınırın yok.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                                                <Sparkles className="w-4 h-4 text-orange-400 mb-2" />
                                                <span className="text-[8px] font-black text-white/40 uppercase">Premium Aura</span>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                                                <BellRing className="w-4 h-4 text-cyan-400 mb-2" />
                                                <span className="text-[8px] font-black text-white/40 uppercase">Öncelikli SOS</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
