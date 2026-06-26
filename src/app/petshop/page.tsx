"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, ShoppingBag, Heart, Star, ChevronLeft, ChevronRight,
    ShoppingCart, Plus, Minus, X, Bone, Fish,
    Package, Truck, CheckCircle2, Tag, Sparkles, AlertCircle, Info, ArrowRight,
    Sliders, CreditCard, MapPin, Lock, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePetShop } from "@/hooks/usePetShop";
import type { ShopCategory, ShopProduct } from "@/types/domain";
import AdvisorChat from "@/components/petshop/AdvisorChat";
import { usePet } from "@/context/PetContext";
import { useAuth } from "@/context/AuthContext";
import { loadStripe } from '@stripe/stripe-js';
import { useDragScroll } from "@/hooks/useDragScroll";
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { OrderTrackingModal } from '@/components/shop/OrderTrackingModal';
import confetti from 'canvas-confetti';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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
            <h3 className="text-base font-bold text-foreground dark:text-gray-300 mb-1">{title}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{description}</p>
        </div>
    );
}

// ==========================================
// TURKISH POSSESSIVE SUFFIX HELPER
// ==========================================
const getPossessive = (name: string) => {
    if (!name) return "";
    const lastChar = name.slice(-1).toLowerCase();
    const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
    const isVowel = vowels.includes(lastChar);
    
    let lastVowel = 'a';
    for (let i = name.length - 1; i >= 0; i--) {
        const char = name[i].toLowerCase();
        if (vowels.includes(char)) {
            lastVowel = char;
            break;
        }
    }
    
    let suffix = "";
    if (['a', 'ı'].includes(lastVowel)) {
        suffix = isVowel ? "nın" : "ın";
    } else if (['e', 'i'].includes(lastVowel)) {
        suffix = isVowel ? "nin" : "in";
    } else if (['o', 'u'].includes(lastVowel)) {
        suffix = isVowel ? "nun" : "un";
    } else if (['ö', 'ü'].includes(lastVowel)) {
        suffix = isVowel ? "nün" : "ün";
    } else {
        suffix = "in";
    }
    
    return `${name}'${suffix}`;
};



