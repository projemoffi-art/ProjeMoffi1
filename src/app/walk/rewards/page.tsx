"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { haptics } from "@/lib/haptics";

// Faz 14: "Ödül Marketi" — daha önce hiç yoktu, referans görselin ("7. Ödül /
// Puan Marketi", bkz. design-reference/walk-final/) doğrudan karşılığı. Gerçek
// `reward_products` tablosundan besleniyor, satın alma mevcut PP ekonomisini
// (award_pati_puan RPC'si, negatif miktarla) kullanıyor — yeni bir para birimi
// icat edilmedi. Ürün fotoğrafları yerine bilerek emoji/ikon kullanıldı (sahte
// stok fotoğraf üretmemek için).

type TabKey = 'all' | 'product' | 'coupon' | 'experience';

// Ekran 14 (Ödül Marketi) — design-reference/walk-final/'e göre sekme sırası
// Tümü/Ürünler/Kuponlar/Özel (önceden Tümü/Ürünler/Özel Deneyimler/Kuponlar'dı).
const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'product', label: 'Ürünler' },
    { key: 'coupon', label: 'Kuponlar' },
    { key: 'experience', label: 'Özel' },
];

// Referans "Öne Çıkanlar" bölümü için gerçek, açıklanabilir bir kriter
// gerekiyordu (uydurma/rastgele olmaması için) — en düşük fiyatlı (en kolay
// ulaşılabilir) N ürün seçildi. Editöryel bir "is_featured" alanı DB'de yok;
// Baran ileride elle seçilmiş bir öne çıkan liste isterse `reward_products`'a
// gerçek bir `is_featured boolean` kolonu eklenebilir (bkz. README).
const FEATURED_COUNT = 3;

interface RewardProduct {
    id: string;
    name: string;
    description: string | null;
    category: 'product' | 'experience' | 'coupon';
    pricePp: number;
    icon: string;
}

export default function RewardsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [products, setProducts] = useState<RewardProduct[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('all');
    const [confirmProduct, setConfirmProduct] = useState<RewardProduct | null>(null);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemed, setRedeemed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [productsData, balanceData] = await Promise.all([
                apiService.getRewardProducts(),
                user ? apiService.getPatiPuanBalance() : Promise.resolve(0),
            ]);
            if (cancelled) return;
            setProducts(productsData);
            setBalance(balanceData);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user]);

    const filtered = products.filter(p => tab === 'all' || p.category === tab);
    const featured = [...products].sort((a, b) => a.pricePp - b.pricePp).slice(0, FEATURED_COUNT);

    const closeModal = () => {
        if (redeeming) return;
        setConfirmProduct(null);
        setRedeemed(false);
    };

    const handleRedeem = async () => {
        if (!confirmProduct) return;
        setRedeeming(true);
        try {
            const newBalance = await apiService.redeemReward(confirmProduct.id, confirmProduct.name, confirmProduct.pricePp);
            setBalance(newBalance);
            haptics.success();
            setRedeemed(true);
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: `🎁 ${confirmProduct.name} sepetine eklendi!`, icon: 'Gift', color: 'text-emerald-400' }
            }));
            setTimeout(() => { setConfirmProduct(null); setRedeemed(false); }, 1100);
        } catch (err: any) {
            haptics.warn();
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: { message: err?.message || 'Ödül alınamadı, lütfen tekrar dene.', icon: 'AlertTriangle', color: 'text-red-400' }
            }));
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Ödül Marketi</h1>
                    <span className="text-[11px] font-black text-white bg-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1">
                        🐾 {balance.toLocaleString('tr-TR')}
                    </span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { haptics.tap(); setTab(t.key); }}
                            className={cn(
                                "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-0 cursor-pointer active:scale-95",
                                tab === t.key ? "bg-slate-900 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                        <span className="text-2xl animate-bounce">🐾</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Ödüller getiriliyor...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <span className="text-2xl block mb-2">🎁</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Bu kategoride henüz ödül yok,<br />çok yakında yeni sürprizler eklenecek!
                        </p>
                    </div>
                ) : (
                    <>
                    {tab === 'all' && featured.length > 0 && (
                        <div className="mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Öne Çıkanlar</span>
                            <div className="space-y-2">
                                {featured.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => { haptics.tap(); setConfirmProduct(product); }}
                                        className="w-full bg-card rounded-2xl p-3 flex items-center gap-3 border border-card-border shadow-moffi-card cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-xl shrink-0">
                                            {product.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <span className="text-[12px] font-black text-foreground block truncate">{product.name}</span>
                                            <span className="text-[10px] font-bold text-orange-600">🐾 {product.pricePp.toLocaleString('tr-TR')} puan</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((product, i) => {
                            const canAfford = balance >= product.pricePp;
                            return (
                                <motion.button
                                    key={product.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.04 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { haptics.tap(); setConfirmProduct(product); }}
                                    className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 text-center border border-card-border shadow-moffi-card cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-3xl">
                                        {product.icon}
                                    </div>
                                    <span className="text-[11px] font-black text-foreground leading-tight">{product.name}</span>
                                    <span className={cn(
                                        "text-[10px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full",
                                        canAfford ? "text-orange-600 bg-orange-50 dark:bg-orange-500/10" : "text-slate-400 bg-slate-100 dark:bg-white/5"
                                    )}>
                                        🐾 {product.pricePp.toLocaleString('tr-TR')} puan
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {confirmProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>

                            <AnimatePresence mode="wait">
                                {redeemed ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center py-6"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                                            <Check className="w-8 h-8 text-white" strokeWidth={3} />
                                        </div>
                                        <h3 className="text-base font-black text-foreground text-center">Harika, alındı! 🎉</h3>
                                        <p className="text-[11px] font-bold text-slate-400 text-center mt-1">{confirmProduct.name} sepetine eklendi.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
                                            {confirmProduct.icon}
                                        </div>
                                        <h3 className="text-base font-black text-foreground text-center mb-1">{confirmProduct.name}</h3>
                                        {confirmProduct.description && (
                                            <p className="text-[11px] font-bold text-slate-400 text-center mb-4">{confirmProduct.description}</p>
                                        )}
                                        <div className="text-center mb-5">
                                            <span className="text-[12px] font-black text-orange-600">🐾 {confirmProduct.pricePp.toLocaleString('tr-TR')} puan</span>
                                        </div>
                                        {balance < confirmProduct.pricePp ? (
                                            <div className="text-center text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-white/5 rounded-2xl py-3 px-4 leading-relaxed">
                                                Bu ödül için birkaç Moffi Puanına daha ihtiyacın var — yürümeye devam, yakında burada olacaksın! 🐾
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={handleRedeem}
                                                disabled={redeeming}
                                                className="w-full h-13 py-3.5 bg-orange-500 text-white rounded-full font-black text-[12px] uppercase tracking-widest transition-all border-0 disabled:opacity-60"
                                            >
                                                {redeeming ? 'İşleniyor...' : 'Satın Al'}
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
