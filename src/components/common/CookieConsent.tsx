"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldCheck } from "lucide-react";

import Link from "next/link";

export function CookieConsent() {
    const { t, language } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("moffi_cookie_consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("moffi_cookie_consent", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-8 right-8 md:left-auto md:right-12 md:w-[400px] z-[9999]"
                >
                    <div className="bg-[#12121A]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full group-hover:bg-cyan-500/20 transition-all" />
                        
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400">
                                    <Cookie className="w-6 h-6" />
                                </div>
                                <button 
                                    onClick={() => setIsVisible(false)}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-4">
                                {language === 'tr' ? "Çerez Deneyimi" : "Cookie Experience"}
                            </h3>
                            
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                                {language === 'tr' 
                                    ? "Size en elit Moffi deneyimini sunmak için çerezleri kullanıyoruz. Devam ederek çerez kullanımını kabul etmiş olursunuz."
                                    : "We use cookies to provide you with the most elite Moffi experience. By continuing, you agree to our use of cookies."}
                                <br/>
                                <Link href="/cookies" className="text-cyan-400 underline mt-2 inline-block hover:text-cyan-300 transition-colors">
                                    {t('legal.title_cookies')}
                                </Link>
                            </p>

                            <div className="flex gap-3">
                                <button 
                                    onClick={handleAccept}
                                    className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
                                >
                                    {language === 'tr' ? "KABUL ET" : "ACCEPT ALL"}
                                </button>
                                <button 
                                    onClick={() => setIsVisible(false)}
                                    className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    {language === 'tr' ? "REDDET" : "DECLINE"}
                                </button>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full w-fit">
                            <ShieldCheck className="w-3 h-3 text-cyan-500/50" />
                            <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">End-to-End Secure Protocol</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
