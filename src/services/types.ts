import { Doctor } from '@/types/domain';
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

export interface Pet {
    id: string;
    name: string;
    image: string;
    avatar?: string;
    avatar_url?: string;
    cover_photo?: string;
    cover_url?: string;
    type: string;
    breed: string;
    age: string;
    gender: 'Erkek' | 'Dişi' | string;
    bio?: string;
    personality?: string;
    is_lost?: boolean;
    microchip_id?: string;
    is_neutered?: boolean;
    size?: 'small' | 'medium' | 'large';
    species?: string;
    photo_url?: string;
    owner_id?: string;
    sos_settings?: {
        auto_post_sos: boolean;
        sos_radius: '2km' | '5km' | '10km' | 'city';
        secure_proxy_only: boolean;
        location_precision: 'exact' | 'area';
        emergency_sms_number: string;
        reward_amount: number;
        reward_currency: string;
        last_seen_location?: string;
        finder_message: string;
        reward_enabled: boolean;
        header_sos_alert_enabled: boolean;
    };
}

export interface WalletTransaction {
    id: string | number;
    user_id?: string;
    type: 'earned' | 'spent' | 'system' | 'gift';
    amount: number;
    description: string;
    reference_id?: string; // Optional reference to game/order/etc
    created_at: string;
    icon?: string; // Client side mapped
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

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar: string;
    cover_photo?: string;
    bio?: string;
    is_verified?: boolean;
    subscription_status?: 'free' | 'pro' | 'elite';
    working_hours?: any;
    wallet_balance?: number;
    moffi_coins?: number;
    aura_settings?: {
        fontFamily: string;
        frameStyle: 'minimal' | 'glass' | 'neon' | 'metal';
        accentColor: string;
        badges: string[];
    };
    default_allow_comments?: boolean;
    default_comment_privacy?: 'everyone' | 'followers' | 'none';
    comment_filter_words?: string[];
    phone?: string;
    birth_date?: string;
    gender?: string;
    account_status?: string;
}

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

// --- SHOP & STUDIO TYPES ---
export interface ProductColor {
    id: string;
    name: string;
    hex: string;
}

export interface ProductSize {
    id: string;
    label: string;
    priceModifier: number;
}

export interface ProductBrand {
    name: string;
    isMoffi: boolean;
    logo?: string;
    location?: string;
}

export type ProductType = 'apparel' | 'accessory' | 'home' | 'pet-apparel';

export interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: ProductType;
    brand: ProductBrand;
    colors: ProductColor[];
    sizes: ProductSize[];
    images: {
        front: string;
        back?: string;
        model?: string;
    };
    rating: number;
    reviewCount: number;
}

export type ShopCategory = 'food' | 'snack' | 'toy' | 'care' | 'accessory' | 'apparel' | 'home' | 'pet-apparel';

export interface ShopProduct extends Partial<Product> {
    id: string;
    name: string;
    brand_name?: string; // from SQL
    price: number;
    oldPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: ShopCategory;
    tag?: string;
    inStock: boolean;
    stockCount?: number;
    isRecentlyBought?: boolean;
    isVetApproved?: boolean;
    description?: string;
    ownerId?: string;
}

export interface ShopCartItem {
    productId: string;
    quantity: number;
    addedAt: string; // ISO timestamp
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShopOrder {
    id: string;
    userId: string;
    items: Array<{ product: ShopProduct; quantity: number }>;
    totalPrice: number;
    discountCode?: string;
    discountAmount?: number;
    shippingAddress: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}

// Faz 24: Sosyal Meydan Okumalar
export interface SocialChallenge {
    id: string;
    mode: 'duel' | 'team';
    creatorId: string;
    partnerId: string;
    status: 'pending' | 'active' | 'completed' | 'declined' | 'cancelled';
    targetKm: number | null;
    durationDays: number;
    startsAt: string | null;
    endsAt: string | null;
    winnerId: string | null;
    rewardPp: number;
    createdAt: string;
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

export interface IApiService {
    // Auth & Profile
    getCurrentUser(): Promise<UserProfile | null>;
    getUserProfile(id: string): Promise<UserProfile | null>;
    updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
    isUsernameAvailable(username: string): Promise<boolean>;
    
