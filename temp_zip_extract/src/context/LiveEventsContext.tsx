"use client";

/**
 * MOFFI LIVE EVENTS ENGINE — Aşama 2
 *
 * Gerçek zamanlı mahalle/sosyal olaylar:
 * 1. LIVE WALK EVENTS   — "Şu an 5 kullanıcı Kadıköy'de yürüyüşte!"
 * 2. FLASH CHALLENGES   — 30 dakika süreli mini yarışmalar
 * 3. WEATHER EVENTS     — "Fırtına öncesi son şans!" (gerçek hava verisi)
 * 4. SOCIAL SURGE       — "Bugün rekorum kırıldı! #1 konumsun"
 * 5. COMMUNITY ALERT    — Yakındaki özel etkinlikler
 * 6. HERD PRESSURE      — "Arkadaşın seni geçti!" tarzı baskı
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useActivity } from '@/context/ActivityContext';
import { useWeather } from '@/context/WeatherContext';
import { useQuestEngine } from '@/context/QuestEngineContext';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type LiveEventType =
    | 'live_walkers'      // Şu an yürüyüşte olan kullanıcılar
    | 'flash_challenge'   // 30 dk süreli ani görev
    | 'weather_window'    // Hava fırsatı (kısa iyileşme)
    | 'social_surge'      // Sosyal aktivite patlaması
    | 'friend_passed'     // Arkadaş geçti
    | 'neighborhood_race' // Mahalle yarışması güncellemesi
    | 'rare_spawn';       // Nadir rozet fırsatı

export interface LiveEvent {
    id: string;
    type: LiveEventType;
    title: string;
    body: string;
    cta: string;           // Call-to-action butonu
    ctaRoute?: string;     // Yönlendirme
    urgency: 'low' | 'medium' | 'high' | 'critical';
    expiresAt: number;     // timestamp
    icon: string;
    color: string;         // Tailwind gradient
    reward?: { pp: number; xp: number };
    actionKey?: string;    // window.dispatchEvent key
}

interface LiveEventsContextType {
    activeEvents: LiveEvent[];
    flashChallenge: LiveEvent | null;
    dismissEvent: (id: string) => void;
    acceptFlashChallenge: () => void;
    liveWalkerCount: number;
    neighborhoodRank: number;
    neighborhoodScore: number;
}

const LiveEventsContext = createContext<LiveEventsContextType | undefined>(undefined);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function seedRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function getNow(): number { return Date.now(); }

// Saate göre aktif walker sayısını simüle et (gerçek veriye yakın dağılım)
function getSimulatedWalkerCount(hour: number, walkScore: number): number {
    const base = walkScore > 70
        ? [2, 1, 1, 1, 2, 5, 18, 42, 35, 28, 22, 18, 15, 12, 10, 9, 12, 28, 45, 38, 25, 15, 8, 4][hour]
        : Math.floor([2, 1, 1, 1, 2, 5, 18, 42, 35, 28, 22, 18, 15, 12, 10, 9, 12, 28, 45, 38, 25, 15, 8, 4][hour] * 0.4);
    const rng = seedRandom(Date.now() % 10000);
    return Math.max(1, Math.floor(base + rng() * 8 - 4));
}

// Mahalle isimleri (İstanbul odaklı)
const NEIGHBORHOODS = [
    'Kadıköy', 'Beşiktaş', 'Moda', 'Bağcılar', 'Şişli',
    'Üsküdar', 'Bakırköy', 'Levent', 'Nişantaşı', 'Caddebostan',
    'Maltepe', 'Ataşehir', 'Sarıyer', 'Bebek', 'Ortaköy'
];

function getUserNeighborhood(lat: number, lon: number): string {
    // Gerçek koordinat bazlı tahmin (basit)
    const idx = Math.abs(Math.floor((lat + lon) * 1000)) % NEIGHBORHOODS.length;
    return NEIGHBORHOODS[idx];
}

// ─── FLASH CHALLENGE POOL ─────────────────────────────────────────────────────

interface FlashChallengeTemplate {
    title: string;
    body: string;
    cta: string;
    icon: string;
    color: string;
    reward: { pp: number; xp: number };
    durationMinutes: number;
}

const FLASH_CHALLENGES: FlashChallengeTemplate[] = [
    {
        title: '⚡ Ani Görev!',
        body: 'Önümüzdeki 30 dk içinde 1 km yürü — x2 PP kazan!',
        cta: 'Kabul Et',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
        reward: { pp: 80, xp: 120 },
        durationMinutes: 30,
    },
    {
        title: '🌅 Saat Fırsatı!',
        body: 'Şu an en aktif saat — 20 dk yürü, bonus rozet kazan!',
        cta: 'Hemen Çık',
        icon: '🌅',
        color: 'from-orange-400 to-pink-500',
        reward: { pp: 60, xp: 90 },
        durationMinutes: 20,
    },
    {
        title: '🏃 Sprint Meydan Okuması!',
        body: '15 dk içinde 0.5 km koş — liderlik tablosunda yüksel!',
        cta: 'Kabul Et',
        icon: '🏃',
        color: 'from-blue-500 to-indigo-500',
        reward: { pp: 50, xp: 75 },
        durationMinutes: 15,
    },
    {
        title: '🌙 Gece Gezgini!',
        body: 'Geceleri yürümek x1.5 PP veriyor — şimdi çık!',
        cta: 'Gece Yürüyüşü',
        icon: '🌙',
        color: 'from-indigo-600 to-purple-700',
        reward: { pp: 90, xp: 130 },
        durationMinutes: 25,
    },
    {
        title: '🌧️ Yağmur Kahramanı!',
        body: 'Yağmurda yürüyüş x3 PP! Nadir rozet kazanma şansı.',
        cta: 'Cesareti Göster',
        icon: '🌧️',
        color: 'from-slate-500 to-blue-600',
        reward: { pp: 150, xp: 200 },
        durationMinutes: 20,
    },
    {
        title: '🎯 Topluluk Görevi!',
        body: '100 kullanıcı aynı anda yürüyor — sen de katıl, PP havuzunu paylaş!',
        cta: 'Katıl',
        icon: '🎯',
        color: 'from-emerald-500 to-teal-600',
        reward: { pp: 120, xp: 160 },
        durationMinutes: 60,
    },
];

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function LiveEventsProvider({ children }: { children: React.ReactNode }) {
    const { walkData, walkStats } = useActivity();
    const { weather } = useWeather();
    const { currentStreak, completedCount, totalCount } = useQuestEngine();

    const [activeEvents, setActiveEvents] = useState<LiveEvent[]>([]);
    const [flashChallenge, setFlashChallenge] = useState<LiveEvent | null>(null);
    const [liveWalkerCount, setLiveWalkerCount] = useState(0);
    const [neighborhoodRank, setNeighborhoodRank] = useState(1);
    const [neighborhoodScore, setNeighborhoodScore] = useState(0);

    const lastFlashRef = useRef<number>(0);
    const dismissedRef = useRef<Set<string>>(new Set());

    // ── Walker count güncelle ────────────────────────────────────────────────
    useEffect(() => {
        const update = () => {
            const hour = new Date().getHours();
            const score = weather?.walkScore ?? 75;
            setLiveWalkerCount(getSimulatedWalkerCount(hour, score));
        };
        update();
        const interval = setInterval(update, 45000); // 45 sn
        return () => clearInterval(interval);
    }, [weather]);

    // ── Mahalle sıralaması hesapla ───────────────────────────────────────────
    useEffect(() => {
        const score = (walkStats?.totalDistanceKm || 0) * 10 +
            (walkStats?.currentStreak || 0) * 50 +
            completedCount * 20;
        setNeighborhoodScore(score);
        // Simüle rank (gerçek DB olmadan yaklaşık)
        const rng = seedRandom((walkStats?.totalWalks || 0) + 42);
        const rank = Math.max(1, Math.floor(rng() * 25) + 1);
        setNeighborhoodRank(rank);
    }, [walkStats, completedCount]);

    // ── Event generator ──────────────────────────────────────────────────────
    const generateEvents = useCallback(() => {
        const now = getNow();
        const hour = new Date().getHours();
        const events: LiveEvent[] = [];

        // 1. Live walkers event (her 10 dk)
        if (liveWalkerCount > 5) {
            events.push({
                id: `live_walk_${Math.floor(now / 600000)}`,
                type: 'live_walkers',
                title: `${liveWalkerCount} kullanıcı şu an yürüyüşte!`,
                body: `${weather?.city || 'Şehrinde'} bugün yoğun aktivite var. Sen de katıl!`,
                cta: 'Yürüyüşe Başla',
                urgency: liveWalkerCount > 30 ? 'high' : 'medium',
                expiresAt: now + 10 * 60 * 1000,
                icon: '🏃',
                color: 'from-emerald-500 to-teal-500',
                ctaRoute: '/walk',
                actionKey: 'open-walk-panel',
            });
        }

        // 2. Hava fırsatı (walkScore iyi ama akşam yaklaşıyor)
        if (weather && weather.walkScore >= 75 && hour >= 17 && hour <= 19) {
            events.push({
                id: `weather_window_${Math.floor(now / 3600000)}`,
                type: 'weather_window',
                title: `${weather.emoji} Mükemmel yürüyüş havası!`,
                body: `${weather.condition} — ${weather.temp}°C. Akşam kararmadan şansını kullan.`,
                cta: 'Hemen Çık',
                urgency: 'high',
                expiresAt: now + 2 * 60 * 60 * 1000,
                icon: weather.emoji,
                color: 'from-sky-400 to-blue-500',
                ctaRoute: '/walk',
                reward: { pp: 30, xp: 45 },
            });
        }

        // 3. Streak tehlikesi event
        if (currentStreak > 3) {
            const secondsUntilMidnight = (() => {
                const now = new Date();
                const midnight = new Date();
                midnight.setHours(23, 59, 59, 999);
                return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
            })();

            if (secondsUntilMidnight < 10800 && completedCount === 0) { // Son 3 saat
                events.push({
                    id: `streak_danger_${Math.floor(now / 3600000)}`,
                    type: 'friend_passed',
                    title: `🔥 ${currentStreak} Günlük Serin Tehlikede!`,
                    body: `Gece yarısına ${Math.floor(secondsUntilMidnight / 60)} dk kaldı. Seriyi kurtarmak için yürü!`,
                    cta: 'Seriyi Kurtar',
                    urgency: 'critical',
                    expiresAt: now + secondsUntilMidnight * 1000,
                    icon: '🔥',
                    color: 'from-red-500 to-orange-600',
                    ctaRoute: '/walk',
                    actionKey: 'open-walk-panel',
                });
            }
        }

        // 4. Mahalle yarışı güncellemesi
        if (neighborhoodRank <= 5) {
            events.push({
                id: `neighborhood_${Math.floor(now / 7200000)}`,
                type: 'neighborhood_race',
                title: `🏆 Mahalle Yarışı — #${neighborhoodRank} Konumsun!`,
                body: `${weather?.city || 'Mahallenin'} en aktif sahibi olmak için yürümeye devam et.`,
                cta: 'Sıralamayı Gör',
                urgency: neighborhoodRank === 1 ? 'low' : 'medium',
                expiresAt: now + 2 * 60 * 60 * 1000,
                icon: neighborhoodRank === 1 ? '🥇' : neighborhoodRank === 2 ? '🥈' : '🥉',
                color: 'from-amber-500 to-yellow-500',
                actionKey: 'open-quest-panel',
            });
        }

        // Daha önce dismiss edilenleri filtrele
        const fresh = events.filter(e => !dismissedRef.current.has(e.id));
        setActiveEvents(fresh);
    }, [liveWalkerCount, weather, currentStreak, completedCount, neighborhoodRank]);

    // ── Flash Challenge tetikleyici ──────────────────────────────────────────
    useEffect(() => {
        // Her 45-90 dk arası rastgele flash challenge
        const schedule = () => {
            const delay = (45 + Math.random() * 45) * 60 * 1000;
            return setTimeout(() => {
                const now = getNow();
                if (now - lastFlashRef.current < 30 * 60 * 1000) return; // Min 30 dk ara

                const hour = new Date().getHours();
                // Uyku saatlerinde tetikleme
                if (hour < 7 || hour > 22) return;

                // Hava kötüyse yağmur challenge özellikle seç
                let pool = FLASH_CHALLENGES;
                if (weather && weather.walkScore < 50) {
                    pool = FLASH_CHALLENGES.filter(c => c.icon === '🌧️' || c.icon === '⚡');
                } else if (hour >= 21 || hour < 5) {
                    pool = FLASH_CHALLENGES.filter(c => c.icon === '🌙');
                } else {
                    pool = FLASH_CHALLENGES.filter(c => c.icon !== '🌙');
                }

                const template = pool[Math.floor(Math.random() * pool.length)];
                const event: LiveEvent = {
                    id: `flash_${now}`,
                    type: 'flash_challenge',
                    title: template.title,
                    body: template.body,
                    cta: template.cta,
                    urgency: 'critical',
                    expiresAt: now + template.durationMinutes * 60 * 1000,
                    icon: template.icon,
                    color: template.color,
                    reward: template.reward,
                    actionKey: 'open-walk-panel',
                };

                setFlashChallenge(event);
                lastFlashRef.current = now;
                schedule(); // Tekrar planla
            }, delay);
        };

        const hour = new Date().getHours();
        // Eğer şu an saat 21:00 ile 05:00 arasıysa ve henüz hiç flash trigger olmadıysa, Gece Gezginini HEMEN tetikle
        if ((hour >= 21 || hour < 5) && !lastFlashRef.current) {
            const template = FLASH_CHALLENGES.find(c => c.icon === '🌙');
            if (template) {
                const now = getNow();
                setFlashChallenge({
                    id: `flash_night_${now}`,
                    type: 'flash_challenge',
                    title: template.title,
                    body: template.body,
                    cta: template.cta,
                    urgency: 'critical',
                    expiresAt: now + template.durationMinutes * 60 * 1000,
                    icon: template.icon,
                    color: template.color,
                    reward: template.reward,
                    actionKey: 'open-walk-panel',
                });
                lastFlashRef.current = now;
            }
        }

        const timer = schedule();
        return () => clearTimeout(timer);
    }, [weather]);

    // ── Periyodik event yenileme ──────────────────────────────────────────────
    useEffect(() => {
        generateEvents();
        const interval = setInterval(generateEvents, 5 * 60 * 1000); // 5 dk
        return () => clearInterval(interval);
    }, [generateEvents]);

    // ── Süresi dolmuş eventleri temizle ──────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = getNow();
            setActiveEvents(prev => prev.filter(e => e.expiresAt > now));
            if (flashChallenge && flashChallenge.expiresAt < now) {
                setFlashChallenge(null);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [flashChallenge]);

    const dismissEvent = useCallback((id: string) => {
        dismissedRef.current.add(id);
        setActiveEvents(prev => prev.filter(e => e.id !== id));
        if (flashChallenge?.id === id) setFlashChallenge(null);
    }, [flashChallenge]);

    const acceptFlashChallenge = useCallback(() => {
        if (!flashChallenge) return;
        // Quest engine'e event gönder
        window.dispatchEvent(new CustomEvent('moffi-quest-trigger', {
            detail: { type: 'flash_challenge_accepted', reward: flashChallenge.reward }
        }));
        window.dispatchEvent(new CustomEvent('moffi-toast', {
            detail: {
                message: `⚡ Flash Görev Kabul Edildi! ${flashChallenge.reward?.pp} PP kazanabilirsin!`,
            }
        }));
        if (flashChallenge.actionKey === 'open-quest-panel') {
            window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'quests' }));
        } else if (flashChallenge.actionKey) {
            window.dispatchEvent(new CustomEvent(flashChallenge.actionKey));
        }
        setFlashChallenge(null);
    }, [flashChallenge]);

    return (
        <LiveEventsContext.Provider value={{
            activeEvents,
            flashChallenge,
            dismissEvent,
            acceptFlashChallenge,
            liveWalkerCount,
            neighborhoodRank,
            neighborhoodScore,
        }}>
            {children}
        </LiveEventsContext.Provider>
    );
}

export function useLiveEvents() {
    const ctx = useContext(LiveEventsContext);
    if (!ctx) throw new Error('useLiveEvents must be used within LiveEventsProvider');
    return ctx;
}
