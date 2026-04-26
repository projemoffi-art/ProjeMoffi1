"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
    joinedAt: string; // ISO String
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
    businessType?: BusinessType;
    businessId?: string;
    businessName?: string;
    businessApproved?: boolean;
    settings?: {
        appearance: {
            auraStyle: 'minimal' | 'glass' | 'neon' | 'metal';
            accentColor: string;
            font: string;
            auraVisible: boolean;
            auraIntensity: number;
        };
        privacy: {
            profileVisibility: 'public' | 'followers';
            showPets: boolean;
            showPassport: boolean;
            allowComments: boolean;
            locationSharing: boolean;
            messages: boolean;
            aiModeration: boolean;
            marketing: boolean;
            smartShopEnabled: boolean;
            petIdDataSharing: boolean;
        };
        notifications: {
            pushEnabled: boolean;
            systemAlerts: boolean;
            socialActivity: boolean;
            emailNotifications: boolean;
            sosNotifications: boolean;
        };
        sos: {
            radius: number;
            quietHours: { enabled: boolean; from: string; to: string; };
            petTypes: string[];
            emergencyBypass: boolean;
            soundAlerts: boolean;
        };
        ai: {
            personality: 'casual' | 'professional' | 'technical';
            creativity: number; // 0 to 1
            detailLevel: 'short' | 'medium' | 'long';
            autoSuggest: boolean;
            walkAnalysis: boolean;
            photoEnhancer: boolean;
        };
        feed: {
            autoplay: boolean;
            defaultSort: 'new' | 'popular';
        };
        adoption: {
            defaultCategory: string;
        };
        admin?: {
            strictModeration: boolean;
            systemAlerts: boolean;
            refreshInterval: number;
        };
        security: {
            twoFactorEnabled: boolean;
            twoFactorMethod: 'sms' | 'authenticator';
            biometricEnabled: boolean;
        };
        moderation: {
            blockedUsers: Array<{ id: string; username: string; avatar?: string }>;
        };
        content: {
            hiddenWords: string[];
            stories: {
                visibility: 'all' | 'followers' | 'close_friends';
                replies: 'all' | 'followers' | 'none';
            };
        };
        wellbeing: {
            dailyLimit: number;
            quietMode: {
                enabled: boolean;
                from: string;
                to: string;
            };
        };
        accessibility: {
            fontSize: 'medium' | 'large' | 'small';
            colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
        };
        edge: {
            hapticsEnabled: boolean;
            handleOpacity: number;
            glassBlur: number;
            capsulePrivate: boolean;
            activeActions: string[];
        };
    };
    loginActivity?: Array<{
        id: string;
        device: string;
        browser: string;
        city: string;
        country: string;
        lastActive: string;
        isCurrent: boolean;
    }>;
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
    registerBusiness: (data: any) => Promise<{ success: boolean; error?: string }>;
    blockUser: (targetUser: { id: string; username: string; avatar?: string }) => void;
    unblockUser: (userId: string) => void;
    addHiddenWord: (word: string) => void;
    removeHiddenWord: (word: string) => void;
    terminateSession: (sessionId: string) => void;
    terminateAllOtherSessions: () => void;
    changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- STABLE MOCK DATA ---
