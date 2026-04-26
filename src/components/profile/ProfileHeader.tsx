'use client';

import React, { useState } from "react";
import { 
    Camera, MapPin, Edit3, Plus, Share2, 
    MoreHorizontal, Check, Loader2, MessageCircle, 
    ShieldCheck, PawPrint, X, QrCode, Wallet, Settings,
    Gift, EyeOff, Ban, ShieldAlert, Zap, Crown, Sparkles,
    Users, HeartPulse, Grid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ModerationService } from "@/services/ai/ModerationService";

interface ProfileHeaderProps {
    user: {
        username: string;
        fullName: string;
        avatar: string;
        cover: string;
        bio: string;
        location: string;
        is_premium?: boolean;
        stats: {
            pack: number;
            following: number;
            posts: number;
        };
        isOwnProfile: boolean;
    };
    isFollowingInitial: boolean;
    userId: string;
    onMessage: () => void;
    onEdit: () => void;
}

export default function ProfileHeader({ user, isFollowingInitial, userId, onMessage, onEdit }: ProfileHeaderProps) {
    const stats = user.stats;
    const [isJoined, setIsJoined] = useState(isFollowingInitial);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

    const handleJoinPack = async () => {
        if (!currentUser) return;
        setLoading(true);
        setTimeout(() => {
            const newState = !isJoined;
            setIsJoined(newState);
            setLoading(false);
            window.dispatchEvent(new CustomEvent('moffi-follow-change', { 
                detail: { userId, isFollowing: newState } 
            }));
        }, 300);
    };

    React.useEffect(() => {
        const handleExternalFollow = (e: any) => {
            if (e.detail.userId === userId) {
                setIsJoined(e.detail.isFollowing);
            }
        };
        window.addEventListener('moffi-follow-change', handleExternalFollow);
        return () => window.removeEventListener('moffi-follow-change', handleExternalFollow);
    }, [userId]);

    return (
        <div className="w-full relative">
            {/* 1. Cover Photo - Enhanced Mobile Aspect Ratio */}
            <div className="relative h-56 sm:h-72 w-full overflow-hidden">
                <img
                    src={user.cover}
                    alt="Cover"
                    className="w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
                
                {user.isOwnProfile && (
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                        className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Identity Info Overlap - Refined Mobile Spacing */}
            <div className="px-6 relative -mt-20 mb-8 z-10">
                <div className="flex justify-between items-end mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] border-[6px] border-background relative bg-card overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
                        <div className="absolute bottom-2 right-2 w-8 h-8 bg-accent rounded-xl flex items-center justify-center border-4 border-background shadow-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    
                    <div className="flex gap-2.5 pb-2">
                        {user.isOwnProfile ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
                                    className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl text-accent flex items-center justify-center active:scale-90 transition-all"
                                    title="Eylem Merkezi"
                                >
                                    <Zap className="w-5 h-5 fill-current" />
                                </button>
                                <button 
                                    onClick={onEdit} 
                                    className="px-6 h-12 rounded-2xl border border-card-border font-black text-[10px] uppercase tracking-widest bg-foreground/5 hover:bg-foreground/10 transition-all flex items-center gap-2 text-foreground active:scale-95"
                                >
                                    <Edit3 className="w-4 h-4" /> Düzenle
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                {/* Visitor actions handled by Interaction Bar */}
                            </div>
                        )}
                        <button 
                            onClick={() => setIsActionSheetOpen(true)} 
                            className="w-12 h-12 bg-foreground/5 border border-card-border rounded-2xl text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center active:scale-90"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black text-foreground italic tracking-tighter uppercase leading-none">
                            {user.username}
                        </h1>
                        {user.is_premium && (
                            <div className="bg-gradient-to-r from-orange-400 to-yellow-500 p-0.5 rounded-lg shadow-lg shadow-orange-500/20">
                                <ShieldCheck className="w-5 h-5 text-black" />
                            </div>
                        )}
                    </div>
                    <p className="text-accent font-bold text-xs tracking-[0.2em] uppercase opacity-80">@{user.username.toLowerCase().replace(/\s+/g, '')}</p>
                    <p className="text-secondary text-sm mt-4 leading-relaxed max-w-xl font-medium">{user.bio || "Moffi Evreninde bir kaşif ✨"}</p>
                </div>

                {/* STATS STRIP */}
                <div className="flex justify-between sm:justify-start sm:gap-16 mt-8 border-y border-card-border py-6 px-4 sm:px-0">
                    <div className="flex flex-col items-center sm:items-start group cursor-pointer">
                        <span className="text-2xl font-black text-foreground leading-none tracking-tighter group-hover:text-accent transition-colors">{stats.posts}</span>
                        <span className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mt-2 opacity-50">Gönderi</span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start sm:border-l sm:border-card-border sm:pl-16 group cursor-pointer">
                        <span className="text-2xl font-black text-foreground leading-none tracking-tighter group-hover:text-accent transition-colors">{stats.pack.toLocaleString()}</span>
                        <span className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mt-2 opacity-50">Takipçi</span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start sm:border-l sm:border-card-border sm:pl-16 group cursor-pointer">
                        <span className="text-2xl font-black text-foreground leading-none tracking-tighter group-hover:text-accent transition-colors">{stats.following}</span>
                        <span className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mt-2 opacity-50">Takip</span>
                    </div>
                </div>
            </div>

            {/* Action Sheet Modals - Premium Bottom Sheet */}
            <AnimatePresence>
                {isActionSheetOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsActionSheetOpen(false)} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000]" 
                        />
                        <motion.div 
                            initial={{ y: "100%" }} 
                            animate={{ y: 0 }} 
                            exit={{ y: "100%" }} 
                            transition={{ type: "spring", damping: 30, stiffness: 300 }} 
                            className="fixed bottom-0 inset-x-0 z-[5001] bg-background border-t border-card-border rounded-t-[3.5rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-safe"
                        >
                            <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-10" />
                            
                            <div className="max-w-md mx-auto space-y-6 pb-6">
                                {user.isOwnProfile ? (
                                    <div className="space-y-4">
                                        <button className="w-full flex items-center gap-5 p-5 bg-foreground/5 hover:bg-accent/10 border border-card-border rounded-[2rem] group transition-all">
                                            <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                                <QrCode className="w-7 h-7" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black uppercase text-foreground tracking-tighter">QR Kimliğim</p>
                                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">Moffi Digital ID</p>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => { setIsActionSheetOpen(false); window.dispatchEvent(new CustomEvent('open-moffi-settings')); }}
                                            className="w-full flex items-center gap-5 p-5 bg-foreground/5 hover:bg-foreground/10 border border-card-border rounded-[2rem] group transition-all"
                                        >
                                            <div className="w-14 h-14 bg-foreground/10 rounded-2xl flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                                                <Settings className="w-7 h-7" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black uppercase text-foreground tracking-tighter">Profil Ayarları</p>
                                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">Hesap ve Gizlilik</p>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert("Profil linki kopyalandı! 🚀");
                                                setIsActionSheetOpen(false);
                                            }}
                                            className="w-full flex items-center gap-5 p-6 bg-foreground/5 hover:bg-foreground/10 border border-card-border rounded-[2.2rem] group transition-all"
                                        >
                                            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 group-hover:rotate-12 transition-transform"><Share2 className="w-6 h-6" /></div>
                                            <div className="text-left font-black uppercase text-foreground">
                                                <p className="text-sm tracking-tighter">Profili Paylaş</p>
                                                <p className="text-[9px] text-secondary tracking-widest mt-0.5">Bağlantıyı Kopyala</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => alert("Moffi Üyeliği: 15 Haziran 2025 ✨")}
                                            className="w-full flex items-center gap-5 p-6 bg-foreground/5 hover:bg-foreground/10 border border-card-border rounded-[2.2rem] group transition-all"
                                        >
                                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
                                            <div className="text-left font-black uppercase text-foreground">
                                                <p className="text-sm tracking-tighter">Hesap Bilgisi</p>
                                                <p className="text-[9px] text-secondary tracking-widest mt-0.5">Üyelik Detayı</p>
                                            </div>
                                        </button>

                                        <div className="h-px bg-card-border mx-6 my-2 opacity-50" />
                                        
                                        <button 
                                            onClick={async () => { 
                                                if (confirm("Bu kullanıcıyı engellemek istediğinizden emin misiniz?")) {
                                                    await ModerationService.reportItem({
                                                        type: 'user',
                                                        targetId: userId,
                                                        reason: "BLOCK_ACTION: User blocked by visitor",
                                                        reporterId: currentUser?.id || 'anonymous'
                                                    });
                                                    alert("Kullanıcı engellendi.");
                                                    setIsActionSheetOpen(false); 
                                                }
                                            }}
                                            className="w-full flex items-center gap-5 p-6 hover:bg-red-500/5 rounded-[2.2rem] group transition-all text-red-500"
                                        >
                                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center"><Ban className="w-6 h-6" /></div>
                                            <span className="font-black uppercase text-[10px] tracking-[0.2em]">Engelle</span>
                                        </button>
                                        
                                        <button 
                                            onClick={async () => { 
                                                const reason = prompt("Lütfen şikayet nedeninizi belirtin:");
                                                if (!reason) return;
                                                const res = await ModerationService.reportItem({
                                                    type: 'user',
                                                    targetId: userId,
                                                    reason: reason,
                                                    reporterId: currentUser?.id || 'anonymous'
                                                });
                                                if (res.success) alert("Şikayetiniz incelenmek üzere alındı.");
                                                setIsActionSheetOpen(false); 
                                            }}
                                            className="w-full flex items-center gap-5 p-6 hover:bg-amber-500/5 rounded-[2.2rem] group transition-all text-amber-500"
                                        >
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center"><ShieldAlert className="w-6 h-6" /></div>
                                            <span className="font-black uppercase text-[10px] tracking-[0.2em]">Şikayet Et</span>
                                        </button>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setIsActionSheetOpen(false)} 
                                    className="w-full py-6 mt-8 bg-foreground text-background rounded-full font-black text-xs uppercase tracking-[0.4em] active:scale-95 transition-all"
                                >
                                    Kapat
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
