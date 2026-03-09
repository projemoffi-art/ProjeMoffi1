"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, X, Loader2, ArrowRight, Github, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const [view, setView] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const { login, signup } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            if (view === 'register') {
                const nameFromEmail = email.split('@')[0];
                const { success, error } = await signup(nameFromEmail, email, password);

                if (error) throw new Error(error);
                if (success) {
                    setSuccessMsg("Kayıt başarılı! Giriş yapabilirsiniz. (E-posta doğrulaması gerekiyorsa lütfen linke tıklayın)");
                    setView('login');
                    setPassword('');
                }

            } else {
                const { success, error } = await login(email, password);
                if (error) throw new Error(error);
                if (success) {
                    onClose();
                    router.refresh();
                }
            }
        } catch (error: any) {
            setErrorMsg(error.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Dark Glass Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05050A]/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-sm bg-[#0A0A0E] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                    >
                        {/* Ambient Neon Glow */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-cyan-500/10 blur-[50px] pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                                {view === 'login' ? 'Tekrar Hoş Geldin.' : 'Moffi\'ye Katıl.'}
                            </h2>
                            <p className="text-sm text-gray-400 mb-8 font-medium">
                                {view === 'login'
                                    ? 'Pet Ekosistemine erişmek için giriş yap.'
                                    : 'Bütünleşik ekosistemin parçası olmak için ilk adımı at.'}
                            </p>

                            {errorMsg && (
                                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            {successMsg && (
                                <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
                                    {successMsg}
                                </div>
                            )}

                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">E-Posta</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="merhaba@moffi.net"
                                            className="w-full bg-[#12121A] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Şifre</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="w-full bg-[#12121A] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-cyan-500 text-black py-4 rounded-2xl font-black text-sm hover:bg-cyan-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {view === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 relative flex items-center justify-center">
                                <hr className="w-full border-white/5 absolute" />
                                <span className="relative bg-[#0A0A0E] px-4 text-[10px] text-gray-500 font-medium">VEYA</span>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={() => alert("Google ile giriş modülü devreye alınacak")} className="flex-1 flex items-center justify-center gap-2 bg-[#12121A] border border-white/5 text-sm py-3 rounded-2xl text-white hover:bg-white/5 hover:border-white/10 transition-colors">
                                    <Chrome className="w-4 h-4 text-gray-400" />
                                    Google
                                </button>
                                <button type="button" onClick={() => alert("Apple/Github ile giriş modülü devreye alınacak")} className="flex-1 flex items-center justify-center gap-2 bg-[#12121A] border border-white/5 text-sm py-3 rounded-2xl text-white hover:bg-white/5 hover:border-white/10 transition-colors">
                                    <Github className="w-4 h-4 text-gray-400" />
                                    Apple
                                </button>
                            </div>

                            <p className="mt-8 text-center text-xs text-gray-500">
                                {view === 'login' ? 'Hesabın yok mu?' : 'Zaten bir hesabın var mı?'}
                                <button
                                    type="button"
                                    onClick={() => setView(view === 'login' ? 'register' : 'login')}
                                    className="ml-1 text-cyan-400 font-bold hover:text-cyan-300"
                                >
                                    {view === 'login' ? 'Hemen Katıl' : 'Giriş Yap'}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
