"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check, ChevronRight, Shirt, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { haptics } from "@/lib/haptics";
import { formatRemaining } from "@/lib/vipFrames";

// Faz 14: "Ödül Marketi" — daha önce hiç yoktu, referans görselin ("7. Ödül /
// Puan Marketi", bkz. design-reference/walk-final/) doğrudan karşılığı.
//
// Faz 22 — Baran'ın bulgusu: piyasadaki gerçek fiziksel ürünler (bandana, mama
// kabı vb.) hiçbir teslimat altyapısı olmadan "sepetine eklendi" diyordu — bu
// projenin "sahte/dürüst olmayan çözüm yok" kuralına aykırıydı. Fiziksel
// ürünler kaldırıldı (bkz. CLAUDE.md), yerlerine gerçek, teslimat gerektirmeyen
// iki kategori geldi: (1) Kozmetik — `cosmetic_items`/`redeem_cosmetic_item`
// üzerinden gerçek gardırop parçası satın alma (Giydirme Stüdyosu'nda
// kullanılıyor), (2) Kuponlar — Moffi'nin kendi mağazasında geçerli gerçek
// indirim (gerçek e-ticaret teslimatı zaten var, biz sadece indirimi veriyoruz).
//
// Faz 23 — Baran'ın isteği: ödüller sadece Kombinle'yle sınırlı kalmasın,
// "VIP gibi" geçici olarak kullanılabilecek başka gerçek şeyler de olsun.
// İncelemede Moffi Prime'ın (`PremiumUpgradeModal.tsx`) 10 vaadinden SADECE
// Profil Aura/Neon çerçevelerinin gerçek çalışan kodu olduğu bulundu (diğer
// 9'u sadece pazarlama metni) — bu yüzden VIP sekmesi bilinçli olarak sadece
// bunu kapsıyor. `vip_perks`/`user_active_perks`/`redeem_vip_perk` üzerinden,
// süresi dolan bir "geçici tadım" (bkz. src/lib/vipFrames.ts).

type TabKey = 'all' | 'cosmetic' | 'coupon' | 'vip';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'cosmetic', label: 'Kozmetik' },
    { key: 'vip', label: 'VIP' },
    { key: 'coupon', label: 'Kuponlar' },
];

const FEATURED_COUNT = 3;

interface ShopEntry {
    id: string;
    kind: 'reward' | 'cosmetic' | 'vip';
    name: string;
    description: string | null;
    category: TabKey;
    pricePp: number;
    perkKey?: string;
    icon: string;
    owned: boolean;
}

