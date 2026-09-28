'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronRight, Share2 } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import { HealthCard, HealthHeader, LoadingBlocks, MODULES, ModuleIcon, SoftButton, type HealthModule } from '@/components/health/HealthUI';
import {
    ageText, formatKg, isMedicationActive, lastCheckupDate, overallStatus, parasiteRows, vaccineRows, weightSummary,
    type DueStatus,
} from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { cn } from '@/lib/utils';

const TABS: { label: string; href: string }[] = [
    { label: 'Özet', href: '/health/karne' },
    { label: 'Aşılar', href: '/health/asilar' },
    { label: 'Parazit', href: '/health/parazit' },
    { label: 'İlaçlar', href: '/health/ilaclar' },
    { label: 'Muayeneler', href: '/health/muayeneler' },
    { label: 'Kilo', href: '/health/kilo' },
    { label: 'Belgeler', href: '/health/belgeler' },
];

function genderMark(g?: string) {
    const s = String(g || '').toLocaleLowerCase('tr-TR');
    if (s.startsWith('di') || s.startsWith('f') || s === 'kız') return '♀';
    if (s.startsWith('er') || s.startsWith('m')) return '♂';
    return '';
}

/** Birden çok kalemin en kötü durumu (kutu başlığı için). */
function worst(statuses: DueStatus[]): { word: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
    if (statuses.includes('overdue')) return { word: 'Gecikmiş', tone: 'bad' };
    if (statuses.includes('due_soon')) return { word: 'Yaklaşıyor', tone: 'warn' };
    if (statuses.some(s => s === 'current' || s === 'done')) return { word: 'Güncel', tone: 'good' };
    return { word: 'Kayıt yok', tone: 'muted' };
}

const toneCls = { good: 'text-emerald-600 dark:text-emerald-400', warn: 'text-amber-600 dark:text-amber-400', bad: 'text-red-600 dark:text-red-400', muted: 'text-secondary' };

