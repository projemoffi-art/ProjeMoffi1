'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useHealth } from '@/components/health/HealthProvider';
import { PetAvatar } from '@/components/health/PetPicker';
import { ErrorText, Field, HealthHeader, LoadingBlocks, PrimaryButton, SelectInput, Sheet, SoftButton, TextInput } from '@/components/health/HealthUI';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { ageText } from '@/lib/health/derive';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { GENDER_OPTIONS, SPECIES_OPTIONS, genderLabel, genderMark, speciesLabel } from '@/lib/petIdentity';
import { showToast } from '@/lib/utils';

function copy(value: string, label: string) {
    navigator.clipboard?.writeText(value).then(() => showToast(`${label} kopyalandı.`, 'CheckCircle2', 'text-emerald-500 font-bold'));
}

function Row({ label, value, copyable }: { label: string; value?: string | null; copyable?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-secondary">{label}</span>
            <span className="flex items-center gap-2 min-w-0">
                <span className={value ? 'text-sm font-black text-right truncate' : 'text-sm font-semibold text-secondary'}>{value || 'Girilmedi'}</span>
                {copyable && value && (
                    <button onClick={() => copy(value, label)} aria-label={`${label} kopyala`} className="w-7 h-7 rounded-lg border border-card-border flex items-center justify-center shrink-0">
                        <ClipboardList className="w-3.5 h-3.5" />
                    </button>
                )}
            </span>
        </div>
    );
}

const dateTr = (k?: string | null) => (k && /^\d{4}-\d{2}-\d{2}/.test(k) ? formatDateKeyTr(k.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }) : null);

