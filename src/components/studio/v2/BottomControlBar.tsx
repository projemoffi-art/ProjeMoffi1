import React from 'react';
import { useStudio } from './StudioEngine';
import { cn } from '@/lib/utils';
import { Type, Image as ImageIcon, Sparkles, Move, Wand2, Layers } from 'lucide-react';

export function BottomControlBar() {
    const { state, dispatch } = useStudio();
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none">



            {/* MAIN MODE SWITCHER (The "Bar") */}
            <div className="pointer-events-auto bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-2xl p-1.5 rounded-full shadow-2xl border border-white/20 flex gap-1 items-center relative">
                {([
                    { id: 'PLACEMENT', label: 'Yerleştir', icon: Move },
                    { id: 'STAGING', label: 'Sahnele', icon: Wand2 },
                    { id: 'CREATION', label: 'Yarat', icon: Layers }
                ] as const).map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => dispatch({ type: 'SET_MODE', payload: mode.id })}
                        className={cn(
                            "px-6 py-3 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2",
                            state.activeMode === mode.id
                                ? "bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105 ring-4 ring-white/20 dark:ring-black/20"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        {/* Only show Icon on mobile? No, show both but small. */}
                        <mode.icon className={cn("w-4 h-4", state.activeMode === mode.id ? "animate-pulse" : "")} />
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
