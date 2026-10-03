import {
    Pet, UserProfile, ProfileUpdate,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, ClinicCampaign,
    BusinessAppointmentInput, ClinicClient, BusinessProfileData, WalkPoint
} from './types';
import { supabase as rawSupabase } from '@/lib/supabase';
import type { SupabaseClient, User as AuthUser } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '@/types/supabase';
import { shrinkForUpload } from '@/lib/media/compress';
import { albumService } from './albumService';
import { Doctor } from '@/types/domain';

// Bu dosya şemadan üretilen tiplerle çalışır (src/types/supabase.ts): yanlış sütun adı derlemede yakalanır.
const supabase = rawSupabase as unknown as SupabaseClient<Database>;

/** Sohbette görünen ad: işletmede işletme adı, kişide ad soyad, yoksa kullanıcı adı. */
type DbTables = Database['public']['Tables'];
type ProfileNameFields = { role?: string | null; business_name?: string | null; full_name?: string | null; username?: string | null };

function chatDisplayName(p: ProfileNameFields | null | undefined): string {
    return (p?.role === 'business' && p?.business_name) || p?.full_name || p?.username || 'Moffi üyesi';
}

function mapChatMessage(msg: Tables<'messages'>, myId: string, time: string) {
    return {
        id: msg.id,
        text: msg.is_deleted ? '' : msg.content,
        attachmentUrl: msg.is_deleted ? null : msg.attachment_url,
        sentByMe: msg.sender_id === myId,
        senderId: msg.sender_id,
        time,
        createdAt: msg.created_at,
        read: !!msg.is_read,
        deleted: !!msg.is_deleted,
        conversationId: msg.conversation_id,
        replyTo: msg.reply_to || null,
        reactions: [] as { userId: string; emoji: string }[],
    };
}

// Duraklamalar hariç süre (finish_walk'ın sakladığı); çok eski kayıtlarda yoksa başlangıç-bitiş farkı.
function walkActiveSeconds(w: { active_seconds?: number | null; start_time?: string | null; end_time?: string | null }): number {
    if (typeof w.active_seconds === 'number') return w.active_seconds;
    if (!w.start_time || !w.end_time) return 0;
    return Math.max(0, Math.floor((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000));
}

const isObject = (v: Json | null | undefined): v is { [key: string]: Json | undefined } =>
    !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Varsayılanı olmayan ama SQL'de null kabul eden fonksiyon parametresi: üretilen tip onu zorunlu metin/sayı gösterir,
 * null'ın anlamı ("yok/temizle") fonksiyonda tanımlıdır. Yalnızca bu durumda kullanılır.
 */
const sqlNullable = <T>(v: T | null | undefined): T => v as T;

/** Sunucu fonksiyonunun json sonucu → nesne (değilse boş nesne). */
const jsonObj = (v: Json | null | undefined): { [key: string]: Json | undefined } => (isObject(v) ? v : {});

/** "28 kg", "28,5" gibi girdiden sayı; boşsa null. */
function parseWeight(raw: string | number | null | undefined): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const match = String(raw).replace(',', '.').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
}

/** pets satırı → uygulamadaki Pet (tek eşleme yeri). */
export function mapPetRow(row: Tables<'pets'>): Pet {
    return {
        id: row.id,
        name: row.name,
        type: row.type || 'dog',
        breed: row.breed || '',
        age: row.age || undefined,
        gender: row.gender || '',
        image: row.avatar_url || '',
        avatar: row.avatar_url || undefined,
        cover_photo: row.cover_url || undefined,
        weight: row.weight !== null ? `${row.weight} kg` : '',
        neutered: row.is_neutered ?? undefined,
        size: row.size || undefined,
        microchip: row.microchip_no || undefined,
        birthday: row.birth_date || undefined,
        birth_date_estimated: row.birth_date_estimated,
        color: row.color || undefined,
        petvet_no: row.petvet_no || undefined,
        passport_no: row.passport_no || undefined,
        character: row.character || undefined,
        features: row.features,
        gallery_urls: row.gallery_urls,
        is_lost: !!row.is_lost,
        created_at: row.created_at || undefined,
        sos_settings: isObject(row.sos_settings) ? (row.sos_settings as Pet['sos_settings']) : undefined,
        xp: row.xp ?? 0,
        level: row.level ?? 1,
    };
}

/** İşletmenin gördüğü sipariş: yalnızca o işletmeye ait kalemler (order_items.business_id). Alıcının e-postası gösterilmez. */
export interface SellerOrderItem { id: string; productId: string; productName: string; quantity: number; price: number; status: string }
export interface SellerOrder {
    id: string;
    status: string;
    /** Ödeme anındaki komisyon oranı (yüzde; orders.commission_rate). */
    commissionRate: number;
    date: string;
    shippingAddress: string;
    trackingNumber: string;
    carrier: string;
    customerName: string;
    customerPhone: string | null;
    items: SellerOrderItem[];
}

/** Oyun ekranının sunucudaki durumu (game_status). */
export interface GameStatus {
    coinBalance: number;
    coinsToday: number;
    xpToday: number;
    coinCap: number;
    xpCap: number;
    petXp: number;
    petLevel: number;
}

/** Yıldız Patiler adayı (yönetici): son 7 günün gerçek yürüyüşüne göre (admin_daily_star_candidates). */
export interface DailyStarCandidate {
    id: string;
    name: string;
    breed: string;
    image: string;
    ownerName: string;
    weekKm: number;
    walks: number;
}

export interface DailyStar {
    id: string;
    pet_id: string;
    date: string;
    rank: number;
    title: string;
    description: string;
    badge: string;
    media_url: string;
    status: string;
    created_at: string;
    pet: { name: string | null; image: string | null; breed: string | null } | null;
}

/** Kullanıcının randevu talebi (useVet). Durum sunucuda hep 'pending' başlar. */
export interface AppointmentRequest {
    clinicId: string;
    clinicName?: string;
    petId: string;
    appointmentDate: string;
    notes?: string;
    sharedPassport?: Json | null;
    duration_minutes?: number;
    doctorId?: string | null;
    doctorName?: string;
}

/** İşletmenin randevu ayarları (clinic_settings). Açık günler/saatler businesses.working_hours'ta (clinic_day_hours onu okur). */
export interface ClinicSettingsInput {
    startTime: string;
    endTime: string;
    lunchStart: string;
    lunchEnd: string;
    slotDuration: number;
}

/** Veteriner diyet planı (nutrition_plans). */
export interface NutritionPlanInput {
    dailyCalories: number | null;
    foodType: string | null;
    feedingTimes?: string[];
    notes: string | null;
}

/** Takipçi/takip listelerindeki kısa profil (herkese açık kart). */
export interface ProfileSummary {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    cover_photo?: string;
    petName?: string | null;
    role: string;
    bio?: string | null;
}

function mapProfileSummary(c: Tables<'profile_cards'>): ProfileSummary {
    const aura = jsonObj(c.aura_settings) as { cover_photo?: string | null };
    return {
        id: c.id || '',
        name: c.full_name || 'Moffi Kullanıcısı',
        username: c.username || c.full_name || 'moffi_user',
        avatar: c.avatar_url || undefined,
        cover_photo: aura.cover_photo || c.cover_url || undefined,
        petName: c.pet_name,
        role: c.role || 'user',
        bio: c.bio,
    };
}

/** products satırı → ShopProduct (tek eşleme yeri; puan/yorum sütunu yok, uydurulmaz). */
function mapProductRow(p: Tables<'products'>): ShopProduct {
    const stock = p.stock ?? 0;
    return {
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        price: Number(p.price),
        oldPrice: p.old_price ? Number(p.old_price) : undefined,
        image: p.image_url || '',
        category: (p.category || 'accessory') as ShopCategory,
        inStock: stock > 0,
        stockCount: stock,
        isVetApproved: !!p.is_vet_approved,
        isPrimeOnly: !!p.is_prime_only,
        tag: p.tag || undefined,
        ownerId: p.owner_id || undefined,
    };
}

type OrderWithItems = Tables<'orders'> & {
    items: { quantity: number; price_at_purchase: number; status?: string; product: Tables<'products'> | null }[] | null;
};

/** Sipariş satırı (+kalemler) → ShopOrder (kullanıcının siparişleri ve yönetici listesi aynı eşlemeyi kullanır). */
function mapOrderRow(o: OrderWithItems): ShopOrder {
    return {
        id: o.id,
        userId: o.user_id || '',
        totalPrice: Number(o.total_amount),
        status: (o.status || 'pending') as ShopOrder['status'],
        createdAt: o.created_at || '',
        updatedAt: o.updated_at || o.created_at || '',
        shippingAddress: o.shipping_address || '',
        expiresAt: o.expires_at,
        carrier: o.carrier,
        trackingNumber: o.tracking_number,
        items: (o.items || []).map(item => ({
            quantity: item.quantity,
            status: item.status,
            // Ürün silinmiş olabilir; satın alma anındaki fiyat korunur.
            product: item.product
                ? { ...mapProductRow(item.product), price: Number(item.price_at_purchase) }
                : { id: '', name: 'Silinmiş ürün', price: Number(item.price_at_purchase), image: '', category: 'accessory', inStock: false },
        })),
    };
}

export class SupabaseApiService {
    // Session is managed internally by Supabase client very efficiently.
    // Custom aggressive caching causes cross-account validation bugs.
    
    private pendingActionLocks = new Set<string>();
    // Bir sayfa aynı anda 10-60 arası fonksiyon çağırıp her biri getSessionUser() istediğinde
    // (dashboard/home gibi çok-veri-çeken ekranlarda normal), hepsi paralel, gereksiz
    // /auth/v1/user isteği atıyordu — bu da Supabase auth rate limit'ine takılıp giriş
    // akışını aralıklı olarak bozabiliyordu (2026-09-23 kontrol turunda tespit edildi).
    // Kısa ömürlü bir promise cache/dedup ile aynı pencuredeki tüm çağrılar TEK ağ
    // isteğini paylaşır; TTL çok kısa olduğu için hesap değiştirme senaryosunda (bu
    // deduplication'ın önceden var olma sebebi) bayat veri riski yok.
    private sessionUserCache: { promise: Promise<AuthUser | null> | null; timestamp: number } = { promise: null, timestamp: 0 };
    private static readonly SESSION_USER_CACHE_MS = 2000;


    private async getSessionUser(): Promise<AuthUser | null> {
        const now = Date.now();
        if (this.sessionUserCache.promise && (now - this.sessionUserCache.timestamp) < SupabaseApiService.SESSION_USER_CACHE_MS) {
            return this.sessionUserCache.promise;
        }

        const promise = (async () => {
            try {
                // Use getUser() NOT getSession() — getSession() reads from local cache
                // and can return a stale/wrong user when switching accounts.
                // getUser() validates the token with the Supabase server every time.
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error("Supabase auth getUser error:", error);
                    return null;
                }
                return user || null;
            } catch (err) {
                console.error("Critical Auth Error in getSessionUser:", err);
                return null;
            }
        })();

