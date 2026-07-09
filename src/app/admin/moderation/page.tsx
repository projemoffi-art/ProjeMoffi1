"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, Clock, ShieldX, CheckCircle,
    XCircle, Flag, Search, User, Calendar, RefreshCw, ShieldAlert,
    ChevronRight, Filter, Info, Trash2, Check, AlertTriangle, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AdStatus = "pending" | "active" | "removed" | "all";

const STAT_COLORS = {
    pending: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    removed: "bg-red-500/10 border-red-500/20 text-red-500",
    reports: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: any }> = {
    active: { label: "ACTIVE", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: ShieldCheck },
    pending: { label: "PENDING", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20", icon: Clock },
    removed: { label: "REMOVED", className: "bg-red-500/10 text-red-500 border border-red-500/20", icon: ShieldX },
};

export default function ModerationMatrix() {
    const [ads, setAds] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState({ pending: 0, active: 0, removed: 0, reports: 0 });
    const [filter, setFilter] = useState<AdStatus>("all");
    const [activeTab, setActiveTab] = useState<"ads" | "reports">("ads");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAd, setSelectedAd] = useState<any | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: adsData, error: adsError } = await supabase
                .from('adoption_pets')
                .select('*')
                .order('created_at', { ascending: false });

            if (adsError) throw adsError;

            const { data: reportsData, error: reportsError } = await supabase
                .from('adoption_reports')
                .select('*, adoption_pets(name, breed)')
                .order('created_at', { ascending: false });

            if (reportsError) throw reportsError;

            // Map data to UI expectations if necessary
            const realAds = (adsData || []).map(ad => ({
                id: ad.id,
                name: ad.name,
                breed: ad.breed,
                status: ad.status || 'pending',
                author_name: ad.user_id ? 'User' : 'Unknown', // Ideally join users table, mock for now
                created_at: ad.created_at,
                location: ad.location || 'Bilinmiyor',
                desc: ad.description || ''
            }));

            const realReports = (reportsData || []).map(r => ({
                id: r.id,
                targetType: 'post',
                targetId: r.ad_id,
                content: `İlan: ${(r as any).adoption_pets?.name || 'Bilinmiyor'} (${(r as any).adoption_pets?.breed || 'Bilinmiyor'})`,
                authorName: 'System', 
                reportedBy: r.reported_by || 'Anonim',
                reason: r.reason,
                details: r.details,
                status: r.status || 'pending',
                created_at: r.created_at
            }));

            setAds(realAds);
            setReports(realReports);
            
            // Recalculate stats
            const pendingAdsCount = realAds.filter(a => a.status === 'pending').length;
            const activeAdsCount = realAds.filter(a => a.status === 'active').length;
            const removedAdsCount = realAds.filter(a => a.status === 'removed').length;
            const pendingReportsCount = realReports.filter(r => r.status === 'pending').length;
            
            setStats({
                pending: pendingAdsCount,
                active: activeAdsCount,
                removed: removedAdsCount,
                reports: pendingReportsCount
            });
        } catch (err) {
            console.error("Error fetching moderation data:", err);
            showToast("Veri çekme hatası", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (adId: string, newStatus: "active" | "removed") => {
        try {
            await supabase.from('adoption_pets').update({ status: newStatus }).eq('id', adId);
            
            setAds(prev => prev.map(a => a.id === adId ? { ...a, status: newStatus } : a));
            // Update stats
            setStats(prev => ({
                ...prev,
                pending: Math.max(0, prev.pending - (ads.find(a => a.id === adId)?.status === 'pending' ? 1 : 0)),
                [newStatus]: prev[newStatus] + 1
            }));
            showToast(newStatus === "active" ? "Protocol Synced: Ad Approved" : "Protocol Synced: Ad Removed");
            setSelectedAd(null);
        } catch (err) {
            console.error("Failed to update ad status", err);
            showToast("Hata oluştu", "error");
        }
    };

    const handleReportAction = async (reportId: string, action: 'removed' | 'dismissed') => {
        let reportToProcess = reports.find(r => r.id === reportId);
        if (!reportToProcess) return;

        try {
            await supabase.from('adoption_reports').update({ status: action }).eq('id', reportId);

            // Update the report status
            const updatedReports = reports.map(r => r.id === reportId ? { ...r, status: action } : r);
            setReports(updatedReports);

            // Recalculate stats
            setStats(prev => ({
                ...prev,
                reports: Math.max(0, prev.reports - (reportToProcess.status === 'pending' ? 1 : 0))
            }));

            showToast(action === 'removed' ? "İçerik Yayından Kaldırıldı" : "Rapor Yoksayıldı");
            setSelectedReport(null);
        } catch (err) {
            console.error("Failed to update report status", err);
            showToast("Hata oluştu", "error");
        }
    };

    const filteredAds = ads.filter(ad => {
        const matchFilter = filter === "all" || ad.status === filter;
        const matchSearch = !searchQuery ||
            ad.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ad.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="space-y-10 pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-[pulse_2s_infinite]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Node: Moderation</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        Content <span className="text-white/40">Matrix</span>
                    </h1>
                </div>
                <button 
                    onClick={fetchData} 
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-card-border rounded-2xl text-xs font-black text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group"
                >
                    <RefreshCw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} /> 
                    Synchronize
                </button>
            </div>

            {/* --- STAT UNITS --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { key: "pending", label: "Pending", icon: Clock, value: stats.pending, color: STAT_COLORS.pending },
                    { key: "active", label: "Active Nodes", icon: ShieldCheck, value: stats.active, color: STAT_COLORS.active },
                    { key: "removed", label: "Decommissioned", icon: ShieldX, value: stats.removed, color: STAT_COLORS.removed },
                    { key: "reports", label: "Priority Reports", icon: Flag, value: stats.reports, color: STAT_COLORS.reports },
                ].map((stat, i) => (
                    <motion.div 
                        key={stat.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("p-6 rounded-[2rem] border backdrop-blur-3xl relative overflow-hidden group", stat.color)}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="text-4xl font-black mb-1 tabular-nums">{stat.value}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.label}</div>
                            </div>
                            <stat.icon className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity group-hover:scale-110" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- WORKSPACE --- */}
            <div className="bg-[#0A0A0F] rounded-[3rem] border border-card-border overflow-hidden shadow-2xl">
                {/* TABS */}
                <div className="flex bg-white/[0.02] border-b border-card-border">
                    <button 
                        onClick={() => setActiveTab("ads")}
                        className={cn(
                            "flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                            activeTab === "ads" ? "text-white" : "text-white/20 hover:text-white/40"
                        )}
                    >
                        Ad Nodes
                        {activeTab === "ads" && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-1 bg-cyan-500" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab("reports")}
                        className={cn(
                            "flex-1 py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                            activeTab === "reports" ? "text-white" : "text-white/20 hover:text-white/40"
                        )}
                    >
                        Signals/Reports
                        {activeTab === "reports" && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-1 bg-cyan-500" />}
                    </button>
                </div>

                {/* FILTERS */}
                <div className="p-6 border-b border-card-border flex flex-col md:flex-row gap-4 bg-white/[0.01]">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Node Search (Name, Author)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-card-border rounded-2xl text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "pending", "active"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s as any)}
                                className={cn(
                                    "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                                    filter === s 
                                        ? "bg-card text-black border-white" 
                                        : "bg-white/5 border-card-border text-white/40 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LIST */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 flex flex-col items-center justify-center gap-4 text-white/20">
                                <RefreshCw className="w-10 h-10 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Matrix...</span>
                            </motion.div>
                        ) : activeTab === "ads" ? (
                            <div className="divide-y divide-white/5">
                                {filteredAds.map((ad, i) => (
                                    <motion.div 
                                        key={ad.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedAd(ad)}
                                        className="p-6 hover:bg-white/[0.03] flex items-center justify-between cursor-pointer group transition-colors"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-card-border group-hover:scale-110 transition-transform">
                                                <span className="text-2xl">🐾</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-sm font-black text-white">{ad.name}</span>
                                                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full", STATUS_BADGE[ad.status]?.className)}>
                                                        {STATUS_BADGE[ad.status]?.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-white/30 text-[10px] font-bold uppercase tracking-wider">
                                                    <span>{ad.breed}</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-cyan-400/50">{ad.author_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-8">
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Node Location</span>
                                                <span className="text-[11px] font-bold text-white/60">{ad.location}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors group-hover:translate-x-1" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {reports.length === 0 ? (
                                    <div className="p-20 text-center space-y-4">
                                        <Flag className="w-12 h-12 text-white/10 mx-auto" />
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No High-Priority Signals Detected</p>
                                    </div>
                                ) : (
                                    reports.map((report, i) => (
                                        <motion.div 
                                            key={report.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedReport(report)}
                                            className="p-6 hover:bg-white/[0.03] flex items-center justify-between cursor-pointer group transition-colors"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-card-border group-hover:scale-110 transition-transform">
                                                    <span className="text-2xl">{report.targetType === 'post' ? '📝' : '💬'}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-sm font-black text-white">
                                                            {report.targetType === 'post' ? 'Gönderi İhlali' : 'Yorum İhlali'}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                            report.status === 'pending' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                            report.status === 'removed' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                                        )}>
                                                            {report.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-white/30 text-[10px] font-bold uppercase tracking-wider">
                                                        <span>Sebep: <strong className="text-amber-400/70">{report.reason}</strong></span>
                                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span>Yazar: <strong className="text-cyan-400/50">{report.authorName}</strong></span>
                                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span>Bildiren: <strong className="text-white/60">{report.reportedBy}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-8">
                                                <div className="hidden md:flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Tarih</span>
                                                    <span className="text-[11px] font-bold text-white/60">
                                                        {new Date(report.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors group-hover:translate-x-1" />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- AD DETAIL OVERLAY (DRAWER) --- */}
            <AnimatePresence>
                {selectedAd && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                            onClick={() => setSelectedAd(null)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-[110] bg-[#0A0A0F] border-t border-card-border rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
                            
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-8">
                                        <div className="w-32 h-32 bg-white/5 rounded-[2rem] border border-card-border flex items-center justify-center text-5xl">🐾</div>
                                        <div>
                                            <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">{selectedAd.name}</h2>
                                            <div className="flex gap-4">
                                                <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs">{selectedAd.breed}</span>
                                                <span className="text-white/20 font-bold uppercase tracking-widest text-xs">•</span>
                                                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">{selectedAd.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedAd(null)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                        <XCircle className="w-6 h-6 text-white/40" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Author Intelligence</h4>
                                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-card-border">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/20" />
                                                <div>
                                                    <p className="font-bold text-white uppercase text-sm">{selectedAd.author_name}</p>
                                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Verified Agent</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Narrative Data</h4>
                                            <div className="p-6 bg-white/[0.02] border border-card-border rounded-3xl leading-relaxed text-white/60 text-sm font-medium">
                                                {selectedAd.desc || "Veri girişi bulunmamaktadır."}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end gap-4 pb-4">
                                        <button 
                                            onClick={() => handleAction(selectedAd.id, "active")}
                                            className="w-full py-6 bg-cyan-500 text-black rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(6,182,212,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Authorize Node
                                        </button>
                                        <button 
                                            onClick={() => handleAction(selectedAd.id, "removed")}
                                            className="w-full py-6 bg-white/5 border border-red-500/20 text-red-500 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Decommission Node
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- REPORT DETAIL OVERLAY (DRAWER) --- */}
            <AnimatePresence>
                {selectedReport && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                            onClick={() => setSelectedReport(null)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-[110] bg-[#0A0A0F] border-t border-card-border rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
                            
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-8">
                                        <div className="w-32 h-32 bg-white/5 rounded-[2rem] border border-card-border flex items-center justify-center text-5xl">
                                            {selectedReport.targetType === 'post' ? '📝' : '💬'}
                                        </div>
                                        <div>
                                            <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">
                                                {selectedReport.targetType === 'post' ? 'Gönderi Raporu' : 'Yorum Raporu'}
                                            </h2>
                                            <div className="flex gap-4">
                                                <span className="text-red-500 font-bold uppercase tracking-widest text-xs">
                                                    İhlal Nedeni: {selectedReport.reason}
                                                </span>
                                                <span className="text-white/20 font-bold uppercase tracking-widest text-xs">•</span>
                                                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">
                                                    Durum: {selectedReport.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                        <XCircle className="w-6 h-6 text-white/40" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Raporlanan İçerik</h4>
                                            <div className="p-6 bg-white/[0.02] border border-card-border rounded-3xl leading-relaxed text-white/80 text-sm font-medium italic">
                                                &quot;{selectedReport.content}&quot;
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Rapor Detayı & Gerekçe</h4>
                                            <div className="p-5 bg-white/5 rounded-3xl border border-card-border space-y-2">
                                                <div className="text-xs text-white/60">
                                                    <span className="font-bold text-white">Yazar:</span> {selectedReport.authorName}
                                                </div>
                                                <div className="text-xs text-white/60">
                                                    <span className="font-bold text-white">Bildiren:</span> {selectedReport.reportedBy}
                                                </div>
                                                <div className="text-xs text-white/60">
                                                    <span className="font-bold text-white">Gerekçe:</span> {selectedReport.details || 'Açıklama girilmedi.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedReport.status === 'pending' ? (
                                        <div className="flex flex-col justify-end gap-4 pb-4">
                                            <button 
                                                onClick={() => handleReportAction(selectedReport.id, "removed")}
                                                className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                            >
                                                <ShieldX className="w-5 h-5" />
                                                Yayından Kaldır (Sil)
                                            </button>
                                            <button 
                                                onClick={() => handleReportAction(selectedReport.id, "dismissed")}
                                                className="w-full py-6 bg-white/5 border border-white/20 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Raporu Yoksay (Güvenli)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col justify-end pb-4">
                                            <div className="p-6 bg-white/5 border border-card-border rounded-3xl text-center text-xs text-white/40">
                                                Bu rapor için zaten karar verilmiştir: <strong className="text-white uppercase">{selectedReport.status}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* TOAST PANEL */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={cn("fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl z-[200] border backdrop-blur-3xl", toast.type === "success" ? "bg-cyan-500 border-cyan-400 text-black" : "bg-red-600 border-red-500 text-white")}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
