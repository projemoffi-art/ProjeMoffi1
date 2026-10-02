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
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
    signup: (name: string, email: string, password: string, marketingConsent?: boolean) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    signOutOtherDevices: () => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updateSettings: (category: any, data: any) => Promise<void>;
    verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email') => Promise<{ success: boolean; error?: string }>;
    resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    deleteUser: (id: string) => Promise<void>;
    registerBusiness: (data: any) => Promise<{ success: boolean; error?: string }>;
    approveBusiness: (id: string) => Promise<void>;
    rejectBusiness: (id: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = process.env.NODE_ENV !== 'production' ? "admin@moffipet.com" : null;

const MOCK_USER_BASE = (email: string, name?: string): User => ({
    id: `user-${email.split('@')[0] || 'guest'}-${Date.now()}`,
    username: name || email.split('@')[0] || 'moffi_user',
    email: email,
    role: (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'user',
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
    const userRef = React.useRef<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isLoadingRef = React.useRef(true);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Sync isLoadingRef so syncSessionCookie can access latest isLoading without re-renders
    React.useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    // Sync user role to cookies for Next.js Middleware route protection
    // IMPORTANT: Only runs AFTER loading is complete to avoid deleting valid sessions
    // Rol, ara katmanda (middleware) her istekte Supabase oturumundan ve profiles.role'den okunur.
    // Ayrı bir imzalı rol çerezi tutulmaz (eskiden vardı; imza anahtarı tanımsızken taklit edilebiliyordu).

    // --- INITIALIZATION ---
    useEffect(() => {
        let isMounted = true;
        let authListener: any = null;

        const initializeAuth = async () => {
            if (!isSupabaseEnabled) {
                // Heal stale user lists in localStorage
                if (typeof window !== 'undefined') {
                    const storedList = localStorage.getItem('moffi_mock_users_list');
                    if (storedList) {
                        try {
                            const list = JSON.parse(storedList);
                            let changed = false;
                            const updated = list.map((u: any) => {
                                if (u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && u.role !== 'admin') {
                                    changed = true;
                                    return { ...u, role: 'admin' };
                                }
                                return u;
                            });
                            if (changed) {
                                localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));
                            }
                        } catch (e) {}
                    }
                }

                const savedUser = localStorage.getItem('moffi_mock_user');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    if (parsed && parsed.email && parsed.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && parsed.role !== 'admin') {
                        parsed.role = 'admin';
                        localStorage.setItem('moffi_mock_user', JSON.stringify(parsed));
                    }
                    setUser(parsed);
                } else {
                    setUser(MOCK_USER_BASE('guest@moffi.com', 'MoffiGuest'));
                }
                setIsLoading(false);
                return;
            }

            try {
                // 1. Get initial session
                const { data: { session } } = await supabase.auth.getSession();
                
                if (isMounted) {
                    if (session?.user) {
                        await syncProfile(session);
                    } else {
                        setUser(null);
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("[Auth] Initial session check failed:", err);
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
            }

            // 2. Set up event listener for subsequent changes
            if (isMounted) {
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (!isMounted) return;
                    console.log(`[Auth] Auth state change event: ${event}`);
                    
                    if (event === 'SIGNED_OUT') {
                        setUser(null);
                    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        if (session?.user) {
                            await syncProfile(session);
                        }
                    }
                });
                authListener = subscription;
            }
        };

        // FIX: syncProfile uses session.user.id DIRECTLY to query the profile.
        // Previously it called getCurrentUser() → getSession() which could return
        // a stale cached session for the WRONG user during account switching.
        const syncProfile = async (session: any) => {
            if (!session?.user?.id) return;
            const authUser = session.user;
            console.log(`[Auth] Syncing profile for user: ${authUser.id} (${authUser.email})`);

            try {
                // Use getUserProfile(id) directly — bypasses any stale getSession() cache
                const profile = await apiService.getUserProfile(authUser.id);
                if (!isMounted) return;

                if (profile) {
                    setUser({
                        id: profile.id,
                        username: profile.username || authUser.email?.split('@')[0] || 'user',
                        name: (profile as any).name || profile.username || 'Moffi User',
                        display_name: (profile as any).name || profile.username || 'Moffi User',
                        email: authUser.email,
                        role: (profile.role || 'user') as UserRole,
                        avatar: profile.avatar,
                        cover_photo: profile.cover_photo,
                        bio: profile.bio,
                        is_prime: (profile as any).is_prime === true,
                        joinedAt: (profile as any).created_at || new Date().toISOString(),
                        stats: profile.stats || { posts: 0, followers: 0, following: 0 },
                        subscription_status: profile.subscription_status,
                        businessType: (profile as any).business_type || (profile as any).businessType,
                        businessName: (profile as any).business_name || (profile as any).businessName,
                        businessApproved: (profile as any).business_approved || (profile as any).businessApproved,
                        kybStatus: (profile as any).kyb_status || (profile as any).kybStatus,
                        taxId: (profile as any).tax_id || (profile as any).taxId,
                        iban: (profile as any).iban,
                        address: (profile as any).address,
                        ownerName: (profile as any).owner_name || (profile as any).ownerName,
                        phone: profile.phone,
                        settings: {
                            appearance: (profile as any).settings?.appearance || { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                            privacy: (profile as any).settings?.privacy || { smartShopEnabled: true }
                        }
                    });
                } else {
                    // No profile row yet — create one (first-time login)
                    console.log('[Auth] No profile found for', authUser.id, '— provisioning...');
                    const newProfile = await apiService.updateProfile({
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Moffi User',
                        username: authUser.email?.split('@')[0] || 'user',
                    } as any);
                    if (isMounted && newProfile) {
                        setUser({
                            id: newProfile.id,
                            username: newProfile.username,
                            name: newProfile.name,
                            display_name: newProfile.name,
                            email: authUser.email,
                            role: newProfile.role || 'user',
                            avatar: newProfile.avatar,
                            joinedAt: new Date().toISOString(),
                            stats: { posts: 0, followers: 0, following: 0 },
                            settings: {
                                appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                                privacy: { smartShopEnabled: true }
                            }
                        });
                    }
                }
            } catch (err: any) {
                console.error('[Auth] Profile sync failed:', err?.message || err);
                // Fallback: use auth session data so user isn't blocked
                if (isMounted) {
                    setUser({
                        id: authUser.id,
                        username: authUser.email?.split('@')[0] || 'user',
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Moffi User',
                        display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Moffi User',
                        email: authUser.email || '',
                        role: 'user',
                        avatar: authUser.user_metadata?.avatar_url,
                        joinedAt: new Date().toISOString(),
                        stats: { posts: 0, followers: 0, following: 0 },
                        settings: {
                            appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                            privacy: { smartShopEnabled: true }
                        }
                    });
                }
            }
        };

        initializeAuth();

        return () => {
            isMounted = false;
            if (authListener) authListener.unsubscribe();
        };
    }, []);

    // Listen to real-time auth / KYB updates
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const authChannel = new BroadcastChannel('moffi_auth_channel');
        
        const handleMessage = async (event: MessageEvent) => {
            const { type, userId, status, reason } = event.data;
            
            if (type === 'KYB_STATUS_UPDATED') {
                if (isSupabaseEnabled) {
                    // Fetch verified user profile directly from DB to prevent spoofing
                    const profile = await apiService.getCurrentUser();
                    if (profile && profile.id === userId) {
                        setUser(prev => prev ? {
                            ...prev,
                            role: profile.role || 'user',
                            businessApproved: (profile as any).business_approved || (profile as any).businessApproved,
                            kybStatus: (profile as any).kyb_status || (profile as any).kybStatus,
                            kybRejectionReason: (profile as any).kyb_rejection_reason || (profile as any).kybRejectionReason
                        } : null);
                        
                        const currentKyb = (profile as any).kyb_status || (profile as any).kybStatus;
                        const label = currentKyb === 'approved' ? 'Tebrikler! 🎉' : 'KYB Başvurusu Reddedildi. ❌';
                        const details = currentKyb === 'approved'
                            ? 'İşletme/Hekim kaydınız platform yöneticisi tarafından onaylandı! Panel özellikleriniz aktif edildi.'
                            : `Başvurunuz reddedildi. Gerekçe: ${(profile as any).kyb_rejection_reason || (profile as any).kybRejectionReason || 'Belirtilmedi'}`;

                        window.dispatchEvent(new CustomEvent('moffi-toast', {
                            detail: {
                                message: `Kurumsal Doğrulama: ${label} ${details}`,
                                icon: currentKyb === 'approved' ? 'ShieldCheck' : 'ShieldAlert',
                                color: currentKyb === 'approved' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                            }
                        }));
                    }
                } else {
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
            if (error) {
                // Doğrulanmamış hesap: şifre doğru ama e-posta kodu girilmemiş → yeni kod gönderip kod ekranına geç
                if ((error as any).code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
                    await supabase.auth.resend({ type: 'signup', email });
                    return { success: false, needsVerification: true };
                }
                return { success: false, error: error.message };
            }
            return { success: true };
        } else {
            let loggedUser: User | null = null;
            if (typeof window !== 'undefined') {
                const storedList = localStorage.getItem('moffi_mock_users_list');
                if (storedList) {
                    const list = JSON.parse(storedList);
                    loggedUser = list.find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
                }
            }

            if (!loggedUser) {
                loggedUser = MOCK_USER_BASE(email);
                if (typeof window !== 'undefined') {
                    const storedList = localStorage.getItem('moffi_mock_users_list');
                    const list = storedList ? JSON.parse(storedList) : [];
                    list.push(loggedUser);
                    localStorage.setItem('moffi_mock_users_list', JSON.stringify(list));
                }
            }

            if (loggedUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                loggedUser.role = 'admin';
            }

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

    const signup = async (name: string, email: string, password: string, marketingConsent: boolean = false) => {
        if (isSupabaseEnabled) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name, marketing_consent: marketingConsent },
                    emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
                }
            });
            if (error) return { success: false, error: error.message };
            // Doğrulama açıkken kayıtlı bir adres için Supabase hata yerine kimliksiz kullanıcı döner
            if (data.user && data.user.identities?.length === 0) {
                return { success: false, error: 'User already registered' };
            }
            // Oturum yoksa e-posta doğrulaması açık: 6 haneli kod gönderildi
            return { success: true, needsVerification: !data.session };
        } else {
            const newUser = MOCK_USER_BASE(email, name);
            setUser(newUser);
            localStorage.setItem('moffi_mock_user', JSON.stringify(newUser));

            if (typeof window !== 'undefined') {
                const storedList = localStorage.getItem('moffi_mock_users_list');
                const list = storedList ? JSON.parse(storedList) : [];
                list.push(newUser);
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(list));
            }

            return { success: true };
        }
    };

    const logout = async () => {
        if (isSupabaseEnabled) {
            await supabase.auth.signOut({ scope: 'local' });
        }
        // Clear ALL moffi and supabase auth keys from localStorage
        // to prevent stale token contamination on next login
        if (typeof window !== 'undefined') {
            const keysToRemove = Object.keys(localStorage).filter(
                k => k.startsWith('moffi_') || k.startsWith('sb-') || k.includes('supabase')
            );
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
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
        const currentUser = userRef.current;
        if (!currentUser) return;

        const updatedSettings = {
            ...currentUser.settings,
            [category]: { ...currentUser.settings?.[category], ...data }
        };
        const updatedUser = {
            ...currentUser,
            settings: updatedSettings
        };
        
        // State ve Ref'i anında senkron güncelle ki art arda çağrılarda patlamasın
        setUser(updatedUser);
        userRef.current = updatedUser;

        if (typeof window !== 'undefined') {
            if (isSupabaseEnabled) {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ settings: updatedSettings })
                        .eq('id', currentUser.id);
                    if (error) console.error("Error saving settings to database:", error);
                } catch (err) {
                    console.error("Exception saving settings:", err);
                }
            } else {
                localStorage.setItem('moffi_mock_user', JSON.stringify(updatedUser));
            }
        }
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

    // Sıfırlama e-postasındaki 6 haneli kod doğrulanınca oturum açılır, ardından yeni şifre kaydedilir.
    const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
        if (!isSupabaseEnabled) return { success: true };
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
        if (error) return { success: false, error: error.message };
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) return { success: false, error: updateError.message };
        return { success: true };
    };

    // Mevcut şifre yeniden doğrulanmadan şifre değiştirilmez (açık kalmış bir oturumu ele geçiren şifreyi değiştiremesin)
    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (!isSupabaseEnabled) return { success: true };
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const email = authUser?.email;
        if (!email) return { success: false, error: 'Oturum bulunamadı, tekrar giriş yap.' };
        if (!authUser?.identities?.some(i => i.provider === 'email')) {
            return { success: false, error: 'Bu hesap Google ile açılmış; şifre Google hesabından yönetilir.' };
        }
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (authError) return { success: false, error: 'Mevcut şifre hatalı.' };
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: /same/i.test(error.message) ? 'Yeni şifre eskisiyle aynı olamaz.' : 'Şifre güncellenemedi. En az 8 karakter olmalı.' };
        await supabase.auth.signOut({ scope: 'others' });
        return { success: true };
    };

    const signOutOtherDevices = async () => {
        if (!isSupabaseEnabled) return { success: true };
        const { error } = await supabase.auth.signOut({ scope: 'others' });
        return error ? { success: false, error: error.message } : { success: true };
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

    const getAllUsers = async (): Promise<User[]> => {
        if (isSupabaseEnabled) {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) {
                console.error("Error fetching users from database:", error);
                return [];
            }
            return data.map((profile: any) => ({
                id: profile.id,
                username: profile.username || profile.full_name || 'user',
                name: profile.full_name,
                email: profile.email || '',
                role: profile.role || 'user',
                avatar: profile.avatar_url,
                bio: profile.bio,
                joinedAt: profile.created_at || new Date().toISOString(),
                stats: { posts: 0, followers: 0, following: 0 },
                businessType: profile.business_type,
                businessName: profile.business_name,
                businessApproved: profile.business_approved,
                kybStatus: profile.kyb_status,
                taxId: profile.tax_id,
                iban: profile.iban,
                address: profile.address,
                ownerName: profile.owner_name,
                phone: profile.phone,
                settings: profile.settings || {}
            }));
        } else {
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
                    stats: { posts: 0, followers: 0, following: 0 },
                    settings: {
                        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                        privacy: { smartShopEnabled: true }
                    }
                },
                {
                    id: 'user-uveys',
                    username: 'uveys',
                    email: 'uveys@moffi.com',
                    role: 'user',
                    bio: 'Pati Dostu',
                    joinedAt: '2025-02-15T12:00:00Z',
                    is_prime: false,
                    stats: { posts: 0, followers: 0, following: 0 },
                    settings: {
                        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                        privacy: { smartShopEnabled: true }
                    }
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
                    stats: { posts: 0, followers: 0, following: 0 },
                    settings: {
                        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                        privacy: { smartShopEnabled: true }
                    }
                }
            ];
            if (typeof window !== 'undefined') {
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(defaultList));
            }
            return defaultList;
        }
    };

    const deleteUser = async (id: string) => {
        if (isSupabaseEnabled) {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) {
                console.error("Error deleting user from database:", error);
            }
        } else {
            if (typeof window !== 'undefined') {
                const list = await getAllUsers();
                const updated = list.filter(u => u.id !== id);
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));
            }
        }
    };

    const registerBusiness = async (data: any) => {
        if (isSupabaseEnabled) {
            let userId = null;
            let signUpDataResult: any = null;
            const userSession = await supabase.auth.getUser();
            if (userSession.data?.user) {
                userId = userSession.data.user.id;
            } else {
                // Sign up the new business user
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: { full_name: data.ownerName },
                        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
                    }
                });
                signUpDataResult = signUpData;
                if (signUpError) return { success: false, error: signUpError.message };
                if (signUpData.user) {
                    userId = signUpData.user.id;
                }
            }

            if (!userId) return { success: false, error: 'Kayıt oluşturulamadı.' };
            
            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                role: 'business',
                business_type: data.businessType,
                business_name: data.businessName,
                business_approved: false,
                kyb_status: 'pending',
                tax_id: data.taxId,
                iban: data.iban,
                address: data.address,
                province: data.province,
                district: data.district,
                business_lat: data.business_lat,
                business_lng: data.business_lng,
                owner_name: data.ownerName,
                phone: data.phone
            });

            if (error) return { success: false, error: error.message };

            const profile = await apiService.getCurrentUser();
            if (profile) {
                setUser({
                    id: profile.id,
                    username: profile.username || profile.name || "user",
                    name: profile.name,
                    display_name: profile.name,
                    email: profile.email || userSession.data?.user?.email || data.email || '',
                    role: profile.role || 'user',
                    avatar: profile.avatar,
                    cover_photo: profile.cover_photo,
                    bio: profile.bio,
                    is_prime: (profile as any).is_prime === true,
                    joinedAt: (profile as any).created_at || new Date().toISOString(),
                    stats: (profile as any).stats || { posts: 0, followers: 0, following: 0 },
                    subscription_status: profile.subscription_status,
                    businessType: (profile as any).businessType,
                    businessName: (profile as any).businessName,
                    businessApproved: (profile as any).businessApproved,
                    kybStatus: (profile as any).kybStatus,
                    taxId: (profile as any).taxId,
                    iban: (profile as any).iban,
                    address: (profile as any).address,
                    ownerName: (profile as any).ownerName,
                    phone: profile.phone,
                    settings: {
                        appearance: (profile as any).settings?.appearance || { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                        privacy: (profile as any).settings?.privacy || { smartShopEnabled: true }
                    }
                });
            }
            return { success: true, sessionActive: !!signUpDataResult?.session || !!userSession.data?.user };
        } else {
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
                    stats: { posts: 0, followers: 0, following: 0 },
                    settings: {
                        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                        privacy: { smartShopEnabled: true }
                    }
                };
                const stored = localStorage.getItem('moffi_mock_users_list');
                let list = stored ? JSON.parse(stored) : [];
                list.push(newUser);
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(list));
                setUser(newUser);
                localStorage.setItem('moffi_mock_user', JSON.stringify(newUser));
            }
            return { success: true, sessionActive: true };
        }
    };

    const approveBusiness = async (id: string) => {
        if (isSupabaseEnabled) {
            const res = await fetch('/api/admin/approve-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                console.error("Error approving business:", data.error);
                return;
            }


            const authChannel = new BroadcastChannel('moffi_auth_channel');
            authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'approved' });
            authChannel.close();
        } else {
            if (typeof window !== 'undefined') {
                const list = await getAllUsers();
                const updated = list.map(u => u.id === id ? { ...u, businessApproved: true, kybStatus: 'approved' as const } : u);
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));

                const authChannel = new BroadcastChannel('moffi_auth_channel');
                authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'approved' });
                authChannel.close();
            }
        }
    };

    const rejectBusiness = async (id: string, reason: string) => {
        if (isSupabaseEnabled) {
            const res = await fetch('/api/admin/reject-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, reason })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                console.error("Error rejecting business:", data.error);
                return;
            }


            const authChannel = new BroadcastChannel('moffi_auth_channel');
            authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'rejected', reason });
            authChannel.close();
        } else {
            if (typeof window !== 'undefined') {
                const list = await getAllUsers();
                const updated = list.map(u => u.id === id ? { ...u, businessApproved: false, kybStatus: 'rejected' as const, kybRejectionReason: reason } : u);
                localStorage.setItem('moffi_mock_users_list', JSON.stringify(updated));

                const authChannel = new BroadcastChannel('moffi_auth_channel');
                authChannel.postMessage({ type: 'KYB_STATUS_UPDATED', userId: id, status: 'rejected', reason });
                authChannel.close();
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signup, logout, resetPasswordWithCode, changePassword, signOutOtherDevices,
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
