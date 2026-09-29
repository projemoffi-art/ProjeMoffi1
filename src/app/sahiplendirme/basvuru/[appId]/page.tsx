'use client';

// Referans Ekran 13 — Başvuru Detayı. İlan sahibi: reddet / görüşme planla / kabul et / mesaj.
// Başvuran: kendi başvurusunu, görüşme bilgisini ve (varsa) pasaport devrini görür, geri çekebilir.

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { HealthHeader, ErrorText, Field, LoadingBlocks, PrimaryButton, Sheet, TextArea, TextInput } from '@/components/health/HealthUI';
import { ApplicationStatusBadge } from '@/components/adoption/AdoptionUI';
import { TransferCard } from '@/components/adoption/TransferCard';
import { toLocalInput } from '@/components/lost/LostUI';
import { adoptionService, EXPERIENCE, HOME_TYPES, HOUSEHOLD, type AdoptionApplication } from '@/services/adoptionService';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { showToast } from '@/lib/utils';

export default function ApplicationDetailPage() {
    const { appId } = useParams<{ appId: string }>();
    const { user } = useAuth();
    const { openChat } = useChat();
    const [app, setApp] = useState<AdoptionApplication | null | undefined>(undefined);
    const [sheet, setSheet] = useState<null | 'interview' | 'reject' | 'accept'>(null);
    const [withdrawing, setWithdrawing] = useState(false);

    const load = useCallback(() => { adoptionService.application(appId).then(setApp).catch(() => setApp(null)); }, [appId]);
    useEffect(() => { load(); }, [load]);

    if (app === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!app) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Başvuru bulunamadı</h1>
                <p className="text-sm font-semibold text-secondary">Başvuruyu sadece başvuran kişi ve ilan sahibi görebilir.</p>
                <Link href="/sahiplendirme/basvurularim" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Başvurularım</Link>
            </main>
        );
    }

    const isOwner = user?.id === app.ownerId;
    const open = app.status === 'pending' || app.status === 'interview';
    const listingOpen = app.listing?.status === 'active' || app.listing?.status === 'paused';
    const household = app.household.map(h => HOUSEHOLD.find(x => x.id === h)?.label || h);
    const experience = EXPERIENCE.find(x => x.id === app.experience)?.label;

    const withdraw = async () => {
        if (!window.confirm('Başvurunu geri çekmek istediğine emin misin?')) return;
        setWithdrawing(true);
        try { await adoptionService.withdraw(app.id); load(); }
        catch (e: any) { showToast(e?.message || 'Geri çekilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setWithdrawing(false); }
    };

    return (
        <>
            <HealthHeader title={isOwner ? 'Başvuru Detayı' : 'Başvurum'} backHref={isOwner ? '/sahiplendirme/basvurularim?tab=received' : '/sahiplendirme/basvurularim'} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <div className="flex items-center gap-3">
                    {isOwner
                        ? (app.applicant?.avatar ? <img src={app.applicant.avatar} alt="" className="w-14 h-14 rounded-full object-cover" /> : <span className="w-14 h-14 rounded-full bg-card border border-card-border" />)
                        : (app.listing?.photos[0] ? <img src={app.listing.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <span className="w-14 h-14 rounded-xl bg-card border border-card-border" />)}
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-black truncate">{isOwner ? app.fullName : app.listing?.petName}</div>
                        <div className="text-xs font-semibold text-secondary">
                            {isOwner && app.listing ? `${app.listing.petName} · ` : ''}
                            {new Date(app.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                </div>

                {!isOwner && app.transfer && <TransferCard transfer={app.transfer} petName={app.listing?.petName || 'Dostun'} onDone={load} />}

                {app.status === 'interview' && app.interviewAt && (
                    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3">
                        <div className="text-xs font-bold text-secondary">Görüşme</div>
                        <div className="text-sm font-black">{new Date(app.interviewAt).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                        {app.interviewNote && <p className="text-sm font-semibold mt-1">{app.interviewNote}</p>}
                    </div>
                )}
                {app.ownerNote && (app.status === 'rejected' || app.status === 'accepted') && (
                    <div className="rounded-2xl bg-card border border-card-border p-3">
                        <div className="text-xs font-bold text-secondary">İlan sahibinin notu</div>
                        <p className="text-sm font-semibold">{app.ownerNote}</p>
                    </div>
                )}

                <section className="space-y-1">
                    <div className="text-sm font-black">Mesaj</div>
                    <p className="bg-card border border-card-border rounded-2xl p-3 text-sm font-semibold whitespace-pre-wrap">{app.message}</p>
                </section>

                <section className="space-y-1.5">
                    <div className="text-sm font-black">Yaşam ortamı</div>
                    <div className="flex flex-wrap gap-1.5">
                        {[HOME_TYPES.find(h => h.id === app.homeType)?.label, ...app.homeFeatures].filter(Boolean).map(t => (
                            <span key={t} className="px-2.5 h-8 inline-flex items-center rounded-full bg-card border border-card-border text-xs font-bold">{t}</span>
                        ))}
                    </div>
                </section>

                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border text-sm">
                    <Row label="Evde kimler yaşıyor" value={household.join(', ')} />
                    {app.childrenAges && <Row label="Çocukların yaşı" value={app.childrenAges} />}
                    <Row label="Daha önce hayvan sahibi oldu mu" value={[experience, app.experienceNote].filter(Boolean).join(' · ') || 'Belirtilmedi'} />
                    <Row label="Referans / ek bilgi" value={app.reference || 'Belirtilmedi'} />
                </div>

                {isOwner ? (
                    <div className="space-y-2.5">
                        <button onClick={() => openChat(app.applicantId)} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4" /> Mesaj gönder
                        </button>
                        {open && listingOpen && (
                            <>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button onClick={() => setSheet('reject')} className="h-12 rounded-2xl border border-accent/40 text-accent font-black text-sm">Reddet</button>
                                    <PrimaryButton onClick={() => setSheet('interview')}>{app.status === 'interview' ? 'Görüşmeyi değiştir' : 'Görüşme planla'}</PrimaryButton>
                                </div>
                                <button onClick={() => setSheet('accept')} className="w-full h-11 rounded-2xl bg-emerald-600 text-white text-sm font-black">Başvuruyu kabul et</button>
                            </>
                        )}
                        {app.status === 'accepted' && listingOpen && (
                            <Link href={`/sahiplendirme/${app.adoptionId}/yonet?complete=${app.id}`} className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center">
                                Sahiplendirmeyi tamamla
                            </Link>
                        )}
                        {app.status === 'accepted' && listingOpen && (
                            <button onClick={() => setSheet('reject')} className="w-full text-xs font-black text-secondary">Kabulü geri al (başvuruyu reddet)</button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <button onClick={() => openChat(app.ownerId)} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4" /> İlan sahibine yaz
                        </button>
                        <Link href={`/sahiplendirme/${app.adoptionId}`} className="w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center">İlanı görüntüle</Link>
                        {(open || app.status === 'accepted') && listingOpen && (
                            <button onClick={withdraw} disabled={withdrawing} className="w-full text-xs font-black text-red-600">Başvurumu geri çek</button>
                        )}
                    </div>
                )}
            </main>

            {isOwner && <RespondSheet mode={sheet} onClose={() => setSheet(null)} app={app} onDone={load} />}
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-4 py-2.5">
            <div className="text-[11px] font-bold text-secondary">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}

function RespondSheet({ mode, onClose, app, onDone }: { mode: null | 'interview' | 'reject' | 'accept'; onClose: () => void; app: AdoptionApplication; onDone: () => void }) {
    const [when, setWhen] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mode) return;
        setError(null); setNote(mode === 'interview' ? app.interviewNote || '' : '');
        const d = app.interviewAt ? new Date(app.interviewAt) : new Date(Date.now() + 86400000);
        if (!app.interviewAt) d.setHours(14, 0, 0, 0);
        setWhen(toLocalInput(d));
    }, [mode, app]);

    const go = async () => {
        setError(null);
        if (mode === 'interview' && (!when || new Date(when).getTime() < Date.now())) { setError('İleri bir tarih ve saat seç.'); return; }
        setSaving(true);
        try {
            await adoptionService.respond(app.id, mode!, { interviewAt: mode === 'interview' ? new Date(when).toISOString() : null, note });
            showToast(mode === 'interview' ? 'Görüşme planlandı, başvurana haber verildi.' : mode === 'accept' ? 'Başvuru kabul edildi.' : 'Başvuru sonuçlandırıldı.', 'CheckCircle2', 'text-emerald-500 font-bold');
            onDone(); onClose();
        } catch (e: any) {
            setError(e?.message || 'İşlem tamamlanamadı.');
        } finally {
            setSaving(false);
        }
    };

    const title = mode === 'interview' ? 'Görüşme planla' : mode === 'accept' ? 'Başvuruyu kabul et' : 'Başvuruyu reddet';
    return (
        <Sheet open={!!mode} onClose={onClose} title={title}>
            {mode === 'interview' && (
                <Field label="Tarih ve saat"><TextInput type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={e => setWhen(e.target.value)} /></Field>
            )}
            <Field label={mode === 'interview' ? 'Not (yer, görüntülü görüşme vb.)' : 'Başvurana not (isteğe bağlı)'}>
                <TextArea value={note} maxLength={300} onChange={e => setNote(e.target.value)}
                    placeholder={mode === 'reject' ? 'Kibar bir not bırakabilirsin; boş bırakırsan nazik bir hazır mesaj gider.' : mode === 'accept' ? 'Örn: tanışmak için yazıyorum.' : 'Örn: Kadıköy iskelesi önünde buluşalım.'} />
            </Field>
            {mode === 'accept' && <p className="text-xs font-semibold text-secondary">Kabul etmek ilanı kapatmaz. Tanıştıktan sonra ilan yönetiminden "Sahiplendirildi" olarak kapatırsın.</p>}
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={go} disabled={saving}>{saving ? 'Kaydediliyor…' : title}</PrimaryButton>
        </Sheet>
    );
}
