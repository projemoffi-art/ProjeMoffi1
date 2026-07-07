'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Compass, Plus, Trophy, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useQuestEngine } from '@/context/QuestEngineContext';

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
    const { completedCount, totalCount } = useQuestEngine();
    
    const [isHubLongPressing, setIsHubLongPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const activeTab = propActiveTab || (pathname === '/community' ? 'home' : pathname?.startsWith('/profile') ? 'profile' : pathname === '/quests' ? 'quests' : 'feed');
    const questPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const allQuestsDone = completedCount === totalCount && totalCount > 0;

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

    const handleQuestClick = () => {
        router.push('/quests');
    };

    const handleProfileClick = () => {
        if (user?.id) {
            router.push(`/profile/${user.id}`);
        }
    };

    return (
        <motion.nav 
            initial={false}
            animate={{ y: isVisible ? 0 : 100, opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed bottom-0 left-0 right-0 z-[6000] bg-[#0c0c0c]/80 backdrop-blur-3xl border-t border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)]"
        >
            <div className="px-4 pt-3 pb-safe max-w-lg mx-auto relative h-[4.5rem] flex items-center justify-between">
                    
                    {/* 1. ANA SAYFA */}
                    <button
                        onClick={() => handleTabClick('home')}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 transition-all active:scale-90",
                            activeTab === 'home' ? "text-cyan-400" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Home className={cn("w-6 h-6", activeTab === 'home' && "text-cyan-400")} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('navigation.home')}</span>
                    </button>

                    {/* 2. KEŞFET */}
                    <button
                        onClick={() => handleTabClick('feed')}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 transition-all active:scale-90",
                            activeTab === 'feed' ? "text-cyan-400" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Compass className={cn("w-6 h-6", activeTab === 'feed' && "text-cyan-400")} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('navigation.discover')}</span>
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
                                "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 border-[#0c0c0c] active:scale-95 transition-all group absolute -top-8 sm:-top-10",
                                isHubLongPressing 
                                    ? "bg-red-600 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)] border-red-400" 
                                    : "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 text-white shadow-[0_15px_35px_rgba(34,211,238,0.4)]"
                            )}
                        >
                            <Plus className={cn("w-8 h-8 transition-transform duration-500", isHubLongPressing ? "scale-125 rotate-45" : "group-hover:rotate-90")} />
                        </button>
                        <div className="h-10" />
                    </div>

                    {/* 4. GÖREVLER */}
                    <button
                        onClick={handleQuestClick}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 transition-all active:scale-90 relative",
                            activeTab === 'quests' ? "text-orange-400" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <div className="relative">
                            <Trophy className={cn("w-6 h-6", allQuestsDone && 'text-yellow-400')} />
                            {/* Progress arc indicator */}
                            {questPct > 0 && questPct < 100 && (
                                <motion.div
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-[#0c0c0c]"
                                />
                            )}
                            {allQuestsDone && (
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-[#0c0c0c]"
                                />
                            )}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Görevler</span>
                    </button>

                    {/* 5. PROFİL */}
                    <button
                        onClick={handleProfileClick}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 transition-all active:scale-90",
                            activeTab === 'profile' ? "text-cyan-400" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        {user?.avatar ? (
                            <div className={cn("w-6 h-6 rounded-full border overflow-hidden transition-colors", activeTab === 'profile' ? "border-cyan-400" : "border-white/10")}>
                                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                            </div>
                        ) : (
                            <User className="w-6 h-6" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('navigation.profile')}</span>
                    </button>
                </div>
        </motion.nav>
    );
}
