"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart } from "lucide-react";
import { apiService } from "@/services/apiService";
import { ClinicCard, useFavoriteClinics } from "@/components/vet/VetShared";

// Referans Ekran 11 — Favori kliniklerim (favorite_clinics tablosu).
export default function VetFavoritesPage() {
    const router = useRouter();
    const { favoriteIds, isFavorite, toggleFavorite, loaded } = useFavoriteClinics();
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sadece ilk yüklemede klinikleri çek; kalp kapatılınca kart listeden anında düşsün diye
    // aşağıda favoriteIds ile süzülüyor (yeniden sorgu yok).
    useEffect(() => {
        if (!loaded) return;
        const ids = Array.from(favoriteIds);
        if (ids.length === 0) { setClinics([]); setLoading(false); return; }
        apiService.getClinicsByIds(ids)
            .then(setClinics)
            .catch(() => setClinics([]))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded]);

    const visible = useMemo(() => clinics.filter(c => favoriteIds.has(c.id)), [clinics, favoriteIds]);

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black">Favorilerim</h1>
            </header>

            <main className="px-4 max-w-2xl mx-auto">
                {loading || !loaded ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-card border border-card-border animate-pulse" />)}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-7 h-7 text-accent" />
                        </div>
                        <h2 className="text-lg font-black mb-1">Henüz favori kliniğin yok</h2>
                        <p className="text-sm font-semibold text-secondary mb-5 max-w-xs mx-auto">Klinik kartlarındaki kalbe dokunarak sık gittiğin yerleri buraya ekleyebilirsin.</p>
                        <Link href="/vet" className="inline-flex h-11 px-5 items-center rounded-xl bg-accent text-white font-black text-sm">Veteriner bul</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map((c, i) => (
                            <ClinicCard
                                key={c.id}
                                clinic={c}
                                index={i}
                                onOpen={() => router.push(`/vet?clinic=${c.id}`)}
                                isFavorite={isFavorite(c.id)}
                                onToggleFavorite={() => toggleFavorite(c.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
