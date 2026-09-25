"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestEngine } from "@/context/QuestEngineContext";
import type { Badge, QuestCategory } from "@/context/QuestEngineContext";
import { haptics } from "@/lib/haptics";

// Faz 12: "Rozetlerim" ekranı daha önce hiç yoktu — rozetler sadece /quests
// sayfasının içinde, genel görev listesiyle karışık gösteriliyordu. Burada
// GERÇEK BADGE_POOL (14 rozet) + earnedBadgeIds kullanılıyor, uydurma bir
// rozet listesi değil.
// Ekran 13 (Rozetler) — 🔴🔴 design-reference/walk-final/'in EN BÜYÜK bulgusu:
// referans, kilitli rozetlerde GERÇEK SAYISAL İLERLEME gösteriyor ("5K Ustası
// 4,3/5 km" gibi) — Faz 13'te "her rozetin sayacını doğrulamadan uydurma sayı
// göstermeyelim" diye BİLİNÇLİ ERTELENEN şey artık referansta açıkça isteniyor.
// `QuestEngineContext`'teki `badgeProgress` haritası (bkz. orada `set(...)`
// çağrıları) SADECE güvenilir/sürekli gerçek veriye sahip rozetler için bir
// fraksiyon üretiyor — haritada anahtarı olmayan rozetler (sosyal/pet sayaçları,
// zaman dilimi rozetleri) hâlâ eskisi gibi sadece isim+açıklama gösteriyor,
// uydurma bir sayı asla üretilmiyor. Sekmeler de referansa göre Tümü/Yürüyüş/
// Keşif/Seri'ye güncellendi (Sosyal ve Özel/gizli sekmeleri kaldırıldı — gizli
// rozetler artık sadece "Tümü" ve ait oldukları tematik sekmede görünüyor).

type TabKey = 'all' | 'activity' | 'social' | 'explore' | 'streak';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'activity', label: 'Yürüyüş' },
    { key: 'social', label: 'Sosyal' },
    { key: 'explore', label: 'Keşif' },
    { key: 'streak', label: 'Seri' },
];

// Seri-tipi rozetler kendi "category" alanlarında ('activity') diğerleriyle
// karışık duruyor — referansın ayrı "Seri" sekmesi için burada özel olarak
// işaretleniyor, BADGE_POOL'un kendisi bozulmadan.
const STREAK_BADGE_IDS = new Set(['streak_3', 'week_fire', 'streak_14', 'month_fire', 'streak_100', 'streak_365']);

// Faz 21 — rozetler artık gerçek ölçüt ailelerine (family) ayrıldı: Rozetlerim
// ekranında her aile kendi başlığı altında, kademe sırasına göre bir "zincir"
// olarak gösteriliyor (kartların kendisi — kazanılmış/kazanılmamış görünümü —
// Baran'ın "şimdiki gibi kalsın" isteği gereği DOKUNULMADI, sadece gruplama
// eklendi). Ailesi olmayan (durumsal/anlık) rozetler "Diğer Rozetler" başlığı
// altında, eskisi gibi tek tek listeleniyor.
const FAMILY_LABELS: Record<string, string> = {
    distance: 'Mesafe Ustası',
    streak: 'Seri Gücü',
    walks: 'Yürüyüş Sayısı',
    posts: 'Paylaşım',
    likes: 'Beğeni Toplayıcı',
    regions: 'Bölge Kaşifi',
};
const OTHER_GROUP_LABEL = 'Diğer Rozetler';

// Birim etiketleri, sadece `badgeProgress` haritasında karşılığı olan rozetler için
const PROGRESS_UNIT: Record<string, string> = {
    first_step: 'yürüyüş', walks_10: 'yürüyüş', walks_50: 'yürüyüş', walks_100: 'yürüyüş', walks_365: 'yürüyüş',
    streak_3: 'gün', week_fire: 'gün', streak_14: 'gün', month_fire: 'gün', streak_100: 'gün', streak_365: 'gün',
    dist_10: 'km', dist_50: 'km', explorer_100: 'km', dist_250: 'km', dist_500: 'km', dist_1000: 'km', monthly_explorer: 'km',
    park_hopper: 'yer',
    regions_5: 'bölge', region_explorer: 'bölge', regions_25: 'bölge',
    first_post: 'post', photographer: 'post', posts_25: 'post', posts_50: 'post', posts_100: 'post',
    social_dog: 'beğeni', likes_25: 'beğeni', likes_50: 'beğeni', likes_100: 'beğeni',
};
const KM_UNIT_IDS = new Set(['explorer_100', 'monthly_explorer', 'dist_10', 'dist_50', 'dist_250', 'dist_500', 'dist_1000']);
const isKmUnit = (id: string) => KM_UNIT_IDS.has(id);

