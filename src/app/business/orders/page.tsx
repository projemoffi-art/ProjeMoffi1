"use client";

import { useState, useMemo } from "react";
import { BusinessSidebar } from "@/components/business/Sidebar";
import { MOCK_ORDERS } from "@/data/mockBusinessRegistry";
import { useAuth } from "@/context/AuthContext";
import { BusinessOrder, OrderStatus } from "@/types/business";
import { cn } from "@/lib/utils";
import {
    ClipboardList, Search, Menu, X, Package, Truck, CheckCircle, XCircle,
    RotateCcw, Clock, Eye, ChevronRight, MapPin, User, ArrowRightLeft, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    pending: { label: 'Bekliyor', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    preparing: { label: 'Hazırlanıyor', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Package },
    shipped: { label: 'Kargoda', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: Truck },
    delivered: { label: 'Teslim Edildi', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    cancelled: { label: 'İptal', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
    returned: { label: 'İade', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: RotateCcw },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'shipped', 'delivered'];

export default function BusinessOrdersPage() {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [detailModal, setDetailModal] = useState<BusinessOrder | null>(null);

    const businessId = user?.businessId || 'biz_paws1';
    const allOrders = MOCK_ORDERS.filter(o => o.businessId === businessId);

    const filtered = useMemo(() => {
        let result = [...allOrders];
        if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
        if (search) result = result.filter(o =>
            o.customerName.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase())
        );
        return result.sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
    }, [allOrders, statusFilter, search]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allOrders.length };
        allOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
        return counts;
    }, [allOrders]);

    return (
        <div className="flex min-h-screen bg-gray-50/50 font-sans">
            <BusinessSidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 p-4 md:p-8 md:pl-80 transition-all duration-300 w-full">
                {/* Header */}
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 rounded-xl bg-white border border-gray-200/50 flex items-center justify-center md:hidden">
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Siparişler</h1>
                        <p className="text-sm text-gray-500">{allOrders.length} toplam sipariş</p>
                    </div>
                </header>

                {/* Status Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {(['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all",
                                statusFilter === s
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
                            <span className="ml-1.5 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px]">{statusCounts[s] || 0}</span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Sipariş no veya müşteri adı ara..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                </div>

                {/* Orders */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-700 mb-1">Sipariş bulunamadı</h3>
                        <p className="text-sm text-gray-400">Bu kategoride henüz sipariş yok.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(order => {
                            const statusInfo = STATUS_CONFIG[order.status];
                            const StatusIcon = statusInfo.icon;
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setDetailModal(order)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                                        {/* Order ID + Customer */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-gray-400">#{order.id.slice(-4).toUpperCase()}</span>
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", statusInfo.bg, statusInfo.color)}>
                                                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-bold text-gray-900 text-sm">{order.customerName}</span>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {order.items.slice(0, 3).map((item, i) => (
                                                <div key={i} className="bg-gray-100 rounded-lg px-2 py-1 text-[10px] font-medium text-gray-600 max-w-[120px] truncate">
                                                    {item.quantity}x {item.productName.split(' ').slice(0, 2).join(' ')}
                                                </div>
                                            ))}
                                            {order.items.length > 3 && <span className="text-[10px] text-gray-400">+{order.items.length - 3}</span>}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-lg font-black text-gray-900">₺{order.totalAmount.toLocaleString('tr-TR')}</div>
                                            <div className="text-[10px] text-gray-400">{new Date(order.orderedAt).toLocaleDateString('tr-TR')}</div>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition hidden md:block" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            <AnimatePresence>
                {detailModal && <OrderDetailModal order={detailModal} onClose={() => setDetailModal(null)} />}
            </AnimatePresence>
        </div>
    );
}

// ==================
// Order Detail Modal
// ==================

function OrderDetailModal({ order, onClose }: { order: BusinessOrder; onClose: () => void }) {
    const [updating, setUpdating] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
    const statusInfo = STATUS_CONFIG[order.status];

    const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] || null;

    const handleAdvanceStatus = () => {
        setUpdating(true);
        setTimeout(() => { setUpdating(false); onClose(); }, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Sipariş #{order.id.slice(-4).toUpperCase()}</h2>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mt-1", statusInfo.bg, statusInfo.color)}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Customer */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Müşteri</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {order.customerName.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                                <div className="text-xs text-gray-500">{order.customerEmail}</div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Teslimat Adresi</h4>
                        <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{order.shippingAddress}</span>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ürünler</h4>
                        <div className="space-y-2">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                            <span className="text-xs text-gray-400 ml-2">x{item.quantity}</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Ara Toplam</span><span className="font-bold text-gray-900">₺{order.totalAmount.toLocaleString('tr-TR')}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Komisyon (%10)</span><span className="font-bold text-red-600">-₺{order.commission.toFixed(2)}</span></div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm"><span className="font-bold text-gray-900">Net Gelir</span><span className="font-black text-green-600 text-base">₺{order.netAmount.toFixed(2)}</span></div>
                    </div>

                    {/* Tracking Number */}
                    {(order.status === 'preparing' || order.status === 'shipped') && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kargo Takip No</h4>
                            <input
                                value={trackingNumber}
                                onChange={e => setTrackingNumber(e.target.value)}
                                placeholder="Kargo takip numarası girin"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
                            <strong>Not:</strong> {order.notes}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-[10px] text-gray-400">
                        {new Date(order.orderedAt).toLocaleString('tr-TR')}
                    </div>
                    {nextStatus && order.status !== 'cancelled' && order.status !== 'returned' && (
                        <button
                            onClick={handleAdvanceStatus}
                            disabled={updating}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor</> : (
                                <>
                                    <ArrowRightLeft className="w-4 h-4" />
                                    {STATUS_CONFIG[nextStatus].label} Yap
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
