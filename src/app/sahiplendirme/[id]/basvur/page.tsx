'use client';

// Referans Ekran 10 — Sahiplenme Başvurusu. Kısa ve samimi; bilgileri sadece ilan sahibi görür.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { HealthHeader, ErrorText, Field, LoadingBlocks, PrimaryButton, SelectInput, TextArea, TextInput } from '@/components/health/HealthUI';
import { CheckRow, listingFacts } from '@/components/adoption/AdoptionUI';
import { adoptionService, EXPERIENCE, HOME_FEATURES, HOME_TYPES, HOUSEHOLD, type AdoptionListing, type HomeType } from '@/services/adoptionService';
import { useAuth } from '@/context/AuthContext';
import { cn, showToast } from '@/lib/utils';

export default function ApplyPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [listing, setListing] = useState<AdoptionListing | null | undefined>(undefined);
    const [fullName, setFullName] = useState('');
    const [homeType, setHomeType] = useState<HomeType>('apartment');
    const [features, setFeatures] = useState<string[]>([]);
    const [household, setHousehold] = useState<string[]>([]);
    const [childrenAges, setChildrenAges] = useState('');
    const [experience, setExperience] = useState<'none' | 'past' | 'current' | ''>('');
    const [experienceNote, setExperienceNote] = useState('');
    const [reference, setReference] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => { adoptionService.get(id).then(setListing).catch(() => setListing(null)); }, [id]);
    useEffect(() => { if (user?.name && !fullName) setFullName(user.name); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    if (listing === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!listing || listing.isMine || listing.status !== 'active' || listing.myApplicationId) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">{listing?.myApplicationId ? 'Bu ilana zaten başvurdun' : 'Bu ilan şu an başvuru almıyor'}</h1>
                <Link href={listing?.myApplicationId ? '/sahiplendirme/basvurularim' : '/sahiplendirme'} className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">
                    {listing?.myApplicationId ? 'Başvurularım' : 'Sahiplendirme ilanları'}
                </Link>
            </main>
        );
    }

    const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
    const hasChildren = household.includes('children');

    const submit = async () => {
        setError(null);
        if (fullName.trim().length < 2) { setError('Adını ve soyadını yaz.'); return; }
        if (household.length === 0) { setError('Evde kimlerin yaşadığını seç.'); return; }
        if (message.trim().length < 20) { setError('Kendinden biraz bahset (en az 20 karakter).'); return; }
        setSending(true);
        try {
            await adoptionService.apply(listing.id, {
                fullName, homeType, homeFeatures: features, household, childrenAges: hasChildren ? childrenAges : '',
                experience: experience || null, experienceNote, reference, message,
            });
            showToast('Başvurun iletildi. Durumunu Başvurularım\'dan takip edebilirsin.', 'CheckCircle2', 'text-emerald-500 font-bold');
            router.replace('/sahiplendirme/basvurularim');
        } catch (e: any) {
            setError(e?.message || 'Başvuru gönderilemedi.');
            setSending(false);
        }
    };

    return (
        <>
            <HealthHeader title="Sahiplenme Başvurusu" backHref={`/sahiplendirme/${id}`} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
                    {listing.photos[0] && <img src={listing.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                    <div className="min-w-0">
                        <div className="text-base font-black truncate">{listing.petName}</div>
                        <div className="text-xs font-semibold text-secondary truncate">{listingFacts(listing)}</div>
                    </div>
                </div>
                <p className="text-sm font-semibold text-secondary">
                    {listing.petName} için başvuru yapmak istiyorsun. Kendini ve yaşam koşullarını kısaca anlat; bu bilgileri sadece ilan sahibi görür.
                </p>

                <Field label="Ad soyad"><TextInput value={fullName} maxLength={80} onChange={e => setFullName(e.target.value)} /></Field>

                <div className="space-y-2">
                    <Field label="Yaşam ortamı">
                        <SelectInput value={homeType} onChange={e => setHomeType(e.target.value as HomeType)}>
                            {HOME_TYPES.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                        </SelectInput>
                    </Field>
                    <div className="flex flex-wrap gap-1.5">
                        {HOME_FEATURES.map(f => (
                            <button key={f} type="button" onClick={() => setFeatures(toggle(features, f))}
                                className={cn('px-3 h-8 rounded-full text-xs font-bold border', features.includes(f) ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-card border-card-border text-secondary')}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                    <div className="text-sm font-black pt-1">Evde kimler yaşıyor?</div>
                    <div className="grid grid-cols-2 gap-x-3">
                        {HOUSEHOLD.map(h => <CheckRow key={h.id} checked={household.includes(h.id)} onChange={() => setHousehold(toggle(household, h.id))} label={h.label} />)}
                    </div>
                    {hasChildren && <TextInput value={childrenAges} maxLength={80} onChange={e => setChildrenAges(e.target.value)} placeholder="Çocukların yaşı (örn: 8 ve 12)" className="mb-2" />}
                </div>

                <Field label="Daha önce hayvan sahibi oldun mu?">
                    <SelectInput value={experience} onChange={e => setExperience(e.target.value as any)}>
                        <option value="">Seç</option>
                        {EXPERIENCE.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </SelectInput>
                </Field>
                {experience && experience !== 'none' && (
                    <Field label="Kısaca (isteğe bağlı)"><TextInput value={experienceNote} maxLength={200} onChange={e => setExperienceNote(e.target.value)} placeholder="Örn: 3 yıl kedi baktım" /></Field>
                )}

                <Field label="Kendinden bahset" hint={`${message.length}/500`}>
                    <TextArea value={message} maxLength={500} onChange={e => setMessage(e.target.value)}
                        placeholder="Evde daha önce kedi baktım, şu anda sakin bir ortamda yaşıyorum…" />
                </Field>
                <Field label="Referans / ek bilgi (isteğe bağlı)"><TextInput value={reference} maxLength={200} onChange={e => setReference(e.target.value)} placeholder="Örn: veterinerim, daha önce sahiplendiğim dernek" /></Field>

                <ErrorText>{error}</ErrorText>
                <PrimaryButton onClick={submit} disabled={sending}>{sending ? 'Gönderiliyor…' : 'Başvuruyu gönder'}</PrimaryButton>
                <p className="text-[11px] font-semibold text-secondary text-center">Telefon numaran başvuruda paylaşılmaz; ilan sahibi seninle Moffi mesajlarından iletişime geçer.</p>
            </main>
        </>
    );
}
