'use client';

/**
 * MOFFI QUEST ENGINE v2
 * 
 * Referans: Duolingo (streak/mercy) + Pokémon GO (multi-stage) + Habitica (RPG) + NRC (gizli rozetler) + Strava (lig)
 * 
 * - 5 Kategori: pet, activity, social, explore, health
 * - 5 Zorluk: Pati → İz Sürücü → Kaşif → Kurt → Efsane
 * - Adaptif zorluk: kullanıcı geçmişine göre otomatik
 * - Çift döviz: XP (seviye) + PP (harcama)
 * - Gizli rozetler: habersizce kazanılır
 * - Aylık araştırma zinciri: 3 aşamalı Pokémon GO stili
 * - Mercy: Seri kalkanı + 48 saat affı + yağmur affı
 * - Event bus: sosyal aksiyonlar için
 */

import React, {
    createContext, useContext, useState, useEffect, useCallback, useRef, useMemo
} from 'react';
import { useActivity } from './ActivityContext';
import { useWeather } from './WeatherContext';
import { usePet } from './PetContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { haversineKm } from '@/lib/utils';
import { apiService, isSupabaseEnabled } from '@/services/apiService';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type QuestCategory = 'pet' | 'activity' | 'social' | 'explore' | 'health';
export type QuestDifficulty = 1 | 2 | 3 | 4 | 5;
export type QuestType =
    | 'distance'        // km cinsinden (walkData.distance / 1000)
    | 'duration'        // dakika cinsinden (walkData.time / 60)
    | 'streak'          // walkStats.currentStreak
    | 'cumulative_dist' // walkStats.totalDistanceKm
    | 'count'           // sayısal (post, yorum, vs.)
    | 'manual'          // kullanıcı tetikler (mama, su, vs.)
    | 'time_of_day'     // belirli saat aralığı + yürüyüş
    | 'weather_walk'    // kötü havada yürüyüş
    | 'page_visit';     // sayfa ziyareti

export interface Quest {
    id: string;
    templateId: string;
    title: string;
    description: string;
    icon: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    target: number;
    current: number;
    unit: string;
    reward: { pp: number; xp: number };
    completedAt?: string;
    isSecret?: boolean;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: QuestCategory;
    isHidden: boolean;
    earnedAt?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Faz 18: Meydan Okumalar - gerçek walkHistory/walkStats'ten türetilen,
// AYRICA persist edilmeyen (her render'da yeniden hesaplanan) salt-okunur
// ilerleme. `status` zaman penceresine göre (bu hafta/bu ay/süresiz) hesaplanır.
export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    current: number;
    target: number;
    unit: string;
    badgeId: string;
    status: 'active' | 'completed';
    // Ekran 11 (Meydan Okumalar) — design-reference/walk-final/'e göre her kartın
    // sağında gerçek bir ödül etiketi ("+500 Puan", "+Rozet" vb.) gösteriliyor.
    rewardLabel: string;
    rewardPp: number;
}

export interface ResearchTask {
    id: string;
    description: string;
    icon: string;
    type: QuestType;
    target: number;
    current: number;
    completed: boolean;
}

export interface ResearchStage {
    id: string;
    title: string;
    emoji: string;
    tasks: ResearchTask[];
    reward: { pp: number; xp: number; badgeId?: string; title?: string };
    completedAt?: string;
}

export interface MonthlyResearch {
    id: string;
    name: string;
    description: string;
    stages: ResearchStage[];
    currentStageIndex: number;
    completedAt?: string;
}

export interface QuestEngineContextType {
    // Günlük görevler
    dailyQuests: Quest[];
    completedCount: number;
    totalCount: number;

    // Hedefler — Baran'ın bulduğu gerçek kısıt: hedef tamamen sistem tarafından
    // (breed/geçmişe göre) belirleniyordu, kullanıcının değiştirebileceği hiçbir
    // yer yoktu. Artık gerçek bir kullanıcı tercihi var; "Otomatik" ise SADECE
    // bir seçenek — sistem hesaplamasını (autoDailyGoalKm) yerinde bırakıyor.
    dailyGoal: { distance: number; duration: number };
    autoDailyGoalKm: number;
    manualDailyGoalKm: number | null;
    setManualDailyGoalKm: (km: number | null) => void;
    progressPercent: number;
    durationPercent: number;
    // Bugün tamamlanan yürüyüşler + (varsa) şu an aktif yürüyüşün canlı değeri.
    // progressPercent/durationPercent AYNI bu iki değerden hesaplanıyor - hub
    // ekranındaki büyük sayı ile ilerleme çubuğu artık birbirini tutuyor.
    todayDistanceKm: number;
    todayDurationMin: number;

    // Aylık araştırma
    monthlyResearch: MonthlyResearch | null;

    // Faz 18: Meydan Okumalar - gerçek, türetilen ilerleme (bkz. Challenge)
    challenges: Challenge[];

    // Rozetler
    badges: Badge[];
    earnedBadges: Badge[];
    // Ekran 7/13 — en yakın kazanılmamış rozetin gerçek ilerlemesi (yoksa null,
    // uydurma bir yüzde asla üretilmez, bkz. getClosestBadgeProgress)
    closestBadgeProgress: { badge: Badge; current: number; target: number; percent: number } | null;
    // Ekran 13 (Rozetler) — badge id'sinden gerçek {current,target,percent}'e
    // eşleme; sadece güvenilir hesaplama yapılabilen rozetler için anahtar var
    badgeProgress: Record<string, { current: number; target: number; percent: number }>;

    // Ekonomi
    totalPatiPuan: number;
    totalXP: number;
    level: number;
    levelTitle: string;
    levelXpCurrent: number;
    levelXpRequired: number;
    todayEarned: { pp: number; xp: number };

    // Streak
    currentStreak: number;
    streakShieldAvailable: boolean;
    useStreakShield: () => Promise<void>;

    // Faz 6/9: aktif yürüyüş sırasında kazanılan rozet (yoksa null) — merkezi,
    // sayfa/panel geçişlerinde kaybolmayan tek kaynak
    lastEarnedBadge: { name: string; icon: string } | null;
    // Faz 6/9: SADECE bu yürüyüşte kazanılan PP (todayEarned.pp'nin aksine günün
    // tamamını değil, walk start'tan bu yana biriken tutarı temsil eder)
    walkPpEarned: number;

    // Günlük pullar (7-pul sistemi)
    weeklyStamps: number;
    maxWeeklyStamps: number;

