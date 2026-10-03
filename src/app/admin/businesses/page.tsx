"use client";

// İşletme Yönetimi: başvuruların TEK onay ekranı (8.54). Liste businesses kaydından; karar admin_review_business ile
// (yönetici + iki adımlı doğrulama sunucuda zorunlu). Ret nedeni işletmeye bildirim ve e-postayla gider.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock, ExternalLink, Loader2, MapPin, Search, X, XCircle } from "lucide-react";
import { cn, showToast } from "@/lib/utils";
import { BUSINESS_TYPE_CONFIG, isBusinessType } from "@/config/businessTypes";
import { businessApplicationService, formatIban, type AdminBusinessRow, type KybStatus } from "@/services/businessApplicationService";

const TABS: { id: KybStatus | "all"; label: string }[] = [
    { id: "pending", label: "Onay bekleyen" },
    { id: "approved", label: "Onaylı" },
    { id: "rejected", label: "Reddedilen" },
    { id: "all", label: "Tümü" },
];

const STATUS: Record<KybStatus, { label: string; cls: string; Icon: typeof Clock }> = {
    pending: { label: "Onay bekliyor", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", Icon: Clock },
    approved: { label: "Onaylı", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
    rejected: { label: "Reddedildi", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400", Icon: XCircle },
};

const typeLabel = (t: string | null) => (isBusinessType(t) ? BUSINESS_TYPE_CONFIG[t].label : "Tür yok");
const fmt = (iso: string) => new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function BusinessesPage() {
    const [rows, setRows] = useState<AdminBusinessRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<KybStatus | "all">("pending");
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try { setRows(await businessApplicationService.adminList()); }
        catch (e) { showToast(e instanceof Error ? e.message : "İşletmeler okunamadı.", "AlertCircle", "text-red-500 font-bold"); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const counts = useMemo(() => ({
        pending: rows.filter(r => r.kybStatus === "pending").length,
        approved: rows.filter(r => r.kybStatus === "approved").length,
        rejected: rows.filter(r => r.kybStatus === "rejected").length,
        all: rows.length,
    }), [rows]);

    const q = search.trim().toLocaleLowerCase("tr-TR");
    const visible = rows.filter(r =>
        (tab === "all" || r.kybStatus === tab) &&
        (!q || [r.name, r.ownerName, r.owner?.email, r.province, r.district, r.taxId].some(v => v?.toLocaleLowerCase("tr-TR").includes(q))));
    const open = rows.find(r => r.id === openId) || null;

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white">İşletme Yönetimi</h1>
                    <p className="text-sm font-semibold text-zinc-500 max-w-xl">
                        Başvuruları burada incele ve karar ver. Onaylanan işletme haritada ve aramada görünür; reddedilen işletme nedenini görür, düzeltip yeniden gönderebilir.
                    </p>
                </div>
                <label className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, e-posta, il, vergi no" aria-label="İşletme ara"
                        className="h-11 w-64 pl-10 pr-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-amber-500" />
                </label>
            </header>

            <nav className="flex gap-2 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("h-10 px-4 rounded-xl text-sm font-black whitespace-nowrap border flex items-center gap-2",
                            tab === t.id ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300")}>
                        {t.label}
                        <span className={cn("min-w-5 h-5 px-1.5 rounded-full text-[11px] flex items-center justify-center",
                            t.id === "pending" && counts.pending > 0 ? "bg-amber-500 text-white" : "bg-zinc-500/15")}>{counts[t.id]}</span>
                    </button>
                ))}
            </nav>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
            ) : visible.length === 0 ? (
                <div className="py-16 text-center text-sm font-semibold text-zinc-500">
                    {tab === "pending" ? "Bekleyen başvuru yok." : "Bu listede işletme yok."}
                </div>
            ) : (
                <ul className="space-y-2.5">
                    {visible.map(r => {
                        const st = STATUS[r.kybStatus];
                        return (
                            <li key={r.id}>
                                <button onClick={() => setOpenId(r.id)} className="w-full text-left p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center gap-4">
                                    <span className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-zinc-500" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block font-black text-zinc-900 dark:text-white truncate">{r.name}</span>
                                        <span className="block text-xs font-semibold text-zinc-500 truncate">
                                            {typeLabel(r.type)} · {[r.district, r.province].filter(Boolean).join(", ") || "konum yok"} · {r.owner?.email || r.ownerName || "sahip yok"}
                                        </span>
                                    </span>
                                    <span className="hidden sm:block text-xs font-semibold text-zinc-400 shrink-0">{fmt(r.updatedAt)}</span>
                                    <span className={cn("px-2.5 h-7 rounded-lg text-xs font-black flex items-center gap-1 shrink-0", st.cls)}>
                                        <st.Icon className="w-3.5 h-3.5" />{st.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {open && <ReviewPanel key={open.id} row={open} onClose={() => setOpenId(null)} onDone={() => { setOpenId(null); load(); }} />}
        </div>
    );
}

function Field({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
    return (
        <div className="py-2.5 flex justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <span className="text-xs font-bold text-zinc-500 shrink-0">{k}</span>
            <span className={cn("text-sm font-semibold text-zinc-900 dark:text-white text-right break-all", mono && "font-mono")}>{v || "—"}</span>
        </div>
    );
}

function ReviewPanel({ row, onClose, onDone }: { row: AdminBusinessRow; onClose: () => void; onDone: () => void }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const st = STATUS[row.kybStatus];

    const decide = async (approve: boolean) => {
        setBusy(true);
        try {
            await businessApplicationService.review(row.id, approve, approve ? undefined : reason.trim());
            showToast(approve ? `${row.name} onaylandı.` : `${row.name} reddedildi; işletmeye bildirildi.`, "CheckCircle2", "text-emerald-500 font-bold");
            onDone();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Karar kaydedilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setBusy(false);
        }
    };

    const openDoc = async () => {
        if (!row.taxDocPath) return;
        try { window.open(await businessApplicationService.taxDocumentUrl(row.taxDocPath), "_blank", "noopener"); }
        catch (e) { showToast(e instanceof Error ? e.message : "Belge açılamadı.", "AlertCircle", "text-red-500 font-bold"); }
    };

    const mapUrl = row.lat != null && row.lng != null ? `https://www.openstreetmap.org/?mlat=${row.lat}&mlon=${row.lng}#map=17/${row.lat}/${row.lng}` : null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div role="dialog" aria-label={row.name} onClick={e => e.stopPropagation()}
                className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white">{row.name}</h2>
                        <p className="text-xs font-semibold text-zinc-500 mt-0.5">{typeLabel(row.type)} · başvuru {fmt(row.createdAt)}</p>
                    </div>
                    <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
                </div>
                <span className={cn("mt-3 inline-flex px-2.5 h-7 rounded-lg text-xs font-black items-center gap-1", st.cls)}><st.Icon className="w-3.5 h-3.5" />{st.label}</span>
                {row.kybStatus === "rejected" && row.rejectionReason && (
                    <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">Ret nedeni: {row.rejectionReason}</p>
                )}

                <div className="mt-4">
                    <Field k="Hesap sahibi" v={row.owner ? `${row.owner.name || "İsimsiz"} · ${row.owner.email || "e-posta yok"}` : null} />
                    <Field k="Yetkili (beyan)" v={row.ownerName} />
                    <Field k="Telefon" v={row.phone} />
                    <Field k="Vergi / T.C. no" v={row.taxId} mono />
                    <Field k="Vergi levhası" v={row.taxDocPath ? <button onClick={openDoc} className="inline-flex items-center gap-1 text-amber-600 font-bold">Belgeyi aç<ExternalLink className="w-3 h-3" /></button> : null} />
                    <Field k="IBAN" v={row.iban ? formatIban(row.iban) : row.type === "petshop" ? null : "Gerekmez (satış yapmaz)"} mono={!!row.iban} />
                    <Field k="İl / ilçe" v={[row.district, row.province].filter(Boolean).join(", ")} />
                    <Field k="Adres" v={row.address} />
                    <Field k="Konum" v={mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-amber-600 font-bold"><MapPin className="w-3.5 h-3.5" />Haritada aç<ExternalLink className="w-3 h-3" /></a> : null} />
                </div>
                <p className="mt-3 text-[11px] font-semibold text-zinc-500 leading-relaxed">
                    Kontrol önerisi: vergi levhasındaki unvan ve numara beyanla aynı olmalı; numarayı GİB&apos;in &quot;Vergi Levhası Sorgulama&quot; ekranından da doğrula, veteriner kliniğini il tarım müdürlüğü ruhsat kaydından doğrula; IBAN&apos;daki ad işletme/yetkiliyle uyuşmalı.
                </p>

                {rejecting ? (
                    <div className="mt-5 space-y-2.5">
                        <label className="text-xs font-black text-zinc-600 dark:text-zinc-300" htmlFor="reason">Ret nedeni (işletme görür)</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500}
                            placeholder="örn. Vergi numarası işletme adıyla eşleşmiyor; vergi levhasındaki unvanı yazın."
                            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-rose-400 resize-none" />
                        <div className="flex gap-2">
                            <button onClick={() => setRejecting(false)} disabled={busy} className="flex-1 h-11 rounded-xl bg-zinc-100 dark:bg-white/10 text-sm font-black text-zinc-700 dark:text-zinc-200">Vazgeç</button>
                            <button onClick={() => decide(false)} disabled={busy || reason.trim().length < 5} className="flex-1 h-11 rounded-xl bg-rose-600 text-white text-sm font-black disabled:opacity-40 flex items-center justify-center">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reddet ve bildir"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 flex gap-2">
                        {row.kybStatus !== "rejected" && (
                            <button onClick={() => setRejecting(true)} disabled={busy} className="flex-1 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-black">
                                {row.kybStatus === "approved" ? "Onayı kaldır" : "Reddet"}
                            </button>
                        )}
                        {row.kybStatus !== "approved" && (
                            <button onClick={() => decide(true)} disabled={busy} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-black flex items-center justify-center">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Onayla"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
