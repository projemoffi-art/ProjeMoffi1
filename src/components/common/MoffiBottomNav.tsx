'use client';

// Alt menü (design-reference/home-final + community-final): Ana Sayfa · Keşfet · Moffi AI (orta) · Pati Yardım · Profil.
// Liquid Glass'tan esinlenen yüzen cam hap: kenarlara ve alta yapışık değil, içeriğin üstünde süzülür.
// Aktif sekmenin arkasında kayan bir "mercek" vardır; orta düğme Moffi AI panelini açar.

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

const TABS = [
    { id: 'home', label: 'Ana Sayfa', Icon: Home },
    { id: 'feed', label: 'Keşfet', Icon: Compass },
    { id: 'ai', label: 'Moffi AI', Icon: Sparkles },
    { id: 'help', label: 'Pati Yardım', Icon: HeartHandshake },
    { id: 'profile', label: 'Profil', Icon: User },
] as const;

export function MoffiBottomNav({ activeTab: propActiveTab, onTabChange, isVisible = true }: MoffiBottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const isHelpActive = !!pathname && (pathname.startsWith('/kayip') || pathname.startsWith('/sahiplendirme'));
    const activeTab = isHelpActive ? 'help' : propActiveTab || (pathname === '/home' ? 'home' : pathname?.startsWith('/profile') ? 'profile' : pathname?.startsWith('/community') ? 'feed' : '');

    const go = (tab: string) => {
        haptics.tap();
        if (tab === 'ai') { window.dispatchEvent(new CustomEvent('open-ai-assistant')); return; }
        if (tab === 'help') { router.push('/kayip'); return; }
        if (tab === 'profile' && !onTabChange) { if (user?.id) router.push(`/profile/${user.id}`); return; }
        if (onTabChange) onTabChange(tab);
        else if (tab === 'home') router.push('/home');
        else if (tab === 'feed') router.push('/community');
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[6000] pointer-events-none flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]">
            <motion.nav
                aria-label="Ana menü"
                initial={false}
                animate={{ y: isVisible ? 0 : 130, scale: isVisible ? 1 : 0.96 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="theme-vet glass pointer-events-auto w-full max-w-[420px] rounded-[30px]"
            >
                <div className="relative h-[66px] grid grid-cols-5 items-center px-1.5">
                    {TABS.map(({ id, label, Icon }) => {
                        if (id === 'ai') {
                            return (
                                <div key={id} className="flex justify-center">
                                    <button
                                        type="button"
                                        aria-label="Moffi AI"
                                        onClick={() => go('ai')}
                                        className="relative -mt-6 w-[58px] h-[58px] rounded-full text-white flex items-center justify-center active:scale-95 transition-transform"
                                        style={{
                                            background: 'radial-gradient(120% 120% at 30% 20%, #FF9A6B 0%, #EE5B3D 45%, #C8432A 100%)',
                                            boxShadow: '0 12px 26px -8px rgba(238,91,61,0.85), inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -2px 6px rgba(120,30,10,0.35)',
                                        }}
                                    >
                                        <span className="absolute inset-0 rounded-full ring-[3px] ring-white/80 dark:ring-white/15" />
                                        <Sparkles className="relative w-[26px] h-[26px]" strokeWidth={2.2} />
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
                                className={cn('relative h-[56px] mx-0.5 flex flex-col items-center justify-center gap-0.5 rounded-[22px] active:scale-95 transition-transform', active ? 'text-accent' : 'text-secondary')}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="nav-lens"
                                        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                                        className="absolute inset-0 rounded-[22px] bg-accent/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none"
                                    />
                                )}
                                {id === 'profile' && user?.avatar ? (
                                    <span className={cn('relative w-[26px] h-[26px] rounded-full overflow-hidden border-2', active ? 'border-accent' : 'border-transparent')}>
                                        <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                    </span>
                                ) : (
                                    <Icon className="relative w-[24px] h-[24px]" strokeWidth={active ? 2.4 : 2} />
                                )}
                                <span className={cn('relative text-[10.5px] leading-none', active ? 'font-extrabold' : 'font-semibold')}>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.nav>
        </div>
    );
}
