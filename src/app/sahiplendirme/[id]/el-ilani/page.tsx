'use client';

// Yazdırılabilir sahiplendirme ilanı (A4). PDF, tarayıcının "PDF olarak kaydet" özelliğiyle üretilir (Türkçe harfler bozulmaz).
// Telefon sadece sahibi "telefonumu göster" seçtiyse basılır; aksi halde QR ilana götürür.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { listingFacts } from '@/components/adoption/AdoptionUI';
import { adoptionService, type AdoptionListing } from '@/services/adoptionService';

export default function AdoptionFlyerPage() {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<AdoptionListing | null | undefined>(undefined);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(`${window.location.origin}/sahiplendirme/${id}`);
        adoptionService.get(id).then(setListing).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!listing || listing.status !== 'active') {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu ilan şu an yayında değil</h1>
                <Link href="/sahiplendirme" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Sahiplendirme ilanlarına git</Link>
            </main>
        );
    }
    const l = listing;
    const good = [l.goodWithKids && 'çocuklarla', l.goodWithCats && 'kedilerle', l.goodWithDogs && 'köpeklerle', l.goodWithOthers && 'diğer hayvanlarla'].filter(Boolean);
    const health = l.healthUnknown ? [] : [l.vaccinated && 'Aşılı', l.neutered && 'Kısırlaştırılmış', l.microchipped && 'Çipli'].filter(Boolean);

    return (
        <>
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #flyer, #flyer * { visibility: visible !important; }
                #flyer { position: absolute; left: 0; top: 0; width: 100%; }
                body { background: #fff !important; }
                @page { size: A4; margin: 12mm; }
            }`}</style>
            <div className="no-print max-w-2xl mx-auto px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between gap-2">
                <Link href={`/sahiplendirme/${l.id}`} className="h-10 px-4 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center">İlana dön</Link>
                <button onClick={() => window.print()} className="h-10 px-4 rounded-2xl bg-accent text-white text-sm font-black flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> PDF kaydet / yazdır
                </button>
            </div>
            <p className="no-print max-w-2xl mx-auto px-4 text-[11px] font-semibold text-secondary">Yazdırma penceresinde hedef olarak "PDF olarak kaydet"i seçebilirsin.</p>

            <main id="flyer" className="max-w-[720px] mx-auto bg-white text-black p-6 sm:p-8 my-4 print:my-0 print:p-0 border border-card-border print:border-0 rounded-2xl print:rounded-none">
                <div className="text-center text-4xl sm:text-5xl font-black tracking-tight text-[#EE5B3D]">YUVA ARIYORUM</div>
                <div className="text-center text-2xl font-black mt-1">{l.petName}</div>
                <div className="text-center text-base font-bold text-neutral-600 mt-1">{listingFacts(l)}</div>

                {l.photos[0] && <img src={l.photos[0]} alt="" className="w-full max-h-[380px] object-cover rounded-xl mt-5" />}

                {l.description && <p className="mt-5 text-base font-semibold whitespace-pre-wrap">{l.description}</p>}
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    {health.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-neutral-500">Sağlık</div>
                            <div className="font-black">{health.join(' · ')}</div>
                        </div>
                    )}
                    {good.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-neutral-500">Uyumlu</div>
                            <div className="font-black">{good.join(', ')}</div>
                        </div>
                    )}
                    {l.locationText && (
                        <div>
                            <div className="text-xs font-bold text-neutral-500">Bölge</div>
                            <div className="font-black">{l.locationText}</div>
                        </div>
                    )}
                </div>
                <div className="mt-4 text-sm font-black">Sahiplendirme ücretsizdir.</div>

                <div className="mt-6 flex items-center gap-5 border-t border-neutral-200 pt-5">
                    {url && <QRCodeSVG value={url} size={132} marginSize={1} />}
                    <div className="space-y-1">
                        {l.contactPhone && <div className="text-2xl font-black">{l.contactPhone}</div>}
                        <div className="text-sm font-bold">Kodu okut, ilanı aç ve Moffi'den başvur.</div>
                        <div className="text-xs font-semibold text-neutral-500 break-all">{url.replace(/^https?:\/\//, '')}</div>
                    </div>
                </div>
            </main>
        </>
    );
}
