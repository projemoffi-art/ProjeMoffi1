'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';

/**
 * Global Standard Realtime Feed Hook
 * 
 * Subscribes to Supabase Realtime on `posts`, `likes`, and `comments` tables.
 * When a post is liked, commented on, or a new post is added by ANY user, 
 * it appears instantly for ALL viewers without page reload.
 */
export function useRealtimeFeed(enabled: boolean = true) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const channelRef = useRef<any>(null);

    const fetchPosts = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const data = await apiService.getFeedContent();
            
            // 1. Filter out Blocked Users (Ideally this should be in apiService but we keep it simple here)
            const user = await apiService.getSessionUser();
            const blockedIds = (user?.settings?.moderation?.blockedUsers || []).map((u: any) => u.id);
            const filteredData = data.filter((post: any) => {
                const authorId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
                return !blockedIds.includes(authorId);
            });

            // 2. Apply initial sorting (Newest first as default)
            const sortType = user?.settings?.feed?.defaultSort || 'new';
            const sortedData = sortPostsLocally(filteredData, sortType);
            
            setPosts(sortedData);
        } catch (err) {
            console.error("[Realtime] Feed fetch error:", err);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    const sortPostsLocally = (data: any[], sortType: string) => {
        const sorted = [...data];
        if (sortType === 'popular') {
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
            return sorted.sort((a, b) => {
                const idA = typeof a.id === 'string' ? (parseInt(a.id.split('-').pop() || '0') || 0) : a.id;
                const idB = typeof b.id === 'string' ? (parseInt(b.id.split('-').pop() || '0') || 0) : b.id;
                return idB - idA;
            });
        }
    };

    // Initial fetch
    useEffect(() => {
        if (enabled) {
            fetchPosts();
        }
    }, [enabled]);

    // Realtime subscription
    useEffect(() => {
        if (!enabled) return;

        const channelName = 'public:feed';
        
        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => fetchPosts(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'likes' },
                () => fetchPosts(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                () => fetchPosts(true)
            )
            .subscribe();

        // Custom manual sync event
        const handleCustomSync = () => fetchPosts(true);

        // Optimistic UI for Post Likes
        const handleOptimisticPostLike = (e: any) => {
            const postId = e.detail?.postId;
            if (!postId) return;
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        isLiked: !p.isLiked,
                        likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1
                    };
                }
                return p;
            }));
        };

        window.addEventListener('moffi_posts_changed', handleCustomSync);
        window.addEventListener('moffi_optimistic_post_like', handleOptimisticPostLike);

        return () => {
            window.removeEventListener('moffi_posts_changed', handleCustomSync);
            window.removeEventListener('moffi_optimistic_post_like', handleOptimisticPostLike);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [enabled]);

    return {
        posts,
        setPosts,
        isLoading,
        refetchPosts: fetchPosts,
        sortPostsLocally
    };
}
