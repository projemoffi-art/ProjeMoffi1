"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Sparkles, Crown, 
    Check, Type as TypeIcon,
    Box, Info, ShieldCheck,
    Zap, Footprints, Lock
} from "lucide-react";
import confetti from 'canvas-confetti';
import { cn } from "@/lib/utils";
import { useAuraEngine } from "@/hooks/useAuraEngine";
import { ProCheckoutModal } from "@/components/shared/ProCheckoutModal";

interface AuraStyleStudioProps {
    isOpen: boolean;
    onClose: () => void;
    isPremium: boolean;
    currentSettings: {
        fontFamily: string;
        frameStyle: 'minimal' | 'glass' | 'neon' | 'metal';
        accentColor: string;
        badges: string[];
    }
    onUpdateSettings: (settings: any) => void;
}

const ACCENT_COLORS = [
    { id: 'default', color: '#6366F1', name: 'Original' },
    { id: 'midnight', color: '#1E293B', name: 'Midnight' },
    { id: 'silver', color: '#E2E8F0', name: 'Arctic' },
    { id: 'ocean', color: '#0EA5E9', name: 'Azure' },
    { id: 'emerald', color: '#10B981', name: 'Forest' },
    { id: 'rose', color: '#FB7185', name: 'Rose Gold' },
    { id: 'champagne', color: '#FDE68A', name: 'Champagne' },
    { id: 'violet', color: '#8B5CF6', name: 'Electric' },
];

const getColorHex = (id: string, defaultColor: string) => {
    const color = ACCENT_COLORS.find(c => c.id === id);
    return id === 'default' ? defaultColor : (color ? color.color : defaultColor);
};

const FONTS = [
    { id: 'font-sans', name: 'Modern Sans', icon: <TypeIcon className="w-4 h-4" />, isPro: false },
    { id: 'font-playfair', name: 'Classic Serif', icon: <TypeIcon className="w-4 h-4 font-serif" />, isPro: false },
    { id: 'italic', name: 'Stylized Italic', icon: <TypeIcon className="w-4 h-4 italic" />, isPro: false },
    { id: 'font-mono', name: 'Cyber Mono', icon: <TypeIcon className="w-4 h-4" />, isPro: false },
    { id: 'font-pacifico', name: 'Pacifico', icon: <TypeIcon className="w-4 h-4" />, isPro: true },
    { id: 'font-satisfy', name: 'Signature', icon: <TypeIcon className="w-4 h-4" />, isPro: true },
];

const FRAMES = [
    { id: 'minimal', name: 'Pure Minimal', desc: 'Sade ve Şık', isPro: false },
    { id: 'glass', name: 'Apple Glass', desc: 'Buzlu Cam Etkisi', isPro: false },
    { id: 'neon', name: 'Cyber Neon', desc: 'Enerjik Işıltı', isPro: true },
    { id: 'metal', name: 'Elite Metal', desc: 'Premium Doku', isPro: true },
];

const BADGES = [
    { id: 'verified', name: 'Doğrulanmış', icon: <ShieldCheck className="w-3 h-3 text-emerald-400" /> },
    { id: 'premium', name: 'M+ Pro', icon: <Crown className="w-3 h-3 text-orange-400" /> },
    { id: 'walker', name: 'Aktif Yürüyüşçü', icon: <Footprints className="w-3 h-3 text-cyan-400" /> },
    { id: 'sos', name: 'SOS Gönüllüsü', icon: <Zap className="w-3 h-3 text-red-500" /> },
];

