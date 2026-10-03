'use client';

// Üst kart → Genel: günün notu, "Bugün" (su, mama, yürüyüş, sıradaki sağlık işi), bugünkü yürüyüş rotası,
// son fotoğraflar ve anılar. Su/mama kaydı petCareService (sunucu), yürüyüş ActivityContext + DailyProgressContext,
// sağlık useUpcomingCare (Sağlık Merkezi ile aynı hesap), albüm usePetAlbum.

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Droplet, Flame, Footprints, HeartPulse, Info, Lightbulb, Minus, PartyPopper, Plus, Timer, UtensilsCrossed } from 'lucide-react';
import { useWalk } from '@/hooks/useWalk';
import { useDailyProgress } from '@/context/DailyProgressContext';
import { usePetCare } from '@/hooks/usePetCare';
import { usePetAlbum } from '@/hooks/usePetAlbum';
import { petCareService } from '@/services/petCareService';
import { formatKm, formatMinutes } from '@/lib/walkMetrics';
import { daysLeftText } from '@/lib/health/derive';
import { haptics } from '@/native';
import { showToast } from '@/lib/utils';
import type { Pet } from '@/context/PetContext';
import type { CareItem } from '@/hooks/useUpcomingCare';
import type { DailyNote } from '../dailyNote';
import { SectionHeader } from '../homeUI';
import { MemoryStrip, PhotoStrip, albumPetOf } from './AlbumTab';

const WalkMap = dynamic(() => import('@/components/walk/WalkMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full animate-pulse bg-foreground/[0.06]" />,
});

const NOTE_STYLE: Record<DailyNote['tone'], { Icon: typeof Info; color: string }> = {
    alert: { Icon: AlertCircle, color: '#D9432F' },
    info: { Icon: Info, color: '#C9771F' },
    good: { Icon: PartyPopper, color: '#4E8A23' },
    tip: { Icon: Lightbulb, color: '#C9771F' },
};

const KIND_LABEL: Record<CareItem['kind'], string> = { vaccine: 'Aşı', parasite: 'Parazit', appointment: 'Randevu', medication: 'İlaç' };

function Tile({ label, value, tint, Icon, done, progress, onClick, href, busy }: {
    label: string; value: string; tint: string; Icon: typeof Droplet; done?: boolean; progress?: number;
    onClick?: () => void; href?: string; busy?: boolean;
}) {
    const body = (
        <>
            <span className="relative w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)` }}>
                <Icon className="w-[21px] h-[21px]" style={{ color: tint }} strokeWidth={2.3} />
                {done && (
                    <span className="absolute -right-1 -bottom-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-white" style={{ background: tint }}>
                        <Check className="w-3 h-3" strokeWidth={3.4} />
                    </span>
                )}
            </span>
            <span className="text-[12.5px] font-extrabold text-foreground leading-tight">{label}</span>
            {progress !== undefined && (
                <span className="w-full h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden">
                    <span className="block h-full rounded-full transition-all" style={{ width: `${Math.round(Math.min(1, progress) * 100)}%`, background: tint }} />
                </span>
            )}
            <span className="text-[11.5px] font-bold leading-tight text-center" style={{ color: done ? tint : 'var(--color-secondary)' }}>{value}</span>
        </>
    );
    const cls = `rounded-[20px] px-1.5 pt-3 pb-2.5 flex flex-col items-center gap-1.5 min-h-[128px] border transition-transform active:scale-95 ${busy ? 'opacity-60' : ''}`;
    const style = { background: `color-mix(in srgb, ${tint} 7%, var(--color-card))`, borderColor: `color-mix(in srgb, ${tint} 18%, transparent)` };
    return href
        ? <Link href={href} className={cls} style={style}>{body}</Link>
        : <button type="button" onClick={onClick} disabled={busy} className={cls} style={style}>{body}</button>;
}

