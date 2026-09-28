"use client";

// Künye sayfası: künyedeki QR/NFC'yi okutan kişi (giriş gerekmez) burayı görür.
// Veri get_pet_tag_info'dan gelir; kayıp değilse sadece adı, ırkı ve fotoğrafı görünür.
// Kayıpsa sahibin izin verdiği iletişim + acil sağlık bilgileri gösterilir, bulan kişi
// mesaj/konum bırakabilir (submit_tag_report → sahibine bildirim ve e-posta).

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmergencyInfoCard } from '@/components/health/EmergencyInfoCard';
import { speciesLabel } from '@/lib/petIdentity';

interface TagInfo {
    pet_name: string; species: string | null; breed: string | null; gender: string | null; age: string | null;
    avatar_url: string | null; is_lost: boolean; finder_message: string | null; reward_amount: number | null; owner_phone: string | null;
}

export default function PetTagPage() {
    const params = useParams();
    const petId = String(params?.petId || '');
    const [info, setInfo] = useState<TagInfo | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

    useEffect(() => {
        if (!/^[0-9a-f-]{36}$/i.test(petId)) { setState('missing'); return; }
        supabase.rpc('get_pet_tag_info', { p_pet_id: petId }).then(({ data, error }) => {
            const row = (Array.isArray(data) ? data[0] : data) as TagInfo | undefined;
            if (error || !row) { setState('missing'); return; }
            setInfo(row);
            setState('ready');
        });
    }, [petId]);

    return (
        <div className="theme-vet min-h-[100dvh] bg-background text-foreground">
            <main className="max-w-md mx-auto px-5 py-8 space-y-5">
                <div className="text-sm font-black text-accent">Moffi · Künye</div>

                {state === 'loading' && <div className="h-64 rounded-3xl bg-card border border-card-border animate-pulse" />}

                {state === 'missing' && (
                    <div className="bg-card border border-card-border rounded-3xl p-6 text-center space-y-2">
                        <h1 className="text-lg font-black">Künye bulunamadı</h1>
                        <p className="text-sm font-semibold text-secondary">Bu kod Moffi'de kayıtlı bir evcil hayvana ait görünmüyor.</p>
                    </div>
                )}

                {state === 'ready' && info && (
                    <>
                        <section className="text-center space-y-3">
                            {info.avatar_url
                                ? <img src={info.avatar_url} alt="" className="w-36 h-36 rounded-3xl object-cover mx-auto" />
                                : <div className="w-36 h-36 rounded-3xl bg-accent/15 text-accent text-5xl font-black flex items-center justify-center mx-auto">{info.pet_name.charAt(0)}</div>}
                            <div>
                                <h1 className="text-3xl font-black">{info.pet_name}</h1>
                                <p className="text-sm font-semibold text-secondary">{[speciesLabel(info.species), info.breed].filter(Boolean).join(' · ')}</p>
                            </div>
                        </section>

                        {!info.is_lost ? (
                            <section className="bg-card border border-card-border rounded-3xl p-5 text-center space-y-2">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                                <h2 className="text-lg font-black">Ben güvendeyim</h2>
                                <p className="text-sm font-semibold text-secondary">Sahibim yanımda ya da evimdeyim. Beni kayıp gibi görürsen sahibim künyeyi kayıp moduna aldığında burada iletişim bilgileri çıkar.</p>
                            </section>
                        ) : (
                            <>
                                <section className="rounded-3xl bg-red-600 text-white p-5 space-y-2">
                                    <div className="flex items-center gap-2 font-black"><ShieldAlert className="w-5 h-5" /> Kayıbım, ailemi arıyorum</div>
                                    <p className="text-sm font-semibold text-white/90">
                                        {info.finder_message || 'Beni gördüysen lütfen ani hareket yapmadan yaklaş ve sahibime haber ver.'}
                                    </p>
                                    {info.reward_amount ? <p className="text-sm font-black">Sahibim {info.reward_amount} TL ödül veriyor.</p> : null}
                                </section>

                                {info.owner_phone && (
                                    <a href={`tel:${info.owner_phone.replace(/\s/g, '')}`}
                                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent text-white font-black">
                                        <Phone className="w-5 h-5" /> Sahibini ara
                                    </a>
                                )}

                                <EmergencyInfoCard petId={petId} context="lost" />
                                <ReportForm petId={petId} petName={info.pet_name} />
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function ReportForm({ petId, petName }: { petId: string; petName: string }) {
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const locate = () => {
        if (!navigator.geolocation) { setError('Cihazın konum paylaşmayı desteklemiyor.'); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); setError(null); },
            () => { setLocating(false); setError('Konum alınamadı. Tarayıcı izinlerini kontrol et.'); },
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };

    const send = async () => {
        setSending(true);
        setError(null);
        const { error: err } = await supabase.rpc('submit_tag_report', {
            p_pet_id: petId, p_message: message, p_contact: contact, p_lat: coords?.lat ?? null, p_lng: coords?.lng ?? null,
        });
        setSending(false);
        if (err) setError(err.message || 'Gönderilemedi, tekrar dene.');
        else setSent(true);
    };

    if (sent) {
        return (
            <section className="bg-card border border-card-border rounded-3xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h2 className="text-lg font-black">Teşekkürler, sahibine iletildi</h2>
                <p className="text-sm font-semibold text-secondary">{petName}'in sahibine bildirim ve e-posta gönderildi.</p>
            </section>
        );
    }

    return (
        <section className="bg-card border border-card-border rounded-3xl p-5 space-y-3">
            <h2 className="text-base font-black">Sahibine haber ver</h2>
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500}
                placeholder="Örn: Parkın girişinde gördüm, yanında bekliyorum."
                className="w-full min-h-[88px] px-4 py-3 rounded-2xl bg-background border border-card-border text-sm font-semibold outline-none focus:border-accent" />
            <input value={contact} onChange={e => setContact(e.target.value)} maxLength={100}
                placeholder="Sana nasıl ulaşsın? (isteğe bağlı, telefon ya da ad)"
                className="w-full h-12 px-4 rounded-2xl bg-background border border-card-border text-sm font-semibold outline-none focus:border-accent" />
            <button onClick={locate} disabled={locating}
                className="w-full h-11 rounded-2xl border border-card-border text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
                <MapPin className="w-4 h-4" /> {coords ? 'Konumun eklendi' : locating ? 'Konum alınıyor…' : 'Konumumu ekle'}
            </button>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button onClick={send} disabled={sending || (!message.trim() && !coords)}
                className="w-full h-12 rounded-2xl bg-accent text-white font-black disabled:opacity-50">
                {sending ? 'Gönderiliyor…' : 'Gönder'}
            </button>
            <p className="text-[11px] font-semibold text-secondary">Yazdıkların ve konumun sadece hayvanın sahibine gider.</p>
        </section>
    );
}
