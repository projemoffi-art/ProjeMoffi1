import { useState, useEffect, useCallback } from "react";
import { IProfileService, UserProfile, ActivityLog } from "@/services/interfaces";
import { ProfileMockService } from "@/services/mock/ProfileMockService";

const profileService: IProfileService = new ProfileMockService();
const MOCK_USER_ID = 'user-1';

export function useProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [p, a] = await Promise.all([
                profileService.getProfile(MOCK_USER_ID),
                profileService.getActivityFeed(MOCK_USER_ID),
            ]);
            setProfile(p);
            setActivity(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Profil yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        setError(null);
        try {
            const updated = await profileService.updateProfile(MOCK_USER_ID, updates);
            setProfile(updated);
            return updated;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Güncellenemedi');
            return null;
        }
    }, []);

    const updateAvatar = useCallback(async (avatarUrl: string) => {
        setError(null);
        try {
            await profileService.updateAvatar(MOCK_USER_ID, avatarUrl);
            setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Avatar güncellenemedi');
        }
    }, []);

    const updatePreferences = useCallback(async (prefs: Partial<UserProfile['preferences']>) => {
        setError(null);
        try {
            await profileService.updatePreferences(MOCK_USER_ID, prefs);
            setProfile(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Tercihler güncellenemedi');
        }
    }, []);

    const deleteAccount = useCallback(async () => {
        setError(null);
        try {
            await profileService.deleteAccount(MOCK_USER_ID);
            setProfile(null);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Hesap silinemedi');
            return false;
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        activity,
        isLoading,
        error,
        updateProfile,
        updateAvatar,
        updatePreferences,
        deleteAccount,
        refresh: fetchProfile,
    };
}
