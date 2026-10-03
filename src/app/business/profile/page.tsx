"use client";

import React, { useEffect, useRef, useState } from "react";
import { geolocation } from "@/native";
import dynamic from "next/dynamic";
import { Loader2, MapPin, X } from "lucide-react";
import { apiService } from "@/services/apiService";
import type { BusinessProfileData } from "@/services/types";
import { useBusinessType } from "@/context/BusinessTypeContext";
import { showToast } from "@/lib/utils";
import turkeyCities from "@/data/turkey_cities.json";
import { formatTrPhone, normalizeTrPhone } from "@/lib/trIdentity";

type Cities = { name: string; districts: { name: string }[] }[];
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message) || fallback;

const LocationPicker = dynamic(() => import("@/components/business/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />,
});

const MAX_GALLERY = 8;
const input = "w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-foreground outline-none focus:border-[#5B4D9D]";
const card = "bg-white dark:bg-[#121212] rounded-3xl p-5 md:p-6 border border-zinc-200 dark:border-zinc-800 space-y-4";

// İşletme vitrini: müşterinin klinik detay ekranında (tanıtım, iletişim, çalışma saatleri dışı bilgiler,
// kapak, galeri) ve harita görünümünde gördüğü her şey buradan yönetilir.
export default function BusinessProfilePage() {
    const typeConfig = useBusinessType();
    const [form, setForm] = useState<BusinessProfileData | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<'cover' | 'logo' | 'gallery' | null>(null);
    const [locating, setLocating] = useState(false);
    const coverRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        apiService.getBusinessProfile()
            .then(p => setForm(p ? { ...p, phone: p.phone ? formatTrPhone(p.phone) : '' } : { businessName: '', about: '', phone: '', website: '', address: '', province: '', district: '', lat: null, lng: null, logoUrl: null, coverUrl: null, gallery: [] }))
            .catch(() => showToast("Profil yüklenemedi.", "AlertCircle", "text-red-500 font-bold"));
    }, []);

    if (!form) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#5B4D9D]" /></div>;
    }

    const set = <K extends keyof BusinessProfileData>(k: K, v: BusinessProfileData[K]) => setForm(f => f ? { ...f, [k]: v } : f);
    const districts = (turkeyCities as Cities).find(c => c.name === form.province)?.districts || [];

    const upload = async (kind: 'cover' | 'logo' | 'gallery', files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(kind);
        try {
            if (kind === 'gallery') {
                const room = MAX_GALLERY - form.gallery.length;
                const urls: string[] = [];
                for (const f of Array.from(files).slice(0, room)) urls.push(await apiService.uploadMedia(f, 'posts'));
                set('gallery', [...form.gallery, ...urls]);
            } else {
                const url = await apiService.uploadMedia(files[0], kind === 'logo' ? 'avatars' : 'posts');
                set(kind === 'logo' ? 'logoUrl' : 'coverUrl', url);
            }
        } catch (e) {
            showToast(errText(e, "Görsel yüklenemedi."), "AlertCircle", "text-red-500 font-bold");
        } finally {
            setUploading(null);
        }
    };

    const useMyLocation = () => {
        if (!geolocation.isSupported()) { showToast("Cihazın konum desteklemiyor.", "AlertCircle", "text-red-500 font-bold"); return; }
        setLocating(true);
        geolocation.getCurrent({ highAccuracy: true, timeoutMs: 10000 })
            .then(fix => { set('lat', fix.lat); set('lng', fix.lng); })
            .catch(() => showToast("Konum alınamadı; haritaya dokunarak işaretleyebilirsin.", "AlertCircle", "text-amber-500 font-bold"))
            .finally(() => setLocating(false));
    };

    const save = async () => {
        if (!form.businessName.trim()) { showToast("İşletme adı boş bırakılamaz.", "AlertCircle", "text-red-500 font-bold"); return; }
        if (!form.province || !form.district) { showToast("İl ve ilçe seç; müşteriler seni bu bölgede bulur.", "AlertCircle", "text-red-500 font-bold"); return; }
        const phone = form.phone.trim() ? normalizeTrPhone(form.phone) : '';
        if (phone === null) { showToast("Geçerli bir Türkiye telefon numarası yaz (örn. 0532 123 45 67).", "AlertCircle", "text-red-500 font-bold"); return; }
        const site = form.website.trim();
        const website = site && !/^https?:\/\//i.test(site) ? `https://${site}` : site;
        setSaving(true);
        try {
            await apiService.updateBusinessProfile({ ...form, phone, website });
            setForm(f => f ? { ...f, phone: phone ? formatTrPhone(phone) : '', website } : f);
            showToast("Profil kaydedildi.", "CheckCircle2", "text-emerald-500 font-bold");
        } catch (e) {
            showToast(errText(e, "Profil kaydedilemedi."), "AlertCircle", "text-red-500 font-bold");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full max-w-3xl mx-auto space-y-5 pb-32">
            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">İşletme profili</h1>
                <p className="text-sm font-medium text-zinc-500 mt-1">Müşteriler {typeConfig.customerLabel.toLocaleLowerCase('tr-TR')} ararken bu bilgileri görür.</p>
            </div>

            {/* Kapak + logo */}
            <div className={card}>
                <div className="relative">
                    <button onClick={() => coverRef.current?.click()} className="w-full h-40 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                        {form.coverUrl
                            ? <img src={form.coverUrl} alt="Kapak" className="w-full h-full object-cover" />
                            : <span className="text-sm font-bold text-zinc-500">{uploading === 'cover' ? 'Yükleniyor…' : 'Kapak fotoğrafı ekle'}</span>}
                    </button>
                    {form.coverUrl && (
                        <button onClick={() => set('coverUrl', null)} aria-label="Kapağı kaldır" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => logoRef.current?.click()} className="absolute -bottom-6 left-4 w-16 h-16 rounded-2xl overflow-hidden border-4 border-white dark:border-[#121212] bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : (uploading === 'logo' ? '…' : 'Logo')}
                    </button>
                </div>
                <div className="pt-6" />
                <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => { upload('cover', e.target.files); e.target.value = ''; }} />
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => { upload('logo', e.target.files); e.target.value = ''; }} />

                <label className="block">
                    <span className="text-xs font-bold text-zinc-500 mb-1.5 block">İşletme adı</span>
                    <input className={input} value={form.businessName} onChange={e => set('businessName', e.target.value)} maxLength={80} />
                </label>
                <label className="block">
                    <span className="text-xs font-bold text-zinc-500 mb-1.5 block">Hakkında</span>
                    <textarea className={`${input} h-auto min-h-[110px] py-3`} value={form.about} onChange={e => set('about', e.target.value)} maxLength={1000}
                        placeholder="Ekibin, uzmanlık alanların, sunduğun olanaklar…" />
                    <span className="text-[11px] text-zinc-400 font-medium">{form.about.length}/1000</span>
                </label>
            </div>

            {/* İletişim */}
            <div className={card}>
                <h2 className="text-base font-black text-foreground">İletişim</h2>
                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500 mb-1.5 block">Telefon</span>
                        <input className={input} type="tel" inputMode="tel" value={form.phone} maxLength={19} onChange={e => set('phone', e.target.value.replace(/[^0-9+()\s-]/g, ''))} placeholder="0532 000 00 00" />
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-zinc-500 mb-1.5 block">Web sitesi</span>
                        <input className={input} value={form.website} onChange={e => set('website', e.target.value)} placeholder="ornekklinik.com" />
                    </label>
                </div>
            </div>

            {/* Konum */}
            <div className={card}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-black text-foreground">Konum</h2>
                    <button onClick={useMyLocation} disabled={locating} className="h-9 px-3 rounded-xl text-xs font-bold text-[#5B4D9D] dark:text-[#B9AEE8] bg-[#5B4D9D]/10 flex items-center gap-1.5 disabled:opacity-50">
                        <MapPin className="w-3.5 h-3.5" />{locating ? 'Konum alınıyor…' : 'Şu anki konumumu kullan'}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <select aria-label="İl" className={input} value={form.province} onChange={e => { set('province', e.target.value); set('district', ''); }}>
                        <option value="">İl seç</option>
                        {(turkeyCities as Cities).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <select aria-label="İlçe" className={input} value={form.district} disabled={!form.province} onChange={e => set('district', e.target.value)}>
                        <option value="">İlçe seç</option>
                        {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
                <label className="block">
                    <span className="text-xs font-bold text-zinc-500 mb-1.5 block">Açık adres</span>
                    <textarea className={`${input} h-auto min-h-[70px] py-3`} value={form.address} onChange={e => set('address', e.target.value)} />
                </label>
                <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-2">
                        {form.lat != null ? 'İğneyi sürükleyerek konumu düzeltebilirsin.' : 'Haritada işletmenin yerine dokun. İşaretlemezsen müşteri haritasında görünmezsin.'}
                    </p>
                    <LocationPicker lat={form.lat} lng={form.lng} fallbackCenter={[39.0, 35.2]} onChange={(la, ln) => { set('lat', la); set('lng', ln); }} />
                </div>
            </div>

            {/* Galeri */}
            <div className={card}>
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-foreground">Galeri</h2>
                    <span className="text-xs font-bold text-zinc-400">{form.gallery.length}/{MAX_GALLERY}</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5">
                    {form.gallery.map((url, i) => (
                        <div key={url + i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => set('gallery', form.gallery.filter((_, j) => j !== i))} aria-label="Fotoğrafı kaldır" className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                    {form.gallery.length < MAX_GALLERY && (
                        <button onClick={() => galleryRef.current?.click()} className="aspect-square rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-500 flex items-center justify-center">
                            {uploading === 'gallery' ? 'Yükleniyor…' : '+ Fotoğraf'}
                        </button>
                    )}
                </div>
                <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={e => { upload('gallery', e.target.files); e.target.value = ''; }} />
            </div>

            <div className="sticky bottom-24 md:bottom-4 flex justify-end">
                <button onClick={save} disabled={saving || uploading !== null} className="h-12 px-6 rounded-2xl bg-[#5B4D9D] text-white font-black text-sm shadow-lg disabled:opacity-50">
                    {saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
                </button>
            </div>
        </div>
    );
}
