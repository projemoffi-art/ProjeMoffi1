"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, FileText } from "lucide-react";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { useActivity, type WalkRecord } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useDailyProgress } from "@/context/DailyProgressContext";
import { haptics } from "@/native/haptics";
import { showToast, haversineKm } from "@/lib/utils";
import { formatKm, formatMinutes } from "@/lib/walkMetrics";
import { WalkHeader, SegmentTabs, WalkCard } from "@/components/walk/WalkUI";

// Ekran 10 (Yürüyüş İstatistikleri). Birden fazla hayvan varsa seçili hayvanın yürüyüşleri gösterilir.
type Period = '1w' | '1m' | '3m' | '1y';
const PERIOD_DAYS: Record<Period, number> = { '1w': 7, '1m': 30, '3m': 90, '1y': 365 };
const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function walkDate(w: WalkRecord): Date | null {
    const raw = w.ended_at || w.started_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function buildBuckets(walks: WalkRecord[], period: Period): { label: string; km: number }[] {
    const now = new Date();
    if (period === '1w') {
        const b = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(now); d.setDate(now.getDate() - (6 - i));
            return { key: d.toDateString(), label: DAY_LABELS[d.getDay()], km: 0 };
        });
        walks.forEach(w => { const d = walkDate(w); const x = d && b.find(y => y.key === d.toDateString()); if (x) x.km += w.distanceKm; });
        return b;
    }
    if (period === '1m') {
        const b = ['1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta'].map(label => ({ label, km: 0 }));
        walks.forEach(w => {
            const d = walkDate(w); if (!d) return;
            const idx = 3 - Math.floor((now.getTime() - d.getTime()) / (7 * 86400000));
            if (idx >= 0 && idx < 4) b[idx].km += w.distanceKm;
        });
        return b;
    }
    const count = period === '3m' ? 3 : 12;
    const b = Array.from({ length: count }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], km: 0 };
    });
    walks.forEach(w => { const d = walkDate(w); const x = d && b.find(y => y.key === `${d.getFullYear()}-${d.getMonth()}`); if (x) x.km += w.distanceKm; });
    return b;
}

