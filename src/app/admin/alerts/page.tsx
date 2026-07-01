"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Megaphone, Plus, Trash, Radio, Link as LinkIcon, 
    Sparkles, Clock, Loader2, Database, AlertCircle, 
    CheckCircle, MessageSquare, ArrowLeft, Eye
} from "lucide-react";
import { apiService, isSupabaseEnabled } from "@/services/apiService";
import { SystemAnnouncement } from "@/services/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Premium Ambient GlassCard
const GlassCard = ({ children, className, glowColor = "rgba(99, 102, 241, 0.05)" }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl",
        className
    )}>
        <div 
            className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] pointer-events-none rounded-full"
            style={{ backgroundColor: glowColor }}
        />
        <div className="relative z-10">{children}</div>
    </div>
);

export default function AdminAnnouncementsPage() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [mediaUrl, setMediaUrl] = useState("https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600");
    const [badge, setBadge] = useState("Duyuru");
    const [ctaText, setCtaText] = useState("İncele ⚡");
    const [ctaType, setCtaType] = useState<any>("toast");
    const [ctaValue, setCtaValue] = useState("Moffi'ye hoş geldiniz!");
    const [durationDays, setDurationDays] = useState(7);
    const [formError, setFormError] = useState("");

    // Custom Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAnnouncements();
            setAnnouncements(data || []);
        } catch (error) {
            console.error("Duyurular yüklenirken hata:", error);
            showToast("Duyurular yüklenemedi.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Form Submission
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!title.trim() || !description.trim()) {
            setFormError("Lütfen başlık ve açıklama alanlarını doldurun.");
            return;
        }

        setActionLoading(true);
        try {
            const expiresAt = new Date(Date.now() + 86400000 * durationDays).toISOString();
            
            await apiService.addAnnouncement({
                title: title.trim(),
                description: description.trim(),
                media_url: mediaUrl.trim(),
                badge: badge.trim(),
                cta_text: ctaText.trim(),
                cta_type: ctaType,
                cta_value: ctaValue.trim(),
                expires_at: expiresAt
            });

            showToast("Yeni duyuru başarıyla yayınlandı!");
            setIsFormOpen(false);
            
            // Reset Form
            setTitle("");
            setDescription("");
            setMediaUrl("https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600");
            setBadge("Duyuru");
            setCtaText("İncele ⚡");
            setCtaType("toast");
            setCtaValue("Moffi'ye hoş geldiniz!");
            setDurationDays(7);

            // Fetch list and trigger dynamic sync
            await fetchAnnouncements();
            window.dispatchEvent(new CustomEvent('moffi_announcements_changed'));
        } catch (error) {
            console.error("Duyuru oluşturma hatası:", error);
            showToast("Duyuru oluşturulamadı.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Announcement
    const handleDelete = async (id: string) => {
        if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return;
        
        setActionLoading(true);
        try {
            await apiService.deleteAnnouncement(id);
            showToast("Duyuru yayından kaldırıldı.");
            
            await fetchAnnouncements();
            window.dispatchEvent(new CustomEvent('moffi_announcements_changed'));
        } catch (error) {
            console.error("Duyuru silme hatası:", error);
            showToast("Duyuru silinirken bir hata oluştu.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Helpers
    const getCtaLabel = (type: string) => {
        switch (type) {
            case 'toast': return 'Toast Uyarı';
            case 'url': return 'Web Linki';
            case 'coupon': return 'İndirim Kuponu';
            case 'map': return 'Harita Konumu';
            default: return type;
        }
    };

    const getRemainingTime = (expiryString: string) => {
        const diff = new Date(expiryString).getTime() - Date.now();
        if (diff <= 0) return "Süresi Doldu";
        const days = Math.floor(diff / 86400000);
        if (days > 0) return `${days} gün kaldı`;
        const hours = Math.floor(diff / 3600000);
        return `${hours} saat kaldı`;
    };

    const totalActive = announcements.filter(a => new Date(a.expires_at).getTime() > Date.now()).length;
    const totalExpired = announcements.length - totalActive;

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0 bg-[#050508] min-h-screen text-gray-400">
            {/* Global Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl"
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {toast.type === 'info' && <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HEADER --- */}
            <div className="relative group pt-10">
                <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-purple-500/10 blur-[80px] opacity-40 pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => router.push('/admin')}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 text-white" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Duyuru Yönetimi</span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                                Sistem Duyuruları
                            </h1>
                            <p className="text-white/40 font-medium text-sm mt-2 max-w-xl">
                                Moffi mobil akışındaki genel duyuru, kampanya ve güncellemeleri gerçek zamanlı olarak yayınlayın ve yönetin.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto shadow-[0_0_30px_rgba(99,102,241,0.3)] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Yeni Duyuru Yayınla
                    </button>
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-8" glowColor="rgba(34, 211, 238, 0.05)">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Aktif Duyurular</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-5xl font-black text-white tracking-tighter">{totalActive}</h3>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 font-bold">Kullanıcı akışında anlık görünen hikayeler</p>
                </GlassCard>

                <GlassCard className="p-8" glowColor="rgba(168, 85, 247, 0.05)">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Süresi Dolanlar</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter">{totalExpired}</h3>
                    <p className="text-[10px] text-white/40 mt-1 font-bold">Zaman aşımına uğramış arşiv duyurular</p>
                </GlassCard>

                <GlassCard className="p-8" glowColor="rgba(6, 182, 212, 0.05)">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Veri Tabanı Entegrasyonu</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                            {isSupabaseEnabled ? "Supabase Cloud DB" : "Yerel Depolama (Mock)"}
                        </span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-3 font-bold">
                        {isSupabaseEnabled 
                            ? "Kayıtlar Supabase bulut veritabanında güvenle saklanır." 
                            : "Geliştirici modu: Değişiklikler tarayıcı belleğine (localStorage) yazılır."}
                    </p>
                </GlassCard>
            </div>

            {/* --- LISTING & FORM AREA --- */}
            <div className="relative">
                {/* CREATE FORM MODAL OVERLAY */}
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                                onClick={() => setIsFormOpen(false)}
                            />

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-2xl bg-[#0F0F16] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Yeni Duyuru Yayınla</h3>
                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Moffi Platformu</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsFormOpen(false)}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>

                                {formError && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {formError}
                                    </div>
                                )}

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Title */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Başlık</label>
                                            <input 
                                                type="text" 
                                                value={title} 
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Duyuru başlığını girin..." 
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                                required
                                            />
                                        </div>

                                        {/* Badge Tag */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Etiket (Rozet)</label>
                                            <select 
                                                value={badge} 
                                                onChange={(e) => setBadge(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors appearance-none"
                                            >
                                                <option value="Duyuru">📢 Duyuru</option>
                                                <option value="Etkinlik">🎟️ Etkinlik</option>
                                                <option value="Sistem Güncellemesi">⚡ Sistem Güncellemesi</option>
                                                <option value="Kampanya">🎁 Kampanya / Fırsat</option>
                                                <option value="Sağlık Uyarısı">🩺 Sağlık Uyarısı</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Detay Açıklama</label>
                                        <textarea 
                                            value={description} 
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Kullanıcı hikayeyi açtığında altta görünecek detay yazısı..." 
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors h-28 resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Media URL */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Görsel (Medya) URL</label>
                                        <input 
                                            type="text" 
                                            value={mediaUrl} 
                                            onChange={(e) => setMediaUrl(e.target.value)}
                                            placeholder="Görsel linkini ekleyin..." 
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                        />
                                        <div className="mt-2 text-[10px] text-white/30 flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" /> Canlı Önizleme: 
                                            <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Medya Sekmesi ↗</a>
                                        </div>
                                    </div>

                                    {/* CTA CONFIGURATOR */}
                                    <div className="border border-white/5 rounded-3xl p-6 bg-black/25 space-y-4">
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4 text-indigo-400" /> Buton (CTA) Yapılandırma
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Eylem Tipi</label>
                                                <select 
                                                    value={ctaType} 
                                                    onChange={(e) => setCtaType(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                                >
                                                    <option value="toast">Bilgi Mesajı (Toast)</option>
                                                    <option value="url">Web Linki (URL)</option>
                                                    <option value="coupon">İndirim Kuponu</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Buton Metni</label>
                                                <input 
                                                    type="text" 
                                                    value={ctaText} 
                                                    onChange={(e) => setCtaText(e.target.value)}
                                                    placeholder="Katıl, İncele vb..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Eylem Hedefi (Değer)</label>
                                                <input 
                                                    type="text" 
                                                    value={ctaValue} 
                                                    onChange={(e) => setCtaValue(e.target.value)}
                                                    placeholder="Web linki, kupon kodu veya mesaj..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* DURATION / LIFESPAN */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-white/40">Duyuru Yayında Kalma Süresi</span>
                                            <span className="text-indigo-400">{durationDays} Gün</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="30" 
                                            value={durationDays} 
                                            onChange={(e) => setDurationDays(Number(e.target.value))}
                                            className="w-full accent-indigo-500"
                                        />
                                        <span className="text-[9px] text-white/20 block font-medium">Bu sürenin sonunda duyuru hikayesi kullanıcı akışından otomatik olarak kaldırılacaktır.</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsFormOpen(false)}
                                            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                                        >
                                            Vazgeç
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={actionLoading}
                                            className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                                            Duyuruyu Yayınla
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- MAIN DUYURULAR LISTING GRID --- */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Duyuru Bilgileri Yükleniyor...</span>
                    </div>
                ) : announcements.length === 0 ? (
                    <GlassCard className="py-24 text-center border-dashed border-2 border-white/10" glowColor="rgba(239, 68, 68, 0.02)">
                        <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Aktif Duyuru Bulunmuyor</h3>
                        <p className="text-white/40 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                            Şu anda sistemde yayınlanmış duyuru yok. Sağ üstteki butona tıklayarak hemen ilk duyurunuzu oluşturabilirsiniz!
                        </p>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.map((ann) => {
                            const isExpired = new Date(ann.expires_at).getTime() <= Date.now();
                            return (
                                <motion.div 
                                    layout
                                    key={ann.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group"
                                >
                                    <GlassCard 
                                        className={cn(
                                            "h-full flex flex-col justify-between border-white/5 transition-all group-hover:border-white/10",
                                            isExpired && "opacity-60 border-red-500/10"
                                        )}
                                        glowColor={isExpired ? "rgba(220, 38, 38, 0.02)" : "rgba(99, 102, 241, 0.04)"}
                                    >
                                        <div className="relative aspect-video w-full overflow-hidden bg-black/40 border-b border-white/5">
                                            <img src={ann.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                                            
                                            {/* Badge Tag */}
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase text-white tracking-widest shadow-lg">
                                                {ann.badge || '📢 Duyuru'}
                                            </div>

                                            {/* Expiration state */}
                                            <div className={cn(
                                                "absolute top-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5",
                                                isExpired 
                                                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            )}>
                                                <Clock className="w-3.5 h-3.5" />
                                                {getRemainingTime(ann.expires_at)}
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                                            <div className="space-y-3">
                                                <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                                                    {ann.title}
                                                </h4>
                                                <p className="text-xs text-white/40 leading-relaxed font-medium line-clamp-3">
                                                    {ann.description}
                                                </p>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                {/* CTA Summary Info */}
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block">CTA Eylemi</span>
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-white/80">{ann.cta_text}</span>
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                                            {getCtaLabel(ann.cta_type)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-white/30 truncate block max-w-full font-mono">{ann.cta_value}</span>
                                                </div>

                                                {/* Action panel */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-mono text-white/20">
                                                        ID: {ann.id.substring(0, 12)}...
                                                    </span>
                                                    <button 
                                                        onClick={() => handleDelete(ann.id)}
                                                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 flex items-center justify-center text-red-400 transition-all active:scale-95 cursor-pointer shrink-0"
                                                        title="Yayından Kaldır"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
