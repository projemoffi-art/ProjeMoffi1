import { IProfileService, UserProfile, ActivityLog } from "@/services/interfaces";

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

const MOCK_ACTIVITY: ActivityLog[] = [
    { id: 'a1', type: 'walk', title: 'Yürüyüş tamamlandı', description: '2.3 km · Kadıköy', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a2', type: 'vet', title: 'Veteriner randevusu', description: 'Dr. Ayşe Kaya · Genel kontrol', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'a3', type: 'shop', title: 'Alışveriş yapıldı', description: '3 ürün · ₺267', timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: 'a4', type: 'game', title: 'Yüksek skor!', description: 'Moffi Run · 8,420 puan', timestamp: new Date(Date.now() - 259200000).toISOString() },
    { id: 'a5', type: 'social', title: 'Yeni gönderi beğenildi', description: '12 beğeni aldı', timestamp: new Date(Date.now() - 345600000).toISOString() },
];

export class ProfileMockService implements IProfileService {
    private profiles: Map<string, UserProfile> = new Map();

    constructor() {
        // Default profile
        this.profiles.set('user-milo', {
            id: 'user-milo',
            username: 'MiloAndLuna',
            email: 'milo@moffi.com',
            bio: 'Moffi ile her gün yeni maceralar 🐾',
            joinedAt: '2025-06-15T10:00:00Z',
            stats: { posts: 42, followers: 128, following: 67 },
            preferences: { notifications: true, darkMode: false, language: 'tr' },
        });
    }

    async getProfile(userId: string): Promise<UserProfile | null> {
        await delay();
        return this.profiles.get(userId) || null;
    }

    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        await delay(300);
        const current = this.profiles.get(userId);
        if (!current) throw new Error('Profil bulunamadı');

        // Validation
        if (updates.username !== undefined && updates.username.trim().length < 2) {
            throw new Error('Kullanıcı adı en az 2 karakter olmalı');
        }
        if (updates.bio !== undefined && updates.bio.length > 500) {
            throw new Error('Biyografi en fazla 500 karakter olabilir');
        }

        const updated: UserProfile = { ...current, ...updates };
        this.profiles.set(userId, updated);
        return updated;
    }

    async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
        await delay(500);
        const current = this.profiles.get(userId);
        if (!current) throw new Error('Profil bulunamadı');
        current.avatar = avatarUrl;
        this.profiles.set(userId, current);
    }

    async getActivityFeed(userId: string, limit = 10): Promise<ActivityLog[]> {
        await delay(200);
        return MOCK_ACTIVITY.slice(0, limit);
    }

    async updatePreferences(userId: string, prefs: Partial<UserProfile['preferences']>): Promise<void> {
        await delay(200);
        const current = this.profiles.get(userId);
        if (!current) throw new Error('Profil bulunamadı');
        current.preferences = { ...current.preferences, ...prefs };
        this.profiles.set(userId, current);
    }

    async deleteAccount(userId: string): Promise<void> {
        await delay(500);
        this.profiles.delete(userId);
    }
}
