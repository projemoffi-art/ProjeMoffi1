'use client';

// Kayıp & Bulunan'da ilanların hangi konuma göre sıralanacağı. Öncelik: kullanıcının seçtiği bölge
// (bu tarayıcıda hatırlanır) → tarayıcının konumu → yakın çevre bildirimi için kaydettiği bölge → İstanbul.

import { useCallback, useEffect, useState } from 'react';
import { areaName, currentPosition } from '@/lib/geo';
import { lostService } from '@/services/lostService';

export interface SearchArea { lat: number; lng: number; name: string; source: 'chosen' | 'device' | 'alert' | 'default' }

const KEY = 'moffi_lost_search_area';
const DEFAULT: SearchArea = { lat: 41.0082, lng: 28.9784, name: 'İstanbul', source: 'default' };

function readSaved(): SearchArea | null {
    try {
        const v = JSON.parse(localStorage.getItem(KEY) || 'null');
        return v && typeof v.lat === 'number' && typeof v.lng === 'number' ? { ...v, source: 'chosen' } : null;
    } catch {
        return null;
    }
}

export function useSearchArea() {
    const [area, setArea] = useState<SearchArea | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            const saved = readSaved();
            if (saved) { setArea(saved); return; }
            const pos = await currentPosition(8000);
            if (pos) {
                const name = (await areaName(pos.lat, pos.lng)) || 'Konumun';
                if (alive) setArea({ ...pos, name, source: 'device' });
                return;
            }
            const alert = await lostService.alertArea().catch(() => null);
            if (alert?.lat != null && alert.lng != null) {
                const name = (await areaName(alert.lat, alert.lng)) || 'Seçtiğin bölge';
                if (alive) setArea({ lat: alert.lat, lng: alert.lng, name, source: 'alert' });
                return;
            }
            if (alive) setArea(DEFAULT);
        })();
        return () => { alive = false; };
    }, []);

    const choose = useCallback(async (lat: number, lng: number, name?: string) => {
        const next: SearchArea = { lat, lng, name: name || (await areaName(lat, lng)) || 'Seçtiğin bölge', source: 'chosen' };
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* sadece bu oturumda kalır */ }
        setArea(next);
        return next;
    }, []);

    const detectDevice = useCallback(async () => {
        const pos = await currentPosition(10000);
        if (!pos) return null;
        try { localStorage.removeItem(KEY); } catch { /* yoksay */ }
        const next: SearchArea = { ...pos, name: (await areaName(pos.lat, pos.lng)) || 'Konumun', source: 'device' };
        setArea(next);
        return next;
    }, []);

    return { area, choose, detectDevice };
}
