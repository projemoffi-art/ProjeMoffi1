// İçerik Stüdyosu servisi (migration 20261004100000_content_studio). Ana sayfa hikâyeleri (Moffi, Veteriner Önerisi,
// Fırsatlar) ve "Moffi'den İlham" kartı buradan okunur; yazma yalnızca sunucu fonksiyonlarıyla. İşletme içeriği admin
// onayı olmadan yayına çıkmaz; bölgesel içerik (öneri, fırsat) yalnızca işletmenin çevresindeki kullanıcıya gelir.

import { supabase } from '@/lib/supabase';

export type ContentChannel = 'moffi' | 'inspiration' | 'vet' | 'deal';
export type ContentStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type Species = 'all' | 'dog' | 'cat';

export interface FeedItem {
    id: string;
    channel: ContentChannel;
    title: string;
    body: string | null;
    mediaUrl: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    couponCode: string | null;
    discount: string | null;
    endsAt: string | null;
    businessId: string | null;
    businessName: string | null;
    businessLogo: string | null;
    distanceKm: number | null;
    seen: boolean;
}

export interface BusinessContentItem {
    id: string;
    channel: 'vet' | 'deal';
    status: ContentStatus;
    title: string;
    body: string | null;
    mediaUrl: string | null;
    campaignId: string | null;
    startsAt: string;
    endsAt: string | null;
    rejectReason: string | null;
    views: number;
    taps: number;
    createdAt: string;
}

export interface AdminContentItem extends Omit<BusinessContentItem, 'channel' | 'campaignId'> {
    channel: ContentChannel;
    ctaLabel: string | null;
    ctaUrl: string | null;
    targetSpecies: Species;
    priority: number;
    radiusKm: number;
    businessId: string | null;
    businessName: string | null;
    couponCode: string | null;
    discount: string | null;
}

export interface AdminContentInput {
    channel: 'moffi' | 'inspiration';
    title: string;
    body: string;
    mediaUrl: string;
    ctaLabel: string;
    ctaUrl: string;
    startsAt: string | null;
    endsAt: string | null;
    species: Species;
    priority: number;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? null : String(v));

function fail(error: { message?: string } | null, fallback: string): never {
    // Sunucu fonksiyonlarının Türkçe hata metni kullanıcıya olduğu gibi gösterilir.
    throw new Error(error?.message?.replace(/^.*?: /, '') || fallback);
}

export const contentService = {
    async feed(lat: number | null, lng: number | null, species: ('dog' | 'cat')[] | null): Promise<FeedItem[]> {
        const { data, error } = await supabase.rpc('content_feed', { p_lat: lat, p_lng: lng, p_species: species && species.length ? species : null });
        if (error) { console.warn('İçerik akışı alınamadı:', error.message); return []; }
        return ((data || []) as Row[]).map(r => ({
            id: String(r.id), channel: r.channel as ContentChannel, title: String(r.title || ''), body: str(r.body),
            mediaUrl: str(r.media_url), ctaLabel: str(r.cta_label), ctaUrl: str(r.cta_url), couponCode: str(r.coupon_code),
            discount: str(r.discount), endsAt: str(r.ends_at), businessId: str(r.business_id), businessName: str(r.business_name),
            businessLogo: str(r.business_logo), distanceKm: r.distance_km == null ? null : Number(r.distance_km), seen: !!r.seen,
        }));
    },

    /** Görüntülenme/dokunma kaydı; kullanıcı başına bir kez sayılır. Hata akışı bozmaz. */
    track(id: string, kind: 'view' | 'tap') {
        supabase.rpc('content_track', { p_id: id, p_kind: kind }).then(({ error }) => { if (error) console.warn('İçerik kaydı:', error.message); });
    },

    // ── İşletme ──
    async submitVet(businessId: string, input: { title: string; body: string; mediaUrl: string | null; species: Species; days: number }) {
        const { data, error } = await supabase.rpc('content_submit_vet', {
            p_business: businessId, p_title: input.title, p_body: input.body, p_media_url: input.mediaUrl, p_species: input.species, p_days: input.days,
        });
        if (error) fail(error, 'Öneri gönderilemedi.');
        return String(data);
    },
    async promoteCampaign(campaignId: string, days = 30) {
        const { data, error } = await supabase.rpc('content_promote_campaign', { p_campaign: campaignId, p_days: days });
        if (error) fail(error, 'Öne çıkarma talebi gönderilemedi.');
        return String(data);
    },
    async withdraw(id: string) {
        const { error } = await supabase.rpc('content_withdraw', { p_id: id });
        if (error) fail(error, 'Geri çekilemedi.');
    },
    async myItems(businessId: string): Promise<BusinessContentItem[]> {
        const { data, error } = await supabase.rpc('content_my_items', { p_business: businessId });
        if (error) fail(error, 'İçerikler yüklenemedi.');
        return ((data || []) as Row[]).map(r => ({
            id: String(r.id), channel: r.channel as 'vet' | 'deal', status: r.status as ContentStatus, title: String(r.title || ''),
            body: str(r.body), mediaUrl: str(r.media_url), campaignId: str(r.campaign_id), startsAt: String(r.starts_at),
            endsAt: str(r.ends_at), rejectReason: str(r.reject_reason), views: Number(r.views || 0), taps: Number(r.taps || 0),
            createdAt: String(r.created_at),
        }));
    },

    // ── Süper admin ──
    async adminList(status: ContentStatus | null): Promise<AdminContentItem[]> {
        const { data, error } = await supabase.rpc('content_admin_list', { p_status: status });
        if (error) fail(error, 'İçerikler yüklenemedi.');
        return ((data || []) as Row[]).map(r => ({
            id: String(r.id), channel: r.channel as ContentChannel, status: r.status as ContentStatus, title: String(r.title || ''),
            body: str(r.body), mediaUrl: str(r.media_url), ctaLabel: str(r.cta_label), ctaUrl: str(r.cta_url),
            startsAt: String(r.starts_at), endsAt: str(r.ends_at), targetSpecies: (r.target_species as Species) || 'all',
            priority: Number(r.priority || 0), radiusKm: Number(r.radius_km || 25), businessId: str(r.business_id),
            businessName: str(r.business_name), couponCode: str(r.coupon_code), discount: str(r.discount),
            rejectReason: str(r.reject_reason), views: Number(r.views || 0), taps: Number(r.taps || 0), createdAt: String(r.created_at),
        }));
    },
    async adminSave(input: AdminContentInput, id?: string) {
        const { data, error } = await supabase.rpc('content_admin_save', {
            p_id: id || null, p_channel: input.channel, p_title: input.title, p_body: input.body, p_media_url: input.mediaUrl,
            p_cta_label: input.ctaLabel, p_cta_url: input.ctaUrl, p_starts_at: input.startsAt, p_ends_at: input.endsAt,
            p_species: input.species, p_priority: input.priority,
        });
        if (error) fail(error, 'Kaydedilemedi.');
        return String(data);
    },
    async review(id: string, approve: boolean, reason?: string) {
        const { error } = await supabase.rpc('content_review', { p_id: id, p_approve: approve, p_reason: reason || null });
        if (error) fail(error, 'İşlem yapılamadı.');
    },
    async archive(id: string) {
        const { error } = await supabase.rpc('content_archive', { p_id: id });
        if (error) fail(error, 'Arşivlenemedi.');
    },
};
