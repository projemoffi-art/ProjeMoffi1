export interface Pet {
    id: string;
    name: string;
    image: string;
    avatar?: string;
    avatar_url?: string;
    cover_photo?: string;
    cover_url?: string;
    type: string;
    breed: string;
    age: string;
    gender: 'Erkek' | 'Dişi' | string;
    bio?: string;
    personality?: string;
    is_lost?: boolean;
    microchip_id?: string;
    sos_settings?: {
        auto_post_sos: boolean;
        sos_radius: '2km' | '5km' | '10km' | 'city';
        secure_proxy_only: boolean;
        location_precision: 'exact' | 'area';
        emergency_sms_number: string;
        reward_amount: number;
        reward_currency: string;
        critical_health_note: string;
        last_seen_location?: string;
        finder_message: string;
        reward_enabled: boolean;
        header_sos_alert_enabled: boolean;
    };
}

export interface Post {
    id: number | string;
    user: {
        name: string;
        avatar: string;
        is_verified?: boolean;
    };
    media: string;
    caption: string;
    likes: number;
    comments: number;
    time: string;
    type?: 'image' | 'video';
}

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar: string;
    cover_photo?: string;
    bio?: string;
    is_verified?: boolean;
    subscription_status?: 'free' | 'plus' | 'pro';
    wallet_balance?: number;
    moffi_coins?: number;
    aura_settings?: {
        fontFamily: string;
        frameStyle: 'minimal' | 'glass' | 'neon' | 'metal';
        accentColor: string;
        badges: string[];
    };
}

export interface LostPet {
    id: number | string;
    pet_id?: string;
    name: string;
    img: string;
    location: string;
    last_seen_location?: string;
    reward_enabled?: boolean;
    dist: string;
    time: string;
    reward?: string;
    type?: string;
    description?: string;
}

export interface AdoptionPet extends LostPet {
    owner: string;
    phone: string;
}

// --- SHOP & STUDIO TYPES ---
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
    logo?: string;
    location?: string;
}

export type ProductType = 'apparel' | 'accessory' | 'home' | 'pet-apparel';

export interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: ProductType;
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

export type ShopCategory = 'food' | 'snack' | 'toy' | 'care' | 'accessory' | 'apparel' | 'home' | 'pet-apparel';

export interface ShopProduct extends Partial<Product> {
    id: string;
    name: string;
    brand_name?: string; // from SQL
    price: number;
    oldPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: ShopCategory;
    tag?: string;
    inStock: boolean;
    stockCount?: number;
    isRecentlyBought?: boolean;
    isVetApproved?: boolean;
    description?: string;
}

export interface ShopCartItem {
    productId: string;
    quantity: number;
    addedAt: string; // ISO timestamp
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShopOrder {
    id: string;
    userId: string;
    items: Array<{ product: ShopProduct; quantity: number }>;
    totalPrice: number;
    discountCode?: string;
    discountAmount?: number;
    shippingAddress: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}
