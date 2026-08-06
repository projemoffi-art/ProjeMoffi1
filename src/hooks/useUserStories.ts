import { useState, useEffect, useCallback } from 'react';
import { SupabaseApiService } from '@/services/supabaseApiService';
const supabaseService = new SupabaseApiService();
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export interface Story {
    id: string;
    media_url: string;
    created_at: string;
    title?: string;
    description?: string;
    badge?: string;
}

export interface UserStoryGroup {
    user_id: string;
    author_name: string;
    author_avatar: string | null;
    stories: Story[];
    hasUnseen: boolean;
}

export function useUserStories() {
    const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawStories = await supabaseService.getStories();
            const viewedIds = await supabaseService.getViewedStoryIds();
            const viewedSet = new Set(viewedIds);
            
            // Group stories by userId
            const groupsMap = new Map<string, UserStoryGroup>();
            
            rawStories.forEach((s: any) => {
                if (!groupsMap.has(s.userId)) {
                    groupsMap.set(s.userId, {
                        user_id: s.userId,
                        author_name: s.userName,
                        author_avatar: s.userAvatar,
                        stories: [],
                        hasUnseen: false
                    });
                }
                
                groupsMap.get(s.userId)?.stories.push({
                    id: s.id,
                    media_url: s.imageUrl,
                    created_at: s.created_at || new Date().toISOString(),
                    title: '',
                    description: s.caption || '',
                    badge: 'Hikaye',
                    isLiked: s.isLiked || false,
                    viewCount: s.viewCount || 0,
                    isViewed: viewedSet.has(s.id)
                });
            });

            // Evaluate hasUnseen for each group
            groupsMap.forEach(group => {
                group.hasUnseen = group.stories.some(st => !st.isViewed);
            });

            // Sort so current user is first if they have stories
            let groups = Array.from(groupsMap.values());
            if (user) {
                const myGroupIdx = groups.findIndex(g => g.user_id === user.id);
                if (myGroupIdx > -1) {
                    const myGroup = groups.splice(myGroupIdx, 1)[0];
                    groups = [myGroup, ...groups];
                }
            }

            setStoryGroups(groups);
        } catch (err) {
            console.error('Error fetching user stories:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStories();

        const channel = supabase.channel('public:stories')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stories' },
                () => {
                    fetchStories();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchStories]);

    const uploadStory = async (file: File) => {
        try {
            // Upload to storage bucket
            const uploadedUrl = await supabaseService.uploadMedia(file, 'stories');
            
            // Add to database
            await supabaseService.addStory({
                imageUrl: uploadedUrl,
                caption: ''
            });

            // Refresh feed
            await fetchStories();
            return { success: true };
        } catch (error: any) {
            console.error('Error uploading story:', error);
            return { success: false, error: error.message || 'Story upload failed' };
        }
    };

    const deleteStory = async (storyId: string) => {
        try {
            await supabaseService.deleteStory(storyId);
            await fetchStories();
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting story:', error);
            return { success: false, error: error.message };
        }
    };

    const markStoryAsViewed = async (storyId: string) => {
        try {
            await supabaseService.markStoryAsViewed(storyId);
            setStoryGroups(prev => prev.map(g => {
                let changed = false;
                const newStories = g.stories.map(s => {
                    if (s.id === storyId && !s.isViewed) {
                        changed = true;
                        return { ...s, isViewed: true };
                    }
                    return s;
                });
                if (changed) {
                    const hasUnseen = newStories.some(s => !s.isViewed);
                    return { ...g, stories: newStories, hasUnseen };
                }
                return g;
            }));
        } catch (error) {
            console.error('Error marking story as viewed:', error);
        }
    };

    const toggleStoryLike = async (storyId: string) => {
        try {
            const newLikedState = await supabaseService.toggleStoryLike(storyId);
            
            // Optimistically update the UI
            setStoryGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(story => {
                    if (story.id === storyId) {
                        return { ...story, isLiked: newLikedState };
                    }
                    return story;
                })
            })));
            
            return { success: true, newLikedState };
        } catch (error: any) {
            console.error('Error toggling story like:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        storyGroups,
        isLoading,
        uploadStory,
        refreshStories: fetchStories,
        deleteStory,
        markStoryAsViewed,
        toggleStoryLike
    };
}
