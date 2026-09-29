'use client';

// Referans Ekran 8 — İlanın yayınlandı: özet, paylaşım ve yaygınlaştırma. Sayılar gerçek; tahmini "görüntülenecek
// kişi" gibi bir sayı gösterilmez.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Bell, CheckCircle2, Download, Share2 } from 'lucide-react';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { downloadQr, shareListing } from '@/components/adoption/AdoptionUI';
import { adoptionService, type AdoptionListing } from '@/services/adoptionService';

export default function PublishedPage() {
    return <Suspense fallback={null}><Published /></Suspense>;
}

function Published() {
    const { id } = useParams<{ id: string }>();
    const params = useSearchParams();
    const notified = Number(params.get('n') || 0);
    const [listing, setListing] = useState<AdoptionListing | null>(null);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(`${window.location.origin}/sahiplendirme/${id}`);
        adoptionService.get(id).then(setListing).catch(() => {});
    }, [id]);

    if (!listing) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;

    return (
        <main className="max-w-2xl mx-auto px-4 pt-[calc(32px+env(safe-area-inset-top,0px))] space-y-5">
            <section className="text-center space-y-2">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h1 className="text-2xl font-black">İlanın yayınlandı!</h1>
                <p className="text-sm font-semibold text-secondary">{listing.petName} artık yeni bir yuva arıyor. 🧡</p>
            </section>

            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                <div className="flex items-center gap-3 p-4">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Bell className="w-5 h-5" /></span>
                    <div>
                        <div className="text-xs font-bold text-secondary">Bildirim gönderildi</div>
                        <div className="text-base font-black">{notified.toLocaleString('tr-TR')} kişiye</div>
                        <div className="text-[11px] font-semibold text-secondary">
                            {notified === 0 ? '10 km içinde sahiplendirme bildirimini açan kimse yok şimdilik; ilanın listede ve haritada herkese görünüyor.'
                                : '10 km içinde sahiplendirme bildirimini açanlar'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Share2 className="w-5 h-5" /></span>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-secondary">Paylaşım bağlantısı oluşturuldu</div>
                        <div className="text-sm font-black truncate">{url.replace(/^https?:\/\//, '')}</div>
                        <div className="text-[11px] font-semibold text-secondary">Bağlantıyı açan herkes ilanı görür; başvurmak için giriş yapması gerekir.</div>
                    </div>
                </div>
            </div>

            <Link href={`/sahiplendirme/${id}`} className="w-full h-12 rounded-2xl border border-accent/30 bg-accent/5 text-accent font-black text-sm flex items-center justify-center">İlanı görüntüle</Link>
            <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => downloadQr('adoption-qr', 'moffi-sahiplendirme-qr.png')} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black">QR indir</button>
                <Link href={`/sahiplendirme/${id}/el-ilani`} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> PDF indir
                </Link>
            </div>
            <button onClick={() => shareListing(listing)} className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center gap-2"><Share2 className="w-4 h-4" /> Paylaş</button>
            <Link href="/sahiplendirme" className="block text-center text-sm font-black text-secondary">Sahiplendirme'ye dön</Link>
            <div className="hidden">{url && <QRCodeCanvas id="adoption-qr" value={url} size={512} marginSize={2} />}</div>
        </main>
    );
}
