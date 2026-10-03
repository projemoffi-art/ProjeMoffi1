'use client';

// Alt menü (design-reference/home-final + community-final): Ana Sayfa · Keşfet · Moffi AI (orta) · Pati Yardım · Profil.
// Etiketli, aktif sekme turuncu; zemin uygulamanın kart rengi (koyu temada sıcak koyu karşılığı).

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, HeartHandshake, Home, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { haptics } from '@/native';

interface MoffiBottomNavProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    isVisible?: boolean;
}

export function MoffiBottomNav({ activeTab: propActiveTab, onTabChange, isVisible = true }: MoffiBottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const isHelpActive = !!pathname && (pathname.startsWith('/kayip') || pathname.startsWith('/sahiplendirme'));
    const activeTab = isHelpActive ? 'help' : propActiveTab || (pathname === '/home' ? 'home' : pathname?.startsWith('/profile') ? 'profile' : pathname?.startsWith('/community') ? 'feed' : '');

    const go = (tab: string) => {
        haptics.tap();
        if (tab === 'help') { router.push('/kayip'); return; }
        if (tab === 'profile' && !onTabChange) { if (user?.id) router.push(`/profile/${user.id}`); return; }
        if (onTabChange) onTabChange(tab);
        else if (tab === 'home') router.push('/home');
        else if (tab === 'feed') router.push('/community');
    };

    const tabs = [
        { id: 'home', label: 'Ana Sayfa', Icon: Home },
        { id: 'feed', label: 'Keşfet', Icon: Compass },
        { id: 'ai', label: '', Icon: Sparkles },
        { id: 'help', label: 'Pati Yardım', Icon: HeartHandshake },
        { id: 'profile', label: 'Profil', Icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[6000] pointer-events-none flex justify-center">
            <motion.nav
                aria-label="Ana menü"
                initial={false}
                animate={{ y: isVisible ? 0 : 140 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="theme-vet pointer-events-auto w-full max-w-md bg-card/95 backdrop-blur-xl border-t border-card-border shadow-[0_-8px_28px_-12px_rgba(32,27,22,0.22)] rounded-t-[24px] pb-[env(safe-area-inset-bottom)]"
            >
                <div className="relative h-[62px] grid grid-cols-5 items-center px-2">
                    {tabs.map(({ id, label, Icon }) => {
                        if (id === 'ai') {
                            return (
                                <div key={id} className="flex justify-center">
                                    <button
                                        type="button"
                                        aria-label="Moffi AI"
                                        onClick={() => { haptics.tap(); window.dispatchEvent(new CustomEvent('open-ai-assistant')); }}
                                        className="-mt-7 w-[60px] h-[60px] rounded-full bg-accent text-white flex flex-col items-center justify-center border-[4px] border-card shadow-[0_10px_24px_-8px_rgba(238,91,61,0.75)] active:scale-95 transition-transform"
                                    >
                                        <Sparkles className="w-6 h-6" strokeWidth={2.2} />
                                    </button>
                                </div>
                            );
                        }
                        const active = activeTab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-current={active ? 'page' : undefined}
                                onClick={() => go(id)}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 h-full active:scale-95 transition-all',
                                    active ? 'text-accent' : 'text-secondary',
                                )}
                            >
                                {id === 'profile' && user?.avatar ? (
                                    <span className={cn('w-6 h-6 rounded-full overflow-hidden border-2', active ? 'border-accent' : 'border-transparent')}>
                                        <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                    </span>
                                ) : (
                                    <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 2} fill={active && id === 'home' ? 'currentColor' : 'none'} fillOpacity={0.15} />
                                )}
                                <span className={cn('text-[11px] leading-none', active ? 'font-extrabold' : 'font-semibold')}>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.nav>
        </div>
    );
}
