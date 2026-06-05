"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { Dog, Mail, Apple, PawPrint, Eye, EyeOff, ChevronRight, Lock, User, AtSign, ArrowLeft, Loader2, Sparkles, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- Types ---
type AuthView = 'landing' | 'login' | 'signup' | 'reset' | 'otp';

const formVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
};

// --- Legal Modal Component ---
function LegalModal({ isOpen, onClose, type }: { isOpen: boolean, onClose: () => void, type: 'terms' | 'privacy' }) {
    const { t } = useTranslation();
    
    const content = {
        terms: {
            title: "Kullanım Şartları",
            body: "Moffi platformuna hoş geldiniz. Bu Kullanım Şartları, platformumuzdaki tüm dijital hizmetlerin kullanımını düzenler. Kaydolarak bu şartları kabul etmiş sayılırsınız. Platformumuz evcil hayvan sahipleri için sosyal bir ağ olup, paylaşımların topluluk kurallarına uygun olması esastır."
        },
        privacy: {
            title: "Gizlilik Politikası",
            body: "Kişisel verileriniz Moffi güvencesi altındadır. Verileriniz sadece size daha iyi bir deneyim sunmak ve evcil hayvanınızla ilgili hatırlatıcılar oluşturmak için kullanılır. Üçüncü taraflarla asla paylaşılmaz."
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md"
                >
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="w-full max-w-xl bg-zinc-900 border-t sm:border border-card-border rounded-t-[2.5rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 flex flex-col gap-6 shadow-2xl relative"
                    >
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full sm:hidden" />
                        
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{content[type].title}</h3>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 max-h-[60vh] custom-scrollbar">
                            <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                {content[type].body}
                                <br/><br/>
                                Detaylı metin şu an teknik ekip tarafından güncellenmektedir. Bu özet metin, platformun temel işleyiş prensiplerini temsil eder.
                            </p>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-full py-5 bg-card text-black rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Anladım, Kapat
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- Auth Landing Component ---
export function AuthLanding({ setView }: { setView: (v: AuthView) => void }) {
    const { signInWithGoogle, signInWithApple } = useAuth();
    const { t } = useTranslation();
    const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

    return (
        <div className="flex flex-col h-full p-10 pt-16 items-center bg-transparent relative overflow-y-auto">
            {/* Logo Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-16"
            >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-card-border">
                    <PawPrint className="w-7 h-7 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase italic italic leading-none">Moffi <span className="text-cyan-400">Core</span></h1>
            </motion.div>

            {/* Cinematic Center Art */}
            <div className="flex-1 w-full flex items-center justify-center relative my-4">
                <div className="relative">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3],
                            rotate: [0, 180, 0]
                        }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full" 
                    />
                    <div className="w-64 h-64 bg-white/5 border border-card-border backdrop-blur-3xl rounded-full flex items-center justify-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10" />
                        <Sparkles className="w-32 h-32 text-cyan-400/30 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                             <span className="text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-bounce delay-100">🐶</span>
                             <span className="text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-bounce delay-300">🐱</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Text & Action */}
            <div className="text-center mb-16 relative z-10">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">{t('auth.landing.title')}</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] italic">{t('auth.landing.subtitle')}</p>
            </div>

            {/* Buttons Stack */}
            <div className="w-full space-y-4 mb-10">
                <button
                    onClick={() => setView('signup')}
                    className="w-full py-6 bg-card text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)]"
                >
                    {t('auth.landing.email_start')}
                </button>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => signInWithGoogle()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.google')}</span>
                    </button>
                    <button 
                        onClick={() => signInWithApple()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Apple className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.apple')}</span>
                    </button>
                </div>
            </div>

            {/* Footer Legal Links */}
            <div className="mt-auto py-8 w-full flex flex-col items-center gap-6">
                <div className="flex gap-6">
                    <button onClick={() => setLegalType('terms')} className="text-[9px] text-foreground font-black uppercase tracking-widest hover:text-white transition-colors">{t('legal.title_terms')}</button>
                    <button onClick={() => setLegalType('privacy')} className="text-[9px] text-foreground font-black uppercase tracking-widest hover:text-white transition-colors">{t('legal.title_privacy')}</button>
                </div>
                
                <div className="text-center border-t border-card-border pt-6 w-full">
                    <p className="text-[10px] text-foreground font-bold uppercase tracking-widest">
                        {t('auth.landing.already_member')} <button onClick={() => setView('login')} className="text-white hover:text-cyan-400 transition-colors ml-2">{t('auth.landing.login')}</button>
                    </p>
                </div>
            </div>

            <LegalModal 
                isOpen={!!legalType} 
                onClose={() => setLegalType(null)} 
                type={legalType || 'terms'} 
            />
        </div>
    );
}

// --- Login Form ---
export function LoginForm({ setView, onComplete }: { setView: (v: AuthView) => void, onComplete: () => void }) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            onComplete();
        } else {
            setError(translateError(result.error));
        }
    };

    const translateError = (err: string | undefined) => {
        if (!err) return 'Giriş yapılamadı';
        const msg = err.toLowerCase();
        if (msg.includes('invalid login credentials')) return 'E-posta veya şifre hatalı. Tekrar denemeye ne dersin? 🐾';
        if (msg.includes('email not confirmed')) return 'E-postanı henüz doğrulamamışsın. Lütfen gelen kutunu kontrol et! 📧';
        if (msg.includes('too many requests')) return 'Çok fazla deneme yaptın. Biraz soluklanıp tekrar dene. 🧊';
        return 'Sisteme bağlanırken bir sorun oluştu. Lütfen tekrar dene.';
    };

    return (
        <motion.div 
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col h-full p-10 pt-12 bg-transparent overflow-y-auto"
        >
            <button onClick={() => setView('signup')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-card-border flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-12">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{t('auth.login.title')}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 italic">{t('auth.login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('auth.login.email')}</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="merhaba@moffi.net"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Gizli Şifre</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full pl-16 pr-16 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end p-1">
                    <button type="button" onClick={() => setView('reset')} className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-cyan-400 transition-colors">Şifremi Unuttum</button>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 text-red-500 text-[10px] p-5 rounded-2xl border border-red-500/20 font-black uppercase tracking-wider text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-cyan-500 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sisteme Bağlan'}
                </button>
            </form>

            <div className="mt-auto text-center pt-8">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    Henüz Üye Değil Misin? <button onClick={() => setView('signup')} className="text-cyan-400 font-black ml-1">Katıl</button>
                </p>
            </div>
        </motion.div>
    );
}

// --- Signup Form ---
export function SignupForm({ setView, onComplete, setEmail }: { setView: (v: AuthView) => void, onComplete: () => void, setEmail?: (email: string) => void }) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const { signup } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const checkEmailTypo = (email: string) => {
        const domain = email.split('@')[1];
        const commonTypos: Record<string, string> = {
            'gmal.com': 'gmail.com',
            'gamil.com': 'gmail.com',
            'hotmal.com': 'hotmail.com',
            'yaho.com': 'yahoo.com',
            'outlook.co': 'outlook.com',
            'gmail.co': 'gmail.com'
        };
        return commonTypos[domain];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(formData.email)) {
            setError('Lütfen geçerli bir e-posta adresi girin.');
            return;
        }

        const typo = checkEmailTypo(formData.email);
        if (typo) {
            setError(`E-postanızı yanlış yazmış olabilir misiniz? "${typo}" mu demek istediniz?`);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        const result = await signup(formData.name, formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            if (setEmail) setEmail(formData.email);
            onComplete(); // OTP'yi atlayıp doğrudan onboarding/setup aşamasına geçiş yap!
        } else {
            setError(translateSignupError(result.error));
        }
    };

    const translateSignupError = (err: string | undefined) => {
        if (!err) return 'Kayıt olunamadı.';
        const msg = err.toLowerCase();
        if (msg.includes('user already registered')) return 'Bu e-posta zaten kullanımda. Giriş yapmayı denemek ister misin? 🔓';
        if (msg.includes('weak_password')) return 'Şifren biraz zayıf kalmış. Daha güçlü bir şifre seçmelisin! 💪';
        return 'Kayıt sırasında bir hata oluştu. Lütfen bilgileri kontrol et.';
    };

    return (
        <motion.div 
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col h-full p-10 pt-12 bg-transparent overflow-y-auto"
        >
            <button onClick={() => setView('login')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-card-border flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-12">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{t('auth.signup.title')}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 italic">{t('auth.signup.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('auth.signup.full_name')}</label>
                    <div className="relative">
                        <User className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Adınız Soyadınız"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">E-posta</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="ornek@moffi.net"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('auth.signup.password')}</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full pl-16 pr-16 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('auth.signup.confirm_password')}</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>

                {/* Legal Checkboxes */}
                <div className="space-y-4 pt-4">
                    <label className="flex gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                            />
                            <div className={cn(
                                "h-5 w-5 border rounded-lg flex items-center justify-center transition-all",
                                agreeTerms ? "bg-cyan-500 border-cyan-500" : "bg-white/5 border-card-border group-hover:border-card-border"
                            )}>
                                {agreeTerms && <ShieldCheck className="w-3 h-3 text-black" />}
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            {t('auth.signup.terms_prefix')}{" "}
                            <button type="button" onClick={() => setLegalType('terms')} className="text-white hover:text-cyan-400 underline">{t('auth.signup.terms_link')}</button>,{" "}
                            <button type="button" onClick={() => setLegalType('privacy')} className="text-white hover:text-cyan-400 underline">{t('auth.signup.privacy_link')}</button>{" "}
                            {t('auth.signup.terms_suffix')}{" "}
                             {t('auth.signup.terms_end')}
                        </p>
                    </label>

                    <label className="flex gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={marketingConsent}
                                onChange={(e) => setMarketingConsent(e.target.checked)}
                                className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                            />
                            <div className={cn(
                                "h-5 w-5 border rounded-lg flex items-center justify-center transition-all",
                                marketingConsent ? "bg-purple-500 border-purple-500" : "bg-white/5 border-card-border group-hover:border-card-border"
                            )}>
                                {marketingConsent && <Sparkles className="w-3 h-3 text-black" />}
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            {t('auth.signup.marketing_consent')}
                        </p>
                    </label>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-500 text-[10px] p-5 rounded-2xl border border-red-500/20 font-black uppercase tracking-wider text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !agreeTerms}
                    className={cn(
                        "w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl",
                        agreeTerms ? "bg-card text-black shadow-white/10" : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('auth.signup.submit')}
                </button>

                <div className="mt-auto pt-10 text-center">
                    <div className="mt-8">
                        <p className="text-[10px] text-foreground font-bold uppercase tracking-widest">
                            {t('auth.landing.already_member')} <button onClick={() => setView('login')} className="text-white hover:text-cyan-400 transition-colors ml-2">{t('auth.landing.login')}</button>
                        </p>
                    </div>
                </div>
            </form>

            <LegalModal 
                isOpen={!!legalType} 
                onClose={() => setLegalType(null)} 
                type={legalType || 'terms'} 
            />
        </motion.div>
    );
}

// --- Reset Password Form ---
export function ResetForm({ setView }: { setView: (v: AuthView) => void }) {
    const { forgotPassword } = useAuth();
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await forgotPassword(email);
        setLoading(false);

        if (result.success) {
            setSent(true);
            // After 5s go back to login, but with a nice transition
        } else {
            setError('E-posta bulunamadı veya bir hata oluştu. Lütfen kontrol et! 🐾');
        }
    };

    return (
        <motion.div 
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col h-full p-10 pt-12 bg-transparent overflow-y-auto"
        >
            <button onClick={() => setView('login')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-card-border flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-12">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Şifre Sıfırla</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">Güvenli Bağlantı Gönderilecek</p>
            </div>

            {!sent ? (
                <form onSubmit={handleReset} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Sayısal Kimlik (E-posta)</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                placeholder="merhaba@moffi.net"
                                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-500 text-[10px] p-5 rounded-2xl border border-red-500/20 font-black uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 bg-cyan-500 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Bağlantıyı Gönder'}
                    </button>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] animate-in fade-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Kanal Açıldı</h3>
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-2 px-6 text-center">Lütfen e-posta kutunuzu kontrol edin.</p>
                </div>
            )}
        </motion.div>
    );
}


// --- OTP Verification Form ---
export function OTPForm({ setView, onComplete, email }: { setView: (v: AuthView) => void, onComplete: () => void, email: string }) {
    const { verifyOtp, resendOtp } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Auto-focus first input on mount
    useEffect(() => {
        setTimeout(() => inputRefs[0].current?.focus(), 300);
    }, []);

    const handleChange = (index: number, value: string) => {
        // Handle paste: if pasting 6 digits at once
        if (value.length === 6 && /^\d{6}$/.test(value)) {
            const digits = value.split('');
            setOtp(digits);
            inputRefs[5].current?.focus();
            setTimeout(() => handleAutoSubmit(value), 150);
            return;
        }

        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }

        if (newOtp.every(v => v !== '') && index === 5) {
            handleAutoSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleAutoSubmit = async (fullCode: string) => {
        if (fullCode.length !== 6 || loading) return;
        setLoading(true);
        setError('');
        const result = await verifyOtp(email, fullCode, 'signup');
        setLoading(false);

        if (result.success) {
            onComplete();
        } else {
            const msg = result.error?.toLowerCase() || '';
            if (msg.includes('expired') || msg.includes('invalid') || msg.includes('otp')) {
                setError('Kod geçersiz veya süresi dolmuş. Yeni kod iste! 📧');
            } else {
                setError('Doğrulama başarısız: ' + (result.error || 'Lütfen tekrar dene.'));
            }
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    };

    const handleResend = async () => {
        if (resendLoading || timeLeft > 0) return;
        setResendLoading(true);
        setError('');
        setResendSuccess(false);
        const result = await resendOtp(email);
        setResendLoading(false);
        if (result.success) {
            setResendSuccess(true);
            setTimeLeft(60);
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs[0].current?.focus(), 100);
            setTimeout(() => setResendSuccess(false), 5000);
        } else {
            setError('Kod gönderilemedi: ' + (result.error || 'Lütfen tekrar dene.'));
        }
    };

    return (
        <motion.div
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col h-full p-10 pt-12 bg-transparent overflow-y-auto"
        >
            <button onClick={() => setView('signup')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-card-border flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-8">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Doğrulama</h2>
                <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Kod Gönderildi</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1 break-all">{email}</p>
                            <p className="text-[9px] text-gray-600 mt-1">Spam / Junk klasörünü de kontrol et.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* OTP Inputs */}
                <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={inputRefs[i]}
                            type="text"
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                if (pasted.length > 0) handleChange(i, pasted);
                            }}
                            className={cn(
                                "w-12 h-16 sm:w-14 sm:h-20 bg-white/5 border rounded-2xl text-2xl font-black text-cyan-400 text-center outline-none transition-all",
                                digit ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "border-card-border focus:border-white/30"
                            )}
                        />
                    ))}
                </div>

                {/* Loading indicator */}
                {loading && (
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Doğrulanıyor...</span>
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 text-red-400 text-[10px] p-4 rounded-2xl border border-red-500/20 font-bold uppercase tracking-wider text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {resendSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/10 text-emerald-400 text-[10px] p-4 rounded-2xl border border-emerald-500/20 font-black uppercase tracking-wider text-center"
                    >
                        Yeni kod gönderildi! Gelen kutunu kontrol et.
                    </motion.div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={() => handleAutoSubmit(otp.join(''))}
                        disabled={loading || otp.some(v => v === '')}
                        className="w-full py-6 bg-cyan-500 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Doğrula & Başla'}
                    </button>

                    <div className="text-center">
                        {timeLeft > 0 ? (
                            <p className="text-[10px] text-foreground font-bold uppercase tracking-widest">
                                Yeni kod için bekle ({timeLeft}s)
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-[10px] text-white font-black uppercase tracking-widest hover:text-cyan-400 transition-colors inline-flex items-center gap-2"
                            >
                                {resendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Kodu Tekrar Gönder
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


