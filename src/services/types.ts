import type { Json, Tables } from '@/types/supabase';
// Sunucuya gönderilen tek GPS noktası (append_walk_points / finish_walk).
export interface WalkPoint {
    lat: number;
    lng: number;
    timestamp: string;
}

export interface BusinessAppointmentInput {
    start: string;
    durationMinutes: number;
    serviceName: string;
    doctorId?: string | null;
    userId?: string | null;
    petId?: string | null;
    guestName?: string | null;
    guestPhone?: string | null;
    guestPetName?: string | null;
    guestPetSpecies?: string | null;
    notes?: string | null;
    ignoreHours?: boolean;
}

export interface ClinicClient {
    client_key: string;
    kind: 'moffi' | 'guest';
    owner_id: string | null;
    owner_name: string | null;
    phone: string | null;
    pet_id: string | null;
    pet_name: string | null;
    species: string | null;
    breed: string | null;
    avatar_url: string | null;
    last_visit: string | null;
    next_visit: string | null;
    visit_count: number;
    no_show_count: number;
    note: string | null;
}

/** Kayıp moduna ait ayarlar (pets.sos_settings, json). */
export interface PetSosSettings {
    auto_post_sos?: boolean;
    sos_radius?: '2km' | '5km' | '10km' | 'city';
    secure_proxy_only?: boolean;
    location_precision?: 'exact' | 'area';
    emergency_sms_number?: string;
    reward_amount?: number;
    reward_currency?: string;
    finder_message?: string;
    quiet_hours?: { enabled: boolean; from: string; to: string };
    emergency_bypass?: boolean;
    header_sos_alert_enabled?: boolean;
    reward_enabled?: boolean;
    last_seen_location?: string;
}

/**
 * Evcil hayvan: pets satırının uygulamadaki hâli. TEK tanım (PetContext buradan alır; eskiden iki ayrı ve uyumsuz tanım vardı).
 * Eşleme tek yerde: supabaseApiService.mapPetRow. Veritabanında karşılığı olmayan alan eklenmez.
 */
export interface Pet {
    id: string;
    name: string;
    /** Tür: 'dog' | 'cat' | diğer (pets.type) */
    type: string;
    breed: string;
    /** Serbest yaş metni (eski kayıtlar); hesap için birthday kullanılır. */
    age?: string;
    gender: string;
    /** Profil fotoğrafı adresi (pets.avatar_url); yoksa boş metin. */
    image: string;
    avatar?: string;
    /** Kapak fotoğrafı (pets.cover_url). */
    cover_photo?: string;
    /** "28 kg" biçiminde; kayıt yoksa boş metin. */
    weight: string;
    neutered?: boolean;
    size?: string;
    microchip?: string;
    birthday?: string;
    birth_date_estimated?: boolean;
    color?: string;
    petvet_no?: string;
    passport_no?: string;
    character?: string;
    features?: string[];
    gallery_urls?: string[];
    is_lost?: boolean;
    created_at?: string;
    sos_settings?: PetSosSettings;
    /** Oyun deneyimi (pets.xp / pets.level; yalnızca add_game_reward yazar). */
    xp?: number;
    level?: number;
}

export interface Post {
    id: number | string;
    user: {
        name: string;
        avatar: string;
        is_verified?: boolean;
    };
    user_id?: string;
    media: string;
    caption: string;
    desc?: string; // Legacy mapping
    likes: number;
    comments: number;
    time: string;
    type?: 'image' | 'video';
    mood?: string;
    allow_comments?: boolean;
    comment_privacy?: 'everyone' | 'followers' | 'none';
    status?: string;
    is_video?: boolean;
    trim_start?: number;
    trim_end?: number;
    audio_url?: string;
    media_url?: string;
    tagged_pets?: string[];
    aspect_ratio?: string;
    scheduled_at?: string | null;
}

/** Profil (kendi profilinde profiles, başkasınınkinde profile_cards). Eşleme tek yer: supabaseApiService.getUserProfile. */
export interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    cover_photo?: string;
    bio?: string | null;
    petName?: string | null;
    role: string;
    is_prime: boolean;
    prime_until: string | null;
    created_at?: string | null;
    default_allow_comments: boolean;
    default_comment_privacy: string;
    comment_filter_words: string[];
    phone?: string | null;
    /** İl / ilçe (profil kartında herkese açık). */
    province?: string | null;
    district?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    account_status: string;
    // Eski tek-işletme alanları (profil satırında); işletmenin asıl kaydı businesses tablosunda (8.54).
    businessType?: string | null;
    businessName?: string | null;
    businessApproved?: boolean | null;
    kybStatus?: string | null;
    taxId?: string | null;
    iban?: string | null;
    address?: string | null;
    ownerName?: string | null;
    working_hours?: Json | null;
    wallet_balance: number;
    moffi_coins: number;
    settings: Json | null;
    stats: { followers: number; following: number };
}

