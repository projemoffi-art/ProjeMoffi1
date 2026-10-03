'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { share as shareApi } from "@/native";
import { useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, ClipboardList, Download, Share2, X } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import { HealthHeader, LoadingBlocks, PrimaryButton, SectionTitle, SoftButton } from '@/components/health/HealthUI';
import { HealthReport, SHARE_SECTIONS } from '@/components/health/HealthReport';
import { ageText } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { genderMark } from '@/lib/petIdentity';
import { healthService } from '@/services/healthService';
import type { ShareLink, ShareSection } from '@/types/health';
import { cn, showToast } from '@/lib/utils';

const DURATIONS = [
    { days: 1, label: '1 gün' },
    { days: 7, label: '7 gün' },
    { days: 30, label: '30 gün' },
];

const sectionLabel = (s: ShareSection) => SHARE_SECTIONS.find(x => x.id === s)?.label || s;
const linkUrl = (token: string) => `${window.location.origin}/p/${token}`;

// Referans Ekran 10 — Pasaport Paylaşımı. Hiçbir bölüm önceden seçili değildir; sahip ne
// paylaşacağını ve bağlantının ne kadar açık kalacağını kendisi seçer, istediği an kapatır.
export default function PassportSharePage() {
    return <Suspense fallback={null}><ShareContent /></Suspense>;
}

