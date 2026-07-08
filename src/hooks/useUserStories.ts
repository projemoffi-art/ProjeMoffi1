import { useState, useEffect, useCallback } from 'react';
import { SupabaseApiService } from '@/services/supabaseApiService';
const supabaseService = new SupabaseApiService();
import { useAuth } from '@/context/AuthContext';

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
            
            // Group stories by userId
            const groupsMap = new Map<string, UserStoryGroup>();
            
            rawStories.forEach((s: any) => {
                if (!groupsMap.has(s.userId)) {
                    groupsMap.set(s.userId, {
                        user_id: s.userId,
                        author_name: s.userName,
                        author_avatar: s.userAvatar,
                        stories: [],
                        hasUnseen: true // Simplified logic, usually checked against viewed status
                    });
                }
                
                groupsMap.get(s.userId)?.stories.push({
                    id: s.id,
                    media_url: s.imageUrl,
                    created_at: s.created_at || new Date().toISOString(),
                    title: '',
                    description: s.caption || '',
                    badge: 'Hikaye'
                });
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

    return {
        storyGroups,
        isLoading,
        uploadStory,
        refreshStories: fetchStories
    };
}
