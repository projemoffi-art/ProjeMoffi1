"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { SupabaseApiService } from "@/services/supabaseApiService";

export type UserRole = 'user' | 'business' | 'admin';
export type BusinessType = 'petshop' | 'vet' | 'grooming' | 'trainer' | 'shelter';

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    avatar?: string;
    cover_photo?: string;
    bio?: string;
    is_prime?: boolean;
    joinedAt: string;
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
    businessType?: BusinessType;
    businessId?: string;
    businessName?: string;
    businessApproved?: boolean;
    settings?: any; // Simplified for dynamic migration
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    updateSettings: (category: any, data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_BASE: User = {
    id: 'user-moffi-official',
    username: 'MoffiOfficial',
    email: 'official@moffi.com',
    role: 'admin',
    avatar: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400",
    bio: "Moffi Dünyasının Resmi Haber ve Destek Merkezi. 🐾",
    is_prime: true,
    joinedAt: new Date().toISOString(),
    stats: { posts: 8, followers: 154200, following: 12 },
    settings: {
        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
        privacy: { smartShopEnabled: true }
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- INITIALIZATION ---
    useEffect(() => {
        let isMounted = true;
        // Track if profile was loaded during init so onAuthStateChange doesn't double-fetch
        const sessionLoadedRef = { current: false };
        
        const initAuth = async () => {
            const timeout = setTimeout(() => {
                if (isMounted) {
                    setIsLoading(false);
                    console.warn("Auth initialization timed out.");
                }
            }, 8000);

            try {
                if (isSupabaseEnabled) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session && isMounted) {
                        sessionLoadedRef.current = true;
                        const profile = await apiService.getCurrentUser();
                        if (profile && isMounted) {
                            setUser({
                                id: profile.id,
                                username: profile.username || profile.name,
                                email: profile.email,
                                role: 'user',
                                avatar: profile.avatar,
                                bio: profile.bio,
                                joinedAt: new Date().toISOString(),
                                stats: profile.stats || { posts: 0, followers: 0, following: 0 }
                            });
                        }
                    }
                } else if (isMounted) {
                    const savedUser = localStorage.getItem('moffi_mock_user');
                    if (savedUser) setUser(JSON.parse(savedUser));
                    else setUser(MOCK_USER_BASE);
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                if (!isSupabaseEnabled && isMounted) setUser(MOCK_USER_BASE);
            } finally {
                clearTimeout(timeout);
                if (isMounted) setIsLoading(false);
            }
        };

        initAuth();

        if (isSupabaseEnabled) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session && !sessionLoadedRef.current) {
                    // Only fetch profile if NOT already loaded during initAuth
                    const profile = await apiService.getCurrentUser();
                    if (profile && isMounted) {
                        setUser({
                            id: profile.id,
                            username: profile.name,
                            email: profile.email,
                            role: 'user',
                            avatar: profile.avatar,
                            bio: profile.bio,
                            joinedAt: new Date().toISOString(),
                            stats: profile.stats || { posts: 0, followers: 0, following: 0 }
                        });
                    }
                } else if (event === 'SIGNED_IN') {
                    // Session already loaded - just mark it
                    sessionLoadedRef.current = false; // Reset for future sign-ins
                } else if (event === 'SIGNED_OUT') {
                    if (isMounted) setUser(null);
                    // Clear the auth cache so next login gets fresh data
                    if (apiService instanceof SupabaseApiService) {
                        (apiService as SupabaseApiService).invalidateCache();
                    }
                }
            });
            return () => {
                isMounted = false;
                subscription.unsubscribe();
            };
        }
        return () => { isMounted = false; };
    }, []);

    const login = async (email: string, password: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } else {
            const loggedUser = { ...MOCK_USER_BASE, email, username: email.split('@')[0] };
            setUser(loggedUser);
            localStorage.setItem('moffi_mock_user', JSON.stringify(loggedUser));
            return { success: true };
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } else {
            const newUser = { ...MOCK_USER_BASE, id: `user-${Date.now()}`, username: name, email };
            setUser(newUser);
            localStorage.setItem('moffi_mock_user', JSON.stringify(newUser));
            return { success: true };
        }
    };

    const logout = async () => {
        if (isSupabaseEnabled) await supabase.auth.signOut();
        else localStorage.removeItem('moffi_mock_user');
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (isSupabaseEnabled) {
            const profile = await apiService.updateProfile({
                name: data.username,
                avatar: data.avatar,
                bio: data.bio
            } as any);
            setUser(prev => prev ? { ...prev, ...data } : null);
        } else {
            setUser(prev => prev ? { ...prev, ...data } : null);
        }
    };

    const updateSettings = async (category: any, data: any) => {
        // Implement settings persistence if needed
        setUser(prev => prev ? {
            ...prev,
            settings: { ...prev.settings, [category]: { ...prev.settings?.[category], ...data } }
        } : null);
    };

    const forgotPassword = async (email: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) return { success: false, error: error.message };
            return { success: true, message: "Sıfırlama e-postası gönderildi." };
        }
        return { success: true, message: "E-posta simüle edildi." };
    };

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signup, logout, 
            updateProfile, updateSettings, forgotPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
