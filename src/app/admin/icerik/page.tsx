"use client";

// İçerik Stüdyosu (CLAUDE.md 8.64). Ana sayfa hikâyeleri ve "Moffi'den İlham" kartı buradan yönetilir:
//   • Moffi hikâyesi ve İlham kartı: yönetici hazırlar, doğrudan yayına alır (tarih aralığı, tür hedefi, öncelik).
//   • Veteriner Önerisi ve Fırsatlar: işletmeler gönderir; burada onaylanır ya da nedeniyle reddedilir (işletmeye bildirim gider).
// Görüntülenme/dokunma sayıları kullanıcı başına bir kez sayılır.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, Hand, Image as ImageIcon, Plus, Upload, X } from "lucide-react";
import { contentService, type AdminContentInput, type AdminContentItem, type ContentStatus, type Species } from "@/services/contentService";
import { apiService } from "@/services/apiService";
import { cn, showToast } from "@/lib/utils";

const TABS: { id: ContentStatus; label: string }[] = [
    { id: "pending", label: "Onay bekleyen" },
    { id: "approved", label: "Yayında / planlı" },
    { id: "rejected", label: "Reddedilen" },
    { id: "archived", label: "Arşiv" },
];

const CHANNEL_LABEL: Record<string, string> = { moffi: "Moffi hikâyesi", inspiration: "İlham kartı", vet: "Veteriner önerisi", deal: "Fırsat (reklam)" };
const SPECIES_LABEL: Record<Species, string> = { all: "Herkes", dog: "Köpek sahipleri", cat: "Kedi sahipleri" };

const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "süresiz");

const EMPTY: AdminContentInput = { channel: "moffi", title: "", body: "", mediaUrl: "", ctaLabel: "", ctaUrl: "", startsAt: null, endsAt: null, species: "all", priority: 0 };

function validate(f: AdminContentInput): string | null {
    if (f.title.trim().length < 2) return f.channel === "inspiration" ? "Söz gerekli." : "Başlık gerekli.";
    if (f.title.length > 90) return "Başlık en fazla 90 karakter.";
    if (f.body.length > 600) return "Metin en fazla 600 karakter.";
    if (!f.mediaUrl) return "Görsel yükle.";
    if (f.ctaUrl && !/^(\/|https:\/\/)/.test(f.ctaUrl)) return "Bağlantı / ile başlayan uygulama içi yol ya da https:// adresi olmalı.";
    if (f.ctaUrl && !f.ctaLabel.trim()) return "Bağlantı için düğme yazısı gir.";
    if (f.startsAt && f.endsAt && f.endsAt <= f.startsAt) return "Bitiş başlangıçtan sonra olmalı.";
    return null;
}

