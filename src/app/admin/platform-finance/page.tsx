"use client";

// Platform Finans: yalnızca gerçek kayıtlar. Ödenmiş sipariş = orders.status 'paid' | 'confirmed' (finalize_paid_order).
// Komisyon siparişte saklanan commission_rate/commission_amount'tan (ödeme anındaki oran); varsayım yok.
// İşletme dağılımı order_items.business_id'den. Satıcıya ödeme (payout) kaydı henüz yok: "satıcı payı" hesaplanan tutardır.

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PAID = new Set(["paid", "confirmed"]);
const tl = (n: number) => `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface OrderRow { id: string; status: string; total_amount: number | string | null; commission_rate: number | string | null; commission_amount: number | string | null; expires_at: string | null }
interface ItemRow { order_id: string; business_id: string | null; quantity: number | null; price_at_purchase: number | string | null; status: string | null }

export default function PlatformFinancePage() {
    const [orders, setOrders] = useState<OrderRow[] | null>(null);
    const [items, setItems] = useState<ItemRow[]>([]);
    const [names, setNames] = useState<Map<string, string>>(new Map());
    const [error, setError] = useState("");
    const [loadedAt, setLoadedAt] = useState(0);

    useEffect(() => {
        let alive = true;
        (async () => {
            const [o, i, b] = await Promise.all([
                supabase.from("orders").select("id, status, total_amount, commission_rate, commission_amount, expires_at").limit(5000),
                supabase.from("order_items").select("order_id, business_id, quantity, price_at_purchase, status").limit(20000),
                supabase.from("businesses").select("id, name"),
            ]);
            if (!alive) return;
            if (o.error || i.error) setError("Finans verisi okunamadı.");
            setOrders((o.data || []) as OrderRow[]);
            setItems((i.data || []) as ItemRow[]);
            setNames(new Map((b.data || []).map(x => [x.id as string, x.name as string])));
            setLoadedAt(Date.now());
        })();
        return () => { alive = false; };
    }, []);

    const s = useMemo(() => {
        const list = orders || [];
        const paid = list.filter(o => PAID.has(o.status));
        const rateOf = new Map(paid.map(o => [o.id, Number(o.commission_rate) || 0]));
        const gmv = paid.reduce((t, o) => t + (Number(o.total_amount) || 0), 0);
        const commission = paid.reduce((t, o) => t + (Number(o.commission_amount) || 0), 0);
        const awaiting = list.filter(o => o.status === "pending" && (!o.expires_at || new Date(o.expires_at).getTime() > loadedAt));
        const cancelledItems = items.filter(it => rateOf.has(it.order_id) && (it.status === "cancelled" || it.status === "returned"));
        const refunds = cancelledItems.reduce((t, it) => t + (Number(it.price_at_purchase) || 0) * (it.quantity || 0), 0);

        const per = new Map<string, { orders: Set<string>; gmv: number; commission: number }>();
        for (const it of items) {
            if (!it.business_id || !rateOf.has(it.order_id) || it.status === "cancelled" || it.status === "returned") continue;
            const line = (Number(it.price_at_purchase) || 0) * (it.quantity || 0);
            const row = per.get(it.business_id) || { orders: new Set<string>(), gmv: 0, commission: 0 };
            row.orders.add(it.order_id);
            row.gmv += line;
            row.commission += line * (rateOf.get(it.order_id)! / 100);
            per.set(it.business_id, row);
        }
        const breakdown = Array.from(per, ([id, r]) => ({ id, name: names.get(id) || "Silinmiş işletme", orders: r.orders.size, gmv: r.gmv, commission: r.commission, net: r.gmv - r.commission }))
            .sort((a, b) => b.gmv - a.gmv);

        return {
            paidCount: paid.length, gmv, commission, sellerShare: gmv - commission, refunds,
            awaitingCount: awaiting.length, awaitingAmount: awaiting.reduce((t, o) => t + (Number(o.total_amount) || 0), 0),
            breakdown,
        };
    }, [orders, items, names, loadedAt]);

    if (orders === null) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Platform Finans</h1>
                <p className="text-sm font-semibold text-zinc-500 max-w-2xl">
                    Mağaza siparişlerinin gerçek tutarları. Komisyon, her siparişte ödeme anındaki orandan hesaplanır (Sistem Ayarları → komisyon oranı yeni siparişleri etkiler).
                </p>
                {error && <p className="text-sm font-bold text-rose-500">{error}</p>}
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Ödenen sipariş tutarı (GMV)" value={tl(s.gmv)} sub={`${s.paidCount} sipariş`} />
                <Stat label="Platform komisyonu" value={tl(s.commission)} sub={s.gmv ? `ortalama %${((s.commission / s.gmv) * 100).toFixed(1)}` : "—"} />
                <Stat label="Satıcı payı (hesaplanan)" value={tl(s.sellerShare)} sub="ödeme kaydı henüz yok" />
                <Stat label="İptal / iade edilen ürünler" value={tl(s.refunds)} sub="ödenmiş siparişlerde" />
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm font-semibold text-amber-700 dark:text-amber-400">
                Ödeme bekleyen: {s.awaitingCount} sipariş · {tl(s.awaitingAmount)} (15 dakika içinde ödenmezse düşer)
            </div>

            <section className="rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <h2 className="px-4 py-3 text-sm font-black text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800">İşletme bazlı dağılım</h2>
                {s.breakdown.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm font-semibold text-zinc-500">Henüz ödenmiş mağaza siparişi yok.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs font-bold text-zinc-500 text-left">
                                <tr><th className="px-4 py-2.5">İşletme</th><th className="px-4 py-2.5 text-right">Sipariş</th><th className="px-4 py-2.5 text-right">Satış</th><th className="px-4 py-2.5 text-right">Komisyon</th><th className="px-4 py-2.5 text-right">Satıcı payı</th></tr>
                            </thead>
                            <tbody>
                                {s.breakdown.map(b => (
                                    <tr key={b.id} className="border-t border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-white">
                                        <td className="px-4 py-2.5">{b.name}</td>
                                        <td className="px-4 py-2.5 text-right">{b.orders}</td>
                                        <td className="px-4 py-2.5 text-right">{tl(b.gmv)}</td>
                                        <td className="px-4 py-2.5 text-right text-emerald-600">{tl(b.commission)}</td>
                                        <td className="px-4 py-2.5 text-right">{tl(b.net)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500">{label}</p>
            <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{value}</p>
            <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">{sub}</p>
        </div>
    );
}