        this.sessionUserCache = { promise, timestamp: now };
        return promise;
    }

    // --- AKTİF İŞLETME (8.54) ---
    // Hesap = kişi; işletme ayrı kayıt (`businesses`). İşletme adına yapılan her okuma/yazma kişinin kimliğini değil,
    // sunucunun `current_business_id()` sonucunu kullanır (kişinin seçtiği, üyesi olduğu işletme). Yetkiyi zaten
    // veritabanı kuralları üyelikle denetler; burası sadece "hangi işletme adına" sorusunu tek yerden cevaplar.
    private activeBusinessCache: { userId: string | null; promise: Promise<string | null> | null } = { userId: null, promise: null };

    async getActiveBusinessId(): Promise<string | null> {
        const user = await this.getSessionUser();
        if (!user) return null;
        if (this.activeBusinessCache.promise && this.activeBusinessCache.userId === user.id) {
            return this.activeBusinessCache.promise;
        }
        const promise = (async () => {
            const { data, error } = await supabase.rpc('current_business_id');
            if (error) {
                console.error('current_business_id error:', error);
                this.activeBusinessCache = { userId: null, promise: null };
                return null;
            }
            return (data as string | null) || null;
        })();
        this.activeBusinessCache = { userId: user.id, promise };
        return promise;
    }

    /** İşletme adına çalışan fonksiyonlar için: aktif işletme yoksa anlaşılır hata. */
    private async requireBusinessId(): Promise<string> {
        const id = await this.getActiveBusinessId();
        if (!id) throw new Error('Bu işlem için bir işletme hesabına bağlı olman gerekiyor.');
        return id;
    }

    async getMyBusinesses(): Promise<{ id: string; name: string; businessType: string | null; approved: boolean; kybStatus: string | null; role: 'owner' | 'manager' | 'staff'; logoUrl: string | null; isActive: boolean }[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data, error } = await supabase.rpc('my_businesses');
        if (error) throw error;
        return (data || []).map(b => ({
            id: b.id, name: b.name || 'İşletme', businessType: b.business_type, approved: !!b.approved,
            kybStatus: b.kyb_status, role: b.role as 'owner' | 'manager' | 'staff', logoUrl: b.logo_url, isActive: !!b.is_active,
        }));
    }

    async setActiveBusiness(businessId: string): Promise<void> {
        const { error } = await supabase.rpc('set_active_business', { p_business: businessId });
        if (error) throw error;
        this.activeBusinessCache = { userId: null, promise: null };
    }

    /** Aktif işletmenin tam kaydı (sadece üyeler okuyabilir). */
    async getActiveBusiness(): Promise<Tables<'businesses'> | null> {
        const id = await this.getActiveBusinessId();
        if (!id) return null;
        const { data, error } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
    }

    /** Aktif işletmenin kaydını günceller (sahip/yönetici; izinli kolonlar veritabanında sınırlı). */
    async updateActiveBusiness(patch: DbTables['businesses']['Update']): Promise<void> {
        const id = await this.requireBusinessId();
        const { data, error } = await supabase.from('businesses').update(patch).eq('id', id).select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('İşletme bilgisi güncellenemedi (yetkin olmayabilir).');
    }


    // --- AUTH & PROFILE ---

    async getUserProfile(id: string): Promise<UserProfile | null> {
        // Kendi profili: tüm alanlar (profiles). Başkasının: sadece herkese açık kart (profile_cards) —
        // telefon, adres, IBAN gibi kişisel alanlar başkasına hiç gelmez.
        const me = await this.getSessionUser();
        const own = me?.id === id;
        const [profileRes, followersRes, followingRes] = await Promise.all([
            own
                ? supabase.from('profiles').select('*').eq('id', id).maybeSingle()
                : supabase.from('profile_cards').select('*').eq('id', id).maybeSingle(),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
        ]);
        if (profileRes.error || !profileRes.data) {
            if (profileRes.error) console.warn('Profile not found:', profileRes.error);
            return null;
        }
        // profile_cards, profiles'ın herkese açık alt kümesi (+ is_prime); eksik alanlar boş kalır.
        const data = profileRes.data as Partial<Tables<'profiles'>> & { is_prime?: boolean | null };
        const aura = (data.aura_settings && typeof data.aura_settings === 'object' && !Array.isArray(data.aura_settings) ? data.aura_settings : {}) as { cover_photo?: string | null };
        const primeUntil = data.prime_until ?? null;
        return {
            id: data.id || id,
            name: data.full_name || 'Moffi Kullanıcısı',
            username: data.username || data.full_name || 'moffi_user',
            avatar: data.avatar_url || undefined,
            cover_photo: aura.cover_photo || data.cover_url || undefined,
            petName: data.pet_name ?? null,
            role: data.role || 'user',
            bio: data.bio ?? null,
            // Prime: tek kaynak profiles.prime_until (8.52); başkasının profilinde profile_cards.is_prime
            is_prime: data.is_prime === true || (!!primeUntil && new Date(primeUntil).getTime() > Date.now()),
            prime_until: primeUntil,
            created_at: data.created_at ?? null,
            default_allow_comments: data.default_allow_comments ?? true,
            default_comment_privacy: data.default_comment_privacy || 'everyone',
            comment_filter_words: data.comment_filter_words || [],
            phone: data.phone ?? null,
            province: data.province ?? null,
            district: data.district ?? null,
            birth_date: data.birth_date ?? null,
            gender: data.gender ?? null,
            account_status: data.account_status || 'active',
            businessType: data.business_type ?? null,
            businessName: data.business_name ?? null,
            businessApproved: data.business_approved ?? null,
            kybStatus: data.kyb_status ?? null,
            taxId: data.tax_id ?? null,
            iban: data.iban ?? null,
            address: data.address ?? null,
            ownerName: data.owner_name ?? null,
            working_hours: data.working_hours ?? null,
            wallet_balance: Number(data.wallet_balance) || 0,
            moffi_coins: Number(data.coin_balance) || 0,
            settings: data.settings ?? null,
            stats: { followers: followersRes.count || 0, following: followingRes.count || 0 },
        };
    }

    async updateProfile(updates: ProfileUpdate): Promise<UserProfile> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Unauthorized');

        const payload: DbTables['profiles']['Insert'] = { id: user.id, updated_at: new Date().toISOString() };
        if (updates.name !== undefined || updates.username !== undefined) payload.full_name = updates.name || updates.username;
        if (updates.username !== undefined) payload.username = updates.username;
        if (updates.avatar !== undefined) payload.avatar_url = updates.avatar ?? null;
        if (updates.cover_photo !== undefined) {
            const { data: profileData } = await supabase.from('profiles').select('aura_settings').eq('id', user.id).maybeSingle();
            const currentAura = profileData?.aura_settings && typeof profileData.aura_settings === 'object' && !Array.isArray(profileData.aura_settings)
                ? profileData.aura_settings : {};
            payload.aura_settings = { ...currentAura, cover_photo: updates.cover_photo ?? null };
        }
        if (updates.petName !== undefined) payload.pet_name = updates.petName;
        if (updates.bio !== undefined) payload.bio = updates.bio;
        if (updates.default_allow_comments !== undefined) payload.default_allow_comments = updates.default_allow_comments;
        if (updates.default_comment_privacy !== undefined) payload.default_comment_privacy = updates.default_comment_privacy;
        if (updates.comment_filter_words !== undefined) payload.comment_filter_words = updates.comment_filter_words;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.birth_date !== undefined) payload.birth_date = updates.birth_date;
        if (updates.gender !== undefined) payload.gender = updates.gender;
        if (updates.account_status !== undefined) payload.account_status = updates.account_status;

        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) throw error;
        const fresh = await this.getUserProfile(user.id);
        if (!fresh) throw new Error('Profil okunamadı.');
        return fresh;
    }


    // --- DIGITAL PASSPORT (Pets) ---
    async getPets(): Promise<Pet[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data, error } = await supabase.from('pets').select('*').eq('owner_id', user.id).order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching pets:', error);
            return [];
        }
        return (data || []).map(mapPetRow);
    }

    async getActivePet(): Promise<Pet | null> {
        const pets = await this.getPets();
        if (pets.length === 0) return null;
        const user = await this.getSessionUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('active_pet_id').eq('id', user.id).maybeSingle();
            if (data?.active_pet_id) return pets.find(p => p.id === data.active_pet_id) || pets[0];
        }
        return pets[0] || null;
    }

    async setActivePet(id: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;
        const { error } = await supabase.from('profiles').update({ active_pet_id: id }).eq('id', user.id);
        if (error) throw error;
    }

    /** Yeni hayvan (kurulum, "Evcil hayvan ekle"). Tek ekleme; eskiden hata olunca alan düşürerek üç kez deneniyordu. */
    async addPet(pet: Partial<Pet> & { name: string }): Promise<Pet> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        const payload: DbTables['pets']['Insert'] = {
            owner_id: user.id,
            name: pet.name,
            type: pet.type || null,
            breed: pet.breed || null,
            age: pet.age != null && pet.age !== '' ? String(pet.age) : null,
            gender: pet.gender || null,
            avatar_url: pet.image || pet.avatar || null,
            is_neutered: pet.neutered ?? false,
            size: pet.size || null,
            character: pet.character || null,
            birth_date: /^\d{4}-\d{2}-\d{2}$/.test(pet.birthday || '') ? pet.birthday : null,
            birth_date_estimated: !!pet.birth_date_estimated,
            color: pet.color?.trim() || null,
            microchip_no: pet.microchip?.replace(/\s/g, '') || null,
            weight: parseWeight(pet.weight),
            gallery_urls: pet.gallery_urls || [],
            features: pet.features || [],
            sos_settings: (pet.sos_settings as Json | undefined) ?? undefined,
        };
        const { data, error } = await supabase.from('pets').insert(payload).select().single();
        if (error || !data) throw error || new Error('Pet kaydedilemedi');

        const pets = await this.getPets();
        if (pets.length <= 1) await this.setActivePet(data.id);
        return mapPetRow(data);
    }

    async updatePet(id: string, updates: Partial<Pet>): Promise<void> {
        const patch: DbTables['pets']['Update'] = {};
        if (updates.name !== undefined) patch.name = updates.name;
        if (updates.type !== undefined) patch.type = updates.type;
        if (updates.breed !== undefined) patch.breed = updates.breed;
        if (updates.age !== undefined) patch.age = updates.age;
        if (updates.gender !== undefined) patch.gender = updates.gender;
        if (updates.image !== undefined || updates.avatar !== undefined) patch.avatar_url = updates.image || updates.avatar || null;
        if (updates.cover_photo !== undefined) patch.cover_url = updates.cover_photo || null;
        if (updates.neutered !== undefined) patch.is_neutered = updates.neutered;
        if (updates.size !== undefined) patch.size = updates.size;
        if (updates.microchip !== undefined) patch.microchip_no = updates.microchip?.replace(/\s/g, '') || null;
        // Kimlik alanları (Pet Pasaportu → Kimlik Bilgileri); boş değer "girilmedi" demek.
        if (updates.birthday !== undefined) patch.birth_date = /^\d{4}-\d{2}-\d{2}$/.test(updates.birthday || '') ? updates.birthday : null;
        if (updates.color !== undefined) patch.color = updates.color?.trim() || null;
        if (updates.petvet_no !== undefined) patch.petvet_no = updates.petvet_no?.trim() || null;
        if (updates.character !== undefined) patch.character = updates.character;
        if (updates.features !== undefined) patch.features = updates.features;
        if (updates.gallery_urls !== undefined) patch.gallery_urls = updates.gallery_urls;
        if (updates.sos_settings !== undefined) patch.sos_settings = updates.sos_settings as Json;
        if (updates.weight !== undefined) patch.weight = parseWeight(updates.weight);
        if (Object.keys(patch).length === 0) return;
        const { error } = await supabase.from('pets').update(patch).eq('id', id);
        if (error) throw error;
    }

    async deletePet(id: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id);
        if (error) throw error;
        // Albüm satırları hayvanla birlikte silinir; özel depodaki dosyaları da kaldır (kalırsa hesap silinince temizlenir).
        await albumService.removePetFiles(user.id, id).catch(() => {});
    }

    getInboxMessages = async () => {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });
        return data || [];
    };


    // --- MARKETPLACE & COMMERCE ---
    async getProducts(category?: ShopCategory): Promise<ShopProduct[]> {
        let query = supabase.from('products').select('*');
        if (category && (category as string) !== 'Hepsi') {
            query = query.eq('category', category.toLowerCase());
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(mapProductRow);
    }

    async getCart(): Promise<ShopCartItem[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id);

        if (error) return [];

        return (data || []).map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            addedAt: item.created_at || '',
        }));
    }

    async addToCart(productId: string, quantity: number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { error } = await supabase
            .from('cart_items')
            .upsert({ 
                user_id: user.id, 
                product_id: productId, 
                quantity: quantity 
            }, { onConflict: 'user_id,product_id' });

        if (error) throw error;
    }

    async updateCartItem(productId: string, quantity: number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        if (quantity <= 0) {
            await this.removeFromCart(productId);
            return;
        }

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;
    }

    async removeFromCart(productId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
    }

    async clearCart(): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
    }

    async getOrders(): Promise<ShopOrder[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    quantity,
                    price_at_purchase,
                    status,
                    product:products(*)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return [];
        return ((data || []) as unknown as OrderWithItems[]).map(mapOrderRow);
    }


    async getPatiPuanBalance(): Promise<number> {
        const user = await this.getSessionUser();
        if (!user) return 0;
        const { data, error } = await supabase.from('profiles').select('pati_puan_balance').eq('id', user.id).single();
        if (error || !data) return 0;
        return data.pati_puan_balance || 0;
    }


    async getNearbyClinics(province?: string, district?: string, lat?: number | null, lng?: number | null, businessType?: string) {
        // Müşteriye görünen işletmeler: onaylı işletme kartları (8.54, `business_cards`; IBAN/vergi no içermez).
        let query = supabase
            .from('business_cards')
            .select('*')
            .eq('approved', true);

        if (province) {
            query = query.eq('province', province);
        }
        if (district) {
            query = query.eq('district', district);
        }
        if (businessType) {
            query = query.eq('business_type', businessType);
        }

        const { data, error } = await query;

        if (error || !data) {
            console.error("Error fetching nearby businesses:", error);
            return [];
        }
        if (data.length === 0) return [];

        return this.mapClinicProfiles(data, lat ?? null, lng ?? null);
    }

    // Klinik kartı verisi (liste, harita, favoriler, acil) tek yerde üretilir.
    private async mapClinicProfiles(rows: Tables<'business_cards'>[], lat: number | null, lng: number | null) {
        const data = rows.flatMap(r => (r.id ? [{ ...r, id: r.id }] : []));
        const clinicIds = data.map(d => d.id);
        const [{ data: servicesData }, { data: reviewsData }, { data: openData }] = await Promise.all([
            supabase.from('clinic_services').select('clinic_id, service_name').in('clinic_id', clinicIds),
            supabase.from('clinic_reviews').select('clinic_id, rating').in('clinic_id', clinicIds),
            supabase.rpc('get_clinics_open_status', { p_clinic_ids: clinicIds })
        ]);
        const openMap = new Map<string, { is_open: boolean; closes_at: string | null; opens_at: string | null }>(
            (openData || []).map((o) => [o.clinic_id, o])
        );
        
        const servicesMap = new Map<string, string[]>();
        for (const svc of servicesData || []) {
            servicesMap.set(svc.clinic_id, [...(servicesMap.get(svc.clinic_id) || []), svc.service_name]);
        }

        // YENİ 2: Hangi kliniğin kaç puanı olduğunu grupla ve map'te tut
        const reviewsMap = new Map<string, { sum: number; count: number }>();
        for (const r of reviewsData || []) {
            const stats = reviewsMap.get(r.clinic_id) || { sum: 0, count: 0 };
            stats.sum += r.rating;
            stats.count += 1;
            reviewsMap.set(r.clinic_id, stats);
        }

        return data.map((profile) => {
            const cServices = servicesMap.get(profile.id) || [];
            const pLat = profile.lat != null ? Number(profile.lat) : null;
            const pLng = profile.lng != null ? Number(profile.lng) : null;
            
            // YENİ 3: Ortalamayı hesapla
            const rStats = reviewsMap.get(profile.id);
            const avgRating = rStats && rStats.count > 0 ? (rStats.sum / rStats.count) : 0;
            const rCount = rStats ? rStats.count : 0;
            
            let distKm = 999999;
            if (pLat !== null && pLng !== null && lat && lng) {
                distKm = 6371 * Math.acos(
                    Math.sin(lat * Math.PI / 180) * Math.sin(pLat * Math.PI / 180) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) * Math.cos((pLng - lng) * Math.PI / 180)
                );
                if (isNaN(distKm)) distKm = 0;
            }

            return {
                id: profile.id,
                name: profile.name || 'İşletme',
                imageUrl: profile.cover_url || profile.logo_url || null,
                logoUrl: profile.logo_url || null,
                rating: avgRating ? parseFloat(avgRating.toFixed(1)) : 0, // B14
                reviewCount: rCount,
                address: profile.address || 'Adres bilgisi girilmedi',
                location: pLat !== null && pLng !== null ? { lat: pLat, lng: pLng } : null,
                is_premium: false,
                isVerified: profile.approved === true,
                isOpenNow: openMap.get(profile.id)?.is_open === true,
                closesAt: openMap.get(profile.id)?.closes_at || null,
                opensAt: openMap.get(profile.id)?.opens_at || null,
                features: cServices.length > 0 ? cServices : [],
                phone: profile.phone || '',
                distance: pLat !== null && pLng !== null && lat && lng ? `${distKm.toFixed(1)} km` : 'Konum Belirtilmemiş',
                calculated_distance: distKm,
                type: profile.business_type || "vet"
            };
        })
        .sort((a, b) => a.calculated_distance - b.calculated_distance);
    }

    async getClinicDetails(clinicId: string) {
        const { data, error } = await supabase
            .from('business_cards')
            .select('*')
            .eq('id', clinicId)
            .maybeSingle();

        if (error || !data) return null;

        const pLat = data.lat != null ? Number(data.lat) : null;
        const pLng = data.lng != null ? Number(data.lng) : null;

        const reviewsRes = await this.getClinicReviews(clinicId);
        const services = await this.getClinicServices(clinicId);

        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('id, name, title, photo_url')
            .eq('clinic_id', clinicId)
            .eq('is_active', true);

        const doctors = (doctorsData || []).map((d) => ({
            id: d.id,
            name: d.name,
            specialization: d.title,
            imageUrl: d.photo_url,
        }));

        const { data: openData } = await supabase.rpc('get_clinics_open_status', { p_clinic_ids: [clinicId] });
        const openStatus = openData?.[0];
        const dayOrder: [string, string][] = [
            ['monday', 'Pazartesi'], ['tuesday', 'Salı'], ['wednesday', 'Çarşamba'], ['thursday', 'Perşembe'],
            ['friday', 'Cuma'], ['saturday', 'Cumartesi'], ['sunday', 'Pazar']
        ];
        const hours = jsonObj(data.working_hours);
        const weeklyHours = isObject(data.working_hours)
            ? dayOrder.map(([key, label]) => {
                const day = jsonObj(hours[key]) as { open?: string; close?: string; closed?: boolean };
                const closed = !isObject(hours[key]) || day.closed === true;
                return { day: label, text: closed ? 'Kapalı' : `${day.open || '09:00'} – ${day.close || '18:00'}` };
            })
            : [];

        return {
            id: data.id,
            name: data.name || 'İşletme',
            imageUrl: data.logo_url || null,
            rating: reviewsRes.averageRating ? parseFloat(reviewsRes.averageRating.toFixed(1)) : 0,
            reviewCount: reviewsRes.reviews.length || 0,
            address: data.address || 'Adres bilgisi girilmedi',
            location: pLat !== null && pLng !== null ? { lat: pLat, lng: pLng } : null,
            phone: data.phone || '',
            /** İşletme aramayı kapattıysa false (numara sunucuda gizlenir). */
            acceptsCalls: data.accepts_calls !== false,
            type: data.business_type || "vet",
            isOpenNow: openStatus?.is_open === true,
            closesAt: openStatus?.closes_at || null,
            opensAt: openStatus?.opens_at || null,
            weeklyHours,
            services: services,
            about: data.description || null,
            website: data.website || null,
            coverUrl: data.cover_url || null,
            isVerified: data.approved === true,
            gallery: (data.gallery_urls || []).filter(Boolean),
            doctors: doctors,
        };
    }

    async getFavoriteClinicIds(): Promise<string[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase.from('favorite_clinics').select('clinic_id').eq('user_id', user.id);
        return (data || []).map((r) => r.clinic_id);
    }

    async setFavoriteClinic(clinicId: string, favorite: boolean): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Favorilere eklemek için giriş yapmalısın.');
        const { error } = favorite
            ? await supabase.from('favorite_clinics').upsert({ user_id: user.id, clinic_id: clinicId }, { onConflict: 'user_id,clinic_id', ignoreDuplicates: true })
            : await supabase.from('favorite_clinics').delete().eq('user_id', user.id).eq('clinic_id', clinicId);
        if (error) throw error;
    }

    async getClinicsByIds(clinicIds: string[]) {
        if (clinicIds.length === 0) return [];
        const { data, error } = await supabase
            .from('business_cards')
            .select('*')
            .in('id', clinicIds)
            .eq('approved', true);
        if (error || !data) return [];
        return this.mapClinicProfiles(data, null, null);
    }

    async getReminderPrefs(): Promise<{ h24: boolean; h2: boolean; day: boolean }> {
        const user = await this.getSessionUser();
        const fallback = { h24: true, h2: true, day: true };
        if (!user) return fallback;
        const { data } = await supabase.from('profiles').select('reminder_prefs').eq('id', user.id).maybeSingle();
        return { ...fallback, ...(jsonObj(data?.reminder_prefs ?? null) as Partial<typeof fallback>) };
    }

    async setReminderPrefs(prefs: { h24: boolean; h2: boolean; day: boolean }): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase.from('profiles').update({ reminder_prefs: prefs }).eq('id', user.id);
        if (error) throw error;
    }

    async getBusinessProfile(): Promise<BusinessProfileData | null> {
        const data = await this.getActiveBusiness();
        if (!data) return null;
        return {
            businessName: data.name || '',
            about: data.description || '',
            phone: data.phone || '',
            acceptsCalls: data.accepts_calls !== false,
            website: data.website || '',
            address: data.address || '',
            province: data.province || '',
            district: data.district || '',
            lat: data.lat != null ? Number(data.lat) : null,
            lng: data.lng != null ? Number(data.lng) : null,
            logoUrl: data.logo_url || null,
            coverUrl: data.cover_url || null,
            gallery: data.gallery_urls || [],
        };
    }

    async updateBusinessProfile(p: BusinessProfileData): Promise<void> {
        const name = p.businessName.trim();
        if (!name) throw new Error('İşletme adı boş bırakılamaz.');
        await this.updateActiveBusiness({
            name,
            description: p.about.trim() || null,
            phone: p.phone.trim() || null,
            accepts_calls: p.acceptsCalls,
            website: p.website.trim() || null,
            address: p.address.trim() || null,
            province: p.province || null,
            district: p.district || null,
            lat: p.lat,
            lng: p.lng,
            logo_url: p.logoUrl,
            cover_url: p.coverUrl,
            gallery_urls: p.gallery,
        });
    }

    async getMySharedPassports(): Promise<{ id: string; clinicName: string; petName: string; date: string; sharedFields: string[] }[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase
            .from('appointments')
            .select('id, created_at, clinic_id, shared_passport, pet:pets(name)')
            .eq('user_id', user.id)
            .not('shared_passport', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
        const clinicIds = [...new Set((data || []).flatMap(a => (a.clinic_id ? [a.clinic_id] : [])))];
        const { data: clinics } = clinicIds.length
            ? await supabase.from('business_cards').select('id, name').in('id', clinicIds)
            : { data: [] as { id: string | null; name: string | null }[] };
        const names = new Map((clinics || []).map(c => [c.id, c.name || 'İşletme']));
        return (data || []).map(a => {
            const sp = jsonObj(a.shared_passport);
            return {
                id: a.id,
                clinicName: names.get(a.clinic_id) || 'İşletme',
                petName: a.pet?.name || 'Evcil hayvan',
                date: a.created_at ? new Date(a.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '',
                sharedFields: [
                    sp.basic ? 'Temel bilgiler' : null,
                    sp.vaccines ? 'Aşı geçmişi' : null,
                    sp.healthNotes ? 'Sağlık notları' : null,
                    sp.ownerInfo ? 'İletişim bilgileri' : null
                ].filter(Boolean) as string[]
            };
        }).filter(l => l.sharedFields.length > 0);
    }

    async createAppointment(dto: AppointmentRequest) {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        // Çakışma kontrolü veritabanındaki appointments_no_overlap kısıtında; durum her zaman 'pending' başlar.
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                user_id: user.id,
                pet_id: dto.petId || null,
                clinic_id: dto.clinicId,
                clinic_name: dto.clinicName || '',
                doctor_name: dto.doctorName || '',
                doctor_id: dto.doctorId || null,
                appointment_date: dto.appointmentDate,
                reason: dto.notes || '',
                shared_passport: dto.sharedPassport ?? null,
                duration_minutes: dto.duration_minutes || 30
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23P01') {
                throw Object.assign(new Error("Bu saat az önce doldu, lütfen başka bir saat seç."), { code: 'SLOT_TAKEN' });
            }
            throw error;
        }
        return data;
    }

    async getAvailableSlots(clinicId: string, date: string, durationMinutes: number | null, doctorId: string | null): Promise<{ slot_time: string; available: boolean }[]> {
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_clinic_id: clinicId,
            p_date: date,
            p_minutes: durationMinutes ?? undefined,
            p_doctor_id: doctorId ?? undefined
        });
        if (error) throw error;
        return data || [];
    }

    async createBusinessAppointment(input: BusinessAppointmentInput): Promise<string> {
        const { data, error } = await supabase.rpc('create_business_appointment', {
            p_start: input.start,
            p_minutes: input.durationMinutes,
            p_service_name: input.serviceName,
            p_doctor_id: input.doctorId || undefined,
            p_user_id: input.userId || undefined,
            p_pet_id: input.petId || undefined,
            p_guest_name: input.guestName || undefined,
            p_guest_phone: input.guestPhone || undefined,
            p_guest_pet_name: input.guestPetName || undefined,
            p_guest_pet_species: input.guestPetSpecies || undefined,
            p_notes: input.notes || undefined,
            p_ignore_hours: input.ignoreHours === true
        });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
        return data as string;
    }

    async rescheduleAppointment(appointmentId: string, newStart: string, doctorId: string | null, ignoreHours: boolean): Promise<void> {
        const { error } = await supabase.rpc('reschedule_appointment', {
            p_appointment_id: appointmentId,
            p_new_start: newStart,
            p_doctor_id: doctorId ?? undefined,
            p_ignore_hours: ignoreHours
        });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
    }

    async requestReschedule(appointmentId: string, newStart: string): Promise<void> {
        const { error } = await supabase.rpc('request_reschedule', { p_appointment_id: appointmentId, p_new_start: newStart });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
    }

    async respondReschedule(appointmentId: string, accept: boolean): Promise<void> {
        const { error } = await supabase.rpc('respond_reschedule', { p_appointment_id: appointmentId, p_accept: accept });
        if (error) throw new Error(error.message);
    }

    async getVisitSummary(appointmentId: string) {
        const { data, error } = await supabase
            .from('medical_records')
            .select('id, vet_name, diagnosis, critical_notes, weight_kg, temperature_c, medications, cost, created_at')
            .eq('appointment_id', appointmentId)
            .maybeSingle();
        if (error) {
            console.error("Error fetching visit summary:", error);
            return null;
        }
        return data;
    }

    async getCancellationNoticeHours(clinicId: string): Promise<number> {
        const { data } = await supabase.from('business_cards').select('cancellation_notice_hours').eq('id', clinicId).maybeSingle();
        return data?.cancellation_notice_hours || 0;
    }

    async getClinicClients(): Promise<ClinicClient[]> {
        const { data, error } = await supabase.rpc('get_clinic_clients');
        if (error) {
            console.error("Error fetching clinic clients:", error);
            return [];
        }
        return (data || []).map(c => ({ ...c, kind: c.kind === 'guest' ? 'guest' : 'moffi' }));
    }

    async saveClientNote(clinicId: string, clientKey: string, note: string): Promise<void> {
        const { error } = await supabase
            .from('clinic_client_notes')
            .upsert({ clinic_id: clinicId, client_key: clientKey, note, updated_at: new Date().toISOString() });
        if (error) throw error;
    }

    async getClinicCalendar(clinicId: string, fromDate: string, days: number): Promise<{ day: string; is_open: boolean }[]> {
        const { data, error } = await supabase.rpc('get_clinic_calendar', {
            p_clinic_id: clinicId,
            p_from: fromDate,
            p_days: days
        });
        if (error) throw error;
        return data || [];
    }

    async getAppointments(userId: string) {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                pet:pets(*),
                doctor:doctors(name)
            `)
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true });

        if (error) {
            console.error("Error in getAppointments:", error);
            return [];
        }
        // Klinik bilgisi herkese açık işletme kartından (profiles artık sadece sahibine açık).
        const clinicIds = Array.from(new Set((data || []).map((a) => a.clinic_id).filter(Boolean)));
        const clinics = new Map<string, { name: string | null; logo_url: string | null; address: string | null; phone: string | null }>();
        if (clinicIds.length > 0) {
            const { data: cards } = await supabase.from('business_cards')
                .select('id, name, logo_url, address, phone').in('id', clinicIds as string[]);
            for (const c of cards || []) if (c.id) clinics.set(c.id, c);
        }
        return (data || []).map(a => {
            const c = a.clinic_id ? clinics.get(a.clinic_id) : undefined;
            return { ...a, clinic: c ? { business_name: c.name, avatar_url: c.logo_url, address: c.address, phone: c.phone } : null };
        });
    }

    async cancelAppointment(appointmentId: string): Promise<void> {
        // Durum geçişi ve karşı tarafa bildirim sunucudaki transition_appointment içinde.
        const { error } = await supabase.rpc('transition_appointment', {
            p_appointment_id: appointmentId,
            p_status: 'cancelled'
        });
        if (error) throw error;
    }

    async getClinicAppointments(clinicId: string) {
        // İşletme kimliği her zaman uuid; değilse hiç sorgulanmaz (eskiden filtresiz sorgu yapılıyordu).
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId)) return [];
        const query = supabase
            .from('appointments')
            .select(`
                *,
                pet:pets(*),
                user:profiles!appointments_user_id_fkey(full_name, username, avatar_url, phone),
                doctor:doctors(name)
            `)
            .eq('clinic_id', clinicId);

        const { data, error } = await query.order('appointment_date', { ascending: false });

        if (error) {
            console.error("Error in getClinicAppointments:", error);
            return [];
        }
        if (!data) return [];

        return data;
    }

    async getClinicServices(clinicId: string) {
        const { data, error } = await supabase
            .from('clinic_services')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching clinic services:", error);
            return [];
        }
        return data || [];
    }

    async getClinicDoctors(clinicId: string): Promise<Doctor[]> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching clinic doctors:", error);
            return [];
        }
        return data || [];
    }

    async getAllClinicDoctors(clinicId: string): Promise<Doctor[]> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching all clinic doctors:", error);
            return [];
        }
        return data || [];
    }

    async createDoctor(dto: { clinicId: string; name: string; title?: string; photoUrl?: string }): Promise<Doctor> {
        const { data, error } = await supabase
            .from('doctors')
            .insert({
                clinic_id: dto.clinicId,
                name: dto.name,
                title: dto.title || null,
                photo_url: dto.photoUrl || null,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating doctor:", error);
            throw error;
        }
        return data;
    }

    async updateDoctor(id: string, dto: { name?: string; title?: string; photoUrl?: string; isActive?: boolean }): Promise<Doctor> {
        const updateData: DbTables['doctors']['Update'] = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.photoUrl !== undefined) updateData.photo_url = dto.photoUrl;
        if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

        const { data, error } = await supabase
            .from('doctors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Error updating doctor:", error);
            throw error;
        }
        return data;
    }

    // ── Personel daveti (Faz 1c) ──────────────────────────────────────────

    async inviteStaff(businessId: string, email: string, role: string, doctorId?: string): Promise<{ id: string }> {
        const { data, error } = await supabase.rpc('invite_staff', {
            p_business_id: businessId,
            p_email: email,
            p_role: role,
            p_doctor_id: doctorId || undefined
        });
        if (error) throw new Error(error.message);
        return data as { id: string };
    }

    // Davetin gizli anahtarı (token) istemciye hiç verilmez; sadece davetlinin e-postasındaki bağlantıda.
    async getBusinessInvitations(businessId: string) {
        const { data, error } = await supabase
            .from('business_invitations')
            .select('id, business_id, email, role, doctor_id, invited_by, status, accepted_by, expires_at, created_at, doctors(name)')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });
        if (error) { console.error('getBusinessInvitations error:', error); return []; }
        return (data || []).map((inv) => ({
            ...inv,
            doctor_name: inv.doctors?.name || null
        }));
    }

    async cancelInvitation(invitationId: string): Promise<void> {
        const { error } = await supabase.rpc('cancel_staff_invitation', {
            p_invitation_id: invitationId
        });
        if (error) throw new Error(error.message);
    }

    async getInvitationByToken(token: string) {
        const { data, error } = await supabase.rpc('get_invitation_by_token', {
            p_token: token
        });
        if (error) throw new Error(error.message);
        return data;
    }

    async respondInvitation(token: string, accept: boolean) {
        const { data, error } = await supabase.rpc('respond_staff_invitation', {
            p_token: token,
            p_accept: accept
        });
        if (error) throw new Error(error.message);
        return data;
    }

    // Ekip üyelerinin profili başkalarına kapalı (8.46); ad/fotoğraf sunucu fonksiyonundan gelir.
    async getBusinessMembers(businessId: string) {
        const { data, error } = await supabase.rpc('get_business_team', { p_business_id: businessId });
        if (error) { console.error('getBusinessMembers error:', error); return []; }
        return (data || []).map((m) => ({
            business_id: businessId,
            user_id: m.user_id,
            role: m.role,
            doctor_id: m.doctor_id,
            created_at: m.created_at,
            user_name: m.full_name || null,
            user_email: m.email || null,
            user_avatar: m.avatar_url || null,
            doctor_name: m.doctor_name || null
        }));
    }

    async removeBusinessMember(businessId: string, userId: string): Promise<void> {
        const { error } = await supabase.rpc('remove_business_member', {
            p_business_id: businessId,
            p_user_id: userId
        });
        if (error) throw new Error(error.message);
    }

    async getClinicDashboardStats(clinicId: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId);
        if (!isUuid) return { totalBalance: 0, totalPatients: 0, recentPatients: [], appointmentsCount: 0, completedCount: 0, averageRating: 0, reviewCount: 0 };

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*, user:profiles!appointments_user_id_fkey(id, full_name, username, avatar_url, phone)')
            .eq('clinic_id', clinicId)
            .order('appointment_date', { ascending: false });

        if (error || !appointments) {
            return { totalBalance: 0, totalPatients: 0, recentPatients: [], appointmentsCount: 0, completedCount: 0, averageRating: 0, reviewCount: 0 };
        }

        // Bakiye (Balance) calculation
        const totalBalance = appointments
            .filter((a) => a.status === 'confirmed' || a.status === 'completed')
            .reduce((sum: number, a) => sum + (a.payment_amount || 0), 0);

        // Unique Patients
        const uniquePatientIds = new Set<string>();
        const recentPatients: NonNullable<(typeof appointments)[number]['user']>[] = [];
        appointments.forEach((a) => {
            if (a.user_id && !uniquePatientIds.has(a.user_id)) {
                uniquePatientIds.add(a.user_id);
                if (a.user && recentPatients.length < 5) {
                    recentPatients.push(a.user);
                }
            }
        });

        const completedCount = appointments.filter((a) => a.status === 'completed').length;

        // Faz 1 (işletme türü mimarisi) — Dashboard'daki uydurma "Toplam Gösterim"/
        // "Sayfa Tıklaması" (randevu sayısının rastgele katı) yerine gerçek bir
        // ortalama puan gösterebilmek için gerçek clinic_reviews verisi.
        const { data: reviews } = await supabase
            .from('clinic_reviews')
            .select('rating')
            .eq('clinic_id', clinicId);
        const reviewCount = reviews?.length || 0;
        const averageRating = reviewCount > 0
            ? reviews!.reduce((sum: number, r) => sum + (r.rating || 0), 0) / reviewCount
            : 0;

        return {
            totalBalance,
            totalPatients: uniquePatientIds.size,
            recentPatients,
            appointmentsCount: appointments.length,
            completedCount,
            averageRating,
            reviewCount
        };
    }

    // İzinli geçişler ve karşı tarafa bildirim sunucudaki transition_appointment içinde tanımlı.
    async updateAppointmentStatus(appointmentId: string, status: string, reason?: string): Promise<void> {
        const { error } = await supabase.rpc('transition_appointment', {
            p_appointment_id: appointmentId,
            p_status: status,
            p_reason: reason || undefined
        });
        if (error) throw error;
    }

    async updateAttendanceStatus(appointmentId: string, attendanceStatus: 'attended' | 'no_show' | null): Promise<void> {
        const { error } = await supabase.rpc('set_appointment_attendance', {
            p_appointment_id: appointmentId,
            p_attendance: sqlNullable(attendanceStatus)
        });
        if (error) throw error;
    }

    // Bir müşterinin toplam 'gelmedi' (no_show) sayısını döndürür (Faz 9)
    async getNoShowCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('attendance_status', 'no_show');

        if (error) {
            console.error("Error fetching no-show count:", error);
            return 0;
        }
        return count || 0;
    }

    async getClinicSettings(clinicId: string) {
        const [settingsRes, profileRes] = await Promise.all([
            supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId).maybeSingle(),
            supabase.from('business_cards').select('working_hours').eq('id', clinicId).maybeSingle()
        ]);

        if (settingsRes.error) {
            console.error("Error fetching clinic settings:", settingsRes.error);
            return null;
        }

        const data = settingsRes.data;
        if (!data) return null;

        return {
            startTime: data.start_time,
            endTime: data.end_time,
            lunchStart: data.lunch_start,
            lunchEnd: data.lunch_end,
            slotDuration: data.slot_duration,
            working_hours: profileRes.data?.working_hours
        };
    }

    async getClinicExceptions(clinicId: string, startDate?: string, endDate?: string) {
        let query = supabase.from('clinic_schedule_exceptions').select('*').eq('clinic_id', clinicId);
        
        if (startDate) {
            query = query.gte('exception_date', startDate);
        }
        if (endDate) {
            query = query.lte('exception_date', endDate);
        }
        
        const { data, error } = await query.order('exception_date', { ascending: true });
        
        if (error) {
            console.error("Error fetching clinic exceptions:", error);
            return [];
        }
        return data || [];
    }

    async upsertClinicException(clinicId: string, date: string, isClosed: boolean, openTime: string | null = null, closeTime: string | null = null, note: string = ""): Promise<boolean> {
        const { error } = await supabase.from('clinic_schedule_exceptions').upsert({
            clinic_id: clinicId,
            exception_date: date,
            is_closed: isClosed,
            open_time: openTime,
            close_time: closeTime,
            note: note
        }, {
            onConflict: 'clinic_id, exception_date'
        });

        if (error) {
            console.error("Error upserting clinic exception:", error);
            return false;
        }
        return true;
    }

    async deleteClinicException(clinicId: string, date: string): Promise<boolean> {
        const { error } = await supabase.from('clinic_schedule_exceptions')
            .delete()
            .eq('clinic_id', clinicId)
            .eq('exception_date', date);

        if (error) {
            console.error("Error deleting clinic exception:", error);
            return false;
        }
        return true;
    }

    // --- FAZ 7: CLINIC REVIEWS ---
    async getClinicReviews(clinicId: string) {
        const { data, error } = await supabase
            .from('clinic_reviews')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching clinic reviews:", error);
            return { reviews: [], averageRating: 0 };
        }

        const reviews = data || [];
        
        // Fetch user profiles manually to avoid PostgREST relationship ambiguity
        const userIds = [...new Set(reviews.flatMap(r => (r.user_id ? [r.user_id] : [])))];
        const profilesMap = new Map<string, { full_name: string | null; username: string | null; avatar_url: string | null }>();
        if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url').in('id', userIds);
            for (const p of profiles || []) if (p.id) profilesMap.set(p.id, p);
        }

        const averageRating = reviews.length > 0 
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
            : 0;

        return { 
            reviews: reviews.map((r) => ({
                id: r.id,
                clinic_id: r.clinic_id,
                user_id: r.user_id,
                appointment_id: r.appointment_id,
                rating: r.rating,
                comment: r.comment,
                clinic_reply: r.clinic_reply,
                clinic_replied_at: r.clinic_replied_at,
                created_at: r.created_at,
                user: (() => {
                    const prof = r.user_id ? profilesMap.get(r.user_id) : undefined;
                    return {
                        name: r.user_id ? (prof?.full_name || prof?.username || 'Gizli Kullanıcı') : 'Silinmiş kullanıcı',
                        avatar: prof?.avatar_url || null,
                    };
                })()
            })), 
            averageRating 
        };
    }

    async submitReview(clinicId: string, appointmentId: string, rating: number, comment?: string): Promise<boolean> {
        const user = await this.getSessionUser();
        if (!user) return false;

        const { error } = await supabase
            .from('clinic_reviews')
            .insert({
                clinic_id: clinicId,
                user_id: user.id,
                appointment_id: appointmentId,
                rating,
                comment
            });

        if (error) {
            console.error("Error submitting review:", error);
            return false;
        }
        return true;
    }

    async getReviewableAppointments(userId: string) {
        // Fetch confirmed appointments in the past
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['confirmed', 'completed'])
            .lt('appointment_date', new Date().toISOString())
            .order('appointment_date', { ascending: false });

        if (aptError) {
            console.error("Error fetching reviewable appointments:", aptError);
            return [];
        }
        
        if (!appointments || appointments.length === 0) return [];

        // Fetch their reviews
        const aptIds = appointments.map((a) => a.id);
        const { data: reviews } = await supabase.from('clinic_reviews').select('appointment_id').in('appointment_id', aptIds);
        const reviewedAptIds = new Set((reviews || []).map((r) => r.appointment_id));

        // Filter out reviewed ones
        const reviewable = appointments.filter((a) => !reviewedAptIds.has(a.id));
        
        if (reviewable.length === 0) return [];
        
        // Enrich with clinic info
        const clinicIds = [...new Set(reviewable.flatMap(a => (a.clinic_id ? [a.clinic_id] : [])))];
        const { data: clinics } = await supabase.from('business_cards').select('id, name, logo_url').in('id', clinicIds);
        const clinicMap = new Map<string, { name: string | null; logo_url: string | null }>();
        for (const c of clinics || []) if (c.id) clinicMap.set(c.id, c);

        return reviewable.map(a => {
            const c = a.clinic_id ? clinicMap.get(a.clinic_id) : undefined;
            return { ...a, clinic: c ? { name: c.name || 'Klinik', avatar_url: c.logo_url } : { name: 'Klinik', avatar_url: null } };
        });
    }

    async replyToReview(reviewId: string, clinicId: string, replyText: string): Promise<boolean> {
        const { error } = await supabase
            .from('clinic_reviews')
            .update({
                clinic_reply: replyText,
                clinic_replied_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .eq('clinic_id', clinicId);

        if (error) {
            console.error("Error replying to review:", error);
            return false;
        }
        return true;
    }


    async saveClinicSettings(clinicId: string, settings: ClinicSettingsInput): Promise<void> {
        const { error } = await supabase
            .from('clinic_settings')
            .upsert({
                clinic_id: clinicId,
                start_time: settings.startTime,
                end_time: settings.endTime,
                lunch_start: settings.lunchStart,
                lunch_end: settings.lunchEnd,
                slot_duration: settings.slotDuration,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }

    // --- BESLENME PLANLARI ---
    async getNutritionPlan(petId: string) {
        const { data, error } = await supabase
            .from('nutrition_plans')
            .select('*')
            .eq('pet_id', petId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return {
            petId: data.pet_id,
            dailyCalories: data.daily_calories,
            foodType: data.food_type,
            feedingTimes: data.feeding_times || [],
            notes: data.notes,
            vetApproved: !!data.vet_approved
        };
    }

    async updateNutritionPlan(petId: string, plan: NutritionPlanInput): Promise<void> {
        const { error } = await supabase
            .from('nutrition_plans')
            .upsert({
                pet_id: petId,
                daily_calories: plan.dailyCalories,
                food_type: plan.foodType,
                feeding_times: plan.feedingTimes || [],
                notes: plan.notes,
                updated_at: new Date().toISOString()
            }, { onConflict: 'pet_id' });

        if (error) throw error;
    }

    // --- YÜRÜYÜŞ TAKİBİ ---
    // walk_sessions'a istemci doğrudan yazamaz; başlat/nokta ekle/bitir sunucu fonksiyonlarıyla.
    // Mesafe sunucuda gelen noktalardan hesaplanır (25 km/sa üstü sıçramalar sayılmaz).
    // startedAt: çevrimdışı başlayıp sonradan bağlanan yürüyüşün gerçek başlangıcı.
    async startWalk(petId?: string, startedAt?: number): Promise<{ id: string }> {
        const { data, error } = await supabase.rpc('start_walk_session', {
            p_pet_id: petId ?? undefined,
            p_started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
        });
        if (error) throw error;
        return data;
    }

    async discardWalk(sessionId: string): Promise<void> {
        const { error } = await supabase.rpc('discard_walk', { p_session_id: sessionId });
        if (error) throw error;
    }

    async appendWalkPoints(sessionId: string, points: WalkPoint[]): Promise<void> {
        const { error } = await supabase.rpc('append_walk_points', { p_session_id: sessionId, p_points: points as unknown as Json });
        if (error) throw error;
    }

    async finishWalk(sessionId: string, data: { activeSeconds: number; steps: number; points?: WalkPoint[]; endAtLastPoint?: boolean }) {
        const { data: row, error } = await supabase.rpc('finish_walk', {
            p_session_id: sessionId,
            p_active_seconds: Math.max(0, Math.round(data.activeSeconds)),
            p_steps: data.steps > 0 ? Math.round(data.steps) : undefined,
            p_points: (data.points ?? []) as unknown as Json,
            p_end_at_last_point: !!data.endAtLastPoint,
        });
        if (error) throw error;
        return row;
    }

    // Piyasa araştırması #6: yürüyüş sırasında/sonrasında gerçek fotoğraf ekleme
    // (Walkies/MyDoggy gibi köpek-yürüyüşü uygulamalarının ana özelliği).
    // `walk-photos` bucket'ına kullanıcının KENDİ klasörüne (RLS policy'si bunu
    // zorunlu kılıyor) yükleyip, dönen public URL'i walk_sessions.photo_urls
    // dizisine ekliyor — anında commit ediliyor (yürüyüş bitmeden uygulama
    // kapansa bile fotoğraf kaybolmaz, yürüyüş noktalarıyla aynı dayanıklılık
    // deseni).
    async uploadWalkPhoto(sessionId: string, original: File): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const file = await shrinkForUpload(original);

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${sessionId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('walk-photos')
            .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('walk-photos').getPublicUrl(path);
        const url = publicUrlData.publicUrl;

        const { error: updateError } = await supabase.rpc('add_walk_photo', { p_session_id: sessionId, p_url: url });
        if (updateError) throw updateError;

        return url;
    }

    // Piyasa araştırması #4: Strava Beacon tarzı canlı konum paylaşımı. `walk_beacons`
    // BİLEREK `walk_sessions`'tan ayrı, minimal bir tablo (bkz. migration notu) —
    // genele SADECE tek nokta anlık konum açılıyor, GPS geçmişi/rotası değil.
    async startBeacon(sessionId: string, petName: string, lat: number, lng: number): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { data, error } = await supabase
            .from('walk_beacons')
            .insert({ session_id: sessionId, user_id: user.id, pet_name: petName, lat, lng })
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    }

    async updateBeaconLocation(beaconId: string, lat: number, lng: number): Promise<void> {
        await supabase.from('walk_beacons').update({ lat, lng, updated_at: new Date().toISOString() }).eq('id', beaconId);
    }

    async stopBeacon(beaconId: string): Promise<void> {
        await supabase.from('walk_beacons').delete().eq('id', beaconId);
    }

    // Oturumsuz da çalışır (bkz. /beacon/[id]). Tablo herkese kapalı; bağlantıdaki kimliği bilen
    // sadece o tek, süresi dolmamış kaydı okuyabilir.
    async getBeacon(beaconId: string): Promise<{ lat: number; lng: number; petName: string | null; updatedAt: string; expiresAt: string } | null> {
        const { data, error } = await supabase.rpc('get_walk_beacon', { p_beacon_id: beaconId });
        const row = Array.isArray(data) ? data[0] : null;
        if (error || !row) return null;
        return { lat: row.lat, lng: row.lng, petName: row.pet_name, updatedAt: row.updated_at, expiresAt: row.expires_at };
    }

    async getWalkHistory(userId: string, limit: number = 10) {
        const user = await this.getSessionUser();
        if (!user) return [];

        // pet:pets(...) embed'i kullanılmaz (walk_sessions.pet_id text, FK yok). Liste tam rotayı değil
        // 60 noktalık önizlemeyi çeker; süre/adım/kalori finish_walk'ın sakladığı gerçek değerlerdir.
        const { data, error } = await supabase
            .from('walk_sessions')
            .select('id, pet_id, start_time, end_time, distance_meters, active_seconds, steps, calories_kcal, route_preview, start_lat, start_lng, photo_urls')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('end_time', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("getWalkHistory error:", error);
            return [];
        }
        return (data || []).map((w) => ({
            ...w,
            ended_at: w.end_time,
            started_at: w.start_time,
            duration_minutes: Math.round(walkActiveSeconds(w) / 60),
            path_coordinates: w.route_preview || [],
        }));
    }

    async getWalkStats(userId: string) {
        const user = await this.getSessionUser();
        if (!user) return {};

        const { data, error } = await supabase
            .from('walk_sessions')
            .select('distance_meters, start_time, end_time, active_seconds, steps, calories_kcal')
            .eq('user_id', user.id)
            .eq('status', 'completed');

        if (error || !data) return {};

        // Faz 8: seri kalkanıyla "affedilmiş" günler de yürüyüş yapılmış gibi sayılır
        const { data: shieldRows } = await supabase
            .from('streak_shield_uses')
            .select('covered_date')
            .eq('user_id', user.id);
        const shieldedDates = new Set((shieldRows || []).map(r => r.covered_date));

        const totalDistance = data.reduce((s, w) => s + Number(w.distance_meters || 0), 0);
        const totalDuration = data.reduce((s, w) => s + walkActiveSeconds(w), 0);
        const totalCalories = data.reduce((s, w) => s + (w.calories_kcal || 0), 0);
        const totalSteps = data.reduce((s, w) => s + (w.steps || 0), 0);

        // Faz 8 düzeltmesi: tarih karşılaştırması artık kullanıcının YEREL takvim
        // gününe göre yapılıyor (öncesinde end_time'ın UTC ISO string'i doğrudan
        // startsWith ile karşılaştırılıyordu — gece yarısına yakın yürüyüşlerde
        // UTC/yerel gün kayması yüzünden seri hatalı kırılabiliyordu).
        const toLocalDateStr = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        const walkedDates = new Set(
            data.flatMap(w => (w.end_time ? [toLocalDateStr(new Date(w.end_time))] : []))
        );
        for (const sd of shieldedDates) walkedDates.add(sd);

        // Faz 8 düzeltmesi: en iyi seri artık ilk boşlukta durup bırakmıyor,
        // son 365 günün tamamını tarayıp gerçek en uzun aralığı buluyor.
        let currentStreak = 0;
        let bestStreak = 0;
        let runningStreak = 0;
        let streakBroken = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < 365; d++) {
            const checkDate = new Date(today.getTime() - d * 86400000);
            const hasWalk = walkedDates.has(toLocalDateStr(checkDate));

            if (hasWalk) {
                runningStreak++;
                bestStreak = Math.max(bestStreak, runningStreak);
                if (!streakBroken) currentStreak = runningStreak;
            } else {
                runningStreak = 0;
                if (d === 0) {
                    // Bugün henüz yürünmemiş olabilir, bu seriyi kırmaz — sadece bugünü sayma
                    continue;
                }
                streakBroken = true;
            }
        }

        // Faz 9: /walk sayfası bunu okuyordu ama hiç hesaplanmıyordu (her zaman
        // 0.0 km gösteriyordu, ?? 0 fallback'i sessizce yanlış değeri gizliyordu)
        const longestWalkKm = data.length ? Math.max(...data.map(w => w.distance_meters || 0)) / 1000 : 0;

        return {
            totalWalks: data.length,
            totalDistanceKm: Math.round(totalDistance / 100) / 10,
            totalDurationMinutes: Math.round(totalDuration / 60),
            totalCalories,
            totalSteps,
            averageDistanceKm: data.length ? Math.round(totalDistance / data.length / 100) / 10 : 0,
            longestWalkKm: Math.round(longestWalkKm * 10) / 10,
            currentStreak,
            bestStreak
        };
    }

    // Faz 8: gerçek seri kalkanı durumu (haftalık otomatik yenileme dahil, salt-okunur)
    async getStreakShieldStatus(): Promise<{ available: boolean }> {
        const user = await this.getSessionUser();
        if (!user) return { available: false };
        const { data, error } = await supabase
            .from('profiles')
            .select('streak_shield_available, streak_shield_week_start')
            .eq('id', user.id)
            .single();
        if (error || !data) return { available: false };

        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        const y = monday.getFullYear(), m = String(monday.getMonth() + 1).padStart(2, '0'), d = String(monday.getDate()).padStart(2, '0');
        const currentWeekStart = `${y}-${m}-${d}`;

        if (data.streak_shield_week_start !== currentWeekStart) return { available: true };
        return { available: !!data.streak_shield_available };
    }

    // Faz 8: seri kalkanını gerçekten kullan — sunucu tarafında doğrulanıyor
    // (o gün gerçekten yürüyüş yoksa VE kalkan gerçekten müsaitse kaydediliyor)
    async useStreakShield(coveredDate: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('use_streak_shield', { p_covered_date: coveredDate });
        if (error) throw error;
        return !!data;
    }

    async getWalkById(id: string) {
        // Faz 10 kontrolü: `pet:pets(...)` embed'i kaldırıldı — walk_sessions.pet_id
        // text tipinde ve pets tablosuna gerçek bir FK constraint'i hiç yok (aynı kök
        // neden getVetAdvices()'teki PGRST200 hatasıyla — bkz. CLAUDE.md Bölüm 9).
        // Bu sorgu embed olmadan tek başına çalışır; pet bilgisi çağıran taraf
        // (usePet() context'i) üzerinden zaten elde ediliyor.
        const user = await this.getSessionUser();
        if (!user) return null;
        const { data, error } = await supabase
            .from('walk_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !data) return null;
        return { ...data, ended_at: data.end_time, started_at: data.start_time };
    }


    // --- FINANCE / TRANSACTIONS ---


    async getFollowers(userId: string): Promise<ProfileSummary[]> {
        const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (followsError || !followsData || followsData.length === 0) return [];

        const followerIds = followsData.map(f => f.follower_id);

        const { data: profilesData, error: profilesError } = await supabase
            .from('profile_cards')
            .select('*')
            .in('id', followerIds);

        if (profilesError || !profilesData) return [];

        return profilesData.map(mapProfileSummary);
    }

    async getFollowing(userId: string): Promise<ProfileSummary[]> {
        const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (followsError || !followsData || followsData.length === 0) return [];

        const followingIds = followsData.map(f => f.following_id);

        const { data: profilesData, error: profilesError } = await supabase
            .from('profile_cards')
            .select('*')
            .in('id', followingIds);

        if (profilesError || !profilesData) return [];

        return profilesData.map(mapProfileSummary);
    }
    // --- CHAT & MESSAGING (Real-time Supabase) ---
    // --- Mesajlaşma -------------------------------------------------------------------------------------------------
    // Aynı iki kişi arasında geçmişte birden fazla sohbet kaydı açılmış olabilir (ör. kayıp ilanından gelen sohbet ile
    // normal sohbet). Okurken hepsi tek konuşma olarak birleştirilir, yazarken en güncel kayda yazılır.

    /** Karşı tarafla aradaki sohbet kayıtları, en güncel önce. */
    async chatConversationIds(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox'): Promise<string[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        let q = supabase
            .from('conversations')
            .select('id, last_message_at')
            .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
            .order('last_message_at', { ascending: false, nullsFirst: false });
        q = scope === 'clinic' ? q.eq('context_type', 'clinic') : q.neq('context_type', 'clinic');
        const { data } = await q;
        return (data || []).map((c) => c.id);
    }

    /** Sohbet başlığı için karşı tarafın görünen adı ve fotoğrafı (daha önce hiç yazışılmamış olsa da). */
    async getChatPartner(userId: string): Promise<{ userId: string; partnerName: string; avatar: string | null; isBusiness: boolean } | null> {
        const { data } = await supabase.from('profile_cards').select('id, username, full_name, business_name, role, avatar_url').eq('id', userId).maybeSingle();
        if (!data) return null;
        return { userId, partnerName: chatDisplayName(data), avatar: data.avatar_url || null, isBusiness: data.role === 'business' };
    }

    async getChatConversations(scope: 'inbox' | 'clinic' = 'inbox') {
        const user = await this.getSessionUser();
        if (!user) return [];

        let query = supabase
            .from('conversations')
            .select('id, last_message, last_message_at, participant_1, participant_2')
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });
        query = scope === 'clinic' ? query.eq('context_type', 'clinic') : query.neq('context_type', 'clinic');
        const { data, error } = await query;
        if (error || !data) { if (error) console.error('getChatConversations error:', error); return []; }

        // Kişi başına tek satır (en güncel sohbet kaydı), aynı kişinin diğer kayıtları birleştirilir.
        type ConvRow = (typeof data)[number];
        const byPartner = new Map<string, { ids: string[]; conv: ConvRow }>();
        for (const conv of data) {
            const other = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            if (!other || other === user.id) continue;
            const entry = byPartner.get(other);
            if (entry) entry.ids.push(conv.id); else byPartner.set(other, { ids: [conv.id], conv });
        }
        const partnerIds = Array.from(byPartner.keys());
        const allIds = Array.from(byPartner.values()).flatMap(e => e.ids);
        if (!partnerIds.length) return [];

        // Tek sorguda profiller, tek sorguda okunmamışlar ve son mesajlar (her kayıt için ayrı sorgu yok).
        const [{ data: profiles }, { data: unreadRows }, { data: lastRows }, { data: prefRows }, { data: requestRows }] = await Promise.all([
            supabase.from('profile_cards').select('id, username, full_name, business_name, role, avatar_url').in('id', partnerIds),
            supabase.from('messages').select('conversation_id').in('conversation_id', allIds).eq('is_read', false).neq('sender_id', user.id).limit(1000),
            supabase.from('messages').select('conversation_id, sender_id, content, attachment_url, is_deleted, created_at').in('conversation_id', allIds)
                .order('created_at', { ascending: false }).limit(Math.min(1000, allIds.length * 3)),
            supabase.from('conversation_prefs').select('conversation_id, muted, cleared_at').in('conversation_id', allIds),
            scope === 'inbox' ? supabase.rpc('get_chat_request_ids') : Promise.resolve({ data: [] as string[] }),
        ]);
        // Tanımadığın birinden gelen ilk mesajlar "istek" (sunucu karar verir). Aynı kişiyle istek olmayan bir kayıt
        // da varsa (ör. kayıp ilanı sohbeti) konuşma normal sayılır.
        const requestIds = new Set<string>(((requestRows as string[] | null) || []).map(String));
        const prefByConv = new Map((prefRows || []).map((p) => [p.conversation_id, p]));
        const profileById = new Map((profiles || []).map((p) => [p.id, p]));
        const unreadByConv = new Map<string, number>();
        for (const r of unreadRows || []) if (r.conversation_id) unreadByConv.set(r.conversation_id, (unreadByConv.get(r.conversation_id) || 0) + 1);
        type LastRow = NonNullable<typeof lastRows>[number];
        const lastByConv = new Map<string, LastRow>();
        for (const r of lastRows || []) if (r.conversation_id && !lastByConv.has(r.conversation_id)) lastByConv.set(r.conversation_id, r);

        const rows = partnerIds.flatMap(other => {
            const { ids, conv } = byPartner.get(other)!;
            const p = profileById.get(other);
            const pref = prefByConv.get(conv.id);
            const last = ids.flatMap(i => { const r = lastByConv.get(i); return r ? [r] : []; })
                .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
            const at = last?.created_at || conv.last_message_at;
            // Kendinden temizlenmiş ve sonra yeni mesaj gelmemiş sohbet listede görünmez.
            if (pref?.cleared_at && (!at || at <= pref.cleared_at)) return [];
            const unreadCount = ids.reduce((n, i) => n + (unreadByConv.get(i) || 0), 0);
            const preview = last
                ? (last.is_deleted ? 'Mesaj geri alındı' : last.content || (last.attachment_url ? '📷 Fotoğraf' : ''))
                : (conv.last_message || '');
            return [{
                muted: !!pref?.muted,
                isRequest: ids.every(i => requestIds.has(i)),
                userId: other,
                partnerName: chatDisplayName(p),
                avatar: p?.avatar_url || null,
                isBusiness: p?.role === 'business',
                latestMessage: preview,
                latestAt: at,
                latestTime: at ? this.formatTimeAgo(at) : '',
                sentByMe: last ? last.sender_id === user.id : false,
                unread: unreadCount > 0,
                unreadCount,
                online: false,
                messages: [],
                conversationId: conv.id,
                conversationIds: ids,
            }];
        });
        return rows.sort((a, b) => (b.latestAt || '').localeCompare(a.latestAt || ''));
    }

    /** Sohbetin son mesajları (en eski önce). `before` verilirse o andan önceki sayfa. */
    async getChatMessages(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox', before?: string | null, limit = 50) {
        const user = await this.getSessionUser();
        if (!user) return [];
        const ids = await this.chatConversationIds(otherUserId, scope);
        if (!ids.length) return [];
        let q = supabase.from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: false }).limit(limit);
        if (before) q = q.lt('created_at', before);
        // "Sohbeti temizle" yalnızca kendi görünümünü temizler: o andan önceki mesajlar gelmez.
        const { data: prefs } = await supabase.from('conversation_prefs').select('cleared_at').in('conversation_id', ids).not('cleared_at', 'is', null);
        const cleared = (prefs || []).map((p) => p.cleared_at).sort().pop();
        if (cleared) q = q.gt('created_at', cleared);
        const { data, error } = await q;
        if (error || !data) { if (error) console.error('getChatMessages error:', error); return []; }
        const msgs = data.reverse().map((msg) => mapChatMessage(msg, user.id, msg.created_at ? this.formatTimeAgo(msg.created_at) : ''));
        if (msgs.length) {
            const { data: reactions } = await supabase.from('message_reactions').select('message_id, user_id, emoji').in('message_id', msgs.map(m => m.id));
            const byMsg = new Map<string, { userId: string; emoji: string }[]>();
            (reactions || []).forEach((r) => byMsg.set(r.message_id, [...(byMsg.get(r.message_id) || []), { userId: r.user_id, emoji: r.emoji }]));
            msgs.forEach(m => { m.reactions = byMsg.get(m.id) || []; });
        }
        return msgs;
    }

    // Mesaj yazma işlemlerinin hepsi sunucu fonksiyonlarıyla (engel, uzunluk, hız sınırı ve ek kontrolü orada).
    async sendChatMessage(otherUserId: string, content: string, scope: 'inbox' | 'clinic' = 'inbox', associatedAdId?: string, attachmentUrl?: string, replyTo?: string): Promise<{ id: string; createdAt: string } | void> {
        const { data, error } = await supabase.rpc('send_chat_message', {
            p_receiver: otherUserId,
            p_content: content,
            p_attachment: attachmentUrl || undefined,
            p_clinic: scope === 'clinic',
            p_ad: associatedAdId || undefined,
            p_reply_to: replyTo || undefined,
        });
        if (error) throw new Error(error.message || 'Mesaj gönderilemedi.');
        const row = Array.isArray(data) ? data[0] : data;
        return row ? { id: row.id, createdAt: row.created_at } : undefined;
    }

    async markChatAsRead(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox'): Promise<void> {
        await supabase.rpc('mark_chat_read', { p_other: otherUserId, p_clinic: scope === 'clinic' });
    }

    /** Mesajı "geri alındı" yapar: metin ve fotoğraf kaldırılır, karşı taraf da geri alındığını görür. */
    async recallChatMessage(messageId: string): Promise<void> {
        const { error } = await supabase.rpc('recall_chat_message', { p_id: messageId });
        if (error) throw new Error(error.message || 'Mesaj geri alınamadı.');
    }

    /** Aynı emojiye tekrar basmak tepkiyi kaldırır. Dönen değer: güncel tepki (yoksa null). */
    async toggleMessageReaction(messageId: string, emoji: string): Promise<string | null> {
        const { data, error } = await supabase.rpc('toggle_message_reaction', { p_message: messageId, p_emoji: emoji });
        if (error) throw new Error(error.message || 'Tepki verilemedi.');
        return (data as string | null) ?? null;
    }

    /** Sessize alma (bildirim ve sayaç dışı) ve sohbeti kendinden temizleme. */
    async setConversationPref(otherUserId: string, pref: { muted?: boolean; clear?: boolean }, scope: 'inbox' | 'clinic' = 'inbox'): Promise<void> {
        const { error } = await supabase.rpc('set_conversation_pref', {
            p_other: otherUserId, p_muted: pref.muted ?? undefined, p_clear: !!pref.clear, p_clinic: scope === 'clinic',
        });
        if (error) throw new Error(error.message || 'Ayar kaydedilemedi.');
    }

    /** Mesaj isteğini kabul eder: sohbet normal kutuya geçer, okundu bilgisi gitmeye başlar. */
    async acceptChatRequest(otherUserId: string): Promise<void> {
        const { error } = await supabase.rpc('accept_chat_request', { p_other: otherUserId });
        if (error) throw new Error(error.message || 'İstek kabul edilemedi.');
    }

    async uploadMedia(original: File, bucket: 'posts' | 'stories' | 'avatars' | 'sounds' = 'posts', onProgress?: (percent: number) => void): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        // Görseller yüklemeden önce telefonda küçültülür (depolama/trafik maliyeti; lib/media/compress).
        const file = await shrinkForUpload(original);
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;

        // Simulated Progress since standard Supabase upload is a single fetch
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 92) {
                clearInterval(progressInterval);
            } else if (onProgress) {
                onProgress(Math.floor(progress));
            }
        }, 200);

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, { cacheControl: '3600', upsert: false });

            clearInterval(progressInterval);
            if (onProgress) onProgress(100);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (err) {
            clearInterval(progressInterval);
            throw err;
        }
    }

    async globalSearch(query: string) {
        if (!query || query.length < 2) return { profiles: [], posts: [], pets: [] };

        const [profilesRes, postsRes, petsRes] = await Promise.all([
            supabase.from('profile_cards').select('*').or(`username.ilike.%${query}%,full_name.ilike.%${query}%`).limit(10),
            supabase.from('posts').select('*').ilike('content', `%${query}%`).limit(10),
            // Sadece herkese açık kart alanları (pet_cards); eskiden var olmayan pet_id kolonu yüzünden hep boş dönüyordu.
            supabase.from('pet_cards').select('id, name, type, breed, avatar_url, owner_id').ilike('name', `%${query}%`).limit(10)
        ]);

        return {
            profiles: (profilesRes.data || []).map(p => ({
                id: p.id,
                name: p.full_name || p.username,
                username: p.username,
                avatar: p.avatar_url,
                type: 'user'
            })),
            posts: (postsRes.data || []).map(p => ({
                id: p.id,
                desc: p.content,
                media: p.media_url,
                type: 'post'
            })),
            pets: (petsRes.data || []).map(p => ({
                id: p.id,
                name: p.name,
                breed: p.breed,
                owner_id: p.owner_id,
                image: p.avatar_url,
                type: 'pet'
            }))
        };
    }


    async addProduct(product: Partial<ShopProduct> & { name: string; price: number }): Promise<ShopProduct> {
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: product.name,
                description: product.description || '',
                price: product.price,
                old_price: product.oldPrice || null,
                image_url: product.image || null,
                category: product.category || 'food',
                is_prime_only: product.isPrimeOnly || false,
                // Stok girilmediyse 0 (eskiden uydurma 10 adet yazılıyordu).
                stock: product.stockCount ?? 0,
                is_vet_approved: product.isVetApproved || false,
                tag: product.tag || null,
                owner_id: product.ownerId || null,
            })
            .select()
            .single();
        if (error) throw error;
        return mapProductRow(data);
    }

    async updateProduct(id: string, product: Partial<ShopProduct>): Promise<ShopProduct> {
        const patch: DbTables['products']['Update'] = {};
        if (product.name !== undefined) patch.name = product.name;
        if (product.description !== undefined) patch.description = product.description;
        if (product.price !== undefined) patch.price = product.price;
        if (product.oldPrice !== undefined) patch.old_price = product.oldPrice;
        if (product.image !== undefined) patch.image_url = product.image;
        if (product.category !== undefined) patch.category = product.category;
        if (product.isPrimeOnly !== undefined) patch.is_prime_only = product.isPrimeOnly;
        if (product.stockCount !== undefined) patch.stock = product.stockCount;
        if (product.isVetApproved !== undefined) patch.is_vet_approved = product.isVetApproved;
        if (product.tag !== undefined) patch.tag = product.tag;
        if (product.ownerId !== undefined) patch.owner_id = product.ownerId;
        const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
        if (error) throw error;
        return mapProductRow(data);
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async updateOrderTracking(orderId: string, trackingNumber: string, carrier: string): Promise<void> {
        const { error } = await supabase.rpc('set_order_tracking', {
            p_order_id: orderId,
            p_tracking_number: trackingNumber,
            p_carrier: carrier
        });
        if (error) throw error;
    }

    async updateOrderStatus(orderId: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        if (error) throw error;
    }

    async getAllOrders(): Promise<ShopOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    quantity,
                    price_at_purchase,
                    product:products(*)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) return [];
        return ((data || []) as unknown as OrderWithItems[]).map(mapOrderRow);
    }


    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return 'Şimdi';
        if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
        return `${Math.floor(diff / 86400)} gün`;
    }


    // Daily Star Pet (Yıldız Patiler) Supabase Implementations
    async getAllPetsAdmin(): Promise<(Pet & { profiles: { full_name: string | null; username: string | null } | null })[]> {
        const { data, error } = await supabase
            .from('pets')
            .select('*, profiles(full_name, username)')
            .order('created_at', { ascending: false });
        if (error) {
            console.error("getAllPetsAdmin:", error);
            throw error;
        }
        return (data || []).map(({ profiles, ...row }) => ({
            ...mapPetRow(row as Tables<'pets'>),
            profiles: (Array.isArray(profiles) ? profiles[0] : profiles) ?? null,
        }));
    }

    /** Adaylar: son 7 günde en çok yürüyen hayvanlar (sunucu tüm yürüyüşleri görür; uydurma puan yok). */
    async getDailyStarCandidates(): Promise<DailyStarCandidate[]> {
        const { data, error } = await supabase.rpc('admin_daily_star_candidates', { p_limit: 10 });
        if (error) {
            console.error("getDailyStarCandidates:", error);
            throw error;
        }
        return (data || []).map(c => ({
            id: c.pet_id,
            name: c.name,
            breed: c.breed || 'Karışık',
            image: c.avatar_url || '',
            ownerName: c.owner_username || 'Moffi üyesi',
            weekKm: Number(c.week_km) || 0,
            walks: c.walks,
        }));
    }

    /** O günün yayınlanmış yıldızları (yalnızca yöneticinin kaydettiği; boş sıra otomatik doldurulmaz). */
    async getDailyStars(dateString: string): Promise<DailyStar[]> {
        const { data, error } = await supabase.from('daily_stars').select('*').eq('date', dateString).order('rank');
        if (error) {
            console.warn("daily_stars okunamadı:", error);
            return [];
        }
        // Hayvan bilgisi herkese açık kartlardan (pets tablosu sadece sahibine açık).
        const starPetIds = Array.from(new Set((data || []).map(d => d.pet_id)));
        const cards = starPetIds.length > 0 ? await this.getPublicPetCards({ ids: starPetIds }) : [];
        return (data || []).map(found => {
            const card = cards.find(c => c.id === found.pet_id);
            return { ...found, pet: card ? { name: card.name, image: card.avatar_url, breed: card.breed } : null };
        });
    }

    async setDailyStar(dateString: string, rank: number, petId: string, details: { title: string; description: string; badge: string; media_url: string }): Promise<void> {
        try {
            const payload = {
                pet_id: petId,
                date: dateString,
                rank: rank,
                title: details.title,
                description: details.description,
                badge: details.badge,
                media_url: details.media_url,
                status: 'published',
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('daily_stars')
                .upsert(payload, { onConflict: 'date,rank' });

            if (error) throw error;
        } catch (err) {
            console.error("setDailyStar:", err);
            throw err;
        }
    }

    async removeDailyStar(dateString: string, rank: number): Promise<void> {
        try {
            const { error } = await supabase
                .from('daily_stars')
                .delete()
                .eq('date', dateString)
                .eq('rank', rank);

            if (error) throw error;
        } catch (err) {
            console.error("removeDailyStar:", err);
            throw err;
        }
    }

    // --- LEADERBOARD & GAME INTEGRATION ---
    /** Herkese açık hayvan kartları (pet_cards) + sahiplerinin adı; pets tablosu sadece sahibine açık. */
    private async getPublicPetCards(opts: { orderByXp?: boolean; limit?: number; ids?: string[] } = {}) {
        let q = supabase.from('pet_cards').select('id, owner_id, name, type, breed, gender, age, size, character, avatar_url, cover_url, is_lost, xp, level, created_at');
        if (opts.ids) q = q.in('id', opts.ids);
        q = opts.orderByXp ? q.order('xp', { ascending: false, nullsFirst: false }) : q.order('created_at', { ascending: false });
        if (opts.limit) q = q.limit(opts.limit);
        const { data, error } = await q;
        if (error) throw error;
        const ownerIds = Array.from(new Set((data || []).flatMap(p => (p.owner_id ? [p.owner_id] : []))));
        const owners = new Map<string, { full_name: string | null; username: string | null }>();
        if (ownerIds.length > 0) {
            const { data: profs } = await supabase.from('profile_cards').select('id, full_name, username').in('id', ownerIds);
            for (const o of profs || []) if (o.id) owners.set(o.id, o);
        }
        return (data || []).flatMap(p => (p.id ? [{ ...p, id: p.id, profiles: (p.owner_id && owners.get(p.owner_id)) || null }] : []));
    }

    async getPublicPetsByOwner(ownerId: string): Promise<{ id: string; name: string; type: string | null; breed: string | null; gender: string | null; image: string }[]> {
        const { data, error } = await supabase.from('pet_cards').select('id, name, type, breed, gender, avatar_url')
            .eq('owner_id', ownerId).order('created_at', { ascending: true });
        if (error) { console.error('getPublicPetsByOwner:', error); return []; }
        return (data || []).flatMap(p => (p.id ? [{ id: p.id, name: p.name || '', type: p.type, breed: p.breed, gender: p.gender, image: p.avatar_url || '' }] : []));
    }

    async getPetLeaderboard(limit: number = 50) {
        try {
            const data = await this.getPublicPetCards({ orderByXp: true, limit });
            return data.map((p) => ({
                id: p.id,
                name: p.name || 'Gizli Pet',
                ownerName: p.profiles?.full_name || p.profiles?.username || 'Gizli Kullanıcı',
                avatar: p.avatar_url,
                score: p.xp || 0,
                level: p.level || 1,
                country: 'TR',
            }));
        } catch (err) {
            console.error("Supabase getPetLeaderboard failed:", err);
            return [];
        }
    }

    async addPetScore(petId: string, xpEarned: number, coinsEarned: number): Promise<boolean> {
        try {
            // Call the secure RPC function
            // Sunucu günlük sınırı uygular; true = bu oyundan en az bir ödül (XP ya da altın) yazıldı.
            const { data, error } = await supabase.rpc('add_game_reward', {
                p_pet_id: petId,
                p_xp_earned: xpEarned,
                p_coins_earned: coinsEarned
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Supabase addPetScore failed:", err);
            return false;
        }
    }

    async getGameModules() {
        const fallbackModules = [
            { id: '1', game_key: 'food-catch', title: 'Mama Yakala', description: 'Zehirli mantarlardan kaç, mamaları kap!', icon_name: 'Utensils', color_gradient: 'from-orange-500 to-red-600', difficulty: 1, is_active: true },
            { id: '2', game_key: 'memory', title: 'Pet Memory', description: 'Kartları eşleştir, hafızanı test et.', icon_name: 'Brain', color_gradient: 'from-blue-500 to-indigo-600', difficulty: 2, is_active: true },
            { id: '3', game_key: 'jump', title: 'Moffi Jump', description: 'Sonsuzlukta en yükseğe zıpla!', icon_name: 'Zap', color_gradient: 'from-fuchsia-500 to-pink-600', difficulty: 3, is_active: true },
            { id: '4', game_key: 'moffi-run', title: 'Moffi Run', description: 'Engelleri aş, paraları topla.', icon_name: 'Gamepad2', color_gradient: 'from-amber-400 to-orange-500', difficulty: 2, is_active: true }
        ];
        
        try {
            const { data, error } = await supabase
                .from('game_modules')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            return (data && data.length > 0) ? data : fallbackModules;
        } catch (err) {
            console.error("Supabase getGameModules failed:", err);
            return fallbackModules;
        }
    }


    // Faz 13 (referans UI'ye göre düzeltme, bkz. CLAUDE.md 8.8): gerçek mesafe (km)
    // bazlı sıralama, zaman aralığı filtreli. walk_sessions RLS'i sadece kendi
    // satırlarını okumaya izin veriyor (Faz 10'da bilinçli sıkılaştırıldı), bu yüzden
    // kullanıcılar-arası toplam mesafe SECURITY DEFINER bir RPC (get_distance_leaderboard)
    // üzerinden alınıyor - sadece toplam mesafe/yürüyüş sayısı döner, hiçbir GPS
    // rotası dışarı sızmıyor. userIds verilirse (Arkadaşlarım/Aynı Şehir filtreleri
    // için) sadece o kullanıcılar arasında sıralanır, null ise herkes dahil edilir.
    async getDistanceLeaderboard(period: 'week' | 'month' | 'all', userIds: string[] | null = null, limit: number = 100): Promise<{ userId: string; totalMeters: number; walkCount: number }[]> {
        try {
            const { data, error } = await supabase.rpc('get_distance_leaderboard', {
                p_period: period,
                p_user_ids: userIds ?? undefined,
                p_limit: limit,
            });
            if (error) throw error;
            return (data || []).map((row) => ({
                userId: row.user_id,
                totalMeters: Number(row.total_meters) || 0,
                walkCount: row.walk_count || 0,
            }));
        } catch (err) {
            console.error("Supabase getDistanceLeaderboard failed:", err);
            return [];
        }
    }

    async getProfilesByIds(ids: string[]): Promise<{ id: string; name: string; avatar?: string; pet: string }[]> {
        if (ids.length === 0) return [];
        try {
            const { data, error } = await supabase
                .from('profile_cards')
                .select('id, full_name, avatar_url, pet_name')
                .in('id', ids);
            if (error) throw error;
            return (data || []).flatMap(p => (p.id ? [{
                id: p.id,
                name: p.full_name || 'Gizli Kullanıcı',
                avatar: p.avatar_url || undefined,
                pet: p.pet_name || 'Moffi',
            }] : []));
        } catch (err) {
            console.error("Supabase getProfilesByIds failed:", err);
            return [];
        }
    }


    // Faz 22: Ödül Marketi fiziksel eşya yerine gerçek dijital gardırop —
    // src/integrations-pending/kombinle prototipinin PP-ekonomisine bağlanmış hali.
    async getCosmeticItems(): Promise<{ id: string; slot: 'body' | 'head' | 'eyes' | 'hands' | 'feet'; itemKey: string; name: string; icon: string; pricePp: number; rarity: 'common' | 'rare' | 'epic' | 'legendary'; isStarter: boolean }[]> {
        try {
            const { data, error } = await supabase
                .from('cosmetic_items')
                .select('id, slot, item_key, name, icon, price_pp, rarity, is_starter')
                .eq('is_active', true)
                .order('price_pp', { ascending: true });
            if (error) throw error;
            // slot/rarity veritabanında CHECK kısıtıyla bu değerlerle sınırlı.
            return (data || []).map(i => ({
                id: i.id,
                slot: i.slot as 'body' | 'head' | 'eyes' | 'hands' | 'feet',
                itemKey: i.item_key,
                name: i.name,
                icon: i.icon,
                pricePp: i.price_pp,
                rarity: i.rarity as 'common' | 'rare' | 'epic' | 'legendary',
                isStarter: i.is_starter,
            }));
        } catch (err) {
            console.error("Supabase getCosmeticItems failed:", err);
            return [];
        }
    }

    async getOwnedCosmeticItemIds(userId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('user_cosmetic_items')
                .select('item_id')
                .eq('user_id', userId);
            if (error) throw error;
            return (data || []).map(r => r.item_id);
        } catch (err) {
            console.error("Supabase getOwnedCosmeticItemIds failed:", err);
            return [];
        }
    }

    // Satın alma atomik: redeem_cosmetic_item RPC'si PP'yi düşürüp aynı transaction'da
    // sahiplik satırını ekliyor (bkz. migration add_cosmetic_wardrobe_system).
    async redeemCosmeticItem(itemId: string, _name: string, _pricePp: number): Promise<number> {
        const { data, error } = await supabase.rpc('redeem_cosmetic_item', { p_item_id: itemId });
        if (error) throw error;
        return data as number;
    }

    async getPetLook(petId: string): Promise<{ equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }> {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('equipped_apparel, avatar_body_color, avatar_background')
                .eq('id', petId)
                .single();
            if (error) throw error;
            return {
                equippedApparel: (data?.equipped_apparel as Record<string, string | null>) || {},
                avatarBodyColor: data?.avatar_body_color || '#8b5cf6',
                avatarBackground: data?.avatar_background || null,
            };
        } catch (err) {
            console.error("Supabase getPetLook failed:", err);
            return { equippedApparel: {}, avatarBodyColor: '#8b5cf6', avatarBackground: null };
        }
    }

    async updatePetLook(petId: string, look: { equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('pets')
                .update({
                    equipped_apparel: look.equippedApparel,
                    avatar_body_color: look.avatarBodyColor,
                    avatar_background: look.avatarBackground,
                })
                .eq('id', petId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Supabase updatePetLook failed:", err);
            return false;
        }
    }

    // Faz 23: VIP Merkezi — gerçek Prime özelliklerinin (şu an sadece profil
    // çerçeveleri) PP karşılığında geçici tadımı.
    async getVipPerks(): Promise<{ id: string; perkKey: string; name: string; description: string; icon: string; pricePp: number; durationHours: number; rarity: 'common' | 'rare' | 'epic' | 'legendary' }[]> {
        try {
            const { data, error } = await supabase
                .from('vip_perks')
                .select('id, perk_key, name, description, icon, price_pp, duration_hours, rarity')
                .eq('is_active', true)
                .order('price_pp', { ascending: true });
            if (error) throw error;
            return (data || []).map(p => ({
                id: p.id, perkKey: p.perk_key, name: p.name, description: p.description,
                icon: p.icon, pricePp: p.price_pp, durationHours: p.duration_hours, rarity: p.rarity as 'common' | 'rare' | 'epic' | 'legendary',
            }));
        } catch (err) {
            console.error("Supabase getVipPerks failed:", err);
            return [];
        }
    }

    /** Oyun ekranı: oyun altını, bugünkü ödül sınırları ve seçili hayvanın XP/seviyesi (game_status). */
    async getGameStatus(petId?: string): Promise<GameStatus | null> {
        const { data, error } = await supabase.rpc('game_status', { p_pet_id: petId });
        if (error) { console.error('game_status:', error); return null; }
        const o = jsonObj(data);
        const n = (k: string, d: number) => (typeof o[k] === 'number' ? (o[k] as number) : d);
        return {
            coinBalance: n('coin_balance', 0), coinsToday: n('coins_today', 0), xpToday: n('xp_today', 0),
            coinCap: n('coin_cap', 100), xpCap: n('xp_cap', 500), petXp: n('pet_xp', 0), petLevel: n('pet_level', 1),
        };
    }

    /** Hafıza oyununda süre uzatma: 50 oyun altını sunucuda düşülür; yeni bakiyeyi döner. */
    async gameContinue(): Promise<number> {
        const { data, error } = await supabase.rpc('game_continue');
        if (error) throw new Error(error.message);
        return data;
    }

    /** PawCoin hareketleri (kazanılan ödüller, harcamalar): yalnızca kişinin kendi satırları (RLS). */
    async getPawCoinHistory(limit = 50): Promise<{ id: string; amount: number; reason: string; source: string; createdAt: string }[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data, error } = await supabase.from('point_transactions')
            .select('id, amount, reason, source, created_at')
            .eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return (data || []).map(r => ({ id: r.id, amount: r.amount, reason: r.reason || '', source: r.source || '', createdAt: r.created_at || '' }));
    }

    // Sadece gerçekten hâlâ aktif (expires_at > now) satırları döndürür —
    // süresi dolmuş bir perk'i "aktif" gibi göstermemek için filtre burada.
    async getActivePerks(userId: string): Promise<Record<string, string>> {
        try {
            const { data, error } = await supabase
                .from('user_active_perks')
                .select('perk_key, expires_at')
                .eq('user_id', userId)
                .gt('expires_at', new Date().toISOString());
            if (error) throw error;
            const map: Record<string, string> = {};
            (data || []).forEach(r => { map[r.perk_key] = r.expires_at; });
            return map;
        } catch (err) {
            console.error("Supabase getActivePerks failed:", err);
            return {};
        }
    }

    async redeemVipPerk(perkId: string, _name: string, _pricePp: number): Promise<string> {
        const { data, error } = await supabase.rpc('redeem_vip_perk', { p_perk_id: perkId });
        if (error) throw error;
        return data as string;
    }

    async createSocialChallenge(partnerId: string, mode: 'duel' | 'team', durationDays: number, targetKm?: number): Promise<string> {
        const { data, error } = await supabase.rpc('create_social_challenge', {
            p_partner_id: partnerId, p_mode: mode, p_duration_days: durationDays, p_target_km: targetKm ?? undefined,
        });
        if (error) throw error;
        return data as string;
    }

    async respondSocialChallenge(challengeId: string, accept: boolean): Promise<void> {
        const { error } = await supabase.rpc('respond_social_challenge', { p_challenge_id: challengeId, p_accept: accept });
        if (error) throw error;
    }

    async finalizeSocialChallengeIfDue(challengeId: string): Promise<void> {
        const { error } = await supabase.rpc('finalize_social_challenge', { p_challenge_id: challengeId });
        if (error) throw error;
    }

    // "Aynı Şehir" filtresi: profiles.address alanı (serbest metin) tam eşleşen
    // diğer kullanıcılar. Gerçek bir yapılandırılmış "şehir" kolonu yok - şu an
    // hiçbir gerçek kullanıcı address girmediği için bu genelde boş dönecek,
    // sahte veri üretmek yerine dürüstçe boş liste dönüyor.
    async getSameCityUserIds(_userId: string): Promise<string[]> {
        // Adresler gizli; eşleştirme sunucuda yapılır, sadece kullanıcı kimlikleri döner.
        try {
            const { data, error } = await supabase.rpc('get_same_city_user_ids');
            if (error) throw error;
            return (data || []).filter(Boolean);
        } catch (err) {
            console.error("Supabase getSameCityUserIds failed:", err);
            return [];
        }
    }

    /** Yönetici panosu: uygulama geri bildirimleri (app_feedbacks; eskiden olmayan tabloya bakıp uydurma liste dönüyordu). */
    async getFeedbacks(): Promise<Tables<'app_feedbacks'>[]> {
        const { data, error } = await supabase.from('app_feedbacks').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("getFeedbacks:", error);
            return [];
        }
        return data || [];
    }

    // --- UNCLAIMED PATIENTS MIGRATION ---
    async insertUnclaimedPatient(data: {
        rawName: string; rawPhone: string; petName?: string;
        petSpecies?: string; petBreed?: string; legacyNotes?: string;
    }): Promise<string> {
        const { data: id, error } = await supabase.rpc('insert_unclaimed_patient', {
            p_raw_name: data.rawName,
            p_raw_phone: data.rawPhone,
            p_pet_name: sqlNullable(data.petName || null),
            p_pet_species: sqlNullable(data.petSpecies || null),
            p_pet_breed: sqlNullable(data.petBreed || null),
            p_legacy_notes: sqlNullable(data.legacyNotes || null),
        });
        if (error) throw error;
        return id;
    }

    async getMyUnclaimedPatients() {
        const { data, error } = await supabase.rpc('get_my_unclaimed_patients');
        if (error) { console.error(error); return []; }
        return data || [];
    }

    async getMySmsStatus(): Promise<{provider: string, sender_id: string, is_active: boolean} | null> {
        const { data, error } = await supabase.rpc('get_my_sms_status');
        if (error || !data || data.length === 0) return null;
        return data[0];
    }

    async setClinicSmsSettings(provider: string, apiUsername: string, apiKey: string, senderId: string): Promise<boolean> {
        const { error } = await supabase.rpc('set_clinic_sms_settings', {
            p_provider: provider,
            p_api_username: apiUsername,
            p_api_key: apiKey,
            p_sender_id: senderId
        });
        if (error) { console.error(error); throw error; }
        return true;
    }

    async sendClaimSms(unclaimedPatientId: string): Promise<{mode: string, sent: boolean}> {
        const { data, error } = await supabase.functions.invoke('send-claim-sms', {
            body: { unclaimedPatientId }
        });
        if (error) { console.error(error); throw error; }
        return data;
    }

    /** Profildeki kendi telefonumla eşleşen, işletmelerin açtığı sahipsiz kayıtlar (my_unclaimed_matches; başka numara sorgulanamaz). */
    async getMyUnclaimedMatches() {
        const { data, error } = await supabase.rpc('my_unclaimed_matches');
        if (error) { console.error(error); throw error; }
        return data || [];
    }

    async requestManualClaim(unclaimedId: string): Promise<boolean> {
        const { error } = await supabase.rpc('request_manual_claim', {
            p_unclaimed_id: unclaimedId
        });
        if (error) { console.error(error); throw error; }
        return true;
    }

    async approveManualClaim(unclaimedId: string): Promise<string> {
        const { data, error } = await supabase.rpc('approve_manual_claim', {
            p_unclaimed_id: unclaimedId
        });
        if (error) { console.error(error); throw error; }
        return data;
    }


    // --- CLINIC SPECIFIC BUSINESS METHODS ---

    async getClinicProducts(clinicId: string): Promise<ShopProduct[]> {
        const { data, error } = await supabase.from('products').select('*').eq('owner_id', clinicId).order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching clinic products:", error);
            return [];
        }
        return (data || []).map(mapProductRow);
    }

    /**
     * İşletmenin siparişleri (satıcı okuma kuralı is_order_seller). Eskiden alıcının olmayan e-posta sütunu istendiği için
     * sorgu hata verip liste boş dönebiliyordu; kalem süzmesi de ürün sahibine göre yapılıyordu (kalemin işletmesi asıl kaynak).
     */
    async getClinicOrders(businessId: string): Promise<SellerOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, status, commission_rate, created_at, shipping_address, tracking_number, carrier,
                items:order_items!inner(id, product_id, quantity, price_at_purchase, status, business_id, product:products(name)),
                user:profiles!orders_user_id_fkey(full_name, phone)
            `)
            .eq('items.business_id', businessId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching clinic orders:", error);
            return [];
        }
        return (data || []).map(o => {
            const user = Array.isArray(o.user) ? o.user[0] : o.user;
            return {
                id: o.id,
                status: o.status || 'pending',
                commissionRate: Number(o.commission_rate) || 0,
                date: o.created_at || new Date(0).toISOString(),
                shippingAddress: o.shipping_address || '',
                trackingNumber: o.tracking_number || '',
                carrier: o.carrier || '',
                customerName: user?.full_name || 'Müşteri',
                customerPhone: user?.phone ?? null,
                items: (o.items || []).filter(i => i.business_id === businessId).map(i => {
                    const product = Array.isArray(i.product) ? i.product[0] : i.product;
                    return {
                        id: i.id, productId: i.product_id, productName: product?.name || 'Ürün',
                        quantity: i.quantity, price: Number(i.price_at_purchase), status: i.status || 'awaiting_payment',
                    };
                }),
            };
        });
    }
    // --- CLINIC MESSAGES (FAZ 8) ---


    // --- CAMPAIGNS (FAZ 8) ---
    async getClinicCampaigns(clinicId: string): Promise<ClinicCampaign[]> {
        const { data, error } = await supabase.from('clinic_campaigns').select('*').eq('clinic_id', clinicId).order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching campaigns:", error);
            return [];
        }
        return data || [];
    }

    async addClinicCampaign(input: DbTables['clinic_campaigns']['Insert']): Promise<boolean> {
        const payload: DbTables['clinic_campaigns']['Insert'] = {
            ...input,
            target_pet_type: input.target_pet_type || 'all',
            status: input.status || 'active',
            // Eski sorgular ends_at'e bakar; bitiş tarihi ikisine de yazılır.
            ends_at: input.ends_at ?? input.expires_at ?? null,
        };
        const { error } = await supabase.from('clinic_campaigns').insert(payload);
        if (error) {
            console.error("Error in addClinicCampaign:", error.message, error.details, error.hint);
            return false;
        }
        return true;
    }

}
