"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useMyBusinesses } from "@/hooks/useMyBusinesses";

const CHANGED_EVENT = "moffi-account-deletion-changed";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function useDeletionDate() {
    const { user } = useAuth();
    const userId = user?.id;
    // Kimin için okunduğu da tutulur: oturum değişince eski kullanıcının tarihi gösterilmez.
    const [state, setState] = useState<{ userId: string; date: string | null } | null>(null);

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        const load = () => {
            supabase.from("profiles").select("deletion_scheduled_for").eq("id", userId).maybeSingle()
                .then(({ data }) => { if (alive) setState({ userId, date: data?.deletion_scheduled_for ?? null }); });
        };
        load();
        window.addEventListener(CHANGED_EVENT, load);
        return () => { alive = false; window.removeEventListener(CHANGED_EVENT, load); };
    }, [userId]);

    return state && state.userId === userId ? state.date : null;
}

// Silme bekleyen hesapta her sayfanın üstünde: tarih + geri alma
export function AccountDeletionBanner() {
    const date = useDeletionDate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (!date) return null;

    const cancel = async () => {
        setBusy(true); setError("");
        const { error } = await supabase.rpc("cancel_account_deletion");
        setBusy(false);
        if (error) setError("Geri alınamadı, tekrar dene.");
        else window.dispatchEvent(new Event(CHANGED_EVENT));
    };

    return (
        <div role="alert" className="fixed top-0 inset-x-0 z-[3500] bg-red-600 text-white px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+10px)] flex items-center justify-center gap-3 text-sm shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="min-w-0">Hesabın <b>{formatDate(date)}</b> tarihinde kalıcı olarak silinecek.{error && ` ${error}`}</span>
            <button onClick={cancel} disabled={busy} className="shrink-0 px-3 py-1 rounded-full bg-white text-red-700 font-semibold text-xs disabled:opacity-60">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Silmeyi geri al"}
            </button>
        </div>
    );
}

// Ayarlar → Tehlikeli bölge
export function DeleteAccountButton() {
    const { logout } = useAuth();
    const date = useDeletionDate();
    // Tek sahibi olduğu işletmeler hesap silinince kapanır (prepare_account_purge onayı kaldırır; haritada/aramada görünmez).
    const ownedBusinesses = useMyBusinesses().filter(b => b.role === "owner");
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        setBusy(true); setError("");
        const { error } = await supabase.rpc("request_account_deletion");
        setBusy(false);
        if (error) { setError(error.message || "Talep alınamadı, tekrar dene."); return; }
        window.dispatchEvent(new Event(CHANGED_EVENT));
        await logout();
        window.location.replace("/");
    };

    return (
        <>
            <button
                onClick={() => { setOpen(true); setConfirmText(""); setError(""); }}
                disabled={!!date}
                className="w-full flex items-center justify-between py-4 px-4 hover:bg-red-500/10 transition-all rounded-3xl group text-left disabled:opacity-60"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-red-500">Hesabı ve verileri sil</p>
                        <p className="text-[11px] text-red-500/60 mt-0.5">
                            {date ? `Silme talebin var: ${formatDate(date)}` : "30 gün içinde geri alabilirsin"}
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-red-500/30" />
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[4000] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Hesabını silmek istiyor musun?</h2>
                        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-5">
                            <li>Hesabın 30 gün sonra kalıcı olarak silinir. Bu süre içinde giriş yapıp geri alabilirsin.</li>
                            <li>Silinince profilin, evcil hayvanların, sağlık kayıtların, gönderilerin, mesajların ve fotoğrafların geri getirilemez.</li>
                            <li>Siparişlerin ve işletmelerdeki randevu kayıtların, yasal saklama gereği isimsiz olarak işletmede kalır.</li>
                            {ownedBusinesses.length > 0 && (
                                <li className="text-red-600 dark:text-red-400 font-medium">
                                    Sahibi olduğun {ownedBusinesses.map(b => b.name).join(", ")} da kapanır: haritada, aramada ve Moffi akışlarında artık görünmez.
                                    Ekibinde başka kişiler varsa önce onları ekipten çıkarman gerekir.
                                </li>
                            )}
                        </ul>
                        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
                            Onaylamak için <b>SİL</b> yaz
                            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus
                                className="mt-1.5 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-red-500" />
                        </label>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setOpen(false)} disabled={busy} className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm">Vazgeç</button>
                            <button onClick={submit} disabled={busy || confirmText.trim().toLocaleUpperCase("tr-TR") !== "SİL"}
                                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-40">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Hesabımı sil"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
