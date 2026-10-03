import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/apiService";
import { ShopProduct, ShopCategory, ShopCartItem } from "@/services/types";

export function usePetShop() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [cart, setCart] = useState<ShopCartItem[]>([]);
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

    const addToCart = useCallback(async (productId: string, quantity = 1): Promise<boolean> => {
        setError(null);
        try {
            await apiService.addToCart(productId, quantity);
            await fetchCart();
            return true;
        } catch (err: any) {
            console.error("addToCart error details:", err);
            setError(err?.message || 'Sepete eklenemedi');
            return false;
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

    // Sipariş ve ödeme sunucuda (/api/paytr/payment) oluşturulur; fiyat orada veritabanından
    // hesaplanır. Sepet toplamı aynı fiyatı gösterir, istemci tarafı indirim uygulanmaz.
    useEffect(() => {
        fetchProducts();
        fetchCart();
    }, [fetchProducts, fetchCart]);

    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        return product ? total + product.price * item.quantity : total;
    }, 0);

    return {
        products,
        cart,
        cartCount,
        cartTotal,
        isLoading,
        error,
        fetchProducts,
        searchProducts,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
    };
}
