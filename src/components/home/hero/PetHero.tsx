'use client';

// Ana sayfa üst kartı (design-reference/home-final/hero-card, Baran onayı 2026-10-03).
// Kapalıyken yalnızca kart: seçili hayvanın fotoğrafı, ad + ırk/yaş, küçük selamlama, Moffi logosu, zil ve profil.
// Sekmeler (Genel · Sağlık · Albüm · Petler) kartın altından aşağı doğru çekmece açar; aynı sekme kapatır.
// Kartta sağa-sola kaydırmak hayvan değiştirir. Kayıp modundaki hayvan varsa en üstte kırmızı şerit.

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, Camera, ChevronRight, ChevronUp, Heart, Images, Loader2, PawPrint, Pencil, Plus, Users } from 'lucide-react';
import { Avatar } from '@/components/social/SocialUI';
import { lostService } from '@/services/lostService';
import { apiService } from '@/services/apiService';
import { shrinkForUpload } from '@/lib/media/compress';
import { ageText } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';
import { haptics } from '@/native';
import { showToast } from '@/lib/utils';
import type { Pet } from '@/context/PetContext';
import type { CareItem } from '@/hooks/useUpcomingCare';
import { baloo } from '../homeUI';
import type { DailyNote } from '../dailyNote';
import { GeneralTab } from './GeneralTab';
import { HealthTab } from './HealthTab';
import { AlbumTab } from './AlbumTab';
import { PetsTab } from './PetsTab';

export type HeroTab = 'general' | 'health' | 'album' | 'pets';

const TABS: { id: HeroTab; label: string; Icon: typeof Heart }[] = [
    { id: 'general', label: 'Genel', Icon: PawPrint },
    { id: 'health', label: 'Sağlık', Icon: Heart },
    { id: 'album', label: 'Albüm', Icon: Images },
    { id: 'pets', label: 'Petler', Icon: Users },
];

const noopSubscribe = () => () => {};

function greetingFor(hour: number) {
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
}

