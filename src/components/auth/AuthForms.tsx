"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { Mail, Apple, Eye, EyeOff, Lock, User, ArrowLeft, Loader2, ShieldCheck, X, Sparkles, Dog, Cat, Bird } from "lucide-react";
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
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="w-full max-w-xl bg-white border-t sm:border border-zinc-200 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 flex flex-col gap-6 shadow-2xl relative"
                    >
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-200 rounded-full sm:hidden" />
                        
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-extrabold text-zinc-800 tracking-tight">{content[type].title}</h3>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                                <X className="w-5 h-5 text-zinc-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 max-h-[60vh] custom-scrollbar">
                            <p className="text-zinc-600 text-sm leading-relaxed font-medium">
                                {content[type].body}
                                <br/><br/>
                                Detaylı metin şu an teknik ekip tarafından güncellenmektedir. Bu özet metin, platformun temel işleyiş prensiplerini temsil eder.
                            </p>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-full py-5 bg-zinc-950 text-white rounded-3xl font-extrabold text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Anladım, Kapat
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- Brand Header with Cat, Dog, and Bird ---
function PetBrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="flex flex-col select-none">
            {/* Full-width Illustration Banner */}
            <div className="mx-[-32px] mt-[-40px] w-[calc(100%+64px)] h-44 relative overflow-hidden rounded-t-[3rem] border-b border-purple-100/30 bg-gradient-to-b from-purple-50 to-indigo-50/50 flex items-center justify-center">
                <img 
                    src="/images/moffi_pet_trio.png" 
                    alt="Moffi Pets" 
                    className="w-full h-full object-cover scale-[1.03]"
                />
            </div>
            
            {/* Moffi Styled Brand Logo & Title block */}
            <div className="flex flex-col items-center mt-5 mb-4">
                <span className="text-3xl font-extrabold tracking-[0.18em] bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent px-2 py-1 leading-none select-none font-[family-name:var(--font-sans)]">
                    MOFFI
                </span>
                
                <h2 className="text-lg font-extrabold text-zinc-800 tracking-tight text-center mt-2.5 leading-none">
                    {title}
                </h2>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2 text-center">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}



const inputClass = "w-full pl-14 pr-6 py-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300";
const primaryButtonClass = "w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] shadow-[0_10px_25px_-5px_rgba(124,58,237,0.3)] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";

const translateCodeError = (err?: string) => {
    const msg = (err || '').toLowerCase();
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('otp')) return 'Kod hatalı ya da süresi dolmuş. Yeni kod isteyebilirsin.';
    if (msg.includes('rate') || msg.includes('too many') || msg.includes('seconds')) return 'Çok sık denedin. Biraz bekleyip tekrar dene.';
    if (msg.includes('same') && msg.includes('password')) return 'Yeni şifre eskisiyle aynı olamaz.';
    if (msg.includes('password')) return 'Şifre en az 8 karakter olmalı.';
    return 'Bir sorun oluştu. Lütfen tekrar dene.';
};

