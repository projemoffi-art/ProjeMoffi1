import type { ShopOrder } from '@/services/types';

/**
 * Siparişin kullanıcıya gösterilen aşaması — yalnızca veritabanındaki gerçek durumlardan türetilir.
 * orders.status: pending (ödeme bekleniyor, expires_at'e kadar) → paid | cancelled.
 * order_items.status (satıcı başına): awaiting_payment → preparing → shipped → delivered | cancelled.
 */
export type OrderStage = 'awaiting_payment' | 'cancelled' | 'preparing' | 'shipped' | 'delivered';

export const ORDER_STAGE_LABEL: Record<OrderStage, string> = {
    awaiting_payment: 'Ödeme bekleniyor',
    cancelled: 'İptal edildi',
    preparing: 'Hazırlanıyor',
    shipped: 'Kargoda',
    delivered: 'Teslim edildi',
};

export const ITEM_STATUS_LABEL: Record<string, string> = {
    awaiting_payment: 'Ödeme bekleniyor',
    preparing: 'Hazırlanıyor',
    shipped: 'Kargoda',
    delivered: 'Teslim edildi',
    cancelled: 'İptal edildi',
};

export function orderStage(order: ShopOrder, now = Date.now()): OrderStage {
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'pending' || order.status === 'awaiting_payment') {
        return order.expiresAt && new Date(order.expiresAt).getTime() < now ? 'cancelled' : 'awaiting_payment';
    }
    const live = order.items.filter(i => i.status !== 'cancelled');
    if (live.length === 0) return 'cancelled';
    if (live.every(i => i.status === 'delivered')) return 'delivered';
    if (live.some(i => i.status === 'shipped' || i.status === 'delivered')) return 'shipped';
    return 'preparing';
}

/** Ürünler farklı satıcılardan geliyorsa aşamalar ayrı ilerleyebilir: "1/2 satıcı kargoya verdi" gibi. */
export function partialNote(order: ShopOrder): string | null {
    const live = order.items.filter(i => i.status !== 'cancelled');
    const moved = live.filter(i => i.status === 'shipped' || i.status === 'delivered').length;
    if (moved === 0 || moved === live.length) return null;
    return `${live.length} üründen ${moved} tanesi kargoya verildi`;
}
