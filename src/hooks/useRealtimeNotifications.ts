'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppNotification {
    id: string;
    type: 'comment' | 'like' | 'follow' | 'system';
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
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

    // Initial fetch
    useEffect(() => {
        if (!userId) return;

        supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
                if (data) {
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            });
    }, [userId]);

    // Realtime subscription for new notifications
    useEffect(() => {
        if (!userId) return;

        channelRef.current = supabase
            .channel(`notifications:user_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = payload.new as AppNotification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, [userId]);

    const markRead = useCallback(async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return { notifications, unreadCount, markAllRead, markRead };
}
