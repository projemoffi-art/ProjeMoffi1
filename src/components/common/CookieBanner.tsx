"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("moffi_cookie_consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
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
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none"
                >
                    <div className="max-w-7xl mx-auto pointer-events-auto bg-black/90 backdrop-blur-xl border border-card-border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                        <div className="text-gray-300 text-xs md:text-sm leading-relaxed">
                            <span className="font-bold text-white block mb-2 text-base">Çerez Politikası 🍪</span>
                            Sana en iyi deneyimi sunmak, uygulama içi AI asistanını optimize etmek ve performans analizi yapmak için çerezleri kullanıyoruz.
                            Sitemizi kullanarak, <a href="/cookies" className="text-cyan-500 hover:underline">Çerez Politikamızı</a> ve <a href="/privacy" className="text-cyan-500 hover:underline">Gizlilik Sözleşmemizi</a> kabul etmiş olursun.
                        </div>
                        <div className="flex shrink-0 gap-3 w-full md:w-auto">
                            <button
                                onClick={acceptCookies}
                                className="w-full md:w-auto px-8 py-3 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-cyan-400 active:scale-95 transition-all whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            >
                                Tümünü Kabul Et
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
