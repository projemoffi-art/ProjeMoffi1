// Kayıp & Bulunan ilanlarının tek okuma/yazma yolu (design-reference/community-final).
// Herkese açık okuma lost_pet_cards'tan (yaklaşık konum; sahibine tam konum). Yayınlama, bildirim,
// görülme, eşleştirme ve kavuşma sunucu fonksiyonlarında.

import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';

export type ListingKind = 'lost' | 'found';
export type ListingStatus = 'active' | 'resolved' | 'archived';
export type Species = 'dog' | 'cat' | 'other';

export interface LostListing {
    id: string;
    userId: string;
    kind: ListingKind;
    status: ListingStatus;
    petId: string | null;
    petName: string | null;
    species: Species;
    breed: string | null;
    color: string | null;
    gender: string | null;
    ageText: string | null;
    photos: string[];
    features: string[];
    approachNote: string | null;
    situation: string | null;
    chipStatus: string | null;
    description: string | null;
    locationText: string | null;
    eventAt: string;
    rewardEnabled: boolean;
    rewardAmount: number | null;
    contactMode: 'in_app' | 'phone';
    contactPhone: string | null;
    notifyRadiusKm: number;
    notifiedCount: number;
    viewCount: number;
    shareCount: number;
    resolvedAt: string | null;
    resolution: string | null;
    createdAt: string;
    lat: number | null;
    lng: number | null;
    isMine: boolean;
    owner?: { name: string; username: string | null; avatar: string | null };
}

export interface Sighting {
    id: string;
    reporterId: string | null;
    note: string | null;
    lat: number;
    lng: number;
    seenAt: string;
    photoUrl: string | null;
    contact: string | null;
    createdAt: string;
    reporter?: { name: string; avatar: string | null };
}

export interface ListingInput {
    kind: ListingKind;
    petId?: string | null;
    petName?: string | null;
    species: Species;
    breed?: string | null;
    color?: string | null;
    gender?: string | null;
    ageText?: string | null;
    photos: string[];
    features: string[];
    approachNote?: string | null;
    situation?: string | null;
    chipStatus?: string | null;
    description?: string | null;
    locationText: string | null;
    lat: number;
    lng: number;
    eventAt: string;
    rewardEnabled?: boolean;
    rewardAmount?: number | null;
    contactMode: 'in_app' | 'phone';
    contactPhone?: string | null;
    notifyRadiusKm: number;
}

/** Kayıp modu (pets.is_lost) sunucuda değişince yayılır; PetContext hayvanları yeniden yükler. */
export const PETS_CHANGED_EVENT = 'moffi-pets-changed';
const announcePetsChanged = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(PETS_CHANGED_EVENT));
};

function fail(error: any, fallback: string): never {
    throw new Error(error?.message || fallback);
}

const mapListing = (r: any): LostListing => ({
    id: r.id, userId: r.user_id, kind: r.kind === 'found' ? 'found' : 'lost', status: r.status,
    petId: r.pet_id, petName: r.pet_name,
    species: r.pet_type === 'cat' ? 'cat' : r.pet_type === 'dog' ? 'dog' : 'other',
    breed: r.breed, color: r.color, gender: r.gender, ageText: r.age_text,
    photos: (Array.isArray(r.images) && r.images.length ? r.images : [r.img_url]).filter(Boolean),
    features: r.features || [], approachNote: r.approach_note, situation: r.situation, chipStatus: r.chip_status,
    description: r.description, locationText: r.location_text,
    eventAt: r.last_seen_date || r.created_at,
    rewardEnabled: !!r.reward_enabled, rewardAmount: r.reward_amount != null ? Number(r.reward_amount) : null,
    contactMode: r.contact_mode === 'phone' ? 'phone' : 'in_app', contactPhone: r.contact_phone || null,
    notifyRadiusKm: r.notify_radius_km || 3, notifiedCount: r.notified_count || 0,
    viewCount: r.view_count || 0, shareCount: r.share_count || 0,
    resolvedAt: r.resolved_at, resolution: r.resolution, createdAt: r.created_at,
    lat: r.latitude != null ? Number(r.latitude) : null, lng: r.longitude != null ? Number(r.longitude) : null,
    isMine: !!r.is_mine,
});

async function attachOwners(list: LostListing[]): Promise<LostListing[]> {
    const ids = Array.from(new Set(list.map(l => l.userId).filter(Boolean)));
    if (ids.length === 0) return list;
    const { data } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url').in('id', ids);
    const byId: Record<string, any> = {};
    (data || []).forEach((p: any) => { byId[p.id] = p; });
    return list.map(l => {
        const p = byId[l.userId];
        return { ...l, owner: p ? { name: p.full_name || p.username || 'Moffi üyesi', username: p.username, avatar: p.avatar_url } : undefined };
    });
}

