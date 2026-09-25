"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { haptics } from "@/lib/haptics";
import { MascotSVG, type ApparelState } from "@/components/cosmetics/MascotSVG";

// Faz 22 — "Giydirme Stüdyosu": src/integrations-pending/kombinle prototipinin
// gardırop/maskot fikrinin gerçek, PP-ekonomisine bağlı sürümü. Ödül Marketi'nde
// PP ile satın alınan kozmetik eşyalar burada maskota giydiriliyor ve kaydediliyor
// (pets.equipped_apparel/avatar_body_color/avatar_background — bkz. migration
// add_cosmetic_wardrobe_system). Arena/oylama ve giysi görevleri BİLİNÇLİ olarak
// bu turun kapsamı dışında bırakıldı (bkz. CLAUDE.md) — ayrı, büyük bir iş.

type Slot = 'body' | 'head' | 'eyes' | 'hands' | 'feet';
const SLOT_TABS: { key: Slot; label: string }[] = [
    { key: 'body', label: 'Vücut' },
    { key: 'head', label: 'Baş' },
    { key: 'eyes', label: 'Gözlük' },
    { key: 'hands', label: 'Eller' },
    { key: 'feet', label: 'Ayaklar' },
];

const BODY_COLORS = [
    { value: '#8b5cf6', label: 'Asil Mor' },
    { value: '#ec4899', label: 'Şeker Pembe' },
    { value: '#f97316', label: 'Enerjik Turuncu' },
    { value: '#06b6d4', label: 'Buz Mavisi' },
];

const BACKGROUNDS: { id: string; label: string; style: string }[] = [
    { id: 'plain', label: 'Sade', style: 'transparent' },
    { id: 'stage', label: 'Sahne', style: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)' },
    { id: 'park', label: 'Park', style: 'linear-gradient(180deg, #bbf7d0 0%, #4ade80 100%)' },
    { id: 'cyber', label: 'Siber', style: 'linear-gradient(180deg, #a5f3fc 0%, #06b6d4 100%)' },
    { id: 'space', label: 'Uzay', style: 'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 100%)' },
];

interface CosmeticItem {
    id: string;
    slot: Slot;
    itemKey: string;
    name: string;
    icon: string;
    pricePp: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    isStarter: boolean;
}

const RARITY_COLOR: Record<CosmeticItem['rarity'], string> = {
    common: 'text-slate-500',
    rare: 'text-blue-500',
    epic: 'text-emerald-600',
    legendary: 'text-amber-600',
};

const EMPTY_APPAREL: ApparelState = { body: null, head: null, eyes: null, hands: null, feet: null };

