"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, ShoppingBag, Heart, Star, ChevronLeft,
    ShoppingCart, Plus, Minus, X, Bone, Fish,
    Package, Truck, CheckCircle2, Tag, Sparkles, AlertCircle, Info, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePetShop } from "@/hooks/usePetShop";
import type { ShopCategory, ShopProduct } from "@/types/domain";
import AdvisorChat from "@/components/petshop/AdvisorChat";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { OrderTrackingModal } from '@/components/shop/OrderTrackingModal';
import confetti from 'canvas-confetti';

const stripePromise = loadStripe('pk_test_51O7Lq8L0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k');

// ==========================================
// CATEGORY CONFIG
// ==========================================
const CATEGORIES: Array<{ id: ShopCategory | 'all'; label: string; icon: any; color: string }> = [
    { id: 'all', label: 'Tümü', icon: Sparkles, color: 'from-purple-500 to-indigo-500' },
    { id: 'food', label: 'Mama', icon: Bone, color: 'from-amber-500 to-orange-500' },
    { id: 'snack', label: 'Atıştırmalık', icon: Fish, color: 'from-pink-500 to-rose-500' },
    { id: 'toy', label: 'Oyuncak', icon: Package, color: 'from-blue-500 to-cyan-500' },
    { id: 'care', label: 'Bakım', icon: Heart, color: 'from-green-500 to-emerald-500' },
    { id: 'accessory', label: 'Aksesuar', icon: Tag, color: 'from-violet-500 to-purple-500' },
];

// ==========================================
// EMPTY STATE
// ==========================================
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{description}</p>
        </div>
    );
}

