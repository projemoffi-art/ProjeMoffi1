"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, ShieldAlert, ShieldX, Clock, Eye, Trash2, CheckCircle,
    XCircle, RotateCcw, AlertTriangle, TrendingUp, MessageSquare, Flag,
    ChevronDown, RefreshCw, User, Calendar, Search, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdStatus = "pending" | "active" | "removed" | "all";

const STAT_COLORS = {
    pending: "bg-amber-50 border-amber-200 text-amber-700",
    active: "bg-green-50 border-green-200 text-green-700",
    removed: "bg-red-50 border-red-200 text-red-700",
    reports: "bg-purple-50 border-purple-200 text-purple-700",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: any }> = {
    active: { label: "Yayında", className: "bg-green-100 text-green-700 border border-green-200", icon: ShieldCheck },
    pending: { label: "Bekliyor", className: "bg-amber-100 text-amber-700 border border-amber-200", icon: Clock },
    removed: { label: "Kaldırıldı", className: "bg-red-100 text-red-700 border border-red-200", icon: ShieldX },
};

const VIOLATION_LABELS: Record<string, string> = {
    fee_request: "💸 Ücret Talebi",
    animal_sale: "🏷️ Hayvan Satışı",
    fake_ad: "❌ Sahte İlan",
    inappropriate: "⚠️ Uygunsuz İçerik",
    kvkk_phone: "📞 KVKK - Telefon",
    iban: "🏦 IBAN / Ödeme",
    kvkk_email: "📧 KVKK - E-posta",
    kvkk_tckn: "🪪 KVKK - TC Kimlik",
    external_link: "🔗 Dış Link",
    other: "🔍 Diğer",
};

