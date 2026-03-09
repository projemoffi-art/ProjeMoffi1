"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { StudioProduct, CartItem, Source } from "./types";

interface StudioContextType {
    // Navigation / Flow
    source: Source;
    setSource: (s: Source) => void;

    // Product Selection
    product: StudioProduct | null;
    setProduct: (p: StudioProduct | null) => void;

    // Cart
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioContextProvider({ children }: { children: ReactNode }) {
    const [source, setSource] = useState<Source>("MOFFI");

    // Default fallback to prevent "null" errors during dev, but ideally should start null
    const [product, setProduct] = useState<StudioProduct | null>({
        id: "default-moffi-hoodie",
        title: "Moffi Basic Hoodie",
        price: 399,
        currency: "₺",
        source: "MOFFI",
        colors: ["#000000", "#FFFFFF", "#FF0000"],
        sizes: ["S", "M", "L", "XL"]
    });

    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (item: CartItem) => setCart(prev => [...prev, item]);
    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
    const clearCart = () => setCart([]);

    return (
        <StudioContext.Provider value={{
            source, setSource,
            product, setProduct,
            cart, addToCart, removeFromCart, clearCart
        }}>
            {children}
        </StudioContext.Provider>
    );
}

export function useStudioContext() {
    const ctx = useContext(StudioContext);
    if (!ctx) throw new Error("useStudioContext must be used within StudioContextProvider");
    return ctx;
}