// Referans Ekran 2 — Kimlik Bilgileri. Kimlik alanlarının tek yazıldığı yer burası.
export default function IdentityPage() {
    const { pet, today, loading } = useHealth();
    const { updatePet } = usePet();
    const [editOpen, setEditOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const onPhoto = async (file?: File | null) => {
        if (!file || !pet) return;
        if (!file.type.startsWith('image/')) { showToast('Lütfen bir fotoğraf seç.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        setUploading(true);
        try {
            const url = await apiService.uploadMedia(file, 'avatars');
            updatePet(pet.id, { image: url });
            showToast('Fotoğraf güncellendi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e: any) {
            showToast(e?.message || 'Fotoğraf yüklenemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setUploading(false);
        }
    };

    const chip = pet ? (pet.microchip || pet.microchip_id || pet.microchip_no) : null;

    return (
        <>
            <HealthHeader title="Kimlik Bilgileri" backHref="/pasaport" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {loading || !pet ? <LoadingBlocks count={3} /> : (
                    <>
                        <section className="flex items-center gap-4">
                            <PetAvatar src={pet.image} name={pet.name} className="w-24 h-24 rounded-2xl text-3xl shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <div>
                                    <div className="text-xl font-black truncate">{pet.name} <span className="text-accent">{genderMark(pet.gender)}</span></div>
                                    <div className="text-sm font-semibold text-secondary truncate">{[pet.breed, ageText(pet.birthday, pet.age, today)].filter(Boolean).join(' · ')}</div>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onPhoto(e.target.files?.[0])} />
                                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                    className="h-9 px-4 rounded-xl bg-card border border-card-border text-xs font-black disabled:opacity-50">
                                    {uploading ? 'Yükleniyor…' : 'Fotoğrafı değiştir'}
                                </button>
                            </div>
                        </section>

                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            <Row label="Ad" value={pet.name} />
                            <Row label="Tür" value={speciesLabel(pet.type)} />
                            <Row label="Irk" value={pet.breed} />
                            <Row label="Cinsiyet" value={genderLabel(pet.gender)} />
                            <Row label="Doğum tarihi" value={dateTr(pet.birthday)} />
                            <Row label="Renk" value={pet.color} />
                            <Row label="Kısırlaştırma" value={pet.neutered === true ? 'Yapıldı' : pet.neutered === false ? 'Yapılmadı' : null} />
                            <Row label="Mikroçip no" value={chip} copyable />
                            <Row label="PETVET no" value={pet.petvet_no} copyable />
                            <Row label="Pasaport no" value={pet.passport_no} copyable />
                            <Row label="Kayıt tarihi" value={pet.created_at ? dateTr(new Date(pet.created_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })) : null} />
                        </div>
                        <p className="text-[11px] font-semibold text-secondary px-1">
                            Pasaport no Moffi tarafından verilir. PETVET ve mikroçip numaraları senin girdiğin bilgilerdir; Moffi bunları resmi kayıtlarla doğrulamaz.
                        </p>
                        <SoftButton onClick={() => setEditOpen(true)}>Düzenle</SoftButton>
                    </>
                )}
            </main>
            {pet && <EditSheet open={editOpen} onClose={() => setEditOpen(false)} />}
        </>
    );
}

function EditSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { pet } = useHealth();
    const { updatePet } = usePet();
    const [f, setF] = useState({ name: '', type: 'dog', breed: '', gender: '', birthday: '', color: '', neutered: '', microchip: '', petvet: '' });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !pet) return;
        setF({
            name: pet.name || '', type: pet.type || 'other', breed: pet.breed || '', gender: genderLabel(pet.gender) || '',
            birthday: /^\d{4}-\d{2}-\d{2}/.test(pet.birthday || '') ? pet.birthday!.slice(0, 10) : '',
            color: pet.color || '', neutered: pet.neutered === true ? 'yes' : pet.neutered === false ? 'no' : '',
            microchip: pet.microchip || pet.microchip_id || pet.microchip_no || '', petvet: pet.petvet_no || '',
        });
        setError(null);
    }, [open, pet]);

    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(s => ({ ...s, [k]: e.target.value }));

    const save = () => {
        if (!pet) return;
        if (!f.name.trim()) { setError('Ad boş olamaz.'); return; }
        if (f.birthday && f.birthday > new Date().toISOString().slice(0, 10)) { setError('Doğum tarihi ileri bir tarih olamaz.'); return; }
        // Eski kayıtlardaki numaralar bozulmasın diye kural sadece numara değiştirildiğinde uygulanır.
        const oldChip = (pet.microchip || pet.microchip_id || pet.microchip_no || '').replace(/\s/g, '');
        const newChip = f.microchip.replace(/\s/g, '');
        if (newChip && newChip !== oldChip && !/^\d{15}$/.test(newChip)) { setError('Mikroçip numarası 15 haneli olmalı.'); return; }
        updatePet(pet.id, {
            name: f.name.trim(), type: f.type, breed: f.breed.trim(), gender: f.gender,
            birthday: f.birthday, color: f.color, petvet_no: f.petvet,
            microchip: f.microchip.replace(/\s/g, ''), microchip_id: f.microchip.replace(/\s/g, ''),
            ...(f.neutered ? { neutered: f.neutered === 'yes', is_neutered: f.neutered === 'yes' } : {}),
        } as any);
        showToast('Kimlik bilgileri kaydedildi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        onClose();
    };

    return (
        <Sheet open={open} onClose={onClose} title="Kimlik bilgilerini düzenle">
            <Field label="Ad"><TextInput value={f.name} onChange={set('name')} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Tür">
                    <SelectInput value={f.type} onChange={set('type')}>
                        {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </SelectInput>
                </Field>
                <Field label="Cinsiyet">
                    <SelectInput value={f.gender} onChange={set('gender')}>
                        <option value="">Seç</option>
                        {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </SelectInput>
                </Field>
            </div>
            <Field label="Irk"><TextInput value={f.breed} onChange={set('breed')} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Doğum tarihi"><TextInput type="date" value={f.birthday} onChange={set('birthday')} max={new Date().toISOString().slice(0, 10)} /></Field>
                <Field label="Renk"><TextInput value={f.color} onChange={set('color')} placeholder="Örn: sarı" /></Field>
            </div>
            <Field label="Kısırlaştırma">
                <SelectInput value={f.neutered} onChange={set('neutered')}>
                    <option value="">Belirtilmedi</option>
                    <option value="yes">Yapıldı</option>
                    <option value="no">Yapılmadı</option>
                </SelectInput>
            </Field>
            <Field label="Mikroçip no" hint="15 haneli numara"><TextInput inputMode="numeric" value={f.microchip} onChange={set('microchip')} /></Field>
            <Field label="PETVET no" hint="E-Devlet'teki evcil hayvan kayıt numarası (varsa)"><TextInput value={f.petvet} onChange={set('petvet')} /></Field>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save}>Kaydet</PrimaryButton>
        </Sheet>
    );
}
