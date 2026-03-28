"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search, ShoppingBag, Heart, Star, ChevronLeft,
    ShoppingCart, Plus, Minus, X, Bone, Fish,
    Package, Truck, CheckCircle2, Tag, Sparkles, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePetShop } from "@/hooks/usePetShop";
import type { ShopCategory, ShopProduct } from "@/types/domain";

// ==========================================
// CATEGORY CONFIG
// ==========================================
const CATEGORIES: Array<{ id: ShopCategory | 'all'; label: string; icon: typeof Sparkles; color: string }> = [
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
function EmptyState({ icon: Icon, title, description }: { icon: typeof AlertCircle; title: string; description: string }) {
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
    } = usePetShop();

    const [activeCategory, setActiveCategory] = useState<ShopCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high'>('popular');
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState<{ valid: boolean; discountPercent?: number; message?: string } | null>(null);

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

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 font-sans">

            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back();
                            } else {
                                router.push('/community');
                            }
                        }} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-white" />
                    </button>

                    <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">PetShop</h1>

                    <button onClick={() => setShowCart(true)} className="relative w-10 h-10 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-white" />
                        {cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* SEARCH */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Ürün veya marka ara..."
                            className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-white/5 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 outline-none border-none"
                        />
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
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                activeCategory === cat.id
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                    : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/10"
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
                    {[
                        { key: 'popular' as const, label: 'Popüler' },
                        { key: 'price_low' as const, label: 'En Ucuz' },
                        { key: 'price_high' as const, label: 'En Pahalı' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSortBy(s.key)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                sortBy === s.key ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/5 text-gray-500"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* BANNER */}
            <div className="px-5 mb-4">
                <div className="relative h-28 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl overflow-hidden flex items-center px-6">
                    <div className="absolute -right-4 -bottom-4 text-7xl opacity-30">🐱</div>
                    <div>
                        <p className="text-white/80 text-xs font-bold mb-1">🎉 İlk Siparişe Özel</p>
                        <h2 className="text-white text-2xl font-black">%20 İndirim</h2>
                        <p className="text-white/70 text-xs mt-1">MOFFI20 koduyla</p>
                    </div>
                </div>
            </div>

            {/* LOADING SKELETON */}
            {isLoading && sortedProducts.length === 0 && (
                <div className="px-5 grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 animate-pulse">
                            <div className="h-32 bg-gray-100 dark:bg-white/5" />
                            <div className="p-3 space-y-2">
                                <div className="h-2 w-12 bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="h-3 w-2/3 bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="flex justify-between items-center mt-2">
                                    <div className="h-4 w-14 bg-gray-200 dark:bg-white/10 rounded" />
                                    <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && sortedProducts.length === 0 && (
                <EmptyState
                    icon={Search}
                    title="Ürün bulunamadı"
                    description={searchQuery ? `"${searchQuery}" ile eşleşen ürün yok. Farklı bir arama deneyin.` : "Bu kategoride henüz ürün yok."}
                />
            )}

            {/* PRODUCTS GRID */}
            {sortedProducts.length > 0 && (
                <div className="px-5 grid grid-cols-2 gap-3">
                    {sortedProducts.map((product, i) => {
                        const qty = getCartQty(product.id);
                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* Product Image Area */}
                                <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/2 flex items-center justify-center">
                                    <span className="text-5xl group-hover:scale-110 transition-transform">{product.image}</span>

                                    {product.tag && (
                                        <span className={cn(
                                            "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black text-white",
                                            product.tag === 'Çok Satan' ? 'bg-red-500' :
                                                product.tag === 'Premium' ? 'bg-purple-500' :
                                                    product.tag === 'İndirimli' ? 'bg-green-500' :
                                                        product.tag === 'Yeni' ? 'bg-blue-500' :
                                                            product.tag === 'Favori' ? 'bg-pink-500' :
                                                                product.tag === 'Popüler' ? 'bg-amber-500' : 'bg-gray-500'
                                        )}>
                                            {product.tag}
                                        </span>
                                    )}

                                    {!product.inStock && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-lg">Stokta Yok</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={e => { e.stopPropagation(); toggleFav(product.id); }}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 dark:bg-black/40 flex items-center justify-center"
                                    >
                                        <Heart className={cn("w-3.5 h-3.5", favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{product.brand}</p>
                                    <h3 className="text-xs font-bold text-gray-800 dark:text-white leading-tight line-clamp-2 mb-1.5">{product.name}</h3>

                                    <div className="flex items-center gap-1 mb-2">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{product.rating}</span>
                                        <span className="text-[10px] text-gray-400">({product.reviews})</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-black text-gray-900 dark:text-white">₺{product.price}</span>
                                            {product.oldPrice && (
                                                <span className="text-[10px] text-gray-400 line-through ml-1">₺{product.oldPrice}</span>
                                            )}
                                        </div>

                                        {qty > 0 ? (
                                            <div className="flex items-center gap-1.5 bg-orange-500 rounded-lg px-1.5 py-0.5">
                                                <button onClick={() => {
                                                    if (qty <= 1) removeFromCart(product.id);
                                                    else updateCartItem(product.id, qty - 1);
                                                }} className="text-white">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-white text-xs font-black w-4 text-center">{qty}</span>
                                                <button onClick={() => updateCartItem(product.id, qty + 1)} className="text-white">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(product.id)}
                                                disabled={!product.inStock}
                                                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* DELIVERY INFO */}
            <div className="px-5 mt-6 mb-4">
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">Ücretsiz Kargo</h3>
                        <p className="text-xs text-gray-400">₺200 üzeri siparişlerde · Aynı gün kargo</p>
                    </div>
                </div>
            </div>

            {/* FLOATING CART BAR */}
            <AnimatePresence>
                {cartCount > 0 && !showCart && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-5 right-5 z-40"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-2xl flex items-center justify-between px-6 text-white shadow-2xl shadow-orange-500/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                                <span className="font-bold">{cartCount} ürün</span>
                            </div>
                            <span className="font-black text-lg">₺{cartTotal.toLocaleString('tr-TR')}</span>
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
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[75vh] overflow-y-auto"
                        >
                            {/* Cart Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-900 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">Sepetim</h2>
                                <button onClick={() => setShowCart(false)} className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Cart Empty */}
                            {cart.length === 0 && (
                                <EmptyState
                                    icon={ShoppingCart}
                                    title="Sepet boş"
                                    description="Ürünleri sepete ekleyerek alışverişe başla!"
                                />
                            )}

                            {/* Cart Items */}
                            {cart.length > 0 && (
                                <div className="p-5 space-y-3">
                                    {cart.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        if (!product) return null;
                                        return (
                                            <div key={item.productId} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                                                <span className="text-3xl">{product.image}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{product.name}</p>
                                                    <p className="text-sm font-black text-orange-500 mt-0.5">₺{(product.price * item.quantity).toLocaleString('tr-TR')}</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white dark:bg-white/10 rounded-lg px-2 py-1 border border-gray-200 dark:border-white/10">
                                                    <button onClick={() => {
                                                        if (item.quantity <= 1) removeFromCart(item.productId);
                                                        else updateCartItem(item.productId, item.quantity - 1);
                                                    }}><Minus className="w-3.5 h-3.5 text-gray-500" /></button>
                                                    <span className="text-sm font-black text-gray-800 dark:text-white w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateCartItem(item.productId, item.quantity + 1)}>
                                                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Discount Code */}
                                    <div className="flex gap-2 pt-2">
                                        <input
                                            value={discountCode}
                                            onChange={e => { setDiscountCode(e.target.value); setDiscountResult(null); }}
                                            placeholder="İndirim kodu..."
                                            className="flex-1 h-10 px-3 bg-gray-100 dark:bg-white/5 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 outline-none border border-gray-200 dark:border-white/10"
                                        />
                                        <button
                                            onClick={handleApplyDiscount}
                                            className="px-4 h-10 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl"
                                        >
                                            Uygula
                                        </button>
                                    </div>
                                    {discountResult && (
                                        <p className={cn(
                                            "text-xs font-medium",
                                            discountResult.valid ? "text-green-600" : "text-red-500"
                                        )}>
                                            {discountResult.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Cart Footer */}
                            {cart.length > 0 && (
                                <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-5 py-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">Ara toplam</span>
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">₺{cartTotal.toLocaleString('tr-TR')}</span>
                                    </div>
                                    {discountResult?.valid && discountResult.discountPercent && (
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-green-600">İndirim (%{discountResult.discountPercent})</span>
                                            <span className="text-sm font-bold text-green-600">-₺{Math.round(cartTotal * discountResult.discountPercent / 100).toLocaleString('tr-TR')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Toplam</span>
                                        <span className="text-xl font-black text-gray-900 dark:text-white">
                                            ₺{(discountResult?.valid && discountResult.discountPercent
                                                ? Math.round(cartTotal * (1 - discountResult.discountPercent / 100))
                                                : cartTotal
                                            ).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    {cartTotal >= 200 && (
                                        <div className="flex items-center gap-2 mb-3 text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-bold">Ücretsiz kargo hakkı kazandın!</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => createOrder('Test Adres')}
                                        className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-2xl transition-colors py-3.5"
                                    >
                                        Siparişi Tamamla
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
