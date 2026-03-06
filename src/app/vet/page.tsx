"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, Phone, Star, Calendar,
    Stethoscope, Clock, ShieldAlert, ChevronRight,
    MessageCircle, HeartPulse, Syringe, Pill,
    Navigation, Coins, CheckCircle2, ChevronLeft,
    AlertTriangle, X, Info, LocateFixed, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VaccineModal } from "@/components/vet/VaccineModal";
import { MoffiAssistant } from "@/components/ai/MoffiAssistant";
import { DentalCareModal } from "@/components/vet/DentalCareModal";
import { PharmacyModal } from "@/components/vet/PharmacyModal";
import { PetSwitcher } from "@/components/common/PetSwitcher";

// Dynamic imports to prevent SSR issues
const LiveMap = dynamic(() => import('@/components/walk/LiveMap'), { ssr: false, loading: () => <div className="h-48 bg-gray-200 animate-pulse rounded-3xl mb-4" /> });

// --- TYPES ---
import { useVet } from "@/hooks/useVet";
import { VetClinic } from "@/types/domain";

const SERVICES = [
    { id: 'exam', label: 'Randevu Al', icon: Calendar, color: 'bg-blue-500', action: 'appointment' },
    { id: 'vaccine', label: 'Aşı Takvimi', icon: Syringe, color: 'bg-green-500', action: 'vaccine' },
    { id: 'dental', label: 'Diş Bakımı', icon: HeartPulse, color: 'bg-pink-500', action: 'dental' },
    { id: 'pharma', label: 'Nöbetçi Eczane', icon: Pill, color: 'bg-purple-500', action: 'pharma' },
];

