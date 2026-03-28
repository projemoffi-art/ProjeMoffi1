import { IVetService } from "../interfaces";
import { VetClinic, VetAppointment } from "@/types/domain";

// --- MOCK DB ---
const MOCK_CLINICS: VetClinic[] = [
    { id: "1", name: "VetLife Global Clinic", location: { lat: 40.9682, lng: 29.0734 }, address: "Fenerbahçe, Kadıköy", rating: 4.9, reviewCount: 342, isPremium: true, features: ["7/24 Acil", "Laboratuv", "Röntgen"], imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800", isOpenNow: true },
    { id: "2", name: "Paws & Care Center", location: { lat: 40.9723, lng: 29.0645 }, address: "Suadiye, Kadıköy", rating: 4.7, reviewCount: 84, isPremium: false, features: ["Cerrahi", "Kuaför"], imageUrl: "https://images.unsplash.com/photo-1628009368231-76033527212e?w=800", isOpenNow: true },
    { id: "3", name: "Acil Vet 24/7", location: { lat: 40.9851, lng: 29.0512 }, address: "Moda, Kadıköy", rating: 4.8, reviewCount: 210, isPremium: true, features: ["Acil Müdahale", "Yoğun Bakım"], imageUrl: "https://images.unsplash.com/photo-1599443015574-be5fe85b3b97?w=800", isOpenNow: true },
    { id: "4", name: "Moda Pati Hastanesi", location: { lat: 40.9850, lng: 29.0300 }, address: "Caferağa, Kadıköy", rating: 4.6, reviewCount: 156, isPremium: false, features: ["Diş", "Check-up"], imageUrl: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800", isOpenNow: false },
    { id: "5", name: "Bağdat Pet Sağlık", location: { lat: 40.9600, lng: 29.0800 }, address: "Erenköy, Kadıköy", rating: 5.0, reviewCount: 42, isPremium: true, features: ["Lüks Bakım", "Spa"], imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800", isOpenNow: true },
];

let MOCK_APPOINTMENTS: VetAppointment[] = [];

export class VetMockService implements IVetService {

    // --- CLINICS ---

    async getNearbyClinics(lat: number, lng: number, radiusKm: number = 10): Promise<VetClinic[]> {
        await this.simulateNetworkDelay();
        return Promise.resolve([...MOCK_CLINICS]);
    }

    async getFeaturedClinics(): Promise<VetClinic[]> {
        await this.simulateNetworkDelay();
        // Return premium clinics or clinics with 4.8+ rating
        return MOCK_CLINICS.filter(c => c.isPremium || c.rating >= 4.8);
    }

    async getAllClinics(): Promise<VetClinic[]> {
        await this.simulateNetworkDelay();
        return [...MOCK_CLINICS];
    }

    async getClinicDetails(id: string): Promise<VetClinic | null> {
        // [STUB] Real Implementation:
        // return api.get(`/vet/clinics/${id}`);

        await this.simulateNetworkDelay();
        const clinic = MOCK_CLINICS.find(c => c.id === id);
        return Promise.resolve(clinic || null);
    }

    // --- APPOINTMENTS ---

    async createAppointment(dto: Omit<VetAppointment, 'id' | 'status'>): Promise<VetAppointment> {
        // [STUB] Real Implementation:
        // return api.post('/vet/appointments', dto);

        await this.simulateNetworkDelay();

        const newAppointment: VetAppointment = {
            ...dto,
            id: Date.now().toString(),
            status: 'pending'
        };

        MOCK_APPOINTMENTS.push(newAppointment);
        console.log("[VetMockService] Appointment created:", newAppointment);

        return Promise.resolve(newAppointment);
    }

    async getAppointments(userId: string): Promise<VetAppointment[]> {
        // [STUB] Real Implementation:
        // return api.get(`/vet/appointments?userId=${userId}`);

        await this.simulateNetworkDelay();
        return Promise.resolve([...MOCK_APPOINTMENTS]);
    }

    async cancelAppointment(id: string): Promise<void> {
        // [STUB] Real Implementation:
        // return api.delete(`/vet/appointments/${id}`);

        await this.simulateNetworkDelay();
        MOCK_APPOINTMENTS = MOCK_APPOINTMENTS.filter(a => a.id !== id);
        return Promise.resolve();
    }

    // --- HELPERS ---
    private simulateNetworkDelay() {
        return new Promise(resolve => setTimeout(resolve, 800)); // 800ms realistic mobile delay
    }
}
