"use client";

import { useState, useMemo } from "react";
import { BusinessSidebar } from "@/components/business/Sidebar";
import { MOCK_PRODUCTS } from "@/data/mockBusinessRegistry";
import { useAuth } from "@/context/AuthContext";
import { BusinessProduct, ProductStatus, ProductCategory } from "@/types/business";
import { cn } from "@/lib/utils";
import {
    Package, Plus, Search, Filter, Edit3, Trash2, Eye, EyeOff,
    Menu, X, ChevronDown, AlertTriangle, TrendingUp, Archive, LayoutGrid, List,
    Tag, Loader2, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
    food: 'Mama', toy: 'Oyuncak', accessory: 'Aksesuar', health: 'Sağlık', clothing: 'Giyim', bed: 'Yatak', other: 'Diğer'
};

const STATUS_CONFIG: Record<ProductStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'Aktif', color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
    inactive: { label: 'Pasif', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
    out_of_stock: { label: 'Tükendi', color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
};

export default function BusinessProductsPage() {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
    const [editModal, setEditModal] = useState<BusinessProduct | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const businessId = user?.businessId || 'biz_paws1';
    const allProducts = MOCK_PRODUCTS.filter(p => p.businessId === businessId);

    const filtered = useMemo(() => {
        let result = [...allProducts];
        if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        if (categoryFilter !== 'all') result = result.filter(p => p.category === categoryFilter);
        if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
        return result;
    }, [allProducts, search, categoryFilter, statusFilter]);

    const stats = {
        total: allProducts.length,
        active: allProducts.filter(p => p.status === 'active').length,
        outOfStock: allProducts.filter(p => p.status === 'out_of_stock').length,
        lowStock: allProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50 font-sans">
            <BusinessSidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 p-4 md:p-8 md:pl-80 transition-all duration-300 w-full">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 rounded-xl bg-white border border-gray-200/50 flex items-center justify-center md:hidden">
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Ürünler</h1>
                            <p className="text-sm text-gray-500">{allProducts.length} ürün listeleniyor</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start"
                    >
                        <Plus className="w-4 h-4" /> Yeni Ürün Ekle
                    </button>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MiniStat icon={Package} label="Toplam Ürün" value={stats.total} color="blue" />
                    <MiniStat icon={CheckCircle} label="Aktif" value={stats.active} color="green" />
                    <MiniStat icon={AlertTriangle} label="Düşük Stok" value={stats.lowStock} color="amber" />
                    <MiniStat icon={Archive} label="Tükenen" value={stats.outOfStock} color="red" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Ürün ara..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value as ProductCategory | 'all')}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                        <option value="all">Tüm Kategoriler</option>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as ProductStatus | 'all')}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                        <option value="all">Tüm Durumlar</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <div className="flex bg-gray-100 rounded-xl p-1 self-center">
                        <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition", viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-400")}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition", viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-400")}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Product Grid/List */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-700 mb-1">Ürün bulunamadı</h3>
                        <p className="text-sm text-gray-400">Filtrelerinizi değiştirin veya yeni ürün ekleyin.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(product => (
                            <ProductCard key={product.id} product={product} onEdit={() => setEditModal(product)} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left p-4 font-bold text-gray-500 text-xs uppercase">Ürün</th>
                                    <th className="text-left p-4 font-bold text-gray-500 text-xs uppercase hidden md:table-cell">Kategori</th>
                                    <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase">Fiyat</th>
                                    <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase hidden sm:table-cell">Stok</th>
                                    <th className="text-center p-4 font-bold text-gray-500 text-xs uppercase">Durum</th>
                                    <th className="text-center p-4 font-bold text-gray-500 text-xs uppercase">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(product => (
                                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell"><span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{CATEGORY_LABELS[product.category]}</span></td>
                                        <td className="p-4 text-right font-bold text-gray-900">₺{product.price}</td>
                                        <td className="p-4 text-right hidden sm:table-cell">
                                            <span className={cn("font-bold", product.stock === 0 ? "text-red-600" : product.stock <= 10 ? "text-amber-600" : "text-gray-700")}>{product.stock}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", STATUS_CONFIG[product.status].bg, STATUS_CONFIG[product.status].color)}>{STATUS_CONFIG[product.status].label}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => setEditModal(product)} className="text-gray-400 hover:text-indigo-600 transition"><Edit3 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Edit/Add Modal */}
            <AnimatePresence>
                {(editModal || showAddModal) && (
                    <ProductModal
                        product={editModal}
                        onClose={() => { setEditModal(null); setShowAddModal(false); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==================
// Sub Components
// ==================

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Package; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors[color])}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

function ProductCard({ product, onEdit }: { product: BusinessProduct; onEdit: () => void }) {
    const isOutOfStock = product.status === 'out_of_stock';

    return (
        <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300", isOutOfStock && "opacity-75")}>
            <div className="relative h-40 bg-gray-100">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Tükendi</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={onEdit} className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-gray-600 hover:text-indigo-600 shadow-sm">
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{CATEGORY_LABELS[product.category]}</span>
                <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900">₺{product.price}</span>
                        {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">₺{product.originalPrice}</span>
                        )}
                    </div>
                    <span className={cn("text-xs font-bold", product.stock === 0 ? "text-red-500" : product.stock <= 10 ? "text-amber-500" : "text-gray-400")}>
                        Stok: {product.stock}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ProductModal({ product, onClose }: { product: BusinessProduct | null; onClose: () => void }) {
    const isEdit = !!product;
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price.toString() || '');
    const [stock, setStock] = useState(product?.stock.toString() || '');
    const [category, setCategory] = useState<ProductCategory>(product?.category || 'food');
    const [description, setDescription] = useState(product?.description || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(onClose, 800);
        }, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900">{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Ürün Adı</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Ürün adı" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Fiyat (₺)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Stok</label>
                            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Kategori</label>
                        <select value={category} onChange={e => setCategory(e.target.value as ProductCategory)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">Açıklama</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Ürün açıklaması" />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">İptal</button>
                    <button onClick={handleSave} disabled={saving || saved || !name || !price} className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                        saved ? "bg-green-500 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
                    )}>
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : saved ? <><CheckCircle className="w-4 h-4" /> Kaydedildi</> : isEdit ? 'Güncelle' : 'Ekle'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
