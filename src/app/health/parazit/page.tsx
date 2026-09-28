'use client';

import React, { useMemo, useState } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import {
    AddButton, EmptyState, ErrorText, Field, FilterTabs, HealthCard, HealthHeader, LoadingBlocks, ModuleIcon,
    PrimaryButton, SelectInput, Sheet, SoftButton, StatusBadge, TextInput,
} from '@/components/health/HealthUI';
import {
    addMonthsKey, daysLeftText, parasiteRows, PARASITE_LABEL, PARASITE_SUGGESTED_MONTHS,
} from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { healthService } from '@/services/healthService';
import type { ParasiteKind, ParasiteTreatment } from '@/types/health';
import { cn } from '@/lib/utils';

type Tab = 'overdue' | 'upcoming' | 'done';
const fmt = (k: string | null | undefined) => (k ? formatDateKeyTr(k, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// Referans Ekran 4 — Parazit.
export default function ParasitePage() {
    const { pet, bundle, today, loading } = useHealth();
    const [tab, setTab] = useState<Tab>('done');
    const [addOpen, setAddOpen] = useState(false);
    const [completing, setCompleting] = useState<ParasiteTreatment | null>(null);

    const rows = useMemo(() => (bundle ? parasiteRows(bundle.parasites, today) : []), [bundle, today]);
    const lists = useMemo(() => {
        const all = bundle?.parasites || [];
        const overdue = rows.filter(r => r.status === 'overdue');
        const upcoming = rows.filter(r => r.dueDate && r.status !== 'overdue');
        const done = all.filter(p => p.status === 'done' && p.appliedOn).sort((a, b) => b.appliedOn!.localeCompare(a.appliedOn!));
        return { overdue, upcoming, done };
    }, [bundle, rows]);

    const doneByYear = useMemo(() => {
        const groups: { year: string; items: ParasiteTreatment[] }[] = [];
        for (const p of lists.done) {
            const y = p.appliedOn!.slice(0, 4);
            const g = groups.find(x => x.year === y);
            if (g) g.items.push(p); else groups.push({ year: y, items: [p] });
        }
        return groups;
    }, [lists.done]);

    const planFor = (kind: 'internal' | 'external') => rows.find(r => r.kind === kind)?.plan || null;

    return (
        <>
            <HealthHeader title="Parazit" backHref="/health" action={pet ? <AddButton onClick={() => setAddOpen(true)} /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {bundle && (
                    <div className="grid grid-cols-2 gap-2.5">
                        {rows.map(r => (
                            <HealthCard key={r.kind} className="p-3.5">
                                <div className="text-xs font-bold text-secondary">{PARASITE_LABEL[r.kind]}</div>
                                <div className="text-sm font-black mt-0.5">{r.last ? `Son: ${fmt(r.last.appliedOn)}` : 'Kayıt yok'}</div>
                                <div className={cn('text-xs font-bold mt-0.5', r.status === 'overdue' ? 'text-red-600 dark:text-red-400' : r.status === 'due_soon' ? 'text-amber-600 dark:text-amber-400' : 'text-secondary')}>
                                    {r.dueDate ? `Sonraki: ${fmt(r.dueDate)} · ${daysLeftText(r.daysLeft)}` : 'Sonraki tarih yok'}
                                </div>
                            </HealthCard>
                        ))}
                    </div>
                )}

                <FilterTabs<Tab>
                    options={[
                        { id: 'overdue', label: `Gecikmiş${lists.overdue.length ? ` (${lists.overdue.length})` : ''}` },
                        { id: 'upcoming', label: 'Yaklaşan' },
                        { id: 'done', label: 'Yapılanlar' },
                    ]}
                    value={tab} onChange={setTab} />

                {loading || !bundle ? <LoadingBlocks /> : tab === 'done' ? (
                    doneByYear.length === 0 ? (
                        <EmptyState icon={<ModuleIcon module="parazit" size="lg" />} title="Henüz uygulama kaydı yok"
                            text="İç ve dış parazit uygulamalarını ekle; sonraki tarihi hatırlatalım."
                            action={<button onClick={() => setAddOpen(true)} className="h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm">Uygulama ekle</button>} />
                    ) : (
                        <div className="space-y-4">
                            {doneByYear.map(g => (
                                <section key={g.year}>
                                    <h3 className="text-base font-black mb-2">{g.year}</h3>
                                    <ol className="relative border-l-2 border-card-border ml-2 space-y-3">
                                        {g.items.map(p => (
                                            <li key={p.id} className="pl-5 relative">
                                                <span className="absolute -left-[7px] top-4 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-background" />
                                                <HealthCard className="p-3.5 flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-semibold text-secondary">{fmt(p.appliedOn)}</div>
                                                        <div className="text-sm font-black">{PARASITE_LABEL[p.kind]} uygulaması</div>
                                                        {p.product && <div className="text-xs font-semibold text-secondary truncate">{p.product}</div>}
                                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            Uygulandı{p.source === 'clinic' ? ' · klinik kaydı' : ''}
                                                        </div>
                                                    </div>
                                                    {p.source === 'owner' && <DeleteLink id={p.id} />}
                                                </HealthCard>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            ))}
                        </div>
                    )
                ) : (
                    (tab === 'overdue' ? lists.overdue : lists.upcoming).length === 0 ? (
                        <EmptyState title={tab === 'overdue' ? 'Gecikmiş uygulama yok' : 'Planlanmış uygulama yok'}
                            text={tab === 'overdue' ? 'Her şey zamanında.' : 'Bir uygulama eklediğinde sonraki tarih burada görünür.'} />
                    ) : (
                        <div className="space-y-2.5">
                            {(tab === 'overdue' ? lists.overdue : lists.upcoming).map(r => (
                                <HealthCard key={r.kind} className="p-4 flex items-center gap-3">
                                    <ModuleIcon module="parazit" size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black">{PARASITE_LABEL[r.kind]} uygulaması</div>
                                        <div className="text-xs font-semibold text-secondary">{fmt(r.dueDate)} · {daysLeftText(r.daysLeft)}</div>
                                    </div>
                                    <StatusBadge status={r.status} />
                                    <button onClick={() => setCompleting(r.plan || ({ id: '', kind: r.kind } as ParasiteTreatment))}
                                        className="h-8 px-3 rounded-xl bg-accent text-white text-xs font-black">Yaptım</button>
                                </HealthCard>
                            ))}
                        </div>
                    )
                )}

                <div className="flex items-start gap-3 rounded-2xl bg-accent/5 border border-accent/15 p-4">
                    <Bell className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[13px] font-semibold text-secondary leading-relaxed">
                        Sonraki uygulama tarihi yaklaşınca hatırlatırız. Uygulama aralığı kullanılan ürüne göre değişir; ürünün kullanım talimatına ya da veterinerine göre ayarla.
                    </p>
                </div>
            </main>

            {pet && (
                <>
                    <AddParasiteSheet open={addOpen} onClose={() => setAddOpen(false)} planIdFor={planFor} />
                    <AddParasiteSheet open={!!completing} onClose={() => setCompleting(null)}
                        completing={completing && completing.id ? completing : null}
                        presetKind={completing?.kind === 'internal' || completing?.kind === 'external' ? completing.kind : undefined}
                        planIdFor={planFor} />
                </>
            )}
        </>
    );
}

function DeleteLink({ id }: { id: string }) {
    const { run } = useHealth();
    return <button onClick={() => run(() => healthService.deleteParasite(id))} className="text-xs font-bold text-red-600 shrink-0">Sil</button>;
}

function AddParasiteSheet({ open, onClose, completing, presetKind, planIdFor }: {
    open: boolean; onClose: () => void; completing?: ParasiteTreatment | null; presetKind?: ParasiteKind;
    planIdFor?: (kind: 'internal' | 'external') => ParasiteTreatment | null;
}) {
    const { pet, today, run } = useHealth();
    const [kind, setKind] = useState<ParasiteKind>(presetKind || 'internal');
    const [mode, setMode] = useState<'done' | 'plan'>('done');
    const [date, setDate] = useState(today);
    const [nextDate, setNextDate] = useState('');
    const [product, setProduct] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (open) { setKind(presetKind || completing?.kind || 'internal'); setMode('done'); setDate(today); setNextDate(''); setProduct(''); setError(null); }
    }, [open, presetKind, completing, today]);

    const suggested = mode === 'done' && date ? addMonthsKey(date, PARASITE_SUGGESTED_MONTHS[kind]) : '';

    const save = async () => {
        if (!pet || !date) { setError('Tarih seç.'); return; }
        setSaving(true);
        const next = nextDate || suggested || null;
        const err = await run(async () => {
            if (mode === 'plan') {
                await healthService.addParasite({ petId: pet.id, kind, status: 'planned', nextDueOn: date });
                return;
            }
            // Yapılan uygulama, aynı türün açık planını kapatır (tek ürün iç+dış ise ikisini de).
            const plans = completing?.id ? [completing]
                : (kind === 'combined' ? [planIdFor?.('internal'), planIdFor?.('external')] : [planIdFor?.(kind)])
                    .filter((p): p is ParasiteTreatment => !!p?.id);
            if (plans.length === 1 && plans[0].kind === kind) {
                await healthService.completeParasite(plans[0].id, date, next, product);
                return;
            }
            await healthService.addParasite({ petId: pet.id, kind, status: 'done', product, appliedOn: date, nextDueOn: next });
            for (const p of plans) await healthService.deleteParasite(p.id);
        });
        setSaving(false);
        if (err) setError(err); else onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title={completing ? 'Uygulamayı kaydet' : 'Parazit uygulaması'}>
            {!completing && (
                <Field label="Tür">
                    <SelectInput value={kind} onChange={e => setKind(e.target.value as ParasiteKind)}>
                        <option value="internal">İç parazit</option>
                        <option value="external">Dış parazit</option>
                        <option value="combined">İç ve dış parazit (tek ürün)</option>
                    </SelectInput>
                </Field>
            )}
            {!completing && <FilterTabs options={[{ id: 'done', label: 'Yapıldı' }, { id: 'plan', label: 'Planla' }]} value={mode} onChange={setMode} />}
            <Field label={mode === 'done' ? 'Uygulama tarihi' : 'Planlanan tarih'}>
                <TextInput type="date" value={date} max={mode === 'done' ? today : undefined} onChange={e => setDate(e.target.value)} />
            </Field>
            {mode === 'done' && (
                <>
                    <Field label="Ürün (isteğe bağlı)"><TextInput value={product} onChange={e => setProduct(e.target.value)} placeholder="Örn: damla, tablet, tasma" /></Field>
                    <Field label="Sonraki uygulama" hint={!nextDate && suggested ? `Boş bırakırsan ${fmt(suggested)} (${PARASITE_SUGGESTED_MONTHS[kind]} ay sonra) kaydedilir.` : undefined}>
                        <TextInput type="date" value={nextDate} min={date} onChange={e => setNextDate(e.target.value)} />
                    </Field>
                </>
            )}
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
            <SoftButton onClick={onClose}>Vazgeç</SoftButton>
        </Sheet>
    );
}
