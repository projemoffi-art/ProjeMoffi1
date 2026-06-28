'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coins, ShoppingBag, Heart, Zap, Crown, Gift, Star,
    ChevronRight, Lock, Check, Stethoscope, Package, Sparkles, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinStoreProps {
    coinBalance: number;
    userId: string;
    onPurchase?: (item: StoreItem, newBalance: number) => void;
    onClose?: () => void;
}

interface StoreItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    category: 'filter' | 'frame' | 'badge' | 'vet' | 'shop' | 'charity';
    icon: React.ElementType;
    gradient: string;
    preview?: string;
    isMock?: boolean;  // Gerçek entegrasyon sonraya
    isLimited?: boolean;
}

const STORE_ITEMS: StoreItem[] = [
    // Filtreler
    {
        id: 'filter_neon',
        name: 'Neon Aura Filtre',
        description: 'Hikayelerine ve postlarına özel neon parıltı efekti',
        cost: 30,
        category: 'filter',
        icon: Sparkles,
        gradient: 'from-cyan-500 to-blue-600',
        isMock: true,
    },
    {
        id: 'filter_golden',
        name: 'Altın Saat Filtre',
        description: 'Fotoğraflarına sinematik altın saat tonu',
        cost: 45,
        category: 'filter',
        icon: Star,
        gradient: 'from-amber-400 to-yellow-600',
        isMock: true,
    },
    // Çerçeveler
    {
        id: 'frame_champion',
        name: 'Şampiyon Çerçevesi',
        description: 'Podyum birincilerine özel altın profil çerçevesi',
        cost: 80,
        category: 'frame',
        icon: Crown,
        gradient: 'from-yellow-400 to-amber-500',
        isLimited: true,
        isMock: true,
    },
    {
        id: 'frame_duel',
        name: 'Düello Efendisi',
        description: 'Düello kazananlarına özel kılıç çerçevesi',
        cost: 60,
        category: 'frame',
        icon: Zap,
        gradient: 'from-purple-500 to-violet-600',
        isMock: true,
    },
    // Rozetler
    {
        id: 'badge_vip',
        name: 'VIP Evcil Sahibi',
        description: 'Profilinde özel VIP rozeti, topluluğun seni fark etsin',
        cost: 150,
        category: 'badge',
        icon: Star,
        gradient: 'from-pink-500 to-rose-600',
        isMock: true,
    },
    // Vet & Sağlık
    {
        id: 'vet_ai',
        name: 'AI Vet Danışma',
        description: 'Veteriner AI\'ya 1 soru sorma hakkı',
        cost: 20,
        category: 'vet',
        icon: Stethoscope,
        gradient: 'from-emerald-500 to-teal-600',
        isMock: false, // gerçek entegre edilebilir
    },
    // Shop
    {
        id: 'shop_discount',
        name: '%10 Moffi Market İndirimi',
        description: 'Moffi Pet Market\'te tek kullanımlık %10 indirim kodu',
        cost: 500,
        category: 'shop',
        icon: ShoppingBag,
        gradient: 'from-orange-500 to-red-600',
        isMock: true,
    },
    // Hayır
    {
        id: 'charity_food',
        name: 'Barınak Mama Bağışı',
        description: '100 coin = Moffi 1 mama paketi barınağa gönderir 🐾',
        cost: 100,
        category: 'charity',
        icon: Heart,
        gradient: 'from-rose-500 to-pink-600',
        isMock: true,
        isLimited: false,
    },
];

const CATEGORY_LABELS: Record<StoreItem['category'], string> = {
    filter:  '✨ Filtreler',
    frame:   '🖼️ Çerçeveler',
    badge:   '🏅 Rozetler',
    vet:     '🏥 Vet & Sağlık',
    shop:    '🛒 Market',
    charity: '🐾 Bağış',
};

