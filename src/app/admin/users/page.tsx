"use client";

// Kullanıcılar: kişi hesapları. İşletme başvuruları burada değil, İşletme Yönetimi'nde (8.54).
// Hesap kapatma 30 günlük süreçle (admin_schedule_account_deletion, 8.57); profil satırı doğrudan silinmez.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, KeyRound, Loader2, RotateCcw, Search, Shield, UserX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { cn, showToast } from "@/lib/utils";

interface Row {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    createdAt: string;
    deletionAt: string | null;
}

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : (e as { message?: string })?.message) || fallback;

export default function AdminUsersPage() {
    const { user: me, forgotPassword } = useAuth();
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, username, role, avatar_url, created_at, deletion_scheduled_for")
            .order("created_at", { ascending: false })
            .limit(1000);
        if (error) showToast("Kullanıcılar okunamadı.", "AlertCircle", "text-red-500 font-bold");
        // E-posta profiles'ta değil, giriş sisteminde: yalnızca yöneticiye açık fonksiyondan.
        const { data: emails } = data?.length ? await supabase.rpc("admin_user_emails", { p_ids: data.map(p => p.id) }) : { data: [] };
        const emailById = new Map(((emails || []) as { id: string; email: string }[]).map(e => [e.id, e.email]));
        setRows((data || []).map(p => ({
            id: p.id, name: p.full_name || p.username || "İsimsiz", email: emailById.get(p.id) || "", role: p.role || "user",
            avatar: p.avatar_url, createdAt: p.created_at, deletionAt: p.deletion_scheduled_for,
        })));
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const q = search.trim().toLocaleLowerCase("tr-TR");
    const visible = useMemo(() => rows.filter(r => !q || r.name.toLocaleLowerCase("tr-TR").includes(q) || r.email.toLowerCase().includes(q)), [rows, q]);

    const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
        setBusyId(id);
        try { await fn(); showToast(ok, "CheckCircle2", "text-emerald-500 font-bold"); await load(); }
        catch (e) { showToast(errText(e, "İşlem yapılamadı."), "AlertCircle", "text-red-500 font-bold"); }
        finally { setBusyId(null); }
    };

    const resetPassword = (r: Row) => act(r.id, async () => {
        const res = await forgotPassword(r.email);
        if (!res.success) throw new Error(res.error || "E-posta gönderilemedi.");
    }, `${r.email} adresine şifre sıfırlama e-postası gönderildi.`);

    const scheduleDeletion = (r: Row) => {
        if (!confirm(`${r.name} hesabı 30 gün sonra kalıcı olarak silinecek ve kişiye e-posta gidecek. Bu süre içinde geri alabilirsin. Devam edilsin mi?`)) return;
        act(r.id, async () => {
            const { error } = await supabase.rpc("admin_schedule_account_deletion", { p_user: r.id });
            if (error) throw error;
        }, "Hesap kapatma sürecine alındı.");
    };

    const cancelDeletion = (r: Row) => act(r.id, async () => {
        const { error } = await supabase.rpc("admin_cancel_account_deletion", { p_user: r.id });
        if (error) throw error;
    }, "Hesap kapatma geri alındı.");

    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-0 pt-10 pb-32 space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Kullanıcılar</h1>
                    <p className="text-sm font-semibold text-zinc-500 max-w-xl">
                        Kişi hesapları ({rows.length}). İşletme başvuruları <Link href="/admin/businesses" className="text-amber-600 font-bold">İşletme Yönetimi</Link>&apos;nde.
                    </p>
                </div>
                <label className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya e-posta" aria-label="Kullanıcı ara"
                        className="h-11 w-64 pl-10 pr-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-amber-500" />
                </label>
            </header>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
            ) : visible.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-zinc-500">Kullanıcı bulunamadı.</p>
            ) : (
                <ul className="space-y-2">
                    {visible.map(r => (
                        <li key={r.id} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden flex items-center justify-center shrink-0 text-sm font-black text-zinc-500">
                                {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : r.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2">
                                    <span className="font-black text-zinc-900 dark:text-white truncate">{r.name}</span>
                                    {r.role === "admin" && <span className="px-2 h-5 rounded-md bg-amber-500/15 text-amber-600 text-[11px] font-black inline-flex items-center gap-1"><Shield className="w-3 h-3" />Yönetici</span>}
                                    {r.role === "business" && <span className="px-2 h-5 rounded-md bg-zinc-500/15 text-zinc-500 text-[11px] font-black inline-flex items-center gap-1"><Building2 className="w-3 h-3" />İşletme sahibi</span>}
                                </span>
                                <span className="block text-xs font-semibold text-zinc-500 truncate">
                                    {r.email} · {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                                    {r.deletionAt && <span className="text-rose-500"> · {new Date(r.deletionAt).toLocaleDateString("tr-TR")} tarihinde silinecek</span>}
                                </span>
                            </span>
                            {busyId === r.id ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400 shrink-0" /> : (
                                <span className="flex gap-1.5 shrink-0">
                                    {r.email && (
                                        <button onClick={() => resetPassword(r)} title="Şifre sıfırlama e-postası gönder" aria-label="Şifre sıfırlama e-postası gönder"
                                            className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300"><KeyRound className="w-4 h-4" /></button>
                                    )}
                                    {r.role !== "admin" && r.id !== me?.id && (r.deletionAt ? (
                                        <button onClick={() => cancelDeletion(r)} title="Hesap kapatmayı geri al" aria-label="Hesap kapatmayı geri al"
                                            className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><RotateCcw className="w-4 h-4" /></button>
                                    ) : (
                                        <button onClick={() => scheduleDeletion(r)} title="Hesabı kapat (30 gün)" aria-label="Hesabı kapat"
                                            className={cn("w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600")}><UserX className="w-4 h-4" /></button>
                                    ))}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
