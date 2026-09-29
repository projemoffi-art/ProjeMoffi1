'use client';

// Referans Ekran 12 — İlan Yönetimi (sahip): istatistik, gelen başvurular, görüşme, düzenleme, paylaşım,
// durdurma ve "sahiplendirildi" olarak kapatma (isteğe bağlı pasaport devri).

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, ChevronRight, ClipboardList, Download, Eye, Share2, X } from 'lucide-react';
import { HealthHeader, ErrorText, LoadingBlocks, PrimaryButton, Sheet } from '@/components/health/HealthUI';
import { RadioRow, ToggleRow } from '@/components/lost/LostUI';
import { ApplicationStatusBadge, ListingStatusBadge, downloadQr, listingFacts, shareListing } from '@/components/adoption/AdoptionUI';
import { adoptionService, type AdoptionApplication, type AdoptionListing, type PetTransfer } from '@/services/adoptionService';
import { showToast } from '@/lib/utils';

type SheetKind = null | 'apps' | 'interview' | 'share' | 'complete' | 'close';

export default function ManageAdoptionPage() {
    return <Suspense fallback={null}><Manage /></Suspense>;
}

function Manage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const params = useSearchParams();
    const [listing, setListing] = useState<AdoptionListing | null | undefined>(undefined);
    const [stats, setStats] = useState<{ views: number; applications: number; interviews: number; shares: number; notified: number; favorites: number } | null>(null);
    const [apps, setApps] = useState<AdoptionApplication[]>([]);
    const [transfer, setTransfer] = useState<PetTransfer | null>(null);
    const [sheet, setSheet] = useState<SheetKind>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const l = await adoptionService.get(id).catch(() => null);
        setListing(l);
        if (!l || !l.isMine) return;
        const [s, a, t] = await Promise.all([adoptionService.ownerStats(id), adoptionService.receivedApplications(id).catch(() => []), adoptionService.transferForListing(id)]);
        setStats(s); setApps(a); setTransfer(t);
    }, [id]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (params.get('complete')) setSheet('complete'); }, [params]);

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!listing || !listing.isMine) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Bu ilanı sadece sahibi yönetebilir</h1>
                <Link href={`/sahiplendirme/${id}`} className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">İlanı görüntüle</Link>
            </main>
        );
    }
    const l = listing;
    const editable = l.status === 'active' || l.status === 'paused';
    const openApps = apps.filter(a => a.status === 'pending' || a.status === 'interview' || a.status === 'accepted');

    const togglePause = async () => {
        setBusy(true);
        try {
            await adoptionService.setStatus(l.id, l.status === 'active' ? 'paused' : 'active');
            showToast(l.status === 'active' ? 'İlan durduruldu; listede görünmez ve başvuru almaz.' : 'İlan yeniden yayında.', 'CheckCircle2', 'text-emerald-500 font-bold');
            load();
        } catch (e: any) {
            showToast(e?.message || 'Güncellenemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    const rows: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string; tone?: string; hidden?: boolean }[] = [
        { icon: <ClipboardList className="w-5 h-5" />, label: `Gelen başvurular (${apps.length})`, onClick: () => setSheet('apps') },
        { icon: <Calendar className="w-5 h-5" />, label: 'Görüşme planla', onClick: () => setSheet('interview'), hidden: !editable },
        { icon: <span className="w-5 h-5 flex items-center justify-center text-base">✎</span>, label: 'İlanı düzenle', href: `/sahiplendirme/ilan-ver?edit=${l.id}`, hidden: !editable },
        { icon: <Share2 className="w-5 h-5" />, label: 'Paylaş (QR / PDF)', onClick: () => setSheet('share'), hidden: l.status !== 'active' },
        { icon: <span className="w-5 h-5 flex items-center justify-center text-base">⏸</span>, label: l.status === 'paused' ? 'İlanı yeniden yayınla' : 'İlanı durdur', onClick: togglePause, hidden: !editable },
        { icon: <span className="w-5 h-5 flex items-center justify-center text-base">🏠</span>, label: 'İlanı kapat (sahiplendirildi)', onClick: () => setSheet('complete'), tone: 'text-accent', hidden: !editable },
        { icon: <X className="w-5 h-5" />, label: 'İlanı kaldır (sahiplendirilmedi)', onClick: () => setSheet('close'), tone: 'text-red-600', hidden: !editable },
    ];

    return (
        <>
            <HealthHeader title="İlan Yönetimi" backHref="/sahiplendirme" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <div className="bg-card border border-card-border rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                        {l.photos[0] && <img src={l.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                        <div className="flex-1 min-w-0">
                            <div className="text-base font-black truncate">{l.petName}</div>
                            <div className="text-xs font-semibold text-secondary truncate">{listingFacts(l)}</div>
                        </div>
                        <ListingStatusBadge status={l.status} />
                    </div>
                    <Link href={`/sahiplendirme/${l.id}`} className="h-9 rounded-xl border border-accent/30 bg-accent/5 text-accent text-xs font-black flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4" /> İlanı görüntüle
                    </Link>
                </div>

                {l.status === 'paused' && (
                    <p className="rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25 p-3 text-xs font-bold text-amber-800 dark:text-amber-200">
                        İlan durduruldu: listede görünmüyor ve yeni başvuru almıyor. Mevcut başvurular duruyor.
                    </p>
                )}
                {l.status === 'removed' && (
                    <p className="rounded-2xl bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/25 p-3 text-xs font-bold text-red-700 dark:text-red-200">
                        Bu ilan topluluk kurallarına uymadığı için yayından kaldırıldı.
                    </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                    {[{ v: stats?.views, l: 'Görüntüleme' }, { v: stats?.applications, l: 'Başvuru' }, { v: stats?.interviews, l: 'Görüşme' }].map(s => (
                        <div key={s.l} className="bg-card border border-card-border rounded-2xl p-3 text-center">
                            <div className="text-xl font-black">{s.v == null ? '—' : s.v.toLocaleString('tr-TR')}</div>
                            <div className="text-[11px] font-bold text-secondary">{s.l}</div>
                        </div>
                    ))}
                </div>
                {stats && (
                    <p className="text-[11px] font-semibold text-secondary px-1">
                        {stats.favorites.toLocaleString('tr-TR')} kişi kaydetti · {stats.shares.toLocaleString('tr-TR')} paylaşım · {stats.notified.toLocaleString('tr-TR')} kişiye yakın çevre bildirimi gitti
                    </p>
                )}

                {transfer && (
                    <div className="bg-card border border-card-border rounded-2xl p-3 text-xs font-semibold">
                        <span className="font-black">Pasaport devri: </span>
                        {{ pending: 'yeni ailenin onayını bekliyor', accepted: 'tamamlandı; pasaport yeni ailesinde', rejected: 'yeni aile reddetti; pasaport sende', cancelled: 'iptal edildi', expired: 'süresi doldu' }[transfer.status]}
                    </div>
                )}

                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                    {rows.filter(r => !r.hidden).map(r => {
                        const inner = (
                            <>
                                <span className="text-secondary">{r.icon}</span>
                                <span className={`flex-1 text-sm font-bold ${r.tone || ''}`}>{r.label}</span>
                                <ChevronRight className="w-4 h-4 text-secondary" />
                            </>
                        );
                        return r.href
                            ? <Link key={r.label} href={r.href} className="flex items-center gap-3 px-4 h-13 py-3.5">{inner}</Link>
                            : <button key={r.label} onClick={r.onClick} disabled={busy} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">{inner}</button>;
                    })}
                </div>
            </main>

            <Sheet open={sheet === 'apps' || sheet === 'interview'} onClose={() => setSheet(null)} title={sheet === 'interview' ? 'Kiminle görüşeceksin?' : 'Gelen başvurular'}>
                {(sheet === 'interview' ? apps.filter(a => a.status === 'pending' || a.status === 'interview') : apps).length === 0 ? (
                    <p className="text-sm font-semibold text-secondary">{sheet === 'interview' ? 'Görüşme planlanabilecek açık başvuru yok.' : 'Henüz başvuru yok. İlanı paylaştıkça daha çok kişiye ulaşır.'}</p>
                ) : (sheet === 'interview' ? apps.filter(a => a.status === 'pending' || a.status === 'interview') : apps).map(a => (
                    <Link key={a.id} href={`/sahiplendirme/basvuru/${a.id}`} className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
                        {a.applicant?.avatar ? <img src={a.applicant.avatar} alt="" className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-card-border/50" />}
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-black truncate">{a.fullName}</span>
                            <span className="block text-xs font-semibold text-secondary truncate">{a.message}</span>
                        </span>
                        <ApplicationStatusBadge status={a.status} />
                    </Link>
                ))}
            </Sheet>

            <Sheet open={sheet === 'share'} onClose={() => setSheet(null)} title="Paylaş">
                <div className="flex justify-center"><QRCodeCanvas id="manage-qr" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sahiplendirme/${l.id}`} size={200} marginSize={2} /></div>
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => downloadQr('manage-qr', 'moffi-sahiplendirme-qr.png')} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black">QR indir</button>
                    <Link href={`/sahiplendirme/${l.id}/el-ilani`} className="h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> PDF indir</Link>
                </div>
                <PrimaryButton onClick={() => shareListing(l)}><Share2 className="w-4 h-4" /> Bağlantıyı paylaş</PrimaryButton>
            </Sheet>

            <CompleteSheet open={sheet === 'complete'} onClose={() => setSheet(null)} listing={l} apps={openApps} preselect={params.get('complete')}
                onDone={t => router.replace(`/sahiplendirme/${l.id}/sahiplendirildi${t ? '?devir=1' : ''}`)} />
            <CloseSheet open={sheet === 'close'} onClose={() => setSheet(null)} listing={l} openCount={openApps.length} onDone={() => router.replace('/sahiplendirme')} />
        </>
    );
}

function CompleteSheet({ open, onClose, listing, apps, preselect, onDone }: {
    open: boolean; onClose: () => void; listing: AdoptionListing; apps: AdoptionApplication[]; preselect: string | null; onDone: (transferId: string | null) => void;
}) {
    const [choice, setChoice] = useState<string>('outside');
    const [transfer, setTransfer] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null); setTransfer(true);
        const pre = apps.find(a => a.id === preselect) || apps.find(a => a.status === 'accepted');
        setChoice(pre ? pre.id : apps.length ? apps[0].id : 'outside');
    }, [open, apps, preselect]);

    const go = async () => {
        setSaving(true); setError(null);
        try {
            const appId = choice === 'outside' ? null : choice;
            const t = await adoptionService.complete(listing.id, appId, !!appId && !!listing.petId && transfer);
            onDone(t);
        } catch (e: any) {
            setError(e?.message || 'Kapatılamadı.');
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onClose={onClose} title={`${listing.petName} kime sahiplendirildi?`}>
            <div className="space-y-2">
                {apps.map(a => (
                    <RadioRow key={a.id} checked={choice === a.id} onClick={() => setChoice(a.id)} label={a.fullName}
                        hint={a.status === 'accepted' ? 'Kabul ettiğin başvuru' : a.status === 'interview' ? 'Görüşme planlanmış' : 'Başvuru inceleniyor'} />
                ))}
                <RadioRow checked={choice === 'outside'} onClick={() => setChoice('outside')} label="Moffi dışından biri" hint="İlan kapanır; pasaport sende kalır" />
            </div>
            {listing.petId && choice !== 'outside' && (
                <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                    <ToggleRow on={transfer} onChange={setTransfer} label="Pasaportu yeni ailesine devret"
                        hint="Aşı, muayene ve kilo geçmişi hayvanla birlikte gider. Yeni aile kabul edince pasaport senin hesabından çıkar; senin iletişim bilgilerin ve paylaşım bağlantıların kaldırılır." />
                </div>
            )}
            <p className="text-xs font-semibold text-secondary">Diğer açık başvurular kibar bir mesajla sonuçlandırılır.</p>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={go} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Sahiplendirildi olarak kapat'}</PrimaryButton>
        </Sheet>
    );
}

function CloseSheet({ open, onClose, listing, openCount, onDone }: { open: boolean; onClose: () => void; listing: AdoptionListing; openCount: number; onDone: () => void }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const go = async () => {
        setSaving(true); setError(null);
        try { await adoptionService.setStatus(listing.id, 'closed'); showToast('İlan kaldırıldı.', 'CheckCircle2', 'text-emerald-500 font-bold'); onDone(); }
        catch (e: any) { setError(e?.message || 'Kaldırılamadı.'); setSaving(false); }
    };
    return (
        <Sheet open={open} onClose={onClose} title="İlanı kaldır">
            <p className="text-sm font-semibold text-secondary">
                İlan yayından kalkar ve tekrar açılamaz.{openCount ? ` ${openCount} açık başvuruya kibar bir mesajla haber verilir.` : ''} Geçici olarak durdurmak istiyorsan "İlanı durdur"u kullan.
            </p>
            <ErrorText>{error}</ErrorText>
            <button onClick={go} disabled={saving} className="w-full h-12 rounded-2xl bg-red-600 text-white font-black text-sm disabled:opacity-50">{saving ? 'Kaldırılıyor…' : 'İlanı kaldır'}</button>
        </Sheet>
    );
}
