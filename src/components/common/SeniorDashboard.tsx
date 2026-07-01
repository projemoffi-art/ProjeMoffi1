"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Heart, Phone, ShieldAlert, Sparkles, Navigation, 
    Droplets, Flame, Smile, Volume2, VolumeX, RefreshCw, X, Mic
} from "lucide-react";
import { usePet } from "@/context/PetContext";
import { useTheme } from "@/context/ThemeContext";
import { useVoiceGuide } from "@/hooks/useVoiceGuide";
import { apiService } from "@/services/apiService";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export function SeniorDashboard() {
    const { activePet } = usePet();
    const { seniorMode, setSeniorMode } = useTheme();
    const { speak, stop, getSpeakProps } = useVoiceGuide(seniorMode);
    
    const petName = activePet?.name || "Evcil Dostum";
    const petId = activePet?.id || "default-pet";
    const todayStr = new Date().toISOString().split("T")[0];

    // Local Stats
    const [foodCurrent, setFoodCurrent] = useState(0);
    const [waterCurrent, setWaterCurrent] = useState(0);
    const [isListening, setIsListening] = useState(false);
    
    // Sub-modules
    const [activeSection, setActiveSection] = useState<"home" | "nutrition" | "vet" | "walk" | "help">("home");
    
    // Quick Call Overlay
    const [ringingContact, setRingingContact] = useState<string | null>(null);

    // Walk state
    const [isWalking, setIsWalking] = useState(false);
    const [walkSeconds, setWalkSeconds] = useState(0);

    // Initial load of stats from localStorage
    useEffect(() => {
        const savedFood = localStorage.getItem(`moffi_calories_${petId}_${todayStr}`);
        const savedWater = localStorage.getItem(`moffi_water_${petId}_${todayStr}`);
        if (savedFood) setFoodCurrent(Number(savedFood));
        if (savedWater) setWaterCurrent(Number(savedWater));
    }, [petId, todayStr]);

    // Walk timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWalking) {
            interval = setInterval(() => {
                setWalkSeconds(prev => prev + 1);
            }, 1000);
        } else {
            setWalkSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isWalking]);

    // Feed logic
    const handleFeed = () => {
        const amount = 350;
        const next = foodCurrent + amount;
        setFoodCurrent(next);
        localStorage.setItem(`moffi_calories_${petId}_${todayStr}`, String(next));
        
        // Add to food log
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const logEntry = { id: Math.random().toString(), name: "Kolay Mod Maması", kcal: amount, time };
        const savedLog = JSON.parse(localStorage.getItem(`moffi_food_log_${petId}_${todayStr}`) || "[]");
        const nextLog = [logEntry, ...savedLog];
        localStorage.setItem(`moffi_food_log_${petId}_${todayStr}`, JSON.stringify(nextLog));

        window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        
        // Feedbacks
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        speak(`${petName}'e lezzetli bir mama verdiniz. Afiyet olsun!`);
        
        // Sync
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId);
        if (isUuid) {
            apiService.savePetDailyStats(petId, todayStr, {
                waterIntake: waterCurrent,
                waterTarget: 1000,
                caloriesIntake: next,
                caloriesTarget: 1500,
                foodLog: nextLog
            }).catch(e => console.error("Sync failed", e));
        }
    };

    // Water logic
    const handleWater = () => {
        const amount = 250;
        const next = waterCurrent + amount;
        setWaterCurrent(next);
        localStorage.setItem(`moffi_water_${petId}_${todayStr}`, String(next));

        window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));

        // Feedbacks
        confetti({ particleCount: 30, spread: 50, colors: ["#38bdf8"], origin: { y: 0.8 } });
        speak(`${petName}'e taze su verdiniz. Teşekkürler!`);

        // Sync
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId);
        if (isUuid) {
            const savedLog = JSON.parse(localStorage.getItem(`moffi_food_log_${petId}_${todayStr}`) || "[]");
            apiService.savePetDailyStats(petId, todayStr, {
                waterIntake: next,
                waterTarget: 1000,
                caloriesIntake: foodCurrent,
                caloriesTarget: 1500,
                foodLog: savedLog
            }).catch(e => console.error("Sync failed", e));
        }
    };

    // Emergency call logic
    const triggerCall = (contact: string) => {
        stop();
        setRingingContact(contact);
        speak(`${contact} aranıyor. Lütfen bekleyin.`);
    };

    const cancelCall = () => {
        setRingingContact(null);
        stop();
        speak("Arama sonlandırıldı.");
    };

    // Voice recognition (Speech to text) for simple commands
    const startVoiceListening = () => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            speak("Üzgünüm, tarayıcınız sesli komut özelliğini desteklemiyor.");
            return;
        }

        stop();
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            speak("Sizi dinliyorum. Lütfen komut verin.");
        };

        recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log("Voice Command Received:", command);
            setIsListening(false);

            if (command.includes("mama") || command.includes("yemek") || command.includes("besle")) {
                handleFeed();
            } else if (command.includes("su ver") || command.includes("su iç")) {
                handleWater();
            } else if (command.includes("yürüyüş") || command.includes("yürü") || command.includes("başlat")) {
                setActiveSection("walk");
                setIsWalking(true);
                speak("Yürüyüş başlatıldı.");
            } else if (command.includes("bitir") || command.includes("durdur")) {
                setIsWalking(false);
                speak("Yürüyüş tamamlandı.");
            } else if (command.includes("veteriner") || command.includes("doktor")) {
                setActiveSection("vet");
                speak("Veteriner bulma sayfası açıldı.");
            } else if (command.includes("yardım") || command.includes("acil") || command.includes("ara")) {
                setActiveSection("help");
                triggerCall("Aile Hekimi / Yakınım");
            } else if (command.includes("normal") || command.includes("kapat") || command.includes("çık")) {
                setSeniorMode(false);
                speak("Kolay arayüz kapatıldı. Normal moda dönülüyor.");
            } else {
                speak(`Söylediğinizi anlayamadım. "${command}" dediniz. Lütfen mama ver, su ver veya yardım gibi komutları deneyin.`);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            speak("Sesinizi alamadım. Lütfen tekrar deneyin.");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Format walk seconds
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans relative flex flex-col justify-between pb-24 select-none">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-[32px]">🐾</span>
                    <div>
                        <h2 className="text-[20px] font-black text-amber-400 leading-none">Moffi Kolay Arayüz</h2>
                        <p className="text-[12px] text-white/60 font-bold uppercase mt-1">Göz Dostu & Basit</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Speak Stop Button */}
                    <button 
                        onClick={() => stop()}
                        className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 active:scale-95"
                        title="Sesi Sustur"
                        {...getSpeakProps("Sesi susturmak için dokunun")}
                    >
                        <VolumeX className="w-6 h-6 text-red-400" />
                    </button>
                    {/* Voice Assistant Trigger */}
                    <button 
                        onClick={startVoiceListening}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border active:scale-95 transition-all",
                            isListening ? "bg-red-500 border-red-400 animate-pulse text-white" : "bg-amber-500/20 border-amber-500 text-amber-400"
                        )}
                        title="Sesli Konuş"
                        {...getSpeakProps("Sesli asistanı açmak için dokunun")}
                    >
                        <Mic className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Content Area based on Active Section */}
            <div className="flex-1 flex flex-col justify-center my-4">
                <AnimatePresence mode="wait">
                    {activeSection === "home" && (
                        <motion.div 
                            key="home"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {/* Pet Status Summary */}
                            <div className="bg-white/5 border-2 border-white/15 rounded-[2.5rem] p-6 text-center space-y-4">
                                <div className="w-28 h-28 bg-amber-500/10 rounded-full mx-auto flex items-center justify-center border-2 border-amber-500/30">
                                    <span className="text-[64px]" role="img" aria-label="dog">
                                        {activePet?.type || "🐶"}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-[28px] font-black text-white italic tracking-tight uppercase leading-none">{petName}</h1>
                                    <p className="text-[14px] text-amber-400 font-black uppercase tracking-wider mt-2">
                                        {foodCurrent >= 1000 && waterCurrent >= 800 ? "Bugün Çok Mutlu! 🥰" : "Bakımınızı Bekliyor 🐾"}
                                    </p>
                                </div>

                                {/* Status Progress Bars */}
                                <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-3">
                                        <Flame className="w-8 h-8 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-black text-white/50 uppercase leading-none">Beslenme</p>
                                            <p className="text-[18px] font-black text-white mt-1">{foodCurrent} kcal</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-3">
                                        <Droplets className="w-8 h-8 text-sky-400 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-black text-white/50 uppercase leading-none">Su Tüketimi</p>
                                            <p className="text-[18px] font-black text-white mt-1">{waterCurrent} ml</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Easy Options Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setActiveSection("nutrition"); speak("Besleme menüsü açıldı."); }}
                                    className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 text-center"
                                    {...getSpeakProps("Mama ve su vermek için dokunun")}
                                >
                                    <span className="text-[36px]">🍖</span>
                                    <span className="text-[16px] font-black text-white uppercase tracking-tight">Mama & Su Ver</span>
                                </button>

                                <button
                                    onClick={() => { setActiveSection("walk"); speak("Yürüyüş menüsü açıldı."); }}
                                    className="p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 text-center"
                                    {...getSpeakProps("Yürüyüşe çıkmak ve takip etmek için dokunun")}
                                >
                                    <Navigation className="w-10 h-10 text-emerald-400" />
                                    <span className="text-[16px] font-black text-white uppercase tracking-tight">Yürüyüşe Çık</span>
                                </button>

                                <button
                                    onClick={() => { setActiveSection("vet"); speak("Veteriner bulma menüsü açıldı."); }}
                                    className="p-6 bg-gradient-to-br from-sky-500/20 to-blue-500/10 border-2 border-sky-500/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 text-center"
                                    {...getSpeakProps("Veteriner bulmak ve aramak için dokunun")}
                                >
                                    <span className="text-[36px]">🩺</span>
                                    <span className="text-[16px] font-black text-white uppercase tracking-tight">Veteriner Bul</span>
                                </button>

                                <button
                                    onClick={() => { setActiveSection("help"); speak("Acil yardım ve hızlı arama menüsü açıldı."); }}
                                    className="p-6 bg-gradient-to-br from-red-500/20 to-rose-500/10 border-2 border-red-500/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 text-center"
                                    {...getSpeakProps("Acil yardım almak veya yakınlarınızı aramak için dokunun")}
                                >
                                    <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
                                    <span className="text-[16px] font-black text-white uppercase tracking-tight">Hızlı Yardım</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Nutrition Section */}
                    {activeSection === "nutrition" && (
                        <motion.div 
                            key="nutrition"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-[24px] font-black text-amber-400 uppercase text-center mb-2">Mama ve Su Kontrolü</h2>
                            
                            <div className="grid grid-cols-1 gap-5">
                                {/* Feed Button */}
                                <button 
                                    onClick={handleFeed}
                                    className="p-8 bg-amber-500 text-black border-2 border-white/20 rounded-[3rem] flex items-center justify-between active:scale-95 w-full text-left"
                                    {...getSpeakProps("Mama vermek için bu büyük sarı butona dokunun")}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-[52px]">🍖</span>
                                        <div>
                                            <p className="text-[20px] font-black uppercase">Mama Ver</p>
                                            <p className="text-[13px] font-bold opacity-80 uppercase mt-1">+350 kcal Yemek Ekler</p>
                                        </div>
                                    </div>
                                    <div className="text-[22px] font-black shrink-0 bg-black/10 px-4 py-2 rounded-full">{foodCurrent} kcal</div>
                                </button>

                                {/* Water Button */}
                                <button 
                                    onClick={handleWater}
                                    className="p-8 bg-sky-500 text-black border-2 border-white/20 rounded-[3rem] flex items-center justify-between active:scale-95 w-full text-left"
                                    {...getSpeakProps("Su vermek için bu büyük mavi butona dokunun")}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-[52px]">💧</span>
                                        <div>
                                            <p className="text-[20px] font-black uppercase">Su Ver</p>
                                            <p className="text-[13px] font-bold opacity-80 uppercase mt-1">+250 ml Su Ekler</p>
                                        </div>
                                    </div>
                                    <div className="text-[22px] font-black shrink-0 bg-black/10 px-4 py-2 rounded-full">{waterCurrent} ml</div>
                                </button>
                            </div>

                            <button 
                                onClick={() => setActiveSection("home")}
                                className="w-full py-6 bg-white/10 rounded-[2.5rem] border border-white/20 font-black text-[16px] uppercase active:scale-95"
                                {...getSpeakProps("Ana menüye geri dönmek için dokunun")}
                            >
                                Ana Menüye Dön
                            </button>
                        </motion.div>
                    )}

                    {/* Vet Section */}
                    {activeSection === "vet" && (
                        <motion.div 
                            key="vet"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-[24px] font-black text-sky-400 uppercase text-center mb-2">Yakındaki Veterinerler</h2>
                            
                            <div className="space-y-3">
                                {[
                                    { name: "Moda Veteriner Polikliniği", dist: "450 m mesafede", phone: "0216 550 10 20" },
                                    { name: "Kadıköy Merkez Hayvan Hastanesi", dist: "1.2 km mesafede", phone: "0216 333 44 55" },
                                    { name: "Pati Acil Veteriner Kliniği (7/24)", dist: "2.1 km mesafede", phone: "0216 999 88 77" }
                                ].map((vet, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-[16px] font-black text-white">{vet.name}</h3>
                                            <p className="text-[12px] text-white/50 font-bold uppercase mt-1">{vet.dist}</p>
                                        </div>
                                        <button 
                                            onClick={() => triggerCall(vet.name)}
                                            className="w-14 h-14 bg-sky-500 text-black rounded-full flex items-center justify-center shrink-0 active:scale-90"
                                            {...getSpeakProps(`${vet.name} kliniğini aramak için dokunun`)}
                                        >
                                            <Phone className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setActiveSection("home")}
                                className="w-full py-6 bg-white/10 rounded-[2.5rem] border border-white/20 font-black text-[16px] uppercase active:scale-95"
                                {...getSpeakProps("Ana menüye geri dönmek için dokunun")}
                            >
                                Ana Menüye Dön
                            </button>
                        </motion.div>
                    )}

                    {/* Walk Section */}
                    {activeSection === "walk" && (
                        <motion.div 
                            key="walk"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-center"
                        >
                            <h2 className="text-[24px] font-black text-emerald-400 uppercase mb-2">Kolay Yürüyüş Paneli</h2>
                            
                            {isWalking ? (
                                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-[2.5rem] p-8 space-y-6">
                                    <div className="text-[72px] animate-bounce">🚶‍♂️🦮</div>
                                    <div>
                                        <p className="text-[14px] text-emerald-400 font-black uppercase">Yürüyüş Süresi</p>
                                        <h3 className="text-[48px] font-black tracking-tight mt-1">{formatTime(walkSeconds)}</h3>
                                    </div>
                                    <p className="text-[13px] text-white/70 font-bold uppercase">Haritada güvenli rotada ilerliyorsunuz.</p>
                                    <button 
                                        onClick={() => { setIsWalking(false); speak("Yürüyüş tamamlandı. Harika bir iş çıkardınız!"); }}
                                        className="w-full py-7 bg-red-500 text-white rounded-[2.5rem] font-black text-[18px] uppercase active:scale-95 border-2 border-red-400"
                                        {...getSpeakProps("Yürüyüşü bitirmek için dokunun")}
                                    >
                                        Yürüyüşü Bitir
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                                    <span className="text-[64px]">🌳</span>
                                    <div>
                                        <h3 className="text-[20px] font-black uppercase">Temiz Hava Zamanı</h3>
                                        <p className="text-[12px] text-white/50 font-bold uppercase mt-2">Dostunuzla beraber yürüyüş kaydı başlatın.</p>
                                    </div>
                                    <button 
                                        onClick={() => { setIsWalking(true); speak("Yürüyüş kaydı başlatıldı. Keyifli yürüyüşler dilerim."); }}
                                        className="w-full py-7 bg-emerald-500 text-black rounded-[2.5rem] font-black text-[18px] uppercase active:scale-95 border-2 border-white/20"
                                        {...getSpeakProps("Yürüyüşü başlatmak için bu büyük yeşil butona dokunun")}
                                    >
                                        Yürüyüşü Başlat
                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={() => { setIsWalking(false); setActiveSection("home"); }}
                                className="w-full py-6 bg-white/10 rounded-[2.5rem] border border-white/20 font-black text-[16px] uppercase active:scale-95"
                                {...getSpeakProps("Ana menüye geri dönmek için dokunun")}
                            >
                                Ana Menüye Dön
                            </button>
                        </motion.div>
                    )}

                    {/* Help Section */}
                    {activeSection === "help" && (
                        <motion.div 
                            key="help"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-[24px] font-black text-red-500 uppercase text-center mb-2">Acil Hızlı Arama</h2>
                            <p className="text-[12px] text-white/60 text-center font-bold uppercase -mt-2">Tek dokunuşla yakınlarınıza haber verin.</p>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => triggerCall("Aile Hekimi / Yakınım")}
                                    className="p-8 bg-red-500 text-white border-2 border-red-400 rounded-[3rem] flex items-center justify-between active:scale-95 w-full text-left"
                                    {...getSpeakProps("Yakınınızı hemen aramak için dokunun")}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-[44px]">👨‍👩‍👦</span>
                                        <div>
                                            <p className="text-[20px] font-black uppercase">Yakınımı Ara</p>
                                            <p className="text-[12px] font-bold opacity-80 uppercase mt-1">Aile üyesine acil arama başlatır</p>
                                        </div>
                                    </div>
                                    <Phone className="w-8 h-8 text-white shrink-0" />
                                </button>

                                <button 
                                    onClick={() => triggerCall("Veteriner Hekim")}
                                    className="p-8 bg-orange-500 text-white border-2 border-orange-400 rounded-[3rem] flex items-center justify-between active:scale-95 w-full text-left"
                                    {...getSpeakProps("Veteriner hekiminizi acil aramak için dokunun")}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-[44px]">🩺</span>
                                        <div>
                                            <p className="text-[20px] font-black uppercase">Hekimimi Ara</p>
                                            <p className="text-[12px] font-bold opacity-80 uppercase mt-1">Kendi hekiminize telefon bağlar</p>
                                        </div>
                                    </div>
                                    <Phone className="w-8 h-8 text-white shrink-0" />
                                </button>
                            </div>

                            <button 
                                onClick={() => setActiveSection("home")}
                                className="w-full py-6 bg-white/10 rounded-[2.5rem] border border-white/20 font-black text-[16px] uppercase active:scale-95"
                                {...getSpeakProps("Ana menüye geri dönmek için dokunun")}
                            >
                                Ana Menüye Dön
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls / Exit */}
            <div className="border-t-2 border-white/10 pt-4 flex gap-4">
                <button
                    onClick={() => { setSeniorMode(false); speak("Standart arayüze geçiş yapılıyor."); }}
                    className="flex-1 py-6 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-[2.5rem] font-black text-[14px] uppercase active:scale-95 flex items-center justify-center gap-2"
                    {...getSpeakProps("Kolay moddan çıkıp normal moda dönmek için dokunun")}
                >
                    <RefreshCw className="w-5 h-5 text-amber-500" /> Normal Moda Dön
                </button>
            </div>

            {/* Ringing Overlay */}
            <AnimatePresence>
                {ringingContact && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-red-600 z-[99999] flex flex-col justify-between p-8 text-white text-center"
                    >
                        <div className="pt-16 space-y-4">
                            <div className="w-32 h-32 bg-white/10 rounded-full mx-auto flex items-center justify-center border-4 border-white/30 animate-pulse">
                                <Phone className="w-16 h-16 text-white" />
                            </div>
                            <div>
                                <h1 className="text-[32px] font-black tracking-tight uppercase leading-none">{ringingContact}</h1>
                                <p className="text-[16px] text-white/70 font-bold uppercase tracking-widest mt-3 animate-bounce">ARANIYOR...</p>
                            </div>
                        </div>

                        <div className="pb-16">
                            <button 
                                onClick={cancelCall}
                                className="w-full py-8 bg-black hover:bg-black/90 text-white rounded-[3rem] border-4 border-white/20 font-black text-[22px] uppercase active:scale-95 shadow-2xl flex items-center justify-center gap-4"
                            >
                                <X className="w-8 h-8 text-red-500" /> ARAMAYI KAPAT
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
