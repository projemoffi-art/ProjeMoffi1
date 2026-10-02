"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ErrorText, PrimaryButton, ScreenFrame, SecondaryButton, inputCls } from "@/components/onboarding/OnboardingUI";

// Giriş + kayıt akışı: Karşılama (1), Hesap Aç (2), E-posta Doğrulama (3), Giriş, Şifre sıfırlama.
// Tasarım: design-reference/onboarding-final. Kayıt tamamlanınca onDone(true), giriş tamamlanınca onDone(false).

type View = "welcome" | "signup" | "verify" | "login" | "reset";

const COMMON_TYPOS: Record<string, string> = {
    "gmal.com": "gmail.com", "gamil.com": "gmail.com", "gmail.co": "gmail.com", "hotmal.com": "hotmail.com", "yaho.com": "yahoo.com", "outlook.co": "outlook.com",
};

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function codeError(err?: string) {
    const m = (err || "").toLowerCase();
    if (m.includes("expired") || m.includes("invalid") || m.includes("otp") || m.includes("token")) return "Kod hatalı ya da süresi dolmuş. Yeni kod isteyebilirsin.";
    if (m.includes("rate") || m.includes("too many") || m.includes("seconds")) return "Çok sık denedin. Biraz bekleyip tekrar dene.";
    if (m.includes("same") && m.includes("password")) return "Yeni şifre eskisiyle aynı olamaz.";
    if (m.includes("password")) return "Şifre en az 8 karakter olmalı.";
    return "Bir sorun oluştu. Lütfen tekrar dene.";
}

function Field({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div className="relative">
            <Icon className="w-5 h-5 text-secondary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            {children}
        </div>
    );
}

function PasswordInput({ value, onChange, placeholder, autoComplete }: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string }) {
    const [show, setShow] = useState(false);
    return (
        <Field icon={Lock}>
            <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                autoComplete={autoComplete} className={cn(inputCls, "pr-12")} required />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-secondary">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </Field>
    );
}

// Doğrulama kodu kutuları: 6 kutuyla başlar, 7-8. hane yazılırsa uzar (Supabase kod uzunluğu 6 ya da 8 olabilir).
function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    const count = Math.min(8, Math.max(6, value.length));
    return (
        <div className="relative" onClick={() => ref.current?.focus()}>
            <div className="flex justify-center gap-2" aria-hidden>
                {Array.from({ length: count }).map((_, i) => (
                    <span key={i} className={cn(
                        "w-11 h-14 rounded-xl bg-card border text-2xl font-bold flex items-center justify-center transition",
                        i === Math.min(value.length, count - 1) ? "border-accent ring-4 ring-accent/10" : "border-card-border",
                    )}>{value[i] ?? ""}</span>
                ))}
            </div>
            <input ref={ref} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} aria-label="Doğrulama kodu"
                className="absolute inset-0 w-full h-full opacity-0 cursor-text" />
        </div>
    );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className="w-full h-14 rounded-2xl bg-card border border-card-border font-semibold text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
            Google ile Devam Et
        </button>
    );
}

function Legal() {
    return (
        <p className="text-[11px] text-secondary text-center leading-relaxed">
            Hesap açarak <a href="/terms" className="underline">Kullanım Koşulları</a> ve <a href="/privacy" className="underline">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
        </p>
    );
}

