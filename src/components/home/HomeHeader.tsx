'use client';

// Ana sayfa üst alanı (design-reference/home-final): fotoğraflı başlık, Moffi logosu; sağda hayvan seçici, zil ve
// profil; selamlama ve altında kişiye özel "günün notu" (dailyNote.ts). Kayıp modundaki hayvan varsa en üstte şerit.
// Hayvan seçimi alttan açılan çekmecede: tek hayvanda da aynı yer (o hayvan + "Evcil hayvan ekle").

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bell, Check, ChevronDown, ChevronRight, IdCard, Info, Lightbulb, PartyPopper, PawPrint, Plus, X } from 'lucide-react';
import { Avatar } from '@/components/social/SocialUI';
import { lostService } from '@/services/lostService';
import { haptics } from '@/native';
import type { Pet } from '@/context/PetContext';
import { baloo } from './homeUI';
import type { DailyNote } from './dailyNote';

function greetingFor(hour: number) {
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
}

const NOTE_STYLE: Record<DailyNote['tone'], { Icon: typeof Info; color: string }> = {
    alert: { Icon: AlertCircle, color: '#D9432F' },
    info: { Icon: Info, color: '#C9771F' },
    good: { Icon: PartyPopper, color: '#4E8A23' },
    tip: { Icon: Lightbulb, color: '#C9771F' },
};

