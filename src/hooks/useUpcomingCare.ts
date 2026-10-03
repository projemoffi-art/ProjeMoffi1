'use client';

// Ana sayfa "Hatırlatmalar" ve kenar paneli "Sıradaki sağlık işi" için TÜM hayvanların yaklaşan sağlık işleri.
// Kaynak Sağlık Merkezi ile aynı: healthService'in ortak karne hafızası + lib/health/derive hesapları.
// Ayrı bir sağlık hesabı tutulmaz; sağlık ekranında yapılan değişiklik buraya anında yansır.

import { useEffect, useMemo, useState } from 'react';
import { healthService } from '@/services/healthService';
import { apiService } from '@/services/apiService';
import { isMedicationActive, medicationDaysLeft, speciesOf, upcomingItems } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';
import type { HealthBundle } from '@/types/health';
import type { Pet } from '@/context/PetContext';

export type CareKind = 'vaccine' | 'parasite' | 'appointment' | 'medication';

export interface CareItem {
    id: string;
    petId: string;
    petName: string;
    kind: CareKind;
    title: string;
    /** YYYY-MM-DD; ilaçta bitiş tarihi (yoksa null) */
    date: string | null;
    daysLeft: number | null;
    href: string;
    detail?: string;
}

/** Aşı/parazit/randevu için ana sayfada gösterilen pencere (gün). */
const WINDOW_DAYS = 60;

// Randevular kullanıcı başına tek sorgu; ana sayfa ve kenar paneli aynı anda istese de bir kez çekilir.
type AppointmentRow = Parameters<typeof upcomingItems>[1][number] & { pet_id?: string | null };
let appointmentCache: { userId: string; at: number; promise: Promise<AppointmentRow[]> } | null = null;
function loadAppointments(userId: string): Promise<AppointmentRow[]> {
    if (appointmentCache && appointmentCache.userId === userId && Date.now() - appointmentCache.at < 60_000) {
        return appointmentCache.promise;
    }
    const promise = apiService.getAppointments(userId).catch(() => []);
    appointmentCache = { userId, at: Date.now(), promise };
    return promise;
}

export function useUpcomingCare(pets: Pet[], userId: string | null | undefined, enabled = true) {
    const petKey = pets.map(p => `${p.id}:${speciesOf(p)}`).join('|');
    const [bundles, setBundles] = useState<Record<string, HealthBundle | null>>({});
    const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!enabled || !userId || pets.length === 0) { setLoaded(pets.length === 0); return; }
        let alive = true;
        const initial: Record<string, HealthBundle | null> = {};
        pets.forEach(p => { initial[p.id] = healthService.peekBundle(p.id); });
        setBundles(initial);

        const unsubscribers = pets.map(p => healthService.subscribeBundle(p.id, b => {
            if (alive) setBundles(prev => ({ ...prev, [p.id]: b }));
        }));
        Promise.all([
            ...pets.map(p => healthService.loadBundle(p.id, speciesOf(p)).catch(() => null)),
            loadAppointments(userId).then(list => { if (alive) setAppointments(list); }),
        ]).finally(() => { if (alive) setLoaded(true); });

        return () => { alive = false; unsubscribers.forEach(u => u()); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [petKey, userId, enabled]);

    const items = useMemo<CareItem[]>(() => {
        const today = todayKey();
        const list: CareItem[] = [];
        for (const pet of pets) {
            const bundle = bundles[pet.id];
            if (!bundle) continue;
            const petAppointments = appointments.filter(a => String(a.pet_id) === String(pet.id));
            for (const i of upcomingItems(bundle, petAppointments, today)) {
                if (i.daysLeft > WINDOW_DAYS) continue;
                list.push({ id: `${pet.id}-${i.id}`, petId: pet.id, petName: pet.name, kind: i.kind, title: i.title, date: i.date, daysLeft: i.daysLeft, href: i.href });
            }
            for (const m of bundle.medications.filter(m => isMedicationActive(m, today))) {
                list.push({
                    id: `${pet.id}-med-${m.id}`, petId: pet.id, petName: pet.name, kind: 'medication', title: m.name,
                    date: m.endDate || null, daysLeft: medicationDaysLeft(m, today), href: '/health/ilaclar',
                    detail: [m.dosage, m.frequency].filter(Boolean).join(' · ') || 'Devam eden tedavi',
                });
            }
        }
        // Geciken en üstte, sonra en yakın tarih; bitiş tarihi olmayan tedaviler en sonda.
        return list.sort((a, b) => {
            if (a.daysLeft === null && b.daysLeft === null) return 0;
            if (a.daysLeft === null) return 1;
            if (b.daysLeft === null) return -1;
            return a.daysLeft - b.daysLeft;
        });
    }, [bundles, appointments, pets]);

    return { items, loaded };
}
