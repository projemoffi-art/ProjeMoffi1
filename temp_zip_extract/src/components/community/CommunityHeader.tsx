'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Bell, Search, Plus, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackModal } from './modals/FeedbackModal';

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
    const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

    return (
        <>
            <header className="fixed top-0 inset-x-0 z-40 bg-glass backdrop-blur-xl px-6 pt-12 pb-4 flex items-center justify-between border-b border-glass-border">
                <h1 className="text-2xl font-black text-foreground tracking-tighter">Moffi</h1>
                
                <div className="flex items-center gap-2">
                    <button onClick={onSearchClick} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
                        <Search className="w-5 h-5 text-foreground/60" />
                    </button>
                    
                    {/* CUTE FEEDBACK BUTTON */}
                    <motion.button 
                        onClick={() => setIsFeedbackOpen(true)}
                        animate={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 3 
                        }}
                        className="p-2 rounded-full hover:bg-accent/10 transition-colors group"
                    >
                        <MessageSquareHeart className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                    </motion.button>

                    <button onClick={onNotificationsClick} className="p-2 rounded-full hover:bg-foreground/10 transition-colors relative">
                        <Bell className="w-5 h-5 text-foreground/60" />
                        {unreadNotifications > 0 && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-background">
                                {unreadNotifications}
                            </div>
                        )}
                    </button>
                    <button onClick={onCameraClick} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
                        <Camera className="w-5 h-5 text-foreground/60" />
                    </button>
                </div>
            </header>

            <FeedbackModal 
                isOpen={isFeedbackOpen} 
                onClose={() => setIsFeedbackOpen(false)} 
            />
        </>
    );
}
