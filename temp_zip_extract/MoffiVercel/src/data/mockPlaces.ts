export interface Place {
    id: string;
    name: string;
    type: 'vet' | 'park' | 'cafe' | 'shop';
    lat: number;
    lng: number;
    description?: string;
    rating: number; // 0-5
    campaign?: {
        title: string;
        discount: string;
        expiresIn: string; // e.g., "2 saat"
    };
    coinReward: number; // Ziyaret edince kazanılacak coin
    isPremium: boolean; // Öne çıkan işletme
    image: string;
}

export const PLACES: Place[] = [
    {
        id: 'p1',
        name: 'Pati Kahvesi',
        type: 'cafe',
        lat: 41.0082,
        lng: 28.9784,
        description: 'Köpeğinizle kahve keyfi yapabileceğiniz en sıcak mekan.',
        rating: 4.8,
        campaign: {
            title: 'Kahve Alana Ödül Mama Bedava',
            discount: '%100 İndirim',
            expiresIn: '45 dk'
        },
        coinReward: 50,
        isPremium: true,
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400'
    },
    {
        id: 'p2',
        name: 'VetLife Clinic',
        type: 'vet',
        lat: 41.0122,
        lng: 28.9764,
        description: '7/24 Acil Müdahale ve modern ekipmanlar.',
        rating: 4.9,
        isPremium: true,
        coinReward: 100,
        image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=400'
    },
    {
        id: 'p3',
        name: 'Kadıköy Sahil Parkı',
        type: 'park',
        lat: 40.9902,
        lng: 29.0204,
        description: 'Geniş çim alanlar ve köpek oyun parkuru.',
        rating: 4.5,
        coinReward: 20,
        isPremium: false,
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=400'
    },
    {
        id: 'p4',
        name: 'Moffi Store',
        type: 'shop',
        lat: 41.0050,
        lng: 28.9800,
        description: 'En trend tasmalar ve oyuncaklar.',
        rating: 4.2,
        campaign: {
            title: 'Tüm Tasmalarda İndirim',
            discount: '%20 İndirim',
            expiresIn: '24 saat'
        },
        coinReward: 75,
        isPremium: true,
        image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400'
    },
    {
        id: 'p5',
        name: 'Mutlu Patiler Parkı',
        type: 'park',
        lat: 41.0150,
        lng: 28.9900,
        description: 'Arkadaş bulmak için harika bir yer.',
        rating: 4.0,
        coinReward: 10,
        isPremium: false,
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=400'
    }
];
