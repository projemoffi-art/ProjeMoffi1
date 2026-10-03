'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, type AccessibilitySettings } from './AuthContext';

type Theme = 'light' | 'dark';
/** Kullanıcının seçimi: açık, koyu ya da cihazın ayarı. Varsayılan açık (Baran, 2026-10-03). */
export type ThemePreference = 'light' | 'dark' | 'system';
const isPreference = (v: unknown): v is ThemePreference => v === 'light' || v === 'dark' || v === 'system';
type FontSize = 'small' | 'medium' | 'large';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

interface ThemeContextType {
    /** O an uygulanan tema (sistem seçiliyse cihazın ayarına göre çözülmüş hâli). */
    theme: Theme;
    setTheme: (theme: ThemePreference) => void;
    preference: ThemePreference;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    colorBlindMode: ColorBlindMode;
    setColorBlindMode: (mode: ColorBlindMode) => void;
    
    // Accessibility Enhancements
    boldText: boolean;
    setBoldText: (v: boolean) => void;
    highContrast: boolean;
    setHighContrast: (v: boolean) => void;
    reduceMotion: boolean;
    setReduceMotion: (v: boolean) => void;
    reduceTransparency: boolean;
    setReduceTransparency: (v: boolean) => void;
    seniorMode: boolean;
    setSeniorMode: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Cihazdaki tema seçimi (girişten önce de geçerli). Aynı sekmedeki değişiklik özel olayla duyurulur.
const THEME_KEY = 'moffi-theme';
const THEME_EVENT = 'moffi-theme-change';
const subscribeStoredTheme = (cb: () => void) => {
    window.addEventListener('storage', cb);
    window.addEventListener(THEME_EVENT, cb);
    return () => { window.removeEventListener('storage', cb); window.removeEventListener(THEME_EVENT, cb); };
};
const readStoredTheme = (): ThemePreference | null => {
    try { const v = localStorage.getItem(THEME_KEY); return isPreference(v) ? v : null; } catch { return null; }
};
const writeStoredTheme = (v: ThemePreference) => {
    try { localStorage.setItem(THEME_KEY, v); } catch { /* gizli pencere: yalnızca hesaba yazılır */ }
    window.dispatchEvent(new Event(THEME_EVENT));
};

const subscribeSystemDark = (cb: () => void) => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};
const readSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const AUTH_PATHS = ['/', '/onboarding', '/login', '/register', '/business-register', '/reset-password', '/auth/callback'];

// Tema ve erişilebilirlik değerleri kopyalanmaz, kaynağından türetilir: hesap ayarları (settings.appearance.theme,
// settings.accessibility) önce, yoksa cihazdaki seçim. updateSettings kullanıcıyı anında güncellediği için ayrı state gerekmez.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user, updateSettings } = useAuth();
    const pathname = usePathname();
    const storedTheme = useSyncExternalStore(subscribeStoredTheme, readStoredTheme, () => null);
    const systemDark = useSyncExternalStore(subscribeSystemDark, readSystemDark, () => false);

    const accountTheme = user?.settings?.appearance?.theme;
    const preference: ThemePreference = (isPreference(accountTheme) ? accountTheme : null) ?? storedTheme ?? 'light';
    const theme: Theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

    const acc = user?.settings?.accessibility;
    const fontSize: FontSize = acc?.fontSize || 'medium';
    const colorBlindMode: ColorBlindMode = acc?.colorBlindMode || 'none';
    const boldText = !!acc?.boldText;
    const highContrast = !!acc?.highContrast;
    const reduceMotion = !!acc?.reduceMotion;
    const reduceTransparency = !!acc?.reduceTransparency;
    const seniorMode = !!acc?.seniorMode;
    const font = user?.settings?.appearance?.font || 'font-sans';

    // Hesaptaki seçim bu cihaza da yazılır: çıkış yapınca ya da giriş ekranında aynı tema kalsın.
    useEffect(() => {
        if (isPreference(accountTheme) && accountTheme !== readStoredTheme()) writeStoredTheme(accountTheme);
    }, [accountTheme]);

    // Sınıfları <html>'e uygula (giriş ve kurulum ekranları her zaman açık tema)
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(
            'apple-midnight', 'apple-light', 'pastel-soft', 'prime-cyber', 'light', 'dark',
            'font-size-small', 'font-size-medium', 'font-size-large',
            'font-sans', 'font-serif', 'font-mono', 'font-pacifico', 'font-satisfy', 'font-playfair',
            'cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia',
            'bold-text', 'high-contrast', 'reduce-motion', 'reduce-transparency', 'senior-mode',
            'theme-green', 'theme-cyan', 'theme-purple', 'theme-gold', 'theme-rose',
        );
        root.classList.add(AUTH_PATHS.includes(pathname || '') ? 'light' : theme);
        root.classList.add(`font-size-${fontSize}`);
        root.classList.add(font);
        if (colorBlindMode !== 'none') root.classList.add(`cb-${colorBlindMode}`);
        if (boldText) root.classList.add('bold-text');
        if (highContrast) root.classList.add('high-contrast');
        if (reduceMotion) root.classList.add('reduce-motion');
        if (reduceTransparency) root.classList.add('reduce-transparency');
        if (seniorMode) root.classList.add('senior-mode');
    }, [theme, fontSize, colorBlindMode, boldText, highContrast, reduceMotion, reduceTransparency, seniorMode, pathname, font]);

    const setTheme = React.useCallback((next: ThemePreference) => {
        writeStoredTheme(next);
        updateSettings('appearance', { theme: next });
    }, [updateSettings]);

    const setAccessibility = React.useCallback((patch: AccessibilitySettings) => { updateSettings('accessibility', patch); }, [updateSettings]);

    const themeValue = React.useMemo<ThemeContextType>(() => ({
        theme, setTheme, preference,
        fontSize, setFontSize: (v) => setAccessibility({ fontSize: v }),
        colorBlindMode, setColorBlindMode: (v) => setAccessibility({ colorBlindMode: v }),
        boldText, setBoldText: (v) => setAccessibility({ boldText: v }),
        highContrast, setHighContrast: (v) => setAccessibility({ highContrast: v }),
        reduceMotion, setReduceMotion: (v) => setAccessibility({ reduceMotion: v }),
        reduceTransparency, setReduceTransparency: (v) => setAccessibility({ reduceTransparency: v }),
        seniorMode, setSeniorMode: (v) => setAccessibility({ seniorMode: v }),
    }), [theme, setTheme, preference, fontSize, colorBlindMode, boldText, highContrast, reduceMotion, reduceTransparency, seniorMode, setAccessibility]);

    return (
        <ThemeContext.Provider value={themeValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