export default function ModerationPage() {
    const [ads, setAds] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState({ pending: 0, active: 0, removed: 0, reports: 0 });
    const [filter, setFilter] = useState<AdStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAd, setSelectedAd] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // İlanlar
            const { data: adsData } = await supabase
                .from("adoption_ads")
                .select("*")
                .order("created_at", { ascending: false });

            // İhbarlar
            const { data: reportsData } = await supabase
                .from("adoption_reports")
                .select("*, adoption_ads(name, breed, image_url)")
                .order("created_at", { ascending: false })
                .limit(50);

            setAds(adsData || []);
            setReports(reportsData || []);
            setStats({
                pending: (adsData || []).filter(a => a.status === "pending").length,
                active: (adsData || []).filter(a => a.status === "active").length,
                removed: (adsData || []).filter(a => a.status === "removed").length,
                reports: (reportsData || []).filter(r => r.status === "pending").length,
            });
        } catch (err) {
            console.error("Veri yüklenemedi:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (adId: string, newStatus: "active" | "removed") => {
        setActionLoading(adId + newStatus);
        try {
            const { error } = await supabase
                .from("adoption_ads")
                .update({ status: newStatus, moderated_at: new Date().toISOString() })
                .eq("id", adId);
            if (error) throw error;
            showToast(newStatus === "active" ? "✅ İlan onaylandı!" : "🗑️ İlan kaldırıldı.", "success");
            setSelectedAd(null);
            fetchData();
        } catch (err: any) {
            showToast("Hata: " + err.message, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReportAction = async (reportId: string, action: "reviewed" | "dismissed") => {
        await supabase.from("adoption_reports").update({ status: action }).eq("id", reportId);
        showToast(action === "reviewed" ? "İhbar işleme alındı." : "İhbar reddedildi.");
        fetchData();
    };

    const filteredAds = ads.filter(ad => {
        const matchFilter = filter === "all" || ad.status === filter;
        const matchSearch = !searchQuery ||
            ad.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ad.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ad.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">İçerik Moderasyonu</h1>
                    <p className="text-sm text-gray-500 mt-1">Sahiplendirme ilanları ve kullanıcı ihbarlarını yönet</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Yenile
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { key: "pending", label: "Bekleyen", icon: Clock, value: stats.pending, color: STAT_COLORS.pending },
                    { key: "active", label: "Yayında", icon: ShieldCheck, value: stats.active, color: STAT_COLORS.active },
                    { key: "removed", label: "Kaldırılan", icon: ShieldX, value: stats.removed, color: STAT_COLORS.removed },
                    { key: "reports", label: "Açık İhbar", icon: Flag, value: stats.reports, color: STAT_COLORS.reports },
                ].map(stat => (
                    <div key={stat.key} className={cn("p-5 rounded-2xl border flex items-center gap-4", stat.color)}>
                        <div className="p-2 bg-white/60 rounded-xl">
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-3xl font-black leading-none">{stat.value}</div>
                            <div className="text-xs font-semibold mt-1 opacity-70">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {[
                        { id: "ads", label: "İlanlar", icon: ShieldAlert },
                        { id: "reports", label: "İhbarlar", icon: Flag },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { }}
                            className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600"
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* SEARCH + FILTER */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İlan adı, ırk veya kullanıcı ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(["all", "pending", "active", "removed"] as AdStatus[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition",
                                    filter === f
                                        ? "bg-indigo-600 text-white shadow"
                                        : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
                                )}
                            >
                                {f === "all" ? "Tümü" : f === "pending" ? "Bekleyen" : f === "active" ? "Yayında" : "Kaldırılan"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ADS LIST */}
                <div className="divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400 text-sm">Yükleniyor...</div>
                    ) : filteredAds.length === 0 ? (
                        <div className="p-12 text-center">
                            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">Bu kategoride ilan yok</p>
                        </div>
                    ) : (
                        filteredAds.map(ad => {
                            const badge = STATUS_BADGE[ad.status] || STATUS_BADGE.pending;
                            const BadgeIcon = badge.icon;
                            const adReports = reports.filter(r => r.ad_id === ad.id);
                            return (
                                <div
                                    key={ad.id}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition cursor-pointer group"
                                    onClick={() => setSelectedAd(ad)}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                        {ad.image_url ? (
                                            <img src={ad.image_url} className="w-full h-full object-cover" alt={ad.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 text-sm">{ad.name}</span>
                                            <span className="text-gray-400 text-xs">• {ad.breed}</span>
                                            {adReports.length > 0 && (
                                                <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Flag className="w-2.5 h-2.5" /> {adReports.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {ad.author_name || "Bilinmiyor"}
                                            <span className="mx-1">·</span>
                                            <Calendar className="w-3 h-3" /> {new Date(ad.created_at).toLocaleDateString("tr-TR")}
                                        </div>
                                        {ad.moderation_result && (
                                            <p className="text-[11px] mt-1 text-gray-400 truncate max-w-sm">
                                                🤖 {ad.moderation_result}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status + Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full", badge.className)}>
                                            <BadgeIcon className="w-3 h-3" /> {badge.label}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            {ad.status !== "active" && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleAction(ad.id, "active"); }}
                                                    disabled={actionLoading === ad.id + "active"}
                                                    className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition"
                                                    title="Onayla"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {ad.status !== "removed" && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleAction(ad.id, "removed"); }}
                                                    disabled={actionLoading === ad.id + "removed"}
                                                    className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition"
                                                    title="Kaldır"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* PENDING REPORTS SECTION */}
                {reports.filter(r => r.status === "pending").length > 0 && (
                    <div className="border-t-4 border-dashed border-red-100">
                        <div className="px-5 py-3 bg-red-50 flex items-center gap-2">
                            <Flag className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-black text-red-600 uppercase tracking-wide">Açık İhbarlar</span>
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {reports.filter(r => r.status === "pending").length}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {reports.filter(r => r.status === "pending").map(report => (
                                <div key={report.id} className="flex items-center gap-4 p-4 hover:bg-red-50/30 transition">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                        {report.adoption_ads?.image_url ? (
                                            <img src={report.adoption_ads.image_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">🐾</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-800">
                                            {report.adoption_ads?.name || "Silinmiş İlan"} — {VIOLATION_LABELS[report.reason] || report.reason}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {new Date(report.created_at).toLocaleString("tr-TR")}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleReportAction(report.id, "reviewed")}
                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                                        >
                                            <XCircle className="w-3 h-3" /> İşleme Al
                                        </button>
                                        <button
                                            onClick={() => handleReportAction(report.id, "dismissed")}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition"
                                        >
                                            Reddet
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* AD DETAIL MODAL */}
            <AnimatePresence>
                {selectedAd && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedAd(null)}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            {selectedAd.image_url && (
                                <div className="w-full h-52 bg-gray-100 relative">
                                    <img src={selectedAd.image_url} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4">
                                        <span className={cn(
                                            "text-xs font-black px-3 py-1 rounded-full",
                                            STATUS_BADGE[selectedAd.status]?.className
                                        )}>
                                            {STATUS_BADGE[selectedAd.status]?.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="p-6">
                                <h2 className="text-2xl font-black text-gray-900">{selectedAd.name}</h2>
                                <p className="text-indigo-600 font-semibold text-sm mt-1">{selectedAd.breed} • {selectedAd.age}</p>

                                <div className="mt-4 space-y-2">
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedAd.description || "Açıklama yok."}</p>
                                    </div>
                                    {selectedAd.moderation_result && (
                                        <div className={cn(
                                            "rounded-2xl p-4",
                                            selectedAd.moderation_passed === false ? "bg-red-50" : "bg-green-50"
                                        )}>
                                            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: selectedAd.moderation_passed === false ? '#dc2626' : '#16a34a' }}>
                                                🤖 Moffi AI Kararı
                                            </p>
                                            <p className="text-sm font-medium" style={{ color: selectedAd.moderation_passed === false ? '#991b1b' : '#166534' }}>
                                                {selectedAd.moderation_result}
                                            </p>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 flex items-center gap-2 pt-1">
                                        <User className="w-3 h-3" /> {selectedAd.author_name} ·
                                        <Calendar className="w-3 h-3" /> {new Date(selectedAd.created_at).toLocaleString("tr-TR")}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => handleAction(selectedAd.id, "active")}
                                        disabled={selectedAd.status === "active" || !!actionLoading}
                                        className="flex-1 bg-green-600 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition disabled:opacity-40"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedAd.id, "removed")}
                                        disabled={selectedAd.status === "removed" || !!actionLoading}
                                        className="flex-1 bg-red-600 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition disabled:opacity-40"
                                    >
                                        <XCircle className="w-5 h-5" /> Kaldır
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOAST */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={cn(
                            "fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl z-[100] text-white",
                            toast.type === "success" ? "bg-green-600" : "bg-red-600"
                        )}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
