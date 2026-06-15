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
    createContext, useContext, useState, useEffect, useCallback, useRef
} from 'react';
import { useActivity } from './ActivityContext';
import { useWeather } from './WeatherContext';
import { usePet } from './PetContext';
import { supabase } from '@/lib/supabase';

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

    // Hedefler
    dailyGoal: { distance: number; duration: number };
    progressPercent: number;
    durationPercent: number;

    // Aylık araştırma
    monthlyResearch: MonthlyResearch | null;

    // Rozetler
    badges: Badge[];
    earnedBadges: Badge[];

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
    useStreakShield: () => void;

    // Günlük pullar (7-pul sistemi)
    weeklyStamps: number;
    maxWeeklyStamps: number;

    // Tetikleyiciler
    triggerQuestEvent: (type: string, data?: Record<string, unknown>) => void;
    completeManualQuest: (questId: string) => void;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'moffi_quest_engine_v2';
const PUAN_KEY = 'moffi_total_pp_v2';
const XP_KEY = 'moffi_total_xp_v2';
const BADGES_KEY = 'moffi_earned_badges_v2';
const RESEARCH_KEY = 'moffi_research_v2';
const STAMPS_KEY = 'moffi_weekly_stamps_v2';
const SHIELD_KEY = 'moffi_streak_shield_v2';

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

function computeDailyGoal(walkStats: any): { distance: number; duration: number } {
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
];

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

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function QuestEngineProvider({ children }: { children: React.ReactNode }) {
    const { walkData, walkStats, walkHistory } = useActivity();
    const { weather } = useWeather();
    const { activePet } = usePet();

    const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
    const [totalPatiPuan, setTotalPatiPuan] = useState(0);
    const [totalXP, setTotalXP] = useState(0);
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
    const [monthlyResearch, setMonthlyResearch] = useState<MonthlyResearch | null>(null);
    const [todayEarned, setTodayEarned] = useState({ pp: 0, xp: 0 });
    const [weeklyStamps, setWeeklyStamps] = useState(0);
    const [streakShieldAvailable, setStreakShieldAvailable] = useState(true);

    // Social event counters (günlük)
    const socialCountsRef = useRef({ posts: 0, comments: 0, likes: 0 });
    const notifiedRef = useRef<Set<string>>(new Set());
    const initializedRef = useRef(false);
    const userIdRef = useRef<string | null>(null);

    const dailyGoal = computeDailyGoal(walkStats);

    // ── Başlatma ──────────────────────────────────────────────────────────
    useEffect(() => {
        const todayStr = getTodayStr();
        const monthKey = getMonthKey();

        // PP + XP yükle
        const storedPP = localStorage.getItem(PUAN_KEY);
        const storedXP = localStorage.getItem(XP_KEY);
        if (storedPP) setTotalPatiPuan(parseInt(storedPP, 10) || 0);
        if (storedXP) setTotalXP(parseInt(storedXP, 10) || 0);

        // Rozet yükle
        const storedBadges = localStorage.getItem(BADGES_KEY);
        if (storedBadges) {
            try { setEarnedBadgeIds(JSON.parse(storedBadges)); } catch { /* ignore */ }
        }

        // Streak kalkanı
        const shieldStr = localStorage.getItem(SHIELD_KEY);
        if (shieldStr) {
            try {
                const parsed = JSON.parse(shieldStr);
                if (parsed && parsed.weekStart === getWeekStart()) {
                    setStreakShieldAvailable(parsed.available);
                }
            } catch { /* ignore */ }
        }

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

        // Günlük pul ekle
        setWeeklyStamps(prev => {
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
                return { ...q, current: Math.min(current, q.target), completedAt: new Date().toISOString() };
            }

            return { ...q, current };
        });
    }, [walkData, walkStats, awardReward, awardBadge]);

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

        // Pet doğum günü
        if (activePet?.birthday) {
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

    // ── Event bus: sosyal aksiyonlar ──────────────────────────────────────
    useEffect(() => {
        const handleQuestTrigger = (e: any) => {
            const { type } = e.detail || {};
            if (type === 'post_added') socialCountsRef.current.posts++;
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
    }, [updateQuestProgress, awardReward]);

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

    // ── Streak kalkanı ────────────────────────────────────────────────────
    const useStreakShield = useCallback(() => {
        if (!streakShieldAvailable) return;
        setStreakShieldAvailable(false);
        localStorage.setItem(SHIELD_KEY, JSON.stringify({ weekStart: getWeekStart(), available: false }));
        window.dispatchEvent(new CustomEvent('moffi-toast', {
            detail: { message: '🛡️ Seri Kalkanı kullanıldı! Seriniz korundu.', icon: 'Shield', color: 'text-blue-400' }
        }));
    }, [streakShieldAvailable]);

    // ── Türetilen değerler ────────────────────────────────────────────────
    const completedCount = dailyQuests.filter(q => !!q.completedAt).length;
    const totalCount = dailyQuests.length;
    const distKm = walkData.distance / 1000;
    const durationMin = walkData.time / 60;
    const progressPercent = Math.min(100, (distKm / Math.max(0.01, dailyGoal.distance)) * 100);
    const durationPercent = Math.min(100, (durationMin / Math.max(1, dailyGoal.duration)) * 100);

    const levelInfo = getLevelInfo(totalXP);

    const earnedBadges = BADGE_POOL.filter(b => earnedBadgeIds.includes(b.id)).map(b => ({
        ...b,
        earnedAt: new Date().toISOString(),
    }));

    return (
        <QuestEngineContext.Provider value={{
            dailyQuests,
            completedCount,
            totalCount,
            dailyGoal,
            progressPercent,
            durationPercent,
            monthlyResearch,
            badges: BADGE_POOL,
            earnedBadges,
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
    return monday.toISOString().split('T')[0];
}
