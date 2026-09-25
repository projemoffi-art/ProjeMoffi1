"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, Star, Calendar, CreditCard,
    ShieldAlert, ChevronRight, Syringe, Utensils, Clock, Pill,
    CheckCircle2, ChevronLeft, X, Filter, Activity, History,
    ShieldCheck, Bell, Stethoscope, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DentalCareModal } from "@/components/vet/DentalCareModal";
import { PharmacyModal } from "@/components/vet/PharmacyModal";
import { ClinicListModal } from "@/components/vet/ClinicListModal";
import { ClinicDetailDrawer } from "@/components/vet/ClinicDetailDrawer";
import { MedicationModal } from "@/components/vet/MedicationModal";
import { useVet } from "@/hooks/useVet";
import { VetClinic, Doctor } from "@/types/domain";
import { Pet, usePet } from "@/context/PetContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDragScroll } from "@/hooks/useDragScroll";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { MyAppointmentsPanel } from "@/components/vet/MyAppointmentsPanel";
import turkeyCities from "@/data/turkey_cities.json";

function validateLuhn(cardNumber: string): boolean {
    const clean = cardNumber.replace(/\D/g, "");
    // Allow standard test cards bypass
    if (clean === "4242424242424242" || clean === "4312431243124312" || clean === "4111111111111111") {
        return true;
    }
    // Allow custom testing card suffixes with standard test prefix
    if ((clean.startsWith("4242") || clean.startsWith("4312") || clean.startsWith("4111")) && (clean.endsWith("9999") || clean.endsWith("1111") || clean.endsWith("4242") || clean.endsWith("4312") || clean.endsWith("4111"))) {
        return true;
    }
    if (!clean || clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
        let digit = parseInt(clean.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

function VetPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activePet, appointments, pets } = usePet();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            apiService.getReviewableAppointments(user.id).then(appts => {
                setReviewableAppointmentIds(new Set(appts.map((a: any) => a.id)));
            }).catch(console.error);
        }
    }, [user?.id]);

    // Drag scroll hooks
    const categoryScroll = useDragScroll();
    const dateScroll = useDragScroll();

    const {
        featuredClinics, allClinics, userLocation, isLoading,
        bookAppointment,
        userProvince, userDistrict, setLocationFilter
    } = useVet();

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filterSortBy, setFilterSortBy] = useState<'distance_asc' | 'distance_desc' | 'rating_desc' | null>(null);
    const [filterOpenNow, setFilterOpenNow] = useState(false);
    const [viewMode, setViewMode] = useState<'clinics' | 'appointments'>('clinics');
    const [activeModal, setActiveModal] = useState<'appointment' | 'payment' | 'vaccine' | 'dental' | 'pharma' | 'sos' | 'success' | 'rating' | 'clinicList' | null>(null);
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
    const [selectedProv, setSelectedProv] = useState("");

    // Ekran 2 referansı — 4 hizmet kısayolu + "Tümü/Yakınımda/Moffi Onaylı/Açık Olanlar" hızlı filtreleri
    const [activeServiceFilter, setActiveServiceFilter] = useState<string | null>(null);
    const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'nearby' | 'verified' | 'open'>('all');
    const mapBoxRef = useRef<HTMLDivElement>(null);

    const SERVICE_SHORTCUTS = [
        { key: 'muayene', label: 'Genel Muayene', icon: Stethoscope, keywords: ['muayene', 'genel'], bg: 'bg-emerald-100 dark:bg-emerald-500/15', color: 'text-emerald-600 dark:text-emerald-400' },
        { key: 'acil', label: 'Acil Servis', icon: ShieldAlert, keywords: ['acil'], bg: 'bg-red-100 dark:bg-red-500/15', color: 'text-red-500 dark:text-red-400' },
        { key: 'asi', label: 'Aşı', icon: Syringe, keywords: ['aşı', 'asi'], bg: 'bg-sky-100 dark:bg-sky-500/15', color: 'text-sky-600 dark:text-sky-400' },
        { key: 'dis', label: 'Diş Sağlığı', icon: Smile, keywords: ['diş', 'dis'], bg: 'bg-violet-100 dark:bg-violet-500/15', color: 'text-violet-600 dark:text-violet-400' },
    ] as const;

    const applyQuickFilter = (key: typeof activeQuickFilter) => {
        setActiveQuickFilter(key);
        setFilterSortBy(key === 'nearby' ? 'distance_asc' : null);
        setFilterOpenNow(key === 'open');
    };

    // Payment Simulation States
    const activeClinics = useMemo(() => {
        let result = [...allClinics];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => {
                const matchName = c.name?.toLowerCase().includes(q);
                const matchFeatures = c.features?.some((f: string) => f.toLowerCase().includes(q));
                return matchName || matchFeatures;
            });
        }

        if (activeServiceFilter) {
            const shortcut = SERVICE_SHORTCUTS.find(s => s.key === activeServiceFilter);
            if (shortcut) {
                result = result.filter(c => (c.features || []).some((f: string) =>
                    shortcut.keywords.some(kw => f.toLowerCase().includes(kw))
                ));
            }
        }

        if (activeQuickFilter === 'verified') {
            result = result.filter(c => c.isPremium);
        }

        if (filterOpenNow) {
            result = result.filter(c => c.isOpenNow);
        }

        if (filterSortBy === 'distance_asc') {
            result.sort((a, b) => (a.calculated_distance || 0) - (b.calculated_distance || 0));
        } else if (filterSortBy === 'distance_desc') {
            result.sort((a, b) => (b.calculated_distance || 0) - (a.calculated_distance || 0));
        } else if (filterSortBy === 'rating_desc') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return result;
    }, [allClinics, searchQuery, filterOpenNow, filterSortBy, activeServiceFilter, activeQuickFilter]);
    
    const hasActiveFilters = filterSortBy !== null || filterOpenNow;

    useEffect(() => {
        function handleSearchClickOutside(event: MouseEvent | TouchEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleSearchClickOutside);
        document.addEventListener("touchstart", handleSearchClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleSearchClickOutside);
            document.removeEventListener("touchstart", handleSearchClickOutside);
        };
    }, []);

    // Ekran 5 referansı — randevu formunun kendi pet seçici satırı (önceden
    // sadece global PetSwitcher'a bağlıydı, o header'dan kaldırılınca bu formun
    // KENDİ seçicisi olması gerekti — hem referansa uyum hem gerçek bir işlev).
    const [selectedAppointmentPet, setSelectedAppointmentPet] = useState<Pet | null>(null);

    const [tempAppointmentData, setTempAppointmentData] = useState<any>(null);
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");
    const [isOtpProcessing, setIsOtpProcessing] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
    const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
    const [detailClinicData, setDetailClinicData] = useState<any>(null);
    const [drawerDefaultReview, setDrawerDefaultReview] = useState(false);
    const [drawerDefaultReviewAppointmentId, setDrawerDefaultReviewAppointmentId] = useState<string | null>(null);
    const [reviewableAppointmentIds, setReviewableAppointmentIds] = useState<Set<string>>(new Set());
    const [pendingReviewPrompt, setPendingReviewPrompt] = useState<any>(null);

    const [successMessage, setSuccessMessage] = useState("Randevu Oluşturuldu ✨");
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");

    // Notification State (Faz 9)
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Live validation helpers
    const cleanCardNum = cardNumber.replace(/\D/g, "");
    const isLuhnInvalid = cleanCardNum.length >= 13 && !validateLuhn(cleanCardNum);
    const isExpiryInvalid = (() => {
        if (!cardExpiry || cardExpiry.length < 5) return false;
        const parts = cardExpiry.split("/");
        if (parts.length !== 2) return true;
        const month = parseInt(parts[0], 10);
        const year = parseInt("20" + parts[1], 10);
        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return true;
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        
        if (year < currentYear) return true;
        if (year === currentYear && month < currentMonth) return true;
        
        return false;
    })();

    // Secondary Modals States
    const [activeMedicationModal, setActiveMedicationModal] = useState(false);
    const [activeNutritionModal, setActiveNutritionModal] = useState(false);

    // Data Sharing Consent States
    const [shareBasic, setShareBasic] = useState(true);
    const [shareVaccines, setShareVaccines] = useState(true);
    const [shareNotes, setShareNotes] = useState(false);
    const [shareOwner, setShareOwner] = useState(false);

    // Transparency Logs States
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [transparencyLogs, setTransparencyLogs] = useState<any[]>([]);

    const [dbAppointments, setDbAppointments] = useState<any[]>([]);
    const [clinicSettings, setClinicSettings] = useState<any>(null);
    const [clinicExceptions, setClinicExceptions] = useState<any[]>([]);
    const [clinicServices, setClinicServices] = useState<any[]>([]);
    const [selectedSvc, setSelectedSvc] = useState<any>(null);
    const [appointmentType, setAppointmentType] = useState<string>('');

    // Otomatik Yorum Daveti
    useEffect(() => {
        if (!user || !isSupabaseEnabled || allClinics.length === 0) return;
        if (pendingReviewPrompt) return;

        const checkReviewPrompts = async () => {
            try {
                const apts = await apiService.getReviewableAppointments(user.id);
                if (apts.length > 0) {
                    const latest = apts[0];
                    const storageKey = `moffi_review_prompt_shown_${latest.id}`;
                    if (!localStorage.getItem(storageKey)) {
                        const clinic = allClinics.find(c => c.id === latest.clinic_id);
                        if (clinic) {
                            setPendingReviewPrompt({ ...latest, clinicName: clinic.name || clinic.business_name || "Klinik" });
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking review prompts:", err);
            }
        };

        checkReviewPrompts();
    }, [user, allClinics, pendingReviewPrompt]);

    // Fetch notifications (Faz 9)
    useEffect(() => {
        if (!user || !isSupabaseEnabled) return;
        const fetchNotifications = async () => {
            try {
                const notifs = await apiService.getUnreadNotifications(user.id);
                setUnreadNotifications(prev => {
                    const locallyReadIds = new Set(prev.filter(p => p.isReadLocally).map(p => p.id));
                    return (notifs || []).map(n => ({ 
                        ...n, 
                        isReadLocally: locallyReadIds.has(n.id) 
                    }));
                });
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };
        fetchNotifications();

        const intervalId = setInterval(fetchNotifications, 15000);
        return () => clearInterval(intervalId);
    }, [user]);

    const handleNotificationClick = async (notifId: string) => {
        const notif = unreadNotifications.find(n => n.id === notifId);
        if (notif?.isReadLocally) return;

        apiService.markNotificationRead(notifId).catch(console.error);
        setUnreadNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isReadLocally: true } : n));
    };

    const unreadCount = unreadNotifications.filter(n => !n.isReadLocally).length;

    // Click outside handler for notifications
    const notifRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    useEffect(() => {
        if (!isSupabaseEnabled || !selectedClinic?.id) return;
        
        const loadDbAppointments = async () => {
            try {
                const list = await apiService.getClinicAppointments(selectedClinic.id);
                setDbAppointments(list);
            } catch (e) {
                console.error("Failed to load DB appointments for slot filtering:", e);
            }
        };

        const loadClinicExceptions = async () => {
            try {
                setLoadingExceptions(true); 
                const today = new Date();
                const todayStr = today.toLocaleDateString('sv-SE');
                const future = new Date();
                future.setDate(today.getDate() + 14);
                const futureStr = future.toLocaleDateString('sv-SE');
                const exceptions = await apiService.getClinicExceptions(selectedClinic.id, todayStr, futureStr);
                console.log("Müşteri paneli getClinicExceptions SONUCU:", exceptions);
                setClinicExceptions(exceptions || []);
            } catch (e) {
                console.error("Failed to load clinic exceptions:", e);
            }
        };

        const loadClinicSettings = async () => {
            try {
                const [settings, profile] = await Promise.all([
                    apiService.getClinicSettings(selectedClinic.id),
                    apiService.getUserProfile(selectedClinic.id)
                ]);
                
                if (settings || profile) {
                    setClinicSettings({
                        ...(settings || {}),
                        working_hours: profile?.working_hours || settings?.working_hours
                    });
                }
            } catch (e) {
                console.error("Failed to load clinic settings from database:", e);
            }
        };

        const loadClinicServices = async () => {
            try {
                const services = await apiService.getClinicServices(selectedClinic.id);
                setClinicServices(services);
            } catch (e) {
                console.error("Failed to load clinic services:", e);
                setClinicServices([]);
            }
        };

        const loadClinicDoctors = async () => {
            try {
                const docs = await apiService.getClinicDoctors(selectedClinic.id);
                setClinicDoctors(docs || []);
            } catch (e) {
                console.error("Failed to load clinic doctors:", e);
                setClinicDoctors([]);
            }
        };

        loadDbAppointments();
        loadClinicSettings();
        loadClinicExceptions();
        loadClinicServices();
        loadClinicDoctors();
        
        // Listen for new appointments to refresh slots in real-time
        const channel = new BroadcastChannel('moffi_appointments_channel');
        const handleMessage = (event: MessageEvent) => {
            const { type } = event.data;
            if (type === 'APPOINTMENT_CREATED' || type === 'APPOINTMENT_ACTION') {
                loadDbAppointments();
            }
        };
        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [selectedClinic?.id]);

    // Load sharing preferences from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('moffi_local_sharing_preferences');
            if (saved) {
                const { shareVaccines: sV, shareNotes: sN, shareOwner: sO } = JSON.parse(saved);
                if (typeof sV === 'boolean') setShareVaccines(sV);
                if (typeof sN === 'boolean') setShareNotes(sN);
                if (typeof sO === 'boolean') setShareOwner(sO);
            }
        } catch (e) {
            console.error("Failed to load sharing preferences:", e);
        }
    }, []);

    // Load transparency logs from localStorage
    useEffect(() => {
        try {
            const savedLogs = localStorage.getItem('moffi_transparency_logs');
            if (savedLogs) {
                setTransparencyLogs(JSON.parse(savedLogs));
            }
        } catch (e) {
            console.error("Failed to load transparency logs:", e);
        }
    }, [isLogModalOpen]);

    // Save preference helper
    const handlePreferenceChange = (key: 'vaccines' | 'notes' | 'owner', val: boolean) => {
        let newVaccines = shareVaccines;
        let newNotes = shareNotes;
        let newOwner = shareOwner;

        if (key === 'vaccines') {
            setShareVaccines(val);
            newVaccines = val;
        } else if (key === 'notes') {
            setShareNotes(val);
            newNotes = val;
        } else if (key === 'owner') {
            setShareOwner(val);
            newOwner = val;
        }

        try {
            localStorage.setItem('moffi_local_sharing_preferences', JSON.stringify({
                shareVaccines: newVaccines,
                shareNotes: newNotes,
                shareOwner: newOwner
            }));
        } catch (e) {}
    };

    // Deep Linking query parameter listener
    useEffect(() => {
        if (searchParams && !isLoading) {
            const openModal = searchParams.get('open');
            const targetClinicId = searchParams.get('clinicId');
            
            if (openModal === 'vaccine') {
                setActiveModal('vaccine');
            } else if (openModal === 'appointment') {
                setActiveModal('clinicList');
            } else if (openModal === 'nutrition') {
                setActiveNutritionModal(true);
            }

            // Only check for targetClinicId if clinics are loaded
            if (targetClinicId && allClinics.length > 0) {
                const found = allClinics.find(c => String(c.id) === String(targetClinicId));
                if (found) {
                    setSelectedClinic(found);
                    setActiveModal('appointment');
                }
            }
        }
    }, [isLoading, allClinics, searchParams]);

    // Fast local event listener for instant modal opening without Next.js router latency
    useEffect(() => {
        const handleOpenModal = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                if (customEvent.detail === 'appointment') {
                    setActiveModal('clinicList');
                } else if (customEvent.detail === 'nutrition') {
                    setActiveNutritionModal(true);
                } else {
                    setActiveModal(customEvent.detail as any);
                }
            }
        };
        window.addEventListener('openVetModal', handleOpenModal);
        return () => window.removeEventListener('openVetModal', handleOpenModal);
    }, []);

    // Appointment Form States
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const dateOptions = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const daysEng = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        
        let isClosed = false;
        try {
            let settings = clinicSettings;
            if (!settings) {
                const saved = typeof window !== 'undefined' ? localStorage.getItem('moffi_clinic_settings') : null;
                settings = saved ? JSON.parse(saved) : null;
            }
            
            const dayNameLower = daysEng[d.getDay()];
            
            if (settings?.working_hours && settings.working_hours[dayNameLower]) {
                isClosed = settings.working_hours[dayNameLower].closed === true;
            } else {
                const defaultDays = { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false };
                const workingDays = settings?.workingDays || defaultDays;
                const daysEngTitle = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                isClosed = !workingDays[daysEngTitle[d.getDay()]];
            }
        
        } catch(e) {}
        
        // Apply Date-Specific Exceptions
        const dateStrForEx = d.toLocaleDateString('sv-SE');
        const exception = clinicExceptions.find(ex => ex.exception_date === dateStrForEx);
        if (exception) {
            isClosed = exception.is_closed;
        }

        return {
            key: d.toLocaleDateString('sv-SE'),
            label: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            dayName: dayNames[d.getDay()],
            closed: isClosed
        };
    });

    const getDynamicSlots = (dateStr: string) => {
        if (typeof window === 'undefined') return [];
        try {
            let settings = clinicSettings;
            if (!settings) {
                const saved = localStorage.getItem('moffi_clinic_settings');
                settings = saved ? JSON.parse(saved) : null;
            }

            const dayOfW = new Date(dateStr);
            const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayNameEng = daysEng[dayOfW.getDay()];
            const dayNameLower = dayNameEng.toLowerCase();

            // Check for date-specific exceptions first
            const exception = clinicExceptions.find(ex => ex.exception_date === dateStr);
            let isExceptionOverride = false;
            let exOpen = "09:00";
            let exClose = "18:00";
            
            if (exception) {
                if (exception.is_closed) return []; // Explicitly closed via exception
                isExceptionOverride = true;
                exOpen = exception.open_time || "09:00";
                exClose = exception.close_time || "18:00";
            }

            // Support both old workingDays and new working_hours structure
            let daySettings: any = null;
            
            if (!isExceptionOverride) {
                if (settings?.working_hours && settings.working_hours[dayNameLower]) {
                    daySettings = settings.working_hours[dayNameLower];
                    if (daySettings.closed) return []; // Day is closed
                } else {
                    // Fallback to old structure
                    const defaultDays = { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false };
                    const workingDays = settings?.workingDays || defaultDays;
                    if (!workingDays[dayNameEng]) return [];
                    
                    daySettings = {
                        open: settings?.startTime || "09:00",
                        close: settings?.endTime || "18:00"
                    };
                }
            }

            const startTime = isExceptionOverride ? exOpen : (daySettings?.open || "09:00");
            const endTime = isExceptionOverride ? exClose : (daySettings?.close || "18:00");
            const lunchStart = settings?.lunchStart || "12:00";
            const lunchEnd = settings?.lunchEnd || "13:00";
            const slotDuration = settings?.slotDuration || 30;

            const slots: { time: string, disabled: boolean }[] = [];
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const [lunchStartH, lunchStartM] = lunchStart.split(':').map(Number);
            const [lunchEndH, lunchEndM] = lunchEnd.split(':').map(Number);

            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
            const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

            const blockedIntervals: { start: number, end: number }[] = [];

            if (isSupabaseEnabled) {
                dbAppointments.forEach((apt: any) => {
                    if (apt.appointment_date && apt.status !== 'rejected' && apt.status !== 'cancelled') {
                        try {
                            const aptDateStr = apt.appointment_date.split('T')[0];
                            if (aptDateStr === dateStr) {
                                const timeStr = apt.appointment_date.split('T')[1].substring(0, 5);
                                const duration = apt.duration_minutes || 30;
                                const [h, m] = timeStr.split(':').map(Number);
                                const startMin = h * 60 + m;
                                const endMin = startMin + duration;
                                blockedIntervals.push({ start: startMin, end: endMin });
                            }
                        } catch (e) {}
                    }
                });
            } else {
                const pendingSaved = localStorage.getItem('moffi_pending_appointments');
                const confirmedSaved = localStorage.getItem('moffi_confirmed_appointments');
                
                const pendingList = pendingSaved ? JSON.parse(pendingSaved) : [];
                const confirmedList = confirmedSaved ? JSON.parse(confirmedSaved) : [];
                
                const addBlocked = (apt: any) => {
                    const duration = apt.duration_minutes || 30;
                    const [h, m] = apt.time.split(':').map(Number);
                    const startMin = h * 60 + m;
                    const endMin = startMin + duration;
                    blockedIntervals.push({ start: startMin, end: endMin });
                };

                pendingList.forEach((apt: any) => {
                    if (apt.date === dateStr && apt.status !== 'rejected') addBlocked(apt);
                });
                confirmedList.forEach((apt: any) => {
                    if (apt.date === dateStr && apt.status !== 'rejected' && apt.status !== 'cancelled') addBlocked(apt);
                });
            }

            for (let min = startMinutes; min < endMinutes; min += slotDuration) {
                if (min >= lunchStartMinutes && min < lunchEndMinutes) {
                    continue;
                }
                const h = Math.floor(min / 60);
                const m = min % 60;
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                
                const slotStart = min;
                const slotEnd = min + slotDuration;
                
                const isBlocked = blockedIntervals.some(interval => 
                    Math.max(interval.start, slotStart) < Math.min(interval.end, slotEnd)
                );
                
                slots.push({ time: timeStr, disabled: isBlocked });
            }

            return slots;
        } catch (e) {
            console.error("Error generating dynamic slots:", e);
            return [];
        }
    };

    const timeSlots = (() => {
        if (!selectedDate) return [];
        const generated = getDynamicSlots(selectedDate);
        if (selectedDate === dateOptions[0]?.key) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            return generated.filter(slot => {
                const [h, m] = slot.time.split(':').map(Number);
                return h > currentHour || (h === currentHour && m > currentMin);
            });
        }
        return generated;
    })();

    const openAppointment = (clinic: VetClinic) => {
        setSelectedClinic(clinic);
        setActiveModal('appointment');
        setSelectedDate(dateOptions[0]?.key || '');
        setSelectedTime(null);
        setSelectedDoctor(null);
        setSelectedSvc(null);
        setSelectedAppointmentPet(activePet || pets?.[0] || null);
    };

    const calculatePetAge = (pet: any) => {
        if (pet.age) return pet.age;
        const bDate = pet.birth_date || pet.birthday;
        if (bDate) {
            try {
                const birth = new Date(bDate);
                const now = new Date();
                const diffMs = now.getTime() - birth.getTime();
                const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
                return diffYears.toFixed(1);
            } catch (e) {}
        }
        return "2.1";
    };

    const handleCreateAppointment = async () => {
        if (!selectedClinic || !selectedTime) {
            console.log("handleCreateAppointment aborted: missing clinic or time");
            return;
        }

        const bookingPet = selectedAppointmentPet || activePet;

        let sharedVaccines: any[] = [];
        if (shareVaccines && bookingPet) {
            try {
                const saved = localStorage.getItem(`moffi_vaccines_${bookingPet.id}`);
                if (saved) {
                    sharedVaccines = JSON.parse(saved);
                }
            } catch (e) {
                console.error("Failed to load vaccines for sharing:", e);
            }
            if (sharedVaccines.length === 0) {
                sharedVaccines = [
                    { name: "Karma Aşı", date: "2026-05-10", status: "completed", color: "text-green-500" },
                    { name: "Kuduz Aşısı", date: "2026-06-01", status: "completed", color: "text-green-500" }
                ];
            }
        }

        const sharedHealthNotes = (shareNotes && bookingPet)
            ? (bookingPet.health_notes || bookingPet.sos_settings?.critical_health_note || "Gluten Alerjisi, Hassas Sindirim")
            : "";

        const sharedPassport = {
            basic: shareBasic && bookingPet ? {
                name: bookingPet.name,
                breed: bookingPet.breed || "Tekir / Mix",
                weight: bookingPet.weight ? `${bookingPet.weight} kg` : "6.2 kg",
                age: calculatePetAge(bookingPet)
            } : null,
            vaccines: shareVaccines ? sharedVaccines : null,
            healthNotes: shareNotes ? sharedHealthNotes : null,
            ownerInfo: shareOwner ? {
                name: user?.name || user?.username || "Uveys",
                phone: user?.phone || "+90 532 123 45 67",
                email: user?.email || "owner@moffi.com"
            } : null
        };

        const petInfo = bookingPet ? { id: bookingPet.id, name: bookingPet.name, image: bookingPet.image } : undefined;

        await bookAppointment(
            selectedClinic,
            selectedDate,
            selectedTime,
            selectedSvc?.service_name || 'general',
            sharedPassport,
            petInfo,
            selectedSvc?.duration_minutes || 30,
            selectedDoctor?.id
        );

        // Record Transparency Log
        try {
            const storedLogs = localStorage.getItem('moffi_transparency_logs');
            const logsList = storedLogs ? JSON.parse(storedLogs) : [];
            const newLog = {
                id: 'log_' + Date.now(),
                clinicName: selectedClinic.name,
                petName: bookingPet ? bookingPet.name : 'Evcil Hayvan',
                date: new Date().toLocaleString('tr-TR'),
                sharedFields: [
                    "Temel Bilgiler",
                    shareVaccines ? "Aşı Takvimi Geçmişi" : null,
                    shareNotes ? "Sağlık Notları & Alerjiler" : null,
                    shareOwner ? "Sahip Bilgileri" : null
                ].filter(Boolean)
            };
            logsList.unshift(newLog);
            localStorage.setItem('moffi_transparency_logs', JSON.stringify(logsList));
        } catch (e) {
            console.error("Failed to save transparency log:", e);
        }

        if (selectedDoctor) {
            setSuccessMessage(`Dr. ${selectedDoctor.name} ile Randevu Talebiniz İletildi ✨`);
        } else {
            setSuccessMessage("Randevu Talebiniz İletildi ✨");
        }
        setActiveModal('success');
        setDetailClinicId(null);
        setTimeout(() => setActiveModal(null), 3000);
    };

    const mappedAppointments = useMemo(() => {
        if (!appointments) return [];
        
        let allApts: any[] = [];
        Object.keys(appointments).forEach(petId => {
            const petInfo = pets?.find((p: any) => p.id === petId);
            const petName = petInfo ? petInfo.name : 'Evcil Hayvan';
            
            const mapped = appointments[petId].map((apt: any) => {
                let dateStr = 'Tarih Yok';
                let timeStr = 'Saat Yok';
                if (apt.appointment_date) {
                    dateStr = apt.appointment_date.split('T')[0];
                    if (apt.appointment_date.includes('T')) {
                        timeStr = apt.appointment_date.split('T')[1].substring(0, 5);
                    }
                }
                let type = 'Genel Muayene';
                if (apt.reason && apt.reason.includes('Randevu tipi:')) {
                    type = apt.reason.split('Randevu tipi: ')[1].trim() || 'Genel Muayene';
                } else if (apt.reason) {
                    type = apt.reason;
                }
                return {
                    id: apt.id,
                    petId: petId,
                    petName: petName,
                    icon: '🏥',
                    type: type,
                    clinicName: apt.clinic?.business_name || 'Klinik',
                    clinicId: apt.clinic_id,
                    realDoctorName: apt.doctor?.name || apt.doctor_name || null,
                    date: dateStr,
                    time: timeStr,
                    status: apt.status || 'pending',
                    _rawDate: apt.appointment_date ? new Date(apt.appointment_date).getTime() : 0,
                    _rawCreatedAt: apt.created_at ? new Date(apt.created_at).getTime() : 0
                };
            });
            allApts = [...allApts, ...mapped];
        });
        return allApts;
    }, [appointments, pets]);

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32 font-sans relative selection:bg-accent/30 transition-colors duration-300">
            {/* Minimal solid design - no cheap floating background blobs */}

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-card-border pb-4 transition-colors duration-300">
                <div className="px-6 pt-8 pb-2 flex flex-col gap-5">
                    <div className="flex justify-between items-center w-full min-w-0 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => {
                                    if (window.history.length > 2) {
                                        router.back();
                                    } else {
                                        router.push('/home');
                                    }
                                }}
                                className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center hover:bg-card-border/50 hover:scale-105 active:scale-95 transition-all text-foreground/80 shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-black text-foreground tracking-tight leading-none transition-all truncate">
                                Veteriner
                            </h1>
                        </div>
                        <div className="relative shrink-0" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center hover:bg-card-border/50 active:scale-95 transition-all text-foreground/80 relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-72 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden z-[170]"
                                    >
                                        <div className="max-h-64 overflow-y-auto">
                                            {unreadNotifications.length > 0 ? unreadNotifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif.id)}
                                                    className={cn(
                                                        "p-4 border-b border-card-border last:border-0 hover:bg-card-border/30 cursor-pointer transition-colors relative",
                                                        notif.isReadLocally ? "opacity-50" : ""
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-xs font-bold text-foreground mb-1 leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                        {notif.isReadLocally && (
                                                            <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold whitespace-nowrap">
                                                                ✓ Okundu
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-secondary">
                                                        {new Date(notif.created_at).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                            )) : (
                                                <div className="p-6 text-center">
                                                    <p className="text-xs font-bold text-secondary">Henüz bildirim yok</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Minimalist Medical Search Input */}
                    <div className="relative group z-[160]" ref={searchContainerRef}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            type="text"
                            placeholder="Veteriner, klinik veya hizmet ara..."
                            className="w-full h-12 pl-11 pr-4 bg-card rounded-xl border border-card-border outline-none font-bold text-xs text-foreground placeholder:text-zinc-400 dark:placeholder:text-secondary/20 focus:border-accent transition-all text-left shadow-sm dark:shadow-none"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsSearchPanelOpen(true);
                            }}
                            onFocus={() => setIsSearchPanelOpen(true)}
                        />
                        <AnimatePresence>
                            {isSearchPanelOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[110%] left-0 right-0 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                                >
                                    <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                                        {activeClinics.length > 0 ? (
                                            activeClinics.slice(0, 6).map((c) => (
                                                <button 
                                                    key={c.id}
                                                    onClick={() => {
                                                        setDetailClinicId(c.id);
                                                        setDetailClinicData(c);
                                                        setIsSearchPanelOpen(false);
                                                        setSearchQuery("");
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-card-border/50 last:border-0"
                                                >
                                                    <div className="flex flex-col text-left truncate pr-2">
                                                        <span className="text-xs font-black text-foreground truncate">{c.name}</span>
                                                        <span className="text-[9px] font-bold text-secondary">{c.distance || 'Konum Bilinmiyor'}</span>
                                                    </div>
                                                    <ChevronRight className="w-3 h-3 text-secondary shrink-0" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                                                <Search className="w-6 h-6 text-secondary/30 mb-2" />
                                                <p className="text-xs font-bold text-secondary">Sonuç bulunamadı</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Location Selector Banner */}
                    {(!userProvince || !userDistrict || isLocationSelectorOpen) ? (
                        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-accent" />
                                <h3 className="text-xs font-black text-foreground">Konumunuzu seç</h3>
                            </div>
                            <div className="flex gap-3">
                                <select 
                                    className="flex-1 h-10 px-3 rounded-lg border border-card-border bg-card-border/30 text-xs font-bold outline-none text-foreground"
                                    value={selectedProv || userProvince || ""}
                                    onChange={(e) => {
                                        setSelectedProv(e.target.value);
                                    }}
                                >
                                    <option value="" disabled>İl Seçiniz</option>
                                    {turkeyCities.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <select 
                                    className="flex-1 h-10 px-3 rounded-lg border border-card-border bg-card-border/30 text-xs font-bold outline-none text-foreground"
                                    value={(selectedProv && selectedProv !== userProvince) ? "" : (userDistrict || "")}
                                    onChange={(e) => {
                                        const finalProv = selectedProv || userProvince;
                                        setLocationFilter(finalProv, e.target.value);
                                        setIsLocationSelectorOpen(false);
                                        setSelectedProv(""); // Reset local override
                                    }}
                                    disabled={!(selectedProv || userProvince)}
                                >
                                    <option value="" disabled>İlçe Seçiniz</option>
                                    {turkeyCities.find(c => c.name === (selectedProv || userProvince))?.districts.map((d: any) => (
                                        <option key={d.name} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsLocationSelectorOpen(true)}
                            className="flex items-center gap-2 text-left w-fit max-w-full"
                        >
                            <MapPin className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-[13px] font-bold text-foreground truncate">
                                Konumun: <span className="text-secondary font-semibold">{userProvince}, {userDistrict}</span>
                            </span>
                            <span className="text-[13px] text-secondary shrink-0">✎</span>
                        </button>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-card-border/50 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('clinics')}
                            className={cn("flex-1 py-2 rounded-lg text-xs font-black transition-all", viewMode === 'clinics' ? "bg-card shadow-sm text-accent" : "text-zinc-500 dark:text-zinc-400")}
                        >
                            Klinik Keşfet
                        </button>
                        <button
                            onClick={() => setViewMode('appointments')}
                            className={cn("flex-1 py-2 rounded-lg text-xs font-black transition-all", viewMode === 'appointments' ? "bg-card shadow-sm text-accent" : "text-zinc-500 dark:text-zinc-400")}
                        >
                            Randevularım
                        </button>
                    </div>

                    {/* Hizmet kısayolları — referans Ekran 2 */}
                    <div style={{ display: viewMode === 'clinics' ? 'grid' : 'none' }} className="grid grid-cols-4 gap-2">
                        {SERVICE_SHORTCUTS.map(cat => {
                            const isActive = activeServiceFilter === cat.key;
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveServiceFilter(isActive ? null : cat.key)}
                                    className="flex flex-col items-center gap-1.5"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                        cat.bg,
                                        isActive && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                                    )}>
                                        <Icon className={cn("w-5 h-5", cat.color)} />
                                    </div>
                                    <span className="text-[9.5px] font-bold text-secondary text-center leading-tight">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Hızlı filtreler — Tümü / Yakınımda / Moffi Onaylı / Açık Olanlar */}
                    <div
                        ref={categoryScroll.ref}
                        style={{ display: viewMode === 'clinics' ? 'flex' : 'none' }}
                        onMouseDown={categoryScroll.onMouseDown}
                        onMouseLeave={categoryScroll.onMouseLeave}
                        onMouseUp={categoryScroll.onMouseUp}
                        onMouseMove={categoryScroll.onMouseMove}
                        className="flex gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-1 momentum-scroll overscroll-contain cursor-grab active:cursor-grabbing select-none"
                    >
                        {[
                            { id: 'all' as const, label: 'Tümü' },
                            { id: 'nearby' as const, label: 'Yakınımda' },
                            { id: 'verified' as const, label: 'Moffi Onaylı' },
                            { id: 'open' as const, label: 'Açık Olanlar' },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => applyQuickFilter(f.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full whitespace-nowrap transition-all font-bold text-xs shrink-0",
                                    activeQuickFilter === f.id
                                        ? "bg-foreground text-background"
                                        : "bg-card text-secondary border border-card-border hover:text-foreground"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">
                {viewMode === 'appointments' ? (
                    <MyAppointmentsPanel 
                        appointments={mappedAppointments} 
                        activePetId={activePet?.id} 
                        reviewableAppointmentIds={reviewableAppointmentIds}
                        onReviewClick={(clinicId, appointmentId) => {
                            const clinicData = allClinics.find(c => c.id === clinicId);
                            setDetailClinicId(clinicId);
                            if (clinicData) setDetailClinicData(clinicData);
                            setDrawerDefaultReviewAppointmentId(appointmentId);
                            setDrawerDefaultReview(true);
                        }}
                    />
                ) : (
                    <>
                {/* Status Bar showing pet health state */}
                {activePet && (
                    <div className="bg-card border border-card-border p-4 rounded-2xl flex items-center justify-between text-left shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/10 flex items-center justify-center border border-accent/20 text-accent dark:text-accent">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-secondary uppercase tracking-widest block">Aktif Pet Durumu</span>
                                <h4 className="text-xs font-black text-foreground mt-0.5">{activePet.name} • Sağlıklı ve Takipte</h4>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsLogModalOpen(true)}
                                className="bg-card border border-card-border hover:bg-card-border text-zinc-650 dark:text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all text-[10px] font-bold cursor-pointer"
                            >
                                <History className="w-3.5 h-3.5 text-accent" /> Paylaşım Logları
                            </button>
                            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                        </div>
                    </div>
                )}



                {/* Solid Map Box */}
                <section ref={mapBoxRef} className="relative w-full rounded-2xl p-6 border border-card-border shadow-xl bg-card flex flex-col items-center justify-center text-center gap-4 transition-colors duration-300 scroll-mt-24">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm text-foreground mb-1">Yakındaki klinikleri keşfet</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
                            Moffi üzerinden çevrenizdeki tüm onaylı veteriner kliniklerini ve nöbetçi hekimleri görebilirsiniz.
                        </p>
                    </div>
                    <button 
                        onClick={() => {
                            if (userLocation) {
                                window.open(`https://www.google.com/maps/search/veteriner/@${userLocation.lat},${userLocation.lng},14z`, '_blank');
                            } else {
                                window.open(`https://www.google.com/maps/search/veteriner`, '_blank');
                            }
                        }}
                        className="w-full sm:w-auto bg-accent text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-accent transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <MapPin className="w-4 h-4" />
                        Google Haritalar'da Aç
                    </button>
                </section>

                {/* Clinics Section */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-base font-black text-foreground tracking-tight leading-none">Yakındaki veterinerler</h2>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => mapBoxRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-[11px] font-bold text-accent flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                            >
                                Haritada gör <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setIsFilterPanelOpen(true)}
                                className="relative bg-card border border-card-border w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-foreground transition-all"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {hasActiveFilters && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {activeClinics.map((clinic, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                                key={clinic.id || `clinic-${index}`}
                                onClick={() => { setDetailClinicId(clinic.id); setDetailClinicData(clinic); }}
                                className="bg-card rounded-2xl p-3 border border-card-border shadow-sm dark:shadow-none flex items-center gap-3 cursor-pointer transition-colors hover:border-accent/30"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-card-border shrink-0 relative">
                                    {clinic.imageUrl ? (
                                        <img src={clinic.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
                                            <span className="text-xl font-black text-zinc-500 dark:text-white/40">{(clinic.name || 'C')[0]}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-black text-foreground text-sm tracking-tight leading-none truncate">
                                            {clinic.name}
                                        </h3>
                                        {clinic.isPremium && <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className="text-[11px] font-black text-foreground">{clinic.rating}</span>
                                        {typeof clinic.reviewCount === 'number' && (
                                            <span className="text-[11px] font-semibold text-secondary">({clinic.reviewCount})</span>
                                        )}
                                        <span className="text-secondary mx-0.5">•</span>
                                        <span className="text-[11px] font-semibold text-secondary truncate">{clinic.distance}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", clinic.isOpenNow ? "bg-accent-secondary" : "bg-secondary/40")} />
                                        <span className={cn("text-[11px] font-semibold", clinic.isOpenNow ? "text-accent-secondary" : "text-secondary")}>
                                            {clinic.isOpenNow ? "Açık" : "Kapalı"}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                            </motion.div>
                        ))}
                        {activeClinics.length === 0 && !isLoading && (
                            <div className="text-center py-10">
                                <p className="text-xs font-bold text-secondary">Bu bölgede henüz eşleşen klinik yok.</p>
                            </div>
                        )}
                    </div>
                </section>
                    </>
                )}
            
            {/* FILTER PANEL */}
            <AnimatePresence>
                {isFilterPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterPanelOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[201] bg-card rounded-t-3xl border-t border-card-border overflow-hidden pb-safe"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-foreground tracking-tight">Sıralama ve filtre</h3>
                                    <button onClick={() => setIsFilterPanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                        <X className="w-4 h-4 text-foreground" />
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase mb-3 block">Sıralama Ölçütü</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button 
                                                onClick={() => setFilterSortBy('distance_asc')}
                                                className={cn("flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all", filterSortBy === 'distance_asc' ? "bg-accent/10 border-accent text-accent" : "bg-card border-card-border text-foreground")}
                                            >
                                                Mesafeye Göre (Yakından Uzağa)
                                                {filterSortBy === 'distance_asc' && <CheckCircle2 className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => setFilterSortBy('distance_desc')}
                                                className={cn("flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all", filterSortBy === 'distance_desc' ? "bg-accent/10 border-accent text-accent" : "bg-card border-card-border text-foreground")}
                                            >
                                                Mesafeye Göre (Uzaktan Yakına)
                                                {filterSortBy === 'distance_desc' && <CheckCircle2 className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => setFilterSortBy('rating_desc')}
                                                className={cn("flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all", filterSortBy === 'rating_desc' ? "bg-accent/10 border-accent text-accent" : "bg-card border-card-border text-foreground")}
                                            >
                                                Puana Göre (En Yüksek)
                                                {filterSortBy === 'rating_desc' && <CheckCircle2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase mb-3 block">Filtreler</label>
                                        <button 
                                            onClick={() => setFilterOpenNow(!filterOpenNow)}
                                            className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all", filterOpenNow ? "bg-accent/10 border-accent text-accent" : "bg-card border-card-border text-foreground")}
                                        >
                                            Sadece Şu An Açık Olanlar
                                            <div className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-all", filterOpenNow ? "bg-accent justify-end" : "bg-black/10 dark:bg-white/10 justify-start")}>
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <button
                                            onClick={() => setIsFilterPanelOpen(false)}
                                            className="w-full h-12 bg-accent text-white font-black text-sm rounded-xl hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20"
                                        >
                                            Sonuçları göster
                                        </button>
                                        <button
                                            onClick={() => { setFilterSortBy(null); setFilterOpenNow(false); setIsFilterPanelOpen(false); }}
                                            className="w-full h-12 bg-transparent text-secondary font-bold text-sm rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                        >
                                            Filtreleri temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </main>

            {/* --- MODALS & DRAWERS --- */}
            <AnimatePresence>
                {/* 1. APPOINTMENT SLOTS MODAL */}
                {activeModal === 'appointment' && selectedClinic && (
                    <motion.div key="appointment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3100] bg-black/50 dark:bg-black/85 backdrop-blur-sm">
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 z-[3101] h-full w-full sm:w-[480px] bg-background shadow-[-20px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-card-border flex flex-col overflow-hidden text-foreground p-6 pt-12 sm:pt-6">

                            
                            <div className="flex justify-between items-center mb-6 mt-2 sm:mt-0">
                                <h2 className="text-lg font-black tracking-tight">Randevu oluştur</h2>
                                <button onClick={() => setActiveModal(null)} className="w-8 h-8 bg-card rounded-full flex items-center justify-center border border-card-border hover:bg-card-border/80 text-foreground transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            {/* SCROLLABLE BODY CONTAINER */}
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6 text-left momentum-scroll overscroll-contain pb-6">
                                <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-card-border relative overflow-hidden pl-5 border-l-2 border-l-accent">
                                    {selectedClinic.imageUrl ? (
                                        <img src={selectedClinic.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-card-border" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-white/10 flex items-center justify-center border border-card-border shrink-0">
                                            <span className="text-2xl font-black text-zinc-500 dark:text-white/40 uppercase">{(selectedClinic.name || 'C')[0]}</span>
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <div className="font-black text-sm text-foreground leading-snug mb-0.5">{selectedClinic.name}</div>
                                        <div className="text-[9px] text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-accent" /> {selectedClinic.distance} mesafede
                                        </div>
                                    </div>
                                </div>

                                {/* PET SELECTOR — referans Ekran 5 */}
                                {pets && pets.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2.5 block px-1">Kimin için?</label>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                            {pets.map((p: Pet) => {
                                                const isSelected = selectedAppointmentPet?.id === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setSelectedAppointmentPet(p)}
                                                        className="flex flex-col items-center gap-1.5 shrink-0"
                                                    >
                                                        <div className={cn(
                                                            "w-14 h-14 rounded-full overflow-hidden border-2 transition-all",
                                                            isSelected ? "border-accent shadow-lg shadow-accent/20" : "border-card-border opacity-60"
                                                        )}>
                                                            {p.image ? (
                                                                <img src={p.image} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-card-border/50 flex items-center justify-center font-black text-secondary">{p.name?.[0]}</div>
                                                            )}
                                                        </div>
                                                        <span className={cn("text-[10px] font-bold", isSelected ? "text-foreground" : "text-secondary")}>{p.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* SERVICE SELECTOR */}
                                {!selectedSvc ? (
                                    <div>
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2.5 block px-1">Hizmet seçimi</label>
                                        {clinicServices.length === 0 ? (
                                            <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
                                                <p className="text-sm font-bold text-secondary mb-4">Bu klinik henüz hizmetlerini eklemedi.</p>
                                                <button
                                                    onClick={() => setSelectedSvc({ service_name: 'Belirtilmedi', duration_minutes: 30 })}
                                                    className="px-6 py-2 bg-accent/10 text-accent text-xs font-black rounded-xl transition-colors hover:bg-accent/20 inline-block"
                                                >
                                                    Yine de randevu talep et
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {clinicServices.map((svc: any) => (
                                                    <button
                                                        key={svc.id}
                                                        onClick={() => setSelectedSvc(svc)}
                                                        className="w-full bg-card border border-card-border p-4 rounded-2xl flex items-center gap-3 group transition-all hover:border-accent/30 text-left"
                                                    >
                                                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                            <Stethoscope className="w-4 h-4 text-accent" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black text-foreground tracking-tight text-sm truncate">{svc.service_name}</div>
                                                            <div className="text-[10px] font-bold text-secondary mt-0.5">~{svc.duration_minutes} dk</div>
                                                        </div>
                                                        <div className="w-5 h-5 rounded-full border-2 border-card-border shrink-0 group-hover:border-accent/50 transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between bg-accent/10 border border-accent/20 p-3 rounded-2xl">
                                            <div>
                                                <div className="text-[9px] font-black text-accent uppercase tracking-wider mb-0.5">Seçilen hizmet</div>
                                                <div className="text-sm font-black text-foreground tracking-tight">{selectedSvc.service_name}</div>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedSvc(null); setSelectedDate(''); setSelectedTime(null); }}
                                                className="text-[9px] font-black text-accent/70 hover:text-accent uppercase tracking-widest px-3 py-1.5 bg-accent/10 rounded-lg transition-colors"
                                            >
                                                Değiştir
                                            </button>
                                        </div>
                                        
                                        {/* DOCTOR SELECTOR */}
                                        {clinicDoctors.length > 0 && (
                                            <div className="mt-4 mb-4">
                                                <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2.5 block px-1">Doktor seçimi (opsiyonel)</label>
                                                {!selectedDoctor ? (
                                                    <div className="space-y-2.5">
                                                        {clinicDoctors.map((doc: Doctor) => (
                                                            <button
                                                                key={doc.id}
                                                                onClick={() => setSelectedDoctor(doc)}
                                                                className="w-full bg-card border border-card-border p-4 rounded-2xl flex items-center gap-3 group transition-all hover:border-accent/30 text-left"
                                                            >
                                                                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 font-black text-accent text-xs">
                                                                    {(doc.name || 'D')[0]}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-black text-foreground tracking-tight text-sm truncate">{doc.name}</div>
                                                                    {doc.title && <div className="text-[10px] font-bold text-secondary mt-0.5 truncate">{doc.title}</div>}
                                                                </div>
                                                                <div className="w-5 h-5 rounded-full border-2 border-card-border shrink-0 group-hover:border-accent/50 transition-colors" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-accent/10 border border-accent/20 p-3 rounded-2xl">
                                                        <div>
                                                            <div className="text-[9px] font-black text-accent uppercase tracking-wider mb-0.5">Seçilen doktor</div>
                                                            <div className="text-sm font-black text-foreground tracking-tight">{selectedDoctor.name}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setSelectedDoctor(null)}
                                                            className="text-[9px] font-black text-accent/70 hover:text-accent uppercase tracking-widest px-3 py-1.5 bg-accent/10 rounded-lg transition-colors"
                                                        >
                                                            Değiştir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                {/* DATE SELECTOR */}
                                <div>
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2.5 block px-1">Tarih seçimi</label>
                                    <div 
                                        ref={dateScroll.ref}
                                        onMouseDown={dateScroll.onMouseDown}
                                        onMouseLeave={dateScroll.onMouseLeave}
                                        onMouseUp={dateScroll.onMouseUp}
                                        onMouseMove={dateScroll.onMouseMove}
                                        className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar touch-pan-x -mx-1 px-1 snap-x momentum-scroll overscroll-contain cursor-grab active:cursor-grabbing select-none"
                                    >
                                        {dateOptions.map((day, dIndex) => {
                                            if (!day.key) console.warn("🚨 BOŞ DAY.KEY DEĞERİ!", { day, index: dIndex });
                                            return (
                                            <button
                                                key={day.key}
                                                onClick={() => { setSelectedDate(day.key); setSelectedTime(null); }}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl min-w-[85px] text-center border transition-all flex flex-col items-center snap-start shrink-0",
                                                    selectedDate === day.key
                                                        ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 font-black"
                                                        : "border-card-border bg-card text-secondary hover:border-card-border hover:text-foreground"
                                                )}
                                            >
                                                <div className="text-[8px] font-bold uppercase tracking-wider mb-0.5">{day.dayName}</div>
                                                <div className="text-xs font-black">{day.label}</div>
                                            </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mb-6 text-left">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-3 block px-1">Saat seçimi</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map(({ time, disabled }, tIndex) => {
                                            if (!time) console.warn("🚨 BOŞ TIME DEĞERİ!", { time, index: tIndex });
                                            return (
                                            <button
                                                key={time}
                                                disabled={disabled}
                                                onClick={() => {
                                                    console.log("Selected time clicked:", time);
                                                    setSelectedTime(time);
                                                }}
                                                className={cn(
                                                    "py-2.5 text-xs font-bold rounded-lg border transition-all text-center",
                                                    disabled
                                                        ? "opacity-50 line-through pointer-events-none bg-zinc-100 dark:bg-white/5 border-transparent text-zinc-400 dark:text-zinc-600"
                                                        : selectedTime === time
                                                            ? "bg-accent text-white border-accent font-black"
                                                            : "border-card-border bg-card text-secondary hover:border-card-border hover:text-foreground"
                                                )}
                                            >
                                                {time}
                                            </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* DATA SHARING CONSENT PANEL */}
                                <div className="bg-card border border-card-border rounded-2xl p-4 text-left">
                                    <div className="text-[8px] font-black text-secondary uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                                        <Syringe className="w-3.5 h-3.5 text-accent" /> TIBBİ VERİ PAYLAŞIM TERCİHLERİ
                                    </div>
                                    
                                    <div className="space-y-2.5">
                                        {/* Basic Info (Always Checked / Disabled) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-card-border opacity-70 cursor-not-allowed select-none transition-all">
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    Temel Bilgiler <span className="text-[7px] text-accent font-black uppercase tracking-wider bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">ZORUNLU</span>
                                                </span>
                                                <p className="text-[9px] text-secondary mt-0.5 font-semibold">İsim, Tür, Irk, Yaş ve Kilo verileri.</p>
                                            </div>
                                            <div className="w-9 h-5 rounded-full p-0.5 bg-accent/30 flex items-center">
                                                <div className="bg-zinc-100 dark:bg-black/60 w-4 h-4 rounded-full translate-x-4" />
                                            </div>
                                        </div>

                                        {/* Vaccine History (Optional toggle switch) */}
                                        <div 
                                            onClick={() => handlePreferenceChange('vaccines', !shareVaccines)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-card-border cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-foreground">Aşı Takvimi Geçmişi</span>
                                                <p className="text-[9px] text-secondary mt-0.5 font-semibold">Son 1 yılda uygulanan aşılar ve takvim planı.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareVaccines ? "bg-accent" : "bg-card-border"
                                            )}>
                                                <div className={cn(
                                                    "bg-white dark:bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-250",
                                                    shareVaccines ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </div>

                                        {/* Health Notes (Optional toggle switch) */}
                                        <div 
                                            onClick={() => handlePreferenceChange('notes', !shareNotes)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-card-border cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-foreground">Sağlık Notları & Alerjiler</span>
                                                <p className="text-[9px] text-secondary mt-0.5 font-semibold">Alerji geçmişi, hassasiyetler ve hekime özel notlar.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareNotes ? "bg-accent" : "bg-card-border"
                                            )}>
                                                <div className={cn(
                                                    "bg-white dark:bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-250",
                                                    shareNotes ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </div>

                                        {/* Owner Info (Optional toggle switch) */}
                                        <div 
                                            onClick={() => handlePreferenceChange('owner', !shareOwner)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-card-border cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-foreground">Sahip Bilgileri</span>
                                                <p className="text-[9px] text-secondary mt-0.5 font-semibold">Telefon ve e-posta hızlı iletişim için.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareOwner ? "bg-accent" : "bg-card-border"
                                            )}>
                                                <div className={cn(
                                                    "bg-white dark:bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-250",
                                                    shareOwner ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>

                            {/* FIXED FOOTER CONTROLS */}
                            <div className="pt-4 border-t border-card-border mt-auto bg-card">
                                <button
                                    onClick={handleCreateAppointment}
                                    disabled={!selectedTime}
                                    className="w-full bg-accent text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-accent/20 disabled:opacity-20 transition-all active:scale-95"
                                >
                                    Randevu talebini ilet
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}


                {/* 2. REVIEWS / RATING MODAL */}
                {activeModal === 'rating' && (
                    <motion.div key="rating-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3100] bg-black/50 dark:bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-card-border text-foreground relative">
                            <div className="flex flex-col items-center text-center p-4">
                                <h3 className="font-black text-lg tracking-tight mb-2 text-foreground">Klinik değerlendir</h3>
                                <p className="text-[11px] text-secondary font-semibold mb-6">Deneyiminizi diğer pati sahipleriyle paylaşın</p>

                                <div className="flex gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            onClick={() => setUserRating(star)}
                                            className="transition-all active:scale-90"
                                        >
                                            <Star className={cn("w-8 h-8 transition-colors", userRating >= star ? "text-yellow-500 fill-current" : "text-card-border")} />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Görüşleriniz..."
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    className="w-full bg-card border border-card-border rounded-xl p-4 text-xs font-bold text-foreground placeholder:text-secondary/50 outline-none focus:border-yellow-500 transition-all resize-none h-24 mb-6"
                                />

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => { setSuccessMessage("Değerlendirildi ✨"); setActiveModal('success'); setTimeout(() => setActiveModal(null), 2000); }}
                                        disabled={userRating === 0}
                                        className="w-full bg-foreground text-background py-3.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-20 transition-all active:scale-95 duration-200"
                                    >
                                        Gönder ve Kapat
                                    </button>
                                    <button onClick={() => setActiveModal(null)} className="text-[9px] font-black text-secondary hover:text-foreground uppercase tracking-wider py-2">İptal</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* MODALS RENDERING */}
                <DentalCareModal isOpen={activeModal === 'dental'} onClose={() => setActiveModal(null)} />
                <PharmacyModal isOpen={activeModal === 'pharma'} onClose={() => setActiveModal(null)} />
                <ClinicListModal 
                    isOpen={activeModal === 'clinicList'} 
                    onClose={() => setActiveModal(null)}
                    clinics={allClinics}
                    onSelectClinic={(clinic) => openAppointment(clinic)}
                    isLoading={isLoading}
                />

                {/* SUCCESS TOAST */}
                {activeModal === 'success' && (
                    <motion.div key="success-toast" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-8 inset-x-0 flex justify-center z-[300] pointer-events-none">
                        <div className="bg-card text-foreground px-6 py-3 rounded-full shadow-2xl font-black text-xs flex items-center gap-2 border border-zinc-200 dark:border-accent/30 transition-colors duration-300">
                            <CheckCircle2 className="w-4 h-4 text-accent dark:text-accent" /> {successMessage}
                        </div>
                    </motion.div>
                )}

                {/* REVIEW PROMPT TOAST */}
                {pendingReviewPrompt && (
                    <motion.div 
                        key="review-toast" 
                        initial={{ y: 50, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: 50, opacity: 0 }} 
                        className="fixed bottom-24 inset-x-4 md:inset-x-auto md:right-8 md:bottom-24 flex justify-center md:justify-end z-[250]"
                    >
                        <div className="bg-card text-foreground p-4 rounded-2xl shadow-2xl border border-zinc-200 dark:border-accent/30 flex items-center justify-between gap-4 w-full md:w-auto max-w-sm">
                            <div className="flex flex-col gap-1">
                                <span className="font-black text-xs text-accent uppercase tracking-widest">DEĞERLENDİRME</span>
                                <span className="text-xs font-bold leading-snug">
                                    {pendingReviewPrompt.clinicName} ile randevunuz nasıldı? Yorum bırakın <Star className="inline w-3 h-3 text-yellow-500 fill-current mb-0.5"/>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        localStorage.setItem(`moffi_review_prompt_shown_${pendingReviewPrompt.id}`, "true");
                                        const clinicData = allClinics.find(c => c.id === pendingReviewPrompt.clinic_id);
                                        setDetailClinicId(pendingReviewPrompt.clinic_id);
                                        setDetailClinicData(clinicData);
                                        setDrawerDefaultReview(true);
                                        setPendingReviewPrompt(null);
                                    }}
                                    className="bg-accent text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-accent transition-colors cursor-pointer"
                                >
                                    Değerlendir
                                </button>
                                <button 
                                    onClick={() => {
                                        localStorage.setItem(`moffi_review_prompt_shown_${pendingReviewPrompt.id}`, "true");
                                        setPendingReviewPrompt(null);
                                    }}
                                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* TRANSPARENCY LOGS MODAL */}
                {isLogModalOpen && (
                    <motion.div key="log-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/60 dark:bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden h-[70vh] flex flex-col border border-card-border text-foreground relative border-t border-t-accent/20">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-card-border rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-5 mt-2 sm:mt-0">
                                <div className="text-left">
                                    <span className="text-[9px] font-black text-accent uppercase tracking-widest block mb-0.5">Şeffaf paylaşım günlüğü</span>
                                    <h2 className="text-lg font-black tracking-tight">Veri paylaşım geçmişi</h2>
                                </div>
                                <button onClick={() => setIsLogModalOpen(false)} className="w-8 h-8 bg-card rounded-full flex items-center justify-center border border-card-border hover:bg-card-border/80 text-foreground transition-all cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>

                            {/* LOGS LIST */}
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4 text-left momentum-scroll overscroll-contain pb-6">
                                {transparencyLogs.length > 0 ? (
                                    transparencyLogs.map((log, lIndex) => {
                                        if (!log.id) console.warn("🚨 BOŞ LOG.ID DEĞERİ!", { log, index: lIndex });
                                        return (
                                        <div key={log.id} className="bg-card border border-card-border rounded-2xl p-4 text-left space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-black text-foreground">{log.clinicName}</h4>
                                                <span className="text-[9px] text-zinc-400 font-bold">{log.date}</span>
                                            </div>
                                            <p className="text-[10.5px] text-secondary font-medium leading-relaxed">
                                                Hekim, <strong>{log.petName}</strong> isimli evcil hayvanınızın şu paylaşılan verilerine erişim sağladı:
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {log.sharedFields.map((field: string, fIdx: number) => {
                                                    if (!field) console.warn("🚨 BOŞ SHAREDFIELD DEĞERİ!", { field, logId: log.id, index: fIdx });
                                                    return (
                                                    <span key={field} className="text-[8px] font-black bg-accent/10 text-accent dark:text-accent px-2 py-0.5 rounded border border-accent/20 uppercase tracking-wider">
                                                        {field}
                                                    </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center opacity-40">
                                        <History className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Henüz veri paylaşım kaydı yok.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. SIDE DRAWER (Clinic Details) */}
                <ClinicDetailDrawer 
                    clinicId={detailClinicId}
                    clinicData={detailClinicData}
                    defaultOpenReviewForm={drawerDefaultReview}
                    defaultReviewAppointmentId={drawerDefaultReviewAppointmentId}
                    onClose={() => { 
                        setDetailClinicId(null); 
                        setDetailClinicData(null); 
                        setDrawerDefaultReview(false);
                        setDrawerDefaultReviewAppointmentId(null);
                    }}
                    onBookAppointment={(clinic) => {
                        setDetailClinicId(null);
                        setDetailClinicData(null);
                        setDrawerDefaultReview(false);
                        setDrawerDefaultReviewAppointmentId(null);
                        openAppointment(clinic);
                    }}
                />

                {/* 6. MEDICATION & NUTRITION MODALS */}
                <MedicationModal 
                    isOpen={activeMedicationModal} 
                    onClose={() => setActiveMedicationModal(false)} 
                    petId={activePet?.id || ''} 
                />
        </div>
    );
}

export default function VetPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            </div>
        }>
            <VetPageContent />
        </Suspense>
    );
}
