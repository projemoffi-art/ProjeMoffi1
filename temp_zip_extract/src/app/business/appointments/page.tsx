"use client";

import { useState, useEffect } from "react";
import {
    CalendarCheck, CheckCircle2,
    User, Bell, X, Syringe, ClipboardList, Pill, AlertTriangle,
    Clock, Coffee, Save, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessSidebar as Sidebar } from "@/components/business/Sidebar";
import { usePet } from "@/context/PetContext";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/utils";
import { apiService, isSupabaseEnabled } from "@/services/apiService";

// MOCK APPOINTMENTS (Initial State)
const INITIAL_APPOINTMENTS = [
    { id: 101, petName: "Luna", ownerName: "Ayşe Yılmaz", time: "09:30", type: "Rutin Kontrol", status: "confirmed", image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100", petId: "pet-milo" },
    { id: 102, petName: "Baron", ownerName: "Mehmet Demir", time: "11:00", type: "Aşı (Kuduz)", status: "confirmed", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100", petId: "pet-max" },
];

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

    // Initialize with mock data to avoid hydration mismatch
    const [appointments, setAppointments] = useState<any[]>(INITIAL_APPOINTMENTS);
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
    const [activeTab, setActiveTab] = useState<'appointments' | 'shifts'>('appointments');
    const [workingDays, setWorkingDays] = useState<{ [key: string]: boolean }>({
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: false,
        Sunday: false
    });
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [lunchStart, setLunchStart] = useState("12:00");
    const [lunchEnd, setLunchEnd] = useState("13:00");
    const [slotDuration, setSlotDuration] = useState<number>(30);

    const fetchAppointmentsFromDb = async () => {
        try {
            const list = await apiService.getClinicAppointments('biz_vet1');
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
                    paymentId: item.payment_id,
                    paymentAmount: item.payment_amount,
                    paymentStatus: item.payment_status,
                    clinicId: item.clinic_id,
                    clinicName: item.clinic_name
                };
            });

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
            if (isSupabaseEnabled) {
                try {
                    const settings = await apiService.getClinicSettings('biz_vet1');
                    if (settings) {
                        if (settings.workingDays) setWorkingDays(settings.workingDays);
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
                    if (parsed.workingDays) setWorkingDays(parsed.workingDays);
                    if (parsed.startTime) setStartTime(parsed.startTime);
                    if (parsed.endTime) setEndTime(parsed.endTime);
                    if (parsed.lunchStart) setLunchStart(parsed.lunchStart);
                    if (parsed.lunchEnd) setLunchEnd(parsed.lunchEnd);
                    if (parsed.slotDuration) setSlotDuration(Number(parsed.slotDuration));
                }
            } catch (e) {
                console.error("Failed to load clinic settings:", e);
            }
        };

        loadSettings();
    }, []);

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
                localStorage.setItem('moffi_confirmed_appointments', JSON.stringify(INITIAL_APPOINTMENTS));
                setAppointments(INITIAL_APPOINTMENTS);
            }
        } catch (e) {
            console.error("Storage Load Error:", e);
        }
    }, []);

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
                        : `Randevu Reddedildi! Ücret cüzdana iade edildi. ❌`, 
                    action === 'accept' ? "CheckCircle2" : "XCircle", 
                    action === 'accept' ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                );
                
                // Broadcast event to pati sahibi
                const channel = new BroadcastChannel('moffi_appointments_channel');
                channel.postMessage({ type: 'APPOINTMENT_ACTION', appointmentId: id, action: action, petName: target.petName });
                channel.close();

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
                status: 'confirmed',
                paymentStatus: 'captured'
            };
            const updated = [...appointments, updatedAppt].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
            saveAppointments(updated);

            // Record B2B financial transactions
            try {
                const storedTx = localStorage.getItem('moffi_business_transactions');
                const businessTxs = storedTx ? JSON.parse(storedTx) : [];
                
                const cleanAmount = target.paymentAmount || 350;
                const bizId = target.clinicId || 'biz_vet1';
                
                const saleTx = {
                    id: 'tx_sale_' + Date.now(),
                    businessId: bizId,
                    type: 'sale',
                    amount: cleanAmount,
                    description: `Randevu Onayı #${target.id} (${target.petName})`,
                    date: new Date().toISOString(),
                    status: 'completed'
                };
                
                const commTx = {
                    id: 'tx_comm_' + Date.now(),
                    businessId: bizId,
                    type: 'commission',
                    amount: -cleanAmount * 0.1,
                    description: `Sistem komisyon kesintisi (%10)`,
                    date: new Date().toISOString(),
                    status: 'completed'
                };
                
                businessTxs.push(saleTx, commTx);
                localStorage.setItem('moffi_business_transactions', JSON.stringify(businessTxs));
            } catch (e) {
                console.error("B2B transaction recording failed:", e);
            }

            // Update user transaction status in B2C transactions
            try {
                const storedTxs = localStorage.getItem('moffi_fiat_transactions');
                if (storedTxs !== null) {
                    const list = JSON.parse(storedTxs);
                    // Find blocked transaction and change status to captured
                    const matchedTx = list.find((tx: any) => tx.status === 'blocked');
                    if (matchedTx) {
                        matchedTx.status = 'captured';
                    }
                    localStorage.setItem('moffi_fiat_transactions', JSON.stringify(list));
                }
            } catch (e) {}

            // Replace alert with premium showToast
            showToast(`Randevu Onaylandı! ${target.petName} için bildirim gönderildi. ✨`, "CheckCircle2", "text-emerald-400 font-bold");
            
            // Broadcast event to pati sahibi
            const channel = new BroadcastChannel('moffi_appointments_channel');
            channel.postMessage({ type: 'APPOINTMENT_ACTION', appointmentId: id, action: 'accept', petName: target.petName });
            channel.close();
        } else if (action === 'reject') {
            // Refund B2C User
            try {
                const storedBalance = localStorage.getItem('moffi_fiat_balance');
                const storedTxs = localStorage.getItem('moffi_fiat_transactions');
                const price = target.paymentAmount || 350;
                
                if (storedBalance !== null) {
                    const balanceVal = parseFloat(storedBalance);
                    localStorage.setItem('moffi_fiat_balance', (balanceVal + price).toFixed(2));
                }
                
                if (storedTxs !== null) {
                    const list = JSON.parse(storedTxs);
                    // Find the blocked transaction for this merchant & amount and mark it refunded
                    const matchedTx = list.find((tx: any) => tx.status === 'blocked');
                    if (matchedTx) {
                        matchedTx.status = 'refunded';
                    } else {
                        // Append a new refund transaction if not found
                        list.unshift({
                            id: 'tx_refund_' + Date.now(),
                            title: 'Randevu İade Tutarı',
                            category: 'health',
                            amount: price,
                            date: new Date().toISOString().split('T')[0],
                            merchant: target.clinicName || 'Moda Veteriner Polikliniği',
                            status: 'refunded',
                            icon: '💉'
                        });
                    }
                    localStorage.setItem('moffi_fiat_transactions', JSON.stringify(list));
                }
            } catch (e) {
                console.error("Refund processing failed:", e);
            }
            
            // Replace alert with premium showToast
            showToast(`Randevu Reddedildi! Ücret cüzdana iade edildi. ❌`, "XCircle", "text-red-400 font-bold");
            
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

        const updatedList = appointments.map(apt => apt.id === selectedApt.id ? updatedApt : apt);
        saveAppointments(updatedList);

        // Double-sided Sync: Save to client pet databases (multiple IDs to cover mock variables)
        const targetPetId = selectedApt.petId || 'pet-milo';
        const idsToSync = [targetPetId];
        if (targetPetId === 'pet-milo' || targetPetId === 'pet-1' || targetPetId === '349b89f8-c5e5-46e8-abf7-b2e41b29d39a') {
            idsToSync.push('pet-milo', 'pet-1', '349b89f8-c5e5-46e8-abf7-b2e41b29d39a');
        }

        // Live Supabase Integration (Item 4)
        if (isSupabaseEnabled()) {
            try {
                // 1. Save vaccines
                for (const v of addedVaccines) {
                    await apiService.addPetVaccine(targetPetId, {
                        name: v.name,
                        status: 'completed',
                        dueDate: v.nextDate || new Date().toISOString(),
                        dateAdministered: v.date || new Date().toISOString(),
                        vetName: 'Dr. Moffi (VetLife Clinic)'
                    });
                }
                
                // 2. Save medications
                for (const m of addedMeds) {
                    await apiService.addPetMedication(targetPetId, {
                        name: m.name,
                        dosage: m.dose,
                        instructions: `${m.duration} gün boyunca kullanılacak.`,
                        startDate: new Date().toISOString()
                    });
                }

                // 3. Update appointment status in Supabase database
                await apiService.updateAppointmentStatus(selectedApt.id.toString(), 'completed');
            } catch (e) {
                console.error("Failed to sync consultation details with Supabase:", e);
            }
        }

        if (typeof window !== 'undefined') {
            idsToSync.forEach(pid => {
                // 1. Sync Vaccines to local storage
                try {
                    const saved = localStorage.getItem(`moffi_vaccines_${pid}`);
                    const existingVaccines = saved ? JSON.parse(saved) : [];
                    const newRecords = addedVaccines.map(v => ({
                        id: `custom-${Date.now()}-${Math.random()}`,
                        name: v.name,
                        dateAdministered: v.date,
                        dueDate: v.nextDate,
                        vetName: "Dr. Moffi (VetLife Clinic)",
                        batchNumber: v.batch,
                        status: "completed",
                        createdAt: new Date().toISOString()
                    }));
                    localStorage.setItem(`moffi_vaccines_${pid}`, JSON.stringify([...existingVaccines, ...newRecords]));
                } catch (e) {
                    console.error(`Failed to sync vaccines for ${pid}:`, e);
                }

                // 2. Sync Custom Medical Records to PetContext
                try {
                    const currentRecords = customRecords[pid] || [];
                    const medRecord = {
                        id: `medical-${Date.now()}-${Math.random()}`,
                        name: `Tanı: ${diagnosis}`,
                        dateAdministered: new Date().toISOString().split('T')[0],
                        vetName: "Dr. Moffi (VetLife Clinic)",
                        status: "completed",
                        medications: addedMeds,
                        notes: criticalNotes,
                        createdAt: new Date().toISOString()
                    };
                    setCustomRecords(pid, [...currentRecords, medRecord]);
                } catch (e) {
                    console.error(`Failed to sync custom records for ${pid}:`, e);
                }

                // 3. Update general health notes
                if (criticalNotes) {
                    try {
                        updatePet(pid, { health_notes: criticalNotes });
                    } catch (e) {
                        console.error(`Failed to update health notes for ${pid}:`, e);
                    }
                }
            });
        }

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
        const settings = {
            workingDays,
            startTime,
            endTime,
            lunchStart,
            lunchEnd,
            slotDuration
        };

        if (isSupabaseEnabled) {
            try {
                await apiService.saveClinicSettings('biz_vet1', settings);
            } catch (e) {
                console.error("Failed to save clinic settings to Supabase:", e);
                showToast("Ayarlar veritabanına kaydedilemedi! ❌", "AlertTriangle", "text-red-500 font-bold");
                return;
            }
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_clinic_settings', JSON.stringify(settings));
        }
        showToast("Vardiya ve takvim ayarları başarıyla kaydedildi! 📅✨", "Save", "text-[#6366f1] font-bold");
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FC] dark:bg-[#000000] font-sans">
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
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea86b48e?w=100" className="w-8 h-8 rounded-full object-cover" />
                            <span className="font-bold text-sm">Dr. Moffi</span>
                        </div>
                    </div>
                </header>

                {/* TABS */}
                <div className="flex gap-4 mb-8 border-b border-zinc-200 dark:border-[#27272a] pb-px">
                    <button 
                        onClick={() => setActiveTab('appointments')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === 'appointments' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        Randevu Akışı
                    </button>
                    <button 
                        onClick={() => setActiveTab('shifts')}
                        className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === 'shifts' ? 'border-[#5B4D9D] text-[#5B4D9D]' : 'border-transparent text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                    >
                        Vardiya & Takvim Ayarları
                    </button>
                </div>

                {activeTab === 'appointments' ? (
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
                                <div className="text-white/60 text-xs font-bold uppercase mb-2">Bekleyen Onay</div>
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
                                {appointments.length === 0 && <div className="text-center text-gray-400 py-10">Bugün için planlanmış randevu yok.</div>}
                                {appointments.map((apt) => (
                                    <div key={apt.id} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-card-border dark:hover:border-card-border">
                                        <div className="font-mono font-bold text-gray-400 min-w-[3rem] text-right">{apt.time || "--:--"}</div>
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
                                            className="px-4 py-2 rounded-xl bg-card dark:bg-white/5 border border-card-border text-sm font-bold hover:bg-black hover:text-white dark:hover:bg-indigo-600 transition-colors"
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
                                            <p className="text-gray-400 font-bold text-sm">Bekleyen istek yok</p>
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
                                                         <div className="bg-white/5 border border-indigo-500/10 p-3.5 rounded-2xl mb-4 text-left space-y-2 mt-2">
                                                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Tıbbi Pasaport Önizleme</span>
                                                             {checkAccessGranted(req) ? (
                                                                 <>
                                                                     {req.sharedPassport.basic && (
                                                                         <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                                                                             <span>🐾 <strong>Irk:</strong> {req.sharedPassport.basic.breed}</span>
                                                                             <span>⚖️ <strong>Kilo:</strong> {req.sharedPassport.basic.weight}</span>
                                                                             <span>🎂 <strong>Yaş:</strong> {req.sharedPassport.basic.age || '2.1'}</span>
                                                                         </div>
                                                                     )}
                                                                     {req.sharedPassport.vaccines && req.sharedPassport.vaccines.length > 0 && (
                                                                         <div className="text-[9px] text-gray-500 border-t border-card-border pt-1.5 mt-1">
                                                                             <strong className="text-gray-400">Son Aşılar:</strong> {req.sharedPassport.vaccines.slice(0, 2).map((v: any) => v.definition?.name || v.name || 'Karma Aşı').join(", ")}
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
                ) : (
                    <div className="bg-card dark:bg-[#121212] rounded-[2.5rem] p-8 border border-card-border dark:border-card-border shadow-moffi-card text-left max-w-3xl space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-[#5B4D9D]" /> Vardiya ve Mesai Düzenleme
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Klinik çalışma günlerini ve randevu aralıklarını özelleştirin</p>
                        </div>

                        {/* Working Days Selectors */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ÇALIŞMA GÜNLERİ</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { key: 'Monday', label: 'Pazartesi' },
                                    { key: 'Tuesday', label: 'Salı' },
                                    { key: 'Wednesday', label: 'Çarşamba' },
                                    { key: 'Thursday', label: 'Perşembe' },
                                    { key: 'Friday', label: 'Cuma' },
                                    { key: 'Saturday', label: 'Cumartesi' },
                                    { key: 'Sunday', label: 'Pazar' }
                                ].map((day) => (
                                    <div 
                                        key={day.key}
                                        onClick={() => setWorkingDays(prev => ({ ...prev, [day.key]: !prev[day.key] }))}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                                            workingDays[day.key] 
                                                ? 'bg-[#5B4D9D]/5 border-[#5B4D9D] text-[#5B4D9D] font-bold' 
                                                : 'bg-[#F8F9FC] dark:bg-white/5 border-zinc-200 dark:border-card-border text-gray-400 hover:border-zinc-350 dark:hover:border-[#3f3f46]'
                                        }`}
                                    >
                                        <span className="text-xs">{day.label}</span>
                                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${workingDays[day.key] ? 'bg-[#5B4D9D]' : 'bg-zinc-250 dark:bg-zinc-700'}`}>
                                            <div className={`bg-white dark:bg-black w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${workingDays[day.key] ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hours Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-150 dark:border-white/5">
                            {/* Working Hours */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500" /> MESAI SAATLERI</span>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-500">Başlangıç</label>
                                        <select 
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2.5 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                        >
                                            {['08:00', '08:30', '09:00', '09:30', '10:00'].map(t => <option key={t} value={t} className="bg-card dark:bg-[#121212]">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-500">Bitiş</label>
                                        <select 
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-3 py-2.5 text-xs focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                                        >
                                            {['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(t => <option key={t} value={t} className="bg-card dark:bg-[#121212]">{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Lunch Break Hours */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Coffee className="w-4 h-4 text-orange-500" /> ÖĞLE ARASI SAATLERI</span>
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
                        </div>

                        {/* Slot Duration Select */}
                        <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-white/5 max-w-xs text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">RANDEVU MUAYENE SÜRESI</label>
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

                        {/* Save Button */}
                        <div className="pt-6 border-t border-zinc-150 dark:border-white/5 flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                className="bg-gradient-to-r from-[#5B4D9D] to-[#4E3F8F] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-purple-500/10 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Ayarları Kaydet
                            </button>
                        </div>
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
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Uygulanan Aşılar</span>
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
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Yazılan Reçete</span>
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
