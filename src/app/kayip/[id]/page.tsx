'use client';

// Referans Ekran 11 — İlan Detayı. Giriş gerekmeden açılır (paylaşım bağlantısı); tam konum ve
// telefon sadece izin verilene görünür.

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, MapPin, Phone, Share2 } from 'lucide-react';
import { LoadingBlocks, PrimaryButton, Sheet, TextArea, ErrorText } from '@/components/health/HealthUI';
import { KindBadge, eventTimeText, listingTitle, relativeTime } from '@/components/lost/LostUI';
import { ReportModal } from '@/components/common/modals/ReportModal';
import { lostService, SPECIES_LABEL, FOUND_SITUATIONS, LOST_SITUATIONS, CHIP_OPTIONS, type LostListing } from '@/services/lostService';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { genderLabel } from '@/lib/petIdentity';
import { distanceKm, distanceText, currentPosition } from '@/lib/geo';
import { showToast } from '@/lib/utils';

const MiniMap = dynamic(() => import('@/components/lost/MiniMap'), { ssr: false, loading: () => <div className="h-40 rounded-2xl bg-card border border-card-border animate-pulse" /> });

export default function ListingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [dist, setDist] = useState<number | null>(null);
    const [photo, setPhoto] = useState(0);
    const [msgOpen, setMsgOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    useEffect(() => {
        lostService.get(id).then(l => {
            setListing(l);
            if (l && !l.isMine) lostService.recordEvent(id, 'view');
            if (l?.lat != null && l.lng != null) currentPosition(6000).then(p => p && setDist(distanceKm(p, { lat: l.lat!, lng: l.lng! })));
        }).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (listing === null) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">İlan bulunamadı</h1>
                <p className="text-sm font-semibold text-secondary">İlan kaldırılmış ya da bağlantı hatalı olabilir.</p>
                <Link href="/kayip" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Kayıp ilanlarına git</Link>
            </main>
        );
    }

    const l = listing;
    const isLost = l.kind === 'lost';
    const active = l.status === 'active';
    const situation = [...LOST_SITUATIONS, ...FOUND_SITUATIONS].find(s => s.id === l.situation)?.label;
    const chip = CHIP_OPTIONS.find(c => c.id === l.chipStatus)?.label;

    const share = async () => {
        const url = window.location.href.split('?')[0];
        try {
            if (navigator.share) await navigator.share({ title: `${isLost ? 'Kayıp' : 'Bulundu'}: ${listingTitle(l)}`, url });
            else { await navigator.clipboard.writeText(url); showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
            lostService.recordEvent(id, 'share');
        } catch { /* vazgeçildi */ }
    };

    const needLogin = () => { showToast('Bunun için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); router.push('/'); };

    return (
        <>
            <div className="relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-[4/3] max-h-[52vh] bg-card-border/40"
                    onScroll={e => setPhoto(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
                    {(l.photos.length ? l.photos : ['']).map((p, i) => (
                        <div key={i} className="w-full h-full shrink-0 snap-center">
                            {p ? <img src={p} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>}
                        </div>
                    ))}
                </div>
                <div className="absolute top-[calc(12px+env(safe-area-inset-top,0px))] inset-x-4 flex justify-between">
                    <button onClick={() => router.back()} aria-label="Geri" className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={share} aria-label="Paylaş" className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center"><Share2 className="w-4.5 h-4.5" /></button>
                </div>
                <KindBadge listing={l} className="absolute bottom-3 left-4 text-xs px-2.5 py-1" />
                {dist != null && <span className="absolute bottom-3 right-4 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs font-bold">{distanceText(dist)}</span>}
                {l.photos.length > 1 && <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-bold">{photo + 1}/{l.photos.length}</span>}
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
                {!active && (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25 p-3 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                        {l.resolution === 'reunited' ? '🎉 Bu dost ailesine kavuştu. Yardım eden herkese teşekkürler!' : 'Bu ilan kapatıldı.'}
                    </div>
                )}

                <section className="space-y-1">
                    <h1 className="text-2xl font-black">{listingTitle(l)}</h1>
                    <div className="text-sm font-semibold text-secondary">{[l.breed || SPECIES_LABEL[l.species], genderLabel(l.gender), l.ageText, l.color].filter(Boolean).join(' · ')}</div>
                    {l.locationText && <div className="text-sm font-semibold text-secondary inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" />{l.locationText} <span className="text-xs">(yaklaşık)</span></div>}
                    <div className="text-sm font-semibold text-secondary flex items-center gap-1"><Clock className="w-4 h-4" />{isLost ? 'Son görülme' : 'Bulunma'}: {eventTimeText(l.eventAt)}</div>
                </section>

                {l.rewardEnabled && l.rewardAmount ? (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25 p-3 text-sm font-black text-amber-800 dark:text-amber-200">
                        Sahibi {l.rewardAmount.toLocaleString('tr-TR')} TL ödül veriyor.
                    </div>
                ) : null}

                {l.features.length > 0 && (
                    <section>
                        <div className="text-sm font-black mb-2">Ayırt edici özellikler</div>
                        <div className="flex flex-wrap gap-1.5">{l.features.map(f => <span key={f} className="px-2.5 h-8 inline-flex items-center rounded-full bg-card border border-card-border text-xs font-bold">{f}</span>)}</div>
                    </section>
                )}

                {l.approachNote && (
                    <section className="rounded-2xl bg-accent/5 border border-accent/20 p-3">
                        <div className="text-xs font-black text-accent mb-1">Yaklaşım notu</div>
                        <p className="text-sm font-semibold">{l.approachNote}</p>
                    </section>
                )}

                {(situation || chip || l.description) && (
                    <section className="bg-card border border-card-border rounded-2xl p-4 space-y-1.5 text-sm">
                        {situation && <div><span className="font-bold text-secondary">{isLost ? 'Nasıl kayboldu: ' : 'Şu an: '}</span><span className="font-semibold">{situation}</span></div>}
                        {chip && <div><span className="font-bold text-secondary">Künye / çip: </span><span className="font-semibold">{chip}</span></div>}
                        {l.description && <p className="font-semibold whitespace-pre-wrap">{l.description}</p>}
                    </section>
                )}

                {l.lat != null && l.lng != null && <MiniMap center={[l.lat, l.lng]} exact={l.isMine} />}

                {l.owner && (
                    <div className="flex items-center gap-3 text-sm">
                        {l.owner.avatar ? <img src={l.owner.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : <span className="w-9 h-9 rounded-full bg-card border border-card-border" />}
                        <span className="flex-1 min-w-0"><span className="block font-black truncate">{l.owner.name}</span><span className="block text-xs font-semibold text-secondary">{relativeTime(l.createdAt)} ilan verdi</span></span>
                    </div>
                )}

                {l.isMine ? (
                    <Link href={`/kayip/${l.id}/yonet`} className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">İlanı yönet</Link>
                ) : active && (
                    <>
                        <div className="grid grid-cols-2 gap-2.5">
                            {isLost
                                ? <Link href={`/kayip/${l.id}/gordum`} className="h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">Gördüm</Link>
                                : <button onClick={() => (user ? setMsgOpen(true) : needLogin())} className="h-12 rounded-2xl bg-accent text-white font-black text-sm">Benim hayvanım olabilir</button>}
                            <button onClick={() => (user ? setMsgOpen(true) : needLogin())} className="h-12 rounded-2xl border border-accent/40 text-accent font-black text-sm">
                                {isLost ? 'Sahibine yaz' : 'Bulana yaz'}
                            </button>
                        </div>
                        {l.contactPhone && (
                            <a href={`tel:${l.contactPhone.replace(/\s/g, '')}`} className="w-full h-11 rounded-2xl bg-card border border-card-border font-black text-sm flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4" /> Ara
                            </a>
                        )}
                    </>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={share} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-1.5"><Share2 className="w-4 h-4" /> Paylaş</button>
                    {!l.isMine && <button onClick={() => (user ? setReportOpen(true) : needLogin())} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black text-red-600">Şikâyet et</button>}
                </div>
            </main>

            <MessageSheet open={msgOpen} onClose={() => setMsgOpen(false)} listing={l} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} entityType="lost_listing" entityId={l.id} />
        </>
    );
}

function MessageSheet({ open, onClose, listing }: { open: boolean; onClose: () => void; listing: LostListing }) {
    const { openChat } = useChat();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) setText(listing.kind === 'lost' ? `Merhaba, ${listingTitle(listing)} ilanınla ilgili yazıyorum. ` : 'Merhaba, bulduğun dost benim hayvanım olabilir. ');
    }, [open, listing]);

    const send = async () => {
        if (!text.trim()) return;
        setSending(true);
        setError(null);
        try {
            await apiService.sendChatMessage(listing.userId, text.trim(), 'inbox', listing.id);
            onClose();
            openChat(listing.userId);
        } catch (e: any) {
            setError(e?.message || 'Mesaj gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Sheet open={open} onClose={onClose} title={listing.kind === 'lost' ? 'Sahibine yaz' : 'Bulana yaz'}>
            <TextArea value={text} onChange={e => setText(e.target.value)} maxLength={1000} />
            <p className="text-[11px] font-semibold text-secondary">Mesajın Moffi üzerinden gider; telefon numaran paylaşılmaz.</p>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={send} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Gönder'}</PrimaryButton>
        </Sheet>
    );
}
