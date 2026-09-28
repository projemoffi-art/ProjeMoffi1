// Sağlık Kaydı'nın tek okuma/yazma yolu (Sağlık Mimarisi Raporu, design-reference/health-final).
// Sağlıkla ilgili hiçbir ekran bu dosyayı atlayıp tablolara doğrudan gitmemeli.

import { supabase } from '@/lib/supabase';
import type {
    ConsultationInput, DocumentCategory, HealthBundle, HealthProfile, HealthSpecies, MedicalRecord,
    Medication, MedicationDose, ParasiteKind, ParasiteTreatment, PetDocument, VaccineDefinition,
    VaccineRecord, WeightLog,
} from '@/types/health';

const DOCS_BUCKET = 'medical-documents';
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** timestamptz → Türkiye takvim günü (YYYY-MM-DD). */
export function toDateKey(value: string | null | undefined): string | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

/** Takvim günü → timestamptz (gün, İstanbul'da da aynı gün kalır). */
const dayToTs = (dateKey: string | null | undefined) => (dateKey ? `${dateKey}T00:00:00Z` : null);

function fail(error: any, fallback: string): never {
    throw new Error(error?.message || fallback);
}

const mapDefinition = (r: any): VaccineDefinition => ({
    id: r.id, species: r.species, name: r.name, description: r.description, isCore: r.is_core,
    frequencyMonths: r.frequency_months, minAgeWeeks: r.min_age_weeks, sort: r.sort,
});

const mapVaccine = (r: any): VaccineRecord => ({
    id: r.id, petId: r.pet_id, definitionId: r.definition_id, name: r.name,
    status: r.status === 'completed' ? 'completed' : 'pending',
    dateAdministered: toDateKey(r.date_administered), nextDueDate: toDateKey(r.next_due_date),
    vetName: r.vet_name, source: r.source, batchNo: r.batch_no, notes: r.notes, createdAt: r.created_at,
});

const mapParasite = (r: any): ParasiteTreatment => ({
    id: r.id, petId: r.pet_id, kind: r.kind, product: r.product, appliedOn: r.applied_on,
    nextDueOn: r.next_due_on, status: r.status, notes: r.notes, source: r.source, createdAt: r.created_at,
});

const mapWeight = (r: any): WeightLog => ({
    id: r.id, petId: r.pet_id, weightKg: Number(r.weight_kg), measuredOn: r.measured_on,
    source: r.source, medicalRecordId: r.medical_record_id,
});

const mapMedication = (r: any): Medication => ({
    id: r.id, petId: r.pet_id, name: r.name, dosage: r.dosage, frequency: r.frequency,
    instructions: r.instructions, startDate: toDateKey(r.start_date), endDate: r.end_date,
    doseTimes: r.dose_times || [], isActive: r.is_active !== false, prescribedBy: r.prescribed_by,
    source: r.source, medicalRecordId: r.medical_record_id,
});

const mapDose = (r: any): MedicationDose => ({
    id: r.id, medicationId: r.medication_id, doseDate: r.dose_date, slot: r.slot, givenAt: r.given_at,
});

const mapDocument = (r: any): PetDocument => ({
    id: r.id, petId: r.pet_id, category: r.category, title: r.title, storagePath: r.storage_path,
    mimeType: r.mime_type, sizeBytes: r.size_bytes, docDate: r.doc_date,
    medicalRecordId: r.medical_record_id, createdAt: r.created_at,
});

const mapProfile = (r: any): HealthProfile => ({
    petId: r.pet_id, allergies: r.allergies || [], chronicConditions: r.chronic_conditions || [],
    bloodType: r.blood_type, primaryClinicId: r.primary_clinic_id, primaryVetName: r.primary_vet_name,
    primaryVetPhone: r.primary_vet_phone, showOnLost: !!r.show_on_lost, showOnQr: !!r.show_on_qr,
});

async function mapRecords(rows: any[]): Promise<MedicalRecord[]> {
    const clinicIds = Array.from(new Set(rows.map(r => r.clinic_id).filter((id: string) => /^[0-9a-f-]{36}$/i.test(id || ''))));
    const clinics: Record<string, any> = {};
    if (clinicIds.length > 0) {
        const { data } = await supabase.from('profiles')
            .select('id, business_name, full_name, avatar_url, address, district, province')
            .in('id', clinicIds);
        (data || []).forEach((c: any) => { clinics[c.id] = c; });
    }
    return rows.map(r => {
        const c = clinics[r.clinic_id];
        return {
            id: r.id, petId: r.pet_id, source: r.source === 'owner' ? 'owner' : 'clinic',
            appointmentId: r.appointment_id, clinicId: r.clinic_id,
            clinicName: c?.business_name || c?.full_name || r.external_clinic_name || null,
            clinicAvatar: c?.avatar_url || null,
            clinicAddress: c ? [c.district, c.province].filter(Boolean).join(', ') || c.address || null : null,
            vetName: r.vet_name, diagnosis: r.diagnosis, criticalNotes: r.critical_notes,
            weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
            temperatureC: r.temperature_c != null ? Number(r.temperature_c) : null,
            cost: r.cost != null ? Number(r.cost) : null,
            medications: Array.isArray(r.medications) ? r.medications : [],
            vaccines: Array.isArray(r.vaccines) ? r.vaccines : [],
            date: r.visit_date || toDateKey(r.created_at) || '', createdAt: r.created_at,
        };
    });
}

