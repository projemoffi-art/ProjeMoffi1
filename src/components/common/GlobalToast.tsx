"use client";

// Uygulamanın tek kısa bildirim (toast) katmanı: showToast(mesaj, ikon, renk sınıfı) → "moffi-toast" olayı (lib/utils).
// Her temada okunur düz kart (eski hâli açık temada koyu zemin üstünde koyu yazıydı ve indigo şerit kullanıyordu).

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, Bell, Zap, Heart, PawPrint, X,
    CheckCircle2, XCircle, AlertCircle, PhoneCall,
    MapPin, Send, Upload, Download, Save, Globe,
    Share2, Wand2, ShieldAlert, Award, Gift
} from "lucide-react";

const IconMap: Record<string, typeof Bell> = {
    Sparkles, Bell, Zap, Heart, PawPrint, X,
    CheckCircle2, XCircle, AlertCircle, PhoneCall,
    MapPin, Send, Upload, Download, Save, Globe,
    Share2, Wand2, ShieldAlert, Award, Gift
};

interface ToastItem {
    id: string;
    message: string;
    icon: string;
    color?: string;
}

export function GlobalToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const handleToast = (e: Event) => {
            const { message, icon = "Bell", color } = (e as CustomEvent<{ message: string; icon?: string; color?: string }>).detail;
            const id = `${Date.now()}-${Math.random()}`;
            setToasts(prev => [...prev.slice(-2), { id, message, icon, color }]);
            const timer = setTimeout(() => {
                timers.delete(timer);
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
            timers.add(timer);
        };
        window.addEventListener("moffi-toast", handleToast);
        return () => {
            window.removeEventListener("moffi-toast", handleToast);
            timers.forEach(clearTimeout);
        };
    }, []);

    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <div aria-live="polite" className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] sm:left-auto sm:right-6 z-[10050] flex flex-col items-center sm:items-end gap-2 pointer-events-none select-none">
            <AnimatePresence>
                {toasts.map(toast => {
                    const IconComponent = IconMap[toast.icon] || Bell;
                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            role="status"
                            initial={{ opacity: 0, y: -16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.18 } }}
                            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white dark:bg-[#29241D] text-[#201B16] dark:text-[#F2ECE2] border border-black/[0.06] dark:border-white/10 px-3.5 py-3 flex items-center gap-3 shadow-[0_14px_36px_-12px_rgba(32,27,22,0.35)]"
                        >
                            <span className={`flex-shrink-0 w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center ${toast.color || "text-[#EE5B3D]"}`}>
                                <IconComponent className="w-[18px] h-[18px]" />
                            </span>
                            <p className="flex-1 text-[13.5px] font-bold leading-snug">{toast.message}</p>
                            <button
                                type="button"
                                aria-label="Kapat"
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#6F675B] dark:text-[#B8AE9E] active:bg-black/5 dark:active:bg-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
