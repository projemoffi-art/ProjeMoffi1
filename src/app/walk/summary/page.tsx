"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Share2 } from "lucide-react";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { useActivity } from "@/context/ActivityContext";
import { apiService } from "@/services/apiService";
import { haptics, share } from "@/native";
import { showToast } from "@/lib/utils";
import { formatKm, formatClock, formatSteps } from "@/lib/walkMetrics";
import { WalkCard, StatRow, PrimaryButton, ProgressBar } from "@/components/walk/WalkUI";

// Ekran 7 (Yürüyüş Sonucu). Rakamlar sunucuya kaydedilmiş yürüyüşten (finish_walk) okunur; ekranda görülen
// ile geçmişte görülen aynıdır.
interface SavedWalk {
    id: string;
    pet_id?: string | null;
    distance_meters?: number;
    active_seconds?: number | null;
    steps?: number | null;
    calories_kcal?: number | null;
}

function SummaryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const status = searchParams?.get('status');
    const sniffStops = parseInt(searchParams?.get('sniffStops') || '0', 10) || 0;
    const bestSplitRaw = searchParams?.get('bestSplitSeconds');
    const bestSplitSeconds = bestSplitRaw ? parseInt(bestSplitRaw, 10) : null;

    const { pets, activePet } = usePet();
    const { walkPpEarned, dailyGoal, todayDistanceKm, closestBadgeProgress, weeklyStamps, maxWeeklyStamps, lastEarnedBadge } = useQuestEngine();
    const { walkStats } = useActivity();
    const [walk, setWalk] = useState<SavedWalk | null>(null);
    const [loading, setLoading] = useState(!!id && status === 'completed');

    useEffect(() => {
        if (!id || status !== 'completed') return;
        let cancelled = false;
        apiService.getWalkById(id).then(data => {
            if (cancelled) return;
            setWalk(data?.id ? data : null);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id, status]);

    const pet = pets.find(p => String(p.id) === String(walk?.pet_id)) || activePet;
    const petName = pet?.name || 'Dostun';
    const heroImage = pet?.avatar || pet?.image || '/images/walk-normal.jpg';
    const distanceKm = Number(walk?.distance_meters || 0) / 1000;
    const activeSeconds = walk?.active_seconds ?? 0;
    const calories = walk?.calories_kcal ?? 0;
    const hasSteps = (walk?.steps || 0) > 0;
    const goalPercent = Math.round(Math.min(100, (todayDistanceKm / Math.max(0.1, dailyGoal.distance)) * 100));
    const weeklyPercent = Math.round(Math.min(100, (weeklyStamps / Math.max(1, maxWeeklyStamps)) * 100));
    const streak = walkStats?.currentStreak || 0;

    const isLongest = !!walk && (walkStats?.totalWalks || 0) > 1 && distanceKm > 0 && distanceKm + 0.05 >= (walkStats?.longestWalkKm || 0);
    const goTo = (path: string) => { haptics.tap(); router.replace(path); };

    useEffect(() => {
        if (!walk) return;
        if (lastEarnedBadge || isLongest) {
            haptics.celebrate();
            confetti({ particleCount: 110, spread: 80, startVelocity: 42, origin: { y: 0.3 }, colors: ['#EE5B3D', '#F5B544', '#10B981', '#FFFFFF'] });
        } else {
            haptics.success();
            confetti({ particleCount: 45, spread: 60, startVelocity: 28, origin: { y: 0.35 }, colors: ['#EE5B3D', '#F5B544', '#10B981'] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walk?.id]);

    const handleShare = async () => {
        haptics.tap();
        const text = `${petName} ile ${formatKm(distanceKm)} km yürüdük! 🐾 (${Math.round(activeSeconds / 60)} dk) — Moffi`;
        const r = await share.shareOrCopy({ text, copyText: text });
        if (r === 'copied') showToast('Yürüyüş özeti kopyalandı.', 'CheckCircle2', 'text-emerald-500');
    };

    if (status !== 'completed' || (!loading && !walk)) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-5">🐾</div>
                <h1 className="text-[21px] font-extrabold mb-2">Kısa bir yürüyüş oldu</h1>
                <p className="text-[13px] text-secondary mb-8">Bu yürüyüşte yol ya da adım kaydedilmedi, bu yüzden geçmişine eklenmedi. Konum izninin açık olduğundan emin ol.</p>
                <PrimaryButton onClick={() => goTo('/home')}>Tamam</PrimaryButton>
            </div>
        );
    }

    const earnings: { key: string; icon: string; value: string; label: string; tint: string }[] = [];
    if (walkPpEarned > 0) earnings.push({ key: 'pp', icon: '🐾', value: `+${walkPpEarned}`, label: 'Moffi Puanı', tint: 'bg-accent/10' });
    if (streak > 0) earnings.push({ key: 'streak', icon: '🔥', value: `${streak} günlük`, label: 'seri', tint: 'bg-amber-100/70' });
    if (lastEarnedBadge) earnings.push({ key: 'badge', icon: lastEarnedBadge.icon, value: lastEarnedBadge.name, label: 'Yeni rozet', tint: 'bg-violet-100/70' });
    else if (closestBadgeProgress) earnings.push({ key: 'badge', icon: closestBadgeProgress.badge.icon, value: `%${closestBadgeProgress.percent}`, label: 'Rozet ilerlemesi', tint: 'bg-violet-100/70' });
    earnings.push({ key: 'weekly', icon: '🎯', value: `%${weeklyPercent}`, label: 'Haftalık hedef', tint: 'bg-accent/10' });

    return (
        <div className="min-h-[100dvh] pb-10">
            <div className="relative h-72">
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
                <div className="absolute top-4 inset-x-4 flex justify-end">
                    <button type="button" onClick={handleShare} aria-label="Paylaş" className="w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow">
                        <Share2 className="w-[18px] h-[18px] text-[#201B16]" />
                    </button>
                </div>
            </div>

            <div className="px-5 -mt-16 relative">
                <WalkCard className="px-5 pt-6 pb-5">
                    {loading ? (
                        <div className="py-16 text-center text-secondary text-sm font-semibold">Sonuçlar yükleniyor...</div>
                    ) : (
                        <>
                            <h1 className="text-[26px] font-extrabold text-center leading-tight">Harika bir yürüyüş!</h1>
                            <p className="text-[13px] text-secondary text-center mt-1">{petName} ile bugün harika bir iş çıkardınız.</p>
                            {/* Bu yürüyüşte adım sayıldıysa büyük rakam adım; değilse mesafe. */}
                            <div className="text-center mt-4 mb-5">
                                <span className="text-[44px] font-extrabold tracking-tight">{hasSteps ? (walk?.steps || 0).toLocaleString('tr-TR') : formatKm(distanceKm)}</span>
                                <span className="text-[22px] font-extrabold ml-1.5">{hasSteps ? 'adım' : 'km'}</span>
                            </div>
                            {isLongest && (
                                <div className="mb-5 rounded-2xl bg-accent/10 text-accent text-[13px] font-bold text-center py-2.5">Yeni rekor: en uzun yürüyüşün! 🎉</div>
                            )}
                            <StatRow items={[
                                hasSteps ? { value: formatKm(distanceKm), unit: 'km', label: 'Mesafe' } : { value: formatSteps(walk?.steps), label: 'Adım' },
                                { value: formatClock(activeSeconds), label: 'Süre' },
                                { value: calories, unit: 'kcal', label: 'Kalori' },
                            ]} />
                        </>
                    )}
                </WalkCard>

                <WalkCard className="mt-4 px-5 py-4">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[14px] font-bold">Günlük hedef</span>
                        <span className="text-[16px] font-extrabold">%{goalPercent}</span>
                    </div>
                    <ProgressBar percent={goalPercent} />
                    <p className="text-[12px] text-secondary font-semibold mt-2">{formatKm(todayDistanceKm)} / {formatKm(dailyGoal.distance, 1)} km</p>
                </WalkCard>

                {(bestSplitSeconds !== null || sniffStops > 0) && (
                    <div className="mt-3 flex gap-2 text-[12px] font-semibold text-secondary">
                        {bestSplitSeconds !== null && <span className="flex-1 bg-card border border-card-border rounded-2xl px-3 py-2.5 text-center">⚡ En hızlı km {formatClock(bestSplitSeconds)}</span>}
                        {sniffStops > 0 && <span className="flex-1 bg-card border border-card-border rounded-2xl px-3 py-2.5 text-center">👃 {sniffStops} koklama molası</span>}
                    </div>
                )}

                <h2 className="text-[15px] font-extrabold mt-6 mb-3">Bugünkü kazanımlar</h2>
                <div className="grid grid-cols-2 gap-3">
                    {earnings.map((e, i) => (
                        <motion.div
                            key={e.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3"
                        >
                            <span className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${e.tint}`}>{e.icon}</span>
                            <div className="min-w-0">
                                <div className="text-[15px] font-extrabold leading-tight truncate">{e.value}</div>
                                <div className="text-[11.5px] text-secondary font-semibold leading-tight">{e.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <PrimaryButton className="mt-7" onClick={() => goTo('/home')}>Tamam</PrimaryButton>
            </div>
        </div>
    );
}

export default function WalkSummaryPage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
            <SummaryContent />
        </Suspense>
    );
}
