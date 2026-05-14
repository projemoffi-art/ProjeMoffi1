'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';

export interface RealtimeComment {
    id: string;
    user: string;
    avatar: string;
    text: string;
    time: string;
    user_id: string;
    status?: string;
}

/**
 * Global Standard Realtime Comment Hook
 * 
 * Subscribes to Supabase Realtime on the `comments` table filtered by post_id.
 * When a new comment is inserted by ANY user, it appears instantly for ALL viewers
 * without page reload — exactly how Instagram/TikTok works.
 */
export function useRealtimeComments(postId: string | number | null, enabled: boolean) {
    const [comments, setComments] = useState<RealtimeComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const channelRef = useRef<any>(null);

    // Initial fetch when panel opens
    useEffect(() => {
        if (!postId || !enabled) return;

        setIsLoading(true);
        apiService.getPostComments(postId)
            .then(data => setComments(data))
            .catch(err => console.error('[Realtime] Initial comments fetch failed:', err))
            .finally(() => setIsLoading(false));
    }, [postId, enabled]);

    // Realtime subscription
    useEffect(() => {
        if (!postId || !enabled) return;

        const channelName = `comments:post_id=eq.${postId}`;
        
        // Subscribe to ALL events (INSERT, UPDATE, DELETE) on this post's comments and likes
        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId}`,
                },
                () => {
                    // Refetch all comments on any change to guarantee perfect global sync
                    apiService.getPostComments(postId)
                        .then(data => setComments(data))
                        .catch(err => console.error('[Realtime] Refetch failed:', err));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes',
                },
                () => {
                    // Beğeni/Beğeni kaldırma işlemlerinde tüm listeyi anında eşitle
                    apiService.getPostComments(postId)
                        .then(data => setComments(data))
                        .catch(err => console.error('[Realtime] Like refetch failed:', err));
                }
            )
            .subscribe();

        const handleCustomSync = () => {
            apiService.getPostComments(postId)
                .then(data => setComments(data))
                .catch(err => console.error('[Realtime] Custom sync failed:', err));
        };

        window.addEventListener('moffi_comments_changed', handleCustomSync);

        return () => {
            window.removeEventListener('moffi_comments_changed', handleCustomSync);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [postId, enabled]);

    const refetchComments = () => {
        if (!postId) return;
        apiService.getPostComments(postId)
            .then(data => setComments(data))
            .catch(err => console.error('[Realtime] Manual refetch failed:', err));
    };

    const addComment = async (text: string, currentUser: any, parentCommentId?: string | number) => {
        if (!postId || !text.trim()) return;

        try {
            await apiService.addComment(postId, text, parentCommentId);
            refetchComments(); 
        } catch (err: any) {
            console.error('[Realtime] addComment failed:', err);
            alert(err?.message || 'Yorum eklenirken hata oluştu. Gönderi yorumlara kapatılmış olabilir.');
            throw err;
        }
    };

    return { comments, isLoading, addComment, refetchComments };
}
