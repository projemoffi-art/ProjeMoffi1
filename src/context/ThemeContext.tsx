'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'apple-midnight' | 'apple-light' | 'pastel-soft' | 'prime-cyber';
type FontSize = 'small' | 'medium' | 'large';
type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user, updateSettings } = useAuth();
    const [theme, setThemeState] = useState<Theme>('apple-midnight');
    const [fontSize, setFontSizeState] = useState<FontSize>('medium');
    const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>('none');
    
    // Accessibility States
    const [boldText, setBoldTextState] = useState(false);
    const [highContrast, setHighContrastState] = useState(false);
    const [reduceMotion, setReduceMotionState] = useState(false);
    const [reduceTransparency, setReduceTransparencyState] = useState(false);

    // localStorage'dan theme'i yükle (sadece ilk açılışta)
    useEffect(() => {
        const savedTheme = localStorage.getItem('moffi-theme') as Theme;
        if (savedTheme) setThemeState(savedTheme);
    }, []);


    // Apply classes to document root
    useEffect(() => {
        const root = document.documentElement;
        
        const classesToRemove = [
            'apple-midnight', 'apple-light', 'pastel-soft', 'prime-cyber',
            'font-size-small', 'font-size-medium', 'font-size-large',
            'font-sans', 'font-serif', 'font-mono', 'font-pacifico', 'font-satisfy', 'font-playfair',
            'cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia',
            'bold-text', 'high-contrast', 'reduce-motion', 'reduce-transparency'
        ];
        root.classList.remove(...classesToRemove);

        // Apply new classes
        root.classList.add(theme);
        root.classList.add(`font-size-${fontSize}`);
        
        // Apply Global Font from settings if exists
        const activeFont = user?.settings?.appearance?.font || 'font-sans';
        root.classList.add(activeFont);

        if (colorBlindMode !== 'none') root.classList.add(`cb-${colorBlindMode}`);
        if (boldText) root.classList.add('bold-text');
        if (highContrast) root.classList.add('high-contrast');
        if (reduceMotion) root.classList.add('reduce-motion');
        if (reduceTransparency) root.classList.add('reduce-transparency');
    }, [theme, fontSize, colorBlindMode, boldText, highContrast, reduceMotion, reduceTransparency]);

    const setTheme = React.useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('moffi-theme', newTheme);
    }, []);

    const setFontSize = React.useCallback((size: FontSize) => {
        setFontSizeState(size);
        updateSettings('accessibility', { fontSize: size });
    }, [updateSettings]);

    const setColorBlindMode = React.useCallback((mode: ColorBlindMode) => {
        setColorBlindModeState(mode);
        updateSettings('accessibility', { colorBlindMode: mode });
    }, [updateSettings]);

    const setBoldText = React.useCallback((v: boolean) => {
        setBoldTextState(v);
        updateSettings('accessibility', { boldText: v });
    }, [updateSettings]);

    const setHighContrast = React.useCallback((v: boolean) => {
        setHighContrastState(v);
        updateSettings('accessibility', { highContrast: v });
    }, [updateSettings]);

    const setReduceMotion = React.useCallback((v: boolean) => {
        setReduceMotionState(v);
        updateSettings('accessibility', { reduceMotion: v });
    }, [updateSettings]);

    const setReduceTransparency = React.useCallback((v: boolean) => {
        setReduceTransparencyState(v);
        updateSettings('accessibility', { reduceTransparency: v });
    }, [updateSettings]);

    const themeValue = React.useMemo(() => ({
        theme, setTheme,
        fontSize, setFontSize,
        colorBlindMode, setColorBlindMode,
        boldText, setBoldText,
        highContrast, setHighContrast,
        reduceMotion, setReduceMotion,
        reduceTransparency, setReduceTransparency
    }), [
        theme, fontSize, colorBlindMode, boldText, highContrast, reduceMotion, reduceTransparency,
        setTheme, setFontSize, setColorBlindMode, setBoldText, setHighContrast, setReduceMotion, setReduceTransparency
    ]);

    // Sync from LocalStorage / AuthContext with redundancy check
    useEffect(() => {
        // 1. Initial LocalStorage load (Client-side only)
        const savedTheme = localStorage.getItem('moffi-theme') as Theme;
        if (savedTheme && savedTheme !== theme) {
            setThemeState(savedTheme);
        }

        // 2. Sync from AuthContext (Stable primitives)
        if (user?.settings?.accessibility) {
            const acc = user.settings.accessibility;
            if (acc.fontSize !== fontSize) setFontSizeState(acc.fontSize || 'medium');
            if (acc.colorBlindMode !== colorBlindMode) setColorBlindModeState(acc.colorBlindMode || 'none');
            
            const bText = !!acc.boldText;
            if (bText !== boldText) setBoldTextState(bText);
            
            const hCont = !!acc.highContrast;
            if (hCont !== highContrast) setHighContrastState(hCont);
            
            const rMot = !!acc.reduceMotion;
            if (rMot !== reduceMotion) setReduceMotionState(rMot);
            
            const rTrans = !!acc.reduceTransparency;
            if (rTrans !== reduceTransparency) setReduceTransparencyState(rTrans);
        }
    }, [
        user?.id, 
        user?.settings?.accessibility?.fontSize,
        user?.settings?.accessibility?.colorBlindMode,
        user?.settings?.accessibility?.boldText,
        user?.settings?.accessibility?.highContrast,
        user?.settings?.accessibility?.reduceMotion,
        user?.settings?.accessibility?.reduceTransparency
    ]);

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
