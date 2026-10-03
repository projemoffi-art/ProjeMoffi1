'use client';

// E2 · Aylık Macera (design-reference/quests-final/): ayın teması, bölümler arasında yol, bu ay kazanılanlar,
// her bölümün gerçek ilerlemesi. Bölüm ödülü ve ay sonu rozeti sunucuda verilir (quest_adventure).

import { useEffect, useRef, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { questService, QUESTS_CHANGED, type Adventure } from '@/services/questService';
import { BALANCE_CHANGED } from '@/context/DailyProgressContext';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { celebrate } from '@/components/quests/QuestCelebration';
import { CoralButton, Medallion, PetPhoto, ProgressLine, QuestCard, QuestHeader } from '@/components/quests/QuestUI';
import { cn } from '@/lib/utils';

export default function AdventurePage() {
    const { activePet } = usePet();
    const petId = activePet?.id ?? null;
    const [state, setState] = useState<{ petId: string; current: Adventure | null; past: { month: string; title: string; icon: string; earned: boolean }[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!petId) return;
        let alive = true;
        const load = () => questService.adventure(petId).then(r => {
            if (!alive) return;
            setState({ petId, ...r });
            if (r.current?.awarded.length) {
                window.dispatchEvent(new Event(BALANCE_CHANGED));
                celebrate({ awarded: r.current.awarded.map(a => ({ ...a, kind: 'adventure' as const })), badges: [], levelUp: null, petName: activePet?.name ?? '' });
            }
        }).catch(e => alive && setError(e instanceof Error ? e.message : 'Macera yüklenemedi.'));
        void load();
        window.addEventListener(QUESTS_CHANGED, load);
        return () => { alive = false; window.removeEventListener(QUESTS_CHANGED, load); };
    }, [petId, activePet?.name]);

    const data = state && state.petId === petId ? state : null;
    const adv = data?.current ?? null;
    const stage = adv ? adv.stages[Math.min(adv.current_stage, adv.stages.length - 1)] : null;
    const stageDone = stage ? stage.goals.filter(g => g.progress >= g.target).length : 0;

    return (
        <>
            <QuestHeader title="Aylık Macera" icon="📅" subtitle={<>Her ay yeni bir macera,<br />her adımda daha fazla keşif. ✨</>} />
            <div className="px-4 space-y-4">
                {error && !data && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!data ? <LoadingBlocks count={3} /> : !adv ? (
                    <QuestCard className="p-6 text-center">
                        <div className="text-4xl mb-2" aria-hidden>🗺️</div>
                        <p className="text-[15px] font-extrabold">Bu ayın macerası hazırlanıyor</p>
                        <p className="text-[13px] font-semibold text-secondary mt-1">Yeni macera yayınlanınca burada görünecek.</p>
                    </QuestCard>
                ) : (
                    <>
                        {/* Kapak + bu ayki hedef */}
                        <div className="relative rounded-[28px] overflow-hidden">
                            <PetPhoto url={activePet?.image} species={activePet?.type} className="w-full h-56" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <span className="absolute top-3 left-3 h-8 px-3 rounded-full bg-white/90 text-[#201B16] text-[12.5px] font-black inline-flex items-center gap-1.5">
                                {adv.emoji} {adv.title}
                            </span>
                        </div>
                        <QuestCard className="p-4 -mt-12 relative mx-2">
                            <span className="absolute -top-4 right-4 text-3xl" aria-hidden>🎁</span>
                            <span className="block text-[12px] font-bold text-secondary">Bu ayki hedef</span>
                            <span className="block text-[18px] font-extrabold">{stage ? `${stage.emoji} ${stage.title}` : adv.title}</span>
                            <div className="flex items-center gap-3 mt-2">
                                <ProgressLine value={adv.completed ? 1 : stageDone} max={adv.completed ? 1 : (stage?.goals.length || 1)} tone="coral" className="flex-1" />
                                <span className="text-[12.5px] font-black whitespace-nowrap">
                                    {adv.completed ? 'Tamamlandı' : `Bölüm ${adv.current_stage + 1}/${adv.stages.length}`}
                                </span>
                            </div>
                            <span className="block text-[12px] font-semibold text-secondary mt-1.5">{adv.days_left} gün kaldı · {adv.subtitle}</span>
                        </QuestCard>

                        {/* Bölümler arası yol */}
                        <div className="flex items-center justify-between px-2">
                            {adv.stages.map((s, i) => (
                                <div key={s.index} className="flex items-center flex-1 last:flex-none">
                                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-xl border-[3px] shrink-0',
                                        s.done ? 'bg-emerald-50 border-emerald-500' : s.unlocked ? 'bg-card border-accent' : 'bg-black/[0.04] border-card-border')}>
                                        {s.done ? <Check className="w-5 h-5 text-emerald-600" /> : s.unlocked ? <span aria-hidden>{s.emoji}</span> : <Lock className="w-4 h-4 text-secondary" />}
                                    </div>
                                    {i < adv.stages.length - 1 && <div className={cn('h-1 flex-1 mx-1 rounded-full', s.done ? 'bg-emerald-500' : 'bg-card-border')} />}
                                </div>
                            ))}
                            <div className="ml-1"><Medallion icon={adv.badge.icon} earned={adv.badge.earned} size={48} /></div>
                        </div>

                        {/* Bu ay kazandıkların */}
                        <div>
                            <h2 className="text-[16px] font-extrabold mb-2">Bu ay kazandıkların</h2>
                            <div className="grid grid-cols-3 gap-2">
                                <QuestCard className="p-3 text-center">
                                    <div className="text-2xl" aria-hidden>🪙</div>
                                    <div className="text-[17px] font-black">{adv.month_pawcoin}</div>
                                    <div className="text-[11px] font-semibold text-secondary">PawCoin</div>
                                </QuestCard>
                                <QuestCard className="p-3 text-center">
                                    <div className="text-2xl" aria-hidden>{adv.month_badges[0]?.icon ?? '🏅'}</div>
                                    <div className="text-[17px] font-black">{adv.month_badges.length}</div>
                                    <div className="text-[11px] font-semibold text-secondary">Rozet</div>
                                </QuestCard>
                                <QuestCard className="p-3 text-center">
                                    <div className="text-2xl" aria-hidden>{adv.badge.icon}</div>
                                    <div className="text-[12.5px] font-black leading-tight">{adv.badge.title}</div>
                                    <div className="text-[11px] font-semibold text-secondary">{adv.badge.earned ? 'Kazanıldı' : 'Ay sonu rozeti'}</div>
                                </QuestCard>
                            </div>
                        </div>

                        <CoralButton onClick={() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Macera detayını gör →</CoralButton>

                        {/* Bölüm ayrıntısı */}
                        <div ref={detailRef} className="space-y-3 pt-2 scroll-mt-4">
                            <p className="text-[14px] font-semibold text-secondary leading-relaxed">{adv.story}</p>
                            {adv.stages.map(s => (
                                <QuestCard key={s.index} className={cn('p-4', !s.unlocked && 'opacity-70')}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl" aria-hidden>{s.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-[15px] font-extrabold">{s.index + 1}. {s.title}</h3>
                                                <span className={cn('text-[11.5px] font-black px-2 py-0.5 rounded-full whitespace-nowrap',
                                                    s.claimed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-accent/10 text-accent')}>
                                                    {s.claimed ? '✓ Alındı' : s.pawcoin > 0 ? `+${s.pawcoin} PawCoin` : `+${s.xp} XP`}
                                                </span>
                                            </div>
                                            <p className="text-[12.5px] font-semibold text-secondary mt-0.5">{s.unlocked ? s.story : 'Önceki bölümü bitirince açılır.'}</p>
                                            <div className="mt-2.5 space-y-2">
                                                {s.goals.map(g => (
                                                    <div key={g.label}>
                                                        <div className="flex justify-between text-[12.5px] font-bold mb-1">
                                                            <span>{g.label}</span>
                                                            <span className="tabular-nums">{Math.min(g.progress, g.target).toLocaleString('tr-TR')}/{g.target.toLocaleString('tr-TR')}</span>
                                                        </div>
                                                        <ProgressLine value={g.progress} max={g.target} tone={g.progress >= g.target ? 'green' : 'coral'} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </QuestCard>
                            ))}
                            <p className="text-[12px] font-semibold text-secondary">
                                Ayın tüm bölümlerini bitirirsen {adv.final_pawcoin > 0 ? `+${adv.final_pawcoin} PawCoin ve ` : ''}yalnızca bu aya özel &quot;{adv.badge.title}&quot; rozeti.
                                {adv.stages.some(s => s.pawcoin === 0 && !s.claimed) && " Maceranın PawCoin'u hesap başına ayda bir kez; bu bölümler bu dostuna XP kazandırır."}
                            </p>
                        </div>

                        {data.past.length > 0 && (
                            <div>
                                <h2 className="text-[16px] font-extrabold mb-2">Geçmiş maceralar</h2>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                    {data.past.map(p => (
                                        <div key={p.month} className="flex flex-col items-center w-20 shrink-0">
                                            <Medallion icon={p.icon} earned={p.earned} size={56} />
                                            <span className="text-[11px] font-bold text-center mt-1 leading-tight">{p.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
