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
import { useChat } from "@/context/ChatContext";
import { apiService } from "@/services/apiService";
import type { UserProfile } from "@/services/types";
import type { ProfileSummary } from "@/services/supabaseApiService";

/** Profildeki telefonla eşleşen, işletmelerin açtığı sahipsiz hasta kayıtları (my_unclaimed_matches). */
type UnclaimedMatch = Awaited<ReturnType<typeof apiService.getMyUnclaimedMatches>>[number];
import { healthService } from "@/services/healthService";
import { usePet } from "@/context/PetContext";
import { showToast } from "@/lib/utils";
import { AddPetFlow } from "@/components/home/AddPetFlow";
import { EditProfileModal } from "@/components/community/modals/EditProfileModal";

// ── Tab Imports ─────────────────────────────────────────────
import { WalletTab } from "@/components/profile/WalletTab";
import { OrdersTab } from "@/components/profile/OrdersTab";
import { RoutesTab } from "@/components/profile/RoutesTab";
import { HealthProvider } from "@/components/health/HealthProvider";
import { PassportHome } from "@/components/passport/PassportHome";
import { Avatar, FollowButton, PostGrid } from "@/components/social/SocialUI";
import { useDailyProgress } from '@/context/DailyProgressContext';
import { FRAME_CLASSES, resolveFrameStyle, type FrameStyle } from "@/lib/vipFrames";
import { Sheet, LoadingBlocks } from "@/components/health/HealthUI";
import { ReportModal } from "@/components/common/modals/ReportModal";
import { socialService, POSTS_CHANGED_EVENT, type GridPost } from "@/services/socialService";
import { ageText } from "@/lib/health/derive";
import { todayKey } from "@/lib/appointmentTime";
import { speciesLabel } from "@/lib/petIdentity";
import { MoreHorizontal, Plus } from "lucide-react";

