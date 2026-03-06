"use client";

import { useState, useMemo } from "react";
import { MOCK_APPLICATIONS } from "@/data/mockBusinessRegistry";
import { BusinessApplication } from "@/types/business";
import { cn } from "@/lib/utils";
import {
    Building2, Search, CheckCircle, XCircle, Clock, Eye,
    ChevronRight, Loader2, X, ShieldCheck, Store, Stethoscope,
    Scissors, GraduationCap, Heart, AlertTriangle, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessType } from "@/context/AuthContext";

const BIZ_TYPE_CONFIG: Record<BusinessType, { label: string; icon: typeof Store; color: string }> = {
    petshop: { label: 'Pet Shop', icon: Store, color: 'bg-blue-50 text-blue-600' },
    vet: { label: 'Veteriner', icon: Stethoscope, color: 'bg-green-50 text-green-600' },
    grooming: { label: 'Pet Kuaför', icon: Scissors, color: 'bg-pink-50 text-pink-600' },
    trainer: { label: 'Eğitmen', icon: GraduationCap, color: 'bg-amber-50 text-amber-600' },
    shelter: { label: 'Barınak', icon: Heart, color: 'bg-purple-50 text-purple-600' },
};

const STATUS_CONFIG = {
    pending: { label: 'Bekliyor', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    approved: { label: 'Onaylı', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    rejected: { label: 'Reddedildi', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

export default function AdminBusinessesPage() {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [detailApp, setDetailApp] = useState<BusinessApplication | null>(null);

    const filtered = useMemo(() => {
        let result = [...MOCK_APPLICATIONS];
        if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
        if (search) result = result.filter(a => a.businessName.toLowerCase().includes(search.toLowerCase()) || a.ownerName.toLowerCase().includes(search.toLowerCase()));
        return result.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }, [statusFilter, search]);

    const counts = {
        all: MOCK_APPLICATIONS.length,
        pending: MOCK_APPLICATIONS.filter(a => a.status === 'pending').length,
        approved: MOCK_APPLICATIONS.filter(a => a.status === 'approved').length,
        rejected: MOCK_APPLICATIONS.filter(a => a.status === 'rejected').length,
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">İşletme Yönetimi</h1>
                <p className="text-sm text-gray-500 mt-1">Başvuruları inceleyin, onaylayın veya reddedin</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Toplam" value={counts.all} icon={Building2} color="indigo" />
                <StatCard label="Bekleyen" value={counts.pending} icon={Clock} color="amber" />
                <StatCard label="Onaylı" value={counts.approved} icon={CheckCircle} color="green" />
                <StatCard label="Reddedilen" value={counts.rejected} icon={XCircle} color="red" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="İşletme veya sahip adı ile ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition",
                                statusFilter === s
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
                            <span className="ml-1 text-[10px] bg-gray-100 px-1 py-0.5 rounded">{counts[s]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-700 mb-1">Başvuru bulunamadı</h3>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(app => {
                        const typeConfig = BIZ_TYPE_CONFIG[app.businessType];
                        const statusInfo = STATUS_CONFIG[app.status];
                        const StatusIcon = statusInfo.icon;
                        const TypeIcon = typeConfig.icon;

                        return (
                            <div
                                key={app.id}
                                onClick={() => setDetailApp(app)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", typeConfig.color)}>
                                        <TypeIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-sm">{app.businessName}</h3>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", statusInfo.bg, statusInfo.color)}>
                                                <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {app.ownerName} · {typeConfig.label} · {new Date(app.appliedAt).toLocaleDateString('tr-TR')}
                                        </div>
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
                {detailApp && <BusinessDetailModal app={detailApp} onClose={() => setDetailApp(null)} />}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Building2; color: string }) {
    const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600' };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors[color])}><Icon className="w-4 h-4" /></div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}

function BusinessDetailModal({ app, onClose }: { app: BusinessApplication; onClose: () => void }) {
    const [action, setAction] = useState<null | 'approving' | 'rejecting'>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [done, setDone] = useState<null | 'approved' | 'rejected'>(null);

    const handleAction = (type: 'approve' | 'reject') => {
        setAction(type === 'approve' ? 'approving' : 'rejecting');
        setTimeout(() => {
            setAction(null);
            setDone(type === 'approve' ? 'approved' : 'rejected');
            setTimeout(onClose, 1500);
        }, 1500);
    };

    const typeConfig = BIZ_TYPE_CONFIG[app.businessType];
    const statusInfo = STATUS_CONFIG[app.status];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {done ? (
                    <div className="p-12 text-center">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", done === 'approved' ? "bg-green-100" : "bg-red-100")}>
                            {done === 'approved' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                        </div>
                        <h3 className="text-lg font-black text-gray-900">{done === 'approved' ? 'Başvuru Onaylandı!' : 'Başvuru Reddedildi'}</h3>
                        <p className="text-sm text-gray-500 mt-1">{app.businessName}</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeConfig.color)}><typeConfig.icon className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">{app.businessName}</h2>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusInfo.bg, statusInfo.color)}>{statusInfo.label}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <DetailRow label="İşletme Türü" value={typeConfig.label} />
                            <DetailRow label="Sahip" value={app.ownerName} />
                            <DetailRow label="E-posta" value={app.email} />
                            <DetailRow label="Telefon" value={app.phone} />
                            <DetailRow label="Adres" value={app.address} />
                            <DetailRow label="Vergi No" value={app.taxId} />
                            <DetailRow label="IBAN" value={app.iban.slice(0, 4) + ' **** **** ' + app.iban.slice(-4)} />
                            <DetailRow label="Başvuru Tarihi" value={new Date(app.appliedAt).toLocaleString('tr-TR')} />
                            {app.reviewedAt && <DetailRow label="İnceleme Tarihi" value={new Date(app.reviewedAt).toLocaleString('tr-TR')} />}
                            {app.reviewNote && <DetailRow label="İnceleme Notu" value={app.reviewNote} />}

                            {app.status === 'pending' && (
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">İnceleme Notu (isteğe bağlı)</label>
                                    <textarea
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                        rows={2}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Belgeler doğrulandı..."
                                    />
                                </div>
                            )}
                        </div>

                        {app.status === 'pending' && (
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={!!action}
                                    className="flex-1 px-5 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {action === 'rejecting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reddet
                                </button>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={!!action}
                                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {action === 'approving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Onayla
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
        </div>
    );
}
