"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShieldCheck, Plane, Award, 
    Calendar, MapPin, ChevronRight, Hash, 
    Download, AlertCircle, Clock, Heart,
    Fingerprint, Info, X, User, Phone,
    Stethoscope, Zap, Scissors, Barcode,
    Loader2, CheckCircle2, FileText, Share2,
    Smartphone, Radio, AlertOctagon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useVaccineSchedule } from "@/hooks/useVaccineSchedule";
import { TagPairingModal } from "@/components/community/modals/TagPairingModal";

interface PassportTabProps {
    pet?: any;
    onClose?: () => void;
    onEdit?: () => void;
    onSOSSettings?: () => void;
}

export function PassportTab({ pet, onClose, onEdit, onSOSSettings }: PassportTabProps) {
    const { schedule, isLoading } = useVaccineSchedule(pet?.id || 'pet-1');
    const [isHovered, setIsHovered] = useState(false);
    const [isQRExpanded, setIsQRExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStep(1);
        
        await new Promise(r => setTimeout(r, 1500));
        setGenerationStep(2);
        
        await new Promise(r => setTimeout(r, 1500));
        setGenerationStep(3);
        
        await new Promise(r => setTimeout(r, 1500));
        setIsGenerating(false);
        setGenerationStep(0);
        setShowPreview(true);
    };

    // Mock Pet Data with Official Fields
    const petData = pet || {
        id: "pet-1",
        name: "BELLA",
        breed: "Golden Retriever",
        microchip: "985-000-123-456",
        birthday: "12 Ekim 2021",
        city: "İSTANBUL / TR",
        gender: "Dişi",
        color: "Bal Sarısı",
        weight: "28.5 kg",
        neutered: true,
        avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=256",
        owner: {
            name: "Sarah Johnson",
            phone: "+90 532 --- -- --",
            address: "Kadıköy, İstanbul"
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest animate-pulse">Resmi Veriler Doğrulanıyor...</p>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-12 pb-40 relative"
        >
            {/* 1. THE HOLOGRAPHIC DIGITAL PASSPORT CARD */}
            <div 
                className="relative group perspective-2000"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <motion.div
                    ref={cardRef}
                    whileHover={{ rotateY: 2, rotateX: -2, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-gradient-to-br from-[#1C1C1E] via-[#0A0A0E] to-[#1C1C1E] rounded-[3.5rem] p-10 border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col min-h-[520px]"
                >
                    {/* Apple Style Glass Header */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    {/* Holographic Mesh Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]" />
                    </div>

                    {/* Travel Readiness Badge */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl px-5 py-2 rounded-full border border-white/10 shadow-2xl">
                            <Plane className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Seyahate Uygun (AB)</span>
                        </div>
                    </div>

                    {/* Shimmer Effect */}
                    <motion.div 
                        animate={{ x: isHovered ? "200%" : "-200%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                    />

                    {/* Content Header */}
                    <div className="flex justify-between items-start mb-12 relative z-10 pt-6">
                        <div className="flex gap-6 items-center">
                            <div className="relative">
                                <img src={petData.avatar} className="w-28 h-28 rounded-[2.5rem] object-cover border-4 border-[#0A0A0E] shadow-2xl relative z-10 scale-110 rotate-[-2deg]" />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-[#0A0A0E] z-20 shadow-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-left ml-4">
                                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Moffi Passport</p>
                                <h1 className="text-6xl font-black text-white tracking-tighter leading-none italic uppercase">{petData.name}</h1>
                                <div className="mt-4 flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg w-fit border border-white/5">
                                    <Fingerprint className="w-3.5 h-3.5 text-white/40" />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Digital Verified</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-end">
                            <div 
                                onClick={() => setIsQRExpanded(true)}
                                className="bg-white p-3 rounded-[2rem] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-110 active:scale-95 transition-all cursor-pointer relative overflow-hidden group/qr"
                            >
                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                                <QRCodeSVG value={`moffi://id/${petData.id}`} size={72} fgColor="#000000" bgColor="#FFFFFF" level="H" />
                            </div>
                            {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white hover:bg-white/20 transition-all active:scale-90 shadow-xl"
                                >
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-10 relative z-10 border-t border-white/10 pt-10 mt-auto pb-4">
                        {[
                            { label: 'Cins / Irk', value: petData.breed, icon: Award },
                            { label: 'Microchip ID', value: petData.microchip, icon: Hash, mono: true, color: 'text-emerald-400' },
                            { label: 'Doğum Tarihi', value: petData.birthday, icon: Calendar },
                            { label: 'Kayıtlı Bölge', value: petData.city, icon: MapPin },
                        ].map((field, i) => (
                            <div key={i} className="space-y-1.5 px-2">
                                <div className="flex items-center gap-2 opacity-40">
                                    <field.icon className="w-3 h-3 text-white" />
                                    <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{field.label}</p>
                                </div>
                                <p className={cn("text-base font-black tracking-tight uppercase", field.mono ? "font-mono " + (field.color || "text-white") : "text-white")}>
                                    {field.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Microchip Barcode Visual */}
                    <div className="mt-4 pt-4 border-t border-white/5 opacity-30 flex justify-center">
                        <Barcode className="w-full h-8 text-white" />
                    </div>
                </motion.div>
            </div>

            {/* 2. OFFICIAL SECTIONS BENTO GRID */}
            <div className="grid grid-cols-2 gap-4 px-2">
                {/* Veli Bilgileri */}
                <div className="col-span-2 bg-[#12121A] border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Veli / Sahip Bilgileri</h4>
                        <User className="w-4 h-4 text-cyan-400 opacity-40" />
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5">
                            <div className="w-full h-full rounded-full bg-[#0A0A0E] flex items-center justify-center">
                                <User className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-tight">{petData.owner.name}</p>
                            <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] mt-1 uppercase tracking-widest">
                                <Phone className="w-3 h-3" /> {petData.owner.phone}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed border-t border-white/5 pt-4">
                        <MapPin className="w-3 h-3 inline mr-1 opacity-40" /> {petData.owner.address}
                    </p>
                </div>

                {/* Fiziksel Özellikler */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Biyometrik</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Cinsiyet</span>
                            <span className="text-white font-black">{petData.gender}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Renk</span>
                            <span className="text-white font-black">{petData.color}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Kilo</span>
                            <span className="text-white font-black">{petData.weight}</span>
                        </div>
                    </div>
                </div>

                {/* Kısırlaştırma Durumu */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between items-center text-center group active:scale-95 transition-all">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] w-full">Operasyonel</h4>
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12",
                        petData.neutered ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                    )}>
                        <Scissors className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-tight">Kısırlaştırıldı</p>
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{petData.neutered ? 'EVET' : 'HAYIR'}</p>
                    </div>
                </div>
                
                {/* SOS Command Center Access */}
                <div 
                    onClick={onSOSSettings}
                    className="col-span-2 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">SOS Harekat Merkezi</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Canlı Güvenlik Paneli</span>
                            <AlertOctagon className="w-4 h-4 text-red-500 opacity-40" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xl font-black text-white tracking-tight italic uppercase">Kayıp Kontrol Üssü</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Pet-ID durumunu değiştir, ödül belirle ve bulucu mesajını düzenle.</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                </div>

                {/* Moffi Hybrid Tag Activation */}
                <div 
                    onClick={() => setIsTagModalOpen(true)}
                    className="col-span-2 bg-[#12121A] border border-cyan-500/20 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Moffi Hybrid Tag</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NFC + QR Koruma</span>
                            <Smartphone className="w-4 h-4 text-cyan-400 opacity-40" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <Radio className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-tight">Kayıp Önleme Künyesi</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Fiziksel künyeni petinle eşleştirerek korumayı başlat.</p>
                        </div>
                        <div className="ml-auto">
                            <button className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20">
                                Şimdi Eşleştir
                            </button>
                        </div>
                    </div>
                </div>

                {/* Parazit Uygulamaları (Smart Widget) */}
                <div className="col-span-2 bg-[#12121A] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Parazit Kontrol Takibi</h4>
                        <Stethoscope className="w-4 h-4 text-emerald-400 opacity-40" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col items-center gap-2 group">
                            <Zap className="w-5 h-5 text-yellow-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">İç Parazit</span>
                            <span className="text-xs font-black text-white">12 Ara 2024</span>
                            <div className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">GÜNCEL</div>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col items-center gap-2 group">
                            <Zap className="w-5 h-5 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Dış Parazit</span>
                            <span className="text-xs font-black text-white">15 Ara 2024</span>
                            <div className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">GÜNCEL</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. HEALTH JOURNEY TIMELINE (Apple Health Style) */}
            <div className="space-y-8 px-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                            </div>
                            Aşı Karnesi
                        </h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-13">Resmi Kayıtlar ve Mühürler</p>
                    </div>
                </div>

                <div className="space-y-6 relative">
                    {/* Interactive Timeline Line */}
                    <div className="absolute left-[39px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-emerald-500/20 via-white/5 to-transparent shadow-[0_0_10px_emerald/10]" />

                    {schedule.map((record, i) => (
                        <motion.div 
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-8 group"
                        >
                            {/* Record Icon Node */}
                            <div className={cn(
                                "w-20 h-20 rounded-[2.2rem] flex items-center justify-center shrink-0 border transition-all group-hover:scale-105 z-10",
                                record.status === 'completed' 
                                    ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.2)]" 
                                    : "bg-white/5 text-gray-400 border-white/10 border-dashed"
                            )}>
                                {record.status === 'completed' ? <ShieldCheck className="w-8 h-8" /> : <Clock className="w-8 h-8 opacity-40" />}
                            </div>

                            {/* Record Card */}
                            <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 group-hover:bg-white/10 transition-all relative overflow-hidden">
                                {record.status === 'completed' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none opacity-[0.03] scale-150">
                                        <p className="text-6xl font-black uppercase tracking-[0.5em] text-white whitespace-nowrap">SEALED</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{record.definition.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">VACCINE RECORD</p>
                                    </div>
                                    {record.status === 'completed' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                            <Award className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ONAYLI PROFİL</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4 opacity-80">{record.definition.description || "Sağlık kaydı doğrulandı."}</p>
                                
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Geçerlilik</span>
                                        <span className="text-sm font-black text-white mt-0.5">{record.status === 'completed' ? record.dateAdministered : record.dueDate}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 4. EXPORT SECTION (Apple Wallet Style Bar) */}
            <div className="px-2">
                <button 
                    onClick={handleGenerate}
                    className="w-full bg-[#12121A] border-2 border-white/10 py-8 rounded-[3rem] group hover:bg-white/5 transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Download className="w-7 h-7 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-lg font-black text-white">Resmi Karne Oluştur (PDF)</h4>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 px-4">Veteriner Hekim Onaylı Dijital Mühür Dahildir</p>
                </button>
            </div>

            {/* FULL SCREEN QR EXPANSION MODAL */}
            <AnimatePresence>
                {isQRExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
                        onClick={() => setIsQRExpanded(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white p-8 rounded-[4rem] shadow-[0_0_80px_rgba(255,255,255,0.2)] flex flex-col items-center gap-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center space-y-2 mb-2">
                                <h3 className="text-2xl font-black text-black tracking-tighter uppercase italic">{petData.name} - PET ID</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Hızlı Tarama Modu</p>
                            </div>

                            <QRCodeSVG 
                                value={`moffi://id/${petData.id}`} 
                                size={typeof window !== 'undefined' && window.innerWidth < 400 ? 260 : 320} 
                                fgColor="#000000" 
                                bgColor="#FFFFFF" 
                                level="H"
                                includeMargin={true}
                            />

                            <button 
                                onClick={() => setIsQRExpanded(false)}
                                className="mt-4 px-8 py-4 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Kapat
                            </button>
                        </motion.div>

                        <button 
                            onClick={() => setIsQRExpanded(false)}
                            className="absolute top-10 right-10 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GENERATING OVERLAY */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5"
                            >
                                <div className="w-full h-full rounded-[2.4rem] bg-black flex items-center justify-center">
                                    <ShieldCheck className="w-16 h-16 text-white" />
                                </div>
                            </motion.div>
                            <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-500 rounded-full blur-3xl -z-10" 
                            />
                        </div>

                        <div className="space-y-4 max-w-xs">
                            <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">
                                {generationStep === 1 && "Tıbbi Veriler Analiz Ediliyor..."}
                                {generationStep === 2 && "Dijital Mühür Doğrulanıyor..."}
                                {generationStep === 3 && "Resmi PDF Hazırlanıyor..."}
                            </h3>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(generationStep / 3) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-mono">
                                Securing Blockchain Hash: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PASSPORT PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-start py-24 px-6 overflow-y-auto"
                    >

                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="w-full max-w-md bg-white rounded-[4rem] p-6 flex flex-col shadow-2xl text-black relative cursor-default"
                        >
                            {/* iOS Style Grab Handle - Ultra Precise Hit Area */}
                            <button 
                                className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 flex items-center justify-center z-[130] outline-none group" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPreview(false);
                                }}
                            >
                                <motion.div 
                                    whileHover={{ width: 60, backgroundColor: "rgba(0,0,0,0.2)" }}
                                    whileTap={{ scale: 0.8 }}
                                    className="w-12 h-1.5 bg-black/10 rounded-full transition-all" 
                                />
                            </button>

                            {/* Preview Header */}
                            <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-100 pb-6 pt-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Moffi Passport System</span>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">EVCİL HAYVAN PASAPORTU</h2>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Hızlı Doğrulama ve Seyahat Belgesi</p>
                                    <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 rounded-lg px-2 py-1 w-fit">
                                        <ShieldCheck className="w-3 h-3" /> Dijital Mühür Uygulandı
                                    </div>
                                </div>
                                <div className="p-2 border-2 border-gray-200 rounded-2xl scale-90">
                                    <QRCodeSVG value={`moffi://verify/${petData.id}`} size={48} />
                                </div>
                            </div>

                            {/* Official Disclaimer Note */}
                            <div className="mb-6 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[7px] font-bold text-gray-400 uppercase leading-relaxed">
                                    ⓘ Bu belge, evcil hayvanın fiziksel pasaportunun doğrulanmış bir dijital ikizidir. Resmi kurumlarda fiziksel pasaportun ibraz edilmesi gerekebilir. 
                                </p>
                            </div>

                            {/* Preview Content Area */}
                            <div className="flex gap-4 mb-6">
                                <img src={petData.avatar} className="w-20 h-20 rounded-2xl object-cover grayscale-[0.5] contrast-125 shadow-lg" />
                                <div className="space-y-3 flex-1">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Pet Adı</p>
                                            <p className="text-xs font-black uppercase tracking-tight leading-none">{petData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Gömülü Çip</p>
                                            <p className="text-xs font-black font-mono tracking-tighter leading-none">{petData.microchip.slice(-8)}...</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Irk</p>
                                            <p className="text-xs font-bold uppercase tracking-tight leading-none truncate">{petData.breed}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Resmi Veli</p>
                                            <p className="text-xs font-bold uppercase tracking-tight leading-none truncate">{petData.owner.name.split(' ')[0]}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vaccine List Preview */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-8">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Son Uygulanan Aşılar</h4>
                                {schedule.slice(0, 3).map((v) => (
                                    <div key={v.id} className="flex justify-between items-center text-[11px]">
                                        <span className="font-bold text-gray-600">{v.definition.name}</span>
                                        <span className="font-black font-mono">{v.dateAdministered || "UYGUN"}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 relative z-10">
                                <button 
                                    onClick={() => alert("Resmi Pasaport PDF olarak başarıyla oluşturuldu ve indiriliyor... 📥")}
                                    className="flex-1 bg-black text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-95"
                                >
                                    <FileText className="w-4 h-4" /> PDF İndir
                                </button>
                                <button 
                                    onClick={() => alert("Paylaşım menüsü açılıyor... 📲")}
                                    className="w-14 h-14 bg-gray-100 text-black rounded-3xl flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95 shadow-inner"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Seal Overlay (Prominent Mühür) */}
                            <div className="absolute bottom-12 right-6 rotate-[-20deg] opacity-[0.08] pointer-events-none group">
                                <div className="relative">
                                    <Award className="w-40 h-40 text-black" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-[8px] font-black uppercase text-center leading-none tracking-widest">
                                            MOFFI<br/>VERIFIED
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TagPairingModal 
                isOpen={isTagModalOpen} 
                onClose={() => setIsTagModalOpen(false)} 
                pet={{
                    id: petData.id,
                    name: petData.name,
                    avatar: petData.avatar
                }}
            />
        </motion.div>
    );
}
