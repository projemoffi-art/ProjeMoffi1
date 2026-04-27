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
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 h-[100dvh] w-screen z-[2000] backdrop-blur-3xl flex flex-col overflow-hidden"
                    style={{ background: 'var(--background)' }}
                >
                    {/* MOFFI PRO STICKY HEADER */}
                    <div className="pt-safe px-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl z-[2001]">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">Moffi Pro Hub</p>
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none">Control Center</h2>
                            </div>
                            <div className="flex gap-2.5">
                                <button 
                                    onClick={() => onAIAsistantClick?.()}
                                    className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/20 active:scale-95 transition-all"
                                >
                                    <Sparkles size={18} />
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center border border-white/10 active:scale-95 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-end mt-1">
                            <button 
                                onClick={() => alert("Vet-Line 7/24 Canlı Destek Başlatılıyor...")}
                                className="h-10 px-4 rounded-xl bg-indigo-500 text-white flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                <PhoneCall size={14} />
                                <span>Vet-Line</span>
                            </button>
                            <div className="text-right">
                                <p className="text-3xl font-black text-foreground italic tracking-tighter leading-none">{currentTime}</p>
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sistem Aktif • TR</p>
                            </div>
                        </div>
                    </div>

                    {/* MOFFI PRO SCROLLABLE BODY */}
                    <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-6 pb-32 pt-6">
                        <div className="w-full max-w-full mx-auto space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-6 relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <Radar size={16} />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pati Radarı</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-foreground italic">12</span>
                                        <span className="text-xs text-cyan-400 font-bold uppercase italic">Arkadaş</span>
                                    </div>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase mt-2">Çevrende Aktif</p>
                                </div>
                                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-6 relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                            <Activity size={16} />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Kritik Görev</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-foreground italic uppercase leading-none truncate">Karma Aşı II</span>
                                        <span className="text-xs text-red-400 font-bold uppercase italic mt-1">3 GÜN KALDI</span>
                                    </div>
                                </div>
                            </div>

                            {activeOrder && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-[2.5rem] p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                                <Truck size="20" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-white italic tracking-tight uppercase leading-none">Moffi Express ⚡️</h4>
                                                <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mt-1">Paket Yolda • 8dk</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white italic tracking-tighter">1.4 km</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hızlı Sepet</h3>
                                    <button onClick={onMarketClick} className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Market</button>
                                </div>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar px-1">
                                    {fastBasket.map((item) => (
                                        <div key={item.id} className="min-w-[130px] bg-foreground/5 border border-white/5 rounded-[2rem] p-4 flex flex-col gap-3">
                                            <div className="w-full aspect-square rounded-2xl overflow-hidden relative">
                                                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                                <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"><ShoppingCart size={12} /></button>
                                            </div>
                                            <div className="text-left px-1">
                                                <p className="text-[9px] font-black text-foreground leading-tight uppercase truncate">{item.name}</p>
                                                <p className="text-[10px] font-black text-orange-400 mt-1 italic">{item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => onSOSClick()} className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6 flex flex-col items-start gap-3 active:scale-95 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white"><ShieldAlert size={20} /></div>
                                    <div className="text-left">
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">ACİL DURUM</h3>
                                        <p className="text-[9px] text-red-500/70 font-bold uppercase mt-0.5">SOS Gönder</p>
                                    </div>
                                </button>
                                <button onClick={() => onCommunityRadarClick()} className="bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] p-6 flex flex-col items-start gap-3 active:scale-95 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white"><Radar size={20} /></div>
                                    <div className="text-left">
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">RADAR</h3>
                                        <p className="text-[9px] text-cyan-500/70 font-bold uppercase mt-0.5">Pati Radarı</p>
                                    </div>
                                </button>
                            </div>

                            <div className="space-y-4 px-1">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Yakın Klinikler</h3>
                                {nearbyClinics.map((clinic, i) => (
                                    <button key={i} onClick={() => onVetClick()} className="w-full bg-foreground/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between active:scale-[0.98] transition-all">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><MapPin size={18} /></div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground italic uppercase leading-none">{clinic.name}</h4>
                                                <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">{clinic.status}</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-foreground italic">{clinic.dist}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Marketler & Servisler</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {marketCategories.map((service, i) => (
                                        <button key={i} onClick={() => service.onClick()} className="flex flex-col items-center gap-2">
                                            <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center active:scale-90 transition-all border", service.bg)}>
                                                <service.icon className={cn("w-6 h-6", service.color)} />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight text-center">{service.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 pb-12">
                                <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { icon: Palette, label: 'Stüdyo', color: 'text-purple-400', bg: 'bg-purple-500/10', onClick: onStudioClick },
                                            { icon: Gamepad2, label: 'Oyun', color: 'text-indigo-400', bg: 'bg-indigo-500/10', onClick: onGameClick },
                                            { icon: PawPrint, label: 'Yürüyüş', color: 'text-emerald-400', bg: 'bg-emerald-500/10', onClick: onWalkClick },
                                        ].map((service, i) => (
                                            <button key={i} onClick={() => service.onClick()} className="flex flex-col items-center gap-2.5 active:scale-95 transition-all">
                                                <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center border border-white/5 shadow-lg shadow-black/20", service.bg)}>
                                                    <service.icon className={cn("w-6 h-6", service.color)} />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{service.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
