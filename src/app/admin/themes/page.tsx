"use client";

// Haftanın teması (yol haritası 8.52): yönetici etiketi, başlığı, tarih aralığını ve ödül puanını girer.
// Aynı günlere iki tema girilemez (sunucu reddeder). Etiketle ilk paylaşımda puanı sunucu verir.

import { useCallback, useEffect, useState } from "react";
import { socialService, type WeeklyTheme, type WeeklyThemeInput } from "@/services/socialService";
import { cn, showToast } from "@/lib/utils";

const istanbulToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
const addDays = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

const EMPTY = (): WeeklyThemeInput => {
    const start = istanbulToday();
    return { hashtag: "", title: "", description: "", startsOn: start, endsOn: addDays(start, 6), rewardPoints: 50 };
};

function validate(f: WeeklyThemeInput): string | null {
    const tag = f.hashtag.trim().replace(/^#/, "");
    if (!/^[\p{L}\p{N}_]{2,30}$/u.test(tag)) return "Etiket 2–30 karakter olmalı; sadece harf, rakam ve alt çizgi (boşluk yok).";
    if (f.title.trim().length < 2 || f.title.trim().length > 60) return "Başlık 2–60 karakter olmalı.";
    if ((f.description || "").length > 280) return "Açıklama en fazla 280 karakter olabilir.";
    if (!f.startsOn || !f.endsOn || f.endsOn < f.startsOn) return "Bitiş tarihi başlangıçtan önce olamaz.";
    const days = (new Date(f.endsOn).getTime() - new Date(f.startsOn).getTime()) / 86400000;
    if (days > 13) return "Bir tema en fazla 14 gün sürebilir.";
    if (f.rewardPoints < 0 || f.rewardPoints > 200) return "Ödül 0–200 puan arasında olmalı.";
    return null;
}

export default function WeeklyThemesAdmin() {
    const [themes, setThemes] = useState<WeeklyTheme[] | null>(null);
    const [form, setForm] = useState<WeeklyThemeInput>(EMPTY);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const today = istanbulToday();

    const load = useCallback(() => {
        socialService.listThemes().then(setThemes).catch(e => { setThemes([]); showToast(e?.message || "Temalar yüklenemedi.", "AlertCircle", "text-red-500 font-bold"); });
    }, []);
    useEffect(load, [load]);

    const set = <K extends keyof WeeklyThemeInput>(k: K, v: WeeklyThemeInput[K]) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const problem = validate(form);
        if (problem) { showToast(problem, "AlertCircle", "text-red-500 font-bold"); return; }
        setSaving(true);
        try {
            await socialService.saveTheme(form, editId || undefined);
            showToast(editId ? "Tema güncellendi." : "Tema eklendi.", "CheckCircle2", "text-emerald-500 font-bold");
            setForm(EMPTY()); setEditId(null); load();
        } catch (err: any) {
            showToast(err?.message || "Tema kaydedilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally { setSaving(false); }
    };

    const edit = (t: WeeklyTheme) => {
        setEditId(t.id);
        setForm({ hashtag: t.hashtag, title: t.title, description: t.description || "", startsOn: t.startsOn, endsOn: t.endsOn, rewardPoints: t.rewardPoints });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const remove = async (id: string) => {
        try { await socialService.deleteTheme(id); showToast("Tema silindi.", "CheckCircle2", "text-emerald-500 font-bold"); load(); }
        catch (err: any) { showToast(err?.message || "Tema silinemedi.", "AlertCircle", "text-red-500 font-bold"); }
        setConfirmDelete(null);
    };

    const state = (t: WeeklyTheme) => (today < t.startsOn ? "Planlandı" : today > t.endsOn ? "Bitti" : "Yayında");
    const input = "w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold outline-none focus:border-amber-500";

    return (
        <div className="max-w-3xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-8">
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Haftanın teması</h1>
                <p className="text-sm font-semibold text-zinc-500">Keşfet&apos;in üstünde görünür. Kullanıcı tema süresince etiketle ilk paylaşımını yapınca ödülü bir kez alır.</p>
            </header>

            <form onSubmit={submit} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4">
                <div className="text-sm font-black text-zinc-900 dark:text-white">{editId ? "Temayı düzenle" : "Yeni tema"}</div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <label className="space-y-1">
                        <span className="text-xs font-bold text-zinc-500">Etiket</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">#</span>
                            <input id="theme-hashtag" value={form.hashtag} onChange={e => set("hashtag", e.target.value.replace(/^#/, "").replace(/\s/g, ""))} placeholder="PazarKeyfi" className={cn(input, "pl-7")} />
                        </div>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-bold text-zinc-500">Başlık</span>
                        <input id="theme-title" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Pazar keyfi" maxLength={60} className={input} />
                    </label>
                </div>
                <label className="block space-y-1">
                    <span className="text-xs font-bold text-zinc-500">Açıklama (isteğe bağlı)</span>
                    <textarea id="theme-description" value={form.description || ""} onChange={e => set("description", e.target.value)} maxLength={280} rows={2}
                        placeholder="Dostunun en tembel pazar halini paylaş." className={cn(input, "h-auto py-2.5 resize-none")} />
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <label className="space-y-1">
                        <span className="text-xs font-bold text-zinc-500">Başlangıç</span>
                        <input id="theme-start" type="date" value={form.startsOn} onChange={e => set("startsOn", e.target.value)} className={input} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-bold text-zinc-500">Bitiş</span>
                        <input id="theme-end" type="date" value={form.endsOn} onChange={e => set("endsOn", e.target.value)} className={input} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-bold text-zinc-500">Ödül (puan)</span>
                        <input id="theme-reward" type="number" min={0} max={200} step={10} value={form.rewardPoints}
                            onChange={e => set("rewardPoints", Math.max(0, Math.min(200, Number(e.target.value) || 0)))} className={cn(input, "tabular-nums")} />
                    </label>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="h-11 px-5 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-60">
                        {saving ? "Kaydediliyor…" : editId ? "Güncelle" : "Temayı ekle"}
                    </button>
                    {editId && (
                        <button type="button" onClick={() => { setEditId(null); setForm(EMPTY()); }} className="h-11 px-5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-black text-zinc-600 dark:text-zinc-300">Vazgeç</button>
                    )}
                </div>
            </form>

            <section className="space-y-3">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">Temalar</h2>
                {!themes ? (
                    <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                ) : themes.length === 0 ? (
                    <p className="text-sm font-semibold text-zinc-500">Henüz tema yok. Yukarıdan ilk temayı ekleyebilirsin; o zamana kadar Keşfet&apos;te tema kartı görünmez.</p>
                ) : (
                    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                        {themes.map(t => {
                            const s = state(t);
                            return (
                                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-950">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-zinc-900 dark:text-white truncate">#{t.hashtag}</span>
                                            <span className={cn("h-5 px-2 rounded-full text-[10px] font-black inline-flex items-center",
                                                s === "Yayında" ? "bg-amber-500/15 text-amber-600" : s === "Planlandı" ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400")}>{s}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-zinc-500 truncate">{t.title} · {fmt(t.startsOn)} – {fmt(t.endsOn)} · {t.rewardPoints} puan</div>
                                    </div>
                                    {confirmDelete === t.id ? (
                                        <>
                                            <button onClick={() => remove(t.id)} className="h-9 px-3 rounded-xl bg-red-600 text-white text-xs font-black">Sil</button>
                                            <button onClick={() => setConfirmDelete(null)} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-300">Vazgeç</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => edit(t)} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-700 dark:text-zinc-200">Düzenle</button>
                                            <button onClick={() => setConfirmDelete(t.id)} className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-red-600">Sil</button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
