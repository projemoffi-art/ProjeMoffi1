'use client';

// Referans Ekran 12 — Gördüm Bildirimi. Giriş gerekmez (künyedeki gibi); bildirim ilan sahibine gider.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { HealthHeader, ErrorText, Field, LoadingBlocks, PrimaryButton, TextArea, TextInput } from '@/components/health/HealthUI';
import { KindBadge, LocationField, PhotoPicker, listingTitle, toLocalInput, type PhotoItem } from '@/components/lost/LostUI';
import { lostService, type LostListing } from '@/services/lostService';
import { useAuth } from '@/context/AuthContext';
import { currentPosition } from '@/lib/geo';

export default function SightingPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; address: string }>({ lat: null, lng: null, address: '' });
    const [fallback, setFallback] = useState<[number, number]>([41.0082, 28.9784]);
    const [seenAt, setSeenAt] = useState(() => toLocalInput(new Date()));
    const [note, setNote] = useState('');
    const [contact, setContact] = useState('');
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        lostService.get(id).then(l => {
            setListing(l);
            if (l?.lat != null && l.lng != null) setFallback([l.lat, l.lng]);
        }).catch(() => setListing(null));
        currentPosition(8000).then(p => { if (p) { setFallback([p.lat, p.lng]); setLoc(v => (v.lat == null ? { lat: p.lat, lng: p.lng, address: '' } : v)); } });
    }, [id]);

    const send = async () => {
        setError(null);
        if (loc.lat == null || loc.lng == null) { setError('Nerede gördüğünü haritada işaretle.'); return; }
        if (new Date(seenAt).getTime() > Date.now() + 5 * 60000) { setError('Zaman ileri bir tarih olamaz.'); return; }
        setSending(true);
        try {
            const photoUrl = photos[0]?.file ? (await lostService.uploadPhotos([photos[0].file]))[0] : null;
            await lostService.submitSighting(id, {
                lat: loc.lat, lng: loc.lng, seenAt: new Date(seenAt).toISOString(),
                note: [loc.address && `Yer: ${loc.address}`, note.trim()].filter(Boolean).join('\n'),
                photoUrl, contact,
            });
            setSent(true);
        } catch (e: any) {
            setError(e?.message || 'Gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={2} /></main>;
    if (!listing || listing.status !== 'active') {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu ilan artık yayında değil</h1>
                <Link href="/kayip" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Kayıp ilanlarına git</Link>
            </main>
        );
    }

    if (sent) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-20 text-center space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h1 className="text-xl font-black">Teşekkürler, sahibine iletildi</h1>
                <p className="text-sm font-semibold text-secondary">{listingTitle(listing)} ilanının sahibine bildirim gitti. Haritada işaretlediğin nokta aramaya yardım edecek.</p>
                <Link href={`/kayip/${id}`} className="inline-flex h-11 px-5 items-center rounded-2xl border border-accent/40 text-accent font-black text-sm">İlana dön</Link>
            </main>
        );
    }

    return (
        <>
            <HealthHeader title="Gördüm Bildirimi" backHref={`/kayip/${id}`} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
                    {listing.photos[0] && <img src={listing.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                    <div className="min-w-0">
                        <KindBadge listing={listing} />
                        <div className="text-base font-black truncate mt-0.5">{listingTitle(listing)}</div>
                        <div className="text-xs font-semibold text-secondary truncate">{listing.locationText}</div>
                    </div>
                </div>

                <div>
                    <div className="text-xs font-bold text-secondary mb-1.5">Nerede gördün?</div>
                    <LocationField lat={loc.lat} lng={loc.lng} address={loc.address} fallback={fallback} onChange={setLoc} />
                </div>
                <Field label="Ne zaman gördün?"><TextInput type="datetime-local" value={seenAt} max={toLocalInput(new Date())} onChange={e => setSeenAt(e.target.value)} /></Field>
                <Field label="Kısa not (isteğe bağlı)">
                    <TextArea value={note} onChange={e => setNote(e.target.value)} maxLength={400} placeholder="Kısa bir süre gördüm, koşarak park yönüne gitti." />
                </Field>
                {user ? (
                    <div>
                        <div className="text-xs font-bold text-secondary mb-1.5">Fotoğraf (isteğe bağlı)</div>
                        <PhotoPicker items={photos} onChange={setPhotos} max={1} />
                    </div>
                ) : (
                    <Field label="Sana nasıl ulaşsın? (isteğe bağlı)" hint="Telefon ya da ad; sadece ilan sahibi görür">
                        <TextInput value={contact} onChange={e => setContact(e.target.value)} maxLength={100} />
                    </Field>
                )}
                <ErrorText>{error}</ErrorText>
                <PrimaryButton onClick={send} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Sahibine ilet'}</PrimaryButton>
            </main>
        </>
    );
}
