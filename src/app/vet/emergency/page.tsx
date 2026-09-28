"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useVet } from "@/hooks/useVet";
import { ClinicCard, FilterChips, useFavoriteClinics } from "@/components/vet/VetShared";

type Chip = 'nearest' | 'open' | 'emergency';

const isEmergencyClinic = (c: any) => (c.features || []).some((f: string) => f.toLowerCase().includes('acil'));

// Referans Ekran 12 — Acil veteriner. Liste gerçek klinik verisinden gelir; "acil servis" etiketi
// işletmenin kendi hizmet kataloğunda "acil" geçen bir hizmet olmasına dayanır.
export default function VetEmergencyPage() {
    const router = useRouter();
    const { allClinics, isLoading, gpsDenied, userProvince, userDistrict } = useVet('vet');
    const { isFavorite, toggleFavorite } = useFavoriteClinics();
    const [chip, setChip] = useState<Chip>('open');

    const list = useMemo(() => {
        let l = [...allClinics];
        if (chip === 'open') l = l.filter(c => c.isOpenNow);
        if (chip === 'emergency') l = l.filter(isEmergencyClinic);
        return l.sort((a, b) => {
            if (a.isOpenNow !== b.isOpenNow) return a.isOpenNow ? -1 : 1;
            return (a.calculated_distance ?? Infinity) - (b.calculated_distance ?? Infinity);
        });
    }, [allClinics, chip]);

    const noLocation = gpsDenied && !userProvince;

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black">Acil veteriner</h1>
            </header>

            <main className="px-4 max-w-2xl mx-auto space-y-4">
                <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm font-black text-red-700 dark:text-red-300">Acil bir durum mu var?</div>
                        <p className="text-[12px] font-semibold text-red-700/80 dark:text-red-300/80 leading-relaxed">
                            Yola çıkmadan önce kliniği ara; açık olduklarını ve seni bekleyebileceklerini teyit et.
                        </p>
                    </div>
                </div>

                <FilterChips<Chip>
                    options={[{ id: 'open', label: 'Şu an açık' }, { id: 'nearest', label: 'En yakın' }, { id: 'emergency', label: 'Acil servis' }]}
                    value={chip}
                    onChange={setChip}
                />

                {!isLoading && userProvince && (
                    <p className="text-[12px] font-semibold text-secondary">{userDistrict ? `${userDistrict}, ` : ''}{userProvince} çevresi</p>
                )}

                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-card border border-card-border animate-pulse" />)}
                    </div>
                ) : noLocation ? (
                    <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
                        <p className="text-sm font-semibold text-secondary mb-4">Yakındaki klinikleri görmek için konum izni ver ya da il/ilçe seç.</p>
                        <Link href="/vet" className="inline-flex h-11 px-5 items-center rounded-xl bg-accent text-white font-black text-sm">Konum seç</Link>
                    </div>
                ) : list.length === 0 ? (
                    <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
                        <p className="text-sm font-semibold text-secondary">
                            {chip === 'open' ? 'Şu an açık görünen bir klinik bulamadık.' : chip === 'emergency' ? 'Acil servis hizmeti listeleyen bir klinik bulamadık.' : 'Bu bölgede kayıtlı klinik bulamadık.'}
                        </p>
                        {chip !== 'nearest' && (
                            <button onClick={() => setChip('nearest')} className="mt-3 text-sm font-black text-accent">Tüm klinikleri göster</button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map((c, i) => (
                            <div key={c.id} className="space-y-2">
                                <ClinicCard
                                    clinic={c}
                                    index={i}
                                    emphasizeDistance
                                    onOpen={() => router.push(`/vet?clinic=${c.id}`)}
                                    isFavorite={isFavorite(c.id)}
                                    onToggleFavorite={() => toggleFavorite(c.id)}
                                />
                                {c.phone && (
                                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-white text-sm font-black">
                                        📞 {c.name} ara
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Link href="/vet/guide/acil-belirtiler" className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-4">
                    <span className="text-2xl">🩹</span>
                    <div className="flex-1">
                        <div className="text-sm font-black text-amber-800 dark:text-amber-200">İlk yardım bilgileri</div>
                        <div className="text-[12px] font-semibold text-amber-800/75 dark:text-amber-200/75">Hangi belirtiler acildir, klinik yolunda ne yapmalı?</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                </Link>
            </main>
        </div>
    );
}
