import { useState, useEffect } from "react";
import { IVaccineService } from "@/services/interfaces";
import { VaccineMockService } from "@/services/mock/VaccineMockService";
import { VaccineRuleset, UserVaccineRecord, VaccineDefinition } from "@/types/domain";

const vaccineService: IVaccineService = new VaccineMockService();

// MERGED VIEW MODEL FOR UI
export interface RichVaccineRecord extends UserVaccineRecord {
    definition: VaccineDefinition;
}

export function useVaccineSchedule(petId: string = 'pet-1', countryCode: string = 'TR') {
    const [schedule, setSchedule] = useState<RichVaccineRecord[]>([]);
    const [ruleset, setRuleset] = useState<VaccineRuleset | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [petId, countryCode]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rules, records] = await Promise.all([
                vaccineService.getRuleset(countryCode),
                vaccineService.getUserSchedule(petId, countryCode)
            ]);

            setRuleset(rules);

            // Merge Logic: Connect Record to Definition
            const richData: RichVaccineRecord[] = records.map((rec: UserVaccineRecord) => {
                const def = rules.definitions.find((d: VaccineDefinition) => d.id === rec.vaccineId);
                if (!def) throw new Error(`Definition not found for ${rec.vaccineId}`);
                return { ...rec, definition: def };
            });

            // Client-side Sort: Due Date Ascending
            richData.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            setSchedule(richData);

        } catch (e) {
            console.error("Failed to load vaccine schedule", e);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsDone = async (id: string, date: string, vet: string) => {
        await vaccineService.markAsDone(id, date, vet);
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
