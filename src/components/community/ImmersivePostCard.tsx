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
    const [localAllowComments, setLocalAllowComments] = useState(post?.allow_comments ?? true);
    const [localCommentPrivacy, setLocalCommentPrivacy] = useState(post?.comment_privacy || 'everyone');
    const [showCommentSettings, setShowCommentSettings] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
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

    const isOwner = currentUser?.id === post.user_id || currentUser?.username === post.author?.replace('@', '');

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
        if (!commentInput.trim() && !selectedMedia) return;
        const text = commentInput;
        setCommentInput("");
        setSelectedMedia(null);

        const currentEdit = editingComment;
        const currentReply = replyingTo;

        setReplyingTo(null);
        setEditingComment(null);

        if (currentEdit) {
            await onEditComment?.(currentEdit.id, text);
            await apiService.editComment(currentEdit.id, text);
            refetchComments();
        } else if (currentReply) {
            await onReplyComment?.(currentReply.id, text);
            await addComment(text, currentUser, currentReply.id);
            refetchComments();
        } else {
            await addComment(text, currentUser);
            onAddComment?.(text);
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
        <div ref={containerRef} className="w-full max-w-[470px] mx-auto bg-white dark:bg-[#121212] sm:border sm:border-gray-200 dark:sm:border-white/10 sm:rounded-2xl mb-8 flex flex-col shadow-sm">
            {/* HEADER */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileNavigation}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-white/20 bg-gray-100 shrink-0">
                        <img 
                            src={post.author_avatar || post.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} 
                            alt={post.author || "User"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-none">
                                {post.author || post.user?.username || "kullanici"}
                            </span>
                            {post.verified && <BadgeCheck className="w-4 h-4 text-cyan-500" />}
                        </div>
                        {post.location && (
                            <span className="text-[11px] text-gray-500 mt-0.5">{post.location}</span>
                        )}
                    </div>
                </div>
                <button onClick={() => setIsMoreOpen(true)} className="p-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* MEDIA */}
            <div 
                className="relative w-full aspect-square sm:aspect-[4/5] bg-gray-100 dark:bg-black overflow-hidden flex items-center justify-center cursor-pointer"
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
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </div>
                    </>
                ) : (
                    <img 
                        src={mediaSrc} 
                        alt="Post Media" 
                        className="w-full h-full object-cover"
                    />
                )}

                <AnimatePresence>
                    {tapHeart && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none"
                        >
                            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ACTIONS */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        <button onClick={handleDoubleTap} className="text-gray-900 dark:text-gray-100 hover:text-gray-500 transition-colors">
                            <Heart className={cn("w-6 h-6", post.isLiked ? "fill-red-500 text-red-500" : "")} />
                        </button>
                        <button onClick={() => allowComments ? setShowComments(true) : null} className={cn("text-gray-900 dark:text-gray-100 hover:text-gray-500 transition-colors", !allowComments && "opacity-50")}>
                            <MessageCircle className="w-6 h-6" />
                        </button>
                        <button onClick={handleShareClick} className="text-gray-900 dark:text-gray-100 hover:text-gray-500 transition-colors">
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                {/* LIKES & CAPTION */}
                <div className="text-[13px]">
                    {post.likes > 0 && (
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                            {post.likes} beğenme
                        </div>
                    )}
                    <div className="flex gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{post.author || post.user?.username || "kullanici"}</span>
                        <span className="text-gray-800 dark:text-gray-200 break-words flex-1 leading-snug">
                            {filterContent(post.desc || post.caption || "")}
                        </span>
                    </div>
                    {allowComments && post.comments > 0 && (
                        <button 
                            onClick={() => setShowComments(true)}
                            className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-xs"
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
                            className="fixed inset-0 bg-black/50 z-[440] backdrop-blur-sm"
                            onClick={() => setShowComments(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="fixed bottom-0 left-0 right-0 z-[450] bg-white dark:bg-[#121212] rounded-t-3xl shadow-2xl flex flex-col h-[75vh]"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Yorumlar</h3>
                                <button onClick={() => setShowComments(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                                {isLoadingComments ? (
                                    <div className="flex justify-center p-8"><span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">Henüz yorum yok. İlk yorumu sen yap!</div>
                                ) : (
                                    comments.map((c: any) => (
                                        <div key={c.id} className="flex gap-3">
                                            <img src={c.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} className="w-8 h-8 rounded-full shrink-0" />
                                            <div>
                                                <span className="font-semibold text-xs text-gray-900 dark:text-gray-100 mr-2">{c.user?.username || "kullanici"}</span>
                                                <span className="text-sm text-gray-800 dark:text-gray-200">{filterContent(c.text)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-white/10 flex gap-3">
                                <input 
                                    type="text" 
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                    placeholder="Yorum ekle..." 
                                    className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
                                />
                                <button onClick={handleSendComment} disabled={!commentInput.trim()} className="text-cyan-500 font-semibold text-sm disabled:opacity-50">Paylaş</button>
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
                            className="fixed inset-0 bg-black/50 z-[440] backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsMoreOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="fixed bottom-0 left-0 right-0 z-[450] bg-white dark:bg-[#121212] rounded-t-3xl shadow-2xl flex flex-col p-4 pb-8"
                        >
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-6" />
                            <div className="flex flex-col gap-2">
                                <button onClick={() => { setIsMoreOpen(false); handleProfileNavigation(); }} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-xl font-semibold text-gray-900 dark:text-gray-100">Profili Görüntüle</button>
                                {isOwner && (
                                    <>
                                        <button onClick={() => { setIsMoreOpen(false); onEditPost(); }} className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-xl font-semibold text-gray-900 dark:text-gray-100">Düzenle</button>
                                        <button onClick={() => { setIsMoreOpen(false); onDeletePost(); }} className="w-full p-4 bg-red-50 dark:bg-red-500/10 rounded-xl font-semibold text-red-500">Sil</button>
                                    </>
                                )}
                                <button onClick={() => setIsMoreOpen(false)} className="w-full p-4 font-semibold text-gray-500">İptal</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}