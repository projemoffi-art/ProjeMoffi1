"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Wallet, Receipt, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBusinessType } from "@/context/BusinessTypeContext";
import { apiService } from "@/services/apiService";
import { wallParts, todayKey } from "@/lib/appointmentTime";
import { cn } from "@/lib/utils";

// Gelir raporu. Randevu ücretleri Moffi üzerinden tahsil edilmediği için randevu işletmelerinde tutarlar,
// tamamlanan randevuların hizmet kataloğundaki fiyatlarıyla hesaplanan TAHMİNİ gelirdir; mağazalarda ise
// ödemesi alınmış siparişlerdeki bu işletmeye ait ürünlerin gerçek tutarıdır.

type Entry = { id: string; dateKey: string; label: string; sub: string; amount: number | null };

const MONTHS = 6;
const UNPAID_ORDER = ['awaiting_payment', 'pending', 'cancelled', 'failed'];
const VOID_ITEM = ['cancelled', 'refunded'];
const tl = (n: number) => `₺${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;

function serviceNameOf(reason: string | null | undefined) {
    const first = (reason || '').split('\n')[0];
    return first.includes('Randevu tipi:') ? first.split('Randevu tipi:')[1].trim() : first.trim();
}

export default function BusinessFinancePage() {
    const { user } = useAuth();
    const typeConfig = useBusinessType();
    const isOrderFlow = typeConfig.primaryFlow === 'order';
    const [entries, setEntries] = useState<Entry[]>([]);
    const [noShows, setNoShows] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) { setIsLoading(false); return; }
        const load = async () => {
            try {
                if (isOrderFlow) {
                    const orders: any[] = await apiService.getClinicOrders(user.id);
                    setEntries(orders
                        .filter(o => !UNPAID_ORDER.includes(o.status))
                        .map(o => {
                            const items = (o.items || []).filter((i: any) => !VOID_ITEM.includes(i.status));
                            const amount = items.reduce((s: number, i: any) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
                            return {
                                id: o.id,
                                dateKey: String(o.date).slice(0, 10),
                                label: items.map((i: any) => i.product?.name).filter(Boolean).join(', ') || 'Sipariş',
                                sub: o.user?.full_name || 'Müşteri',
                                amount,
                            };
                        })
                        .filter(e => e.amount > 0));
                } else {
                    const [appts, services] = await Promise.all([
                        apiService.getClinicAppointments(user.id),
                        apiService.getClinicServices(user.id),
                    ]);
                    const priceByName = new Map<string, number>();
                    services.forEach((s: any) => { if (s.price != null) priceByName.set(s.service_name, Number(s.price)); });
                    setNoShows(appts.filter((a: any) => a.attendance_status === 'no_show').length);
                    setEntries(appts
                        .filter((a: any) => a.status === 'completed' && a.appointment_date)
                        .map((a: any) => {
                            const name = serviceNameOf(a.reason) || typeConfig.customerFallbackService;
                            return {
                                id: a.id,
                                dateKey: wallParts(a.appointment_date).dateKey,
                                label: name,
                                sub: a.pet?.name || a.guest_pet_name || a.user?.full_name || a.guest_name || 'Müşteri',
                                amount: priceByName.has(name) ? priceByName.get(name)! : null,
                            };
                        }));
                }
            } catch (e) {
                console.error('Gelir verisi yüklenemedi:', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [user?.id, isOrderFlow, typeConfig.customerFallbackService]);

    const report = useMemo(() => {
        const today = todayKey();
        const [y, m] = today.split('-').map(Number);
        const months = Array.from({ length: MONTHS }, (_, i) => {
            const d = new Date(Date.UTC(y, m - 1 - (MONTHS - 1 - i), 1));
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
            return { key, label: d.toLocaleDateString('tr-TR', { month: 'short', timeZone: 'UTC' }), total: 0, count: 0 };
        });
        const byKey = new Map(months.map(mo => [mo.key, mo]));
        entries.forEach(e => {
            const mo = byKey.get(e.dateKey.slice(0, 7));
            if (mo) { mo.count += 1; mo.total += e.amount ?? 0; }
        });
        const thisMonth = months[months.length - 1];
        const lastMonth = months[months.length - 2];
        const priced = entries.filter(e => e.amount != null);
        const unpriced = entries.length - priced.length;
        const avg = priced.length ? priced.reduce((s, e) => s + (e.amount || 0), 0) / priced.length : 0;

        const bySvc = new Map<string, { count: number; total: number }>();
        entries.forEach(e => {
            if (isOrderFlow) return;
            const r = bySvc.get(e.label) || { count: 0, total: 0 };
            r.count += 1; r.total += e.amount ?? 0;
            bySvc.set(e.label, r);
        });
        const topServices = Array.from(bySvc.entries()).sort((a, b) => b[1].total - a[1].total || b[1].count - a[1].count).slice(0, 5);
        const change = lastMonth.total > 0 ? Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100) : null;
        return { months, thisMonth, lastMonth, avg, unpriced, topServices, change, max: Math.max(1, ...months.map(mo => mo.total)) };
    }, [entries, isOrderFlow]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    const recent = [...entries].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 20);

    return (
        <div className="p-4 md:p-8 w-full max-w-5xl mx-auto space-y-6 pb-32">
            <header>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Gelir raporu</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    {isOrderFlow
                        ? 'Ödemesi alınmış siparişlerdeki ürünlerinin tutarı.'
                        : 'Randevu ücretleri işletmende tahsil edilir; tutarlar tamamlanan randevuların hizmet fiyatlarından hesaplanan tahmindir.'}
                </p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat icon={Wallet} label="Bu ay" value={tl(report.thisMonth.total)} hint={report.change != null ? `Geçen aya göre ${report.change > 0 ? '+' : ''}${report.change}%` : undefined} />
                <Stat icon={Calendar} label={isOrderFlow ? 'Bu ay sipariş' : 'Bu ay tamamlanan'} value={String(report.thisMonth.count)} />
                <Stat icon={Receipt} label={isOrderFlow ? 'Ortalama sipariş' : 'Ortalama ziyaret'} value={tl(report.avg)} />
                {isOrderFlow
                    ? <Stat icon={TrendingUp} label="Geçen ay" value={tl(report.lastMonth.total)} />
                    : <Stat icon={TrendingUp} label="Gelmeyen randevu" value={String(noShows)} hint="Toplam" />}
            </div>

            {!isOrderFlow && report.unpriced > 0 && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {report.unpriced} tamamlanan randevunun hizmetinde fiyat yok; bu randevular tutara eklenmedi. Fiyatları Hizmetlerim sayfasından girebilirsin.
                </div>
            )}

            <div className="bg-card rounded-2xl border border-card-border p-5">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-foreground">Aylık gelir</h3>
                    <span className="text-xs font-bold text-zinc-500">Son {MONTHS} ay</span>
                </div>
                <div className="flex items-end gap-3 h-44">
                    {report.months.map((mo, i) => (
                        <div key={mo.key} className="flex-1 h-full flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{mo.total > 0 ? tl(mo.total) : '–'}</span>
                            <div className="w-full flex-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl overflow-hidden flex items-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(mo.total / report.max) * 100}%` }}
                                    transition={{ delay: i * 0.06, duration: 0.4 }}
                                    className={cn("w-full rounded-xl", i === report.months.length - 1 ? "bg-indigo-600" : "bg-indigo-300 dark:bg-indigo-500/50")}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 capitalize">{mo.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={cn("grid gap-6", !isOrderFlow && "lg:grid-cols-3")}>
                {!isOrderFlow && (
                    <div className="bg-card rounded-2xl border border-card-border p-5">
                        <h3 className="font-black text-foreground mb-3">En çok gelir getiren hizmetler</h3>
                        {report.topServices.length === 0 ? (
                            <p className="text-sm text-zinc-500">Henüz tamamlanan randevu yok.</p>
                        ) : (
                            <div className="space-y-3">
                                {report.topServices.map(([name, r]) => (
                                    <div key={name} className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-foreground truncate">{name}</div>
                                            <div className="text-xs text-zinc-500">{r.count} randevu</div>
                                        </div>
                                        <span className="text-sm font-black text-foreground tabular-nums">{tl(r.total)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className={cn("bg-card rounded-2xl border border-card-border overflow-hidden", !isOrderFlow && "lg:col-span-2")}>
                    <div className="px-5 py-4 border-b border-card-border">
                        <h3 className="font-black text-foreground">{isOrderFlow ? 'Son siparişler' : 'Son tamamlanan randevular'}</h3>
                    </div>
                    {recent.length === 0 ? (
                        <div className="p-10 text-center text-sm text-zinc-500">Henüz kayıt yok.</div>
                    ) : (
                        <div className="divide-y divide-card-border">
                            {recent.map(e => (
                                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-foreground truncate">{e.label}</div>
                                        <div className="text-xs text-zinc-500">{e.sub} · {new Date(`${e.dateKey}T00:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
                                    </div>
                                    <span className={cn("text-sm font-black tabular-nums shrink-0", e.amount == null ? "text-zinc-400" : "text-foreground")}>
                                        {e.amount == null ? 'Fiyat yok' : tl(e.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Wallet; label: string; value: string; hint?: string }) {
    return (
        <div className="bg-card rounded-2xl border border-card-border p-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-foreground tabular-nums">{value}</div>
            <div className="text-xs font-bold text-zinc-500 mt-0.5">{label}</div>
            {hint && <div className="text-[11px] font-semibold text-zinc-400 mt-1">{hint}</div>}
        </div>
    );
}
