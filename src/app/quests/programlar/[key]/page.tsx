'use client';

// E4 · Program detayı: gün gün yol, bugünkü adım, ilerleme ve bitiş ödülü. Günde bir adım (sunucu denetler).
// Referans setinde yoktu; E3 ve E2'nin görsel diliyle kuruldu.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Lock } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { questService, QUESTS_CHANGED, type ProgramDetail } from '@/services/questService';
import { BALANCE_CHANGED } from '@/context/DailyProgressContext';
import { celebrate } from '@/components/quests/QuestCelebration';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { CoralButton, ProgressLine, QuestCard, QuestHeader, Tile } from '@/components/quests/QuestUI';
import { cn, showToast } from '@/lib/utils';

export default function ProgramDetailPage() {
    const { key } = useParams<{ key: string }>();
    const { activePet } = usePet();
    const petId = activePet?.id ?? null;
    const [state, setState] = useState<{ id: string; p: ProgramDetail } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [openStep, setOpenStep] = useState<number | null>(null);

    useEffect(() => {
        if (!petId || !key) return;
        let alive = true;
        const load = () => questService.program(petId, key)
            .then(p => alive && setState({ id: `${petId}:${key}`, p }))
            .catch(e => alive && setError(e instanceof Error ? e.message : 'Program yüklenemedi.'));
        void load();
        window.addEventListener(QUESTS_CHANGED, load);
        return () => { alive = false; window.removeEventListener(QUESTS_CHANGED, load); };
    }, [petId, key]);

    const p = state && state.id === `${petId}:${key}` ? state.p : null;
    const active = p?.status === 'active';
    const current = p ? p.steps.find(s => s.current) ?? null : null;
    // Varsayılan: bugün adım yapıldıysa o adım, yapılmadıysa sıradaki.
    const shownStep = p ? p.steps[openStep ?? (p.today_done || !current ? Math.max(0, p.steps_done - 1) : current.index)] : null;

    const act = async (fn: () => Promise<unknown>, fallback: string) => {
        setBusy(true);
        try { await fn(); }
        catch (e) { showToast(e instanceof Error ? e.message : fallback, 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    const completeStep = () => act(async () => {
        if (!petId || !p) return;
        const r = await questService.completeProgramStep(petId, p.key);
        window.dispatchEvent(new Event(BALANCE_CHANGED));
        celebrate({
            awarded: [{ kind: r.completed ? 'program' : 'quest', label: r.completed ? `${p.title} tamamlandı` : `${p.title} · ${r.steps_done}. gün`,
                pawcoin: r.final_pawcoin, xp: r.xp + r.final_xp }],
            badges: [], levelUp: null, petName: activePet?.name ?? '',
        });
        setOpenStep(null);
    }, 'Adım kaydedilemedi.');

    return (
        <>
            <QuestHeader title={p?.title ?? 'Program'} fallback="/quests/programlar" subtitle={p?.subtitle} />
            <div className="px-4 space-y-4">
                {error && !p && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!p ? <LoadingBlocks count={3} /> : (
                    <>
                        <QuestCard className="p-4 flex gap-4 items-center">
                            <Tile emoji={p.emoji} tint={p.tint} className="w-20 h-20" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-secondary leading-snug">{p.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <ProgressLine value={p.steps_done} max={p.total} tone="green" className="flex-1 h-2.5" />
                                    <span className="text-[12px] font-black tabular-nums">{p.steps_done}/{p.total}</span>
                                </div>
                            </div>
                        </QuestCard>

                        {/* Gün yolu */}
                        <div className="grid grid-cols-7 gap-2">
                            {p.steps.map(s => (
                                <button key={s.index} type="button" onClick={() => setOpenStep(s.index)} aria-label={`${s.index + 1}. gün: ${s.title}`}
                                    className={cn('aspect-square rounded-full flex items-center justify-center text-[13px] font-black border-2 transition-transform active:scale-95',
                                        s.done ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : s.current && active ? 'bg-accent border-accent text-white shadow-[0_6px_14px_-6px_rgba(238,91,61,0.9)]'
                                                : 'bg-card border-card-border text-secondary',
                                        shownStep?.index === s.index && 'ring-2 ring-offset-2 ring-offset-background ring-accent/50')}>
                                    {s.done ? <Check className="w-4 h-4" /> : s.index > p.steps_done ? <Lock className="w-3.5 h-3.5 opacity-60" /> : s.index + 1}
                                </button>
                            ))}
                        </div>

                        {shownStep && (
                            <QuestCard className="p-4">
                                <span className="text-[12px] font-black text-accent">{shownStep.index + 1}. gün</span>
                                <h2 className="text-[18px] font-extrabold mt-0.5">{shownStep.title}</h2>
                                {shownStep.index <= p.steps_done ? (
                                    <>
                                        <p className="text-[14.5px] font-semibold text-secondary leading-relaxed mt-1.5">{shownStep.body}</p>
                                        {shownStep.tip && <p className="mt-3 rounded-2xl bg-accent/5 border border-accent/15 p-3 text-[13px] font-semibold">💡 {shownStep.tip}</p>}
                                    </>
                                ) : <p className="text-[13.5px] font-semibold text-secondary mt-1.5">Bu adım, önceki günler tamamlanınca açılır.</p>}
                            </QuestCard>
                        )}

                        {p.status === 'done' ? (
                            <QuestCard className="p-4 text-center">
                                <div className="text-3xl" aria-hidden>{p.badge?.icon ?? '🎓'}</div>
                                <p className="text-[15px] font-extrabold mt-1">Programı tamamladın!</p>
                                <p className="text-[12.5px] font-semibold text-secondary">{p.badge ? `"${p.badge.title}" rozeti rozet kasanda.` : ''}</p>
                            </QuestCard>
                        ) : !active ? (
                            <div className="space-y-2">
                                {p.other_active && <p className="text-[12.5px] font-semibold text-secondary">Şu an aktif programın: {p.other_active.title}. Yeni programa geçmek için onu bırakmalısın.</p>}
                                <CoralButton disabled={busy || !!p.other_active} onClick={() => act(() => questService.startProgram(petId!, p.key), 'Program başlatılamadı.')}>
                                    {p.status === 'left' ? 'Kaldığın yerden devam et' : 'Programa başla'}
                                </CoralButton>
                                <p className="text-[12px] font-semibold text-secondary text-center">
                                    Bitirince +{p.pawcoin} PawCoin, +{p.xp} XP{p.badge ? ` ve "${p.badge.title}" rozeti` : ''}. Her adım +20 XP.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <CoralButton disabled={busy || !!p.today_done || !current} onClick={completeStep}
                                    sub={p.today_done ? 'Yarın yeni adım açılacak' : undefined}>
                                    {p.today_done ? 'Bugünün adımı tamam ✓' : `${(current?.index ?? 0) + 1}. günü tamamladım`}
                                </CoralButton>
                                <button type="button" disabled={busy} onClick={() => act(() => questService.leaveProgram(petId!, p.key), 'Program bırakılamadı.')}
                                    className="w-full h-10 text-[13px] font-bold text-secondary">Programı bırak (ilerleme saklanır)</button>
                            </div>
                        )}
                        {!p.vet_reviewed && (
                            <p className="text-[11.5px] font-semibold text-secondary">Bu içerik genel bilgilendirme amaçlıdır; hayvanına özel durumlar için veterinerine danış.</p>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
