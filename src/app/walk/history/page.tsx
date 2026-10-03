"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, BarChart3 } from "lucide-react";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { haptics } from "@/native/haptics";
import { formatKm, formatSteps } from "@/lib/walkMetrics";
import { WalkHeader, SegmentTabs } from "@/components/walk/WalkUI";
import RouteThumb from "@/components/walk/RouteThumb";

// Ekran 8 (Yürüyüş Geçmişi): dönem sekmeleri, ay gruplaması, kompakt satır.
type Period = 'all' | 'month' | 'year';

function relativeDay(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(new Date()) - day(d)) / 86400000);
    if (diff === 0) return 'Bugün';
    if (diff === 1) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function monthLabel(iso?: string) {
    if (!iso) return 'Tarihsiz';
    const s = new Date(iso).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

export default function WalkHistoryPage() {
    const router = useRouter();
    const { walkHistory } = useActivity();
    const { pets } = usePet();
    const [period, setPeriod] = useState<Period>('all');

    const filtered = useMemo(() => {
        const now = new Date();
        return walkHistory.filter(w => {
            if (period === 'all') return true;
            const d = new Date(w.ended_at || w.started_at || 0);
            if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            return d.getFullYear() === now.getFullYear();
        });
    }, [walkHistory, period]);

    const groups = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        for (const w of filtered) {
            const key = monthLabel(w.ended_at || w.started_at);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(w);
        }
        return Array.from(map.entries());
    }, [filtered]);

    return (
        <div className="min-h-[100dvh] pb-16">
            <WalkHeader
                title="Yürüyüş Geçmişi"
                right={
                    <button type="button" onClick={() => { haptics.tap(); router.push('/walk'); }} aria-label="İstatistikler" className="w-11 h-11 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-foreground" />
                    </button>
                }
            />
            <div className="px-5">
                <SegmentTabs
                    tabs={[{ id: 'all', label: 'Tümü' }, { id: 'month', label: 'Bu Ay' }, { id: 'year', label: 'Bu Yıl' }]}
                    value={period}
                    onChange={setPeriod}
                />

                {filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-4xl mb-3">🐾</div>
                        <p className="text-[14px] font-semibold text-secondary">
                            {walkHistory.length === 0 ? 'Henüz tamamlanmış bir yürüyüşün yok.' : 'Bu dönemde yürüyüş yok.'}
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-6">
                        {groups.map(([label, walks]) => (
                            <section key={label}>
                                <h2 className="text-[15px] font-extrabold mb-3">{label}</h2>
                                <div className="space-y-2.5">
                                    {walks.map((w, i) => {
                                        const pet = pets.length > 1 ? pets.find(p => String(p.id) === String(w.petId)) : null;
                                        return (
                                            <motion.button
                                                key={w.id}
                                                type="button"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(i, 8) * 0.03 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { haptics.tap(); router.push(`/walk/history/${w.id}`); }}
                                                className="w-full text-left bg-card border border-card-border rounded-3xl p-3 flex items-center gap-3.5 shadow-moffi-card"
                                            >
                                                <RouteThumb path={w.path} className="w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                                                        {relativeDay(w.ended_at || w.started_at)}
                                                        {pet && <span className="text-secondary font-semibold truncate">· {pet.name}</span>}
                                                    </div>
                                                    <div className="text-[16px] font-extrabold text-foreground mt-0.5">
                                                        {formatKm(w.distanceKm)} km <span className="text-secondary font-bold">·</span> {w.duration_minutes} dk
                                                    </div>
                                                    <div className="text-[12px] text-secondary font-semibold mt-0.5">
                                                        {formatSteps(w.steps)} adım · {w.calories} kcal
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-secondary shrink-0" />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
