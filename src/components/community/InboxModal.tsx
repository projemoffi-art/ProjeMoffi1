'use client';

// Mesaj kutusu: sohbet listesi ve sohbet ekranı (Keşfet'in renkleri ve dokusu).
// Veri ChatContext'ten; gönderilen mesaj önce "gönderiliyor", kaydolunca gerçek kimlik ve saatle güncellenir.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCheck, ChevronLeft, MessageCircle, MoreHorizontal, Search, X } from 'lucide-react';
import { cn, showToast } from '@/lib/utils';
import { MESSAGE_REACTIONS, useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { uploadChatImage, useChatMediaUrl } from '@/lib/chatMedia';
import { socialService } from '@/services/socialService';
import { MessageText } from '@/components/chat/MessageText';
import { ChatComposer } from '@/components/chat/MessageThread';
import { Avatar } from '@/components/social/SocialUI';
import { ReportModal } from '@/components/common/modals/ReportModal';
import { haptics } from '@/lib/haptics';

const LONG_PRESS_MS = 420;

const clock = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '');

function dayLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const that = new Date(d); that.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
    if (diff === 0) return 'Bugün';
    if (diff === 1) return 'Dün';
    if (diff < 7) return d.toLocaleDateString('tr-TR', { weekday: 'long' });
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

