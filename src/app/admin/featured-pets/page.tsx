"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, Sparkles, Search, User, Calendar, RefreshCw, 
    Check, AlertTriangle, Eye, Award, Trash2, Edit3, Plus
} from "lucide-react";
import { apiService } from "@/services/apiService";

export default function FeaturedPetsManager() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [allPets, setAllPets] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    
    // 5 slots data
    const [dailyStars, setDailyStars] = useState<any[]>([]);
    const [selectedPet, setSelectedPet] = useState<any | null>(null);
    const [targetRank, setTargetRank] = useState<number>(1);
    
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

            const stars = await apiService.getDailyStars(dateStr);
            setDailyStars(stars);
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

    const handleSelectPet = (pet: any, suggestedRank: number = 1) => {
        setSelectedPet(pet);
        setTargetRank(suggestedRank);
        
        const name = pet.name;
        const breed = pet.breed || "Karışık";
        const aura = pet.auraPoints || (pet.id ? (parseInt(pet.id.replace(/-/g, '').slice(0, 5), 16) % 2000) + 1500 : 1500);
        const owner = pet.ownerName || pet.profiles?.username || "Moffi Üyesi";

        setTitle(`Günün Şampiyonu: ${name} 🐕`);
        setDescription(`${name} (${breed}) bugün sahibi @${owner} ile birlikte toplam ${aura} Aura puanı toplayarak günün en aktif patilerinden biri oldu! Tebrikler! 🎉🐾`);
        
        const badges = ["Günün Şampiyonu 👑", "Halkın Seçimi 🌸", "Stil İkonu ✨", "Aktif Pati ⚡", "Yükselen Yıldız 🚀"];
        setBadge(badges[suggestedRank - 1] || "Günün Lideri 👑");
        setMediaUrl(pet.image || pet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600");
    };

    const handleEditSlot = (slot: any) => {
        setSelectedPet({
            id: slot.pet_id,
            name: slot.pet?.name || "Evcil Hayvan",
            breed: slot.pet?.breed || "Karışık",
            image: slot.media_url,
            avatar: slot.media_url,
            ownerName: slot.ownerName || "Moffi Üyesi"
        });
        setTargetRank(slot.rank);
        setTitle(slot.title);
        setDescription(slot.description);
        setBadge(slot.badge);
        setMediaUrl(slot.media_url);
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPet) {
            showToast("Lütfen önce bir evcil hayvan seçin.", "error");
            return;
        }

        setActionLoading(true);
        try {
            await apiService.setDailyStar(dateStr, targetRank, selectedPet.id || selectedPet.pet_id, {
                title: title.trim(),
                description: description.trim(),
                badge: badge.trim(),
                media_url: mediaUrl.trim()
            });

            showToast(`Slot #${targetRank} Yıldız Patisi başarıyla yayınlandı!`);
            
            // Reload Daily Stars
            const stars = await apiService.getDailyStars(dateStr);
            setDailyStars(stars);

            // Broadcast refresh to client stories
            try {
                const channel = new BroadcastChannel('moffi_announcements_channel');
                channel.postMessage('REFRESH_STORIES');
                channel.close();
            } catch (bErr) {
                console.error("Tab sync broadcast failed:", bErr);
            }
        } catch (err) {
            console.error("Yıldız pati kaydedilemedi:", err);
            showToast("Yıldız pati yayınlanırken bir hata oluştu.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveOverride = async (rank: number) => {
        if (!confirm(`Slot #${rank} üzerindeki manuel admin seçimini kaldırmak istediğinize emin misiniz? Sistem bu sıra için en aktif aday pete otomatik dönecektir.`)) {
            return;
        }
        
        setActionLoading(true);
        try {
            await apiService.removeDailyStar(dateStr, rank);
            showToast(`Slot #${rank} manuel seçimi kaldırıldı, sistem otomatiğine dönüldü.`);
            
            const stars = await apiService.getDailyStars(dateStr);
            setDailyStars(stars);

            // Broadcast refresh
            try {
                const channel = new BroadcastChannel('moffi_announcements_channel');
                channel.postMessage('REFRESH_STORIES');
                channel.close();
            } catch (bErr) {
                console.error("Tab sync broadcast failed:", bErr);
            }
        } catch (err) {
            console.error("Manuel seçim kaldırılamadı:", err);
            showToast("Seçim kaldırılırken bir hata oluştu.", "error");
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
                        <Trophy className="w-8 h-8 text-yellow-400" /> Günün 5 Yıldız Patisi
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                        Moffi Evreni'nde günün en aktif 5 evcil hayvanını yönetin. Admin müdahale etmediğinde sistem en aktif 5 adayı otomatik yayınlar.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 rounded-2xl px-4 py-2.5 text-xs">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-zinc-300">Tarih:</span>
                    <span className="font-black text-indigo-400 tracking-wider uppercase">
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Veriler Yükleniyor...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: 5 SLOTS & CANDIDATES */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* 1. THE 5 SLOTS GRID */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Award className="w-4 h-4 text-yellow-400" /> Günün Yayındaki 5 Yıldız Pati Slotu
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {dailyStars.map((slot) => (
                                    <div 
                                        key={slot.rank} 
                                        className={`border rounded-3xl bg-gradient-to-br from-zinc-950 to-zinc-900/60 p-4 md:p-5 relative overflow-hidden transition-all flex flex-col md:flex-row gap-4 items-center ${
                                            slot.status === 'published' 
                                                ? "border-purple-500/20 shadow-lg shadow-purple-500/[0.02]" 
                                                : "border-white/5"
                                        }`}
                                    >
                                        {/* Badge showing slot number */}
                                        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-lg">
                                            #{slot.rank}
                                        </div>

                                        {/* Pet Avatar image */}
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-inner relative flex-shrink-0 bg-zinc-800">
                                            <img src={slot.media_url} className="w-full h-full object-cover" alt={slot.pet?.name || 'Star'} />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-grow min-w-0 text-center md:text-left space-y-1">
                                            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                                                <h4 className="font-extrabold text-sm text-white truncate max-w-[200px] leading-tight">
                                                    {slot.title}
                                                </h4>
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    slot.status === 'published' 
                                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/10" 
                                                        : "bg-zinc-800 text-zinc-400"
                                                }`}>
                                                    {slot.status === 'published' ? "Manuel Seçim" : "Sistem Otomatik"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                                                {slot.description}
                                            </p>
                                            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider pt-0.5">
                                                Rozet: <span className="text-yellow-400">{slot.badge}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEditSlot(slot)}
                                                className="p-2.5 bg-zinc-900 border border-white/5 text-zinc-300 hover:text-indigo-400 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer"
                                                title="Düzenle"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {slot.status === 'published' && (
                                                <button 
                                                    onClick={() => handleRemoveOverride(slot.rank)}
                                                    className="p-2.5 bg-zinc-900/60 border border-red-500/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
                                                    title="Seçimi Kaldır (Reset)"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. TOP 5 CANDIDATES LIST */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" /> Günün En Aktif 5 Aday Patisi (Hesaplanan Sıralama)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {candidates.map((cand, idx) => (
                                    <div 
                                        key={cand.id} 
                                        onClick={() => handleSelectPet(cand, idx + 1)}
                                        className={`border rounded-3xl p-4 bg-zinc-900/20 backdrop-blur-sm cursor-pointer transition-all flex items-center gap-4 group ${
                                            selectedPet?.id === cand.id 
                                                ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
                                                : "border-white/5 hover:border-white/10 hover:bg-zinc-900/40"
                                        }`}
                                    >
                                        <span className="text-zinc-600 font-black text-sm group-hover:text-indigo-400 transition-colors w-5">
                                            #{idx + 1}
                                        </span>
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5 relative flex-shrink-0 bg-zinc-800">
                                            <img src={cand.image} className="w-full h-full object-cover" alt={cand.name} />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-extrabold text-sm text-white truncate leading-none mb-1 group-hover:text-indigo-300 transition-colors">
                                                {cand.name}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-semibold truncate uppercase tracking-wider leading-none mb-1.5">@{cand.ownerName}</p>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                                                <Trophy className="w-3 h-3 text-yellow-400" /> {cand.auraPoints} Aura
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
                                <Search className="w-4 h-4 text-indigo-400" /> Tüm Patilerde Ara (Joker Arama)
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

                            {searchResults.length > 0 && (
                                <div className="bg-zinc-950 border border-white/5 rounded-2xl max-h-56 overflow-y-auto divide-y divide-white/5 custom-scrollbar animate-fadeIn">
                                    {searchResults.map(pet => (
                                        <div 
                                            key={pet.id} 
                                            onClick={() => {
                                                handleSelectPet(pet, 1);
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
                                <Eye className="w-4 h-4 text-indigo-400" /> Yıldız Pati Atama Formu
                            </h3>

                            {selectedPet ? (
                                <form onSubmit={handlePublish} className="space-y-4">
                                    {/* Selected pet preview */}
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                            <img src={selectedPet.image || selectedPet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} className="w-full h-full object-cover" alt="Selected" />
                                        </div>
                                        <div className="min-w-0 flex-grow">
                                            <h4 className="text-xs font-bold text-white leading-tight truncate">Seçilen: {selectedPet.name}</h4>
                                            <p className="text-[9px] text-zinc-500 leading-none truncate mt-0.5">
                                                @{selectedPet.ownerName || selectedPet.profiles?.username || "Moffi Üyesi"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Target Slot Selection */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hedef Sıralama (Slot)</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => setTargetRank(num)}
                                                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                                        targetRank === num
                                                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                                            : "bg-black/20 border-white/5 text-zinc-500 hover:border-white/10"
                                                    }`}
                                                >
                                                    #{num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Başlık</label>
                                        <input 
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Açıklama / Tebrik Mesajı</label>
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
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Rozet</label>
                                            <input 
                                                type="text"
                                                value={badge}
                                                onChange={(e) => setBadge(e.target.value)}
                                                required
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Görsel URL</label>
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
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_-5px_rgba(234,179,8,0.25)] hover:shadow-[0_20px_35px_-5px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" /> Slot #{targetRank} İçin Yayınla
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                                    Lütfen soldaki adaylardan veya arama sonuçlarından bir evcil hayvan seçin.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
