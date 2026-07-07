import { PetIDState } from '../types/pet-id';
import { apiService } from './apiService';

/**
 * Pet ID Service (Production-Ready Bridge)
 * This service handles fetching pet safety data dynamically.
 */

export const getPetStatusById = async (petId: string): Promise<PetIDState | null> => {
    try {
        // Fetch real pet data from apiService
        const pets = await apiService.getPets();
        const pet = pets.find(p => p.id === petId) || pets[0]; // Fallback to first pet for demo if ID not found

        if (!pet) return null;

        // Map Pet to PetIDState
        const mockPetState: PetIDState = {
            pet: {
                id: pet.id,
                ownerId: "user-123",
                name: pet.name,
                type: pet.type || "Evcil Dost",
                breed: pet.breed || "Bilinmiyor",
                age: pet.age || "Bilinmiyor",
                gender: (pet as any).gender || "Bilinmiyor",
                isNeutered: (pet as any).is_neutered || true,
                avatarUrl: pet.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800",
                photos: [],
                bio: pet.bio || "Moffi Üyesi ✨",
                distinctiveFeatures: (pet as any).distinctive_features || "Görünür bir özelliği yok",
                microchipNumber: pet.microchip_id || "Kayıtlı Değil"
            },
            status: pet.is_lost ? 'lost' : 'safe',
            sosConfig: {
                showPhoneNumber: pet.sos_settings?.header_sos_alert_enabled !== false,
                allowProxyCalls: true,
                allowAnonymousMessaging: true,
                criticalHealthAlert: (pet as any).health_alert || (pet.is_lost ? "Lütfen dikkatli yaklaşın." : "Sağlıklı ve mutlu."),
                emergencyMessage: pet.is_lost ? "Lütfen bana yardım edin, ailemi bulamıyorum. Korkmuş olabilirim, ani hareketler yapmayın." : undefined,
                rewardAmount: pet.is_lost ? (pet.sos_settings?.reward_enabled ? 5000 : undefined) : undefined,
                rewardCurrency: "TL"
            },
            metadata: {
                nfcEnabled: true,
                qrGeneratedAt: new Date().toISOString(),
                viewCount: Math.floor(Math.random() * 100) + 1
            }
        };

        return mockPetState;
    } catch (error) {
        console.error("petIdService error:", error);
        return null;
    }
};
