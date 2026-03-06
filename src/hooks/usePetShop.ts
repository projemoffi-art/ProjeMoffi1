import { useState, useEffect, useCallback } from "react";
import { IPetShopService } from "@/services/interfaces";
import { PetShopMockService } from "@/services/mock/PetShopMockService";
import { ShopProduct, ShopCategory, ShopCartItem } from "@/types/domain";

// Singleton — swap to FirebasePetShopService later
const petShopService: IPetShopService = new PetShopMockService();
const MOCK_USER_ID = 'user-1';

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
            const result = await petShopService.getProducts(category);
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
            const result = await petShopService.searchProducts(query);
            setProducts(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Arama başarısız');
        } finally {
            setIsLoading(false);
        }
    }, [fetchProducts]);

    // Cart operations
    const fetchCart = useCallback(async () => {
        try {
            const items = await petShopService.getCart(MOCK_USER_ID);
            setCart(items);
        } catch (err) {
            console.error('Cart fetch error:', err);
        }
    }, []);

    const addToCart = useCallback(async (productId: string, quantity = 1) => {
        setError(null);
        try {
            await petShopService.addToCart(MOCK_USER_ID, productId, quantity);
            await fetchCart();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sepete eklenemedi');
        }
    }, [fetchCart]);

    const updateCartItem = useCallback(async (productId: string, quantity: number) => {
        setError(null);
        try {
            await petShopService.updateCartItem(MOCK_USER_ID, productId, quantity);
            await fetchCart();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Güncellenemedi');
        }
    }, [fetchCart]);

    const removeFromCart = useCallback(async (productId: string) => {
        try {
            await petShopService.removeFromCart(MOCK_USER_ID, productId);
            await fetchCart();
        } catch (err) {
            console.error('Remove error:', err);
        }
    }, [fetchCart]);

    const clearCart = useCallback(async () => {
        try {
            await petShopService.clearCart(MOCK_USER_ID);
            setCart([]);
        } catch (err) {
            console.error('Clear cart error:', err);
        }
    }, []);

    // Discount validation
    const validateDiscount = useCallback(async (code: string) => {
        return petShopService.validateDiscount(code);
    }, []);

    // Order
    const createOrder = useCallback(async (shippingAddress: string, discountCode?: string) => {
        setError(null);
        try {
            const cartItems = await petShopService.getCart(MOCK_USER_ID);
            if (cartItems.length === 0) throw new Error('Sepet boş');

            const productDetails = await Promise.all(
                cartItems.map(async item => {
                    const product = await petShopService.getProductById(item.productId);
                    return { product: product!, quantity: item.quantity };
                })
            );

            let totalPrice = productDetails.reduce((s, i) => s + i.product.price * i.quantity, 0);
            let discountAmount = 0;

            if (discountCode) {
                const discount = await petShopService.validateDiscount(discountCode);
                if (discount.valid && discount.discountPercent) {
                    discountAmount = Math.round(totalPrice * discount.discountPercent / 100);
                    totalPrice -= discountAmount;
                }
            }

            const order = await petShopService.createOrder({
                userId: MOCK_USER_ID,
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
    }, []);

    // Initial load
    useEffect(() => {
        fetchProducts();
        fetchCart();
    }, [fetchProducts, fetchCart]);

    // Cart totals
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
    const getCartTotal = useCallback(() => {
        return cart.reduce((total, item) => {
            const product = products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }, [cart, products]);

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
    };
}
