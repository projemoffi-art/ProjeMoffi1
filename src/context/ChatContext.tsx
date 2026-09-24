'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface ChatContextType {
    isInboxOpen: boolean;
    setIsInboxOpen: (isOpen: boolean) => void;
    inboxTab: 'chats' | 'sos';
    setInboxTab: (tab: 'chats' | 'sos') => void;
    activeChatUserId: string | null;
    setActiveChatUserId: (id: string | null) => void;
    unreadCount: number;
    inboxMessages: any[];
    sosAlerts: any[];
    activeMessages: any[];
    onSendReply: (text: string, attachmentUrl?: string) => Promise<void>;
    isReplying: boolean;
    partnerTyping: boolean;
    notifyTyping: () => void;
    onlineUserIds: Set<string>;
    openChat: (userId: string) => void;
    openSosAlerts: () => void;
    refreshInbox: () => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    recallMessage: (messageId: string) => Promise<void>;
    setSosAlerts: React.Dispatch<React.SetStateAction<any[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [inboxTab, setInboxTab] = useState<'chats' | 'sos'>('chats');
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [activeMessages, setActiveMessages] = useState<any[]>([]);
    const [isReplying, setIsReplying] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // Use refs to avoid stale closures and prevent infinite loops
    const userRef = useRef(user);
    const activeChatUserIdRef = useRef(activeChatUserId);
    const channelRef = useRef<any>(null);
    const presenceChannelRef = useRef<any>(null);
    const typingChannelRef = useRef<any>(null);
    const partnerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = useRef(0);
    const initializedRef = useRef(false);

    // Keep refs in sync (NO re-renders triggered)
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { activeChatUserIdRef.current = activeChatUserId; }, [activeChatUserId]);

    // Reset active chat and messages when user changes (login/logout)
    useEffect(() => {
        setActiveChatUserId(null);
        setActiveMessages([]);
        setInboxMessages([]);
        setUnreadCount(0);
    }, [user?.id]);

    // STABLE fetch functions that use refs - never change identity
    const fetchInbox = useCallback(async () => {
        if (!userRef.current) return;
        try {
            const data = await apiService.getChatConversations();
            setInboxMessages(data || []);
            const unread = (data || []).filter((m: any) => m.unread).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Inbox load error:', err);
        }
    }, []); // EMPTY deps - stable forever

    const fetchSosAlerts = useCallback(async () => {
        try {
            const data = await apiService.getLostPets();
            setSosAlerts(data || []);
        } catch (err) {
            console.error('SOS load error:', err);
        }
    }, []); // EMPTY deps - stable forever

    const fetchActiveMessages = useCallback(async (otherUserId: string) => {
        try {
            const msgs = await apiService.getChatMessages(otherUserId);
            setActiveMessages(msgs || []);
            await apiService.markChatAsRead(otherUserId);
            fetchInbox();
        } catch (err) {
            console.error('Messages load error:', err);
        }
    }, [fetchInbox]);

    // ONE-TIME initialization when user first becomes available
    useEffect(() => {
        if (!user || initializedRef.current) return;
        initializedRef.current = true;

        fetchInbox();
        fetchSosAlerts();

        // Setup realtime subscription ONCE
        const channel = supabase
            .channel(`chat-${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    const newMsg = payload.new as any;
                    // Bu olay Supabase tarafında satır bazlı filtrelenemediği için TÜM kullanıcıların
                    // TÜM mesajları için tetiklenir. Gelen kutusunu (okunmamış sayaç/önizleme) her
                    // ihtimale karşı yeniliyoruz, ama şu an AÇIK olan sohbete sadece gerçekten o
                    // sohbetin karşı tarafından gelen mesajı ekliyoruz — başka bir kullanıcının mesajı
                    // yanlışlıkla açık sohbete karışmasın diye.
                    const isFromActivePartner = !!activeChatUserIdRef.current && newMsg.sender_id === activeChatUserIdRef.current;

                    fetchInbox();
                    if (isFromActivePartner) {
                        setActiveMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev; // zaten eklenmiş
                            return [...prev, {
                                id: newMsg.id,
                                text: newMsg.content,
                                attachmentUrl: newMsg.attachment_url || undefined,
                                sentByMe: false,
                                time: 'Şimdi',
                                read: false
                            }];
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                async (payload) => {
                    // "Okundu" tiki (is_read) ve "geri alındı" (is_deleted) durumları INSERT değil,
                    // UPDATE ile değişiyor — bu yüzden ayrı bir dinleyici gerekiyor. Bu olmadan,
                    // karşı taraf mesajı okusa/geri alsa bile sayfa yenilenmeden görünmüyordu.
                    const updated = payload.new as any;
                    const isMine = updated.sender_id === userRef.current?.id;
                    const isFromActivePartner = !!activeChatUserIdRef.current && updated.sender_id === activeChatUserIdRef.current;
                    if (!isMine && !isFromActivePartner) return;

                    setActiveMessages(prev => prev.map(m => m.id === updated.id ? {
                        ...m,
                        read: !!updated.is_read,
                        deleted: !!updated.is_deleted,
                        text: updated.is_deleted ? '' : (updated.content ?? m.text),
                        attachmentUrl: updated.is_deleted ? null : (updated.attachment_url ?? m.attachmentUrl),
                    } : m));
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages' },
                async (payload) => {
                    const deletedId = payload.old?.id;
                    if (deletedId) {
                        setActiveMessages(prev => prev.filter(m => m.id !== deletedId));
                        fetchInbox();
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'conversations' },
                async (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;

                    setInboxMessages(currentInbox => {
                        const matched = currentInbox.find(m => m.conversationId === deletedId);
                        if (matched && activeChatUserIdRef.current === matched.userId) {
                            setActiveChatUserId(null);
                        }
                        return currentInbox.filter(m => m.conversationId !== deletedId);
                    });

                    fetchInbox();
                }
            )
            .subscribe();

        channelRef.current = channel;

        // Gerçek "çevrimiçi" durumu: Supabase Presence ile, uygulamayı açık tutan tüm kullanıcıların
        // kimliğini tek bir paylaşımlı kanalda topluyoruz. Böylece "çevrimiçi/çevrimdışı" artık
        // sabit bir değer değil, gerçek bağlantı durumunu yansıtıyor.
        const presenceChannel = supabase.channel('online-users', {
            config: { presence: { key: user.id } }
        });
        const syncOnlineState = () => {
            const state = presenceChannel.presenceState();
            setOnlineUserIds(new Set(Object.keys(state)));
        };
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

        // Tarayıcılar arka plandaki sekmelerin bağlantısını kısabiliyor (ör. sekme değiştirince
        // veya bilgisayar uykuya geçip geri gelince); bu yüzden sekme tekrar öne geldiğinde
        // durumu elle tazeliyoruz — aksi halde "çevrimiçi" bilgisi bayatlayıp ancak sayfa
        // yenilenince düzelebiliyordu.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && presenceChannelRef.current) {
                presenceChannelRef.current.track({ online_at: new Date().toISOString() });
                syncOnlineState();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Düzenli "kalp atışı": bağlantı sessizce koparsa bile en geç 25 saniyede bir kendini
        // toparlar, böylece çevrimiçi bilgisi asla kalıcı şekilde bayatlamaz.
        const heartbeatInterval = setInterval(() => {
            if (presenceChannelRef.current) {
                presenceChannelRef.current.track({ online_at: new Date().toISOString() });
                syncOnlineState();
            }
        }, 25000);

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
                presenceChannelRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(heartbeatInterval);
            initializedRef.current = false;
        };
    }, [user?.id]); // Only re-run if user ID changes (login/logout)

    // When active chat changes, load messages
    useEffect(() => {
        if (activeChatUserId) {
            setActiveMessages([]);
            fetchActiveMessages(activeChatUserId);
        } else {
            setActiveMessages([]);
        }
    }, [activeChatUserId]); // fetchActiveMessages intentionally excluded - stable ref

    // "Yazıyor..." göstergesi: aktif sohbete özel, veritabanına yazmayan (broadcast) bir kanal.
    // İki kullanıcının da katıldığı, aralarında sabit bir kanal adı üretiyoruz.
    useEffect(() => {
        if (typingChannelRef.current) {
            supabase.removeChannel(typingChannelRef.current);
            typingChannelRef.current = null;
        }
        setPartnerTyping(false);
        if (partnerTypingTimeoutRef.current) {
            clearTimeout(partnerTypingTimeoutRef.current);
            partnerTypingTimeoutRef.current = null;
        }

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
            if (typingChannelRef.current) {
                supabase.removeChannel(typingChannelRef.current);
                typingChannelRef.current = null;
            }
            if (partnerTypingTimeoutRef.current) {
                clearTimeout(partnerTypingTimeoutRef.current);
                partnerTypingTimeoutRef.current = null;
            }
        };
    }, [activeChatUserId, user?.id]);

    // Kullanıcı yazarken çağrılır; en fazla 2 saniyede bir sinyal gönderir (spam önleme).
    const notifyTyping = useCallback(() => {
        if (!typingChannelRef.current || !user?.id) return;
        const now = Date.now();
        if (now - lastTypingSentRef.current < 2000) return;
        lastTypingSentRef.current = now;
        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id },
        });
    }, [user?.id]);

    const openChat = useCallback((userId: string) => {
        setActiveChatUserId(userId);
        setInboxTab('chats');
        setIsInboxOpen(true);
    }, []);

    const openSosAlerts = useCallback(() => {
        setInboxTab('sos');
        setIsInboxOpen(true);
    }, []);

    const onSendReply = useCallback(async (text: string, attachmentUrl?: string) => {
        const trimmed = text.trim();
        if ((!trimmed && !attachmentUrl) || !activeChatUserId) return;
        setIsReplying(true);

        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            text: trimmed,
            attachmentUrl,
            sentByMe: true,
            time: 'Şimdi',
            read: false
        };
        setActiveMessages(prev => [...prev, optimisticMsg]);

        try {
            await apiService.sendChatMessage(activeChatUserId, trimmed, 'inbox', undefined, attachmentUrl);
            fetchInbox();
        } catch (err) {
            console.error('Send message error:', err);
            setActiveMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            throw err;
        } finally {
            setIsReplying(false);
        }
    }, [activeChatUserId, fetchInbox]);

    const deleteMessage = useCallback(async (messageId: string) => {
        // Optimistic UI update
        setActiveMessages(prev => prev.filter(m => m.id !== messageId));
        try {
            await apiService.deleteChatMessage(messageId);
            fetchInbox();
        } catch (err) {
            console.error('Delete message error:', err);
            if (activeChatUserId) {
                fetchActiveMessages(activeChatUserId);
            }
        }
    }, [activeChatUserId, fetchActiveMessages, fetchInbox]);

    const recallMessage = useCallback(async (messageId: string) => {
        // Optimistic UI update: mesajı silmek yerine "geri alındı" olarak işaretle
        setActiveMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, text: '', attachmentUrl: null } : m));
        try {
            await apiService.recallChatMessage(messageId);
            fetchInbox();
        } catch (err) {
            console.error('Recall message error:', err);
            if (activeChatUserId) {
                fetchActiveMessages(activeChatUserId);
            }
        }
    }, [activeChatUserId, fetchActiveMessages, fetchInbox]);

    return (
        <ChatContext.Provider value={{
            isInboxOpen, setIsInboxOpen,
            inboxTab, setInboxTab,
            activeChatUserId, setActiveChatUserId,
            unreadCount, inboxMessages, sosAlerts,
            activeMessages,
            onSendReply, isReplying,
            partnerTyping, notifyTyping,
            onlineUserIds,
            openChat, openSosAlerts,
            refreshInbox: fetchInbox,
            deleteMessage,
            recallMessage,
            setSosAlerts
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
