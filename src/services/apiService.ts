import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService
} from './types';

import { MockApiService } from './mockApiService';
import { SupabaseApiService } from './supabaseApiService';

// Production default: always use Supabase.
// Set NEXT_PUBLIC_FORCE_MOCK=true ONLY for isolated UI testing without backend.
const forceMock = process.env.NEXT_PUBLIC_FORCE_MOCK === 'true';

export const apiService: IApiService = forceMock
    ? new MockApiService()
    : new SupabaseApiService();
