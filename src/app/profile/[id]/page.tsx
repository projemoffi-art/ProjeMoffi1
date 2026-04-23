"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, AlertCircle, Plus, Sparkles, ShieldCheck, Zap, Crown, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// Components
import { AuraProfileHeader } from "@/components/profile/AuraProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { VisitorInteractionBar } from "@/components/profile/VisitorInteractionBar";

// MOCK Data & Types
import { MOCK_PROFILES, MOCK_PETS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollY } = useScroll();
  
  // Parallax background transform
  const bgOpacity = useTransform(scrollY, [0, 300], [0.4, 0.1]);
  const bgScale = useTransform(scrollY, [0, 500], [1, 1.2]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Durum: Mock Profil Ziyareti (user-bella, user-milo vb.)
        let foundProfile = MOCK_PROFILES.find(p => p.id === id);
        
        // 2. Durum: Kullanıcının Kendi Profilini Ziyareti (UUID)
        if (!foundProfile && currentUser?.id === id) {
            foundProfile = {
                id: currentUser.id,
                username: currentUser.username,
                avatar_url: currentUser.avatar,
                cover_url: currentUser.cover_photo,
                bio: currentUser.bio,
                posts_count: 0,
                followers_count: 0,
                following_count: 0,
                aura_settings: {
                    frameStyle: 'glass',
                    accentColor: 'cyan',
                    fontFamily: 'font-sans'
                },
                settings: {
                    privacy: {
                        showPets: true,
                        showPassport: true
                    }
                }
            };
        }

        // Eğer hala bulunamadıysa (ve kendi ID'si değilse), hata fırlat veya null bırak
        if (!foundProfile) {
            setError("Profil bulunamadı.");
            setLoading(false);
            return;
        }
        
        const auraSettings = foundProfile.aura_settings || {
            frameStyle: 'glass',
            accentColor: 'cyan',
            fontFamily: 'font-sans'
        };

        setProfile({
            ...foundProfile,
            aura_settings: auraSettings,
            is_premium: foundProfile.id === 'user-bella'
        });

      } catch (err) {
        setError("Profil verisi yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full animate-pulse" />
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/5 border-t-cyan-400 rounded-full mb-6" 
        />
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] animate-pulse">Profil Yükleniyor...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-[3rem] flex items-center justify-center mb-8 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Erişim Engellendi</h2>
        <p className="text-gray-500 text-sm mb-10 max-w-xs">{error || "Bu profil Moffi Universe içerisinde henüz tanımlanmamış."}</p>
        <button 
          onClick={() => router.push('/community')}
          className="px-12 py-5 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
        >
          Topluluğa Dön
        </button>
      </main>
    );
  }

  const aura = profile.aura_settings;
  const isOwnProfile = currentUser?.id === id;

  return (
    <main 
        className={cn(
            "min-h-screen bg-[#05050A] relative overflow-x-hidden",
            aura.fontFamily
        )}
    >
      {/* 1. CINEMATIC BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div 
              style={{ scale: bgScale, opacity: bgOpacity }}
              className={cn(
                  "absolute -top-20 -right-20 w-[600px] h-[600px] blur-[140px] rounded-full",
                  aura.accentColor === 'cyan' ? "bg-cyan-500" : (aura.accentColor === 'purple' ? "bg-purple-500" : "bg-orange-500")
              )} 
          />
          <motion.div 
              style={{ scale: bgScale, opacity: bgOpacity }}
              className="absolute bottom-40 -left-20 w-[500px] h-[500px] bg-indigo-500 blur-[120px] rounded-full opacity-[0.15]" 
          />
      </div>

      {/* 2. STICKY ACTION HEADER (Minimal) */}
      <div className="sticky top-0 z-[100] px-6 py-4 flex items-center justify-between pointer-events-none">
          <button 
            onClick={() => router.back()} 
            className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white pointer-events-auto active:scale-90 transition-all"
          >
              <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] text-white pointer-events-auto">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Moffi <span className="text-cyan-400">Profile</span></span>
          </div>

          <button className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white pointer-events-auto active:scale-90 transition-all opacity-0">
              <Plus className="w-5 h-5" />
          </button>
      </div>

      {/* 3. AURA PROFILE CONTENT */}
      <div className="relative z-10 w-full max-w-7xl mx-auto pb-40">
        
        {/* HERO HEADER */}
        <section className="px-0 sm:px-6">
          <AuraProfileHeader 
            profile={profile}
            isOwnProfile={isOwnProfile}
          />
        </section>

        {/* 4. MEET THE PACK (Respects Privacy) */}
        {(isOwnProfile || profile.settings?.privacy?.showPets) && (
          <section className="px-6 mt-12 mb-16">
              <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex flex-col">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">PATİLER</h3>
                  </div>
                  <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                      <Plus className="w-6 h-6" />
                  </button>
              </div>
              
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 px-2 snap-x">
                  {MOCK_PETS.filter(p => p.owner_id === id).map((pet, idx) => (
                      <motion.div 
                          initial={{ opacity: 0, y: 30, rotate: idx % 2 === 0 ? -2 : 2 }}
                          animate={{ opacity: 1, y: 0, rotate: idx % 2 === 0 ? -1 : 1 }}
                          transition={{ delay: 0.2 + (idx * 0.1) }}
                          whileHover={{ y: -10, rotate: 0, scale: 1.02 }}
                          key={pet.id}
                          className="min-w-[280px] snap-center bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 flex flex-col items-center gap-6 relative overflow-hidden backdrop-blur-3xl group shadow-2xl"
                      >
                          {/* Glow Effect */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                          
                          <div className="w-32 h-32 rounded-full border-4 border-white/10 p-1.5 bg-black/40 relative z-10 shadow-emerald-500/20 shadow-2xl">
                              <img src={pet.avatar} className="w-full h-full object-cover rounded-full" alt={pet.name} />
                              <div className="absolute bottom-1 right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0F0F15] flex items-center justify-center shadow-lg">
                                  <Sparkles className="w-3 h-3 text-white" />
                              </div>
                          </div>
  
                          <div className="text-center relative z-10">
                              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{pet.name}</h4>
                              <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] leading-none mb-4">{pet.breed}</p>
                              
                              <div className="flex justify-center gap-2 mt-4">
                                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest">Level 24</span>
                                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">Aktif</span>
                              </div>
                          </div>
  
                          <button className="w-full py-4 mt-2 bg-white/5 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 duration-300">
                                YÖNET
                          </button>
                      </motion.div>
                  ))}
              </div>
          </section>
        )}

        {/* 5. ECOSYSTEM STATS (Bento Grid) */}
        <section className="px-6 mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Ecosystem Impact', value: 'Silver', icon: ShieldCheck, color: 'text-cyan-400' },
                    { label: 'SOS Karma', value: '450', icon: Zap, color: 'text-orange-400' },
                    { label: 'Moffi Streak', value: '14 Gün', icon: Sparkles, color: 'text-amber-400' },
                    { label: 'Moffi Rank', value: '#128', icon: Crown, color: 'text-purple-400' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        key={i} 
                        className="p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-3xl flex flex-col items-center text-center gap-3"
                    >
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                        <div>
                            <p className="text-lg font-black text-white tracking-tight uppercase italic leading-none">{stat.value}</p>
                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-2">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* 6. CONTENT TABS */}
        <section className="px-4">
            <ProfileTabs 
                userId={id} 
                isOwnProfile={isOwnProfile} 
                themeColor={aura.accentColor}
                profileSettings={profile.settings}
            />
        </section>
      </div>

      {/* 7. VISITOR INTERACTION BAR (Sticky Bottom) */}
      {!isOwnProfile && (
          <VisitorInteractionBar 
            profile={profile}
          />
      )}
    </main>
  );
}
