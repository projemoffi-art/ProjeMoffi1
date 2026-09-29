'use client';

// Referans Ekran 14 — Kavuştuk! İlan kapanmış olarak kalır (30 gün "Kavuştu" rozetiyle listede görünür).
// "Keşfet'te paylaş" gerçek bir gönderi oluşturur; isteğe bağlıdır.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ErrorText, LoadingBlocks, PrimaryButton, Sheet, TextArea } from '@/components/health/HealthUI';
import { listingTitle } from '@/components/lost/LostUI';
import { lostService, type LostListing } from '@/services/lostService';
import { apiService } from '@/services/apiService';
import { showToast } from '@/lib/utils';

export default function ReunitedPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [shareOpen, setShareOpen] = useState(false);
    const [caption, setCaption] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        lostService.get(id).then(l => {
            setListing(l);
            if (l) setCaption(l.kind === 'lost'
                ? `${listingTitle(l)} evine döndü! 🐾 Arayan, paylaşan ve haber veren herkese çok teşekkürler.`
                : `Bulduğum dost sahibine kavuştu! 🐾 Yardım eden herkese teşekkürler.`);
        }).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={2} /></main>;
    if (!listing || !listing.isMine || listing.status !== 'resolved') {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu sayfa sadece kavuşan ilanın sahibine açık</h1>
                <Link href="/kayip" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Kayıp ilanlarına git</Link>
            </main>
        );
    }

    const post = async () => {
        setError(null); setPosting(true);
        try {
            await apiService.addPost({ caption: caption.trim(), media: listing.photos[0] || undefined });
            showToast("Keşfet'te paylaşıldı.", 'CheckCircle2', 'text-emerald-500 font-bold');
            setShareOpen(false);
            router.push('/community');
        } catch (e: any) {
            setError(e?.message || 'Paylaşılamadı.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 pt-[calc(40px+env(safe-area-inset-top,0px))] pb-10 space-y-5 text-center">
            {listing.photos[0] && (
                <div className="relative w-40 h-40 mx-auto">
                    <img src={listing.photos[0]} alt="" className="w-40 h-40 rounded-full object-cover border-4 border-card" />
                    <CheckCircle2 className="w-11 h-11 text-emerald-500 bg-background rounded-full absolute -bottom-1 -right-1" />
                </div>
            )}
            <div className="space-y-2">
                <h1 className="text-2xl font-black">Kavuştunuz! 🎉</h1>
                <p className="text-sm font-semibold text-secondary">
                    {listing.kind === 'lost'
                        ? `${listingTitle(listing)} evine döndü. İlan kapandı; yakın çevre bildirimleri durdu.`
                        : 'Bulduğun dost sahibine kavuştu. İlan kapandı.'}
                </p>
                <p className="text-xs font-semibold text-secondary">İlan 30 gün boyunca "Kavuştu" rozetiyle görünür, sonra listeden kalkar.</p>
            </div>
            <div className="space-y-2.5 pt-2">
                <PrimaryButton onClick={() => setShareOpen(true)}>Keşfet'te paylaş</PrimaryButton>
                <Link href="/kayip" className="w-full h-12 rounded-2xl border border-card-border bg-card font-black text-sm flex items-center justify-center">Tamam</Link>
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