// ==========================================
// COMPONENT
// ==========================================
export default function PetShopPage() {
    const router = useRouter();
    const {
        products, cart, cartCount, cartTotal,
        isLoading, error,
        fetchProducts, searchProducts,
        addToCart, updateCartItem, removeFromCart, clearCart,
        validateDiscount, createOrder,
        subscriptions, subscribeToProduct
    } = usePetShop();

    const [activeCategory, setActiveCategory] = useState<ShopCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [showAdvisor, setShowAdvisor] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high'>('popular');
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState<{ valid: boolean; discountPercent?: number; message?: string } | null>(null);
    
    // PAYMENT & TRACKING STATES
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
    const [showTracking, setShowTracking] = useState(false);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Local loading for payment

    // ECOSYSTEM PREFERENCES
    const [isSmartShopEnabled, setIsSmartShopEnabled] = useState(true);
    const [showSmartModal, setShowSmartModal] = useState(false);

    useEffect(() => {
        const smartSaved = localStorage.getItem('moffi_smart_shop_enabled');
        if (smartSaved !== null) setIsSmartShopEnabled(smartSaved === 'true');

        const modalShown = localStorage.getItem('moffi_smart_shop_modal_shown');
        if (!modalShown && smartSaved === null) {
            setTimeout(() => setShowSmartModal(true), 2000);
        }
    }, []);

    const handleEnableSmart = (enable: boolean) => {
        setIsSmartShopEnabled(enable);
        localStorage.setItem('moffi_smart_shop_enabled', String(enable));
        localStorage.setItem('moffi_smart_shop_modal_shown', 'true');
        setShowSmartModal(false);
    };

    // Handle category change
    const handleCategoryChange = (catId: ShopCategory | 'all') => {
        setActiveCategory(catId);
        if (catId === 'all') fetchProducts();
        else fetchProducts(catId);
    };

    // Handle search
    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (q.trim()) searchProducts(q);
        else fetchProducts(activeCategory === 'all' ? undefined : activeCategory);
    };

    // Sort products locally
    const sortedProducts = useMemo(() => {
        const list = [...products];
        if (sortBy === 'price_low') return list.sort((a, b) => a.price - b.price);
        if (sortBy === 'price_high') return list.sort((a, b) => b.price - a.price);
        return list.sort((a, b) => b.reviews - a.reviews);
    }, [products, sortBy]);

    // Cart helpers
    const getCartQty = (productId: string) => cart.find(c => c.productId === productId)?.quantity || 0;

    const toggleFav = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        const result = await validateDiscount(discountCode);
        setDiscountResult(result);
    };

    const handleCheckoutInit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: cartTotal,
                    items: cart 
                }),
            });
            const data = await response.json();
            setPaymentClientSecret(data.clientSecret);
            setShowCheckout(true);
        } catch (err) {
            console.error("Payment setup failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setShowCheckout(false);
        setIsSubmitting(true);
        try {
            const order = await createOrder('Müşteri Adresi', discountCode);
            if (order) {
                setLastOrderId(order.id);
                setShowCart(false);
                setShowTracking(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#5B4D9D', '#FF9500', '#FFFFFF']
                });
            }
        } catch (err) {
            console.error("Order creation failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dynamic Filter for Quick Buy Bar
    const quickBuyProducts = useMemo(() => {
        if (isSmartShopEnabled) {
            return products.filter(p => p.isRecentlyBought);
        }
        // Fallback: Trend Products (Top rated)
        return products.filter(p => p.rating >= 4.8).slice(0, 5);
    }, [products, isSmartShopEnabled]);

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] pb-32 font-sans selection:bg-orange-500/30">

            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-b border-gray-100 dark:border-white/5 transition-colors">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) router.back();
                            else router.push('/community');
                        }} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white italic uppercase">Moffi PetShop</h1>
                    <button onClick={() => setShowCart(true)} className="relative w-10 h-10 flex items-center justify-center group">
                        <ShoppingCart className="w-6 h-6 text-gray-900 dark:text-white group-active:scale-90 transition-transform" />
                        {cartCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30"
                            >
                                {cartCount}
                            </motion.span>
                        )}
                    </button>
                </div>

                {/* SEARCH */}
                <div className="px-5 pb-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Ürün veya marka ara..."
                            className="w-full h-11 pl-10 pr-4 bg-gray-200/50 dark:bg-white/5 rounded-2xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500 outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-white dark:focus:bg-black/20 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* QUICK BUY BAR (MILO'S FAVORITES or TREND) */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {isSmartShopEnabled ? "Milo'nun Favorileri 🦴" : "Haftanın Trendleri 🔥"}
                    </h2>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Hızlı Al</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
                    {quickBuyProducts.map(product => (
                        <motion.button
                            key={`quick-${product.id}`}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(product.id)}
                            className="flex flex-col items-center shrink-0 w-24 bg-white dark:bg-white/5 rounded-3xl p-3 border border-gray-100 dark:border-white/5 shadow-sm active:bg-orange-50 transition-colors"
                        >
                            <span className="text-3xl mb-2 drop-shadow-md">{product.image}</span>
                            <span className="text-[9px] font-black text-gray-900 dark:text-white/80 text-center line-clamp-1 italic uppercase tracking-tighter">{product.name}</span>
                            <span className="text-[10px] font-black text-orange-500 mt-1">₺{(product.price || 0).toLocaleString('tr-TR')}</span>
                        </motion.button>
                    ))}
                    <div className="flex flex-col items-center justify-center shrink-0 w-24 bg-gray-50 dark:bg-white/5 rounded-3xl p-3 border border-dashed border-gray-200 dark:border-white/10">
                        <Plus className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Daha Fazla</span>
                    </div>
                </div>
            </div>

            {/* ERROR BANNER */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-5 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CATEGORIES */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 h-11 rounded-[1.2rem] text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all active:scale-95 shadow-sm",
                                activeCategory === cat.id
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] ring-2 ring-white/10`
                                    : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:border-orange-500/20"
                            )}
                        >
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SORT */}
            <div className="px-5 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{sortedProducts.length} ürün</span>
                <div className="flex gap-1.5">
                    {(['popular', 'price_low', 'price_high'] as const).map(sKey => (
                        <button
                            key={sKey}
                            onClick={() => setSortBy(sKey)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                sortBy === sKey ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/5 text-gray-500"
                            )}
                        >
                            {sKey === 'popular' ? 'Popüler' : sKey === 'price_low' ? 'En Ucuz' : 'En Pahalı'}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRODUCTS GRID */}
            {isLoading && sortedProducts.length === 0 ? (
                <div className="px-5 grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : sortedProducts.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Ürün bulunamadı"
                    description={searchQuery ? `"${searchQuery}" ile eşleşen ürün yok.` : "Bu kategoride henüz ürün yok."}
                />
            ) : (
                <div className="px-5 grid grid-cols-2 gap-3">
                    {sortedProducts.map((product, i) => {
                        const qty = getCartQty(product.id);
                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm group"
                            >
                                <div className="relative h-36 bg-gradient-to-br from-white to-gray-100/50 dark:from-white/5 dark:to-transparent flex items-center justify-center overflow-hidden">
                                    <span className="text-5xl drop-shadow-2xl group-hover:scale-125 transition-transform duration-500">{product.image}</span>
                                    {product.tag && (
                                        <span className={cn(
                                            "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-xl border border-white/20",
                                            product.tag === 'Çok Satan' ? 'bg-red-500/90' : 'bg-blue-500/90'
                                        )}>
                                            {product.tag}
                                        </span>
                                    )}
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={e => { e.stopPropagation(); toggleFav(product.id); }}
                                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20"
                                    >
                                        <Heart className={cn("w-4 h-4 transition-all", favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                                    </motion.button>
                                    
                                    {/* Vet Approved Badge - Conditional */}
                                    {product.isVetApproved && isSmartShopEnabled && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-emerald-500/30 shadow-sm">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                            <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Vet Onaylı</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-white dark:bg-black/20">
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-1 leading-none">{product.brand?.name || "Moffi"}</p>
                                    <h3 className="text-xs font-black text-gray-900 dark:text-white leading-snug line-clamp-2 h-8 italic mb-2">{product.name}</h3>
                                    
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {product.category === 'snack' && isSmartShopEnabled && (
                                            <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded-lg border border-blue-500/20">
                                                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                                                <span className="text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Walk Ödülü ⚡</span>
                                            </div>
                                        )}
                                        {product.isRecentlyBought && isSmartShopEnabled && (
                                            <span className="text-[8px] font-bold text-gray-400 italic">Milo bunu seviyor</span>
                                        )}
                                    </div>

                                    {/* Auto-Ship Toggle Visual */}
                                    <div 
                                        onClick={() => subscribeToProduct(product.id)}
                                        className={cn(
                                            "flex items-center gap-2 mb-3 p-2 rounded-xl border transition-all cursor-pointer",
                                            subscriptions.find(s => s.id === product.id)
                                                ? "bg-orange-500 border-orange-600 shadow-md scale-[1.02]"
                                                : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:bg-orange-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                                            subscriptions.find(s => s.id === product.id)
                                                ? "border-white"
                                                : "border-orange-500/30"
                                        )}>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full transition-all",
                                                subscriptions.find(s => s.id === product.id)
                                                    ? "bg-white scale-100"
                                                    : "bg-orange-500 opacity-0 group-hover:opacity-100"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest leading-none transition-colors",
                                            subscriptions.find(s => s.id === product.id)
                                                ? "text-white"
                                                : "text-gray-500 dark:text-gray-400"
                                        )}>
                                            {subscriptions.find(s => s.id === product.id) ? 'Abone Olundu!' : 'Aylık Abone Ol (%10)'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-950 dark:text-white">₺{(product.price || 0).toLocaleString('tr-TR')}</span>
                                        </div>
                                        {qty > 0 ? (
                                            <div className="flex items-center gap-1 bg-orange-500 rounded-xl px-2 py-1 shadow-lg">
                                                <button onClick={() => {
                                                    if (qty <= 1) removeFromCart(product.id);
                                                    else updateCartItem(product.id, qty - 1);
                                                }} className="text-white hover:scale-125"><Minus className="w-3.5 h-3.5" /></button>
                                                <span className="text-white text-xs font-black w-4 text-center">{qty}</span>
                                                <button onClick={() => updateCartItem(product.id, qty + 1)} className="text-white hover:scale-125"><Plus className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.8 }}
                                                onClick={() => addToCart(product.id)}
                                                className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* DELIVERY INFO */}
            <div className="px-5 mt-8 mb-4">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-[2.2rem] border border-white/40 dark:border-white/10 p-5 flex items-center gap-5 group shadow-sm">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <Truck className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Ücretsiz Kargo</h3>
                        <p className="text-[11px] text-gray-500 font-bold mt-0.5">₺200 üzeri siparişlerde · Aynı gün kapında ⚡</p>
                    </div>
                </div>
            </div>

            {/* AI ADVISOR PULSE BUTTON */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAdvisor(true)}
                className="fixed bottom-32 right-6 z-40 w-14 h-14 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center shadow-2xl group border-4 border-white dark:border-black transition-all"
            >
                <div className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full animate-ping opacity-20" />
                <Sparkles className="w-6 h-6 text-white dark:text-gray-900 group-hover:rotate-12 transition-transform" />
            </motion.button>

            {/* SMART INTEGRATION MODAL */}
            <AnimatePresence>
                {showSmartModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center px-6 pointer-events-none"
                        >
                            <div className="w-full max-w-sm bg-white dark:bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/20 pointer-events-auto">
                                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
                                            <Sparkles className="w-12 h-12 text-white animate-pulse" />
                                        </div>
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <Bone className="w-6 h-6 text-orange-500" />
                                        </motion.div>
                                    </div>
                                </div>
                                <div className="p-8 text-center">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-tight">
                                        Akıllı Mağaza<br/>Deneyimine Hazır mısın?
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed px-2">
                                        Milo'nun yürüyüş mesafesi, sağlık verileri ve iştah durumunu analiz ederek ona en uygun mama ve ödülleri önermemize izin ver.
                                    </p>
                                    
                                    <div className="mt-8 space-y-3">
                                        <button
                                            onClick={() => handleEnableSmart(true)}
                                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest italic"
                                        >
                                            Entegrasyonu Aç
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEnableSmart(false)}
                                            className="w-full h-12 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest"
                                        >
                                            Şimdilik Bağımsız Kalsın
                                        </button>
                                    </div>
                                    
                                    <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-white/5 pt-6">
                                        <Info className="w-3 h-3" />
                                        İstediğin zaman ayarlardan değiştirebilirsin
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* FLOATING CART BAR */}
            <AnimatePresence>
                {cartCount > 0 && !showCart && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-6 right-6 z-40"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full h-16 bg-orange-500 rounded-[2rem] flex items-center justify-between px-8 text-white shadow-2xl active:scale-95 transition-all group overflow-hidden"
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="font-black text-sm uppercase tracking-widest">{cartCount} ÜRÜN SEPETTE</span>
                            </div>
                            <span className="font-black text-xl italic relative z-10">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CART DRAWER */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowCart(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[60] bg-[#F9FAFB] dark:bg-[#0A0A0A] rounded-t-[3rem] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                            {/* Cart Header */}
                            <div className="px-8 pt-4 pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-md">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Sepetim</h2>
                                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-1">ÖDEME ADIMINA HAZIR</p>
                                </div>
                                <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                {cart.length === 0 ? (
                                    <EmptyState
                                        icon={ShoppingCart}
                                        title="Sepetin şu an boş"
                                        description="Milo için harika ürünler keşfetmeye ne dersin?"
                                    />
                                ) : (
                                    <div className="p-8 space-y-4">
                                        {cart.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            if (!product) return null;
                                            return (
                                                <div key={item.productId} className="flex items-center gap-5 bg-white dark:bg-white/5 rounded-[1.8rem] p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl">{product.image}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate italic">{product.name}</h4>
                                                        <p className="text-base font-black text-orange-500 mt-1.5 leading-none">₺{((product.price || 0) * (item.quantity || 1)).toLocaleString('tr-TR')}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/10 rounded-xl px-2 py-1.5">
                                                        <button onClick={() => {
                                                            if (item.quantity <= 1) removeFromCart(item.productId);
                                                            else updateCartItem(item.productId, item.quantity - 1);
                                                        }}><Minus className="w-4 h-4 text-gray-500" /></button>
                                                        <span className="text-sm font-black text-gray-900 dark:text-white w-5 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateCartItem(item.productId, item.quantity + 1)}>
                                                            <Plus className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="flex gap-3 pt-4">
                                            <input
                                                value={discountCode}
                                                onChange={e => { setDiscountCode(e.target.value); setDiscountResult(null); }}
                                                placeholder="İndirim kodu..."
                                                className="flex-1 h-12 px-5 bg-white dark:bg-white/5 rounded-2xl text-sm border-2 border-transparent focus:border-orange-500/20 outline-none"
                                            />
                                            <button onClick={handleApplyDiscount} className="px-6 h-12 bg-gray-950 dark:bg-white text-white dark:text-black text-[11px] font-black uppercase rounded-2xl">Uygula</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="sticky bottom-0 bg-white/80 dark:bg-black/60 backdrop-blur-2xl px-8 py-8 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Toplam</span>
                                        <span className="text-2xl font-black text-gray-950 dark:text-white italic">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckoutInit}
                                        disabled={isLoading || isSubmitting}
                                        className="w-full h-16 bg-orange-500 text-white font-black text-base rounded-[1.8rem] shadow-xl uppercase italic disabled:opacity-50"
                                    >
                                        {(isLoading || isSubmitting) ? 'Hazırlanıyor...' : 'Siparişi Tamamla'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* STRIPE CHECKOUT MODAL */}
            <AnimatePresence>
                {showCheckout && paymentClientSecret && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl"
                            onClick={() => setShowCheckout(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="fixed bottom-0 left-0 right-0 z-[111] bg-[#0a0a0a] rounded-t-[3rem] p-8 border-t border-white/10"
                        >
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Güvenli Ödeme</h2>
                                    <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                        <X size={20} className="text-white/50" />
                                    </button>
                                </div>
                                <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret, appearance: { theme: 'night' } }}>
                                    <CheckoutForm 
                                        amount={cartTotal} 
                                        onSuccess={handlePaymentSuccess} 
                                        onCancel={() => setShowCheckout(false)} 
                                    />
                                </Elements>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* HYBRID TRACKING MODAL */}
            {lastOrderId && (
                <OrderTrackingModal 
                    isOpen={showTracking}
                    onClose={() => setShowTracking(false)}
                    orderId={lastOrderId}
                    status="out_for_delivery"
                />
            )}

            {/* ADVISOR CHAT */}
            <AdvisorChat isOpen={showAdvisor} onClose={() => setShowAdvisor(false)} isSmartEnabled={isSmartShopEnabled} />
        </div>
    );
}
