'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'apple-light' | 'apple-midnight' | 'neo-dark' | 'glass-pink' | 'mint-fresh';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('apple-midnight');

    useEffect(() => {
        const savedTheme = localStorage.getItem('moffi-theme') as Theme;
        if (savedTheme) {
            setThemeState(savedTheme);
            document.documentElement.className = savedTheme;
        } else {
            document.documentElement.className = 'neo-dark';
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('moffi-theme', newTheme);
        document.documentElement.className = newTheme;
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
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
