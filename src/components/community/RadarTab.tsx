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
        <div className="w-full h-[380px] rounded-[2.5rem] bg-[var(--card-bg)] border border-white/10 flex flex-col items-center justify-center text-[var(--secondary-text)]">
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
    filterPetType: 'all' | 'dog' | 'cat';
    setFilterPetType: (val: 'all' | 'dog' | 'cat') => void;
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
    
    filterPetType,
    setFilterPetType,
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
            <div className="w-full max-w-md mx-auto relative">
                {/* RADAR SUB-TAB SELECTOR (Apple Style Navigation) */}
                <div className="w-full px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-xl">
                    <button 
                        onClick={() => setActiveTab('feed')}
                        className="w-10 h-10 rounded-full bg-[var(--card-bg)] border border-white/5 flex items-center justify-center text-[var(--secondary-text)] hover:text-white transition-all active:scale-90 shadow-lg"
                        title="Geri Dön"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <div className="flex bg-[var(--card-bg)] p-1 rounded-2xl border border-white/10 w-full max-w-[200px] shadow-sm ml-2">
                        <button 
                            onClick={() => setRadarTabMode('lost')}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                radarTabMode === 'lost' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                            )}
                        >
                            Kayıp
                        </button>
                        <button 
                            onClick={() => setRadarTabMode('adopt')}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                radarTabMode === 'adopt' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                            )}
                        >
                            Sahiplen
                        </button>
                    </div>
                    
                    <div className="w-10 h-10" />
                </div>

                {/* Pet Switcher for Radar Context */}
                <div className="flex justify-center mt-6 mb-2">
                    <PetSwitcher onAddPet={() => setIsLostAdModalOpen(true)} />
                </div>

                <div className="w-full">
                    <div className="px-6 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Advanced Filters */}
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
                            <select 
                                value={filterPetType}
                                onChange={(e) => setFilterPetType(e.target.value as any)}
                                className="px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-white/10 text-[10px] font-black uppercase tracking-wider text-[var(--foreground)] outline-none focus:border-cyan-500 transition-colors"
                            >
                                <option value="all">🐾 Tüm Türler</option>
                                <option value="dog">🐶 Köpek</option>
                                <option value="cat">🐱 Kedi</option>
                            </select>

                            <select 
                                value={filterDistance}
                                onChange={(e) => setFilterDistance(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-white/10 text-[10px] font-black uppercase tracking-wider text-[var(--foreground)] outline-none focus:border-cyan-500 transition-colors"
                            >
                                <option value="all">📍 Tüm Mesafeler</option>
                                <option value="1">1 km Yakınında</option>
                                <option value="5">5 km Yakınında</option>
                                <option value="10">10 km Yakınında</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-[var(--card-bg)] p-0.5 rounded-2xl border border-white/5 shadow-md self-end sm:self-auto shrink-0">
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
                            <div className="w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative" style={{ height: "380px" }}>
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
                                        <div key={i} className="w-full h-24 rounded-3xl bg-[var(--card-bg)] animate-pulse border border-white/5" />
                                    ))}
                                </div>
                            ) : lostPets.length > 0 ? (
                                <div className="space-y-4 px-6 pb-10">
                                    {lostPets.map((pet) => (
                                        <div 
                                            key={pet.id} 
                                            className={cn(
                                                "w-full rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all active:scale-[0.98] relative group overflow-hidden border",
                                                pet.reward_enabled 
                                                    ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                                                    : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                                            )}
                                            onClick={() => setSelectedLostPet(pet)}
                                        >
                                            {/* Apple style blur background for red/gold accent */}
                                            <div className={cn(
                                                "absolute top-0 right-0 w-32 h-32 blur-[40px] -mr-10 -mt-10 rounded-full pointer-events-none",
                                                pet.reward_enabled ? "bg-amber-500/10" : "bg-red-500/10"
                                            )} />

                                            {user?.id === pet.user_id && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteSOS(pet.id); }} 
                                                    className={cn(
                                                        "absolute right-3 top-3 px-3 py-1.5 rounded-full bg-[var(--card-bg)] text-[10px] font-bold uppercase transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 z-10 shadow-lg",
                                                        pet.reward_enabled ? "border-amber-500/30 text-amber-400" : "border-red-500/30 text-red-400"
                                                    )}
                                                >
                                                    <Trash2 className="w-3 h-3" /> Sil
                                                </button>
                                            )}

                                            <div className="flex gap-4 items-center">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner overflow-hidden",
                                                    pet.reward_enabled ? "bg-amber-500/20 border-amber-500/30" : "bg-red-500/20 border-red-500/30"
                                                )}>
                                                    {pet.img ? (
                                                        <img src={pet.img} className="w-full h-full object-cover" alt={pet.name} />
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <ShieldAlert className={cn("w-6 h-6", pet.reward_enabled ? "text-amber-500" : "text-red-500")} />
                                                            <span className={cn("text-[8px] font-black mt-1", pet.reward_enabled ? "text-amber-500" : "text-red-500")}>SOS</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <p className={cn("font-black text-lg tracking-tight truncate", pet.reward_enabled ? "text-amber-500" : "text-red-500")}>{pet.name}</p>
                                                            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold border", pet.reward_enabled ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : "bg-red-500/20 border-red-500/30 text-red-500")}>Kayıp</span>
                                                        </div>
                                                        {pet.reward_enabled && pet.reward && (
                                                            <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg -mt-1">ÖDÜL</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[var(--secondary-text)] text-xs font-medium truncate">{pet.type || "Bilinmiyor"}</p>
                                                    <p className={cn("text-[10px] mt-1.5 flex items-center gap-1 font-black", pet.reward_enabled ? "text-amber-400/80" : "text-red-400/80")}><MapPin className="w-3 h-3 text-cyan-400" /> {pet.last_seen_location || pet.location}</p>
                                                </div>
                                                <ChevronRight className={cn("w-5 h-5", pet.reward_enabled ? "text-amber-500/50" : "text-red-500/50")} />
                                            </div>
                                            <p className="text-[var(--foreground)]/70 text-[11px] mt-1 leading-snug line-clamp-2 px-1 font-medium italic">"{pet.description || "Lütfen görünce acil dönüş yapın."}"</p>
                                            
                                            <div className="mt-2 flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); /* Logic handled by parent select/click */ setSelectedLostPet(pet); }}
                                                    className="flex-1 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                                >
                                                    İletişime Geç
                                                </button>
                                                <button 
                                                    className="px-4 py-3 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
                                                >
                                                    Konum Paylaş
                                                </button>
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
