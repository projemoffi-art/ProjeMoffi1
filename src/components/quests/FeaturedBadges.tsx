'use client';

// Profil rozet vitrini: sahibinin Rozet Kasası'nda "Profilimde göster" dediği rozetler (featured_badges).
// Vitrin boşsa kendi profilinde Rozet Kasası'na kısa bir bağlantı, başkasının profilinde hiçbir şey görünmez.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Medallion } from './QuestUI';

interface Featured { key: string; title: string; icon: string; pet_name: string }

export function FeaturedBadges({ ownerId, own }: { ownerId: string; own: boolean }) {
    const [state, setState] = useState<{ ownerId: string; list: Featured[] } | null>(null);

    useEffect(() => {
        let alive = true;
        supabase.rpc('featured_badges', { p_owner: ownerId }).then(({ data, error }) => {
            if (alive && !error) setState({ ownerId, list: (data as Featured[] | null) ?? [] });
        });
        return () => { alive = false; };
    }, [ownerId]);

    const list = state && state.ownerId === ownerId ? state.list : null;
    if (!list) return null;
    if (list.length === 0) {
        return own ? (
            <Link href="/quests/rozetler" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-accent">🏅 Rozet vitrinini düzenle</Link>
        ) : null;
    }
    return (
        <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-black text-secondary">Rozet vitrini</span>
                {own && <Link href="/quests/rozetler" className="text-[12px] font-bold text-accent">Düzenle</Link>}
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {list.map(b => (
                    <div key={`${b.pet_name}-${b.key}`} className="flex flex-col items-center w-[72px] shrink-0 text-center">
                        <Medallion icon={b.icon} earned size={52} />
                        <span className="text-[11px] font-bold leading-tight mt-1 line-clamp-2">{b.title}</span>
                        <span className="text-[10px] font-semibold text-secondary truncate w-full">{b.pet_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
