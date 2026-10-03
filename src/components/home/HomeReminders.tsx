'use client';

// Hatırlatmalar (home-final referansı): TÜM hayvanların yaklaşan aşı/parazit/randevu/ilaç işleri.
// Geciken en üstte. Hiçbir iş yoksa sade bir "her şey yolunda" kartı; yüklenirken iskelet.

import Link from 'next/link';
import { CalendarDays, CheckCircle2, ChevronRight, Pill, ShieldCheck, Stethoscope, Syringe } from 'lucide-react';
import { daysLeftText } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import type { CareItem, CareKind } from '@/hooks/useUpcomingCare';
import { SectionHeader, Skeleton } from './homeUI';

const MAX_ROWS = 3;

const KIND_STYLE: Record<CareKind, { Icon: typeof Syringe; color: string }> = {
    vaccine: { Icon: Syringe, color: '#EE5B3D' },
    parasite: { Icon: ShieldCheck, color: '#8B7FD9' },
    appointment: { Icon: Stethoscope, color: '#2F9E8F' },
    medication: { Icon: Pill, color: '#6BAF3A' },
};

function badgeStyle(daysLeft: number | null, color: string) {
    if (daysLeft !== null && daysLeft < 0) return { background: 'rgba(217,67,47,0.12)', color: '#C2382A' };
    return { background: `${color}1A`, color };
}

export function HomeReminders({ items, loaded }: { items: CareItem[]; loaded: boolean }) {
    const rows = items.slice(0, MAX_ROWS);

    return (
        <section>
            <SectionHeader
                title="Hatırlatmalar"
                subtitle="Patinin sağlığı bizim için önemli ♡"
                href="/health"
                actionLabel={items.length > MAX_ROWS ? `Tümü (${items.length})` : 'Tümünü Gör'}
            />

            {!loaded && rows.length === 0 ? (
                <div className="space-y-2">
                    <Skeleton className="h-[68px]" />
                    <Skeleton className="h-[68px]" />
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-[20px] bg-card border border-card-border px-4 py-4 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-[#8FD14F]/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-[#5C9B2E]" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-bold text-foreground">Her şey yolunda</span>
                        <span className="block text-[12.5px] font-semibold text-secondary leading-snug">Yaklaşan aşı, ilaç ya da randevu yok.</span>
                    </span>
                    <Link href="/health/asilar" className="shrink-0 text-[13px] font-bold text-accent px-2 py-1.5">Kayıt ekle</Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map(item => {
                        const style = KIND_STYLE[item.kind];
                        const badge = item.daysLeft !== null ? daysLeftText(item.daysLeft) : null;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="rounded-[20px] bg-card border border-card-border pl-3 pr-3 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
                            >
                                <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: style.color }}>
                                    <style.Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[14.5px] font-bold text-foreground truncate">
                                        {item.petName} — {item.title}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-secondary mt-0.5 truncate">
                                        {item.kind === 'medication'
                                            ? item.detail
                                            : <><CalendarDays className="w-3.5 h-3.5 shrink-0" />{item.date ? formatDateKeyTr(item.date, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</>}
                                    </span>
                                </span>
                                {badge && (
                                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap" style={badgeStyle(item.daysLeft, style.color)}>
                                        {badge}
                                    </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-secondary/50 shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
