"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShieldCheck, Plane, Award, 
    Calendar, MapPin, ChevronRight, Hash, 
    Download, AlertCircle, Clock, Heart,
    Fingerprint, Info, X, User, Phone,
    Stethoscope, Zap, Scissors,
    Loader2, CheckCircle2, FileText, Share2,
    Smartphone, Radio, AlertOctagon, ShieldAlert,
    Settings
} from "lucide-react";
import { cn, showToast } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useVaccineSchedule } from "@/hooks/useVaccineSchedule";
import { TagPairingModal } from "@/components/community/modals/TagPairingModal";
import { usePet } from "@/context/PetContext";
import { PetSwitcher } from "../common/PetSwitcher";
import { PetSettingsModal } from "./PetSettingsModal";

interface PassportTabProps {
    pet?: any;
    onClose?: () => void;
    onEdit?: (pet: any) => void;
    isPublic?: boolean;
}

function MicrochipBarcode({ value }: { value: string }) {
    const chars = String(value || "Kayıtlı Değil");
    const bars: number[] = [];
    for (let i = 0; i < chars.length; i++) {
        const code = chars.charCodeAt(i);
        bars.push((code & 1) ? 3 : 1);
        bars.push((code & 2) ? 4 : 2);
        bars.push((code & 4) ? 2 : 3);
        bars.push(1); // space
    }
    return (
        <div className="flex items-stretch justify-center h-6 w-full max-w-[200px] opacity-40">
            {bars.map((w, idx) => (
                <div 
                    key={idx} 
                    className={idx % 2 === 0 ? "bg-white" : "bg-transparent"} 
                    style={{ width: `${w}px` }} 
                />
            ))}
        </div>
    );
}

