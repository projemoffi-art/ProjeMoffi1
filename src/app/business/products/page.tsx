"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, Edit3, AlertTriangle, Archive, LayoutGrid, List, Loader2, CheckCircle, X } from "lucide-react";
import { useActiveBusiness } from "@/context/BusinessTypeContext";
import { cn, showToast } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import type { ShopCategory, ShopProduct } from "@/services/types";
import { productEmoji, productImages } from "@/lib/productImage";
import { SHOP_CATEGORY_LABELS, SHOP_CATEGORIES } from "@/lib/shop/categories";

const LOW_STOCK = 10;
const stockOf = (p: ShopProduct) => p.stockCount ?? 0;

/**
 * Satıcının ürünleri (products.owner_id = işletme). Stok ve görsel mağazadaki aynı eşlemeden (mapProductRow) okunur;
 * eskiden ham sütun adları (stock, image_url) okunduğu için her ürün "Tükendi" ve görselsiz görünüyordu.
 * Kategoriler mağaza vitriniyle aynı (lib/shop/categories); satıcıya özel ayrı kategori yok.
 */
export default function BusinessProductsPage() {
    const { businessId } = useActiveBusiness();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ShopCategory | 'all'>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
    const [editing, setEditing] = useState<ShopProduct | 'new' | null>(null);
    const [products, setProducts] = useState<ShopProduct[] | null>(null);

    const fetchProducts = useCallback(() => {
        if (!businessId) return;
        apiService.getClinicProducts(businessId).then(setProducts).catch(err => { console.error(err); setProducts([]); });
    }, [businessId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const all = useMemo(() => products ?? [], [products]);
    const filtered = useMemo(() => all.filter(p =>
        (!search || p.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
        (categoryFilter === 'all' || p.category === categoryFilter) &&
        (stockFilter === 'all' || (stockFilter === 'in' ? stockOf(p) > 0 : stockOf(p) === 0))
    ), [all, search, categoryFilter, stockFilter]);

    const stats = {
        total: all.length,
        inStock: all.filter(p => stockOf(p) > 0).length,
        low: all.filter(p => stockOf(p) > 0 && stockOf(p) <= LOW_STOCK).length,
        out: all.filter(p => stockOf(p) === 0).length,
    };
    const field = "px-4 py-2.5 bg-background border border-card-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-accent";

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Ürünler</h1>
                    <p className="text-sm text-secondary">{all.length} ürün</p>
                </div>
                <button onClick={() => setEditing('new')} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 self-start">
                    <Plus className="w-4 h-4" /> Yeni Ürün Ekle
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MiniStat icon={Package} label="Toplam ürün" value={stats.total} />
                <MiniStat icon={CheckCircle} label="Stokta" value={stats.inStock} />
                <MiniStat icon={AlertTriangle} label={`Düşük stok (≤${LOW_STOCK})`} value={stats.low} />
                <MiniStat icon={Archive} label="Tükenen" value={stats.out} />
            </div>

            <div className="bg-card rounded-2xl border border-card-border p-4 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün ara..." className={cn(field, "w-full pl-10")} />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as ShopCategory | 'all')} className={field}>
                    <option value="all">Tüm kategoriler</option>
                    {SHOP_CATEGORIES.map(c => <option key={c} value={c}>{SHOP_CATEGORY_LABELS[c]}</option>)}
                </select>
                <select value={stockFilter} onChange={e => setStockFilter(e.target.value as 'all' | 'in' | 'out')} className={field}>
                    <option value="all">Tüm stok durumları</option>
                    <option value="in">Stokta</option>
                    <option value="out">Tükenen</option>
                </select>
                <div className="flex bg-foreground/[0.05] rounded-xl p-1 self-center">
                    <button onClick={() => setViewMode('grid')} aria-label="Kart görünümü" className={cn("p-2 rounded-lg", viewMode === 'grid' ? "bg-card" : "text-secondary")}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} aria-label="Liste görünümü" className={cn("p-2 rounded-lg", viewMode === 'list' ? "bg-card" : "text-secondary")}><List className="w-4 h-4" /></button>
                </div>
            </div>

            {products === null ? (
                <p className="p-12 text-center text-secondary">Ürünler yükleniyor…</p>
            ) : filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border border-card-border p-16 text-center">
                    <Package className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
                    <h3 className="font-bold text-foreground mb-1">Ürün bulunamadı</h3>
                    <p className="text-sm text-secondary">Filtreleri değiştir ya da yeni ürün ekle.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(p => <ProductCard key={p.id} product={p} onEdit={() => setEditing(p)} />)}
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-card-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-card-border">
                                <th className="text-left p-4 font-bold text-secondary text-xs">Ürün</th>
                                <th className="text-left p-4 font-bold text-secondary text-xs hidden md:table-cell">Kategori</th>
                                <th className="text-right p-4 font-bold text-secondary text-xs">Fiyat</th>
                                <th className="text-right p-4 font-bold text-secondary text-xs">Stok</th>
                                <th className="p-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const img = productImages(p.image)[0];
                                return (
                                    <tr key={p.id} className="border-b border-card-border last:border-0">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                {img ? <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-xl">{productEmoji(p.image)}</span>}
                                                <span className="font-medium text-foreground truncate max-w-[200px]">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-secondary">{SHOP_CATEGORY_LABELS[p.category]}</td>
                                        <td className="p-4 text-right font-bold text-foreground">₺{p.price.toLocaleString('tr-TR')}</td>
                                        <td className={cn("p-4 text-right font-bold", stockOf(p) === 0 ? "text-red-600" : stockOf(p) <= LOW_STOCK ? "text-amber-600" : "text-foreground")}>{stockOf(p)}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => setEditing(p)} aria-label="Düzenle" className="text-secondary hover:text-accent"><Edit3 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {editing && businessId && (
                    <ProductModal
                        product={editing === 'new' ? null : editing}
                        businessId={businessId}
                        onClose={(changed) => { setEditing(null); if (changed) fetchProducts(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
    return (
        <div className="bg-card rounded-2xl border border-card-border p-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3"><Icon className="w-4 h-4" /></div>
            <div className="text-2xl font-black text-foreground">{value}</div>
            <div className="text-[11px] font-bold text-secondary mt-1">{label}</div>
        </div>
    );
}

function ProductCard({ product, onEdit }: { product: ShopProduct; onEdit: () => void }) {
    const stock = stockOf(product);
    const img = productImages(product.image)[0];
    return (
        <div className={cn("bg-card rounded-2xl border border-card-border overflow-hidden", stock === 0 && "opacity-75")}>
            <div className="relative h-40 bg-foreground/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img ? <img src={img} alt={product.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-5xl">{productEmoji(product.image)}</span>}
                {stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Tükendi</span>
                    </div>
                )}
                <button onClick={onEdit} aria-label="Düzenle" className="absolute top-2 right-2 w-8 h-8 bg-card/90 rounded-lg flex items-center justify-center text-secondary hover:text-accent">
                    <Edit3 className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="p-4">
                <span className="text-[11px] font-bold text-secondary">{SHOP_CATEGORY_LABELS[product.category]}</span>
                <h3 className="font-bold text-foreground text-sm mt-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-foreground">₺{product.price.toLocaleString('tr-TR')}</span>
                        {product.oldPrice ? <span className="text-xs text-secondary line-through">₺{product.oldPrice.toLocaleString('tr-TR')}</span> : null}
                    </div>
                    <span className={cn("text-xs font-bold", stock === 0 ? "text-red-500" : stock <= LOW_STOCK ? "text-amber-600" : "text-secondary")}>Stok: {stock}</span>
                </div>
            </div>
        </div>
    );
}

function ProductModal({ product, businessId, onClose }: { product: ShopProduct | null; businessId: string; onClose: (changed: boolean) => void }) {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product ? String(product.price) : '');
    const [stock, setStock] = useState(product ? String(stockOf(product)) : '');
    const [category, setCategory] = useState<ShopCategory>(product?.category || 'food');
    const [description, setDescription] = useState(product?.description || '');
    const [saving, setSaving] = useState(false);

    const priceNum = Number(price.replace(',', '.'));
    const stockNum = stock.trim() === '' ? 0 : Number(stock);
    const valid = name.trim().length > 0 && Number.isFinite(priceNum) && priceNum > 0 && Number.isInteger(stockNum) && stockNum >= 0;

    const save = async () => {
        if (!valid) return;
        setSaving(true);
        try {
            const payload = { name: name.trim(), price: priceNum, stockCount: stockNum, category, description: description.trim(), ownerId: businessId };
            if (product) await apiService.updateProduct(product.id, payload);
            else await apiService.addProduct(payload);
            showToast(product ? 'Ürün güncellendi.' : 'Ürün eklendi.', 'CheckCircle2', 'text-emerald-500');
            onClose(true);
        } catch (err) {
            console.error(err);
            showToast("Ürün kaydedilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full bg-background text-foreground border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent";
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => onClose(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-card-border flex items-center justify-between">
                    <h2 className="text-lg font-black text-foreground">{product ? 'Ürünü düzenle' : 'Yeni ürün'}</h2>
                    <button onClick={() => onClose(false)} aria-label="Kapat" className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-secondary"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold text-secondary mb-1.5 block">Ürün adı</span>
                        <input value={name} maxLength={120} onChange={e => setName(e.target.value)} className={field} placeholder="Ürün adı" />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-xs font-bold text-secondary mb-1.5 block">Fiyat (₺)</span>
                            <input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} className={field} />
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-secondary mb-1.5 block">Stok</span>
                            <input inputMode="numeric" value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ''))} className={field} placeholder="0" />
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-xs font-bold text-secondary mb-1.5 block">Kategori</span>
                        <select value={category} onChange={e => setCategory(e.target.value as ShopCategory)} className={field}>
                            {SHOP_CATEGORIES.map(c => <option key={c} value={c}>{SHOP_CATEGORY_LABELS[c]}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-secondary mb-1.5 block">Açıklama</span>
                        <textarea value={description} maxLength={2000} onChange={e => setDescription(e.target.value)} rows={3} className={cn(field, "resize-none")} placeholder="Ürün açıklaması" />
                    </label>
                </div>
                <div className="p-6 border-t border-card-border flex justify-end gap-3">
                    <button onClick={() => onClose(false)} className="px-5 py-2.5 rounded-xl border border-card-border text-sm font-bold text-secondary">İptal</button>
                    <button onClick={save} disabled={saving || !valid} className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-accent text-white disabled:opacity-50">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : product ? 'Güncelle' : 'Ekle'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
