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
