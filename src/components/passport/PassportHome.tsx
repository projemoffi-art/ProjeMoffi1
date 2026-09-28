'use client';

// Referans Ekran 1 — Pet Pasaportu ana ekranı (design-reference/passport-final).
// Hem /pasaport sayfası hem profildeki Pasaport sekmesi bunu gösterir.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { AlertCircle, CheckCircle2, ChevronRight, MapPin, Share2, X } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import { EmptyState, HealthCard, LoadingBlocks, MODULES, ModuleIcon, SectionTitle, type HealthModule } from '@/components/health/HealthUI';
import { ageText, daysLeftText, overallStatus, upcomingItems } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { genderMark } from '@/lib/petIdentity';
import { healthService } from '@/services/healthService';
import type { TagReport } from '@/types/health';
import { cn, showToast } from '@/lib/utils';

const TILES: HealthModule[] = ['kimlik', 'karne', 'asilar', 'ilaclar', 'belgeler'];
const TILE_LABEL: Partial<Record<HealthModule, string>> = { karne: 'Sağlık' };

export function PassportHome() {
    const { pet, bundle, appointments, today, loading } = useHealth();

    const status = useMemo(() => (bundle ? overallStatus(bundle, today) : null), [bundle, today]);
    const upcoming = useMemo(() => (bundle ? upcomingItems(bundle, appointments, today).filter(i => i.daysLeft <= 120).slice(0, 3) : []), [bundle, appointments, today]);

    if (!loading && !pet) {
        return (
            <EmptyState title="Henüz evcil hayvan eklemedin" text="Pasaport, eklediğin her evcil hayvan için ayrı tutulur."
                action={<Link href="/home" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Ana sayfaya dön</Link>} />
        );
    }
    if (!pet) return <LoadingBlocks count={3} />;

    const age = ageText(pet.birthday, pet.age, today);

    return (
        <div className="space-y-5">
            <section className="bg-card border border-card-border rounded-3xl p-4">
                <div className="flex gap-4">
                    <PetAvatar src={pet.image} name={pet.name} className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl text-4xl shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-2xl font-black break-words leading-tight">{pet.name} <span className="text-accent text-xl">{genderMark(pet.gender)}</span></div>
                                {pet.breed && <div className="text-sm font-semibold text-secondary line-clamp-2">{pet.breed}</div>}
                                {age && <div className="text-sm font-semibold text-secondary">{age}</div>}
                            </div>
                            <Link href="/pasaport/paylas" aria-label="Pasaportu paylaş"
                                className="w-10 h-10 rounded-xl border border-card-border flex items-center justify-center shrink-0">
                                <Share2 className="w-4.5 h-4.5" />
                            </Link>
                        </div>
                        <div className="mt-auto pt-3 flex flex-wrap items-end justify-between gap-2">
                            {pet.petvet_no ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25 text-[11px] font-black">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> PETVET kayıtlı
                                </span>
                            ) : (
                                <Link href="/pasaport/kimlik" className="text-[11px] font-bold text-secondary underline underline-offset-2">PETVET no ekle</Link>
                            )}
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-secondary">Pasaport no</div>
                                <div className="text-xs font-black tabular-nums">{pet.passport_no || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-5 gap-2">
                {TILES.map(m => (
                    <Link key={m} href={MODULES[m].href} className="flex flex-col items-center gap-1.5 py-1">
                        <ModuleIcon module={m} />
                        <span className="text-[11px] font-bold text-center leading-tight">{TILE_LABEL[m] || MODULES[m].label}</span>
                    </Link>
                ))}
            </div>

            <TagReports petId={pet.id} isLost={!!pet.is_lost} />

            {loading || !bundle || !status ? <LoadingBlocks count={2} /> : (
                <>
                    <HealthCard href="/health/karne" className="p-4 flex items-center gap-3.5">
                        <span className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white',
                            status.tone === 'good' ? 'bg-emerald-500' : status.tone === 'attention' ? 'bg-amber-500' : 'bg-red-500')}>
                            {status.tone === 'good' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-secondary">Sağlık durumu</div>
                            <div className={cn('text-lg font-black leading-tight', status.tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : status.tone === 'attention' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>
                                {status.title}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                    </HealthCard>

                    <section>
                        <SectionTitle action={<Link href="/health" className="text-xs font-bold text-secondary">Tümünü gör</Link>}>Yaklaşan işlemler</SectionTitle>
                        {upcoming.length === 0 ? (
                            <HealthCard className="p-4"><p className="text-sm font-semibold text-secondary">Yaklaşan bir iş yok.</p></HealthCard>
                        ) : (
                            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                {upcoming.map(i => (
                                    <Link key={i.id} href={i.href} className="flex items-center gap-3 px-4 py-3">
                                        <ModuleIcon module={i.kind === 'vaccine' ? 'asilar' : i.kind === 'parasite' ? 'parazit' : 'muayeneler'} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black line-clamp-2">{i.title}</div>
                                            <div className="text-xs font-semibold text-secondary">{formatDateKeyTr(i.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                        <span className={cn('text-sm font-black whitespace-nowrap', i.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-accent')}>
                                            {daysLeftText(i.daysLeft)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <TagSection petId={pet.id} petName={pet.name} isLost={!!pet.is_lost} />

            <Link href="/pasaport/paylas" className="w-full h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Pasaportu paylaş
            </Link>
            <p className="text-[11px] font-semibold text-secondary text-center -mt-2">
                Pasaportun kimseye açık değil. Paylaşırken hangi bilgilerin gideceğini ve ne kadar süre açık kalacağını sen seçersin.
            </p>
        </div>
    );
}

/**
 * Künye = hayvanın künye sayfasını (/id/<id>) açan QR. Sahip QR'ı indirip künyeye bastırır ya da
 * adresi bir NFC etikete yazar. Sayfa kayıp modu kapalıyken sadece ad, ırk ve fotoğraf gösterir.
 */
function TagSection({ petId, petName, isLost }: { petId: string; petName: string; isLost: boolean }) {
    const [url, setUrl] = useState('');
    useEffect(() => { setUrl(`${window.location.origin}/id/${petId}`); }, [petId]);
    const canvasId = `tag-qr-${petId}`;

    const download = () => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!canvas) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${petName}-kunye-qr.png`;
        a.click();
    };

    return (
        <section>
            <SectionTitle>Künye</SectionTitle>
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shrink-0">
                        {url && <QRCodeCanvas id={canvasId} value={url} size={96} marginSize={1} />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className={cn('text-sm font-black', isLost ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                            {isLost ? 'Kayıp modu açık' : 'Güvende'}
                        </div>
                        <p className="text-xs font-semibold text-secondary">
                            {isLost
                                ? 'Künyeyi okutan kişi izin verdiğin iletişim ve acil sağlık bilgilerini görür, sana konum ya da mesaj bırakabilir.'
                                : 'Künyeyi okutan kişi sadece adını, ırkını ve fotoğrafını görür.'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={download} className="h-10 rounded-xl border border-card-border text-xs font-black">QR'ı indir</button>
                    <button onClick={() => { navigator.clipboard?.writeText(url); showToast('Künye adresi kopyalandı. NFC etikete bu adresi yazabilirsin.', 'CheckCircle2', 'text-emerald-500 font-bold'); }}
                        className="h-10 rounded-xl border border-card-border text-xs font-black">Adresi kopyala</button>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-sos-center'))}
                    className={cn('w-full h-10 rounded-xl text-xs font-black border',
                        isLost ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : 'border-red-200 text-red-600 dark:border-red-500/30 dark:text-red-300')}>
                    {isLost ? 'Kayıp merkezini aç' : 'Kayıp modunu aç'}
                </button>
            </div>
        </section>
    );
}

/** Künyeyi okutan kişinin gönderdiği haberler (sadece kayıp modunda gelir). */
function TagReports({ petId, isLost }: { petId: string; isLost: boolean }) {
    const [reports, setReports] = useState<TagReport[]>([]);

    useEffect(() => {
        let alive = true;
        healthService.getTagReports(petId).then(r => { if (alive) setReports(r); }).catch(() => {});
        return () => { alive = false; };
    }, [petId]);

    if (reports.length === 0) return null;

    const remove = async (id: string) => {
        try {
            await healthService.deleteTagReport(id);
            setReports(rs => rs.filter(r => r.id !== id));
        } catch (e: any) {
            showToast(e?.message || 'Bildirim silinemedi.', 'AlertCircle', 'text-red-500 font-bold');
        }
    };

    return (
        <section>
            <SectionTitle>{isLost ? 'Künyeden gelen haberler' : 'Önceki künye haberleri'}</SectionTitle>
            <div className="bg-card border border-red-200 dark:border-red-500/25 rounded-2xl divide-y divide-card-border">
                {reports.map(r => (
                    <div key={r.id} className="px-4 py-3 flex gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-xs font-bold text-secondary">
                                {new Date(r.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {r.message && <p className="text-sm font-semibold whitespace-pre-wrap">{r.message}</p>}
                            {r.contact && <p className="text-xs font-bold">İletişim: {r.contact}</p>}
                            {r.latitude != null && r.longitude != null && (
                                <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-black text-accent">
                                    <MapPin className="w-3.5 h-3.5" /> Konumu haritada aç
                                </a>
                            )}
                        </div>
                        <button onClick={() => remove(r.id)} aria-label="Bildirimi sil" className="w-8 h-8 rounded-full border border-card-border flex items-center justify-center shrink-0">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
