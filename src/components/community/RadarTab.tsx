'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Trash2, MapPin, ChevronRight } from 'lucide-react';
import { PetSwitcher } from '../common/PetSwitcher';

interface RadarTabProps {
    onAddSOS: () => void;
    lostPets: any[];
    isLoading: boolean;
    user: any;
    onDeleteSOS: (id: string) => void;
    onPetClick: (pet: any) => void;
}

export function RadarTab({
    onAddSOS,
    lostPets,
    isLoading,
    user,
    onDeleteSOS,
    onPetClick
}: RadarTabProps) {
    return (
        <motion.div
            key="radar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-full w-full overflow-y-auto no-scrollbar pb-32 bg-[#0A0A0E] flex flex-col items-center"
        >
            <div className="w-full max-w-md mx-auto relative px-6 pt-8">
                <div className="flex justify-center mb-8">
                    <PetSwitcher onAddPet={onAddSOS} />
                </div>
                
                <div className="w-full pt-2 pb-2 px-0 border-b border-red-500/20 relative">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Aktif İhbarlar</h3>
                        <button onClick={onAddSOS} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all">
                            + İlan Ekle
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="px-6 py-4 animate-pulse">
                            <div className="h-24 bg-white/5 rounded-2xl w-full" />
                        </div>
                    ) : lostPets.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4 snap-x snap-mandatory">
                            {lostPets.map((pet) => (
                                <div key={pet.id} className="shrink-0 w-[85vw] max-w-[320px] snap-center bg-red-500/10 border border-red-500/30 rounded-none p-4 flex flex-col gap-3 cursor-pointer hover:bg-red-500/20 transition-colors shadow-sm relative group" onClick={() => onPetClick(pet)}>
                                    {user?.id === pet.user_id ? (
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteSOS(pet.id); }} className="absolute right-3 top-3 px-3 py-1.5 rounded-full bg-[#12121A] border border-red-500/30 text-red-400 text-[10px] font-bold uppercase transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 z-10 shadow-lg shadow-black/50">
                                            <Trash2 className="w-3 h-3" /> Sil
                                        </button>
                                    ) : (
                                        <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center -mr-1 -mt-1"><ChevronRight className="w-4 h-4 text-red-500" /></div>
                                    )}

                                    <div className="flex gap-4 items-start">
                                        <div className="w-16 h-16 rounded-xl bg-red-500/20 flex flex-col items-center justify-center shrink-0 border border-red-500/30 shadow-inner group-hover:bg-red-500/30 transition-colors relative overflow-hidden">
                                            {pet.img ? (
                                                <img src={pet.img} className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full" />
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest relative z-10 bg-[#0a0a0e]/50 px-1 py-0.5 rounded">SOS</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex-1 mt-0.5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2">Dikkat Kayıp!</h3>
                                                {pet.reward_enabled && pet.reward && (
                                                    <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                                                        Ödüllü
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white font-black text-base mt-0.5 tracking-tight">{pet.name} <span className="text-xs text-white/50 font-normal">({pet.type || "Bilinmiyor"})</span></p>
                                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1 opacity-100 font-bold"><MapPin className="w-3 h-3 text-cyan-400" /> {pet.last_seen_location || pet.location}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-[10px] mt-1 leading-snug line-clamp-2 px-1 italic">"{pet.description || "Lütfen görünce acil dönüş yapın."}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 mx-6 mb-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Yakınlarda aktif bir kayıp ilanı bulunmuyor. İyiyiz! 🐾</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
