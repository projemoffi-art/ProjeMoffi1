'use client';

// "Bugünkü Yürüyüş" kartı (home-final referansı). Rakamlar yürüyüş ekranlarıyla aynı kaynaktan:
// bugünkü mesafe/süre/hedef QuestEngineContext'ten, kalori lib/walkMetrics'ten, canlı yürüyüş useWalk'tan.
// Durumlar: canlı yürüyüş > bugün hedef tamam > 3+ gündür yürünmedi > ilk yürüyüş > normal.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Footprints } from 'lucide-react';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useWalk } from '@/hooks/useWalk';
import { haptics } from '@/native';
import { formatClock, formatKm, formatMinutes, petWeightKg, walkCalories } from '@/lib/walkMetrics';
import type { Pet } from '@/context/PetContext';
import { baloo } from './homeUI';

const LAPSED_DAYS = 3;

type CardState = 'active' | 'done' | 'lapsed' | 'first' | 'normal';

const PHOTO: Record<CardState, string> = {
    active: '/images/walk-active.jpg',
    done: '/images/walk-active.jpg',
    lapsed: '/images/walk-lapsed.jpg',
    first: '/images/walk-normal.jpg',
    normal: '/images/walk-normal.jpg',
};

export function WalkTodayCard({ pets, activePet }: { pets: Pet[]; activePet: Pet | null }) {
    const router = useRouter();
    const { todayDistanceKm, todayDurationMin, dailyGoal } = useQuestEngine();
    const { activeSession, history } = useWalk();

    const walkingPet = activeSession?.petId ? pets.find(p => String(p.id) === String(activeSession.petId)) || null : null;
    const pet = walkingPet || activePet;
    const goalKm = Math.max(0.1, dailyGoal.distance);
    const percent = Math.min(100, Math.round((todayDistanceKm / goalKm) * 100));
    const remainingKm = Math.max(0, goalKm - todayDistanceKm);
    const kcal = walkCalories(todayDistanceKm, petWeightKg(pet));

    // Son yürüyüşten bu yana geçen gün; sayfa açık kalırsa dakikada bir güncellenir.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
    const daysSinceLastWalk = useMemo(() => {
        const last = history.reduce((max, w) => {
            const t = new Date(w.ended_at || w.started_at || 0).getTime();
            return Number.isFinite(t) && t > max ? t : max;
        }, 0);
        return last ? (now - last) / 86_400_000 : null;
    }, [history, now]);

    const state: CardState = activeSession ? 'active'
        : todayDistanceKm >= goalKm ? 'done'
        : daysSinceLastWalk === null ? 'first'
        : daysSinceLastWalk >= LAPSED_DAYS ? 'lapsed'
        : 'normal';

    const petName = activeSession?.petName || pet?.name || 'Dostun';
    const title = state === 'active' ? `${petName} yürüyor` : 'Bugünkü Yürüyüş';
    const subtitle = state === 'lapsed' ? `${Math.floor(daysSinceLastWalk || 0)} gündür yürümediniz, ${petName} seni bekliyor`
        : state === 'first' ? `${petName} ile ilk yürüyüşe hazır mısın?`
        : state === 'done' ? 'Bugünkü hedef tamam, harika iş!'
        : null;
    const cta = state === 'active' ? (activeSession?.isPaused ? 'Devam' : 'Takip')
        : 'Başla';

    const open = () => {
        haptics.tap();
        if (activeSession) router.push('/walk/tracking');
        else window.dispatchEvent(new CustomEvent('open-walk-panel'));
    };

    const chips = [
        { value: activeSession ? formatClock(activeSession.activeSeconds) : formatMinutes(todayDurationMin), label: 'Süre' },
        { value: `${kcal} kcal`, label: 'Kalori' },
        { value: `${formatKm(remainingKm, 1)} km`, label: 'Kalan' },
    ];

    return (
        <section className="relative -mx-1 rounded-[24px] overflow-hidden bg-[#2B2A24] shadow-[0_14px_34px_-14px_rgba(32,27,22,0.45)]">
            <AnimatePresence mode="wait">
                <motion.img
                    key={state}
                    src={PHOTO[state]}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: '65% 35%' }}
                />
            </AnimatePresence>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(20,17,13,0.78) 0%, rgba(20,17,13,0.45) 50%, rgba(20,17,13,0.05) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

            <button type="button" onClick={open} className="relative w-full text-left px-4 pt-4 pb-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-[#8FD14F] flex items-center justify-center shrink-0">
                            <Footprints className="w-[18px] h-[18px] text-[#1D2B0E]" strokeWidth={2.3} />
                        </span>
                        {state === 'active' && !activeSession?.isPaused && (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#8FD14F] opacity-75 animate-ping" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8FD14F]" />
                            </span>
                        )}
                        <span className="text-white text-[16px] font-bold truncate">{title}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[12.5px] font-bold ${state === 'done' ? 'bg-[#8FD14F] text-[#1D2B0E]' : 'bg-white/92 text-[#3A342C]'}`}>
                        {state === 'done' ? <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" strokeWidth={3} /> Hedef tamam</span> : `Hedef ${formatKm(goalKm, 1)} km`}
                    </span>
                </div>

                {subtitle && <p className="mt-2 text-white/90 text-[13px] font-semibold max-w-[75%] leading-snug">{subtitle}</p>}

                <div className={`${subtitle ? 'mt-2' : 'mt-4'} flex items-baseline gap-1.5 text-white`}>
                    <span className={`${baloo.className} text-[46px] leading-none font-bold tracking-tight`}>{formatKm(todayDistanceKm, 1)}</span>
                    <span className="text-[22px] font-bold">km</span>
                    <span className="text-[15px] font-bold text-white/70">/ {formatKm(goalKm, 1)} km</span>
                </div>
                <div className="mt-2.5 flex items-center gap-3 max-w-[80%]">
                    <div className="flex-1 h-2 rounded-full bg-white/25 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-[#8FD14F]" initial={false} animate={{ width: `${percent}%` }} transition={{ type: 'spring', damping: 24, stiffness: 120 }} />
                    </div>
                    <span className="text-white/85 text-[13px] font-bold">%{percent}</span>
                </div>

                <div className="mt-4 flex items-stretch gap-1">
                    {chips.map(c => (
                        <span key={c.label} className="flex-1 min-w-0 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 px-1.5 py-1.5 text-center">
                            <span className="block text-white text-[12.5px] font-extrabold truncate">{c.value}</span>
                            <span className="block text-white/70 text-[11px] font-semibold">{c.label}</span>
                        </span>
                    ))}
                    <span className="shrink-0 flex items-center gap-1 rounded-xl bg-accent text-white px-3 text-[14px] font-extrabold shadow-[0_8px_18px_-6px_rgba(238,91,61,0.7)]">
                        {cta} <ArrowRight className="w-4 h-4" strokeWidth={2.6} />
                    </span>
                </div>
            </button>
        </section>
    );
}
