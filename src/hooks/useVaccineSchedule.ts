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
            const [definitions, records] = await Promise.all([
                apiService.getVaccineDefinitions(),
                apiService.getPetVaccines(petId)
            ]);

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
