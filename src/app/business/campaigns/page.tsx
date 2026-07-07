"use client";

import React, { useState, useEffect } from "react";
import { Plus, Megaphone, Trash2, Calendar, Tag, BarChart3, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

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
    const { user } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        media_url: "https://images.unsplash.com/photo-1554818538-98e34543195f?q=80&w=600",
        value: "%15",
        coupon_code: "",
        target_pet_type: "all",
        hours_valid: 24,
        max_uses: ""
    });

    const fetchDeals = async () => {
        try {
            const res = await fetch("/api/business/deals");
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDeals();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const expires_at = new Date();
            expires_at.setHours(expires_at.getHours() + Number(formData.hours_valid));

            const res = await fetch("/api/business/deals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    media_url: formData.media_url,
                    value: formData.value,
                    coupon_code: formData.coupon_code,
                    target_pet_type: formData.target_pet_type,
                    expires_at: expires_at.toISOString(),
                    max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                fetchDeals();
                setFormData({
                    title: "", description: "", media_url: "https://images.unsplash.com/photo-1554818538-98e34543195f?q=80&w=600",
                    value: "%15", coupon_code: "", target_pet_type: "all", hours_valid: 24, max_uses: ""
                });
            } else {
                alert("Hata: " + data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
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
            </header>

            {isCreating && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-xl mb-8 border border-card-border">
                    <h2 className="text-xl font-bold mb-6">Yeni Günün Fırsatı Oluştur</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kampanya Başlığı</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="Örn: Hafta Sonu Kedi Maması İndirimi" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Görsel URL (Story Formatı 9:16)</label>
                                <input required type="url" value={formData.media_url} onChange={e => setFormData({...formData, media_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">İndirim Oranı/Değeri</label>
                                <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="Örn: %20 veya 50 TL" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kupon Kodu</label>
                                <input required type="text" value={formData.coupon_code} onChange={e => setFormData({...formData, coupon_code: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="Örn: PAZAR20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hedef Kitle</label>
                                <select value={formData.target_pet_type} onChange={e => setFormData({...formData, target_pet_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                    <option value="all">Tüm Evcil Hayvanlar</option>
                                    <option value="dog">Sadece Köpek Sahipleri</option>
                                    <option value="cat">Sadece Kedi Sahipleri</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Geçerlilik Süresi (Saat)</label>
                                <input required type="number" value={formData.hours_valid} onChange={e => setFormData({...formData, hours_valid: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" min="1" max="72" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kullanım Limiti (Boş = Sınırsız)</label>
                                <input type="number" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="Örn: İlk 50 kişi" />
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
                <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Henüz hiç fırsat hikayesi oluşturmamışsınız.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map(deal => (
                        <div key={deal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-48 relative bg-gray-100">
                                <img src={deal.media_url} alt="kampanya" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                    {deal.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg mb-1">{deal.title}</h3>
                                <div className="flex gap-2 text-xs text-indigo-600 font-bold mb-4">
                                    <span className="bg-indigo-50 px-2 py-1 rounded-md">{deal.value}</span>
                                    <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 border-dashed">{deal.coupon_code}</span>
                                </div>
                                <div className="mt-auto space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Bitiş: {new Date(deal.expires_at).toLocaleString('tr-TR')}</div>
                                    <div className="flex items-center gap-2"><Tag className="w-4 h-4"/> Hedef: {deal.target_pet_type === 'all' ? 'Tümü' : deal.target_pet_type === 'dog' ? 'Köpek' : 'Kedi'}</div>
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
