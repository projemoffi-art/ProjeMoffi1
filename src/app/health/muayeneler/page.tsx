'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import {
    AddButton, EmptyState, ErrorText, Field, FilterTabs, HealthCard, HealthHeader, LoadingBlocks, ModuleIcon,
    PrimaryButton, Sheet, SoftButton, TextArea, TextInput,
} from '@/components/health/HealthUI';
import { daysLeftText, daysBetween } from '@/lib/health/derive';
import { formatDateKeyTr, wallParts } from '@/lib/appointmentTime';
import { healthService } from '@/services/healthService';

type Tab = 'all' | 'upcoming' | 'past';
const fmt = (k: string) => formatDateKeyTr(k, { day: 'numeric', month: 'long', year: 'numeric' });

// Referans alt sıra — Muayeneler.
export default function VisitsPage() {
    const { pet, bundle, appointments, today, loading } = useHealth();
    const [tab, setTab] = useState<Tab>('all');
    const [addOpen, setAddOpen] = useState(false);

    const upcoming = useMemo(() => appointments
        .filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date && wallParts(a.appointment_date).dateKey >= today)
        .sort((a, b) => String(a.appointment_date).localeCompare(String(b.appointment_date))), [appointments, today]);
    const past = bundle?.records || [];

    return (
        <>
            <HealthHeader title="Muayeneler" backHref="/health" action={pet ? <AddButton onClick={() => setAddOpen(true)} /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <FilterTabs<Tab> options={[{ id: 'all', label: 'Tümü' }, { id: 'upcoming', label: 'Yaklaşan' }, { id: 'past', label: 'Geçmiş' }]} value={tab} onChange={setTab} />

                {loading || !bundle ? <LoadingBlocks /> : (
                    <>
                        {tab !== 'past' && upcoming.length > 0 && (
                            <section className="space-y-2.5">
                                {tab === 'all' && <h2 className="text-sm font-black">Yaklaşan</h2>}
                                {upcoming.map(a => {
                                    const w = wallParts(a.appointment_date);
                                    const reason = String(a.reason || '').split('\n')[0].replace('Randevu tipi:', '').trim();
                                    return (
                                        <HealthCard key={a.id} href="/vet?view=appointments" className="p-4 flex items-center gap-3">
                                            <PetAvatar src={a.clinic?.avatar_url} name={a.clinic?.business_name || a.clinic_name || 'V'} className="w-12 h-12 text-sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-secondary">{fmt(w.dateKey)} · {w.time}</div>
                                                <div className="text-sm font-black truncate">{reason || 'Veteriner randevusu'}</div>
                                                <div className="text-xs font-semibold text-secondary truncate">{a.clinic?.business_name || a.clinic_name}</div>
                                            </div>
                                            <span className="text-xs font-black text-accent whitespace-nowrap">{daysLeftText(daysBetween(today, w.dateKey))}</span>
                                        </HealthCard>
                                    );
                                })}
                            </section>
                        )}
                        {tab === 'upcoming' && upcoming.length === 0 && (
                            <EmptyState title="Yaklaşan randevu yok" action={<Link href="/vet" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Randevu al</Link>} />
                        )}

                        {tab !== 'upcoming' && (
                            past.length === 0 ? (
                                <EmptyState icon={<ModuleIcon module="muayeneler" size="lg" />} title="Henüz muayene kaydı yok"
                                    text="Moffi'deki bir klinikte muayene olduğunda kayıt buraya kendiliğinden gelir. Başka bir veterinere gittiysen kendin ekleyebilirsin." />
                            ) : (
                                <section className="space-y-2.5">
                                    {tab === 'all' && <h2 className="text-sm font-black">Geçmiş</h2>}
                                    {past.map(r => (
                                        <HealthCard key={r.id} href={`/health/muayeneler/${r.id}`} className="p-4 flex items-center gap-3">
                                            <PetAvatar src={r.clinicAvatar} name={r.clinicName || r.vetName || 'V'} className="w-12 h-12 text-sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-secondary">{fmt(r.date)}</div>
                                                <div className="text-sm font-black truncate">{r.diagnosis}</div>
                                                <div className="text-xs font-semibold text-secondary truncate">
                                                    {r.clinicName || r.vetName || 'Veteriner'}{r.source === 'owner' ? ' · kendi kaydın' : ''}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                                        </HealthCard>
                                    ))}
                                </section>
                            )
                        )}
                        <SoftButton href="/vet">Veteriner randevusu al</SoftButton>
                    </>
                )}
            </main>
            {pet && <AddVisitSheet open={addOpen} onClose={() => setAddOpen(false)} />}
        </>
    );
}

function AddVisitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { pet, today, run } = useHealth();
    const [f, setF] = useState({ date: today, clinic: '', vet: '', diagnosis: '', notes: '', weight: '', temp: '', cost: '' });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
    const num = (s: string) => (s.trim() ? Number(s.replace(',', '.')) : null);

    const save = async () => {
        if (!pet) return;
        if (!f.clinic.trim() || !f.diagnosis.trim()) { setError('Klinik adı ve muayene nedeni/tanı gerekli.'); return; }
        const weight = num(f.weight), temp = num(f.temp), cost = num(f.cost);
        if ([weight, temp, cost].some(v => v !== null && !Number.isFinite(v))) { setError('Kilo, sıcaklık ve ücret sayı olmalı.'); return; }
        setSaving(true);
        const err = await run(() => healthService.addVisitRecord({
            petId: pet.id, visitDate: f.date, clinicName: f.clinic, vetName: f.vet, diagnosis: f.diagnosis,
            notes: f.notes, weightKg: weight, temperatureC: temp, cost,
        }));
        setSaving(false);
        if (err) setError(err);
        else { setF({ date: today, clinic: '', vet: '', diagnosis: '', notes: '', weight: '', temp: '', cost: '' }); setError(null); onClose(); }
    };

    return (
        <Sheet open={open} onClose={onClose} title="Muayene kaydı ekle">
            <p className="text-xs font-semibold text-secondary">Moffi dışındaki bir veterinere gittiysen ziyareti buradan ekleyebilirsin.</p>
            <Field label="Tarih"><TextInput type="date" value={f.date} max={today} onChange={set('date')} /></Field>
            <Field label="Klinik"><TextInput value={f.clinic} onChange={set('clinic')} placeholder="Kliniğin adı" /></Field>
            <Field label="Veteriner hekim (isteğe bağlı)"><TextInput value={f.vet} onChange={set('vet')} /></Field>
            <Field label="Muayene nedeni / tanı"><TextInput value={f.diagnosis} onChange={set('diagnosis')} placeholder="Örn: Genel kontrol" /></Field>
            <Field label="Notlar (isteğe bağlı)"><TextArea value={f.notes} onChange={set('notes')} /></Field>
            <div className="grid grid-cols-3 gap-2">
                <Field label="Kilo (kg)"><TextInput inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
                <Field label="Ateş (°C)"><TextInput inputMode="decimal" value={f.temp} onChange={set('temp')} /></Field>
                <Field label="Ücret (₺)"><TextInput inputMode="decimal" value={f.cost} onChange={set('cost')} /></Field>
            </div>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}
