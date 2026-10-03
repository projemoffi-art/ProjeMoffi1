'use client';

// "Bugünkü Yürüyüş" — ana sayfanın amiral kartı (home-final referansı üzerine).
// Rakamlar yürüyüş ekranlarıyla aynı kaynaktan: bugünkü mesafe/süre/hedef QuestEngineContext'ten, kalori lib/walkMetrics'ten,
// canlı yürüyüş ve geçmiş ActivityContext'ten (useWalk), seri walkStats'ten, hava WeatherContext'ten.
// Durumlar: canlı yürüyüş > bugün hedef tamam > 3+ gündür yürünmedi > ilk yürüyüş > normal.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Cloud, CloudLightning, CloudRain, CloudSun, Flame, Footprints, Navigation, Play, Snowflake, Sun, ThermometerSun } from 'lucide-react';
import { useQuestEngine } from '@/context/QuestEngineContext';
import { useActivity } from '@/context/ActivityContext';
import { useWalk } from '@/hooks/useWalk';
import { useWeather, isHotForPaws } from '@/context/WeatherContext';
import { haptics } from '@/native';
import { formatClock, formatKm, formatMinutes, petWeightKg, walkCalories } from '@/lib/walkMetrics';
import type { Pet } from '@/context/PetContext';
import { baloo } from './homeUI';

const LAPSED_DAYS = 3;
const DAY_LETTERS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const WEATHER_ICON: Record<string, typeof Sun> = { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning };

type CardState = 'active' | 'done' | 'lapsed' | 'first' | 'normal';

const PHOTO: Record<CardState, string> = {
    active: '/images/walk-active.jpg',
    done: '/images/walk-active.jpg',
    lapsed: '/images/walk-lapsed.jpg',
    first: '/images/walk-normal.jpg',
    normal: '/images/walk-normal.jpg',
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function ProgressRing({ percent, live }: { percent: number; live: boolean }) {
    const r = 38;
    const c = 2 * Math.PI * r;
    return (
        <div className="glass-photo relative w-[100px] h-[100px] rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <defs>
                    <linearGradient id="walkRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#C6F27E" />
                        <stop offset="100%" stopColor="#6BBF2E" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
                <motion.circle
                    cx="50" cy="50" r={r} fill="none" stroke="url(#walkRing)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={c}
                    initial={false}
                    animate={{ strokeDashoffset: c * (1 - Math.max(0.02, percent / 100)) }}
                    transition={{ type: 'spring', damping: 24, stiffness: 90 }}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(160,230,90,0.55))' }}
                />
            </svg>
            <div className="relative text-center text-white">
                {live ? <Navigation className="w-5 h-5 mx-auto mb-0.5 text-[#C6F27E]" /> : null}
                <div className={`${baloo.className} text-[24px] leading-none font-bold`}>%{percent}</div>
                {!live && <div className="text-[10.5px] font-bold text-white/75 mt-0.5">hedef</div>}
            </div>
        </div>
    );
}

