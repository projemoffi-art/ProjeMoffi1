// Sahiplendirme ilanlarının, başvurularının ve pasaport devrinin tek okuma/yazma yolu
// (design-reference/community-final/sahiplendirme-reference.jpg). Herkese açık okuma adoption_cards'tan
// (yaklaşık konum; telefon sadece izin verildiyse). Durum, başvuru akışı ve devir sunucu fonksiyonlarında.

import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';
import { PETS_CHANGED_EVENT } from '@/services/lostService';
import type { Species } from '@/services/lostService';

export type AdoptionStatus = 'active' | 'paused' | 'adopted' | 'closed' | 'removed';
export type AgeGroup = 'baby' | 'young' | 'adult' | 'senior';
export type ApplicationStatus = 'pending' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
export type HomeType = 'apartment' | 'house' | 'garden' | 'other';

export interface AdoptionListing {
    id: string;
    userId: string;
    petId: string | null;
    petName: string;
    species: Species;
    breed: string | null;
    ageText: string | null;
    ageGroup: AgeGroup | null;
    gender: string | null;
    photos: string[];
    description: string | null;
    healthNote: string | null;
    locationText: string | null;
    vaccinated: boolean;
    neutered: boolean;
    microchipped: boolean;
    healthUnknown: boolean;
    goodWithKids: boolean;
    goodWithCats: boolean;
    goodWithDogs: boolean;
    goodWithOthers: boolean;
    contactMode: 'in_app' | 'phone';
    contactPhone: string | null;
    isShelter: boolean;
    status: AdoptionStatus;
    notifiedCount: number;
    viewCount: number;
    shareCount: number;
    adoptedAt: string | null;
    createdAt: string;
    lat: number | null;
    lng: number | null;
    isMine: boolean;
    isFavorite: boolean;
    openApplications: number | null;
    myApplicationId: string | null;
    myApplicationStatus: ApplicationStatus | null;
    owner?: { name: string; avatar: string | null; isBusiness: boolean };
}

export interface AdoptionInput {
    petId?: string | null;
    petName: string;
    species: Species;
    breed?: string | null;
    ageText?: string | null;
    ageGroup: AgeGroup | null;
    gender?: string | null;
    photos: string[];
    description?: string | null;
    healthNote?: string | null;
    locationText: string | null;
    lat: number | null;
    lng: number | null;
    vaccinated: boolean;
    neutered: boolean;
    microchipped: boolean;
    healthUnknown: boolean;
    goodWithKids: boolean;
    goodWithCats: boolean;
    goodWithDogs: boolean;
    goodWithOthers: boolean;
    contactMode: 'in_app' | 'phone';
    contactPhone?: string | null;
    isShelter: boolean;
}

export interface AdoptionApplication {
    id: string;
    adoptionId: string;
    applicantId: string;
    ownerId: string;
    fullName: string;
    homeType: HomeType;
    homeFeatures: string[];
    household: string[];
    childrenAges: string | null;
    experience: 'none' | 'past' | 'current' | null;
    experienceNote: string | null;
    reference: string | null;
    message: string;
    status: ApplicationStatus;
    interviewAt: string | null;
    interviewNote: string | null;
    ownerNote: string | null;
    createdAt: string;
    listing?: Pick<AdoptionListing, 'id' | 'petName' | 'species' | 'breed' | 'ageText' | 'gender' | 'photos' | 'status'>;
    applicant?: { name: string; avatar: string | null };
    transfer?: PetTransfer | null;
}

export interface PetTransfer {
    id: string;
    petId: string;
    fromOwnerId: string;
    toOwnerId: string;
    adoptionId: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
    expiresAt: string;
}

export interface ApplicationInput {
    fullName: string;
    homeType: HomeType;
    homeFeatures: string[];
    household: string[];
    childrenAges?: string;
    experience: 'none' | 'past' | 'current' | null;
    experienceNote?: string;
    reference?: string;
    message: string;
}

function fail(error: any, fallback: string): never {
    throw new Error(error?.message || fallback);
}

