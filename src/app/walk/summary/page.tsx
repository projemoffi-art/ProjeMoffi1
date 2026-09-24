"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { X, Share2, Clock, Flame, Footprints, Check } from "lucide-react";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { useActivity } from "@/context/ActivityContext";
import { haptics } from "@/lib/haptics";

// Faz 6 (referans revizyonu): Yürüyüş Sonucu ekranı — WalkQuickSheet ve /walk/tracking'in
// ikisi de buraya, gerçek anlık görüntü değerleriyle (query param) yönlendiriyor. Layout
// artık referans mockup'a göre: 2x2 istatistik grid'i (km/süre/kalori/adım), günlük hedef
// çubuğu ve gerçek verilerle ("Kazandıklarınız": PP/seri/rozet — sadece gerçekten varsa
// gösterilir, hiçbiri uydurma değil) doldurulmuş bir "Kazanımlar" bölümü içeriyor.
function WalkSummaryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activePet } = usePet();
    const { walkPpEarned, dailyGoal, closestBadgeProgress, weeklyStamps, maxWeeklyStamps } = useQuestEngine();
    const { walkStats } = useActivity();
    const [particles, setParticles] = useState<{ x: number; y: number; color: string }[]>([]);

    const distanceKm = parseFloat(searchParams?.get('distanceKm') || '0') || 0;
    const durationSec = parseInt(searchParams?.get('durationSec') || '0', 10) || 0;
    const calories = parseInt(searchParams?.get('calories') || '0', 10) || 0;
    const steps = parseInt(searchParams?.get('steps') || '0', 10) || 0;
    const badgeName = searchParams?.get('badgeName');
    const badgeIcon = searchParams?.get('badgeIcon');
    const sniffStops = parseInt(searchParams?.get('sniffStops') || '0', 10) || 0;
    const bestSplitSecondsRaw = searchParams?.get('bestSplitSeconds');
    const bestSplitSeconds = bestSplitSecondsRaw ? parseInt(bestSplitSecondsRaw, 10) : undefined;

    const durationLabel = `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`;

    // Piyasa araştırması #5: kişisel rekorlar. `walkStats` bu ekrana gelindiğinde
    // ZATEN bu yürüyüşü içerecek şekilde tazelenmiş oluyor (İşleme Ekranı'nda
    // stopWalk()->refreshWalkData() çalıştı) — yani "bu yürüyüşün mesafesi ==
    // yeni longestWalkKm" ise bu yürüyüş gerçekten yeni rekor demektir.
    const isNewLongestWalk = (walkStats?.totalWalks || 0) > 1
        && !!walkStats?.longestWalkKm
        && distanceKm > 0
        && Math.abs(distanceKm - walkStats.longestWalkKm) < 0.05;
    const lifetimeAvgPaceMinPerKm = (walkStats && walkStats.totalDistanceKm > 0)
        ? walkStats.totalDurationMinutes / walkStats.totalDistanceKm
        : 0;
    const thisWalkPaceMinPerKm = distanceKm > 0 ? (durationSec / 60) / distanceKm : 0;
    const isFasterThanAverage = (walkStats?.totalWalks || 0) > 2
        && lifetimeAvgPaceMinPerKm > 0
        && thisWalkPaceMinPerKm > 0
        && thisWalkPaceMinPerKm < lifetimeAvgPaceMinPerKm * 0.95;
    const personalRecordLabel = isNewLongestWalk
        ? 'Yeni Rekor! En Uzun Yürüyüşün 🎉'
        : isFasterThanAverage
        ? 'Bugün ortalamandan daha hızlıydın! ⚡'
        : null;

    const goalPercent = Math.round(Math.min(100, (distanceKm / Math.max(0.1, dailyGoal.distance)) * 100));
    const streak = walkStats?.currentStreak || 0;
    const petPhoto = activePet?.avatar || activePet?.image || '/images/moffi_pet_trio.png';
    const shareText = `${activePet?.name || 'Dostum'} ile ${distanceKm.toFixed(2)} km yürüdük! 🐾 (${Math.round(durationSec / 60)} dk, ${calories} kcal) — Moffi`;

    // Ekran 7 (Yürüyüş Sonucu) — design-reference/walk-final/'e göre "Kazandıklarınız"
    // artık 3'lü tek satır değil, 4 öğelik 2x2 grid. Her öğe SADECE gerçekten
    // anlamlıysa listeye giriyor (uydurma bir "0 PP" veya "0 gün seri" kartı
    // göstermiyoruz) — bu yüzden grid 2 ile 4 hücre arasında değişebilir.
    const weeklyGoalPercent = Math.round(Math.min(100, (weeklyStamps / Math.max(1, maxWeeklyStamps)) * 100));
    const earningsItems: { key: string; icon: string; value: string; label: string; tone: 'orange' | 'emerald' }[] = [];
    if (walkPpEarned > 0) earningsItems.push({ key: 'pp', icon: '🐾', value: `+${walkPpEarned}`, label: 'Moffi Puanı', tone: 'orange' });
    if (streak > 0) earningsItems.push({ key: 'streak', icon: '🔥', value: String(streak), label: 'Gün Seri', tone: 'orange' });
    if (badgeName) {
        earningsItems.push({ key: 'badge', icon: badgeIcon || '🏅', value: badgeName, label: 'Yeni Rozet', tone: 'emerald' });
    } else if (closestBadgeProgress) {
        earningsItems.push({ key: 'badge_progress', icon: closestBadgeProgress.badge.icon, value: `%${closestBadgeProgress.percent}`, label: 'Rozet İlerlemesi', tone: 'emerald' });
    }
    earningsItems.push({ key: 'weekly_goal', icon: '🎯', value: `%${weeklyGoalPercent}`, label: 'Haftalık Hedef', tone: 'orange' });

    useEffect(() => {
        const colors = ['#FB923C', '#FBBF24', '#34D399', '#F97316'];
        setParticles(Array.from({ length: 16 }).map(() => ({
            x: (Math.random() - 0.5) * 260,
            y: (Math.random() - 0.5) * 260 - 40,
            color: colors[Math.floor(Math.random() * colors.length)]
        })));

        // Gerçek bir kutlama anı: rozet kazanıldıysa büyük, sadece PP/seri
        // kazanıldıysa küçük bir canvas-confetti patlaması. Zaten kurulu ama
        // hiç kullanılmayan bir kütüphaneyi (package.json) devreye sokuyor -
        // önceki hâli sadece framer-motion ile elle çizilen, çok daha sönük
        // bir parçacık efektiydi.
        if (badgeName || isNewLongestWalk) {
            haptics.celebrate();
            confetti({ particleCount: 120, spread: 80, startVelocity: 45, origin: { y: 0.35 }, colors: ['#F97316', '#FBBF24', '#10B981', '#FFFFFF'] });
        } else if (walkPpEarned > 0 || streak > 0 || isFasterThanAverage) {
            haptics.success();
            confetti({ particleCount: 50, spread: 60, startVelocity: 30, origin: { y: 0.4 }, colors: ['#F97316', '#FBBF24', '#10B981'] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try { await navigator.share({ text: shareText }); } catch {}
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
        }
    };

    return (
        <main className="min-h-screen bg-background flex flex-col px-5 py-5">
            <div className="flex items-center justify-between mb-2">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptics.tap(); router.push('/home'); }}
                    className="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-moffi-card border-0"
                >
                    <X className="w-4.5 h-4.5 text-slate-500" />
                </motion.button>
                {(typeof navigator !== 'undefined' && (navigator.share || navigator.clipboard)) && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { haptics.tap(); handleShare(); }}
                        className="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-moffi-card border-0"
                    >
                        <Share2 className="w-4 h-4 text-slate-500" />
                    </motion.button>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {particles.map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                                animate={{ opacity: 0, x: p.x, y: p.y, scale: 1 }}
                                transition={{ duration: 1.4, delay: i * 0.03, ease: "easeOut" }}
                                className="absolute w-2 h-2 rounded-full"
                                style={{ backgroundColor: p.color }}
                            />
                        ))}
                    </div>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-white/10 shadow-xl relative z-10">
                        <img src={petPhoto} alt={activePet?.name || 'Moffi'} className="w-full h-full object-cover" />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1 text-center">Harika bir yürüyüş! 🎉</h1>
                <p className="text-[12px] font-bold text-slate-400 mb-4 text-center">{activePet?.name || 'Dostun'} ile bugün gerçekten müthiş bir iş çıkardınız.</p>

                {/* Ekran 7 (Yürüyüş Sonucu) — design-reference/walk-final/'e göre büyük km
                    sayısı artık başlığın hemen altında, öne çıkan tek bir eleman */}
                <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-mono">{distanceKm.toFixed(2)}</span>
                    <span className="text-base font-black text-slate-400 uppercase">km</span>
                </div>

                {/* Piyasa araştırması #5: kişisel rekor kutlaması */}
                {personalRecordLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
                        className="w-full mb-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl px-4 py-3 text-center shadow-[0_8px_20px_rgba(249,115,22,0.3)]"
                    >
                        <span className="text-[12px] font-black">{personalRecordLabel}</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-3 gap-3 w-full mb-5">
                    {[
                        { icon: Clock, value: durationLabel, label: 'Süre' },
                        { icon: Flame, value: calories, label: 'Kalori' },
                        { icon: Footprints, value: steps.toLocaleString('tr-TR'), label: 'Adım' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                            className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-slate-200/50 dark:border-white/5"
                        >
                            <stat.icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            <span className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="w-full mb-6">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400">🏆 Günlük Hedef</span>
                        <span className="text-[11px] font-black text-orange-500">%{goalPercent}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(3, goalPercent)}%` }} />
                    </div>
                </div>

                {/* Piyasa araştırması #2/#13: bu yürüyüşe özgü eğlenceli gerçek istatistikler */}
                {(bestSplitSeconds !== undefined || sniffStops > 0) && (
                    <div className="w-full mb-6 flex gap-2 text-[10px] font-bold text-slate-400">
                        {bestSplitSeconds !== undefined && (
                            <span className="flex-1 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2 text-center">
                                ⚡ En hızlı km: {Math.floor(bestSplitSeconds / 60)}:{(bestSplitSeconds % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                        {sniffStops > 0 && (
                            <span className="flex-1 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2 text-center">
                                👃 {sniffStops} kez durup çevreni kokladın
                            </span>
                        )}
                    </div>
                )}

                <div className="w-full mb-8">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Bugünkü kazanımlarınız</span>
                    <div className="grid grid-cols-2 gap-3">
                        {earningsItems.map((item, i) => (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                                className="bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-moffi-card border border-slate-200/50 dark:border-white/5"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0 ${item.tone === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                                    <span className="text-base leading-none">{item.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[13px] font-black text-slate-800 dark:text-white block leading-tight truncate">{item.value}</span>
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wide leading-tight block truncate">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptics.tap(); router.push('/home'); }}
                    className="w-full h-14 bg-orange-500 text-white rounded-full flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest border-0 shadow-[0_8px_20px_rgba(249,115,22,0.3)]"
                >
                    <Check className="w-4 h-4" /> Tamam
                </motion.button>
            </div>
        </main>
    );
}

export default function WalkSummaryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-sm font-bold text-slate-400">Sonuçlar hazırlanıyor... 🐾</div>}>
            <WalkSummaryContent />
        </Suspense>
    );
}
