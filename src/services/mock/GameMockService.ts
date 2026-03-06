import { IGameService } from "@/services/interfaces";
import { GameScore, LeaderboardEntry } from "@/types/domain";

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// Fake leaderboard
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, userId: 'u-top1', username: 'MoffiKing', avatar: '👑', highScore: 15420, totalCoins: 8900 },
    { rank: 2, userId: 'u-top2', username: 'PurrRunner', avatar: '🐱', highScore: 12800, totalCoins: 7200 },
    { rank: 3, userId: 'u-top3', username: 'CatDash99', avatar: '⚡', highScore: 11350, totalCoins: 6100 },
    { rank: 4, userId: 'u-top4', username: 'NeonPaw', avatar: '🌟', highScore: 9800, totalCoins: 5400 },
    { rank: 5, userId: 'u-top5', username: 'WhiskerPro', avatar: '🎮', highScore: 8900, totalCoins: 4800 },
    { rank: 6, userId: 'u-top6', username: 'FluffyBolt', avatar: '💜', highScore: 7600, totalCoins: 4200 },
    { rank: 7, userId: 'u-top7', username: 'TailSpin', avatar: '🌀', highScore: 6400, totalCoins: 3500 },
    { rank: 8, userId: 'u-top8', username: 'Mochi_Run', avatar: '🍡', highScore: 5200, totalCoins: 2900 },
    { rank: 9, userId: 'u-top9', username: 'PawPatrol', avatar: '🐾', highScore: 4100, totalCoins: 2300 },
    { rank: 10, userId: 'u-top10', username: 'KittyDash', avatar: '🏃', highScore: 3500, totalCoins: 1900 },
];

export class GameMockService implements IGameService {
    private scores: GameScore[] = [];
    private coinBalances: Map<string, number> = new Map();
    private coinLog: Array<{ userId: string; amount: number; reason: string; date: string }> = [];

    async saveScore(scoreData: Omit<GameScore, 'id' | 'playedAt'>): Promise<GameScore> {
        await delay(300);
        const score: GameScore = {
            ...scoreData,
            id: `score-${Date.now()}`,
            playedAt: new Date().toISOString(),
        };
        this.scores.push(score);

        // Add coins to balance
        const current = this.coinBalances.get(scoreData.userId) || 0;
        this.coinBalances.set(scoreData.userId, current + scoreData.coins);

        return score;
    }

    async getMyScores(userId: string, limit = 10): Promise<GameScore[]> {
        await delay(200);
        return this.scores
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
            .slice(0, limit);
    }

    async getHighScore(userId: string): Promise<number> {
        await delay(100);
        const userScores = this.scores.filter(s => s.userId === userId);
        if (userScores.length === 0) return 0;
        return Math.max(...userScores.map(s => s.score));
    }

    async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
        await delay(300);

        // Merge mock leaderboard with user's actual scores
        const userHighScores = new Map<string, { score: number; coins: number }>();
        for (const s of this.scores) {
            const existing = userHighScores.get(s.userId);
            if (!existing || s.score > existing.score) {
                userHighScores.set(s.userId, {
                    score: s.score,
                    coins: (this.coinBalances.get(s.userId) || 0),
                });
            }
        }

        // Create combined list
        const combined: LeaderboardEntry[] = [...MOCK_LEADERBOARD];

        for (const [userId, data] of userHighScores) {
            // Skip if already in mock
            if (combined.find(e => e.userId === userId)) continue;
            combined.push({
                rank: 0, // Will be set below
                userId,
                username: 'Sen', // Current user
                avatar: '🐱',
                highScore: data.score,
                totalCoins: data.coins,
            });
        }

        // Sort by highScore and assign ranks
        combined.sort((a, b) => b.highScore - a.highScore);
        combined.forEach((entry, i) => entry.rank = i + 1);

        return combined.slice(0, limit);
    }

    async getMyRank(userId: string): Promise<number> {
        await delay(150);
        const leaderboard = await this.getLeaderboard(100);
        const entry = leaderboard.find(e => e.userId === userId);
        return entry?.rank || leaderboard.length + 1;
    }

    async getTotalCoins(userId: string): Promise<number> {
        await delay(100);
        return this.coinBalances.get(userId) || 0;
    }

    async spendCoins(userId: string, amount: number, reason: string): Promise<boolean> {
        await delay(200);
        const current = this.coinBalances.get(userId) || 0;

        if (amount <= 0) throw new Error('Geçersiz miktar');
        if (current < amount) return false; // Not enough coins

        this.coinBalances.set(userId, current - amount);
        this.coinLog.push({
            userId,
            amount: -amount,
            reason,
            date: new Date().toISOString(),
        });

        return true;
    }
}
