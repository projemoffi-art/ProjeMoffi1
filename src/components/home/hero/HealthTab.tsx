'use client';

// Üst kart → Sağlık: Sağlık Merkezi'nin aynı karnesinden (usePetHealthBundle + lib/health/derive) özet.
// Genel durum, yaklaşan işler, bugünkü ilaç dozları (dokununca verildi), kilo, alerji/kritik not, son muayene.
// Yeni hesap yazılmaz; her satır ilgili sağlık ekranına gider.

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, CalendarClock, Check, ChevronRight, HeartPulse, Pill, Scale, Stethoscope, Syringe } from 'lucide-react';
import { usePetHealthBundle } from '@/components/health/usePetHealthBundle';
import { healthService } from '@/services/healthService';
import { daysLeftText, formatKg, lastCheckupDate, overallStatus, speciesOf, todayDoseSlots, weightSummary, type DoseSlot } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { haptics } from '@/native';
import { showToast } from '@/lib/utils';
import type { Pet } from '@/context/PetContext';
import type { CareItem } from '@/hooks/useUpcomingCare';
import { Skeleton } from '../homeUI';

const TONE = {
    good: { color: '#4E8A23', bg: 'color-mix(in srgb, #4E8A23 10%, var(--color-card))' },
    attention: { color: '#C9771F', bg: 'color-mix(in srgb, #C9771F 10%, var(--color-card))' },
    overdue: { color: '#D9432F', bg: 'color-mix(in srgb, #D9432F 10%, var(--color-card))' },
};

const KIND_ICON: Record<CareItem['kind'], typeof Syringe> = { vaccine: Syringe, parasite: HeartPulse, appointment: CalendarClock, medication: Pill };

function Row({ href, Icon, title, sub, tint = 'var(--color-accent)' }: { href: string; Icon: typeof Syringe; title: string; sub: string; tint?: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 active:bg-foreground/[0.04]">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${tint} 12%, transparent)` }}>
                <Icon className="w-[18px] h-[18px]" style={{ color: tint }} strokeWidth={2.2} />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-bold text-foreground truncate">{title}</span>
                <span className="block text-[12px] font-semibold text-secondary truncate">{sub}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-secondary/60 shrink-0" />
        </Link>
    );
}

