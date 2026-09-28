'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Share2 } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import { DocumentRow, UploadDocumentSheet } from '@/components/health/Documents';
import { EmptyState, HealthCard, HealthHeader, LoadingBlocks, PrimaryButton } from '@/components/health/HealthUI';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { formatKg } from '@/lib/health/derive';
import { healthService } from '@/services/healthService';
import { showToast } from '@/lib/utils';

// Referans Ekran 5 — Kayıt Detayı (muayene).
export default function VisitDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { pet, bundle, loading, run } = useHealth();
    const [uploadOpen, setUploadOpen] = useState(false);

    const record = bundle?.records.find(r => r.id === id) || null;
    const docs = bundle?.documents.filter(d => d.medicalRecordId === id) || [];

    if (loading || !bundle) return <><HealthHeader title="Kayıt Detayı" backHref="/health/muayeneler" /><main className="max-w-2xl mx-auto px-4"><LoadingBlocks /></main></>;
    if (!record) {
        return (
            <>
                <HealthHeader title="Kayıt Detayı" backHref="/health/muayeneler" />
                <main className="max-w-2xl mx-auto px-4">
                    <EmptyState title="Kayıt bulunamadı" text="Bu kayıt silinmiş ya da başka bir evcil hayvana ait olabilir."
                        action={<Link href="/health/muayeneler" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Muayenelere dön</Link>} />
                </main>
            </>
        );
    }

    const procedures = [
        ...record.vaccines.map(v => v.name),
        ...record.medications.map(m => `${m.name}${m.dose ? ` (${m.dose})` : ''}`),
    ];
    const measures = [
        record.weightKg != null && { label: 'Kilo', value: `${formatKg(record.weightKg)} kg` },
        record.temperatureC != null && { label: 'Sıcaklık', value: `${String(record.temperatureC).replace('.', ',')} °C` },
        record.cost != null && { label: 'Ücret', value: `₺${record.cost.toLocaleString('tr-TR')}` },
    ].filter(Boolean) as { label: string; value: string }[];

    const share = async () => {
        const text = [
            `${pet?.name || ''} — ${formatDateKeyTr(record.date, { day: 'numeric', month: 'long', year: 'numeric' })}`,
            record.clinicName && `Klinik: ${record.clinicName}`,
            record.vetName && `Veteriner: ${record.vetName}`,
            `Tanı: ${record.diagnosis}`,
            record.criticalNotes && `Not: ${record.criticalNotes}`,
            procedures.length ? `Yapılan işlemler: ${procedures.join(', ')}` : null,
            ...measures.map(m => `${m.label}: ${m.value}`),
        ].filter(Boolean).join('\n');
        try {
            if (navigator.share) await navigator.share({ title: 'Muayene kaydı', text });
            else { await navigator.clipboard.writeText(text); showToast('Kayıt panoya kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        } catch { /* kullanıcı paylaşımı kapattı */ }
    };

    return (
        <>
            <HealthHeader title="Kayıt Detayı" backHref="/health/muayeneler" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <HealthCard href={record.clinicId ? `/vet?clinic=${record.clinicId}` : undefined} className="p-4 flex items-center gap-3">
                    <PetAvatar src={record.clinicAvatar} name={record.clinicName || 'V'} className="w-14 h-14 rounded-2xl text-lg" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-black truncate">{record.clinicName || 'Veteriner'}</div>
                        {record.clinicAddress && <div className="text-xs font-semibold text-secondary truncate">{record.clinicAddress}</div>}
                        <div className="text-xs font-semibold text-secondary">{formatDateKeyTr(record.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    {record.clinicId && <ChevronRight className="w-4 h-4 text-secondary shrink-0" />}
                </HealthCard>

                <section className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-bold text-secondary">Muayene</div>
                            <h2 className="text-lg font-black">{record.diagnosis}</h2>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25">
                            {record.source === 'clinic' ? 'Klinik kaydı' : 'Kendi kaydın'}
                        </span>
                    </div>
                    {record.vetName && (
                        <div className="flex items-center gap-3">
                            <PetAvatar name={record.vetName} className="w-10 h-10 text-sm" />
                            <div>
                                <div className="text-xs font-bold text-secondary">Veteriner hekim</div>
                                <div className="text-sm font-black">{record.vetName}</div>
                            </div>
                        </div>
                    )}
                </section>

                {record.criticalNotes && (
                    <section>
                        <h3 className="text-sm font-black mb-1.5">Muayene notu</h3>
                        <p className="text-sm font-semibold text-secondary leading-relaxed">{record.criticalNotes}</p>
                    </section>
                )}

                {procedures.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black mb-2">Yapılan işlemler</h3>
                        <div className="flex flex-wrap gap-2">
                            {procedures.map((p, i) => <span key={i} className="h-8 px-3 rounded-xl bg-card border border-card-border text-xs font-bold flex items-center">{p}</span>)}
                        </div>
                    </section>
                )}

                {measures.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black mb-2">Ölçümler</h3>
                        <div className="grid grid-cols-3 gap-2.5">
                            {measures.map(m => (
                                <div key={m.label} className="bg-card border border-card-border rounded-2xl p-3">
                                    <div className="text-[11px] font-bold text-secondary">{m.label}</div>
                                    <div className="text-sm font-black tabular-nums">{m.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black">Belgeler ({docs.length})</h3>
                        <button onClick={() => setUploadOpen(true)} className="text-xs font-black text-accent">+ Belge ekle</button>
                    </div>
                    {docs.length > 0 ? (
                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            {docs.map(d => <DocumentRow key={d.id} doc={d} />)}
                        </div>
                    ) : <p className="text-xs font-semibold text-secondary">Bu ziyarete ait tahlil, reçete ya da fatura ekleyebilirsin.</p>}
                </section>

                <PrimaryButton onClick={share}><Share2 className="w-4 h-4" /> Bu kaydı paylaş</PrimaryButton>
                {record.source === 'owner' && (
                    <button onClick={async () => { const err = await run(() => healthService.deleteVisitRecord(record.id)); if (err) showToast(err, 'AlertCircle', 'text-red-500 font-bold'); else router.push('/health/muayeneler'); }}
                        className="w-full text-sm font-bold text-red-600 py-2">Kaydı sil</button>
                )}
            </main>
            <UploadDocumentSheet open={uploadOpen} onClose={() => setUploadOpen(false)} medicalRecordId={record.id} defaultCategory="report" />
        </>
    );
}
