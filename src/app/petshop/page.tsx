"use client";

import { isImageUrl } from '@/lib/productImage';
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search, ShoppingBag, Heart, ChevronLeft, ChevronRight,
    ShoppingCart, Plus, Minus, X, Bone, Fish,
    Package, CheckCircle2, Tag, Sparkles, AlertCircle, ArrowRight,
    Sliders, MapPin, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePetShop } from "@/hooks/usePetShop";
import type { ShopCategory, ShopProduct } from "@/types/domain";
import { usePet } from "@/context/PetContext";
import { useDragScroll } from "@/hooks/useDragScroll";
import { OrderPlacedSheet } from '@/components/shop/OrderPlacedSheet';
import confetti from 'canvas-confetti';

const getImgUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("data:")) {
        return url.trim();
    }
    if (url.includes(".") && !url.startsWith("/")) {
        return `https://${url.trim()}`;
    }
    return url.trim();
};

const getFirstImgUrl = (imageStr: string) => {
    if (!imageStr) return "";
    const list = imageStr.split(',');
    return getImgUrl(list[0] || "");
};

// ==========================================
// CATEGORY CONFIG
// ==========================================
const CATEGORIES: Array<{ id: ShopCategory | 'all'; label: string; icon: typeof Sparkles; color: string }> = [
    { id: 'all', label: 'Tümü', icon: Sparkles, color: 'from-orange-500 to-rose-500' },
    { id: 'food', label: 'Mama', icon: Bone, color: 'from-amber-500 to-orange-500' },
    { id: 'snack', label: 'Atıştırmalık', icon: Fish, color: 'from-pink-500 to-rose-500' },
    { id: 'toy', label: 'Oyuncak', icon: Package, color: 'from-teal-500 to-emerald-500' },
    { id: 'care', label: 'Bakım', icon: Heart, color: 'from-green-500 to-emerald-500' },
    { id: 'accessory', label: 'Aksesuar', icon: Tag, color: 'from-stone-500 to-stone-700' },
];

// ==========================================
// EMPTY STATE
// ==========================================
function EmptyState({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-gray-300 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
        </div>
    );
}




const getFrequentlyBoughtWith = (currentProduct: ShopProduct, allProducts: ShopProduct[]) => {
    if (!currentProduct || allProducts.length <= 1) return null;
    const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);
    if (otherProducts.length === 0) return null;
    if (currentProduct.category === 'food') {
        const snackOrToy = otherProducts.find(p => p.category === 'snack' || p.category === 'toy');
        if (snackOrToy) return snackOrToy;
    }
    if (currentProduct.category === 'snack') {
        const toyOrAccessory = otherProducts.find(p => p.category === 'toy' || p.category === 'accessory');
        if (toyOrAccessory) return toyOrAccessory;
    }
    return otherProducts[0];
};