// Referans Ekran 2 — Sağlık Karnesi (özet).
export default function HealthKarnePage() {
    const { pet, bundle, today, loading } = useHealth();

    const data = useMemo(() => {
        if (!bundle) return null;
        const vRows = vaccineRows(bundle.definitions, bundle.vaccines, today).filter(r => r.last || r.plan || r.isCore);
        const pRows = parasiteRows(bundle.parasites, today);
        const activeMeds = bundle.medications.filter(m => isMedicationActive(m, today)).length;
        const w = weightSummary(bundle.weights, today);
        const p = bundle.profile;
        const hasEmergency = !!p && (p.allergies.length > 0 || p.chronicConditions.length > 0 || !!p.primaryVetPhone || !!p.bloodType);
        const lastRecord = bundle.records.find(r => r.source === 'clinic') || bundle.records[0] || null;
        return {
            status: overallStatus(bundle, today),
            vaccines: worst(vRows.map(r => r.status)),
            parasites: worst(pRows.map(r => r.status)),
            activeMeds, weight: w.latest, records: bundle.records.length, hasEmergency, lastRecord,
            lastCheck: lastCheckupDate(bundle),
        };
    }, [bundle, today]);

    const tiles: { module: HealthModule; value: string; tone: keyof typeof toneCls }[] = data ? [
        { module: 'asilar', value: data.vaccines.word, tone: data.vaccines.tone },
        { module: 'parazit', value: data.parasites.word, tone: data.parasites.tone },
        { module: 'ilaclar', value: data.activeMeds ? `${data.activeMeds} aktif` : 'Aktif ilaç yok', tone: data.activeMeds ? 'warn' : 'muted' },
        { module: 'kilo', value: data.weight ? `${formatKg(data.weight.weightKg)} kg` : 'Ölçüm yok', tone: 'muted' },
        { module: 'muayeneler', value: data.records ? `${data.records} kayıt` : 'Kayıt yok', tone: 'muted' },
        { module: 'acil', value: data.hasEmergency ? 'Tanımlı' : 'Eksik', tone: data.hasEmergency ? 'good' : 'warn' },
    ] : [];

    const verifyUrl = typeof window !== 'undefined' && pet ? `${window.location.origin}/verify/${pet.id}` : '';
    const age = pet ? ageText(pet.birthday, pet.age, today) : null;
    const chip = pet ? (pet.microchip || pet.microchip_id || pet.microchip_no) : null;

    return (
        <>
            <HealthHeader title="Sağlık Karnesi" backHref="/health" action={
                <Link href="/health/paylas" aria-label="Karnemi paylaş" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <Share2 className="w-4.5 h-4.5" />
                </Link>
            } />
            <main className="max-w-2xl mx-auto px-4 space-y-5">
                <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Karne bölümleri">
                    {TABS.map(t => (
                        <Link key={t.href} href={t.href} aria-current={t.href === '/health/karne' ? 'page' : undefined}
                            className={cn('px-4 h-9 flex items-center rounded-full whitespace-nowrap text-xs font-bold shrink-0',
                                t.href === '/health/karne' ? 'bg-foreground text-background' : 'bg-card border border-card-border text-secondary')}>
                            {t.label}
                        </Link>
                    ))}
                </nav>

                {pet && (
                    <section className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-5 flex gap-4">
                        <PetAvatar src={pet.image} name={pet.name} className="w-24 h-28 rounded-2xl text-3xl shrink-0" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="text-xl font-black truncate">{pet.name} <span className="text-accent">{genderMark(pet.gender)}</span></div>
                            {pet.breed && <div className="text-xs font-semibold text-secondary line-clamp-2">{pet.breed}</div>}
                            {pet.birthday && /^\d{4}-\d{2}-\d{2}/.test(pet.birthday) && (
                                <div className="text-xs font-semibold text-secondary">Doğum: {formatDateKeyTr(pet.birthday.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            )}
                            {age && <div className="text-xs font-semibold text-secondary">Yaş: {age}</div>}
                            <div className="text-xs font-semibold text-secondary">Çip no: {chip || 'Girilmedi'}</div>
                            <div className="text-[10px] font-bold text-secondary/80 pt-1">Kayıt no: MOF-{pet.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                        {verifyUrl && (
                            <div className="self-end bg-white p-1.5 rounded-xl shrink-0" title="Karne doğrulama kodu">
                                <QRCodeSVG value={verifyUrl} size={64} />
                            </div>
                        )}
                    </section>
                )}

                {loading || !data ? <LoadingBlocks count={3} /> : (
                    <>
                        <section>
                            <div className="flex items-center justify-between mb-2.5">
                                <div>
                                    <h2 className="text-base font-black">Genel sağlık özeti</h2>
                                    <p className="text-xs font-semibold text-secondary">
                                        {data.lastCheck ? `Son kontrol: ${formatDateKeyTr(data.lastCheck, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Henüz muayene kaydı yok'}
                                    </p>
                                </div>
                                <span className={cn('px-3 py-1 rounded-full text-xs font-black border',
                                    data.status.tone === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300'
                                        : data.status.tone === 'attention' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-300'
                                            : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-300')}>
                                    {data.status.tone === 'good' ? 'Güncel' : data.status.tone === 'attention' ? 'Dikkat' : 'Gecikmiş'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                                {tiles.map(t => (
                                    <Link key={t.module} href={MODULES[t.module].href} className="bg-card border border-card-border rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 hover:border-accent/30 transition-colors">
                                        <ModuleIcon module={t.module} size="sm" />
                                        <span className="text-xs font-black leading-tight">{MODULES[t.module].label}</span>
                                        <span className={cn('text-[11px] font-bold leading-tight', toneCls[t.tone])}>{t.value}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {data.lastRecord && (
                            <HealthCard href={data.lastRecord.clinicId ? `/vet?clinic=${data.lastRecord.clinicId}` : `/health/muayeneler/${data.lastRecord.id}`} className="p-4 flex items-center gap-3">
                                <PetAvatar src={data.lastRecord.clinicAvatar} name={data.lastRecord.clinicName || 'V'} className="w-11 h-11 text-sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-secondary">Veterinerimiz</div>
                                    <div className="text-sm font-black truncate">{data.lastRecord.clinicName || data.lastRecord.vetName || 'Veteriner'}</div>
                                    <div className="text-xs font-semibold text-secondary">Son kontrol: {formatDateKeyTr(data.lastRecord.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                            </HealthCard>
                        )}

                        <SoftButton href="/health/paylas"><Share2 className="w-4 h-4" /> Karnemi paylaş</SoftButton>
                    </>
                )}
            </main>
        </>
    );
}
