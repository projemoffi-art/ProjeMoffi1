"use client";

// İşletme başvurusu (8.54: hesap = kişi, işletme = ayrı kayıt). Kişi önce kendi Moffi hesabıyla giriş yapar
// (e-postası doğrulanmış olmalı), sonra işletme bilgilerini girer. Kayıt tek sunucu fonksiyonuyla açılır:
// businessApplicationService.submit → submit_business_application. Reddedilen başvuru ?resubmit=<id> ile düzeltilip yeniden gönderilir.

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, ArrowRight, Building2, CheckCircle2, Clock, FileText, GraduationCap, Heart, Loader2,
    MapPin, Scissors, ShieldCheck, Stethoscope, Store,
} from "lucide-react";
import { useAuth, type BusinessType } from "@/context/AuthContext";
import { geolocation } from "@/native";
import { cn } from "@/lib/utils";
import { invalidateMyBusinesses, setLastPanel } from "@/hooks/useMyBusinesses";
import turkeyCities from "@/data/turkey_cities.json";
import {
    businessApplicationService, formatIban, isValidTrIban, type BusinessApplicationInput,
} from "@/services/businessApplicationService";

const LocationPicker = dynamic(() => import("@/components/business/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-56 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />,
});

const ACCENT = "#5B4D9D";

const TYPES: { key: BusinessType; label: string; desc: string; Icon: typeof Store }[] = [
    { key: "vet", label: "Veteriner kliniği", desc: "Muayene, aşı, randevu ve hasta kayıtları", Icon: Stethoscope },
    { key: "petshop", label: "Pet shop", desc: "Mama, aksesuar ve online satış", Icon: Store },
    { key: "grooming", label: "Pet kuaför", desc: "Yıkama, tıraş ve bakım randevuları", Icon: Scissors },
    { key: "trainer", label: "Eğitmen", desc: "Eğitim seansları ve programlar", Icon: GraduationCap },
    { key: "shelter", label: "Barınak", desc: "Sahiplendirme ilanları ve başvurular", Icon: Heart },
];

const STEPS = ["Tür", "İşletme", "Yasal ve konum", "Onay"] as const;

const input = "w-full h-12 px-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 text-[15px] font-medium text-foreground outline-none focus:border-[#5B4D9D] transition-colors";
const label = "block text-[13px] font-bold text-zinc-600 dark:text-zinc-300 mb-1.5";

type Cities = { name: string; districts: { name: string }[] }[];

export default function BusinessRegisterPage() {
    return (
        <Suspense fallback={<FullSpinner />}>
            <BusinessRegister />
        </Suspense>
    );
}

function FullSpinner() {
    return (
        <main className="min-h-[100dvh] bg-[#F7F5FB] dark:bg-[#0E0D12] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        </main>
    );
}

function BusinessRegister() {
    const { user, isLoading } = useAuth();
    const params = useSearchParams();
    const resubmitId = params.get("resubmit");
    if (isLoading) return <FullSpinner />;
    if (!user) return <Intro />;
    return <ApplicationForm key={resubmitId || "new"} defaultOwner={user.name || ""} resubmitId={resubmitId} />;
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
    const router = useRouter();
    return (
        <main className="min-h-[100dvh] bg-[#F7F5FB] dark:bg-[#0E0D12] text-foreground">
            <header className="sticky top-0 z-10 bg-[#F7F5FB]/90 dark:bg-[#0E0D12]/90 backdrop-blur px-4 h-14 flex items-center justify-between max-w-xl mx-auto">
                <button type="button" onClick={onBack || (() => router.back())} aria-label="Geri" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-black/5 dark:active:bg-white/10">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-[15px] font-extrabold">Moffi İşletme</span>
                <span className="w-10" />
            </header>
            <div className="px-4 pb-10 max-w-xl mx-auto">{children}</div>
        </main>
    );
}

