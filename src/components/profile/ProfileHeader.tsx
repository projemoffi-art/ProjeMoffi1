"use client";

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
        // MOCK: Simulate network lag and toggle state
        setTimeout(() => {
            setIsJoined(!isJoined);
            setLoading(false);
        }, 300);
    };

    return (
        <div className="w-full relative">
            {/* 1. Cover Photo */}
            <div className="relative h-48 sm:h-64 w-full overflow-hidden">
                <img
                    src={user.cover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                
                {user.isOwnProfile && (
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                        className="absolute top-4 right-4 p-2 bg-background/40 backdrop-blur-md rounded-full border border-card-border text-foreground hover:bg-foreground/20 transition-all active:scale-95"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Identity Info Overlap */}
            <div className="px-6 relative -mt-16 mb-6 z-10">
                <div className="flex justify-between items-end mb-4">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background relative bg-card overflow-hidden shadow-2xl">
                        <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                            <Sparkles className="w-3 h-3 text-background" />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                        {user.isOwnProfile ? (
                            <>
                                <button 
                                    onClick={() => {
                                        console.log("ProfileHeader: Dispatching open-moffi-hub event...");
                                        window.dispatchEvent(new CustomEvent('open-moffi-hub'));
                                    }}
                                    className="p-3 bg-foreground/5 border border-card-border rounded-full text-foreground hover:bg-accent/20 hover:border-accent/50 transition-all group"
                                    title="Eylem Merkezi"
                                >
                                    <Zap className="w-4 h-4 text-foreground group-hover:text-accent fill-current opacity-70 group-hover:opacity-100" />
                                </button>
                                <button onClick={onEdit} className="px-6 py-2 rounded-full border border-card-border font-bold text-xs bg-foreground/5 hover:bg-foreground/10 transition-colors flex items-center gap-2 text-foreground">
                                    <Edit3 className="w-4 h-4" /> Düzenle
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleJoinPack} className={cn("px-6 py-2 rounded-full font-bold text-xs transition-all", isJoined ? "bg-foreground/10 text-foreground" : "bg-foreground text-background")}>
                                    {isJoined ? "Takiptesin" : "Takibe Al"}
                                </button>
                                <button onClick={onMessage} className="p-3 bg-foreground/5 border border-card-border rounded-full text-foreground"><MessageCircle className="w-4 h-4" /></button>
                            </>
                        )}
                        <button onClick={() => setIsActionSheetOpen(true)} className="p-3 bg-foreground/5 border border-card-border rounded-full text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                        {user.username}
                        {user.is_premium && <ShieldCheck className="w-5 h-5 text-accent" />}
                    </h1>
                    <p className="text-accent font-medium text-sm">@{user.username.toLowerCase().replace(/\s+/g, '')}</p>
                    <p className="text-secondary text-sm mt-3 leading-relaxed max-w-xl">{user.bio || "Yeni Moffi üyesi ✨"}</p>
                </div>

                {/* 3. Horizontal Local Stats Bar (Classical) */}
                <div className="flex gap-8 mt-6 border-y border-card-border py-4">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-foreground leading-none">{stats.posts}</span>
                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1.5">Gönderi</span>
                    </div>
                    <div className="flex flex-col border-l border-card-border pl-8">
                        <span className="text-xl font-bold text-foreground leading-none">{stats.pack.toLocaleString()}</span>
                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1.5">Takipçi</span>
                    </div>
                    <div className="flex flex-col border-l border-card-border pl-8">
                        <span className="text-xl font-bold text-foreground leading-none">{stats.following}</span>
                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1.5">Takip</span>
                    </div>
                </div>
            </div>

            {/* Action Sheet Modals */}
            <AnimatePresence>
                {isActionSheetOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsActionSheetOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[5000]" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 inset-x-0 z-[5001] bg-background border-t border-card-border rounded-t-[3.5rem] p-8">
                            <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-10" />
                            <div className="max-w-md mx-auto space-y-4 pb-10">
                                <button className="w-full flex items-center gap-5 p-5 hover:bg-foreground/5 rounded-3xl group">
                                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform"><QrCode className="w-6 h-6" /></div>
                                    <div className="text-left font-black uppercase text-foreground"><p className="text-sm">QR Kimliğim</p><p className="text-[10px] text-secondary">Digital ID</p></div>
                                </button>
                                <button onClick={() => setIsActionSheetOpen(false)} className="w-full py-6 mt-8 bg-foreground text-background rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em]">Kapat</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
