"use client";

// Oturum ve kullanıcı profili (tek kaynak: Supabase Auth + profiles). (2026-10-03: tarayıcı deposundaki sahte kullanıcı
// listesiyle çalışan "mock" giriş yolları, geliştirmede admin@moffipet.com'a kendiliğinden yönetici yetkisi veren kısayol ve
// örnek kullanıcılar kaldırıldı.)

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { EmailOtpType, Session, Subscription } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { apiService } from "@/services/apiService";
import type { ProfileUpdate, UserProfile } from "@/services/types";

export type UserRole = 'user' | 'business' | 'admin';
export type BusinessType = 'petshop' | 'vet' | 'grooming' | 'trainer' | 'shelter';

/** Bir ayar kategorisi (profiles.settings içinde). */
export type SettingsCategory = Record<string, unknown>;

// Uygulamanın tanıdığı kategoriler (tip alias'ı: SettingsCategory'ye atanabilir). Bilinmeyen kategoriler serbest alanlıdır.
export type AppearanceSettings = {
    theme?: 'light' | 'dark' | 'system'; font?: string;
    /** Profil fotoğrafı çerçevesi (lib/vipFrames). */
    frameStyle?: string;
};
export type AccessibilitySettings = {
    fontSize?: 'small' | 'medium' | 'large'; colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    boldText?: boolean; highContrast?: boolean; reduceMotion?: boolean; reduceTransparency?: boolean; seniorMode?: boolean;
};
export type WellbeingSettings = {
    dailyLimit?: number; quietMode?: { enabled: boolean; from: string; to: string };
};

/** Kullanıcı ayarları: kategori adı → alanlar (görünüm, gizlilik, kenar paneli, yapay zekâ, bildirim, erişilebilirlik…). */
export type UserSettings = {
    appearance?: AppearanceSettings;
    accessibility?: AccessibilitySettings;
    wellbeing?: WellbeingSettings;
    [category: string]: SettingsCategory | undefined;
};

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
    settings?: UserSettings;
    kybStatus?: 'pending' | 'approved' | 'rejected';
    kybRejectionReason?: string;
    taxId?: string;
    iban?: string;
    address?: string;
    ownerName?: string;
    phone?: string;
    /** Gönderilerin varsayılan yorum ayarları (profiles sütunları; sunucu yorum eklerken uygular, 8.49). */
    commentDefaults?: { allowComments: boolean; privacy: string; filterWords: string[] };
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
    logout: () => Promise<void>;
    updateProfile: (data: ProfileUpdate) => Promise<void>;
    updateSettings: (category: string, data: SettingsCategory) => Promise<void>;
    verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email') => Promise<{ success: boolean; error?: string }>;
    resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
    appearance: {},
};

