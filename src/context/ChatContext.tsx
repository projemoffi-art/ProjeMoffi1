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
    activeMessages: any[]; // Messages for currently open chat
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
    const realtimeRef = useRef<any>(null);

    // ─── Fetch conversation list ───────────────────────────────────────────────
    const fetchInbox = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiService.getChatConversations();
            setInboxMessages(data || []);
            const unread = (data || []).filter((m: any) => m.unread).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Inbox load error:', err);
        }
    }, [user]);

    // ─── Fetch messages for active chat ───────────────────────────────────────
    const fetchActiveMessages = useCallback(async (otherUserId: string) => {
        try {
            const msgs = await apiService.getChatMessages(otherUserId);
            setActiveMessages(msgs || []);
            // Mark as read
            await apiService.markChatAsRead(otherUserId);
            // Refresh unread count
            fetchInbox();
        } catch (err) {
            console.error('Messages load error:', err);
        }
    }, [fetchInbox]);

    // ─── Fetch SOS alerts ─────────────────────────────────────────────────────
    const fetchSosAlerts = useCallback(async () => {
        try {
            const data = await apiService.getLostPets();
            setSosAlerts(data || []);
        } catch (err) {
            console.error('SOS load error:', err);
        }
    }, []);

    // ─── Setup Supabase Realtime subscription ─────────────────────────────────
    useEffect(() => {
        if (!user) return;

        fetchInbox();
        fetchSosAlerts();

        // Subscribe to new messages (real-time)
        const channel = supabase
            .channel(`chat-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    // Refresh inbox to show latest message preview
                    fetchInbox();

                    // If the new message is in the active chat, append it
                    if (activeChatUserId) {
                        const newMsg = payload.new as any;
                        if (newMsg.sender_id !== user.id) {
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

        realtimeRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, activeChatUserId, fetchInbox, fetchSosAlerts]);

    // ─── When active chat changes, load messages ───────────────────────────────
    useEffect(() => {
        if (activeChatUserId) {
            setActiveMessages([]);
            fetchActiveMessages(activeChatUserId);
        } else {
            setActiveMessages([]);
        }
    }, [activeChatUserId, fetchActiveMessages]);

    // ─── Open chat helper ──────────────────────────────────────────────────────
    const openChat = useCallback((userId: string) => {
        setActiveChatUserId(userId);
        setInboxTab('chats');
        setIsInboxOpen(true);
    }, []);

    const openSosAlerts = useCallback(() => {
        setInboxTab('sos');
        setIsInboxOpen(true);
    }, []);

    // ─── Send message ──────────────────────────────────────────────────────────
    const onSendReply = useCallback(async () => {
        if (!replyMessage.trim() || !activeChatUserId) return;
        setIsReplying(true);

        // Optimistic UI — add message instantly
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
            // Refresh to confirm from DB
            fetchInbox();
        } catch (err) {
            console.error('Send message error:', err);
            // Rollback optimistic update
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
