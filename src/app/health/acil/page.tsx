'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Phone, ShieldAlert } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { ErrorText, Field, HealthCard, HealthHeader, LoadingBlocks, PrimaryButton, SectionTitle, Sheet, SoftButton, TextArea, TextInput } from '@/components/health/HealthUI';
import { useAuth } from '@/context/AuthContext';
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

function Row({ label, value, empty = 'Yok', phone }: { label: string; value: React.ReactNode; empty?: string; phone?: string | null }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-bold shrink-0">{label}</span>
            <span className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-secondary text-right whitespace-pre-wrap">{value || empty}</span>
                {phone && (
                    <a href={`tel:${phone.replace(/\s/g, '')}`} aria-label={`${label} ara`}
                        className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                    </a>
                )}
            </span>
        </div>
    );
}

const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

// Pasaport referansı Ekran 9 — Acil Bilgiler. Alerji, hastalık ve sağlık notunun TEK yazıldığı yer;
// kayıp künyesi, doğrulama kodu, veterinere paylaşım ve randevu bu kaydı okur.
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
            <HealthHeader title="Acil Bilgiler" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {loading || !bundle || !pet ? <LoadingBlocks /> : (
                    <>
                        <HealthCard className="p-4 border-red-200 dark:border-red-500/25 bg-red-50/60 dark:bg-red-500/5">
                            <div className="flex items-start gap-3">
                                <span className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></span>
                                <div>
                                    <div className="text-sm font-black">Acil durumda göster</div>
                                    <p className="text-xs font-semibold text-secondary">Kapalıyken bu bilgileri senden başka kimse göremez. Açtığın yerde, alerjisi, ilacı ya da veterineri bilinirse yardım daha hızlı olur.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-card-border mt-2">
                                <Toggle on={!!profile?.showOnLost} onChange={v => setFlag({ showOnLost: v })}
                                    label="Kayıp künyesinde" hint="Sadece kayıp modundayken, künyeyi okutan kişi görür" />
                                <Toggle on={!!profile?.showOnQr} onChange={v => setFlag({ showOnQr: v })}
                                    label="Doğrulama kodunda" hint="Eski karne QR kodunu okutan kişi (örn. klinik) aşı durumunu ve bu bilgileri görür" />
                            </div>
                        </HealthCard>

                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            <Row label="Alerjiler" value={profile?.allergies.join(', ')} />
                            <Row label="Kronik hastalık" value={profile?.chronicConditions.join(', ')} />
                            <Row label="Düzenli ilaç" value={activeMeds.join(', ')} empty="Aktif ilaç yok" />
                            <Row label="Kan grubu" value={profile?.bloodType} empty="Bilinmiyor" />
                            <Row label="Çip numarası" value={chip} empty="Girilmedi" />
                        </div>

                        {profile?.notes && (
                            <section>
                                <SectionTitle>Sağlık notu</SectionTitle>
                                <HealthCard className="p-4"><p className="text-sm font-semibold whitespace-pre-wrap">{profile.notes}</p></HealthCard>
                            </section>
                        )}

                        <section>
                            <SectionTitle>İletişim</SectionTitle>
                            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                                <Row label="Acil iletişim" value={[profile?.contactName, profile?.contactPhone].filter(Boolean).join('\n')} empty="Girilmedi" phone={profile?.contactPhone} />
                                <Row label="Alternatif" value={[profile?.altContactName, profile?.altContactPhone].filter(Boolean).join('\n')} empty="Girilmedi" phone={profile?.altContactPhone} />
                                <Row label="Veteriner" value={[profile?.primaryVetName || lastClinic?.clinicName, profile?.primaryVetPhone].filter(Boolean).join('\n')} empty="Girilmedi" phone={profile?.primaryVetPhone} />
                            </div>
                        </section>
                        <p className="text-[11px] font-semibold text-secondary px-1">Düzenli ilaçlar İlaçlar bölümünden, çip numarası Kimlik Bilgileri'nden gelir.</p>
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
    const { user } = useAuth();
    const p = bundle?.profile;
    const [f, setF] = useState({ allergies: '', chronic: '', blood: '', notes: '', contactName: '', contactPhone: '', altName: '', altPhone: '', vetName: '', vetPhone: '' });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setF({
            allergies: p?.allergies.join(', ') || '', chronic: p?.chronicConditions.join(', ') || '', blood: p?.bloodType || '',
            notes: p?.notes || '',
            // İlk kez dolduruluyorsa sahibin kendi adı ve telefonu önerilir.
            contactName: p?.contactName || (p?.contactPhone ? '' : user?.name || ''),
            contactPhone: p?.contactPhone || (user as any)?.phone || '',
            altName: p?.altContactName || '', altPhone: p?.altContactPhone || '',
            vetName: p?.primaryVetName || defaultVet, vetPhone: p?.primaryVetPhone || '',
        });
        setError(null);
    }, [open, p, defaultVet, user]);

    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }));

    const save = async () => {
        if (!pet) return;
        setSaving(true);
        const err = await run(() => healthService.saveProfile(pet.id, {
            allergies: splitList(f.allergies), chronicConditions: splitList(f.chronic), bloodType: f.blood, notes: f.notes,
            contactName: f.contactName, contactPhone: f.contactPhone, altContactName: f.altName, altContactPhone: f.altPhone,
            primaryVetName: f.vetName, primaryVetPhone: f.vetPhone,
        }));
        setSaving(false);
        if (err) setError(err); else onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title="Acil bilgileri düzenle">
            <Field label="Alerjiler" hint="Virgülle ayır. Örn: tavuk, penisilin"><TextInput value={f.allergies} onChange={set('allergies')} /></Field>
            <Field label="Kronik hastalıklar" hint="Virgülle ayır"><TextInput value={f.chronic} onChange={set('chronic')} /></Field>
            <Field label="Kan grubu (biliyorsan)"><TextInput value={f.blood} onChange={set('blood')} placeholder="Örn: DEA 1.1 pozitif" /></Field>
            <Field label="Sağlık notu" hint="Listelere sığmayan her şey: hassasiyetler, özel bakım, bilinmesi gerekenler">
                <TextArea value={f.notes} onChange={set('notes')} maxLength={1000} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Acil iletişim"><TextInput value={f.contactName} onChange={set('contactName')} placeholder="Ad" /></Field>
                <Field label="Telefon"><TextInput type="tel" value={f.contactPhone} onChange={set('contactPhone')} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Alternatif kişi"><TextInput value={f.altName} onChange={set('altName')} placeholder="Ad" /></Field>
                <Field label="Telefon"><TextInput type="tel" value={f.altPhone} onChange={set('altPhone')} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Veterinerin"><TextInput value={f.vetName} onChange={set('vetName')} /></Field>
                <Field label="Telefon"><TextInput type="tel" value={f.vetPhone} onChange={set('vetPhone')} /></Field>
            </div>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}
