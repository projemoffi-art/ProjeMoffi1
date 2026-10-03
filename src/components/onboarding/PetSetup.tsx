"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Bell, Calendar, Camera, Check, ChevronRight, Image as ImageIcon, MapPin, Plus, Search, VenetianMask, Weight, X } from "lucide-react";
import { Sheet } from "@/components/health/HealthUI";
import { ErrorText, PrimaryButton, ScreenFrame } from "@/components/onboarding/OnboardingUI";
import { apiService } from "@/services/apiService";
import { usePet } from "@/context/PetContext";
import { useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { completeOnboarding } from "@/hooks/useOnboardingStatus";
import { breedsFor, UNKNOWN_BREED } from "@/constants/breeds";
import { areaName } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { genitive } from "@/lib/turkish";
import type { Pet } from "@/services/types";
import { geolocation, haptics, push } from "@/native";

// İlk kurulum, ekranlar 4–9 (design-reference/onboarding-final). Hayvan 8. ekranda [Tamamla]'ya basınca TEK seferde
// kaydedilir; kayıt başarısız olursa girilenler kaybolmaz (taslak oturum belleğinde) ve tekrar denenir.

type Kind = "dog" | "cat" | "bird" | "rabbit" | "small_mammal" | "other";
type Step = 4 | 5 | 6 | 7 | 8 | 9;

interface Draft {
    kind: Kind | null;
    name: string;
    breed: string;
    gender: "" | "Erkek" | "Dişi";
    birthDate: string;
    approxMonths: number | null;
    weight: string;
    neutered: "" | "Evet" | "Hayır" | "Bilmiyorum";
    features: string[];
    notes: string;
    wantLocation: boolean;
    wantNotifications: boolean;
}

const EMPTY: Draft = { kind: null, name: "", breed: "", gender: "", birthDate: "", approxMonths: null, weight: "", neutered: "", features: [], notes: "", wantLocation: true, wantNotifications: true };
const DRAFT_KEY = "moffi_onboarding_draft";

const OTHER_KINDS: { key: Kind; label: string; emoji: string }[] = [
    { key: "bird", label: "Kuş", emoji: "🦜" },
    { key: "rabbit", label: "Tavşan", emoji: "🐰" },
    { key: "small_mammal", label: "Küçük memeli", emoji: "🐹" },
    { key: "other", label: "Diğer", emoji: "🐾" },
];

const APPROX_AGES: { label: string; months: number }[] = [
    { label: "1–3 aylık", months: 2 }, { label: "4–6 aylık", months: 5 }, { label: "7–11 aylık", months: 9 },
    ...Array.from({ length: 14 }, (_, i) => ({ label: `${i + 1} yaş`, months: (i + 1) * 12 })),
    { label: "15 yaş ve üstü", months: 15 * 12 },
];

const FEATURE_CHIPS = ["Sarı renk", "Siyah renk", "Beyaz renk", "Kahverengi renk", "Gri renk", "Çok renkli", "Uzun tüy", "Kısa tüy", "Dost canlısı", "Çekingen", "Enerjik", "Sakin"];
const MAX_PHOTOS = 8;

const todayKey = () => new Date().toLocaleDateString("sv-SE");
const monthsToBirthDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toLocaleDateString("sv-SE");
};
const kindLabel = (k: Kind | null) => (k === "dog" ? "Köpek" : k === "cat" ? "Kedi" : OTHER_KINDS.find(o => o.key === k)?.label ?? "");

function PickerRow({ icon: Icon, label, value, placeholder, onClick, children }: {
    icon: React.ComponentType<{ className?: string }>; label: string; value?: string; placeholder: string; onClick?: () => void; children?: React.ReactNode;
}) {
    const inner = (
        <>
            <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
            <span className="flex-1 min-w-0 text-left">
                <span className="block text-xs font-semibold text-secondary">{label}</span>
                <span className={cn("block text-[15px] font-semibold truncate", value ? "text-foreground" : "text-secondary/70")}>{value || placeholder}</span>
            </span>
            {children ?? <ChevronRight className="w-5 h-5 text-secondary shrink-0" />}
        </>
    );
    return onClick
        ? <button type="button" onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-card-border active:scale-[0.99] transition">{inner}</button>
        : <div className="relative w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-card-border">{inner}</div>;
}

