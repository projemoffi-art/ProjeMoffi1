'use client';

// Referans Ekran 3–6 — Kayıp İlanı Ver (Hayvan · Zaman · Detay · İletişim).

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { HealthHeader, ErrorText, Field, PrimaryButton, SelectInput, TextArea, TextInput } from '@/components/health/HealthUI';
import { PetAvatar } from '@/components/health/PetPicker';
import { ChipInput, LocationField, PhotoPicker, RadioRow, Stepper, ToggleRow, toLocalInput, uploadPhotoItems, type PhotoItem } from '@/components/lost/LostUI';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { lostService, LOST_SITUATIONS, type Species } from '@/services/lostService';
import { currentPosition } from '@/lib/geo';
import { GENDER_OPTIONS, genderLabel, speciesLabel } from '@/lib/petIdentity';
import { cn } from '@/lib/utils';

const STEPS = ['Hayvan', 'Zaman', 'Detay', 'İletişim'];

function toSpecies(t?: string | null): Species {
    const s = String(t || '').toLocaleLowerCase('tr-TR');
    return s === 'cat' || s === 'kedi' ? 'cat' : s === 'dog' || s === 'köpek' ? 'dog' : 'other';
}

export default function NewLostListingPage() {
    return <Suspense fallback={null}><Wizard /></Suspense>;
}

