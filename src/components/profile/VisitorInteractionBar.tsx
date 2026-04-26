'use client';

import React, { useState, useEffect } from "react";
import { 
    MessageCircle, Heart, Share2, Sparkles, 
    Gift, Zap, UserPlus, Check, Loader2, QrCode,
    MoreHorizontal, ShieldAlert, Ban, Instagram, Youtube,
    Link2, Copy, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/services/apiService";

import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/utils";

interface VisitorInteractionBarProps {
    profile: any;
}

export function VisitorInteractionBar({ profile }: VisitorInteractionBarProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const isGuest = !user || user.id === 'user-moffi-official';

    const triggerAuth = (message: string) => {
        showToast("Giriş Gerekli", message, "Zap");
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    };

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!profile?.id || isGuest) return;
            try {
                const status = await apiService.isFollowing(profile.id);
                setIsFollowing(status);
            } catch (err) {
                console.error("Follow Status Check Error:", err);
            }
        };
        checkFollowStatus();
    }, [profile?.id, isGuest]);

    useEffect(() => {
        const handleExternalFollow = (e: any) => {
            if (e.detail.userId === profile?.id) {
                setIsFollowing(e.detail.isFollowing);
            }
        };
        const handleToggleNav = (e: any) => {
            setIsVisible(e.detail);
        };

        window.addEventListener('moffi-follow-change', handleExternalFollow);
        window.addEventListener('moffi-toggle-nav', handleToggleNav);
        return () => {
            window.removeEventListener('moffi-follow-change', handleExternalFollow);
            window.removeEventListener('moffi-toggle-nav', handleToggleNav);
        };
    }, [profile?.id]);

    const handleFollow = async () => {
        if (!profile?.id) return;
        if (isGuest) {
            triggerAuth("Takip etmek için kendi hesabınızı oluşturun!");
            return;
        }
        setIsLoading(true);
        try {
            const newState = !isFollowing;
            if (isFollowing) {
                await apiService.unfollowUser(profile.id);
            } else {
                await apiService.followUser(profile.id);
            }
            setIsFollowing(newState);
            
            // Global Sync
            window.dispatchEvent(new CustomEvent('moffi-follow-change', { 
                detail: { userId: profile.id, isFollowing: newState } 
            }));
        } catch (err) {
            console.error("Follow Action Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-48px)] max-w-lg pointer-events-none">
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 120, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-background/80 backdrop-blur-3xl border border-card-border rounded-[3rem] p-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative group pointer-events-auto"
                    >
                        {/* Glow Background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

                        {/* Left: Quick Actions */}
                        <div className="flex items-center gap-1.5 pl-1 relative z-10">
                            <button 
                                onClick={() => isGuest ? triggerAuth("Hediye göndermek için giriş yapmalısınız!") : alert("🎁 Hediye Mağazası (Moffi Store) yakında!")}
                                className="w-11 h-11 bg-foreground/5 border border-card-border rounded-full flex items-center justify-center text-foreground active:scale-90 transition-all hover:bg-accent/10 hover:text-accent"
                            >
                                <Gift className="w-5 h-5 text-orange-400" />
                            </button>
                            <button 
                                onClick={() => isGuest ? triggerAuth("Mesaj göndermek için giriş yapmalısınız!") : alert(`💬 Mesaj gönder: ${profile.username}`)}
                                className="w-11 h-11 bg-foreground/5 border border-card-border rounded-full flex items-center justify-center text-foreground active:scale-90 transition-all hover:bg-cyan-500/10 hover:text-cyan-500"
                            >
                                <MessageCircle className="w-5 h-5 text-cyan-400" />
                            </button>
                            <button 
                                onClick={() => isGuest ? triggerAuth("Davet göndermek için giriş yapmalısınız!") : alert(`⚡ Yürüyüş Daveti İletildi!`)}
                                className="w-11 h-11 bg-foreground/5 border border-card-border rounded-full flex items-center justify-center text-foreground active:scale-90 transition-all hover:bg-purple-500/10 hover:text-purple-500"
                            >
                                <Zap className="w-5 h-5 text-purple-400" />
                            </button>
                        </div>

                        {/* Right: Main Follow/Join Action */}
                        <button
                            onClick={handleFollow}
                            disabled={isLoading}
                            className={cn(
                                "relative flex-1 ml-4 h-12 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center justify-center gap-3 active:scale-[0.98]",
                                isFollowing 
                                    ? "bg-foreground/5 text-secondary border border-card-border" 
                                    : "bg-foreground text-background shadow-[0_10px_30px_rgba(var(--foreground-rgb),0.2)]"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {isFollowing ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span>TAKİPTESİN</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>TAKİP ET</span>
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