function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T | ""; onChange: (v: T) => void }) {
    return (
        <div className="flex gap-2">
            {options.map(o => (
                <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
                    className={cn("flex-1 h-11 rounded-xl text-sm font-bold border transition", value === o ? "bg-accent text-white border-accent" : "bg-card border-card-border text-foreground")}>
                    {o}
                </button>
            ))}
        </div>
    );
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
            className={cn("w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 disabled:opacity-40", on ? "bg-emerald-500" : "bg-card-border")}>
            <span className={cn("block w-6 h-6 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0")} />
        </button>
    );
}

export function PetSetup() {
    const router = useRouter();
    const { user } = useAuth();
    const { addPet } = usePet();
    const { subscribe: subscribePush } = usePushNotifications(user?.id);

    const [step, setStep] = useState<Step>(4);
    const [draft, setDraft] = useState<Draft>(EMPTY);
    const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
    const [sheet, setSheet] = useState<null | "other" | "breed" | "gender" | "age">(null);
    const [breedQuery, setBreedQuery] = useState("");
    const [featureInput, setFeatureInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState<{ name: string; image: string | null } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Taslak oturum belleğinde (fotoğraflar hariç); sayfa yenilenirse yazılanlar kalır
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            if (raw) { const parsed = JSON.parse(raw) as { draft: Draft; step: Step }; setDraft({ ...EMPTY, ...parsed.draft }); if (parsed.step >= 4 && parsed.step <= 8) setStep(parsed.step); }
        } catch { /* taslak okunamadı, boş başla */ }
    }, []);
    useEffect(() => {
        if (step === 9) return;
        try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step })); } catch { /* depolama kapalı olabilir */ }
    }, [draft, step]);

    const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(d => ({ ...d, [k]: v }));
    const breeds = useMemo(() => breedsFor(draft.kind), [draft.kind]);
    const filteredBreeds = useMemo(() => {
        const q = breedQuery.trim().toLocaleLowerCase("tr-TR");
        return q ? breeds.filter(b => b.toLocaleLowerCase("tr-TR").includes(q)) : breeds;
    }, [breeds, breedQuery]);
    const ageLabel = draft.approxMonths != null ? APPROX_AGES.find(a => a.months === draft.approxMonths)?.label : undefined;
    const petName = draft.name.trim();

    const back = () => { setError(""); setStep(s => (s > 4 ? ((s - 1) as Step) : s)); if (step === 4) router.replace("/"); };

    const skipAll = async () => {
        await completeOnboarding();
        try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* yoksay */ }
        router.replace("/home");
    };

    const addFiles = (files: FileList | null) => {
        if (!files) return;
        const room = MAX_PHOTOS - photos.length;
        const next = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, room).map(file => ({ file, url: URL.createObjectURL(file) }));
        if (next.length) setPhotos(p => [...p, ...next]);
    };
    const removePhoto = (i: number) => setPhotos(p => p.filter((_, idx) => idx !== i));
    const makeCover = (i: number) => setPhotos(p => (i === 0 ? p : [p[i], ...p.filter((_, idx) => idx !== i)]));

    const toggleFeature = (f: string) => setDraft(d => ({ ...d, features: d.features.includes(f) ? d.features.filter(x => x !== f) : d.features.length < 8 ? [...d.features, f] : d.features }));
    const addCustomFeature = () => {
        const f = featureInput.trim().slice(0, 30);
        if (f && !draft.features.includes(f) && draft.features.length < 8) set("features", [...draft.features, f]);
        setFeatureInput("");
    };

    // ── Kaydet (8. ekranda [Tamamla]) ────────────────────────────────────────────
    const finish = async () => {
        if (saving || !draft.kind || !petName) return;
        setSaving(true);
        setError("");
        try {
            // İzinler önce, dokunuşla aynı çağrı yığınında (iOS/Android izin pencereleri)
            let area: { province: string; district: string } | null = null;
            if (draft.wantLocation && geolocation.isSupported()) {
                const fix = await geolocation.getCurrentOrNull({ timeoutMs: 8000, maxAgeMs: 5 * 60 * 1000 });
                const text = fix ? await areaName(fix.lat, fix.lng) : null;
                if (text) {
                    const parts = text.split(",").map(s => s.trim()).filter(Boolean);
                    if (parts.length) area = { district: parts[0], province: parts[parts.length - 1] };
                }
            }
            if (draft.wantNotifications && push.isSupported()) { try { await subscribePush(); } catch { /* izin verilmediyse devam */ } }

            const urls = await Promise.all(photos.map(p => apiService.uploadMedia(p.file, "avatars").catch(() => "")));
            const uploaded = urls.filter(Boolean);
            const birthDate = draft.birthDate || (draft.approxMonths != null ? monthsToBirthDate(draft.approxMonths) : "");
            const weightNum = parseFloat(draft.weight.replace(",", "."));

            const payload: Partial<Pet> & { name: string } = {
                name: petName,
                type: draft.kind,
                breed: draft.breed && draft.breed !== UNKNOWN_BREED ? draft.breed : "",
                gender: draft.gender,
                birthday: birthDate,
                birth_date_estimated: !draft.birthDate && draft.approxMonths != null,
                neutered: draft.neutered === "Evet",
                weight: Number.isFinite(weightNum) && weightNum > 0 ? `${weightNum} kg` : "",
                character: draft.notes.trim(),
                features: draft.features,
                image: uploaded[0] || "",
                gallery_urls: uploaded,
                sos_settings: { auto_post_sos: true, sos_radius: "5km", secure_proxy_only: false, location_precision: "exact", emergency_sms_number: "", reward_amount: 0, reward_currency: "TL", finder_message: "", reward_enabled: false, header_sos_alert_enabled: true },
            };
            const savedPet = await apiService.addPet(payload);
            addPet({ id: savedPet.id });

            if (area && user?.id) {
                try {
                    localStorage.setItem("moffi_user_province", area.province);
                    localStorage.setItem("moffi_user_district", area.district);
                    await supabase.from("profiles").update({ province: area.province, district: area.district }).eq("id", user.id);
                } catch { /* il/ilçe kaydı kritik değil */ }
            }
            await completeOnboarding();
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* yoksay */ }
            setSaved({ name: petName, image: uploaded[0] || photos[0]?.url || null });
            setStep(9);
            haptics.celebrate();
        } catch (e) {
            console.error("Onboarding pet kaydı başarısız:", e);
            setError("Kaydedilemedi. Bağlantını kontrol edip tekrar dene; bilgilerin kaybolmadı.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (step !== 9) return;
        confetti({ particleCount: 90, spread: 70, startVelocity: 35, origin: { y: 0.35 }, colors: ["#EE5B3D", "#8FD14F", "#FBBF24", "#60A5FA"] });
    }, [step]);

    const fade = { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.2 } };

    // ── 4. Kim bu? ────────────────────────────────────────────────────────────────
    if (step === 4) {
        const isOther = draft.kind && draft.kind !== "dog" && draft.kind !== "cat";
        const card = (key: "dog" | "cat", emoji: string, label: string) => (
            <button type="button" onClick={() => { set("kind", key); set("breed", ""); }} aria-pressed={draft.kind === key}
                className={cn("relative rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 aspect-[4/5] bg-card transition active:scale-[0.98]", draft.kind === key ? "border-accent shadow-[0_10px_24px_-12px_rgba(238,91,61,0.6)]" : "border-card-border")}>
                <span className="text-[64px] leading-none" aria-hidden>{emoji}</span>
                <span className="font-bold text-[15px]">{label}</span>
                {draft.kind === key && <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Check className="w-4 h-4" strokeWidth={3} /></span>}
            </button>
        );
        return (
            <ScreenFrame title="Kim bu?" stage={3} onBack={back} footer={<PrimaryButton disabled={!draft.kind} onClick={() => setStep(5)}>Devam Et</PrimaryButton>}>
                <motion.div {...fade} className="space-y-5">
                    <div>
                        <h2 className="text-2xl font-black leading-tight">İlk patili dostunu ekle</h2>
                        <p className="text-sm text-secondary mt-1.5 leading-relaxed">Moffi deneyimini kişiselleştirmek için önce seni en iyi tanıyanı ekleyelim.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {card("dog", "🐶", "Köpek")}
                        {card("cat", "🐱", "Kedi")}
                        <button type="button" onClick={() => setSheet("other")} aria-pressed={!!isOther}
                            className={cn("relative rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 bg-card transition active:scale-[0.98]", isOther ? "border-accent" : "border-card-border")}>
                            <span className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl" aria-hidden>{isOther ? OTHER_KINDS.find(o => o.key === draft.kind)?.emoji : "🐾"}</span>
                            <span className="font-bold text-[15px]">{isOther ? kindLabel(draft.kind) : "Diğer"}</span>
                            {isOther && <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Check className="w-4 h-4" strokeWidth={3} /></span>}
                        </button>
                        <button type="button" onClick={skipAll}
                            className="rounded-3xl border-2 border-dashed border-card-border p-4 flex flex-col items-center justify-center gap-2 text-secondary active:scale-[0.98] transition">
                            <span className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center"><X className="w-6 h-6" /></span>
                            <span className="font-bold text-[15px]">Şimdilik atla</span>
                        </button>
                    </div>
                    {isOther && <p className="text-xs text-secondary bg-card border border-card-border rounded-xl px-3 py-2.5">Aşı takvimi şimdilik kedi ve köpekler için hazır. {kindLabel(draft.kind)} için kaydını tutabilir, sağlık notlarını ekleyebilirsin.</p>}
                </motion.div>
                <Sheet open={sheet === "other"} onClose={() => setSheet(null)} title="Hangi tür?">
                    <div className="grid grid-cols-2 gap-3">
                        {OTHER_KINDS.map(o => (
                            <button key={o.key} type="button" onClick={() => { set("kind", o.key); set("breed", ""); setSheet(null); }}
                                className="rounded-2xl bg-card border border-card-border p-4 flex flex-col items-center gap-1 active:scale-[0.98]">
                                <span className="text-4xl">{o.emoji}</span><span className="font-bold text-sm">{o.label}</span>
                            </button>
                        ))}
                    </div>
                </Sheet>
            </ScreenFrame>
        );
    }

    // ── 5. Adı ve fotoğrafı ───────────────────────────────────────────────────────
    if (step === 5) {
        return (
            <ScreenFrame title="Adı ve fotoğrafı" stage={3} onBack={back} footer={<PrimaryButton disabled={petName.length < 1} onClick={() => setStep(6)}>Devam Et</PrimaryButton>}>
                <motion.div {...fade} className="space-y-6">
                    <div className="flex justify-center">
                        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Fotoğraf ekle" className="relative w-44 h-44 rounded-[2rem] overflow-hidden bg-card border-2 border-dashed border-card-border flex items-center justify-center">
                            {photos[0] ? <img src={photos[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-7xl" aria-hidden>{draft.kind === "cat" ? "🐱" : draft.kind === "dog" ? "🐶" : "🐾"}</span>}
                            <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"><Camera className="w-5 h-5" /></span>
                        </button>
                    </div>
                    <div>
                        <label htmlFor="pet-name" className="text-sm font-bold">Pet&apos;in adı</label>
                        <input id="pet-name" value={draft.name} onChange={e => set("name", e.target.value.slice(0, 30))} placeholder="Örn: Luna" autoComplete="off" maxLength={30}
                            className="mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-card-border text-[16px] font-semibold outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between"><span className="text-sm font-bold">Fotoğraf ekle</span><span className="text-xs text-secondary">En fazla {MAX_PHOTOS} · isteğe bağlı</span></div>
                        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1">
                            {photos.map((p, i) => (
                                <div key={p.url} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-card-border">
                                    <button type="button" onClick={() => makeCover(i)} aria-label={i === 0 ? "Kapak fotoğrafı" : "Kapak yap"} className="w-full h-full"><img src={p.url} alt="" className="w-full h-full object-cover" /></button>
                                    {i === 0 && <span className="absolute bottom-0 inset-x-0 text-[10px] font-bold text-white bg-accent/90 text-center py-0.5">Kapak</span>}
                                    <button type="button" onClick={() => removePhoto(i)} aria-label="Fotoğrafı kaldır" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            {photos.length < MAX_PHOTOS && (
                                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Fotoğraf ekle" className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-card-border flex items-center justify-center text-secondary"><Plus className="w-6 h-6" /></button>
                            )}
                        </div>
                        <p className="text-xs text-secondary mt-2">İlk fotoğraf profil fotoğrafı olur; değiştirmek için başka bir fotoğrafa dokun.</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
                </motion.div>
            </ScreenFrame>
        );
    }

    // ── 6. Temel bilgiler ─────────────────────────────────────────────────────────
    if (step === 6) {
        return (
            <ScreenFrame title="Temel Bilgiler" stage={3} onBack={back} footer={<PrimaryButton onClick={() => setStep(7)}>Devam Et</PrimaryButton>}>
                <motion.div {...fade} className="space-y-3">
                    <p className="text-sm text-secondary leading-relaxed mb-1">{petName} hakkında bildiklerini yaz; bilmediklerini boş bırakabilirsin.</p>
                    <PickerRow icon={VenetianMask} label="Irk" value={draft.breed} placeholder="Seç" onClick={() => { setBreedQuery(""); setSheet("breed"); }} />
                    <PickerRow icon={VenetianMask} label="Cinsiyet" value={draft.gender ? `${draft.gender} (${draft.gender === "Dişi" ? "♀" : "♂"})` : ""} placeholder="Seç" onClick={() => setSheet("gender")} />
                    <PickerRow icon={Calendar} label="Doğum tarihi" value={draft.birthDate ? new Date(draft.birthDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : ""} placeholder="Seç">
                        <input type="date" value={draft.birthDate} max={todayKey()} aria-label="Doğum tarihi"
                            onChange={e => setDraft(d => ({ ...d, birthDate: e.target.value, approxMonths: e.target.value ? null : d.approxMonths }))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <Calendar className="w-5 h-5 text-secondary shrink-0" />
                    </PickerRow>
                    <PickerRow icon={Calendar} label="Yaklaşık yaş" value={ageLabel} placeholder="Doğum tarihini bilmiyorsan seç" onClick={() => setSheet("age")} />
                    <p className="text-xs text-secondary pt-1 leading-relaxed">Doğum tarihi aşı takvimini doğru hesaplamamızı sağlar. Tam tarihi bilmiyorsan yaklaşık yaş yeterli.</p>
                </motion.div>

                <Sheet open={sheet === "breed"} onClose={() => setSheet(null)} title="Irk seç">
                    <div className="relative">
                        <Search className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                        <input value={breedQuery} onChange={e => setBreedQuery(e.target.value)} placeholder="Irk ara ya da yaz" className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
                    </div>
                    <div className="space-y-1.5 pb-2">
                        {breedQuery.trim() && !breeds.some(b => b.toLocaleLowerCase("tr-TR") === breedQuery.trim().toLocaleLowerCase("tr-TR")) && (
                            <button type="button" onClick={() => { set("breed", breedQuery.trim().slice(0, 40)); setSheet(null); }} className="w-full text-left px-4 h-12 rounded-xl bg-accent/10 text-accent font-bold text-sm">“{breedQuery.trim()}” olarak ekle</button>
                        )}
                        {filteredBreeds.map(b => (
                            <button key={b} type="button" onClick={() => { set("breed", b); setSheet(null); }} className={cn("w-full text-left px-4 h-12 rounded-xl text-sm font-semibold flex items-center justify-between", draft.breed === b ? "bg-accent/10 text-accent" : "bg-card border border-card-border")}>
                                {b}{draft.breed === b && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </Sheet>
                <Sheet open={sheet === "gender"} onClose={() => setSheet(null)} title="Cinsiyet">
                    <div className="grid grid-cols-2 gap-3">
                        {(["Erkek", "Dişi"] as const).map(g => (
                            <button key={g} type="button" onClick={() => { set("gender", g); setSheet(null); }} className={cn("h-16 rounded-2xl font-bold border-2 text-lg", draft.gender === g ? "border-accent bg-accent/10 text-accent" : "border-card-border bg-card")}>{g === "Dişi" ? "♀" : "♂"} {g}</button>
                        ))}
                    </div>
                    {draft.gender && <button type="button" onClick={() => { set("gender", ""); setSheet(null); }} className="w-full text-sm font-semibold text-secondary py-2">Temizle</button>}
                </Sheet>
                <Sheet open={sheet === "age"} onClose={() => setSheet(null)} title="Yaklaşık yaş">
                    <div className="grid grid-cols-2 gap-2 pb-2">
                        {APPROX_AGES.map(a => (
                            <button key={a.months} type="button" onClick={() => { setDraft(d => ({ ...d, approxMonths: a.months, birthDate: "" })); setSheet(null); }}
                                className={cn("h-12 rounded-xl text-sm font-semibold border", draft.approxMonths === a.months ? "bg-accent/10 text-accent border-accent" : "bg-card border-card-border")}>{a.label}</button>
                        ))}
                    </div>
                </Sheet>
            </ScreenFrame>
        );
    }

    // ── 7. Ek bilgiler ────────────────────────────────────────────────────────────
    if (step === 7) {
        const customFeatures = draft.features.filter(f => !FEATURE_CHIPS.includes(f));
        return (
            <ScreenFrame title="Ek Bilgiler" stage={3} onBack={back} footer={<PrimaryButton onClick={() => setStep(8)}>Devam Et</PrimaryButton>}>
                <motion.div {...fade} className="space-y-6">
                    <div>
                        <label htmlFor="pet-weight" className="text-sm font-bold">Yaklaşık kilo <span className="font-normal text-secondary">(isteğe bağlı)</span></label>
                        <div className="relative mt-2">
                            <Weight className="w-5 h-5 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                            <input id="pet-weight" value={draft.weight} onChange={e => set("weight", e.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))} inputMode="decimal" placeholder="Örn: 24,5"
                                className="w-full h-14 pl-12 pr-14 rounded-2xl bg-card border border-card-border text-[15px] font-semibold outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary">kg</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm font-bold">Kısırlaştırılmış mı?</span>
                        <div className="mt-2"><Segmented options={["Evet", "Hayır", "Bilmiyorum"] as const} value={draft.neutered} onChange={v => set("neutered", v)} /></div>
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between"><span className="text-sm font-bold">Belirgin özellikler</span><span className="text-xs text-secondary">İsteğe bağlı</span></div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {[...FEATURE_CHIPS, ...customFeatures].map(f => (
                                <button key={f} type="button" onClick={() => toggleFeature(f)} aria-pressed={draft.features.includes(f)}
                                    className={cn("h-9 px-3.5 rounded-full text-[13px] font-semibold border transition", draft.features.includes(f) ? "bg-accent text-white border-accent" : "bg-card border-card-border")}>{f}</button>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomFeature(); } }} placeholder="Başka özellik ekle (örn: sol kulakta küçük leke)" maxLength={30}
                                className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-card border border-card-border text-sm outline-none focus:border-accent" />
                            <button type="button" onClick={addCustomFeature} disabled={!featureInput.trim()} aria-label="Özellik ekle" className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40"><Plus className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between"><label htmlFor="pet-notes" className="text-sm font-bold">Kısa notlar</label><span className="text-xs text-secondary">İsteğe bağlı</span></div>
                        <div className="relative mt-2">
                            <textarea id="pet-notes" value={draft.notes} onChange={e => set("notes", e.target.value.slice(0, 200))} rows={3} placeholder="Çok sevecen, çocuklarla arası iyi. Yabancılara mesafeli olabilir."
                                className="w-full p-4 pb-7 rounded-2xl bg-card border border-card-border text-sm leading-relaxed outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 resize-none" />
                            <span className="absolute bottom-2.5 right-4 text-[11px] text-secondary">{draft.notes.length}/200</span>
                        </div>
                    </div>
                </motion.div>
            </ScreenFrame>
        );
    }

    // ── 8. İzinler ────────────────────────────────────────────────────────────────
    if (step === 8) {
        const pushOk = push.isSupported();
        const row = (icon: React.ReactNode, title: string, desc: string, control: React.ReactNode) => (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-card-border">
                <span className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">{icon}</span>
                <span className="flex-1 min-w-0"><span className="block font-bold text-[15px]">{title}</span><span className="block text-xs text-secondary mt-0.5 leading-snug">{desc}</span></span>
                {control}
            </div>
        );
        return (
            <ScreenFrame title="İzinler" stage={3} onBack={back}
                footer={<div className="space-y-3"><ErrorText>{error}</ErrorText><PrimaryButton loading={saving} onClick={finish}>{error ? "Tekrar Dene" : "Tamamla"}</PrimaryButton></div>}>
                <motion.div {...fade} className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-black leading-tight">Daha iyi bir deneyim için</h2>
                        <p className="text-sm text-secondary mt-1.5 leading-relaxed">Bazı izinler, Moffi&apos;yi sen ve patili dostun için daha faydalı hale getirir. İstediğin zaman ayarlardan değiştirebilirsin.</p>
                    </div>
                    {row(<MapPin className="w-5 h-5" />, "Konum izni", "Yakındaki veterinerleri bulmak ve yürüyüşünü kaydetmek için. Sadece şehir ve ilçe düzeyinde kaydedilir.", <Toggle on={draft.wantLocation} onChange={v => set("wantLocation", v)} />)}
                    {row(<Bell className="w-5 h-5" />, "Bildirim izni", pushOk ? "Aşı ve randevu hatırlatmaları, kayıp ilanları ve sana özel bildirimler için." : "Telefon bildirimleri çok yakında; şimdilik hatırlatmalar e-postayla gelir.", <Toggle on={pushOk && draft.wantNotifications} disabled={!pushOk} onChange={v => set("wantNotifications", v)} />)}
                    {row(<ImageIcon className="w-5 h-5" />, "Kamera ve galeri", "Fotoğraf eklerken telefonun sana ayrıca sorar; şimdi bir şey yapman gerekmez.", <Check className="w-5 h-5 text-emerald-600 shrink-0" />)}
                </motion.div>
            </ScreenFrame>
        );
    }

    // ── 9. Tamamlandı ─────────────────────────────────────────────────────────────
    return (
        <ScreenFrame footer={<PrimaryButton onClick={() => router.replace("/home")}>Moffi&apos;yi Keşfet</PrimaryButton>}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center gap-5">
                <span className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Check className="w-11 h-11" strokeWidth={3} /></span>
                <div>
                    <h1 className="text-3xl font-black">Her şey hazır!</h1>
                    <p className="text-[15px] text-secondary mt-2">{saved?.name} artık Moffi&apos;de seninle.</p>
                </div>
                <div className="relative w-52 h-52 rounded-full overflow-hidden bg-card border-4 border-white shadow-xl flex items-center justify-center">
                    {saved?.image ? <img src={saved.image} alt="" className="w-full h-full object-cover" /> : <span className="text-8xl" aria-hidden>{draft.kind === "cat" ? "🐱" : draft.kind === "dog" ? "🐶" : "🐾"}</span>}
                </div>
                <div className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-card-border text-left">
                    <span className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-5 h-5" /></span>
                    <span><span className="block font-bold text-[15px]">Pet Pasaportu oluşturuldu</span><span className="block text-xs text-secondary mt-0.5">{saved?.name ? genitive(saved.name) : 'Dostunun'} pasaportu hazır. Dilediğin zaman detaylarını güncelleyebilirsin.</span></span>
                </div>
            </motion.div>
        </ScreenFrame>
    );
}
