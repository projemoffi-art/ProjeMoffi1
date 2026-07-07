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
    name?: string;
    display_name?: string;
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
    subscription_status?: string;
    kybStatus?: 'pending' | 'approved' | 'rejected';
    kybRejectionReason?: string;
    taxId?: string;
    iban?: string;
    address?: string;
    ownerName?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updateSettings: (category: any, data: any) => Promise<void>;
    verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email') => Promise<{ success: boolean; error?: string }>;
    resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    getAllUsers: () => User[];
    deleteUser: (id: string) => Promise<void>;
    registerBusiness: (data: any) => Promise<{ success: boolean; error?: string }>;
    approveBusiness: (id: string) => Promise<void>;
    rejectBusiness: (id: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_BASE = (email: string, name?: string): User => ({
    id: `user-${email.split('@')[0] || 'guest'}-${Date.now()}`,
    username: name || email.split('@')[0] || 'moffi_user',
    email: email,
    role: email.includes('admin') ? 'admin' : 'user',
    avatar: undefined,
    bio: "Moffi Dünyasına yeni katıldı! 🐾",
    is_prime: false,
    joinedAt: new Date().toISOString(),
    stats: { posts: 0, followers: 0, following: 0 },
    settings: {
        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
        privacy: { smartShopEnabled: true }
    }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sync user role to cookies for Next.js Middleware route protection
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (user) {
                document.cookie = `moffi_mock_user_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
            } else {
                document.cookie = "moffi_mock_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        }
    }, [user]);

    // --- INITIALIZATION ---
    useEffect(() => {
        let isMounted = true;
        const sessionSyncRef = { current: false };
        
        // Atomic Orchestrator for Auth & Profile
        const handleAuthChange = async (event: string, session: any) => {
            if (!isMounted) return;
            
            console.log(`[Auth] Orchestrating: ${event}`);

            if (session?.user) {
                try {
                    // Start sync - prevent other handlers from competing
                    sessionSyncRef.current = true;
                    
                    const profile = await apiService.getCurrentUser();
                    
                    if (!isMounted) return;

                    if (profile) {
                        setUser({
                            id: profile.id,
                            username: profile.username || profile.name || "user",
                            name: profile.name,
                            display_name: profile.name,
                            email: profile.email || session.user.email,
                            role: (profile.role === 'admin' || 
                                   (profile.email || session.user.email || '').toLowerCase() === 'projemoffi@gmail.com') 
                                   ? 'admin' : (profile.role || 'user'),
                            avatar: profile.avatar,
                            cover_photo: profile.cover_photo,
                            bio: profile.bio,
                            is_prime: profile.subscription_status === 'plus' || profile.subscription_status === 'pro' || profile.is_prime === true,
                            joinedAt: profile.created_at || new Date().toISOString(),
                            stats: profile.stats || { posts: 0, followers: 0, following: 0 },
                            subscription_status: profile.subscription_status
                        });
                    } else {
                        // Create missing profile for new users globally
                        console.log("[Auth] Profile missing for active session. Provisioning...");
                        const newProfile = await apiService.updateProfile({
                            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Moffi User',
                            username: session.user.email?.split('@')[0] || 'user',
                            email: session.user.email || ''
                        } as any);
                        
                        if (isMounted) {
                            setUser({
                                id: newProfile.id,
                                username: newProfile.username,
                                name: newProfile.name,
                                display_name: newProfile.name,
                                email: newProfile.email,
                                role: ((newProfile.email || '').toLowerCase() === 'projemoffi@gmail.com') 
                                       ? 'admin' : 'user',
                                avatar: newProfile.avatar,
                                cover_photo: newProfile.cover_photo,
                                bio: newProfile.bio,
                                is_prime: newProfile.subscription_status === 'plus' || newProfile.subscription_status === 'pro',
                                joinedAt: new Date().toISOString(),
                                stats: { posts: 0, followers: 0, following: 0 },
                                subscription_status: newProfile.subscription_status
                            });
                        }
                    }
                } catch (err) {
                    console.error("[Auth] Sync failed:", err);
                    // Stay logged in if session exists but profile fetch failed (fallback)
                    if (isMounted && !user) setUser(null); 
                }
            } else {
                // No valid session
                sessionSyncRef.current = false;
                if (!isSupabaseEnabled) {
                    const savedUser = localStorage.getItem('moffi_mock_user');
                    if (savedUser) setUser(JSON.parse(savedUser));
                    else setUser(MOCK_USER_BASE('guest@moffi.com', 'MoffiGuest'));
                } else {
                    setUser(null);
                }
            }
            
            if (isMounted) setIsLoading(false);
        };

        if (isSupabaseEnabled) {
            // 1. Check current session
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) handleAuthChange('INITIAL_SESSION', session);
                else handleAuthChange('NO_SESSION', null);
            });

            // 2. Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                // Ignore rapid-fire duplicate SIGNED_IN if we are already syncing
                if (event === 'SIGNED_IN' && sessionSyncRef.current) return;
                handleAuthChange(event, session);
            });

            return () => {
                isMounted = false;
                subscription.unsubscribe();
            };
        } else {
            handleAuthChange('MOCK_MODE', null);
            return () => { isMounted = false; };
        }
    }, []);

    // Listen to real-time auth / KYB updates
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const authChannel = new BroadcastChannel('moffi_auth_channel');
        
        const handleMessage = (event: MessageEvent) => {
            const { type, userId, status, reason } = event.data;
            
            if (type === 'KYB_STATUS_UPDATED') {
                // Check if currently logged in user is the target
                const storedUserStr = localStorage.getItem('moffi_mock_user');
                if (storedUserStr) {
                    const currentUser = JSON.parse(storedUserStr);
                    if (currentUser && currentUser.id === userId) {
                        // Reload user details from users list
                        const storedList = localStorage.getItem('moffi_mock_users_list');
                        if (storedList) {
                            const list = JSON.parse(storedList);
                            const updatedUser = list.find((u: any) => u.id === userId);
                            if (updatedUser) {
                                setUser(updatedUser);
                                localStorage.setItem('moffi_mock_user', JSON.stringify(updatedUser));
                                document.cookie = `moffi_mock_user_role=${updatedUser.role}; path=/; max-age=86400; SameSite=Lax`;
                                
                                // Show premium toast notification
                                const label = status === 'approved' ? 'Tebrikler! 🎉' : 'KYB Başvurusu Reddedildi. ❌';
                                const details = status === 'approved'
                                    ? 'İşletme/Hekim kaydınız platform yöneticisi tarafından onaylandı! Panel özellikleriniz aktif edildi.'
                                    : `Başvurunuz reddedildi. Gerekçe: ${reason || 'Belirtilmedi'}`;
                                
                                window.dispatchEvent(new CustomEvent('moffi-toast', {
                                    detail: {
                                        message: `Kurumsal Doğrulama: ${label} ${details}`,
                                        icon: status === 'approved' ? 'ShieldCheck' : 'ShieldAlert',
                                        color: status === 'approved' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                                    }
                                }));
                            }
                        }
                    }
                }
            }
        };

        authChannel.addEventListener('message', handleMessage);
        return () => {
            authChannel.removeEventListener('message', handleMessage);
            authChannel.close();
        };
    }, []);

    const login = async (email: string, password: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } else {
            const loggedUser = MOCK_USER_BASE(email);
            setUser(loggedUser);
            localStorage.setItem('moffi_mock_user', JSON.stringify(loggedUser));
            return { success: true };
        }
    };

    const signInWithGoogle = async () => {
        if (!isSupabaseEnabled) return;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    };

    const signInWithApple = async () => {
        if (!isSupabaseEnabled) return;
        await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    };

    const signup = async (name: string, email: string, password: string) => {
        if (isSupabaseEnabled) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                    // Supabase will send OTP to email — works with any SMTP
                    emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
                }
            });
            if (error) return { success: false, error: error.message };
            // If user already exists and is confirmed, treat as success
            if (data.user?.email_confirmed_at) {
                return { success: true, user: data.user };
            }
            return { success: true, user: data.user };
        } else {
            const newUser = MOCK_USER_BASE(email, name);
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
                name: data.name || data.username,
                username: data.username,
                avatar: data.avatar,
                bio: data.bio,
                cover_photo: (data as any).cover_photo,
                subscription_status: (data as any).subscription_status,
                is_setup_completed: (data as any).is_setup_completed,
                default_allow_comments: (data as any).default_allow_comments,
                default_comment_privacy: (data as any).default_comment_privacy,
                comment_filter_words: (data as any).comment_filter_words
            } as any);
            
            setUser(prev => {
                if (prev) {
                    return {
                        ...prev,
                        name: profile.name || prev.name,
                        display_name: profile.name || prev.display_name,
                        username: profile.username || prev.username,
                        avatar: profile.avatar !== undefined ? profile.avatar : prev.avatar,
                        cover_photo: profile.cover_photo !== undefined ? profile.cover_photo : prev.cover_photo,
                        bio: profile.bio !== undefined ? profile.bio : prev.bio,
                        subscription_status: profile.subscription_status || prev.subscription_status,
                        settings: {
                            ...prev.settings,
                            default_allow_comments: (profile as any).default_allow_comments !== undefined ? (profile as any).default_allow_comments : prev.settings?.default_allow_comments,
                            default_comment_privacy: (profile as any).default_comment_privacy || prev.settings?.default_comment_privacy,
                            comment_filter_words: (profile as any).comment_filter_words || prev.settings?.comment_filter_words
                        }
                    };
                }
                return {
                    id: profile.id,
                    username: profile.username || profile.name || data.username || "user",
                    name: profile.name || data.name || data.username,
                    display_name: profile.name || data.name || data.username,
                    email: profile.email || "user@moffi.com",
                    role: 'user',
                    avatar: profile.avatar,
                    cover_photo: profile.cover_photo,
                    bio: profile.bio,
                    joinedAt: new Date().toISOString(),
                    stats: { posts: 0, followers: 0, following: 0 },
                    settings: {
                        default_allow_comments: (profile as any).default_allow_comments,
                        default_comment_privacy: (profile as any).default_comment_privacy,
                        comment_filter_words: (profile as any).comment_filter_words
                    }
                };
            });
        } else {
            setUser(prev => prev ? { ...prev, ...data } : null);
        }
    };

    const updateSettings = async (category: any, data: any) => {
        setUser(prev => {
            if (!prev) return null;
            const updatedUser = {
                ...prev,
                settings: { ...prev.settings, [category]: { ...prev.settings?.[category], ...data } }
            };
            if (typeof window !== 'undefined' && !isSupabaseEnabled) {
                localStorage.setItem('moffi_mock_user', JSON.stringify(updatedUser));
            }
            return updatedUser;
        });
    };

    const forgotPassword = async (email: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?type=recovery`
            });
            if (error) return { success: false, error: error.message };
            return { success: true, message: "Sıfırlama e-postası gönderildi." };
        }
        return { success: true, message: "E-posta simüle edildi." };
    };

    const resendOtp = async (email: string) => {
        if (!isSupabaseEnabled) return { success: true };
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
                }
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const verifyOtp = async (email: string, token: string, type: any) => {
        if (isSupabaseEnabled) {
            // 'email' is the correct type for signup OTP verification in Supabase
            const otpType = type === 'signup' ? 'email' : type;
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: otpType
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        }
        return { success: true };
    };

    const getAllUsers = (): User[] => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('moffi_mock_users_list');
            if (stored) {
                return JSON.parse(stored);
            }
        }
        const defaultList: User[] = [
            {
                id: 'user-admin',
                username: 'admin',
                email: 'admin@moffipet.com',
                role: 'admin',
                bio: 'Moffi Platform Yöneticisi',
                joinedAt: '2025-01-01T12:00:00Z',
                is_prime: true,
                stats: { posts: 0, followers: 0, following: 0 }
            },
            {
                id: 'user-uveys',
                username: 'uveys',
                email: 'uveys@moffi.com',
                role: 'user',
                bio: 'Pati Dostu',
                joinedAt: '2025-02-15T12:00:00Z',
                is_prime: false,
                stats: { posts: 0, followers: 0, following: 0 }
            },
            {
                id: 'user-hekim',
                username: 'Dr. Moffi',
                email: 'doctor@moffipet.com',
                role: 'business',
                businessType: 'vet',
                businessName: 'Moffi Veteriner Kliniği',
                businessApproved: false,
                kybStatus: 'pending',
                taxId: '8765432109',
                iban: 'TR98 7654 3210 9876 5432 1098 76',
                address: 'Moda Caddesi No:42 Kadıköy / İstanbul',
                ownerName: 'Dr. Ahmet Yılmaz',
                phone: '0532 123 45 67',
                bio: 'VetLife Uzman Hekim',
                joinedAt: '2025-03-01T12:00:00Z',
                is_prime: true,
                stats: { posts: 0, followers: 0, following: 0 }
            }
        ];
        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_mock_users_list', JSON.stringify(defaultList));
        }
        return defaultList;
    };

    const deleteUser = async (id: string) => {
        if (typeof window !== 'undefined') {
            const list = getAllUsers();
            const updated = list.filter(u => u.id !== id);
            localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));
        }
    };

    const registerBusiness = async (data: any) => {
        if (typeof window !== 'undefined') {
            const newUser: User = {
                id: `business-${Date.now()}`,
                username: data.businessName,
                email: data.email,
                role: 'business',
                businessType: data.businessType,
                businessName: data.businessName,
                businessApproved: false,
                kybStatus: 'pending',
                taxId: data.taxId || '8765432109',
                iban: data.iban || 'TR98 7654 3210 9876 5432 1098 76',
                address: data.address || 'Moda Caddesi No:42 Kadıköy / İstanbul',
                ownerName: data.ownerName || 'Dr. Ahmet Yılmaz',
                phone: data.phone || '0532 123 45 67',
                joinedAt: new Date().toISOString(),
                stats: { posts: 0, followers: 0, following: 0 }
            };
            const stored = localStorage.getItem('moffi_mock_users_list');
            let list = stored ? JSON.parse(stored) : [];
            list.push(newUser);
            localStorage.setItem('moffi_mock_users_list', JSON.stringify(list));
            setUser(newUser);
            localStorage.setItem('moffi_mock_user', JSON.stringify(newUser));
        }
        return { success: true };
    };

    const approveBusiness = async (id: string) => {
        if (typeof window !== 'undefined') {
            const list = getAllUsers();
            const updated = list.map(u => u.id === id ? { ...u, businessApproved: true, kybStatus: 'approved' as const } : u);
            localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));

            // Broadcast approval to other active tabs
            const authChannel = new BroadcastChannel('moffi_auth_channel');
            authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'approved' });
            authChannel.close();
        }
    };

    const rejectBusiness = async (id: string, reason: string) => {
        if (typeof window !== 'undefined') {
            const list = getAllUsers();
            const updated = list.map(u => u.id === id ? { ...u, businessApproved: false, kybStatus: 'rejected' as const, kybRejectionReason: reason } : u);
            localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));

            // Broadcast rejection to other active tabs
            const authChannel = new BroadcastChannel('moffi_auth_channel');
            authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'rejected', reason });
            authChannel.close();
        }
    };

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signup, logout, 
            updateProfile, updateSettings, forgotPassword, verifyOtp, resendOtp,
            signInWithGoogle, signInWithApple, getAllUsers, deleteUser, registerBusiness, approveBusiness, rejectBusiness
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