    // Tetikleyiciler
    triggerQuestEvent: (type: string, data?: Record<string, unknown>) => void;
    completeManualQuest: (questId: string) => void;
    spendPatiPuan: (amount: number) => boolean;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'moffi_quest_engine_v2';
const PUAN_KEY = 'moffi_total_pp_v2';
const XP_KEY = 'moffi_total_xp_v2';
const BADGES_KEY = 'moffi_earned_badges_v2';
const RESEARCH_KEY = 'moffi_research_v2';
const STAMPS_KEY = 'moffi_weekly_stamps_v2';
const LAST_STAMP_DATE_KEY = 'moffi_last_stamp_date_v2';
// Faz 12: "photographer" rozeti ("10 post paylaş") tanımlıydı ama hiçbir kod onu
// tetiklemiyordu — mevcut post sayaçları (socialCountsRef) GÜNLÜK sıfırlanıyor,
// 10 gibi bir ömür boyu eşiği asla karşılayamaz. Ayrı, hiç sıfırlanmayan bir sayaç.
const LIFETIME_POSTS_KEY = 'moffi_lifetime_posts_v1';

// ─── LEVEL SYSTEM ─────────────────────────────────────────────────────────────

const LEVELS = [
    { min: 0,     max: 500,    title: 'Moffi Çırağı',   emoji: '🐾' },
    { min: 500,   max: 2000,   title: 'İz Sürücü',      emoji: '🐕' },
    { min: 2000,  max: 5000,   title: 'Kaşif',           emoji: '🦊' },
    { min: 5000,  max: 15000,  title: 'Kurt',             emoji: '🐺' },
    { min: 15000, max: 50000,  title: 'Moffi Efsanesi', emoji: '🦁' },
    { min: 50000, max: Infinity, title: 'Efsane Ötesi',  emoji: '👑' },
];

function getLevelInfo(xp: number) {
    const idx = LEVELS.findIndex(l => xp >= l.min && xp < l.max);
    const level = idx >= 0 ? idx : LEVELS.length - 1;
    const info = LEVELS[Math.min(level, LEVELS.length - 1)];
    const next = LEVELS[Math.min(level + 1, LEVELS.length - 1)];
    return {
        level: level + 1,
        levelTitle: `${info.emoji} ${info.title}`,
        levelXpCurrent: xp - info.min,
        levelXpRequired: next.min - info.min,
    };
}

// ─── ADAPTIVE DIFFICULTY ──────────────────────────────────────────────────────

function getAdaptiveDifficulty(totalWalks: number, streak: number): QuestDifficulty {
    if (totalWalks === 0) return 1;
    if (totalWalks <= 10) return 2;
    if (totalWalks <= 30 || streak < 7) return 3;
    if (totalWalks <= 100 || streak < 30) return 4;
    return 5;
}

// ─── DAILY GOAL ENGINE ────────────────────────────────────────────────────────

// Piyasa araştırması #10: Tails uygulamasının ırk/yaş/boyuta göre ayarlı hedef
// fikri — pet'in GERÇEK `size` alanına (PetContext'te zaten var: Mini/Küçük/
// Orta/Büyük/Dev) göre bir çarpan uygulanıyor. Önceden bu fonksiyon SADECE
// kullanıcının geçmiş performansına bakıyordu, pet'in fiziksel büyüklüğünü hiç
// hesaba katmıyordu — bir Chihuahua için 3km hedef, bir Kangal için 3km
// hedeften çok farklı bir zorluk demek.
const PET_SIZE_GOAL_MULTIPLIER: Record<string, number> = {
    'Mini': 0.6,
    'Küçük': 0.8,
    'Orta': 1.0,
    'Büyük': 1.15,
    'Dev': 1.3,
};

function computeDailyGoal(walkStats: any, petSize?: string): { distance: number; duration: number } {
    const totalWalks = walkStats?.totalWalks || 0;
    const avgDist = walkStats?.averageDistanceKm || 0;
    const avgDur = walkStats
        ? (walkStats.totalDurationMinutes / Math.max(1, walkStats.totalWalks))
        : 0;
    const streak = walkStats?.currentStreak || 0;

    let distance = 1.5;
    let duration = 20;

    if (totalWalks === 0) { distance = 1.5; duration = 20; }
    else if (totalWalks <= 5) { distance = 2.0; duration = 25; }
    else if (totalWalks <= 20) {
        distance = Math.max(2.0, avgDist * 1.1);
        duration = Math.max(20, avgDur * 1.1);
    } else {
        distance = Math.max(3.0, avgDist * 1.1);
        duration = Math.max(30, avgDur * 1.1);
    }

    if (streak >= 7) { distance += 0.2; duration += 5; }

    const sizeMultiplier = (petSize && PET_SIZE_GOAL_MULTIPLIER[petSize]) || 1.0;
    distance *= sizeMultiplier;
    duration *= sizeMultiplier;

    return {
        distance: Math.round(distance * 10) / 10,
        duration: Math.round(duration),
    };
}

// ─── BADGE POOL ───────────────────────────────────────────────────────────────

const BADGE_POOL: Badge[] = [
    { id: 'first_step', name: 'İlk Adım', description: 'İlk yürüyüşünü tamamladın', icon: '🥾', category: 'activity', isHidden: false, rarity: 'common' },
    { id: 'morning_bird', name: 'Sabah Kuşu', description: 'Sabah 07:00 öncesi yürüyüş', icon: '🌅', category: 'health', isHidden: true, rarity: 'rare' },
    { id: 'night_walker', name: 'Gece Gezgini', description: 'Gece 21:00 sonrası yürüyüş', icon: '🌙', category: 'health', isHidden: true, rarity: 'rare' },
    { id: 'rain_hero', name: 'Yağmur Kahramanı', description: 'Yağmurda yürüyüş yaptın', icon: '🌧️', category: 'activity', isHidden: true, rarity: 'epic' },
    { id: 'week_fire', name: 'Haftanın Ateşi', description: '7 günlük seri', icon: '🔥', category: 'activity', isHidden: false, rarity: 'rare' },
    { id: 'winter_warrior', name: 'Kış Savaşçısı', description: '5°C altında yürüyüş', icon: '❄️', category: 'activity', isHidden: true, rarity: 'epic' },
    { id: 'social_dog', name: 'Sosyal Köpek', description: '10 farklı posta like at', icon: '👥', category: 'social', isHidden: false, rarity: 'common' },
    { id: 'photographer', name: 'Fotoğrafçı', description: '10 post paylaş', icon: '📸', category: 'social', isHidden: false, rarity: 'common' },
    { id: 'explorer_100', name: 'Büyük Kaşif', description: 'Toplam 100 km yürüyüş', icon: '🌍', category: 'activity', isHidden: false, rarity: 'legendary' },
    { id: 'month_fire', name: 'Aylık Alev', description: '30 günlük kesintisiz seri', icon: '🏆', category: 'activity', isHidden: false, rarity: 'epic' },
    { id: 'pet_care_week', name: 'Özenli Sahip', description: '7 gün mama kaydı tut', icon: '🐾', category: 'pet', isHidden: false, rarity: 'common' },
    { id: 'birthday_walk', name: 'Doğum Günü Koşucusu', description: 'Pet doğum gününde yürü', icon: '🎂', category: 'pet', isHidden: true, rarity: 'legendary' },
    { id: 'first_post', name: 'İlk Gönderi', description: 'İlk postunu paylaştın', icon: '✨', category: 'social', isHidden: false, rarity: 'common' },
    { id: 'research_complete', name: 'Araştırmacı', description: 'Aylık araştırmayı tamamla', icon: '🔭', category: 'explore', isHidden: false, rarity: 'epic' },
    // Faz 18 (Meydan Okumalar gerçek implementasyonu) rozetleri:
    { id: 'monthly_explorer', name: 'Aylık Gezgin', description: 'Bu ay toplam 100 km yürü', icon: '🗻', category: 'explore', isHidden: false, rarity: 'epic' },
    { id: 'park_hopper', name: 'Park Kaşifi', description: 'Bu hafta 5 farklı yerde yürü', icon: '🌳', category: 'explore', isHidden: false, rarity: 'rare' },
    { id: 'region_explorer', name: 'Şehir Kaşifi', description: 'Kendi şehrinde 10 farklı bölge keşfet', icon: '🗺️', category: 'explore', isHidden: false, rarity: 'legendary' },
];

// Ekran 7 (Yürüyüş Sonucu) ve Ekran 13 (Rozetler) — design-reference/walk-final/'de
// kilitlenen "en yakın kazanılmamış rozetin gerçek ilerlemesi" gösterimi için ortak
// hesaplayıcı. Ekran 13 (Rozetler) için kurulan `badgeProgress` haritasının
// (bkz. aşağıda, provider içinde) aynısını paylaşıyor — iki ayrı hesaplama
// kopyası yerine tek bir gerçek kaynak. BİLEREK sadece o haritada yer alan,
// güvenilir/sürekli gerçek veriye sahip rozetler arasından seçiyor.
function getClosestBadgeProgress(
    badgeProgress: Record<string, { current: number; target: number; percent: number }>,
    earnedBadgeIds: string[]
) {
    const unearned = Object.entries(badgeProgress)
        .filter(([id]) => !earnedBadgeIds.includes(id))
        .map(([id, v]) => ({ id, ...v }));
    if (unearned.length === 0) return null;
    unearned.sort((a, b) => b.percent - a.percent);
    const closest = unearned[0];
    const badge = BADGE_POOL.find(b => b.id === closest.id);
    if (!badge) return null;
    return { badge, current: closest.current, target: closest.target, percent: closest.percent };
}

// ─── QUEST TEMPLATE POOL ─────────────────────────────────────────────────────

interface QuestTemplate {
    templateId: string;
    title: string;
    descFn: (target: number, goal: { distance: number; duration: number }) => string;
    icon: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    targetFn: (goal: { distance: number; duration: number }, stats: any) => number;
    unit: string;
    reward: { pp: number; xp: number };
    condition?: (weather: any, stats: any, hour: number) => boolean;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
    // ── PET BAKIMI ─────────────────────────────────────────────────────────
    {
        templateId: 'pet_feed',
        title: 'Mama Vakti',
        descFn: () => 'Dostunun mama kasesini doldur',
        icon: '🍖',
        category: 'pet',
        difficulty: 1,
        type: 'manual',
        targetFn: () => 1,
        unit: 'kez',
        reward: { pp: 10, xp: 15 },
    },
    {
        templateId: 'pet_water',
        title: 'Su Sevgisi',
        descFn: () => 'Dostun için taze su koy',
        icon: '💧',
        category: 'pet',
        difficulty: 1,
        type: 'manual',
        targetFn: () => 1,
        unit: 'kez',
        reward: { pp: 8, xp: 10 },
    },
    {
        templateId: 'pet_weigh',
        title: 'Kilo Takibi',
        descFn: () => 'Dostunu tartıp kaydet',
        icon: '⚖️',
        category: 'pet',
        difficulty: 2,
        type: 'manual',
        targetFn: () => 1,
        unit: 'kez',
        reward: { pp: 15, xp: 20 },
    },
    {
        templateId: 'pet_vet',
        title: 'Vet Randevusu',
        descFn: () => 'Bir vet randevusu oluştur',
        icon: '🏥',
        category: 'pet',
        difficulty: 2,
        type: 'manual',
        targetFn: () => 1,
        unit: 'kez',
        reward: { pp: 20, xp: 30 },
    },
    {
        templateId: 'pet_feed_week',
        title: '7 Gün Mama Serisi',
        descFn: () => '7 gün boyunca mama kaydı tut',
        icon: '🌟',
        category: 'pet',
        difficulty: 3,
        type: 'manual',
        targetFn: () => 7,
        unit: 'gün',
        reward: { pp: 40, xp: 60 },
    },

