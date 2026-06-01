"use client";

import { useState, useEffect } from "react";
import { Dog, Cat, Bird, Heart, User, Camera, ChevronRight, Crown, Star, Zap, CheckCircle2, XCircle, Sparkles, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface SetupProps {
    onComplete: () => void;
}

type SetupStep = 1 | 2; // 1: Profile, 2: Pet

export function SetupWizard({ onComplete }: SetupProps) {
    const { user, updateProfile } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const [step, setStep] = useState<SetupStep>(1);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'elite'>('free');

    // Avatar State
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Profile State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);

    // Debounced username check
    useEffect(() => {
        if (username.length < 3) {
            setIsUsernameTaken(false);
            return;
        }

        const checkUsername = async () => {
            setIsCheckingUsername(true);
            try {
                const { apiService } = await import("@/services/apiService");
                const isAvailable = await apiService.isUsernameAvailable(username);
                setIsUsernameTaken(!isAvailable);
            } catch (err) {
                console.error("Username check failed", err);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username]);

    // Pet State
    const [petName, setPetName] = useState("");
    const [petType, setPetType] = useState<'dog' | 'cat' | 'bird' | 'other'>('dog');
    const [petFile, setPetFile] = useState<File | null>(null);
    const [petPreview, setPetPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handlePetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPetFile(file);
            setPetPreview(URL.createObjectURL(file));
        }
    };

    const handleFinish = async () => {
        if (isUploading) return;
        setIsUploading(true);
        setUsernameError("");
        
        // Define steps for professional tracking
        const steps = {
            media: "Görseller yükleniyor...",
            pet: "Dostunuz kaydediliyor...",
            profile: "Profil mühürleniyor...",
            finalize: "Evren kapıları açılıyor..."
        };

        try {
            const { apiService } = await import("@/services/apiService");
            
            // STEP 1: USER AVATAR
            setUploadStatus(steps.media);
            setUploadProgress(15);
            let finalAvatarUrl = user?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300";
            if (avatarFile) {
                try {
                    finalAvatarUrl = await apiService.uploadMedia(avatarFile, 'avatars');
                    setUploadProgress(40);
                } catch (e) {
                    console.warn("Avatar upload failed, using default", e);
                }
            }

            // STEP 2: PET AVATAR
            setUploadProgress(50);
            let finalPetUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300";
            if (petFile) {
                try {
                    finalPetUrl = await apiService.uploadMedia(petFile, 'pets');
                    setUploadProgress(75);
                } catch (e) {
                    console.warn("Pet photo upload failed, using default", e);
                }
            }

            // STEP 3: CREATE PET
            setUploadStatus(steps.pet);
            try {
                await apiService.addPet({
                    name: petName,
                    type: petType,
                    image: finalPetUrl,
                });
                setUploadProgress(85);
            } catch (e) {
                console.error("Critical: Pet creation failed", e);
            }

            // STEP 4: UPDATE PROFILE & FINISH
            setUploadStatus(steps.profile);
            const finalUsername = username.trim();
            const finalName = name.trim() || finalUsername;

            await updateProfile({
                username: finalUsername,
                name: finalName,
                bio: `Merhaba! Ben ${finalName}. İlk dostum ${petName} (${petType}).`,
                avatar: finalAvatarUrl,
                subscription_status: selectedPlan,
                is_setup_completed: true
            });
            
            setUploadProgress(100);
            setUploadStatus(steps.finalize);
            
            // Force a small delay for UI transition smoothness
            await new Promise(r => setTimeout(r, 800));
            
            // Success! Trigger completion
            onComplete();

        } catch (err: any) {
            console.error("Setup execution error:", err);
            setUsernameError(`Sistem Hatası: ${err.message || 'Lütfen tekrar deneyin.'}`);
            setIsUploading(false);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (name && username) {
                setIsUploading(true);
                setUsernameError("");
                try {
                    const { apiService } = await import("@/services/apiService");
                    const isAvailable = await apiService.isUsernameAvailable(username);
                    if (isAvailable) {
                        setStep(2);
                    } else {
                        setUsernameError("Bu kullanıcı adı zaten alınmış! 🐾");
                    }
                } catch (err) {
                    setStep(2); // Fallback if check fails
                } finally {
                    setIsUploading(false);
                }
            }
        } else if (step === 2 && petName) {
            handleFinish();
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent font-sans relative overflow-hidden notranslate" translate="no">
            {/* Progress Visualization */}
            <div className="h-2 flex gap-2 px-10 pt-10 relative">
                {[1, 2].map((s) => (
                    <div 
                        key={s} 
                        className={cn(
                            "h-full flex-1 rounded-full transition-all duration-700", 
                            step >= s ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-white/10"
                        )} 
                    />
                ))}
            </div>

            {/* Language Switcher (Only Step 1) */}
            {step === 1 && (
                <div className="absolute top-10 right-10 flex gap-2 z-50">
                    <button 
                        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                        className="p-2 bg-white/5 border border-card-border rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'tr' ? 'EN' : 'TR'}</span>
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-10 pt-12">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{t('setup.step1.title')}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">{t('setup.step1.subtitle')}</p>
                            </div>

                            <div className="flex justify-center py-6">
                                <label
                                    htmlFor="profile-upload"
                                    className="w-36 h-36 bg-white/5 rounded-[2.5rem] flex items-center justify-center relative border border-card-border shadow-2xl cursor-pointer overflow-hidden group"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-10 h-10 text-gray-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-[8px] font-black text-foreground uppercase tracking-widest">{t('setup.step1.add_photo')}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('setup.step1.full_name')}</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        type="text"
                                        className="w-full px-6 py-5 bg-white/5 rounded-2xl border border-card-border focus:border-cyan-500/50 outline-none text-white placeholder-gray-800"
                                        placeholder="Örn: Ayşe Yılmaz"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('setup.step1.username')}</label>
                                    <div className="relative">
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                                            type="text"
                                            className={cn(
                                                "w-full px-6 py-5 bg-white/5 rounded-2xl border outline-none text-white placeholder-gray-800 transition-all",
                                                isUsernameTaken ? "border-red-500 bg-red-500/5" : (username.length >= 3 && !isCheckingUsername ? "border-emerald-500/30 bg-emerald-500/5" : "border-card-border focus:border-cyan-500/50")
                                            )}
                                            placeholder="@ayseyilmaz"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {isCheckingUsername && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
                                            {!isCheckingUsername && username.length >= 3 && (
                                                isUsernameTaken ? 
                                                <XCircle className="w-5 h-5 text-red-500" /> : 
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest ml-2 transition-colors",
                                        isUsernameTaken ? "text-red-500" : "text-gray-600 opacity-40"
                                    )}>
                                        {isUsernameTaken ? "Bu kullanıcı adı daha önce kapılmış! 🐾" : "Sadece küçük harf, rakam ve alt çizgi."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{t('setup.step2.title')}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">{t('setup.step2.subtitle')}</p>
                            </div>

                            <div className="flex justify-center">
                                <label 
                                    htmlFor="pet-upload"
                                    className="w-32 h-32 bg-orange-500/5 rounded-3xl border border-orange-500/20 flex items-center justify-center relative shadow-2xl overflow-hidden cursor-pointer group"
                                >
                                    {petPreview ? (
                                        <img src={petPreview} alt="Pet" className="w-full h-full object-cover" />
                                    ) : (
                                        <Dog className="w-12 h-12 text-orange-400 group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="absolute inset-0 bg-orange-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input type="file" id="pet-upload" className="hidden" accept="image/*" onChange={handlePetFileChange} />
                                </label>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('setup.step2.pet_type')}</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { id: 'dog', icon: Dog, label: t('setup.step2.dog') },
                                            { id: 'cat', icon: Cat, label: t('setup.step2.cat') },
                                            { id: 'bird', icon: Bird, label: t('setup.step2.bird') },
                                            { id: 'other', icon: Heart, label: t('setup.step2.other') },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setPetType(item.id as any)}
                                                className={cn(
                                                    "py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                                                    petType === item.id 
                                                        ? "border-orange-500 bg-orange-500/10 text-orange-400" 
                                                        : "border-card-border bg-white/5 text-gray-600"
                                                )}
                                            >
                                                <item.icon className="w-6 h-6" />
                                                <span className="text-[8px] font-black">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">{t('setup.step2.pet_name')}</label>
                                    <input
                                        value={petName}
                                        onChange={(e) => setPetName(e.target.value)}
                                        type="text"
                                        className="w-full px-6 py-5 bg-white/5 rounded-2xl border border-card-border focus:border-orange-500/50 outline-none text-white placeholder-gray-800"
                                        placeholder="Örn: Pamuk"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}


                </AnimatePresence>
            </div>

            {/* Bottom Global Action Area */}
            <div className="p-10 pb-12 bg-transparent">
                {usernameError && (
                    <div className="mb-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                        {usernameError}
                    </div>
                )}
                <button
                    onClick={handleNext}
                    disabled={(step === 1 && (!name || !username)) || (step === 2 && !petName) || isUploading}
                    className="group relative w-full bg-card text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] overflow-hidden active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {step === 2 ? t('setup.step3.launch') : t('setup.step3.continue')}
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </span>
                </button>
            </div>


            
            {/* Ambient Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full" />
                 <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
            </div>
            {/* UPLOADING OVERLAY */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center"
                    >
                        <div className="w-full max-w-xs space-y-8">
                            <div className="relative">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-32 h-32 rounded-[2.5rem] border-2 border-dashed border-cyan-500/30 mx-auto"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{uploadStatus}</h3>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">{uploadProgress}% TAMAMLANDI</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
