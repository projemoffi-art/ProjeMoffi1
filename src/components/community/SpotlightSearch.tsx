'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, X, PawPrint, Stethoscope, 
    User, Calendar, ShoppingBag, 
    ChevronRight, Command, Zap,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (type: string, id: string) => void;
}

export function SpotlightSearch({ isOpen, onClose, onNavigate }: SpotlightSearchProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

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
                    className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="w-full max-w-xl bg-[#12121A] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* SEARCH INPUT */}
                        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
                            <Search className="w-6 h-6 text-cyan-400" />
                            <input 
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Pati, hizmet veya döküman ara..."
                                className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder:text-gray-600 font-medium"
                            />
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                                <Command className="w-3 h-3 text-gray-500" />
                                <span className="text-[10px] text-gray-500 font-black">K</span>
                            </div>
                        </div>

                        {/* RESULTS */}
                        <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
                            {filteredSuggestions.length > 0 ? (
                                filteredSuggestions.map((cat, i) => (
                                    <div key={i} className="mb-6">
                                        <h4 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3">{cat.category}</h4>
                                        <div className="space-y-1">
                                            {cat.items.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => { onNavigate(item.type, item.id); onClose(); }}
                                                    className="w-full p-4 rounded-2xl hover:bg-white/5 flex items-center justify-between group transition-all active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all">
                                                            {item.icon}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-300 group-hover:text-white">{item.label}</span>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center gap-4 opacity-20">
                                    <Zap className="w-12 h-12" />
                                    <p className="text-sm font-black uppercase tracking-widest text-center px-10 leading-loose">
                                        Bulamadık kral...<br/>
                                        Ama yapay zeka ile aramaya devam edebilirsin.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-500">↑↓</div>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Navigasyon</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-500">↵</div>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Seç</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-cyan-400/40 font-black uppercase tracking-widest">Moffi Spotlight v1.0</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
