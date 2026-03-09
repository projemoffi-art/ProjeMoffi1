"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, ChevronDown, ShoppingBag, X, Share, Download, Lock } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { SCENES, STYLES, FRAMES, buildLookConfig, type LookConfiguration } from './data/presets';

// --- TEXT MAP (TURKISH DEFAULT) ---
const TEXTS = {
    titles: {
        storeCollection: "Mağaza Koleksiyonu",
        storeSubtitle: "Tasarlamak için bir ürün seçin",
        previewGenerated: "Önizleme Oluşturuldu",
        scenes: "Sahneler",
        styles: "Atmosfer",
        frames: "Format & Kadraj"
    },
    actions: {
        upload: "Resim Yükle",
        selectStore: "Mağazadan Seç",
        download: "İndir",
        addToCart: "Sepete Ekle",
        share: "Paylaş"
    },
    status: {
        noProduct: "Ürün Yok",
        addedToCart: "Sepete Eklendi",
        storeOnly: "Sadece Mağaza",
        commercialPreview: "Ticari Önizleme",
        personalCopy: "Kişisel Kopya",
        downloadsDisabled: "Bu bir mağaza önizlemesidir. İndirme kapalı.",
        personalPreview: "Kişisel önizleme oluşturuldu."
    },
    modes: {
        none: "Boş",
        user: "Kullanıcı",
        store: "Mağaza"
    }
};

interface CartItem {
    id: string;
    productName: string;
    config: LookConfiguration;
    imageUrl: string;
    price: number;
}

