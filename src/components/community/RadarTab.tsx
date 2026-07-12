'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Trash2, MapPin, ChevronRight, ChevronLeft, Sliders, Trash } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PetSwitcher } from '../common/PetSwitcher';

const RadarMap = dynamic(() => import('@/components/community/RadarMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[380px] rounded-[2.5rem] bg-[var(--card-bg)] border border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-[var(--secondary-text)]">
            <Activity className="w-8 h-8 mb-2 animate-spin text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-wider">Harita Yükleniyor...</p>
        </div>
    )
});

interface RadarTabProps {
    user: any;
    lostPets: any[];
    isLoading: boolean;
    userCoords: [number, number] | undefined;
    
    // Filters and view modes
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    filterDistance: 'all' | number;
    setFilterDistance: (val: 'all' | number) => void;
    radarViewMode: 'list' | 'map';
    setRadarViewMode: (val: 'list' | 'map') => void;
    
    radarTabMode: 'lost' | 'adopt';
    setRadarTabMode: (val: 'lost' | 'adopt') => void;
    setActiveTab: (val: string) => void;
    
    // Modals & Actions
    setIsLostAdModalOpen: (val: boolean) => void;
    setSelectedLostPet: (pet: any) => void;
    onDeleteSOS: (id: string) => void;
}