const mapListing = (r: any): AdoptionListing => ({
    id: r.id, userId: r.user_id, petId: r.pet_id, petName: r.pet_name || 'İsimsiz dost',
    species: r.pet_type === 'cat' ? 'cat' : r.pet_type === 'dog' ? 'dog' : 'other',
    breed: r.pet_breed, ageText: r.pet_age, ageGroup: r.age_group, gender: r.gender,
    photos: (Array.isArray(r.images) && r.images.length ? r.images : [r.img_url]).filter(Boolean),
    description: r.description, healthNote: r.health_note, locationText: r.location_text,
    vaccinated: !!r.vaccinated, neutered: !!r.neutered, microchipped: !!r.microchipped, healthUnknown: !!r.health_unknown,
    goodWithKids: !!r.good_with_kids, goodWithCats: !!r.good_with_cats, goodWithDogs: !!r.good_with_dogs, goodWithOthers: !!r.good_with_others,
    contactMode: r.contact_mode === 'phone' ? 'phone' : 'in_app', contactPhone: r.contact_phone || null,
    isShelter: !!r.is_shelter, status: r.status,
    notifiedCount: r.notified_count || 0, viewCount: r.view_count || 0, shareCount: r.share_count || 0,
    adoptedAt: r.adopted_at, createdAt: r.created_at,
    lat: r.latitude != null ? Number(r.latitude) : null, lng: r.longitude != null ? Number(r.longitude) : null,
    isMine: !!r.is_mine, isFavorite: !!r.is_favorite, openApplications: r.open_applications ?? null,
    myApplicationId: r.my_application_id || null, myApplicationStatus: r.my_application_status || null,
});

const mapApplication = (r: any): AdoptionApplication => ({
    id: r.id, adoptionId: r.adoption_id, applicantId: r.applicant_id, ownerId: r.owner_id, fullName: r.full_name,
    homeType: r.home_type, homeFeatures: r.home_features || [], household: r.household || [],
    childrenAges: r.children_ages, experience: r.experience, experienceNote: r.experience_note, reference: r.reference_note,
    message: r.message, status: r.status, interviewAt: r.interview_at, interviewNote: r.interview_note, ownerNote: r.owner_note,
    createdAt: r.created_at,
});

const mapTransfer = (r: any): PetTransfer => ({
    id: r.id, petId: r.pet_id, fromOwnerId: r.from_owner_id, toOwnerId: r.to_owner_id, adoptionId: r.adoption_id,
    status: r.status, expiresAt: r.expires_at,
});

async function profileCards(ids: string[]) {
    const byId: Record<string, any> = {};
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (!unique.length) return byId;
    const { data } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url, role, business_name').in('id', unique);
    (data || []).forEach((p: any) => { byId[p.id] = p; });
    return byId;
}

async function attachOwners(list: AdoptionListing[]): Promise<AdoptionListing[]> {
    const cards = await profileCards(list.map(l => l.userId));
    return list.map(l => {
        const p = cards[l.userId];
        if (!p) return l;
        const isBusiness = p.role === 'business';
        return { ...l, owner: { name: (isBusiness && p.business_name) || p.full_name || p.username || 'Moffi üyesi', avatar: p.avatar_url, isBusiness } };
    });
}

/** Başvuruya ilan özeti, başvuranın profil kartı ve (varsa) bekleyen pasaport devri eklenir. */
async function enrichApplications(rows: any[]): Promise<AdoptionApplication[]> {
    const apps = rows.map(mapApplication);
    if (!apps.length) return apps;
    const adoptionIds = Array.from(new Set(apps.map(a => a.adoptionId)));
    const [{ data: listings }, cards, { data: transfers }] = await Promise.all([
        supabase.from('adoption_cards').select('*').in('id', adoptionIds),
        profileCards(apps.map(a => a.applicantId)),
        supabase.from('pet_ownership_transfers').select('*').in('adoption_id', adoptionIds).order('created_at', { ascending: false }),
    ]);
    const byListing: Record<string, AdoptionListing> = {};
    (listings || []).forEach((l: any) => { byListing[l.id] = mapListing(l); });
    return apps.map(a => {
        const l = byListing[a.adoptionId];
        const p = cards[a.applicantId];
        const t = (transfers || []).find((x: any) => x.adoption_id === a.adoptionId && x.to_owner_id === a.applicantId);
        return {
            ...a,
            listing: l ? { id: l.id, petName: l.petName, species: l.species, breed: l.breed, ageText: l.ageText, gender: l.gender, photos: l.photos, status: l.status } : undefined,
            applicant: p ? { name: p.full_name || p.username || a.fullName, avatar: p.avatar_url } : { name: a.fullName, avatar: null },
            transfer: t ? mapTransfer(t) : null,
        };
    });
}

const announcePetsChanged = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(PETS_CHANGED_EVENT));
};

function toRow(input: AdoptionInput) {
    return {
        pet_name: input.petName.trim(), pet_type: input.species, pet_breed: input.breed?.trim() || null,
        pet_age: input.ageText?.trim() || null, age_group: input.ageGroup, gender: input.gender || null,
        img_url: input.photos[0] || null, images: input.photos.slice(0, 8),
        description: input.description?.trim() || null, health_note: input.healthNote?.trim() || null,
        location_text: input.locationText, latitude: input.lat, longitude: input.lng,
        vaccinated: input.vaccinated, neutered: input.neutered, microchipped: input.microchipped, health_unknown: input.healthUnknown,
        good_with_kids: input.goodWithKids, good_with_cats: input.goodWithCats, good_with_dogs: input.goodWithDogs, good_with_others: input.goodWithOthers,
        contact_mode: input.contactMode, phone: input.contactMode === 'phone' ? input.contactPhone?.trim() || null : null,
        is_shelter: input.isShelter,
    };
}

