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
export function MoffiAssistant() {
    const { user, showAIAssistant } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // M+ Status
    const isPro = user?.role === 'admin' || user?.is_pro === true;

    // Initialize messages
    useEffect(() => {
        setIsMounted(true);
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: isPro 
                    ? `Merhaba ${user?.username || 'Moffi Üyesi'}! Ben M+ Concierge. Patili dostunun tıbbi geçmişi ve sağlık verileri bende asılı duruyor. Sana bugün nasıl bir uzman yardımı sağlayabilirim? ✨`
                    : `Selam! Moffi Asistanın burada. Patin hakkında sormak istediğin her şeyi sorabilirsin! 🦴`
            }]);
        }
        return () => setIsMounted(false);
    }, [isPro, user?.username]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    if (!isMounted || !showAIAssistant) return null;

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulated AI Logic (Stable for Build)
        setTimeout(() => {
            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: isPro 
                    ? "Verileri analiz ettim. Patili dostunun son yürüyüş mesafesi %15 artmış, bu harika! Beslenmesine ek protein eklemeyi düşünebilirsin. Moffi M+ ekosistemi her zaman yanında! 🐾⚡"
                    : "Anlıyorum! Patin için harika bir gün. Ben her zaman buradayım, sormak istediğin başka bir şey olursa hazır bekliyorum! 😊"
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
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
                {!isOpen && (
                    <motion.button
                        drag
                        dragMomentum={false}
                        onDragStart={() => isDraggingRef.current = true}
                        onDragEnd={() => setTimeout(() => isDraggingRef.current = false, 100)}
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => !isDraggingRef.current && setIsOpen(true)}
                        className={cn(
                            "fixed bottom-24 right-6 z-[999999] w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all overflow-hidden",
                            isPro ? "bg-gradient-to-tr from-violet-600 to-indigo-600 border-2 border-white/20" : "bg-black border-2 border-white/10"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-2 bg-gradient-to-tr from-violet-500/20 via-transparent to-cyan-500/20 rounded-full blur-xl" 
                        />
                        {isPro ? <Sparkles className="w-6 h-6 text-white animate-pulse" /> : <Zap className="w-6 h-6 text-white" />}
                        {isPro && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />}
                    </motion.button>
                )}

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
                                    <h3 className="text-[15px] font-black text-foreground uppercase tracking-tighter leading-none">{isPro ? "M+ Concierge" : "Moffi AI Asistan"}</h3>
                                    <p className="text-[10px] text-secondary font-bold uppercase mt-1 tracking-widest flex items-center gap-1.5">{isTyping ? "Düşünüyor..." : "Çevrimiçi"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearChat} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-foreground hover:bg-white/10 transition-all border border-card-border"><X className="w-5 h-5" /></button>
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
