'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
    Heart, MessageCircle, Share2, MoreHorizontal, User, 
    ChevronRight, Info, QrCode, Star, Copy, Bell, 
    Edit2, Trash2, VolumeX, Volume2, EyeOff, ShieldAlert, 
    BadgeCheck, Plus, X, Sparkles, Send,
    Download, Instagram, MessageSquare, Zap
} from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { cn } from '@/lib/utils';
import { ShieldCheck, Crown, Footprints, Zap as SOSZap } from 'lucide-react';
import Image from 'next/image';

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
    const [isEnhanced, setIsEnhanced] = useState(false);
    const [isAddingToStory, setIsAddingToStory] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [showGIFPicker, setShowGIFPicker] = useState(false);
    const [editingComment, setEditingComment] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(true);
    const { stories } = useSocial();
    const hiddenWords = currentUser?.settings?.content?.hiddenWords || [];
    const allowComments = currentUser?.settings?.privacy?.allowComments ?? true;

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

    const handleDoubleTap = () => {
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

    const handleSendComment = () => {
        if (!commentInput.trim() && !selectedMedia) return;

        if (editingComment) {
            onEditComment?.(editingComment.id, commentInput);
            setEditingComment(null);
        } else if (replyingTo) {
            onReplyComment?.(replyingTo.id, commentInput);
            setReplyingTo(null);
        } else {
            onAddComment(commentInput);
        }
        setCommentInput("");
        setSelectedMedia(null);
    };

    useEffect(() => {
        const scrollContainer = document.getElementById('community-scroll-container');
        
        if (isMoreOpen || showComments) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; 
            if (scrollContainer) {
                scrollContainer.style.overflow = 'hidden';
                scrollContainer.style.touchAction = 'none';
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            if (scrollContainer) {
                scrollContainer.style.overflow = 'auto';
                scrollContainer.style.touchAction = '';
            }
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            if (scrollContainer) {
                scrollContainer.style.overflow = 'auto';
                scrollContainer.style.touchAction = '';
            }
        };
    }, [isMoreOpen, showComments]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full aspect-[4/5] max-h-[82vh] rounded-none overflow-hidden bg-gray-900 border-b border-white/10 shadow-2xl group"
        >
            {/* MEDIA */}
            <div 
                className={cn("absolute inset-0 bg-black cursor-pointer touch-none", isZooming ? "z-[100]" : "z-0")} 
                onDoubleClick={handleDoubleTap}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <motion.div 
                    style={{ 
                        scale: springScale,
                        x: springX,
                        y: springY,
                    }}
                    className="w-full h-full relative"
                >
                    {post.media?.match(/\.(mp4|webm|ogg)$/) || post.is_video ? (
                        <video
                            src={post.media}
                            autoPlay={currentUser?.settings?.feed?.autoplay ?? true}
                            muted={isMuted}
                            loop
                            playsInline
                            className="w-full h-full object-cover opacity-90 transition-transform duration-[10s] group-hover:scale-110"
                        />
                    ) : (
                        <Image 
                            src={post.media || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} 
                            fill
                            priority={priority}
                            className="object-cover opacity-90 transition-transform duration-[10s] group-hover:scale-110 pointer-events-none" 
                            alt="Post Media"
                        />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 pointer-events-none" />
                </motion.div>
            </div>

            {/* VIDEO CONTROLS (Floating Mute Button) */}
            {(post.media?.match(/\.(mp4|webm|ogg)$/) || post.is_video) && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute bottom-32 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white z-30 active:scale-90 transition-all hover:bg-white/10"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            )}

            {/* TOP BAR BUILT INTO CARD */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-20 pointer-events-none">
                <div className="flex gap-2">
                    {post.mood && (
                        <span className="bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg relative overflow-hidden group/badge">
                            <span className="relative z-10">{post.mood}</span>
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/badge:translate-x-full transition-transform duration-700 pointer-events-none" />
                        </span>
                    )}
                </div>
                <button onClick={() => setIsMoreOpen(true)} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* MORE OPTIONS MENU (APPLE STYLE) */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsMoreOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
                            className="absolute bottom-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-[50px] border-t border-card-border rounded-t-[48px] shadow-2xl flex flex-col pointer-events-auto overflow-hidden max-h-[92%]"
                        >
                            <div 
                                onClick={() => setIsMoreOpen(false)}
                                className="w-full flex flex-col items-center pt-5 pb-2 shrink-0 cursor-pointer group/handle"
                            >
                                <div className="w-12 h-1.5 bg-white/20 rounded-full mb-1 group-hover/handle:bg-white/40 transition-colors" />
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pb-32 overscroll-contain text-white">
                                {/* AI SMART ANALYSIS SECTION */}
                                <div className="flex flex-col bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[32px] border border-white/10 overflow-hidden">
                                    <button 
                                        onClick={() => { setIsMoreOpen(false); alert('AI Akıllı Analiz başlatılıyor... ✨'); }}
                                        className="w-full px-6 py-6 flex items-center justify-between active:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col items-start text-left">
                                                <span className="font-black text-[18px] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Akıllı Analiz (AI)</span>
                                                <span className="text-indigo-200/50 text-[12px] font-medium">Bu gönderiyi yapay zeka ile incele</span>
                                            </div>
                                        </div>
                                        <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                                    </button>
                                </div>

                                {/* POST MANAGEMENT SECTION */}
                                <div className="flex flex-col bg-white/[0.03] rounded-[32px] border border-white/[0.08] divide-y divide-white/[0.05] overflow-hidden">
                                    <button 
                                        onClick={() => { 
                                            const targetId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
                                            setIsMoreOpen(false); 
                                            router.push(targetId ? `/profile/${targetId}` : '/profile'); 
                                        }}
                                        className="w-full px-6 py-5 flex items-center justify-between active:bg-white/[0.07] transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-white font-bold text-[17px]">Profili Görüntüle</span>
                                                <span className="text-white/40 text-[12px]">Kullanıcı detaylarını incele</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/10 group-active:translate-x-1 transition-transform" />
                                    </button>
                                    
                                    <button 
                                        onClick={() => { setIsMoreOpen(false); alert('Favorilerime eklendi ⭐'); }}
                                        className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all"
                                    >
                                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-400">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <span className="text-white/90 font-semibold text-[17px]">Favorilerime Ekle</span>
                                    </button>

                                    <button 
                                        onClick={() => { setIsMoreOpen(false); alert('Bu hesap hakkında bilgiler...'); }}
                                        className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all"
                                    >
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/60">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <span className="text-white/90 font-semibold text-[17px]">Bu Hesap Hakkında</span>
                                    </button>
                                </div>

                                {isOwner && (
                                    <div className="flex flex-col bg-white/[0.03] rounded-[32px] border border-white/[0.08] divide-y divide-white/[0.05] overflow-hidden">
                                        <button 
                                            onClick={() => { setIsMoreOpen(false); onEditPost(); }}
                                            className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all"
                                        >
                                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                                                <Edit2 className="w-6 h-6" />
                                            </div>
                                            <span className="text-white font-semibold text-[17px]">Gönderiyi Düzenle</span>
                                        </button>
                                        <button 
                                            onClick={() => { setIsMoreOpen(false); onDeletePost(); }}
                                            className="w-full px-6 py-5 flex items-center gap-5 active:bg-red-500/10 transition-all text-red-500"
                                        >
                                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500">
                                                <Trash2 className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-[17px]">Gönderiyi Sil</span>
                                        </button>
                                    </div>
                                )}

                                {!isOwner && (
                                    <div className="flex flex-col bg-white/[0.03] rounded-[32px] border border-white/[0.08] divide-y divide-white/[0.05] overflow-hidden">
                                        <button 
                                            onClick={() => { setIsMoreOpen(false); alert('Sessize alındı 🔇'); }}
                                            className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all"
                                        >
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40">
                                                <VolumeX className="w-6 h-6" />
                                            </div>
                                            <span className="text-white/90 font-semibold text-[17px]">Sessize Al</span>
                                        </button>
                                        <button 
                                            onClick={() => { setIsMoreOpen(false); alert('Şikayetiniz iletildi 🛡️'); }}
                                            className="w-full px-6 py-5 flex items-center gap-5 active:bg-red-500/10 transition-all text-red-500"
                                        >
                                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500">
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-[17px]">Şikayet Et</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 shrink-0">
                                <button 
                                    onClick={() => setIsMoreOpen(false)}
                                    className="w-full py-5 bg-white text-black rounded-[28px] font-black text-[18px] active:scale-[0.97] transition-all shadow-xl"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* SHARE SHEET (REMOVED - Using Global ShareSheet) */}

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
                        <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* USER INFO & CAPTION & ACTIONS */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-3">
                <div className="absolute right-0 bottom-0 flex flex-col gap-4 z-30 translate-y-[-2rem]">
                    <div className="flex flex-col items-center gap-1">
                        <button onClick={onLike} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/20 shadow-xl">
                            {post.isLiked ? (
                                <Heart className="w-6 h-6 text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                            ) : (
                                <Heart className="w-6 h-6 text-white drop-shadow-md" />
                            )}
                        </button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{post.likes}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button 
                            onClick={() => {
                                if (isCommentsDisabled || (!allowComments && isOwner)) {
                                    alert('Bu kullanıcı tüm gönderilerini yoruma kapatmıştır.');
                                } else {
                                    setShowComments(true);
                                }
                            }} 
                            className={cn(
                                "w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-xl",
                                (isCommentsDisabled || (!allowComments && isOwner)) 
                                    ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed scale-90" 
                                    : "bg-white/10 border-white/20 active:scale-90 hover:bg-white/20"
                            )}
                            disabled={isCommentsDisabled || (!allowComments && isOwner)}
                        >
                            <MessageCircle className={cn("w-6 h-6 drop-shadow-md", (isCommentsDisabled || (!allowComments && isOwner)) ? "text-white/20" : "text-white")} />
                        </button>
                        <span className={cn("text-[10px] font-bold drop-shadow-md", (isCommentsDisabled || (!allowComments && isOwner)) ? "text-white/20" : "text-white")}>
                            {(isCommentsDisabled || (!allowComments && isOwner)) ? '-' : post.comments}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button onClick={handleShareClick} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/20 shadow-xl">
                            <Share2 className="w-6 h-6 text-white drop-shadow-md" />
                        </button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">Paylaş</span>
                    </div>
                </div>

                <div className="pr-16 w-full flex items-center gap-3">
                    <div 
                        onClick={() => {
                            const targetId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
                            router.push(targetId ? `/profile/${targetId}` : '/profile');
                        }}
                        className="w-12 h-12 rounded-full border-2 border-white/20 p-0.5 relative pointer-events-auto cursor-pointer active:scale-95 transition-transform"
                    >
                        <Image src={(isOwner ? (currentUser?.avatar || post.avatar) : post.avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} fill className="rounded-full object-cover" alt="Author" />
                        {!isOwner && (
                            <motion.div 
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-black cursor-pointer shadow-lg shadow-cyan-500/40" 
                                onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    try {
                                        await apiService.followUser(post.user_id || post.userId);
                                        // Visual feedback: brief scale pop and background pulse
                                        showToast("Takip Edildi", `${post.author} takip listenize eklendi.`, "success");
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.8 }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                <Plus className="w-3 h-3 text-white" />
                                <motion.div 
                                    className="absolute inset-0 rounded-full bg-cyan-400"
                                    initial={{ scale: 1, opacity: 0 }}
                                    whileTap={{ scale: 3, opacity: 0.5 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </motion.div>
                        )}
                    </div>
                    <div className="flex flex-col pointer-events-auto cursor-pointer active:opacity-70 transition-opacity" onClick={() => {
                        const targetId = post.user_id || post.userId || post.authorId || post.owner_id || post.user?.id;
                        router.push(targetId ? `/profile/${targetId}` : '/profile');
                    }}>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-black text-white drop-shadow-lg leading-tight">
                                {post.author}
                            </span>
                            {/* AURA BADGE IN FEED */}
                            {post.aura_settings && (
                                <div 
                                    className={cn(
                                        "px-2.5 py-0.5 flex items-center gap-1.5 transition-all duration-500 backdrop-blur-md",
                                        post.aura_settings.frameStyle === 'glass' && "rounded-full bg-white/10 border border-white/20 shadow-xl",
                                        post.aura_settings.frameStyle === 'neon' && "rounded-lg bg-black/40 border-[0.5px] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]",
                                        post.aura_settings.frameStyle === 'metal' && "rounded-md bg-gradient-to-br from-gray-700 to-black border border-white/20",
                                        post.aura_settings.frameStyle === 'minimal' && "px-1"
                                    )}
                                >
                                    <div 
                                        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                                        style={{ backgroundColor: post.aura_settings.accentColor === 'default' ? '#6366f1' : post.aura_settings.accentColor }}
                                    />
                                    <span 
                                        className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.3em] transition-all duration-500",
                                            post.aura_settings.fontFamily === 'font-serif' && "font-serif",
                                            post.aura_settings.fontFamily === 'font-mono' && "font-mono",
                                            post.aura_settings.fontFamily === 'italic' && "italic",
                                            post.aura_settings.fontFamily === 'font-pacifico' && "font-pacifico lowercase !tracking-widest",
                                            post.aura_settings.fontFamily === 'font-satisfy' && "font-satisfy lowercase !tracking-widest",
                                            post.aura_settings.fontFamily === 'font-playfair' && "font-playfair",
                                        )}
                                        style={{ 
                                            color: (post.aura_settings.frameStyle === 'glass' || post.aura_settings.frameStyle === 'metal') ? '#FFFFFF' : '#FFFFFF',
                                            textShadow: post.aura_settings.frameStyle === 'neon' ? `0 0 8px ${post.aura_settings.accentColor === 'default' ? '#6366f1' : post.aura_settings.accentColor}` : 'none'
                                        }}
                                    >
                                        Pioneer
                                    </span>
                                    
                                    {/* BADGES IN FEED PILL */}
                                    <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                                        {(post.aura_settings.badges || []).map((bid: string) => {
                                            if (bid === 'verified') return <ShieldCheck key={bid} className="w-2.5 h-2.5 text-emerald-400" />;
                                            if (bid === 'premium') return <Crown key={bid} className="w-2.5 h-2.5 text-orange-400" />;
                                            if (bid === 'walker') return <Footprints key={bid} className="w-2.5 h-2.5 text-cyan-400" />;
                                            if (bid === 'sos') return <SOSZap key={bid} className="w-2.5 h-2.5 text-red-500" />;
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium drop-shadow-md">
                            {post.username || `@${post.author?.toLowerCase().replace(/\s+/g, '_')}`}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-medium drop-shadow-md line-clamp-2 w-5/6 pl-1.5 pointer-events-none">
                    {filterContent(post.desc)}
                </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute inset-x-0 bottom-0 h-[82%] bg-background/90 backdrop-blur-[40px] z-40 rounded-t-[2.5rem] border-t border-card-border p-4 flex flex-col shadow-2xl"
                    >
                        {/* HANDLE */}
                        <div 
                            onClick={() => setShowComments(false)}
                            className="w-full flex justify-center pt-2 pb-4 shrink-0 cursor-pointer group/handle"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full group-hover/handle:bg-white/40 transition-colors" />
                        </div>

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-foreground/5">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-accent" />
                                {post.comments} Yorum
                            </h3>
                            <button onClick={() => setShowComments(false)} className="bg-foreground/10 p-2 rounded-full hover:bg-foreground/20 transition-colors">
                                <X className="w-4 h-4 text-foreground" />
                            </button>
                        </div>

                        {/* COMMENT LIST CONTAINER */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-2 overscroll-contain pb-4">
                            <div className="space-y-6 px-1">
                                {post.commentsList && post.commentsList.length > 0 ? (
                                    post.commentsList.map((c: any) => (
                                        <CommentItem 
                                            key={c.id} 
                                            comment={c} 
                                            onLike={(cid) => onToggleCommentLike?.(cid)}
                                            onReply={(target) => {
                                                setReplyingTo(target);
                                                setEditingComment(null);
                                                setCommentInput('');
                                            }}
                                            onEdit={(target) => {
                                                setEditingComment(target);
                                                setReplyingTo(null);
                                                setCommentInput(target.text);
                                            }}
                                            onDelete={(cid) => onDeleteComment?.(cid)}
                                            onReport={(cid) => onReportComment?.(cid)}
                                            filterContent={filterContent}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center mt-20 opacity-30">
                                        <MessageCircle className="w-12 h-12 mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest text-center px-10">Henüz hiç yorum yok.<br/>İlk patiyi sen at!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* INPUT ACTIONS AREA */}
                        <div className="mt-auto shrink-0">
                            {/* AI SUGGESTION BAR */}
                            <AnimatePresence>
                                {showAISuggestions && !commentInput && !replyingTo && !editingComment && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="flex gap-2 overflow-x-auto no-scrollbar py-2 mb-1 shrink-0 px-2"
                                    >
                                        {AI_SUGGESTIONS.map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCommentInput(suggestion)}
                                                className="whitespace-nowrap px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-bold text-white/90 transition-all active:scale-95"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* INDICATOR BOX (Replying/Editing) */}
                            <AnimatePresence>
                                {(replyingTo || editingComment) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-2 flex items-center justify-between mx-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                                {editingComment ? 'YORUM DÜZENLENİYOR' : `YANITLANIYOR: @${replyingTo.author || replyingTo.userName}`}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setEditingComment(null);
                                                if (editingComment) setCommentInput('');
                                            }}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5 text-cyan-400" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative">
                                {/* MENTION LIST overlay */}
                                <AnimatePresence>
                                    {mentionSearch && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 right-0 mb-4 bg-[#1a1b1e]/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 mx-2"
                                        >
                                            <div className="p-3 border-b border-white/5 bg-white/5">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Kişi Etiketle</span>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto no-scrollbar divide-y divide-white/5">
                                                {MOCK_USERS.filter(u => u.username.includes(mentionSearch.slice(1))).map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => {
                                                            setCommentInput(prev => prev.replace(mentionSearch, `@${u.username} `));
                                                            setMentionSearch('');
                                                        }}
                                                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 active:bg-white/10 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="text-sm font-bold text-white">@{u.username}</span>
                                                            <span className="text-[10px] text-white/40">{u.name}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* GIF PICKER overlay */}
                                <AnimatePresence>
                                    {showGIFPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 right-0 mb-4 bg-[#1a1b1e]/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 flex flex-col mx-2"
                                        >
                                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                                    <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">Pati GIF'leri</span>
                                                </div>
                                                <button onClick={() => setShowGIFPicker(false)} className="text-white/40 hover:text-white transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                                                {MOCK_GIFS.map(gif => (
                                                    <button
                                                        key={gif.id}
                                                        onClick={() => {
                                                            setSelectedMedia({ type: 'gif', url: gif.url });
                                                            setShowGIFPicker(false);
                                                        }}
                                                        className="relative w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-white/10 active:scale-95 transition-transform"
                                                    >
                                                        <Image src={gif.url} fill className="object-cover" alt="GIF" />
                                                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* SELECTED MEDIA preview */}
                                <AnimatePresence>
                                    {selectedMedia && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative w-24 h-24 rounded-2xl overflow-hidden mb-3 border-2 border-cyan-500/50 shadow-lg ml-2"
                                        >
                                            <Image src={selectedMedia.url} fill className="object-cover" alt="Selected Media" />
                                            <button
                                                onClick={() => setSelectedMedia(null)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3 relative bg-white/5 border border-white/10 rounded-[2rem] py-2 px-2 shrink-0">
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => alert('Fotoğraf seçimi yakında aktif! 📸')}
                                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full border border-white/10 relative overflow-hidden">
                                            <Image src={currentUser?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} fill className="object-cover" alt="User" />
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={commentInput}
                                        onFocus={() => { setShowAISuggestions(true); setShowGIFPicker(false); }}
                                        onBlur={() => setTimeout(() => setShowAISuggestions(false), 200)}
                                        onChange={(e) => {
                                            setCommentInput(e.target.value);
                                            const words = e.target.value.split(' ');
                                            const lastWord = words[words.length - 1];
                                            if (lastWord.startsWith('@')) {
                                                setMentionSearch(lastWord);
                                            } else {
                                                setMentionSearch('');
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendComment();
                                        }}
                                        placeholder={editingComment ? "Yorumu düzenle..." : (replyingTo ? "Yanıtınızı yazın..." : "Düşüncelerini bir pati ile paylaş...")}
                                        className="w-full bg-transparent text-sm text-white pr-20 focus:outline-none placeholder:text-white/20"
                                    />

                                    <div className="absolute right-2 flex items-center gap-1.5">
                                        <button
                                            onClick={() => setShowGIFPicker(!showGIFPicker)}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border transition-all",
                                                showGIFPicker ? "bg-cyan-500 border-cyan-400 text-black" : "hover:bg-white/10 text-cyan-400 border-white/5"
                                            )}
                                        >
                                            GIF
                                        </button>
                                        <button
                                            onClick={handleSendComment}
                                            className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center text-black font-bold transition-transform active:scale-95 shadow-xl"
                                        >
                                            <Send className="w-4 h-4 -ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// RENDER HELPER FOR COMMENTS
function CommentItem({ comment, onLike, onReply, onEdit, onDelete, onReport, isReply = false }: { comment: any, onLike: (commentId: string) => void, onReply: (comment: any) => void, onEdit: (comment: any) => void, onDelete: (commentId: string) => void, onReport: (commentId: string) => void, isReply?: boolean }) {
    const [showReplies, setShowReplies] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<any>(null);
    const router = useRouter();

    const startPress = () => {
        const timer = setTimeout(() => {
            setShowContextMenu(true);
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        }, 600);
        setLongPressTimer(timer);
    };

    const endPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: isReply ? 10 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn("flex flex-col relative", isReply ? "pl-1" : "")}
        >
            <div 
                className="flex gap-3 group/comment"
                onPointerDown={startPress}
                onPointerUp={endPress}
                onPointerLeave={endPress}
            >
                <div className="flex flex-col items-center shrink-0">
                    {comment.isSystem ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    ) : (
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                const targetId = comment.userId || comment.user_id || comment.authorId;
                                router.push(targetId ? `/profile/${targetId}` : '/profile');
                            }}
                            className="relative cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full border border-white/10 relative overflow-hidden">
                                <Image src={comment.avatar || comment.userImg} fill className="object-cover" alt="Commenter" />
                            </div>
                            {comment.isLiked && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-black shadow-sm"
                                >
                                    <Heart className="w-2 h-2 text-white fill-white" />
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                    {isReply && <div className="flex-1 w-0.5 bg-gradient-to-b from-white/10 to-transparent my-1 rounded-full" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="relative overflow-hidden group/reply-target">
                        {/* HAPTIC TOUCH FEEDBACK EFFECT (Subtle background highlight) */}
                        <AnimatePresence>
                            {showContextMenu && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -inset-x-2 -inset-y-1 bg-white/[0.03] z-0 rounded-xl"
                                />
                            )}
                        </AnimatePresence>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span
                                        onClick={() => {
                                            const targetId = comment.userId || comment.user_id || comment.authorId;
                                            router.push(targetId ? `/profile/${targetId}` : '/profile');
                                        }}
                                        className={cn("text-[13px] font-black truncate cursor-pointer hover:underline", comment.isSystem ? "text-cyan-400" : "text-white/90")}
                                    >
                                        {comment.author || comment.userName}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-black uppercase tracking-tighter shrink-0 ml-auto">{comment.time || "YENİ"}</span>
                                </div>
                                {comment.isReplyTo && (
                                    <span className="text-[10px] text-cyan-400/50 font-black flex items-center shrink-0">
                                        <ChevronRight className="w-2.5 h-2.5" />
                                        @{comment.isReplyTo}
                                    </span>
                                )}
                            </div>
                            <p className="text-[13px] text-white/80 leading-relaxed font-medium font-sans break-words">{comment.text}</p>

                            {comment.media && (
                                <div className="mt-2 rounded-2xl overflow-hidden border border-white/5 shadow-2xl max-w-[200px]">
                                    <img src={comment.media.url} className="w-full h-auto object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-5 mt-1 ml-1">
                        <button
                            onClick={() => onLike(comment.id)}
                            className={cn(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                comment.isLiked ? "text-red-500" : "text-white/40 hover:text-white/60"
                            )}
                        >
                            {comment.isLiked ? <Heart className="w-3 h-3 fill-red-500" /> : <Heart className="w-3 h-3" />}
                            {comment.likes > 0 ? comment.likes : "BEĞEN"}
                        </button>
                        <button
                            onClick={() => onReply(comment)}
                            className="flex items-center gap-1 text-[10px] text-white/40 font-black uppercase tracking-widest hover:text-white transition-all active:scale-95"
                        >
                            <MessageSquare className="w-3 h-3" />
                            YANITLA
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTEXT MENU */}
            <AnimatePresence>
                {showContextMenu && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowContextMenu(false)}
                            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute left-1/2 -translate-x-1/2 top-4 z-[70] min-w-[160px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl"
                        >
                            <button 
                                onClick={() => {
                                    onEdit(comment);
                                    setShowContextMenu(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                            >
                                <span className="text-[11px] font-bold">DÜZENLE</span>
                                <Edit2 className="w-3.5 h-3.5 text-white/40" />
                            </button>
                            <button 
                                onClick={() => {
                                    onDelete(comment.id);
                                    setShowContextMenu(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                                <span className="text-[11px] font-bold">SİL</span>
                                <Trash2 className="w-3.5 h-3.5 opacity-60" />
                            </button>
                            <div className="h-px bg-white/5 my-1 mx-2" />
                            <button 
                                onClick={() => {
                                    onReport(comment.id);
                                    setShowContextMenu(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/60 transition-colors"
                            >
                                <span className="text-[11px] font-bold">ŞİKAYET ET</span>
                                <ShieldAlert className="w-3.5 h-3.5 opacity-40" />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* NESTED REPLIES */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 flex flex-col gap-3 mt-1 pl-4 border-l border-white/5 relative">
                    {!showReplies ? (
                        <button
                            onClick={() => setShowReplies(true)}
                            className="flex items-center gap-2 text-[10px] font-black text-cyan-400/80 hover:text-cyan-400 transition-colors py-1 group"
                        >
                            <div className="w-5 h-px bg-white/10 group-hover:bg-cyan-400/30" />
                            {comment.replies.length} YANITA BAK
                        </button>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {comment.replies.map((reply: any) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    onLike={onLike}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReport={onReport}
                                    filterContent={filterContent}
                                    isReply={true}
                                />
                            ))}
                            <button
                                onClick={() => setShowReplies(false)}
                                className="flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white transition-colors py-1"
                            >
                                <div className="w-5 h-px bg-white/10" />
                                YANITLARI GİZLE
                            </button>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
