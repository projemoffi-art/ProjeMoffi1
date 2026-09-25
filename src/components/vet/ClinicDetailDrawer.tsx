"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Phone, Navigation, Star, MapPin, Maximize,
    Calendar, Clock, ShieldCheck, ChevronRight, ChevronLeft,
    Users, MessageSquare, Info, Megaphone, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { ChatMessageList, ChatComposer } from "@/components/chat/MessageThread";
import { VetClinic } from "@/types/domain";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/haptics";
import { FilterChips } from "@/components/vet/find/FilterChips";

// Faz 25 — Ekran 4 (bkz. design-reference/vet-final/README.md). Baran'ın
// "kaba" bulgusu bu bileşenle ilgiliydi — ama veri katmanı tamamen gerçekti
// (getClinicDetails/getClinicReviews/getClinicCampaigns/gerçek sohbet/gerçek
// yorum gönderme). Bu turda SADECE görsel dil yeniden inşa edildi, hiçbir
// state/fetch/handler mantığı değişmedi. Referansın 4 sekmesi (Genel Bakış/
// Hizmetler/Yorumlar/Ekip) yerine, GERÇEK veri modeliyle birebir örtüşen 3
// sekme korundu (info/doctors/reviews) — "Hizmetler" içeriği zaten Genel
// Bakış'taki gerçek `clinic.features` listesinde gösteriliyordu, ayrı bir
// sekme açmak uydurma bir ayrım olurdu (README'nin "genel gözlem" notuna göre).

interface ClinicDetailDrawerProps {
    clinicId: string | null;
    clinicData?: any;
    onClose: () => void;
    onBookAppointment: (clinic: VetClinic) => void;
    defaultOpenReviewForm?: boolean;
    defaultReviewAppointmentId?: string | null;
}

import { usePet } from "@/context/PetContext";

const TABS: { key: 'info' | 'doctors' | 'reviews'; label: string; icon: any }[] = [
    { key: 'info', label: 'Genel Bakış', icon: Info },
    { key: 'doctors', label: 'Ekip', icon: Users },
    { key: 'reviews', label: 'Yorumlar', icon: Star },
];

