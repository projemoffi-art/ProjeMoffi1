"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Heart, Bell, Zap, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

const PING_MESSAGES = [
    { text: "Moffi Ekosistemi bugün çok canlı, harika görünüyorsun! ✨", icon: Sparkles, color: "text-yellow-400" },
    { text: "Küçük bir hatırlatma: Patinle bugün oyun oynamayı unutma! 🐾", icon: PawPrint, color: "text-orange-400" },
    { text: "Moffi Cloud verilerin güvende, huzurla gezinebilirsin. 🛡️", icon: Bell, color: "text-cyan-400" },
    { text: "Hava bugün patili dostun için harika, kısa bir yürüyüşe ne dersin? ☀️", icon: Zap, color: "text-yellow-500" },
    { text: "Moffi Hub'da bekleyen yeni bir bildirim var, kontrol etmek ister misin? 💌", icon: Bell, color: "text-purple-400" },
    { text: "Moffi Prime ile özel içeriklere ve sınırsız bulut depolamaya erişebilirsin! 💎", icon: Sparkles, color: "text-accent" },
    { text: "Dostunun Dijital Pasaportu'nu güncel tutarak veteriner ziyaretlerini kolaylaştır. 📋", icon: Heart, color: "text-emerald-400" },
    { text: "Acil durumda S.O.S Radarı'nı kullanarak saniyeler içinde yardım isteyebilirsin. 🚨", icon: Bell, color: "text-red-500" },
    { text: "Aura Stüdyosu'nda profilini tamamen kendine has bir tarzla özelleştir! 🎨", icon: Zap, color: "text-indigo-400" },
    { text: "Moffi AI ile dostunun davranışları hakkında derinlemesine analizler al. 🧠", icon: Sparkles, color: "text-violet-400" },
    { text: "Harika bir gün geçirmen dileğiyle! Moffi her zaman seninle. 😊", icon: Heart, color: "text-red-400" },
];

export default function GlobalFeedback() {
    const [currentMessage, setCurrentMessage] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleToast = (e: any) => {
            const { message, icon: IconName, color } = e.detail;
            
            // Map icon string to Lucide component
            const iconMap: any = { Sparkles, PawPrint, Bell, Zap, Heart, X };
            const TargetIcon = iconMap[IconName] || Bell;

            // Custom manual message
            setCustomMessage({ text: message, icon: TargetIcon, color: color || "text-cyan-400" });
            setIsVisible(true);
            
            // Clear auto-hide timers
            if (window.toastTimer) clearTimeout(window.toastTimer);
            window.toastTimer = setTimeout(() => setIsVisible(false), 6000);
        };

        window.addEventListener('moffi-toast', handleToast);

        // Initial delay before first ping
        const initialTimer = setTimeout(() => {
            showPing();
        }, 15000);

        return () => {
            window.removeEventListener('moffi-toast', handleToast);
            clearTimeout(initialTimer);
        };
    }, []);

    const [customMessage, setCustomMessage] = useState<any>(null);

    const showPing = () => {
        if (customMessage) return; // Don't interrupt manual toast
        const nextIndex = Math.floor(Math.random() * PING_MESSAGES.length);
        setCurrentMessage(nextIndex);
        setIsVisible(true);

        setTimeout(() => {
            setIsVisible(false);
            const nextInterval = (Math.random() * 120000) + 120000;
            setTimeout(showPing, nextInterval);
        }, 10000);
    };

    const ActiveIcon = customMessage ? customMessage.icon : PING_MESSAGES[currentMessage].icon;
    const activeText = customMessage ? customMessage.text : PING_MESSAGES[currentMessage].text;
    const activeColor = customMessage ? customMessage.color : PING_MESSAGES[currentMessage].color;

    return (
        <div className="fixed bottom-24 right-6 z-[100] pointer-events-none">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="pointer-events-auto relative group"
                    >
                        {/* THE PING (Expanding Rings) */}
                        {!isHovered && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-accent/20 rounded-full animate-ping" />
                                <div className="absolute w-12 h-12 bg-accent/10 rounded-full animate-pulse" />
                            </div>
                        )}

                        {/* MESSAGE BOX */}
                        <motion.div 
                            className={cn(
                                "relative flex items-center gap-4 p-4 bg-glass backdrop-blur-3xl border border-glass-border rounded-[2.5rem] shadow-2xl max-w-[280px] transition-all duration-500",
                                isHovered ? "scale-105" : "scale-100"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0", activeColor)}>
                                <ActiveIcon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-foreground leading-tight">
                                    {activeText}
                                </p>
                            </div>

                            <button 
                                onClick={() => setIsVisible(false)}
                                className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/20 hover:text-foreground transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>

                        {/* Subtle Badge */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background shadow-lg" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
