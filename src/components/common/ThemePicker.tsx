'use client';

// Tema seçici (Açık / Koyu / Sistem). Ayarlar → Görünüm ve kenar paneli aynı bileşeni kullanır;
// seçim ThemeContext üzerinden cihazda ve hesap ayarlarında saklanır.

import { Moon, Smartphone, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { haptics } from '@/native';
import { cn } from '@/lib/utils';

const OPTIONS: { id: ThemePreference; label: string; Icon: typeof Sun }[] = [
    { id: 'light', label: 'Açık', Icon: Sun },
    { id: 'dark', label: 'Koyu', Icon: Moon },
    { id: 'system', label: 'Sistem', Icon: Smartphone },
];

export function ThemePicker({ compact = false, className }: { compact?: boolean; className?: string }) {
    const { preference, setTheme } = useTheme();
    return (
        <div role="radiogroup" aria-label="Tema" className={cn('grid grid-cols-3 gap-1 p-1 rounded-2xl bg-foreground/[0.06]', className)}>
            {OPTIONS.map(({ id, label, Icon }) => {
                const active = preference === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={label}
                        onClick={() => { haptics.tap(); setTheme(id); }}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all',
                            compact ? 'h-9 text-[12px]' : 'h-11 text-[13.5px]',
                            active ? 'bg-card text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'text-secondary',
                        )}
                    >
                        <Icon className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} strokeWidth={2.2} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
