'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, MapPin, Search, Navigation, 
    Stethoscope, Trees, Coffee, ShoppingBag, 
    ShieldAlert, Zap, Layers, Compass, 
    ArrowLeft, Filter, Star, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Lazy load the map to avoid SSR issues and performance hits
const LiveMap = dynamic(() => import('@/components/walk/LiveMap'), { 
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-card-border border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-[0.5em]">Moffi Maps Yükleniyor...</p>
        </div>
    )
});

interface MoffiMapsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MoffiMapsModal({ isOpen, onClose }: MoffiMapsModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [userPos, setUserPos] = useState<[number, number]>([40.9850, 29.0300]); // Fallback

    // SYNC USER LOCATION
    useEffect(() => {
        if (isOpen && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.error("Map Geo Error:", err),
                { enableHighAccuracy: true }
            );
        }
    }, [isOpen]);

    const filters = [
        { id: 'vet', label: 'Veteriner', icon: Stethoscope, color: 'text-red-400', bg: 'bg-red-500/10' },
        { id: 'park', label: 'Parklar', icon: Trees, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'cafe', label: 'Dostu Kafeler', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { id: 'shop', label: 'Pet Shop', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    // Mock Dynamic Markers (RELATIVE TO REAL USER POSITION)
    const dynamicMarkers: any[] = [
        { id: 'lost-1', lat: userPos[0] + 0.002, lng: userPos[1] + 0.003, type: 'lost', title: 'LUNA KAYIP', desc: 'Sarı Tasma, Bölge civarı.', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200' },
        { id: 'friend-1', lat: userPos[0] - 0.001, lng: userPos[1] + 0.002, type: 'friend', title: 'Can & Max', desc: 'Yürüyüşte, sohbete açık!', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-[8000] bg-background overflow-hidden flex flex-col"
                >
                    {/* MAIN MAP AREA */}
                    <div className="absolute inset-0 w-full h-full z-0">
                        <LiveMap 
                            userPos={userPos} 
                            path={[]}
                            isTracking={false}
                            visitedPlaceIds={[]}
                            onPlaceClick={(place) => console.log(place)}
                            externalSearchQuery={searchQuery}
                            externalFilterType={activeFilter}
                            forceGuardianMode={isSOSActive}
                            markers={dynamicMarkers}
                            hideInternalUI={true}
                        />
                    </div>

                    {/* TOP FLOATING SEARCH & BACK */}
                    <div className="absolute top-0 inset-x-0 z-[8005] pt-safe px-4 py-6 pointer-events-none flex justify-between items-start gap-3">
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 shrink-0 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 active:scale-90 transition-all shadow-xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex-1 max-w-md h-12 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center px-4 pointer-events-auto shadow-xl">
                            <Search className="w-4 h-4 text-white/50 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Şehir veya mekan ara..."
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder-white/40 font-medium px-3 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="p-1">
                                    <X className="w-4 h-4 text-white/50" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT FLOATING ACTION BUTTONS (FABs) */}
                    <div className="absolute right-4 bottom-32 z-[8005] flex flex-col gap-3 pointer-events-none">
                        <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 active:scale-95 transition-all shadow-xl">
                            <Layers className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 active:scale-95 transition-all shadow-xl">
                            <Navigation className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setIsSOSActive(!isSOSActive)}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-2xl",
                                isSOSActive 
                                    ? "bg-white text-red-500 border border-white" 
                                    : "bg-red-500/90 backdrop-blur-2xl text-white border border-red-400"
                            )}
                        >
                            <ShieldAlert className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BOTTOM FLOATING FILTERS & AI RADAR */}
                    <div className="absolute bottom-6 inset-x-0 z-[8005] pointer-events-none flex flex-col gap-4">
                        {/* Compact AI Radar Pill */}
                        <div className="flex justify-center pointer-events-auto px-4">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={cn(
                                    "px-5 py-2.5 rounded-full backdrop-blur-2xl border flex items-center gap-2 text-xs font-bold shadow-2xl",
                                    isSOSActive 
                                        ? "bg-red-500/20 border-red-500/30 text-red-100" 
                                        : "bg-black/50 border-white/10 text-white/90"
                                )}
                            >
                                {isSOSActive ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Zap className="w-4 h-4 text-accent" />}
                                {isSOSActive ? "ACİL: En Yakın Vet Rotası Çizildi" : "Moffi Radar: Yakınlarda 15 Mekan"}
                            </motion.div>
                        </div>

                        {/* Minimalist Filter Chips */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto px-4 pb-2">
                            {filters.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-full backdrop-blur-2xl border transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-lg",
                                        activeFilter === f.id 
                                            ? "bg-accent border-accent text-white" 
                                            : "bg-black/50 border-white/10 text-white/70 hover:bg-black/70 hover:text-white"
                                    )}
                                >
                                    <f.icon className={cn("w-3.5 h-3.5", activeFilter === f.id ? "text-white" : f.color)} />
                                    <span className="text-[11px] font-bold tracking-wide">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
