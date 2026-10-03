'use client';

// Günlük ilerleme: bugünkü yürüyüş (mesafe/süre/adım) ve hedef, PawCoin bakiyesi, seri + seri kalkanı, aktif çerçeve hakları.
// Görevler, rozetler, seviye ve ödüller BURADA DEĞİL: Görev Merkezi sunucuda (services/questService.ts, 8.68).
// (Eski QuestEngineContext; görev/rozet/XP'yi telefonda tuttuğu ve istemciden ödül istediği için 2026-10-03'te kaldırıldı.)
//
// Günlük hedef tek kaynak: sunucu (pet_walk_goal / set_pet_walk_goal_steps) ve birimi ADIM (Baran, 2026-10-04). Otomatik hedef
// bugünden önceki yürüyüşlerden hesaplanır, gün içinde değişmez; elle hedef hayvanın kaydında durur. Bugünkü adım, sunucudaki
// görevle aynı kuralla sayılır: her yürüyüşte ölçülen adım ile mesafenin adım karşılığının büyüğü (lib/walkMetrics creditedSteps).

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useActivity } from '@/context/ActivityContext';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';
import { questService, type WalkGoal } from '@/services/questService';
import { creditedSteps, stepsToKm, STEPS_PER_KM, STEP_GOAL } from '@/lib/walkMetrics';

/** PawCoin bakiyesi değiştiğinde (ödül, harcama) yayınlanır; bakiye sunucudan tazelenir. */
export const BALANCE_CHANGED = 'moffi-balance-changed';

const LEGACY_MANUAL_GOAL_KEY = 'moffi_manual_daily_goal_km';
const FALLBACK_GOAL_STEPS = 2500;

interface DailyProgressValue {
    /** steps: günlük adım hedefi; distance: aynı hedefin km karşılığı (tahmini süre için); duration: dakika. */
    dailyGoal: { steps: number; distance: number; duration: number };
    autoDailyGoalSteps: number;
    manualDailyGoalSteps: number | null;
    setManualDailyGoalSteps: (steps: number | null) => Promise<void>;
    /** Adım hedefinin yüzdesi (0–100). */
    progressPercent: number;
    durationPercent: number;
    todayDistanceKm: number;
    todayDurationMin: number;
    /** Bugün hedefe sayılan adım (sunucudaki görevle aynı kural). */
    todaySteps: number;
    totalPatiPuan: number;
    refreshBalance: () => void;
    activePerks: Record<string, string>;
    hasActivePerk: (perkKey: string) => boolean;
    refreshActivePerks: () => Promise<void>;
    currentStreak: number;
    streakShieldAvailable: boolean;
    useStreakShield: () => Promise<void>;
}

const DailyProgressContext = createContext<DailyProgressValue | undefined>(undefined);

const localDay = (raw: string | null | undefined) => (raw ? new Date(raw).toLocaleDateString('sv-SE') : '');

