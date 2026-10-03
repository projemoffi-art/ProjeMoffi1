'use client';

// Referans Ekran 4–7 — Sahiplendirme İlanı Ver (Temel · Sağlık & Uyum · Detay · İletişim).
// ?edit=<id> aynı sihirbazla ilanı düzenler; ?pet=<id> pasaporttaki hayvanı seçili açar.

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CheckCircle2 } from 'lucide-react';
import { HealthHeader, ErrorText, Field, LoadingBlocks, PrimaryButton, SelectInput, TextArea, TextInput } from '@/components/health/HealthUI';
import { PetAvatar } from '@/components/health/PetPicker';
import { LocationField, PhotoPicker, RadioRow, Stepper, ToggleRow, uploadPhotoItems, type PhotoItem } from '@/components/lost/LostUI';
import { CheckRow } from '@/components/adoption/AdoptionUI';
import { usePetHealthBundle } from '@/components/health/usePetHealthBundle';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { adoptionService, AGE_GROUPS, type AdoptionInput, type AgeGroup } from '@/services/adoptionService';
import type { Species } from '@/services/lostService';
import { currentPosition } from '@/lib/geo';
import { ageText } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';
import { GENDER_OPTIONS, genderLabel, speciesLabel } from '@/lib/petIdentity';
import { cn } from '@/lib/utils';

const STEPS = ['Temel', 'Sağlık & Uyum', 'Detay', 'İletişim'];

function toSpecies(t?: string | null): Species {
    const s = String(t || '').toLocaleLowerCase('tr-TR');
    return s === 'cat' || s === 'kedi' || s === '🐱' ? 'cat' : s === 'dog' || s === 'köpek' || s === '🐶' ? 'dog' : 'other';
}

function ageGroupFromBirthday(birthday?: string | null): AgeGroup | null {
    if (!birthday || !/^\d{4}-\d{2}-\d{2}/.test(birthday)) return null;
    const years = (Date.now() - new Date(birthday.slice(0, 10)).getTime()) / (365.25 * 86400000);
    return years < 1 ? 'baby' : years < 3 ? 'young' : years < 8 ? 'adult' : 'senior';
}

const SPECIES_CARDS: { id: Species; label: string; emoji: string }[] = [
    { id: 'cat', label: 'Kedi', emoji: '🐱' },
    { id: 'dog', label: 'Köpek', emoji: '🐶' },
    { id: 'other', label: 'Diğer', emoji: '🐾' },
];

export default function NewAdoptionPage() {
    return <Suspense fallback={null}><Wizard /></Suspense>;
}

