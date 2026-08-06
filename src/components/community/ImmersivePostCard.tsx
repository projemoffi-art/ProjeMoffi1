'use client';

import React, { useState, useEffect } from 'react';
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
    const [isShareOpen, setIsShareOpen] = useState(false);
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
        <div ref={containerRef} className="w-full max-w-[470px] mx-auto bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[2rem] border border-black/[0.02] dark:border-white/[0.02] mb-6 sm:mb-8 flex flex-col shadow-[0_12px_40px_rgb(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_12px_50px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_12px_50px_rgba(255,255,255,0.02)] overflow-hidden">
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
                    className="relative w-full aspect-square sm:aspect-[4/5] bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden rounded-[1.5rem] flex items-center justify-center cursor-pointer group/media"
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
                        <button onClick={() => setIsShareOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-full transition-all group">
                            <Send strokeWidth={1.25} className="w-[22px] h-[22px] transition-transform group-hover:scale-105 group-active:scale-95 -mt-0.5 ml-0.5" />
                        </button>
                    </div>
                    {/* Add Save icon placeholder for aesthetic */}
                    <button className="p-2 -mr-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all active:scale-95">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </button>
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
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-[440] backdrop-blur-md"
                            onClick={() => setShowComments(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-4 left-4 right-4 sm:max-w-[440px] sm:mx-auto z-[450] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border border-white/20 dark:border-white/10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border-b border-gray-100 dark:border-white/5 shrink-0">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Yorumlar</h3>
                                <button onClick={() => setShowComments(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {isLoadingComments ? (
                                    <div className="flex justify-center p-8"><span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-3">
                                        <MessageCircle className="w-14 h-14 opacity-20" />
                                        <p className="font-medium text-[15px]">Henüz yorum yok. İlk yorumu sen yap!</p>
                                    </div>
                                ) : (
                                    comments.map((c: any) => (
                                        <div key={c.id} className="flex gap-3 group/comment relative">
                                            <img src={c.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-10 h-10 rounded-full shrink-0 border-2 border-gray-100 dark:border-white/10 shadow-sm" />
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-[14px] tracking-tight text-gray-900 dark:text-gray-100">{typeof c.user === 'string' ? c.user : (c.user?.username || c.user?.full_name || "Kullanıcı")}</span>
                                                    <span className="text-[11px] font-medium text-gray-400">{c.time || 'Şimdi'}</span>
                                                </div>
                                                <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed mt-0.5">{filterContent(c.text)}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button 
                                                        onClick={() => onToggleCommentLike && onToggleCommentLike(c.id)}
                                                        className={`flex items-center gap-1 text-[12px] font-medium transition-colors ${c.isLiked ? 'text-green-500' : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400'}`}
                                                    >
                                                        <Heart className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-current' : ''}`} />
                                                        <span>{c.likes || 0}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {(c.user_id === currentUser?.id || c.userId === currentUser?.id) && (
                                                <button 
                                                    onClick={() => onDeleteComment && onDeleteComment(c.id)}
                                                    className="absolute top-0 right-0 text-gray-400 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-all p-2 active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            {/* Modern Pill Input */}
                            <div className="p-4 px-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-2 bg-white dark:bg-white/5 rounded-[2rem] p-1.5 pl-5 border border-gray-200 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
                                    <input 
                                        type="text" 
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                        placeholder="Güzel bir şey yaz..." 
                                        className="flex-1 bg-transparent text-[14px] font-medium focus:outline-none dark:text-white placeholder:text-gray-400"
                                    />
                                    <button 
                                        onClick={handleSendComment} 
                                        disabled={!commentInput.trim() || isSendingComment} 
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[1.5rem] p-2.5 px-4 font-bold text-sm disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0"
                                    >
                                        <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
            
            {/* SHARE DRAWER */}
            <AnimatePresence>
                {isShareOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[440] backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsShareOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[450] bg-white dark:bg-[#111] rounded-t-[2.5rem] shadow-2xl p-6 pb-safe pointer-events-auto sm:max-w-[400px] sm:mx-auto"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6" />
                            
                            <h3 className="text-center font-bold text-[17px] mb-6 dark:text-white">Paylaş</h3>
                            
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { icon: <Copy strokeWidth={1.5} className="w-[22px] h-[22px]" />, label: 'Kopyala', bg: 'bg-gray-100 dark:bg-white/10', color: 'text-gray-800 dark:text-white' },
                                    { icon: <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, label: 'WhatsApp', bg: 'bg-[#25D366]/10', color: 'text-[#25D366]' },
                                    { icon: <Instagram strokeWidth={1.5} className="w-[22px] h-[22px]" />, label: 'Hikaye', bg: 'bg-[#E1306C]/10', color: 'text-[#E1306C]' },
                                    { icon: <svg className="w-[20px] h-[20px] fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: 'Twitter', bg: 'bg-black/5 dark:bg-white/10', color: 'text-black dark:text-white' },
                                    { icon: <MessageSquare strokeWidth={1.5} className="w-[22px] h-[22px]" />, label: 'Mesaj', bg: 'bg-blue-500/10', color: 'text-blue-500' },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setIsShareOpen(false)}>
                                        <div className={cn("w-[50px] h-[50px] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95", item.bg, item.color)}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* MORE DRAWER */}
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
            </AnimatePresence>
            {/* LIKERS MODAL */}
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
                                            <div className="flex items-center gap-3">
                                                <img src={liker.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-12 h-12 rounded-full object-cover border border-black/5 dark:border-white/5" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-[var(--foreground)]">{liker.username || liker.full_name || 'Kullanıcı'}</span>
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
            </AnimatePresence>

        </div>
    );
}