export default function RewardsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { activePerks, refreshActivePerks } = useQuestEngine();
    const [entries, setEntries] = useState<ShopEntry[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('all');
    const [confirmEntry, setConfirmEntry] = useState<ShopEntry | null>(null);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemed, setRedeemed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [rewardProducts, cosmeticItems, ownedIds, vipPerks, balanceData] = await Promise.all([
                apiService.getRewardProducts(),
                apiService.getCosmeticItems(),
                user ? apiService.getOwnedCosmeticItemIds(user.id) : Promise.resolve([] as string[]),
                apiService.getVipPerks(),
                user ? apiService.getPatiPuanBalance() : Promise.resolve(0),
            ]);
            if (cancelled) return;
            const ownedSet = new Set(ownedIds);
            const merged: ShopEntry[] = [
                ...rewardProducts.map(p => ({
                    id: p.id, kind: 'reward' as const, name: p.name, description: p.description,
                    category: 'coupon' as TabKey, pricePp: p.pricePp, icon: p.icon, owned: false,
                })),
                ...cosmeticItems.map(c => ({
                    id: c.id, kind: 'cosmetic' as const, name: c.name, description: `${c.rarity === 'legendary' ? '✨ Efsanevi' : c.rarity === 'epic' ? '🔷 Epik' : c.rarity === 'rare' ? '🔹 Nadir' : 'Başlangıç'} kozmetik eşya — Giydirme Stüdyosu'nda kullanılabilir.`,
                    category: 'cosmetic' as TabKey, pricePp: c.pricePp, icon: c.icon, owned: c.isStarter || ownedSet.has(c.id),
                })),
                ...vipPerks.map(v => ({
                    id: v.id, kind: 'vip' as const, name: v.name, description: v.description,
                    category: 'vip' as TabKey, pricePp: v.pricePp, icon: v.icon, owned: false, perkKey: v.perkKey,
                })),
            ];
            setEntries(merged);
            setBalance(balanceData);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user]);

    const filtered = entries.filter(e => tab === 'all' || e.category === tab);
    const featured = [...entries].filter(e => !e.owned).sort((a, b) => a.pricePp - b.pricePp).slice(0, FEATURED_COUNT);

    const closeModal = () => {
        if (redeeming) return;
        setConfirmEntry(null);
        setRedeemed(false);
    };

    const handleRedeem = async () => {
        if (!confirmEntry) return;
        setRedeeming(true);
        try {
            let successMessage = '';
            if (confirmEntry.kind === 'cosmetic') {
                const newBalance = await apiService.redeemCosmeticItem(confirmEntry.id, confirmEntry.name, confirmEntry.pricePp);
                setBalance(newBalance);
                setEntries(prev => prev.map(e => e.id === confirmEntry.id ? { ...e, owned: true } : e));
                successMessage = `👕 ${confirmEntry.name} gardırobuna eklendi!`;
            } else if (confirmEntry.kind === 'vip') {
                const newExpiresAt = await apiService.redeemVipPerk(confirmEntry.id, confirmEntry.name, confirmEntry.pricePp);
                setBalance(prev => prev - confirmEntry.pricePp);
                await refreshActivePerks();
                successMessage = `👑 ${confirmEntry.name} aktif! ${formatRemaining(newExpiresAt)}.`;
            } else {
                const newBalance = await apiService.redeemReward(confirmEntry.id, confirmEntry.name, confirmEntry.pricePp);
                setBalance(newBalance);
                successMessage = `🎟️ ${confirmEntry.name} hesabına tanımlandı!`;
            }
            haptics.success();
            setRedeemed(true);
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: successMessage, icon: 'Gift', color: 'text-emerald-400' }
            }));
            setTimeout(() => { setConfirmEntry(null); setRedeemed(false); }, 1200);
        } catch (err: any) {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: err?.message || 'Ödül alınamadı, lütfen tekrar dene.', icon: 'AlertTriangle', color: 'text-red-400' }
            }));
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Ödül Marketi</h1>
                    <span className="text-[11px] font-black text-white bg-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1">
                        🐾 {balance.toLocaleString('tr-TR')}
                    </span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {TABS.map(t => (
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
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {(tab === 'all' || tab === 'cosmetic') && (
                    <button
                        onClick={() => { haptics.tap(); router.push('/dress-up'); }}
                        className="w-full mb-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                            <Shirt className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-black text-white block">Giydirme Stüdyosu</span>
                            <span className="text-[10px] font-bold text-white/80">Satın aldığın kozmetikleri maskotuna giydir</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                    </button>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                        <span className="text-2xl animate-bounce">🐾</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Ödüller getiriliyor...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <span className="text-2xl block mb-2">🎁</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Bu kategoride henüz ödül yok,<br />çok yakında yeni sürprizler eklenecek!
                        </p>
                    </div>
                ) : (
                    <>
                    {tab === 'all' && featured.length > 0 && (
                        <div className="mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Öne Çıkanlar</span>
                            <div className="space-y-2">
                                {featured.map(entry => (
                                    <button
                                        key={entry.id}
                                        onClick={() => { haptics.tap(); setConfirmEntry(entry); }}
                                        className="w-full bg-card rounded-2xl p-3 flex items-center gap-3 border border-card-border shadow-moffi-card cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-xl shrink-0">
                                            {entry.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <span className="text-[12px] font-black text-foreground block truncate">{entry.name}</span>
                                            <span className="text-[10px] font-bold text-orange-600">🐾 {entry.pricePp.toLocaleString('tr-TR')} puan</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((entry, i) => {
                            const canAfford = balance >= entry.pricePp;
                            const activeExpiry = entry.kind === 'vip' && entry.perkKey ? activePerks[entry.perkKey] : undefined;
                            const isActiveVip = !!activeExpiry && new Date(activeExpiry).getTime() > Date.now();
                            return (
                                <motion.button
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.04 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { haptics.tap(); if (!entry.owned) setConfirmEntry(entry); }}
                                    className={cn(
                                        "rounded-2xl p-4 flex flex-col items-center gap-2 text-center border shadow-moffi-card",
                                        entry.owned ? "bg-slate-50 dark:bg-white/[0.02] border-card-border cursor-default" : "bg-card border-card-border cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-3xl">
                                        {entry.icon}
                                    </div>
                                    <span className="text-[11px] font-black text-foreground leading-tight">{entry.name}</span>
                                    {isActiveVip && (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            👑 Aktif — {formatRemaining(activeExpiry!)}
                                        </span>
                                    )}
                                    {entry.owned ? (
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Sahipsin ✓</span>
                                    ) : (
                                        <span className={cn(
                                            "text-[10px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full",
                                            canAfford ? "text-orange-600 bg-orange-50 dark:bg-orange-500/10" : "text-slate-400 bg-slate-100 dark:bg-white/5"
                                        )}>
                                            🐾 {entry.pricePp.toLocaleString('tr-TR')} puan{isActiveVip ? ' (uzat)' : ''}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {confirmEntry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>

                            <AnimatePresence mode="wait">
                                {redeemed ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center py-6"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                                            <Check className="w-8 h-8 text-white" strokeWidth={3} />
                                        </div>
                                        <h3 className="text-base font-black text-foreground text-center">Harika, alındı! 🎉</h3>
                                        <p className="text-[11px] font-bold text-slate-400 text-center mt-1">
                                            {confirmEntry.kind === 'cosmetic' ? `${confirmEntry.name} gardırobuna eklendi.` : `${confirmEntry.name} hesabına tanımlandı.`}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
                                            {confirmEntry.icon}
                                        </div>
                                        <h3 className="text-base font-black text-foreground text-center mb-1">{confirmEntry.name}</h3>
                                        {confirmEntry.description && (
                                            <p className="text-[11px] font-bold text-slate-400 text-center mb-4">{confirmEntry.description}</p>
                                        )}
                                        <div className="text-center mb-5">
                                            <span className="text-[12px] font-black text-orange-600">🐾 {confirmEntry.pricePp.toLocaleString('tr-TR')} puan</span>
                                        </div>
                                        {balance < confirmEntry.pricePp ? (
                                            <div className="text-center text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-white/5 rounded-2xl py-3 px-4 leading-relaxed">
                                                Bu ödül için birkaç Moffi Puanına daha ihtiyacın var — yürümeye devam, yakında burada olacaksın! 🐾
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={handleRedeem}
                                                disabled={redeeming}
                                                className="w-full h-13 py-3.5 bg-orange-500 text-white rounded-full font-black text-[12px] uppercase tracking-widest transition-all border-0 disabled:opacity-60"
                                            >
                                                {redeeming ? 'İşleniyor...' : 'Satın Al'}
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
