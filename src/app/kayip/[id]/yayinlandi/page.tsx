'use client';

// Referans Ekran 7 — İlan yayınlandı (özet, bildirim, paylaşım). Sayılar gerçek.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Bell, CheckCircle2, Download, Share2 } from 'lucide-react';
import { LoadingBlocks, SectionTitle } from '@/components/health/HealthUI';
import { ListingCard, listingTitle } from '@/components/lost/LostUI';
import { lostService, type LostListing } from '@/services/lostService';
import { showToast } from '@/lib/utils';

export default function PublishedPage() {
    return <Suspense fallback={null}><Published /></Suspense>;
}

function Published() {
    const { id } = useParams<{ id: string }>();
    const params = useSearchParams();
    const notified = Number(params.get('n') || 0);
    const [listing, setListing] = useState<LostListing | null>(null);
    const [matches, setMatches] = useState<LostListing[]>([]);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(`${window.location.origin}/kayip/${id}`);
        lostService.get(id).then(setListing).catch(() => {});
        lostService.matches(id).then(setMatches).catch(() => {});
    }, [id]);

    const share = async () => {
        const title = listing ? `${listing.kind === 'lost' ? 'Kayıp' : 'Bulundu'}: ${listingTitle(listing)}` : 'Moffi ilanı';
        try {
            if (navigator.share) await navigator.share({ title, text: listing?.locationText || '', url });
            else { await navigator.clipboard.writeText(url); showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
            lostService.recordEvent(id, 'share');
        } catch { /* kullanıcı vazgeçti */ }
    };

    const downloadQr = () => {
        const c = document.getElementById('listing-qr') as HTMLCanvasElement | null;
        if (!c) return;
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = `moffi-ilan-qr.png`;
        a.click();
    };

    if (!listing) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    const isLost = listing.kind === 'lost';

    return (
        <main className="max-w-2xl mx-auto px-4 pt-[calc(32px+env(safe-area-inset-top,0px))] space-y-5">
            <section className="text-center space-y-2">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h1 className="text-2xl font-black">İlanın yayınlandı!</h1>
                <p className="text-sm font-semibold text-secondary">
                    {isLost ? `${listingTitle(listing)} için verdiğin kayıp ilanı aktif.` : 'Bulduğun dost için ilan aktif; sahibi arıyorsa burada görecek.'}
                </p>
            </section>

            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                <div className="flex items-center gap-3 p-4">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Bell className="w-5 h-5" /></span>
                    <div>
                        <div className="text-xs font-bold text-secondary">Bildirim gönderildi</div>
                        <div className="text-base font-black">{notified.toLocaleString('tr-TR')} kişiye</div>
                        <div className="text-[11px] font-semibold text-secondary">
                            {notified === 0 ? 'Bu alanda yakın çevre bildirimini açan kimse yok şimdilik; ilanın listede ve haritada herkese görünüyor.'
                                : `${listing.notifyRadiusKm} km içinde yakın çevre bildirimini açanlar`}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Share2 className="w-5 h-5" /></span>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-secondary">Paylaşım bağlantısı</div>
                        <div className="text-sm font-black truncate">{url.replace(/^https?:\/\//, '')}</div>
                        <div className="text-[11px] font-semibold text-secondary">Bağlantıyı açan herkes ilanı görür; giriş gerekmez.</div>
                    </div>
                </div>
            </div>

            {isLost && (
                <p className="text-[11px] font-semibold text-secondary px-1">
                    Hatırlatma: Kayıp bildirimini 7 gün içinde il/ilçe Tarım ve Orman Müdürlüğüne de yapman gerekiyor (PETVET kaydı için).
                </p>
            )}

            <Link href={`/kayip/${id}`} className="w-full h-12 rounded-2xl border border-accent/30 bg-accent/5 text-accent font-black text-sm flex items-center justify-center">İlanı görüntüle</Link>
            <div className="grid grid-cols-2 gap-2.5">
                <button onClick={downloadQr} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black">QR indir</button>
                <Link href={`/kayip/${id}/el-ilani`} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> El ilanı (PDF)
                </Link>
            </div>
            <button onClick={share} className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center gap-2"><Share2 className="w-4 h-4" /> Paylaş</button>
            <div className="hidden">{url && <QRCodeCanvas id="listing-qr" value={url} size={512} marginSize={2} />}</div>

            {matches.length > 0 && (
                <section>
                    <SectionTitle>{isLost ? 'Yakında bulunan benzer ilanlar' : 'Bu kayıp ilanlarına benziyor'}</SectionTitle>
                    <div className="space-y-2.5">{matches.map(m => <ListingCard key={m.id} listing={m} />)}</div>
                </section>
            )}
        </main>
    );
}
