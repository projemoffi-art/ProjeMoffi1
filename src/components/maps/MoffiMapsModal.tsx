'use client';

import React, { useState } from 'react';
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
            <div className="w-12 h-12 border-4 border-white/10 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Moffi Maps Yükleniyor...</p>
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

    const filters = [
        { id: 'vet', label: 'Veteriner', icon: Stethoscope, color: 'text-red-400', bg: 'bg-red-500/10' },
        { id: 'park', label: 'Parklar', icon: Trees, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'cafe', label: 'Dostu Kafeler', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { id: 'shop', label: 'Pet Shop', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    // Mock Dynamic Markers (Lost Pets & Friends)
    const dynamicMarkers: any[] = [
        { id: 'lost-1', lat: 41.0122, lng: 28.9854, type: 'lost', title: 'LUNA KAYIP', desc: 'Sarı Tasma, Altınbaşak Sokak civarı.', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200' },
        { id: 'lost-2', lat: 41.0052, lng: 28.9724, type: 'lost', title: 'FELIX KAYIP', desc: 'Siyah Kedi, Çip Numarası: 123...', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200' },
        { id: 'friend-1', lat: 41.0092, lng: 28.9804, type: 'friend', title: 'Can & Max', desc: 'Yürüyüşte, sohbete açık!', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200' },
        { id: 'friend-2', lat: 41.0072, lng: 28.9764, type: 'friend', title: 'Zeynep & Pamuk', desc: 'Parkta oyun oynuyoruz.', img: 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?q=80&w=200' },
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
                    {/* TOP NAVIGATION OVERLAY - PROFESSIONAL STACK */}
                    <div className="absolute top-0 inset-x-0 z-[8005] pt-safe px-4 pb-6 pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex flex-col gap-4 max-w-5xl mx-auto mt-2">
                            {/* SEARCH ROW */}
                            <div className="flex items-center gap-3 pointer-events-auto">
                                <button 
                                    onClick={onClose}
                                    className="w-11 h-11 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-0.5 shadow-2xl flex items-center">
                                    <div className="p-3">
                                        <Search className="w-4 h-4 text-white/40" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Şehir veya mekan ara..."
                                        className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-white/30 font-bold"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button className="p-3 text-white/40" onClick={() => setSearchQuery("")}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <button className="w-11 h-11 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
                                    <Layers className="w-5 h-5" />
                                </button>
                            </div>

                            {/* QUICK FILTERS ROW - MOVED DOWN */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto px-1">
                                {filters.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                                        className={cn(
                                            "px-4 py-2.5 rounded-xl backdrop-blur-xl border transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-lg",
                                            activeFilter === f.id 
                                                ? "bg-accent border-accent text-white" 
                                                : "bg-black/60 border-white/10 text-white/60 hover:bg-black/80"
                                        )}
                                    >
                                        <f.icon className={cn("w-3.5 h-3.5", activeFilter === f.id ? "text-white" : f.color)} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* MAIN MAP AREA */}
                    <div className="flex-1 w-full relative">
                        <LiveMap 
                            userPos={[41.0082, 28.9784]} // Default Istanbul
                            path={[]}
                            isTracking={false}
                            visitedPlaceIds={[]}
                            onPlaceClick={(place) => console.log(place)}
                            externalSearchQuery={searchQuery}
                            externalFilterType={activeFilter}
                            forceGuardianMode={isSOSActive}
                            markers={dynamicMarkers}
                        />
                    </div>

                    {/* BOTTOM INFO CARDS OVERLAY */}
                    <div className="absolute bottom-0 inset-x-0 z-[8005] p-6 pointer-events-none">
                        <div className="max-w-5xl mx-auto flex flex-col gap-4">
                            
                            {/* AI NEARBY ALERT */}
                            <motion.div 
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={cn(
                                    "backdrop-blur-2xl border p-5 rounded-[2.5rem] flex items-center justify-between pointer-events-auto shadow-2xl transition-all",
                                    isSOSActive ? "bg-red-500/20 border-red-500/30" : "bg-accent/10 border-accent/20"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-pulse",
                                        isSOSActive ? "bg-red-500 shadow-red-500/30" : "bg-accent shadow-accent/30"
                                    )}>
                                        {isSOSActive ? <ShieldAlert className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
                                    </div>
                                    <div>
                                        <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em] italic", isSOSActive ? "text-red-400" : "text-accent")}>
                                            {isSOSActive ? "ACİL DURUM MODU" : "Moffi AI Radar"}
                                        </h4>
                                        <p className="text-white font-bold text-sm tracking-tight mt-0.5">
                                            {isSOSActive ? "En yakın 3 veteriner rotası oluşturuldu. Ekip bilgilendirildi." : "Yakınlarda 12 evcil hayvan dostu mekan ve 3 veteriner aktif."}
                                        </p>
                                    </div>
                                </div>
                                <button className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all",
                                    isSOSActive ? "bg-red-500 text-white" : "bg-accent text-white"
                                )}>
                                    {isSOSActive ? "İPTAL" : "DETAYLAR"}
                                </button>
                            </motion.div>

                            {/* EMERGENCY SOS BUTTON */}
                            <div className="flex justify-between items-end">
                                <div className="flex gap-2">
                                    <button className="w-14 h-14 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto shadow-2xl">
                                        <Navigation className="w-6 h-6" />
                                    </button>
                                    <button className="w-14 h-14 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto shadow-2xl">
                                        <Info className="w-6 h-6" />
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setIsSOSActive(!isSOSActive)}
                                    className={cn(
                                        "px-8 h-16 rounded-[2rem] flex items-center gap-3 pointer-events-auto shadow-2xl active:scale-95 transition-all group overflow-hidden relative",
                                        isSOSActive ? "bg-white text-red-600 shadow-white/20" : "bg-red-500 text-white shadow-red-500/40"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <ShieldAlert className="w-6 h-6" />
                                    <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">
                                        {isSOSActive ? "MODU KAPAT" : "ACİL YARDIM (VET)"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