function listTime(iso?: string) {
    if (!iso) return '';
    const label = dayLabel(iso);
    return label === 'Bugün' ? clock(iso) : label === 'Dün' ? 'Dün' : new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function InboxModal() {
    const {
        isInboxOpen, setIsInboxOpen,
        inboxMessages,
        activeChatUserId, setActiveChatUserId, activePartner,
        activeMessages, messagesLoading, hasOlderMessages, loadOlderMessages,
        onSendReply, retryMessage, isReplying,
        partnerTyping, notifyTyping,
        onlineUserIds,
        recallMessage, refreshInbox, toggleReaction, setChatPref,
        acceptRequest, requestCount,
    } = useChat();
    const { user } = useAuth();
    const listRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<any | null>(null);
    const [headerMenu, setHeaderMenu] = useState(false);
    const [confirmBlock, setConfirmBlock] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [box, setBox] = useState<'chats' | 'requests'>('chats');
    const [accepting, setAccepting] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stickToBottom = useRef(true);

    const visibleInbox = useMemo(() => {
        const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
        const inBox = inboxMessages.filter(m => !!m.isRequest === (box === 'requests'));
        return q ? inBox.filter(m => (m.partnerName || '').toLocaleLowerCase('tr-TR').includes(q)) : inBox;
    }, [inboxMessages, searchQuery, box]);
    // Son istek de kabul edilince ya da silinince sohbetler sekmesine dön.
    useEffect(() => { if (box === 'requests' && requestCount === 0) setBox('chats'); }, [box, requestCount]);
    const chatCount = inboxMessages.length - requestCount;

    const partnerName = activePartner?.partnerName || 'Sohbet';
    const activeEntry = inboxMessages.find((m: any) => m.userId === activeChatUserId);
    const muted = !!activeEntry?.muted;
    const isRequest = !!activeEntry?.isRequest;
    const byId = useMemo(() => new Map(activeMessages.map((m: any) => [m.id, m])), [activeMessages]);
    useEffect(() => { setReplyingTo(null); setConfirmClear(false); }, [activeChatUserId]);
    const online = !!activeChatUserId && onlineUserIds.has(activeChatUserId);

    // Yeni mesaj gelince, kullanıcı aşağıdaysa en alta kaydır (yukarıda eski mesaj okuyorsa yerinden oynatma).
    useEffect(() => {
        if (isInboxOpen && activeChatUserId && stickToBottom.current) endRef.current?.scrollIntoView({ block: 'end' });
    }, [isInboxOpen, activeChatUserId, activeMessages.length]);
    useEffect(() => { stickToBottom.current = true; }, [activeChatUserId]);

    useEffect(() => {
        if (!isInboxOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        refreshInbox();
        return () => { document.body.style.overflow = prev; };
    }, [isInboxOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = () => {
        setIsInboxOpen(false); setActiveChatUserId(null); setMenuFor(null); setHeaderMenu(false); setSearchQuery(''); setReplyingTo(null); setBox('chats');
    };

    const startLongPress = (m: any) => {
        cancelLongPress();
        longPressTimer.current = setTimeout(() => { setMenuFor(m); haptics.tap(); }, LONG_PRESS_MS);
    };
    const cancelLongPress = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

    const older = async () => {
        if (loadingOlder) return;
        setLoadingOlder(true);
        const el = listRef.current;
        const before = el ? el.scrollHeight - el.scrollTop : 0;
        stickToBottom.current = false;
        await loadOlderMessages();
        requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - before; });
        setLoadingOlder(false);
    };

    const copy = async (text: string) => {
        try { await navigator.clipboard.writeText(text); showToast('Mesaj kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        catch { showToast('Kopyalanamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
    };

    const pref = async (p: { muted?: boolean; clear?: boolean }, done: string) => {
        try { await setChatPref(p); showToast(done, 'CheckCircle2', 'text-emerald-500 font-bold'); }
        catch (e: any) { showToast(e?.message || 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        setHeaderMenu(false); setConfirmClear(false);
    };

    const accept = async () => {
        setAccepting(true);
        try { await acceptRequest(); haptics.success(); showToast('İstek kabul edildi.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        catch (e: any) { showToast(e?.message || 'Kabul edilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        setAccepting(false);
    };

    const deleteRequest = async () => {
        try {
            await setChatPref({ clear: true });
            showToast('İstek silindi.', 'CheckCircle2', 'text-emerald-500 font-bold');
            setActiveChatUserId(null);
        } catch (e: any) { showToast(e?.message || 'Silinemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
    };

    const block = async () => {
        if (!activeChatUserId) return;
        try {
            await socialService.block(activeChatUserId);
            showToast(`${partnerName} engellendi.`, 'CheckCircle2', 'text-emerald-500 font-bold');
            setConfirmBlock(false); setActiveChatUserId(null); refreshInbox();
        } catch (e: any) { showToast(e?.message || 'Engellenemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
    };

    // Gün ayırıcıları ve ardışık mesaj gruplaması
    const rows = useMemo(() => {
        const out: ({ kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; m: any; first: boolean; last: boolean })[] = [];
        let lastDay = '';
        activeMessages.forEach((m: any, i: number) => {
            const day = m.createdAt ? new Date(m.createdAt).toDateString() : lastDay;
            if (day && day !== lastDay) { out.push({ kind: 'day', key: `d-${day}`, label: dayLabel(m.createdAt) }); lastDay = day; }
            const prev = activeMessages[i - 1], next = activeMessages[i + 1];
            const same = (a: any) => a && a.sentByMe === m.sentByMe && a.createdAt && m.createdAt && new Date(a.createdAt).toDateString() === day
                && Math.abs(new Date(a.createdAt).getTime() - new Date(m.createdAt).getTime()) < 5 * 60000;
            out.push({ kind: 'msg', key: m.id, m, first: !same(prev), last: !same(next) });
        });
        return out;
    }, [activeMessages]);

    const lastMineRead = useMemo(() => [...activeMessages].reverse().find((m: any) => m.sentByMe && m.read)?.id, [activeMessages]);

    return (
        <AnimatePresence>
            {isInboxOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    className="theme-vet fixed inset-0 z-[6100] flex flex-col bg-background text-foreground pt-[env(safe-area-inset-top,0px)]"
                    role="dialog" aria-label="Mesajlar"
                >
                    {/* Başlık */}
                    <header className="px-4 py-3 flex items-center gap-3 border-b border-card-border bg-background/95 backdrop-blur-md">
                        {activeChatUserId ? (
                            <>
                                <button onClick={() => setActiveChatUserId(null)} aria-label="Sohbetlere dön"
                                    className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center shrink-0"><ChevronLeft className="w-5 h-5" /></button>
                                <Link href={`/profile/${activeChatUserId}`} onClick={handleClose} className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="relative shrink-0">
                                        <Avatar src={activePartner?.avatar} name={partnerName} className="w-10 h-10" />
                                        {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4E8F2A] border-2 border-background" />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-black truncate">{partnerName}</span>
                                        <span className={cn('block text-[11px] font-semibold', partnerTyping ? 'text-accent' : 'text-secondary')}>
                                            {partnerTyping ? 'yazıyor…' : online ? 'Çevrimiçi' : activePartner?.isBusiness ? 'İşletme' : 'Profili gör'}
                                        </span>
                                    </span>
                                </Link>
                                <button onClick={() => setHeaderMenu(true)} aria-label="Sohbet seçenekleri"
                                    className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center shrink-0"><MoreHorizontal className="w-5 h-5" /></button>
                            </>
                        ) : (
                            <h2 className="flex-1 text-xl font-black">Mesajlar</h2>
                        )}
                        <button onClick={handleClose} aria-label="Kapat"
                            className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center shrink-0"><X className="w-5 h-5" /></button>
                    </header>

                    {activeChatUserId ? (
                        <>
                            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-4"
                                onScroll={e => { const el = e.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }}>
                                <div className="max-w-2xl mx-auto flex flex-col">
                                    {hasOlderMessages && (
                                        <button onClick={older} disabled={loadingOlder} className="self-center mb-3 h-8 px-4 rounded-full bg-card border border-card-border text-xs font-black text-secondary disabled:opacity-50">
                                            {loadingOlder ? 'Yükleniyor…' : 'Önceki mesajlar'}
                                        </button>
                                    )}
                                    {messagesLoading && activeMessages.length === 0 && (
                                        <div className="space-y-3 pt-4">{[0, 1, 2].map(i => <div key={i} className={cn('h-10 rounded-2xl bg-card-border/50 animate-pulse', i % 2 ? 'w-1/2 ml-auto' : 'w-2/3')} />)}</div>
                                    )}
                                    {!messagesLoading && activeMessages.length === 0 && (
                                        <div className="flex flex-col items-center text-center py-16 gap-3">
                                            <Avatar src={activePartner?.avatar} name={partnerName} className="w-20 h-20 text-2xl" />
                                            <div className="text-base font-black">{partnerName}</div>
                                            <p className="text-sm font-semibold text-secondary max-w-xs">Henüz mesaj yok. Bir merhaba ile başla 👋</p>
                                        </div>
                                    )}
                                    {rows.map(r => r.kind === 'day' ? (
                                        <div key={r.key} className="self-center my-3 px-3 h-6 rounded-full bg-card border border-card-border text-[11px] font-bold text-secondary flex items-center">{r.label}</div>
                                    ) : (
                                        <Bubble key={r.key} m={r.m} first={r.first} last={r.last} showSeen={r.m.id === lastMineRead}
                                            myId={user?.id} quoted={r.m.replyTo ? (byId.get(r.m.replyTo) || 'missing') : null} partnerName={partnerName}
                                            onReact={emoji => toggleReaction(r.m.id, emoji)}
                                            onPress={() => r.m.attachmentUrl && setLightboxUrl(r.m.attachmentUrl)}
                                            onLongStart={() => !r.m.deleted && !String(r.m.id).startsWith('temp-') && startLongPress(r.m)}
                                            onLongEnd={cancelLongPress}
                                            onRetry={() => retryMessage(r.m.id)} />
                                    ))}
                                    <div ref={endRef} />
                                </div>
                            </div>
                            <div className="border-t border-card-border bg-background px-3 pt-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))]">
                                <div className="max-w-2xl mx-auto">
                                    {isRequest && (
                                        <div className="mb-2 rounded-2xl bg-card border border-card-border p-3 space-y-2.5">
                                            <p className="text-[13px] font-semibold text-secondary leading-snug">
                                                <span className="font-black text-foreground">{partnerName}</span> seni ilk kez yazıyor. Kabul edene ya da yanıt verene kadar mesajları okuduğunu görmez.
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={accept} disabled={accepting} className="h-10 rounded-xl bg-accent text-white text-sm font-black disabled:opacity-60">Kabul et</button>
                                                <button onClick={deleteRequest} className="h-10 rounded-xl bg-background border border-card-border text-sm font-black">Sil</button>
                                                <button onClick={() => { setConfirmBlock(true); setHeaderMenu(true); }} className="h-10 rounded-xl bg-background border border-card-border text-sm font-black text-red-600">Engelle</button>
                                            </div>
                                        </div>
                                    )}
                                    {replyingTo && (
                                        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-card border border-card-border pl-3 pr-1.5 py-1.5">
                                            <span className="w-1 self-stretch rounded-full bg-accent shrink-0" />
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[11px] font-black text-accent">{replyingTo.sentByMe ? 'Kendi mesajına yanıt' : 'Yanıtlanıyor'}</span>
                                                <span className="block text-xs font-semibold text-secondary truncate">{replyingTo.text || '📷 Fotoğraf'}</span>
                                            </span>
                                            <button onClick={() => setReplyingTo(null)} aria-label="Yanıtı iptal et" className="w-8 h-8 rounded-full flex items-center justify-center text-secondary shrink-0"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <ChatComposer onSend={async (t, a) => { stickToBottom.current = true; const rid = replyingTo?.id; setReplyingTo(null); await onSendReply(t, a, rid); }}
                                        uploadImage={uploadChatImage} sending={isReplying} onTyping={notifyTyping} placeholder="Mesaj yaz…" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="max-w-2xl mx-auto px-4 pt-3 pb-8 space-y-3">
                                {inboxMessages.length > 0 && (
                                    <label className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-card border border-card-border">
                                        <Search className="w-4 h-4 text-secondary shrink-0" />
                                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Sohbetlerde ara"
                                            className="flex-1 bg-transparent text-sm font-semibold outline-none" />
                                        {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Temizle"><X className="w-4 h-4 text-secondary" /></button>}
                                    </label>
                                )}
                                {(requestCount > 0 || box === 'requests') && (
                                    <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card border border-card-border" role="tablist" aria-label="Mesaj kutusu">
                                        {([['chats', 'Sohbetler', chatCount], ['requests', 'İstekler', requestCount]] as const).map(([key, label, count]) => (
                                            <button key={key} role="tab" aria-selected={box === key} onClick={() => { haptics.tap(); setBox(key); }}
                                                className={cn('relative h-9 rounded-xl text-sm font-black', box === key ? 'text-foreground' : 'text-secondary')}>
                                                {box === key && <motion.span layoutId="inbox-box" className="absolute inset-0 rounded-xl bg-background border border-card-border" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                                                <span className="relative">{label}{count > 0 && <span className="ml-1 tabular-nums text-accent">{count}</span>}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {box === 'requests' && (
                                    <p className="text-xs font-semibold text-secondary px-1">Takip etmediğin kişilerden gelen ilk mesajlar burada. Kabul edene ya da yanıt verene kadar okuduğunu görmezler.</p>
                                )}
                                {inboxMessages.length === 0 ? (
                                    <div className="flex flex-col items-center text-center py-16 gap-3">
                                        <span className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center"><MessageCircle className="w-8 h-8" /></span>
                                        <div className="text-base font-black">Henüz sohbetin yok</div>
                                        <p className="text-sm font-semibold text-secondary max-w-xs">Bir profilden "Mesaj"a dokunarak ya da bir gönderiyi paylaşarak sohbet başlatabilirsin.</p>
                                        <Link href="/community/kesfet" onClick={handleClose} className="mt-1 h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm inline-flex items-center">Keşfet'e göz at</Link>
                                    </div>
                                ) : visibleInbox.length === 0 ? (
                                    <p className="text-sm font-semibold text-secondary text-center py-10">
                                        {searchQuery ? `"${searchQuery}" ile eşleşen sohbet yok.` : box === 'requests' ? 'Bekleyen mesaj isteği yok.' : 'Sohbetlerin burada görünecek.'}
                                    </p>
                                ) : (
                                    <div className="bg-card border border-card-border rounded-3xl divide-y divide-card-border overflow-hidden">
                                        {visibleInbox.map((m: any) => (
                                            <motion.button key={m.userId} whileTap={{ scale: 0.985 }} onClick={() => { haptics.tap(); setActiveChatUserId(m.userId); }}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                                                <span className="relative shrink-0">
                                                    <Avatar src={m.avatar} name={m.partnerName} className="w-12 h-12" />
                                                    {onlineUserIds.has(m.userId) && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4E8F2A] border-2 border-card" />}
                                                </span>
                                                <span className="flex-1 min-w-0">
                                                    <span className="flex items-baseline justify-between gap-2">
                                                        <span className={cn('text-sm truncate', m.unread ? 'font-black' : 'font-bold')}>{m.partnerName}{m.muted && <span className="ml-1 text-xs opacity-60" aria-label="Sessizde">🔕</span>}</span>
                                                        <span className={cn('text-[11px] shrink-0 tabular-nums', m.unread ? 'font-black text-accent' : 'font-semibold text-secondary')}>{listTime(m.latestAt)}</span>
                                                    </span>
                                                    <span className="flex items-center justify-between gap-2 mt-0.5">
                                                        <span className={cn('text-[13px] truncate', m.unread ? 'font-bold text-foreground' : 'font-semibold text-secondary')}>
                                                            {m.sentByMe ? 'Sen: ' : ''}{m.latestMessage}
                                                        </span>
                                                        {m.unreadCount > 0 && (
                                                            <span className={cn('min-w-5 h-5 px-1.5 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums', m.muted ? 'bg-secondary/60' : 'bg-accent')}>{m.unreadCount > 99 ? '99+' : m.unreadCount}</span>
                                                        )}
                                                    </span>
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mesaj menüsü (uzun basınca) */}
                    <AnimatePresence>
                        {menuFor && (
                            <motion.div className="fixed inset-0 z-[6300] bg-black/40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuFor(null)}>
                                <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={e => e.stopPropagation()}
                                    className="w-full max-w-2xl bg-background rounded-t-3xl p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] space-y-2">
                                    <div className="flex justify-between bg-card border border-card-border rounded-2xl px-2 py-1.5">
                                        {MESSAGE_REACTIONS.map(e => {
                                            const mineR = menuFor.reactions?.find((r: any) => r.userId === user?.id)?.emoji === e;
                                            return (
                                                <motion.button key={e} whileTap={{ scale: 0.8 }} onClick={() => { toggleReaction(menuFor.id, e); haptics.tap(); setMenuFor(null); }}
                                                    aria-label={`${e} tepkisi`} aria-pressed={mineR}
                                                    className={cn('w-11 h-11 rounded-full text-2xl flex items-center justify-center', mineR && 'bg-accent/15')}>{e}</motion.button>
                                            );
                                        })}
                                    </div>
                                    {menuFor.text && <p className="text-sm font-semibold text-secondary line-clamp-2 px-1">{menuFor.text}</p>}
                                    <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border text-sm font-bold">
                                        <button onClick={() => { setReplyingTo(menuFor); setMenuFor(null); }} className="w-full px-4 py-3.5 text-left">Yanıtla</button>
                                        {menuFor.text && <button onClick={() => { copy(menuFor.text); setMenuFor(null); }} className="w-full px-4 py-3.5 text-left">Kopyala</button>}
                                        {menuFor.sentByMe && <button onClick={() => { recallMessage(menuFor.id); setMenuFor(null); }} className="w-full px-4 py-3.5 text-left text-red-600">Herkesten geri al</button>}
                                        {!menuFor.sentByMe && <button onClick={() => { setMenuFor(null); setReportOpen(true); }} className="w-full px-4 py-3.5 text-left text-red-600">Şikâyet et</button>}
                                    </div>
                                    <button onClick={() => setMenuFor(null)} className="w-full h-12 rounded-2xl bg-card border border-card-border text-sm font-black">Vazgeç</button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sohbet seçenekleri */}
                    <AnimatePresence>
                        {headerMenu && (
                            <motion.div className="fixed inset-0 z-[6300] bg-black/40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => { setHeaderMenu(false); setConfirmBlock(false); setConfirmClear(false); }}>
                                <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={e => e.stopPropagation()}
                                    className="w-full max-w-2xl bg-background rounded-t-3xl p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] space-y-2">
                                    {confirmClear ? (
                                        <>
                                            <div className="text-base font-black px-1">Sohbet temizlensin mi?</div>
                                            <p className="text-sm font-semibold text-secondary px-1">Mesajlar sadece senin görünümünden kaldırılır; karşı taraf için sohbet olduğu gibi kalır.</p>
                                            <button onClick={() => pref({ clear: true }, 'Sohbet temizlendi.')} className="w-full h-12 rounded-2xl bg-red-600 text-white text-sm font-black">Temizle</button>
                                            <button onClick={() => setConfirmClear(false)} className="w-full h-12 rounded-2xl bg-card border border-card-border text-sm font-black">Vazgeç</button>
                                        </>
                                    ) : confirmBlock ? (
                                        <>
                                            <div className="text-base font-black px-1">{partnerName} engellensin mi?</div>
                                            <p className="text-sm font-semibold text-secondary px-1">Birbirinizin gönderilerini ve hikâyelerini görmezsiniz, takip bağlantınız kaldırılır. Engeli ayarlardan kaldırabilirsin.</p>
                                            <button onClick={block} className="w-full h-12 rounded-2xl bg-red-600 text-white text-sm font-black">Engelle</button>
                                            <button onClick={() => setConfirmBlock(false)} className="w-full h-12 rounded-2xl bg-card border border-card-border text-sm font-black">Vazgeç</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border text-sm font-bold">
                                                <Link href={`/profile/${activeChatUserId}`} onClick={handleClose} className="block w-full px-4 py-3.5">Profili gör</Link>
                                                {(activeMessages.length > 0 || muted) && (
                                                    <button onClick={() => pref({ muted: !muted }, muted ? 'Sohbet sessizden çıkarıldı.' : 'Sohbet sessize alındı.')} className="w-full px-4 py-3.5 text-left">
                                                        {muted ? 'Sessizden çıkar' : 'Sessize al'}
                                                    </button>
                                                )}
                                                {activeMessages.length > 0 && <button onClick={() => setConfirmClear(true)} className="w-full px-4 py-3.5 text-left">Sohbeti temizle</button>}
                                                <button onClick={() => { setHeaderMenu(false); setReportOpen(true); }} className="w-full px-4 py-3.5 text-left text-red-600">Şikâyet et</button>
                                                <button onClick={() => setConfirmBlock(true)} className="w-full px-4 py-3.5 text-left text-red-600">Engelle</button>
                                            </div>
                                            <button onClick={() => setHeaderMenu(false)} className="w-full h-12 rounded-2xl bg-card border border-card-border text-sm font-black">Vazgeç</button>
                                        </>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} entityType="user" entityId={activeChatUserId || ''} />

                    <AnimatePresence>
                        {lightboxUrl && (
                            <motion.div key="inbox-photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxUrl(null)}
                                className="fixed inset-0 z-[6400] bg-black/95 flex items-center justify-center p-4">
                                <ChatImage refUrl={lightboxUrl} alt="Fotoğraf" className="max-w-full max-h-full object-contain rounded-2xl" onClick={e => e.stopPropagation()} />
                                <button onClick={() => setLightboxUrl(null)} aria-label="Kapat"
                                    className="absolute top-[calc(16px+env(safe-area-inset-top,0px))] right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ChatImage({ refUrl, className, alt, onClick }: { refUrl: string; className?: string; alt: string; onClick?: (e: React.MouseEvent) => void }) {
    const url = useChatMediaUrl(refUrl);
    if (!url) return <span className={cn('block bg-card-border/50 animate-pulse min-h-40 min-w-40', className)} />;
    return <img src={url} alt={alt} className={className} onClick={onClick} />;
}

function Bubble({ m, first, last, showSeen, myId, quoted, partnerName, onReact, onPress, onLongStart, onLongEnd, onRetry }: {
    m: any; first: boolean; last: boolean; showSeen: boolean; myId?: string; quoted: any | 'missing' | null; partnerName: string;
    onReact: (emoji: string) => void; onPress: () => void; onLongStart: () => void; onLongEnd: () => void; onRetry: () => void;
}) {
    const reactions: { userId: string; emoji: string }[] = m.reactions || [];
    const grouped = reactions.reduce<Record<string, number>>((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});
    const myReaction = reactions.find(r => r.userId === myId)?.emoji;
    const mine = m.sentByMe;
    if (m.deleted) {
        return (
            <div className={cn('flex', mine ? 'justify-end' : 'justify-start', first ? 'mt-2' : 'mt-0.5')}>
                <div className="max-w-[78%] rounded-2xl px-3.5 py-2 text-xs italic text-secondary border border-dashed border-card-border">Bu mesaj geri alındı</div>
            </div>
        );
    }
    const radius = mine
        ? cn('rounded-2xl', !first && 'rounded-tr-md', !last && 'rounded-br-md')
        : cn('rounded-2xl', !first && 'rounded-tl-md', !last && 'rounded-bl-md');
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn('flex flex-col', mine ? 'items-end' : 'items-start', first ? 'mt-2' : 'mt-0.5')}>
            <div onPointerDown={onLongStart} onPointerUp={onLongEnd} onPointerLeave={onLongEnd} onPointerCancel={onLongEnd}
                onContextMenu={e => { e.preventDefault(); onLongStart(); }}
                onDoubleClick={() => !m.pending && !m.failed && onReact('❤️')}
                className={cn('max-w-[78%] overflow-hidden select-text', radius,
                    mine ? 'bg-accent text-white' : 'bg-card border border-card-border text-foreground',
                    m.pending && 'opacity-70', m.failed && 'ring-2 ring-red-500/60')}>
                {quoted && (
                    <div className={cn('mx-1.5 mt-1.5 rounded-xl px-2.5 py-1.5 border-l-[3px]', mine ? 'bg-white/15 border-white/70' : 'bg-background border-accent')}>
                        {quoted === 'missing' ? (
                            <span className="block text-xs font-semibold opacity-75">Önceki bir mesaja yanıt</span>
                        ) : (
                            <>
                                <span className="block text-[11px] font-black opacity-90">{quoted.sentByMe ? 'Sen' : partnerName}</span>
                                <span className="block text-xs font-semibold opacity-80 truncate">{quoted.deleted ? 'Bu mesaj geri alındı' : quoted.text || '📷 Fotoğraf'}</span>
                            </>
                        )}
                    </div>
                )}
                {m.attachmentUrl && (
                    <button onClick={onPress} className="block">
                        <ChatImage refUrl={m.attachmentUrl} alt="Gönderilen fotoğraf" className="max-h-72 w-full object-cover" />
                    </button>
                )}
                {m.text && (
                    <div className="px-3.5 py-2 text-[15px] leading-snug [&_a]:underline">
                        <MessageText text={m.text} />
                    </div>
                )}
            </div>
            {Object.keys(grouped).length > 0 && (
                <motion.button initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    onClick={() => myReaction && onReact(myReaction)} aria-label="Tepkiler"
                    className={cn('-mt-2 z-10 flex items-center gap-0.5 h-6 px-1.5 rounded-full bg-background border border-card-border shadow-sm text-sm', mine ? 'mr-2' : 'ml-2')}>
                    {Object.entries(grouped).map(([e, n]) => <span key={e} className="flex items-center">{e}{n > 1 && <span className="text-[10px] font-black text-secondary ml-0.5">{n}</span>}</span>)}
                </motion.button>
            )}
            {(last || m.failed) && (
                <div className={cn('flex items-center gap-1 mt-1 px-1 text-[10.5px] font-semibold text-secondary tabular-nums', mine ? 'justify-end' : 'justify-start')}>
                    {m.failed ? (
                        <button onClick={onRetry} className="font-black text-red-600">Gönderilemedi · Tekrar dene</button>
                    ) : (
                        <>
                            <span>{clock(m.createdAt)}</span>
                            {mine && (m.pending ? <span aria-label="Gönderiliyor">·</span>
                                : m.read ? <CheckCheck className="w-3.5 h-3.5 text-accent" aria-label="Okundu" />
                                    : <Check className="w-3.5 h-3.5" aria-label="İletildi" />)}
                            {mine && showSeen && <span className="text-accent">Görüldü</span>}
                        </>
                    )}
                </div>
            )}
        </motion.div>
    );
}
