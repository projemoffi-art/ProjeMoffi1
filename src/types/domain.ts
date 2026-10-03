// Uygulama düzeyi alan tipleri (veritabanı satır tipleri: types/supabase.ts). 2026-10-04: hiçbir yerde kullanılmayan
// tipler (aile, hava, aşı kural seti, ilaç günlüğü, oyun skoru, yürüyüş oturumu vb. — eski sahte servislerden kalma) silindi.

// --- VET / HEALTH ---
/** İşletmenin aktif personeli (doctors: ad, unvan, fotoğraf). */
export interface VetDoctor {
    id: string;
    name: string;
    specialization: string | null;
    imageUrl: string | null;
}

export interface Doctor {
    id: string;
    clinic_id: string;
    name: string;
    title?: string | null;
    photo_url?: string | null;
    is_active: boolean;
    created_at?: string;
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
    /** Konumu girilmemiş işletmede yok. */
    location: { lat: number; lng: number } | null;
    address: string;
    rating: number;
    reviewCount: number;
    isPremium?: boolean;
    features?: string[]; // e.g. "7/24", "Surgery"
    imageUrl: string | null;
    isOpenNow?: boolean;
    distance?: string; // Calculated UI prop
    /** Kullanıcı konumuna göre sunucu sorgusunda hesaplanan mesafe (km); konum yoksa tanımsız. */
    calculated_distance?: number;
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

// --- PETSHOP --- (tek tanım services/types'ta)
export type { ShopCategory, ShopProduct, ShopCartItem, ShopOrder, OrderStatus } from '@/services/types';

// --- WALK ---
export interface WalkStats {
    totalWalks: number;
    totalDistanceKm: number;
    totalDurationMinutes: number;
    averageDistanceKm: number;
    longestWalkKm: number;
    currentStreak: number; // consecutive days
    bestStreak: number;
}
