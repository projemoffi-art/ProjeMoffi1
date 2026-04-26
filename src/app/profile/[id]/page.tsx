"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Components
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { VisitorInteractionBar } from "@/components/profile/VisitorInteractionBar";
import { ProfileTab } from "@/components/community/ProfileTab";
import { EditProfileModal } from "@/components/community/modals/EditProfileModal";
import { AddPetModal } from "@/components/community/modals/AddPetModal";

// MOCK Data & Types
import { MOCK_PROFILES, MOCK_PETS, MOCK_POSTS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import { showToast } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser && id === currentUser.id;
  
  // Scroll to hide logic
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const current = window.scrollY;
          if (current > 100 && current > lastScrollY + 5) {
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
          } else if (current < lastScrollY - 10 || current < 50) {
            window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
          }
          lastScrollY = current;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. ALL HOOKS MUST BE AT THE TOP LEVEL
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);

  // Sync post count and follower count
  const actualPosts = MOCK_POSTS.filter(p => p.user_id === id);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  
  // EDIT PROFILE STATES
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ADD PET STATES
  const [addPetStep, setAddPetStep] = useState(1);
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("🐶");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetAge, setNewPetAge] = useState("");
  const [newPetGender, setNewPetGender] = useState("Erkek");
  const [newPetNeutered, setNewPetNeutered] = useState("Evet");
  const [newPetSize, setNewPetSize] = useState("Orta");
  const [newPetFeatures, setNewPetFeatures] = useState("");
  const [newPetHealth, setNewPetHealth] = useState("");
  const [newPetCharacter, setNewPetCharacter] = useState("");
  const [newPetMicrochip, setNewPetMicrochip] = useState("");
  const [newPetShowPhone, setNewPetShowPhone] = useState(true);
  const [newPetPhotos, setNewPetPhotos] = useState<any[]>([]);
  const [isSavingPet, setIsSavingPet] = useState(false);

  useEffect(() => {
    if (currentUser && isOwnProfile) {
        setEditName(currentUser.username || "");
        setEditUsername(currentUser.username || "");
        setEditBio(currentUser.bio || "");
        setEditAvatarPreview(currentUser.avatar || null);
        setEditCoverPreview(currentUser.cover_photo || null);
    }
  }, [currentUser, isOwnProfile]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
        let avatarUrl = editAvatarPreview;
        let coverUrl = editCoverPreview;

        if (editAvatarFile) {
            avatarUrl = await apiService.uploadMedia(editAvatarFile, 'avatars');
        }
        if (editCoverFile) {
            coverUrl = await apiService.uploadMedia(editCoverFile, 'avatars');
        }

        await apiService.updateProfile({
            username: editUsername,
            bio: editBio,
            avatar: avatarUrl || undefined,
            cover_photo: coverUrl || undefined
        });

        // Update local state to reflect changes immediately
        setProfile((prev: any) => ({
            ...prev,
            username: editUsername,
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            bio: editBio
        }));

        setIsEditProfileOpen(false);
        showToast("Profil başarıyla güncellendi! ✨", "Sparkles", "text-cyan-400");
    } catch (err) {
        console.error(err);
        showToast("Profil güncellenirken bir hata oluştu.", "ShieldAlert", "text-red-500");
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleSavePet = async () => {
    setIsSavingPet(true);
    try {
        let imageUrl = "";
        if (newPetPhotos.length > 0) {
            imageUrl = await apiService.uploadMedia(newPetPhotos[0].file, 'posts');
        }

        const newPet = {
            name: newPetName,
            type: newPetType,
            breed: newPetBreed,
            age: newPetAge,
            gender: newPetGender,
            is_neutered: newPetNeutered === 'Evet',
            size: newPetSize,
            health_notes: newPetHealth,
            character: newPetCharacter,
            microchip_no: newPetMicrochip,
            show_phone: newPetShowPhone,
            image: imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
            owner_id: currentUser?.id
        };

        await apiService.addPet(newPet as any);
        setIsAddPetOpen(false);
        showToast(`${newPetName} aileye hoş geldin! 🐾`, "Sparkles", "text-orange-400");
        
        // Reset states
        setAddPetStep(1);
        setNewPetName("");
        setNewPetPhotos([]);
    } catch (err) {
        console.error(err);
        showToast("Pati kaydedilirken bir hata oluştu.", "ShieldAlert", "text-red-500");
    } finally {
        setIsSavingPet(false);
    }
  };

  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'main';
  const [activeView, setActiveView] = useState<any>(initialView);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Source of truth: MOCK_PROFILES
        let foundProfile = MOCK_PROFILES.find(p => p.id === id);
        
        // If it's the current user, ensure we have the most up-to-date info from context too
        if (id === currentUser?.id && !foundProfile) {
            foundProfile = {
                id: currentUser.id,
                username: currentUser.username,
                avatar_url: currentUser.avatar,
                cover_url: currentUser.cover_photo || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200",
                bio: currentUser.bio,
                posts_count: currentUser.stats?.posts || 0,
                followers_count: currentUser.stats?.followers || 0,
                following_count: currentUser.stats?.following || 0
            };
        }

        if (!foundProfile) {
            setError("Profil bulunamadı. Lütfen kullanıcı ID'sini kontrol edin.");
            setLoading(false);
            return;
        }
        
        setProfile(foundProfile);
        setFollowerCount(foundProfile.followers_count || 0);

      } catch (err) {
        setError("Profil verisi yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfileData();
  }, [id, currentUser]);

  useEffect(() => {
    const handleFollowChange = (e: any) => {
        if (e.detail.userId === id) {
            setFollowerCount(prev => e.detail.isFollowing ? prev + 1 : prev - 1);
        }
    };

    const handleNavigate = (e: any) => {
        const targetView = e.detail;
        const profileViews = [
            'wallet', 'passport', 'family', 'orders', 
            'appointments', 'routes', 'bookmarks', 
            'impact', 'activity', 'identity'
        ];
        
        if (profileViews.includes(targetView)) {
            const viewToSet = targetView === 'activity' ? 'routes' : targetView;
            setActiveView(viewToSet);
        }
    };

    window.addEventListener('moffi-follow-change', handleFollowChange);
    window.addEventListener('moffi-navigate', handleNavigate);

    return () => {
        window.removeEventListener('moffi-follow-change', handleFollowChange);
        window.removeEventListener('moffi-navigate', handleNavigate);
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Yükleniyor...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-foreground uppercase mb-4">Profil Bulunamadı</h2>
        <button 
          onClick={() => router.push('/community')}
          className="px-8 py-4 bg-foreground text-background rounded-full font-black text-xs uppercase"
        >
          Geri Dön
        </button>
      </main>
    );
  }

  const headerData = {
    username: profile.username,
    fullName: profile.full_name || profile.username,
    avatar: profile.avatar_url || profile.avatar,
    cover: profile.cover_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
    bio: profile.bio || "",
    location: profile.location || "Moffi Universe",
    is_premium: profile.is_premium,
    stats: {
        pack: followerCount,
        following: profile.following_count || 0,
        posts: actualPosts.length
    },
    isOwnProfile
  };

  if (isOwnProfile) {
    return (
      <main className="min-h-screen bg-background pb-32 overflow-x-hidden">
        <ProfileTab 
          user={currentUser}
          onEditProfile={() => setIsEditProfileOpen(true)}
          onAddPet={() => setIsAddPetOpen(true)}
          onSettings={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
          onPetQR={(pet) => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: `pet-${pet.id}` }))}
          onSOSSettings={(pet) => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: `sos-${pet.id}` }))}
          activeSubView={activeView}
          onSubViewChange={setActiveView}
          onOpenActionHub={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
        />

        <EditProfileModal 
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={currentUser}
          editName={editName}
          setEditName={setEditName}
          editUsername={editUsername}
          setEditUsername={setEditUsername}
          editBio={editBio}
          setEditBio={setEditBio}
          editAvatarPreview={editAvatarPreview}
          setEditAvatarPreview={setEditAvatarPreview}
          editCoverPreview={editCoverPreview}
          setEditCoverPreview={setEditCoverPreview}
          editAvatarFile={editAvatarFile}
          setEditAvatarFile={setEditAvatarFile}
          editCoverFile={editCoverFile}
          setEditCoverFile={setEditCoverFile}
          isSavingProfile={isSavingProfile}
          onSave={handleSaveProfile}
          coverInputRef={coverInputRef}
        />

        <AddPetModal 
          isOpen={isAddPetOpen}
          onClose={() => setIsAddPetOpen(false)}
          step={addPetStep}
          setStep={setAddPetStep}
          newPetName={newPetName}
          setNewPetName={setNewPetName}
          newPetType={newPetType}
          setNewPetType={setNewPetType}
          newPetBreed={newPetBreed}
          setNewPetBreed={setNewPetBreed}
          newPetAge={newPetAge}
          setNewPetAge={setNewPetAge}
          newPetGender={newPetGender}
          setNewPetGender={setNewPetGender}
          newPetNeutered={newPetNeutered}
          setNewPetNeutered={setNewPetNeutered}
          newPetSize={newPetSize}
          setNewPetSize={setNewPetSize}
          newPetFeatures={newPetFeatures}
          setNewPetFeatures={setNewPetFeatures}
          newPetHealth={newPetHealth}
          setNewPetHealth={setNewPetHealth}
          newPetCharacter={newPetCharacter}
          setNewPetCharacter={setNewPetCharacter}
          newPetMicrochip={newPetMicrochip}
          setNewPetMicrochip={setNewPetMicrochip}
          newPetShowPhone={newPetShowPhone}
          setNewPetShowPhone={setNewPetShowPhone}
          newPetPhotos={newPetPhotos}
          setNewPetPhotos={setNewPetPhotos}
          isSaving={isSavingPet}
          onSave={handleSavePet}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <ProfileHeader 
        user={headerData}
        isFollowingInitial={false}
        userId={id}
        onMessage={() => showToast("Mesaj özelliği yakında!", "MessageSquare", "text-cyan-400")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {(profile.settings?.privacy?.showPets) && (
          <section className="mt-12 sm:mt-16 mb-12 sm:mb-20">
            <div className="flex items-center justify-between mb-8 sm:mb-10 px-2">
                <div className="flex flex-col">
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tighter italic flex items-center gap-2 sm:gap-3">
                        Patiler
                        <div className="h-1 w-8 sm:w-12 bg-accent rounded-full mt-1 opacity-50" />
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-secondary font-black uppercase tracking-[0.3em] mt-1 ml-1 opacity-60">Aile Üyelerimiz</p>
                </div>
                {MOCK_PETS.filter(p => p.owner_id === id).length > 3 && (
                    <button className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors">TÜMÜNÜ GÖR</button>
                )}
            </div>
            
            <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {MOCK_PETS.filter(p => p.owner_id === id).map((pet) => (
                    <div 
                        key={pet.id}
                        className="min-w-[240px] bg-card border border-card-border rounded-[2.5rem] p-6 flex flex-col items-center gap-4 shadow-sm"
                    >
                        <div className="w-24 h-24 rounded-full border-2 border-accent/20 p-1 bg-background shadow-lg">
                            <img src={pet.avatar_url || pet.avatar} className="w-full h-full object-cover rounded-full" alt={pet.name} />
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-foreground uppercase leading-none mb-1">{pet.name}</h4>
                            <p className="text-[9px] text-secondary font-bold uppercase tracking-widest leading-none">{pet.breed}</p>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        )}

        <section className="mt-8">
            <ProfileTabs 
                userId={id} 
                isOwnProfile={isOwnProfile} 
                profileSettings={profile.settings}
            />
        </section>
      </div>

      <VisitorInteractionBar profile={profile} />
      
    </main>
  );
}