export function AuthFlow({ onDone, initialView = "welcome" }: { onDone: (isNewSignup: boolean) => void; initialView?: View }) {
    const { signup, login, verifyOtp, resendOtp, signInWithGoogle, forgotPassword, resetPasswordWithCode } = useAuth();
    const [view, setView] = useState<View>(initialView);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [terms, setTerms] = useState(false);
    const [marketing, setMarketing] = useState(false);

    const [code, setCode] = useState("");
    const [info, setInfo] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [afterVerifyNew, setAfterVerifyNew] = useState(true);

    const [resetSent, setResetSent] = useState(false);
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const go = (v: View) => { setView(v); setError(""); setInfo(""); };

    const submitSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const mail = email.trim();
        if (name.trim().length < 2) return setError("Adını ve soyadını yaz.");
        if (!emailOk(mail)) return setError("Geçerli bir e-posta adresi yaz.");
        const typo = COMMON_TYPOS[mail.split("@")[1]?.toLowerCase()];
        if (typo) return setError(`E-postanı yanlış yazmış olabilir misin? "${typo}" mu demek istedin?`);
        if (password.length < 8 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) return setError("Şifre en az 8 karakter olmalı, harf ve rakam içermeli.");
        if (!terms) return setError("Devam etmek için Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmelisin.");
        setBusy(true);
        const r = await signup(name.trim(), mail, password, marketing);
        setBusy(false);
        if (!r.success) {
            const m = (r.error || "").toLowerCase();
            return setError(m.includes("already") ? "Bu e-posta zaten kayıtlı. Giriş yapmayı dene." : m.includes("password") ? "Şifre çok zayıf, daha güçlü bir şifre seç." : "Kayıt olunamadı. Bilgileri kontrol edip tekrar dene.");
        }
        if (r.needsVerification) { setAfterVerifyNew(true); setCode(""); setCooldown(60); go("verify"); }
        else onDone(true);
    };

    const submitLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const r = await login(email.trim(), password);
        setBusy(false);
        if (r.success) return onDone(false);
        if (r.needsVerification) { setAfterVerifyNew(false); setCode(""); setCooldown(60); return go("verify"); }
        const m = (r.error || "").toLowerCase();
        setError(m.includes("invalid login") ? "E-posta ya da şifre hatalı." : m.includes("too many") ? "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene." : "Giriş yapılamadı. Lütfen tekrar dene.");
    };

    const submitCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;
        setError(""); setInfo(""); setBusy(true);
        const r = await verifyOtp(email.trim(), code, "signup");
        setBusy(false);
        if (r.success) onDone(afterVerifyNew);
        else { setError(codeError(r.error)); setCode(""); }
    };

    const resend = async () => {
        setError(""); setInfo("");
        const r = await resendOtp(email.trim());
        if (r.success) { setInfo("Yeni kod gönderildi."); setCooldown(60); }
        else setError(codeError(r.error));
    };

    const submitReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!resetSent) {
            if (!emailOk(email.trim())) return setError("Geçerli bir e-posta adresi yaz.");
            setBusy(true);
            const r = await forgotPassword(email.trim());
            setBusy(false);
            // Hesabın var olup olmadığı açığa çıkmasın diye her durumda aynı adıma geçilir
            if (r.success || !/rate|too many|seconds/i.test(r.error || "")) { setResetSent(true); setCooldown(60); }
            else setError("Çok sık denedin. Biraz bekleyip tekrar dene.");
            return;
        }
        if (resetCode.length < 6) return setError("E-postana gelen kodu yaz.");
        if (newPassword.length < 8 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(newPassword) || !/\d/.test(newPassword)) return setError("Şifre en az 8 karakter olmalı, harf ve rakam içermeli.");
        setBusy(true);
        const r = await resetPasswordWithCode(email.trim(), resetCode, newPassword);
        setBusy(false);
        if (r.success) onDone(false);
        else setError(codeError(r.error));
    };

    // ── 1. Karşılama ──────────────────────────────────────────────────────────────
    if (view === "welcome") {
        return (
            <main className="theme-vet min-h-[100dvh] bg-background text-foreground flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center px-6 pt-[calc(24px+env(safe-area-inset-top,0px))]">
                    <img src="/images/moffi_pet_trio.png" alt="" className="w-[78%] max-w-[300px] aspect-square object-contain -mb-4 mix-blend-multiply" />
                    <div className="flex items-center gap-2">
                        <span className="text-4xl" aria-hidden>🐾</span>
                        <h1 className="text-[44px] leading-none font-black tracking-tight text-accent">Moffi</h1>
                    </div>
                    <p className="mt-4 text-center text-[19px] font-semibold leading-snug">Daha fazla pati,<br />daha mutlu yarınlar.</p>
                </div>
                <div className="w-full max-w-md mx-auto px-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] space-y-3">
                    <PrimaryButton onClick={() => go("signup")}>Hesap Aç</PrimaryButton>
                    <SecondaryButton onClick={() => go("login")}>Giriş Yap</SecondaryButton>
                    <div className="flex items-center gap-3 text-xs text-secondary"><span className="flex-1 h-px bg-card-border" />veya<span className="flex-1 h-px bg-card-border" /></div>
                    <GoogleButton onClick={() => signInWithGoogle()} />
                    <div className="pt-1"><Legal /></div>
                </div>
            </main>
        );
    }

    // ── 2. Hesap Aç ───────────────────────────────────────────────────────────────
    if (view === "signup") {
        return (
            <ScreenFrame title="Hesap Aç" stage={1} onBack={() => go("welcome")}
                footer={<PrimaryButton form="signup-form" type="submit" loading={busy}>Devam Et</PrimaryButton>}>
                <form id="signup-form" onSubmit={submitSignup} className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-black">Hesabını oluştur</h2>
                        <p className="text-sm text-secondary mt-1.5 leading-relaxed">Moffi topluluğuna katıl, patili dostların için daha güzel bir dünya oluştur.</p>
                    </div>
                    <Field icon={User}><input value={name} onChange={e => setName(e.target.value)} placeholder="Ad ve soyad" autoComplete="name" className={inputCls} required /></Field>
                    <Field icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta adresi" autoComplete="email" className={inputCls} required /></Field>
                    <PasswordInput value={password} onChange={setPassword} placeholder="Şifre oluştur" autoComplete="new-password" />
                    <p className="text-xs text-secondary -mt-2">En az 8 karakter, harf ve rakam içermeli.</p>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#EE5B3D] shrink-0" />
                        <span className="text-[13px] leading-snug">
                            <a href="/terms" target="_blank" className="underline">Kullanım Koşulları</a> ve <a href="/privacy" target="_blank" className="underline">Gizlilik Politikası</a>'nı okudum, kabul ediyorum.
                        </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#EE5B3D] shrink-0" />
                        <span className="text-[13px] leading-snug text-secondary">Kampanya ve yeniliklerden haberdar olmak istiyorum. <span className="opacity-80">(İsteğe bağlı)</span></span>
                    </label>
                    <ErrorText>{error}</ErrorText>
                </form>
            </ScreenFrame>
        );
    }

    // ── 3. E-posta Doğrulama ──────────────────────────────────────────────────────
    if (view === "verify") {
        return (
            <ScreenFrame title="E-posta Doğrulama" stage={2} onBack={() => go(afterVerifyNew ? "signup" : "login")}
                footer={<PrimaryButton form="code-form" type="submit" loading={busy} disabled={code.length < 6}>Doğrula</PrimaryButton>}>
                <form id="code-form" onSubmit={submitCode} className="flex flex-col items-center text-center gap-5">
                    <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mt-2"><Mail className="w-11 h-11 text-accent" /></div>
                    <div>
                        <h2 className="text-2xl font-black">Doğrulama kodunu gönderdik</h2>
                        <p className="text-sm text-secondary mt-2 leading-relaxed"><b className="text-foreground">{email.trim()}</b> adresine bir kod gönderdik. Lütfen gelen kutunu (ve gereksiz klasörünü) kontrol et.</p>
                    </div>
                    <CodeBoxes value={code} onChange={setCode} />
                    <ErrorText>{error}</ErrorText>
                    {info && <p className="text-sm font-semibold text-emerald-700">{info}</p>}
                    <button type="button" onClick={resend} disabled={cooldown > 0} className="text-sm font-bold text-accent disabled:text-secondary">
                        {cooldown > 0 ? `Kodu tekrar gönder (${cooldown} sn)` : "Kodu tekrar gönder"}
                    </button>
                    <button type="button" onClick={() => go(afterVerifyNew ? "signup" : "login")} className="text-sm font-semibold text-secondary underline">E-posta adresini yanlış yazdım</button>
                </form>
            </ScreenFrame>
        );
    }

    // ── Giriş ─────────────────────────────────────────────────────────────────────
    if (view === "login") {
        return (
            <ScreenFrame title="Giriş Yap" onBack={() => go("welcome")}
                footer={<PrimaryButton form="login-form" type="submit" loading={busy}>Giriş Yap</PrimaryButton>}>
                <form id="login-form" onSubmit={submitLogin} className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-black">Tekrar hoş geldin</h2>
                        <p className="text-sm text-secondary mt-1.5">Hesabına giriş yap ve patili dostlarının yanına dön.</p>
                    </div>
                    <Field icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta adresi" autoComplete="email" className={inputCls} required /></Field>
                    <PasswordInput value={password} onChange={setPassword} placeholder="Şifre" autoComplete="current-password" />
                    <div className="flex justify-end -mt-1"><button type="button" onClick={() => { setResetSent(false); go("reset"); }} className="text-sm font-bold text-accent">Şifremi unuttum</button></div>
                    <ErrorText>{error}</ErrorText>
                    <div className="flex items-center gap-3 text-xs text-secondary pt-1"><span className="flex-1 h-px bg-card-border" />veya<span className="flex-1 h-px bg-card-border" /></div>
                    <GoogleButton onClick={() => signInWithGoogle()} />
                    <p className="text-center text-sm text-secondary pt-2">Hesabın yok mu? <button type="button" onClick={() => go("signup")} className="font-bold text-accent">Hesap Aç</button></p>
                </form>
            </ScreenFrame>
        );
    }

    // ── Şifre sıfırlama ───────────────────────────────────────────────────────────
    return (
        <ScreenFrame title="Şifremi Unuttum" onBack={() => go("login")}
            footer={<PrimaryButton form="reset-form" type="submit" loading={busy}>{resetSent ? "Şifreyi Güncelle" : "Kod Gönder"}</PrimaryButton>}>
            <form id="reset-form" onSubmit={submitReset} className="space-y-4">
                {!resetSent ? (
                    <>
                        <div>
                            <h2 className="text-2xl font-black">Şifreni sıfırla</h2>
                            <p className="text-sm text-secondary mt-1.5">E-posta adresini yaz, sana bir kod gönderelim.</p>
                        </div>
                        <Field icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta adresi" autoComplete="email" className={inputCls} required /></Field>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-secondary leading-relaxed">Bu adres kayıtlıysa <b className="text-foreground">{email.trim()}</b> adresine bir kod gönderdik.</p>
                        <CodeBoxes value={resetCode} onChange={setResetCode} />
                        <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Yeni şifre" autoComplete="new-password" />
                        <p className="text-xs text-secondary -mt-2">En az 8 karakter, harf ve rakam içermeli.</p>
                        <button type="button" onClick={() => { setResetSent(false); setResetCode(""); }} disabled={cooldown > 0} className="text-sm font-bold text-accent disabled:text-secondary">
                            {cooldown > 0 ? `Kod gelmedi mi? (${cooldown} sn)` : "Kod gelmedi mi? Tekrar gönder"}
                        </button>
                    </>
                )}
                <ErrorText>{error}</ErrorText>
            </form>
        </ScreenFrame>
    );
}