export function RadarTab({
    user,
    lostPets,
    isLoading,
    userCoords,
    
    selectedCategory,
    setSelectedCategory,
    filterDistance,
    setFilterDistance,
    radarViewMode,
    setRadarViewMode,
    
    radarTabMode,
    setRadarTabMode,
    setActiveTab,
    
    setIsLostAdModalOpen,
    setSelectedLostPet,
    onDeleteSOS
}: RadarTabProps) {
    return (
        <motion.div
            key="radar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full pb-32 bg-[var(--background)] flex flex-col items-center"
        >
            {/* HORIZONTAL FILTER PILLS */}
            <div className="w-full overflow-x-auto no-scrollbar px-6 mb-6 pb-2 flex gap-3 snap-x">
                {["Tümü", "Kediler", "Köpekler", "Kuşlar", "Diğer"].map((pill) => (
                    <button
                        key={pill}
                        onClick={() => setSelectedCategory(pill)}
                        className={cn(
                            "snap-start whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95",
                            selectedCategory === pill
                                ? "bg-white text-black shadow-lg shadow-white/20"
                                : "bg-card dark:bg-[#1C1C1E] text-[#8E8E93] border border-[var(--card-border)] hover:bg-black/10 dark:bg-white/10 hover:text-[var(--foreground)]"
                        )}
                    >
                        {pill}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-md mx-auto relative px-2">


                {/* Pet Switcher for Radar Context */}
                <div className="flex justify-center mt-6 mb-2">
                    <PetSwitcher onAddPet={() => setIsLostAdModalOpen(true)} />
                </div>

                <div className="w-full">
                    <div className="px-6 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Advanced Filters */}
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
                            <select 
                                value={filterDistance}
                                onChange={(e) => setFilterDistance(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-[var(--foreground)] outline-none focus:border-cyan-500 transition-colors"
                            >
                                <option value="all">📍 Tüm Mesafeler</option>
                                <option value="1">1 km Yakınında</option>
                                <option value="5">5 km Yakınında</option>
                                <option value="10">10 km Yakınında</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-[var(--card-bg)] p-0.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-md self-end sm:self-auto shrink-0">
                            <button 
                                onClick={() => setRadarViewMode('list')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    radarViewMode === 'list' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                                )}
                            >
                                📋 Liste
                            </button>
                            <button 
                                onClick={() => setRadarViewMode('map')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    radarViewMode === 'map' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                                )}
                            >
                                🗺️ Harita
                            </button>
                        </div>
                    </div>

                    {radarViewMode === 'map' ? (
                        <div className="w-full pt-6 px-6 pb-10 relative">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Yakınımdaki İhbarlar</h3>
                                <button onClick={() => setIsLostAdModalOpen(true)} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20">
                                    + İlan Ekle
                                </button>
                            </div>
                            <div className="w-full rounded-[2.5rem] overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl relative" style={{ height: "380px" }}>
                                <RadarMap 
                                    lostPets={lostPets} 
                                    onPetClick={(pet) => setSelectedLostPet(pet)} 
                                    userPos={userCoords}
                                />
                            </div>
                        </div>
                    ) : (
                        /* SOS / KAYIP İLANLARI (Vertical List) */
                        <div className="w-full pt-6 pb-2 relative">
                            <div className="px-6 mb-6 flex items-center justify-between">
                                <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Aktif İhbarlar</h3>
                                <button onClick={() => setIsLostAdModalOpen(true)} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20">
                                    + İlan Ekle
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="space-y-4 px-6 pb-10">
                                    {Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="w-full h-24 rounded-3xl bg-[var(--card-bg)] animate-pulse border border-black/5 dark:border-white/5" />
                                    ))}
                                </div>
                            ) : lostPets.length > 0 ? (
                                <div className="columns-2 gap-3 sm:gap-4 px-6 pb-10 w-full">
                                    {lostPets.map((pet) => (
                                        <div 
                                            key={pet.id} 
                                            className={cn(
                                                "break-inside-avoid mb-3 sm:mb-4 flex flex-col rounded-3xl cursor-pointer transition-all active:scale-[0.98] relative group overflow-hidden border shadow-sm hover:shadow-md",
                                                pet.reward_enabled 
                                                    ? "bg-amber-500/5 border-amber-500/30" 
                                                    : "bg-red-500/5 border-red-500/20"
                                            )}
                                            onClick={() => setSelectedLostPet(pet)}
                                        >
                                            {/* Masonry Image Container */}
                                            <div className="w-full relative aspect-[4/5] bg-white dark:bg-black">
                                                {pet.img ? (
                                                    <img src={pet.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={pet.name} />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10">
                                                        <ShieldAlert className={cn("w-8 h-8", pet.reward_enabled ? "text-amber-500" : "text-red-500")} />
                                                    </div>
                                                )}
                                                
                                                {/* Overlay Gradient for Text Readability */}
                                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                                
                                                {/* SOS Badge */}
                                                <div className={cn(
                                                    "absolute top-2.5 right-2.5 px-2 py-1 rounded-lg backdrop-blur-md text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1",
                                                    pet.reward_enabled ? "bg-amber-500/90 text-black" : "bg-red-500/90 text-white"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", pet.reward_enabled ? "bg-white dark:bg-black" : "bg-white")} />
                                                    SOS
                                                </div>

                                                {user?.id === pet.user_id && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteSOS(pet.id); }} 
                                                        className={cn(
                                                            "absolute top-2.5 left-2.5 w-7 h-7 rounded-full backdrop-blur-md border flex items-center justify-center transition-all z-10",
                                                            pet.reward_enabled ? "bg-amber-500/20 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black" : "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                                                        )}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* Pet Name on Image */}
                                                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <h4 className="text-white font-black text-sm tracking-tight truncate drop-shadow-md">{pet.name}</h4>
                                                        {pet.reward_enabled && pet.reward && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shrink-0">ÖDÜL</span>
                                                        )}
                                                    </div>
                                                    <p className={cn("font-bold text-[10px] truncate drop-shadow-md flex items-center gap-1", pet.reward_enabled ? "text-amber-400" : "text-red-400")}>
                                                        <MapPin className="w-2.5 h-2.5" /> {pet.last_seen_location || pet.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 mx-6 mb-4 bg-red-500/5 rounded-3xl border border-red-500/10">
                                    <ShieldAlert className="w-10 h-10 text-red-500/20 mx-auto mb-3" />
                                    <p className="text-xs text-red-500/40 font-bold tracking-wide">Aktif İhbar Bulunmuyor</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
