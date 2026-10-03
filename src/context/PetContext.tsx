"use client";

// Kullanıcının evcil hayvanları ve seçili hayvan (tek kaynak: pets tablosu + profiles.active_pet_id).
// Randevular da burada (sağlık, veteriner ve profil ekranları aynı listeyi kullanır; işletme değişikliği canlı gelir).
// (2026-10-03: yalnızca sahte veri katmanına yazılıp hiç okunmayan kayıtlar — customRecords, recordDocuments, orders, walkRoutes —
// ve veritabanına gitmeden sahte kimlikle hayvan ekleyen addPet kaldırıldı.)

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { PETS_CHANGED_EVENT } from "@/services/lostService";
import type { Pet } from '@/services/types';

// Tek tanım services/types'ta (eskiden burada ikinci, uyumsuz bir Pet vardı).
export type { Pet };

type Appointment = Awaited<ReturnType<typeof apiService.getAppointments>>[number];

interface PetContextType {
    pets: Pet[];
    activePet: Pet | null;
    isLoading: boolean;
    isInitialized: boolean;
    /** Veritabanına kaydedilmiş (apiService.addPet) hayvanı listeye alır ve seçili yapar; liste sunucudan tazelenir. */
    addPet: (pet: Pick<Pet, 'id'> & Partial<Pet>) => void;
    updatePet: (id: string, updates: Partial<Pet>) => void;
    deletePet: (id: string) => void;
    switchPet: (id: string) => void;
    /** Hayvan kimliğine göre randevular. */
    appointments: Record<string, Appointment[]>;
    refreshAppointments: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);
const NO_APPOINTMENTS: Record<string, Appointment[]> = {};
const NO_PETS: Pet[] = [];

export function PetProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    // Hangi kullanıcı için yüklendiği de tutulur: oturum değişince eski kullanıcının hayvanları görünmez.
    const [state, setState] = useState<{ userId: string | null; pets: Pet[]; activePetId: string | null; loaded: boolean }>(
        { userId: null, pets: [], activePetId: null, loaded: false });
    const [appointmentsState, setAppointmentsState] = useState<{ userId: string | null; byPet: Record<string, Appointment[]> }>({ userId: null, byPet: {} });

    const current = state.userId === userId ? state : { userId, pets: NO_PETS, activePetId: null, loaded: false };

    const loadPets = useCallback(async (uid: string, preferActive?: string | null) => {
        try {
            const [fetched, active] = await Promise.all([apiService.getPets(), preferActive ? Promise.resolve(null) : apiService.getActivePet()]);
            const activeId = preferActive || active?.id || fetched[0]?.id || null;
            setState({ userId: uid, pets: fetched, activePetId: activeId, loaded: true });
        } catch (err) {
            console.error("Pet veri yükleme hatası:", err);
            setState({ userId: uid, pets: [], activePetId: null, loaded: true });
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        Promise.all([apiService.getPets(), apiService.getActivePet()])
            .then(([fetched, active]) => {
                if (alive) setState({ userId, pets: fetched, activePetId: active?.id || fetched[0]?.id || null, loaded: true });
            })
            .catch(err => {
                console.error("Pet veri yükleme hatası:", err);
                if (alive) setState({ userId, pets: [], activePetId: null, loaded: true });
            });
        return () => { alive = false; };
    }, [userId]);

    // Kayıp modu (pets.is_lost) sadece sunucuda değişir; lostService bu olayı yayar.
    useEffect(() => {
        if (!userId) return;
        const reload = () => {
            apiService.getPets()
                .then(fetched => setState(s => (s.userId === userId ? { ...s, pets: fetched } : s)))
                .catch(err => console.error('Pet yenileme hatası:', err));
        };
        window.addEventListener(PETS_CHANGED_EVENT, reload);
        return () => window.removeEventListener(PETS_CHANGED_EVENT, reload);
    }, [userId]);

    const addPet = useCallback((pet: Pick<Pet, 'id'> & Partial<Pet>) => {
        if (!userId) return;
        apiService.setActivePet(pet.id).catch(err => console.error('Seçili hayvan kaydedilemedi:', err));
        loadPets(userId, pet.id);
    }, [userId, loadPets]);

    const updatePet = useCallback((id: string, updates: Partial<Pet>) => {
        setState(s => ({ ...s, pets: s.pets.map(pet => pet.id === id ? { ...pet, ...updates } : pet) }));
        apiService.updatePet(id, updates).catch(err => {
            console.error("Pet veri tabanı güncelleme hatası:", err);
        });
    }, []);

    const deletePet = useCallback(async (id: string) => {
        try {
            await apiService.deletePet(id);
            setState(s => {
                const pets = s.pets.filter(p => p.id !== id);
                return { ...s, pets, activePetId: s.activePetId === id ? pets[0]?.id || null : s.activePetId };
            });
        } catch (err) {
            console.error("Pet silme hatası:", err);
        }
    }, []);

    const switchPet = useCallback((id: string) => {
        setState(s => ({ ...s, activePetId: String(id) }));
        // Seçim cihazlar arasında korunur (profiles.active_pet_id).
        apiService.setActivePet(String(id)).catch(err => console.error('Seçili hayvan kaydedilemedi:', err));
    }, []);

    const activePet = useMemo(
        () => current.pets.find(p => String(p.id) === String(current.activePetId)) || null,
        [current.pets, current.activePetId]);

    const refreshAppointments = useCallback(async () => {
        if (!userId) return;
        try {
            const list = await apiService.getAppointments(userId);
            const grouped: Record<string, Appointment[]> = {};
            for (const apt of list) {
                const pid = String(apt.pet_id ?? '');
                (grouped[pid] ||= []).push(apt);
            }
            setAppointmentsState({ userId, byPet: grouped });
        } catch (err) {
            console.error("Failed to load user appointments:", err);
        }
    }, [userId]);

    // Randevular: ilk yükleme, pencere odağında tazeleme ve işletme değişikliklerinde canlı güncelleme.
    useEffect(() => {
        if (!userId) return;
        const load = () => { refreshAppointments(); };
        const first = setTimeout(load, 0);
        window.addEventListener('focus', load);
        const channel = supabase
            .channel(`user-appointments-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, load)
            .subscribe();
        return () => {
            clearTimeout(first);
            window.removeEventListener('focus', load);
            supabase.removeChannel(channel);
        };
    }, [userId, refreshAppointments]);

    const appointments = appointmentsState.userId === userId ? appointmentsState.byPet : NO_APPOINTMENTS;
    // Oturum yokken yükleme beklenmez; oturum varken ilk okuma bitene kadar yükleniyor.
    const isLoading = !!userId && !current.loaded;
    const isInitialized = !!userId && current.loaded;

    const petValue = useMemo(() => ({
        pets: current.pets, activePet, isLoading, isInitialized, addPet, updatePet, deletePet, switchPet,
        appointments, refreshAppointments,
    }), [current.pets, activePet, isLoading, isInitialized, addPet, updatePet, deletePet, switchPet, appointments, refreshAppointments]);

    return (
        <PetContext.Provider value={petValue}>
            {children}
        </PetContext.Provider>
    );
}

export function usePet() {
    const context = useContext(PetContext);
    if (context === undefined) {
        throw new Error("usePet must be used within a PetProvider");
    }
    return context;
}
