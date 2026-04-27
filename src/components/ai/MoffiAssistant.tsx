"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Send, X, Bot, User as UserIcon, 
    ChevronRight, Zap, Crown, MessageSquare, 
    Briefcase, Cpu, Trash2, ArrowLeft,
    Heart, Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

/**
 * MOFFI M+ CONCIERGE (Rebirth Edition - Stable)
 * 
 * Powered by Portal Technology.
 * Uses manual state management for maximum build compatibility in Next 16/React 19.
 */

let globalAssistantMounted = false;

export function MoffiAssistant() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // Listen for global open/close events
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        const handleClose = () => setIsOpen(false);
        window.addEventListener('open-ai-assistant', handleOpen);
        window.addEventListener('close-ai-assistant', handleClose);
        return () => {
            window.removeEventListener('open-ai-assistant', handleOpen);
            window.removeEventListener('close-ai-assistant', handleClose);
        };
    }, []);

    // M+ Status
    const isPro = user?.role === 'admin' || user?.is_pro === true;

    // --- AI LOGIC CORE ---
    const aiSettings = user?.settings?.ai || { personality: 'casual', creativity: 0.7, detailLevel: 'medium' };

    // Initialize messages based on settings
    useEffect(() => {
        setIsMounted(true);
        const existing = document.querySelector('.moffi-assistant-portal-root');
        if (existing && !isOpen) {
            setIsMounted(false);
            return;
        }

        if (messages.length === 0) {
            let greeting = "";
            if (aiSettings.personality === 'technical') {
                greeting = `Sistem Hazır. ${user?.username || 'Kullanıcı'} verileri senkronize edildi. Analiz için bir komut bekliyorum. ⚡`;
            } else if (aiSettings.personality === 'professional') {
                greeting = `İyi günler Sayın ${user?.username || 'Moffi Üyesi'}. M+ Concierge servisine hoş geldiniz. Size profesyonel düzeyde nasıl yardımcı olabilirim?`;
            } else {
                greeting = isPro 
                    ? `Selam ${user?.username || 'Dostum'}! M+ Concierge burada. Patili dostunun tüm verileri bende, hadi bugün harika bir şeyler yapalım! ✨`
                    : `Selam! Moffi Asistanın burada. Patin hakkında ne istersen sorabilirsin, her zaman hazırım! 🦴`;
            }

            setMessages([{ id: 'welcome', role: 'assistant', content: greeting }]);
        }
        return () => setIsMounted(false);
    }, [isPro, user?.username, isOpen, aiSettings.personality]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    if (!isMounted) return null;

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulation logic that ACTUALLY respects settings
        setTimeout(() => {
            let response = "";
            
            // 1. Personalization Logic
            if (aiSettings.personality === 'technical') {
                response = "Veri girişi algılandı. Biyometrik değerler ve aktivite logları inceleniyor. Optimizasyon önerisi: Su tüketimi %12 artırılmalı.";
            } else if (aiSettings.personality === 'professional') {
                response = "İsteğiniz kaydedilmiştir. Veri analizlerimiz sonucunda patili dostunuzun sağlık parametrelerinin ideal seviyede olduğu gözlemlenmiştir.";
            } else {
                response = "Harika bir soru! Patili dostun için en iyisini düşündüğünden eminim. Bence bugün biraz daha fazla oyun oynamalısınız! 🐾❤️";
            }

            // 2. Detail Level Logic (Trim or Expand)
            if (aiSettings.detailLevel === 'short') {
                response = response.split('.')[0] + ". ✅";
            } else if (aiSettings.detailLevel === 'long') {
                response += " Ayrıca, son yürüyüş verilerine göre dostunun kondisyonu mükemmel ilerliyor. Moffi ekosistemi olarak her adımda yanınızdayız.";
            }

            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: response
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000 + (aiSettings.creativity * 1000)); // Creativity affects response time simulation
    };

    const clearChat = () => {
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Geçmişi senin için temizledim. Yeni bir başlangıç yapalım mı? 🫧'
        }]);
    };

    const assistantContent = (
        <div className="moffi-assistant-portal-root">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        className="fixed bottom-6 right-6 z-[999999] w-[380px] h-[600px] max-h-[90vh] bg-background/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                    >
                        <div className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", isPro ? "bg-violet-600" : "bg-black")}>
                                    {isPro ? <Crown className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[15px] font-black text-foreground uppercase tracking-tighter leading-none">{isPro ? "M+ Concierge" : "Moffi Demo Asistan"}</h3>
                                    <p className="text-[10px] text-secondary font-bold uppercase mt-1 tracking-widest flex items-center gap-1.5">{isTyping ? "Düşünüyor..." : "Çevrimiçi"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearChat} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => { setIsOpen(false); window.history.back(); }} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-foreground hover:bg-white/10 transition-all border border-card-border"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-card/10">
                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5", m.role === 'user' ? "bg-accent text-white" : "bg-white/5 text-secondary")}>
                                        {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn("max-w-[80%] p-4 rounded-3xl text-[13px] font-medium leading-relaxed", m.role === 'user' ? "bg-foreground text-background font-bold" : "bg-white/5 text-foreground/90 border border-white/5")}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5"><Bot className="w-4 h-4 text-secondary animate-bounce" /></div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-1"><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" /></div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Bir şeyler sor..." className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent/40 rounded-[2rem] pl-6 pr-14 py-4 text-[13px] text-foreground outline-none transition-all font-medium placeholder:text-secondary/30" />
                                <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
                            </form>
                            <p className="text-[9px] text-secondary/40 font-black uppercase tracking-widest mt-4 text-center">Moffi Ecosystem Intelligence • M+ Engine v2.4</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(assistantContent, document.body);
}
