'use client';

// Yazdırılabilir el ilanı (A4). PDF, tarayıcının "PDF olarak kaydet" özelliğiyle üretilir (Türkçe harfler bozulmaz).
// Telefon sadece sahibi "telefonla ulaşılsın" seçtiyse basılır; aksi halde QR ilana götürür.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { eventTimeText, listingTitle } from '@/components/lost/LostUI';
import { lostService, SPECIES_LABEL, type LostListing } from '@/services/lostService';
import { genderLabel } from '@/lib/petIdentity';

export default function FlyerPage() {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(`${window.location.origin}/kayip/${id}`);
        lostService.get(id).then(setListing).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!listing || listing.status !== 'active') {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu ilan artık yayında değil</h1>
                <Link href="/kayip" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Kayıp ilanlarına git</Link>
            </main>
        );
    }
    const l = listing;
    const isLost = l.kind === 'lost';
    const facts = [
        SPECIES_LABEL[l.species], l.breed, l.color, genderLabel(l.gender), l.ageText,
    ].filter(Boolean).join(' · ');

    return (
        <>
            {/* Yazdırırken sayfadaki her şey (alt menü, asistan düğmesi vb.) gizlenir; sadece ilan basılır. */}
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #flyer, #flyer * { visibility: visible !important; }
                #flyer { position: absolute; left: 0; top: 0; width: 100%; }
                body { background: #fff !important; }
                @page { size: A4; margin: 12mm; }
            }`}</style>
            <div className="no-print max-w-2xl mx-auto px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between gap-2">
                <Link href={`/kayip/${l.id}`} className="h-10 px-4 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center">İlana dön</Link>
                <button onClick={() => window.print()} className="h-10 px-4 rounded-2xl bg-accent text-white text-sm font-black flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> PDF kaydet / yazdır
                </button>
            </div>
            <p className="no-print max-w-2xl mx-auto px-4 text-[11px] font-semibold text-secondary">Yazdırma penceresinde hedef olarak "PDF olarak kaydet"i seçebilirsin.</p>

            <main id="flyer" className="max-w-[720px] mx-auto bg-white text-black p-6 sm:p-8 my-4 print:my-0 print:p-0 border border-card-border print:border-0 rounded-2xl print:rounded-none">
                <div className={`text-center text-5xl sm:text-6xl font-black tracking-tight ${isLost ? 'text-[#EE5B3D]' : 'text-emerald-600'}`}>
                    {isLost ? 'KAYIP' : 'BULUNDU'}
                </div>
                <div className="text-center text-2xl font-black mt-1">{listingTitle(l)}</div>
                {facts && <div className="text-center text-base font-bold text-neutral-600 mt-1">{facts}</div>}

                {l.photos[0] && <img src={l.photos[0]} alt="" className="w-full max-h-[380px] object-cover rounded-xl mt-5" />}

                <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                    <div>
                        <div className="text-xs font-bold text-neutral-500">{isLost ? 'Son görüldüğü yer' : 'Bulunduğu yer'}</div>
                        <div className="font-black">{l.locationText || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-neutral-500">Tarih</div>
                        <div className="font-black">{eventTimeText(l.eventAt)}</div>
                    </div>
                </div>

                {l.features.length > 0 && (
                    <div className="mt-4">
                        <div className="text-xs font-bold text-neutral-500">Ayırt edici özellikler</div>
                        <div className="font-bold">{l.features.join(', ')}</div>
                    </div>
                )}
                {l.approachNote && (
                    <div className="mt-3">
                        <div className="text-xs font-bold text-neutral-500">Görürseniz</div>
                        <div className="font-bold">{l.approachNote}</div>
                    </div>
                )}
                {l.rewardEnabled && l.rewardAmount ? (
                    <div className="mt-4 text-center text-xl font-black">Ödül: {l.rewardAmount.toLocaleString('tr-TR')} TL</div>
                ) : null}

                <div className="mt-6 flex items-center gap-5 border-t border-neutral-200 pt-5">
                    {url && <QRCodeSVG value={url} size={132} marginSize={1} />}
                    <div className="space-y-1">
                        {l.contactPhone && <div className="text-2xl font-black">{l.contactPhone}</div>}
                        <div className="text-sm font-bold">Kodu okut, ilanı aç ve Moffi'den haber ver.</div>
                        <div className="text-xs font-semibold text-neutral-500 break-all">{url.replace(/^https?:\/\//, '')}</div>
                    </div>
                </div>
            </main>
        </>
    );
}
