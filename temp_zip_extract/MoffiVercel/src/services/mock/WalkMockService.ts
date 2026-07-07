import { IWalkService } from "@/services/interfaces";
import { WalkSession, WalkStats } from "@/types/domain";

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// Mock walk history for demo
const MOCK_HISTORY: WalkSession[] = [
    {
        id: 'walk-1', userId: 'user-milo', petId: 'pet-1',
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() - 86400000 + 2400000).toISOString(),
        distanceKm: 2.3, durationMinutes: 40,
        route: [
            { lat: 40.9850, lng: 29.0300, timestamp: new Date(Date.now() - 86400000).toISOString() },
            { lat: 40.9860, lng: 29.0310, timestamp: new Date(Date.now() - 86400000 + 600000).toISOString() },
        ],
        caloriesBurned: 180,
        mood: 'happy',
    },
    {
        id: 'walk-2', userId: 'user-milo', petId: 'pet-1',
        startTime: new Date(Date.now() - 172800000).toISOString(),
        endTime: new Date(Date.now() - 172800000 + 1800000).toISOString(),
        distanceKm: 1.5, durationMinutes: 30,
        route: [
            { lat: 40.9850, lng: 29.0300, timestamp: new Date(Date.now() - 172800000).toISOString() },
        ],
        caloriesBurned: 120,
        mood: 'calm',
    },
    {
        id: 'walk-3', userId: 'user-milo', petId: 'pet-1',
        startTime: new Date(Date.now() - 259200000).toISOString(),
        endTime: new Date(Date.now() - 259200000 + 3600000).toISOString(),
        distanceKm: 3.8, durationMinutes: 60,
        route: [],
        caloriesBurned: 290,
        mood: 'excited',
    },
];

export class WalkMockService implements IWalkService {
    private sessions: WalkSession[] = [...MOCK_HISTORY];
    private activeSession: WalkSession | null = null;

    async startWalk(userId: string, petId: string): Promise<WalkSession> {
        await delay(200);
        if (this.activeSession) throw new Error('Zaten aktif bir yürüyüş var');

        const session: WalkSession = {
            id: `walk-${Date.now()}`,
            userId,
            petId,
            startTime: new Date().toISOString(),
            distanceKm: 0,
            durationMinutes: 0,
            route: [],
        };
        this.activeSession = session;
        return session;
    }

    async endWalk(sessionId: string, data: Partial<WalkSession>): Promise<WalkSession> {
        await delay(200);
        if (!this.activeSession || this.activeSession.id !== sessionId) {
            throw new Error('Aktif yürüyüş bulunamadı');
        }

        const completed: WalkSession = {
            ...this.activeSession,
            ...data,
            endTime: new Date().toISOString(),
        };

        // Calculate duration if not provided
        if (!completed.durationMinutes) {
            const start = new Date(completed.startTime).getTime();
            const end = new Date(completed.endTime!).getTime();
            completed.durationMinutes = Math.round((end - start) / 60000);
        }

        // Estimate calories (~75 cal/km for dogs)
        if (!completed.caloriesBurned) {
            completed.caloriesBurned = Math.round(completed.distanceKm * 75);
        }

        this.sessions.unshift(completed);
        this.activeSession = null;
        return completed;
    }

    async getWalkHistory(userId: string, limit = 20): Promise<WalkSession[]> {
        await delay(200);
        return this.sessions
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, limit);
    }

    async getWalkById(id: string): Promise<WalkSession | null> {
        await delay(100);
        return this.sessions.find(s => s.id === id) || null;
    }

    async getWalkStats(userId: string): Promise<WalkStats> {
        await delay(200);
        const userWalks = this.sessions.filter(s => s.userId === userId);
        const totalDistance = userWalks.reduce((s, w) => s + w.distanceKm, 0);
        const totalDuration = userWalks.reduce((s, w) => s + w.durationMinutes, 0);
        const longest = userWalks.reduce((max, w) => Math.max(max, w.distanceKm), 0);

        // Calculate streak (consecutive days)
        let currentStreak = 0;
        let bestStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < 365; d++) {
            const checkDate = new Date(today.getTime() - d * 86400000);
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasWalk = userWalks.some(w => w.startTime.startsWith(dateStr));

            if (hasWalk) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else if (d > 0) {
                break; // Streak broken
            }
        }

        return {
            totalWalks: userWalks.length,
            totalDistanceKm: Math.round(totalDistance * 10) / 10,
            totalDurationMinutes: totalDuration,
            averageDistanceKm: userWalks.length > 0 ? Math.round((totalDistance / userWalks.length) * 10) / 10 : 0,
            longestWalkKm: Math.round(longest * 10) / 10,
            currentStreak,
            bestStreak,
        };
    }

    async updateLocation(sessionId: string, lat: number, lng: number): Promise<void> {
        await delay(50);
        if (this.activeSession && this.activeSession.id === sessionId) {
            this.activeSession.route.push({
                lat, lng,
                timestamp: new Date().toISOString(),
            });

            // Recalculate distance from route
            if (this.activeSession.route.length > 1) {
                const pts = this.activeSession.route;
                let dist = 0;
                for (let i = 1; i < pts.length; i++) {
                    dist += haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
                }
                this.activeSession.distanceKm = Math.round(dist * 100) / 100;
            }
        }
    }
}

// Haversine distance formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
