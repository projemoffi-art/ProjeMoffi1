'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, Download, Heart, Syringe } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import {
    AddButton, EmptyState, ErrorText, Field, FilterTabs, HealthCard, HealthHeader, LoadingBlocks, ModuleIcon,
    PrimaryButton, SelectInput, Sheet, SoftButton, StatusBadge, TextInput,
} from '@/components/health/HealthUI';
import { addMonthsKey, daysLeftText, vaccineRows, type VaccineRow } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { healthService } from '@/services/healthService';
import { cn } from '@/lib/utils';

const fmt = (k: string | null | undefined) => (k ? formatDateKeyTr(k, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// Referans Ekran 3 — Aşılar.
export default function VaccinesPage() {
    const { pet, species, bundle, today, loading, run } = useHealth();
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [addOpen, setAddOpen] = useState(false);
    const [selected, setSelected] = useState<VaccineRow | null>(null);
    const [guideOpen, setGuideOpen] = useState(false);

    const rows = useMemo(() => (bundle ? vaccineRows(bundle.definitions, bundle.vaccines, today) : []), [bundle, today]);
    const calendar = useMemo(() => {
        const items = rows.filter(r => r.dueDate).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        const groups: { month: string; items: VaccineRow[] }[] = [];
        for (const r of items) {
            const month = r.dueDate!.slice(0, 7);
            const g = groups.find(x => x.month === month);
            if (g) g.items.push(r); else groups.push({ month, items: [r] });
        }
        return groups;
    }, [rows]);

    return (
        <>
            <HealthHeader title="Aşılar" backHref="/health" action={pet ? <AddButton onClick={() => setAddOpen(true)} /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <FilterTabs options={[{ id: 'list', label: 'Liste' }, { id: 'calendar', label: 'Takvim' }]} value={view} onChange={setView} />

                {loading || !bundle ? <LoadingBlocks /> : rows.length === 0 ? (
                    <EmptyState icon={<ModuleIcon module="asilar" size="lg" />} title="Henüz aşı kaydı yok"
                        text={species === 'other' ? 'Bu tür için hazır aşı listesi yok; yapılan aşıları elle ekleyebilirsin.' : 'Yapılan aşıları ekle ya da takvimini planla.'}
                        action={<button onClick={() => setAddOpen(true)} className="h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm">Aşı ekle</button>} />
                ) : view === 'list' ? (
                    <div className="space-y-2.5">
                        {rows.map(r => (
                            <HealthCard key={r.key} onClick={() => setSelected(r)} className="p-4 flex items-center gap-3">
                                <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                                    r.status === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                                        : r.status === 'due_soon' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                                            : r.last ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-card-border/50 text-secondary')}>
                                    <Syringe className="w-5 h-5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black line-clamp-2">{r.name}</div>
                                    {r.last || r.plan ? (
                                        <>
                                            {r.last && <div className="text-xs font-semibold text-secondary">Son uygulama: {fmt(r.last.dateAdministered)}</div>}
                                            {r.dueDate && <div className="text-xs font-semibold text-secondary">{r.last ? 'Sonraki' : 'Planlanan'}: {fmt(r.dueDate)}</div>}
                                        </>
                                    ) : (
                                        <div className="text-xs font-semibold text-secondary">{r.isCore ? 'Temel aşı · planlanmadı' : 'İsteğe bağlı · planlanmadı'}</div>
                                    )}
                                </div>
                                {r.status === 'unplanned'
                                    ? <span className="h-8 px-3 rounded-xl border border-card-border text-xs font-bold flex items-center">Planla</span>
                                    : <StatusBadge status={r.status} />}
                                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                            </HealthCard>
                        ))}
                    </div>
                ) : calendar.length === 0 ? (
                    <EmptyState title="Takvimde tarih yok" text="Bir aşının sonraki tarihini girdiğinde burada ay ay görünür." />
                ) : (
                    <div className="space-y-4">
                        {calendar.map(g => (
                            <section key={g.month}>
                                <h3 className="text-sm font-black mb-2 capitalize">{formatDateKeyTr(`${g.month}-01`, { month: 'long', year: 'numeric' })}</h3>
                                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                    {g.items.map(r => (
                                        <button key={r.key} onClick={() => setSelected(r)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                            <span className="w-11 text-center shrink-0">
                                                <span className="block text-lg font-black leading-none">{Number(r.dueDate!.slice(8))}</span>
                                                <span className="block text-[10px] font-bold text-secondary capitalize">{formatDateKeyTr(r.dueDate!, { weekday: 'short' })}</span>
                                            </span>
                                            <span className="flex-1 min-w-0 text-sm font-black truncate">{r.name}</span>
                                            <span className={cn('text-xs font-bold whitespace-nowrap', r.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-secondary')}>{daysLeftText(r.daysLeft)}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {bundle && (
                    <div className="space-y-2.5 pt-2">
                        {species !== 'other' && (
                            <HealthCard onClick={() => setGuideOpen(true)} className="p-4 flex items-center gap-3 bg-accent/5 border-accent/15">
                                <span className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center"><Heart className="w-5 h-5" /></span>
                                <div className="flex-1">
                                    <div className="text-sm font-black">{species === 'cat' ? 'Kediler için' : 'Köpekler için'} aşı listesi</div>
                                    <div className="text-xs font-semibold text-secondary">Temel ve isteğe bağlı aşılar, ne zaman yapılır</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary" />
                            </HealthCard>
                        )}
                        <HealthCard href="/pasaport/paylas?bolum=asilar" className="p-4 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-card-border/50 text-secondary flex items-center justify-center"><Download className="w-5 h-5" /></span>
                            <div className="flex-1">
                                <div className="text-sm font-black">Aşı geçmişi belgesi</div>
                                <div className="text-xs font-semibold text-secondary">PDF olarak kaydet ya da yazdır</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-secondary" />
                        </HealthCard>
                        <p className="text-[11px] font-semibold text-secondary px-1">
                            Aşı aralıkları genel bilgidir; yaşa, yaşam koşullarına ve bölgeye göre değişir. Kesin takvimi veterinerinle belirle.
                        </p>
                    </div>
                )}
            </main>

            {pet && bundle && (
                <>
                    <AddVaccineSheet open={addOpen} onClose={() => setAddOpen(false)} />
                    <VaccineDetailSheet row={selected} onClose={() => setSelected(null)} />
                    <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title={species === 'cat' ? 'Kedi aşıları' : 'Köpek aşıları'}>
                        {bundle.definitions.map(d => (
                            <div key={d.id} className="bg-card border border-card-border rounded-2xl p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-black">{d.name}</div>
                                    <span className="text-[11px] font-bold text-secondary">{d.isCore ? 'Temel' : 'İsteğe bağlı'}</span>
                                </div>
                                {d.description && <p className="text-xs font-semibold text-secondary mt-1">{d.description}</p>}
                                <p className="text-xs font-semibold text-secondary mt-1">En erken {d.minAgeWeeks}. haftada · tekrar {d.frequencyMonths} ayda bir</p>
                            </div>
                        ))}
                        <p className="text-[11px] font-semibold text-secondary">Yavrularda ilk aşılar birkaç hafta arayla tekrarlanır. Takvimi veterinerinle belirle.</p>
                    </Sheet>
                </>
            )}
        </>
    );
}

function AddVaccineSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { pet, bundle, today, run } = useHealth();
    const [defId, setDefId] = useState('');
    const [customName, setCustomName] = useState('');
    const [mode, setMode] = useState<'done' | 'plan'>('done');
    const [date, setDate] = useState(today);
    const [nextDate, setNextDate] = useState('');
    const [vet, setVet] = useState('');
    const [batch, setBatch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const def = bundle?.definitions.find(d => d.id === defId) || null;
    const suggestedNext = def && mode === 'done' && date ? addMonthsKey(date, def.frequencyMonths) : '';

    const reset = () => { setDefId(''); setCustomName(''); setMode('done'); setDate(today); setNextDate(''); setVet(''); setBatch(''); setError(null); };
    const close = () => { reset(); onClose(); };

    const save = async () => {
        const name = def ? def.name : customName.trim();
        if (!pet || !name) { setError('Aşıyı seç ya da adını yaz.'); return; }
        if (!date) { setError('Tarih seç.'); return; }
        setSaving(true);
        const err = await run(() => healthService.addVaccine({
            petId: pet.id, definitionId: def?.id || null, name,
            status: mode === 'done' ? 'completed' : 'pending',
            dateAdministered: mode === 'done' ? date : null,
            nextDueDate: mode === 'done' ? (nextDate || suggestedNext || null) : date,
            vetName: vet, batchNo: batch,
        }));
        setSaving(false);
        if (err) setError(err); else close();
    };

    return (
        <Sheet open={open} onClose={close} title="Aşı ekle">
            {bundle && bundle.definitions.length > 0 && (
                <Field label="Aşı">
                    <SelectInput value={defId} onChange={e => setDefId(e.target.value)}>
                        <option value="">Seç…</option>
                        {bundle.definitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        <option value="__other">Listede yok</option>
                    </SelectInput>
                </Field>
            )}
            {(!bundle || bundle.definitions.length === 0 || defId === '__other') && (
                <Field label="Aşının adı"><TextInput value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Örn: Mantar aşısı" /></Field>
            )}
            <FilterTabs options={[{ id: 'done', label: 'Yapıldı' }, { id: 'plan', label: 'Planla' }]} value={mode} onChange={setMode} />
            <Field label={mode === 'done' ? 'Uygulama tarihi' : 'Planlanan tarih'}>
                <TextInput type="date" value={date} max={mode === 'done' ? today : undefined} onChange={e => setDate(e.target.value)} />
            </Field>
            {mode === 'done' && (
                <>
                    <Field label="Sonraki doz" hint={suggestedNext && !nextDate ? `Boş bırakırsan ${fmt(suggestedNext)} olarak kaydedilir.` : undefined}>
                        <TextInput type="date" value={nextDate} min={date} onChange={e => setNextDate(e.target.value)} />
                    </Field>
                    <Field label="Veteriner / klinik (isteğe bağlı)"><TextInput value={vet} onChange={e => setVet(e.target.value)} /></Field>
                    <Field label="Seri / lot no (isteğe bağlı)"><TextInput value={batch} onChange={e => setBatch(e.target.value)} /></Field>
                </>
            )}
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}

function VaccineDetailSheet({ row, onClose }: { row: VaccineRow | null; onClose: () => void }) {
    const { pet, today, run } = useHealth();
    const [doneDate, setDoneDate] = useState(today);
    const [planDate, setPlanDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if (!row) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
    const freq = row.definition?.frequencyMonths;

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true); setError(null);
        const err = await run(fn);
        setBusy(false);
        if (err) setError(err); else { setPlanDate(''); onClose(); }
    };

    const markDone = () => act(async () => {
        const next = freq ? addMonthsKey(doneDate, freq) : null;
        if (row.plan) {
            await healthService.updateVaccine(row.plan.id, { status: 'completed', dateAdministered: doneDate, nextDueDate: next });
        } else {
            await healthService.addVaccine({ petId: pet!.id, definitionId: row.definition?.id || null, name: row.name,
                status: 'completed', dateAdministered: doneDate, nextDueDate: next });
        }
    });

    const setPlan = () => act(async () => {
        if (!planDate) throw new Error('Tarih seç.');
        if (row.plan) await healthService.updateVaccine(row.plan.id, { nextDueDate: planDate });
        else if (row.last) await healthService.updateVaccine(row.last.id, { nextDueDate: planDate });
        else await healthService.addVaccine({ petId: pet!.id, definitionId: row.definition?.id || null, name: row.name, status: 'pending', nextDueDate: planDate });
    });

    return (
        <Sheet open={!!row} onClose={onClose} title={row.name}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary">
                    {row.dueDate ? `${row.last ? 'Sonraki' : 'Planlanan'}: ${fmt(row.dueDate)} · ${daysLeftText(row.daysLeft)}` : 'Tarih yok'}
                </span>
                {row.status !== 'unplanned' && <StatusBadge status={row.status} />}
            </div>
            {row.definition?.description && <p className="text-xs font-semibold text-secondary">{row.definition.description}</p>}

            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <div className="text-sm font-black">Yapıldı olarak işaretle</div>
                <TextInput type="date" value={doneDate} max={today} onChange={e => setDoneDate(e.target.value)} />
                {freq && <p className="text-xs font-semibold text-secondary">Sonraki doz {fmt(addMonthsKey(doneDate || today, freq))} olarak planlanır.</p>}
                <PrimaryButton onClick={markDone} disabled={busy || !doneDate}>Yapıldı</PrimaryButton>
            </div>

            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <div className="text-sm font-black">{row.dueDate ? 'Tarihi değiştir' : 'Planla'}</div>
                <TextInput type="date" value={planDate} min={today} onChange={e => setPlanDate(e.target.value)} />
                <SoftButton onClick={setPlan}>Tarihi kaydet</SoftButton>
            </div>

            {row.history.length > 0 && (
                <div>
                    <div className="text-sm font-black mb-2">Geçmiş</div>
                    <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                        {row.history.map(h => (
                            <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold">{fmt(h.dateAdministered)}</div>
                                    <div className="text-xs font-semibold text-secondary truncate">
                                        {[h.vetName, h.batchNo && `Lot ${h.batchNo}`, h.source === 'clinic' ? 'Klinik kaydı' : null].filter(Boolean).join(' · ') || 'Sahip kaydı'}
                                    </div>
                                </div>
                                {h.source === 'owner' && (
                                    <button onClick={() => act(() => healthService.deleteVaccine(h.id))} className="text-xs font-bold text-red-600">Sil</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {row.plan && row.plan.source === 'owner' && (
                <button onClick={() => act(() => healthService.deleteVaccine(row.plan!.id))} className="w-full text-sm font-bold text-red-600 py-2">Planı kaldır</button>
            )}
            <ErrorText>{error}</ErrorText>
        </Sheet>
    );
}