export const adoptionService = {
    /** Yayındaki ilanlar (başvuru alan). */
    async list(): Promise<AdoptionListing[]> {
        const { data, error } = await supabase.from('adoption_cards').select('*').eq('status', 'active')
            .order('created_at', { ascending: false }).limit(300);
        if (error) fail(error, 'İlanlar yüklenemedi.');
        return attachOwners((data || []).map(mapListing));
    },

    async get(id: string): Promise<AdoptionListing | null> {
        const { data, error } = await supabase.from('adoption_cards').select('*').eq('id', id).maybeSingle();
        if (error) fail(error, 'İlan yüklenemedi.');
        if (!data) return null;
        return (await attachOwners([mapListing(data)]))[0];
    },

    async mine(): Promise<AdoptionListing[]> {
        const { data, error } = await supabase.from('adoption_cards').select('*').eq('is_mine', true)
            .order('created_at', { ascending: false });
        if (error) fail(error, 'İlanların yüklenemedi.');
        return (data || []).map(mapListing);
    },

    async uploadPhotos(files: File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const f of files) urls.push(await apiService.uploadMedia(f, 'posts'));
        return urls;
    },

    /**
     * İlanı kaydeder. Hemen yayınlanırsa bildirimi açmış yakındaki kişilere bir kez haber gider; yayınlanmazsa
     * "durduruldu" olarak kalır ve sahibi yayına aldığında (setStatus('active')) haber gider.
     */
    async create(input: AdoptionInput, publishNow = true): Promise<{ id: string; notified: number }> {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('İlan vermek için giriş yapmalısın.');
        const { data, error } = await supabase.from('adoption_pets')
            .insert({ ...toRow(input), user_id: auth.user.id, pet_id: input.petId || null })
            .select('id').single();
        if (error || !data) fail(error, 'İlan kaydedilemedi.');
        if (!publishNow) {
            await adoptionService.setStatus(data.id, 'paused');
            return { id: data.id, notified: 0 };
        }
        const { data: notified, error: pubErr } = await supabase.rpc('publish_adoption_listing', { p_id: data.id });
        if (pubErr) fail(pubErr, 'İlan yayınlanamadı.');
        return { id: data.id, notified: Number(notified) || 0 };
    },

    async update(id: string, input: AdoptionInput) {
        const { error } = await supabase.from('adoption_pets').update(toRow(input)).eq('id', id);
        if (error) fail(error, 'İlan güncellenemedi.');
    },

    async setStatus(id: string, status: 'active' | 'paused' | 'closed') {
        const { error } = await supabase.rpc('set_adoption_listing_status', { p_id: id, p_status: status });
        if (error) fail(error, 'İlan güncellenemedi.');
        // İlk kez yayına alınıyorsa yakın çevre bildirimi şimdi gider (sunucu bir kereden fazla göndermez).
        if (status === 'active') await supabase.rpc('publish_adoption_listing', { p_id: id });
    },

    /** Sahiplendirildi olarak kapatır; pasaport devri teklif edildiyse devrin kimliğini döndürür. */
    async complete(id: string, applicationId: string | null, transferPassport: boolean): Promise<string | null> {
        const { data, error } = await supabase.rpc('complete_adoption', {
            p_id: id, p_application_id: applicationId, p_transfer_passport: transferPassport,
        });
        if (error) fail(error, 'İlan kapatılamadı.');
        return (data as string) || null;
    },

    async recordEvent(id: string, event: 'view' | 'share') {
        await supabase.rpc('record_adoption_event', { p_id: id, p_event: event });
    },

    async ownerStats(id: string): Promise<{ views: number; applications: number; interviews: number; shares: number; notified: number; favorites: number } | null> {
        const { data, error } = await supabase.rpc('get_adoption_owner_stats', { p_id: id });
        if (error) return null;
        const r = Array.isArray(data) ? data[0] : data;
        return r ? { views: r.views || 0, applications: r.applications || 0, interviews: r.interviews || 0, shares: r.shares || 0, notified: r.notified || 0, favorites: r.favorites || 0 } : null;
    },

    async setFavorite(id: string, on: boolean) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('Kaydetmek için giriş yapmalısın.');
        const { error } = on
            ? await supabase.from('adoption_favorites').insert({ user_id: auth.user.id, adoption_id: id })
            : await supabase.from('adoption_favorites').delete().eq('user_id', auth.user.id).eq('adoption_id', id);
        if (error && error.code !== '23505') fail(error, 'Kaydedilemedi.');
    },

    // --- Başvurular -----------------------------------------------------------------------------------
    async apply(adoptionId: string, a: ApplicationInput): Promise<string> {
        const { data, error } = await supabase.rpc('submit_adoption_application', {
            p_adoption_id: adoptionId, p_full_name: a.fullName, p_home_type: a.homeType, p_home_features: a.homeFeatures,
            p_household: a.household, p_children_ages: a.childrenAges || null, p_experience: a.experience,
            p_experience_note: a.experienceNote || null, p_reference: a.reference || null, p_message: a.message,
        });
        if (error) fail(error, 'Başvuru gönderilemedi.');
        return data as string;
    },

    async sentApplications(): Promise<AdoptionApplication[]> {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return [];
        const { data, error } = await supabase.from('adoption_applications').select('*')
            .eq('applicant_id', auth.user.id).order('created_at', { ascending: false });
        if (error) fail(error, 'Başvurular yüklenemedi.');
        return enrichApplications(data || []);
    },

    async receivedApplications(adoptionId?: string): Promise<AdoptionApplication[]> {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return [];
        let q = supabase.from('adoption_applications').select('*').eq('owner_id', auth.user.id).neq('status', 'withdrawn');
        if (adoptionId) q = q.eq('adoption_id', adoptionId);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) fail(error, 'Başvurular yüklenemedi.');
        return enrichApplications(data || []);
    },

    async application(id: string): Promise<AdoptionApplication | null> {
        const { data, error } = await supabase.from('adoption_applications').select('*').eq('id', id).maybeSingle();
        if (error) fail(error, 'Başvuru yüklenemedi.');
        return data ? (await enrichApplications([data]))[0] : null;
    },

    async respond(applicationId: string, action: 'interview' | 'accept' | 'reject', opts: { interviewAt?: string | null; note?: string } = {}) {
        const { error } = await supabase.rpc('respond_adoption_application', {
            p_application_id: applicationId, p_action: action, p_interview_at: opts.interviewAt || null, p_note: opts.note || null,
        });
        if (error) fail(error, 'İşlem tamamlanamadı.');
    },

    async withdraw(applicationId: string) {
        const { error } = await supabase.rpc('withdraw_adoption_application', { p_application_id: applicationId });
        if (error) fail(error, 'Başvuru geri çekilemedi.');
    },

    // --- Pasaport devri ---------------------------------------------------------------------------------
    async transferForListing(adoptionId: string): Promise<PetTransfer | null> {
        const { data } = await supabase.from('pet_ownership_transfers').select('*').eq('adoption_id', adoptionId)
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data ? mapTransfer(data) : null;
    },

    async respondTransfer(transferId: string, accept: boolean) {
        const { error } = await supabase.rpc('respond_pet_transfer', { p_transfer_id: transferId, p_accept: accept });
        if (error) fail(error, 'İşlem tamamlanamadı.');
        if (accept) announcePetsChanged();
    },
};