// E-postaya gelen 6 haneli kodu isteyen ortak adım (kayıt, doğrulanmamış giriş).
function CodeStep({ email, onVerified, onBack }: { email: string; onVerified: () => void; onBack: () => void }) {
    const { verifyOtp, resendOtp } = useAuth();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(60);

    React.useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return;
        setError(''); setInfo(''); setLoading(true);
        const result = await verifyOtp(email, code, 'signup');
        setLoading(false);
        if (result.success) onVerified();
        else setError(translateCodeError(result.error));
    };

    const resend = async () => {
        setError(''); setInfo('');
        const result = await resendOtp(email);
        if (result.success) { setInfo('Yeni kod gönderildi.'); setCooldown(60); }
        else setError(translateCodeError(result.error));
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <p className="text-sm text-zinc-600 text-center leading-relaxed">
                <span className="font-bold text-zinc-800">{email}</span> adresine 6 haneli bir kod gönderdik. Gelen kutunu (ve gereksiz klasörünü) kontrol et.
            </p>
            <input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                aria-label="Doğrulama kodu"
                className="w-full py-4 text-center text-2xl font-bold tracking-[0.6em] bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-zinc-800 focus:border-purple-400/80 focus:bg-white outline-none transition-all placeholder-zinc-300"
            />
            {error && <div className="bg-red-500/10 text-red-600 text-xs p-3 rounded-xl border border-red-500/20 font-semibold text-center">{error}</div>}
            {info && <div className="bg-emerald-500/10 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-500/20 font-semibold text-center">{info}</div>}
            <button type="submit" disabled={loading || code.length !== 6} className={primaryButtonClass}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Doğrula'}
            </button>
            <div className="flex items-center justify-between text-xs font-semibold">
                <button type="button" onClick={onBack} className="text-zinc-400 hover:text-zinc-700">Geri dön</button>
                <button type="button" onClick={resend} disabled={cooldown > 0} className="text-purple-600 disabled:text-zinc-400">
                    {cooldown > 0 ? `Yeni kod (${cooldown} sn)` : 'Yeni kod gönder'}
                </button>
            </div>
        </form>
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
    const [verifying, setVerifying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email.trim(), formData.password);
        setLoading(false);

        if (result.success) {
            onComplete();
        } else if (result.needsVerification) {
            setVerifying(true);
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
            className="flex flex-col h-full p-8 pt-10 bg-transparent overflow-y-auto custom-scrollbar"
        >
            <PetBrandHeader
                title={verifying ? 'E-postanı doğrula' : t('auth.login.title')}
                subtitle={verifying ? 'Son bir adım' : t('auth.login.subtitle')}
            />

            {verifying ? (
                <CodeStep email={formData.email.trim()} onVerified={onComplete} onBack={() => setVerifying(false)} />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">{t('auth.login.email')}</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="merhaba@moffi.net"
                            className="w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">Gizli Şifre</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full pl-14 pr-14 py-4.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end p-1">
                    <button type="button" onClick={() => setView('reset')} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-purple-600 transition-colors">Şifremi Unuttum</button>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 text-red-600 text-[10px] p-4 rounded-xl border border-red-500/20 font-bold uppercase tracking-wider text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] shadow-[0_10px_25px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_20px_35px_-5px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Evrene Giriş'}
                </button>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-zinc-200/60"></div>
                    <span className="flex-shrink mx-4 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">veya</span>
                    <div className="flex-grow border-t border-zinc-200/60"></div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => signInWithGoogle()}
                        className="flex-1 py-4 bg-zinc-50/60 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-3 font-bold text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300 transition-all active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-700">{t('auth.landing.google')}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => signInWithApple()}
                        className="flex-1 py-4 bg-zinc-50/60 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-3 font-bold text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300 transition-all active:scale-95"
                    >
                        <Apple className="w-5 h-5 text-zinc-800" />
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-700">{t('auth.landing.apple')}</span>
                    </button>
                </div>
            </form>
            )}

            <div className="mt-auto text-center pt-6">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Henüz Üye Değil Misin? <button onClick={() => setView('signup')} className="text-purple-500 hover:text-purple-600 font-black ml-1">Katıl</button>
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
    const [verifying, setVerifying] = useState(false);

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

        if (formData.password.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        const result = await signup(formData.name.trim(), formData.email.trim(), formData.password);
        setLoading(false);

        if (result.success) {
            if (setEmail) setEmail(formData.email.trim());
            if (result.needsVerification) setVerifying(true);
            else onComplete();
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
            className="flex flex-col h-full p-8 pt-10 bg-transparent overflow-y-auto custom-scrollbar"
        >
            <PetBrandHeader
                title={verifying ? 'E-postanı doğrula' : t('auth.signup.title')}
                subtitle={verifying ? 'Son bir adım' : t('auth.signup.subtitle')}
            />

            {verifying ? (
                <CodeStep email={formData.email.trim()} onVerified={onComplete} onBack={() => setVerifying(false)} />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">{t('auth.signup.full_name')}</label>
                    <div className="relative">
                        <User className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Adınız Soyadınız"
                            className="w-full pl-14 pr-6 py-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">E-posta</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="ornek@moffi.net"
                            className="w-full pl-14 pr-6 py-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">{t('auth.signup.password')}</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full pl-14 pr-16 py-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">{t('auth.signup.confirm_password')}</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-14 pr-6 py-4 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>

                {/* Legal Checkboxes */}
                <div className="space-y-3 pt-2">
                    <label className="flex gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                            />
                            <div className={cn(
                                "h-5 w-5 border rounded-lg flex items-center justify-center transition-all",
                                agreeTerms ? "bg-purple-500 border-purple-500" : "bg-zinc-50/50 border-zinc-200 group-hover:border-zinc-300"
                            )}>
                                {agreeTerms && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                            </div>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                            {t('auth.signup.terms_prefix')}{" "}
                            <button type="button" onClick={() => setLegalType('terms')} className="text-zinc-500 hover:text-purple-600 underline font-extrabold">{t('auth.signup.terms_link')}</button>,{" "}
                            <button type="button" onClick={() => setLegalType('privacy')} className="text-zinc-500 hover:text-purple-600 underline font-extrabold">{t('auth.signup.privacy_link')}</button>{" "}
                            {t('auth.signup.terms_suffix')}{" "}
                             {t('auth.signup.terms_end')}
                        </p>
                    </label>

                    <label className="flex gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={marketingConsent}
                                onChange={(e) => setMarketingConsent(e.target.checked)}
                                className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                            />
                            <div className={cn(
                                "h-5 w-5 border rounded-lg flex items-center justify-center transition-all",
                                marketingConsent ? "bg-purple-500 border-purple-500" : "bg-zinc-50/50 border-zinc-200 group-hover:border-zinc-300"
                            )}>
                                {marketingConsent && <Sparkles className="w-3.5 h-3.5 text-white" />}
                            </div>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                            {t('auth.signup.marketing_consent')}
                        </p>
                    </label>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-600 text-[10px] p-4 rounded-xl border border-red-500/20 font-bold uppercase tracking-wider text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !agreeTerms}
                    className={cn(
                        "w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.99]",
                        agreeTerms 
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_10px_25px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_20px_35px_-5px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 active:translate-y-0" 
                            : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                    )}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Evrene Katıl'}
                </button>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-zinc-200/60"></div>
                    <span className="flex-shrink mx-4 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">veya</span>
                    <div className="flex-grow border-t border-zinc-200/60"></div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => signInWithGoogle()}
                        className="flex-1 py-4 bg-zinc-50/60 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-3 font-bold text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300 transition-all active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-700">{t('auth.landing.google')}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => signInWithApple()}
                        className="flex-1 py-4 bg-zinc-50/60 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-3 font-bold text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300 transition-all active:scale-95"
                    >
                        <Apple className="w-5 h-5 text-zinc-800" />
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-700">{t('auth.landing.apple')}</span>
                    </button>
                </div>

                <div className="text-center pt-4">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {t('auth.landing.already_member')} <button type="button" onClick={() => setView('login')} className="text-purple-500 hover:text-purple-600 transition-colors ml-2 font-black">{t('auth.landing.login')}</button>
                    </p>
                </div>
            </form>
            )}

            <LegalModal 
                isOpen={!!legalType} 
                onClose={() => setLegalType(null)} 
                type={legalType || 'terms'} 
            />
        </motion.div>
    );
}

