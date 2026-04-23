"use client";

import React from "react";
import { 
    ShieldCheck, Sparkles, MapPin, Zap, Crown, 
    Share2, MoreHorizontal, Settings, Edit3, Users,
    MessageCircle, UserPlus, Slash, Flag, VolumeX, Info, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { apiService } from "@/services/apiService";
import { useRouter } from "next/navigation";

interface AuraProfileHeaderProps {
    profile: any;
    isOwnProfile: boolean;
}

export function AuraProfileHeader({ profile, isOwnProfile }: AuraProfileHeaderProps) {
    const [isMoreOpen, setIsMoreOpen] = React.useState(false);
    const [isBusy, setIsBusy] = React.useState(false);
    const router = useRouter();
    const aura = profile.aura_settings;
    const { scrollY } = useScroll();
    
    // Parallax & Cinematic Transforms
    const coverScale = useTransform(scrollY, [0, 500], [1, 1.2]);
    const coverBlur = useTransform(scrollY, [0, 300], [0, 10]);
    const identityY = useTransform(scrollY, [0, 300], [0, -40]);

    // Theme Mapping
    const themeStyles = {
        glass: "bg-white/5 border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(255,255,255,0.05)]",
        cyber: "bg-black/40 border-cyan-500/30 backdrop-blur-3xl shadow-[0_0_40px_rgba(6,182,212,0.15)] shadow-cyan-500/5",
        metal: "bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-600/30 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]",
        minimal: "bg-white/[0.02] border-white/5 backdrop-blur-2xl"
    };

    const currentTheme = themeStyles[aura.frameStyle as keyof typeof themeStyles] || themeStyles.minimal;

    return (
        <div className="w-full relative">
            {/* 1. CINEMATIC COVER WITH PARALLAX */}
            <div className="relative h-[450px] w-full overflow-hidden sm:rounded-b-[4rem]">
                <motion.img
                    style={{ scale: coverScale, filter: `blur(${coverBlur}px)` }}
                    src={profile.cover_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                
                {/* Dynamic Aura Gradient Overlay */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/40 to-transparent",
                    aura.accentColor === 'cyan' ? "opacity-40" : "opacity-20"
                )} />
                
                {/* Ambient Glow */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-gradient-to-t from-cyan-500/20 to-transparent blur-3xl opacity-30" />
            </div>

            {/* 2. IDENTITY CARD OVERLAP */}
            <motion.div 
                style={{ y: identityY }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 relative -mt-52 z-20"
            >
                <div className={cn(
                    "p-8 sm:p-12 rounded-[3.5rem] border relative overflow-hidden group",
                    currentTheme
                )}>
                    {/* Theme-Specific Decorative Elements */}
                    {aura.frameStyle === 'cyber' && (
                        <div className="absolute top-0 right-10 w-24 h-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                    )}

                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 mb-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
                            {/* Avatar with Status Ring */}
                            <div className="relative group/avatar">
                                <div className={cn(
                                    "w-40 h-40 sm:w-48 sm:h-48 rounded-[3.5rem] p-1.5 border-4 relative z-10 transition-transform duration-700 group-hover/avatar:rotate-3",
                                    aura.accentColor === 'cyan' ? "border-cyan-500/30" : (aura.accentColor === 'purple' ? "border-purple-500/30" : "border-orange-500/30")
                                )}>
                                    <img src={profile.avatar_url} className="w-full h-full object-cover rounded-[3rem]" alt={profile.username} />
                                </div>
                                
                                {/* Pro/Ecosystem Badge (Sistem organlarıyla bağlantılı: Sadece Premiumlarda açık) */}
                                {profile.is_premium && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#0A0A0E] border-2 border-cyan-500 rounded-full flex items-center gap-2 shadow-[0_10px_30px_rgba(6,182,212,0.4)] z-20">
                                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">DOĞRULANMIŞ HESAP</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center sm:text-left">
                                <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none flex items-center justify-center sm:justify-start gap-4">
                                    {profile.username}
                                    {profile.is_premium && <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />}
                                </h1>
                                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                                    <span className="text-cyan-400 font-black uppercase tracking-[0.2em] text-xs">@{profile.username.toLowerCase()}</span>
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <MapPin className="w-3 h-3" />
                                        Moffi Universe #12
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons (For Owner or Visitor) */}
                        <div className="flex gap-4">
                            {isOwnProfile ? (
                                <>
                                    <button 
                                        onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
                                        className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.8rem] flex items-center justify-center text-white hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                                    >
                                        <Zap className="w-6 h-6 text-white group-hover:text-emerald-400 fill-current opacity-70 group-hover:opacity-100" />
                                    </button>
                                    <button 
                                        onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                                        className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.8rem] flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95 group hidden sm:flex"
                                    >
                                        <Settings className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                                    </button>
                                    <button className="px-10 py-5 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                        <Edit3 className="w-4 h-4" /> PROFİLİ DÜZENLE
                                    </button>
                                </>
                            ) : null}

                            {/* More Actions Menu Button (Always visible) */}
                            <button 
                                onClick={() => setIsMoreOpen(true)}
                                className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.8rem] flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                            >
                                <MoreHorizontal className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* BIO SECTION */}
                    <div className="max-w-3xl mt-2">
                        <p className="text-gray-400 text-lg leading-relaxed font-medium italic opacity-80 border-l-2 border-white/5 pl-8 italic">
                            "{profile.bio || "Moffi evreninde yeni bir dost, yeni bir hikaye. ✨"}"
                        </p>
                    </div>

                    {/* STATS OVERLAY SECTION */}
                    <div className="flex flex-wrap gap-12 mt-12 pt-10 border-t border-white/5">
                        {[
                            { label: 'Takipçi', value: profile.followers_count || 1200, icon: Users },
                            { label: 'Anılar', value: profile.posts_count || 42, icon: Sparkles },
                            { label: 'Ecosystem Points', value: '15.4K', icon: Crown }
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white leading-none">{stat.value.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1.5">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* 3. MORE ACTIONS SHEET (Apple Style Bottom Sheet) */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        />

                        {/* Action Sheet */}
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[201] px-4 pb-40"
                        >
                            <div className="max-w-xl mx-auto space-y-3">
                                {/* Primary Actions Group */}
                                <div className="bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden">
                                    <button 
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: `${profile.username} Profilini Keşfet`, url: window.location.href });
                                            } else {
                                                alert("Profil bağlantısı panoya kopyalandı! (Simülasyon)");
                                            }
                                        }}
                                        className="w-full px-8 py-5 flex items-center gap-4 text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        <Share2 className="w-5 h-5 text-gray-400" />
                                        <span className="font-semibold text-sm">Profili Paylaş</span>
                                    </button>
                                    <button 
                                        onClick={() => alert(`🔇 ${profile.username} kullanıcısı sessize alındı. Artık keşfet akışında gönderilerini görmeyeceksiniz. (Faz-2)`)}
                                        className="w-full px-8 py-5 flex items-center gap-4 text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        <VolumeX className="w-5 h-5 text-gray-400" />
                                        <span className="font-semibold text-sm">Sessize Al</span>
                                    </button>
                                    <button 
                                        onClick={() => alert(`ℹ️ Bu Hesap Hakkında:\n\nKullanıcı: ${profile.username}\nKayıt Tarihi: 2024\nRozetler: ${profile.is_premium ? 'Premium Onaylı' : 'Standart Kullanıcı'}`)}
                                        className="w-full px-8 py-5 flex items-center gap-4 text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        <Info className="w-5 h-5 text-gray-400" />
                                        <span className="font-semibold text-sm">Bu Hesap Hakkında</span>
                                    </button>
                                    {isOwnProfile && (
                                        <button 
                                            onClick={() => {
                                                setIsMoreOpen(false);
                                                window.dispatchEvent(new CustomEvent('open-moffi-settings'));
                                            }}
                                            className="w-full px-8 py-5 flex items-center gap-4 text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                        >
                                            <Settings className="w-5 h-5 text-gray-400" />
                                            <span className="font-semibold text-sm">Ayarlar ve Kontrol Merkezi</span>
                                        </button>
                                    )}
                                    <button 
                                        disabled={isBusy}
                                        onClick={async () => {
                                            if (window.confirm(`${profile.username} kullanıcısını engellemek istediğinize emin misiniz?`)) {
                                                setIsBusy(true);
                                                try {
                                                    await apiService.blockUser(profile.id);
                                                    router.push('/community');
                                                } catch (err) {
                                                    console.error("Block Error:", err);
                                                    alert("Hata oluştu.");
                                                } finally {
                                                    setIsBusy(false);
                                                }
                                            }
                                        }}
                                        className="w-full px-8 py-5 flex items-center gap-4 text-red-500 hover:bg-red-500/10 transition-colors border-b border-white/5 disabled:opacity-50"
                                    >
                                        <Slash className="w-5 h-5" />
                                        <span className="font-semibold text-sm">Engelle</span>
                                    </button>
                                    <button 
                                        disabled={isBusy}
                                        onClick={async () => {
                                            const reason = window.prompt("Şikayet sebebinizi kısaca belirtiniz:");
                                            if (reason) {
                                                setIsBusy(true);
                                                try {
                                                    await apiService.reportUser(profile.id, reason);
                                                    alert("Şikayetiniz Moffi güvenli ekibine iletildi. Teşekkürler.");
                                                    setIsMoreOpen(false);
                                                } catch (err) {
                                                    console.error("Report Error:", err);
                                                    alert("Hata oluştu.");
                                                } finally {
                                                    setIsBusy(false);
                                                }
                                            }
                                        }}
                                        className="w-full px-8 py-5 flex items-center gap-4 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <Flag className="w-5 h-5" />
                                        <span className="font-semibold text-sm">Şikayet Et</span>
                                    </button>
                                </div>

                                {/* Cancel Button */}
                                <button 
                                    onClick={() => setIsMoreOpen(false)}
                                    className="w-full py-5 bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] text-white font-bold text-sm hover:bg-white/5 transition-all"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
