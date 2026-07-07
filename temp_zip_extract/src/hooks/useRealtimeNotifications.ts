'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';

export interface AppNotification {
    id: string;
    type: string;
    title?: string;
    text?: string;
    content?: string;
    user?: string;
    avatar?: string;
    time?: string;
    read: boolean;
    is_read?: boolean;
    created_at?: string;
}

/**
 * Global Standard Realtime Notifications Hook
 * 
 * Subscribes to the user's notification stream via Supabase Realtime.
 * New notifications appear instantly — same pattern used by Instagram, Twitter, Discord.
 * 
 * DB Trigger (Supabase) → Realtime WebSocket → This hook → UI badge update
 */
export function useRealtimeNotifications(userId: string | null | undefined) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const channelRef = useRef<any>(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await (apiService.getNotifications ? apiService.getNotifications() : apiService.getInboxMessages());
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Realtime subscription for new notifications
    useEffect(() => {
        if (!userId) return;

        channelRef.current = supabase
            .channel(`notifications:user_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refetch to get the joined actor data (avatar, name)
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId, fetchNotifications]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
        setUnreadCount(0);
    }, [userId]);

    const markRead = useCallback(async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return { notifications, unreadCount, markAllRead, markRead };
}