// --- DUMMY STORE DATA ---
const STORE_PRODUCTS = [
    { id: '1', name: 'Moffi Essential Tee', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
    { id: '2', name: 'Premium Hoodie', image: 'https://images.unsplash.com/photo-1556906781-9a412961d28c?q=80&w=800&auto=format&fit=crop' },
    { id: '3', name: 'Canvas Tote', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop' },
    { id: '4', name: 'Ceramic Mug', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop' },
    { id: '5', name: 'Urban Snapback', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89d?q=80&w=800&auto=format&fit=crop' },
    { id: '6', name: 'Phone Case', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=800&auto=format&fit=crop' },
];

function StoreSelector({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (img: string) => void }) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{TEXTS.titles.storeCollection}</h2>
                        <p className="text-sm text-gray-500 font-medium">{TEXTS.titles.storeSubtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {STORE_PRODUCTS.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => onSelect(product.image)}
                                className="group cursor-pointer relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 dark:border-white/5"
                            >
                                <img src={product.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                    <span className="text-white text-xs font-bold tracking-wide">{product.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function PreviewModal({ isOpen, onClose, image, intent }: { isOpen: boolean, onClose: () => void, image: string | null, intent: 'personal' | 'store-preview' }) {
    if (!isOpen || !image) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">{TEXTS.titles.previewGenerated}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            {intent === 'store-preview' ? TEXTS.status.commercialPreview : TEXTS.status.personalCopy}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 bg-gray-50 flex items-center justify-center">
                    <img src={image} className="rounded-xl shadow-lg max-h-[50vh] w-auto h-auto object-contain" />
                </div>
                <div className="p-6 bg-white border-t flex justify-center text-center">
                    <p className="text-sm text-gray-400">
                        {intent === 'store-preview'
                            ? TEXTS.status.downloadsDisabled
                            : TEXTS.status.personalPreview}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// --- REUSABLE COMPONENTS ---

// --- REUSABLE COMPONENTS ---

function Section({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 shrink-0 select-none">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 py-3 px-1 group cursor-pointer w-full text-left active:opacity-70 transition-opacity touch-manipulation"
            >
                <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 transition-colors group-hover:bg-gray-200 group-hover:text-black",
                    isOpen ? "rotate-0" : "-rotate-90"
                )}>
                    <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                </div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer group-hover:text-black transition-colors">
                    {title}
                </label>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 150, damping: 20 }}
                        className="overflow-hidden -mx-6"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ... existing code ...

function ProductFrame({ config, image, source, onUploadClick, onStoreClick, id }: { config: LookConfiguration | null, image: string | null, source: ProductSource, onUploadClick?: () => void, onStoreClick?: () => void, id?: string }) {
    if (!config) return null;

    const { scene, style, frame } = config;

    return (
        <motion.div
            id={id}
            layout
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className={cn(
                "relative z-10 flex items-center justify-center select-none touch-none", // Prevent selection, handle touch
                "w-[85vw] md:w-auto md:h-[70vh]",
                frame.ratio,
                "max-h-[60vh] md:max-h-[80vh]",
                "rounded-[44px] transition-shadow duration-500",
                scene.shadow,
                "bg-white/80 backdrop-blur-2xl"
            )}
            onContextMenu={(e) => e.preventDefault()} // Disable context menu
        >
            {/* ... existing textures ... */}
            <div className="absolute inset-0 rounded-[44px] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-multiply" />
            <div className="absolute inset-0 rounded-[44px] ring-1 ring-inset ring-white/50 pointer-events-none" />

            {/* PRODUCT SURFACE */}
            <div className={cn(
                "w-[92%] h-[92%] rounded-[36px] overflow-hidden relative transition-all duration-500",
                "bg-gradient-to-br shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]",
                scene.color
            )}>

                <AnimatePresence mode="popLayout">
                    {source === 'none' ? (
                        <motion.div
                            key="none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-10"
                        >
                            <div className="text-center p-8 opacity-30 pointer-events-none">
                                <span className={cn("text-xs font-medium tracking-widest uppercase", scene.dark ? "text-white" : "text-black")}>
                                    {TEXTS.status.noProduct}
                                </span>
                            </div>
                        </motion.div>
                    ) : source === 'user' ? (
                        image ? (
                            <motion.div
                                key="user-image"
                                className="relative w-full h-full z-10"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <img
                                    src={image}
                                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none select-none" // Disable native drag
                                    draggable={false}
                                    style={{ filter: style.filter }}
                                />
                                {/* ... overlay ... */}
                                <div className={cn("absolute inset-0 pointer-events-none mix-blend-overlay transition-colors duration-300", style.overlay)} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="user-empty"
                                onClick={onUploadClick}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer group active:scale-95 transition-transform" // Add feedback
                            >
                                <div className={cn(
                                    "flex flex-col items-center gap-4 p-6 rounded-3xl transition-all duration-300",
                                    "group-hover:scale-105",
                                    scene.dark ? "bg-white/10 hover:bg-white/20 backdrop-blur-md" : "bg-white/60 hover:bg-white/80 backdrop-blur-md shadow-lg shadow-black/5"
                                )}>
                                    <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:rotate-90",
                                        scene.dark ? "bg-white text-black" : "bg-black text-white"
                                    )}>
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold tracking-widest uppercase opacity-80",
                                        scene.dark ? "text-white" : "text-black"
                                    )}>
                                        {TEXTS.actions.upload}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    ) : (
                        // ... Store Mode (similar updates) ...
                        image ? (
                            <motion.div
                                key="store-image"
                                className="relative w-full h-full z-10"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <img
                                    src={image}
                                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none select-none"
                                    draggable={false}
                                    style={{ filter: style.filter }}
                                />
                                <div className={cn("absolute inset-0 pointer-events-none mix-blend-overlay transition-colors duration-300", style.overlay)} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="store-empty"
                                onClick={onStoreClick}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer group active:scale-95 transition-transform"
                            >
                                <div className={cn(
                                    "flex flex-col items-center gap-4 p-6 rounded-3xl transition-all duration-300",
                                    "group-hover:scale-105",
                                    scene.dark ? "bg-white/10 hover:bg-white/20 backdrop-blur-md" : "bg-white/60 hover:bg-white/80 backdrop-blur-md shadow-lg shadow-black/5"
                                )}>
                                    <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:rotate-12",
                                        scene.dark ? "bg-white text-black" : "bg-black text-white"
                                    )}>
                                        <ShoppingBag className="w-8 h-8" />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold tracking-widest uppercase opacity-80",
                                        scene.dark ? "text-white" : "text-black"
                                    )}>
                                        {TEXTS.actions.selectStore}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>

                {/* DEBUG PREVIEW OVERLAY */}
                {config && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-6 right-6 z-20 pointer-events-none"
                    >
                        <div className={cn(
                            "px-3 py-2 rounded-lg backdrop-blur-md border shadow-sm flex flex-col gap-1 min-w-[100px]",
                            "bg-white/60 border-white/40"
                        )}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", scene.dark ? "bg-white" : "bg-blue-500")} />
                                <span className="text-[8px] uppercase font-bold tracking-widest text-black/50">{TEXTS.modes[source] ? TEXTS.modes[source].toUpperCase() : source.toUpperCase()}</span>
                            </div>
                            <div className="text-[9px] text-gray-600 leading-tight">
                                {scene.label} / {style.label}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div >
    );
}


// --- MAIN PAGE ---

export default function MinimalCanvasPage() {
    const [image, setImage] = useState<string | null>(null);
    const [selectedScene, setSelectedScene] = useState<string>(SCENES[0].id);
    const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
    const [selectedFrame, setSelectedFrame] = useState<string>(FRAMES[0].id);
    const [productSource, setProductSource] = useState<ProductSource>('none');
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // CART STATE
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCartSuccess, setShowCartSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Section Visibility States (Default All Open)
    const [sections, setSections] = useState({
        scenes: true,
        styles: true,
        frames: true
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
            setProductSource('user'); // Auto-switch to user when uploading
        }
    };

    const [currentConfig, setCurrentConfig] = useState<LookConfiguration | null>(null);

    // Initial Load from Server
    useEffect(() => {
        fetch('/api/studio')
            .then(res => res.json())
            .then(data => {
                if (data.sceneId) setSelectedScene(data.sceneId);
                if (data.styleId) setSelectedStyle(data.styleId);
                if (data.formatId) setSelectedFrame(data.formatId);
            })
            .catch(err => console.error("Failed to load studio state:", err));
    }, []);

    // Update Configuration & Server State on Selection Change
    useEffect(() => {
        const intent = productSource === 'store' ? 'store-preview' : 'personal';
        const config = buildLookConfig(selectedScene, selectedStyle, selectedFrame, intent);
        setCurrentConfig(config);

        // Persist to Server
        fetch('/api/studio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sceneId: selectedScene,
                styleId: selectedStyle,
                formatId: selectedFrame
            })
        }).catch(() => { });

        console.log("Look Configuration Updated:", config);
    }, [selectedScene, selectedStyle, selectedFrame, productSource]);

    // Handle Store Selection
    const handleStoreSelect = (imgUrl: string) => {
        setImage(imgUrl);
        setIsStoreOpen(false);
    };

    // Derived from config now, but kept for safe bottom sheet animations if needed
    const currentRatio = currentConfig?.frame.ratio || 'aspect-[4/5]';

    const handleExport = async () => {
        const element = document.getElementById('product-frame');
        if (!element) return;

        setIsExporting(true);
        try {
            // Force higher pixel ratio for better quality
            const dataUrl = await toPng(element, { pixelRatio: 2 });
            setPreviewImage(dataUrl);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleAddToCart = () => {
        if (!currentConfig || !image) return;

        const newItem: CartItem = {
            id: crypto.randomUUID(),
            productName: "Store Product",
            config: currentConfig,
            imageUrl: image,
            price: 29.99
        };

        setCart(prev => [...prev, newItem]);
        setShowCartSuccess(true);
        setTimeout(() => setShowCartSuccess(false), 2000);
        console.log("Added to Cart:", newItem);
    };

    return (
        <main className="h-screen w-full bg-[#f2f2f7] flex items-center justify-center overflow-hidden selection:bg-black/10 relative font-sans antialiased text-[#1d1d1f]">

            {/* MESSAGE TOAST */}
            <AnimatePresence>
                {showCartSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="absolute top-8 left-1/2 z-50 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl"
                    >
                        <ShoppingBag className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-sm">{TEXTS.status.addedToCart}</span>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* AMBIENT LIGHT */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-gradient-to-b from-white to-transparent opacity-60 pointer-events-none blur-3xl" />

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {previewImage && (
                    <PreviewModal
                        isOpen={!!previewImage}
                        onClose={() => setPreviewImage(null)}
                        image={previewImage}
                        intent={currentConfig?.intent || 'personal'}
                    />
                )}
            </AnimatePresence>

            {/* STORE SELECTOR MODAL */}
            <AnimatePresence>
                {isStoreOpen && (
                    <StoreSelector
                        isOpen={isStoreOpen}
                        onClose={() => setIsStoreOpen(false)}
                        onSelect={handleStoreSelect}
                    />
                )}
            </AnimatePresence>

            {/* PRODUCT FRAME COMPONENT */}
            <div className={cn(
                "transition-transform duration-500 ease-spring",
                isPanelOpen ? "-translate-y-24 md:translate-y-0" : "translate-y-0"
            )}>
                <ProductFrame
                    id="product-frame"
                    config={currentConfig}
                    image={image}
                    source={productSource}
                    onUploadClick={() => fileInputRef.current?.click()}
                    onStoreClick={() => setIsStoreOpen(true)}
                />
            </div>

            {/* CONTROLS (Bottom Sheet) */}
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: isPanelOpen ? 0 : "90%" }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
                className="absolute bottom-0 left-0 w-full z-20 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)] bg-transparent pointer-events-none"
            >
                <div className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-white/60 rounded-t-[36px] p-6 pb-8 flex flex-col gap-6 pointer-events-auto max-h-[70vh] h-auto overflow-y-auto scrollbar-hide relative no-scrollbar rounded-t-[36px] touch-pan-y">

                    {/* Floating Close Button */}
                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all z-30 opacity-60 hover:opacity-100 touch-manipulation"
                    >
                        {isPanelOpen ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronDown className="w-5 h-5 text-black rotate-180" />}
                    </button>

                    {/* Drag Handle */}
                    <div className="w-12 h-1 bg-black/10 rounded-full mx-auto -mb-2 shrink-0" />

                    {/* HEADER / EXPORT ROW */}
                    <div className="flex items-center justify-between gap-4">
                        {/* SOURCE SWITCHER */}
                        <div className="flex bg-gray-100/50 p-1.5 rounded-xl shrink-0 relative flex-1 touch-manipulation">
                            {['none', 'user', 'store'].map((mode) => {
                                const isActive = productSource === mode;
                                return (
                                    <button
                                        key={mode}
                                        onClick={() => setProductSource(mode as ProductSource)}
                                        className={cn(
                                            "flex-1 py-3 text-xs font-semibold rounded-lg transition-all duration-300 relative z-10 capitalize select-none active:scale-95",
                                            isActive ? "text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {TEXTS.modes[mode as keyof typeof TEXTS.modes]}
                                        {isActive && (
                                            <motion.div
                                                layoutId="source-active"
                                                className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex items-center gap-2">
                            {/* Primary Action: Download OR Add to Cart */}
                            {currentConfig?.export.allowed ? (
                                <button
                                    disabled={!image}
                                    className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2 px-4"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-sm font-medium hidden sm:inline">{TEXTS.actions.download}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!image}
                                    className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2 px-4"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span className="text-sm font-medium hidden sm:inline">{TEXTS.actions.addToCart}</span>
                                </button>
                            )}

                            {/* Share / Preview Button */}
                            <button
                                onClick={handleExport}
                                disabled={isExporting || productSource === 'none' || !image}
                                className="bg-white border border-gray-200 text-black p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Share className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* SECTION 1: SCENES */}
                    <Section title={TEXTS.titles.scenes} isOpen={sections.scenes} onToggle={() => toggleSection('scenes')}>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x pt-1">
                            {/* SAFETY SPACER - VISUAL INSET */}
                            <div className="w-6 shrink-0" />

                            {SCENES.map((scene) => {
                                const isSelected = selectedScene === scene.id;
                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        key={scene.id}
                                        onClick={() => setSelectedScene(scene.id)}
                                        className={cn(
                                            "snap-center shrink-0 w-28 h-36 rounded-2xl p-3 flex flex-col justify-end relative overflow-hidden transition-all duration-300",
                                            isSelected
                                                ? "shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] ring-[2px] ring-black ring-offset-2 ring-offset-[#f2f2f7]/50"
                                                : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ring-1 ring-black/5"
                                        )}
                                    >
                                        <div className={cn("absolute inset-0 bg-gradient-to-br", scene.color)} />
                                        <div className={cn("absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300", isSelected ? (scene.dark ? "bg-white scale-100" : "bg-black scale-100") : "bg-black/10 scale-0")} />
                                        <span className={cn("relative z-10 text-sm font-medium tracking-tight", scene.dark ? "text-white" : "text-gray-900")}>
                                            {scene.label}
                                        </span>
                                    </motion.button>
                                );
                            })}

                            {/* END SPACER */}
                            <div className="w-6 shrink-0" />
                        </div>
                    </Section>

                    {/* SECTION 2: STYLES */}
                    <Section title={TEXTS.titles.styles} isOpen={sections.styles} onToggle={() => toggleSection('styles')}>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x pt-1">
                            {/* SAFETY SPACER */}
                            <div className="w-6 shrink-0" />

                            {STYLES.map((style) => {
                                const isSelected = selectedStyle === style.id;
                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        className={cn(
                                            "snap-center shrink-0 w-24 h-20 rounded-2xl flex items-center justify-center relative transition-all duration-200",
                                            isSelected
                                                ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-[1.5px] ring-black/80"
                                                : "bg-[#f9f9fa] shadow-sm ring-1 ring-black/5 hover:bg-white"
                                        )}
                                    >
                                        <span className={cn("text-xs font-medium text-center leading-tight transition-colors", isSelected ? "text-black" : "text-gray-500")}>
                                            {style.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                            {/* END SPACER */}
                            <div className="w-6 shrink-0" />
                        </div>
                    </Section>

                    {/* SECTION 3: FRAMES */}
                    <Section title="Format & Kadraj" isOpen={sections.frames} onToggle={() => toggleSection('frames')}>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x pt-1">
                            {/* SAFETY SPACER */}
                            <div className="w-6 shrink-0" />

                            {FRAMES.map((frame) => {
                                const isSelected = selectedFrame === frame.id;
                                const Icon = frame.icon;
                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={frame.id}
                                        onClick={() => setSelectedFrame(frame.id)}
                                        className={cn(
                                            "snap-center shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200",
                                            isSelected
                                                ? "bg-black text-white shadow-lg shadow-black/20"
                                                : "bg-[#f9f9fa] text-gray-400 hover:bg-white ring-1 ring-black/5"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" strokeWidth={isSelected ? 2 : 1.5} />
                                        <span className="text-[10px] font-medium leading-none opacity-80">
                                            {frame.label}
                                        </span>
                                    </motion.button>
                                )
                            })}
                            {/* END SPACER */}
                            <div className="w-4 shrink-0" />
                        </div>
                    </Section>

                    {/* UPLOAD (Visible only if productSource is USER) */}
                    {productSource === 'user' && (
                        <div className="flex flex-col gap-3 shrink-0 pt-2 border-t border-gray-100">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "mt-4 rounded-2xl flex items-center gap-4 px-1 cursor-pointer transition-all active:scale-[0.98] group"
                                )}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                                    image ? "bg-white border border-gray-100 text-gray-400" : "bg-black text-white shadow-lg shadow-black/20 group-hover:scale-105"
                                )}>
                                    {image ? <ImageIcon className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className={cn("block text-sm font-semibold transition-colors", image ? "text-gray-500" : "text-gray-900")}>
                                        {image ? "Görseli Değiştir" : "Yeni Görsel Yükle"}
                                    </span>
                                    {!image && <span className="text-xs text-gray-400">JPG, PNG, WEBP</span>}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </motion.div>

        </main>
    );
}
