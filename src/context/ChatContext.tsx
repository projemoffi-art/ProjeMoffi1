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
    replyMessage: string;
    setReplyMessage: (val: string) => void;
    onSendReply: () => void;
    isReplying: boolean;
    openChat: (userId: string) => void;
    openSosAlerts: () => void;
    refreshInbox: () => Promise<void>;
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
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    
    // Use refs to avoid stale closures and prevent infinite loops
    const userRef = useRef(user);
    const activeChatUserIdRef = useRef(activeChatUserId);
    const channelRef = useRef<any>(null);
    const initializedRef = useRef(false);

    // Keep refs in sync (NO re-renders triggered)
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { activeChatUserIdRef.current = activeChatUserId; }, [activeChatUserId]);

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
                    fetchInbox();
                    if (activeChatUserIdRef.current) {
                        const newMsg = payload.new as any;
                        if (newMsg.sender_id !== userRef.current?.id) {
                            setActiveMessages(prev => [...prev, {
                                id: newMsg.id,
                                text: newMsg.content,
                                sentByMe: false,
                                time: 'Şimdi',
                                read: false
                            }]);
                        }
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
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

    const openChat = useCallback((userId: string) => {
        setActiveChatUserId(userId);
        setInboxTab('chats');
        setIsInboxOpen(true);
    }, []);

    const openSosAlerts = useCallback(() => {
        setInboxTab('sos');
        setIsInboxOpen(true);
    }, []);

    const onSendReply = useCallback(async () => {
        if (!replyMessage.trim() || !activeChatUserId) return;
        setIsReplying(true);

        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            text: replyMessage.trim(),
            sentByMe: true,
            time: 'Şimdi',
            read: false
        };
        setActiveMessages(prev => [...prev, optimisticMsg]);
        const sentContent = replyMessage.trim();
        setReplyMessage('');

        try {
            await apiService.sendChatMessage(activeChatUserId, sentContent);
            fetchInbox();
        } catch (err) {
            console.error('Send message error:', err);
            setActiveMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setReplyMessage(sentContent);
        } finally {
            setIsReplying(false);
        }
    }, [replyMessage, activeChatUserId, fetchInbox]);

    return (
        <ChatContext.Provider value={{
            isInboxOpen, setIsInboxOpen,
            inboxTab, setInboxTab,
            activeChatUserId, setActiveChatUserId,
            unreadCount, inboxMessages, sosAlerts,
            activeMessages,
            replyMessage, setReplyMessage,
            onSendReply, isReplying,
            openChat, openSosAlerts,
            refreshInbox: fetchInbox,
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
