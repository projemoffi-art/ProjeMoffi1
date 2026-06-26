import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService
} from './types';

import { SupabaseApiService } from './supabaseApiService';
import { MockApiService } from './mockApiService';

const useMock = typeof window !== 'undefined' && localStorage.getItem('moffi_force_mock') === 'true';

export const isSupabaseEnabled = !useMock;

export const apiService: IApiService = useMock ? new MockApiService() : new SupabaseApiService();