export const healthService = {
    async getVaccineDefinitions(species?: HealthSpecies): Promise<VaccineDefinition[]> {
        let q = supabase.from('vaccine_definitions').select('*').order('sort');
        if (species === 'dog' || species === 'cat') q = q.eq('species', species);
        else if (species === 'other') return [];
        const { data, error } = await q;
        if (error) fail(error, 'Aşı tanımları yüklenemedi.');
        return (data || []).map(mapDefinition);
    },

    /** Karnenin tamamı tek seferde (her sorgu RLS ile sahibine sınırlı). */
    async getBundle(petId: string, species: HealthSpecies): Promise<HealthBundle> {
        const since = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
        const [defs, vac, par, wei, med, dos, rec, doc, prof] = await Promise.all([
            this.getVaccineDefinitions(species),
            supabase.from('vaccines').select('*').eq('pet_id', petId),
            supabase.from('parasite_treatments').select('*').eq('pet_id', petId),
            supabase.from('pet_weight_logs').select('*').eq('pet_id', petId).order('measured_on').order('created_at'),
            supabase.from('medications').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
            supabase.from('medication_doses').select('*').eq('pet_id', petId).gte('dose_date', since),
            supabase.from('medical_records').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
            supabase.from('pet_documents').select('*').eq('pet_id', petId).order('doc_date', { ascending: false }),
            supabase.from('pet_health_profile').select('*').eq('pet_id', petId).maybeSingle(),
        ]);
        for (const r of [vac, par, wei, med, dos, rec, doc, prof]) {
            if (r.error) fail(r.error, 'Sağlık kaydı yüklenemedi.');
        }
        return {
            definitions: defs,
            vaccines: (vac.data || []).map(mapVaccine),
            parasites: (par.data || []).map(mapParasite),
            weights: (wei.data || []).map(mapWeight),
            medications: (med.data || []).map(mapMedication),
            doses: (dos.data || []).map(mapDose),
            records: await mapRecords(rec.data || []),
            documents: (doc.data || []).map(mapDocument),
            profile: prof.data ? mapProfile(prof.data) : null,
        };
    },

    // --- Aşılar ---------------------------------------------------------
    async getVaccines(petId: string): Promise<VaccineRecord[]> {
        const { data, error } = await supabase.from('vaccines').select('*').eq('pet_id', petId)
            .order('date_administered', { ascending: false, nullsFirst: false });
        if (error) fail(error, 'Aşılar yüklenemedi.');
        return (data || []).map(mapVaccine);
    },

    async addVaccine(input: {
        petId: string; definitionId?: string | null; name: string; status: 'pending' | 'completed';
        dateAdministered?: string | null; nextDueDate?: string | null; vetName?: string | null;
        batchNo?: string | null; notes?: string | null;
    }) {
        const { error } = await supabase.from('vaccines').insert({
            pet_id: input.petId, definition_id: input.definitionId || null, name: input.name.trim(),
            status: input.status, date_administered: dayToTs(input.dateAdministered),
            next_due_date: dayToTs(input.nextDueDate), vet_name: input.vetName?.trim() || null,
            batch_no: input.batchNo?.trim() || null, notes: input.notes?.trim() || null, source: 'owner',
        });
        if (error) fail(error, 'Aşı kaydedilemedi.');
    },

    async updateVaccine(id: string, patch: {
        status?: 'pending' | 'completed'; dateAdministered?: string | null; nextDueDate?: string | null;
        vetName?: string | null; batchNo?: string | null; notes?: string | null;
    }) {
        const row: Record<string, any> = {};
        if (patch.status) row.status = patch.status;
        if (patch.dateAdministered !== undefined) row.date_administered = dayToTs(patch.dateAdministered);
        if (patch.nextDueDate !== undefined) row.next_due_date = dayToTs(patch.nextDueDate);
        if (patch.vetName !== undefined) row.vet_name = patch.vetName?.trim() || null;
        if (patch.batchNo !== undefined) row.batch_no = patch.batchNo?.trim() || null;
        if (patch.notes !== undefined) row.notes = patch.notes?.trim() || null;
        const { error } = await supabase.from('vaccines').update(row).eq('id', id);
        if (error) fail(error, 'Aşı güncellenemedi.');
    },

    async deleteVaccine(id: string) {
        const { error } = await supabase.from('vaccines').delete().eq('id', id);
        if (error) fail(error, 'Aşı silinemedi.');
    },

    // --- Parazit --------------------------------------------------------
    async addParasite(input: {
        petId: string; kind: ParasiteKind; status: 'planned' | 'done'; product?: string | null;
        appliedOn?: string | null; nextDueOn?: string | null; notes?: string | null;
    }) {
        const { error } = await supabase.from('parasite_treatments').insert({
            pet_id: input.petId, kind: input.kind, status: input.status, product: input.product?.trim() || null,
            applied_on: input.status === 'done' ? input.appliedOn : null, next_due_on: input.nextDueOn || null,
            notes: input.notes?.trim() || null, source: 'owner',
        });
        if (error) fail(error, 'Parazit uygulaması kaydedilemedi.');
    },

    async completeParasite(id: string, appliedOn: string, nextDueOn: string | null, product?: string | null) {
        const row: Record<string, any> = { status: 'done', applied_on: appliedOn, next_due_on: nextDueOn };
        if (product !== undefined) row.product = product?.trim() || null;
        const { error } = await supabase.from('parasite_treatments').update(row).eq('id', id);
        if (error) fail(error, 'Parazit uygulaması güncellenemedi.');
    },

    async deleteParasite(id: string) {
        const { error } = await supabase.from('parasite_treatments').delete().eq('id', id);
        if (error) fail(error, 'Kayıt silinemedi.');
    },

    // --- Kilo -----------------------------------------------------------
    async addWeight(petId: string, weightKg: number, measuredOn: string) {
        const { error } = await supabase.from('pet_weight_logs').insert({
            pet_id: petId, weight_kg: weightKg, measured_on: measuredOn, source: 'owner',
        });
        if (error) fail(error, 'Kilo kaydedilemedi.');
    },

    async deleteWeight(id: string) {
        const { error } = await supabase.from('pet_weight_logs').delete().eq('id', id);
        if (error) fail(error, 'Ölçüm silinemedi.');
    },

    // --- İlaçlar --------------------------------------------------------
    async addMedication(input: {
        petId: string; name: string; dosage?: string | null; frequency?: string | null;
        instructions?: string | null; startDate: string; endDate?: string | null; doseTimes: string[];
    }) {
        const { error } = await supabase.from('medications').insert({
            pet_id: input.petId, name: input.name.trim(), dosage: input.dosage?.trim() || null,
            frequency: input.frequency?.trim() || null, instructions: input.instructions?.trim() || null,
            start_date: dayToTs(input.startDate), end_date: input.endDate || null,
            dose_times: input.doseTimes, is_active: true, source: 'owner',
        });
        if (error) fail(error, 'İlaç kaydedilemedi.');
    },

    async updateMedication(id: string, patch: { doseTimes?: string[]; endDate?: string | null; isActive?: boolean }) {
        const row: Record<string, any> = {};
        if (patch.doseTimes) row.dose_times = patch.doseTimes;
        if (patch.endDate !== undefined) row.end_date = patch.endDate;
        if (patch.isActive !== undefined) row.is_active = patch.isActive;
        const { error } = await supabase.from('medications').update(row).eq('id', id);
        if (error) fail(error, 'İlaç güncellenemedi.');
    },

    async deleteMedication(id: string) {
        const { error } = await supabase.from('medications').delete().eq('id', id);
        if (error) fail(error, 'İlaç silinemedi.');
    },

    async logDose(medicationId: string, petId: string, doseDate: string, slot: string) {
        const { error } = await supabase.from('medication_doses')
            .upsert({ medication_id: medicationId, pet_id: petId, dose_date: doseDate, slot },
                { onConflict: 'medication_id,dose_date,slot', ignoreDuplicates: true });
        if (error) fail(error, 'Doz kaydedilemedi.');
    },

    async unlogDose(medicationId: string, doseDate: string, slot: string) {
        const { error } = await supabase.from('medication_doses').delete()
            .eq('medication_id', medicationId).eq('dose_date', doseDate).eq('slot', slot);
        if (error) fail(error, 'Doz geri alınamadı.');
    },

    // --- Sahibin eklediği dış veteriner ziyareti ------------------------
    async addVisitRecord(input: {
        petId: string; visitDate: string; clinicName: string; vetName?: string | null; diagnosis: string;
        notes?: string | null; weightKg?: number | null; temperatureC?: number | null; cost?: number | null;
    }) {
        const { data, error } = await supabase.from('medical_records').insert({
            pet_id: input.petId, source: 'owner', clinic_id: null, visit_date: input.visitDate,
            external_clinic_name: input.clinicName.trim() || null, vet_name: input.vetName?.trim() || null,
            diagnosis: input.diagnosis.trim(), critical_notes: input.notes?.trim() || null,
            weight_kg: input.weightKg ?? null, temperature_c: input.temperatureC ?? null, cost: input.cost ?? null,
        }).select('id').single();
        if (error) fail(error, 'Ziyaret kaydedilemedi.');
        if (input.weightKg) {
            await supabase.from('pet_weight_logs').insert({
                pet_id: input.petId, weight_kg: input.weightKg, measured_on: input.visitDate,
                source: 'owner', medical_record_id: data.id,
            });
        }
    },

    async deleteVisitRecord(id: string) {
        const { error } = await supabase.from('medical_records').delete().eq('id', id).eq('source', 'owner');
        if (error) fail(error, 'Ziyaret silinemedi.');
    },

    // --- Belgeler -------------------------------------------------------
    async uploadDocument(petId: string, file: File, meta: { category: DocumentCategory; title: string; docDate: string; medicalRecordId?: string | null }) {
        if (file.size > MAX_DOCUMENT_BYTES) throw new Error('Dosya 10 MB\'tan büyük olamaz.');
        const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
        const path = `${petId}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type || undefined });
        if (up.error) fail(up.error, 'Dosya yüklenemedi.');
        const { error } = await supabase.from('pet_documents').insert({
            pet_id: petId, category: meta.category, title: meta.title.trim() || file.name,
            storage_path: path, mime_type: file.type || null, size_bytes: file.size, doc_date: meta.docDate,
            medical_record_id: meta.medicalRecordId || null,
        });
        if (error) {
            await supabase.storage.from(DOCS_BUCKET).remove([path]);
            fail(error, 'Belge kaydedilemedi.');
        }
    },

    async getDocumentUrl(storagePath: string): Promise<string> {
        const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(storagePath, 60 * 10);
        if (error || !data?.signedUrl) fail(error, 'Belge açılamadı.');
        return data.signedUrl;
    },

    async deleteDocument(doc: PetDocument) {
        const { error } = await supabase.from('pet_documents').delete().eq('id', doc.id);
        if (error) fail(error, 'Belge silinemedi.');
        await supabase.storage.from(DOCS_BUCKET).remove([doc.storagePath]);
    },

    // --- Acil bilgiler --------------------------------------------------
    async saveProfile(petId: string, patch: Partial<Omit<HealthProfile, 'petId'>>) {
        const row: Record<string, any> = { pet_id: petId, updated_at: new Date().toISOString() };
        if (patch.allergies) row.allergies = patch.allergies;
        if (patch.chronicConditions) row.chronic_conditions = patch.chronicConditions;
        if (patch.bloodType !== undefined) row.blood_type = patch.bloodType?.trim() || null;
        if (patch.primaryClinicId !== undefined) row.primary_clinic_id = patch.primaryClinicId;
        if (patch.primaryVetName !== undefined) row.primary_vet_name = patch.primaryVetName?.trim() || null;
        if (patch.primaryVetPhone !== undefined) row.primary_vet_phone = patch.primaryVetPhone?.trim() || null;
        if (patch.showOnLost !== undefined) row.show_on_lost = patch.showOnLost;
        if (patch.showOnQr !== undefined) row.show_on_qr = patch.showOnQr;
        const { error } = await supabase.from('pet_health_profile').upsert(row, { onConflict: 'pet_id' });
        if (error) fail(error, 'Acil bilgiler kaydedilemedi.');
    },

    // --- İşletme: muayene kaydı (tek atomik sunucu fonksiyonu) ------------
    async getRecordByAppointment(appointmentId: string): Promise<MedicalRecord | null> {
        const { data, error } = await supabase.from('medical_records').select('*')
            .eq('appointment_id', appointmentId).maybeSingle();
        if (error) fail(error, 'Muayene kaydı yüklenemedi.');
        return data ? (await mapRecords([data]))[0] : null;
    },

    async recordConsultation(input: ConsultationInput): Promise<string> {
        const { data, error } = await supabase.rpc('record_consultation', {
            p_appointment_id: input.appointmentId,
            p_diagnosis: input.diagnosis,
            p_critical_notes: input.criticalNotes || null,
            p_weight_kg: input.weightKg ?? null,
            p_temperature_c: input.temperatureC ?? null,
            p_vaccines: input.vaccines.map(v => ({
                definition_id: v.definitionId || null, name: v.name || null, date: v.date || null,
                next_date: v.nextDate || null, batch: v.batch || null,
            })),
            p_medications: input.medications,
        });
        if (error) fail(error, 'Muayene kaydedilemedi.');
        return data as string;
    },
};
