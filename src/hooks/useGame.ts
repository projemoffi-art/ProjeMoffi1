import { useState, useCallback, useEffect } from "react";
import { IGameService } from "@/services/interfaces";
import { GameMockService } from "@/services/mock/GameMockService";
import { GameScore, LeaderboardEntry } from "@/types/domain";

const gameService: IGameService = new GameMockService();
const MOCK_USER_ID = 'user-1';

export function useGame() {
    const [myScores, setMyScores] = useState<GameScore[]>([]);
    const [highScore, setHighScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [totalCoins, setTotalCoins] = useState(0);
    const [myRank, setMyRank] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [scores, hs, lb, coins, rank] = await Promise.all([
                gameService.getMyScores(MOCK_USER_ID),
                gameService.getHighScore(MOCK_USER_ID),
                gameService.getLeaderboard(10),
                gameService.getTotalCoins(MOCK_USER_ID),
                gameService.getMyRank(MOCK_USER_ID),
            ]);
            setMyScores(scores);
            setHighScore(hs);
            setLeaderboard(lb);
            setTotalCoins(coins);
            setMyRank(rank);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveScore = useCallback(async (result: { score: number; coins: number; distance: number; missionsCompleted: number; duration: number }) => {
        setError(null);
        try {
            const saved = await gameService.saveScore({
                userId: MOCK_USER_ID,
                petId: 'pet-1',
                ...result,
            });

            // Refresh all data
            await fetchAll();
            return saved;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Skor kaydedilemedi');
            return null;
        }
    }, [fetchAll]);

    const spendCoins = useCallback(async (amount: number, reason: string) => {
        setError(null);
        try {
            const success = await gameService.spendCoins(MOCK_USER_ID, amount, reason);
            if (success) {
                const newCoins = await gameService.getTotalCoins(MOCK_USER_ID);
                setTotalCoins(newCoins);
            }
            return success;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Coin harcanamadı');
            return false;
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        myScores,
        highScore,
        leaderboard,
        totalCoins,
        myRank,
        isLoading,
        error,
        saveScore,
        spendCoins,
        refresh: fetchAll,
    };
}
