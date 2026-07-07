
export interface ProductColor {
    id: string;
    name: string;
    hex: string;
}

export interface ProductSize {
    id: string;
    label: string;
    priceModifier: number;
}

export interface ProductBrand {
    name: string;
    isMoffi: boolean;
    logo?: string; // Optional URL for partner logo
    location?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: 'apparel' | 'accessory' | 'home' | 'pet-apparel';
    brand: ProductBrand;
    colors: ProductColor[];
    sizes: ProductSize[];
    images: {
        front: string;
        back?: string;
        model?: string;
    };
    rating: number;
    reviewCount: number;
}

const PRODUCTS: Product[] = [
    {
        id: 'tshirt-classic',
        name: 'Premium T-Shirt',
        description: 'Moffi özel koleksiyonu, %100 pamuklu, nefes alabilen kumaş.',
        basePrice: 450,
        type: 'apparel',
        brand: { name: 'Moffi Original', isMoffi: true },
        colors: [
            { id: 'black', name: 'Black', hex: '#000000' },
            { id: 'white', name: 'White', hex: '#ffffff' },
            { id: 'charcoal', name: 'Charcoal', hex: '#2d3436' }
        ],
        sizes: [
            { id: 's', label: 'S', priceModifier: 0 },
            { id: 'm', label: 'M', priceModifier: 0 },
            { id: 'l', label: 'L', priceModifier: 0 },
            { id: 'xl', label: 'XL', priceModifier: 20 }
        ],
        images: {
            front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.9,
        reviewCount: 342
    },
    {
        id: 'hoodie-oversize',
        name: 'Oversize Hoodie',
        description: 'Şardonlu iç yüzey, bol kesim sokak stili hoodie.',
        basePrice: 850,
        type: 'apparel',
        brand: { name: 'Moffi Original', isMoffi: true },
        colors: [
            { id: 'black', name: 'Black', hex: '#000000' },
            { id: 'red', name: 'Red', hex: '#e35f5f' }
        ],
        sizes: [
            { id: 'm', label: 'M', priceModifier: 0 },
            { id: 'l', label: 'L', priceModifier: 0 }
        ],
        images: {
            front: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.8,
        reviewCount: 156
    },
    {
        id: 'ceramic-mug',
        name: 'Seramik Kupa',
        description: 'Premium seramik, bulaşık makinesinde yıkanabilir.',
        basePrice: 220,
        type: 'home',
        brand: { name: 'Moffi Home', isMoffi: true },
        colors: [{ id: 'white', name: 'White', hex: '#ffffff' }],
        sizes: [{ id: 'std', label: 'Standart', priceModifier: 0 }],
        images: {
            front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.7,
        reviewCount: 89
    },
    {
        id: 'tote-bag',
        name: 'Kanvas Çanta',
        description: 'Dayanıklı kanvas kumaş, geniş iç hacim.',
        basePrice: 180,
        type: 'accessory',
        brand: { name: 'Moffi Eco', isMoffi: true },
        colors: [{ id: 'beige', name: 'Beige', hex: '#f5f5dc' }],
        sizes: [{ id: 'std', label: 'Standart', priceModifier: 0 }],
        images: {
            front: 'https://images.unsplash.com/photo-1597484662317-c9253d3d0984?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.6,
        reviewCount: 201
    },
    {
        id: 'pet-bandana',
        name: 'Pet Bandana',
        description: 'Sevimli dostlarımız için renkli bandanalar.',
        basePrice: 150,
        type: 'accessory',
        brand: { name: 'Pati Butik', isMoffi: false, location: 'Moda' },
        colors: [{ id: 'red', name: 'Red', hex: '#ff0000' }],
        sizes: [{ id: 's', label: 'S', priceModifier: 0 }, { id: 'm', label: 'M', priceModifier: 0 }],
        images: {
            front: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.9,
        reviewCount: 45
    },
    {
        id: 'phone-case',
        name: 'Telefon Kılıfı',
        description: 'Darbeye dayanıklı özel tasarım kılıf.',
        basePrice: 290,
        type: 'accessory',
        brand: { name: 'TeknoPet', isMoffi: false },
        colors: [{ id: 'black', name: 'Black', hex: '#000000' }],
        sizes: [{ id: 'iphone14', label: 'iPhone 14', priceModifier: 0 }],
        images: {
            front: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.5,
        reviewCount: 78
    },
    {
        id: 'moffi-hoodie-pet',
        name: 'Moffi Pet Hoodie',
        description: 'Tüylü dostunuz için sıcak tutan özel tasarım hoodie.',
        basePrice: 350,
        type: 'pet-apparel',
        brand: { name: 'Moffi Original', isMoffi: true },
        colors: [
            { id: 'yellow', name: 'Yellow', hex: '#f1c40f' },
            { id: 'black', name: 'Black', hex: '#000000' }
        ],
        sizes: [
            { id: 's', label: 'S', priceModifier: 0 },
            { id: 'm', label: 'M', priceModifier: 0 },
            { id: 'l', label: 'L', priceModifier: 20 }
        ],
        images: {
            front: 'https://images.unsplash.com/photo-1548658166-136d9f6a7176?q=80&w=800&auto=format&fit=crop',
        },
        rating: 4.9,
        reviewCount: 210
    }
];

export const ProductMockService = {
    getProductById: async (id: string): Promise<Product | null> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return PRODUCTS.find(p => p.id === id) || null;
    },

    getAllProducts: async (category?: string): Promise<Product[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (category && category !== 'Tümü' && category !== 'all') {
            // Map UI categories to internal types
            const typeMap: Record<string, string> = {
                'Giyim': 'apparel',
                'Aksesuar': 'accessory',
                'Ev & Yaşam': 'home',
                'Pet Giyim': 'pet-apparel'
            };
            const targetType = typeMap[category] || category;
            return PRODUCTS.filter(p => p.type === targetType);
        }
        return PRODUCTS;
    },

    getPartnerShops: async () => {
        // Mock partner shops logic based on products or separate list
        // For now, returning hardcoded shops that are consistent with the page
        return [
            {
                id: 'shop-1',
                name: 'Pati Butik',
                location: 'Caddebostan',
                rating: 4.8,
                image: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?q=80&w=800&auto=format&fit=crop',
                tags: ['El Yapımı', 'Aksesuar']
            },
            {
                id: 'shop-2',
                name: 'Woof Design',
                location: 'Moda',
                rating: 4.9,
                image: 'https://images.unsplash.com/photo-1556905200-279565513a2d?q=80&w=800&auto=format&fit=crop',
                tags: ['Premium', 'Giyim']
            },
            {
                id: 'shop-3',
                name: 'Happy Paws',
                location: 'Beşiktaş',
                rating: 4.6,
                image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop',
                tags: ['Oyuncak', 'Yaşam']
            }
        ];
    }
};
