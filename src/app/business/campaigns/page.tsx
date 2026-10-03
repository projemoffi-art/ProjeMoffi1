"use client";

// İşletme kampanyaları + ana sayfada tanıtım (CLAUDE.md 8.64).
// Kampanya (clinic_campaigns) işletmenin kendi profilinde hemen görünür. "Ana sayfada öne çıkar" talebi Moffi
// yönetimi onaylayınca kampanya, işletmenin çevresindeki kullanıcılara "Fırsatlar" hikâyesinde "Reklam" etiketiyle
// gösterilir. Veteriner klinikleri ayrıca "Veteriner Önerisi" gönderebilir (onaylı, en fazla 14 gün).

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Megaphone, Clock, Tag, BarChart3, Loader2, Image as ImageIcon, Eye, Hand, Sparkles, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { useActiveBusiness } from "@/context/BusinessTypeContext";
import { apiService } from "@/services/apiService";
import { contentService, type BusinessContentItem, type Species } from "@/services/contentService";
import { PET_TYPES, getPetTypeConfig } from "@/constants/petTypes";
import { cn, showToast } from "@/lib/utils";

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    media_url: string | null;
    discount_value: string | null;
    coupon_code: string | null;
    target_pet_type: string | null;
    expires_at: string | null;
    ends_at: string | null;
    current_uses: number | null;
    max_uses: number | null;
    status: string | null;
}

const ACCENT = "#5B4D9D";
const inputCls = "w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-[#5B4D9D]";
const errText = (e: unknown, fallback: string) => (e as Error)?.message || fallback;

function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    return (
        <label className="flex items-center gap-3 w-full bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 cursor-pointer">
            {value ? <img src={value} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-400" />}
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{uploading ? "Yükleniyor…" : value ? "Görseli değiştir" : "Görsel seç"}</span>
            <input type="file" accept="image/*" hidden onChange={async e => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                try { onChange(await apiService.uploadMedia(file, "stories")); }
                catch (err) { showToast(errText(err, "Görsel yüklenemedi."), "AlertCircle", "text-red-500 font-bold"); }
                finally { setUploading(false); }
            }} />
        </label>
    );
}

function PromotionStatus({ item, onWithdraw }: { item: BusinessContentItem; onWithdraw: () => void }) {
    const expired = item.endsAt && new Date(item.endsAt).getTime() <= Date.now();
    if (item.status === "pending") return (
        <div className="rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 text-xs font-bold flex items-center justify-between gap-2">
            Ana sayfa için onay bekliyor
            <button onClick={onWithdraw} className="underline">Geri çek</button>
        </div>
    );
    if (item.status === "approved" && !expired) return (
        <div className="rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-2 text-xs font-bold space-y-1">
            <div className="flex items-center justify-between gap-2">Ana sayfada yayında<button onClick={onWithdraw} className="underline">Kaldır</button></div>
            <div className="flex gap-3 font-semibold"><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views} görüntülenme</span><span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {item.taps} dokunma</span></div>
        </div>
    );
    if (item.status === "rejected") return (
        <div className="rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-2 text-xs font-bold">Onaylanmadı{item.rejectReason ? `: ${item.rejectReason}` : ""}</div>
    );
    return null;
}