    // Pets
    getPets(): Promise<Pet[]>;
    getActivePet(): Promise<Pet | null>;
    setActivePet(id: string): Promise<void>;
    addPet(pet: Partial<Pet>): Promise<Pet>;
    updatePet(id: string, updates: Partial<Pet>): Promise<Pet>;
    deletePet(id: string): Promise<void>;
    
    // Community
    fetchMarketPlaces(): Promise<any[]>;
    fetchVets(): Promise<any[]>;
    getInboxMessages(): Promise<any[]>;
    addInboxMessage(message: any): Promise<void>;
    
    // Shop
    getProducts(category?: ShopCategory): Promise<ShopProduct[]>;
    getCart(): Promise<ShopCartItem[]>;
    addToCart(productId: string, quantity: number): Promise<void>;
    updateCartItem(productId: string, quantity: number): Promise<void>;
    removeFromCart(productId: string): Promise<void>;
    clearCart(): Promise<void>;

    getOrders(): Promise<ShopOrder[]>;

    // Subscriptions & Advanced Features
    upgradeSubscription(status: 'free' | 'plus' | 'pro'): Promise<void>;
    addBalance(amount: number, type: 'fiat' | 'coin'): Promise<void>;
    updateAuraSettings(settings: any): Promise<void>;

    // Faz 7: Moffi Puanı (PP) — transaction-tabanlı, coin_balance/PawCoin'den TAMAMEN AYRI
    awardPatiPuan(amount: number, reason: string, source: string, referenceId?: string): Promise<number>;
    getPatiPuanBalance(): Promise<number>;
    getPatiPuanHistory(limit?: number): Promise<Array<{ id: string; amount: number; reason: string | null; source: string; created_at: string }>>;

    // Faz 8: gerçek seri kalkanı (streak shield) — localStorage'daki eski, gerçek seriye
    // hiç etkisi olmayan sahte versiyonun yerine geçti
    getStreakShieldStatus(): Promise<{ available: boolean }>;
    useStreakShield(coveredDate: string): Promise<boolean>;

    // Health & Veterinary
    getNearbyClinics(province?: string, district?: string, lat?: number | null, lng?: number | null, businessType?: string): Promise<any[]>;
    getClinicDetails(clinicId: string): Promise<any>;
    createAppointment(dto: any): Promise<any>;
    getAppointments(userId: string): Promise<any[]>;
    cancelAppointment(id: string): Promise<void>;
    getClinicAppointments(clinicId: string): Promise<any[]>;
    getAvailableSlots(clinicId: string, date: string, durationMinutes: number | null, doctorId: string | null): Promise<{ slot_time: string; available: boolean }[]>;
    getClinicCalendar(clinicId: string, fromDate: string, days: number): Promise<{ day: string; is_open: boolean }[]>;
    createBusinessAppointment(input: BusinessAppointmentInput): Promise<string>;
    rescheduleAppointment(appointmentId: string, newStart: string, doctorId: string | null, ignoreHours: boolean): Promise<void>;
    getClinicClients(): Promise<ClinicClient[]>;
    getFavoriteClinicIds(): Promise<string[]>;
    setFavoriteClinic(clinicId: string, favorite: boolean): Promise<void>;
    getClinicsByIds(clinicIds: string[]): Promise<any[]>;
    getReminderPrefs(): Promise<{ h24: boolean; h2: boolean; day: boolean }>;
    setReminderPrefs(prefs: { h24: boolean; h2: boolean; day: boolean }): Promise<void>;
    getBusinessProfile(): Promise<BusinessProfileData | null>;
    updateBusinessProfile(p: BusinessProfileData): Promise<void>;
    getClinicOrders(clinicId: string): Promise<ShopOrder[]>;
    getMySharedPassports(): Promise<{ id: string; clinicName: string; petName: string; date: string; sharedFields: string[] }[]>;
    requestReschedule(appointmentId: string, newStart: string): Promise<void>;
    respondReschedule(appointmentId: string, accept: boolean): Promise<void>;
    getVisitSummary(appointmentId: string): Promise<any | null>;
    getCancellationNoticeHours(clinicId: string): Promise<number>;
    saveClientNote(clinicId: string, clientKey: string, note: string): Promise<void>;
    getClinicServices(clinicId: string): Promise<any[]>;
    getClinicDoctors(clinicId: string): Promise<Doctor[]>;
    getAllClinicDoctors(clinicId: string): Promise<Doctor[]>;
    createDoctor(dto: { clinicId: string; name: string; title?: string; photoUrl?: string }): Promise<Doctor>;
    updateDoctor(id: string, dto: { name?: string; title?: string; photoUrl?: string; isActive?: boolean }): Promise<Doctor>;
    updateAppointmentStatus(appointmentId: string, status: string, rejectReason?: string): Promise<void>;
    updateAttendanceStatus(appointmentId: string, status: 'attended' | 'no_show' | null): Promise<void>;
    getNoShowCount(userId: string): Promise<number>;
    getClinicSettings(clinicId: string): Promise<any>;
    saveClinicSettings(clinicId: string, settings: any): Promise<void>;

