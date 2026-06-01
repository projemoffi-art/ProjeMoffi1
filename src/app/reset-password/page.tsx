"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, PawPrint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we have an active session (recovery link logs you in automatically)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have accessed this page directly without a link
                // Redirect to login after a short delay
                setError("Oturum bulunamadı veya süresi dolmuş. Giriş sayfasına yönlendiriliyorsunuz...");
                setTimeout(() => router.replace('/'), 3000);
            }
        };
        checkSession();
    }, [router]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => router.replace('/community'), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo Section */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-card-border">
                        <PawPrint className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase italic italic leading-none">Moffi <span className="text-cyan-400">Core</span></h1>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl border border-card-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5" />
                    
                    <div className="relative z-10">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Şifreni Güncelle</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 italic">Güvenli Geçiş Sağlanıyor</p>
                        </div>

                        {!success ? (
                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Yeni Gizli Şifre</label>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 text-gray-600 absolute left-6 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full pl-16 pr-16 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
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
                                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-card-border rounded-[2rem] text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder-gray-800"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
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
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Şifreyi Güncelle ve Bağlan'}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-8 relative">
                                    <ShieldCheck className="w-12 h-12 text-emerald-400 z-10" />
                                    <motion.div 
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-emerald-500/30 rounded-full"
                                    />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight text-center">Giriş Onaylandı</h3>
                                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-4 px-6 text-center leading-relaxed">
                                    Şifreniz başarıyla güncellendi. Evrene giriş yapıyorsunuz...
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-card-border rounded-full backdrop-blur-xl">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Moffi End-to-End Encryption Active</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