function PhonePreview({ f }: { f: AdminContentInput }) {
    if (f.channel === "inspiration") {
        return (
            <div className="w-full aspect-[350/188] rounded-[22px] overflow-hidden relative bg-zinc-200 dark:bg-zinc-800">
                {f.mediaUrl && <img src={f.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(20,17,13,0.72) 0%, rgba(20,17,13,0.35) 48%, rgba(20,17,13,0) 75%)" }} />
                <p className="relative p-5 max-w-[64%] text-white text-lg font-bold leading-snug">“{f.title || "Söz burada görünür"}”</p>
            </div>
        );
    }
    return (
        <div className="mx-auto w-[220px] aspect-[9/19] rounded-[30px] overflow-hidden relative bg-zinc-900 border-[6px] border-zinc-900 shadow-xl">
            {f.mediaUrl && <img src={f.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
            <div className="absolute top-2 inset-x-2 h-[2px] rounded-full bg-white/80" />
            <span className="absolute top-4 left-3 text-[10px] font-bold text-white">Moffi</span>
            <div className="absolute bottom-3 inset-x-3 text-white">
                <span className="text-[8px] font-bold bg-white/20 rounded-full px-1.5 py-0.5">Moffi</span>
                <p className="mt-1 text-[12px] font-extrabold leading-snug">{f.title || "Başlık"}</p>
                {f.body && <p className="text-[9px] text-white/85 leading-snug mt-0.5 line-clamp-4">{f.body}</p>}
                {f.ctaLabel && <div className="mt-2 h-6 rounded-lg bg-white text-zinc-900 text-[9px] font-extrabold flex items-center justify-center">{f.ctaLabel}</div>}
            </div>
        </div>
    );
}

export default function ContentStudioPage() {
    const [tab, setTab] = useState<ContentStatus>("pending");
    const [items, setItems] = useState<AdminContentItem[] | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [editing, setEditing] = useState<{ id?: string; form: AdminContentInput } | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const all = await contentService.adminList(null);
            const c: Record<string, number> = {};
            all.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
            setCounts(c);
            setItems(all.filter(i => i.status === tab));
        } catch (e) {
            setItems([]);
            showToast((e as Error).message || "İçerikler yüklenemedi.", "AlertCircle", "text-red-500 font-bold");
        }
    }, [tab]);
    useEffect(() => { load(); }, [load]);

    const set = <K extends keyof AdminContentInput>(k: K, v: AdminContentInput[K]) => setEditing(e => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

    const upload = async (file: File) => {
        if (!file.type.startsWith("image/")) { showToast("Yalnızca görsel yüklenebilir.", "AlertCircle", "text-red-500 font-bold"); return; }
        if (file.size > 5 * 1024 * 1024) { showToast("Görsel en fazla 5 MB olmalı.", "AlertCircle", "text-red-500 font-bold"); return; }
        setUploading(true);
        try { set("mediaUrl", await apiService.uploadMedia(file, "stories")); }
        catch { showToast("Görsel yüklenemedi.", "AlertCircle", "text-red-500 font-bold"); }
        finally { setUploading(false); }
    };

    const save = async () => {
        if (!editing) return;
        const problem = validate(editing.form);
        if (problem) { showToast(problem, "AlertCircle", "text-red-500 font-bold"); return; }
        setSaving(true);
        try {
            await contentService.adminSave(editing.form, editing.id);
            showToast(editing.id ? "İçerik güncellendi." : "İçerik yayına alındı.", "CheckCircle2", "text-emerald-500 font-bold");
            setEditing(null);
            setTab("approved");
            load();
        } catch (e) {
            showToast((e as Error).message || "Kaydedilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally { setSaving(false); }
    };

    const act = async (fn: () => Promise<void>, ok: string) => {
        try { await fn(); showToast(ok, "CheckCircle2", "text-emerald-500 font-bold"); setRejecting(null); load(); }
        catch (e) { showToast((e as Error).message || "İşlem yapılamadı.", "AlertCircle", "text-red-500 font-bold"); }
    };

    const now = Date.now();
    const stateOf = (i: AdminContentItem) => i.status !== "approved" ? null
        : new Date(i.startsAt).getTime() > now ? "Planlandı"
        : i.endsAt && new Date(i.endsAt).getTime() <= now ? "Süresi doldu" : "Yayında";

    const input = "w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold outline-none focus:border-amber-500";
    const pending = counts.pending || 0;
    const sorted = useMemo(() => items, [items]);

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white">İçerik Stüdyosu</h1>
                    <p className="text-sm font-semibold text-zinc-500 max-w-xl">Ana sayfadaki Moffi hikâyesi ve İlham kartı burada hazırlanır. İşletmelerin veteriner önerileri ve öne çıkarılan kampanyaları onaydan sonra yalnızca kendi çevrelerinde gösterilir.</p>
                </div>
                <button onClick={() => setEditing({ form: { ...EMPTY } })} className="h-11 px-4 rounded-xl bg-amber-500 text-white text-sm font-black flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Yeni içerik
                </button>
            </header>

            <nav className="flex gap-2 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("h-10 px-4 rounded-xl text-sm font-black whitespace-nowrap border", tab === t.id ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300")}>
                        {t.label}{counts[t.id] ? <span className={cn("ml-1.5", t.id === "pending" && pending ? "text-amber-500" : "opacity-60")}>{counts[t.id]}</span> : null}
                    </button>
                ))}
            </nav>

            {editing && (
                <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 grid lg:grid-cols-[1fr_260px] gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-zinc-900 dark:text-white">{editing.id ? "İçeriği düzenle" : "Yeni içerik"}</div>
                            <button onClick={() => setEditing(null)} aria-label="Kapat" className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(["moffi", "inspiration"] as const).map(c => (
                                <button key={c} type="button" onClick={() => set("channel", c)}
                                    className={cn("h-11 rounded-xl text-sm font-black border", editing.form.channel === c ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300")}>
                                    {CHANNEL_LABEL[c]}
                                </button>
                            ))}
                        </div>
                        <label className="block space-y-1">
                            <span className="text-xs font-bold text-zinc-500">{editing.form.channel === "inspiration" ? "Söz" : "Başlık"}</span>
                            <input value={editing.form.title} onChange={e => set("title", e.target.value)} maxLength={90} className={input}
                                placeholder={editing.form.channel === "inspiration" ? "Onların iyi olması, bizim en büyük mutluluğumuz." : "Yeni yürüyüş görevleri yayında"} />
                        </label>
                        {editing.form.channel === "moffi" && (
                            <label className="block space-y-1">
                                <span className="text-xs font-bold text-zinc-500">Metin (isteğe bağlı) · {editing.form.body.length}/600</span>
                                <textarea value={editing.form.body} onChange={e => set("body", e.target.value)} maxLength={600} rows={3} className={cn(input, "h-auto py-2.5 resize-none")} />
                            </label>
                        )}
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-500">Görsel {editing.form.channel === "moffi" ? "(dikey, en az 1080×1920 önerilir)" : "(yatay)"}</span>
                            <label className="flex items-center gap-3 h-11 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                {editing.form.mediaUrl ? <ImageIcon className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4" />}
                                {uploading ? "Yükleniyor…" : editing.form.mediaUrl ? "Görsel yüklendi · değiştir" : "Görsel seç"}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
                            </label>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-zinc-500">Düğme yazısı (isteğe bağlı)</span>
                                <input value={editing.form.ctaLabel} onChange={e => set("ctaLabel", e.target.value)} maxLength={30} className={input} placeholder="Göz at" />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-zinc-500">Bağlantı</span>
                                <input value={editing.form.ctaUrl} onChange={e => set("ctaUrl", e.target.value.trim())} className={input} placeholder="/walk/challenges" />
                            </label>
                        </div>
                        <div className="grid sm:grid-cols-4 gap-3">
                            <label className="space-y-1 sm:col-span-1">
                                <span className="text-xs font-bold text-zinc-500">Başlangıç</span>
                                <input type="datetime-local" value={toLocalInput(editing.form.startsAt)} onChange={e => set("startsAt", fromLocalInput(e.target.value))} className={input} />
                            </label>
                            <label className="space-y-1 sm:col-span-1">
                                <span className="text-xs font-bold text-zinc-500">Bitiş (boş = süresiz)</span>
                                <input type="datetime-local" value={toLocalInput(editing.form.endsAt)} onChange={e => set("endsAt", fromLocalInput(e.target.value))} className={input} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-zinc-500">Kime</span>
                                <select value={editing.form.species} onChange={e => set("species", e.target.value as Species)} className={input}>
                                    {(Object.keys(SPECIES_LABEL) as Species[]).map(s => <option key={s} value={s}>{SPECIES_LABEL[s]}</option>)}
                                </select>
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-zinc-500">Öncelik</span>
                                <input type="number" min={0} max={100} value={editing.form.priority} onChange={e => set("priority", Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className={cn(input, "tabular-nums")} />
                            </label>
                        </div>
                        <button onClick={save} disabled={saving || uploading} className="h-11 px-5 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-60">
                            {saving ? "Kaydediliyor…" : editing.id ? "Güncelle" : "Yayına al"}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-zinc-500">Telefonda önizleme</div>
                        <PhonePreview f={editing.form} />
                    </div>
                </section>
            )}

            {!sorted ? (
                <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ) : sorted.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-500">
                    {tab === "pending" ? "Onay bekleyen içerik yok." : tab === "approved" ? "Yayında içerik yok. \"Yeni içerik\" ile ilk Moffi hikâyesini ekleyebilirsin; o zamana kadar bu kanal ana sayfada görünmez." : "Bu bölüm boş."}
                </p>
            ) : (
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                    {sorted.map(i => {
                        const st = stateOf(i);
                        return (
                            <div key={i.id} className="p-4 bg-white dark:bg-zinc-950 flex gap-4">
                                <div className="w-16 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                                    {i.mediaUrl && <img src={i.mediaUrl} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={cn("h-5 px-2 rounded-full text-[10px] font-black inline-flex items-center",
                                            i.channel === "deal" ? "bg-amber-500/15 text-amber-600" : i.channel === "vet" ? "bg-teal-500/15 text-teal-600" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300")}>
                                            {CHANNEL_LABEL[i.channel]}
                                        </span>
                                        {st && <span className={cn("text-[11px] font-black", st === "Yayında" ? "text-emerald-600" : "text-zinc-500")}>{st}</span>}
                                        {i.businessName && <span className="text-[11px] font-bold text-zinc-500">· {i.businessName}</span>}
                                    </div>
                                    <div className="text-sm font-black text-zinc-900 dark:text-white">{i.title || "(başlıksız)"}</div>
                                    {i.body && <p className="text-xs font-semibold text-zinc-500 line-clamp-2">{i.body}</p>}
                                    {i.channel === "deal" && (i.couponCode || i.discount) && (
                                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{[i.discount, i.couponCode && `Kod: ${i.couponCode}`].filter(Boolean).join(" · ")}</p>
                                    )}
                                    <div className="text-[11px] font-semibold text-zinc-400 flex flex-wrap gap-x-3">
                                        <span>{fmt(i.startsAt)} → {fmt(i.endsAt)}</span>
                                        <span>{SPECIES_LABEL[i.targetSpecies]}</span>
                                        {(i.channel === "vet" || i.channel === "deal") && <span>{i.radiusKm} km çevre</span>}
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {i.views}</span>
                                        <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {i.taps}</span>
                                    </div>
                                    {i.status === "rejected" && i.rejectReason && <p className="text-xs font-bold text-red-600">Neden: {i.rejectReason}</p>}

                                    {rejecting?.id === i.id ? (
                                        <div className="flex gap-2 pt-1">
                                            <input autoFocus value={rejecting.reason} onChange={e => setRejecting({ id: i.id, reason: e.target.value })} placeholder="Reddetme nedeni (işletmeye gider)" className={cn(input, "h-9 text-xs")} />
                                            <button onClick={() => act(() => contentService.review(i.id, false, rejecting.reason), "Reddedildi, işletmeye bildirildi.")} className="h-9 px-3 rounded-xl bg-red-600 text-white text-xs font-black whitespace-nowrap">Reddet</button>
                                            <button onClick={() => setRejecting(null)} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-600">Vazgeç</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {i.status === "pending" && (
                                                <>
                                                    <button onClick={() => act(() => contentService.review(i.id, true), "Onaylandı, yayında.")} className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Onayla</button>
                                                    <button onClick={() => setRejecting({ id: i.id, reason: "" })} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-red-600">Reddet</button>
                                                </>
                                            )}
                                            {(i.channel === "moffi" || i.channel === "inspiration") && i.status !== "pending" && (
                                                <button onClick={() => setEditing({ id: i.id, form: { channel: i.channel as "moffi" | "inspiration", title: i.title, body: i.body || "", mediaUrl: i.mediaUrl || "", ctaLabel: i.ctaLabel || "", ctaUrl: i.ctaUrl || "", startsAt: i.startsAt, endsAt: i.endsAt, species: i.targetSpecies, priority: i.priority } })}
                                                    className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-700 dark:text-zinc-200">
                                                    {i.status === "archived" ? "Düzenle ve yayına al" : "Düzenle"}
                                                </button>
                                            )}
                                            {i.status === "approved" && (
                                                <button onClick={() => act(() => contentService.archive(i.id), "Arşivlendi; ana sayfadan kalktı.")} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-300">Yayından kaldır</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
