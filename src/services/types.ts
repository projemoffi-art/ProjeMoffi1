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
    media: string;
    caption: string;
    likes: number;
    comments: number;
    time: string;
    type?: 'image' | 'video';
}

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar: string;
    cover_photo?: string;
    bio?: string;
    is_verified?: boolean;
    subscription_status?: 'free' | 'plus' | 'pro';
    wallet_balance?: number;
    moffi_coins?: number;
    aura_settings?: {
        fontFamily: string;
        frameStyle: 'minimal' | 'glass' | 'neon' | 'metal';
        accentColor: string;
        badges: string[];
    };
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
    
    // Pets
    getPets(): Promise<Pet[]>;
    getActivePet(): Promise<Pet | null>;
    setActivePet(id: string): Promise<void>;
    addPet(pet: Partial<Pet>): Promise<Pet>;
    updatePet(id: string, updates: Partial<Pet>): Promise<Pet>;
    
    // Community
    getFeedContent(): Promise<Post[]>;
    getLostPets(): Promise<LostPet[]>;
    addLostPet(data: Partial<LostPet>): Promise<LostPet>;
    getAdoptions(): Promise<AdoptionPet[]>;
    addAdoption(data: Partial<AdoptionPet>): Promise<AdoptionPet>;
    getInboxMessages(): Promise<any[]>;
    addInboxMessage(message: any): Promise<void>;
    addPost(post: Partial<Post>): Promise<Post>;
    deletePost(postId: string | number): Promise<void>;
    updatePost(postId: string | number, updates: Partial<Post>): Promise<void>;
    
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

    // Health Extension (New)
    getPetMedications(petId: string): Promise<any[]>;
    addPetMedication(med: any): Promise<any>;
    recordMedicationDose(medId: string): Promise<void>;
    getNutritionPlan(petId: string): Promise<any | null>;
    updateNutritionPlan(petId: string, plan: any): Promise<void>;

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
    addComment(postId: string, content: string): Promise<any>;
    getPostComments(postId: string): Promise<any[]>;
    
    // User Discovery & Social Interactions
    followUser(targetId: string): Promise<void>;
    unfollowUser(targetId: string): Promise<void>;
    isFollowing(targetId: string): Promise<boolean>;
    blockUser(targetId: string): Promise<void>;
    reportUser(targetId: string, reason: string): Promise<void>;
    
    // Direct Messaging (Chat)
    getChatConversations(): Promise<any[]>;
    getChatMessages(conversationId: string): Promise<any[]>;
    sendChatMessage(receiverId: string, content: string): Promise<any>;
    markChatAsRead(conversationId: string): Promise<void>;
    
    // Media & Storage
    uploadMedia(file: File, bucket: 'posts' | 'stories' | 'avatars'): Promise<string>;

    // Persistence
    saveData<T>(key: string, data: T): Promise<void>;
    loadData<T>(key: string): Promise<T | null>;
}