export default function WalkStatsPage() {
    const router = useRouter();
    const { walkHistory, walkStats } = useActivity();
    const { activePet, pets } = usePet();
    const { totalPatiPuan } = useDailyProgress();
    const [period, setPeriod] = useState<Period>('1m');
    const [generating, setGenerating] = useState(false);

    const petWalks = useMemo(() => {
        if (pets.length <= 1 || !activePet) return walkHistory;
        return walkHistory.filter(w => String(w.petId) === String(activePet.id));
    }, [walkHistory, pets.length, activePet]);

    const periodWalks = useMemo(() => {
        const cutoff = Date.now() - PERIOD_DAYS[period] * 86400000;
        return petWalks.filter(w => { const d = walkDate(w); return !!d && d.getTime() >= cutoff; });
    }, [petWalks, period]);

    const totalKm = periodWalks.reduce((s, w) => s + w.distanceKm, 0);
    const totalMin = periodWalks.reduce((s, w) => s + w.activeSeconds / 60, 0);
    const totalKcal = periodWalks.reduce((s, w) => s + w.calories, 0);
    const n = periodWalks.length;
    const buckets = useMemo(() => buildBuckets(periodWalks, period), [periodWalks, period]);
    const maxKm = Math.max(0.5, ...buckets.map(b => b.km));

    // Bu ay vs geçen ay; geçen ay veri yoksa kart gösterilmez (anlamsız "%∞" yok).
    const monthCompare = useMemo(() => {
        const now = new Date();
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        let thisKm = 0, prevKm = 0;
        petWalks.forEach(w => {
            const d = walkDate(w); if (!d) return;
            if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) thisKm += w.distanceKm;
            else if (d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth()) prevKm += w.distanceKm;
        });
        if (prevKm <= 0) return null;
        return Math.round(((thisKm - prevKm) / prevKm) * 100);
    }, [petWalks]);

    const handleReport = async () => {
        haptics.tap();
        setGenerating(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const label = { '1w': '1 Hafta', '1m': '1 Ay', '3m': '3 Ay', '1y': '1 Yıl' }[period];
            doc.setFontSize(18); doc.text('Moffi — Yürüyüş Aktivite Raporu', 14, 20);
            doc.setFontSize(10); doc.setTextColor(120);
            doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 27);
            doc.setTextColor(0); doc.setFontSize(12);
            doc.text(`Hayvan: ${activePet?.name || '—'}${activePet?.breed ? ` (${activePet.breed})` : ''}`, 14, 38);
            doc.text(`Dönem: ${label}`, 14, 45);
            doc.setFontSize(13); doc.text('Özet', 14, 58);
            doc.setFontSize(11);
            doc.text(`Toplam mesafe: ${formatKm(totalKm, 1)} km`, 14, 66);
            doc.text(`Yürüyüş sayısı: ${n}`, 14, 73);
            doc.text(`Toplam aktif süre: ${formatMinutes(totalMin)}`, 14, 80);
            doc.text(`Ortalama: ${formatKm(n ? totalKm / n : 0, 1)} km · ${Math.round(n ? totalMin / n : 0)} dk · ${Math.round(n ? totalKcal / n : 0)} kcal`, 14, 87);
            doc.setFontSize(8); doc.setTextColor(150);
            doc.text('Kalori, hayvanın kayıtlı kilosu ve yürünen mesafeden yapılan yaklaşık bir tahmindir.', 14, 280);
            doc.save(`moffi-yuruyus-raporu-${activePet?.name || 'dostum'}.pdf`);
            showToast('Rapor indirildi.', 'Download');
        } catch (err) {
            console.error('PDF raporu oluşturulamadı:', err);
            showToast('Rapor oluşturulamadı, tekrar dene.', 'AlertCircle');
        } finally {
            setGenerating(false);
        }
    };

    const links = [
        { label: 'Yürüyüş Geçmişi', hint: `${petWalks.length} yürüyüş`, href: '/walk/history' },
        { label: 'Rozet Kasası', hint: 'Kazandıkların ve sıradakiler', href: '/quests/rozetler' },
        { label: 'Birlikte', hint: 'Ortak hedef ve düello', href: '/quests/birlikte' },
        { label: 'Sıralamalar', hint: 'Bu hafta', href: '/walk/leaderboard' },
        { label: 'Ödül Marketi', hint: `${totalPatiPuan.toLocaleString('tr-TR')} puan`, href: '/walk/rewards' },
        { label: 'Giydirme Stüdyosu', hint: 'Kombin', href: '/dress-up' },
    ];

    // En sık başlanan nokta (300 m kümeleme); gerçek yer adı veritabanı yok, sadece tekrar sayısı.
    const favoriteStartCount = useMemo(() => {
        const clusters: { c: [number, number]; n: number }[] = [];
        petWalks.forEach(w => {
            const p = w.path[0];
            if (!p) return;
            const hit = clusters.find(x => haversineKm(x.c, p) < 0.3);
            if (hit) hit.n += 1; else clusters.push({ c: p, n: 1 });
        });
        return clusters.reduce((m, x) => Math.max(m, x.n), 0);
    }, [petWalks]);

    return (
        <div className="min-h-[100dvh] pb-16">
            <WalkHeader title="Yürüyüş İstatistikleri" right={pets.length > 1 ? <div className="scale-90 origin-right"><PetSwitcher /></div> : undefined} />

            <div className="px-5 space-y-5">
                <SegmentTabs
                    tabs={[{ id: '1w', label: '1 Hafta' }, { id: '1m', label: '1 Ay' }, { id: '3m', label: '3 Ay' }, { id: '1y', label: '1 Yıl' }]}
                    value={period}
                    onChange={setPeriod}
                />

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Toplam Mesafe', value: formatKm(totalKm, 1), unit: 'km' },
                        { label: 'Yürüyüş Sayısı', value: String(n) },
                        { label: 'Toplam Süre', value: formatMinutes(totalMin) },
                    ].map(s => (
                        <div key={s.label}>
                            <div className="text-[11.5px] font-semibold text-secondary">{s.label}</div>
                            <div className="text-[22px] font-extrabold tracking-tight mt-1">{s.value}{s.unit && <span className="text-[13px] font-bold ml-1">{s.unit}</span>}</div>
                        </div>
                    ))}
                </div>

                <WalkCard className="px-4 pt-5 pb-3">
                    <div className="flex items-end gap-2 h-40">
                        {buckets.map((b, i) => (
                            <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-2 h-full justify-end">
                                {b.km > 0 && <span className="text-[10px] font-bold text-secondary">{formatKm(b.km, 1)}</span>}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(b.km > 0 ? 8 : 3, (b.km / maxKm) * 100)}%` }}
                                    transition={{ duration: 0.45, delay: i * 0.025 }}
                                    className={`w-full max-w-[28px] rounded-lg ${b.km > 0 ? (i === buckets.length - 1 ? 'bg-accent' : 'bg-emerald-500') : 'bg-black/[0.06] dark:bg-white/10'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2 border-t border-card-border pt-2">
                        {buckets.map((b, i) => (
                            <span key={i} className="flex-1 min-w-0 text-center text-[10.5px] font-semibold text-secondary truncate">{b.label}</span>
                        ))}
                    </div>
                </WalkCard>

                <section>
                    <h2 className="text-[15px] font-extrabold mb-3">Ortalama Değerler</h2>
                    <div className="grid grid-cols-3 gap-2.5">
                        {[
                            { icon: '📍', value: `${formatKm(n ? totalKm / n : 0, 1)} km`, label: 'Ortalama mesafe' },
                            { icon: '⏱', value: `${Math.round(n ? totalMin / n : 0)} dk`, label: 'Ortalama süre' },
                            { icon: '🔥', value: `${Math.round(n ? totalKcal / n : 0)} kcal`, label: 'Ortalama kalori' },
                        ].map(a => (
                            <WalkCard key={a.label} className="px-2 py-4 flex flex-col items-center text-center">
                                <span className="text-xl">{a.icon}</span>
                                <span className="text-[16px] font-extrabold mt-1.5">{a.value}</span>
                                <span className="text-[11px] font-semibold text-secondary mt-0.5">{a.label}</span>
                            </WalkCard>
                        ))}
                    </div>
                </section>

                {monthCompare !== null && (
                    <div className={`rounded-3xl p-5 flex items-center gap-4 overflow-hidden ${monthCompare >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-card border border-card-border'}`}>
                        <p className="flex-1 text-[15px] font-extrabold leading-snug">
                            Bu ay geçen aya göre %{Math.abs(monthCompare)} daha {monthCompare >= 0 ? 'fazla' : 'az'} yürüdünüz.
                        </p>
                        {(activePet?.avatar || activePet?.image) && (
                            <img src={activePet.avatar || activePet.image} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
                        )}
                    </div>
                )}

                {favoriteStartCount >= 3 && (
                    <WalkCard className="px-5 py-4 text-[13px] font-semibold">
                        📍 Favori bir yolun var gibi: aynı yerden <span className="font-extrabold">{favoriteStartCount} kez</span> yürüyüşe başladın.
                    </WalkCard>
                )}

                {walkStats && walkStats.totalWalks > 0 && (
                    <WalkCard className="px-5 py-4">
                        <div className="text-[13px] font-extrabold mb-3">Tüm zamanlar</div>
                        <div className="grid grid-cols-3 text-center divide-x divide-card-border">
                            <div><div className="text-[16px] font-extrabold">{formatKm(walkStats.totalDistanceKm, 1)} km</div><div className="text-[11px] text-secondary font-semibold">Toplam</div></div>
                            <div><div className="text-[16px] font-extrabold">{formatKm(walkStats.longestWalkKm, 1)} km</div><div className="text-[11px] text-secondary font-semibold">En uzun</div></div>
                            <div><div className="text-[16px] font-extrabold">{walkStats.bestStreak} gün</div><div className="text-[11px] text-secondary font-semibold">En iyi seri</div></div>
                        </div>
                    </WalkCard>
                )}

                <WalkCard className="divide-y divide-card-border overflow-hidden">
                    {links.map(l => (
                        <button key={l.href} type="button" onClick={() => { haptics.tap(); router.push(l.href); }} className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-black/[0.03]">
                            <span className="text-[14px] font-bold">{l.label}</span>
                            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-secondary">{l.hint}<ChevronRight className="w-4 h-4" /></span>
                        </button>
                    ))}
                </WalkCard>

                <button type="button" onClick={handleReport} disabled={generating} className="w-full h-12 rounded-2xl border border-card-border bg-card flex items-center justify-center gap-2 text-[13px] font-bold text-foreground disabled:opacity-60">
                    <FileText className="w-4 h-4" /> {generating ? 'Rapor hazırlanıyor...' : 'Veteriner için rapor indir (PDF)'}
                </button>
            </div>
        </div>
    );
}
