"use client";

import { useState, useEffect, useRef } from "react";
import {
    CalendarCheck, CheckCircle2,
    User, Bell, X, Syringe, ClipboardList, Pill, AlertTriangle,
    Clock, Coffee, Save, Calendar, Heart, Send, Star, MessageSquare, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePet } from "@/context/PetContext";
import { showToast, cn } from "@/lib/utils";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { uploadChatImage } from "@/lib/chatMedia";
import { ChatMessageList, ChatComposer } from "@/components/chat/MessageThread";
import { supabase } from "@/lib/supabase";
import { useDragScroll } from "@/hooks/useDragScroll";
import { NoShowBadge } from "@/components/business/NoShowBadge";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { wallParts, todayKey, addDaysKey } from "@/lib/appointmentTime";
import { CHAT_MESSAGE_EVENT, type ChatMessageEventDetail } from "@/context/ChatContext";
import { healthService } from "@/services/healthService";
import type { VaccineDefinition } from "@/types/health";

export default function BusinessAppointmentsPage() {
    const { customRecords, setCustomRecords, updatePet } = usePet();
    // Faz 3.1 (işletme türü mimarisi, 2026-09-25) — muayene/aşı/reçete (EMR)
    // akışı artık SADECE hasMedicalRecords=true olan türlerde (bugün: vet)
    // gösteriliyor. Diğer türler (kuaför/eğitmen/gönüllü/personel) için
    // aynı randevu daha basit, tanı/aşı/ilaç gerektirmeyen bir "hizmeti
    // tamamla" akışına düşüyor — ama randevu durumunun kendisi (pending/
    // confirmed/completed/rejected/cancelled) hiç değişmedi.
    const { hasMedicalRecords: typeHasMedicalRecords, staffLabel } = useBusinessType();
    const { businessId } = useActiveBusiness();

    const checkAccessGranted = (apt: any) => {
        if (!apt.sharedPassport) return false;
        if (apt.status === 'rejected' || apt.status === 'cancelled') return false;
        
        try {
            let aptDate: Date;
            if (apt.date === 'Bugün') {
                aptDate = new Date();
            } else if (apt.date === 'Yarın') {
                aptDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            } else {
                aptDate = new Date(apt.date);
            }
            
            if (isNaN(aptDate.getTime())) {
                return true;
            }
            
            const now = Date.now();
            const diffMs = Math.abs(now - aptDate.getTime());
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;
            
            return diffMs <= twentyFourHoursMs;
        } catch (e) {
            return true;
        }
    };

    // Initialize with empty data
    const [appointments, setAppointments] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    // Consultation Form States
    const [selectedApt, setSelectedApt] = useState<any | null>(null);
    // Moffi hesabı olmayan (misafir) müşterinin hesabına bağlı bir evcil hayvan yok; muayene kaydı yazılamaz.
    const hasMedicalRecords = typeHasMedicalRecords && !selectedApt?.isGuest;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [diagnosis, setDiagnosis] = useState("");
    
    // Ölçümler (muayene kaydına ve hastanın kilo geçmişine yazılır)
    const [weightKg, setWeightKg] = useState("");
    const [temperatureC, setTemperatureC] = useState("");

    // Vaccine Form States — liste hastanın türüne göre veritabanındaki aşı tanımlarından gelir
    const [vaccineDefs, setVaccineDefs] = useState<VaccineDefinition[]>([]);
    const [vaccineDefId, setVaccineDefId] = useState("");
    const [vaccineName, setVaccineName] = useState("");
    const [vaccineNextDate, setVaccineNextDate] = useState("");
    const [vaccineBatch, setVaccineBatch] = useState("");
    const [addedVaccines, setAddedVaccines] = useState<any[]>([]);
    
    // Medication Form States
    const [medName, setMedName] = useState("");
    const [medDose, setMedDose] = useState("");
    const [medDuration, setMedDuration] = useState("");
    const [addedMeds, setAddedMeds] = useState<any[]>([]);
    
    // Critical Health Notes
    const [criticalNotes, setCriticalNotes] = useState("");

    // Tabs and Shift Settings States
    const [activeTab, setActiveTab] = useState<'appointments' | 'advice' | 'shifts' | 'reviews' | 'messages'>('appointments');
    const [isSavingAdvice, setIsSavingAdvice] = useState(false);

    // Reviews States
    const [reviewsData, setReviewsData] = useState<{ reviews: any[], averageRating: number }>({ reviews: [], averageRating: 0 });
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [isSubmittingReply, setIsSubmittingReply] = useState<{ [key: string]: boolean }>({});
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [workingHours, setWorkingHours] = useState<{ [key: string]: { open: string, close: string, closed: boolean } }>({
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: true },
        sunday: { open: "09:00", close: "18:00", closed: true }
    });
    const [originalWorkingHours, setOriginalWorkingHours] = useState<{ [key: string]: { open: string, close: string, closed: boolean } } | null>(null);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [lunchStart, setLunchStart] = useState("12:00");
    const [lunchEnd, setLunchEnd] = useState("13:00");
    const [slotDuration, setSlotDuration] = useState<number>(30);

    // Close Warning Modal State
    const [closeWarningModal, setCloseWarningModal] = useState<{
        isOpen: boolean;
        appointments: any[];
        onConfirm: ((cancelAppointments: boolean) => Promise<void>) | null;
        isProcessing?: boolean;
    }>({ isOpen: false, appointments: [], onConfirm: null, isProcessing: false });

    // Vet Health Advice States
    const [vetAdviceText, setVetAdviceText] = useState("");
    const [vetAdviceBadge, setVetAdviceBadge] = useState("Genel Sağlık 🩺");

    // Exception States
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [selectedExceptionDate, setSelectedExceptionDate] = useState<string | null>(null);
    const [exceptionForm, setExceptionForm] = useState<{ isClosed: boolean, open: string, close: string }>({ isClosed: false, open: "09:00", close: "18:00" });
    
    // Reject Reason States (Faz 9)
    const [rejectingApptId, setRejectingApptId] = useState<string | number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Messages States
    const [conversations, setConversations] = useState<any[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Filter State
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

    const exceptionsScrollProps = useDragScroll();

    const fetchExceptions = async () => {
        if (!businessId || !isSupabaseEnabled) return;
        try {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 14);
            
            const todayStr = today.toLocaleDateString('sv-SE');
            const endStr = endDate.toLocaleDateString('sv-SE');
            
            const list = await apiService.getClinicExceptions(businessId, todayStr, endStr);
            setExceptions(list);
        } catch (e) {
            console.error("Error fetching exceptions:", e);
        }
    };

    const handleSaveException = async () => {
        if (!businessId || !selectedExceptionDate) return;
        try {
            const dateObj = new Date(selectedExceptionDate);
            const dayKey = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const baseHours = workingHours[dayKey] || { open: "09:00", close: "18:00", closed: false };

            const isSameAsDefault = 
                exceptionForm.isClosed === baseHours.closed && 
                (exceptionForm.isClosed || (exceptionForm.open === baseHours.open && exceptionForm.close === baseHours.close));

            let conflictingAppts: any[] = [];
            if (exceptionForm.isClosed) {
                conflictingAppts = [...appointments, ...pendingRequests].filter(a => {
                    if (!a.rawDate) return false;
                    return new Date(a.rawDate).toLocaleDateString('sv-SE') === selectedExceptionDate;
                });
            }

            const proceedSave = async (cancelAppointments: boolean) => {
                if (cancelAppointments && conflictingAppts.length > 0) {
                    setCloseWarningModal(prev => ({ ...prev, isProcessing: true }));
                    for (const appt of conflictingAppts) {
                        try {
                            await apiService.updateAppointmentStatus(appt.id.toString(), 'cancelled', 'İşletme bu tarihte kapalı');
                        } catch (e) {
                            console.error("İptal hatası:", e);
                        }
                    }
                    setCloseWarningModal(prev => ({ ...prev, isProcessing: false, isOpen: false }));
                    fetchAppointmentsFromDb();
                }

                if (isSameAsDefault) {
                    await apiService.deleteClinicException(businessId, selectedExceptionDate);
                    showToast("Gün varsayılan saatlere döndürüldü! ✨", "CheckCircle2", "text-emerald-500 font-bold");
                } else {
                    await apiService.upsertClinicException(
                        businessId,
                        selectedExceptionDate,
                        exceptionForm.isClosed,
                        exceptionForm.isClosed ? null : exceptionForm.open,
                        exceptionForm.isClosed ? null : exceptionForm.close
                    );
                    showToast("İstisna başarıyla kaydedildi! ✨", "CheckCircle2", "text-emerald-500 font-bold");
                }
                
                setSelectedExceptionDate(null);
                fetchExceptions();
            };

            if (conflictingAppts.length > 0) {
                setCloseWarningModal({
                    isOpen: true,
                    appointments: conflictingAppts,
                    onConfirm: proceedSave,
                    isProcessing: false
                });
                return;
            }

            await proceedSave(false);
        } catch (e) {
            console.error("Error saving exception:", e);
            showToast("İstisna kaydedilemedi! ❌", "AlertCircle", "text-red-500 font-bold");
        }
    };

    const handleDeleteException = async (date: string) => {
        if (!businessId) return;
        try {
            await apiService.deleteClinicException(businessId, date);
            showToast("İstisna kaldırıldı, gün normale döndü! ✨", "CheckCircle2", "text-emerald-500 font-bold");
            setSelectedExceptionDate(null);
            fetchExceptions();
        } catch (e) {
            console.error("Error deleting exception:", e);
            showToast("İstisna silinemedi! ❌", "AlertCircle", "text-red-500 font-bold");
        }
    };

    const fetchAppointmentsFromDb = async () => {
        if (!businessId) {
            console.warn("Klinik ID'si bulunamadı, kullanıcı oturumu yüklenmemiş olabilir.");
            return;
        }
        try {
            const clinicId = businessId;
            const list = await apiService.getClinicAppointments(clinicId);
            const mapped = list.map((item: any) => {
                let time = "00:00";
                let dateStr = "";
                if (item.appointment_date) {
                    const wall = wallParts(item.appointment_date);
                    time = wall.time;
                    const today = todayKey();
                    dateStr = wall.dateKey === today ? "Bugün" : wall.dateKey === addDaysKey(today, 1) ? "Yarın" : wall.dateKey;
                }
                const ownerName = item.user?.full_name || item.user?.username || item.guest_name || "Müşteri";

                let parsedType = "Rutin Kontrol";
                if (item.reason && item.reason.includes('Randevu tipi:')) {
                    parsedType = item.reason.split('Randevu tipi: ')[1].trim() || "Rutin Kontrol";
                } else if (item.reason) {
                    parsedType = item.reason;
                }

                return {
                    id: item.id,
                    userId: item.user_id,
                    petName: item.pet?.name || item.guest_pet_name || "Evcil hayvan belirtilmedi",
                    ownerName,
                    isGuest: !item.user_id,
                    guestPhone: item.guest_phone || null,
                    time: time,
                    date: dateStr,
                    rawDate: item.appointment_date,
                    type: parsedType,
                    status: item.status,
                    image: item.pet?.avatar_url || null,
                    petId: item.pet_id,
                    petType: item.pet?.type || null,
                    sharedPassport: item.shared_passport || {
                        basic: (item.pet?.breed || item.pet?.weight || item.pet?.age) ? {
                            breed: item.pet?.breed || null,
                            weight: item.pet?.weight ? `${item.pet.weight} kg` : null,
                            age: item.pet?.age || null
                        } : null,
                        ownerInfo: {
                            name: ownerName,
                            phone: item.user?.phone || item.guest_phone || ""
                        }
                    },
                    clinicId: item.clinic_id,
                    clinicName: item.clinic_name,
                    realDoctorName: item.doctor?.name || item.doctor_name || null,
                    attendance_status: item.attendance_status
                };
            });
            // Test mock kaldırıldı
            const confirmed = mapped.filter((a: any) => a.status === 'confirmed' || a.status === 'completed');
            const pending = mapped.filter((a: any) => a.status === 'pending');

            setAppointments(confirmed);
            setPendingRequests(pending);
        } catch (e) {
            console.error("Failed to fetch appointments from database:", e);
        }
    };

    // Load Clinic Shift Settings
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const loadSettings = async () => {
            if (!businessId) return;
            
            if (isSupabaseEnabled) {
                try {
                    const clinicId = businessId;
                    const [settings, profile] = await Promise.all([
                        apiService.getClinicSettings(clinicId),
                        apiService.getActiveBusiness()
                    ]);
                    
                    if (profile?.working_hours) {
                        setWorkingHours(profile.working_hours);
                        setOriginalWorkingHours(profile.working_hours);
                    }
                    
                    if (settings) {
                        if (settings.startTime) setStartTime(settings.startTime);
                        if (settings.endTime) setEndTime(settings.endTime);
                        if (settings.lunchStart) setLunchStart(settings.lunchStart);
                        if (settings.lunchEnd) setLunchEnd(settings.lunchEnd);
                        if (settings.slotDuration) setSlotDuration(Number(settings.slotDuration));
                        return;
                    }
                } catch (e) {
                    console.error("Failed to load clinic settings from Supabase:", e);
                }
            }

            try {
                const clinicId = businessId;
                if (!clinicId) return;
                const { data: advices } = await supabase.from('vet_advices').select('*');
                const myAdvice = (advices || []).find((item: any) => item.clinic_id === clinicId);
                if (myAdvice) {
                    setVetAdviceText(myAdvice.content);
                    setVetAdviceBadge(myAdvice.badge);
                }
            } catch (adviceErr) {
                console.error("Failed to load clinic advice:", adviceErr);
            }
        };

        loadSettings();
        fetchExceptions();
    }, [businessId]);

    const loadConversations = async () => {
        if (!businessId || !isSupabaseEnabled) return;
        try {
            const convs = await apiService.getChatConversations('clinic');
            setConversations(convs);
            const unread = convs.filter((c: any) => c.unread).length;
            setTotalUnread(unread);
        } catch (e) { console.error(e); }
    };

    const loadChatHistory = async (userId: string) => {
        if (!businessId || !isSupabaseEnabled) return;
        try {
            const history = await apiService.getChatMessages(userId, 'clinic');
            setChatMessages(history);
            await apiService.markChatAsRead(userId, 'clinic');
            loadConversations();
        } catch (e) { console.error(e); }
    };

    // Mesajlar ChatContext'in tek Realtime kanalından gelen olayla tazelenir (yoklama yok).
    useEffect(() => {
        if (!businessId || !isSupabaseEnabled) return;
        loadConversations();
        const onChat = () => loadConversations();
        window.addEventListener(CHAT_MESSAGE_EVENT, onChat);
        return () => window.removeEventListener(CHAT_MESSAGE_EVENT, onChat);
    }, [businessId]);

    useEffect(() => {
        if (activeTab !== 'messages' || !selectedConv) return;
        loadChatHistory(selectedConv.userId);
        const onChat = (e: Event) => {
            const { senderId, receiverId } = (e as CustomEvent<ChatMessageEventDetail>).detail;
            if (senderId === selectedConv.userId || receiverId === selectedConv.userId) loadChatHistory(selectedConv.userId);
        };
        window.addEventListener(CHAT_MESSAGE_EVENT, onChat);
        return () => window.removeEventListener(CHAT_MESSAGE_EVENT, onChat);
    }, [activeTab, selectedConv]);

    const handleSendMessage = async (text: string, attachmentUrl?: string) => {
        if ((!text.trim() && !attachmentUrl) || !selectedConv || !businessId || isSendingMessage) return;
        setIsSendingMessage(true);
        try {
            await apiService.sendChatMessage(selectedConv.userId, text.trim(), 'clinic', undefined, attachmentUrl);
            await loadChatHistory(selectedConv.userId);
        } catch (e) {
            console.error("Error in handleSendMessage:", e);
            throw e;
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleRecallMessage = async (messageId: string) => {
        if (!window.confirm("Bu mesajı geri almak istediğine emin misin?")) return;
        try {
            await apiService.recallChatMessage(messageId);
            if (selectedConv) await loadChatHistory(selectedConv.userId);
        } catch (e) {
            console.error("Error in handleRecallMessage:", e);
        }
    };

    const loadReviews = async () => {
        if (!businessId || !isSupabaseEnabled) return;
        setIsLoadingReviews(true);
        try {
            console.log("Loading reviews for clinic ID:", businessId);
            const data = await apiService.getClinicReviews(businessId);
            console.log("Returned data from getClinicReviews:", data);
            setReviewsData({
                reviews: data.reviews || [],
                averageRating: data.averageRating || 0
            });
        } catch (error) {
            console.error("Yorumlar yüklenirken hata:", error);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'reviews') {
            loadReviews();
        }
    }, [activeTab, businessId]);

    const handleReplySubmit = async (reviewId: string) => {
        const text = replyText[reviewId];
        if (!text || !text.trim() || !businessId) return;
        
        setIsSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
        try {
            const success = await apiService.replyToReview(reviewId, businessId, text.trim());
            if (success) {
                setEditingReplyId(null);
                await loadReviews();
            } else {
                showToast("Yanıt gönderilemedi.", "AlertCircle", "text-red-500 font-bold");
            }
        } catch (error) {
            console.error("Yanıt hatası:", error);
            showToast("Beklenmeyen bir hata oluştu.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
        }
    };

    // Load confirmed appointments
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isSupabaseEnabled) {
            fetchAppointmentsFromDb();
            return;
        }
        try {
            const stored = localStorage.getItem('moffi_confirmed_appointments');
            if (stored) {
                setAppointments(JSON.parse(stored));
            } else {
                localStorage.setItem('moffi_confirmed_appointments', JSON.stringify([]));
                setAppointments([]);
            }
        } catch (e) {
            console.error("Storage Load Error:", e);
        }
    }, [businessId]);

    // Randevu değişiklikleri Supabase Realtime ile anında gelir (RLS: üyelik — is_business_member).
    useEffect(() => {
        if (!isSupabaseEnabled || !businessId) return;

        const channel = supabase
            .channel(`clinic-appointments-${businessId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${businessId}` }, () => {
                fetchAppointmentsFromDb();
                showToast("Yeni randevu talebi geldi 🐾", "Bell", "text-orange-500 font-bold");
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${businessId}` }, () => {
                fetchAppointmentsFromDb();
            })
            .subscribe();

        // Arka planda kopan bağlantıda kaçan olaylar için sekmeye dönüşte tazele.
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fetchAppointmentsFromDb();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            supabase.removeChannel(channel);
        };
    }, [businessId]);

    const saveAppointments = (updated: any[]) => {
        setAppointments(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_confirmed_appointments', JSON.stringify(updated));
        }
    };

    const handleAttendanceChange = async (id: number | string, status: 'attended' | 'no_show' | null) => {
        if (!isSupabaseEnabled) return;
        
        // Optimistic UI Update
        setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, attendance_status: status } : apt));
        
        try {
            await apiService.updateAttendanceStatus(id.toString(), status);
            showToast(status === 'attended' ? 'Randevu "Geldi" olarak işaretlendi.' : status === 'no_show' ? 'Randevu "Gelmedi" olarak işaretlendi.' : 'Katılım durumu sıfırlandı.', "CheckCircle2", "text-emerald-400 font-bold");
        } catch (e: any) {
            console.error("[handleAttendanceChange] Katılım güncellenirken kritik HATA:", e?.message || e);
            // Revert on error
            fetchAppointmentsFromDb();
        }
    };

    const handleAction = async (id: number | string, action: 'accept' | 'reject', providedRejectReason?: string) => {
        const target = pendingRequests.find(r => r.id === id);
        if (!target) return;

        if (action === 'reject' && providedRejectReason === undefined) {
            setRejectingApptId(id);
            setRejectReason("");
            return;
        }

        if (isSupabaseEnabled) {
            try {
                await apiService.updateAppointmentStatus(id.toString(), action === 'accept' ? 'confirmed' : 'rejected', providedRejectReason);
                showToast(
                    action === 'accept' 
                        ? `Randevu Onaylandı! ${target.petName} için bildirim gönderildi. ✨`
                        : `Randevu Reddedildi! ❌`, 
                    action === 'accept' ? "CheckCircle2" : "XCircle", 
                    action === 'accept' ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                );


                await fetchAppointmentsFromDb();
                return;
            } catch (e) {
                console.error("Failed to update appointment status in Supabase:", e);
                showToast("Randevu durumu güncellenemedi. ❌", "AlertCircle", "text-red-400 font-bold");
                return;
            }
        }

        if (action === 'accept') {
            const updatedAppt = {
                ...target,
                status: 'confirmed'
            };
            const updated = [...appointments, updatedAppt].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
            saveAppointments(updated);

            // Replace alert with premium showToast
            showToast(`Randevu Onaylandı! ${target.petName} için bildirim gönderildi. ✨`, "CheckCircle2", "text-emerald-400 font-bold");
        } else if (action === 'reject') {
            // Replace alert with premium showToast
            showToast(`Randevu Reddedildi! ❌`, "XCircle", "text-red-400 font-bold");
        }

        const updatedPending = pendingRequests.filter(r => r.id !== id);
        setPendingRequests(updatedPending);

        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_pending_appointments', JSON.stringify(updatedPending));
        }
    };

    const startConsultation = (apt: any) => {
        setSelectedApt(apt);
        setIsModalOpen(true);
        if (apt.status === 'completed') {
            // Tamamlanan muayene veritabanındaki kayıttan okunur (tarayıcıdaki kopyadan değil).
            if (hasMedicalRecords) {
                healthService.getRecordByAppointment(apt.id).then(rec => {
                    if (!rec) return;
                    const consultationData = {
                        diagnosis: rec.diagnosis,
                        criticalNotes: rec.criticalNotes,
                        weightKg: rec.weightKg,
                        temperatureC: rec.temperatureC,
                        vaccines: rec.vaccines.map(v => ({ name: v.name, date: v.date, nextDate: v.next_date, batch: v.batch })),
                        medications: rec.medications,
                    };
                    setSelectedApt((cur: any) => cur && cur.id === apt.id ? { ...cur, consultationData } : cur);
                }).catch(e => showToast(e.message, "AlertCircle", "text-red-500 font-bold"));
            }
        } else {
            // Reset form fields for new consultation
            setDiagnosis("");
            setWeightKg("");
            setTemperatureC("");
            setVaccineDefId("");
            setVaccineDefs([]);
            if (hasMedicalRecords && (apt.petType === 'dog' || apt.petType === 'cat')) {
                healthService.getVaccineDefinitions(apt.petType).then(setVaccineDefs).catch(() => setVaccineDefs([]));
            }
            setVaccineName("");
            setVaccineNextDate("");
            setVaccineBatch("");
            setAddedVaccines([]);
            setMedName("");
            setMedDose("");
            setMedDuration("");
            setAddedMeds([]);
            setCriticalNotes("");
        }
    };

    const closeConsultation = () => {
        setSelectedApt(null);
        setIsModalOpen(false);
    };

    const handleAddVaccine = () => {
        const def = vaccineDefs.find(d => d.id === vaccineDefId);
        const name = def ? def.name : vaccineName.trim();
        if (!name) return;
        setAddedVaccines(prev => [...prev, {
            definitionId: def?.id || null,
            name,
            date: todayKey(),
            nextDate: vaccineNextDate,
            batch: vaccineBatch
        }]);
        setVaccineDefId("");
        setVaccineName("");
        setVaccineNextDate("");
        setVaccineBatch("");
    };

    const handleAddMedication = () => {
        if (!medName) return;
        setAddedMeds(prev => [...prev, {
            name: medName,
            dose: medDose,
            duration: medDuration
        }]);
        setMedName("");
        setMedDose("");
        setMedDuration("");
    };

    const handleCompleteConsultation = async () => {
        if (!selectedApt) return;
        // Muayene kaydı (tanı/aşı/reçete) sadece tıbbi kayıt tutan türlerde ve Moffi'ye kayıtlı
        // bir evcil hayvan varsa yazılır; misafir müşterinin randevusu kayıtsız tamamlanır (8.39).
        const writesRecord = hasMedicalRecords && !!selectedApt.petId;
        if (writesRecord && !diagnosis.trim()) {
            showToast("Lütfen tanı alanını doldurun.", "AlertCircle", "text-amber-500 font-bold");
            return;
        }

        const parsedWeight = weightKg.trim() ? Number(weightKg.replace(',', '.')) : null;
        const parsedTemp = temperatureC.trim() ? Number(temperatureC.replace(',', '.')) : null;
        if ((parsedWeight !== null && !Number.isFinite(parsedWeight)) || (parsedTemp !== null && !Number.isFinite(parsedTemp))) {
            showToast("Kilo ve sıcaklık sayı olmalı.", "AlertCircle", "text-amber-500 font-bold");
            return;
        }

        const updatedApt = {
            ...selectedApt,
            status: 'completed',
            consultationData: writesRecord ? {
                diagnosis,
                vaccines: addedVaccines,
                medications: addedMeds,
                criticalNotes,
                weightKg: parsedWeight,
                temperatureC: parsedTemp
            } : { criticalNotes }
        };

        if (isSupabaseEnabled) {
            try {
                if (writesRecord) {
                    // Muayene kaydı, aşılar, reçete, kilo ve randevunun tamamlanması tek atomik
                    // sunucu işleminde (record_consultation): biri başarısız olursa hiçbiri yazılmaz.
                    await healthService.recordConsultation({
                        appointmentId: selectedApt.id,
                        diagnosis,
                        criticalNotes,
                        weightKg: parsedWeight,
                        temperatureC: parsedTemp,
                        vaccines: addedVaccines,
                        medications: addedMeds,
                    });
                } else {
                    await apiService.updateAppointmentStatus(selectedApt.id.toString(), 'completed');
                }
            } catch (e: any) {
                console.error("Failed to sync consultation details with Supabase:", e);
                // Do NOT swallow the error
                showToast("Veritabanı senkronizasyonu başarısız: " + (e.message || "Bilinmeyen Hata"), "AlertCircle", "text-red-500 font-bold");
                return; // Stop execution, don't show success message and don't commit local state!
            }
        }

        // Supabase yazımı hatasız bittikten SONRA (veya mock moddaysak) local state'i güncelle
        const updatedList = appointments.map(apt => apt.id === selectedApt.id ? updatedApt : apt);
        saveAppointments(updatedList);

        // Show premium toast
        showToast(
            writesRecord
                ? "Muayene kaydedildi ve hastanın sağlık karnesine işlendi."
                : "Randevu tamamlandı.",
            "Sparkles", "text-emerald-400 font-bold"
        );

        closeConsultation();
    };

    const handleSaveSettings = async () => {
        if (!businessId) {
            showToast("Oturumunuz doğrulanamadı, lütfen sayfayı yenileyin.", "AlertCircle", "text-amber-500 font-bold");
            return;
        }

        const settings = {
            workingHours,
            startTime,
            endTime,
            lunchStart,
            lunchEnd,
            slotDuration
        };

        let conflictingAppts: any[] = [];
        const newlyClosedDays = (Object.keys(workingHours) as Array<keyof typeof workingHours>).filter(day => {
            const isNowClosed = workingHours[day].closed;
            const wasClosed = originalWorkingHours?.[day]?.closed;
            return isNowClosed && !wasClosed;
        });

        if (newlyClosedDays.length > 0) {
            const dayNameToIndex: Record<string, number> = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
            };
            const newlyClosedIndexes = newlyClosedDays.map(d => dayNameToIndex[d]);
            
            conflictingAppts = [...appointments, ...pendingRequests].filter(a => {
                if (!a.rawDate) return false;
                const dateObj = new Date(a.rawDate);
                if (dateObj < new Date()) return false;
                return newlyClosedIndexes.includes(dateObj.getDay());
            });
        }

        const proceedSave = async (cancelAppointments: boolean) => {
            if (cancelAppointments && conflictingAppts.length > 0) {
                setCloseWarningModal(prev => ({ ...prev, isProcessing: true }));
                for (const appt of conflictingAppts) {
                    try {
                        await apiService.updateAppointmentStatus(appt.id.toString(), 'cancelled', 'İşletme bu gün kapalı');
                    } catch (e) {
                        console.error("İptal hatası:", e);
                    }
                }
                setCloseWarningModal(prev => ({ ...prev, isProcessing: false, isOpen: false }));
                fetchAppointmentsFromDb();
            }

            if (isSupabaseEnabled) {
                try {
                    const clinicId = businessId;
                    await Promise.all([
                        apiService.saveClinicSettings(clinicId, settings),
                        apiService.updateActiveBusiness({ working_hours: workingHours })
                    ]);
                    setOriginalWorkingHours(workingHours);
                } catch (e) {
                    console.error("Failed to save clinic settings to Supabase:", e);
                    showToast("Vardiya ayarları veritabanına kaydedilemedi! ❌", "AlertCircle", "text-red-500 font-bold");
                    return;
                }
            }
            
            showToast("Vardiya ayarları başarıyla kaydedildi! ✨", "CheckCircle2", "text-emerald-500 font-bold");
        };

        if (conflictingAppts.length > 0) {
            setCloseWarningModal({
                isOpen: true,
                appointments: conflictingAppts,
                onConfirm: proceedSave,
                isProcessing: false
            });
            return;
        }

        await proceedSave(false);
    };

    const handleSaveAdvice = async () => {
        if (!businessId) {
            showToast("Oturumunuz doğrulanamadı, lütfen sayfayı yenileyin.", "AlertCircle", "text-amber-500 font-bold");
            return;
        }
        if (!vetAdviceText.trim()) {
            showToast("Lütfen bir tavsiye metni girin! ⚠️", "AlertCircle", "text-amber-500 font-bold");
            return;
        }
        setIsSavingAdvice(true);
        try {
            if (isSupabaseEnabled) {
                const clinicId = businessId;
                await apiService.saveClinicAdvice(clinicId, vetAdviceText.trim(), vetAdviceBadge.trim());
            } else {
                localStorage.setItem('moffi_clinic_advice', JSON.stringify({ content: vetAdviceText.trim(), badge: vetAdviceBadge.trim() }));
            }

            // Broadcast story changes
            try {
                const broadcast = new BroadcastChannel('moffi_announcements_channel');
                broadcast.postMessage('REFRESH_STORIES');
                broadcast.close();
            } catch (bErr) {
                console.error("Tab sync broadcast failed:", bErr);
            }

            showToast("Günün sağlık tavsiyesi başarıyla hikayelerde yayınlandı! 🩺🚀", "CheckCircle2", "text-green-500 font-bold");
        } catch (e: any) {
            console.error("Failed to save clinic advice:", e);
            const errStr = e.message || e.error_description || JSON.stringify(e);
            showToast(`Tavsiye kaydedilemedi! ❌ Hata: ${errStr.slice(0, 80)}`, "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsSavingAdvice(false);
        }
    };

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">
                Randevu taleplerini onayla, muayene/tamamlama kaydı gir ve çalışma saatlerini yönet. Günlük görünüm için Takvim sayfasını kullanabilirsin.
            </p>
                {/* TABS */}
                <div className="flex gap-4 mb-8 border-b border-zinc-200 dark:border-[#27272a] pb-px">
                    <button 
                        onClick={() => setActiveTab('appointments')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === 'appointments' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        Randevu Akışı
                    </button>
                    <button 
                        onClick={() => setActiveTab('advice')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === 'advice' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        Günün Tavsiyesi 🩺
                    </button>
                    <button 
                        onClick={() => setActiveTab('shifts')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === 'shifts' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        Vardiya & Takvim Ayarları
                    </button>
                    <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'reviews' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        <Star className="w-3.5 h-3.5 mb-0.5" /> Yorumlar
                    </button>
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'messages' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5 mb-0.5" /> Mesajlar
                        {totalUnread > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                        )}
                    </button>
                </div>

                {activeTab === 'appointments' && (
                    <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: CALENDAR & CONFIRMED LIST */}
                    <div className="flex-1 space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div 
                                onClick={() => setActiveFilter('all')}
                                className={`p-6 rounded-3xl cursor-pointer transition-all border ${
                                    activeFilter === 'all'
                                    ? 'bg-[#5B4D9D]/5 border-[#5B4D9D] ring-2 ring-[#5B4D9D]/20 shadow-moffi-card'
                                    : 'bg-card dark:bg-[#121212] border-card-border dark:border-card-border hover:border-[#5B4D9D]/50 shadow-moffi-card opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Toplam Randevu (Bugün)</div>
                                <div className="text-4xl font-black text-foreground dark:text-white">{appointments.length + pendingRequests.length}</div>
                            </div>
                            <div 
                                onClick={() => setActiveFilter('pending')}
                                className={`p-6 rounded-3xl cursor-pointer transition-all border flex flex-col ${
                                    activeFilter === 'pending'
                                    ? 'bg-[#5B4D9D]/5 border-[#5B4D9D] ring-2 ring-[#5B4D9D]/20 shadow-moffi-card'
                                    : 'bg-card dark:bg-[#121212] border-card-border dark:border-card-border hover:border-[#5B4D9D]/50 shadow-moffi-card opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Bekleyen Onay</div>
                                <div className="text-4xl font-black text-foreground dark:text-white">{pendingRequests.length}</div>
                            </div>
                            <div 
                                onClick={() => setActiveFilter('confirmed')}
                                className={`p-6 rounded-3xl cursor-pointer transition-all border ${
                                    activeFilter === 'confirmed'
                                    ? 'bg-[#5B4D9D]/5 border-[#5B4D9D] ring-2 ring-[#5B4D9D]/20 shadow-moffi-card'
                                    : 'bg-card dark:bg-[#121212] border-card-border dark:border-card-border hover:border-[#5B4D9D]/50 shadow-moffi-card opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Onaylanmış Randevu</div>
                                <div className="text-4xl font-black text-foreground dark:text-white flex items-baseline gap-1">
                                    {appointments.length}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-[#5B4D9D]" /> Program Akışı</h3>
                            </div>

                            <div className="space-y-4">
                                {activeFilter === 'pending' ? (
                                    <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                        <p className="text-gray-500 dark:text-gray-300 font-bold">Sadece Bekleyen İstekler listeleniyor.</p>
                                        <p className="text-xs text-gray-400 mt-2">Onaylı randevuları görmek için "Toplam" veya "Onaylanmış" filtresine tıklayın.</p>
                                    </div>
                                ) : (
                                    <>
                                        {appointments.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-10">Bugün için planlanmış randevu yok.</div>}
                                        {appointments.map((apt) => (
                                            <div key={apt.id} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-black/5 dark:bg-white/5 transition-colors border border-transparent hover:border-card-border dark:hover:border-card-border">
                                                <div className="font-mono font-bold text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">{apt.time || "--:--"}</div>
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-white/10 overflow-hidden flex items-center justify-center text-xl font-black text-gray-500">
                                                        {apt.image
                                                            ? <img src={apt.image} alt="" className="w-full h-full object-cover" />
                                                            : (apt.petName || apt.ownerName || '?').charAt(0).toLocaleUpperCase('tr-TR')}
                                                    </div>
                                                    <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center ${apt.status === 'completed' ? 'bg-[#5B4D9D]' : 'bg-green-500'}`}>
                                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-bold text-lg text-foreground dark:text-white truncate">{apt.petName}</div>
                                                        {apt.status === 'completed' ? (
                                                            <span className="text-[10px] bg-[#5B4D9D]/10 text-[#5B4D9D] font-bold px-2 py-0.5 rounded-full border border-[#5B4D9D]/20 shrink-0">Tamamlandı</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded-full border border-green-500/20 shrink-0">Onaylı</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1 truncate">
                                                        <User className="w-3 h-3 shrink-0" /> <span className="truncate">{apt.ownerName} • {apt.type}</span>
                                                        {apt.realDoctorName && (
                                                            <span className="truncate flex items-center gap-1">
                                                                <span className="opacity-50">•</span> Dr. {apt.realDoctorName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
                                                    {/* (Faz 9) Gelecek randevu değilse ve iptal değilse no-show butonları */}
                                                    {apt.status === 'completed' ? (
                                                        <div className="flex items-center flex-wrap gap-2 mr-2 sm:border-r border-card-border sm:pr-4">
                                                            <span className="text-[10px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                                                                ✓ Geldi
                                                            </span>
                                                        </div>
                                                    ) : apt.status === 'confirmed' && apt.rawDate && new Date(apt.rawDate) < new Date(new Date().setHours(0,0,0,0)) ? (
                                                        <div className="flex items-center flex-wrap gap-2 mr-2 sm:border-r border-card-border sm:pr-4">
                                                            {!apt.attendance_status ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleAttendanceChange(apt.id, 'attended')}
                                                                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold hover:bg-green-500/20 transition-colors"
                                                                    >
                                                                        Geldi ✓
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleAttendanceChange(apt.id, 'no_show')}
                                                                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                                                                    >
                                                                        Gelmedi ✗
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {apt.attendance_status === 'attended' ? (
                                                                        <span className="text-[10px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                                                                            ✓ Geldi
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                                                                            ✗ Gelmedi
                                                                        </span>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => handleAttendanceChange(apt.id, null)}
                                                                        className="text-[9px] text-gray-400 hover:text-indigo-400 underline decoration-dotted"
                                                                    >
                                                                        Değiştir
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    <button 
                                                        onClick={() => startConsultation(apt)}
                                                        disabled={apt.attendance_status === 'no_show'}
                                                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${
                                                            apt.attendance_status === 'no_show'
                                                            ? 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                            : 'bg-card dark:bg-white/5 border-card-border hover:bg-white dark:bg-black hover:text-white dark:hover:bg-indigo-600'
                                                        }`}
                                                    >
                                                        {apt.status === 'completed'
                                                            ? (typeHasMedicalRecords && !apt.isGuest ? 'Muayene Detayı' : 'Randevu Detayı')
                                                            : (typeHasMedicalRecords && !apt.isGuest ? 'Muayene Et' : 'Tamamla')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PENDING REQUESTS SIDEBAR */}
                    <div className="w-full lg:w-96">
                        <div className="sticky top-8">
                            <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-6 border border-card-border dark:border-card-border shadow-xl shadow-indigo-500/5">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-orange-500 fill-current" /> Gelen İstekler ({pendingRequests.length})
                                </h3>

                                <AnimatePresence mode="wait">
                                    {activeFilter === 'confirmed' ? (
                                        <motion.div 
                                            key="confirmed-msg"
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-card-border dark:border-card-border"
                                        >
                                            <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Sadece onaylı randevular listeleniyor</p>
                                        </motion.div>
                                    ) : pendingRequests.length === 0 ? (
                                        <motion.div 
                                            key="empty-msg"
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-card-border dark:border-card-border"
                                        >
                                            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Bekleyen istek yok</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="pending-list"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {pendingRequests.map(req => (
                                                <motion.div
                                                    key={req.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-[#F8F9FC] dark:bg-white/5 p-4 rounded-3xl border border-indigo-100 dark:border-card-border"
                                                >
                                                    <div className="flex gap-4 mb-4">
                                                        {req.image
                                                            ? <img src={req.image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                                                            : <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-lg font-black text-gray-500 shrink-0">{(req.petName || req.ownerName || '?').charAt(0).toLocaleUpperCase('tr-TR')}</div>}
                                                        <div>
                                                            <div className="font-black text-foreground dark:text-white text-lg flex items-center flex-wrap">
                                                                {req.petName}
                                                                <NoShowBadge userId={req.userId} />
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-bold bg-card dark:bg-black/20 px-2 py-1 rounded-md inline-block mt-1">
                                                                ⏰ {req.time || "Saatsiz"} • {req.date}
                                                                {req.realDoctorName && <span className="ml-2 border-l border-gray-300 dark:border-gray-700 pl-2">Dr. {req.realDoctorName}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-xs text-gray-500 gap-2 mb-4 bg-card dark:bg-black/20 p-2 rounded-xl">
                                                        <span className="font-bold">Not:</span> {req.type || "Rutin Kontrol"}
                                                    </div>
                                                    {req.sharedPassport && (
                                                         <div className="bg-black/5 dark:bg-white/5 border border-indigo-500/10 p-3.5 rounded-2xl mb-4 text-left space-y-2 mt-2">
                                                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Tıbbi Pasaport Önizleme</span>
                                                             {checkAccessGranted(req) ? (
                                                                 <>
                                                                     {req.sharedPassport.basic && (
                                                                         <div className="text-[10px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                                                                             <span>🐾 <strong>Irk:</strong> {req.sharedPassport.basic.breed}</span>
                                                                             <span>⚖️ <strong>Kilo:</strong> {req.sharedPassport.basic.weight}</span>
                                                                             <span>🎂 <strong>Yaş:</strong> {req.sharedPassport.basic.age || '2.1'}</span>
                                                                         </div>
                                                                     )}
                                                                     {req.sharedPassport.vaccines && req.sharedPassport.vaccines.length > 0 && (
                                                                         <div className="text-[9px] text-gray-500 border-t border-card-border pt-1.5 mt-1">
                                                                             <strong className="text-gray-500 dark:text-gray-400">Son Aşılar:</strong> {req.sharedPassport.vaccines.slice(0, 2).map((v: any) => v.definition?.name || v.name || 'Karma Aşı').join(", ")}
                                                                         </div>
                                                                     )}
                                                                     {req.sharedPassport.healthNotes && (
                                                                         <div className="text-[9px] text-orange-400 bg-orange-500/5 px-2.5 py-1 rounded-lg border border-orange-500/10 mt-1">
                                                                             ⚠️ <strong>Sağlık Notu:</strong> {req.sharedPassport.healthNotes}
                                                                         </div>
                                                                     )}
                                                                     {req.sharedPassport.ownerInfo && (
                                                                         <div className="text-[9px] text-indigo-400 dark:text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 mt-1">
                                                                             📞 <strong>Sahip İletişim:</strong> {req.sharedPassport.ownerInfo.name} ({req.sharedPassport.ownerInfo.phone})
                                                                         </div>
                                                                     )}
                                                                 </>
                                                             ) : (
                                                                 <div className="text-[9.5px] text-red-500 dark:text-red-400 font-bold py-1 flex items-center gap-1.5 leading-snug">
                                                                     🔒 Tıbbi Pasaport Erişimi Kapalı (Erişim süresi randevudan 24 saat önce başlar ve 24 saat sonra biter)
                                                                 </div>
                                                             )}
                                                         </div>
                                                    )}
                                                    {rejectingApptId === req.id ? (
                                                        <div className="space-y-2 mt-2">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Reddetme sebebi (isteğe bağlı)..."
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                className="w-full text-xs p-3 rounded-xl bg-white dark:bg-black/20 border border-zinc-200 dark:border-card-border focus:outline-none focus:border-red-400"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => setRejectingApptId(null)} className="flex-1 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-xs">İptal</button>
                                                                <button onClick={() => {
                                                                    handleAction(req.id, 'reject', rejectReason);
                                                                    setRejectingApptId(null);
                                                                }} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors text-xs">Kesin Reddet</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 py-3 rounded-xl bg-card dark:bg-white/5 border border-card-border text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Reddet</button>
                                                            <button onClick={() => handleAction(req.id, 'accept')} className="flex-1 py-3 rounded-xl bg-[#5B4D9D] text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">Onayla</button>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    </div>
                )}

                {activeTab === 'shifts' && (
                    <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card text-left max-w-3xl space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-[#5B4D9D]" /> Vardiya ve Mesai Düzenleme
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Klinik çalışma günlerini ve randevu aralıklarını özelleştirin</p>
                        </div>

                        {/* Working Hours Selectors */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">ÇALIŞMA SAATLERİ (GÜN BAZLI)</label>
                            <div className="space-y-3">
                                {[
                                    { key: 'monday', label: 'Pazartesi' },
                                    { key: 'tuesday', label: 'Salı' },
                                    { key: 'wednesday', label: 'Çarşamba' },
                                    { key: 'thursday', label: 'Perşembe' },
                                    { key: 'friday', label: 'Cuma' },
                                    { key: 'saturday', label: 'Cumartesi' },
                                    { key: 'sunday', label: 'Pazar' }
                                ].map((day) => {
                                    const h = workingHours[day.key] || { open: "09:00", close: "18:00", closed: false };
                                    return (
                                        <div key={day.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border bg-[#F8F9FC] dark:bg-white/5 border-zinc-200 dark:border-card-border gap-3">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    onClick={() => setWorkingHours(prev => ({ ...prev, [day.key]: { ...(prev[day.key] || { open: "09:00", close: "18:00" }), closed: !(prev[day.key]?.closed) } }))}
                                                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${!h.closed ? 'bg-[#5B4D9D]' : 'bg-zinc-250 dark:bg-zinc-700'}`}
                                                >
                                                    <div className={`bg-white dark:bg-black w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${!h.closed ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                                </div>
                                                <span className={`text-sm font-bold ${!h.closed ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{day.label}</span>
                                            </div>
                                            
                                            <div className={`flex items-center gap-2 ${h.closed ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <select
                                                    value={h.open}
                                                    onChange={(e) => setWorkingHours(prev => ({ ...prev, [day.key]: { ...(prev[day.key] || { close: "18:00", closed: false }), open: e.target.value } }))}
                                                    className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#5B4D9D]"
                                                >
                                                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                        const hr = Math.floor(i / 2).toString().padStart(2, '0');
                                                        const min = i % 2 === 0 ? '00' : '30';
                                                        return <option key={`${hr}:${min}`} value={`${hr}:${min}`}>{`${hr}:${min}`}</option>;
                                                    })}
                                                </select>
                                                <span className="text-gray-400">-</span>
                                                <select
                                                    value={h.close}
                                                    onChange={(e) => setWorkingHours(prev => ({ ...prev, [day.key]: { ...(prev[day.key] || { open: "09:00", closed: false }), close: e.target.value } }))}
                                                    className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#5B4D9D]"
                                                >
                                                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                        const hr = Math.floor(i / 2).toString().padStart(2, '0');
                                                        const min = i % 2 === 0 ? '00' : '30';
                                                        return <option key={`${hr}:${min}`} value={`${hr}:${min}`}>{`${hr}:${min}`}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lunch and Duration Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-150 dark:border-white/5 text-left">

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">ÖĞLE ARASI TATİLİ</label>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-500">Başlangıç</label>
                                        <select 
                                            value={lunchStart}
                                            onChange={e => setLunchStart(e.target.value)}
                                            className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2.5 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                        >
                                            {['11:30', '12:00', '12:30', '13:00'].map(t => <option key={t} value={t} className="bg-card dark:bg-[#121212]">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-500">Bitiş</label>
                                        <select 
                                            value={lunchEnd}
                                            onChange={e => setLunchEnd(e.target.value)}
                                            className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2.5 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                        >
                                            {['12:30', '13:00', '13:30', '14:00'].map(t => <option key={t} value={t} className="bg-card dark:bg-[#121212]">{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">RANDEVU MUAYENE SÜRESI</label>
                                <select 
                                    value={slotDuration}
                                    onChange={e => setSlotDuration(Number(e.target.value))}
                                    className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2.5 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                >
                                    <option value={15} className="bg-card dark:bg-[#121212]">15 Dakika</option>
                                    <option value={30} className="bg-card dark:bg-[#121212]">30 Dakika</option>
                                    <option value={45} className="bg-card dark:bg-[#121212]">45 Dakika</option>
                                    <option value={60} className="bg-card dark:bg-[#121212]">60 Dakika</option>
                                </select>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-6 border-t border-zinc-150 dark:border-white/5 flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                className="bg-gradient-to-r from-[#5B4D9D] to-[#4E3F8F] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-purple-500/10 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Ayarları Kaydet
                            </button>
                        </div>

                        {/* Yaklaşan 14 Gün İstisnalar */}
                        <div className="pt-8 border-t border-zinc-150 dark:border-white/5 space-y-4">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2">YAKLAŞAN 14 GÜN (İSTİSNALAR)</h3>
                                <p className="text-xs text-gray-500 font-medium">Belirli günler için kliniği kapatabilir veya özel mesai saatleri belirleyebilirsiniz.</p>
                            </div>
                            
                            <div 
                                {...exceptionsScrollProps}
                                className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x cursor-grab active:cursor-grabbing"
                            >
                                {Array.from({ length: 14 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const dateStr = d.toLocaleDateString('sv-SE');
                                    const dayNameShort = d.toLocaleDateString('tr-TR', { weekday: 'short' });
                                    const dayNum = d.getDate();
                                    const monthShort = d.toLocaleDateString('tr-TR', { month: 'short' });
                                    
                                    const dayKey = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                    
                                    const exception = exceptions.find(ex => ex.exception_date === dateStr);
                                    const baseHours = workingHours[dayKey] || { open: "09:00", close: "18:00", closed: false };
                                    
                                    const isClosed = exception ? exception.is_closed : baseHours.closed;
                                    const isException = !!exception;
                                    const isSelected = selectedExceptionDate === dateStr;

                                    return (
                                        <div 
                                            key={dateStr}
                                            onClick={() => {
                                                setSelectedExceptionDate(isSelected ? null : dateStr);
                                                setExceptionForm({
                                                    isClosed: isClosed,
                                                    open: exception?.open_time || baseHours.open,
                                                    close: exception?.close_time || baseHours.close
                                                });
                                            }}
                                            className={`min-w-[100px] flex-shrink-0 p-3 rounded-2xl border snap-center transition-all ${
                                                isSelected 
                                                    ? 'border-[#5B4D9D] bg-[#5B4D9D]/5' 
                                                    : isException 
                                                        ? 'border-orange-400 bg-orange-400/5 dark:bg-orange-400/10' 
                                                        : 'border-zinc-200 dark:border-card-border bg-[#F8F9FC] dark:bg-white/5 hover:border-zinc-350 dark:hover:border-[#3f3f46]'
                                            }`}
                                        >
                                            <div className="text-center space-y-1 select-none">
                                                <div className={`text-xl font-black ${isException ? 'text-orange-500' : 'text-foreground dark:text-white'}`}>{dayNum}</div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase">{monthShort} {dayNameShort}</div>
                                                <div className={`text-[9px] font-bold mt-2 px-2 py-0.5 rounded-full inline-block ${
                                                    isClosed 
                                                        ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                                        : isException
                                                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                                                            : 'bg-[#5B4D9D]/10 text-[#5B4D9D]'
                                                }`}>
                                                    {isClosed ? 'Kapalı' : isException ? 'Özel' : 'Açık'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Exception Form Panel */}
                            <AnimatePresence>
                                {selectedExceptionDate && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-[#F8F9FC] dark:bg-[#1A1A1A] rounded-2xl border border-zinc-200 dark:border-white/5 p-4 sm:p-5 overflow-hidden"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    onClick={(e) => {
                                                        setExceptionForm(prev => ({ ...prev, isClosed: !prev.isClosed }));
                                                    }}
                                                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${exceptionForm.isClosed ? 'bg-red-500' : 'bg-[#5B4D9D]'}`}
                                                >
                                                    <div className={`bg-white dark:bg-zinc-200 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${exceptionForm.isClosed ? 'translate-x-4.5' : 'translate-x-0'}`} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Bu günü kapat</span>
                                            </div>

                                            {!exceptionForm.isClosed && (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={exceptionForm.open}
                                                        onChange={(e) => setExceptionForm(prev => ({ ...prev, open: e.target.value }))}
                                                        className="bg-white dark:bg-[#252525] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#5B4D9D]"
                                                    >
                                                        {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                            const hr = Math.floor(i / 2).toString().padStart(2, '0');
                                                            const min = i % 2 === 0 ? '00' : '30';
                                                            return <option key={`${hr}:${min}`} value={`${hr}:${min}`}>{`${hr}:${min}`}</option>;
                                                        })}
                                                    </select>
                                                    <span className="text-gray-400">-</span>
                                                    <select
                                                        value={exceptionForm.close}
                                                        onChange={(e) => setExceptionForm(prev => ({ ...prev, close: e.target.value }))}
                                                        className="bg-white dark:bg-[#252525] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#5B4D9D]"
                                                    >
                                                        {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                            const hr = Math.floor(i / 2).toString().padStart(2, '0');
                                                            const min = i % 2 === 0 ? '00' : '30';
                                                            return <option key={`${hr}:${min}`} value={`${hr}:${min}`}>{`${hr}:${min}`}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-5 flex justify-end gap-3">
                                            {exceptions.find(ex => ex.exception_date === selectedExceptionDate) && (
                                                <button
                                                    onClick={() => handleDeleteException(selectedExceptionDate)}
                                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                                                >
                                                    Varsayılana Döndür
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSaveException}
                                                className="bg-[#5B4D9D] hover:bg-[#4E3F8F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20"
                                            >
                                                Kaydet
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {activeTab === 'advice' && (
                    <div className="bg-white dark:bg-[#121212] rounded-[2.5rem] p-8 border border-zinc-200 dark:border-card-border shadow-moffi-card text-left max-w-3xl space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 mb-2">
                                <Heart className="w-5 h-5 text-red-500 fill-current" /> Günün Sağlık Tavsiyesi 🩺
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Moffi kullanıcılarına ulaştırılacak pratik bir evcil hayvan sağlığı tavsiyesi veya uyarısı yayınlayın.
                            </p>
                        </div>

                        {/* Advice Form Inputs */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Tavsiye Kategorisi</label>
                                    <select 
                                        value={vetAdviceBadge}
                                        onChange={e => setVetAdviceBadge(e.target.value)}
                                        className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3.5 text-xs font-bold focus:border-[#5B4D9D] focus:ring-1 focus:ring-[#5B4D9D] outline-none text-foreground dark:text-white transition-all shadow-sm"
                                    >
                                        <option value="Genel Sağlık 🩺">Genel Sağlık 🩺</option>
                                        <option value="Aşı Uyarısı 💉">Aşı Uyarısı 💉</option>
                                        <option value="Beslenme Tavsiyesi 🍖">Beslenme 🍖</option>
                                        <option value="Yaz Bakımı ☀️">Yaz Bakımı ☀️</option>
                                        <option value="Kış Bakımı ❄️">Kış Bakımı ❄️</option>
                                    </select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Tavsiye Açıklaması</label>
                                    <textarea
                                        value={vetAdviceText}
                                        onChange={e => setVetAdviceText(e.target.value.slice(0, 150))}
                                        placeholder="Örn: Yaz aylarında asfalt sıcaklığı dostlarımızın patilerini yakabilir. Yürüyüşleri sabah ve akşam yapın..."
                                        rows={3}
                                        className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3 text-xs focus:border-[#5B4D9D] focus:ring-1 focus:ring-[#5B4D9D] outline-none text-foreground dark:text-white transition-all resize-none shadow-sm"
                                    />
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1.5 px-1">
                                        <span>En fazla 150 karakter yazabilirsiniz</span>
                                        <span className={vetAdviceText.length >= 135 ? "text-red-500 font-black" : "text-gray-500 dark:text-gray-400"}>
                                            {vetAdviceText.length}/150
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Preview - Story Layout Mockup */}
                        <div className="pt-6 border-t border-zinc-150 dark:border-white/5 space-y-4">
                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">HİKAYE ÖNİZLEME (KULLANICININ EKRANINDA BÖYLE GÖRÜNECEK)</label>
                            
                            <div className="flex justify-center">
                                <div className="w-[280px] h-[450px] rounded-[2.2rem] bg-zinc-950 text-white relative overflow-hidden shadow-2xl border-4 border-zinc-900 flex flex-col justify-between p-6">
                                    {/* Background Image / Placeholder */}
                                    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-65 transition-all duration-300" style={{ backgroundImage: `url('/images/moffi_pet_trio.png')` }} />
                                    {/* Black Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 z-10" />

                                    {/* Top Bar (Clinic Info) */}
                                    <div className="z-20 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full border border-black/20 dark:border-white/20 overflow-hidden bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                            <img src="/images/moffi_pet_trio.png" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-xs leading-none">VetLife Global Clinic</div>
                                            <span className="text-[9px] text-zinc-300">Az Önce</span>
                                        </div>
                                    </div>

                                    {/* Middle Content */}
                                    <div className="z-20 text-left space-y-2 mt-auto mb-5">
                                        <div>
                                            <span className="inline-block bg-[#5B4D9D] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                                                {vetAdviceBadge}
                                            </span>
                                        </div>
                                        <p className="text-[12.5px] leading-relaxed font-bold drop-shadow-md">
                                            {vetAdviceText || "Yazacağınız tavsiye metni burada canlı olarak görüntülenecektir. Lütfen yukarıdaki alana tavsiyenizi girin..."}
                                        </p>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="z-20 mt-auto">
                                        <div className="w-full py-2.5 bg-white dark:bg-zinc-100 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg select-none">
                                            Randevu Al 📅
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="pt-6 border-t border-zinc-150 dark:border-white/5 flex justify-end">
                            <button
                                onClick={handleSaveAdvice}
                                disabled={isSavingAdvice}
                                className="bg-[#5B4D9D] hover:bg-[#4E3F8F] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/10 flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                            >
                                {isSavingAdvice ? (
                                    <>Yayınlanıyor...</>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" /> Sağlık Tavsiyesini Yayınla 🚀
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card text-left max-w-4xl space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-current" /> Değerlendirmeler & Yorumlar
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                Ortalama Puan: <span className="text-foreground dark:text-white text-sm bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">{reviewsData.averageRating.toFixed(1)} / 5</span>
                            </p>
                        </div>

                        {isLoadingReviews ? (
                            <div className="py-20 text-center">
                                <div className="w-8 h-8 border-4 border-[#5B4D9D]/20 border-t-[#5B4D9D] rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Yorumlar Yükleniyor...</p>
                            </div>
                        ) : reviewsData.reviews.length === 0 ? (
                            <div className="py-20 text-center bg-zinc-50 dark:bg-white/5 rounded-3xl border border-dashed border-zinc-200 dark:border-card-border">
                                <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Henüz değerlendirme almadınız.</p>
                                <p className="text-[10px] text-gray-400 mt-2 font-bold max-w-xs mx-auto">Müşterilerinize mükemmel hizmet vererek yakında harika yorumlar kazanabilirsiniz!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {reviewsData.reviews.map((review: any) => (
                                    <div key={review.id} className="bg-white dark:bg-[#1a1a1c] border border-zinc-150 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                    {review.user?.avatar ? (
                                                        <img src={review.user.avatar} alt={review.user?.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-zinc-400 m-2.5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground dark:text-white">{review.user?.name || "İsimsiz Kullanıcı"}</h4>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-500 fill-current" : "text-zinc-200 dark:text-white/10"}`} />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {review.comment && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                                                "{review.comment}"
                                            </p>
                                        )}

                                        {/* Business Reply Logic */}
                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                                            {review.clinic_reply ? (
                                                <div className="bg-[#5B4D9D]/5 border border-[#5B4D9D]/10 rounded-2xl p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Yanıtınız
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingReplyId(review.id);
                                                                setReplyText(prev => ({ ...prev, [review.id]: review.clinic_reply }));
                                                            }}
                                                            className="text-[10px] text-gray-400 hover:text-[#5B4D9D] font-bold uppercase transition-colors"
                                                        >
                                                            Düzenle
                                                        </button>
                                                    </div>
                                                    
                                                    {editingReplyId === review.id ? (
                                                        <div className="space-y-3 mt-3">
                                                            <textarea 
                                                                value={replyText[review.id] || ""}
                                                                onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                                                                placeholder="Yanıtınızı güncelleyin..."
                                                                className="w-full bg-white dark:bg-black/20 border border-[#5B4D9D]/20 rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#5B4D9D] outline-none min-h-[80px]"
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingReplyId(null)} className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">İptal</button>
                                                                <button 
                                                                    onClick={() => handleReplySubmit(review.id)}
                                                                    disabled={isSubmittingReply[review.id]}
                                                                    className="bg-[#5B4D9D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4E3F8F] transition-all disabled:opacity-50"
                                                                >
                                                                    {isSubmittingReply[review.id] ? "Kaydediliyor..." : "Güncelle"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-foreground dark:text-gray-300 font-medium">
                                                            {review.clinic_reply}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {editingReplyId === review.id ? (
                                                        <div className="space-y-3">
                                                            <textarea 
                                                                value={replyText[review.id] || ""}
                                                                onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                                                                placeholder="Müşterinize vereceğiniz yanıt buraya girin (herkese açık olacaktır)..."
                                                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-xl p-3 text-xs focus:border-[#5B4D9D] focus:ring-1 focus:ring-[#5B4D9D] outline-none min-h-[80px]"
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingReplyId(null)} className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">İptal</button>
                                                                <button 
                                                                    onClick={() => handleReplySubmit(review.id)}
                                                                    disabled={!replyText[review.id]?.trim() || isSubmittingReply[review.id]}
                                                                    className="bg-[#5B4D9D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4E3F8F] transition-all disabled:opacity-50"
                                                                >
                                                                    {isSubmittingReply[review.id] ? "Gönderiliyor..." : "Yanıtı Gönder"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setEditingReplyId(review.id)}
                                                            className="text-[10px] font-black uppercase tracking-widest text-[#5B4D9D] hover:text-[#4E3F8F] flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" /> Yanıtla
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'messages' && (
                    <div className="flex flex-col lg:flex-row gap-6 h-[75vh] w-full">
                        {/* Conversation List — mobilde bir konuşma seçilince tamamen gizlenir, sohbet ekranına yer açar */}
                        <div className={cn(
                            "w-full lg:w-[350px] shrink-0 border border-zinc-200 dark:border-card-border rounded-3xl bg-white dark:bg-[#12121A] overflow-hidden lg:flex flex-col shadow-moffi-card",
                            selectedConv ? "hidden" : "flex"
                        )}>
                            <div className="p-4 border-b border-zinc-200 dark:border-card-border bg-zinc-50 dark:bg-[#18181b]">
                                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-500">Müşteri Mesajları</h3>
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {conversations.length === 0 && (
                                    <div className="text-center text-sm text-zinc-400 p-4 font-bold">Henüz mesaj yok.</div>
                                )}
                                {conversations.map(conv => (
                                    <button 
                                        key={conv.userId}
                                        onClick={() => setSelectedConv(conv)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left",
                                            selectedConv?.userId === conv.userId 
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" 
                                                : "hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {conv.avatar
                                            ? <img src={conv.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-zinc-200 shrink-0" />
                                            : <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0">{(conv.partnerName || '?').charAt(0).toLocaleUpperCase('tr-TR')}</div>}
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-sm truncate dark:text-white text-zinc-800">{conv.partnerName}</div>
                                                <div className={cn("text-xs truncate", conv.unread ? "font-bold text-indigo-500" : "text-zinc-500")}>
                                                    {conv.latestMessage}
                                                </div>
                                            </div>
                                        </div>
                                        {conv.unread && (
                                            <div className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                                •
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Area — mobilde sadece bir konuşma seçiliyken görünür, tüm genişliği/yüksekliği kullanır */}
                        <div className={cn(
                            "flex-1 border border-zinc-200 dark:border-card-border rounded-3xl bg-white dark:bg-[#12121A] overflow-hidden lg:flex flex-col shadow-moffi-card",
                            selectedConv ? "flex" : "hidden"
                        )}>
                            {selectedConv ? (
                                <>
                                    <div className="p-4 border-b border-zinc-200 dark:border-card-border flex items-center gap-3 bg-zinc-50 dark:bg-[#18181b]">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedConv(null)}
                                            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 shrink-0"
                                            aria-label="Konuşma listesine dön"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {selectedConv.avatar
                                            ? <img src={selectedConv.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-zinc-200 shrink-0" />
                                            : <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0">{(selectedConv.partnerName || '?').charAt(0).toLocaleUpperCase('tr-TR')}</div>}
                                        <h3 className="font-black text-sm uppercase dark:text-white text-zinc-800">{selectedConv.partnerName}</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        <ChatMessageList
                                            messages={chatMessages}
                                            onRecall={handleRecallMessage}
                                            emptyLabel="Henüz mesaj yok"
                                            emptyIcon={<MessageSquare className="w-12 h-12 mb-4 mx-auto" />}
                                        />
                                    </div>
                                    <div className="p-4 border-t border-zinc-200 dark:border-card-border bg-zinc-50 dark:bg-[#18181b]">
                                        <ChatComposer
                                            onSend={handleSendMessage}
                                            uploadImage={uploadChatImage}
                                            sending={isSendingMessage}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                                    <MessageSquare className="w-16 h-16 mb-4 text-zinc-300 dark:text-zinc-600 opacity-50" />
                                    <p className="font-bold text-lg text-zinc-500 uppercase tracking-tight">Mesajlaşmak için bir konuşma seçin</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            {/* CONSULTATION FORM MODAL */}
            <AnimatePresence>
                {isModalOpen && selectedApt && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeConsultation}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#12121A] border border-zinc-200 dark:border-card-border rounded-[2.5rem] overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* HEADER */}
                            <div className="p-6 border-b border-zinc-200 dark:border-card-border flex items-center justify-between bg-gradient-to-br from-[#5B4D9D]/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#5B4D9D]/10 dark:bg-[#5B4D9D]/20 flex items-center justify-center text-[#5B4D9D] border border-[#5B4D9D]/20">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">
                                            {hasMedicalRecords
                                                ? (selectedApt.status === 'completed' ? 'Muayene Detayları' : 'Muayene & Reçete Formu')
                                                : (selectedApt.status === 'completed' ? 'Randevu Detayları' : 'Randevuyu Tamamla')}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1.5 tracking-widest">
                                            {selectedApt.petName} • Sahibi: {selectedApt.ownerName}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={closeConsultation} className="w-10 h-10 rounded-full bg-[#5B4D9D]/10 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-foreground dark:text-gray-400 dark:hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* CONTENT */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-foreground dark:text-gray-300">
                                {/* Shared Passport Preview */}
                                {selectedApt.sharedPassport && (
                                    <div className="bg-indigo-50/30 dark:bg-white/5 border border-indigo-500/10 dark:border-indigo-500/5 p-4 rounded-3xl space-y-2 text-left">
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Paylaşılan Tıbbi Pasaport Bilgileri</span>
                                        {checkAccessGranted(selectedApt) ? (
                                            <>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                    <div><strong className="text-gray-500 dark:text-gray-400">Irk:</strong> {selectedApt.sharedPassport.basic?.breed || 'Belirtilmemiş'}</div>
                                                    <div><strong className="text-gray-500 dark:text-gray-400">Kilo:</strong> {selectedApt.sharedPassport.basic?.weight || 'Belirtilmemiş'}</div>
                                                    <div><strong className="text-gray-500 dark:text-gray-400">Yaş:</strong> {selectedApt.sharedPassport.basic?.age || 'Belirtilmemiş'}</div>
                                                    <div><strong className="text-gray-500 dark:text-gray-400">Cinsiyet:</strong> {selectedApt.sharedPassport.basic?.gender || 'Belirtilmemiş'}</div>
                                                </div>
                                                {selectedApt.sharedPassport.vaccines && selectedApt.sharedPassport.vaccines.length > 0 && (
                                                    <div className="text-xs pt-2 border-t border-zinc-200 dark:border-white/5">
                                                        <strong className="text-gray-500 dark:text-gray-400">Son Aşılar:</strong> {selectedApt.sharedPassport.vaccines.map((v: any) => v.definition?.name || v.name || 'Bilinmeyen Aşı').join(", ")}
                                                    </div>
                                                )}
                                                {selectedApt.sharedPassport.healthNotes && (
                                                    <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-500/5 p-2 rounded-xl border border-orange-500/10 mt-1">
                                                        ⚠️ <strong>Kritik Sağlık Notu:</strong> {selectedApt.sharedPassport.healthNotes}
                                                    </div>
                                                )}
                                                {selectedApt.sharedPassport.ownerInfo && (
                                                    <div className="text-xs text-indigo-650 dark:text-indigo-400 bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10 mt-1">
                                                        📞 <strong>Sahip İletişim:</strong> {selectedApt.sharedPassport.ownerInfo.name} ({selectedApt.sharedPassport.ownerInfo.phone} • {selectedApt.sharedPassport.ownerInfo.email})
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-xs text-red-500 dark:text-red-400 font-bold py-1 flex items-center gap-1.5 leading-snug">
                                                🔒 Tıbbi Pasaport Erişimi Kapalı (Erişim süresi randevudan 24 saat önce başlar ve 24 saat sonra biter)
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedApt.status === 'completed' ? (
                                    /* READ-ONLY VIEW FOR COMPLETED APPOINTMENTS */
                                    <div className="space-y-6 text-left">
                                        {!hasMedicalRecords && !selectedApt.consultationData?.criticalNotes && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
                                                <p className="font-bold text-emerald-800 dark:text-emerald-300">Bu randevu tamamlandı.</p>
                                            </div>
                                        )}

                                        {hasMedicalRecords && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">Tanı / Teşhis</span>
                                                <p className="font-bold text-lg text-emerald-800 dark:text-emerald-300">{selectedApt.consultationData?.diagnosis || "Tanı girilmemiş"}</p>
                                            </div>
                                        )}

                                        {hasMedicalRecords && (selectedApt.consultationData?.weightKg != null || selectedApt.consultationData?.temperatureC != null) && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedApt.consultationData?.weightKg != null && (
                                                    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border p-4 rounded-3xl">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Kilo</span>
                                                        <p className="font-bold text-foreground">{String(selectedApt.consultationData.weightKg).replace('.', ',')} kg</p>
                                                    </div>
                                                )}
                                                {selectedApt.consultationData?.temperatureC != null && (
                                                    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border p-4 rounded-3xl">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Vücut sıcaklığı</span>
                                                        <p className="font-bold text-foreground">{String(selectedApt.consultationData.temperatureC).replace('.', ',')} °C</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {hasMedicalRecords && selectedApt.consultationData?.vaccines?.length > 0 && (
                                            <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border p-4 rounded-3xl">
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2">Uygulanan Aşılar</span>
                                                <div className="space-y-3">
                                                    {selectedApt.consultationData.vaccines.map((v: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                                                            <div>
                                                                <strong className="text-foreground dark:text-white flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5 text-emerald-500" /> {v.name}</strong>
                                                                <div className="text-xs text-gray-500">Seri/Lot: {v.batch || 'Yok'}</div>
                                                            </div>
                                                            <div className="text-right text-xs">
                                                                <div>Tarih: {v.date}</div>
                                                                <div className="text-indigo-600 dark:text-indigo-400 font-bold">Gelecek Doz: {v.nextDate || 'Planlanmadı'}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {hasMedicalRecords && selectedApt.consultationData?.medications?.length > 0 && (
                                            <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-card-border p-4 rounded-3xl">
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2">Yazılan Reçete</span>
                                                <div className="space-y-3">
                                                    {selectedApt.consultationData.medications.map((m: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                                                            <div>
                                                                <strong className="text-foreground dark:text-white flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-indigo-500" /> {m.name}</strong>
                                                                <div className="text-xs text-gray-500">Dozaj: {m.dose}</div>
                                                            </div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-zinc-200 dark:bg-white/5 px-2 py-1 rounded-lg">
                                                                Süre: {m.duration} Gün
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedApt.consultationData?.criticalNotes && (
                                            <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-3xl">
                                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">{hasMedicalRecords ? 'Evcil Hayvan Pasaport Notu' : 'Not'}</span>
                                                <p className="text-sm text-orange-800 dark:text-orange-300 font-semibold">{selectedApt.consultationData.criticalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* INTERACTIVE FORM FOR NEW CONSULTATION */
                                    <div className="space-y-6 text-left">
                                      {hasMedicalRecords && (<>
                                        {/* Diagnosis */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Muayene Bulgusu / Tanı (Zorunlu)</label>
                                            <input
                                                required
                                                value={diagnosis}
                                                onChange={e => setDiagnosis(e.target.value)}
                                                placeholder="Örn: Otitis, Aşı Uygulaması, Gıda Alerjisi..."
                                                className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white transition-all"
                                            />
                                        </div>

                                        {/* Ölçümler — kilo, hastanın kilo geçmişine de eklenir */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="space-y-2 block">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Kilo (kg)</span>
                                                <input
                                                    inputMode="decimal"
                                                    value={weightKg}
                                                    onChange={e => setWeightKg(e.target.value)}
                                                    placeholder="Örn: 4,2"
                                                    className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                />
                                            </label>
                                            <label className="space-y-2 block">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Vücut sıcaklığı (°C)</span>
                                                <input
                                                    inputMode="decimal"
                                                    value={temperatureC}
                                                    onChange={e => setTemperatureC(e.target.value)}
                                                    placeholder="Örn: 38,5"
                                                    className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                />
                                            </label>
                                        </div>

                                        {/* Vaccine Form */}
                                        <div className="border border-zinc-200 dark:border-card-border rounded-3xl p-4 space-y-4 bg-zinc-50 dark:bg-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest flex items-center gap-1"><Syringe className="w-3.5 h-3.5" /> Aşı Uygula</span>
                                                <span className="bg-[#5B4D9D]/10 text-[#5B4D9D] text-[8px] px-2 py-0.5 rounded-full font-bold">Opsiyonel</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Aşı</label>
                                                    {vaccineDefs.length > 0 && (
                                                        <select
                                                            value={vaccineDefId}
                                                            onChange={e => setVaccineDefId(e.target.value)}
                                                            aria-label="Aşı seç"
                                                            className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                        >
                                                            <option value="">Listeden seçin…</option>
                                                            {vaccineDefs.map(d => <option key={d.id} value={d.id}>{d.name}{d.isCore ? '' : ' (isteğe bağlı)'}</option>)}
                                                            <option value="__other">Listede yok, adını yazacağım</option>
                                                        </select>
                                                    )}
                                                    {(vaccineDefs.length === 0 || vaccineDefId === '__other') && (
                                                        <input
                                                            value={vaccineName}
                                                            onChange={e => setVaccineName(e.target.value)}
                                                            placeholder="Aşının adı"
                                                            className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                        />
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Sonraki doz (boşsa aşı aralığına göre hesaplanır)</label>
                                                    <input 
                                                        type="date"
                                                        value={vaccineNextDate}
                                                        onChange={e => setVaccineNextDate(e.target.value)}
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Aşı Seri No / Lot</label>
                                                    <input 
                                                        value={vaccineBatch}
                                                        onChange={e => setVaccineBatch(e.target.value)}
                                                        placeholder="Örn: LOT-98X2"
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button 
                                                        type="button"
                                                        onClick={handleAddVaccine}
                                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Aşıyı Muayene Akışına Ekle
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {addedVaccines.length > 0 && (
                                                <div className="mt-2 space-y-1 bg-white dark:bg-black/20 p-2 rounded-xl border border-zinc-200 dark:border-white/5">
                                                    {addedVaccines.map((v, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            <span>💉 {v.name} (Seri: {v.batch || 'Girilmedi'})</span>
                                                            <span>Tekrar: {v.nextDate || (v.definitionId ? 'aşı aralığına göre' : 'girilmedi')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Medication Form */}
                                        <div className="border border-zinc-200 dark:border-card-border rounded-3xl p-4 space-y-4 bg-zinc-50 dark:bg-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Reçeteli İlaç Yaz</span>
                                                <span className="bg-[#5B4D9D]/10 text-[#5B4D9D] text-[8px] px-2 py-0.5 rounded-full font-bold">Opsiyonel</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">İlaç Adı</label>
                                                    <input 
                                                        value={medName}
                                                        onChange={e => setMedName(e.target.value)}
                                                        placeholder="Örn: Amoksisilin"
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Dozaj / Kullanım</label>
                                                    <input 
                                                        value={medDose}
                                                        onChange={e => setMedDose(e.target.value)}
                                                        placeholder="Günde 2 kez 1 tablet"
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Kullanım Süresi (Gün)</label>
                                                    <input 
                                                        type="number"
                                                        value={medDuration}
                                                        onChange={e => setMedDuration(e.target.value)}
                                                        placeholder="5"
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleAddMedication}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                                            >
                                                İlacı Reçeteye Ekle
                                            </button>

                                            {addedMeds.length > 0 && (
                                                <div className="mt-2 space-y-1 bg-white dark:bg-black/20 p-2 rounded-xl border border-zinc-200 dark:border-white/5">
                                                    {addedMeds.map((m, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                                            <span>💊 {m.name} - {m.dose}</span>
                                                            <span>Süre: {m.duration} Gün</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                      </>)}

                                        {typeHasMedicalRecords && selectedApt?.isGuest && (
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-2xl p-3">
                                                Bu müşteri henüz Moffi&apos;de değil. Randevuyu tamamlayabilirsin; muayene kaydı, müşteri hesabını Veri Taşıma üzerinden eşleştirdiğinde evcil hayvanının pasaportuna girilebilir.
                                            </p>
                                        )}

                                        {/* Notes — vet'te "kritik sağlık/alerji notu" (pasaporta işlenir), diğer türlerde genel randevu notu */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> {hasMedicalRecords ? 'Kritik Sağlık / Alerji Notu' : 'Not (Opsiyonel)'}
                                            </label>
                                            <textarea
                                                value={criticalNotes}
                                                onChange={e => setCriticalNotes(e.target.value)}
                                                placeholder={hasMedicalRecords ? "Bu evcil hayvana ait pasaportta kalıcı görünecek kritik sağlık notu..." : "Bu randevuyla ilgili eklemek istediğiniz bir not..."}
                                                className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-2xl px-4 py-3 text-sm focus:border-orange-500 outline-none text-foreground dark:text-white transition-all min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER ACTIONS */}
                            {selectedApt.status !== 'completed' && (
                                <div className="p-6 border-t border-zinc-200 dark:border-card-border flex gap-4 bg-zinc-50 dark:bg-white/5">
                                    <button 
                                        onClick={closeConsultation}
                                        className="flex-1 py-3 rounded-2xl bg-zinc-200 hover:bg-zinc-350 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold transition-all text-sm"
                                    >
                                        Vazgeç
                                    </button>
                                    <button 
                                        onClick={handleCompleteConsultation}
                                        className="flex-1 py-3 rounded-2xl bg-[#5B4D9D] hover:bg-[#4E3F8F] text-white font-bold transition-all text-sm shadow-lg shadow-purple-500/20"
                                    >
                                        {hasMedicalRecords ? 'Muayeneyi Tamamla ve Kaydet' : 'Randevuyu Tamamla'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Close Warning Modal */}
            <AnimatePresence>
                {closeWarningModal.isOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10"
                        >
                            <div className="p-6 text-center space-y-4">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full mx-auto flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-foreground dark:text-white uppercase tracking-tight">Kapanış Onayı</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    Bu günde <span className="font-bold text-foreground dark:text-white">{closeWarningModal.appointments.length} randevunuz</span> var:
                                </p>
                                <div className="max-h-32 overflow-y-auto bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-left">
                                    {closeWarningModal.appointments.map(a => (
                                        <div key={a.id} className="text-xs font-bold text-foreground dark:text-white mb-1">
                                            • {a.time} - {a.petName} ({a.ownerName})
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-left">
                                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                                        💡 <strong className="font-black">Hatırlatma:</strong> Mesajlar sekmesinden müşterilerinizle doğrudan iletişime geçebilirsiniz.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 space-y-3">
                                <button
                                    disabled={closeWarningModal.isProcessing}
                                    onClick={() => closeWarningModal.onConfirm?.(false)}
                                    className="w-full py-4 rounded-2xl bg-white dark:bg-black text-foreground dark:text-white font-black text-xs uppercase tracking-wider hover:opacity-80 transition-all border border-black/10 dark:border-white/10"
                                >
                                    Randevuları Koru, Sadece Yeni Alımı Kapat
                                </button>
                                <button
                                    disabled={closeWarningModal.isProcessing}
                                    onClick={() => closeWarningModal.onConfirm?.(true)}
                                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {closeWarningModal.isProcessing ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Tümünü İptal Et ve Bildirim Gönder"
                                    )}
                                </button>
                                <button
                                    disabled={closeWarningModal.isProcessing}
                                    onClick={() => setCloseWarningModal({ isOpen: false, appointments: [], onConfirm: null })}
                                    className="w-full py-2 text-gray-500 hover:text-foreground dark:hover:text-white font-bold text-xs uppercase transition-all"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
