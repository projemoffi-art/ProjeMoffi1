"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, User, Phone, 
    MapPin, Hash, Award, Calendar, 
    Fingerprint, Scissors, Zap, Stethoscope,
    ShieldCheck, Trash2, Camera, Check,
    Droplets, Flame, Heart, Star, Tag,
    FileText, Maximize2, PawPrint
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";

interface PetSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    onSave: (updatedPet: any) => void;
    onDelete?: (id: string) => Promise<void> | void;
}

// Tek satır input / select / boolean / number row
const SettingRow = ({ icon: Icon, label, value, onChange, type = "text", options, tags, color = "text-white", placeholder }: any) => (
    <div className="w-full flex flex-col p-4 bg-white/5 border-b border-card-border last:border-0 group transition-colors hover:bg-white/[0.07]">
        <div className="flex items-center gap-4">
            <div className={cn("w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", color)}>
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">{label}</p>
                
                {tags && (
                    <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                        {tags.map((tag: string) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    const newValue = value ? `${value}, ${tag}` : tag;
                                    onChange(newValue);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-card-border text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                )}

                {type === "select" ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => onChange(opt)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                                    value === opt 
                                        ? "bg-white text-black border-white" 
                                        : "bg-transparent text-white/40 border-card-border hover:border-white/30"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : type === "boolean" ? (
                    <div className="flex gap-2 mt-1">
                        {[true, false].map((val) => (
                            <button
                                key={String(val)}
                                onClick={() => onChange(val)}
                                className={cn(
                                    "px-4 py-1 rounded-full text-xs font-bold transition-all border",
                                    value === val 
                                        ? "bg-white text-black border-white" 
                                        : "bg-transparent text-white/40 border-card-border hover:border-white/30"
                                )}
                            >
                                {val ? "Evet" : "Hayır"}
                            </button>
                        ))}
                    </div>
                ) : type === "textarea" ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={2}
                        className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder:text-white/10 resize-none mt-1"
                        placeholder={placeholder || "..."}
                    />
                ) : (
                    <input 
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-transparent text-[15px] font-bold text-white outline-none placeholder:text-white/10 truncate"
                        placeholder={placeholder || "..."}
                    />
                )}
            </div>
        </div>
    </div>
);

// Doğum tarihinden yaş hesapla
function calcAge(birthday: string): string {
    if (!birthday) return "";
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return "";
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return `${totalMonths} aylık`;
    if (years === 1) return "1 yaşında";
    return `${years} yaşında`;
}

export function PetSettingsModal({ isOpen, onClose, pet, onSave, onDelete }: PetSettingsModalProps) {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string>(pet?.image || pet?.avatar || "");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [formData, setFormData] = useState({
        // Temel kimlik
        name: pet?.name || "",
        breed: pet?.breed || "",
        microchip: pet?.microchip || pet?.microchip_id || pet?.microchip_no || "",
        birthday: pet?.birthday || pet?.birth_date || pet?.sos_settings?.birthday || "",
        // Tür & boyut (AddPetModal'dan gelenler)
        type: pet?.type || "🐶",
        size: pet?.size || "",
        // Biyometrik
        gender: pet?.gender || "Dişi",
        color: pet?.color || pet?.sos_settings?.color || "",
        weight: pet?.weight ? String(pet.weight).replace(/[^\d.]/g, "") : "",
        neutered: pet?.neutered ?? pet?.is_neutered ?? false,
        // Sağlık & karakter
        healthStatus: pet?.health || pet?.sos_settings?.health || "İyi",
        healthNotes: pet?.health_notes || "",
        character: pet?.character || pet?.personality || "",
        features: pet?.features || pet?.distinctive_features || "",
        // Veli bilgileri
        ownerName: pet?.ownerName || pet?.owner?.name || pet?.sos_settings?.owner?.name || "",
        ownerPhone: pet?.ownerPhone || pet?.owner?.phone || pet?.sos_settings?.owner?.phone || "",
        ownerAddress: pet?.ownerAddress || pet?.owner?.address || pet?.sos_settings?.owner?.address || "",
        // Parazit takibi
        parasiteInternal: pet?.parasiteInternal || pet?.sos_settings?.parasiteInternal || "",
        parasiteExternal: pet?.parasiteExternal || pet?.sos_settings?.parasiteExternal || "",
        // Günlük hedefler
        activityTarget: pet?.ringProgress?.activity ?? pet?.activity_target ?? 70,
        waterTarget: pet?.ringProgress?.water ?? pet?.water_target ?? 1200,
        foodTarget: pet?.ringProgress?.food ?? pet?.food_target ?? 1600,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPhotoPreview(pet?.image || pet?.avatar || "");
            setPhotoFile(null);
            setIsUploadingPhoto(false);
            setFormData({
                // Temel kimlik
                name: pet?.name || "",
                breed: pet?.breed || "",
                microchip: pet?.microchip || pet?.microchip_id || pet?.microchip_no || "",
                birthday: pet?.birthday || pet?.birth_date || pet?.sos_settings?.birthday || "",
                // Tür & boyut (AddPetModal'dan gelenler)
                type: pet?.type || "🐶",
                size: pet?.size || "",
                // Biyometrik
                gender: pet?.gender || "Dişi",
                color: pet?.color || pet?.sos_settings?.color || "",
                weight: pet?.weight ? String(pet.weight).replace(/[^\d.]/g, "") : "",
                neutered: pet?.neutered ?? pet?.is_neutered ?? false,
                // Sağlık & karakter
                healthStatus: pet?.health || pet?.sos_settings?.health || "İyi",
                healthNotes: pet?.health_notes || "",
                character: pet?.character || pet?.personality || "",
                features: pet?.features || pet?.distinctive_features || "",
                // Veli bilgileri
                ownerName: pet?.ownerName || pet?.owner?.name || pet?.sos_settings?.owner?.name || "",
                ownerPhone: pet?.ownerPhone || pet?.owner?.phone || pet?.sos_settings?.owner?.phone || "",
                ownerAddress: pet?.ownerAddress || pet?.owner?.address || pet?.sos_settings?.owner?.address || "",
                // Parazit takibi
                parasiteInternal: pet?.parasiteInternal || pet?.sos_settings?.parasiteInternal || "",
                parasiteExternal: pet?.parasiteExternal || pet?.sos_settings?.parasiteExternal || "",
                // Günlük hedefler
                activityTarget: pet?.ringProgress?.activity ?? pet?.activity_target ?? 70,
                waterTarget: pet?.ringProgress?.water ?? pet?.water_target ?? 1200,
                foodTarget: pet?.ringProgress?.food ?? pet?.food_target ?? 1600,
            });
        }
    }, [pet, isOpen]);

    // Doğumdan hesaplanan yaş
    const calculatedAge = calcAge(formData.birthday);

    // Fotoğraf seçimi
    const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalImageUrl = photoPreview;

            // Yeni fotoğraf seçildiyse yükle
            if (photoFile) {
                setIsUploadingPhoto(true);
                try {
                    finalImageUrl = await apiService.uploadMedia(photoFile, 'avatars');
                } catch (uploadErr) {
                    console.warn("Fotoğraf yüklenemedi, mevcut korunuyor:", uploadErr);
                    finalImageUrl = pet?.image || pet?.avatar || "";
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            onSave({
                ...formData,
                image: finalImageUrl,
                avatar: finalImageUrl,
                // Yaşı doğum tarihinden hesapla, yoksa mevcut koru
                age: calculatedAge || pet?.age || "",
            });
        } finally {
            setIsSaving(false);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (!pet?.id) return;
        const confirmDelete = window.confirm(`${formData.name || 'Bu pet'} profilini tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
        if (!confirmDelete) return;
        setIsSaving(true);
        try {
            if (onDelete) await onDelete(pet.id);
            onClose();
        } catch (err) {
            console.error("Pet silinemedi:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const PET_TYPES = ["🐶", "🐱", "🐰", "🦜", "🐹", "🐠", "🐍", "🦎"];
    const SIZE_OPTIONS = ["Mini", "Küçük", "Orta", "Büyük", "Dev"];
    const HEALTH_OPTIONS = ["Mükemmel", "İyi", "Hassas", "Tedavide"];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex flex-col justify-end"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0.1 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="w-full h-[94vh] bg-[#0A0A0E] rounded-t-[3rem] border-t border-card-border flex flex-col overflow-hidden shadow-[0_-25px_50px_rgba(0,0,0,0.8)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-card-border bg-[#0A0A0E]/80 backdrop-blur-md sticky top-0 z-50">
                            <button onClick={onClose} className="text-[17px] font-medium text-white/40 hover:text-white transition-colors">Vazgeç</button>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] opacity-80">Passport Editor</h2>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="flex items-center gap-2 text-[17px] font-black text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-all"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                                ) : (
                                    <>Bitti <Check className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-40">

                            {/* ─── Fotoğraf ─── */}
                            <div className="flex flex-col items-center gap-5 mt-4">
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => photoInputRef.current?.click()}
                                >
                                    <div className="w-28 h-28 rounded-[2.8rem] overflow-hidden border-4 border-card-border shadow-2xl relative">
                                        {photoPreview ? (
                                            <img src={photoPreview} className="w-full h-full object-cover" alt="Pet" />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                <PawPrint className="w-10 h-10 text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.4rem]">
                                            {isUploadingPhoto ? (
                                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera className="w-6 h-6 text-white" />
                                                    <span className="text-[9px] font-black text-white/80 mt-1 uppercase tracking-wider">Değiştir</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Fotoğraf yüklendi badge */}
                                    {photoFile && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-7 h-7 rounded-full border-4 border-[#0A0A0E] flex items-center justify-center shadow-lg">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-3xl font-black text-white tracking-tighter">{formData.name || "İsimsiz"}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-1.5">
                                        <span className="text-lg">{formData.type}</span>
                                        {calculatedAge && (
                                            <span className="inline-block px-3 py-0.5 bg-white/5 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest border border-card-border">
                                                {calculatedAge}
                                            </span>
                                        )}
                                        <span className="inline-block px-3 py-0.5 bg-cyan-500/10 rounded-full text-[10px] font-black text-cyan-400/80 uppercase tracking-widest border border-cyan-500/20">
                                            Digital Passport
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Temel Kimlik ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Temel Kimlik</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={Fingerprint} label="İsim" value={formData.name} onChange={(v:any) => setFormData(f => ({...f, name: v}))} color="text-cyan-400" placeholder="Petin adı" />
                                    <SettingRow icon={Award} label="Cins / Irk" value={formData.breed} onChange={(v:any) => setFormData(f => ({...f, breed: v}))} color="text-purple-400" placeholder="örn: Golden Retriever" />
                                    <SettingRow icon={Hash} label="Microchip No" value={formData.microchip} onChange={(v:any) => setFormData(f => ({...f, microchip: v}))} color="text-emerald-400" placeholder="Chip numarası" />
                                    <SettingRow icon={Calendar} label="Doğum Tarihi" value={formData.birthday} onChange={(v:any) => setFormData(f => ({...f, birthday: v}))} type="date" color="text-orange-400" />
                                </div>
                            </div>

                            {/* ─── Tür & Boyut ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Tür & Boyut</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    {/* Tür seçimi — emoji butonlar */}
                                    <div className="p-4 border-b border-card-border">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-yellow-400">
                                                <PawPrint className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Hayvan Türü</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {PET_TYPES.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => setFormData(f => ({...f, type: emoji}))}
                                                            className={cn(
                                                                "w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all border",
                                                                formData.type === emoji
                                                                    ? "bg-white border-white scale-110 shadow-lg"
                                                                    : "bg-white/5 border-card-border hover:bg-white/10"
                                                            )}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <SettingRow icon={Maximize2} label="Boyut" value={formData.size} onChange={(v:any) => setFormData(f => ({...f, size: v}))} type="select" options={SIZE_OPTIONS} color="text-blue-400" />
                                </div>
                            </div>

                            {/* ─── Biyometrik ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Biyometrik Veriler</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={User} label="Cinsiyet" value={formData.gender} onChange={(v:any) => setFormData(f => ({...f, gender: v}))} type="select" options={["Erkek", "Dişi"]} color="text-pink-400" />
                                    <SettingRow 
                                        icon={Zap} 
                                        label="Renk ve İşaretler" 
                                        value={formData.color} 
                                        onChange={(v:any) => setFormData(f => ({...f, color: v}))} 
                                        tags={["Siyah", "Beyaz", "Kahve", "Gri", "Krem", "Karma"]}
                                        color="text-yellow-400" 
                                    />
                                    <SettingRow icon={Stethoscope} label="Kilo (kg)" value={formData.weight} onChange={(v:any) => setFormData(f => ({...f, weight: v}))} type="number" color="text-blue-400" placeholder="örn: 12.5" />
                                    <SettingRow icon={Scissors} label="Kısırlaştırma" value={formData.neutered} onChange={(v:any) => setFormData(f => ({...f, neutered: v}))} type="boolean" color="text-red-400" />
                                </div>
                            </div>

                            {/* ─── Sağlık & Karakter ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Sağlık & Karakter</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={Heart} label="Sağlık Durumu" value={formData.healthStatus} onChange={(v:any) => setFormData(f => ({...f, healthStatus: v}))} type="select" options={HEALTH_OPTIONS} color="text-rose-400" />
                                    <SettingRow 
                                        icon={FileText} 
                                        label="Sağlık Notları" 
                                        value={formData.healthNotes} 
                                        onChange={(v:any) => setFormData(f => ({...f, healthNotes: v}))} 
                                        type="textarea"
                                        color="text-orange-400" 
                                        placeholder="Alerjiler, kronik durumlar, ilaçlar..."
                                    />
                                    <SettingRow 
                                        icon={Star} 
                                        label="Karakter & Kişilik" 
                                        value={formData.character} 
                                        onChange={(v:any) => setFormData(f => ({...f, character: v}))} 
                                        type="textarea"
                                        tags={["Oyuncu", "Sakin", "Sosyal", "Çekingen", "Enerjik", "Sevecen"]}
                                        color="text-purple-400" 
                                        placeholder="Karakteri nasıl?"
                                    />
                                    <SettingRow 
                                        icon={Tag} 
                                        label="Ayırt Edici Özellikler" 
                                        value={formData.features} 
                                        onChange={(v:any) => setFormData(f => ({...f, features: v}))} 
                                        type="textarea"
                                        color="text-cyan-400" 
                                        placeholder="Sol kulağında iz, üç bacak, beyaz leke..."
                                    />
                                </div>
                            </div>

                            {/* ─── Veli Bilgileri ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Veli (Sahip) Bilgileri</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={User} label="Veli Adı" value={formData.ownerName} onChange={(v:any) => setFormData(f => ({...f, ownerName: v}))} color="text-white" placeholder="Ad Soyad" />
                                    <SettingRow icon={Phone} label="Telefon" value={formData.ownerPhone} onChange={(v:any) => setFormData(f => ({...f, ownerPhone: v}))} type="tel" color="text-white" placeholder="+90 5xx xxx xx xx" />
                                    <SettingRow icon={MapPin} label="Adres / Bölge" value={formData.ownerAddress} onChange={(v:any) => setFormData(f => ({...f, ownerAddress: v}))} color="text-white" placeholder="Mahalle, İlçe, İl" />
                                </div>
                            </div>

                            {/* ─── Parazit Takibi ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Parazit Kontrol Tarihleri</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={ShieldCheck} label="İç Parazit Uygulaması" value={formData.parasiteInternal} onChange={(v:any) => setFormData(f => ({...f, parasiteInternal: v}))} type="date" color="text-emerald-400" />
                                    <SettingRow icon={ShieldCheck} label="Dış Parazit Uygulaması" value={formData.parasiteExternal} onChange={(v:any) => setFormData(f => ({...f, parasiteExternal: v}))} type="date" color="text-emerald-400" />
                                </div>
                            </div>

                            {/* ─── Günlük Hedefler ─── */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Günlük Hedefler</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-card-border bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={Zap} label="Aktivite Hedefi (%)" value={formData.activityTarget} onChange={(v:any) => setFormData(f => ({...f, activityTarget: Number(v) || 0}))} type="number" color="text-emerald-400" />
                                    <SettingRow icon={Droplets} label="Su Hedefi (ML)" value={formData.waterTarget} onChange={(v:any) => setFormData(f => ({...f, waterTarget: Number(v) || 0}))} type="number" color="text-blue-400" />
                                    <SettingRow icon={Flame} label="Beslenme Hedefi (KCAL)" value={formData.foodTarget} onChange={(v:any) => setFormData(f => ({...f, foodTarget: Number(v) || 0}))} type="number" color="text-orange-400" />
                                </div>
                            </div>

                            {/* ─── Danger Zone ─── */}
                            <div className="pt-12 flex flex-col gap-6">
                                <button 
                                    onClick={handleDelete}
                                    className="group w-full bg-red-500/10 border border-red-500/20 py-5 rounded-[2.5rem] text-red-500 font-black text-xs uppercase tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Trash2 className="w-4 h-4 transform group-hover:rotate-12 transition-transform" /> Pasaport Kaydını Sıfırla
                                </button>
                                <p className="text-[10px] text-white/20 text-center font-bold px-12 leading-relaxed uppercase tracking-[0.2em]">
                                    All data secured via Moffi Cloud Encryption. Changes sync across your devices instantly.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
