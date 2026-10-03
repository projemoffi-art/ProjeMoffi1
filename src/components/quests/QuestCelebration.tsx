'use client';

// Kutlama anları (Görev Merkezi K): görev tamam, günün görevleri tamam, hayvan seviye atladı, rozet kazanıldı, macera bölümü.
// Yalnızca SUNUCUNUN gerçekten verdiği ödüller gösterilir (quest_center → awarded / new_badges); uydurma bonus yok.
// Kök düzende bir kez durur; herhangi bir ekran celebrate(...) ile tetikler.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Awarded, NewBadge, PetLevel } from '@/services/questService';

const EVENT = 'moffi-quest-celebrate';

interface CelebrateDetail { awarded: Awarded[]; badges: NewBadge[]; levelUp: PetLevel | null; petName: string }
interface Moment { id: number; icon: string; title: string; text: string; big: boolean }

let nextId = 1;

export function celebrate(detail: CelebrateDetail) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<CelebrateDetail>(EVENT, { detail }));
}

function toMoments(d: CelebrateDetail): Moment[] {
    const out: Moment[] = [];
    const reward = (pc: number, xp: number) => [pc > 0 ? `+${pc} PawCoin` : null, xp > 0 ? `+${xp} XP` : null].filter(Boolean).join(' · ');
    const quests = d.awarded.filter(a => a.kind === 'quest');
    if (quests.length === 1) out.push({ id: nextId++, icon: '✅', title: `${quests[0].label} tamam`, text: reward(quests[0].pawcoin, quests[0].xp), big: false });
    else if (quests.length > 1) {
        out.push({ id: nextId++, icon: '✅', title: `${quests.length} görev tamam`, text: reward(quests.reduce((s, a) => s + a.pawcoin, 0), quests.reduce((s, a) => s + a.xp, 0)), big: false });
    }
    for (const a of d.awarded.filter(x => x.kind === 'day')) {
        out.push({ id: nextId++, icon: '🌟', title: 'Günün tüm görevleri tamam!', text: `${d.petName} bugün çok mutlu · ${reward(a.pawcoin, a.xp)}`, big: true });
    }
    for (const a of d.awarded.filter(x => x.kind === 'adventure')) {
        out.push({ id: nextId++, icon: '🗺️', title: `Macera: ${a.label}`, text: reward(a.pawcoin, a.xp), big: true });
    }
    for (const a of d.awarded.filter(x => x.kind === 'program')) {
        out.push({ id: nextId++, icon: '🎓', title: a.label, text: reward(a.pawcoin, a.xp), big: true });
    }
    for (const b of d.badges) out.push({ id: nextId++, icon: b.icon, title: `Yeni rozet: ${b.title}`, text: reward(b.pawcoin, b.xp), big: true });
    if (d.levelUp) out.push({ id: nextId++, icon: '🎉', title: `${d.petName} seviye atladı!`, text: `Seviye ${d.levelUp.level} · ${d.levelUp.name}`, big: true });
    return out;
}

export function QuestCelebration() {
    const [queue, setQueue] = useState<Moment[]>([]);
    const current = queue[0] ?? null;

    useEffect(() => {
        const on = (e: Event) => {
            const m = toMoments((e as CustomEvent<CelebrateDetail>).detail);
            if (m.length) setQueue(q => [...q, ...m]);
        };
        window.addEventListener(EVENT, on);
        return () => window.removeEventListener(EVENT, on);
    }, []);

    // Sıradaki an: büyükse bir kez konfeti, sonra kendiliğinden kapanır.
    useEffect(() => {
        if (!current) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (current.big && !reduce) {
            void confetti({ particleCount: 70, spread: 70, startVelocity: 32, origin: { y: 0.18 }, colors: ['#EE5B3D', '#8FD14F', '#F0C94E', '#FFFFFF'] });
        }
        const t = setTimeout(() => setQueue(q => q.slice(1)), current.big ? 3600 : 2600);
        return () => clearTimeout(t);
    }, [current]);

    // Sayfa gövdesine taşınır: açık alt sayfaların karartmasının üstünde kalsın. Kuyruk boşken hiçbir şey çizilmez
    // (sunucu ve ilk istemci çizimi aynı: null).
    if (queue.length === 0) return null;
    return createPortal(
        <div className="theme-vet fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[7000] flex justify-center px-4 pointer-events-none">
            <AnimatePresence>
                {current && (
                    <motion.button
                        key={current.id}
                        type="button"
                        onClick={() => setQueue(q => q.slice(1))}
                        initial={{ opacity: 0, y: -24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-[0_16px_40px_-16px_rgba(32,27,22,0.45)] px-4 py-3 text-left"
                        role="status"
                    >
                        <span className={current.big ? 'text-3xl' : 'text-2xl'} aria-hidden>{current.icon}</span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-[15px] font-black text-foreground truncate">{current.title}</span>
                            {current.text && <span className="block text-[12.5px] font-bold text-accent truncate">{current.text}</span>}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>,
        document.body,
    );
}
