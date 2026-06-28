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
 *
 * FIX: Uses a stable channelRef + fetchRef pattern to avoid the
 * "cannot add postgres_changes callbacks after subscribe()" error
 * that occurs when fetchNotifications is in the dependency array and
 * triggers re-subscriptions on every render.
 */
export function useRealtimeNotifications(userId: string | null | undefined) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    // Ref to hold the active channel — never recreated unless userId changes
    const channelRef = useRef<any>(null);
    // Ref to always have the latest fetchNotifications without stale closure
    const fetchRef = useRef<() => void>(() => {});

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await (apiService.getNotifications
                ? apiService.getNotifications()
                : apiService.getInboxMessages());
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, [userId]);

    // Keep fetchRef current so the channel callback always calls the latest version
    useEffect(() => {
        fetchRef.current = fetchNotifications;
    }, [fetchNotifications]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Realtime subscription — only recreated when userId changes, NOT when fetchNotifications changes
    useEffect(() => {
        if (!userId) return;

        // Clean up any existing channel first
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelName = `realtime-notifs-${userId}`;

        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Use ref so we never capture a stale fetchNotifications
                    fetchRef.current();
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Notifications channel subscribed for:', userId);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Notifications channel error for:', userId);
                }
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId]); // ← ONLY userId, never fetchNotifications

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
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return { notifications, unreadCount, markAllRead, markRead };
}
