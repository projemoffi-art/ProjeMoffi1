"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, MessageCircle, Share2, MapPin,
    PawPrint, ShieldCheck, Users, Grid,
    Camera, Settings, Edit3, HeartPulse, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface ProfileHeaderProps {
    user: {
        username: string;
        fullName: string;
        avatar: string;
        cover: string;
        bio: string;
        location: string;
        stats: {
            pack: number;
            following: number;
            posts: number;
        };
        isOwnProfile?: boolean;
    };
    isFollowingInitial?: boolean;
    userId?: string;
    onMessage?: () => void;
}

export default function ProfileHeader({ user, isFollowingInitial = false, userId, onMessage }: ProfileHeaderProps) {
    const { user: currentUser } = useAuth();
    const [isJoined, setIsJoined] = useState(isFollowingInitial);
    const [loading, setLoading] = useState(false);
    const [patiSent, setPatiSent] = useState(false);
    const [stats, setStats] = useState(user.stats);

    // Sync state with props
    useEffect(() => {
        setIsJoined(isFollowingInitial);
    }, [isFollowingInitial]);

    const handleJoinPack = async () => {
        if (!currentUser || !userId) return;
        setLoading(true);

        try {
            if (isJoined) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', userId);

                if (!error) {
                    setIsJoined(false);
                    setStats(prev => ({ ...prev, pack: prev.pack - 1 }));
                }
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: currentUser.id,
                        following_id: userId
                    });

                if (!error) {
                    setIsJoined(true);
                    setStats(prev => ({ ...prev, pack: prev.pack + 1 }));
                }
            }
        } catch (err) {
            console.error("Join pack error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBark = () => {
        if (onMessage) {
            onMessage();
        } else {
            alert("Bark Box (Mesajlaşma) yakında aktif olacak! 🐾");
        }
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto bg-[#0A0A0E] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">

            {/* 1. Cover Area (Apple Glass Style) */}
            <div className="relative h-64 sm:h-80 w-full group overflow-hidden">
                <img
                    src={user.cover}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-transparent to-black/20" />

                {user.isOwnProfile && (
                    <button className="absolute bottom-6 right-6 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60">
                        <Camera className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Identity Content */}
            <div className="px-8 pb-10 -mt-20 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 text-center sm:text-left">
                        <div className="relative group mx-auto sm:mx-0">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-2xl">
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-full h-full object-cover rounded-[2.2rem] border-4 border-[#0A0A0E]"
                                />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-[#0A0A0E] rounded-full shadow-lg" />
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                <h1 className="text-3xl font-black text-white tracking-tighter">{user.username}</h1>
                                <ShieldCheck className="w-5 h-5 text-indigo-400 fill-indigo-400/10" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm mb-3 hidden sm:block">{user.fullName}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {user.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center sm:justify-end gap-3">
                        {user.isOwnProfile ? (
                            <button className="flex-1 sm:flex-none px-8 py-3.5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2">
                                <Edit3 className="w-4 h-4" /> Düzenle
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleJoinPack}
                                    disabled={loading || !currentUser}
                                    className={cn(
                                        "flex-1 sm:flex-none px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 min-w-[140px] justify-center",
                                        isJoined
                                            ? "bg-white/5 text-white border border-white/10"
                                            : "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-500",
                                        loading && "opacity-50 cursor-wait",
                                        !currentUser && "opacity-30 cursor-not-allowed"
                                    )}
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4" />
                                            {isJoined ? "Sürüdesin" : "Sürüye Katıl"}
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setPatiSent(true);
                                        setTimeout(() => setPatiSent(false), 1000);
                                    }}
                                    className="p-3.5 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all active:scale-95 relative group"
                                >
                                    <AnimatePresence>
                                        {patiSent && (
                                            <motion.div
                                                initial={{ y: 0, opacity: 1, scale: 1 }}
                                                animate={{ y: -50, opacity: 0, scale: 1.5 }}
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                            >
                                                <PawPrint className="w-6 h-6 text-indigo-400" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <PawPrint className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </button>

                                <button
                                    onClick={handleBark}
                                    className="p-3.5 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                    title="Bark Box (Mesaj Gönder)"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button className="p-3.5 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 3. Stats & Bio (ID Tag) */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Bio & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Künye (Moffi ID)</h3>
                            <p className="text-gray-300 font-medium leading-relaxed">
                                {user.bio}
                            </p>

                            <div className="flex flex-wrap gap-3 mt-6">
                                {['Aktif', 'Dost Canlısı', 'Eğitimli'].map((tag) => (
                                    <span key={tag} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 w-full">
                        {[
                            { label: 'Sürü Üyesi', value: stats.pack, icon: Users },
                            { label: 'Takip Ettiği', value: stats.following, icon: HeartPulse },
                            { label: 'Paylaşım', value: stats.posts, icon: Grid }
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/5 border border-white/5 p-4 rounded-2xl group hover:bg-white/10 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                    <stat.icon className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-lg font-black text-white">{stat.value}</span>
                                </div>
                                <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
