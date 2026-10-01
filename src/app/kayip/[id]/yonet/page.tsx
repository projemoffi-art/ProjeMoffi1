'use client';

// Referans Ekran 13 — İlan Yönetimi (sahip): istatistik, görülme haritası, eşleşmeler ve eylemler.

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Download, MessageCircle, Share2 } from 'lucide-react';
import { HealthHeader, ErrorText, FilterTabs, LoadingBlocks, PrimaryButton, SectionTitle, Sheet, TextArea, TextInput } from '@/components/health/HealthUI';
import { ChipInput, KindBadge, ListingCard, ToggleRow, eventTimeText, listingTitle, relativeTime } from '@/components/lost/LostUI';
import { lostService, type LostListing, type Sighting } from '@/services/lostService';
import { useChat } from '@/context/ChatContext';
import { showToast } from '@/lib/utils';
import { openShare } from '@/components/common/ShareSheet';

const MiniMap = dynamic(() => import('@/components/lost/MiniMap'), { ssr: false, loading: () => <div className="h-56 rounded-2xl bg-card border border-card-border animate-pulse" /> });

type Tab = 'general' | 'sightings';

export default function ManageListingPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { setIsInboxOpen } = useChat();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [stats, setStats] = useState<{ views: number; sightings: number; messages: number; shares: number; notified: number } | null>(null);
    const [sightings, setSightings] = useState<Sighting[]>([]);
    const [matches, setMatches] = useState<LostListing[]>([]);
    const [tab, setTab] = useState<Tab>('general');
    const [sheet, setSheet] = useState<null | 'edit' | 'radius' | 'resolve' | 'close'>(null);

    const load = useCallback(async () => {
        const l = await lostService.get(id).catch(() => null);
        setListing(l);
        if (!l || !l.isMine) return;
        const [s, sg, m] = await Promise.all([
            lostService.ownerStats(id), lostService.sightings(id).catch(() => []), lostService.matches(id).catch(() => []),
        ]);
        setStats(s); setSightings(sg); setMatches(m);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!listing || !listing.isMine) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu ilanı sadece sahibi yönetebilir</h1>
                <Link href={`/kayip/${id}`} className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">İlanı görüntüle</Link>
            </main>
        );
    }
    const l = listing;
    const active = l.status === 'active';
    const url = typeof window !== 'undefined' ? `${window.location.origin}/kayip/${l.id}` : '';
    const week = Date.now() - 7 * 86400000;
    const recent = sightings.filter(s => new Date(s.seenAt).getTime() >= week);

    const share = async () => {
        openShare({
            title: `${l.kind === 'lost' ? 'Kayıp' : 'Bulundu'}: ${listingTitle(l)}`, text: l.locationText || undefined,
            url, image: l.photos[0] || null, badge: l.kind === 'lost' ? 'Acil kayıp' : 'Bulundu',
        });
        lostService.recordEvent(l.id, 'share');
    };

    return (
        <>
            <HealthHeader title="İlan Yönetimi" backHref="/kayip" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <Link href={`/kayip/${l.id}`} className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
                    {l.photos[0] && <img src={l.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-black truncate">{listingTitle(l)}</div>
                        <div className="text-xs font-semibold text-secondary">{eventTimeText(l.eventAt)}</div>
                    </div>
                    <KindBadge listing={l} />
                </Link>

                <FilterTabs<Tab> options={[{ id: 'general', label: 'Genel' }, { id: 'sightings', label: `Görülmeler${sightings.length ? ` (${sightings.length})` : ''}` }]} value={tab} onChange={setTab} />

                {tab === 'general' ? (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: stats?.views, l: 'Kişi gördü' },
                                { v: stats?.sightings, l: 'Görülme bildirimi' },
                                { v: stats?.shares, l: 'Paylaşım' },
                            ].map(s => (
                                <div key={s.l} className="bg-card border border-card-border rounded-2xl p-3 text-center">
                                    <div className="text-xl font-black">{s.v == null ? '—' : s.v.toLocaleString('tr-TR')}</div>
                                    <div className="text-[11px] font-bold text-secondary">{s.l}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-[11px] font-semibold text-secondary px-1">
                            {stats ? `${stats.notified.toLocaleString('tr-TR')} kişiye yakın çevre bildirimi gitti · bildirim alanı ${l.notifyRadiusKm} km` : ''}
                        </div>

                        {l.lat != null && l.lng != null && (
                            <section>
                                <SectionTitle action={<span className="text-xs font-bold text-secondary">Son 7 gün</span>}>Görülme noktaları</SectionTitle>
                                <MiniMap center={[l.lat, l.lng]} exact sightings={recent.map(s => [s.lat, s.lng] as [number, number])} height="h-56" interactive />
                                {recent.length === 0 && <p className="text-xs font-semibold text-secondary mt-2">Henüz görülme bildirimi yok. Paylaştıkça artar.</p>}
                            </section>
                        )}

                        {active && (
                            <div className="space-y-2.5">
                                <button onClick={() => setSheet('edit')} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black">İlanı güncelle</button>
                                <button onClick={() => setSheet('radius')} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black">Bildirim alanını genişlet</button>
                                <button onClick={() => setIsInboxOpen(true)} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-2">
                                    <MessageCircle className="w-4 h-4" /> Mesajlar{stats?.messages ? ` (${stats.messages})` : ''}
                                </button>
                                <button onClick={() => setSheet('resolve')} className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm">
                                    {l.kind === 'lost' ? 'Bulundu, kavuştuk' : 'Sahibine kavuştu'}
                                </button>
                            </div>
                        )}

                        {matches.length > 0 && active && (
                            <section>
                                <SectionTitle>{l.kind === 'lost' ? 'Olası eşleşmeler: bulunan ilanlar' : 'Olası eşleşmeler: kayıp ilanları'}</SectionTitle>
                                <div className="space-y-2.5">{matches.map(m => <ListingCard key={m.id} listing={m} />)}</div>
                            </section>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <Link href={`/kayip/${l.id}/el-ilani`} className="h-12 rounded-2xl bg-card border border-card-border text-xs font-black flex flex-col items-center justify-center"><Download className="w-4 h-4" />PDF indir</Link>
                            <button onClick={share} className="h-12 rounded-2xl bg-card border border-card-border text-xs font-black flex flex-col items-center justify-center"><Share2 className="w-4 h-4" />Paylaş</button>
                            {active && <button onClick={() => setSheet('close')} className="h-12 rounded-2xl bg-card border border-card-border text-xs font-black text-red-600">İlanı kapat</button>}
                        </div>
                    </>
                ) : (
                    <section className="space-y-2.5">
                        {sightings.length === 0 ? (
                            <p className="text-sm font-semibold text-secondary">Henüz görülme bildirimi yok.</p>
                        ) : sightings.map(s => (
                            <div key={s.id} className="bg-card border border-card-border rounded-2xl p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-black">{s.reporter?.name || 'Moffi üyesi olmayan biri'}</span>
                                    <span className="text-xs font-semibold text-secondary">{relativeTime(s.seenAt)}</span>
                                </div>
                                {s.note && <p className="text-sm font-semibold whitespace-pre-wrap">{s.note}</p>}
                                {s.contact && <p className="text-xs font-bold">İletişim: {s.contact}</p>}
                                {s.photoUrl && <img src={s.photoUrl} alt="" className="w-full max-h-56 object-cover rounded-xl" />}
                                <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer" className="inline-block text-xs font-black text-accent">Konumu haritada aç</a>
                            </div>
                        ))}
                    </section>
                )}
            </main>

            <EditSheet open={sheet === 'edit'} onClose={() => setSheet(null)} listing={l} onSaved={load} />
            <RadiusSheet open={sheet === 'radius'} onClose={() => setSheet(null)} listing={l} onSaved={load} />
            <ResolveSheet open={sheet === 'resolve' || sheet === 'close'} mode={sheet === 'close' ? 'closed' : 'reunited'} onClose={() => setSheet(null)} listing={l}
                onDone={res => (res === 'reunited' ? router.replace(`/kayip/${l.id}/kavustuk`) : router.replace('/kayip'))} />
        </>
    );
}

function EditSheet({ open, onClose, listing, onSaved }: { open: boolean; onClose: () => void; listing: LostListing; onSaved: () => void }) {
    const [features, setFeatures] = useState<string[]>([]);
    const [approach, setApproach] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState(false);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setFeatures(listing.features); setApproach(listing.approachNote || ''); setDescription(listing.description || '');
        setReward(listing.rewardEnabled); setAmount(listing.rewardAmount ? String(listing.rewardAmount) : ''); setError(null);
    }, [open, listing]);

    const save = async () => {
        if (reward && !(Number(amount) > 0)) { setError('Ödül miktarını yaz ya da ödülü kapat.'); return; }
        setSaving(true);
        try {
            await lostService.update(listing.id, { features, approachNote: approach, description, rewardEnabled: reward, rewardAmount: reward ? Number(amount) : null });
            onSaved(); onClose();
        } catch (e: any) { setError(e?.message || 'Kaydedilemedi.'); } finally { setSaving(false); }
    };

    return (
        <Sheet open={open} onClose={onClose} title="İlanı güncelle">
            <div><div className="text-xs font-bold text-secondary mb-1.5">Ayırt edici özellikler</div><ChipInput values={features} onChange={setFeatures} placeholder="Özellik ekle" /></div>
            <div><div className="text-xs font-bold text-secondary mb-1.5">Yaklaşım notu</div><TextArea value={approach} onChange={e => setApproach(e.target.value)} maxLength={200} /></div>
            <div><div className="text-xs font-bold text-secondary mb-1.5">Açıklama / son durum</div><TextArea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} /></div>
            <div className="bg-card border border-card-border rounded-2xl px-4 py-2 space-y-2">
                <ToggleRow on={reward} onChange={setReward} label="Ödül" />
                {reward && <TextInput type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ödül miktarı (TL)" />}
            </div>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}

function RadiusSheet({ open, onClose, listing, onSaved }: { open: boolean; onClose: () => void; listing: LostListing; onSaved: () => void }) {
    const [km, setKm] = useState(listing.notifyRadiusKm);
    const [reach, setReach] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (open) { setKm(Math.min(10, listing.notifyRadiusKm + 2)); setError(null); } }, [open, listing]);
    useEffect(() => {
        if (!open || listing.lat == null || listing.lng == null) return;
        Promise.all([lostService.countAlertUsers(listing.lat, listing.lng, km), lostService.countAlertUsers(listing.lat, listing.lng, listing.notifyRadiusKm)])
            .then(([a, b]) => setReach(a != null && b != null ? Math.max(0, a - b) : null));
    }, [open, km, listing]);

    const save = async () => {
        setSaving(true);
        try {
            const n = await lostService.expandRadius(listing.id, km);
            showToast(`${n.toLocaleString('tr-TR')} kişiye daha bildirim gitti.`, 'CheckCircle2', 'text-emerald-500 font-bold');
            onSaved(); onClose();
        } catch (e: any) { setError(e?.message || 'Genişletilemedi.'); } finally { setSaving(false); }
    };

    return (
        <Sheet open={open} onClose={onClose} title="Bildirim alanını genişlet">
            {listing.notifyRadiusKm >= 10 ? (
                <p className="text-sm font-semibold text-secondary">Bildirim alanı zaten en geniş (10 km). İlanı paylaşmak en etkili yol.</p>
            ) : (
                <>
                    <div className="flex items-center justify-between"><span className="text-sm font-bold">Şu an {listing.notifyRadiusKm} km</span><span className="text-sm font-black text-accent">{km} km</span></div>
                    <input type="range" min={listing.notifyRadiusKm + 1} max={10} value={km} onChange={e => setKm(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-secondary">{reach == null ? 'Hesaplanıyor…' : `Yeni alanda ${reach.toLocaleString('tr-TR')} kişiye daha bildirim gidecek.`}</p>
                    <ErrorText>{error}</ErrorText>
                    <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Gönderiliyor…' : 'Genişlet ve bildir'}</PrimaryButton>
                </>
            )}
        </Sheet>
    );
}

function ResolveSheet({ open, mode, onClose, listing, onDone }: {
    open: boolean; mode: 'reunited' | 'closed'; onClose: () => void; listing: LostListing; onDone: (r: 'reunited' | 'closed') => void;
}) {
    const [thank, setThank] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const go = async () => {
        setSaving(true);
        try { await lostService.resolve(listing.id, mode, thank); onDone(mode); } catch (e: any) { setError(e?.message || 'İşlem tamamlanamadı.'); setSaving(false); }
    };
    return (
        <Sheet open={open} onClose={onClose} title={mode === 'reunited' ? 'Kavuştunuz mu?' : 'İlanı kapat'}>
            <p className="text-sm font-semibold text-secondary">
                {mode === 'reunited'
                    ? 'İlan "kavuştu" olarak işaretlenir, yakın çevre bildirimi durur' + (listing.petId ? ' ve künyesi kayıp modundan çıkar.' : '.')
                    : 'İlan yayından kalkar' + (listing.petId ? ' ve künyesi kayıp modundan çıkar.' : '.')}
            </p>
            {mode === 'reunited' && (
                <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                    <ToggleRow on={thank} onChange={setThank} label="Yardım edenlere teşekkür gönder" hint="Görülme bildirimi gönderen üyelere bildirim gider" />
                </div>
            )}
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={go} disabled={saving}>{saving ? 'Kaydediliyor…' : mode === 'reunited' ? 'Evet, kavuştuk' : 'İlanı kapat'}</PrimaryButton>
        </Sheet>
    );
}
