"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VET_GUIDE, type GuideArticle } from "@/data/vetGuide";
import { FilterChips } from "@/components/vet/VetShared";

type Cat = 'all' | GuideArticle['category'];

// Referans Ekran 14 — Veteriner rehberi.
export default function VetGuidePage() {
    const router = useRouter();
    const [cat, setCat] = useState<Cat>('all');
    const list = cat === 'all' ? VET_GUIDE : VET_GUIDE.filter(a => a.category === cat);

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black">Veteriner rehberi</h1>
            </header>

            <main className="px-4 max-w-2xl mx-auto space-y-4">
                <FilterChips<Cat>
                    options={[{ id: 'all', label: 'Tümü' }, { id: 'Acil durum', label: 'Acil durum' }, { id: 'Koruyucu bakım', label: 'Koruyucu bakım' }, { id: 'Ziyaret', label: 'Ziyaret' }]}
                    value={cat}
                    onChange={setCat}
                />

                <div className="space-y-3">
                    {list.map(a => (
                        <Link key={a.slug} href={`/vet/guide/${a.slug}`} className="flex items-center gap-3.5 bg-card border border-card-border rounded-2xl p-4 hover:border-accent/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{a.emoji}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-accent">{a.category} · {a.readMinutes} dk</div>
                                <div className="text-sm font-black leading-snug">{a.title}</div>
                                <div className="text-[12px] font-semibold text-secondary line-clamp-2">{a.summary}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                        </Link>
                    ))}
                </div>

                <p className="text-[11px] font-semibold text-secondary text-center px-4 pt-2">
                    Bu rehber genel bilgi amaçlıdır, veteriner muayenesinin yerini tutmaz.
                </p>
            </main>
        </div>
    );
}
