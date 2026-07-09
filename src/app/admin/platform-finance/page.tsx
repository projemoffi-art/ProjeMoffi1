"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    Wallet, TrendingUp, TrendingDown, DollarSign, Building2,
    BarChart3, ArrowUpRight, PiggyBank, Receipt, Users, Banknote
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPlatformFinancePage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [activeBusinesses, setActiveBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinanceData = async () => {
            try {
                // Fetch orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .order('created_at', { ascending: false });
                
                // Fetch approved businesses
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('kybStatus', 'approved');

                setOrders(ordersData || []);
                setActiveBusinesses(profilesData || []);
            } catch (err) {
                console.error("Error fetching finance data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinanceData();
    }, []);

    const summary = useMemo(() => {
        const totalGMV = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        // Varsayılan hesaplamalar (gerçek transaction tablosu gelene kadar)
        const totalCommission = totalGMV * 0.10; // %10 komisyon varsayımı
        const totalRefunds = orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const platformRevenue = totalCommission; 
        const totalPayouts = totalGMV - totalCommission; 
        const pendingPayouts = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) * 0.9;
        
        return { 
            totalGMV, 
            totalCommission, 
            totalPayouts, 
            totalRefunds, 
            platformRevenue, 
            pendingPayouts, 
            activeBiz: activeBusinesses.length 
        };
    }, [orders, activeBusinesses]);

    // Per-business breakdown (orders tablosunda işletme id yoksa genel gösteriyoruz, varsa eşleştirilebilir)
    const businessBreakdown = useMemo(() => {
        const map = new Map<string, { name: string; orders: number; gmv: number; commission: number; payouts: number }>();
        activeBusinesses.forEach(biz => {
            map.set(biz.id, { name: biz.username || biz.email || 'İşletme', orders: 0, gmv: 0, commission: 0, payouts: 0 });
        });
        
        // Şimdilik işletme bağlantısı olmadığı için siparişleri genel gösteriyoruz veya rastgele atayabiliriz.
        // Gerçek implementasyonda order_items içindeki product'ın satıcısına göre dağıtılmalı.
        return Array.from(map.values()).sort((a, b) => b.gmv - a.gmv);
    }, [activeBusinesses, orders]);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Platform Finans</h1>
                <p className="text-sm text-gray-500 mt-1">Platform genelinde gelir, komisyon ve ödeme durumu</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <BigStat icon={DollarSign} label="Toplam GMV" value={summary.totalGMV} color="indigo" />
                <BigStat icon={Receipt} label="Platform Komisyon" value={summary.totalCommission} color="green" trend="+18%" />
                <BigStat icon={Banknote} label="Ödenen" value={summary.totalPayouts} color="blue" />
                <BigStat icon={TrendingDown} label="İadeler" value={summary.totalRefunds} color="red" />
            </div>

            {/* Revenue + Active Businesses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-card rounded-2xl border border-card-border shadow-moffi-card p-6">
                    <h3 className="font-bold text-foreground mb-1">Platform Gelir Özeti</h3>
                    <p className="text-xs text-gray-400 mb-6">Komisyon bazlı net gelir</p>
                    <div className="space-y-4">
                        <ProgressRow label="Toplam Komisyon Geliri" value={summary.totalCommission} max={summary.totalGMV} color="bg-green-500" />
                        <ProgressRow label="İade Kayıpları" value={summary.totalRefunds * 0.1} max={summary.totalGMV} color="bg-red-400" />
                        <ProgressRow label="Net Platform Geliri" value={summary.platformRevenue} max={summary.totalGMV} color="bg-indigo-600" />
                    </div>
                    <div className="mt-6 pt-4 border-t border-card-border flex justify-between items-center">
                        <span className="text-sm text-gray-500">Bekleyen İşletme Ödemeleri</span>
                        <span className="text-lg font-black text-amber-600">₺{summary.pendingPayouts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                        <PiggyBank className="w-8 h-8 text-white/60 mb-3" />
                        <div className="text-3xl font-black">₺{summary.platformRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-xs text-white/70 font-medium mt-1">Net Platform Geliri</div>
                        <div className="mt-4 flex items-center gap-1 text-[10px] text-white/80 bg-white/10 rounded-lg px-2 py-1 w-fit">
                            <ArrowUpRight className="w-3 h-3" /> Geçen aya göre +18%
                        </div>
                    </div>
                    <div className="bg-card rounded-2xl border border-card-border shadow-moffi-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktif İşletmeler</span>
                        </div>
                        <div className="text-3xl font-black text-foreground">{summary.activeBiz}</div>
                        <p className="text-xs text-gray-400 mt-1">Gelir üreten işletme sayısı</p>
                    </div>
                </div>
            </div>

            {/* Per-Business Table */}
            <div className="bg-card rounded-2xl border border-card-border shadow-moffi-card overflow-hidden">
                <div className="p-5 border-b border-card-border">
                    <h3 className="font-bold text-foreground">İşletme Bazlı Dağılım</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-card-border bg-gray-50/50">
                            <th className="text-left p-4 font-bold text-gray-500 text-xs uppercase">İşletme</th>
                            <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase hidden sm:table-cell">Sipariş</th>
                            <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase">GMV</th>
                            <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase hidden md:table-cell">Komisyon</th>
                            <th className="text-right p-4 font-bold text-gray-500 text-xs uppercase hidden lg:table-cell">Ödenen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {businessBreakdown.map((biz, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">{biz.name.charAt(0)}</div>
                                        <span className="font-medium text-foreground">{biz.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right hidden sm:table-cell font-bold text-foreground">{biz.orders}</td>
                                <td className="p-4 text-right font-black text-foreground">₺{biz.gmv.toLocaleString('tr-TR')}</td>
                                <td className="p-4 text-right hidden md:table-cell font-bold text-green-600">₺{biz.commission.toFixed(2)}</td>
                                <td className="p-4 text-right hidden lg:table-cell font-bold text-blue-600">₺{biz.payouts.toLocaleString('tr-TR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BigStat({ icon: Icon, label, value, color, trend }: { icon: typeof DollarSign; label: string; value: number; color: string; trend?: string }) {
    const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600' };
    return (
        <div className="bg-card rounded-2xl border border-card-border p-5 shadow-moffi-card">
            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colors[color])}><Icon className="w-4 h-4" /></div>
                {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
            </div>
            <div className="text-xl font-black text-foreground">₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

function ProgressRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className="font-bold text-foreground">₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} className={cn("h-full rounded-full", color)} />
            </div>
        </div>
    );
}
