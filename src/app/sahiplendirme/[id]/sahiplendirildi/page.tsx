'use client';

// Referans Ekran 14 — Sahiplendirildi. İlan kapanmış olarak kalır; pasaport devri teklif edildiyse yeni ailenin
// onayını bekler (dürüst ifade: "güncellendi" değil, onaylayınca geçer). "Keşfet'te paylaş" isteğe bağlıdır.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ErrorText, LoadingBlocks, PrimaryButton, Sheet, TextArea } from '@/components/health/HealthUI';
import { adoptionService, type AdoptionListing } from '@/services/adoptionService';
import { socialService } from '@/services/socialService';
import { showToast } from '@/lib/utils';

export default function AdoptedPage() {
    return <Suspense fallback={null}><Adopted /></Suspense>;
}

function Adopted() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const params = useSearchParams();
    const transferOffered = params.get('devir') === '1';
    const [listing, setListing] = useState<AdoptionListing | null | undefined>(undefined);
    const [shareOpen, setShareOpen] = useState(false);
    const [caption, setCaption] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adoptionService.get(id).then(l => {
            setListing(l);
            if (l) setCaption(`${l.petName} yeni yuvasına kavuştu! 🧡 Bu güzel yolculukta yanımızda olan herkese teşekkürler.`);
        }).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={2} /></main>;
    if (!listing || !listing.isMine || listing.status !== 'adopted') {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu sayfa sadece sahiplendirilen ilanın sahibine açık</h1>
                <Link href="/sahiplendirme" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Sahiplendirme'ye dön</Link>
            </main>
        );
    }

    const post = async () => {
        setError(null); setPosting(true);
        try {
            const postId = await socialService.create({
                content: caption.trim(), media: [listing.photos[0]], taggedPetIds: [],
                locationText: null, lat: null, lng: null, topic: 'daily', showOnProfile: true, commentPrivacy: 'everyone',
            });
            showToast("Keşfet'te paylaşıldı.", 'CheckCircle2', 'text-emerald-500 font-bold');
            setShareOpen(false);
            router.push(`/community/gonderi/${postId}`);
        } catch (e: any) {
            setError(e?.message || 'Paylaşılamadı.');
        } finally {
            setPosting(false);
        }
    };

    const checks = [
        'İlan kapatıldı; açık başvurulara haber verildi.',
        transferOffered ? 'Pasaport devri gönderildi; yeni ailesi onaylayınca pasaport ona geçer.' : null,
        "İstersen Keşfet'te paylaşabilirsin.",
    ].filter(Boolean) as string[];

    return (
        <main className="max-w-2xl mx-auto px-4 pt-[calc(40px+env(safe-area-inset-top,0px))] pb-10 space-y-5 text-center">
            {listing.photos[0] && (
                <div className="relative w-40 h-40 mx-auto">
                    <img src={listing.photos[0]} alt="" className="w-40 h-40 rounded-full object-cover border-4 border-card" />
                    <span className="absolute -top-2 -right-1 text-3xl" aria-hidden>❤️</span>
                </div>
            )}
            <div className="space-y-2">
                <h1 className="text-2xl font-black">{listing.petName} yeni yuvasına kavuştu! 🧡</h1>
                <p className="text-sm font-semibold text-secondary">Bu güzel yolculukta yanında olduğumuz için teşekkür ederiz.</p>
            </div>
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2 text-left">
                {checks.map(c => (
                    <div key={c} className="flex items-start gap-2 text-sm font-semibold"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />{c}</div>
                ))}
            </div>
            <div className="space-y-2.5">
                {listing.photos[0] && <PrimaryButton onClick={() => setShareOpen(true)}>Keşfet'te paylaş</PrimaryButton>}
                <Link href="/sahiplendirme" className="w-full h-12 rounded-2xl border border-card-border bg-card font-black text-sm flex items-center justify-center">Tamam</Link>
            </div>

            <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Keşfet'te paylaş">
                {listing.photos[0] && <img src={listing.photos[0]} alt="" className="w-full max-h-64 object-cover rounded-2xl" />}
                <TextArea value={caption} onChange={e => setCaption(e.target.value)} maxLength={500} />
                <ErrorText>{error}</ErrorText>
                <PrimaryButton onClick={post} disabled={posting || !caption.trim()}>{posting ? 'Paylaşılıyor…' : 'Paylaş'}</PrimaryButton>
            </Sheet>
        </main>
    );
}
