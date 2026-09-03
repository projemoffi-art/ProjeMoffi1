"use client";

import { useState, useEffect } from "react";
import {
    CalendarCheck, CheckCircle2,
    User, Bell, X, Syringe, ClipboardList, Pill, AlertTriangle,
    Clock, Coffee, Save, Calendar, Heart, Send, Star, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessSidebar as Sidebar } from "@/components/business/Sidebar";
import { usePet } from "@/context/PetContext";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/utils";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { supabase } from "@/lib/supabase";
import { sendAppointmentConfirmationEmail } from "@/actions/sendAppointmentEmail";
import { useDragScroll } from "@/hooks/useDragScroll";

export default function BusinessAppointmentsPage() {
    const { customRecords, setCustomRecords, updatePet } = usePet();
    const { user } = useAuth();

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [diagnosis, setDiagnosis] = useState("");
    
    // Vaccine Form States
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
    const [activeTab, setActiveTab] = useState<'appointments' | 'advice' | 'shifts' | 'reviews'>('appointments');
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
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [lunchStart, setLunchStart] = useState("12:00");
    const [lunchEnd, setLunchEnd] = useState("13:00");
    const [slotDuration, setSlotDuration] = useState<number>(30);

    // Vet Health Advice States
    const [vetAdviceText, setVetAdviceText] = useState("");
    const [vetAdviceBadge, setVetAdviceBadge] = useState("Genel Sağlık 🩺");

    // Exception States
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [selectedExceptionDate, setSelectedExceptionDate] = useState<string | null>(null);
    const [exceptionForm, setExceptionForm] = useState<{ isClosed: boolean, open: string, close: string }>({ isClosed: false, open: "09:00", close: "18:00" });
    
    const exceptionsScrollProps = useDragScroll();

    const fetchExceptions = async () => {
        if (!user?.id || !isSupabaseEnabled) return;
        try {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 14);
            
            const todayStr = today.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            
            const list = await apiService.getClinicExceptions(user.id, todayStr, endStr);
            setExceptions(list);
        } catch (e) {
            console.error("Error fetching exceptions:", e);
        }
    };

    const handleSaveException = async () => {
        console.log("SAVE TIKLANDI", { user_id: user?.id, selectedExceptionDate, exceptionForm });
        if (!user?.id || !selectedExceptionDate) return;
        try {
            const dateObj = new Date(selectedExceptionDate);
            const dayKey = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const baseHours = workingHours[dayKey] || { open: "09:00", close: "18:00", closed: false };

            const isSameAsDefault = 
                exceptionForm.isClosed === baseHours.closed && 
                (exceptionForm.isClosed || (exceptionForm.open === baseHours.open && exceptionForm.close === baseHours.close));

            if (isSameAsDefault) {
                await apiService.deleteClinicException(user.id, selectedExceptionDate);
                showToast("Gün varsayılan saatlere döndürüldü! ✨", "CheckCircle2", "text-emerald-500 font-bold");
            } else {
                await apiService.upsertClinicException(
                    user.id,
                    selectedExceptionDate,
                    exceptionForm.isClosed,
                    exceptionForm.isClosed ? null : exceptionForm.open,
                    exceptionForm.isClosed ? null : exceptionForm.close
                );
                showToast("İstisna başarıyla kaydedildi! ✨", "CheckCircle2", "text-emerald-500 font-bold");
            }
            
            setSelectedExceptionDate(null);
            fetchExceptions();
        } catch (e) {
            console.error("Error saving exception:", e);
            showToast("İşlem başarısız oldu! ❌", "AlertTriangle", "text-red-500 font-bold");
        }
    };

    const handleDeleteException = async (date: string) => {
        if (!user?.id) return;
        try {
            await apiService.deleteClinicException(user.id, date);
            showToast("İstisna kaldırıldı, gün normale döndü! ✨", "CheckCircle2", "text-emerald-500 font-bold");
            setSelectedExceptionDate(null);
            fetchExceptions();
        } catch (e) {
            console.error("Error deleting exception:", e);
            showToast("İstisna silinemedi! ❌", "AlertTriangle", "text-red-500 font-bold");
        }
    };

    const fetchAppointmentsFromDb = async () => {
        console.log(`[RANDEVU-TEST] ${new Date().toISOString()} - Fetch BAŞLADI`);
        if (!user?.id) {
            console.warn("Klinik ID'si bulunamadı, kullanıcı oturumu yüklenmemiş olabilir.");
            return;
        }
        try {
            const clinicId = user.id;
            const list = await apiService.getClinicAppointments(clinicId);
            const mapped = list.map((item: any) => {
                let time = "00:00";
                let dateStr = "Bugün";
                try {
                    if (item.appointment_date) {
                        const d = new Date(item.appointment_date);
                        time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        dateStr = `${year}-${month}-${day}`;
                        
                        const today = new Date();
                        if (d.toDateString() === today.toDateString()) {
                            dateStr = "Bugün";
                        } else {
                            const tomorrow = new Date();
                            tomorrow.setDate(today.getDate() + 1);
                            if (d.toDateString() === tomorrow.toDateString()) {
                                dateStr = "Yarın";
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing date:", e);
                }

                return {
                    id: item.id,
                    userId: item.user_id,
                    petName: item.pet?.name || "Milo",
                    ownerName: item.user?.full_name || item.user?.username || "Pati Sahibi",
                    time: time,
                    date: dateStr,
                    type: item.reason || "Rutin Kontrol",
                    status: item.status,
                    image: item.pet?.avatar_url || item.pet?.photo_url || item.pet?.image || "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100",
                    petId: item.pet_id,
                    sharedPassport: item.shared_passport || {
                        basic: {
                            breed: item.pet?.breed || "Bilinmiyor",
                            weight: item.pet?.weight || "10kg",
                            age: item.pet?.age || "2.1"
                        },
                        ownerInfo: {
                            name: item.user?.full_name || item.user?.username || "Pati Sahibi",
                            phone: item.user?.phone || ""
                        }
                    },
                    clinicId: item.clinic_id,
                    clinicName: item.clinic_name
                };
            });
            // Test mock kaldırıldı
            const confirmed = mapped.filter((a: any) => a.status === 'confirmed' || a.status === 'completed');
            const pending = mapped.filter((a: any) => a.status === 'pending');

            console.log(`[RANDEVU-TEST] ${new Date().toISOString()} - Gelen veri sayısı:`, list?.length, list);
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
            if (!user?.id) return;
            
            if (isSupabaseEnabled) {
                try {
                    const clinicId = user.id;
                    const [settings, profile] = await Promise.all([
                        apiService.getClinicSettings(clinicId),
                        apiService.getUserProfile(clinicId)
                    ]);
                    
                    if (profile?.working_hours) {
                        setWorkingHours(profile.working_hours);
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
                const saved = localStorage.getItem('moffi_clinic_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.workingHours) setWorkingHours(parsed.workingHours);
                    if (parsed.startTime) setStartTime(parsed.startTime);
                    if (parsed.endTime) setEndTime(parsed.endTime);
                    if (parsed.lunchStart) setLunchStart(parsed.lunchStart);
                    if (parsed.lunchEnd) setLunchEnd(parsed.lunchEnd);
                    if (parsed.slotDuration) setSlotDuration(Number(parsed.slotDuration));
                }
            } catch (e) {
                console.error("Failed to load clinic settings:", e);
            }

            try {
                const clinicId = user?.id;
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
    }, [user?.id]);

    const loadReviews = async () => {
        if (!user?.id || !isSupabaseEnabled) return;
        setIsLoadingReviews(true);
        try {
            console.log("Loading reviews for clinic ID:", user.id);
            const data = await apiService.getClinicReviews(user.id);
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
    }, [activeTab, user?.id]);

    const handleReplySubmit = async (reviewId: string) => {
        const text = replyText[reviewId];
        if (!text || !text.trim() || !user?.id) return;
        
        setIsSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
        try {
            const success = await apiService.replyToReview(reviewId, user.id, text.trim());
            if (success) {
                setEditingReplyId(null);
                await loadReviews();
            } else {
                alert("Yanıt gönderilemedi.");
            }
        } catch (error) {
            console.error("Yanıt hatası:", error);
            alert("Beklenmeyen bir hata oluştu.");
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
    }, [user?.id]);

    // Fetch new appointments from Server (realtime / polling)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkNew = () => {
            if (isSupabaseEnabled) {
                fetchAppointmentsFromDb();
                return;
            }
            try {
                const stored = localStorage.getItem('moffi_pending_appointments');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setPendingRequests(parsed);
                }
            } catch (e) {
                console.error("Storage Error:", e);
            }
        };

        // Poll every 3 seconds as a fallback
        const interval = setInterval(checkNew, 3000);
        checkNew(); // Initial check

        // Listen for real-time created notifications via BroadcastChannel
        const channel = new BroadcastChannel('moffi_appointments_channel');
        const handleMessage = (event: MessageEvent) => {
            const { type } = event.data;
            if (type === 'APPOINTMENT_CREATED') {
                checkNew();
                showToast("Yeni Randevu Talebi! Bir pati sahibi randevu talebinde bulundu. 🐾", "Bell", "text-indigo-400 font-bold");
            }
        };
        channel.addEventListener('message', handleMessage);

        return () => {
            clearInterval(interval);
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, []);

    const saveAppointments = (updated: any[]) => {
        setAppointments(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_confirmed_appointments', JSON.stringify(updated));
        }
    };

    const handleAction = async (id: number | string, action: 'accept' | 'reject') => {
        const target = pendingRequests.find(r => r.id === id);
        if (!target) return;

        if (isSupabaseEnabled) {
            try {
                await apiService.updateAppointmentStatus(id.toString(), action === 'accept' ? 'confirmed' : 'rejected');
                showToast(
                    action === 'accept' 
                        ? `Randevu Onaylandı! ${target.petName} için bildirim gönderildi. ✨`
                        : `Randevu Reddedildi! ❌`, 
                    action === 'accept' ? "CheckCircle2" : "XCircle", 
                    action === 'accept' ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                );
                
                // Broadcast event to pati sahibi
                const channel = new BroadcastChannel('moffi_appointments_channel');
                channel.postMessage({ type: 'APPOINTMENT_ACTION', appointmentId: id, action: action, petName: target.petName });
                channel.close();

                // --- B1: Send Appointment Confirmation Email ---
                if (action === 'accept' && target.userId) {
                    try {
                        await sendAppointmentConfirmationEmail({
                            userId: target.userId,
                            clinicName: user?.user_metadata?.business_name || user?.email || "Moffi Kliniği",
                            date: target.date || "Belirtilmedi",
                            time: target.time || "Belirtilmedi",
                            petName: target.petName
                        });
                    } catch (emailErr) {
                        console.error("Failed to send appointment confirmation email:", emailErr);
                    }
                }
                // --- END B1 ---

                await fetchAppointmentsFromDb();
                return;
            } catch (e) {
                console.error("Failed to update appointment status in Supabase:", e);
                showToast("Randevu durumu güncellenemedi. ❌", "AlertTriangle", "text-red-400 font-bold");
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
            
            // Broadcast event to pati sahibi
            const channel = new BroadcastChannel('moffi_appointments_channel');
            channel.postMessage({ type: 'APPOINTMENT_ACTION', appointmentId: id, action: 'accept', petName: target.petName });
            channel.close();
        } else if (action === 'reject') {
            // Replace alert with premium showToast
            showToast(`Randevu Reddedildi! ❌`, "XCircle", "text-red-400 font-bold");
            
            // Broadcast event to pati sahibi
            const channel = new BroadcastChannel('moffi_appointments_channel');
            channel.postMessage({ type: 'APPOINTMENT_ACTION', appointmentId: id, action: 'reject', petName: target.petName });
            channel.close();
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
        if (apt.status === 'completed' && apt.consultationData) {
            // Prefill with read-only data
            setDiagnosis(apt.consultationData.diagnosis || "");
            setAddedVaccines(apt.consultationData.vaccines || []);
            setAddedMeds(apt.consultationData.medications || []);
            setCriticalNotes(apt.consultationData.criticalNotes || "");
        } else {
            // Reset form fields for new consultation
            setDiagnosis("");
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
        if (!vaccineName) return;
        setAddedVaccines(prev => [...prev, {
            name: vaccineName,
            date: new Date().toISOString().split('T')[0],
            nextDate: vaccineNextDate,
            batch: vaccineBatch
        }]);
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
        if (!diagnosis) {
            showToast("Lütfen tanı alanını doldurun.", "AlertTriangle", "text-amber-500 font-bold");
            return;
        }

        const targetPetId = selectedApt.petId;
        
        // Remove mock ID fallback completely as instructed.
        // Use regex to strictly enforce UUID to block all mock IDs (e.g. 'pet-milo' or '349b...')
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!targetPetId || !uuidRegex.test(targetPetId)) {
            showToast("Gerçek bir evcil hayvan ID'si bulunamadı (Mock Veri). Sadece gerçek hastalara tanı girilebilir.", "AlertTriangle", "text-amber-500 font-bold");
            return;
        }

        const updatedApt = {
            ...selectedApt,
            status: 'completed',
            consultationData: {
                diagnosis,
                vaccines: addedVaccines,
                medications: addedMeds,
                criticalNotes
            }
        };

        // Live Supabase Integration (Atomik Sıralama)
        if (isSupabaseEnabled) {
            try {
                // 0.0 Authorization & RLS Check - Kliniğin bu randevuya erişimi var mı?
                const { data: authCheck, error: authErr } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('id', selectedApt.id)
                    .single();
                
                if (authErr || !authCheck) {
                    throw new Error("Yetkisiz işlem: Bu randevuya müdahale etme izniniz yok (RLS Engeli).");
                }

                // 0. Idempotency check — bu randevu için zaten bir EMR kaydı var mı?
                const { data: existingRecord } = await supabase
                    .from('medical_records')
                    .select('id')
                    .eq('appointment_id', selectedApt.id)
                    .maybeSingle();

                if (existingRecord) {
                    showToast("Bu randevu için muayene kaydı zaten oluşturulmuş.", "AlertTriangle", "text-amber-500 font-bold");
                    return;
                }

                // 1. ÖNCE EN KRİTİK VERİYİ YAZ (Teşhis / EMR)
                const { error: emrError } = await supabase.from('medical_records').insert({
                    pet_id: targetPetId,
                    appointment_id: selectedApt.id,
                    clinic_id: user?.id,
                    vet_name: user?.user_metadata?.business_name || user?.email || 'Moffi Kliniği',
                    diagnosis: diagnosis,
                    critical_notes: criticalNotes,
                    medications: addedMeds,
                });
                
                if (emrError) throw emrError; // Teşhis yazılamazsa hemen çık!

                // 2. Aşıları kaydet
                for (const v of addedVaccines) {
                    await apiService.addPetVaccine(targetPetId, {
                        name: v.name,
                        status: 'completed',
                        dueDate: v.nextDate || new Date().toISOString(),
                        dateAdministered: v.date || new Date().toISOString(),
                        vetName: user?.user_metadata?.business_name || user?.email || 'Moffi Kliniği'
                    });
                }
                
                // 3. İlaçları kaydet
                for (const m of addedMeds) {
                    await apiService.addPetMedication(targetPetId, {
                        name: m.name,
                        dosage: m.dose,
                        instructions: `${m.duration} gün boyunca kullanılacak.`,
                        startDate: new Date().toISOString()
                    });
                }

                // 4. EN SON Randevuyu 'completed' yap
                await apiService.updateAppointmentStatus(selectedApt.id.toString(), 'completed');
                
            } catch (e: any) {
                console.error("Failed to sync consultation details with Supabase:", e);
                // Do NOT swallow the error
                showToast("Veritabanı senkronizasyonu başarısız: " + (e.message || "Bilinmeyen Hata"), "AlertTriangle", "text-red-500 font-bold");
                return; // Stop execution, don't show success message and don't commit local state!
            }
        }

        // Supabase yazımı hatasız bittikten SONRA (veya mock moddaysak) local state'i güncelle
        const updatedList = appointments.map(apt => apt.id === selectedApt.id ? updatedApt : apt);
        saveAppointments(updatedList);

        // Show premium toast
        showToast("Muayene başarıyla tamamlandı ve evcil hayvan pasaportuna işlendi! 💉🩺", "Sparkles", "text-emerald-400 font-bold");
        
        // Broadcast completed consultation
        const channel = new BroadcastChannel('moffi_appointments_channel');
        channel.postMessage({ 
            type: 'CONSULTATION_COMPLETED', 
            petId: targetPetId, 
            petName: selectedApt.petName 
        });
        channel.close();

        closeConsultation();
    };

    const handleSaveSettings = async () => {
        if (!user?.id) {
            showToast("Oturumunuz doğrulanamadı, lütfen sayfayı yenileyin.", "AlertTriangle", "text-amber-500 font-bold");
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

        if (isSupabaseEnabled) {
            try {
                const clinicId = user.id;
                await Promise.all([
                    apiService.saveClinicSettings(clinicId, settings),
                    apiService.updateProfile({ working_hours: workingHours })
                ]);
            } catch (e) {
                console.error("Failed to save clinic settings to Supabase:", e);
                showToast("Vardiya ayarları veritabanına kaydedilemedi! ❌", "AlertTriangle", "text-red-500 font-bold");
                return;
            }
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_clinic_settings', JSON.stringify(settings));
        }
        showToast("Vardiya ve takvim ayarları başarıyla kaydedildi! 📅✨", "Save", "text-[#6366f1] font-bold");
    };

    const handleSaveAdvice = async () => {
        if (!user?.id) {
            showToast("Oturumunuz doğrulanamadı, lütfen sayfayı yenileyin.", "AlertTriangle", "text-amber-500 font-bold");
            return;
        }
        if (!vetAdviceText.trim()) {
            showToast("Lütfen bir tavsiye metni girin! ⚠️", "AlertTriangle", "text-amber-500 font-bold");
            return;
        }
        setIsSavingAdvice(true);
        try {
            if (isSupabaseEnabled) {
                const clinicId = user.id;
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

            showToast("Günün sağlık tavsiyesi başarıyla hikayelerde yayınlandı! 🩺🚀", "Check", "text-green-500 font-bold");
        } catch (e: any) {
            console.error("Failed to save clinic advice:", e);
            const errStr = e.message || e.error_description || JSON.stringify(e);
            showToast(`Tavsiye kaydedilemedi! ❌ Hata: ${errStr.slice(0, 80)}`, "AlertTriangle", "text-red-500 font-bold");
        } finally {
            setIsSavingAdvice(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sans">
            <Sidebar />

            <main className="flex-1 p-8 ml-0 md:ml-20 lg:ml-72 transition-all duration-300">
                {/* HEADER */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-foreground dark:text-white mb-2">Randevu Yönetimi</h1>
                        <p className="text-gray-500 font-medium">VetLife Global Clinic • 12 Aralık 2025</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 rounded-2xl bg-card dark:bg-white/5 border border-card-border dark:border-card-border flex items-center justify-center relative">
                            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            {pendingRequests.length > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse" />}
                        </button>
                        <div className="hidden md:flex items-center gap-3 bg-card dark:bg-white/5 px-4 py-2 rounded-2xl border border-card-border dark:border-card-border">
                            <img src={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea86b48e?w=100"} className="w-8 h-8 rounded-full object-cover" />
                            <span className="font-bold text-sm">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Klinik Yöneticisi"}</span>
                        </div>
                    </div>
                </header>

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
                </div>

                {activeTab === 'appointments' && (
                    <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: CALENDAR & CONFIRMED LIST */}
                    <div className="flex-1 space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-card dark:bg-[#121212] p-6 rounded-3xl border border-card-border dark:border-card-border shadow-moffi-card">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Bugünkü Randevular</div>
                                <div className="text-4xl font-black text-foreground dark:text-white">{appointments.length + pendingRequests.length}</div>
                            </div>
                            <div className="bg-[#5B4D9D] p-6 rounded-3xl shadow-xl shadow-purple-500/20 text-white">
                                <div className="text-black/60 dark:text-white/60 text-xs font-bold uppercase mb-2">Bekleyen Onay</div>
                                <div className="text-4xl font-black">{pendingRequests.length}</div>
                            </div>
                            <div className="bg-card dark:bg-[#121212] p-6 rounded-3xl border border-card-border dark:border-card-border shadow-moffi-card">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Tahmini Kazanç</div>
                                <div className="text-4xl font-black text-green-500 flex items-baseline gap-1">
                                    {(appointments.length * 650).toLocaleString()}<span className="text-sm">₺</span>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-[#5B4D9D]" /> Program Akışı</h3>
                            </div>

                            <div className="space-y-4">
                                {appointments.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-10">Bugün için planlanmış randevu yok.</div>}
                                {appointments.map((apt) => (
                                    <div key={apt.id} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-black/5 dark:bg-white/5 transition-colors border border-transparent hover:border-card-border dark:hover:border-card-border">
                                        <div className="font-mono font-bold text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">{apt.time || "--:--"}</div>
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden">
                                                <img src={apt.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center ${apt.status === 'completed' ? 'bg-[#5B4D9D]' : 'bg-green-500'}`}>
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-lg text-foreground dark:text-white">{apt.petName}</div>
                                                {apt.status === 'completed' ? (
                                                    <span className="text-[10px] bg-[#5B4D9D]/10 text-[#5B4D9D] font-bold px-2 py-0.5 rounded-full border border-[#5B4D9D]/20">Tamamlandı</span>
                                                ) : (
                                                    <span className="text-[10px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded-full border border-green-500/20">Onaylı</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <User className="w-3 h-3" /> {apt.ownerName} • {apt.type}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => startConsultation(apt)}
                                            className="px-4 py-2 rounded-xl bg-card dark:bg-white/5 border border-card-border text-sm font-bold hover:bg-white dark:bg-black hover:text-white dark:hover:bg-indigo-600 transition-colors"
                                        >
                                            {apt.status === 'completed' ? 'Muayene Detayı' : 'Muayene Et'}
                                        </button>
                                    </div>
                                ))}
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

                                <AnimatePresence>
                                    {pendingRequests.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-card-border dark:border-card-border">
                                            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Bekleyen istek yok</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingRequests.map(req => (
                                                <motion.div
                                                    key={req.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-[#F8F9FC] dark:bg-white/5 p-4 rounded-3xl border border-indigo-100 dark:border-card-border"
                                                >
                                                    <div className="flex gap-4 mb-4">
                                                        <img src={req.image} className="w-14 h-14 rounded-2xl object-cover" />
                                                        <div>
                                                            <div className="font-black text-foreground dark:text-white text-lg">{req.petName}</div>
                                                            <div className="text-xs text-gray-500 font-bold bg-card dark:bg-black/20 px-2 py-1 rounded-md inline-block mt-1">
                                                                ⏰ {req.time || "Saatsiz"} • {req.date}
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
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 py-3 rounded-xl bg-card dark:bg-white/5 border border-card-border text-red-500 font-bold hover:bg-red-50 transition-colors">Reddet</button>
                                                        <button onClick={() => handleAction(req.id, 'accept')} className="flex-1 py-3 rounded-xl bg-[#5B4D9D] text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">Onayla</button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
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
                                    const dateStr = d.toISOString().split('T')[0];
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
                                                        console.log("TOGGLE TIKLANDI, ONCEKI isClosed:", exceptionForm.isClosed);
                                                        setExceptionForm(prev => {
                                                            console.log("TOGGLE ICINDE prev.isClosed:", prev.isClosed, "-> YENI:", !prev.isClosed);
                                                            return { ...prev, isClosed: !prev.isClosed };
                                                        });
                                                    }}
                                                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${exceptionForm.isClosed ? 'bg-red-500' : 'bg-[#5B4D9D]'}`}
                                                >
                                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${exceptionForm.isClosed ? 'translate-x-4.5' : 'translate-x-0'}`} />
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
                                        <div className="w-full py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg select-none">
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
            </main>

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
                                            {selectedApt.status === 'completed' ? 'Muayene Detayları' : 'Muayene & Reçete Formu'}
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
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">Tanı / Teşhis</span>
                                            <p className="font-bold text-lg text-emerald-800 dark:text-emerald-300">{selectedApt.consultationData?.diagnosis || "Tanı girilmemiş"}</p>
                                        </div>

                                        {selectedApt.consultationData?.vaccines?.length > 0 && (
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

                                        {selectedApt.consultationData?.medications?.length > 0 && (
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
                                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">Evcil Hayvan Pasaport Notu</span>
                                                <p className="text-sm text-orange-800 dark:text-orange-300 font-semibold">{selectedApt.consultationData.criticalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* INTERACTIVE FORM FOR NEW CONSULTATION */
                                    <div className="space-y-6 text-left">
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

                                        {/* Vaccine Form */}
                                        <div className="border border-zinc-200 dark:border-card-border rounded-3xl p-4 space-y-4 bg-zinc-50 dark:bg-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest flex items-center gap-1"><Syringe className="w-3.5 h-3.5" /> Aşı Uygula</span>
                                                <span className="bg-[#5B4D9D]/10 text-[#5B4D9D] text-[8px] px-2 py-0.5 rounded-full font-bold">Opsiyonel</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Aşı Adı</label>
                                                    <input 
                                                        list="vaccines-list"
                                                        value={vaccineName}
                                                        onChange={e => setVaccineName(e.target.value)}
                                                        placeholder="Aşı seçin veya yazın..."
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                                    />
                                                    <datalist id="vaccines-list">
                                                        <option value="Karma Aşı (DHPPI)" />
                                                        <option value="Kuduz Aşısı (Rabies)" />
                                                        <option value="Mantar Aşısı" />
                                                        <option value="Bronchine Aşı" />
                                                        <option value="Corona Aşı" />
                                                        <option value="İç Parazit Enjeksiyon" />
                                                        <option value="Dış Parazit Damla" />
                                                    </datalist>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500">Gelecek Tekrar Tarihi</label>
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
                                                            <span>Tekrar: {v.nextDate || 'Planlanmadı'}</span>
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

                                        {/* Critical Health Notes */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest ml-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Kritik Sağlık / Alerji Notu</label>
                                            <textarea 
                                                value={criticalNotes}
                                                onChange={e => setCriticalNotes(e.target.value)}
                                                placeholder="Bu evcil hayvana ait pasaportta kalıcı görünecek kritik sağlık notu..."
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
                                        Muayeneyi Tamamla ve Kaydet
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
