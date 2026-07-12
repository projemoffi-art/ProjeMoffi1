'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, HeartHandshake, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdoptionTabProps {
    user: any;
    onAddAd: () => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    onAdClick: (pet: any) => void;
    ads: any[];
    isLoading: boolean;
    onDeleteAd: (id: string) => void;
}

export function AdoptionTab({
    user,
    onAddAd,
    selectedCategory,
    setSelectedCategory,
    onAdClick,
    ads,
    isLoading,
    onDeleteAd
}: AdoptionTabProps) {
    const categories = ["Tümü", "Kediler", "Köpekler", "Kuşlar", "Acil Durum", "Apartman"];

    const filtered = ads.filter(ad => {
        if (selectedCategory === "Tümü" || selectedCategory === "Hepsi") return true;
        if (selectedCategory === "Kediler") return ad.pet_type === "cat" || ad.breed?.toLowerCase().includes("kedi");
        if (selectedCategory === "Köpekler") return ad.pet_type === "dog" || ad.breed?.toLowerCase().includes("köpek");
        if (selectedCategory === "Kuşlar") return ad.pet_type === "bird" || ad.breed?.toLowerCase().includes("kuş");
        if (selectedCategory === "Acil Durum") return ad.is_emergency === true;
        if (selectedCategory === "Apartman") return ad.is_apartment_friendly === true;
        return true;
    });

    return (
        <motion.div
            key="adoption"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full pb-32 bg-[var(--background)] flex flex-col items-center"
        >
            <div className="w-full max-w-md mx-auto relative mt-2">
                {/* ADOPTION HEADER */}
                <div className="px-6 mb-8 mt-2 flex items-center justify-between">
                    <div>
                        <p className="text-[var(--secondary-text)] text-[11px] font-bold uppercase tracking-widest mb-1">
                            Bugün Sahiplen
                        </p>
                        <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">Sıcak Bir Yuva</h2>
                    </div>
                    <button onClick={onAddAd} className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/20 active:scale-95 transition-all outline outline-1 outline-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-in fade-in duration-200">
                        <Plus className="w-4 h-4" /> İlan Ver
                    </button>
                </div>

                {/* HORIZONTAL FILTER PILLS */}
                <div className="w-full overflow-x-auto no-scrollbar px-6 mb-8 -mt-2 pb-2 flex gap-3 snap-x">
                    {categories.map((pill) => (
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

                {/* ADOPTION ADS LIST */}
                <div className="px-6 mb-8 w-full">
                    <div className="flex justify-between items-end mb-4 pb-3">
                        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">İlanlar</h2>
                        <span className="text-xs text-[var(--secondary-text)] font-bold bg-[var(--card-bg)] px-2 py-1 rounded-full">{ads.length} ilan</span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {Array(3).fill(0).map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                    <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 shrink-0" />
                                    <div className="flex-1 space-y-3 pt-2">
                                        <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded-full" />
                                        <div className="h-3 w-20 bg-black/10 dark:bg-white/10 rounded-full opacity-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 bg-[var(--card-bg)] rounded-3xl border border-black/10 dark:border-white/10">
                            <HeartHandshake className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3" />
                            <p className="text-[var(--secondary-text)] font-bold">Henüz ilan yok</p>
                        </div>
                    ) : (
                        <div className="columns-2 gap-3 sm:gap-4 w-full">
                            {filtered.map((ad) => (
                                <div
                                    key={ad.id}
                                    className="break-inside-avoid mb-3 sm:mb-4 flex flex-col bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden shadow-sm hover:shadow-md"
                                    onClick={() => onAdClick({
                                        id: ad.id,
                                        name: ad.name,
                                        breed: ad.breed,
                                        desc: ad.description || `${ad.name} sıcak bir yuva arıyor.`,
                                        img: ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600',
                                        images: ad.images || [ad.image_url],
                                        tags: [ad.age, ad.breed].filter(Boolean),
                                        user_id: ad.user_id,
                                        author_name: ad.author_name,
                                        author_avatar: ad.author_avatar,
                                        created_at: ad.created_at
                                    })}
                                >
                                    {/* Masonry Image Container */}
                                    <div className="w-full relative aspect-[4/5]">
                                        <img src={ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={ad.name} />
                                        
                                        {/* Overlay Gradient for Text Readability if needed */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                        
                                        {/* Quick Age Badge */}
                                        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                                            {ad.age}
                                        </div>

                                        {user?.id === ad.user_id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteAd(ad.id); }}
                                                className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        {/* Pet Name on Image */}
                                        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                                            <h4 className="text-white font-black text-sm tracking-tight truncate drop-shadow-md">{ad.name}</h4>
                                            <p className="text-cyan-300 font-bold text-[10px] mt-0.5 truncate drop-shadow-md">{ad.breed}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
