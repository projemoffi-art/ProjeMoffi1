"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronRight, ChevronLeft,
    Footprints, Clock, TrendingUp, TrendingDown, History, FileText,
} from "lucide-react";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { haptics } from "@/lib/haptics";
import { showToast, haversineKm } from "@/lib/utils";

// Ekran 10 (Yürüyüş İstatistikleri hub) — 🔴🔴 EN BÜYÜK YAPISAL KARAR
// (design-reference/walk-final/ README'sinde belgelendi). Referans bu ekranı
// hava küresi/pet durum kartı/Kontrol Merkezi/gömülü Sıralamalar OLMADAN,
// SADECE dönem seçicili bir istatistik analiz ekranı olarak gösteriyor. Bu
// yüzden bu sayfa BAŞTAN YAZILDI: dönem seçici (1H/1A/3A/1Y) + özet + bar
// grafiği + ortalamalar + ay-ay karşılaştırma. Hava küresi zaten `/walk/tracking`
// sırasında gösteriliyor, pet durumu header'daki PetSwitcher'da zaten var —
// burada tekrarlanmıyor. Kontrol Merkezi kısayolları (Rozetler/Ödül/Meydan
// Okuma/Sıralamalar/Geçmiş) referansta yok ama her ekranın bir yerden
// ulaşılabilir olması gerektiği açık olduğu için altta gezinme amaçlı kaldı
// (bkz. README'nin "Genel gözlem" notu).
type Period = '1w' | '1m' | '3m' | '1y';

const PERIOD_TABS: { id: Period; label: string }[] = [
    { id: '1w', label: '1 Hafta' },
    { id: '1m', label: '1 Ay' },
    { id: '3m', label: '3 Ay' },
    { id: '1y', label: '1 Yıl' },
];

const PERIOD_DAYS: Record<Period, number> = { '1w': 7, '1m': 30, '3m': 90, '1y': 365 };

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

interface WalkLike { distanceKm?: number; duration_minutes?: number; started_at?: string; ended_at?: string; }

function walkDate(w: WalkLike): Date | null {
    const raw = w.ended_at || w.started_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function buildBuckets(walks: WalkLike[], period: Period): { label: string; km: number }[] {
    const now = new Date();
    if (period === '1w') {
        const buckets = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(now); d.setDate(now.getDate() - (6 - i));
            return { key: d.toDateString(), label: DAY_LABELS[d.getDay()], km: 0 };
        });
        walks.forEach(w => {
            const d = walkDate(w); if (!d) return;
            const b = buckets.find(b => b.key === d.toDateString());
            if (b) b.km += w.distanceKm || 0;
        });
        return buckets.map(({ label, km }) => ({ label, km }));
    }
    if (period === '1m') {
        const labels = ['4 hafta önce', '3 hafta önce', '2 hafta önce', 'Geçen hafta', 'Bu hafta'];
        const buckets = labels.map(label => ({ label, km: 0 }));
        walks.forEach(w => {
            const d = walkDate(w); if (!d) return;
            const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
            const idx = 4 - Math.floor(daysAgo / 7);
            if (idx >= 0 && idx < 5) buckets[idx].km += w.distanceKm || 0;
        });
        return buckets;
    }
    // '3m' ve '1y' — gerçek takvim ayı bazlı gruplama
    const monthCount = period === '3m' ? 3 : 12;
    const buckets = Array.from({ length: monthCount }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], km: 0 };
    });
    walks.forEach(w => {
        const d = walkDate(w); if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const b = buckets.find(b => b.key === key);
        if (b) b.km += w.distanceKm || 0;
    });
    return buckets.map(({ label, km }) => ({ label, km }));
}

// Piyasa araştırması #7: rota kişiselleştirmesi — AllTrails'in "rota keşfi"
// fikrinin bizim tarafımıza uyarlanmış hali. Gerçek bir yer adı/POI veritabanı
// olmadığı için uydurma bir "Bahçelievler Parkı" ismi UYDURULMUYOR — sadece
// gerçek GPS başlangıç noktalarını haversine ile kümeleyip en sık tekrar eden
// kümenin büyüklüğünü dürüstçe bildiriyor (Faz 18'in `countDistinctLocations`
// mantığıyla aynı aile, ama "en büyük küme" arıyor, "kaç farklı küme var" değil).
function mostFrequentStartCount(walks: { path?: [number, number][] }[], radiusKm = 0.3): number {
    const points = walks.map(w => (w.path && w.path.length > 0 ? w.path[0] : null)).filter((p): p is [number, number] => !!p);
    const clusters: { center: [number, number]; count: number }[] = [];
    points.forEach(p => {
        const existing = clusters.find(c => haversineKm(c.center, p) < radiusKm);
        if (existing) existing.count += 1;
        else clusters.push({ center: p, count: 1 });
    });
    return clusters.length > 0 ? Math.max(...clusters.map(c => c.count)) : 0;
}

