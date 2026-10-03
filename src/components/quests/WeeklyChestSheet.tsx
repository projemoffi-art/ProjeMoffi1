'use client';

// A2 · Haftalık sandık (design-reference/quests-final/): haftanın 4 hedefi, ödülün içeriği ÖNCEDEN yazılı
// (rastgele kutu yok), hedefler bitince "Sandığı Aç". Açma sunucuda doğrulanır (quest_open_chest).

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { questService, type WeekChest } from '@/services/questService';
import { BALANCE_CHANGED } from '@/context/DailyProgressContext';
import { cn, showToast } from '@/lib/utils';
import { CoralButton, QuestSheet, SheetClose } from './QuestUI';
import confetti from 'canvas-confetti';

const GOAL_ICON: Record<string, string> = { walk_days: '🐾', play_days: '🧶', water_days: '💧', meal_days: '🍽️', photo_count: '📸' };

export function WeeklyChestSheet({ open, onClose, chest, petId, streakWeeks }: {
    open: boolean; onClose: () => void; chest: WeekChest; petId: string; streakWeeks: number;
}) {
    const [busy, setBusy] = useState(false);
    const [opened, setOpened] = useState<{ pawcoin: number; xp: number; perk_name: string } | null>(null);
    const left = chest.goals.filter(g => g.progress < g.target).length;

    const openChest = async () => {
        setBusy(true);
        try {
            const r = await questService.openChest(petId);
            setOpened(r);
            window.dispatchEvent(new Event(BALANCE_CHANGED));
            if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                void confetti({ particleCount: 90, spread: 80, origin: { y: 0.35 }, colors: ['#F0C94E', '#EE5B3D', '#8FD14F', '#FFFFFF'] });
            }
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Sandık açılamadı.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    const top = (
        <div className="relative shrink-0 px-5 pt-5 pb-6 text-white overflow-hidden"
            style={{ background: 'radial-gradient(120% 140% at 85% 0%, #7A3E8E 0%, #4A2463 45%, #2B1638 100%)' }}>
            <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden
                style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 45% 70%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent 51%)' }} />
            <div className="relative flex items-start justify-between">
                <div>
                    <h2 className="text-[24px] font-extrabold leading-tight">Haftalık Sandık</h2>
                    <p className="text-[13px] font-semibold opacity-85 mt-1">Hedefini tamamla, özel ödülleri kazan!</p>
                </div>
                <SheetClose onClose={onClose} onDark />
            </div>
            <div className="relative mt-4 flex items-end justify-between">
                <motion.span aria-hidden className="text-[64px] leading-none drop-shadow-[0_10px_20px_rgba(240,201,78,0.45)]"
                    animate={opened ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] } : undefined} transition={{ duration: 0.6 }}>
                    {opened || chest.opened ? '🎉' : '🎁'}
                </motion.span>
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/15 text-[12.5px] font-bold">
                    <Clock className="w-3.5 h-3.5" /> {chest.days_left > 0 ? `${chest.days_left} gün kaldı` : 'Son gün'}
                </span>
            </div>
        </div>
    );

    const done = opened || chest.opened;
    return (
        <QuestSheet open={open} onClose={onClose} title="Haftalık Sandık" top={top}
            footer={done
                ? <CoralButton onClick={onClose}>{opened ? `+${opened.pawcoin} PawCoin · ${opened.perk_name}` : 'Bu haftanın sandığı açıldı'}</CoralButton>
                : <CoralButton onClick={openChest} disabled={!chest.ready || busy} sub={chest.ready ? undefined : `${left} hedef kaldı`}>Sandığı Aç</CoralButton>}>
            <div className="pt-4 space-y-2">
                {chest.goals.map(g => {
                    const ok = g.progress >= g.target;
                    return (
                        <div key={g.key} className={cn('flex items-center gap-3 rounded-2xl border px-3.5 py-3', ok ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25' : 'bg-card border-card-border')}>
                            <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[13px]', ok ? 'bg-emerald-500 text-white' : 'bg-black/[0.05] dark:bg-white/10')}>
                                {ok ? <Check className="w-4 h-4" /> : <span aria-hidden>{GOAL_ICON[g.key] || '•'}</span>}
                            </span>
                            <span className={cn('flex-1 text-[14px] font-bold', ok && 'text-emerald-700 dark:text-emerald-300')}>{g.label}</span>
                            <span className="text-[13px] font-black tabular-nums">{Math.min(g.progress, g.target)}/{g.target}</span>
                        </div>
                    );
                })}
            </div>
            <h3 className="text-[14px] font-black mt-5 mb-2">Sandıkta ne var?</h3>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-card border border-card-border rounded-2xl p-3 text-center">
                    <div className="text-2xl" aria-hidden>🪙</div>
                    <div className="text-[15px] font-black">{chest.reward.pawcoin}</div>
                    <div className="text-[11px] font-semibold text-secondary">PawCoin</div>
                </div>
                <div className="bg-card border border-card-border rounded-2xl p-3 text-center">
                    <div className="text-2xl" aria-hidden>⭐</div>
                    <div className="text-[15px] font-black">+{chest.reward.xp}</div>
                    <div className="text-[11px] font-semibold text-secondary">XP</div>
                </div>
                <div className="bg-card border border-card-border rounded-2xl p-3 text-center">
                    <div className="text-2xl" aria-hidden>🖼️</div>
                    <div className="text-[13px] font-black leading-tight">Özel çerçeve</div>
                    <div className="text-[11px] font-semibold text-secondary">3 gün</div>
                </div>
            </div>
            <p className="text-[12px] font-semibold text-secondary mt-3">
                Sandığın içeriği her hafta önceden bellidir. {streakWeeks > 0 ? `Üst üste ${streakWeeks} haftadır sandığını açıyorsun.` : 'Sandığı her hafta açarak haftalık serini başlat.'}
            </p>
        </QuestSheet>
    );
}
