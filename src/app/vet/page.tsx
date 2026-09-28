"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, ChevronRight, Syringe, Stethoscope,
    CheckCircle2, ChevronLeft, X, Filter, History, Bell, Heart, ShieldAlert, BookOpen, Map as MapIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, showToast } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ClinicListModal } from "@/components/vet/ClinicListModal";
import { ClinicDetailDrawer } from "@/components/vet/ClinicDetailDrawer";
import { ClinicCard, CategoryTile, useFavoriteClinics, formatDistance } from "@/components/vet/VetShared";
import { VetFilterSheet, DEFAULT_VET_FILTERS, countActiveFilters, type VetFilters } from "@/components/vet/VetFilterSheet";
import { BookingConfirmation, type BookingSummary } from "@/components/vet/BookingConfirmation";
import { useVet } from "@/hooks/useVet";
import { VetClinic, Doctor } from "@/types/domain";
import { Pet, usePet } from "@/context/PetContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDragScroll } from "@/hooks/useDragScroll";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { healthService } from "@/services/healthService";
import { MyAppointmentsPanel } from "@/components/vet/MyAppointmentsPanel";
import { BUSINESS_TYPE_ORDER, getBusinessTypeConfig, isBusinessType } from "@/config/businessTypes";
import type { BusinessType } from "@/context/AuthContext";
import turkeyCities from "@/data/turkey_cities.json";

const ClinicMapView = dynamic(() => import("@/components/vet/ClinicMapView"), { ssr: false });

function VetPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activePet, appointments, pets } = usePet();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user } = useAuth();
    const businessTypeParam = searchParams.get('type');
    const selectedBusinessType: BusinessType = isBusinessType(businessTypeParam) ? businessTypeParam : 'vet';
    const businessConfig = getBusinessTypeConfig(selectedBusinessType);
    const isVeterinary = selectedBusinessType === 'vet';

    useEffect(() => {
        if (businessConfig.primaryFlow === 'order') router.replace('/petshop');
    }, [businessConfig.primaryFlow, router]);

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
    } = useVet(selectedBusinessType);

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filters, setFilters] = useState<VetFilters>(DEFAULT_VET_FILTERS);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'clinics' | 'appointments'>(searchParams.get('view') === 'appointments' ? 'appointments' : 'clinics');
    const [activeModal, setActiveModal] = useState<'appointment' | 'clinicList' | null>(null);
    const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
    const { isFavorite, toggleFavorite } = useFavoriteClinics();
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
    const [selectedProv, setSelectedProv] = useState("");

    // Ekran 2 referansı — 4 hizmet kısayolu + "Tümü/Yakınımda/Moffi Onaylı/Açık Olanlar" hızlı filtreleri
    const [activeServiceFilter, setActiveServiceFilter] = useState<string | null>(null);
    const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'nearby' | 'verified' | 'open'>('all');

    const SERVICE_SHORTCUTS = businessConfig.customerShortcuts;

    useEffect(() => {
        setSearchQuery("");
        setActiveServiceFilter(null);
        setActiveQuickFilter('all');
        setFilters(DEFAULT_VET_FILTERS);
    }, [selectedBusinessType]);

    const applyQuickFilter = (key: typeof activeQuickFilter) => {
        setActiveQuickFilter(key);
        setFilters(f => ({ ...f, sort: key === 'nearby' ? 'distance' : f.sort, openNow: key === 'open' }));
    };

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
            result = result.filter(c => c.isVerified);
        }

        if (filters.openNow) {
            result = result.filter(c => c.isOpenNow);
        }

        if (filters.maxKm != null) {
            result = result.filter(c => typeof c.calculated_distance === 'number' && c.calculated_distance <= filters.maxKm!);
        }

        if (filters.services.length > 0) {
            const wanted = filters.services.map(s => s.toLocaleLowerCase('tr-TR'));
            result = result.filter(c => (c.features || []).some((f: string) => wanted.includes(f.toLocaleLowerCase('tr-TR'))));
        }

        if (filters.sort === 'rating') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
        } else {
            result.sort((a, b) => (a.calculated_distance ?? 999999) - (b.calculated_distance ?? 999999));
        }

        return result;
    }, [allClinics, searchQuery, filters, activeServiceFilter, activeQuickFilter]);

    const activeFilterCount = countActiveFilters(filters);
    const serviceOptions = useMemo(() => {
        const names = new Set<string>();
        allClinics.forEach((c: any) => (c.features || []).forEach((f: string) => f && names.add(f)));
        return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
    }, [allClinics]);

    const openClinicDetail = (clinic: any) => {
        setDetailClinicId(clinic.id);
        setDetailClinicData(clinic);
    };

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

    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
    const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
    const [detailClinicData, setDetailClinicData] = useState<any>(null);
    const [drawerDefaultReview, setDrawerDefaultReview] = useState(false);
    const [drawerDefaultReviewAppointmentId, setDrawerDefaultReviewAppointmentId] = useState<string | null>(null);
    const [reviewableAppointmentIds, setReviewableAppointmentIds] = useState<Set<string>>(new Set());
    const [pendingReviewPrompt, setPendingReviewPrompt] = useState<any>(null);


    // Notification State (Faz 9)
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Data Sharing Consent States
    const [shareBasic, setShareBasic] = useState(true);
    const [shareVaccines, setShareVaccines] = useState(true);
    const [shareNotes, setShareNotes] = useState(false);
    const [shareOwner, setShareOwner] = useState(false);

    // Transparency Logs States
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [transparencyLogs, setTransparencyLogs] = useState<any[]>([]);

    const [timeSlots, setTimeSlots] = useState<{ time: string; disabled: boolean }[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
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
                            setPendingReviewPrompt({ ...latest, clinicName: clinic.name || clinic.business_name || "İşletme" });
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

        const channel = supabase
            .channel(`vet-notifications-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => {
                if (payload.new?.type === 'appointment') fetchNotifications();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

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
        if (!selectedClinic?.id) return;

        const loadCalendar = async () => {
            try {
                const today = new Date().toLocaleDateString('sv-SE');
                const days = await apiService.getClinicCalendar(selectedClinic.id, today, 14);
                setOpenDays(Object.fromEntries(days.map(d => [d.day, d.is_open])));
            } catch (e) {
                console.error("Failed to load clinic calendar:", e);
                setOpenDays({});
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

        loadCalendar();
        loadClinicServices();
        loadClinicDoctors();
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

    // Paylaşım geçmişi: randevularda işletmeyle paylaşılan veriler (appointments.shared_passport).
    useEffect(() => {
        if (!isLogModalOpen) return;
        apiService.getMySharedPassports().then(setTransparencyLogs).catch(() => setTransparencyLogs([]));
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

    // Bağlantıyla gelinen durumlar: ?open=vaccine|nutrition (genel sağlık pencereleri),
    // ?open=appointment (klinik seçimi), ?clinic=<id> (paylaşılan klinik bağlantısı → detay).
    const handledDeepLinkRef = useRef<string | null>(null);
    useEffect(() => {
        const key = searchParams.toString();
        if (handledDeepLinkRef.current === key) return;
        const openModal = searchParams.get('open');
        const targetClinicId = searchParams.get('clinic') || searchParams.get('clinicId');

        if ((openModal === 'vaccine' || openModal === 'health') && isVeterinary) {
            window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'health' } }));
        } else if (openModal === 'nutrition' && isVeterinary) {
            window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'nutrition' } }));
        } else if (openModal === 'appointment') {
            setActiveModal('clinicList');
        }

        if (targetClinicId) {
            const found = allClinics.find(c => String(c.id) === String(targetClinicId));
            openClinicDetail(found || { id: targetClinicId });
        }
        handledDeepLinkRef.current = key;
    }, [searchParams, allClinics.length, isVeterinary]);

    useEffect(() => {
        const handleOpenModal = (e: Event) => {
            if ((e as CustomEvent).detail === 'clinicList' || (e as CustomEvent).detail === 'appointment') setActiveModal('clinicList');
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
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const key = d.toLocaleDateString('sv-SE');
        return {
            key,
            label: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            dayName: dayNames[d.getDay()],
            closed: openDays[key] === false
        };
    });

    // Uygun saatler tamamen sunucuda hesaplanır: çalışma saati, öğle arası, özel günler,
    // hizmet süresi, personel izni/saatleri ve mevcut randevular (get_available_slots).
    const slotRequestRef = useRef(0);
    const loadSlots = async () => {
        if (!selectedClinic?.id || !selectedDate) { setTimeSlots([]); return; }
        const requestId = ++slotRequestRef.current;
        setSlotsLoading(true);
        try {
            const slots = await apiService.getAvailableSlots(
                selectedClinic.id,
                selectedDate,
                selectedSvc?.duration_minutes || null,
                selectedDoctor?.id || null
            );
            if (requestId === slotRequestRef.current) {
                setTimeSlots(slots.map(s => ({ time: s.slot_time, disabled: !s.available })));
                setSelectedTime(prev => (prev && slots.some(s => s.slot_time === prev && s.available)) ? prev : null);
            }
        } catch (e) {
            console.error("Failed to load available slots:", e);
            if (requestId === slotRequestRef.current) setTimeSlots([]);
        } finally {
            if (requestId === slotRequestRef.current) setSlotsLoading(false);
        }
    };

    useEffect(() => {
        if (activeModal !== 'appointment') return;
        loadSlots();
    }, [activeModal, selectedClinic?.id, selectedDate, selectedSvc?.duration_minutes, selectedDoctor?.id]);

    useEffect(() => {
        if (activeModal !== 'appointment') return;
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') loadSlots();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [activeModal, selectedClinic?.id, selectedDate, selectedSvc?.duration_minutes, selectedDoctor?.id]);

    const openAppointment = (clinic: VetClinic) => {
        setSelectedClinic(clinic);
        setActiveModal('appointment');
        setSelectedDate(dateOptions[0]?.key || '');
        setSelectedTime(null);
        setSelectedDoctor(null);
        setSelectedSvc(null);
        setSelectedAppointmentPet(activePet || pets?.[0] || null);
    };

    const rebookServiceRef = useRef<string | null>(null);
    const handleRebook = async (clinicId: string, serviceName: string) => {
        let clinic: any = allClinics.find(c => c.id === clinicId);
        if (!clinic) {
            try { clinic = await apiService.getClinicDetails(clinicId); } catch { clinic = null; }
        }
        if (!clinic) {
            showToast("Bu işletmeye şu an ulaşılamıyor.", "AlertCircle", "text-red-500 font-bold");
            return;
        }
        openAppointmentWithService(clinic, serviceName);
    };

    // Aynı klinik tekrar açıldığında hizmet listesi yeniden yüklenmez; bu durumda seçimi hemen yap,
    // değilse clinicServices yüklenince aşağıdaki effect seçer.
    function openAppointmentWithService(clinic: VetClinic, serviceName?: string) {
        rebookServiceRef.current = serviceName || null;
        openAppointment(clinic);
        if (serviceName && selectedClinic?.id === clinic.id && clinicServices.length > 0) {
            const match = clinicServices.find((s: any) => s.service_name === serviceName);
            rebookServiceRef.current = null;
            if (match) setSelectedSvc(match);
        }
    }

    const [cancelNoticeHours, setCancelNoticeHours] = useState(0);
    useEffect(() => {
        if (!selectedClinic?.id) return;
        apiService.getCancellationNoticeHours(selectedClinic.id).then(setCancelNoticeHours).catch(() => setCancelNoticeHours(0));
    }, [selectedClinic?.id]);

    useEffect(() => {
        if (!rebookServiceRef.current || clinicServices.length === 0) return;
        const match = clinicServices.find((s: any) => s.service_name === rebookServiceRef.current);
        rebookServiceRef.current = null;
        if (match) setSelectedSvc(match);
    }, [clinicServices]);

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
            } catch (error) {
                console.error("Pet age could not be calculated:", error);
            }
        }
        return undefined;
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
                // Sağlık Karnesi'ndeki gerçek aşı kayıtları (yapılanlar + planlananlar).
                const records = await healthService.getVaccines(bookingPet.id);
                sharedVaccines = records.map(v => ({
                    name: v.name,
                    date: v.dateAdministered || v.nextDueDate,
                    status: v.status
                }));
            } catch (e) {
                console.error("Failed to load vaccines for sharing:", e);
            }
        }

        const sharedHealthNotes = (shareNotes && bookingPet)
            ? (bookingPet.health_notes || bookingPet.sos_settings?.critical_health_note || null)
            : "";

        const ownerInfo = shareOwner && user ? {
            name: user.name || user.username || null,
            phone: user.phone || null,
            email: user.email || null
        } : null;
        const sharedPassport = isVeterinary ? {
            basic: shareBasic && bookingPet ? {
                name: bookingPet.name,
                breed: bookingPet.breed || null,
                weight: bookingPet.weight ? `${bookingPet.weight} kg` : null,
                age: calculatePetAge(bookingPet)
            } : null,
            vaccines: shareVaccines && sharedVaccines.length > 0 ? sharedVaccines : null,
            healthNotes: shareNotes ? sharedHealthNotes || null : null,
            ownerInfo: ownerInfo && Object.values(ownerInfo).some(Boolean) ? ownerInfo : null
        } : null;

        const petInfo = bookingPet ? { id: bookingPet.id, name: bookingPet.name, image: bookingPet.image } : undefined;

        try {
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
        } catch (error: any) {
            showToast(error?.message || "Randevu oluşturulamadı, lütfen tekrar dene.", "AlertCircle", "text-red-500 font-bold");
            if (error?.code === 'SLOT_TAKEN') {
                setSelectedTime(null);
                loadSlots();
            }
            return;
        }

        setBookingSummary({
            clinic: selectedClinic,
            serviceName: selectedSvc?.service_name || businessConfig.customerFallbackService,
            dateKey: selectedDate,
            time: selectedTime,
            durationMinutes: selectedSvc?.duration_minutes || 30,
            petName: bookingPet?.name || null,
            petImage: bookingPet?.image || null,
            staffName: selectedDoctor?.name || null,
        });
        setActiveModal(null);
        setDetailClinicId(null);
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
                let type = businessConfig.customerFallbackService;
                const firstReasonLine = (apt.reason || '').split('\n')[0];
                if (firstReasonLine.includes('Randevu tipi:')) {
                    type = firstReasonLine.split('Randevu tipi:')[1].trim() || businessConfig.customerFallbackService;
                } else if (firstReasonLine) {
                    type = firstReasonLine;
                }
                return {
                    id: apt.id,
                    petId: petId,
                    petName: petName,
                    icon: '🏥',
                    type: type,
                    clinicName: apt.clinic?.business_name || apt.clinic_name || 'İşletme',
                    clinicImage: apt.clinic?.avatar_url || null,
                    clinicAddress: apt.clinic?.address || null,
                    clinicId: apt.clinic_id,
                    petImage: petInfo?.image || null,
                    realDoctorName: apt.doctor?.name || apt.doctor_name || null,
                    date: dateStr,
                    time: timeStr,
                    status: apt.status || 'pending',
                    durationMinutes: apt.duration_minutes || 30,
                    statusReason: apt.status_reason || null,
                    attendance: apt.attendance_status || null,
                    rescheduleRequested: apt.reschedule_requested_start
                        ? `${apt.reschedule_requested_start.split('T')[0]} ${apt.reschedule_requested_start.split('T')[1].substring(0, 5)}`
                        : null,
                    _rawDate: apt.appointment_date ? new Date(apt.appointment_date).getTime() : 0,
                    _rawCreatedAt: apt.created_at ? new Date(apt.created_at).getTime() : 0
                };
            });
            allApts = [...allApts, ...mapped];
        });
        return allApts;
    }, [appointments, pets, businessConfig.customerFallbackService]);

    return (
        <div className="theme-vet min-h-screen bg-background text-foreground pb-32 font-sans relative selection:bg-accent/30 transition-colors duration-300">
            {/* Minimal solid design - no cheap floating background blobs */}

            {/* Referans Ekran 2 — Veteriner ana ekranı */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border">
                <div className="px-5 pt-7 pb-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center w-full min-w-0 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => (window.history.length > 2 ? router.back() : router.push('/home'))}
                                aria-label="Geri"
                                className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-foreground/80 shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-black text-foreground tracking-tight truncate">{businessConfig.customerLabel}</h1>
                        </div>
                        <div className="relative shrink-0" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
                                className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-foreground/80 relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">{unreadCount}</span>
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-72 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden z-[170]"
                                    >
                                        <div className="max-h-64 overflow-y-auto">
                                            {unreadNotifications.length > 0 ? unreadNotifications.map(notif => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif.id)}
                                                    className={cn("w-full text-left p-4 border-b border-card-border last:border-0 hover:bg-card-border/30", notif.isReadLocally && "opacity-50")}
                                                >
                                                    <p className="text-xs font-bold text-foreground mb-1 leading-relaxed">{notif.message}</p>
                                                    <span className="text-[10px] font-semibold text-secondary">{new Date(notif.created_at).toLocaleString('tr-TR')}</span>
                                                </button>
                                            )) : (
                                                <p className="p-6 text-center text-xs font-bold text-secondary">Yeni randevu bildirimi yok</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {(!userProvince || !userDistrict || isLocationSelectorOpen) ? (
                        <div className="bg-card p-4 rounded-xl border border-card-border">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-accent" />
                                <h3 className="text-sm font-black text-foreground">Konumunu seç</h3>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    aria-label="İl"
                                    className="flex-1 h-10 px-3 rounded-lg border border-card-border bg-background text-xs font-bold text-foreground"
                                    value={selectedProv || userProvince || ""}
                                    onChange={(e) => setSelectedProv(e.target.value)}
                                >
                                    <option value="" disabled>İl seç</option>
                                    {turkeyCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                                <select
                                    aria-label="İlçe"
                                    className="flex-1 h-10 px-3 rounded-lg border border-card-border bg-background text-xs font-bold text-foreground disabled:opacity-50"
                                    value={(selectedProv && selectedProv !== userProvince) ? "" : (userDistrict || "")}
                                    onChange={(e) => {
                                        setLocationFilter(selectedProv || userProvince, e.target.value);
                                        setIsLocationSelectorOpen(false);
                                        setSelectedProv("");
                                    }}
                                    disabled={!(selectedProv || userProvince)}
                                >
                                    <option value="" disabled>İlçe seç</option>
                                    {turkeyCities.find(c => c.name === (selectedProv || userProvince))?.districts.map((d: any) => (
                                        <option key={d.name} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsLocationSelectorOpen(true)} className="flex items-center gap-2 text-left w-full bg-card border border-card-border rounded-xl px-3.5 h-11">
                            <MapPin className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-[13px] font-bold text-foreground truncate flex-1">
                                Konumun: <span className="text-secondary font-semibold">{userDistrict}, {userProvince}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                        </button>
                    )}

                    <div className="relative z-[160]" ref={searchContainerRef}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            type="search"
                            aria-label="Ara"
                            placeholder={businessConfig.customerSearchPlaceholder}
                            className="w-full h-12 pl-11 pr-4 bg-card rounded-xl border border-card-border outline-none font-semibold text-[13px] text-foreground placeholder:text-secondary/70 focus:border-accent"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchPanelOpen(true); }}
                            onFocus={() => setIsSearchPanelOpen(true)}
                        />
                        <AnimatePresence>
                            {isSearchPanelOpen && searchQuery.trim() && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-[110%] left-0 right-0 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                                >
                                    <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                                        {activeClinics.length > 0 ? activeClinics.slice(0, 6).map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => { openClinicDetail(c); setIsSearchPanelOpen(false); setSearchQuery(""); }}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-border/30 border-b border-card-border/50 last:border-0"
                                            >
                                                <span className="text-[13px] font-bold text-foreground truncate text-left">{c.name}</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-secondary shrink-0" />
                                            </button>
                                        )) : (
                                            <p className="px-4 py-6 text-center text-xs font-bold text-secondary">Sonuç bulunamadı</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex bg-card-border/50 p-1 rounded-xl">
                        {([['clinics', isVeterinary ? 'Klinik keşfet' : 'İşletme keşfet'], ['appointments', 'Randevularım']] as const).map(([k, l]) => (
                            <button
                                key={k}
                                onClick={() => setViewMode(k)}
                                aria-pressed={viewMode === k}
                                className={cn("flex-1 py-2 rounded-lg text-xs font-black transition-all", viewMode === k ? "bg-card shadow-sm text-foreground" : "text-secondary")}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-5 py-5 space-y-6">
                {viewMode === 'appointments' ? (
                    <>
                        <MyAppointmentsPanel
                            appointments={mappedAppointments}
                            activePetId={activePet?.id}
                            reviewableAppointmentIds={reviewableAppointmentIds}
                            onRebook={handleRebook}
                            onReviewClick={(clinicId, appointmentId) => {
                                const clinicData = allClinics.find(c => c.id === clinicId);
                                openClinicDetail(clinicData || { id: clinicId });
                                setDrawerDefaultReviewAppointmentId(appointmentId);
                                setDrawerDefaultReview(true);
                            }}
                            onOpenClinic={(clinicId) => {
                                const clinicData = allClinics.find(c => c.id === clinicId);
                                openClinicDetail(clinicData || { id: clinicId });
                            }}
                        />
                        {isVeterinary && (
                            <button onClick={() => setIsLogModalOpen(true)} className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-card-border bg-card text-xs font-bold text-secondary">
                                <History className="w-4 h-4 text-accent" /> Veri paylaşım geçmişim
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {SERVICE_SHORTCUTS.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {SERVICE_SHORTCUTS.map(cat => (
                                    <CategoryTile
                                        key={cat.key}
                                        shortcut={cat}
                                        active={activeServiceFilter === cat.key}
                                        onClick={() => setActiveServiceFilter(activeServiceFilter === cat.key ? null : cat.key)}
                                    />
                                ))}
                            </div>
                        )}

                        {isVeterinary && (
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => router.push('/vet/emergency')} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-300 text-[11px] font-black">
                                    <ShieldAlert className="w-4 h-4" /> Acil
                                </button>
                                <button onClick={() => router.push('/vet/favorites')} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-card border border-card-border text-[11px] font-black text-foreground">
                                    <Heart className="w-4 h-4 text-accent" /> Favoriler
                                </button>
                                <button onClick={() => router.push('/vet/guide')} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-card border border-card-border text-[11px] font-black text-foreground">
                                    <BookOpen className="w-4 h-4 text-accent" /> Rehber
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div
                                ref={categoryScroll.ref}
                                onMouseDown={categoryScroll.onMouseDown}
                                onMouseLeave={categoryScroll.onMouseLeave}
                                onMouseUp={categoryScroll.onMouseUp}
                                onMouseMove={categoryScroll.onMouseMove}
                                className="flex-1 flex gap-2 overflow-x-auto no-scrollbar select-none"
                            >
                                {([
                                    { id: 'all' as const, label: 'Tümü' },
                                    { id: 'nearby' as const, label: 'Yakınımda' },
                                    { id: 'verified' as const, label: 'Moffi onaylı' },
                                    { id: 'open' as const, label: 'Açık olanlar' },
                                ]).map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => applyQuickFilter(f.id)}
                                        aria-pressed={activeQuickFilter === f.id}
                                        className={cn(
                                            "px-4 py-2 rounded-full whitespace-nowrap font-bold text-xs shrink-0",
                                            activeQuickFilter === f.id ? "bg-foreground text-background" : "bg-card text-secondary border border-card-border"
                                        )}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsFilterPanelOpen(true)}
                                aria-label="Filtreler"
                                className="relative bg-card border border-card-border w-9 h-9 rounded-xl flex items-center justify-center text-secondary shrink-0"
                            >
                                <Filter className="w-4 h-4" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-accent text-white rounded-full text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-base font-black text-foreground tracking-tight">
                                    {isVeterinary ? 'Yakındaki veterinerler' : `Yakındaki ${businessConfig.customerLabel.toLocaleLowerCase('tr-TR')} işletmeleri`}
                                </h2>
                                <button onClick={() => setIsMapOpen(true)} disabled={activeClinics.length === 0} className="text-[12px] font-bold text-accent flex items-center gap-1 disabled:opacity-40">
                                    <MapIcon className="w-3.5 h-3.5" /> Haritada gör
                                </button>
                            </div>

                            <div className="space-y-3">
                                {isLoading && activeClinics.length === 0 && [0, 1, 2].map(i => (
                                    <div key={i} className="h-[96px] rounded-2xl bg-card border border-card-border animate-pulse" />
                                ))}
                                {activeClinics.map((clinic, index) => (
                                    <ClinicCard
                                        key={clinic.id}
                                        clinic={clinic}
                                        index={index}
                                        onOpen={() => openClinicDetail(clinic)}
                                        isFavorite={isFavorite(clinic.id)}
                                        onToggleFavorite={() => toggleFavorite(clinic.id)}
                                    />
                                ))}
                                {!isLoading && activeClinics.length === 0 && userProvince && userDistrict && (
                                    <div className="text-center py-10 px-6 bg-card border border-card-border rounded-2xl">
                                        <p className="text-sm font-bold text-foreground">Bu bölgede eşleşen işletme yok</p>
                                        <p className="text-xs font-semibold text-secondary mt-1">
                                            {allClinics.length > 0 ? 'Filtreleri gevşetmeyi dene.' : 'Konumunu değiştirerek yakın bir ilçeye bakabilirsin.'}
                                        </p>
                                        {allClinics.length > 0 && (
                                            <button
                                                onClick={() => { setFilters(DEFAULT_VET_FILTERS); setActiveQuickFilter('all'); setActiveServiceFilter(null); setSearchQuery(""); }}
                                                className="mt-3 px-4 py-2 rounded-xl bg-accent/10 text-accent text-xs font-black"
                                            >
                                                Filtreleri temizle
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {BUSINESS_TYPE_ORDER.length > 1 && (
                            <section className="pt-2">
                                <h3 className="text-[12px] font-bold text-secondary mb-2 px-1">Diğer hizmetler</h3>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {BUSINESS_TYPE_ORDER.filter(t => t !== selectedBusinessType).map(type => {
                                        const typeConfig = getBusinessTypeConfig(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => router.push(typeConfig.primaryFlow === 'order' ? '/petshop' : type === 'vet' ? '/vet' : `/vet?type=${type}`)}
                                                className="shrink-0 px-3.5 py-2 rounded-full border border-card-border bg-card text-xs font-bold text-secondary"
                                            >
                                                {typeConfig.customerLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            <VetFilterSheet
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                value={filters}
                onApply={(f) => { setFilters(f); setActiveQuickFilter(f.openNow ? 'open' : 'all'); }}
                serviceOptions={serviceOptions}
                province={userProvince}
                district={userDistrict}
                onLocationChange={setLocationFilter}
                hasGps={!!userLocation}
            />

            {isMapOpen && (
                <ClinicMapView
                    clinics={activeClinics}
                    userLocation={userLocation}
                    onClose={() => setIsMapOpen(false)}
                    onOpenClinic={(c) => { setIsMapOpen(false); openClinicDetail(c); }}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {/* --- MODALS & DRAWERS --- */}
            <AnimatePresence>
                {/* 1. APPOINTMENT SLOTS MODAL */}
                {activeModal === 'appointment' && selectedClinic && (
                    <motion.div key="appointment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3100] bg-black/50 dark:bg-black/85 backdrop-blur-sm">
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 z-[3101] h-full w-full sm:w-[480px] bg-background shadow-[-20px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-card-border flex flex-col overflow-hidden text-foreground p-6 pt-12 sm:pt-6">

                            
                            <div className="flex justify-between items-center mb-6 mt-2 sm:mt-0">
                                <h2 className="text-lg font-black tracking-tight">{businessConfig.customerRequestTitle}</h2>
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
                                        <div className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                                            <span className="line-clamp-2">{formatDistance(selectedClinic.calculated_distance) || selectedClinic.address}</span>
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
                                                <p className="text-sm font-bold text-secondary mb-4">Bu işletme henüz hizmet listesini eklemedi.</p>
                                                <button
                                                    onClick={() => setSelectedSvc({ service_name: businessConfig.customerFallbackService, duration_minutes: 30 })}
                                                    className="px-6 py-2 bg-accent/10 text-accent text-xs font-black rounded-xl transition-colors hover:bg-accent/20 inline-block"
                                                >
                                                    {businessConfig.customerBookingLabel}
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
                                                            {isVeterinary
                                                                ? <Stethoscope className="w-4 h-4 text-accent" />
                                                                : <CheckCircle2 className="w-4 h-4 text-accent" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black text-foreground tracking-tight text-sm truncate">{svc.service_name}</div>
                                                            <div className="text-[10px] font-bold text-secondary mt-0.5">
                                                                ~{svc.duration_minutes} dk
                                                                {svc.price != null && <> · {Number(svc.price).toLocaleString('tr-TR')} ₺</>}
                                                            </div>
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
                                                <div className="text-[10px] font-bold text-secondary mt-0.5">
                                                    ~{selectedSvc.duration_minutes || 30} dk
                                                    {selectedSvc.price != null && <> · {Number(selectedSvc.price).toLocaleString('tr-TR')} ₺</>}
                                                </div>
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
                                                <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2.5 block px-1">{businessConfig.staffLabel} seçimi (opsiyonel)</label>
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
                                                        : day.closed
                                                            ? "border-transparent bg-card/50 text-secondary/50"
                                                            : "border-card-border bg-card text-secondary hover:border-card-border hover:text-foreground"
                                                )}
                                            >
                                                <div className="text-[8px] font-bold uppercase tracking-wider mb-0.5">{day.dayName}</div>
                                                <div className="text-xs font-black">{day.label}</div>
                                                {day.closed && <div className="text-[8px] font-bold mt-0.5">Kapalı</div>}
                                            </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mb-6 text-left">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-wider mb-3 block px-1">Saat seçimi</label>
                                    {!slotsLoading && selectedDate && timeSlots.filter(s => !s.disabled).length === 0 && (
                                        <div className="bg-card border border-card-border rounded-2xl p-4 text-center text-xs font-bold text-secondary">
                                            {openDays[selectedDate] === false
                                                ? "İşletme bu gün kapalı. Başka bir gün seç."
                                                : "Bu gün için uygun saat kalmadı. Başka bir gün seç."}
                                        </div>
                                    )}
                                    <div className={cn("grid grid-cols-4 gap-2 transition-opacity", slotsLoading && "opacity-50")}>
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
                                {isVeterinary && <div className="bg-card border border-card-border rounded-2xl p-4 text-left">
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
                                </div>}
                                    </>
                                )}
                            </div>

                            {/* FIXED FOOTER CONTROLS */}
                            <div className="pt-4 border-t border-card-border mt-auto bg-card">
                                {cancelNoticeHours > 0 && (
                                    <p className="text-[11px] font-semibold text-secondary text-center mb-3">
                                        Bu işletme randevudan en az {cancelNoticeHours} saat önce yapılan iptal ve ertelemeleri kabul ediyor.
                                    </p>
                                )}
                                <button
                                    onClick={handleCreateAppointment}
                                    disabled={!selectedTime}
                                    className="w-full bg-accent text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-accent/20 disabled:opacity-20 transition-all active:scale-95"
                                >
                                    {businessConfig.customerSubmitLabel}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}


                <ClinicListModal 
                    isOpen={activeModal === 'clinicList'} 
                    onClose={() => setActiveModal(null)}
                    clinics={allClinics}
                    onSelectClinic={(clinic) => openAppointment(clinic)}
                    isLoading={isLoading}
                />

                {/* REVIEW PROMPT TOAST */}
                {pendingReviewPrompt && (
                    <motion.div 
                        key="review-toast" 
                        initial={{ y: 50, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: 50, opacity: 0 }} 
                        className="fixed bottom-24 inset-x-4 md:inset-x-auto md:right-8 md:bottom-24 flex justify-center md:justify-end z-[250]"
                    >
                        <div className="bg-card text-foreground p-4 rounded-2xl shadow-2xl border border-card-border flex items-center justify-between gap-3 w-full md:w-auto max-w-sm">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black text-sm">Ziyaretin nasıldı?</span>
                                <span className="text-xs font-semibold text-secondary leading-snug">
                                    {pendingReviewPrompt.clinicName} için kısa bir değerlendirme bırak.
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
                                    className="bg-accent text-white px-3.5 h-9 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer"
                                >
                                    Değerlendir
                                </button>
                                <button 
                                    onClick={() => {
                                        localStorage.setItem(`moffi_review_prompt_shown_${pendingReviewPrompt.id}`, "true");
                                        setPendingReviewPrompt(null);
                                    }}
                                    aria-label="Kapat"
                                    className="p-2 text-secondary hover:text-foreground transition-colors cursor-pointer"
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
                                                Bu randevuda <strong>{log.petName}</strong> için işletmeyle şu bilgileri paylaştın:
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
                    businessType={selectedBusinessType}
                    defaultOpenReviewForm={drawerDefaultReview}
                    defaultReviewAppointmentId={drawerDefaultReviewAppointmentId}
                    isFavorite={detailClinicId ? isFavorite(detailClinicId) : false}
                    onToggleFavorite={detailClinicId ? () => toggleFavorite(detailClinicId) : undefined}
                    onClose={() => {
                        setDetailClinicId(null);
                        setDetailClinicData(null);
                        setDrawerDefaultReview(false);
                        setDrawerDefaultReviewAppointmentId(null);
                    }}
                    onBookAppointment={(clinic, serviceName) => {
                        setDetailClinicId(null);
                        setDetailClinicData(null);
                        setDrawerDefaultReview(false);
                        setDrawerDefaultReviewAppointmentId(null);
                        openAppointmentWithService(clinic, serviceName);
                    }}
                />

                <AnimatePresence>
                    {bookingSummary && (
                        <BookingConfirmation
                            summary={bookingSummary}
                            onClose={() => setBookingSummary(null)}
                            onViewAppointments={() => { setBookingSummary(null); setViewMode('appointments'); window.scrollTo({ top: 0 }); }}
                        />
                    )}
                </AnimatePresence>
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
