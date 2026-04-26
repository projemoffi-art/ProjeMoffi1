'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from './AuthContext';

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
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const fetchInbox = async () => {
        if (!user) return;
        try {
            const data = await apiService.getChatConversations();
            setInboxMessages(data || []);
            const unread = (data || []).filter((m: any) => m.unread).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Inbox load error:", err);
        }
    };

    const fetchSosAlerts = async () => {
        try {
            const data = await apiService.getLostPets();
            setSosAlerts(data || []);
        } catch (err) {
            console.error("SOS load error:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchInbox();
            fetchSosAlerts();
            // Polling for updates (Mock mode)
            const interval = setInterval(fetchInbox, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const openChat = (userId: string) => {
        setActiveChatUserId(userId);
        setInboxTab('chats');
        setIsInboxOpen(true);
    };

    const openSosAlerts = () => {
        setInboxTab('sos');
        setIsInboxOpen(true);
    };

    const onSendReply = async () => {
        if (!replyMessage.trim() || !activeChatUserId) return;
        setIsReplying(true);
        try {
            await apiService.sendChatMessage(activeChatUserId, replyMessage.trim());
            setReplyMessage('');
            await fetchInbox();
            // In a real app, we'd fetch the specific messages for the active chat too
        } catch (err) {
            console.error("Send message error:", err);
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <ChatContext.Provider value={{
            isInboxOpen, setIsInboxOpen,
            inboxTab, setInboxTab,
            activeChatUserId, setActiveChatUserId,
            unreadCount, inboxMessages, sosAlerts,
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
