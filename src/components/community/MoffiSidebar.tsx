'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Plus, QrCode, Zap, 
    Settings, Palette, ShieldAlert, Check, ArrowLeft, Send,
    Footprints, Droplets, Heart, Sun, MapPin, Bell,
    Mic, X, Save, Navigation, Flag,
    ShoppingBag, Stethoscope, Gamepad2, Wallet, Radar, Syringe,
    Tv, Users, Edit3, Map, Search, HeartHandshake, Megaphone, Eye,
    CloudRain, CloudSun, Snowflake, CloudLightning, Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter, usePathname } from 'next/navigation';
import { getWeather, WeatherData } from '@/services/weatherService';
import { useTranslation } from '@/context/LanguageContext';

interface SidebarWidget {
    id: string;
    label: string;
    icon: any;
    color: string;
    iconColor: string;
    action: () => void;
    value?: string;
}

export function MoffiSidebar() {
    const { user, updateSettings } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const { 
        activeMode, setActiveMode, 
        walkData, startWalk, stopWalk,
        recTime 
    } = useActivity();
    const { unreadCount } = useNotifications();
    
    // Get edge settings from user object or use defaults (safely merged)
    const edgeSettings = useMemo(() => {
        const defaults = {
            hapticsEnabled: true,
            handleOpacity: 0.6,
            glassBlur: 80,
            capsulePrivate: false,
            activeActions: ['ai', 'post', 'qr', 'mood', 'steps', 'weather'],
            position: 'left' as 'left' | 'right'
        };
        return {
            ...defaults,
            ...(user?.settings?.edge || {})
        };
    }, [user?.settings?.edge]);

    const aiPersonality = user?.settings?.ai?.personality || 'casual';
    const aiCreativity = user?.settings?.ai?.creativity ?? 0.7;
    const aiDetailLevel = user?.settings?.ai?.detailLevel || 'medium';

    const [isOpen, setIsOpen] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
    const [waterLogged, setWaterLogged] = useState(1200);
    const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
        { sender: 'ai', text: 'Merhaba! Dostunun sağlığı veya bakımı hakkında bir sorun var mı?' }
    ]);
    const [aiInputText, setAiInputText] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);

    // Local states for instant feedback (Optimistic UI)
    const [hapticsEnabled, setHapticsEnabled] = useState(edgeSettings.hapticsEnabled);
    const [handleOpacity, setHandleOpacity] = useState(edgeSettings.handleOpacity);
    const [glassBlur, setGlassBlur] = useState(edgeSettings.glassBlur);
    const [capsulePrivate, setCapsulePrivate] = useState(edgeSettings.capsulePrivate);
    const [edgePosition, setEdgePosition] = useState(edgeSettings.position || 'left');
    const [handleY, setHandleY] = useState(0);
    const dragStartY = useRef(0);
    const [windowWidth, setWindowWidth] = useState(375);

    // Unified Premium Crystal Glass Styling (Dark-Tinted Transparent Glass)
    // Using a subtle dark-tinted translucent base allows maximum text readability (white-on-dark) 
    // even on bright white pages, while remaining completely transparent and see-through!
    const glassStyle = {
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        background: 'linear-gradient(135deg, rgba(12, 12, 16, 0.58) 0%, rgba(6, 6, 9, 0.38) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.40), 0 20px 45px rgba(0, 0, 0, 0.55)'
    };

    // Track window width dynamically for horizontal drag constraints
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            const handleResize = () => setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Load saved Y position from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedY = localStorage.getItem('moffi_edge_y');
            if (savedY) setHandleY(parseFloat(savedY));
        }
    }, []);

    // Sync local state when user object changes (e.g. from another device)
    useEffect(() => {
        if (user?.settings?.edge) {
            setHapticsEnabled(user.settings.edge.hapticsEnabled);
            setHandleOpacity(user.settings.edge.handleOpacity);
            setGlassBlur(user.settings.edge.glassBlur);
            setCapsulePrivate(user.settings.edge.capsulePrivate);
            setEdgePosition(user.settings.edge.position || 'left');
        }
    }, [user?.settings?.edge]);

    // Live Weather Consultant Logic - Proactive fetching with permission check
    useEffect(() => {
        const fetchWeather = async () => {
            if (isWeatherLoading || weatherData) return;
            setIsWeatherLoading(true);
            
            if (typeof window !== 'undefined' && navigator.geolocation) {
                if (navigator.permissions && navigator.permissions.query) {
                    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(status => {
                        if (status.state === 'denied') {
                            console.warn("MoffiWeather: Permission denied via browser settings");
                            setIsWeatherLoading(false);
                            return;
                        }
                        requestPosition();
                    }).catch(() => requestPosition());
                } else {
                    requestPosition();
                }
            } else {
                setIsWeatherLoading(false);
            }
        };

        const requestPosition = () => {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const data = await getWeather(position.coords.latitude, position.coords.longitude);
                setWeatherData(data);
                setIsWeatherLoading(false);
            }, (error) => {
                console.error("MoffiWeather: Geolocation error", error);
                setIsWeatherLoading(false);
            }, { timeout: 10000 });
        };

        fetchWeather();
    }, [isOpen, weatherData]); 

    const triggerHaptic = useCallback((intensity: number = 10) => {
        if (!hapticsEnabled) return;
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(intensity);
        }
    }, [hapticsEnabled]);

    const updateEdgeSetting = async (key: string, value: any) => {
        if (key === 'hapticsEnabled') setHapticsEnabled(value);
        if (key === 'handleOpacity') setHandleOpacity(value);
        if (key === 'glassBlur') setGlassBlur(value);
        if (key === 'capsulePrivate') setCapsulePrivate(value);
        if (key === 'position') setEdgePosition(value);

        await updateSettings('edge', { [key]: value });
    };

    const activeActions = edgeSettings.activeActions;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const ALL_WIDGETS: SidebarWidget[] = [
        { id: 'ai', label: t('sidebar.ai_assistant'), icon: Sparkles, color: 'from-indigo-500 to-purple-650', iconColor: 'text-indigo-400', action: () => window.dispatchEvent(new CustomEvent('open-ai-assistant')) },
        { id: 'post', label: t('sidebar.post'), icon: Plus, color: 'from-emerald-400 to-teal-650', iconColor: 'text-emerald-400', action: () => window.dispatchEvent(new CustomEvent('open-add-post')) },
        { id: 'qr', label: t('sidebar.passport'), icon: QrCode, color: 'from-amber-400 to-orange-650', iconColor: 'text-amber-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'passport' })) },
        { id: 'mood', label: t('sidebar.mood'), icon: Zap, color: 'from-pink-400 to-rose-650', iconColor: 'text-pink-400', action: () => window.dispatchEvent(new CustomEvent('open-moffi-navigate', { detail: 'mood-selector' })) },
        { id: 'sos', label: t('sidebar.sos'), icon: ShieldAlert, color: 'from-red-500 to-red-700', iconColor: 'text-red-400', action: () => window.dispatchEvent(new CustomEvent('open-sos-center')) },
        { id: 'voice', label: t('sidebar.voice_note'), icon: Mic, color: 'from-orange-400 to-red-500', iconColor: 'text-orange-400', action: () => { triggerHaptic(30); setActiveMode('voice'); setIsOpen(true); } },
        { id: 'steps', label: t('sidebar.walk'), icon: Footprints, color: 'from-blue-400 to-indigo-500', iconColor: 'text-cyan-400', value: '4.2k', action: () => { triggerHaptic(30); window.dispatchEvent(new CustomEvent('open-walk-panel')); } },
        { 
            id: 'weather', 
            label: t('sidebar.weather'), 
            icon: weatherData?.icon === 'CloudRain' ? CloudRain : 
                  weatherData?.icon === 'CloudSun' ? CloudSun :
                  weatherData?.icon === 'Snowflake' ? Snowflake :
                  weatherData?.icon === 'CloudLightning' ? CloudLightning :
                  weatherData?.icon === 'Cloud' ? Cloud : Sun, 
            color: 'from-yellow-400 to-orange-550', 
            iconColor: 'text-yellow-400',
            value: isWeatherLoading ? '...' : (weatherData ? `${weatherData.temp}°` : '?'), 
            action: () => {
                if (!weatherData) {
                    window.dispatchEvent(new CustomEvent('moffi-toast', { 
                        detail: { 
                            message: t('common.error'), 
                            icon: 'ShieldAlert', 
                            color: 'text-amber-400' 
                        } 
                    }));
                } else {
                    window.dispatchEvent(new CustomEvent('moffi-toast', { 
                        detail: { 
                            message: weatherData.recommendation, 
                            icon: weatherData.icon, 
                            color: 'text-yellow-400' 
                        } 
                    }));
                }
            } 
        },
        { id: 'water', label: t('sidebar.water'), icon: Droplets, color: 'from-cyan-400 to-blue-500', iconColor: 'text-sky-400', value: '80%', action: () => {} },
        { id: 'health', label: t('sidebar.health'), icon: Heart, color: 'from-rose-400 to-red-550', iconColor: 'text-rose-450', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'vet' })) },
        { id: 'map', label: t('sidebar.location'), icon: MapPin, color: 'from-emerald-400 to-green-600', iconColor: 'text-emerald-400', action: () => window.dispatchEvent(new CustomEvent('open-moffi-maps')) },
        { id: 'notif', label: t('navigation.notifications'), icon: Bell, color: 'from-purple-400 to-fuchsia-600', iconColor: 'text-fuchsia-400', value: unreadCount > 0 ? unreadCount.toString() : undefined, action: () => window.dispatchEvent(new CustomEvent('open-notification-drawer')) },
        { id: 'market', label: t('sidebar.market'), icon: ShoppingBag, color: 'from-amber-500 to-yellow-600', iconColor: 'text-amber-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'shop' })) },
        { id: 'vet', label: t('sidebar.vet'), icon: Stethoscope, color: 'from-blue-600 to-cyan-700', iconColor: 'text-teal-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'vet' })) },
        { id: 'game', label: t('sidebar.game'), icon: Gamepad2, color: 'from-purple-600 to-pink-700', iconColor: 'text-violet-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'game' })) },
        { id: 'wallet', label: t('sidebar.wallet'), icon: Wallet, color: 'from-emerald-500 to-green-700', iconColor: 'text-emerald-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'wallet' })) },
        { id: 'radar', label: t('sidebar.radar'), icon: Radar, color: 'from-orange-500 to-red-600', iconColor: 'text-orange-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'radar' })) },
        { id: 'vaccine', label: t('sidebar.vaccine'), icon: Syringe, color: 'from-red-400 to-rose-600', iconColor: 'text-red-450', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'appointments' })) },
        { id: 'tv', label: t('sidebar.tv'), icon: Tv, color: 'from-rose-500 to-indigo-700', iconColor: 'text-indigo-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'feed' })) },
        { id: 'family', label: t('sidebar.family'), icon: Users, color: 'from-blue-400 to-blue-600', iconColor: 'text-sky-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'family' })) },
        { id: 'diary', label: t('sidebar.diary'), icon: Edit3, color: 'from-yellow-500 to-amber-700', iconColor: 'text-yellow-450', action: () => window.dispatchEvent(new CustomEvent('open-moffi-diary')) },
        { id: 'places', label: t('sidebar.places'), icon: Map, color: 'from-green-500 to-emerald-700', iconColor: 'text-green-400', action: () => window.dispatchEvent(new CustomEvent('open-moffi-maps')) },
        { id: 'search', label: t('sidebar.search'), icon: Search, color: 'from-gray-400 to-gray-600', iconColor: 'text-zinc-400', action: () => window.dispatchEvent(new CustomEvent('open-moffi-spotlight')) },
        { id: 'adoption', label: t('sidebar.adoption'), icon: HeartHandshake, color: 'from-rose-400 to-pink-600', iconColor: 'text-rose-400', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'adoption' })) },
        { id: 'lost_report', label: t('sidebar.lost_report'), icon: Megaphone, color: 'from-orange-400 to-red-500', iconColor: 'text-orange-450', action: () => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'lost_pet' })) }
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

    const handleSendAiMessage = () => {
        if (!aiInputText.trim()) return;
        triggerHaptic(20);
        const userMsg = aiInputText;
        setAiChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setAiInputText('');
        setIsAiTyping(true);

        setTimeout(() => {
            triggerHaptic(30);
            setIsAiTyping(false);
            let reply = "Dostunun sağlığı ve mutluluğu için her gün taze su vermeyi unutma! 🐾";
            const lowerMsg = userMsg.toLowerCase();
            if (lowerMsg.includes('su') || lowerMsg.includes('susuz')) {
                reply = "Evcil dostunun günlük su ihtiyacı kilosuna göre yaklaşık 250-500ml arasındadır. 💧";
            } else if (lowerMsg.includes('mama') || lowerMsg.includes('yemek')) {
                reply = "Premium mamalar ve yaş mama dengesi tüy sağlığı için çok önemlidir. Haftada 1-2 kez yaş mama verebilirsin. 🍖";
            } else if (lowerMsg.includes('aşı') || lowerMsg.includes('vet') || lowerMsg.includes('hasta')) {
                reply = "Aşı takvimini ve randevularını ana sayfadaki 'Veteriner' kartından takip edebilirsin! 🩺";
            } else if (lowerMsg.includes('yürüyüş') || lowerMsg.includes('adım') || lowerMsg.includes('park')) {
                reply = "Köpeğinle günde en az 30 dakika yürüyüş yapmak eklem sağlığına çok iyi gelir. 👣";
            } else if (lowerMsg.includes('kombin') || lowerMsg.includes('stüdyo') || lowerMsg.includes('kıyafet')) {
                reply = "Tasarım Stüdyosu'nda köpeğine birbirinden havalı şapkalar ve kıyafetler giydirebilirsin! 👔";
            }
            setAiChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
        }, 1200);
    };

    return (
        <div className={cn("fixed inset-y-0 left-0 right-0 z-[9999] pointer-events-none flex items-center", edgePosition === 'right' ? "justify-end" : "justify-start")}>
                {/* PERMANENT EDGE HANDLE (SAMSUNG STYLE) - Hidden when panel is open */}
                {!isOpen && (
                    <motion.div
                        key={`edge-handle-${edgePosition}`}
                        drag
                        dragConstraints={{
                            left: edgePosition === 'left' ? 0 : -(windowWidth - 32),
                            right: edgePosition === 'left' ? (windowWidth - 32) : 0,
                            top: -300,
                            bottom: 300
                        }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        style={{ y: handleY }}
                        onDragStart={(_, info) => {
                            dragStartY.current = info.point.y;
                        }}
                        onDragEnd={(_, info) => {
                            const dragDistY = Math.abs(info.point.y - dragStartY.current);
                            if (dragDistY > 5) {
                                setHandleY(prev => {
                                    const newY = prev + info.offset.y;
                                    const constrainedY = Math.max(-280, Math.min(280, newY));
                                    localStorage.setItem('moffi_edge_y', constrainedY.toString());
                                    return constrainedY;
                                });
                            }

                            const currentX = info.point.x;
                            const midpoint = windowWidth / 2;
                            if (currentX < midpoint) {
                                if (edgePosition !== 'left') {
                                    updateEdgeSetting('position', 'left');
                                    triggerHaptic(30);
                                }
                            } else {
                                if (edgePosition !== 'right') {
                                    updateEdgeSetting('position', 'right');
                                    triggerHaptic(30);
                                }
                            }
                        }}
                        onTap={() => {
                            triggerHaptic(20);
                            setIsOpen(true);
                        }}
                        onPanEnd={(_, info) => {
                            const isSwipeOpen = edgePosition === 'left'
                                ? (info.offset.x > 15 || info.velocity.x > 100)
                                : (info.offset.x < -15 || info.velocity.x < -100);
                            if (isSwipeOpen) {
                                triggerHaptic(25);
                                setIsOpen(true);
                            }
                        }}
                        whileHover={{ scaleY: 1.05 }}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing w-8 h-32 flex items-center touch-none z-[9998] group",
                            edgePosition === 'left' ? "left-0 justify-start pl-0" : "right-0 justify-end pr-0"
                        )}
                      >
                           <motion.div 
                              style={{ opacity: Math.max(0.3, handleOpacity) }}
                              className={cn(
                                  "w-2 h-24 transition-all duration-300 group-hover:scale-y-105 group-hover:w-3 shadow-[0_2px_10px_rgba(0,0,0,0.2)] bg-zinc-200 border border-white/5",
                                  edgePosition === 'left' ? "rounded-r-full" : "rounded-l-full"
                              )}
                          />
                    </motion.div>
                )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setIsOpen(false); setIsConfiguring(false); setExpandedWidgetId(null); setSearchTerm(''); }}
                            className="fixed inset-0 bg-black/10 backdrop-blur-[3px] pointer-events-auto z-[-1]"
                        />

                        <motion.div
                            initial={{ x: edgePosition === 'left' ? "-120%" : "120%" }} 
                            animate={{ x: 0 }} 
                            exit={{ x: edgePosition === 'left' ? "-120%" : "120%" }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={{ left: 0.5, right: 0 }}
                            onDragEnd={(_, info) => {
                                const isDragClose = edgePosition === 'left'
                                    ? info.offset.x < -80
                                    : info.offset.x > 80;
                                if (isDragClose) {
                                    triggerHaptic(20);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                    setExpandedWidgetId(null);
                                }
                            }}
                            transition={{ type: "spring", damping: 30, stiffness: 220 }}
                            style={glassStyle}
                            className={cn(
                                "w-[200px] h-[88vh] max-h-[750px] pointer-events-auto flex flex-col p-5 rounded-[2.5rem] relative overflow-hidden",
                                edgePosition === 'left' ? "ml-3" : "mr-3"
                            )}
                        >
                            {isConfiguring ? (
                                /* CONFIGURATION CENTER PANEL */
                                <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden text-white font-bold drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
                                        <button 
                                            onClick={() => { triggerHaptic(15); setIsConfiguring(false); }}
                                            className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-white" />
                                        </button>
                                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
                                            {t('sidebar.panel_settings')}
                                        </span>
                                        <div className="w-8" />
                                    </div>

                                    {/* Scrollable controls list wrapped in shaded trays */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar px-0.5 pb-4 flex flex-col gap-4">
                                        {/* TRAY 1: GENERAL SYSTEM SETTINGS */}
                                        <div className="bg-black/20 border border-white/[0.04] p-3.5 rounded-[1.8rem] shadow-inner flex flex-col gap-5">
                                            {/* BLUR CONTROL TRACK */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Bulanıklık Derinliği</span>
                                                    <span className="text-[7.5px] font-black text-indigo-405">{glassBlur === 10 ? 'SAF' : glassBlur === 40 ? 'HAFİF' : 'YOĞUN'}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.06] rounded-full border border-white/10 shrink-0">
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
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Tutacak Görünümü</span>
                                                    <span className="text-[7.5px] font-black text-amber-400">{handleOpacity < 0.3 ? 'HAYALET' : handleOpacity < 0.6 ? 'SOFT' : 'BELİRGİN'}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.06] rounded-full border border-white/10 shrink-0">
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

                                            {/* TOGGLE TRACKS */}
                                            <div className="flex items-center gap-4 px-1 pt-1 shrink-0">
                                                <button 
                                                    onClick={() => { updateEdgeSetting('hapticsEnabled', !hapticsEnabled); triggerHaptic(25); }}
                                                    className="flex-1 flex flex-col gap-2.5 group"
                                                >
                                                    <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Titreşim</span>
                                                    <div className="h-4 w-full bg-white/[0.06] rounded-full relative overflow-hidden border border-white/10 p-0.5">
                                                        <motion.div 
                                                            animate={{ x: hapticsEnabled ? "0%" : "-100%" }}
                                                            className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className={cn("w-1 h-1 rounded-full transition-colors duration-500", hapticsEnabled ? "bg-card" : "bg-white/10")} />
                                                        </div>
                                                    </div>
                                                </button>

                                                <button 
                                                    onClick={() => { updateEdgeSetting('capsulePrivate', !capsulePrivate); triggerHaptic(25); }}
                                                    className="flex-1 flex flex-col gap-2.5 group"
                                                >
                                                    <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Gizlilik</span>
                                                    <div className="h-4 w-full bg-white/[0.06] rounded-full relative overflow-hidden border border-white/10 p-0.5">
                                                        <motion.div 
                                                            animate={{ x: capsulePrivate ? "0%" : "-100%" }}
                                                            className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className={cn("w-1 h-1 rounded-full transition-colors duration-500", capsulePrivate ? "bg-card" : "bg-white/10")} />
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            {/* EDGE POSITION */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Kenar Konumu</span>
                                                    <span className="text-[7.5px] font-black text-cyan-400">{(edgePosition === 'right' ? 'SAĞ' : 'SOL')}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.06] rounded-full border border-white/10 shrink-0">
                                                    {['left', 'right'].map((pos) => (
                                                        <button 
                                                            key={pos}
                                                            onClick={() => { triggerHaptic(15); updateEdgeSetting('position', pos); }}
                                                            className="flex-1 h-full relative z-10 group"
                                                        >
                                                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase text-white/60 group-hover:text-white tracking-wider">
                                                                {pos === 'left' ? 'SOL' : 'SAĞ'}
                                                            </span>
                                                            {edgePosition === pos && (
                                                                <motion.div 
                                                                    layoutId="pos-active-indicator"
                                                                    className="absolute inset-x-1 inset-y-1 bg-white/10 rounded-lg border border-white/10"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* TRAY 2: AI ASSISTANT SETTINGS */}
                                        <div className="bg-black/20 border border-white/[0.04] p-3.5 rounded-[1.8rem] shadow-inner flex flex-col gap-5">
                                            <div className="px-1 flex items-center justify-between">
                                                <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-[0.3em]">AI ASİSTAN AYARLARI</span>
                                                <Sparkles className="w-3 h-3 text-purple-550/50" />
                                            </div>

                                            {/* PERSONALITY */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Asistan Kişiliği</span>
                                                    <span className="text-[7.5px] font-black text-purple-400 uppercase tracking-widest">{aiPersonality === 'casual' ? 'Samimi' : aiPersonality === 'professional' ? 'Ciddi' : 'Teknik'}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1 px-1 relative bg-white/[0.06] rounded-full border border-white/10 shrink-0">
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
                                                            <span className={cn("text-[7px] font-black transition-all duration-300 tracking-tighter", aiPersonality === p.id ? "text-white" : "text-white/40")}>{p.label}</span>
                                                            {aiPersonality === p.id && (
                                                                <motion.div 
                                                                    layoutId="ai-personality-active"
                                                                    className="absolute inset-x-0.5 inset-y-1 bg-purple-500/20 rounded-lg border border-purple-500/30 z-[-1]"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* CREATIVITY */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Yaratıcılık</span>
                                                    <span className="text-[7.5px] font-black text-purple-400 italic">%{Math.round(aiCreativity * 100)}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.06] rounded-full border border-white/10 overflow-hidden shrink-0">
                                                    <div className="absolute inset-0 bg-purple-500/5" />
                                                    {[0.3, 0.7, 1.0].map((val) => (
                                                        <button 
                                                            key={val}
                                                            onClick={() => { triggerHaptic(15); updateSettings('ai', { creativity: val }); }}
                                                            className="flex-1 h-full relative z-10 group"
                                                        >
                                                            <div className={cn(
                                                                "absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-1 rounded-full transition-all duration-500",
                                                                aiCreativity === val ? "bg-purple-500 shadow-[0_-4px_12px_rgba(139,92,246,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                            )} />
                                                            {aiCreativity === val && (
                                                                <motion.div 
                                                                    layoutId="ai-creativity-indicator"
                                                                    className="absolute inset-x-1 inset-y-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* DETAIL DEPTH */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em]">Yanıt Derinliği</span>
                                                    <span className="text-[7.5px] font-black text-purple-400">{aiDetailLevel === 'short' ? 'ÖZ' : aiDetailLevel === 'medium' ? 'DENGELİ' : 'DETAYLI'}</span>
                                                </div>
                                                <div className="h-6 flex items-center gap-1.5 px-1 relative bg-white/[0.06] rounded-full border border-white/10 shrink-0">
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
                                                                aiDetailLevel === d.id ? "bg-purple-500 shadow-[0_-4px_12px_rgba(167,139,250,0.6)]" : "bg-transparent group-hover:bg-white/5"
                                                            )} />
                                                            {aiDetailLevel === d.id && (
                                                                <motion.div 
                                                                    layoutId="ai-detail-indicator"
                                                                    className="absolute inset-x-1 inset-y-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* TRAY 3: WIDGET LIBRARY */}
                                        <div className="bg-black/20 border border-white/[0.04] p-3.5 rounded-[1.8rem] shadow-inner flex flex-col gap-4">
                                            <div className="flex flex-col items-center mb-1">
                                                <h3 className="text-[8.5px] font-black text-white/40 uppercase tracking-[0.3em]">WIDGET KÜTÜPHANESİ</h3>
                                                <div className="h-0.5 w-8 bg-cyan-550 mt-1.5 rounded-full" />
                                            </div>
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
                                                            "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all relative border shadow-sm", 
                                                            activeActions.includes(w.id) ? "bg-white/10 border-white/20" : "bg-transparent border-transparent opacity-20 scale-95"
                                                        )}
                                                    >
                                                        <div className={cn("w-[42px] h-[42px] rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shadow-lg")}>
                                                            <w.icon className={cn("w-5 h-5", w.iconColor)} strokeWidth={2.5} />
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
                                    </div>
                                </div>
                            ) : (
                                /* MAIN PANEL (WIDGET LIST OR EXPANDED WIDGET) */
                                <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden text-white font-bold drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]">
                                    {expandedWidgetId ? (
                                        /* EXPANDED WIDGET VIEW */
                                        <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
                                                <button 
                                                    onClick={() => { triggerHaptic(15); setExpandedWidgetId(null); }}
                                                    className="p-1.5 rounded-full hover:bg-white/5 transition-colors"
                                                >
                                                    <ArrowLeft className="w-4 h-4 text-white" />
                                                </button>
                                                <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
                                                    {expandedWidgetId === 'weather' ? 'Hava Durumu' :
                                                     expandedWidgetId === 'steps' ? 'Yürüyüş' :
                                                     expandedWidgetId === 'water' ? 'Su Takibi' :
                                                     expandedWidgetId === 'mood' ? 'Pet Modu' :
                                                     expandedWidgetId === 'qr' ? 'Pasaport' : 'AI Asistan'}
                                                </span>
                                                <div className="w-8" />
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex-1 overflow-y-auto no-scrollbar pb-2 flex flex-col">
                                                {expandedWidgetId === 'weather' && (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                                                        <Sun className="w-14 h-14 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] mb-3 animate-pulse" />
                                                        <h3 className="text-3xl font-black text-white leading-none">24°</h3>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Güneşli • Kadıköy</p>
                                                        
                                                        <div className="mt-5 w-full bg-white/[0.06] border border-white/10 rounded-2xl p-3 text-[10px] text-white/80 font-semibold leading-relaxed shadow-sm">
                                                            Pamuk için harika yürüyüş havası! Sıcaklık mükemmel. 🐾
                                                        </div>

                                                        <div className="mt-6 w-full flex flex-col gap-3 shrink-0">
                                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider px-1">
                                                                <span className="text-white/40">Yarın</span>
                                                                <span className="font-black text-white">23° ☀️</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider px-1">
                                                                <span className="text-white/40">Cuma</span>
                                                                <span className="font-black text-white">21° ⛅</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider px-1">
                                                                <span className="text-white/40">Cumartesi</span>
                                                                <span className="font-black text-white">25° ☀️</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {expandedWidgetId === 'steps' && (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                                                        <div className="relative w-28 h-28 mb-3 flex items-center justify-center">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="5" fill="transparent" />
                                                                <motion.circle 
                                                                    cx="56" cy="56" r="48" 
                                                                    stroke="#10b981" strokeWidth="7" fill="transparent" 
                                                                    strokeDasharray={2 * Math.PI * 48}
                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - 4200/6000) }}
                                                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                            <div className="absolute flex flex-col items-center">
                                                                <Footprints className="w-5 h-5 text-emerald-400 mb-1" />
                                                                <span className="text-sm font-black text-white">4.2k</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hedef: 6,000 Adım</span>
                                                        
                                                        <button 
                                                            onClick={() => { triggerHaptic(30); router.push('/walk/tracking'); setIsOpen(false); }}
                                                            className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
                                                        >
                                                            Yürüyüş Başlat 👣
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {expandedWidgetId === 'water' && (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                                                        <div className="w-20 h-32 bg-white/[0.04] border border-white/10 rounded-2xl relative overflow-hidden mb-4 shadow-inner">
                                                            <motion.div 
                                                                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600 to-cyan-400"
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${(waterLogged/2000)*100}%` }}
                                                                transition={{ type: "spring", damping: 20 }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-lg font-black text-white drop-shadow-md">
                                                                    {Math.round((waterLogged/2000)*100)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{waterLogged}ml / 2000ml</span>

                                                        <div className="mt-5 w-full flex flex-col gap-2 shrink-0">
                                                            <button 
                                                                onClick={() => { triggerHaptic(15); setWaterLogged(prev => Math.min(2000, prev + 250)); }}
                                                                className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 font-black text-[9px] uppercase tracking-widest rounded-xl text-white transition-colors"
                                                            >
                                                                +250ml Ekle 💧
                                                            </button>
                                                            <button 
                                                                onClick={() => { triggerHaptic(15); setWaterLogged(prev => Math.min(2000, prev + 500)); }}
                                                                className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 font-black text-[9px] uppercase tracking-widest rounded-xl text-white transition-colors"
                                                            >
                                                                +500ml Ekle 💧
                                                            </button>
                                                            <button 
                                                                onClick={() => { triggerHaptic(30); setWaterLogged(0); }}
                                                                className="w-full py-1.5 text-white/30 hover:text-white/50 font-black text-[8px] uppercase tracking-widest rounded-xl mt-1 transition-colors"
                                                            >
                                                                Sıfırla
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {expandedWidgetId === 'mood' && (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Dostunun Modu</span>
                                                        <div className="grid grid-cols-2 gap-3 w-full">
                                                            {[
                                                                { emoji: "😊", label: "Mutlu" },
                                                                { emoji: "😴", label: "Uykulu" },
                                                                { emoji: "🤪", label: "Enerjik" },
                                                                { emoji: "😢", label: "Üzgün" },
                                                                { emoji: "😋", label: "Aç" },
                                                                { emoji: "🩺", label: "Halsiz" }
                                                            ].map((m) => (
                                                                <button
                                                                    key={m.label}
                                                                    onClick={() => {
                                                                        triggerHaptic(40);
                                                                        window.dispatchEvent(new CustomEvent('moffi-toast', { 
                                                                            detail: { 
                                                                                title: "Pet Modu Güncellendi",
                                                                                desc: `Dostunun modu '${m.label}' olarak ayarlandı! ${m.emoji}`,
                                                                                type: "success" 
                                                                            } 
                                                                        }));
                                                                        setExpandedWidgetId(null);
                                                                    }}
                                                                    className="py-3 bg-white/[0.04] hover:bg-white/[0.12] border border-white/10 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 group"
                                                                >
                                                                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{m.emoji}</span>
                                                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-tight">{m.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {expandedWidgetId === 'qr' && (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                                                        <div className="p-3 bg-white rounded-3xl mb-4 shadow-xl shrink-0">
                                                            <div className="w-32 h-32 bg-[#09090b] rounded-2xl p-2 flex flex-wrap gap-1">
                                                                {[...Array(64)].map((_, i) => (
                                                                    <div 
                                                                        key={i} 
                                                                        className={cn(
                                                                            "w-[12px] h-[12px] rounded-sm",
                                                                            (i % 3 === 0 || i % 7 === 0 || i < 12 || i > 52) ? "bg-white" : "bg-transparent"
                                                                        )} 
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Moffi Pasaport Kartı</span>
                                                        <p className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider">Taranabilir Kimlik</p>
                                                        
                                                        <div className="mt-5 w-full bg-white/[0.06] border border-white/10 rounded-2xl p-3 text-[9px] text-white/60 font-semibold leading-relaxed shadow-sm">
                                                            Kaybolduğunda bu kodu okutan herkes petinin bilgilerine anında erişebilir.
                                                        </div>
                                                    </motion.div>
                                                )}


                                            </div>
                                        </div>
                                    ) : (
                                        /* STANDARD WIDGET LIST VIEW */
                                        <>
                                            {/* SEARCH BAR (Premium Pill-Shaped Glass Container) */}
                                            <div className="relative mb-6 group shrink-0">
                                                <div className="relative w-full flex items-center bg-white/[0.06] border border-white/[0.12] rounded-full px-3.5 h-9 focus-within:border-white/30 focus-within:bg-white/[0.1] transition-all duration-350 shadow-inner">
                                                    <Search className="w-3.5 h-3.5 text-white/30 mr-2 shrink-0" />
                                                    <input 
                                                        type="text"
                                                        placeholder={t('navigation.search_placeholder')}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="flex-1 bg-transparent border-none focus:outline-none text-[11px] font-semibold text-white placeholder:text-white/30 tracking-tight"
                                                    />
                                                    {searchTerm && (
                                                        <button 
                                                            onClick={() => setSearchTerm('')}
                                                            className="text-white/25 hover:text-white transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* LIVE CAPSULE (Glossy Translucent Dark Glass Capsule) */}
                                            <motion.div
                                                layout
                                                initial={false}
                                                animate={{
                                                    height: activeMode !== 'none' ? 128 : 48,
                                                    width: activeMode !== 'none' ? "120%" : "100%",
                                                    x: activeMode !== 'none' ? "-10%" : "0%",
                                                    backgroundColor: "rgba(9, 9, 11, 0.55)",
                                                }}
                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
                                                className={cn(
                                                    "z-50 rounded-[2rem] mb-4 flex flex-col items-center justify-center overflow-hidden relative shrink-0",
                                                    activeMode === 'walk' ? "shadow-[0_0_40px_rgba(16,185,129,0.15)] border-emerald-500/35" : 
                                                    activeMode === 'voice' ? "shadow-[0_0_40px_rgba(244,63,94,0.15)] border-rose-500/35" : 
                                                    activeMode === 'sos' ? "shadow-[0_0_50_px_rgba(239,68,68,0.4)] border-red-500" :
                                                    activeMode === 'ai' ? "shadow-[0_0_40px_rgba(168,85,247,0.3)] border-purple-500/35" :
                                                    activeMode === 'order' ? "shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/35" :
                                                    "shadow-none"
                                                )}
                                            >
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
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                                            <span className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase">Moffi Live</span>
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
                                                            <button onClick={() => { triggerHaptic(100); setActiveMode('none'); }} className="w-full py-2 bg-red-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md">ALARMIP KAPAT</button>
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
                                                                <button onClick={() => { triggerHaptic(10); setActiveMode('none'); }} className="flex-1 py-1.5 bg-white/5 text-white/60 rounded-lg font-black text-[8px] uppercase border border-white/10">İPTAL</button>
                                                                <button onClick={() => { triggerHaptic(40); setActiveMode('none'); alert('Sesli not kaydedildi! 🐾'); }} className="flex-1 py-1.5 bg-rose-500 text-white rounded-lg font-black text-[8px] uppercase shadow-lg shadow-rose-500/20">KAYDET</button>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full px-5">
                                                            <div className="flex items-center justify-between w-full mb-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-emerald-450 uppercase tracking-widest">Yürüyüş</span>
                                                                    <span className="text-[18px] font-black text-white leading-none mt-1">
                                                                        {capsulePrivate ? '•••' : (walkData.distance >= 1000 ? `${(walkData.distance / 1000).toFixed(2)}km` : `${Math.floor(walkData.distance)}m`)}
                                                                    </span>
                                                                </div>
                                                                <motion.div 
                                                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
                                                                    transition={{ repeat: Infinity, duration: 2 }} 
                                                                    className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-inner"
                                                                >
                                                                    <Navigation className="w-5 h-5 text-emerald-450" />
                                                                </motion.div>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-full mt-1">
                                                                <button onClick={() => { triggerHaptic(20); router.push('/walk/tracking'); setIsOpen(false); }} className="flex-1 py-2 bg-white/5 text-white/80 rounded-xl font-black text-[8px] uppercase tracking-wider border border-white/10 transition-colors hover:bg-white/10">TAKİP</button>
                                                                <button onClick={() => { triggerHaptic(50); stopWalk(); }} className="flex-1 py-2 bg-emerald-500 text-black rounded-xl font-black text-[8px] uppercase tracking-wider shadow-lg shadow-emerald-500/20">BİTİR</button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>

                                            {/* WIDGET GRID (Wrapped in shaded acrylic trays for maximum contrast) */}
                                            <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-0.5 flex flex-col gap-4">
                                                {pinnedWidgets.length > 0 && (
                                                    <div className="bg-black/20 border border-white/[0.04] p-3.5 rounded-[1.8rem] shadow-inner">
                                                        <h4 className="text-[8px] font-black text-white/45 uppercase tracking-[0.3em] mb-3 ml-1">Öncelikli Araçlar</h4>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                                            {pinnedWidgets.map((widget, index) => {
                                                                return (
                                                                    <motion.button
                                                                        key={`pinned-${widget.id}`}
                                                                        initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                        transition={{ type: "spring", stiffness: 350, damping: 22, delay: index * 0.03 }}
                                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => { 
                                                                            triggerHaptic(15); 
                                                                            const expandableIds = ['steps', 'weather', 'water', 'mood', 'qr'];
                                                                            if (expandableIds.includes(widget.id)) {
                                                                                setExpandedWidgetId(widget.id);
                                                                            } else {
                                                                                widget.action();
                                                                                setIsOpen(false); setSearchTerm('');
                                                                            }
                                                                        }}
                                                                        className="flex flex-col items-center gap-1.5 group"
                                                                    >
                                                                        {/* Glass square with distinct shadow shading */}
                                                                        <div className="w-[50px] h-[50px] rounded-[1.2rem] bg-white/[0.05] border border-white/[0.15] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] relative overflow-hidden group-hover:bg-white/[0.12] group-hover:border-white/30 transition-all duration-300">
                                                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />
                                                                            <widget.icon className={cn("w-5 h-5 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform duration-300", widget.iconColor)} strokeWidth={2.4} />
                                                                        </div>
                                                                        <span className="text-[7.5px] font-black text-white/80 uppercase tracking-tighter text-center group-hover:text-white transition-colors">{widget.label}</span>
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-black/20 border border-white/[0.04] p-3.5 rounded-[1.8rem] shadow-inner">
                                                    {!searchTerm && pinnedWidgets.length > 0 && (
                                                        <h4 className="text-[8px] font-black text-white/45 uppercase tracking-[0.3em] mb-3 ml-1">Tüm Araçlar</h4>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                                        {dynamicWidgets.map((widget, index) => {
                                                            return (
                                                                <motion.button
                                                                    key={widget.id}
                                                                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    transition={{ type: "spring", stiffness: 350, damping: 22, delay: (pinnedWidgets.length + index) * 0.03 }}
                                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => { 
                                                                        triggerHaptic(15); 
                                                                        const expandableIds = ['steps', 'weather', 'water', 'mood', 'qr'];
                                                                        if (expandableIds.includes(widget.id)) {
                                                                            setExpandedWidgetId(widget.id);
                                                                        } else {
                                                                            widget.action();
                                                                            if(widget.id !== 'voice') { setIsOpen(false); setSearchTerm(''); }
                                                                        }
                                                                    }}
                                                                    className="flex flex-col items-center gap-1.5 group"
                                                                >
                                                                    {/* Glass square with distinct shadow shading */}
                                                                    <div className="w-[50px] h-[50px] rounded-[1.2rem] bg-white/[0.05] border border-white/[0.15] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] relative overflow-hidden group-hover:bg-white/[0.12] group-hover:border-white/30 transition-all duration-300">
                                                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />
                                                                        <widget.icon className={cn("w-5.5 h-5.5 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform duration-300", widget.iconColor)} strokeWidth={2} />
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col items-center max-w-[65px]">
                                                                        <span className="text-[7.5px] font-black text-white/80 uppercase tracking-tighter text-center group-hover:text-white transition-colors truncate w-full">{widget.label}</span>
                                                                        {widget.value && (
                                                                            <span className="text-[9px] font-black text-emerald-455 mt-0.5">{widget.value}</span>
                                                                        )}
                                                                    </div>
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                
                                                {searchTerm && dynamicWidgets.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                                        <Search className="w-8 h-8 mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-center px-4 text-white">{t('common.no_results')}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Settings Trigger */}
                                            <div className="mt-4 flex justify-center border-t border-white/10 pt-4 shrink-0">
                                                <button 
                                                    onClick={() => { triggerHaptic(20); setIsConfiguring(true); }} 
                                                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
