'use client';

// Pasaport raporu: hem sahibin indirdiği PDF (/pasaport/paylas) hem de paylaşım bağlantısıyla açılan
// sayfa (/p/[token]) bunu gösterir. Sadece verilen bölümler basılır.

import React from 'react';
import { docCategoryLabel } from '@/components/health/Documents';
import { ageText, formatKg, isMedicationActive, PARASITE_LABEL, parasiteRows, vaccineRows } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { genderLabel, speciesLabel } from '@/lib/petIdentity';
import type { DocumentCategory, HealthBundle, ShareSection } from '@/types/health';

export interface ReportIdentity {
    name: string;
    type?: string | null;
    breed?: string | null;
    gender?: string | null;
    birthDate?: string | null;
    age?: string | number | null;
    color?: string | null;
    microchipNo?: string | null;
    petvetNo?: string | null;
    neutered?: boolean | null;
    passportNo?: string | null;
}

export interface ReportDocument { id: string; category: DocumentCategory; title: string; docDate: string }

export const SHARE_SECTIONS: { id: ShareSection; label: string; hint?: string }[] = [
    { id: 'identity', label: 'Kimlik bilgileri', hint: 'Tür, ırk, doğum tarihi, çip ve PETVET no' },
    { id: 'vaccines', label: 'Aşı geçmişi' },
    { id: 'parasites', label: 'Parazit geçmişi' },
    { id: 'medications', label: 'İlaçlar' },
    { id: 'visits', label: 'Muayene geçmişi' },
    { id: 'weights', label: 'Kilo geçmişi' },
    { id: 'emergency', label: 'Acil bilgiler', hint: 'Alerji, kronik hastalık, sağlık notu, acil iletişim' },
    { id: 'documents', label: 'Belgeler', hint: 'Bağlantıda dosyalar açılabilir, PDF\'te sadece listesi yer alır' },
];

