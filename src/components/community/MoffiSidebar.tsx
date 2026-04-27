'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Plus, QrCode, Zap, 
    Settings, Palette, ShieldAlert, Check,
    Footprints, Droplets, Heart, Sun, MapPin, Bell,
    Mic, X, Save, Navigation, Flag,
    ShoppingBag, Stethoscope, Gamepad2, Wallet, Radar, Syringe,
    Tv, Users, Edit3, Map, Search, HeartHandshake, Megaphone, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useRouter } from 'next/navigation';

interface SidebarWidget {
    id: string;
    label: string;
    icon: any;
    color: string;
    action: () => void;
    value?: string;
}

export function MoffiSidebar() {
    const { user, updateSettings } = useAuth();
    const router = useRouter();
    const { 
        activeMode, setActiveMode, 
        walkData, startWalk, stopWalk,
        recTime 
    } = useActivity();
    
    // Get edge settings from user object or use defaults
    const edgeSettings = user?.settings?.edge || {
        hapticsEnabled: true,
        handleOpacity: 0.2,
        glassBlur: 80,
        capsulePrivate: false,
        activeActions: ['ai', 'post', 'qr', 'mood', 'steps', 'weather']
    };

    const [isOpen, setIsOpen] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [showPanelPrefs, setShowPanelPrefs] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Local states for instant feedback (Optimistic UI)
    const [hapticsEnabled, setHapticsEnabled] = useState(edgeSettings.hapticsEnabled);
    const [handleOpacity, setHandleOpacity] = useState(edgeSettings.handleOpacity);
    const [glassBlur, setGlassBlur] = useState(edgeSettings.glassBlur);
    const [capsulePrivate, setCapsulePrivate] = useState(edgeSettings.capsulePrivate);

    // Sync local state when user object changes (e.g. from another device)
    useEffect(() => {
        if (user?.settings?.edge) {
            setHapticsEnabled(user.settings.edge.hapticsEnabled);
            setHandleOpacity(user.settings.edge.handleOpacity);
            setGlassBlur(user.settings.edge.glassBlur);
            setCapsulePrivate(user.settings.edge.capsulePrivate);
        }
    }, [user?.settings?.edge]);

    const triggerHaptic = useCallback((intensity: number = 10) => {
        if (!hapticsEnabled) return;
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(intensity);
        }
    }, [hapticsEnabled]);

    const updateEdgeSetting = async (key: string, value: any) => {
        // Instant update
        if (key === 'hapticsEnabled') setHapticsEnabled(value);
        if (key === 'handleOpacity') setHandleOpacity(value);
        if (key === 'glassBlur') setGlassBlur(value);
        if (key === 'capsulePrivate') setCapsulePrivate(value);

        // Persistent update (Supabase/AuthContext)
        await updateSettings('edge', { [key]: value });
    };

    const activeActions = edgeSettings.activeActions;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const ALL_WIDGETS: SidebarWidget[] = [
        { id: 'ai', label: 'AI Asistan', icon: Sparkles, color: 'from-indigo-500 to-purple-600', action: () => window.dispatchEvent(new CustomEvent('open-ai-assistant')) },
        { id: 'post', label: 'Paylaş', icon: Plus, color: 'from-emerald-400 to-teal-600', action: () => window.dispatchEvent(new CustomEvent('open-add-post')) },
        { id: 'qr', label: 'Pasaport', icon: QrCode, color: 'from-amber-400 to-orange-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'passport' })) },
        { id: 'mood', label: 'Ruh Hali', icon: Zap, color: 'from-pink-400 to-rose-600', action: () => window.dispatchEvent(new CustomEvent('open-moffi-navigate', { detail: 'mood-selector' })) },
        { id: 'sos', label: 'SOS', icon: ShieldAlert, color: 'from-red-500 to-red-700', action: () => window.dispatchEvent(new CustomEvent('open-sos-center')) },
        { id: 'studio', label: 'Aura', icon: Palette, color: 'from-cyan-400 to-blue-600', action: () => window.dispatchEvent(new CustomEvent('open-aura-studio')) },
        { id: 'voice', label: 'Sesli Not', icon: Mic, color: 'from-orange-400 to-red-500', action: () => { triggerHaptic(30); setActiveMode('voice'); setIsOpen(true); } },
        { id: 'steps', label: 'Yürüyüş', icon: Footprints, color: 'from-blue-400 to-indigo-500', value: '4.2k', action: () => { triggerHaptic(30); startWalk(); setIsOpen(true); } },
        { id: 'weather', label: 'Hava', icon: Sun, color: 'from-yellow-400 to-orange-500', value: '24°', action: () => window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: 'Hava bugün 24°C, yürüyüş için ideal! ☀️', icon: 'Sun', color: 'text-yellow-400' } })) },
        { id: 'water', label: 'Su', icon: Droplets, color: 'from-cyan-400 to-blue-500', value: '80%', action: () => window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: 'Dostun bugün 800ml su içti. 💧', icon: 'Droplets', color: 'text-cyan-400' } })) },
        { id: 'health', label: 'Sağlık', icon: Heart, color: 'from-rose-400 to-red-500', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'vet' })) },
        { id: 'map', label: 'Konum', icon: MapPin, color: 'from-emerald-400 to-green-600', action: () => window.dispatchEvent(new CustomEvent('open-moffi-maps')) },
        { id: 'notif', label: 'Bildirim', icon: Bell, color: 'from-purple-400 to-fuchsia-600', value: '3', action: () => window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: '3 yeni topluluk bildirimi bekliyor.', icon: 'Bell', color: 'text-purple-400' } })) },
        { id: 'market', label: 'Market', icon: ShoppingBag, color: 'from-amber-500 to-yellow-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'shop' })) },
        { id: 'vet', label: 'Veteriner', icon: Stethoscope, color: 'from-blue-600 to-cyan-700', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'vet' })) },
        { id: 'game', label: 'Oyunlar', icon: Gamepad2, color: 'from-purple-600 to-pink-700', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'game' })) },
        { id: 'wallet', label: 'Cüzdan', icon: Wallet, color: 'from-emerald-500 to-green-700', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'wallet' })) },
        { id: 'radar', label: 'Radar', icon: Radar, color: 'from-orange-500 to-red-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'radar' })) },
        { id: 'vaccine', label: 'Aşılar', icon: Syringe, color: 'from-red-400 to-rose-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'appointments' })) },
        { id: 'tv', label: 'Moffi TV', icon: Tv, color: 'from-rose-500 to-indigo-700', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'feed' })) },
        { id: 'family', label: 'Aile', icon: Users, color: 'from-blue-400 to-blue-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'family' })) },
        { id: 'diary', label: 'Günlük', icon: Edit3, color: 'from-yellow-500 to-amber-700', action: () => window.dispatchEvent(new CustomEvent('open-moffi-diary')) },
        { id: 'places', label: 'Mekanlar', icon: Map, color: 'from-green-500 to-emerald-700', action: () => window.dispatchEvent(new CustomEvent('open-moffi-maps')) },
        { id: 'search', label: 'Arama', icon: Search, color: 'from-gray-400 to-gray-600', action: () => window.dispatchEvent(new CustomEvent('open-moffi-spotlight')) },
        { id: 'adoption', label: 'Sahiplendir', icon: HeartHandshake, color: 'from-rose-400 to-pink-600', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'adoption' })) },
        { id: 'lost_report', label: 'Kayıp Bildir', icon: Megaphone, color: 'from-orange-400 to-red-500', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'lost_pet' })) }
    ];

    const currentWidgets = useMemo(() => {
        if (searchTerm.trim()) {
            return ALL_WIDGETS.filter(w => 
                w.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return ALL_WIDGETS.filter(w => activeActions.includes(w.id));
    }, [activeActions, searchTerm]);

    const pinnedWidgets = useMemo(() => {
        if (searchTerm.trim()) return [];
        return ALL_WIDGETS.filter(w => ['ai', 'sos', 'steps', 'qr'].includes(w.id));
    }, [searchTerm]);

    const dynamicWidgets = useMemo(() => {
        return currentWidgets.filter(w => !pinnedWidgets.some(p => p.id === w.id));
    }, [currentWidgets, pinnedWidgets]);

    return (
        <div className="fixed inset-y-0 right-0 z-[9999] pointer-events-none flex items-center">
            {/* PERMANENT EDGE HANDLE (SAMSUNG STYLE) */}
            <motion.div
                key="edge-handle"
                whileHover={{ scaleY: 1.05 }}
                onClick={() => { triggerHaptic(20); setIsOpen(true); }}
                onPanEnd={(_, info) => {
                    // Trigger panel on left swipe without moving the handle physically
                    if (info.offset.x < -15 || info.velocity.x < -100) {
                        triggerHaptic(25);
                        setIsOpen(true);
                    }
                }}
                // Massive invisible hit area, perfectly fixed to the right edge
                className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer w-12 h-36 flex items-center justify-end pr-[2px] touch-none z-[9998]"
            >
                {/* The visible premium bar - High Contrast Dynamic Support */}
                <div 
                    style={{ opacity: handleOpacity }}
                    className="w-1.5 h-24 bg-foreground/60 backdrop-blur-3xl shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)] rounded-l-full group-hover:bg-foreground/80 transition-all duration-300" 
                />
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setIsOpen(false); setIsConfiguring(false); setSearchTerm(''); }}
                            className="fixed inset-0 bg-black/10 backdrop-blur-[3px] pointer-events-auto z-[-1]"
                        />

                        <motion.div
                            initial={{ x: "120%" }} 
                            animate={{ x: 0 }} 
                            exit={{ x: "120%" }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={{ left: 0, right: 0.5 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.x > 80) {
                                    triggerHaptic(20);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }
                            }}
                            transition={{ type: "spring", damping: 30, stiffness: 220 }}
                            style={{ backdropFilter: `blur(${glassBlur}px)` }}
                            className="w-48 h-[88vh] max-h-[750px] bg-[#0c0c0c]/85 border-l border-white/10 pointer-events-auto shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col p-5 rounded-l-[3.5rem] relative"
                        >
                            {/* SEARCH BAR (Klas & Minimalist) */}
                            <div className="relative mb-6 group shrink-0">
                                <input 
                                    type="text"
                                    placeholder="Nereye gidelim?.."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-8 bg-transparent border-b border-white/5 rounded-none pl-1 pr-8 text-[11px] font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all tracking-tight"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* LIVE CAPSULE */}
                            <motion.div
                                layout
                                initial={false}
                                animate={{
                                    height: activeMode !== 'none' ? 128 : 48,
                                    width: activeMode !== 'none' ? "120%" : "100%",
                                    x: activeMode !== 'none' ? "-10%" : "0%",
                                    backgroundColor: activeMode !== 'none' ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.8)",
                                }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className={cn(
                                    "z-50 border border-white/10 rounded-[2rem] mb-4 flex flex-col items-center justify-center overflow-hidden relative shrink-0",
                                    activeMode === 'walk' ? "shadow-[0_0_40px_rgba(16,185,129,0.15)] border-emerald-500/30" : 
                                    activeMode === 'voice' ? "shadow-[0_0_40px_rgba(244,63,94,0.15)] border-rose-500/30" : 
                                    activeMode === 'sos' ? "shadow-[0_0_50_px_rgba(239,68,68,0.4)] border-red-500" :
                                    activeMode === 'ai' ? "shadow-[0_0_40px_rgba(168,85,247,0.3)] border-purple-500/30" :
                                    activeMode === 'order' ? "shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/30" :
                                    "shadow-none"
                                )}
                            >
                                {/* BREATHING / SIREN GLOW EFFECTS */}
                                {activeMode !== 'none' && (
                                    <motion.div 
                                        animate={{ 
                                            opacity: activeMode === 'sos' ? [0.4, 0.8, 0.4] : [0.2, 0.5, 0.2],
                                            backgroundColor: activeMode === 'sos' ? ["#ef4444", "#3b82f6", "#ef4444"] : undefined
                                        }}
                                        transition={{ repeat: Infinity, duration: activeMode === 'sos' ? 0.6 : 3 }}
                                        className={cn(
                                            "absolute inset-0 blur-3xl opacity-20",
                                            activeMode === 'walk' ? "bg-emerald-500" : 
                                            activeMode === 'voice' ? "bg-rose-500" : 
                                            activeMode === 'ai' ? "bg-purple-600" :
                                            activeMode === 'order' ? "bg-amber-500" : ""
                                        )}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center w-full">
                                    {activeMode === 'none' ? (
                                        <motion.div layout className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Moffi Live</span>
                                        </motion.div>
                                    ) : activeMode === 'sos' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                            <div className="flex items-center justify-between w-full mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">SOS AKTİF</span>
                                                    <span className="text-[12px] font-black text-white leading-tight mt-1">YARDIM YOLDA</span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-bounce shadow-lg shadow-red-500/40">
                                                    <ShieldAlert className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <button onClick={() => { triggerHaptic(100); setActiveMode('none'); }} className="w-full py-2 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest">ALARMIP KAPAT</button>
                                        </motion.div>
                                    ) : activeMode === 'ai' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                            <div className="flex flex-col items-center gap-2 mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Moffi AI</span>
                                                </div>
                                                <span className="text-[12px] font-black text-white text-center italic">"Seni dinliyorum..."</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[...Array(12)].map((_, i) => (
                                                    <motion.div key={i} animate={{ 
                                                        height: [4, Math.random() * 20 + 5, 4],
                                                        backgroundColor: ["#a855f7", "#06b6d4", "#a855f7"]
                                                    }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.03 }} className="w-1 rounded-full" />
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : activeMode === 'order' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                            <div className="flex items-center justify-between w-full mb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sipariş Durumu</span>
                                                    <span className="text-[14px] font-black text-white leading-none mt-1">Kurye Yolda 🛵</span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div initial={{ x: "-100%" }} animate={{ x: "60%" }} className="absolute inset-y-0 w-full bg-amber-500" />
                                            </div>
                                            <span className="text-[8px] font-black text-white/40 uppercase mt-2 tracking-widest">Teslimat: 8-12 dk</span>
                                        </motion.div>
                                    ) : activeMode === 'voice' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                            <div className="flex items-center justify-between w-full mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Kayıt</span>
                                                    <span className="text-[14px] font-black text-white leading-none mt-1">{capsulePrivate ? '••:••' : formatTime(recTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(8)].map((_, i) => (
                                                        <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }} className="w-0.5 bg-rose-500 rounded-full" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 w-full mt-1">
                                                <button onClick={() => { triggerHaptic(10); setActiveMode('none'); }} className="flex-1 py-1.5 bg-white/5 text-white/60 rounded-lg font-black text-[8px] uppercase border border-white/5">İPTAL</button>
                                                <button onClick={() => { triggerHaptic(40); setActiveMode('none'); alert('Sesli not kaydedildi! 🐾'); }} className="flex-1 py-1.5 bg-rose-500 text-white rounded-lg font-black text-[8px] uppercase shadow-lg shadow-rose-500/20">KAYDET</button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                            <div className="flex items-center justify-between w-full mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Yürüyüş</span>
                                                    <span className="text-[18px] font-black text-white leading-none mt-1">
                                                        {capsulePrivate ? '•••' : (walkData.distance >= 1000 ? `${(walkData.distance / 1000).toFixed(2)}km` : `${Math.floor(walkData.distance)}m`)}
                                                    </span>
                                                </div>
                                                <motion.div 
                                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
                                                    transition={{ repeat: Infinity, duration: 2 }} 
                                                    className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-inner"
                                                >
                                                    <Navigation className="w-5 h-5 text-emerald-400" />
                                                </motion.div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full mt-1">
                                                <button onClick={() => { triggerHaptic(20); router.push('/walk/tracking'); setIsOpen(false); }} className="flex-1 py-2 bg-white/5 text-white/80 rounded-xl font-black text-[8px] uppercase tracking-wider border border-white/5 transition-colors hover:bg-white/10">TAKİP</button>
                                                <button onClick={() => { triggerHaptic(50); stopWalk(); }} className="flex-1 py-2 bg-emerald-500 text-black rounded-xl font-black text-[8px] uppercase tracking-wider shadow-lg shadow-emerald-500/20">BİTİR</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            {/* WIDGET GRID */}
                            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-1">
                                {/* PINNED SECTION (Only show if not searching) */}
                                {pinnedWidgets.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 ml-1">Öncelikli Araçlar</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                            {pinnedWidgets.map((widget, index) => (
                                                <motion.button
                                                    key={`pinned-${widget.id}`}
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => { 
                                                        triggerHaptic(15); 
                                                        widget.action(); 
                                                        if(widget.id !== 'steps') { setIsOpen(false); setSearchTerm(''); }
                                                    }}
                                                    className="flex flex-col items-center gap-1.5 group"
                                                >
                                                    <div className="w-[50px] h-[50px] rounded-[1.2rem] bg-white/15 backdrop-blur-3xl border border-white/30 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:bg-white/25 transition-colors">
                                                        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", widget.color)}>
                                                            <widget.icon className="w-5.5 h-5.5 text-white drop-shadow-md" strokeWidth={2.8} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[7.5px] font-black text-white/80 uppercase tracking-tighter text-center group-hover:text-white transition-colors">{widget.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!searchTerm && pinnedWidgets.length > 0 && (
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
                                )}

                                {/* SEARCH RESULTS OR DYNAMIC SECTION */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                    {dynamicWidgets.map((widget, index) => (
                                        <motion.button
                                            key={widget.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.04 }}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { 
                                                triggerHaptic(15); 
                                                widget.action(); 
                                                if(widget.id !== 'voice' && widget.id !== 'steps') { setIsOpen(false); setSearchTerm(''); }
                                            }}
                                            className="flex flex-col items-center gap-1.5 group"
                                        >
                                            {/* Button Container (Samsung Glass Style) */}
                                            <div className="w-[50px] h-[50px] rounded-[1.2rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-xl relative overflow-hidden group-hover:bg-white/20 transition-colors">
                                                {/* Inner Gradient Icon */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                                                    widget.color
                                                )}>
                                                    <widget.icon className="w-5.5 h-5.5 text-white drop-shadow-md" strokeWidth={2.5} />
                                                </div>
                                            </div>
                                            
                                            {/* Label / Value */}
                                            <div className="flex flex-col items-center max-w-[65px]">
                                                <span className="text-[7.5px] font-black text-white/80 uppercase tracking-tighter text-center group-hover:text-white transition-colors truncate w-full">{widget.label}</span>
                                                {widget.value && (
                                                    <span className="text-[9px] font-black text-emerald-400 mt-0.5">{widget.value}</span>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                                
                                {searchTerm && dynamicWidgets.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                        <Search className="w-8 h-8 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">Sonuç bulunamadı</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-center border-t border-white/5 pt-4">
                                <button onClick={() => { triggerHaptic(20); setIsConfiguring(!isConfiguring); }} className={cn("w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500", isConfiguring ? "bg-white text-black rotate-180" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white")}><Settings className="w-5 h-5" /></button>
                            </div>

                            {/* CONFIGURATION CENTER */}
                            <AnimatePresence>
                                {isConfiguring && (
                                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute inset-0 bg-[#080808]/98 z-50 flex flex-col p-5 border-l border-white/10 rounded-l-[3.5rem]">
                                        {/* COLLAPSIBLE HEADER */}
                                        <div 
                                            onClick={() => { triggerHaptic(10); setShowPanelPrefs(!showPanelPrefs); }}
                                            className="flex flex-col items-center mb-4 mt-2 cursor-pointer group"
                                        >
                                            <h3 className="text-[10px] font-black text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-[0.3em]">PANEL AYARLARI</h3>
                                            <motion.div 
                                                animate={{ 
                                                    width: showPanelPrefs ? "40px" : "24px",
                                                    backgroundColor: showPanelPrefs ? "#f59e0b" : "rgba(255,255,255,0.1)"
                                                }}
                                                className="h-1 mt-2 rounded-full relative overflow-hidden"
                                            >
                                                {showPanelPrefs && <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-white/20" />}
                                            </motion.div>
                                        </div>
                                        
                                        {/* PREMIUM LINEAR CONTROLS */}
                                        <AnimatePresence>
                                            {showPanelPrefs && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                    animate={{ height: "auto", opacity: 1, marginBottom: 40 }}
                                                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                    className="px-2 overflow-hidden flex flex-col gap-6"
                                                >
                                                    {/* BLUR CONTROL TRACK */}
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Bulanıklık Derinliği</span>
                                                            <span className="text-[8px] font-black text-indigo-400">{glassBlur === 10 ? 'SAF' : glassBlur === 40 ? 'HAFİF' : 'YOĞUN'}</span>
                                                        </div>
                                                        <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.03] rounded-full border border-white/5">
                                                            {[10, 40, 80].map((level) => (
                                                                <button 
                                                                    key={level}
                                                                    onClick={() => { triggerHaptic(15); updateEdgeSetting('glassBlur', level); }}
                                                                    className="flex-1 h-full relative z-10 group"
                                                                >
                                                                    <div className={cn(
                                                                        "absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-1 rounded-full transition-all duration-500",
                                                                        glassBlur === level ? "bg-indigo-500 shadow-[0_-4px_12px_rgba(99,102,241,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                                    )} />
                                                                    {glassBlur === level && (
                                                                        <motion.div 
                                                                            layoutId="blur-active-indicator"
                                                                            className="absolute inset-x-1 inset-y-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30"
                                                                        />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* HANDLE VISIBILITY TRACK */}
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Tutacak Görünümü</span>
                                                            <span className="text-[8px] font-black text-amber-400">{handleOpacity < 0.3 ? 'HAYALET' : handleOpacity < 0.6 ? 'SOFT' : 'BELİRGİN'}</span>
                                                        </div>
                                                        <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.03] rounded-full border border-white/5">
                                                            {[0.1, 0.4, 0.9].map((op) => (
                                                                <button 
                                                                    key={op}
                                                                    onClick={() => { triggerHaptic(15); updateEdgeSetting('handleOpacity', op); }}
                                                                    className="flex-1 h-full relative z-10 group"
                                                                >
                                                                    <div className={cn(
                                                                        "absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-1 rounded-full transition-all duration-500",
                                                                        handleOpacity === op ? "bg-amber-500 shadow-[0_-4px_12px_rgba(245,158,11,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                                    )} />
                                                                    {handleOpacity === op && (
                                                                        <motion.div 
                                                                            layoutId="op-active-indicator"
                                                                            className="absolute inset-x-1 inset-y-1.5 bg-amber-500/20 rounded-lg border border-amber-500/30"
                                                                        />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* TOGGLE TRACKS (Haptic & Privacy) */}
                                                    <div className="flex items-center gap-4 px-1 pt-2">
                                                        <button 
                                                            onClick={() => { updateEdgeSetting('hapticsEnabled', !hapticsEnabled); triggerHaptic(25); }}
                                                            className="flex-1 flex flex-col gap-3 group"
                                                        >
                                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">Titreşim</span>
                                                            <div className="h-4 w-full bg-white/[0.03] rounded-full relative overflow-hidden border border-white/5 p-0.5">
                                                                <motion.div 
                                                                    animate={{ x: hapticsEnabled ? "0%" : "-100%" }}
                                                                    className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <div className={cn("w-1 h-1 rounded-full transition-colors duration-500", hapticsEnabled ? "bg-white" : "bg-white/10")} />
                                                                </div>
                                                            </div>
                                                        </button>

                                                        <button 
                                                            onClick={() => { updateEdgeSetting('capsulePrivate', !capsulePrivate); triggerHaptic(25); }}
                                                            className="flex-1 flex flex-col gap-3 group"
                                                        >
                                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">Gizlilik</span>
                                                            <div className="h-4 w-full bg-white/[0.03] rounded-full relative overflow-hidden border border-white/5 p-0.5">
                                                                <motion.div 
                                                                    animate={{ x: capsulePrivate ? "0%" : "-100%" }}
                                                                    className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <div className={cn("w-1 h-1 rounded-full transition-colors duration-500", capsulePrivate ? "bg-white" : "bg-white/10")} />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* AI CONFIGURATION SECTION */}
                                                    <div className="pt-4 mt-2 border-t border-white/5 flex flex-col gap-6">
                                                        <div className="px-1 flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.3em]">AI ASİSTAN AYARLARI</span>
                                                            <Sparkles className="w-3 h-3 text-violet-500/50" />
                                                        </div>

                                                        {/* PERSONALITY TRACK */}
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Asistan Kişiliği</span>
                                                                <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest">{user?.settings?.ai?.personality === 'casual' ? 'Samimi' : user?.settings?.ai?.personality === 'professional' ? 'Ciddi' : 'Teknik'}</span>
                                                            </div>
                                                            <div className="h-6 flex items-center gap-1 px-1 relative bg-white/[0.03] rounded-full border border-white/5">
                                                                {[
                                                                    { id: 'casual', label: 'SAMİMİ' },
                                                                    { id: 'professional', label: 'CİDDİ' },
                                                                    { id: 'technical', label: 'TEKNİK' }
                                                                ].map((p) => (
                                                                    <button 
                                                                        key={p.id}
                                                                        onClick={() => { triggerHaptic(15); updateSettings('ai', { personality: p.id }); }}
                                                                        className="flex-1 h-full relative z-10 group flex items-center justify-center"
                                                                    >
                                                                        <span className={cn("text-[7px] font-black transition-all duration-300 tracking-tighter", user?.settings?.ai?.personality === p.id ? "text-white" : "text-white/20")}>{p.label}</span>
                                                                        {user?.settings?.ai?.personality === p.id && (
                                                                            <motion.div 
                                                                                layoutId="ai-personality-active"
                                                                                className="absolute inset-x-0.5 inset-y-1 bg-violet-600/30 rounded-lg border border-violet-500/30 z-[-1]"
                                                                            />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* CREATIVITY TRACK */}
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Yaratıcılık</span>
                                                                <span className="text-[8px] font-black text-violet-400 italic">%{Math.round((user?.settings?.ai?.creativity || 0.7) * 100)}</span>
                                                            </div>
                                                            <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.03] rounded-full border border-white/5 overflow-hidden">
                                                                <div className="absolute inset-0 bg-violet-500/5" />
                                                                {[0.3, 0.7, 1.0].map((val) => (
                                                                    <button 
                                                                        key={val}
                                                                        onClick={() => { triggerHaptic(15); updateSettings('ai', { creativity: val }); }}
                                                                        className="flex-1 h-full relative z-10 group"
                                                                    >
                                                                        <div className={cn(
                                                                            "absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-1 rounded-full transition-all duration-500",
                                                                            user?.settings?.ai?.creativity === val ? "bg-violet-500 shadow-[0_-4px_12px_rgba(139,92,246,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                                        )} />
                                                                        {user?.settings?.ai?.creativity === val && (
                                                                            <motion.div 
                                                                                layoutId="ai-creativity-indicator"
                                                                                className="absolute inset-x-1 inset-y-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30"
                                                                            />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* DETAIL DEPTH TRACK */}
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Yanıt Derinliği</span>
                                                                <span className="text-[8px] font-black text-violet-400">{user?.settings?.ai?.detailLevel === 'short' ? 'ÖZ' : user?.settings?.ai?.detailLevel === 'medium' ? 'DENGELİ' : 'DETAYLI'}</span>
                                                            </div>
                                                            <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.03] rounded-full border border-white/5">
                                                                {[
                                                                    { id: 'short', label: 'ÖZ' },
                                                                    { id: 'medium', label: 'DENGELİ' },
                                                                    { id: 'long', label: 'DETAYLI' }
                                                                ].map((d) => (
                                                                    <button 
                                                                        key={d.id}
                                                                        onClick={() => { triggerHaptic(15); updateSettings('ai', { detailLevel: d.id }); }}
                                                                        className="flex-1 h-full relative z-10 group"
                                                                    >
                                                                        <div className={cn(
                                                                            "absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-1 rounded-full transition-all duration-500",
                                                                            user?.settings?.ai?.detailLevel === d.id ? "bg-violet-400 shadow-[0_-4px_12px_rgba(167,139,250,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                                        )} />
                                                                        {user?.settings?.ai?.detailLevel === d.id && (
                                                                            <motion.div 
                                                                                layoutId="ai-detail-indicator"
                                                                                className="absolute inset-x-1 inset-y-1.5 bg-violet-400/20 rounded-lg border border-violet-400/30"
                                                                            />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex flex-col items-center mb-6"><h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">WIDGET KÜTÜPHANESİ</h3><div className="h-0.5 w-8 bg-cyan-500 mt-2 rounded-full" /></div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar px-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                {ALL_WIDGETS.map(w => (
                                                    <button
                                                        key={w.id}
                                                        onClick={() => {
                                                            let newActions = [...activeActions];
                                                            if (newActions.includes(w.id)) { if (newActions.length <= 2) return; newActions = newActions.filter(a => a !== w.id); } 
                                                            else { if (newActions.length >= 12) return; newActions.push(w.id); }
                                                            updateSettings('edge', { activeActions: newActions });
                                                            triggerHaptic(10);
                                                        }}
                                                        className={cn(
                                                            "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all relative", 
                                                            activeActions.includes(w.id) ? "bg-white/10 border border-white/20 shadow-lg" : "opacity-30 grayscale scale-95"
                                                        )}
                                                    >
                                                        <div className={cn("w-[42px] h-[42px] rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg", w.color)}>
                                                            <w.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-[8px] font-black text-white/60 tracking-tight uppercase text-center">{w.label}</span>
                                                        {activeActions.includes(w.id) && (
                                                            <div className="absolute top-1 right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-2.5 h-2.5 text-black" strokeWidth={5} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => setIsConfiguring(false)} className="mt-6 w-full py-4 bg-white text-black rounded-[1.5rem] font-black text-[12px]">KAYDET</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
