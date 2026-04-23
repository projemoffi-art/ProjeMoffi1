"use client";

import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useMotionValue } from 'framer-motion';
import {
    Heart, MessageCircle, Share2, MapPin,
    Flame, Bone, Plus, Camera, Compass,
    Users, Activity, Sparkles, X, Send, PawPrint, Search, Menu, MoreHorizontal, Image as ImageIcon, Video, Mic,
    Settings, Grid3X3, List, Edit3, Bookmark, Edit2, Trash2,
    LogOut, ChevronRight, ChevronLeft, User, Bell, Lock, HelpCircle, Check, HeartHandshake, CheckCheck, ShieldAlert, ChevronDown,
    AlertTriangle, PhoneCall, BadgeCheck, Radar, Palette, ShoppingBag, Gamepad2, Stethoscope, Globe,
    Coins, Package, Calendar, Plane, ShieldCheck, Route, TrendingUp, Timer, Footprints, Play, Download, Clock, Syringe, Moon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '../../components/auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import { useStories } from '../../hooks/useStories';
import { useTheme } from '../../context/ThemeContext';
import { PetSettingsModal } from '../../components/profile/PetSettingsModal';
import { SOSCommandCenter } from '../../components/profile/SOSCommandCenter';
import { QRCodeSVG } from 'qrcode.react';
import { InboxModal } from '../../components/community/InboxModal';

import { ShareSheet } from '../../components/community/ShareSheet';
import { NotificationsDrawer } from '../../components/community/NotificationsDrawer';
import { MoffiAssistant } from '../../components/ai/MoffiAssistant';
import { ImmersivePostCard } from '../../components/community/ImmersivePostCard';
import { ProfileTab } from '@/components/community/ProfileTab';
import { VetQuickSheet } from '@/components/vet/VetQuickSheet';
import { WalkQuickSheet } from '@/components/walk/WalkQuickSheet';
import { MarketQuickSheet } from '@/components/shop/MarketQuickSheet';
import { StudioQuickSheet } from '@/components/studio/StudioQuickSheet';
import { GameQuickSheet } from '@/components/game/GameQuickSheet';
import { PetSwitcher } from '@/components/common/PetSwitcher';
import { usePet } from '@/context/PetContext';
import { useWellbeing } from '@/context/WellbeingContext';
import { EcosystemPortal } from '@/components/community/EcosystemPortal';
import { SpotlightSearch } from '@/components/community/SpotlightSearch';
import { apiService } from '../../services/apiService';

import { 
    MOCK_PETS, MOCK_ADOPTIONS, 
    MOCK_NOTIFICATIONS, ORDERS, APPOINTMENTS 
} from '@/lib/mockData';
import Image from 'next/image';
import { HubOverlay } from '../../components/community/HubOverlay';

export default function MoffiSocialMasterpiece() {
    const { user, logout, updateProfile, updateSettings, showAIAssistant, setShowAIAssistant } = useAuth();
    const { theme, setTheme } = useTheme(); // Restored
    const { storyGroups, uploadStory } = useStories(); // Restored
    const { pets: userPets, activePet, switchPet, updatePet } = usePet();
    const { isQuietModeActive } = useWellbeing();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('feed'); 
    const [radarTabMode, setRadarTabMode] = useState<'lost' | 'adopt'>('lost');
    const [posts, setPosts] = useState<any[]>(MOCK_PETS);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

    const userPosts = useMemo(() => {
        return posts.filter(p => p.author === `@${user?.username || 'moffi_user'}` || p.user_id === user?.id);
    }, [posts, user]);
    
    // Check if any owned pet is in SOS mode AND header alert is enabled
    const isAnyPetLost = useMemo(() => userPets.some((p: any) => p.is_lost && (p.sos_settings?.header_sos_alert_enabled !== false)), [userPets]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isLoadingLost, setIsLoadingLost] = useState(false);
    const [isLoadingAdoptions, setIsLoadingAdoptions] = useState(false);
    
    // ACTION HUB STATE (LIFTED FROM PROFILETAB)
    const [isAuraVisible, setIsAuraVisible] = useState(true);
    const [isAuraStudioOpen, setIsAuraStudioOpen] = useState(false);
    const [auraSettings, setAuraSettings] = useState({
        fontFamily: 'font-sans',
        frameStyle: 'minimal' as 'minimal' | 'glass' | 'neon' | 'metal',
        accentColor: 'default',
        badges: ['verified']
    });

    // Load initial Aura settings from user profile - STABLE JSON DEPS
    useEffect(() => {
        if (user?.aura_settings) {
            setAuraSettings(user.aura_settings);
        }
    }, [user?.id, JSON.stringify(user?.aura_settings)]);

    const handleUpdateAuraSettings = async (newSettings: any) => {
        setAuraSettings(newSettings);
        try {
            await apiService.updateAuraSettings(newSettings);
            
            // Sync with global appearance settings for the background engine
            updateSettings('appearance', {
                auraStyle: newSettings.frameStyle,
                accentColor: newSettings.accentColor,
                font: newSettings.fontFamily
            });
            
            console.log("Aura settings persisted and synced successfully");
        } catch (err) {
            console.error("Failed to persist aura settings:", err);
        }
    };
    const [profileSubView, setProfileSubView] = useState<'main' | 'family' | 'passport' | 'orders' | 'wallet' | 'appointments' | 'routes' | 'impact' | 'bookmarks'>('main');
    
    // Global Navigation & Hub Controller (Restored)
    useEffect(() => {
        const handleNavigate = (e: any) => {
            const id = e.detail;
            const profileViews = ['wallet', 'passport', 'family', 'orders', 'appointments', 'routes', 'bookmarks'];
            
            if (profileViews.includes(id)) {
                setActiveTab('profile');
                setProfileSubView(id as any);
            } else if (id === 'settings') {
                window.dispatchEvent(new CustomEvent('open-moffi-settings'));
            } else if (id === 'feed' || id === 'radar') {
                setActiveTab(id);
            }
        };

        window.addEventListener('moffi-navigate', handleNavigate);
        return () => window.removeEventListener('moffi-navigate', handleNavigate);
    }, []);

    // Unified Header Scroll Logic (Works for all tabs)
    const globalScrollRef = useRef<HTMLDivElement>(null);
    const scrollY = useMotionValue(0); // Manual scroll tracking to fix hydration error
    
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    const lastInboxScroll = useRef(0);
    
    // Unified Scroll Handler (Main Container)
    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const current = e.currentTarget.scrollTop;
        scrollY.set(current); // Synchronize motion value for header animations
        
        // Navigation Hide/Show Logic
        if (current > lastScrollY.current && current > 150) {
            setIsNavVisible(false);
        } else if (current < lastScrollY.current - 10 || current < 80) {
            setIsNavVisible(true);
        }
        lastScrollY.current = current;
    };

    // Sub-Panel Scroll Handler (Messaging/SOS Alerts)
    const handleInboxScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const current = e.currentTarget.scrollTop;
        if (current > lastInboxScroll.current && current > 100) {
            setIsNavVisible(false);
        } else {
            setIsNavVisible(true);
        }
        lastInboxScroll.current = current;
    };



    // NOTIFICATIONS & SHARE SHEET
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

    // SOS Alerts state for the Inbox/SOS Tab
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([
                fetchPosts(),
                fetchLostPets(),
                fetchAdoptionAds(),
                fetchNotifications(),
                fetchConversations() // Load chat list
            ]);
        };
        loadInitialData();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await apiService.getInboxMessages();
            setNotificationsList(data);
            setUnreadInboxCount(data.filter((n: any) => !n.read).length);
        } catch (err) {
            console.error("Bildirimler çekilirken hata:", err);
        }
    };

    // REAL-TIME MESH CONTROL (MOCK MODE: Supabase subscriptions removed)
    useEffect(() => {
        if (!user) return;
        
        // In mock mode, we use local state or periodic polling if needed.
        // For now, initial load covers the needs.
        
    }, [user, activeChatUserId, userPets, activeTab]);

    const fetchConversations = async () => {
        try {
            const data = await apiService.getChatConversations();
            setInboxMessages(data);
        } catch (err) {
            console.error("Konuşmalar çekilirken hata:", err);
        }
    };

    const fetchMessagesForActiveChat = async (userId: string) => {
        // Find conversation ID between current user and userId
        const conv = inboxMessages.find(m => m.userId === userId);
        if (!conv) return;

        try {
            const data = await apiService.getChatMessages(conv.id);
            // We'll update the 'messages' array within that conversation in inboxMessages
            setInboxMessages(prev => prev.map(c => 
                c.id === conv.id ? { ...c, messages: data } : c
            ));
        } catch (err) {
            console.error("Mesajlar çekilirken hata:", err);
        }
    };

    useEffect(() => {
        if (activeChatUserId) {
            fetchMessagesForActiveChat(activeChatUserId);
            // Mark as read
            const conv = inboxMessages.find(m => m.userId === activeChatUserId);
            if (conv) apiService.markChatAsRead(conv.id);
        }
    }, [activeChatUserId]);

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !activeChatUserId) return;
        setIsReplying(true);
        try {
            await apiService.sendChatMessage(activeChatUserId, replyMessage);
            setReplyMessage('');
            await fetchMessagesForActiveChat(activeChatUserId);
            await fetchConversations();
            scrollToBottom();
        } catch (err) {
            console.error("Mesaj gönderme hatası:", err);
            showToast("Hata", "Mesaj gönderilemedi.", "error");
        } finally {
            setIsReplying(false);
        }
    };

    // HANDLE DEEP LINKING TO CHAT
    useEffect(() => {
        const chatWithId = searchParams.get('chat');
        if (chatWithId) {
            setActiveChatUserId(chatWithId);
            setInboxTab('chats');
            setIsInboxOpen(true);
            
            // Optionally clear the param so it doesn't reopen on every mount?
            // Actually, keep it for now as it's standard deep link behavior.
        }
    }, [searchParams]);


    const fetchPosts = async () => {
        setIsLoadingPosts(true);
        try {
            const data = await apiService.getFeedContent();
            
            // 1. Filter out Blocked Users
            const blockedIds = (user?.settings?.moderation?.blockedUsers || []).map((u: any) => u.id);
            const filteredData = data.filter((post: any) => {
                const authorId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
                return !blockedIds.includes(authorId);
            });

            // 2. Apply initial sorting
            const sortType = user?.settings?.feed?.defaultSort || 'new';
            const sortedData = sortPostsLocally(filteredData, sortType);
            
            setPosts(sortedData);
        } catch (err) {
            console.error("Gönderiler çekilirken hata:", err);
            setPosts(MOCK_PETS);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const sortPostsLocally = (data: any[], sortType: string) => {
        const sorted = [...data];
        if (sortType === 'popular') {
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
            // Newest first: Sort by ID descending (Date.now proxy) or index
            return sorted.sort((a, b) => {
                const idA = typeof a.id === 'string' ? (parseInt(a.id.split('-').pop() || '0') || 0) : a.id;
                const idB = typeof b.id === 'string' ? (parseInt(b.id.split('-').pop() || '0') || 0) : b.id;
                return idB - idA;
            });
        }
    };

    // Reactive Re-sorting when preference changes
    useEffect(() => {
        if (posts.length > 0) {
            const sortType = user?.settings?.feed?.defaultSort || 'new';
            const sorted = sortPostsLocally(posts, sortType);
            
            // Only update if order actually changed to avoid infinite loop
            const orderChanged = sorted.some((p, i) => p.id !== posts[i].id);
            if (orderChanged) {
                setPosts(sorted);
                
                // Pure Apple UX: Scroll to top when sorting changes
                if (globalScrollRef.current) {
                    globalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        }
    }, [user?.settings?.feed?.defaultSort]);


    const fetchAdoptionAds = async () => {
        setIsLoadingAdoptions(true);
        try {
            const data = await apiService.getAdoptions();
            setAdoptionAds(data);
        } catch (err) {
            console.error("Sahiplendirme ilanları çekilirken hata:", err);
            setAdoptionAds(MOCK_ADOPTIONS);
        } finally {
            setIsLoadingAdoptions(false);
        }
    };


    const [profileViewMode, setProfileViewMode] = useState('grid'); // grid, list, saved
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // EDIT PROFILE STATES
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // ADD PET STATES
    const [isAddPetOpen, setIsAddPetOpen] = useState(false);
    const [addPetStep, setAddPetStep] = useState(1);
    const [newPetName, setNewPetName] = useState("");
    const [newPetType, setNewPetType] = useState("🐶");
    const [newPetBreed, setNewPetBreed] = useState("");
    const [newPetAge, setNewPetAge] = useState("");
    const [newPetGender, setNewPetGender] = useState("Erkek");
    const [newPetNeutered, setNewPetNeutered] = useState("Evet");
    const [newPetSize, setNewPetSize] = useState("Orta");
    const [newPetFeatures, setNewPetFeatures] = useState("");
    const [newPetHealth, setNewPetHealth] = useState("");
    const [newPetCharacter, setNewPetCharacter] = useState("");
    const [newPetMicrochip, setNewPetMicrochip] = useState("");
    const [newPetShowPhone, setNewPetShowPhone] = useState(true);

    const [newPetPhotos, setNewPetPhotos] = useState<{ file: File, preview: string }[]>([]);
    const [isSavingPet, setIsSavingPet] = useState(false);

    // QR PET ID STATES
    const [qrModalPet, setQrModalPet] = useState<{ name: string, id: string, avatar: string } | null>(null);
    const [isFullScreenQR, setIsFullScreenQR] = useState(false);

    // PET SETTINGS STATE
    const [isPetSettingsOpen, setIsPetSettingsOpen] = useState(false);
    const [settingsPet, setSettingsPet] = useState<any>(null);
    const [isSOSCommandCenterOpen, setIsSOSCommandCenterOpen] = useState(false);
    const [sosActivePet, setSosActivePet] = useState<any>(null);
    const [isSosFromHub, setIsSosFromHub] = useState(false);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // LOST AD STATES
    const [isLostAdModalOpen, setIsLostAdModalOpen] = useState(false);
    const [selectedLostPet, setSelectedLostPet] = useState<any | null>(null);
    const [lostPetName, setLostPetName] = useState("");
    const [lostPetBreed, setLostPetBreed] = useState("");
    const [lostPetLocation, setLostPetLocation] = useState("");
    const [lostPetDesc, setLostPetDesc] = useState("");
    const [lostPetPhotos, setLostPetPhotos] = useState<{ file: File, preview: string }[]>([]);
    const [isSubmittingSOS, setIsSubmittingSOS] = useState(false);
    const [isReportingLocation, setIsReportingLocation] = useState(false);
    const [lostPets, setLostPets] = useState<any[]>([]);

    // ADOPTION MODAL (APPLE BOTTOM SHEET) STATE
    const [selectedAdoptionPet, setSelectedAdoptionPet] = useState<any | null>(null);
    const [isAddAdoptionModalOpen, setIsAddAdoptionModalOpen] = useState(false);
    const [adoptionAds, setAdoptionAds] = useState<any[]>([]);
    const [selectedAdoptionCategory, setSelectedAdoptionCategory] = useState("Hepsi");

    // Sync Adoption Radar Category with User Preference
    useEffect(() => {
        if (user?.settings?.adoption?.defaultCategory) {
            setSelectedAdoptionCategory(user.settings.adoption.defaultCategory);
        }
    }, [user?.settings?.adoption?.defaultCategory]);

    // NEW ADOPTION FORM STATES
    const [adoptionPetName, setAdoptionPetName] = useState("");
    const [adoptionPetBreed, setAdoptionPetBreed] = useState("");
    const [adoptionPetAge, setAdoptionPetAge] = useState("");
    const [adoptionPetDesc, setAdoptionPetDesc] = useState("");
    const [adoptionPetPhotos, setAdoptionPetPhotos] = useState<{ file: File, preview: string }[]>([]);
    const [adoptionPetType, setAdoptionPetType] = useState("cat");
    const [isSubmittingAdoption, setIsSubmittingAdoption] = useState(false);


    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [inboxTab, setInboxTab] = useState<'chats' | 'sos'>('chats');

    // Premium Header Transformations (Apple-Style) - Defined after activeTab
    // Reactive MotionValues for Search State
    const headerHeight = useMemo(() => {
        const baseStart = 120;
        const baseEnd = 64;
        const extra = isSearchOpen ? 100 : 0;
        return [baseStart + extra, baseEnd + extra];
    }, [isSearchOpen]);

    const headerHeightTransform = useTransform(scrollY, [0, 80], headerHeight);
    
    const headerPadding = useTransform(scrollY, [0, 80], [
        isSearchOpen ? "32px 24px 16px" : "48px 24px 16px", 
        "8px 24px 8px"
    ]);
    const logoScale = useTransform(scrollY, [0, 80], [1, 0.8]);
    const headerBgOpacity = useTransform(scrollY, [0, 60], [0, 0.95]);
    const headerBlur = useTransform(scrollY, [0, 60], [0, 50]);
    const headerBorderOpacity = useTransform(scrollY, [0, 60], [0, 0.15]);
    const logoY = useTransform(scrollY, [0, 80], [0, -4]); 
    const iconScale = useTransform(scrollY, [0, 80], [1, 0.9]);

    // Reset scroll when switching tabs for a fresh start
    useEffect(() => {
        if (globalScrollRef.current) {
            globalScrollRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    // ADOPTION APPLICATION STATES
    const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
    const [appExperience, setAppExperience] = useState('0-2 Yıl');
    const [appHomeType, setAppHomeType] = useState('Apartman');
    const [appNote, setAppNote] = useState('');
    const [isSubmittingApp, setIsSubmittingApp] = useState(false);

    // ADOPTION CHAT STATES
    const [isAdoptionChatOpen, setIsAdoptionChatOpen] = useState(false);
    const [adoptionChatPet, setAdoptionChatPet] = useState<any | null>(null);
    const [adoptionMessages, setAdoptionMessages] = useState<any[]>([]);
    const [adoptionNewMsg, setAdoptionNewMsg] = useState("");
    const [isSendingAdoptionMsg, setIsSendingAdoptionMsg] = useState(false);

    const sosInputRef = useRef<HTMLInputElement>(null);
    const adoptionPhotoRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // SECURE ANON COMMUNICATION STATES
    const [anonModalType, setAnonModalType] = useState<'report' | 'message' | null>(null);
    const [isHubOpen, setIsHubOpen] = useState(false);
    const [anonMessage, setAnonMessage] = useState("");
    const [anonError, setAnonError] = useState<string | null>(null);
    const [isSubmittingAnon, setIsSubmittingAnon] = useState(false);
    const [isHubLongPressing, setIsHubLongPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // INBOX & SOS DATA STATES (Consolidated at top level)
    const [activeTimePicker, setActiveTimePicker] = useState<'from' | 'to' | null>(null);

    // TIME WHEEL HELPER COMPONENT
    const TimeWheel = ({ value, onChange, max, label }: { value: number, onChange: (v: number) => void, max: number, label: string }) => {
        const numbers = Array.from({ length: max + 1 }, (_, i) => i);
        return (
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white/20 mb-2 uppercase tracking-widest">{label}</span>
                <div className="h-32 w-16 overflow-y-auto no-scrollbar snap-y snap-mandatory relative outline-none py-12">
                    {/* Top Fade */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[var(--card-bg)] to-transparent z-10 pointer-events-none" />
                    
                    {numbers.map(n => (
                        <div 
                            key={n} 
                            onClick={() => onChange(n)}
                            className={cn(
                                "h-8 flex items-center justify-center snap-center transition-all duration-200 cursor-pointer shrink-0",
                                value === n ? "text-cyan-400 font-black text-xl scale-110" : "text-white/20 text-sm font-bold opacity-40 hover:opacity-100"
                            )}
                        >
                            {n.toString().padStart(2, '0')}
                        </div>
                    ))}

                    {/* Bottom Fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--card-bg)] to-transparent z-10 pointer-events-none" />
                </div>
            </div>
        );
    };
    const [unreadInboxCount, setUnreadInboxCount] = useState(0);
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isVetQuickSheetOpen, setIsVetQuickSheetOpen] = useState(false);
    const [isWalkQuickSheetOpen, setIsWalkQuickSheetOpen] = useState(false);
    const [isMarketQuickSheetOpen, setIsMarketQuickSheetOpen] = useState(false);
    const [isStudioQuickSheetOpen, setIsStudioQuickSheetOpen] = useState(false);
    const [isGameQuickSheetOpen, setIsGameQuickSheetOpen] = useState(false);
    const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isInboxOpen) {
            scrollToBottom();
        }
    }, [isInboxOpen, inboxMessages]);

    // TOAST NOTIFICATIONS
    const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = (title: string, desc?: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage({ title, desc, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    // SETTINGS / KVKK STATES
    const [isSOSOpen, setIsSOSOpen] = useState(false);




    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadImageURL, setUploadImageURL] = useState<string | null>(null);
    const [uploadCaption, setUploadCaption] = useState('');
    const [uploadLocationEnabled, setUploadLocationEnabled] = useState(false);
    const [uploadMood, setUploadMood] = useState<string | null>(null);

    const MOOD_OPTIONS = ["Mutlu ✨", "Uykulu 💤", "Enerjik ⚡", "Sabırsız 🥶", "Oyunbaz 🎾", "Acıkmış 🦴", "Havalı 😎"];

    // STORY VIEWER STATES
    const [viewerStoryGroupIndex, setViewerStoryGroupIndex] = useState<number | null>(null);
    const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
    const [storyProgress, setStoryProgress] = useState(0);

    const closeStoryViewer = () => {
        setViewerStoryGroupIndex(null);
        setViewerStoryIndex(0);
        setStoryProgress(0);
    };

    const nextStory = () => {
        setStoryProgress(0);
        if (viewerStoryGroupIndex === null) return;
        const group = storyGroups[viewerStoryGroupIndex];
        if (viewerStoryIndex < group.stories.length - 1) {
            setViewerStoryIndex(prev => prev + 1);
        } else if (viewerStoryGroupIndex < storyGroups.length - 1) {
            setViewerStoryGroupIndex(prev => prev! + 1);
            setViewerStoryIndex(0);
        } else {
            closeStoryViewer();
        }
    };

    const prevStory = () => {
        setStoryProgress(0);
        if (viewerStoryGroupIndex === null) return;
        if (viewerStoryIndex > 0) {
            setViewerStoryIndex(prev => prev - 1);
        } else if (viewerStoryGroupIndex > 0) {
            setViewerStoryGroupIndex(prev => prev! - 1);
            setViewerStoryIndex(storyGroups[viewerStoryGroupIndex - 1].stories.length - 1);
        } else {
            closeStoryViewer();
        }
    };

    useEffect(() => {
        if (viewerStoryGroupIndex === null) return;

        // Reset progress directly to 0 (no transition)
        setStoryProgress(0);

        // Wait a tiny bit (next frame) then trigger the CSS transition to 100%
        const animationTimer = setTimeout(() => {
            setStoryProgress(100);
        }, 50);

        // When the 5-second transition finishes, flip to the next story
        const autoAdvanceTimer = setTimeout(() => {
            nextStory();
        }, 5050); // 50ms delay + 5000ms transition

        return () => {
            clearTimeout(animationTimer);
            clearTimeout(autoAdvanceTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewerStoryGroupIndex, viewerStoryIndex]);

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "Şimdi";
        const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}d`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}s`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}g`;
    };

    const cameraInputRef = useRef<HTMLInputElement>(null);

    const toggleLike = async (id: string) => {
        try {
            await apiService.reactToPost(id, '❤️');
            fetchPosts(); // Refresh to see updated counts/state
        } catch (err) {
            console.error("Beğeni hatası:", err);
        }
    };

    const addComment = async (postId: string, text: string) => {
        if (!text.trim()) return;
        try {
            await apiService.addComment(postId, text);
            fetchPosts();
            showToast("Yorum Eklendi", "Yorumunuz paylaşıldı.", "success");
        } catch (err) {
            console.error("Yorum hatası:", err);
        }
    };

    const toggleCommentLike = (postId: number, commentId: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;

            const updateCommentLikes = (comments: any[]): any[] => {
                return comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            isLiked: !c.isLiked,
                            likes: c.isLiked ? c.likes - 1 : c.likes + 1
                        };
                    }
                    if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: updateCommentLikes(c.replies) };
                    }
                    return c;
                });
            };

            return { ...p, commentsList: updateCommentLikes(p.commentsList || []) };
        }));
    };

    const addCommentReply = (postId: number, parentCommentId: number, text: string) => {
        if (!text.trim()) return;
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;

            const newReply = {
                id: Date.now(),
                author: `@${user?.username || 'moffi_user'}`,
                avatar: user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
                text: text,
                time: "Şimdi",
                likes: 0,
                isLiked: false,
                replies: []
            };

            const updateCommentReplies = (comments: any[]): any[] => {
                return comments.map(c => {
                    if (c.id === parentCommentId) {
                        return { 
                            ...c, 
                            replies: [...(c.replies || []), { ...newReply, isReplyTo: c.author }] 
                        };
                    }
                    if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: updateCommentReplies(c.replies) };
                    }
                    return c;
                });
            };

            return { ...p, commentsList: updateCommentReplies(p.commentsList || []) };
        }));
    };

    const deleteComment = (postId: number, commentId: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;

            const removeComment = (comments: any[]): any[] => {
                return comments
                    .filter(c => c.id !== commentId)
                    .map(c => ({
                        ...c,
                        replies: c.replies ? removeComment(c.replies) : []
                    }));
            };

            return { 
                ...p, 
                comments: p.comments - 1,
                commentsList: removeComment(p.commentsList || []) 
            };
        }));
        showToast("Yorum Silindi", "Yorum ve yanıtları kaldırıldı.", "info");
    };

    const editComment = (postId: number, commentId: number, text: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;

            const updateCommentText = (comments: any[]): any[] => {
                return comments.map(c => {
                    if (c.id === commentId) {
                        return { ...c, text };
                    }
                    if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: updateCommentText(c.replies) };
                    }
                    return c;
                });
            };

            return { ...p, commentsList: updateCommentText(p.commentsList || []) };
        }));
        showToast("Yorum Güncellendi", "Değişiklikler kaydedildi.", "success");
    };

    const reportComment = (postId: number, commentId: number) => {
        showToast("Bildirim Alındı", "Yorum incelemeye alındı. Teşekkürler!", "info");
    };

    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [editingPost, setEditingPost] = useState<{ id: number, desc: string, mood: string | null, media: string } | null>(null);

    const deletePost = async () => {
        if (!postToDelete) return;
        try {
            await apiService.deletePost(postToDelete);
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
            setPostToDelete(null);
            showToast("Gönderi Silindi", "Gönderiniz başarıyla kaldırıldı.", "success");
        } catch (err: any) {
            console.error(err);
            showToast("Hata", "Gönderi silinemedi.", "error");
        }
    };

    const saveEditPost = async () => {
        if (!editingPost) return;
        setIsPublishing(true);
        try {
            await apiService.updatePost(editingPost.id, {
                desc: editingPost.desc,
                mood: editingPost.mood
            });
            setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, desc: editingPost.desc, mood: editingPost.mood } : p));
            setEditingPost(null);
            showToast("Güncellendi", "Değişiklikler kaydedildi.", "success");
        } catch (err: any) {
            console.error(err);
            showToast("Hata", "Gönderi güncellenemedi.", "error");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const fileURL = URL.createObjectURL(file);
            setUploadImageURL(fileURL);
            setIsUploadModalOpen(true);
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const publishPost = async () => {
        if (!uploadImageURL || !selectedFile) return;
        if (!user) {
            alert("Paylaşım yapmak için giriş yapmalısınız.");
            return;
        }

        setIsPublishing(true);
        try {
            // 1. Upload to Storage
            const publicUrl = await apiService.uploadMedia(selectedFile, 'posts');

            // 2. Add Post to DB
            await apiService.addPost({
                media: publicUrl,
                caption: uploadCaption,
                mood: uploadMood || null,
            });

            await fetchPosts();
            
            setIsPublishing(false);
            setIsUploadModalOpen(false);
            setUploadImageURL(null);
            setSelectedFile(null);
            setUploadCaption('');
            setUploadMood(null);
            setUploadLocationEnabled(false);
            setActiveTab('feed');
            showToast("Paylaşıldı", "Yeni gönderiniz yayında!", "success");
        } catch (error: any) {
            console.error("Post upload error:", error);
            alert("Paylaşım yapılamadı: " + error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSosImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newPhotos = Array.from(files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setLostPetPhotos(prev => [...prev, ...newPhotos]);
            if (sosInputRef.current) sosInputRef.current.value = '';
        }
    };

    const submitSos = async () => {
        if (!lostPetName || !lostPetLocation) {
            alert("Lütfen isim ve son görüldüğü yer alanlarını doldurun!");
            return;
        }
        if (!user) {
            alert("Kayıp ilanı verebilmek için üye girişi yapmalısınız!");
            return;
        }

        setIsSubmittingSOS(true);
        try {
            const photoUrls: string[] = [];
            // 1. Upload Images using apiService (Mockable)
            for (const photo of lostPetPhotos) {
                const publicUrl = await apiService.uploadMedia(photo.file, 'posts');
                if (publicUrl) photoUrls.push(publicUrl);
            }

            // 2. Insert Record via local simulation (Mock mode)
            setSosAlerts(prev => [{
                id: `lost-${Date.now()}`,
                user_id: user.id,
                author_name: user.username,
                author_avatar: user.avatar,
                pet_name: lostPetName,
                pet_breed: lostPetBreed,
                last_location: lostPetLocation,
                description: lostPetDesc,
                media_url: photoUrls[0] || null,
                images: photoUrls,
                status: 'lost',
                time: 'Şimdi'
            }, ...prev]);

            showToast("GÜÇLÜ SİNYAL GÖNDERİLDİ!", "Acil Durum İlanınız 5km çapındaki herkese ulaştı.", "success");

            setIsLostAdModalOpen(false);
            setLostPetName("");
            setLostPetBreed("");
            setLostPetLocation("");
            setLostPetDesc("");
            setLostPetPhotos([]);

        } catch (error: any) {
            console.error("SOS submission error:", error);
            showToast("Hata", "İlan gönderilirken hata oluştu.", "error");
        } finally {
            setIsSubmittingSOS(false);
        }
    };

    const handleDeleteLostPet = async (petId: string) => {
        if (!window.confirm("Kayıp ilanını sistemden kaldırmak/silmek istediğinize emin misiniz?")) return;
        try {
            // Mock delete logic
            setSosAlerts(prev => prev.filter(p => p.id !== petId));
            showToast("İlan Kaldırıldı", "İlanınız başarıyla sistemden kaldırıldı.", "success");
        } catch (err: any) {
            showToast("Hata", "İlan silinemedi.", "error");
        }
    };

    // Logic for adoption posts

    const handleAdoptionPost = async () => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        if (!adoptionPetName || !adoptionPetBreed || adoptionPetPhotos.length === 0) {
            showToast('Eksik Bilgi', 'Lütfen isim, tür ve en az bir fotoğraf ekleyin.', 'error');
            return;
        }

        setIsSubmittingAdoption(true);
        showToast('Yükleniyor...', 'Fotoğraflar işleniyor ve Moffi AI denetimi başlatılıyor...', 'info');
        try {
            const photoUrls: string[] = [];
            // 1. Upload Photos using apiService (Mockable)
            for (const photo of adoptionPetPhotos) {
                const publicUrl = await apiService.uploadMedia(photo.file, 'posts');
                if (publicUrl) photoUrls.push(publicUrl);
            }

            // 2. Add to local state (Mock mode)
            const newAd = {
                id: `adopt-${Date.now()}`,
                user_id: user.id,
                name: adoptionPetName,
                breed: adoptionPetBreed,
                age: adoptionPetAge,
                description: adoptionPetDesc,
                image_url: photoUrls[0] || null,
                images: photoUrls,
                author_name: user.username,
                author_avatar: user.avatar || null,
                pet_type: adoptionPetType,
                status: 'active'
            };

            setAdoptionAds(prev => [newAd, ...prev]);

            // Simulation: Artificial delay for "AI Moderation"
            setTimeout(() => {
                showToast('✅ İlan Yayınlandı!', 'Moffi AI denetiminden geçti. İlanınız görünmeye başladı.', 'success');
            }, 1000);

            // Reset form
            setIsAddAdoptionModalOpen(false);
            setAdoptionPetName("");
            setAdoptionPetBreed("");
            setAdoptionPetAge("");
            setAdoptionPetDesc("");
            setAdoptionPetPhotos([]);
            setAdoptionPetType("cat");

        } catch (err: any) {
            showToast('Hata', "İlan oluşturulamadı.", 'error');
        } finally {
            setIsSubmittingAdoption(false);
        }
    };

    const handleDeleteAdoptionAd = async (adId: string) => {
        if (!confirm('Bu ilanı kaldırmak istediğinizden emin misiniz?')) return;
        try {
            setAdoptionAds(prev => prev.filter(ad => ad.id !== adId));
            showToast('İlan Kaldırıldı', 'Sahiplendirme ilanınız silindi.', 'success');
        } catch (err: any) {
            showToast('Hata', "İlan silinemedi.", 'error');
        }
    };

    const [isReportAdModalOpen, setIsReportAdModalOpen] = useState(false);
    const [reportingAdId, setReportingAdId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState<string>('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const handleReportAdoption = async () => {
        if (!reportingAdId || !reportReason) return;
        setIsSubmittingReport(true);
        try {
            await fetch('/api/adoption/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: reportingAdId,
                    reportedBy: user?.id || null,
                    reason: reportReason,
                    details: ''
                })
            });
            showToast('🚨 Bildirim Alındı', 'Moffi ekibi en kısa sürede inceleyecek.', 'success');
            setIsReportAdModalOpen(false);
            setReportReason('');
            setReportingAdId(null);
        } catch (err: any) {
            showToast('Hata', err.message, 'error');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const handleStartAdoptionChat = (pet: any) => {
        setAdoptionChatPet(pet);
        setIsAdoptionChatOpen(true);
        // Mock initial system message
        setAdoptionMessages([
            { id: 'sys-1', text: `Merhaba! ${pet.name} için sahiplenme süreci başlatıldı. 👋`, sender: 'system', time: 'Şimdi' },
            { id: 'sys-2', text: 'Moffi Güvenli Mesajlaşma üzerinden ilan sahibiyle iletişime geçiyorsunuz. Lütfen kişisel bilgilerinizi paylaşırken dikkatli olun.', sender: 'system', time: 'Şimdi' }
        ]);
    };

    const submitAdoptionApplication = async () => {
        if (!user || !selectedAdoptionPet) return;
        setIsSubmittingApp(true);
        try {
            // Mock submission
            showToast("Başvuru İletildi! ❤️", "İlan sahibi başvurunuzu inceledikten sonra size dönecek.", "success");
            setIsApplicationFormOpen(false);
            setAppNote("");
            setSelectedAdoptionPet(null);
        } catch (err: any) {
            showToast("Hata", "Başvuru yapılamadı.", "error");
        } finally {
            setIsSubmittingApp(false);
        }
    };

    const handleSendAdoptionMsg = () => {
        if (!adoptionNewMsg.trim()) return;
        const newMsg = {
            id: Date.now().toString(),
            text: adoptionNewMsg,
            sender: 'me',
            time: 'Şimdi'
        };
        setAdoptionMessages(prev => [...prev, newMsg]);
        setAdoptionNewMsg("");

        // Mock a response after 1s
        setIsSendingAdoptionMsg(true);
        setTimeout(() => {
            setIsSendingAdoptionMsg(false);
            setAdoptionMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "İlginiz için teşekkürler! Birazdan size detaylı bilgi vereceğim. 😊",
                sender: 'them',
                time: 'Şimdi'
            }]);
        }, 1500);
    };

    const handleReportLocation = () => {
        if (!user) {
            alert("Anonim olarak ihbar verebilmek için üye girişi yapmalısınız.");
            return;
        }
        setAnonModalType('report');
        setAnonMessage("");
        setAnonError(null);
    };

    const handleMessageOwner = () => {
        if (!user) {
            alert("Mesaj atabilmek için giriş yapmalısınız.");
            return;
        }
        setAnonModalType('message');
        setAnonMessage("");
        setAnonError(null);
    };

    const submitAnonAction = async () => {
        if (!anonMessage.trim()) return;
        setAnonError(null);

        // --- AI MODERATION / PII CHECK ---
        // Telefon Numarası Regex: (Örn: 0555 555 55 55, +905555555555, 532 123 4567)
        const phoneRegex = /(?:\+90|0)?\s?[5]\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/i;
        // IBAN Regex: TR ile başlayıp 24 hane sayılan temel mantık
        const ibanRegex = /TR[a-zA-Z0-9]{24}/i;

        // Kelime bazlı basit spam/adres yakalama algoritması (örn. 'mah', 'sokak', 'no:')
        const rawText = anonMessage.toLowerCase();

        if (phoneRegex.test(rawText)) {
            setAnonError("Hata: Sistemimiz iletişim bilginizi veya telefon numarası formatı tespit etti. Güvenliğiniz için direkt iletişim bilgisi paylaşmak yasaktır.");
            return;
        }
        if (ibanRegex.test(rawText)) {
            setAnonError("Hata: İbana ve para transferine yönelik teşebbüsleri reddediyoruz.");
            return;
        }

        setIsSubmittingAnon(true);
        try {
            if (anonModalType === 'report' || anonModalType === 'message') {
                const isMsg = anonModalType === 'message';
                // Mock sighting submission
                showToast("Sinyal İletildi", isMsg ? "Moffi Acil İhbar Hattına şifreli mesajınız ulaştı." : "Bölge bilgisini güvenle ulaştırdık.", "success");
            }
            setAnonModalType(null);
            setAnonMessage("");
        } catch (err: any) {
            showToast("Bağlantı Hatası", "İşlem sırasında beklenmedik bir hata oluştu.", "error");
        } finally {
            setIsSubmittingAnon(false);
        }
    };

    const fetchInbox = async () => {
        if (!user) return;
        try {
            const data = await apiService.getInboxMessages();
            setInboxMessages(data || []);
            // Count unread
            const unread = (data || []).filter((m: any) => m.receiver_id === user.id && m.read_status === false).length;
            setUnreadInboxCount(unread);
        } catch (err) {
            console.error("Inbox yükleme hatası:", err);
        }
    };


    // Unified SOS/Lost Pet fetcher used across the component
    const fetchLostPets = async () => {
        setIsLoadingLost(true);
        try {
            const data = await apiService.getLostPets();
            setLostPets(data || []);
            setSosAlerts(data || []);
        } catch (err) {
            console.error("Kayıp ilanlar çekilirken hata:", err);
            setLostPets([]);
            setSosAlerts([]);
        } finally {
            setIsLoadingLost(false);
        }
    };


    const markMessagesAsRead = async (chatId?: string) => {
        if (!user || unreadInboxCount === 0) return;
        setUnreadInboxCount(0);
        // Persistence update would normally happen here via apiService
    };

    const handleReply = async () => {
        if (!replyMessage.trim() || !user || !activeChatUserId) return;

        setIsReplying(true);
        try {
            await apiService.sendChatMessage(activeChatUserId, replyMessage.trim());
            setReplyMessage("");
            fetchInbox();
        } catch (err: any) {
            showToast("Gönderilemedi", "Mesaj iletilemedi.", "error");
        } finally {
            setIsReplying(false);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        try {
            // Mock delete
            setActiveMessageMenuId(null);
            if (editingMessageId === msgId) { setEditingMessageId(null); setReplyMessage(""); }
            showToast("Mesaj Silindi", "Mesaj başarıyla kaldırıldı.", "success");
        } catch (err: any) {
            showToast("Mesaj Silinemedi", "Hata oluştu.", "error");
        }
    };

    const startEditingMessage = (msgId: string, content: string) => {
        setEditingMessageId(msgId);
        setReplyMessage(content);
        setActiveMessageMenuId(null);
    };

    const handleAcceptChat = async () => {
        if (!user || !activeChatUserId) return;
        try {
            await apiService.sendChatMessage(activeChatUserId, '[SYSTEM_ACCEPT]');
            fetchInbox();
        } catch (err: any) {
            console.error("Chat onaylanamadı:", err);
        }
    };

    const chatGroups = React.useMemo(() => {
        if (!user) return [];
        const groups: Record<string, any[]> = {};
        inboxMessages.forEach(msg => {
            const otherId = msg.sender_id === user.id && msg.receiver_id === user.id
                ? user.id
                : (msg.sender_id === user.id ? msg.receiver_id : msg.sender_id);

            if (!groups[otherId]) groups[otherId] = [];
            groups[otherId].push(msg);
        });

        return Object.entries(groups).sort((a, b) => {
            const lastA = a[1][a[1].length - 1];
            const lastB = b[1][b[1].length - 1];
            return new Date(lastB.created_at).getTime() - new Date(lastA.created_at).getTime();
        });
    }, [inboxMessages, user]);

    // REAL-TIME SOS RADAR FILTERING LOGIC
    const filteredSosAlerts = React.useMemo(() => {
        const sosSettings = user?.settings?.sos || {
            radius: 5,
            quietHours: { enabled: false, from: '23:00', to: '07:00' },
            petTypes: ['dog', 'cat', 'bird', 'other'],
            emergencyBypass: true
        };

        return sosAlerts.filter(alert => {
            // 1. Radius Filter
            if (alert.distance > (sosSettings.radius || 5)) return false;

            // 2. Pet Type Filter
            if (!(sosSettings.petTypes || []).includes(alert.type)) return false;

            // 3. Quiet Hours & Emergency Bypass Logic
            if (sosSettings.quietHours?.enabled) {
                const now = new Date();
                const currentMins = now.getHours() * 60 + now.getMinutes();
                const [fromH, fromM] = (sosSettings.quietHours.from || '23:00').split(':').map(Number);
                const [toH, toM] = (sosSettings.quietHours.to || '07:00').split(':').map(Number);
                const fromMins = fromH * 60 + fromM;
                const toMins = toH * 60 + toM;

                let isQuietTime = false;
                if (fromMins < toMins) {
                    isQuietTime = currentMins >= fromMins && currentMins <= toMins;
                } else {
                    isQuietTime = currentMins >= fromMins || currentMins <= toMins;
                }

                if (isQuietTime) {
                    // EMERGENCY BYPASS: If enabled, show very close alerts (< 1km) regardless of quiet hours
                    if (sosSettings.emergencyBypass && alert.distance < 1.0) {
                        return true;
                    }
                    return false;
                }
            }

            return true;
        });
    }, [sosAlerts, user?.settings?.sos]);


    useEffect(() => {
        if (user) {
            fetchInbox();
            // Supabase real-time message triggers removed for mock mode.
        }
    }, [user]);

    useEffect(() => {
        if (isInboxOpen) {
            if (inboxTab === 'chats') {
                fetchInbox();
                markMessagesAsRead();
            } else {
                fetchLostPets();
            }
        }
    }, [isInboxOpen, inboxTab]);


    return (
        <div className="fixed inset-0 bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col font-sans">

            {/* iOS STYLE TOAST NOTIFICATION */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm pointer-events-none"
                    >
                        <div className={cn(
                            "backdrop-blur-xl border rounded-[1.5rem] p-4 shadow-2xl flex items-start gap-4 pointer-events-auto",
                            toastMessage.type === 'success' ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-100" :
                                toastMessage.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-100" :
                                    "bg-white/10 border-white/20 text-[var(--foreground)]"
                        )}>
                            <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                                toastMessage.type === 'success' ? "bg-cyan-500" :
                                    toastMessage.type === 'error' ? "bg-red-500" :
                                        "bg-blue-500"
                            )}>
                                {toastMessage.type === 'success' ? <Check className="w-5 h-5 text-black" strokeWidth={3} /> :
                                    toastMessage.type === 'error' ? <X className="w-5 h-5 text-[var(--foreground)]" strokeWidth={3} /> :
                                        <Activity className="w-5 h-5 text-[var(--foreground)]" strokeWidth={3} />}
                            </div>
                            <div className="flex flex-col gap-0.5 justify-center mt-0.5">
                                <h4 className="font-black text-[15px] leading-tight text-[var(--foreground)]">{toastMessage.title}</h4>
                                {toastMessage.desc && <p className="text-xs font-medium text-[var(--foreground)]/80 leading-snug">{toastMessage.desc}</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AMBIENT BACKGROUND GLOW */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* HEADER - GLASSMORPHISM (COLLAPSING) */}
            <motion.header 
                style={{ 
                    height: headerHeightTransform,
                    padding: headerPadding,
                    backgroundColor: useTransform(headerBgOpacity, (o) => `rgba(10, 10, 11, ${o})`),
                    backdropFilter: useTransform(headerBlur, (b) => `blur(${b}px)`),
                    borderBottomColor: useTransform(headerBorderOpacity, (o) => `rgba(255, 255, 255, ${o})`)
                }}
                className="fixed top-0 left-0 right-0 z-40 flex flex-col shrink-0 border-b border-white/0 transition-shadow duration-300"
            >
                <div className="flex justify-between items-center w-full max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <motion.button
                            style={{ scale: iconScale }}
                            onClick={() => cameraInputRef.current?.click()}
                            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-[0_8px_32px_rgba(0,0,0,0.3)] group/cam"
                        >
                            <Camera className="w-5 h-5 text-white/70 group-hover/cam:text-white transition-colors" strokeWidth={1.5} />
                        </motion.button>
                        <div className="flex flex-col">
                            <motion.h1
                                style={{ scale: logoScale, y: logoY }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent drop-shadow-sm select-none origin-left"
                            >
                                Moffi
                                <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">.</span>
                            </motion.h1>
                            
                            {/* SOS ACTIVE INDICATOR (HEADER) */}
                            {isAnyPetLost && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 ml-2 mt-0.5"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic drop-shadow-sm">SOS Aktif</span>
                                </motion.div>
                            )}

                            {/* QUIET MODE INDICATOR */}
                            {isQuietModeActive && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 ml-2 mt-0.5"
                                >
                                    <Moon className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic drop-shadow-sm">Sessiz Mod</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <motion.button 
                            style={{ scale: iconScale }}
                            onClick={() => setIsNotificationsOpen(true)} 
                            className="relative p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md"
                        >
                            <Bell className="w-5 h-5 text-white/80" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0b]"></div>
                        </motion.button>
                    </div>
                </div>

                {/* Animated Search Bar Dropdown */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden w-full flex items-center gap-2"
                        >
                            <input
                                type="text"
                                placeholder="Moffi'de keşfe çık..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-cyan-400 focus:bg-white/10 transition-all text-white placeholder:text-white/30"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Header Spacing (Dynamic height to push content up as header collapses) */}
            <motion.div style={{ height: headerHeightTransform }} className="shrink-0" />

            {/* MAIN IMMERSIVE CONTENT - Unified Scroll per tab */}
            <main 
                ref={globalScrollRef}
                onScroll={handleMainScroll}
                className="flex-1 relative z-10 w-full overflow-y-auto no-scrollbar overscroll-contain"
            >
                <AnimatePresence>

                    {/* FEED TAB */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)" }}
                            transition={{ duration: 0.3 }}
                            className="w-full pb-32 flex flex-col gap-8"
                        >
                            {/* INSTAGRAM-STYLE STORIES BAR */}
                            <div className="w-full flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar snap-start shrink-0">
                                {/* Current User Add Story - Apple Style Upgrade */}
                                <div className="flex flex-col items-center gap-1.5 shrink-0 group">
                                    <div 
                                        className="w-16 h-16 rounded-full relative cursor-pointer flex items-center justify-center transition-all duration-300" 
                                        onClick={() => document.getElementById('story-upload')?.click()}
                                    >
                                        <input type="file" id="story-upload" className="hidden" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const res = await uploadStory(file);
                                                if (res.success) alert("Hikaye başarıyla yüklendi! 🚀");
                                                else alert("Yükleme hatası: " + res.error);
                                            }
                                        }} />
                                        
                                        {/* Premium Apple-Style Glass Circle */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-600/10 border-2 border-dashed border-white/20 group-hover:border-cyan-400/50 group-hover:bg-[var(--card-bg)] transition-all duration-500" />
                                        
                                        <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--card-bg)] backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                                            <div className="absolute inset-0 bg-cyan-400/5 blur-md group-hover:bg-cyan-400/20 transition-all" />
                                            <Plus className="w-6 h-6 text-[var(--foreground)] group-hover:text-cyan-400 transition-colors" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-[var(--foreground)]/30 font-black uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Ekle</span>
                                </div>

                                {/* Real Database Stories */}
                                {storyGroups.map((group, index) => (
                                    <div key={group.user_id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={() => {
                                        setViewerStoryGroupIndex(index);
                                        setViewerStoryIndex(0);
                                    }}>
                                        <div className={cn(
                                            "w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105",
                                            group.hasUnseen ? "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600" : "bg-white/10"
                                        )}>
                                            <div className="w-full h-full bg-[var(--background)] rounded-full border-2 border-[var(--background)] overflow-hidden relative">
                                                <img 
                                                    src={(group.user_id === user?.id ? (user?.avatar || group.author_avatar) : group.author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} 
                                                    className="w-full h-full object-cover transition-opacity duration-500"
                                                    onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                                                    style={{ opacity: 0 }}
                                                />
                                            </div>
                                        </div>
                                        <span className={cn("text-[10px] tracking-wide", group.hasUnseen ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--secondary-text)] truncate w-16 text-center")}>
                                            {user?.id === group.user_id ? "Sen" : group.author_name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Feed SOS Alerts (Respecting Privacy Settings) */}
                            {activePet?.is_lost && activePet.sos_settings?.auto_post_sos !== false && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="px-4 -mt-2 mb-4"
                                >
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-[2.5rem] p-6 backdrop-blur-xl relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce">
                                                    <ShieldAlert className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{activePet.name} <span className="text-red-400">Kayıp Alarmı</span></h3>
                                                    <p className="text-[10px] font-bold text-red-200/60 uppercase tracking-widest mt-1">Arama Kurtarma Sinyali Gönderiliyor</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSosActivePet(activePet);
                                                    setIsSOSCommandCenterOpen(true);
                                                }}
                                                className="px-6 py-2.5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                            >
                                                YÖNET
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {isLoadingPosts ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="w-full relative flex flex-col items-center justify-center px-4 shrink-0" style={{ height: "calc(100vh - 180px)" }}>
                                        <div className="relative w-full h-full max-w-lg mx-auto rounded-[3rem] overflow-hidden bg-[var(--card-bg)] border border-white/10 shadow-2xl animate-pulse">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute inset-0 bg-[var(--card-bg)] overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                            </div>
                                            <div className="absolute bottom-8 left-8 right-8 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-white/10" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-24 bg-white/10 rounded-full" />
                                                        <div className="h-3 w-16 bg-white/10 rounded-full" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-3 w-full bg-white/10 rounded-full" />
                                                    <div className="h-3 w-4/5 bg-white/10 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                posts.map((post, feedIdx) => (
                                    <div key={post.id} className="w-full relative flex flex-col items-center justify-center px-0 shrink-0" style={{ height: "calc(100vh - 160px)" }}>
                                        <ImmersivePostCard
                                            post={post}
                                            currentUser={user}
                                            onLike={() => toggleLike(post.id)}
                                            onShare={() => setSelectedSharePost(post)}
                                            onAddComment={(text) => addComment(post.id, text)}
                                            onToggleCommentLike={(commentId) => toggleCommentLike(post.id, Number(commentId))}
                                            onReplyComment={(commentId, text) => addCommentReply(post.id, Number(commentId), text)}
                                            onDeleteComment={(commentId) => deleteComment(post.id, Number(commentId))}
                                            onEditComment={(commentId, text) => editComment(post.id, Number(commentId), text)}
                                            onReportComment={(commentId) => reportComment(post.id, Number(commentId))}
                                            onDeletePost={() => setPostToDelete(post.id)}
                                            onEditPost={() => setEditingPost({ id: post.id, desc: post.desc, mood: post.mood, media: post.media })}
                                            priority={feedIdx === 0}
                                        />
                                    </div>
                                ))
                            )}
                            {/* Space for bottom nav */}
                            <div className="h-12 w-full shrink-0" />
                        </motion.div>
                    )}

                    {/* UNIFIED COMMUNITY RADAR TAB */}
                    {activeTab === 'radar' && (
                        <motion.div
                            key="radar"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="w-full pb-32 bg-[var(--background)] flex flex-col items-center"
                        >
                            <div className="w-full max-w-md mx-auto relative">
                                
                                {/* 0. RADAR SUB-TAB SELECTOR (Apple Style Navigation) */}
                                <div className="w-full px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-xl">
                                    <button 
                                        onClick={() => setActiveTab('feed')}
                                        className="w-10 h-10 rounded-full bg-[var(--card-bg)] border border-white/5 flex items-center justify-center text-[var(--secondary-text)] hover:text-white transition-all active:scale-90 shadow-lg"
                                        title="Geri Dön"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    
                                    <div className="flex bg-[var(--card-bg)] p-1 rounded-2xl border border-white/10 w-full max-w-[200px] shadow-sm ml-2">
                                        <button 
                                            onClick={() => setRadarTabMode('lost')}
                                            className={cn(
                                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                radarTabMode === 'lost' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            Kayıp
                                        </button>
                                        <button 
                                            onClick={() => setRadarTabMode('adopt')}
                                            className={cn(
                                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                radarTabMode === 'adopt' ? "bg-white text-black shadow-lg" : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            Sahiplen
                                        </button>
                                    </div>
                                    
                                    <div className="w-10 h-10" />
                                </div>

                                {/* Pet Switcher for Radar Context */}
                                <div className="flex justify-center mt-6 mb-2">
                                    <PetSwitcher onAddPet={() => setIsLostAdModalOpen(true)} />
                                </div>

                                {radarTabMode === 'lost' ? (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="w-full"
                                    >
                                        {/* 1. SOS / KAYIP İLANLARI (Vertical List) */}
                                        <div className="w-full pt-6 pb-2 relative">
                                            <div className="px-6 mb-6 flex items-center justify-between">
                                                <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Aktif İhbarlar</h3>
                                                <button onClick={() => setIsLostAdModalOpen(true)} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20">
                                                    + İlan Ekle
                                                </button>
                                            </div>

                                            {lostPets.length > 0 ? (
                                                <div className="space-y-4 px-6 pb-10">
                                                    {lostPets.map((pet) => (
                                                        <div key={pet.id} className="w-full bg-red-500/5 border border-red-500/20 rounded-3xl p-4 flex flex-col gap-3 cursor-pointer hover:bg-red-500/10 transition-all active:scale-[0.98] relative group overflow-hidden" onClick={() => setSelectedLostPet(pet)}>
                                                            {/* Apple style blur background for red accent */}
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] -mr-10 -mt-10 rounded-full pointer-events-none" />
                                                            
                                                            {user?.id === pet.user_id && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteLostPet(pet.id); }} className="absolute right-3 top-3 px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-red-500/30 text-red-400 text-[10px] font-bold uppercase transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 z-10 shadow-lg">
                                                                    <Trash2 className="w-3 h-3" /> Sil
                                                                </button>
                                                            )}

                                                            <div className="flex gap-4 items-center">
                                                                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30 shadow-inner overflow-hidden">
                                                                    {pet.img ? (
                                                                        <img src={pet.img} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center">
                                                                            <ShieldAlert className="w-6 h-6 text-red-500" />
                                                                            <span className="text-[8px] font-black text-red-500 mt-1">SOS</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-red-500 font-black text-lg tracking-tight truncate">{pet.name}</p>
                                                                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold border border-red-500/30">Kayıp</span>
                                                                        </div>
                                                                        {pet.reward_enabled && pet.reward && (
                                                                            <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg -mt-1">ÖDÜL</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[var(--secondary-text)] text-xs font-medium truncate">{pet.type || "Bilinmiyor"}</p>
                                                                    <p className="text-[10px] text-red-400/80 mt-1.5 flex items-center gap-1 font-black"><MapPin className="w-3 h-3 text-cyan-400" /> {pet.last_seen_location || pet.location}</p>
                                                                </div>
                                                                <ChevronRight className="w-5 h-5 text-red-500/50" />
                                                            </div>
                                                            <p className="text-[var(--foreground)]/70 text-[11px] mt-1 leading-snug line-clamp-2 px-1 font-medium italic">"{pet.description || "Lütfen görünce acil dönüş yapın."}"</p>
                                                            
                                                            <div className="mt-2 flex gap-2">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); /* Logic to open chat */ }}
                                                                    className="flex-1 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                                                >
                                                                    İletişime Geç
                                                                </button>
                                                                <button 
                                                                    className="px-4 py-3 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
                                                                >
                                                                    Konum Paylaş
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 mx-6 mb-4 bg-red-500/5 rounded-3xl border border-red-500/10">
                                                    <ShieldAlert className="w-10 h-10 text-red-500/20 mx-auto mb-3" />
                                                    <p className="text-xs text-red-500/40 font-bold tracking-wide">Aktif İhbar Bulunmuyor</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="w-full mt-2"
                                    >
                                        {/* ADOPTION PANEL CONTENT */}
                                        <div className="px-6 mb-8 mt-2 flex items-center justify-between">
                                            <div>
                                                <p className="text-[var(--secondary-text)] text-[11px] font-bold uppercase tracking-widest mb-1">
                                                    Bugün Sahiplen
                                                </p>
                                                <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">Sıcak Bir Yuva</h2>
                                            </div>
                                            <button onClick={() => setIsAddAdoptionModalOpen(true)} className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/20 active:scale-95 transition-all outline outline-1 outline-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                                <Plus className="w-4 h-4" /> İlan Ver
                                            </button>
                                        </div>

                                        {/* APPLE-STYLE HORIZONTAL FILTER PILLS */}
                                        <div className="w-full overflow-x-auto no-scrollbar px-6 mb-8 -mt-2 pb-2 flex gap-3 snap-x">
                                            {["Hepsi", "🐱 Kediler", "🐶 Köpekler", "🦜 Kuşlar", "🚨 Acil", "🏢 Apartmana"].map((pill) => (
                                                <button
                                                    key={pill}
                                                    onClick={() => setSelectedAdoptionCategory(pill)}
                                                    className={cn(
                                                        "snap-start whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95",
                                                        selectedAdoptionCategory === pill
                                                            ? "bg-white text-black shadow-lg shadow-white/20"
                                                            : "bg-[#1C1C1E] text-[#8E8E93] border border-[var(--card-border)] hover:bg-white/10 hover:text-[var(--foreground)]"
                                                    )}
                                                >
                                                    {pill}
                                                </button>
                                            ))}
                                        </div>

                                        {/* REAL ADOPTION ADS LIST */}
                                        <div className="px-6 mb-8 w-full">
                                            <div className="flex justify-between items-end mb-4 pb-3">
                                                <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">İlanlar</h2>
                                                <span className="text-xs text-[var(--secondary-text)] font-bold bg-[var(--card-bg)] px-2 py-1 rounded-full">{adoptionAds.length} ilan</span>
                                            </div>
                                            {(() => {
                                                const filtered = adoptionAds.filter(ad => {
                                                    if (selectedAdoptionCategory === "Hepsi") return true;
                                                    if (selectedAdoptionCategory === "🐱 Kediler") return ad.pet_type === "cat" || ad.breed?.toLowerCase().includes("kedi");
                                                    if (selectedAdoptionCategory === "🐶 Köpekler") return ad.pet_type === "dog" || ad.breed?.toLowerCase().includes("köpek");
                                                    if (selectedAdoptionCategory === "🦜 Kuşlar") return ad.pet_type === "bird" || ad.breed?.toLowerCase().includes("kuş");
                                                    if (selectedAdoptionCategory === "🚨 Acil") return ad.is_emergency === true;
                                                    if (selectedAdoptionCategory === "🏢 Apartmana") return ad.is_apartment_friendly === true;
                                                    return true;
                                                });

                                                if (isLoadingAdoptions) {
                                                    return (
                                                        <div className="space-y-4">
                                                            {Array(3).fill(0).map((_, i) => (
                                                                <div key={i} className="flex gap-4 p-4 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse overflow-hidden relative">
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                                                                    <div className="w-16 h-16 rounded-2xl bg-white/10 shrink-0" />
                                                                    <div className="flex-1 space-y-3 pt-2">
                                                                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                                                                        <div className="h-3 w-20 bg-white/10 rounded-full opacity-50" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }

                                                if (filtered.length === 0) {
                                                    return (
                                                        <div className="text-center py-12 bg-[var(--card-bg)] rounded-3xl border border-white/10">
                                                            <HeartHandshake className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3" />
                                                            <p className="text-[var(--secondary-text)] font-bold">Henüz ilan yok</p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="space-y-4">
                                                        {filtered.map((ad) => (
                                                            <div
                                                                key={ad.id}
                                                                className="flex flex-row items-center gap-4 bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--card-border)] active:bg-[var(--card-bg)] transition-colors cursor-pointer relative"
                                                                onClick={() => setSelectedAdoptionPet({
                                                                    id: ad.id,
                                                                    name: ad.name,
                                                                    breed: ad.breed,
                                                                    desc: ad.description || `${ad.name} sıcak bir yuva arıyor.`,
                                                                    img: ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600',
                                                                    images: ad.images || [ad.image_url],
                                                                    tags: [ad.age, ad.breed].filter(Boolean),
                                                                    user_id: ad.user_id,
                                                                    author_name: ad.author_name,
                                                                    author_avatar: ad.author_avatar,
                                                                    created_at: ad.created_at
                                                                })}
                                                            >
                                                                <img src={ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=200'} className="w-16 h-16 rounded-[1rem] object-cover shrink-0" />
                                                                <div className="flex-1 overflow-hidden">
                                                                    <h4 className="text-[var(--foreground)] font-bold text-base">{ad.name} <span className="text-[var(--secondary-text)] font-medium text-xs ml-1">• {ad.age}</span></h4>
                                                                    <p className="text-cyan-400 text-xs mt-0.5">{ad.breed}</p>
                                                                </div>
                                                                <ChevronRight className="w-5 h-5 text-[var(--secondary-text)] mr-1 shrink-0" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* PROFILE TAB (Real Architecture) */}
                    {activeTab === 'profile' && (
                        <ProfileTab 
                            user={user}
                            showAuraBadge={isAuraVisible}
                            onEditProfile={() => setIsEditProfileOpen(true)}
                            onAddPet={() => setIsAddPetOpen(true)}
                            onSettings={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                            onPetQR={(pet) => { setQrModalPet({ name: pet.name, id: pet.id, avatar: pet.image || pet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" }); }}
                            onSOSSettings={(pet) => { setSosActivePet(pet); setIsSOSCommandCenterOpen(true); }}
                            onOpenActionHub={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
                            posts={userPosts}
                            onLike={toggleLike}
                            activeSubView={profileSubView}
                            onSubViewChange={setProfileSubView}
                            isCommentsDisabled={!user?.settings?.privacy?.allowComments}
                            isSmartShopEnabled={user?.settings?.privacy?.smartShopEnabled}
                            isAuraStudioOpen={isAuraStudioOpen}
                            setIsAuraStudioOpen={setIsAuraStudioOpen}
                            auraSettings={auraSettings}
                            setAuraSettings={handleUpdateAuraSettings}
                        />
                    )}

                </AnimatePresence>
            </main >

            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*,video/*" onChange={handleCameraUpload} />

            {/* MODALS AND DRAWERS */}

            {/* EDIT PROFILE MODAL (Apple Modern Style) */}
            <AnimatePresence>
                {isEditProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setIsEditProfileOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-sm bg-[#1C1C1E]/80 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Navigation Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                                <button onClick={() => setIsEditProfileOpen(false)} className="flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white transition-all active:scale-95 group">
                                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                    Vazgeç
                                </button>
                                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Profili Düzenle</h2>
                                <button 
                                    disabled={isSavingProfile}
                                    onClick={async () => {
                                        if (!user) return;
                                        setIsSavingProfile(true);
                                        try {
                                            let finalAvatarUrl = null;
                                            if (editAvatarFile) {
                                                finalAvatarUrl = await apiService.uploadMedia(editAvatarFile, 'avatars');
                                            }

                                            let finalCoverUrl = null;
                                            if (editCoverFile) {
                                                finalCoverUrl = await apiService.uploadMedia(editCoverFile, 'avatars');
                                            }

                                            await updateProfile({
                                                username: editUsername, // Use username correctly
                                                name: editName,
                                                bio: editBio,
                                                ...(finalAvatarUrl && { avatar: finalAvatarUrl }),
                                                ...(finalCoverUrl && { cover_photo: finalCoverUrl })
                                            });

                                            setIsEditProfileOpen(false);
                                        } catch (err) {
                                            console.error("Profile update error:", err);
                                            showToast("Hata", "Profil güncellenemedi.", "error");
                                        } finally {
                                            setIsSavingProfile(false);
                                        }
                                    }}
                                    className="text-sm font-black text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                                >
                                    {isSavingProfile ? (
                                        <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                                    ) : 'Kaydet'}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
                                {/* Photo Management Area */}
                                <div className="relative h-44 mb-16">
                                    {/* Cover Photo */}
                                    <div className="w-full h-full bg-white/5 relative overflow-hidden group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                                        {editCoverPreview ? (
                                            <img src={editCoverPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-cyan-900/40 to-purple-900/40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                                <Camera className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setEditCoverFile(file);
                                                setEditCoverPreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </div>

                                    {/* Avatar Overlap */}
                                    <div className="absolute -bottom-12 left-6">
                                        <label htmlFor="edit-avatar-upload" className="block relative w-24 h-24 rounded-full border-4 border-[#1C1C1E] shadow-2xl cursor-pointer group bg-[#1C1C1E] overflow-hidden">
                                            {editAvatarPreview ? (
                                                <img src={editAvatarPreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                    <Camera className="w-6 h-6 text-white/40" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-5 h-5 text-white" />
                                            </div>
                                            <input id="edit-avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setEditAvatarFile(file);
                                                    setEditAvatarPreview(URL.createObjectURL(file));
                                                }
                                            }} />
                                        </label>
                                    </div>
                                </div>

                                {/* Form Section: iOS Style Rows */}
                                <div className="px-4 space-y-6">
                                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="px-4 py-4 border-b border-white/5">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Görünen Ad</label>
                                            <input 
                                                type="text" 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)} 
                                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                                                placeholder="İsminiz"
                                            />
                                        </div>
                                        <div className="px-4 py-4">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Kullanıcı Adı</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-white/40">@</span>
                                                <input 
                                                    type="text" 
                                                    value={editUsername} 
                                                    onChange={e => setEditUsername(e.target.value)} 
                                                    className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                                                    placeholder="kullanici_adi"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl border border-white/5 px-4 py-4">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Biyografi</label>
                                        <textarea 
                                            value={editBio} 
                                            onChange={e => setEditBio(e.target.value)} 
                                            className="w-full bg-transparent text-sm font-medium text-white/80 outline-none placeholder:text-white/20 resize-none h-24"
                                            placeholder="Kendinizden bahsedin..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD PET (Apple Bottom Sheet Style) MODAL */}
            <AnimatePresence>
                {isAddPetOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] flex flex-col justify-end bg-black/60 backdrop-blur-sm px-2 pb-8"
                        onClick={() => setIsAddPetOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.y > 100 || velocity.y > 500) {
                                    setIsAddPetOpen(false);
                                    setTimeout(() => setAddPetStep(1), 300);
                                }
                            }}
                            className="w-full bg-[var(--card-bg)] border border-white/10 rounded-[2.5rem] p-6 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()} // Prevent close on clicking inside modal
                        >
                            {/* Drag Indicator */}
                            <button 
                                onClick={() => {
                                    setIsAddPetOpen(false);
                                    setTimeout(() => setAddPetStep(1), 300);
                                }}
                                className="w-12 h-1.5 bg-gray-600 rounded-full mb-6 hover:bg-gray-500 transition-colors cursor-pointer" 
                            />

                            <div className="w-full flex justify-between items-center mb-6 px-1">
                                <div className="w-9">
                                    {addPetStep === 1 && (
                                        <button onClick={() => setIsAddPetOpen(false)} className="p-2 bg-[var(--card-bg)] rounded-full text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    {addPetStep > 1 && (
                                        <button onClick={() => setAddPetStep(prev => prev - 1)} className="p-2 bg-[var(--card-bg)] rounded-full text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                                        {addPetStep === 1 ? 'Temel Kimlik' : addPetStep === 2 ? 'Karakter & Tıbbi' : 'Güvenlik & Kayıt'}
                                    </h2>
                                    <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mt-1">Adım {addPetStep} / 3</p>
                                </div>
                                <div className="w-9" />
                            </div>

                            {/* SCROLLABLE FORM AREA */}
                            <div className="w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-6 px-1 flex flex-col items-center">

                                {addPetStep === 1 && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-4 max-w-sm flex flex-col items-center">
                                        {/* Multi-Photo Picker */}
                                        <div className="w-full mb-2">
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 items-center px-1">
                                                {newPetPhotos.map((photo, index) => (
                                                    <div key={index} className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                                                        <img src={photo.preview} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setNewPetPhotos(prev => prev.filter((_, i) => i !== index))}
                                                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3 text-[var(--foreground)]" />
                                                        </button>
                                                        {index === 0 && (
                                                            <div className="absolute bottom-1 left-1 right-1 bg-cyan-500/80 backdrop-blur-md flex items-center justify-center py-0.5 rounded-lg">
                                                                <span className="text-[9px] font-bold text-[var(--foreground)] uppercase tracking-wider">Kapak</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {newPetPhotos.length < 5 && (
                                                    <label htmlFor="add-pet-photos" className="shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400/60 transition-colors">
                                                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center mb-1">
                                                            <Plus className="w-4 h-4 text-cyan-400" />
                                                        </div>
                                                        <span className="text-[9px] text-cyan-200 font-bold uppercase tracking-wide px-2 text-center">Foto Ekle<br />(Max 5)</span>
                                                        <input
                                                            type="file"
                                                            id="add-pet-photos"
                                                            className="hidden"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || []);
                                                                if (files.length > 0) {
                                                                    const validFiles = files.slice(0, 5 - newPetPhotos.length);
                                                                    const newPhotos = validFiles.map(file => ({
                                                                        file,
                                                                        preview: URL.createObjectURL(file)
                                                                    }));
                                                                    setNewPetPhotos(prev => [...prev, ...newPhotos]);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* İsim ve Tür */}
                                        <div className="flex gap-3 w-full">
                                            <div className="flex-1">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">İsim</label>
                                                <input type="text" value={newPetName} onChange={e => setNewPetName(e.target.value)} placeholder="Örn: Pamuk" className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors font-bold" />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Tür</label>
                                                <select value={newPetType} onChange={e => setNewPetType(e.target.value)} className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-2 py-3.5 text-center text-xl mt-1 outline-none focus:border-cyan-400 transition-colors appearance-none" style={{ textAlignLast: "center" }}>
                                                    <option value="🐶">🐶</option>
                                                    <option value="🐱">🐱</option>
                                                    <option value="🦜">🦜</option>
                                                    <option value="🐰">🐰</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Irk ve Yaş */}
                                        <div className="flex gap-3 w-full">
                                            <div className="flex-[2]">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Irkı</label>
                                                <input type="text" value={newPetBreed} onChange={e => setNewPetBreed(e.target.value)} placeholder="Örn: Golden Retriever" className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Yaş</label>
                                                <input type="text" value={newPetAge} onChange={e => setNewPetAge(e.target.value)} placeholder="Örn: 2 Yaş" className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-4 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm text-center" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 w-full">
                                            <div className="flex-1">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Cinsiyet</label>
                                                <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-4 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                    <option value="Erkek">Erkek</option>
                                                    <option value="Dişi">Dişi</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Kısır Mı?</label>
                                                <select value={newPetNeutered} onChange={e => setNewPetNeutered(e.target.value)} className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-4 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                    <option value="Evet">Evet</option>
                                                    <option value="Hayır">Hayır</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Boyut</label>
                                                <select value={newPetSize} onChange={e => setNewPetSize(e.target.value)} className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-4 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                    <option value="Küçük">Küçük</option>
                                                    <option value="Orta">Orta</option>
                                                    <option value="Büyük">Büyük</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button onClick={() => setAddPetStep(2)} disabled={!newPetName || !newPetBreed} className="w-full py-4 mt-4 bg-white rounded-2xl font-black text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                            Sonraki Adım
                                        </button>
                                    </motion.div>
                                )}

                                {addPetStep === 2 && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-4 max-w-sm">
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-orange-400 text-sm font-bold mb-1">Tıbbi & Fiziksel İşaretler</h4>
                                                <p className="text-[11px] text-orange-200/80 leading-relaxed font-medium">Bu bilgiler, kayıp durumunda sizi temsil edecek Acil QR Sayfasında (SOS) hayati önem taşır. Doğru girmeye özen gösterin.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Sağlık & Alerji (Kritik!)</label>
                                            <textarea value={newPetHealth} onChange={e => setNewPetHealth(e.target.value)} placeholder="Örn: Tavuk alerjisi var, lütfen tavuklu mama vermeyin!" className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl px-5 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-red-500 transition-colors font-medium text-sm h-20 resize-none shadow-[0_0_15px_rgba(239,68,68,0.1) inset]" />
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Ayırt Edici Özellikleri</label>
                                            <textarea value={newPetFeatures} onChange={e => setNewPetFeatures(e.target.value)} placeholder="Örn: Sol kulağındaki hafif kesik, kuyruk ucu beyaz..." className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Karakteri (Bulan Kişiye Tavsiye)</label>
                                            <textarea value={newPetCharacter} onChange={e => setNewPetCharacter(e.target.value)} placeholder="Örn: Çok uysaldır ancak ani seslerden korkup kaçabilir." className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--foreground)] mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                        </div>

                                        <button onClick={() => setAddPetStep(3)} className="w-full py-4 mt-4 bg-white rounded-2xl font-black text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                            Sonraki Adım
                                        </button>
                                    </motion.div>
                                )}

                                {addPetStep === 3 && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-5 max-w-sm">

                                        <div>
                                            <label className="text-[11px] text-[var(--secondary-text)] font-bold ml-3 uppercase tracking-wider">Mikroçip Numarası</label>
                                            <div className="relative mt-1">
                                                <input type="text" value={newPetMicrochip} onChange={e => setNewPetMicrochip(e.target.value)} placeholder="TR-000000000" className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-[var(--foreground)] outline-none focus:border-cyan-400 transition-colors font-mono tracking-widest text-sm" />
                                                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--secondary-text)]" />
                                            </div>
                                            <p className="text-[10px] text-[var(--secondary-text)] ml-3 mt-1.5 font-medium">Veteriner sorgulamaları için resmi numarasını girebilirsiniz. Uygulamada güvenle saklanır.</p>
                                        </div>

                                        <div className="bg-[var(--card-bg)] border border-white/10 rounded-3xl p-5 mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <PhoneCall className={cn("w-5 h-5 transition-colors", newPetShowPhone ? "text-cyan-400" : "text-[var(--secondary-text)]")} />
                                                    <span className="font-bold text-[var(--foreground)] text-sm">Telefonu Göster</span>
                                                </div>
                                                <div
                                                    className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative", newPetShowPhone ? "bg-cyan-500" : "bg-gray-700")}
                                                    onClick={() => setNewPetShowPhone(!newPetShowPhone)}
                                                >
                                                    <motion.div
                                                        animate={{ x: newPetShowPhone ? 24 : 0 }}
                                                        className="w-4 h-4 rounded-full bg-white shadow-md"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-[var(--secondary-text)] leading-relaxed font-medium mt-2">
                                                Eğer "Kayıp Alarmı" verirseniz, Moffi QR kodunuzu okutan kişiler doğrudan sizinle telefon numaranız üzerinden görüşebilir. Kapatırsanız; sadece anonim uygulama-içi mesaj atabilirler.
                                            </p>
                                        </div>

                                        <button
                                            disabled={isSavingPet || !user}
                                            onClick={async () => {
                                                if (!user) return alert("Lütfen önce giriş yapın.");
                                                setIsSavingPet(true);

                                                try {
                                                    // 1. Upload Photos using apiService
                                                    const photoUrls: string[] = [];
                                                    for (const photo of newPetPhotos) {
                                                        const publicUrl = await apiService.uploadMedia(photo.file, 'posts');
                                                        if (publicUrl) photoUrls.push(publicUrl);
                                                    }

                                                    // 2. Add Pet via apiService
                                                    await apiService.addPet({
                                                        name: newPetName,
                                                        type: newPetType,
                                                        breed: newPetBreed,
                                                        age: newPetAge,
                                                        gender: newPetGender,
                                                        is_neutered: newPetNeutered === "Evet",
                                                        size: newPetSize,
                                                        features: newPetFeatures,
                                                        health_notes: newPetHealth,
                                                        character_notes: newPetCharacter,
                                                        microchip_number: newPetMicrochip,
                                                        communication_preference: newPetShowPhone ? 'public_phone' : 'anonymous_only',
                                                        avatar: photoUrls[0] || null,
                                                        image: photoUrls[0] || null,
                                                        images: photoUrls,
                                                    });

                                                    showToast("Hoş Geldin! 🐾", `${newPetName} Moffi ailesine katıldı.`, "success");
                                                    setIsAddPetOpen(false);
                                                    setAddPetStep(1);
                                                    
                                                    // Reset form
                                                    setNewPetName("");
                                                    setNewPetBreed("");
                                                    setNewPetAge("");
                                                    setNewPetPhotos([]);
                                                } catch (err: any) {
                                                    console.error("Pet saving error:", err);
                                                    showToast("Hata", "Dostunuz kaydedilemedi.", "error");
                                                } finally {
                                                    setIsSavingPet(false);
                                                }
                                            }}
                                            className="w-full py-4 mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-[var(--foreground)] shadow-[0_10px_30px_rgba(34,211,238,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                        >
                                            {isSavingPet ? (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>Aileye Ekle & QR Kimlik Oluştur <BadgeCheck className="w-5 h-5" /></>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            <button onClick={() => setIsAddPetOpen(false)} className="w-full text-center py-2 text-sm text-[var(--secondary-text)] font-bold hover:text-[var(--foreground)] transition-colors mt-2">
                                Vazgeç
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UPLOAD NEW POST MODAL */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 shrink-0 border-b border-[var(--card-border)]">
                            <button
                                onClick={() => { setIsUploadModalOpen(false); setUploadImageURL(null); setUploadCaption(''); setUploadMood(null); }}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center -ml-2"
                            >
                                <X className="w-5 h-5 text-[var(--foreground)]" />
                            </button>
                            <h2 className="text-xl font-black text-[var(--foreground)]">Yeni Gönderi</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 pb-32 flex flex-col gap-6">

                            {/* PREVIEW */}
                            {uploadImageURL && (
                                <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 relative shadow-2xl">
                                    <img src={uploadImageURL} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        {uploadMood && (
                                            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[var(--foreground)] border border-white/20">
                                                {uploadMood}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* CAPTION */}
                            <div className="bg-[var(--card-bg)] border border-white/10 rounded-3xl p-4 flex gap-4">
                                <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300" className="w-10 h-10 rounded-full shrink-0" />
                                <textarea
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    placeholder="Bu harika anı anlat..."
                                    className="w-full bg-transparent outline-none text-[var(--foreground)] resize-none h-24 text-sm mt-1"
                                />
                            </div>

                            {/* MOOD SELECTOR (Apple Style Pills) */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[var(--foreground)]/60 text-[11px] font-bold uppercase tracking-widest px-1">Ruh Hali (İsteğe Bağlı)</span>
                                <div className="w-full overflow-x-auto no-scrollbar flex gap-2 pb-2">
                                    {MOOD_OPTIONS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => setUploadMood(uploadMood === mood ? null : mood)}
                                            className={cn(
                                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                uploadMood === mood ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-[var(--card-bg)] border-white/10 text-[var(--foreground)] hover:bg-white/10"
                                            )}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* LOCATION TOGGLE */}
                            <div className="flex items-center justify-between bg-[var(--card-bg)] border border-white/10 rounded-3xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[var(--foreground)] font-bold text-sm">Konum Bilgisini Ekle</p>
                                        <p className="text-[var(--secondary-text)] text-xs">Açmadığınız sürece gizli kalır.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUploadLocationEnabled(!uploadLocationEnabled)}
                                    className={cn("w-12 h-7 rounded-full transition-colors flex items-center px-1 duration-300", uploadLocationEnabled ? "bg-cyan-500" : "bg-white/20")}
                                >
                                    <div className={cn("w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300", uploadLocationEnabled ? "translate-x-5" : "translate-x-0")} />
                                </button>
                            </div>

                            {/* PUBLISH BUTTON */}
                            <button
                                onClick={publishPost}
                                disabled={isPublishing}
                                className={cn("w-full py-4 mt-auto rounded-full font-black text-[var(--foreground)] flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(34,211,238,0.3)] transition-all", isPublishing ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-[1.02] active:scale-95")}
                            >
                                {isPublishing ? (
                                    <span className="animate-pulse">Yükleniyor...</span>
                                ) : (
                                    <><Send className="w-5 h-5" /> Paylaş</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT POST MODAL */}
            <AnimatePresence>
                {editingPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[505] bg-black/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 shrink-0 border-b border-[var(--card-border)]">
                            <button
                                onClick={() => setEditingPost(null)}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center -ml-2 text-[var(--foreground)] hover:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black text-[var(--foreground)]">Gönderiyi Düzenle</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 pb-32 flex flex-col gap-6">

                            {/* PREVIEW */}
                            <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 relative shadow-2xl">
                                <img src={editingPost.media} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {editingPost.mood && (
                                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[var(--foreground)] border border-white/20">
                                            {editingPost.mood}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CAPTION */}
                            <div className="bg-[var(--card-bg)] border border-white/10 rounded-3xl p-4 flex gap-4">
                                <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} className="w-10 h-10 rounded-full shrink-0" />
                                <textarea
                                    value={editingPost.desc}
                                    onChange={(e) => setEditingPost({ ...editingPost, desc: e.target.value })}
                                    placeholder="Bu harika anı anlat..."
                                    className="w-full bg-transparent outline-none text-[var(--foreground)] resize-none h-24 text-sm mt-1"
                                />
                            </div>

                            {/* MOOD SELECTOR */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[var(--foreground)]/60 text-[11px] font-bold uppercase tracking-widest px-1">Ruh Hali (İsteğe Bağlı)</span>
                                <div className="w-full overflow-x-auto no-scrollbar flex gap-2 pb-2">
                                    {MOOD_OPTIONS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => setEditingPost({ ...editingPost, mood: editingPost.mood === mood ? null : mood })}
                                            className={cn(
                                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                editingPost.mood === mood ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-[var(--card-bg)] border-white/10 text-[var(--foreground)] hover:bg-white/10"
                                            )}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SAVE BUTTON */}
                            <button
                                onClick={saveEditPost}
                                disabled={isPublishing}
                                className={cn("w-full py-4 mt-auto rounded-full font-black text-[var(--foreground)] flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(34,211,238,0.3)] transition-all", isPublishing ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-[1.02] active:scale-95")}
                            >
                                {isPublishing ? (
                                    <span className="animate-pulse">Kaydediliyor...</span>
                                ) : (
                                    <><Edit2 className="w-5 h-5" /> Kaydet</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* APPLE STYLE DELETE CONFIRMATION ALERT (CENTERED DIALOG) */}
            <AnimatePresence>
                {postToDelete !== null && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[270] bg-black/60 backdrop-blur-sm"
                            onClick={() => setPostToDelete(null)}
                        />
                        {/* Elegant iOS-like Center Alert Popup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 z-[140] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-[280px] bg-[#252528]/95 backdrop-blur-xl rounded-3xl overflow-hidden pointer-events-auto shadow-2xl border border-white/10 flex flex-col">
                                <div className="p-6 flex flex-col items-center text-center gap-2 border-b border-white/10">
                                    <h3 className="text-[var(--foreground)] text-base font-bold">Gönderiyi Sil</h3>
                                    <p className="text-[var(--foreground)]/70 text-sm leading-snug">Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                                </div>
                                <div className="flex flex-col">
                                    <button
                                        onClick={deletePost}
                                        className="w-full py-3.5 text-red-500 font-bold text-[15px] border-b border-white/10 hover:bg-[var(--card-bg)] transition-colors active:bg-white/10"
                                    >
                                        Sil
                                    </button>
                                    <button
                                        onClick={() => setPostToDelete(null)}
                                        className="w-full py-3.5 text-cyan-500 font-normal text-[15px] hover:bg-[var(--card-bg)] transition-colors active:bg-white/10"
                                    >
                                        Vazgeç
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* LOST AD (SOS) MODAL */}
            <AnimatePresence>
                {isLostAdModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[280] bg-[var(--background)] flex flex-col pt-12 text-[var(--foreground)]"
                    >
                        {/* Emergency Header */}
                        <div className="flex justify-between items-center px-6 pb-4 border-b border-red-500/20">
                            <button
                                onClick={() => setIsLostAdModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-[var(--card-bg)] flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-[var(--foreground)]" />
                            </button>
                            <h2 className="text-lg font-black text-red-500 tracking-wider">ACİL DURUM İLANI</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-6 space-y-6">

                            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
                                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Çevredeki Herkesi Uyar!</h3>
                                <p className="text-sm text-red-500 font-medium leading-relaxed">
                                    Kaybolan dostunuzun bilgilerini girdiğinizde, 5 km çapındaki tüm Moffi üyelerine anında acil durum (SOS) bildirimi gönderilecektir.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary-text)] ml-1 uppercase tracking-wider">İsmi</label>
                                    <input value={lostPetName} onChange={e => setLostPetName(e.target.value)} type="text" placeholder="Örn: Buster" className="w-full mt-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl py-4 px-5 text-[var(--foreground)] outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary-text)] ml-1 uppercase tracking-wider">Cinsi / Türü</label>
                                    <input value={lostPetBreed} onChange={e => setLostPetBreed(e.target.value)} type="text" placeholder="Örn: Golden Retriever" className="w-full mt-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl py-4 px-5 text-[var(--foreground)] outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary-text)] ml-1 uppercase tracking-wider">En Son Görüldüğü Yer</label>
                                    <input value={lostPetLocation} onChange={e => setLostPetLocation(e.target.value)} type="text" placeholder="Örn: Kadıköy Moda Sahili" className="w-full mt-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl py-4 px-5 text-[var(--foreground)] outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[var(--secondary-text)] ml-1 uppercase tracking-wider">Detaylar / İletişim Notu</label>
                                    <textarea value={lostPetDesc} onChange={e => setLostPetDesc(e.target.value)} placeholder="Tasma rengi, belirgin özelliği veya ek iletişim bilgileriniz..." className="w-full mt-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl py-4 px-5 text-[var(--foreground)] outline-none focus:border-red-500 transition-colors resize-none h-24" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-xs font-bold text-[var(--secondary-text)] uppercase tracking-wider">Fotoğraflar</label>
                                        <button onClick={() => sosInputRef.current?.click()} className="text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 font-bold hover:bg-red-500/20 transition-all uppercase tracking-tighter flex items-center gap-1">
                                            <Camera className="w-3 h-3" /> Fotoğraf Ekle
                                        </button>
                                        <input type="file" ref={sosInputRef} className="hidden" accept="image/*" multiple onChange={handleSosImageSelect} />
                                    </div>

                                    {lostPetPhotos.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-3">
                                            {lostPetPhotos.map((photo, idx) => (
                                                <div key={idx} className="aspect-square rounded-xl bg-[var(--card-bg)] border border-white/10 relative overflow-hidden group">
                                                    <img src={photo.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <button
                                                        onClick={() => setLostPetPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {lostPetPhotos.length < 4 && (
                                                <button
                                                    onClick={() => sosInputRef.current?.click()}
                                                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[var(--secondary-text)] hover:border-red-500/50 hover:text-red-500 transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => sosInputRef.current?.click()}
                                            className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-[var(--secondary-text)] hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
                                        >
                                            <Camera className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-xs font-bold">Fotoğraf Ekle</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Button */}
                        <div className="p-6 border-t border-red-500/20 bg-[var(--background)] shrink-0">
                            <button
                                onClick={submitSos}
                                disabled={isSubmittingSOS}
                                className={cn("w-full py-4 rounded-2xl font-black text-[var(--foreground)] text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all", isSubmittingSOS ? "bg-red-800 cursor-not-allowed" : "bg-red-600 active:scale-95")}
                            >
                                {isSubmittingSOS ? (
                                    <span className="animate-pulse">Sinyal İletiliyor...</span>
                                ) : (
                                    <><Activity className="w-5 h-5 animate-pulse" /> S.O.S Sinyali Gönder</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* IMMERSIVE LOST PET DETAIL MODAL */}
            <AnimatePresence>
                {selectedLostPet && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[290] bg-black text-[var(--foreground)] flex flex-col"
                    >
                        {/* Immersive Media Header */}
                        <div className="relative w-full h-[55vh] shrink-0 bg-gray-900 overflow-hidden">
                            {selectedLostPet.media_url ? (
                                <img src={selectedLostPet.media_url} className="w-full h-full object-cover opacity-90 transition-all duration-500" />
                            ) : (
                                <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center bg-red-950/30">
                                    <MapPin className="w-20 h-20 text-red-500/20" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/40 to-transparent pointer-events-none" />

                            {/* Multi-photo switcher if available */}
                            {selectedLostPet.images && selectedLostPet.images.length > 1 && (
                                <div className="absolute bottom-24 left-6 flex gap-2 z-20 overflow-x-auto no-scrollbar max-w-[calc(100%-48px)] pb-1">
                                    {selectedLostPet.images.map((url: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedLostPet({ ...selectedLostPet, media_url: url })}
                                            className={cn(
                                                "w-12 h-12 rounded-xl border-2 overflow-hidden shrink-0 transition-all",
                                                selectedLostPet.media_url === url ? "border-red-500 scale-105" : "border-white/10 opacity-60"
                                            )}
                                        >
                                            <img src={url} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Floating Top Nav */}
                            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                                <button
                                    onClick={() => setSelectedLostPet(null)}
                                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95"
                                >
                                    <ChevronLeft className="w-6 h-6 text-[var(--foreground)]" />
                                </button>
                                <div className="flex gap-3">
                                    <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95" onClick={() => alert("SOS İlanı Paylaşılıyor...")}>
                                        <Share2 className="w-5 h-5 text-[var(--foreground)]" />
                                    </button>
                                </div>
                            </div>

                            {/* Hero Text */}
                            <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-black text-[var(--foreground)] tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                        KAYIP İLANI
                                    </span>
                                    <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[var(--foreground)] border border-white/10">
                                        {new Date(selectedLostPet.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight drop-shadow-xl flex items-center gap-3">
                                    {selectedLostPet.pet_name}
                                </h1>
                                <p className="text-gray-300 text-lg font-medium drop-shadow-md">{selectedLostPet.pet_breed || "Belirtilmedi"}</p>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 bg-[var(--background)] overflow-y-auto no-scrollbar pb-32">
                            <div className="p-6 space-y-8 max-w-lg mx-auto">

                                {/* Info Cards Row */}
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-1.5 shadow-lg">
                                        <MapPin className="w-6 h-6 text-red-400 mb-1" />
                                        <span className="text-[10px] text-[var(--secondary-text)] font-bold uppercase tracking-wider">Son Görülen Yer</span>
                                        <span className="text-sm text-[var(--foreground)] font-bold leading-tight">{selectedLostPet.last_location}</span>
                                    </div>
                                    <div className="flex-1 bg-[var(--card-bg)] border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-1.5 shadow-lg">
                                        <User className="w-6 h-6 text-blue-400 mb-1" />
                                        <span className="text-[10px] text-[var(--secondary-text)] font-bold uppercase tracking-wider">İlan Sahibi</span>
                                        <span className="text-sm text-[var(--foreground)] font-bold leading-tight line-clamp-1 truncate w-full">{selectedLostPet.author_name}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-black text-[var(--foreground)] mb-3">Detaylar</h3>
                                    <p className="text-gray-300 leading-relaxed font-medium">
                                        {selectedLostPet.description || "Ek detay girilmemiş."}
                                    </p>
                                </div>

                                {/* Warning Box */}
                                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl">
                                    <p className="text-red-400 text-sm font-medium">
                                        Eğer bu dostumuzu görüyorsanız lütfen ani hareketler yapmadan, nazikçe yaklaşın ve acil durum olarak iletişime geçin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Solid Action Bar Bottom */}
                        <div className="absolute inset-x-0 bottom-0 bg-[var(--background)] border-t border-[var(--card-border)] p-6 pb-8 shrink-0 flex gap-4">
                            <button className="flex-1 py-4 rounded-2xl bg-cyan-500 text-black font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform" onClick={handleMessageOwner}>
                                <MessageCircle className="w-5 h-5" /> Sahibine Mesaj At
                            </button>
                            <button disabled={isReportingLocation} className={cn("flex-1 py-4 rounded-2xl border border-white/20 font-black text-base flex items-center justify-center gap-2 transition-transform", isReportingLocation ? "bg-white/20 text-[var(--secondary-text)] cursor-not-allowed" : "bg-white/10 text-[var(--foreground)] hover:bg-white/20 active:scale-95")} onClick={handleReportLocation}>
                                {isReportingLocation ? <Activity className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5 text-red-500" />} {isReportingLocation ? "Bulunuyor..." : "Onu Gördüm!"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SECURE ANON COMMUNICATION MODAL */}
            <AnimatePresence>
                {anonModalType && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setAnonModalType(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[var(--card-bg)] rounded-[2rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 pb-4 border-b border-[var(--card-border)] flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 ring-4 ring-blue-500/10">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--foreground)] text-center">
                                    {anonModalType === 'report' ? "Gizli İhbar Yap" : "Anonim Mesaj Gönder"}
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-[var(--secondary-text)] text-sm font-medium leading-relaxed text-center">
                                    Moffi KVKK yükümlülükleri gereğince, iletişim bilgileriniz, gerçek adınız veya net GPS konumunuz {selectedLostPet?.author_name} kullanıcısı ile <strong className="text-[var(--foreground)]">asla paylaşılmayacaktır.</strong>
                                </p>

                                <div className="bg-red-500/10 border-l-2 border-red-500 p-3 rounded-r-lg">
                                    <p className="text-xs text-red-400">
                                        Güvenliğiniz için lütfen buluşma tekliflerini doğrudan kabul etmeyin. Eğer kayıp dostumuzu bulursanız, teslimatı her iki taraf için de kalabalık bir alanda (Örn: Veteriner veya Polis Merkezi) gerçekleştirin.
                                    </p>
                                </div>

                                {anonError && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold border border-red-500/50">
                                        <Activity className="w-4 h-4 inline-block mr-1 mb-0.5" /> {anonError}
                                    </motion.div>
                                )}

                                <div className="relative">
                                    <textarea
                                        value={anonMessage}
                                        onChange={e => {
                                            setAnonMessage(e.target.value);
                                            if (anonError) setAnonError(null);
                                        }}
                                        placeholder={anonModalType === 'report' ? "Hangi bölgede gördünüz? (Sadece sokak, park veya mekan adı)" : "Mesajınız (Numaranız veya isminiz gizli kalacaktır)..."}
                                        className={cn("w-full bg-[var(--background)] border rounded-xl p-4 text-[var(--foreground)] text-sm outline-none transition-colors h-28 resize-none", anonError ? "border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 focus:border-cyan-500")}
                                    />
                                    {anonError && (
                                        <div className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full animate-bounce">
                                            <Lock className="w-3 h-3 text-[var(--foreground)]" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setAnonModalType(null); setAnonError(null); }}
                                        className="flex-1 py-3 rounded-xl bg-[var(--card-bg)] text-[var(--secondary-text)] font-bold hover:bg-white/10 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        disabled={isSubmittingAnon || !anonMessage.trim()}
                                        onClick={submitAnonAction}
                                        className={cn("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", (!anonMessage.trim() || isSubmittingAnon) ? "bg-cyan-900 text-cyan-500/50 cursor-not-allowed" : "bg-cyan-500 text-black active:scale-95")}
                                    >
                                        {isSubmittingAnon ? "Gönderiliyor..." : "Güvenli Gönder"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* INBOX (MESSAGES) MODAL */}
            <AnimatePresence>
                {isInboxOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="fixed inset-0 z-50 flex flex-col sm:pb-0"
                        style={{ background: 'var(--background)' }}
                    >
                        <div 
                            className="px-5 pt-14 pb-3 flex items-center justify-between backdrop-blur-xl shrink-0 z-10 sticky top-0 border-b border-white/10"
                            style={{ background: 'var(--card-bg)' }}
                        >
                            <h2 className="text-[22px] font-bold flex items-center gap-1 tracking-tight">
                                {activeChatUserId ? (
                                    <button onClick={() => setActiveChatUserId(null)} className="flex items-center gap-0.5 active:scale-95 transition-transform">
                                        <ChevronLeft className="w-8 h-8 text-[#0A84FF] -ml-2" strokeWidth={2.5} />
                                    </button>
                                ) : (
                                    <span className={cn(inboxTab === 'sos' && "text-red-500 flex items-center gap-2")}>
                                        {inboxTab === 'sos' ? <><ShieldAlert className="w-6 h-6" /> Acil İhbarlar</> : "Mesajlar"}
                                    </span>
                                )}
                                {activeChatUserId && (
                                    <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center mb-0.5 shadow-sm border border-white/10 text-xs">
                                            {activeChatUserId === user?.id ? <Activity className="w-4 h-4 text-[var(--foreground)]" /> : <User className="w-4 h-4 text-[var(--foreground)]" />}
                                        </div>
                                        <span className="text-[12px] font-medium tracking-tight text-[#E5E5EA]">{activeChatUserId === user?.id ? "Siz" : "Anonim"}</span>
                                        <span className="text-[10px] text-[var(--secondary-text)] font-medium -mt-0.5"><ChevronRight className="w-3 h-3 inline pb-0.5" /></span>
                                    </div>
                                )}
                            </h2>
                            {!activeChatUserId && (
                                <button onClick={() => setIsInboxOpen(false)} className="px-2 py-1 text-[#0A84FF] text-[17px] font-medium active:opacity-60 transition-opacity">
                                    Bitti
                                </button>
                            )}
                        </div>

                        {!activeChatUserId && inboxTab === 'chats' && (
                            // CHAT LIST (CONVERSATIONS)
                            <div onScroll={handleInboxScroll} className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
                                {chatGroups.length > 0 ? (
                                    chatGroups.map(([otherId, msgs]) => {
                                        const visibleMsgs = msgs.filter((m: any) => m.content !== '[SYSTEM_ACCEPT]');
                                        if (visibleMsgs.length === 0) return null;
                                        const lastMsg = visibleMsgs[visibleMsgs.length - 1];
                                        const isUnread = lastMsg.receiver_id === user?.id && !lastMsg.read_status;
                                        const isSelf = otherId === user?.id;

                                        return (
                                            <button
                                                key={otherId}
                                                onClick={() => { setActiveChatUserId(otherId); markMessagesAsRead(otherId); }}
                                                className="flex items-center gap-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] active:bg-white/10 px-2 rounded-2xl transition-all text-left w-full"
                                            >
                                                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl font-bold shadow-lg shrink-0 border border-white/10">
                                                    {isSelf ? <Activity className="w-6 h-6 text-cyan-400" /> : <User className="w-6 h-6 text-[var(--foreground)]" />}
                                                    {isUnread && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-[var(--background)] rounded-full animate-pulse" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className="font-bold text-[17px] text-[var(--foreground)]/95 truncate">{isSelf ? "Test: Kendimle Sohbet" : "Anonim Kullanıcı"}</h4>
                                                        <span className="text-sm font-medium text-[var(--secondary-text)]">{new Date(lastMsg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-80">
                                                        {lastMsg.sender_id === user?.id && (
                                                            lastMsg.read_status ? <CheckCheck className="w-4 h-4 text-blue-500 shrink-0" /> : <Check className="w-4 h-4 text-[var(--secondary-text)] shrink-0" />
                                                        )}
                                                        <p className={cn("text-[15px] truncate", isUnread ? "text-[var(--foreground)] font-semibold" : "text-[var(--secondary-text)] font-medium")}>
                                                            {lastMsg.sender_id === user?.id ? "Siz: " : ""}{lastMsg.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
                                        <MessageCircle className="w-16 h-16 mb-4 stroke-1 text-[var(--secondary-text)]" />
                                        <h3 className="text-xl font-bold mb-2">Henüz Sohbetiniz Yok</h3>
                                        <p className="text-[15px] max-w-xs text-[var(--secondary-text)]">Keşfet ekranındaki diğer evcil dostlar ile mesajlaştığınızda burada görünecektir.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!activeChatUserId && inboxTab === 'sos' && (
                            // SOS ALERTS LIST
                            <div onScroll={handleInboxScroll} className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
                                    <h4 className="text-red-400 font-bold flex items-center gap-2 mb-1"><ShieldAlert className="w-5 h-5" /> Acil İhbar Hattı</h4>
                                    <p className="text-xs text-[var(--secondary-text)] leading-relaxed font-medium">Bu ekranda sadece Pet-ID (QR Kod) üzerinden size gelen anonim ihbarlar, son görüldü konumları ve acil mesajlar listelenir. Sıradan mesajlar buraya düşmez.</p>
                                </div>

                                {sosAlerts.length > 0 ? (
                                    sosAlerts.map(alert => {
                                        const seenArea = alert.seen_area || alert.location || alert.last_seen_location || '';
                                        const isMessage = seenArea.startsWith('[MESAJ]');
                                        const petName = alert.name || alert.pet_name || 'İsimsiz Dost';
                                        return (
                                            <div key={alert.id} className="bg-[var(--card-bg)] border border-red-500/10 p-4 rounded-2xl flex items-start gap-4 shadow-lg shadow-black/40">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", isMessage ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-red-500/10 border-red-500/40 text-red-500")}>
                                                    {isMessage ? <MessageCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className={cn("text-[15px] font-bold", isMessage ? "text-blue-400" : "text-red-500")}>{petName} için <span className="opacity-80 font-medium">{isMessage ? "Mesaj" : "İhbar"}</span></h4>
                                                        <span className="text-[11px] text-[var(--secondary-text)] font-medium">{new Date(alert.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-[var(--foreground)]/90 leading-relaxed mt-1">
                                                        {seenArea.replace(/\[.*?\]\s*/, '')}
                                                    </p>
                                                    {!isMessage && (
                                                        <button className="text-[11px] font-bold text-red-400 mt-2.5 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 active:scale-95 transition-transform inline-flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3" /> Haritada Gör
                                                        </button>
                                                    )}
                                                    {isMessage && (
                                                        <button className="text-[11px] font-bold text-blue-400 mt-2.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 active:scale-95 transition-transform inline-flex items-center gap-1.5">
                                                            <MessageCircle className="w-3 h-3" /> Hemen Yanıtla
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                            <AlertTriangle className="w-8 h-8 text-red-500/50" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]/50">İhbar Kaydı Bulunamadı</h3>
                                        <p className="text-[14px] text-[var(--secondary-text)] font-medium">Şu ana kadar QR kodunuz üzerinden herhangi bir kayıp/ihbar logu iletilmemiş. İyi haber!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeChatUserId && (
                            // ACTIVE CHAT THREAD (iMessage BUBBLES)
                            <>
                                <div onScroll={handleInboxScroll} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
                                    {(() => {
                                        const rawThread = chatGroups.find(g => g[0] === activeChatUserId)?.[1] || [];
                                        const threadMsgs = rawThread.filter((m: any) => m.content !== '[SYSTEM_ACCEPT]');
                                        return threadMsgs.map((msg: any) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("max-w-[80%] flex flex-col gap-1 group/msg", isMe ? "self-end" : "self-start")}>
                                                    <div className={cn(
                                                        "px-4 py-2 text-[15.5px] font-medium leading-[1.35] max-w-full break-words shadow-sm relative transition-all",
                                                        isMe ? "bg-[#2C2C2E] text-[var(--foreground)] rounded-[22px] rounded-br-[6px]" : "bg-[#1C1C1E] text-[#E5E5EA] border border-[var(--card-border)] rounded-[22px] rounded-bl-[6px]",
                                                        editingMessageId === msg.id && "ring-2 ring-white/40 ring-offset-2 ring-offset-black scale-[1.02]"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <div className={cn("flex items-center gap-1.5 px-1 relative", isMe ? "justify-end" : "justify-start")}>
                                                        {msg.is_edited && <span className="text-[10px] text-[var(--secondary-text)] font-medium opacity-80">Düzenlendi</span>}
                                                        <span className="text-[11px] font-semibold text-[var(--secondary-text)]">
                                                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            msg.read_status ? <CheckCheck className="w-3.5 h-3.5 text-[#E5E5EA]" strokeWidth={2.5} /> : <Check className="w-3.5 h-3.5 text-[var(--secondary-text)]" strokeWidth={2.5} />
                                                        )}
                                                        {isMe && (
                                                            <div className="relative flex items-center">
                                                                <button onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100 peer ml-0.5">
                                                                    <MoreHorizontal className="w-4 h-4 text-[var(--secondary-text)] hover:text-[var(--foreground)] transition-colors" />
                                                                </button>
                                                                {activeMessageMenuId === msg.id && (
                                                                    <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#2C2C2E] rounded-xl shadow-xl border border-white/10 py-1.5 z-50 flex flex-col drop-shadow-2xl backdrop-blur-3xl">
                                                                        <button onClick={() => startEditingMessage(msg.id, msg.content)} className="px-4 py-2 text-left text-[14px] text-[var(--foreground)] hover:bg-white/10 transition-colors flex items-center justify-between font-medium">Düzenle <Edit2 className="w-3.5 h-3.5 opacity-70" /></button>
                                                                        <div className="h-[1px] bg-white/10 w-full my-1" />
                                                                        <button onClick={() => handleDeleteMessage(msg.id)} className="px-4 py-2 text-left text-[14px] text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-between font-medium">Geri Al <Trash2 className="w-3.5 h-3.5 opacity-70" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    })()}
                                    <div ref={messagesEndRef} className="h-2" />
                                </div>

                                {/* Thread Reply Input Box OR Accept Chat Request Block */}
                                {(() => {
                                    const rawThread = chatGroups.find(g => g[0] === activeChatUserId)?.[1] || [];
                                    const iHaveReplied = rawThread.some((m: any) => m.sender_id === user?.id);
                                    const isPending = !iHaveReplied && rawThread.length > 0;

                                    if (isPending) {
                                        return (
                                            <div className="p-4 bg-[#1C1C1E] flex flex-col items-center gap-4 shrink-0 pb-8 snap-start border-t border-[#2C2C2E]/50">
                                                <p className="text-[13px] text-[#8E8E93] font-medium text-center">Bu kişiyle iletişime geçmek için mesaj isteğini onaylayın.</p>
                                                <div className="flex w-full gap-3">
                                                    <button onClick={() => setIsInboxOpen(false)} className="flex-1 py-3 rounded-[14px] bg-[#2C2C2E] text-[var(--foreground)] font-semibold active:opacity-70 transition-opacity">
                                                        Yoksay
                                                    </button>
                                                    <button onClick={handleAcceptChat} className="flex-1 py-3 rounded-[14px] bg-white text-black font-semibold active:opacity-70 transition-opacity shadow-sm">
                                                        Onayla
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="relative p-3 bg-black/95 flex items-end gap-3 shrink-0 pb-7 snap-start backdrop-blur-2xl border-t border-[var(--card-border)]">
                                            {/* Plus / X Button */}
                                            <button
                                                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                                                className={cn("w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300",
                                                    isAttachMenuOpen ? "bg-white/10 text-[var(--foreground)] rotate-45" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                                                )}>
                                                <Plus className="w-7 h-7" strokeWidth={2} />
                                            </button>

                                            {/* Attach Menu Slide Up */}
                                            <AnimatePresence>
                                                {isAttachMenuOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                                                        className="absolute bottom-full left-3 mb-2 w-[220px] bg-[#2C2C2E] rounded-[24px] shadow-2xl border border-white/10 p-2 z-50 flex flex-col gap-1 backdrop-blur-3xl overflow-hidden"
                                                    >
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Kamera entegrasyonu ekleniyor."); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-white/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform"><Camera className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-[var(--foreground)]/95">Kamera</span>
                                                        </button>
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Fotoğraf galerisi erişimi ekleniyor."); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-white/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform"><ImageIcon className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-[var(--foreground)]/95">Fotoğraflar</span>
                                                        </button>
                                                        <div className="h-[1px] bg-[var(--card-bg)] my-1 w-full" />
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Harita üzerinden konum paylaşımı ekleniyor."); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-white/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-[var(--foreground)]/95">Konum Paylaş</span>
                                                        </button>
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Acil SOS konum paylaşımı ekleniyor.", "error"); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-red-500/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform"><Flame className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-red-400">Hızlı SOS Gönder</span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="flex-1 bg-[#1C1C1E] border border-[#2C2C2E] rounded-[20px] flex items-end min-h-[36px] p-1 pr-1.5 transition-colors">
                                                <input
                                                    type="text"
                                                    placeholder="Mesaj..."
                                                    className="flex-1 bg-transparent px-3 py-1 text-[16px] text-[var(--foreground)] outline-none -mt-0.5 placeholder:text-[#8E8E93]"
                                                    value={replyMessage}
                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleReply();
                                                    }}
                                                />
                                                {replyMessage.trim() ? (
                                                    <button
                                                        disabled={isReplying}
                                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 transition-opacity ml-1 mb-0.5 bg-white text-black active:scale-95"
                                                        onClick={handleReply}
                                                    >
                                                        {isReplying ? <div className="w-3.5 h-3.5 border-[2px] border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-[14px] h-[14px] ml-0.5" strokeWidth={2.5} />}
                                                    </button>
                                                ) : (
                                                    <button className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 transition-opacity ml-1 mb-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-white/10">
                                                        <Mic className="w-[16px] h-[16px]" strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD ADOPTION PET MODAL (Apple Bottom Sheet Style) */}
            <AnimatePresence>
                {isAddAdoptionModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex flex-col justify-end"
                    >
                        {/* Blur Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAddAdoptionModalOpen(false)}
                        />

                        {/* Sliding Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full h-[90vh] bg-[var(--card-bg)] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        >
                            {/* Grab Handle */}
                            {/* Grab Handle (Click to close) */}
                            <button 
                                onClick={() => setIsAddAdoptionModalOpen(false)}
                                className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 hover:bg-white/40 transition-colors cursor-pointer"
                            />



                            <div className="p-6 pt-12 pb-4 border-b border-[var(--card-border)] shrink-0 flex items-center gap-4">
                                <button onClick={() => setIsAddAdoptionModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-2">
                                        <HeartHandshake className="w-6 h-6 text-cyan-400" /> Sahiplendirme İlanı Ver
                                    </h2>
                                    <p className="text-xs text-[var(--secondary-text)] mt-1">Dostumuz için en iyi yuvayı bulalım.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                                {/* Photo Upload Apple Style */}
                                <input
                                    type="file"
                                    ref={adoptionPhotoRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const files = e.target.files;
                                        if (files) {
                                            const newPhotos = Array.from(files).map(file => ({
                                                file,
                                                preview: URL.createObjectURL(file)
                                            }));
                                            setAdoptionPetPhotos(prev => [...prev, ...newPhotos]);
                                            if (adoptionPhotoRef.current) adoptionPhotoRef.current.value = '';
                                        }
                                    }}
                                />
                                {adoptionPetPhotos.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3 mb-2">
                                        {adoptionPetPhotos.map((photo, idx) => (
                                            <div key={idx} className="aspect-square rounded-2xl bg-[#1C1C1E] border border-white/10 relative overflow-hidden group">
                                                <img src={photo.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                <button
                                                    onClick={() => setAdoptionPetPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {adoptionPetPhotos.length < 4 && (
                                            <button
                                                onClick={() => adoptionPhotoRef.current?.click()}
                                                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[var(--secondary-text)] hover:border-cyan-400/50 hover:text-cyan-400 transition-all font-bold"
                                            >
                                                <Plus className="w-6 h-6" />
                                                <span className="text-[10px] mt-1">Ekle</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => adoptionPhotoRef.current?.click()}
                                        className="w-full h-52 rounded-3xl bg-[#1C1C1E] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[var(--secondary-text)] hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-colors cursor-pointer group mb-2 shadow-inner overflow-hidden"
                                    >
                                        <Camera className="w-8 h-8 mb-2 group-hover:text-cyan-400 group-hover:scale-110 transition-all drop-shadow-md" />
                                        <span className="text-sm font-bold tracking-wide">Net Fotoğraflar Yükle</span>
                                        <span className="text-[10px] mt-1 text-[var(--secondary-text)] font-medium italic">Sahiplendirme şansını %80 artırır</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--secondary-text)] uppercase tracking-widest ml-1 mb-2 block">Kategori</label>
                                        <div className="flex gap-2 mb-4">
                                            {[
                                                { id: 'cat', label: 'Kedi', icon: '🐱' },
                                                { id: 'dog', label: 'Köpek', icon: '🐶' },
                                                { id: 'bird', label: 'Kuş', icon: '🦜' },
                                                { id: 'other', label: 'Diğer', icon: '🐾' },
                                            ].map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setAdoptionPetType(type.id)}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border",
                                                        adoptionPetType === type.id
                                                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                                                            : "bg-[var(--background)] border-[var(--card-border)] text-[var(--secondary-text)]"
                                                    )}
                                                >
                                                    <span className="text-xl">{type.icon}</span>
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>

                                        <label className="text-xs font-bold text-[var(--secondary-text)] uppercase tracking-widest ml-1 mb-1.5 block">İsim & Tür</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="İsim (Örn: Pamuk)"
                                                value={adoptionPetName}
                                                onChange={(e) => setAdoptionPetName(e.target.value)}
                                                className="w-1/2 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[var(--foreground)] text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-[var(--card-bg)] transition-colors placeholder:text-gray-600"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tür / Irk"
                                                value={adoptionPetBreed}
                                                onChange={(e) => setAdoptionPetBreed(e.target.value)}
                                                className="w-1/2 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[var(--foreground)] text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-[var(--card-bg)] transition-colors placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-[var(--secondary-text)] uppercase tracking-widest ml-1 mb-1.5 block">Yaş & Açıklama</label>
                                        <input
                                            type="text"
                                            placeholder="Yaşı (Örn: 2 Aylık, 3 Yaşında)"
                                            value={adoptionPetAge}
                                            onChange={(e) => setAdoptionPetAge(e.target.value)}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[var(--foreground)] text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-[var(--card-bg)] transition-colors mb-3 placeholder:text-gray-600"
                                        />
                                        <textarea
                                            rows={4}
                                            placeholder="Onu biraz anlatın... Tuvalet eğitimi var mı? Karakteri nasıl?"
                                            value={adoptionPetDesc}
                                            onChange={(e) => setAdoptionPetDesc(e.target.value)}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[var(--foreground)] text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-[var(--card-bg)] transition-colors resize-none placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Alert / Warning Box */}
                                    <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-3xl border border-red-500/20 mt-2">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                        </div>
                                        <p className="text-[11px] text-gray-300 leading-relaxed font-medium mt-0.5">
                                            <span className="text-red-400 font-bold tracking-wide">ÜCRET TALEP ETMEK YASAKTIR.</span> Moffi tamamen ücretsiz sahiplendirme üzerine kuruludur. Canlı satışı veya para talebi tespit edildiğinde hesaplar <strong className="text-[var(--foreground)]">kalıcı olarak</strong> kapatılır.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-3 pb-8 bg-[var(--card-bg)] shrink-0 border-t border-[var(--card-border)] relative z-20">
                                <button
                                    onClick={handleAdoptionPost}
                                    disabled={isSubmittingAdoption}
                                    className="w-full py-4 rounded-full bg-white text-black font-black text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmittingAdoption ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <><CheckCheck className="w-5 h-5" /> İlanı Onaya Gönder</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            {/* APPLE BOTTOM SHEET - ADOPTION DETAY MODAL */}
            <AnimatePresence>
                {selectedAdoptionPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[310] flex flex-col justify-end"
                    >
                        {/* Blur Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedAdoptionPet(null)}
                        />

                        {/* Sliding Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.y > 100 || velocity.y > 500) {
                                    setSelectedAdoptionPet(null);
                                }
                            }}
                            className="relative w-full h-[85vh] bg-[var(--background)] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        >
                            {/* Grab Handle */}
                            {/* Grab Handle (Click to close) */}
                            <button 
                                onClick={() => setSelectedAdoptionPet(null)}
                                className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 hover:bg-white/40 transition-colors cursor-pointer"
                            />



                            {/* Hero Image */}
                            <div className="w-full h-[45%] relative shrink-0">
                                <img src={selectedAdoptionPet.img} className="w-full h-full object-cover transition-all duration-500" />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--background)] to-transparent" />

                                <button 
                                    onClick={() => setSelectedAdoptionPet(null)}
                                    className="absolute top-12 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white z-30 active:scale-90 transition-transform"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>

                                {selectedAdoptionPet.images && selectedAdoptionPet.images.length > 1 && (
                                    <div className="absolute bottom-10 left-6 flex gap-2 z-20 overflow-x-auto no-scrollbar max-w-[calc(100%-48px)] pb-1">
                                        {selectedAdoptionPet.images.map((url: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedAdoptionPet({ ...selectedAdoptionPet, img: url })}
                                                className={cn(
                                                    "w-12 h-12 rounded-xl border-2 overflow-hidden shrink-0 transition-all",
                                                    selectedAdoptionPet.img === url ? "border-cyan-400 scale-105" : "border-white/10 opacity-60"
                                                )}
                                            >
                                                <img src={url} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar px-6 -mt-8 relative z-10">
                                <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{selectedAdoptionPet.breed}</span>
                                <h1 className="text-4xl font-black text-[var(--foreground)] leading-tight mt-1">{selectedAdoptionPet.name}</h1>

                                <div className="flex gap-2 mt-4">
                                    {selectedAdoptionPet.tags?.map((tag: string) => (
                                        <div key={tag} className="bg-[var(--card-bg)] border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                                            <Check className="w-3 h-3 text-cyan-400" /> {tag}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 bg-[var(--card-bg)] rounded-3xl p-5 border border-[var(--card-border)]">
                                    <h3 className="text-[var(--foreground)]/50 text-xs font-bold uppercase tracking-wider mb-2">Hikaye & Durum</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed font-medium">
                                        {selectedAdoptionPet.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Apple iOS Style Floating Action Bar */}
                            <div className="w-full p-6 pt-2 pb-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent relative z-20">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleStartAdoptionChat(selectedAdoptionPet)}
                                        className="flex-1 py-4 rounded-full bg-white/10 border border-white/10 text-[var(--foreground)] font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Mesaj
                                    </button>
                                    <button
                                        onClick={() => setIsApplicationFormOpen(true)}
                                        className="flex-[2] py-4 rounded-full bg-cyan-500 text-black font-black text-[15px] shadow-[0_10px_30px_rgba(34,211,238,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <HeartHandshake className="w-5 h-5" /> Sahiplenme Başvurusu
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setReportingAdId(selectedAdoptionPet?.id || null);
                                        setIsReportAdModalOpen(true);
                                    }}
                                    className="w-full mt-3 py-3 rounded-full bg-red-500/10 text-red-400 font-bold text-[13px] border border-red-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert className="w-4 h-4" /> Ücret Talep Ediyor / İhbar Et
                                </button>
                                <p className="text-[10px] text-[var(--secondary-text)] text-center font-medium mt-2">Moffi Güvenli Mesajlaşma ile verileriniz uçtan uca korunur.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* REPORT ADOPTION AD MODAL (Apple Action Sheet) */}
            <AnimatePresence>
                {isReportAdModalOpen && selectedAdoptionPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[501] flex flex-col justify-end"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setIsReportAdModalOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 250 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.y > 100 || velocity.y > 500) {
                                    setIsReportAdModalOpen(false);
                                }
                            }}
                            className="relative bg-[var(--card-bg)] rounded-t-[2.5rem] p-6 pb-12 border-t border-white/10 z-10"
                        >
                            <button 
                                onClick={() => setIsReportAdModalOpen(false)}
                                className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 hover:bg-white/40 transition-colors cursor-pointer block" 
                            />

                            <div className="flex items-center gap-3 mb-6">
                                <button onClick={() => setIsReportAdModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center ml-1">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-[var(--foreground)] font-black text-lg">İlanı Bildir</h3>
                                    <p className="text-[var(--secondary-text)] text-xs">Moffi ekibi en kısa sürede inceleyecek</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {[
                                    { value: 'fee', label: '💸 Ücret Talep Ediyor', desc: 'Sahiplendirme için para isteniyor' },
                                    { value: 'sale', label: '🏷️ Hayvan Satışı', desc: 'Ticari amaçlı satış ilanı' },
                                    { value: 'fake', label: '❌ Sahte İlan', desc: 'Görsel veya bilgiler gerçek değil' },
                                    { value: 'inappropriate', label: '⚠️ Uygunsuz İçerik', desc: 'Kötü muamele veya şiddet' },
                                    { value: 'other', label: '🔍 Diğer', desc: 'Diğer güvenlik sorunları' }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setReportReason(opt.value)}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left",
                                            reportReason === opt.value ? "bg-red-500/10 border-red-500/30" : "bg-[var(--card-bg)] border-[var(--card-border)]"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <p className="text-[var(--foreground)] font-bold text-sm">{opt.label}</p>
                                            <p className="text-[var(--secondary-text)] text-xs mt-0.5">{opt.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleReportAdoption}
                                disabled={!reportReason || isSubmittingReport}
                                className="w-full py-4 rounded-full bg-red-500 text-[var(--foreground)] font-black text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {isSubmittingReport ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><ShieldAlert className="w-5 h-5" /> Bildirimi Gönder</>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADOPTION APPLICATION FORM MODAL (Apple Style) */}
            <AnimatePresence>
                {isApplicationFormOpen && selectedAdoptionPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] flex flex-col justify-end"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsApplicationFormOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 250 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.y > 100 || velocity.y > 500) {
                                    setIsApplicationFormOpen(false);
                                }
                            }}
                            className="relative bg-[var(--background)] rounded-t-[3rem] p-6 pb-12 border-t border-white/10 z-10 flex flex-col max-h-[90vh]"
                        >
                            <button 
                                onClick={() => setIsApplicationFormOpen(false)}
                                className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 hover:bg-white/40 transition-colors cursor-pointer block" 
                            />

                            <div className="flex items-center gap-4 mb-8">
                                <button onClick={() => setIsApplicationFormOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/10">
                                    <img src={selectedAdoptionPet.img} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-[var(--foreground)] font-black text-xl">{selectedAdoptionPet.name} İçin Başvuru</h3>
                                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">Son Adım: Yuva Olma Formu</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                                <div>
                                    <label className="text-[var(--secondary-text)] text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Evcil Hayvan Tecrübeniz</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['0-2 Yıl', '3-5 Yıl', '5+ Yıl'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setAppExperience(lvl)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[13px] font-bold border transition-all",
                                                    appExperience === lvl ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--secondary-text)]"
                                                )}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[var(--secondary-text)] text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Yaşam Alanınız</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Apartman', 'Müstakil', 'Bahçeli'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setAppHomeType(type)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[13px] font-bold border transition-all",
                                                    appHomeType === type ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--secondary-text)]"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[var(--secondary-text)] text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Kendinizden Bahsedin</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Neden onu sahiplenmek istiyorsunuz? Ona nasıl bir hayat sunacaksınız?"
                                        value={appNote}
                                        onChange={(e) => setAppNote(e.target.value)}
                                        className="w-full bg-[var(--card-bg)] border border-white/10 rounded-2xl px-5 py-4 text-[var(--foreground)] text-[15px] focus:outline-none focus:border-cyan-400 transition-colors resize-none placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-4 flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-[var(--secondary-text)] leading-relaxed">
                                        Moffi, sahiplendirme sürecinde aracıdır. Başvurunuz ilan sahibine iletilir. Kişisel güvenliğiniz için buluşmaları halka açık yerlerde gerçekleştirmenizi öneririz.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={submitAdoptionApplication}
                                disabled={!appNote.trim() || isSubmittingApp}
                                className="w-full mt-8 py-4 rounded-full bg-cyan-500 text-black font-black text-[16px] shadow-[0_15px_40px_rgba(34,211,238,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {isSubmittingApp ? (
                                    <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <><CheckCheck className="w-5 h-5" /> Başvuruyu Tamamla</>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DEDICATED ADOPTION CHAT (Apple iMessage Style) */}
            <AnimatePresence>
                {isAdoptionChatOpen && adoptionChatPet && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 z-[500] bg-black flex flex-col"
                    >
                        {/* Header */}
                        <div className="pt-12 pb-4 px-4 bg-black/80 backdrop-blur-xl border-b border-[var(--card-border)] flex items-center gap-3">
                            <button onClick={() => setIsAdoptionChatOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--secondary-text)] hover:text-[var(--foreground)] transition-colors">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <img src={adoptionChatPet.img} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                <div>
                                    <h3 className="text-[var(--foreground)] font-bold text-sm leading-tight">{adoptionChatPet.name} İlanı</h3>
                                    <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Sahiplendirme Süreci Aktif
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                            {adoptionMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn(
                                        "max-w-[80%] flex flex-col",
                                        msg.sender === 'me' ? "ml-auto items-end" : msg.sender === 'system' ? "mx-auto items-center" : "mr-auto items-start"
                                    )}
                                >
                                    {msg.sender === 'system' ? (
                                        <div className="bg-[var(--card-bg)] border border-white/10 rounded-2xl px-4 py-2 text-[11px] text-[var(--secondary-text)] text-center leading-relaxed">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={cn(
                                                "px-4 py-2.5 rounded-2xl text-[14px] font-medium leading-[1.4]",
                                                msg.sender === 'me' ? "bg-cyan-500 text-[var(--foreground)] rounded-tr-sm" : "bg-[#1C1C1E] text-[var(--foreground)] rounded-tl-sm border border-[var(--card-border)]"
                                            )}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-[var(--secondary-text)] font-bold mt-1 uppercase tracking-tight">{msg.time}</span>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 pb-10 bg-black/80 backdrop-blur-xl border-t border-[var(--card-border)]">
                            <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-full p-2 pl-4 border border-[var(--card-border)]">
                                <input
                                    type="text"
                                    placeholder="Bir mesaj yazın..."
                                    value={adoptionNewMsg}
                                    onChange={(e) => setAdoptionNewMsg(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendAdoptionMsg()}
                                    className="flex-1 bg-transparent border-none outline-none text-[var(--foreground)] text-[15px] placeholder:text-[var(--secondary-text)]"
                                />
                                <button
                                    onClick={handleSendAdoptionMsg}
                                    className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-[var(--foreground)] active:scale-95 transition-transform"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INSTAGRAM STYLE STORY VIEWER */}
            <AnimatePresence>
                {
                    viewerStoryGroupIndex !== null && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[200] bg-black flex flex-col justify-center items-center"
                        >
                            {/* Progress Bars Placeholder */}
                            <div className="absolute top-4 left-4 right-4 z-10 flex gap-1 h-0.5">
                                {storyGroups[viewerStoryGroupIndex].stories.map((_, idx) => (
                                    <div key={idx} className="flex-1 bg-white/20 overflow-hidden rounded-full relative">
                                        <div
                                            className={cn(
                                                "absolute top-0 left-0 bottom-0 bg-white",
                                                idx === viewerStoryIndex && "shadow-[0_0_10px_white]"
                                            )}
                                            style={{
                                                width: idx < viewerStoryIndex ? '100%' : idx === viewerStoryIndex ? `${storyProgress}%` : '0%',
                                                transition: idx === viewerStoryIndex && storyProgress === 100 ? 'width 5000ms linear' : 'none'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Top Header */}
                            <div className="absolute top-8 left-4 right-4 z-10 flex justify-between items-center text-[var(--foreground)] drop-shadow-md">
                                <div className="flex items-center gap-3">
                                    <img src={(storyGroups[viewerStoryGroupIndex].user_id === user?.id ? (user?.avatar || storyGroups[viewerStoryGroupIndex].author_avatar) : storyGroups[viewerStoryGroupIndex].author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-8 h-8 rounded-full border border-white/40 object-cover" />
                                    <span className="font-bold text-sm tracking-wide">{storyGroups[viewerStoryGroupIndex].author_name}</span>
                                    <span className="text-[var(--foreground)]/60 text-xs mt-0.5">· {formatTimeAgo(storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].created_at)}</span>
                                </div>
                                <button onClick={closeStoryViewer} className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Media Display */}
                            <div className="relative w-full h-full md:max-w-md md:aspect-[9/16] md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden bg-[#1c1c1e] md:border md:border-white/10 shadow-2xl">
                                <img
                                    key={storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].id}
                                    src={storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].media_url}
                                    className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300"
                                />

                                {/* Gradients */}
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                {/* Tap Zones */}
                                <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={prevStory} />
                                <div className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer" onClick={nextStory} />

                                {/* Bottom Actions 📸 */}
                                <div className="absolute inset-x-0 bottom-0 p-4 z-30 flex items-center gap-3">
                                    {storyGroups[viewerStoryGroupIndex].user_id === user?.id ? (
                                        <div className="flex items-center justify-between w-full text-[var(--foreground)]">
                                            <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); alert("Hikayeyi Görenler: Luna, Felix, Buster ve 12 diğer kişi."); }}>
                                                <div className="flex -space-x-2">
                                                    <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=100" className="w-6 h-6 rounded-full border border-black z-20 object-cover" />
                                                    <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100" className="w-6 h-6 rounded-full border border-black z-10 object-cover" />
                                                    <div className="w-6 h-6 rounded-full border border-black bg-white/20 backdrop-blur-md flex items-center justify-center text-[8px] font-bold z-0">+12</div>
                                                </div>
                                                <span className="text-[11px] font-medium opacity-90">Etkinlikler</span>
                                            </button>
                                            <div className="flex gap-4">
                                                <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); alert("Öne Çıkarılıyor..."); }}>
                                                    <Heart className="w-6 h-6" />
                                                    <span className="text-[10px]">Öne Çıkar</span>
                                                </button>
                                                <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); alert("Tıklanabilir Seçenekler: Kopyala, Arşivle, Sil"); }}>
                                                    <MoreHorizontal className="w-6 h-6" />
                                                    <span className="text-[10px]">Daha Fazla</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Reply Box */}
                                            <div className="flex-1 bg-black/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center px-4 h-12 pointer-events-auto">
                                                <input
                                                    type="text"
                                                    placeholder={`Mesaj Gönder...`}
                                                    className="bg-transparent text-[var(--foreground)] w-full text-sm outline-none placeholder:text-[var(--foreground)]/70"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <button className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-[var(--foreground)] active:scale-90 transition-transform pointer-events-auto" onClick={(e) => { e.stopPropagation(); alert("Hikaye beğenildi!"); }}>
                                                <Heart className="w-7 h-7 hover:fill-red-500 hover:text-red-500 transition-colors" />
                                            </button>
                                            <button className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-[var(--foreground)] active:scale-90 transition-transform pointer-events-auto" onClick={(e) => { e.stopPropagation(); alert("Paylaşım menüsü açılıyor..."); }}>
                                                <Send className="w-6 h-6 -ml-1" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* QR CODE GENERATOR MODAL (PET-ID) */}
            <AnimatePresence>
                {
                    qrModalPet && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                            onClick={() => setQrModalPet(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-[#1C1C1E] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-sm flex flex-col items-center shadow-2xl relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img src={qrModalPet.avatar} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl pointer-events-none" />

                                <div className="relative z-10 w-full flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full border-2 border-cyan-400 p-0.5 mb-4 shadow-lg shrink-0">
                                        <img src={qrModalPet.avatar} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--foreground)] mb-1">{qrModalPet.name} - Akıllı Kimlik</h3>
                                    <p className="text-sm text-[var(--secondary-text)] font-medium mb-6">Bu QR Kodu Moffi Künyesine yazdırın veya tasmaya yapıştırın. (Test için kamera ile okutabilir veya Linke Tıklayabilirsiniz!)</p>

                                    {/* THE QR CODE SURROUNDED BY NEON BORDER */}
                                    <div 
                                        className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.4)] border-4 border-cyan-400/50 mb-6 active:scale-95 transition-transform cursor-pointer" 
                                        onClick={() => setIsFullScreenQR(true)}
                                    >
                                        <QRCodeSVG
                                            value={`${window.location.origin}/id/${qrModalPet.id}`}
                                            size={180}
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                            level="H"
                                        />
                                    </div>

                                    <div className="flex gap-2 w-full">
                                        <button className="flex-1 bg-white text-black font-bold py-3 rounded-2xl flex items-center justify-center gap-2" onClick={() => alert("QR Yüksek Kalitede (PDF) İndirildi!")}>
                                            İndir & Yazdır
                                        </button>
                                        <button className="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2" onClick={() => window.open(`${window.location.origin}/id/${qrModalPet.id}`, '_blank')}>
                                            Test Et (Aç)
                                        </button>
                                    </div>
                                </div>

                                <button onClick={() => setQrModalPet(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[var(--foreground)] z-20">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* FULL SCREEN QR EXPANSION (Scanning Mode) */}
            <AnimatePresence>
                {isFullScreenQR && qrModalPet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
                        onClick={() => setIsFullScreenQR(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white p-10 rounded-[4rem] shadow-[0_0_100px_rgba(34,211,238,0.3)] flex flex-col items-center gap-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-black tracking-tighter uppercase italic">{qrModalPet.name}</h3>
                                <p className="text-xs font-bold text-cyan-600 uppercase tracking-[0.4em] mt-1">Moffi Akıllı Kimlik</p>
                            </div>

                            <div className="p-4 bg-white rounded-[2rem]">
                                <QRCodeSVG
                                    value={`${window.location.origin}/id/${qrModalPet.id}`}
                                    size={300}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4 w-full">
                                <button 
                                    onClick={() => window.open(`${window.location.origin}/id/${qrModalPet.id}`, '_blank')}
                                    className="w-full bg-cyan-500 text-white font-black py-4 rounded-3xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Web Sayfasını Aç
                                </button>
                                <button 
                                    onClick={() => setIsFullScreenQR(false)}
                                    className="text-black/40 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
                                >
                                    Kapatmak için dokun
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* MOFFI BENTO SELECTOR OVERLAY */}
                {isProfileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[700] backdrop-blur-3xl flex items-center justify-center p-6"
                        style={{ background: 'var(--background-overlay)' }}
                        onClick={() => setIsProfileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 100 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 100 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.4}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) setIsProfileMenuOpen(false);
                            }}
                            className="w-full max-w-sm bg-[#0A0A0E]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 pb-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* CLOSE HANDLE - Enhanced Area */}
                            <div 
                                onClick={() => setIsProfileMenuOpen(false)}
                                className="absolute top-0 left-0 right-0 h-10 flex justify-center items-center cursor-pointer active:opacity-50 transition-opacity z-50"
                            >
                                <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                            </div>

                            <div className="text-center mb-8 mt-4">
                                <h3 className="text-[11px] font-black text-[var(--foreground)]/40 uppercase tracking-[0.4em]">Profil Kategorileri</h3>
                                <p className="text-2xl font-black text-[var(--foreground)] mt-1">Nereye gitmek istersin?</p>
                            </div>

                            <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[450px]">
                                {[
                                    { id: 'grid', label: 'Galeri', icon: Grid3X3, color: 'text-cyan-400', bg: 'bg-cyan-500/10', span: 'col-span-2 row-span-2' },
                                    { id: 'list', label: 'Akış', icon: List, color: 'text-purple-400', bg: 'bg-purple-500/10', span: 'col-span-2 row-span-1' },
                                    { id: 'family', label: 'Ailem', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', span: 'col-span-2 row-span-1' },
                                    { id: 'wallet', label: 'Cüzdan', icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/10', span: 'col-span-1 row-span-1' },
                                    { id: 'passport', label: 'Kimlik', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', span: 'col-span-1 row-span-1' },
                                    { id: 'orders', label: 'Siparişler', icon: Package, color: 'text-orange-400', bg: 'bg-orange-500/10', span: 'col-span-2 row-span-1' },
                                    { id: 'saved', label: 'Favoriler', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', span: 'col-span-2 row-span-1' },
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => { setProfileViewMode(tab.id); setIsProfileMenuOpen(false); }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-[2rem] border transition-all active:scale-95 group relative overflow-hidden",
                                            tab.span,
                                            profileViewMode === tab.id 
                                                ? "bg-white border-white shadow-[0_15px_40px_rgba(255,255,255,0.2)]" 
                                                : "bg-[var(--card-bg)] border-white/10 backdrop-blur-md hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all mb-2",
                                            profileViewMode === tab.id ? "bg-black text-[var(--foreground)]" : cn("bg-[var(--card-bg)]", tab.color)
                                        )}>
                                            <tab.icon className={cn(tab.id === 'grid' ? "w-6 h-6" : "w-5 h-5")} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            profileViewMode === tab.id ? "text-black" : "text-[var(--foreground)]/60"
                                        )}>{tab.label}</span>
                                        
                                        {profileViewMode === tab.id && (
                                            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setIsProfileMenuOpen(false)} className="w-full mt-8 py-4 bg-[var(--card-bg)] rounded-2xl text-[var(--foreground)]/40 text-sm font-bold hover:bg-white/10 transition-colors uppercase tracking-widest">
                                Vazgeç
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* GLOBAL BOTTOM TAB BAR - Simplified Apple iOS Style */}
            <motion.nav 
                initial={false}
                animate={{ y: isNavVisible ? 0 : 100, opacity: isNavVisible ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom"
            >
                <div className="bg-[var(--background)]/80 backdrop-blur-2xl border-t border-[var(--card-border)] px-2 pb-6 pt-3">
                    <div className="flex items-center justify-between max-w-lg mx-auto relative h-12">
                        
                        {/* 1. KEŞFET (REVERTED FROM AI) */}
                        <button
                            onClick={() => {
                                setActiveTab('feed');
                                setIsInboxOpen(false);
                                setIsHubOpen(false);
                                setIsSearchOpen(false);
                                setIsNotificationsOpen(false);
                                setIsProfileMenuOpen(false);
                            }}
                            className={cn("flex-1 flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'feed' ? "text-cyan-400" : "text-[var(--secondary-text)]")}
                        >
                            <Compass className="w-6 h-6" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Keşfet</span>
                        </button>

                        {/* 2. SEARCH */}
                        <button
                            onClick={() => {
                                setIsSearchOpen(!isSearchOpen);
                                if (!isSearchOpen) {
                                    setIsInboxOpen(false);
                                    setIsHubOpen(false);
                                    setIsNotificationsOpen(false);
                                }
                            }}
                            className={cn("flex-1 flex flex-col items-center gap-1 transition-all active:scale-90", isSearchOpen ? "text-cyan-400" : "text-[var(--secondary-text)]")}
                        >
                            <Search className="w-6 h-6" />
                        </button>

                        {/* 3. CENTER: MAIN HUB BUTTON */}
                        <div className="flex-1 flex justify-center relative">
                            <button
                                onPointerDown={(e) => {
                                    // Start long press timer
                                    longPressTimer.current = setTimeout(() => {
                                        setIsHubLongPressing(true);
                                        // Haptic feedback
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                            navigator.vibrate(10);
                                        }
                                        // Execute SOS directly
                                        setIsSOSOpen(true);
                                        setIsHubOpen(false);
                                        // Reset state after a delay
                                        setTimeout(() => setIsHubLongPressing(false), 800);
                                    }, 500);
                                }}
                                onPointerUp={() => {
                                    if (longPressTimer.current) {
                                        clearTimeout(longPressTimer.current);
                                        longPressTimer.current = null;
                                    }
                                    setIsHubLongPressing(false);
                                }}
                                onPointerLeave={() => {
                                    if (longPressTimer.current) {
                                        clearTimeout(longPressTimer.current);
                                        longPressTimer.current = null;
                                    }
                                    setIsHubLongPressing(false);
                                }}
                                onClick={() => {
                                    // Trigger Local Hub Overlay (+)
                                    const newState = !isHubOpen;
                                    setIsHubOpen(newState);
                                    if (newState) {
                                        setIsInboxOpen(false);
                                        setIsSearchOpen(false);
                                        setIsNotificationsOpen(false);
                                    }
                                }}
                                className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center border-4 border-[var(--background)] active:scale-95 transition-all group absolute -top-10",
                                    isHubLongPressing 
                                        ? "bg-red-600 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)] border-red-400" 
                                        : (isHubOpen 
                                            ? "bg-white text-black shadow-[0_15px_35px_rgba(255,255,255,0.2)]" 
                                            : "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 text-[var(--foreground)] shadow-[0_15px_35px_rgba(34,211,238,0.4)]")
                                )}
                            >
                                {isHubOpen ? (
                                    <X className="w-8 h-8 rotate-90 transition-transform" />
                                ) : (
                                    <Plus className={cn("w-8 h-8 transition-transform duration-500", isHubLongPressing ? "scale-125 rotate-45" : "group-hover:rotate-90")} />
                                )}
                            </button>
                            <div className="h-10" /> {/* Spacer */}
                        </div>

                        {/* 4. MESSAGES */}
                        <button
                            onClick={() => { 
                                setInboxTab('chats'); 
                                setIsInboxOpen(true); 
                                setIsHubOpen(false);
                                setIsSearchOpen(false);
                                setIsNotificationsOpen(false);
                            }}
                            className={cn("flex-1 flex flex-col items-center gap-1 transition-all active:scale-90 text-[var(--secondary-text)]")}
                        >
                            <div className="relative">
                                <MessageCircle className="w-6 h-6" />
                                {unreadInboxCount > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-[var(--foreground)] px-1 border border-[var(--background)]">
                                        {unreadInboxCount}
                                    </div>
                                )}
                            </div>
                        </button>

                        {/* 5. PROFILE */}
                        <button
                            onClick={() => {
                                setActiveTab('profile');
                                setIsInboxOpen(false);
                                setIsHubOpen(false);
                                setIsSearchOpen(false);
                                setIsNotificationsOpen(false);
                                setIsProfileMenuOpen(false);
                            }}
                            className={cn("flex-1 flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'profile' ? "text-cyan-400" : "text-[var(--secondary-text)]")}
                        >
                            {user?.avatar ? (
                                <div className={cn("w-6 h-6 rounded-full border overflow-hidden transition-colors", activeTab === 'profile' ? "border-cyan-400" : "border-gray-500")}>
                                    <img src={user.avatar} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <User className="w-6 h-6" />
                            )}
                        </button>

                    </div>
                </div>
            </motion.nav>
            {/* NEW ADDITIONS: SHARE SHEET & NOTIFICATIONS DRAWER */}
            {selectedSharePost && (
                <ShareSheet 
                    isOpen={true}
                    selectedPost={selectedSharePost} 
                    onClose={() => setSelectedSharePost(null)}
                    onSocialShare={(platform) => { alert(`${platform} ile paylaşıldı!`); setSelectedSharePost(null); }}
                    onAddToStory={() => { alert('Hikayenize eklendi!'); setSelectedSharePost(null); }}
                    onCopyLink={() => { navigator.clipboard.writeText(window.location.href); alert('Bağlantı kopyalandı!'); setSelectedSharePost(null); }}
                />
            )}


            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notificationsList}
                onMarkAllRead={() => setNotificationsList(notificationsList.map(n => ({...n, read: true})))}
                unreadCount={notificationsList.filter(n => !n.read).length}
            />

            <PetSettingsModal 
                isOpen={isPetSettingsOpen}
                onClose={() => setIsPetSettingsOpen(false)}
                pet={settingsPet}
                onSave={(updatedFields) => {
                    if (settingsPet) {
                        const updatedPet = { ...settingsPet, ...updatedFields };
                        updatePet(settingsPet.id, updatedFields);
                    }
                    alert(`${updatedFields.name} için resmi pasaport bilgileri Moffi Cloud'a kaydedildi ve mühürlendi!`);
                }}
            />

            <SOSCommandCenter 
                key="global-sos-center"
                isOpen={isSOSCommandCenterOpen}
                onClose={() => setIsSOSCommandCenterOpen(false)}
                pet={sosActivePet}
                allPets={userPets}
                onPetChange={(p) => setSosActivePet(p)}
                sosData={null}
                onUpdate={(newSosStatusData) => {
                    if (sosActivePet) {
                        updatePet(sosActivePet.id, { is_lost: newSosStatusData.status === 'lost' });
                    }
                    showToast(`${sosActivePet?.name} için acil durum ayarları güncellendi.`, "Moffi Radar sistemi tetiklendi.", "success");
                    setIsSOSCommandCenterOpen(false);
                }}
            />

            <VetQuickSheet 
                isOpen={isVetQuickSheetOpen} 
                onClose={() => setIsVetQuickSheetOpen(false)}
                petId={userPets[0]?.id || 'pet-1'}
            />

            <WalkQuickSheet 
                isOpen={isWalkQuickSheetOpen} 
                onClose={() => setIsWalkQuickSheetOpen(false)}
                petId={userPets[0]?.id || 'pet-1'}
            />

            <MarketQuickSheet
                isOpen={isMarketQuickSheetOpen}
                onClose={() => setIsMarketQuickSheetOpen(false)}
                petName={userPets[0]?.name || 'Dostun'}
            />

            <StudioQuickSheet
                isOpen={isStudioQuickSheetOpen}
                onClose={() => setIsStudioQuickSheetOpen(false)}
                petName={userPets[0]?.name || 'Moffi'}
            />

            <GameQuickSheet
                isOpen={isGameQuickSheetOpen}
                onClose={() => setIsGameQuickSheetOpen(false)}
                petName={userPets[0]?.name || 'Moffi'}
            />

            <EcosystemPortal 
                isOpen={isEcosystemPortalOpen}
                onClose={() => setIsEcosystemPortalOpen(false)}
            />

            <SpotlightSearch 
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
                onNavigate={(type, id) => {
                    if (type === 'pet') { 
                        const petId = id.startsWith('pet-') ? id : `pet-${id}`;
                        switchPet(petId); 
                        setActiveTab('profile'); 
                        setProfileViewMode('grid');
                    }
                    if (type === 'action' && id === 'vax') { 
                        setActiveTab('profile');
                        setProfileViewMode('appointments'); 
                    }
                }}
            />


            <InboxModal
                isOpen={isInboxOpen}
                onClose={() => setIsInboxOpen(false)}
                tab={inboxTab}
                setTab={setInboxTab}
                messages={inboxMessages}
                sosAlerts={sosAlerts}
                activeChatUserId={activeChatUserId}
                setActiveChatUserId={setActiveChatUserId}
                replyMessage={replyMessage}
                setReplyMessage={setReplyMessage}
                onSendReply={handleSendReply}
                isReplying={isReplying}
                messagesEndRef={messagesEndRef}
                editingMessageId={editingMessageId}
                activeMessageMenuId={activeMessageMenuId}
                setActiveMessageMenuId={setActiveMessageMenuId}
                isAttachMenuOpen={isAttachMenuOpen}
                setIsAttachMenuOpen={setIsAttachMenuOpen}
                user={user}
            />

            <MoffiAssistant 
                isOpenOverride={showAIAssistant}
                onCloseOverride={() => setShowAIAssistant(false)}
            />

            {/* RESTORED ORIGINAL HUB OVERLAY */}
            <HubOverlay 
                isOpen={isHubOpen}
                onClose={() => setIsHubOpen(false)}
                onMarketClick={() => setIsMarketQuickSheetOpen(true)}
                onWalkClick={() => setIsWalkQuickSheetOpen(true)}
                onVetClick={() => setIsVetQuickSheetOpen(true)}
                onStudioClick={() => setIsStudioQuickSheetOpen(true)}
                onGameClick={() => setIsGameQuickSheetOpen(true)}
                onMoffinetClick={() => setIsEcosystemPortalOpen(true)}
                onSearchClick={() => setIsSearchOpen(true)}
                onCommunityRadarClick={() => setActiveTab('radar')}
                onAIAsistantClick={() => setShowAIAssistant(true)}
                onSOSClick={() => {
                    setIsSOSCommandCenterOpen(true);
                    setSosActivePet(userPets[0]);
                }}
            />

        </div>
    );
}

// -- SETTINGS ROW COMPONENT --
function SettingsRow({ icon: Icon, label, danger, onClick }: { icon: any, label: string, danger?: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn("w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--card-bg)] transition-colors group", danger && "hover:bg-red-500/10")}>
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full", danger ? "bg-red-500/20 text-red-500" : "bg-white/10 text-[var(--foreground)]")}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={cn("font-bold", danger ? "text-red-500" : "text-[var(--foreground)]/90")}>{label}</span>
            </div>
            <ChevronRight className={cn("w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity", danger ? "text-red-500" : "text-[var(--secondary-text)]")} />
        </button>
    );
}

// -- NAV BUTTON --
function NavBtn({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className="relative p-2 transition-colors">
            <Icon className={cn("w-6 h-6 transition-colors", active ? "text-[var(--foreground)]" : "text-[var(--secondary-text)] hover:text-gray-300")} strokeWidth={active ? 2.5 : 2} />
            {active && (
                <motion.div layoutId="nav-pill" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
        </button>
    );
}

