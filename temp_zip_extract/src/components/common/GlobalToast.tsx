"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Bell, Zap, Heart, PawPrint, X, 
    CheckCircle2, XCircle, AlertCircle, PhoneCall, 
    MapPin, Send, Upload, Download, Save, Globe, 
    Share2, Wand2, ShieldAlert
} from "lucide-react";

const IconMap: Record<string, any> = {
    Sparkles, Bell, Zap, Heart, PawPrint, X, 
    CheckCircle2, XCircle, AlertCircle, PhoneCall, 
    MapPin, Send, Upload, Download, Save, Globe, 
    Share2, Wand2, ShieldAlert
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
        if (typeof window === "undefined") return;

        const handleToast = (e: Event) => {
            const customEvent = e as CustomEvent<{ message: string; icon?: string; color?: string }>;
            const { message, icon = "Bell", color } = customEvent.detail;
            
            const newToast: ToastItem = {
                id: `${Date.now()}-${Math.random()}`,
                message,
                icon,
                color
            };

            setToasts(prev => [...prev, newToast]);

            // Auto-dismiss after 4 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 4000);
        };

        window.addEventListener("moffi-toast", handleToast);
        return () => {
            window.removeEventListener("moffi-toast", handleToast);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
            <AnimatePresence>
                {toasts.map(toast => {
                    const IconComponent = IconMap[toast.icon] || Bell;
                    const accentColorClass = toast.color || "text-[#6366f1]"; // Fallback indigo accent

                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.85, x: 20, transition: { duration: 0.2 } }}
                            className="pointer-events-auto bg-black/60 dark:bg-zinc-950/80 backdrop-blur-xl border border-white/10 dark:border-zinc-800/80 shadow-2xl p-4.5 rounded-2xl flex items-start gap-3.5 relative overflow-hidden animate-in fade-in"
                            style={{
                                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                            }}
                        >
                            {/* Decorative ambient glowing backplate */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6366f1]/5 blur-2xl rounded-full pointer-events-none" />
                            
                            {/* Left active colored line indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6366f1]" />

                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 dark:bg-white/5 border border-white/5 flex items-center justify-center ${accentColorClass}`}>
                                <IconComponent className="w-4.5 h-4.5" />
                            </div>

                            <div className="flex-1 pr-4">
                                <p className="text-[11.5px] font-bold text-gray-800 dark:text-gray-100 leading-snug">
                                    {toast.message}
                                </p>
                            </div>

                            <button 
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
