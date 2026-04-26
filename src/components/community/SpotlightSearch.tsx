'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, X, PawPrint, Stethoscope, 
    User, Calendar, ShoppingBag, 
    ChevronRight, Command, Zap,
    ArrowRight, Sparkles, MapPin, Play, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (type: string, id: string) => void;
}

export function SpotlightSearch({ isOpen, onClose, onNavigate }: SpotlightSearchProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isAIMode, setIsAIMode] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setIsAIMode(false);
            setAiResponse(null);
        }
    }, [isOpen]);

    const aiSuggestions = [
        { label: 'Milo için bugün ne yapmalıyım?', icon: <Zap className="w-3 h-3" /> },
        { label: 'Yakındaki en iyi köpek parkları nerede?', icon: <MapPin className="w-3 h-3" /> },
        { label: 'Beslenme tavsiyesi verebilir misin?', icon: <ShoppingBag className="w-3 h-3" /> },
        { label: 'Eğitim videoları göster', icon: <Play className="w-3 h-3" /> }
    ];

    const handleAISearch = async (text: string) => {
        setQuery(text);
        setIsAIMode(true);
        setIsAiThinking(true);
        setAiResponse(null);

        // Simulated AI Insight Generation
        setTimeout(() => {
            const insights = [
                "Milo'nun bugün enerjisi yüksek görünüyor! Hava Moda sahilinde yürüyüş için ideal. Yanına mutlaka su almayı unutma. 🐾☀️",
                "Kadıköy bölgesindeki 'Pati Parkı' şu an sakin görünüyor. Milo'nun sosyalleşmesi için harika bir fırsat olabilir!",
                "Milo'nun son öğünlerini analiz ettim. Tüy sağlığı için somon yağı takviyesi harika olabilir. Moffi Market'te şu an indirimde!",
                "Temel itaat eğitiminde 'bekle' komutuna odaklanabiliriz. Sana özel hazırladığım eğitim serisini izlemek ister misin?"
            ];
            setAiResponse(insights[Math.floor(Math.random() * insights.length)]);
            setIsAiThinking(false);
        }, 1500);
    };

    const suggestions = [
        { category: 'Hızlı Erişim', items: [
            { id: 'vax', label: 'Karma Aşı Tarihi', icon: <Calendar className="w-4 h-4" />, type: 'action' },
            { id: 'vet', label: 'En Yakın Veterinerler', icon: <Stethoscope className="w-4 h-4" />, type: 'action' }
        ]},
        { category: 'Patiler', items: [
            { id: '1', label: 'Milo (Golden)', icon: <PawPrint className="w-4 h-4" />, type: 'pet' },
            { id: '2', label: 'Luna (Tekir)', icon: <PawPrint className="w-4 h-4" />, type: 'pet' }
        ]},
        { category: 'Topluluk', items: [
            { id: 'sarah', label: 'Sarah Logs', icon: <User className="w-4 h-4" />, type: 'user' },
            { id: 'market', label: 'Moffi Market İndirimleri', icon: <ShoppingBag className="w-4 h-4" />, type: 'link' }
        ]}
    ];

    const filteredSuggestions = query.length === 0 ? suggestions : suggestions.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    })).filter(cat => cat.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-start justify-center pt-[8vh] px-4"
                    onClick={onClose}
                >
                    <motion.div
                        layout
                        initial={{ scale: 0.9, y: 40, filter: 'blur(20px)' }}
                        animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ scale: 0.9, y: 40, filter: 'blur(20px)' }}
                        className={cn(
                            "w-full max-w-2xl bg-background/40 border rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-500",
                            isAIMode ? "border-cyan-500/50 shadow-cyan-500/20" : "border-white/10"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* SEARCH INPUT AREA */}
                        <div className={cn(
                            "p-8 border-b flex flex-col gap-6 transition-all duration-500",
                            isAIMode ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/[0.02] border-white/10"
                        )}>
                            <div className="flex items-center gap-5">
                                <motion.div 
                                    animate={isAIMode ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                                        isAIMode ? "bg-cyan-500 text-white shadow-cyan-500/40" : "bg-white/5 text-secondary"
                                    )}
                                >
                                    {isAIMode ? <Sparkles className="w-6 h-6" /> : <Search className="w-6 h-6" />}
                                </motion.div>
                                <input 
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        if (e.target.value === '') {
                                            setIsAIMode(false);
                                            setAiResponse(null);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && query.length > 2) {
                                            handleAISearch(query);
                                        }
                                    }}
                                    placeholder={isAIMode ? "Moffi AI'a sor..." : "Pati, hizmet veya döküman ara..."}
                                    className="flex-1 bg-transparent border-none text-[var(--foreground)] text-2xl focus:outline-none placeholder:text-white/20 font-black tracking-tight"
                                />
                                <div className="flex items-center gap-3">
                                    {!isAIMode && (
                                        <button 
                                            onClick={() => {
                                                if (query) handleAISearch(query);
                                                else setIsAIMode(true);
                                            }}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 transition-all group"
                                        >
                                            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">AI Modu</span>
                                        </button>
                                    )}
                                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* SMART CHIPS (AI SUGGESTIONS) */}
                            <div className="flex flex-wrap gap-2">
                                {(isAIMode ? aiSuggestions : aiSuggestions.slice(0, 2)).map((chip, idx) => (
                                    <motion.button
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx}
                                        onClick={() => handleAISearch(chip.label)}
                                        className="px-4 py-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-full text-[11px] font-black text-white/40 hover:text-cyan-400 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                                    >
                                        {chip.icon}
                                        <span>{chip.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* RESULTS / AI RESPONSE AREA */}
                        <div className="max-h-[55vh] overflow-y-auto no-scrollbar relative min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {isAIMode ? (
                                    <motion.div 
                                        key="ai-view"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-8"
                                    >
                                        {isAiThinking ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-6">
                                                <div className="relative">
                                                    <motion.div 
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                        className="w-20 h-20 rounded-3xl border-2 border-cyan-500/20 border-t-cyan-500 flex items-center justify-center"
                                                    />
                                                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-white uppercase tracking-widest animate-pulse">Analiz Ediliyor...</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase mt-2 tracking-[0.2em]">Moffi Ecosystem Intelligence v2.4</p>
                                                </div>
                                            </div>
                                        ) : aiResponse && (
                                            <div className="space-y-8">
                                                <div className="p-8 bg-cyan-500/5 border border-cyan-500/20 rounded-[2.5rem] relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Sparkles className="w-20 h-20 text-cyan-400" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                                                                <Bot className="w-4 h-4 text-white" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Yapay Zeka Önerisi</span>
                                                        </div>
                                                        <p className="text-xl font-medium text-white/90 leading-relaxed italic">
                                                            "{aiResponse}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* AI DRIVEN ACTIONS */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <button onClick={() => onNavigate('action', 'vet')} className="p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl flex items-center gap-4 transition-all group">
                                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                                            <Stethoscope className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black text-white uppercase tracking-wider">Randevu Al</p>
                                                            <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">En Yakın Klinikler</p>
                                                        </div>
                                                    </button>
                                                    <button onClick={() => onNavigate('link', 'market')} className="p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl flex items-center gap-4 transition-all group">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                            <ShoppingBag className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black text-white uppercase tracking-wider">M+ Market</p>
                                                            <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">%15 İndirimli Ürünler</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="search-view"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-4"
                                    >
                                        {filteredSuggestions.length > 0 ? (
                                            filteredSuggestions.map((cat, i) => (
                                                <div key={i} className="mb-8">
                                                    <h4 className="px-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">{cat.category}</h4>
                                                    <div className="space-y-1">
                                                        {cat.items.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => { onNavigate(item.type, item.id); onClose(); }}
                                                                className="w-full p-5 rounded-[2rem] hover:bg-white/[0.03] border border-transparent hover:border-white/5 flex items-center justify-between group transition-all active:scale-[0.98]"
                                                            >
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all shadow-lg">
                                                                        {item.icon}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <span className="text-base font-black text-white/60 group-hover:text-white transition-colors uppercase tracking-tight">{item.label}</span>
                                                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">{item.type}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-24 flex flex-col items-center gap-6 opacity-40">
                                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                                                    <Zap className="w-10 h-10 text-white/40" />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.2em] text-white">Bulamadık Kral...</p>
                                                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest px-12 leading-relaxed">
                                                        Aradığın pati veya hizmet şu an radarımızda değil.<br/>
                                                        Yapay zeka ile derinlemesine aramaya ne dersin?
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => handleAISearch(query)}
                                                    className="mt-4 px-10 py-5 bg-cyan-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(34,211,238,0.4)] active:scale-95 transition-all"
                                                >
                                                    AI ANALİZİ BAŞLAT
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FOOTER */}
                        <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-8">
                                <div className="flex items-center gap-3">
                                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-black">ESC</kbd>
                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Kapat</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-black">ENTER</kbd>
                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">AI Danış</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
                                <span className="text-[10px] text-cyan-400/60 font-black uppercase tracking-[0.3em]">Moffi Spotlight AI v2.4</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
