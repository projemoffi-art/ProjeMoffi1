'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

export interface ChatPartner { userId: string; partnerName: string; avatar: string | null; isBusiness?: boolean }

interface ChatContextType {
    isInboxOpen: boolean;
    setIsInboxOpen: (isOpen: boolean) => void;
    activeChatUserId: string | null;
    setActiveChatUserId: (id: string | null) => void;
    /** Açık sohbetin karşı tarafı (gelen kutusunda olmasa bile, ör. profilden ilk mesaj). */
    activePartner: ChatPartner | null;
    unreadCount: number;
    inboxMessages: any[];
    activeMessages: any[];
    messagesLoading: boolean;
    hasOlderMessages: boolean;
    loadOlderMessages: () => Promise<void>;
    onSendReply: (text: string, attachmentUrl?: string) => Promise<void>;
    retryMessage: (tempId: string) => Promise<void>;
    isReplying: boolean;
    partnerTyping: boolean;
    notifyTyping: () => void;
    onlineUserIds: Set<string>;
    openChat: (userId: string) => void;
    refreshInbox: () => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    recallMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const CHAT_MESSAGE_EVENT = 'moffi-chat-message';
export type ChatMessageEventDetail = { id: string; senderId: string; receiverId: string };

const PAGE = 50;

function fromRow(msg: any, myId: string | undefined) {
    return {
        id: msg.id,
        text: msg.is_deleted ? '' : msg.content,
        attachmentUrl: msg.is_deleted ? null : msg.attachment_url || null,
        sentByMe: msg.sender_id === myId,
        senderId: msg.sender_id,
        createdAt: msg.created_at,
        read: !!msg.is_read,
        deleted: !!msg.is_deleted,
        conversationId: msg.conversation_id,
    };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const [activePartner, setActivePartner] = useState<ChatPartner | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [activeMessages, setActiveMessages] = useState<any[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    const userRef = useRef(user);
    const activeChatUserIdRef = useRef(activeChatUserId);
    const isInboxOpenRef = useRef(isInboxOpen);
    const inboxRef = useRef<any[]>([]);
    const channelRef = useRef<any>(null);
    const presenceChannelRef = useRef<any>(null);
    const typingChannelRef = useRef<any>(null);
    const partnerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = useRef(0);
    const inboxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const failedRef = useRef<Record<string, { text: string; attachmentUrl?: string }>>({});

    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { activeChatUserIdRef.current = activeChatUserId; }, [activeChatUserId]);
    useEffect(() => { isInboxOpenRef.current = isInboxOpen; }, [isInboxOpen]);
    useEffect(() => { inboxRef.current = inboxMessages; }, [inboxMessages]);

    useEffect(() => {
        setActiveChatUserId(null);
        setActiveMessages([]);
        setInboxMessages([]);
        setUnreadCount(0);
    }, [user?.id]);

    const fetchInbox = useCallback(async () => {
        if (!userRef.current) return;
        try {
            const data = await apiService.getChatConversations();
            setInboxMessages(data || []);
            setUnreadCount((data || []).filter((m: any) => m.unread).length);
        } catch (err) {
            console.error('Inbox load error:', err);
        }
    }, []);

    /** Art arda gelen olaylarda gelen kutusu tek seferde yenilenir. */
    const scheduleInbox = useCallback(() => {
        if (inboxTimerRef.current) clearTimeout(inboxTimerRef.current);
        inboxTimerRef.current = setTimeout(fetchInbox, 400);
    }, [fetchInbox]);

    /** Açık sohbetteki gelen mesajları okundu yapar (sohbet gerçekten ekrandaysa). */
    const scheduleMarkRead = useCallback(() => {
        const partner = activeChatUserIdRef.current;
        if (!partner || !isInboxOpenRef.current || document.visibilityState !== 'visible') return;
        if (readTimerRef.current) clearTimeout(readTimerRef.current);
        readTimerRef.current = setTimeout(async () => {
            await apiService.markChatAsRead(partner).catch(() => {});
            scheduleInbox();
        }, 600);
    }, [scheduleInbox]);

    const fetchActiveMessages = useCallback(async (otherUserId: string) => {
        setMessagesLoading(true);
        try {
            const msgs = await apiService.getChatMessages(otherUserId, 'inbox', null, PAGE);
            if (activeChatUserIdRef.current !== otherUserId) return;
            setActiveMessages(msgs || []);
            setHasOlderMessages((msgs || []).length === PAGE);
            scheduleMarkRead();
        } catch (err) {
            console.error('Messages load error:', err);
        } finally {
            setMessagesLoading(false);
        }
    }, [scheduleMarkRead]);

    const loadOlderMessages = useCallback(async () => {
        const partner = activeChatUserIdRef.current;
        if (!partner || !hasOlderMessages) return;
        const oldest = activeMessages.find(m => m.createdAt)?.createdAt;
        if (!oldest) return;
        const older = await apiService.getChatMessages(partner, 'inbox', oldest, PAGE).catch(() => []);
        if (activeChatUserIdRef.current !== partner) return;
        setActiveMessages(prev => [...older.filter((o: any) => !prev.some(p => p.id === o.id)), ...prev]);
        setHasOlderMessages(older.length === PAGE);
    }, [activeMessages, hasOlderMessages]);

    const announceChatChange = (msg: any) => {
        const me = userRef.current?.id;
        if (!me || (msg.sender_id !== me && msg.receiver_id !== me)) return;
        window.dispatchEvent(new CustomEvent(CHAT_MESSAGE_EVENT, { detail: { id: msg.id, senderId: msg.sender_id, receiverId: msg.receiver_id } }));
    };

    useEffect(() => {
        if (!user) return;
        fetchInbox();

        const onInsert = (payload: any) => {
            const row = payload.new as any;
            announceChatChange(row);
            scheduleInbox();
            const partner = activeChatUserIdRef.current;
            const me = userRef.current?.id;
            const belongs = !!partner && ((row.sender_id === partner && row.receiver_id === me) || (row.sender_id === me && row.receiver_id === partner));
            if (!belongs) return;
            setActiveMessages(prev => (prev.some(m => m.id === row.id) ? prev : [...prev, fromRow(row, me)]));
            if (row.sender_id === partner) scheduleMarkRead();
        };
        const onUpdate = (payload: any) => {
            const row = payload.new as any;
            announceChatChange(row);
            setActiveMessages(prev => prev.map(m => (m.id === row.id ? { ...m, ...fromRow(row, userRef.current?.id) } : m)));
            if (row.is_deleted) scheduleInbox();
        };
        const onDelete = (payload: any) => {
            const id = payload.old?.id;
            if (!id) return;
            setActiveMessages(prev => prev.filter(m => m.id !== id));
            scheduleInbox();
        };

        // Sadece bu kullanıcının gönderdiği ya da aldığı mesajlar dinlenir (tek tablo, tek kolon filtresi —
        // Realtime'ın güvenilir değerlendirdiği tür).
        const channel = supabase
            .channel(`chat-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, onInsert)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, onInsert)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, onUpdate)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, onUpdate)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, onDelete)
            .subscribe();
        channelRef.current = channel;

        // Çevrimiçi durumu: Supabase Presence, tek paylaşımlı kanal.
        const presenceChannel = supabase.channel('online-users', { config: { presence: { key: user.id } } });
        const syncOnlineState = () => setOnlineUserIds(new Set(Object.keys(presenceChannel.presenceState())));
        presenceChannel
            .on('presence', { event: 'sync' }, syncOnlineState)
            .on('presence', { event: 'join' }, syncOnlineState)
            .on('presence', { event: 'leave' }, syncOnlineState)
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ online_at: new Date().toISOString() });
                    syncOnlineState();
                }
            });
        presenceChannelRef.current = presenceChannel;

        // Sekme öne gelince: çevrimiçi bilgisini tazele, açık sohbeti okundu yap, kaçırılan mesajları al.
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            presenceChannelRef.current?.track({ online_at: new Date().toISOString() });
            syncOnlineState();
            fetchInbox();
            if (activeChatUserIdRef.current) fetchActiveMessages(activeChatUserIdRef.current);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        const heartbeat = setInterval(() => {
            presenceChannelRef.current?.track({ online_at: new Date().toISOString() });
            syncOnlineState();
        }, 25000);

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(presenceChannel);
            channelRef.current = null;
            presenceChannelRef.current = null;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(heartbeat);
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Açık sohbet değişince: mesajlar ve karşı tarafın bilgisi.
    useEffect(() => {
        setActiveMessages([]);
        setHasOlderMessages(false);
        if (!activeChatUserId) { setActivePartner(null); return; }
        const known = inboxRef.current.find(m => m.userId === activeChatUserId);
        setActivePartner(known ? { userId: known.userId, partnerName: known.partnerName, avatar: known.avatar, isBusiness: known.isBusiness } : null);
        if (!known) apiService.getChatPartner(activeChatUserId).then(p => { if (p && activeChatUserIdRef.current === activeChatUserId) setActivePartner(p); }).catch(() => {});
        fetchActiveMessages(activeChatUserId);
    }, [activeChatUserId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Kutu kapalıyken açık sohbete gelen mesajlar, kutu açılınca okundu olur.
    useEffect(() => { if (isInboxOpen && activeChatUserId) scheduleMarkRead(); }, [isInboxOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // "Yazıyor..." göstergesi: veritabanına yazmayan broadcast kanalı.
    useEffect(() => {
        setPartnerTyping(false);
        if (!activeChatUserId || !user?.id) return;
        const pairKey = [user.id, activeChatUserId].sort().join('_');
        const channel = supabase
            .channel(`typing-${pairKey}`)
            .on('broadcast', { event: 'typing' }, (payload: any) => {
                if (payload?.payload?.userId !== activeChatUserId) return;
                setPartnerTyping(true);
                if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
                partnerTypingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
            })
            .subscribe();
        typingChannelRef.current = channel;
        return () => {
            supabase.removeChannel(channel);
            typingChannelRef.current = null;
            if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        };
    }, [activeChatUserId, user?.id]);

    const notifyTyping = useCallback(() => {
        if (!typingChannelRef.current || !user?.id) return;
        const now = Date.now();
        if (now - lastTypingSentRef.current < 2000) return;
        lastTypingSentRef.current = now;
        typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } });
    }, [user?.id]);

    const openChat = useCallback((userId: string) => {
        setActiveChatUserId(userId);
        setIsInboxOpen(true);
    }, []);

    const send = useCallback(async (tempId: string, partner: string, text: string, attachmentUrl?: string) => {
        try {
            const saved = await apiService.sendChatMessage(partner, text, 'inbox', undefined, attachmentUrl);
            delete failedRef.current[tempId];
            setActiveMessages(prev => {
                // Realtime kaydı önce getirdiyse geçici satır silinir, değilse gerçek kimlikle değiştirilir.
                if (saved && prev.some(m => m.id === saved.id)) return prev.filter(m => m.id !== tempId);
                return prev.map(m => (m.id === tempId ? { ...m, id: saved?.id || m.id, createdAt: saved?.createdAt || m.createdAt, pending: false, failed: false } : m));
            });
            scheduleInbox();
        } catch (err) {
            console.error('Send message error:', err);
            failedRef.current[tempId] = { text, attachmentUrl };
            setActiveMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
            throw err;
        }
    }, [scheduleInbox]);

    const onSendReply = useCallback(async (text: string, attachmentUrl?: string) => {
        const trimmed = text.trim();
        const partner = activeChatUserIdRef.current;
        if ((!trimmed && !attachmentUrl) || !partner) return;
        setIsReplying(true);
        const tempId = `temp-${Date.now()}`;
        setActiveMessages(prev => [...prev, {
            id: tempId, text: trimmed, attachmentUrl, sentByMe: true, senderId: userRef.current?.id,
            createdAt: new Date().toISOString(), read: false, pending: true,
        }]);
        try { await send(tempId, partner, trimmed, attachmentUrl); }
        finally { setIsReplying(false); }
    }, [send]);

    const retryMessage = useCallback(async (tempId: string) => {
        const f = failedRef.current[tempId];
        const partner = activeChatUserIdRef.current;
        if (!f || !partner) return;
        setActiveMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pending: true, failed: false } : m)));
        await send(tempId, partner, f.text, f.attachmentUrl).catch(() => {});
    }, [send]);

    const deleteMessage = useCallback(async (messageId: string) => {
        setActiveMessages(prev => prev.filter(m => m.id !== messageId));
        try { await apiService.deleteChatMessage(messageId); scheduleInbox(); }
        catch (err) { console.error('Delete message error:', err); if (activeChatUserIdRef.current) fetchActiveMessages(activeChatUserIdRef.current); }
    }, [fetchActiveMessages, scheduleInbox]);

    const recallMessage = useCallback(async (messageId: string) => {
        setActiveMessages(prev => prev.map(m => (m.id === messageId ? { ...m, deleted: true, text: '', attachmentUrl: null } : m)));
        try { await apiService.recallChatMessage(messageId); scheduleInbox(); }
        catch (err) { console.error('Recall message error:', err); if (activeChatUserIdRef.current) fetchActiveMessages(activeChatUserIdRef.current); }
    }, [fetchActiveMessages, scheduleInbox]);

    return (
        <ChatContext.Provider value={{
            isInboxOpen, setIsInboxOpen,
            activeChatUserId, setActiveChatUserId, activePartner,
            unreadCount, inboxMessages,
            activeMessages, messagesLoading, hasOlderMessages, loadOlderMessages,
            onSendReply, retryMessage, isReplying,
            partnerTyping, notifyTyping,
            onlineUserIds,
            openChat,
            refreshInbox: fetchInbox,
            deleteMessage,
            recallMessage,
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) throw new Error('useChat must be used within a ChatProvider');
    return context;
}
