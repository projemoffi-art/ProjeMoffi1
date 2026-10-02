"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Stage = "loading" | "enroll" | "challenge" | "ok";

// Yönetim paneli sadece iki adımlı doğrulamayla (aal2) açılmış oturumda gösterilir.
// Veritabanındaki yönetici yetkisi de aal2 ister (get_my_role / is_admin); bu ekran kullanıcıyı oraya getirir.
export function AdminMfaGate({ children }: { children: React.ReactNode }) {
    const [stage, setStage] = useState<Stage>("loading");
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qr, setQr] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const refresh = useCallback(async () => {
        setError("");
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") { setStage("ok"); return; }

        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = factors?.totp?.find((f) => f.status === "verified");
        if (verified) { setFactorId(verified.id); setStage("challenge"); return; }

        // Yarım kalmış (doğrulanmamış) kurulumları temizleyip yeniden başlat
        for (const f of factors?.all || []) {
            if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Moffi yönetim ${Date.now()}` });
        if (error || !data) { setError("Kurulum başlatılamadı. Sayfayı yenileyip tekrar dene."); setStage("enroll"); return; }
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStage("enroll");
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId || code.length !== 6) return;
        setBusy(true); setError("");
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
        setBusy(false);
        if (error) { setError("Kod hatalı ya da süresi geçti. Uygulamadaki güncel kodu gir."); setCode(""); return; }
        setStage("ok");
    };

    if (stage === "ok") return <>{children}</>;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                    <div>
                        <h1 className="font-bold">İki adımlı doğrulama</h1>
                        <p className="text-xs text-zinc-400">Yönetim paneli için zorunlu</p>
                    </div>
                </div>

                {stage === "loading" && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>}

                {stage === "enroll" && (
                    <div className="space-y-3 text-sm text-zinc-300">
                        <p>1. Telefonuna bir doğrulama uygulaması kur (Google Authenticator, Microsoft Authenticator ya da 1Password).</p>
                        <p>2. Uygulamada “QR kod tara” deyip aşağıdaki kodu okut.</p>
                        {qr && <img src={qr} alt="İki adımlı doğrulama QR kodu" className="w-44 h-44 mx-auto bg-white rounded-xl p-2" />}
                        {secret && <p className="text-xs text-zinc-500 break-all text-center">Tarayamıyorsan elle gir: <span className="font-mono text-zinc-300">{secret}</span></p>}
                        <p>3. Uygulamanın gösterdiği 6 haneli kodu yaz.</p>
                    </div>
                )}

                {stage === "challenge" && <p className="text-sm text-zinc-300">Doğrulama uygulamandaki 6 haneli kodu gir.</p>}

                {(stage === "enroll" || stage === "challenge") && (
                    <form onSubmit={verify} className="space-y-3">
                        <input inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            aria-label="Doğrulama kodu" placeholder="••••••"
                            className="w-full py-3 text-center text-2xl font-bold tracking-[0.5em] bg-zinc-950 border border-zinc-700 rounded-2xl outline-none focus:border-zinc-400" />
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <button type="submit" disabled={busy || code.length !== 6} className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-sm disabled:opacity-40">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Doğrula"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