export default function VetPage() {
    const router = useRouter();

    // CUSTOM HOOK -> BRIDGE TO SERVICE
    const { clinics, userLocation, isLoading, bookAppointment } = useVet();

    // UI STATES
    const [searchQuery, setSearchQuery] = useState("");
    const [activeModal, setActiveModal] = useState<'appointment' | 'vaccine' | 'dental' | 'pharma' | 'sos' | 'success' | null>(null);
    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);

    // APPOINTMENT FORM STATE
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const allTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    // Generate real dates (today + next 4 days)
    const dateOptions = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        return {
            key: d.toISOString().split('T')[0], // YYYY-MM-DD
            label: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            dayName: dayNames[d.getDay()],
        };
    });

    // Filter past time slots if today is selected
    const timeSlots = allTimeSlots.filter(time => {
        if (!selectedDate || selectedDate !== dateOptions[0]?.key) return true;
        const now = new Date();
        const [h, m] = time.split(':').map(Number);
        return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
    });


    const handleServiceClick = (action: string) => {
        if (action === 'vaccine') setActiveModal('vaccine');
        else if (action === 'dental') setActiveModal('dental');
        else if (action === 'pharma') setActiveModal('pharma');
        else if (action === 'appointment') {
            document.getElementById('clinics-list')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const openAppointment = (clinic: VetClinic) => {
        setSelectedClinic(clinic);
        setActiveModal('appointment');
        setSelectedDate(dateOptions[0]?.key || '');
        setSelectedTime(null);
    };

    const confirmAppointment = async () => {
        if (!selectedClinic || !selectedTime) return;

        // Use Hook to Book via Service
        await bookAppointment(selectedClinic, selectedDate, selectedTime, 'general');

        setActiveModal('success');
        setTimeout(() => setActiveModal(null), 3000);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-black pb-32 font-sans relative">

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 pb-4 transition-all">
                <div className="px-6 pt-6 pb-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
                                    Veteriner
                                </h1>
                                <div className="scale-90 origin-left -ml-1">
                                    <PetSwitcher />
                                </div>
                            </div>
                        </div>
                        <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">2,450</span>
                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#5B4D9D] transition-colors" />
                        <input
                            type="text"
                            placeholder="Klinik, veteriner veya uzmanlık ara..."
                            className="w-full h-12 pl-12 pr-4 bg-gray-100 dark:bg-white/5 rounded-2xl border-none outline-none font-bold text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5B4D9D]/50 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-8">

                {/* QUICK SERVICES */}
                <section className="grid grid-cols-4 gap-3">
                    {SERVICES.map((service) => (
                        <button
                            key={service.id}
                            onClick={() => handleServiceClick(service.action)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 active:scale-95", service.color)}>
                                <service.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 text-center leading-tight">{service.label}</span>
                        </button>
                    ))}
                </section>

                {/* INTERACTIVE MAP PREVIEW */}
                <section className="relative w-full h-48 rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg">
                    {userLocation ? (
                        <LiveMap
                            userPos={userLocation}
                            visitedPlaceIds={clinics.map(c => c.id)}
                            path={[]}
                            isTracking={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Harita yükleniyor...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> {clinics.length} Klinik Bulundu</div>
                        <div className="text-[10px] opacity-80">Haritada incele</div>
                    </div>
                </section>

                {/* CLINICS LIST (REAL SORTING) */}
                <section id="clinics-list">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Yakındaki Klinikler</h2>
                        <button className="text-xs font-bold text-[#5B4D9D] flex items-center gap-1"><Filter className="w-3 h-3" /> Filtrele</button>
                    </div>

                    <div className="space-y-4">
                        {clinics.map((clinic) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={clinic.id}
                                className={cn(
                                    "bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-4 shadow-sm border transition-all active:scale-[0.98]",
                                    clinic.isPremium ? "border-yellow-400/50 shadow-yellow-500/10 ring-1 ring-yellow-400/20" : "border-gray-100 dark:border-white/5"
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-200 overflow-hidden relative shrink-0">
                                        <img src={clinic.imageUrl} className="w-full h-full object-cover" />
                                        {clinic.isPremium && (
                                            <div className="absolute top-0 left-0 bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-br-lg z-10">
                                                ÖNERİLEN
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-lg backdrop-blur-sm">
                                            {clinic.distance}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{clinic.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                                    <MapPin className="w-3 h-3 text-gray-400" /> {clinic.distance} uzakta
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 text-orange-400 fill-current" />
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{clinic.rating}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {clinic.features.map((f: string) => (
                                                <span key={f} className="text-[9px] bg-gray-50 dark:bg-white/5 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/5">{f}</span>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openAppointment(clinic)}
                                                className="flex-1 bg-[#5B4D9D] hover:bg-[#4a3e80] text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-purple-500/20"
                                            >
                                                Randevu Al
                                            </button>
                                            <button className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center hover:scale-105 transition-transform">
                                                <Phone className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            <MoffiAssistant />

            {/* --- MODALS --- */}
            <AnimatePresence>

                {/* 1. APPOINTMENT MODAL (FULL FUNCTIONAL) */}
                {activeModal === 'appointment' && selectedClinic && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-white dark:bg-[#121212] rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Randevu Oluştur</h2>
                                <button onClick={() => setActiveModal(null)} className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <img src={selectedClinic.imageUrl} className="w-14 h-14 rounded-xl object-cover" />
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{selectedClinic.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedClinic.distance}</div>
                                </div>
                            </div>

                            {/* DATE SELECTOR */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Tarih Seç</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {dateOptions.map((day) => (
                                        <button
                                            key={day.key}
                                            onClick={() => { setSelectedDate(day.key); setSelectedTime(null); }}
                                            className={cn("px-4 py-3 rounded-xl min-w-[80px] text-center border transition-all relative overflow-hidden", selectedDate === day.key ? "bg-[#5B4D9D] text-white border-[#5B4D9D] shadow-lg shadow-purple-500/30" : "border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50")}
                                        >
                                            <div className="text-xs font-medium opacity-80">{day.dayName}</div>
                                            <div className="text-sm font-bold">{day.label}</div>
                                            {selectedDate === day.key && <motion.div layoutId="activeDate" className="absolute inset-0 bg-white/10" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TIME SELECTOR */}
                            <div className="mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Saat Seç</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn("py-2.5 rounded-xl text-sm font-bold border transition-all", selectedTime === time ? "bg-[#5B4D9D] text-white border-[#5B4D9D] shadow-md" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5")}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto border-t border-gray-100 dark:border-white/10 pt-4">
                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span className="text-gray-500">Muayene Ücreti</span>
                                    <span className="font-black text-gray-900 dark:text-white">650.00 ₺</span>
                                </div>
                                <button
                                    onClick={confirmAppointment}
                                    disabled={!selectedTime}
                                    className="w-full bg-[#5B4D9D] text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a3e80] transition-colors flex items-center justify-center gap-2"
                                >
                                    {selectedTime ? `Randevuyu Onayla (${selectedTime})` : 'Saat Seçiniz'} <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. SOS MODAL */}
                {activeModal === 'sos' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-red-600/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-white text-red-600 p-8 rounded-full mb-8 shadow-2xl animate-pulse ring-8 ring-red-400/30">
                            <ShieldAlert className="w-20 h-20 fill-current" />
                        </motion.div>
                        <h2 className="text-4xl font-black mb-4 tracking-tight">ACİL DURUM!</h2>
                        <div className="bg-black/20 p-4 rounded-2xl mb-8 border border-white/10 max-w-sm">
                            <div className="text-sm opacity-80 mb-1">En Yakın Açık Klinik:</div>
                            <div className="font-bold text-xl">Acil Vet 24/7</div>
                            <div className="text-sm font-mono mt-1 flex items-center justify-center gap-2"><Navigation className="w-4 h-4" /> 2.5 km (5 dk)</div>
                        </div>

                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <button className="bg-white text-red-600 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-transform">
                                <Phone className="w-6 h-6 fill-current" /> HEMAN ARA
                            </button>
                            <button className="bg-red-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-400/30 hover:bg-red-700">
                                <Navigation className="w-5 h-5" /> Yol Tarifi Al
                            </button>
                            <button onClick={() => setActiveModal(null)} className="mt-4 text-sm font-bold opacity-60 hover:opacity-100">
                                İptal Et
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* 3. VACCINE MODAL (NEW COMPONENT) */}
                <VaccineModal
                    isOpen={activeModal === 'vaccine'}
                    onClose={() => setActiveModal(null)}
                />

                {/* 4. DENTAL CARE MODAL */}
                <DentalCareModal
                    isOpen={activeModal === 'dental'}
                    onClose={() => setActiveModal(null)}
                />

                {/* 5. PHARMACY MODAL */}
                <PharmacyModal
                    isOpen={activeModal === 'pharma'}
                    onClose={() => setActiveModal(null)}
                />

                {/* 4. SUCCESS TOAST */}
                <AnimatePresence>
                    {activeModal === 'success' && (
                        <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-10 inset-x-0 flex justify-center z-[70] pointer-events-none">
                            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6" /> Randevu Başarıyla Oluşturuldu!
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </div>
    );
}
