"use client";

import { useState, useEffect } from "react";
import { Save, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/utils";
import turkeyData from "@/data/turkey_cities.json";

export default function LocationSettings() {
    const { user } = useAuth();
    const [address, setAddress] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [addressWarning, setAddressWarning] = useState(false);
    const [saving, setSaving] = useState(false);

    // Get districts for selected province
    const selectedProvinceData = turkeyData.find(p => p.name === province);
    const availableDistricts = selectedProvinceData ? selectedProvinceData.districts : [];

    // Fetch existing location
    useEffect(() => {
        if (!user) return;
        async function fetchProfile() {
            const { data } = await supabase
                .from('profiles')
                .select('address, province, district, business_lat, business_lng')
                .eq('id', user?.id)
                .single();

            if (data) {
                if (data.address) setAddress(data.address);
                if (data.province) setProvince(data.province);
                if (data.district) setDistrict(data.district);
                if (data.business_lat && data.business_lng) {
                    setLat(parseFloat(data.business_lat));
                    setLng(parseFloat(data.business_lng));
                }
            }
        }
        fetchProfile();
    }, [user]);



    const saveLocation = async () => {
        if (!user) return;
        if (!province || !district) {
            showToast("Lütfen İl ve İlçe seçiniz.", "AlertTriangle", "text-amber-500 font-bold");
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    address: address,
                    province: province,
                    district: district,
                    business_lat: lat,
                    business_lng: lng
                })
                .eq('id', user.id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Güncelleme 0 satır etkiledi — muhtemelen RLS engelliyor.');
            }
            showToast("Konum başarıyla kaydedildi! 📍✨", "Save", "text-emerald-500 font-bold");
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Kaydedilirken hata oluştu.", "XCircle", "text-red-500 font-bold");
        }
        setSaving(false);
    };

    return (
        <div className="bg-white dark:bg-[#121212] rounded-[2.5rem] p-8 border border-zinc-200 dark:border-card-border shadow-moffi-card space-y-6">
            <div>
                <h2 className="text-xl font-black text-foreground dark:text-white flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-indigo-500" /> Konum & Adres Ayarları
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Kliniğinizin sistemde doğru il/ilçe altında listelenmesi için bilgilerinizi eksiksiz girin.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">İl <span className="text-red-500">*</span></label>
                    <select
                        value={province}
                        onChange={(e) => {
                            setProvince(e.target.value);
                            setDistrict(""); // Reset district when province changes
                            setAddressWarning(true);
                        }}
                        className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white"
                    >
                        <option value="">İl Seçiniz</option>
                        {turkeyData.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">İlçe <span className="text-red-500">*</span></label>
                    <select
                        value={district}
                        onChange={(e) => {
                            setDistrict(e.target.value);
                            setAddressWarning(true);
                        }}
                        disabled={!province}
                        className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white disabled:opacity-50"
                    >
                        <option value="">İlçe Seçiniz</option>
                        {availableDistricts.map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Açık Adres (Opsiyonel)</label>
                {addressWarning && (
                    <div className="text-amber-500 text-xs font-semibold flex items-center gap-1 mb-2">
                        <span className="text-[10px]">⚠️</span> İl/ilçe değişti, lütfen adresinizin güncel olduğunu kontrol edin.
                    </div>
                )}
                    <textarea 
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value);
                            setAddressWarning(false);
                        }}
                        placeholder="Moda Cd. No:1, Kadıköy..."
                        className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white min-h-[80px]"
                    />
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={saveLocation}
                    disabled={saving}
                    className="bg-gradient-to-r from-[#5B4D9D] to-[#4E3F8F] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-purple-500/10 flex items-center gap-2"
                >
                    {saving ? "Kaydediliyor..." : <><Save className="w-4 h-4" /> Ayarları Kaydet</>}
                </button>
            </div>
        </div>
    );
}
