'use client';

import React, { useMemo, useState } from 'react';
import { Check, Clock, Pill } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import {
    AddButton, EmptyState, ErrorText, Field, FilterTabs, HealthCard, HealthHeader, LoadingBlocks, ModuleIcon,
    PrimaryButton, Sheet, SoftButton, TextArea, TextInput,
} from '@/components/health/HealthUI';
import { isMedicationActive, medicationDaysLeft, todayDoseSlots, daysLeftText } from '@/lib/health/derive';
import { addDaysKey, formatDateKeyTr } from '@/lib/appointmentTime';
import { healthService } from '@/services/healthService';
import type { Medication } from '@/types/health';
import { cn } from '@/lib/utils';

const fmt = (k: string | null | undefined) => (k ? formatDateKeyTr(k, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// Referans alt sıra — İlaçlar.
export default function MedicationsPage() {
    const { pet, bundle, today, loading, run } = useHealth();
    const [tab, setTab] = useState<'active' | 'past'>('active');
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<Medication | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { active, past, slots } = useMemo(() => {
        const meds = bundle?.medications || [];
        return {
            active: meds.filter(m => isMedicationActive(m, today)),
            past: meds.filter(m => !isMedicationActive(m, today)),
            slots: bundle ? todayDoseSlots(bundle, today) : [],
        };
    }, [bundle, today]);

    const toggleDose = async (m: Medication, slot: string, given: boolean) => {
        setError(null);
        const err = await run(() => given
            ? healthService.unlogDose(m.id, today, slot)
            : healthService.logDose(m.id, m.petId, today, slot));
        if (err) setError(err);
    };

    const list = tab === 'active' ? active : past;

    return (
        <>
            <HealthHeader title="İlaçlar" backHref="/health" action={pet ? <AddButton onClick={() => setAddOpen(true)} /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <FilterTabs options={[{ id: 'active', label: `Aktif${active.length ? ` (${active.length})` : ''}` }, { id: 'past', label: 'Geçmiş' }]} value={tab} onChange={setTab} />

                {tab === 'active' && slots.length > 0 && (
                    <section className="bg-card border border-card-border rounded-2xl p-4">
                        <h2 className="text-sm font-black mb-2">Bugünkü dozlar</h2>
                        <div className="divide-y divide-card-border">
                            {slots.map(s => (
                                <button key={`${s.medication.id}-${s.slot}`} onClick={() => toggleDose(s.medication, s.slot, s.given)}
                                    className="w-full flex items-center gap-3 py-2.5 text-left" role="checkbox" aria-checked={s.given}>
                                    <span className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0', s.given ? 'bg-emerald-500 border-emerald-500' : 'border-card-border')}>
                                        {s.given && <Check className="w-4 h-4 text-white" />}
                                    </span>
                                    <span className="text-sm font-black tabular-nums w-12">{s.slot}</span>
                                    <span className={cn('flex-1 text-sm font-semibold truncate', s.given && 'line-through text-secondary')}>
                                        {s.medication.name}{s.medication.dosage ? ` · ${s.medication.dosage}` : ''}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <ErrorText>{error}</ErrorText>
                    </section>
                )}

                {loading || !bundle ? <LoadingBlocks /> : list.length === 0 ? (
                    <EmptyState icon={<ModuleIcon module="ilaclar" size="lg" />}
                        title={tab === 'active' ? 'Aktif ilaç yok' : 'Geçmiş ilaç yok'}
                        text={tab === 'active' ? 'Veterinerin reçete yazdığında burada kendiliğinden görünür; kendin de ekleyebilirsin.' : undefined}
                        action={tab === 'active' ? <button onClick={() => setAddOpen(true)} className="h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm">İlaç ekle</button> : undefined} />
                ) : (
                    <div className="space-y-2.5">
                        {list.map(m => {
                            const left = medicationDaysLeft(m, today);
                            return (
                                <HealthCard key={m.id} onClick={() => setEditing(m)} className={cn('p-4', tab === 'past' && 'opacity-70')}>
                                    <div className="flex items-start gap-3">
                                        <span className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 flex items-center justify-center shrink-0">
                                            <Pill className="w-5 h-5" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black truncate">{m.name}</div>
                                            <div className="text-xs font-semibold text-secondary">
                                                {[m.dosage, m.frequency].filter(Boolean).join(' · ') || 'Doz bilgisi yok'}
                                            </div>
                                            <div className="text-xs font-semibold text-secondary">
                                                {m.prescribedBy ? `${m.prescribedBy} tarafından reçete edildi` : 'Kendi eklediğin'}
                                            </div>
                                        </div>
                                        {tab === 'active' && left !== null && (
                                            <span className="text-xs font-black text-accent whitespace-nowrap">{daysLeftText(left)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {m.doseTimes.map(t => (
                                            <span key={t} className="h-7 px-2.5 rounded-lg bg-card-border/40 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" />{t}</span>
                                        ))}
                                        {m.doseTimes.length === 0 && tab === 'active' && (
                                            <span className="text-xs font-bold text-accent">Doz saati ekle, hatırlatalım</span>
                                        )}
                                        <span className="text-[11px] font-semibold text-secondary self-center ml-auto">
                                            {fmt(m.startDate)}{m.endDate ? ` – ${fmt(m.endDate)}` : ''}
                                        </span>
                                    </div>
                                </HealthCard>
                            );
                        })}
                    </div>
                )}
            </main>

            {pet && (
                <>
                    <AddMedicationSheet open={addOpen} onClose={() => setAddOpen(false)} />
                    <EditMedicationSheet med={editing} onClose={() => setEditing(null)} />
                </>
            )}
        </>
    );
}

function TimesEditor({ times, onChange }: { times: string[]; onChange: (t: string[]) => void }) {
    const [draft, setDraft] = useState('08:00');
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {times.map(t => (
                    <button key={t} type="button" onClick={() => onChange(times.filter(x => x !== t))}
                        className="h-8 px-3 rounded-lg bg-accent/10 text-accent text-xs font-black">{t} ✕</button>
                ))}
                {times.length === 0 && <span className="text-xs font-semibold text-secondary">Henüz saat yok</span>}
            </div>
            <div className="flex gap-2">
                <TextInput type="time" value={draft} onChange={e => setDraft(e.target.value)} className="flex-1" />
                <button type="button" onClick={() => draft && !times.includes(draft) && onChange([...times, draft].sort())}
                    className="h-12 px-4 rounded-2xl border border-card-border bg-card text-sm font-black">Ekle</button>
            </div>
        </div>
    );
}

function AddMedicationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { pet, today, run } = useHealth();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [days, setDays] = useState('');
    const [start, setStart] = useState(today);
    const [times, setTimes] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const close = () => { setName(''); setDosage(''); setFrequency(''); setDays(''); setStart(today); setTimes([]); setNotes(''); setError(null); onClose(); };

    const save = async () => {
        if (!pet || !name.trim()) { setError('İlacın adını yaz.'); return; }
        const n = days.trim() ? Number(days) : null;
        if (n !== null && (!Number.isInteger(n) || n < 1 || n > 365)) { setError('Süre 1–365 gün arasında olmalı.'); return; }
        setSaving(true);
        const err = await run(() => healthService.addMedication({
            petId: pet.id, name, dosage, frequency, instructions: notes, startDate: start,
            endDate: n ? addDaysKey(start, n - 1) : null, doseTimes: times,
        }));
        setSaving(false);
        if (err) setError(err); else close();
    };

    return (
        <Sheet open={open} onClose={close} title="İlaç ekle">
            <Field label="İlacın adı"><TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Amoksisilin" /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Doz"><TextInput value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Örn: 1 tablet" /></Field>
                <Field label="Sıklık"><TextInput value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Örn: günde 2 kez" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Başlangıç"><TextInput type="date" value={start} onChange={e => setStart(e.target.value)} /></Field>
                <Field label="Süre (gün)" hint="Boşsa süresiz"><TextInput inputMode="numeric" value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ''))} /></Field>
            </div>
            <Field label="Doz saatleri"><TimesEditor times={times} onChange={setTimes} /></Field>
            <Field label="Not (isteğe bağlı)"><TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Örn: yemekle birlikte" /></Field>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}

function EditMedicationSheet({ med, onClose }: { med: Medication | null; onClose: () => void }) {
    const { today, run } = useHealth();
    const [times, setTimes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    React.useEffect(() => { if (med) { setTimes(med.doseTimes); setError(null); } }, [med]);
    if (!med) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
    const active = isMedicationActive(med, today);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        const err = await run(fn);
        setBusy(false);
        if (err) setError(err); else onClose();
    };

    return (
        <Sheet open={!!med} onClose={onClose} title={med.name}>
            <div className="text-sm font-semibold text-secondary space-y-0.5">
                {med.dosage && <div>Doz: {med.dosage}</div>}
                {med.frequency && <div>Sıklık: {med.frequency}</div>}
                {med.instructions && <div>{med.instructions}</div>}
                <div>{fmt(med.startDate)}{med.endDate ? ` – ${fmt(med.endDate)}` : ' · süresiz'}</div>
                {med.prescribedBy && <div>Reçete: {med.prescribedBy}</div>}
            </div>
            {active && (
                <>
                    <Field label="Doz saatleri" hint="Bugünkü dozlar listesinde ve hatırlatmalarda kullanılır.">
                        <TimesEditor times={times} onChange={setTimes} />
                    </Field>
                    <PrimaryButton onClick={() => act(() => healthService.updateMedication(med.id, { doseTimes: times }))} disabled={busy}>Saatleri kaydet</PrimaryButton>
                    <SoftButton onClick={() => act(() => healthService.updateMedication(med.id, { isActive: false, endDate: today }))}>İlacı bitir</SoftButton>
                </>
            )}
            {med.source === 'owner' && (
                <button onClick={() => act(() => healthService.deleteMedication(med.id))} className="w-full text-sm font-bold text-red-600 py-2">Kaydı sil</button>
            )}
            <ErrorText>{error}</ErrorText>
        </Sheet>
    );
}
