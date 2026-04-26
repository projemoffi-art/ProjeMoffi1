"use client";

import { useState } from "react";
import { ArrowLeft, Plus, MoreHorizontal, Wallet, CreditCard, TrendingUp, TrendingDown, ShoppingBag, Coins, Gift, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { MoffiAssistantCard } from "@/components/wallet/MoffiAssistantCard";
import { ExpenseChart } from "@/components/wallet/ExpenseChart";
import { MOCK_TRANSACTIONS, BUDGET_STATUS, COIN_STATS, COIN_HISTORY, CoinTransaction } from "@/data/mockWallet";
import { cn } from "@/lib/utils";

export default function WalletPage() {
    const router = useRouter();
    const [activeWallet, setActiveWallet] = useState<'fiat' | 'coin'>('fiat');

    return (
        <div className="min-h-screen bg-background dark:bg-[background] font-sans pb-24">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 dark:bg-[background]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-card/5 flex items-center justify-center text-gray-700 dark:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-black text-gray-900 dark:text-white">Cüzdan</h1>
                <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-card/5 flex items-center justify-center text-gray-700 dark:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </header>

            <main className="p-6 space-y-6">

                {/* 1. Assistant (Always Visible) */}
                <MoffiAssistantCard />

                {/* 2. Wallet Selector (Horizontal Scroll / Toggle) */}
                <div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                        {/* FIAT CARD */}
                        <div
                            onClick={() => setActiveWallet('fiat')}
                            className={cn("snap-center shrink-0 w-[85%] relative h-48 rounded-[2rem] p-6 overflow-hidden transition-all duration-300 group shadow-xl cursor-pointer border-2",
                                activeWallet === 'fiat' ? "border-[brand-purple] scale-100 opacity-100 shadow-[brand-purple]/20" : "border-transparent scale-95 opacity-60 bg-gray-200 dark:bg-card/5"
                            )}
                        >
                            {/* Card Look */}
                            <div className={cn("absolute inset-0 bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 transition-opacity", activeWallet === 'fiat' ? 'opacity-100' : 'opacity-0')} />
                            <div className={cn("absolute inset-0 bg-gray-400 opacity-100", activeWallet === 'fiat' ? 'hidden' : 'block')} /> {/* Deactive state */}

                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

                            <div className="relative z-10 flex flex-col justify-between h-full text-white dark:text-black">
                                <div className="flex justify-between items-start">
                                    <Wallet className="w-6 h-6 opacity-80" />
                                    <div className="px-2 py-0.5 bg-card/10 dark:bg-black/10 backdrop-blur rounded-full text-[8px] font-bold tracking-widest uppercase border border-white/10">
                                        Moffi Bank
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium opacity-60 mb-1">TR Bakiye</div>
                                    <div className="text-3xl font-black tracking-tight">₺12,450.00</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs font-medium tracking-widest font-mono opacity-60">**** 4291</div>
                                    <div className="flex -space-x-1">
                                        <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
                                        <div className="w-6 h-6 rounded-full bg-orange-500 opacity-80" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COIN CARD */}
                        <div
                            onClick={() => setActiveWallet('coin')}
                            className={cn("snap-center shrink-0 w-[85%] relative h-48 rounded-[2rem] p-6 overflow-hidden transition-all duration-300 group shadow-xl cursor-pointer border-2",
                                activeWallet === 'coin' ? "border-yellow-400 scale-100 opacity-100 shadow-yellow-500/20" : "border-transparent scale-95 opacity-60 bg-gray-200 dark:bg-card/5"
                            )}
                        >
                            <div className={cn("absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 transition-opacity", activeWallet === 'coin' ? 'opacity-100' : 'opacity-0')} />
                            <div className={cn("absolute inset-0 bg-gray-400 opacity-100", activeWallet === 'coin' ? 'hidden' : 'block')} />

                            <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                <div className="flex justify-between items-start">
                                    <Coins className="w-6 h-6 opacity-90" />
                                    <div className="px-2 py-0.5 bg-black/10 backdrop-blur rounded-full text-[8px] font-bold tracking-widest uppercase border border-white/10">
                                        Moffi Rewards
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium opacity-80 mb-1">Moffi Coin</div>
                                    <div className="text-3xl font-black tracking-tight">{COIN_STATS.balance} PC</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs font-medium font-mono opacity-80 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Son kullanma: 12 Ay
                                    </div>
                                    <Gift className="w-6 h-6 opacity-80" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mt-2">
                        <div className={cn("w-2 h-2 rounded-full transition-colors", activeWallet === 'fiat' ? "bg-gray-800 dark:bg-card" : "bg-gray-300 dark:bg-card/20")} />
                        <div className={cn("w-2 h-2 rounded-full transition-colors", activeWallet === 'coin' ? "bg-yellow-400" : "bg-gray-300 dark:bg-card/20")} />
                    </div>
                </div>


                {/* CONTENT SWITCHER */}

                {/* === FIAT WALLET CONTENT === */}
                {activeWallet === 'fiat' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        {/* Monthly Overview */}
                        <div className="bg-card dark:bg-[card] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-white/5">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Aylık Harcama</h2>
                            <div className="flex items-center gap-6">
                                <div className="w-1/2">
                                    <ExpenseChart />
                                </div>
                                <div className="w-1/2 space-y-4">
                                    {Object.entries(BUDGET_STATUS.categories).map(([key, cat]) => (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-gray-500">{cat.name}</span>
                                                <span className={cn(cat.spent > cat.limit ? "text-red-500" : "text-gray-900 dark:text-white")}>
                                                    {Math.round((cat.spent / cat.limit) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-card/10 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", cat.spent > cat.limit ? "bg-red-500" : "bg-gray-900 dark:bg-card")}
                                                    style={{ width: `${Math.min((cat.spent / cat.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Transactions */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">İşlem Geçmişi</h2>
                                <button className="text-xs font-bold text-gray-400">Tümünü Gör</button>
                            </div>
                            <div className="space-y-4">
                                {MOCK_TRANSACTIONS.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-card dark:bg-[card] rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-background dark:bg-card/5 flex items-center justify-center text-2xl">
                                                {t.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t.title}</h3>
                                                <p className="text-xs text-gray-400 font-medium">{t.merchant} • {new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-gray-900 dark:text-white">-₺{t.amount}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">{t.category}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* === COIN WALLET CONTENT === */}
                {activeWallet === 'coin' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-3xl border border-green-100 dark:border-green-900/20 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp className="w-12 h-12 text-green-600" /></div>
                                <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase tracking-wide">Toplam Kazanılan</div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{COIN_STATS.totalEarned}</div>
                                <div className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-md inline-block font-bold">
                                    +{COIN_STATS.thisMonthEarned} bu ay
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingDown className="w-12 h-12 text-red-500" /></div>
                                <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 uppercase tracking-wide">Toplam Harcanan</div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{COIN_STATS.totalSpent}</div>
                                <div className="text-[10px] bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-md inline-block font-bold">
                                    -{COIN_STATS.thisMonthSpent} bu ay
                                </div>
                            </div>
                        </div>

                        {/* History */}
                        <div className="bg-card dark:bg-[card] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" /> Coin Geçmişi
                                </h3>
                                <button className="w-8 h-8 rounded-full bg-background dark:bg-card/5 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-8 pl-6 py-2">
                                {COIN_HISTORY.map((t) => (
                                    <div key={t.id} className="relative">
                                        {/* Dot */}
                                        <div className={cn("absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white dark:border-[card] shadow-sm",
                                            t.type === 'earn' ? "bg-green-500" : "bg-red-500"
                                        )} />

                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">{t.title}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{t.source} • {t.date}</p>
                                            </div>
                                            <div className={cn("text-sm font-black", t.type === 'earn' ? "text-green-500" : "text-red-500")}>
                                                {t.type === 'earn' ? '+' : '-'}{t.amount} PC
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button className="w-14 h-14 bg-black dark:bg-card text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