const getSmartRecommendation = (productName: string, category: string, pet: any) => {
    if (!pet) return "Moffi Smart Entegrasyonu aktif. En uygun tavsiye için bir evcil hayvan profili ekleyin veya seçin.";
    
    const petName = pet.name;
    const petBreed = pet.breed || "dostunuz";
    const petWeight = pet.weight || "10";
    
    if (category === 'food') {
        return `🐾 ${petName} (${petBreed}, ${petWeight}kg) için Moffi AI Analizi: Bu kuru mama, ${petName}'in kilosunu koruması ve kas yapısını güçlendirmesi için en uygun besin dengesine (32% protein) sahiptir. Yüksek sindirilebilirlik formülü sayesinde günlük enerji ihtiyacını karşılar.`;
    } else if (category === 'snack') {
        return `🐾 Egzersiz Ödülü: Bugün yaptığınız yürüyüşten sonra ${petName}'e bu ödülü vererek hem motivasyonunu artırabilir hem de kaybettiği enerjiyi sağlıklı vitaminlerle geri kazandırabilirsiniz.`;
    } else if (category === 'toy') {
        return `🐾 Zihinsel Gelişim: ${petName} oldukça meraklı bir karaktere sahip. Bu oyuncak, onun avcılık ve çiğneme içgüdüsünü uyararak evde yalnız kaldığı süre boyunca sıkılmasını engeller ve kaygısını azaltır.`;
    } else if (category === 'care') {
        return `🐾 Tüy & Cilt Sağlığı: ${petBreed} ırkı dostunuzun tüylerinin parlak ve sağlıklı kalması için bu özel PH dengeli formül önerilir. Dökülmeyi ve kaşıntıyı minimuma indiren bitkisel yağlar içerir.`;
    } else {
        return `🐾 Konforlu Yürüyüş: ${petName}'in boy ve kilosuna uygun olarak tasarlanan bu aksesuar, yürüyüşlerde tasmayı çektiğinde boynuna baskı yapmaz, göğüs kafesine kuvveti eşit yayarak güvenli bir yürüyüş deneyimi sunar.`;
    }
};

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
    const quickBuyScroll = useDragScroll();
    const categoryScroll = useDragScroll();
    const { activePet } = usePet();
    const { user } = useAuth();
    const {
        products, cart, cartCount, cartTotal,
        isLoading, error,
        fetchProducts, searchProducts,
        addToCart, updateCartItem, removeFromCart, clearCart,
        validateDiscount, createOrder,
        subscriptions, subscribeToProduct
    } = usePetShop();

    // PAYMENT & REDIRECT LISTENER FOR PAYTR
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const orderId = params.get('orderId');

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

    // Custom Checkout States
    const [checkoutMode, setCheckoutMode] = useState<'stripe' | 'custom' | 'paytr'>('custom');
    const [checkoutStep, setCheckoutStep] = useState<'address' | 'payment'>('address');
    const [checkoutAddress, setCheckoutAddress] = useState({ name: "", surname: "", phone: "", detail: "" });
    const [checkoutCard, setCheckoutCard] = useState({ number: "", expiry: "", cvc: "", holder: "" });
    const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
    const [isProcessingCustomPayment, setIsProcessingCustomPayment] = useState(false);
    const [paytrToken, setPaytrToken] = useState<string | null>(null);

    // ECOSYSTEM PREFERENCES
    const [isSmartShopEnabled, setIsSmartShopEnabled] = useState(true);
    const [showSmartModal, setShowSmartModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [detailTab, setDetailTab] = useState<'overview' | 'specs' | 'smart' | 'reviews'>('overview');
    const [modalQty, setModalQty] = useState(1);

    // Advanced features states
    const [comparisonList, setComparisonList] = useState<ShopProduct[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [reviews, setReviews] = useState<Record<string, Array<{
        id: string;
        username: string;
        avatar: string;
        rating: number;
        comment: string;
        date: string;
        petTag?: string;
    }>>>({});
    const [newReviewStar, setNewReviewStar] = useState(5);
    const [newReviewText, setNewReviewText] = useState("");

    useEffect(() => {
        setActiveImgIndex(0);
        setDetailTab('overview');
        setModalQty(1);
        setNewReviewStar(5);
        setNewReviewText("");
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
            const initialReviews = { ...reviews };
            let updated = false;
            products.forEach(p => {
                if (!initialReviews[p.id]) {
                    initialReviews[p.id] = [
                        {
                            id: `rev-1-${p.id}`,
                            username: "Ahmet S.",
                            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100",
                            rating: 5,
                            comment: "Ürünün kalitesi gerçekten çok yüksek. Paketleme çok özenliydi, kurye arkadaşa da hızı için teşekkür ederim. Tavsiye ederim.",
                            date: "14.05.2026",
                            petTag: "🐶 Pug sahibi"
                        },
                        {
                            id: `rev-2-${p.id}`,
                            username: "Selin K.",
                            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
                            rating: 4,
                            comment: "Beklediğimden biraz daha küçük geldi ama kalitesi çok güzel. Bizimki elinden düşürmüyor, iştahla tüketiyor/keyifle oynuyor.",
                            date: "02.06.2026",
                            petTag: "🐱 Tekir sahibi"
                        }
                    ];
                    updated = true;
                }
            });
            if (updated) {
                setReviews(initialReviews);
            }
        }
    }, [products]);

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
        setCheckoutStep('address');
        setCheckoutErrors([]);
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: cartTotal,
                    items: cart 
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.clientSecret) {
                    setPaymentClientSecret(data.clientSecret);
                    setCheckoutMode('stripe');
                    setShowCheckout(true);
                    return;
                }
            }
            // Fallback to custom checkout
            setCheckoutMode('custom');
            setShowCheckout(true);
        } catch (err) {
            console.warn("Stripe init failed, falling back to simulated checkout:", err);
            setCheckoutMode('custom');
            setShowCheckout(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomPaymentConfirm = async () => {
        const errorsList: string[] = [];
        if (!checkoutAddress.name.trim() || !checkoutAddress.surname.trim() || !checkoutAddress.phone.trim() || !checkoutAddress.detail.trim()) {
            errorsList.push("Lütfen teslimat adresi bilgilerini eksiksiz doldurun.");
        }
        if (!checkoutCard.number || checkoutCard.number.length < 16) {
            errorsList.push("Geçerli bir 16 haneli kart numarası giriniz.");
        }
        if (!checkoutCard.expiry || checkoutCard.expiry.length < 5 || !checkoutCard.cvc || checkoutCard.cvc.length < 3 || !checkoutCard.holder.trim()) {
            errorsList.push("Kart bilgileri (SKT, CVC, İsim) eksiksiz olmalıdır.");
        }

        if (errorsList.length > 0) {
            setCheckoutErrors(errorsList);
            return;
        }

        setCheckoutErrors([]);
        setIsProcessingCustomPayment(true);
        
        setTimeout(async () => {
            try {
                const fullAddress = `${checkoutAddress.name} ${checkoutAddress.surname}, Tel: ${checkoutAddress.phone}, Adres: ${checkoutAddress.detail}`;
                const order = await createOrder(fullAddress, discountCode);
                if (order) {
                    setLastOrderId(order.id);
                    setShowCart(false);
                    setShowCheckout(false);
                    setShowTracking(true);
                    
                    // Reset forms
                    setCheckoutAddress({ name: "", surname: "", phone: "", detail: "" });
                    setCheckoutCard({ number: "", expiry: "", cvc: "", holder: "" });
                    
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#FF9500', '#5B4D9D', '#FFFFFF']
                    });
                } else {
                    setCheckoutErrors(["Sipariş oluşturulurken veritabanı hatası oluştu. Lütfen tekrar deneyin."]);
                }
            } catch (err) {
                console.error("Custom checkout error:", err);
                setCheckoutErrors(["Beklenmedik bir hata oluştu."]);
            } finally {
                setIsProcessingCustomPayment(false);
            }
        }, 1500);
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
            <div className="sticky top-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-b border-card-border dark:border-card-border transition-colors">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) router.back();
                            else router.push('/community');
                        }} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Ürün veya marka ara..."
                            className="w-full h-11 pl-10 pr-4 bg-gray-200/50 dark:bg-white/5 rounded-2xl text-sm text-foreground dark:text-white placeholder:text-gray-500 outline-none border-2 border-transparent focus:border-orange-500/10 focus:bg-card dark:focus:bg-black/20 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* QUICK BUY BAR (ACTIVE PET'S FAVORITES or TREND) */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-black text-foreground dark:text-white uppercase tracking-tighter">
                        {isSmartShopEnabled 
                            ? `${activePet ? getPossessive(activePet.name) : "Dostunuzun"} Favorileri 🦴` 
                            : "Haftanın Trendleri 🔥"}
                    </h2>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Hızlı Al</span>
                </div>
                <div 
                    ref={quickBuyScroll.ref}
                    onMouseDown={quickBuyScroll.onMouseDown}
                    onMouseLeave={quickBuyScroll.onMouseLeave}
                    onMouseUp={quickBuyScroll.onMouseUp}
                    onMouseMove={quickBuyScroll.onMouseMove}
                    className="flex gap-3 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing select-none"
                >
                    {quickBuyProducts.map(product => (
                        <motion.button
                            key={`quick-${product.id}`}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(product.id)}
                            className="flex flex-col items-center shrink-0 w-24 bg-card dark:bg-white/5 rounded-3xl p-3 border border-card-border dark:border-card-border shadow-moffi-card active:bg-orange-50 transition-colors"
                        >
                            {product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.includes('.') || product.image.length > 4) ? (
                                <>
                                    <img 
                                        src={getFirstImgUrl(product.image)} 
                                        alt={product.name} 
                                        className="w-10 h-10 object-cover rounded-xl mb-2 drop-shadow-md bg-white/5" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'inline-block';
                                        }}
                                    />
                                    <span className="hidden text-3xl mb-2 drop-shadow-md">🦴</span>
                                </>
                            ) : (
                                <span className="text-3xl mb-2 drop-shadow-md">{product.image || '🦴'}</span>
                            )}
                            <span className="text-[9px] font-black text-foreground dark:text-white/80 text-center line-clamp-1 italic uppercase tracking-tighter">{product.name}</span>
                            <span className="text-[10px] font-black text-orange-500 mt-1">₺{(product.price || 0).toLocaleString('tr-TR')}</span>
                        </motion.button>
                    ))}
                    <div className="flex flex-col items-center justify-center shrink-0 w-24 bg-gray-50 dark:bg-white/5 rounded-3xl p-3 border border-dashed border-card-border dark:border-card-border">
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
                <span className="text-xs text-gray-400 font-medium">{sortedProducts.length} ürün</span>
                <div className="flex gap-1.5">
                    {(['popular', 'price_low', 'price_high'] as const).map(sKey => (
                        <button
                            key={sKey}
                            onClick={() => setSortBy(sKey)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                sortBy === sKey ? "bg-gray-900 dark:bg-card text-white dark:text-black" : "bg-gray-100 dark:bg-white/5 text-gray-500"
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
                                className="bg-card dark:bg-white/5 rounded-2xl overflow-hidden border border-card-border dark:border-card-border shadow-moffi-card group"
                            >
                                <div 
                                    onClick={() => setSelectedProduct(product)}
                                    className="relative h-36 bg-gradient-to-br from-white to-gray-100/50 dark:from-white/5 dark:to-transparent flex items-center justify-center overflow-hidden cursor-pointer"
                                >
                                    {product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.includes('.') || product.image.length > 4) ? (
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
                                            product.tag === 'Çok Satan' ? 'bg-red-500/90' : 'bg-indigo-500/90'
                                        )}>
                                            {product.tag}
                                        </span>
                                    )}
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={e => { e.stopPropagation(); toggleFav(product.id); }}
                                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-card-border"
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
 
                                <div className="p-4 bg-card dark:bg-black/20">
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-1 leading-none">{product.brand?.name || "Moffi"}</p>
                                    <h3 
                                        onClick={() => setSelectedProduct(product)}
                                        className="text-xs font-black text-foreground dark:text-white leading-snug line-clamp-2 h-8 italic mb-2 cursor-pointer hover:text-orange-500 transition-colors"
                                    >
                                        {product.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {product.category === 'snack' && isSmartShopEnabled && (
                                            <div className="flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded-lg border border-blue-500/20">
                                                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                                                <span className="text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Walk Ödülü ⚡</span>
                                            </div>
                                        )}
                                        {product.isRecentlyBought && isSmartShopEnabled && (
                                            <span className="text-[8px] font-bold text-gray-400 italic">
                                                {activePet ? `${activePet.name} bunu seviyor` : "Dostunuz bunu seviyor"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Auto-Ship Toggle Visual */}
                                    <div 
                                        onClick={() => subscribeToProduct(product.id)}
                                        className={cn(
                                            "flex items-center gap-2 mb-3 p-2 rounded-xl border transition-all cursor-pointer",
                                            subscriptions.find(s => s.id === product.id)
                                                ? "bg-orange-500 border-orange-600 shadow-md scale-[1.02]"
                                                : "bg-gray-50 dark:bg-white/5 border-card-border dark:border-card-border hover:bg-orange-50"
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
                                                    ? "bg-card scale-100"
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
                                            {product.oldPrice && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through">₺{product.oldPrice.toLocaleString('tr-TR')}</span>
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

            {/* DELIVERY INFO */}
            <div className="px-5 mt-8 mb-4">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-[2.2rem] border border-white/40 dark:border-card-border p-5 flex items-center gap-5 group shadow-sm">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <Truck className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-foreground dark:text-white uppercase tracking-tighter italic">Ücretsiz Kargo</h3>
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
                className="fixed bottom-32 right-6 z-40 w-14 h-14 bg-gray-900 dark:bg-card rounded-full flex items-center justify-center shadow-2xl group border-4 border-white dark:border-black transition-all"
            >
                <div className="absolute inset-0 bg-gray-900 dark:bg-card rounded-full animate-ping opacity-20" />
                <Sparkles className="w-6 h-6 text-white dark:text-foreground group-hover:rotate-12 transition-transform" />
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
                            <div className="w-full max-w-sm bg-card dark:bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden shadow-moffi-card border border-card-border pointer-events-auto">
                                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
                                            <Sparkles className="w-12 h-12 text-white animate-pulse" />
                                        </div>
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-4 -right-4 w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <Bone className="w-6 h-6 text-orange-500" />
                                        </motion.div>
                                    </div>
                                </div>
                                <div className="p-8 text-center">
                                    <h3 className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter italic leading-tight">
                                        Akıllı Mağaza<br/>Deneyimine Hazır mısın?
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed px-2">
                                        {activePet ? getPossessive(activePet.name) : "Dostunuzun"} yürüyüş mesafesi, sağlık verileri ve iştah durumunu analiz ederek ona en uygun mama ve ödülleri önermemize izin ver.
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
                                            className="w-full h-12 text-[10px] font-black text-gray-400 hover:text-foreground dark:hover:text-white transition-colors uppercase tracking-widest"
                                        >
                                            Şimdilik Bağımsız Kalsın
                                        </button>
                                    </div>
                                    
                                    <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest border-t border-card-border dark:border-card-border pt-6">
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
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-card-border">
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
                                        description={`${activePet ? activePet.name : "Dostunuz"} için harika ürünler keşfetmeye ne dersin?`}
                                    />
                                ) : (
                                    <div className="p-8 space-y-4">
                                        {cart.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            if (!product) return null;
                                            const isSubscribed = subscriptions.some(s => s.id === product.id);
                                            const unitPrice = isSubscribed ? product.price * 0.90 : product.price;
                                            const itemTotal = unitPrice * item.quantity;
                                            return (
                                                <div key={item.productId} className="flex items-center gap-5 bg-card dark:bg-white/5 rounded-[1.8rem] p-4 border border-card-border dark:border-card-border shadow-moffi-card">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl overflow-hidden shrink-0">
                                                        {product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.includes('.') || product.image.length > 4) ? (
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
                                                                {isSubscribed && (
                                                                    <span className="text-[10px] text-gray-400 line-through">₺{(product.price * item.quantity).toLocaleString('tr-TR')}</span>
                                                                )}
                                                            </div>
                                                            {isSubscribed && (
                                                                <span className="text-[8px] font-black bg-orange-500/10 text-orange-500 py-0.5 px-1.5 rounded-md uppercase tracking-wider w-fit">Abonelik -%10</span>
                                                            )}
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
                                        
                                        <div className="flex gap-3 pt-4">
                                            <input
                                                value={discountCode}
                                                onChange={e => { setDiscountCode(e.target.value); setDiscountResult(null); }}
                                                placeholder="İndirim kodu..."
                                                className="flex-1 h-12 px-5 bg-card dark:bg-white/5 rounded-2xl text-sm border-2 border-transparent focus:border-orange-500/20 outline-none"
                                            />
                                            <button onClick={handleApplyDiscount} className="px-6 h-12 bg-gray-950 dark:bg-card text-white dark:text-black text-[11px] font-black uppercase rounded-2xl">Uygula</button>
                                        </div>
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
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                    <div>
                                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Güvenli Ödeme</h2>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                            {checkoutMode === 'stripe' ? 'Stripe Gateway' : 'Moffi Secure Simulation'}
                                        </p>
                                    </div>
                                    {!isProcessingCustomPayment && (
                                        <button 
                                            onClick={() => setShowCheckout(false)} 
                                            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                                        >
                                            <X size={18} className="text-white/50" />
                                        </button>
                                    )}
                                </div>

                                {checkoutMode === 'stripe' && paymentClientSecret ? (
                                    <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret, appearance: { theme: 'night' } }}>
                                        <CheckoutForm 
                                            amount={cartTotal} 
                                            onSuccess={handlePaymentSuccess} 
                                            onCancel={() => setShowCheckout(false)} 
                                        />
                                    </Elements>
                                ) : (
                                    /* CUSTOM SIMULATED CHECKOUT FORM */
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
                                                checkoutStep === 'address' ? "bg-orange-500 border-orange-600 text-white" : "bg-white/5 border-white/5 text-gray-400"
                                            )}>
                                                1. Teslimat Adresi
                                            </span>
                                            <div className="w-8 h-px bg-white/10" />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                                                checkoutStep === 'payment' ? "bg-orange-500 border-orange-600 text-white" : "bg-white/5 border-white/5 text-gray-400"
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
                                                                className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                placeholder="Soyadınız" 
                                                                value={checkoutAddress.surname} 
                                                                onChange={e => setCheckoutAddress({...checkoutAddress, surname: e.target.value})} 
                                                                className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                            />
                                                        </div>
                                                        <input 
                                                            type="tel" 
                                                            placeholder="Telefon Numarası" 
                                                            value={checkoutAddress.phone} 
                                                            onChange={e => setCheckoutAddress({...checkoutAddress, phone: e.target.value})} 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600"
                                                        />
                                                        <textarea 
                                                            rows={3} 
                                                            placeholder="Açık Adres (Mahalle, Cadde, Sokak, No, Daire)" 
                                                            value={checkoutAddress.detail} 
                                                            onChange={e => setCheckoutAddress({...checkoutAddress, detail: e.target.value})} 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold placeholder:text-gray-600 resize-none"
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
                                                                    const mappedItems = cart.map(item => {
                                                                        const p = products.find(prod => prod.id === item.productId);
                                                                        return {
                                                                            productId: item.productId,
                                                                            name: p ? p.name : "Ürün",
                                                                            price: p ? p.price : 0,
                                                                            quantity: item.quantity
                                                                        };
                                                                    });

                                                                    const response = await fetch('/api/paytr/payment', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            amount: cartTotal,
                                                                            email: user?.email || "test@moffipet.com",
                                                                            address: checkoutAddress,
                                                                            items: mappedItems,
                                                                            userId: user?.id
                                                                        })
                                                                    });

                                                                    if (response.ok) {
                                                                        const data = await response.json();
                                                                        if (data.success && data.token) {
                                                                            setPaytrToken(data.token);
                                                                            setCheckoutMode('paytr');
                                                                            setCheckoutStep('payment');
                                                                            return;
                                                                        }
                                                                    }
                                                                    
                                                                    // Fallback to custom offline simulator if keys are placeholder/missing
                                                                    setCheckoutMode('custom');
                                                                    setCheckoutStep('payment');
                                                                } catch (err) {
                                                                    console.warn("PayTR token fetch failed, falling back to simulated checkout:", err);
                                                                    setCheckoutMode('custom');
                                                                    setCheckoutStep('payment');
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
                                                        {checkoutMode === 'paytr' && paytrToken ? (
                                                            <div className="w-full flex flex-col items-center">
                                                                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs space-y-2 mb-4 font-semibold text-gray-400">
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
                                                                    className="w-full h-[480px] rounded-2xl border border-white/10 bg-white"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCheckoutStep('address')}
                                                                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider mt-4"
                                                                >
                                                                    Geri Dön
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* OFFLINE CREDIT CARD FORM FALLBACK */
                                                            <>
                                                                {/* Credit Card Graphic mockup */}
                                                                <div className="w-full aspect-[1.586/1] rounded-2xl p-5 relative overflow-hidden bg-gradient-to-tr from-orange-500 to-purple-600 text-white shadow-xl flex flex-col justify-between">
                                                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[7px] font-black uppercase tracking-widest text-white/77">Moffi Pay</span>
                                                                            <div className="w-7 h-5 bg-amber-400/80 rounded mt-1" />
                                                                        </div>
                                                                        <span className="text-xs font-black italic tracking-tight uppercase">MOFFI</span>
                                                                    </div>
                                                                    <div className="font-mono text-base tracking-widest text-center my-1 select-none">
                                                                        {checkoutCard.number ? checkoutCard.number.replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                                                                    </div>
                                                                    <div className="flex justify-between items-end">
                                                                        <div className="flex flex-col max-w-[60%]">
                                                                            <span className="text-[6px] font-black uppercase text-white/50 leading-none mb-0.5">KART SAHİBİ</span>
                                                                            <span className="text-[10px] font-bold tracking-wide uppercase truncate leading-none">
                                                                                {checkoutCard.holder || 'ISIM SOYISIM'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-end gap-3">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[6px] font-black uppercase text-white/50 leading-none mb-0.5">S.K.T</span>
                                                                                <span className="text-[10px] font-mono font-bold tracking-wider leading-none">
                                                                                    {checkoutCard.expiry || 'AA/YY'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[6px] font-black uppercase text-white/50 leading-none mb-0.5">CVC</span>
                                                                                <span className="text-[10px] font-mono font-bold tracking-wider leading-none">
                                                                                    {checkoutCard.cvc || '•••'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Input fields */}
                                                                <div className="space-y-3">
                                                                    <input 
                                                                        type="text" 
                                                                        maxLength={16} 
                                                                        placeholder="Kart Numarası (16 Hane)" 
                                                                        value={checkoutCard.number} 
                                                                        onChange={e => setCheckoutCard({...checkoutCard, number: e.target.value.replace(/\D/g, '')})} 
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-600"
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <input 
                                                                            type="text" 
                                                                            maxLength={5} 
                                                                            placeholder="AA/YY" 
                                                                            value={checkoutCard.expiry} 
                                                                            onChange={e => {
                                                                                let val = e.target.value;
                                                                                if (val.length === 2 && !val.includes('/')) val += '/';
                                                                                setCheckoutCard({...checkoutCard, expiry: val});
                                                                            }} 
                                                                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-600"
                                                                        />
                                                                        <input 
                                                                            type="text" 
                                                                            maxLength={3} 
                                                                            placeholder="CVC" 
                                                                            value={checkoutCard.cvc} 
                                                                            onChange={e => setCheckoutCard({...checkoutCard, cvc: e.target.value.replace(/\D/g, '')})} 
                                                                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-600"
                                                                        />
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Kart Üzerindeki İsim" 
                                                                        value={checkoutCard.holder} 
                                                                        onChange={e => setCheckoutCard({...checkoutCard, holder: e.target.value})} 
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all font-semibold uppercase placeholder:text-gray-600 placeholder:normal-case"
                                                                    />
                                                                </div>

                                                                {/* Summary pricing */}
                                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs space-y-2 mt-4 font-semibold text-gray-400">
                                                                    <div className="flex justify-between">
                                                                        <span>Ürünlerin Toplamı</span>
                                                                        <span className="text-white">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>Kargo Hizmeti</span>
                                                                        <span className="text-emerald-500">Ücretsiz</span>
                                                                    </div>
                                                                    <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-black text-white">
                                                                        <span>Genel Toplam</span>
                                                                        <span className="text-orange-500">₺{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Actions buttons */}
                                                                <div className="grid grid-cols-3 gap-3 pt-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCheckoutStep('address')}
                                                                        className="col-span-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                                                                    >
                                                                        Geri
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCustomPaymentConfirm}
                                                                        className="col-span-2 h-12 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest italic shadow-lg shadow-orange-500/25"
                                                                    >
                                                                        <ShieldCheck size={14} />
                                                                        Ödemeyi Tamamla
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
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
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/30 md:bg-gray-100 md:dark:bg-white/5 md:text-gray-500 dark:md:text-gray-400 text-white rounded-full flex items-center justify-center border border-white/10 md:border-card-border hover:bg-black/60 md:hover:bg-orange-500 md:hover:text-white dark:md:hover:text-white transition-all z-[130] pointer-events-auto"
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
                                            "absolute top-4 left-4 h-10 px-3 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-1.5 border text-[10px] font-black uppercase tracking-wider transition-all z-20 pointer-events-auto",
                                            comparisonList.some(p => p.id === selectedProduct.id)
                                                ? "bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/25 animate-pulse"
                                                : "border-white/20 text-white hover:bg-white/30"
                                        )}
                                    >
                                        <Sliders size={12} />
                                        {comparisonList.some(p => p.id === selectedProduct.id) ? 'Kıyaslamada' : 'Kıyasla'}
                                    </button>
                                    {(() => {
                                        const imgList = selectedProduct.image ? selectedProduct.image.split(',') : [];
                                        const activeImg = imgList[activeImgIndex] || selectedProduct.image || "🦴";
                                        const isUrl = activeImg && (
                                            activeImg.startsWith('http') || 
                                            activeImg.startsWith('/') || 
                                            activeImg.includes('.') || 
                                            activeImg.length > 4
                                        );
                                        return (
                                            <div className="w-full h-full relative flex items-center justify-center">
                                                {isUrl ? (
                                                    <>
                                                        <img 
                                                            src={getImgUrl(activeImg)} 
                                                            alt={selectedProduct.name} 
                                                            className="w-full h-full object-cover bg-white/5" 
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
                                                            className="absolute left-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors z-10 pointer-events-auto"
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveImgIndex(prev => (prev === imgList.length - 1 ? 0 : prev + 1));
                                                            }}
                                                            className="absolute right-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors z-10 pointer-events-auto"
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
                                        <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-[9px] font-black text-white bg-black/45 backdrop-blur-md uppercase tracking-widest border border-white/10 z-10">
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
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4 shrink-0">
                                        {selectedProduct.brand?.name || "Moffi Premium"}
                                    </p>
                                    
                                    {/* Tab Switcher */}
                                    <div className="flex border-b border-card-border dark:border-card-border/60 mb-5 shrink-0 px-1">
                                        {(['overview', 'smart', 'reviews'] as const).map((tab) => {
                                            if (tab === 'smart' && !isSmartShopEnabled) return null;
                                            return (
                                                <button
                                                    key={tab}
                                                    type="button"
                                                    onClick={() => setDetailTab(tab)}
                                                    className={cn(
                                                        "flex-1 pb-2 text-[10px] font-black uppercase tracking-wider relative transition-colors",
                                                        detailTab === tab 
                                                            ? "text-orange-500" 
                                                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    )}
                                                >
                                                    {tab === 'overview' ? 'Genel' : tab === 'smart' ? '🐾 Öneri' : 'Yorumlar'}
                                                    {detailTab === tab && (
                                                        <motion.div
                                                            layoutId="activeDetailTabLine"
                                                            className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tab Body */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar min-h-[120px] pb-4">
                                        {/* TAB 1: OVERVIEW */}
                                        {detailTab === 'overview' && (
                                            <div className="space-y-5">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-card-border">
                                                    {selectedProduct.description || "Bu ürün patili dostunuzun sağlıklı gelişimi, neşeli vakit geçirmesi ve günlük enerji ihtiyacını en dengeli şekilde karşılaması için özel olarak üretilmiştir. Tamamen doğal bileşenlerden oluşur."}
                                                </div>

                                                {/* Vet specialist text - conditional */}
                                                {selectedProduct.isVetApproved && (
                                                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                                                <CheckCircle2 size={12} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Hekim Görüşü • Dr. Selim Yılmaz</span>
                                                        </div>
                                                        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                                                            {selectedProduct.category === 'food' ? "Dostunuzun günlük metabolik ihtiyacını yormadan karşılayan, sindirimi yüksek bileşenler içerir. Sindirim hassasiyeti olan evcil hayvanlarda tüy kalitesini gözle görülür şekilde artırır." :
                                                             selectedProduct.category === 'snack' ? "Egzersiz sonrası kas yenilenmesini hızlandıran amino asitlerce zengindir. Doğal içeriği sayesinde böbrek ve karaciğer fonksiyonlarını yormaz." :
                                                             selectedProduct.category === 'toy' ? "Diş ve diş eti masajı yaparak tartar oluşumunu engeller. Çene kaslarını güçlendirirken zihinsel enerjisini sağlıklı bir şekilde atmasını sağlar." :
                                                             selectedProduct.category === 'care' ? "Cildin koruyucu lipid tabakasını tahriş etmeden temizler, pH seviyesi köpek derisi ile mükemmel uyumludur." :
                                                             "Ergonomik tasarımı sayesinde göğüs kafesine ve omurgaya eşit yük dağılımı sağlayarak eklem deformasyonlarını engeller."}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Subscription Selector */}
                                                <div className="space-y-2.5">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Satın Alma Tipi</span>
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (subscriptions.some(s => s.id === selectedProduct.id)) {
                                                                    subscribeToProduct(selectedProduct.id);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all pointer-events-auto",
                                                                !subscriptions.some(s => s.id === selectedProduct.id)
                                                                    ? "bg-orange-500/10 border-orange-500 text-foreground dark:text-white"
                                                                    : "bg-gray-50 dark:bg-white/5 border-card-border dark:border-card-border"
                                                            )}
                                                        >
                                                            <span className="text-[8px] font-black uppercase tracking-wider">Tek Sefer</span>
                                                            <span className="text-xs font-black mt-2">₺{selectedProduct.price.toLocaleString('tr-TR')}</span>
                                                        </button>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!subscriptions.some(s => s.id === selectedProduct.id)) {
                                                                    subscribeToProduct(selectedProduct.id);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden pointer-events-auto",
                                                                subscriptions.some(s => s.id === selectedProduct.id)
                                                                    ? "bg-orange-500/10 border-orange-500 text-foreground dark:text-white"
                                                                    : "bg-gray-50 dark:bg-white/5 border-card-border dark:border-card-border"
                                                            )}
                                                        >
                                                            <span className="absolute top-0 right-0 bg-orange-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-widest leading-none">-%10</span>
                                                            <span className="text-[8px] font-black uppercase tracking-wider">Abonelik</span>
                                                            <span className="text-xs font-black mt-2">₺{(selectedProduct.price * 0.9).toLocaleString('tr-TR')}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Frequently Bought Together */}
                                                {(() => {
                                                    const compProd = getFrequentlyBoughtWith(selectedProduct, products);
                                                    if (!compProd) return null;
                                                    return (
                                                        <div className="space-y-2.5">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Birlikte Sıkça Alınanlar</span>
                                                            <div className="bg-gray-50 dark:bg-white/5 border border-card-border p-3 rounded-2xl flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-card-border">
                                                                        {compProd.image && (compProd.image.startsWith("http") || compProd.image.startsWith("/") || compProd.image.includes(".") || compProd.image.length > 4) ? (
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



                                        {/* TAB 3: SMART RECOMMENDATION */}
                                        {detailTab === 'smart' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 shrink-0">
                                                        <Sparkles size={16} />
                                                    </div>
                                                    <h4 className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-widest">Moffi AI Analiz Raporu</h4>
                                                </div>
                                                <div className="bg-gradient-to-br from-orange-500/5 to-rose-500/5 border border-orange-500/20 p-4 rounded-[1.5rem] relative overflow-hidden">
                                                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                                                    <p className="text-xs text-foreground dark:text-white/90 leading-relaxed font-semibold">
                                                        {getSmartRecommendation(selectedProduct.name, selectedProduct.category, activePet)}
                                                    </p>
                                                </div>
                                                {activePet && (
                                                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-card-border flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-card-border">
                                                            <img src={activePet.image || activePet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"} alt={activePet.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-wider">{activePet.name}</h5>
                                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{activePet.breed} • {activePet.weight} kg</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB 4: REVIEWS */}
                                        {detailTab === 'reviews' && (
                                            <div className="space-y-4">
                                                {/* Review List */}
                                                <div className="space-y-3.5 max-h-56 overflow-y-auto no-scrollbar">
                                                    {((reviews[selectedProduct.id]) || []).map((rev) => (
                                                        <div key={rev.id} className="bg-gray-50 dark:bg-white/5 border border-card-border p-3 rounded-2xl space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-card-border shrink-0">
                                                                        <img src={rev.avatar} alt={rev.username} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-[10px] font-black text-foreground dark:text-white leading-none">{rev.username}</h5>
                                                                        <span className="text-[8px] text-gray-400 font-semibold">{rev.date}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-0.5 text-orange-500">
                                                                    {Array.from({ length: 5 }).map((_, starIdx) => (
                                                                        <Star key={starIdx} size={10} className={cn("fill-current", starIdx < rev.rating ? "text-orange-500" : "text-gray-300 dark:text-gray-600")} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">{rev.comment}</p>
                                                            {rev.petTag && (
                                                                <span className="inline-block text-[8px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{rev.petTag}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!reviews[selectedProduct.id] || reviews[selectedProduct.id].length === 0) && (
                                                        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-wider py-4">Henüz yorum yapılmamış.</p>
                                                    )}
                                                </div>

                                                {/* Add Review Form */}
                                                <div className="border-t border-card-border dark:border-card-border/60 pt-4 space-y-3 shrink-0">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Yorum Yap</span>
                                                    
                                                    {/* Star Input */}
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-gray-500 font-bold mr-1">Değerlendirme:</span>
                                                        {Array.from({ length: 5 }).map((_, starIdx) => (
                                                            <button
                                                                key={starIdx}
                                                                type="button"
                                                                onClick={() => setNewReviewStar(starIdx + 1)}
                                                                className="text-orange-500 hover:scale-125 transition-transform pointer-events-auto"
                                                            >
                                                                <Star size={16} className={cn(starIdx < newReviewStar ? "fill-orange-500 text-orange-500" : "text-gray-300 dark:text-gray-600")} />
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Text input */}
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={newReviewText}
                                                            onChange={e => setNewReviewText(e.target.value)}
                                                            placeholder="Yorumunuzu buraya yazın..."
                                                            className="flex-1 h-10 px-3 bg-gray-50 dark:bg-white/5 border border-card-border rounded-xl text-xs outline-none focus:border-orange-500/30 text-foreground dark:text-white pointer-events-auto font-semibold"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!newReviewText.trim()) return;
                                                                const newRev = {
                                                                    id: `rev-user-${Date.now()}`,
                                                                    username: activePet?.owner?.name || "Moffi Sever",
                                                                    avatar: activePet?.image || activePet?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100",
                                                                    rating: newReviewStar,
                                                                    comment: newReviewText,
                                                                    date: new Date().toLocaleDateString('tr-TR'),
                                                                    petTag: activePet ? `${activePet.name} Sahibi 🐾` : "Evcil Hayvan Sahibi"
                                                                };
                                                                setReviews(prev => ({
                                                                    ...prev,
                                                                    [selectedProduct.id]: [...(prev[selectedProduct.id] || []), newRev]
                                                                }));
                                                                setNewReviewText("");
                                                                setNewReviewStar(5);
                                                                
                                                                confetti({
                                                                    particleCount: 40,
                                                                    spread: 30,
                                                                    origin: { y: 0.8 },
                                                                    colors: ['#22C55E', '#FFFFFF']
                                                                });
                                                            }}
                                                            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase rounded-xl tracking-wider pointer-events-auto"
                                                        >
                                                            Gönder
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Controls */}
                                    <div className="mt-6 pt-4 border-t border-card-border dark:border-card-border/60 shrink-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Adet</span>
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
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Toplam Tutar</span>
                                                <div className="flex items-center gap-2 mt-1 shrink-0">
                                                    <span className="text-base font-black text-foreground dark:text-white">
                                                        ₺{((subscriptions.some(s => s.id === selectedProduct.id) ? selectedProduct.price * 0.9 : selectedProduct.price) * modalQty).toLocaleString('tr-TR')}
                                                    </span>
                                                    <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                                                        ✨ +{Math.round(((subscriptions.some(s => s.id === selectedProduct.id) ? selectedProduct.price * 0.9 : selectedProduct.price) * modalQty) / 10)} PatiPuan
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentQty = getCartQty(selectedProduct.id);
                                                    updateCartItem(selectedProduct.id, currentQty + modalQty);
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
                                                {img ? (
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
                                    className="px-3 py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-wider transition-colors"
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
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                                        Karar vermenizi kolaylaştıracak detaylı analiz
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
                                        
                                        const productReviews = reviews[product.id] || [];
                                        const avgRating = productReviews.length > 0 
                                            ? Math.round(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length) 
                                            : 5;
                                            
                                        const hasDiscount = subscriptions.some(s => s.id === product.id);
                                        const finalPrice = hasDiscount ? product.price * 0.9 : product.price;

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
                                                        {img ? (
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
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                        {product.brand?.name || "Moffi Premium"}
                                                    </p>
                                                </div>

                                                {/* Price & Rating */}
                                                <div className="py-4 border-b border-card-border/60 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fiyat</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-foreground dark:text-white">
                                                                ₺{finalPrice.toLocaleString('tr-TR')}
                                                            </span>
                                                            {hasDiscount && (
                                                                <span className="text-[8px] text-emerald-500 font-black uppercase tracking-wider leading-none mt-0.5">
                                                                    %10 Abone İndirimi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Moffi Puan</span>
                                                        <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                                                            ✨ +{Math.round(finalPrice / 10)} Puan
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Değerlendirme</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex text-orange-500">
                                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                                    <Star key={idx} size={10} className={idx < avgRating ? "fill-orange-500 text-orange-500" : "text-gray-300 dark:text-zinc-600"} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[9px] font-black text-gray-500 dark:text-zinc-400">({productReviews.length})</span>
                                                        </div>
                                                    </div>
                                                </div>



                                                {/* Smart Recommendation */}
                                                {isSmartShopEnabled && (
                                                    <div className="py-4 border-b border-card-border/60">
                                                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block mb-2">🐾 Moffi Önerisi</span>
                                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">
                                                            {getSmartRecommendation(product.name, product.category, activePet)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="pt-4 mt-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const currentQty = getCartQty(product.id);
                                                            updateCartItem(product.id, currentQty + 1);
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
                                    <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 pb-4">Ürün Detayı</div>
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
                                                    {img ? <img src={getImgUrl(img)} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-xl">🦴</span>}
                                                </div>
                                                <span className="text-[8px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                                                    {product.category === 'food' ? 'MAMA' : product.category === 'snack' ? 'ATIŞTIRMALIK' : product.category === 'toy' ? 'OYUNCAK' : product.category === 'care' ? 'BAKIM' : 'AKSESUAR'}
                                                </span>
                                                <h4 className="text-xs font-black text-foreground dark:text-white leading-tight uppercase tracking-tight line-clamp-1 italic">
                                                    {product.name}
                                                </h4>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                    {product.brand?.name || "Moffi Premium"}
                                                </p>
                                            </div>
                                        );
                                    })}

                                    {/* Row 2: Price */}
                                    <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 py-4">Fiyat & Puan</div>
                                    {comparisonList.map((product) => {
                                        const hasDiscount = subscriptions.some(s => s.id === product.id);
                                        const finalPrice = hasDiscount ? product.price * 0.9 : product.price;
                                        return (
                                            <div key={`price-${product.id}`} className="flex flex-col items-center justify-center border-b border-card-border/40 py-4 px-4 text-center">
                                                <span className="text-sm font-black text-foreground dark:text-white">₺{finalPrice.toLocaleString('tr-TR')}</span>
                                                {hasDiscount && <span className="text-[7.5px] text-emerald-500 font-black uppercase tracking-wider leading-none mt-0.5">%10 Abone İndirimi</span>}
                                                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 mt-1">
                                                    ✨ +{Math.round(finalPrice / 10)} Puan
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Row 3: Rating */}
                                    <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 py-4">Değerlendirme</div>
                                    {comparisonList.map((product) => {
                                        const productReviews = reviews[product.id] || [];
                                        const avgRating = productReviews.length > 0 
                                            ? Math.round(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length) 
                                            : 5;
                                        return (
                                            <div key={`rating-${product.id}`} className="flex flex-col items-center justify-center border-b border-card-border/40 py-4 px-4 text-center">
                                                <div className="flex text-orange-500 gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, idx) => (
                                                        <Star key={idx} size={10} className={idx < avgRating ? "fill-orange-500 text-orange-500" : "text-gray-300 dark:text-zinc-600"} />
                                                    ))}
                                                </div>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider mt-1">({productReviews.length} yorum)</span>
                                            </div>
                                        );
                                    })}



                                    {/* Row 5: AI recommendation */}
                                    <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest border-b border-card-border/40 py-4">🐾 Moffi Önerisi</div>
                                    {comparisonList.map((product) => {
                                        return (
                                            <div key={`recommend-${product.id}`} className="flex items-center border-b border-card-border/40 py-4 px-6">
                                                {isSmartShopEnabled ? (
                                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">
                                                        {getSmartRecommendation(product.name, product.category, activePet)}
                                                    </p>
                                                ) : (
                                                    <span className="text-[9px] text-gray-400 italic">Akıllı alışveriş entegrasyonu kapalı.</span>
                                                )}
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
                                                        updateCartItem(product.id, currentQty + 1);
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

            {/* ADVISOR CHAT */}
            <AdvisorChat isOpen={showAdvisor} onClose={() => setShowAdvisor(false)} isSmartEnabled={isSmartShopEnabled} />
        </div>
    );
}
