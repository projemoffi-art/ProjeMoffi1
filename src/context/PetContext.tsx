"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
    neutered?: boolean;
    birthday?: string;
    city?: string;
    color?: string;
    owner?: {
        name: string;
        phone: string;
        address: string;
    };
    avatar?: string; // Support for both field names
    is_lost?: boolean; // SOS Status
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
    };
}

interface PetContextType {
    pets: Pet[];
    activePet: Pet | null;
    isLoading: boolean;
    addPet: (pet: Omit<Pet, 'id'>) => void;
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

// --- MOCK INITIAL DATA ---
const INITIAL_PETS: Pet[] = [
    {
        id: 'pet-1',
        name: "Milo",
        breed: "Golden Retriever",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200",
        microchip: "985-000-111-222",
        birthday: "15 Nisan 2021",
        city: "İSTANBUL / TR",
        gender: "Erkek",
        color: "Bal Sarısı",
        weight: "28.5 kg",
        neutered: true,
        themeColor: '#EAB308',
        owner: {
            name: "Uveys Moffi",
            phone: "+90 532 000 00 00",
            address: "Kadıköy, İstanbul"
        },
        sos_settings: {
            auto_post_sos: true,
            sos_radius: '5km',
            secure_proxy_only: false,
            location_precision: 'exact',
            emergency_sms_number: "",
            reward_amount: 0,
            reward_currency: "TL",
            critical_health_note: "",
            finder_message: "Lütfen bahçeye kapatıp beni arayın.",
            quiet_hours: { enabled: false, from: "23:00", to: "08:00" },
            emergency_bypass: true
        }
    },
    {
        id: 'pet-2',
        name: "Luna",
        breed: "British Shorthair",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200",
        microchip: "985-000-333-444",
        birthday: "10 Mart 2022",
        city: "İSTANBUL / TR",
        gender: "Dişi",
        color: "Gri Duman",
        weight: "4.2 kg",
        neutered: true,
        themeColor: '#8B5CF6',
        owner: {
            name: "Uveys Moffi",
            phone: "+90 532 000 00 00",
            address: "Kadıköy, İstanbul"
        },
        sos_settings: {
            auto_post_sos: true,
            sos_radius: '5km',
            secure_proxy_only: false,
            location_precision: 'exact',
            emergency_sms_number: "",
            reward_amount: 0,
            reward_currency: "TL",
            critical_health_note: "",
            finder_message: "Lütfen bahçeye kapatıp beni arayın."
        }
    }
];

export function PetProvider({ children }: { children: React.ReactNode }) {
    const [pets, setPets] = useState<Pet[]>([]);
    const [activePetId, setActivePetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // LOAD FROM SERVICE LAYER
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const fetchedPets = await apiService.getPets();
                setPets(fetchedPets as any);
                
                const active = await apiService.getActivePet();
                if (active) {
                    setActivePetId(active.id);
                } else if (fetchedPets.length > 0) {
                    setActivePetId(fetchedPets[0].id);
                }
            } catch (err) {
                console.error("Pet veri yükleme hatası:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // PERSISTENCE EFFECT (Delegated to Service)
    useEffect(() => {
        if (!isLoading) {
            apiService.saveData('pets', pets);
            if (activePetId) apiService.setActivePet(activePetId);
        }
    }, [pets, activePetId, isLoading]);

    // --- ACTIONS ---
    const addPet = React.useCallback((newPetData: Omit<Pet, 'id'>) => {
        const newPet: Pet = {
            ...newPetData,
            id: `pet-${Date.now()}`,
            sos_settings: {
                auto_post_sos: true,
                sos_radius: '5km',
                secure_proxy_only: false,
                location_precision: 'exact',
                emergency_sms_number: "",
                reward_amount: 0,
                reward_currency: "TL",
                critical_health_note: "",
                finder_message: "Lütfen yardıma ihtiyacım var!",
                quiet_hours: { enabled: false, from: "23:00", to: "08:00" },
                emergency_bypass: true
            }
        };
        setPets(prev => [...prev, newPet]);
        setActivePetId(newPet.id);
    }, []);

    const updatePet = React.useCallback((id: string, updates: Partial<Pet>) => {
        setPets(prev => prev.map(pet => pet.id === id ? { ...pet, ...updates } : pet));
    }, []);

    const deletePet = React.useCallback((id: string) => {
        setPets(prev => {
            const newPets = prev.filter(p => p.id !== id);
            if (activePetId === id && newPets.length > 0) {
                setActivePetId(newPets[0].id);
            } else if (newPets.length === 0) {
                setActivePetId(null);
            }
            return newPets;
        });
    }, [activePetId]);

    const switchPet = React.useCallback((id: string) => {
        setActivePetId(String(id));
    }, []);

    const activePet = pets.find(p => String(p.id) === String(activePetId)) || null;

    const [customRecords, setCustomRecordsInternal] = useState<Record<string, any[]>>({});
    const [recordDocuments, setRecordDocumentsInternal] = useState<Record<string, Record<string, string[]>>>({});
    const [orders, setOrdersInternal] = useState<Record<string, any[]>>({});
    const [appointments, setAppointmentsInternal] = useState<Record<string, any[]>>({});
    const [walkRoutes, setWalkRoutesInternal] = useState<Record<string, any[]>>({});

    const setCustomRecords = React.useCallback((petId: string, records: any[]) => {
        setCustomRecordsInternal(prev => ({ ...prev, [petId]: records }));
    }, []);

    const setRecordDocuments = React.useCallback((petId: string, recordId: string, documents: string[]) => {
        setRecordDocumentsInternal(prev => ({
            ...prev,
            [petId]: {
                ...(prev[petId] || {}),
                [recordId]: documents
            }
        }));
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

    // LOAD RECORDS & NEW FEATURES FROM SERVICE
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
    }, []);

    // PERSIST EVERYTHING TO SERVICE
    useEffect(() => {
        if (!isLoading) {
            apiService.saveData('custom_records', customRecords);
            apiService.saveData('record_docs', recordDocuments);
            apiService.saveData('orders', orders);
            apiService.saveData('appointments', appointments);
            apiService.saveData('walk_routes', walkRoutes);
        }
    }, [customRecords, recordDocuments, orders, appointments, walkRoutes, isLoading]);

    const petValue = React.useMemo(() => ({ 
        pets, activePet, isLoading, addPet, updatePet, deletePet, switchPet,
        customRecords, setCustomRecords, recordDocuments, setRecordDocuments,
        orders, setOrders, appointments, setAppointments, walkRoutes, setWalkRoutes
    }), [
        pets, activePet, isLoading, addPet, updatePet, deletePet, switchPet,
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
