'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Camera, MessageCircle, Heart, Search, 
    ShieldAlert, Sparkles, Map, User, Globe, ShoppingBag, Palette, Stethoscope, PawPrint, Gamepad2, ChevronRight, Radar,
    Activity, Zap, Truck, Mail, Bell, Compass, Users, PhoneCall, Scale, ShoppingCart, Cross, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHubData } from '@/hooks/useHubData';
import { usePet } from '@/context/PetContext';

interface HubOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSOSClick: () => void;
    onMoffinetClick: () => void;
    onMarketClick: () => void;
    onWalkClick: () => void;
    onStudioClick: () => void;
    onVetClick: () => void;
    onGameClick: () => void;
    onSearchClick: () => void;
    onCommunityRadarClick: () => void;
    onAIAsistantClick?: () => void; // Added for new version
}

export function HubOverlay({
    isOpen,
    onClose,
    onSOSClick,
    onMoffinetClick,
    onMarketClick,
    onWalkClick,
    onStudioClick,
    onVetClick,
    onGameClick,
    onSearchClick,
    onCommunityRadarClick,
    onAIAsistantClick
}: HubOverlayProps) {
    const { activePet } = usePet();
    const { unreadMessageCount, dailyReminders, todayStats, activeOrder, nextHealthAlert } = useHubData();
    
    // Simulations and Mock Pro Data
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    const fastBasket = [
        { id: 1, name: "Premium Kuzu Etli Mama", price: "289₺", img: "https://images.unsplash.com/photo-1589924691106-07a2cdd215b5?q=80&w=200" },
        { id: 2, name: "Somonlu Ödül Bisküvisi", price: "85₺", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=200" },
        { id: 3, name: "Tavuklu Konserve", price: "45₺", img: "https://images.unsplash.com/photo-1544488483-301ba359eaa4?q=80&w=200" }
    ];

    const nearbyClinics = [
        { name: "Pati Hayat 7/24 Klinik", dist: "450m", status: "Açık • Acil Servis" },
        { name: "Moffi Vet Center", dist: "1.2km", status: "Açık • Uzman Ekip" }
    ];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, [isOpen]);

    const mainActions = [
        { id: 'radar', label: 'Topluluk Radarı', sub: 'Kayıp / Sahiplen', icon: Radar, color: 'bg-gradient-to-br from-cyan-500 to-blue-600', onClick: onCommunityRadarClick },
    ];

    const marketCategories = [
        { icon: ShoppingBag, label: 'Market', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', onClick: onMarketClick },
        { icon: Stethoscope, label: 'Veteriner', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', onClick: onVetClick },
        { icon: Globe, label: 'Moffi.net', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', onClick: onMoffinetClick },
    ];

    // Dynamic Health Metrics Based on Active Pet (Mock but stable per ID)
    const getPetPulse = (petId: any) => {
        if (!petId) return 78;
        const idStr = String(petId);
        const seed = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return 70 + (seed % 20); // Steady pulse between 70-90
    };

    const getPetAge = (pet: any) => {
        if (!pet) return "1.2";
        if (pet.birthday) {
            try {
                // Handle Turkish month names in birthday strings
                const months: Record<string, string> = {
                    'ocak': '01', 'subat': '02', 'mart': '03', 'nisan': '04', 'mayis': '05', 'haziran': '06',
                    'temmuz': '07', 'agustos': '08', 'eylul': '09', 'ekim': '10', 'kasim': '11', 'aralik': '12'
                };
                
                let bStr = pet.birthday.toLowerCase()
                    .replace('ı', 'i').replace('ş', 's').replace('ç', 'c').replace('ö', 'o').replace('ü', 'u').replace('ğ', 'g');
                
                let datePart = bStr;
                Object.keys(months).forEach(m => {
                    if (bStr.includes(m)) {
                        datePart = bStr.replace(m, months[m]);
                    }
                });

                const parts = datePart.match(/\d+/g);
                if (parts && parts.length === 3) {
                    // Try to detect DD-MM-YYYY
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    const birth = new Date(`${year}-${month}-${day}`);
                    if (!isNaN(birth.getTime())) {
                        const diff = new Date().getTime() - birth.getTime();
                        return Math.abs(diff / (1000 * 3600 * 24 * 365.25)).toFixed(1);
                    }
                }
            } catch (e) {
                console.error("Age calculation error:", e);
            }
        }
        return pet.age || (String(pet.id || "").length % 5 + 0.8).toFixed(1);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 h-[100dvh] w-screen z-[2000] backdrop-blur-3xl overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col pt-safe px-4 sm:px-6 pb-24 touch-none"
                    style={{ background: 'var(--background)' }}
                >
                    <div className="flex-1 flex flex-col w-full max-w-full pointer-events-auto touch-auto">
                        {/* TOP HEADER: TITLE & VET-LINE QUICK ACCESS */}
                        <div className="flex justify-between items-start py-4 sm:py-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Moffi Pro</p>
                                </div>
                                <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tighter uppercase italic">Control Hub</h2>
                            </div>
                            
                            <div className="flex flex-col items-end gap-4">
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => { onAIAsistantClick?.(); onClose(); }}
                                        className="h-12 w-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                                        title="Moffi AI Asistan"
                                    >
                                        <Sparkles size={22} />
                                    </button>
                                    <button 
                                        onClick={() => alert("Vet-Line 7/24 Canlı Destek Başlatılıyor...")}
                                        className="h-12 px-4 rounded-2xl bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <PhoneCall size={16} />
                                        <span>Vet-Line</span>
                                    </button>
                                    <button 
                                        onClick={onClose}
                                        className="w-12 h-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--foreground)] active:scale-95 transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-2xl font-black text-[var(--foreground)] italic opacity-40">{currentTime}</p>
                            </div>
                        </div>


                    {/* LIVE STATUS WIDGETS (SOCIAL & HEALTH) */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {/* PATI RADARI WIDGET */}
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="text-cyan-500" size={60} strokeWidth={1} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                    <Radar className="text-cyan-400" size={16} />
                                </div>
                                <span className="text-[9px] font-black text-[var(--secondary-text)] uppercase tracking-widest">Pati Radarı</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-[var(--foreground)] italic">12</span>
                                <span className="text-xs text-cyan-400 font-bold uppercase italic">Arkadaş</span>
                            </div>
                            <p className="text-[8px] text-[var(--secondary-text)] font-bold uppercase mt-2">Çevrende Aktif • Park Bölgesi</p>
                        </div>

                        {/* HEALTH ALERT / NEXT VACCINE WIDGET */}
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <ShieldAlert className="text-red-500" size={60} strokeWidth={1} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <Activity className="text-red-400" size={16} />
                                </div>
                                <span className="text-[9px] font-black text-[var(--secondary-text)] uppercase tracking-widest">Kritik Görev</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-[var(--foreground)] italic uppercase leading-none truncate">Karma Aşı II</span>
                                <span className="text-xs text-red-400 font-bold uppercase italic mt-1 pb-1">3 GÜN KALDI</span>
                            </div>
                        </div>
                    </div>

                    {/* LIVE LOGISTICS (MOFFI EXPRESS PRO) */}
                    {activeOrder && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-[3rem] p-6 flex flex-col gap-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white italic tracking-tight uppercase">Moffi Express ⚡️</h4>
                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Yolda • Paket İçeriği: Premium Kuzu Mama</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white italic tracking-tighter">1.4 km</p>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">Tahmini: 8dk</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* HIZLI SEPET (SMART BASKET) */}
                    <div className="mt-6 mb-4">
                        <div className="flex items-center justify-between mb-6 px-4">
                            <h3 className="text-[11px] font-black text-[var(--secondary-text)] uppercase tracking-[0.3em]">Hızlı Sepet</h3>
                            <button onClick={onMarketClick} className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Tümünü Gör</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
                            {fastBasket.map((item) => (
                                <div key={item.id} className="min-w-[140px] bg-foreground/[0.03] border border-glass-border rounded-[2.5rem] p-4 flex flex-col gap-3 group">
                                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative">
                                        <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                                            <ShoppingCart size={14} />
                                        </button>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-foreground leading-tight uppercase truncate">{item.name}</p>
                                        <p className="text-xs font-black text-orange-400 mt-1 italic">{item.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CRITICAL & COMMUNITY ACTIONS (APPLE STYLE SIDE-BY-SIDE) */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        {/* SOS BUTTON */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => { onSOSClick(); onClose(); }}
                            className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-6 flex flex-col items-start gap-4 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">ACİL DURUM</h3>
                                <p className="text-[10px] text-red-500/70 font-bold uppercase mt-1">Hızlı SOS</p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
                        </motion.button>

                        {/* COMMUNITY RADAR BUTTON */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => { onCommunityRadarClick(); onClose(); }}
                            className="bg-cyan-500/10 border border-cyan-500/20 rounded-[2.5rem] p-6 flex flex-col items-start gap-4 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                                <Radar size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">TOPLULUK</h3>
                                <p className="text-[10px] text-cyan-500/70 font-bold uppercase mt-1">Pati Radarı</p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
                        </motion.button>
                    </div>

                    {/* EN YAKIN KLİNİK RADARI */}
                    <div className="mt-6 px-2">
                        <h3 className="text-[11px] font-black text-[var(--secondary-text)] uppercase tracking-[0.3em] mb-4">En Yakın Klinik Radarı</h3>
                        <div className="space-y-3">
                            {nearbyClinics.map((clinic, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { onVetClick(); onClose(); }}
                                    className="w-full bg-foreground/5 border border-glass-border rounded-[2.5rem] p-5 flex items-center justify-between group hover:border-emerald-500/20 hover:bg-foreground/10 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/0 group-hover:shadow-emerald-500/20">
                                            <MapPin size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-foreground italic tracking-tight uppercase">{clinic.name}</h4>
                                            <p className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">{clinic.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <span className="text-lg font-black text-foreground italic">{clinic.dist}</span>
                                        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-secondary group-hover:text-foreground group-hover:bg-foreground/10 transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* MARKET CATEGORIES GRID */}
                    <div className="mt-8 space-y-4">
                        <h3 className="text-[11px] font-black text-[var(--secondary-text)] uppercase tracking-[0.2em] mb-4 text-center">Marketler & Servisler</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {marketCategories.map((service, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + (i * 0.05) }}
                                    onClick={() => { service.onClick(); onClose(); }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center active:scale-90 transition-all border", service.bg)}>
                                        <service.icon className={cn("w-7 h-7", service.color)} />
                                    </div>
                                    <span className="text-[9px] font-black text-[var(--secondary-text)] uppercase tracking-tight text-center">{service.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8" />

                    {/* APPLE STYLE BOTTOM SERVICES GROUP */}
                    <div className="mb-safe-bottom pb-8">
                        <div className="bg-glass backdrop-blur-3xl border border-glass-border rounded-[2.5rem] p-6 shadow-2xl">
                            <div className="grid grid-cols-3 gap-8">
                                {[
                                    { icon: Palette, label: 'Stüdyo', color: 'text-purple-400', bg: 'bg-purple-500/10', onClick: onStudioClick },
                                    { icon: Gamepad2, label: 'Oyun', color: 'text-indigo-400', bg: 'bg-indigo-500/10', onClick: onGameClick },
                                    { icon: PawPrint, label: 'Yürüyüş', color: 'text-emerald-400', bg: 'bg-emerald-500/10', onClick: onWalkClick },
                                ].map((service, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 * i }}
                                        onClick={() => { service.onClick(); onClose(); }}
                                        className="flex flex-col items-center gap-3 active:scale-95 transition-all group"
                                    >
                                        <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center border border-glass-border relative shadow-lg group-hover:shadow-foreground/5 transition-all", service.bg)}>
                                            <service.icon className={cn("w-7 h-7", service.color)} />
                                        </div>
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest group-hover:text-foreground transition-colors">{service.label}</span>
                                    </motion.button>
                                ))}
                        </div>
                    </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
