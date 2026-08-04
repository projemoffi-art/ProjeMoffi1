'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, X, PawPrint,
    User, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (type: string, id: string) => void;
}

export function SpotlightSearch({ isOpen, onClose, onNavigate }: SpotlightSearchProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<{ profiles: any[], posts: any[], pets: any[] }>({ profiles: [], posts: [], pets: [] });
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults({ profiles: [], posts: [], pets: [] });
        }
    }, [isOpen]);

    // REAL-TIME GLOBAL SEARCH EFFECT
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const searchData = await apiService.globalSearch(query);
                    setResults(searchData);
                } catch (error) {
                    console.error("Global search error:", error);
                } finally {
                    setIsLoading(false);
                }
            } else if (query.length < 2) {
                setResults({ profiles: [], posts: [], pets: [] });
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const dynamicCategories = [
        { category: 'Kullanıcılar', items: results.profiles.map(p => ({ id: p.id, label: `@${p.username}`, icon: <User className="w-4 h-4" />, type: 'user' })) },
        { category: 'Patiler', items: results.pets.map(p => ({ id: p.id, label: `${p.name}`, icon: <PawPrint className="w-4 h-4" />, type: 'pet' })) },
        { category: 'Gönderiler', items: results.posts.map(p => ({ id: p.id, label: p.desc?.substring(0, 30) + '...', icon: <ArrowRight className="w-4 h-4" />, type: 'post' })) }
    ].filter(cat => cat.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[4000] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
                    onClick={onClose}
                >
                    <motion.div
                        layout
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        className="w-full max-w-2xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* SEARCH INPUT AREA */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-4">
                            <Search className="w-6 h-6 text-gray-400" />
                            <input 
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Kullanıcı, pati veya içerik ara..."
                                className="flex-1 bg-transparent border-none text-[var(--foreground)] text-lg focus:outline-none placeholder:text-gray-400 font-medium"
                            />
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* RESULTS AREA */}
                        <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key="search-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4"
                                >
                                    {isLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-6 h-6 border-2 border-gray-200 dark:border-white/10 border-t-cyan-500 rounded-full"
                                            />
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Aranıyor...</p>
                                        </div>
                                    ) : query.length >= 2 && dynamicCategories.length > 0 ? (
                                        dynamicCategories.map((cat, i) => (
                                            <div key={i} className="mb-6 last:mb-0">
                                                <h4 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{cat.category}</h4>
                                                <div className="space-y-1">
                                                    {cat.items.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => { onNavigate(item.type, item.id); onClose(); }}
                                                            className="w-full p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group transition-colors"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-cyan-500 transition-colors">
                                                                    {item.icon}
                                                                </div>
                                                                <div className="text-left">
                                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.label}</span>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-cyan-500 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : query.length >= 2 ? (
                                        <div className="py-16 flex flex-col items-center gap-4 text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Sonuç bulunamadı</p>
                                                <p className="text-xs text-gray-500 mt-1">Farklı bir kelimeyle tekrar aramayı dene.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center gap-3 opacity-60">
                                            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm text-gray-500 font-medium">Aramak istediğin kelimeyi yazmaya başla...</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
