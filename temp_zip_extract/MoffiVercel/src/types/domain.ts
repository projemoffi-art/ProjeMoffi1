export interface User {
    id: string;
    name: string;
    username?: string;
    display_name?: string;
    avatar: string;
    bio?: string;
    is_verified?: boolean;
    subscription_status?: 'free' | 'plus' | 'pro';
    joined_at?: string;
}

export interface FamilyMember extends User {
    role: 'Owner' | 'Admin' | 'Member';
    status: 'online' | 'busy' | 'offline';
    statusText: string;
}

export interface FamilyLog {
    id: string;
    user: string;
    action: string;
    time: string;
    iconType: 'Footprints' | 'Utensils' | 'Activity' | 'Heart' | 'Clock'; // Store string reference to icon
    color: string;
}

// Data Transfer Objects (if needed later)
export interface InviteRequest {
    email: string;
    role: FamilyMember['role'];
}

// --- WEATHER ---
export interface WeatherState {
    condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
    temp: number;
}

// --- VET / HEALTH ---
export interface VetDoctor {
    id: string;
    name: string;
    specialization: string;
    imageUrl: string;
    bio: string;
    workingHours: string;
}

export interface VetReview {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface VetClinic {
    id: string;
    name: string;
    location: { lat: number; lng: number };
    address: string;
    rating: number;
    reviewCount: number;
    isPremium: boolean;
    features: string[]; // e.g. "7/24", "Surgery"
    imageUrl: string;
    isOpenNow?: boolean;
    distance?: string; // Calculated UI prop
    doctors?: VetDoctor[];
    reviews?: VetReview[];
}

export interface VetAppointment {
    id: string;
    clinicId: string;
    clinicName: string;
    petId: string;
    petName: string;
    ownerName: string;
    date: string; // ISO YYYY-MM-DD
    time: string; // HH:mm
    type: 'general' | 'vaccine' | 'dental' | 'emergency';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    price?: number;
}

// --- GLOBAL VACCINE MODULE ---
export interface VaccineDefinition {
    id: string; // e.g. 'rabies'
    name: string;
    description: string;
    isCore: boolean; // "Zorunlu"
    frequencyMonths: number;
    minAgeWeeks: number;
    tags: string[]; // ['viral', 'zoonotic']
}

export interface VaccineRuleset {
    countryCode: string; // 'TR', 'US'
    version: string; // '2025.1'
    source: string; // 'Veterinary Association of Turkey'
    lastUpdated: string;
    definitions: VaccineDefinition[];
}

export interface UserVaccineRecord {
    id: string;
    petId: string;
    vaccineId: string; // Ref to Definition
    dateAdministered?: string;
    dueDate: string;
    status: 'completed' | 'pending' | 'overdue' | 'snoozed';
    vetName?: string;
}

// --- HEALTH EXTENSION ---
export interface PetMedication {
    id: string;
    petId: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
    startDate: string; // ISO
    endDate: string | null;
    isActive: boolean;
    lastLog?: string; // ISO of last taken time
}

export interface MedicationLog {
    id: string;
    medicationId: string;
    loggedAt: string;
}

export interface NutritionPlan {
    id: string;
    petId: string;
    foodName: string;
    amountGrams: number;
    mealsPerDay: number;
    targetWeight: number;
    notes: string;
    isActive: boolean;
}

// --- PETSHOP ---
export type ShopCategory = 'food' | 'snack' | 'toy' | 'care' | 'accessory';

export interface ShopProduct {
    id: string;
    name: string;
    brand: string;
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

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

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
    trackingNumber?: string;
}

// --- WALK ---
export interface WalkCheckpoint {
    lat: number;
    lng: number;
    timestamp: string;
}

export interface WalkSession {
    id: string;
    userId: string;
    petId: string;
    startTime: string;
    endTime?: string;
    distanceKm: number;
    durationMinutes: number;
    route: WalkCheckpoint[];
    caloriesBurned?: number;
    weather?: WeatherState;
    mood?: 'happy' | 'tired' | 'excited' | 'calm';
    notes?: string;
}

export interface WalkStats {
    totalWalks: number;
    totalDistanceKm: number;
    totalDurationMinutes: number;
    averageDistanceKm: number;
    longestWalkKm: number;
    currentStreak: number; // consecutive days
    bestStreak: number;
}

// --- GAME ---
export interface GameScore {
    id: string;
    userId: string;
    petId: string;
    score: number;
    coins: number;
    distance: number;
    missionsCompleted: number;
    playedAt: string;
    duration: number; // seconds
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar: string;
    highScore: number;
    totalCoins: number;
}
