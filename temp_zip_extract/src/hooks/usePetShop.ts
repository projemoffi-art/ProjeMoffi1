import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/apiService";
import { ShopProduct, ShopCategory, ShopCartItem } from "@/services/types";

export function usePetShop() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [cart, setCart] = useState<ShopCartItem[]>([]);
    const [subscriptions, setSubscriptions] = useState<ShopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch products
    const fetchProducts = useCallback(async (category?: ShopCategory) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.getProducts(category);
            setProducts(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ürünler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Search products
    const searchProducts = useCallback(async (query: string) => {
        if (!query.trim()) return fetchProducts();
        setIsLoading(true);
        setError(null);
        try {
            // Note: IApiService doesn't have searchProducts yet, we can use getProducts and filter or add it
            const all = await apiService.getProducts();
            const filtered = all.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
            setProducts(filtered);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Arama başarısız');
        } finally {
            setIsLoading(false);
        }
    }, [fetchProducts]);

    // Cart operations
    const fetchCart = useCallback(async () => {
        try {
            const items = await apiService.getCart();
            setCart(items);
        } catch (err) {
            console.error('Cart fetch error:', err);
        }
    }, []);

    const addToCart = useCallback(async (productId: string, quantity = 1) => {
        setError(null);
        try {
            await apiService.addToCart(productId, quantity);
            await fetchCart();
        } catch (err: any) {
            console.error("addToCart error details:", err);
            setError(err?.message || 'Sepete eklenemedi');
        }
    }, [fetchCart]);

    const updateCartItem = useCallback(async (productId: string, quantity: number) => {
        setError(null);
        try {
            await apiService.updateCartItem(productId, quantity);
            await fetchCart();
        } catch (err: any) {
            console.error("updateCartItem error details:", err);
            setError(err?.message || 'Güncellenemedi');
        }
    }, [fetchCart]);

    const removeFromCart = useCallback(async (productId: string) => {
        try {
            await apiService.removeFromCart(productId);
            await fetchCart();
        } catch (err) {
            console.error('Remove error:', err);
        }
    }, [fetchCart]);

    const clearCart = useCallback(async () => {
        try {
            await apiService.clearCart();
            setCart([]);
        } catch (err) {
            console.error('Clear cart error:', err);
        }
    }, []);

    // Order
    const createOrder = useCallback(async (shippingAddress: string, discountCode?: string) => {
        setError(null);
        try {
            const cartItems = await apiService.getCart();
            if (cartItems.length === 0) throw new Error('Sepet boş');

            const allProducts = await apiService.getProducts();
            const productDetails = cartItems.map(item => {
                const product = allProducts.find(p => p.id === item.productId);
                return { product: product!, quantity: item.quantity };
            });

            // Calculate base total with active product subscription discounts (10%)
            let totalPrice = productDetails.reduce((s, i) => {
                const isSubscribed = subscriptions.some(sub => sub.id === i.product.id);
                const price = isSubscribed ? i.product.price * 0.90 : i.product.price;
                return s + (price * i.quantity);
            }, 0);
            
            let discountAmount = 0;

            // Simple mock discount logic moved here for now
            if (discountCode === 'MOFFI20') {
               discountAmount = Math.round(totalPrice * 0.20);
               totalPrice -= discountAmount;
            } else if (discountCode === 'WELCOME10') {
               discountAmount = Math.round(totalPrice * 0.10);
               totalPrice -= discountAmount;
            }

            const order = await apiService.createOrder({
                items: productDetails,
                totalPrice,
                discountCode,
                discountAmount,
                shippingAddress,
            });

            setCart([]);
            return order;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sipariş oluşturulamadı');
            return null;
        }
    }, [subscriptions]);

    // Subscriptions (Product Auto-Ship integration synced with localStorage and backend)
    const fetchSubscriptions = useCallback(async () => {
        try {
            // Triggers Prime check on backend if needed
            await apiService.getSubscriptions();
            
            const saved = localStorage.getItem('moffi_product_subscriptions');
            let localIds: string[] = [];
            if (saved) {
                try { localIds = JSON.parse(saved); } catch (e) {}
            }
            
            const all = await apiService.getProducts();
            const subscribedProducts = all.filter(p => localIds.includes(p.id));
            setSubscriptions(subscribedProducts);
        } catch (err) {
            console.error('Subscriptions fetch error:', err);
        }
    }, []);

    const subscribeToProduct = useCallback(async (productId: string) => {
        setError(null);
        try {
            await apiService.subscribeToProduct(productId);
            
            const saved = localStorage.getItem('moffi_product_subscriptions');
            let localIds: string[] = [];
            if (saved) {
                try { localIds = JSON.parse(saved); } catch (e) {}
            }
            
            const nextIds = localIds.includes(productId)
                ? localIds.filter(id => id !== productId)
                : [...localIds, productId];
            localStorage.setItem('moffi_product_subscriptions', JSON.stringify(nextIds));
            
            await fetchSubscriptions();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Abone olunamadı');
        }
    }, [fetchSubscriptions]);

    // Discount validation
    const validateDiscount = useCallback(async (code: string) => {
        if (code === 'MOFFI20') return { valid: true, discountPercent: 20, message: '%20 indirim uygulandı!' };
        if (code === 'WELCOME10') return { valid: true, discountPercent: 10, message: '%10 indirim uygulandı!' };
        return { valid: false, message: 'Geçersiz kod' };
    }, []);

    // Initial load
    useEffect(() => {
        fetchProducts();
        fetchCart();
        fetchSubscriptions();
    }, [fetchProducts, fetchCart, fetchSubscriptions]);

    // Cart totals
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
    const getCartTotal = useCallback(() => {
        return cart.reduce((total, item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return total;
            const isSubscribed = subscriptions.some(s => s.id === product.id);
            const price = isSubscribed ? product.price * 0.90 : product.price;
            return total + (price * item.quantity);
        }, 0);
    }, [cart, products, subscriptions]);

    return {
        products,
        cart,
        cartCount,
        cartTotal: getCartTotal(),
        isLoading,
        error,
        fetchProducts,
        searchProducts,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        validateDiscount,
        createOrder,
        subscriptions,
        subscribeToProduct,
        fetchSubscriptions,
    };
}
