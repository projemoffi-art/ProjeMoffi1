"use client";

import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useMotionValue } from 'framer-motion';
import {
    Heart, MessageCircle, Share2, MapPin,
    Plus, Camera, Compass,
    Users, Activity, Sparkles, X, Send, PawPrint, Search, Menu, MoreHorizontal, Image as ImageIcon, Video, Mic,
    Settings, Grid3X3, List, Edit3, Bookmark, Edit2, Trash2, ImagePlus,
    LogOut, ChevronRight, ChevronLeft, User, Bell, Lock, HelpCircle, Check, HeartHandshake, ShieldAlert, ChevronDown,
    AlertTriangle, PhoneCall, BadgeCheck, Radar, Palette, ShoppingBag, Gamepad2, Globe, Filter,
    Coins, Package, Calendar, Plane, ShieldCheck, Route, TrendingUp, Timer, Footprints, Play, Download, Clock, Syringe, Moon, Flame,
    Sun, Contrast, Droplet, Info, AlertCircle
} from 'lucide-react';
import { compressImageToFile } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { isSupabaseEnabled } from '@/services/apiService';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
const MapLocationPicker = dynamic(() => import('@/components/common/MapLocationPicker').then(mod => mod.MapLocationPicker), { ssr: false });


import AuthModal from '../../components/auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import { useShare } from '../../context/ShareContext';
import { useUserStories } from '../../hooks/useUserStories';
import { useTheme } from '../../context/ThemeContext';
import { PetSettingsModal } from '../../components/profile/PetSettingsModal';
import { SOSCommandCenter } from '../../components/profile/SOSCommandCenter';
import { QRCodeSVG } from 'qrcode.react';
import { InboxModal } from '../../components/community/InboxModal';
import { FeedbackModal } from '../../components/community/modals/FeedbackModal';
import { MessageSquareHeart } from 'lucide-react';

import { NotificationsDrawer } from '../../components/community/NotificationsDrawer';

import { ImmersivePostCard } from '../../components/community/ImmersivePostCard';
import { VetQuickSheet } from '@/components/vet/VetQuickSheet';
import { MarketQuickSheet } from '@/components/shop/MarketQuickSheet';
import { StudioQuickSheet } from '@/components/studio/StudioQuickSheet';
import { GameQuickSheet } from '@/components/game/GameQuickSheet';
import { PetSwitcher } from '@/components/common/PetSwitcher';
import { usePet } from '@/context/PetContext';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { useWellbeing } from '@/context/WellbeingContext';
import { EcosystemPortal } from '@/components/community/EcosystemPortal';
import { SpotlightSearch } from '@/components/community/SpotlightSearch';
import { DiaryModal } from '@/components/community/DiaryModal';
import { apiService } from '../../services/apiService';
import { supabase } from '../../lib/supabase';
import { PET_TYPES } from '@/constants/petTypes';

// Optional components
import { MoffiBottomNav } from '@/components/common/MoffiBottomNav';
import { OverlaySystem } from '@/components/community/OverlaySystem';
import { FeedTab } from '@/components/community/FeedTab';
import Image from 'next/image';
import { useChat } from '@/context/ChatContext';