export default function DressUpPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { activePet } = usePet();
    const [items, setItems] = useState<CosmeticItem[]>([]);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
    const [apparel, setApparel] = useState<ApparelState>(EMPTY_APPAREL);
    const [bodyColor, setBodyColor] = useState('#8b5cf6');
    const [background, setBackground] = useState<string>('plain');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [tab, setTab] = useState<Slot>('body');

    useEffect(() => {
        if (!activePet || !user) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [catalog, owned, look] = await Promise.all([
                apiService.getCosmeticItems(),
                apiService.getOwnedCosmeticItemIds(user.id),
                apiService.getPetLook(activePet.id),
            ]);
            if (cancelled) return;
            setItems(catalog);
            setOwnedIds(new Set(owned));
            setApparel({ ...EMPTY_APPAREL, ...look.equippedApparel } as ApparelState);
            setBodyColor(look.avatarBodyColor);
            setBackground(look.avatarBackground || 'plain');
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [activePet, user]);

    // Not: `Pet.type` bu projede gerçekte 'cat'/'dog' (düz metin) olarak saklanıyor
    // (bkz. supabaseApiService.ts satır ~1631) — emoji değil, PetContext'teki eski
    // yorum yanıltıcı. Kombinle prototipindeki breed-metni sezgisi yedek olarak kaldı.
    const petType = (activePet?.type || '').toLowerCase();
    const petBreed = (activePet?.breed || '').toLowerCase();
    const isCat = petType === 'cat' || petType.includes('kedi') || petBreed.includes('kedi') || petBreed.includes('cat');
    const isDog = !isCat && (petType === 'dog' || petType.includes('köpek') || petBreed.includes('köpek') || petBreed.includes('dog') || !activePet?.type);

    const itemsBySlot = useMemo(() => {
        const map: Record<Slot, CosmeticItem[]> = { body: [], head: [], eyes: [], hands: [], feet: [] };
        for (const it of items) map[it.slot].push(it);
        return map;
    }, [items]);

    const ownedCount = items.filter(i => i.isStarter || ownedIds.has(i.id)).length;

    const isOwned = (item: CosmeticItem) => item.isStarter || ownedIds.has(item.id);

    const handleSelect = (item: CosmeticItem) => {
        if (!isOwned(item)) {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: `🔒 "${item.name}" henüz gardırobunda değil — Ödül Marketi'nden satın alabilirsin.`, icon: 'Lock', color: 'text-slate-400' }
            }));
            return;
        }
        haptics.tap();
        setSaved(false);
        setApparel(prev => ({ ...prev, [item.slot]: prev[item.slot] === item.itemKey ? null : item.itemKey }));
    };

    const handleSave = async () => {
        if (!activePet) return;
        setSaving(true);
        const ok = await apiService.updatePetLook(activePet.id, {
            equippedApparel: apparel as unknown as Record<string, string | null>,
            avatarBodyColor: bodyColor,
            avatarBackground: background === 'plain' ? null : background,
        });
        setSaving(false);
        if (ok) {
            haptics.success();
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
        } else {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: 'Görünüm kaydedilemedi, tekrar dene.', icon: 'AlertTriangle', color: 'text-red-400' }
            }));
        }
    };

    const bgStyle = BACKGROUNDS.find(b => b.id === background)?.style || 'transparent';

    if (!activePet) {
        return (
            <main className="min-h-screen max-w-md mx-auto flex flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="text-3xl">🐾</span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Önce bir evcil dostun olmalı</p>
                <button onClick={() => router.back()} className="text-[11px] font-black text-orange-600">Geri Dön</button>
            </main>
        );
    }

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-1">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Giydirme Stüdyosu</h1>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full">
                        {ownedCount}/{items.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="relative flex items-center justify-center h-64 mx-6 mt-5 rounded-3xl overflow-hidden border border-card-border" style={{ background: bgStyle === 'transparent' ? undefined : bgStyle }}>
                    <div className="w-56 h-56">
                        <MascotSVG apparel={apparel} bodyColor={bodyColor} isCat={isCat} isDog={isDog} />
                    </div>
                </div>

                <div className="px-6 mt-4 flex items-center justify-center gap-2.5">
                    {BODY_COLORS.map(c => (
                        <button
                            key={c.value}
                            onClick={() => { haptics.tap(); setSaved(false); setBodyColor(c.value); }}
                            className={cn("w-8 h-8 rounded-full border-2 transition-transform active:scale-90", bodyColor === c.value ? "border-foreground scale-110" : "border-transparent")}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                        />
                    ))}
                    <span className="w-px h-6 bg-card-border mx-1" />
                    {BACKGROUNDS.map(b => (
                        <button
                            key={b.id}
                            onClick={() => { haptics.tap(); setSaved(false); setBackground(b.id); }}
                            className={cn("w-8 h-8 rounded-full border-2 transition-transform active:scale-90", background === b.id ? "border-foreground scale-110" : "border-card-border")}
                            style={{ background: b.style === 'transparent' ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 10px 10px' : b.style }}
                            title={b.label}
                        />
                    ))}
                </div>

                <div className="px-6 mt-6 flex gap-1.5 overflow-x-auto no-scrollbar">
                    {SLOT_TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { haptics.tap(); setTab(t.key); }}
                            className={cn(
                                "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-0 cursor-pointer active:scale-95",
                                tab === t.key ? "bg-slate-900 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="px-6 py-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                            <span className="text-2xl animate-bounce">🐾</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Gardırop yükleniyor...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {itemsBySlot[tab].map((item, i) => {
                                const owned = isOwned(item);
                                const equipped = apparel[item.slot] === item.itemKey;
                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.03 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() => handleSelect(item)}
                                        className={cn(
                                            "rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center border cursor-pointer",
                                            equipped
                                                ? "bg-orange-50 dark:bg-orange-500/10 border-orange-400"
                                                : owned
                                                    ? "bg-card border-card-border shadow-moffi-card hover:bg-slate-50 dark:hover:bg-white/5"
                                                    : "bg-slate-50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/5"
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative", owned ? "bg-slate-100 dark:bg-white/5" : "bg-slate-200 dark:bg-white/5")}>
                                            <span className={owned ? "" : "grayscale opacity-40"}>{item.icon}</span>
                                            {!owned && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 dark:bg-white/10 flex items-center justify-center">
                                                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                                                </div>
                                            )}
                                            {equipped && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <span className={cn("text-[9px] font-black leading-tight", owned ? "text-foreground" : "text-slate-400")}>{item.name}</span>
                                        {!owned && (
                                            <span className={cn("text-[8px] font-black", RARITY_COLOR[item.rarity])}>🐾 {item.pricePp.toLocaleString('tr-TR')}</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card border-t border-card-border px-6 py-4 flex items-center gap-3">
                <button
                    onClick={() => { haptics.tap(); setApparel(EMPTY_APPAREL); setSaved(false); }}
                    className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    title="Tümünü Çıkar"
                >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                </button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-11 rounded-full bg-orange-500 text-white font-black text-[12px] uppercase tracking-widest disabled:opacity-60"
                >
                    <AnimatePresence mode="wait">
                        {saved ? (
                            <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1.5">
                                <Check className="w-4 h-4" strokeWidth={3} /> Kaydedildi
                            </motion.span>
                        ) : (
                            <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {saving ? 'Kaydediliyor...' : 'Görünümü Kaydet'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </main>
    );
}