// --- Reset Password Form ---
export function ResetForm({ setView, onComplete }: { setView: (v: AuthView) => void, onComplete?: () => void }) {
    const { forgotPassword, resetPasswordWithCode } = useAuth();
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await forgotPassword(email.trim());
        setLoading(false);
        // Hesabın var olup olmadığı açığa çıkmasın diye her durumda aynı adıma geçilir
        if (result.success || !/rate|too many|seconds/i.test(result.error || '')) setSent(true);
        else setError('Çok sık denedin. Biraz bekleyip tekrar dene.');
    };

    const handleNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return; }
        if (password !== password2) { setError('Şifreler eşleşmiyor.'); return; }
        setLoading(true);
        const result = await resetPasswordWithCode(email.trim(), code, password);
        setLoading(false);
        if (result.success) onComplete ? onComplete() : setView('login');
        else setError(translateCodeError(result.error));
    };

    return (
        <motion.div 
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col h-full p-8 pt-10 bg-transparent overflow-y-auto custom-scrollbar"
        >
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setView('login')} className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-all group">
                    <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-zinc-800 transition-colors" />
                </button>
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Şifre Sıfırlama</span>
            </div>

            <PetBrandHeader 
                title="Şifremi Unuttum" 
                subtitle="E-postana kod göndereceğiz"
            />

            {!sent ? (
                <form onSubmit={handleReset} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1">E-posta Adresiniz</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                placeholder="merhaba@moffi.net"
                                className="w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-sm text-zinc-800 focus:border-purple-400/80 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,85,247,0.06)] outline-none transition-all placeholder-zinc-300"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-600 text-[10px] p-4 rounded-xl border border-red-500/20 font-bold uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] shadow-[0_10px_25px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_20px_35px_-5px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Kod Gönder'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleNewPassword} className="space-y-4">
                    <p className="text-sm text-zinc-600 text-center leading-relaxed">
                        Bu adres kayıtlıysa <span className="font-bold text-zinc-800">{email.trim()}</span> adresine 6 haneli bir kod gönderdik.
                    </p>
                    <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        aria-label="Doğrulama kodu"
                        className="w-full py-4 text-center text-2xl font-bold tracking-[0.6em] bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-zinc-800 focus:border-purple-400/80 focus:bg-white outline-none transition-all placeholder-zinc-300"
                    />
                    <div className="relative">
                        <Lock className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input type="password" autoComplete="new-password" placeholder="Yeni şifre (en az 8 karakter)" className={inputClass}
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
                        <input type="password" autoComplete="new-password" placeholder="Yeni şifre (tekrar)" className={inputClass}
                            value={password2} onChange={(e) => setPassword2(e.target.value)} required />
                    </div>
                    {error && <div className="bg-red-500/10 text-red-600 text-xs p-3 rounded-xl border border-red-500/20 font-semibold text-center">{error}</div>}
                    <button type="submit" disabled={loading || code.length !== 6} className={primaryButtonClass}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Şifreyi Güncelle'}
                    </button>
                    <button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }} className="w-full text-xs font-semibold text-zinc-400 hover:text-zinc-700">
                        Kod gelmedi mi? Tekrar gönder
                    </button>
                </form>
            )}
        </motion.div>
    );
}





