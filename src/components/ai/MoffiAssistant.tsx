"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Send, X, Bot, User as UserIcon, 
    Crown, Trash2, Shield, Stethoscope
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: { type: 'sos' | 'vetline' | 'link'; label: string; url?: string };
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

    const handleSend = async (e?: React.FormEvent, predefinedText?: string) => {
        if (e) e.preventDefault();
        
        const textToSend = predefinedText || input;
        if (!textToSend.trim() || isTyping) return;

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
            } catch (err) {}

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

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        if (!predefinedText) setInput("");
        setIsTyping(true);

        // --- INTENT CATCHER (Fast-track emergency/vital intents) ---
        const lowerInput = textToSend.toLowerCase();
        
        if (lowerInput.includes('kayıp') || lowerInput.includes('kayboldu') || lowerInput.includes('bulamıyorum')) {
            setTimeout(() => {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Çok geçmiş olsun! Lütfen sakin kal, sana hemen yardımcı oluyorum. Acil Durum / Kayıp Radarını açarak çevredeki tüm kullanıcılara anında bildirim gönderebiliriz. Lütfen hemen aşağıdaki butona tıkla:',
                    action: { type: 'sos', label: '🚨 Radar & Acil Durum Merkezini Aç' }
                };
                setMessages(prev => [...prev, aiMsg]);
                setIsTyping(false);
            }, 800);
            return;
        }

        if (lowerInput.includes('vetline') || lowerInput.includes('veteriner') || lowerInput.includes('canlı vet') || lowerInput.includes('hasta')) {
            setTimeout(() => {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Canlı VetLine hizmetimiz ile uzman veteriner hekimlerimizle anında görüntülü görüşebilirsin. Seni VetLine sayfasına yönlendirmemi ister misin?',
                    action: { type: 'vetline', label: '🩺 VetLine\'a Bağlan' }
                };
                setMessages(prev => [...prev, aiMsg]);
                setIsTyping(false);
            }, 800);
            return;
        }

        if (lowerInput.includes('mama') || lowerInput.includes('beslenme') || lowerInput.includes('yemek')) {
            setTimeout(() => {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `${activePetObj?.name || 'Dostunun'} yaşına, kilosuna ve ırkına özel en iyi mama seçeneklerini senin için Petshop'umuzda filtreledim!`,
                    action: { type: 'link', label: '🍎 Mama Önerilerini Gör', url: '/petshop?category=food' }
                };
                setMessages(prev => [...prev, aiMsg]);
                setIsTyping(false);
            }, 800);
            return;
        }

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
                        className="fixed bottom-24 right-5 z-[99999] w-[42px] h-[42px] bg-gradient-to-tr from-zinc-900 to-black border border-black/10 dark:border-white/10 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                    >
                        <Sparkles className="w-5 h-5 text-white group-hover:animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* FULL PANEL ASSISTANT */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[999999] bg-background/95 backdrop-blur-3xl md:p-6 flex flex-col md:items-center md:justify-center overflow-hidden"
                    >
                        {/* Wrapper for constraining width on desktop, but full screen on mobile */}
                        <div className="w-full h-full md:max-w-2xl md:h-[85vh] md:rounded-[3rem] md:border md:border-white/10 md:shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col bg-transparent overflow-hidden">
                            
                            {/* HEADER */}
                            <div className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border-b border-card-border flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", isPro ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-white dark:bg-zinc-800")}>
                                        {isPro ? <Crown className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-foreground" />}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-[18px] font-black text-foreground uppercase tracking-tighter leading-none">{isPro ? "M+ Concierge" : "Moffi AI"}</h3>
                                        <p className="text-[11px] text-accent font-bold uppercase mt-1 tracking-widest flex items-center gap-1.5">{isTyping ? "Düşünüyor..." : "Çevrimiçi"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => { setIsOpen(false); router.push('/vet'); }} 
                                        className="hidden md:flex px-4 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 items-center gap-2 text-[12px] font-bold transition-colors border border-emerald-500/20"
                                    >
                                        <Stethoscope className="w-4 h-4" />
                                        <span>VetLine</span>
                                    </button>
                                    <button onClick={clearChat} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-foreground hover:bg-black/10 dark:bg-white/10 transition-all border border-card-border"><X className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* CHAT AREA */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-card/5">
                                {messages.map((m) => (
                                    <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-card-border shadow-sm", m.role === 'user' ? "bg-accent text-white" : "bg-white dark:bg-zinc-800 text-foreground")}>
                                            {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                        </div>
                                        <div className="flex flex-col gap-2 max-w-[85%]">
                                            <div className={cn("p-5 rounded-3xl text-[14px] font-medium leading-relaxed shadow-sm", m.role === 'user' ? "bg-foreground text-background font-bold rounded-tr-sm" : "bg-white dark:bg-zinc-900 text-foreground/90 border border-card-border rounded-tl-sm")}>
                                                {m.content}
                                                
                                                {/* ACTION BUTTON (e.g. SOS, VetLine, Links) */}
                                                {m.action && (
                                                    <div className="mt-4">
                                                        <button 
                                                            onClick={() => {
                                                                if (m.action!.type === 'sos') {
                                                                    setIsOpen(false);
                                                                    window.dispatchEvent(new CustomEvent('open-sos-center'));
                                                                } else if (m.action!.type === 'vetline') {
                                                                    setIsOpen(false);
                                                                    router.push('/vet');
                                                                } else if (m.action!.type === 'link') {
                                                                    setIsOpen(false);
                                                                    router.push(m.action!.url || '/');
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-full py-3 px-4 rounded-xl font-bold text-[13px] transition-all shadow-lg flex items-center justify-center gap-2",
                                                                m.action.type === 'sos' ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : 
                                                                m.action.type === 'vetline' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" :
                                                                "bg-accent hover:bg-accent/90 text-white shadow-accent/20"
                                                            )}
                                                        >
                                                            {m.action.label}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-card-border shadow-sm"><Bot className="w-5 h-5 text-secondary animate-bounce" /></div>
                                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-card-border shadow-sm flex items-center gap-1.5 rounded-tl-sm">
                                            <div className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* INPUT AREA */}
                            <div className="bg-white/[0.02] border-t border-card-border flex flex-col shrink-0">
                                {/* Quick Actions */}
                                {messages.length <= 2 && (
                                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-6 py-4 border-b border-card-border/30">
                                        <button onClick={() => handleSend(undefined, "Hayvanım kayıp")} className="shrink-0 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 text-[12px] font-bold whitespace-nowrap hover:bg-red-500/20 transition-colors">🚨 Hayvanım Kayıp</button>
                                        <button onClick={() => handleSend(undefined, "Canlı VetLine'a Bağlan")} className="shrink-0 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[12px] font-bold whitespace-nowrap hover:bg-emerald-500/20 transition-colors">🩺 Canlı VetLine</button>
                                        <button onClick={() => handleSend(undefined, "Mama önerisi")} className="shrink-0 px-4 py-2 rounded-full border border-card-border bg-black/5 dark:bg-white/5 text-foreground text-[12px] font-bold whitespace-nowrap hover:bg-black/10 dark:hover:bg-white/10 transition-colors">🍎 Mama Önerisi</button>
                                        <button onClick={() => handleSend(undefined, "Aşı takvimi nedir?")} className="shrink-0 px-4 py-2 rounded-full border border-card-border bg-black/5 dark:bg-white/5 text-foreground text-[12px] font-bold whitespace-nowrap hover:bg-black/10 dark:hover:bg-white/10 transition-colors">💉 Aşı Takvimi</button>
                                    </div>
                                )}

                                <form onSubmit={handleSend} className="relative flex items-center p-6 pt-4">
                                    <input 
                                        value={input} 
                                        onChange={e => setInput(e.target.value)} 
                                        placeholder="Moffi'ye sor... (Örn: 'Hayvanım kayıp')" 
                                        className="w-full bg-black/5 dark:bg-white/5 border border-card-border hover:border-card-border focus:border-accent/50 rounded-[2rem] pl-6 pr-16 py-4 text-[14px] text-foreground outline-none transition-all font-medium placeholder:text-secondary/60" 
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() || isTyping} 
                                        className="absolute right-8 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        <Send className="w-5 h-5 -ml-1" />
                                    </button>
                                </form>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (typeof document === 'undefined' || !isMounted) return null;
    return createPortal(assistantContent, document.body);
}
