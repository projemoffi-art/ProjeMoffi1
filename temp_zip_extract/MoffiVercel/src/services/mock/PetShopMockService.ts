import { IPetShopService } from "@/services/interfaces";
import { ShopProduct, ShopCategory, ShopOrder, ShopCartItem } from "@/types/domain";

// ==========================================
// MOCK DATA — 16 pet shop products
// ==========================================
const MOCK_PRODUCTS: ShopProduct[] = [
    // MAMA
    { id: 'ps-1', name: 'Pro Plan Adult Kedi Maması', brand: 'Purina', price: 649, oldPrice: 799, rating: 4.8, reviews: 1243, image: '🐱', category: 'food', tag: 'Çok Satan', inStock: true, stockCount: 45, isRecentlyBought: true, isVetApproved: true },
    { id: 'ps-2', name: 'Royal Canin Indoor', brand: 'Royal Canin', price: 879, rating: 4.9, reviews: 892, image: '🏠', category: 'food', tag: 'Premium', inStock: true, stockCount: 30, isVetApproved: true },
    { id: 'ps-3', name: 'Acana Wild Prairie', brand: 'Acana', price: 1249, rating: 4.7, reviews: 456, image: '🌾', category: 'food', inStock: true, stockCount: 18, isVetApproved: true },
    { id: 'ps-4', name: 'Hills Science Diet Kitten', brand: 'Hills', price: 549, oldPrice: 699, rating: 4.6, reviews: 678, image: '🍼', category: 'food', tag: 'İndirimli', inStock: true, stockCount: 22 },
    // ATIŞTIRMALIK
    { id: 'ps-5', name: 'Dreamies Peynirli Kedi Ödülü', brand: 'Dreamies', price: 49, rating: 4.9, reviews: 2341, image: '🧀', category: 'snack', tag: 'Favori', inStock: true, stockCount: 120, isRecentlyBought: true },
    { id: 'ps-6', name: 'Inaba Churu Ton Balıklı', brand: 'Inaba', price: 89, oldPrice: 119, rating: 4.8, reviews: 1567, image: '🐟', category: 'snack', inStock: true, stockCount: 85 },
    { id: 'ps-7', name: 'Vitakraft Yürekli Sticks', brand: 'Vitakraft', price: 39, rating: 4.5, reviews: 345, image: '💛', category: 'snack', inStock: true, stockCount: 65, isRecentlyBought: true },
    // OYUNCAK
    { id: 'ps-8', name: 'Lazer Pointer Kedi Oyuncağı', brand: 'PetFun', price: 129, rating: 4.7, reviews: 892, image: '🔴', category: 'toy', tag: 'Popüler', inStock: true, stockCount: 34 },
    { id: 'ps-9', name: 'Tüylü Olta Kedi Oyuncağı', brand: 'CatPlay', price: 79, rating: 4.6, reviews: 567, image: '🪶', category: 'toy', inStock: true, stockCount: 50 },
    { id: 'ps-10', name: 'Kedi Tüneli (3 Yollu)', brand: 'PetPalace', price: 249, oldPrice: 349, rating: 4.8, reviews: 234, image: '🌀', category: 'toy', tag: 'İndirimli', inStock: true, stockCount: 12 },
    // BAKIM
    { id: 'ps-11', name: 'Furminator Tüy Bakım Fırçası', brand: 'Furminator', price: 399, rating: 4.9, reviews: 1890, image: '✨', category: 'care', tag: 'Çok Satan', inStock: true, stockCount: 28, isRecentlyBought: true, isVetApproved: true },
    { id: 'ps-12', name: 'Pire & Kene Damlası (3lü)', brand: 'Frontline', price: 329, rating: 4.7, reviews: 1123, image: '💧', category: 'care', inStock: true, stockCount: 40, isVetApproved: true },
    { id: 'ps-13', name: 'Kedi Şampuanı Doğal', brand: 'BioGroom', price: 189, oldPrice: 229, rating: 4.5, reviews: 456, image: '🫧', category: 'care', inStock: true, stockCount: 55 },
    // AKSESUAR
    { id: 'ps-14', name: 'GPS Takip Tasması', brand: 'PetTrack', price: 599, rating: 4.6, reviews: 789, image: '📍', category: 'accessory', tag: 'Yeni', inStock: true, stockCount: 15 },
    { id: 'ps-15', name: 'Akıllı Kedi Kapısı', brand: 'SureFlap', price: 1899, rating: 4.8, reviews: 234, image: '🚪', category: 'accessory', tag: 'Premium', inStock: true, stockCount: 8, isVetApproved: true },
    { id: 'ps-16', name: 'Kedi Yatağı — Donut', brand: 'PetNest', price: 279, oldPrice: 399, rating: 4.7, reviews: 567, image: '🍩', category: 'accessory', tag: 'İndirimli', inStock: true, stockCount: 20 },
];

