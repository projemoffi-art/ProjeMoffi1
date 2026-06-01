'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings, Sparkles, Edit3, Grid3X3, List, User, PawPrint,
    Plus, Check, Users, Globe, Package, Coins, Calendar, Map, ChevronLeft, Bookmark, BadgeCheck,
    Syringe, X, Zap, ShieldCheck, Clock, Award, Download, ChevronRight, Camera, AlertCircle, Share2, Trash2, TrendingUp, Activity, Play,
    Heart, MessageCircle, MoreHorizontal, Image as ImageIcon, Video, Mic, Crown, Footprints, Zap as SOSZap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PET_PERSONALITIES } from '@/lib/mockData';
import Image from 'next/image';
import { QRCodeSVG } from "qrcode.react";
import { FamilyTab } from '../profile/FamilyTab';
import { PassportTab } from '../profile/PassportTab';
import { EcosystemReportSheet } from './EcosystemReportSheet';
import { useVaccineSchedule } from "@/hooks/useVaccineSchedule";
import { usePet } from "@/context/PetContext";
import { WalletTab } from "../profile/WalletTab";
import { OrdersTab } from "../profile/OrdersTab";
import { AppointmentsTab } from "../profile/AppointmentsTab";
import { AddVaccineModal } from "../profile/AddVaccineModal";
import { RoutesTab } from "../profile/RoutesTab";

const ACCENT_COLORS = [
    { id: 'default', color: '#6366F1' }, 
    { id: 'midnight', color: '#1E293B' },
    { id: 'silver', color: '#E2E8F0' },
    { id: 'ocean', color: '#0EA5E9' },
    { id: 'emerald', color: '#10B981' },
    { id: 'rose', color: '#FB7185' },
    { id: 'champagne', color: '#FDE68A' },
    { id: 'violet', color: '#8B5CF6' },
];

const getColorHex = (id: string, defaultColor: string) => {
    const color = ACCENT_COLORS.find(c => c.id === id);
    return id === 'default' ? defaultColor : (color ? color.color : defaultColor);
};


interface ProfileTabProps {
    user: any;
    onEditProfile: () => void;
    onAddPet: () => void;
    onSettings: () => void;
    onPetQR: (pet: any) => void;
    onSOSSettings: (pet: any) => void;
    onLike?: (id: number) => void;
    isCommentsDisabled?: boolean;
    posts?: any[];
    isSmartShopEnabled?: boolean;
    onSubViewChange?: (view: any) => void;
}

