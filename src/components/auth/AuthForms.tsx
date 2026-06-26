"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { Mail, Apple, Eye, EyeOff, Lock, User, ArrowLeft, Loader2, ShieldCheck, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type AuthView = 'login' | 'signup' | 'reset';

const formVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
};

// --- Legal Modal Component ---
function LegalModal({ isOpen, onClose, type }: { isOpen: boolean, onClose: () => void, type: 'terms' | 'privacy' }) {
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



// --- Login Form ---
export function LoginForm({ setView, onComplete }: { setView: (v: AuthView) => void, onComplete: () => void }) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const { login, signInWithGoogle, signInWithApple } = useAuth();
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

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-[9px] font-black uppercase tracking-widest">veya</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => signInWithGoogle()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.google')}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => signInWithApple()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Apple className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.apple')}</span>
                    </button>
                </div>
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
    const { signup, signInWithGoogle, signInWithApple } = useAuth();
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

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-[9px] font-black uppercase tracking-widest">veya</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => signInWithGoogle()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.google')}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => signInWithApple()}
                        className="flex-1 py-5 bg-white/5 border border-card-border rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Apple className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('auth.landing.apple')}</span>
                    </button>
                </div>

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





