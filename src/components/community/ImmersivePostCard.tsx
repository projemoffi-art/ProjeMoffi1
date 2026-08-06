'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
    Heart, MessageCircle, Share2, MoreHorizontal, User, 
    ChevronRight, Info, QrCode, Star, Copy, Bell, 
    Edit2, Trash2, VolumeX, Volume2, EyeOff, ShieldAlert, 
    BadgeCheck, Plus, X, Sparkles, Send, Check,
    Download, Instagram, MessageSquare, Zap, Compass
} from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { cn } from '@/lib/utils';
import { ShieldCheck, Crown, Footprints, Zap as SOSZap } from 'lucide-react';
import Image from 'next/image';
import { apiService } from '@/services/apiService';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';

interface ImmersivePostCardProps {
    post: any;
    currentUser: any;
    onLike: () => void;
    onAddComment: (text: string) => void;
    onDeletePost?: () => void;
    onEditPost?: () => void;
    onShare: () => void;
    onToggleCommentLike?: (commentId: string) => void;
    onReplyComment?: (parentCommentId: string, text: string) => void;
    onDeleteComment?: (commentId: string) => void;
    onEditComment?: (commentId: string, text: string) => void;
    onReportComment?: (commentId: string) => void;
    priority?: boolean;
    isCommentsDisabled?: boolean;
}

