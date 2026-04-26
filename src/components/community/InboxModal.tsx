'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Search, MessageCircle, ShieldAlert, ChevronRight, 
    Send, CheckCheck, Plus, Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';

export function InboxModal() {
    const { 
        isInboxOpen, setIsInboxOpen, 
        inboxTab, setInboxTab,
        inboxMessages, sosAlerts,
        activeChatUserId, setActiveChatUserId,
        replyMessage, setReplyMessage,
        onSendReply, isReplying
    } = useChat();
    
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChatPartner = inboxMessages.find(m => m.userId === activeChatUserId)?.partnerName || 'Sohbet';
    const currentChatMessages = inboxMessages.find(m => m.userId === activeChatUserId)?.messages || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isInboxOpen && activeChatUserId) {
            scrollToBottom();
        }
    }, [isInboxOpen, activeChatUserId, currentChatMessages]);

    return (
        <AnimatePresence>
            {isInboxOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed inset-0 z-[5000] flex flex-col pt-safe-top bg-black text-white"
                >
                    {/* HEADER */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl sticky top-0 z-10 bg-black/80">
                        {activeChatUserId ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveChatUserId(null)} className="p-2 rounded-full bg-white/5 active:scale-95 transition-all">
                                    <ChevronRight className="w-6 h-6 rotate-180 text-white" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-gray-900">
                                        <img src={inboxMessages.find(m => m.userId === activeChatUserId)?.avatar || ""} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{activeChatPartner}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Çevrimiçi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-white">Gelen Kutusu</h2>
                                <p className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em] mt-1 ml-1">Mesajlar ve Uyarılar</p>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            {!activeChatUserId && <button className="p-2.5 rounded-full bg-white/5 text-white/40 active:scale-95 transition-all"><Search className="w-5 h-5" /></button>}
                            <button onClick={() => setIsInboxOpen(false)} className="p-2.5 rounded-full bg-white/5 text-white/40 active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {!activeChatUserId && (
                        <div className="px-6 py-4 flex gap-2">
                            <button onClick={() => setInboxTab('chats')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", inboxTab === 'chats' ? "bg-white text-black shadow-white/10" : "bg-white/5 text-white/40 border border-white/10")}>
                                <MessageCircle className="w-4 h-4" /> Sohbetler
                            </button>
                            <button onClick={() => setInboxTab('sos')} className={cn("flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95", inboxTab === 'sos' ? "bg-red-500 text-white shadow-red-500/20" : "bg-white/5 text-white/40 border border-white/10")}>
                                <ShieldAlert className="w-4 h-4" /> SOS Alarmları
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {activeChatUserId ? (
                            <div className="flex flex-col min-h-full px-6 py-6 pb-24 space-y-4">
                                {currentChatMessages.map((m: any, idx: number) => (
                                    <div key={m.id || idx} className={cn("group flex flex-col max-w-[85%] relative", m.sentByMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={cn("px-4 py-3 rounded-[1.5rem] relative active:scale-[0.98] transition-all shadow-sm", m.sentByMe ? "bg-cyan-500 text-black font-medium rounded-tr-none" : "bg-white/10 text-white border border-white/10 rounded-tl-none")}>
                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                            <div className={cn("flex items-center gap-1 mt-1.5", m.sentByMe ? "justify-end" : "justify-start")}>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-60", m.sentByMe ? "text-black" : "text-white/40")}>{m.time}</span>
                                                {m.sentByMe && <CheckCheck className="w-3 h-3 text-black/60" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : inboxTab === 'chats' ? (
                            <div className="flex flex-col">
                                {inboxMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                            <MessageCircle className="w-10 h-10 text-white/20" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Henüz Sohbet Yok</h3>
                                        <p className="text-sm text-white/40">Arkadaşlarınıza mesaj atarak ilk sohbeti siz başlatın.</p>
                                    </div>
                                ) : (
                                    inboxMessages.map((m: any) => (
                                        <div key={m.userId} onClick={() => setActiveChatUserId(m.userId)} className="px-6 py-5 flex items-center gap-4 hover:bg-white/5 active:bg-white/5 transition-colors cursor-pointer border-b border-white/5 relative group">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-gray-900">
                                                    <img src={m.avatar} className="w-full h-full object-cover" />
                                                </div>
                                                {m.online && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-4 border-black" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-white text-base truncate pr-2">{m.partnerName}</h4>
                                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">{m.latestTime}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("text-sm truncate", m.unread ? "text-cyan-400 font-black" : "text-white/40 font-medium")}>
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
                                        <h3 className="text-xl font-bold text-white mb-2">Güvendesiniz!</h3>
                                        <p className="text-sm text-white/40">Yakın çevrenizde aktif herhangi bir kayıp pet ihbarı bulunmuyor.</p>
                                    </div>
                                ) : (
                                    sosAlerts.map((sos: any) => (
                                        <div key={sos.id} className="px-6 py-5 flex items-start gap-4 hover:bg-red-500/5 transition-colors cursor-pointer border-b border-white/5 relative group">
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                                                <ShieldAlert className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-red-400 text-base">{(sos.pet_name || sos.name)} KAYIP!</h4>
                                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">{sos.time}</span>
                                                </div>
                                                <p className="text-sm text-white/60 font-medium line-clamp-2 leading-relaxed">
                                                    <span className="font-black text-white">{(sos.last_location || sos.location)}</span> konumunda ihtar geçildi. Lütfen çevreye duyarlı olun.
                                                </p>
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-white/20 self-center" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {activeChatUserId && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-3xl px-6 py-4 border-t border-white/10 flex items-center gap-3">
                            <button className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white transition-all">
                                <Plus className="w-6 h-6" />
                            </button>
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2 focus-within:border-cyan-400/50 transition-all">
                                <input
                                    type="text"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Mesajınızı yazın..."
                                    className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder:text-white/20"
                                    onKeyPress={(e) => e.key === 'Enter' && onSendReply()}
                                />
                                <button className="text-white/20 hover:text-cyan-400 transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                disabled={!replyMessage.trim() || isReplying}
                                onClick={onSendReply}
                                className={cn("p-4 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg",
                                    replyMessage.trim() ? "bg-white text-black shadow-lg" : "bg-white/5 text-white/20"
                                )}
                            >
                                {isReplying ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
