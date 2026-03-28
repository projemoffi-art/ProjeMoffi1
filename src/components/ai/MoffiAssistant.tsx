"use client";

import { useState, useRef, useEffect } from "react";
import {
    X, Sparkles, BrainCircuit, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChat } from "ai/react";

// --- QUICK SUGGESTIONS ---
const QUICK_SUGGESTIONS = [
    "Halsiz görünüyor 🤒",
    "Aşı zamanı geldi mi? 💉",
    "Ne kadar mama yemeli? 🍖",
    "Kaka rengi tuhaf 💩"
];

export function MoffiAssistant({
    isEmbedded = false,
    isOpenOverride,
    onCloseOverride
}: {
    isEmbedded?: boolean,
    isOpenOverride?: boolean,
    onCloseOverride?: () => void
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = isOpenOverride !== undefined ? isOpenOverride : internalIsOpen;
    
    // --- DRAG-AWARE CLICK LOGIC ---
    const isDraggingRef = useRef(false);
    
    const setIsOpen = (val: boolean) => {
        if (onCloseOverride && !val) onCloseOverride();
        setInternalIsOpen(val);
    };

    const handleOrbClick = () => {
        if (!isDraggingRef.current) {
            setIsOpen(true);
        }
    };

    // --- REAL AI HOOK ---
    const { messages, input, handleInputChange, handleSubmit, append, isLoading, error } = useChat({
        api: '/api/chat',
        initialMessages: [
            { id: 'initial-ai', role: 'assistant', content: "Merhaba! Ben Moffi AI. Evcil dostunla ilgili her şeyi bana sorabilirsin! 🐶🐱" }
        ]
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleQuickReply = (text: string) => {
        append({ role: 'user', content: text });
    };

    return (
        <>
            {/* APPLE-STYLE NEBULA ORB BUTTON */}
            <AnimatePresence>
                {!isOpen && isOpenOverride === undefined && (
                    <motion.button
                        drag
                        dragMomentum={false}
                        onDragStart={() => isDraggingRef.current = true}
                        onDragEnd={() => {
                            // Short timeout to prevent the immediate click event after drag
                            setTimeout(() => isDraggingRef.current = false, 100);
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOrbClick}
                        className={cn(
                            "z-[110] w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing group overflow-hidden",
                            isEmbedded ? "relative" : "fixed top-5 right-18"
                        )}
                    >
                        {/* MINIMALIST GLASS CORE */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/20 shadow-sm" />
                        
                        {/* SUBTLE INNER GLOW (BREATHING) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 to-purple-400/10 animate-pulse opacity-40" />
                        
                        {/* ICON */}
                        <Sparkles className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors relative z-10" />

                        {/* STATUS DOT (Smaller) */}
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.4)]" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* APPLE-STYLE CHAT INTERFACE OVERLAY */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(20px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(20px)" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-6 right-6 z-[250] w-[92vw] md:w-[420px] h-[640px] max-h-[85vh] bg-[#1C1C1E]/80 backdrop-blur-[40px] rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col overflow-hidden"
                    >
                        {/* HEADER - Minimalist Apple Style */}
                        <div className="p-6 pb-4 flex justify-between items-center relative z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5856D6] to-[#AF52DE] p-[2px]">
                                    <div className="w-full h-full rounded-[14px] bg-black/40 backdrop-blur-md flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 animate-nebula-glow" />
                                        <BrainCircuit className="w-6 h-6 text-white relative z-10" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white tracking-tight">Moffi AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                                        <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Yardımcı Aktif</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 border border-white/5"
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* MESSAGES AREA */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex flex-col group",
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[88%] p-4 px-5 rounded-[22px] text-[15px] leading-relaxed font-medium shadow-sm transition-all",
                                        msg.role === 'user'
                                            ? "bg-[#007AFF] text-white rounded-tr-sm shadow-[0_5px_15px_rgba(0,122,255,0.2)]"
                                            : "bg-white/10 text-white/95 border border-white/10 rounded-tl-sm backdrop-blur-md"
                                    )}>
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} className={cn(i > 0 && "mt-2")}>{line}</p>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-white/20 mt-1.5 font-bold uppercase tracking-widest px-1">
                                        {msg.role === 'user' ? 'GÖNDERİLDİ' : 'MOFFI AI'}
                                    </span>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 p-4 pl-0">
                                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                </motion.div>
                            )}
                            
                            {/* ERROR DISPLAY (Simplified) */}
                            {error && (
                                <div className="p-2 mx-auto w-fit text-[10px] text-red-500 opacity-70">
                                    Bağlantı kesildi, tekrar deneniyor...
                                </div>
                            )}
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-6 pt-2 bg-transparent relative">
                            {/* Suggestions */}
                            {messages.length < 3 && !isLoading && (
                                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                                    {QUICK_SUGGESTIONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleQuickReply(s)}
                                            className="whitespace-nowrap bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[13px] font-bold text-white/80 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-sm group-focus-within:bg-cyan-500/10 transition-all" />
                                <input
                                    type="text"
                                    value={input ?? ''}
                                    onChange={handleInputChange}
                                    placeholder="Nasıl yardımcı olabilirim?"
                                    className="w-full h-14 bg-white/10 backdrop-blur-md rounded-[24px] pl-6 pr-14 outline-none border border-white/10 focus:border-white/30 transition-all font-semibold text-[15px] text-white placeholder:text-white/30 relative z-10 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!(input ?? '').trim() || isLoading}
                                    className="absolute right-2.5 top-2.5 w-9 h-9 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-90 z-20 shadow-lg"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                        
                        {/* FOOTER DECORATION */}
                        <div className="h-6 w-full bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center">
                            <div className="w-24 h-1 bg-white/10 rounded-full mb-2" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
