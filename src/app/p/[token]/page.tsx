'use client';

// Paylaşım bağlantısıyla açılan pasaport (giriş gerekmez). Sunucu sadece sahibin seçtiği
// bölümleri döner (get_shared_passport); süresi dolan ya da kapatılan bağlantı hiçbir şey göstermez.

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { HealthReport } from '@/components/health/HealthReport';
import { PetAvatar } from '@/components/health/PetPicker';
import { healthService } from '@/services/healthService';
import { todayKey, formatDateKeyTr } from '@/lib/appointmentTime';
import { speciesLabel } from '@/lib/petIdentity';
import type { SharedPassport } from '@/types/health';

export default function SharedPassportPage() {
    const params = useParams();
    const token = String(params?.token || '');
    const [data, setData] = useState<SharedPassport | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'closed' | 'error'>('loading');

    useEffect(() => {
        if (!/^[0-9a-f]{32}$/.test(token)) { setState('closed'); return; }
        healthService.getSharedPassport(token)
            .then(d => { setData(d); setState(d ? 'ready' : 'closed'); })
            .catch(() => setState('error'));
    }, [token]);

    const today = todayKey();

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground">
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #health-report, #health-report * { visibility: visible !important; }
                #health-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 24px; background: #fff; color: #111; }
                @page { margin: 14mm; }
            }`}</style>
            <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                <div className="text-sm font-black text-accent print:hidden">Moffi · Pet Pasaportu</div>

                {state === 'loading' && <div className="h-40 rounded-3xl bg-card border border-card-border animate-pulse" />}

                {(state === 'closed' || state === 'error') && (
                    <div className="bg-card border border-card-border rounded-3xl p-6 text-center space-y-2">
                        <h1 className="text-lg font-black">{state === 'closed' ? 'Bu bağlantı artık açık değil' : 'Pasaport açılamadı'}</h1>
                        <p className="text-sm font-semibold text-secondary">
                            {state === 'closed'
                                ? 'Bağlantının süresi dolmuş ya da sahibi paylaşımı kapatmış. Güncel bilgi için sahibinden yeni bir bağlantı isteyebilirsin.'
                                : 'Bağlantıyı kontrol edip biraz sonra tekrar dene.'}
                        </p>
                    </div>
                )}

                {state === 'ready' && data && (
                    <>
                        <section className="bg-card border border-card-border rounded-3xl p-4 flex items-center gap-4 print:hidden">
                            <PetAvatar src={data.pet.avatarUrl} name={data.pet.name} className="w-20 h-20 rounded-2xl text-2xl shrink-0" />
                            <div className="min-w-0">
                                <h1 className="text-xl font-black truncate">{data.pet.name}</h1>
                                <div className="text-sm font-semibold text-secondary truncate">{[speciesLabel(data.pet.type), data.pet.breed].filter(Boolean).join(' · ')}</div>
                                <div className="text-xs font-bold text-secondary mt-1">
                                    Bu bağlantı {formatDateKeyTr(new Date(data.expiresAt).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }), { day: 'numeric', month: 'long' })} tarihine kadar açık
                                </div>
                            </div>
                        </section>

                        <button onClick={() => window.print()}
                            className="w-full h-11 rounded-2xl border border-accent/30 bg-accent/5 text-accent font-black text-sm flex items-center justify-center gap-2 print:hidden">
                            <Download className="w-4 h-4" /> PDF olarak kaydet
                        </button>

                        <HealthReport
                            identity={{
                                name: data.pet.name, type: data.pet.type, breed: data.pet.breed, passportNo: data.pet.passportNo,
                                gender: data.identity?.gender, birthDate: data.identity?.birthDate, age: data.identity?.age,
                                color: data.identity?.color, microchipNo: data.identity?.microchipNo, petvetNo: data.identity?.petvetNo,
                                neutered: data.identity?.isNeutered ?? null,
                            }}
                            bundle={data.bundle} today={today} sections={new Set(data.sections)}
                            documents={data.documents}
                            documentHref={id => `/api/share/${token}/document/${id}`}
                            generatedLabel={`Sahibinin paylaştığı bilgiler · ${formatDateKeyTr(today, { day: 'numeric', month: 'long', year: 'numeric' })}`}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
