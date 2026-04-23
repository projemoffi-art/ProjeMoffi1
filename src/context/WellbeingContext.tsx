"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface WellbeingContextType {
    minutesUsed: number;
    isLimitReached: boolean;
    isQuietModeActive: boolean;
    resetLimitForToday: () => void;
    ignoreLimitForNow: () => void;
}

const WellbeingContext = createContext<WellbeingContextType | undefined>(undefined);

export function WellbeingProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [minutesUsed, setMinutesUsed] = useState(0);
    const [isLimitIgnored, setIsLimitIgnored] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 1. Minute Tracker Logic
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `moffi_wellbeing_minutes_${today}`;
        
        // Initial load for today
        const saved = localStorage.getItem(storageKey);
        if (saved) setMinutesUsed(parseInt(saved));

        // Periodic update (every minute)
        const timer = setInterval(() => {
            setMinutesUsed(prev => {
                const next = prev + 1;
                localStorage.setItem(storageKey, next.toString());
                return next;
            });
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // 2. Limit Check Logic
    const isLimitReached = useMemo(() => {
        if (isLimitIgnored) return false;
        const limit = user?.settings?.wellbeing?.dailyLimit || 60;
        return minutesUsed >= limit;
    }, [minutesUsed, user?.settings?.wellbeing?.dailyLimit, isLimitIgnored]);

    // 3. Quiet Mode Logic
    const isQuietModeActive = useMemo(() => {
        const qm = user?.settings?.wellbeing?.quietMode;
        if (!qm?.enabled) return false;

        const [nowH, nowM] = [currentTime.getHours(), currentTime.getMinutes()];
        const [fromH, fromM] = qm.from.split(':').map(Number);
        const [toH, toM] = qm.to.split(':').map(Number);

        const nowMinutes = nowH * 60 + nowM;
        const fromMinutes = fromH * 60 + fromM;
        const toMinutes = toH * 60 + toM;

        if (fromMinutes < toMinutes) {
            // Same day range (e.g. 09:00 - 17:00)
            return nowMinutes >= fromMinutes && nowMinutes < toMinutes;
        } else {
            // Over midnight range (e.g. 23:00 - 07:00)
            return nowMinutes >= fromMinutes || nowMinutes < toMinutes;
        }
    }, [currentTime, user?.settings?.wellbeing?.quietMode]);

    const resetLimitForToday = React.useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `moffi_wellbeing_minutes_${today}`;
        setMinutesUsed(0);
        localStorage.setItem(storageKey, '0');
        setIsLimitIgnored(false);
    }, []);

    const ignoreLimitForNow = React.useCallback(() => {
        setIsLimitIgnored(true);
    }, []);

    const wellbeingValue = useMemo(() => ({ 
        minutesUsed, 
        isLimitReached, 
        isQuietModeActive,
        resetLimitForToday,
        ignoreLimitForNow
    }), [minutesUsed, isLimitReached, isQuietModeActive, resetLimitForToday, ignoreLimitForNow]);

    return (
        <WellbeingContext.Provider value={wellbeingValue}>
            {children}
        </WellbeingContext.Provider>
    );
}

export const useWellbeing = () => {
    const context = useContext(WellbeingContext);
    if (!context) throw new Error("useWellbeing must be used within a WellbeingProvider");
    return context;
};
