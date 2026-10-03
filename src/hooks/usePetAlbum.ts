'use client';

// Albüm verisi için ortak hafıza: ana sayfa kartının Albüm/Genel sekmeleri ve /album aynı kaydı kullanır.
// Yükleme/silme sonrası invalidatePetAlbum(petId) çağrılır, açık tüm ekranlar yeniden okur.

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { albumService, type AlbumData, type AlbumPet } from '@/services/albumService';

type Entry = { status: 'loading' | 'ready' | 'error'; data: AlbumData | null; error: string | null; at: number };

const store = new Map<string, Entry>();
const listeners = new Set<() => void>();
const STALE_MS = 60_000;
let cleaned = false;

function emit() { listeners.forEach(fn => fn()); }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

function load(pet: AlbumPet, userId: string) {
    const prev = store.get(pet.id);
    store.set(pet.id, { status: 'loading', data: prev?.data ?? null, error: null, at: Date.now() });
    emit();
    if (!cleaned) { cleaned = true; albumService.cleanupStale().catch(() => { cleaned = false; }); }
    albumService.load(pet, userId)
        .then(data => store.set(pet.id, { status: 'ready', data, error: null, at: Date.now() }))
        .catch((err: unknown) => store.set(pet.id, { status: 'error', data: prev?.data ?? null, error: err instanceof Error ? err.message : 'Albüm okunamadı.', at: Date.now() }))
        .finally(emit);
}

export function invalidatePetAlbum(petId: string) {
    const e = store.get(petId);
    if (e) { store.set(petId, { ...e, at: 0 }); emit(); }
}

const EMPTY: Entry = { status: 'loading', data: null, error: null, at: 0 };

export function usePetAlbum(pet: AlbumPet | null, userId: string | null | undefined, enabled = true) {
    const petId = pet?.id ?? null;
    const entry = useSyncExternalStore(subscribe, () => (petId ? store.get(petId) ?? EMPTY : EMPTY), () => EMPTY);

    // pet nesnesi her çizimde yeni olabilir; yalnızca içeriği izlenir.
    const name = pet?.name ?? '';
    const avatar = pet?.avatar ?? null;
    const cover = pet?.cover ?? null;
    const birthday = pet?.birthday ?? null;
    const createdAt = pet?.createdAt ?? null;
    const at = entry.at;
    useEffect(() => {
        if (!enabled || !petId || !userId) return;
        const e = store.get(petId);
        if (!e || e.at === 0 || (e.status !== 'loading' && Date.now() - e.at > STALE_MS)) {
            load({ id: petId, name, avatar, cover, birthday, createdAt }, userId);
        }
    }, [enabled, petId, name, avatar, cover, birthday, createdAt, userId, at]);

    const reload = useCallback(() => {
        if (petId && userId) load({ id: petId, name, avatar, cover, birthday, createdAt }, userId);
    }, [petId, name, avatar, cover, birthday, createdAt, userId]);
    return { ...entry, reload };
}
