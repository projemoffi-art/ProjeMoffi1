/**
 * Moffi Pet ID & SOS Architecture Types
 * This file defines the core structural models for the Hybrid QR/NFC system.
 */

export type PetStatus = 'safe' | 'lost';

export interface PetSOSConfig {
    showPhoneNumber: boolean;
    allowProxyCalls: boolean;
    allowAnonymousMessaging: boolean;
    criticalHealthAlert?: string;
    emergencyMessage?: string;
    rewardAmount?: number;
    rewardCurrency?: string;
}

export interface PetProfile {
    id: string; // Unique Pet ID (UUID or Slug)
    ownerId: string;
    name: string;
    type: 'Dog' | 'Cat' | 'Bird' | 'Other' | string;
    breed: string;
    age: string;
    gender: 'Male' | 'Female' | string;
    isNeutered: boolean;
    avatarUrl: string;
    photos: string[];
    bio: string;
    distinctiveFeatures?: string;
    microchipNumber?: string;
}

export interface PetIDState {
    pet: PetProfile;
    status: PetStatus;
    sosConfig: PetSOSConfig;
    lastSeenLocation?: {
        lat: number;
        lng: number;
        timestamp: string;
    };
    metadata: {
        nfcEnabled: boolean;
        qrGeneratedAt: string;
        viewCount: number;
    };
}