function StatItem({ value, label }: { value: any, label: string }) {
    return (
        <div className="text-center">
            <p className="text-foreground font-black text-lg leading-tight">{value}</p>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}

function TabButton({ active, icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className={cn("flex-1 py-4 flex flex-col items-center gap-1 transition-all relative", active ? "text-foreground" : "text-secondary opacity-50")}>
            {React.cloneElement(icon, { className: "w-6 h-6" })}
            {active && <motion.div layoutId="tabLine" className="absolute bottom-0 w-1/2 h-0.5 bg-foreground" />}
        </button>
    );
}


// ============================================================
// GERÇEK PROFİL GALERİSİ — Supabase Entegrasyonu
// Instagram tarzı: kullanıcının paylaştığı gönderiler burada
// ============================================================
function RealPostsGallery({ userId, onPostClick }: { userId?: string; onPostClick?: (post: any) => void }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
    const [selectedPost, setSelectedPost] = useState<any>(null);

    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        loadUserPosts();
    }, [userId]);

    const loadUserPosts = async () => {
        setIsLoading(true);
        try {
            // Dynamic import to avoid circular deps
            const { apiService } = await import('@/services/apiService');
            const data = await (apiService as any).getUserPosts(userId);
            setPosts(data || []);
        } catch (err) {
            console.error('Profile posts fetch error:', err);
            setPosts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = posts.filter(p => {
        if (filterType === 'all') return true;
        if (filterType === 'video') return p.type === 'video';
        return p.type !== 'video';
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-0.5 px-0">
                {Array(9).fill(0).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-8 text-center"
            >
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-card-border flex items-center justify-center mb-6">
                    <ImageIcon className="w-9 h-9 text-white/20" />
                </div>
                <h3 className="text-foreground font-black text-lg uppercase italic tracking-tighter">Henüz Gönderi Yok</h3>
                <p className="text-secondary text-sm mt-2 leading-relaxed">
                    Topluluğa ilk gönderini paylaş ve profil galerin burada canlansın.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
            {/* FILTER BAR */}
            <div className="flex gap-2 px-4 pb-3">
                {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'image', label: 'Fotoğraf' },
                    { id: 'video', label: 'Video' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilterType(f.id as any)}
                        className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                            filterType === f.id
                                ? "bg-foreground text-background border-foreground"
                                : "bg-white/5 text-secondary border-card-border hover:bg-white/10"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
                <span className="ml-auto text-[10px] font-bold text-secondary self-center">{filtered.length} gönderi</span>
            </div>

            {/* INSTAGRAM-STYLE GRID */}
            <div className="grid grid-cols-3 gap-0.5">
                <AnimatePresence mode="popLayout">
                    {filtered.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: (i % 9) * 0.04 }}
                            className="aspect-square relative overflow-hidden bg-card cursor-pointer group"
                            onClick={() => { setSelectedPost(post); onPostClick?.(post); }}
                        >
                            {post.media_url || post.image ? (
                                post.type === 'video' ? (
                                    <>
                                        <video
                                            src={post.media_url || post.image}
                                            className="w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Play className="w-4 h-4 text-white fill-white drop-shadow-lg" />
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={post.media_url || post.image}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        alt={post.desc || 'Gönderi'}
                                        loading="lazy"
                                    />
                                )
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-8 h-8 text-white/30" />
                                </div>
                            )}

                            {/* HOVER OVERLAY — Instagram style */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                                <div className="flex items-center gap-1.5 text-white">
                                    <Heart className="w-5 h-5 fill-white" />
                                    <span className="font-black text-sm">{post.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-white">
                                    <MessageCircle className="w-5 h-5 fill-white" />
                                    <span className="font-black text-sm">{post.comments || 0}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* POST DETAIL MODAL */}
            <AnimatePresence>
                {selectedPost && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedPost(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed inset-x-4 top-20 bottom-20 z-[510] bg-[#1C1C1E] rounded-[2.5rem] overflow-hidden flex flex-col border border-card-border shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Media */}
                            <div className="relative flex-1 bg-black">
                                {selectedPost.type === 'video' ? (
                                    <video
                                        src={selectedPost.media_url || selectedPost.image}
                                        className="w-full h-full object-contain"
                                        controls
                                        autoPlay
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={selectedPost.media_url || selectedPost.image}
                                        className="w-full h-full object-contain"
                                        alt={selectedPost.desc}
                                    />
                                )}
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="absolute top-4 right-4 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-card-border"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Post Info */}
                            <div className="p-5 shrink-0 space-y-3">
                                {selectedPost.desc && (
                                    <p className="text-foreground text-sm leading-relaxed">{selectedPost.desc}</p>
                                )}
                                <div className="flex items-center gap-4 text-secondary text-xs font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Heart className="w-4 h-4 text-red-400" /> {selectedPost.likes || 0} beğeni
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MessageCircle className="w-4 h-4 text-cyan-400" /> {selectedPost.comments || 0} yorum
                                    </span>
                                    <span className="ml-auto text-secondary/60">{selectedPost.time}</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function ProfileTab({
    user,
    onEditProfile,
    onAddPet,
    onSettings,
    onPetQR,
    onSOSSettings,
    onLike,
    isCommentsDisabled,
    posts = [],
    isSmartShopEnabled = true,
    showAuraBadge = true,
    onOpenActionHub,
    activeSubView = 'main',
    onSubViewChange,
    isAuraStudioOpen,
    setIsAuraStudioOpen,
    auraSettings,
    setAuraSettings
}: ProfileTabProps) {
    const { 
        pets, 
        activePet, 
        switchPet, 
        customRecords: globalCustomRecords,
        setCustomRecords: updateGlobalCustomRecords,
        recordDocuments: globalRecordDocuments,
        setRecordDocuments: updateGlobalRecordDocuments,
        orders: globalOrders,
        appointments: globalAppointments,
        walkRoutes: globalWalkRoutes
    } = usePet();

    const [viewMode, setViewMode] = useState<'personal' | 'pets'>('pets');
    const [isAuraVisible, setIsAuraVisible] = useState(true);
    
    const activePetIndex = pets.findIndex(p => p.id === activePet?.id);
    const safeActivePetIndex = activePetIndex === -1 ? 0 : activePetIndex;

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isAddVaccineModalOpen, setIsAddVaccineModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentRecordIdForUpload, setCurrentRecordIdForUpload] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [isPdfReady, setIsPdfReady] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordIdToDelete, setRecordIdToDelete] = useState<string | null>(null);



    const currentOrders = activePet?.id ? (globalOrders[activePet.id] || []) : [];
    const currentAppointments = activePet?.id ? (globalAppointments[activePet.id] || []) : [];
    const currentRoutes = activePet?.id ? (globalWalkRoutes[activePet.id] || []) : [];
    const { schedule, isLoading: isScheduleLoading } = useVaccineSchedule(activePet?.id || 'pet-1');
    const customRecords = activePet?.id ? (globalCustomRecords[activePet.id] || []) : [];
    const recordDocuments = activePet?.id ? (globalRecordDocuments[activePet.id] || {}) : {};

    const allRecords = [...(schedule || []), ...customRecords].sort((a, b) => {
        const parseDate = (d: any) => d ? new Date(d).getTime() : 0;
        return parseDate(a.dateAdministered || a.dueDate) - parseDate(b.dateAdministered || b.dueDate);
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentRecordIdForUpload && activePet?.id) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newDoc = reader.result as string;
                const currentDocs = (globalRecordDocuments[activePet.id]?.[currentRecordIdForUpload]) || [];
                updateGlobalRecordDocuments(activePet.id, currentRecordIdForUpload, [...currentDocs, newDoc]);
                setCurrentRecordIdForUpload(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteDocument = (recordId: string, docIndex: number) => {
        if (window.confirm("Bu belgeyi listeden kaldırmak istediğinizden emin misiniz?") && activePet?.id) {
            const currentDocs = (globalRecordDocuments[activePet.id]?.[recordId]) || [];
            updateGlobalRecordDocuments(activePet.id, recordId, currentDocs.filter((_, i) => i !== docIndex));
        }
    };

    const handleAddRecord = (record: any) => {
        if (activePet?.id) {
            const current = (globalCustomRecords[activePet.id] || []);
            updateGlobalCustomRecords(activePet.id, [...current, record]);
        }
    };

    return (
        <div className="h-auto w-full pb-32 bg-background">
            <AnimatePresence mode="wait">
                {activeSubView === 'main' ? (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-full h-48 bg-card relative overflow-hidden">
                        <img src={user?.cover_photo || "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=1200"} className="w-full h-full object-cover opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    </div>

                        <div className="px-6 relative -mt-16 mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-[2.5rem] border-4 border-background relative bg-card overflow-hidden shadow-2xl group/avatar z-10">
                                        <img src={user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                                        
                                        <div className="absolute bottom-1 left-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center border-4 border-background">
                                            <Check className="w-3 h-3 text-background" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 sm:gap-6 pr-0 sm:pr-4">
                                    <StatItem value={posts.length} label="Gönderi" />
                                    <StatItem value="1.2k" label="Takipçi" />
                                    <StatItem value="840" label="Takip" />
                                </div>
                            </div>

                            <div className="flex justify-between items-start">
                                <div className="flex-1">


                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-foreground leading-tight italic tracking-tighter uppercase">{user?.display_name || user?.name || 'Moffi Official'}</h2>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {user?.is_verified && <BadgeCheck className="w-5 h-5 text-accent" />}
                                            {(user?.subscription_status === 'plus' || user?.subscription_status === 'pro') && (
                                                <div className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-md text-[8px] font-black text-black uppercase italic tracking-tighter shadow-lg shadow-orange-500/20">M+ Premium</div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-accent font-bold text-xs mt-0.5 tracking-widest">@{user?.username?.toLowerCase() || 'moffi_user'}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <button onClick={onEditProfile} className="px-4 sm:px-6 py-2.5 rounded-2xl border border-card-border font-black text-[10px] uppercase tracking-widest bg-foreground/5 active:scale-95 transition-all text-foreground whitespace-nowrap">Düzenle</button>
                                    <button onClick={() => {
                                        onOpenActionHub?.();
                                        // Fail-safe global event for unified experience
                                        window.dispatchEvent(new CustomEvent('open-moffi-hub'));
                                    }} className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-card-border bg-accent/10 flex items-center justify-center text-accent active:scale-95 transition-all flex-shrink-0"><Zap className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <p className="text-secondary text-sm mt-4 leading-relaxed line-clamp-3 mb-6">{user?.bio || 'Moffi Ekosistemine Hoşgeldiniz ✨'}</p>

                            <div className="mb-0 flex justify-around border-b border-card-border sticky top-0 bg-background/80 backdrop-blur-xl z-20">
                                <TabButton active={viewMode === 'personal'} icon={<User />} label="Hesabım" onClick={() => setViewMode('personal')} />
                                <TabButton active={viewMode === 'pets'} icon={<PawPrint />} label="Patilerim" onClick={() => setViewMode('pets')} />
                            </div>

                            <AnimatePresence mode="wait">
                                {viewMode === 'personal' ? (
                                    <PersonalAccountView key="personal" user={user} onSubViewChange={onSubViewChange} />
                                ) : (
                                    <PetDashboardView 
                                        key="pets" pets={pets} activePet={activePet} switchPet={switchPet} 
                                        onAddPet={onAddPet} onPetQR={onPetQR} safeActivePetIndex={safeActivePetIndex} 
                                        setIsReportOpen={setIsReportOpen} posts={posts} user={user}
                                        onSubViewChange={onSubViewChange}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="subview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-32">
                        <div className="flex items-center gap-4 mb-10">
                            <button 
                                onClick={() => onSubViewChange?.('main')} 
                                className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground border border-card-border active:scale-90 transition-all"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase leading-none">
                                    {activeSubView === 'wallet' ? 'Cüzdan MerkeZİ' : 
                                     activeSubView === 'orders' ? 'Siparişlerim' :
                                     activeSubView === 'appointments' ? 'Sağlık & Takvim' :
                                     activeSubView === 'routes' ? 'Yürüyüş Rotaları' : 
                                     activeSubView === 'impact' ? 'Etki Analizi' :
                                     activeSubView === 'bookmarks' ? 'Kaydedilenler' :
                                     activeSubView === 'passport' ? 'Dijital PaspORT' : activeSubView}
                                </h3>
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Geri Dön</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeSubView === 'family' && <FamilyTab />}
                            {activeSubView === 'passport' && <PassportTab pet={activePet} />}
                            {activeSubView === 'wallet' && <WalletTab />}
                            {activeSubView === 'orders' && <OrdersTab orders={currentOrders} />}
                            {activeSubView === 'routes' && <RoutesTab routes={currentRoutes} activePet={activePet} />}
                            {activeSubView === 'appointments' && (
                                <AppointmentsTab 
                                    activePet={activePet}
                                    isScheduleLoading={isScheduleLoading}
                                    allRecords={allRecords}
                                    recordDocuments={recordDocuments}
                                    onAddRecord={() => setIsAddVaccineModalOpen(true)}
                                    onDeleteRecord={(id: string) => { setRecordIdToDelete(id); setIsDeleteModalOpen(true); }}
                                    onUploadDocument={(id: string) => { setCurrentRecordIdForUpload(id); fileInputRef.current?.click(); }}
                                    onDeleteDocument={handleDeleteDocument}
                                    currentAppointments={currentAppointments}
                                />
                            )}
                            {activeSubView === 'bookmarks' && <div className="text-center py-20 opacity-20 font-black text-foreground uppercase italic tracking-[0.5em]">Koleksiyon Boş</div>}
                            {activeSubView === 'impact' && <div className="text-center py-20 opacity-20 font-black text-foreground uppercase italic tracking-[0.5em]">Etki Analizi Aktif</div>}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <EcosystemReportSheet isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onViewPassport={() => onSubViewChange?.('passport')} pet={activePet} isSmartShopEnabled={isSmartShopEnabled} />

            <AddVaccineModal 
                isOpen={isAddVaccineModalOpen}
                onClose={() => setIsAddVaccineModalOpen(false)}
                onAdd={handleAddRecord}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
    );
}

function PersonalAccountView({ user, onSubViewChange }: any) {
    const auraTags = [
        { label: 'Doğa Kaşifi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Sabah Yürüyüşçüsü', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'Topluluk Rehberi', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'M+ Kurucu Üye', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="py-8 space-y-8">
            {/* GERÇEK PROFİL GALERİSİ — Supabase */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-xl font-black text-foreground italic uppercase tracking-tighter">Paylaşımlarım</h3>
                </div>
                <RealPostsGallery userId={user?.id} />
            </div>
        </motion.div>
    );
}


function PetDashboardView({ pets, activePet, switchPet, onAddPet, posts, safeActivePetIndex, setIsReportOpen, user, onSubViewChange }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="py-8 space-y-12">
            

            <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-black text-foreground italic uppercase tracking-tighter">Patilerim</h3>
                <button onClick={onAddPet} className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-[10px] sm:text-xs font-black text-accent uppercase tracking-widest active:scale-90 transition-all hover:bg-accent/20">+ EKLE</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
                {pets.map((pet: any) => (
                    <button key={pet.id} onClick={() => switchPet(pet.id)} className={cn("min-w-[130px] bg-card border border-card-border rounded-[2.2rem] p-5 flex flex-col items-center gap-4", activePet?.id === pet.id ? "border-accent/40 bg-accent/5" : "")}>
                        <img src={pet.image || pet.avatar} className="w-16 h-16 rounded-2xl object-cover" />
                        <span className="font-black text-foreground text-[11px] uppercase">{pet.name}</span>
                    </button>
                ))}
            </div>

            {/* PREMIUM ECOSYSTEM DASHBOARD */}
            <div className="mt-10 mb-10">
                <div className="relative overflow-hidden bg-glass backdrop-blur-3xl rounded-[3.5rem] p-8 border border-glass-border shadow-2xl group/card">
                    {/* PET ICON MINI-STRIP */}
                    <div className="flex items-center gap-2 mb-8 relative z-10 bg-white/5 p-1.5 rounded-2xl w-fit">
                        {pets.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => switchPet(p.id)}
                                className={cn(
                                    "w-9 h-9 rounded-xl transition-all overflow-hidden border border-card-border",
                                    activePet?.id === p.id ? "ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#1A1A2E] scale-110 shadow-lg shadow-cyan-500/20" : "opacity-30 grayscale hover:opacity-100 hover:grayscale-0"
                                )}
                            >
                                <img src={p.image || p.avatar || p.cover_photo} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase leading-none">Ekosistem <span className="text-accent">Verisi</span></h3>
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1.5">Gerçek Zamanlı Analiz</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10"><Zap className="w-5 h-5 text-orange-400" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Modu</p>
                                        <p className="text-xs font-black text-foreground uppercase italic tracking-tighter">{(PET_PERSONALITIES[activePet?.name] || PET_PERSONALITIES['default']).mood}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                                        activePet?.is_lost ? "bg-red-500/10 border-red-500/10" : "bg-emerald-500/10 border-emerald-500/10"
                                    )}>
                                        <ShieldCheck className={cn("w-5 h-5", activePet?.is_lost ? "text-red-500" : "text-emerald-400")} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Güvenlik</p>
                                        <p className={cn(
                                            "text-xs font-black uppercase italic tracking-tighter",
                                            activePet?.is_lost ? "text-red-500" : "text-foreground"
                                        )}>
                                            {activePet?.is_lost ? "KRİTİK DURUM ⚠️" : "Aşılar Korunaklı 🛡️"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ANIMATED CIRCULAR PROGRESS */}
                        <div className="w-28 h-28 rounded-full border-4 border-card-border p-1 relative flex items-center justify-center text-center group-hover/card:scale-110 transition-transform duration-500">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                <motion.circle 
                                    initial={{ strokeDashoffset: 289 }}
                                    animate={{ 
                                        strokeDashoffset: 289 * (1 - (activePet?.is_lost ? 0.05 : (safeActivePetIndex === 0 ? 0.74 : 0.92))) 
                                    }}
                                    cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="289" 
                                    className={activePet?.is_lost ? "text-red-500" : "text-cyan-500"} 
                                    strokeLinecap="round" 
                                />
                            </svg>
                            <div className="text-center">
                                <p className={cn(
                                    "text-2xl font-black leading-none",
                                    activePet?.is_lost ? "text-red-500" : "text-foreground"
                                )}>
                                    {activePet?.is_lost ? "SOS" : `%${safeActivePetIndex === 0 ? 74 : 92}`}
                                </p>
                                <p className="text-[8px] font-black text-secondary uppercase tracking-widest mt-1">
                                    {activePet?.is_lost ? "KRİTİK" : "Emniyet"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-card-border flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{activePet?.name || 'Pet'} Verisi Şifrelendi</p>
                        </div>
                        <button 
                            onClick={() => setIsReportOpen(true)}
                            className="px-6 py-2.5 bg-foreground/5 hover:bg-foreground/10 border border-card-border rounded-2xl text-[10px] font-black text-foreground uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-black/20"
                        >
                            DETAYLI RAPOR
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-0.5 rounded-3xl overflow-hidden">
                {posts
                    .filter((post: any) => {
                        // Island Bridge: Filter posts by active pet's ID
                        if (!activePet) return true;
                        return !post.petId || String(post.petId) === String(activePet.id);
                    })
                    .map((post: any) => (
                    <div key={post.id} className="aspect-square bg-gray-900 relative">
                        <Image src={post.media || post.media_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} fill className="object-cover" alt="Post" />
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function MenuCard({ icon, label, onClick, fullWidth }: any) {
    return (
        <button 
            onClick={onClick} 
            className={cn(
                "bg-card border border-card-border rounded-[2.2rem] flex flex-col items-center gap-2 transition-all active:scale-[0.98] hover:bg-foreground/5",
                fullWidth ? "w-full p-12 bg-glass" : "p-4 py-6"
            )}
        >
            <div className={cn(
                "bg-foreground/5 rounded-xl flex items-center justify-center",
                fullWidth ? "w-20 h-20" : "w-10 h-10"
            )}>{icon}</div>
            <span className={cn(
                "font-black text-foreground uppercase tracking-[0.2em] text-center",
                fullWidth ? "text-sm" : "text-[8px]"
            )}>{label}</span>
        </button>
    );
}

function ActionListItem({ icon, title, subtitle, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full bg-card border border-card-border p-6 rounded-[2.5rem] flex items-center justify-between">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center">{icon}</div>
                <div className="text-left">
                    <h4 className="text-foreground font-black text-sm uppercase">{title}</h4>
                    <p className="text-[9px] text-secondary font-bold uppercase mt-0.5">{subtitle}</p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary/40" />
        </button>
    );
}

