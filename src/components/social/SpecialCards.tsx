'use client';

// Referans Ekran 2 — Akışta özel içerik kartları: yakındaki kayıp ilanı ve yuva arayan dost.
// Sadece gerçek, yayındaki ilanlar; uydurma kart yok.

import React from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { distanceText } from '@/lib/geo';
import { genderLabel } from '@/lib/petIdentity';
import { listingTitle, relativeTime } from '@/components/lost/LostUI';
import { SPECIES_LABEL, type LostListing } from '@/services/lostService';
import { listingFacts } from '@/components/adoption/AdoptionUI';
import type { AdoptionListing } from '@/services/adoptionService';

export function LostFeedCard({ listing, km }: { listing: LostListing; km: number | null }) {
    const lost = listing.kind === 'lost';
    return (
        <div className="mx-4 my-3 rounded-3xl border border-accent/30 bg-accent/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3">
                <span className="inline-flex items-center gap-2 text-sm font-black text-accent">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center">!</span>
                    {lost ? 'Acil Kayıp!' : 'Sahibini arıyor'}
                </span>
                <span className="text-[11px] font-semibold text-secondary">{relativeTime(listing.createdAt)}</span>
            </div>
            <div className="flex gap-3 p-4">
                {listing.photos[0] && <img loading="lazy" decoding="async" src={listing.photos[0]} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-lg font-black truncate">{listingTitle(listing)}</div>
                    <div className="text-xs font-semibold text-secondary truncate">
                        {[listing.ageText, genderLabel(listing.gender), listing.breed || SPECIES_LABEL[listing.species]].filter(Boolean).join(' · ')}
                    </div>
                    <div className="text-xs font-semibold text-secondary truncate inline-flex items-center gap-1 max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{[listing.locationText, distanceText(km)].filter(Boolean).join(' · ')}</span>
                    </div>
                </div>
            </div>
            <div className="px-4 pb-4">
                <Link href={`/kayip/${listing.id}`} className="w-full h-11 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">Detayı gör</Link>
            </div>
        </div>
    );
}

export function AdoptionFeedCard({ listing, km }: { listing: AdoptionListing; km: number | null }) {
    return (
        <Link href={`/sahiplendirme/${listing.id}`} className="mx-4 my-3 flex gap-3 rounded-3xl border border-card-border bg-card p-3">
            {listing.photos[0] && <img loading="lazy" decoding="async" src={listing.photos[0]} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0" />}
            <div className="flex-1 min-w-0 space-y-1 py-0.5">
                <div className="text-[11px] font-black text-accent">Yuva arıyor 🏡</div>
                <div className="text-base font-black truncate">{listing.petName}</div>
                <div className="text-xs font-semibold text-secondary truncate">{listingFacts(listing)}</div>
                <div className="text-xs font-semibold text-secondary truncate">{[listing.locationText, distanceText(km)].filter(Boolean).join(' · ')}</div>
                <div className="text-xs font-black text-accent">İlanı gör →</div>
            </div>
        </Link>
    );
}
