"use client";

import { useState, useMemo } from "react";
import { MOCK_REPORTS } from "@/data/mockBusinessRegistry";
import { ModerationReport, ReportType, ReportStatus } from "@/types/business";
import { cn } from "@/lib/utils";
import {
    AlertTriangle, Search, CheckCircle, XCircle, Clock, Eye,
    Shield, Package, MessageSquare, Building2, Star,
    X, Loader2, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG: Record<ReportType, { label: string; icon: typeof Package; color: string }> = {
    product: { label: 'Ürün', icon: Package, color: 'bg-blue-50 text-blue-600' },
    review: { label: 'Yorum', icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
    social_post: { label: 'Sosyal Gönderi', icon: Star, color: 'bg-pink-50 text-pink-600' },
    business: { label: 'İşletme', icon: Building2, color: 'bg-red-50 text-red-600' },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    resolved: { label: 'Çözüldü', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    dismissed: { label: 'Reddedildi', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
};

export default function AdminModerationPage() {
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
    const [detailReport, setDetailReport] = useState<ModerationReport | null>(null);

    const filtered = useMemo(() => {
        let result = [...MOCK_REPORTS];
        if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [statusFilter]);

    const counts = {
        all: MOCK_REPORTS.length,
        pending: MOCK_REPORTS.filter(r => r.status === 'pending').length,
        resolved: MOCK_REPORTS.filter(r => r.status === 'resolved').length,
        dismissed: MOCK_REPORTS.filter(r => r.status === 'dismissed').length,
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Moderasyon</h1>
                <p className="text-sm text-gray-500 mt-1">Şikayetleri ve bildirimleri yönetin</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatBox label="Toplam" value={counts.all} icon={Shield} color="indigo" />
                <StatBox label="Bekleyen" value={counts.pending} icon={Clock} color="amber" />
                <StatBox label="Çözülen" value={counts.resolved} icon={CheckCircle} color="green" />
                <StatBox label="Reddedilen" value={counts.dismissed} icon={XCircle} color="gray" />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'resolved', 'dismissed'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold border transition",
                        statusFilter === s ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}>
                        {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
                        <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{counts[s]}</span>
                    </button>
                ))}
            </div>

            {/* Reports */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-700">Bildirim bulunamadı</h3>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(report => {
                        const typeConf = TYPE_CONFIG[report.type];
                        const statusConf = STATUS_CONFIG[report.status];
                        const TypeIcon = typeConf.icon;
                        return (
                            <div key={report.id} onClick={() => setDetailReport(report)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", typeConf.color)}>
                                        <TypeIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{report.targetTitle}</h3>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusConf.bg, statusConf.color)}>{statusConf.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            <span className="font-medium">{typeConf.label}</span> · {report.reason} · Bildiren: {report.reportedBy}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                        <div className="text-[10px] text-gray-400">{new Date(report.createdAt).toLocaleDateString('tr-TR')}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {detailReport && <ReportDetailModal report={detailReport} onClose={() => setDetailReport(null)} />}
            </AnimatePresence>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Shield; color: string }) {
    const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600', gray: 'bg-gray-100 text-gray-500' };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors[color])}><Icon className="w-4 h-4" /></div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

function ReportDetailModal({ report, onClose }: { report: ModerationReport; onClose: () => void }) {
    const [action, setAction] = useState<null | 'resolving' | 'dismissing'>(null);
    const [done, setDone] = useState<null | 'resolved' | 'dismissed'>(null);
    const [resolution, setResolution] = useState('');
    const typeConf = TYPE_CONFIG[report.type];
    const statusConf = STATUS_CONFIG[report.status];

    const handleAction = (type: 'resolve' | 'dismiss') => {
        setAction(type === 'resolve' ? 'resolving' : 'dismissing');
        setTimeout(() => { setAction(null); setDone(type === 'resolve' ? 'resolved' : 'dismissed'); setTimeout(onClose, 1200); }, 1200);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {done ? (
                    <div className="p-12 text-center">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", done === 'resolved' ? "bg-green-100" : "bg-gray-100")}>
                            {done === 'resolved' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-gray-500" />}
                        </div>
                        <h3 className="text-lg font-black text-gray-900">{done === 'resolved' ? 'Bildirim Çözüldü' : 'Bildirim Reddedildi'}</h3>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeConf.color)}><typeConf.icon className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="font-black text-gray-900">{report.targetTitle}</h2>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusConf.bg, statusConf.color)}>{statusConf.label}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <Row label="Tür" value={typeConf.label} />
                            <Row label="Sebep" value={report.reason} />
                            <Row label="Bildiren" value={report.reportedBy} />
                            <Row label="Tarih" value={new Date(report.createdAt).toLocaleString('tr-TR')} />
                            {report.resolution && <Row label="Çözüm" value={report.resolution} />}

                            {report.status === 'pending' && (
                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">Çözüm Notu</label>
                                    <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="İçerik kaldırıldı, kullanıcı uyarıldı..." />
                                </div>
                            )}
                        </div>
                        {report.status === 'pending' && (
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button onClick={() => handleAction('dismiss')} disabled={!!action} className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                    {action === 'dismissing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reddet
                                </button>
                                <button onClick={() => handleAction('resolve')} disabled={!!action} className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {action === 'resolving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Çöz
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[65%]">{value}</span>
        </div>
    );
}
