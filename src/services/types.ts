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
    health_notes?: string;
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
        critical_health_note: string;
        last_seen_location?: string;
        finder_message: string;
        reward_enabled: boolean;
        header_sos_alert_enabled: boolean;
    };
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

export interface LostPetSighting {
    id: string;
    lost_pet_id: string;
    reporter_id: string;
    reporter_name?: string;
    reporter_avatar?: string;
    description: string;
    latitude: number;
    longitude: number;
    img_url?: string;
    created_at: string;
}

export interface AdoptionPet extends LostPet {
    owner: string;
    phone: string;
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
    getFeedContent(): Promise<Post[]>;
    getLostPets(): Promise<LostPet[]>;
    addLostPet(data: Partial<LostPet>): Promise<LostPet>;
    deleteLostPet(id: string | number): Promise<void>;
    addLostPetSighting(data: { lost_pet_id: string; description: string; latitude: number; longitude: number; img_url?: string }): Promise<LostPetSighting>;
    getLostPetSightings(lostPetId: string): Promise<LostPetSighting[]>;
    getAdoptions(): Promise<AdoptionPet[]>;
    addAdoption(data: Partial<AdoptionPet>): Promise<AdoptionPet>;
    deleteAdoption(id: string | number): Promise<void>;
    getInboxMessages(): Promise<any[]>;
    addInboxMessage(message: any): Promise<void>;
    addPost(post: Partial<Post>): Promise<Post>;
    deletePost(postId: string | number): Promise<void>;
    updatePost(postId: string | number, updates: Partial<Post>): Promise<void>;
    getUserPosts(userId: string): Promise<any[]>;
    
    // Shop
    getProducts(category?: ShopCategory): Promise<ShopProduct[]>;
    getCart(): Promise<ShopCartItem[]>;
    addToCart(productId: string, quantity: number): Promise<void>;
    updateCartItem(productId: string, quantity: number): Promise<void>;
    removeFromCart(productId: string): Promise<void>;
    clearCart(): Promise<void>;
    createOrder(order: Partial<ShopOrder>): Promise<ShopOrder>;
    getOrders(): Promise<ShopOrder[]>;

    // Subscriptions & Advanced Features
    subscribeToProduct(productId: string): Promise<void>;
    getSubscriptions(): Promise<ShopProduct[]>;
    togglePetSosStatus(petId: string, status: 'safe' | 'lost'): Promise<void>;
    updatePetSosSettings(petId: string, settings: any): Promise<void>;
    upgradeSubscription(status: 'free' | 'plus' | 'pro'): Promise<void>;
    addBalance(amount: number, type: 'fiat' | 'coin'): Promise<void>;
    updateAuraSettings(settings: any): Promise<void>;

    // Health & Veterinary
    getVaccineDefinitions(): Promise<any[]>;
    getPetVaccines(petId: string): Promise<any[]>;
    markVaccineAsCompleted(recordId: string, date: string, vetName: string): Promise<void>;
    checkHealthNotifications(petId: string): Promise<void>;
    getNearbyClinics(lat: number, lng: number, radiusKm?: number): Promise<any[]>;
    getClinicDetails(clinicId: string): Promise<any>;
    createAppointment(dto: any): Promise<any>;
    getAppointments(userId: string): Promise<any[]>;
    cancelAppointment(id: string): Promise<void>;
    getClinicAppointments(clinicId: string): Promise<any[]>;
    updateAppointmentStatus(appointmentId: string, status: string): Promise<void>;
    getClinicSettings(clinicId: string): Promise<any>;
    saveClinicSettings(clinicId: string, settings: any): Promise<void>;

    // Health Extension (New)
    getPetMedications(petId: string): Promise<any[]>;
    addPetMedication(petIdOrMed: any, med?: any): Promise<any>;
    addPetVaccine(petIdOrRecord: any, record?: any): Promise<any>;
    recordMedicationDose(medId: string): Promise<void>;
    getNutritionPlan(petId: string): Promise<any | null>;
    updateNutritionPlan(petId: string, plan: any): Promise<void>;
    getPetDailyStats(petId: string, date: string): Promise<any | null>;
    savePetDailyStats(petId: string, date: string, stats: any): Promise<void>;

    // Walk & Tracking
    startWalk(userId: string, petId: string): Promise<any>;
    updateWalkLocation(sessionId: string, lat: number, lng: number): Promise<void>;
    endWalk(sessionId: string, data: any): Promise<any>;
    getWalkHistory(userId: string, limit?: number): Promise<any[]>;
    getWalkStats(userId: string): Promise<any>;
    getWalkById(id: string): Promise<any>;

    // Social Media (New)
    getStories(): Promise<any[]>;
    addStory(story: any): Promise<any>;
    reactToPost(postId: string, reactionType: string): Promise<void>;
    getPostReactions(postId: string): Promise<any[]>;
    addComment(postId: string | number, content: string, parentCommentId?: string | number): Promise<any>;
    getPostComments(postId: string): Promise<any[]>;
    editComment(commentId: string | number, content: string): Promise<void>;
    deleteComment(commentId: string | number): Promise<void>;
    toggleCommentLike(commentId: string | number): Promise<void>;
    
    // User Discovery & Social Interactions
    followUser(targetId: string): Promise<void>;
    unfollowUser(targetId: string): Promise<void>;
    isFollowing(targetId: string): Promise<boolean>;
    blockUser(targetId: string): Promise<void>;
    reportUser(targetId: string, reason: string): Promise<void>;
    getFollowers(userId: string): Promise<UserProfile[]>;
    getFollowing(userId: string): Promise<UserProfile[]>;
    
    // Direct Messaging (Chat)
    getChatConversations(): Promise<any[]>;
    getChatMessages(conversationId: string): Promise<any[]>;
    sendChatMessage(receiverId: string, content: string, associatedAdId?: string): Promise<any>;
    markChatAsRead(conversationId: string): Promise<void>;
    deleteChatMessage(messageId: string): Promise<void>;
    
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

    // Global Arena (Leaderboard)
    getLeaderboard(role: 'user' | 'business', limit?: number): Promise<any[]>;
    getUserRank(userId: string): Promise<number>;

    // Feedbacks
    getFeedbacks(): Promise<SystemFeedback[]>;
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
