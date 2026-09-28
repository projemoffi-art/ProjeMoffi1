'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useHealth } from '@/components/health/HealthProvider';
import { EmptyState, FilterTabs, HealthHeader, LoadingBlocks, ModuleIcon, type HealthModule } from '@/components/health/HealthUI';
import { timelineEvents, type TimelineKind } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';

type Filter = 'all' | TimelineKind;
const KIND_MODULE: Record<TimelineKind, HealthModule> = {
    vaccine: 'asilar', visit: 'muayeneler', parasite: 'parazit', medication: 'ilaclar', weight: 'kilo', document: 'belgeler',
};

// Referans alt sıra — Zaman Çizelgesi.
export default function TimelinePage() {
    const { bundle, loading } = useHealth();
    const [filter, setFilter] = useState<Filter>('all');
    const events = useMemo(() => (bundle ? timelineEvents(bundle) : []), [bundle]);
    const list = filter === 'all' ? events : events.filter(e => e.kind === filter);

    const byYear = useMemo(() => {
        const groups: { year: string; items: typeof list }[] = [];
        for (const e of list) {
            const y = e.date.slice(0, 4);
            const g = groups.find(x => x.year === y);
            if (g) g.items.push(e); else groups.push({ year: y, items: [e] });
        }
        return groups;
    }, [list]);

    return (
        <>
            <HealthHeader title="Zaman Çizelgesi" backHref="/health" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <FilterTabs<Filter> value={filter} onChange={setFilter} options={[
                    { id: 'all', label: 'Tümü' }, { id: 'visit', label: 'Muayene' }, { id: 'vaccine', label: 'Aşı' },
                    { id: 'parasite', label: 'Parazit' }, { id: 'medication', label: 'İlaç' }, { id: 'weight', label: 'Kilo' },
                    { id: 'document', label: 'Belge' },
                ]} />
                {loading || !bundle ? <LoadingBlocks /> : byYear.length === 0 ? (
                    <EmptyState icon={<ModuleIcon module="zaman" size="lg" />} title="Henüz kayıt yok"
                        text="Aşı, muayene, ilaç ve kilo kayıtları tarih sırasıyla burada birleşir." />
                ) : byYear.map(g => (
                    <section key={g.year}>
                        <h2 className="text-base font-black mb-2">{g.year}</h2>
                        <ol className="relative border-l-2 border-card-border ml-5 space-y-2.5">
                            {g.items.map(e => (
                                <li key={e.id} className="pl-6 relative">
                                    <span className="absolute -left-[19px] top-3"><ModuleIcon module={KIND_MODULE[e.kind]} size="sm" /></span>
                                    <Link href={e.href || '#'} className="block bg-card border border-card-border rounded-2xl px-4 py-3 hover:border-accent/30 transition-colors">
                                        <div className="text-xs font-semibold text-secondary">
                                            {formatDateKeyTr(e.date, { day: 'numeric', month: 'long' })}{e.source === 'clinic' ? ' · klinik kaydı' : ''}
                                        </div>
                                        <div className="text-sm font-black">{e.title}</div>
                                        {e.subtitle && <div className="text-xs font-semibold text-secondary truncate">{e.subtitle}</div>}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </section>
                ))}
            </main>
        </>
    );
}
