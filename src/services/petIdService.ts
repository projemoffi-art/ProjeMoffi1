import { PetIDState } from '../types/pet-id';

/**
 * Pet ID Service (Mock/Bridge)
 * This service handles fetching pet safety data. 
 * In the future, this will be the bridge to Supabase.
 */

export const getPetStatusById = async (petId: string): Promise<PetIDState | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine status from ID string (for demo purposes)
    const isLost = petId.toLowerCase().includes('lost');
    const isMilo = petId.toLowerCase().includes('milo');

    // MOCK DATA GENERATOR
    const mockPetState: PetIDState = {
        pet: {
            id: petId,
            ownerId: "user-123",
            name: isMilo ? "Milo" : "Luna",
            type: isMilo ? "Cat" : "Dog",
            breed: isMilo ? "British Shorthair" : "Golden Retriever",
            age: isMilo ? "1 Yaşında" : "2 Yaşında",
            gender: isMilo ? "Male" : "Female",
            isNeutered: true,
            avatarUrl: isMilo 
                ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800"
                : "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800",
            photos: [],
            bio: isMilo 
                ? "Öğle uykusuna düşkün bir yakışıklı." 
                : "Oyun oynamayı çok sever. Yemek görürse dayanamaz. 🎾",
            distinctiveFeatures: isMilo ? "Sağ patisi beyaz" : "Sol kulağında küçük bir iz",
            microchipNumber: "TR-987654321"
        },
        status: isLost ? 'lost' : 'safe',
        sosConfig: {
            showPhoneNumber: true,
            allowProxyCalls: true,
            allowAnonymousMessaging: true,
            criticalHealthAlert: isMilo ? "Tüm aşıları tam." : "Piliç alerjisi var! Acil durumda lütfen piliç bazlı mama VERMEYİN.",
            emergencyMessage: isLost ? "Lütfen bana yardım edin, ailemi bulamıyorum. Korkmuş olabilirim, ani hareketler yapmayın." : undefined,
            rewardAmount: isLost ? 5000 : undefined,
            rewardCurrency: isLost ? "TL" : undefined
        },
        metadata: {
            nfcEnabled: true,
            qrGeneratedAt: new Date().toISOString(),
            viewCount: 42
        }
    };

    return mockPetState;
};
