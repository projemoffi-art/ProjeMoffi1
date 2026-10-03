'use client';

// A1 · Görev detayı (design-reference/quests-final/): üstte hayvanın fotoğrafı ve görev ikonu, sekmeler
// Detay / Nasıl Yapılır? / Ödüller / Geçmiş, altta göreve göre tek eylem (yürüyüş, bakım kaydı ya da ilgili ekran).
// Tamamlanmaya sunucu karar verir: bakım kaydı ya da yürüyüş kaydedilince Görev Merkezi kendini tazeler.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Flame, MapPin, RotateCcw, Shuffle } from 'lucide-react';
import { useActivity } from '@/context/ActivityContext';
import { useDailyProgress } from '@/context/DailyProgressContext';
import { petCareService } from '@/services/petCareService';
import { questService, type DailyQuest } from '@/services/questService';
import { petWeightKg, walkCalories, formatMinutes } from '@/lib/walkMetrics';
import { cn, showToast } from '@/lib/utils';
import { CoralButton, PetPhoto, PillTabs, ProgressLine, QUEST_TINT, QuestSheet, SheetClose, progressText, questAction, DayName } from './QuestUI';

type Tab = 'detay' | 'nasil' | 'odul' | 'gecmis';

export function QuestTaskSheet({ quest, pet, onClose }: {
    quest: DailyQuest | null;
    pet: { id: string; name: string; species: string; avatar_url: string | null; weight?: unknown };
    onClose: () => void;
}) {
    const [tab, setTab] = useState<Tab>('detay');
    const [busy, setBusy] = useState(false);
    const router = useRouter();
    const { walkData } = useActivity();
    const { todayDistanceKm, todayDurationMin } = useDailyProgress();

    if (!quest) return <QuestSheet open={false} onClose={onClose} title="">{null}</QuestSheet>;
    const action = questAction(quest);
    const pct = quest.target > 0 ? Math.round((quest.progress / quest.target) * 100) : 0;

    const careLabel = action.kind === 'care'
        ? (action.care === 'meal' ? 'Öğün verdim' : action.care === 'water' ? 'Suyu tazeledim' : 'Oynadık')
        : '';

    const run = async () => {
        if (action.kind === 'walk') {
            onClose();
            if (walkData.isActive) router.push('/walk/tracking');
            else window.dispatchEvent(new CustomEvent('open-walk-panel'));
            return;
        }
        if (action.kind === 'link') { onClose(); router.push(action.href); return; }
        setBusy(true);
        try { await petCareService.log(pet.id, action.care); }
        catch (e) { showToast(e instanceof Error ? e.message : 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    const undo = async () => {
        if (action.kind !== 'care') return;
        setBusy(true);
        try { await petCareService.log(pet.id, action.care, true); }
        catch (e) { showToast(e instanceof Error ? e.message : 'Geri alınamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    const reroll = async () => {
        setBusy(true);
        try { await questService.reroll(pet.id, quest.key); onClose(); }
        catch (e) { showToast(e instanceof Error ? e.message : 'Görev değiştirilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    // Bakım görevi bugün tamamsa tekrar kaydetmek bir şey değiştirmez (yalnızca geri alma anlamlı).
    const careDone = action.kind === 'care' && quest.completed;
    const cta = action.kind === 'walk'
        ? (walkData.isActive ? 'Yürüyüşe dön' : quest.completed ? 'Yeni yürüyüş başlat' : 'Yürüyüşe başla')
        : action.kind === 'care' ? (careDone ? 'Bugün tamamlandı ✓' : careLabel) : 'Hemen yap';

    const top = (
        <div className="relative h-44 shrink-0">
            <PetPhoto url={pet.avatar_url} species={pet.species} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
            <div className="absolute top-4 inset-x-4 flex justify-end"><SheetClose onClose={onClose} onDark /></div>
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md" style={{ background: QUEST_TINT[quest.category] || '#FCE6DF' }}>{quest.icon}</span>
                <span className="text-white">
                    <span className="block text-[22px] font-extrabold leading-tight drop-shadow">{quest.title}</span>
                    <span className="block text-[12.5px] font-semibold opacity-90">{quest.description}</span>
                </span>
            </div>
        </div>
    );

    return (
        <QuestSheet open onClose={onClose} title={quest.title} top={top}
            footer={
                <div className="space-y-2">
                    <CoralButton onClick={run} disabled={busy || careDone}>{cta}</CoralButton>
                    {action.kind === 'care' && quest.progress > 0 && (
                        <button type="button" onClick={undo} disabled={busy} className="w-full h-9 text-[12.5px] font-bold text-secondary inline-flex items-center justify-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" /> Son kaydı geri al
                        </button>
                    )}
                </div>
            }>
            <div className="-mx-4 pt-3 pb-1">
                <PillTabs<Tab> compact value={tab} onChange={setTab} tabs={[
                    { id: 'detay', label: 'Detay' }, { id: 'nasil', label: 'Nasıl Yapılır?' }, { id: 'odul', label: 'Ödüller' }, { id: 'gecmis', label: 'Geçmiş' },
                ]} />
            </div>

            {tab === 'detay' && (
                <div className="space-y-4 pt-3">
                    <div className="bg-card border border-card-border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[15px] font-black">{quest.completed ? 'Tamamlandı ✓' : progressText(quest)}</span>
                            <span className="text-[13px] font-black text-emerald-600">%{Math.min(100, pct)}</span>
                        </div>
                        <ProgressLine value={quest.progress} max={quest.target} tone="green" />
                        {quest.self_report && <p className="text-[11.5px] font-semibold text-secondary mt-2">Bu görev senin kaydınla tamamlanır; dürüstlük dostunun sağlığı için önemli.</p>}
                    </div>
                    {action.kind === 'walk' && (
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { icon: Clock, value: formatMinutes(todayDurationMin), label: 'Süre' },
                                { icon: Flame, value: `${walkCalories(todayDistanceKm, petWeightKg(pet))} kcal`, label: 'Kalori' },
                                { icon: MapPin, value: `${Math.max(0, quest.target - quest.progress).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`, label: 'Kalan' },
                            ].map(s => (
                                <div key={s.label} className="bg-card border border-card-border rounded-2xl p-3 flex flex-col items-center">
                                    <s.icon className="w-4 h-4 text-accent mb-1" />
                                    <span className="text-[14px] font-black">{s.value}</span>
                                    <span className="text-[11px] font-semibold text-secondary">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-[14px] font-semibold text-secondary leading-relaxed">{quest.why}</p>
                    {quest.can_reroll && (
                        <button type="button" onClick={reroll} disabled={busy} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent">
                            <Shuffle className="w-4 h-4" /> Bu görevi bugün değiştir (günde 1)
                        </button>
                    )}
                </div>
            )}

            {tab === 'nasil' && (
                <div className="space-y-3 pt-3">
                    <div className="bg-card border border-card-border rounded-2xl p-4">
                        <h3 className="text-[14px] font-black mb-1">Nasıl yapılır?</h3>
                        <p className="text-[14px] font-semibold text-secondary leading-relaxed">{quest.how}</p>
                    </div>
                    <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4">
                        <h3 className="text-[14px] font-black mb-1">Neden önemli?</h3>
                        <p className="text-[14px] font-semibold text-secondary leading-relaxed">{quest.why}</p>
                    </div>
                </div>
            )}

            {tab === 'odul' && (
                <div className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-card border border-card-border rounded-2xl p-4 text-center">
                            <div className="text-2xl" aria-hidden>🪙</div>
                            <div className="text-[18px] font-black">+{quest.pawcoin}</div>
                            <div className="text-[11.5px] font-semibold text-secondary">PawCoin</div>
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl p-4 text-center">
                            <div className="text-2xl" aria-hidden>⭐</div>
                            <div className="text-[18px] font-black">+{quest.xp}</div>
                            <div className="text-[11.5px] font-semibold text-secondary">{pet.name} için XP</div>
                        </div>
                    </div>
                    {quest.coin_shared && (
                        <p className="text-[12.5px] font-semibold text-secondary leading-relaxed bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-3">
                            Bu görevin bugünkü PawCoin&apos;u başka bir dostunla alındı. PawCoin hesabına görev başına günde bir kez yazılır; {pet.name} XP kazanmaya devam eder.
                        </p>
                    )}
                    <p className="text-[12.5px] font-semibold text-secondary leading-relaxed">
                        Günün tüm görevlerini bitirirsen ek olarak +30 XP (PawCoin hesabına günde bir kez +10). Görevlerden günde en çok 200 PawCoin kazanılır.
                    </p>
                </div>
            )}

            {tab === 'gecmis' && (
                <div className="pt-3">
                    <div className="grid grid-cols-7 gap-1.5">
                        {quest.history.map(h => (
                            <div key={h.date} className="flex flex-col items-center gap-1">
                                <span className="text-[11px] font-bold text-secondary capitalize"><DayName date={h.date} /></span>
                                <span className={cn('w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black',
                                    h.done ? 'bg-emerald-500 text-white' : h.given ? 'bg-black/[0.06] dark:bg-white/10 text-secondary' : 'border border-dashed border-card-border text-secondary/50')}>
                                    {h.done ? '✓' : h.given ? '–' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[12px] font-semibold text-secondary mt-3">Son 7 gün. Yeşil: tamamlandı · gri: verildi ama bitmedi · boş: o gün bu görev yoktu.</p>
                </div>
            )}
        </QuestSheet>
    );
}
