"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { haptics } from "@/lib/haptics";

// Faz 18 (Görev sistemi denetimi): "Meydan Okumalar" — Faz 11'de referans
// görsel elde değilken Faz 18'e ertelenmişti (bkz. CLAUDE.md 8.0). Görsel geri
// gelince, referansın 3 kartının da (aylık toplam mesafe / haftalık farklı
// yer / kalıcı farklı bölge) tam bir coğrafi kümeleme altyapısı olmadan,
// gerçek walkHistory GPS verisinden hesaplanabildiği görüldü — bkz.
// QuestEngineContext.tsx'teki `challenges` (haversine tabanlı basit kümeleme).
// "Yaklaşan" sekmesi bilerek boş: gerçek bir gelecek-meydan-okuma kuyruğu
// sistemi yok, uydurma bir "yakında" kartı eklenmedi.

type TabKey = 'active' | 'upcoming' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'active', label: 'Aktif' },
    { key: 'upcoming', label: 'Yaklaşan' },
    { key: 'completed', label: 'Tamamlanan' },
];

export default function ChallengesPage() {
    const router = useRouter();
    const { challenges } = useQuestEngine();
    const [tab, setTab] = useState<TabKey>('active');

    const filtered = challenges.filter(c => {
        if (tab === 'active') return c.status === 'active';
        if (tab === 'completed') return c.status === 'completed';
        return false; // 'upcoming' - gerçek bir kuyruk yok, bkz. üst not
    });

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground font-sans">Meydan Okumalar</h1>
                    <div className="w-10" />
                </div>

                <div className="flex gap-1.5">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { haptics.tap(); setTab(t.key); }}
                            className={cn(
                                "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-0 cursor-pointer active:scale-95",
                                tab === t.key ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3.5">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <span className="text-2xl block mb-2">{tab === 'completed' ? '🏔️' : '🌱'}</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            {tab === 'upcoming'
                                ? 'Şimdilik burada bir şey yok, yakında yeni meydan okumalar geliyor!'
                                : tab === 'completed'
                                ? 'Henüz tamamlanmış bir meydan okuman yok — Aktif sekmesinden başlayabilirsin.'
                                : 'Şu an aktif bir meydan okuma yok.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((c, i) => {
                        const percent = Math.round((c.current / c.target) * 100);
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.06 }}
                                className={cn(
                                    "bg-card rounded-2xl p-4 border shadow-moffi-card",
                                    c.status === 'completed' ? "border-emerald-200 dark:border-emerald-500/20" : "border-card-border"
                                )}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl leading-none">{c.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[13px] font-black text-foreground leading-tight">{c.title}</h3>
                                        <p className="text-[10.5px] font-bold text-slate-400 mt-0.5 leading-snug">{c.description}</p>
                                    </div>
                                    {/* Ekran 11: her kartın sağında gerçek bir ödül etiketi */}
                                    <span className="shrink-0 text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                                        {c.rewardLabel}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(3, percent)}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 + 0.1 }}
                                        className={cn("h-full rounded-full", c.status === 'completed' ? "bg-emerald-500" : "bg-orange-500")}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-slate-400">
                                    {c.status === 'completed' ? '🎉 Tamamlandı!' : `${c.current.toFixed(c.unit === 'km' ? 1 : 0)}/${c.target} ${c.unit}`}
                                </span>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
