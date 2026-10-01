'use client';

// Referans Ekran 7–8 — Yorumlar ve yanıtlar (tek seviye). Beğeni, yanıt, düzenleme, silme, şikâyet.
// Yeni yorumlar Realtime ile anında gelir.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { LoadingBlocks, Sheet } from '@/components/health/HealthUI';
import { ReportModal } from '@/components/common/modals/ReportModal';
import { Avatar, LikeHeart, RichText, RollingCount, useMaskHidden } from '@/components/social/SocialUI';
import { haptics } from '@/lib/haptics';
import { socialService, timeAgo, type SocialComment, type SocialPost } from '@/services/socialService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn, showToast } from '@/lib/utils';

const EMOJIS = ['❤️', '😂', '😍', '🥹', '😮', '👏', '🐾', '🔥'];

export function useComments(postId: string) {
    const [comments, setComments] = useState<SocialComment[] | null>(null);
    const load = useCallback(() => socialService.comments(postId).then(setComments).catch(() => setComments([])), [postId]);
    useEffect(() => {
        load();
        const ch = supabase.channel(`post-comments-${postId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => load())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [postId, load]);
    return { comments, reload: load };
}

export function CommentThread({ post, comments, reload, limit, onOpenAll }: {
    post: SocialPost; comments: SocialComment[] | null; reload: () => void; limit?: number; onOpenAll?: () => void;
}) {
    const { user } = useAuth();
    const mask = useMaskHidden();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [menuFor, setMenuFor] = useState<SocialComment | null>(null);
    const [reportId, setReportId] = useState<string | null>(null);
    const [editing, setEditing] = useState<SocialComment | null>(null);
    const [replyTo, setReplyTo] = useState<SocialComment | null>(null);
    const known = useRef<Set<string> | null>(null);
    const [fresh, setFresh] = useState<Set<string>>(new Set());
    const [likeOverride, setLikeOverride] = useState<Record<string, { isLiked: boolean; likes: number }>>({});

    useEffect(() => {
        if (!comments) return;
        setLikeOverride({}); // sunucudan gelen güncel değer iyimser değerin yerini alır
        const ids = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)]);
        if (known.current) {
            const added = ids.filter(i => !known.current!.has(i));
            if (added.length) {
                setFresh(new Set(added));
                const tm = setTimeout(() => setFresh(new Set()), 1600);
                known.current = new Set(ids);
                return () => clearTimeout(tm);
            }
        }
        known.current = new Set(ids);
    }, [comments]);

    if (!comments) return <LoadingBlocks count={2} />;
    const shown = limit ? comments.slice(0, limit) : comments;
    const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

    const toggleLike = async (c: SocialComment) => {
        if (!user) { showToast('Beğenmek için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        const next = { isLiked: !c.isLiked, likes: Math.max(0, c.likes + (c.isLiked ? -1 : 1)) };
        setLikeOverride(o => ({ ...o, [c.id]: next }));
        try { await socialService.setCommentLike(c.id, next.isLiked); reload(); }
        catch (e: any) {
            setLikeOverride(o => { const n = { ...o }; delete n[c.id]; return n; });
            showToast(e?.message || 'Beğenilemedi.', 'AlertCircle', 'text-red-500 font-bold');
        }
    };
    const view = (c: SocialComment): SocialComment => (likeOverride[c.id] ? { ...c, ...likeOverride[c.id] } : c);

    const renderItem = (c: SocialComment, reply?: boolean) => (
        <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn('flex gap-3 rounded-2xl -mx-2 px-2 py-1 transition-colors duration-700', reply && 'pl-[52px]', fresh.has(c.id) && 'bg-accent/10')}>
            <Link href={`/profile/${c.userId}`}><Avatar src={c.author.avatar} name={c.author.name} className={reply ? 'w-7 h-7 text-xs' : 'w-9 h-9'} /></Link>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${c.userId}`} className="text-[13px] font-black truncate">{c.author.username || c.author.name}</Link>
                    <span className="text-[11px] font-semibold text-secondary shrink-0">{timeAgo(c.createdAt)}{c.editedAt ? ' · düzenlendi' : ''}</span>
                </div>
                <p className="text-sm font-semibold whitespace-pre-wrap break-words"><RichText text={mask(c.content)} /></p>
                {c.status === 'pending' && <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Gönderi sahibinin onayını bekliyor</p>}
                <div className="flex items-center gap-4 mt-1 text-[11px] font-bold text-secondary">
                    {post.commentPrivacy !== 'nobody' && <button onClick={() => { setReplyTo(reply ? comments.find(t => t.id === c.parentId) || c : c); setEditing(null); }}>Yanıtla</button>}
                    <button onClick={() => setMenuFor(c)}>•••</button>
                </div>
            </div>
            <span className="flex flex-col items-center gap-0.5 pt-1 w-7 shrink-0">
                <LikeHeart liked={c.isLiked} onToggle={() => toggleLike(c)} className={cn('w-4 h-4', !c.isLiked && 'text-secondary')} burstSize={16} />
                {c.likes > 0 && <RollingCount value={c.likes} className="text-[10px] font-bold text-secondary" />}
            </span>
        </motion.div>
    );

    return (
        <>
            {total === 0 ? (
                <p className="text-sm font-semibold text-secondary py-4 text-center">{post.commentPrivacy === 'nobody' ? 'Bu gönderi yorumlara kapalı.' : 'Henüz yorum yok. İlk yorumu sen yaz!'}</p>
            ) : (
                <div className="space-y-4">
                    {shown.map(c => {
                        const open = expanded[c.id] || c.replies.length <= 1;
                        const replies = open ? c.replies : c.replies.slice(0, 1);
                        return (
                            <div key={c.id} className="space-y-3">
                                {renderItem(view(c))}
                                {replies.map(r => renderItem(view(r), true))}
                                {!open && (
                                    <button onClick={() => setExpanded(e => ({ ...e, [c.id]: true }))} className="pl-11 text-xs font-black text-secondary">
                                        — {c.replies.length - 1} yanıt daha gör
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {limit && comments.length > limit && onOpenAll && (
                        <button onClick={onOpenAll} className="text-sm font-black text-accent">Tüm yorumları gör ({total})</button>
                    )}
                </div>
            )}

            <CommentActions comment={menuFor} post={post} onClose={() => setMenuFor(null)} reload={reload}
                onEdit={c => { setEditing(c); setReplyTo(null); }} onReport={id => setReportId(id)} />
            <ReportModal isOpen={!!reportId} onClose={() => setReportId(null)} entityType="comment" entityId={reportId || ''} />
            <CommentComposerPortal post={post} reload={reload} replyTo={replyTo} setReplyTo={setReplyTo} editing={editing} setEditing={setEditing} />
        </>
    );
}

function CommentActions({ comment, post, onClose, reload, onEdit, onReport }: {
    comment: SocialComment | null; post: SocialPost; onClose: () => void; reload: () => void;
    onEdit: (c: SocialComment) => void; onReport: (id: string) => void;
}) {
    const { user } = useAuth();
    const [confirm, setConfirm] = useState(false);
    useEffect(() => { setConfirm(false); }, [comment]);
    if (!comment) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
    const mine = user?.id === comment.userId;
    const canDelete = mine || post.isMine;
    const del = async () => {
        try { await socialService.deleteComment(comment.id); reload(); onClose(); showToast('Yorum silindi.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        catch (e: any) { showToast(e?.message || 'Silinemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
    };
    return (
        <Sheet open={!!comment} onClose={onClose} title={confirm ? 'Yorum silinsin mi?' : 'Yorum'}>
            {confirm ? (
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-secondary">{comment.replies.length ? 'Yorum ve yanıtları silinir.' : 'Yorum kalıcı olarak silinir.'}</p>
                    <button onClick={del} className="w-full h-12 rounded-2xl bg-red-600 text-white font-black text-sm">Sil</button>
                </div>
            ) : (
                <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border text-sm font-bold">
                    {mine && <button onClick={() => { onEdit(comment); onClose(); }} className="w-full px-4 py-3.5 text-left">Düzenle</button>}
                    {canDelete && <button onClick={() => setConfirm(true)} className="w-full px-4 py-3.5 text-left text-red-600">Sil</button>}
                    {!mine && <button onClick={() => { if (!user) { showToast('Şikâyet için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); return; } onReport(comment.id); onClose(); }} className="w-full px-4 py-3.5 text-left text-red-600">Yorumu şikâyet et</button>}
                </div>
            )}
        </Sheet>
    );
}

/** Sayfanın altına sabit yorum kutusu. */
function CommentComposerPortal(props: {
    post: SocialPost; reload: () => void; replyTo: SocialComment | null; setReplyTo: (c: SocialComment | null) => void;
    editing: SocialComment | null; setEditing: (c: SocialComment | null) => void;
}) {
    const { post, reload, replyTo, setReplyTo, editing, setEditing } = props;
    const { user } = useAuth();
    const router = useRouter();
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) { setText(editing.content); inputRef.current?.focus(); }
        else if (replyTo) { setText(`@${replyTo.author.username || replyTo.author.name} `); inputRef.current?.focus(); }
    }, [editing, replyTo]);

    if (post.commentPrivacy === 'nobody' && !post.isMine) return null;

    const send = async () => {
        if (!user) { showToast('Yorum yazmak için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); router.push('/'); return; }
        const t = text.trim();
        if (!t || sending) return;
        setSending(true);
        try {
            if (editing) await socialService.editComment(editing.id, t);
            else {
                const status = await socialService.addComment(post.id, t, replyTo?.id);
                if (status === 'pending') showToast('Yorumun gönderi sahibinin onayına gönderildi.', 'Bell', 'text-amber-600 font-bold');
            }
            setText(''); setReplyTo(null); setEditing(null); reload(); haptics.success();
        } catch (e: any) {
            showToast(e?.message || 'Gönderilemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[2950] bg-background border-t border-card-border pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
            <div className="max-w-2xl mx-auto px-4 pt-2 space-y-2">
                {(replyTo || editing) && (
                    <div className="flex items-center justify-between text-xs font-bold text-secondary">
                        <span>{editing ? 'Yorumu düzenliyorsun' : `${replyTo!.author.username || replyTo!.author.name} kişisine yanıt veriyorsun`}</span>
                        <button onClick={() => { setReplyTo(null); setEditing(null); setText(''); }} aria-label="Vazgeç"><X className="w-4 h-4" /></button>
                    </div>
                )}
                <div className="flex justify-between">
                    {EMOJIS.map(e => <motion.button key={e} whileTap={{ scale: 1.45 }} onClick={() => { haptics.tap(); setText(t => t + e); }} className="text-xl w-9 h-9">{e}</motion.button>)}
                </div>
                <div className="flex items-center gap-2">
                    <Avatar src={user?.avatar} name={user?.name || 'Sen'} className="w-9 h-9" />
                    <input ref={inputRef} value={text} maxLength={500} onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') send(); }}
                        placeholder={user ? 'Yorum ekle…' : 'Yorum yazmak için giriş yap'}
                        className="flex-1 h-11 px-4 rounded-full bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={send} disabled={!text.trim() || sending}
                        animate={{ scale: text.trim() ? 1 : 0.96 }} className="h-11 px-4 rounded-full bg-accent text-white text-sm font-black disabled:opacity-40">
                        {sending ? '…' : editing ? 'Kaydet' : 'Paylaş'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
