'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Download } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { HealthHeader, LoadingBlocks, PrimaryButton } from '@/components/health/HealthUI';
import { docCategoryLabel } from '@/components/health/Documents';
import {
    ageText, formatKg, isMedicationActive, PARASITE_LABEL, parasiteRows, vaccineRows,
} from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { cn } from '@/lib/utils';

type Part = 'summary' | 'vaccines' | 'parasites' | 'medications' | 'visits' | 'weights' | 'emergency' | 'documents';

const PARTS: { id: Part; label: string; hint?: string }[] = [
    { id: 'summary', label: 'Kimlik ve özet' },
    { id: 'vaccines', label: 'Aşı geçmişi' },
    { id: 'parasites', label: 'Parazit geçmişi' },
    { id: 'medications', label: 'İlaçlar' },
    { id: 'visits', label: 'Muayene notları' },
    { id: 'weights', label: 'Kilo geçmişi' },
    { id: 'emergency', label: 'Acil bilgiler' },
    { id: 'documents', label: 'Belge listesi', hint: 'Dosyaların kendisi eklenmez, sadece listesi' },
];

const d = (k: string | null | undefined) => (k ? formatDateKeyTr(k, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// Referans alt sıra — Veterinere Paylaş. Tarayıcının "PDF olarak kaydet" özelliğiyle belge üretir
// (Türkçe karakterler bozulmadan); hangi bölümlerin gideceğini sahip seçer.
export default function SharePage() {
    return <Suspense fallback={null}><ShareContent /></Suspense>;
}

function ShareContent() {
    const params = useSearchParams();
    const only = params.get('bolum');
    const { pet, bundle, today, loading } = useHealth();
    const [parts, setParts] = useState<Set<Part>>(() => new Set(
        only === 'asilar' ? ['summary', 'vaccines'] : ['summary', 'vaccines', 'parasites', 'medications', 'visits', 'emergency']
    ));
    const toggle = (p: Part) => setParts(s => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });

    const data = useMemo(() => bundle && ({
        vaccines: vaccineRows(bundle.definitions, bundle.vaccines, today).filter(r => r.history.length || r.dueDate),
        parasites: [...bundle.parasites].filter(p => p.status === 'done').sort((a, b) => (b.appliedOn || '').localeCompare(a.appliedOn || '')),
        parasiteDue: parasiteRows(bundle.parasites, today),
        meds: bundle.medications,
        visits: bundle.records.slice(0, 10),
        weights: [...bundle.weights].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn)).slice(0, 12),
    }), [bundle, today]);

    const has = (p: Part) => parts.has(p);
    const chip = pet ? (pet.microchip || pet.microchip_id || pet.microchip_no) : null;

    return (
        <>
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #health-report, #health-report * { visibility: visible !important; }
                #health-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 24px; background: #fff; color: #111; }
                @page { margin: 14mm; }
            }`}</style>
            <HealthHeader title="Veterinere paylaş" backHref="/health/karne" />
            <main className="max-w-2xl mx-auto px-4 space-y-4 print:hidden">
                <h2 className="text-base font-black">Hangi bilgileri paylaşmak istiyorsun?</h2>
                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                    {PARTS.map(p => (
                        <button key={p.id} onClick={() => toggle(p.id)} role="checkbox" aria-checked={has(p.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left">
                            <span className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0', has(p.id) ? 'bg-accent border-accent' : 'border-card-border')}>
                                {has(p.id) && <Check className="w-4 h-4 text-white" />}
                            </span>
                            <span className="flex-1">
                                <span className="block text-sm font-bold">{p.label}</span>
                                {p.hint && <span className="block text-[11px] font-semibold text-secondary">{p.hint}</span>}
                            </span>
                        </button>
                    ))}
                </div>
                <PrimaryButton onClick={() => window.print()} disabled={parts.size === 0 || !bundle}>
                    <Download className="w-4 h-4" /> PDF oluştur
                </PrimaryButton>
                <p className="text-[11px] font-semibold text-secondary">Açılan pencerede "PDF olarak kaydet"i seç; dosyayı veterinerine mesaj ya da e-postayla gönderebilirsin.</p>
                <h3 className="text-sm font-black pt-2">Önizleme</h3>
            </main>

            <div className="max-w-2xl mx-auto px-4 mt-3">
                {loading || !bundle || !data || !pet ? <LoadingBlocks count={2} /> : (
                    <article id="health-report" className="bg-white text-zinc-900 rounded-2xl border border-card-border p-6 text-[13px] leading-relaxed space-y-5">
                        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
                            <div>
                                <div className="text-xl font-black">{pet.name} — Sağlık Karnesi</div>
                                <div className="text-zinc-500 font-semibold">Oluşturulma: {d(today)} · Moffi</div>
                            </div>
                            <div className="text-right text-zinc-500 font-semibold">Kayıt no: MOF-{pet.id.slice(0, 8).toUpperCase()}</div>
                        </header>

                        {has('summary') && (
                            <Section title="Kimlik">
                                <KV k="Tür / ırk" v={[pet.type === 'cat' ? 'Kedi' : pet.type === 'dog' ? 'Köpek' : null, pet.breed].filter(Boolean).join(' · ')} />
                                <KV k="Cinsiyet" v={pet.gender} />
                                <KV k="Yaş" v={ageText(pet.birthday, pet.age, today)} />
                                <KV k="Çip no" v={chip} />
                                <KV k="Kısırlaştırma" v={pet.neutered === true ? 'Evet' : pet.neutered === false ? 'Hayır' : null} />
                            </Section>
                        )}

                        {has('vaccines') && (
                            <Section title="Aşılar">
                                {data.vaccines.length === 0 ? <Empty /> : (
                                    <Table head={['Aşı', 'Son uygulama', 'Sonraki doz', 'Uygulayan']}
                                        rows={data.vaccines.map(r => [r.name, d(r.last?.dateAdministered), d(r.dueDate), r.last?.vetName || '—'])} />
                                )}
                            </Section>
                        )}

                        {has('parasites') && (
                            <Section title="Parazit">
                                {data.parasiteDue.map(r => (
                                    <KV key={r.kind} k={PARASITE_LABEL[r.kind]} v={`Son: ${d(r.last?.appliedOn)} · Sonraki: ${d(r.dueDate)}`} />
                                ))}
                                {data.parasites.length > 0 && (
                                    <Table head={['Tarih', 'Uygulama', 'Ürün']}
                                        rows={data.parasites.slice(0, 10).map(p => [d(p.appliedOn), PARASITE_LABEL[p.kind], p.product || '—'])} />
                                )}
                            </Section>
                        )}

                        {has('medications') && (
                            <Section title="İlaçlar">
                                {data.meds.length === 0 ? <Empty /> : (
                                    <Table head={['İlaç', 'Doz', 'Tarih', 'Durum']}
                                        rows={data.meds.map(m => [m.name, [m.dosage, m.frequency].filter(Boolean).join(' · ') || '—',
                                            `${d(m.startDate)}${m.endDate ? ` – ${d(m.endDate)}` : ''}`, isMedicationActive(m, today) ? 'Kullanıyor' : 'Bitti'])} />
                                )}
                            </Section>
                        )}

                        {has('visits') && (
                            <Section title="Muayeneler">
                                {data.visits.length === 0 ? <Empty /> : data.visits.map(r => (
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
                                {data.weights.length === 0 ? <Empty /> : (
                                    <Table head={['Tarih', 'Kilo']} rows={data.weights.map(w => [d(w.measuredOn), `${formatKg(w.weightKg)} kg`])} />
                                )}
                            </Section>
                        )}

                        {has('emergency') && (
                            <Section title="Acil bilgiler">
                                <KV k="Alerjiler" v={bundle.profile?.allergies.join(', ') || 'Bilinen yok'} />
                                <KV k="Kronik hastalık" v={bundle.profile?.chronicConditions.join(', ') || 'Bilinen yok'} />
                                <KV k="Kan grubu" v={bundle.profile?.bloodType} />
                            </Section>
                        )}

                        {has('documents') && (
                            <Section title="Belgeler">
                                {bundle.documents.length === 0 ? <Empty /> : (
                                    <Table head={['Tarih', 'Tür', 'Başlık']} rows={bundle.documents.map(x => [d(x.docDate), docCategoryLabel(x.category), x.title])} />
                                )}
                            </Section>
                        )}

                        <footer className="text-[11px] text-zinc-500 border-t border-zinc-200 pt-3">
                            Bu belge sahibinin Moffi'deki kayıtlarından oluşturuldu; klinik kayıtları ilgili klinik tarafından girilmiştir.
                        </footer>
                    </article>
                )}
            </div>
        </>
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
