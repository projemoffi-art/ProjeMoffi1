"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shirt, Coffee, Dog, ShoppingBag,
    ChevronRight, ArrowRight, Store,
    Star, Sparkles, Search, SlidersHorizontal, Loader2,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductMockService, Product } from "@/services/mock/ProductMockService";

export default function StudioHubPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'moffi' | 'partners'>('moffi');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [products, setProducts] = useState<Product[]>([]);
    const [partnerShops, setPartnerShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = ['Tümü', 'Giyim', 'Aksesuar', 'Ev & Yaşam', 'Pet Giyim'];

    // Map Product type to UI display category
    const getCategoryLabel = (type: string) => {
        switch (type) {
            case 'apparel': return 'Giyim';
            case 'accessory': return 'Aksesuar';
            case 'home': return 'Ev & Yaşam';
            case 'pet-apparel': return 'Pet Giyim';
            default: return 'Genel';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'moffi') {
                    const fetchedProducts = await ProductMockService.getAllProducts(selectedCategory);
                    setProducts(fetchedProducts);
                } else {
                    const shops = await ProductMockService.getPartnerShops();
                    setPartnerShops(shops);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, selectedCategory]);

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">

            {/* BACKGROUND ACCENTS */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
            <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

            {/* BACK BUTTON */}
            <button 
                onClick={() => {
                    if (window.history.length > 2) {
                        router.back();
                    } else {
                        router.push('/community');
                    }
                }} 
                className="fixed top-6 left-6 z-[60] w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
                <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* --- HEADER SECTION --- */}
            <div className="relative pt-24 pb-12 px-6 md:px-20 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-4"
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        Yaratıcılığını <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Serbest Bırak.</span>
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-xl leading-relaxed">
                        Moffi Studio'da kendi tarzını yarat. İster Moffi'nin özel koleksiyonunu kullan, istersen şehrindeki butiklerin ürünlerini tasarla.
                    </p>
                </motion.div>

                {/* SEARCH & FILTERS BAR */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="mt-10 flex flex-col md:flex-row items-center gap-4"
                >
                    {/* SEARCH INPUT */}
                    <div className="w-full md:w-96 relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Ürün veya kategori ara..."
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-neutral-600"
                        />
                    </div>
                </motion.div>
            </div>

            {/* --- TABS --- */}
            <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-20 flex items-center gap-8 h-16">
                    <button
                        onClick={() => setActiveTab('moffi')}
                        className={cn(
                            "h-full relative px-2 text-sm font-bold transition-colors",
                            activeTab === 'moffi' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        Moffi Originals
                        {activeTab === 'moffi' && <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-purple-500 rounded-t-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('partners')}
                        className={cn(
                            "h-full relative px-2 text-sm font-bold transition-colors",
                            activeTab === 'partners' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        Diğer İşletmeler
                        {activeTab === 'partners' && <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />}
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="max-w-7xl mx-auto px-6 md:px-20 py-12">
                <AnimatePresence mode="wait">
                    {/* TAB: MOFFI ORIGINALS */}
                    {activeTab === 'moffi' && (
                        <motion.div
                            key="moffi"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            {/* Categories */}
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                                            selectedCategory === cat
                                                ? "bg-white text-black border-transparent"
                                                : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Product Grid */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20 text-neutral-500">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group relative bg-[#0c0c0e] rounded-3xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/10 cursor-pointer"
                                            onClick={() => router.push(`/studio/design?productId=${product.id}`)}
                                        >
                                            {/* Image Area */}
                                            <div className="aspect-[4/5] relative overflow-hidden bg-white/5">
                                                <div className="absolute top-4 left-4 z-10 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                                                    {product.brand.isMoffi ? 'Moffi Original' : product.brand.name}
                                                </div>
                                                <img
                                                    src={product.images.front}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                />
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm transform scale-90 group-hover:scale-100 transition-transform shadow-xl flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" /> Tasarla
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info Area */}
                                            <div className="p-5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-lg leading-tight group-hover:text-purple-400 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                                        <Star className="w-3 h-3 fill-current" /> {product.rating}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {product.colors.map(color => (
                                                            <div key={color.id} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} title={color.name} />
                                                        ))}
                                                        {product.colors.length > 3 && <div className="w-4 h-4 rounded-full bg-neutral-800 text-[8px] flex items-center justify-center border border-white/20">+</div>}
                                                    </div>
                                                    <span className="font-mono text-sm opacity-50">₺{product.basePrice}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* TAB: PARTNER SHOPS */}
                    {activeTab === 'partners' && (
                        <motion.div
                            key="partners"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Yerel İşletmeleri Destekle 🏪</h3>
                                    <p className="text-sm text-neutral-400 max-w-md">
                                        Çevrendeki pet shop ve butiklerin özel ürünlerini tasarlayabilir, siparişini doğrudan onlardan teslim alabilirsin.
                                    </p>
                                </div>
                                <Store className="w-16 h-16 text-white/10" />
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20 text-neutral-500">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {partnerShops.map((shop, index) => (
                                        <motion.div
                                            key={shop.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-[#0c0c0e] rounded-2xl border border-white/5 p-4 hover:border-blue-500/30 transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <img src={shop.image} className="w-16 h-16 rounded-xl object-cover" />
                                                <div>
                                                    <h4 className="font-bold text-lg">{shop.name}</h4>
                                                    <p className="text-xs text-neutral-500">{shop.location} • ⭐ {shop.rating}</p>
                                                </div>
                                                <div className="ml-auto p-2 bg-white/5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {shop.tags.map((tag: string) => (
                                                    <span key={tag} className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 rounded text-neutral-400">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
