'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';

export interface MedicalRecordItem {
    id: string;
    diagnosis: string;
    critical_notes: string | null;
    vet_name: string;
    medications: any[];
    created_at: string;
    appointment_id: string | null;
}

export function useMedicalHistory(petId: string | undefined) {
    const [records, setRecords] = useState<MedicalRecordItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        if (!petId) {
            setIsLoading(false);
            setRecords([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await apiService.getPetMedicalRecords(petId);
            setRecords(data);
        } catch (e) {
            console.error('Failed to load medical history', e);
        } finally {
            setIsLoading(false);
        }
    }, [petId]);

    useEffect(() => {
        load();
    }, [load]);

    return { records, isLoading, refresh: load };
}