    // Health Extension (New)
    getNutritionPlan(petId: string): Promise<any | null>;
    updateNutritionPlan(petId: string, plan: any): Promise<void>;
    getPetDailyStats(petId: string, date: string): Promise<any | null>;
    savePetDailyStats(petId: string, date: string, stats: any): Promise<void>;

    // Walk & Tracking
    startWalk(userId: string, petId: string): Promise<any>;
    updateWalkLocation(sessionId: string, lat: number, lng: number): Promise<void>;
    uploadWalkPhoto(sessionId: string, file: File): Promise<string>;
    startBeacon(sessionId: string, petName: string, lat: number, lng: number): Promise<string>;
    updateBeaconLocation(beaconId: string, lat: number, lng: number): Promise<void>;
    stopBeacon(beaconId: string): Promise<void>;
    getBeacon(beaconId: string): Promise<{ lat: number; lng: number; petName: string | null; updatedAt: string; expiresAt: string } | null>;
    endWalk(sessionId: string, data: any): Promise<any>;
    getWalkHistory(userId: string, limit?: number): Promise<any[]>;
    getWalkStats(userId: string): Promise<any>;
    getWalkById(id: string): Promise<any>;

    // --- HİKAYELER (Stories) ---

    // --- SOSYAL AKSİYONLAR ---
    
    // User Discovery & Social Interactions
    getFollowers(userId: string): Promise<UserProfile[]>;
    getFollowing(userId: string): Promise<UserProfile[]>;
    
    // Direct Messaging (Chat)
    getChatConversations(scope?: 'inbox' | 'clinic'): Promise<any[]>;
    getChatMessages(otherUserId: string, scope?: 'inbox' | 'clinic', before?: string | null, limit?: number): Promise<any[]>;
    getChatPartner(userId: string): Promise<{ userId: string; partnerName: string; avatar: string | null; isBusiness: boolean } | null>;
    sendChatMessage(receiverId: string, content: string, scope?: 'inbox' | 'clinic', associatedAdId?: string, attachmentUrl?: string): Promise<any>;
    markChatAsRead(otherUserId: string, scope?: 'inbox' | 'clinic'): Promise<void>;
    deleteChatMessage(messageId: string): Promise<void>;
    recallChatMessage(messageId: string): Promise<void>;
    
    // Media & Storage
    uploadMedia(file: File, bucket: 'posts' | 'stories' | 'avatars' | 'sounds', onProgress?: (percent: number) => void): Promise<string>;

    // Search
    globalSearch(query: string): Promise<{
        profiles: UserProfile[];
        posts: any[];
        pets: Pet[];
    }>;

