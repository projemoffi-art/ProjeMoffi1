import React from 'react';
import { Undo, Redo } from 'lucide-react';
import { useStudio } from './StudioEngine';

export function HistoryControls() {
    const { state, dispatch } = useStudio();

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/90 dark:bg-black/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-100 dark:border-white/10 transition-all hover:scale-105">
            <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.historyIndex <= 0}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                title="Geri Al"
            >
                <Undo className="w-5 h-5" />
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-white/20" />

            <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.historyIndex >= state.history.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                title="İleri Al"
            >
                <Redo className="w-5 h-5" />
            </button>
        </div>
    );
}
