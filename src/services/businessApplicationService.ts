// İşletme başvurusu ve yönetici onayı (8.54 modeli). Tek yazma yolu sunucu fonksiyonları:
// submit_business_application (yeni başvuru ya da reddedileni düzeltip yeniden gönderme), admin_review_business (yönetici + 2FA).
// İstemcinin businesses/business_members tablolarına yazma yetkisi yok.

import { supabase } from '@/lib/supabase';
import type { BusinessType } from '@/context/AuthContext';

export interface BusinessApplicationInput {
    type: BusinessType;
    name: string;
    ownerName: string;
    phone: string;
    taxId: string;
    iban: string;
    address: string;
    province: string;
    district: string;
    lat: number;
    lng: number;
}

export type KybStatus = 'pending' | 'approved' | 'rejected';

export interface AdminBusinessRow {
    id: string;
    name: string;
    type: BusinessType | null;
    approved: boolean;
    kybStatus: KybStatus;
    rejectionReason: string | null;
    ownerName: string | null;
    phone: string | null;
    taxId: string | null;
    iban: string | null;
    address: string | null;
    province: string | null;
    district: string | null;
    lat: number | null;
    lng: number | null;
    createdAt: string;
    updatedAt: string;
    owner: { id: string; name: string | null; email: string | null } | null;
}

function fail(error: { message?: string } | null, fallback: string): never {
    // Sunucu fonksiyonlarının Türkçe hata metni kullanıcıya olduğu gibi gösterilir.
    throw new Error(error?.message?.replace(/^.*?: /, '') || fallback);
}

/** Türkiye IBAN'ı (TR + 24 hane, mod 97). Sunucu aynı kuralı iban_is_valid ile uygular; burada anında geri bildirim için. */
export function isValidTrIban(raw: string): boolean {
    const s = raw.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(s)) return false;
    const moved = s.slice(4) + s.slice(0, 4);
    let digits = '';
    for (const ch of moved) digits += /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    let r = 0;
    for (const d of digits) r = (r * 10 + Number(d)) % 97;
    return r === 1;
}

/** IBAN'ı 4'lü gruplar hâlinde gösterir (TR00 0000 ...). */
export const formatIban = (raw: string) => raw.replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();

export const businessApplicationService = {
    /** Yeni başvuru (businessId boş) ya da reddedilen başvuruyu düzeltip yeniden gönderme. İşletme kimliğini döner. */
    async submit(input: BusinessApplicationInput, businessId: string | null = null): Promise<string> {
        const { data, error } = await supabase.rpc('submit_business_application', {
            p_business: businessId,
            p_type: input.type,
            p_name: input.name,
            p_owner_name: input.ownerName,
            p_phone: input.phone,
            p_tax_id: input.taxId,
            p_iban: input.iban,
            p_address: input.address,
            p_province: input.province,
            p_district: input.district,
            p_lat: input.lat,
            p_lng: input.lng,
        });
        if (error) fail(error, 'Başvuru gönderilemedi.');
        return data as string;
    },

    /** Sahibi olduğu reddedilmiş başvurunun bilgileri (yeniden gönderme formunu doldurmak için). */
    async loadOwn(businessId: string): Promise<(BusinessApplicationInput & { kybStatus: KybStatus; rejectionReason: string | null }) | null> {
        const { data, error } = await supabase
            .from('businesses')
            .select('business_type, name, owner_name, phone, tax_id, iban, address, province, district, lat, lng, kyb_status, kyb_rejection_reason')
            .eq('id', businessId)
            .maybeSingle();
        if (error) fail(error, 'Başvuru okunamadı.');
        if (!data) return null;
        return {
            type: data.business_type as BusinessType, name: data.name ?? '', ownerName: data.owner_name ?? '', phone: data.phone ?? '',
            taxId: data.tax_id ?? '', iban: data.iban ?? '', address: data.address ?? '', province: data.province ?? '',
            district: data.district ?? '', lat: Number(data.lat), lng: Number(data.lng),
            kybStatus: data.kyb_status as KybStatus, rejectionReason: data.kyb_rejection_reason,
        };
    },

    /** Yönetici: tüm işletmeler ve sahipleri (yönetici okuma kuralı businesses + profiles'a açık). */
    async adminList(): Promise<AdminBusinessRow[]> {
        const { data, error } = await supabase
            .from('businesses')
            .select('id, name, business_type, approved, kyb_status, kyb_rejection_reason, owner_name, phone, tax_id, iban, address, province, district, lat, lng, created_at, updated_at, created_by')
            .order('created_at', { ascending: false })
            .limit(500);
        if (error) fail(error, 'İşletmeler okunamadı.');
        const rows = data || [];
        const { data: owners } = rows.length
            ? await supabase.from('business_members').select('business_id, user_id').eq('role', 'owner').in('business_id', rows.map(r => r.id))
            : { data: [] as { business_id: string; user_id: string }[] };
        const ownerOf = new Map((owners || []).map(o => [o.business_id, o.user_id]));
        const ids = Array.from(new Set(rows.map(r => ownerOf.get(r.id) || r.created_by).filter(Boolean))) as string[];
        // profiles'ta e-posta yok; yönetici e-postayı admin_user_emails ile okur.
        const [{ data: people }, { data: emails }] = ids.length
            ? await Promise.all([
                supabase.from('profiles').select('id, full_name').in('id', ids),
                supabase.rpc('admin_user_emails', { p_ids: ids }),
            ])
            : [{ data: [] as { id: string; full_name: string | null }[] }, { data: [] as { id: string; email: string }[] }];
        const emailById = new Map(((emails || []) as { id: string; email: string }[]).map(e => [e.id, e.email]));
        const personById = new Map((people || []).map(p => [p.id, { full_name: p.full_name as string | null, email: emailById.get(p.id) ?? null }]));
        return rows.map(r => {
            const ownerId = ownerOf.get(r.id) || r.created_by;
            const p = ownerId ? personById.get(ownerId) : undefined;
            return {
                id: r.id, name: r.name, type: r.business_type as BusinessType | null, approved: !!r.approved,
                kybStatus: (r.kyb_status || 'pending') as KybStatus, rejectionReason: r.kyb_rejection_reason,
                ownerName: r.owner_name, phone: r.phone, taxId: r.tax_id, iban: r.iban, address: r.address,
                province: r.province, district: r.district,
                lat: r.lat == null ? null : Number(r.lat), lng: r.lng == null ? null : Number(r.lng),
                createdAt: r.created_at, updatedAt: r.updated_at,
                owner: ownerId ? { id: ownerId, name: p?.full_name ?? null, email: p?.email ?? null } : null,
            };
        });
    },

    /** Yönetici kararı (iki adımlı doğrulama sunucuda zorunlu). Ret nedeni işletmeye gösterilir. */
    async review(businessId: string, approve: boolean, reason?: string): Promise<void> {
        const { error } = await supabase.rpc('admin_review_business', { p_business: businessId, p_approve: approve, p_reason: reason ?? null });
        if (error) fail(error, 'Karar kaydedilemedi.');
    },
};
