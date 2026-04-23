"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PremiumUpgradeModal } from '@/components/community/modals/PremiumUpgradeModal';

export function GlobalIdentitySync() {
    const { user } = useAuth();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (!user?.settings) return;

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

        // 3. Inject Font Family
        const fontMap: Record<string, string> = {
            'font-sans': 'var(--font-inter), sans-serif',
            'font-serif': 'var(--font-playfair), serif',
            'font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            'font-pacifico': 'var(--font-pacifico), cursive'
        };

        const activeFont = fontMap[appearance.font] || fontMap['font-sans'];
        root.style.setProperty('--moffi-font-main', activeFont);
        
        // Apply class to body for global font injection with redundancy check
        const fontClass = appearance.font;
        if (!document.body.classList.contains(fontClass)) {
            const classesToRemove = Array.from(document.body.classList).filter(c => c.startsWith('font-'));
            if (classesToRemove.length > 0) document.body.classList.remove(...classesToRemove);
            document.body.classList.add(fontClass);
        }

    }, [user?.settings?.appearance?.accentColor, user?.settings?.appearance?.font]);

    return <PremiumUpgradeModal />;
}
