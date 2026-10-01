"use client";

import React, { useState, useEffect } from "react";
import { Plus, Megaphone, Trash2, Calendar, Tag, BarChart3, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveBusiness } from "@/context/BusinessTypeContext";
import { apiService } from "@/services/apiService";
import { PET_TYPES, getPetTypeConfig } from "@/constants/petTypes";
import { showToast } from "@/lib/utils";

interface Deal {
    id: string;
    title: string;
    description: string;
    media_url: string;
    value: string;
    coupon_code: string;
    target_pet_type: string;
    expires_at: string;
    current_uses: number;
    max_uses: number | null;
    status: string;
}

export default function BusinessCampaignsPage() {
    const { businessId } = useActiveBusiness();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        media_url: "",
        value: "%15",
        coupon_code: "",
        target_pet_type: "all",
        hours_valid: 24,
        max_uses: ""
    });

    const fetchDeals = async () => {
        if (!businessId) return;
        setIsLoading(true);
        try {
            const data = await apiService.getClinicCampaigns(businessId);
            setDeals(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) return;
        setIsSubmitting(true);
        try {
            const expires_at = new Date();
            expires_at.setHours(expires_at.getHours() + Number(formData.hours_valid));

            await apiService.addClinicCampaign({
                clinic_id: businessId,
                title: formData.title,
                description: formData.description,
                media_url: formData.media_url || null,
                discount_value: formData.value,
                coupon_code: formData.coupon_code,
                target_pet_type: formData.target_pet_type,
                expires_at: expires_at.toISOString(),
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                status: 'active'
            });
            
            setIsCreating(false);
            fetchDeals();
            setFormData({
                title: "", description: "", media_url: "",
                value: "%15", coupon_code: "", target_pet_type: "all", hours_valid: 24, max_uses: ""
            });
        } catch (error) {
            console.error(error);
            showToast("Kampanya oluşturulurken bir hata oluştu.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                        <Megaphone className="w-8 h-8 text-indigo-600" /> Günün Fırsatları
                    </h1>
                    <p className="text-gray-500 font-medium">Aktif hikaye kampanyalarınızı yönetin.</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                    {isCreating ? 'İptal Et' : <><Plus className="w-4 h-4"/> Yeni Fırsat Yarat</>}
                </button>
            </div>

            {isCreating && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-xl mb-8 border border-card-border">
                    <h2 className="text-xl font-bold mb-6">Yeni Günün Fırsatı Oluştur</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kampanya Başlığı</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500" placeholder="Örn: Hafta Sonu Kedi Maması İndirimi" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Görsel (isteğe bağlı)</label>
                                <label className="flex items-center gap-3 w-full bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                                    {formData.media_url
                                        ? <img src={formData.media_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                        : <ImageIcon className="w-5 h-5 text-zinc-400" />}
                                    <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                        {isUploading ? 'Yükleniyor…' : formData.media_url ? 'Görseli değiştir' : 'Görsel seç'}
                                    </span>
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (!file) return;
                                        setIsUploading(true);
                                        try {
                                            const url = await apiService.uploadMedia(file, 'posts');
                                            setFormData(f => ({ ...f, media_url: url }));
                                        } catch (err: any) {
                                            showToast(err?.message || 'Görsel yüklenemedi.', 'AlertCircle', 'text-red-500 font-bold');
                                        } finally {
                                            setIsUploading(false);
                                        }
                                    }} />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">İndirim Oranı/Değeri</label>
                                <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500" placeholder="Örn: %20 veya 50 TL" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kupon Kodu</label>
                                <input required type="text" value={formData.coupon_code} onChange={e => setFormData({...formData, coupon_code: e.target.value})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500" placeholder="Örn: PAZAR20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hedef Kitle</label>
                                <select value={formData.target_pet_type} onChange={e => setFormData({...formData, target_pet_type: e.target.value})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500">
                                    <option value="all">Tüm Evcil Hayvanlar</option>
                                    {PET_TYPES.map(pt => (
                                        <option key={pt.key} value={pt.key}>{pt.emoji} Sadece {pt.label} Sahipleri</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Geçerlilik Süresi (Saat)</label>
                                <input required type="number" value={formData.hours_valid} onChange={e => setFormData({...formData, hours_valid: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500" min="1" max="72" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kullanım Limiti (Boş = Sınırsız)</label>
                                <input type="number" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500" placeholder="Örn: İlk 50 kişi" />
                            </div>
                        </div>
                        <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kampanyayı Başlat 🚀'}
                        </button>
                    </form>
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
            ) : deals.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                    <p className="text-gray-500">Henüz hiç fırsat hikayesi oluşturmamışsınız.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map(deal => (
                        <div key={deal.id} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col">
                            <div className="h-48 relative bg-gray-100 dark:bg-zinc-800">
                                {deal.media_url
                                    ? <img src={deal.media_url} alt="kampanya" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Megaphone className="w-10 h-10 text-zinc-300 dark:text-zinc-600" /></div>}
                                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                    {deal.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg mb-1">{deal.title}</h3>
                                <div className="flex gap-2 text-xs text-indigo-600 font-bold mb-4">
                                    <span className="bg-indigo-50 px-2 py-1 rounded-md">{deal.discount_value || deal.value}</span>
                                    <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 border-dashed">{deal.coupon_code}</span>
                                </div>
                                <div className="mt-auto space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Bitiş: {deal.expires_at || deal.ends_at ? new Date(deal.expires_at || deal.ends_at).toLocaleString('tr-TR') : 'Süresiz'}</div>
                                    <div className="flex items-center gap-2"><Tag className="w-4 h-4"/> Hedef: {deal.target_pet_type === 'all' ? 'Tümü' : getPetTypeConfig(deal.target_pet_type)?.label || deal.target_pet_type}</div>
                                    <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4"/> Kullanım: {deal.current_uses} {deal.max_uses ? `/ ${deal.max_uses}` : ''}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
