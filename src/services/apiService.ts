import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder
} from './types';

export interface IApiService {
    // Auth & Profile
    getCurrentUser(): Promise<UserProfile | null>;
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
    getAdoptions(): Promise<AdoptionPet[]>;
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

import { MockApiService } from './mockApiService';

// Global variable for easier debugging/toggling
export const isSupabaseEnabled = false;

export const apiService: IApiService = new MockApiService();
