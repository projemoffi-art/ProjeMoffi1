'use client';

// Haftanın teması (yol haritası 8.52): yönetici panelinden girilen etiket. Etiketle ilk paylaşımda sunucu bir kez puan verir;
// kart sadece o an yayında bir tema varsa görünür, uydurma bir tema gösterilmez.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { socialService, type WeeklyTheme } from '@/services/socialService';

const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

export function WeeklyThemeCard({ onBrowse }: { onBrowse: (hashtag: string) => void }) {
    const [theme, setTheme] = useState<WeeklyTheme | null>(null);
    useEffect(() => { socialService.currentTheme().then(setTheme).catch(() => setTheme(null)); }, []);
    if (!theme) return null;

    return (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="rounded-3xl bg-card border border-card-border p-4 space-y-3" aria-label="Haftanın teması">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] font-black text-accent">Haftanın teması · {shortDate(theme.endsOn)}&apos;e kadar</div>
                    <h2 className="text-lg font-black leading-tight mt-0.5">{theme.title}</h2>
                    <div className="text-sm font-black text-secondary">#{theme.hashtag}</div>
                </div>
                {theme.rewardPoints > 0 && (
                    <span className={theme.joined
                        ? 'shrink-0 h-7 px-2.5 rounded-full bg-[#4E8F2A]/12 text-[#4E8F2A] text-xs font-black inline-flex items-center'
                        : 'shrink-0 h-7 px-2.5 rounded-full bg-accent/12 text-accent text-xs font-black inline-flex items-center tabular-nums'}>
                        {theme.joined ? 'Katıldın ✓' : `+${theme.rewardPoints} puan`}
                    </span>
                )}
            </div>
            {theme.description && <p className="text-sm font-semibold text-secondary leading-snug">{theme.description}</p>}
            <div className="flex items-center gap-2">
                <Link href={`/community/yeni?tema=${encodeURIComponent(theme.hashtag)}`}
                    className="h-10 px-4 rounded-2xl bg-accent text-white text-sm font-black inline-flex items-center">Katıl, paylaş</Link>
                <button onClick={() => onBrowse(theme.hashtag)} className="h-10 px-4 rounded-2xl bg-background border border-card-border text-sm font-black">Paylaşımları gör</button>
                {!!theme.participantCount && (
                    <span className="ml-auto text-xs font-bold text-secondary tabular-nums">{theme.participantCount.toLocaleString('tr-TR')} kişi katıldı</span>
                )}
            </div>
        </motion.section>
    );
}