const StoryProgressBar = ({ isActive, isCompleted, isPaused, onComplete, duration = 6000 }: { isActive: boolean, isCompleted: boolean, isPaused: boolean, onComplete: () => void, duration?: number }) => {
    const barRef = React.useRef<HTMLDivElement>(null);
    const progressRef = React.useRef(0);
    const onCompleteRef = React.useRef(onComplete);
    onCompleteRef.current = onComplete;

    React.useEffect(() => {
        if (isCompleted) {
            if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
            return;
        }
        if (!isActive) {
            progressRef.current = 0;
            if (barRef.current) barRef.current.style.transform = 'scaleX(0)';
            return;
        }
        if (isPaused) return;

        let animationFrameId: number;
        let start = Date.now() - (progressRef.current / 100) * duration;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - start;
            const p = (elapsed / duration) * 100;

            if (p >= 100) {
                progressRef.current = 100;
                if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
                onCompleteRef.current();
            } else {
                progressRef.current = p;
                if (barRef.current) barRef.current.style.transform = `scaleX(${p / 100})`;
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive, isPaused, duration, isCompleted]);

    let initialScale = 0;
    if (isCompleted) initialScale = 1;
    else if (isActive && isPaused) initialScale = progressRef.current / 100;

    return (
        <div
            ref={barRef}
            className={cn(
                "absolute top-0 left-0 bottom-0 bg-white w-full origin-left will-change-transform",
                isActive && "shadow-[0_0_10px_white]"
            )}
            style={{ transform: `scaleX(${initialScale})` }}
        />
    );
};

export default function MoffiSocialMasterpiece() {
    const { user, logout, updateProfile, updateSettings } = useAuth();
    const { openShare } = useShare();
    const { 
        isInboxOpen, setIsInboxOpen,
        unreadCount,
        openChat,
        activeChatUserId, setActiveChatUserId,
        replyMessage, setReplyMessage,
        onSendReply, isReplying,
        inboxMessages,
        refreshInbox
    } = useChat();
    const { theme, setTheme } = useTheme();
    const { storyGroups, uploadStory, markStoryAsViewed, toggleStoryLike, refreshStories, deleteStory } = useUserStories();
    const { pets: userPets, activePet, switchPet, updatePet } = usePet();
    const { isQuietModeActive } = useWellbeing();
    const [likeError, setLikeError] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('feed'); 
    // Kayıp ilanları /kayip'ta, sahiplendirme /sahiplendirme'de (design-reference/community-final).
    
    // REALTIME FEED ENTEGRASYONU
    const { posts, setPosts, isLoading: isLoadingPosts, refetchPosts: fetchPosts, sortPostsLocally } = useRealtimeFeed(true);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [profileSubView, setProfileSubView] = useState<'main' | 'family' | 'passport' | 'orders' | 'wallet' | 'appointments' | 'routes' | 'impact' | 'bookmarks'>('main');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [selectedSharePost, setSelectedSharePost] = useState<any>(null);
    const [profileViewMode, setProfileViewMode] = useState('grid');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [newPetPhotos, setNewPetPhotos] = useState<{ file: File, preview: string }[]>([]);
    const [isSavingPet, setIsSavingPet] = useState(false);
    const [qrModalPet, setQrModalPet] = useState<{ name: string, id: string, avatar: string } | null>(null);
    const [isFullScreenQR, setIsFullScreenQR] = useState(false);
    const [isPetSettingsOpen, setIsPetSettingsOpen] = useState(false);
    const [settingsPet, setSettingsPet] = useState<any>(null);
    const [isSOSCommandCenterOpen, setIsSOSCommandCenterOpen] = useState(false);
    const [sosActivePet, setSosActivePet] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'immersive' | 'grid'>('immersive');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSosAlertDismissed, setIsSosAlertDismissed] = useState(false);



    const handlePostClickFromGrid = (post: any) => {
        setViewMode('immersive');
        setTimeout(() => {
            const element = document.getElementById(`post-${post.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }, 100);
    };


    const [isHubOpen, setIsHubOpen] = useState(false);
    const [isHubLongPressing, setIsHubLongPressing] = useState(false);
    const [activeTimePicker, setActiveTimePicker] = useState<'from' | 'to' | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [isVetQuickSheetOpen, setIsVetQuickSheetOpen] = useState(false);
    const [isMarketQuickSheetOpen, setIsMarketQuickSheetOpen] = useState(false);
    const [isStudioQuickSheetOpen, setIsStudioQuickSheetOpen] = useState(false);
    const [isGameQuickSheetOpen, setIsGameQuickSheetOpen] = useState(false);
    const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isDiaryOpen, setIsDiaryOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isStoryViewsDrawerOpen, setIsStoryViewsDrawerOpen] = useState(false);
    const [storyViewers, setStoryViewers] = useState<any[]>([]);
    const [isLoadingStoryViewers, setIsLoadingStoryViewers] = useState(false);
    const [storyPreview, setStoryPreview] = useState<string | null>(null);
    const [pendingStoryFile, setPendingStoryFile] = useState<File | null>(null);
    const [isUploadingStory, setIsUploadingStory] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadImageURL, setUploadImageURL] = useState<string | null>(null);
    const [uploadCaption, setUploadCaption] = useState('');
    const [uploadLocationEnabled, setUploadLocationEnabled] = useState(false);
    const [uploadMood, setUploadMood] = useState<string | null>(null);
    const [imageFilter, setImageFilter] = useState('');
    const [activeFilterIndex, setActiveFilterIndex] = useState(0);
    const [showFilterName, setShowFilterName] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [taggedPetIds, setTaggedPetIds] = useState<string[]>([]);
    
    // Pro Adjustments States
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [activeAdjustSubTool, setActiveAdjustSubTool] = useState<'brightness' | 'contrast' | 'saturation'>('brightness');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const uploadImageRef = useRef<HTMLImageElement>(null);
    const uploadVideoRef = useRef<HTMLVideoElement>(null);
    
    // Scheduling States
    const [scheduledDate, setScheduledDate] = useState<string | null>(null);
    const [isSchedulingMode, setIsSchedulingMode] = useState(false);
    const [activeTool, setActiveTool] = useState<'adjust' | 'tag' | 'schedule' | 'mood' | 'ai' | null>(null);
    
    const touchStartX = useRef<number | null>(null);

    const IMAGE_FILTERS = useMemo(() => [
        { name: 'Orijinal', filter: '' },
        { name: 'Aydınlık', filter: 'brightness(1.1) contrast(1.1)' },
        { name: 'Canlı', filter: 'contrast(1.2) saturate(1.3)' },
        { name: 'Sıcak', filter: 'sepia(0.3) saturate(1.2) contrast(1.1)' },
        { name: 'Soğuk', filter: 'saturate(1.2) contrast(1.1) hue-rotate(-10deg)' },
        { name: 'Soluk', filter: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
        { name: 'Krem', filter: 'sepia(0.2) brightness(1.05) saturate(0.9)' },
        { name: 'Pastel', filter: 'contrast(0.85) brightness(1.1) saturate(1.1) sepia(0.1)' },
        { name: 'Tozlu', filter: 'sepia(0.4) contrast(0.9) brightness(1.05)' },
        { name: 'Minimal', filter: 'contrast(1.05) saturate(0.7)' },
        { name: 'Siyah Beyaz', filter: 'grayscale(1) contrast(1.2)' },
        { name: 'Sert Siyah', filter: 'grayscale(1) contrast(1.4) brightness(0.9)' },
        { name: 'Vintage', filter: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(1.2)' },
        { name: 'Nostalji', filter: 'sepia(0.8) contrast(1.2) brightness(0.8)' },
        { name: 'Sinematik', filter: 'contrast(1.3) saturate(0.8) sepia(0.2)' }
    ], []);

    useEffect(() => {
        if (showFilterName) {
            const timer = setTimeout(() => setShowFilterName(false), 1250);
            return () => clearTimeout(timer);
        }
    }, [showFilterName, activeFilterIndex]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleOpenStoryViews = async (storyId: string) => {
        setIsStoryPaused(true);
        setIsStoryViewsDrawerOpen(true);
        setIsLoadingStoryViewers(true);
        try {
            const viewers = await apiService.getStoryViewers(storyId);
            setStoryViewers(viewers);
        } catch (error) {
            console.error("Failed to load story viewers", error);
        } finally {
            setIsLoadingStoryViewers(false);
        }
    };

    const handleSwipeFilter = (direction: 'left' | 'right') => {
        let newIndex = activeFilterIndex;
        if (direction === 'left') {
            newIndex = (activeFilterIndex + 1) % IMAGE_FILTERS.length;
        } else {
            newIndex = (activeFilterIndex - 1 + IMAGE_FILTERS.length) % IMAGE_FILTERS.length;
        }
        setActiveFilterIndex(newIndex);
        setImageFilter(IMAGE_FILTERS[newIndex].filter);
        setShowFilterName(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX.current;
        if (diff > 50) handleSwipeFilter('right');
        else if (diff < -50) handleSwipeFilter('left');
        touchStartX.current = null;
    };
    const [viewerStoryGroupIndex, setViewerStoryGroupIndex] = useState<number | null>(null);
    const [viewerStoryIndex, setViewerStoryIndex] = useState(0);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: viewerStoryGroupIndex === null }));
    }, [viewerStoryGroupIndex]);
    
    const [isStoryPaused, setIsStoryPaused] = useState(false);
    const storyPressStartTime = useRef<number>(0);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<{ id: number, desc: string, mood: string | null, media: string } | null>(null);

    const generateAICaption = () => {
        setIsGeneratingAI(true);
        setTimeout(() => {
            const templates: Record<string, string[]> = {
                'Mutlu ✨': [
                    "Bugün enerjimiz yerinde! 🐾",
                    "Gülümsememizle dünyayı aydınlatıyoruz. ✨",
                    "En mutlu anlar patilerle geçer. ❤️",
                    "Mutluluk bir kuyruk sallaması kadar yakın! 🐕"
                ],
                'Uykulu 💤': [
                    "Biraz kestirmenin kimseye zararı olmaz... 😴",
                    "Rüyalar alemine yolculuk başlıyor. 🌙",
                    "En sevdiğim aktivite: Uyumak! 💤",
                    "Pazartesi modumuz tam olarak bu... 😴"
                ],
                'Enerjik ⚡': [
                    "Beni kimse durduramaz! 🔥",
                    "Koşmak, zıplamak, keşfetmek... 🐾",
                    "Enerji tavan! ⚡",
                    "Hadi oyna artık! Bekliyorum... 🎾"
                ],
                'Sabırsız 🦉': [
                    "Mama saati ne zaman? 🍖",
                    "Dışarı çıkmak için sabırsızlanıyoruz! 🐾",
                    "Hala bekliyor muyuz? Cidden mi? 🦉"
                ],
                'Oyunbaz 🎾': [
                    "Topu at, getiriyim! 🎾",
                    "Oyun vakti geldi de geçiyor bile. 🐾",
                    "Hadi biraz eğlenelim! ✨"
                ],
                'Yorgun 🔋': [
                    "Pillerimiz bitti... 🔋",
                    "Bugün çok koşturduk, dinlenme vakti. 💤",
                    "Beni buraya bırakın, uyanınca gelirim. 😴"
                ]
            };

            const pool = uploadMood && templates[uploadMood] ? templates[uploadMood] : [
                "Moffi ile anı biriktiriyoruz. 🐾",
                "Günün en güzel anı. ✨",
                "Patili dostumla hayat daha güzel. ❤️",
                "Harika bir gün! 🐕",
                "Moffi dünyasında sıradan bir an. 🌍"
            ];

            const randomCaption = pool[Math.floor(Math.random() * pool.length)];
            setUploadCaption(randomCaption);
            setIsGeneratingAI(false);
            showToast("AI Başarılı! ✨", "Senin için harika bir açıklama buldum.", "success");
        }, 800);
    };
    
    // VIDEO TRIMMER STATES
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoTrimRange, setVideoTrimRange] = useState<[number, number]>([0, 5]);
    const [videoCurrentTime, setVideoCurrentTime] = useState(0);
    const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'window' | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const trimmerRef = useRef<HTMLDivElement>(null);
    const uploadAudioRef = useRef<HTMLAudioElement>(null);
    const isDraggingRef = useRef<boolean>(false);
    
    // AUDIO SHARING STATES
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Synchronize preview video and audio play/pause states
    useEffect(() => {
        const video = uploadVideoRef.current;
        const audio = uploadAudioRef.current;
        if (!video || !audio) return;

        const handlePlay = () => {
            audio.currentTime = Math.max(0, video.currentTime - videoTrimRange[0]);
            audio.play().catch(() => {});
        };
        const handlePause = () => {
            audio.pause();
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        
        if (!video.paused) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [audioURL, videoTrimRange[0]]);
    
    // DERIVED STATES
    const isAnyPetLost = useMemo(() => userPets.some(p => p.is_lost), [userPets]);
    
    // TOAST NOTIFICATIONS
    const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = (title: string, desc?: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage({ title, desc, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- PROFESSIONAL MEDIA ENGINE (Compression & Preview) ---
    const processVideo = async (file: File, startTime: number, duration: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = false; // Must be false to extract audio track via Web Audio API
            video.playsInline = true;
            video.crossOrigin = "anonymous";
            
            let isResolvedOrRejected = false;
            let hasAttemptedPlay = false;
            
            const cleanup = () => {
                if (!video.paused) video.pause();
                video.removeAttribute('src');
                video.load();
            };

            const safeReject = (err: any) => {
                if (isResolvedOrRejected) return;
                isResolvedOrRejected = true;
                cleanup();
                reject(err);
            };

            // Timeout to prevent hanging forever if video metadata/playback fails
            const timeoutId = setTimeout(() => {
                safeReject(new Error("Video işleme zaman aşımına uğradı. Orijinal dosya kullanılacak."));
            }, 10000); 

            const attemptPlay = () => {
                if (hasAttemptedPlay) return;
                hasAttemptedPlay = true;
                video.play().catch(err => {
                    clearTimeout(timeoutId);
                    safeReject(err);
                });
            };

            video.onloadedmetadata = () => {
                if (startTime > 0) {
                    video.currentTime = startTime;
                } else {
                    attemptPlay();
                }
            };
            
            video.onseeked = () => {
                attemptPlay();
            };

            video.onplaying = () => {
                clearTimeout(timeoutId);
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const scaleFactor = Math.min(1, 480 / video.videoWidth);
                    canvas.width = video.videoWidth * scaleFactor;
                    canvas.height = video.videoHeight * scaleFactor;
                    
                    const stream = canvas.captureStream(30); 
                    
                    // --- AUDIO EXTRACTION ENGINE ---
                    // Canvas captureStream only captures video frames. We must extract the audio manually.
                    try {
                        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                        if (AudioContextClass) {
                            const audioCtx = new AudioContextClass();
                            const source = audioCtx.createMediaElementSource(video);
                            const dest = audioCtx.createMediaStreamDestination();
                            
                            // Connect source to destination stream (but NOT to speakers/audioCtx.destination)
                            // This keeps the processing silent while preserving the audio track.
                            source.connect(dest);
                            
                            const audioTrack = dest.stream.getAudioTracks()[0];
                            if (audioTrack) {
                                stream.addTrack(audioTrack);
                            }
                        }
                    } catch (audioErr) {
                        console.warn("Moffi Audio Engine: Ses izi alınamadı veya video sessiz.", audioErr);
                    }

                    const recorder = new MediaRecorder(stream, { 
                        mimeType: 'video/webm;codecs=vp8',
                        videoBitsPerSecond: 1200000 
                    });
                    
                    const chunks: Blob[] = [];
                    recorder.ondataavailable = (e) => chunks.push(e.data);
                    
                    recorder.onstop = () => {
                        if (isResolvedOrRejected) return;
                        isResolvedOrRejected = true;
                        cleanup();
                        resolve(new Blob(chunks, { type: 'video/webm' }));
                    };
                    
                    recorder.start();
                    
                    const drawFrame = () => {
                        if (isResolvedOrRejected) return;
                        if (video.paused || video.ended || (video.currentTime >= startTime + duration)) {
                            if (recorder.state === 'recording') recorder.stop();
                            return;
                        }
                        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                        requestAnimationFrame(drawFrame);
                    };
                    drawFrame();

                    // Hard limit safety (21s)
                    setTimeout(() => {
                        if (recorder.state === 'recording') recorder.stop();
                    }, (duration + 1) * 1000);
                } catch (err) {
                    safeReject(err);
                }
            };

            video.onerror = (e) => {
                clearTimeout(timeoutId);
                console.error("Video processing error:", e);
                safeReject(new Error("Video işlenirken bir hata oluştu."));
            };
            
            video.load();
        });
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onerror = () => resolve(file);
            reader.onload = (event) => {
                const img = new window.Image();
                img.onerror = () => resolve(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.src = event.target?.result as string;
            };
        });
    };

    const handleStoryClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                setPendingStoryFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setStoryPreview(reader.result as string);
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const confirmUploadStory = async () => {
        if (!pendingStoryFile) return;
        setIsUploadingStory(true);
        try {
            // --- PROFESSIONAL COMPRESSION ---
            const compressed = await compressImage(pendingStoryFile);
            const res = await uploadStory(compressed);
            if (res.success) {
                showToast("Harika!", "Hikayen başarıyla paylaşıldı.", "success");
            } else {
                showToast("Hata", `Hikaye yüklenemedi: ${res.error || "Bilinmeyen hata"}`, "error");
            }
            setStoryPreview(null);
            setPendingStoryFile(null);
        } catch (err) {
            console.error("Story upload failed:", err);
            showToast("Hata", "Sistem hatası oluştu.", "error");
        } finally {
            setIsUploadingStory(false);
        }
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
         const globalScrollRef = useRef<HTMLDivElement>(null);
     const uploadScrollRef = useRef<HTMLDivElement>(null);
     const scrollY = useMotionValue(0);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const longPressHubTimer = useRef<NodeJS.Timeout | null>(null);
    const storyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const feedRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef(0);
    const lastInboxScroll = useRef(0);
    
    // Global Navigation & Hub Controller (Restored)
    useEffect(() => {
        const handleOpenPost = () => {
            setIsUploadModalOpen(true);
            setTimeout(() => {
                cameraInputRef.current?.click();
            }, 300);
        };

        const handleOpenSpotlight = () => setIsSpotlightOpen(true);
        const handleOpenDiary = () => setIsDiaryOpen(true);
        const handleOpenAuraStudio = () => setIsStudioQuickSheetOpen(true);
        const handleOpenMarket = () => setIsMarketQuickSheetOpen(true);
        const handleOpenVet = () => setIsVetQuickSheetOpen(true);
        const handleOpenNotif = () => setIsNotificationsOpen(true);
        const handleOpenAddLostPet = () => router.push('/kayip/ilan-ver');

        window.addEventListener('open-add-post', handleOpenPost);
        window.addEventListener('moffi-open-upload-modal', handleOpenPost);
        window.addEventListener('open-moffi-spotlight', handleOpenSpotlight);
        window.addEventListener('open-moffi-diary', handleOpenDiary);
        window.addEventListener('open-aura-studio', handleOpenAuraStudio);
        window.addEventListener('open-market-sheet', handleOpenMarket);
        window.addEventListener('open-vet-sheet', handleOpenVet);
        window.addEventListener('open-notification-drawer', handleOpenNotif);
        window.addEventListener('open-add-lost-pet', handleOpenAddLostPet);
        
        const handleChangeTab = (e: any) => {
            setActiveTab(e.detail);
        };
        window.addEventListener('moffi-change-tab', handleChangeTab);

        return () => {
            window.removeEventListener('open-add-post', handleOpenPost);
            window.removeEventListener('moffi-open-upload-modal', handleOpenPost);
            window.removeEventListener('open-moffi-spotlight', handleOpenSpotlight);
            window.removeEventListener('open-moffi-diary', handleOpenDiary);
            window.removeEventListener('open-aura-studio', handleOpenAuraStudio);
            window.removeEventListener('open-market-sheet', handleOpenMarket);
            window.removeEventListener('open-vet-sheet', handleOpenVet);
            window.removeEventListener('open-notification-drawer', handleOpenNotif);
            window.removeEventListener('moffi-change-tab', handleChangeTab);
            window.removeEventListener('open-add-lost-pet', handleOpenAddLostPet);
        };
    }, [router]);

             useEffect(() => {
        if (searchParams.get('openUpload') === 'true') {
            setIsUploadModalOpen(true);
            setTimeout(() => {
                cameraInputRef.current?.click();
            }, 300);
        }
    }, [searchParams]);

    useEffect(() => {
        if (activeTool && uploadScrollRef.current) {
            setTimeout(() => {
                const drawerElement = document.getElementById('upload-tool-drawer');
                if (drawerElement) {
                    drawerElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                } else {
                    uploadScrollRef.current?.scrollTo({
                        top: uploadScrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 150);
        }
    }, [activeTool]);

     useEffect(() => {
         if (activeTool && uploadScrollRef.current) {
             setTimeout(() => {
                 uploadScrollRef.current?.scrollTo({
                     top: uploadScrollRef.current.scrollHeight,
                     behavior: 'smooth'
                 });
             }, 100);
         }
     }, [activeTool]);

    // Unified Header Scroll Logic (Works for all tabs)

    
    // Unified Scroll Handler (Main Container)
    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const current = e.currentTarget.scrollTop;
        scrollY.set(current); // Synchronize motion value for header animations
        
        // Navigation Hide/Show Logic (Global)
        if (current > lastScrollY.current && current > 150) {
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        } else if (current < lastScrollY.current - 10 || current < 80) {
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
        }
        lastScrollY.current = current;
    };



    useEffect(() => {
        const loadInitialData = async () => {
            // Fetch everything independently so one slow request doesn't block others
            fetchPosts();
            fetchInbox();
        };
        loadInitialData();
    }, []);

    // REAL-TIME GLOBAL SYNC (Professional Event-Driven Architecture)
    useEffect(() => {
        const handleCustomPostsSync = () => {
            fetchPosts(true);
        };
        window.addEventListener('moffi_posts_changed', handleCustomPostsSync);

        let channel: any = null;
        if (isSupabaseEnabled) {
            channel = supabase
                .channel('global-feed-events')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                    fetchPosts(true);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
                    fetchPosts(true);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
                    fetchPosts(true);
                })
                .subscribe();
        }

        return () => {
            window.removeEventListener('moffi_posts_changed', handleCustomPostsSync);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [user, activeTab]);

    // HANDLE DEEP LINKING (TABS & CHAT & FOCUS PET)
    useEffect(() => {
        const chatWithId = searchParams.get('chat');
        if (chatWithId) {
            setActiveChatUserId(chatWithId);
            setIsInboxOpen(true);
        }

        const tab = searchParams.get('tab');
        const mode = searchParams.get('mode');
        // Eski radar bağlantıları yeni panellere gider (design-reference/community-final).
        if (tab === 'radar') {
            router.replace(mode === 'adopt' ? '/sahiplendirme' : '/kayip');
            return;
        }
        if (tab === 'profile') {
            setActiveTab('profile');
        } else if (tab === 'feed') {
            setActiveTab('feed');
        }
    }, [searchParams]);
    
    // Keyboard Shortcut for AI Spotlight (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSpotlightOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // fetchPosts and sortPostsLocally have been moved to useRealtimeFeed hook

    const filteredPosts = useMemo(() => {
        if (!searchQuery) return posts;
        return posts.filter(post => 
            post.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [posts, searchQuery]);
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


    // Premium Header Transformations (Apple-Style) - Defined after activeTab
    const headerHeight = [165, 108];

    const headerHeightTransform = useTransform(scrollY, [0, 80], headerHeight);
    
    const headerPadding = useTransform(scrollY, [0, 80], [
        "48px 24px 16px", 
        "8px 24px 8px"
    ]);
    const logoScale = useTransform(scrollY, [0, 80], [1, 0.8]);
    const headerBgOpacity = useTransform(scrollY, [0, 60], [0, 0.95]);
    const headerBlur = useTransform(scrollY, [0, 60], [0, 50]);
    const headerBorderOpacity = useTransform(scrollY, [0, 60], [0, 0.15]);
    const headerOpacity = useTransform(scrollY, [0, 80], [1, 1]); // Keeping it 1 for now as per user request to move grid to top
    const logoY = useTransform(scrollY, [0, 80], [0, -4]); 
    const iconScale = useTransform(scrollY, [0, 80], [1, 0.9]);
    const headerBlurTransform = useTransform(headerBlur, (b) => `blur(${b}px)`);

    // Reset scroll when switching tabs for a fresh start
    useEffect(() => {
        if (globalScrollRef.current) {
            globalScrollRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    // ADOPTION APPLICATION STATES




    // INBOX & SOS DATA STATES (Consolidated at top level)



    
    
    


    



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isInboxOpen) {
            scrollToBottom();
        }
    }, [isInboxOpen, inboxMessages]);

    // TOAST NOTIFICATIONS


    // SETTINGS / KVKK STATES







    const MOOD_OPTIONS = ["Mutlu ✨", "Uykulu 💤", "Enerjik ⚡", "Sabırsız 🥶", "Oyunbaz 🎾", "Acıkmış 🦴", "Havalı 😎"];

    // STORY VIEWER STATES


    const closeStoryViewer = () => {
        setViewerStoryGroupIndex(null);
        setViewerStoryIndex(0);
        
    };

    const nextStory = () => {
        
        if (viewerStoryGroupIndex === null) return;
        const group = storyGroups[viewerStoryGroupIndex];
        if (viewerStoryIndex < group.stories.length - 1) {
            setViewerStoryIndex(prev => prev + 1);
        } else {
            closeStoryViewer();
        }
    };

    const prevStory = () => {
        
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

    // Keep track of stories viewed in this session to prevent infinite loops
    const sessionViewedStories = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (viewerStoryGroupIndex === null) return;
        // Preload next story image for seamless transition
        const group = storyGroups[viewerStoryGroupIndex];
        if (group && group.stories[viewerStoryIndex]) {
            const storyId = group.stories[viewerStoryIndex].id;
            // Mark current story as viewed only if we haven't done it this session
            if (!sessionViewedStories.current.has(storyId)) {
                sessionViewedStories.current.add(storyId);
                markStoryAsViewed(storyId);
            }
        }

        if (group && viewerStoryIndex + 1 < group.stories.length) {
            const img = new window.Image();
            img.src = group.stories[viewerStoryIndex + 1].media_url;
        } else if (viewerStoryGroupIndex + 1 < storyGroups.length) {
            const nextGroup = storyGroups[viewerStoryGroupIndex + 1];
            if (nextGroup && nextGroup.stories.length > 0) {
                const img = new window.Image();
                img.src = nextGroup.stories[0].media_url;
            }
        }
    }, [viewerStoryGroupIndex, viewerStoryIndex, storyGroups, markStoryAsViewed]);

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "Şimdi";
        const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)} sn`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} dk`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} saat`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} gün`;
    };

    const cameraInputRef = useRef<HTMLInputElement>(null);

    const toggleLike = async (id: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('moffi_optimistic_post_like', { detail: { postId: id } }));
        }

        try {
            await apiService.reactToPost(id, '💖');
            // We intentionally DO NOT dispatch 'moffi_posts_changed' here.
            // The optimistic UI has already updated the like status locally instantly.
            // Dispatching a manual fetch here creates a race condition that causes the heart to flicker.
            // The Realtime subscription will eventually sync the feed silently if needed.
        } catch (err: any) {
            console.error("Beğeni hatası:", err);
            alert("Beğeni Hatası: " + (err?.message || JSON.stringify(err)));
            fetchPosts(); 
        }
    };

    const addComment = async (postId: string, text: string) => {
        if (!text.trim()) return;
        
        // Optimistic UI Update - DB write is handled directly by useRealtimeComments hook
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, comments: (Number(p.comments) || 0) + 1 };
            }
            return p;
        }));
    };

    const toggleCommentLike = async (postId: number, commentId: any) => {
        // OPTIMISTIC UPDATE: Hemen dispatch atalım ki arayüz anında değişsin.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('moffi_optimistic_comment_like', { detail: { commentId } }));
        }

        try {
            await apiService.toggleCommentLike(commentId);
        } catch (err: any) {
            showToast("Hata", "Beğeni işlemi başarısız oldu: " + (err?.message || JSON.stringify(err)), "error");
            alert("Yorum Beğeni Hatası: " + (err?.message || JSON.stringify(err)));
        }
    };

    const addCommentReply = (postId: number, parentCommentId: any, text: string) => {
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

    const deleteComment = async (postId: number, commentId: any) => {
        try {
            await apiService.deleteComment(commentId);
            showToast("Yorum Silindi", "Yorum ve yanıtları kaldırıldı.", "info");
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
                    comments: Math.max(0, p.comments - 1),
                    commentsList: removeComment(p.commentsList || []) 
                };
            }));
        } catch (err: any) {
            showToast("Hata", "Yorum silinemedi: " + (err.message || ""), "error");
        }
    };


    const editComment = (postId: number, commentId: any, text: string) => {
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

    const reportComment = (postId: number, commentId: any) => {
        showToast("Bildirim Alındı", "Yorum incelemeye alındı. Teşekkürler!", "info");
    };



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
                                 mood: editingPost.mood || undefined
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

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_AUDIO_SIZE) {
            showToast("Ses Dosyası Çok Büyük", "Lütfen 10MB'dan daha küçük bir ses dosyası seçin. 🎵", "error");
            if (audioInputRef.current) audioInputRef.current.value = '';
            return;
        }

        setAudioFile(file);
        setAudioURL(URL.createObjectURL(file));
        showToast("Ses Eklendi 🎵", `${file.name} başarıyla eklendi.`, "success");
        if (audioInputRef.current) audioInputRef.current.value = '';
    };

    const handleTrimmerPointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: 'start' | 'end' | 'window') => {
        e.preventDefault();
        e.stopPropagation();
        
        isDraggingRef.current = true;
        setDraggingHandle(handle);
        
        if (uploadVideoRef.current) {
            uploadVideoRef.current.pause();
        }
        
        let lastClientX = e.clientX;
        let latestStart = videoTrimRange[0];
        
        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (!trimmerRef.current || videoDuration <= 0) return;
            const rect = trimmerRef.current.getBoundingClientRect();
            const deltaX = moveEvent.clientX - lastClientX;
            const deltaSeconds = (deltaX / rect.width) * videoDuration;
            
            lastClientX = moveEvent.clientX;
            
            setVideoTrimRange((prev) => {
                const [start, end] = prev;
                const rangeDuration = end - start;
                
                if (handle === 'start') {
                    const newStart = Math.max(0, Math.min(start + deltaSeconds, end - 0.5));
                    if (end - newStart > 5) {
                        latestStart = end - 5;
                        if (uploadVideoRef.current) uploadVideoRef.current.currentTime = latestStart;
                        return [latestStart, end];
                    }
                    latestStart = newStart;
                    if (uploadVideoRef.current) uploadVideoRef.current.currentTime = newStart;
                    return [newStart, end];
                } else if (handle === 'end') {
                    const newEnd = Math.max(start + 0.5, Math.min(end + deltaSeconds, videoDuration));
                    if (newEnd - start > 5) {
                        latestStart = start;
                        if (uploadVideoRef.current) uploadVideoRef.current.currentTime = start + 5;
                        return [start, start + 5];
                    }
                    latestStart = start;
                    if (uploadVideoRef.current) uploadVideoRef.current.currentTime = newEnd;
                    return [start, newEnd];
                } else {
                    let newStart = start + deltaSeconds;
                    let newEnd = end + deltaSeconds;
                    
                    if (newStart < 0) {
                        newStart = 0;
                        newEnd = rangeDuration;
                    } else if (newEnd > videoDuration) {
                        newEnd = videoDuration;
                        newStart = videoDuration - rangeDuration;
                    }
                    latestStart = newStart;
                    if (uploadVideoRef.current) {
                        uploadVideoRef.current.currentTime = newStart;
                    }
                    return [newStart, newEnd];
                }
            });
        };
        
        const handlePointerUp = () => {
            isDraggingRef.current = false;
            setDraggingHandle(null);
            
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            
            if (uploadVideoRef.current) {
                uploadVideoRef.current.currentTime = latestStart;
                uploadVideoRef.current.play().catch(() => {});
            }
        };
        
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (isDraggingRef.current) return;
        
        const video = e.currentTarget;
        const start = videoTrimRange[0];
        const end = videoTrimRange[1];
        setVideoCurrentTime(video.currentTime);
        
        if (video.currentTime < start || video.currentTime >= end) {
            video.currentTime = start;
            if (uploadAudioRef.current) {
                uploadAudioRef.current.currentTime = 0;
                uploadAudioRef.current.play().catch(() => {});
            }
        } else {
            if (uploadAudioRef.current) {
                const expectedAudioTime = video.currentTime - start;
                if (Math.abs(uploadAudioRef.current.currentTime - expectedAudioTime) > 0.15) {
                    uploadAudioRef.current.currentTime = expectedAudioTime;
                }
            }
        }
    };

    const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // --- GLOBAL STANDARDS CHECK ---
        const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
        const MAX_VIDEO_DURATION = 5; // 5 Seconds Standard

        if (file.size > MAX_FILE_SIZE) {
            showToast("Dosya Çok Büyük", "Lütfen 40MB'dan daha küçük bir video/resim seçin. 📏", "error");
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            return;
        }

        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                setVideoDuration(video.duration);
                
                if (video.duration > MAX_VIDEO_DURATION) {
                    // Long video: Don't block, just set initial trim
                    setVideoTrimRange([0, 5]);
                    showToast("Video Ayarlama", "Videonuz 5 saniyeden uzun. En iyi kısmını seçebilirsiniz. ✨", "info");
                } else {
                    setVideoTrimRange([0, video.duration]);
                }
                
                setSelectedFile(file);
                setUploadImageURL(URL.createObjectURL(file));
                setIsUploadModalOpen(true);
            };
            video.src = URL.createObjectURL(file);
        } else {
            setSelectedFile(file);
            setUploadImageURL(URL.createObjectURL(file));
            setIsUploadModalOpen(true);
        }
        
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const publishPost = async () => {
        if (!uploadImageURL || !selectedFile) return;
        
        if (!user) {
            showToast("Giriş Gerekli", "Paylaşım yapmak için giriş yapmalısınız.", "error");
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        if (isSchedulingMode) {
            if (!scheduledDate) {
                showToast("Tarih Seçilmedi 📅", "Lütfen paylaşım zamanı için geçerli bir tarih ve saat seçin kral!", "info");
                return;
            }
            const selectedTime = new Date(scheduledDate).getTime();
            const nowTime = new Date().getTime();
            if (selectedTime <= nowTime) {
                showToast("Geçersiz Tarih 📅", "Paylaşım zamanı şu andan ileri bir tarih olmalıdır kral!", "info");
                return;
            }
        }

        setIsPublishing(true);
        setUploadProgress(0);
        try {
            let fileToUpload: any = selectedFile;
            
            if (selectedFile.type.startsWith('image/')) {
                fileToUpload = await compressImage(selectedFile);
            } else if (selectedFile.type.startsWith('video/')) {
                // Show "Processing" state
                showToast("Video Hazırlanıyor...", "Seçtiğiniz 5 saniyelik kısım işleniyor ve optimize ediliyor. ✨", "info");
                
                try {
                    const trimmedVideoBlob = await processVideo(
                        selectedFile, 
                        videoTrimRange[0], 
                        Math.min(5, videoTrimRange[1] - videoTrimRange[0])
                    );
                    
                    fileToUpload = new File([trimmedVideoBlob], "trimmed_video.webm", { type: 'video/webm' });
                    
                    // Since we already trimmed it physically, let's reset metadata to the full length of the new file
                    // But we keep the original intent for the DB check
                } catch (err) {
                    console.error("Video processing failed, falling back to original:", err);
                    showToast("Hata", "Video işlenemedi, orijinal dosya yükleniyor.", "error");
                    // Fallback to original file
                }
            }
            
            // 1. Upload to Storage
            const publicUrl = await apiService.uploadMedia(fileToUpload, 'posts', (p) => {
                setUploadProgress(p);
            });
            if (!publicUrl) throw new Error("Dosya sunucuya yüklenemedi.");
            
            // 1.5 Upload Audio if exists
            let audioPublicUrl = null;
            if (audioFile) {
                audioPublicUrl = await apiService.uploadMedia(audioFile, 'sounds');
            }

            // 2. Add Post to DB
            const isVideo = selectedFile.type.startsWith('video/');
            const wasProcessed = fileToUpload.name === "trimmed_video.webm";

            const newPostResult = await apiService.addPost({
                media: publicUrl,
                caption: uploadCaption,
                mood: uploadMood || undefined,
                is_video: isVideo,
                audio_url: audioPublicUrl || undefined,
                tagged_pets: taggedPetIds,
                scheduled_at: isSchedulingMode && scheduledDate ? new Date(scheduledDate).toISOString() : null,
                status: isSchedulingMode ? 'scheduled' : 'published',
                trim_start: isVideo ? (wasProcessed ? 0 : videoTrimRange[0]) : undefined,
                trim_end: isVideo ? (wasProcessed ? (videoTrimRange[1] - videoTrimRange[0]) : videoTrimRange[1]) : undefined
            });

            // 3. OPTIMISTIC UPDATE / UI Notification
            if (newPostResult.status !== 'scheduled') {
                setPosts(prev => [newPostResult, ...prev]);
                showToast("Paylaşıldı", "Yeni gönderiniz yayında! ✨", "success");
            } else {
                showToast("Zamanlandı 📅", "Gönderiniz belirtilen tarih ve saatte otomatik olarak yayınlanacaktır.", "success");
            }

            // 4. Clean up
            setIsUploadModalOpen(false);
            setUploadImageURL(null);
            setSelectedFile(null);
            setAudioFile(null);
            setAudioURL(null);
            setUploadCaption('');
            setUploadMood(null);
            setTaggedPetIds([]);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setScheduledDate(null);
            setIsSchedulingMode(false);
            setActiveTool(null);
            setUploadLocationEnabled(false);
            setActiveTab('feed');

            // 5. Background sync
            fetchPosts();
        } catch (error: any) {
            console.error("Post upload error:", error);
            const errorMsg = error?.message || "Sunucuyla bağlantı kurulamadı veya bir hata oluştu.";
            showToast("Hata", `Paylaşım yapılamadı: ${errorMsg}`, "error");
        } finally {
            setIsPublishing(false);
        }
    };

    const fetchInbox = async () => {
        try {
            await refreshInbox();
        } catch (err) {
            console.error("Inbox load error:", err);
        }
    };





    return (
        <div className="fixed inset-0 bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col font-sans pb-0">

            {/* MINIMAL PILL TOAST NOTIFICATION */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed top-12 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex justify-center w-full max-w-sm px-4"
                    >
                        <div className={cn(
                            "backdrop-blur-xl border rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-3 pointer-events-auto",
                            toastMessage.type === 'success' ? "bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary" :
                                toastMessage.type === 'error' ? "bg-emergency/10 border-emergency/30 text-emergency" :
                                    "bg-card/90 border-[var(--card-border)] text-[var(--foreground)]"
                        )}>
                            {toastMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" strokeWidth={3} /> :
                                toastMessage.type === 'error' ? <X className="w-4 h-4 shrink-0" strokeWidth={3} /> :
                                    <Activity className="w-4 h-4 shrink-0" strokeWidth={3} />}
                            
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-[13px] leading-tight">{toastMessage.title}</span>
                                {toastMessage.desc && <span className="text-[10px] font-medium opacity-70 leading-tight">{toastMessage.desc}</span>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AMBIENT BACKGROUND GLOW */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden dark:opacity-100 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            {/* MAIN IMMERSIVE CONTENT - Unified Scroll per tab */}
            <main 
                id="community-scroll-container"
                ref={globalScrollRef}
                onScroll={handleMainScroll}
                className={`flex-1 relative z-10 w-full no-scrollbar ${activeTab === 'feed' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overscroll-contain'}`}
            >
                <AnimatePresence>
                    {/* FEED TAB */}
                    {activeTab === 'feed' && (
                        <FeedTab
                            headerElement={
                                <motion.header 
                                    id="community-main-header"
                                    className="relative w-full z-[150] px-4 sm:px-6 flex flex-col transition-all duration-300 pb-2 pt-6 pointer-events-none"
                                >
                                    <div className="flex justify-between items-center w-full pointer-events-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-10 h-10">
                                                <motion.button
                                                    style={{ scale: iconScale }}
                                                    className="w-full h-full flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90 shadow-sm"
                                                >
                                                    <Plus className="w-5 h-5 text-[var(--foreground)]" strokeWidth={2.5} />
                                                </motion.button>
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                                                    accept="image/*,video/*" 
                                                    onChange={handleCameraUpload} 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5 items-center">
                                            <motion.button 
                                                style={{ scale: iconScale }}
                                                onClick={() => setIsSpotlightOpen(true)}
                                                className="p-2 hover:bg-black/10 dark:bg-white/10 rounded-full transition-colors bg-black/20 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg"
                                            >
                                                <Search className="w-4 h-4 text-black/90 dark:text-white/90" />
                                            </motion.button>

                                            {/* Mesajlar: alt menüdeki yer Kayıp/Sahiplendirme'ye verildi (design-reference/community-final). */}
                                            <motion.button
                                                style={{ scale: iconScale }}
                                                onClick={() => setIsInboxOpen(true)}
                                                aria-label="Mesajlar"
                                                className="relative p-2 hover:bg-black/10 dark:bg-white/10 rounded-full transition-colors bg-black/20 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg"
                                            >
                                                <MessageCircle className="w-4 h-4 text-black/90 dark:text-white/90" />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#EE5B3D] text-white text-[9px] font-black flex items-center justify-center">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </motion.button>

                                            <motion.button
                                                style={{ scale: iconScale }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    if (user?.id) {
                                                        router.push(`/profile/${user.id}`);
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-full overflow-hidden border border-black/20 dark:border-white/20 shadow-lg cursor-pointer hover:border-white/50 transition-colors ml-1"
                                            >
                                                <img src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-full h-full object-cover" alt="User Profile" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.header>
                            }
                            user={user}
                            activePet={activePet}
                            isSosAlertDismissed={isSosAlertDismissed}
                            setIsSosAlertDismissed={setIsSosAlertDismissed}
                            setSosActivePet={setSosActivePet}
                            setIsSOSCommandCenterOpen={setIsSOSCommandCenterOpen}
                            posts={filteredPosts}
                            storyGroups={storyGroups}
                            isLoading={isLoadingPosts}
                            viewMode={viewMode}
                            onLike={toggleLike}
                            onShare={(post) => {
                                try {
                                    if (!openShare) throw new Error("openShare is undefined");
                                    if (!post) throw new Error("post is undefined");
                                    openShare({ 
                                        title: post.title || 'Moffi Gönderisi', 
                                        text: post.content || 'Bu gönderiye göz at!', 
                                        url: typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : '' 
                                    });
                                } catch (err: any) {
                                    alert("page.tsx FeedTab onShare Hatası: " + err.message);
                                }
                            }}
                            onAddComment={addComment}
                            onToggleCommentLike={toggleCommentLike}
                            onReplyComment={addCommentReply}
                            onDeleteComment={deleteComment}
                            onEditComment={editComment}
                            onReportComment={reportComment}
                            onDeletePost={(postId) => setPostToDelete(postId)}
                            onEditPost={(post) => setEditingPost({ id: post.id, desc: post.desc, mood: post.mood, media: post.media })}
                            onStoryClick={(index) => {
                                setViewerStoryGroupIndex(index);
                                setViewerStoryIndex(0);
                            }}
                            onAddStoryClick={handleStoryClick}
                            onPostClickFromGrid={handlePostClickFromGrid}
                            isCommentsDisabled={!user?.settings?.privacy?.allowComments}
                        />
                    )}

                </AnimatePresence>
            </main>

            <input type="file" ref={cameraInputRef} className="absolute opacity-0 w-0 h-0 pointer-events-none" accept="image/*,video/*" onChange={handleCameraUpload} />

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
                            className="w-full max-w-sm bg-card dark:bg-[var(--color-camera-surface)]/80 border border-black/10 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Navigation Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 backdrop-blur-md">
                                <button onClick={() => setIsEditProfileOpen(false)} className="flex items-center gap-1 text-sm font-medium text-black/60 dark:text-white/60 hover:text-white transition-all active:scale-95 group">
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
                                    <div className="w-full h-full bg-black/5 dark:bg-white/5 relative overflow-hidden group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                                        {editCoverPreview ? (
                                            <img src={editCoverPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-cyan-900/40 to-purple-900/40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md border border-black/20 dark:border-white/20 flex items-center justify-center">
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
                                        <label htmlFor="edit-avatar-upload" className="block relative w-24 h-24 rounded-full border-4 border-[var(--color-camera-surface)] shadow-2xl cursor-pointer group bg-card dark:bg-[var(--color-camera-surface)] overflow-hidden">
                                            {editAvatarPreview ? (
                                                <img src={editAvatarPreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                                    <Camera className="w-6 h-6 text-black/50 dark:text-white/40" />
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
                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                                        <div className="px-4 py-4 border-b border-black/5 dark:border-white/5">
                                            <label className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest block mb-1">Görünen Ad</label>
                                            <input 
                                                type="text" 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)} 
                                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-black/30 dark:text-white/20"
                                                placeholder="İsminiz"
                                            />
                                        </div>
                                        <div className="px-4 py-4">
                                            <label className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest block mb-1">Kullanıcı Adı</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-black/50 dark:text-white/40">@</span>
                                                <input 
                                                    type="text" 
                                                    value={editUsername} 
                                                    onChange={e => setEditUsername(e.target.value)} 
                                                    className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-black/30 dark:text-white/20"
                                                    placeholder="kullanici_adi"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 px-4 py-4">
                                        <label className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest block mb-1">Biyografi</label>
                                        <textarea 
                                            value={editBio} 
                                            onChange={e => setEditBio(e.target.value)} 
                                            className="w-full bg-transparent text-sm font-medium text-black/80 dark:text-white/80 outline-none placeholder:text-black/30 dark:text-white/20 resize-none h-24"
                                            placeholder="Kendinizden bahsedin..."
                                        />
                                    </div>
                                </div>
                            </div>
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
                        className="fixed inset-0 z-[9999] bg-white/95 dark:bg-[var(--color-camera-surface)]/95 backdrop-blur-3xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 pt-12 pb-4 shrink-0 border-b border-[var(--card-border)]">
                            <button
                                onClick={() => { setIsUploadModalOpen(false); setUploadImageURL(null); setUploadCaption(''); setUploadMood(null); }}
                                className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center -ml-2 text-[var(--foreground)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black text-[var(--foreground)]">Yeni Gönderi</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 pb-32 flex flex-col gap-6">

                            {/* COMMUNITY WARNING & ROUTING CARDS (Ultra Compact) */}
                            <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-2.5 flex flex-col gap-2.5 shrink-0">
                                <div className="flex items-center gap-2 px-1">
                                    <Info className="w-3.5 h-3.5 text-[var(--foreground)]/60 shrink-0" strokeWidth={2} />
                                    <p className="text-[10px] text-[var(--foreground)]/70 font-semibold leading-tight">
                                        Topluluk sadece eğlence içindir. Özel durumlar için alt bölümleri kullanın:
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setIsUploadModalOpen(false); router.push('/kayip/ilan-ver'); }} className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl py-3 flex items-center justify-center gap-2 transition-all active:scale-95">
                                        <Radar className="w-4 h-4" strokeWidth={2.5} />
                                        <span className="font-bold text-[11px]">Kayıp İlanı</span>
                                    </button>
                                    <button onClick={() => { setIsUploadModalOpen(false); router.push('/sahiplendirme/ilan-ver'); }} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl py-3 flex items-center justify-center gap-2 transition-all active:scale-95">
                                        <HeartHandshake className="w-4 h-4" strokeWidth={2.5} />
                                        <span className="font-bold text-[11px]">Sahiplendirme</span>
                                    </button>
                                </div>
                            </div>

                            {/* POST CREATION GROUP */}
                            <div className="flex flex-col gap-1">
                                {/* MEDIA PICKER / PREVIEW (Apple Native Style) */}
                            {uploadImageURL ? (
                                                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                            "w-full rounded-[2.5rem] overflow-hidden bg-white dark:bg-black border border-black/10 dark:border-white/10 relative shadow-2xl group transition-all duration-500 ease-in-out shrink-0",
                                            activeTool 
                                                ? "h-[35vh] min-h-[260px]" 
                                                : "h-[65vh] min-h-[480px] max-h-[650px]"
                                        )}
                                    >
                                    {selectedFile?.type.startsWith('video/') ? (
                                        <div className="relative w-full h-full">
                                                                                                                                             <video 
                                                     ref={uploadVideoRef}
                                                     src={uploadImageURL} 
                                                     className="w-full h-full object-cover" 
                                                     style={{ 
                                                         filter: `${IMAGE_FILTERS[activeFilterIndex].filter} brightness(var(--preview-brightness, ${brightness}%)) contrast(var(--preview-contrast, ${contrast}%)) saturate(var(--preview-saturation, ${saturation}%))` 
                                                     }}
                                                    autoPlay 
                                                    muted={!!audioURL} 
                                                    loop 
                                                    playsInline 
                                                    onTimeUpdate={handleVideoTimeUpdate}
                                                />
                                            {/* Video Indicator Badge */}
                                            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-black/10 dark:border-white/10">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Video Yayında</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className="relative w-full h-full overflow-hidden"
                                            onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}
                                            onMouseDown={(e) => { touchStartX.current = e.clientX; }}
                                            onMouseUp={(e) => {
                                                if (touchStartX.current === null) return;
                                                const diff = e.clientX - touchStartX.current;
                                                if (diff > 50) handleSwipeFilter('right');
                                                else if (diff < -50) handleSwipeFilter('left');
                                                touchStartX.current = null;
                                            }}
                                        >
                                                                                             <img 
                                                     ref={uploadImageRef}
                                                     src={uploadImageURL} 
                                                     className="w-full h-full object-cover touch-pan-y" 
                                                style={{ 
                                                                                                            filter: `${IMAGE_FILTERS[activeFilterIndex].filter} brightness(var(--preview-brightness, ${brightness}%)) contrast(var(--preview-contrast, ${contrast}%)) saturate(var(--preview-saturation, ${saturation}%))` 
                                                }}
                                                draggable={false}
                                            />
                                            {/* Elegant Filter Name Overlay */}
                                            <AnimatePresence>
                                                {showFilterName && (
                                                    <motion.div 
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 1, ease: 'easeInOut' }}
                                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full px-4"
                                                    >
                                                        <p className="text-white font-light tracking-[0.4em] uppercase text-2xl drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] text-center">
                                                            {IMAGE_FILTERS[activeFilterIndex].name}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Magic Wand Auto-Enhance Button (Streamlined) */}
                                            {selectedFile?.type.startsWith('image/') && (
                                                <motion.button
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveFilterIndex(0);
                                                        setBrightness(115);
                                                        setContrast(115);
                                                        setSaturation(130);
                                                        showToast("AI İyileştirme ✨", "Profesyonel ayarlar uygulandı.", "success");
                                                    }}
                                                    className="absolute bottom-6 right-6 z-20 w-8 h-8 flex items-center justify-center text-cyan-400 hover:scale-110 transition-all active:scale-95 group"
                                                    title="AI İyileştir"
                                                >
                                                    <Sparkles className="w-5 h-5 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                                </motion.button>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Glassmorphism Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none z-10" />
                                    
                                    {/* Bottom Info Pill */}
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-30">
                                        <div className="flex gap-2">
                                            {uploadMood ? (
                                                <div className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                                    {uploadMood}
                                                </div>
                                            ) : (
                                                <div className="bg-black/20 dark:bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white/90 dark:text-white/80 uppercase tracking-widest border border-white/10">
                                                    Duygu Durumu Yok
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {/* Removed decorative icons */}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="w-full h-[45vh] min-h-[320px] max-h-[420px] rounded-[2rem] border-2 border-dashed border-black/10 dark:border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.05] hover:border-cyan-500/40 transition-all duration-700 group relative overflow-hidden shrink-0"
                                >
                                    {/* Background Glow */}
                                    <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] group-hover:bg-cyan-500/10 transition-colors" />
                                    
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-black/10 dark:border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                            <ImagePlus className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black border-4 border-[var(--color-camera-surface)] shadow-xl group-hover:scale-110 transition-transform">
                                            <Plus className="w-4 h-4" strokeWidth={3} />
                                        </div>
                                    </div>
                                    
                                    <div className="text-center relative z-10">
                                        <p className="text-white font-black text-lg tracking-tight">Anıyı Ölümsüzleştir</p>
                                        <p className="text-[var(--secondary-text)] text-xs font-medium mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                                            En sevdiğin fotoğrafı veya videoyu seç, Moffi topluluğuyla paylaş!
                                        </p>
                                    </div>

                                    {/* Direct transparent file input overlay. Fully native & synchronous. */}
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[60]" 
                                        accept="image/*,video/*" 
                                        onChange={handleCameraUpload} 
                                    />
                                </motion.div>
                            )}

                            {selectedFile?.type.startsWith('video/') && videoDuration > 0 && (
                                <div className="flex flex-col gap-3 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center text-[10px] font-black tracking-wide text-black/50 dark:text-white/50 px-1">
                                        <div className="flex items-center gap-1.5 text-cyan-400">
                                            <Timer className="w-3.5 h-3.5" />
                                            <span className="font-extrabold uppercase text-[9px] tracking-wider">{(videoTrimRange[1] - videoTrimRange[0]).toFixed(1)} sn seçildi</span>
                                        </div>
                                        <div className="font-mono text-[9px] text-black/40 dark:text-white/30 flex gap-2">
                                            <span>{videoTrimRange[0].toFixed(1)}s – {videoTrimRange[1].toFixed(1)}s</span>
                                            <span className="text-white/10">|</span>
                                            <span>Toplam: {videoDuration.toFixed(1)}s</span>
                                        </div>
                                    </div>

                                    {/* Visual Trimmer Timeline Track */}
                                    <div 
                                        ref={trimmerRef}
                                        className="relative h-8 bg-white/[0.01] rounded-xl border border-black/5 dark:border-white/5 overflow-visible select-none mt-2"
                                    >
                                        {/* Background waveform mock bars to look like a timeline */}
                                        <div className="absolute inset-0 flex items-center justify-between px-3 gap-[2px] opacity-25 pointer-events-none z-0">
                                            {Array.from({ length: 48 }).map((_, i) => {
                                                const height = 10 + Math.sin(i * 0.4) * 6 + Math.cos(i * 0.7) * 3;
                                                const barTime = (i / 47) * videoDuration;
                                                const isActive = barTime >= videoTrimRange[0] && barTime <= videoTrimRange[1];
                                                return (
                                                    <div 
                                                        key={i} 
                                                        style={{ height: `${Math.max(4, Math.min(20, height))}px` }} 
                                                        className={cn(
                                                            "w-[1.5px] rounded-full transition-all duration-350", 
                                                            isActive 
                                                                ? "bg-gradient-to-t from-cyan-400 to-purple-400 opacity-90 scale-y-110" 
                                                                : "bg-white/40 opacity-30"
                                                        )}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Dimmed Areas (Discarded parts) */}
                                        {/* Left dim */}
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 bg-black/75 backdrop-blur-[1px] z-10 transition-all pointer-events-none rounded-l-xl"
                                            style={{ width: `${(videoTrimRange[0] / videoDuration) * 100}%` }}
                                        />
                                        {/* Right dim */}
                                        <div 
                                            className="absolute right-0 top-0 bottom-0 bg-black/75 backdrop-blur-[1px] z-10 transition-all pointer-events-none rounded-r-xl"
                                            style={{ width: `${100 - (videoTrimRange[1] / videoDuration) * 100}%` }}
                                        />

                                        {/* Active Selected Range Window (Draggable) */}
                                        <div 
                                            onPointerDown={(e) => handleTrimmerPointerDown(e, 'window')}
                                            className="absolute top-0 bottom-0 border-y-[1.5px] border-cyan-400 bg-cyan-500/[0.03] shadow-[inset_0_0_15px_rgba(34,211,238,0.05)] z-10 cursor-grab active:cursor-grabbing hover:bg-cyan-400/[0.08] transition-colors"
                                            style={{ 
                                                left: `${(videoTrimRange[0] / videoDuration) * 100}%`,
                                                right: `${100 - (videoTrimRange[1] / videoDuration) * 100}%`
                                            }}
                                        />

                                        {/* Live Playhead Indicator */}
                                        <div 
                                            className="absolute top-0 bottom-0 w-[1.5px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20 pointer-events-none transition-all"
                                            style={{ left: `${(videoCurrentTime / videoDuration) * 100}%` }}
                                        />

                                        {/* Dynamic Drag Tooltips */}
                                        {draggingHandle === 'start' && (
                                            <div 
                                                className="absolute -top-9 bg-cyan-400 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-[0_4px_12px_rgba(34,211,238,0.3)] -translate-x-1/2 pointer-events-none z-40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-cyan-400"
                                                style={{ left: `${(videoTrimRange[0] / videoDuration) * 100}%` }}
                                            >
                                                {videoTrimRange[0].toFixed(1)}s
                                            </div>
                                        )}
                                        {draggingHandle === 'end' && (
                                            <div 
                                                className="absolute -top-9 bg-cyan-400 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-[0_4px_12px_rgba(34,211,238,0.3)] -translate-x-1/2 pointer-events-none z-40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-cyan-400"
                                                style={{ left: `${(videoTrimRange[1] / videoDuration) * 100}%` }}
                                            >
                                                {videoTrimRange[1].toFixed(1)}s
                                            </div>
                                        )}
                                        {draggingHandle === 'window' && (
                                            <div 
                                                className="absolute -top-9 bg-purple-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-[0_4px_12px_rgba(168,85,247,0.3)] -translate-x-1/2 pointer-events-none z-40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-purple-500"
                                                style={{ left: `${((videoTrimRange[0] + videoTrimRange[1]) / 2) / videoDuration * 100}%` }}
                                            >
                                                {((videoTrimRange[1] - videoTrimRange[0])).toFixed(1)}s
                                            </div>
                                        )}

                                        {/* Left Handle */}
                                        <div 
                                            onPointerDown={(e) => handleTrimmerPointerDown(e, 'start')}
                                            className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center touch-none"
                                            style={{ left: `calc(${(videoTrimRange[0] / videoDuration) * 100}% - 12px)` }}
                                        >
                                            <div 
                                                className={cn(
                                                    "w-[3px] h-full bg-cyan-400 rounded-full transition-all duration-200 shadow-md",
                                                    draggingHandle === 'start' ? "bg-cyan-300 scale-y-105 shadow-[0_0_10px_rgba(34,211,238,0.6)]" : "hover:bg-cyan-300"
                                                )}
                                            />
                                        </div>

                                        {/* Right Handle */}
                                        <div 
                                            onPointerDown={(e) => handleTrimmerPointerDown(e, 'end')}
                                            className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center touch-none"
                                            style={{ left: `calc(${(videoTrimRange[1] / videoDuration) * 100}% - 12px)` }}
                                        >
                                            <div 
                                                className={cn(
                                                    "w-[3px] h-full bg-cyan-400 rounded-full transition-all duration-200 shadow-md",
                                                    draggingHandle === 'end' ? "bg-cyan-300 scale-y-105 shadow-[0_0_10px_rgba(34,211,238,0.6)]" : "hover:bg-cyan-300"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Filter guide hint */}
                            {selectedFile?.type.startsWith('image/') && (
                                <p className="text-center text-[10px] text-black/40 dark:text-white/30 font-medium tracking-widest uppercase mt-2 mb-1 animate-pulse">
                                    Filtreleri değiştirmek için fotoğrafı sağa sola kaydır
                                </p>
                            )}

                            {/* STYLISH EXTERNAL ACTION BAR */}
                            {uploadImageURL && (
                                <div className="flex items-center justify-center gap-3 mt-1 mb-2">
                                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-2 py-1.5 flex items-center gap-2 shadow-sm">
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] transition-all active:scale-95"
                                                title="Medyayı Değiştir"
                                            >
                                                <Camera className="w-4 h-4 text-cyan-500" />
                                                <span className="text-[11px] font-bold">Değiştir</span>
                                            </button>
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                                                accept="image/*,video/*" 
                                                onChange={handleCameraUpload} 
                                            />
                                        </div>
                                        
                                        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />

                                        <button 
                                            type="button"
                                            onClick={() => audioInputRef.current?.click()}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-full transition-all active:scale-95",
                                                audioURL 
                                                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" 
                                                    : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)]"
                                            )}
                                            title="Müzik/Ses Ekle"
                                        >
                                            <Mic className={cn("w-4 h-4", audioURL ? "text-cyan-500" : "text-purple-500")} />
                                            <span className="text-[11px] font-bold">Ses Ekle</span>
                                        </button>
                                        
                                        <input 
                                            type="file" 
                                            ref={audioInputRef}
                                            className="hidden" 
                                            accept="audio/*" 
                                            onChange={handleAudioUpload} 
                                        />
                                        {audioURL && (
                                            <audio 
                                                ref={uploadAudioRef}
                                                src={audioURL}
                                                loop
                                            />
                                        )}

                                        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />

                                        <button 
                                            type="button"
                                            onClick={() => { setUploadImageURL(null); setSelectedFile(null); setAudioFile(null); setAudioURL(null); }}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 shrink-0"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* MINIMAL CAPTION BOX */}
                            <div className="px-2 pt-2 shrink-0">
                                <textarea
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    onInput={(e) => {
                                        e.currentTarget.style.height = 'auto';
                                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                    }}
                                    placeholder="Neler oluyor?.."
                                    className="w-full bg-transparent outline-none text-[var(--foreground)] resize-none min-h-[40px] max-h-[100px] text-lg font-medium py-1 overflow-hidden placeholder:text-black/30 dark:text-white/20"
                                    rows={1}
                                />
                            </div>









                            {/* SMART TOOLBAR */}
                            <div className="flex items-center justify-between px-2 py-4 mt-2 shrink-0">
                                 <div className="flex flex-wrap items-center gap-2">
                                     <button 
                                         type="button"
                                         onClick={() => { console.log("Adjust clicked. Current activeTool:", activeTool); setActiveTool(activeTool === 'adjust' ? null : 'adjust'); }}
                                         className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border", activeTool === 'adjust' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-black/5 dark:bg-white/5 text-[var(--secondary-text)] border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--foreground)]")}
                                         title="İnce Ayar"
                                     >
                                         <Palette className="w-4 h-4" />
                                         <span className="text-[10px] font-bold tracking-wide">Ayar</span>
                                     </button>
                                     <button 
                                         type="button"
                                         onClick={() => { console.log("Tag clicked. Current activeTool:", activeTool); setActiveTool(activeTool === 'tag' ? null : 'tag'); }}
                                         className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border", activeTool === 'tag' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-black/5 dark:bg-white/5 text-[var(--secondary-text)] border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--foreground)]")}
                                         title="Etiketle"
                                     >
                                         <PawPrint className="w-4 h-4" />
                                         <span className="text-[10px] font-bold tracking-wide">Etiket</span>
                                     </button>
                                     <button 
                                         type="button"
                                         onClick={() => { console.log("Schedule clicked. Current activeTool:", activeTool); setActiveTool(activeTool === 'schedule' ? null : 'schedule'); }}
                                         className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border", activeTool === 'schedule' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-black/5 dark:bg-white/5 text-[var(--secondary-text)] border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--foreground)]")}
                                         title="Zamanla"
                                     >
                                         <Clock className="w-4 h-4" />
                                         <span className="text-[10px] font-bold tracking-wide">Zaman</span>
                                     </button>
                                     <button 
                                         type="button"
                                         onClick={() => { console.log("Mood clicked. Current activeTool:", activeTool); setActiveTool(activeTool === 'mood' ? null : 'mood'); }}
                                         className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border", activeTool === 'mood' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-black/5 dark:bg-white/5 text-[var(--secondary-text)] border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--foreground)]")}
                                         title="Ruh Hali"
                                     >
                                         <Heart className="w-4 h-4" />
                                         <span className="text-[10px] font-bold tracking-wide">His</span>
                                     </button>
                                 </div>
                                
                                <button 
                                    type="button"
                                    onClick={generateAICaption}
                                    disabled={isGeneratingAI}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 border ml-2",
                                        isGeneratingAI ? "bg-black/5 dark:bg-white/5 opacity-50 border-transparent" : "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-500 border-cyan-500/20 hover:from-cyan-500/20 hover:to-purple-500/20"
                                    )}
                                >
                                    {isGeneratingAI ? <div className="w-3.5 h-3.5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">AI</span>
                                </button>
                            </div>
                            </div>

                            {/* DYNAMIC TOOL DRAWER */}
                            {activeTool && (
                                                                         <motion.div
                                             key={activeTool}
                                             id="upload-tool-drawer"
                                             initial={{ opacity: 0, y: -10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             className="bg-[var(--color-camera-surface)]/30 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shrink-0"
                                         >
                                             <div className="p-4">
                                                 {activeTool === 'adjust' && (
                                                     <div className="flex flex-col gap-4">
                                                         {/* Sub-tool selector & Reset */}
                                                         <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2.5">
                                                             <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1">
                                                                 <button 
                                                                     type="button" 
                                                                     onClick={() => setActiveAdjustSubTool('brightness')} 
                                                                     className={cn(
                                                                         "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 relative py-1",
                                                                         activeAdjustSubTool === 'brightness' 
                                                                             ? "text-cyan-400" 
                                                                             : "text-white/35 hover:text-black/60 dark:text-white/60"
                                                                     )}
                                                                 >
                                                                     <Sun className="w-3.5 h-3.5" /> Parlaklık
                                                                     {activeAdjustSubTool === 'brightness' && (
                                                                         <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                                                                     )}
                                                                 </button>
                                                                 <button 
                                                                     type="button" 
                                                                     onClick={() => setActiveAdjustSubTool('contrast')} 
                                                                     className={cn(
                                                                         "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 relative py-1",
                                                                         activeAdjustSubTool === 'contrast' 
                                                                             ? "text-cyan-400" 
                                                                             : "text-white/35 hover:text-black/60 dark:text-white/60"
                                                                     )}
                                                                 >
                                                                     <Contrast className="w-3.5 h-3.5" /> Kontrast
                                                                     {activeAdjustSubTool === 'contrast' && (
                                                                         <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                                                                     )}
                                                                 </button>
                                                                 <button 
                                                                     type="button" 
                                                                     onClick={() => setActiveAdjustSubTool('saturation')} 
                                                                     className={cn(
                                                                         "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 relative py-1",
                                                                         activeAdjustSubTool === 'saturation' 
                                                                             ? "text-cyan-400" 
                                                                             : "text-white/35 hover:text-black/60 dark:text-white/60"
                                                                     )}
                                                                 >
                                                                     <Droplet className="w-3.5 h-3.5" /> Doygunluk
                                                                     {activeAdjustSubTool === 'saturation' && (
                                                                         <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                                                                     )}
                                                                 </button>
                                                             </div>
                                                             <button 
                                                                 type="button" 
                                                                 onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }} 
                                                                 className="text-[9px] font-black text-black/40 dark:text-white/30 hover:text-red-400 uppercase tracking-widest active:scale-95 transition-all shrink-0 ml-2"
                                                             >
                                                                 Sıfırla
                                                             </button>
                                                         </div>

                                                         {/* Slider section - merged value label inline to save vertical space */}
                                                         <div className="py-1">
                                                             {activeAdjustSubTool === 'brightness' && (
                                                                 <div className="flex items-center gap-4">
                                                                     <input 
                                                                         type="range" 
                                                                         min="50" 
                                                                         max="150" 
                                                                         step="1" 
                                                                         value={brightness} 
                                                                         onChange={(e) => setBrightness(parseInt(e.target.value))} 
                                                                         className="flex-1 pro-range-slider cursor-pointer animate-none" 
                                                                         style={{
                                                                             background: `linear-gradient(to right, #06b6d4 0%, #8b5cf6 ${((brightness - 50) / (150 - 50)) * 100}%, rgba(255, 255, 255, 0.08) ${((brightness - 50) / (150 - 50)) * 100}%)`
                                                                         }}
                                                                     />
                                                                     <span className="font-mono text-cyan-400 text-xs min-w-[36px] text-right font-bold">{Math.round(brightness)}%</span>
                                                                 </div>
                                                             )}
                                                             {activeAdjustSubTool === 'contrast' && (
                                                                 <div className="flex items-center gap-4">
                                                                     <input 
                                                                         type="range" 
                                                                         min="50" 
                                                                         max="150" 
                                                                         step="1" 
                                                                         value={contrast} 
                                                                         onChange={(e) => setContrast(parseInt(e.target.value))} 
                                                                         className="flex-1 pro-range-slider cursor-pointer animate-none" 
                                                                         style={{
                                                                             background: `linear-gradient(to right, #06b6d4 0%, #8b5cf6 ${((contrast - 50) / (150 - 50)) * 100}%, rgba(255, 255, 255, 0.08) ${((contrast - 50) / (150 - 50)) * 100}%)`
                                                                         }}
                                                                     />
                                                                     <span className="font-mono text-cyan-400 text-xs min-w-[36px] text-right font-bold">{Math.round(contrast)}%</span>
                                                                 </div>
                                                             )}
                                                             {activeAdjustSubTool === 'saturation' && (
                                                                 <div className="flex items-center gap-4">
                                                                     <input 
                                                                         type="range" 
                                                                         min="0" 
                                                                         max="200" 
                                                                         step="1" 
                                                                         value={saturation} 
                                                                         onChange={(e) => setSaturation(parseInt(e.target.value))} 
                                                                         className="flex-1 pro-range-slider cursor-pointer animate-none" 
                                                                         style={{
                                                                             background: `linear-gradient(to right, #06b6d4 0%, #8b5cf6 ${(saturation / 200) * 100}%, rgba(255, 255, 255, 0.08) ${(saturation / 200) * 100}%)`
                                                                         }}
                                                                     />
                                                                     <span className="font-mono text-cyan-400 text-xs min-w-[36px] text-right font-bold">{Math.round(saturation)}%</span>
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </div>
                                                 )}

                                            {activeTool === 'tag' && (
                                                <div className="flex flex-col gap-4">
                                                    <span className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest">Dostunu Etiketle</span>
                                                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                                                        {userPets?.map(pet => (
                                                            <button 
                                                                key={pet.id} 
                                                                type="button"
                                                                onClick={() => setTaggedPetIds(prev => prev.includes(pet.id) ? prev.filter(id => id !== pet.id) : [...prev, pet.id])}
                                                                className="flex flex-col items-center gap-2 shrink-0"
                                                            >
                                                                <div className={cn("w-12 h-12 rounded-full border-2 transition-all relative", taggedPetIds.includes(pet.id) ? "border-cyan-500 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-black/10 dark:border-white/10")}>
                                                                    <img src={pet.avatar} className="w-full h-full rounded-full object-cover p-0.5" />
                                                                    {taggedPetIds.includes(pet.id) && <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-black"><Check size={8} /></div>}
                                                                </div>
                                                                <span className={cn("text-[9px] font-bold uppercase", taggedPetIds.includes(pet.id) ? "text-cyan-400" : "text-black/50 dark:text-white/40")}>{pet.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeTool === 'schedule' && (
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest">Paylaşım Zamanı</span>
                                                        <button type="button" onClick={() => setIsSchedulingMode(!isSchedulingMode)} className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all", isSchedulingMode ? "bg-cyan-500 text-black" : "bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40")}>
                                                            {isSchedulingMode ? 'Zamanlandı' : 'Şimdi'}
                                                        </button>
                                                    </div>
                                                    {isSchedulingMode && (
                                                        <input type="datetime-local" value={scheduledDate || ''} onChange={(e) => setScheduledDate(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-white [color-scheme:dark]" />
                                                    )}
                                                </div>
                                            )}

                                            {activeTool === 'mood' && (
                                                <div className="flex flex-col gap-4">
                                                    <span className="text-[10px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest">Ruh Hali</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {MOOD_OPTIONS.map(mood => (
                                                            <button type="button" key={mood} onClick={() => setUploadMood(uploadMood === mood ? null : mood)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", uploadMood === mood ? "bg-white text-black scale-105" : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/40 hover:bg-black/10 dark:bg-white/10")}>
                                                                {mood}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                        </div>

                        {/* SUBMIT BUTTON - STICKY FOOTER */}
                        {uploadImageURL && (
                            <div className="p-4 sm:p-5 bg-transparent shrink-0 sticky bottom-4 z-50 flex justify-center pointer-events-none">
                                <button
                                    onClick={publishPost}
                                    disabled={isPublishing}
                                    className={cn(
                                        "pointer-events-auto px-10 py-3.5 rounded-full font-bold text-white dark:text-black text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)]",
                                        isPublishing ? "bg-gray-600 dark:bg-gray-400 opacity-50 cursor-not-allowed" : "bg-[#111] dark:bg-white hover:scale-[1.02] active:scale-95 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                                    )}
                                >
                                    {isPublishing ? (
                                        <><div className="w-4 h-4 border-[2px] border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" /> Bekleyin</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Paylaş</>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STORY PREVIEW MODAL (The Professional Review Phase) */}
            <AnimatePresence>
                {storyPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-white dark:bg-black overflow-y-auto"
                    >
                        {/* Immersive Background Blur - FIXED & TOP PRIORITY */}
                        <div className="fixed inset-0 z-0 pointer-events-none">
                            <img src={storyPreview} className="w-full h-full object-cover blur-3xl opacity-50" />
                        </div>

                        <div className="relative z-10 flex flex-col min-h-screen">
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 sm:p-6 pt-8">
                                <button
                                    onClick={() => setStoryPreview(null)}
                                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-black/10 dark:border-white/10 active:scale-90 transition-transform"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <h2 className="text-white font-black text-lg uppercase tracking-tighter">Hikaye Önizleme</h2>
                                <div className="w-10" />
                            </div>

                            {/* Preview Content - Responsive & Safe */}
                            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
                                <div className="w-full max-w-[300px] sm:max-w-[340px] max-h-[65vh] aspect-[9/16] rounded-[48px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[6px] border-black/10 dark:border-white/10 relative">
                                    <img src={storyPreview} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
                                    
                                    {/* Glass Overlay for extra premium feel */}
                                    <div className="absolute inset-0 border border-black/10 dark:border-white/10 rounded-[42px] pointer-events-none" />
                                </div>
                            </div>

                            {/* Footer Controls - Clears Nav Bar */}
                            <div className="p-4 sm:p-8 pb-32 flex flex-col gap-5">
                            <button
                                onClick={confirmUploadStory}
                                disabled={isUploadingStory}
                                className={cn(
                                    "w-full py-4 rounded-full font-black text-white text-lg flex items-center justify-center gap-2 shadow-2xl transition-all",
                                    isUploadingStory ? "bg-gray-600 opacity-50 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-[1.02] active:scale-95"
                                )}
                            >
                                {isUploadingStory ? (
                                    <><div className="w-5 h-5 border-2 border-black/30 dark:border-white/30 border-t-white rounded-full animate-spin" /> Yükleniyor...</>
                                ) : (
                                    <><Sparkles className="w-5 h-5" /> Hikayeyi Paylaş</>
                                )}
                            </button>
                            <button
                                onClick={() => setStoryPreview(null)}
                                className="w-full py-3 text-black/60 dark:text-white/60 font-bold hover:text-white transition-colors"
                            >
                                Vazgeç
                            </button>
                        </div>
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
                        <div className="flex justify-between items-center p-4 sm:p-6 shrink-0 border-b border-[var(--card-border)]">
                            <button
                                onClick={() => setEditingPost(null)}
                                className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center -ml-2 text-[var(--foreground)] hover:bg-black/20 dark:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black text-[var(--foreground)]">Gönderiyi Düzenle</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 pb-32 flex flex-col gap-6">

                            {/* PREVIEW */}
                            <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-black/10 dark:border-white/10 relative shadow-2xl">
                                <img src={editingPost.media} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {editingPost.mood && (
                                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[var(--foreground)] border border-black/20 dark:border-white/20">
                                            {editingPost.mood}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CAPTION */}
                            <div className="bg-[var(--card-bg)] border border-black/10 dark:border-white/10 rounded-3xl p-4 flex gap-4">
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
                                                editingPost.mood === mood ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-[var(--card-bg)] border-black/10 dark:border-white/10 text-[var(--foreground)] hover:bg-black/10 dark:bg-white/10"
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

            {/* APPLE STYLE DELETE CONFIRMATION ALERT FOR STORY */}
            <AnimatePresence>
                {storyToDelete !== null && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
                            onClick={() => { setStoryToDelete(null); setIsStoryPaused(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-[#f0f0f0] dark:bg-[var(--color-camera-surface)] w-[270px] rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto items-center border border-black/10 dark:border-white/10">
                                <div className="p-5 flex flex-col items-center gap-1 w-full text-center">
                                    <h3 className="font-bold text-[17px] tracking-tight text-black dark:text-white leading-tight">
                                        Hikayeyi Sil
                                    </h3>
                                    <p className="text-[13px] text-black/60 dark:text-white/60 leading-tight px-2">
                                        Bu hikayeyi kalıcı olarak silmek istediğinize emin misiniz?
                                    </p>
                                </div>
                                <div className="flex flex-col w-full border-t border-black/10 dark:border-white/10">
                                    <button
                                        onClick={async () => {
                                            const res = await deleteStory(storyToDelete);
                                            if (res && res.success) {
                                                closeStoryViewer();
                                            } else {
                                                setLikeError(res?.error || "Hikaye silinemedi");
                                            }
                                            setStoryToDelete(null);
                                            setIsStoryPaused(false);
                                        }}
                                        className="w-full py-3.5 text-red-500 font-bold text-[15px] border-b border-black/10 dark:border-white/10 hover:bg-[var(--card-bg)] transition-colors active:bg-black/10 dark:bg-white/10"
                                    >
                                        Sil
                                    </button>
                                    <button
                                        onClick={() => { setStoryToDelete(null); setIsStoryPaused(false); }}
                                        className="w-full py-3.5 text-cyan-500 font-normal text-[15px] hover:bg-[var(--card-bg)] transition-colors active:bg-black/10 dark:bg-white/10"
                                    >
                                        Vazgeç
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
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
                            className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm"
                            onClick={() => setPostToDelete(null)}
                        />
                        {/* Elegant iOS-like Center Alert Popup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="w-full max-w-[280px] bg-[var(--color-camera-surface)]/95 backdrop-blur-xl rounded-3xl overflow-hidden pointer-events-auto shadow-2xl border border-black/10 dark:border-white/10 flex flex-col">
                                <div className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 border-b border-black/10 dark:border-white/10">
                                    <h3 className="text-[var(--foreground)] text-base font-bold">Gönderiyi Sil</h3>
                                    <p className="text-[var(--foreground)]/70 text-sm leading-snug">Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                                </div>
                                <div className="flex flex-col">
                                    <button
                                        onClick={deletePost}
                                        className="w-full py-3.5 text-red-500 font-bold text-[15px] border-b border-black/10 dark:border-white/10 hover:bg-[var(--card-bg)] transition-colors active:bg-black/10 dark:bg-white/10"
                                    >
                                        Sil
                                    </button>
                                    <button
                                        onClick={() => setPostToDelete(null)}
                                        className="w-full py-3.5 text-cyan-500 font-normal text-[15px] hover:bg-[var(--card-bg)] transition-colors active:bg-black/10 dark:bg-white/10"
                                    >
                                        Vazgeç
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
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
                            className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col justify-center items-center"
                        >
                            {/* Progress Bars Placeholder */}
                            <div className="absolute top-4 left-4 right-4 z-10 flex gap-1 h-0.5">
                                {storyGroups[viewerStoryGroupIndex].stories.map((_, idx) => (
                                    <div key={idx} className="flex-1 bg-black/20 dark:bg-white/20 overflow-hidden rounded-full relative">
                                                                                <StoryProgressBar 
                                            isActive={idx === viewerStoryIndex} 
                                            isCompleted={idx < viewerStoryIndex}
                                            isPaused={isStoryPaused} 
                                            onComplete={() => nextStory()} 
                                            duration={6000} 
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Top Header */}
                            <div className="absolute top-8 left-4 right-4 z-30 flex justify-between items-center text-[var(--foreground)] drop-shadow-md">
                                <div className="flex items-center gap-3">
                                    <img src={(storyGroups[viewerStoryGroupIndex].user_id === user?.id ? (user?.avatar || storyGroups[viewerStoryGroupIndex].author_avatar) : storyGroups[viewerStoryGroupIndex].author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-8 h-8 rounded-full border border-white/40 object-cover" />
                                    <span className="font-bold text-sm tracking-wide">{storyGroups[viewerStoryGroupIndex].author_name}</span>
                                    <span className="text-[var(--foreground)]/60 text-xs mt-0.5">· {formatTimeAgo(storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {storyGroups[viewerStoryGroupIndex].user_id === user?.id && (
                                        <button onClick={async (e) => {
                                            e.stopPropagation();
                                            setIsStoryPaused(true);
                                            setStoryToDelete(storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].id);
                                        }} className="w-8 h-8 rounded-full bg-red-500/80 text-white backdrop-blur-md flex items-center justify-center border border-red-500 active:scale-90 transition-transform shadow-lg"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={closeStoryViewer} className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-black/20 dark:border-white/20 active:scale-90 transition-transform"><X className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Media Display */}
                            <div className="relative w-full h-full md:max-w-md md:aspect-[9/16] md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden bg-[var(--color-camera-surface)] md:border md:border-black/10 dark:border-white/10 shadow-2xl">
                                <img
                                    key={storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].id}
                                    src={storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].media_url}
                                    className="w-full h-full object-cover"
                                />

                                {/* Gradients */}
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                {/* Tap & Hold Zones */}
                                <div className="absolute inset-y-0 left-0 w-1/3 z-20 flex select-none touch-none">
                                    <div 
                                        className="w-full h-full cursor-pointer"
                                        onMouseDown={() => {
                                            storyPressStartTime.current = Date.now();
                                            setIsStoryPaused(true);
                                        }}
                                        onMouseUp={() => {
                                            setIsStoryPaused(false);
                                            const duration = Date.now() - storyPressStartTime.current;
                                            if (duration < 250) prevStory();
                                        }}
                                        onMouseLeave={() => {
                                            setIsStoryPaused(false);
                                        }}
                                        onTouchStart={() => {
                                            storyPressStartTime.current = Date.now();
                                            setIsStoryPaused(true);
                                        }}
                                        onTouchEnd={() => {
                                            setIsStoryPaused(false);
                                            const duration = Date.now() - storyPressStartTime.current;
                                            if (duration < 250) prevStory();
                                        }}
                                        onTouchCancel={() => {
                                            setIsStoryPaused(false);
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-y-0 right-0 w-2/3 z-20 flex select-none touch-none">
                                    <div 
                                        className="w-full h-full cursor-pointer"
                                        onMouseDown={() => {
                                            storyPressStartTime.current = Date.now();
                                            setIsStoryPaused(true);
                                        }}
                                        onMouseUp={() => {
                                            setIsStoryPaused(false);
                                            const duration = Date.now() - storyPressStartTime.current;
                                            if (duration < 250) nextStory();
                                        }}
                                        onMouseLeave={() => {
                                            setIsStoryPaused(false);
                                        }}
                                        onTouchStart={() => {
                                            storyPressStartTime.current = Date.now();
                                            setIsStoryPaused(true);
                                        }}
                                        onTouchEnd={() => {
                                            setIsStoryPaused(false);
                                            const duration = Date.now() - storyPressStartTime.current;
                                            if (duration < 250) nextStory();
                                        }}
                                        onTouchCancel={() => {
                                            setIsStoryPaused(false);
                                        }}
                                    />
                                </div>

                                {/* Bottom Actions 📸 */}
                                <div className="absolute inset-x-0 bottom-0 p-4 z-30 flex items-center gap-3">
                                    {storyGroups[viewerStoryGroupIndex].user_id === user?.id ? (
                                        <div className="flex items-center justify-start w-full text-[var(--foreground)]">
                                            <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); handleOpenStoryViews(storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].id); }}>
                                                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10 backdrop-blur-md">
                                                    <Activity className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-[8px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest">Görüntüleme</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end w-full text-[var(--foreground)]">
                                            <button 
                                                className="flex flex-col items-center gap-1 active:scale-95 transition-transform group" 
                                                onClick={async (e) => { 
                                                    e.stopPropagation(); 
                                                    const story = storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex];
                                                    
                                                    // Animasyonlu geri bildirim
                                                    const iconContainer = e.currentTarget.querySelector('.heart-container');
                                                    if (iconContainer) {
                                                        iconContainer.classList.add('scale-125');
                                                        setTimeout(() => iconContainer.classList.remove('scale-125'), 150);
                                                    }
                                                    
                                                    const res = await toggleStoryLike(story.id);
                                                    if (res && !res.success) {
                                                        setLikeError(res.error || "Bilinmeyen bir hata");
                                                    }
                                                }}
                                            >
                                                <div className="heart-container w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10 backdrop-blur-md transition-transform duration-200">
                                                    <Heart className={`w-4 h-4 ${storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                                                </div>
                                                <span className={`text-[8px] font-black ${storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].isLiked ? 'text-red-500' : 'text-black/50 dark:text-white/40'} uppercase tracking-widest`}>
                                                    {storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].isLiked ? 'Beğenildi' : 'Beğen'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* DEBUG ERROR CARD FOR STORY LIKES */}
            {likeError && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-500/30">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="font-bold text-lg text-[var(--foreground)]">Beğeni Hatası</h3>
                            <p className="text-sm text-[var(--secondary-text)] p-3 bg-secondary border border-[var(--card-border)] rounded-xl font-mono break-words w-full select-all">
                                {likeError}
                            </p>
                            <p className="text-xs text-[var(--secondary-text)]/70">Lütfen bu hatayı kopyalayıp asistana gönderin.</p>
                            <button 
                                onClick={() => setLikeError(null)}
                                className="mt-2 w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold active:scale-95 transition-transform"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODULAR OVERLAY SYSTEM (LIFTED) */}
            <OverlaySystem 
                user={user}
                userPets={userPets}
                activePet={activePet}
                switchPet={switchPet}
                updatePet={updatePet}
                isProfileMenuOpen={isProfileMenuOpen}
                setIsProfileMenuOpen={setIsProfileMenuOpen}
                profileViewMode={profileViewMode}
                setProfileViewMode={setProfileViewMode}
                qrModalPet={qrModalPet}
                setQrModalPet={setQrModalPet}
                isFullScreenQR={isFullScreenQR}
                setIsFullScreenQR={setIsFullScreenQR}
                selectedSharePost={selectedSharePost}
                setSelectedSharePost={setSelectedSharePost}
                isNotificationsOpen={isNotificationsOpen}
                setIsNotificationsOpen={setIsNotificationsOpen}
                setNotificationsList={() => {}}
                isPetSettingsOpen={isPetSettingsOpen}
                setIsPetSettingsOpen={setIsPetSettingsOpen}
                settingsPet={settingsPet}
                isVetQuickSheetOpen={isVetQuickSheetOpen}
                setIsVetQuickSheetOpen={setIsVetQuickSheetOpen}
                isMarketQuickSheetOpen={isMarketQuickSheetOpen}
                setIsMarketQuickSheetOpen={setIsMarketQuickSheetOpen}
                isStudioQuickSheetOpen={isStudioQuickSheetOpen}
                setIsStudioQuickSheetOpen={setIsStudioQuickSheetOpen}
                isGameQuickSheetOpen={isGameQuickSheetOpen}
                setIsGameQuickSheetOpen={setIsGameQuickSheetOpen}
                isEcosystemPortalOpen={isEcosystemPortalOpen}
                setIsEcosystemPortalOpen={setIsEcosystemPortalOpen}
                isSpotlightOpen={isSpotlightOpen}
                setIsSpotlightOpen={setIsSpotlightOpen}
                isDiaryOpen={isDiaryOpen}
                setIsDiaryOpen={setIsDiaryOpen}
                setActiveTab={setActiveTab}
            />

            {/* STORY VIEWS DRAWER */}
            <AnimatePresence>
                {isStoryViewsDrawerOpen && (
                    <motion.div
                        initial={{ y: "120%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "120%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 250 }}
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[250] bg-white/95 dark:bg-[var(--color-camera-surface)]/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] border border-black/5 dark:border-white/10 flex flex-col max-h-[75vh]"
                    >
                        {/* Elegant Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
                            <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
                        </div>
                        
                        <div className="px-6 pb-4 pt-2 shrink-0 flex flex-col items-center justify-center relative border-b border-black/5 dark:border-white/5">
                            <h2 className="text-[var(--foreground)] font-extrabold text-[17px] tracking-tight">Görüntüleyenler</h2>
                            <p className="text-[var(--secondary-text)] text-[12px] font-medium mt-0.5">{storyViewers.length} Kişi</p>
                            
                            <button
                                onClick={() => {
                                    setIsStoryViewsDrawerOpen(false);
                                    setIsStoryPaused(false);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--foreground)] active:scale-90 transition-transform"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 pb-10">
                            {isLoadingStoryViewers ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-6 h-6 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
                                </div>
                            ) : storyViewers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <span className="text-[var(--secondary-text)] font-medium text-sm">Hikayenizi henüz kimse görmedi.</span>
                                </div>
                            ) : (
                                storyViewers.map((viewer, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        key={viewer.id}
                                        onClick={() => {
                                            setIsStoryViewsDrawerOpen(false);
                                            setIsStoryPaused(false);
                                            router.push(`/profile/${viewer.id}`);
                                        }}
                                        className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-zinc-800 shrink-0">
                                            {viewer.avatar ? (
                                                <img src={viewer.avatar} alt={viewer.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-full h-full p-3.5 text-[var(--secondary-text)]" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                            <div className="flex flex-col text-left justify-center">
                                                <span className="text-[var(--foreground)] font-bold text-[15px] leading-tight truncate">{viewer.name}</span>
                                                <span className="text-[var(--secondary-text)] font-medium text-[13px] mt-0.5">@{viewer.username}</span>
                                            </div>
                                            {viewer.is_liked && (
                                                <div className="shrink-0 pl-2 pr-1">
                                                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QUICK SHEETS & DETAILED MODALS */}
            {isVetQuickSheetOpen && (
                <VetQuickSheet 
                    isOpen={isVetQuickSheetOpen} 
                    onClose={() => setIsVetQuickSheetOpen(false)} 
                    petId={activePet?.id} 
                />
            )}
            {isMarketQuickSheetOpen && (
                <MarketQuickSheet 
                    isOpen={isMarketQuickSheetOpen} 
                    onClose={() => setIsMarketQuickSheetOpen(false)} 
                />
            )}
            {isStudioQuickSheetOpen && (
                <StudioQuickSheet 
                    isOpen={isStudioQuickSheetOpen} 
                    onClose={() => setIsStudioQuickSheetOpen(false)} 
                />
            )}
            {isGameQuickSheetOpen && (
                <GameQuickSheet 
                    isOpen={isGameQuickSheetOpen} 
                    onClose={() => setIsGameQuickSheetOpen(false)} 
                />
            )}
        </div>
    );
}

// -- SETTINGS ROW COMPONENT --
function SettingsRow({ icon: Icon, label, danger, onClick }: { icon: any, label: string, danger?: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn("w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--card-bg)] transition-colors group", danger && "hover:bg-red-500/10")}>
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full", danger ? "bg-red-500/20 text-red-500" : "bg-black/10 dark:bg-white/10 text-[var(--foreground)]")}>
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


// --- HELPER COMPONENTS ---
const TimeWheel = ({ value, onChange, max, label }: { value: number, onChange: (v: number) => void, max: number, label: string }) => {
    const numbers = Array.from({ length: max + 1 }, (_, i) => i);
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{label}</span>
            <div className="h-40 overflow-y-auto no-scrollbar snap-y snap-mandatory bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 w-16">
                {numbers.map(n => (
                    <button 
                        key={n} 
                        onClick={() => onChange(n)} 
                        className={cn(
                            "h-10 w-full flex items-center justify-center snap-start transition-all", 
                            value === n ? "text-cyan-400 font-black text-lg bg-cyan-400/10" : "text-black/30 dark:text-white/20 text-sm"
                        )}
                    >
                        {n.toString().padStart(2, '0')}
                    </button>
                ))}
            </div>
        </div>
    );
};