import { Wallet, Package, Calendar, Map, Users as UsersIcon, Bookmark, FileText, Activity } from "lucide-react";
import { openShare } from '@/components/common/ShareSheet';
import { FeaturedBadges } from '@/components/quests/FeaturedBadges';

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
    const { openChat } = useChat();
    const isOwnProfile = !!(currentUser && (id === currentUser.id || id === 'me'));

    // Başkasının profilinde o kişinin hayvanları (sadece herkese açık kart alanları).
    // Önceden burada profile bakan kişinin kendi hayvanları gösteriliyordu.
    const [ownerPets, setOwnerPets] = useState<Awaited<ReturnType<typeof apiService.getPublicPetsByOwner>>>([]);
    useEffect(() => {
        if (isOwnProfile || !id || id === 'me') { setOwnerPets([]); return; }
        let alive = true;
        apiService.getPublicPetsByOwner(id).then(list => { if (alive) setOwnerPets(list); }).catch(() => {});
        return () => { alive = false; };
    }, [id, isOwnProfile]);
    // Kendi hayvanlarım tam kayıt (yaş gösterilir); başkasınınki yalnızca herkese açık kart.
    const profilePets = isOwnProfile
        ? pets.map(p => ({ id: p.id, name: p.name, breed: p.breed, type: p.type, image: p.image, ageLabel: ageText(p.birthday, p.age, todayKey()) }))
        : ownerPets.map(p => ({ ...p, ageLabel: null }));
    // Ödül Merkezi / Prime çerçevesi: hakkı (Prime ya da süresi geçmemiş VIP) her çizimde yeniden doğrulanır.
    // Başkalarının profilinde henüz gösterilmiyor; seçim sadece sahibinin ayarlarında duruyor (YAPILACAKLAR).
    const { activePerks } = useDailyProgress();
    const frameStyle: FrameStyle = isOwnProfile
        ? resolveFrameStyle(currentUser?.settings?.appearance?.frameStyle, { isPrime: !!currentUser?.is_prime, activePerks })
        : 'minimal';

    // ── State ──────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('posts');

    useEffect(() => {
        const view = searchParams.get('view');
        // Eski "?view=appointments" bağlantıları tek randevu ekranına gider (profil kopyası kaldırıldı).
        if (view === 'appointments') {
            router.replace('/vet?view=appointments');
        } else if (view === 'bookmarks') {
            setActiveTab('saved');
        } else if (view === 'pets') {
            setActiveTab('posts');
        } else if (view) {
            setActiveTab(view);
        }
    }, [searchParams]);

    // ── Profil özeti (Keşfet Ekran 10): gönderi/takipçi/takip sayısı, takip ve engel durumu tek sunucu çağrısından
    const [summary, setSummary] = useState<{ posts: number; followers: number; following: number; isFollowing: boolean; followsMe: boolean; blockedByMe: boolean } | null>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [reportUserOpen, setReportUserOpen] = useState(false);
    const [blockConfirm, setBlockConfirm] = useState(false);
    const loadSummary = useCallback(() => {
        if (!id || id === 'me') return;
        socialService.profileSummary(id).then(setSummary).catch(() => setSummary(null));
    }, [id]);
    useEffect(() => {
        loadSummary();
        const onChange = () => loadSummary();
        window.addEventListener('moffi-follow-change', onChange);
        window.addEventListener(POSTS_CHANGED_EVENT, onChange);
        return () => { window.removeEventListener('moffi-follow-change', onChange); window.removeEventListener(POSTS_CHANGED_EVENT, onChange); };
    }, [loadSummary]);

    const toggleBlock = async () => {
        try {
            if (summary?.blockedByMe) { await socialService.unblock(id); showToast("Engel kaldırıldı.", "CheckCircle2", "text-emerald-500"); }
            else { await socialService.block(id); showToast("Hesap engellendi.", "CheckCircle2", "text-emerald-500"); }
            setBlockConfirm(false); setMoreOpen(false); loadSummary();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "İşlem yapılamadı.", "AlertCircle", "text-red-500");
        }
    };

    const shareProfile = async () => {
        openShare({ title: `${profile?.name || profile?.username || 'Moffi profili'} · Moffi`, text: 'Moffi topluluğundaki profil', url: `/profile/${id}`, image: profile?.avatar || null });
    };

    const handleMessageClick = () => {
        if (!currentUser) {
            showToast("Mesaj göndermek için önce giriş yapmalısınız!", "PawPrint");
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }
        openChat(id);
    };

    // ── Relations Modal (Followers / Following List) ────────
    const [isRelationsModalOpen, setIsRelationsModalOpen] = useState(false);
    const [relationsModalTab, setRelationsModalTab] = useState<'followers' | 'following'>('followers');
    const [relationsList, setRelationsList] = useState<ProfileSummary[]>([]);
    const [relationsLoading, setRelationsLoading] = useState(false);

    const openRelationsModal = async (tab: 'followers' | 'following') => {
        setRelationsModalTab(tab);
        setIsRelationsModalOpen(true);
        setRelationsLoading(true);
        try {
            const list = tab === 'followers'
                ? await apiService.getFollowers(id)
                : await apiService.getFollowing(id);
            setRelationsList(list);
        } catch (err) {
            console.error("Error loading relations list:", err);
            setRelationsList([]);
        } finally {
            setRelationsLoading(false);
        }
    };

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [editAllowComments, setEditAllowComments] = useState(true);
    const [editCommentPrivacy, setEditCommentPrivacy] = useState('everyone');
    const [editFilterWords, setEditFilterWords] = useState('');

    // Unclaimed Match states
    const [unclaimedMatches, setUnclaimedMatches] = useState<UnclaimedMatch[]>([]);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);

    const [isAddPetOpen, setIsAddPetOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('addPet') === 'true' && isOwnProfile) {
            setIsAddPetOpen(true);

            // Clean up the URL to prevent reopening on reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, isOwnProfile]);


    // ── Data Fetch ─────────────────────────────────────────
    useEffect(() => {
        if (!id || id === 'me') return;
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
        if (isOwnProfile && currentUser) {
            setEditName(currentUser.name || currentUser.username || '');
            setEditUsername(currentUser.username || '');
            setEditPhone(currentUser.phone || '');
            setEditBio(currentUser.bio || '');
            setEditAvatarPreview(isPlaceholderUrl(currentUser.avatar) ? null : (currentUser.avatar || null));
            setEditCoverPreview(isPlaceholderUrl(currentUser.cover_photo) ? null : (currentUser.cover_photo || null));
            setEditAllowComments(currentUser.commentDefaults?.allowComments !== false);
            setEditCommentPrivacy(currentUser.commentDefaults?.privacy || 'everyone');
            setEditFilterWords(currentUser.commentDefaults?.filterWords.join(', ') || '');
        }
    }, [currentUser, isOwnProfile]);
    const handleSave = async () => {
        setIsSaving(true);
        try {
            let avatarUrl: string | null = isPlaceholderUrl(currentUser?.avatar) ? null : (currentUser?.avatar || null);
            let coverUrl: string | null = isPlaceholderUrl(currentUser?.cover_photo) ? null : (currentUser?.cover_photo || null);
            if (editAvatarFile) avatarUrl = await apiService.uploadMedia(editAvatarFile, 'avatars');
            if (editCoverFile) coverUrl = await apiService.uploadMedia(editCoverFile, 'avatars');

            const filterWords = editFilterWords.split(',').map(w => w.trim()).filter(Boolean);
            await updateProfile({
                name: editName,
                username: editUsername,
                bio: editBio,
                avatar: avatarUrl ?? undefined,
                cover_photo: coverUrl ?? undefined,
                phone: editPhone.trim() || null,
                default_allow_comments: editAllowComments,
                default_comment_privacy: editCommentPrivacy,
                comment_filter_words: filterWords,
            });
            setProfile(prev => (prev ? {
                ...prev,
                name: editName,
                username: editUsername,
                bio: editBio,
                avatar: avatarUrl ?? undefined,
                cover_photo: coverUrl ?? undefined,
                phone: editPhone.trim() || null,
                default_allow_comments: editAllowComments,
                default_comment_privacy: editCommentPrivacy,
                comment_filter_words: filterWords,
            } : prev));

            setIsEditing(false);
            setEditAvatarFile(null);
            setEditCoverFile(null);
            showToast('✅ Profil güncellendi!', 'Sparkles', 'text-cyan-400');

            // Bu telefonla kliniklerde açılmış kayıt var mı (yalnızca kendi kayıtlı telefonumla eşleşir)
            if (editPhone.trim()) {
                try {
                    const matches = await apiService.getMyUnclaimedMatches();
                    if (matches && matches.length > 0) {
                        setUnclaimedMatches(matches);
                        setIsClaimModalOpen(true);
                    }
                } catch(e) {
                    console.error("Match error:", e);
                }
            }
        } catch (err) {
            console.error('Profil kaydedilemedi:', err);
            showToast('❌ Kayıt başarısız: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'), 'ShieldAlert', 'text-red-500');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Derived values ──────────────────────────────────────
    const displayUser = isOwnProfile ? currentUser : profile;
    const avatarUrl = isEditing ? editAvatarPreview : (isPlaceholderUrl(displayUser?.avatar) ? null : (displayUser?.avatar || null));
    const coverUrl = isEditing ? editCoverPreview : (isPlaceholderUrl(displayUser?.cover_photo) ? null : (displayUser?.cover_photo || null));
    const avatarSeed = displayUser?.username || displayUser?.name || 'moffi';
    const avatarGradient = seedColor(avatarSeed);
    const initials = getInitials(displayUser?.name, displayUser?.username);

    // ── Render: Loading ─────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-black/50 dark:text-white/40 text-xs font-black uppercase tracking-widest">Profil Yükleniyor</p>
                </motion.div>
            </div>
        );
    }

    if (!displayUser && !isOwnProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">Profil Bulunamadı</h2>
                    <button onClick={() => { if (typeof window !== 'undefined' && window.history.length > 2) { router.back(); } else { router.push('/home'); } }} className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest">
                        Ana Sayfaya Dön
                    </button>
                </motion.div>
            </div>
        );
    }

    // Remove separate isOwnProfile return block, so we use the unified layout below.


    // ── Keşfet Ekran 10 — Profil ─────────────────────────────
    const displayName = displayUser?.name || displayUser?.username || 'Moffi Kullanıcısı';
    const city = [profile?.district, profile?.province].filter(Boolean).join(', ');
    const blocked = !!summary?.blockedByMe;
    const Stat = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => (
        <button onClick={onClick} disabled={!onClick} className="flex-1 text-center">
            <div className="text-lg font-black leading-tight">{value.toLocaleString('tr-TR')}</div>
            <div className="text-xs font-semibold text-secondary">{label}</div>
        </button>
    );
    const tabs = [
        { id: 'posts', label: 'Gönderiler', icon: <Grid3X3 className="w-5 h-5" /> },
        ...(isOwnProfile ? [
            { id: 'saved', label: 'Kaydedilenler', icon: <Bookmark className="w-5 h-5" /> },
            { id: 'tools', label: 'Araçlarım', icon: <Settings className="w-5 h-5" /> },
        ] : []),
    ];
    const isToolsActive = ['tools', 'wallet', 'orders', 'appointments', 'routes', 'passport'].includes(activeTab);

    return (
        <main className="theme-vet min-h-screen bg-background text-foreground pb-32 overflow-x-hidden">
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3">
                <div className="max-w-2xl mx-auto grid grid-cols-[40px_1fr_40px] items-center gap-2">
                    <button onClick={() => { if (typeof window !== 'undefined' && window.history.length > 2) router.back(); else router.push('/home'); }}
                        aria-label="Geri" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-black text-center truncate">{displayUser?.username || displayName}</h1>
                    {isOwnProfile ? (
                        <button onClick={() => window.dispatchEvent(new CustomEvent('open-moffi-settings'))} aria-label="Ayarlar"
                            className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center"><Settings className="w-5 h-5" /></button>
                    ) : (
                        <button onClick={() => setMoreOpen(true)} aria-label="Diğer işlemler"
                            className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center"><MoreHorizontal className="w-5 h-5" /></button>
                    )}
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4">
                <div className="flex items-center gap-4">
                    <div className={`w-24 h-24 rounded-full overflow-hidden shrink-0 ${frameStyle === 'minimal' ? 'border border-card-border' : FRAME_CLASSES[frameStyle].md}`}>
                        {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                            : <div className={`w-full h-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-3xl font-black select-none`}>{initials}</div>}
                    </div>
                    <div className="flex-1 flex">
                        <Stat value={summary?.posts ?? 0} label="Gönderi" />
                        <Stat value={summary?.followers ?? 0} label="Takipçi" onClick={blocked ? undefined : () => openRelationsModal('followers')} />
                        <Stat value={summary?.following ?? 0} label="Takip" onClick={blocked ? undefined : () => openRelationsModal('following')} />
                    </div>
                </div>

                <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-black">{displayName}</span>
                        {displayUser?.is_prime && <BadgeCheck className="w-4 h-4 text-accent shrink-0" />}
                    </div>
                    {displayUser?.bio && <p className="text-sm font-semibold whitespace-pre-wrap">{displayUser.bio}</p>}
                    {city && <p className="text-xs font-semibold text-secondary inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" />{city}</p>}
                    {!isOwnProfile && summary?.followsMe && !summary.isFollowing && <p className="text-[11px] font-bold text-secondary">Seni takip ediyor</p>}
                    {!blocked && <FeaturedBadges ownerId={id} own={isOwnProfile} />}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    {isOwnProfile ? (
                        <>
                            <button onClick={() => {
                                setEditName(currentUser?.name || currentUser?.username || '');
                                setEditUsername(currentUser?.username || '');
                                setEditBio(currentUser?.bio || '');
                                setEditAvatarPreview(isPlaceholderUrl(currentUser?.avatar) ? null : (currentUser?.avatar || null));
                                setEditCoverPreview(isPlaceholderUrl(currentUser?.cover_photo) ? null : (currentUser?.cover_photo || null));
                                setIsEditing(true);
                            }} className="h-10 rounded-xl bg-card border border-card-border text-sm font-black">Profili düzenle</button>
                            <button onClick={shareProfile} className="h-10 rounded-xl bg-card border border-card-border text-sm font-black">Profili paylaş</button>
                        </>
                    ) : blocked ? (
                        <button onClick={toggleBlock} className="col-span-2 h-10 rounded-xl bg-card border border-card-border text-sm font-black">Engeli kaldır</button>
                    ) : (
                        <>
                            <FollowButton userId={id} initial={!!summary?.isFollowing} className="h-10 rounded-xl text-sm" onChange={loadSummary} />
                            <button onClick={handleMessageClick} className="h-10 rounded-xl bg-card border border-card-border text-sm font-black">Mesaj</button>
                        </>
                    )}
                </div>

                {blocked ? (
                    <div className="mt-8 text-center space-y-1">
                        <div className="text-base font-black">Bu hesabı engelledin</div>
                        <p className="text-sm font-semibold text-secondary">Gönderilerini ve hikâyelerini görmüyorsun; o da seninkileri görmüyor.</p>
                    </div>
                ) : (
                    <>
                        {(profilePets.length > 0 || isOwnProfile) && (
                            <section className="mt-5">
                                <div className="text-sm font-black mb-2">{isOwnProfile ? 'Hayvanlarım' : 'Hayvanları'}</div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {profilePets.map(pet => (
                                        <button key={pet.id} onClick={() => { if (isOwnProfile) { switchPet(pet.id); router.push('/pasaport'); } }}
                                            className={`flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-2xl bg-card border shrink-0 text-left ${isOwnProfile && activePet?.id === pet.id ? 'border-accent/50' : 'border-card-border'}`}>
                                            <Avatar src={pet.image} name={pet.name} className="w-11 h-11" />
                                            <span>
                                                <span className="block text-sm font-black">{pet.name}</span>
                                                <span className="block text-[11px] font-semibold text-secondary">
                                                    {[pet.breed || speciesLabel(pet.type), pet.ageLabel].filter(Boolean).join(' · ')}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                    {isOwnProfile && (
                                        <button onClick={() => setIsAddPetOpen(true)} aria-label="Hayvan ekle"
                                            className="w-14 h-14 shrink-0 self-center rounded-2xl border-2 border-dashed border-card-border flex items-center justify-center text-secondary">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}

                        <div className="flex mt-5 border-b border-card-border">
                            {tabs.map(tab => {
                                const on = tab.id === 'tools' ? isToolsActive : activeTab === tab.id;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-label={tab.label}
                                        className={`flex-1 h-11 flex items-center justify-center border-b-2 -mb-px ${on ? 'border-foreground text-foreground' : 'border-transparent text-secondary'}`}>
                                        {tab.icon}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {!blocked && (
                <AnimatePresence mode="wait">
                    {activeTab === 'posts' ? (
                        <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                            <ProfilePosts userId={id} saved={false} own={isOwnProfile} />
                        </motion.div>
                    ) : activeTab === 'saved' && isOwnProfile ? (
                        <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                            <ProfilePosts userId={id} saved own />
                        </motion.div>
                    ) : activeTab === 'tools' && isOwnProfile ? (
                        <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">

                            {/* Sağlık & Bakım Grubu */}
                            <div className="mb-6">
                                <h3 className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2">
                                    <Heart className="w-3 h-3 text-rose-400" /> Sağlık & Bakım
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/health')} className="col-span-2 p-5 rounded-[1.5rem] bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/20 hover:border-rose-500/40 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-zinc-900 dark:text-white">Sağlık Merkezi</p>
                                                <p className="text-[9px] font-bold text-rose-500/80 mt-0.5">Aşı, ilaç, kilo, muayene ve randevular</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-rose-400/50" />
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('passport')} className="col-span-2 p-4 rounded-[1.5rem] bg-gradient-to-br from-sky-500/10 to-blue-500/5 border border-sky-500/20 hover:border-sky-500/40 transition-colors flex flex-col gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-500">
                                            <FileText className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase">Pasaport</p>
                                            <p className="text-[8px] font-bold text-sky-500/80 uppercase mt-0.5">Kimlik Bilgileri</p>
                                        </div>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Finans & Alışveriş Grubu */}
                            <div className="mb-6">
                                <h3 className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2">
                                    <Wallet className="w-3 h-3 text-emerald-400" /> Finans & Alışveriş
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('wallet')} className="col-span-2 p-5 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">PawCoin</p>
                                                <p className="text-[9px] font-bold text-emerald-500/80 uppercase mt-0.5">Bakiye ve hareketler</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-emerald-400/50" />
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('orders')} className="col-span-2 p-4 rounded-[1.5rem] bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                                <Package className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-zinc-900 dark:text-white uppercase">Siparişler</p>
                                                <p className="text-[8px] font-bold text-amber-500/80 uppercase mt-0.5">Kargo Takibi</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-amber-400/50" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Sosyal & Aktivite Grubu */}
                            <div className="mb-6">
                                <h3 className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-indigo-400" /> Sosyal & Aktivite
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('routes')} className="p-4 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors flex flex-col gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                            <Map className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase">Rotalar</p>
                                            <p className="text-[8px] font-bold text-indigo-500/80 uppercase mt-0.5">Yürüyüşler</p>
                                        </div>
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab('saved')} className="p-4 rounded-[1.5rem] bg-gradient-to-br from-zinc-500/10 to-gray-500/5 border border-zinc-500/20 hover:border-zinc-500/40 transition-colors flex flex-col gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-zinc-500/20 flex items-center justify-center text-zinc-500">
                                            <Bookmark className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase">Kaydedilenler</p>
                                            <p className="text-[8px] font-bold text-zinc-500/80 uppercase mt-0.5">Koleksiyon</p>
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'wallet' && isOwnProfile ? (
                        <motion.div key="wallet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <button onClick={() => setActiveTab('tools')} className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 hover:text-emerald-500 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
                            </button>
                            <WalletTab />
                        </motion.div>
                    ) : activeTab === 'orders' && isOwnProfile ? (
                        <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <button onClick={() => setActiveTab('tools')} className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 hover:text-emerald-500 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
                            </button>
                            <OrdersTab />
                        </motion.div>
                    ) : activeTab === 'passport' && isOwnProfile ? (
                        <motion.div key="passport" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <button onClick={() => setActiveTab('tools')} className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 hover:text-emerald-500 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
                            </button>
                            {activePet ? (
                                <HealthProvider><div className="theme-vet text-foreground"><PassportHome /></div></HealthProvider>
                            ) : (
                                <div className="text-center py-20 opacity-40 font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em]">Lütfen bir pati seçin</div>
                            )}
                        </motion.div>
                    ) : activeTab === 'routes' && isOwnProfile ? (
                        <motion.div key="routes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4">
                            <button onClick={() => setActiveTab('tools')} className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 hover:text-emerald-500 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
                            </button>
                            <RoutesTab activePet={activePet} />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
                )}
            </div>

            <Sheet open={moreOpen} onClose={() => { setMoreOpen(false); setBlockConfirm(false); }} title={blockConfirm ? `${displayName} engellensin mi?` : displayName}>
                {blockConfirm ? (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-secondary">Birbirinizin gönderilerini, yorumlarını ve hikâyelerini görmezsiniz; takip bağlantınız kaldırılır.</p>
                        <button onClick={toggleBlock} className="w-full h-12 rounded-2xl bg-red-600 text-white font-black text-sm">Engelle</button>
                    </div>
                ) : (
                    <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border text-sm font-bold">
                        <button onClick={() => { setMoreOpen(false); shareProfile(); }} className="w-full px-4 py-3.5 text-left">Profili paylaş</button>
                        {currentUser && <button onClick={() => { setMoreOpen(false); setReportUserOpen(true); }} className="w-full px-4 py-3.5 text-left text-red-600">Hesabı şikâyet et</button>}
                        {currentUser && (summary?.blockedByMe
                            ? <button onClick={toggleBlock} className="w-full px-4 py-3.5 text-left">Engeli kaldır</button>
                            : <button onClick={() => setBlockConfirm(true)} className="w-full px-4 py-3.5 text-left text-red-600">Bu hesabı engelle</button>)}
                    </div>
                )}
            </Sheet>
            <ReportModal isOpen={reportUserOpen} onClose={() => setReportUserOpen(false)} entityType="user" entityId={id} />

            {/* Hayvan ekleme: ana sayfayla aynı akış (tek sistem) */}
            <AddPetFlow isOpen={isAddPetOpen} onClose={() => setIsAddPetOpen(false)} />

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
                editPhone={editPhone}
                setEditPhone={setEditPhone}
            />

            {/* UNCLAIMED MATCH MODAL */}
            <AnimatePresence>
                {isClaimModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
                        >
                            <button onClick={() => setIsClaimModalOpen(false)} className="absolute top-4 right-4 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                            <h2 className="text-xl font-black uppercase text-foreground mb-4 italic">🎉 Kayıtların Bulundu!</h2>
                            <p className="text-sm text-secondary mb-4">
                                Telefon numaranla eşleşen klinik kayıtları bulduk. Klinik onaylayınca hayvanın ve geçmiş kaydı hesabına eklenir.
                            </p>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {unclaimedMatches.map(match => (
                                    <div key={match.id} className="p-4 rounded-2xl bg-foreground/5 border border-card-border flex flex-col gap-2">
                                        <div>
                                            <h3 className="font-bold text-foreground text-sm">{match.pet_name || 'İsimsiz Pati'}</h3>
                                            <p className="text-xs text-secondary">{match.clinic_name}</p>
                                        </div>
                                        <button
                                            disabled={claimLoading || match.requested}
                                            onClick={async () => {
                                                setClaimLoading(true);
                                                try {
                                                    await apiService.requestManualClaim(match.id);
                                                    showToast('Kliniğe onay isteği gönderildi.', 'CheckCircle2', 'text-emerald-500');
                                                    setUnclaimedMatches(prev => prev.map(m => m.id === match.id ? { ...m, requested: true } : m));
                                                } catch (err) {
                                                    showToast(err instanceof Error ? err.message : 'İşlem yapılamadı.', 'AlertCircle', 'text-red-500');
                                                } finally {
                                                    setClaimLoading(false);
                                                }
                                            }}
                                            className="w-full mt-1 py-2 bg-foreground/10 text-foreground text-xs font-black rounded-xl hover:bg-foreground/20 transition disabled:opacity-50"
                                        >
                                            {match.requested ? 'İstek gönderildi · klinik onayı bekleniyor' : 'Kliniğe onay isteği gönder'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══ RELATIONS MODAL (Followers / Following) ══ */}
            <AnimatePresence>
                {isRelationsModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRelationsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="relative w-full max-w-lg bg-[#0E0E15]/95 backdrop-blur-2xl border-t border-black/10 dark:border-white/10 rounded-t-[3rem] p-6 max-h-[75vh] flex flex-col z-10 overflow-hidden shadow-[0_-15px_40px_rgba(0,0,0,0.6)]"
                        >
                            {/* Drag handle */}
                            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-4 shrink-0" />

                            {/* Header / Tabs */}
                            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4 shrink-0">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => openRelationsModal('followers')}
                                        className={`text-sm font-black uppercase tracking-wider transition-colors ${
                                            relationsModalTab === 'followers' ? 'text-emerald-400' : 'text-black/50 dark:text-white/40'
                                        }`}
                                    >
                                        Takipçiler
                                    </button>
                                    <button
                                        onClick={() => openRelationsModal('following')}
                                        className={`text-sm font-black uppercase tracking-wider transition-colors ${
                                            relationsModalTab === 'following' ? 'text-emerald-400' : 'text-black/50 dark:text-white/40'
                                        }`}
                                    >
                                        Takip Edilenler
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsRelationsModalOpen(false)}
                                    className="w-7 h-7 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full flex items-center justify-center text-black/60 dark:text-white/60 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* List Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                                {relationsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                        <p className="text-black/50 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">Yükleniyor...</p>
                                    </div>
                                ) : relationsList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center justify-center text-black/40 dark:text-white/30 mb-4">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <p className="text-black/60 dark:text-white/60 text-sm font-black uppercase tracking-wider">Henüz Kimse Yok</p>
                                        <p className="text-black/40 dark:text-white/30 text-xs mt-1">Burada listelenecek herhangi bir kullanıcı bulunamadı.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {relationsList.map(userItem => {
                                            const initials = getInitials(userItem.name, userItem.username);
                                            const gradient = seedColor(userItem.username || userItem.id);
                                            return (
                                                <div
                                                    key={userItem.id}
                                                    onClick={() => {
                                                        setIsRelationsModalOpen(false);
                                                        router.push(`/profile/${userItem.id}`);
                                                    }}
                                                    className="flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar */}
                                                        <div className="w-11 h-11 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shrink-0 bg-[#222]">
                                                            {userItem.avatar ? (
                                                                <img src={userItem.avatar} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className={`w-full h-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-black uppercase`}>
                                                                    {initials}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Info */}
                                                        <div>
                                                            <p className="text-zinc-900 dark:text-white font-black text-xs uppercase leading-tight">
                                                                {userItem.name || 'Moffi Kullanıcısı'}
                                                            </p>
                                                            <p className="text-emerald-400 font-bold text-[10px] mt-0.5">
                                                                @{userItem.username || 'moffi_user'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-black/40 dark:text-white/30" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

// ── Profil gönderileri / kaydedilenler ────────────────────────
function ProfilePosts({ userId, saved, own }: { userId: string; saved: boolean; own: boolean }) {
    const [posts, setPosts] = useState<GridPost[] | null>(null);
    useEffect(() => {
        if (!userId || userId === 'me') return;
        let alive = true;
        const load = () => socialService.profilePosts(userId, saved).then(p => { if (alive) setPosts(p); }).catch(() => { if (alive) setPosts([]); });
        load();
        window.addEventListener(POSTS_CHANGED_EVENT, load);
        return () => { alive = false; window.removeEventListener(POSTS_CHANGED_EVENT, load); };
    }, [userId, saved]);
    if (!posts) return <LoadingBlocks count={2} />;
    if (posts.length === 0) {
        return (
            <div className="py-12 text-center space-y-1">
                <p className="text-base font-black">{saved ? 'Kaydedilen gönderi yok' : 'Henüz gönderi yok'}</p>
                <p className="text-sm font-semibold text-secondary">{saved ? 'Beğendiğin gönderileri kaydederek burada toplayabilirsin.' : own ? 'İlk anını Keşfet\'te paylaş.' : ''}</p>
                {own && !saved && <a href="/community/yeni" className="inline-flex mt-2 h-10 px-4 items-center rounded-xl bg-accent text-white text-sm font-black">Gönderi paylaş</a>}
            </div>
        );
    }
    return <PostGrid posts={posts} />;
}
