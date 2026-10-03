'use client';

// Senin İçin Öneriler (home-final referansı: fotoğraflı ürün kartları + sepet düğmesi).
// Gerçek ürünler (usePetShop). Karta dokununca o ürün mağazada açılır.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint, ShoppingCart } from 'lucide-react';
import { haptics } from '@/native';
import { showToast } from '@/lib/utils';
import type { ShopProduct } from '@/services/types';
import { SectionHeader, ScrollDots, activeIndexOf } from './homeUI';

const CATEGORY_LABEL: Record<string, string> = {
    food: 'Mama', snack: 'Ödül maması', toy: 'Oyuncak', care: 'Bakım', accessory: 'Aksesuar',
    apparel: 'Giyim', 'pet-apparel': 'Giyim', home: 'Ev ve yaşam',
};

export function HomeRecommendations({ products, onAddToCart }: {
    products: ShopProduct[];
    onAddToCart: (id: string) => Promise<boolean>;
}) {
    const router = useRouter();
    const scroller = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [broken, setBroken] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState<string | null>(null);

    if (products.length === 0) return null;

    const add = async (p: ShopProduct) => {
        if (adding) return;
        haptics.tap();
        setAdding(p.id);
        const ok = await onAddToCart(p.id);
        setAdding(null);
        if (ok) { haptics.success(); showToast(`${p.name} sepete eklendi`, 'CheckCircle2', 'text-emerald-500'); }
        else showToast('Ürün sepete eklenemedi, tekrar dener misin?', 'AlertCircle', 'text-red-500');
    };

    return (
        <section>
            <SectionHeader title="Senin İçin Öneriler" subtitle="Moffi'nin senin için seçtikleri ♡" href="/petshop" />
            <div
                ref={scroller}
                onScroll={e => setActive(activeIndexOf(e.currentTarget, products.length))}
                className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-5 px-5 pb-1"
            >
                {products.map(p => (
                    <div
                        key={p.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => { haptics.tap(); router.push(`/petshop?openProduct=${encodeURIComponent(p.id)}`); }}
                        onKeyDown={e => { if (e.key === 'Enter') router.push(`/petshop?openProduct=${encodeURIComponent(p.id)}`); }}
                        className="snap-start w-[158px] shrink-0 rounded-[20px] card-premium overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div className="h-[124px] bg-foreground/[0.05] relative">
                            {p.image && !broken.has(p.id) ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={() => setBroken(prev => new Set(prev).add(p.id))} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <PawPrint className="w-8 h-8 text-foreground/20" />
                                </div>
                            )}
                            {p.tag && (
                                <span className="absolute top-2 left-2 rounded-full bg-card/95 px-2 py-0.5 text-[10.5px] font-bold text-foreground">{p.tag}</span>
                            )}
                        </div>
                        <div className="p-3">
                            <h3 className="text-[13.5px] font-bold text-foreground truncate">{p.name}</h3>
                            <p className="text-[11.5px] font-semibold text-secondary truncate mt-0.5">{p.brand_name || CATEGORY_LABEL[p.category] || ' '}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                    <span className="text-[15px] font-extrabold text-foreground">₺{p.price.toLocaleString('tr-TR')}</span>
                                    {p.oldPrice && p.oldPrice > p.price && (
                                        <span className="text-[11px] font-semibold text-secondary line-through">₺{p.oldPrice.toLocaleString('tr-TR')}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    aria-label={`${p.name} sepete ekle`}
                                    disabled={adding === p.id}
                                    onClick={e => { e.stopPropagation(); add(p); }}
                                    className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-50"
                                >
                                    <ShoppingCart className="w-[18px] h-[18px] text-accent" strokeWidth={2.2} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <ScrollDots count={Math.min(products.length, 6)} active={Math.min(active, 5)} />
        </section>
    );
}
