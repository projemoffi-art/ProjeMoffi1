"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
    joinedAt: string;
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
    // Business fields
    businessType?: BusinessType;
    businessId?: string;
    businessName?: string;
    businessApproved?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    getAllUsers: () => User[];
    deleteUser: (id: string) => void;
    registerBusiness: (data: {
        email: string;
        password: string;
        businessName: string;
        businessType: BusinessType;
        ownerName: string;
        phone: string;
        address: string;
        taxId: string;
        iban: string;
    }) => Promise<{ success: boolean; error?: string }>;
    showAIAssistant: boolean;
    setShowAIAssistant: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAIAssistant, setShowAIAssistant] = useState(true);

    // Load AI preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('moffi_show_ai');
        if (saved !== null) {
            setShowAIAssistant(saved === 'true');
        }
    }, []);

    // Save AI preference to localStorage
    useEffect(() => {
        localStorage.setItem('moffi_show_ai', showAIAssistant.toString());
    }, [showAIAssistant]);

    // Map Supabase User & Profile to our Custom App User
    const mapUserWithProfile = (sbUser: any, profile: any): User => {
        return {
            id: sbUser.id,
            username: profile?.username || sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || "User",
            email: sbUser.email || "",
            role: (profile?.role as UserRole) || (sbUser.user_metadata?.role as UserRole) || 'user',
            avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100",
            bio: profile?.bio || sbUser.user_metadata?.bio || "Yeni Moffi Üyesi ✨",
            joinedAt: sbUser.created_at || new Date().toISOString(),
            stats: {
                posts: profile?.posts_count || 0,
                followers: profile?.followers_count || 0,
                following: profile?.following_count || 0
            }
        };
    };

    useEffect(() => {
        const fetchUserData = async (sbUser: any) => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sbUser.id)
                    .single();

                setUser(mapUserWithProfile(sbUser, profile));
            } catch (error) {
                console.error("fetchUserData error:", error);
                // Fallback to basic user data if profile fetch fails
                setUser(mapUserWithProfile(sbUser, null));
            } finally {
                setIsLoading(false);
            }
        };

        const fetchSession = async () => {
            console.log("AuthContext: SUPABASE_DISABLED - Dev Mock Session mode active.");
            // Hızlıca geliştirici hesabını set ediyoruz
            setUser({
                id: "dev-mock-id",
                username: "MoffiGeliştirici",
                email: "dev@moffi.com",
                role: 'admin',
                avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100",
                bio: "Supabase limitsiz test hesabı ✨",
                joinedAt: new Date().toISOString(),
                stats: { posts: 42, followers: 1500, following: 120 }
            });
            setIsLoading(false);
            /*
            console.log("AuthContext: Fetching session...");
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log("AuthContext: Session found:", !!session);
                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("AuthContext: Fetch session error:", e);
                setIsLoading(false);
            }
            */
        };

        fetchSession();

        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                console.warn("AuthContext: Loading timed out.");
                setIsLoading(false);
            }
        }, 3000); // Reduced timeout for dev

        // SUPABASE_DISABLED: Auth state change disabled
        /*
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setIsLoading(true);
                    await fetchUserData(session.user);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );
        */

        return () => {
            // subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const login = async (email: string, password: string) => {
        // BYPASS FOR DEV (No Pro Supabase needed)
        if (email.toLowerCase() === "test@test.com" || email.toLowerCase() === "dev@moffi.com") {
            setUser({
                id: "dev-mock-id",
                username: "MoffiGeliştirici",
                email: email,
                role: 'admin',
                avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100",
                bio: "Supabase limitsiz test hesabı ✨",
                joinedAt: new Date().toISOString(),
                stats: { posts: 42, followers: 1500, following: 120 }
            });
            return { success: true };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            return { success: false, error: "E-posta veya şifre hatalı." };
        }
        return { success: true };
    };

    const signup = async (name: string, email: string, password: string) => {
        // BYPASS FOR DEV
        if (email.toLowerCase() === "test@test.com" || email.toLowerCase() === "dev@moffi.com") {
            setUser({
                id: "dev-mock-id",
                username: name,
                email: email,
                role: 'user',
                avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100",
                bio: "Yeni Moffi Üyesi ✨",
                joinedAt: new Date().toISOString(),
                stats: { posts: 0, followers: 0, following: 0 }
            });
            return { success: true };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: name,
                    role: 'user'
                }
            }
        });
        if (error) {
            // Translate common Supabase Auth errors for better UX
            if (error.message.includes('rate_limit') || error.message.includes('rate limit')) {
                return { success: false, error: "Çok fazla deneme yaptınız. Güvenlik gereği lütfen bir süre bekleyip tekrar deneyin." };
            }
            if (error.message.includes('already registered')) {
                return { success: false, error: "Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapmayı deneyin." };
            }
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const forgotPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, message: "Şifre sıfırlama e-postası gönderildi." };
    };

    const logout = async () => {
        setUser(null);
        await supabase.auth.signOut();
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;

        // Optimistic UI update
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);

        // Map subset of data back to Supabase user_metadata
        await supabase.auth.updateUser({
            data: {
                username: updatedUser.username,
                bio: updatedUser.bio,
                avatar_url: updatedUser.avatar
            }
        });
    };

    // --- MOCKS FOR LEGACY DASHBOARDS (So they don't crash) ---
    const getAllUsers = (): User[] => {
        return [];
    };

    const deleteUser = (id: string) => {
        console.warn("Delete User not implemented in Supabase Context yet.");
    };

    const registerBusiness = async (data: any) => {
        return { success: false, error: "Business registration requires Supabase DB schema." };
    };

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signup, logout,
            updateProfile, getAllUsers, forgotPassword, deleteUser, registerBusiness,
            showAIAssistant, setShowAIAssistant
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