export function CoinStore({ coinBalance, userId, onPurchase, onClose }: CoinStoreProps) {
    const [activeCategory, setActiveCategory] = useState<StoreItem['category'] | 'all'>('all');
    const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [localBalance, setLocalBalance] = useState(coinBalance);

    const filtered = activeCategory === 'all'
        ? STORE_ITEMS
        : STORE_ITEMS.filter(i => i.category === activeCategory);

    const handleBuy = async (item: StoreItem) => {
        if (localBalance < item.cost || purchasedItems.has(item.id) || buyingId) return;
        setBuyingId(item.id);

        // Simüle satın alma (gerçek entegrasyon sonraya)
        await new Promise(r => setTimeout(r, 800));

        const newBalance = localBalance - item.cost;
        setLocalBalance(newBalance);
        setPurchasedItems(prev => new Set([...prev, item.id]));
        onPurchase?.(item, newBalance);
        setToast(`✅ ${item.name} satın alındı!`);
        setTimeout(() => setToast(null), 3000);
        setBuyingId(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Coins className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black text-white">Coin Hazinesi</h2>
                        <p className="text-[10px] text-amber-400 font-bold">{localBalance.toLocaleString()} 🪙 mevcut</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4 text-white/50" />
                    </button>
                )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                        activeCategory === 'all' ? "bg-amber-400/20 border-amber-400/50 text-amber-300" : "bg-white/5 border-white/10 text-white/40"
                    )}
                >Tümü</button>
                {(Object.keys(CATEGORY_LABELS) as StoreItem['category'][]).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
                            activeCategory === cat ? "bg-amber-400/20 border-amber-400/50 text-amber-300" : "bg-white/5 border-white/10 text-white/40"
                        )}
                    >{CATEGORY_LABELS[cat]}</button>
                ))}
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map(item => {
                        const Icon = item.icon;
                        const canAfford = localBalance >= item.cost;
                        const isPurchased = purchasedItems.has(item.id);
                        const isBuying = buyingId === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                whileTap={{ scale: 0.96 }}
                                className={cn(
                                    "relative rounded-2xl border p-4 flex flex-col gap-3 transition-all",
                                    isPurchased ? "bg-white/5 border-white/10 opacity-70" :
                                    canAfford ? "bg-white/5 border-white/10 hover:border-white/20 cursor-pointer" :
                                    "bg-white/3 border-white/5 opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => !isPurchased && canAfford && handleBuy(item)}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                                    item.gradient
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                {/* Badges */}
                                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                    {item.isLimited && (
                                        <span className="text-[7px] font-black text-amber-300 bg-amber-400/20 border border-amber-400/30 rounded px-1.5 py-0.5 uppercase tracking-wider">Sınırlı</span>
                                    )}
                                    {item.isMock && (
                                        <span className="text-[7px] font-black text-white/20 bg-white/5 rounded px-1.5 py-0.5 uppercase">Yakında</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <p className="text-[11px] font-black text-white leading-tight mb-1">{item.name}</p>
                                    <p className="text-[9px] text-white/40 leading-relaxed">{item.description}</p>
                                </div>

                                {/* Buy button */}
                                <div className={cn(
                                    "flex items-center justify-between mt-auto pt-2 border-t border-white/5",
                                )}>
                                    <div className="flex items-center gap-1">
                                        <Coins className="w-3 h-3 text-amber-400" />
                                        <span className="text-[11px] font-black text-amber-300">{item.cost}</span>
                                    </div>
                                    {isPurchased ? (
                                        <div className="flex items-center gap-1 text-emerald-400">
                                            <Check className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-bold">Alındı</span>
                                        </div>
                                    ) : !canAfford ? (
                                        <div className="flex items-center gap-1 text-white/20">
                                            <Lock className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-bold">Yetersiz</span>
                                        </div>
                                    ) : isBuying ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider">Al →</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[700] bg-emerald-500/90 backdrop-blur text-white text-[12px] font-bold px-5 py-3 rounded-2xl shadow-2xl"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nasıl coin kazanılır */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
                <p className="text-[9px] text-white/25 text-center">
                    Coin kazan: Görev tamamla (+5–20🪙) · Düello kazan (+50🪙) · Podyum birincisi (+200🪙) · 7 günlük seri (+50🪙)
                </p>
            </div>
        </div>
    );
}