export function PassportTab({ pet: propPet, onClose, onEdit, isPublic = false }: PassportTabProps) {
    const { activePet, isLoading: isPetLoading, updatePet, deletePet } = usePet();
    const currentPet = propPet || activePet;
    const { schedule, isLoading } = useVaccineSchedule(currentPet?.id || 'pet-1');
    const [isHovered, setIsHovered] = useState(false);
    const [isQRExpanded, setIsQRExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Robust Pet Data with Official Fields
    const petData = {
        ...((currentPet && typeof currentPet === 'object') ? currentPet : {}),
        avatar: currentPet?.image || currentPet?.avatar,
        microchip: currentPet?.microchip || currentPet?.microchip_id || currentPet?.microchip_no || "Kayıtlı Değil",
        petvet: currentPet?.petvet || currentPet?.petvet_no || "Kayıtlı Değil",
        birthday: currentPet?.birthday || currentPet?.birth_date || currentPet?.sos_settings?.birthday || "Belirtilmedi",
        // Yeni alanlar
        type: currentPet?.type || "",
        size: currentPet?.size || currentPet?.sos_settings?.size || "",
        character: currentPet?.character || currentPet?.sos_settings?.character || "",
        features: currentPet?.features || currentPet?.sos_settings?.features || "",
        healthStatus: currentPet?.health || currentPet?.sos_settings?.health || "",
        healthNotes: currentPet?.health_notes || "",
        owner: {
            name: isPublic ? "Gizli Bilgi" : (currentPet?.owner?.name || currentPet?.ownerName || currentPet?.sos_settings?.owner?.name || "Bilinmiyor"),
            phone: isPublic ? "+90 *** *** ** **" : (currentPet?.owner?.phone || currentPet?.ownerPhone || currentPet?.sos_settings?.owner?.phone || "+90 --- --- -- --"),
            address: isPublic ? "Bölge Gizli (Sadece Sahibi Görebilir)" : (currentPet?.owner?.address || currentPet?.ownerAddress || currentPet?.sos_settings?.owner?.address || "Adres Kayıtı Bulunamadı"),
        }
    };

    const hasMicrochip = petData.microchip && petData.microchip !== "Kayıtlı Değil" && petData.microchip.trim() !== "";
    const hasRabiesVaccine = schedule.some((v: any) => {
        const nameLower = (v.definition?.name || "").toLowerCase();
        const codeLower = (v.definition?.code || "").toLowerCase();
        return (nameLower.includes("kuduz") || nameLower.includes("rabies") || codeLower.includes("rabies") || codeLower.includes("kuduz")) && !!v.dateAdministered;
    });
    const isTravelReady = hasMicrochip && hasRabiesVaccine;

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

    const handleShareProfile = () => {
        try {
            const shareUrl = `${window.location.origin}/share/pet/${petData.id}`;
            navigator.clipboard.writeText(shareUrl);
            showToast("Paylaşım Linki Kopyalandı! 🔗", "Sparkles", "text-emerald-400 font-bold");
        } catch (error) {
            console.error("Link copy error:", error);
            alert("Paylaşım linki kopyalanamadı.");
        }
    };

    const downloadPDF = async () => {
        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            // Set background color
            doc.setFillColor(248, 249, 250); // Light gray
            doc.rect(0, 0, 210, 297, "F");

            // Header banner
            doc.setFillColor(11, 11, 14); // Dark header
            doc.rect(0, 0, 210, 45, "F");

            // Brand
            doc.setTextColor(16, 185, 129); // Emerald
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("MOFFI DIGITAL PASSPORT SUMMARY (UNOFFICIAL)", 15, 15);

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text("PASAPORT OZET BELGESI", 15, 26);

            doc.setTextColor(156, 163, 175);
            doc.setFontSize(8);
            doc.text("PERSONAL HEALTH & IDENTIFICATION RECORD", 15, 34);

            // Decorative lines
            doc.setFillColor(16, 185, 129);
            doc.rect(0, 45, 210, 2, "F");

            // Body
            // Section 1: Pet Details
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("1. KIMLIK BILGILERI / PET IDENTIFICATION", 15, 60);

            // Draw line
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.5);
            doc.line(15, 63, 195, 63);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);

            const detailsY = 70;
            doc.text(`Adi (Name): ${petData.name || "-"}`, 15, detailsY);
            doc.text(`Turu (Type): ${petData.type || "-"}`, 15, detailsY + 8);
            doc.text(`Irki (Breed): ${petData.breed || "-"}`, 15, detailsY + 16);
            doc.text(`Cinsiyet (Gender): ${petData.gender || "-"}`, 15, detailsY + 24);
            doc.text(`Dogum Tarihi (Birth): ${petData.birthday || "-"}`, 15, detailsY + 32);

            doc.text(`Mikrocip ID (Chip): ${petData.microchip || "Kayitli Degil"}`, 110, detailsY);
            doc.text(`PETVET Kayit No: ${petData.petvet || "Kayitli Degil"}`, 110, detailsY + 8);
            doc.text(`Boyut (Size): ${petData.size || "-"}`, 110, detailsY + 16);
            doc.text(`Kilo (Weight): ${petData.weight || "-"}`, 110, detailsY + 24);
            doc.text(`Renk (Color): ${petData.color || "-"}`, 110, detailsY + 32);
            doc.text(`Kisirlastirma (Neutered): ${petData.neutered ? "Evet (Yes)" : "Hayir (No)"}`, 110, detailsY + 40);

            // Section 2: Owner Details
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55);
            doc.text("2. VELI / SAHIP BILGILERI (OWNER INFORMATION)", 15, 120);
            doc.line(15, 123, 195, 123);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);
            doc.text(`Sahip (Owner): ${petData.owner?.name || "-"}`, 15, 130);
            doc.text(`Telefon (Phone): ${petData.owner?.phone || "-"}`, 15, 138);
            doc.text(`Adres (Address): ${petData.owner?.address || "-"}`, 15, 146);

            // Section 3: Vaccine Records
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55);
            doc.text("3. ASI VE TIBBI KAYITLAR (VACCINE RECORDS)", 15, 170);
            doc.line(15, 173, 195, 173);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);
            
            let vaccineY = 180;
            if (schedule.length > 0) {
                schedule.slice(0, 6).forEach((v: any, index: number) => {
                    const status = v.dateAdministered ? "Uygulandi (Administered)" : "Planlandi (Scheduled)";
                    const date = v.dateAdministered || v.dateScheduled || "-";
                    doc.text(`${index + 1}. ${v.definition?.name || "Asi"} (${v.definition?.code || "Code"}) - Tarih: ${date} [${status}]`, 15, vaccineY);
                    vaccineY += 8;
                });
            } else {
                doc.text("Kayitli tibbi asi gecmisi bulunmamaktadir.", 15, vaccineY);
            }

            // Blockchain & Verification info
            doc.setFillColor(229, 231, 235);
            doc.rect(15, 245, 180, 25, "F");

            doc.setTextColor(107, 114, 128);
            doc.setFontSize(8);
            doc.text(`Dijital Muhur Kod (Hash): 0x${Math.random().toString(16).slice(2, 10).toUpperCase()}FD9E3924B`, 20, 253);
            doc.text(`Dogrulama Linki (URL): https://moffi.co/verify/${petData.id}`, 20, 259);
            doc.text("Bu belge resmi bir kimlik olmayip sadece kisisel bilgilendirme ve asi takip amaclidir.", 20, 265);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Olusturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} - Moffi Cloud Digital Registry`, 15, 285);

            doc.save(`${petData.name}_Pasaport_${petData.id}.pdf`);
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("PDF oluşturulurken bir hata oluştu.");
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest animate-pulse">Sağlık Günlüğü Notları Yükleniyor...</p>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-40 relative px-2 mb-12"
        >
            <div className="flex justify-center mb-4">
                <PetSwitcher />
            </div>
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
                    className="bg-gradient-to-br from-[#1C1C1E] via-[#0A0A0E] to-[#1C1C1E] rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-card-border shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col min-h-[480px] sm:min-h-[520px]"
                >
                    {/* Apple Style Glass Header */}
                    <div className="absolute top-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    {/* Holographic Mesh Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]" />
                    </div>

                    {/* Travel Readiness Badge */}
                    <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-30">
                        {isTravelReady ? (
                            <div className="flex items-center gap-2 bg-emerald-950/80 backdrop-blur-2xl px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-emerald-500/30 shadow-2xl whitespace-nowrap">
                                <Plane className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                                <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Seyahate Uygun (AB)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-red-950/80 backdrop-blur-2xl px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-red-500/30 shadow-2xl whitespace-nowrap" title="AB seyahat kuralları gereği çip ve kuduz aşısı zorunludur.">
                                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                <span className="text-[9px] sm:text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Seyahate Uygun Değil</span>
                            </div>
                        )}
                    </div>

                    {/* Shimmer Effect */}
                    <motion.div 
                        animate={{ x: isHovered ? "200%" : "-200%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                    />

                    {/* Content Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 relative z-10 pt-4 sm:pt-6 gap-6 sm:gap-0">
                        <div className="flex gap-4 sm:gap-6 items-center">
                            <div className="relative shrink-0">
                                {petData.avatar ? (
                                    <img src={petData.avatar} className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.5rem] object-cover border-4 border-[#0A0A0E] shadow-2xl relative z-10 scale-105 sm:scale-110 rotate-[-2deg]" />
                                ) : (
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-tr from-zinc-800 to-zinc-900 border-4 border-[#0A0A0E] shadow-2xl relative z-10 scale-105 sm:scale-110 rotate-[-2deg] flex items-center justify-center">
                                        <span className="text-gray-400 text-3xl font-black select-none uppercase font-sans">
                                            {petData.name ? petData.name[0] : '🐾'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 text-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#0A0A0E] z-20 shadow-xl">
                                    <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
                                </div>
                            </div>
                            <div className="text-left ml-2 sm:ml-4">
                                <p className="text-[9px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1">Moffi Passport</p>
                                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">{petData.name}</h1>
                                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 sm:gap-2 bg-white/5 px-2.5 sm:px-3 py-1 rounded-lg w-fit border border-card-border">
                                    <Fingerprint className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40" />
                                    <span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">Digital Verified</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-end w-full sm:w-auto">
                            <div 
                                onClick={() => setIsQRExpanded(true)}
                                className="bg-card p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-110 active:scale-95 transition-all cursor-pointer relative overflow-hidden group/qr"
                            >
                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                                <QRCodeSVG value={`moffi://id/${petData.id}`} size={64} fgColor="#000000" bgColor="#FFFFFF" level="H" />
                            </div>
                            {!isPublic && (
                                <button 
                                    onClick={() => onEdit ? onEdit(currentPet) : setIsSettingsOpen(true)}
                                    className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-card-border text-white hover:bg-white/20 transition-all active:scale-90 shadow-xl ml-auto sm:ml-0 flex items-center justify-center gap-2"
                                    title="Pasaport Ayarları"
                                >
                                    <Settings className="w-5 h-5 text-cyan-400 animate-[spin_20s_infinite_linear]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Düzenle</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-10 relative z-10 border-t border-card-border pt-10 mt-auto pb-4">
                        {[
                            { label: 'Cins / Irk', value: petData.breed, icon: Award },
                            { label: 'Microchip ID', value: isPublic ? `${petData.microchip?.slice(0, 3)}***${petData.microchip?.slice(-3)}` : petData.microchip, icon: Hash, mono: true, color: 'text-emerald-400' },
                            { label: 'Doğum Tarihi', value: isPublic ? (petData.birthday?.split('-')[0] || "Gizli") : petData.birthday, icon: Calendar },
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
                    <div className="mt-4 pt-4 border-t border-card-border flex flex-col items-center gap-1.5 justify-center">
                        <MicrochipBarcode value={petData.microchip} />
                        <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">{petData.microchip}</span>
                    </div>
                </motion.div>
            </div>

            {/* PDF Belgesi Oluştur Butonu */}
            <div 
                onClick={handleGenerate}
                className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 rounded-[2.5rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer active:scale-[0.99] transition-all"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-black">
                        <FileText className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white uppercase tracking-tight italic">Dijital Pasaport Özeti (PDF)</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Kişisel aşı takibi ve kolay erişim amacıyla bilgilendirici PDF belgesi üret.</p>
                    </div>
                </div>
                <button className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                    BELGE OLUŞTUR
                </button>
            </div>

            {/* Bilgilendirme Not Defteri Uyarısı */}
            <div className="mx-2 p-5 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex items-start gap-4">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-left">
                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Dijital Sağlık Günlüğü & Not Defteri</h5>
                    <p className="text-xs text-gray-400 font-bold leading-relaxed mt-1">
                        Bu panel, evcil hayvanınızın aşı, çip ve biyometrik bilgilerini düzenli tutabilmeniz için tasarlanmış <strong className="text-amber-500">kişisel bir not defteridir</strong>. Resmi veterinerlik pasaportu yerine geçmez ve resmi kurumlarda yasal/hukuki bir geçerliliği yoktur.
                    </p>
                </div>
            </div>

            {/* 2. OFFICIAL SECTIONS BENTO GRID */}
            <div className="grid grid-cols-2 gap-4 px-2">
                {/* Veli Bilgileri */}
                <div className="col-span-2 bg-[#12121A] border border-card-border rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group">
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
                            <p className="text-xl font-black text-white tracking-tight">{petData.owner?.name || "Bilinmiyor"}</p>
                            <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] mt-1 uppercase tracking-widest">
                                <Phone className="w-3 h-3" /> {petData.owner?.phone || "+90 --- --- -- --"}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed border-t border-card-border pt-4">
                        <MapPin className="w-3 h-3 inline mr-1 opacity-40" /> {petData.owner?.address || "Adres Kaydı Yok"}
                    </p>
                </div>

                {/* Fiziksel Özellikler */}
                <div className="bg-white/5 border border-card-border rounded-[2.5rem] p-6 space-y-4">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Biyometrik</h4>
                    <div className="space-y-3">
                        {petData.type && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Tür</span>
                                <span className="text-white font-black text-base">{petData.type}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Cinsiyet</span>
                            <span className="text-white font-black">{petData.gender}</span>
                        </div>
                        {petData.size && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Boyut</span>
                                <span className="text-white font-black">{petData.size}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Renk</span>
                            <span className="text-white font-black">{petData.color || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">Kilo</span>
                            <span className="text-white font-black">{petData.weight || "-"}</span>
                        </div>
                        {petData.healthStatus && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Sağlık</span>
                                <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                                    petData.healthStatus === 'Mükemmel' ? 'text-emerald-400 bg-emerald-500/10' :
                                    petData.healthStatus === 'Tedavide' ? 'text-red-400 bg-red-500/10' :
                                    petData.healthStatus === 'Hassas' ? 'text-orange-400 bg-orange-500/10' :
                                    'text-blue-400 bg-blue-500/10'
                                }`}>{petData.healthStatus}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5 mt-2.5">
                            <span className="text-gray-500 font-bold uppercase tracking-tighter">PETVET No</span>
                            <span className="text-amber-400 font-black font-mono">{petData.petvet}</span>
                        </div>
                    </div>
                </div>

                {/* Kısırlaştırma Durumu */}
                <div className="bg-white/5 border border-card-border rounded-[2.5rem] p-6 flex flex-col justify-between items-center text-center group active:scale-95 transition-all">
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

                {/* Karakter & Ayırt Edici - Gizli profillerde gösterme */}
                {!isPublic && (petData.character || petData.features) && (
                    <div className="col-span-2 bg-white/5 border border-card-border rounded-[2.5rem] p-6 space-y-4">
                        <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Karakter & Tanımlayıcı Bilgiler</h4>
                        {petData.character && (
                            <div>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Karakter</p>
                                <p className="text-sm font-bold text-white/80 leading-relaxed">{petData.character}</p>
                            </div>
                        )}
                        {petData.features && (
                            <div className="border-t border-card-border pt-4">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Ayırt Edici Özellikler</p>
                                <p className="text-sm font-bold text-orange-300/80 leading-relaxed">{petData.features}</p>
                            </div>
                        )}
                        {petData.healthNotes && (
                            <div className="border-t border-card-border pt-4">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Sağlık Notları</p>
                                <p className="text-sm font-bold text-rose-300/80 leading-relaxed">{petData.healthNotes}</p>
                            </div>
                        )}
                    </div>
                )}

                <div 
                    onClick={() => setIsTagModalOpen(true)}
                    className="col-span-2 bg-[#12121A] border border-cyan-500/20 rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-4 sm:gap-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between">
                        <h4 className="text-[9px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Moffi Hybrid Tag</h4>
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline text-[10px] font-bold text-gray-500 uppercase tracking-widest">NFC + QR Koruma</span>
                            <Smartphone className="w-4 h-4 text-cyan-400 opacity-40" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <Radio className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-lg sm:text-xl font-black text-white tracking-tight">Kayıp Önleme Künyesi</p>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">Fiziksel künyeni petinle eşleştirerek korumayı başlat.</p>
                        </div>
                        <button className="w-full sm:w-auto bg-cyan-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 mt-2 sm:mt-0">
                            Şimdi Eşleştir
                        </button>
                    </div>
                </div>

                {/* Parazit Uygulamaları (Smart Widget) - Hide for Public */}
                {!isPublic && (() => {
                    const formatParasiteDate = (raw?: string) => {
                        if (!raw) return null;
                        const d = new Date(raw);
                        if (isNaN(d.getTime())) return raw; // zaten okunabilir format
                        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
                    };
                    const isOutdated = (raw?: string) => {
                        if (!raw) return false;
                        const d = new Date(raw);
                        if (isNaN(d.getTime())) return false;
                        return (Date.now() - d.getTime()) > 1000 * 60 * 60 * 24 * 180; // 6 ay
                    };
                    const internalDate = formatParasiteDate(petData.parasiteInternal || currentPet?.parasiteInternal || currentPet?.sos_settings?.parasiteInternal);
                    const externalDate = formatParasiteDate(petData.parasiteExternal || currentPet?.parasiteExternal || currentPet?.sos_settings?.parasiteExternal);
                    const internalOutdated = isOutdated(petData.parasiteInternal || currentPet?.parasiteInternal || currentPet?.sos_settings?.parasiteInternal);
                    const externalOutdated = isOutdated(petData.parasiteExternal || currentPet?.parasiteExternal || currentPet?.sos_settings?.parasiteExternal);
                    return (
                        <div className="col-span-2 bg-[#12121A] border border-card-border rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Parazit Kontrol Takibi</h4>
                                <Stethoscope className="w-4 h-4 text-emerald-400 opacity-40" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-5 rounded-3xl border border-card-border flex flex-col items-center gap-2 group">
                                    <Zap className="w-5 h-5 text-yellow-400 mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">İç Parazit</span>
                                    <span className="text-xs font-black text-white">{internalDate || 'Kayıt Yok'}</span>
                                    {internalDate ? (
                                        <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full mt-1 ${internalOutdated ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                            {internalOutdated ? 'SÜRE DOLMUŞ' : 'GÜNCEL'}
                                        </div>
                                    ) : (
                                        <div className="text-[8px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full mt-1">GIRILMEDI</div>
                                    )}
                                </div>
                                <div className="bg-white/5 p-5 rounded-3xl border border-card-border flex flex-col items-center gap-2 group">
                                    <Zap className="w-5 h-5 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Dış Parazit</span>
                                    <span className="text-xs font-black text-white">{externalDate || 'Kayıt Yok'}</span>
                                    {externalDate ? (
                                        <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full mt-1 ${externalOutdated ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                            {externalOutdated ? 'SÜRE DOLMUŞ' : 'GÜNCEL'}
                                        </div>
                                    ) : (
                                        <div className="text-[8px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full mt-1">GIRILMEDI</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
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
                            className="bg-card p-8 rounded-[4rem] shadow-[0_0_80px_rgba(255,255,255,0.2)] flex flex-col items-center gap-6"
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

                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => setIsTagModalOpen(true)}
                                className="w-full py-4 bg-white/5 border border-card-border hover:border-cyan-500/50 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-cyan-400 transition-all flex items-center justify-center gap-2"
                            >
                                <Radio className="w-4 h-4" /> Yeni Künye Eşleştir (NFC/QR)
                            </button>
                            <button 
                                onClick={async () => {
                                    if (currentPet?.is_lost) {
                                        updatePet(currentPet.id, { is_lost: false });
                                        try {
                                            const { apiService } = await import('@/services/apiService');
                                            await apiService.togglePetSosStatus(currentPet.id, 'safe');
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    } else {
                                        window.dispatchEvent(new CustomEvent('open-sos-center', { detail: currentPet }));
                                    }
                                }}
                                className={cn(
                                    "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    currentPet?.is_lost 
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                                )}
                            >
                                <ShieldAlert className="w-4 h-4" /> 
                                {currentPet?.is_lost ? "Güvendeyim Olarak İşaretle" : "Acil Durum Modunu Aç/Kapat"}
                            </button>
                        </div>
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
                                {generationStep === 1 && "Sağlık Verileri Günlüğe İşleniyor..."}
                                {generationStep === 2 && "Kişisel Notlar Düzenleniyor..."}
                                {generationStep === 3 && "Özet Belge Hazırlanıyor..."}
                            </h3>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(generationStep / 3) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-mono">
                                Not Defteri Eşleştirme Kodu: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}...
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
                        className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex flex-col items-center overflow-y-auto py-24 px-6"
                    >
                        <div className="relative w-full max-w-md my-auto">
                            {/* Close Button - Positioned Top Right just outside the box */}
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="absolute -top-12 -right-2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-card-border hover:bg-white/20 transition-all active:scale-90 z-[130]"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <motion.div
                                initial={{ scale: 0.9, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 50 }}
                                className="w-full bg-card rounded-[4rem] p-6 flex flex-col shadow-2xl text-black relative cursor-default"
                            >
                                {/* iOS Style Grab Handle - Visual only now */}
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 rounded-full" />

                                {/* Preview Header */}
                                <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-card-border pb-6 pt-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                                <div className="w-2 h-2 bg-card rounded-full" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Moffi Passport System</span>
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">DİJİTAL PASAPORT ÖZETİ</h2>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Kişisel Sağlık & Kimlik Takip Kartı</p>
                                        <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 rounded-lg px-2 py-1 w-fit">
                                            <ShieldCheck className="w-3 h-3" /> Bilgi Kartı Aktif
                                        </div>
                                    </div>
                                    <div className="p-2 border-2 border-card-border rounded-2xl scale-90">
                                        <QRCodeSVG value={`moffi://verify/${petData.id}`} size={48} />
                                    </div>
                                </div>
                            {/* Kişisel Takip Bilgilendirme Notu */}
                            <div className="mb-6 px-4 py-3 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                                <p className="text-[8px] font-bold text-amber-600 dark:text-amber-500 uppercase leading-relaxed">
                                    ⓘ Bu belge resmi bir kimlik veya pasaport değildir. Sadece kişisel takip ve bilgilendirme amaçlıdır. Resmi seyahat ve gümrük kontrollerinde veteriner hekim onaylı fiziksel pasaportun gösterilmesi zorunludur.
                                </p>
                            </div>

                            {/* Preview Content Area */}
                            <div className="flex gap-4 mb-6">
                                {petData.avatar ? (
                                    <img src={petData.avatar} className="w-20 h-20 rounded-2xl object-cover grayscale-[0.5] contrast-125 shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-gray-200 border border-card-border flex items-center justify-center shadow-lg">
                                        <span className="text-gray-400 text-2xl font-black select-none uppercase font-sans">
                                            {petData.name ? petData.name[0] : '🐾'}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Pet Adı</p>
                                            <p className="text-xs font-black uppercase tracking-tight leading-none">{petData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Gömülü Çip</p>
                                            <p className="text-xs font-black font-mono tracking-tighter leading-none">{petData.microchip?.slice(-8) || "985-00..."}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Irk</p>
                                            <p className="text-xs font-bold uppercase tracking-tight leading-none truncate">{petData.breed}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Pet Sahibi</p>
                                            <p className="text-xs font-bold uppercase tracking-tight leading-none truncate">{petData.owner?.name?.split(' ')[0] || "Bilinmiyor"}</p>
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
                                    onClick={downloadPDF}
                                    className="flex-1 bg-black text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-95"
                                >
                                    <FileText className="w-4 h-4" /> PDF İndir
                                </button>
                                <button 
                                    onClick={handleShareProfile}
                                    className="w-14 h-14 bg-gray-100 text-black rounded-3xl flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95 shadow-inner"
                                    title="Paylaşım Linki Kopyala"
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TagPairingModal 
                isOpen={isTagModalOpen}
                onClose={() => setIsTagModalOpen(false)}
                pet={{
                    id: petData.id,
                    name: petData.name,
                    avatar: petData.avatar || ""
                }}
            />

            {!isPublic && (
                <PetSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    pet={currentPet}
                    onSave={(updatedFields) => {
                        updatePet(currentPet.id, updatedFields);
                    }}
                    onDelete={deletePet}
                />
            )}
        </motion.div>
    );
}
