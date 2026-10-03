'use client';

// Referans Ekran 1 — hikâye çubuğu (24 saat). Görüntüleyici: ilerleme çubukları, dokunarak geçiş, basılı tutarak
// durdurma; kendi hikâyende görüntüleyenler ve silme, başkasınınkinde beğeni.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Heart, Plus, Trash2, X } from 'lucide-react';
import { ErrorText, LoadingBlocks, PrimaryButton, Sheet } from '@/components/health/HealthUI';
import { Avatar, PersonRow } from '@/components/social/SocialUI';
import { renderEdited, DEFAULT_EDIT } from '@/components/social/MediaEditor';
import { socialService, timeAgo, type PersonCard, type StoryGroup } from '@/services/socialService';
import { useAuth } from '@/context/AuthContext';
import { cn, errorMessage, showToast } from '@/lib/utils';

const STORY_MS = 5000;

export function StoriesBar({ groups, reload }: { groups: StoryGroup[]; reload: () => void }) {
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [viewer, setViewer] = useState<number | null>(null);
    const [pending, setPending] = useState<File | null>(null);

    const mine = groups.find(g => g.userId === user?.id);
    const others = groups.filter(g => g.userId !== user?.id);
    const ordered = mine ? [mine, ...others] : others;

    return (
        <>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 py-1">
                {user && (
                    <div className="flex flex-col items-center gap-1 shrink-0 w-16">
                        <div className="relative">
                            <button onClick={() => (mine ? setViewer(0) : fileRef.current?.click())} aria-label={mine ? 'Hikâyeni gör' : 'Hikâye ekle'}
                                className={cn('w-16 h-16 rounded-full p-[2.5px]', mine ? 'bg-accent' : 'bg-card-border')}>
                                <Avatar src={user.avatar} name={user.name || 'Sen'} className="w-full h-full border-2 border-background" />
                            </button>
                            <button onClick={() => fileRef.current?.click()} aria-label="Hikâye ekle"
                                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent text-white border-2 border-background flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <span className="text-[11px] font-bold">Sen</span>
                    </div>
                )}
                {others.map(g => (
                    <button key={g.userId} onClick={() => setViewer(ordered.indexOf(g))} className="flex flex-col items-center gap-1 shrink-0 w-16">
                        <span className={cn('w-16 h-16 rounded-full p-[2.5px]', g.hasUnseen ? 'bg-accent' : 'bg-card-border')}>
                            <Avatar src={g.avatar} name={g.name} className="w-full h-full border-2 border-background" />
                        </span>
                        <span className="text-[11px] font-bold truncate w-full text-center">{g.name}</span>
                    </button>
                ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPending(f); e.target.value = ''; }} />

            <NewStorySheet file={pending} onClose={() => setPending(null)} onDone={() => { setPending(null); reload(); }} />
            {viewer !== null && ordered[viewer] && (
                <StoryViewer groups={ordered} start={viewer} onClose={() => { setViewer(null); reload(); }} />
            )}
        </>
    );
}

function NewStorySheet({ file, onClose, onDone }: { file: File | null; onClose: () => void; onDone: () => void }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (!file) return;
        const u = URL.createObjectURL(file); setPreview(u); setCaption(''); setError(null);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    const share = async () => {
        if (!file || !preview) return;
        setSaving(true); setError(null);
        try {
            const blob = await renderEdited(preview, DEFAULT_EDIT, 1600);
            await socialService.addStory(new File([blob], 'hikaye.jpg', { type: 'image/jpeg' }), caption);
            showToast('Hikâyen 24 saat boyunca görünecek.', 'CheckCircle2', 'text-emerald-500 font-bold');
            onDone();
        } catch (e) { setError(errorMessage(e, 'Paylaşılamadı.')); }
        finally { setSaving(false); }
    };
    return (
        <Sheet open={!!file} onClose={onClose} title="Yeni hikâye">
            {preview && <img loading="lazy" decoding="async" src={preview} alt="" className="w-full max-h-[50vh] object-contain rounded-2xl bg-black" />}
            <input value={caption} onChange={e => setCaption(e.target.value)} maxLength={120} placeholder="Kısa bir not (isteğe bağlı)"
                className="w-full h-12 px-4 rounded-2xl bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={share} disabled={saving}>{saving ? 'Paylaşılıyor…' : 'Hikâyede paylaş'}</PrimaryButton>
        </Sheet>
    );
}

function StoryViewer({ groups, start, onClose }: { groups: StoryGroup[]; start: number; onClose: () => void }) {
    const { user } = useAuth();
    const [g, setG] = useState(start);
    const [s, setS] = useState(() => Math.max(0, groups[start].stories.findIndex(x => !x.isViewed)));
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [liked, setLiked] = useState<Record<string, boolean>>({});
    const [viewers, setViewers] = useState<(PersonCard & { liked: boolean })[] | null>(null);
    const [showViewers, setShowViewers] = useState(false);
    const [deleted, setDeleted] = useState<Set<string>>(new Set());

    const group = groups[g];
    const stories = group.stories.filter(x => !deleted.has(x.id));
    const story = stories[Math.min(s, stories.length - 1)];
    const own = group.userId === user?.id;

    const next = useCallback(() => {
        setProgress(0);
        if (s < stories.length - 1) setS(s + 1);
        else if (g < groups.length - 1) { setG(g + 1); setS(0); }
        else onClose();
    }, [s, g, stories.length, groups.length, onClose]);
    const prev = () => {
        setProgress(0);
        if (s > 0) setS(s - 1);
        else if (g > 0) { setG(g - 1); setS(0); }
    };

    useEffect(() => { if (story && !own) socialService.markStoryViewed(story.id); }, [story?.id, own]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (paused || showViewers || !story) return;
        const t = setInterval(() => setProgress(p => {
            if (p >= 1) { next(); return 0; }
            return p + 100 / STORY_MS;
        }), 100);
        return () => clearInterval(t);
    }, [paused, showViewers, next, story]);
    useEffect(() => { if (!story) onClose(); }, [story, onClose]);
    if (!story) return null;

    const isLiked = liked[story.id] ?? story.isLiked;
    const toggleLike = async () => {
        if (!user) { showToast('Beğenmek için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        setLiked(l => ({ ...l, [story.id]: !isLiked }));
        try { await socialService.setStoryLike(story.id, !isLiked); } catch { setLiked(l => ({ ...l, [story.id]: isLiked })); }
    };
    const remove = async () => {
        try { await socialService.deleteStory(story.id); setDeleted(d => new Set(d).add(story.id)); showToast('Hikâye silindi.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        catch (e) { showToast(errorMessage(e, 'Silinemedi.'), 'AlertCircle', 'text-red-500 font-bold'); }
    };
    const openViewers = () => { setShowViewers(true); setViewers(null); socialService.storyViewers(story.id).then(setViewers); };

    return createPortal(
        <div className="theme-vet fixed inset-0 z-[3200] bg-black flex items-center justify-center">
            <div className="relative w-full h-full max-w-lg">
                <img loading="lazy" decoding="async" src={story.mediaUrl} alt="" className="w-full h-full object-contain" />
                <div className="absolute inset-0 flex" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
                    <button className="w-1/3 h-full" onClick={prev} aria-label="Önceki" />
                    <button className="w-2/3 h-full" onClick={next} aria-label="Sonraki" />
                </div>
                <div className="absolute top-[calc(10px+env(safe-area-inset-top,0px))] inset-x-3 flex gap-1">
                    {stories.map((x, i) => (
                        <span key={x.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                            <span className="block h-full bg-white" style={{ width: `${i < s ? 100 : i === s ? Math.min(100, progress * 100) : 0}%` }} />
                        </span>
                    ))}
                </div>
                <div className="absolute top-[calc(22px+env(safe-area-inset-top,0px))] inset-x-3 flex items-center gap-2 text-white">
                    <Link href={`/profile/${group.userId}`} onClick={onClose} className="flex items-center gap-2 min-w-0">
                        <Avatar src={group.avatar} name={group.name} className="w-8 h-8" />
                        <span className="text-sm font-black truncate">{own ? 'Hikâyen' : group.name}</span>
                        <span className="text-xs text-white/70 shrink-0">{timeAgo(story.createdAt)}</span>
                    </Link>
                    <button onClick={onClose} aria-label="Kapat" className="ml-auto w-9 h-9 flex items-center justify-center"><X className="w-6 h-6" /></button>
                </div>
                {story.caption && <p className="absolute bottom-24 inset-x-4 text-center text-white text-base font-bold drop-shadow">{story.caption}</p>}
                <div className="absolute bottom-[calc(20px+env(safe-area-inset-bottom,0px))] inset-x-4 flex items-center justify-between text-white">
                    {own ? (
                        <>
                            <button onClick={openViewers} className="h-10 px-4 rounded-full bg-white/15 text-sm font-bold">Görüntüleyenler · {story.viewCount}</button>
                            <button onClick={remove} aria-label="Hikâyeyi sil" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
                        </>
                    ) : (
                        <button onClick={toggleLike} aria-label={isLiked ? 'Beğeniyi kaldır' : 'Beğen'} className="ml-auto w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                            <Heart className={cn('w-6 h-6', isLiked && 'fill-accent text-accent')} />
                        </button>
                    )}
                </div>
            </div>
            <Sheet open={showViewers} onClose={() => setShowViewers(false)} title="Görüntüleyenler">
                {!viewers ? <LoadingBlocks count={2} /> : viewers.length === 0 ? <p className="text-sm font-semibold text-secondary">Henüz görüntüleyen yok.</p> : (
                    <div>{viewers.map(v => <PersonRow key={v.id} person={v} onNavigate={onClose} right={v.liked ? <Heart className="w-4 h-4 fill-accent text-accent" /> : null} />)}</div>
                )}
            </Sheet>
        </div>,
        document.body,
    );
}