/** Giriş yapmamış ziyaretçi: işletme Moffi hesabına bağlı açılır; önce hesap. */
function Intro() {
    const router = useRouter();
    return (
        <Shell onBack={() => router.push("/")}>
            <div className="pt-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: ACCENT }}>
                    <Building2 className="w-7 h-7" />
                </div>
                <h1 className="text-[28px] font-black tracking-tight leading-tight mt-5">İşletmeni Moffi&apos;ye ekle</h1>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
                    Çevrendeki evcil hayvan sahipleri seni haritada bulsun; randevu, satış ve kampanyalarını tek panelden yönet.
                </p>
                <ol className="mt-7 space-y-3">
                    {[
                        { t: "Moffi hesabınla giriş yap", d: "Hesabın yoksa e-postanla birkaç dakikada açılır." },
                        { t: "İşletme bilgilerini gir", d: "Tür, iletişim, vergi numarası, IBAN ve konum." },
                        { t: "Moffi incelesin", d: "Genellikle 1–2 iş günü. Sonuç bildirim ve e-postayla gelir." },
                    ].map((s, i) => (
                        <li key={s.t} className="flex gap-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                            <span className="w-7 h-7 shrink-0 rounded-full text-white text-[13px] font-black flex items-center justify-center" style={{ background: ACCENT }}>{i + 1}</span>
                            <span>
                                <span className="block text-[15px] font-extrabold">{s.t}</span>
                                <span className="block text-[13px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{s.d}</span>
                            </span>
                        </li>
                    ))}
                </ol>
                <button
                    type="button"
                    onClick={() => router.push("/?next=/business-register")}
                    className="mt-8 w-full h-14 rounded-2xl text-white text-[16px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{ background: ACCENT }}
                >
                    Giriş yap ya da hesap aç <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-[12px] text-zinc-500 text-center mt-3 font-medium">İşletmen kişisel hesabına bağlı olur; çalışanlarını sonra panelden davet edebilirsin.</p>
            </div>
        </Shell>
    );
}

