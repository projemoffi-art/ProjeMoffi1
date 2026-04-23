"use client";

import React, { useState } from "react";
import { 
    MessageCircle, Heart, Share2, Sparkles, 
    Gift, Zap, UserPlus, Check, Loader2, QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/services/apiService";
import { useEffect } from "react";

interface VisitorInteractionBarProps {
    profile: any;
}

export function VisitorInteractionBar({ profile }: VisitorInteractionBarProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!profile?.id) return;
            try {
                const status = await apiService.isFollowing(profile.id);
                setIsFollowing(status);
            } catch (err) {
                console.error("Follow Status Check Error:", err);
            }
        };
        checkFollowStatus();
    }, [profile?.id]);

    const handleFollow = async () => {
        if (!profile?.id) return;
        setIsLoading(true);
        try {
            if (isFollowing) {
                await apiService.unfollowUser(profile.id);
                setIsFollowing(false);
            } else {
                await apiService.followUser(profile.id);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error("Follow Action Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-48px)] max-w-lg pointer-events-none">
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group pointer-events-auto"
            >
                {/* Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

                {/* Left: Quick Actions */}
                <div className="flex items-center gap-2 pl-2 relative z-10">
                    <button 
                        onClick={() => alert("🎁 Hediye Mağazası (Moffi Store) entegrasyonu tamamlandığında buradan dijital pet hediyeleri gönderebileceksiniz. (Faz-2)")}
                        className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10"
                        title="Hediye Gönder"
                    >
                        <Gift className="w-6 h-6 text-amber-400" />
                    </button>
                    <button 
                        onClick={() => alert(`💬 ${profile.username} kullanıcısına mesaj gönder (Direkt Mesajlaşma arka uç eklendiğinde aktif olacak).`)}
                        className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10"
                        title="Mesaj Gönder"
                    >
                        <MessageCircle className="w-6 h-6 text-cyan-400" />
                    </button>
                    <button 
                        onClick={() => alert(`⚡ Yürüyüş Daveti İletildi!\n${profile.username} kullanıcısına yakındaki parkta buluşma isteği gönderildi. (Simülasyon)`)}
                        className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10"
                        title="Yürüyüşe Davet Et"
                    >
                        <Zap className="w-6 h-6 text-purple-400" />
                    </button>
                </div>

                {/* Right: Main Follow/Join Action */}
                <button
                    onClick={handleFollow}
                    disabled={isLoading}
                    className={cn(
                        "relative flex-1 ml-6 h-14 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center justify-center gap-3 active:scale-95",
                        isFollowing 
                            ? "bg-white/10 text-white border border-white/10" 
                            : "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
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
            
            {/* Context Helper Text */}
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em] mt-4"
            >
                {profile.username} Profilini Takip Edin
            </motion.p>
        </div>
    );
}
