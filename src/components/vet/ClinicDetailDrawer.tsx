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
}

import { useChat } from "@/context/ChatContext";

export function ClinicDetailDrawer({ clinicId, clinicData, onClose, onBookAppointment, defaultOpenReviewForm }: ClinicDetailDrawerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { openChat } = useChat();
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
        console.log("GONDERILIYOR:", clinicId, currentUser?.id, messageToSend);
        
        // HEMEN temizle (Optimistic UI)
        setChatInput("");
        
        try {
            const success = await apiService.sendMessage(clinicId, currentUser.id, 'user', messageToSend);
            console.log("SONUC:", success);
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
    }, [clinicId, clinicData, defaultOpenReviewForm]);

    // Handle auto-opening the review form once data is loaded
    useEffect(() => {
        if (defaultOpenReviewForm && reviewableAppointments.length > 0 && !activeReviewAppointmentId) {
            setActiveReviewAppointmentId(reviewableAppointments[0].id);
        }
    }, [reviewableAppointments, defaultOpenReviewForm]);

    useEffect(() => {
        if (drawerRef.current) {
            drawerRef.current.scrollTop = 0;
        }
    }, [activeTab]);

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
                const activeCamps = camps.filter((c: any) => c.status === 'active' && new Date(c.expires_at) > new Date());
                setCampaigns(activeCamps);
            } catch (err) {
                console.error("Kampanyalar yüklenirken hata:", err);
            }

            if (clinicData) {
                // Dynamically build a realistic clinic profile using OpenStreetMap real world data!
                setClinic({
                    ...clinicData,
                    ...cData,
                    imageUrl: clinicData?.avatar_url || clinicData?.logo || res?.avatar_url || res?.logo || null,
                    distance: 'Yakında',
                    address: clinicData.name + ' Çevresi'
                });
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
                        className="fixed top-0 right-0 z-[120] w-full sm:w-[480px] h-full bg-white dark:bg-[#111111] shadow-[-20px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-zinc-200 dark:border-card-border flex flex-col overflow-y-auto no-scrollbar pb-24"
                    >
                        {isChatOpen ? (
                            <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
                                <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-card-border sticky top-0 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md z-10">
                                    <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        {clinicAvatarUrl ? (
                                            <img src={clinicAvatarUrl} className="w-10 h-10 rounded-full object-cover bg-zinc-100" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                                                <span className="font-black text-zinc-500 dark:text-white/40 uppercase">{(clinic?.name || clinicData?.name || 'C')[0]}</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-800 dark:text-white">{clinic?.name || clinicData?.name}</h3>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sohbet</p>
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
                                                <div className={cn("max-w-[75%] rounded-2xl p-4 text-sm relative", isMine ? "bg-[#5B4D9D] text-white rounded-tr-sm" : "bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-white border border-zinc-200 dark:border-white/10 rounded-tl-sm")}>
                                                    {msg.message}
                                                    <span className={cn("block text-[9px] mt-2 opacity-50 uppercase tracking-widest font-black", isMine ? "text-right" : "text-left")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="p-4 border-t border-zinc-200 dark:border-card-border bg-white dark:bg-[#111111] sticky bottom-0">
                                    <div className="flex items-center gap-2 relative">
                                        <input 
                                            type="text" 
                                            value={chatInput} 
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                            placeholder="Mesajınızı yazın..." 
                                            className="flex-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full px-5 py-4 text-sm focus:outline-none focus:border-[#5B4D9D] dark:focus:border-[#5B4D9D] transition-colors text-zinc-800 dark:text-white"
                                            disabled={isSendingMessage}
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim() || isSendingMessage}
                                            className="bg-[#5B4D9D] text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center flex-shrink-0 absolute right-1 top-1"
                                        >
                                            <Send className="w-5 h-5 -ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#5B4D9D]/20 border-t-[#5B4D9D] rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-zinc-400 dark:text-white/20 uppercase tracking-[0.3em]">Bilgiler Getiriliyor...</p>
                            </div>
                        ) : clinic ? (
                            <>
                                {/* HEADER IMAGE & CLOSE */}
                                <div className="relative h-72 shrink-0 group">
                                    {clinicAvatarUrl ? (
                                        <img src={clinicAvatarUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center">
                                            <span className="text-6xl font-black text-zinc-400 dark:text-white/20 uppercase">{(clinic?.name || 'C')[0]}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111111] via-transparent to-black/40" />
                                    
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
                                        <h2 className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter uppercase italic leading-none truncate">{clinic.name}</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex items-center gap-1.5 bg-zinc-150/80 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-card-border">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="text-xs font-black text-zinc-850 dark:text-white">{(averageRating === 0 && reviews.length === 0) ? '--' : averageRating.toFixed(1)}</span>
                                                <span className="text-[10px] text-zinc-500 dark:text-white/40 font-bold">({reviews.length})</span>
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-550 dark:text-white/30 uppercase tracking-widest">{clinic.distance} Uzaklıkta</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK ACTIONS */}
                                <div className="grid grid-cols-3 gap-3 p-6 shrink-0 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-card-border">
                                    <button 
                                        onClick={() => {
                                            if (clinic.phone) window.location.href = `tel:${clinic.phone}`;
                                            else alert("Telefon bilgisi girilmedi");
                                        }}
                                        className={cn("flex flex-col items-center justify-center gap-2 py-4 rounded-2xl shadow-lg active:scale-95 transition-all group", clinic.phone ? "bg-[#5B4D9D] shadow-[#5B4D9D]/20" : "bg-zinc-200 dark:bg-white/10 opacity-50")}
                                    >
                                        <Phone className={cn("w-5 h-5 transition-transform", clinic.phone ? "text-white group-hover:rotate-12" : "text-zinc-500")} />
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", clinic.phone ? "text-white" : "text-zinc-500")}>{clinic.phone ? "Şimdi Ara" : "Tel Yok"}</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.name + " " + clinic.address)}`, '_blank')}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl hover:bg-zinc-200/50 dark:hover:bg-black/10 dark:bg-white/10 transition-all active:scale-95"
                                    >
                                        <Navigation className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                        <span className="text-[9px] font-black text-zinc-600 dark:text-white/60 uppercase tracking-widest">Yol Tarifi</span>
                                    </button>
                                    <button 
                                        onClick={() => setIsChatOpen(true)}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl hover:bg-zinc-200/50 dark:hover:bg-black/10 dark:bg-white/10 transition-all active:scale-95"
                                    >
                                        <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                        <span className="text-[9px] font-black text-zinc-600 dark:text-white/60 uppercase tracking-widest">Mesaj At</span>
                                    </button>
                                </div>

                                {/* CAMPAIGNS BANNER */}
                                {campaigns.length > 0 && (
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-y border-indigo-100 dark:border-indigo-500/20">
                                        {campaigns.map((camp) => (
                                            <div key={camp.id} className="border-b border-indigo-100 dark:border-indigo-500/10 last:border-0">
                                                <button
                                                    onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                            <Megaphone className="w-4 h-4 text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Özel Fırsat</div>
                                                            <div className="text-sm font-bold text-zinc-800 dark:text-white leading-none">{camp.title}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-md">{camp.discount_value}</span>
                                                        <ChevronRight className={cn("w-4 h-4 text-indigo-500 transition-transform", expandedCampaignId === camp.id ? "rotate-90" : "")} />
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
                                                            <div className="p-4 pt-0 text-sm text-zinc-600 dark:text-white/70">
                                                                <p className="mb-3">{camp.description}</p>
                                                                {camp.coupon_code && (
                                                                    <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                                                                        <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 tracking-widest">{camp.coupon_code}</span>
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
                                <div className="flex px-6 border-b border-zinc-200 dark:border-card-border bg-white dark:bg-[#111111] sticky top-0 z-20">
                                    {[
                                        { id: 'info', label: 'Genel', icon: Info },
                                        { id: 'doctors', label: 'Hekimler', icon: Users },
                                        { id: 'reviews', label: 'Yorumlar', icon: Star }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative cursor-pointer",
                                                activeTab === tab.id ? "text-zinc-850 dark:text-white" : "text-zinc-400 dark:text-white/20 hover:text-zinc-700 dark:hover:text-black/50 dark:text-white/40"
                                            )}
                                        >
                                            <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-[#5B4D9D]" : "")} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-4 h-1 bg-[#5B4D9D] rounded-t-full shadow-[0_-5px_15px_rgba(91,77,157,0.5)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* CONTENT AREA */}
                                <div className="flex-1 bg-zinc-50/50 dark:bg-[#0D0D0E]">
                                    {activeTab === 'info' && (
                                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4 p-5 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                                        <MapPin className="w-6 h-6 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest mb-1">Konum</p>
                                                        <p className="text-sm font-bold text-zinc-800 dark:text-white/90 leading-snug">{clinic.address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-5 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-3xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#5B4D9D]/10 flex items-center justify-center border border-[#5B4D9D]/20 shrink-0">
                                                        <Clock className="w-6 h-6 text-[#5B4D9D]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest mb-1">Çalışma Durumu</p>
                                                        <p className="text-sm font-bold text-zinc-850 dark:text-white/90 flex items-center gap-2">
                                                            {clinic.isOpenNow ? (
                                                                <span className="text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" /> ŞU AN AÇIK</span>
                                                            ) : (
                                                                <span className="text-red-500 dark:text-red-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" /> ŞU AN KAPALI</span>
                                                            )}
                                                            <span className="text-zinc-200 dark:text-white/20">•</span>
                                                            <span className="text-zinc-500 dark:text-white/40">24 Saat Hizmet</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-[0.3em] px-1">Sunulan Hizmetler</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {clinic.features?.map((feature: string) => (
                                                        <div key={feature} className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-card-border group hover:bg-zinc-100/50 dark:hover:bg-black/10 dark:bg-white/10 transition-all cursor-default">
                                                            <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                                            <span className="text-xs font-black text-zinc-700 dark:text-white/80 uppercase tracking-tight">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'doctors' && (
                                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {clinic.doctors?.map((doctor: any) => (
                                                <div key={doctor.id} className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-[2.5rem] p-6 group hover:bg-zinc-100/40 dark:hover:bg-white/[0.08] transition-all relative overflow-hidden text-left">
                                                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#5B4D9D]/10 blur-3xl rounded-full pointer-events-none" />
                                                    
                                                    <div className="flex items-start gap-5 relative z-10">
                                                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-zinc-200 dark:border-card-border group-hover:border-[#5B4D9D]/30 transition-all shrink-0">
                                                            {doctor.imageUrl ? (
                                                                <img src={doctor.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                                                                    <span className="text-3xl font-black text-zinc-500 dark:text-white/40 uppercase">{(doctor.name || 'D')[0]}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-[#5B4D9D]/20 text-[#5B4D9D] text-[8px] font-black px-2 py-0.5 rounded-md inline-block uppercase tracking-widest mb-2 border border-[#5B4D9D]/20">
                                                                {doctor.specialization}
                                                            </div>
                                                            <h4 className="text-xl font-black text-zinc-800 dark:text-white tracking-tighter uppercase italic leading-none mb-3">{doctor.name}</h4>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-white/20" />
                                                                <span className="text-[10px] font-black text-zinc-500 dark:text-white/40 uppercase tracking-widest">{doctor.workingHours}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 p-4 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-200 dark:border-card-border relative z-10">
                                                        <p className="text-[11px] text-zinc-600 dark:text-white/60 font-medium leading-relaxed italic">
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
                                    )}

                                    {activeTab === 'reviews' && (
                                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            {/* Review Form / Button */}
                                            {reviewableAppointments.length > 0 && (
                                                <div className="mb-8 space-y-4">
                                                    {reviewableAppointments.map((apt: any, index: number) => (
                                                        <div key={apt.id || apt.appointment_id || `apt-${index}`}>
                                                            {activeReviewAppointmentId !== apt.id ? (
                                                                <button
                                                                    onClick={() => setActiveReviewAppointmentId(apt.id)}
                                                                    className="w-full bg-[#5B4D9D]/10 dark:bg-[#5B4D9D]/20 border border-[#5B4D9D]/30 text-[#5B4D9D] dark:text-white py-4 rounded-2xl font-black text-xs tracking-widest shadow-sm hover:bg-[#5B4D9D] hover:text-white transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                                                                >
                                                                    <span className="opacity-80 text-[10px] uppercase">{new Date(apt.appointment_date).toLocaleDateString()} tarihli randevunuz için</span>
                                                                    <span className="uppercase">Değerlendirme Yaz</span>
                                                                </button>
                                                            ) : (
                                                                <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-[2rem] p-6 space-y-4 shadow-xl">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div>
                                                                            <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-widest">Deneyiminizi Puanlayın</h4>
                                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{new Date(apt.appointment_date).toLocaleDateString()} Randevusu</p>
                                                                        </div>
                                                                        <button onClick={() => setActiveReviewAppointmentId(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer self-start">
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
                                                                                <Star className={cn("w-8 h-8 transition-colors", s <= rating ? "text-yellow-500 fill-current" : "text-zinc-200 dark:text-white/10")} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <textarea
                                                                        value={comment}
                                                                        onChange={(e) => setComment(e.target.value)}
                                                                        placeholder="Deneyiminizi anlatın... (İsteğe bağlı)"
                                                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-xl p-4 text-xs text-zinc-800 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#5B4D9D] transition-all resize-none min-h-[100px]"
                                                                    />
                                                                    <button
                                                                        onClick={handleSubmitReview}
                                                                        disabled={rating === 0 || isSubmittingReview}
                                                                        className="w-full bg-[#5B4D9D] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#483c80] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
                                                        <div className="text-4xl font-black text-zinc-800 dark:text-white">{averageRating.toFixed(1)}</div>
                                                        <div>
                                                            <div className="flex gap-1 mb-1">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star key={s} className={cn("w-4 h-4", s <= Math.round(averageRating) ? "text-yellow-500 fill-current" : "text-zinc-200 dark:text-white/5")} />
                                                                ))}
                                                            </div>
                                                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{reviews.length} değerlendirme</div>
                                                        </div>
                                                    </div>

                                                    {reviews.map((review: any, index: number) => (
                                                        <div key={review.id || `rev-${index}`} className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-[2rem] p-6 text-left">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    {review.user?.avatar ? (
                                                                        <img src={review.user.avatar} className="w-10 h-10 rounded-full border border-zinc-200 dark:border-card-border" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center border border-zinc-200 dark:border-card-border">
                                                                            <span className="text-sm font-black text-zinc-500 dark:text-white/40 uppercase">{(review.user?.name || 'U')[0]}</span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-xs font-black text-zinc-800 dark:text-white uppercase italic">{review.user?.name}</p>
                                                                        <p className="text-[9px] font-black text-zinc-400 dark:text-white/20 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-yellow-500 fill-current" : "text-zinc-200 dark:text-white/5")} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {review.comment && (
                                                                <p className="text-xs text-zinc-650 dark:text-white/70 leading-relaxed font-bold italic">"{review.comment}"</p>
                                                            )}
                                                            
                                                            {review.clinic_reply && (
                                                                <div className="mt-4 p-4 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5 ml-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#5B4D9D]" />
                                                                        <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest">Klinik Yanıtı</span>
                                                                    </div>
                                                                    <p className="text-xs text-zinc-600 dark:text-white/60 leading-relaxed italic">{review.clinic_reply}</p>
                                                                    <div className="mt-2 text-[8px] text-zinc-400 uppercase tracking-widest font-black">
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
                                    )}
                                </div>

                                {/* STICKY FOOTER ACTION */}
                                <div className="sticky bottom-0 z-30 p-8 bg-white/95 dark:bg-[#111111]/80 backdrop-blur-3xl border-t border-zinc-200 dark:border-card-border shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                    <button 
                                        onClick={() => onBookAppointment(clinic)}
                                        className="w-full bg-[#5B4D9D] text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-md hover:bg-[#483c80] hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 group cursor-pointer"
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
