"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function GlobalIdentitySync() {
    const { user } = useAuth();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (!user?.settings?.appearance) return;

        const { appearance } = user.settings;

        // 1. Sync Theme (Overall App Mode)
        // If theme synchronization is desired, we can map aura settings to themes here.
        // For now, let's focus on accent colors and fonts.

        // 2. Inject Accent Color Variable
        const root = document.documentElement;
        const colorMap: Record<string, string> = {
            default: '#6366f1', // Indigo
            cyan: '#06b6d4',
            emerald: '#10b881',
            rose: '#f43f5e',
            violet: '#8b5cf6',
            amber: '#f59e0b'
        };

        const accentHex = colorMap[appearance.accentColor] || colorMap.default;
        root.style.setProperty('--moffi-accent', accentHex);
        root.style.setProperty('--moffi-accent-transparent', `${accentHex}33`);

        // 3. (Font Injection removed - using global Plus Jakarta Sans)

    }, [user?.settings?.appearance?.accentColor, user?.settings?.appearance?.font]);

    return null;
}