export function ClinicDetailDrawer({ clinicId, clinicData, onClose, onBookAppointment, defaultOpenReviewForm, defaultReviewAppointmentId }: ClinicDetailDrawerProps) {
    const { activePet } = usePet();
    const [clinic, setClinic] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'doctors' | 'reviews'>('info');
    const drawerRef = useRef<HTMLDivElement>(null);

    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [reviewableAppointments, setReviewableAppointments] = useState<any[]>([]);
    const [activeReviewAppointmentId, setActiveReviewAppointmentId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
    const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadConversation = async () => {
        if (!clinicId || !currentUser?.id) return;
        const messages = await apiService.getChatMessages(clinicId, 'clinic');
        setChatMessages(messages);
        await apiService.markChatAsRead(clinicId, 'clinic');
    };

    useEffect(() => {
        if (isChatOpen) {
            loadConversation();
            pollingRef.current = setInterval(() => { loadConversation(); }, 4000);
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [isChatOpen, clinicId, currentUser]);

    const handleSendMessage = async (text: string, attachmentUrl?: string) => {
        if ((!text.trim() && !attachmentUrl) || !clinicId || !currentUser?.id || isSendingMessage) return;
        setIsSendingMessage(true);
        try {
            await apiService.sendChatMessage(clinicId, text.trim(), 'clinic', undefined, attachmentUrl);
            await loadConversation();
        } catch (err) {
            console.error("Error in handleSendMessage:", err);
            throw err;
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleRecallMessage = async (messageId: string) => {
        if (!window.confirm("Bu mesajı geri almak istediğine emin misin?")) return;
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
            if (defaultOpenReviewForm) {
                setActiveTab('reviews');
            } else {
                setActiveTab('info');
                setActiveReviewAppointmentId(null);
            }
        } else {
            setClinic(null);
            setActiveTab('info');
            setActiveReviewAppointmentId(null);
        }
    }, [clinicId, clinicData, defaultOpenReviewForm, activePet?.id]);

    useEffect(() => {
        if (defaultOpenReviewForm && reviewableAppointments.length > 0 && !activeReviewAppointmentId) {
            const targetId = (defaultReviewAppointmentId && reviewableAppointments.some(a => a.id === defaultReviewAppointmentId))
                ? defaultReviewAppointmentId
                : reviewableAppointments[0]?.id;
            setActiveReviewAppointmentId(targetId);
        }
    }, [reviewableAppointments, defaultOpenReviewForm, defaultReviewAppointmentId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const targetId = clinicData ? clinicData.id : clinicId;
            const res = await apiService.getClinicDetails(targetId!);

            const cData = { ...res, logo: res?.avatar_url || res?.logo || null };
            setClinic(cData);

            try {
                const camps = await apiService.getClinicCampaigns(targetId!);
                const activeCamps = camps.filter((c: any) => {
                    if (c.status && c.status !== 'active') return false;
                    const expirationStr = c.expires_at || c.ends_at;
                    if (expirationStr && new Date(expirationStr) <= new Date()) return false;
                    const campTarget = c.target_pet_type || 'all';
                    if (campTarget !== 'all') {
                        if (!activePet || !activePet.type) return false;
                        if (campTarget !== activePet.type) return false;
                    }
                    return true;
                });
                setCampaigns(activeCamps);
            } catch (err) {
                console.error("Kampanyalar yüklenirken hata:", err);
            }

            if (clinicData) {
                const finalClinic = {
                    ...clinicData,
                    ...cData,
                    imageUrl: clinicData?.avatar_url || clinicData?.logo || res?.avatar_url || res?.logo || null,
                    distance: 'Yakında',
                    address: clinicData.name + ' Çevresi'
                };
                setClinic(finalClinic);
            }

            const reviewsRes = await apiService.getClinicReviews(targetId!);
            setReviews(reviewsRes.reviews);
            setAverageRating(reviewsRes.averageRating);

            if (user) {
                const rAppts = await apiService.getReviewableAppointments(user.id);
                const clinicReviewableAppts = rAppts.filter((apt: any) => apt.clinic_id === targetId);
                setReviewableAppointments(clinicReviewableAppts);
            }
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
            const targetId = clinicData ? clinicData.id : clinicId;
            const success = await apiService.submitReview(targetId!, activeReviewAppointmentId, rating, comment);
            if (success) {
                haptics.success();
                setRating(0);
                setComment("");
                setActiveReviewAppointmentId(null);
                const reviewsRes = await apiService.getClinicReviews(targetId!);
                setReviews(reviewsRes.reviews);
                setAverageRating(reviewsRes.averageRating);
                if (currentUser) {
                    const rAppts = await apiService.getReviewableAppointments(currentUser.id);
                    const clinicReviewableAppts = rAppts.filter((apt: any) => apt.clinic_id === targetId);
                    setReviewableAppointments(clinicReviewableAppts);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const clinicAvatarUrl = clinic?.avatar_url || clinic?.logo || clinic?.imageUrl || clinicData?.avatar_url || clinicData?.logo || clinicData?.imageUrl || null;

    return (
        <>
            <AnimatePresence>
                {clinicId && (
                    <div key="drawer-wrapper">
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
                            className="fixed top-0 right-0 z-[6200] w-full sm:w-[440px] h-full bg-background shadow-2xl border-l border-card-border flex flex-col overflow-y-auto no-scrollbar"
                        >
                            {isChatOpen ? (
                                <div className="flex flex-col h-full bg-card">
                                    <div className="flex items-center gap-3 p-4 border-b border-card-border sticky top-0 bg-card z-10">
                                        <button onClick={() => setIsChatOpen(false)} className="w-9 h-9 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                                            <ChevronLeft className="w-4.5 h-4.5 text-foreground" />
                                        </button>
                                        {clinicAvatarUrl ? (
                                            <img src={clinicAvatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                                <span className="font-black text-slate-400">{(clinic?.name || clinicData?.name || 'K')[0]}</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-black text-[13px] text-foreground">{clinic?.name || clinicData?.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold">Sohbet</p>
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
                                        <ChatComposer onSend={handleSendMessage} uploadImage={(file) => apiService.uploadMedia(file)} sending={isSendingMessage} />
                                    </div>
                                </div>
                            ) : loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                    <span className="text-2xl animate-bounce">🐾</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bilgiler getiriliyor...</p>
                                </div>
                            ) : clinic ? (
                                <>
                                    <div className="relative h-56 shrink-0">
                                        {clinicAvatarUrl ? (
                                            <img src={clinicAvatarUrl} className="w-full h-full object-cover" alt={clinic.name} />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                                <span className="text-5xl font-black text-slate-300">{(clinic?.name || 'K')[0]}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                                        <button onClick={onClose} className="absolute top-5 left-5 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                            <X className="w-5 h-5 text-foreground" />
                                        </button>
                                        {clinicAvatarUrl && (
                                            <button onClick={() => setIsPhotoLightboxOpen(true)} className="absolute top-5 right-5 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                                <Maximize className="w-4.5 h-4.5 text-foreground" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="px-6 pt-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-lg font-black text-foreground">{clinic.name}</h1>
                                            {clinic.isPremium && (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    <ShieldCheck className="w-3 h-3" /> Moffi Onaylı
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <span className="text-[12px] font-black text-foreground">{(averageRating === 0 && reviews.length === 0) ? '—' : averageRating.toFixed(1)}</span>
                                            <span className="text-[12px] font-bold text-slate-400">({reviews.length} yorum)</span>
                                            {clinic.distance && <><span className="text-slate-300 mx-0.5">·</span><span className="text-[11px] font-bold text-slate-400">{clinic.distance}</span></>}
                                            <span className="text-slate-300 mx-0.5">·</span>
                                            {clinic.isOpenNow ? (
                                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Şu an açık</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Şu an kapalı</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2.5 mb-5">
                                            <button
                                                onClick={() => { if (clinic.phone) { haptics.tap(); window.location.href = `tel:${clinic.phone}`; } }}
                                                className={cn("flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl transition-all active:scale-95", clinic.phone ? "bg-orange-500" : "bg-gray-100 dark:bg-white/5 opacity-50")}
                                            >
                                                <Phone className={cn("w-4.5 h-4.5", clinic.phone ? "text-white" : "text-slate-400")} />
                                                <span className={cn("text-[9px] font-black uppercase tracking-wide", clinic.phone ? "text-white" : "text-slate-400")}>{clinic.phone ? "Şimdi Ara" : "Tel Yok"}</span>
                                            </button>
                                            <button
                                                onClick={() => { haptics.tap(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.name + " " + clinic.address)}`, '_blank'); }}
                                                className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl active:scale-95 transition-all"
                                            >
                                                <Navigation className="w-4.5 h-4.5 text-orange-500" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Yol Tarifi</span>
                                            </button>
                                            <button
                                                onClick={() => { haptics.tap(); setIsChatOpen(true); }}
                                                className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl active:scale-95 transition-all"
                                            >
                                                <MessageSquare className="w-4.5 h-4.5 text-orange-500" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Mesaj At</span>
                                            </button>
                                        </div>

                                        {campaigns.length > 0 && (
                                            <div className="mb-5 rounded-2xl border border-orange-200 dark:border-orange-500/20 overflow-hidden">
                                                {campaigns.map((camp) => (
                                                    <div key={camp.id} className="border-b border-orange-100 dark:border-orange-500/10 last:border-0 bg-orange-50/50 dark:bg-orange-500/5">
                                                        <button onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)} className="w-full flex items-center justify-between p-3.5 text-left">
                                                            <div className="flex items-center gap-2.5">
                                                                <Megaphone className="w-4 h-4 text-orange-500 shrink-0" />
                                                                <div>
                                                                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block">Özel Fırsat</span>
                                                                    <span className="text-[12px] font-black text-foreground">{camp.title}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-md">{camp.discount_value}</span>
                                                                <ChevronRight className={cn("w-4 h-4 text-orange-500 transition-transform", expandedCampaignId === camp.id ? "rotate-90" : "")} />
                                                            </div>
                                                        </button>
                                                        <AnimatePresence>
                                                            {expandedCampaignId === camp.id && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                    <div className="p-3.5 pt-0 text-[11px] text-slate-500">
                                                                        {camp.media_url && <img src={camp.media_url} className="w-full rounded-xl mb-2.5 max-h-40 object-cover" alt="" />}
                                                                        {camp.description && <p className="mb-2.5 font-medium">{camp.description}</p>}
                                                                        {camp.coupon_code && (
                                                                            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/10 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-500/20">
                                                                                <Tag className="w-3 h-3 text-orange-500" />
                                                                                <span className="text-[11px] font-black text-orange-600">{camp.coupon_code}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <FilterChips options={TABS} value={activeTab} onChange={(k) => { setActiveTab(k); drawerRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }} />

                                        <div className="py-5 pb-28">
                                            {activeTab === 'info' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Adres</span>
                                                                <span className="text-[12px] font-bold text-foreground">{clinic.address}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Çalışma Durumu</span>
                                                                <span className={cn("text-[12px] font-bold", clinic.isOpenNow ? "text-emerald-600" : "text-red-500")}>{clinic.isOpenNow ? "Şu an açık" : "Şu an kapalı"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {clinic.features?.filter(Boolean).length > 0 && (
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Sunulan Hizmetler</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {clinic.features.filter(Boolean).map((feature: string, idx: number) => (
                                                                    <div key={`${feature}-${idx}`} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                                        <span className="text-[10.5px] font-black text-foreground">{feature}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {activeTab === 'doctors' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                                    {clinic.doctors?.map((doctor: any) => (
                                                        <div key={doctor.id} className="bg-card rounded-2xl p-4 border border-card-border shadow-moffi-card">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5">
                                                                    {doctor.imageUrl ? <img src={doctor.imageUrl} className="w-full h-full object-cover" alt="" /> : (
                                                                        <div className="w-full h-full flex items-center justify-center"><span className="font-black text-slate-400">{(doctor.name || 'D')[0]}</span></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-[12px] font-black text-foreground block truncate">{doctor.name}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400">{doctor.specialization}</span>
                                                                </div>
                                                            </div>
                                                            {doctor.bio && <p className="text-[10.5px] font-medium text-slate-500 mt-3 leading-relaxed">{doctor.bio}</p>}
                                                            {doctor.workingHours && (
                                                                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400">
                                                                    <Clock className="w-3 h-3" /> {doctor.workingHours}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!clinic.doctors || clinic.doctors.length === 0) && (
                                                        <div className="text-center py-16 px-6">
                                                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hekim bilgisi bulunmuyor</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {activeTab === 'reviews' && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    {reviewableAppointments.length > 0 && (
                                                        <div className="mb-5 space-y-3">
                                                            {reviewableAppointments.map((apt: any, index: number) => (
                                                                <div key={apt.id || apt.appointment_id || `apt-${index}`}>
                                                                    {activeReviewAppointmentId !== apt.id ? (
                                                                        <button onClick={() => setActiveReviewAppointmentId(apt.id)} className="w-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl py-3.5 flex flex-col items-center gap-0.5">
                                                                            <span className="text-[9.5px] font-bold text-orange-500">{new Date(apt.appointment_date).toLocaleDateString('tr-TR')} tarihli randevun için</span>
                                                                            <span className="text-[11px] font-black text-orange-600">Değerlendirme Yaz</span>
                                                                        </button>
                                                                    ) : (
                                                                        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3 shadow-moffi-card">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[11px] font-black text-foreground">Deneyimini puanla</span>
                                                                                <button onClick={() => setActiveReviewAppointmentId(null)}><X className="w-4 h-4 text-slate-400" /></button>
                                                                            </div>
                                                                            <div className="flex justify-center gap-1.5">
                                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                                    <button key={s} onClick={() => setRating(s)} className="active:scale-90 transition-transform">
                                                                                        <Star className={cn("w-7 h-7", s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <textarea
                                                                                value={comment} onChange={(e) => setComment(e.target.value)}
                                                                                placeholder="Deneyimini anlat... (isteğe bağlı)"
                                                                                className="w-full bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-[11px] font-medium text-foreground placeholder:text-slate-400 outline-none resize-none min-h-[80px]"
                                                                            />
                                                                            <button
                                                                                onClick={handleSubmitReview}
                                                                                disabled={rating === 0 || isSubmittingReview}
                                                                                className="w-full h-11 rounded-xl bg-orange-500 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50"
                                                                            >
                                                                                {isSubmittingReview ? 'Gönderiliyor...' : 'Gönder'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {reviews.length > 0 ? (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-5">
                                                                <span className="text-3xl font-black text-foreground">{averageRating.toFixed(1)}</span>
                                                                <div>
                                                                    <div className="flex gap-0.5 mb-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />)}</div>
                                                                    <span className="text-[10px] font-bold text-slate-400">{reviews.length} değerlendirme</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {reviews.map((review: any, index: number) => (
                                                                    <div key={review.id || `rev-${index}`}>
                                                                        <div className="flex justify-between items-start mb-1.5">
                                                                            <div className="flex items-center gap-2.5">
                                                                                {review.user?.avatar ? <img src={review.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /> : (
                                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><span className="text-[11px] font-black text-slate-400">{(review.user?.name || 'U')[0]}</span></div>
                                                                                )}
                                                                                <div>
                                                                                    <span className="text-[11.5px] font-black text-foreground block">{review.user?.name}</span>
                                                                                    <span className="text-[9.5px] font-bold text-slate-400">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-0.5 shrink-0">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("w-2.5 h-2.5", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />)}</div>
                                                                        </div>
                                                                        {review.comment && <p className="text-[11px] font-medium text-slate-500 leading-relaxed">"{review.comment}"</p>}
                                                                        {review.clinic_reply && (
                                                                            <div className="mt-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl ml-2.5">
                                                                                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-1">Klinik Yanıtı</span>
                                                                                <p className="text-[10.5px] font-medium text-slate-500 leading-relaxed">{review.clinic_reply}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-16 px-6">
                                                            <Star className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Henüz değerlendirme yok</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="fixed bottom-0 right-0 w-full sm:w-[440px] z-30 p-4 bg-card border-t border-card-border">
                                        <button
                                            onClick={() => { haptics.tap(); onBookAppointment(clinic); }}
                                            className="w-full h-12 rounded-full bg-orange-500 text-white font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <Calendar className="w-4 h-4" /> Randevu Al
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isPhotoLightboxOpen && clinicAvatarUrl && (
                    <motion.div
                        key="photo-lightbox"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsPhotoLightboxOpen(false)}
                        className="fixed inset-0 z-[6300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <img src={clinicAvatarUrl} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} alt="" />
                        <button onClick={() => setIsPhotoLightboxOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
