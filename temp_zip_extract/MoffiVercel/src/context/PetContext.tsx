"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiService } from "../services/apiService";

// --- TYPES ---
export interface Pet {
    id: string;
    name: string;
    breed: string;
    age?: string | number;
    weight: string | number;
    gender: string;
    image: string;
    cover_photo?: string;
    themeColor: string;
    microchip?: string;
    microchip_id?: string;
    neutered?: boolean;
    birthday?: string;
    city?: string;
    color?: string;
    owner?: {
        name: string;
        phone: string;
        address: string;
    };
    avatar?: string;
    is_lost?: boolean;
    // Hub-preview dashboard alanları
    health?: string;
    streak?: number;
    activity_target?: number;
    water_target?: number;
    food_target?: number;
    sos_settings?: {
        auto_post_sos: boolean;
        sos_radius: '2km' | '5km' | '10km' | 'city';
        secure_proxy_only: boolean;
        location_precision: 'exact' | 'area';
        emergency_sms_number: string;
        reward_amount: number;
        reward_currency: string;
        critical_health_note: string;
        finder_message: string;
        quiet_hours?: { enabled: boolean; from: string; to: string };
        emergency_bypass?: boolean;
        header_sos_alert_enabled?: boolean;
        reward_enabled?: boolean;
        // Ek izleme alanları
        weight?: string;
        health?: string;
        streak?: number;
        activity_target?: number;
        water_target?: number;
        food_target?: number;
    };
}