const ROLES: UserRole[] = ['user', 'business', 'admin'];
const asRole = (v: string | null | undefined): UserRole => (ROLES.includes(v as UserRole) ? (v as UserRole) : 'user');
const asSettings = (v: unknown): UserSettings => (v && typeof v === 'object' && !Array.isArray(v) ? (v as UserSettings) : {});
const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Profil kaydı + oturum e-postası → uygulamadaki kullanıcı. */
function toUser(profile: UserProfile, email: string): User {
    const settings = asSettings(profile.settings);
    return {
        id: profile.id,
        username: profile.username || email.split('@')[0] || 'user',
        name: profile.name || profile.username || 'Moffi User',
        display_name: profile.name || profile.username || 'Moffi User',
        email,
        role: asRole(profile.role),
        avatar: profile.avatar,
        cover_photo: profile.cover_photo,
        bio: profile.bio ?? undefined,
        is_prime: profile.is_prime,
        joinedAt: profile.created_at || new Date().toISOString(),
        stats: { posts: 0, followers: profile.stats.followers, following: profile.stats.following },
        businessType: (profile.businessType ?? undefined) as BusinessType | undefined,
        businessName: profile.businessName ?? undefined,
        businessApproved: profile.businessApproved ?? undefined,
        kybStatus: (profile.kybStatus ?? undefined) as User['kybStatus'],
        taxId: profile.taxId ?? undefined,
        iban: profile.iban ?? undefined,
        address: profile.address ?? undefined,
        ownerName: profile.ownerName ?? undefined,
        phone: profile.phone ?? undefined,
        commentDefaults: {
            allowComments: profile.default_allow_comments,
            privacy: profile.default_comment_privacy,
            filterWords: profile.comment_filter_words,
        },
        // Kayıtlı TÜM ayar kategorileri korunur (kenar paneli, yapay zekâ, bildirim, erişilebilirlik…).
        // Eskiden yalnızca appearance/privacy alınıyordu; sonraki updateSettings kalanları veritabanından siliyordu.
        settings: {
            ...settings,
            appearance: settings.appearance || DEFAULT_SETTINGS.appearance,
        },
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const userRef = useRef<User | null>(null);
    const settingsWriteChain = useRef<Promise<void>>(Promise.resolve());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Rol, ara katmanda (middleware) her istekte Supabase oturumundan ve profiles.role'den okunur.
    // Ayrı bir imzalı rol çerezi tutulmaz (eskiden vardı; imza anahtarı tanımsızken taklit edilebiliyordu).

    // --- BAŞLANGIÇ ---
    useEffect(() => {
        let isMounted = true;
        let authListener: Subscription | null = null;

        // Profil, oturumdaki kullanıcı kimliğiyle okunur (hesap değiştirirken eski oturumun önbelleği kullanılmaz).
        const syncProfile = async (session: Session) => {
            const authUser = session.user;
            const email = authUser.email || '';
            try {
                const profile = await apiService.getUserProfile(authUser.id);
                if (!isMounted) return;
                if (profile) {
                    setUser(toUser(profile, email));
                } else {
                    // Profil satırı yoksa (ilk giriş) oluşturulur.
                    const created = await apiService.updateProfile({
                        name: (authUser.user_metadata?.full_name as string | undefined) || email.split('@')[0] || 'Moffi User',
                        username: email.split('@')[0] || 'user',
                    });
                    if (isMounted) setUser(toUser(created, email));
                }
            } catch (err) {
                console.error('[Auth] Profile sync failed:', errorMessage(err));
                // Profil okunamazsa oturum bilgisiyle devam edilir (kullanıcı kilitlenmesin).
                if (isMounted) {
                    const name = (authUser.user_metadata?.full_name as string | undefined) || email.split('@')[0] || 'Moffi User';
                    setUser({
                        id: authUser.id,
                        username: email.split('@')[0] || 'user',
                        name,
                        display_name: name,
                        email,
                        role: 'user',
                        avatar: authUser.user_metadata?.avatar_url as string | undefined,
                        joinedAt: new Date().toISOString(),
                        stats: { posts: 0, followers: 0, following: 0 },
                        settings: DEFAULT_SETTINGS,
                    });
                }
            }
        };

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    if (session?.user) await syncProfile(session);
                    else setUser(null);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("[Auth] Initial session check failed:", err);
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
            }

            if (isMounted) {
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (!isMounted) return;
                    if (event === 'SIGNED_OUT') {
                        setUser(null);
                    } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
                        await syncProfile(session);
                    }
                });
                authListener = subscription;
            }
        };

        initializeAuth();
        return () => {
            isMounted = false;
            authListener?.unsubscribe();
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Doğrulanmamış hesap: şifre doğru ama e-posta kodu girilmemiş → yeni kod gönderip kod ekranına geç
            if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
                await supabase.auth.resend({ type: 'signup', email });
                return { success: false, needsVerification: true };
            }
            return { success: false, error: error.message };
        }
        return { success: true };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    }, []);

    const signInWithApple = useCallback(async () => {
        await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string, marketingConsent: boolean = false) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name, marketing_consent: marketingConsent },
                emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
            },
        });
        if (error) return { success: false, error: error.message };
        // Doğrulama açıkken kayıtlı bir adres için Supabase hata yerine kimliksiz kullanıcı döner
        if (data.user && data.user.identities?.length === 0) return { success: false, error: 'User already registered' };
        // Oturum yoksa e-posta doğrulaması açık: kod gönderildi
        return { success: true, needsVerification: !data.session };
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut({ scope: 'local' });
        // Uygulamanın ve Supabase'in tarayıcıdaki anahtarları temizlenir (sonraki girişte eski oturum karışmasın).
        if (typeof window !== 'undefined') {
            Object.keys(localStorage)
                .filter(k => k.startsWith('moffi_') || k.startsWith('sb-') || k.includes('supabase'))
                .forEach(k => localStorage.removeItem(k));
        }
        setUser(null);
    }, []);

    // Eskiden yalnızca ad/kullanıcı adı/fotoğraf/biyografi iletiliyordu: profil düzenlemedeki telefon ve yorum ayarları hiç kaydedilmiyordu.
    const updateProfile = useCallback(async (data: ProfileUpdate) => {
        const profile = await apiService.updateProfile(data);
        setUser(prev => (prev ? { ...toUser(profile, prev.email), settings: prev.settings } : prev));
    }, []);

    const updateSettings = useCallback(async (category: string, data: SettingsCategory) => {
        const currentUser = userRef.current;
        if (!currentUser) return;
        const updatedUser: User = {
            ...currentUser,
            settings: { ...currentUser.settings, [category]: { ...currentUser.settings?.[category], ...data } },
        };
        // State ve ref anında güncellenir ki art arda çağrılar birbirini ezmesin
        setUser(updatedUser);
        userRef.current = updatedUser;

        // Veritabanındaki güncel ayarların üstüne yalnızca bu kategori birleştirilir: ekrandaki kopya eksik
        // olsa bile (ör. profil yüklenemeyip varsayılanla açılmışsa) diğer kategoriler silinmez.
        // Art arda gelen kayıtlar sıraya alınır; biri diğerinin değişikliğini ezmez.
        const userId = currentUser.id;
        settingsWriteChain.current = settingsWriteChain.current.then(async () => {
            try {
                const { data: row, error: readError } = await supabase.from('profiles').select('settings').eq('id', userId).single();
                if (readError) throw readError;
                const base = asSettings(row?.settings);
                const merged = { ...base, [category]: { ...(base[category] || {}), ...data } };
                const { error } = await supabase.from('profiles').update({ settings: merged }).eq('id', userId);
                if (error) console.error("Ayarlar kaydedilemedi:", error);
            } catch (err) {
                console.error("Ayarlar kaydedilemedi:", err);
            }
        });
        await settingsWriteChain.current;
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?type=recovery`,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, message: "Sıfırlama e-postası gönderildi." };
    }, []);

    // Sıfırlama e-postasındaki kod doğrulanınca oturum açılır, ardından yeni şifre kaydedilir.
    const resetPasswordWithCode = useCallback(async (email: string, code: string, newPassword: string) => {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
        if (error) return { success: false, error: error.message };
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) return { success: false, error: updateError.message };
        return { success: true };
    }, []);

    // Mevcut şifre yeniden doğrulanmadan şifre değiştirilmez (açık kalmış bir oturumu ele geçiren şifreyi değiştiremesin)
    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
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
    }, []);

    const signOutOtherDevices = useCallback(async () => {
        const { error } = await supabase.auth.signOut({ scope: 'others' });
        return error ? { success: false, error: error.message } : { success: true };
    }, []);

    const resendOtp = useCallback(async (email: string) => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback` },
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, error: errorMessage(err) };
        }
    }, []);

    const verifyOtp = useCallback(async (email: string, token: string, type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email') => {
        const otpType: EmailOtpType = type === 'signup' ? 'email' : type;
        const { error } = await supabase.auth.verifyOtp({ email, token, type: otpType });
        if (error) return { success: false, error: error.message };
        return { success: true };
    }, []);

    /** Yönetici panosu: profiller (e-posta profiles'ta yok; yönetici e-postayı admin_user_emails ile okur). */
    const getAllUsers = useCallback(async (): Promise<User[]> => {
        const { data, error } = await supabase.from('profiles').select('id, username, full_name, role, avatar_url, bio, created_at');
        if (error) {
            console.error("Error fetching users from database:", error);
            return [];
        }
        return (data || []).map(profile => ({
            id: profile.id,
            username: profile.username || profile.full_name || 'user',
            name: profile.full_name || undefined,
            email: '',
            role: asRole(profile.role),
            avatar: profile.avatar_url || undefined,
            bio: profile.bio || undefined,
            joinedAt: profile.created_at || new Date().toISOString(),
            stats: { posts: 0, followers: 0, following: 0 },
        }));
    }, []);

    return (
        <AuthContext.Provider value={{
            user, isLoading, login, signup, logout, resetPasswordWithCode, changePassword, signOutOtherDevices,
            updateProfile, updateSettings, forgotPassword, verifyOtp, resendOtp,
            signInWithGoogle, signInWithApple, getAllUsers,
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
