import {
    FamilyMember, FamilyLog,
    VetClinic, VetAppointment, VaccineRuleset, UserVaccineRecord,
    ShopProduct, ShopCategory, ShopOrder, ShopCartItem,
    WalkSession, WalkStats,
    GameScore, LeaderboardEntry
} from "@/types/domain";

// ==========================================
// FAMILY
// ==========================================
export interface IFamilyService {
    getMembers(): Promise<FamilyMember[]>;
    getLogs(): Promise<FamilyLog[]>;
    inviteMember(email: string): Promise<string>;
    updateStatus(status: FamilyMember['status'], text: string): Promise<void>;
    subscribe(callback: (event: FamilyEvent) => void): () => void;
}

export type FamilyEvent =
    | { type: 'MEMBER_UPDATE', members: FamilyMember[] }
    | { type: 'NEW_LOG', log: FamilyLog }
    | { type: 'NOTIFICATION', message: string };

// ==========================================
// VET
// ==========================================
export interface IVetService {
    getNearbyClinics(lat: number, lng: number, radiusKm?: number): Promise<VetClinic[]>;
    getFeaturedClinics(): Promise<VetClinic[]>;
    getAllClinics(): Promise<VetClinic[]>;
    getClinicDetails(id: string): Promise<VetClinic | null>;
    createAppointment(appointment: Omit<VetAppointment, 'id' | 'status'>): Promise<VetAppointment>;
    getAppointments(userId: string): Promise<VetAppointment[]>;
    cancelAppointment(id: string): Promise<void>;
}

export interface IVaccineService {
    getRuleset(countryCode: string): Promise<VaccineRuleset>;
    getUserSchedule(petId: string, countryCode: string): Promise<UserVaccineRecord[]>;
    markAsDone(recordId: string, date: string, vetName: string): Promise<void>;
}

// ==========================================
// PETSHOP
// ==========================================
export interface IPetShopService {
    // Products
    getProducts(category?: ShopCategory): Promise<ShopProduct[]>;
    getProductById(id: string): Promise<ShopProduct | null>;
    searchProducts(query: string): Promise<ShopProduct[]>;

    // Cart (server-synced in Firebase, local in mock)
    getCart(userId: string): Promise<ShopCartItem[]>;
    addToCart(userId: string, productId: string, quantity: number): Promise<void>;
    updateCartItem(userId: string, productId: string, quantity: number): Promise<void>;
    removeFromCart(userId: string, productId: string): Promise<void>;
    clearCart(userId: string): Promise<void>;

    // Orders
    createOrder(order: Omit<ShopOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ShopOrder>;
    getOrders(userId: string): Promise<ShopOrder[]>;
    getOrderById(id: string): Promise<ShopOrder | null>;

    // Discounts
    validateDiscount(code: string): Promise<{ valid: boolean; discountPercent?: number; message?: string }>;
}

// ==========================================
// WALK
// ==========================================
export interface IWalkService {
    // Sessions
    startWalk(userId: string, petId: string): Promise<WalkSession>;
    endWalk(sessionId: string, data: Partial<WalkSession>): Promise<WalkSession>;
    getWalkHistory(userId: string, limit?: number): Promise<WalkSession[]>;
    getWalkById(id: string): Promise<WalkSession | null>;

    // Stats
    getWalkStats(userId: string): Promise<WalkStats>;

    // Live tracking
    updateLocation(sessionId: string, lat: number, lng: number): Promise<void>;
}

// ==========================================
// GAME
// ==========================================
export interface IGameService {
    // Scores
    saveScore(score: Omit<GameScore, 'id' | 'playedAt'>): Promise<GameScore>;
    getMyScores(userId: string, limit?: number): Promise<GameScore[]>;
    getHighScore(userId: string): Promise<number>;

    // Leaderboard
    getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
    getMyRank(userId: string): Promise<number>;

    // Coins (in-game currency)
    getTotalCoins(userId: string): Promise<number>;
    spendCoins(userId: string, amount: number, reason: string): Promise<boolean>;
}

// ==========================================
// PROFILE
// ==========================================
export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    joinedAt: string;
    stats: { posts: number; followers: number; following: number };
    preferences: {
        notifications: boolean;
        darkMode: boolean;
        language: 'tr' | 'en';
    };
}

export interface ActivityLog {
    id: string;
    type: 'walk' | 'vet' | 'shop' | 'game' | 'social';
    title: string;
    description: string;
    timestamp: string;
}

export interface IProfileService {
    getProfile(userId: string): Promise<UserProfile | null>;
    updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
    updateAvatar(userId: string, avatarUrl: string): Promise<void>;
    getActivityFeed(userId: string, limit?: number): Promise<ActivityLog[]>;
    updatePreferences(userId: string, prefs: Partial<UserProfile['preferences']>): Promise<void>;
    deleteAccount(userId: string): Promise<void>;
}