export function ImmersivePostCard({ 
    post, 
    currentUser, 
    onLike, 
    onAddComment, 
    onDeletePost = () => {}, 
    onEditPost = () => {}, 
    onShare,
    onToggleCommentLike,
    onReplyComment,
    onDeleteComment = () => {},
    onEditComment = () => {},
    onReportComment = () => {},
    priority = false,
    isCommentsDisabled = false
}: ImmersivePostCardProps) {
    const router = useRouter();
    const [tapHeart, setTapHeart] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    
    const [localAllowComments, setLocalAllowComments] = useState(post?.allow_comments ?? true);
    const [localCommentPrivacy, setLocalCommentPrivacy] = useState(post?.comment_privacy || 'everyone');
    const [showCommentSettings, setShowCommentSettings] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const allowComments = localAllowComments !== false;
    const hiddenWords = currentUser?.settings?.content?.hiddenWords || [];
    const [isAddingToStory, setIsAddingToStory] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [showGIFPicker, setShowGIFPicker] = useState(false);
    const [editingComment, setEditingComment] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const [activeBadgeInfo, setActiveBadgeInfo] = useState<'verified' | 'premium' | 'walker' | 'sos' | null>(null);
    const [likers, setLikers] = useState<any[]>([]);
    const [showLikersModal, setShowLikersModal] = useState(false);
    const [isLoadingLikers, setIsLoadingLikers] = useState(false);

    useEffect(() => {
        if (post?.id && post.likes > 0) {
            setIsLoadingLikers(true);
            apiService.getPostLikers(post.id).then(data => {
                setLikers(data || []);
                setIsLoadingLikers(false);
            }).catch(() => setIsLoadingLikers(false));
        } else {
            setLikers([]);
        }
    }, [post?.id, post?.likes]);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { stories } = useSocial();
    const audioRef = React.useRef<HTMLAudioElement>(null);

    const [mediaSrc, setMediaSrc] = useState(post?.media || post?.media_url || post?.image || "");

    useEffect(() => {
        setMediaSrc(post?.media || post?.media_url || post?.image || "");
    }, [post]);


    // INTERSECTION OBSERVER FOR SMART PLAY/PAUSE
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.6 } // Needs 60% visibility to play
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            if (isVisible) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
        
        // Handle background audio for photos/videos
        if (audioRef.current && post?.audio_url) {
            audioRef.current.muted = isMuted;
            if (isVisible) {
                audioRef.current.play().catch(() => {});
            } else {
                audioRef.current.pause();
            }
        }
    }, [isVisible, isMuted, post?.audio_url]);


    // Censorship Logic
    const filterContent = (text: string) => {
        if (!text || hiddenWords.length === 0) return text;
        let filtered = text;
        hiddenWords.forEach((word: string) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            filtered = filtered.replace(regex, '***');
        });
        return filtered;
    };

    const MOCK_GIFS = [
        { id: 'g1', url: "https://i.giphy.com/4T7eWG7jRmsTVypLOH.gif" }, // Happy Goldie
        { id: 'g2', url: "https://i.giphy.com/3o72F7YpG6X5sVz6so.gif" }, // Cute Cat
        { id: 'g3', url: "https://i.giphy.com/12u0fLq9pxj9rW.gif" }, // Paws
        { id: 'g4', url: "https://i.giphy.com/kyLYXonQpkUsS1dY9L.gif" }, // Dancing Dog
        { id: 'g5', url: "https://i.giphy.com/jpbnoe3UIa8TU8UC8F.gif" }, // Sleeping Cat
    ];

    const AI_SUGGESTIONS = [
        "Harika bir paylaşım! ✨",
        "Çok tatlı görünüyor 😍",
        "Buna bayıldım! 🦴",
        "Nerede burası? 📍",
        "Pati dostu mu? 🐾"
    ];

    const MOCK_USERS = [
        { id: 'u1', username: 'pati_sever', name: 'Pati Sever' },
        { id: 'u2', username: 'moffi_fan', name: 'Moffi Hayranı' },
        { id: 'u3', username: 'kedi_dostu', name: 'Kedi Dostu' }
    ];

    // PINCH TO ZOOM STATE
    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [isZooming, setIsZooming] = useState(false);

    const springConfig = { damping: 25, stiffness: 200 };
    const springScale = useSpring(scale, springConfig);
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            setIsZooming(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && isZooming) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            // Distance calculation
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            
            // Midpoint calculation
            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            // Simple scale logic (initial distance is assumed 150 for start of pinch)
            const newScale = Math.max(1, dist / 150);
            scale.set(newScale);

            // Centering logic
            if (newScale > 1.05) {
                const moveX = (midX - window.innerWidth / 2) * 0.5;
                const moveY = (midY - window.innerHeight / 2) * 0.5;
                x.set(moveX);
                y.set(moveY);
            }
        }
    };

    const handleTouchEnd = () => {
        setIsZooming(false);
        scale.set(1);
        x.set(0);
        y.set(0);
    };

    const targetId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
    const isOwner = currentUser?.id === targetId || (currentUser?.username && post.author && currentUser.username === post.author.replace('@', ''));

    const handleProfileNavigation = () => {
        const targetId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
        
        if (isOwner) {
            // Navigate to own profile page directly
            if (targetId) router.push(`/profile/${targetId}`);
            else window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'profile' }));
        } else {
            // Navigate to other user's profile
            if (targetId) {
                router.push(`/profile/${targetId}`);
            } else {
                console.warn('Profile navigation failed: no user_id on post', post);
            }
        }
    };

    const handleDoubleTap = () => {
        if (!currentUser || String(currentUser.id) === 'local-user') {
            alert('❤️ Beğenmek ve etkileşime geçmek için lütfen giriş yapın veya kayıt olun.');
            window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'login' }));
            return;
        }
        if (!post.isLiked) onLike();
        setTapHeart(true);
        setTimeout(() => setTapHeart(false), 800);
    };

    const handleShareClick = () => {
        onShare();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Bağlantı panoya kopyalandı 🔗');
    };

    const handleAddToStory = () => {
        setIsAddingToStory(true);
        setTimeout(() => {
            setIsAddingToStory(false);
            alert('Gönderi hikayenize başarıyla eklendi! 🚀');
        }, 1500);
    };

    const handleUpdateCommentSettings = async (allow: boolean, privacy: string) => {
        setIsUpdatingSettings(true);
        try {
            await apiService.updatePost(post.id, { allow_comments: allow, comment_privacy: privacy } as any);
            setLocalAllowComments(allow);
            setLocalCommentPrivacy(privacy);
            alert('Yorum ayarları başarıyla güncellendi! 🛡️');
            setShowCommentSettings(false);
        } catch (err: any) {
            console.error('Yorum ayarları güncellenemedi:', err);
            alert('Ayar güncellenirken bir hata oluştu.');
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    // GLOBAL REALTIME COMMENTS — Supabase WebSocket (Instagram/TikTok pattern)
    const { comments, isLoading: isLoadingComments, addComment, refetchComments } = useRealtimeComments(
        post.id,
        showComments
    );

    const handleSendComment = async () => {
        if (!currentUser || String(currentUser.id) === 'local-user') {
            alert('💬 Yorum yazmak için lütfen giriş yapın veya kayıt olun.');
            window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'login' }));
            return;
        }
        if (isSendingComment || (!commentInput.trim() && !selectedMedia)) return;
        
        setIsSendingComment(true);
        const text = commentInput;
        setCommentInput("");
        setSelectedMedia(null);

        try {
            const currentEdit = editingComment;
            const currentReply = replyingTo;

            setReplyingTo(null);
            setEditingComment(null);

            if (currentEdit) {
                await onEditComment?.(currentEdit.id, text);
                await apiService.editComment(currentEdit.id, text);
            } else if (currentReply) {
                await onReplyComment?.(currentReply.id, text);
                await addComment(text, currentUser, currentReply.id);
            } else {
                await addComment(text, currentUser);
                onAddComment?.(text);
            }
        } finally {
            setIsSendingComment(false);
            refetchComments();
        }
    };

    useEffect(() => {
        const scrollContainer = document.getElementById('community-scroll-container');
        
        if (isMoreOpen || showComments || activeBadgeInfo) {
            document.body.style.overflow = 'hidden';
            if (scrollContainer) {
                scrollContainer.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
            if (scrollContainer) {
                // Keep it empty to allow CSS classes (snap-scroll) to work
                scrollContainer.style.overflow = '';
            }
        }
        return () => {
            document.body.style.overflow = '';
            if (scrollContainer) {
                scrollContainer.style.overflow = '';
            }
        };
    }, [isMoreOpen, showComments, activeBadgeInfo]);

    const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);

    useEffect(() => {
        const authorId = post.user_id || post.userId || post.authorId;
        if (!authorId || isOwner || !currentUser) return;

        const checkFollow = async () => {
            try {
                const status = await apiService.isFollowing(authorId);
                setIsFollowingAuthor(status);
            } catch (err) {
                console.error("isFollowing check error in post card:", err);
            }
        };
        checkFollow();
    }, [post.user_id, post.userId, post.authorId, isOwner, currentUser]);

    useEffect(() => {
        const authorId = post.user_id || post.userId || post.authorId;
        if (!authorId) return;

        const handleFollowChange = (e: any) => {
            if (e.detail && e.detail.userId === authorId) {
                setIsFollowingAuthor(e.detail.isFollowing);
            }
        };
        window.addEventListener('moffi-follow-change', handleFollowChange);
        return () => window.removeEventListener('moffi-follow-change', handleFollowChange);
    }, [post.user_id, post.userId, post.authorId]);

    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFollowingAuthor) return;
        
        const authorId = post.user_id || post.userId || post.authorId;
        if (!authorId) return;

        setIsFollowingAuthor(true);
        try {
            await apiService.followUser(authorId);
            window.dispatchEvent(new CustomEvent('moffi-follow-change', {
                detail: { userId: authorId, isFollowing: true }
            }));
        } catch (err) {
            console.error("Takip hatası:", err);
            setIsFollowingAuthor(false);
        }
    };

    return (
        <div ref={containerRef} className="w-full max-w-[495px] mx-auto flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 px-5">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={handleProfileNavigation}>
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-transparent group-hover:border-cyan-500/30 transition-all bg-gray-100 shrink-0 relative">
                        <img 
                            src={post.author_avatar || post.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} 
                            alt={post.author || "User"}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[15px] tracking-tight text-gray-900 dark:text-gray-100 leading-none group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {post.author || post.user?.username || "kullanici"}
                            </span>
                            {post.verified && <BadgeCheck className="w-4 h-4 text-cyan-500" />}
                            {!isOwner && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600 mx-1">•</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsFollowingAuthor(!isFollowingAuthor); }}
                                        className={cn("text-[13px] font-bold transition-colors", isFollowingAuthor ? "text-gray-400" : "text-cyan-500 hover:text-cyan-600")}
                                    >
                                        {isFollowingAuthor ? 'Takip Ediliyor' : 'Takip Et'}
                                    </button>
                                </>
                            )}
                        </div>
                        {post.location && (
                            <span className="text-[11px] font-medium text-gray-500 mt-1 tracking-wide uppercase">{post.location}</span>
                        )}
                    </div>
                </div>
                <button onClick={() => setIsMoreOpen(true)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all shrink-0 active:scale-95">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* MEDIA */}
            <div className="px-3 sm:px-4">
                <div 
                    className="relative w-full aspect-[4/5] sm:aspect-[2/3] bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden rounded-[1.5rem] flex items-center justify-center cursor-pointer group/media"
                onClick={() => {
                    const isVideo = post?.is_video || (post?.media && (/.(mp4|webm|ogg|mov|avi|m4v|mkv|flv|wmv)$/i.test(post.media)));
                    if (isVideo) {
                        setIsMuted(!isMuted);
                    }
                }}
                onDoubleClick={handleDoubleTap}
            >
                {(post?.is_video || (post?.media && (/.(mp4|webm|ogg|mov|avi|m4v|mkv|flv|wmv)$/i.test(post.media)) )) ? (
                    <>
                        <video
                            ref={videoRef}
                            src={mediaSrc}
                            muted={isMuted || !!post?.audio_url}
                            loop
                            playsInline
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.01]"
                        />
                        <div className="absolute bottom-4 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white/90 border border-white/10">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </div>
                    </>
                ) : (
                    <img 
                        src={mediaSrc} 
                        alt="Post Media" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.01]"
                    />
                )}
                
                {/* Subtle inner shadow overlay */}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />

                <AnimatePresence>
                    {tapHeart && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none drop-shadow-2xl"
                        >
                            <Heart className="w-28 h-28 text-red-500 fill-red-500" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            </div>

            {/* ACTIONS */}
            <div className="p-4 px-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike?.(); }} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all group">
                            <Heart strokeWidth={1.25} className={cn("w-[22px] h-[22px] transition-transform group-hover:scale-105 group-active:scale-95", post.isLiked ? "fill-red-500 text-red-500" : "")} />
                        </button>
                        <button onClick={() => allowComments ? setShowComments(true) : null} className={cn("p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all group", !allowComments && "opacity-50")}>
                            <MessageCircle strokeWidth={1.25} className="w-[22px] h-[22px] transition-transform group-hover:scale-105 group-active:scale-95" />
                        </button>
                        <button onClick={handleShareClick} className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-full transition-all group">
                            <Send strokeWidth={1.25} className="w-[22px] h-[22px] transition-transform group-hover:scale-105 group-active:scale-95 -mt-0.5 ml-0.5" />
                        </button>
                    </div>
                </div>
                
                {/* LIKES & CAPTION */}
                <div className="text-[14px] flex flex-col gap-1.5">
                    {post.likes > 0 && (
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <div className="flex flex-row -space-x-1.5" onClick={() => setShowLikersModal(true)}>
                                {likers.slice(0, 3).map((liker, i) => (
                                    <div key={i} className="w-[18px] h-[18px] rounded-full ring-2 ring-white dark:ring-[#121212] overflow-hidden relative z-[3] group-hover:-space-x-1 transition-all duration-300">
                                        <img src={liker?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {likers.length === 0 && post.likes > 0 && [...Array(Math.min(3, post.likes))].map((_, i) => (
                                    <div key={i} className="w-[18px] h-[18px] rounded-full ring-2 ring-white dark:ring-[#121212] overflow-hidden relative z-[3] group-hover:-space-x-1 transition-all duration-300">
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                            <span className="font-bold text-[13px] tracking-tight text-gray-900 dark:text-gray-100" onClick={() => setShowLikersModal(true)}>
                                {post.likes.toLocaleString()} beğenme
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <div>
                            <span className="font-bold tracking-tight text-gray-900 dark:text-gray-100 mr-2 cursor-pointer hover:underline">{post.author || post.user?.username || "kullanici"}</span>
                            <span className="text-gray-800 dark:text-gray-200 break-words leading-relaxed">
                                {filterContent(post.desc || post.caption || "")}
                            </span>
                        </div>
                    </div>
                    {allowComments && post.comments > 0 && (
                        <button 
                            onClick={() => setShowComments(true)}
                            className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-[13px] text-left hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            {post.comments} yorumun tümünü gör
                        </button>
                    )}
                </div>
            </div>

            {/* COMMENT DRAWER */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showComments && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[1100]"
                                onClick={() => setShowComments(false)}
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 sm:max-w-[440px] sm:mx-auto z-[1200] bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/20 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden"
                            >
                                {/* DRAG HANDLE */}
                                <div className="w-full flex justify-center pt-4 pb-2 shrink-0 cursor-pointer" onClick={() => setShowComments(false)}>
                                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
                                </div>

                                <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                                    <h3 className="font-bold text-[18px] text-gray-900 dark:text-white tracking-tight">Yorumlar</h3>
                                    <button onClick={() => setShowComments(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
                                    {isLoadingComments ? (
                                        <div className="flex justify-center p-8"><span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
                                    ) : comments.length === 0 ? (
                                        <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2">
                                                <MessageCircle className="w-8 h-8 opacity-40 text-gray-500" />
                                            </div>
                                            <p className="font-bold text-[15px] text-gray-900 dark:text-gray-100 tracking-tight">Henüz yorum yok</p>
                                            <p className="text-[13px] font-medium">İlk yorumu sen yaparak tartışmayı başlat!</p>
                                        </div>
                                    ) : (
                                        comments.map((c: any) => (
                                            <div key={c.id} className="flex gap-3 group/comment relative">
                                                <img src={c.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-10 h-10 rounded-full shrink-0 border border-black/5 dark:border-white/10 shadow-sm object-cover" />
                                                <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl rounded-tl-sm border border-black/5 dark:border-white/10 shadow-sm relative">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="font-bold text-[13px] tracking-tight text-gray-900 dark:text-gray-100">
                                                            {typeof c.user === 'string' ? c.user : (c.user?.username || c.user?.full_name || "Kullanıcı")}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-gray-400">{c.time_ago}</span>
                                                    </div>
                                                    <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-snug">{c.text || c.content}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <button 
                                                            onClick={() => onToggleCommentLike && onToggleCommentLike(c.id)}
                                                            className={cn("flex items-center gap-1.5 text-[12px] font-bold transition-colors", (c.isLiked || c.is_liked) ? "text-red-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                                                        >
                                                            <Heart className={cn("w-3.5 h-3.5", (c.isLiked || c.is_liked) && "fill-current")} />
                                                            <span>{c.likes}</span>
                                                        </button>
                                                        {currentUser?.id === (c.user?.id || c.user_id) && (
                                                            <button 
                                                                onClick={() => onDeleteComment && onDeleteComment(c.id)}
                                                                className="text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                                                            >
                                                                Sil
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#111]/50 backdrop-blur-xl shrink-0">
                                    <div className="flex gap-2">
                                        <div className="flex gap-1 py-2 overflow-x-auto no-scrollbar">
                                            {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(emoji => (
                                                <button 
                                                    key={emoji} 
                                                    onClick={() => setCommentInput(prev => prev + emoji)}
                                                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 active:scale-95"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1.5 pr-2 mt-2 border border-black/5 dark:border-white/5 shadow-inner">
                                        <input 
                                            type="text" 
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                            placeholder="Yorum ekle..." 
                                            className="flex-1 bg-transparent px-4 py-2 text-[14px] font-medium focus:outline-none dark:text-white placeholder:text-gray-400"
                                        />
                                        <button 
                                            onClick={handleSendComment} 
                                            disabled={!commentInput.trim() || isSendingComment} 
                                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-4 py-2 flex items-center justify-center font-bold text-[13px] disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-cyan-500/20 shrink-0"
                                        >
                                            Gönder
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
            {/* MORE DRAWER */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isMoreOpen && (
                        <>
                            <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-[440] backdrop-blur-md pointer-events-auto"
                            onClick={() => setIsMoreOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-4 left-4 right-4 sm:max-w-[400px] sm:mx-auto z-[450] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl flex flex-col p-6 border border-white/20 dark:border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-6" />
                            <div className="flex flex-col gap-2.5">
                                <button onClick={() => { setIsMoreOpen(false); handleProfileNavigation(); }} className="w-full flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl font-bold text-gray-900 dark:text-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95 text-[15px] tracking-tight group">
                                    <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl group-hover:bg-cyan-500/10 group-hover:text-cyan-500 transition-colors">
                                        <User strokeWidth={1.5} className="w-5 h-5" />
                                    </div>
                                    Profili Görüntüle
                                </button>
                                {!isOwner && (
                                    <>
                                        <button onClick={() => { setIsMoreOpen(false); }} className="w-full flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl font-bold text-gray-900 dark:text-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95 text-[15px] tracking-tight group">
                                            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl group-hover:bg-gray-200 dark:group-hover:bg-white/20 transition-colors">
                                                <EyeOff strokeWidth={1.5} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            İlgilenmiyorum
                                        </button>
                                        <button onClick={() => { setIsMoreOpen(false); }} className="w-full flex items-center gap-3 p-4 bg-red-50/50 dark:bg-red-500/5 rounded-2xl font-bold text-red-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-red-100 dark:border-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 text-[15px] tracking-tight group">
                                            <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-500/30 transition-colors">
                                                <ShieldAlert strokeWidth={1.5} className="w-5 h-5 text-red-500" />
                                            </div>
                                            Şikayet Et
                                        </button>
                                    </>
                                )}
                                {isOwner && (
                                    <>
                                        <button onClick={() => { setIsMoreOpen(false); onEditPost(); }} className="w-full flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl font-bold text-gray-900 dark:text-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95 text-[15px] tracking-tight group">
                                            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                <Edit2 className="w-5 h-5" />
                                            </div>
                                            Düzenle
                                        </button>
                                        <button onClick={() => { setIsMoreOpen(false); onDeletePost(); }} className="w-full flex items-center gap-3 p-4 bg-red-50/50 dark:bg-red-500/5 rounded-2xl font-bold text-red-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-red-100 dark:border-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 text-[15px] tracking-tight group">
                                            <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-500/30 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </div>
                                            Gönderiyi Sil
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setIsMoreOpen(false)} className="w-full p-4 font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-[15px] tracking-tight mt-2 active:scale-95">İptal</button>
                            </div>
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
            {/* LIKERS MODAL */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showLikersModal && (
                        <>
                            <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowLikersModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[260] bg-[var(--background)] rounded-t-3xl border-t border-black/10 dark:border-white/10 shadow-2xl max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-center p-3 shrink-0">
                                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full" />
                            </div>
                            <div className="px-5 pb-3 border-b border-black/10 dark:border-white/10 shrink-0 flex items-center justify-between">
                                <h3 className="font-black text-lg text-[var(--foreground)] tracking-tight">Beğenenler</h3>
                                <button onClick={() => setShowLikersModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 active:scale-95 transition-transform text-[var(--foreground)]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-10">
                                {isLoadingLikers ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-[var(--secondary-text)]">
                                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-medium">Yükleniyor...</p>
                                    </div>
                                ) : likers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-[var(--secondary-text)]">
                                        <Heart className="w-10 h-10 opacity-20" />
                                        <p className="text-sm font-medium">Henüz kimse beğenmemiş.</p>
                                    </div>
                                ) : (
                                    likers.map((liker: any) => (
                                        <div key={liker.id} className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => {
                                                    setShowLikersModal(false);
                                                    router.push(`/profile/${liker.id}`);
                                                }}
                                            >
                                                <img src={liker.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-12 h-12 rounded-full object-cover border border-black/5 dark:border-white/5 group-hover:opacity-80 transition-opacity" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-[var(--foreground)] group-hover:underline">{liker.username || liker.full_name || 'Kullanıcı'}</span>
                                                    {liker.full_name && liker.username && <span className="text-xs text-[var(--secondary-text)]">{liker.full_name}</span>}
                                                </div>
                                            </div>
                                            {liker.id !== currentUser?.id && (
                                                <button className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-[13px] rounded-full active:scale-95 transition-transform hover:opacity-90">
                                                    Takip Et
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
