'use client';

// Keşfet ekranlarının ortak parçaları (design-reference/community-final/kesfet-reference.jpg).
// Gönderi kartı, Baran'ın notu gereği mevcut büyük kart ölçüsünde (tam genişlik, 4:5 medya).

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, ClipboardList, Heart, MessageCircle, MoreHorizontal, Send, Share2, ShieldAlert, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Sheet, LoadingBlocks } from '@/components/health/HealthUI';
import { ReportModal } from '@/components/common/modals/ReportModal';
import { socialService, timeAgo, type GridPost, type PersonCard, type SocialPost } from '@/services/socialService';
import { useAuth } from '@/context/AuthContext';
import { cn, showToast } from '@/lib/utils';
import { speciesLabel } from '@/lib/petIdentity';

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
    return src
        ? <img src={src} alt="" className={cn('rounded-full object-cover bg-card-border/40 shrink-0', className)} />
        : <span className={cn('rounded-full bg-accent/15 text-accent font-black flex items-center justify-center shrink-0', className)}>{(name || 'M').trim().charAt(0).toLocaleUpperCase('tr-TR')}</span>;
}

export const postUrl = (id: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/community/gonderi/${id}`;

export async function sharePost(post: Pick<SocialPost, 'id' | 'author'>) {
    const url = postUrl(post.id);
    try {
        if (navigator.share) await navigator.share({ title: `${post.author.name} · Moffi`, url });
        else { await navigator.clipboard.writeText(url); showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
    } catch { /* vazgeçildi */ }
}

function useNeedLogin() {
    const { user } = useAuth();
    const router = useRouter();
    return () => {
        if (user) return false;
        showToast('Bunun için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold');
        router.push('/');
        return true;
    };
}

/** Kaydırılabilir fotoğraflar (sağ üstte 1/5). Çift dokunuş beğenir. */
function MediaCarousel({ post, onDoubleTap }: { post: SocialPost; onDoubleTap: () => void }) {
    const [index, setIndex] = useState(0);
    const [heart, setHeart] = useState(false);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const lastTap = useRef(0);

    useEffect(() => {
        if (!post.isVideo || !boxRef.current) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) videoRef.current?.play().catch(() => {}); else videoRef.current?.pause(); }, { threshold: 0.6 });
        io.observe(boxRef.current);
        return () => io.disconnect();
    }, [post.isVideo]);

    const tap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            onDoubleTap();
            setHeart(true);
            setTimeout(() => setHeart(false), 700);
        } else if (post.isVideo) {
            setMuted(m => !m);
        }
        lastTap.current = now;
    };

    return (
        <div ref={boxRef} className="relative mx-3 rounded-2xl overflow-hidden bg-card-border/40 aspect-[4/5]" onClick={tap}>
            {post.isVideo ? (
                <>
                    <video ref={videoRef} src={post.media[0]} muted={muted} loop playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center">
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </span>
                </>
            ) : (
                <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                    onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
                    {post.media.map((m, i) => (
                        <img key={i} src={m} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover shrink-0 snap-center" />
                    ))}
                </div>
            )}
            {post.media.length > 1 && (
                <>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-bold">{index + 1}/{post.media.length}</span>
                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
                        {post.media.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60')} />)}
                    </div>
                </>
            )}
            <AnimatePresence>
                {heart && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.1 }} exit={{ opacity: 0, scale: 1.4 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Ayarlar → Gizlenen kelimeler: bu kelimeler gönderi ve yorumlarda *** olarak görünür. */
export function useMaskHidden() {
    const { user } = useAuth();
    const words: string[] = (user as any)?.settings?.content?.hiddenWords || [];
    const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (text: string) => words.reduce((t, w) => (w?.trim()
        ? t.replace(new RegExp(escape(w.trim()), 'gi'), m => '*'.repeat(m.length)) : t), text);
}

export function Caption({ text: raw, clamp = true }: { text: string; clamp?: boolean }) {
    const [open, setOpen] = useState(!clamp);
    const mask = useMaskHidden();
    const text = mask(raw || '');
    if (!text) return null;
    const [first, ...rest] = text.split('\n');
    const body = rest.join('\n').trim();
    const long = text.length > 140 || text.split('\n').length > 3;
    return (
        <div className="text-sm leading-relaxed">
            <p className={cn('whitespace-pre-wrap', !open && long && 'line-clamp-3')}>
                {body ? <><span className="font-black">{first}</span>{'\n'}{body}</> : <span className="font-semibold">{text}</span>}
            </p>
            {!open && long && <button onClick={() => setOpen(true)} className="text-xs font-bold text-secondary mt-0.5">devamını gör</button>}
        </div>
    );
}

export function PostCard({ post, onChange, onRemoved, onBlocked, detail = false }: {
    post: SocialPost;
    onChange?: (p: SocialPost) => void;
    onRemoved?: (id: string) => void;
    onBlocked?: (userId: string) => void;
    detail?: boolean;
}) {
    const router = useRouter();
    const needLogin = useNeedLogin();
    const [p, setP] = useState(post);
    const [menu, setMenu] = useState(false);
    const [likers, setLikers] = useState(false);
    useEffect(() => { setP(post); }, [post]);

    const update = (next: SocialPost) => { setP(next); onChange?.(next); };

    const like = async (force?: boolean) => {
        if (needLogin()) return;
        const on = force ?? !p.isLiked;
        if (on === p.isLiked) return;
        const prev = p;
        update({ ...p, isLiked: on, likes: Math.max(0, p.likes + (on ? 1 : -1)) });
        try { await socialService.setLike(p.id, on); } catch (e: any) { update(prev); showToast(e?.message || 'Beğenilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
    };
    const save = async () => {
        if (needLogin()) return;
        const prev = p;
        update({ ...p, isSaved: !p.isSaved });
        try {
            await socialService.setSave(p.id, !prev.isSaved);
            showToast(prev.isSaved ? 'Kaydedilenlerden çıkarıldı.' : 'Kaydedildi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e: any) { update(prev); showToast(e?.message || 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
    };
    const commentsHref = `/community/gonderi/${p.id}/yorumlar`;

    return (
        <article className="py-3">
            <header className="flex items-center gap-3 px-4 pb-2.5">
                <Link href={`/profile/${p.userId}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={p.author.avatar} name={p.author.name} className="w-10 h-10" />
                    <span className="min-w-0">
                        <span className="block text-sm font-black truncate">{p.author.name}</span>
                        <span className="block text-[11px] font-semibold text-secondary truncate">
                            {[p.locationText, timeAgo(p.createdAt)].filter(Boolean).join(' · ')}{p.editedAt ? ' · düzenlendi' : ''}
                        </span>
                    </span>
                </Link>
                <button onClick={() => setMenu(true)} aria-label="Gönderi işlemleri" className="w-9 h-9 rounded-full flex items-center justify-center text-secondary">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </header>

            <MediaCarousel post={p} onDoubleTap={() => like(true)} />

            <div className="px-4 pt-3 space-y-2">
                {!detail && <Caption text={p.content} />}
                {p.pets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {p.pets.map(pet => (
                            <span key={pet.id} className="inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full bg-card border border-card-border text-xs font-bold">
                                <Avatar src={pet.avatar} name={pet.name} className="w-5 h-5 text-[10px]" />{pet.name}
                                <span className="font-semibold text-secondary">{pet.breed || speciesLabel(pet.type)}</span>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-4 pt-0.5">
                    <button onClick={() => like()} aria-label={p.isLiked ? 'Beğeniyi kaldır' : 'Beğen'} aria-pressed={p.isLiked} className="inline-flex items-center gap-1.5 text-sm font-bold">
                        <Heart className={cn('w-6 h-6', p.isLiked ? 'fill-accent text-accent' : '')} />
                    </button>
                    {p.likes > 0 && <button onClick={() => setLikers(true)} className="-ml-3 text-sm font-bold">{p.likes.toLocaleString('tr-TR')}</button>}
                    <button onClick={() => p.commentPrivacy === 'nobody' ? showToast('Bu gönderi yorumlara kapalı.', 'AlertCircle', 'text-secondary font-bold') : router.push(commentsHref)}
                        aria-label="Yorumlar" className={cn('inline-flex items-center gap-1.5 text-sm font-bold', p.commentPrivacy === 'nobody' && 'opacity-40')}>
                        <MessageCircle className="w-6 h-6" />{p.comments > 0 ? p.comments.toLocaleString('tr-TR') : ''}
                    </button>
                    <button onClick={() => sharePost(p)} aria-label="Paylaş"><Send className="w-6 h-6" /></button>
                    <button onClick={save} aria-label={p.isSaved ? 'Kaydedilenlerden çıkar' : 'Kaydet'} aria-pressed={p.isSaved} className="ml-auto">
                        <Bookmark className={cn('w-6 h-6', p.isSaved ? 'fill-foreground' : '')} />
                    </button>
                </div>
                {detail && <Caption text={p.content} clamp={false} />}
                {!detail && p.comments > 0 && p.commentPrivacy !== 'nobody' && (
                    <Link href={commentsHref} className="block text-xs font-bold text-secondary">{p.comments} yorumun tümünü gör</Link>
                )}
            </div>

            <PostActionsSheet open={menu} onClose={() => setMenu(false)} post={p} onChange={update}
                onRemoved={id => { onRemoved?.(id); if (detail) router.replace('/community'); }}
                onBlocked={uid => { onBlocked?.(uid); if (detail) router.replace('/community'); }} />
            <LikersSheet open={likers} onClose={() => setLikers(false)} postId={p.id} />
        </article>
    );
}

/** Referans Ekran 9 — Gönderi işlemleri. */
export function PostActionsSheet({ open, onClose, post, onChange, onRemoved, onBlocked }: {
    open: boolean; onClose: () => void; post: SocialPost;
    onChange: (p: SocialPost) => void; onRemoved: (id: string) => void; onBlocked: (userId: string) => void;
}) {
    const router = useRouter();
    const needLogin = useNeedLogin();
    const [report, setReport] = useState(false);
    const [confirm, setConfirm] = useState<null | 'delete' | 'block'>(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (open) setConfirm(null); }, [open]);

    const copy = async () => {
        await navigator.clipboard.writeText(postUrl(post.id)).catch(() => {});
        showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold');
        onClose();
    };
    const save = async () => {
        if (needLogin()) return;
        try {
            await socialService.setSave(post.id, !post.isSaved);
            onChange({ ...post, isSaved: !post.isSaved });
            showToast(post.isSaved ? 'Kaydedilenlerden çıkarıldı.' : 'Kaydedildi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e: any) { showToast(e?.message || 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        onClose();
    };
    const run = async () => {
        setBusy(true);
        try {
            if (confirm === 'delete') { await socialService.remove(post.id); showToast('Gönderi silindi.', 'CheckCircle2', 'text-emerald-500 font-bold'); onRemoved(post.id); }
            else if (confirm === 'block') { await socialService.block(post.userId); showToast(`${post.author.name} engellendi.`, 'CheckCircle2', 'text-emerald-500 font-bold'); onBlocked(post.userId); }
            onClose();
        } catch (e: any) { showToast(e?.message || 'İşlem yapılamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    const Row = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
        <button onClick={onClick} className={cn('w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-bold', danger && 'text-red-600')}>
            <span className={cn('w-5 flex justify-center', danger ? 'text-red-600' : 'text-secondary')}>{icon}</span>{label}
        </button>
    );

    return (
        <>
            <Sheet open={open} onClose={onClose} title={confirm === 'delete' ? 'Gönderi silinsin mi?' : confirm === 'block' ? `${post.author.name} engellensin mi?` : 'Gönderi'}>
                {confirm ? (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-secondary">
                            {confirm === 'delete' ? 'Gönderi, yorumları ve beğenileri kalıcı olarak silinir.'
                                : 'Birbirinizin gönderilerini, yorumlarını ve hikâyelerini görmezsiniz; takip bağlantınız kaldırılır. Engeli istediğin zaman ayarlardan kaldırabilirsin.'}
                        </p>
                        <button onClick={run} disabled={busy} className="w-full h-12 rounded-2xl bg-red-600 text-white font-black text-sm disabled:opacity-50">
                            {busy ? 'Bekle…' : confirm === 'delete' ? 'Sil' : 'Engelle'}
                        </button>
                        <button onClick={() => setConfirm(null)} className="w-full h-11 rounded-2xl bg-card border border-card-border font-black text-sm">Vazgeç</button>
                    </div>
                ) : (
                    <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                        <Row icon={<ClipboardList className="w-4.5 h-4.5" />} label="Bağlantıyı kopyala" onClick={copy} />
                        <Row icon={<Share2 className="w-4.5 h-4.5" />} label="Paylaş" onClick={() => { onClose(); sharePost(post); }} />
                        <Row icon={<Bookmark className="w-4.5 h-4.5" />} label={post.isSaved ? 'Kaydedilenlerden çıkar' : 'Kaydet'} onClick={save} />
                        {post.isMine ? (
                            <>
                                <Row icon={<span className="text-base">✎</span>} label="Düzenle" onClick={() => { onClose(); router.push(`/community/yeni?edit=${post.id}`); }} />
                                <Row icon={<Trash2 className="w-4.5 h-4.5" />} label="Gönderiyi sil" danger onClick={() => setConfirm('delete')} />
                            </>
                        ) : (
                            <>
                                <Row icon={<ShieldAlert className="w-4.5 h-4.5" />} label="Gönderiyi şikâyet et" danger onClick={() => { if (needLogin()) return; onClose(); setReport(true); }} />
                                <Row icon={<span className="text-base">⊘</span>} label="Bu hesabı engelle" danger onClick={() => { if (needLogin()) return; setConfirm('block'); }} />
                            </>
                        )}
                    </div>
                )}
            </Sheet>
            <ReportModal isOpen={report} onClose={() => setReport(false)} entityType="post" entityId={post.id} />
        </>
    );
}

export function LikersSheet({ open, onClose, postId }: { open: boolean; onClose: () => void; postId: string }) {
    const [list, setList] = useState<(PersonCard & { isFollowing: boolean })[] | null>(null);
    useEffect(() => { if (open) { setList(null); socialService.likers(postId).then(setList).catch(() => setList([])); } }, [open, postId]);
    return (
        <Sheet open={open} onClose={onClose} title="Beğenenler">
            {!list ? <LoadingBlocks count={3} /> : list.length === 0 ? <p className="text-sm font-semibold text-secondary">Henüz beğenen yok.</p> : (
                <div className="space-y-1">{list.map(u => <PersonRow key={u.id} person={u} initialFollowing={u.isFollowing} onNavigate={onClose} />)}</div>
            )}
        </Sheet>
    );
}

export function FollowButton({ userId, initial, className, onChange }: { userId: string; initial: boolean; className?: string; onChange?: (on: boolean) => void }) {
    const { user } = useAuth();
    const needLogin = useNeedLogin();
    const [on, setOn] = useState(initial);
    const [busy, setBusy] = useState(false);
    useEffect(() => { setOn(initial); }, [initial]);
    if (user?.id === userId) return null;
    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (needLogin() || busy) return;
        setBusy(true);
        try { await socialService.setFollow(userId, !on); setOn(!on); onChange?.(!on); }
        catch (err: any) { showToast(err?.message || 'Takip işlemi yapılamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };
    return (
        <button onClick={toggle} disabled={busy} className={cn('h-8 px-4 rounded-full text-xs font-black shrink-0 disabled:opacity-60',
            on ? 'bg-card border border-card-border' : 'bg-accent text-white', className)}>
            {on ? 'Takiptesin' : 'Takip et'}
        </button>
    );
}

export function PersonRow({ person, initialFollowing, onNavigate, right }: { person: PersonCard; initialFollowing?: boolean; onNavigate?: () => void; right?: React.ReactNode }) {
    return (
        <Link href={`/profile/${person.id}`} onClick={onNavigate} className="flex items-center gap-3 py-2">
            <Avatar src={person.avatar} name={person.name} className="w-11 h-11" />
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-black truncate">{person.name}</span>
                {person.username && <span className="block text-xs font-semibold text-secondary truncate">@{person.username}</span>}
            </span>
            {right ?? (initialFollowing !== undefined && <FollowButton userId={person.id} initial={initialFollowing} />)}
        </Link>
    );
}

export function GridTile({ post }: { post: GridPost }) {
    return (
        <Link href={`/community/gonderi/${post.id}`} className="relative aspect-square bg-card-border/40 overflow-hidden">
            {post.media && (post.isVideo
                ? <video src={post.media} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                : <img src={post.media} alt="" loading="lazy" className="w-full h-full object-cover" />)}
            {(post.mediaCount > 1 || post.isVideo) && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/55 text-white text-[10px] font-black">{post.isVideo ? '▶' : `1/${post.mediaCount}`}</span>
            )}
        </Link>
    );
}

export function PostGrid({ posts }: { posts: GridPost[] }) {
    return <div className="grid grid-cols-3 gap-0.5 rounded-2xl overflow-hidden">{posts.map(p => <GridTile key={p.id} post={p} />)}</div>;
}
