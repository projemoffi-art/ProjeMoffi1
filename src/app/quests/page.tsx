'use client';

// E1 · Görev Merkezi · Bugün (design-reference/quests-final/quests-reference.jpg).
// Üstte hayvanın fotoğrafı, haftanın günleri, bugünün görevleri; altta haftalık sandık, aylık macera, programlar,
// günün bilgisi, rozet kasası ve birlikte kısayolları. Tüm değerler sunucudan (quest_center); uydurma sayı yok.

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronRight } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { useQuestCenter } from '@/hooks/useQuestCenter';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { QuestTaskSheet } from '@/components/quests/QuestTaskSheet';
import { WeeklyChestSheet } from '@/components/quests/WeeklyChestSheet';
import {
    BackButton, CoralButton, PawCoinChip, PetPhoto, ProgressLine, QUEST_TINT, QuestCard, Ring, progressText, DayName,
} from '@/components/quests/QuestUI';
import type { DailyQuest, QuestCenter } from '@/services/questService';
import { cn } from '@/lib/utils';

export default function QuestCenterPage() {
    const { pets, activePet, switchPet } = usePet();
    const { data, error } = useQuestCenter(activePet?.id ?? null);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [chestOpen, setChestOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);

    if (!activePet) {
        return (
            <div className="px-4 pt-[calc(14px+env(safe-area-inset-top,0px))]">
                <BackButton fallback="/home" />
                <div className="mt-16 text-center px-6">
                    <div className="text-5xl mb-3" aria-hidden>🐾</div>
                    <h1 className="text-[20px] font-extrabold">Görevler dostuna göre hazırlanır</h1>
                    <p className="text-[14px] font-semibold text-secondary mt-2">Önce bir hayvan ekle; günlük görevler onun türüne, yaşına ve sağlığına göre çıkar.</p>
                    <div className="mt-6 max-w-xs mx-auto"><CoralButton href="/home">Ana sayfaya dön</CoralButton></div>
                </div>
            </div>
        );
    }

    const quests = data?.quests ?? [];
    const ordered = [...quests].sort((a, b) => Number(a.completed) - Number(b.completed));
    const visible = showAll ? ordered : ordered.slice(0, 4);
    const openQuest = quests.find(q => q.key === openKey) ?? null;

    return (
        <>
            {/* Hero: hayvanın fotoğrafı */}
            <section className="relative h-[300px] rounded-b-[32px] overflow-hidden">
                <PetPhoto url={data?.pet.avatar_url ?? activePet.image} species={data?.pet.species ?? activePet.type} className="absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/25" />
                <div className="absolute top-[calc(14px+env(safe-area-inset-top,0px))] inset-x-4 flex items-center justify-between">
                    <BackButton fallback="/home" onDark />
                    {data && <PawCoinChip value={data.balance} />}
                </div>
                <div className="absolute left-5 right-5 top-[calc(70px+env(safe-area-inset-top,0px))] text-white">
                    <h1 className="text-[30px] font-extrabold leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">Görev Merkezi</h1>
                    <p className="text-[15px] font-bold mt-1.5 drop-shadow">Bugün {data?.pet.name ?? activePet.name} ile neler yapalım? 🐾</p>
                    {data && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1.5 pr-3 py-1">
                            <Ring value={data.pet.level.xp - data.pet.level.level_start} max={data.pet.level.level_next - data.pet.level.level_start} size={26} stroke={4}>
                                <span className="text-[10px] font-black">{data.pet.level.level}</span>
                            </Ring>
                            <span className="text-[12px] font-bold">{data.pet.level.name} · {data.pet.level.xp.toLocaleString('tr-TR')} XP</span>
                        </div>
                    )}
                </div>
                {pets.length > 1 && (
                    <div className="absolute bottom-14 right-4 flex -space-x-2">
                        {pets.slice(0, 4).map(p => (
                            <button key={p.id} type="button" onClick={() => switchPet(p.id)} aria-label={`${p.name} için görevler`}
                                className={cn('w-9 h-9 rounded-full overflow-hidden border-2', p.id === activePet.id ? 'border-white ring-2 ring-accent' : 'border-white/70 opacity-80')}>
                                <PetPhoto url={p.image} species={p.type} className="w-full h-full" />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <div className="px-4 -mt-10 relative space-y-3">
                {error && !data && <p className="bg-card rounded-2xl p-4 text-sm font-semibold text-red-600">{error}</p>}
                {!data ? <LoadingBlocks count={4} /> : (
                    <>
                        <WeekStrip data={data} onOpen={() => setChestOpen(true)} />

                        <QuestCard className="p-4 flex items-center gap-3" onClick={() => setShowAll(true)}>
                            <Ring value={data.done} max={data.total} size={46} stroke={6} />
                            <span className="flex-1">
                                <span className="block text-[16px] font-extrabold">Bugünün görevleri</span>
                                <span className="block text-[13px] font-semibold text-secondary">
                                    {data.done}/{data.total} tamamlandı{data.day_bonus.earned ? ' · bonus alındı 🎉' : ` · hepsine +${data.day_bonus.pawcoin} PawCoin`}
                                </span>
                            </span>
                            <ChevronRight className="w-5 h-5 text-secondary" />
                        </QuestCard>

                        <QuestCard className="divide-y divide-card-border overflow-hidden">
                            {visible.map(q => <TaskRow key={q.key} q={q} onOpen={() => setOpenKey(q.key)} />)}
                        </QuestCard>

                        {ordered.length > 4 && (
                            <CoralButton onClick={() => setShowAll(s => !s)}>{showAll ? 'Daha az göster' : 'Tüm görevleri gör →'}</CoralButton>
                        )}

                        <h2 className="text-[16px] font-extrabold pt-3">Keşfet</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <ShortcutCard onClick={() => setChestOpen(true)} emoji={data.week.chest.opened ? '🎉' : '🎁'} title="Haftalık sandık"
                                text={data.week.chest.opened ? 'Bu hafta açıldı' : `${data.week.chest.goals.filter(g => g.progress >= g.target).length}/${data.week.chest.goals.length} hedef · ${data.week.chest.days_left} gün`} />
                            <ShortcutCard href="/quests/macera" emoji={data.adventure?.emoji ?? '🗺️'} title="Aylık macera"
                                text={data.adventure ? (data.adventure.completed ? 'Tamamlandı!' : `Bölüm ${Math.min(data.adventure.current_stage + 1, data.adventure.stages)}/${data.adventure.stages} · ${data.adventure.days_left} gün`) : 'Yakında'} />
                            <ShortcutCard href={data.program ? `/quests/programlar/${data.program.key}` : '/quests/programlar'} emoji={data.program?.emoji ?? '📜'} title="Programlar"
                                text={data.program ? `${data.program.title} · ${data.program.steps_done}/${data.program.total}${data.program.today_done ? ' ✓' : ''}` : 'Bir program seç'} />
                            <ShortcutCard href={data.lesson ? `/quests/bilgi/${data.lesson.id}` : '/quests/bilgi'} emoji="💡" title="Günün bilgisi"
                                text={data.lesson ? `${data.lesson.read ? '✓ ' : ''}${data.lesson.title}` : 'Bilgi kartları'} />
                            <ShortcutCard href="/quests/rozetler" emoji={data.next_badge?.icon ?? '🏅'} title="Rozet kasası"
                                text={data.next_badge ? `Sıradaki: ${data.next_badge.title} · ${fmt(data.next_badge.current)}/${fmt(data.next_badge.target)}` : 'Tüm rozetlerin'} />
                            <ShortcutCard href="/quests/birlikte" emoji="🤝" title="Birlikte" text="Arkadaşlarınla ortak hedef" />
                        </div>
                    </>
                )}
            </div>

            {data && openQuest && (
                <QuestTaskSheet quest={openQuest} pet={{ ...data.pet, weight: activePet.weight }} onClose={() => setOpenKey(null)} />
            )}
            {data && (
                <WeeklyChestSheet open={chestOpen} onClose={() => setChestOpen(false)} chest={data.week.chest} petId={data.pet.id} streakWeeks={data.week.streak_weeks} />
            )}
        </>
    );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('tr-TR', { maximumFractionDigits: 1 }));

function WeekStrip({ data, onOpen }: { data: QuestCenter; onOpen: () => void }) {
    return (
        <QuestCard className="p-3 flex items-center gap-2">
            <div className="flex-1 grid grid-cols-7 gap-1">
                {data.week.days.map(d => {
                    const today = d.date === data.day;
                    const full = d.total > 0 && d.done === d.total;
                    return (
                        <div key={d.date} className={cn('flex flex-col items-center py-1.5 rounded-xl', today && 'bg-accent text-white shadow-[0_6px_14px_-8px_rgba(238,91,61,0.9)]')}>
                            <span className={cn('text-[10.5px] font-bold capitalize', !today && 'text-secondary')}><DayName date={d.date} /></span>
                            <span className="text-[15px] font-extrabold leading-tight">{Number(d.date.slice(8, 10))}</span>
                            <span className={cn('mt-0.5 w-1.5 h-1.5 rounded-full', full ? (today ? 'bg-white' : 'bg-emerald-500') : d.done > 0 ? 'bg-amber-400' : 'bg-transparent')} />
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={onOpen} aria-label="Haftalık sandık" className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
            </button>
        </QuestCard>
    );
}

function TaskRow({ q, onOpen }: { q: DailyQuest; onOpen: () => void }) {
    const status = q.completed
        ? <span className="text-[13px] font-bold text-emerald-600">Tamamlandı</span>
        : q.key === 'vaccine_plan' || q.key === 'emergency' || q.key === 'passport'
            ? <span className="text-[13px] font-bold text-red-600 dark:text-red-400">{q.description}</span>
            : <ProgressLine value={q.progress} max={q.target} tone={q.category === 'bakim' ? 'amber' : 'green'} label={progressText(q)} className="mt-1 max-w-[180px]" />;
    return (
        <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.02]">
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] shrink-0" style={{ background: QUEST_TINT[q.category] || '#FCE6DF' }} aria-hidden>{q.icon}</span>
            <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-extrabold">{q.title}</span>
                {status}
            </span>
            {q.completed
                ? <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span>
                : <ChevronRight className="w-5 h-5 text-secondary shrink-0" />}
        </button>
    );
}

function ShortcutCard({ emoji, title, text, href, onClick }: { emoji: string; title: string; text: string; href?: string; onClick?: () => void }) {
    return (
        <QuestCard href={href} onClick={onClick} className="p-3.5 min-h-[104px] flex flex-col justify-between">
            <span className="text-[26px] leading-none" aria-hidden>{emoji}</span>
            <span>
                <span className="block text-[14px] font-extrabold">{title}</span>
                <span className="block text-[12px] font-semibold text-secondary line-clamp-2">{text}</span>
            </span>
        </QuestCard>
    );
}