export function HealthTab({ pet, today, careItems }: { pet: Pet; today: string; careItems: CareItem[] }) {
    const bundle = usePetHealthBundle(pet);
    const [pending, setPending] = useState<string | null>(null);

    if (!bundle) {
        return <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-40" /></div>;
    }

    const status = overallStatus(bundle, today);
    const tone = TONE[status.tone];
    const upcoming = careItems.filter(c => c.petId === pet.id && c.kind !== 'medication').slice(0, 3);
    const doses = todayDoseSlots(bundle, today);
    const weight = weightSummary(bundle.weights, today);
    const lastVisit = lastCheckupDate(bundle);
    const profile = bundle.profile;
    const alerts = [...(profile?.allergies || []), ...(profile?.chronicConditions || [])];

    const toggleDose = async (d: DoseSlot) => {
        const key = `${d.medication.id}|${d.slot}`;
        if (pending) return;
        haptics.tap();
        setPending(key);
        try {
            if (d.given) await healthService.unlogDose(d.medication.id, today, d.slot);
            else await healthService.logDose(d.medication.id, pet.id, today, d.slot);
            await healthService.loadBundle(pet.id, speciesOf(pet), true);
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Kaydedilemedi', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setPending(null);
        }
    };

    return (
        <div className="space-y-4">
            <Link href="/health" className="flex items-center gap-3 rounded-[20px] px-4 py-3.5 border" style={{ background: tone.bg, borderColor: `color-mix(in srgb, ${tone.color} 22%, transparent)` }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: tone.color }}>
                    {status.tone === 'good' ? <Check className="w-5 h-5" strokeWidth={3} /> : <AlertTriangle className="w-5 h-5" strokeWidth={2.4} />}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-extrabold" style={{ color: tone.color }}>{status.title}</span>
                    <span className="block text-[12.5px] font-semibold text-secondary">Sağlık Merkezi&apos;nde ayrıntılar</span>
                </span>
                <ChevronRight className="w-4 h-4 text-secondary/70" />
            </Link>

            {doses.length > 0 && (
                <section>
                    <h3 className="text-[13px] font-extrabold text-secondary mb-2 px-1">Bugünkü ilaçlar</h3>
                    <div className="card-premium rounded-[20px] divide-y divide-card-border overflow-hidden">
                        {doses.map(d => {
                            const key = `${d.medication.id}|${d.slot}`;
                            return (
                                <button key={key} type="button" onClick={() => toggleDose(d)} disabled={pending === key} aria-pressed={d.given}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-foreground/[0.04] disabled:opacity-60">
                                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${d.given ? 'bg-[#4E8A23] border-[#4E8A23] text-white' : 'border-card-border'}`}>
                                        {d.given && <Check className="w-4 h-4" strokeWidth={3} />}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className={`block text-[14px] font-bold truncate ${d.given ? 'text-secondary line-through' : 'text-foreground'}`}>{d.medication.name}</span>
                                        <span className="block text-[12px] font-semibold text-secondary">{d.slot}{d.medication.dosage ? ` · ${d.medication.dosage}` : ''}</span>
                                    </span>
                                    <span className="text-[12px] font-bold" style={{ color: d.given ? '#4E8A23' : 'var(--color-secondary)' }}>{d.given ? 'Verildi' : 'Ver'}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            <section>
                <h3 className="text-[13px] font-extrabold text-secondary mb-2 px-1">Yaklaşan</h3>
                <div className="card-premium rounded-[20px] divide-y divide-card-border overflow-hidden">
                    {upcoming.length === 0 ? (
                        <Row href="/health/asilar" Icon={Syringe} title="Yaklaşan iş yok" sub="Aşı ve parazit takvimini gör" tint="#4E8A23" />
                    ) : upcoming.map(c => (
                        <Row key={c.id} href={c.href} Icon={KIND_ICON[c.kind]} title={c.title}
                            sub={c.daysLeft === null ? (c.detail || '') : `${daysLeftText(c.daysLeft)}${c.date ? ` · ${formatDateKeyTr(c.date, { day: 'numeric', month: 'long' })}` : ''}`}
                            tint={c.daysLeft !== null && c.daysLeft < 0 ? '#D9432F' : '#C9771F'} />
                    ))}
                </div>
            </section>

            <div className="card-premium rounded-[20px] divide-y divide-card-border overflow-hidden">
                <Row href="/health/kilo" Icon={Scale} tint="#5E9A2E"
                    title={weight.latest ? `${formatKg(weight.latest.weightKg)} kg` : 'Kilo kaydı yok'}
                    sub={weight.latest
                        ? (weight.change !== null ? `${weight.change > 0 ? '+' : ''}${formatKg(weight.change)} kg · ${formatDateKeyTr(weight.latest.measuredOn, { day: 'numeric', month: 'long' })} ölçümü` : `${formatDateKeyTr(weight.latest.measuredOn, { day: 'numeric', month: 'long' })} ölçümü`)
                        : 'Tartıp kaydet, değişimi takip et'} />
                <Row href="/health/acil" Icon={AlertTriangle} tint="#D9432F"
                    title={alerts.length ? alerts.slice(0, 3).join(', ') : 'Alerji ve kritik not'}
                    sub={alerts.length ? 'Alerji / kronik durum' : profile?.notes ? profile.notes : 'Henüz eklenmedi'} />
                <Row href="/health/muayeneler" Icon={Stethoscope} tint="#6F675B"
                    title={lastVisit ? `Son muayene: ${formatDateKeyTr(lastVisit, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Muayene kaydı yok'}
                    sub="Muayeneler ve veteriner notları" />
            </div>

            <Link href="/health" className="h-12 rounded-2xl bg-accent text-white text-[14.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <HeartPulse className="w-5 h-5" /> Sağlık Merkezi
            </Link>
        </div>
    );
}
