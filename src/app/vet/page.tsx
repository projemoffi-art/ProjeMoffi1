"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Search, MapPin, Phone, Star, Calendar,
    ShieldAlert, ChevronRight, Syringe, Utensils, Clock, Pill,
    Navigation, Coins, CheckCircle2, ChevronLeft,
    X, Filter, ShieldCheck
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
import { VetClinic, Pet } from "@/types/domain";
import { apiService } from "@/services/apiService";

// Dynamic imports to prevent SSR issues
const LiveMap = dynamic(() => import('@/components/walk/LiveMap'), { ssr: false, loading: () => <div className="h-48 bg-[var(--card-bg)] animate-pulse rounded-3xl mb-4" /> });

export default function VetPage() {
    const router = useRouter();
    const { 
        featuredClinics, allClinics, userLocation, isLoading, 
        bookAppointment, searchByService, activeCategory 
    } = useVet();

    // UI STATES
    const [searchQuery, setSearchQuery] = useState("");
    const [activeModal, setActiveModal] = useState<'appointment' | 'vaccine' | 'dental' | 'pharma' | 'sos' | 'success' | 'rating' | 'clinicList' | null>(null);
    const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
    const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [activePet, setActivePet] = useState<Pet | null>(null);
    const [successMessage, setSuccessMessage] = useState("Randevu Oluşturuldu ✨");
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");

    // NEW HEALTH STATES
    const [activeMedicationModal, setActiveMedicationModal] = useState(false);
    const [activeNutritionModal, setActiveNutritionModal] = useState(false);

    useEffect(() => {
        const loadActivePet = async () => {
            const pet = await apiService.getActivePet();
            setActivePet(pet);
        };
        loadActivePet();
    }, []);

    // APPOINTMENT FORM STATE
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

    const handleServiceClick = (action: string) => {
        if (action === 'vaccine') setActiveModal('vaccine');
        else if (action === 'dental') setActiveModal('dental');
        else if (action === 'pharma') setActiveModal('pharma');
        else if (action === 'meds') setActiveMedicationModal(true);
        else if (action === 'nutri') setActiveNutritionModal(true);
        else if (action === 'appointment') {
            setActiveModal('clinicList');
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
        await bookAppointment(selectedClinic, selectedDate, selectedTime, 'general');
        setSuccessMessage("Randevu Oluşturuldu ✨");
        setActiveModal('success');
        setTimeout(() => setActiveModal(null), 3000);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32 font-sans relative text-[var(--foreground)] selection:bg-[#5B4D9D]/30">
            {/* AMBIENT BACKGROUND GLOWS */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#5B4D9D]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[var(--background)]/60 backdrop-blur-3xl border-b border-[var(--card-border)] pb-4 transition-all">
                <div className="px-6 pt-8 pb-2 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => {
                                    if (window.history.length > 2) {
                                        router.back();
                                    } else {
                                        router.push('/community');
                                    }
                                }} 
                                className="w-11 h-11 rounded-2xl bg-[var(--card-bg)] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="w-6 h-6 text-[var(--foreground)]/80" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-1.5">
                                    Veteriner
                                </h1>
                                <div className="scale-95 origin-left opacity-90">
                                    <PetSwitcher />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 backdrop-blur-md">
                            <Coins className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-black text-[var(--foreground)]/90">2,450</span>
                        </div>
                    </div>

                    {/* MINIMALIST SEARCH */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#5B4D9D]/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground)]/30 group-focus-within:text-[#5B4D9D] transition-colors" />
                        <input
                            type="text"
                            placeholder="Klinik, veteriner veya uzmanlık ara..."
                            className="w-full h-14 pl-12 pr-4 bg-[var(--card-bg)] rounded-2xl border border-white/10 outline-none font-bold text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 focus:border-[#5B4D9D]/50 focus:bg-white/[0.08] transition-all relative z-10 text-center"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* CATEGORY CHIPS */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { id: 'all', label: 'Tümü', icon: '✨' },
                            { id: 'clinic', label: 'Klinikler', icon: '🏥' },
                            { id: 'food', label: 'Mama', icon: '🍖' },
                            { id: 'toy', label: 'Oyuncak', icon: '🎾' },
                            { id: 'care', label: 'Sağlık', icon: '💊' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => searchByService(cat.id)}
                                className={cn(
                                    "px-5 py-2.5 rounded-2xl border flex items-center gap-2 whitespace-nowrap transition-all font-bold text-xs",
                                    activeCategory === cat.id 
                                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                        : "bg-[var(--card-bg)] text-[var(--text-secondary)] border-white/10 hover:border-white/20"
                                )}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-6 py-8 space-y-10 relative z-10">

                {/* BENTO QUICK SERVICES - Glassmorphism 2.0 */}
                <section className="grid grid-cols-6 grid-rows-3 gap-4 h-[380px]">
                    {/* LARGE: Randevu Al */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceClick('appointment')}
                        className="col-span-4 row-span-2 bg-[#1C1C1E] border border-white/10 rounded-[2.8rem] p-7 text-left flex flex-col justify-between relative overflow-hidden group shadow-2xl"
                    >
                        {/* Mesh Glow Background */}
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#5B4D9D]/20 blur-[80px] rounded-full group-hover:bg-[#5B4D9D]/30 transition-colors duration-500" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full" />
                        
                        <div className="w-16 h-16 rounded-[1.8rem] bg-white/5 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-xl relative z-10">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="relative z-10">
                            <p className="text-[#5B4D9D] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Moffi Health</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase">Randevu Al</h3>
                            <p className="text-white/40 text-[11px] font-bold mt-2 uppercase tracking-widest max-w-[140px]">En Yakın Kliniklere Hızlı Erişim</p>
                        </div>
                        
                        <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:translate-x-1 transition-all">
                            <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white" />
                        </div>
                    </motion.button>

                    {/* MEDIUM: Aşılar */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceClick('vaccine')}
                        className="col-span-2 row-span-1 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.2rem] p-5 flex flex-col items-start justify-between group hover:bg-emerald-500/10 transition-all"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Syringe className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Takvim</span>
                            <span className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">Aşılar</span>
                        </div>
                    </motion.button>

                    {/* MEDIUM: Eczane */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceClick('pharma')}
                        className="col-span-2 row-span-1 bg-orange-500/5 border border-orange-500/10 rounded-[2.2rem] p-5 flex flex-col items-start justify-between group hover:bg-orange-500/10 transition-all font-sans"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                            <Pill className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Takip</span>
                            <span className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">İlaçlarım</span>
                        </div>
                    </motion.button>

                    {/* NEW ROW: Health Extension */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceClick('nutri')}
                        className="col-span-3 row-span-1 bg-emerald-500/5 border border-white/5 rounded-[2.2rem] p-6 flex items-center gap-5 group hover:bg-emerald-500/10 transition-all"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:rotate-12 transition-transform">
                            <Utensils className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Beslenme</span>
                            <span className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Diyet Planı</span>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceClick('meds')}
                        className="col-span-3 row-span-1 bg-blue-500/5 border border-white/5 rounded-[2.2rem] p-6 flex items-center gap-5 group hover:bg-blue-500/10 transition-all"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Zamanlayıcı</span>
                            <span className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">İlaç Takibi</span>
                        </div>
                    </motion.button>
                </section>

                {/* MAP PREVIEW - SLEEK CRYSTAL VERSION */}
                <section className="relative w-full h-56 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                    {userLocation ? (
                        <LiveMap
                            userPos={userLocation}
                            visitedPlaceIds={allClinics.map(c => c.id)}
                            path={[]}
                            isTracking={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-[var(--card-bg)] flex items-center justify-center text-[var(--foreground)]/20 text-xs font-bold">Harita Hazırlanıyor...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-6 flex items-end justify-between right-6 pointer-events-none">
                        <div>
                            <div className="font-black text-lg text-[var(--foreground)] flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500" /> {allClinics.length} Klinik</div>
                            <div className="text-[10px] text-[var(--foreground)]/50 font-bold uppercase tracking-widest">Çevrendeki Aktif Noktalar</div>
                        </div>
                        <button 
                            onClick={() => setIsExplorerOpen(true)}
                            className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black pointer-events-auto hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-widest"
                        >
                            Keşfet
                        </button>
                    </div>
                </section>

                {/* CLINICS LIST - PREMIUM APPLE MAPS CARDS */}
                <section id="clinics-list">
                    <div className="flex items-center justify-between mb-8 px-1">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">Öne Çıkanlar</h2>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2">Popüler Noktalar</p>
                        </div>
                        <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black text-white/40 flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all">
                            <Filter className="w-3.5 h-3.5" /> FİLTRELE
                        </button>
                    </div>

                    <div className="space-y-8">
                        {featuredClinics.map((clinic, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ type: "spring", stiffness: 80, damping: 12, delay: index * 0.05 }}
                                key={clinic.id || `clinic-${index}`}
                                className={cn(
                                    "bg-[#1C1C1E] rounded-[3rem] p-6 border transition-all active:scale-[0.98] group relative overflow-hidden",
                                    clinic.isPremium ? "border-yellow-500/30 shadow-[0_30px_60px_rgba(234,179,8,0.1)]" : "border-white/5 shadow-2xl"
                                )}
                            >
                                {/* Subtle Background Shimmer */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex flex-col gap-6 relative z-10">
                                    {/* Card Header: Main Image & floating data */}
                                    <div className="relative h-56 rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer" onClick={() => setDetailClinicId(clinic.id)}>
                                        <img src={clinic.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        
                                        {/* Floating Badges */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {clinic.isPremium && (
                                                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> MOFFI VERIFIED
                                                </div>
                                            )}
                                            <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/20 whitespace-nowrap">
                                                {clinic.distance}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-black text-white text-2xl tracking-tighter uppercase italic leading-none">{clinic.name}</h3>
                                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3 text-orange-500" /> {clinic.address || "İstanbul, Kadıköy"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 translate-y-2">
                                                <div className="bg-white p-3 rounded-2xl shadow-2xl text-black flex flex-col items-center min-w-[50px]">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current mb-0.5" />
                                                    <span className="text-xs font-black">{clinic.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer: Features & Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {(clinic.features || []).slice(0, 3).map((f: string) => (
                                                <span key={f} className="text-[9px] font-black bg-white/5 text-white/40 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-tighter">{f}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setDetailClinicId(clinic.id)}
                                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all shadow-xl active:scale-90"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openAppointment(clinic)}
                                                className="bg-white text-black h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5B4D9D] hover:text-white transition-all shadow-2xl active:scale-95 whitespace-nowrap"
                                            >
                                                Randevu Al
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            
            {/* AMBIENT BOTTOM GRADIENT */}
            <div className="fixed bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none z-20" />

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* 1. APPOINTMENT MODAL - Apple Modern Refinement */}
                {activeModal === 'appointment' && selectedClinic && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-[#1C1C1E] rounded-t-[3rem] sm:rounded-[3.5rem] p-7 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden h-[85vh] flex flex-col border border-white/10 text-white relative">
                            {/* iOS Style Grab Handle */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full sm:hidden" />
                            
                            <div className="flex justify-between items-center mb-8 mt-2 sm:mt-0">
                                <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Randevu Oluştur</h2>
                                <button onClick={() => setActiveModal(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex items-center gap-5 mb-8 p-5 bg-white/5 rounded-[2.2rem] border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <img src={selectedClinic.imageUrl} className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/10" />
                                <div className="relative z-10 flex-1">
                                    <div className="font-black text-xl tracking-tight leading-snug mb-1">{selectedClinic.name}</div>
                                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-orange-500" /> {selectedClinic.distance}
                                    </div>
                                </div>
                            </div>

                            {/* DATE SELECTOR - iOS Style */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Randevu Günü</label>
                                    <span className="text-[10px] font-black text-[#5B4D9D] uppercase tracking-widest">En Erken Bugüne</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                                    {dateOptions.map((day) => (
                                        <button
                                            key={day.key}
                                            onClick={() => { setSelectedDate(day.key); setSelectedTime(null); }}
                                            className={cn(
                                                "px-6 py-5 rounded-[2rem] min-w-[100px] text-center border transition-all relative overflow-hidden flex flex-col items-center group",
                                                selectedDate === day.key 
                                                    ? "bg-white text-black border-white shadow-2xl shadow-white/10" 
                                                    : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{day.dayName}</div>
                                            <div className="text-sm font-black tracking-tight">{day.label}</div>
                                            {selectedDate === day.key && (
                                                <motion.div layoutId="day-dot" className="absolute bottom-2 w-1 h-1 bg-black rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TIME SELECTOR */}
                            <div className="mb-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 block px-1">Randevu Saati</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                                "py-4 rounded-2xl text-[13px] font-black border transition-all",
                                                selectedTime === time 
                                                    ? "bg-[#5B4D9D] text-white border-[#5B4D9D] shadow-[0_10px_30px_rgba(91,77,157,0.4)]" 
                                                    : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <div>
                                        <span className="text-white/40 font-black text-[10px] uppercase tracking-widest block mb-1">Hizmet Bedeli</span>
                                        <span className="font-black text-2xl text-white tracking-tighter italic uppercase leading-none">650.00 ₺</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-3 py-1.5 rounded-full border border-emerald-500/20">MOFFI ÜYELİĞİ AKTİF</span>
                                    </div>
                                </div>
                                <button
                                    onClick={confirmAppointment}
                                    disabled={!selectedTime}
                                    className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_30px_60px_rgba(255,255,255,0.1)] disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    {selectedTime ? `ONAYLA VE OLUŞTUR` : 'SAAT SEÇİNİZ'} 
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. SOS MODAL - Critical Apple Alert */}
                {activeModal === 'sos' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#FF3B30] flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden">
                        {/* Background Pulsing Radiance */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-white/20 blur-[120px] rounded-full" 
                        />

                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="bg-white text-[#FF3B30] p-12 rounded-[3.5rem] mb-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative z-10"
                        >
                            <ShieldAlert className="w-24 h-24 fill-current animate-pulse" />
                        </motion.div>

                        <div className="relative z-10">
                            <h2 className="text-6xl font-black mb-6 tracking-tighter uppercase italic leading-none">ACİL DURUM</h2>
                            <div className="bg-black/20 backdrop-blur-3xl p-8 rounded-[3rem] mb-12 border border-white/20 max-w-sm mx-auto shadow-2xl">
                                <div className="text-[10px] font-black opacity-60 mb-2 uppercase tracking-[0.3em]">En Yakın 7/24 Klinik:</div>
                                <div className="font-black text-3xl tracking-tighter italic uppercase">Acil Vet 24/7</div>
                                <div className="text-sm font-black mt-3 flex items-center justify-center gap-2 text-white/80">
                                    <MapPin className="w-5 h-5 text-white" /> 2.5 KM (5 DK)
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 w-80 mx-auto">
                                <button className="bg-white text-[#FF3B30] py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all uppercase tracking-widest">
                                    <Phone className="w-8 h-8 fill-current" /> ŞİMDİ ARA
                                </button>
                                <button className="bg-black/40 text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-3 border border-white/10 backdrop-blur-md hover:bg-black/60 transition-all uppercase text-sm tracking-widest">
                                    <Navigation className="w-6 h-6" /> YOL TARİFİ
                                </button>
                                <button onClick={() => setActiveModal(null)} className="mt-10 text-[10px] font-black opacity-40 uppercase tracking-[0.4em] hover:opacity-100 transition-opacity">
                                    İPTAL ET VE DÖN
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* 3. RATING MODAL - Premium Crystal Design */}
                {activeModal === 'rating' && selectedClinic && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-sm bg-[#1C1C1E] rounded-[3.5rem] p-9 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full" />
                            
                            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 w-11 h-11 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white z-20"><X className="w-5 h-5" /></button>
                            
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 overflow-hidden mb-6 border border-white/10 shadow-2xl group">
                                    <img src={selectedClinic.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">{selectedClinic.name}</h3>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-10">DENEYİMİNİZİ PUANLAYIN</p>

                                {/* STARS - iOS Interaction Style */}
                                <div className="flex gap-3 mb-10">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button 
                                            key={star} 
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => setUserRating(star)}
                                            className="transition-all"
                                        >
                                            <Star className={cn("w-10 h-10 transition-all duration-300", userRating >= star ? "text-yellow-500 fill-current filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "text-white/5")} />
                                        </motion.button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Geri bildiriminizi buraya bırakın..."
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm font-bold text-white placeholder:text-white/10 outline-none focus:border-yellow-500/50 transition-all resize-none h-32 mb-8 focus:bg-white/10 shadow-inner"
                                />

                                <div className="w-full flex flex-col gap-4">
                                    <button
                                        onClick={() => { setSuccessMessage("Değerlendirmen için teşekkürler! ✨"); setActiveModal('success'); setTimeout(() => setActiveModal(null), 2000); }}
                                        disabled={userRating === 0}
                                        className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-10 transition-all active:scale-95"
                                    >
                                        GÖNDER VE KAPAT
                                    </button>
                                    <button onClick={() => setActiveModal(null)} className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white/40 transition-colors">ŞİMDİ DEĞİL</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* MODALS COMPONENTS */}
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
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-12 inset-x-0 flex justify-center z-[300] pointer-events-none">
                        <div className="bg-white text-black px-8 py-4 rounded-full shadow-2xl font-black flex items-center gap-3 border border-white/20">
                            <CheckCircle2 className="w-6 h-6 text-green-500" /> {successMessage}
                        </div>
                    </motion.div>
                )}

                {/* 4. CLINIC EXPLORER OVERLAY */}
                {isExplorerOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-[200] bg-black"
                    >
                        <div className="absolute inset-0">
                            {userLocation && (
                                <LiveMap
                                    userPos={userLocation}
                                    visitedPlaceIds={[]}
                                    path={[]}
                                    isTracking={true}
                                    onPlaceClick={(place: any) => setDetailClinicId(place.id)}
                                />
                            )}
                        </div>
                        
                        <div className="absolute top-8 left-8 right-8 z-[201] flex justify-between items-center pointer-events-none">
                            <h3 className="bg-black/50 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 text-white font-black text-xl italic uppercase tracking-tighter pointer-events-auto">Klinik Keşfı</h3>
                            <button 
                                onClick={() => setIsExplorerOpen(false)}
                                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl pointer-events-auto hover:bg-[#FF3B30] hover:text-white transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="absolute bottom-12 inset-x-8 z-[201] pointer-events-none flex justify-center">
                            <div className="bg-black/80 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-auto shadow-2xl">
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