    // ── AKTİVİTE ───────────────────────────────────────────────────────────
    {
        templateId: 'first_walk',
        title: 'İlk Adım',
        descFn: () => 'Dostunla ilk yürüyüşünü yap',
        icon: '🌅',
        category: 'activity',
        difficulty: 1,
        type: 'distance',
        targetFn: () => 0.5,
        unit: 'km',
        reward: { pp: 25, xp: 40 },
    },
    {
        templateId: 'walk_1km',
        title: '1 Km Yürüyüş',
        descFn: () => 'Dostunla 1 km yürüyüş yap',
        icon: '🐕',
        category: 'activity',
        difficulty: 1,
        type: 'distance',
        targetFn: () => 1.0,
        unit: 'km',
        reward: { pp: 20, xp: 30 },
    },
    {
        templateId: 'walk_daily_dist',
        title: 'Günlük Mesafe',
        descFn: (t) => `Bugün ${t} km yürü`,
        icon: '🚶',
        category: 'activity',
        difficulty: 2,
        type: 'distance',
        targetFn: (g) => g.distance,
        unit: 'km',
        reward: { pp: 30, xp: 50 },
    },
    {
        templateId: 'walk_3km',
        title: 'Uzun Yürüyüş',
        descFn: () => 'Tek seferde 3 km yürü',
        icon: '🏃',
        category: 'activity',
        difficulty: 2,
        type: 'distance',
        targetFn: () => 3.0,
        unit: 'km',
        reward: { pp: 50, xp: 70 },
    },
    {
        templateId: 'walk_duration',
        title: 'Zaman Ustası',
        descFn: (t) => `${t} dakika yürüyüş yap`,
        icon: '⏱️',
        category: 'activity',
        difficulty: 2,
        type: 'duration',
        targetFn: (g) => g.duration,
        unit: 'dk',
        reward: { pp: 25, xp: 40 },
    },
    {
        templateId: 'streak_3',
        title: '3 Günlük Seri',
        descFn: () => '3 gün art arda yürüyüş yap',
        icon: '🔥',
        category: 'activity',
        difficulty: 2,
        type: 'streak',
        targetFn: () => 3,
        unit: 'gün',
        reward: { pp: 45, xp: 60 },
    },
    {
        templateId: 'streak_7',
        title: '7 Günlük Seri',
        descFn: () => '7 gün kesintisiz yürüyüş',
        icon: '⚡',
        category: 'activity',
        difficulty: 3,
        type: 'streak',
        targetFn: () => 7,
        unit: 'gün',
        reward: { pp: 100, xp: 150 },
    },
    {
        templateId: 'bad_weather_walk',
        title: 'Hava Fark Etmez',
        descFn: () => 'Kötü havada 2 km yürü',
        icon: '🌧️',
        category: 'activity',
        difficulty: 3,
        type: 'weather_walk',
        targetFn: () => 2.0,
        unit: 'km',
        reward: { pp: 70, xp: 100 },
        condition: (weather) => weather && (weather.walkScore <= 60 || weather.temp <= 5),
    },
    {
        templateId: 'morning_walk',
        title: 'Sabah Yürüyüşü',
        descFn: () => 'Sabah 07-09 arasında yürüyüş yap',
        icon: '☀️',
        category: 'activity',
        difficulty: 3,
        type: 'time_of_day',
        targetFn: () => 1.0,
        unit: 'km',
        reward: { pp: 30, xp: 45 },
        condition: (_w, _s, hour) => hour >= 7 && hour < 9,
    },
    {
        templateId: 'evening_walk',
        title: 'Akşam Gezisi',
        descFn: () => 'Akşam 18:00 sonrası yürüyüş yap',
        icon: '🌆',
        category: 'activity',
        difficulty: 2,
        type: 'time_of_day',
        targetFn: () => 1.0,
        unit: 'km',
        reward: { pp: 30, xp: 40 },
        condition: (_w, _s, hour) => hour >= 18,
    },
    {
        templateId: 'streak_30',
        title: '30 Günlük Ateş',
        descFn: () => '30 günlük kesintisiz seri kur',
        icon: '🏆',
        category: 'activity',
        difficulty: 4,
        type: 'streak',
        targetFn: () => 30,
        unit: 'gün',
        reward: { pp: 300, xp: 500 },
    },
    {
        templateId: 'cumulative_50km',
        title: '50 Km Lejyoner',
        descFn: () => 'Toplam 50 km yürüyüş yap',
        icon: '🌍',
        category: 'activity',
        difficulty: 4,
        type: 'cumulative_dist',
        targetFn: () => 50,
        unit: 'km',
        reward: { pp: 200, xp: 350 },
    },
    {
        templateId: 'cumulative_100km',
        title: '100 Km Efsanesi',
        descFn: () => 'Toplam 100 km yürüyüş yap',
        icon: '👑',
        category: 'activity',
        difficulty: 5,
        type: 'cumulative_dist',
        targetFn: () => 100,
        unit: 'km',
        reward: { pp: 500, xp: 800 },
    },

    // ── SOSYAL ─────────────────────────────────────────────────────────────
    {
        templateId: 'first_post',
        title: 'İlk Gönderi',
        descFn: () => 'İlk postunu paylaş',
        icon: '📸',
        category: 'social',
        difficulty: 1,
        type: 'count',
        targetFn: () => 1,
        unit: 'post',
        reward: { pp: 15, xp: 25 },
    },
    {
        templateId: 'first_comment',
        title: 'Yorum Yap',
        descFn: () => 'Bir posta yorum yap',
        icon: '💬',
        category: 'social',
        difficulty: 1,
        type: 'count',
        targetFn: () => 1,
        unit: 'yorum',
        reward: { pp: 10, xp: 15 },
    },
    {
        templateId: 'five_posts',
        title: '5 Gönderi',
        descFn: () => 'Toplam 5 post paylaş',
        icon: '🌟',
        category: 'social',
        difficulty: 2,
        type: 'count',
        targetFn: () => 5,
        unit: 'post',
        reward: { pp: 35, xp: 50 },
    },
    {
        templateId: 'ten_likes',
        title: 'Beğeni Ustası',
        descFn: () => '10 farklı posta beğeni at',
        icon: '❤️',
        category: 'social',
        difficulty: 2,
        type: 'count',
        targetFn: () => 10,
        unit: 'beğeni',
        reward: { pp: 30, xp: 40 },
    },

    // ── KEŞİF ──────────────────────────────────────────────────────────────
    {
        templateId: 'visit_petshop',
        title: 'Petshop Keşfi',
        descFn: () => 'Petshop bölümünü ziyaret et',
        icon: '🛍️',
        category: 'explore',
        difficulty: 1,
        type: 'page_visit',
        targetFn: () => 1,
        unit: 'ziyaret',
        reward: { pp: 10, xp: 15 },
    },
    {
        templateId: 'try_ai',
        title: 'AI Deneyimi',
        descFn: () => 'AI özelliğini ilk kez dene',
        icon: '🤖',
        category: 'explore',
        difficulty: 1,
        type: 'page_visit',
        targetFn: () => 1,
        unit: 'kez',
        reward: { pp: 15, xp: 25 },
    },

