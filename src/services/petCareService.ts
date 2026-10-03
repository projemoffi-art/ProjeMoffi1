// Günlük bakım (öğün + taze su + oyun), ana sayfa üst kartının Genel sekmesi ve Görev Merkezi. Migration 20261004101100_pet_care_and_album.
// Kayıt yalnızca sunucu fonksiyonlarıyla; gün Türkiye takvim günü (sunucu belirler). Abonelik: aynı hayvanın kaydı bir
// ekranda değişince diğer açık ekranlar da güncellenir.

import { supabase } from '@/lib/supabase';

export interface PetCareToday {
    date: string;
    mealsGiven: number;
    mealsTarget: number;
    waterRefreshedAt: string | null;
    /** Kedi ve diğerlerinde günlük hareket görevi (20261004102300). */
    playedAt: string | null;
}

interface CareRow { date: string; meals_given: number; meals_target: number; water_refreshed_at: string | null; played_at?: string | null }

const map = (r: CareRow): PetCareToday => ({
    date: r.date, mealsGiven: r.meals_given, mealsTarget: r.meals_target, waterRefreshedAt: r.water_refreshed_at, playedAt: r.played_at ?? null,
});

const cache = new Map<string, PetCareToday>();
const listeners = new Map<string, Set<(v: PetCareToday) => void>>();

function publish(petId: string, value: PetCareToday) {
    cache.set(petId, value);
    listeners.get(petId)?.forEach(fn => fn(value));
}

async function call(fn: string, args: Record<string, unknown>, fallback: string): Promise<CareRow> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) throw new Error(error.message || fallback);
    return data as CareRow;
}

export const petCareService = {
    peek(petId: string) { return cache.get(petId) ?? null; },

    subscribe(petId: string, fn: (v: PetCareToday) => void) {
        const set = listeners.get(petId) ?? new Set();
        set.add(fn);
        listeners.set(petId, set);
        return () => { set.delete(fn); };
    },

    async load(petId: string) {
        const row = map(await call('pet_care_today', { p_pet: petId }, 'Günlük bakım okunamadı.'));
        publish(petId, row);
        return row;
    },

    async log(petId: string, kind: 'meal' | 'water' | 'play', undo = false) {
        const row = map(await call('log_pet_care', { p_pet: petId, p_kind: kind, p_undo: undo }, 'Kaydedilemedi.'));
        publish(petId, row);
        return row;
    },

    async setMealsPerDay(petId: string, meals: number | null) {
        const row = map(await call('set_pet_meals_per_day', { p_pet: petId, p_meals: meals }, 'Öğün sayısı kaydedilemedi.'));
        publish(petId, row);
        return row;
    },
};
