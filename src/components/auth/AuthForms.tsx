"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dog, Mail, Apple, PawPrint, Eye, EyeOff, ChevronRight, Lock, User, AtSign, ArrowLeft, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type AuthView = 'landing' | 'login' | 'signup' | 'reset';

const formVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
};

// --- Auth Landing Component ---
export function AuthLanding({ setView }: { setView: (v: AuthView) => void }) {
    return (
        <div className="flex flex-col h-full p-10 pt-16 items-center bg-transparent relative overflow-y-auto">
            {/* Logo Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-16"
            >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
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
                    <div className="w-64 h-64 bg-white/5 border border-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center relative overflow-hidden group shadow-2xl">
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
            <div className="text-center mb-12 space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Evrenine Katılın</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] leading-relaxed">Evcil dostunuzla daha elit bir dünyaya ilk adımı atın.</p>
            </div>

            {/* Buttons Stack */}
            <div className="w-full space-y-4 mb-10">
                <button
                    onClick={() => setView('signup')}
                    className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)]"
                >
                    E-posta ile Başla
                </button>
                
                <div className="flex gap-3">
                    <button className="flex-1 py-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[10px] uppercase tracking-widest font-black">Google</span>
                    </button>
                    <button className="flex-1 py-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center gap-3 font-bold text-white hover:bg-white/10 transition-all active:scale-95">
                        <Apple className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-widest font-black">Apple</span>
                    </button>
                </div>
            </div>

            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                Zaten üyeyim? <button onClick={() => setView('login')} className="text-cyan-400 font-black ml-1">Giriş Yap</button>
            </div>
        </div>
    );
}

// --- Login Form ---
export function LoginForm({ setView, onComplete }: { setView: (v: AuthView) => void, onComplete: () => void }) {
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
            setError(result.error || 'Giriş yapılamadı');
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
            <button onClick={() => setView('landing')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-12">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Tekrar Hoş Geldin</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 italic">Evrene Giriş Doğrulanıyor</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">E-posta</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="merhaba@moffi.net"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
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
                            className="w-full pl-16 pr-16 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
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
export function SignupForm({ setView, onComplete }: { setView: (v: AuthView) => void, onComplete: () => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const { signup } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
            onComplete();
        } else {
            setError(result.error || 'Kayıt olunamadı.');
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
            <button onClick={() => setView('landing')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="mb-10">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi'ye Katıl</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 italic">Kişisel Hesabınızı Başlatın</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Ad Soyad</label>
                    <div className="relative">
                        <User className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Adınız Soyadınız"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
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
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Güçlü Şifre</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full pl-16 pr-16 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
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
                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Şifre Tekrar</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                    className="w-full py-6 bg-cyan-500 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-cyan-500/20 mt-4 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Kayıt Onayla'}
                </button>

                <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest mt-6 px-4 leading-relaxed italic">
                    Kaydolarak <a href="#" className="text-white underline">Moffi Protokolü</a> şartlarını kabul etmiş sayılrırsınız.
                </p>
            </form>
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
            setTimeout(() => setView('login'), 5000);
        } else {
            setError(result.error || 'Bir hata oluştu.');
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
            <button onClick={() => setView('login')} className="mb-10 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group">
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
                                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
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

