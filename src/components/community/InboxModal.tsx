'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Search, MessageCircle, ShieldAlert, ChevronRight,
    CheckCheck, Check, Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';
import { ChatComposer } from '@/components/chat/MessageThread';

const LONG_PRESS_MS = 450;

export function InboxModal() {
    const {
        isInboxOpen, setIsInboxOpen,
        inboxTab, setInboxTab,
        inboxMessages, sosAlerts,
        activeChatUserId, setActiveChatUserId,
        activeMessages,
        onSendReply, isReplying,
        partnerTyping, notifyTyping,
        onlineUserIds,
        recallMessage
    } = useChat();

    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [menuForId, setMenuForId] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const visibleInboxMessages = searchQuery.trim()
        ? inboxMessages.filter(m => (m.partnerName || '').toLocaleLowerCase('tr').includes(searchQuery.trim().toLocaleLowerCase('tr')))
        : inboxMessages;

    const activePartnerInfo = inboxMessages.find(m => m.userId === activeChatUserId);
    const activeChatPartner = activePartnerInfo?.partnerName || 'Sohbet';
    const currentChatMessages = activeMessages; // ← Now from Supabase via ChatContext

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isInboxOpen && activeChatUserId) {
            scrollToBottom();
        }
    }, [isInboxOpen, activeChatUserId, currentChatMessages]);

    // Kutu açıkken arkadaki sayfanın kaymasını (scroll) durdur.
    useEffect(() => {
        if (isInboxOpen) {
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = previousOverflow;
            };
        }
    }, [isInboxOpen]);

    // Kutuyu tamamen kapatınca (çarpı ile) açık sohbeti unut, bir dahaki açılışta liste gelsin.
    const handleClose = () => {
        setIsInboxOpen(false);
        setActiveChatUserId(null);
        setMenuForId(null);
        setSearchOpen(false);
        setSearchQuery('');
    };

    const startLongPress = (id: string) => {
        cancelLongPress();
        longPressTimer.current = setTimeout(() => {
            setMenuForId(id);
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
        }, LONG_PRESS_MS);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <AnimatePresence>
            {isInboxOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed inset-0 z-[6100] flex flex-col pt-safe-top bg-background text-foreground"
                >
                    {/* HEADER */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-card-border backdrop-blur-3xl sticky top-0 z-10 bg-card/90">
                        {activeChatUserId ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveChatUserId(null)} className="p-2 rounded-full bg-black/5 dark:bg-white/5 active:scale-95 transition-all">
                                    <ChevronRight className="w-6 h-6 rotate-180 text-foreground" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-card-border overflow-hidden bg-gray-900">
                                        <img src={inboxMessages.find(m => m.userId === activeChatUserId)?.avatar || ""} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold text-sm">{activeChatPartner}</h3>
                                        <div className="flex items-center gap-1.5">
                                            {partnerTyping ? (
                                                <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">yazıyor...</span>
                                            ) : (
                                                <>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", activeChatUserId && onlineUserIds.has(activeChatUserId) ? "bg-green-500" : "bg-zinc-500")} />
                                                    <span className="text-[10px] text-black/50 dark:text-white/40 font-bold uppercase tracking-widest">{activeChatUserId && onlineUserIds.has(activeChatUserId) ? "Çevrimiçi" : "Çevrimdışı"}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-foreground">Gelen Kutusu</h2>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            {!activeChatUserId && (
                                <button
                                    onClick={() => setSearchOpen((v) => { const next = !v; if (!next) setSearchQuery(''); return next; })}
                                    className={cn("p-2.5 rounded-full active:scale-95 transition-all", searchOpen ? "bg-cyan-500/15 text-cyan-500" : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/40")}
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={handleClose} className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/40 active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {!activeChatUserId && searchOpen && (
                        <div className="px-6 pt-4">
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Kişi ara..."
                                className="w-full bg-black/5 dark:bg-white/5 border border-card-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-secondary focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>
                    )}

                    {!activeChatUserId && (
                        <div className="px-6 py-4 flex gap-2">
                            <button onClick={() => setInboxTab('chats')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", inboxTab === 'chats' ? "bg-cyan-500 text-black shadow-cyan-500/20" : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/40 border border-card-border")}>
                                <MessageCircle className="w-4 h-4" /> Sohbetler
                            </button>
                            <button onClick={() => setInboxTab('sos')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", inboxTab === 'sos' ? "bg-red-500 text-white shadow-red-500/20" : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/40 border border-card-border")}>
                                <ShieldAlert className="w-4 h-4" /> SOS Alarmları
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
                        {activeChatUserId ? (
                            <div className="flex flex-col min-h-full px-6 py-6 pb-24 space-y-4">
                                {currentChatMessages.map((m: any, idx: number) => {
                                    const isMenuOpen = menuForId === (m.id || idx);
                                    const canManage = m.sentByMe && !m.deleted;

                                    if (m.deleted) {
                                        return (
                                            <div key={m.id || idx} className={cn("flex w-full", m.sentByMe ? "justify-end" : "justify-start")}>
                                                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-xs italic opacity-50 border border-dashed border-card-border">
                                                    Bu mesaj geri alındı
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={m.id || idx}
                                            className={cn("flex flex-col max-w-[85%] relative", m.sentByMe ? "ml-auto items-end" : "mr-auto items-start")}
                                            onPointerDown={() => canManage && startLongPress(m.id || idx)}
                                            onPointerUp={cancelLongPress}
                                            onPointerLeave={cancelLongPress}
                                            onPointerCancel={cancelLongPress}
                                            onContextMenu={(e) => { if (canManage) e.preventDefault(); }}
                                        >
                                            {isMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[6310]" onClick={() => setMenuForId(null)} />
                                                    <div className={cn("absolute -top-11 z-[6320] bg-card border border-card-border rounded-xl shadow-xl overflow-hidden whitespace-nowrap", m.sentByMe ? "right-0" : "left-0")}>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setMenuForId(null); recallMessage(m.id); }}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full"
                                                        >
                                                            <Undo2 className="w-3.5 h-3.5" />
                                                            Mesajı geri al
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {m.attachmentUrl ? (
                                                <div className={cn("flex flex-col gap-1.5", m.sentByMe ? "items-end" : "items-start")}>
                                                    <img
                                                        src={m.attachmentUrl}
                                                        alt="Gönderilen fotoğraf"
                                                        onClick={() => setLightboxUrl(m.attachmentUrl)}
                                                        className="rounded-2xl max-w-[220px] max-h-64 object-cover cursor-zoom-in shadow-sm active:scale-[0.98] transition-transform"
                                                    />
                                                    {m.text && (
                                                        <div className={cn("px-4 py-3 rounded-[1.5rem] shadow-sm", m.sentByMe ? "bg-amber-100 dark:bg-white/10 text-zinc-900 dark:text-foreground font-medium border border-amber-200/60 dark:border-card-border rounded-tr-none" : "bg-cyan-500 text-black rounded-tl-none")}>
                                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                                        </div>
                                                    )}
                                                    <div className={cn("flex items-center gap-1", m.sentByMe ? "justify-end" : "justify-start")}>
                                                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-60 text-black/50 dark:text-white/40">{m.time}</span>
                                                        {m.sentByMe && (m.read ? <CheckCheck className="w-3 h-3 text-cyan-500" /> : <Check className="w-3 h-3 text-black/40 dark:text-white/30" />)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={cn("px-4 py-3 rounded-[1.5rem] shadow-sm", m.sentByMe ? "bg-amber-100 dark:bg-white/10 text-zinc-900 dark:text-foreground font-medium border border-amber-200/60 dark:border-card-border rounded-tr-none" : "bg-cyan-500 text-black rounded-tl-none")}>
                                                    <p className="text-sm leading-relaxed">{m.text}</p>
                                                    <div className={cn("flex items-center gap-1 mt-1.5", m.sentByMe ? "justify-end" : "justify-start")}>
                                                        <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-60", m.sentByMe ? "text-black/50 dark:text-white/40" : "text-black")}>{m.time}</span>
                                                        {m.sentByMe && (m.read ? <CheckCheck className="w-3 h-3 text-cyan-600" /> : <Check className="w-3 h-3 text-black/40 dark:text-white/30" />)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : inboxTab === 'chats' ? (
                            <div className="flex flex-col">
                                {inboxMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                                            <MessageCircle className="w-10 h-10 text-black/30 dark:text-white/20" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">Henüz Sohbet Yok</h3>
                                        <p className="text-sm text-black/50 dark:text-white/40">Arkadaşlarınıza mesaj atarak ilk sohbeti siz başlatın.</p>
                                    </div>
                                ) : visibleInboxMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-10 text-center">
                                        <p className="text-sm text-black/50 dark:text-white/40">"{searchQuery}" ile eşleşen kimse bulunamadı.</p>
                                    </div>
                                ) : (
                                    visibleInboxMessages.map((m: any) => (
                                        <div key={m.userId} onClick={() => setActiveChatUserId(m.userId)} className="px-6 py-5 flex items-center gap-4 hover:bg-black/5 dark:bg-white/5 active:bg-black/5 dark:bg-white/5 transition-colors cursor-pointer border-b border-card-border relative group">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full border border-card-border overflow-hidden bg-gray-900">
                                                    <img src={m.avatar} className="w-full h-full object-cover" />
                                                </div>
                                                {onlineUserIds.has(m.userId) && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-4 border-black" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-foreground text-base truncate pr-2">{m.partnerName}</h4>
                                                    <span className="text-[10px] text-black/50 dark:text-white/40 font-bold uppercase tracking-tight">{m.latestTime}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("text-sm truncate", m.unread ? "text-cyan-400 font-black" : "text-black/50 dark:text-white/40 font-medium")}>
                                                        {m.sentByMe ? 'Siz: ' : ''}{m.latestMessage}
                                                    </p>
                                                    {m.unread && <div className="ml-2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {sosAlerts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                            <ShieldAlert className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">Güvendesiniz!</h3>
                                        <p className="text-sm text-black/50 dark:text-white/40">Yakın çevrenizde aktif herhangi bir kayıp pet ihbarı bulunmuyor.</p>
                                    </div>
                                ) : (
                                    sosAlerts.map((sos: any) => (
                                        <div key={sos.id} className="px-6 py-5 flex items-start gap-4 hover:bg-red-500/5 transition-colors cursor-pointer border-b border-card-border relative group">
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                                                <ShieldAlert className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-red-400 text-base">{(sos.pet_name || sos.name)} KAYIP!</h4>
                                                    <span className="text-[10px] text-black/30 dark:text-white/20 font-bold uppercase tracking-tighter">{sos.time}</span>
                                                </div>
                                                <p className="text-sm text-black/60 dark:text-white/60 font-medium line-clamp-2 leading-relaxed">
                                                    <span className="font-black text-foreground">{(sos.last_location || sos.location)}</span> konumunda ihtar geçildi. Lütfen çevreye duyarlı olun.
                                                </p>
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-black/30 dark:text-white/20 self-center" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {activeChatUserId && (
                        <div className="absolute bottom-0 inset-x-0 bg-card/90 backdrop-blur-3xl px-4 py-3 border-t border-card-border">
                            <ChatComposer
                                onSend={onSendReply}
                                uploadImage={(file) => apiService.uploadMedia(file)}
                                sending={isReplying}
                                onTyping={notifyTyping}
                            />
                        </div>
                    )}

                    <AnimatePresence>
                        {lightboxUrl && (
                            <motion.div
                                key="inbox-photo-lightbox"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setLightboxUrl(null)}
                                className="fixed inset-0 z-[6300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                            >
                                <img
                                    src={lightboxUrl}
                                    alt="Fotoğraf"
                                    className="max-w-full max-h-full object-contain rounded-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={() => setLightboxUrl(null)}
                                    className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