const d = (k: string | null | undefined) => (k ? formatDateKeyTr(k.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function HealthReport({ identity, bundle, today, sections, documents, documentHref, generatedLabel }: {
    identity: ReportIdentity;
    bundle: HealthBundle;
    today: string;
    sections: ReadonlySet<ShareSection>;
    documents: ReportDocument[];
    documentHref?: (id: string) => string;
    generatedLabel: string;
}) {
    const has = (s: ShareSection) => sections.has(s);
    const vaccines = vaccineRows(bundle.definitions, bundle.vaccines, today).filter(r => r.history.length || r.dueDate);
    const parasitesDone = [...bundle.parasites].filter(p => p.status === 'done').sort((a, b) => (b.appliedOn || '').localeCompare(a.appliedOn || ''));
    const parasiteDue = parasiteRows(bundle.parasites, today);
    const weights = [...bundle.weights].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn)).slice(0, 12);
    const p = bundle.profile;

    return (
        <article id="health-report" className="bg-white text-zinc-900 rounded-2xl border border-card-border p-6 text-[13px] leading-relaxed space-y-5">
            <header className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
                <div>
                    <div className="text-xl font-black">{identity.name} — Pet Pasaportu</div>
                    <div className="text-zinc-500 font-semibold">{generatedLabel}</div>
                </div>
                {identity.passportNo && <div className="text-right text-zinc-500 font-semibold">Pasaport no: {identity.passportNo}</div>}
            </header>

            {has('identity') && (
                <Section title="Kimlik">
                    <KV k="Tür / ırk" v={[speciesLabel(identity.type), identity.breed].filter(Boolean).join(' · ')} />
                    <KV k="Cinsiyet" v={genderLabel(identity.gender)} />
                    <KV k="Doğum tarihi" v={identity.birthDate ? d(identity.birthDate) : null} />
                    <KV k="Yaş" v={ageText(identity.birthDate, identity.age, today)} />
                    <KV k="Renk" v={identity.color} />
                    <KV k="Kısırlaştırma" v={identity.neutered === true ? 'Yapıldı' : identity.neutered === false ? 'Yapılmadı' : null} />
                    <KV k="Mikroçip no" v={identity.microchipNo} />
                    <KV k="PETVET no" v={identity.petvetNo} />
                </Section>
            )}

            {has('vaccines') && (
                <Section title="Aşılar">
                    {vaccines.length === 0 ? <Empty /> : (
                        <Table head={['Aşı', 'Son uygulama', 'Sonraki doz', 'Uygulayan']}
                            rows={vaccines.map(r => [r.name, d(r.last?.dateAdministered), d(r.dueDate), r.last?.vetName || '—'])} />
                    )}
                </Section>
            )}

            {has('parasites') && (
                <Section title="Parazit">
                    {parasiteDue.map(r => (
                        <KV key={r.kind} k={PARASITE_LABEL[r.kind]} v={`Son: ${d(r.last?.appliedOn)} · Sonraki: ${d(r.dueDate)}`} />
                    ))}
                    {parasitesDone.length > 0 && (
                        <Table head={['Tarih', 'Uygulama', 'Ürün']}
                            rows={parasitesDone.slice(0, 10).map(x => [d(x.appliedOn), PARASITE_LABEL[x.kind], x.product || '—'])} />
                    )}
                </Section>
            )}

            {has('medications') && (
                <Section title="İlaçlar">
                    {bundle.medications.length === 0 ? <Empty /> : (
                        <Table head={['İlaç', 'Doz', 'Tarih', 'Durum']}
                            rows={bundle.medications.map(m => [m.name, [m.dosage, m.frequency].filter(Boolean).join(' · ') || '—',
                                `${d(m.startDate)}${m.endDate ? ` – ${d(m.endDate)}` : ''}`, isMedicationActive(m, today) ? 'Kullanıyor' : 'Bitti'])} />
                    )}
                </Section>
            )}

            {has('visits') && (
                <Section title="Muayeneler">
                    {bundle.records.length === 0 ? <Empty /> : bundle.records.slice(0, 10).map(r => (
                        <div key={r.id} className="border-b border-zinc-100 pb-2 last:border-0">
                            <div className="font-bold">{d(r.date)} · {r.clinicName || r.vetName || 'Veteriner'}</div>
                            <div>Tanı: {r.diagnosis}</div>
                            {r.criticalNotes && <div className="text-zinc-600">Not: {r.criticalNotes}</div>}
                            {(r.weightKg != null || r.temperatureC != null) && (
                                <div className="text-zinc-600">{[r.weightKg != null && `Kilo ${formatKg(r.weightKg)} kg`, r.temperatureC != null && `Sıcaklık ${r.temperatureC} °C`].filter(Boolean).join(' · ')}</div>
                            )}
                        </div>
                    ))}
                </Section>
            )}

            {has('weights') && (
                <Section title="Kilo">
                    {weights.length === 0 ? <Empty /> : (
                        <Table head={['Tarih', 'Kilo']} rows={weights.map(w => [d(w.measuredOn), `${formatKg(w.weightKg)} kg`])} />
                    )}
                </Section>
            )}

            {has('emergency') && (
                <Section title="Acil bilgiler">
                    <KV k="Alerjiler" v={p?.allergies.join(', ') || 'Bilinen yok'} />
                    <KV k="Kronik hastalık" v={p?.chronicConditions.join(', ') || 'Bilinen yok'} />
                    <KV k="Kan grubu" v={p?.bloodType} />
                    {p?.notes && <KV k="Sağlık notu" v={<span className="whitespace-pre-wrap">{p.notes}</span>} />}
                    <KV k="Veteriner" v={[p?.primaryVetName, p?.primaryVetPhone].filter(Boolean).join(' · ') || null} />
                    <KV k="Acil iletişim" v={[p?.contactName, p?.contactPhone].filter(Boolean).join(' · ') || null} />
                </Section>
            )}

            {has('documents') && (
                <Section title="Belgeler">
                    {documents.length === 0 ? <Empty /> : (
                        <table className="w-full border-collapse">
                            <thead><tr>{['Tarih', 'Tür', 'Başlık'].map(h => <th key={h} className="text-left text-[11px] font-bold text-zinc-500 border-b border-zinc-200 py-1 pr-2">{h}</th>)}</tr></thead>
                            <tbody>
                                {documents.map(x => (
                                    <tr key={x.id}>
                                        <td className="py-1 pr-2 border-b border-zinc-100 align-top">{d(x.docDate)}</td>
                                        <td className="py-1 pr-2 border-b border-zinc-100 align-top">{docCategoryLabel(x.category)}</td>
                                        <td className="py-1 pr-2 border-b border-zinc-100 align-top">
                                            {documentHref ? <a href={documentHref(x.id)} target="_blank" rel="noreferrer" className="font-bold underline">{x.title}</a> : x.title}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>
            )}

            <footer className="text-[11px] text-zinc-500 border-t border-zinc-200 pt-3">
                Bu belge sahibinin Moffi'deki kayıtlarından oluşturuldu; klinik kayıtları ilgili klinik tarafından girilmiştir.
                Mikroçip ve PETVET numaraları sahibin beyanıdır.
            </footer>
        </article>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="space-y-1.5"><h3 className="text-sm font-black uppercase tracking-wide text-zinc-700">{title}</h3>{children}</section>;
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
    return <div className="flex justify-between gap-4"><span className="text-zinc-500 font-semibold">{k}</span><span className="font-bold text-right">{v || '—'}</span></div>;
}
function Empty() { return <div className="text-zinc-500">Kayıt yok</div>; }
function Table({ head, rows }: { head: string[]; rows: (string | null | undefined)[][] }) {
    return (
        <table className="w-full border-collapse">
            <thead><tr>{head.map(h => <th key={h} className="text-left text-[11px] font-bold text-zinc-500 border-b border-zinc-200 py-1 pr-2">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="py-1 pr-2 border-b border-zinc-100 align-top">{c || '—'}</td>)}</tr>)}</tbody>
        </table>
    );
}
