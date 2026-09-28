'use client';

// /health altındaki tüm ekranların tek veri kaynağı: aktif evcil hayvanın Sağlık Kaydı bir kez
// yüklenir, her yazma işleminden sonra refresh() ile tazelenir.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePet, type Pet } from '@/context/PetContext';
import { healthService } from '@/services/healthService';
import { todayKey } from '@/lib/appointmentTime';
import { speciesOf } from '@/lib/health/derive';
import type { HealthBundle, HealthSpecies } from '@/types/health';

interface HealthContextValue {
    pet: Pet | null;
    pets: Pet[];
    species: HealthSpecies;
    switchPet: (id: string) => void;
    bundle: HealthBundle | null;
    appointments: any[];
    today: string;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    /** Bir yazma işlemini çalıştırır, sonra kaydı tazeler; hata metnini döner (başarılıysa null). */
    run: (action: () => Promise<unknown>) => Promise<string | null>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

export { speciesOf };

export function HealthProvider({ children }: { children: React.ReactNode }) {
    const { pets, activePet, switchPet, appointments: petAppointments, isInitialized } = usePet();
    const [bundle, setBundle] = useState<HealthBundle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const requestRef = useRef(0);
    const species = speciesOf(activePet);
    const petId = activePet?.id || null;

    const load = useCallback(async (force: boolean) => {
        if (!petId) { setBundle(null); setLoading(false); return; }
        const req = ++requestRef.current;
        try {
            const data = await healthService.loadBundle(petId, species, force);
            if (req === requestRef.current) { setBundle(data); setError(null); }
        } catch (e: any) {
            if (req === requestRef.current) setError(e?.message || 'Sağlık kaydı yüklenemedi.');
        } finally {
            if (req === requestRef.current) setLoading(false);
        }
    }, [petId, species]);

    /** Yazma işleminden sonra: karneyi yeniden yükler, ortak hafızadaki kopyayı herkes için günceller. */
    const refresh = useCallback(() => load(true), [load]);

    // Aynı karneyi başka bir ekran tazelerse buradaki kopya da güncellenir.
    useEffect(() => {
        if (!petId) return;
        return healthService.subscribeBundle(petId, b => { if (b) setBundle(b); });
    }, [petId]);

    // Bildirimden gelen "?pet=<id>": o evcil hayvanın karnesini aç (bir kez).
    const deepLinkHandled = useRef(false);
    useEffect(() => {
        if (!isInitialized || deepLinkHandled.current) return;
        deepLinkHandled.current = true;
        const target = new URLSearchParams(window.location.search).get('pet');
        if (target && target !== activePet?.id && pets.some(p => p.id === target)) switchPet(target);
    }, [isInitialized, pets, activePet?.id, switchPet]);

    useEffect(() => {
        if (!isInitialized) return;
        const cached = petId ? healthService.peekBundle(petId) : null;
        setBundle(cached);
        setLoading(!cached);
        // Hafızada varsa hemen gösterilir, arkadan tazelenir (başka cihazdaki değişiklikler de gelsin).
        load(!!cached);
    }, [load, isInitialized, petId]);

    const run = useCallback(async (action: () => Promise<unknown>) => {
        try {
            await action();
            await refresh();
            return null;
        } catch (e: any) {
            return e?.message || 'İşlem tamamlanamadı.';
        }
    }, [refresh]);

    const value = useMemo<HealthContextValue>(() => ({
        pet: activePet, pets, species, switchPet, bundle,
        appointments: (petId && petAppointments?.[petId]) || [],
        today: todayKey(), loading: loading || !isInitialized, error, refresh, run,
    }), [activePet, pets, species, switchPet, bundle, petId, petAppointments, loading, isInitialized, error, refresh, run]);

    return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
    const ctx = useContext(HealthContext);
    if (!ctx) throw new Error('useHealth, HealthProvider içinde kullanılmalı');
    return ctx;
}
