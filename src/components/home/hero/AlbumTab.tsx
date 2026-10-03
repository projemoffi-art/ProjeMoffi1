'use client';

// Üst kart → Albüm (Fotoğraflar & Anılar tek sekme, içeride ayrı bölümler). Tam albüm, yükleme ve anı düzenleme /album'da.
// PhotoStrip ve MemoryStrip Genel sekmesinde de kullanılır (aynı veri, usePetAlbum).

import Link from 'next/link';
import { Cake, Footprints, Heart, ImagePlus, Lock, MessageCircle, PawPrint, Play, Plus, Trophy } from 'lucide-react';
import { usePetAlbum } from '@/hooks/usePetAlbum';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import type { AlbumPet, Memory, MemoryIcon } from '@/services/albumService';
import type { Pet } from '@/context/PetContext';
import { SectionHeader, Skeleton } from '../homeUI';

type Album = ReturnType<typeof usePetAlbum>;

export function albumPetOf(pet: Pet): AlbumPet {
    return { id: pet.id, name: pet.name, avatar: pet.image || pet.avatar || null, cover: pet.cover_photo || null, birthday: pet.birthday || null, createdAt: pet.created_at || null };
}

export const MEMORY_ICON: Record<MemoryIcon, typeof Heart> = {
    heart: Heart, join: PawPrint, walk: Footprints, birthday: Cake, milestone: Trophy, post: MessageCircle,
};

export const memoryDate = (key: string) => formatDateKeyTr(key.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' });

export function PhotoStrip({ album, title = 'Son fotoğraflar' }: { album: Album; title?: string }) {
    const photos = album.data?.photos || [];
    if (!album.data && album.status !== 'error') {
        return <section><SectionHeader title={title} /><div className="grid grid-cols-5 gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-[16px]" />)}</div></section>;
    }
    if (photos.length === 0) {
        return (
            <section>
                <SectionHeader title={title} />
                <Link href="/album?add=1" className="card-premium rounded-[20px] p-4 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0"><ImagePlus className="w-5 h-5 text-accent" /></span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[14.5px] font-bold text-foreground">İlk fotoğrafı ekle</span>
                        <span className="block text-[12.5px] font-semibold text-secondary">Yürüyüş ve gönderi fotoğrafları da burada toplanır.</span>
                    </span>
                </Link>
            </section>
        );
    }
    const shown = photos.slice(0, 5);
    const rest = photos.length - shown.length;
    return (
        <section>
            <SectionHeader title={title} href="/album" />
            <div className="grid grid-cols-5 gap-2">
                {shown.map((p, i) => (
                    <Link key={p.key} href={`/album?open=${encodeURIComponent(p.key)}`} className="relative aspect-square rounded-[16px] overflow-hidden bg-foreground/[0.06]">
                        <img src={p.thumbUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                        {p.kind === 'video' && <Play className="absolute right-1.5 bottom-1.5 w-4 h-4 text-white drop-shadow" fill="currentColor" />}
                        {i === shown.length - 1 && rest > 0 && (
                            <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[17px] font-extrabold">+{rest}</span>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
}

function MemoryCard({ m }: { m: Memory }) {
    const Icon = MEMORY_ICON[m.icon];
    return (
        <Link href={`/album?tab=memories&open=${encodeURIComponent(m.key)}`} className="relative shrink-0 w-[46%] aspect-[4/5] rounded-[20px] overflow-hidden bg-[#3A2E24]">
            {m.cover
                ? <img src={m.cover.thumbUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 70% 20%, #F4A77F 0%, #E2734F 50%, #8E4A33 100%)' }} />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(20,15,10,0.78) 0%, rgba(20,15,10,0) 60%)' }} />
            <span className="absolute left-2.5 top-2.5 photo-chip w-8 h-8 rounded-full flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></span>
            {m.media.some(x => x.kind === 'video') && <span className="absolute right-2.5 top-2.5 photo-chip w-8 h-8 rounded-full flex items-center justify-center"><Play className="w-3.5 h-3.5 text-white" fill="currentColor" /></span>}
            <span className="absolute inset-x-2.5 bottom-2.5 text-white">
                <span className="block text-[13.5px] font-extrabold leading-tight line-clamp-2">{m.title}</span>
                <span className="block text-[11.5px] font-semibold text-white/80 mt-0.5">{memoryDate(m.date)}</span>
            </span>
        </Link>
    );
}

export function MemoryStrip({ album }: { album: Album }) {
    const memories = album.data?.memories || [];
    if (!album.data) return null;
    return (
        <section>
            <SectionHeader title="Anılar" href={memories.length ? '/album?tab=memories' : undefined} />
            {memories.length > 0 && (
                <div className="-mx-5 px-5 flex gap-2.5 overflow-x-auto no-scrollbar snap-x">
                    {memories.slice(0, 6).map(m => <MemoryCard key={m.key} m={m} />)}
                </div>
            )}
            <Link href="/album?tab=memories&new=1" className="mt-3 h-12 rounded-2xl bg-accent/10 text-accent text-[14.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <Plus className="w-5 h-5" strokeWidth={2.6} /> Yeni anı ekle
            </Link>
        </section>
    );
}

export function AlbumTab({ pet, userId }: { pet: Pet; userId?: string }) {
    const album = usePetAlbum(albumPetOf(pet), userId);
    const status = album.data?.status;
    return (
        <div className="space-y-6">
            {album.status === 'error' && !album.data && (
                <button type="button" onClick={album.reload} className="w-full card-premium rounded-[18px] px-4 py-3 text-[13.5px] font-bold text-foreground text-left">
                    {album.error} <span className="text-accent">Tekrar dene</span>
                </button>
            )}
            <PhotoStrip album={album} title="Fotoğraflar" />
            {status && (
                <div className="-mt-3 flex items-center justify-between gap-3 px-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-secondary">
                        <Lock className="w-3.5 h-3.5" /> Yalnızca sen görürsün · {status.mediaCount}/{status.limits.photosPerPet.toLocaleString('tr-TR')}
                    </span>
                    <Link href="/album?add=1" className="flex items-center gap-1 text-[13px] font-extrabold text-accent"><ImagePlus className="w-4 h-4" /> Ekle</Link>
                </div>
            )}
            <MemoryStrip album={album} />
        </div>
    );
}
