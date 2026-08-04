"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Send, X, Bot, Crown, Trash2, 
    MessageSquarePlus, Settings, 
    MessageCircle, Clock, ChevronLeft, Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: { type: 'sos' | 'vetline' | 'link'; label: string; url?: string };
    isNew?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

const TypewriterText = ({ content, isNew }: { content: string, isNew?: boolean }) => {
    const safeContent = content || "";
    const [displayedText, setDisplayedText] = useState(isNew ? "" : safeContent);

    useEffect(() => {
        if (!isNew) {
            setDisplayedText(safeContent);
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            if (i < safeContent.length) {
                setDisplayedText((prev) => prev + safeContent.charAt(i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 15); // typing speed
        return () => clearInterval(interval);
    }, [safeContent, isNew]);

    return <span>{displayedText}</span>;
};

export function MoffiAssistant() {
    const { user } = useAuth();
    const { pets: userPets, activePet } = usePet();
    const router = useRouter();
    const pathname = usePathname();

    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Sessions
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    
    // Current Chat
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    // Settings

    const scrollRef = useRef<HTMLDivElement>(null);
    const dragConstraintsRef = useRef(null);

    // M+ Status
    const isPro = user?.role === 'admin' || user?.is_pro === true;
    const aiSettings = user?.settings?.ai || { personality: 'casual', creativity: 0.7, detailLevel: 'medium' };

    useEffect(() => {
        setIsMounted(true);
        loadSessions();
        
        const handleOpen = () => setIsOpen(true);
        const handleClose = () => setIsOpen(false);
        window.addEventListener('open-ai-assistant', handleOpen);
        window.addEventListener('close-ai-assistant', handleClose);
        return () => {
            window.removeEventListener('open-ai-assistant', handleOpen);
            window.removeEventListener('close-ai-assistant', handleClose);
        };
    }, []);

    // Load sessions & cleanup old ones
    const loadSessions = () => {
        try {
            const saved = localStorage.getItem('moffi_ai_sessions');
            if (saved) {
                let parsed: ChatSession[] = JSON.parse(saved);
                
                // Force 3 months retention (90 days)
                const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
                parsed = parsed.filter(s => s.updatedAt > cutoff);
                
                setSessions(parsed.sort((a,b) => b.updatedAt - a.updatedAt));
                if (parsed.length > 0) setActiveSessionId(parsed[0].id);
            }
        } catch (e) {
            console.error("Geçmiş yüklenemedi", e);
        }
    };

    const saveSessions = (newSessions: ChatSession[]) => {
        // Mark all existing messages as NOT new so they don't re-type on load
        const sanitized = newSessions.map(s => ({
            ...s,
            messages: s.messages.map(m => ({ ...m, isNew: false }))
        }));
        setSessions(sanitized);
        localStorage.setItem('moffi_ai_sessions', JSON.stringify(sanitized));
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isTyping, input]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || { id: 'temp', title: 'Yeni Sohbet', messages: [], updatedAt: Date.now() };

    const getGreeting = () => {
        if (aiSettings.personality === 'technical') return `Sistem Hazır. Analiz için komut bekliyorum. ⚡`;
        if (aiSettings.personality === 'professional') return `Size nasıl yardımcı olabilirim?`;
        return isPro ? `Selam dostum! Hadi harika bir şeyler yapalım! ✨` : `Selam! Moffi Asistanın burada. 🦴`;
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setIsSidebarOpen(false);
        setShowSettings(false);
    };

    const handleSend = async (e?: React.FormEvent, predefinedText?: string) => {
        if (e) e.preventDefault();
        const textToSend = predefinedText || input;
        if (!textToSend.trim() || isTyping) return;

        let currentSessionId = activeSessionId;
        const currentSessions = [...sessions];

        if (!currentSessionId) {
            // Create new session
            currentSessionId = Date.now().toString();
            const newSession: ChatSession = {
                id: currentSessionId,
                title: textToSend.substring(0, 30) + (textToSend.length > 30 ? '...' : ''),
                messages: [{ id: 'welcome', role: 'assistant', content: getGreeting() }],
                updatedAt: Date.now()
            };
            currentSessions.unshift(newSession);
            setActiveSessionId(currentSessionId);
        }

        const sessionIndex = currentSessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex === -1) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
        currentSessions[sessionIndex] = {
            ...currentSessions[sessionIndex],
            messages: [...currentSessions[sessionIndex].messages, userMessage],
            updatedAt: Date.now()
        };
        
        saveSessions(currentSessions);
        if (!predefinedText) setInput("");
        setIsTyping(true);

        const activePetObj = activePet || userPets?.[0] || null;
        let petDataPayload: Record<string, unknown> | null = null;
        if (activePetObj) {
            petDataPayload = { name: activePetObj.name, breed: activePetObj.breed || activePetObj.species || 'Bilinmeyen Cins' };
        }

        const lowerInput = textToSend.toLowerCase();
        let quickResponse: Message | null = null;
        
        if (lowerInput.includes('kayıp') || lowerInput.includes('kayboldu')) {
            quickResponse = { id: Date.now().toString(), role: 'assistant', content: 'Çok geçmiş olsun! Radar & Acil Durum Merkezini açarak çevredeki kullanıcılara bildirim gönderebiliriz.', action: { type: 'sos', label: '🚨 Radarı Aç' }, isNew: true };
        } else if (lowerInput.includes('vetline') || lowerInput.includes('veteriner') || lowerInput.includes('hasta')) {
            quickResponse = { id: Date.now().toString(), role: 'assistant', content: 'Canlı VetLine hizmetimiz ile uzman veteriner hekimlerimizle anında görüntülü görüşebilirsin.', action: { type: 'vetline', label: "🩺 VetLine'a Bağlan" }, isNew: true };
        } else if (lowerInput.includes('mama') || lowerInput.includes('yemek')) {
            quickResponse = { id: Date.now().toString(), role: 'assistant', content: 'Dostunun yaşına ve kilosuna özel mama seçeneklerini Petshopumuzda bulabilirsin!', action: { type: 'link', label: '🍎 Mamaları Gör', url: '/petshop?category=food' }, isNew: true };
        }

        if (quickResponse) {
            setTimeout(() => {
                const updatedSessions = [...sessions];
                const idx = updatedSessions.findIndex(s => s.id === currentSessionId);
                if (idx !== -1) {
                    updatedSessions[idx] = {
                        ...updatedSessions[idx],
                        messages: [...updatedSessions[idx].messages, quickResponse!],
                        updatedAt: Date.now()
                    };
                    saveSessions(updatedSessions);
                }
                setIsTyping(false);
            }, 800);
            return;
        }

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...currentSessions[sessionIndex].messages].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context: `AI Settings: personality=${aiSettings.personality}, detail=${aiSettings.detailLevel}`,
                    petData: petDataPayload
                })
            });
            const data = await response.json();
            
            const updatedSessions = [...sessions];
            const idx = updatedSessions.findIndex(s => s.id === currentSessionId);
            
            if (data.success && data.message && idx !== -1) {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.message || "Yanıt boş.",
                    isNew: true
                };
                updatedSessions[idx] = {
                    ...updatedSessions[idx],
                    messages: [...updatedSessions[idx].messages, aiMsg],
                    updatedAt: Date.now()
                };
                saveSessions(updatedSessions);
            } else {
                throw new Error(data.error || "Yanıt alınamadı");
            }
        } catch (apiError) {
            console.warn("Moffi AI API Failed, falling back to simulated response:", apiError);
            const updatedSessions = [...sessions];
            const idx = updatedSessions.findIndex(s => s.id === currentSessionId);
            if (idx !== -1) {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Üzgünüm, şu an sunucuya bağlanamıyorum. ${petDataPayload?.name || 'Dostun'} için kısa süre sonra tekrar dener misin? 🐾`,
                    isNew: true
                };
                updatedSessions[idx] = {
                    ...updatedSessions[idx],
                    messages: [...updatedSessions[idx].messages, aiMsg],
                    updatedAt: Date.now()
                };
                saveSessions(updatedSessions);
            }
        } finally {
            setIsTyping(false);
        }
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const filtered = sessions.filter(s => s.id !== id);
        saveSessions(filtered);
        if (activeSessionId === id) setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
    };

    const clearAllChats = () => {
        saveSessions([]);
        setActiveSessionId(null);
        setShowSettings(false);
        setShowClearConfirm(false);
    };

    if (!isMounted) return null;

    const messagesToRender = activeSession.messages.length > 0 
        ? activeSession.messages 
        : [{ id: 'welcome', role: 'assistant', content: getGreeting(), isNew: true }] as Message[];

    // Context-Aware Suggestions based on the current page route
    const getContextSuggestions = () => {
        const path = pathname || "";
        if (path.includes('/petshop')) {
            return [
                { icon: "🍎", text: "Özel Mama Bul", query: "Sepetime ve dostumun özelliklerine uygun en iyi mama hangisi?" },
                { icon: "🦴", text: "Ödül & Oyuncak", query: "Eğitim için en iyi ödül mamaları nelerdir?" },
                { icon: "🩺", text: "VetLine'a Danış", query: "Mama seçimi konusunda bir veterinere danışmak istiyorum." }
            ];
        }
        if (path.includes('/vet')) {
            return [
                { icon: "🩺", text: "Canlı VetLine", query: "Hemen canlı VetLine'a bağlanmak istiyorum." },
                { icon: "💉", text: "Aşı Takvimi", query: "Dostumun yaklaşan aşılarını kontrol edebilir misin?" },
                { icon: "🌡️", text: "Sağlık Analizi", query: "Dostum bugün biraz halsiz, ne yapmalıyım?" }
            ];
        }
        if (path.includes('/community') || path.includes('/radar')) {
            return [
                { icon: "🚨", text: "Kayıp Bildirimi", query: "Dostum kayboldu, acil radar bildirimi oluştur." },
                { icon: "👋", text: "Yeni Dostlar", query: "Yakın çevremdeki diğer patili dostları nasıl bulabilirim?" },
                { icon: "📸", text: "Aura Yükle", query: "Dostumun fotoğrafını Aura'da nasıl paylaşırım?" }
            ];
        }
        // Default (Home, Profile, etc.)
        return [
            { icon: "🩺", text: "VetLine Bağlan", query: "Canlı VetLine'a bağlanmak istiyorum." },
            { icon: "🍎", text: "Mama Önerisi", query: "Moffi için mama önerebilir misin?" },
            { icon: "🚨", text: "Kayıp Bildirimi", query: "Dostum kayboldu, ne yapmalıyım?" },
            { icon: "🏆", text: "Görevlerim", query: "Bugün yapabileceğim görevler neler?" }
        ];
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999]" ref={dragConstraintsRef}>
            {/* The Floating Action Button */}
            <motion.button
                drag
                dragConstraints={{ left: -100, right: 0, top: -100, bottom: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => {
                    setTimeout(() => setIsDragging(false), 150);
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
                onClick={(e) => {
                    e.preventDefault();
                    if (!isDragging && !isOpen) setIsOpen(true);
                }}
                className={cn(
                    "fixed bottom-24 right-5 w-[50px] h-[50px] bg-gradient-to-tr from-zinc-900 to-black border border-black/10 dark:border-white/10 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-colors group",
                    isOpen ? "pointer-events-none" : "pointer-events-auto"
                )}
                style={{ touchAction: "none", zIndex: 999999 }}
            >
                <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
            </motion.button>

            {/* FULL PANEL ASSISTANT - Draggable on Desktop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        drag
                        dragConstraints={dragConstraintsRef}
                        dragElastic={0.1}
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className={cn(
                            "fixed pointer-events-auto overflow-hidden flex",
                            "inset-0 md:inset-auto md:bottom-24 md:right-5 md:w-[420px] md:h-[600px] md:max-h-[85vh]",
                            "bg-background/95 md:bg-white dark:md:bg-[#1a1b1e] backdrop-blur-3xl md:rounded-[2rem] md:border md:border-gray-200 dark:md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                        )}
                        style={{ touchAction: "none" }}
                    >
                        
                        {/* SIDEBAR */}
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 240, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="h-full bg-gray-50 dark:bg-black/40 border-r border-gray-200 dark:border-white/5 flex flex-col overflow-hidden shrink-0"
                                >
                                    <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                                        <span className="font-bold text-sm text-foreground">Sohbetler</span>
                                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md">
                                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <div className="p-2 flex-1 overflow-y-auto space-y-1">
                                        <button 
                                            onClick={startNewChat}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-500/20 transition-colors mb-4"
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            Yeni Sohbet
                                        </button>
                                        
                                        <div className="text-[10px] font-bold uppercase text-muted-foreground px-3 py-1 tracking-wider">Geçmiş</div>
                                        {sessions.length === 0 && <div className="text-xs text-muted-foreground px-3 italic">Geçmiş bulunmuyor.</div>}
                                        {sessions.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => { setActiveSessionId(s.id); setIsSidebarOpen(false); setShowSettings(false); }}
                                                className={cn(
                                                    "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                                                    activeSessionId === s.id ? "bg-black/5 dark:bg-white/10 font-medium" : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{s.title}</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => deleteSession(e, s.id)} 
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* MAIN CHAT AREA */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                            {/* Drag Handle */}
                            <div className="hidden md:flex w-full h-6 items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>

                            {/* HEADER */}
                            <div className="px-4 py-3 bg-transparent border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="p-1.5 -ml-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-muted-foreground transition-colors"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", isPro ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-black dark:bg-white")}>
                                        {isPro ? <Crown className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white dark:text-black" />}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-[14px] font-black text-foreground uppercase tracking-tight leading-none">{isPro ? "M+ Concierge" : "Moffi AI"}</h3>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5 tracking-widest">{isTyping ? "Düşünüyor..." : "Çevrimiçi"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setShowSettings(!showSettings)} 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* BODY */}
                            <div className="flex-1 overflow-hidden relative">
                                
                                {/* SETTINGS OVERLAY */}
                                <AnimatePresence>
                                    {showSettings && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="absolute inset-0 z-50 bg-white dark:bg-[#1a1b1e] p-6 flex flex-col"
                                        >
                                            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                                <Settings className="w-5 h-5" />
                                                Asistan Ayarları
                                            </h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        Geçmişi Saklama Politikası
                                                    </label>
                                                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col gap-2">
                                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                                            Sistem Kontrolünde (3 Ay)
                                                        </span>
                                                        <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300 leading-relaxed">
                                                            Performans ve veri güvenliği standartlarımız gereği, asistan ile yaptığınız tüm görüşmeler sistem tarafından otomatik olarak <strong>maksimum 3 ay (90 gün)</strong> boyunca saklanır. Bu süreyi dolduran eski sohbetler cihazınızdan güvenle silinir.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                                    {!showClearConfirm ? (
                                                        <button 
                                                            onClick={() => setShowClearConfirm(true)}
                                                            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Tüm Geçmişi Temizle
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 text-center mb-1">
                                                                Tüm sohbetler kalıcı olarak silinecek. Emin misiniz?
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => setShowClearConfirm(false)}
                                                                    className="flex-1 py-2.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                                                                >
                                                                    İptal
                                                                </button>
                                                                <button 
                                                                    onClick={clearAllChats}
                                                                    className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
                                                                >
                                                                    Evet, Sil
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => { setShowSettings(false); setShowClearConfirm(false); }}
                                                className="mt-auto w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-sm hover:scale-[0.98] transition-transform"
                                            >
                                                Geri Dön
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* CHAT MESSAGES */}
                                <div ref={scrollRef} className="h-full p-4 overflow-y-auto flex flex-col gap-4 pb-36">
                                    {messagesToRender.map((msg, i) => (
                                        <motion.div
                                            key={msg.id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                                        >
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed relative",
                                                msg.role === 'user'
                                                    ? "bg-black dark:bg-white text-white dark:text-black rounded-tr-sm shadow-md"
                                                    : "bg-gray-100 dark:bg-white/5 text-foreground rounded-tl-sm shadow-sm"
                                            )}>
                                                {msg.role === 'assistant' 
                                                    ? <TypewriterText content={msg.content} isNew={msg.isNew} /> 
                                                    : msg.content}
                                                
                                                {msg.action && (
                                                    <motion.button 
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.5 }}
                                                        onClick={() => {
                                                            if (msg.action?.type === 'link') router.push(msg.action.url!);
                                                            else if (msg.action?.type === 'sos') router.push('/community?tab=radar');
                                                            else if (msg.action?.type === 'vetline') router.push('/vet');
                                                            setIsOpen(false);
                                                        }}
                                                        className="mt-3 w-full px-4 py-2.5 bg-white dark:bg-[#25262b] shadow-sm rounded-xl text-[12px] font-black text-indigo-500 border border-gray-200 dark:border-white/10 hover:border-indigo-500 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {msg.action.label}
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-75" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER INPUT */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 via-white/90 to-transparent dark:from-[#1a1b1e]/90 dark:via-[#1a1b1e]/90 backdrop-blur-sm">
                                
                                {/* Context-Aware Quick Suggestions */}
                                {messagesToRender.length <= 2 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
                                        {getContextSuggestions().map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(undefined, s.query)}
                                                className="snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-[11px] font-bold text-foreground shadow-sm hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                                            >
                                                <span>{s.icon}</span>
                                                {s.text}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={(e) => handleSend(e)} className="relative flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Moffi'ye bir şeyler sor..."
                                            className="w-full pl-5 pr-5 py-3.5 bg-gray-50/80 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl text-[14px] text-foreground focus:outline-none focus:border-indigo-500/50 shadow-inner backdrop-blur-md transition-colors"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={!input.trim() || isTyping}
                                        className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all hover:scale-105 active:scale-95 shadow-md"
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
