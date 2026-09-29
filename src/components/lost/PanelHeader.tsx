'use client';

// Kayıp & Bulunan / Sahiplendirme panelinin ortak üst kısmı: başlık, bildirim zili, profil ve iki sekme.

import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

export function PanelHeader({ active, subtitle }: { active: 'lost' | 'adopt'; subtitle: string }) {
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-black leading-none">Moffi <span className="text-accent">🐾</span></div>
                    <p className="text-xs font-semibold text-secondary mt-1">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-notification-drawer'))} aria-label="Bildirimler"
                        className="relative w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                        <Bell className="w-4.5 h-4.5" />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-card" />}
                    </button>
                    {user?.id && (
                        <Link href={`/profile/${user.id}`} aria-label="Profil" className="w-10 h-10 rounded-full overflow-hidden bg-card border border-card-border">
                            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : null}
                        </Link>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card border border-card-border">
                <Link href="/kayip" className={cn('h-10 rounded-xl flex items-center justify-center text-sm font-black',
                    active === 'lost' ? 'bg-accent text-white' : 'text-secondary')}>Kayıp & Bulunan</Link>
                <Link href="/sahiplendirme" className={cn('h-10 rounded-xl flex items-center justify-center text-sm font-black',
                    active === 'adopt' ? 'bg-accent text-white' : 'text-secondary')}>Sahiplendirme</Link>
            </div>
        </div>
    );
}
