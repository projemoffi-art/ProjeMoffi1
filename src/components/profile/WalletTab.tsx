'use client';

import React from 'react';
import Link from 'next/link';
import { Coins, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyProgress } from '@/context/DailyProgressContext';
import { apiService } from '@/services/apiService';

type Movement = Awaited<ReturnType<typeof apiService.getPawCoinHistory>>[number];

/**
 * PawCoin cüzdanı: bakiye profiles.pati_puan_balance (DailyProgressContext), hareketler point_transactions.
 * Kazanma ve harcama yalnızca sunucu fonksiyonlarıyla olur (8.2); burada sadece gösterilir.
 */
export function WalletTab() {
    const { totalPatiPuan } = useDailyProgress();
    const [items, setItems] = React.useState<Movement[] | null>(null);

    React.useEffect(() => {
        let alive = true;
        apiService.getPawCoinHistory()
            .then(list => { if (alive) setItems(list); })
            .catch(err => { console.error('PawCoin hareketleri okunamadı:', err); if (alive) setItems([]); });
        return () => { alive = false; };
    }, []);

    return (
        <div className="space-y-5 pb-10">
            <div className="rounded-[1.75rem] bg-card border border-card-border p-5">
                <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center"><Coins className="w-5 h-5 text-accent" /></span>
                    <div>
                        <p className="text-[12px] font-black text-secondary">PawCoin bakiyen</p>
                        <p className="text-[28px] font-black text-foreground leading-none mt-1">{totalPatiPuan.toLocaleString('tr-TR')}</p>
                    </div>
                </div>
                <p className="text-[12px] font-semibold text-secondary mt-4 leading-relaxed">
                    Yürüyüş, görev ve günlük hedeflerle kazanılır; Ödül Merkezi&apos;nde ve Moffi AI ek haklarında harcanır.
                </p>
                <Link href="/walk/rewards" className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-foreground/[0.04] text-[13px] font-black text-foreground">
                    Ödül Merkezi <ChevronRight className="w-4 h-4 text-secondary" />
                </Link>
            </div>

            <div>
                <h3 className="px-2 mb-2 text-[14px] font-black text-foreground">Hareketler</h3>
                {items === null ? (
                    <p className="px-2 text-[13px] text-secondary">Yükleniyor…</p>
                ) : items.length === 0 ? (
                    <p className="px-2 text-[13px] text-secondary">Henüz PawCoin hareketin yok.</p>
                ) : (
                    <div className="rounded-[1.5rem] bg-card border border-card-border divide-y divide-card-border overflow-hidden">
                        {items.map(m => {
                            const earn = m.amount >= 0;
                            return (
                                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                                    <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', earn ? 'bg-emerald-500/10 text-emerald-600' : 'bg-foreground/[0.06] text-secondary')}>
                                        {earn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-foreground truncate">{m.reason || (earn ? 'Ödül' : 'Harcama')}</p>
                                        <p className="text-[11px] font-semibold text-secondary">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                    </div>
                                    <span className={cn('text-[14px] font-black shrink-0', earn ? 'text-emerald-600' : 'text-foreground')}>
                                        {earn ? '+' : ''}{m.amount.toLocaleString('tr-TR')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
