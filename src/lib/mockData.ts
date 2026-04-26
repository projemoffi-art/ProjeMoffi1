import { Profile, Pet, Post } from "@/types/database";

/**
 * MOFFI CENTRAL CLOUD SIMULATION (MOCK DATABASE)
 * Bu yapı Supabase tablolarını taklit eder.
 */

export const MOCK_PROFILES: Profile[] = [
    {
        id: 'user-moffi-official',
        username: 'MoffiOfficial',
        full_name: 'Moffi Official',
        avatar_url: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400',
        cover_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200',
        bio: 'Moffi Dünyasının Resmi Haber ve Destek Merkezi. 🐾 Geleceğin evcil hayvan ekosistemini birlikte inşa ediyoruz. #MoffiOfficial',
        location: 'Moffi HQ, Global',
        is_premium: true,
        followers_count: 154200,
        following_count: 12,
        posts_count: 8
    },
    {
        id: 'user-milo',
        username: 'MiloAndLuna',
        full_name: 'Milo & Luna',
        avatar_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400",
        cover_url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1200",
        bio: "Öğle uykusu sendromu... Lütfen rahatsız etmeyin. 😴🐾",
        location: "Beşiktaş, TR",
        is_premium: true,
        followers_count: 1240,
        following_count: 850,
        posts_count: 42
    },
    {
        id: 'user-max',
        username: 'HuskyMax',
        full_name: 'Max',
        avatar_url: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=400",
        cover_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200",
        bio: "Kar ne zaman yağacak? Beklemekten sıkıldım! ❄️🐺",
        location: "Sarıyer, TR",
        is_premium: true,
        followers_count: 1240,
        following_count: 850,
        posts_count: 42
    },
    {
        id: 'user-stranger',
        username: 'StrangerPaws',
        full_name: 'Yabancı Pati',
        avatar_url: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=400",
        cover_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200",
        bio: "Yeni yerler keşfetmeyi seviyorum! 🌲",
        location: "Kadıköy, TR",
        is_premium: false,
        followers_count: 320,
        following_count: 150,
        posts_count: 12
    }
];

export const MOCK_PETS: Pet[] = [
    {
        id: 'pet-milo',
        owner_id: 'user-milo',
        name: 'Milo & Luna',
        type: 'cat',
        breed: 'Tekir / Mix',
        birth_date: '2022-06-12',
        gender: 'Karma',
        avatar_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=800',
        microchip_id: '900111222333444',
        is_lost: false
    },
    {
        id: 'pet-max',
        owner_id: 'user-max',
        name: 'Max',
        type: 'dog',
        breed: 'Husky',
        birth_date: '2020-11-20',
        gender: 'Erkek',
        avatar_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800',
        microchip_id: '900555444333222',
        is_lost: false
    }
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'post-official-1',
        user_id: 'user-moffi-official',
        author_name: 'MoffiOfficial',
        author_avatar: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400',
        media_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800',
        caption: 'Moffi Prime Ekosistemine Hoş Geldiniz! 🚀 Evcil hayvanlarınız için geleceğin dijital dünyasını inşa ediyoruz. #MoffiOfficial #Prime',
        theme: 'premium',
        likes_count: 5420,
        comments_count: 124,
        is_liked: false,
        created_at: new Date().toISOString()
    },
    {
        id: 'post-official-2',
        user_id: 'user-moffi-official',
        author_name: 'MoffiOfficial',
        author_avatar: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400',
        media_url: 'https://images.unsplash.com/photo-1576091160550-2173bdd99625?q=80&w=800',
        caption: 'Yapay Zeka Destekli "Neural Link" özelliği çok yakında tüm pet pasaportlarında aktif olacak. 🧠🐾 #MoffiTech',
        theme: 'ai',
        likes_count: 3210,
        comments_count: 85,
        is_liked: false,
        created_at: new Date().toISOString()
    },
    {
        id: 'post-test-owner',
        user_id: 'user-milo',
        author_name: 'MiloAndLuna',
        author_avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400',
        media_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
        caption: 'Moffi Ekosistemine hoş geldin! Bu kendi postum. Tıklayınca Yönetim Merkezi açılmalı. 🐾⚡',
        theme: 'social',
        likes_count: 500,
        comments_count: 10,
        is_liked: true,
        created_at: '2025-04-05T15:00:00Z'
    },
    {
        id: 'post-test-stranger',
        user_id: 'user-stranger',
        author_name: 'StrangerPaws',
        author_avatar: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=400',
        media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800',
        caption: 'Harika bir keşif turu! Bu başkasının postu. Tıklayınca Ziyaretçi Ekranı açılmalı. 🌲📍',
        theme: 'social',
        likes_count: 320,
        comments_count: 8,
        is_liked: false,
        created_at: '2025-04-06T11:00:00Z'
    }
];