export function HomeHeader({ firstName, userId, avatar, pets, activePet, onSwitchPet, onAddPet, unreadCount, note }: {
    firstName: string;
    userId?: string;
    avatar?: string | null;
    pets: Pet[];
    activePet: Pet | null;
    onSwitchPet: (id: string) => void;
    onAddPet: () => void;
    unreadCount: number;
    note: DailyNote;
}) {
    const router = useRouter();
    // Saat istemcide seçilir (sunucu/istemci farkı olmasın diye ilk çizimde nötr).
    const [greeting, setGreeting] = useState('Merhaba');
    useEffect(() => { setGreeting(greetingFor(new Date().getHours())); }, []);
    const [petsOpen, setPetsOpen] = useState(false);

    useEffect(() => {
        if (!petsOpen) return;
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        return () => { window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true })); };
    }, [petsOpen]);

    const lostPets = useMemo(() => pets.filter(p => p.is_lost), [pets]);
    const [lostListingId, setLostListingId] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        if (lostPets.length === 0) { setLostListingId(null); return; }
        lostService.activeForPet(lostPets[0].id).then(l => { if (alive) setLostListingId(l?.id || null); }).catch(() => {});
        return () => { alive = false; };
    }, [lostPets]);

    const others = pets.filter(p => p.id !== activePet?.id);
    const noteStyle = NOTE_STYLE[note.tone];
    const noteBody = (
        <>
            <noteStyle.Icon className="w-4 h-4 shrink-0 mt-[1px]" style={{ color: noteStyle.color }} strokeWidth={2.4} />
            <span>{note.text}</span>
        </>
    );
    const noteClass = 'glass mt-3 inline-flex items-start gap-2 max-w-[255px] rounded-[18px] px-3 py-2 text-[13px] leading-snug font-semibold text-foreground';

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

            <div className="relative min-h-[232px] pb-12 overflow-hidden">
                <img
                    src="/images/header-hero.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover dark:brightness-[0.62]"
                    style={{ objectPosition: '72% 28%' }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 82%, transparent) 38%, transparent 72%)' }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-20"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, var(--background) 100%)' }}
                />

                <div className={`relative z-10 px-5 ${lostPets.length > 0 ? 'pt-4' : 'pt-[calc(env(safe-area-inset-top)+16px)]'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <div className={`${baloo.className} flex items-center gap-1 text-[30px] leading-none font-extrabold text-foreground`}>
                            Moffi <PawPrint className="w-5 h-5 text-accent -mt-2" fill="currentColor" strokeWidth={0} />
                        </div>
                        <div className="flex items-center gap-2">
                            {pets.length > 0 && (
                                <button
                                    type="button"
                                    aria-label={`Evcil hayvan: ${activePet?.name || ''}. Değiştir`}
                                    onClick={() => { haptics.tap(); setPetsOpen(true); }}
                                    className="glass relative h-11 rounded-full pl-1 pr-2 flex items-center gap-0.5 active:scale-95 transition-transform"
                                >
                                    <span className="relative flex">
                                        <Avatar src={activePet?.image || activePet?.avatar} name={activePet?.name || 'M'} className="w-9 h-9 text-[14px] ring-2 ring-card" />
                                        {others[0] && (
                                            <Avatar src={others[0].image || others[0].avatar} name={others[0].name} className="w-6 h-6 text-[10px] ring-2 ring-card -ml-3 mt-4" />
                                        )}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-secondary" />
                                </button>
                            )}
                            <button
                                type="button"
                                aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
                                onClick={() => { haptics.tap(); window.dispatchEvent(new CustomEvent('open-notification-drawer')); }}
                                className="glass relative w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
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
                                className="glass w-11 h-11 rounded-full p-[3px] active:scale-95 transition-transform"
                            >
                                <Avatar src={avatar} name={firstName} className="w-full h-full text-[15px]" />
                            </Link>
                        </div>
                    </div>

                    <h1 className={`${baloo.className} mt-8 text-[28px] leading-[1.1] font-bold text-foreground`}>
                        {greeting} {firstName}!
                    </h1>
                    {note.href
                        ? <Link href={note.href} className={noteClass}>{noteBody}</Link>
                        : <div className={noteClass}>{noteBody}</div>}
                </div>
            </div>

            <AnimatePresence>
                {petsOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPetsOpen(false)} className="fixed inset-0 z-[4500] bg-black/40" />
                        <motion.div
                            role="dialog"
                            aria-label="Evcil hayvanlarım"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.4 }}
                            onDragEnd={(_, info) => { if (info.offset.y > 100) setPetsOpen(false); }}
                            className="theme-vet fixed bottom-0 inset-x-0 z-[4501] mx-auto max-w-md rounded-t-[28px] bg-background text-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.25)] pb-[calc(env(safe-area-inset-bottom)+18px)]"
                        >
                            <div className="pt-2.5 pb-1 flex justify-center"><span className="w-10 h-1.5 rounded-full bg-foreground/15" /></div>
                            <div className="flex items-center justify-between px-5 pb-3">
                                <h2 className={`${baloo.className} text-[21px] font-bold`}>Evcil hayvanlarım</h2>
                                <button type="button" onClick={() => setPetsOpen(false)} aria-label="Kapat" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-foreground/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-4 space-y-2">
                                {pets.map(p => {
                                    const active = p.id === activePet?.id;
                                    return (
                                        <div key={p.id} className={`card-premium rounded-[20px] flex items-center gap-3 p-2.5 ${active ? 'ring-2 ring-accent/70' : ''}`}>
                                            <button type="button" onClick={() => { haptics.tap(); onSwitchPet(p.id); setPetsOpen(false); }} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                                                <Avatar src={p.image || p.avatar} name={p.name} className="w-12 h-12 text-[18px]" />
                                                <span className="min-w-0">
                                                    <span className="block text-[15.5px] font-extrabold truncate">{p.name}</span>
                                                    <span className="block text-[12.5px] font-semibold text-secondary truncate">{p.breed || 'Irk belirtilmemiş'}{p.is_lost ? ' · Kayıp' : ''}</span>
                                                </span>
                                                {active && <span className="ml-auto mr-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shrink-0"><Check className="w-4 h-4" strokeWidth={3} /></span>}
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`${p.name} pasaportu`}
                                                onClick={() => { haptics.tap(); onSwitchPet(p.id); setPetsOpen(false); router.push('/pasaport'); }}
                                                className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0"
                                            >
                                                <IdCard className="w-[18px] h-[18px] text-secondary" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => { haptics.tap(); setPetsOpen(false); onAddPet(); }}
                                    className="w-full rounded-[20px] border-2 border-dashed border-card-border flex items-center gap-3 p-2.5 text-left active:bg-foreground/[0.03]"
                                >
                                    <span className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"><Plus className="w-6 h-6 text-accent" /></span>
                                    <span className="text-[15px] font-extrabold text-accent">Evcil hayvan ekle</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
