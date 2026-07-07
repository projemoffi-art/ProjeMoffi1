"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Send, X, Bot, User as UserIcon, 
    ChevronRight, Zap, Crown, MessageSquare, 
    Briefcase, Cpu, Trash2, ArrowLeft,
    Heart, Shield, Stethoscope
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
    const { pets: userPets, activePet } = usePet();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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

    // Handle hydration
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initialize messages based on settings
    useEffect(() => {
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
    }, [isPro, user?.username, aiSettings.personality, messages.length]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;

        // Collect pet data payload
        const activePetObj = activePet || userPets?.[0] || null;
        let petDataPayload: any = null;

        if (activePetObj) {
            const todayStr = new Date().toISOString().split('T')[0];
            const waterCurrent = Number(localStorage.getItem(`moffi_water_${activePetObj.id}_${todayStr}`) || '0');
            const foodCurrent = Number(localStorage.getItem(`moffi_calories_${activePetObj.id}_${todayStr}`) || '0');
            
            const waterTarget = typeof activePetObj.water_target === 'number' ? activePetObj.water_target : 1200;
            const foodTarget = typeof activePetObj.food_target === 'number' ? activePetObj.food_target : 800;

            let vaccinesList: any[] = [];
            try {
                const savedVaccines = localStorage.getItem(`moffi_vaccines_${activePetObj.id}`);
                if (savedVaccines) {
                    vaccinesList = JSON.parse(savedVaccines);
                }
            } catch (e) {}

            petDataPayload = {
                name: activePetObj.name,
                breed: activePetObj.breed || activePetObj.species || 'Bilinmeyen Cins',
                weight: activePetObj.weight || '0 kg',
                gender: activePetObj.gender || 'Bilinmiyor',
                waterCurrent,
                waterTarget,
                foodCurrent,
                foodTarget,
                vaccines: vaccinesList.map(v => ({
                    name: v.definition?.name || v.name,
                    dueDate: v.dueDate,
                    status: v.status
                }))
            };
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context: `AI Settings: personality=${aiSettings.personality}, detail=${aiSettings.detailLevel}`,
                    petData: petDataPayload
                })
            });
            const data = await response.json();
            
            if (data.success && data.message) {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.message
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                throw new Error(data.error || "Yanıt alınamadı");
            }
        } catch (apiError) {
            console.warn("Moffi AI API Failed, falling back to simulated response:", apiError);

            let simulatedResponse = "";
            const petName = petDataPayload?.name || "dostun";
            if (aiSettings.personality === 'technical') {
                simulatedResponse = `Veri girişi algılandı. ${petName} biyometrik değerler ve aktivite logları inceleniyor. Optimizasyon önerisi: Su tüketimi %12 artırılmalı.`;
            } else if (aiSettings.personality === 'professional') {
                simulatedResponse = `İsteğiniz kaydedilmiştir. Veri analizlerimiz sonucunda ${petName} sağlık parametrelerinin ideal seviyede olduğu gözlemlenmiştir.`;
            } else {
                simulatedResponse = `Harika bir soru! ${petName} için en iyisini düşündüğünden eminim. Bence bugün biraz daha fazla oyun oynamalısınız! 🐾❤️`;
            }

            if (aiSettings.detailLevel === 'short') {
                simulatedResponse = simulatedResponse.split('.')[0] + ". ✅";
            } else if (aiSettings.detailLevel === 'long') {
                simulatedResponse += " Ayrıca, son yürüyüş verilerine göre dostunun kondisyonu mükemmel ilerliyor. Moffi ekosistemi olarak her adımda yanınızdayız.";
            }

            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: simulatedResponse
            };
            setMessages(prev => [...prev, aiMsg]);
        } finally {
            setIsTyping(false);
        }
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
            {/* The Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-5 z-[99999] w-[52px] h-[52px] bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full shadow-[0_8px_30px_rgba(99,102,241,0.4)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                    >
                        <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        className="fixed bottom-6 right-6 z-[999999] w-[380px] h-[600px] max-h-[90vh] bg-background/80 backdrop-blur-3xl border border-card-border rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                    >
                        <div className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border-b border-card-border flex items-center justify-between">
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
                                <button 
                                    onClick={() => { setIsOpen(false); router.push('/vet'); }} 
                                    className="px-3 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center gap-1.5 text-[11px] font-bold transition-colors border border-emerald-500/20"
                                >
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    <span>VetLine</span>
                                </button>
                                <button onClick={clearChat} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => { setIsOpen(false); }} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-foreground hover:bg-white/10 transition-all border border-card-border"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-card/10">
                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-card-border", m.role === 'user' ? "bg-accent text-white" : "bg-white/5 text-secondary")}>
                                        {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn("max-w-[80%] p-4 rounded-3xl text-[13px] font-medium leading-relaxed", m.role === 'user' ? "bg-foreground text-background font-bold" : "bg-white/5 text-foreground/90 border border-card-border")}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-card-border"><Bot className="w-4 h-4 text-secondary animate-bounce" /></div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-card-border flex gap-1"><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" /></div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-card-border">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Bir şeyler sor..." className="w-full bg-white/5 border border-card-border hover:border-card-border focus:border-accent/40 rounded-[2rem] pl-6 pr-14 py-4 text-[13px] text-foreground outline-none transition-all font-medium placeholder:text-secondary/30" />
                                <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (typeof document === 'undefined' || !isMounted) return null;
    return createPortal(assistantContent, document.body);
}