    // Persistence
    saveData<T>(key: string, data: T): Promise<void>;
    loadData<T>(key: string): Promise<T | null>;

    // Admin Shop operations
    addProduct(product: Partial<ShopProduct>): Promise<ShopProduct>;
    updateProduct(id: string, product: Partial<ShopProduct>): Promise<ShopProduct>;
    deleteProduct(id: string): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    getAllOrders(): Promise<ShopOrder[]>;

    // Announcements
    getAnnouncements(): Promise<SystemAnnouncement[]>;
    addAnnouncement(announcement: Partial<SystemAnnouncement>): Promise<SystemAnnouncement>;
    deleteAnnouncement(id: string): Promise<void>;

    // Daily Star Pet (Yıldız Patiler)
    getAllPetsAdmin(): Promise<Pet[]>;
    getDailyStars(dateString: string): Promise<any[]>;
    getDailyStarCandidates(): Promise<any[]>;
    setDailyStar(dateString: string, rank: number, petId: string, details: any): Promise<void>;
    removeDailyStar(dateString: string, rank: number): Promise<void>;

    // Vet Advices (Vet Tavsiyeleri)
    getVetAdvices(): Promise<any[]>;
    saveClinicAdvice(clinicId: string, content: string, badge: string): Promise<void>;
    addAdminAdvice(content: string, badge: string, mediaUrl?: string): Promise<any>;
    deleteAdvice(id: string): Promise<void>;

    // Global Arena (Leaderboard) & Games
    getLeaderboard(role: 'user' | 'business', limit?: number): Promise<any[]>;
    getUserRank(userId: string): Promise<number>;
    // Faz 13 (referans UI'ye göre düzeltildi): mesafe (km) bazlı sıralama, zaman
    // aralığı filtreli - bkz. CLAUDE.md 8.8 / design-reference/walk-final/
    getDistanceLeaderboard(period: 'week' | 'month' | 'all', userIds?: string[] | null, limit?: number): Promise<{ userId: string; totalMeters: number; walkCount: number }[]>;
    getSameCityUserIds(userId: string): Promise<string[]>;
    getProfilesByIds(ids: string[]): Promise<{ id: string; name: string; avatar?: string; pet: string }[]>;

    // Faz 14: Ödül Marketi — Moffi Puanı (PP) ile satın alınabilen gerçek katalog
    getRewardProducts(): Promise<{ id: string; name: string; description: string | null; category: 'product' | 'experience' | 'coupon'; pricePp: number; icon: string }[]>;
    redeemReward(productId: string, name: string, pricePp: number): Promise<number>;

    // Faz 22: Kozmetik gardırop — Kombinle prototipinin gerçek, PP-tabanlı sürümü.
    getCosmeticItems(): Promise<{ id: string; slot: 'body' | 'head' | 'eyes' | 'hands' | 'feet'; itemKey: string; name: string; icon: string; pricePp: number; rarity: 'common' | 'rare' | 'epic' | 'legendary'; isStarter: boolean }[]>;
    getOwnedCosmeticItemIds(userId: string): Promise<string[]>;
    redeemCosmeticItem(itemId: string, name: string, pricePp: number): Promise<number>;
    getPetLook(petId: string): Promise<{ equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }>;
    updatePetLook(petId: string, look: { equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }): Promise<boolean>;

    // Faz 23: VIP Merkezi — gerçek Prime özelliklerinin (şu an sadece Aura/Neon
    // profil çerçeveleri) PP karşılığında GEÇİCİ tadımı.
    getVipPerks(): Promise<{ id: string; perkKey: string; name: string; description: string; icon: string; pricePp: number; durationHours: number; rarity: 'common' | 'rare' | 'epic' | 'legendary' }[]>;
    getActivePerks(userId: string): Promise<Record<string, string>>;
    redeemVipPerk(perkId: string, name: string, pricePp: number): Promise<string>;

