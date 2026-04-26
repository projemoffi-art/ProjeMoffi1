'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Package2, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { ShopOrder } from '@/services/types';

export function OrdersTab({ orders: initialOrders }: { orders: any[] }) {
    const [orders, setOrders] = React.useState<ShopOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [expandedOrder, setExpandedOrder] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await apiService.getOrders();
                setOrders(data);
            } catch (err) {
                console.error("Orders fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getSimulatedStatus = (order: ShopOrder) => {
        const diffMs = new Date().getTime() - new Date(order.createdAt).getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 1) return { status: 'preparing', text: 'Hazırlanıyor', progress: 33 };
        if (diffHrs < 24) return { status: 'shipped', text: 'Yolda', progress: 66 };
        return { status: 'delivered', text: 'Teslim Edildi', progress: 100 };
    };

    if (loading) {
        return <div className="py-20 text-center opacity-20 font-black text-white uppercase italic tracking-[0.5em]">Yükleniyor...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center gap-6 opacity-40">
                <Package2 className="w-20 h-20 text-gray-500" />
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Henüz bir siparişiniz yok</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <h3 className="px-2 text-xl font-black text-white italic uppercase tracking-tighter decoration-emerald-500/50">Siparişlerim</h3>

            <div className="space-y-4">
                {Array.isArray(orders) && orders.map(order => {
                    const sim = getSimulatedStatus(order);
                    const isExpanded = expandedOrder === order.id;
                    const firstItem = order.items[0];
                    const itemCount = order.items.length;
                    
                    return (
                        <div key={order.id} className="bg-[#12121A] border border-white/10 rounded-[2.5rem] overflow-hidden group transition-all">
                            <div 
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-gray-900 shrink-0 flex items-center justify-center text-2xl font-black text-white">
                                        {firstItem?.product.image ? (
                                            <img src={firstItem.product.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-8 h-8 opacity-20" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-white font-black text-sm uppercase tracking-tight leading-tight">
                                            {firstItem?.product.name || "Sipariş"}
                                            {itemCount > 1 && <span className="text-gray-500 lowercase"> + {itemCount - 1} ürün</span>}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-white px-2 py-0.5 bg-emerald-500/20 rounded-md border border-emerald-500/10 italic">{order.totalPrice} TL</span>
                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "flex items-center gap-2 justify-end mb-1",
                                        sim.status === 'delivered' ? "text-emerald-400" : "text-orange-400"
                                    )}>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{sim.text}</span>
                                        {sim.status === 'delivered' ? <CheckCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 text-gray-600 ml-auto transition-transform", isExpanded ? "rotate-90" : "")} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-8 pb-8 pt-2 border-t border-white/5 bg-black/20">
                                    {/* Timeline */}
                                    <div className="mb-8 pt-4">
                                        <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${sim.progress}%` }}
                                                className="absolute h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                            />
                                        </div>
                                        <div className="flex justify-between mt-3 px-1">
                                            <span className="text-[9px] font-black uppercase text-white">Hazırlanıyor</span>
                                            <span className={cn("text-[9px] font-black uppercase", sim.progress >= 66 ? "text-white" : "text-gray-600")}>Yolda</span>
                                            <span className={cn("text-[9px] font-black uppercase", sim.progress === 100 ? "text-white" : "text-gray-600")}>Teslim Edildi</span>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mb-4">Sipariş İçeriği</h5>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-white">
                                                        {item.quantity}x
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-300">{item.product.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-white">{item.product.price} TL</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Truck className="w-4 h-4 text-emerald-400" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-500 uppercase">Teslimat Adresi</p>
                                                <p className="text-[10px] font-bold text-white truncate max-w-[200px]">{order.shippingAddress}</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase hover:bg-white/10 transition-all">Detaylar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* TRACKING CARD */}
            <div className="bg-gradient-to-br from-[#12121A] to-[#0A0A0E] border border-white/5 p-8 rounded-[3.5rem] flex flex-col gap-6 items-center text-center">
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-white font-black text-lg italic tracking-tighter uppercase mb-2">Moffi Express <span className="text-emerald-400">Güvencesi</span></h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">Tüm siparişleriniz Moffi garantisi ile sigortalanmaktadır.</p>
                </div>
            </div>
        </div>
    );
}
