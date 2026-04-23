'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Search, MessageCircle, ShieldAlert, ChevronRight, 
    MoreHorizontal, Send, Image as ImageIcon, Smile, 
    Paperclip, CheckCheck, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    tab: 'chats' | 'sos';
    setTab: (val: 'chats' | 'sos') => void;
    messages: any[];
    sosAlerts: any[];
    activeChatUserId: string | null;
    setActiveChatUserId: (id: string | null) => void;
    replyMessage: string;
    setReplyMessage: (val: string) => void;
    onSendReply: () => void;
    isReplying: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    editingMessageId: string | null;
    activeMessageMenuId: string | null;
    setActiveMessageMenuId: (id: string | null) => void;
    isAttachMenuOpen: boolean;
    setIsAttachMenuOpen: (val: boolean) => void;
    user: any;
}

export function InboxModal({
    isOpen,
    onClose,
    tab,
    setTab,
    messages,
    sosAlerts,
    activeChatUserId,
    setActiveChatUserId,
    replyMessage,
    setReplyMessage,
    onSendReply,
    isReplying,
    messagesEndRef,
    editingMessageId,
    activeMessageMenuId,
    setActiveMessageMenuId,
    isAttachMenuOpen,
    setIsAttachMenuOpen,
    user
}: InboxModalProps) {
    const activeChatPartner = messages.find(m => m.userId === activeChatUserId)?.partnerName || 'Sohbet';
    const currentChatMessages = messages.find(m => m.userId === activeChatUserId)?.messages || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed inset-0 z-[2500] flex flex-col pt-safe-top"
                    style={{ background: 'var(--background)' }}
                >
                    <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--card-border)] backdrop-blur-3xl sticky top-0 z-10" style={{ background: 'var(--card-bg)' }}>
                        {activeChatUserId ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveChatUserId(null)} className="p-2 rounded-full bg-[var(--card-bg)] active:scale-95 transition-all">
                                    <ChevronRight className="w-6 h-6 rotate-180 text-[var(--foreground)]" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-[var(--card-border)] overflow-hidden">
                                        <img src={messages.find(m => m.userId === activeChatUserId)?.avatar || ""} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-[var(--foreground)] font-bold text-sm">{activeChatPartner}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[10px] text-[var(--secondary-text)] font-bold uppercase tracking-widest">Çevrimiçi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-[var(--foreground)]">Gelen Kutusu</h2>
                                <p className="text-xs text-[var(--accent)] font-bold uppercase tracking-[0.2em] mt-1 ml-1">Mesajlar ve Uyarılar</p>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            {!activeChatUserId && <button className="p-2.5 rounded-full bg-[var(--card-bg)] text-[var(--secondary-text)] active:scale-95 transition-all"><Search className="w-5 h-5" /></button>}
                            <button onClick={onClose} className="p-2.5 rounded-full bg-[var(--card-bg)] text-[var(--secondary-text)] active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {!activeChatUserId && (
                        <div className="px-6 py-4 flex gap-2">
                            <button onClick={() => setTab('chats')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", tab === 'chats' ? "bg-white text-black shadow-white/10" : "bg-[var(--card-bg)] text-[var(--secondary-text)] border border-[var(--card-border)]")}>
                                <MessageCircle className="w-4 h-4" /> Sohbetler
                            </button>
                            <button onClick={() => setTab('sos')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", tab === 'sos' ? "bg-red-500 text-white shadow-red-500/20" : "bg-[var(--card-bg)] text-[var(--secondary-text)] border border-[var(--card-border)]")}>
                                <ShieldAlert className="w-4 h-4" /> SOS Alarmları
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {activeChatUserId ? (
                            <div className="flex flex-col min-h-full px-6 py-6 pb-24 space-y-4">
                                {currentChatMessages.map((m: any, idx: number) => (
                                    <div key={m.id || idx} className={cn("group flex flex-col max-w-[85%] relative", m.sentByMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={cn("px-4 py-3 rounded-[1.5rem] relative active:scale-[0.98] transition-all shadow-sm", m.sentByMe ? "bg-[var(--accent)] text-white rounded-tr-none" : "bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] rounded-tl-none")}>
                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                            <div className={cn("flex items-center gap-1 mt-1.5", m.sentByMe ? "justify-end" : "justify-start")}>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-60", m.sentByMe ? "text-white" : "text-[var(--secondary-text)]")}>{m.time}</span>
                                                {m.sentByMe && <CheckCheck className="w-3 h-3 text-white/60" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : tab === 'chats' ? (
                            <div className="flex flex-col">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-6">
                                            <MessageCircle className="w-10 h-10 text-[var(--secondary-text)]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Henüz Sohbet Yok</h3>
                                        <p className="text-sm text-[var(--secondary-text)]">Arkadaşlarınıza mesaj atarak ilk sohbeti siz başlatın.</p>
                                    </div>
                                ) : (
                                    messages.map((m: any) => (
                                        <div key={m.userId} onClick={() => setActiveChatUserId(m.userId)} className="px-6 py-5 flex items-center gap-4 hover:bg-[var(--card-bg)] active:bg-[var(--card-bg)] transition-colors cursor-pointer border-b border-[var(--card-border)] relative group">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full border border-[var(--card-border)] overflow-hidden bg-gray-900">
                                                    <img src={m.avatar} className="w-full h-full object-cover" />
                                                </div>
                                                {m.online && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-4 border-[var(--background)]" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-[var(--foreground)] text-base truncate pr-2">{m.partnerName}</h4>
                                                    <span className="text-[10px] text-[var(--secondary-text)] font-bold uppercase tracking-tight">{m.latestTime}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("text-sm truncate", m.unread ? "text-[var(--accent)] font-black" : "text-[var(--secondary-text)] font-medium")}>
                                                        {m.sentByMe ? 'Siz: ' : ''}{m.latestMessage}
                                                    </p>
                                                    {m.unread && <div className="ml-2 w-2.5 h-2.5 bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--glow)]" />}
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
                                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Güvendesiniz!</h3>
                                        <p className="text-sm text-[var(--secondary-text)]">Yakın çevrenizde aktif herhangi bir kayıp pet ihbarı bulunmuyor.</p>
                                    </div>
                                ) : (
                                    sosAlerts.map((sos: any) => (
                                        <div key={sos.id} className="px-6 py-5 flex items-start gap-4 hover:bg-red-500/5 transition-colors cursor-pointer border-b border-[var(--border-color)] relative group">
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                                                <ShieldAlert className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-red-400 text-base">{(sos.name || sos.petName)} KAYIP!</h4>
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{sos.time}</span>
                                                </div>
                                                <p className="text-sm text-gray-300 font-medium line-clamp-2 leading-relaxed">
                                                    <span className="font-black text-white">{(sos.location || sos.last_seen_location || 'Bilinmeyen Konum')}</span> konumunda ihtar geçildi. Lütfen çevreye duyarlı olun.
                                                </p>
                                                {sos.unread && <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider">Acil Durum</div>}
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-gray-800 self-center" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {activeChatUserId && (
                        <div className="absolute bottom-0 inset-x-0 bg-[var(--background)]/80 backdrop-blur-3xl px-6 py-4 border-t border-[var(--card-border)] flex items-center gap-3">
                            <button onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)} className="p-3 rounded-full bg-[var(--card-bg)] text-[var(--secondary-text)] hover:text-[var(--foreground)] transition-all">
                                <Plus className={cn("w-6 h-6 transition-transform", isAttachMenuOpen && "rotate-45")} />
                            </button>
                            <div className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-3 flex items-center gap-2 focus-within:border-[var(--accent)]/50 transition-all">
                                <input
                                    type="text"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Mesajınızı yazın..."
                                    className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary-text)]"
                                    onKeyPress={(e) => e.key === 'Enter' && onSendReply()}
                                />
                                <button className="text-[var(--secondary-text)] hover:text-[var(--accent)] transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                disabled={!replyMessage.trim() || isReplying}
                                onClick={onSendReply}
                                className={cn("p-4 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg",
                                    replyMessage.trim() ? "bg-[var(--foreground)] text-[var(--background)] shadow-lg" : "bg-[var(--card-bg)] text-[var(--secondary-text)]"
                                )}
                            >
                                {isReplying ? <div className="w-5 h-5 border-2 border-[var(--foreground)]/20 border-t-[var(--foreground)] rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
