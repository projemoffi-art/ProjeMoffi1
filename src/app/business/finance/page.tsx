"use client";

import { useState, useMemo, useEffect } from "react";
import { BusinessSidebar } from "@/components/business/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { FinanceTransaction, TransactionType } from "@/types/business";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import {
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Menu, DollarSign, BarChart3, CreditCard, Clock, CheckCircle,
    Download, Calendar, Loader2, Banknote, PiggyBank, Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDragScroll } from "@/hooks/useDragScroll";

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; icon: typeof DollarSign }> = {
    sale: { label: 'Satış', color: 'text-green-600', icon: TrendingUp },
    commission: { label: 'Komisyon', color: 'text-red-600', icon: Receipt },
    payout: { label: 'Ödeme', color: 'text-blue-600', icon: Banknote },
    refund: { label: 'İade', color: 'text-orange-600', icon: TrendingDown },
};

export default function BusinessFinancePage() {
    const { user } = useAuth();
    const filterScroll = useDragScroll();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (user?.id) {
                try {
                    const data = await apiService.getClinicTransactions(user.id);
                    setTransactions(data);
                } catch (e) {
                    console.error("Failed to fetch transactions:", e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [user?.id]);

    const filteredTransactions = transactions;

    const orders: any[] = []; // Phase 3: real orders will come later

    const filtered = useMemo(() => {
        let result = [...filteredTransactions];
        if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTransactions, typeFilter]);

    // Financial calculations
    const summary = useMemo(() => {
        const totalSales = filteredTransactions.filter(t => t.type === 'sale' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
        const totalCommission = Math.abs(filteredTransactions.filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0));
        const totalPayouts = Math.abs(filteredTransactions.filter(t => t.type === 'payout' && t.status === 'completed').reduce((s, t) => s + t.amount, 0));
        const totalRefunds = Math.abs(filteredTransactions.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0));
        const pendingRevenue = filteredTransactions.filter(t => t.type === 'sale' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
        const netEarnings = totalSales - totalCommission - totalRefunds;
        const availableBalance = netEarnings - totalPayouts;

        return { totalSales, totalCommission, totalPayouts, totalRefunds, pendingRevenue, netEarnings, availableBalance };
    }, [filteredTransactions]);

    // Monthly revenue chart data (simple bar chart)
    const monthlyData = [
        { month: 'Oca', amount: 2100 },
        { month: 'Şub', amount: 3450 },
        { month: 'Mar', amount: 1800 },
        { month: 'Nis', amount: 4200 },
        { month: 'May', amount: 3100 },
        { month: 'Haz', amount: 2800 },
    ];
    const maxMonthly = Math.max(...monthlyData.map(d => d.amount));

    return (
        <div className="flex min-h-screen font-sans">
            <BusinessSidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 p-4 md:p-8 md:pl-80 transition-all duration-300 w-full">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 rounded-xl bg-card border border-card-border/50 flex items-center justify-center md:hidden">
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Finans</h1>
                            <p className="text-sm text-gray-500">Gelir, komisyon ve ödeme takibi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start"
                    >
                        <Banknote className="w-4 h-4" /> Ödeme Talebi
                    </button>
                </header>

                {/* Revenue Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <RevenueCard icon={TrendingUp} label="Toplam Satış" value={summary.totalSales} color="green" trend="+12%" />
                    <RevenueCard icon={Receipt} label="Komisyon" value={summary.totalCommission} color="red" />
                    <RevenueCard icon={PiggyBank} label="Net Kazanç" value={summary.netEarnings} color="indigo" highlight />
                    <RevenueCard icon={Wallet} label="Çekilebilir" value={summary.availableBalance} color="emerald" highlight />
                </div>

                {/* Charts + Pending */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Monthly Chart */}
                    <div className="lg:col-span-2 bg-card rounded-2xl border border-card-border shadow-moffi-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-foreground">Aylık Gelir</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Son 6 ay</p>
                            </div>
                            <div className="bg-gray-50 p-1 rounded-xl flex">
                                <button className="px-3 py-1 bg-card rounded-lg text-xs font-bold text-foreground shadow-moffi-card border border-card-border/50">Aylık</button>
                                <button className="px-3 py-1 text-xs font-bold text-gray-500 dark:text-gray-400">Haftalık</button>
                            </div>
                        </div>
                        <div className="flex items-end gap-3 h-40">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">₺{(d.amount / 1000).toFixed(1)}K</span>
                                    <div className="w-full bg-gray-100 rounded-xl overflow-hidden" style={{ height: '100%' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(d.amount / maxMonthly) * 100}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className={cn("w-full rounded-xl bg-gradient-to-t mt-auto", i === monthlyData.length - 1 ? "from-indigo-600 to-purple-500" : "from-indigo-200 to-indigo-300")}
                                            style={{ marginTop: 'auto' }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending + Commissions */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                            <Clock className="w-8 h-8 text-black/70 dark:text-white/70 mb-3" />
                            <div className="text-2xl font-black">₺{summary.pendingRevenue.toLocaleString('tr-TR')}</div>
                            <div className="text-xs text-black/80 dark:text-white/80 font-medium mt-1">Bekleyen Gelir</div>
                            <p className="text-[10px] text-black/60 dark:text-white/60 mt-2">Teslim edilmemiş siparişlerden</p>
                        </div>
                        <div className="bg-card rounded-2xl border border-card-border shadow-moffi-card p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Komisyon Oranı</span>
                            </div>
                            <div className="text-3xl font-black text-foreground">%10</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform standart oran</p>
                            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[10%] bg-red-400 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="mb-8">
                    <div 
                        ref={filterScroll.ref}
                        onMouseDown={filterScroll.onMouseDown}
                        onMouseLeave={filterScroll.onMouseLeave}
                        onMouseUp={filterScroll.onMouseUp}
                        onMouseMove={filterScroll.onMouseMove}
                        className="flex gap-2 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none mb-4"
                    >
                        {(['all', 'sale', 'commission', 'payout', 'refund'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition",
                                    typeFilter === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-card border border-card-border text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {t === 'all' ? 'Tümü' : TYPE_CONFIG[t].label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-card dark:bg-[#121212] rounded-[2rem] border border-card-border shadow-moffi-card overflow-hidden">
                        <div className="p-6 border-b border-card-border flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <h3 className="font-bold text-foreground">İşlem Geçmişi</h3>
                        </div>

                        <div className="divide-y divide-card-border">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">İşlemler yükleniyor...</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">Bu kategoride işlem bulunamadı.</div>
                            ) : (
                                filtered.map(tx => {
                                    const conf = TYPE_CONFIG[tx.type as TransactionType] || TYPE_CONFIG['sale'];
                                    const Icon = conf.icon;
                                    const isPositive = tx.type === 'sale' || tx.type === 'payout';
                                    return (
                                        <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                    tx.type === 'sale' ? 'bg-green-100 text-green-600' :
                                                    tx.type === 'commission' ? 'bg-red-100 text-red-600' :
                                                    tx.type === 'refund' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground text-sm">{tx.description}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {new Date(tx.date).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className={cn("font-black text-sm", isPositive ? "text-green-600" : "text-red-600")}>
                                                    {isPositive ? '+' : '-'}₺{Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                </div>
                                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                    tx.status === 'completed' ? "text-green-600 bg-green-50" :
                                                    tx.status === 'pending' ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-50"
                                                )}>
                                                    {tx.status === 'completed' ? 'Tamamlandı' : tx.status === 'pending' ? 'Bekliyor' : 'İptal'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Payout Modal */}
            <AnimatePresence>
                {showPayoutModal && <PayoutModal available={summary.availableBalance} onClose={() => setShowPayoutModal(false)} />}
            </AnimatePresence>
        </div>
    );
}

// ==================
// Sub Components
// ==================

function RevenueCard({ icon: Icon, label, value, color, trend, highlight }: {
    icon: typeof TrendingUp; label: string; value: number; color: string; trend?: string; highlight?: boolean
}) {
    const colors: Record<string, string> = {
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className={cn("rounded-2xl border p-5 transition-all", highlight ? "bg-card shadow-lg border-card-border" : "bg-card shadow-moffi-card border-card-border")}>
            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colors[color])}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />{trend}
                    </span>
                )}
            </div>
            <div className={cn("text-xl font-black tracking-tight", highlight ? "text-foreground" : "text-foreground")}>₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

function PayoutModal({ available, onClose }: { available: number; onClose: () => void }) {
    const [amount, setAmount] = useState(available.toFixed(2));
    const [requesting, setRequesting] = useState(false);
    const [done, setDone] = useState(false);

    const handleRequest = () => {
        setRequesting(true);
        setTimeout(() => { setRequesting(false); setDone(true); setTimeout(onClose, 1500); }, 1500);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                {done ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-lg font-black text-foreground">Talep Gönderildi!</h3>
                        <p className="text-sm text-gray-500 mt-1">Admin onayından sonra hesabınıza aktarılacaktır.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg font-black text-foreground mb-1">Ödeme Talebi</h2>
                        <p className="text-sm text-gray-500 mb-6">Çekilebilir bakiyeniz: <strong className="text-green-600">₺{available.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></p>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Çekmek İstediğiniz Tutar (₺)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border border-card-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-green-200" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 px-5 py-3 rounded-xl border border-card-border text-sm font-bold text-gray-600 hover:bg-gray-50">İptal</button>
                            <button onClick={handleRequest} disabled={requesting || Number(amount) <= 0 || Number(amount) > available} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                                {requesting ? 'İşleniyor...' : 'Talep Gönder'}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
