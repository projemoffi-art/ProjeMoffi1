'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Compass, Plus, MessageCircle, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useChat } from '@/context/ChatContext';

interface MoffiBottomNavProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    isVisible?: boolean;
}

export function MoffiBottomNav({ activeTab: propActiveTab, onTabChange, isVisible = true }: MoffiBottomNavProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { unreadCount, isInboxOpen, setIsInboxOpen } = useChat();
    
    const [isHubLongPressing, setIsHubLongPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const activeTab = propActiveTab || (pathname === '/community' ? 'home' : pathname?.startsWith('/profile') ? 'profile' : 'feed');

    const handleTabClick = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            if (tab === 'home') {
                router.push('/community');
            } else if (tab === 'feed') {
                router.push('/topluluk?tab=feed');
            }
        }
    };

    const handleHubClick = () => {
        window.dispatchEvent(new CustomEvent('open-moffi-action-hub'));
    };

    const handleProfileClick = () => {
        if (user?.id) {
            router.push(`/profile/${user.id}`);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[6000] pointer-events-none flex justify-center">
            <motion.nav 
                initial={false}
                animate={{ y: isVisible ? 0 : 150, opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="pointer-events-auto w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-md backdrop-saturate-[1.5] border-t border-x border-white/30 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_-5px_20px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_-5px_20px_rgba(0,0,0,0.3)] rounded-t-3xl overflow-visible pb-1"
            >
                <div className="px-6 relative h-[3.25rem] flex items-center justify-between">
                    
                    {/* 1. ANA SAYFA */}
                    <button
                        onClick={() => handleTabClick('home')}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center transition-all active:scale-90 h-full",
                            activeTab === 'home' ? "text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-foreground/80 hover:text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        )}
                    >
                        <Home className={cn("w-5 h-5", activeTab === 'home' && "text-cyan-600 dark:text-cyan-400")} />
                    </button>

                    {/* 2. KEŞFET */}
                    <button
                        onClick={() => handleTabClick('feed')}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center transition-all active:scale-90 h-full",
                            activeTab === 'feed' ? "text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-foreground/80 hover:text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        )}
                    >
                        <Compass className={cn("w-5 h-5", activeTab === 'feed' && "text-cyan-600 dark:text-cyan-400")} />
                    </button>

                    {/* 3. CENTER: HUB BUTTON */}
                    <div className="flex-1 flex justify-center relative">
                        <button
                            onPointerDown={() => {
                                longPressTimer.current = setTimeout(() => {
                                    setIsHubLongPressing(true);
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                                    window.dispatchEvent(new CustomEvent('open-sos-center'));
                                    setTimeout(() => setIsHubLongPressing(false), 800);
                                }, 500);
                            }}
                            onPointerUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); setIsHubLongPressing(false); }}
                            onClick={handleHubClick}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-[var(--background)] dark:border-[#1c1c21] active:scale-95 transition-all group absolute -top-5",
                                isHubLongPressing 
                                    ? "bg-red-600 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)] border-red-400" 
                                    : "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 text-white shadow-[0_10px_25px_rgba(34,211,238,0.4)]"
                            )}
                        >
                            <Plus className={cn("w-6 h-6 transition-transform duration-500", isHubLongPressing ? "scale-125 rotate-45" : "group-hover:rotate-90")} />
                        </button>
                        <div className="h-full" />
                    </div>

                    {/* 4. MESAJLAR */}
                    <button
                        onClick={() => setIsInboxOpen(true)}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center transition-all active:scale-90 h-full",
                            isInboxOpen ? "text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-foreground/80 hover:text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        )}
                    >
                        <div className="relative">
                            <MessageCircle className={cn("w-5 h-5", isInboxOpen && "text-cyan-600 dark:text-cyan-400")} />
                            {unreadCount > 0 && (
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border border-[var(--background)] flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                >
                                    <span className="text-[7px] font-black text-black">{unreadCount}</span>
                                </motion.div>
                            )}
                        </div>
                    </button>

                    {/* 5. PROFİL */}
                    <button
                        onClick={handleProfileClick}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center transition-all active:scale-90 h-full",
                            activeTab === 'profile' ? "text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-foreground/80 hover:text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        )}
                    >
                        {user?.avatar ? (
                            <div className={cn("w-5 h-5 rounded-full border overflow-hidden transition-colors", activeTab === 'profile' ? "border-cyan-600 dark:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "border-foreground/10")}>
                                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                            </div>
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </motion.nav>
        </div>
    );
}
