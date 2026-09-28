// Sağlık Kaydı tipleri. Tek kaynak: src/services/healthService.ts (bkz. CLAUDE.md 8.43+ ve
// design-reference/health-final). Tarih alanları 'YYYY-MM-DD' (Türkiye takvim günü).

export type HealthSpecies = 'dog' | 'cat' | 'other';
export type RecordSource = 'owner' | 'clinic';

export interface VaccineDefinition {
    id: string;
    species: 'dog' | 'cat';
    name: string;
    description: string | null;
    isCore: boolean;
    frequencyMonths: number;
    minAgeWeeks: number;
    sort: number;
}

export interface VaccineRecord {
    id: string;
    petId: string;
    definitionId: string | null;
    name: string;
    status: 'pending' | 'completed';
    dateAdministered: string | null;
    nextDueDate: string | null;
    vetName: string | null;
    source: RecordSource;
    batchNo: string | null;
    notes: string | null;
    createdAt: string;
}

export type ParasiteKind = 'internal' | 'external' | 'combined';

export interface ParasiteTreatment {
    id: string;
    petId: string;
    kind: ParasiteKind;
    product: string | null;
    appliedOn: string | null;
    nextDueOn: string | null;
    status: 'planned' | 'done';
    notes: string | null;
    source: RecordSource;
    createdAt: string;
}

export interface WeightLog {
    id: string;
    petId: string;
    weightKg: number;
    measuredOn: string;
    source: RecordSource;
    medicalRecordId: string | null;
}

export interface Medication {
    id: string;
    petId: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    instructions: string | null;
    startDate: string | null;
    endDate: string | null;
    doseTimes: string[];
    isActive: boolean;
    prescribedBy: string | null;
    source: RecordSource;
    medicalRecordId: string | null;
}

export interface MedicationDose {
    id: string;
    medicationId: string;
    doseDate: string;
    slot: string;
    givenAt: string;
}

export interface MedicalRecord {
    id: string;
    petId: string;
    /** 'clinic' = Moffi'deki işletmenin muayene kaydı; 'owner' = sahibin eklediği dış ziyaret. */
    source: 'clinic' | 'owner';
    appointmentId: string | null;
    clinicId: string | null;
    clinicName: string | null;
    clinicAvatar: string | null;
    clinicAddress: string | null;
    vetName: string | null;
    diagnosis: string;
    criticalNotes: string | null;
    weightKg: number | null;
    temperatureC: number | null;
    cost: number | null;
    medications: { name: string; dose?: string; duration?: string }[];
    vaccines: { name: string; date?: string; next_date?: string | null; batch?: string | null }[];
    date: string;
    createdAt: string;
}

export type DocumentCategory = 'vaccine_card' | 'lab' | 'imaging' | 'prescription' | 'invoice' | 'report' | 'other';

export interface PetDocument {
    id: string;
    petId: string;
    category: DocumentCategory;
    title: string;
    storagePath: string;
    mimeType: string | null;
    sizeBytes: number | null;
    docDate: string;
    medicalRecordId: string | null;
    createdAt: string;
}

export interface HealthProfile {
    petId: string;
    allergies: string[];
    chronicConditions: string[];
    bloodType: string | null;
    primaryClinicId: string | null;
    primaryVetName: string | null;
    primaryVetPhone: string | null;
    showOnLost: boolean;
    showOnQr: boolean;
}

export interface HealthBundle {
    definitions: VaccineDefinition[];
    vaccines: VaccineRecord[];
    parasites: ParasiteTreatment[];
    weights: WeightLog[];
    medications: Medication[];
    doses: MedicationDose[];
    records: MedicalRecord[];
    documents: PetDocument[];
    profile: HealthProfile | null;
}

export interface ConsultationInput {
    appointmentId: string;
    diagnosis: string;
    criticalNotes?: string;
    weightKg?: number | null;
    temperatureC?: number | null;
    vaccines: { definitionId?: string | null; name?: string; date?: string; nextDate?: string; batch?: string }[];
    medications: { name: string; dose?: string; duration?: string }[];
}