    // Faz 24: Sosyal Meydan Okumalar — gerçek karşılıklı takip edilen kişilerle
    // düello (1v1) veya takım görevi (ortak hedef).
    getMutualFollows(userId: string): Promise<{ id: string; name: string; avatar?: string }[]>;
    createSocialChallenge(partnerId: string, mode: 'duel' | 'team', durationDays: number, targetKm?: number): Promise<string>;
    respondSocialChallenge(challengeId: string, accept: boolean): Promise<void>;
    getSocialChallenges(userId: string): Promise<SocialChallenge[]>;
    getSocialChallengeProgress(challengeId: string): Promise<{ creatorKm: number; partnerKm: number }>;
    finalizeSocialChallengeIfDue(challengeId: string): Promise<void>;
    addPetScore(petId: string, xpEarned: number, coinsEarned: number): Promise<boolean>;
    getGameModules(): Promise<any[]>;
    getPetLeaderboard(limit?: number): Promise<any[]>;
    /** Başka bir kullanıcının hayvanları: sadece herkese açık kart alanları. */
    getPublicPetsByOwner(ownerId: string): Promise<{ id: string; name: string; type: string | null; breed: string | null; gender: string | null; image: string }[]>;

    // Feedbacks
    getFeedbacks(): Promise<SystemFeedback[]>;

    // Unclaimed Patients Migration
    insertUnclaimedPatient(data: {
        rawName: string; rawPhone: string; petName?: string;
        petSpecies?: string; petBreed?: string; legacyNotes?: string;
    }): Promise<string>;
    getMyUnclaimedPatients(): Promise<any[]>;

    // SMS Settings & Sending
    getMySmsStatus(): Promise<{provider: string, sender_id: string, is_active: boolean} | null>;
    setClinicSmsSettings(provider: string, apiUsername: string, apiKey: string, senderId: string): Promise<boolean>;
    sendClaimSms(unclaimedPatientId: string): Promise<{mode: string, sent: boolean}>;

    // Claiming / Account Merging
    checkUnclaimedMatches(phone: string): Promise<any[]>;
    verifyAndClaim(unclaimedId: string, code: string): Promise<string>;
    requestManualClaim(unclaimedId: string): Promise<boolean>;
    approveManualClaim(unclaimedId: string): Promise<string>;

    // CRM / Clinic Patients

    // Clinic Exceptions (Faz 6)
    getClinicExceptions(clinicId: string, startDate?: string, endDate?: string): Promise<any[]>;
    upsertClinicException(clinicId: string, date: string, isClosed: boolean, openTime?: string | null, closeTime?: string | null, note?: string): Promise<boolean>;
    deleteClinicException(clinicId: string, date: string): Promise<boolean>;

    // Clinic Reviews (Faz 7)
    getClinicReviews(clinicId: string): Promise<{ reviews: ClinicReview[], averageRating: number }>;
    submitReview(clinicId: string, appointmentId: string, rating: number, comment?: string): Promise<boolean>;
    getReviewableAppointments(userId: string): Promise<any[]>;
    replyToReview(reviewId: string, clinicId: string, replyText: string): Promise<boolean>;

    // Clinic Campaigns
    getClinicDashboardStats(clinicId: string): Promise<any>;
    getClinicCampaigns(clinicId: string): Promise<ClinicCampaign[]>;
    createCampaign(clinicId: string, title: string, description: string, startsAt: string, endsAt: string | null): Promise<boolean>;
    addClinicCampaign(data: any): Promise<boolean>;
    deleteCampaign(campaignId: string, clinicId: string): Promise<boolean>;

    // Appointment Notifications (Faz 9)
    getUnreadNotifications(recipientId: string): Promise<any[]>;
    markNotificationRead(notificationId: string): Promise<boolean>;
}

export interface ClinicCampaign {
    id: string;
    clinic_id: string;
    title: string;
    description: string;
    starts_at: string;
    ends_at: string | null;
    is_active?: boolean;
    created_at: string;
}

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
