'use client';

// Referans Ekran 9 — Sahiplendirme İlan Detayı. Giriş gerekmeden açılır (paylaşım bağlantısı); başvuru,
// kaydetme, mesaj ve şikâyet giriş ister. Telefon sadece ilan sahibi izin verdiyse ve giriş yapmışsa görünür.

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Check, ChevronLeft, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react';
import { ErrorText, LoadingBlocks, PrimaryButton, Sheet, TextArea } from '@/components/health/HealthUI';
import { ApplicationStatusBadge, FavoriteButton, Tag, listingFacts, listingTags, shareListing } from '@/components/adoption/AdoptionUI';
import { ReportModal } from '@/components/common/modals/ReportModal';
import { adoptionService, type AdoptionListing } from '@/services/adoptionService';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { distanceKm, distanceText, currentPosition } from '@/lib/geo';
import { relativeTime } from '@/components/lost/LostUI';
import { cn, showToast } from '@/lib/utils';

const MiniMap = dynamic(() => import('@/components/lost/MiniMap'), { ssr: false, loading: () => <div className="h-40 rounded-2xl bg-card border border-card-border animate-pulse" /> });

export default function AdoptionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [listing, setListing] = useState<AdoptionListing | null | undefined>(undefined);
    const [dist, setDist] = useState<number | null>(null);
    const [photo, setPhoto] = useState(0);
    const [msgOpen, setMsgOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    useEffect(() => {
        adoptionService.get(id).then(l => {
            setListing(l);
            if (l && !l.isMine) adoptionService.recordEvent(id, 'view');
            if (l?.lat != null && l.lng != null) currentPosition(6000).then(p => p && setDist(distanceKm(p, { lat: l.lat!, lng: l.lng! })));
        }).catch(() => setListing(null));
    }, [id]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (listing === null) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">İlan bulunamadı</h1>
                <p className="text-sm font-semibold text-secondary">İlan kaldırılmış ya da bağlantı hatalı olabilir.</p>
                <Link href="/sahiplendirme" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Sahiplendirme ilanlarına git</Link>
            </main>
        );
    }

    const l = listing;
    const needLogin = () => { showToast('Bunun için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); router.push('/'); };
    const compat = [
        { label: 'Çocuk', on: l.goodWithKids }, { label: 'Kedi', on: l.goodWithCats },
        { label: 'Köpek', on: l.goodWithDogs }, { label: 'Diğer', on: l.goodWithOthers },
    ];
    const healthTags = l.healthUnknown
        ? ['Sağlık durumu bilinmiyor']
        : [l.vaccinated ? 'Aşılı' : 'Aşı bilgisi yok', l.microchipped ? 'Çip var' : 'Çip yok', l.neutered ? 'Kısırlaştırılmış' : 'Kısır değil'];

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
                    <button onClick={() => (window.history.length > 1 ? router.back() : router.replace('/sahiplendirme'))} aria-label="Geri"
                        className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                    <FavoriteButton listing={l} className="w-10 h-10" />
                </div>
                <div className="absolute bottom-3 left-4 flex gap-1">{listingTags(l, 2).map(t => <Tag key={t.label} {...t} className={t.strong ? 'text-xs px-2.5 py-1' : 'text-xs px-2.5 py-1 bg-white/90 dark:bg-black/60'} />)}</div>
                {l.photos.length > 1 && <span className="absolute bottom-3 right-4 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-bold">{photo + 1}/{l.photos.length}</span>}
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
                {l.status === 'adopted' && (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25 p-3 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                        🎉 {l.petName} yeni yuvasına kavuştu. İlgin için teşekkürler!
                    </div>
                )}
                {l.status === 'paused' && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25 p-3 text-sm font-bold text-amber-800 dark:text-amber-200">
                        Bu ilan şu an başvuru almıyor.
                    </div>
                )}

                <section className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl font-black">{l.petName}</h1>
                        {dist != null && <span className="text-sm font-bold text-secondary inline-flex items-center gap-1 pt-1.5"><MapPin className="w-4 h-4 text-accent" />{distanceText(dist)}</span>}
                    </div>
                    <div className="text-sm font-semibold text-secondary">{listingFacts(l)}</div>
                    {l.locationText && <div className="text-sm font-semibold text-secondary inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" />{l.locationText} <span className="text-xs">(yaklaşık)</span></div>}
                </section>

                {l.description && <p className="text-sm font-semibold whitespace-pre-wrap">{l.description}</p>}

                <section>
                    <div className="text-sm font-black mb-2">Uyum tablosu</div>
                    <div className="grid grid-cols-4 gap-2">
                        {compat.map(c => (
                            <div key={c.label} className="bg-card border border-card-border rounded-2xl py-2.5 flex flex-col items-center gap-1.5">
                                <span className="text-[11px] font-bold text-secondary">{c.label}</span>
                                {c.on
                                    ? <span className="w-6 h-6 rounded-full bg-[#8FD14F]/30 text-[#3F6F12] dark:text-[#B9E68C] flex items-center justify-center"><Check className="w-4 h-4" /></span>
                                    : <span className="w-6 h-6 rounded-full bg-card-border/60 text-secondary flex items-center justify-center text-xs font-black" title="Bilinmiyor">—</span>}
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] font-semibold text-secondary mt-1.5">"—" ilan sahibinin emin olmadığı ya da uyumlu olmadığı anlamına gelir; sormaktan çekinme.</p>
                </section>

                <section>
                    <div className="text-sm font-black mb-2">Sağlık</div>
                    <div className="flex flex-wrap gap-1.5">
                        {healthTags.map(t => (
                            <span key={t} className={cn('px-2.5 h-8 inline-flex items-center rounded-full text-xs font-bold border',
                                /yok|değil|bilinmiyor/.test(t) ? 'bg-card border-card-border text-secondary' : 'bg-[#8FD14F]/20 border-[#8FD14F]/40 text-[#3F6F12] dark:text-[#B9E68C]')}>{t}</span>
                        ))}
                    </div>
                    {l.healthNote && <p className="text-sm font-semibold mt-2 whitespace-pre-wrap">{l.healthNote}</p>}
                    {l.petId && <p className="text-[11px] font-semibold text-secondary mt-1.5">Bu dostun Moffi pasaportu var; sahiplendirmede aşı ve muayene geçmişi yeni ailesine devredilebilir.</p>}
                </section>

                {l.lat != null && l.lng != null && <MiniMap center={[l.lat, l.lng]} exact={l.isMine} />}

                {l.owner && (
                    <div className="flex items-center gap-3 text-sm">
                        {l.owner.avatar ? <img src={l.owner.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : <span className="w-9 h-9 rounded-full bg-card border border-card-border" />}
                        <span className="flex-1 min-w-0">
                            <span className="block font-black truncate">{l.owner.name}{l.isShelter && <Tag label="Barınak" className="ml-1.5 align-middle" />}</span>
                            <span className="block text-xs font-semibold text-secondary">{relativeTime(l.createdAt)} ilan verdi</span>
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => shareListing(l)} className="h-11 rounded-2xl bg-card border border-card-border text-xs font-black flex items-center justify-center gap-1.5"><Share2 className="w-4 h-4" /> Paylaş</button>
                    {!l.isMine && (
                        <button onClick={() => (user ? setMsgOpen(true) : needLogin())} className="h-11 rounded-2xl bg-card border border-card-border text-xs font-black flex items-center justify-center gap-1.5">
                            <MessageCircle className="w-4 h-4" /> Mesaj
                        </button>
                    )}
                    {!l.isMine && <button onClick={() => (user ? setReportOpen(true) : needLogin())} className="h-11 rounded-2xl bg-card border border-card-border text-xs font-black text-red-600">Şikâyet et</button>}
                </div>
                {l.contactPhone && !l.isMine && (
                    <a href={`tel:${l.contactPhone.replace(/\s/g, '')}`} className="w-full h-11 rounded-2xl bg-card border border-card-border font-black text-sm flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" /> Ara
                    </a>
                )}

                {l.isMine ? (
                    <Link href={`/sahiplendirme/${l.id}/yonet`} className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">İlanı yönet</Link>
                ) : l.myApplicationStatus ? (
                    <Link href="/sahiplendirme/basvurularim" className="w-full h-12 rounded-2xl border border-accent/40 bg-accent/5 font-black text-sm flex items-center justify-center gap-2">
                        Başvurun: <ApplicationStatusBadge status={l.myApplicationStatus} />
                    </Link>
                ) : l.status === 'active' && (
                    <Link href={user ? `/sahiplendirme/${l.id}/basvur` : '/'} onClick={e => { if (!user) { e.preventDefault(); needLogin(); } }}
                        className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">Sahiplenmek istiyorum</Link>
                )}
            </main>

            <MessageSheet open={msgOpen} onClose={() => setMsgOpen(false)} listing={l} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} entityType="adoption_listing" entityId={l.id} />
        </>
    );
}

function MessageSheet({ open, onClose, listing }: { open: boolean; onClose: () => void; listing: AdoptionListing }) {
    const { openChat } = useChat();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (open) setText(`Merhaba, ${listing.petName} ilanınla ilgili yazıyorum. `); }, [open, listing]);

    const send = async () => {
        if (!text.trim()) return;
        setSending(true); setError(null);
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
        <Sheet open={open} onClose={onClose} title="İlan sahibine yaz">
            <TextArea value={text} onChange={e => setText(e.target.value)} maxLength={1000} />
            <p className="text-[11px] font-semibold text-secondary">Mesajın Moffi üzerinden gider; telefon numaran paylaşılmaz. Sahiplenmek istiyorsan başvuru formu ilan sahibinin karar vermesini kolaylaştırır.</p>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={send} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Gönder'}</PrimaryButton>
        </Sheet>
    );
}
