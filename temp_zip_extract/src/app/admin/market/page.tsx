"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { ShopProduct, ShopOrder, OrderStatus, ShopCategory } from "@/services/types";
import { 
    Store, Plus, Trash2, Edit2, ShoppingBag, CheckCircle, Package, Truck, 
    AlertCircle, Search, Sparkles, Sliders, ArrowLeft, RefreshCw, X, ShoppingCart, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const getImgUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("data:")) {
        return url;
    }
    if (url.includes(".") && !url.startsWith("/")) {
        return `https://${url}`;
    }
    return url;
};

// Category configuration helper
const CATEGORIES: Array<{ id: ShopCategory; label: string }> = [
    { id: 'food', label: 'Mama 🦴' },
    { id: 'snack', label: 'Atıştırmalık 🐟' },
    { id: 'toy', label: 'Oyuncak 🪀' },
    { id: 'care', label: 'Bakım 🧴' },
    { id: 'accessory', label: 'Aksesuar 🏷️' }
];

export default function AdminMarketPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for adding a product
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        oldPrice: "",
        category: "food" as ShopCategory,
        imageType: "emoji" as "emoji" | "url" | "upload",
        imageEmoji: "🦴",
        imageUrl: "",
        imageFile: null as File | null,
        imageFiles: [] as File[],
        description: "",
        stockCount: "10",
        tag: "",
        isVetApproved: false,
        isPrimeOnly: false
    });

    // Modal state for editing a product
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        oldPrice: "",
        category: "food" as ShopCategory,
        imageType: "emoji" as "emoji" | "url" | "upload",
        imageEmoji: "🦴",
        imageUrl: "",
        imageFile: null as File | null,
        imageFiles: [] as File[],
        description: "",
        stockCount: "10",
        tag: "",
        isVetApproved: false,
        isPrimeOnly: false
    });

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedProducts, fetchedOrders] = await Promise.all([
                apiService.getProducts(),
                apiService.getAllOrders()
            ]);
            setProducts(fetchedProducts);
            setOrders(fetchedOrders);
        } catch (err: any) {
            console.error("Failed to load admin market data:", err);
            setError("Veriler yüklenirken bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) {
            alert("Lütfen ürün adı ve fiyatı girin.");
            return;
        }

        setIsSubmitting(true);
        try {
            const priceNum = parseFloat(newProduct.price);
            const oldPriceNum = newProduct.oldPrice ? parseFloat(newProduct.oldPrice) : undefined;
            const stockNum = parseInt(newProduct.stockCount) || 10;
            
            let finalImage = "🦴";
            if (newProduct.imageType === "emoji") {
                finalImage = newProduct.imageEmoji;
            } else if (newProduct.imageType === "url") {
                finalImage = newProduct.imageUrl || "🦴";
            } else if (newProduct.imageType === "upload" && newProduct.imageFiles && newProduct.imageFiles.length > 0) {
                const urls = await Promise.all(
                    newProduct.imageFiles.map(file => apiService.uploadMedia(file, 'posts'))
                );
                finalImage = urls.join(',');
            } else if (newProduct.imageType === "upload" && newProduct.imageFile) {
                finalImage = await apiService.uploadMedia(newProduct.imageFile, 'posts');
            }

            const created = await apiService.addProduct({
                name: newProduct.name,
                price: priceNum,
                oldPrice: oldPriceNum,
                category: newProduct.category,
                image: finalImage,
                description: newProduct.description,
                stockCount: stockNum,
                isPrimeOnly: newProduct.isPrimeOnly,
                isVetApproved: newProduct.isVetApproved,
                tag: newProduct.tag || undefined
            });

            setProducts(prev => [created, ...prev]);
            setShowAddModal(false);
            setNewProduct({
                name: "",
                price: "",
                oldPrice: "",
                category: "food",
                imageType: "emoji",
                imageEmoji: "🦴",
                imageUrl: "",
                imageFile: null,
                imageFiles: [],
                description: "",
                stockCount: "10",
                tag: "",
                isVetApproved: false,
                isPrimeOnly: false
            });
        } catch (err: any) {
            console.error("Failed to add product:", err);
            const errMsg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            alert(`Ürün eklenirken bir hata oluştu: ${errMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartEdit = (product: ShopProduct) => {
        setEditingProduct(product);
        const isUrl = product.image && (
            product.image.startsWith("http") || 
            product.image.startsWith("/") || 
            product.image.startsWith("data:") || 
            product.image.length > 4
        );
        setEditForm({
            name: product.name,
            price: String(product.price),
            oldPrice: product.oldPrice ? String(product.oldPrice) : "",
            category: product.category,
            imageType: isUrl ? "url" : "emoji",
            imageEmoji: isUrl ? "🦴" : product.image,
            imageUrl: isUrl ? product.image : "",
            imageFile: null,
            imageFiles: [],
            description: product.description || "",
            stockCount: String(product.stockCount || 10),
            tag: product.tag || "",
            isVetApproved: !!product.isVetApproved,
            isPrimeOnly: !!product.isPrimeOnly
        });
        setShowEditModal(true);
    };

    const handleEditProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        if (!editForm.name || !editForm.price) {
            alert("Lütfen ürün adı ve fiyatı girin.");
            return;
        }

        setIsSubmitting(true);
        try {
            const priceNum = parseFloat(editForm.price);
            const oldPriceNum = editForm.oldPrice ? parseFloat(editForm.oldPrice) : null;
            const stockNum = parseInt(editForm.stockCount) || 10;

            let finalImage = editingProduct.image;
            if (editForm.imageType === "emoji") {
                finalImage = editForm.imageEmoji;
            } else if (editForm.imageType === "url") {
                finalImage = editForm.imageUrl || "🦴";
            } else if (editForm.imageType === "upload" && editForm.imageFiles && editForm.imageFiles.length > 0) {
                const urls = await Promise.all(
                    editForm.imageFiles.map(file => apiService.uploadMedia(file, 'posts'))
                );
                finalImage = urls.join(',');
            } else if (editForm.imageType === "upload" && editForm.imageFile) {
                finalImage = await apiService.uploadMedia(editForm.imageFile, 'posts');
            }

            const updated = await apiService.updateProduct(editingProduct.id, {
                name: editForm.name,
                price: priceNum,
                oldPrice: oldPriceNum as any,
                category: editForm.category,
                image: finalImage,
                description: editForm.description,
                stockCount: stockNum,
                isPrimeOnly: editForm.isPrimeOnly,
                isVetApproved: editForm.isVetApproved,
                tag: editForm.tag || null as any
            });

            setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
            setShowEditModal(false);
            setEditingProduct(null);
        } catch (err: any) {
            console.error("Failed to edit product:", err);
            const errMsg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            alert(`Ürün güncellenirken bir hata oluştu: ${errMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        try {
            await apiService.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error("Failed to delete product:", err);
            alert("Ürün silinirken bir hata oluştu.");
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await apiService.updateOrderStatus(orderId, status);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        } catch (err) {
            console.error("Failed to update order status:", err);
            alert("Sipariş durumu güncellenirken bir hata oluştu.");
        }
    };

    // Filter products locally
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'preparing': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'shipped': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <Store className="w-5 h-5 text-amber-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Market & Mağaza Modülü</h1>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Moffi PetShop ürün listesini, stok durumlarını ve müşteri siparişlerini buradan yönetebilirsiniz.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadData}
                        className="p-3 bg-white/5 border border-card-border hover:bg-white/10 rounded-xl text-white transition-colors"
                        title="Verileri Yenile"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {activeTab === 'products' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black text-sm rounded-xl flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wider italic"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Ürün Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-card-border">
                <button
                    onClick={() => setActiveTab('products')}
                    className={cn(
                        "px-6 py-4 font-black text-sm uppercase tracking-wider border-b-2 transition-colors",
                        activeTab === 'products' 
                            ? "border-amber-500 text-white" 
                            : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Ürünler ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={cn(
                        "px-6 py-4 font-black text-sm uppercase tracking-wider border-b-2 transition-colors",
                        activeTab === 'orders' 
                            ? "border-amber-500 text-white" 
                            : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Siparişler ({orders.length})
                </button>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center bg-black/20 rounded-[2.5rem] border border-card-border">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Mağaza Verileri Yükleniyor...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            ) : activeTab === 'products' ? (
                <div className="space-y-6">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-3xl border border-card-border">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Ürün adı veya açıklama ara..."
                                className="w-full h-11 pl-11 pr-4 bg-black/40 border border-card-border rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-amber-500/30 transition-all"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="h-11 px-4 bg-black/40 border border-card-border rounded-xl text-sm text-white outline-none focus:border-amber-500/30 transition-all cursor-pointer"
                        >
                            <option value="all">Tüm Kategoriler</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-black/20 rounded-[2.5rem] border border-card-border border-dashed text-gray-500">
                            <ShoppingBag className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Ürün Bulunamadı</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => {
                                const imgList = product.image ? product.image.split(',') : [];
                                const firstImg = imgList[0] || "";
                                const isUrl = firstImg && (
                                    firstImg.startsWith("http") || 
                                    firstImg.startsWith("/") || 
                                    firstImg.startsWith("data:") || 
                                    firstImg.length > 4
                                );
                                return (
                                    <div 
                                        key={product.id}
                                        className="bg-black/30 border border-card-border rounded-[2rem] overflow-hidden flex flex-col hover:border-white/10 transition-all group"
                                    >
                                        <div className="relative h-44 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center overflow-hidden">
                                            {isUrl ? (
                                                <>
                                                    <img 
                                                        src={getImgUrl(firstImg)} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover bg-white/5 group-hover:scale-110 transition-all duration-300" 
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.nextSibling as HTMLElement;
                                                            if (fallback) fallback.style.display = 'inline-block';
                                                        }}
                                                    />
                                                    <span className="hidden text-7xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">🦴</span>
                                                </>
                                            ) : (
                                                <span className="text-7xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">{product.image || "🦴"}</span>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => handleStartEdit(product)}
                                                    className="w-9 h-9 bg-white/5 hover:bg-amber-500 text-white hover:text-black border border-card-border rounded-xl flex items-center justify-center transition-all active:scale-90"
                                                    title="Ürünü Düzenle"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="w-9 h-9 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                                    title="Ürünü Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            {product.isVetApproved && (
                                                <span className="absolute bottom-4 left-4 px-2 py-0.5 rounded-lg text-[7px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest">
                                                    Vet Onaylı
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        {product.category}
                                                    </span>
                                                    {product.tag && (
                                                        <span className="text-[9px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            {product.tag}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Stok: {product.stockCount || 10} adet</span>
                                            </div>

                                            <h3 className="text-base font-black text-white mb-2 italic uppercase tracking-tight line-clamp-1">{product.name}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed mb-6">{product.description || "Açıklama bulunmuyor."}</p>

                                            <div className="mt-auto pt-4 border-t border-card-border flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    {product.oldPrice && (
                                                        <span className="text-[10px] text-gray-500 line-through">₺{product.oldPrice.toLocaleString('tr-TR')}</span>
                                                    )}
                                                    <span className="text-lg font-black text-white">₺{(product.price || 0).toLocaleString('tr-TR')}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-medium">ID: {product.id.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Orders Tab */
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-black/20 rounded-[2.5rem] border border-card-border border-dashed text-gray-500">
                            <Package className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Henüz Sipariş Yok</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div 
                                    key={order.id}
                                    className="bg-black/30 border border-card-border rounded-[2rem] p-6 space-y-6"
                                >
                                    {/* Order Meta */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-sm font-black text-white uppercase tracking-tight">Sipariş ID:</span>
                                                <span className="text-xs font-mono text-gray-400">{order.id}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                Tarih: {new Date(order.createdAt).toLocaleString('tr-TR')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Tutar</span>
                                                <span className="text-lg font-black text-white">₺{(order.totalPrice || 0).toLocaleString('tr-TR')}</span>
                                            </div>

                                            {/* Status Selector */}
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Durum Güncelle</span>
                                                <select
                                                    value={order.status}
                                                    onChange={e => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                    className={cn(
                                                        "h-9 px-3 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors",
                                                        getStatusColor(order.status)
                                                    )}
                                                >
                                                    <option value="pending">Onay Bekliyor</option>
                                                    <option value="confirmed">Onaylandı</option>
                                                    <option value="preparing">Hazırlanıyor</option>
                                                    <option value="shipped">Kargoya Verildi</option>
                                                    <option value="delivered">Teslim Edildi</option>
                                                    <option value="cancelled">İptal Edildi</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Details Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Products bought */}
                                        <div className="lg:col-span-2 space-y-2">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">Sipariş Edilen Ürünler</span>
                                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                                {(order.items || []).map((item, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-card-border"
                                                    >
                                                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-3xl overflow-hidden shrink-0">
                                                            {item.product?.image && (item.product.image.startsWith("http") || item.product.image.startsWith("/") || item.product.image.includes(".") || item.product.image.length > 4) ? (
                                                                <>
                                                                    <img 
                                                                        src={getImgUrl(item.product.image)} 
                                                                        alt={item.product.name} 
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
                                                                item.product?.image || "🦴"
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-white truncate">{item.product?.name || "Silinmiş Ürün"}</h4>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">Birim Fiyat: ₺{(item.product?.price || 0).toLocaleString('tr-TR')}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-xs font-black text-white">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delivery Info */}
                                        <div className="bg-white/5 border border-card-border p-5 rounded-[1.5rem] flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">Teslimat Adresi</span>
                                                <p className="text-xs text-white/80 leading-relaxed font-medium">
                                                    {order.shippingAddress || "Adres belirtilmemiş."}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-card-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                <Truck className="w-4 h-4 text-cyan-400" />
                                                Kurye: Hızlı Teslimat
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ADD PRODUCT MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center px-6 pointer-events-none"
                        >
                            <form 
                                onSubmit={handleAddProduct}
                                className="w-full max-w-md bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden shadow-moffi-card border border-card-border pointer-events-auto flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-card-border flex items-center justify-between shrink-0">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Yeni Ürün Ekle</h3>
                                    <button 
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setShowAddModal(false)} 
                                        className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ürün Adı *</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            value={newProduct.name}
                                            onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Örn: Acana Wild Prairie 2kg"
                                            className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satış Fiyatı (TL) *</label>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                disabled={isSubmitting}
                                                value={newProduct.price}
                                                onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                                                placeholder="Örn: 249.90"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eski Fiyat (Üstü Çizili)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                disabled={isSubmitting}
                                                value={newProduct.oldPrice}
                                                onChange={e => setNewProduct(prev => ({ ...prev, oldPrice: e.target.value }))}
                                                placeholder="Örn: 299.90"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok Adedi</label>
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={isSubmitting}
                                                value={newProduct.stockCount}
                                                onChange={e => setNewProduct(prev => ({ ...prev, stockCount: e.target.value }))}
                                                placeholder="Örn: 10"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                                            <select
                                                value={newProduct.category}
                                                disabled={isSubmitting}
                                                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value as ShopCategory }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="food">Mama</option>
                                                <option value="snack">Atıştırmalık</option>
                                                <option value="toy">Oyuncak</option>
                                                <option value="care">Bakım</option>
                                                <option value="accessory">Aksesuar</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Görsel Türü</label>
                                        <div className="flex gap-2">
                                            {(['emoji', 'url', 'upload'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => setNewProduct(prev => ({ ...prev, imageType: type }))}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                        newProduct.imageType === type
                                                            ? 'bg-amber-500 text-black border-amber-600'
                                                            : 'bg-white/5 text-white border-card-border hover:bg-white/10'
                                                    )}
                                                >
                                                    {type === 'emoji' ? 'Emoji' : type === 'url' ? 'Görsel URL' : 'Fotoğraf Yükle'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {newProduct.imageType === 'emoji' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Görsel Emojisi</label>
                                            <select
                                                value={newProduct.imageEmoji}
                                                disabled={isSubmitting}
                                                onChange={e => setNewProduct(prev => ({ ...prev, imageEmoji: e.target.value }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="🦴">🦴 Kemik</option>
                                                <option value="🥫">🥫 Konserve Mama</option>
                                                <option value="🐟">🐟 Balık Ödülü</option>
                                                <option value="🥩">🥩 Etli Ödül</option>
                                                <option value="🪀">🪀 Oyuncak Top</option>
                                                <option value="🧸">🧸 Oyuncak Ayı</option>
                                                <option value="🧴">🧴 Şampuan / Bakım</option>
                                                <option value="🧼">🧼 Sabun</option>
                                                <option value="🏷️">🏷️ Tasma</option>
                                                <option value="🧣">🧣 Kıyafet</option>
                                            </select>
                                        </div>
                                    )}

                                    {newProduct.imageType === 'url' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resim URL'si (Çoklu ise virgülle ayırın)</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={isSubmitting}
                                                value={newProduct.imageUrl}
                                                onChange={e => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                                                placeholder="https://link1.jpg, https://link2.jpg"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                    )}

                                    {newProduct.imageType === 'url' && newProduct.imageUrl && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Resim Önizlemeleri</label>
                                            <div className="flex flex-wrap gap-2">
                                                {newProduct.imageUrl.split(',').map((url, idx) => {
                                                    const trimmed = url.trim();
                                                    if (!trimmed) return null;
                                                    return (
                                                        <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-card-border bg-white/5 relative">
                                                            <img src={getImgUrl(trimmed)} alt="Önizleme" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                     {newProduct.imageType === 'upload' && (
                                         <div className="space-y-1">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resim Dosyası Seçin (Çoklu seçebilirsiniz)</label>
                                             <input
                                                 type="file"
                                                 accept="image/*"
                                                 multiple
                                                 disabled={isSubmitting}
                                                 onChange={e => {
                                                     const files = Array.from(e.target.files || []);
                                                     setNewProduct(prev => ({ ...prev, imageFiles: files, imageFile: files[0] || null }));
                                                 }}
                                                 className="w-full h-11 p-2 bg-black/40 border border-card-border rounded-xl text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white file:uppercase hover:file:bg-white/20 transition-all outline-none"
                                             />
                                         </div>
                                     )}

                                     {newProduct.imageType === 'upload' && newProduct.imageFiles && newProduct.imageFiles.length > 0 && (
                                         <div className="space-y-1">
                                             <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Seçilen Resimler ({newProduct.imageFiles.length})</label>
                                             <div className="flex flex-wrap gap-2">
                                                 {Array.from(newProduct.imageFiles).map((file, idx) => {
                                                     const previewUrl = URL.createObjectURL(file);
                                                     return (
                                                         <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-card-border bg-white/5 relative">
                                                             <img src={previewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     const updatedFiles = newProduct.imageFiles.filter((_, i) => i !== idx);
                                                                     setNewProduct(prev => ({
                                                                         ...prev,
                                                                         imageFiles: updatedFiles,
                                                                         imageFile: updatedFiles[0] || null
                                                                     }));
                                                                 }}
                                                                 className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-600 transition-colors"
                                                             >
                                                                 &times;
                                                             </button>
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     )}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Özel Kampanya Etiketi (Rozet)</label>
                                        <input
                                            type="text"
                                            disabled={isSubmitting}
                                            value={newProduct.tag}
                                            onChange={e => setNewProduct(prev => ({ ...prev, tag: e.target.value }))}
                                            placeholder="Örn: Çok Satan, %20 İndirim, Yeni"
                                            className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ürün Açıklaması</label>
                                        <textarea
                                            value={newProduct.description}
                                            disabled={isSubmitting}
                                            onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Ürün içeriği ve detaylı bilgileri yazın..."
                                            rows={3}
                                            className="w-full p-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-card-border">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Vet Onaylı</span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => setNewProduct(prev => ({ ...prev, isVetApproved: !prev.isVetApproved }))}
                                                className={cn("w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none", newProduct.isVetApproved ? 'bg-emerald-500' : 'bg-gray-700')}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300", newProduct.isVetApproved ? 'translate-x-4' : 'translate-x-0')} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-card-border">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Prime Özel</span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => setNewProduct(prev => ({ ...prev, isPrimeOnly: !prev.isPrimeOnly }))}
                                                className={cn("w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none", newProduct.isPrimeOnly ? 'bg-amber-500' : 'bg-gray-700')}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300", newProduct.isPrimeOnly ? 'translate-x-4' : 'translate-x-0')} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-card-border shrink-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest italic"
                                    >
                                        {isSubmitting ? 'Ürün Kaydediliyor...' : 'Ürünü Kaydet'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* EDIT PRODUCT MODAL */}
            <AnimatePresence>
                {showEditModal && editingProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
                            onClick={() => setShowEditModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center px-6 pointer-events-none"
                        >
                            <form 
                                onSubmit={handleEditProductSubmit}
                                className="w-full max-w-md bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden shadow-moffi-card border border-card-border pointer-events-auto flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-card-border flex items-center justify-between shrink-0">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Ürünü Düzenle</h3>
                                    <button 
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setShowEditModal(false)} 
                                        className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ürün Adı *</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={isSubmitting}
                                            value={editForm.name}
                                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Örn: Acana Wild Prairie 2kg"
                                            className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satış Fiyatı (TL) *</label>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                disabled={isSubmitting}
                                                value={editForm.price}
                                                onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                                placeholder="Örn: 249.90"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eski Fiyat (Üstü Çizili)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                disabled={isSubmitting}
                                                value={editForm.oldPrice}
                                                onChange={e => setEditForm(prev => ({ ...prev, oldPrice: e.target.value }))}
                                                placeholder="Örn: 299.90"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok Adedi</label>
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={isSubmitting}
                                                value={editForm.stockCount}
                                                onChange={e => setEditForm(prev => ({ ...prev, stockCount: e.target.value }))}
                                                placeholder="Örn: 10"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                                            <select
                                                value={editForm.category}
                                                disabled={isSubmitting}
                                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value as ShopCategory }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="food">Mama</option>
                                                <option value="snack">Atıştırmalık</option>
                                                <option value="toy">Oyuncak</option>
                                                <option value="care">Bakım</option>
                                                <option value="accessory">Aksesuar</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Görsel Türü</label>
                                        <div className="flex gap-2">
                                            {(['emoji', 'url', 'upload'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => setEditForm(prev => ({ ...prev, imageType: type }))}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                        editForm.imageType === type
                                                            ? 'bg-amber-500 text-black border-amber-600'
                                                            : 'bg-white/5 text-white border-card-border hover:bg-white/10'
                                                    )}
                                                >
                                                    {type === 'emoji' ? 'Emoji' : type === 'url' ? 'Görsel URL' : 'Fotoğraf Yükle'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {editForm.imageType === 'emoji' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Görsel Emojisi</label>
                                            <select
                                                value={editForm.imageEmoji}
                                                disabled={isSubmitting}
                                                onChange={e => setEditForm(prev => ({ ...prev, imageEmoji: e.target.value }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="🦴">🦴 Kemik</option>
                                                <option value="🥫">🥫 Konserve Mama</option>
                                                <option value="🐟">🐟 Balık Ödülü</option>
                                                <option value="🥩">🥩 Etli Ödül</option>
                                                <option value="🪀">🪀 Oyuncak Top</option>
                                                <option value="🧸">🧸 Oyuncak Ayı</option>
                                                <option value="🧴">🧴 Şampuan / Bakım</option>
                                                <option value="🧼">🧼 Sabun</option>
                                                <option value="🏷️">🏷️ Tasma</option>
                                                <option value="🧣">🧣 Kıyafet</option>
                                            </select>
                                        </div>
                                    )}

                                    {editForm.imageType === 'url' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resim URL'si (Çoklu ise virgülle ayırın)</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={isSubmitting}
                                                value={editForm.imageUrl}
                                                onChange={e => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                                placeholder="https://link1.jpg, https://link2.jpg"
                                                className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                            />
                                        </div>
                                    )}

                                    {editForm.imageType === 'upload' && (
                                        <div className="space-y-1">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resim Dosyası Seçin (Çoklu seçebilirsiniz. Boş bırakırsanız mevcut görsel korunur)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={isSubmitting}
                                                 multiple
                                                 onChange={e => {
                                                     const files = Array.from(e.target.files || []);
                                                     setEditForm(prev => ({ ...prev, imageFiles: files, imageFile: files[0] || null }));
                                                 }}
                                                className="w-full h-11 p-2 bg-black/40 border border-card-border rounded-xl text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white file:uppercase hover:file:bg-white/20 transition-all outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Özel Kampanya Etiketi (Rozet)</label>
                                        <input
                                            type="text"
                                            disabled={isSubmitting}
                                            value={editForm.tag}
                                            onChange={e => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                                            placeholder="Örn: Çok Satan, %20 İndirim, Yeni"
                                            className="w-full h-11 px-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ürün Açıklaması</label>
                                        <textarea
                                            value={editForm.description}
                                            disabled={isSubmitting}
                                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Ürün içeriği ve detaylı bilgileri yazın..."
                                            rows={3}
                                            className="w-full p-4 bg-black/40 border border-card-border rounded-xl text-xs text-white placeholder:text-gray-700 outline-none focus:border-amber-500/30 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-card-border">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Vet Onaylı</span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => setEditForm(prev => ({ ...prev, isVetApproved: !prev.isVetApproved }))}
                                                className={cn("w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none", editForm.isVetApproved ? 'bg-emerald-500' : 'bg-gray-700')}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300", editForm.isVetApproved ? 'translate-x-4' : 'translate-x-0')} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-card-border">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Prime Özel</span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => setEditForm(prev => ({ ...prev, isPrimeOnly: !prev.isPrimeOnly }))}
                                                className={cn("w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none", editForm.isPrimeOnly ? 'bg-amber-500' : 'bg-gray-700')}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300", editForm.isPrimeOnly ? 'translate-x-4' : 'translate-x-0')} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-card-border shrink-0">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest italic"
                                    >
                                        {isSubmitting ? 'Ürün Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
