"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Route, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { normalizePathToTuples, cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

// Ekran 8 (Yürüyüş Geçmişi) yeniden inşası — design-reference/walk-final/'e göre:
// (a) Tümü/Bu Ay/Bu Yıl dönem sekmeleri, (b) ay bazlı gruplama ("Eylül 2026"),
// (c) büyük SVG önizlemeli karttan kompakt liste satırına (küçük kare thumbnail
// + metin, Apple Health/Strava tarzı) geçiş, (d) göreli tarih etiketleri.
function routeToPolylinePoints(rawPath: unknown): string | null {
    const path = normalizePathToTuples(rawPath);
    if (path.length < 2) return null;
    const lats = path.map(p => p[0]);
    const lngs = path.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 0.0001;
    const lngRange = maxLng - minLng || 0.0001;
    return path.map(([lat, lng]) => {
        const x = ((lng - minLng) / lngRange) * 92 + 4;
        const y = 92 - ((lat - minLat) / latRange) * 84 + 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
}

// Göreli tarih etiketi — gerçek `started_at`/`ended_at` tarihinden hesaplanıyor,
// uydurma değil. Bugün/Dün dışında gerçek gün+ay ("20 Eyl") gösteriliyor.
function relativeDateLabel(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function monthGroupLabel(iso: string | undefined): string {
    if (!iso) return 'Bilinmeyen Tarih';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Bilinmeyen Tarih';
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
}

type PeriodFilter = 'all' | 'month' | 'year';

export default function WalkHistoryPage() {
    const router = useRouter();
    const { walkHistory } = useActivity();
    const { activePet } = usePet();
    const [period, setPeriod] = useState<PeriodFilter>('all');

    const parsedWeight = parseFloat(String(activePet?.weight ?? ''));
    const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 15;

    const sorted = useMemo(() => {
        return [...walkHistory].sort((a, b) => {
            const ta = new Date(a.ended_at || a.started_at || 0).getTime();
            const tb = new Date(b.ended_at || b.started_at || 0).getTime();
            return tb - ta;
        });
    }, [walkHistory]);

    const filtered = useMemo(() => {
        if (period === 'all') return sorted;
        const now = new Date();
        return sorted.filter(w => {
            const d = new Date(w.ended_at || w.started_at || 0);
            if (Number.isNaN(d.getTime())) return false;
            if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            return d.getFullYear() === now.getFullYear();
        });
    }, [sorted, period]);

    const groups = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        for (const w of filtered) {
            const key = monthGroupLabel(w.ended_at || w.started_at);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(w);
        }
        return Array.from(map.entries());
    }, [filtered]);

    return (
        <main className="min-h-screen pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">

            {/* Header */}
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Yürüyüş Geçmişi</h1>
                    <button
                        onClick={() => { haptics.tap(); router.push('/walk'); }}
                        className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90"
                        title="Yürüyüş İstatistikleri"
                    >
                        <TrendingUp className="w-4.5 h-4.5 text-foreground" />
                    </button>
                </div>

                {/* Ekran 8: Tümü/Bu Ay/Bu Yıl dönem sekmeleri — gerçek tarih filtrelemesi */}
                <div className="flex gap-2 bg-slate-100 dark:bg-white/5 rounded-2xl p-1">
                    {([
                        { key: 'all', label: 'Tümü' },
                        { key: 'month', label: 'Bu Ay' },
                        { key: 'year', label: 'Bu Yıl' },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { haptics.tap(); setPeriod(tab.key); }}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide border-0 cursor-pointer transition-all",
                                period === tab.key ? "bg-card text-slate-800 dark:text-white shadow-moffi-card" : "bg-transparent text-slate-400"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                {filtered.length === 0 ? (
                    <div className="text-center py-24 opacity-60">
                        <Route className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-500 leading-relaxed px-6">
                            {walkHistory.length === 0
                                ? <>Henüz tamamlanmış bir yürüyüşün yok.<br />İlk adımını atmaya ne dersin? 🐾</>
                                : 'Bu dönemde tamamlanmış bir yürüyüş yok.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map(([monthLabel, walks]) => (
                            <div key={monthLabel}>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">{monthLabel}</span>
                                <div className="space-y-2">
                                    {walks.map((walk, i) => {
                                        const points = routeToPolylinePoints(walk.path);
                                        const calories = Math.max(0, Math.round((walk.distanceKm || 0) * weightKg));
                                        const distLabel = (walk.distanceKm ?? 0).toFixed(2).replace('.', ',');
                                        const durLabel = `${walk.duration_minutes ?? 0} dk`;
                                        return (
                                            <motion.button
                                                key={walk.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.24, delay: Math.min(i, 8) * 0.04 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { haptics.tap(); router.push(`/walk/history/${walk.id}`); }}
                                                className="w-full text-left bg-card rounded-2xl p-3 shadow-moffi-card border border-card-border flex items-center gap-3 cursor-pointer"
                                            >
                                                <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-white/5 shrink-0 overflow-hidden flex items-center justify-center">
                                                    {points ? (
                                                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                            <polyline points={points} fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    ) : (
                                                        <Route className="w-5 h-5 text-slate-300 dark:text-white/10" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-1.5 mb-0.5">
                                                        <span className="text-[12px] font-black text-foreground shrink-0">{relativeDateLabel(walk.ended_at || walk.started_at)}</span>
                                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                                            {distLabel} km · {durLabel} · {calories} kcal
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{walk.steps.toLocaleString('tr-TR')} adım</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
