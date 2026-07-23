import { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { VaccineRuleset, UserVaccineRecord, VaccineDefinition } from "@/types/domain";

// MERGED VIEW MODEL FOR UI
export interface RichVaccineRecord extends UserVaccineRecord {
    definition: VaccineDefinition;
}

export function useVaccineSchedule(petId: string, countryCode: string = 'TR') {
    const [schedule, setSchedule] = useState<RichVaccineRecord[]>([]);
    const [ruleset, setRuleset] = useState<VaccineRuleset | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [petId, countryCode]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // MOCK DATA INJECTION FOR UI DEMONSTRATION
            const definitions = [
                { id: 'v1', name: 'Karma Aşı (DHPPi)', description: 'Köpekler için hayati öneme sahip temel aşı.', is_core: true, frequency_months: 12, min_age_weeks: 6 },
                { id: 'v2', name: 'Kuduz Aşısı (Rabies)', description: 'Yasal olarak zorunlu kuduz aşısı.', is_core: true, frequency_months: 12, min_age_weeks: 12 },
                { id: 'v3', name: 'Lyme Aşısı', description: 'Kenelerden bulaşan Lyme hastalığına karşı koruma.', is_core: false, frequency_months: 12, min_age_weeks: 10 },
                { id: 'v4', name: 'Bordetella (Barınak Öksürüğü)', description: 'Sosyal köpekler için önerilir.', is_core: false, frequency_months: 6, min_age_weeks: 8 },
            ];

            const today = new Date();
            const pastDate1 = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
            const pastDate2 = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
            
            const futureDate1 = new Date(today.getTime() + (1000 * 3600 * 24 * 5)).toISOString().split('T')[0]; // 5 days left
            const pastDue = new Date(today.getTime() - (1000 * 3600 * 24 * 3)).toISOString().split('T')[0]; // 3 days overdue

            const records = [
                // History (Passport)
                { id: 'r1', petId, vaccineId: 'v1', status: 'completed', dueDate: pastDate2, dateAdministered: pastDate2, vetName: 'VetCare Clinic - Dr. Ayşe Yılmaz' },
                { id: 'r2', petId, vaccineId: 'v2', status: 'completed', dueDate: pastDate1, dateAdministered: pastDate1, vetName: 'PetLife Center' },
                { id: 'r3', petId, vaccineId: 'v4', status: 'completed', dueDate: pastDate1, dateAdministered: pastDate1, vetName: 'Moffi Doğrulanmış Hekim' },
                
                // Upcoming
                { id: 'r4', petId, vaccineId: 'v1', status: 'pending', dueDate: futureDate1 },
                { id: 'r5', petId, vaccineId: 'v3', status: 'pending', dueDate: pastDue }, // Overdue
            ];

            // Create a virtual ruleset based on definitions
            const rules: VaccineRuleset = {
                countryCode,
                version: '1.0',
                source: 'Supabase DB',
                lastUpdated: new Date().toISOString(),
                definitions: definitions.map(d => ({
                    id: d.id,
                    name: d.name,
                    description: d.description,
                    isCore: d.is_core,
                    frequency: d.frequency_months + ' Ay',
                    minAgeWeeks: d.min_age_weeks
                }))
            };

            setRuleset(rules);

            // Merge Logic: Connect Record to Definition
            const richData: RichVaccineRecord[] = records.map((rec: UserVaccineRecord) => {
                const def = rules.definitions.find((d: VaccineDefinition) => d.id === rec.vaccineId);
                if (!def) {
                    console.warn(`Definition not found for ${rec.vaccineId}. Using placeholder.`);
                    // Provide a safe fallback instead of throwing
                    return { 
                        ...rec, 
                        definition: { 
                            id: rec.vaccineId, 
                            name: `Bilinmeyen Aşı (${rec.vaccineId})`, 
                            frequency: 'unknown' 
                        } 
                    } as RichVaccineRecord;
                }
                return { ...rec, definition: def };
            });

            // Client-side Sort: Due Date Ascending
            richData.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            setSchedule(richData);

            // Automate: Check and notify about upcoming/overdue vaccines
            apiService.checkHealthNotifications(petId).catch(err => {
                console.error("Automated health check failed:", err);
            });

        } catch (e) {
            console.error("Failed to load vaccine schedule", e);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsDone = async (id: string, date: string, vet: string) => {
        await apiService.markVaccineAsCompleted(id, date, vet);
        await loadData(); // Refresh
    };

    return {
        schedule,
        ruleset,
        isLoading,
        markAsDone,
        refresh: loadData
    };
}
