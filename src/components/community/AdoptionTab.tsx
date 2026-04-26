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
    const categories = ["Hepsi", "🐱 Kediler", "🐶 Köpekler", "🦜 Kuşlar", "🚨 Acil", "🏢 Apartmana"];

    const filtered = ads.filter(ad => {
        if (selectedCategory === "Hepsi") return true;
        if (selectedCategory === "🐱 Kediler") return ad.pet_type === "cat" || ad.breed?.toLowerCase().includes("kedi");
        if (selectedCategory === "🐶 Köpekler") return ad.pet_type === "dog" || ad.breed?.toLowerCase().includes("köpek");
        if (selectedCategory === "🦜 Kuşlar") return ad.pet_type === "bird" || ad.breed?.toLowerCase().includes("kuş");
        if (selectedCategory === "🚨 Acil") return ad.is_emergency === true;
        if (selectedCategory === "🏢 Apartmana") return ad.is_apartment_friendly === true;
        return true;
    });

    return (
        <motion.div
            key="adoption"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-full w-full overflow-y-auto no-scrollbar pb-32 bg-background flex flex-col items-center"
        >
            <div className="w-full max-w-md mx-auto relative mt-2">
                <div className="px-6 mb-8 mt-2 flex items-center justify-between">
                    <div>
                        <p className="text-secondary text-[11px] font-bold uppercase tracking-widest mb-1">
                            Bugün Sahiplen
                        </p>
                        <h2 className="text-3xl font-black text-foreground tracking-tight mt-1">Sıcak Bir Yuva</h2>
                    </div>
                    <button onClick={onAddAd} className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/20 active:scale-95 transition-all outline outline-1 outline-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <Plus className="w-4 h-4" /> İlan Ver
                    </button>
                </div>

                <div className="w-full overflow-x-auto no-scrollbar px-6 mb-8 -mt-2 pb-2 flex gap-3 snap-x">
                    {categories.map((pill) => (
                        <button
                            key={pill}
                            onClick={() => setSelectedCategory(pill)}
                            className={cn(
                                "snap-start whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95",
                                selectedCategory === pill
                                    ? "bg-foreground text-background shadow-lg shadow-foreground/20"
                                    : "bg-foreground/5 text-secondary border border-glass-border hover:bg-foreground/10 hover:text-foreground"
                            )}
                        >
                            {pill}
                        </button>
                    ))}
                </div>

                <div className="w-full overflow-x-auto no-scrollbar px-6 mb-10 pb-6 flex gap-5 snap-x snap-mandatory">
                    {/* Featured cards - matching same click patterns */}
                    <div className="w-[88vw] max-w-[340px] shrink-0 snap-center rounded-[2rem] bg-gray-900 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[420px] group cursor-pointer" onClick={() => onAdClick({
                        name: "Luna'nın Hikayesi",
                        breed: "Apartmana Uygun",
                        desc: "Sakin, sevecen ve tamamen tuvalet eğitimli. Daha önce bir aile ortamında yaşadı, şimdi ikinci bir şans arıyor.",
                        img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600",
                        tags: ["Kısırlaştırılmış", "Aşılı", "Eğitimli"]
                    })}>
                        <div className="absolute inset-0 bg-black">
                            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6s] ease-out opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                        </div>
                        <div className="relative z-10 p-6">
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
                                Apartmana Uygun
                            </span>
                            <h3 className="text-3xl font-black text-white leading-tight mt-1 drop-shadow-lg">
                                Luna'nın Hikayesi
                            </h3>
                        </div>
                        <div className="flex-1" />
                        <div className="relative z-10 p-5">
                            <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md line-clamp-3 mb-4">
                                Sakin, sevecen ve tamamen tuvalet eğitimli. Daha önce bir aile ortamında yaşadı, şimdi ikinci bir şans arıyor.
                            </p>
                            <button className="w-full py-4 rounded-full bg-white text-black font-bold shadow-lg shadow-white/20 active:scale-95 transition-transform">
                                Hikayeyi Oku & Başvur
                            </button>
                        </div>
                    </div>
                    {/* (Other featured content omitted for brevity, but same layout applies) */}
                </div>

                <div className="px-6 mb-8 w-full">
                    <div className="flex justify-between items-end mb-4 pb-3">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Gerçek İlanlar</h2>
                        <span className="text-xs text-gray-500 font-bold bg-white/5 px-2 py-1 rounded-full">{ads.length} ilan</span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-[2rem] bg-white/5 border border-white/5 animate-pulse overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                    <div className="w-24 h-24 rounded-2xl bg-white/10 shrink-0" />
                                    <div className="flex-1 space-y-3 pt-2">
                                        <div className="h-5 w-32 bg-white/10 rounded-full" />
                                        <div className="h-4 w-20 bg-white/10 rounded-full" />
                                        <div className="h-3 w-24 bg-white/10 rounded-full opacity-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                            <HeartHandshake className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 font-bold">Henüz ilan yok</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((ad) => (
                                <div
                                    key={ad.id}
                                    className="flex flex-row items-center gap-4 bg-background p-3 rounded-2xl border border-glass-border active:bg-foreground/5 transition-colors cursor-pointer relative"
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
                                    <img src={ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200'} className="w-16 h-16 rounded-[1rem] object-cover shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="text-white font-bold text-base">{ad.name} <span className="text-gray-500 font-medium text-xs ml-1">• {ad.age}</span></h4>
                                        <p className="text-cyan-400 text-xs mt-0.5">{ad.breed}</p>
                                    </div>
                                    {user?.id === ad.user_id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteAd(ad.id); }}
                                            className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-500 mr-1 shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