const RARITY_RING: Record<Badge['rarity'], string> = {
    common: 'from-slate-400 to-slate-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-emerald-400 to-green-600',
    legendary: 'from-amber-400 to-orange-500',
};

export default function BadgesPage() {
    const router = useRouter();
    const { badges, earnedBadges, badgeProgress } = useQuestEngine();
    const [tab, setTab] = useState<TabKey>('all');

    const earnedIds = new Set(earnedBadges.map(b => b.id));

    const filtered = badges.filter(b => {
        if (tab === 'all') return true;
        if (tab === 'streak') return STREAK_BADGE_IDS.has(b.id);
        if (STREAK_BADGE_IDS.has(b.id)) return false; // Seri rozetleri artık kendi sekmesinde, "Yürüyüş"te tekrar etmesin
        return (b.category as QuestCategory) === tab;
    });

    const earnedCount = filtered.filter(b => earnedIds.has(b.id)).length;

    // Faz 21: aynı aileden rozetleri (varsa) kademe sırasına göre grupla, ailesiz
    // olanları "Diğer Rozetler" altında BADGE_POOL sırasıyla topla. Map kullanmak
    // ilk-görülme sırasını (dolayısıyla BADGE_POOL'daki aile sırasını) koruyor.
    const groups = new Map<string, Badge[]>();
    for (const b of filtered) {
        const key = b.family || '__other__';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(b);
    }
    for (const list of groups.values()) list.sort((a, b) => (a.tier || 0) - (b.tier || 0));

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Rozetlerim</h1>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full">
                        {earnedCount}/{filtered.length}
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
                {filtered.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <span className="text-2xl block mb-2">🌱</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bu kategoride henüz rozet yok.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Array.from(groups.entries()).map(([familyKey, familyBadges], groupIdx) => {
                            const earnedInFamily = familyBadges.filter(b => earnedIds.has(b.id)).length;
                            return (
                                <div key={familyKey}>
                                    {familyKey !== '__other__' ? (
                                        <div className="flex items-center justify-between mb-2.5 px-0.5">
                                            <h2 className="text-[11px] font-black text-foreground uppercase tracking-wide">
                                                {FAMILY_LABELS[familyKey] || familyKey}
                                            </h2>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {earnedInFamily}/{familyBadges.length}
                                            </span>
                                        </div>
                                    ) : groups.size > 1 ? (
                                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-2.5 px-0.5">
                                            {OTHER_GROUP_LABEL}
                                        </h2>
                                    ) : null}
                                    <div className="grid grid-cols-3 gap-3">
                                        {familyBadges.map((badge, i) => {
                                            const isEarned = earnedIds.has(badge.id);
                                            return (
                                                <motion.div
                                                    key={badge.id}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.22, delay: Math.min(groupIdx * 3 + i, 12) * 0.025 }}
                                                    whileTap={{ scale: 0.94 }}
                                                    className={cn(
                                                        "rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center border cursor-default",
                                                        isEarned
                                                            ? "bg-card border-card-border shadow-moffi-card"
                                                            : "bg-slate-50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/5"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative",
                                                        isEarned ? `bg-gradient-to-br ${RARITY_RING[badge.rarity]} shadow-md` : "bg-slate-200 dark:bg-white/5"
                                                    )}>
                                                        <span className={isEarned ? "drop-shadow" : "grayscale opacity-40"}>{badge.icon}</span>
                                                        {!isEarned && (
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 dark:bg-white/10 flex items-center justify-center">
                                                                <Lock className="w-2.5 h-2.5 text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={cn("text-[9px] font-black leading-tight", isEarned ? "text-foreground" : "text-slate-400")}>
                                                        {badge.name}
                                                    </span>
                                                    <span className="text-[7.5px] font-bold text-slate-400 leading-tight">{badge.description}</span>

                                                    {isEarned ? (
                                                        <span className="text-[7px] font-black text-emerald-600 uppercase tracking-wide mt-0.5">Kazanıldı ✓</span>
                                                    ) : badgeProgress[badge.id] ? (
                                                        <div className="w-full mt-1 space-y-1">
                                                            <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-orange-500 rounded-full"
                                                                    style={{ width: `${Math.max(4, badgeProgress[badge.id].percent)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[7px] font-black text-orange-500">
                                                                {isKmUnit(badge.id)
                                                                    ? `${badgeProgress[badge.id].current.toFixed(1)}/${badgeProgress[badge.id].target} ${PROGRESS_UNIT[badge.id]}`
                                                                    : `${Math.floor(badgeProgress[badge.id].current)}/${badgeProgress[badge.id].target} ${PROGRESS_UNIT[badge.id]}`}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