interface PetContextType {
    pets: Pet[];
    activePet: Pet | null;
    isLoading: boolean;
    addPet: (pet: Omit<Pet, 'id'> & { id?: string }) => void;
    updatePet: (id: string, updates: Partial<Pet>) => void;
    deletePet: (id: string) => void;
    switchPet: (id: string) => void;
    customRecords: Record<string, any[]>;
    setCustomRecords: (petId: string, records: any[]) => void;
    recordDocuments: Record<string, Record<string, string[]>>;
    setRecordDocuments: (petId: string, recordId: string, documents: string[]) => void;
    orders: Record<string, any[]>;
    setOrders: (petId: string, orders: any[]) => void;
    appointments: Record<string, any[]>;
    setAppointments: (petId: string, appointments: any[]) => void;
    walkRoutes: Record<string, any[]>;
    setWalkRoutes: (petId: string, routes: any[]) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

const INITIAL_PETS: Pet[] = [];


export function PetProvider({ children }: { children: React.ReactNode }) {
    const [pets, setPets] = useState<Pet[]>([]);
    const [activePetId, setActivePetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Track if initial load is done to prevent persistence effect from running prematurely
    const isInitializedRef = useRef(false);
    // Track previous values to prevent unnecessary saves
    const prevPetsRef = useRef<string>('');
    const prevActivePetIdRef = useRef<string | null>(null);

    // LOAD FROM SERVICE LAYER - runs ONCE
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const fetchedPets = await apiService.getPets();
                setPets(fetchedPets as any);
                prevPetsRef.current = JSON.stringify(fetchedPets);
                
                const active = await apiService.getActivePet();
                const activeId = active?.id || (fetchedPets[0]?.id || null);
                setActivePetId(activeId);
                prevActivePetIdRef.current = activeId;
            } catch (err) {
                console.error("Pet veri yükleme hatası:", err);
                setPets(INITIAL_PETS);
                setActivePetId(INITIAL_PETS[0].id);
            } finally {
                setIsLoading(false);
                isInitializedRef.current = true;
            }
        };
        loadInitialData();
    }, []); // RUNS ONCE ONLY

    // PERSISTENCE EFFECT - only saves when data actually changes
    // Uses JSON comparison to prevent unnecessary saves
    useEffect(() => {
        if (!isInitializedRef.current || isLoading) return;
        
        const petsJson = JSON.stringify(pets);
        const activePetChanged = activePetId !== prevActivePetIdRef.current;
        const petsChanged = petsJson !== prevPetsRef.current;
        
        if (petsChanged) {
            prevPetsRef.current = petsJson;
            apiService.saveData('pets', pets);
        }
        if (activePetChanged) {
            prevActivePetIdRef.current = activePetId;
            // Don't call setActivePet (Supabase) here - it causes auth re-fetches
            // Just save locally
            apiService.saveData('active_pet_id', activePetId);
        }
    }, [pets, activePetId, isLoading]);

    // --- ACTIONS ---
    const addPet = React.useCallback((newPetData: Omit<Pet, 'id'> & { id?: string }) => {
        const defaultSosSettings = {
            auto_post_sos: true, sos_radius: '5km' as const, secure_proxy_only: false,
            location_precision: 'exact' as const, emergency_sms_number: "", reward_amount: 0,
            reward_currency: "TL", critical_health_note: "",
            finder_message: "Lütfen yardıma ihtiyacım var!",
            quiet_hours: { enabled: false, from: "23:00", to: "08:00" },
            emergency_bypass: true, header_sos_alert_enabled: true,
            reward_enabled: false
        };
        const newPet: Pet = {
            ...newPetData,
            id: newPetData.id || `pet-${Date.now()}`,
            // Kullanıcının girdiği sos_settings değerlerini koru, eksikleri varsayılanla doldur
            sos_settings: newPetData.sos_settings
                ? { ...defaultSosSettings, ...newPetData.sos_settings }
                : defaultSosSettings
        };
        setPets(prev => [...prev, newPet]);
        setActivePetId(newPet.id);
    }, []);

    const updatePet = React.useCallback((id: string, updates: Partial<Pet>) => {
        setPets(prev => prev.map(pet => pet.id === id ? { ...pet, ...updates } : pet));
    }, []);

    const deletePet = React.useCallback(async (id: string) => {
        try {
            await apiService.deletePet(id);
            setPets(prev => {
                const newPets = prev.filter(p => p.id !== id);
                setActivePetId(curr => {
                    if (curr === id) return newPets[0]?.id || null;
                    return curr;
                });
                return newPets;
            });
        } catch (err) {
            console.error("Pet silme hatası:", err);
        }
    }, []);

    const switchPet = React.useCallback((id: string) => {
        setActivePetId(String(id));
    }, []);

    const petsWithMascot = React.useMemo(() => {
        return pets;
    }, [pets]);

    const activePet = React.useMemo(() => {
        return pets.find(p => String(p.id) === String(activePetId)) || null;
    }, [pets, activePetId]);

    const [customRecords, setCustomRecordsInternal] = useState<Record<string, any[]>>({});
    const [recordDocuments, setRecordDocumentsInternal] = useState<Record<string, Record<string, string[]>>>({});
    const [orders, setOrdersInternal] = useState<Record<string, any[]>>({});
    const [appointments, setAppointmentsInternal] = useState<Record<string, any[]>>({});
    const [walkRoutes, setWalkRoutesInternal] = useState<Record<string, any[]>>({});

    const setCustomRecords = React.useCallback((petId: string, records: any[]) => {
        setCustomRecordsInternal(prev => ({ ...prev, [petId]: records }));
    }, []);
    const setRecordDocuments = React.useCallback((petId: string, recordId: string, documents: string[]) => {
        setRecordDocumentsInternal(prev => ({ ...prev, [petId]: { ...(prev[petId] || {}), [recordId]: documents } }));
    }, []);
    const setOrders = React.useCallback((petId: string, orderList: any[]) => {
        setOrdersInternal(prev => ({ ...prev, [petId]: orderList }));
    }, []);
    const setAppointments = React.useCallback((petId: string, apptList: any[]) => {
        setAppointmentsInternal(prev => ({ ...prev, [petId]: apptList }));
    }, []);
    const setWalkRoutes = React.useCallback((petId: string, routeList: any[]) => {
        setWalkRoutesInternal(prev => ({ ...prev, [petId]: routeList }));
    }, []);

    // LOAD EXTRA DATA ONCE
    useEffect(() => {
        const loadExtraData = async () => {
            const storedRecords = await apiService.loadData<Record<string, any[]>>('custom_records');
            const storedDocs = await apiService.loadData<Record<string, Record<string, string[]>>>('record_docs');
            const storedOrders = await apiService.loadData<Record<string, any[]>>('orders');
            const storedAppts = await apiService.loadData<Record<string, any[]>>('appointments');
            const storedRoutes = await apiService.loadData<Record<string, any[]>>('walk_routes');
            if (storedRecords) setCustomRecordsInternal(storedRecords);
            if (storedDocs) setRecordDocumentsInternal(storedDocs);
            if (storedOrders) setOrdersInternal(storedOrders);
            if (storedAppts) setAppointmentsInternal(storedAppts);
            if (storedRoutes) setWalkRoutesInternal(storedRoutes);
        };
        loadExtraData();
    }, []); // RUNS ONCE ONLY

    // PERSIST EXTRA DATA - debounced via useMemo-stable refs
    useEffect(() => {
        if (!isInitializedRef.current) return;
        apiService.saveData('custom_records', customRecords);
    }, [customRecords]);
    useEffect(() => {
        if (!isInitializedRef.current) return;
        apiService.saveData('record_docs', recordDocuments);
    }, [recordDocuments]);
    useEffect(() => {
        if (!isInitializedRef.current) return;
        apiService.saveData('orders', orders);
    }, [orders]);
    useEffect(() => {
        if (!isInitializedRef.current) return;
        apiService.saveData('appointments', appointments);
    }, [appointments]);
    useEffect(() => {
        if (!isInitializedRef.current) return;
        apiService.saveData('walk_routes', walkRoutes);
    }, [walkRoutes]);

    const petValue = React.useMemo(() => ({
        pets: petsWithMascot, activePet, isLoading, addPet, updatePet, deletePet, switchPet,
        customRecords, setCustomRecords, recordDocuments, setRecordDocuments,
        orders, setOrders, appointments, setAppointments, walkRoutes, setWalkRoutes
    }), [
        petsWithMascot, activePet, isLoading, addPet, updatePet, deletePet, switchPet,
        customRecords, setCustomRecords, recordDocuments, setRecordDocuments,
        orders, setOrders, appointments, setAppointments, walkRoutes, setWalkRoutes
    ]);

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
