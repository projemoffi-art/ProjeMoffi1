'use client';

import React from 'react';
import { Package, Package2, ChevronRight, Truck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import type { ShopOrder } from '@/services/types';
import { orderStage, partialNote, ORDER_STAGE_LABEL, ITEM_STATUS_LABEL, type OrderStage } from '@/lib/shop/orderStatus';

const STEPS: OrderStage[] = ['preparing', 'shipped', 'delivered'];
const tl = (n: number) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;

const stageTone = (stage: OrderStage) =>
    stage === 'delivered' ? 'text-emerald-600 bg-emerald-500/10'
        : stage === 'cancelled' ? 'text-secondary bg-foreground/[0.06]'
            : 'text-accent bg-accent/10';

/** Kullanıcının siparişleri: durum yalnızca veritabanından (ödeme + satıcının kalem durumu + kargo bilgisi). */
export function OrdersTab() {
    const [orders, setOrders] = React.useState<ShopOrder[] | null>(null);
    const [expanded, setExpanded] = React.useState<string | null>(null);

    React.useEffect(() => {
        let alive = true;
        apiService.getOrders()
            .then(data => { if (alive) setOrders(data); })
            .catch(err => { console.error('Siparişler okunamadı:', err); if (alive) setOrders([]); });
        return () => { alive = false; };
    }, []);

    if (orders === null) {
        return <p className="py-16 text-center text-[13px] font-semibold text-secondary">Yükleniyor…</p>;
    }

    if (orders.length === 0) {
        return (
            <div className="py-16 text-center flex flex-col items-center gap-3">
                <Package2 className="w-12 h-12 text-secondary/40" />
                <p className="text-[14px] font-bold text-secondary">Henüz siparişin yok</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            <h3 className="px-2 text-[18px] font-black text-foreground">Siparişlerim</h3>
            {orders.map(order => {
                const stage = orderStage(order);
                const isOpen = expanded === order.id;
                const first = order.items[0];
                const note = partialNote(order);
                const stepIndex = STEPS.indexOf(stage);
                return (
                    <div key={order.id} className="bg-card border border-card-border rounded-[1.5rem] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : order.id)}
                            className="w-full p-4 flex items-center gap-4 text-left"
                        >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-foreground/[0.04] shrink-0 flex items-center justify-center">
                                {first?.product.image
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={first.product.image} alt="" className="w-full h-full object-cover" />
                                    : <Package className="w-6 h-6 text-secondary/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-black text-foreground truncate">
                                    {first?.product.name || 'Sipariş'}
                                    {order.items.length > 1 && <span className="text-secondary font-semibold"> + {order.items.length - 1} ürün</span>}
                                </p>
                                <p className="text-[12px] font-semibold text-secondary mt-0.5">
                                    {tl(order.totalPrice)} · {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                                <span className={cn('inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-black', stageTone(stage))}>
                                    {ORDER_STAGE_LABEL[stage]}
                                </span>
                            </div>
                            <ChevronRight className={cn('w-4 h-4 text-secondary shrink-0 transition-transform', isOpen && 'rotate-90')} />
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 pt-1 border-t border-card-border space-y-4">
                                {stepIndex >= 0 && (
                                    <div className="pt-3">
                                        <div className="flex gap-1.5">
                                            {STEPS.map((s, i) => (
                                                <span key={s} className={cn('h-1.5 flex-1 rounded-full', i <= stepIndex ? 'bg-accent' : 'bg-foreground/10')} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 text-[11px] font-bold">
                                            {STEPS.map((s, i) => (
                                                <span key={s} className={i <= stepIndex ? 'text-foreground' : 'text-secondary/60'}>{ORDER_STAGE_LABEL[s]}</span>
                                            ))}
                                        </div>
                                        {note && <p className="mt-2 text-[12px] font-semibold text-secondary">{note}</p>}
                                    </div>
                                )}
                                {stage === 'awaiting_payment' && (
                                    <p className="text-[12px] font-semibold text-secondary">Ödeme onayı gelince satıcıya iletilir.</p>
                                )}

                                <div className="divide-y divide-card-border">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-foreground truncate">{item.quantity} × {item.product.name}</p>
                                                {item.status && <p className="text-[11px] font-semibold text-secondary">{ITEM_STATUS_LABEL[item.status] || item.status}</p>}
                                            </div>
                                            <span className="text-[13px] font-black text-foreground shrink-0">{tl(item.product.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                {(order.carrier || order.trackingNumber) && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03]">
                                        <Truck className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-secondary">Kargo</p>
                                            <p className="text-[13px] font-bold text-foreground break-all">
                                                {[order.carrier, order.trackingNumber && `Takip no ${order.trackingNumber}`].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {order.shippingAddress && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03]">
                                        <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-secondary">Teslimat adresi</p>
                                            <p className="text-[13px] font-semibold text-foreground">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
