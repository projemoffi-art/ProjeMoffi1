"use client";

import { useState, useMemo } from "react";
import { MOCK_TRANSACTIONS, MOCK_ORDERS, MOCK_APPLICATIONS } from "@/data/mockBusinessRegistry";
import { cn } from "@/lib/utils";
import {
    Wallet, TrendingUp, TrendingDown, DollarSign, Building2,
    BarChart3, ArrowUpRight, PiggyBank, Receipt, Users, Banknote
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPlatformFinancePage() {
    const allTx = MOCK_TRANSACTIONS;
    const allOrders = MOCK_ORDERS;
    const approvedBiz = MOCK_APPLICATIONS.filter(a => a.status === 'approved');

    const summary = useMemo(() => {
        const totalGMV = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);
        const totalCommission = Math.abs(allTx.filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0));
        const totalPayouts = Math.abs(allTx.filter(t => t.type === 'payout').reduce((s, t) => s + t.amount, 0));
        const totalRefunds = Math.abs(allTx.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0));
        const platformRevenue = totalCommission - totalRefunds * 0.1; // Commission minus refund commissions
        const pendingPayouts = allTx.filter(t => t.type === 'sale' && t.status === 'pending').reduce((s, t) => s + t.amount, 0) * 0.9;
        return { totalGMV, totalCommission, totalPayouts, totalRefunds, platformRevenue, pendingPayouts, activeBiz: approvedBiz.length };
    }, [allTx, allOrders, approvedBiz]);

    // Per-business breakdown
    const businessBreakdown = useMemo(() => {
        const map = new Map<string, { name: string; orders: number; gmv: number; commission: number; payouts: number }>();
        MOCK_APPLICATIONS.filter(a => a.status === 'approved').forEach(a => {
            map.set(a.id, { name: a.businessName, orders: 0, gmv: 0, commission: 0, payouts: 0 });
        });
        allOrders.forEach(o => {
            const biz = map.get(o.businessId);
            if (biz && o.status !== 'cancelled') { biz.orders++; biz.gmv += o.totalAmount; biz.commission += o.commission; }
        });
        allTx.filter(t => t.type === 'payout').forEach(t => {
            const biz = map.get(t.businessId);
            if (biz) biz.payouts += Math.abs(t.amount);
        });
        return Array.from(map.values()).sort((a, b) => b.gmv - a.gmv);
    }, [allOrders, allTx]);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Platform Finans</h1>
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
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Platform Gelir Özeti</h3>
                    <p className="text-xs text-gray-400 mb-6">Komisyon bazlı net gelir</p>
                    <div className="space-y-4">
                        <ProgressRow label="Toplam Komisyon Geliri" value={summary.totalCommission} max={summary.totalGMV} color="bg-green-500" />
                        <ProgressRow label="İade Kayıpları" value={summary.totalRefunds * 0.1} max={summary.totalGMV} color="bg-red-400" />
                        <ProgressRow label="Net Platform Geliri" value={summary.platformRevenue} max={summary.totalGMV} color="bg-indigo-600" />
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktif İşletmeler</span>
                        </div>
                        <div className="text-3xl font-black text-gray-900">{summary.activeBiz}</div>
                        <p className="text-xs text-gray-400 mt-1">Gelir üreten işletme sayısı</p>
                    </div>
                </div>
            </div>

            {/* Per-Business Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">İşletme Bazlı Dağılım</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
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
                                        <span className="font-medium text-gray-900">{biz.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right hidden sm:table-cell font-bold text-gray-700">{biz.orders}</td>
                                <td className="p-4 text-right font-black text-gray-900">₺{biz.gmv.toLocaleString('tr-TR')}</td>
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colors[color])}><Icon className="w-4 h-4" /></div>
                {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
            </div>
            <div className="text-xl font-black text-gray-900">₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
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
                <span className="font-bold text-gray-900">₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} className={cn("h-full rounded-full", color)} />
            </div>
        </div>
    );
}
