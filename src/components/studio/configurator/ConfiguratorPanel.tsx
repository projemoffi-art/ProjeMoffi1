"use client";

import { motion } from "framer-motion";
import { Check, Star, BadgeCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, ProductColor, ProductSize } from "@/services/mock/ProductMockService";

interface ConfiguratorPanelProps {
    product: Product;
    selectedColor: ProductColor;
    onColorSelect: (color: ProductColor) => void;
    selectedSize: ProductSize;
    onSizeSelect: (size: ProductSize) => void;
    onStartDesigning: () => void;
}

export function ConfiguratorPanel({
    product,
    selectedColor,
    onColorSelect,
    selectedSize,
    onSizeSelect,
    onStartDesigning
}: ConfiguratorPanelProps) {
    const totalPrice = product.basePrice + selectedSize.priceModifier;

    return (
        <div className="h-full flex flex-col">
            {/* Header: Product Info & Brand */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    {product.brand.isMoffi ? (
                        <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md flex items-center gap-1.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Moffi Original</span>
                        </div>
                    ) : (
                        <div className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">İşletme Ürünü</span>
                        </div>
                    )}
                    {product.brand.location && (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                            • {product.brand.location}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                <p className="text-sm text-neutral-400 leading-relaxed mb-3">{product.description}</p>

                <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm font-bold text-white">{product.rating}</span>
                    </div>
                    <span className="text-neutral-600 text-sm">•</span>
                    <span className="text-sm text-neutral-500">{product.reviewCount} Değerlendirme</span>
                </div>
            </div>

            {/* Selector: Customization */}
            <div className="space-y-8 flex-1">
                {/* Colors */}
                <div className="space-y-3">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Renk Seçimi</span>
                    <div className="flex flex-wrap gap-3">
                        {product.colors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => onColorSelect(color)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all relative group",
                                    selectedColor.id === color.id ? "ring-2 ring-offset-2 ring-offset-[#09090b] ring-white scale-110" : "hover:scale-105"
                                )}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            >
                                {selectedColor.id === color.id && (
                                    <Check className={cn("w-5 h-5", color.hex.toLowerCase() === '#ffffff' ? "text-black" : "text-white")} />
                                )}
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded pointer-events-none">
                                    {color.name}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-white font-medium">{selectedColor.name}</p>
                </div>

                {/* Sizes */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Beden</span>
                        <button className="text-[10px] text-neutral-500 hover:text-white underline">Beden Tablosu</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {product.sizes.map((size) => (
                            <button
                                key={size.id}
                                onClick={() => onSizeSelect(size)}
                                className={cn(
                                    "h-12 rounded-xl text-sm font-medium transition-all border",
                                    selectedSize.id === size.id
                                        ? "bg-white text-black border-white"
                                        : "bg-white/5 text-neutral-400 border-white/5 hover:border-white/20 hover:text-white"
                                )}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer: Price & Action */}
            <div className="pt-6 mt-6 border-t border-white/10">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <span className="text-xs text-neutral-500 block mb-1">Toplam Tutar</span>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            ₺{totalPrice}
                        </div>
                    </div>
                    {!product.brand.isMoffi && (
                        <div className="text-right">
                            <span className="text-[10px] text-orange-400 block">Komisyon Dahil</span>
                        </div>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStartDesigning}
                    className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                >
                    Tasarlamaya Başla
                </motion.button>
                <p className="text-center text-[10px] text-neutral-600 mt-3">
                    Teslimat süresi: 3-5 İş Günü • Ücretsiz İade
                </p>
            </div>
        </div>
    );
}
