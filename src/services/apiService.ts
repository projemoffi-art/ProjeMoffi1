// Uygulamanın tek veri katmanı. (2026-10-03: tarayıcı deposundaki "moffi_force_mock" anahtarıyla tüm uygulamayı sahte
// veriye geçiren MockApiService ve IApiService arayüzü kaldırıldı; tip doğrudan sınıftan gelir.)
import { SupabaseApiService } from './supabaseApiService';

export const apiService = new SupabaseApiService();
export type ApiService = SupabaseApiService;

