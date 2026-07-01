"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, Star, Calendar, CreditCard,
    ShieldAlert, ChevronRight, Syringe, Utensils, Clock, Pill,
    CheckCircle2, ChevronLeft, X, Filter, PhoneCall, Activity, History,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VaccineModal } from "@/components/vet/VaccineModal";
import { DentalCareModal } from "@/components/vet/DentalCareModal";
import { PharmacyModal } from "@/components/vet/PharmacyModal";
import { ClinicListModal } from "@/components/vet/ClinicListModal";
import { ClinicDetailDrawer } from "@/components/vet/ClinicDetailDrawer";
import { MedicationModal } from "@/components/vet/MedicationModal";
import { NutritionModal } from "@/components/vet/NutritionModal";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { useVet } from "@/hooks/useVet";
import { VetClinic } from "@/types/domain";
import { Pet, usePet } from "@/context/PetContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDragScroll } from "@/hooks/useDragScroll";
import { apiService, isSupabaseEnabled } from "@/services/apiService";

// Dynamic map import
const MapboxLiveMap = dynamic(() => import('@/components/walk/LiveMap'), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#18181b] animate-pulse rounded-3xl" />
});

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

export default function VetPage() {
    const router = useRouter();
    const { activePet } = usePet();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user } = useAuth();

    // Drag scroll hooks
    const categoryScroll = useDragScroll();
    const dateScroll = useDragScroll();

    const { 
        featuredClinics, allClinics, userLocation, isLoading, 
        bookAppointment, searchByService, activeCategory 
    } = useVet();

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [activeModal, setActiveModal] = useState<'appointment' | 'payment' | 'vaccine' | 'dental' | 'pharma' | 'sos' | 'success' | 'rating' | 'clinicList' | null>(null);
    
    // Payment Simulation States
    const [tempAppointmentData, setTempAppointmentData] = useState<any>(null);
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");
    const [isOtpProcessing, setIsOtpProcessing] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
    const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("Randevu Oluşturuldu ✨");
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");

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

    useEffect(() => {
        if (!isSupabaseEnabled) return;
        
        const loadDbAppointments = async () => {
            try {
                const list = await apiService.getClinicAppointments('biz_vet1');
                setDbAppointments(list);
            } catch (e) {
                console.error("Failed to load DB appointments for slot filtering:", e);
            }
        };

        const loadClinicSettings = async () => {
            try {
                const settings = await apiService.getClinicSettings('biz_vet1');
                if (settings) {
                    setClinicSettings(settings);
                }
            } catch (e) {
                console.error("Failed to load clinic settings from database:", e);
            }
        };

        loadDbAppointments();
        loadClinicSettings();
        
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
    }, []);

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
        if (typeof window !== 'undefined' && !isLoading && allClinics.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const openModal = params.get('open');
            const targetClinicId = params.get('clinicId');
            
            if (openModal === 'vaccine') {
                setActiveModal('vaccine');
            } else if (openModal === 'appointment') {
                setActiveModal('clinicList');
            }

            if (targetClinicId) {
                const found = allClinics.find(c => String(c.id) === String(targetClinicId));
                if (found) {
                    setSelectedClinic(found);
                    setActiveModal('appointment');
                }
            }
        }
    }, [isLoading, allClinics]);

    // Appointment Form States
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const dateOptions = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        return {
            key: d.toISOString().split('T')[0],
            label: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            dayName: dayNames[d.getDay()],
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

            const defaultDays = { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false };
            const workingDays = settings?.workingDays || defaultDays;
            const startTime = settings?.startTime || "09:00";
            const endTime = settings?.endTime || "18:00";
            const lunchStart = settings?.lunchStart || "12:00";
            const lunchEnd = settings?.lunchEnd || "13:00";
            const slotDuration = settings?.slotDuration || 30;

            const dayOfW = new Date(dateStr);
            const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayNameEng = daysEng[dayOfW.getDay()];
            
            if (!workingDays[dayNameEng]) {
                return [];
            }

            const slots: string[] = [];
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const [lunchStartH, lunchStartM] = lunchStart.split(':').map(Number);
            const [lunchEndH, lunchEndM] = lunchEnd.split(':').map(Number);

            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
            const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

            for (let min = startMinutes; min < endMinutes; min += slotDuration) {
                if (min >= lunchStartMinutes && min < lunchEndMinutes) {
                    continue;
                }
                const h = Math.floor(min / 60);
                const m = min % 60;
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }

            const bookedTimes = new Set<string>();

            if (isSupabaseEnabled) {
                dbAppointments.forEach((apt: any) => {
                    if (apt.appointment_date && apt.status !== 'rejected' && apt.status !== 'cancelled') {
                        try {
                            const d = new Date(apt.appointment_date);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            const aptDateStr = `${year}-${month}-${day}`;
                            
                            if (aptDateStr === dateStr) {
                                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                bookedTimes.add(timeStr);
                            }
                        } catch (e) {}
                    }
                });
            } else {
                const pendingSaved = localStorage.getItem('moffi_pending_appointments');
                const confirmedSaved = localStorage.getItem('moffi_confirmed_appointments');
                
                const pendingList = pendingSaved ? JSON.parse(pendingSaved) : [];
                const confirmedList = confirmedSaved ? JSON.parse(confirmedSaved) : [];
                
                pendingList.forEach((apt: any) => {
                    if (apt.date === dateStr && apt.status !== 'rejected') {
                        bookedTimes.add(apt.time);
                    }
                });
                confirmedList.forEach((apt: any) => {
                    if (apt.date === dateStr && apt.status !== 'rejected' && apt.status !== 'cancelled') {
                        bookedTimes.add(apt.time);
                    }
                });
            }

            return slots.filter(time => !bookedTimes.has(time));
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
            return generated.filter(time => {
                const [h, m] = time.split(':').map(Number);
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

    const handleProceedToPayment = () => {
        console.log("handleProceedToPayment called. selectedClinic:", selectedClinic?.name, "selectedTime:", selectedTime);
        if (!selectedClinic || !selectedTime) {
            console.log("handleProceedToPayment aborted: missing clinic or time");
            return;
        }

        let sharedVaccines: any[] = [];
        if (shareVaccines && activePet) {
            try {
                const saved = localStorage.getItem(`moffi_vaccines_${activePet.id}`);
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

        const sharedHealthNotes = (shareNotes && activePet)
            ? (activePet.health_notes || activePet.sos_settings?.critical_health_note || "Gluten Alerjisi, Hassas Sindirim")
            : "";

        const sharedPassport = {
            basic: shareBasic && activePet ? {
                name: activePet.name,
                breed: activePet.breed || "Tekir / Mix",
                weight: activePet.weight ? `${activePet.weight} kg` : "6.2 kg",
                age: calculatePetAge(activePet)
            } : null,
            vaccines: shareVaccines ? sharedVaccines : null,
            healthNotes: shareNotes ? sharedHealthNotes : null,
            ownerInfo: shareOwner ? {
                name: user?.name || user?.username || "Uveys",
                phone: user?.phone || "+90 532 123 45 67",
                email: user?.email || "owner@moffi.com"
            } : null
        };

        setTempAppointmentData({
            clinic: selectedClinic,
            date: selectedDate,
            time: selectedTime,
            type: 'general',
            sharedPassport,
            petInfo: activePet ? { name: activePet.name, image: activePet.avatar_url || activePet.image } : undefined
        });

        setPaymentError("");
        setCardNumber("");
        setCardExpiry("");
        setCardCvc("");
        setCardholderName("");
        setActiveModal('payment');
    };

    const completeAppointmentBooking = async () => {
        if (!tempAppointmentData) return;
        
        const price = tempAppointmentData.clinic.price || 350;
        let currentBalance = 12450.00;
        try {
            const stored = localStorage.getItem('moffi_fiat_balance');
            if (stored !== null) currentBalance = parseFloat(stored);
        } catch (e) {}

        // Deduct B2C Balance
        const nextBalance = currentBalance - price;
        localStorage.setItem('moffi_fiat_balance', nextBalance.toFixed(2));

        // Record Blocked Transaction
        try {
            const storedTx = localStorage.getItem('moffi_fiat_transactions');
            const transactionsList = storedTx ? JSON.parse(storedTx) : [];
            const newTx = {
                id: 'tx_' + Date.now(),
                title: `Randevu Bloke Tutarı`,
                category: 'health',
                amount: price,
                date: new Date().toISOString().split('T')[0],
                merchant: tempAppointmentData.clinic.name,
                status: 'blocked',
                icon: '💉'
            };
            transactionsList.unshift(newTx);
            localStorage.setItem('moffi_fiat_transactions', JSON.stringify(transactionsList));
        } catch (e) {}

        // Book the actual appointment with payment details
        const paymentDetails = {
            paymentId: 'pay_' + Date.now(),
            paymentAmount: price,
            paymentStatus: 'pre_authorized'
        };

        await bookAppointment(
            tempAppointmentData.clinic,
            tempAppointmentData.date,
            tempAppointmentData.time,
            tempAppointmentData.type,
            tempAppointmentData.sharedPassport,
            tempAppointmentData.petInfo,
            paymentDetails
        );

        // Record Transparency Log
        try {
            const storedLogs = localStorage.getItem('moffi_transparency_logs');
            const logsList = storedLogs ? JSON.parse(storedLogs) : [];
            const newLog = {
                id: 'log_' + Date.now(),
                clinicName: tempAppointmentData.clinic.name,
                petName: activePet ? activePet.name : 'Evcil Hayvan',
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

        setSuccessMessage("Ödeme Başarılı & Randevu Oluşturuldu ✨");
        setActiveModal('success');
        setDetailClinicId(null);
        setTimeout(() => setActiveModal(null), 3000);
    };

    const handleOtpSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otpCode.length < 6) {
            setOtpError("Lütfen 6 haneli doğrulama kodunu girin.");
            return;
        }

        setIsOtpProcessing(true);
        setOtpError("");

        // Simulate OTP verification check
        await new Promise(resolve => setTimeout(resolve, 1500));

        const isNumeric = /^\d+$/.test(otpCode);
        if (!isNumeric) {
            setOtpError("Doğrulama kodu sadece rakamlardan oluşmalıdır.");
            setIsOtpProcessing(false);
            return;
        }

        try {
            await completeAppointmentBooking();
            setShowOtpModal(false);
        } catch (error) {
            setOtpError("Ödeme doğrulanamadı. Lütfen tekrar deneyin.");
        } finally {
            setIsOtpProcessing(false);
        }
    };

    const confirmAppointment = async () => {
        if (!tempAppointmentData) return;
        setIsPaymentProcessing(true);
        setPaymentError("");

        const cleanCard = cardNumber.replace(/\s+/g, "");

        // PayTR/Stripe validation simulation
        if (cleanCard.length < 16) {
            setPaymentError("Lütfen 16 haneli kart numaranızı eksiksiz girin.");
            setIsPaymentProcessing(false);
            return;
        }

        if (!validateLuhn(cleanCard)) {
            setPaymentError("Ödeme Başarısız: Kart numarası geçersiz (Luhn Kontrolü Başarısız).");
            setIsPaymentProcessing(false);
            return;
        }

        if (!cardholderName.trim()) {
            setPaymentError("Lütfen kart sahibinin adını girin.");
            setIsPaymentProcessing(false);
            return;
        }

        if (cardExpiry.length < 5) {
            setPaymentError("Son kullanma tarihi geçersiz (AA/YY).");
            setIsPaymentProcessing(false);
            return;
        }

        if (cardCvc.length < 3) {
            setPaymentError("CVC kodu geçersiz.");
            setIsPaymentProcessing(false);
            return;
        }

        // Test credit cards handling
        if (cleanCard.endsWith("9999") || cleanCard === "4312431243124312") {
            setPaymentError("Ödeme Başarısız: Yetersiz Limit (PayTR Hata Kodu: 104).");
            setIsPaymentProcessing(false);
            return;
        }

        if (cleanCard.endsWith("1111") || cleanCard === "4111111111111111") {
            setPaymentError("Ödeme Başarısız: Kart Geçersiz / Blokeli (Stripe Hata Kodu: card_declined).");
            setIsPaymentProcessing(false);
            return;
        }

        if (!cleanCard.startsWith("4242") && !cleanCard.startsWith("4")) {
            setPaymentError("Geçersiz Test Kartı. Lütfen test kartı kullanın (Örn: 4242...).");
            setIsPaymentProcessing(false);
            return;
        }

        // B2C Wallet balance deduction check
        const price = tempAppointmentData.clinic.price || 350;
        let currentBalance = 12450.00;
        try {
            const stored = localStorage.getItem('moffi_fiat_balance');
            if (stored !== null) currentBalance = parseFloat(stored);
        } catch (e) {}

        if (currentBalance < price) {
            setPaymentError(`Ödeme Başarısız: Cüzdan bakiyeniz yetersiz (Gerekli: ₺${price}, Mevcut: ₺${currentBalance}).`);
            setIsPaymentProcessing(false);
            return;
        }

        // Processing payment simulation delay (connecting to PayTR)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Call the simulated PayTR Token API to establish connection and get mock session
        try {
            console.log("Simulating PayTR Token API call...");
            const response = await fetch('/api/paytr/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price,
                    email: user?.email || 'customer@moffipet.com',
                    address: {
                        name: cardholderName.split(" ")[0] || "Pati",
                        surname: cardholderName.split(" ").slice(1).join(" ") || "Sahibi",
                        phone: "05555555555",
                        detail: "Moffi Mobil Ödeme"
                    },
                    items: [
                        { productId: tempAppointmentData.clinic.id, quantity: 1, price: price, name: `${tempAppointmentData.clinic.name} Muayene` }
                    ],
                    userId: user?.id || 'guest'
                })
            });
            const paytrResult = await response.json();
            console.log("Simulated PayTR Token Response:", paytrResult);
        } catch (e) {
            console.warn("PayTR API call failed or bypassed in simulation:", e);
        }

        setIsPaymentProcessing(false);
        setOtpCode("");
        setOtpError("");
        setShowOtpModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] via-[#f1f3f7] to-[#f8f9fc] dark:from-[#09090b] dark:via-[#0d0d11] dark:to-[#09090b] pb-32 font-sans relative text-zinc-800 dark:text-[#fafafa] selection:bg-emerald-500/30 transition-colors duration-300">
            {/* Minimal solid design - no cheap floating background blobs */}

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#f8f9fc]/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-200 dark:border-[#27272a] pb-4 transition-colors duration-300">
                <div className="px-6 pt-8 pb-2 flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    if (window.history.length > 2) {
                                        router.back();
                                    } else {
                                        router.push('/community');
                                    }
                                }} 
                                className="w-10 h-10 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-[#27272a] hover:scale-105 active:scale-95 transition-all text-zinc-700 dark:text-[#fafafa]/80"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em] block mb-0.5">Moffi Health</span>
                                <h1 className="text-2xl font-black text-zinc-800 dark:text-[#fafafa] tracking-tighter leading-none uppercase italic">
                                    Veterinerlik Portalı
                                </h1>
                            </div>
                        </div>
                        <div className="scale-90 origin-right">
                            <PetSwitcher />
                        </div>
                    </div>

                    {/* Minimalist Medical Search Input */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-[#a1a1aa]" />
                        <input
                            type="text"
                            placeholder="Klinik, veteriner veya uzmanlık alanı ara..."
                            className="w-full h-12 pl-11 pr-4 bg-white dark:bg-[#18181b] rounded-xl border border-zinc-250 dark:border-[#27272a] outline-none font-bold text-xs text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/20 focus:border-emerald-500 transition-all text-left shadow-sm dark:shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Clean Category Tags */}
                    <div 
                        ref={categoryScroll.ref}
                        onMouseDown={categoryScroll.onMouseDown}
                        onMouseLeave={categoryScroll.onMouseLeave}
                        onMouseUp={categoryScroll.onMouseUp}
                        onMouseMove={categoryScroll.onMouseMove}
                        className="flex gap-2 overflow-x-auto no-scrollbar pb-1 momentum-scroll overscroll-contain cursor-grab active:cursor-grabbing select-none"
                    >
                        {[
                            { id: 'all', label: 'Tüm Klinikler', icon: '🏥' },
                            { id: 'clinic', label: 'Hastaneler', icon: '🛡️' },
                            { id: 'food', label: 'Medikal Diyet', icon: '🍖' },
                            { id: 'care', label: 'Sağlık & Eczane', icon: '💊' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => searchByService(cat.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg border flex items-center gap-1.5 whitespace-nowrap transition-all font-bold text-[10px] uppercase tracking-wider shrink-0",
                                    activeCategory === cat.id 
                                        ? "bg-emerald-500 text-black border-emerald-500 font-black shadow-lg shadow-emerald-500/10" 
                                        : "bg-white dark:bg-[#18181b] text-zinc-500 dark:text-[#a1a1aa] border-zinc-200 dark:border-[#27272a] hover:border-zinc-350 dark:hover:border-[#3f3f46] hover:text-zinc-850 dark:hover:text-[#fafafa]"
                                )}
                            >
                                <span className="text-xs">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">

                {/* Status Bar showing pet health state */}
                {activePet && (
                    <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] p-4 rounded-2xl flex items-center justify-between text-left shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-widest block">Aktif Pet Durumu</span>
                                <h4 className="text-xs font-black text-zinc-800 dark:text-[#fafafa] mt-0.5">{activePet.name} • Sağlıklı ve Takipte</h4>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsLogModalOpen(true)}
                                className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-200/50 dark:hover:bg-[#27272a] text-zinc-650 dark:text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all text-[8px] font-black uppercase tracking-wider cursor-pointer"
                            >
                                <History className="w-3.5 h-3.5 text-emerald-500" /> Paylaşım Logları
                            </button>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                )}



                {/* Solid Map Box */}
                <section className="relative w-full h-52 rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#27272a] shadow-xl bg-white dark:bg-[#121215] transition-colors duration-300">
                    {userLocation ? (
                        <MapboxLiveMap
                            userPos={userLocation}
                            visitedPlaceIds={allClinics.map(c => c.id)}
                            path={[]}
                            isTracking={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-white dark:bg-[#121215] flex items-center justify-center text-zinc-400 dark:text-[#a1a1aa] text-[10px] font-black uppercase tracking-widest">Harita Hazırlanıyor...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 dark:from-[#09090b] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                        <div>
                            <div className="font-black text-sm text-zinc-800 dark:text-[#fafafa] flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> {allClinics.length} Yakın Klinik
                            </div>
                            <div className="text-[8px] text-zinc-500 dark:text-[#fafafa]/40 font-bold uppercase tracking-wider mt-0.5">Bulunduğunuz Konum Civarı</div>
                        </div>
                        <button 
                            onClick={() => setIsExplorerOpen(true)}
                            className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-[9px] font-black pointer-events-auto hover:bg-emerald-400 transition-all shadow-md uppercase tracking-wider"
                        >
                            Haritada Keşfet
                        </button>
                    </div>
                </section>

                {/* Clinics Section */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div>
                            <h2 className="text-sm font-black text-zinc-800 dark:text-[#fafafa] tracking-wider uppercase italic leading-none">Çevredeki Klinikler</h2>
                            <p className="text-[8px] text-zinc-400 dark:text-[#a1a1aa] font-bold uppercase tracking-wider mt-1">Öne Çıkan Sağlık Merkezleri</p>
                        </div>
                        <button className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] px-3.5 py-1.5 rounded-lg text-[8px] font-black text-zinc-500 dark:text-[#a1a1aa] flex items-center gap-1 hover:text-zinc-800 dark:hover:text-[#fafafa] transition-all">
                            <Filter className="w-3 h-3" /> FİLTRELE
                        </button>
                    </div>

                    <div className="space-y-4">
                        {featuredClinics.map((clinic, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -3, scale: 1.01 }}
                                key={clinic.id || `clinic-${index}`}
                                className={cn(
                                    "bg-gradient-to-br from-white to-zinc-50/55 dark:from-[#121215] dark:to-[#16161b] rounded-2xl p-4 border transition-all duration-300 group relative overflow-hidden text-left",
                                    clinic.isPremium 
                                        ? "border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.04)]" 
                                        : "border-zinc-200 dark:border-[#27272a]/60 hover:border-zinc-350 dark:hover:border-zinc-700 shadow-sm dark:shadow-none"
                                )}
                            >
                                {clinic.isPremium && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-500 to-teal-500" />
                                )}

                                <div className="flex gap-4">
                                    {/* Small cover image for clinical listing */}
                                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-[#27272a]/60 shrink-0 cursor-pointer relative group-hover:border-emerald-500/30 transition-all duration-300" onClick={() => setDetailClinicId(clinic.id)}>
                                        <img src={clinic.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/10 dark:bg-black/15 group-hover:bg-black/5 transition-colors" />
                                    </div>

                                    {/* Clinic Details */}
                                    <div className="flex-1 flex flex-col justify-between text-left">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black text-zinc-800 dark:text-[#fafafa] text-sm tracking-tight leading-none group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">{clinic.name}</h3>
                                                <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-full text-yellow-500">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-[9px] font-black">{clinic.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-zinc-500 dark:text-[#a1a1aa] text-[9px] font-bold mt-1.5 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-[#a1a1aa]" /> {clinic.distance} • Kadıköy, İstanbul
                                            </p>
                                            <div className="flex gap-1 mt-2">
                                                {(clinic.features || []).slice(0, 2).map((f: string) => (
                                                    <span key={f} className="text-[7.5px] font-bold bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-[#a1a1aa] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#27272a] uppercase">{f}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 mt-2">
                                            <button 
                                                onClick={() => setDetailClinicId(clinic.id)}
                                                className="text-[8px] font-black text-zinc-400 dark:text-[#a1a1aa] hover:text-zinc-850 dark:hover:text-[#fafafa] uppercase tracking-wider transition-colors duration-300"
                                            >
                                                Detayları Gör
                                            </button>
                                            <button
                                                onClick={() => openAppointment(clinic)}
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md active:scale-95 duration-200"
                                            >
                                                Randevu Seç
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            {/* --- MODALS & DRAWERS --- */}
            <AnimatePresence>
                {/* 1. APPOINTMENT SLOTS MODAL */}
                {activeModal === 'appointment' && selectedClinic && (
                    <motion.div key="appointment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[140] bg-black/50 dark:bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-gradient-to-b from-white to-zinc-50 dark:from-[#0b0c0f] dark:to-[#121318] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden h-[85vh] flex flex-col border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#fafafa] relative border-t border-t-emerald-500/20">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-200 dark:bg-[#27272a] rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-6 mt-2 sm:mt-0">
                                <h2 className="text-lg font-black tracking-tight uppercase">Randevu Oluştur</h2>
                                <button onClick={() => setActiveModal(null)} className="w-8 h-8 bg-zinc-105 dark:bg-[#18181b] rounded-full flex items-center justify-center border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-150 dark:hover:bg-[#27272a] text-zinc-700 dark:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            {/* SCROLLABLE BODY CONTAINER */}
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6 text-left momentum-scroll overscroll-contain pb-6">
                                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-[#18181b] rounded-2xl border border-zinc-200 dark:border-[#27272a] relative overflow-hidden pl-5 border-l-2 border-l-emerald-500">
                                    <img src={selectedClinic.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-[#27272a]" />
                                    <div className="text-left">
                                        <div className="font-black text-sm text-zinc-850 dark:text-[#fafafa] leading-snug mb-0.5">{selectedClinic.name}</div>
                                        <div className="text-[9px] text-zinc-400 dark:text-[#a1a1aa] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {selectedClinic.distance} mesafede
                                        </div>
                                    </div>
                                </div>

                                {/* DATE SELECTOR */}
                                <div>
                                    <label className="text-[8px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-2 block px-1">Tarih Seçimi</label>
                                    <div 
                                        ref={dateScroll.ref}
                                        onMouseDown={dateScroll.onMouseDown}
                                        onMouseLeave={dateScroll.onMouseLeave}
                                        onMouseUp={dateScroll.onMouseUp}
                                        onMouseMove={dateScroll.onMouseMove}
                                        className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1 snap-x momentum-scroll overscroll-contain cursor-grab active:cursor-grabbing select-none"
                                    >
                                        {dateOptions.map((day) => (
                                            <button
                                                key={day.key}
                                                onClick={() => { setSelectedDate(day.key); setSelectedTime(null); }}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl min-w-[85px] text-center border transition-all flex flex-col items-center snap-start shrink-0",
                                                    selectedDate === day.key 
                                                        ? "bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/10 font-black" 
                                                        : "border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#18181b] text-zinc-500 dark:text-[#a1a1aa] hover:border-zinc-350 dark:hover:border-[#3f3f46] hover:text-zinc-850 dark:hover:text-[#fafafa]"
                                                )}
                                            >
                                                <div className="text-[8px] font-bold uppercase tracking-wider mb-0.5">{day.dayName}</div>
                                                <div className="text-xs font-black">{day.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* TIME SELECTOR */}
                                <div className="mb-6 text-left">
                                    <label className="text-[8px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-3 block px-1">Saat Seçimi</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => {
                                                    console.log("Selected time clicked:", time);
                                                    setSelectedTime(time);
                                                }}
                                                className={cn(
                                                    "py-2.5 text-xs font-bold rounded-lg border transition-all text-center",
                                                    selectedTime === time 
                                                        ? "bg-emerald-500 text-black border-emerald-500 font-black" 
                                                        : "border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#18181b] text-zinc-500 dark:text-[#a1a1aa] hover:border-zinc-350 dark:hover:border-[#3f3f46] hover:text-zinc-800 dark:hover:text-[#fafafa]"
                                                )}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* DATA SHARING CONSENT PANEL */}
                                <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]/80 rounded-2xl p-4 text-left">
                                    <div className="text-[8px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                                        <Syringe className="w-3.5 h-3.5 text-emerald-500" /> TIBBİ VERİ PAYLAŞIM TERCİHLERİ
                                    </div>
                                    
                                    <div className="space-y-2.5">
                                        {/* Basic Info (Always Checked / Disabled) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/50 dark:bg-[#121215]/50 border border-zinc-200/50 dark:border-[#27272a]/40 opacity-70 cursor-not-allowed select-none transition-all">
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-[#fafafa] flex items-center gap-1.5">
                                                    Temel Bilgiler <span className="text-[7px] text-emerald-400 font-black uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">ZORUNLU</span>
                                                </span>
                                                <p className="text-[9px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5 font-semibold">İsim, Tür, Irk, Yaş ve Kilo verileri.</p>
                                            </div>
                                            <div className="w-9 h-5 rounded-full p-0.5 bg-emerald-500/30 flex items-center">
                                                <div className="bg-zinc-100 dark:bg-black/60 w-4 h-4 rounded-full translate-x-4" />
                                            </div>
                                        </div>

                                        {/* Vaccine History (Optional toggle switch) */}
                                        <div 
                                            onClick={() => handlePreferenceChange('vaccines', !shareVaccines)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-350 dark:hover:border-[#3f3f46] cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-[#fafafa]">Aşı Takvimi Geçmişi</span>
                                                <p className="text-[9px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5 font-semibold">Son 1 yılda uygulanan aşılar ve takvim planı.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareVaccines ? "bg-emerald-500" : "bg-zinc-250 dark:bg-[#27272a]"
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
                                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-350 dark:hover:border-[#3f3f46] cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-[#fafafa]">Sağlık Notları & Alerjiler</span>
                                                <p className="text-[9px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5 font-semibold">Alerji geçmişi, hassasiyetler ve hekime özel notlar.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareNotes ? "bg-emerald-500" : "bg-zinc-250 dark:bg-[#27272a]"
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
                                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-350 dark:hover:border-[#3f3f46] cursor-pointer transition-all duration-200 select-none active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-[#fafafa]">Sahip Bilgileri</span>
                                                <p className="text-[9px] text-zinc-550 dark:text-[#a1a1aa] mt-0.5 font-semibold">Telefon ve e-posta hızlı iletişim için.</p>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-250 flex items-center",
                                                shareOwner ? "bg-emerald-500" : "bg-zinc-250 dark:bg-[#27272a]"
                                            )}>
                                                <div className={cn(
                                                    "bg-white dark:bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-250",
                                                    shareOwner ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FIXED FOOTER CONTROLS */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-[#27272a]/80 mt-auto bg-white dark:bg-[#121318]">
                                <button
                                    onClick={handleProceedToPayment}
                                    disabled={!selectedTime}
                                    className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 disabled:opacity-20 transition-all active:scale-95"
                                >
                                    Ödeme Aşamasına Geç
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* STRIPE/PAYTR SECURE PAYMENT MODAL */}
                {activeModal === 'payment' && tempAppointmentData && (
                    <motion.div key="payment-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-gradient-to-b from-white to-zinc-50 dark:from-[#0b0c0f] dark:to-[#121318] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden h-[85vh] flex flex-col border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#fafafa] relative border-t border-t-emerald-500/20">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-200 dark:bg-[#27272a] rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-5 mt-2 sm:mt-0">
                                <div className="text-left">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">PayTR / Stripe Secure</span>
                                    <h2 className="text-lg font-black tracking-tight uppercase">Güvenli Ödeme</h2>
                                </div>
                                <button onClick={() => setActiveModal('appointment')} className="w-8 h-8 bg-zinc-100 dark:bg-[#18181b] rounded-full flex items-center justify-center border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-150 dark:hover:bg-[#27272a] text-zinc-700 dark:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                            </div>

                            {/* SCROLLABLE BODY CONTAINER */}
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6 text-left momentum-scroll overscroll-contain pb-6">
                                {/* Payment Summary */}
                                <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-4 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-zinc-500 dark:text-[#a1a1aa]">Randevu Hizmeti</span>
                                        <span className="text-xs font-black">{tempAppointmentData.clinic.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-zinc-500 dark:text-[#a1a1aa]">Tarih / Saat</span>
                                        <span className="text-xs font-bold">{tempAppointmentData.date} • {tempAppointmentData.time}</span>
                                    </div>
                                    <div className="border-t border-zinc-200 dark:border-[#27272a] pt-2 mt-2 flex justify-between items-center">
                                        <span className="text-xs font-black text-zinc-700 dark:text-[#fafafa]">Ödenecek Tutar</span>
                                        <span className="text-lg font-black text-emerald-500 dark:text-emerald-400">₺{tempAppointmentData.clinic.price || 350}</span>
                                    </div>
                                </div>

                                {/* Credit Card Simulation Preview */}
                                <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-zinc-800 to-black p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden select-none shrink-0">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                                    <div className="flex justify-between items-start z-10">
                                        <div className="font-mono text-xs font-bold tracking-widest">TEST CARD</div>
                                        <div className="w-12 h-6 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded border border-white/10 px-1">
                                            {cardNumber.startsWith("4") ? (
                                                <svg className="w-8 h-3 text-cyan-400" viewBox="0 0 24 8" fill="currentColor">
                                                    <path d="M2.38 0h1.59l-2.5 7.96H0L2.38 0zm6.81.02a3.87 3.87 0 00-1.42.27l-.29-1.37a5.53 5.53 0 012.06-.38c1.98 0 3.37.97 3.37 2.65 0 2.27-3.13 2.39-3.13 3.42 0 .31.29.6 1.02.6a3.52 3.52 0 001.6-.37l.29 1.4a5.05 5.05 0 01-2.15.42c-2.02 0-3.41-.98-3.41-2.65 0-2.28 3.16-2.45 3.16-3.45 0-.32-.3-.59-.97-.59zm6.65 5.4l.79-2.19.46 2.19h-1.25zm2.14-5.42h1.49l-1.43 7.96h-1.5l-.26-1.25h-2.1l-.49 1.25h-1.63L17.98.02z" />
                                                </svg>
                                            ) : cardNumber.startsWith("5") ? (
                                                <div className="flex -space-x-1.5 items-center">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
                                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-90" />
                                                </div>
                                            ) : (
                                                <span className="font-black text-zinc-400 text-[8px] uppercase tracking-wider">CARD</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-mono text-lg font-bold tracking-[0.15em] text-center z-10 py-2">
                                        {cardNumber ? (
                                            cardNumber.padEnd(19, "•").replace(/(.{4})/g, "$1 ").trim()
                                        ) : (
                                            "•••• •••• •••• ••••"
                                        )}
                                    </div>
                                    <div className="flex justify-between items-end z-10">
                                        <div>
                                            <div className="text-[7px] text-zinc-400 font-bold uppercase">Kart Sahibi</div>
                                            <div className="font-mono text-xs font-bold tracking-wide truncate max-w-[150px]">
                                                {cardholderName ? cardholderName.toUpperCase() : "AD SOYAD"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[7px] text-zinc-400 font-bold uppercase">SKT</div>
                                            <div className="font-mono text-xs font-bold">{cardExpiry || "AA/YY"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Input Fields */}
                                <div className="space-y-3.5 text-left">
                                    <div>
                                        <label className="text-[9px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-1 block">Kart Sahibi</label>
                                        <input
                                            type="text"
                                            placeholder="Ad Soyad"
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a] outline-none font-bold text-xs text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/10 focus:border-emerald-500 transition-all"
                                            value={cardholderName}
                                            onChange={(e) => setCardholderName(e.target.value)}
                                            disabled={isPaymentProcessing}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-1 block">Kart Numarası</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                maxLength={19}
                                                placeholder="4242 4242 4242 4242"
                                                className={cn(
                                                    "w-full h-11 pl-4 pr-12 bg-zinc-50 dark:bg-[#18181b] rounded-xl border outline-none font-mono font-bold text-xs text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/10 transition-all",
                                                    isLuhnInvalid
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-zinc-200 dark:border-[#27272a] focus:border-emerald-500"
                                                )}
                                                value={cardNumber}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    const formatted = val.replace(/(.{4})/g, "$1 ").trim();
                                                    setCardNumber(formatted);
                                                }}
                                                disabled={isPaymentProcessing}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                        </div>
                                        {isLuhnInvalid && (
                                            <span className="text-[10px] text-red-500 font-bold mt-1 block">
                                                Geçersiz kart numarası (Luhn kontrolü başarısız).
                                            </span>
                                        )}
                                        <span className="text-[8px] text-zinc-400 mt-1 block">Test: 4242... (Başarılı) | ...9999 (Limit Hatası) | ...1111 (Bloke Hatası)</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-1 block">Son Kullanma (AA/YY)</label>
                                            <input
                                                type="text"
                                                maxLength={5}
                                                placeholder="MM/YY"
                                                className={cn(
                                                    "w-full h-11 px-4 bg-zinc-50 dark:bg-[#18181b] rounded-xl border outline-none font-mono font-bold text-xs text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/10 transition-all text-center",
                                                    isExpiryInvalid
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-zinc-200 dark:border-[#27272a] focus:border-emerald-500"
                                                )}
                                                value={cardExpiry}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, "");
                                                    if (val.length > 2) {
                                                        val = val.substring(0, 2) + "/" + val.substring(2, 4);
                                                    }
                                                    setCardExpiry(val);
                                                }}
                                                disabled={isPaymentProcessing}
                                            />
                                            {isExpiryInvalid && (
                                                <span className="text-[9px] text-red-500 font-bold mt-1 block text-center">
                                                    Geçmiş tarih veya geçersiz format.
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-1 block">Güvenlik Kodu (CVC)</label>
                                            <input
                                                type="text"
                                                maxLength={3}
                                                placeholder="123"
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a] outline-none font-mono font-bold text-xs text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/10 focus:border-emerald-500 transition-all text-center"
                                                value={cardCvc}
                                                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                                                disabled={isPaymentProcessing}
                                            />
                                        </div>
                                    </div>

                                    {paymentError && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3.5 text-[11px] font-bold mt-2 leading-relaxed flex items-start gap-2">
                                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{paymentError}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FIXED FOOTER CONTROLS */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-[#27272a]/80 mt-auto bg-white dark:bg-[#121318]">
                                <button
                                    onClick={confirmAppointment}
                                    disabled={isPaymentProcessing || !cardholderName || !cardNumber || !cardExpiry || !cardCvc || isLuhnInvalid || isExpiryInvalid}
                                    className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isPaymentProcessing ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            <span>Ödeme İşleniyor...</span>
                                        </>
                                    ) : (
                                        <span>Ödemeyi Tamamla ve Bloke Et</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showOtpModal && tempAppointmentData && (
                    <motion.div key="otp-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/75 dark:bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
                        <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} className="w-full max-w-sm bg-gradient-to-b from-white to-zinc-50 dark:from-[#0b0c0f] dark:to-[#121318] rounded-[2rem] p-6 shadow-2xl border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#fafafa] relative text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                                </div>
                                <h3 className="font-black text-base uppercase tracking-tight mb-1">PayTR 3D Secure</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-4">Ödeme Doğrulama</p>
                                
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                                    Moffi Mobil Ödemeler için <b>{tempAppointmentData.clinic.name}</b> işlem tutarı <b>₺{tempAppointmentData.clinic.price || 350}</b> doğrulanacaktır. Lütfen cep telefonunuza gönderilen 6 haneli şifreyi girin.
                                    <br />
                                    <span className="text-[9px] text-zinc-400 mt-1 block">(Test Kodu: <b>123456</b>)</span>
                                </p>

                                <form onSubmit={handleOtpSubmit} className="w-full space-y-4">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="******"
                                        className="w-full h-12 text-center text-xl font-mono font-black tracking-[0.4em] bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a] outline-none focus:border-amber-500 transition-all text-zinc-800 dark:text-white"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        disabled={isOtpProcessing}
                                    />

                                    {otpError && (
                                        <p className="text-[10px] text-red-500 font-bold text-center">{otpError}</p>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowOtpModal(false); setIsPaymentProcessing(false); }}
                                            className="flex-1 py-3.5 bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-[#27272a] rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-zinc-700 dark:text-white"
                                            disabled={isOtpProcessing}
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3.5 bg-amber-500 text-black rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5"
                                            disabled={isOtpProcessing || otpCode.length < 6}
                                        >
                                            {isOtpProcessing ? (
                                                <>
                                                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                    <span>Onaylanıyor...</span>
                                                </>
                                            ) : (
                                                <span>Onayla</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. REVIEWS / RATING MODAL */}
                {activeModal === 'rating' && (
                    <motion.div key="rating-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[140] bg-black/50 dark:bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-[#fafafa] relative">
                            <div className="flex flex-col items-center text-center p-4">
                                <h3 className="font-black text-lg uppercase tracking-tight mb-2 text-zinc-800 dark:text-white">Klinik Değerlendir</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider mb-6">Deneyiminizi diğer pati sahipleriyle paylaşın</p>

                                <div className="flex gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            onClick={() => setUserRating(star)}
                                            className="transition-all active:scale-90"
                                        >
                                            <Star className={cn("w-8 h-8 transition-colors", userRating >= star ? "text-yellow-500 fill-current" : "text-zinc-200 dark:text-[#27272a]")} />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Görüşleriniz..."
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-4 text-xs font-bold text-zinc-800 dark:text-[#fafafa] placeholder:text-zinc-400 dark:placeholder:text-[#fafafa]/10 outline-none focus:border-yellow-500 transition-all resize-none h-24 mb-6"
                                />

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => { setSuccessMessage("Değerlendirildi ✨"); setActiveModal('success'); setTimeout(() => setActiveModal(null), 2000); }}
                                        disabled={userRating === 0}
                                        className="w-full bg-zinc-800 dark:bg-[#fafafa] text-white dark:text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-20 transition-all active:scale-95 duration-200"
                                    >
                                        Gönder ve Kapat
                                    </button>
                                    <button onClick={() => setActiveModal(null)} className="text-[9px] font-black text-zinc-400 dark:text-[#a1a1aa] hover:text-zinc-800 dark:hover:text-white uppercase tracking-wider py-2">İptal</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* MODALS RENDERING */}
                <VaccineModal isOpen={activeModal === 'vaccine'} onClose={() => setActiveModal(null)} />
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
                        <div className="bg-white dark:bg-[#121215] text-zinc-850 dark:text-[#fafafa] px-6 py-3 rounded-full shadow-2xl font-black text-xs flex items-center gap-2 border border-zinc-200 dark:border-emerald-500/30 transition-colors duration-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> {successMessage}
                        </div>
                    </motion.div>
                )}

                {/* 4. CLINIC EXPLORER OVERLAY */}
                {isExplorerOpen && (
                    <motion.div 
                        key="explorer-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-zinc-50 dark:bg-black"
                    >
                        <div className="absolute inset-0">
                            {userLocation && (
                                <MapboxLiveMap
                                    userPos={userLocation}
                                    visitedPlaceIds={[]}
                                    path={[]}
                                    isTracking={true}
                                    onPlaceClick={(place: any) => setDetailClinicId(place.id)}
                                />
                            )}
                        </div>
                        
                        <div className="absolute top-6 left-6 right-6 z-[201] flex justify-between items-center pointer-events-none">
                            <h3 className="bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md px-5 py-3.5 rounded-xl border border-zinc-200 dark:border-[#27272a] text-zinc-850 dark:text-[#fafafa] font-black text-sm uppercase tracking-wider pointer-events-auto shadow-md dark:shadow-none">Klinik Keşfi</h3>
                            <button 
                                onClick={() => setIsExplorerOpen(false)}
                                className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-2xl pointer-events-auto hover:bg-emerald-400 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="absolute bottom-10 inset-x-6 z-[201] pointer-events-none flex justify-center">
                            <div className="bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md px-6 py-4 rounded-xl border border-zinc-200 dark:border-[#27272a] text-zinc-850 dark:text-[#fafafa] text-[9px] font-black uppercase tracking-widest pointer-events-auto shadow-2xl">
                                Haritadaki pinlere dokunarak detayları gör
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* TRANSPARENCY LOGS MODAL */}
                {isLogModalOpen && (
                    <motion.div key="log-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/60 dark:bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 220 }} className="w-full max-w-md bg-gradient-to-b from-white to-zinc-50 dark:from-[#0b0c0f] dark:to-[#121318] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden h-[70vh] flex flex-col border border-zinc-200 dark:border-[#27272a] text-zinc-850 dark:text-[#fafafa] relative border-t border-t-emerald-500/20">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-200 dark:bg-[#27272a] rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-5 mt-2 sm:mt-0">
                                <div className="text-left">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">Şeffaf Paylaşım Günlüğü</span>
                                    <h2 className="text-lg font-black tracking-tight uppercase">Veri Paylaşım Geçmişi</h2>
                                </div>
                                <button onClick={() => setIsLogModalOpen(false)} className="w-8 h-8 bg-zinc-100 dark:bg-[#18181b] rounded-full flex items-center justify-center border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-150 dark:hover:bg-[#27272a] text-zinc-700 dark:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>

                            {/* LOGS LIST */}
                            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4 text-left momentum-scroll overscroll-contain pb-6">
                                {transparencyLogs.length > 0 ? (
                                    transparencyLogs.map((log) => (
                                        <div key={log.id} className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-4 text-left space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-black text-zinc-800 dark:text-[#fafafa] uppercase">{log.clinicName}</h4>
                                                <span className="text-[9px] text-zinc-400 font-bold">{log.date}</span>
                                            </div>
                                            <p className="text-[10.5px] text-zinc-600 dark:text-[#a1a1aa] font-medium leading-relaxed">
                                                Hekim, <strong>{log.petName}</strong> isimli evcil hayvanınızın şu paylaşılan verilerine erişim sağladı:
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {log.sharedFields.map((field: string) => (
                                                    <span key={field} className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                                        {field}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
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
                    key="clinic-detail-drawer"
                    clinicId={detailClinicId} 
                    onClose={() => setDetailClinicId(null)}
                    onBookAppointment={(clinic) => {
                        openAppointment(clinic);
                    }}
                />

                {/* 6. MEDICATION & NUTRITION MODALS */}
                <MedicationModal 
                    isOpen={activeMedicationModal} 
                    onClose={() => setActiveMedicationModal(false)} 
                    petId={activePet?.id || ''} 
                />
                <NutritionModal 
                    isOpen={activeNutritionModal} 
                    onClose={() => setActiveNutritionModal(false)} 
                    petId={activePet?.id || ''} 
                />

                {/* Floating Vet-Line Support Button */}
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => alert("Canlı VetLine desteği başlatılıyor...")}
                    className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/20 active:scale-95 transition-all cursor-pointer"
                    title="7/24 Canlı Veteriner Desteği"
                >
                    <PhoneCall className="w-5 h-5 animate-pulse" />
                </motion.button>
        </div>
    );
}
