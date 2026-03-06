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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Map Supabase User to our Custom App User
    const mapSupabaseUser = (sbUser: any): User => {
        return {
            id: sbUser.id,
            username: sbUser.user_metadata?.username || sbUser.email?.split('@')[0] || "User",
            email: sbUser.email || "",
            role: (sbUser.user_metadata?.role as UserRole) || 'user',
            avatar: sbUser.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100", // Default Mochi avatar
            bio: sbUser.user_metadata?.bio || "Yeni Moffi Üyesi ✨",
            joinedAt: sbUser.created_at || new Date().toISOString(),
            stats: { posts: 0, followers: 0, following: 0 } // Default stats
        };
    };

    useEffect(() => {
        // Initial Fetch
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Auth Fetch Error:", error.message);
            }
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        fetchSession();

        // Listen for Auth Changes (Login, Logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setUser(mapSupabaseUser(session.user));
                } else {
                    setUser(null);
                }
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        // --- LOCAL DEV RATE LIMIT BYPASS ---
        if (email.endsWith('.test')) {
            const mockUser: User = {
                id: 'mock_test_user',
                email: email,
                username: email.split('@')[0],
                role: 'user',
                joinedAt: '2024 (Beta)',
                stats: { posts: 0, followers: 0, following: 0 }
            };
            setUser(mockUser);
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
        // --- LOCAL DEV RATE LIMIT BYPASS ---
        // If the user uses a '.test' email (e.g. hello@moffi.test), we mock a successful sign up
        // to prevent getting stuck on 'Rate Limit Exceeded' locks during UI testing!
        if (email.endsWith('.test')) {
            const mockUser: User = {
                id: 'mock_' + Date.now().toString(),
                email: email,
                username: name,
                role: 'user',
                joinedAt: '2024 (Beta)',
                stats: { posts: 0, followers: 0, following: 0 }
            };
            setUser(mockUser);
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
                return { success: false, error: "Çok fazla deneme yaptınız. Güvenlik gereği lütfen bir süre bekleyip tekrar deneyin veya farklı bir e-posta adresi kullanın." };
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
            updateProfile, getAllUsers, forgotPassword, deleteUser, registerBusiness
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