export default function WalkPage() {
    const router = useRouter();
    const { walkHistory, walkStats } = useActivity();
    const { activePet } = usePet();
    const { badges, earnedBadges, totalPatiPuan, challenges } = useQuestEngine();
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const [period, setPeriod] = useState<Period>('1w');
    const [generatingReport, setGeneratingReport] = useState(false);

    const parsedWeight = parseFloat(String(activePet?.weight ?? ''));
    const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 15;

    const filteredWalks = useMemo(() => {
        const cutoff = Date.now() - PERIOD_DAYS[period] * 86400000;
        return walkHistory.filter(w => {
            const d = walkDate(w);
            return d !== null && d.getTime() >= cutoff;
        });
    }, [walkHistory, period]);

    const totalDistanceKm = filteredWalks.reduce((s, w) => s + (w.distanceKm || 0), 0);
    const totalWalks = filteredWalks.length;
    const totalDurationMin = filteredWalks.reduce((s, w) => s + (w.duration_minutes || 0), 0);
    const totalDurationLabel = `${Math.floor(totalDurationMin / 60)}s ${Math.round(totalDurationMin % 60)}dk`;

    const avgDistanceKm = totalWalks > 0 ? totalDistanceKm / totalWalks : 0;
    const avgDurationMin = totalWalks > 0 ? totalDurationMin / totalWalks : 0;
    const avgCalories = Math.round(avgDistanceKm * weightKg);

    const buckets = useMemo(() => buildBuckets(walkHistory, period), [walkHistory, period]);
    const maxBucketKm = Math.max(0.1, ...buckets.map(b => b.km));

    // Ay-ay karşılaştırma — seçili dönemden BAĞIMSIZ, her zaman gerçek takvim
    // ayı karşılaştırması (bu ay vs geçen ay). Geçen ay hiç veri yoksa (bölme
    // hatası + anlamsız "%∞ arttı" göstermemek için) kart hiç gösterilmiyor.
    const monthComparison = useMemo(() => {
        const now = new Date();
        const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;
        let thisKm = 0, prevKm = 0;
        walkHistory.forEach(w => {
            const d = walkDate(w); if (!d) return;
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (key === thisMonthKey) thisKm += w.distanceKm || 0;
            else if (key === prevMonthKey) prevKm += w.distanceKm || 0;
        });
        if (prevKm <= 0) return null;
        const percent = Math.round(((thisKm - prevKm) / prevKm) * 100);
        return { percent, positive: percent >= 0 };
    }, [walkHistory]);

    // Piyasa araştırması #7: favori rota içgörüsü — sadece anlamlı bir tekrar
    // varsa (3+) gösteriliyor, uydurma bir yer adı olmadan dürüstçe.
    const favoriteRouteCount = useMemo(() => mostFrequentStartCount(walkHistory), [walkHistory]);

    // Piyasa araştırması #12: veterinerle paylaşılabilir gerçek bir aktivite
    // raporu — `jspdf` projede zaten kuruluydu ama hiç kullanılmıyordu. Bu bir
    // e-posta/otomatik gönderim değil (öyle bir altyapı yok) — dürüstçe bir
    // PDF İNDİRME özelliği, kullanıcı dilerse vetere kendi gönderir.
    const handleDownloadVetReport = async () => {
        haptics.tap();
        setGeneratingReport(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const periodLabel = PERIOD_TABS.find(t => t.id === period)?.label || '';
            const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

            doc.setFontSize(18);
            doc.text('Moffi — Yürüyüş Aktivite Raporu', 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(120);
            doc.text(`Oluşturulma tarihi: ${today}`, 14, 27);

            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.text(`Dostum: ${activePet?.name || '—'}${activePet?.breed ? ` (${activePet.breed})` : ''}`, 14, 38);
            doc.text(`Dönem: ${periodLabel}`, 14, 45);

            doc.setFontSize(13);
            doc.text('Özet', 14, 58);
            doc.setFontSize(11);
            doc.text(`Toplam Mesafe: ${totalDistanceKm.toFixed(1).replace('.', ',')} km`, 14, 66);
            doc.text(`Yürüyüş Sayısı: ${totalWalks}`, 14, 73);
            doc.text(`Toplam Süre: ${totalDurationLabel}`, 14, 80);

            doc.setFontSize(13);
            doc.text('Ortalama Değerler', 14, 93);
            doc.setFontSize(11);
            doc.text(`Ortalama Mesafe: ${avgDistanceKm.toFixed(1).replace('.', ',')} km`, 14, 101);
            doc.text(`Ortalama Süre: ${Math.round(avgDurationMin)} dk`, 14, 108);
            doc.text(`Ortalama Kalori: ${avgCalories} kcal`, 14, 115);

            if (walkStats) {
                doc.setFontSize(13);
                doc.text('Tüm Zamanlar', 14, 128);
                doc.setFontSize(11);
                doc.text(`Toplam Mesafe (Ömür Boyu): ${(walkStats.totalDistanceKm ?? 0).toFixed(1).replace('.', ',')} km`, 14, 136);
                doc.text(`En Uzun Yürüyüş: ${(walkStats.longestWalkKm ?? 0).toFixed(1).replace('.', ',')} km`, 14, 143);
                doc.text(`Güncel Seri: ${walkStats.currentStreak ?? 0} gün`, 14, 150);
            }

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Bu rapor Moffi uygulaması tarafından gerçek yürüyüş verilerinden otomatik oluşturulmuştur.', 14, 280);

            doc.save(`moffi-yuruyus-raporu-${activePet?.name || 'dostum'}.pdf`);
            showToast('Rapor indirildi — veterinerinle paylaşabilirsin! 📄', 'Download');
        } catch (err) {
            console.error('PDF raporu oluşturulamadı:', err);
            showToast('Rapor oluşturulamadı, tekrar deneyebilirsin.', 'AlertCircle');
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 font-sans transition-colors duration-300">
            <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-30 bg-[#F8F9FC]/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-card-border/50 dark:border-white/[0.02]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (window.history.length > 2) router.back();
                            else router.push('/home');
                        }}
                        className="w-10 h-10 rounded-full bg-card dark:bg-white/5 flex items-center justify-center shadow-moffi-card active:scale-95 transition-all border border-card-border dark:border-card-border"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground dark:text-white" />
                    </button>
                    <h1 className="text-base font-black text-foreground dark:text-white">Yürüyüş İstatistikleri</h1>
                </div>
                <div className="scale-90 origin-right">
                    <PetSwitcher />
                </div>
            </header>

            <div className="px-5 mt-6 space-y-6">
                {/* Ekran 10: dönem seçici — 1 Hafta/1 Ay/3 Ay/1 Yıl */}
                <div className="flex gap-2 bg-slate-100 dark:bg-white/5 rounded-2xl p-1">
                    {PERIOD_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { haptics.tap(); setPeriod(tab.id); }}
                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide border-0 cursor-pointer transition-all ${
                                period === tab.id ? "bg-card text-slate-800 dark:text-white shadow-moffi-card" : "bg-transparent text-slate-400"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3'lü özet satırı */}
                <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/80 p-3.5 rounded-[1.25rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl flex flex-col gap-1.5">
                        <Footprints className="w-4 h-4 text-orange-500" />
                        <span className="text-lg font-black text-foreground dark:text-white leading-none">{totalDistanceKm.toFixed(1).replace('.', ',')}</span>
                        <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">km Toplam Mesafe</span>
                    </div>
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/80 p-3.5 rounded-[1.25rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl flex flex-col gap-1.5">
                        <History className="w-4 h-4 text-emerald-500" />
                        <span className="text-lg font-black text-foreground dark:text-white leading-none">{totalWalks}</span>
                        <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Yürüyüş Sayısı</span>
                    </div>
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/80 p-3.5 rounded-[1.25rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl flex flex-col gap-1.5">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-lg font-black text-foreground dark:text-white leading-none">{totalDurationLabel}</span>
                        <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Toplam Süre</span>
                    </div>
                </div>

                {/* Bar grafiği — seçili döneme göre gün/hafta/ay bazlı gerçek mesafe */}
                <div className="bg-white/95 dark:bg-[#1A1A1A]/80 p-4 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 backdrop-blur-xl">
                    <div className="flex items-end justify-between h-24 gap-1.5 px-1">
                        {buckets.map((b, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                <div className="w-full max-w-[18px] bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex items-end" style={{ height: '64px' }}>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(4, (b.km / maxBucketKm) * 100)}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 }}
                                        className={`w-full rounded-full ${b.km > 0 ? 'bg-gradient-to-t from-orange-500 to-amber-400' : 'bg-gray-200/50 dark:bg-white/5'}`}
                                    />
                                </div>
                                <span className="text-[7px] font-black text-gray-400 uppercase truncate w-full text-center">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ortalama Değerler */}
                <div className="space-y-2.5">
                    <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Ortalama Değerler</h3>
                    <div className="bg-white/95 dark:bg-[#1A1A1A]/80 p-4 rounded-[1.25rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <div className="text-[13px] font-black text-foreground dark:text-white">{avgDistanceKm.toFixed(1).replace('.', ',')} km</div>
                            <div className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Ort. Mesafe</div>
                        </div>
                        <div className="text-center border-x border-slate-100 dark:border-white/5">
                            <div className="text-[13px] font-black text-foreground dark:text-white">{Math.round(avgDurationMin)} dk</div>
                            <div className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Ort. Süre</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[13px] font-black text-foreground dark:text-white">{avgCalories} kcal</div>
                            <div className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Ort. Kalori</div>
                        </div>
                    </div>
                </div>

                {/* Piyasa araştırması #12: veterinere gönderilebilir gerçek PDF raporu */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownloadVetReport}
                    disabled={generatingReport}
                    className="w-full bg-card py-3.5 rounded-3xl flex items-center justify-center gap-2 group hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer shadow-moffi-card border-0 disabled:opacity-60"
                >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-700 dark:text-slate-200 transition-colors">
                        {generatingReport ? 'Rapor Hazırlanıyor...' : 'Vet Raporu İndir (PDF)'}
                    </span>
                </motion.button>

                {/* Ay-ay karşılaştırma içgörü kartı — gerçek veri yoksa hiç gösterilmiyor */}
                {monthComparison && (
                    <div className={`rounded-[1.25rem] p-4 flex items-center gap-3 border ${
                        monthComparison.positive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                    }`}>
                        {monthComparison.positive ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-slate-500 shrink-0" />
                        )}
                        <span className={`text-[12px] font-bold leading-snug ${monthComparison.positive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            Bu ay geçen aya göre <strong>%{Math.abs(monthComparison.percent)}</strong> {monthComparison.positive ? 'daha fazla' : 'daha az'} yürüdünüz.
                        </span>
                    </div>
                )}

                {/* Piyasa araştırması #7: favori rota kişiselleştirmesi — gerçek GPS
                    başlangıç noktası kümelemesinden, uydurma bir yer adı olmadan */}
                {favoriteRouteCount >= 3 && (
                    <div className="rounded-[1.25rem] p-4 flex items-center gap-3 border bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20">
                        <span className="text-lg shrink-0">📍</span>
                        <span className="text-[12px] font-bold text-blue-800 dark:text-blue-300 leading-snug">
                            Favori bir yolun var gibi görünüyor — aynı bölgeden <strong>{favoriteRouteCount} kez</strong> yürüyüşe başladın.
                        </span>
                    </div>
                )}

                {/* Kontrol Merkezi — referansta yok ama her ekranın bir yerden ulaşılması
                    gerektiği için gezinme amaçlı burada tutuldu (bkz. README notu) */}
                <div className="grid grid-cols-2 gap-2.5">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.tap(); router.push('/walk/badges'); }}
                        className="bg-card p-3.5 rounded-[1.5rem] flex flex-col items-center gap-1.5 shadow-moffi-card border-0 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-lg">🏅</div>
                        <span className="text-[9.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Rozetlerim</span>
                        <span className="text-[10px] font-black text-amber-600">{earnedBadges.length}/{badges.length}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.tap(); router.push('/walk/rewards'); }}
                        className="bg-card p-3.5 rounded-[1.5rem] flex flex-col items-center gap-1.5 shadow-moffi-card border-0 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-lg">🎁</div>
                        <span className="text-[9.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Ödül Marketi</span>
                        <span className="text-[10px] font-black text-orange-600">🐾 {totalPatiPuan.toLocaleString('tr-TR')}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.tap(); router.push('/walk/challenges'); }}
                        className="bg-card p-3.5 rounded-[1.5rem] flex flex-col items-center gap-1.5 shadow-moffi-card border-0 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-lg">🏔️</div>
                        <span className="text-[9.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center leading-tight">Meydan Okumalar</span>
                        <span className="text-[10px] font-black text-emerald-600">{completedChallenges}/{challenges.length}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.tap(); router.push('/walk/leaderboard'); }}
                        className="bg-card p-3.5 rounded-[1.5rem] flex flex-col items-center gap-1.5 shadow-moffi-card border-0 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-lg">🏆</div>
                        <span className="text-[9.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Sıralamalar</span>
                    </motion.button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptics.tap(); router.push('/walk/history'); }}
                    className="w-full bg-card py-3.5 rounded-3xl flex items-center justify-center gap-1.5 group hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer shadow-moffi-card border-0"
                >
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-700 dark:text-slate-200 transition-colors">Yürüyüş Geçmişi</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
            </div>
        </div>
    );
}