export default function BusinessCampaignsPage() {
    const { businessId, business, canManage } = useActiveBusiness();
    const isVet = business?.business_type === "vet";
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [content, setContent] = useState<BusinessContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [form, setForm] = useState({ title: "", description: "", media_url: "", value: "%15", coupon_code: "", target_pet_type: "all", hours_valid: 24, max_uses: "" });
    const [advice, setAdvice] = useState({ title: "", body: "", media_url: "", species: "all" as Species, days: 14 });

    const load = useCallback(async () => {
        if (!businessId) return;
        setIsLoading(true);
        try {
            const [camps, items] = await Promise.all([
                apiService.getClinicCampaigns(businessId),
                contentService.myItems(businessId).catch(() => [] as BusinessContentItem[]),
            ]);
            setCampaigns(camps as unknown as Campaign[]);
            setContent(items);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);
    useEffect(() => { load(); }, [load]);

    const promotionFor = (campaignId: string) => content.find(c => c.channel === "deal" && c.campaignId === campaignId && c.status !== "archived");
    const vetItems = content.filter(c => c.channel === "vet" && c.status !== "archived");

    const createCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) return;
        setIsSubmitting(true);
        try {
            const expires = new Date(Date.now() + Number(form.hours_valid) * 3_600_000);
            await apiService.addClinicCampaign({
                clinic_id: businessId, title: form.title, description: form.description, media_url: form.media_url || null,
                discount_value: form.value, coupon_code: form.coupon_code, target_pet_type: form.target_pet_type,
                expires_at: expires.toISOString(), max_uses: form.max_uses ? parseInt(form.max_uses) : null, status: "active",
            });
            setIsCreating(false);
            setForm({ title: "", description: "", media_url: "", value: "%15", coupon_code: "", target_pet_type: "all", hours_valid: 24, max_uses: "" });
            showToast("Kampanya profilinde yayında.", "CheckCircle2", "text-emerald-500 font-bold");
            load();
        } catch {
            showToast("Kampanya oluşturulamadı.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsSubmitting(false);
        }
    };

    const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
        setBusyId(id);
        try { await fn(); showToast(ok, "CheckCircle2", "text-emerald-500 font-bold"); load(); }
        catch (err) { showToast(errText(err, "İşlem yapılamadı."), "AlertCircle", "text-red-500 font-bold"); }
        finally { setBusyId(null); }
    };

    const sendAdvice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) return;
        if (!advice.media_url) { showToast("Hikâyede gösterilecek bir görsel ekle.", "AlertCircle", "text-red-500 font-bold"); return; }
        await run("advice", () => contentService.submitVet(businessId, { title: advice.title, body: advice.body, mediaUrl: advice.media_url, species: advice.species, days: advice.days }), "Önerin onaya gönderildi.");
        setAdvice({ title: "", body: "", media_url: "", species: "all", days: 14 });
    };

    const approved = !!business?.approved;

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto space-y-10">
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                            <Megaphone className="w-8 h-8" style={{ color: ACCENT }} /> Kampanyalar
                        </h1>
                        <p className="text-gray-500 font-medium max-w-2xl">Kampanyaların profilinde hemen görünür. İstersen ana sayfadaki &quot;Fırsatlar&quot; hikâyesinde çevrendeki kullanıcılara gösterilmesi için öne çıkarabilirsin (Moffi onayından sonra, &quot;Reklam&quot; etiketiyle).</p>
                    </div>
                    {canManage && (
                        <button onClick={() => setIsCreating(v => !v)} className="text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0" style={{ background: ACCENT }}>
                            {isCreating ? "Vazgeç" : <><Plus className="w-4 h-4" /> Yeni kampanya</>}
                        </button>
                    )}
                </div>
                {!approved && (
                    <p className="mb-6 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-3 text-sm font-bold">İşletmen onaylandıktan sonra ana sayfada tanıtım yapabilirsin.</p>
                )}

                {isCreating && (
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-xl mb-8 border border-card-border">
                        <form onSubmit={createCampaign} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kampanya başlığı</label>
                                    <input required maxLength={90} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Hafta sonu karma aşıda indirim" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Görsel (ana sayfada öne çıkarmak için gerekli)</label>
                                    <ImagePicker value={form.media_url} onChange={url => setForm(f => ({ ...f, media_url: url }))} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Açıklama</label>
                                    <textarea maxLength={600} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={cn(inputCls, "resize-none")} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">İndirim</label>
                                    <input required value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className={inputCls} placeholder="%20 veya 50 TL" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kupon kodu</label>
                                    <input required value={form.coupon_code} onChange={e => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} className={inputCls} placeholder="PAZAR20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hedef kitle</label>
                                    <select value={form.target_pet_type} onChange={e => setForm({ ...form, target_pet_type: e.target.value })} className={inputCls}>
                                        <option value="all">Tüm evcil hayvanlar</option>
                                        {PET_TYPES.map(pt => <option key={pt.key} value={pt.key}>{pt.emoji} Sadece {pt.label} sahipleri</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Geçerlilik (saat)</label>
                                    <input required type="number" min={1} max={720} value={form.hours_valid} onChange={e => setForm({ ...form, hours_valid: Number(e.target.value) })} className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kullanım sınırı (boş = sınırsız)</label>
                                    <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} className={inputCls} placeholder="Örn. ilk 50 kişi" />
                                </div>
                            </div>
                            <button disabled={isSubmitting} type="submit" className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: ACCENT }}>
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kampanyayı başlat"}
                            </button>
                        </form>
                    </motion.div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} /></div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center p-12 bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                        <p className="text-gray-500">Henüz kampanya yok.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map(c => {
                            const end = c.ends_at || c.expires_at;
                            const expired = !!end && new Date(end).getTime() <= Date.now();
                            const promo = promotionFor(c.id);
                            return (
                                <div key={c.id} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col">
                                    <div className="h-44 relative bg-gray-100 dark:bg-zinc-800">
                                        {c.media_url
                                            ? <img src={c.media_url} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center"><Megaphone className="w-10 h-10 text-zinc-300 dark:text-zinc-600" /></div>}
                                        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                            {expired ? "Süresi doldu" : c.status === "active" ? "Profilde aktif" : "Pasif"}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col gap-3">
                                        <div>
                                            <h3 className="font-bold text-lg">{c.title}</h3>
                                            <div className="flex gap-2 text-xs font-bold mt-1">
                                                {c.discount_value && <span className="px-2 py-1 rounded-md bg-[#5B4D9D]/10" style={{ color: ACCENT }}>{c.discount_value}</span>}
                                                {c.coupon_code && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 border-dashed">{c.coupon_code}</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm text-gray-500">
                                            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Bitiş: {end ? new Date(end).toLocaleString("tr-TR") : "Süresiz"}</div>
                                            <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> Hedef: {!c.target_pet_type || c.target_pet_type === "all" ? "Tümü" : getPetTypeConfig(c.target_pet_type)?.label || c.target_pet_type}</div>
                                            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Kullanım: {c.current_uses || 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</div>
                                        </div>
                                        <div className="mt-auto">
                                            {promo ? (
                                                <PromotionStatus item={promo} onWithdraw={() => run(promo.id, () => contentService.withdraw(promo.id), "Ana sayfadan kaldırıldı.")} />
                                            ) : canManage && !expired && approved ? (
                                                <button
                                                    disabled={!c.media_url || busyId === c.id}
                                                    onClick={() => run(c.id, () => contentService.promoteCampaign(c.id), "Öne çıkarma talebin onaya gönderildi.")}
                                                    className="w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border disabled:opacity-50"
                                                    style={{ borderColor: ACCENT, color: ACCENT }}
                                                >
                                                    <Sparkles className="w-4 h-4" /> {c.media_url ? "Ana sayfada öne çıkar" : "Öne çıkarmak için görsel gerekli"}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {isVet && (
                <section className="max-w-3xl">
                    <h2 className="text-xl font-black flex items-center gap-2 mb-1"><Stethoscope className="w-6 h-6" style={{ color: ACCENT }} /> Veteriner Önerisi</h2>
                    <p className="text-gray-500 font-medium mb-5">Kısa bir sağlık önerisi yaz; Moffi onayından sonra çevrendeki evcil hayvan sahiplerine ana sayfada &quot;Veteriner Önerisi&quot; hikâyesinde, kliniğinin adıyla gösterilir. Aynı anda bir öneri yayında olabilir, en fazla 14 gün kalır.</p>

                    {vetItems.length > 0 && (
                        <div className="space-y-2 mb-5">
                            {vetItems.map(v => (
                                <div key={v.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex gap-3">
                                    {v.mediaUrl && <img src={v.mediaUrl} alt="" className="w-14 h-20 rounded-lg object-cover shrink-0" />}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="font-bold">{v.title}</div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{v.body}</p>
                                        <PromotionStatus item={v} onWithdraw={() => run(v.id, () => contentService.withdraw(v.id), "Öneri kaldırıldı.")} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {canManage && approved && !vetItems.some(v => v.status === "pending" || (v.status === "approved" && (!v.endsAt || new Date(v.endsAt).getTime() > Date.now()))) && (
                        <form onSubmit={sendAdvice} className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-card-border space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Başlık</label>
                                <input required minLength={3} maxLength={90} value={advice.title} onChange={e => setAdvice({ ...advice, title: e.target.value })} className={inputCls} placeholder="Kene sezonu başladı" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Öneri ({advice.body.length}/600)</label>
                                <textarea required minLength={20} maxLength={600} rows={3} value={advice.body} onChange={e => setAdvice({ ...advice, body: e.target.value })} className={cn(inputCls, "resize-none")} placeholder="Yürüyüş sonrası kulak arkası ve pati aralarını kontrol edin…" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Görsel</label>
                                    <ImagePicker value={advice.media_url} onChange={url => setAdvice(a => ({ ...a, media_url: url }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kime</label>
                                    <select value={advice.species} onChange={e => setAdvice({ ...advice, species: e.target.value as Species })} className={inputCls}>
                                        <option value="all">Herkes</option>
                                        <option value="dog">Köpek sahipleri</option>
                                        <option value="cat">Kedi sahipleri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Süre (gün)</label>
                                    <input type="number" min={1} max={14} value={advice.days} onChange={e => setAdvice({ ...advice, days: Math.max(1, Math.min(14, Number(e.target.value) || 14)) })} className={inputCls} />
                                </div>
                            </div>
                            <button disabled={busyId === "advice"} type="submit" className="w-full text-white font-bold py-3.5 rounded-xl" style={{ background: ACCENT }}>
                                {busyId === "advice" ? "Gönderiliyor…" : "Onaya gönder"}
                            </button>
                        </form>
                    )}
                </section>
            )}
        </div>
    );
}