const DISCOUNT_CODES: Record<string, number> = {
    'MOFFI20': 20,
    'WELCOME10': 10,
    'PETLOVE15': 15,
};

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export class PetShopMockService implements IPetShopService {
    private cart: Map<string, ShopCartItem[]> = new Map();
    private orders: ShopOrder[] = [];

    async getProducts(category?: ShopCategory): Promise<ShopProduct[]> {
        await delay();
        if (!category) return [...MOCK_PRODUCTS];
        return MOCK_PRODUCTS.filter(p => p.category === category);
    }

    async getProductById(id: string): Promise<ShopProduct | null> {
        await delay(100);
        return MOCK_PRODUCTS.find(p => p.id === id) || null;
    }

    async searchProducts(query: string): Promise<ShopProduct[]> {
        await delay(200);
        const q = query.toLowerCase();
        return MOCK_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            (p.tag && p.tag.toLowerCase().includes(q))
        );
    }

    async getCart(userId: string): Promise<ShopCartItem[]> {
        await delay(100);
        return this.cart.get(userId) || [];
    }

    async addToCart(userId: string, productId: string, quantity: number): Promise<void> {
        await delay(100);
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        if (!product) throw new Error('Ürün bulunamadı');
        if (!product.inStock) throw new Error('Ürün stokta yok');
        if (product.stockCount !== undefined && quantity > product.stockCount) {
            throw new Error(`Stokta sadece ${product.stockCount} adet var`);
        }

        const items = this.cart.get(userId) || [];
        const existing = items.find(i => i.productId === productId);
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (product.stockCount !== undefined && newQty > product.stockCount) {
                throw new Error(`Maksimum ${product.stockCount} adet ekleyebilirsiniz`);
            }
            existing.quantity = newQty;
        } else {
            items.push({ productId, quantity, addedAt: new Date().toISOString() });
        }
        this.cart.set(userId, items);
    }

    async updateCartItem(userId: string, productId: string, quantity: number): Promise<void> {
        await delay(100);
        if (quantity < 1) throw new Error('Miktar en az 1 olmalı');
        if (quantity > 99) throw new Error('Maksimum 99 adet ekleyebilirsiniz');

        const items = this.cart.get(userId) || [];
        const item = items.find(i => i.productId === productId);
        if (item) item.quantity = quantity;
        this.cart.set(userId, items);
    }

    async removeFromCart(userId: string, productId: string): Promise<void> {
        await delay(100);
        const items = (this.cart.get(userId) || []).filter(i => i.productId !== productId);
        this.cart.set(userId, items);
    }

    async clearCart(userId: string): Promise<void> {
        await delay(100);
        this.cart.set(userId, []);
    }

    async createOrder(order: Omit<ShopOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ShopOrder> {
        await delay(500);
        const now = new Date().toISOString();
        const newOrder: ShopOrder = {
            ...order,
            id: `order-${Date.now()}`,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        this.orders.push(newOrder);
        // Clear cart after order
        await this.clearCart(order.userId);
        return newOrder;
    }

    async getOrders(userId: string): Promise<ShopOrder[]> {
        await delay(200);
        return this.orders.filter(o => o.userId === userId).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async getOrderById(id: string): Promise<ShopOrder | null> {
        await delay(100);
        return this.orders.find(o => o.id === id) || null;
    }

    async validateDiscount(code: string): Promise<{ valid: boolean; discountPercent?: number; message?: string }> {
        await delay(200);
        const upper = code.toUpperCase().trim();
        const percent = DISCOUNT_CODES[upper];
        if (percent) {
            return { valid: true, discountPercent: percent, message: `%${percent} indirim uygulandı!` };
        }
        return { valid: false, message: 'Geçersiz indirim kodu' };
    }
}
