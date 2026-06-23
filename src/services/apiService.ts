import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService
} from './types';

import { SupabaseApiService } from './supabaseApiService';

export const isSupabaseEnabled = true;

export const apiService: IApiService = new SupabaseApiService();
