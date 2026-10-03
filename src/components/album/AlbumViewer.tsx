'use client';

// Albüm görüntüleyici: tam ekran fotoğraf/video, önceki/sonraki (kaydırma ve ok tuşları), işlemler.
// Albüme yüklenen dosya: Kapak yap · Anıya ekle · Sil. Yürüyüş/gönderi/profil fotoğrafı: Kapak yap · Kaynağına git
// (silme kendi ekranından; albüm kopya tutmaz).

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { BookHeart, ChevronLeft, ChevronRight, ExternalLink, ImageIcon, Loader2, Trash2, X } from 'lucide-react';
import { albumService, type AlbumPhoto } from '@/services/albumService';
import { formatDateKeyTr } from '@/lib/appointmentTime';

const SOURCE_LABEL: Record<AlbumPhoto['source'], string> = {
    album: 'Albüme yüklendi', walk: 'Yürüyüş fotoğrafı', post: 'Keşfet gönderisi', profile: 'Profil fotoğrafı',
};
const SOURCE_LINK: Record<AlbumPhoto['source'], string> = {
    album: '', walk: 'Yürüyüşe git', post: 'Gönderiye git', profile: 'Kimlik bilgileri',
};

export function AlbumViewer({ photos, index, onIndex, onClose, onCover, onRemove, onAddToMemory, busy }: {
    photos: AlbumPhoto[];
    index: number | null;
    onIndex: (i: number) => void;
    onClose: () => void;
    onCover: (p: AlbumPhoto) => void;
    onRemove: (p: AlbumPhoto) => void;
    onAddToMemory: (p: AlbumPhoto) => void;
    busy: boolean;
}) {
    const photo = index !== null ? photos[index] ?? null : null;
    const [resolved, setResolved] = useState<{ key: string; url: string | null; error: boolean } | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    useEffect(() => {
        if (!photo) return;
        let alive = true;
        albumService.fullUrlOf(photo)
            .then(url => { if (alive) setResolved({ key: photo.key, url, error: false }); })
            .catch(() => { if (alive) setResolved({ key: photo.key, url: null, error: true }); });
        return () => { alive = false; };
    }, [photo]);

    useEffect(() => {
        if (index === null) return;
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1);
            if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
        };
    }, [index, photos.length, onClose, onIndex]);

    const current = photo && resolved?.key === photo.key ? resolved : null;
    const swipe = (_: unknown, info: PanInfo) => {
        if (index === null) return;
        if (info.offset.x < -70 && index < photos.length - 1) onIndex(index + 1);
        else if (info.offset.x > 70 && index > 0) onIndex(index - 1);
    };

    return (
        <AnimatePresence>
            {photo && index !== null && (
                <motion.div
                    role="dialog"
                    aria-label="Fotoğraf"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[4600] bg-black text-white flex flex-col"
                >
                    <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-2">
                        <button type="button" onClick={onClose} aria-label="Kapat" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button>
                        <div className="text-center min-w-0">
                            <p className="text-[13.5px] font-bold">{SOURCE_LABEL[photo.source]}</p>
                            <p className="text-[12px] font-semibold text-white/60">{formatDateKeyTr(new Date(photo.date).toLocaleDateString('sv-SE'), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <span className="w-10 text-right text-[12px] font-semibold text-white/60 tabular-nums">{index + 1}/{photos.length}</span>
                    </div>

                    <motion.div className="relative flex-1 min-h-0 flex items-center justify-center touch-pan-y" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} dragSnapToOrigin onDragEnd={swipe}>
                        {!current ? (
                            <Loader2 className="w-7 h-7 animate-spin text-white/70" />
                        ) : current.error || !current.url ? (
                            <p className="text-sm font-semibold text-white/70">Dosya açılamadı.</p>
                        ) : photo.kind === 'video' ? (
                            <video key={current.url} src={current.url} controls playsInline className="max-w-full max-h-full" poster={photo.thumbUrl} />
                        ) : (
                            <img key={current.url} src={current.url} alt="" className="max-w-full max-h-full object-contain select-none" draggable={false} />
                        )}
                        {index > 0 && (
                            <button type="button" aria-label="Önceki" onClick={() => onIndex(index - 1)} className="hidden sm:flex absolute left-3 w-11 h-11 rounded-full bg-white/10 items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
                        )}
                        {index < photos.length - 1 && (
                            <button type="button" aria-label="Sonraki" onClick={() => onIndex(index + 1)} className="hidden sm:flex absolute right-3 w-11 h-11 rounded-full bg-white/10 items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
                        )}
                    </motion.div>

                    <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                        {confirmRemove === photo.key ? (
                            <div className="rounded-2xl bg-white/10 p-3">
                                <p className="text-[13.5px] font-semibold mb-3">Bu {photo.kind === 'video' ? 'video' : 'fotoğraf'} albümden kalıcı olarak silinsin mi?</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setConfirmRemove(null)} className="flex-1 h-11 rounded-xl bg-white/10 text-[14px] font-bold">Vazgeç</button>
                                    <button type="button" disabled={busy} onClick={() => { onRemove(photo); setConfirmRemove(null); }} className="flex-1 h-11 rounded-xl bg-[#D9432F] text-[14px] font-extrabold disabled:opacity-60">Sil</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 justify-center">
                                {photo.kind === 'photo' && (
                                    <Action onClick={() => onCover(photo)} disabled={busy} Icon={ImageIcon} label="Kapak yap" />
                                )}
                                {photo.source === 'album' ? (
                                    <>
                                        <Action onClick={() => onAddToMemory(photo)} disabled={busy} Icon={BookHeart} label={photo.memoryId ? 'Anıyı değiştir' : 'Anıya ekle'} />
                                        <Action onClick={() => setConfirmRemove(photo.key)} disabled={busy} Icon={Trash2} label="Sil" danger />
                                    </>
                                ) : photo.href ? (
                                    <Link href={photo.href} className="flex-1 max-w-[140px] h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-0.5 text-[12px] font-bold">
                                        <ExternalLink className="w-5 h-5" /> {SOURCE_LINK[photo.source]}
                                    </Link>
                                ) : null}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Action({ onClick, disabled, Icon, label, danger }: { onClick: () => void; disabled: boolean; Icon: typeof X; label: string; danger?: boolean }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            className={`flex-1 max-w-[140px] h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[12px] font-bold disabled:opacity-50 ${danger ? 'bg-[#D9432F]/20 text-[#FF8A75]' : 'bg-white/10'}`}>
            <Icon className="w-5 h-5" /> {label}
        </button>
    );
}