    // ── SAĞLIK ──────────────────────────────────────────────────────────────
    {
        templateId: 'both_walks',
        title: 'Çift Yürüyüş',
        descFn: () => 'Hem sabah hem akşam yürüyüşü yap',
        icon: '🌓',
        category: 'health',
        difficulty: 3,
        type: 'count',
        targetFn: () => 2,
        unit: 'yürüyüş',
        reward: { pp: 60, xp: 90 },
    },
    {
        templateId: 'weekly_active',
        title: 'Haftalık Aktif',
        descFn: () => 'Bu hafta 150 dk aktif kal',
        icon: '💪',
        category: 'health',
        difficulty: 4,
        type: 'duration',
        targetFn: () => 150,
        unit: 'dk',
        reward: { pp: 120, xp: 180 },
    },
];

// ─── MONTHLY RESEARCH ─────────────────────────────────────────────────────────

// Faz 18: tam bir coğrafi kümeleme altyapısı (POI/bölge veritabanı) yok -
// bunun yerine gerçek GPS başlangıç noktalarını basit bir haversine mesafesiyle
// (bkz. @/lib/utils, Ekran 9 hız hesaplaması da aynı fonksiyonu kullanıyor)
// kümeleyip "birbirinden en az `radiusKm` uzak farklı nokta sayısı"nı gerçek
// veriden hesaplıyoruz. Uydurma değil, ama tam bir "bölge/mahalle" kavramı da
// değil - iki farklı yarıçapla iki farklı granülerlikte kullanılıyor
// ("farklı park" için dar, "farklı bölge" için geniş yarıçap).

function countDistinctLocations(startPoints: [number, number][], radiusKm: number): number {
    const clusters: [number, number][] = [];
    startPoints.forEach(p => {
        if (clusters.every(c => haversineKm(c, p) > radiusKm)) clusters.push(p);
    });
    return clusters.length;
}

function getMonthlyResearch(monthKey: string): MonthlyResearch {
    return {
        id: `research_${monthKey}`,
        name: "Moffi'nin Büyük Macerası",
        description: "Dostunla bu ay epik bir yolculuğa çık!",
        currentStageIndex: 0,
        stages: [
            {
                id: 'stage_1',
                title: 'İlk Adımlar',
                emoji: '🐾',
                tasks: [
                    { id: 't1_1', description: 'Bu hafta 3 yürüyüş tamamla', icon: '🚶', type: 'count', target: 3, current: 0, completed: false },
                    { id: 't1_2', description: 'Toplam 3 km yürü', icon: '📍', type: 'distance', target: 3, current: 0, completed: false },
                    { id: 't1_3', description: 'İlk postunu paylaş', icon: '📸', type: 'count', target: 1, current: 0, completed: false },
                ],
                reward: { pp: 500, xp: 750, badgeId: 'first_step', title: 'Kaşif' },
            },
            {
                id: 'stage_2',
                title: 'Mahalleni Fethet',
                emoji: '🐕',
                tasks: [
                    { id: 't2_1', description: '2 farklı rotada yürü', icon: '🗺️', type: 'count', target: 2, current: 0, completed: false },
                    { id: 't2_2', description: 'Toplam 10 km yürü', icon: '🏃', type: 'cumulative_dist', target: 10, current: 0, completed: false },
                    { id: 't2_3', description: '45 dk kesintisiz yürüyüş', icon: '⏱️', type: 'duration', target: 45, current: 0, completed: false },
                ],
                reward: { pp: 1000, xp: 1500, badgeId: 'pet_care_week', title: 'Mahalle Ustası' },
            },
            {
                id: 'stage_3',
                title: 'Şehrin Efendisi',
                emoji: '🦊',
                tasks: [
                    { id: 't3_1', description: '7 günlük seri kur', icon: '🔥', type: 'streak', target: 7, current: 0, completed: false },
                    { id: 't3_2', description: 'Toplam 20 km yürü', icon: '🌍', type: 'cumulative_dist', target: 20, current: 0, completed: false },
                    { id: 't3_3', description: '5 topluluk postu paylaş', icon: '📸', type: 'count', target: 5, current: 0, completed: false },
                ],
                reward: { pp: 2500, xp: 3500, badgeId: 'research_complete', title: 'Şehir Efsanesi' },
            },
        ],
    };
}

// ─── QUEST SELECTION ──────────────────────────────────────────────────────────

function selectDailyQuests(
    difficulty: QuestDifficulty,
    goal: { distance: number; duration: number },
    weather: any,
    walkStats: any,
    dateStr: string
): Quest[] {
    const hour = new Date().getHours();
    const seedNum = parseInt(dateStr.replace(/-/g, ''), 10);
    const hash = (n: number) => (n * 2654435761) >>> 0;

    // Koşulları filtrele
    const available = QUEST_TEMPLATES.filter(t => {
        // Zorluk: max difficulty+1 görev göster (daha kolular da çıkabilir)
        if (t.difficulty > Math.min(difficulty + 1, 5)) return false;
        if (t.condition) return t.condition(weather, walkStats, hour);
        return true;
    });

    // Kategorilere göre seç (dengeli dağılım)
    const byCategory: Record<string, QuestTemplate[]> = {};
    for (const t of available) {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(t);
    }

    const selected: QuestTemplate[] = [];
    const categories: QuestCategory[] = ['activity', 'pet', 'social', 'explore', 'health'];

    // Her kategoriden 1 görev seç (önce activity'den 2)
    const activityPool = byCategory['activity'] || [];
    if (activityPool.length > 0) {
        const idx1 = hash(seedNum + 0) % activityPool.length;
        selected.push(activityPool[idx1]);
        const idx2 = hash(seedNum + 1) % activityPool.length;
        if (idx2 !== idx1) selected.push(activityPool[idx2]);
    }

    for (const cat of categories.filter(c => c !== 'activity')) {
        const pool = byCategory[cat] || [];
        if (pool.length === 0) continue;
        const idx = hash(seedNum + categories.indexOf(cat) + 10) % pool.length;
        selected.push(pool[idx]);
    }

    // Max 6 görev
    const final = selected.slice(0, 6);

    return final.map((t, i): Quest => ({
        id: `${t.templateId}_${dateStr}`,
        templateId: t.templateId,
        title: t.title,
        description: t.descFn(t.targetFn(goal, walkStats), goal),
        icon: t.icon,
        category: t.category,
        difficulty: t.difficulty,
        type: t.type,
        target: parseFloat(t.targetFn(goal, walkStats).toFixed(2)),
        current: 0,
        unit: t.unit,
        reward: t.reward,
        completedAt: undefined,
    }));
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const QuestEngineContext = createContext<QuestEngineContextType | undefined>(undefined);

function getTodayStr() { return new Date().toLocaleDateString('sv-SE'); }
function getMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function QuestEngineProvider({ children }: { children: React.ReactNode }) {
    const { walkData, walkStats, walkHistory } = useActivity();
    const { weather } = useWeather();
    const { activePet } = usePet();
    const { user } = useAuth();

    const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
    const [totalPatiPuan, setTotalPatiPuan] = useState(0);
    const [totalXP, setTotalXP] = useState(0);
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
    const [monthlyResearch, setMonthlyResearch] = useState<MonthlyResearch | null>(null);
    const [todayEarned, setTodayEarned] = useState({ pp: 0, xp: 0 });
    const [weeklyStamps, setWeeklyStamps] = useState(0);
    const [streakShieldAvailable, setStreakShieldAvailable] = useState(true);
    // Faz 6/9 kontrolü: "bu yürüyüşte kazanılan rozet" artık burada, merkezi olarak
    // tutuluyor. Öncesinde WalkQuickSheet ve tracking sayfası kendi yerel state'lerinde
    // ayrı ayrı dinliyordu — ama WalkQuickSheet, /walk/tracking'e geçildiğinde
    // (DynamicNavigation o rotada tamamen unmount oluyor) tamamen kayboluyor, sonra
    // kullanıcı yürüyüşe devam edip eve dönüp paneli yeniden açtığında state sıfırdan
    // başlıyordu — yürüyüş sırasında kazanılan bir rozet sessizce kayboluyordu.
    const [lastEarnedBadge, setLastEarnedBadge] = useState<{ name: string; icon: string } | null>(null);
    // Faz 6/9 kontrolü: aynı sebep — todayEarned.pp GÜN BOYUNCA kümülatif, bir kullanıcı
    // aynı gün 2. bir yürüyüş yaparsa sonuç ekranı yanlışlıkla ilk yürüyüşün puanını da
    // "bu yürüyüşte kazanıldı" gibi gösterirdi. Bu, sadece aktif yürüyüş sırasında
    // kazanılanı tutar, walk start'ta sıfırlanır.
    const [walkPpEarned, setWalkPpEarned] = useState(0);
    const wasWalkActiveRef = useRef(false);

    // Social event counters (günlük)
    const socialCountsRef = useRef({ posts: 0, comments: 0, likes: 0 });
    // Faz 12: "photographer" rozeti için ömür boyu (hiç sıfırlanmayan) post sayacı
    const lifetimePostCountRef = useRef(0);
    const notifiedRef = useRef<Set<string>>(new Set());
    const initializedRef = useRef(false);
    const userIdRef = useRef<string | null>(null);

    // Baran'ın bulduğu gerçek kısıt: günlük hedef tamamen otomatikti, kullanıcının
    // hiçbir müdahale şansı yoktu. Artık gerçek bir tercih: `null` = "Otomatik"
    // (sistem hesaplaması aynen çalışmaya devam ediyor), bir sayı = kullanıcının
    // kendi seçtiği sabit hedef.
    const [manualDailyGoalKm, setManualDailyGoalKmState] = useState<number | null>(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('moffi_manual_daily_goal_km');
        return saved ? parseFloat(saved) : null;
    });
    const setManualDailyGoalKm = useCallback((km: number | null) => {
        setManualDailyGoalKmState(km);
        if (km === null) localStorage.removeItem('moffi_manual_daily_goal_km');
        else localStorage.setItem('moffi_manual_daily_goal_km', String(km));
    }, []);
    const autoDailyGoal = computeDailyGoal(walkStats, activePet?.size);
    const autoDailyGoalKm = autoDailyGoal.distance;
    const dailyGoal = manualDailyGoalKm != null
        // Süre, otomatik hedefin kendi mesafe/süre oranı korunarak orantılanıyor —
        // uydurma sabit bir süre değil, sistemin zaten hesapladığı gerçek tempoya göre.
        ? { distance: manualDailyGoalKm, duration: Math.round((autoDailyGoal.duration / Math.max(0.1, autoDailyGoal.distance)) * manualDailyGoalKm) }
        : autoDailyGoal;

    // ── Başlatma ──────────────────────────────────────────────────────────
    useEffect(() => {
        const todayStr = getTodayStr();
        const monthKey = getMonthKey();

        // PP + XP yükle
        const storedPP = localStorage.getItem(PUAN_KEY);
        const storedXP = localStorage.getItem(XP_KEY);
        if (storedPP) setTotalPatiPuan(parseInt(storedPP, 10) || 0);
        if (storedXP) setTotalXP(parseInt(storedXP, 10) || 0);

        // Faz 12: ömür boyu post sayacı yükle
        lifetimePostCountRef.current = parseInt(localStorage.getItem(LIFETIME_POSTS_KEY) || '0', 10) || 0;

        // Rozet yükle
        const storedBadges = localStorage.getItem(BADGES_KEY);
        if (storedBadges) {
            try { setEarnedBadgeIds(JSON.parse(storedBadges)); } catch { /* ignore */ }
        }

        // Faz 8: Seri kalkanı artık gerçek DB'den okunuyor (bkz. aşağıdaki ayrı useEffect) —
        // burada localStorage'dan okunmuyor, çünkü eski sistemde bu flag'in gerçek seri
        // hesaplamasına hiçbir etkisi yoktu (bkz. CLAUDE.md Faz 8 notu).

        // Haftalık pullar
        const stampsStr = localStorage.getItem(STAMPS_KEY);
        if (stampsStr) {
            try {
                const parsed = JSON.parse(stampsStr);
                if (parsed && parsed.weekStart === getWeekStart()) {
                    setWeeklyStamps(parsed.count || 0);
                }
            } catch { /* ignore */ }
        }

        // Günlük görevler yükle / oluştur
        const storedQuests = localStorage.getItem(STORAGE_KEY);
        const difficulty = getAdaptiveDifficulty(walkStats?.totalWalks || 0, walkStats?.currentStreak || 0);

        let loaded = false;
        if (storedQuests) {
            try {
                const parsed = JSON.parse(storedQuests);
                if (parsed && parsed.date === todayStr) {
                    setDailyQuests(parsed.quests || []);
                    setTodayEarned(parsed.todayEarned || { pp: 0, xp: 0 });
                    socialCountsRef.current = parsed.socialCounts || { posts: 0, comments: 0, likes: 0 };
                    loaded = true;
                }
            } catch { /* ignore */ }
        }

        if (!loaded) {
            const newQuests = selectDailyQuests(difficulty, dailyGoal, weather, walkStats, todayStr);
            setDailyQuests(newQuests);
            setTodayEarned({ pp: 0, xp: 0 });
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, quests: newQuests, todayEarned: { pp: 0, xp: 0 }, socialCounts: socialCountsRef.current }));
        }

