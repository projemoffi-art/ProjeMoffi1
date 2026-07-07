"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
}

export interface CartItem extends Product {
    quantity: number;
    variant?: string;
    customized?: boolean;
    designData?: any; // Store design layer data
}

interface ShopContextType {
    cart: CartItem[];
    addToCart: (product: Product, variant?: string, customized?: boolean, designData?: any) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage
    useEffect(() => {
        const storedCart = localStorage.getItem('moffipet_cart');
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('moffipet_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, variant = "Standart", customized = false, designData = null) => {
        setCart(prev => {
            // If customized, always add as new item (don't stack)
            if (customized) {
                return [...prev, { ...product, quantity: 1, variant, customized, designData, id: Date.now() }]; // Unique ID for custom items
            }

            const existing = prev.find(item => item.id === product.id && item.variant === variant && !item.customized);
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.variant === variant)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1, variant, customized, designData }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <ShopContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </ShopContext.Provider>
    );
}

export function useShop() {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error("useShop must be used within a ShopProvider");
    }
    return context;
}
