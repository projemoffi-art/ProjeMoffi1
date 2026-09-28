'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { ErrorText, Field, HealthCard, HealthHeader, LoadingBlocks, PrimaryButton, Sheet, SoftButton, TextInput } from '@/components/health/HealthUI';
import { isMedicationActive } from '@/lib/health/derive';
import { healthService } from '@/services/healthService';
import { cn, showToast } from '@/lib/utils';

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
    return (
        <button onClick={() => onChange(!on)} role="switch" aria-checked={on} className="w-full flex items-center gap-3 py-3 text-left">
            <span className="flex-1">
                <span className="block text-sm font-black">{label}</span>
                <span className="block text-xs font-semibold text-secondary">{hint}</span>
            </span>
            <span className={cn('w-11 h-6 rounded-full p-0.5 transition-colors shrink-0', on ? 'bg-accent' : 'bg-card-border')}>
                <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', on ? 'translate-x-5' : 'translate-x-0')} />
            </span>
        </button>
    );
}

function Row({ label, value, empty = 'Yok' }: { label: string; value: React.ReactNode; empty?: string }) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-3">
            <span className="text-sm font-bold">{label}</span>
            <span className="text-sm font-semibold text-secondary text-right">{value || empty}</span>
        </div>
    );
}

const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

// Referans alt sıra — Acil Bilgiler.
export default function EmergencyInfoPage() {
    const { pet, bundle, today, loading, run } = useHealth();
    const [editOpen, setEditOpen] = useState(false);
    const profile = bundle?.profile;
    const activeMeds = useMemo(() => (bundle?.medications || []).filter(m => isMedicationActive(m, today)).map(m => m.name), [bundle, today]);
    const lastClinic = bundle?.records.find(r => r.source === 'clinic') || null;
    const chip = pet ? (pet.microchip || pet.microchip_id || pet.microchip_no) : null;

    const setFlag = async (patch: { showOnLost?: boolean; showOnQr?: boolean }) => {
        if (!pet) return;
        const err = await run(() => healthService.saveProfile(pet.id, patch));
        if (err) showToast(err, 'AlertCircle', 'text-red-500 font-bold');
    };

    return (
        <>
            <HealthHeader title="Acil Bilgiler" backHref="/health" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {loading || !bundle || !pet ? <LoadingBlocks /> : (
                    <>
                        <HealthCard className="p-4 border-red-200 dark:border-red-500/25 bg-red-50/60 dark:bg-red-500/5">
                            <div className="flex items-start gap-3">
                                <span className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></span>
                                <div>
                                    <div className="text-sm font-black">Acil durumda göster</div>
                                    <p className="text-xs font-semibold text-secondary">Açarsan aşağıdaki bilgiler seçtiğin yerde görünür; ilacı, alerjisi ya da veterineri bilinirse yardım daha hızlı olur.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-card-border mt-2">
                                <Toggle on={!!profile?.showOnLost} onChange={v => setFlag({ showOnLost: v })}
                                    label="Kayıp ilanında" hint="Kayıp modundayken künyeyi okutan kişi görür" />
                                <Toggle on={!!profile?.showOnQr} onChange={v => setFlag({ showOnQr: v })}
                                    label="Karne doğrulama kodunda" hint="Karnedeki kodu okutan kişi (örn. klinik) görür" />
                            </div>
                        </HealthCard>

                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            <Row label="Alerjiler" value={profile?.allergies.join(', ')} />
                            <Row label="Kronik hastalık" value={profile?.chronicConditions.join(', ')} />
                            <Row label="Düzenli ilaç" value={activeMeds.join(', ')} empty="Aktif ilaç yok" />
                            <Row label="Çip numarası" value={chip ? (
                                <button onClick={() => navigator.clipboard?.writeText(chip).then(() => showToast('Çip numarası kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'))}
                                    className="font-black text-foreground tabular-nums">{chip} ⧉</button>
                            ) : null} empty="Girilmedi" />
                            <Row label="Kan grubu" value={profile?.bloodType} empty="Bilinmiyor" />
                            <Row label="Veteriner" value={[profile?.primaryVetName || lastClinic?.clinicName, profile?.primaryVetPhone].filter(Boolean).join(' · ')} empty="Girilmedi" />
                        </div>
                        <p className="text-[11px] font-semibold text-secondary px-1">Düzenli ilaçlar İlaçlar bölümünden, çip numarası evcil hayvan profilinden gelir.</p>
                        <SoftButton onClick={() => setEditOpen(true)}>Düzenle</SoftButton>
                    </>
                )}
            </main>
            {pet && bundle && <EditSheet open={editOpen} onClose={() => setEditOpen(false)} defaultVet={lastClinic?.clinicName || ''} />}
        </>
    );
}

function EditSheet({ open, onClose, defaultVet }: { open: boolean; onClose: () => void; defaultVet: string }) {
    const { pet, bundle, run } = useHealth();
    const p = bundle?.profile;
    const [allergies, setAllergies] = useState('');
    const [chronic, setChronic] = useState('');
    const [blood, setBlood] = useState('');
    const [vetName, setVetName] = useState('');
    const [vetPhone, setVetPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setAllergies(p?.allergies.join(', ') || '');
        setChronic(p?.chronicConditions.join(', ') || '');
        setBlood(p?.bloodType || '');
        setVetName(p?.primaryVetName || defaultVet);
        setVetPhone(p?.primaryVetPhone || '');
        setError(null);
    }, [open, p, defaultVet]);

    const save = async () => {
        if (!pet) return;
        setSaving(true);
        const err = await run(() => healthService.saveProfile(pet.id, {
            allergies: splitList(allergies), chronicConditions: splitList(chronic), bloodType: blood,
            primaryVetName: vetName, primaryVetPhone: vetPhone,
        }));
        setSaving(false);
        if (err) setError(err); else onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title="Acil bilgileri düzenle">
            <Field label="Alerjiler" hint="Virgülle ayır. Örn: tavuk, penisilin"><TextInput value={allergies} onChange={e => setAllergies(e.target.value)} /></Field>
            <Field label="Kronik hastalıklar" hint="Virgülle ayır"><TextInput value={chronic} onChange={e => setChronic(e.target.value)} /></Field>
            <Field label="Kan grubu (biliyorsan)"><TextInput value={blood} onChange={e => setBlood(e.target.value)} placeholder="Örn: DEA 1.1 pozitif" /></Field>
            <Field label="Veterinerin"><TextInput value={vetName} onChange={e => setVetName(e.target.value)} /></Field>
            <Field label="Veterinerin telefonu"><TextInput type="tel" value={vetPhone} onChange={e => setVetPhone(e.target.value)} /></Field>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}