        // Aylık araştırma yükle / oluştur
        let loadedResearch = false;
        const storedResearch = localStorage.getItem(RESEARCH_KEY);
        if (storedResearch) {
            try {
                const parsed = JSON.parse(storedResearch);
                if (parsed && parsed.id === `research_${monthKey}`) {
                    setMonthlyResearch(parsed);
                    loadedResearch = true;
                }
            } catch { /* ignore */ }
        }

        if (!loadedResearch) {
            const newResearch = getMonthlyResearch(monthKey);
            setMonthlyResearch(newResearch);
            localStorage.setItem(RESEARCH_KEY, JSON.stringify(newResearch));
        }

        initializedRef.current = true;
    }, []); // eslint-disable-line

    // Faz 7: Moffi Puanı gerçek bakiyeyle uzlaştır — localStorage anlık/önbellek olarak
    // kalır (hızlı ilk render için), ama gerçek kaynak artık profiles.pati_puan_balance.
    // coin_balance/PawCoin'e HİÇ dokunmuyor, tamamen ayrı bir alan.
    useEffect(() => {
        if (!isSupabaseEnabled || !user?.id) return;
        apiService.getPatiPuanBalance().then(realBalance => {
            setTotalPatiPuan(realBalance);
            localStorage.setItem(PUAN_KEY, String(realBalance));
        }).catch(err => console.error('Moffi Puanı bakiyesi alınamadı:', err));
    }, [user?.id]);

    // Faz 8: gerçek seri kalkanı durumunu DB'den al (localStorage'daki eski flag'in
    // yerine — o flag gerçek seri hesabına hiç etki etmiyordu)
    useEffect(() => {
        if (!isSupabaseEnabled || !user?.id) return;
        apiService.getStreakShieldStatus().then(status => {
            setStreakShieldAvailable(status.available);
        }).catch(err => console.error('Seri kalkanı durumu alınamadı:', err));
    }, [user?.id]);

    // ── Gece yarısı reset ─────────────────────────────────────────────────
    useEffect(() => {
        const check = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;
            try {
                const parsed = JSON.parse(stored);
                const todayStr = getTodayStr();
                if (parsed.date !== todayStr) {
                    const difficulty = getAdaptiveDifficulty(walkStats?.totalWalks || 0, walkStats?.currentStreak || 0);
                    const newQuests = selectDailyQuests(difficulty, dailyGoal, weather, walkStats, todayStr);
                    setDailyQuests(newQuests);
                    setTodayEarned({ pp: 0, xp: 0 });
                    notifiedRef.current.clear();
                    socialCountsRef.current = { posts: 0, comments: 0, likes: 0 };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, quests: newQuests, todayEarned: { pp: 0, xp: 0 }, socialCounts: socialCountsRef.current }));
                }
            } catch { /* ignore */ }
        };
        const interval = setInterval(check, 60 * 1000);
        return () => clearInterval(interval);
    }, [walkStats, weather]); // eslint-disable-line

    // ── Puan ver ve kaydet ────────────────────────────────────────────────
    const awardReward = useCallback((reward: { pp: number; xp: number }, questId: string, questIcon: string, questTitle: string) => {
        if (notifiedRef.current.has(questId)) return;
        notifiedRef.current.add(questId);

        const currentLevel = getLevelInfo(totalXP).level;
        const multiplier = 1 + (currentLevel - 1) * 0.05; // Seviye başına +%5 ödül çarpanı
        const finalMultiplier = Math.min(2.0, multiplier); // Maksimum 2.0x limit sınırı (Lv.21)
        const finalPp = Math.round(reward.pp * finalMultiplier);
        const finalXp = Math.round(reward.xp * finalMultiplier);

        // Günlük 200 PP kazanım sınırı
        const remainingLimit = Math.max(0, 200 - todayEarned.pp);
        const awardedPp = Math.min(finalPp, remainingLimit);
        const isLimitExceeded = finalPp > remainingLimit;

        setTotalPatiPuan(prev => {
            const next = prev + awardedPp;
            localStorage.setItem(PUAN_KEY, String(next));
            return next;
        });
        setTotalXP(prev => {
            const next = prev + finalXp;
            localStorage.setItem(XP_KEY, String(next));
            return next;
        });
        setTodayEarned(prev => ({ pp: prev.pp + awardedPp, xp: prev.xp + finalXp }));
        setWalkPpEarned(prev => prev + awardedPp);

        // Faz 7: gerçek, denetlenebilir transaction — arka planda, UI'ı bloklamadan
        if (isSupabaseEnabled && awardedPp !== 0) {
            apiService.awardPatiPuan(awardedPp, questTitle, 'quest', questId)
                .catch(err => console.error('Moffi Puanı sunucuya yazılamadı:', err));
        }

        // Faz 8 düzeltmesi: pul artık GÜNDE BİR kere ekleniyor (o gün ilk görev tamamlandığında),
        // görev sayısı kadar değil. Öncesinde bir günde 3 görev bitirince 3 pul birden
        // ekleniyordu — bu da "7 farklı gün" anlamına gelen haftalık serinin amacını bozuyordu.
        // NOT: bu sadece pul artışını atlar, aşağıdaki tamamlanma toast'u her zaman gösterilir.
        const todayStrForStamp = getTodayStr();
        const alreadyStampedToday = localStorage.getItem(LAST_STAMP_DATE_KEY) === todayStrForStamp;
        if (!alreadyStampedToday) localStorage.setItem(LAST_STAMP_DATE_KEY, todayStrForStamp);

        if (!alreadyStampedToday) setWeeklyStamps(prev => {
            const next = Math.min(7, prev + 1);

            // Eğer pul sayısı 6'dan 7'ye ulaşıyorsa haftalık büyük ödülü ver (günlük limite takılmaz)
            if (prev === 6 && next === 7) {
                const weeklyPp = 250;
                const weeklyXp = 400;
                
                setTimeout(() => {
                    setTotalPatiPuan(p => {
                        const n = p + weeklyPp;
                        localStorage.setItem(PUAN_KEY, String(n));
                        return n;
                    });
                    setTotalXP(x => {
                        const n = x + weeklyXp;
                        localStorage.setItem(XP_KEY, String(n));
                        return n;
                    });
                    setTodayEarned(te => ({ pp: te.pp + weeklyPp, xp: te.xp + weeklyXp }));
                    setWalkPpEarned(p => p + weeklyPp);

                    if (isSupabaseEnabled) {
                        apiService.awardPatiPuan(weeklyPp, 'Haftalık 7 Pul Ödülü', 'streak')
                            .catch(err => console.error('Moffi Puanı sunucuya yazılamadı:', err));
                    }

                    window.dispatchEvent(new CustomEvent('moffi-toast', {
                        detail: {
                            message: `🎁 Haftalık 7 Pul Tamamlandı! Büyük Ödül Sandığı Açıldı: +250 PP · +400 XP! 🏆`,
                            icon: 'Gift',
                            color: 'text-yellow-400 font-bold',
                        }
                    }));
                }, 100);
            }
            
            const weekData = { weekStart: getWeekStart(), count: next };
            localStorage.setItem(STAMPS_KEY, JSON.stringify(weekData));
            return next;
        });

        // Toast bildirimi (Limiti aşma durumuna göre özelleştirilmiş)
        setTimeout(() => {
            let toastMessage = `${questIcon} ${questTitle} tamamlandı! +${awardedPp} PP · +${finalXp} XP 🎉`;
            let toastColor = 'text-orange-400';
            
            if (isLimitExceeded) {
                toastColor = 'text-yellow-500 font-bold';
                if (awardedPp > 0) {
                    toastMessage = `${questIcon} ${questTitle} tamamlandı! +${awardedPp} PP (Günlük Limit!) · +${finalXp} XP ⚠️`;
                } else {
                    toastMessage = `${questIcon} ${questTitle} tamamlandı! +${finalXp} XP (Günlük 200 PP Limiti Doldu!) ⚠️`;
                }
            }

            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: {
                    message: toastMessage,
                    icon: isLimitExceeded ? 'AlertTriangle' : 'Sparkles',
                    color: toastColor,
                }
            }));
        }, 400);
    }, [totalXP, todayEarned]);

    // ── Rozet ver ─────────────────────────────────────────────────────────
    const awardBadge = useCallback((badgeId: string) => {
        setEarnedBadgeIds(prev => {
            if (prev.includes(badgeId)) return prev;
            const next = [...prev, badgeId];
            localStorage.setItem(BADGES_KEY, JSON.stringify(next));
            const badge = BADGE_POOL.find(b => b.id === badgeId);
            if (badge) {
                setTimeout(() => {
                    setLastEarnedBadge({ name: badge.name, icon: badge.icon });
                    window.dispatchEvent(new CustomEvent('moffi-badge-earned', {
                        detail: badge
                    }));
                    window.dispatchEvent(new CustomEvent('moffi-toast', {
                        detail: {
                            message: `${badge.icon} "${badge.name}" rozeti kazandın! 🏅`,
                            icon: 'Award',
                            color: 'text-yellow-400',
                        }
                    }));
                }, 800);
            }
            return next;
        });
    }, []);

    // Faz 6/9 kontrolü: yeni bir yürüyüş başladığında (false→true geçişi) önceki
    // yürüyüşten kalma rozeti temizle — yoksa saatler önce kazanılmış alakasız bir
    // rozet, sonraki yürüyüşün sonuç ekranında "bu yürüyüşte kazanıldı" gibi görünürdü.
    useEffect(() => {
        if (walkData.isActive && !wasWalkActiveRef.current) {
            setLastEarnedBadge(null);
            setWalkPpEarned(0);
        }
        wasWalkActiveRef.current = walkData.isActive;
    }, [walkData.isActive]);

    // ── Görev ilerlemesini güncelle ───────────────────────────────────────
    const updateQuestProgress = useCallback((quests: Quest[]): Quest[] => {
        const distKm = walkData.distance / 1000;
        const durationMin = walkData.time / 60;
        const streak = walkStats?.currentStreak || 0;
        const totalDist = walkStats?.totalDistanceKm || 0;
        const hour = new Date().getHours();

        return quests.map(q => {
            if (q.completedAt) return q;

            let current = q.current;

            switch (q.type) {
                case 'distance':
                    current = distKm;
                    break;
                case 'duration':
                    current = durationMin;
                    break;
                case 'streak':
                    current = streak;
                    break;
                case 'cumulative_dist':
                    current = totalDist;
                    break;
                case 'weather_walk':
                    current = distKm;
                    break;
                case 'time_of_day':
                    if (q.templateId === 'morning_walk' && hour >= 7 && hour < 9) current = distKm;
                    else if (q.templateId === 'evening_walk' && hour >= 18) current = distKm;
                    else if (q.templateId === 'both_walks') current = socialCountsRef.current.posts; // repurposed
                    break;
                case 'count':
                    if (q.templateId === 'first_post' || q.templateId === 'five_posts') current = socialCountsRef.current.posts;
                    else if (q.templateId === 'first_comment') current = socialCountsRef.current.comments;
                    else if (q.templateId === 'ten_likes') current = socialCountsRef.current.likes;
                    break;
                default:
                    break;
            }

            const isNowCompleted = current >= q.target;
            if (isNowCompleted && !q.completedAt) {
                awardReward(q.reward, q.id, q.icon, q.title);
                // Rozet kontrol
                if (q.templateId === 'first_walk') awardBadge('first_step');
                if (q.templateId === 'streak_7') awardBadge('week_fire');
                if (q.templateId === 'cumulative_100km') awardBadge('explorer_100');
                if (q.templateId === 'streak_30') awardBadge('month_fire');
                if (q.templateId === 'first_post') awardBadge('first_post');
                if (q.templateId === 'ten_likes') awardBadge('social_dog');
                // Faz 12 kontrolü: pet_care_week rozeti tanımlıydı ama hiçbir yerden
                // tetiklenmiyordu — eşleşen görev şablonu (pet_feed_week) zaten vardı
                if (q.templateId === 'pet_feed_week') awardBadge('pet_care_week');
                return { ...q, current: Math.min(current, q.target), completedAt: new Date().toISOString() };
            }

            return { ...q, current };
        });
    }, [walkData, walkStats, awardReward, awardBadge]);

    // ── Aylık Araştırma ilerlemesi (Faz 18 düzeltmesi) ─────────────────────
    // Bu sistem daha önce HİÇ ilerlemiyordu: setMonthlyResearch sadece ilk
    // yüklemede çağrılıyordu, hiçbir gerçek sinyal stage/task current'ını
    // güncellemiyordu - currentStageIndex sonsuza kadar 0'da donuk kalıyordu
    // (bkz. CLAUDE.md). updateQuestProgress'teki AYNI gerçek sinyalleri
    // kullanıyor + t2_1 için walkHistory'deki gerçek yürüyüş başlangıç
    // noktalarını basit bir haversine kümelemesiyle (>300m ayrı = farklı rota)
    // "farklı rota" sayısına çeviriyor - tam bir coğrafi kümeleme altyapısı
    // olmadan, ama uydurma değil, gerçek GPS verisinden hesaplanıyor.
    const updateMonthlyResearchProgress = useCallback(() => {
        setMonthlyResearch(prev => {
            if (!prev || prev.completedAt) return prev;
            const stage = prev.stages[prev.currentStageIndex];
            if (!stage) return prev;

            const distKm = walkData.distance / 1000;
            const durationMin = walkData.time / 60;
            const streak = walkStats?.currentStreak || 0;
            const totalDist = walkStats?.totalDistanceKm || 0;

            const weeklyWalkCount = walkHistory.filter(w => {
                const raw = w.started_at || w.ended_at;
                if (!raw) return false;
                return Date.now() - new Date(raw).getTime() <= 7 * 24 * 60 * 60 * 1000;
            }).length;

            const distinctRouteCount = countDistinctLocations(
                walkHistory.map(w => (w.path && w.path.length > 0 ? w.path[0] : null)).filter((p): p is [number, number] => !!p),
                0.3
            );

            let anyChange = false;
            const updatedTasks = stage.tasks.map(t => {
                if (t.completed) return t;
                let current = t.current;
                switch (t.type) {
                    case 'distance': current = distKm; break;
                    case 'duration': current = durationMin; break;
                    case 'streak': current = streak; break;
                    case 'cumulative_dist': current = totalDist; break;
                    case 'count':
                        if (t.id === 't1_1') current = weeklyWalkCount;
                        else if (t.id === 't2_1') current = distinctRouteCount;
                        else if (t.id === 't1_3' || t.id === 't3_3') current = lifetimePostCountRef.current;
                        break;
                    default: break;
                }
                const isCompleted = current >= t.target;
                if (isCompleted !== t.completed || current !== t.current) anyChange = true;
                return { ...t, current: Math.min(current, t.target), completed: isCompleted };
            });

            if (!anyChange) return prev;

            const wasStageComplete = stage.tasks.every(t => t.completed);
            const isStageNowComplete = updatedTasks.every(t => t.completed);
            const stageJustCompleted = isStageNowComplete && !wasStageComplete;

            const updatedStages = prev.stages.map((s, i) => i === prev.currentStageIndex ? { ...s, tasks: updatedTasks } : s);
            let nextStageIndex = prev.currentStageIndex;
            let completedAt = prev.completedAt;

            if (stageJustCompleted) {
                awardReward(stage.reward, stage.id, stage.emoji, stage.reward.title || stage.title);
                if (stage.reward.badgeId) awardBadge(stage.reward.badgeId);
                if (prev.currentStageIndex + 1 < prev.stages.length) {
                    nextStageIndex = prev.currentStageIndex + 1;
                } else {
                    completedAt = new Date().toISOString();
                }
            }

            const next: MonthlyResearch = { ...prev, stages: updatedStages, currentStageIndex: nextStageIndex, completedAt };
            localStorage.setItem(RESEARCH_KEY, JSON.stringify(next));
            return next;
        });
    }, [walkData, walkStats, walkHistory, awardReward, awardBadge]);

    // ── Meydan Okumalar (Faz 18) ────────────────────────────────────────────
    // Faz 11'de referans görsel elde değilken ertelenmişti; görsel geri gelince
    // 3 kartın da (aylık toplam mesafe / haftalık farklı yer / kalıcı farklı
    // bölge) gerçek walkHistory verisinden hesaplanabildiği görüldü - kalıcı bir
    // "meydan okuma tamamlama" state'i tutmuyoruz, her render'da gerçek veriden
    // yeniden türetiliyor (basit, tutarlı, senkron kaybı riski yok).
    // Ekran 11 (Meydan Okumalar) VE Ekran 13 (Rozetler) aynı gerçek türetilmiş
    // metriklere ihtiyaç duyuyor (aylık km, haftalık farklı yer, ömür boyu farklı
    // bölge, seri) — iki ayrı yerde aynı hesaplamayı tekrarlamamak için tek bir
    // ortak `progressMetrics` içinde toplandı.
    const progressMetrics = useMemo(() => {
        const now = new Date();
        const monthWalks = walkHistory.filter(w => {
            const raw = w.started_at || w.ended_at;
            if (!raw) return false;
            const d = new Date(raw);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const weekWalks = walkHistory.filter(w => {
            const raw = w.started_at || w.ended_at;
            if (!raw) return false;
            return now.getTime() - new Date(raw).getTime() <= 7 * 24 * 60 * 60 * 1000;
        });

        const monthlyKm = monthWalks.reduce((sum, w) => sum + (w.distanceKm ?? (w.distance_meters ? w.distance_meters / 1000 : 0)), 0);
        const weeklyDistinctSpots = countDistinctLocations(
            weekWalks.map(w => (w.path && w.path.length > 0 ? w.path[0] : null)).filter((p): p is [number, number] => !!p),
            0.3
        );
        const lifetimeDistinctRegions = countDistinctLocations(
            walkHistory.map(w => (w.path && w.path.length > 0 ? w.path[0] : null)).filter((p): p is [number, number] => !!p),
            2
        );
        const currentStreak = walkStats?.currentStreak || 0;
        const totalDistanceKm = walkStats?.totalDistanceKm || 0;
        const totalWalks = walkStats?.totalWalks || 0;

        return { monthlyKm, weeklyDistinctSpots, lifetimeDistinctRegions, currentStreak, totalDistanceKm, totalWalks };
    }, [walkHistory, walkStats]);

    // Ekran 13 (Rozetler) — 🔴🔴 design-reference/walk-final/'in EN BÜYÜK bulgusu:
    // kilitli rozetlerde GERÇEK sayısal ilerleme gösterilmesi isteniyor (Faz 13'te
    // "her rozetin sayacını doğrulamadan uydurma sayı göstermeyelim" diye bilinçli
    // ERTELENMİŞTİ - artık ertelenmiş değil, referans açıkça istiyor). Sadece
    // GÜVENİLİR, sürekli bir gerçek veriye sahip olduğumuz rozetler için hesaplanıyor
    // (bkz. Ekran 7'deki getClosestBadgeProgress ile aynı bilinçli sınır) - sosyal/pet
    // sayaç rozetleri (photographer, pet_care_week, social_dog, first_post) ve zaman
    // dilimi rozetleri (morning_bird, night_walker, rain_hero, winter_warrior,
    // birthday_walk, research_complete) için güvenilir bir "current/target" yok,
    // bu yüzden onlarda hiç fraksiyon gösterilmiyor (uydurma sayı yerine dürüstçe
    // sadece isim+açıklama kalıyor) - referansın da "Dağ Kaşifi"/"Ay Işığı Yürüyüşü"
    // için yaptığı gibi (ilerlemesiz, sadece "Yakında" kilitli).
    const badgeProgress = useMemo(() => {
        const { monthlyKm, weeklyDistinctSpots, lifetimeDistinctRegions, currentStreak, totalDistanceKm, totalWalks } = progressMetrics;
        const map: Record<string, { current: number; target: number; percent: number }> = {};
        const set = (id: string, current: number, target: number) => {
            map[id] = { current, target, percent: Math.min(100, Math.round((current / target) * 100)) };
        };
        set('first_step', Math.min(1, totalWalks), 1);
        set('week_fire', Math.min(7, currentStreak), 7);
        set('month_fire', Math.min(30, currentStreak), 30);
        set('explorer_100', Math.min(100, totalDistanceKm), 100);
        set('monthly_explorer', Math.min(100, monthlyKm), 100);
        set('park_hopper', Math.min(5, weeklyDistinctSpots), 5);
        set('region_explorer', Math.min(10, lifetimeDistinctRegions), 10);
        return map;
    }, [progressMetrics]);

    const challenges = useMemo<Challenge[]>(() => {
        const now = new Date();
        const { monthlyKm, weeklyDistinctSpots, lifetimeDistinctRegions, currentStreak } = progressMetrics;

        return [
            {
                id: 'monthly_distance', title: `${now.toLocaleDateString('tr-TR', { month: 'long' })} Yürüyüş Ayı`,
                description: 'Bu ay toplam 100 km yürü, özel rozeti kazan!', icon: '🏔️',
                current: Math.min(100, monthlyKm), target: 100, unit: 'km', badgeId: 'monthly_explorer',
                status: monthlyKm >= 100 ? 'completed' : 'active',
                rewardLabel: '+500 Puan', rewardPp: 500,
            },
            {
                id: 'weekly_spots', title: 'Haftalık Patili Dostlar',
                description: 'Bu hafta 5 farklı yerde yürü', icon: '🌲',
                current: Math.min(5, weeklyDistinctSpots), target: 5, unit: 'yer', badgeId: 'park_hopper',
                status: weeklyDistinctSpots >= 5 ? 'completed' : 'active',
                rewardLabel: '+150 Puan', rewardPp: 150,
            },
            {
                id: 'lifetime_regions', title: 'Şehir Gezginleri',
                description: 'Kendi şehrinde 10 farklı bölge keşfet', icon: '⭐',
                current: Math.min(10, lifetimeDistinctRegions), target: 10, unit: 'bölge', badgeId: 'region_explorer',
                status: lifetimeDistinctRegions >= 10 ? 'completed' : 'active',
                rewardLabel: '+Rozet', rewardPp: 0,
            },
            {
                id: 'streak_master', title: 'Seri Ustası',
                description: 'Aralıksız 7 gün yürü', icon: '🔥',
                current: Math.min(7, currentStreak), target: 7, unit: 'gün', badgeId: 'week_fire',
                status: currentStreak >= 7 ? 'completed' : 'active',
                rewardLabel: '+200 Puan', rewardPp: 200,
            },
        ];
    }, [progressMetrics]);

    // Meydan okuma hedefi karşılanınca ilgili rozeti (ve varsa gerçek PP ödülünü)
    // ver. awardBadge zaten idempotent (aynı rozeti iki kez vermiyor); awardReward
    // da kendi `notifiedRef` Set'iyle idempotent (questId başına bir kez) - bu
    // yüzden her render'da güvenle çağrılabilir. Önceden meydan okumalar SADECE
    // rozet veriyordu, PP vermiyordu (referans PP de veriyormuş gibi gösteriyor,
    // bkz. design-reference/walk-final/ Ekran 11 notu) - artık gerçekten veriyor.
    useEffect(() => {
        if (!initializedRef.current) return;
        challenges.forEach(c => {
            if (c.status === 'completed') {
                awardBadge(c.badgeId);
                if (c.rewardPp > 0) awardReward({ pp: c.rewardPp, xp: c.rewardPp }, `challenge_${c.id}`, c.icon, c.title);
            }
        });
    }, [challenges, awardBadge, awardReward]);

    // ── Gizli rozet kontrolü ──────────────────────────────────────────────
    useEffect(() => {
        if (!initializedRef.current) return;
        const hour = new Date().getHours();

        // Sabah kuşu
        if (hour < 7 && walkData.isActive) awardBadge('morning_bird');
        // Gece gezgini
        if (hour >= 21 && walkData.isActive) awardBadge('night_walker');
        // Yağmur kahramanı
        if (weather && weather.walkScore <= 40 && walkData.isActive) awardBadge('rain_hero');
        // Kış savaşçısı
        if (weather && weather.temp <= 5 && walkData.isActive) awardBadge('winter_warrior');

        // Pet doğum günü — Faz 12 düzeltmesi: rozetin açıklaması "doğum gününde YÜRÜ"
        // diyor ama walkData.isActive kontrolü hiç yoktu, uygulamayı açmak yeterliydi
        if (activePet?.birthday && walkData.isActive) {
            const today = new Date();
            const bday = new Date(activePet.birthday);
            if (today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth()) {
                awardBadge('birthday_walk');
            }
        }
    }, [walkData.isActive, weather, activePet, awardBadge]);

    // ── walkData değiştiğinde güncelle ────────────────────────────────────
    useEffect(() => {
        if (!initializedRef.current || dailyQuests.length === 0) return;
        const updated = updateQuestProgress(dailyQuests);
        setDailyQuests(updated);

        const todayStr = getTodayStr();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayStr,
            quests: updated,
            todayEarned,
            socialCounts: socialCountsRef.current,
        }));
    }, [walkData.distance, walkData.time, walkData.isActive, walkStats?.currentStreak, walkStats?.totalDistanceKm]); // eslint-disable-line

    useEffect(() => {
        if (!initializedRef.current) return;
        updateMonthlyResearchProgress();
    }, [walkData.distance, walkData.time, walkData.isActive, walkStats?.currentStreak, walkStats?.totalDistanceKm, walkHistory]); // eslint-disable-line

    // ── Event bus: sosyal aksiyonlar ──────────────────────────────────────
    useEffect(() => {
        const handleQuestTrigger = (e: any) => {
            const { type } = e.detail || {};
            if (type === 'post_added') {
                socialCountsRef.current.posts++;
                lifetimePostCountRef.current++;
                localStorage.setItem(LIFETIME_POSTS_KEY, String(lifetimePostCountRef.current));
                if (lifetimePostCountRef.current >= 10) awardBadge('photographer');
                updateMonthlyResearchProgress();
            }
            else if (type === 'comment_added') socialCountsRef.current.comments++;
            else if (type === 'like_toggled') socialCountsRef.current.likes++;
            else if (type === 'page_visited_petshop') {
                setDailyQuests(prev => {
                    const updated = prev.map(q => {
                        if (q.templateId === 'visit_petshop' && !q.completedAt) {
                            awardReward(q.reward, q.id, q.icon, q.title);
                            return { ...q, current: 1, completedAt: new Date().toISOString() };
                        }
                        return q;
                    });
                    return updated;
                });
            } else if (type === 'page_visited_ai') {
                setDailyQuests(prev => prev.map(q => {
                    if (q.templateId === 'try_ai' && !q.completedAt) {
                        awardReward(q.reward, q.id, q.icon, q.title);
                        return { ...q, current: 1, completedAt: new Date().toISOString() };
                    }
                    return q;
                }));
            }

            // Sosyal görevleri güncelle
            if (['post_added', 'comment_added', 'like_toggled'].includes(type)) {
                setDailyQuests(prev => updateQuestProgress(prev));
            }
        };

        window.addEventListener('moffi-quest-trigger', handleQuestTrigger);
        return () => window.removeEventListener('moffi-quest-trigger', handleQuestTrigger);
    }, [updateQuestProgress, updateMonthlyResearchProgress, awardReward, awardBadge]);

    // ── Manuel görev tamamlama ────────────────────────────────────────────
    const completeManualQuest = useCallback((questId: string) => {
        setDailyQuests(prev => {
            const updated = prev.map(q => {
                if (q.id === questId && q.type === 'manual' && !q.completedAt) {
                    const newCurrent = q.current + 1;
                    const isCompleted = newCurrent >= q.target;
                    if (isCompleted) awardReward(q.reward, q.id, q.icon, q.title);
                    return { ...q, current: newCurrent, completedAt: isCompleted ? new Date().toISOString() : undefined };
                }
                return q;
            });
            const todayStr = getTodayStr();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, quests: updated, todayEarned, socialCounts: socialCountsRef.current }));
            return updated;
        });
    }, [awardReward, todayEarned]);

    // ── Genel tetikleyici ─────────────────────────────────────────────────
    const triggerQuestEvent = useCallback((type: string, data?: Record<string, unknown>) => {
        window.dispatchEvent(new CustomEvent('moffi-quest-trigger', { detail: { type, ...data } }));
    }, []);

    // ── Ekonomi ───────────────────────────────────────────────────────────
    const spendPatiPuan = useCallback((amount: number) => {
        if (totalPatiPuan >= amount) {
            setTotalPatiPuan(prev => {
                const newValue = prev - amount;
                localStorage.setItem(PUAN_KEY, String(newValue));
                return newValue;
            });
            // Faz 7: gerçek, denetlenebilir transaction — arka planda, mevcut senkron
            // sözleşmeyi (anında true/false dönüşü) bozmadan
            if (isSupabaseEnabled) {
                apiService.awardPatiPuan(-amount, 'Harcama', 'spend')
                    .catch(err => console.error('Moffi Puanı harcaması sunucuya yazılamadı:', err));
            }
            return true;
        }
        return false;
    }, [totalPatiPuan]);

    // ── Streak kalkanı ────────────────────────────────────────────────────
    // Faz 8: artık gerçek — sunucu tarafında doğrulanıyor (dünü gerçekten kapsıyor,
    // gerçek seri hesaplamasına gerçekten yansıyor). Eskiden bu sadece bir toast
    // gösterip localStorage flag'i kapatıyordu, gerçek seriye hiç etkisi yoktu.
    const useStreakShield = useCallback(async () => {
        if (!streakShieldAvailable || !isSupabaseEnabled) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear(), m = String(yesterday.getMonth() + 1).padStart(2, '0'), d = String(yesterday.getDate()).padStart(2, '0');
        const coveredDate = `${y}-${m}-${d}`;

        try {
            await apiService.useStreakShield(coveredDate);
            setStreakShieldAvailable(false);
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: '🛡️ Seri Kalkanı kullanıldı! Seriniz korundu.', icon: 'Shield', color: 'text-blue-400' }
            }));
        } catch (err: any) {
            console.error('Seri kalkanı kullanılamadı:', err);
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: err?.message || 'Seri kalkanı kullanılamadı.', icon: 'AlertTriangle', color: 'text-red-400' }
            }));
        }
    }, [streakShieldAvailable]);

    // ── Türetilen değerler ────────────────────────────────────────────────
    const completedCount = dailyQuests.filter(q => !!q.completedAt).length;
    const totalCount = dailyQuests.length;
    // Faz 18.1 düzeltmesi: bu ikisi SADECE /walk hub sayfasındaki "günlük hedef"
    // kartlarını besliyor (tek tüketici, doğrulandı). Öncesinde `distKm`/`durationMin`
    // yalnız AKTİF yürüyüşün canlı değeriydi - yürüyüş bittiğinde 0'a dönüyordu,
    // hub sayfası da bu durumda sayıyı "walkStats.totalDistanceKm" (TÜM ZAMANLARIN
    // toplamı) ile değiştirip gösteriyordu ama ilerleme çubuğu hâlâ 0'da kalıyordu -
    // "42,3 / 5km" yazıp çubuğu boş gösteren kafa karıştırıcı bir tutarsızlıktı.
    // Artık gerçek anlamı ("bugün ne kadar yürüdün") yansıtıyor: bugün tamamlanmış
    // yürüyüşlerin toplamı + (varsa) şu an aktif yürüyüşün canlı değeri.
    const todayLocalStr = getTodayStr();
    const todayCompletedKm = walkHistory.reduce((sum, w) => {
        const raw = w.started_at || w.ended_at;
        if (!raw || new Date(raw).toLocaleDateString('sv-SE') !== todayLocalStr) return sum;
        return sum + (w.distanceKm ?? (w.distance_meters ? w.distance_meters / 1000 : 0));
    }, 0);
    const todayCompletedMin = walkHistory.reduce((sum, w) => {
        const raw = w.started_at || w.ended_at;
        if (!raw || new Date(raw).toLocaleDateString('sv-SE') !== todayLocalStr) return sum;
        return sum + (w.duration_minutes || 0);
    }, 0);
    const distKm = todayCompletedKm + (walkData.isActive ? walkData.distance / 1000 : 0);
    const durationMin = todayCompletedMin + (walkData.isActive ? walkData.time / 60 : 0);
    const progressPercent = Math.min(100, (distKm / Math.max(0.01, dailyGoal.distance)) * 100);
    const durationPercent = Math.min(100, (durationMin / Math.max(1, dailyGoal.duration)) * 100);

    const levelInfo = getLevelInfo(totalXP);

    const earnedBadges = BADGE_POOL.filter(b => earnedBadgeIds.includes(b.id)).map(b => ({
        ...b,
        earnedAt: new Date().toISOString(),
    }));
    const closestBadgeProgress = getClosestBadgeProgress(badgeProgress, earnedBadgeIds);

    return (
        <QuestEngineContext.Provider value={{
            dailyQuests,
            spendPatiPuan,
            completedCount,
            totalCount,
            dailyGoal,
            autoDailyGoalKm,
            manualDailyGoalKm,
            setManualDailyGoalKm,
            progressPercent,
            durationPercent,
            todayDistanceKm: distKm,
            todayDurationMin: durationMin,
            monthlyResearch,
            challenges,
            badges: BADGE_POOL,
            earnedBadges,
            closestBadgeProgress,
            badgeProgress,
            totalPatiPuan,
            totalXP,
            level: levelInfo.level,
            levelTitle: levelInfo.levelTitle,
            levelXpCurrent: levelInfo.levelXpCurrent,
            levelXpRequired: levelInfo.levelXpRequired,
            todayEarned,
            currentStreak: walkStats?.currentStreak || 0,
            streakShieldAvailable,
            useStreakShield,
            lastEarnedBadge,
            walkPpEarned,
            weeklyStamps,
            maxWeeklyStamps: 7,
            triggerQuestEvent,
            completeManualQuest,
        }}>
            {children}
        </QuestEngineContext.Provider>
    );
}

export function useQuestEngine() {
    const ctx = useContext(QuestEngineContext);
    if (!ctx) throw new Error('useQuestEngine must be used within a QuestEngineProvider');
    return ctx;
}

// Helper
function getWeekStart(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toLocaleDateString('sv-SE');
}
