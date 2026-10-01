"use client";

import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Phone, Navigation, Star, MapPin, Calendar, Clock, ShieldCheck, ChevronRight, ChevronLeft,
    Users, MessageSquare, Megaphone, Tag, Heart, Share2, Globe, CheckCircle2
} from "lucide-react";
import { cn, showToast } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { ChatMessageList, ChatComposer } from "@/components/chat/MessageThread";
import { VetClinic } from "@/types/domain";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/haptics";
import { getBusinessTypeConfig } from "@/config/businessTypes";
import { CHAT_MESSAGE_EVENT, type ChatMessageEventDetail } from "@/context/ChatContext";
import type { BusinessType } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { CategoryTile, FilterChips, directionsUrl, formatDistance, openStatusText } from "@/components/vet/VetShared";
import { openShare } from '@/components/common/ShareSheet';

// Referans Ekran 4 (klinik detayı) + 8 (yorumlar) + 9 (ekip) + 10 (hizmetler): design-reference/vet-final.

interface ClinicDetailDrawerProps {
    clinicId: string | null;
    clinicData?: any;
    businessType?: BusinessType;
    onClose: () => void;
    onBookAppointment: (clinic: VetClinic, serviceName?: string) => void;
    defaultOpenReviewForm?: boolean;
    defaultReviewAppointmentId?: string | null;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

type Tab = 'info' | 'services' | 'reviews' | 'team';
type ReviewSort = 'all' | 'newest' | 'highest' | 'lowest';

export function ClinicDetailDrawer({
    clinicId, clinicData, businessType = 'vet', onClose, onBookAppointment,
    defaultOpenReviewForm, defaultReviewAppointmentId, isFavorite, onToggleFavorite
}: ClinicDetailDrawerProps) {
    const { activePet } = usePet();
    const businessConfig = getBusinessTypeConfig(businessType);
    const [clinic, setClinic] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const drawerRef = useRef<HTMLDivElement>(null);

    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [reviewSort, setReviewSort] = useState<ReviewSort>('all');
    const [reviewableAppointments, setReviewableAppointments] = useState<any[]>([]);
    const [activeReviewAppointmentId, setActiveReviewAppointmentId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const targetId = clinicData ? clinicData.id : clinicId;

    const loadConversation = async () => {
        if (!targetId || !currentUser?.id) return;
        const messages = await apiService.getChatMessages(targetId, 'clinic');
        setChatMessages(messages);
        await apiService.markChatAsRead(targetId, 'clinic');
    };

    // Yeni mesaj/okundu bilgisi ChatContext'in tek Realtime kanalından gelir (yoklama yok).
    useEffect(() => {
        if (!isChatOpen) return;
        loadConversation();
        const onChat = (e: Event) => {
            const { senderId, receiverId } = (e as CustomEvent<ChatMessageEventDetail>).detail;
            if (senderId === targetId || receiverId === targetId) loadConversation();
        };
        window.addEventListener(CHAT_MESSAGE_EVENT, onChat);
        return () => window.removeEventListener(CHAT_MESSAGE_EVENT, onChat);
    }, [isChatOpen, targetId, currentUser]);

    const handleSendMessage = async (text: string, attachmentUrl?: string) => {
        if ((!text.trim() && !attachmentUrl) || !targetId || !currentUser?.id || isSendingMessage) return;
        setIsSendingMessage(true);
        try {
            await apiService.sendChatMessage(targetId, text.trim(), 'clinic', undefined, attachmentUrl);
            await loadConversation();
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleRecallMessage = async (messageId: string) => {
        try {
            await apiService.recallChatMessage(messageId);
            loadConversation();
        } catch (err) {
            console.error("Error in handleRecallMessage:", err);
        }
    };

    useEffect(() => {
        if (clinicId) {
            fetchDetails();
            setIsChatOpen(false);
            setActiveTab(defaultOpenReviewForm ? 'reviews' : 'info');
            if (!defaultOpenReviewForm) setActiveReviewAppointmentId(null);
        } else {
            setClinic(null);
            setActiveTab('info');
            setActiveReviewAppointmentId(null);
        }
    }, [clinicId, clinicData?.id, defaultOpenReviewForm, activePet?.id]);

    useEffect(() => {
        if (defaultOpenReviewForm && reviewableAppointments.length > 0 && !activeReviewAppointmentId) {
            const target = (defaultReviewAppointmentId && reviewableAppointments.some(a => a.id === defaultReviewAppointmentId))
                ? defaultReviewAppointmentId
                : reviewableAppointments[0]?.id;
            setActiveReviewAppointmentId(target);
        }
    }, [reviewableAppointments, defaultOpenReviewForm, defaultReviewAppointmentId]);

    const loadReviews = async () => {
        const reviewsRes = await apiService.getClinicReviews(targetId!);
        setReviews(reviewsRes.reviews);
        setAverageRating(reviewsRes.averageRating);
    };

    const loadReviewable = async (userId: string) => {
        const rAppts = await apiService.getReviewableAppointments(userId);
        setReviewableAppointments(rAppts.filter((apt: any) => apt.clinic_id === targetId));
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            const res = await apiService.getClinicDetails(targetId!);
            if (!res) {
                setClinic(null);
                return;
            }
            setClinic({
                ...(clinicData || {}),
                ...res,
                calculated_distance: clinicData?.calculated_distance,
            });

            apiService.getClinicCampaigns(targetId!).then(camps => {
                setCampaigns(camps.filter((c: any) => {
                    if (c.status && c.status !== 'active') return false;
                    const expirationStr = c.expires_at || c.ends_at;
                    if (expirationStr && new Date(expirationStr) <= new Date()) return false;
                    const campTarget = c.target_pet_type || 'all';
                    return campTarget === 'all' || (!!activePet?.type && campTarget === activePet.type);
                }));
            }).catch(err => console.error("Kampanyalar yüklenirken hata:", err));

            await loadReviews();
            if (user) await loadReviewable(user.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!activeReviewAppointmentId || rating === 0) return;
        setIsSubmittingReview(true);
        try {
            const success = await apiService.submitReview(targetId!, activeReviewAppointmentId, rating, comment);
            if (success) {
                haptics.success();
                setRating(0);
                setComment("");
                setActiveReviewAppointmentId(null);
                await loadReviews();
                if (currentUser) await loadReviewable(currentUser.id);
                showToast("Değerlendirmen yayınlandı, teşekkürler!", "CheckCircle2", "text-emerald-500 font-bold");
            }
        } catch (err: any) {
            showToast(err?.message || "Değerlendirme gönderilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/vet?${businessType !== 'vet' ? `type=${businessType}&` : ''}clinic=${targetId}`;
        openShare({ title: clinic?.name || 'Moffi işletmesi', text: clinic?.address || undefined, url, image: clinic?.coverUrl || clinic?.imageUrl || null });
    };

    const offeredShortcuts = useMemo(() => {
        const features: string[] = (clinic?.services || []).map((s: any) => (s.service_name || '').toLocaleLowerCase('tr-TR'));
        return businessConfig.customerShortcuts.filter(sc => features.some(f => sc.keywords.some(k => f.includes(k))));
    }, [clinic?.services, businessConfig]);

    const distribution = useMemo(() => [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => Math.round(r.rating) === star).length
    })), [reviews]);

    const sortedReviews = useMemo(() => {
        const list = [...reviews];
        if (reviewSort === 'newest') list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        if (reviewSort === 'highest') list.sort((a, b) => b.rating - a.rating);
        if (reviewSort === 'lowest') list.sort((a, b) => a.rating - b.rating);
        return list;
    }, [reviews, reviewSort]);

    const heroUrl = clinic?.coverUrl || clinic?.imageUrl || clinicData?.imageUrl || null;
    const distance = formatDistance(clinic?.calculated_distance);

    return (
        <>
            <AnimatePresence>
                {clinicId && (
                    <div key="drawer-wrapper" className="theme-vet">
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-[6100] bg-black/30 backdrop-blur-sm"
                        />

                        <motion.div
                            key="drawer-panel"
                            ref={drawerRef}
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 240 }}
                            className="fixed top-0 right-0 z-[6200] w-full sm:w-[440px] h-full bg-background text-foreground shadow-2xl border-l border-card-border flex flex-col overflow-y-auto no-scrollbar"
                        >
                            {isChatOpen ? (
                                <div className="flex flex-col h-full bg-card">
                                    <div className="flex items-center gap-3 p-4 border-b border-card-border sticky top-0 bg-card z-10">
                                        <button onClick={() => setIsChatOpen(false)} aria-label="Geri" className="w-9 h-9 rounded-full bg-card-border/40 flex items-center justify-center">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-card-border/40 flex items-center justify-center shrink-0">
                                            {clinic?.logoUrl || clinic?.imageUrl
                                                ? <img src={clinic.logoUrl || clinic.imageUrl} className="w-full h-full object-cover" alt="" />
                                                : <span className="font-black text-secondary">{(clinic?.name || 'K').charAt(0)}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-sm truncate">{clinic?.name}</h3>
                                            <p className="text-[11px] text-secondary font-semibold">Mesajlar</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col no-scrollbar">
                                        <ChatMessageList
                                            messages={chatMessages}
                                            onRecall={handleRecallMessage}
                                            emptyLabel="Henüz mesaj yok"
                                            emptyIcon={<MessageSquare className="w-12 h-12 mb-4 mx-auto" />}
                                        />
                                    </div>
                                    <div className="p-4 border-t border-card-border bg-card sticky bottom-0">
                                        <ChatComposer onSend={handleSendMessage} uploadImage={(file) => apiService.uploadMedia(file, 'posts')} sending={isSendingMessage} />
                                    </div>
                                </div>
                            ) : loading && !clinic ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                    <span className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                                    <p className="text-xs font-semibold text-secondary">Bilgiler yükleniyor…</p>
                                </div>
                            ) : !clinic ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                    <p className="text-sm font-bold text-secondary">Bu işletmenin bilgilerine şu an ulaşılamıyor.</p>
                                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-card border border-card-border text-sm font-bold">Kapat</button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative h-56 shrink-0 bg-card-border/40">
                                        {heroUrl ? (
                                            <button onClick={() => setLightboxUrl(heroUrl)} className="w-full h-full" aria-label="Fotoğrafı büyüt">
                                                <img src={heroUrl} className="w-full h-full object-cover" alt={clinic.name} />
                                            </button>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-5xl font-black text-secondary/40">{(clinic.name || 'K').charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute top-5 inset-x-5 flex items-center justify-between">
                                            <button onClick={onClose} aria-label="Kapat" className="w-10 h-10 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={handleShare} aria-label="Paylaş" className="w-10 h-10 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                                {onToggleFavorite && (
                                                    <button onClick={onToggleFavorite} aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'} aria-pressed={isFavorite} className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                                        <Heart className={cn("w-4 h-4", isFavorite ? "fill-accent text-accent" : "text-zinc-900")} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 pt-5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-xl font-black">{clinic.name}</h1>
                                            {clinic.isVerified && (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    <ShieldCheck className="w-3 h-3" /> Moffi onaylı
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[12px]">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <span className="font-black">{reviews.length > 0 ? averageRating.toFixed(1) : 'Yeni'}</span>
                                            <span className="font-semibold text-secondary">({reviews.length} yorum)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[12px] font-semibold text-secondary">
                                            {distance && <><span>{distance}</span><span>·</span></>}
                                            <span className={cn("flex items-center gap-1", clinic.isOpenNow ? "text-accent-secondary" : "")}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", clinic.isOpenNow ? "bg-accent-secondary" : "bg-secondary/40")} />
                                                {openStatusText(clinic)}
                                            </span>
                                        </div>

                                        {offeredShortcuts.length > 0 && (
                                            <div className="grid grid-cols-4 gap-2 mt-5">
                                                {offeredShortcuts.map(sc => (
                                                    <CategoryTile key={sc.key} shortcut={sc} size="sm" onClick={() => { setActiveTab('services'); }} />
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2.5 mt-5">
                                            {clinic.phone ? (
                                                <a href={`tel:${clinic.phone}`} className="flex items-center justify-center gap-2 h-11 rounded-xl bg-card border border-card-border text-sm font-bold">
                                                    <Phone className="w-4 h-4 text-accent" /> Ara
                                                </a>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2 h-11 rounded-xl bg-card border border-card-border text-sm font-bold text-secondary/60">
                                                    <Phone className="w-4 h-4" /> Telefon yok
                                                </span>
                                            )}
                                            <button onClick={() => { haptics.tap(); setIsChatOpen(true); }} className="flex items-center justify-center gap-2 h-11 rounded-xl bg-card border border-card-border text-sm font-bold">
                                                <MessageSquare className="w-4 h-4 text-accent" /> Mesaj gönder
                                            </button>
                                        </div>

                                        {campaigns.length > 0 && (
                                            <div className="mt-5 rounded-2xl border border-accent/20 overflow-hidden">
                                                {campaigns.map((camp) => (
                                                    <div key={camp.id} className="border-b border-accent/10 last:border-0 bg-accent/5">
                                                        <button onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)} className="w-full flex items-center justify-between p-3.5 text-left">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <Megaphone className="w-4 h-4 text-accent shrink-0" />
                                                                <div className="min-w-0">
                                                                    <span className="text-[10px] font-black text-accent block">Özel fırsat</span>
                                                                    <span className="text-[13px] font-black truncate block">{camp.title}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {camp.discount_value && <span className="bg-accent text-white text-[10px] font-black px-2 py-1 rounded-md">{camp.discount_value}</span>}
                                                                <ChevronRight className={cn("w-4 h-4 text-accent transition-transform", expandedCampaignId === camp.id && "rotate-90")} />
                                                            </div>
                                                        </button>
                                                        {expandedCampaignId === camp.id && (
                                                            <div className="p-3.5 pt-0 text-[12px] text-secondary">
                                                                {camp.media_url && <img src={camp.media_url} className="w-full rounded-xl mb-2.5 max-h-40 object-cover" alt="" />}
                                                                {camp.description && <p className="mb-2.5 font-medium">{camp.description}</p>}
                                                                {camp.coupon_code && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-accent/20">
                                                                        <Tag className="w-3 h-3 text-accent" />
                                                                        <span className="text-[12px] font-black text-accent select-all">{camp.coupon_code}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-6 border-b border-card-border flex gap-5 overflow-x-auto no-scrollbar" role="tablist">
                                            {([['info', 'Genel bakış'], ['services', 'Hizmetler'], ['reviews', 'Yorumlar'], ['team', 'Ekip']] as [Tab, string][]).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    role="tab"
                                                    aria-selected={activeTab === key}
                                                    onClick={() => setActiveTab(key)}
                                                    className={cn("pb-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-colors",
                                                        activeTab === key ? "border-accent text-foreground" : "border-transparent text-secondary")}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="py-5 pb-32">
                                            {activeTab === 'info' && (
                                                <div className="space-y-5">
                                                    {clinic.about && <p className="text-[13px] leading-relaxed text-secondary font-medium whitespace-pre-line">{clinic.about}</p>}
                                                    <InfoRow icon={MapPin} label="Adres">{clinic.address}</InfoRow>
                                                    {clinic.phone && (
                                                        <InfoRow icon={Phone} label="Telefon">
                                                            <a href={`tel:${clinic.phone}`} className="text-accent">{clinic.phone}</a>
                                                        </InfoRow>
                                                    )}
                                                    {clinic.website && (
                                                        <InfoRow icon={Globe} label="Web sitesi">
                                                            <a href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} target="_blank" rel="noopener noreferrer" className="text-accent break-all">{clinic.website.replace(/^https?:\/\//, '')}</a>
                                                        </InfoRow>
                                                    )}
                                                    <InfoRow icon={Clock} label="Çalışma saatleri">
                                                        <span className={clinic.isOpenNow ? "text-accent-secondary" : "text-secondary"}>{openStatusText(clinic)}</span>
                                                        {clinic.weeklyHours?.length > 0 && (
                                                            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[12px]">
                                                                {clinic.weeklyHours.map((h: { day: string; text: string }) => (
                                                                    <Fragment key={h.day}>
                                                                        <span className="font-semibold text-secondary">{h.day}</span>
                                                                        <span className={cn("font-bold tabular-nums", h.text === 'Kapalı' && "text-secondary")}>{h.text}</span>
                                                                    </Fragment>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </InfoRow>
                                                </div>
                                            )}

                                            {activeTab === 'services' && (
                                                (clinic.services || []).length === 0 ? (
                                                    <EmptyState icon={CheckCircle2} text="İşletme henüz hizmet listesini eklemedi." />
                                                ) : (
                                                    <div className="space-y-2.5">
                                                        {clinic.services.map((svc: any) => (
                                                            <button
                                                                key={svc.id || svc.service_name}
                                                                onClick={() => { haptics.tap(); onBookAppointment(clinic, svc.service_name); }}
                                                                className="w-full bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3 text-left hover:border-accent/30 transition-colors"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                                                    <CheckCircle2 className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-black truncate">{svc.service_name}</div>
                                                                    <div className="text-[11px] font-semibold text-secondary mt-0.5">
                                                                        {svc.price != null && <>{Number(svc.price).toLocaleString('tr-TR')} ₺ · </>}~{svc.duration_minutes || 30} dk
                                                                    </div>
                                                                    {svc.description && <div className="text-[11px] text-secondary mt-1 line-clamp-2">{svc.description}</div>}
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )
                                            )}

                                            {activeTab === 'reviews' && (
                                                <div>
                                                    {reviewableAppointments.length > 0 && (
                                                        <div className="mb-6 space-y-3">
                                                            {reviewableAppointments.map((apt: any) => (
                                                                <div key={apt.id}>
                                                                    {activeReviewAppointmentId !== apt.id ? (
                                                                        <button onClick={() => setActiveReviewAppointmentId(apt.id)} className="w-full bg-accent/5 border border-accent/20 rounded-2xl py-3.5 flex flex-col items-center gap-0.5">
                                                                            <span className="text-[11px] font-semibold text-secondary">{new Date(apt.appointment_date).toLocaleDateString('tr-TR', { timeZone: 'UTC' })} tarihli randevun için</span>
                                                                            <span className="text-[13px] font-black text-accent">Değerlendirme yaz</span>
                                                                        </button>
                                                                    ) : (
                                                                        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[13px] font-black">Deneyimini puanla</span>
                                                                                <button onClick={() => setActiveReviewAppointmentId(null)} aria-label="Kapat"><X className="w-4 h-4 text-secondary" /></button>
                                                                            </div>
                                                                            <div className="flex justify-center gap-1.5">
                                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                                    <button key={s} onClick={() => setRating(s)} aria-label={`${s} yıldız`}>
                                                                                        <Star className={cn("w-8 h-8", s <= rating ? "text-amber-400 fill-amber-400" : "text-card-border")} />
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <textarea
                                                                                value={comment} onChange={(e) => setComment(e.target.value)}
                                                                                placeholder="Deneyimini anlat (isteğe bağlı)"
                                                                                aria-label="Yorum"
                                                                                className="w-full bg-background border border-card-border rounded-xl p-3 text-[13px] font-medium outline-none focus:border-accent resize-none min-h-[80px]"
                                                                            />
                                                                            <button
                                                                                onClick={handleSubmitReview}
                                                                                disabled={rating === 0 || isSubmittingReview}
                                                                                className="w-full h-11 rounded-xl bg-accent text-white font-black text-sm disabled:opacity-40"
                                                                            >
                                                                                {isSubmittingReview ? 'Gönderiliyor…' : 'Değerlendirmeyi gönder'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {reviews.length > 0 ? (
                                                        <>
                                                            <div className="flex items-center gap-5 mb-5">
                                                                <div className="text-center shrink-0">
                                                                    <div className="text-4xl font-black tabular-nums">{averageRating.toFixed(1)}</div>
                                                                    <div className="flex gap-0.5 justify-center mt-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-card-border")} />)}</div>
                                                                    <div className="text-[11px] font-semibold text-secondary mt-1">{reviews.length} yorum</div>
                                                                </div>
                                                                <div className="flex-1 space-y-1">
                                                                    {distribution.map(d => (
                                                                        <div key={d.star} className="flex items-center gap-2 text-[11px] font-bold text-secondary">
                                                                            <span className="w-2 tabular-nums">{d.star}</span>
                                                                            <div className="flex-1 h-1.5 rounded-full bg-card-border/60 overflow-hidden">
                                                                                <div className="h-full bg-accent rounded-full" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                                                                            </div>
                                                                            <span className="w-5 text-right tabular-nums">{d.count}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <FilterChips<ReviewSort>
                                                                className="mb-4"
                                                                value={reviewSort}
                                                                onChange={setReviewSort}
                                                                options={[
                                                                    { id: 'all', label: 'Tümü' },
                                                                    { id: 'newest', label: 'En yeni' },
                                                                    { id: 'highest', label: 'En yüksek' },
                                                                    { id: 'lowest', label: 'En düşük' },
                                                                ]}
                                                            />
                                                            <div className="space-y-5">
                                                                {sortedReviews.map((review: any, index: number) => (
                                                                    <div key={review.id || `rev-${index}`}>
                                                                        <div className="flex justify-between items-start mb-1.5 gap-3">
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                {review.user?.avatar ? <img src={review.user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" /> : (
                                                                                    <div className="w-9 h-9 rounded-full bg-card-border/60 flex items-center justify-center"><span className="text-[12px] font-black text-secondary">{(review.user?.name || 'K').charAt(0)}</span></div>
                                                                                )}
                                                                                <div className="min-w-0">
                                                                                    <span className="text-[13px] font-black block truncate">{review.user?.name || 'Moffi kullanıcısı'}</span>
                                                                                    <span className="text-[11px] font-semibold text-secondary">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-0.5 shrink-0 mt-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-card-border")} />)}</div>
                                                                        </div>
                                                                        {review.comment && <p className="text-[13px] font-medium text-secondary leading-relaxed">{review.comment}</p>}
                                                                        {review.clinic_reply && (
                                                                            <div className="mt-2 p-3 bg-card border border-card-border rounded-xl ml-3">
                                                                                <span className="text-[11px] font-black text-accent block mb-1">İşletmenin yanıtı</span>
                                                                                <p className="text-[12px] font-medium text-secondary leading-relaxed">{review.clinic_reply}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <EmptyState icon={Star} text="Henüz değerlendirme yok. İlk randevudan sonra yorumlar burada görünecek." />
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'team' && (
                                                <div className="space-y-6">
                                                    {(clinic.doctors || []).length > 0 ? (
                                                        <div className="space-y-2.5">
                                                            {clinic.doctors.map((doctor: any) => (
                                                                <div key={doctor.id} className="bg-card rounded-2xl p-3.5 border border-card-border flex items-center gap-3">
                                                                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-card-border/50 flex items-center justify-center">
                                                                        {doctor.imageUrl ? <img src={doctor.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="font-black text-secondary">{(doctor.name || 'D').charAt(0)}</span>}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-[14px] font-black block truncate">{doctor.name}</span>
                                                                        {doctor.specialization && <span className="text-[12px] font-semibold text-secondary">{doctor.specialization}</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <EmptyState icon={Users} text={`${businessConfig.staffLabel} bilgisi henüz eklenmedi.`} />
                                                    )}

                                                    {(clinic.gallery || []).length > 0 && (
                                                        <div>
                                                            <h3 className="text-sm font-black mb-3">İşletmeden fotoğraflar</h3>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {clinic.gallery.map((url: string) => (
                                                                    <button key={url} onClick={() => setLightboxUrl(url)} className="aspect-square rounded-xl overflow-hidden bg-card-border/40">
                                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="fixed bottom-0 right-0 w-full sm:w-[440px] z-30 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-card border-t border-card-border grid grid-cols-[auto_1fr] gap-2.5">
                                        <a
                                            href={directionsUrl(clinic)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-12 px-5 rounded-xl border border-card-border bg-background font-black text-sm flex items-center justify-center gap-2"
                                        >
                                            <Navigation className="w-4 h-4 text-accent" /> Yol tarifi
                                        </a>
                                        <button
                                            onClick={() => { haptics.tap(); onBookAppointment(clinic); }}
                                            className="h-12 rounded-xl bg-accent text-white font-black text-sm flex items-center justify-center gap-2"
                                        >
                                            <Calendar className="w-4 h-4" /> {businessConfig.customerBookingLabel}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        key="photo-lightbox"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setLightboxUrl(null)}
                        className="fixed inset-0 z-[6300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <img src={lightboxUrl} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} alt="" />
                        <button onClick={() => setLightboxUrl(null)} aria-label="Kapat" className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-secondary" />
            </div>
            <div className="min-w-0 pt-0.5">
                <span className="text-[11px] font-semibold text-secondary block">{label}</span>
                <div className="text-[13px] font-bold">{children}</div>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
    return (
        <div className="text-center py-14 px-6">
            <Icon className="w-8 h-8 text-secondary/40 mx-auto mb-3" />
            <p className="text-secondary text-[13px] font-semibold">{text}</p>
        </div>
    );
}
