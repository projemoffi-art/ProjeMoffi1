/**
 * KVKK veri taşınabilirliği: kullanıcının hesabındaki kayıtları tek JSON dosyası olarak indirir.
 * Yalnızca gerçekten okunan veriler yazılır (uydurma alan ya da sıfır bakiye yok).
 */
import type { User } from '@/context/AuthContext';

export interface UserDataPackage {
    user: User;
    pets: unknown[];
    posts: unknown[];
    adoptions: unknown[];
    notifications: unknown[];
    orders: unknown[];
    chats: unknown[];
    walkStats: unknown;
    pawCoin: { balance: number; history: unknown[] };
}

export const exportUserData = ({ user, pets, posts, adoptions, notifications, orders, chats, walkStats, pawCoin }: UserDataPackage) => {
    const exportData = {
        export_date: new Date().toISOString(),
        platform: 'Moffi',
        account: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            joined_at: user.joinedAt,
            bio: user.bio,
            avatar_url: user.avatar,
            is_prime: !!user.is_prime,
        },
        preferences: user.settings ?? {},
        pets,
        content: { posts, adoption_ads: adoptions },
        social: { notifications, conversations: chats },
        activity: { orders, walks: walkStats },
        paw_coin: pawCoin,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moffi_verilerim_${user.username}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
