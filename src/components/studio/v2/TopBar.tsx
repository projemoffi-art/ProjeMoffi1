"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Undo, Redo, Download, Share2, Check } from 'lucide-react';
import { useStudio } from './StudioEngine';
import { cn } from '@/lib/utils';

export function TopBar() {
    const router = useRouter();
    const { state, dispatch } = useStudio();

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-50 fixed top-0 left-0 right-0">
            {/* LEFT: Back & Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">Studio Pro</h1>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Apple Edition</span>
                </div>

                {/* HISTORY MOVED HERE */}
                <div className="hidden md:flex items-center gap-1 ml-2 pl-4 border-l border-gray-200 dark:border-white/10">
                    <button
                        onClick={() => dispatch({ type: 'UNDO' })}
                        disabled={state.historyIndex <= 0}
                        className="p-2 rounded-lg disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition"
                    >
                        <Undo className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'REDO' })}
                        disabled={state.historyIndex >= state.history.length - 1}
                        className="p-2 rounded-lg disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition"
                    >
                        <Redo className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* CENTER: History Controls */}
            {/* CENTER: MODE SWITCHER */}


            {/* RIGHT: Actions */}
            <div className="flex items-center gap-3">
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full transition">
                    <Share2 className="w-4 h-4" />
                    Paylaş
                </button>
                <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <Check className="w-4 h-4" />
                    Tamamla
                </button>
            </div>
        </header>
    );
}