export default function AuraStyleStudio({ isOpen, onClose, isPremium, currentSettings, onUpdateSettings }: AuraStyleStudioProps) {
    const { aura } = useAuraEngine();
    const [activeTab, setActiveTab] = useState<'style' | 'font' | 'color' | 'badges'>('style');
    const [settings, setSettings] = useState(currentSettings);
    const [isCelebrating, setIsCelebrating] = useState(false);
    const [isPro, setIsPro] = useState(isPremium);
    const [showCheckout, setShowCheckout] = useState(false);

    const triggerCelebration = () => {
        const colorHex = getColorHex(settings.accentColor, aura.color);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [colorHex, '#6366F1', '#FFFFFF'],
            ticks: 200,
            gravity: 1.2
        });
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 3000);
    };

    const updateSetting = (key: string, value: any) => {
        if (key === 'frameStyle' || key === 'fontFamily') {
            const list = key === 'frameStyle' ? FRAMES : FONTS;
            const item = list.find((i: any) => i.id === value);
            if (item?.isPro && !isPro) {
                setShowCheckout(true);
                return;
            }
        }
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleBadge = (badgeId: string) => {
        const currentBadges = settings.badges || [];
        const newBadges = currentBadges.includes(badgeId)
            ? currentBadges.filter(id => id !== badgeId)
            : [...currentBadges, badgeId];
        updateSetting('badges', newBadges);
    };

    const handleApply = () => {
        triggerCelebration();
        onUpdateSettings(settings);
        setTimeout(onClose, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[8000] bg-black/80 backdrop-blur-xl"
                    />

                    {/* Studio Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 inset-x-0 z-[8001] bg-[#0A0A0E] border-t border-white/10 rounded-t-[3.5rem] shadow-[0_-20px_100px_rgba(0,0,0,1)] flex flex-col max-h-[92vh] overflow-hidden"
                    >
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />

                        {/* Export Header */}
                        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-foreground italic tracking-tighter uppercase leading-none">Aura Creator</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                    Dynamic Identity Studio
                                </p>
                            </div>
                            <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/10">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 pt-6">
                            {/* PREVIEW SECTION */}
                            <div className="relative mb-12 p-1">
                                <div className="absolute -inset-4 bg-gradient-to-b from-accent/10 to-transparent blur-3xl opacity-50" />
                                <div className="relative rounded-[3.5rem] p-8 bg-card border border-card-border overflow-hidden shadow-2xl">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-foreground/5 border-4 border-card overflow-hidden shadow-2xl">
                                            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-center space-y-4 flex flex-col items-center w-full">
                                            <motion.div
                                                className={cn(
                                                    "w-fit flex items-center gap-2 transition-all duration-500",
                                                    settings.frameStyle === 'minimal' && "px-0",
                                                    settings.frameStyle === 'glass' && "px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl",
                                                    settings.frameStyle === 'neon' && "px-4 py-1.5 rounded-lg bg-black/40 border-[0.5px] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]",
                                                    settings.frameStyle === 'metal' && "px-4 py-1.5 rounded-md bg-gradient-to-br from-gray-700 to-black border border-white/10"
                                                )}
                                            >
                                                <div 
                                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                                    style={{ backgroundColor: getColorHex(settings.accentColor, aura.color) }}
                                                />
                                                <span 
                                                    className={cn(
                                                        "relative z-10 text-[9px] font-black uppercase tracking-[0.5em] transition-all duration-500",
                                                        settings.fontFamily === 'font-serif' && "font-serif",
                                                        settings.fontFamily === 'font-mono' && "font-mono",
                                                        settings.fontFamily === 'italic' && "italic",
                                                        settings.fontFamily === 'font-pacifico' && "font-pacifico lowercase !tracking-widest",
                                                        settings.fontFamily === 'font-satisfy' && "font-satisfy lowercase !tracking-widest",
                                                        settings.fontFamily === 'font-playfair' && "font-playfair",
                                                    )}
                                                    style={{ 
                                                        color: (settings.frameStyle === 'glass' || settings.frameStyle === 'metal') ? '#FFFFFF' : getColorHex(settings.accentColor, aura.color),
                                                        textShadow: settings.frameStyle === 'neon' ? `0 0 10px ${getColorHex(settings.accentColor, aura.color)}` : 
                                                                   settings.frameStyle === 'glass' ? `0 2px 4px rgba(0,0,0,0.3)` : 'none'
                                                    }}
                                                >
                                                    {aura.name}
                                                </span>

                                                {/* BADGES */}
                                                <div className="flex items-center gap-1 relative z-10 border-l border-white/10 pl-2 ml-1">
                                                    {BADGES.filter(b => (settings.badges || []).includes(b.id)).map(b => (
                                                        <div key={b.id} title={b.name} className="flex items-center justify-center">
                                                            {b.icon}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Profil Görünümü</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex bg-foreground/5 p-1.5 rounded-[2rem] mb-10 border border-card-border overflow-x-auto no-scrollbar">
                                {(['style', 'font', 'color', 'badges'] as const).map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)} 
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                                            activeTab === tab ? "bg-foreground text-background shadow-lg" : "text-secondary"
                                        )}
                                    >
                                        {tab === 'style' ? 'Stil' : tab === 'font' ? 'Font' : tab === 'color' ? 'Renk' : 'Rozet'}
                                    </button>
                                ))}
                            </div>

                            {/* OPTIONS GRID */}
                            <div className="space-y-8">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'style' && (
                                        <motion.div key="style" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-2 gap-4">
                                            {FRAMES.map((f) => (
                                                <button 
                                                    key={f.id} 
                                                    onClick={() => updateSetting('frameStyle', f.id)}
                                                    className={cn(
                                                        "p-4 rounded-[2.5rem] border text-left transition-all hover:scale-[1.02] active:scale-95 group",
                                                        settings.frameStyle === f.id ? "bg-white/10 border-white/40" : "bg-white/5 border-white/5"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <Box className={cn("w-5 h-5", settings.frameStyle === f.id ? "text-indigo-400" : "text-gray-600")} />
                                                        {f.isPro && !isPro && <Crown className="w-4 h-4 text-orange-400 opacity-50" />}
                                                    </div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{f.name}</p>
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase mt-1 italic">{f.desc}</p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === 'font' && (
                                        <motion.div key="font" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                                            {FONTS.map((f) => (
                                                <button 
                                                    key={f.id}
                                                    onClick={() => updateSetting('fontFamily', f.id)}
                                                    className={cn(
                                                        "w-full p-6 rounded-[2rem] border flex items-center justify-between transition-all",
                                                        settings.fontFamily === f.id ? "bg-white/10 border-white/40" : "bg-white/5 border-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white relative">
                                                            {f.icon}
                                                            {f.isPro && !isPro && <div className="absolute -top-1 -right-1"><Crown className="w-3 h-3 text-orange-400" /></div>}
                                                        </div>
                                                        <span className="text-sm font-black text-white uppercase tracking-widest">{f.name}</span>
                                                    </div>
                                                    {settings.fontFamily === f.id && <Check className="w-5 h-5 text-indigo-400" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === 'color' && (
                                        <motion.div key="color" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-4 gap-4">
                                            {ACCENT_COLORS.map((color) => (
                                                <button
                                                    key={color.id}
                                                    onClick={() => updateSetting('accentColor', color.id)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full border-2 transition-all relative overflow-hidden",
                                                        settings.accentColor === color.id ? "border-white scale-110 shadow-lg" : "border-transparent"
                                                    )}
                                                >
                                                    <div className="absolute inset-0" style={{ backgroundColor: color.color }} />
                                                    {settings.accentColor === color.id && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Check className="w-4 h-4 text-white" /></div>}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === 'badges' && (
                                        <motion.div key="badges" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                                            {BADGES.map((b) => (
                                                <button 
                                                    key={b.id}
                                                    onClick={() => toggleBadge(b.id)}
                                                    className={cn(
                                                        "w-full p-5 rounded-[2rem] border flex items-center justify-between transition-all",
                                                        (settings.badges || []).includes(b.id) ? "bg-white/10 border-white/40" : "bg-white/5 border-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{b.icon}</div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{b.name}</p>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">Kapsülde Göster</p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-6 rounded-full relative transition-all flex items-center px-1",
                                                        (settings.badges || []).includes(b.id) ? "bg-emerald-500" : "bg-white/10"
                                                    )}>
                                                        <motion.div 
                                                            animate={{ x: (settings.badges || []).includes(b.id) ? 16 : 0 }}
                                                            className="w-4 h-4 bg-white rounded-full shadow-lg" 
                                                        />
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={handleApply} className="w-full mt-12 py-6 bg-foreground text-background rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                                Değişiklikleri Uygula
                            </button>
                        </div>
                    </motion.div>

                    {/* CELEBRATION OVERLAY */}
                    <AnimatePresence>
                        {isCelebrating && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md"
                            >
                                <motion.div 
                                    initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} 
                                    className="bg-background p-10 rounded-[4rem] text-center border border-card-border"
                                >
                                    <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter mb-2">Aura Uyumlandı</h2>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.3em]">Moffi Identity Synchronized</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* PRO MODAL */}
                    <ProCheckoutModal 
                        isOpen={showCheckout}
                        onClose={() => setShowCheckout(false)}
                        onSuccess={() => {
                            setIsPro(true);
                            triggerCelebration();
                        }}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
