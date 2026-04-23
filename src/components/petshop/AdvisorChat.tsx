"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, MessageCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "ai";
    content: string;
}

const QUICK_QUESTIONS = [
    "Milo için en iyi mama hangisi?",
    "Bugün çok yürüdük, ne yedirmeliyim?",
    "Tüy dökülmesi için ne önerirsin?",
    "Diş sağlığı için bir tavsiyen var mı?"
];

export default function AdvisorChat({ isOpen, onClose, isSmartEnabled = true }: { isOpen: boolean; onClose: () => void; isSmartEnabled?: boolean }) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const initialMsg = isSmartEnabled 
                ? "Selam! Ben Moffi AI Beslenme Danışmanı. Milo'nun bugünkü verilerine baktım, oldukça hareketli bir gün geçirmiş. Ona nasıl yardımcı olabilirim? ✨"
                : "Selam! Ben Moffi AI. Gizlilik tercihlerinden dolayı şu an Milo'nun verilerine erişemiyorum ama sana genel ürün tavsiyeleri vermekten mutluluk duyarım. 😊";
            setMessages([{ role: "ai", content: initialMsg }]);
        }
    }, [isOpen, isSmartEnabled, messages.length]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        
        const newMessages: Message[] = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        // Simulated AI logic
        setTimeout(() => {
            let aiResponse = "";
            
            if (!isSmartEnabled) {
                aiResponse = "Milo'nun özel verilerine erişemediğim için genel bir öneri yapabilirim: 'Pro Plan' serisi çoğu evcil hayvan için dengeli bir başlangıçtır. Daha spesifik bir öneri istersen ayarlardan akıllı mağazayı açabilirsin!";
            } else {
                aiResponse = "Anlıyorum. Milo'nun aktif yaşam tarzı için yüksek proteinli mamalar harika bir seçenek olacaktır. Özellikle 'Acana Wild Prairie' bu ara çok tercih ediliyor.";
                if (text.toLocaleLowerCase().includes("yürüdük")) {
                    aiResponse = "Harika bir yürüyüş! 🐾 Milo'nun kas gelişimi ve toparlanması için yüksek enerjili 'Churu Ton Balıklı' gibi ödülleri tavsiye ederim. Antrenman sonrası için idealdir.";
                } else if (text.toLocaleLowerCase().includes("tüy")) {
                    aiResponse = "Mevsim geçişlerinde tüy dökülmesi normaldir, ancak 'Furminator' bakım fırçası ve somon yağlı mamalar bu süreci çok daha konforlu hale getirir.";
                }
            }
            
            setMessages([...newMessages, { role: "ai", content: aiResponse }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-[#0A0A0A] rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] flex flex-col max-h-[80vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 pt-6 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-950 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-5 h-5 text-white dark:text-gray-900" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Beslenme Danışmanı</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canlı Destek · Çevrimiçi</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gray-50/50 dark:bg-black/20">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm",
                                        m.role === "user" 
                                            ? "bg-gray-900 text-white ml-auto rounded-tr-none" 
                                            : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 mr-auto rounded-tl-none border border-gray-100 dark:border-white/5"
                                    )}
                                >
                                    {m.content}
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-1 ml-2 p-2 bg-white dark:bg-white/5 rounded-2xl w-14 justify-center">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                        </div>

                        {/* Quick Questions */}
                        <div className="px-6 py-4 bg-white dark:bg-black/40 border-t border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar flex gap-2">
                            {QUICK_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(q)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5 whitespace-nowrap transition-colors italic uppercase tracking-tighter"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-6 pb-10 pt-4 bg-white dark:bg-black/60">
                            <div className="relative group">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSend(input)}
                                    placeholder="Milo için bir soru sor..."
                                    className="w-full h-14 pl-6 pr-16 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-medium focus:bg-white dark:focus:bg-black/20 outline-none transition-all"
                                />
                                <button
                                    onClick={() => handleSend(input)}
                                    className="absolute right-2 top-2 w-10 h-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 mt-3 uppercase tracking-widest justify-center">
                                <Info className="w-3 h-3" />
                                Öneriler Milo'nun güncel sağlık verilerine dayalıdır
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