export function GeneralTab({ pet, userId, today, note, careItems }: { pet: Pet; userId?: string; today: string; note: DailyNote; careItems: CareItem[] }) {
    const router = useRouter();
    const { history, activeSession } = useWalk();
    const { dailyGoal } = useDailyProgress();
    const { care, error: careError } = usePetCare(pet.id);
    const album = usePetAlbum(albumPetOf(pet), userId);
    const [busy, setBusy] = useState<'meal' | 'water' | null>(null);
    const [undo, setUndo] = useState<{ kind: 'meal' | 'water'; text: string } | null>(null);
    const [mealsOpen, setMealsOpen] = useState(false);
    const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

    // Bu hayvanın bugünkü yürüyüşleri (tamamlanan + şu anki).
    const { todayKm, lastWalk } = useMemo(() => {
        const mine = history.filter(w => w.petId === pet.id && w.started_at && new Date(w.started_at).toLocaleDateString('sv-SE') === today);
        const km = mine.reduce((t, w) => t + (w.distanceKm || 0), 0);
        const latest = [...mine].sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0] || null;
        return { todayKm: km, lastWalk: latest };
    }, [history, pet.id, today]);
    const walkingNow = activeSession && activeSession.petId === pet.id ? activeSession : null;
    const kmNow = todayKm + (walkingNow ? walkingNow.distanceKm : 0);
    const goal = Math.max(0.1, dailyGoal.distance);
    const nextCare = careItems.find(c => c.petId === pet.id && c.kind !== 'medication') || careItems.find(c => c.petId === pet.id) || null;

    const log = async (kind: 'meal' | 'water', undoing = false) => {
        if (busy) return;
        haptics.tap();
        setBusy(kind);
        try {
            const next = await petCareService.log(pet.id, kind, undoing);
            if (undoTimer.current) clearTimeout(undoTimer.current);
            if (undoing) { setUndo(null); return; }
            setUndo({ kind, text: kind === 'meal' ? `Öğün kaydedildi (${next.mealsGiven}/${next.mealsTarget})` : 'Taze su kaydedildi' });
            undoTimer.current = setTimeout(() => setUndo(null), 5000);
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Kaydedilemedi', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(null);
        }
    };

    const setMeals = async (n: number) => {
        haptics.tap();
        try { await petCareService.setMealsPerDay(pet.id, Math.min(6, Math.max(1, n))); }
        catch (e) { showToast(e instanceof Error ? e.message : 'Kaydedilemedi', 'AlertCircle', 'text-red-500 font-bold'); }
    };

    const noteStyle = NOTE_STYLE[note.tone];
    const noteBody = (
        <>
            <noteStyle.Icon className="w-[18px] h-[18px] shrink-0 mt-[1px]" style={{ color: noteStyle.color }} strokeWidth={2.4} />
            <span className="flex-1">{note.text}</span>
        </>
    );
    const noteCls = 'card-premium flex items-start gap-2.5 rounded-[18px] px-3.5 py-3 text-[13.5px] leading-snug font-semibold text-foreground';

    const mealsGiven = care?.mealsGiven ?? 0;
    const mealsTarget = care?.mealsTarget ?? 2;
    const waterDone = !!care?.waterRefreshedAt;

    return (
        <div className="space-y-6">
            {note.href ? <Link href={note.href} className={noteCls}>{noteBody}</Link> : <div className={noteCls}>{noteBody}</div>}

            <section>
                <SectionHeader title="Bugün" actionLabel={mealsOpen ? 'Bitti' : 'Öğün ayarı'} onAction={() => setMealsOpen(o => !o)} />
                {mealsOpen && (
                    <div className="mb-3 card-premium rounded-[18px] px-4 py-3 flex items-center gap-3">
                        <span className="flex-1 text-[13.5px] font-bold text-foreground">Günlük öğün sayısı</span>
                        <button type="button" aria-label="Azalt" onClick={() => setMeals(mealsTarget - 1)} disabled={mealsTarget <= 1}
                            className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center disabled:opacity-40"><Minus className="w-4 h-4" /></button>
                        <span className="w-6 text-center text-[17px] font-extrabold tabular-nums">{mealsTarget}</span>
                        <button type="button" aria-label="Artır" onClick={() => setMeals(mealsTarget + 1)} disabled={mealsTarget >= 6}
                            className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center disabled:opacity-40"><Plus className="w-4 h-4" /></button>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                    <Tile label="Su" Icon={Droplet} tint="#2F9E8F" done={waterDone} busy={busy === 'water' || !care}
                        value={careError ? 'Okunamadı' : waterDone ? 'Tazelendi' : 'Tazele'} onClick={() => log('water', waterDone)} />
                    <Tile label="Mama" Icon={UtensilsCrossed} tint="#E0892E" done={mealsGiven >= mealsTarget} busy={busy === 'meal' || !care}
                        progress={mealsGiven / mealsTarget} value={careError ? 'Okunamadı' : `${mealsGiven}/${mealsTarget} öğün`} onClick={() => log('meal')} />
                    <Tile label="Yürüyüş" Icon={Footprints} tint="#5E9A2E" done={kmNow >= goal} progress={kmNow / goal}
                        value={`${formatKm(kmNow, 1)} / ${formatKm(goal, 1)} km`}
                        onClick={() => { haptics.tap(); if (walkingNow) router.push('/walk/tracking'); else window.dispatchEvent(new CustomEvent('open-walk-panel')); }} />
                    {nextCare ? (
                        <Tile label={KIND_LABEL[nextCare.kind]} Icon={HeartPulse} tint="#D9432F" href={nextCare.href}
                            value={nextCare.daysLeft === null ? nextCare.title : daysLeftText(nextCare.daysLeft)} />
                    ) : (
                        <Tile label="Sağlık" Icon={HeartPulse} tint="#D9432F" href="/health" done value="Her şey yolunda" />
                    )}
                </div>
                {undo && (
                    <div role="status" className="mt-3 flex items-center gap-3 rounded-[16px] bg-foreground text-background px-4 py-2.5">
                        <Check className="w-4 h-4 shrink-0" strokeWidth={3} />
                        <span className="flex-1 text-[13px] font-bold">{undo.text}</span>
                        <button type="button" onClick={() => log(undo.kind, true)} className="text-[13px] font-extrabold text-accent">Geri al</button>
                    </div>
                )}
            </section>

            <section>
                <SectionHeader title="Günlük yürüyüş rotası" href="/walk/history" actionLabel="Geçmiş" />
                {walkingNow ? (
                    <Link href="/walk/tracking" className="card-premium rounded-[22px] p-4 flex items-center gap-3">
                        <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full rounded-full bg-accent/60 animate-ping" /><span className="relative inline-flex h-3 w-3 rounded-full bg-accent" /></span>
                        <span className="flex-1 text-[14.5px] font-bold text-foreground">{pet.name} şu an yürüyüşte · {formatKm(walkingNow.distanceKm, 2)} km</span>
                        <span className="text-[13px] font-bold text-accent">Aç</span>
                    </Link>
                ) : lastWalk ? (
                    <Link href={`/walk/history/${lastWalk.id}`} className="block card-premium rounded-[22px] overflow-hidden">
                        <div className="h-[150px] pointer-events-none">
                            {lastWalk.path.length > 1
                                ? <WalkMap path={lastWalk.path} fitPath={lastWalk.path} mode="static" showRecenter={false} petImage={pet.image || pet.avatar || null} />
                                : <div className="w-full h-full flex items-center justify-center bg-[#E9EFE2] text-3xl">🐾</div>}
                        </div>
                        <div className="grid grid-cols-3 px-3 py-3">
                            <WalkStat Icon={Footprints} value={`${formatKm(lastWalk.distanceKm, 2)} km`} label="Yürüyüş" color="#5E9A2E" />
                            <WalkStat Icon={Timer} value={formatMinutes(lastWalk.activeSeconds / 60)} label="Süre" color="#6F675B" />
                            <WalkStat Icon={Flame} value={`${lastWalk.calories || 0} kcal`} label="Kalori" color="#E0892E" />
                        </div>
                    </Link>
                ) : (
                    <div className="card-premium rounded-[22px] p-4 flex items-center gap-3">
                        <span className="w-11 h-11 rounded-full bg-[#5E9A2E]/12 flex items-center justify-center shrink-0"><Footprints className="w-5 h-5 text-[#5E9A2E]" /></span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-[14.5px] font-bold text-foreground">Bugün henüz yürümedi</span>
                            <span className="block text-[12.5px] font-semibold text-secondary">Rota ve ölçüler yürüyüşten sonra burada.</span>
                        </span>
                        <button type="button" onClick={() => { haptics.tap(); window.dispatchEvent(new CustomEvent('open-walk-panel')); }}
                            className="h-10 px-4 rounded-full bg-accent text-white text-[13px] font-extrabold shrink-0 active:scale-95 transition-transform">Başla</button>
                    </div>
                )}
            </section>

            <PhotoStrip album={album} />
            <MemoryStrip album={album} />
        </div>
    );
}

function WalkStat({ Icon, value, label, color }: { Icon: typeof Flame; value: string; label: string; color: string }) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 shrink-0" style={{ color }} strokeWidth={2.2} />
            <span className="min-w-0">
                <span className="block text-[14.5px] font-extrabold text-foreground leading-tight truncate">{value}</span>
                <span className="block text-[11.5px] font-semibold text-secondary">{label}</span>
            </span>
        </div>
    );
}
