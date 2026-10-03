'use client';

// E7 · Günün Bilgisi (design-reference/quests-final/): kısa, görsel, eğitici kartlar. Üstte bugünün ve son günlerin
// bilgileri (kaydırılabilir), altta "Son Bilgiler". İçerik hayvanın türüne göre (lessons_feed), kaynaklı.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { questService, QUESTS_CHANGED, type LessonCard } from '@/services/questService';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { PetPhoto, QuestCard, QuestHeader, Tile } from '@/components/quests/QuestUI';
import { cn } from '@/lib/utils';

export default function DailyTipsPage() {
    const { activePet } = usePet();
    const petId = activePet?.id ?? null;
    const [state, setState] = useState<{ petId: string | null; featured: LessonCard[]; recent: LessonCard[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [slide, setSlide] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const scroller = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let alive = true;
        const load = () => questService.lessonsFeed(petId)
            .then(r => alive && setState({ petId, featured: r.featured ?? [], recent: r.recent ?? [] }))
            .catch(e => alive && setError(e instanceof Error ? e.message : 'Bilgiler yüklenemedi.'));
        void load();
        window.addEventListener(QUESTS_CHANGED, load);
        return () => { alive = false; window.removeEventListener(QUESTS_CHANGED, load); };
    }, [petId]);

    const data = state && state.petId === petId ? state : null;
    const recent = data ? (showAll ? data.recent : data.recent.slice(0, 4)) : [];

    return (
        <>
            <QuestHeader title="Günün Bilgisi" icon="💡" />
            <div className="space-y-5">
                {error && !data && <p className="px-4 text-sm font-semibold text-red-600">{error}</p>}
                {!data ? <div className="px-4"><LoadingBlocks count={3} /></div> : data.featured.length === 0 ? (
                    <p className="px-4 text-center text-[14px] font-semibold text-secondary py-10">Bilgi kartları hazırlanıyor.</p>
                ) : (
                    <>
                        <div>
                            <div ref={scroller} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4"
                                onScroll={e => {
                                    const el = e.currentTarget;
                                    setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.88)));
                                }}>
                                {data.featured.map((l, i) => (
                                    <Link key={l.id} href={`/quests/bilgi/${l.id}`} className="snap-center shrink-0 w-[88%] relative rounded-[28px] overflow-hidden min-h-[190px] flex" style={{ background: l.tint }}>
                                        <div className="relative z-10 flex-1 p-5 flex flex-col justify-between max-w-[62%]">
                                            <div>
                                                {i === 0 && <span className="inline-block text-[11px] font-black uppercase tracking-wide text-accent mb-1">Bugün</span>}
                                                <p className="text-[17px] font-extrabold leading-snug text-[#201B16]">{l.title}</p>
                                            </div>
                                            <span className="self-start mt-3 h-9 px-4 rounded-full bg-white text-[#201B16] text-[13px] font-black inline-flex items-center gap-1 shadow-sm">
                                                {l.read ? 'Tekrar oku' : 'Detayı oku'} →
                                            </span>
                                        </div>
                                        <div className="absolute right-0 inset-y-0 w-[42%]">
                                            {i === 0 && activePet?.image
                                                ? <PetPhoto url={activePet.image} species={activePet.type} className="w-full h-full" />
                                                : <div className="w-full h-full flex items-center justify-center text-[64px]" aria-hidden>{l.emoji}</div>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
                                {data.featured.map((l, i) => <span key={l.id} className={cn('h-2 rounded-full transition-all', i === slide ? 'w-5 bg-accent' : 'w-2 bg-black/15 dark:bg-white/20')} />)}
                            </div>
                        </div>

                        <div className="px-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-[16px] font-extrabold">Son Bilgiler</h2>
                                {data.recent.length > 4 && (
                                    <button type="button" onClick={() => setShowAll(s => !s)} className="text-[13px] font-bold text-secondary">{showAll ? 'Daha az' : 'Tümünü gör'}</button>
                                )}
                            </div>
                            <div className="space-y-2.5">
                                {recent.map(l => (
                                    <QuestCard key={l.id} href={`/quests/bilgi/${l.id}`} className="p-2.5 flex items-center gap-3">
                                        <Tile emoji={l.emoji} tint={l.tint} className="w-16 h-16" size="sm" />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[14.5px] font-extrabold leading-snug">{l.title}</span>
                                            <span className="mt-1 text-[12px] font-semibold text-secondary inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />{l.read_minutes} dk okuma{l.read ? ' · ✓ okundu' : ''}
                                            </span>
                                        </span>
                                    </QuestCard>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
