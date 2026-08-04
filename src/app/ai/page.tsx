"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, Plus, Menu, Settings2, Trash2, Send, 
    Bot, User as UserIcon, X, Clock, ShieldCheck, Sparkles, 
    ChevronLeft, CheckCircle2, ChevronRight, Stethoscope, 
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { cn } from "@/lib/utils";

// Types for our chat system
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface ChatThread {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

interface AISettings {
    retentionMonths: number; // 0 means 'Session Only' (0), 1, 3, or 12
    tone: 'friendly' | 'professional' | 'concise';
    autoTitle: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
    retentionMonths: 3,
    tone: 'friendly',
    autoTitle: true,
};

export default function AIPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { activePet } = usePet();

    // Core States
    const [chats, setChats] = useState<ChatThread[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Chat States
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Load Data on Mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('moffi_ai_settings');
            if (savedSettings) setSettings(JSON.parse(savedSettings));

            const savedChats = localStorage.getItem('moffi_ai_chats');
            if (savedChats) {
                let parsedChats: ChatThread[] = JSON.parse(savedChats);
                
                // Retention Logic Enforcement
                const currentSettings: AISettings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
                if (currentSettings.retentionMonths > 0) {
                    const cutoffDate = new Date();
                    cutoffDate.setMonth(cutoffDate.getMonth() - currentSettings.retentionMonths);
                    const cutoffTimestamp = cutoffDate.getTime();
                    
                    parsedChats = parsedChats.filter(chat => chat.updatedAt > cutoffTimestamp);
                } else if (currentSettings.retentionMonths === 0) {
                    // Session only - clear everything on fresh mount
                    parsedChats = [];
                }
                
                setChats(parsedChats);
                if (parsedChats.length > 0 && currentSettings.retentionMonths > 0) {
                    setActiveChatId(parsedChats[0].id);
                } else {
                    startNewChat(false); // Start fresh without saving yet
                }
            } else {
                startNewChat(false);
            }
        } catch (e) {
            startNewChat(false);
        }
    }, []);

    // 2. Save Chats whenever they change
    useEffect(() => {
        if (chats.length > 0 && settings.retentionMonths > 0) {
            localStorage.setItem('moffi_ai_chats', JSON.stringify(chats));
        } else if (settings.retentionMonths === 0) {
            localStorage.removeItem('moffi_ai_chats');
        }
    }, [chats, settings.retentionMonths]);

    // 3. Save Settings whenever they change
    useEffect(() => {
        localStorage.setItem('moffi_ai_settings', JSON.stringify(settings));
    }, [settings]);

    // 4. Auto Scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chats, activeChatId, isTyping]);

    const activeChat = chats.find(c => c.id === activeChatId);

    const startNewChat = (saveEmpty: boolean = true) => {
        const newChat: ChatThread = {
            id: Date.now().toString(),
            title: "Yeni Sohbet ✨",
            messages: [],
            updatedAt: Date.now()
        };
        
        if (saveEmpty) {
            setChats(prev => [newChat, ...prev]);
        } else {
            // Just set it as a transient chat until the user types
            setChats([newChat]);
        }
        setActiveChatId(newChat.id);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const generateTitle = (firstMessage: string) => {
        if (!settings.autoTitle) return "Sohbet";
        // Simple mock title generator. In reality, you'd ask the LLM for a title.
        let title = firstMessage.substring(0, 25);
        if (firstMessage.length > 25) title += "...";
        return title;
    };

    const handleSend = async (e?: React.FormEvent, preset?: string) => {
        if (e) e.preventDefault();
        const textToSend = preset || input;
        if (!textToSend.trim() || isTyping) return;

        setInput("");
        setIsTyping(true);

        const userMsg: Message = {
            id: Date.now().toString() + "_u",
            role: "user",
            content: textToSend,
            timestamp: Date.now()
        };

        // If it's a completely empty chat, set the title
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const isFirst = chat.messages.length === 0;
                return {
                    ...chat,
                    title: isFirst ? generateTitle(textToSend) : chat.title,
                    messages: [...chat.messages, userMsg],
                    updatedAt: Date.now()
                };
            }
            return chat;
        }));

        // SIMULATE AI RESPONSE
        setTimeout(() => {
            let reply = "";
            const petName = activePet?.name || "dostun";

            if (textToSend.toLowerCase().includes("aşı")) {
                reply = `${petName} için aşı takvimi çok önemlidir. Karma, Kuduz ve Lyme gibi temel aşıların eksik olup olmadığını kontrol etmemi ister misin?`;
            } else if (textToSend.toLowerCase().includes("mama") || textToSend.toLowerCase().includes("beslenme")) {
                reply = settings.tone === 'professional' 
                    ? `Günlük kalori hesabı ${petName} kilosu ve aktivite düzeyine göre yapılmalıdır. Lütfen güncel kilosunu giriniz.`
                    : `${petName} mamasını çok seviyor olmalı! 🍎 Sağlıklı bir diyet için ideal ölçüyü beraber hesaplayalım.`;
            } else {
                reply = settings.tone === 'concise' 
                    ? `Anlaşıldı. Bu konu hakkında verileri analiz ediyorum.` 
                    : `Harika bir soru! ${petName} ile aranızdaki bu bağı görmek çok güzel. Sana hemen yardımcı oluyorum.`;
            }

            const aiMsg: Message = {
                id: Date.now().toString() + "_a",
                role: "assistant",
                content: reply,
                timestamp: Date.now()
            };

            setChats(prev => prev.map(chat => {
                if (chat.id === activeChatId) {
                    return { ...chat, messages: [...chat.messages, aiMsg], updatedAt: Date.now() };
                }
                return chat;
            }));
            
            setIsTyping(false);
        }, 1500);
    };

    const deleteChat = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) {
            startNewChat(false);
        }
    };

    // --- RENDER HELPERS ---
    const groupChatsByTime = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups = {
            today: [] as ChatThread[],
            yesterday: [] as ChatThread[],
            previous: [] as ChatThread[]
        };

        chats.forEach(chat => {
            if (chat.messages.length === 0) return; // Hide empty chats in history
            const chatDate = new Date(chat.updatedAt);
            if (chatDate >= today) groups.today.push(chat);
            else if (chatDate >= yesterday) groups.yesterday.push(chat);
            else groups.previous.push(chat);
        });

        return groups;
    };

    const groupedChats = groupChatsByTime();

    return (
        <main className="h-[100dvh] w-full flex bg-background font-sans overflow-hidden">
            
            {/* SIDEBAR (Desktop & Mobile Drawer) */}
            <AnimatePresence>
                {(isSidebarOpen || window.innerWidth > 768) && (
                    <>
                        {/* Mobile Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        
                        <motion.aside 
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed md:static inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-[#131316] border-r border-gray-200 dark:border-white/10 flex flex-col shadow-2xl md:shadow-none"
                        >
                            {/* Sidebar Header */}
                            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                                <button 
                                    onClick={() => router.push('/home')}
                                    className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => startNewChat()}
                                    className="flex-1 flex items-center gap-2 mx-2 px-3 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors font-bold text-[13px]"
                                >
                                    <Plus className="w-4 h-4" /> Yeni Sohbet
                                </button>
                                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Chat History List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
                                {groupedChats.today.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Bugün</h4>
                                        <div className="space-y-1">
                                            {groupedChats.today.map(chat => (
                                                <ChatItem key={chat.id} chat={chat} isActive={activeChatId === chat.id} onClick={() => { setActiveChatId(chat.id); setIsSidebarOpen(false); }} onDelete={(e) => deleteChat(e, chat.id)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {groupedChats.yesterday.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Dün</h4>
                                        <div className="space-y-1">
                                            {groupedChats.yesterday.map(chat => (
                                                <ChatItem key={chat.id} chat={chat} isActive={activeChatId === chat.id} onClick={() => { setActiveChatId(chat.id); setIsSidebarOpen(false); }} onDelete={(e) => deleteChat(e, chat.id)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {groupedChats.previous.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Önceki {settings.retentionMonths > 0 ? \`(\${settings.retentionMonths} Ay)\` : ''}</h4>
                                        <div className="space-y-1">
                                            {groupedChats.previous.map(chat => (
                                                <ChatItem key={chat.id} chat={chat} isActive={activeChatId === chat.id} onClick={() => { setActiveChatId(chat.id); setIsSidebarOpen(false); }} onDelete={(e) => deleteChat(e, chat.id)} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {chats.filter(c => c.messages.length > 0).length === 0 && (
                                    <div className="text-center p-6 text-gray-400 dark:text-gray-600 text-[12px] font-medium">
                                        Henüz kaydedilmiş bir sohbetin yok.
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-white/5">
                                <button 
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-[13px] font-bold"
                                >
                                    <Settings2 className="w-4 h-4" /> Asistan Ayarları
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col h-full bg-[#f8f9fc] dark:bg-[#09090b] relative">
                
                {/* Header */}
                <header className="h-16 shrink-0 border-b border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-[14px] font-black text-gray-900 dark:text-white leading-tight">Moffi AI</h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{settings.tone} mod</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat Scroll Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32">
                    {activeChat?.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                <Bot className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h2 className="text-[24px] font-black text-gray-900 dark:text-white tracking-tight mb-2">Nasıl yardımcı olabilirim?</h2>
                            <p className="text-[13px] text-gray-500 font-medium mb-8">Evcil dostunuzun sağlığı, beslenmesi veya aşı takvimi hakkında aklınıza takılan her şeyi sorabilirsiniz.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                <button onClick={() => handleSend(undefined, "Aşı takvimi nasıl olmalı?")} className="p-4 rounded-2xl bg-white dark:bg-[#131316] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left group">
                                    <Stethoscope className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Aşı takvimi nasıl olmalı?</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Temel aşılar hakkında bilgi al.</p>
                                </button>
                                <button onClick={() => handleSend(undefined, "Kilo kontrolü için ne yapmalıyım?")} className="p-4 rounded-2xl bg-white dark:bg-[#131316] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 transition-all text-left group">
                                    <AlertCircle className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Kilo kontrolü önerileri</p>
                                    <p className="text-[11px] text-gray-500 mt-1">İdeal mama porsiyonunu öğren.</p>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {activeChat?.messages.map((m) => (
                                <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", m.role === 'user' ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10")}>
                                        {m.role === 'user' ? <UserIcon className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className={cn(
                                            "px-5 py-3.5 rounded-3xl text-[14px] md:text-[15px] leading-relaxed shadow-sm", 
                                            m.role === 'user' 
                                                ? "bg-indigo-600 text-white font-medium rounded-tr-sm" 
                                                : "bg-white dark:bg-[#131316] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-tl-sm font-normal"
                                        )}>
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3 flex-row">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-sm">
                                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 animate-pulse" />
                                    </div>
                                    <div className="bg-white dark:bg-[#131316] px-5 py-4 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-1.5 rounded-tl-sm">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
                    <div className="max-w-3xl mx-auto relative">
                        <form onSubmit={handleSend} className="relative flex items-end bg-white dark:bg-[#131316] border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 p-2 overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                            <textarea 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Mesajınızı yazın..."
                                rows={1}
                                className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 py-3 min-h-[44px] max-h-[120px] text-[14px] md:text-[15px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 custom-scrollbar"
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 mb-1 mr-1"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-gray-400 font-medium mt-3 px-4">
                            Moffi AI hata yapabilir. Önemli konularda lütfen fiziksel veterinerinize danışın.
                        </p>
                    </div>
                </div>

            </div>

            {/* SETTINGS MODAL */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#131316] border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                        <Settings2 className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-gray-900 dark:text-white leading-tight">Asistan Ayarları</h3>
                                        <p className="text-[11px] font-bold text-gray-500">Moffi AI Deneyimini Özelleştir</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSettingsOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:scale-105 active:scale-95 text-gray-500 transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                
                                {/* Retention Settings */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <h4 className="text-[13px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Sohbet Geçmişi</h4>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium mb-3">Geçmiş konuşmalarının cihazında ne kadar süre saklanacağını seç.</p>
                                    
                                    <div className="grid grid-cols-1 gap-2">
                                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all", settings.retentionMonths === 3 ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5")}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" checked={settings.retentionMonths === 3} onChange={() => setSettings(s => ({...s, retentionMonths: 3}))} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">Standart (3 Ay)</p>
                                                    <p className="text-[11px] text-gray-500">Önerilen saklama süresi.</p>
                                                </div>
                                            </div>
                                        </label>
                                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all", settings.retentionMonths === 1 ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5")}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" checked={settings.retentionMonths === 1} onChange={() => setSettings(s => ({...s, retentionMonths: 1}))} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">Kısa (1 Ay)</p>
                                                    <p className="text-[11px] text-gray-500">Alan tasarrufu sağlar.</p>
                                                </div>
                                            </div>
                                        </label>
                                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all", settings.retentionMonths === 0 ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5")}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" checked={settings.retentionMonths === 0} onChange={() => setSettings(s => ({...s, retentionMonths: 0}))} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">Sadece Bu Oturum</p>
                                                    <p className="text-[11px] text-gray-500">Uygulama kapanınca geçmiş silinir.</p>
                                                </div>
                                            </div>
                                            <ShieldCheck className="w-5 h-5 text-gray-400" />
                                        </label>
                                    </div>
                                </div>

                                {/* Tone Settings */}
                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                        <h4 className="text-[13px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Asistanın Tarzı</h4>
                                    </div>
                                    <div className="flex bg-gray-100 dark:bg-black/30 p-1.5 rounded-2xl">
                                        <button onClick={() => setSettings(s => ({...s, tone: 'friendly'}))} className={cn("flex-1 py-2 rounded-xl text-[12px] font-bold transition-all", settings.tone === 'friendly' ? "bg-white dark:bg-[#252529] shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700")}>Dostane</button>
                                        <button onClick={() => setSettings(s => ({...s, tone: 'professional'}))} className={cn("flex-1 py-2 rounded-xl text-[12px] font-bold transition-all", settings.tone === 'professional' ? "bg-white dark:bg-[#252529] shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700")}>Profesyonel</button>
                                        <button onClick={() => setSettings(s => ({...s, tone: 'concise'}))} className={cn("flex-1 py-2 rounded-xl text-[12px] font-bold transition-all", settings.tone === 'concise' ? "bg-white dark:bg-[#252529] shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700")}>Kısa & Net</button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                    <button onClick={() => {
                                        if(confirm("Tüm sohbet geçmişi kalıcı olarak silinecek. Emin misiniz?")) {
                                            setChats([]);
                                            localStorage.removeItem('moffi_ai_chats');
                                            startNewChat(false);
                                            setIsSettingsOpen(false);
                                        }
                                    }} className="w-full py-3 rounded-2xl border border-red-200 dark:border-red-500/20 text-red-500 font-bold text-[13px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                        Tüm Sohbet Geçmişini Temizle
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
        </main>
    );
}

// Subcomponent for Sidebar Item
function ChatItem({ chat, isActive, onClick, onDelete }: { chat: ChatThread, isActive: boolean, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                <span className="text-[13px] font-bold truncate">{chat.title}</span>
            </div>
            {isActive && (
                <button 
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-all shrink-0"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