export function PetHero({ firstName, userId, avatar, pets, activePet, loading, onSwitchPet, onUpdatePet, onAddPet, unreadCount, note, careItems }: {
    firstName: string;
    userId?: string;
    avatar?: string | null;
    pets: Pet[];
    activePet: Pet | null;
    loading: boolean;
    onSwitchPet: (id: string) => void;
    onUpdatePet: (id: string, updates: Partial<Pet>) => void;
    onAddPet: () => void;
    unreadCount: number;
    note: DailyNote;
    careItems: CareItem[];
}) {
    const reduceMotion = useReducedMotion();
    // Saat ve gün istemcide okunur (sunucu çiziminde nötr selamlama, yaş boş).
    const greeting = useSyncExternalStore(noopSubscribe, () => greetingFor(new Date().getHours()), () => 'Merhaba');
    const today = useSyncExternalStore(noopSubscribe, todayKey, () => '');
    const [tab, setTab] = useState<HeroTab | null>(null);

    const lostPets = useMemo(() => pets.filter(p => p.is_lost), [pets]);
    const [lostListing, setLostListing] = useState<{ petId: string; id: string | null } | null>(null);
    const firstLostId = lostPets[0]?.id ?? null;
    useEffect(() => {
        if (!firstLostId) return;
        let alive = true;
        lostService.activeForPet(firstLostId).then(l => { if (alive) setLostListing({ petId: firstLostId, id: l?.id || null }); }).catch(() => {});
        return () => { alive = false; };
    }, [firstLostId]);
    const lostHref = lostListing && lostListing.petId === firstLostId && lostListing.id ? `/kayip/${lostListing.id}` : '/kayip';

    const pet = activePet;
    const photo = pet ? (pet.cover_photo || pet.image || pet.avatar || null) : null;
    const age = pet && today ? ageText(pet.birthday, pet.age, today) : null;
    const subtitle = pet ? [pet.breed || null, age].filter(Boolean).join(' · ') : '';
    const index = pet ? pets.findIndex(p => p.id === pet.id) : -1;

    // Kartta yatay kaydırma hayvan değiştirir. Dokunmatikte tarayıcı yatay hareketi kendine alıp işaretçi olaylarını
    // iptal ettiği için (pointercancel) dokunma olaylarıyla ölçülür; masaüstünde fare işaretçisiyle.
    const swipeStart = useRef<{ x: number; y: number } | null>(null);
    const swipeBegin = (x: number, y: number) => { swipeStart.current = { x, y }; };
    const swipeEnd = (x: number, y: number) => {
        const s0 = swipeStart.current;
        swipeStart.current = null;
        if (!s0 || pets.length < 2 || index < 0) return;
        const dx = x - s0.x, dy = y - s0.y;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        haptics.tap();
        onSwitchPet(pets[(index + (dx < 0 ? 1 : -1) + pets.length) % pets.length].id);
    };

    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const addCover = async (file: File | undefined) => {
        if (!file || !pet) return;
        setUploading(true);
        try {
            const url = await apiService.uploadMedia(await shrinkForUpload(file), 'avatars');
            onUpdatePet(pet.id, { cover_photo: url });
            showToast(`${pet.name} için kapak fotoğrafı eklendi`, 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch {
            showToast('Fotoğraf yüklenemedi, tekrar dene', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setUploading(false);
        }
    };

    const toggle = (id: HeroTab) => { haptics.tap(); setTab(t => (t === id ? null : id)); };
    const drawerTransition = reduceMotion ? { duration: 0 } : { type: 'spring' as const, damping: 32, stiffness: 300 };

    return (
        <>
            <header className="relative -mx-5">
                {lostPets.length > 0 && (
                    <Link href={lostHref} className="relative z-30 flex items-center gap-3 bg-emergency text-white px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 animate-ping" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                        <span className="flex-1 text-[13.5px] font-bold leading-tight">{lostPets.map(p => p.name).join(', ')} kayıp olarak işaretli</span>
                        <span className="flex items-center text-[12.5px] font-bold opacity-90">İlanı gör <ChevronRight className="w-4 h-4" /></span>
                    </Link>
                )}

                <div
                    className="relative h-[min(64vh,480px)] min-h-[410px] overflow-hidden bg-[#3A2E24] select-none"
                    onTouchStart={e => swipeBegin(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={e => swipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                    onPointerDown={e => { if (e.pointerType === 'mouse') swipeBegin(e.clientX, e.clientY); }}
                    onPointerUp={e => { if (e.pointerType === 'mouse') swipeEnd(e.clientX, e.clientY); }}
                >
                    <div className="absolute inset-0">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={pet?.id || 'empty'}
                                className="absolute inset-0"
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35 }}
                            >
                                {photo ? (
                                    <img src={photo} alt={pet ? `${pet.name} fotoğrafı` : ''} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                                ) : (
                                    <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 70% 20%, #F4A77F 0%, #E2734F 45%, #8E4A33 100%)' }}>
                                        <PawPrint className="absolute right-[-30px] top-[18%] w-64 h-64 text-white/10 rotate-[-18deg]" fill="currentColor" strokeWidth={0} />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(20,15,10,0.55) 0%, rgba(20,15,10,0) 100%)' }} />
                        <div className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(20,15,10,0.78) 0%, rgba(20,15,10,0.35) 55%, rgba(20,15,10,0) 100%)' }} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col pointer-events-none">
                        <div className={`px-5 ${lostPets.length > 0 ? 'pt-4' : 'pt-[calc(env(safe-area-inset-top)+14px)]'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className={`${baloo.className} flex items-center gap-1 text-[28px] leading-none font-extrabold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]`}>
                                    Moffi <PawPrint className="w-5 h-5 text-accent -mt-2" fill="currentColor" strokeWidth={0} />
                                </div>
                                <div className="flex items-center gap-2 pointer-events-auto">
                                    <button
                                        type="button"
                                        aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
                                        onClick={() => { haptics.tap(); window.dispatchEvent(new CustomEvent('open-notification-drawer')); }}
                                        className="glass-photo relative w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                                    >
                                        <Bell className="w-[21px] h-[21px] text-white" strokeWidth={2} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10.5px] font-extrabold flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <Link href={userId ? `/profile/${userId}` : '/home'} aria-label="Profilim" className="glass-photo w-11 h-11 rounded-full p-[3px] active:scale-95 transition-transform">
                                        <Avatar src={avatar} name={firstName} className="w-full h-full text-[15px]" />
                                    </Link>
                                </div>
                            </div>
                            <p className="mt-3 text-[15px] font-bold text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">{greeting}, {firstName}</p>
                        </div>

                        <div className="flex-1" />

                        <div className="px-5 pb-[46px]">
                            {loading ? (
                                <div className="space-y-2.5 animate-pulse">
                                    <div className="h-10 w-40 rounded-xl bg-white/20" />
                                    <div className="h-4 w-52 rounded-lg bg-white/15" />
                                </div>
                            ) : !pet ? (
                                <div className="pointer-events-auto">
                                    <h1 className={`${baloo.className} text-[34px] leading-none font-extrabold text-white`}>Dostunu ekle</h1>
                                    <p className="mt-2 text-[14.5px] font-semibold text-white/85">Sağlık, yürüyüş ve albüm burada başlar.</p>
                                    <button type="button" onClick={() => { haptics.tap(); onAddPet(); }} className="mt-4 h-12 px-5 rounded-2xl bg-white text-[#201B16] text-[15px] font-extrabold flex items-center gap-2 active:scale-[0.98] transition-transform">
                                        <Plus className="w-5 h-5 text-accent" strokeWidth={2.6} /> Evcil hayvan ekle
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <h1 className={`${baloo.className} min-w-0 truncate text-[42px] leading-[1.05] font-extrabold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]`}>{pet.name}</h1>
                                        <Link href="/pasaport/kimlik" aria-label={`${pet.name} kimlik bilgilerini düzenle`} className="pointer-events-auto glass-photo shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                                            <Pencil className="w-[17px] h-[17px] text-white" strokeWidth={2.2} />
                                        </Link>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between gap-3">
                                        <p className="min-w-0 truncate text-[15.5px] font-semibold text-white/90">{subtitle || 'Irk ve yaşını ekle'}</p>
                                        {pets.length > 1 && (
                                            <div className="flex gap-1.5 shrink-0" aria-label={`${pets.length} evcil hayvandan ${index + 1}.`}>
                                                {pets.map(p => <span key={p.id} className={`h-1.5 rounded-full transition-all ${p.id === pet.id ? 'w-4 bg-white' : 'w-1.5 bg-white/45'}`} />)}
                                            </div>
                                        )}
                                    </div>
                                    {!photo && (
                                        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                                            className="pointer-events-auto mt-3 glass-photo h-10 px-4 rounded-full text-white text-[13.5px] font-bold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-70">
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Fotoğraf ekle
                                        </button>
                                    )}
                                    <div role="tablist" aria-label={`${pet.name} bilgileri`} className="pointer-events-auto mt-4 grid grid-cols-4 gap-2.5">
                                        {TABS.map(t => {
                                            const active = tab === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={active}
                                                    aria-controls="pet-hero-drawer"
                                                    onClick={() => toggle(t.id)}
                                                    className={`h-[70px] rounded-[22px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${active ? 'bg-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]' : 'glass-photo'}`}
                                                >
                                                    <t.Icon className={`w-[22px] h-[22px] ${active ? 'text-accent' : 'text-white'}`} strokeWidth={2.2} fill={active && t.id === 'general' ? 'currentColor' : 'none'} />
                                                    <span className={`text-[12.5px] font-bold ${active ? 'text-accent' : 'text-white'}`}>{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { addCover(e.target.files?.[0]); e.target.value = ''; }} />
            </header>

            <div id="pet-hero-drawer" className="relative z-10 -mt-6 -mx-5 rounded-t-[28px] bg-background">
                <div className="pt-2.5 pb-3 flex justify-center"><span className="w-10 h-1.5 rounded-full bg-foreground/15" /></div>
                <AnimatePresence initial={false}>
                    {tab && pet && (
                        <motion.div
                            key="drawer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={drawerTransition}
                            className="overflow-hidden"
                        >
                            <div role="tabpanel" className="px-5 pt-1 pb-2">
                                {tab === 'general' && <GeneralTab pet={pet} userId={userId} today={today} note={note} careItems={careItems} />}
                                {tab === 'health' && <HealthTab pet={pet} today={today} careItems={careItems} />}
                                {tab === 'album' && <AlbumTab pet={pet} userId={userId} />}
                                {tab === 'pets' && (
                                    <PetsTab pets={pets} activePetId={pet.id} careItems={careItems} onAddPet={onAddPet}
                                        onSelect={id => { haptics.tap(); onSwitchPet(id); setTab('general'); }} />
                                )}
                                <button type="button" onClick={() => { haptics.tap(); setTab(null); }}
                                    className="mt-4 mx-auto flex items-center gap-1 h-9 px-4 rounded-full text-[13px] font-bold text-secondary active:bg-foreground/5">
                                    <ChevronUp className="w-4 h-4" /> Daralt
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
