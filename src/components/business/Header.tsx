"use client";

import React from "react";
import { Menu } from "lucide-react";

interface HeaderProps {
    onMenuClick?: () => void;
}

export function BusinessHeader({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-20 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#27272a] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-bold text-foreground dark:text-white hidden sm:block">Business Panel (Global Header)</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-xs text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                    Global Header Alanı
                </div>
            </div>
        </header>
    );
}