function Wizard() {
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('edit');
    const { pets } = usePet();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(!editId);

    // 1) Temel
    const [petId, setPetId] = useState<string | 'other' | null>(params.get('pet'));
    const [name, setName] = useState('');
    const [species, setSpecies] = useState<Species>('cat');
    const [breed, setBreed] = useState('');
    // 2) Sağlık & uyum
    const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [health, setHealth] = useState({ vaccinated: false, neutered: false, microchipped: false, unknown: false });
    const [compat, setCompat] = useState({ kids: false, cats: false, dogs: false, others: false });
    // 3) Detay
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [description, setDescription] = useState('');
    const [healthNote, setHealthNote] = useState('');
    const [loc, setLoc] = useState<{ lat: number | null; lng: number | null; address: string }>({ lat: null, lng: null, address: '' });
    const [fallback, setFallback] = useState<[number, number]>([41.0082, 28.9784]);
    // 4) İletişim
    const [showPhone, setShowPhone] = useState(false);
    const [phone, setPhone] = useState('');
    const [publishNow, setPublishNow] = useState(true);
    const [isShelter, setIsShelter] = useState(false);

    const pet = useMemo(() => pets.find(p => p.id === petId) || null, [pets, petId]);
    const bundle = usePetHealthBundle(pet);
    // Barınak etiketi: kişi onaylı bir barınak işletmesinin sahibi/yöneticisi olmalı (sunucu is_approved_shelter ile aynı kuralı uygular).
    const myBusinesses = useMyBusinesses();
    const canShelter = myBusinesses.some(b => b.businessType === 'shelter' && b.approved && (b.role === 'owner' || b.role === 'manager'));

    useEffect(() => { currentPosition(8000).then(p => { if (p) setFallback([p.lat, p.lng]); }); }, []);
    // Ön doldurma: yeni ilanda kullanıcının telefonu, seçilen hayvanın pasaport bilgileri ve aşı durumu
    // (çizim sırasında önceki değerle karşılaştırma; düzenlemede ilanın kendi değerleri kullanılır).
    const userPhone = (user as { phone?: string } | null)?.phone || '';
    const [phoneFor, setPhoneFor] = useState<string | null>(null);
    if (!editId && user && phoneFor !== userPhone) {
        setPhoneFor(userPhone);
        setPhone(userPhone);
    }

    // Düzenleme: mevcut ilanı forma yükle.
    useEffect(() => {
        if (!editId) return;
        adoptionService.get(editId).then(l => {
            if (!l || !l.isMine) { setError('Bu ilanı sadece sahibi düzenleyebilir.'); setLoaded(true); return; }
            setPetId(l.petId || 'other'); setName(l.petName); setSpecies(l.species); setBreed(l.breed || '');
            setAgeGroup(l.ageGroup || ''); setAge(l.ageText || ''); setGender(l.gender || '');
            setHealth({ vaccinated: l.vaccinated, neutered: l.neutered, microchipped: l.microchipped, unknown: l.healthUnknown });
            setCompat({ kids: l.goodWithKids, cats: l.goodWithCats, dogs: l.goodWithDogs, others: l.goodWithOthers });
            setPhotos(l.photos.map(u => ({ url: u, preview: u })));
            setDescription(l.description || ''); setHealthNote(l.healthNote || '');
            setLoc({ lat: l.lat, lng: l.lng, address: l.locationText || '' });
            setShowPhone(l.contactMode === 'phone'); setPhone(l.contactPhone || ''); setIsShelter(l.isShelter);
            setLoaded(true);
        }).catch(() => { setError('İlan yüklenemedi.'); setLoaded(true); });
    }, [editId]);

    // Pasaporttaki hayvan seçilince kayıtlı bilgiler forma gelir (kullanıcı değiştirebilir).
    const [petFilledFor, setPetFilledFor] = useState<string | null>(null);
    if (pet && !editId && petFilledFor !== pet.id) {
        setPetFilledFor(pet.id);
        setName(pet.name); setSpecies(toSpecies(pet.type)); setBreed(pet.breed || '');
        setGender(genderLabel(pet.gender) || '');
        setAge(ageText(pet.birthday, pet.age, todayKey()) || '');
        setAgeGroup(ageGroupFromBirthday(pet.birthday) || '');
        setHealth(h => ({ ...h, neutered: !!pet.neutered, microchipped: !!pet.microchip }));
        setPhotos(pet.image ? [{ url: pet.image, preview: pet.image }] : []);
    }
    const [vaccinesFilledFor, setVaccinesFilledFor] = useState<string | null>(null);
    if (pet && !editId && bundle && vaccinesFilledFor !== pet.id) {
        setVaccinesFilledFor(pet.id);
        setHealth(h => ({ ...h, vaccinated: bundle.vaccines.some(v => v.status === 'completed') }));
    }

    const next = () => {
        setError(null);
        if (step === 1) {
            if (!petId) { setError('Bir hayvan seç.'); return; }
            if (!name.trim()) { setError('Hayvanın adını yaz.'); return; }
        }
        if (step === 2 && !ageGroup) { setError('Yaş grubunu seç.'); return; }
        if (step === 3) {
            if (photos.length === 0) { setError('En az bir fotoğraf ekle.'); return; }
            if (description.trim().length < 20) { setError('Kısa bir açıklama yaz (en az 20 karakter): karakteri, alışkanlıkları, nasıl bir yuva aradığı.'); return; }
            if (loc.lat == null || loc.lng == null) { setError('Haritada yaklaşık konumu işaretle.'); return; }
        }
        setStep(s => Math.min(4, s + 1));
    };

    const publish = async () => {
        setError(null);
        if (showPhone && !/^[0-9 +()-]{10,20}$/.test(phone.trim())) { setError('Geçerli bir telefon numarası yaz.'); return; }
        setSaving(true);
        try {
            const { urls, kept } = await uploadPhotoItems(photos, adoptionService.uploadPhotos);
            setPhotos(kept);
            const input: AdoptionInput = {
                petId: pet?.id || null, petName: name, species, breed, ageText: age, ageGroup: ageGroup || null, gender: gender || null,
                photos: urls, description, healthNote, locationText: loc.address || null, lat: loc.lat, lng: loc.lng,
                vaccinated: health.vaccinated, neutered: health.neutered, microchipped: health.microchipped, healthUnknown: health.unknown,
                goodWithKids: compat.kids, goodWithCats: compat.cats, goodWithDogs: compat.dogs, goodWithOthers: compat.others,
                contactMode: showPhone ? 'phone' : 'in_app', contactPhone: showPhone ? phone : null, isShelter: canShelter && isShelter,
            };
            if (editId) {
                await adoptionService.update(editId, input);
                router.replace(`/sahiplendirme/${editId}/yonet`);
                return;
            }
            const res = await adoptionService.create(input, publishNow);
            router.replace(publishNow ? `/sahiplendirme/${res.id}/yayinlandi?n=${res.notified}` : `/sahiplendirme/${res.id}/yonet`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'İlan kaydedilemedi.');
            setSaving(false);
        }
    };

    if (!loaded) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;

    return (
        <>
            <HealthHeader title={editId ? 'İlanı Düzenle' : 'Sahiplendirme İlanı Ver'} backHref="/sahiplendirme" />
            <main className="max-w-2xl mx-auto px-4 space-y-5">
                <Stepper steps={STEPS} current={step} />

                {step === 1 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-black">Hangi hayvan için ilan veriyorsun?</h2>
                        {!editId && pets.length > 0 && (
                            <div className="bg-card border border-card-border rounded-2xl p-3 space-y-2">
                                <div className="text-xs font-bold text-secondary">Moffi&apos;deki hayvanım · pasaporttaki bilgiler kullanılır</div>
                                {pets.map(p => (
                                    <button key={p.id} onClick={() => setPetId(p.id)}
                                        className={cn('w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left', petId === p.id ? 'border-accent bg-accent/5' : 'border-card-border bg-background')}>
                                        <PetAvatar src={p.image} name={p.name} className="w-12 h-12 rounded-xl text-lg" />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-black">{p.name}</span>
                                            <span className="block text-xs font-semibold text-secondary truncate">
                                                {[ageText(p.birthday, p.age, todayKey()), genderLabel(p.gender), p.breed || speciesLabel(p.type)].filter(Boolean).join(' · ')}
                                            </span>
                                        </span>
                                        {petId === p.id && <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!editId && (
                            <RadioRow checked={petId === 'other'} onClick={() => { setPetId('other'); setName(''); setBreed(''); setPhotos([]); }}
                                label="Başka bir hayvan" hint="Sahiplenmesi için ilan veriyorum (sokaktan aldığın, barınaktaki vb.)" />
                        )}
                        {petId && (
                            <div className="space-y-3 pt-1">
                                <div>
                                    <div className="text-sm font-black mb-2">Tür seç</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SPECIES_CARDS.map(s => (
                                            <button key={s.id} onClick={() => setSpecies(s.id)}
                                                className={cn('h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 font-black text-sm',
                                                    species === s.id ? 'border-accent bg-accent/10 text-accent' : 'border-card-border bg-card')}>
                                                <span className="text-2xl">{s.emoji}</span>{s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Field label="Adı"><TextInput value={name} maxLength={60} onChange={e => setName(e.target.value)} /></Field>
                                <Field label="Irk (isteğe bağlı)"><TextInput value={breed} maxLength={60} onChange={e => setBreed(e.target.value)} placeholder="Örn: Tekir, Golden karışık" /></Field>
                            </div>
                        )}
                        {pet && (
                            <p className="text-[11px] font-semibold text-secondary px-1">
                                Sahiplendirme tamamlanınca {pet.name} için pasaport devrini seçebilirsin; aşı ve muayene geçmişi pasaportla birlikte yeni ailesine gider.
                            </p>
                        )}
                    </section>
                )}

                {step === 2 && (
                    <section className="space-y-4">
                        <div className="text-sm font-black">Yaş ve cinsiyet</div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Yaş grubu">
                                <SelectInput value={ageGroup} onChange={e => setAgeGroup(e.target.value as AgeGroup)}>
                                    <option value="">Seç</option>
                                    {AGE_GROUPS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                </SelectInput>
                            </Field>
                            <Field label="Cinsiyet">
                                <SelectInput value={gender} onChange={e => setGender(e.target.value)}>
                                    <option value="">Bilinmiyor</option>
                                    {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </SelectInput>
                            </Field>
                        </div>
                        <Field label="Yaşı (isteğe bağlı)"><TextInput value={age} maxLength={30} onChange={e => setAge(e.target.value)} placeholder="Örn: 3 ay" /></Field>
                        <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                            <div className="text-sm font-black pt-1">Sağlık durumu</div>
                            <CheckRow checked={health.vaccinated} onChange={v => setHealth(h => ({ ...h, vaccinated: v, unknown: v ? false : h.unknown }))} label="Aşıları yapıldı" />
                            <CheckRow checked={health.neutered} onChange={v => setHealth(h => ({ ...h, neutered: v, unknown: v ? false : h.unknown }))} label="Kısırlaştırılmış" />
                            <CheckRow checked={health.microchipped} onChange={v => setHealth(h => ({ ...h, microchipped: v, unknown: v ? false : h.unknown }))} label="Çip var" />
                            <CheckRow checked={health.unknown} onChange={v => setHealth(v ? { vaccinated: false, neutered: false, microchipped: false, unknown: true } : h => ({ ...h, unknown: false }))} label="Bilmiyorum" />
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                            <div className="text-sm font-black pt-1">Uyum</div>
                            <CheckRow checked={compat.kids} onChange={v => setCompat(c => ({ ...c, kids: v }))} label="Çocuklarla uyumlu" />
                            <CheckRow checked={compat.cats} onChange={v => setCompat(c => ({ ...c, cats: v }))} label="Kedilerle uyumlu" />
                            <CheckRow checked={compat.dogs} onChange={v => setCompat(c => ({ ...c, dogs: v }))} label="Köpeklerle uyumlu" />
                            <CheckRow checked={compat.others} onChange={v => setCompat(c => ({ ...c, others: v }))} label="Diğer hayvanlarla uyumlu" />
                            <p className="text-[11px] font-semibold text-secondary pb-1">Emin olmadıklarını işaretleme; ilanda &quot;bilinmiyor&quot; görünür.</p>
                        </div>
                    </section>
                )}

                {step === 3 && (
                    <section className="space-y-4">
                        <div>
                            <div className="text-sm font-black">Fotoğraflar</div>
                            <div className="text-[11px] font-semibold text-secondary mb-2">En fazla 8. İlk fotoğraf kapak olur.</div>
                            <PhotoPicker items={photos} onChange={setPhotos} max={8} />
                        </div>
                        <Field label="Açıklama" hint={`${description.length}/1000 · Karakteri, alışkanlıkları ve nasıl bir yuva aradığı`}>
                            <TextArea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000}
                                placeholder="Sevgi dolu bir yuvaya ihtiyacı var. Oyuncu ve çok sakin bir yavru." />
                        </Field>
                        <Field label="Sağlık notu (isteğe bağlı)" hint="Örn: kronik bir durumu, özel beslenmesi">
                            <TextArea value={healthNote} onChange={e => setHealthNote(e.target.value)} maxLength={300} />
                        </Field>
                        <div>
                            <div className="text-xs font-bold text-secondary mb-1.5">Konum (haritada yaklaşık gösterilir)</div>
                            <LocationField lat={loc.lat} lng={loc.lng} address={loc.address} fallback={fallback} onChange={setLoc} />
                        </div>
                    </section>
                )}

                {step === 4 && (
                    <section className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-black">İletişim tercihi</div>
                            <RadioRow checked={!showPhone} onClick={() => setShowPhone(false)} label="Sadece uygulama içi mesaj" hint="Telefonun görünmez (önerilen)" />
                            <RadioRow checked={showPhone} onClick={() => setShowPhone(true)} label="Uygulama içi mesaj + telefon numaramı göster" hint="Sadece giriş yapmış kişiler görür" />
                            {showPhone && <TextInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />}
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
                            <div className="text-sm font-black">Gizlilik</div>
                            {['Tam konum sadece sana ve sisteme görünür.', 'Haritada yaklaşık konum gösterilir (~300 m).', 'Başvuranların bilgilerini sadece sen görürsün.'].map(t => (
                                <div key={t} className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{t}</div>
                            ))}
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                            {!editId && <ToggleRow on={publishNow} onChange={setPublishNow} label="İlanı hemen yayınla" hint={publishNow ? 'Yakınında bildirimi açık olanlara haber gider' : 'İlan kaydedilir, sen yayınlayana kadar görünmez'} />}
                            <ToggleRow on={canShelter && isShelter} onChange={v => canShelter && setIsShelter(v)}
                                label="Moffi'nin barınak iş ortağı mısınız?"
                                hint={canShelter ? 'İlanınız barınak profili altında, "Barınak" etiketiyle yayınlanır.' : 'Sadece onaylı barınak işletme hesaplarında açılır.'} />
                        </div>
                        <p className="text-[11px] font-semibold text-secondary px-1">
                            Moffi&apos;de sahiplendirme ücretsizdir; ilanda satış, fiyat ya da ödeme bilgisi olamaz.
                        </p>
                    </section>
                )}

                <ErrorText>{error}</ErrorText>
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => (step === 1 ? router.back() : setStep(s => s - 1))} className="h-12 rounded-2xl bg-card border border-card-border font-black text-sm">
                        {step === 1 ? 'Vazgeç' : 'Geri'}
                    </button>
                    {step < 4
                        ? <PrimaryButton onClick={next}>Devam et</PrimaryButton>
                        : <PrimaryButton onClick={publish} disabled={saving}>{saving ? 'Kaydediliyor…' : editId ? 'Kaydet' : publishNow ? 'İlanı yayınla' : 'İlanı kaydet'}</PrimaryButton>}
                </div>
            </main>
        </>
    );
}
