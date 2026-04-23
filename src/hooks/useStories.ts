import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

export interface Story {
    id: string;
    user_id: string;
    author_name: string;
    author_avatar: string | null;
    media_url: string;
    created_at: string;
}

export interface UserStoryGroup {
    user_id: string;
    author_name: string;
    author_avatar: string | null;
    stories: Story[];
    hasUnseen: boolean;
}

export function useStories() {
    const { user } = useAuth();
    const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getStories();
            
            // Group by user
            const groupsMap = new Map<string, UserStoryGroup>();

            data?.forEach((story: any) => {
                if (!groupsMap.has(story.user_id)) {
                    groupsMap.set(story.user_id, {
                        user_id: story.user_id,
                        author_name: story.author_name || 'Moffi User',
                        author_avatar: story.author_avatar,
                        stories: [],
                        hasUnseen: true,
                    });
                }
                groupsMap.get(story.user_id)!.stories.push(story);
            });

            const allGroups = Array.from(groupsMap.values());
            let sortedGroups = allGroups;
            
            if (user) {
                // 1. Filter out Blocked Users from Stories
                const blockedIds = (user?.settings?.moderation?.blockedUsers || []).map((u: any) => u.id);
                const visibleGroups = allGroups.filter(g => !blockedIds.includes(g.user_id));

                const myGroupIndex = visibleGroups.findIndex(g => g.user_id === user.id);
                if (myGroupIndex > -1) {
                    const myGroup = visibleGroups.splice(myGroupIndex, 1)[0];
                    sortedGroups = [myGroup, ...visibleGroups];
                } else {
                    sortedGroups = visibleGroups;
                }
            }

            setStoryGroups(sortedGroups);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchStories();
        // Supabase real-time story updates removed for mock mode.
    }, [fetchStories]);

    const uploadStory = async (file: File) => {
        if (!user) return { success: false, error: 'Auth required' };

        try {
            // 1. Upload to Storage
            const publicUrl = await apiService.uploadMedia(file, 'stories');

            // 2. Add to DB
            await apiService.addStory({
                mediaUrl: publicUrl,
                duration: 5
            });

            fetchStories();
            return { success: true };
        } catch (error: any) {
            console.error('Story upload failed:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        storyGroups,
        isLoading,
        uploadStory,
        refreshStories: fetchStories
    };
}