export function DailyProgressProvider({ children }: { children: React.ReactNode }) {
    const { walkData, walkStats, walkHistory } = useActivity();
    const { activePet } = usePet();
    const { user } = useAuth();
    const petId = activePet?.id ?? null;

    // Hedef (hayvana göre, sunucudan)
    const [goal, setGoal] = useState<({ petId: string } & WalkGoal) | null>(null);
    useEffect(() => {
        if (!user?.id || !petId) return;
        let alive = true;
        questService.walkGoal(petId).then(async g => {
            // Bir kerelik geçiş: eskiden telefonda tutulan elle hedef hayvanın kaydına taşınır.
            let legacy: string | null = null;
            try { legacy = localStorage.getItem(LEGACY_MANUAL_GOAL_KEY); } catch { /* depolama kapalı */ }
            if (legacy && g.manual_steps == null && Number(legacy) >= 0.5) {
                const steps = Math.round((Number(legacy) * STEPS_PER_KM) / STEP_GOAL.step) * STEP_GOAL.step;
                try { g = await questService.setWalkGoalSteps(petId, Math.min(STEP_GOAL.max, Math.max(STEP_GOAL.min, steps))); } catch { /* otomatikte kalır */ }
            }
            try { localStorage.removeItem(LEGACY_MANUAL_GOAL_KEY); } catch { /* depolama kapalı */ }
            if (alive) setGoal({ petId, ...g });
        }).catch(err => console.error('Günlük hedef okunamadı:', err));
        return () => { alive = false; };
    }, [user?.id, petId]);

    const current = goal && goal.petId === petId ? goal : null;
    const goalSteps = current?.goal_steps ?? FALLBACK_GOAL_STEPS;
    const goalKm = stepsToKm(goalSteps);
    // Süre hedefi, hayvanın gerçek temposundan (dk/km); veri yoksa 15 dk/km.
    const pace = walkStats && walkStats.totalDistanceKm > 0.5
        ? Math.min(25, Math.max(8, walkStats.totalDurationMinutes / walkStats.totalDistanceKm))
        : 15;
    const dailyGoal = { steps: goalSteps, distance: goalKm, duration: Math.round(goalKm * pace) };

    const setManualDailyGoalSteps = useCallback(async (steps: number | null) => {
        if (!petId) return;
        const g = await questService.setWalkGoalSteps(petId, steps);
        setGoal({ petId, ...g });
    }, [petId]);

    // Bugün: tamamlanmış yürüyüşler + (varsa) aktif yürüyüşün canlı değeri
    const today = new Date().toLocaleDateString('sv-SE');
    let doneKm = 0, doneMin = 0, doneSteps = 0;
    for (const w of walkHistory) {
        if (localDay(w.started_at || w.ended_at) !== today) continue;
        doneKm += w.distanceKm ?? (w.distance_meters ? w.distance_meters / 1000 : 0);
        doneMin += w.duration_minutes || 0;
        doneSteps += creditedSteps(w.steps, w.distanceKm ?? (w.distance_meters ? w.distance_meters / 1000 : 0));
    }
    const todayDistanceKm = doneKm + (walkData.isActive ? walkData.distance / 1000 : 0);
    const todayDurationMin = doneMin + (walkData.isActive ? walkData.time / 60 : 0);
    const todaySteps = doneSteps + (walkData.isActive ? creditedSteps(walkData.realSteps, walkData.distance / 1000) : 0);

    // PawCoin bakiyesi (tek kaynak profiles.pati_puan_balance)
    const [totalPatiPuan, setTotalPatiPuan] = useState(0);
    const refreshBalance = useCallback(() => {
        if (!user?.id) return;
        apiService.getPatiPuanBalance().then(setTotalPatiPuan).catch(err => console.error('PawCoin bakiyesi alınamadı:', err));
    }, [user?.id]);
    useEffect(() => {
        refreshBalance();
        window.addEventListener(BALANCE_CHANGED, refreshBalance);
        return () => window.removeEventListener(BALANCE_CHANGED, refreshBalance);
    }, [refreshBalance]);

    // Aktif geçici çerçeve hakları (süre kontrolü sunucu saatine göre; önbelleğe yazılmaz)
    const [activePerks, setActivePerks] = useState<Record<string, string>>({});
    const refreshActivePerks = useCallback(async () => {
        if (!user?.id) return;
        try { setActivePerks(await apiService.getActivePerks(user.id)); }
        catch (err) { console.error('Aktif çerçeve hakları alınamadı:', err); }
    }, [user?.id]);
    useEffect(() => {
        const load = () => { void refreshActivePerks(); };
        load();
        window.addEventListener(BALANCE_CHANGED, load);
        return () => window.removeEventListener(BALANCE_CHANGED, load);
    }, [refreshActivePerks]);
    const hasActivePerk = useCallback((perkKey: string) => {
        const expiresAt = activePerks[perkKey];
        return !!expiresAt && new Date(expiresAt).getTime() > Date.now();
    }, [activePerks]);

    // Seri kalkanı (sunucuda doğrulanır)
    const [streakShieldAvailable, setStreakShieldAvailable] = useState(true);
    useEffect(() => {
        if (!user?.id) return;
        apiService.getStreakShieldStatus().then(s => setStreakShieldAvailable(s.available))
            .catch(err => console.error('Seri kalkanı durumu alınamadı:', err));
    }, [user?.id]);
    const useStreakShield = useCallback(async () => {
        if (!streakShieldAvailable) return;
        const y = new Date();
        y.setDate(y.getDate() - 1);
        try {
            await apiService.useStreakShield(y.toLocaleDateString('sv-SE'));
            setStreakShieldAvailable(false);
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: '🛡️ Seri kalkanı kullanıldı, serin korundu.', icon: 'Shield', color: 'text-emerald-500' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: err instanceof Error ? err.message : 'Seri kalkanı kullanılamadı.', icon: 'AlertTriangle', color: 'text-red-400' },
            }));
        }
    }, [streakShieldAvailable]);

    return (
        <DailyProgressContext.Provider value={{
            dailyGoal,
            autoDailyGoalSteps: current?.auto_steps ?? FALLBACK_GOAL_STEPS,
            manualDailyGoalSteps: current?.manual_steps ?? null,
            setManualDailyGoalSteps,
            progressPercent: Math.min(100, (todaySteps / Math.max(1, goalSteps)) * 100),
            durationPercent: Math.min(100, (todayDurationMin / Math.max(1, dailyGoal.duration)) * 100),
            todayDistanceKm, todayDurationMin, todaySteps,
            totalPatiPuan, refreshBalance,
            activePerks, hasActivePerk, refreshActivePerks,
            currentStreak: walkStats?.currentStreak || 0,
            streakShieldAvailable, useStreakShield,
        }}>
            {children}
        </DailyProgressContext.Provider>
    );
}

export function useDailyProgress() {
    const ctx = useContext(DailyProgressContext);
    if (!ctx) throw new Error('useDailyProgress, DailyProgressProvider içinde kullanılmalı');
    return ctx;
}
