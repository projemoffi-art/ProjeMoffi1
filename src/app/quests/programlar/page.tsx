'use client';

// E3 · Programlar (design-reference/quests-final/): hayvana uygun, çok günlü öğretici yollar.
// "Popüler" sekmesi yerine "Tümü": gerçek bir popülerlik verisi olmadan sıralama uydurulmaz.

import { useEffect, useState } from 'react';
import { usePet } from '@/context/PetContext';
import { questService, QUESTS_CHANGED, type ProgramCard } from '@/services/questService';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { PillTabs, QuestCard, QuestHeader, Tile } from '@/components/quests/QuestUI';

type Tab = 'sana' | 'tumu' | 'egitim' | 'saglik';

export default function ProgramsPage() {
    const { activePet } = usePet();
    const petId = activePet?.id ?? null;
    const [tab, setTab] = useState<Tab>('sana');
    const [state, setState] = useState<{ petId: string; list: ProgramCard[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!petId) return;
        let alive = true;
        const load = () => questService.programs(petId)
            .then(list => alive && setState({ petId, list }))
            .catch(e => alive && setError(e instanceof Error ? e.message : 'Programlar yüklenemedi.'));
        void load();
        window.addEventListener(QUESTS_CHANGED, load);
        return () => { alive = false; window.removeEventListener(QUESTS_CHANGED, load); };
    }, [petId]);

    const list = state && state.petId === petId ? state.list : null;
    const shown = (list ?? []).filter(p =>
        tab === 'tumu' ? true
            : tab === 'sana' ? p.status === 'active' || p.for_you || p.tags.includes('yeni')
                : p.tags.includes(tab));

    return (
        <>
            <QuestHeader title="Programlar" subtitle={<>{activePet ? `${activePet.name} için` : 'Dostun için'} en uygun programı seç.<br />Düzenli alışkanlıklar, mutlu patiler. 💛</>} />
            <PillTabs<Tab> value={tab} onChange={setTab} tabs={[
                { id: 'sana', label: 'Senin İçin' }, { id: 'tumu', label: 'Tümü' }, { id: 'egitim', label: 'Eğitim' }, { id: 'saglik', label: 'Sağlık' },
            ]} />
            <div className="px-4 pt-3 space-y-3">
                {error && !list && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!list ? <LoadingBlocks count={4} /> : shown.length === 0 ? (
                    <p className="text-center text-[14px] font-semibold text-secondary py-10">Bu başlıkta şimdilik program yok.</p>
                ) : shown.map(p => (
                    <QuestCard key={p.key} href={`/quests/programlar/${p.key}`} className="p-3 flex gap-3 items-stretch">
                        <Tile emoji={p.emoji} tint={p.tint} className="w-28 h-28" size="lg" />
                        <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-[16px] font-extrabold leading-snug">{p.title}</span>
                            <span className="text-[12.5px] font-semibold text-secondary mt-0.5 line-clamp-2">{p.subtitle}</span>
                            <div className="mt-auto flex items-center justify-between pt-2">
                                <span className="text-[12.5px] font-black">{p.days} gün</span>
                                {p.status === 'active' ? (
                                    <span className="h-7 px-3 rounded-full bg-emerald-500 text-white text-[12px] font-black inline-flex items-center">Aktif · {p.steps_done}/{p.days}</span>
                                ) : p.status === 'done' ? (
                                    <span className="h-7 px-3 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 text-[12px] font-black inline-flex items-center">Tamamlandı ✓</span>
                                ) : p.badge ? (
                                    <span className="text-[12px] font-bold text-secondary">{p.badge.icon} {p.badge.title}</span>
                                ) : null}
                            </div>
                        </div>
                    </QuestCard>
                ))}
                <p className="text-[12px] font-semibold text-secondary pt-1">Aynı anda bir program yürütebilirsin; her gün bir adım açılır.</p>
            </div>
        </>
    );
}
