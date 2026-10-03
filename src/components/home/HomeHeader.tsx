'use client';

// Ana sayfa üst alanı (design-reference/home-final/true-reference/reference-screen-1-ust.png):
// fotoğraflı başlık, Moffi logosu, zil (gerçek okunmamış sayısı), profil fotoğrafı, selamlama + günün sözü.
// Kayıp modundaki hayvan varsa en üstte kırmızı şerit; birden fazla hayvan varsa küçük seçici.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, PawPrint } from 'lucide-react';
import { Avatar } from '@/components/social/SocialUI';
import { lostService } from '@/services/lostService';
import { haptics } from '@/native';
import type { Pet } from '@/context/PetContext';
import { baloo } from './homeUI';

const DAILY_QUOTES = [
    'Küçük patiler, büyük mutluluklar bırakır.',
    'Her pati izi, kalpte silinmez bir iz bırakır.',
    'Birlikte atılan her adım, dostluğu büyütür.',
    'Dünyanın en saf sevgisi, sallanan bir kuyrukta.',
    'Can dostunla geçen her an, en güzel hatıra.',
    'Bugün onun için küçük bir iyilik yap.',
];

function greetingFor(hour: number) {
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
}

export function HomeHeader({ firstName, userId, avatar, pets, activePetId, onSwitchPet, unreadCount }: {
    firstName: string;
    userId?: string;
    avatar?: string | null;
    pets: Pet[];
    activePetId?: string | null;
    onSwitchPet: (id: string) => void;
    unreadCount: number;
}) {
    // Saat ve söz istemcide seçilir (sunucu/istemci farkı olmasın diye ilk çizimde sabit).
    const [greeting, setGreeting] = useState('Merhaba');
    const [quote, setQuote] = useState(DAILY_QUOTES[0]);
    useEffect(() => {
        setGreeting(greetingFor(new Date().getHours()));
        const day = Math.floor(Date.now() / 86_400_000);
        setQuote(DAILY_QUOTES[day % DAILY_QUOTES.length]);
    }, []);

    const lostPets = useMemo(() => pets.filter(p => p.is_lost), [pets]);
    const [lostListingId, setLostListingId] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        if (lostPets.length === 0) { setLostListingId(null); return; }
        lostService.activeForPet(lostPets[0].id).then(l => { if (alive) setLostListingId(l?.id || null); }).catch(() => {});
        return () => { alive = false; };
    }, [lostPets]);

    return (
        <header className="relative -mx-5">
            {lostPets.length > 0 && (
                <Link
                    href={lostListingId ? `/kayip/${lostListingId}` : '/kayip'}
                    className="relative z-30 flex items-center gap-3 bg-emergency text-white px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5"
                >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                    <span className="flex-1 text-[13.5px] font-bold leading-tight">
                        {lostPets.map(p => p.name).join(', ')} kayıp olarak işaretli
                    </span>
                    <span className="flex items-center text-[12.5px] font-bold opacity-90">İlanı gör <ChevronRight className="w-4 h-4" /></span>
                </Link>
            )}

            <div className="relative h-[236px] overflow-hidden">
                <img
                    src="/images/header-hero.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover dark:brightness-[0.62]"
                    style={{ objectPosition: '72% 28%' }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 82%, transparent) 36%, transparent 70%)' }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-20"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, var(--background) 100%)' }}
                />

                <div className={`relative z-10 px-5 ${lostPets.length > 0 ? 'pt-4' : 'pt-[calc(env(safe-area-inset-top)+16px)]'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className={`${baloo.className} flex items-center gap-1 text-[30px] leading-none font-extrabold text-foreground`}>
                                Moffi <PawPrint className="w-5 h-5 text-accent -mt-2" fill="currentColor" strokeWidth={0} />
                            </div>
                            <p className="text-[12.5px] font-semibold text-secondary mt-1.5">Patiler, daha güzel yarınlar ♡</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
                                onClick={() => { haptics.tap(); window.dispatchEvent(new CustomEvent('open-notification-drawer')); }}
                                className="relative w-11 h-11 rounded-full bg-card/95 shadow-[0_4px_14px_rgba(32,27,22,0.12)] flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Bell className="w-[21px] h-[21px] text-foreground" strokeWidth={2} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10.5px] font-extrabold flex items-center justify-center border-2 border-card">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <Link
                                href={userId ? `/profile/${userId}` : '/home'}
                                aria-label="Profilim"
                                className="w-11 h-11 rounded-full p-[2px] bg-card shadow-[0_4px_14px_rgba(32,27,22,0.12)] active:scale-95 transition-transform"
                            >
                                <Avatar src={avatar} name={firstName} className="w-full h-full text-[15px]" />
                            </Link>
                        </div>
                    </div>

                    <h1 className={`${baloo.className} mt-6 text-[27px] leading-[1.1] font-bold text-foreground`}>
                        {greeting} {firstName}!
                    </h1>
                    <p className="mt-1.5 max-w-[215px] text-[13.5px] leading-snug font-semibold text-foreground/75">“{quote}”</p>
                </div>

                {pets.length > 1 && (
                    <div className="absolute z-10 right-5 bottom-10">
                        <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur rounded-full p-1 shadow-[0_4px_14px_rgba(32,27,22,0.12)]">
                            {pets.map(p => {
                                const active = p.id === activePetId;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        aria-label={`${p.name} seç`}
                                        aria-pressed={active}
                                        onClick={() => { haptics.tap(); onSwitchPet(p.id); }}
                                        className={`rounded-full transition-all ${active ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : 'opacity-60'}`}
                                    >
                                        <Avatar src={p.image || p.avatar} name={p.name} className="w-8 h-8 text-[13px]" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
