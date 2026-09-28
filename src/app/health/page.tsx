'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetPicker } from '@/components/health/PetPicker';
import { EmptyState, HealthCard, LoadingBlocks, MODULES, ModuleIcon, SectionTitle, type HealthModule } from '@/components/health/HealthUI';
import { daysLeftText, lastCheckupDate, overallStatus, upcomingItems } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { cn } from '@/lib/utils';

const TILES: HealthModule[] = ['pasaport', 'asilar', 'parazit', 'ilaclar', 'kilo', 'muayeneler', 'belgeler', 'acil'];

// Referans Ekran 1 — Sağlık Merkezi.
export default function HealthCenterPage() {
    const router = useRouter();
    const { pet, bundle, appointments, today, loading, error } = useHealth();
    const [showAll, setShowAll] = useState(false);

    const status = useMemo(() => (bundle ? overallStatus(bundle, today) : null), [bundle, today]);
    const upcoming = useMemo(() => (bundle ? upcomingItems(bundle, appointments, today).filter(i => i.daysLeft <= 120) : []), [bundle, appointments, today]);
    const lastCheck = bundle ? lastCheckupDate(bundle) : null;

    if (!loading && !pet) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16">
                <EmptyState title="Henüz evcil hayvan eklemedin" text="Sağlık karnesi, eklediğin her evcil hayvan için ayrı tutulur."
                    action={<Link href="/home" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Ana sayfaya dön</Link>} />
            </main>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] space-y-5">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <PetPicker />
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black leading-tight">Sağlık Merkezi</h1>
                    <p className="text-sm font-semibold text-secondary mt-1">{pet ? `${pet.name} için tüm sağlık bilgileri tek yerde.` : ' '}</p>
                </div>
                {pet?.image && <img src={pet.image} alt="" className="w-24 h-24 rounded-3xl object-cover shrink-0" />}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
                {TILES.map(m => (
                    <Link key={m} href={MODULES[m].href} className="flex flex-col items-center gap-1.5 bg-card border border-card-border rounded-2xl py-3 px-1 hover:border-accent/30 transition-colors">
                        <ModuleIcon module={m} />
                        <span className="text-[11px] font-bold text-center leading-tight">{MODULES[m].label}</span>
                    </Link>
                ))}
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            {loading || !bundle || !status ? <LoadingBlocks count={2} /> : (
                <>
                    <HealthCard href="/health/karne" className="p-4 flex items-center gap-3.5">
                        <span className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                            status.tone === 'good' ? 'bg-emerald-500 text-white' : status.tone === 'attention' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white')}>
                            {status.tone === 'good' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-secondary">Genel durum</div>
                            <div className={cn('text-lg font-black', status.tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : status.tone === 'attention' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>
                                {status.title}
                            </div>
                            <div className="text-xs font-semibold text-secondary">
                                {lastCheck ? `Son kontrol: ${formatDateKeyTr(lastCheck, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Henüz muayene kaydı yok'}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                    </HealthCard>

                    <section>
                        <SectionTitle action={upcoming.length > 3 ? (
                            <button onClick={() => setShowAll(s => !s)} className="text-xs font-bold text-secondary">{showAll ? 'Daha az' : 'Tümünü gör'}</button>
                        ) : undefined}>Yaklaşan işlemler</SectionTitle>
                        {upcoming.length === 0 ? (
                            <HealthCard className="p-4">
                                <p className="text-sm font-semibold text-secondary">
                                    Yaklaşan bir iş yok. Aşı ve parazit tarihlerini girdiğinde burada sırayla görünür.
                                </p>
                            </HealthCard>
                        ) : (
                            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                {(showAll ? upcoming : upcoming.slice(0, 3)).map(i => (
                                    <Link key={i.id} href={i.href} className="flex items-center gap-3 px-4 py-3">
                                        <ModuleIcon module={i.kind === 'vaccine' ? 'asilar' : i.kind === 'parasite' ? 'parazit' : 'muayeneler'} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black line-clamp-2">{i.title}</div>
                                            <div className="text-xs font-semibold text-secondary">{formatDateKeyTr(i.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                        <span className={cn('text-sm font-black whitespace-nowrap', i.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-accent')}>
                                            {daysLeftText(i.daysLeft)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <HealthCard href="/health/zaman" className="p-4 flex items-center gap-3">
                        <ModuleIcon module="zaman" size="sm" />
                        <div className="flex-1">
                            <div className="text-sm font-black">Zaman çizelgesi</div>
                            <div className="text-xs font-semibold text-secondary">Tüm aşı, muayene, ilaç ve ölçümler tarih sırasıyla</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary" />
                    </HealthCard>
                </>
            )}
        </main>
    );
}
