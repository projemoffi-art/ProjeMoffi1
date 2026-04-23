"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Lock, X, Loader2, ArrowRight, Github, Chrome, 
    ShieldCheck, Sparkles, User, PawPrint, ChevronLeft,
    CheckCircle2, Fingerprint, Scan, Heart, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthStep = 'welcome' | 'choice' | 'login' | 'register' | 'verifying' | 'success';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<AuthStep>('welcome');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const { login, signup } = useAuth();

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setStep('welcome'), 300);
            setErrorMsg('');
        }
    }, [isOpen]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const { success, error } = await login(email, password);
            if (error) throw new Error(error);
            if (success) {
                setStep('verifying');
                setTimeout(() => setStep('success'), 2000);
                setTimeout(() => {
                    onClose();
                    router.refresh();
                }, 4000);
            }
        } catch (error: any) {
            setErrorMsg(error.message);
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const { success, error } = await signup(name || email.split('@')[0], email, password);
            if (error) throw new Error(error);
            if (success) {
                setStep('success');
                setTimeout(() => {
                    setStep('login');
                    setIsLoading(false);
                }, 3000);
            }
        } catch (error: any) {
            setErrorMsg(error.message);
            setIsLoading(false);
        }
    };

    const stepVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98
        })
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[8000] flex items-center justify-center px-4">
                    {/* Immersive Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                    />

                    {/* Animated Background Orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                                rotate: [0, 90, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full" 
                        />
                        <motion.div 
                            animate={{ 
                                scale: [1.2, 1, 1.2],
                                opacity: [0.2, 0.4, 0.2],
                                rotate: [0, -90, 0]
                            }}
                            transition={{ duration: 12, repeat: Infinity }}
                            className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" 
                        />
                    </div>

                    {/* Modal Container */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className={cn(
                            "relative w-full max-w-lg bg-[#0A0A0E] border border-white/10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden",
                            step === 'welcome' ? 'h-[650px]' : 'h-auto min-h-[500px]'
                        )}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all z-[100] active:scale-95"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="p-12 h-full flex flex-col">
                            <AnimatePresence mode="wait" custom={1}>
                                {step === 'welcome' && (
                                    <motion.div
                                        key="welcome"
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col items-center text-center justify-center gap-10"
                                    >
                                        <div className="relative">
                                            <motion.div 
                                                animate={{ 
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.5, 0.8, 0.5]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" 
                                            />
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl relative z-10">
                                                <PawPrint className="w-16 h-16 text-white" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi'ye <br/>Hoş Geldiniz</h2>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest max-w-[280px] leading-relaxed mx-auto">
                                                Pet Ekosisteminin Geleceğine Adım Atın.
                                            </p>
                                        </div>

                                        <button 
                                            onClick={() => setStep('choice')}
                                            className="group relative w-full mt-4 bg-white text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] overflow-hidden active:scale-95 transition-all"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-3">
                                                Keşfetmeye Başla <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'choice' && (
                                    <motion.div
                                        key="choice"
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col justify-center gap-6"
                                    >
                                        <div className="mb-10 text-center">
                                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Nasıl Devam Edelim?</h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">Sizi Tanımak İstiyoruz</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <button 
                                                onClick={() => setStep('login')}
                                                className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black text-base uppercase italic tracking-tight">Giriş Yap</h4>
                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Mevcut Hesaba Dön</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors" />
                                            </button>

                                            <button 
                                                onClick={() => setStep('register')}
                                                className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                                        <Sparkles className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black text-base uppercase italic tracking-tight">Kayıt Ol</h4>
                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Yeni Bir Evren Kur</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-purple-400 transition-colors" />
                                            </button>
                                        </div>

                                        <div className="mt-8 flex flex-col items-center gap-6">
                                            <span className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">Diğer Seçenekler</span>
                                            <div className="flex gap-4">
                                                <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"><Chrome className="w-6 h-6" /></button>
                                                <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"><Github className="w-6 h-6" /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {(step === 'login' || step === 'register') && (
                                    <motion.div
                                        key={step}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col gap-8"
                                    >
                                        <button onClick={() => setStep('choice')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
                                            <ChevronLeft className="w-4 h-4" /> 
                                            <span className="text-[10px] font-black uppercase tracking-widest">Geri Dön</span>
                                        </button>

                                        <div>
                                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                                                {step === 'login' ? 'Tekrar Hoş Geldin' : 'Moffi\'ye Katıl'}
                                            </h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">
                                                {step === 'login' ? 'Erişim Sağlanıyor' : 'Yeni Kimlik Oluşturuluyor'}
                                            </p>
                                        </div>

                                        <form onSubmit={step === 'login' ? handleLogin : handleRegister} className="space-y-5">
                                            {step === 'register' && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">İsim Soyisim</label>
                                                    <input 
                                                        type="text" 
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                        placeholder="Moffi Kullanıcısı"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white placeholder-gray-700 focus:border-cyan-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">E-Posta</label>
                                                <input 
                                                    type="email" 
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    placeholder="merhaba@moffi.net"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white placeholder-gray-700 focus:border-cyan-500/50 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Şifre</label>
                                                <input 
                                                    type="password" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    placeholder="••••••••"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white placeholder-gray-700 focus:border-cyan-500/50 outline-none transition-all"
                                                />
                                            </div>

                                            {errorMsg && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 font-black uppercase tracking-wider"
                                                >
                                                    {errorMsg}
                                                </motion.div>
                                            )}

                                            <button 
                                                disabled={isLoading}
                                                className="w-full py-6 bg-cyan-500 rounded-[2.5rem] text-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
                                            >
                                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                    <>
                                                        {step === 'login' ? 'Giriş Onayla' : 'Hesabı Başlat'}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {step === 'verifying' && (
                                    <motion.div
                                        key="verifying"
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col items-center justify-center text-center gap-10"
                                    >
                                        <div className="relative">
                                            <motion.div 
                                                animate={{ 
                                                    scale: [1, 1.5, 1],
                                                    rotate: [0, 360],
                                                    borderRadius: ["20%", "50%", "20%"]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="w-32 h-32 border-4 border-cyan-500/30 border-t-cyan-500"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Scan className="w-12 h-12 text-cyan-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Kimlik Doğrulanıyor</h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Moffi Core Erişimi İstendi</p>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col items-center justify-center text-center gap-10"
                                    >
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 12 }}
                                            className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                                        >
                                            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                                        </motion.div>
                                        <div className="space-y-4">
                                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Erişim Onaylandı</h2>
                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] animate-pulse">Sizin Dünyanıza Hoş Geldiniz</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
