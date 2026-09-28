'use client';

import React, { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import {
    AddButton, EmptyState, ErrorText, Field, FilterTabs, HealthCard, HealthHeader, LoadingBlocks, ModuleIcon,
    PrimaryButton, Sheet, TextInput,
} from '@/components/health/HealthUI';
import { formatKg, weightSummary } from '@/lib/health/derive';
import { addDaysKey, formatDateKeyTr } from '@/lib/appointmentTime';
import { healthService } from '@/services/healthService';
import type { WeightLog } from '@/types/health';
import { cn } from '@/lib/utils';

type Range = '90' | '180' | '365' | 'all';
const fmt = (k: string) => formatDateKeyTr(k, { day: 'numeric', month: 'long', year: 'numeric' });

function WeightChart({ points }: { points: WeightLog[] }) {
    // viewBox telefondaki gerçek genişliğe yakın tutulur ki yazılar okunaklı kalsın.
    const W = 340, H = 170, padL = 34, padR = 10, padT = 12, padB = 24;
    if (points.length < 2) {
        return <p className="text-sm font-semibold text-secondary py-8 text-center">Grafik için en az iki ölçüm gerekiyor.</p>;
    }
    const t = (k: string) => Date.parse(`${k}T00:00:00Z`);
    const x0 = t(points[0].measuredOn), x1 = t(points[points.length - 1].measuredOn);
    const ws = points.map(p => p.weightKg);
    let lo = Math.min(...ws), hi = Math.max(...ws);
    if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
    const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
    const X = (k: string) => padL + (x1 === x0 ? 0.5 : (t(k) - x0) / (x1 - x0)) * (W - padL - padR);
    const Y = (w: number) => padT + (1 - (w - lo) / (hi - lo)) * (H - padT - padB);
    const ticks = [lo + pad, (lo + hi) / 2, hi - pad];
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.measuredOn).toFixed(1)} ${Y(p.weightKg).toFixed(1)}`).join(' ');
    const first = points[0].measuredOn, last = points[points.length - 1].measuredOn;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Kilo grafiği">
            {ticks.map((v, i) => (
                <g key={i}>
                    <line x1={padL} x2={W - padR} y1={Y(v)} y2={Y(v)} className="stroke-card-border" strokeWidth={1} />
                    <text x={padL - 6} y={Y(v) + 4} textAnchor="end" fontSize={11} className="fill-secondary">{formatKg(Math.round(v * 10) / 10)}</text>
                </g>
            ))}
            <path d={d} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {points.map(p => (
                <circle key={p.id} cx={X(p.measuredOn)} cy={Y(p.weightKg)} r={4} className={p.source === 'clinic' ? 'fill-emerald-500' : 'fill-accent'} />
            ))}
            <text x={padL} y={H - 8} fontSize={11} className="fill-secondary">{formatDateKeyTr(first, { day: 'numeric', month: 'short' })}</text>
            <text x={W - padR} y={H - 8} textAnchor="end" fontSize={11} className="fill-secondary">{formatDateKeyTr(last, { day: 'numeric', month: 'short' })}</text>
        </svg>
    );
}

// Referans alt sıra — Kilo Takibi.
export default function WeightPage() {
    const { pet, bundle, today, loading, run } = useHealth();
    const [range, setRange] = useState<Range>('365');
    const [addOpen, setAddOpen] = useState(false);
    const [kg, setKg] = useState('');
    const [date, setDate] = useState(today);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const summary = useMemo(() => weightSummary(bundle?.weights || [], today), [bundle, today]);
    const points = useMemo(() => {
        const all = [...(bundle?.weights || [])].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
        if (range === 'all') return all;
        const from = addDaysKey(today, -Number(range));
        return all.filter(w => w.measuredOn >= from);
    }, [bundle, range, today]);
    const list = useMemo(() => [...(bundle?.weights || [])].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn)), [bundle]);

    const save = async () => {
        const n = Number(kg.replace(',', '.'));
        if (!pet || !Number.isFinite(n) || n <= 0 || n >= 200) { setError('Geçerli bir kilo gir (örn: 4,2).'); return; }
        setSaving(true);
        const err = await run(() => healthService.addWeight(pet.id, Math.round(n * 100) / 100, date));
        setSaving(false);
        if (err) setError(err); else { setAddOpen(false); setKg(''); setDate(today); setError(null); }
    };

    return (
        <>
            <HealthHeader title="Kilo Takibi" backHref="/health" action={pet ? <AddButton onClick={() => setAddOpen(true)} /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {loading || !bundle ? <LoadingBlocks /> : !summary.latest ? (
                    <EmptyState icon={<ModuleIcon module="kilo" size="lg" />} title="Henüz ölçüm yok"
                        text="Düzenli tartmak, kilo değişimini erken fark etmeni sağlar."
                        action={<button onClick={() => setAddOpen(true)} className="h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm">Kilo ekle</button>} />
                ) : (
                    <>
                        <HealthCard className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-11 h-11 rounded-xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 flex items-center justify-center"><Scale className="w-5 h-5" /></span>
                                    <div>
                                        <div className="text-2xl font-black tabular-nums">{formatKg(summary.latest.weightKg)} kg</div>
                                        <div className="text-xs font-semibold text-secondary">Güncel kilo · {fmt(summary.latest.measuredOn)}</div>
                                    </div>
                                </div>
                                {summary.change !== null && (
                                    <div className="text-right">
                                        <div className={cn('text-base font-black tabular-nums', summary.change > 0 ? 'text-amber-600 dark:text-amber-400' : summary.change < 0 ? 'text-foreground' : 'text-secondary')}>
                                            {summary.change > 0 ? '+' : ''}{formatKg(summary.change)} kg
                                        </div>
                                        <div className="text-[11px] font-semibold text-secondary">{formatDateKeyTr(summary.changeSince!, { day: 'numeric', month: 'short' })} tarihinden beri</div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <FilterTabs<Range> options={[{ id: '90', label: '3 ay' }, { id: '180', label: '6 ay' }, { id: '365', label: '1 yıl' }, { id: 'all', label: 'Tümü' }]} value={range} onChange={setRange} />
                                <div className="mt-2"><WeightChart points={points} /></div>
                                <div className="flex gap-4 text-[11px] font-semibold text-secondary mt-1">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" />Senin ölçümün</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Klinik ölçümü</span>
                                </div>
                            </div>
                        </HealthCard>

                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            {list.map(w => (
                                <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                                    <span className="flex-1 text-sm font-semibold">{fmt(w.measuredOn)}</span>
                                    {w.source === 'clinic' && <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Klinik</span>}
                                    <span className="text-sm font-black tabular-nums">{formatKg(w.weightKg)} kg</span>
                                    {w.source === 'owner' && (
                                        <button onClick={() => run(() => healthService.deleteWeight(w.id))} className="text-xs font-bold text-red-600">Sil</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Kilo ekle">
                <Field label="Kilo (kg)"><TextInput inputMode="decimal" value={kg} onChange={e => setKg(e.target.value)} placeholder="Örn: 4,2" autoFocus /></Field>
                <Field label="Tarih"><TextInput type="date" value={date} max={today} onChange={e => setDate(e.target.value)} /></Field>
                <ErrorText>{error}</ErrorText>
                <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
            </Sheet>
        </>
    );
}