function ApplicationForm({ defaultOwner, resubmitId }: { defaultOwner: string; resubmitId: string | null }) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<BusinessApplicationInput>(() => ({
        type: "vet", name: "", ownerName: defaultOwner, phone: "", taxId: "", iban: "TR",
        address: "", province: "", district: "", lat: NaN, lng: NaN,
    }));
    const [typeChosen, setTypeChosen] = useState(false);
    const [agree, setAgree] = useState(false);
    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [rejection, setRejection] = useState<string | null>(null);
    const [loadingOwn, setLoadingOwn] = useState(!!resubmitId);

    const set = <K extends keyof BusinessApplicationInput>(k: K, v: BusinessApplicationInput[K]) => setForm(f => ({ ...f, [k]: v }));

    // Reddedilen başvuruyu düzeltme: mevcut bilgilerle doldur.
    useEffect(() => {
        if (!resubmitId) return;
        let alive = true;
        businessApplicationService.loadOwn(resubmitId)
            .then(own => {
                if (!alive) return;
                if (!own || own.kybStatus !== "rejected") { setError("Bu başvuru düzenlenemez; yalnızca reddedilen başvuru yeniden gönderilir."); return; }
                const { kybStatus: _s, rejectionReason, ...rest } = own;
                void _s;
                setForm({ ...rest, iban: formatIban(rest.iban) });
                setTypeChosen(true);
                setRejection(rejectionReason);
            })
            .catch(e => alive && setError(e.message))
            .finally(() => alive && setLoadingOwn(false));
        return () => { alive = false; };
    }, [resubmitId]);

    const districts = useMemo(() => (turkeyCities as Cities).find(c => c.name === form.province)?.districts || [], [form.province]);
    const phoneDigits = form.phone.replace(/\D/g, "");
    const taxDigits = form.taxId.replace(/\D/g, "");
    const ibanOk = isValidTrIban(form.iban);
    const hasPin = Number.isFinite(form.lat) && Number.isFinite(form.lng);

    const stepValid = [
        typeChosen,
        form.name.trim().length >= 2 && form.ownerName.trim().length >= 2 && phoneDigits.length >= 10,
        /^\d{10,11}$/.test(taxDigits) && ibanOk && !!form.province && !!form.district && form.address.trim().length >= 5 && hasPin,
        agree,
    ][step];

    const useMyLocation = () => {
        if (!geolocation.isSupported()) { setError("Cihazın konum desteklemiyor; haritaya dokunarak işaretle."); return; }
        setLocating(true);
        geolocation.getCurrent({ highAccuracy: true, timeoutMs: 10000 })
            .then(fix => { set("lat", fix.lat); set("lng", fix.lng); setError(""); })
            .catch(() => setError("Konum alınamadı; haritaya dokunarak işaretleyebilirsin."))
            .finally(() => setLocating(false));
    };

    const submit = async () => {
        setSubmitting(true);
        setError("");
        try {
            await businessApplicationService.submit({ ...form, iban: form.iban.replace(/\s/g, "") }, resubmitId);
            invalidateMyBusinesses();
            setLastPanel("business");
            setDone(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Başvuru gönderilemedi.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingOwn) return <FullSpinner />;

    if (done) {
        return (
            <Shell onBack={() => router.push("/home")}>
                <div className="pt-10 text-center">
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: `${ACCENT}1A` }}>
                        <Clock className="w-10 h-10" style={{ color: ACCENT }} />
                    </div>
                    <h1 className="text-[26px] font-black mt-6">Başvurun alındı</h1>
                    <p className="text-[15px] text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
                        {form.name.trim()} için başvurunu Moffi ekibi inceleyecek (genellikle 1–2 iş günü). Sonuç bildirim ve e-postayla gelir;
                        onaylanınca işletmen haritada görünür ve panelin tüm özellikleriyle açılır.
                    </p>
                    <button type="button" onClick={() => router.push("/business/dashboard")} className="mt-8 w-full h-14 rounded-2xl text-white text-[16px] font-extrabold" style={{ background: ACCENT }}>
                        Başvuru durumunu gör
                    </button>
                    <button type="button" onClick={() => router.push("/home")} className="mt-3 w-full h-12 rounded-2xl text-[15px] font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800">
                        Ana sayfaya dön
                    </button>
                </div>
            </Shell>
        );
    }

    return (
        <Shell onBack={() => (step > 0 ? setStep(s => s - 1) : router.back())}>
            {/* İlerleme */}
            <div className="pt-2">
                <div className="flex gap-1.5">
                    {STEPS.map((s, i) => (
                        <span key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? ACCENT : "rgba(120,113,108,0.2)" }} />
                    ))}
                </div>
                <p className="text-[12px] font-bold text-zinc-500 mt-2">Adım {step + 1}/{STEPS.length} · {STEPS[step]}</p>
            </div>

            {rejection && step === 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <p className="text-[13px] font-extrabold text-rose-700 dark:text-rose-300">Önceki başvurun onaylanmadı</p>
                    <p className="text-[13px] font-medium text-rose-700/90 dark:text-rose-300/90 mt-1">Neden: {rejection}</p>
                    <p className="text-[12px] font-medium text-rose-700/70 dark:text-rose-300/70 mt-1">Bilgilerini düzeltip yeniden gönderebilirsin.</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.section key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="mt-5">
                    {step === 0 && (
                        <>
                            <h1 className="text-[24px] font-black tracking-tight">Ne tür bir işletmen var?</h1>
                            <p className="text-[14px] text-zinc-500 font-medium mt-1">Panelin menüsü ve müşterilere görünüşün buna göre ayarlanır.</p>
                            <div className="mt-5 space-y-2.5">
                                {TYPES.map(t => {
                                    const on = typeChosen && form.type === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => { set("type", t.key); setTypeChosen(true); }}
                                            aria-pressed={on}
                                            className={cn("w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left bg-white dark:bg-white/5 transition-colors", on ? "" : "border-zinc-200 dark:border-zinc-800")}
                                            style={on ? { borderColor: ACCENT, background: `${ACCENT}0F` } : undefined}
                                        >
                                            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: on ? ACCENT : `${ACCENT}14`, color: on ? "#fff" : ACCENT }}>
                                                <t.Icon className="w-5 h-5" />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[15px] font-extrabold">{t.label}</span>
                                                <span className="block text-[13px] text-zinc-500 font-medium">{t.desc}</span>
                                            </span>
                                            {on && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <h1 className="text-[24px] font-black tracking-tight">İşletme bilgileri</h1>
                            <p className="text-[14px] text-zinc-500 font-medium mt-1">Müşteriler işletmeni bu adla görür.</p>
                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className={label} htmlFor="b-name">İşletme adı</label>
                                    <input id="b-name" className={input} value={form.name} maxLength={80} onChange={e => set("name", e.target.value)} placeholder="örn. Moda Veteriner Kliniği" />
                                </div>
                                <div>
                                    <label className={label} htmlFor="b-owner">Yetkili adı soyadı</label>
                                    <input id="b-owner" className={input} value={form.ownerName} maxLength={80} onChange={e => set("ownerName", e.target.value)} placeholder="Ad Soyad" />
                                </div>
                                <div>
                                    <label className={label} htmlFor="b-phone">İşletme telefonu</label>
                                    <input id="b-phone" className={input} type="tel" inputMode="tel" value={form.phone} maxLength={20} onChange={e => set("phone", e.target.value)} placeholder="0532 000 00 00" />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="text-[24px] font-black tracking-tight">Yasal bilgiler ve konum</h1>
                            <p className="text-[14px] text-zinc-500 font-medium mt-1">Vergi numarası ve IBAN yalnızca Moffi ekibine ve işletme yöneticilerine görünür.</p>
                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className={label} htmlFor="b-tax">Vergi numarası (şahıs işletmesiyse T.C. kimlik no)</label>
                                    <input id="b-tax" className={input} inputMode="numeric" value={form.taxId} maxLength={11} onChange={e => set("taxId", e.target.value.replace(/\D/g, ""))} placeholder="10 ya da 11 hane" />
                                </div>
                                <div>
                                    <label className={label} htmlFor="b-iban">IBAN</label>
                                    <input
                                        id="b-iban"
                                        className={cn(input, "font-mono tracking-wide", form.iban.length > 6 && !ibanOk && "border-rose-400")}
                                        value={form.iban}
                                        maxLength={32}
                                        onChange={e => set("iban", formatIban(e.target.value.replace(/[^0-9a-zA-Z]/g, "")))}
                                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        autoCapitalize="characters"
                                    />
                                    <p className={cn("text-[12px] font-semibold mt-1.5", ibanOk ? "text-emerald-600" : "text-zinc-500")}>
                                        {ibanOk ? "IBAN doğrulandı." : "Ödemelerin (satış, komisyon sonrası tutar) bu hesaba yapılır."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={label} htmlFor="b-prov">İl</label>
                                        <select id="b-prov" className={input} value={form.province} onChange={e => { set("province", e.target.value); set("district", ""); }}>
                                            <option value="">Seç</option>
                                            {(turkeyCities as Cities).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label} htmlFor="b-dist">İlçe</label>
                                        <select id="b-dist" className={input} value={form.district} disabled={!form.province} onChange={e => set("district", e.target.value)}>
                                            <option value="">Seç</option>
                                            {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={label} htmlFor="b-addr">Açık adres</label>
                                    <textarea id="b-addr" className={cn(input, "h-auto min-h-[84px] py-3 resize-none")} value={form.address} maxLength={300} onChange={e => set("address", e.target.value)} placeholder="Mahalle, cadde/sokak, bina no" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={cn(label, "mb-0")}>Haritadaki yeri</span>
                                        <button type="button" onClick={useMyLocation} disabled={locating} className="text-[13px] font-bold flex items-center gap-1" style={{ color: ACCENT }}>
                                            <MapPin className="w-4 h-4" />{locating ? "Konum alınıyor…" : "Şu anki konumum"}
                                        </button>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                        <LocationPicker lat={hasPin ? form.lat : null} lng={hasPin ? form.lng : null} fallbackCenter={[39.0, 35.2]} onChange={(la, ln) => { set("lat", la); set("lng", ln); }} />
                                    </div>
                                    <p className="text-[12px] font-semibold text-zinc-500 mt-1.5">
                                        {hasPin ? "İğneyi sürükleyerek düzeltebilirsin." : "Haritada işletmenin yerine dokun; müşteriler seni burada bulur."}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h1 className="text-[24px] font-black tracking-tight">Kontrol et ve gönder</h1>
                            <div className="mt-5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800">
                                {[
                                    ["Tür", TYPES.find(t => t.key === form.type)?.label || ""],
                                    ["İşletme", form.name.trim()],
                                    ["Yetkili", form.ownerName.trim()],
                                    ["Telefon", form.phone.trim()],
                                    ["Vergi / T.C. no", taxDigits],
                                    ["IBAN", `${form.iban.replace(/\s/g, "").slice(0, 4)} •••• ${form.iban.replace(/\s/g, "").slice(-4)}`],
                                    ["Konum", `${form.district}, ${form.province}`],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-4 px-4 py-3">
                                        <span className="text-[13px] font-bold text-zinc-500">{k}</span>
                                        <span className="text-[14px] font-semibold text-right">{v}</span>
                                    </div>
                                ))}
                            </div>
                            <label className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0" style={{ accentColor: ACCENT }} />
                                <span className="text-[13px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                                    Bilgilerin doğru olduğunu ve <a href="/terms" target="_blank" className="font-bold underline">Moffi kullanım koşullarını</a> kabul ettiğimi onaylıyorum.
                                    Mağaza satışlarında platform komisyonu uygulanır.
                                </span>
                            </label>
                            <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-zinc-500">
                                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: ACCENT }} /> Onaydan önce işletmen müşterilere görünmez.
                            </p>
                        </>
                    )}
                </motion.section>
            </AnimatePresence>

            {error && (
                <p role="alert" className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[13px] font-semibold text-rose-700 dark:text-rose-300 flex gap-2">
                    <FileText className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </p>
            )}

            <button
                type="button"
                disabled={!stepValid || submitting}
                onClick={() => { setError(""); if (step < STEPS.length - 1) setStep(s => s + 1); else submit(); }}
                className="mt-6 w-full h-14 rounded-2xl text-white text-[16px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
                style={{ background: ACCENT }}
            >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" />
                    : step < STEPS.length - 1 ? <>Devam <ArrowRight className="w-5 h-5" /></>
                    : resubmitId ? "Yeniden gönder" : "Başvuruyu gönder"}
            </button>
        </Shell>
    );
}