/** updateProfile'ın değiştirebildiği alanlar (rol, onay, bakiye gibi alanlar istemciden değişmez; tetikleyiciler korur). */
export type ProfileUpdate = Partial<Pick<UserProfile, 'name' | 'username' | 'avatar' | 'cover_photo' | 'bio' | 'petName' |
    'default_allow_comments' | 'default_comment_privacy' | 'comment_filter_words' | 'phone' | 'birth_date' | 'gender' | 'account_status'>>;

export interface LostPet {
    id: number | string;
    pet_id?: string;
    name: string;
    img: string;
    images?: string[];
    location: string;
    last_seen_location?: string;
    reward_enabled?: boolean;
    dist: string;
    time: string;
    reward?: string;
    type?: string;
    description?: string;
    user_id?: string;
    latitude?: number;
    longitude?: number;
}

// --- MAĞAZA (tek tanım; types/domain buradan alır) ---
// Gerçek kaynak products tablosu. Puan/yorum/marka sütunu YOK: arayüz bunları uydurmaz.
export type ShopCategory = 'food' | 'snack' | 'toy' | 'care' | 'accessory';

export interface ShopProduct {
    id: string;
    name: string;
    description?: string;
    price: number;
    oldPrice?: number;
    /** Tek adres ya da virgülle ayrılmış adresler (ilki kapak). */
    image: string;
    category: ShopCategory;
    tag?: string;
    inStock: boolean;
    stockCount?: number;
    isVetApproved?: boolean;
    /** Yalnızca Prime üyelere (products.is_prime_only). */
    isPrimeOnly?: boolean;
    /** Satıcı (products.owner_id). */
    ownerId?: string;
}

export interface ShopCartItem {
    productId: string;
    quantity: number;
    addedAt: string; // ISO timestamp
}

// orders.status (sipariş) ve order_items.status (satıcı kalemi: awaiting_payment…returned) değerlerinin birleşimi.
export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'awaiting_payment' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface ShopOrder {
    id: string;
    userId: string;
    /** status: satıcının kalem durumu (awaiting_payment → preparing → shipped → delivered | cancelled). */
    items: Array<{ product: ShopProduct; quantity: number; status?: string }>;
    totalPrice: number;
    discountCode?: string;
    discountAmount?: number;
    shippingAddress: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    /** Ödenmemiş siparişin son geçerlilik zamanı (sonra iptal sayılır). */
    expiresAt?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
}

export type BusinessRole = 'owner' | 'manager' | 'staff';

/** Kişinin üyesi olduğu işletme (`my_businesses()`). */
export interface MyBusiness {
    id: string;
    name: string;
    businessType: string | null;
    approved: boolean;
    kybStatus: string | null;
    role: BusinessRole;
    logoUrl: string | null;
    isActive: boolean;
}

// İşletmenin müşteriye görünen vitrini (klinik detay ekranı + harita pini).
export interface BusinessProfileData {
    businessName: string;
    about: string;
    phone: string;
    website: string;
    address: string;
    province: string;
    district: string;
    lat: number | null;
    lng: number | null;
    logoUrl: string | null;
    coverUrl: string | null;
    gallery: string[];
}

/** İşletme kampanyası (clinic_campaigns satırı; fırsat hikâyesi bunu canlı okur, 8.64). */
export type ClinicCampaign = Tables<'clinic_campaigns'>;

export interface ClinicReview {
    id: string;
    clinic_id: string;
    user_id: string;
    appointment_id: string;
    rating: number;
    comment?: string;
    clinic_reply?: string;
    clinic_replied_at?: string;
    created_at: string;
    user?: {
        name: string;
        avatar: string;
    };
}

export interface SystemAnnouncement {
    id: string;
    title: string;
    description: string;
    media_url: string;
    badge: string;
    cta_text: string;
    cta_type: 'toast' | 'chat' | 'map' | 'coupon' | 'url';
    cta_value: string;
    expires_at: string;
    created_at?: string;
}

export interface SystemFeedback {
    id: string;
    user_id: string;
    username?: string;
    content: string;
    severity: 'low' | 'medium' | 'high';
    status: 'new' | 'reviewed' | 'resolved';
    created_at: string;
}