/**
 * HELPER FUNCTIONS (SIMULATED DB QUERIES)
 */
export const getMockProfile = (id: string): Profile | null => {
    return MOCK_PROFILES.find(p => p.id.toLowerCase() === id.toLowerCase()) || null;
};

export const getMockPets = (userId: string): Pet[] => {
    return MOCK_PETS.filter(p => p.owner_id.toLowerCase() === userId.toLowerCase());
};

export const getMockPosts = (userId: string): Post[] => {
    return MOCK_POSTS.filter(p => p.user_id.toLowerCase() === userId.toLowerCase());
};

// --- LEGACY EXPORTS (Compatibility for existing components) ---
export const MOCK_NOTIFICATIONS = [
    { id: 2, type: 'comment', user: '@moffi_admin', avatar: '', isSystem: true, text: 'Günün en güzel karesi ödülüne çok yakınsın! 🏆', time: '1 gün önce', read: true }
];

export const ORDERS = [
    { id: 'ord-1', item: "Premium Köpek Maması", status: "Teslim Edildi", date: "12 Ara 2025", price: "450 TL", img: "https://images.unsplash.com/photo-1589924691195-41432c84c161?q=80&w=100" },
    { id: 'ord-2', item: "Moffi Özel Tasarım Tasma", status: "Kargoda", date: "14 Ara 2025", price: "250 TL", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=100" },
];

export const APPOINTMENTS = [
    { id: 'apt-1', clinic: "VetLife Clinic", type: "Genel Muayene", date: "18 Ara, 14:30", status: "Onaylandı" }
];

export const WALLET_TRANSACTIONS = [
    { id: 1, type: 'earn', label: 'Pet Gezdirmesi', amount: 50, date: 'Bugün' },
    { id: 2, type: 'earn', label: 'Sağlık Kaydı Ödülü', amount: 20, date: 'Dün' },
    { id: 3, type: 'spend', label: 'Mama Siparişi', amount: -400, date: '12 Ara' },
];

export const MOCK_LOST_PETS = [
    { id: '1', pet_name: "Gofret", breed: "Golden Retriever", last_seen_location: "Kadiköy Sahil", description: "Tasması yok, çok uysal.", photos: ["https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400"] },
    { id: '2', pet_name: "Mırmır", breed: "Tekir", last_seen_location: "Beşiktaş", description: "Sol kulağı kesik.", photos: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400"] }
];

export const MOCK_ADOPTIONS = [
    { id: '1', pet_name: "Pamuk", breed: "Ankara Kedisi", age: "2 Aylık", description: "Yuva arıyor.", photos: ["https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=400"], type: "cat" },
    { id: '2', pet_name: "Duman", breed: "Russian Blue", age: "1 Yaşında", description: "Çok sakin.", photos: ["https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=400"], type: "cat" }
];

export const PET_PERSONALITIES: Record<string, any> = {
    'Milo': {
        mood: 'Enerjik ⚡'
    },
    'default': {
        mood: 'Mutlu ✨'
    }
};