function ShareContent() {
    const params = useSearchParams();
    const { pet, bundle, today, loading } = useHealth();
    const [sections, setSections] = useState<Set<ShareSection>>(() =>
        params.get('bolum') === 'asilar' ? new Set<ShareSection>(['identity', 'vaccines']) : new Set());
    const [days, setDays] = useState(7);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<ShareLink | null>(null);
    const [links, setLinks] = useState<ShareLink[]>([]);

    const loadLinks = useCallback(async () => {
        if (!pet) return;
        try { setLinks(await healthService.listShareLinks(pet.id)); } catch { /* liste boş kalır */ }
    }, [pet]);
    useEffect(() => { setCreated(null); loadLinks(); }, [loadLinks]);

    const toggle = (s: ShareSection) => setSections(cur => { const n = new Set(cur); if (n.has(s)) n.delete(s); else n.add(s); return n; });
    const ordered = useMemo(() => SHARE_SECTIONS.map(s => s.id).filter(id => sections.has(id)), [sections]);

    const create = async () => {
        if (!pet || ordered.length === 0) return;
        setCreating(true);
        try {
            const link = await healthService.createShareLink(pet.id, ordered, days);
            setCreated(link);
            loadLinks();
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Bağlantı oluşturulamadı.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setCreating(false);
        }
    };

    const revoke = async (id: string) => {
        try {
            await healthService.revokeShareLink(id);
            if (created?.id === id) setCreated(null);
            loadLinks();
            showToast('Bağlantı kapatıldı, artık açılmaz.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Bağlantı kapatılamadı.', 'AlertCircle', 'text-red-500 font-bold');
        }
    };

    const active = links.filter(l => !l.revokedAt && new Date(l.expiresAt) > new Date());
    const age = pet ? ageText(pet.birthday, pet.age, today) : null;

    return (
        <>
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #health-report, #health-report * { visibility: visible !important; }
                #health-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 24px; background: #fff; color: #111; }
                @page { margin: 14mm; }
            }`}</style>
            <HealthHeader title="Pasaportu paylaş" backHref="/pasaport" />
            <main className="max-w-2xl mx-auto px-4 space-y-5 print:hidden">
                {loading || !pet ? <LoadingBlocks count={3} /> : (
                    <>
                        <section className="bg-card border border-card-border rounded-3xl p-4 flex items-center gap-4">
                            <PetAvatar src={pet.image} name={pet.name} className="w-20 h-20 rounded-2xl text-2xl shrink-0" />
                            <div className="min-w-0">
                                <div className="text-lg font-black truncate">{pet.name} <span className="text-accent">{genderMark(pet.gender)}</span></div>
                                <div className="text-sm font-semibold text-secondary truncate">{[pet.breed, age].filter(Boolean).join(' · ')}</div>
                                <div className="text-xs font-bold text-secondary mt-1">Moffi Pet Pasaportu · {pet.passport_no}</div>
                            </div>
                        </section>

                        <section>
                            <SectionTitle>Paylaşılacak bilgileri seç</SectionTitle>
                            <div className="grid grid-cols-2 gap-2">
                                {SHARE_SECTIONS.map(s => {
                                    const on = sections.has(s.id);
                                    return (
                                        <button key={s.id} onClick={() => toggle(s.id)} role="checkbox" aria-checked={on}
                                            className={cn('flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-colors',
                                                on ? 'border-accent bg-accent/5' : 'border-card-border bg-card')}>
                                            <span className={cn('w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0', on ? 'bg-accent border-accent' : 'border-card-border')}>
                                                {on && <Check className="w-3.5 h-3.5 text-white" />}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold leading-tight">{s.label}</span>
                                                {s.hint && <span className="block text-[11px] font-semibold text-secondary leading-snug mt-0.5">{s.hint}</span>}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] font-semibold text-secondary mt-2">Seçmediğin hiçbir bilgi paylaşılmaz. Adı, türü, ırkı ve fotoğrafı her zaman görünür.</p>
                        </section>

                        <section>
                            <SectionTitle>Bağlantı ne kadar açık kalsın?</SectionTitle>
                            <div className="flex gap-2">
                                {DURATIONS.map(o => (
                                    <button key={o.days} onClick={() => setDays(o.days)}
                                        className={cn('flex-1 h-10 rounded-xl text-sm font-bold border', days === o.days ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="space-y-2.5">
                            <PrimaryButton onClick={create} disabled={ordered.length === 0 || creating}>
                                <Share2 className="w-4 h-4" /> {creating ? 'Oluşturuluyor…' : 'Paylaşılabilir bağlantı oluştur'}
                            </PrimaryButton>
                            <SoftButton onClick={() => window.print()} className={cn(ordered.length === 0 || !bundle ? 'opacity-50 pointer-events-none' : '')}>
                                <Download className="w-4 h-4" /> PDF olarak indir
                            </SoftButton>
                            <p className="text-[11px] font-semibold text-secondary">PDF için açılan pencerede &quot;PDF olarak kaydet&quot;i seç.</p>
                        </div>

                        {created && <CreatedLink link={created} petName={pet.name} onRevoke={() => revoke(created.id)} />}

                        {active.length > 0 && (
                            <section>
                                <SectionTitle>Açık bağlantıların</SectionTitle>
                                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                    {active.map(l => (
                                        <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold line-clamp-2">{l.sections.map(sectionLabel).join(', ')}</div>
                                                <div className="text-xs font-semibold text-secondary">
                                                    {formatDateKeyTr(new Date(l.expiresAt).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }), { day: 'numeric', month: 'long' })} tarihine kadar açık · {l.viewCount} kez açıldı
                                                </div>
                                            </div>
                                            <button onClick={() => { shareApi.copyText(linkUrl(l.token)); showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }}
                                                aria-label="Bağlantıyı kopyala" className="w-9 h-9 rounded-xl border border-card-border flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => revoke(l.id)} className="h-9 px-3 rounded-xl border border-red-200 text-red-600 dark:border-red-500/30 dark:text-red-300 text-xs font-black shrink-0">
                                                Kapat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Sadece yazdırırken görünür: "PDF olarak indir" seçilen bölümleri basar. */}
            {pet && bundle && (
                <div className="hidden print:block">
                    <HealthReport
                        identity={{
                            name: pet.name, type: pet.type, breed: pet.breed, gender: pet.gender, birthDate: pet.birthday, age: pet.age,
                            color: pet.color, microchipNo: pet.microchip, petvetNo: pet.petvet_no,
                            neutered: pet.neutered ?? null, passportNo: pet.passport_no,
                        }}
                        bundle={bundle} today={today} sections={sections}
                        documents={bundle.documents.map(x => ({ id: x.id, category: x.category, title: x.title, docDate: x.docDate }))}
                        generatedLabel={`Oluşturulma: ${formatDateKeyTr(today, { day: 'numeric', month: 'long', year: 'numeric' })} · Moffi`}
                    />
                </div>
            )}
        </>
    );
}

function CreatedLink({ link, petName, onRevoke }: { link: ShareLink; petName: string; onRevoke: () => void }) {
    const url = linkUrl(link.token);
    const canvasId = `share-qr-${link.id}`;

    const share = async () => {
        const r = await shareApi.shareOrCopy({ title: `${petName} — Pet Pasaportu`, url, copyText: url });
        if (r === 'copied') showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold');
    };

    const downloadQr = () => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${petName}-pasaport-qr.png`;
        a.click();
    };

    return (
        <section className="rounded-3xl border border-accent/30 bg-accent/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-black">Bağlantın hazır</div>
                    <div className="text-xs font-semibold text-secondary">Bağlantıyı alan kişi sadece seçtiğin bölümleri görür.</div>
                </div>
                <button onClick={onRevoke} aria-label="Bağlantıyı kapat" className="w-8 h-8 rounded-full border border-card-border bg-card flex items-center justify-center shrink-0">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shrink-0">
                    <QRCodeCanvas id={canvasId} value={url} size={112} marginSize={1} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-xs font-bold break-all bg-card border border-card-border rounded-xl px-3 py-2">{url}</div>
                    <div className="flex gap-2">
                        <button onClick={share} className="flex-1 h-10 rounded-xl bg-accent text-white text-xs font-black flex items-center justify-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5" /> Gönder
                        </button>
                        <button onClick={downloadQr} className="flex-1 h-10 rounded-xl border border-card-border bg-card text-xs font-black flex items-center justify-center gap-1.5">
                            <Download className="w-3.5 h-3.5" /> QR indir
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