export const lostService = {
    /** Yayındaki ilanlar (son 30 gün içinde kavuşanlar da, "Kavuştu" rozetiyle). */
    async list(): Promise<LostListing[]> {
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data, error } = await supabase.from('lost_pet_cards').select('*')
            .or(`status.eq.active,and(status.eq.resolved,resolved_at.gte.${since})`)
            .order('created_at', { ascending: false }).limit(300);
        if (error) fail(error, 'İlanlar yüklenemedi.');
        return attachOwners((data || []).map(mapListing));
    },

    async get(id: string): Promise<LostListing | null> {
        const { data, error } = await supabase.from('lost_pet_cards').select('*').eq('id', id).maybeSingle();
        if (error) fail(error, 'İlan yüklenemedi.');
        if (!data) return null;
        return (await attachOwners([mapListing(data)]))[0];
    },

    async mine(): Promise<LostListing[]> {
        const { data, error } = await supabase.from('lost_pet_cards').select('*').eq('is_mine', true)
            .order('created_at', { ascending: false });
        if (error) fail(error, 'İlanların yüklenemedi.');
        return (data || []).map(mapListing);
    },

    /** Sahibin bu hayvan için yayındaki kayıp ilanı (künyenin kayıp modu buna bağlı). */
    async activeForPet(petId: string): Promise<LostListing | null> {
        const { data, error } = await supabase.from('lost_pet_cards').select('*')
            .eq('is_mine', true).eq('pet_id', petId).eq('status', 'active').eq('kind', 'lost')
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) fail(error, 'İlan yüklenemedi.');
        return data ? mapListing(data) : null;
    },

    async uploadPhotos(files: File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const f of files) urls.push(await apiService.uploadMedia(f, 'posts'));
        return urls;
    },

    /** İlanı kaydeder, sonra yayınlar (pasaport kayıp modu + yakın çevre bildirimi). */
    async create(input: ListingInput): Promise<{ id: string; notified: number }> {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('İlan vermek için giriş yapmalısın.');
        const { data, error } = await supabase.from('lost_pets').insert({
            user_id: auth.user.id, kind: input.kind, pet_id: input.petId || null, pet_name: input.petName?.trim() || null,
            pet_type: input.species, breed: input.breed?.trim() || null, color: input.color?.trim() || null,
            gender: input.gender || null, age_text: input.ageText?.trim() || null,
            img_url: input.photos[0] || null, images: input.photos, features: input.features.slice(0, 12),
            approach_note: input.approachNote?.trim() || null, situation: input.situation || null,
            chip_status: input.chipStatus || null, description: input.description?.trim() || null,
            location_text: input.locationText, latitude: input.lat, longitude: input.lng,
            last_seen_date: input.eventAt, reward_enabled: !!input.rewardEnabled,
            reward_amount: input.rewardEnabled && input.rewardAmount ? input.rewardAmount : null,
            contact_mode: input.contactMode, contact_phone: input.contactMode === 'phone' ? input.contactPhone?.trim() || null : null,
            notify_radius_km: Math.min(10, Math.max(1, Math.round(input.notifyRadiusKm))),
        }).select('id').single();
        if (error || !data) fail(error, 'İlan kaydedilemedi.');
        const { data: notified, error: pubErr } = await supabase.rpc('publish_lost_listing', { p_listing_id: data.id });
        if (pubErr) fail(pubErr, 'İlan yayınlanamadı.');
        if (input.kind === 'lost' && input.petId) announcePetsChanged();
        return { id: data.id, notified: Number(notified) || 0 };
    },

    async update(id: string, patch: Partial<Pick<ListingInput, 'description' | 'features' | 'approachNote' | 'locationText' | 'photos' | 'rewardEnabled' | 'rewardAmount' | 'contactMode' | 'contactPhone'>>) {
        const row: Record<string, any> = {};
        if (patch.description !== undefined) row.description = patch.description?.trim() || null;
        if (patch.features !== undefined) row.features = patch.features.slice(0, 12);
        if (patch.approachNote !== undefined) row.approach_note = patch.approachNote?.trim() || null;
        if (patch.locationText !== undefined) row.location_text = patch.locationText;
        if (patch.photos !== undefined) { row.images = patch.photos; row.img_url = patch.photos[0] || null; }
        if (patch.rewardEnabled !== undefined) row.reward_enabled = patch.rewardEnabled;
        if (patch.rewardAmount !== undefined) row.reward_amount = patch.rewardAmount;
        if (patch.contactMode !== undefined) row.contact_mode = patch.contactMode;
        if (patch.contactPhone !== undefined) row.contact_phone = patch.contactPhone?.trim() || null;
        const { error } = await supabase.from('lost_pets').update(row).eq('id', id);
        if (error) fail(error, 'İlan güncellenemedi.');
    },

    async expandRadius(id: string, km: number): Promise<number> {
        const { data, error } = await supabase.rpc('expand_lost_listing_radius', { p_listing_id: id, p_radius_km: km });
        if (error) fail(error, 'Bildirim alanı genişletilemedi.');
        return Number(data) || 0;
    },

    async resolve(id: string, resolution: 'reunited' | 'closed', thankHelpers: boolean) {
        const { error } = await supabase.rpc('resolve_lost_listing', { p_listing_id: id, p_resolution: resolution, p_thank_helpers: thankHelpers });
        if (error) fail(error, 'İlan kapatılamadı.');
        announcePetsChanged();
    },

    async recordEvent(id: string, event: 'view' | 'share') {
        await supabase.rpc('record_listing_event', { p_listing_id: id, p_event: event });
    },

    async ownerStats(id: string): Promise<{ views: number; sightings: number; messages: number; shares: number; notified: number } | null> {
        const { data, error } = await supabase.rpc('get_listing_owner_stats', { p_listing_id: id });
        if (error) return null;
        const r = Array.isArray(data) ? data[0] : data;
        return r ? { views: r.views || 0, sightings: r.sightings || 0, messages: r.messages || 0, shares: r.shares || 0, notified: r.notified || 0 } : null;
    },

    async matches(id: string): Promise<LostListing[]> {
        const { data, error } = await supabase.rpc('get_listing_matches', { p_listing_id: id });
        if (error) return [];
        return attachOwners((data || []).map(mapListing));
    },

    // --- Görülme bildirimi ---------------------------------------------------
    async submitSighting(id: string, s: { lat: number; lng: number; seenAt: string; note?: string; photoUrl?: string | null; contact?: string }) {
        const { error } = await supabase.rpc('submit_sighting', {
            p_listing_id: id, p_lat: s.lat, p_lng: s.lng, p_seen_at: s.seenAt, p_note: s.note || null,
            p_photo_url: s.photoUrl || null, p_contact: s.contact || null,
        });
        if (error) fail(error, 'Bildirim gönderilemedi.');
    },

    async sightings(id: string): Promise<Sighting[]> {
        const { data, error } = await supabase.from('pet_sightings').select('*').eq('lost_pet_id', id)
            .order('created_at', { ascending: false });
        if (error) fail(error, 'Görülmeler yüklenemedi.');
        const rows = data || [];
        const ids = Array.from(new Set(rows.map((r: any) => r.reporter_id).filter(Boolean)));
        const people: Record<string, any> = {};
        if (ids.length) {
            const { data: cards } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url').in('id', ids);
            (cards || []).forEach((c: any) => { people[c.id] = c; });
        }
        return rows.map((r: any) => ({
            id: r.id, reporterId: r.reporter_id, note: r.description, lat: r.latitude, lng: r.longitude,
            seenAt: r.seen_at || r.created_at, photoUrl: r.photo_url, contact: r.contact, createdAt: r.created_at,
            reporter: r.reporter_id && people[r.reporter_id]
                ? { name: people[r.reporter_id].full_name || people[r.reporter_id].username || 'Moffi üyesi', avatar: people[r.reporter_id].avatar_url }
                : undefined,
        }));
    },

    // --- Yakın çevre bildirimi ----------------------------------------------
    async alertArea(): Promise<{ enabled: boolean; lat: number | null; lng: number | null }> {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return { enabled: false, lat: null, lng: null };
        const { data } = await supabase.from('profiles').select('lost_alerts_enabled, alert_lat, alert_lng').eq('id', auth.user.id).maybeSingle();
        return { enabled: !!data?.lost_alerts_enabled, lat: data?.alert_lat ?? null, lng: data?.alert_lng ?? null };
    },

    async setAlertArea(enabled: boolean, lat: number | null, lng: number | null) {
        const { error } = await supabase.rpc('set_lost_alert_area', { p_enabled: enabled, p_lat: lat, p_lng: lng });
        if (error) fail(error, 'Ayar kaydedilemedi.');
    },

    async countAlertUsers(lat: number, lng: number, radiusKm: number): Promise<number | null> {
        const { data, error } = await supabase.rpc('count_lost_alert_users', { p_lat: lat, p_lng: lng, p_radius_km: radiusKm });
        if (error) return null;
        return Number(data) || 0;
    },
};

export const SPECIES_LABEL: Record<Species, string> = { dog: 'Köpek', cat: 'Kedi', other: 'Diğer' };

export const LOST_SITUATIONS = [
    { id: 'home', label: 'Evden kaçtı' },
    { id: 'walk', label: 'Yürüyüşte kayboldu' },
    { id: 'moving', label: 'Taşınırken / yolculukta' },
    { id: 'other', label: 'Diğer' },
];

export const FOUND_SITUATIONS = [
    { id: 'with_me', label: 'Yanımda' },
    { id: 'seen', label: 'Gördüm (yanımda yok)' },
    { id: 'shelter', label: 'Barınağa / veterinere teslim ettim' },
];

export const CHIP_OPTIONS = [
    { id: 'tag_no_number', label: 'Var (numara yok)' },
    { id: 'tag_number', label: 'Var (numara var)' },
    { id: 'none', label: 'Yok' },
];
