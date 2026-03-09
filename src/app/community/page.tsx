"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Heart, MessageCircle, Share2, MapPin,
    Flame, Bone, Plus, Camera, Compass,
    Users, Activity, Sparkles, X, Send, PawPrint, Search, Menu, MoreHorizontal, Image as ImageIcon, Video, Mic,
    Settings, Grid3X3, List, Edit3, Bookmark, Edit2, Trash2,
    LogOut, ChevronRight, ChevronLeft, User, Bell, Lock, HelpCircle, Check, HeartHandshake, CheckCheck, ShieldAlert,
    AlertTriangle, PhoneCall, BadgeCheck, Radar, Palette, ShoppingBag, Gamepad2, Stethoscope, Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import AuthModal from '../../components/auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import { useStories } from '../../hooks/useStories';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

// -- MOCK DATA --
const MOCK_PETS = [
    {
        id: 1,
        author: "Bella The Golden",
        owner: "@sarah_logs",
        avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200",
        media: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800",
        likes: 1240,
        comments: 3,
        desc: "Parktaki en iyi sopayı ben buldum! 🦴🌳 #goldenretriever",
        distance: "300m uzakta",
        mood: "Enerjik ⚡",
        isLiked: false,
        commentsList: [
            { id: 101, author: "@puppy_love", avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100", text: "Bu tam bir şaheser! 😍🐶 Ne zaman parka gidiyoruz?", time: "2 saat önce" },
            { id: 102, author: "@cat_boss", avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100", text: "Kediler daha tatlı bence. Ama sen de fena değilsin. 😎🐾", time: "5 saat önce" },
            { id: 103, author: "@moffi_admin", avatar: "", isSystem: true, text: "Günün en güzel karesi ödülüne çok yakınsın! 🏆", time: "1 gün önce" }
        ]
    },
    {
        id: 2,
        author: "Milo & Luna",
        owner: "@cat_diaries",
        avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200",
        media: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=800",
        likes: 5800,
        comments: 0,
        desc: "Öğle uykusu sendromu... Lütfen rahatsız etmeyin. 😴🐾",
        distance: "1.2km uzakta",
        mood: "Uykulu 💤",
        isLiked: true,
        commentsList: []
    },
    {
        id: 3,
        author: "Max",
        owner: "@husky_max",
        avatar: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=200",
        media: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800",
        likes: 892,
        comments: 0,
        desc: "Kar ne zaman yağacak? Beklemekten sıkıldım! ❄️🐺",
        distance: "5km uzakta",
        mood: "Sabırsız 🥶",
        isLiked: false,
        commentsList: []
    }
];

export default function MoffiSocialMasterpiece() {
    const { user, logout, updateProfile } = useAuth();
    const { storyGroups, uploadStory } = useStories();
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>(MOCK_PETS);
    const [userPets, setUserPets] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        fetchPosts();
        fetchLostPets();
        fetchAdoptionAds();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserPets();
        }
    }, [user]);

    const fetchUserPets = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .eq('owner_id', user.id)
                .eq('is_deleted', false) // Important for soft delete filtering
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUserPets(data);
        } catch (err) {
            console.error("Evcil dostlar yüklenemedi:", err);
        }
    };

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const formattedPosts = data.map(p => ({
                    id: p.id,
                    user_id: p.user_id,
                    author: p.author_name || "Moffi Üyesi",
                    owner: "@" + (p.author_name ? p.author_name.toLowerCase().replace(/\s+/g, '') : "gizli_uye"),
                    avatar: p.author_avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
                    media: p.media_url,
                    likes: p.likes_count || 0,
                    comments: p.comments_count || 0,
                    desc: p.description || "",
                    distance: p.location_name || null,
                    mood: p.mood || null,
                    isLiked: false,
                    commentsList: []
                }));
                setPosts([...formattedPosts, ...MOCK_PETS]);
            }
        } catch (err) {
            console.error("Gönderiler yüklenemedi:", err);
        }
    };

    const fetchLostPets = async () => {
        try {
            const { data, error } = await supabase
                .from('lost_pets')
                .select('*')
                .eq('status', 'lost')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setLostPets(data);
            }
        } catch (err) {
            console.error("Kayıp ilanları yüklenemedi:", err);
        }
    };
    const fetchAdoptionAds = async () => {
        try {
            const { data, error } = await supabase
                .from('adoption_ads')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setAdoptionAds(data);
        } catch (err) {
            console.error('Sahiplendirme ilanları yüklenemedi:', err);
        }
    };

    const [profileViewMode, setProfileViewMode] = useState('grid'); // grid, list, saved
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    // NEW ADOPTION FORM STATES
    const [adoptionPetName, setAdoptionPetName] = useState("");
    const [adoptionPetBreed, setAdoptionPetBreed] = useState("");
    const [adoptionPetAge, setAdoptionPetAge] = useState("");
    const [adoptionPetDesc, setAdoptionPetDesc] = useState("");
    const [adoptionPetPhotos, setAdoptionPetPhotos] = useState<{ file: File, preview: string }[]>([]);
    const [adoptionPetType, setAdoptionPetType] = useState("cat");
    const [isSubmittingAdoption, setIsSubmittingAdoption] = useState(false);


    const [activeTab, setActiveTab] = useState('adoption'); // profiles, lost, ads, adoption
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [inboxTab, setInboxTab] = useState<'chats' | 'sos'>('chats');

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

    // INBOX DATA STATES
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [unreadInboxCount, setUnreadInboxCount] = useState(0);
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);


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
    const [activeSettingsView, setActiveSettingsView] = useState<'main' | 'privacy' | 'notifications' | 'help'>('main');
    const [kvkkToggles, setKvkkToggles] = useState({
        location: false,
        publicProfile: true,
        messages: true,
        aiModeration: true,
        marketing: false,
        pushNotifications: true,
        emailNotifications: false,
    });


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

    const toggleLike = (id: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
            }
            return p;
        }));
    };

    const addComment = (postId: number, text: string) => {
        if (!text.trim()) return;
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const newComment = {
                    id: Date.now(),
                    author: `@${user?.username || 'moffi_user'}`,
                    avatar: user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
                    text: text,
                    time: "Şimdi"
                };
                return {
                    ...p,
                    comments: p.comments + 1,
                    commentsList: [newComment, ...(p.commentsList || [])]
                };
            }
            return p;
        }));
    };

    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [editingPost, setEditingPost] = useState<{ id: number, desc: string, mood: string | null, media: string } | null>(null);

    const deletePost = async () => {
        if (!postToDelete) return;
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postToDelete).eq('user_id', user?.id);
            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
            setPostToDelete(null);
        } catch (err: any) {
            console.error(err);
            alert("Gönderi silinemedi: " + err.message);
        }
    };

    const saveEditPost = async () => {
        if (!editingPost) return;
        setIsPublishing(true);
        try {
            const { error } = await supabase.from('posts').update({
                description: editingPost.desc,
                mood: editingPost.mood
            }).eq('id', editingPost.id).eq('user_id', user?.id);
            if (error) throw error;

            setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, desc: editingPost.desc, mood: editingPost.mood } : p));
            setEditingPost(null);
        } catch (err: any) {
            console.error(err);
            alert("Gönderi güncellenemedi: " + err.message);
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
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('post_images')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post_images')
                .getPublicUrl(fileName);

            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert([{
                    user_id: user.id,
                    author_name: user.username,
                    author_avatar: user.avatar,
                    media_url: publicUrl,
                    description: uploadCaption,
                    mood: uploadMood || null,
                    location_name: uploadLocationEnabled ? "Gönderildiği Konumdan" : null
                }])
                .select()
                .single();

            if (postError) throw postError;

            await fetchPosts();

            setIsUploadModalOpen(false);
            setUploadImageURL(null);
            setSelectedFile(null);
            setUploadCaption('');
            setUploadMood(null);
            setUploadLocationEnabled(false);
            setActiveTab('feed');
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
            // 1. Upload Images
            for (const photo of lostPetPhotos) {
                const fileExt = photo.file.name.split('.').pop();
                const fileName = `${user.id}-sos-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('sos_images')
                    .upload(fileName, photo.file);

                if (uploadError) {
                    console.error("SOS fotoğraf yükleme hatası:", uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('sos_images')
                    .getPublicUrl(fileName);

                if (publicUrl) photoUrls.push(publicUrl);
            }

            // 2. Insert Record
            const { error: insertError } = await supabase
                .from('lost_pets')
                .insert([{
                    user_id: user.id,
                    author_name: user.username,
                    author_avatar: user.avatar,
                    pet_name: lostPetName,
                    pet_breed: lostPetBreed,
                    last_location: lostPetLocation,
                    description: lostPetDesc,
                    media_url: photoUrls[0] || null,
                    images: photoUrls, // Also store as array if possible
                    status: 'lost'
                }]);

            if (insertError) throw insertError;

            alert("GÜÇLÜ SİNYAL GÖNDERİLDİ! Acil Durum İlanınız 5km çapındaki herkese ulaştı.");

            await fetchLostPets();
            setIsLostAdModalOpen(false);
            setLostPetName("");
            setLostPetBreed("");
            setLostPetLocation("");
            setLostPetDesc("");
            setLostPetPhotos([]);

        } catch (error: any) {
            console.error("SOS submission error:", error);
            alert("İlan gönderilirken hata oluştu: " + error.message);
            setIsSubmittingSOS(false);
        }
    };

    const handleDeleteLostPet = async (petId: string) => {
        if (!window.confirm("Kayıp ilanını sistemden kaldırmak/silmek istediğinize emin misiniz?")) return;
        try {
            const { error } = await supabase.from('lost_pets').delete().eq('id', petId);
            if (error) throw error;
            alert("İlanınız başarıyla sistemden kaldırıldı ve Moffi ağına iletildi.");
            fetchLostPets();
        } catch (err: any) {
            alert("Hata: İlan silinemedi. " + err.message);
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
        showToast('Yükleniyor...', 'Fotoğraflar yükleniyor ve Moffi AI denetimi başlatılıyor...', 'info');
        try {
            const photoUrls: string[] = [];
            // 1. Upload Photos
            for (const photo of adoptionPetPhotos) {
                const fileExt = photo.file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
                const filePath = `adoption/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('pet-images')
                    .upload(filePath, photo.file);

                if (uploadError) {
                    console.error("Adoption fotoğraf yükleme hatası:", uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('pet-images')
                    .getPublicUrl(filePath);

                if (publicUrl) photoUrls.push(publicUrl);
            }

            // 2. Save to adoption_ads with pending status (AI will activate)
            const { data: insertedAd, error: dbError } = await supabase
                .from('adoption_ads')
                .insert({
                    user_id: user.id,
                    name: adoptionPetName,
                    breed: adoptionPetBreed,
                    age: adoptionPetAge,
                    description: adoptionPetDesc,
                    image_url: photoUrls[0] || null,
                    images: photoUrls, // Storing all photos
                    author_name: user.username,
                    author_avatar: user.avatar || null,
                    pet_type: adoptionPetType,
                    status: 'pending' // AI will decide final status
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Call Moffi AI Moderation
            showToast('Moffi AI İnceliyor...', 'Yapay zeka ilanınızı güvenlik açısından analiz ediyor...', 'info');

            const modResponse = await fetch('/api/adoption/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: insertedAd.id,
                    name: adoptionPetName,
                    breed: adoptionPetBreed,
                    age: adoptionPetAge,
                    description: adoptionPetDesc
                })
            });

            const modResult = await modResponse.json();

            // Reset form
            setIsAddAdoptionModalOpen(false);
            setAdoptionPetName("");
            setAdoptionPetBreed("");
            setAdoptionPetAge("");
            setAdoptionPetDesc("");
            setAdoptionPetPhotos([]);
            setAdoptionPetType("cat");

            if (modResult.safe !== false) {
                showToast('✅ İlan Yayınlandı!', 'Moffi AI denetiminden geçti. İlanınız görünmeye başladı.', 'success');
                fetchAdoptionAds();
            } else {
                showToast('⚠️ İlan Kaldırıldı', `Moffi AI: ${modResult.reason || 'Kural ihlali tespit edildi.'}`, 'error');
            }

        } catch (err: any) {
            showToast('Hata', err.message, 'error');
        } finally {
            setIsSubmittingAdoption(false);
        }
    };

    const handleDeleteAdoptionAd = async (adId: string) => {
        if (!confirm('Bu ilanı kaldırmak istediğinizden emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('adoption_ads')
                .delete()
                .eq('id', adId);
            if (error) throw error;
            showToast('İlan Kaldırıldı', 'Sahiplendirme ilanınız silindi.', 'success');
            fetchAdoptionAds();
        } catch (err: any) {
            showToast('Hata', err.message, 'error');
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
            const { error } = await supabase.from('adoption_applications').insert([{
                ad_id: selectedAdoptionPet.id,
                applicant_id: user.id,
                applicant_notes: appNote,
                experience_level: appExperience,
                home_conditions: appHomeType,
                status: 'pending'
            }]);

            if (error) throw error;

            showToast("Başvuru İletildi! ❤️", "İlan sahibi başvurunuzu inceledikten sonra size dönecek.", "success");
            setIsApplicationFormOpen(false);
            setAppNote("");
            setSelectedAdoptionPet(null); // Close the detail view too
        } catch (err: any) {
            showToast("Hata", err.message, "error");
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
                const { error } = await supabase.from('sos_sightings').insert([{
                    lost_pet_id: selectedLostPet.id,
                    reporter_id: user?.id,
                    seen_area: isMsg ? `[MESAJ] ${anonMessage.trim()}` : `[GÖRÜLDÜ] ${anonMessage.trim()}`,
                    anonymity_enabled: true
                }]);
                if (error) throw error;
                showToast("Sinyal İletildi", isMsg ? "Moffi Acil İhbar Hattına şifreli mesajınız ulaştı." : "Bölge bilgisini güvenle ulaştırdık.", "success");
            }
            setAnonModalType(null);
            setAnonMessage("");
        } catch (err: any) {
            showToast("Bağlantı Hatası", "İşlem sırasında beklenmedik bir hata oluştu: " + err.message, "error");
        } finally {
            setIsSubmittingAnon(false);
        }
    };

    const fetchInbox = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
                .order('created_at', { ascending: true }); // ASC so newest are at bottom

            if (error) throw error;
            if (data) {
                setInboxMessages(data);
                // Count unread (only ones sent TO us and not read yet)
                const unread = data.filter(m => m.receiver_id === user.id && m.read_status === false).length;
                setUnreadInboxCount(unread);
            }
        } catch (err) {
            console.error("Mesajlar yüklenemedi:", err);
        }
    };

    const fetchSosAlerts = async () => {
        if (!user) return;
        try {
            const { data: myPets, error: petsError } = await supabase
                .from('lost_pets')
                .select('id, pet_name')
                .eq('user_id', user.id);
            if (petsError) throw petsError;
            if (!myPets || myPets.length === 0) {
                setSosAlerts([]);
                return;
            }
            const petIds = myPets.map(p => p.id);
            const { data: sightings, error: sightingsError } = await supabase
                .from('sos_sightings')
                .select('*')
                .in('lost_pet_id', petIds)
                .order('created_at', { ascending: false });
            if (sightingsError) throw sightingsError;

            const mapped = sightings?.map(s => {
                const pet = myPets.find(p => p.id === s.lost_pet_id);
                return { ...s, pet_name: pet?.pet_name };
            }) || [];

            setSosAlerts(mapped);
        } catch (err) {
            console.error("SOS ihbarları yüklenemedi:", err);
        }
    };

    const markMessagesAsRead = async (chatId?: string) => {
        if (!user || unreadInboxCount === 0) return;
        setUnreadInboxCount(0);
        let query = supabase.from('messages').update({ read_status: true }).eq('receiver_id', user.id).eq('read_status', false);
        if (chatId) query = query.eq('sender_id', chatId);
        await query;
    };

    const handleReply = async () => {
        if (!replyMessage.trim() || !user || !activeChatUserId) return;

        setIsReplying(true);
        try {
            if (editingMessageId) {
                const { error } = await supabase.from('messages')
                    .update({ content: replyMessage.trim(), is_edited: true })
                    .eq('id', editingMessageId)
                    .eq('sender_id', user.id);
                if (error) throw error;
                setEditingMessageId(null);
            } else {
                const { error } = await supabase.from('messages').insert([{
                    sender_id: user.id,
                    receiver_id: activeChatUserId,
                    content: replyMessage.trim(),
                    read_status: false
                }]);
                if (error) throw error;
            }
            setReplyMessage("");
            fetchInbox();
        } catch (err: any) {
            showToast("Gönderilemedi", err.message, "error");
        } finally {
            setIsReplying(false);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        try {
            const { error } = await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', user?.id);
            if (error) throw error;
            setActiveMessageMenuId(null);
            if (editingMessageId === msgId) { setEditingMessageId(null); setReplyMessage(""); }
            fetchInbox();
        } catch (err: any) {
            showToast("Mesaj Silinemedi", err.message, "error");
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
            const { error } = await supabase.from('messages').insert([{
                sender_id: user.id,
                receiver_id: activeChatUserId,
                content: '[SYSTEM_ACCEPT]',
                read_status: true
            }]);
            if (error) throw error;
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

    useEffect(() => {
        if (user) {
            // Initial fetch to get unread counts when user logs in
            fetchInbox();

            // Setup real-time listener for incoming messages to increment counter or refresh
            const channel = supabase.channel('messages_changes')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
                    fetchInbox();
                    showToast("Yeni Mesaj MİYAVLADI! 🐾", "Birinden yeni bir gizli mesaj aldınız.", "info");
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); }
        }
    }, [user]);

    useEffect(() => {
        if (isInboxOpen && user) {
            if (inboxTab === 'chats') {
                fetchInbox();
                markMessagesAsRead();
            } else {
                fetchSosAlerts();
            }
        }
    }, [isInboxOpen, inboxTab]);

    return (
        <div className="fixed inset-0 bg-[#0A0A0E] text-white overflow-hidden flex flex-col font-sans">

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
                                    "bg-white/10 border-white/20 text-white"
                        )}>
                            <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                                toastMessage.type === 'success' ? "bg-cyan-500" :
                                    toastMessage.type === 'error' ? "bg-red-500" :
                                        "bg-blue-500"
                            )}>
                                {toastMessage.type === 'success' ? <Check className="w-5 h-5 text-black" strokeWidth={3} /> :
                                    toastMessage.type === 'error' ? <X className="w-5 h-5 text-white" strokeWidth={3} /> :
                                        <Activity className="w-5 h-5 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex flex-col gap-0.5 justify-center mt-0.5">
                                <h4 className="font-black text-[15px] leading-tight text-white">{toastMessage.title}</h4>
                                {toastMessage.desc && <p className="text-xs font-medium text-white/80 leading-snug">{toastMessage.desc}</p>}
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

            {/* HEADER - GLASSMORPHISM */}
            <header className="relative z-40 bg-transparent px-6 pt-12 pb-4 flex flex-col shrink-0">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                        >
                            <Camera className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-black tracking-tighter"
                            >
                                Moffi
                                <span className="text-cyan-400">.</span>
                            </motion.h1>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        {user ? (
                            <>
                                {activeTab === 'radar' ? (
                                    <button onClick={() => { setInboxTab('sos'); setIsInboxOpen(true); }} className="relative p-2 bg-red-500/10 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                                        <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                    </button>
                                ) : (
                                    <button onClick={() => { setInboxTab('chats'); setIsInboxOpen(true); }} className="relative p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                                        <MessageCircle className="w-5 h-5 text-white" />
                                        {unreadInboxCount > 0 && (
                                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white px-1 shadow-[0_0_10px_rgba(239,68,68,1)] animate-bounce border-2 border-[#0A0A0E]">
                                                {unreadInboxCount}
                                            </div>
                                        )}
                                    </button>
                                )}
                                <div onClick={() => setActiveTab('profile')} className={cn("relative w-11 h-11 rounded-full border-2 transition-colors p-[2px] cursor-pointer shrink-0", activeTab === 'profile' ? "border-cyan-400" : "border-white/20 hover:border-white/50")}>
                                    <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"} className="w-full h-full rounded-full object-cover" />
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-xl group shrink-0"
                            >
                                <User className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={cn(
                                "w-11 h-11 rounded-full border flex items-center justify-center transition-all backdrop-blur-xl",
                                isSearchOpen ? "bg-cyan-500/20 border-cyan-400" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}>
                            <Search className={cn("w-5 h-5", isSearchOpen ? "text-cyan-400" : "text-white")} />
                        </button>
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
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-cyan-400 focus:bg-white/10 transition-all text-white placeholder:text-gray-500"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TOP PILL TABS — Apple iOS Style */}
                <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'feed', label: '📸 Keşfet' },
                        { id: 'adoption', label: '❤️ Sahiplendir' },
                        { id: 'radar', label: '🚨 Kayıp/Radar' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95",
                                activeTab === tab.id
                                    ? "bg-white text-black shadow-lg shadow-white/20"
                                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/15 hover:text-white"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* MAIN IMMERSIVE FEED - DYNAMIC RENDER BASED ON TAB */}
            <main className="flex-1 relative z-10 w-full overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* FEED TAB */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)" }}
                            transition={{ duration: 0.3 }}
                            className="h-full w-full overflow-y-scroll no-scrollbar pb-32 flex flex-col gap-8"
                        >
                            {/* INSTAGRAM-STYLE STORIES BAR */}
                            <div className="w-full flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar snap-start shrink-0">
                                {/* Current User Add Story */}
                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gray-700 to-gray-800 relative cursor-pointer group" onClick={() => document.getElementById('story-upload')?.click()}>
                                        <input type="file" id="story-upload" className="hidden" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const res = await uploadStory(file);
                                                if (res.success) alert("Hikaye başarıyla yüklendi! 🚀");
                                                else alert("Yükleme hatası: " + res.error);
                                            }
                                        }} />
                                        <div className="w-full h-full rounded-full border-2 border-[#0A0A0E] overflow-hidden relative bg-[#12121A]">
                                            <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
                                                    <Plus className="w-4 h-4 text-black" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">Hikaye Ekle</span>
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
                                            <div className="w-full h-full bg-[#0A0A0E] rounded-full border-2 border-[#0A0A0E] overflow-hidden">
                                                <img src={(group.user_id === user?.id ? (user?.avatar || group.author_avatar) : group.author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <span className={cn("text-[10px] tracking-wide", group.hasUnseen ? "font-bold text-white" : "font-medium text-gray-500 truncate w-16 text-center")}>
                                            {user?.id === group.user_id ? "Sen" : group.author_name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Feed Posts */}
                            {posts.map((post) => (
                                <div key={post.id} className="w-full relative flex flex-col items-center justify-center px-4 shrink-0" style={{ height: "calc(100vh - 180px)" }}>
                                    <ImmersivePostCard
                                        post={post}
                                        currentUser={user}
                                        onLike={() => toggleLike(post.id)}
                                        onAddComment={(text) => addComment(post.id, text)}
                                        onDeletePost={() => setPostToDelete(post.id)}
                                        onEditPost={() => setEditingPost({ id: post.id, desc: post.desc, mood: post.mood, media: post.media })}
                                    />
                                </div>
                            ))}
                            {/* Space for bottom nav */}
                            <div className="h-12 w-full shrink-0" />
                        </motion.div>
                    )}

                    {/* RADAR / SOS TAB */}
                    {activeTab === 'radar' && (
                        <motion.div
                            key="radar"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full w-full overflow-y-auto no-scrollbar pb-32 bg-[#0A0A0E] flex flex-col items-center"
                        >
                            <div className="w-full max-w-md mx-auto relative">

                                {/* 1. SOS / KAYIP İLANLARI (Apple Wallet Horizontal List) */}
                                <div className="w-full pt-6 pb-2 px-0 border-b border-red-500/20 relative">
                                    <div className="px-6 mb-3 flex items-center justify-between">
                                        <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Aktif İhbarlar</h3>
                                        <button onClick={() => setIsLostAdModalOpen(true)} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 active:scale-95 transition-all">
                                            + İlan Ekle
                                        </button>
                                    </div>

                                    {lostPets.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4 snap-x snap-mandatory">
                                            {lostPets.map((pet) => (
                                                <div key={pet.id} className="shrink-0 w-[85vw] max-w-[320px] snap-center bg-red-500/10 border border-red-500/30 rounded-[1.5rem] p-4 flex flex-col gap-3 cursor-pointer hover:bg-red-500/20 transition-colors shadow-sm relative group" onClick={() => setSelectedLostPet(pet)}>

                                                    {user?.id === pet.user_id ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteLostPet(pet.id); }} className="absolute right-3 top-3 px-3 py-1.5 rounded-full bg-[#12121A] border border-red-500/30 text-red-400 text-[10px] font-bold uppercase transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 z-10 shadow-lg shadow-black/50">
                                                            <Trash2 className="w-3 h-3" /> Sil
                                                        </button>
                                                    ) : (
                                                        <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center -mr-1 -mt-1"><ChevronRight className="w-4 h-4 text-red-500" /></div>
                                                    )}

                                                    <div className="flex gap-4 items-start">
                                                        <div className="w-16 h-16 rounded-xl bg-red-500/20 flex flex-col items-center justify-center shrink-0 border border-red-500/30 shadow-inner group-hover:bg-red-500/30 transition-colors relative overflow-hidden">
                                                            {pet.media_url ? (
                                                                <img src={pet.media_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <>
                                                                    <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full" />
                                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest relative z-10 bg-[#0a0a0e]/50 px-1 py-0.5 rounded">SOS</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 mt-0.5">
                                                            <h3 className="text-red-500 font-bold text-sm tracking-wide uppercase flex items-center gap-2">Dikkat Kayıp! <span className="text-[10px] text-red-400 font-medium lowercase tracking-normal bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Yakında</span></h3>
                                                            <p className="text-white font-black text-base mt-0.5 tracking-tight">{pet.pet_name} <span className="text-xs text-white/50 font-normal">({pet.pet_breed || "Bilinmiyor"})</span></p>
                                                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1 opacity-80"><MapPin className="w-3 h-3" /> {pet.last_location}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-300 text-xs mt-1 leading-snug line-clamp-2 px-1">{pet.description || "Lütfen görünce acil dönüş yapın."}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 mx-6 mb-4 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-xs text-gray-400 font-medium tracking-wide">Yakınlarda aktif bir kayıp ilanı bulunmuyor. İyiyiz! 🐾</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ADOPTION TAB (Sahiplenme Paneli) */}
                    {activeTab === 'adoption' && (
                        <motion.div
                            key="adoption"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full w-full overflow-y-auto no-scrollbar pb-32 bg-[#0A0A0E] flex flex-col items-center"
                        >
                            <div className="w-full max-w-md mx-auto relative mt-2">

                                {/* Header text for Adoption section */}
                                <div className="px-6 mb-8 mt-2 flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-1">
                                            Bugün Sahiplen
                                        </p>
                                        <h2 className="text-3xl font-black text-white tracking-tight mt-1">Sıcak Bir Yuva</h2>
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
                                                    : "bg-[#1C1C1E] text-[#8E8E93] border border-white/5 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {pill}
                                        </button>
                                    ))}
                                </div>

                                {/* 2. KÜRATÖR LİSTESİ (Hero Cards / Today Style) */}
                                <div className="w-full overflow-x-auto no-scrollbar px-6 mb-10 pb-6 flex gap-5 snap-x snap-mandatory">
                                    {/* Story/Card 1 */}
                                    <div className="w-[88vw] max-w-[340px] shrink-0 snap-center rounded-[2rem] bg-gray-900 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[420px] group cursor-pointer" onClick={() => setSelectedAdoptionPet({
                                        name: "Luna'nın Hikayesi",
                                        breed: "Apartmana Uygun",
                                        desc: "Sakin, sevecen ve tamamen tuvalet eğitimli. Daha önce bir aile ortamında yaşadı, şimdi ikinci bir şans arıyor.",
                                        img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600",
                                        tags: ["Kısırlaştırılmış", "Aşılı", "Eğitimli"]
                                    })}>
                                        <div className="absolute inset-0 bg-black">
                                            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6s] ease-out opacity-80" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                                        </div>
                                        <div className="relative z-10 p-6">
                                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
                                                Apartmana Uygun
                                            </span>
                                            <h3 className="text-3xl font-black text-white leading-tight mt-1 drop-shadow-lg">
                                                Luna'nın Hikayesi
                                            </h3>
                                        </div>
                                        <div className="flex-1" />
                                        <div className="relative z-10 p-5">
                                            <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md line-clamp-3 mb-4">
                                                Sakin, sevecen ve tamamen tuvalet eğitimli. Daha önce bir aile ortamında yaşadı, şimdi ikinci bir şans arıyor.
                                            </p>
                                            <button className="w-full py-4 rounded-full bg-white text-black font-bold shadow-lg shadow-white/20 active:scale-95 transition-transform">
                                                Hikayeyi Oku & Başvur
                                            </button>
                                        </div>
                                    </div>

                                    {/* Story/Card 2 */}
                                    <div className="w-[88vw] max-w-[340px] shrink-0 snap-center rounded-[2rem] bg-gray-900 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[420px] group cursor-pointer" onClick={() => setSelectedAdoptionPet({
                                        name: "Oyuncu Zeytin",
                                        breed: "Kedilerle Anlaşıyor",
                                        desc: "Evinizin yeni neşesi olmaya hazır. Çocuklarla ve diğer kedilerle arası mükemmel. Çok sosyal bir kedi.",
                                        img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600",
                                        tags: ["Oyuncu", "Sosyal", "Aşılı"]
                                    })}>
                                        <div className="absolute inset-0 bg-black">
                                            <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6s] ease-out opacity-80" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                                        </div>
                                        <div className="relative z-10 p-6">
                                            <span className="text-purple-300 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
                                                Kedilerle Anlaşıyor
                                            </span>
                                            <h3 className="text-3xl font-black text-white leading-tight mt-1 drop-shadow-lg">
                                                Oyuncu Zeytin
                                            </h3>
                                        </div>
                                        <div className="flex-1" />
                                        <div className="relative z-10 p-5">
                                            <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md line-clamp-3 mb-4">
                                                Evinizin yeni neşesi olmaya hazır. Çocuklarla ve diğer kedilerle arası mükemmel. Çok sosyal bir kedi.
                                            </p>
                                            <button className="w-full py-4 rounded-full bg-white text-black font-bold shadow-lg shadow-white/20 active:scale-95 transition-transform">
                                                Hikayeyi Oku & Başvur
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* REAL ADOPTION ADS LIST */}
                                <div className="px-6 mb-8 w-full">
                                    <div className="flex justify-between items-end mb-4 pb-3">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Gerçek İlanlar</h2>
                                        <span className="text-xs text-gray-500 font-bold bg-white/5 px-2 py-1 rounded-full">{adoptionAds.length} ilan</span>
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

                                        return filtered.length > 0 ? (
                                            <div className="space-y-4">
                                                {filtered.map((ad) => (
                                                    <div
                                                        key={ad.id}
                                                        className="flex flex-row items-center gap-4 bg-[#12121A] p-3 rounded-2xl border border-white/5 active:bg-white/5 transition-colors cursor-pointer relative"
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
                                                        <img src={ad.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200'} className="w-16 h-16 rounded-[1rem] object-cover shrink-0" />
                                                        <div className="flex-1 overflow-hidden">
                                                            <h4 className="text-white font-bold text-base">{ad.name} <span className="text-gray-500 font-medium text-xs ml-1">• {ad.age}</span></h4>
                                                            <p className="text-cyan-400 text-xs mt-0.5">{ad.breed}</p>
                                                            <p className="text-gray-500 text-[10px] mt-1">{ad.author_name} · {new Date(ad.created_at).toLocaleDateString('tr-TR')}</p>
                                                        </div>
                                                        {user?.id === ad.user_id && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAdoptionAd(ad.id); }}
                                                                className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <ChevronRight className="w-5 h-5 text-gray-500 mr-1 shrink-0" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                                                <HeartHandshake className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                                                <p className="text-gray-400 font-bold">Henüz ilan yok</p>
                                                <p className="text-gray-600 text-xs mt-1">Bu kategoride ilan bulunmuyor.</p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="px-6 text-center text-xs text-gray-500 font-medium pb-8 border-t border-white/5 pt-6">
                                    Tüm sahiplendirmeler Moffi AI tarafından denetlenir ve ücretsizdir.<br />Güvenliğiniz için "Ücret Talep Eden" ilanları bildiriniz.
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PROFILE TAB (Real Architecture) */}
                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="h-full w-full overflow-y-auto no-scrollbar pb-32"
                        >
                            {/* COVER PHOTO */}
                            <div className="w-full h-48 bg-[#12121A] relative overflow-hidden">
                                {user?.cover_photo ? (
                                    <img src={user.cover_photo} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-cyan-900 to-purple-900 opacity-60 mix-blend-overlay" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] to-transparent" />

                                {/* SETTINGS BUTTON */}
                                <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>

                            {/* PROFILE INFO */}
                            <div className="px-6 relative -mt-16 mb-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="w-28 h-28 rounded-full border-4 border-[#0A0A0E] relative bg-[#0A0A0E] cursor-pointer" onClick={() => {
                                        setEditName(user?.username || "");
                                        setEditUsername(user?.username ? user.username.replace(/\s+/g, '').toLowerCase() : "");
                                        setEditBio(user?.bio || "");
                                        setEditAvatarPreview(user?.avatar || null);
                                        setEditCoverPreview(user?.cover_photo || null);
                                        setIsEditProfileOpen(true);
                                    }}>
                                        <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} className="w-full h-full rounded-full object-cover" />
                                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0A0A0E]">
                                            <Sparkles className="w-3 h-3 text-black" />
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setEditName(user?.username || "");
                                        setEditUsername(user?.username ? user.username.replace(/\s+/g, '').toLowerCase() : "");
                                        setEditBio(user?.bio || "");
                                        setEditAvatarPreview(user?.avatar || null);
                                        setEditCoverPreview(user?.cover_photo || null);
                                        setIsEditProfileOpen(true);
                                    }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors">
                                        <Edit3 className="w-4 h-4" /> Profili Düzenle
                                    </button>
                                </div>

                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    {user ? user.username : 'Üveys Moffi'}
                                </h2>
                                <p className="text-cyan-400 font-medium text-sm mt-0.5">{user ? `@${user.username.toLowerCase().replace(/\s+/g, '')}` : '@uveys_moffi'}</p>

                                <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                                    {user ? (user.bio || 'Moffi Ekosistemine Hoşgeldiniz ✨') : 'Hayvan dostu, kahve sever, teknoloji tutkunu. ☕️🐶'}
                                </p>

                                {/* STATS */}
                                <div className="flex gap-6 mt-6 border-y border-white/10 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold text-white">124</span>
                                        <span className="text-xs text-gray-500 font-medium tracking-wide">Gönderi</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold text-white">14.2B</span>
                                        <span className="text-xs text-gray-500 font-medium tracking-wide">Takipçi</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold text-white">328</span>
                                        <span className="text-xs text-gray-500 font-medium tracking-wide">Takip Edilen</span>
                                    </div>
                                </div>

                                {/* APPLE-STYLE PET WIDGETS (HomeKit / HealthKit Vibe) */}
                                <div className="mt-8 mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-cyan-400" /> Petlerim
                                        </h3>
                                        <button onClick={() => setIsAddPetOpen(true)} className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full hover:bg-cyan-400/20 transition-colors">
                                            + Ekle
                                        </button>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">

                                        {userPets.length > 0 ? (
                                            userPets.map((pet) => (
                                                <div key={pet.id} onClick={() => alert(`${pet.name} adlı petinizin detaylı Sağlık / Kontrol paneli açılıyor...`)} className="min-w-[170px] bg-gradient-to-br from-[#12121A] to-[#0A0A0E] border border-white/10 rounded-3xl p-5 flex flex-col gap-3 cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <img src={pet.cover_photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-lg" />
                                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm shadow-inner">{pet.type}</div>
                                                    </div>
                                                    <div className="mt-1">
                                                        <h4 className="font-bold text-white text-lg leading-tight">{pet.name}</h4>
                                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{pet.breed || "Bilinmiyor"} • {pet.age || "Belirsiz"}</p>
                                                    </div>
                                                    <div className={cn("w-full bg-white/5 rounded-xl p-2.5 flex justify-between items-center border mt-2",
                                                        pet.status === 'lost' ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
                                                    )}>
                                                        <span className={cn("text-[10px] font-bold uppercase tracking-wide", pet.status === 'lost' ? "text-red-400" : "text-green-400")}>
                                                            Durum: {pet.status === 'lost' ? "KAYIP" : "GÜVENDE"}
                                                        </span>
                                                        {pet.status === 'lost' ? (
                                                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setQrModalPet({ name: pet.name, id: pet.id, avatar: pet.cover_photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" }); }}
                                                        className="w-full mt-1 bg-white hover:bg-gray-200 text-black py-2 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5"
                                                    >
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Akıllı Pet-ID (QR)
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div onClick={() => setIsAddPetOpen(true)} className="min-w-[170px] bg-white/5 border border-dashed border-white/20 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-colors h-48">
                                                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-inner">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <p className="text-[13px] text-gray-400 font-bold text-center">Henüz patili dost eklenmedi.</p>
                                                <p className="text-[10px] text-gray-500 font-medium text-center">Hemen bir profil oluşturun.</p>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* GRID / LIST TOGGLE */}
                            <div className="flex justify-around items-center border-b border-white/5 mb-4">
                                <button onClick={() => setProfileViewMode('grid')} className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", profileViewMode === 'grid' ? "border-white text-white" : "border-transparent text-gray-600 hover:text-white")}>
                                    <Grid3X3 className="w-6 h-6" />
                                </button>
                                <button onClick={() => setProfileViewMode('list')} className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", profileViewMode === 'list' ? "border-white text-white" : "border-transparent text-gray-600 hover:text-white")}>
                                    <List className="w-6 h-6" />
                                </button>
                                <button onClick={() => setProfileViewMode('saved')} className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", profileViewMode === 'saved' ? "border-white text-white" : "border-transparent text-gray-600 hover:text-white")}>
                                    <Bookmark className="w-6 h-6" />
                                </button>
                            </div>

                            {/* POSTS FEED */}
                            {profileViewMode === 'grid' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-1 px-1">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="aspect-square bg-gray-900 group relative overflow-hidden cursor-pointer" onClick={() => alert("Gönderi detayına gidiliyor...")}>
                                            <img
                                                src={`https://images.unsplash.com/photo-${1514888286974 + i}?q=80&w=300`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                                                <Heart className="w-3 h-3 fill-white" /> {Math.floor(Math.random() * 500) + 50}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {profileViewMode === 'list' && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 px-4">
                                    {posts.slice(0, 3).map((post) => (
                                        <ImmersivePostCard
                                            key={post.id}
                                            post={post}
                                            currentUser={user}
                                            onLike={() => toggleLike(post.id)}
                                            onAddComment={(text) => addComment(post.id, text)}
                                            onDeletePost={() => setPostToDelete(post.id)}
                                            onEditPost={() => setEditingPost({ id: post.id, desc: post.desc, mood: post.mood, media: post.media })}
                                        />
                                    ))}
                                </motion.div>
                            )}

                            {profileViewMode === 'saved' && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 text-center py-12">
                                    <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="font-bold text-gray-400">Henüz Kaydedilen Bir Şey Yok</h3>
                                    <p className="text-xs text-gray-600 mt-2">Kaydettiğiniz favori gönderiler burada görünecek.</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main >

            {/* Hidden input for camera upload - used by global bottom nav */}
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*,video/*" onChange={handleCameraUpload} />

            {/* MODALS AND DRAWERS */}

            {/* SETTINGS DRAWER */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 h-[80%] bg-[#0A0A0E] backdrop-blur-3xl z-[100] rounded-t-[2.5rem] border-t border-white/10 p-6 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => { setIsSettingsOpen(false); setActiveSettingsView('main'); }} />

                        <AnimatePresence mode="wait">
                            {/* MAIN SETTINGS VIEW */}
                            {activeSettingsView === 'main' && (
                                <motion.div
                                    key="main"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="flex flex-col h-full"
                                >
                                    <h2 className="text-2xl font-black text-white mb-6">Ayarlar</h2>
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                                        <SettingsRow icon={User} label="Hesap Bilgileri / Giriş" onClick={() => { setIsSettingsOpen(false); setIsAuthModalOpen(true); }} />
                                        <SettingsRow icon={Bell} label="Bildirim Tercihleri" onClick={() => setActiveSettingsView('notifications')} />
                                        <SettingsRow icon={Lock} label="KVKK, Gizlilik ve Güvenlik" onClick={() => setActiveSettingsView('privacy')} />
                                        <SettingsRow icon={Bookmark} label="Kaydedilenler" onClick={() => { setProfileViewMode('saved'); setIsSettingsOpen(false); }} />

                                        <hr className="border-white/5 my-4" />

                                        <SettingsRow icon={HelpCircle} label="Yardım ve Destek" onClick={() => setActiveSettingsView('help')} />
                                        {user ? (
                                            <SettingsRow icon={LogOut} label="Çıkış Yap" danger onClick={async () => { await logout(); router.push('/home'); }} />
                                        ) : (
                                            <SettingsRow icon={LogOut} label="Üye Ol / Çıkış" danger onClick={() => router.push('/home')} />
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* PRIVACY & KVKK VIEW */}
                            {activeSettingsView === 'privacy' && (
                                <motion.div
                                    key="privacy"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="flex flex-col h-full overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <button onClick={() => setActiveSettingsView('main')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <h2 className="text-xl font-black text-white">Gizlilik & KVKK</h2>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20">

                                        {/* Section 1 */}
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-bold text-cyan-400 tracking-widest uppercase ml-1">Görünürlük ve İletişim</h3>

                                            <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white">Tam Konum Paylaşımı</p>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Diğerleri canlı radar üzerinde sizi nokta atışı görebilir.</p>
                                                </div>
                                                <button onClick={() => setKvkkToggles(p => ({ ...p, location: !p.location }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.location ? "bg-cyan-500" : "bg-gray-700")}>
                                                    <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.location ? "translate-x-7" : "translate-x-1")} />
                                                </button>
                                            </div>

                                            <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white">Profilim Herkese Açık</p>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Sadece onaylı kişiler mi yoksa tüm topluluk mu görebilir?</p>
                                                </div>
                                                <button onClick={() => setKvkkToggles(p => ({ ...p, publicProfile: !p.publicProfile }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.publicProfile ? "bg-cyan-500" : "bg-gray-700")}>
                                                    <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.publicProfile ? "translate-x-7" : "translate-x-1")} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Section 2 */}
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-bold text-purple-400 tracking-widest uppercase ml-1">Akıllı Sistemler & İzinler</h3>

                                            <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white">Yapay Zeka Moderasyonu</p>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Gönderilerinizin Moffi AI tarafından içerik taramasına izin verin.</p>
                                                </div>
                                                <button onClick={() => setKvkkToggles(p => ({ ...p, aiModeration: !p.aiModeration }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.aiModeration ? "bg-purple-500" : "bg-gray-700")}>
                                                    <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.aiModeration ? "translate-x-7" : "translate-x-1")} />
                                                </button>
                                            </div>

                                            <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white">E-Bülten & SMS Onayı</p>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Kampanyalardan ilk siz haberdar olun (İstediğiniz an iptal edilebilir).</p>
                                                </div>
                                                <button onClick={() => setKvkkToggles(p => ({ ...p, marketing: !p.marketing }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.marketing ? "bg-purple-500" : "bg-gray-700")}>
                                                    <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.marketing ? "translate-x-7" : "translate-x-1")} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Section 3 (Danger Zone) */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <h3 className="text-[11px] font-bold text-red-500 tracking-widest uppercase ml-1">Veri Yönetimi</h3>

                                            <button onClick={() => alert("Kişisel verileriniz KVKK kapsamında .zip olarak indirilmek üzere hazırlanıyor. Linkiniz e-posta adresinize gönderilecektir.")} className="w-full bg-[#12121A] hover:bg-white/5 transition-colors rounded-2xl p-4 border border-white/5 flex items-center justify-between text-left">
                                                <div>
                                                    <p className="text-sm font-bold text-white">Verilerimi İndir (.ZIP)</p>
                                                    <p className="text-xs text-gray-400 mt-1">Sistemimizdeki tüm kişisel verilerinizin bir kopyasını alın.</p>
                                                </div>
                                            </button>

                                            <button onClick={() => { if (window.confirm("Bu işlem GERİ ALINAMAZ! Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Emin misiniz?")) alert("Hesap silme talebi alındı."); }} className="w-full bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-2xl p-4 border border-red-500/20 flex items-center justify-between text-left group">
                                                <div>
                                                    <p className="text-sm font-bold text-red-500 group-hover:text-red-400">Hesabımı ve Verilerimi Sil</p>
                                                    <p className="text-xs text-red-500/60 mt-1">Sunucularımızdaki aktif kaydınızı tamamen yok edin.</p>
                                                </div>
                                            </button>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {/* NOTIFICATIONS VIEW */}
                            {activeSettingsView === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="flex flex-col h-full overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <button onClick={() => setActiveSettingsView('main')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <h2 className="text-xl font-black text-white">Bildirimler</h2>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
                                        <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">Anlık Bildirimler</p>
                                                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Beğeni, yorum ve eşleşmeler için telefon bildirimleri.</p>
                                            </div>
                                            <button onClick={() => setKvkkToggles(p => ({ ...p, pushNotifications: !p.pushNotifications }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.pushNotifications ? "bg-cyan-500" : "bg-gray-700")}>
                                                <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.pushNotifications ? "translate-x-7" : "translate-x-1")} />
                                            </button>
                                        </div>

                                        <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">E-Posta Özetleri</p>
                                                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Haftalık topluluk trendleri ve arkadaş önerileri alın.</p>
                                            </div>
                                            <button onClick={() => setKvkkToggles(p => ({ ...p, emailNotifications: !p.emailNotifications }))} className={cn("w-12 h-6 rounded-full transition-colors relative flex items-center", kvkkToggles.emailNotifications ? "bg-cyan-500" : "bg-gray-700")}>
                                                <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-transform", kvkkToggles.emailNotifications ? "translate-x-7" : "translate-x-1")} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* HELP & SUPPORT VIEW */}
                            {activeSettingsView === 'help' && (
                                <motion.div
                                    key="help"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="flex flex-col h-full overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <button onClick={() => setActiveSettingsView('main')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <h2 className="text-xl font-black text-white">Yardım & Destek</h2>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
                                        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-[2rem] border border-white/10 text-center">
                                            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-cyan-400/30">
                                                <MessageCircle className="w-8 h-8 text-cyan-400" />
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-2">Nasıl Yardımcı Olabiliriz?</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                                Uygulama ile ilgili teknik bir sorun yaşıyorsanız veya hesabınızla ilgili detaylı desteğe ihtiyacınız varsa 7/24 bizimle iletişime geçebilirsiniz.
                                            </p>
                                            <a href="mailto:moffidestek@gmail.com" className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-black py-4 rounded-xl font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                                <Send className="w-4 h-4" />
                                                moffidestek@gmail.com
                                            </a>
                                        </div>

                                        <div className="bg-[#12121A] rounded-2xl p-4 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors mt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                    <HelpCircle className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Sıkça Sorulan Sorular</p>
                                                    <p className="text-xs text-gray-500">Moffi hakkında en çok merak edilenler</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT PROFILE MODAL */}
            <AnimatePresence>
                {isEditProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#12121A] border border-white/10 rounded-[2rem] p-6 shadow-2xl relative"
                        >
                            <button onClick={() => setIsEditProfileOpen(false)} className="absolute top-4 right-4 bg-white/5 p-2 rounded-full hover:bg-white/10 z-10">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                            <h2 className="text-xl font-bold text-white mb-6">Profili Düzenle</h2>

                            <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-12 group cursor-pointer border border-white/10" onClick={() => coverInputRef.current?.click()}>
                                {editCoverPreview ? (
                                    <img src={editCoverPreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-cyan-900 to-purple-900 opacity-40" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-5 h-5 text-white mb-1" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Kapağı Değiştir</span>
                                </div>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setEditCoverFile(file);
                                            setEditCoverPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />

                                {/* AVATAR OVERLAP */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center z-20">
                                    <label htmlFor="edit-profile-upload" className="w-20 h-20 rounded-full border-4 border-[#12121A] flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors bg-[#1C1C1E] overflow-hidden group shadow-xl">
                                        {editAvatarPreview ? (
                                            <div className="w-full h-full relative">
                                                <img src={editAvatarPreview} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Camera className="w-5 h-5 text-gray-400 mb-0.5" />
                                                <span className="text-[8px] text-gray-500 font-bold uppercase">Profil</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            id="edit-profile-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setEditAvatarFile(file);
                                                    setEditAvatarPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold ml-2">İsim (Görünen Ad)</label>
                                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold ml-2">Kullanıcı Adı</label>
                                    <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold ml-2">Biyografi</label>
                                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 outline-none focus:border-cyan-400 transition-colors resize-none" />
                                </div>
                                <button
                                    disabled={isSavingProfile}
                                    onClick={async () => {
                                        if (!user) return;
                                        setIsSavingProfile(true);
                                        let finalAvatarUrl = null;

                                        if (editAvatarFile) {
                                            const fileExt = editAvatarFile.name.split('.').pop();
                                            const fileName = `${user.id}/profile_${Date.now()}.${fileExt}`;
                                            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, editAvatarFile, { upsert: true });
                                            if (!uploadError) {
                                                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                                                finalAvatarUrl = data.publicUrl;
                                            } else {
                                                console.error("Avatar yükleme hatası:", uploadError);
                                                alert("Profil fotoğrafı yüklenemedi: " + uploadError.message);
                                                setIsSavingProfile(false);
                                                return;
                                            }
                                        }

                                        let finalCoverUrl = null;
                                        if (editCoverFile) {
                                            const fileExt = editCoverFile.name.split('.').pop();
                                            const fileName = `${user.id}/cover_${Date.now()}.${fileExt}`;
                                            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, editCoverFile, { upsert: true });
                                            if (!uploadError) {
                                                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                                                finalCoverUrl = data.publicUrl;
                                            } else {
                                                console.error("Kapak yükleme hatası:", uploadError);
                                                alert("Kapak fotoğrafı yüklenemedi: " + uploadError.message);
                                                setIsSavingProfile(false);
                                                return;
                                            }
                                        }

                                        await updateProfile({
                                            username: editName,
                                            bio: editBio,
                                            ...(finalAvatarUrl && { avatar: finalAvatarUrl }),
                                            ...(finalCoverUrl && { cover_photo: finalCoverUrl })
                                        });

                                        setIsSavingProfile(false);
                                        setIsEditProfileOpen(false);
                                    }}
                                    className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isSavingProfile ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Değişiklikleri Kaydet
                                        </>
                                    )}
                                </button>
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
                        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm px-2 pb-2"
                        onClick={() => setIsAddPetOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full bg-[#12121A] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()} // Prevent close on clicking inside modal
                        >
                            {/* Drag Indicator */}
                            <div className="w-12 h-1.5 bg-gray-600 rounded-full mb-6" />

                            <div className="w-full flex justify-between items-center mb-6">
                                {addPetStep > 1 ? (
                                    <button onClick={() => setAddPetStep(prev => prev - 1)} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : <div className="w-9" />}
                                <div className="text-center">
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        {addPetStep === 1 ? 'Temel Kimlik' : addPetStep === 2 ? 'Karakter & Tıbbi' : 'Güvenlik & Kayıt'}
                                    </h2>
                                    <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mt-1">Adım {addPetStep} / 3</p>
                                </div>
                                <div className="w-9 flex justify-end">
                                    <button onClick={() => {
                                        setIsAddPetOpen(false);
                                        setTimeout(() => setAddPetStep(1), 300);
                                    }} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
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
                                                            <X className="w-3 h-3 text-white" />
                                                        </button>
                                                        {index === 0 && (
                                                            <div className="absolute bottom-1 left-1 right-1 bg-cyan-500/80 backdrop-blur-md flex items-center justify-center py-0.5 rounded-lg">
                                                                <span className="text-[9px] font-bold text-white uppercase tracking-wider">Kapak</span>
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
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">İsim</label>
                                                <input type="text" value={newPetName} onChange={e => setNewPetName(e.target.value)} placeholder="Örn: Pamuk" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-bold" />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Tür</label>
                                                <select value={newPetType} onChange={e => setNewPetType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-2 py-3.5 text-center text-xl mt-1 outline-none focus:border-cyan-400 transition-colors appearance-none" style={{ textAlignLast: "center" }}>
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
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Irkı</label>
                                                <input type="text" value={newPetBreed} onChange={e => setNewPetBreed(e.target.value)} placeholder="Örn: Golden Retriever" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Yaş</label>
                                                <input type="text" value={newPetAge} onChange={e => setNewPetAge(e.target.value)} placeholder="Örn: 2 Yaş" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm text-center" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 w-full">
                                            <div className="flex-1">
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Cinsiyet</label>
                                                <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                    <option value="Erkek">Erkek</option>
                                                    <option value="Dişi">Dişi</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Kısır Mı?</label>
                                                <select value={newPetNeutered} onChange={e => setNewPetNeutered(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                    <option value="Evet">Evet</option>
                                                    <option value="Hayır">Hayır</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Boyut</label>
                                                <select value={newPetSize} onChange={e => setNewPetSize(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
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
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Sağlık & Alerji (Kritik!)</label>
                                            <textarea value={newPetHealth} onChange={e => setNewPetHealth(e.target.value)} placeholder="Örn: Tavuk alerjisi var, lütfen tavuklu mama vermeyin!" className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-red-500 transition-colors font-medium text-sm h-20 resize-none shadow-[0_0_15px_rgba(239,68,68,0.1) inset]" />
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Ayırt Edici Özellikleri</label>
                                            <textarea value={newPetFeatures} onChange={e => setNewPetFeatures(e.target.value)} placeholder="Örn: Sol kulağındaki hafif kesik, kuyruk ucu beyaz..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Karakteri (Bulan Kişiye Tavsiye)</label>
                                            <textarea value={newPetCharacter} onChange={e => setNewPetCharacter(e.target.value)} placeholder="Örn: Çok uysaldır ancak ani seslerden korkup kaçabilir." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                        </div>

                                        <button onClick={() => setAddPetStep(3)} className="w-full py-4 mt-4 bg-white rounded-2xl font-black text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                            Sonraki Adım
                                        </button>
                                    </motion.div>
                                )}

                                {addPetStep === 3 && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-5 max-w-sm">

                                        <div>
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Mikroçip Numarası</label>
                                            <div className="relative mt-1">
                                                <input type="text" value={newPetMicrochip} onChange={e => setNewPetMicrochip(e.target.value)} placeholder="TR-000000000" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-cyan-400 transition-colors font-mono tracking-widest text-sm" />
                                                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 ml-3 mt-1.5 font-medium">Veteriner sorgulamaları için resmi numarasını girebilirsiniz. Uygulamada güvenle saklanır.</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <PhoneCall className={cn("w-5 h-5 transition-colors", newPetShowPhone ? "text-cyan-400" : "text-gray-500")} />
                                                    <span className="font-bold text-white text-sm">Telefonu Göster</span>
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
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium mt-2">
                                                Eğer "Kayıp Alarmı" verirseniz, Moffi QR kodunuzu okutan kişiler doğrudan sizinle telefon numaranız üzerinden görüşebilir. Kapatırsanız; sadece anonim uygulama-içi mesaj atabilirler.
                                            </p>
                                        </div>

                                        <button
                                            disabled={isSavingPet || !user}
                                            onClick={async () => {
                                                if (!user) return alert("Lütfen önce giriş yapın.");
                                                setIsSavingPet(true);

                                                try {
                                                    // 1. Upload Photos
                                                    const photoUrls: string[] = [];
                                                    for (const photo of newPetPhotos) {
                                                        const fileExt = photo.file.name.split('.').pop();
                                                        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                                                        const { data: uploadData, error: uploadError } = await supabase.storage
                                                            .from('pet-media')
                                                            .upload(fileName, photo.file);

                                                        if (uploadError) {
                                                            console.error("Fotoğraf yükleme hatası:", uploadError);
                                                            continue;
                                                        }

                                                        const { data: publicUrlData } = supabase.storage
                                                            .from('pet-media')
                                                            .getPublicUrl(fileName);

                                                        if (publicUrlData) {
                                                            photoUrls.push(publicUrlData.publicUrl);
                                                        }
                                                    }

                                                    // 2. Insert into Pets Table
                                                    const petData = {
                                                        owner_id: user.id,
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
                                                        photos: photoUrls,
                                                        cover_photo: photoUrls.length > 0 ? photoUrls[0] : null,
                                                        status: 'safe'
                                                    };

                                                    const { data: savedPet, error: dbError } = await supabase
                                                        .from('pets')
                                                        .insert(petData)
                                                        .select()
                                                        .single();

                                                    if (dbError) throw dbError;

                                                    alert("Harika! Profil hazırlandı ve bu pet'e özel Moffi-ID QR Altyapısı başarıyla kuruldu.");

                                                    // Refetch user pets immediately so UI updates
                                                    fetchUserPets();

                                                    setIsSavingPet(false);
                                                    setIsAddPetOpen(false);
                                                    setAddPetStep(1);
                                                    setNewPetName(""); setNewPetBreed(""); setNewPetAge("");
                                                    setNewPetPhotos([]);
                                                    setNewPetGender("Erkek"); setNewPetNeutered("Evet"); setNewPetSize("Küçük");
                                                    setNewPetHealth(""); setNewPetFeatures(""); setNewPetCharacter("");
                                                    setNewPetMicrochip(""); setNewPetShowPhone(false);
                                                } catch (error: any) {
                                                    console.error("Pet kayıt hatası:", error);
                                                    alert("Kaydedilirken bir hata oluştu: " + error.message);
                                                    setIsSavingPet(false);
                                                }
                                            }}
                                            className="w-full py-4 mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(34,211,238,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
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

                            <button onClick={() => setIsAddPetOpen(false)} className="w-full text-center py-2 text-sm text-gray-500 font-bold hover:text-white transition-colors mt-2">
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
                        className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 shrink-0 border-b border-white/5">
                            <button
                                onClick={() => { setIsUploadModalOpen(false); setUploadImageURL(null); setUploadCaption(''); setUploadMood(null); }}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center -ml-2"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <h2 className="text-xl font-black text-white">Yeni Gönderi</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 flex flex-col gap-6">

                            {/* PREVIEW */}
                            {uploadImageURL && (
                                <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 relative shadow-2xl">
                                    <img src={uploadImageURL} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        {uploadMood && (
                                            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20">
                                                {uploadMood}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* CAPTION */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex gap-4">
                                <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300" className="w-10 h-10 rounded-full shrink-0" />
                                <textarea
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    placeholder="Bu harika anı anlat..."
                                    className="w-full bg-transparent outline-none text-white resize-none h-24 text-sm mt-1"
                                />
                            </div>

                            {/* MOOD SELECTOR (Apple Style Pills) */}
                            <div className="flex flex-col gap-2">
                                <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest px-1">Ruh Hali (İsteğe Bağlı)</span>
                                <div className="w-full overflow-x-auto no-scrollbar flex gap-2 pb-2">
                                    {MOOD_OPTIONS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => setUploadMood(uploadMood === mood ? null : mood)}
                                            className={cn(
                                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                uploadMood === mood ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* LOCATION TOGGLE */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-3xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Konum Bilgisini Ekle</p>
                                        <p className="text-gray-400 text-xs">Açmadığınız sürece gizli kalır.</p>
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
                                className={cn("w-full py-4 mt-auto rounded-full font-black text-white flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(34,211,238,0.3)] transition-all", isPublishing ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-[1.02] active:scale-95")}
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
                        className="fixed inset-0 z-[115] bg-black/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 shrink-0 border-b border-white/5">
                            <button
                                onClick={() => setEditingPost(null)}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center -ml-2 text-white hover:bg-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-black text-white">Gönderiyi Düzenle</h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 flex flex-col gap-6">

                            {/* PREVIEW */}
                            <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 relative shadow-2xl">
                                <img src={editingPost.media} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {editingPost.mood && (
                                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20">
                                            {editingPost.mood}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CAPTION */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex gap-4">
                                <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} className="w-10 h-10 rounded-full shrink-0" />
                                <textarea
                                    value={editingPost.desc}
                                    onChange={(e) => setEditingPost({ ...editingPost, desc: e.target.value })}
                                    placeholder="Bu harika anı anlat..."
                                    className="w-full bg-transparent outline-none text-white resize-none h-24 text-sm mt-1"
                                />
                            </div>

                            {/* MOOD SELECTOR */}
                            <div className="flex flex-col gap-2">
                                <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest px-1">Ruh Hali (İsteğe Bağlı)</span>
                                <div className="w-full overflow-x-auto no-scrollbar flex gap-2 pb-2">
                                    {MOOD_OPTIONS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => setEditingPost({ ...editingPost, mood: editingPost.mood === mood ? null : mood })}
                                            className={cn(
                                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                editingPost.mood === mood ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
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
                                className={cn("w-full py-4 mt-auto rounded-full font-black text-white flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(34,211,238,0.3)] transition-all", isPublishing ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-[1.02] active:scale-95")}
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
                            className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
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
                                    <h3 className="text-white text-base font-bold">Gönderiyi Sil</h3>
                                    <p className="text-white/70 text-sm leading-snug">Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                                </div>
                                <div className="flex flex-col">
                                    <button
                                        onClick={deletePost}
                                        className="w-full py-3.5 text-red-500 font-bold text-[15px] border-b border-white/10 hover:bg-white/5 transition-colors active:bg-white/10"
                                    >
                                        Sil
                                    </button>
                                    <button
                                        onClick={() => setPostToDelete(null)}
                                        className="w-full py-3.5 text-cyan-500 font-normal text-[15px] hover:bg-white/5 transition-colors active:bg-white/10"
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
                        className="fixed inset-0 z-[120] bg-[#0A0A0E] flex flex-col pt-12 text-white"
                    >
                        {/* Emergency Header */}
                        <div className="flex justify-between items-center px-6 pb-4 border-b border-red-500/20">
                            <button
                                onClick={() => setIsLostAdModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
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
                                <h3 className="text-xl font-bold text-white mb-2">Çevredeki Herkesi Uyar!</h3>
                                <p className="text-sm text-red-500 font-medium leading-relaxed">
                                    Kaybolan dostunuzun bilgilerini girdiğinizde, 5 km çapındaki tüm Moffi üyelerine anında acil durum (SOS) bildirimi gönderilecektir.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">İsmi</label>
                                    <input value={lostPetName} onChange={e => setLostPetName(e.target.value)} type="text" placeholder="Örn: Buster" className="w-full mt-1 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Cinsi / Türü</label>
                                    <input value={lostPetBreed} onChange={e => setLostPetBreed(e.target.value)} type="text" placeholder="Örn: Golden Retriever" className="w-full mt-1 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">En Son Görüldüğü Yer</label>
                                    <input value={lostPetLocation} onChange={e => setLostPetLocation(e.target.value)} type="text" placeholder="Örn: Kadıköy Moda Sahili" className="w-full mt-1 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Detaylar / İletişim Notu</label>
                                    <textarea value={lostPetDesc} onChange={e => setLostPetDesc(e.target.value)} placeholder="Tasma rengi, belirgin özelliği veya ek iletişim bilgileriniz..." className="w-full mt-1 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors resize-none h-24" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fotoğraflar</label>
                                        <button onClick={() => sosInputRef.current?.click()} className="text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 font-bold hover:bg-red-500/20 transition-all uppercase tracking-tighter flex items-center gap-1">
                                            <Camera className="w-3 h-3" /> Fotoğraf Ekle
                                        </button>
                                        <input type="file" ref={sosInputRef} className="hidden" accept="image/*" multiple onChange={handleSosImageSelect} />
                                    </div>

                                    {lostPetPhotos.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-3">
                                            {lostPetPhotos.map((photo, idx) => (
                                                <div key={idx} className="aspect-square rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                                    <img src={photo.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <button
                                                        onClick={() => setLostPetPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {lostPetPhotos.length < 4 && (
                                                <button
                                                    onClick={() => sosInputRef.current?.click()}
                                                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:border-red-500/50 hover:text-red-500 transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => sosInputRef.current?.click()}
                                            className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
                                        >
                                            <Camera className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-xs font-bold">Fotoğraf Ekle</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Button */}
                        <div className="p-6 border-t border-red-500/20 bg-[#0A0A0E] shrink-0">
                            <button
                                onClick={submitSos}
                                disabled={isSubmittingSOS}
                                className={cn("w-full py-4 rounded-2xl font-black text-white text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all", isSubmittingSOS ? "bg-red-800 cursor-not-allowed" : "bg-red-600 active:scale-95")}
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
                        className="fixed inset-0 z-[130] bg-black text-white flex flex-col"
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

                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/40 to-transparent pointer-events-none" />

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
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                                <div className="flex gap-3">
                                    <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95" onClick={() => alert("SOS İlanı Paylaşılıyor...")}>
                                        <Share2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Hero Text */}
                            <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-black text-white tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                        KAYIP İLANI
                                    </span>
                                    <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                                        {new Date(selectedLostPet.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                                    {selectedLostPet.pet_name}
                                </h1>
                                <p className="text-gray-300 text-lg font-medium drop-shadow-md">{selectedLostPet.pet_breed || "Belirtilmedi"}</p>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 bg-[#0A0A0E] overflow-y-auto no-scrollbar pb-32">
                            <div className="p-6 space-y-8 max-w-lg mx-auto">

                                {/* Info Cards Row */}
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-1.5 shadow-lg">
                                        <MapPin className="w-6 h-6 text-red-400 mb-1" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Son Görülen Yer</span>
                                        <span className="text-sm text-white font-bold leading-tight">{selectedLostPet.last_location}</span>
                                    </div>
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-1.5 shadow-lg">
                                        <User className="w-6 h-6 text-blue-400 mb-1" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">İlan Sahibi</span>
                                        <span className="text-sm text-white font-bold leading-tight line-clamp-1 truncate w-full">{selectedLostPet.author_name}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-black text-white mb-3">Detaylar</h3>
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
                        <div className="absolute inset-x-0 bottom-0 bg-[#0A0A0E] border-t border-white/5 p-6 pb-8 shrink-0 flex gap-4">
                            <button className="flex-1 py-4 rounded-2xl bg-cyan-500 text-black font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform" onClick={handleMessageOwner}>
                                <MessageCircle className="w-5 h-5" /> Sahibine Mesaj At
                            </button>
                            <button disabled={isReportingLocation} className={cn("flex-1 py-4 rounded-2xl border border-white/20 font-black text-base flex items-center justify-center gap-2 transition-transform", isReportingLocation ? "bg-white/20 text-gray-400 cursor-not-allowed" : "bg-white/10 text-white hover:bg-white/20 active:scale-95")} onClick={handleReportLocation}>
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
                            className="w-full max-w-md bg-[#12121A] rounded-[2rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 pb-4 border-b border-white/5 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 ring-4 ring-blue-500/10">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-white text-center">
                                    {anonModalType === 'report' ? "Gizli İhbar Yap" : "Anonim Mesaj Gönder"}
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-gray-400 text-sm font-medium leading-relaxed text-center">
                                    Moffi KVKK yükümlülükleri gereğince, iletişim bilgileriniz, gerçek adınız veya net GPS konumunuz {selectedLostPet?.author_name} kullanıcısı ile <strong className="text-white">asla paylaşılmayacaktır.</strong>
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
                                        className={cn("w-full bg-[#0A0A0E] border rounded-xl p-4 text-white text-sm outline-none transition-colors h-28 resize-none", anonError ? "border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 focus:border-cyan-500")}
                                    />
                                    {anonError && (
                                        <div className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full animate-bounce">
                                            <Lock className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setAnonModalType(null); setAnonError(null); }}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-colors"
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
                        className="fixed inset-0 z-50 bg-black text-white flex flex-col sm:pb-0"
                    >
                        <div className="px-5 pt-14 pb-3 flex items-center justify-between bg-black/80 backdrop-blur-xl shrink-0 z-10 sticky top-0 border-b border-[#2C2C2E]/60">
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
                                            {activeChatUserId === user?.id ? <Activity className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-[12px] font-medium tracking-tight text-[#E5E5EA]">{activeChatUserId === user?.id ? "Siz" : "Anonim"}</span>
                                        <span className="text-[10px] text-gray-400 font-medium -mt-0.5"><ChevronRight className="w-3 h-3 inline pb-0.5" /></span>
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
                            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
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
                                                className="flex items-center gap-4 py-3 border-b border-white/5 hover:bg-white/5 active:bg-white/10 px-2 rounded-2xl transition-all text-left w-full"
                                            >
                                                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl font-bold shadow-lg shrink-0 border border-white/10">
                                                    {isSelf ? <Activity className="w-6 h-6 text-cyan-400" /> : <User className="w-6 h-6 text-white" />}
                                                    {isUnread && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-[#0A0A0E] rounded-full animate-pulse" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className="font-bold text-[17px] text-white/95 truncate">{isSelf ? "Test: Kendimle Sohbet" : "Anonim Kullanıcı"}</h4>
                                                        <span className="text-sm font-medium text-gray-500">{new Date(lastMsg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-80">
                                                        {lastMsg.sender_id === user?.id && (
                                                            lastMsg.read_status ? <CheckCheck className="w-4 h-4 text-blue-500 shrink-0" /> : <Check className="w-4 h-4 text-gray-500 shrink-0" />
                                                        )}
                                                        <p className={cn("text-[15px] truncate", isUnread ? "text-white font-semibold" : "text-gray-400 font-medium")}>
                                                            {lastMsg.sender_id === user?.id ? "Siz: " : ""}{lastMsg.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
                                        <MessageCircle className="w-16 h-16 mb-4 stroke-1 text-gray-400" />
                                        <h3 className="text-xl font-bold mb-2">Henüz Sohbetiniz Yok</h3>
                                        <p className="text-[15px] max-w-xs text-gray-400">Keşfet ekranındaki diğer evcil dostlar ile mesajlaştığınızda burada görünecektir.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!activeChatUserId && inboxTab === 'sos' && (
                            // SOS ALERTS LIST
                            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
                                    <h4 className="text-red-400 font-bold flex items-center gap-2 mb-1"><ShieldAlert className="w-5 h-5" /> Acil İhbar Hattı</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium">Bu ekranda sadece Pet-ID (QR Kod) üzerinden size gelen anonim ihbarlar, son görüldü konumları ve acil mesajlar listelenir. Sıradan mesajlar buraya düşmez.</p>
                                </div>

                                {sosAlerts.length > 0 ? (
                                    sosAlerts.map(alert => {
                                        const isMessage = alert.seen_area.startsWith('[MESAJ]');
                                        return (
                                            <div key={alert.id} className="bg-[#12121A] border border-red-500/10 p-4 rounded-2xl flex items-start gap-4 shadow-lg shadow-black/40">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", isMessage ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-red-500/10 border-red-500/40 text-red-500")}>
                                                    {isMessage ? <MessageCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className={cn("text-[15px] font-bold", isMessage ? "text-blue-400" : "text-red-500")}>{alert.pet_name} için <span className="opacity-80 font-medium">{isMessage ? "Mesaj" : "İhbar"}</span></h4>
                                                        <span className="text-[11px] text-gray-500 font-medium">{new Date(alert.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-white/90 leading-relaxed mt-1">
                                                        {alert.seen_area.replace(/\[.*?\]\s*/, '')}
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
                                        <h3 className="text-xl font-bold mb-2 text-white/50">İhbar Kaydı Bulunamadı</h3>
                                        <p className="text-[14px] text-gray-500 font-medium">Şu ana kadar QR kodunuz üzerinden herhangi bir kayıp/ihbar logu iletilmemiş. İyi haber!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeChatUserId && (
                            // ACTIVE CHAT THREAD (iMessage BUBBLES)
                            <>
                                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
                                    {(() => {
                                        const rawThread = chatGroups.find(g => g[0] === activeChatUserId)?.[1] || [];
                                        const threadMsgs = rawThread.filter((m: any) => m.content !== '[SYSTEM_ACCEPT]');
                                        return threadMsgs.map((msg: any) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("max-w-[80%] flex flex-col gap-1 group/msg", isMe ? "self-end" : "self-start")}>
                                                    <div className={cn(
                                                        "px-4 py-2 text-[15.5px] font-medium leading-[1.35] max-w-full break-words shadow-sm relative transition-all",
                                                        isMe ? "bg-[#2C2C2E] text-white rounded-[22px] rounded-br-[6px]" : "bg-[#1C1C1E] text-[#E5E5EA] border border-white/5 rounded-[22px] rounded-bl-[6px]",
                                                        editingMessageId === msg.id && "ring-2 ring-white/40 ring-offset-2 ring-offset-black scale-[1.02]"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <div className={cn("flex items-center gap-1.5 px-1 relative", isMe ? "justify-end" : "justify-start")}>
                                                        {msg.is_edited && <span className="text-[10px] text-gray-400 font-medium opacity-80">Düzenlendi</span>}
                                                        <span className="text-[11px] font-semibold text-gray-500">
                                                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            msg.read_status ? <CheckCheck className="w-3.5 h-3.5 text-[#E5E5EA]" strokeWidth={2.5} /> : <Check className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                                                        )}
                                                        {isMe && (
                                                            <div className="relative flex items-center">
                                                                <button onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100 peer ml-0.5">
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
                                                                </button>
                                                                {activeMessageMenuId === msg.id && (
                                                                    <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#2C2C2E] rounded-xl shadow-xl border border-white/10 py-1.5 z-50 flex flex-col drop-shadow-2xl backdrop-blur-3xl">
                                                                        <button onClick={() => startEditingMessage(msg.id, msg.content)} className="px-4 py-2 text-left text-[14px] text-white hover:bg-white/10 transition-colors flex items-center justify-between font-medium">Düzenle <Edit2 className="w-3.5 h-3.5 opacity-70" /></button>
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
                                                    <button onClick={() => setIsInboxOpen(false)} className="flex-1 py-3 rounded-[14px] bg-[#2C2C2E] text-white font-semibold active:opacity-70 transition-opacity">
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
                                        <div className="relative p-3 bg-black/95 flex items-end gap-3 shrink-0 pb-7 snap-start backdrop-blur-2xl border-t border-white/5">
                                            {/* Plus / X Button */}
                                            <button
                                                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                                                className={cn("w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300",
                                                    isAttachMenuOpen ? "bg-white/10 text-white rotate-45" : "text-white/50 hover:text-white"
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
                                                            <span className="text-[15px] font-medium text-white/95">Kamera</span>
                                                        </button>
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Fotoğraf galerisi erişimi ekleniyor."); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-white/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform"><ImageIcon className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-white/95">Fotoğraflar</span>
                                                        </button>
                                                        <div className="h-[1px] bg-white/5 my-1 w-full" />
                                                        <button onClick={() => { setIsAttachMenuOpen(false); showToast("Yakında!", "Harita üzerinden konum paylaşımı ekleniyor."); }} className="flex items-center gap-3 w-full p-2.5 rounded-[16px] hover:bg-white/10 transition-colors text-left group">
                                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-4 h-4" /></div>
                                                            <span className="text-[15px] font-medium text-white/95">Konum Paylaş</span>
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
                                                    className="flex-1 bg-transparent px-3 py-1 text-[16px] text-white outline-none -mt-0.5 placeholder:text-[#8E8E93]"
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
                                                    <button className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 transition-opacity ml-1 mb-0.5 text-white/40 hover:text-white hover:bg-white/10">
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
                        className="fixed inset-0 z-[100] flex flex-col justify-end"
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
                            className="relative w-full h-[90vh] bg-[#12121A] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        >
                            {/* Grab Handle */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 pointer-events-none" />

                            {/* Close Button */}
                            <button onClick={() => setIsAddAdoptionModalOpen(false)} className="absolute top-4 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white z-50">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-6 pt-12 pb-4 border-b border-white/5 shrink-0">
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <HeartHandshake className="w-6 h-6 text-cyan-400" /> Sahiplendirme İlanı Ver
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">Dostumuz için en iyi yuvayı bulalım.</p>
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
                                                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {adoptionPetPhotos.length < 4 && (
                                            <button
                                                onClick={() => adoptionPhotoRef.current?.click()}
                                                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:border-cyan-400/50 hover:text-cyan-400 transition-all font-bold"
                                            >
                                                <Plus className="w-6 h-6" />
                                                <span className="text-[10px] mt-1">Ekle</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => adoptionPhotoRef.current?.click()}
                                        className="w-full h-52 rounded-3xl bg-[#1C1C1E] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-colors cursor-pointer group mb-2 shadow-inner overflow-hidden"
                                    >
                                        <Camera className="w-8 h-8 mb-2 group-hover:text-cyan-400 group-hover:scale-110 transition-all drop-shadow-md" />
                                        <span className="text-sm font-bold tracking-wide">Net Fotoğraflar Yükle</span>
                                        <span className="text-[10px] mt-1 text-gray-500 font-medium italic">Sahiplendirme şansını %80 artırır</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Kategori</label>
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
                                                            : "bg-[#0A0A0E] border-white/5 text-gray-500"
                                                    )}
                                                >
                                                    <span className="text-xl">{type.icon}</span>
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>

                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">İsim & Tür</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="İsim (Örn: Pamuk)"
                                                value={adoptionPetName}
                                                onChange={(e) => setAdoptionPetName(e.target.value)}
                                                className="w-1/2 bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-colors placeholder:text-gray-600"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tür / Irk"
                                                value={adoptionPetBreed}
                                                onChange={(e) => setAdoptionPetBreed(e.target.value)}
                                                className="w-1/2 bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-colors placeholder:text-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Yaş & Açıklama</label>
                                        <input
                                            type="text"
                                            placeholder="Yaşı (Örn: 2 Aylık, 3 Yaşında)"
                                            value={adoptionPetAge}
                                            onChange={(e) => setAdoptionPetAge(e.target.value)}
                                            className="w-full bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-colors mb-3 placeholder:text-gray-600"
                                        />
                                        <textarea
                                            rows={4}
                                            placeholder="Onu biraz anlatın... Tuvalet eğitimi var mı? Karakteri nasıl?"
                                            value={adoptionPetDesc}
                                            onChange={(e) => setAdoptionPetDesc(e.target.value)}
                                            className="w-full bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-colors resize-none placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Alert / Warning Box */}
                                    <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-3xl border border-red-500/20 mt-2">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                        </div>
                                        <p className="text-[11px] text-gray-300 leading-relaxed font-medium mt-0.5">
                                            <span className="text-red-400 font-bold tracking-wide">ÜCRET TALEP ETMEK YASAKTIR.</span> Moffi tamamen ücretsiz sahiplendirme üzerine kuruludur. Canlı satışı veya para talebi tespit edildiğinde hesaplar <strong className="text-white">kalıcı olarak</strong> kapatılır.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-3 pb-8 bg-[#12121A] shrink-0 border-t border-white/5 relative z-20">
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
                        className="fixed inset-0 z-[100] flex flex-col justify-end"
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
                            className="relative w-full h-[85vh] bg-[#0A0A0E] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        >
                            {/* Grab Handle */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 pointer-events-none" />

                            {/* Close Button */}
                            <button onClick={() => setSelectedAdoptionPet(null)} className="absolute top-4 right-6 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white z-50">
                                <X className="w-5 h-5" />
                            </button>

                            {/* Hero Image */}
                            <div className="w-full h-[45%] relative shrink-0">
                                <img src={selectedAdoptionPet.img} className="w-full h-full object-cover transition-all duration-500" />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0A0A0E] to-transparent" />

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
                                <h1 className="text-4xl font-black text-white leading-tight mt-1">{selectedAdoptionPet.name}</h1>

                                <div className="flex gap-2 mt-4">
                                    {selectedAdoptionPet.tags?.map((tag: string) => (
                                        <div key={tag} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                                            <Check className="w-3 h-3 text-cyan-400" /> {tag}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 bg-white/5 rounded-3xl p-5 border border-white/5">
                                    <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Hikaye & Durum</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed font-medium">
                                        {selectedAdoptionPet.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Apple iOS Style Floating Action Bar */}
                            <div className="w-full p-6 pt-2 pb-10 bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E] to-transparent relative z-20">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleStartAdoptionChat(selectedAdoptionPet)}
                                        className="flex-1 py-4 rounded-full bg-white/10 border border-white/10 text-white font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2"
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
                                <p className="text-[10px] text-gray-500 text-center font-medium mt-2">Moffi Güvenli Mesajlaşma ile verileriniz uçtan uca korunur.</p>
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
                        className="fixed inset-0 z-[300] flex flex-col justify-end"
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
                            className="relative bg-[#12121A] rounded-t-[2.5rem] p-6 pb-12 border-t border-white/10 z-10"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-lg">İlanı Bildir</h3>
                                    <p className="text-gray-500 text-xs">Moffi ekibi en kısa sürede inceleyecek</p>
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
                                            reportReason === opt.value ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/5"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{opt.label}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleReportAdoption}
                                disabled={!reportReason || isSubmittingReport}
                                className="w-full py-4 rounded-full bg-red-500 text-white font-black text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
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
                            className="relative bg-[#0A0A0E] rounded-t-[3rem] p-6 pb-12 border-t border-white/10 z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/10">
                                    <img src={selectedAdoptionPet.img} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl">{selectedAdoptionPet.name} İçin Başvuru</h3>
                                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">Son Adım: Yuva Olma Formu</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                                <div>
                                    <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Evcil Hayvan Tecrübeniz</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['0-2 Yıl', '3-5 Yıl', '5+ Yıl'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setAppExperience(lvl)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[13px] font-bold border transition-all",
                                                    appExperience === lvl ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400"
                                                )}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Yaşam Alanınız</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Apartman', 'Müstakil', 'Bahçeli'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setAppHomeType(type)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[13px] font-bold border transition-all",
                                                    appHomeType === type ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Kendinizden Bahsedin</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Neden onu sahiplenmek istiyorsunuz? Ona nasıl bir hayat sunacaksınız?"
                                        value={appNote}
                                        onChange={(e) => setAppNote(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] focus:outline-none focus:border-cyan-400 transition-colors resize-none placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-4 flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
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
                        className="fixed inset-0 z-[200] bg-black flex flex-col"
                    >
                        {/* Header */}
                        <div className="pt-12 pb-4 px-4 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
                            <button onClick={() => setIsAdoptionChatOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <img src={adoptionChatPet.img} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                <div>
                                    <h3 className="text-white font-bold text-sm leading-tight">{adoptionChatPet.name} İlanı</h3>
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
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[11px] text-gray-400 text-center leading-relaxed">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={cn(
                                                "px-4 py-2.5 rounded-2xl text-[14px] font-medium leading-[1.4]",
                                                msg.sender === 'me' ? "bg-cyan-500 text-white rounded-tr-sm" : "bg-[#1C1C1E] text-white rounded-tl-sm border border-white/5"
                                            )}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{msg.time}</span>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 pb-10 bg-black/80 backdrop-blur-xl border-t border-white/5">
                            <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-full p-2 pl-4 border border-white/5">
                                <input
                                    type="text"
                                    placeholder="Bir mesaj yazın..."
                                    value={adoptionNewMsg}
                                    onChange={(e) => setAdoptionNewMsg(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendAdoptionMsg()}
                                    className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-gray-500"
                                />
                                <button
                                    onClick={handleSendAdoptionMsg}
                                    className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white active:scale-95 transition-transform"
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
                            <div className="absolute top-8 left-4 right-4 z-10 flex justify-between items-center text-white drop-shadow-md">
                                <div className="flex items-center gap-3">
                                    <img src={(storyGroups[viewerStoryGroupIndex].user_id === user?.id ? (user?.avatar || storyGroups[viewerStoryGroupIndex].author_avatar) : storyGroups[viewerStoryGroupIndex].author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-8 h-8 rounded-full border border-white/40 object-cover" />
                                    <span className="font-bold text-sm tracking-wide">{storyGroups[viewerStoryGroupIndex].author_name}</span>
                                    <span className="text-white/60 text-xs mt-0.5">· {formatTimeAgo(storyGroups[viewerStoryGroupIndex].stories[viewerStoryIndex].created_at)}</span>
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
                                        <div className="flex items-center justify-between w-full text-white">
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
                                                    className="bg-transparent text-white w-full text-sm outline-none placeholder:text-white/70"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <button className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform pointer-events-auto" onClick={(e) => { e.stopPropagation(); alert("Hikaye beğenildi!"); }}>
                                                <Heart className="w-7 h-7 hover:fill-red-500 hover:text-red-500 transition-colors" />
                                            </button>
                                            <button className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform pointer-events-auto" onClick={(e) => { e.stopPropagation(); alert("Paylaşım menüsü açılıyor..."); }}>
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
                            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
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
                                    <h3 className="text-2xl font-black text-white mb-1">{qrModalPet.name} - Akıllı Kimlik</h3>
                                    <p className="text-sm text-gray-400 font-medium mb-6">Bu QR Kodu Moffi Künyesine yazdırın veya tasmaya yapıştırın. (Test için kamera ile okutabilir veya Linke Tıklayabilirsiniz!)</p>

                                    {/* THE QR CODE SURROUNDED BY NEON BORDER */}
                                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.4)] border-4 border-cyan-400/50 mb-6 active:scale-95 transition-transform cursor-pointer" onClick={() => window.open(`${window.location.origin}/id/${qrModalPet.id}`, '_blank')}>
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

                                <button onClick={() => setQrModalPet(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white z-20">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* MOFFI HUB OVERLAY MENU (Apple Style Action Menu) */}
            <AnimatePresence>
                {
                    isHubOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[140] bg-[#0A0A0E]/60 backdrop-blur-md flex items-end justify-center px-4 pb-28"
                            onClick={() => setIsHubOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 100, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 100, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="w-full max-w-sm bg-[#1C1C1E]/90 border border-white/10 rounded-[3rem] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                                    {[
                                        { icon: Globe, label: 'Moffi.net', color: 'text-cyan-400', bg: 'bg-cyan-500/10', onClick: () => window.open('https://moffi.net', '_blank') },
                                        { icon: PawPrint, label: 'Yürüyüş', color: 'text-green-400', bg: 'bg-green-500/10', href: '/walk' },
                                        { icon: Stethoscope, label: 'Veteriner', color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/vet' },
                                        { icon: ShoppingBag, label: 'Market', color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/petshop' },
                                        { icon: Palette, label: 'Stüdyo', color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/studio' },
                                        { icon: Gamepad2, label: 'Oyun', color: 'text-pink-400', bg: 'bg-pink-500/10', href: '/game' },
                                    ].map((tool, idx) => (
                                        <button
                                            key={idx}
                                            onClick={tool.onClick || (() => router.push(tool.href!))}
                                            className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
                                        >
                                            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-lg", tool.bg, "group-hover:scale-105 border border-white/5")}>
                                                <tool.icon className={cn("w-7 h-7", tool.color)} />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors">{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setIsHubOpen(false)} className="w-full mt-8 py-4 bg-white/5 rounded-2xl text-gray-400 text-sm font-bold hover:bg-white/10 transition-colors">
                                    Kapat
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* GLOBAL BOTTOM TAB BAR - Simplified Apple iOS Style */}
            < nav className="fixed bottom-0 left-0 right-0 z-[150] safe-area-bottom" >
                <div className="bg-[#0A0A0E]/80 backdrop-blur-2xl border-t border-white/5 px-6 pb-6 pt-3">
                    <div className="flex items-center justify-between max-w-sm mx-auto">
                        <button
                            onClick={() => window.open('https://moffi.net', '_blank')}
                            className="flex flex-col items-center gap-1 transition-all active:scale-90 text-gray-500 hover:text-cyan-400"
                        >
                            <Globe className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Moffi.net</span>
                        </button>

                        <button
                            onClick={() => setIsHubOpen(!isHubOpen)}
                            className="relative w-16 h-16 -mt-10 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_10px_30px_rgba(34,211,238,0.4)] border-4 border-[#0A0A0E] active:scale-90 transition-all group"
                        >
                            {isHubOpen ? (
                                <X className="w-8 h-8 text-white rotate-90" />
                            ) : (
                                <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-500" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('adoption')}
                            className={cn("flex flex-col items-center gap-1 transition-all active:scale-90", activeTab === 'adoption' ? "text-cyan-400" : "text-gray-500")}
                        >
                            <HeartHandshake className={cn("w-6 h-6", activeTab === 'adoption' ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sahiplen</span>
                        </button>
                    </div>
                </div>
            </nav >
        </div >
    );
}

// -- SETTINGS ROW COMPONENT --
function SettingsRow({ icon: Icon, label, danger, onClick }: { icon: any, label: string, danger?: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn("w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group", danger && "hover:bg-red-500/10")}>
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full", danger ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white")}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={cn("font-bold", danger ? "text-red-500" : "text-white/90")}>{label}</span>
            </div>
            <ChevronRight className={cn("w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity", danger ? "text-red-500" : "text-gray-400")} />
        </button>
    );
}

// -- NAV BUTTON --
function NavBtn({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className="relative p-2 transition-colors">
            <Icon className={cn("w-6 h-6 transition-colors", active ? "text-white" : "text-gray-500 hover:text-gray-300")} strokeWidth={active ? 2.5 : 2} />
            {active && (
                <motion.div layoutId="nav-pill" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
        </button>
    );
}

// -- IMMERSIVE POST CARD --
function ImmersivePostCard({ post, currentUser, onLike, onAddComment, onDeletePost, onEditPost }: { post: any, currentUser: any, onLike: () => void, onAddComment: (text: string) => void, onDeletePost: () => void, onEditPost: () => void }) {
    const [tapHeart, setTapHeart] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isOwner = currentUser?.id === post.user_id || currentUser?.username === post.author?.replace('@', '');

    const handleDoubleTap = () => {
        if (!post.isLiked) onLike();
        setTapHeart(true);
        setTimeout(() => setTapHeart(false), 800);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Paws&Play Şaheseri',
                text: `${post.owner}'in bu muhteşem pozuna bak! ${post.desc}`,
                url: window.location.href,
            }).catch(() => { });
        } else {
            alert('Bağlantı kopyalandı! Arkadaşlarınla paylaşabilirsin.');
        }
        setIsMenuOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full h-full max-w-lg mx-auto rounded-[3rem] overflow-hidden bg-gray-900 border border-white/10 shadow-2xl group"
        >
            {/* MEDIA */}
            <div className="absolute inset-0 bg-black cursor-pointer" onDoubleClick={handleDoubleTap}>
                <img src={post.media} className="w-full h-full object-cover opacity-90 transition-transform duration-[10s] group-hover:scale-110 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 pointer-events-none" />
            </div>

            {/* TOP BAR BUILT INTO CARD */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-20 pointer-events-none">
                <div className="flex gap-2">
                    {/* Konum bilgisi kaldırıldı */}
                    {post.mood && (
                        <span className="bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg relative overflow-hidden group/badge">
                            <span className="relative z-10">{post.mood}</span>
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/badge:translate-x-full transition-transform duration-700 pointer-events-none" />
                        </span>
                    )}
                </div>
                <button onClick={() => setIsMenuOpen(true)} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* OPTIONS MENU (BOTTOM SHEET) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Dim Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        {/* Slide up panel */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 max-h-[80%] bg-[#1c1c1e] z-50 rounded-t-[32px] overflow-hidden flex flex-col pointer-events-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                        >
                            <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>

                            <div className="flex flex-col px-4 pb-6 pt-1 gap-1.5">
                                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center mb-1.5">Seçenekler</h3>

                                {isOwner ? (
                                    <>
                                        <button onClick={() => { setIsMenuOpen(false); onEditPost(); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl flex items-center gap-3 text-white font-medium text-sm">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Edit2 className="w-4 h-4" /></div>
                                            Gönderiyi Düzenle
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); onDeletePost(); }} className="w-full bg-red-500/10 hover:bg-red-500/20 transition-colors p-3 rounded-xl flex items-center gap-3 text-red-500 font-bold mt-1">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                                            Gönderiyi Sil
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setIsMenuOpen(false); alert("Şikayetiniz mod ekibimize iletilmiştir. Teşekkürler!"); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl flex items-center gap-3 text-white font-medium text-sm">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"><Flame className="w-4 h-4" /></div>
                                            Şikayet Et
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); alert("Bu kullanıcı engellendi, gönderilerini artık görmeyeceksiniz."); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl flex items-center gap-3 text-white font-medium text-sm">
                                            <div className="w-8 h-8 rounded-full bg-white/10 text-gray-400 flex items-center justify-center"><X className="w-4 h-4" /></div>
                                            Kullanıcıyı Gizle / Engelle
                                        </button>
                                        <button onClick={handleShare} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl flex items-center gap-3 text-white font-medium text-sm mt-1">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Share2 className="w-4 h-4" /></div>
                                            Bağlantıyı Kopyala
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* DOUBLE TAP ANIMATION */}
            <AnimatePresence>
                {tapHeart && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                    >
                        <PawPrint className="w-32 h-32 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_40px_rgba(34,211,238,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* USER INFO & CAPTION & ACTIONS */}
            <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-col gap-4">

                {/* FLOATING ACTION BAR RIGHT */}
                <div className="absolute right-0 bottom-0 flex flex-col gap-4 z-30 translate-y-[-2rem]">
                    <div className="flex flex-col items-center gap-1">
                        <button onClick={onLike} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/20 shadow-xl">
                            {post.isLiked ? (
                                <PawPrint className="w-6 h-6 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                            ) : (
                                <Heart className="w-6 h-6 text-white drop-shadow-md" />
                            )}
                        </button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{post.likes}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={() => setShowComments(true)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/20 shadow-xl">
                            <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
                        </button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{post.comments}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={handleShare} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/20 shadow-xl">
                            <Share2 className="w-6 h-6 text-white drop-shadow-md" />
                        </button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">Paylaş</span>
                    </div>
                </div>

                {/* BOTTOM LEFT INFO */}
                <div className="pr-16 w-full pointer-events-none">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 p-0.5 relative">
                            <img src={isOwner ? (currentUser?.avatar || post.avatar) : post.avatar} className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-black pointer-events-auto cursor-pointer" onClick={() => alert('Kullanıcıyı takip ettiniz!')}>
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white drop-shadow-lg leading-tight flex items-center gap-1">
                                {post.author} <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            </span>
                            <span className="text-[11px] text-cyan-300 font-medium">
                                {post.owner}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-white/90 leading-relaxed font-medium drop-shadow-md line-clamp-3 w-5/6">
                        {post.desc}
                    </p>
                </div>

            </div>

            {/* SUBTLE GLOW OVERLAY FOR ELEGANCE */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* INTERACTIVE COMMENTS DRAWER */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute inset-x-0 bottom-0 h-[65%] bg-black/85 backdrop-blur-3xl z-40 rounded-t-[2.5rem] border-t border-white/10 p-5 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" /> {/* Handlebar */}

                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-cyan-400" />
                                {post.comments} Yorum
                            </h3>
                            <button onClick={() => setShowComments(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-4">
                            {post.commentsList && post.commentsList.length > 0 ? (
                                post.commentsList.map((c: any) => (
                                    <div key={c.id} className="flex gap-3">
                                        {c.isSystem ? (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <img src={c.avatar} className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <span className={cn("text-xs font-bold", c.isSystem ? "text-cyan-400" : "text-white")}>{c.author}</span>
                                            <p className="text-xs text-gray-300 mt-1">{c.text}</p>
                                            <span className="text-[10px] text-gray-500 mt-1 block">{c.time}</span>
                                        </div>
                                        <Heart className={cn("w-3 h-3 ml-auto mr-1", c.isSystem ? "text-red-500 fill-red-500" : "text-gray-500")} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center mt-10">Henüz hiç yorum yok. İlk yorumu sen yap!</p>
                            )}
                        </div>

                        <div className="mt-2 flex items-center gap-3 relative bg-white/5 border border-white/10 rounded-full py-1.5 px-1.5 shrink-0">
                            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300" className="w-8 h-8 rounded-full ml-1" />
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onAddComment(commentInput);
                                        setCommentInput("");
                                    }
                                }}
                                placeholder="Gerçekten harika bir paylaşım..."
                                className="w-full bg-transparent text-sm text-white pr-10 focus:outline-none placeholder:text-gray-500"
                            />
                            <button onClick={() => { onAddComment(commentInput); setCommentInput(""); }} className="absolute right-1 w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center text-black font-bold transition-transform active:scale-95 shadow-lg shadow-cyan-500/30">
                                <Send className="w-4 h-4 -ml-0.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