function Wizard() {
    const router = useRouter();
    const params = useSearchParams();
    const { pets } = usePet();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // 1) Hayvan
    const [petId, setPetId] = useState<string | 'manual' | null>(params.get('pet'));
    const [manual, setManual] = useState({ name: '', species: 'dog' as Species, breed: '', gender: '' });
    // 2) Zaman ve konum
    const [eventAt, setEventAt] = useState(() => toLocalInput(new Date()));
    const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; address: string }>({ lat: null, lng: null, address: '' });
    const [fallback, setFallback] = useState<[number, number]>([41.0082, 28.9784]);
    const [situation, setSituation] = useState('home');
    // 3) Detay
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [approach, setApproach] = useState('');
    const [description, setDescription] = useState('');
    // 4) İletişim
    const [showPhone, setShowPhone] = useState(false);
    const [phone, setPhone] = useState('');
    const [reward, setReward] = useState(false);
    const [rewardAmount, setRewardAmount] = useState('');
    const [radius, setRadius] = useState(3);
    const [reach, setReach] = useState<number | null>(null);

    const pet = useMemo(() => pets.find(p => p.id === petId) || null, [pets, petId]);
    const species: Species = pet ? toSpecies(pet.type) : manual.species;

    useEffect(() => { currentPosition(8000).then(p => { if (p) setFallback([p.lat, p.lng]); }); }, []);
    useEffect(() => { setPhone((user as any)?.phone || ''); }, [user]);

    // Pasaporttaki hayvan seçilince fotoğraf, renk ve varsayılan bildirim alanı dolar.
    useEffect(() => {
        if (!pet) return;
        setPhotos(pet.image ? [{ url: pet.image, preview: pet.image }] : []);
        setFeatures(f => (f.length ? f : [pet.color, pet.microchip || pet.microchip_no ? 'Çipli' : null].filter(Boolean) as string[]));
        setRadius(toSpecies(pet.type) === 'cat' ? 1 : 3);
    }, [pet]);

    useEffect(() => {
        if (step !== 4 || loc.lat == null || loc.lng == null) return;
        lostService.countAlertUsers(loc.lat, loc.lng, radius).then(setReach);
    }, [step, loc.lat, loc.lng, radius]);

    const next = () => {
        setError(null);
        if (step === 1 && !pet && (petId !== 'manual' || !manual.name.trim())) { setError('Bir hayvan seç ya da adını yaz.'); return; }
        if (step === 2) {
            if (loc.lat == null || loc.lng == null) { setError('Son görüldüğü yeri haritada işaretle.'); return; }
            if (new Date(eventAt).getTime() > Date.now() + 5 * 60000) { setError('Zaman ileri bir tarih olamaz.'); return; }
        }
        if (step === 3 && photos.length === 0) { setError('En az bir fotoğraf ekle; tanınması için en önemli bilgi bu.'); return; }
        setStep(s => Math.min(4, s + 1));
    };

    const publish = async () => {
        setError(null);
        if (showPhone && !/^[0-9 +()-]{10,20}$/.test(phone.trim())) { setError('Geçerli bir telefon numarası yaz.'); return; }
        if (reward && !(Number(rewardAmount) > 0)) { setError('Ödül miktarını yaz ya da ödülü kapat.'); return; }
        setSaving(true);
        try {
            const { urls, kept } = await uploadPhotoItems(photos, lostService.uploadPhotos);
            setPhotos(kept);
            const res = await lostService.create({
                kind: 'lost', petId: pet?.id || null, petName: pet?.name || manual.name, species,
                breed: pet?.breed || manual.breed, color: pet?.color || null, gender: pet ? genderLabel(pet.gender) : manual.gender || null,
                ageText: null, photos: urls, features, approachNote: approach, situation, description,
                locationText: loc.address || null, lat: loc.lat!, lng: loc.lng!, eventAt: new Date(eventAt).toISOString(),
                rewardEnabled: reward, rewardAmount: reward ? Number(rewardAmount) : null,
                contactMode: showPhone ? 'phone' : 'in_app', contactPhone: showPhone ? phone : null, notifyRadiusKm: radius,
            });
            router.replace(`/kayip/${res.id}/yayinlandi?n=${res.notified}`);
        } catch (e: any) {
            setError(e?.message || 'İlan yayınlanamadı.');
            setSaving(false);
        }
    };

    return (
        <>
            <HealthHeader title="Kayıp İlanı Ver" backHref="/kayip" />
            <main className="max-w-2xl mx-auto px-4 space-y-5">
                <Stepper steps={STEPS} current={step} />

                {step === 1 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-black">Hangi hayvan için ilan veriyorsun?</h2>
                        {pets.map(p => (
                            <button key={p.id} onClick={() => setPetId(p.id)}
                                className={cn('w-full flex items-center gap-3 p-3 rounded-2xl border text-left', petId === p.id ? 'border-accent bg-accent/5' : 'border-card-border bg-card')}>
                                <PetAvatar src={p.image} name={p.name} className="w-14 h-14 rounded-xl text-lg" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-black">{p.name}</span>
                                    <span className="block text-xs font-semibold text-secondary truncate">{[p.breed || speciesLabel(p.type), genderLabel(p.gender)].filter(Boolean).join(' · ')}</span>
                                </span>
                                {petId === p.id && <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>}
                            </button>
                        ))}
                        <button onClick={() => setPetId('manual')}
                            className={cn('w-full p-3 rounded-2xl border text-sm font-bold text-left', petId === 'manual' ? 'border-accent bg-accent/5' : 'border-card-border bg-card')}>
                            + Pasaportta olmayan bir hayvan
                        </button>
                        {petId === 'manual' && (
                            <div className="space-y-3">
                                <Field label="Adı"><TextInput value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} /></Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Tür">
                                        <SelectInput value={manual.species} onChange={e => setManual(m => ({ ...m, species: e.target.value as Species }))}>
                                            <option value="dog">Köpek</option><option value="cat">Kedi</option><option value="other">Diğer</option>
                                        </SelectInput>
                                    </Field>
                                    <Field label="Cinsiyet">
                                        <SelectInput value={manual.gender} onChange={e => setManual(m => ({ ...m, gender: e.target.value }))}>
                                            <option value="">Bilinmiyor</option>
                                            {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </SelectInput>
                                    </Field>
                                </div>
                                <Field label="Irk"><TextInput value={manual.breed} onChange={e => setManual(m => ({ ...m, breed: e.target.value }))} /></Field>
                            </div>
                        )}
                        <p className="text-[11px] font-semibold text-secondary px-1">
                            Pasaporttaki hayvanını seçersen fotoğrafı ve bilgileri otomatik gelir; ilan yayında olduğu sürece künyesi de kayıp moduna geçer.
                        </p>
                    </section>
                )}

                {step === 2 && (
                    <section className="space-y-4">
                        <Field label="Ne zaman kayboldu?"><TextInput type="datetime-local" value={eventAt} max={toLocalInput(new Date())} onChange={e => setEventAt(e.target.value)} /></Field>
                        <div>
                            <div className="text-xs font-bold text-secondary mb-1.5">Son görüldüğü konum</div>
                            <LocationField lat={loc.lat} lng={loc.lng} address={loc.address} fallback={fallback} onChange={setLoc} />
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-secondary">Nasıl kayboldu?</div>
                            {LOST_SITUATIONS.map(s => <RadioRow key={s.id} checked={situation === s.id} onClick={() => setSituation(s.id)} label={s.label} />)}
                        </div>
                    </section>
                )}

                {step === 3 && (
                    <section className="space-y-4">
                        <div>
                            <div className="text-sm font-black">Fotoğraflar</div>
                            <div className="text-[11px] font-semibold text-secondary mb-2">En fazla 6. Yüzü ve ayırt edici yerleri net görünenler en işe yarayanlar.</div>
                            <PhotoPicker items={photos} onChange={setPhotos} />
                        </div>
                        <div>
                            <div className="text-sm font-black mb-2">Ayırt edici özellikler</div>
                            <ChipInput values={features} onChange={setFeatures} placeholder="Örn: sol kulağında kesik"
                                suggestions={['Tasmalı', 'Kırmızı tasma', 'Çipli', 'Kısırlaştırılmış', 'Topallıyor', 'Çok korkak']} />
                        </div>
                        <Field label="Yaklaşım notu" hint="Görenin nasıl davranması gerektiği">
                            <TextArea value={approach} onChange={e => setApproach(e.target.value)} maxLength={200} placeholder="Korkak, yaklaşmayın. Gören olursa konumu paylaşsın." />
                        </Field>
                        <Field label="Ek açıklama (isteğe bağlı)">
                            <TextArea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
                        </Field>
                    </section>
                )}

                {step === 4 && (
                    <section className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-black">İletişim tercihi</div>
                            <RadioRow checked={!showPhone} onClick={() => setShowPhone(false)} label="Sadece uygulama içi mesaj" hint="Telefonun görünmez (önerilen)" />
                            <RadioRow checked={showPhone} onClick={() => setShowPhone(true)} label="Uygulama içi mesaj + telefonumu göster" hint="Sadece giriş yapmış kişiler görür" />
                            {showPhone && <TextInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />}
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl px-4 py-2 space-y-2">
                            <ToggleRow on={reward} onChange={setReward} label="Ödül var mı?" hint="İsteğe bağlı" />
                            {reward && <TextInput type="number" inputMode="numeric" min={1} value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} placeholder="Ödül miktarı (TL)" />}
                        </div>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                            Tam konum sadece sana ve sisteme görünür. Haritada yaklaşık konum (~300 m) gösterilir.
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black">Bildirim alanı</span>
                                <span className="text-sm font-black text-accent">{radius} km</span>
                            </div>
                            <input type="range" min={1} max={10} value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
                            <p className="text-[11px] font-semibold text-secondary">
                                {reach == null ? 'Kaç kişiye bildirim gideceği hesaplanıyor…'
                                    : reach === 0 ? 'Bu alanda yakın çevre bildirimini açmış kimse yok şimdilik; ilanın haritada ve listede herkese görünür.'
                                        : `Bu alanda ${reach.toLocaleString('tr-TR')} kişiye bildirim gidecek.`}
                                {species === 'cat' ? ' Kediler genelde kaybolduğu yere çok yakın bulunur.' : ''}
                            </p>
                        </div>
                    </section>
                )}

                <ErrorText>{error}</ErrorText>
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => (step === 1 ? router.back() : setStep(s => s - 1))} className="h-12 rounded-2xl bg-card border border-card-border font-black text-sm">
                        {step === 1 ? 'Vazgeç' : 'Geri'}
                    </button>
                    {step < 4
                        ? <PrimaryButton onClick={next}>Devam et</PrimaryButton>
                        : <PrimaryButton onClick={publish} disabled={saving}>{saving ? 'Yayınlanıyor…' : 'İlanı yayınla'}</PrimaryButton>}
                </div>
            </main>
        </>
    );
}
