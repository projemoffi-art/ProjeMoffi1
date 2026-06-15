"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, Star, Calendar,
    ShieldAlert, ChevronRight, Syringe, Utensils, Clock, Pill,
    CheckCircle2, ChevronLeft, X, Filter, PhoneCall, Activity
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

// Dynamic map import
const MapboxLiveMap = dynamic(() => import('@/components/walk/LiveMap'), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#18181b] animate-pulse rounded-3xl" />
});

export default function VetPage() {
    const router = useRouter();
    const { activePet } = usePet();
    const { 
        featuredClinics, allClinics, userLocation, isLoading, 
        bookAppointment, searchByService, activeCategory 
    } = useVet();

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [activeModal, setActiveModal] = useState<'appointment' | 'vaccine' | 'dental' | 'pharma' | 'sos' | 'success' | 'rating' | 'clinicList' | null>(null);
    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
    const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("Randevu Oluşturuldu ✨");
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");

    // Secondary Modals States
    const [activeMedicationModal, setActiveMedicationModal] = useState(false);
    const [activeNutritionModal, setActiveNutritionModal] = useState(false);

    // Deep Linking query parameter listener
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const openModal = params.get('open');
            if (openModal === 'vaccine') {
                setActiveModal('vaccine');
            } else if (openModal === 'appointment') {
                setActiveModal('clinicList');
            }
        }
    }, []);

    // Appointment Form States
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const allTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

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

    const timeSlots = allTimeSlots.filter(time => {
        if (!selectedDate || selectedDate !== dateOptions[0]?.key) return true;
        const now = new Date();
        const [h, m] = time.split(':').map(Number);
        return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
    });

    const openAppointment = (clinic: VetClinic) => {
        setSelectedClinic(clinic);
        setActiveModal('appointment');
        setSelectedDate(dateOptions[0]?.key || '');
        setSelectedTime(null);
    };

    const confirmAppointment = async () => {
        if (!selectedClinic || !selectedTime) return;
        await bookAppointment(selectedClinic, selectedDate, selectedTime, 'general');
        setSuccessMessage("Randevu Oluşturuldu ✨");
        setActiveModal('success');
        setTimeout(() => setActiveModal(null), 3000);
    };

    return (
        <div className="min-h-screen bg-[#09090b] pb-32 font-sans relative text-[#fafafa] selection:bg-emerald-500/30">
            {/* Minimal solid design - no cheap floating background blobs */}

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] pb-4">
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
                                className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center hover:bg-[#27272a] hover:scale-105 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5 text-[#fafafa]/80" />
                            </button>
                            <div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-0.5">Moffi Health</span>
                                <h1 className="text-2xl font-black text-[#fafafa] tracking-tighter leading-none uppercase italic">
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
                        <input
                            type="text"
                            placeholder="Klinik, veteriner veya uzmanlık alanı ara..."
                            className="w-full h-12 pl-11 pr-4 bg-[#18181b] rounded-xl border border-[#27272a] outline-none font-bold text-xs text-[#fafafa] placeholder:text-[#fafafa]/20 focus:border-emerald-500 transition-all text-left"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Clean Category Tags */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
                                    "px-4 py-2 rounded-lg border flex items-center gap-1.5 whitespace-nowrap transition-all font-bold text-[10px] uppercase tracking-wider",
                                    activeCategory === cat.id 
                                        ? "bg-emerald-500 text-black border-emerald-500 font-black shadow-lg shadow-emerald-500/10" 
                                        : "bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-[#fafafa]"
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
                    <div className="bg-[#121215] border border-[#27272a] p-4 rounded-2xl flex items-center justify-between text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest block">Aktif Pet Durumu</span>
                                <h4 className="text-xs font-black text-[#fafafa] mt-0.5">{activePet.name} • Sağlıklı ve Takipte</h4>
                            </div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                )}

                {/* Primary Actions Grid: SOS and 7/24 Vet-line */}
                {/* Vet-Line Video Support Button */}
                <button 
                    onClick={() => alert("Canlı VetLine desteği başlatılıyor...")}
                    className="w-full bg-[#121215] hover:bg-[#18181b] border border-[#27272a] p-4.5 rounded-2xl flex items-center justify-between transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                            <PhoneCall className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xs font-black text-indigo-400 tracking-wider uppercase leading-none">Vet-Line 7/24 Canlı Hekim</h3>
                            <p className="text-[9.5px] text-[#fafafa]/40 font-bold uppercase tracking-wider mt-1.5">Anında Görüntülü Canlı Veteriner Desteği</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#fafafa]/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Solid Map Box */}
                <section className="relative w-full h-52 rounded-2xl overflow-hidden border border-[#27272a] shadow-xl bg-[#121215]">
                    {userLocation ? (
                        <MapboxLiveMap
                            userPos={userLocation}
                            visitedPlaceIds={allClinics.map(c => c.id)}
                            path={[]}
                            isTracking={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-[#121215] flex items-center justify-center text-[#a1a1aa] text-[10px] font-black uppercase tracking-widest">Harita Hazırlanıyor...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                        <div>
                            <div className="font-black text-sm text-[#fafafa] flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-emerald-400" /> {allClinics.length} Yakın Klinik
                            </div>
                            <div className="text-[8px] text-[#fafafa]/40 font-bold uppercase tracking-wider mt-0.5">Bulunduğunuz Konum Civarı</div>
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
                            <h2 className="text-sm font-black text-[#fafafa] tracking-wider uppercase italic leading-none">Çevredeki Klinikler</h2>
                            <p className="text-[8px] text-[#a1a1aa] font-bold uppercase tracking-wider mt-1">Öne Çıkan Sağlık Merkezleri</p>
                        </div>
                        <button className="bg-[#18181b] border border-[#27272a] px-3.5 py-1.5 rounded-lg text-[8px] font-black text-[#a1a1aa] flex items-center gap-1 hover:text-[#fafafa] transition-all">
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
                                key={clinic.id || `clinic-${index}`}
                                className={cn(
                                    "bg-[#121215] rounded-2xl p-4 border transition-all active:scale-[0.99] group relative overflow-hidden",
                                    clinic.isPremium ? "border-emerald-500/20" : "border-[#27272a]"
                                )}
                            >
                                <div className="flex gap-4">
                                    {/* Small cover image for clinical listing */}
                                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#27272a] shrink-0 cursor-pointer relative" onClick={() => setDetailClinicId(clinic.id)}>
                                        <img src={clinic.imageUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/10" />
                                    </div>

                                    {/* Clinic Details */}
                                    <div className="flex-1 flex flex-col justify-between text-left">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black text-[#fafafa] text-sm tracking-tight leading-none group-hover:text-emerald-400 transition-colors">{clinic.name}</h3>
                                                <div className="flex items-center gap-0.5 text-yellow-500">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span className="text-[10px] font-black text-[#fafafa]">{clinic.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-[#a1a1aa] text-[9px] font-bold mt-1.5 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-[#a1a1aa]" /> {clinic.distance} • Kadıköy, İstanbul
                                            </p>
                                            <div className="flex gap-1 mt-2">
                                                {(clinic.features || []).slice(0, 2).map((f: string) => (
                                                    <span key={f} className="text-[7.5px] font-bold bg-[#18181b] text-[#a1a1aa] px-2 py-0.5 rounded border border-[#27272a] uppercase">{f}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 mt-2">
                                            <button 
                                                onClick={() => setDetailClinicId(clinic.id)}
                                                className="text-[8px] font-black text-[#a1a1aa] hover:text-[#fafafa] uppercase tracking-wider"
                                            >
                                                Detayları Gör
                                            </button>
                                            <button
                                                onClick={() => openAppointment(clinic)}
                                                className="bg-emerald-500 text-black px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-md"
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-[#121215] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden h-[85vh] flex flex-col border border-[#27272a] text-[#fafafa] relative">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#27272a] rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-6 mt-2 sm:mt-0">
                                <h2 className="text-lg font-black tracking-tight uppercase">Randevu Oluştur</h2>
                                <button onClick={() => setActiveModal(null)} className="w-8 h-8 bg-[#18181b] rounded-full flex items-center justify-center border border-[#27272a] hover:bg-[#27272a] transition-all"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="flex items-center gap-4 mb-6 p-4 bg-[#18181b] rounded-2xl border border-[#27272a]">
                                <img src={selectedClinic.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#27272a]" />
                                <div className="text-left">
                                    <div className="font-black text-sm text-[#fafafa] leading-snug mb-0.5">{selectedClinic.name}</div>
                                    <div className="text-[9px] text-[#a1a1aa] font-bold uppercase tracking-wider flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {selectedClinic.distance} mesafede
                                    </div>
                                </div>
                            </div>

                            {/* DATE SELECTOR */}
                            <div className="mb-6">
                                <label className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-wider mb-2 block px-1">Tarih Seçimi</label>
                                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                                    {dateOptions.map((day) => (
                                        <button
                                            key={day.key}
                                            onClick={() => { setSelectedDate(day.key); setSelectedTime(null); }}
                                            className={cn(
                                                "px-4 py-3 rounded-xl min-w-[85px] text-center border transition-all flex flex-col items-center",
                                                selectedDate === day.key 
                                                    ? "bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/10 font-black" 
                                                    : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#fafafa]"
                                            )}
                                        >
                                            <div className="text-[8px] font-bold uppercase tracking-wider mb-0.5">{day.dayName}</div>
                                            <div className="text-xs font-black">{day.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TIME SELECTOR */}
                            <div className="mb-6 flex-1 overflow-y-auto pr-1 no-scrollbar text-left">
                                <label className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-wider mb-3 block px-1">Saat Seçimi</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                                "py-2.5 text-xs font-bold rounded-lg border transition-all text-center",
                                                selectedTime === time 
                                                    ? "bg-emerald-500 text-black border-emerald-500 font-black" 
                                                    : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#fafafa]"
                                            )}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={confirmAppointment}
                                disabled={!selectedTime}
                                className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 disabled:opacity-20 transition-all active:scale-95 mt-auto"
                            >
                                Randevuyu Onayla
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. REVIEWS / RATING MODAL */}
                {activeModal === 'rating' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-[#121215] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#27272a] text-[#fafafa] relative">
                            <div className="flex flex-col items-center text-center p-4">
                                <h3 className="font-black text-lg uppercase tracking-tight mb-2">Klinik Değerlendir</h3>
                                <p className="text-[10px] text-[#a1a1aa] uppercase tracking-wider mb-6">Deneyiminizi diğer pati sahipleriyle paylaşın</p>

                                <div className="flex gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            onClick={() => setUserRating(star)}
                                            className="transition-all active:scale-90"
                                        >
                                            <Star className={cn("w-8 h-8 transition-colors", userRating >= star ? "text-yellow-500 fill-current" : "text-[#27272a]")} />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Görüşleriniz..."
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-xs font-bold text-[#fafafa] placeholder:text-[#fafafa]/10 outline-none focus:border-yellow-500 transition-all resize-none h-24 mb-6"
                                />

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => { setSuccessMessage("Değerlendirildi ✨"); setActiveModal('success'); setTimeout(() => setActiveModal(null), 2000); }}
                                        disabled={userRating === 0}
                                        className="w-full bg-[#fafafa] text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-20"
                                    >
                                        Gönder ve Kapat
                                    </button>
                                    <button onClick={() => setActiveModal(null)} className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-wider py-2">İptal</button>
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
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-8 inset-x-0 flex justify-center z-[300] pointer-events-none">
                        <div className="bg-[#121215] text-[#fafafa] px-6 py-3 rounded-full shadow-2xl font-black text-xs flex items-center gap-2 border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMessage}
                        </div>
                    </motion.div>
                )}

                {/* 4. CLINIC EXPLORER OVERLAY */}
                {isExplorerOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black"
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
                            <h3 className="bg-[#121215]/90 backdrop-blur-md px-5 py-3.5 rounded-xl border border-[#27272a] text-[#fafafa] font-black text-sm uppercase tracking-wider pointer-events-auto">Klinik Keşfi</h3>
                            <button 
                                onClick={() => setIsExplorerOpen(false)}
                                className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-2xl pointer-events-auto hover:bg-emerald-400 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="absolute bottom-10 inset-x-6 z-[201] pointer-events-none flex justify-center">
                            <div className="bg-[#121215]/90 backdrop-blur-md px-6 py-4 rounded-xl border border-[#27272a] text-[#fafafa] text-[9px] font-black uppercase tracking-widest pointer-events-auto shadow-2xl">
                                Haritadaki pinlere dokunarak detayları gör
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 5. SIDE DRAWER (Clinic Details) */}
                <ClinicDetailDrawer 
                    clinicId={detailClinicId} 
                    onClose={() => setDetailClinicId(null)}
                    onBookAppointment={(clinic) => {
                        setDetailClinicId(null);
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
            </AnimatePresence>
        </div>
    );
}
