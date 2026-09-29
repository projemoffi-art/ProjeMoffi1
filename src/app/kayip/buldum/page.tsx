'use client';

// Referans Ekran 8–10 — Bir Hayvan Buldum (Hayvan · Konum · Detay).

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HealthHeader, ErrorText, Field, PrimaryButton, TextArea, TextInput } from '@/components/health/HealthUI';
import { ChipInput, LocationField, PhotoPicker, RadioRow, Stepper, toLocalInput, type PhotoItem } from '@/components/lost/LostUI';
import { useAuth } from '@/context/AuthContext';
import { lostService, CHIP_OPTIONS, FOUND_SITUATIONS, type Species } from '@/services/lostService';
import { currentPosition } from '@/lib/geo';
import { cn } from '@/lib/utils';

const STEPS = ['Hayvan', 'Konum', 'Detay'];
const COLORS = ['Sarı', 'Siyah', 'Beyaz', 'Gri', 'Kahverengi', 'Tekir', 'Alaca', 'Krem'];

export default function FoundPetPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [species, setSpecies] = useState<Species>('dog');
    const [color, setColor] = useState('');
    const [features, setFeatures] = useState<string[]>([]);
    const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; address: string }>({ lat: null, lng: null, address: '' });
    const [fallback, setFallback] = useState<[number, number]>([41.0082, 28.9784]);
    const [eventAt, setEventAt] = useState(() => toLocalInput(new Date()));
    const [situation, setSituation] = useState('with_me');
    const [chip, setChip] = useState('none');
    const [notes, setNotes] = useState('');
    const [showPhone, setShowPhone] = useState(false);
    const [phone, setPhone] = useState('');

    useEffect(() => {
        currentPosition(8000).then(p => { if (p) { setFallback([p.lat, p.lng]); } });
    }, []);
    useEffect(() => { setPhone((user as any)?.phone || ''); }, [user]);

    const next = () => {
        setError(null);
        if (step === 1 && photos.length === 0) { setError('Bir fotoğraf ekle; sahibinin tanıması için en önemli bilgi bu.'); return; }
        if (step === 2 && (loc.lat == null || loc.lng == null)) { setError('Nerede bulduğunu haritada işaretle.'); return; }
        setStep(s => Math.min(3, s + 1));
    };

    const publish = async () => {
        setError(null);
        if (showPhone && !/^[0-9 +()-]{10,20}$/.test(phone.trim())) { setError('Geçerli bir telefon numarası yaz.'); return; }
        setSaving(true);
        try {
            const urls = await lostService.uploadPhotos(photos.filter(p => p.file).map(p => p.file!));
            const res = await lostService.create({
                kind: 'found', petName: null, species, color: color || null, photos: urls, features,
                situation, chipStatus: chip, description: notes, locationText: loc.address || null,
                lat: loc.lat!, lng: loc.lng!, eventAt: new Date(eventAt).toISOString(),
                contactMode: showPhone ? 'phone' : 'in_app', contactPhone: showPhone ? phone : null, notifyRadiusKm: 3,
            });
            router.replace(`/kayip/${res.id}/yayinlandi?n=${res.notified}`);
        } catch (e: any) {
            setError(e?.message || 'İlan yayınlanamadı.');
            setSaving(false);
        }
    };

    return (
        <>
            <HealthHeader title="Bir Hayvan Buldum" backHref="/kayip" />
            <main className="max-w-2xl mx-auto px-4 space-y-5">
                <Stepper steps={STEPS} current={step} />

                {step === 1 && (
                    <section className="space-y-4">
                        <div>
                            <div className="text-sm font-black mb-2">Fotoğraf ekle</div>
                            <PhotoPicker items={photos} onChange={setPhotos} max={4} />
                        </div>
                        <div>
                            <div className="text-sm font-black mb-2">Hangi hayvanı buldun?</div>
                            <div className="grid grid-cols-3 gap-2">
                                {([['dog', 'Köpek'], ['cat', 'Kedi'], ['other', 'Diğer']] as const).map(([id, label]) => (
                                    <button key={id} onClick={() => setSpecies(id)} className={cn('h-11 rounded-xl border text-sm font-bold', species === id ? 'bg-accent text-white border-accent' : 'bg-card border-card-border')}>{label}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-black mb-2">Renk</div>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setColor(color === c ? '' : c)} className={cn('h-9 px-3.5 rounded-full border text-xs font-bold', color === c ? 'bg-accent text-white border-accent' : 'bg-card border-card-border text-secondary')}>{c}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-black mb-2">Ayırt edici özellikler (isteğe bağlı)</div>
                            <ChipInput values={features} onChange={setFeatures} placeholder="Örn: mavi tasma" suggestions={['Tasmalı', 'Yavru', 'Yaralı', 'Çok uysal']} />
                        </div>
                    </section>
                )}

                {step === 2 && (
                    <section className="space-y-4">
                        <div>
                            <div className="text-xs font-bold text-secondary mb-1.5">Nerede buldun?</div>
                            <LocationField lat={loc.lat} lng={loc.lng} address={loc.address} fallback={fallback} onChange={setLoc} />
                        </div>
                        <Field label="Ne zaman buldun?"><TextInput type="datetime-local" value={eventAt} max={toLocalInput(new Date())} onChange={e => setEventAt(e.target.value)} /></Field>
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-secondary">Şu anki durumu</div>
                            {FOUND_SITUATIONS.map(s => <RadioRow key={s.id} checked={situation === s.id} onClick={() => setSituation(s.id)} label={s.label} />)}
                        </div>
                    </section>
                )}

                {step === 3 && (
                    <section className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-black">Künye ya da çip var mı?</div>
                            {CHIP_OPTIONS.map(o => <RadioRow key={o.id} checked={chip === o.id} onClick={() => setChip(o.id)} label={o.label} />)}
                            <p className="text-[11px] font-semibold text-secondary">Çipi okutmak için herhangi bir veteriner kliniğine götürebilirsin; ücretsiz okunur.</p>
                        </div>
                        <Field label="Ek notlar">
                            <TextArea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} placeholder="Sokakta gördüm, sakin görünüyor. Şu an yanımda." />
                        </Field>
                        <div className="space-y-2">
                            <div className="text-sm font-black">İletişim</div>
                            <RadioRow checked={!showPhone} onClick={() => setShowPhone(false)} label="Uygulama içi mesaj (önerilen)" />
                            <RadioRow checked={showPhone} onClick={() => setShowPhone(true)} label="Telefon numaramı da göster" hint="Sadece giriş yapmış kişiler görür" />
                            {showPhone && <TextInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />}
                        </div>
                    </section>
                )}

                <ErrorText>{error}</ErrorText>
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => (step === 1 ? router.back() : setStep(s => s - 1))} className="h-12 rounded-2xl bg-card border border-card-border font-black text-sm">
                        {step === 1 ? 'Vazgeç' : 'Geri'}
                    </button>
                    {step < 3
                        ? <PrimaryButton onClick={next}>Devam et</PrimaryButton>
                        : <PrimaryButton onClick={publish} disabled={saving}>{saving ? 'Yayınlanıyor…' : 'İlanı yayınla'}</PrimaryButton>}
                </div>
            </main>
        </>
    );
}
