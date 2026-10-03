"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, X } from 'lucide-react';
import { apiService } from '@/services/apiService';
import type { ShopOrder } from '@/services/types';
import { orderStage, ORDER_STAGE_LABEL } from '@/lib/shop/orderStatus';

/**
 * Ödeme sayfasından dönüşte gösterilir. PayTR'nin "başarılı" yönlendirmesi ödemenin onaylandığı anlamına gelmez:
 * sipariş ancak PayTR bildirimi (webhook → finalize_paid_order) gelince "paid" olur. Bu yüzden siparişin
 * veritabanındaki gerçek durumu okunur; henüz onay yoksa bunu açıkça söyler.
 */
export function OrderPlacedSheet({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const [order, setOrder] = React.useState<ShopOrder | null | undefined>(undefined);

    const load = React.useCallback(() => {
        apiService.getOrders()
            .then(list => setOrder(list.find(o => o.id === orderId) ?? null))
            .catch(() => setOrder(null));
    }, [orderId]);

    React.useEffect(() => {
        load();
        // Onay birkaç saniye içinde gelir; bu sürede kısa aralıklarla yeniden bakılır.
        const t = window.setInterval(load, 4000);
        const stop = window.setTimeout(() => window.clearInterval(t), 40000);
        return () => { window.clearInterval(t); window.clearTimeout(stop); };
    }, [load]);

    const stage = order ? orderStage(order) : null;
    const confirmed = stage === 'preparing' || stage === 'shipped' || stage === 'delivered';

    return (
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <motion.div
                    initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="relative w-full max-w-md bg-card border border-card-border rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8"
                >
                    <button onClick={onClose} aria-label="Kapat" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center">
                        <X className="w-4 h-4 text-foreground" />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                        {confirmed ? <CheckCircle2 className="w-6 h-6 text-accent" /> : <Clock className="w-6 h-6 text-accent" />}
                    </div>
                    <h3 className="text-[20px] font-black text-foreground">
                        {confirmed ? 'Siparişin alındı' : stage === 'cancelled' ? 'Ödeme tamamlanmadı' : 'Ödeme onayı bekleniyor'}
                    </h3>
                    <p className="text-[14px] font-semibold text-secondary mt-2 leading-relaxed">
                        {order === undefined && 'Sipariş bilgisi okunuyor…'}
                        {order === null && 'Sipariş bilgisi okunamadı. Profil → Siparişlerim bölümünden durumu görebilirsin.'}
                        {order && confirmed && 'Satıcı hazırlayıp kargoya verdiğinde bildirim gelecek. Durumu Profil → Siparişlerim bölümünden izleyebilirsin.'}
                        {order && stage === 'awaiting_payment' && 'Ödeme kuruluşundan onay bekleniyor; genelde birkaç saniye sürer. Onay gelince bildirim alırsın.'}
                        {order && stage === 'cancelled' && 'Bu siparişin ödemesi onaylanmadı. Sepetinden tekrar deneyebilirsin.'}
                    </p>
                    {order && stage && (
                        <p className="mt-4 text-[13px] font-bold text-foreground">
                            {order.items.length} ürün · {order.totalPrice.toLocaleString('tr-TR')} ₺ · {ORDER_STAGE_LABEL[stage]}
                        </p>
                    )}
                    <button onClick={onClose} className="mt-6 w-full py-3.5 rounded-xl bg-foreground text-background font-black text-[14px]">Tamam</button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