const MOCK_USER_BASE: User = {
    id: 'user-moffi-official',
    username: 'MoffiOfficial',
    email: 'official@moffi.com',
    role: 'admin',
    avatar: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400",
    bio: "Moffi Dünyasının Resmi Haber ve Destek Merkezi. 🐾 Geleceğin evcil hayvan ekosistemini birlikte inşa ediyoruz.",
    is_prime: true,
    joinedAt: "2024-01-01T00:00:00.000Z", // Stable for hydration
    stats: { posts: 8, followers: 154200, following: 12 },
    settings: {
        appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
        privacy: { 
            profileVisibility: 'public', showPets: true, showPassport: true, 
            allowComments: true, locationSharing: true, messages: true, 
            aiModeration: true, marketing: false, smartShopEnabled: true,
            petIdDataSharing: true
        },
        notifications: { 
            pushEnabled: true, systemAlerts: true, socialActivity: true, 
            emailNotifications: false, sosNotifications: true 
        },
        sos: {
            radius: 5,
            quietHours: { enabled: false, from: '23:00', to: '07:00' },
            petTypes: ['dog', 'cat', 'bird', 'other'],
            emergencyBypass: true,
            soundAlerts: true
        },
        ai: {
            personality: 'casual',
            creativity: 0.7,
            detailLevel: 'medium',
            autoSuggest: true,
            walkAnalysis: true,
            photoEnhancer: true
        },
        feed: {
            autoplay: true,
            defaultSort: 'new'
        },
        adoption: {
            defaultCategory: 'Hepsi'
        },
        wellbeing: {
            dailyLimit: 999,
            quietMode: {
                enabled: false,
                from: '23:00',
                to: '07:00'
            }
        },
        accessibility: {
            fontSize: 'medium',
            colorBlindMode: 'none'
        },
        edge: {
            hapticsEnabled: true,
            handleOpacity: 0.2,
            glassBlur: 80,
            capsulePrivate: false,
            activeActions: ['ai', 'post', 'qr', 'mood', 'steps', 'weather']
        }
    },
    loginActivity: [
        { id: 'sess-1', device: 'Windows PC', browser: 'Chrome', city: 'Istanbul', country: 'TR', lastActive: 'Şu an aktif', isCurrent: true },
        { id: 'sess-2', device: 'iPhone 15 Pro', browser: 'Moffi App', city: 'Ankara', country: 'TR', lastActive: '2 saat önce', isCurrent: false },
        { id: 'sess-3', device: 'iPad Air', browser: 'Safari', city: 'Izmir', country: 'TR', lastActive: 'Dün', isCurrent: false }
    ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initRef = React.useRef(false);

    // --- QUANTUM STABLE INITIALIZATION ---
    useEffect(() => {
        if (initRef.current) return;
        
        const init = () => {
            initRef.current = true;
            const savedUser = localStorage.getItem('moffi_mock_user');
            if (!savedUser) {
                setUser(MOCK_USER_BASE);
                setIsLoading(false);
                return;
            }

            try {
                const parsed = JSON.parse(savedUser);
                
                // MIGRATION: If we are still using old IDs, force reset to MoffiOfficial
                if (parsed.id === 'user-milo' || parsed.id === 'user-1' || !parsed.id.startsWith('user-moffi')) {
                    console.log("Auth: Migrating legacy session to MoffiOfficial...");
                    localStorage.removeItem('moffi_mock_user');
                    setUser(MOCK_USER_BASE);
                    setIsLoading(false);
                    return;
                }

                const merged = {
                    ...MOCK_USER_BASE,
                    ...parsed,
                    role: 'admin', // Force admin for this development stage
                    settings: {
                        ...MOCK_USER_BASE.settings,
                        ...(parsed.settings || {})
                    }
                };
                
                // Deep merge specific categories
                Object.keys(MOCK_USER_BASE.settings).forEach(key => {
                    if (parsed.settings?.[key]) {
                        (merged.settings as any)[key] = {
                            ...(MOCK_USER_BASE.settings as any)[key],
                            ...parsed.settings[key]
                        };
                    }
                });

                setUser({ ...merged, is_prime: true });
            } catch (e) {
                setUser({ ...MOCK_USER_BASE, is_prime: true });
            } finally {
                setIsLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            init();
        }
    }, []);
    const updateSettings = React.useCallback(async (category: string, newSettings: any) => {
        setUser(prev => {
            if (!prev) return prev;
            
            const currentCategorySettings = (prev.settings as any)[category] || {};
            
            // --- LOOP PREVENTION: Shallow Comparison ---
            const isDifferent = Object.keys(newSettings).some(key => 
                JSON.stringify(newSettings[key]) !== JSON.stringify(currentCategorySettings[key])
            );

            if (!isDifferent) return prev; // Return original reference to stop loop

            const updatedUser = {
                ...prev,
                settings: {
                    ...prev.settings,
                    [category]: {
                        ...currentCategorySettings,
                        ...newSettings
                    }
                }
            };

            return updatedUser as any;
        });
    }, []);


    // --- PERSISTENCE EFFECT (Watch for Changes) ---
    useEffect(() => {
        if (!user) return;
        localStorage.setItem('moffi_mock_user', JSON.stringify(user));
    }, [user]); // Record to local storage on change

    const login = React.useCallback(async (email: string, password: string) => {
        const loggedUser = {
            ...MOCK_USER_BASE,
            email: email,
            username: email.split('@')[0]
        };
        setUser(loggedUser);
        return { success: true };
    }, []);

    const signup = React.useCallback(async (name: string, email: string, password: string) => {
        const newUser = {
            ...MOCK_USER_BASE,
            id: `user-${Date.now()}`,
            username: name,
            email: email
        };
        setUser(newUser);
        return { success: true };
    }, []);

    const forgotPassword = React.useCallback(async (email: string) => {
        return { success: true, message: "Mock sıfırlama e-postası (simüle edildi)." };
    }, []);

    const updateProfile = React.useCallback(async (data: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...data } : null);
    }, []);


    const blockUser = (targetUser: { id: string; username: string; avatar?: string }) => {
        if (!user) return;
        const currentBlocked = user.settings?.moderation?.blockedUsers || [];
        if (currentBlocked.some(u => u.id === targetUser.id)) return;
        
        updateSettings('moderation', {
            blockedUsers: [...currentBlocked, targetUser]
        });
    };

    const unblockUser = (userId: string) => {
        if (!user) return;
        const currentBlocked = user.settings?.moderation?.blockedUsers || [];
        updateSettings('moderation', {
            blockedUsers: currentBlocked.filter(u => u.id !== userId)
        });
    };

    const addHiddenWord = (word: string) => {
        if (!user || !word.trim()) return;
        const currentWords = user.settings?.content?.hiddenWords || [];
        const cleanWord = word.trim().toLowerCase();
        if (currentWords.includes(cleanWord)) return;

        updateSettings('content', {
            hiddenWords: [...currentWords, cleanWord]
        });
    };

    const removeHiddenWord = (word: string) => {
        if (!user) return;
        const currentWords = user.settings?.content?.hiddenWords || [];
        updateSettings('content', {
            hiddenWords: currentWords.filter(w => w !== word)
        });
    };


    const terminateSession = React.useCallback((sessionId: string) => {
        setUser(prev => {
            if (!prev || !prev.loginActivity) return prev;
            return { ...prev, loginActivity: prev.loginActivity.filter(s => s.id !== sessionId) };
        });
    }, []);

    const terminateAllOtherSessions = React.useCallback(() => {
        setUser(prev => {
            if (!prev || !prev.loginActivity) return prev;
            const currentSession = prev.loginActivity.find(s => s.isCurrent);
            return { ...prev, loginActivity: currentSession ? [currentSession] : [] };
        });
    }, []);

    const changePassword = React.useCallback(async (oldPass: string, newPass: string) => {
        await new Promise(r => setTimeout(r, 1000));
        return { success: true };
    }, []);

    const logout = React.useCallback(() => {
        setUser(null);
        localStorage.removeItem('moffi_mock_user');
    }, []);

    const registerBusiness = React.useCallback(async (data: any) => ({ success: true }), []);

    const authValue = React.useMemo(() => ({
        user, isLoading, login, signup, logout,
        updateProfile, updateSettings, forgotPassword, registerBusiness,
        blockUser, unblockUser, addHiddenWord, removeHiddenWord,
        terminateSession, terminateAllOtherSessions, changePassword
    }), [
        user, isLoading, login, signup, logout,
        updateProfile, updateSettings, forgotPassword, registerBusiness,
        blockUser, unblockUser, addHiddenWord, removeHiddenWord,
        terminateSession, terminateAllOtherSessions, changePassword
    ]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
