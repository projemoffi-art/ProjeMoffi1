import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Story {
    id: string;
    user_id: string;
    author_name: string;
    author_avatar: string | null;
    media_url: string;
    created_at: string;
}

// Grouped by user for Instagram-like bubbles
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

    const fetchStories = async () => {
        setIsLoading(true);
        // Get stories from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: true }); // Oldest first so they play in sequence

        if (error) {
            console.error('Error fetching stories:', error);
            setIsLoading(false);
            return;
        }

        // Group by user
        const groupsMap = new Map<string, UserStoryGroup>();

        data?.forEach((story: Story) => {
            if (!groupsMap.has(story.user_id)) {
                groupsMap.set(story.user_id, {
                    user_id: story.user_id,
                    author_name: story.author_name,
                    author_avatar: story.author_avatar,
                    stories: [],
                    hasUnseen: true, // simplified logic for MVP
                });
            }
            groupsMap.get(story.user_id)!.stories.push(story);
        });

        // Put current user first if they have a story, then sort others
        const allGroups = Array.from(groupsMap.values());

        let sortedGroups = allGroups;
        if (user) {
            const myGroupIndex = allGroups.findIndex(g => g.user_id === user.id);
            if (myGroupIndex > -1) {
                const myGroup = allGroups.splice(myGroupIndex, 1)[0];
                sortedGroups = [myGroup, ...allGroups];
            }
        }

        setStoryGroups(sortedGroups);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStories();

        // Setup Realtime Subscription to listen for new stories
        const channel = supabase
            .channel('public:stories')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, (payload) => {
                fetchStories(); // Auto-refresh when someone uploads
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const uploadStory = async (file: File) => {
        if (!user) return { success: false, error: 'User is not authenticated' };
        if (!user.id) return { success: false, error: 'User ID is missing' }; // Should not happen

        try {
            // 1. Upload the physical image to storage bucket
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('story-media')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // 2. Get the public URL of the uploaded image
            const { data: publicURLData } = supabase.storage
                .from('story-media')
                .getPublicUrl(fileName);

            // 3. Insert record into database table
            const { error: dbError } = await supabase
                .from('stories')
                .insert([{
                    user_id: user.id || 'mock',
                    author_name: user.username || 'Moffi User',
                    author_avatar: user.avatar || null,
                    media_url: publicURLData.publicUrl
                }]);

            if (dbError) throw dbError;

            // Trigger optimistic fetch
            fetchStories();

            return { success: true };
        } catch (error: any) {
            console.error('Upload failed:', error);
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