export const AGE_GROUPS: { id: AgeGroup; label: string }[] = [
    { id: 'baby', label: 'Yavru (0–1 yaş)' },
    { id: 'young', label: 'Genç (1–3 yaş)' },
    { id: 'adult', label: 'Yetişkin (3–8 yaş)' },
    { id: 'senior', label: 'Yaşlı (8+ yaş)' },
];
export const AGE_GROUP_SHORT: Record<AgeGroup, string> = { baby: 'Yavru', young: 'Genç', adult: 'Yetişkin', senior: 'Yaşlı' };

export const HOME_TYPES: { id: HomeType; label: string }[] = [
    { id: 'apartment', label: 'Daire' },
    { id: 'house', label: 'Müstakil ev' },
    { id: 'garden', label: 'Bahçeli ev' },
    { id: 'other', label: 'Diğer' },
];
export const HOME_FEATURES = ['Balkon var', 'Bahçe var', 'Kiracıyım, ev sahibi izinli', 'Gün içinde evde biri var', 'Evden çalışıyorum'];
export const HOUSEHOLD = [
    { id: 'alone', label: 'Yalnız yaşıyorum' },
    { id: 'family', label: 'Aile' },
    { id: 'children', label: 'Çocuk var' },
    { id: 'other_pets', label: 'Diğer hayvan var' },
];
export const EXPERIENCE = [
    { id: 'none', label: 'Hayır, ilk dostum olacak' },
    { id: 'past', label: 'Evet, daha önce baktım' },
    { id: 'current', label: 'Evet, şu an da bakıyorum' },
] as const;

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: string }> = {
    pending: { label: 'İnceleniyor', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    interview: { label: 'Görüşme', tone: 'bg-accent/10 text-accent' },
    accepted: { label: 'Kabul edildi', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    rejected: { label: 'Olumsuz', tone: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200' },
    withdrawn: { label: 'Geri çekildi', tone: 'bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-stone-300' },
};
