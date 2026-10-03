import type { ShopCategory } from '@/services/types';

/** Mağaza kategorileri: müşteri vitrini (petshop) ve satıcı ürün formu aynı listeyi kullanır. */
export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = {
    food: 'Mama',
    snack: 'Atıştırmalık',
    toy: 'Oyuncak',
    care: 'Bakım',
    accessory: 'Aksesuar',
};

export const SHOP_CATEGORIES = Object.keys(SHOP_CATEGORY_LABELS) as ShopCategory[];
