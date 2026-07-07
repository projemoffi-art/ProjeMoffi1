"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronLeft, Camera, Image as ImageIcon, Plus, 
    Sparkles, Palette, Maximize, Type, Music, 
    PawPrint, Clock, Heart, Lock, HeartOff, 
    MessageCircleOff, MapPin, Send, RotateCcw, 
    Trash2, Check, Smartphone, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { compressImageToFile } from '@/lib/imageUtils';

interface PostCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    userPets: any[];
    onSuccess?: () => void;
}

const MOOD_OPTIONS = ["Mutlu ✨", "Uykulu 💤", "Enerjik ⚡", "Sabırsız 🥶", "Oyunbaz 🎾", "Acıkmış 🦴", "Havalı 😎"];

const IMAGE_FILTERS = [
    { name: 'Orijinal', filter: '' },
    { name: 'Aydınlık', filter: 'brightness(1.1) contrast(1.1)' },
    { name: 'Canlı', filter: 'contrast(1.2) saturate(1.3)' },
    { name: 'Sıcak', filter: 'sepia(0.3) saturate(1.2) contrast(1.1)' },
    { name: 'Soğuk', filter: 'saturate(1.2) contrast(1.1) hue-rotate(-10deg)' },
    { name: 'Soluk', filter: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
    { name: 'Krem', filter: 'sepia(0.2) brightness(1.05) saturate(0.9)' },
    { name: 'Pastel', filter: 'contrast(0.85) brightness(1.1) saturate(1.1) sepia(0.1)' },
    { name: 'Tozlu', filter: 'sepia(0.4) contrast(0.9) brightness(1.05)' },
    { name: 'Minimal', filter: 'contrast(1.05) saturate(0.7)' },
    { name: 'Siyah Beyaz', filter: 'grayscale(1) contrast(1.2)' },
    { name: 'Sert Siyah', filter: 'grayscale(1) contrast(1.4) brightness(0.9)' },
    { name: 'Vintage', filter: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(1.2)' },
    { name: 'Nostalji', filter: 'sepia(0.8) contrast(1.2) brightness(0.8)' },
    { name: 'Sinematik', filter: 'contrast(1.3) saturate(0.8) sepia(0.2)' }
];

export default function PostCreationWizard({ isOpen, onClose, user, userPets, onSuccess }: PostCreationWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mediaURL, setMediaURL] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Gallery State
    const [galleryPhotos, setGalleryPhotos] = useState<{ url: string, file: File }[]>([]);
    const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
    const [hasGalleryPermission, setHasGalleryPermission] = useState(false);

    // Studio State
    const [activeFilterIndex, setActiveFilterIndex] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [warmth, setWarmth] = useState(0);
    const [vignette, setVignette] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<'original' | '1:1' | '4:5' | '16:9'>('original');
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [showFilterName, setShowFilterName] = useState(false);
    const touchStartX = useRef<number | null>(null);

    // Text State
    const [postText, setPostText] = useState('');
    const [postTextColor, setPostTextColor] = useState('#ffffff');
    const [postTextSize, setPostTextSize] = useState(24);
    const [postTextY, setPostTextY] = useState(50);
    const [showTextShadow, setShowTextShadow] = useState(true);

    // Finalize State
    const [caption, setCaption] = useState('');
    const [taggedPetIds, setTaggedPetIds] = useState<string[]>([]);
    const [mood, setMood] = useState<string | null>(null);
    const [privacy, setPrivacy] = useState<'everyone' | 'followers'>('everyone');
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [hideLikes, setHideLikes] = useState(false);
    const [disableComments, setDisableComments] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPhotos = files.map(file => ({
            url: URL.createObjectURL(file),
            file: file
        }));

        setGalleryPhotos(prev => [...newPhotos, ...prev]);
        setHasGalleryPermission(true);
        
        // Auto select the first one
        setSelectedFile(files[0]);
        setMediaURL(newPhotos[0].url);
        setSelectedGalleryIndex(0);
    };

    const selectFromGallery = (index: number) => {
        setSelectedGalleryIndex(index);
        setSelectedFile(galleryPhotos[index].file);
        setMediaURL(galleryPhotos[index].url);
    };

    const handleSwipeFilter = (direction: 'left' | 'right') => {
        if (direction === 'left') {
            setActiveFilterIndex((prev) => (prev + 1) % IMAGE_FILTERS.length);
        } else {
            setActiveFilterIndex((prev) => (prev - 1 + IMAGE_FILTERS.length) % IMAGE_FILTERS.length);
        }
        setShowFilterName(true);
        setTimeout(() => setShowFilterName(false), 800);
    };

    const generateAICaption = async () => {
        setIsGeneratingAI(true);
        try {
            // Simulated AI Call
            await new Promise(r => setTimeout(r, 1500));
            setCaption("Bugün harika bir gün! 🐾✨ #Moffi #PetLife");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedFile) return;
        setIsPublishing(true);
        setUploadProgress(0);

        try {
            // 1. Image Processing
            const interval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 5, 95));
            }, 100);

            // 2. Mock Upload Logic
            await new Promise(r => setTimeout(r, 2000));
            clearInterval(interval);
            setUploadProgress(100);

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Publish error:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] bg-[#000000] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 pt-12 pb-4 shrink-0 border-b border-card-border bg-black/40 backdrop-blur-md">
                        <button
                            onClick={() => {
                                if (step === 1) onClose();
                                else setStep((prev) => prev - 1 as 1 | 2);
                            }}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all active:scale-90"
                        >
                            {step === 1 ? <X className="w-5 h-5 text-white" /> : <ChevronLeft className="w-6 h-6 text-white" />}
                        </button>
                        
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-0.5">Adım {step}/3</span>
                            <h2 className="text-lg font-black text-white tracking-tight uppercase">
                                {step === 1 ? 'Yeni Gönderi' : step === 2 ? 'Moffi Stüdyo' : 'Paylaşım'}
                            </h2>
                        </div>

                        <div className="w-10 flex justify-end">
                            {(step === 1 && mediaURL) || step === 2 ? (
                                <button 
                                    onClick={() => setStep((prev) => prev + 1 as 2 | 3)} 
                                    className="text-cyan-400 font-black text-sm uppercase tracking-widest hover:text-cyan-300 transition-all active:scale-90"
                                >
                                    İleri
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {step === 1 ? (
                            <>
                                {/* Step 1: Preview (Top) */}
                                <div className="w-full aspect-square bg-black relative flex items-center justify-center overflow-hidden border-b border-card-border">
                                    {mediaURL ? (
                                        <motion.img 
                                            key={mediaURL}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            src={mediaURL} 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <ImageIcon size={48} strokeWidth={1} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Fotoğraf Seçilmedi</span>
                                        </div>
                                    )}
                                </div>

                                {/* Step 1: Gallery Grid (Bottom) */}
                                <div className="flex-1 flex flex-col bg-[#000000]">
                                    <div className="px-6 py-4 flex justify-between items-center border-b border-card-border">
                                        <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Galeri</span>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            <Camera size={12} /> Fotoğraf Ekle
                                        </button>
                                    </div>

                                    {!hasGalleryPermission && galleryPhotos.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                                            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/20">
                                                <ImageIcon size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-white font-bold">Galerinize Erişelim</h3>
                                                <p className="text-xs text-white/40 leading-relaxed">Paylaşmak istediğiniz anıları seçmek için galerinizden fotoğraf yükleyin.</p>
                                            </div>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-4 bg-card text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                            >
                                                Erişim İzni Ver
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 gap-0.5 p-0.5">
                                            {galleryPhotos.map((photo, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => selectFromGallery(idx)}
                                                    className={cn(
                                                        "aspect-square relative group overflow-hidden",
                                                        selectedGalleryIndex === idx && "opacity-40"
                                                    )}
                                                >
                                                    <img src={photo.url} className="w-full h-full object-cover" />
                                                    <div className={cn(
                                                        "absolute inset-0 border-2 transition-all",
                                                        selectedGalleryIndex === idx ? "border-cyan-400" : "border-transparent group-hover:border-card-border"
                                                    )} />
                                                </button>
                                            ))}
                                            {Array.from({ length: Math.max(0, 12 - galleryPhotos.length) }).map((_, i) => (
                                                <div key={i} className="aspect-square bg-white/[0.02]" />
                                            ))}
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                                </div>
                            </>
                        ) : step === 2 ? (
                            <>
                                <div className="w-full h-[45vh] bg-black relative flex items-center justify-center overflow-hidden border-b border-card-border">
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="w-full h-full relative group"
                                        onTouchStart={(e) => touchStartX.current = e.touches[0].clientX}
                                        onTouchEnd={(e) => {
                                            if (touchStartX.current === null) return;
                                            const diff = e.changedTouches[0].clientX - touchStartX.current;
                                            if (diff > 50) handleSwipeFilter('right');
                                            else if (diff < -50) handleSwipeFilter('left');
                                            touchStartX.current = null;
                                        }}
                                    >
                                        <div className={cn(
                                            "w-full h-full flex items-center justify-center transition-all duration-500",
                                            aspectRatio === '1:1' ? "aspect-square" : 
                                            aspectRatio === '4:5' ? "aspect-[4/5]" : 
                                            aspectRatio === '16:9' ? "aspect-video" : "h-full"
                                        )}>
                                            <img 
                                                src={mediaURL!} 
                                                className="w-full h-full object-cover transition-transform duration-500" 
                                                style={{ 
                                                    filter: `${IMAGE_FILTERS[activeFilterIndex].filter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${warmth > 0 ? warmth / 200 : 0}) hue-rotate(${warmth < 0 ? warmth / 2 : 0}deg)`,
                                                    transform: `rotate(${rotation}deg)`,
                                                }}
                                            />
                                            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent ${100 - vignette}%, rgba(0,0,0,${vignette / 100}) 100%)` }} />
                                        </div>

                                        {postText && (
                                            <div 
                                                style={{ top: `${postTextY}%`, color: postTextColor, fontSize: `${postTextSize}px`, textShadow: showTextShadow ? '0 2px 10px rgba(0,0,0,0.8)' : 'none' }}
                                                className="absolute left-0 right-0 px-8 text-center pointer-events-none z-10 font-black tracking-tight leading-tight"
                                            >
                                                {postText}
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {showFilterName && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                                    <p className="text-white font-light tracking-[0.4em] uppercase text-2xl drop-shadow-2xl">{IMAGE_FILTERS[activeFilterIndex].name}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-black flex flex-col">
                                    <div className="px-6 py-6 flex items-center justify-around border-b border-card-border">
                                        <ToolBtn icon={Palette} label="Ayar" active={activeTool === 'adjust'} onClick={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')} />
                                        <ToolBtn icon={Maximize} label="Oran" active={activeTool === 'ratio'} onClick={() => setActiveTool(activeTool === 'ratio' ? null : 'ratio')} />
                                        <ToolBtn icon={Type} label="Metin" active={activeTool === 'text'} onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')} />
                                        <ToolBtn icon={Music} label="Müzik" active={activeTool === 'mood'} onClick={() => audioInputRef.current?.click()} />
                                    </div>

                                    <div className="p-6">
                                        <AnimatePresence mode="wait">
                                            {activeTool === 'adjust' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
                                                    <Slider label="Parlaklık" value={brightness} min={50} max={150} onChange={setBrightness} />
                                                    <Slider label="Kontrast" value={contrast} min={50} max={150} onChange={setContrast} />
                                                    <Slider label="Doygunluk" value={saturation} min={0} max={200} onChange={setSaturation} />
                                                    <Slider label="Vinyet" value={vignette} min={0} max={100} onChange={setVignette} />
                                                </motion.div>
                                            )}
                                            {activeTool === 'ratio' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="grid grid-cols-4 gap-3">
                                                    {(['original', '1:1', '4:5', '16:9'] as const).map(ratio => (
                                                        <button key={ratio} onClick={() => setAspectRatio(ratio)} className={cn("py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all", aspectRatio === ratio ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-white/5 border-transparent text-white/40")}>
                                                            <span className="text-[10px] font-black uppercase">{ratio}</span>
                                                        </button>
                                                    ))}
                                                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="py-4 rounded-2xl bg-white/5 border-transparent text-white/40 flex flex-col items-center gap-2">
                                                        <RotateCcw size={16} />
                                                        <span className="text-[10px] font-black uppercase">Döndür</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                            {activeTool === 'text' && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                                                    <input 
                                                        type="text" value={postText} onChange={(e) => setPostText(e.target.value)} 
                                                        placeholder="Buraya bir şeyler yaz..."
                                                        className="w-full bg-white/5 border border-card-border rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500"
                                                    />
                                                    <div className="flex gap-3">
                                                        {['#ffffff', '#000000', '#facc15', '#ef4444', '#22d3ee'].map(c => (
                                                            <button key={c} onClick={() => setPostTextColor(c)} className={cn("w-8 h-8 rounded-full border-2", postTextColor === c ? "border-cyan-400" : "border-card-border")} style={{ backgroundColor: c }} />
                                                        ))}
                                                    </div>
                                                    <Slider label="Yükseklik" value={postTextY} min={0} max={100} onChange={setPostTextY} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </>
                        ) : step === 3 && (
                            <div className="flex-1 overflow-y-auto bg-[#000000] flex flex-col">
                                <div className="p-6 space-y-8 pb-40">
                                    <div className="flex gap-4">
                                        <img src={user?.avatar || "https://api.dicebear.com/7.x/notionists/svg?seed=User"} className="w-12 h-12 rounded-full border border-card-border" />
                                        <div className="flex-1 bg-white/[0.03] rounded-3xl p-4 border border-card-border relative">
                                            <textarea 
                                                value={caption} 
                                                onChange={(e) => setCaption(e.target.value)}
                                                placeholder="Neler oluyor anlat..." 
                                                className="w-full bg-transparent outline-none text-white resize-none min-h-[120px]"
                                            />
                                            <button 
                                                onClick={generateAICaption}
                                                disabled={isGeneratingAI}
                                                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/20"
                                            >
                                                {isGeneratingAI ? <div className="w-3 h-3 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" /> : <Sparkles size={12} />}
                                                {isGeneratingAI ? "Yazılıyor..." : "AI Yazsın"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Section title="Etiketle" icon={PawPrint}>
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                                                {userPets?.map(pet => (
                                                    <button 
                                                        key={pet.id} 
                                                        onClick={() => setTaggedPetIds(prev => prev.includes(pet.id) ? prev.filter(id => id !== pet.id) : [...prev, pet.id])}
                                                        className="flex flex-col items-center gap-2 shrink-0"
                                                    >
                                                        <div className={cn("w-14 h-14 rounded-full border-2 p-0.5", taggedPetIds.includes(pet.id) ? "border-cyan-500" : "border-card-border")}>
                                                            <img src={pet.avatar} className="w-full h-full rounded-full object-cover" />
                                                        </div>
                                                        <span className="text-[10px] text-white/40 font-bold">{pet.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </Section>

                                        <Section title="Ruh Hali" icon={Heart}>
                                            <div className="flex flex-wrap gap-2">
                                                {MOOD_OPTIONS.map(m => (
                                                    <button key={m} onClick={() => setMood(mood === m ? null : m)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", mood === m ? "bg-card text-black" : "bg-white/5 text-white/40")}>
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </Section>

                                        <div className="space-y-4">
                                            <ToggleRow icon={Lock} label="Gizlilik" value={privacy === 'everyone' ? 'Herkes' : 'Takipçi'} onClick={() => setPrivacy(p => p === 'everyone' ? 'followers' : 'everyone')} />
                                            <ToggleRow icon={MapPin} label="Konum" value={locationEnabled ? 'Açık' : 'Kapalı'} onClick={() => setLocationEnabled(!locationEnabled)} />
                                            <ToggleRow icon={HeartOff} label="Beğeni Gizle" value={hideLikes ? 'Evet' : 'Hayır'} onClick={() => setHideLikes(!hideLikes)} />
                                            <ToggleRow icon={MessageCircleOff} label="Yorum Kapat" value={disableComments ? 'Evet' : 'Hayır'} onClick={() => setDisableComments(!disableComments)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent">
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className={cn(
                                            "w-full py-5 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95",
                                            isPublishing ? "bg-white/10" : "bg-gradient-to-r from-cyan-400 to-purple-600 shadow-cyan-500/20"
                                        )}
                                    >
                                        {isPublishing ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-card-border border-t-white rounded-full animate-spin" />
                                                <span className="uppercase tracking-widest text-xs">{uploadProgress}% Yükleniyor</span>
                                            </div>
                                        ) : (
                                            <><Send size={20} /> Paylaş</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ToolBtn({ icon: Icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", active ? "bg-cyan-500 text-black scale-110" : "bg-white/5 text-white/40 group-hover:bg-white/10")}>
                <Icon size={20} />
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-cyan-400" : "text-white/20")}>{label}</span>
        </button>
    );
}

function Slider({ label, value, min, max, onChange }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-white/20">{label}</span>
                <span className="text-cyan-400">{Math.round(value)}%</span>
            </div>
            <input 
                type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
            />
        </div>
    );
}

function Section({ title, icon: Icon, children }: any) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest px-1">
                <Icon size={12} />
                <span>{title}</span>
            </div>
            {children}
        </div>
    );
}

function ToggleRow({ icon: Icon, label, value, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-card-border rounded-2xl hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"><Icon size={16} /></div>
                <span className="text-xs font-bold text-white/80">{label}</span>
            </div>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{value}</span>
        </button>
    );
}
