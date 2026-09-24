'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Footprints, Clock, TrendingUp, Crown } from 'lucide-react';
import { useActivity } from '@/context/ActivityContext';
import { haptics } from '@/lib/haptics';

// Faz 9/13 düzeltmesi (bkz. design-reference/walk-final/, "8. Profil – Yürüyüş
// İstatistikleri"): bu bileşen tamamen sahteydi — hardcoded "12.4 km"/"8.2 saat"
// + 3 uydurma rota (`mockHistory`) + hiç işlevi olmayan "Buluta Yedekle" butonu.
// Ayrıca `routes` prop'u besleyen `PetContext.walkRoutes` state'i HİÇBİR YERDEN
// hiç doldurulmuyordu (`setWalkRoutes` tüm kod tabanında sıfır kez çağrılıyor) -
// yani bu ekran gerçek veriyle asla çalışamazdı, sadece mock fallback'e düşüyordu.
// Artık gerçek `ActivityContext.walkHistory`'den (Faz 10'da düzeltilen gerçek
// walk_sessions sorgusu) bu ayın verisini hesaplıyor. `routes` prop'u kaldırıldı.
export function RoutesTab({ activePet }: { activePet?: any }) {
    const router = useRouter();
    const { walkHistory } = useActivity();

    const now = new Date();

    const monthlyWalks = useMemo(() => {
        return walkHistory.filter(w => {
            const raw = w.started_at || w.ended_at;
            if (!raw) return false;
            const d = new Date(raw);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
    }, [walkHistory]);

    const kmOf = (w: typeof walkHistory[number]) => w.distanceKm ?? (w.distance_meters ? w.distance_meters / 1000 : 0);

    const totalKm = monthlyWalks.reduce((sum, w) => sum + kmOf(w), 0);
    const totalDurationMin = monthlyWalks.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const totalSteps = monthlyWalks.reduce((sum, w) => sum + (w.steps || 0), 0);
    const avgSteps = monthlyWalks.length > 0 ? Math.round(totalSteps / monthlyWalks.length) : 0;
    const hours = Math.floor(totalDurationMin / 60);
    const mins = Math.round(totalDurationMin % 60);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);

    const weeklyTotals = useMemo(() => {
        const weeks = new Array(weekCount).fill(0);
        monthlyWalks.forEach(w => {
            const raw = w.started_at || w.ended_at;
            if (!raw) return;
            const d = new Date(raw);
            const weekIdx = Math.min(weekCount - 1, Math.floor((d.getDate() - 1) / 7));
            weeks[weekIdx] += kmOf(w);
        });
        return weeks;
    }, [monthlyWalks, weekCount]);

    const maxWeek = Math.max(1, ...weeklyTotals);

    const mostActiveDay = useMemo(() => {
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const totals = new Array(7).fill(0);
        monthlyWalks.forEach(w => {
            const raw = w.started_at || w.ended_at;
            if (!raw) return;
            totals[new Date(raw).getDay()] += kmOf(w);
        });
        let bestIdx = -1, bestVal = 0;
        totals.forEach((v, i) => { if (v > bestVal) { bestVal = v; bestIdx = i; } });
        return bestIdx >= 0 ? { name: dayNames[bestIdx], km: bestVal } : null;
    }, [monthlyWalks]);

    if (monthlyWalks.length === 0) {
        return (
            <div className="text-center py-16 opacity-70 px-6">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-400 leading-relaxed">
                    {activePet?.name || 'Dostun'} bu ay henüz bir yürüyüşe çıkmadı.<br />Bugün küçük bir tur atmaya ne dersin? 🐾
                </p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4 pb-10">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bu Ay</h3>
                <button
                    onClick={() => { haptics.tap(); router.push('/walk/history'); }}
                    className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-widest cursor-pointer border-0 bg-transparent active:scale-95 transition-transform"
                >
                    Tümünü Gör <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 border border-card-border shadow-moffi-card">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-lg font-black text-foreground leading-none">{totalKm.toFixed(1)} km</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Toplam Mesafe</span>
                </div>
                <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 border border-card-border shadow-moffi-card">
                    <Footprints className="w-4 h-4 text-orange-500" />
                    <span className="text-lg font-black text-foreground leading-none">{monthlyWalks.length}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yürüyüş</span>
                </div>
                <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 border border-card-border shadow-moffi-card">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-black text-foreground leading-none">{hours}s {mins}dk</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Süre</span>
                </div>
                <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 border border-card-border shadow-moffi-card">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-black text-foreground leading-none">{avgSteps.toLocaleString('tr-TR')}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ortalama Adım</span>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-card-border shadow-moffi-card">
                <div className="flex items-end justify-between h-20 gap-2">
                    {weeklyTotals.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full flex-1 flex items-end overflow-hidden">
                                <div
                                    className="w-full bg-emerald-500 rounded-full transition-all"
                                    style={{ height: `${Math.max(4, (v / maxWeek) * 100)}%` }}
                                />
                            </div>
                            <span className="text-[7.5px] font-black text-slate-400 uppercase whitespace-nowrap">{i + 1}. Hafta</span>
                        </div>
                    ))}
                </div>
            </div>

            {mostActiveDay && (
                <div className="flex items-center gap-2.5 bg-card rounded-2xl p-3.5 border border-card-border shadow-moffi-card">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500">En Aktif Gün</span>
                    <span className="ml-auto text-[11px] font-black text-foreground">{mostActiveDay.name} · {mostActiveDay.km.toFixed(1)} km</span>
                </div>
            )}
        </motion.div>
    );
}
