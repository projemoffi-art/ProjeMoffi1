'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Bell, Lock, Bookmark, HelpCircle, 
    LogOut, ChevronLeft, ChevronRight, MessageCircle, Send,
    Activity, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

interface SettingsRowProps {
    icon: any;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

function SettingsRow({ icon: Icon, label, onClick, danger }: SettingsRowProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]",
                danger ? "bg-red-500/5 hover:bg-red-500/10" : "bg-white/5 hover:bg-white/10"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    danger ? "bg-red-500/10 text-red-500" : "bg-white/5 text-gray-400"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={cn("font-bold text-sm", danger ? "text-red-500" : "text-[var(--foreground)]")}>{label}</span>
            </div>
            <ChevronRight className={cn("w-5 h-5", danger ? "text-red-500/40" : "text-gray-600")} />
        </button>
    );
}

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeView: 'main' | 'privacy' | 'notifications' | 'help';
    setActiveView: (val: any) => void;
    kvkkToggles: any;
    setKvkkToggles: (fn: (p: any) => any) => void;
    onLogout: () => void;
}

export function SettingsDrawer({
    isOpen,
    onClose,
    activeView,
    setActiveView,
    kvkkToggles,
    setKvkkToggles,
    onLogout
}: SettingsDrawerProps) {
    const { theme, setTheme } = useTheme();
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Arka Plan (Backdrop) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    />
                    
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 h-[80%] bg-[var(--background)] backdrop-blur-3xl z-[100] rounded-t-[2.5rem] border-t border-white/10 p-6 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 cursor-pointer" onClick={onClose} />

                        <AnimatePresence mode="wait">
                            {activeView === 'main' && (
                                <motion.div
                                    key="main"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="flex flex-col h-full"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-black text-[var(--foreground)]">Ayarlar</h2>
                                        <button 
                                            onClick={onClose}
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                                    {/* Tema Seçici */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Görünüm</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'apple-light', label: 'Apple Light', color: 'bg-[#FFFFFF]', border: 'border-blue-500/50' },
                                                { id: 'apple-midnight', label: 'Apple Midnight', color: 'bg-[#1C1C1E]', border: 'border-blue-500/50' },
                                                { id: 'neo-dark', label: 'Neo Dark', color: 'bg-[#0A0A0E]', border: 'border-white/20' },
                                                { id: 'glass-pink', label: 'Glass Pink', color: 'bg-[#1A0B14]', border: 'border-pink-500/30' },
                                                { id: 'mint-fresh', label: 'Mint Fresh', color: 'bg-[#0B1A14]', border: 'border-emerald-500/30' }
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id as any)}
                                                    className={cn(
                                                        "relative h-20 rounded-2xl border-2 transition-all overflow-hidden active:scale-95",
                                                        theme === t.id ? t.border : "border-transparent bg-white/5"
                                                    )}
                                                >
                                                    <div className={cn("absolute inset-0 opacity-40", t.color)} />
                                                    <div className="relative h-full flex flex-col items-center justify-center gap-1">
                                                        {theme === t.id && (
                                                            <div className="absolute top-2 right-2">
                                                                <Check className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        <span className={cn("text-[10px] font-black uppercase", t.id === 'apple-light' ? "text-black" : "text-white")}>{t.label}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <SettingsRow icon={Bell} label="Bildirim Tercihleri" onClick={() => setActiveView('notifications')} />
                                        <SettingsRow icon={Lock} label="KVKK, Gizlilik ve Güvenlik" onClick={() => setActiveView('privacy')} />
                                        <hr className="border-white/5 my-4" />
                                        <SettingsRow icon={HelpCircle} label="Yardım ve Destek" onClick={() => setActiveView('help')} />
                                        <SettingsRow icon={LogOut} label="Çıkış Yap" danger onClick={onLogout} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {/* (Other views abbreviated for now, can be restored as needed) */}
                    </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
