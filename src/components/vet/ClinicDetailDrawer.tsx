"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Phone, Navigation, Star, MapPin, 
    Calendar, Clock, ShieldCheck, ChevronRight,
    Users, MessageSquare, Info, Send, ChevronLeft, Megaphone, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { VetClinic } from "@/types/domain";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface ClinicDetailDrawerProps {
    clinicId: string | null;
    clinicData?: any; // The whole Place object from LiveMap
    onClose: () => void;
    onBookAppointment: (clinic: VetClinic) => void;
    defaultOpenReviewForm?: boolean;
    defaultReviewAppointmentId?: string | null;
}

import { useChat } from "@/context/ChatContext";
import { usePet } from "@/context/PetContext";

export function ClinicDetailDrawer({ clinicId, clinicData, onClose, onBookAppointment, defaultOpenReviewForm, defaultReviewAppointmentId }: ClinicDetailDrawerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { openChat, toggleChat } = useChat();
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

    // Chat States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const loadConversation = async () => {
        if (!clinicId || !currentUser?.id) return;
        const messages = await apiService.getConversation(clinicId, currentUser.id);
        setChatMessages(messages);
        
        // Okunmamışları okundu yap (Klinikten gelenler)
        await apiService.markMessagesRead(clinicId, currentUser.id, 'user');
    };

    useEffect(() => {
        if (isChatOpen) {
            loadConversation();
            pollingRef.current = setInterval(() => {
                loadConversation();
            }, 4000);
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isChatOpen, clinicId, currentUser]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !clinicId || !currentUser?.id || isSendingMessage) return;
        setIsSendingMessage(true);
        
        const messageToSend = chatInput.trim();
        
        // HEMEN temizle (Optimistic UI)
        setChatInput("");
        
        try {
            const success = await apiService.sendMessage(clinicId, currentUser.id, 'user', messageToSend);
            if (success) {
                // await ile bekletmiyoruz, arkaplanda yenilensin
                loadConversation();
            } else {
                console.error("sendMessage returned false");
                setChatInput(messageToSend); // Hata olursa geri al
            }
        } catch (err) {
            console.error("Error in handleSendMessage:", err);
            setChatInput(messageToSend); // Hata olursa geri al
        } finally {
            setIsSendingMessage(false);
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

    // Handle auto-opening the review form once data is loaded
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
            
            // Fix legacy references, ensure we use avatar_url for image
            const cData = {
                ...res,
                logo: res?.avatar_url || res?.logo || null
            };
            
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
            } else {
            }
            // Fetch Reviews
            const reviewsRes = await apiService.getClinicReviews(targetId!);
            setReviews(reviewsRes.reviews);
            setAverageRating(reviewsRes.averageRating);

            // Fetch reviewable appointments
            if (user) {
                const rAppts = await apiService.getReviewableAppointments(user.id);
                // Sadece BU kliniğe ait olan yorumsuz randevuları filtrele
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
                setRating(0);
                setComment("");
                setActiveReviewAppointmentId(null);
                
                // Refresh data
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
        <AnimatePresence>
            {clinicId && (
                <div key="drawer-wrapper">
                    {/* BACKDROP */}
                    <motion.div 
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[110] bg-black/20 dark:bg-black/40 backdrop-blur-sm sm:backdrop-blur-none"
                    />

                    {/* DRAWER PANEL (Apple Maps Style) */}
                    <motion.div
                        key="drawer-panel"
                        ref={drawerRef}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-[120] w-full sm:w-[480px] h-full bg-card shadow-[-20px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-card-border flex flex-col overflow-y-auto no-scrollbar pb-24"
                    >
                        {isChatOpen ? (
                            <div className="flex flex-col h-full bg-card">
                                <div className="flex items-center gap-3 p-4 border-b border-card-border sticky top-0 bg-card/80 backdrop-blur-md z-10">
                                    <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full hover:bg-foreground/5 text-secondary">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        {clinicAvatarUrl ? (
                                            <img src={clinicAvatarUrl} className="w-10 h-10 rounded-full object-cover bg-card" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                                                <span className="font-black text-secondary uppercase">{(clinic?.name || clinicData?.name || 'C')[0]}</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">{clinic?.name || clinicData?.name}</h3>
                                            <p className="text-[10px] text-secondary uppercase tracking-widest">Sohbet</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col no-scrollbar">
                                    {chatMessages.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center px-8">
                                            <MessageSquare className="w-12 h-12 mb-4 mx-auto" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Henüz mesaj yok</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg: any, index: number) => {
                                        const isMine = msg.sender_role === 'user';
                                        return (
                                            <div key={msg.id || `msg-${index}`} className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                                                <div className={cn("max-w-[75%] rounded-2xl p-4 text-sm relative", isMine ? "bg-accent text-white rounded-tr-sm" : "bg-card text-foreground border border-card-border rounded-tl-sm")}>
                                                    {msg.message}
                                                    <span className={cn("block text-[9px] mt-2 opacity-50 uppercase tracking-widest font-black", isMine ? "text-right" : "text-left")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="p-4 border-t border-card-border bg-card sticky bottom-0">
                                    <div className="flex items-center gap-2 relative">
                                        <input 
                                            type="text" 
                                            value={chatInput} 
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                            placeholder="Mesajınızı yazın..." 
                                            className="flex-1 bg-card border border-card-border rounded-full px-5 py-4 text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                                            disabled={isSendingMessage}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim() || isSendingMessage}
                                            className="bg-accent text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center flex-shrink-0 absolute right-1 top-1"
                                        >
                                            <Send className="w-5 h-5 -ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Bilgiler Getiriliyor...</p>
                            </div>
                        ) : clinic ? (
                            <>
                                {/* HEADER IMAGE & CLOSE */}
                                <div className="relative h-72 shrink-0 group">
                                    {clinicAvatarUrl ? (
                                        <img src={clinicAvatarUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
                                    ) : (
                                        <div className="w-full h-full bg-card flex items-center justify-center">
                                            <span className="text-6xl font-black text-secondary uppercase">{(clinic?.name || 'C')[0]}</span>
                                        </div>
                                    )}
                                    <button 
                                        onClick={onClose}
                                        className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-white hover:bg-black/10 dark:bg-white/10 transition-all active:scale-90"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="absolute bottom-6 left-8 right-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            {clinic.isPremium && (
                                                <span className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                                                    <ShieldCheck className="w-3 h-3" /> MOFFI VERIFIED
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none truncate">{clinic.name}</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex items-center gap-1.5 bg-zinc-150/80 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-card-border">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="text-xs font-black text-zinc-850 dark:text-white">{(averageRating === 0 && reviews.length === 0) ? '--' : averageRating.toFixed(1)}</span>
                                                <span className="text-[10px] text-zinc-500 dark:text-white/40 font-bold">({reviews.length})</span>
                                            </div>
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{clinic.distance} Uzaklıkta</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK ACTIONS */}
                                <div className="grid grid-cols-3 gap-3 p-6 shrink-0 bg-card border-b border-card-border">
                                    <button 
                                        onClick={() => {
                                            if (clinic.phone) window.location.href = `tel:${clinic.phone}`;
                                            else alert("Telefon bilgisi girilmedi");
                                        }}
                                        className={cn("flex flex-col items-center justify-center gap-2 py-4 rounded-2xl shadow-lg active:scale-95 transition-all group", clinic.phone ? "bg-accent shadow-accent/20" : "bg-card opacity-50")}
                                    >
                                        <Phone className={cn("w-5 h-5 transition-transform", clinic.phone ? "text-white group-hover:rotate-12" : "text-secondary")} />
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", clinic.phone ? "text-white" : "text-secondary")}>{clinic.phone ? "Şimdi Ara" : "Tel Yok"}</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.name + " " + clinic.address)}`, '_blank')}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-card border border-card-border rounded-2xl hover:brightness-95 transition-all active:scale-95"
                                    >
                                        <Navigation className="w-5 h-5 text-accent" />
                                        <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Yol Tarifi</span>
                                    </button>
                                    <button 
                                        onClick={() => setIsChatOpen(true)}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-card border border-card-border rounded-2xl hover:brightness-95 transition-all active:scale-95"
                                    >
                                        <MessageSquare className="w-5 h-5 text-accent" />
                                        <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Mesaj At</span>
                                    </button>
                                </div>

                                {/* CAMPAIGNS BANNER */}
                                {campaigns.length > 0 && (
                                    <div className="bg-accent/5 border-y border-accent/20">
                                        {campaigns.map((camp) => (
                                            <div key={camp.id} className="border-b border-accent/10 last:border-0">
                                                <button
                                                    onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <Megaphone className="w-4 h-4 text-accent" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-0.5">Özel Fırsat</div>
                                                            <div className="text-sm font-bold text-foreground leading-none">{camp.title}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-accent text-white text-[10px] font-black px-2 py-1 rounded-md">{camp.discount_value}</span>
                                                        <ChevronRight className={cn("w-4 h-4 text-accent transition-transform", expandedCampaignId === camp.id ? "rotate-90" : "")} />
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedCampaignId === camp.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 pt-0 text-sm text-secondary">
                                                                {camp.media_url && (
                                                                    <div className="mb-3 rounded-xl overflow-hidden max-w-sm mx-auto shadow-md">
                                                                        <img src={camp.media_url} alt={camp.title} className="w-full h-auto object-cover max-h-48" />
                                                                    </div>
                                                                )}
                                                                {camp.description && <p className="mb-3">{camp.description}</p>}
                                                                {camp.coupon_code && (
                                                                    <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
                                                                        <Tag className="w-3.5 h-3.5 text-accent" />
                                                                        <span className="text-xs font-black text-accent tracking-widest">{camp.coupon_code}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* TABS NAVIGATION */}
                                <div className="flex px-6 border-b border-card-border bg-card sticky top-0 z-20">
                                    {[
                                        { id: 'info', label: 'Genel', icon: Info },
                                        { id: 'doctors', label: 'Hekimler', icon: Users },
                                        { id: 'reviews', label: 'Yorumlar', icon: Star }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id as any);
                                                drawerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
                                            }}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative cursor-pointer",
                                                activeTab === tab.id ? "text-foreground" : "text-secondary hover:text-foreground"
                                            )}
                                        >
                                            <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-accent" : "")} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 inset-x-4 h-1 bg-accent rounded-t-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* CONTENT AREA */}
                                <div className="bg-card/50 dark:bg-card">
                                    <div className={cn("p-8 space-y-8", activeTab !== 'info' && "hidden")}>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4 p-5 bg-card border border-card-border rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                                        <MapPin className="w-6 h-6 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Konum</p>
                                                        <p className="text-sm font-bold text-foreground leading-snug">{clinic.address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-5 bg-card border border-card-border rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
                                                        <Clock className="w-6 h-6 text-accent" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Çalışma Durumu</p>
                                                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                            {clinic.isOpenNow ? (
                                                                <span className="text-accent flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> ŞU AN AÇIK</span>
                                                            ) : (
                                                                <span className="text-red-500 dark:text-red-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" /> ŞU AN KAPALI</span>
                                                            )}
                                                            <span className="text-card-border">•</span>
                                                            <span className="text-secondary">24 Saat Hizmet</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] px-1">Sunulan Hizmetler</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {clinic.features?.filter(Boolean).map((feature: string, idx: number) => (
                                                        <div key={`${feature}-${idx}`} className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-card-border group hover:bg-card-border transition-all cursor-default">
                                                            <ShieldCheck className="w-4 h-4 text-accent" />
                                                            <span className="text-xs font-black text-foreground uppercase tracking-tight">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                    <div className={cn("p-8 space-y-6", activeTab !== 'doctors' && "hidden")}>
                                            {clinic.doctors?.map((doctor: any) => (
                                                <div key={doctor.id} className="bg-card border border-card-border rounded-[2.5rem] p-6 group hover:bg-card-border transition-all relative overflow-hidden text-left">
                                                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-accent/10 blur-3xl rounded-full pointer-events-none" />

                                                    <div className="flex items-start gap-5 relative z-10">
                                                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-card-border group-hover:border-accent/30 transition-all shrink-0">
                                                            {doctor.imageUrl ? (
                                                                <img src={doctor.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            ) : (
                                                                <div className="w-full h-full bg-card-border flex items-center justify-center">
                                                                    <span className="text-3xl font-black text-secondary uppercase">{(doctor.name || 'D')[0]}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-accent/20 text-accent text-[8px] font-black px-2 py-0.5 rounded-md inline-block uppercase tracking-widest mb-2 border border-accent/20">
                                                                {doctor.specialization}
                                                            </div>
                                                            <h4 className="text-xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-3">{doctor.name}</h4>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Clock className="w-3.5 h-3.5 text-secondary" />
                                                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{doctor.workingHours}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 p-4 bg-card rounded-2xl border border-card-border relative z-10">
                                                        <p className="text-[11px] text-secondary font-medium leading-relaxed italic">
                                                            {doctor.bio}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!clinic.doctors || clinic.doctors.length === 0) && (
                                                <div className="py-20 text-center opacity-20">
                                                    <Users className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Hekim bilgisi bulunmuyor</p>
                                                </div>
                                            )}
                                        </div>

                                    <div className={cn("p-8 space-y-6", activeTab !== 'reviews' && "hidden")}>
                                            {/* Review Form / Button */}
                                            {reviewableAppointments.length > 0 && (
                                                <div className="mb-8 space-y-4">
                                                    {reviewableAppointments.map((apt: any, index: number) => (
                                                        <div key={apt.id || apt.appointment_id || `apt-${index}`}>
                                                            {activeReviewAppointmentId !== apt.id ? (
                                                                <button
                                                                    onClick={() => setActiveReviewAppointmentId(apt.id)}
                                                                    className="w-full bg-accent/10 border border-accent/30 text-accent py-4 rounded-2xl font-black text-xs tracking-widest shadow-sm hover:bg-accent hover:text-white transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                                                                >
                                                                    <span className="opacity-80 text-[10px] uppercase">{new Date(apt.appointment_date).toLocaleDateString()} tarihli randevunuz için</span>
                                                                    <span className="uppercase">Değerlendirme Yaz</span>
                                                                </button>
                                                            ) : (
                                                                <div className="bg-card border border-card-border rounded-[2rem] p-6 space-y-4 shadow-xl">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div>
                                                                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Deneyiminizi Puanlayın</h4>
                                                                            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">{new Date(apt.appointment_date).toLocaleDateString()} Randevusu</p>
                                                                        </div>
                                                                        <button onClick={() => setActiveReviewAppointmentId(null)} className="text-secondary hover:text-foreground transition-colors cursor-pointer self-start">
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex justify-center gap-2 pb-2">
                                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                                            <button
                                                                                key={s}
                                                                                type="button"
                                                                                onClick={() => setRating(s)}
                                                                                className="p-2 cursor-pointer transition-transform hover:scale-110"
                                                                            >
                                                                                <Star className={cn("w-8 h-8 transition-colors", s <= rating ? "text-yellow-500 fill-current" : "text-card-border")} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <textarea
                                                                        value={comment}
                                                                        onChange={(e) => setComment(e.target.value)}
                                                                        placeholder="Deneyiminizi anlatın... (İsteğe bağlı)"
                                                                        className="w-full bg-card border border-card-border rounded-xl p-4 text-xs text-foreground placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none min-h-[100px]"
                                                                    />
                                                                    <button
                                                                        onClick={handleSubmitReview}
                                                                        disabled={rating === 0 || isSubmittingReview}
                                                                        className="w-full bg-accent text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                                                    >
                                                                        {isSubmittingReview ? (
                                                                            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                                                        ) : "Gönder"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {reviews.length > 0 ? (
                                                <>
                                                    {/* Rating Summary */}
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="text-4xl font-black text-foreground">{averageRating.toFixed(1)}</div>
                                                        <div>
                                                            <div className="flex gap-1 mb-1">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star key={s} className={cn("w-4 h-4", s <= Math.round(averageRating) ? "text-yellow-500 fill-current" : "text-card-border")} />
                                                                ))}
                                                            </div>
                                                            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">{reviews.length} değerlendirme</div>
                                                        </div>
                                                    </div>

                                                    {reviews.map((review: any, index: number) => (
                                                        <div key={review.id || `rev-${index}`} className="bg-card border border-card-border rounded-[2rem] p-6 text-left">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    {review.user?.avatar ? (
                                                                        <img src={review.user.avatar} className="w-10 h-10 rounded-full border border-card-border" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-card-border flex items-center justify-center border border-card-border">
                                                                            <span className="text-sm font-black text-secondary uppercase">{(review.user?.name || 'U')[0]}</span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-xs font-black text-foreground uppercase italic">{review.user?.name}</p>
                                                                        <p className="text-[9px] font-black text-secondary uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-yellow-500 fill-current" : "text-card-border")} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {review.comment && (
                                                                <p className="text-xs text-secondary leading-relaxed font-bold italic">"{review.comment}"</p>
                                                            )}

                                                            {review.clinic_reply && (
                                                                <div className="mt-4 p-4 bg-card rounded-xl border border-card-border ml-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">Klinik Yanıtı</span>
                                                                    </div>
                                                                    <p className="text-xs text-secondary leading-relaxed italic">{review.clinic_reply}</p>
                                                                    <div className="mt-2 text-[8px] text-secondary uppercase tracking-widest font-black">
                                                                        {new Date(review.clinic_replied_at).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="py-20 text-center opacity-30">
                                                    <Star className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Henüz değerlendirme yok</p>
                                                </div>
                                            )}
                                        </div>
                                </div>
                                {/* STICKY FOOTER ACTION */}
                                <div className="sticky bottom-0 z-30 p-8 bg-card/95 backdrop-blur-3xl border-t border-card-border shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                    <button 
                                        onClick={() => onBookAppointment(clinic)}
                                        className="w-full bg-accent text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-md hover:brightness-95 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 group cursor-pointer"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        RANDEVU TALEP ET
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
