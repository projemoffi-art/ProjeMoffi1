'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Bell, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommunityHeaderProps {
    unreadNotifications: number;
    onNotificationsClick: () => void;
    onSearchClick: () => void;
    onCameraClick: () => void;
}

export function CommunityHeader({
    unreadNotifications,
    onNotificationsClick,
    onSearchClick,
    onCameraClick
}: CommunityHeaderProps) {
    return (
        <header className="fixed top-0 inset-x-0 z-40 bg-black/60 backdrop-blur-xl px-6 pt-12 pb-4 flex items-center justify-between border-b border-white/5">
            <h1 className="text-2xl font-black text-white tracking-tighter">Moffi</h1>
            
            <div className="flex items-center gap-2">
                <button onClick={onSearchClick} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <Search className="w-5 h-5 text-gray-400" />
                </button>
                <button onClick={onNotificationsClick} className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-400" />
                    {unreadNotifications > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] font-black text-black border-2 border-black">
                            {unreadNotifications}
                        </div>
                    )}
                </button>
                <button onClick={onCameraClick} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <Camera className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        </header>
    );
}
