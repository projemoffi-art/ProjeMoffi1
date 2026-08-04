export interface Quest {
    id: string;
    title: string;
    description: string;
    reward: string; // e.g., "10% Discount", "Free Coffee"
    type: 'visit' | 'purchase' | 'interaction';
    status: 'active' | 'draft' | 'ended';
    participants: number;
    completions: number;
    startDate: string;
    endDate: string;
    imageUrl?: string;
    targetCount: number; // e.g., 5 check-ins
}

export interface GameStats {
    totalInteractions: number;
    activeQuests: number;
    rewardsClaimed: number;
    topPlayer: string;
}

export interface GameModule {
    id: string;
    game_key: 'food-catch' | 'memory' | 'jump' | 'moffi-run';
    title: string;
    description: string;
    icon_name: string;
    color_gradient: string;
    difficulty: number;
    is_active: boolean;
    reward_multiplier: number;
    created_at?: string;
}
