"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera, Edit3, Check, X, Loader2, AlertCircle, ArrowLeft,
    Settings, Sparkles, BadgeCheck, Crown, MapPin, LinkIcon,
    ChevronRight, User, PawPrint, Grid3X3, Image as ImageIcon,
    Heart, MessageCircle, Share2, Copy, ExternalLink
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import { usePet } from "@/context/PetContext";
import { showToast } from "@/lib/utils";
import { ProfileTab } from "@/components/community/ProfileTab";
import { AddPetModal } from "@/components/community/modals/AddPetModal";
import { EditProfileModal } from "@/components/community/modals/EditProfileModal";

// ─── Başharf Avatar Yardımcısı ─────────────────────────────
const AVATAR_COLORS = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-indigo-700',
    'from-emerald-500 to-teal-700',
    'from-orange-500 to-amber-700',
    'from-rose-500 to-pink-700',
    'from-cyan-500 to-sky-700',
    'from-[#527958] to-emerald-700',
];

function seedColor(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name?: string, username?: string, email?: string): string {
    const src = name || username || email || '';
    const parts = src.split(/[\s@_.-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return src.charAt(0).toUpperCase() || 'M';
}

function isPlaceholderUrl(url?: string | null): boolean {
    if (!url) return true;
    return url === "" || url === "placeholder" || url === "null";
}

// ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const { user: currentUser, updateProfile } = useAuth();
    const { pets, activePet, switchPet } = usePet();
    const isOwnProfile = !!(currentUser && id === currentUser.id);

    // ── State ──────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'pets'>('posts');
    const [activeSubView, setActiveSubView] = useState<any>('main');

    // Sync activeSubView with URL query parameter
    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveSubView(view);
        } else {
            setActiveSubView('main');
        }
    }, [searchParams]);

    // Listen to global moffi-navigate events for instant feedback
    useEffect(() => {
        const handleNavigate = (e: any) => {
            const dest = e.detail;
            if (isOwnProfile && dest) {
                setActiveSubView(dest);
            }
        };
        window.addEventListener('moffi-navigate', handleNavigate);
        return () => window.removeEventListener('moffi-navigate', handleNavigate);
    }, [isOwnProfile]);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [editAllowComments, setEditAllowComments] = useState(true);
    const [editCommentPrivacy, setEditCommentPrivacy] = useState('everyone');
    const [editFilterWords, setEditFilterWords] = useState('');

    // Add Pet
    const [isAddPetOpen, setIsAddPetOpen] = useState(false);
    const [addPetStep, setAddPetStep] = useState(1);
    const [newPetName, setNewPetName] = useState('');
    const [newPetType, setNewPetType] = useState('🐶');
    const [newPetBreed, setNewPetBreed] = useState('');
    const [newPetAge, setNewPetAge] = useState('');
    const [newPetGender, setNewPetGender] = useState('Erkek');
    const [newPetNeutered, setNewPetNeutered] = useState('Evet');
    const [newPetSize, setNewPetSize] = useState('Orta');
    const [newPetFeatures, setNewPetFeatures] = useState('');
    const [newPetHealth, setNewPetHealth] = useState('');
    const [newPetCharacter, setNewPetCharacter] = useState('');
    const [newPetMicrochip, setNewPetMicrochip] = useState('');
    const [newPetShowPhone, setNewPetShowPhone] = useState(true);
    const [newPetPhotos, setNewPetPhotos] = useState<any[]>([]);
    const [isSavingPet, setIsSavingPet] = useState(false);
    const [newPetWeight, setNewPetWeight] = useState('');
    const [newPetHealthStatus, setNewPetHealthStatus] = useState('İyi');
    const [newPetActivityTarget, setNewPetActivityTarget] = useState('70');
    const [newPetWaterTarget, setNewPetWaterTarget] = useState('1200');
    const [newPetFoodTarget, setNewPetFoodTarget] = useState('1600');

    // ── Data Fetch ─────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const data = await apiService.getUserProfile(id);
                setProfile(data);
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    // Sync edit form from currentUser
    useEffect(() => {
        if (currentUser && isOwnProfile) {
            setEditName(currentUser.name || currentUser.username || '');
            setEditUsername(currentUser.username || '');
            setEditBio(currentUser.bio || '');
            setEditAvatarPreview(isPlaceholderUrl(currentUser.avatar) ? null : (currentUser.avatar || null));
            setEditCoverPreview(isPlaceholderUrl(currentUser.cover_photo) ? null : (currentUser.cover_photo || null));
            setEditAllowComments(currentUser.settings?.default_allow_comments !== false);
            setEditCommentPrivacy(currentUser.settings?.default_comment_privacy || 'everyone');
            setEditFilterWords(currentUser.settings?.comment_filter_words?.join(', ') || '');
        }
    }, [currentUser, isOwnProfile]);
    const handleSave = async () => {
        console.log('--- Profil Kaydetme Başladı ---');
        console.log('editName:', editName);
        console.log('editUsername:', editUsername);
        console.log('editBio:', editBio);
        console.log('editAvatarFile:', editAvatarFile);
        console.log('editCoverFile:', editCoverFile);
        console.log('Mevcut avatar:', currentUser?.avatar);
        console.log('Mevcut cover:', currentUser?.cover_photo);

        setIsSaving(true);
        try {
            let avatarUrl: string | null = isPlaceholderUrl(currentUser?.avatar) ? null : (currentUser?.avatar || null);
            let coverUrl: string | null = isPlaceholderUrl(currentUser?.cover_photo) ? null : (currentUser?.cover_photo || null);

            console.log('Başlangıç avatarUrl:', avatarUrl);
            console.log('Başlangıç coverUrl:', coverUrl);

            // Upload avatar if new file selected
            if (editAvatarFile) {
                console.log('Yeni avatar yükleniyor...');
                avatarUrl = await apiService.uploadMedia(editAvatarFile, 'avatars');
                console.log('Yeni avatar yüklendi. URL:', avatarUrl);
            }

            // Upload cover if new file selected
            if (editCoverFile) {
                console.log('Yeni kapak yükleniyor...');
                coverUrl = await apiService.uploadMedia(editCoverFile, 'avatars');
                console.log('Yeni kapak yüklendi. URL:', coverUrl);
            }

            console.log('updateProfile çağrılıyor. Payload:', {
                name: editName,
                username: editUsername,
                bio: editBio,
                avatar: avatarUrl,
                cover_photo: coverUrl,
                default_allow_comments: editAllowComments,
                default_comment_privacy: editCommentPrivacy,
                comment_filter_words: editFilterWords.split(',').map(w => w.trim()).filter(Boolean),
            });

            await updateProfile({
                name: editName,
                username: editUsername,
                bio: editBio,
                avatar: avatarUrl,
                cover_photo: coverUrl,
                default_allow_comments: editAllowComments,
                default_comment_privacy: editCommentPrivacy,
                comment_filter_words: editFilterWords.split(',').map(w => w.trim()).filter(Boolean),
            } as any);

            console.log('updateProfile başarılı oldu.');

            // Update local profile state
            setProfile((prev: any) => ({
                ...prev,
                full_name: editName,
                username: editUsername,
                bio: editBio,
                avatar: avatarUrl,
                avatar_url: avatarUrl,
                cover_photo: coverUrl,
                cover_url: coverUrl,
                default_allow_comments: editAllowComments,
                default_comment_privacy: editCommentPrivacy,
                comment_filter_words: editFilterWords.split(',').map(w => w.trim()).filter(Boolean),
            }));

            setIsEditing(false);
            setEditAvatarFile(null);
            setEditCoverFile(null);
            showToast('✅ Profil güncellendi!', 'Sparkles', 'text-cyan-400');
        } catch (err: any) {
            console.error('Kaydetme esnasında hata oluştu:', err);
            showToast('❌ Kayıt başarısız: ' + (err?.message || 'Bilinmeyen hata'), 'ShieldAlert', 'text-red-500');
        } finally {
            setIsSaving(false);
            console.log('--- Profil Kaydetme Bitti ---');
        }
    };

    const handleSavePet = async () => {
        setIsSavingPet(true);
        try {
            let imageUrl = '';
            if (newPetPhotos.length > 0) {
                try {
                    imageUrl = await apiService.uploadMedia(newPetPhotos[0].file, 'avatars');
                } catch {
                    imageUrl = '';
                }
            }
            await apiService.addPet({
                name: newPetName, type: newPetType, breed: newPetBreed,
                age: newPetAge, gender: newPetGender,
                is_neutered: newPetNeutered === 'Evet',
                size: newPetSize, health_notes: newPetHealth,
                character: newPetCharacter, microchip_id: newPetMicrochip,
                show_phone: newPetShowPhone, image: imageUrl || '',
                owner_id: currentUser?.id
            } as any);
            setIsAddPetOpen(false);
            setAddPetStep(1); setNewPetName(''); setNewPetPhotos([]);
            showToast(`${newPetName} aileye hoş geldin! 🐾`, 'Sparkles', 'text-orange-400');
        } catch (err) {
            showToast('Pati kaydedilemedi.', 'ShieldAlert', 'text-red-500');
        } finally {
            setIsSavingPet(false);
        }
    };

    // ── Derived values ──────────────────────────────────────
    const displayUser = isOwnProfile ? currentUser : profile;
    const avatarUrl = isEditing ? editAvatarPreview : (isPlaceholderUrl(displayUser?.avatar || displayUser?.avatar_url) ? null : (displayUser?.avatar || displayUser?.avatar_url || null));
    const coverUrl = isEditing ? editCoverPreview : (isPlaceholderUrl(displayUser?.cover_photo || displayUser?.cover_url) ? null : (displayUser?.cover_photo || displayUser?.cover_url || null));
    const avatarSeed = displayUser?.username || displayUser?.name || displayUser?.email || 'moffi';
    const avatarGradient = seedColor(avatarSeed);
    const initials = getInitials(displayUser?.name, displayUser?.username, displayUser?.email);

    // ── Render: Loading ─────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest">Profil Yükleniyor</p>
                </motion.div>
            </div>
        );
    }

    if (!displayUser && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-8 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Profil Bulunamadı</h2>
                    <button onClick={() => router.push('/community')} className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest">
                        Ana Sayfaya Dön
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Own Profile → ProfileTab ─────────────────────────────
    if (isOwnProfile) {
        return (
            <main className="min-h-screen bg-background pb-32 overflow-x-hidden">
                <ProfileTab
                    user={currentUser}
                    onEditProfile={() => setIsEditing(true)}
                    onAddPet={() => setIsAddPetOpen(true)}
                    onSettings={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))}
                    onPetQR={(pet) => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: `pet-${pet.id}` }))}
                    onSOSSettings={(pet) => window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: `sos-${pet.id}` }))}
                    activeSubView={activeSubView}
                    onSubViewChange={setActiveSubView}
                    onOpenActionHub={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
                />
                <AddPetModal
                    isOpen={isAddPetOpen} onClose={() => setIsAddPetOpen(false)}
                    step={addPetStep} setStep={setAddPetStep}
                    newPetName={newPetName} setNewPetName={setNewPetName}
                    newPetType={newPetType} setNewPetType={setNewPetType}
                    newPetBreed={newPetBreed} setNewPetBreed={setNewPetBreed}
                    newPetAge={newPetAge} setNewPetAge={setNewPetAge}
                    newPetGender={newPetGender} setNewPetGender={setNewPetGender}
                    newPetNeutered={newPetNeutered} setNewPetNeutered={setNewPetNeutered}
                    newPetSize={newPetSize} setNewPetSize={setNewPetSize}
                    newPetFeatures={newPetFeatures} setNewPetFeatures={setNewPetFeatures}
                    newPetHealth={newPetHealth} setNewPetHealth={setNewPetHealth}
                    newPetCharacter={newPetCharacter} setNewPetCharacter={setNewPetCharacter}
                    newPetMicrochip={newPetMicrochip} setNewPetMicrochip={setNewPetMicrochip}
                    newPetShowPhone={newPetShowPhone} setNewPetShowPhone={setNewPetShowPhone}
                    newPetPhotos={newPetPhotos} setNewPetPhotos={setNewPetPhotos}
                    isSaving={isSavingPet} onSave={handleSavePet}
                    newPetWeight={newPetWeight} setNewPetWeight={setNewPetWeight}
                    newPetHealthStatus={newPetHealthStatus} setNewPetHealthStatus={setNewPetHealthStatus}
                    newPetActivityTarget={newPetActivityTarget} setNewPetActivityTarget={setNewPetActivityTarget}
                    newPetWaterTarget={newPetWaterTarget} setNewPetWaterTarget={setNewPetWaterTarget}
                    newPetFoodTarget={newPetFoodTarget} setNewPetFoodTarget={setNewPetFoodTarget}
                />
                <EditProfileModal
                    isOpen={isEditing}
                    onClose={() => { setIsEditing(false); setEditAvatarFile(null); setEditCoverFile(null); }}
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
                    isSavingProfile={isSaving}
                    onSave={handleSave}
                    editAllowComments={editAllowComments}
                    setEditAllowComments={setEditAllowComments}
                    editCommentPrivacy={editCommentPrivacy}
                    setEditCommentPrivacy={setEditCommentPrivacy}
                    editFilterWords={editFilterWords}
                    setEditFilterWords={setEditFilterWords}
                />
            </main>
        );
    }

    // ── PREMIUM PROFILE PAGE ────────────────────────────────
    return (
        <main className="min-h-screen bg-[#0A0A0F] pb-32 overflow-x-hidden">
            {/* ══ HERO — Cover + Avatar ══ */}
            <div className="relative w-full h-72 sm:h-80">
                {/* Cover */}
                {coverUrl ? (
                    <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover" alt="Kapak" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
                        <div className="absolute inset-0 opacity-30"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #527958 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1a4731 0%, transparent 40%)' }}
                        />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/20 to-transparent" />

                {/* Back button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 z-10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>

                {/* Avatar */}
                <div className="absolute -bottom-14 left-5 z-20">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-[2rem] border-4 border-[#0A0A0F] overflow-hidden shadow-2xl shadow-black/50 bg-[#111]">
                            {avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-4xl font-black select-none`}>
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ PROFILE INFO ══ */}
            <div className="px-5 mt-16">
                {/* Name + actions row */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                    {displayUser?.name || displayUser?.display_name || displayUser?.full_name || displayUser?.username || 'Moffi Kullanıcısı'}
                                </h1>
                                {displayUser?.is_prime && <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
                                {(displayUser?.subscription_status === 'plus' || displayUser?.subscription_status === 'pro') && (
                                    <div className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-md text-[8px] font-black text-black uppercase italic shadow-lg">PRIME</div>
                                )}
                            </div>
                            <p className="text-emerald-400 font-bold text-sm mt-0.5 tracking-wide">
                                @{displayUser?.username || 'moffi_user'}
                            </p>
                        </>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-3 mt-1">
                        {isOwnProfile ? (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setEditName(currentUser?.name || currentUser?.username || '');
                                        setEditUsername(currentUser?.username || '');
                                        setEditBio(currentUser?.bio || '');
                                        setEditAvatarPreview(isPlaceholderUrl(currentUser?.avatar) ? null : (currentUser?.avatar || null));
                                        setEditCoverPreview(isPlaceholderUrl(currentUser?.cover_photo) ? null : (currentUser?.cover_photo || null));
                                        setIsEditing(true);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/8 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/12 transition-colors"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Düzenle
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-hub'))}
                                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                >
                                    <Sparkles className="w-5 h-5" />
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2.5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30"
                            >
                                Takip Et
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Bio */}
                <div className="mt-4">
                    <p className="text-white/60 text-sm leading-relaxed">
                        {displayUser?.bio || 'Moffi Ekosistemine Hoşgeldiniz ✨'}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-5 pb-5 border-b border-white/5">
                    {[
                        { value: pets.length || 0, label: 'Pati' },
                        { value: displayUser?.stats?.followers || displayUser?.stats?.pack || 0, label: 'Takipçi' },
                        { value: displayUser?.stats?.following || 0, label: 'Takip' },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-white font-black text-xl leading-tight">{s.value}</p>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Pets section */}
                {pets.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest">Patilerim</h3>
                            {isOwnProfile && (
                                <button onClick={() => setIsAddPetOpen(true)} className="text-[9px] text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors">
                                    + Ekle
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {pets.map(pet => (
                                <motion.button
                                    key={pet.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => switchPet(pet.id)}
                                    className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-[1.5rem] border transition-all ${
                                        activePet?.id === pet.id
                                            ? 'border-emerald-500/40 bg-emerald-500/10'
                                            : 'border-white/8 bg-white/3 hover:bg-white/6'
                                    }`}
                                >
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/8">
                                        {pet.image ? (
                                            <img src={pet.image} className="w-full h-full object-cover" alt={pet.name} />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-tr ${seedColor(pet.name)} flex items-center justify-center text-white text-xl font-black`}>
                                                {pet.name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-white text-[9px] font-black uppercase tracking-wide">{pet.name}</span>
                                    {activePet?.id === pet.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab bar */}
                <div className="flex mt-6 border-b border-white/8">
                    {[
                        { id: 'posts', label: 'Gönderiler', icon: <Grid3X3 className="w-4 h-4" /> },
                        { id: 'pets', label: 'Patiler', icon: <PawPrint className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-colors relative ${
                                activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/60'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-emerald-400 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content tabs */}
                <AnimatePresence mode="wait">
                    {activeTab === 'posts' ? (
                        <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                            <PostsGrid userId={id} />
                        </motion.div>
                    ) : (
                        <motion.div key="pets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-3">
                            {pets.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                                        <PawPrint className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-white/40 font-black text-sm uppercase italic">Henüz Pati Yok</p>
                                    {isOwnProfile && (
                                        <button onClick={() => setIsAddPetOpen(true)} className="mt-4 px-6 py-2.5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                                            İlk Patimi Ekle
                                        </button>
                                    )}
                                </div>
                            ) : (
                                pets.map(pet => (
                                    <motion.div key={pet.id} whileTap={{ scale: 0.99 }} className="flex items-center gap-4 p-4 bg-white/3 border border-white/8 rounded-3xl hover:bg-white/6 transition-colors">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                                            {pet.image ? (
                                                <img src={pet.image} className="w-full h-full object-cover" alt={pet.name} />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-tr ${seedColor(pet.name)} flex items-center justify-center text-white text-xl font-black`}>
                                                    {pet.name[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-black uppercase tracking-tight">{pet.name}</p>
                                            <p className="text-white/40 text-xs font-bold mt-0.5">{pet.breed || 'Tür bilgisi yok'} • {pet.gender || ''}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/20" />
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Pet Modal */}
            <AddPetModal
                isOpen={isAddPetOpen} onClose={() => setIsAddPetOpen(false)}
                step={addPetStep} setStep={setAddPetStep}
                newPetName={newPetName} setNewPetName={setNewPetName}
                newPetType={newPetType} setNewPetType={setNewPetType}
                newPetBreed={newPetBreed} setNewPetBreed={setNewPetBreed}
                newPetAge={newPetAge} setNewPetAge={setNewPetAge}
                newPetGender={newPetGender} setNewPetGender={setNewPetGender}
                newPetNeutered={newPetNeutered} setNewPetNeutered={setNewPetNeutered}
                newPetSize={newPetSize} setNewPetSize={setNewPetSize}
                newPetFeatures={newPetFeatures} setNewPetFeatures={setNewPetFeatures}
                newPetHealth={newPetHealth} setNewPetHealth={setNewPetHealth}
                newPetCharacter={newPetCharacter} setNewPetCharacter={setNewPetCharacter}
                newPetMicrochip={newPetMicrochip} setNewPetMicrochip={setNewPetMicrochip}
                newPetShowPhone={newPetShowPhone} setNewPetShowPhone={setNewPetShowPhone}
                newPetPhotos={newPetPhotos} setNewPetPhotos={setNewPetPhotos}
                isSaving={isSavingPet} onSave={handleSavePet}
                newPetWeight={newPetWeight} setNewPetWeight={setNewPetWeight}
                newPetHealthStatus={newPetHealthStatus} setNewPetHealthStatus={setNewPetHealthStatus}
                newPetActivityTarget={newPetActivityTarget} setNewPetActivityTarget={setNewPetActivityTarget}
                newPetWaterTarget={newPetWaterTarget} setNewPetWaterTarget={setNewPetWaterTarget}
                newPetFoodTarget={newPetFoodTarget} setNewPetFoodTarget={setNewPetFoodTarget}
            />

            {/* ══ PREMIUM PROFILE EDIT MODAL ══ */}
            <EditProfileModal
                isOpen={isEditing}
                onClose={() => { setIsEditing(false); setEditAvatarFile(null); setEditCoverFile(null); }}
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
                isSavingProfile={isSaving}
                onSave={handleSave}
                editAllowComments={editAllowComments}
                setEditAllowComments={setEditAllowComments}
                editCommentPrivacy={editCommentPrivacy}
                setEditCommentPrivacy={setEditCommentPrivacy}
                editFilterWords={editFilterWords}
                setEditFilterWords={setEditFilterWords}
            />
        </main>
    );
}

// ── Posts Grid Bileşeni ──────────────────────────────────────
function PostsGrid({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await (apiService as any).getUserPosts(userId);
                setPosts(data || []);
            } catch { setPosts([]); }
            finally { setIsLoading(false); }
        };
        load();
    }, [userId]);

    if (isLoading) return (
        <div className="grid grid-cols-3 gap-0.5">
            {Array(9).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-white/4 animate-pulse rounded-sm" />
            ))}
        </div>
    );

    if (posts.length === 0) return (
        <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-black text-sm uppercase italic">Henüz Gönderi Yok</p>
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-3 gap-0.5 rounded-2xl overflow-hidden">
                <AnimatePresence>
                    {posts.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="aspect-square relative overflow-hidden bg-white/4 cursor-pointer group"
                            onClick={() => setSelected(p)}
                        >
                            {p.media_url || p.image ? (
                                <img src={p.media_url || p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-purple-500/10 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-white/20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                <span className="flex items-center gap-1 text-white text-xs font-black"><Heart className="w-4 h-4 fill-white" />{p.likes || 0}</span>
                                <span className="flex items-center gap-1 text-white text-xs font-black"><MessageCircle className="w-4 h-4 fill-white" />{p.comments || 0}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Post detail modal */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md" onClick={() => setSelected(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed inset-x-4 top-20 bottom-20 z-[510] bg-[#111] rounded-[2.5rem] overflow-hidden flex flex-col border border-white/8 shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="relative flex-1 bg-black">
                                <img src={selected.media_url || selected.image} className="w-full h-full object-contain" alt="" />
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {selected.desc && (
                                <div className="p-5 shrink-0">
                                    <p className="text-white text-sm leading-relaxed">{selected.desc}</p>
                                    <div className="flex items-center gap-4 mt-3 text-white/40 text-xs font-bold">
                                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-400" />{selected.likes || 0}</span>
                                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-cyan-400" />{selected.comments || 0}</span>
                                        <span className="ml-auto">{selected.time}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
