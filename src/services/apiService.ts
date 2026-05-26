import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService
} from './types';

import { MockApiService } from './mockApiService';
import { SupabaseApiService } from './supabaseApiService';

// Production default: always use Supabase.
// Set NEXT_PUBLIC_FORCE_MOCK=true ONLY for isolated UI testing without backend.
const getForceMock = (): boolean => {
    if (process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') return true;
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem('moffi_force_mock') === 'true';
    } catch (e) {
        return false;
    }
};

const forceMock = getForceMock();

export const isSupabaseEnabled = !forceMock;

export const apiService: IApiService = forceMock
    ? new MockApiService()
    : new SupabaseApiService();
