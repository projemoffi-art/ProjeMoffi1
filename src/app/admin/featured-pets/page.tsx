"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, Sparkles, Search, User, Calendar, RefreshCw, 
    Check, AlertTriangle, Eye, ArrowRight, ShieldAlert, Award,
    Clock, Heart, Play
} from "lucide-react";
import { apiService } from "@/services/apiService";

export default function FeaturedPetsManager() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [allPets, setAllPets] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPet, setSelectedPet] = useState<any | null>(null);
    const [dailyStar, setDailyStar] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [badge, setBadge] = useState("Günün Yıldızı 🌟");
    const [mediaUrl, setMediaUrl] = useState("");

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Get today formatted as YYYY-MM-DD local time
    const getTodayDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dateStr = getTodayDateString();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await apiService.getDailyStarCandidates();
            setCandidates(list);

            const all = await apiService.getAllPetsAdmin();
            setAllPets(all);

            const star = await apiService.getDailyStar(dateStr);
            setDailyStar(star);
        } catch (err) {
            console.error("Yıldız pati verileri yüklenemedi:", err);
            showToast("Veriler yüklenirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [dateStr]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle search filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = allPets.filter(pet => 
            pet.name.toLowerCase().includes(query) || 
            (pet.breed && pet.breed.toLowerCase().includes(query)) ||
            (pet.profiles?.username && pet.profiles.username.toLowerCase().includes(query))
        );
        setSearchResults(filtered);
    }, [searchQuery, allPets]);

    const handleSelectPet = (pet: any) => {
        setSelectedPet(pet);
        
        // Compute default pre-fills
        const name = pet.name;
        const breed = pet.breed || "Karışık";
        const aura = pet.auraPoints || (pet.id ? (parseInt(pet.id.replace(/-/g, '').slice(0, 5), 16) % 2000) + 1500 : 1500);
        const owner = pet.ownerName || pet.profiles?.username || "Moffi Üyesi";

        setTitle(`Günün Şampiyonu: ${name} 🐕`);
        setDescription(`${name} (${breed}) bugün sahibi @${owner} ile birlikte toplam ${aura} Aura puanı toplayarak günün en aktif patisi oldu! Tebrikler! 🎉🐾`);
        setBadge("Günün Lideri 👑");
        setMediaUrl(pet.image || pet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600");
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPet) {
            showToast("Lütfen önce bir evcil hayvan seçin.", "error");
            return;
        }

        setActionLoading(true);
        try {
            await apiService.setDailyStar(dateStr, selectedPet.id || selectedPet.pet_id, {
                title: title.trim(),
                description: description.trim(),
                badge: badge.trim(),
                media_url: mediaUrl.trim()
            });

            showToast("Günün Yıldız Patisi başarıyla yayınlandı!");
            
            // Reload Daily Star
            const star = await apiService.getDailyStar(dateStr);
            setDailyStar(star);

            // Broadcast real-time refresh to users
            try {
                const channel = new BroadcastChannel('moffi_announcements_channel');
                channel.postMessage('REFRESH_STORIES');
                channel.close();
            } catch (broadcastErr) {
                console.error("Tab sync broadcast failed:", broadcastErr);
            }
        } catch (err) {
            console.error("Yıldız pati kaydedilemedi:", err);
            showToast("Yıldız pati yayınlanırken bir hata oluştu.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050508] text-white p-6 md:p-8 space-y-8 select-none relative overflow-hidden">
            {/* Background decorative glow spots */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* TOAST SYSTEM */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-[250] flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider backdrop-blur-xl shadow-2xl ${
                            toast.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                    >
                        {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" /> Günün Yıldız Patisi
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                        Moffi Evreni'nde günün en aktif evcil hayvanlarını listeyin, ödüllendirin ve hikayeler (Stories) sekmesinde manşet yapın.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 rounded-2xl px-4 py-2.5 text-xs">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-zinc-300">Tarih:</span>
                    <span className="font-black text-indigo-400 tracking-wider uppercase">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Sistem yükleniyor...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: ACTIVE STAR & CANDIDATES */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* 1. CURRENT ACTIVE DAILY STAR CARD */}
                        <div className="border border-white/5 rounded-[2.5rem] bg-gradient-to-br from-zinc-950 to-zinc-900/60 p-6 md:p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/5 blur-[60px] rounded-full pointer-events-none" />
                            
                            <div className="flex items-start justify-between mb-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-400" /> Günün Yayındaki Yıldızı
                                </h3>
                                {dailyStar && (
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                                        dailyStar.status === 'published' 
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                        {dailyStar.status === 'published' ? "MÜDAHALE (MANUEL)" : "23:59 GÜNLÜK YEDEK (AUTO)"}
                                    </span>
                                )}
                            </div>

                            {dailyStar ? (
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    {/* Cover image */}
                                    <div className="w-full md:w-44 h-44 rounded-3xl overflow-hidden border border-white/10 shadow-inner relative flex-shrink-0">
                                        <img src={dailyStar.media_url} className="w-full h-full object-cover" alt="Featured Pet" />
                                        <span className="absolute top-3 left-3 text-[8px] font-black tracking-wider bg-yellow-400 text-zinc-950 px-2 py-0.5 rounded shadow">
                                            {dailyStar.badge}
                                        </span>
                                    </div>
                                    {/* Text content */}
                                    <div className="flex-grow space-y-3 w-full text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <h2 className="text-xl font-black tracking-tight text-white leading-none">
                                                {dailyStar.title}
                                            </h2>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                            {dailyStar.description}
                                        </p>
                                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-4 justify-center md:justify-start text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            <span>🐾 Pati ID: <span className="text-zinc-300 font-mono">{dailyStar.pet_id.slice(0, 8)}...</span></span>
                                            <span>📅 Tarih: <span className="text-zinc-300">{dailyStar.date}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                    Bugün henüz yayında bir yıldız pati bulunmuyor.
                                </div>
                            )}
                        </div>

                        {/* 2. TOP 5 CANDIDATES LIST */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" /> Günün En Aktif 5 Aday Patisi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {candidates.map((cand, idx) => (
                                    <div 
                                        key={cand.id} 
                                        onClick={() => handleSelectPet(cand)}
                                        className={`border rounded-3xl p-4 bg-zinc-900/20 backdrop-blur-sm cursor-pointer transition-all flex items-center gap-4 group ${
                                            selectedPet?.id === cand.id 
                                                ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
                                                : "border-white/5 hover:border-white/10 hover:bg-zinc-900/40"
                                        }`}
                                    >
                                        {/* Rank bubble */}
                                        <span className="text-zinc-600 font-black text-sm group-hover:text-indigo-400 transition-colors w-5">
                                            #{idx + 1}
                                        </span>
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5 relative flex-shrink-0 bg-zinc-800">
                                            <img src={cand.image} className="w-full h-full object-cover" alt={cand.name} />
                                        </div>
                                        {/* Info */}
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-extrabold text-sm text-white truncate leading-none mb-1 group-hover:text-indigo-300 transition-colors">
                                                {cand.name}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-semibold truncate uppercase tracking-wider leading-none mb-1.5">{cand.breed}</p>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                                                <Trophy className="w-3 h-3" /> {cand.auraPoints} Aura
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MANUAL SEARCH & PUBLISHING FORM */}
                    <div className="space-y-6">
                        {/* 1. MANUAL SEARCH CONSOLE */}
                        <div className="border border-white/5 rounded-[2rem] bg-zinc-900/20 backdrop-blur-xl p-5 space-y-4 shadow-xl">
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-400" /> Tüm Patilerde Ara (Joker)
                            </h3>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Evcil hayvan adı, cins veya sahip ara..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors"
                                />
                                <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>

                            {/* Search Results list dropdown-style */}
                            {searchResults.length > 0 && (
                                <div className="bg-zinc-950 border border-white/5 rounded-2xl max-h-56 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                                    {searchResults.map(pet => (
                                        <div 
                                            key={pet.id} 
                                            onClick={() => {
                                                handleSelectPet(pet);
                                                setSearchQuery("");
                                            }}
                                            className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                                <img src={pet.image || pet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" alt={pet.name} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-white truncate leading-tight">{pet.name}</h4>
                                                <p className="text-[9px] text-zinc-500 truncate leading-none uppercase tracking-wider mt-0.5">
                                                    @{pet.profiles?.username || 'Moffi Üyesi'} • {pet.breed || 'Cins Bilgisi Yok'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. FEATURE/PUBLISHING FORM */}
                        <div className="border border-white/5 rounded-[2rem] bg-zinc-900/20 backdrop-blur-xl p-5 shadow-xl">
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-4">
                                <Eye className="w-4 h-4 text-indigo-400" /> Yıldız Pati Yapılandırma
                            </h3>

                            {selectedPet ? (
                                <form onSubmit={handlePublish} className="space-y-4">
                                    {/* Selected pet preview */}
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                            <img src={selectedPet.image || selectedPet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" alt="Selected" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white leading-tight">Yıldız Adayı: {selectedPet.name}</h4>
                                            <p className="text-[9px] text-zinc-500 leading-none mt-0.5">
                                                Sahibi: @{selectedPet.ownerName || selectedPet.profiles?.username || "Moffi Üyesi"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Duyuru Başlığı</label>
                                        <input 
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Açıklama (Tebrik Mesajı)</label>
                                        <textarea 
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            rows={4}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Kategori / Rozet</label>
                                            <input 
                                                type="text"
                                                value={badge}
                                                onChange={(e) => setBadge(e.target.value)}
                                                required
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Görsel (Görsel URL)</label>
                                            <input 
                                                type="text"
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                                required
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none truncate"
                                            />
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_-5px_rgba(234,179,8,0.25)] hover:shadow-[0_20px_35px_-5px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {actionLoading ? (
                                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Trophy className="w-4 h-4" /> Günün Yıldızı Yap
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                                    Lütfen soldaki adaylardan birini seçin veya arama yapın.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
