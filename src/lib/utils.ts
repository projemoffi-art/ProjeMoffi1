import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Moffi Professional Toast Dispatcher
 * Replaces legacy alert() with premium system notifications
 */
export function showToast(message: string, icon: 'Sparkles' | 'Bell' | 'Zap' | 'Heart' | 'PawPrint' | 'X' = 'Bell', color?: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('moffi-toast', { 
            detail: { message, icon, color } 
        }));
    }
}