export function WalkTodayCard({ pets, activePet }: { pets: Pet[]; activePet: Pet | null }) {
    const router = useRouter();
    const { todayDistanceKm, todayDurationMin, todaySteps, dailyGoal } = useQuestEngine();
    const { stepsSupported } = useActivity();
    const { activeSession, history, stats } = useWalk();
    const { weather } = useWeather();

    const walkingPet = activeSession?.petId ? pets.find(p => String(p.id) === String(activeSession.petId)) || null : null;
    const pet = walkingPet || activePet;
    const goalKm = Math.max(0.1, dailyGoal.distance);
    const percent = Math.min(100, Math.round((todayDistanceKm / goalKm) * 100));
    const remainingKm = Math.max(0, goalKm - todayDistanceKm);
    const kcal = walkCalories(todayDistanceKm, petWeightKg(pet));
    const streak = stats?.currentStreak || 0;
    // Adım öne çıkar (kullanıcıların en çok baktığı ölçü). Adım sensörü olmayan cihazda büyük rakam mesafe olur;
    // hedef ve halka her durumda mesafe hedefine göredir (puan da mesafeden verilir, 8.20).
    // Sensör "var" görünüp adım üretmiyorsa (izin reddi vb.) mesafe yürüdüğü hâlde 0 adım göstermeyiz.
    const shownSteps = activeSession ? activeSession.realSteps || 0 : todaySteps;
    const shownKm = activeSession ? activeSession.distanceKm : todayDistanceKm;
    const stepsFirst = stepsSupported && !(shownKm > 0.05 && shownSteps === 0);

    // Sayfa açık kalırsa "kaç gündür" ve hafta şeridi dakikada bir tazelenir.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);

    const { daysSinceLastWalk, week } = useMemo(() => {
        const walked = new Set<string>();
        let last = 0;
        for (const w of history) {
            const t = new Date(w.ended_at || w.started_at || 0).getTime();
            if (!Number.isFinite(t) || t <= 0) continue;
            walked.add(dayKey(new Date(t)));
            if (t > last) last = t;
        }
        const today = new Date(now);
        const mondayOffset = (today.getDay() + 6) % 7;
        const days = DAY_LETTERS.map((letter, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - mondayOffset + i);
            return { letter, done: walked.has(dayKey(d)), isToday: i === mondayOffset, future: i > mondayOffset };
        });
        return { daysSinceLastWalk: last ? (now - last) / 86_400_000 : null, week: days };
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
        : state === 'active' ? (activeSession?.isPaused ? 'Duraklatıldı' : 'Canlı takip açık')
        : `${petName} ile bugünkü turun`;
    const cta = state === 'active' ? (activeSession?.isPaused ? 'Devam' : 'Takip') : 'Başla';

    const open = () => {
        haptics.tap();
        if (activeSession) router.push('/walk/tracking');
        else window.dispatchEvent(new CustomEvent('open-walk-panel'));
    };

    const WeatherIcon = weather ? WEATHER_ICON[weather.iconKey] || Sun : null;
    const hot = isHotForPaws(weather);
    const metrics = [
        { value: activeSession ? formatClock(activeSession.activeSeconds) : formatMinutes(todayDurationMin), unit: '', label: 'Süre' },
        { value: `${kcal}`, unit: 'kcal', label: 'Kalori' },
        { value: formatKm(remainingKm, 1), unit: 'km', label: 'Kalan' },
    ];

    return (
        <section
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={e => { if (e.key === 'Enter') open(); }}
            aria-label={`${title}. Bugün ${formatKm(todayDistanceKm, 1)} kilometre, hedef ${formatKm(goalKm, 1)} kilometre.`}
            className="relative -mx-1 rounded-[28px] overflow-hidden bg-[#2B2A24] cursor-pointer active:scale-[0.99] transition-transform shadow-[0_22px_44px_-18px_rgba(32,27,22,0.55)]"
        >
            <AnimatePresence mode="wait">
                <motion.img
                    key={state}
                    src={PHOTO[state]}
                    alt=""
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: '65% 35%' }}
                />
            </AnimatePresence>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(18,15,11,0.82) 0%, rgba(18,15,11,0.5) 46%, rgba(18,15,11,0.12) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
            {/* üst kenarda ince ışık çizgisi */}
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <div className="relative px-4 pt-4 pb-3.5">
                {/* Başlık satırı */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(160deg, #C6F27E, #7FC243)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 18px -8px rgba(143,209,79,0.9)' }}>
                            <Footprints className="w-5 h-5 text-[#1D2B0E]" strokeWidth={2.3} />
                        </span>
                        <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-white text-[16.5px] font-extrabold leading-tight truncate">
                                {state === 'active' && !activeSession?.isPaused && (
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#8FD14F] opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8FD14F]" />
                                    </span>
                                )}
                                {title}
                            </span>
                            <span className="block text-white/80 text-[12.5px] font-semibold truncate">{subtitle}</span>
                        </span>
                    </div>
                    {streak > 0 ? (
                        <span className="glass-photo shrink-0 rounded-full pl-2 pr-2.5 py-1 flex items-center gap-1 text-white text-[12.5px] font-extrabold">
                            <Flame className="w-4 h-4 text-[#FFB14A]" fill="#FF8A3D" strokeWidth={1.5} /> {streak} gün
                        </span>
                    ) : state === 'done' ? (
                        <span className="shrink-0 rounded-full px-2.5 py-1 flex items-center gap-1 bg-[#8FD14F] text-[#1D2B0E] text-[12.5px] font-extrabold">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Tamam
                        </span>
                    ) : null}
                </div>

                {/* Ana gösterge */}
                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 text-white">
                            <span className={`${baloo.className} text-[52px] leading-[0.95] font-bold tracking-tight`} style={{ textShadow: '0 4px 18px rgba(0,0,0,0.35)' }}>
                                {stepsFirst ? shownSteps.toLocaleString('tr-TR') : formatKm(shownKm, activeSession ? 2 : 1)}
                            </span>
                            <span className="text-[20px] font-extrabold">{stepsFirst ? 'adım' : 'km'}</span>
                        </div>
                        <p className="text-white/75 text-[13px] font-bold mt-1">
                            {stepsFirst
                                ? `${formatKm(shownKm, activeSession ? 2 : 1)} km · hedef ${formatKm(goalKm, 1)} km`
                                : activeSession ? `Bugün toplam ${formatKm(todayDistanceKm, 1)} km` : `Hedef ${formatKm(goalKm, 1)} km`}
                        </p>
                        {weather && WeatherIcon && (
                            <button
                                type="button"
                                aria-label="Hava durumu detayı"
                                onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-weather-detail')); }}
                                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-white active:scale-95 transition-transform ${hot ? 'bg-[#E0623F]/85' : 'glass-photo'}`}
                            >
                                {hot ? <ThermometerSun className="w-4 h-4" /> : <WeatherIcon className="w-4 h-4" />}
                                {weather.temp}° · {hot ? 'Asfalt sıcak olabilir' : weather.condition}
                            </button>
                        )}
                    </div>
                    <ProgressRing percent={percent} live={state === 'active'} />
                </div>

                {/* Hafta şeridi */}
                <div className="mt-3.5 grid grid-cols-7 gap-1.5" aria-label="Bu haftanın yürüyüşleri">
                    {week.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span
                                className={`w-full h-[7px] rounded-full ${d.done ? '' : d.future ? 'bg-white/12' : 'bg-white/25'} ${d.isToday && !d.done ? 'ring-1 ring-white/80' : ''}`}
                                style={d.done ? { background: 'linear-gradient(90deg, #C6F27E, #7FC243)', boxShadow: '0 0 8px rgba(160,230,90,0.6)' } : undefined}
                            />
                            <span className={`text-[10.5px] font-extrabold ${d.isToday ? 'text-white' : 'text-white/60'}`}>{d.letter}</span>
                        </div>
                    ))}
                </div>

                {/* Cam alt şerit: ölçüler + düğme */}
                <div className="glass-photo mt-3 rounded-[20px] p-1.5 flex items-stretch">
                    <div className="flex-1 grid grid-cols-3 divide-x divide-white/15">
                        {metrics.map(m => (
                            <div key={m.label} className="px-1.5 py-1 text-center min-w-0">
                                <div className="text-white text-[14px] font-extrabold leading-tight truncate">
                                    {m.value}{m.unit && <span className="text-[11px] font-bold text-white/75 ml-0.5">{m.unit}</span>}
                                </div>
                                <div className="text-white/65 text-[11px] font-semibold">{m.label}</div>
                            </div>
                        ))}
                    </div>
                    <span
                        className="shrink-0 ml-1.5 flex items-center gap-1.5 rounded-[15px] px-4 text-white text-[15px] font-extrabold"
                        style={{ background: 'radial-gradient(120% 140% at 30% 15%, #FF9A6B 0%, #EE5B3D 50%, #CC452B 100%)', boxShadow: '0 10px 22px -8px rgba(238,91,61,0.95), inset 0 1px 0 rgba(255,255,255,0.45)' }}
                    >
                        {state === 'active' ? <Navigation className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />} {cta}
                    </span>
                </div>
            </div>
        </section>
    );
}
