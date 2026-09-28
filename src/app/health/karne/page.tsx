'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { HealthHeader, LoadingBlocks, MODULES, ModuleIcon, SectionTitle, type HealthModule } from '@/components/health/HealthUI';
import {
    daysLeftText, isMedicationActive, lastCheckupDate, medicationDaysLeft, overallStatus, parasiteRows, upcomingItems, vaccineRows,
    type DueStatus,
} from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { cn } from '@/lib/utils';

/** Birden çok kalemin en kötü durumu (kutu başlığı için). */
function worst(statuses: DueStatus[]): { word: string; tone: Tone } {
    if (statuses.includes('overdue')) return { word: 'Gecikmiş', tone: 'bad' };
    if (statuses.includes('due_soon')) return { word: 'Yaklaşıyor', tone: 'warn' };
    if (statuses.some(s => s === 'current' || s === 'done')) return { word: 'Güncel', tone: 'good' };
    return { word: 'Kayıt yok', tone: 'muted' };
}

type Tone = 'good' | 'warn' | 'bad' | 'muted';
const toneText: Record<Tone, string> = { good: 'text-emerald-600 dark:text-emerald-400', warn: 'text-amber-600 dark:text-amber-400', bad: 'text-red-600 dark:text-red-400', muted: 'text-secondary' };

const QUICK: { module: HealthModule; label: string }[] = [
    { module: 'asilar', label: 'Tüm aşı takvimi' },
    { module: 'ilaclar', label: 'İlaç takibi' },
    { module: 'muayeneler', label: 'Veteriner kayıtları' },
    { module: 'zaman', label: 'Sağlık geçmişi' },
    { module: 'kilo', label: 'Kilo takibi' },
    { module: 'acil', label: 'Acil bilgiler' },
];

// Pasaport referansı Ekran 3 — Sağlık Özeti.
export default function HealthSummaryPage() {
    const { bundle, appointments, today, loading } = useHealth();

    const data = useMemo(() => {
        if (!bundle) return null;
        const vRows = vaccineRows(bundle.definitions, bundle.vaccines, today).filter(r => r.last || r.plan || r.isCore);
        const active = bundle.medications.filter(m => isMedicationActive(m, today));
        const endingSoon = active.map(m => medicationDaysLeft(m, today)).filter((n): n is number => n != null).sort((a, b) => a - b)[0];
        const lastVisit = bundle.records[0] || null;
        return {
            status: overallStatus(bundle, today),
            lastCheck: lastCheckupDate(bundle),
            vaccines: worst(vRows.map(r => r.status)),
            parasites: worst(parasiteRows(bundle.parasites, today).map(r => r.status)),
            meds: active.length === 0
                ? { word: 'Aktif ilaç yok', tone: 'muted' as Tone }
                : endingSoon != null ? { word: endingSoon <= 0 ? 'Bugün bitiyor' : `${endingSoon} gün kaldı`, tone: 'warn' as Tone }
                    : { word: `${active.length} aktif`, tone: 'warn' as Tone },
            lastVisit,
            next: upcomingItems(bundle, appointments, today)[0] || null,
        };
    }, [bundle, appointments, today]);

    const tiles: { module: HealthModule; label: string; value: string; tone: Tone }[] = data ? [
        { module: 'asilar', label: 'Aşılar', ...data.vaccines, value: data.vaccines.word },
        { module: 'parazit', label: 'Parazit', ...data.parasites, value: data.parasites.word },
        { module: 'ilaclar', label: 'İlaçlar', ...data.meds, value: data.meds.word },
        {
            module: 'muayeneler', label: 'Son muayene', tone: 'muted',
            value: data.lastVisit ? formatDateKeyTr(data.lastVisit.date, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Kayıt yok',
        },
    ] : [];

    return (
        <>
            <HealthHeader title="Sağlık Özeti" />
            <main className="max-w-2xl mx-auto px-4 space-y-5">
                {loading || !data ? <LoadingBlocks count={4} /> : (
                    <>
                        <section className={cn('rounded-3xl p-4 flex items-center gap-4 border',
                            data.status.tone === 'good' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25'
                                : data.status.tone === 'attention' ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25'
                                    : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25')}>
                            <span className={cn('w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-white',
                                data.status.tone === 'good' ? 'bg-emerald-500' : data.status.tone === 'attention' ? 'bg-amber-500' : 'bg-red-500')}>
                                {data.status.tone === 'good' ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                            </span>
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-secondary">Genel durum</div>
                                <div className={cn('text-xl font-black leading-tight', data.status.tone === 'good' ? 'text-emerald-700 dark:text-emerald-300' : data.status.tone === 'attention' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300')}>
                                    {data.status.title}
                                </div>
                                <div className="text-xs font-semibold text-secondary">
                                    {data.lastCheck ? `Son kontrol: ${formatDateKeyTr(data.lastCheck, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Henüz muayene kaydı yok'}
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-2.5">
                            {tiles.map(t => (
                                <Link key={t.module} href={MODULES[t.module].href} className="bg-card border border-card-border rounded-2xl p-3 flex items-center gap-3 hover:border-accent/30 transition-colors">
                                    <ModuleIcon module={t.module} size="sm" />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-black leading-tight">{t.label}</span>
                                        <span className={cn('block text-xs font-bold leading-tight mt-0.5 line-clamp-2', toneText[t.tone])}>{t.value}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>

                        {data.next && (
                            <Link href={data.next.href} className="block rounded-2xl border border-red-200 dark:border-red-500/25 bg-red-50/70 dark:bg-red-500/5 p-4">
                                <div className="text-xs font-black text-accent mb-2">Sonraki önemli işlem</div>
                                <div className="flex items-center gap-3">
                                    <ModuleIcon module={data.next.kind === 'vaccine' ? 'asilar' : data.next.kind === 'parasite' ? 'parazit' : 'muayeneler'} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base font-black line-clamp-2">{data.next.title}</div>
                                        <div className={cn('text-xs font-bold', data.next.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-accent')}>{daysLeftText(data.next.daysLeft)}</div>
                                        <div className="text-xs font-semibold text-secondary">{formatDateKeyTr(data.next.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                                </div>
                            </Link>
                        )}

                        <section>
                            <SectionTitle>Hızlı erişim</SectionTitle>
                            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                {QUICK.map(q => (
                                    <Link key={q.module} href={MODULES[q.module].href} className="flex items-center gap-3 px-4 py-3">
                                        <ModuleIcon module={q.module} size="sm" />
                                        <span className="flex-1 text-sm font-bold">{q.label}</span>
                                        <ChevronRight className="w-4 h-4 text-secondary" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </>
    );
}