// ==========================================
// COMPONENT
// ==========================================
export default function PetShopPage() {
    const router = useRouter();
    const categoryScroll = useDragScroll();
    const { activePet } = usePet();
    const {
        products, cart, cartCount, cartTotal,
        isLoading, error,
        fetchProducts, searchProducts,
        addToCart, updateCartItem, removeFromCart, clearCart
    } = usePetShop();

    // PAYMENT & REDIRECT LISTENER FOR PAYTR
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const orderId = params.get('orderId');

        // "Sepetim" bağlantıları (ana sayfa, kenar paneli) sepeti açık getirir: /petshop?view=cart
        if (params.get('view') === 'cart') {
            setShowCart(true);
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (status === 'success' && orderId) {
            setLastOrderId(orderId);
            setShowTracking(true);
            clearCart();
            
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF9500', '#5B4D9D', '#FFFFFF']
            });

            // Clean url params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [clearCart]);

    const [activeCategory, setActiveCategory] = useState<ShopCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'new' | 'price_low' | 'price_high'>('new');
    
    // PAYMENT & TRACKING STATES
    const [showCheckout, setShowCheckout] = useState(false);
    const [showTracking, setShowTracking] = useState(false);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    // Custom Checkout States
    const [checkoutMode, setCheckoutMode] = useState<'stripe' | 'custom' | 'paytr'>('custom');
    const [checkoutStep, setCheckoutStep] = useState<'address' | 'payment'>('address');
    const [checkoutAddress, setCheckoutAddress] = useState({ name: "", surname: "", phone: "", detail: "" });
    const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
    const [isProcessingCustomPayment, setIsProcessingCustomPayment] = useState(false);
    const [paytrToken, setPaytrToken] = useState<string | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [modalQty, setModalQty] = useState(1);

    // Advanced features states
    const [comparisonList, setComparisonList] = useState<ShopProduct[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    useEffect(() => {
        setActiveImgIndex(0);
        setModalQty(1);
    }, [selectedProduct]);

    useEffect(() => {
        const shouldHideNav = !!selectedProduct || showCart || showComparison || showCheckout;
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: !shouldHideNav }));
        return () => {
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
        };
    }, [selectedProduct, showCart, showComparison, showCheckout]);

    useEffect(() => {
        if (products.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const openProductId = params.get('openProduct');
            if (openProductId) {
                const targetProduct = products.find(p => p.id === openProductId);
                if (targetProduct) {
                    setSelectedProduct(targetProduct);
                    
                    // Remove the query parameter so it doesn't stay in the URL
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }
            }
        }
    }, [products]);

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
        return list; // Veritabanından en yeni önce gelir.
    }, [products, sortBy]);

    // Cart helpers
    const getCartQty = (productId: string) => cart.find(c => c.productId === productId)?.quantity || 0;

    const toggleFav = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleCheckoutInit = () => {
        setCheckoutStep('address');
        setCheckoutErrors([]);
        setCheckoutMode('paytr');
        setShowCheckout(true);
    };

    // Başka bir ekrandaki sepetten "Ödemeye Geç" ile gelindiyse (?checkout=1) ödeme doğrudan açılır.
    const checkoutParamHandledRef = useRef(false);
    useEffect(() => {
        if (checkoutParamHandledRef.current || cart.length === 0) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') !== '1') return;
        checkoutParamHandledRef.current = true;
        params.delete('checkout');
        const query = params.toString();
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
        handleCheckoutInit();
    }, [cart.length]);

    return (
        <div className="min-h-screen pb-32 font-sans selection:bg-orange-500/30">

            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-b border-card-border dark:border-card-border transition-colors">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) router.back();
                            else router.push('/home');
                        }} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-black/10 dark:bg-white/10 rounded-full transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground dark:text-white" />
                    </button>
                    <h1 className="text-xl font-black tracking-tighter text-foreground dark:text-white italic uppercase">Moffi PetShop</h1>
                    <button onClick={() => setShowCart(true)} className="relative w-10 h-10 flex items-center justify-center group">
                        <ShoppingCart className="w-6 h-6 text-foreground dark:text-white group-active:scale-90 transition-transform" />
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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Ürün veya marka ara..."
                            className="w-full h-11 pl-10 pr-4 bg-gray-200/50 dark:bg-white/5 rounded-2xl text-sm text-foreground dark:text-white placeholder:text-gray-500 outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-card dark:focus:bg-black/20 transition-all font-medium"
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
                <div 
                    ref={categoryScroll.ref}
                    onMouseDown={categoryScroll.onMouseDown}
                    onMouseLeave={categoryScroll.onMouseLeave}
                    onMouseUp={categoryScroll.onMouseUp}
                    onMouseMove={categoryScroll.onMouseMove}
                    className="flex gap-2 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
                >
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 h-11 rounded-[1.2rem] text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all active:scale-95 shadow-sm",
                                activeCategory === cat.id
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] ring-2 ring-white/10`
                                    : "bg-card dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-card-border dark:border-card-border hover:border-orange-500/20"
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
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{sortedProducts.length} ürün</span>
                <div className="flex gap-1.5">
                    {(['new', 'price_low', 'price_high'] as const).map(sKey => (
                        <button
                            key={sKey}
                            onClick={() => setSortBy(sKey)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                sortBy === sKey ? "bg-gray-900 dark:bg-card text-white dark:text-black" : "bg-gray-100 dark:bg-white/5 text-gray-500"
                            )}
                        >
                            {sKey === 'new' ? 'En Yeni' : sKey === 'price_low' ? 'En Ucuz' : 'En Pahalı'}
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
                                className="bg-card dark:bg-white/5 rounded-2xl overflow-hidden border border-card-border dark:border-card-border shadow-moffi-card group"
                            >
                                <div 
                                    onClick={() => setSelectedProduct(product)}
                                    className="relative h-36 bg-gradient-to-br from-white to-gray-100/50 dark:from-white/5 dark:to-transparent flex items-center justify-center overflow-hidden cursor-pointer"
                                >
                                    {isImageUrl(getFirstImgUrl(product.image)) ? (
                                        <>
                                            <img 
                                                src={getFirstImgUrl(product.image)} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'inline-block';
                                                }}
                                            />
                                            <span className="hidden text-5xl drop-shadow-2xl group-hover:scale-125 transition-transform duration-500">🦴</span>
                                        </>
                                    ) : (
                                        <span className="text-5xl drop-shadow-2xl group-hover:scale-125 transition-transform duration-500">{product.image || '🦴'}</span>
                                    )}
                                    {product.tag && (
                                        <span className={cn(
                                            "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-xl border border-card-border",
                                            product.tag === 'Çok Satan' ? 'bg-red-500/90' : 'bg-orange-500/90'
                                        )}>
                                            {product.tag}
                                        </span>
                                    )}
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={e => { e.stopPropagation(); toggleFav(product.id); }}
                                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-card-border"
                                    >
                                        <Heart className={cn("w-4 h-4 transition-all", favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400")} />
                                    </motion.button>
                                    
                                    {/* Vet Approved Badge - Conditional */}
                                    {product.isVetApproved && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-emerald-500/30 shadow-sm">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                            <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Vet Onaylı</span>
                                        </div>
                                    )}
                                </div>
 
                                <div className="p-4 bg-card dark:bg-black/20">
                                    <h3 
                                        onClick={() => setSelectedProduct(product)}
                                        className="text-xs font-black text-foreground dark:text-white leading-snug line-clamp-2 h-8 italic mb-2 cursor-pointer hover:text-orange-500 transition-colors"
                                    >
                                        {product.name}
                                    </h3>
                                    
                                    <div className="mb-3" />

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            {product.oldPrice && (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 line-through">₺{product.oldPrice.toLocaleString('tr-TR')}</span>
                                            )}
                                            <span className="text-sm font-black text-foreground dark:text-white">₺{(product.price || 0).toLocaleString('tr-TR')}</span>
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

            {/* MOFFI AI: tek asistan paneli (CLAUDE.md 8.63c), mağaza sorusu hazır yazılı açılır */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Moffi AI'a ürün sor"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant', {
                    detail: { prefill: `${activePet ? activePet.name + ' için' : 'Dostum için'} hangi mama ve ürünleri önerirsin?` },
                }))}
                className="fixed bottom-32 right-6 z-40 w-14 h-14 bg-gray-900 dark:bg-card rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-black"
            >
                <Sparkles className="w-6 h-6 text-white dark:text-foreground" />
            </motion.button>

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
                                <div className="w-9 h-9 bg-black/20 dark:bg-white/20 rounded-xl flex items-center justify-center border border-card-border">
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
                            <div className="px-8 pt-4 pb-6 border-b border-card-border dark:border-card-border flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-md">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground dark:text-white tracking-tighter italic uppercase">Sepetim</h2>
                                    {cart.length > 0 && <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-1">ÖDEME ADIMINA HAZIR</p>}
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
                                        description={`${activePet ? activePet.name : "Dostunuz"} için harika ürünler keşfetmeye ne dersin?`}
                                    />
                                ) : (
                                    <div className="p-8 space-y-4">
                                        {cart.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            if (!product) return null;
                                            const itemTotal = product.price * item.quantity;
                                            return (
                                                <div key={item.productId} className="flex items-center gap-5 bg-card dark:bg-white/5 rounded-[1.8rem] p-4 border border-card-border dark:border-card-border shadow-moffi-card">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl overflow-hidden shrink-0">
                                                        {isImageUrl(getFirstImgUrl(product.image)) ? (
                                                            <>
                                                                <img 
                                                                    src={getFirstImgUrl(product.image)} 
                                                                    alt={product.name} 
                                                                    className="w-full h-full object-cover" 
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        const fallback = e.currentTarget.nextSibling as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'inline-block';
                                                                    }}
                                                                />
                                                                <span className="hidden">🦴</span>
                                                            </>
                                                        ) : (
                                                            product.image || '🦴'
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-foreground dark:text-white truncate italic">{product.name}</h4>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-black text-orange-500 leading-none">₺{itemTotal.toLocaleString('tr-TR')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/10 rounded-xl px-2 py-1.5">
                                                        <button onClick={() => {
                                                            if (item.quantity <= 1) removeFromCart(item.productId);
                                                            else updateCartItem(item.productId, item.quantity - 1);
                                                        }}><Minus className="w-4 h-4 text-gray-500" /></button>
                                                        <span className="text-sm font-black text-foreground dark:text-white w-5 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateCartItem(item.productId, item.quantity + 1)}>
                                                            <Plus className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="sticky bottom-0 bg-white/80 dark:bg-black/60 backdrop-blur-2xl px-8 py-8 border-t border-card-border dark:border-card-border">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-base font-black text-foreground dark:text-white uppercase tracking-tighter italic">Toplam</span>
                                        <span className="text-2xl font-black text-foreground dark:text-white italic">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckoutInit}
                                        disabled={isLoading}
                                        className="w-full h-16 bg-orange-500 text-white font-black text-base rounded-[1.8rem] shadow-xl uppercase italic disabled:opacity-50"
                                    >
                                        {isLoading ? 'Hazırlanıyor...' : 'Siparişi Tamamla'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CHECKOUT MODAL */}
            <AnimatePresence>
                {showCheckout && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl pointer-events-auto"
                            onClick={() => {
                                if (!isProcessingCustomPayment) setShowCheckout(false);
                            }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 z-[111] bg-[#0A0A0C] rounded-t-[3rem] p-8 border-t border-card-border max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto shadow-2xl"
                        >
                            <div className="max-w-md mx-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/5">
                                    <div>
                                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Güvenli Ödeme</h2>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                            Moffi Secure Checkout
                                        </p>
                                    </div>
                                    {!isProcessingCustomPayment && (
                                        <button 
                                            onClick={() => setShowCheckout(false)} 
                                            className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-black/10 dark:bg-white/10 transition-colors"
                                        >
                                            <X size={18} className="text-black/50 dark:text-white/50" />
                                        </button>
                                    )}
                                </div>

                                    <div className="space-y-6">
                                        {/* Errors */}
                                        {checkoutErrors.length > 0 && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 text-red-400 mb-2 font-bold text-xs">
                                                    <AlertCircle size={14} />
                                                    <span>Lütfen Hataları Düzeltin:</span>
                                                </div>
                                                <ul className="list-disc pl-4 text-[11px] text-red-300 font-semibold space-y-1">
                                                    {checkoutErrors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Steps Indicator */}
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                                                checkoutStep === 'address' ? "bg-orange-500 border-orange-600 text-white" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400"
                                            )}>
                                                1. Teslimat Adresi
                                            </span>
                                            <div className="w-8 h-px bg-black/10 dark:bg-white/10" />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                                                checkoutStep === 'payment' ? "bg-orange-500 border-orange-600 text-white" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400"
                                            )}>
                                                2. Ödeme Bilgileri
                                            </span>
                                        </div>

                                        {/* Loader screen for Custom Payment */}
                                        {isProcessingCustomPayment ? (
                                            <div className="flex flex-col items-center py-12 text-center">
                                                <div className="relative mb-6">
                                                    <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Lock className="w-6 h-6 text-orange-500 animate-pulse" />
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase italic tracking-wider">3D Secure Bağlantısı</h3>
                                                <p className="text-[11px] text-gray-500 font-semibold mt-2 max-w-[240px]">
                                                    Bankanızın güvenli ödeme geçidine bağlanılıyor. Lütfen bekleyin...
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* STEP 1: ADDRESS */}
                                                {checkoutStep === 'address' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-orange-500 mb-2">
                                                            <MapPin size={16} />
                                                            <span className="text-xs font-black uppercase tracking-widest text-white">Teslimat Adresi</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Adınız" 
                                                                value={checkoutAddress.name} 
                                                                onChange={e => setCheckoutAddress({...checkoutAddress, name: e.target.value})} 
                                                                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                placeholder="Soyadınız" 
                                                                value={checkoutAddress.surname} 
                                                                onChange={e => setCheckoutAddress({...checkoutAddress, surname: e.target.value})} 
                                                                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                            />
                                                        </div>
                                                        <input 
                                                            type="tel" 
                                                            placeholder="Telefon Numarası" 
                                                            value={checkoutAddress.phone} 
                                                            onChange={e => setCheckoutAddress({...checkoutAddress, phone: e.target.value})} 
                                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                        />
                                                        <textarea 
                                                            rows={3} 
                                                            placeholder="Açık Adres (Mahalle, Cadde, Sokak, No, Daire)" 
                                                            value={checkoutAddress.detail} 
                                                            onChange={e => setCheckoutAddress({...checkoutAddress, detail: e.target.value})} 
                                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600 resize-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isProcessingCustomPayment}
                                                            onClick={async () => {
                                                                if (!checkoutAddress.name.trim() || !checkoutAddress.surname.trim() || !checkoutAddress.phone.trim() || !checkoutAddress.detail.trim()) {
                                                                    setCheckoutErrors(["Lütfen tüm teslimat bilgilerini doldurun."]);
                                                                    return;
                                                                }
                                                                setCheckoutErrors([]);
                                                                setIsProcessingCustomPayment(true);
                                                                try {
                                                                    // Sunucu yalnızca ürün ve adedi alır; fiyat, stok ve kimlik orada doğrulanır.
                                                                    const response = await fetch('/api/paytr/payment', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            address: checkoutAddress,
                                                                            items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                                                                        })
                                                                    });

                                                                    const data = await response.json().catch(() => ({}));
                                                                    if (response.ok) {
                                                                        if (data.success && data.token) {
                                                                            setPaytrToken(data.token);
                                                                            setCheckoutMode('paytr');
                                                                            setCheckoutStep('payment');
                                                                            return;
                                                                        }
                                                                    }
                                                                    // Sunucunun açıklaması (stok, adres, oturum) olduğu gibi gösterilir.
                                                                    setCheckoutErrors([typeof data.error === 'string' ? data.error : "Ödeme sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin."]);
                                                                } catch (err) {
                                                                    console.error("PayTR init failed:", err);
                                                                    setCheckoutErrors(["Ödeme sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin."]);
                                                                    return;
                                                                } finally {
                                                                    setIsProcessingCustomPayment(false);
                                                                }
                                                            }}
                                                            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest italic disabled:opacity-50"
                                                        >
                                                            {isProcessingCustomPayment ? "Hazırlanıyor..." : "Ödeme Bilgilerine Geç"}
                                                            {!isProcessingCustomPayment && <ArrowRight size={12} />}
                                                        </button>
                                                    </div>
                                                )}

                                                
                                                {/* STEP 2: PAYMENT */}
                                                {checkoutStep === 'payment' && (
                                                    <div className="space-y-4">
                                                        {checkoutMode === 'paytr' && paytrToken && (
                                                            <div className="w-full flex flex-col items-center">
                                                                <div className="w-full bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 text-xs space-y-2 mb-4 font-semibold text-gray-500 dark:text-gray-400">
                                                                    <div className="flex justify-between text-xs font-black text-white">
                                                                        <span>Sipariş Tutarı</span>
                                                                        <span className="text-orange-500">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                                                    </div>
                                                                </div>
                                                                <iframe 
                                                                    src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`} 
                                                                    id="paytriframe" 
                                                                    frameBorder="0" 
                                                                    scrolling="yes" 
                                                                    style={{ width: "100%", height: "600px" }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Ödemeden dönüş: siparişin gerçek durumu */}
            {lastOrderId && showTracking && (
                <OrderPlacedSheet orderId={lastOrderId} onClose={() => setShowTracking(false)} />
            )}

            {/* PRODUCT DETAIL MODAL */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md"
                            onClick={() => setSelectedProduct(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[121] flex items-center justify-center px-6 pointer-events-none"
                        >
                            <div className="w-full max-w-4xl bg-card dark:bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden shadow-moffi-card border border-card-border pointer-events-auto flex flex-col md:flex-row max-h-[90vh] md:max-h-[700px] md:h-[620px] relative">
                                {/* Close Button */}
                                <button 
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/30 md:bg-gray-100 md:dark:bg-white/5 md:text-gray-500 dark:md:text-gray-500 dark:text-gray-400 text-white rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 md:border-card-border hover:bg-black/60 md:hover:bg-orange-500 md:hover:text-white dark:md:hover:text-white transition-all z-[130] pointer-events-auto"
                                >
                                    <X size={20} />
                                </button>

                                <div className="relative w-full md:w-[45%] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 h-64 md:h-full">
                                    {/* Compare toggle */}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setComparisonList(prev => {
                                                const exists = prev.find(p => p.id === selectedProduct.id);
                                                if (exists) {
                                                    return prev.filter(p => p.id !== selectedProduct.id);
                                                } else {
                                                    if (prev.length >= 3) {
                                                        alert("En fazla 3 ürünü karşılaştırabilirsiniz!");
                                                        return prev;
                                                    }
                                                    return [...prev, selectedProduct];
                                                }
                                            });
                                        }}
                                        className={cn(
                                            "absolute top-4 left-4 h-10 px-3 bg-black/20 dark:bg-white/20 backdrop-blur-md rounded-full flex items-center gap-1.5 border text-[10px] font-black uppercase tracking-wider transition-all z-20 pointer-events-auto",
                                            comparisonList.some(p => p.id === selectedProduct.id)
                                                ? "bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/25 animate-pulse"
                                                : "border-black/20 dark:border-white/20 text-white hover:bg-white/30"
                                        )}
                                    >
                                        <Sliders size={12} />
                                        {comparisonList.some(p => p.id === selectedProduct.id) ? 'Kıyaslamada' : 'Kıyasla'}
                                    </button>
                                    {(() => {
                                        const imgList = selectedProduct.image ? selectedProduct.image.split(',') : [];
                                        const activeImg = imgList[activeImgIndex] || selectedProduct.image || "🦴";
                                        const isUrl = isImageUrl(activeImg);
                                        return (
                                            <div className="w-full h-full relative flex items-center justify-center">
                                                {isUrl ? (
                                                    <>
                                                        <img 
                                                            src={getImgUrl(activeImg)} 
                                                            alt={selectedProduct.name} 
                                                            className="w-full h-full object-cover bg-black/5 dark:bg-white/5" 
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const fallback = e.currentTarget.nextSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'inline-block';
                                                            }}
                                                        />
                                                        <span className="hidden text-8xl drop-shadow-2xl">🦴</span>
                                                    </>
                                                ) : (
                                                    <span className="text-8xl drop-shadow-2xl">{activeImg || '🦴'}</span>
                                                )}
 
                                                {/* Swipe / Navigation controls */}
                                                {imgList.length > 1 && (
                                                    <>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveImgIndex(prev => (prev === 0 ? imgList.length - 1 : prev - 1));
                                                            }}
                                                            className="absolute left-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/60 transition-colors z-10 pointer-events-auto"
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveImgIndex(prev => (prev === imgList.length - 1 ? 0 : prev + 1));
                                                            }}
                                                            className="absolute right-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/60 transition-colors z-10 pointer-events-auto"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                        
                                                        {/* Navigation dots */}
                                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/35 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                                            {imgList.map((_, dotIdx) => (
                                                                <button
                                                                    key={dotIdx}
                                                                    type="button"
                                                                    onClick={() => setActiveImgIndex(dotIdx)}
                                                                    className={cn(
                                                                        "w-1.5 h-1.5 rounded-full transition-all pointer-events-auto",
                                                                        activeImgIndex === dotIdx ? "bg-white scale-125" : "bg-white/40"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    
                                    {selectedProduct.tag && (
                                        <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-[9px] font-black text-white bg-black/45 backdrop-blur-md uppercase tracking-widest border border-black/10 dark:border-white/10 z-10">
                                            {selectedProduct.tag}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 flex flex-col justify-between max-h-[60vh] md:max-h-full">
                                    <div className="flex items-center gap-2 mb-2 shrink-0">
                                        <span className="text-[10px] font-black bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                                            {selectedProduct.category === 'food' ? 'MAMA' : 
                                             selectedProduct.category === 'snack' ? 'ATIŞTIRMALIK' : 
                                             selectedProduct.category === 'toy' ? 'OYUNCAK' : 
                                             selectedProduct.category === 'care' ? 'BAKIM' : 'AKSESUAR'}
                                        </span>
                                        {selectedProduct.isVetApproved && (
                                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Vet Onaylı
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-base font-black text-foreground dark:text-white leading-tight italic uppercase tracking-tight mb-1 shrink-0">
                                        {selectedProduct.name}
                                    </h3>
                                    <div className="mb-4" />
                                    
                                    {/* Tab Body */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar min-h-[120px] pb-4">
                                        {(
                                            <div className="space-y-5">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-card-border">
                                                    {selectedProduct.description || "Satıcı bu ürün için henüz açıklama eklememiş."}
                                                </div>

                                                {/* Frequently Bought Together */}
                                                {(() => {
                                                    const compProd = getFrequentlyBoughtWith(selectedProduct, products);
                                                    if (!compProd) return null;
                                                    return (
                                                        <div className="space-y-2.5">
                                                            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Bunlar da ilgini çekebilir</span>
                                                            <div className="bg-gray-50 dark:bg-white/5 border border-card-border p-3 rounded-2xl flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-card-border">
                                                                        {isImageUrl(getFirstImgUrl(compProd.image)) ? (
                                                                            <img src={getImgUrl(compProd.image)} alt={compProd.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            compProd.image || "🦴"
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="text-[11px] font-bold text-foreground dark:text-white truncate">{compProd.name}</h4>
                                                                        <p className="text-[10px] text-orange-500 font-black mt-0.5">₺{compProd.price.toLocaleString('tr-TR')}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        addToCart(compProd.id);
                                                                        confetti({
                                                                            particleCount: 50,
                                                                            spread: 40,
                                                                            origin: { y: 0.8 },
                                                                            colors: ['#FF9500', '#5B4D9D']
                                                                        });
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shrink-0 pointer-events-auto transition-transform active:scale-90"
                                                                    title="Sepete Ekle"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}



                                    </div>

                                    {/* Footer / Controls */}
                                    <div className="mt-6 pt-4 border-t border-card-border dark:border-card-border/60 shrink-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Adet</span>
                                                <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-white/10 rounded-xl px-2.5 py-1 w-fit border border-card-border">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setModalQty(prev => Math.max(1, prev - 1))}
                                                        className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors pointer-events-auto"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-xs font-black text-foreground dark:text-white w-4 text-center">{modalQty}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setModalQty(prev => prev + 1)}
                                                        className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors pointer-events-auto"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Toplam Tutar</span>
                                                <div className="flex items-center gap-2 mt-1 shrink-0">
                                                    <span className="text-base font-black text-foreground dark:text-white">
                                                        ₺{(selectedProduct.price * modalQty).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentQty = getCartQty(selectedProduct.id);
                                                    addToCart(selectedProduct.id, currentQty + modalQty);
                                                    setSelectedProduct(null);
                                                    
                                                    // Trigger confetti animation for delightful experience
                                                    confetti({
                                                        particleCount: 100,
                                                        spread: 60,
                                                        origin: { y: 0.8 },
                                                        colors: ['#FF9500', '#5B4D9D', '#FFFFFF']
                                                    });
                                                }}
                                                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest italic pointer-events-auto"
                                            >
                                                <ShoppingCart size={16} />
                                                Sepete Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* COMPARISON FLOATING BAR */}
            <AnimatePresence>
                {comparisonList.length > 0 && !showComparison && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 inset-x-0 z-[110] flex justify-center px-4 pointer-events-none"
                    >
                        <div className="bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-xl border border-card-border/60 dark:border-white/10 px-5 py-3 rounded-full shadow-2xl flex items-center justify-between gap-6 pointer-events-auto max-w-md w-full">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2.5">
                                    {comparisonList.map((prod) => {
                                        const imgList = prod.image ? prod.image.split(',') : [];
                                        const img = imgList[0] || prod.image || "";
                                        return (
                                            <div key={prod.id} className="relative group w-8 h-8 rounded-full border border-card-border dark:border-white/10 bg-white dark:bg-zinc-800 overflow-hidden shadow-sm flex items-center justify-center text-xs shrink-0">
                                                {isImageUrl(img) ? (
                                                    <img src={getImgUrl(img)} alt={prod.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    "🦴"
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setComparisonList(prev => prev.filter(p => p.id !== prod.id));
                                                    }}
                                                    className="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full duration-150"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mb-1">
                                        Karşılaştırma
                                    </span>
                                    <span className="text-[11px] font-bold text-foreground dark:text-white leading-none">
                                        {comparisonList.length} Ürün Seçildi
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setComparisonList([])}
                                    className="px-3 py-2 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-wider transition-colors"
                                >
                                    Temizle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowComparison(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1"
                                >
                                    <Sliders size={10} />
                                    Kıyasla
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPARISON SHEET OVERLAY */}
            <AnimatePresence>
                {showComparison && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[125] bg-black/60 backdrop-blur-md"
                            onClick={() => setShowComparison(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed inset-x-0 bottom-0 z-[126] bg-card dark:bg-[#0F0F0F] border-t border-card-border rounded-t-[2.5rem] shadow-moffi-card max-h-[85vh] flex flex-col pointer-events-auto"
                        >
                            {/* Drag handle or Indicator line */}
                            <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto my-3 shrink-0" />
                            
                            {/* Header */}
                            <div className="px-6 pb-4 border-b border-card-border dark:border-card-border/60 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-base font-black text-foreground dark:text-white leading-none italic uppercase tracking-tight">
                                        Seçilen Ürünleri Karşılaştır
                                    </h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                                        Fiyat ve özellikleri yan yana gör
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowComparison(false)}
                                    className="w-10 h-10 bg-gray-100 dark:bg-white/5 border border-card-border rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Main Grid Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                                {/* Mobile View: stacked card columns */}
                                <div className="grid grid-cols-1 gap-6 md:hidden">
                                    {comparisonList.map((product) => {
                                        const imgList = product.image ? product.image.split(',') : [];
                                        const img = imgList[0] || product.image || "";
                                        
                                        const finalPrice = product.price;

                                        return (
                                            <div 
                                                key={product.id} 
                                                className="bg-gray-50/50 dark:bg-white/[0.02] border border-card-border rounded-3xl p-5 flex flex-col relative transition-all hover:border-orange-500/20"
                                            >
                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedList = comparisonList.filter(p => p.id !== product.id);
                                                        setComparisonList(updatedList);
                                                        if (updatedList.length === 0) {
                                                            setShowComparison(false);
                                                        }
                                                    }}
                                                    className="absolute top-4 right-4 w-7 h-7 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10"
                                                    title="Karşılaştırmadan Kaldır"
                                                >
                                                    <X size={14} />
                                                </button>

                                                {/* Image & Basic Details */}
                                                <div className="flex flex-col items-center text-center pb-4 border-b border-card-border/60">
                                                    <div className="w-28 h-28 bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center mb-3">
                                                        {isImageUrl(img) ? (
                                                            <img src={getImgUrl(img)} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-3xl">🦴</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                                                        {product.category === 'food' ? 'MAMA' : 
                                                         product.category === 'snack' ? 'ATIŞTIRMALIK' : 
                                                         product.category === 'toy' ? 'OYUNCAK' : 
                                                         product.category === 'care' ? 'BAKIM' : 'AKSESUAR'}
                                                    </span>
                                                    <h4 className="text-xs font-black text-foreground dark:text-white leading-tight uppercase tracking-tight line-clamp-1 italic">
                                                        {product.name}
                                                    </h4>
                                                </div>

                                                {/* Price & Rating */}
                                                <div className="py-4 border-b border-card-border/60 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fiyat</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-foreground dark:text-white">
                                                                ₺{finalPrice.toLocaleString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="pt-4 mt-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const currentQty = getCartQty(product.id);
                                                            addToCart(product.id, currentQty + 1);
                                                            confetti({
                                                                particleCount: 50,
                                                                spread: 40,
                                                                origin: { y: 0.8 },
                                                                colors: ['#FF9500', '#5B4D9D', '#FFFFFF']
                                                            });
                                                        }}
                                                        className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase tracking-widest italic"
                                                    >
                                                        <ShoppingCart size={12} />
                                                        Sepete Ekle
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop View: aligned table structure */}
                                <div 
                                    className="hidden md:grid gap-y-4 items-stretch border border-card-border/60 rounded-[2rem] p-6 bg-gray-50/20 dark:bg-white/[0.01]" 
                                    style={{ gridTemplateColumns: `180px repeat(${comparisonList.length}, minmax(0, 1fr))` }}
                                >
                                    {/* Row 1: Header / Product Brand & Name */}
                                    <div className="flex items-center text-[10px] font-black text-gray-500 dark:text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 pb-4">Ürün Detayı</div>
                                    {comparisonList.map((product) => {
                                        const imgList = product.image ? product.image.split(',') : [];
                                        const img = imgList[0] || product.image || "";
                                        return (
                                            <div key={`header-${product.id}`} className="flex flex-col items-center text-center pb-4 border-b border-card-border/40 relative px-4">
                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedList = comparisonList.filter(p => p.id !== product.id);
                                                        setComparisonList(updatedList);
                                                        if (updatedList.length === 0) setShowComparison(false);
                                                    }}
                                                    className="absolute top-0 right-2 w-6 h-6 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                    title="Kaldır"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-card-border shadow-sm flex items-center justify-center mb-2">
                                                    {isImageUrl(img) ? <img src={getImgUrl(img)} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-xl">{img || "🦴"}</span>}
                                                </div>
                                                <span className="text-[8px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                                                    {product.category === 'food' ? 'MAMA' : product.category === 'snack' ? 'ATIŞTIRMALIK' : product.category === 'toy' ? 'OYUNCAK' : product.category === 'care' ? 'BAKIM' : 'AKSESUAR'}
                                                </span>
                                                <h4 className="text-xs font-black text-foreground dark:text-white leading-tight uppercase tracking-tight line-clamp-1 italic">
                                                    {product.name}
                                                </h4>
                                            </div>
                                        );
                                    })}

                                    {/* Row 2: Price */}
                                    <div className="flex items-center text-[10px] font-black text-gray-500 dark:text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 py-4">Fiyat</div>
                                    {comparisonList.map((product) => {
                                        const finalPrice = product.price;
                                        return (
                                            <div key={`price-${product.id}`} className="flex flex-col items-center justify-center border-b border-card-border/40 py-4 px-4 text-center">
                                                <span className="text-sm font-black text-foreground dark:text-white">₺{finalPrice.toLocaleString('tr-TR')}</span>
                                            </div>
                                        );
                                    })}

                                    {/* Row 6: Actions */}
                                    <div className="flex items-center py-4"></div>
                                    {comparisonList.map((product) => {
                                        return (
                                            <div key={`action-${product.id}`} className="flex justify-center py-4 px-6">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentQty = getCartQty(product.id);
                                                        addToCart(product.id, currentQty + 1);
                                                        confetti({
                                                            particleCount: 50,
                                                            spread: 40,
                                                            origin: { y: 0.8 },
                                                            colors: ['#FF9500', '#5B4D9D', '#FFFFFF']
                                                        });
                                                    }}
                                                    className="w-full max-w-[180px] h-10 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase tracking-widest italic"
                                                >
                                                    <ShoppingCart size={12} />
                                                    Sepete Ekle
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
