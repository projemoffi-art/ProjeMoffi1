"use client";

import { useState, useEffect, useRef } from "react";
import { Save, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/utils";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import turkeyData from "@/data/turkey_cities.json";

export default function LocationSettings() {
    const { user } = useAuth();
    const [address, setAddress] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [saving, setSaving] = useState(false);

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
            showToast("Lütfen çıkan adres önerilerinden birini seçiniz (İl/İlçe tespiti için gerekli).", "AlertTriangle", "text-amber-500 font-bold");
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
            showToast("Konum başarıyla kaydedildi! 📍", "Save", "text-emerald-500 font-bold");
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

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block">İşletme Adresi (Google Haritalar)</label>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
                    <LocationAutocomplete 
                        address={address} 
                        setAddress={setAddress} 
                        setLat={setLat} 
                        setLng={setLng} 
                        setProvince={setProvince}
                        setDistrict={setDistrict}
                    />
                </APIProvider>
                {(!lat || !lng || !province || !district) && address.length > 0 && (
                    <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">Lütfen çıkan önerilerden bir adres seçin. (Harita pini ve İl/İlçe tespiti için gerekli)</p>
                )}
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

function LocationAutocomplete({ address, setAddress, setLat, setLng, setProvince, setDistrict }: { address: string, setAddress: (a: string) => void, setLat: (lat: number|null) => void, setLng: (lng: number|null) => void, setProvince: (p: string) => void, setDistrict: (d: string) => void }) {
    const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const places = useMapsLibrary('places');

    useEffect(() => {
        if (!places || !inputRef.current) return;
        const options = {
            fields: ['geometry', 'name', 'formatted_address', 'address_components']
        };
        const autocomplete = new places.Autocomplete(inputRef.current, options);
        setPlaceAutocomplete(autocomplete);
    }, [places]);

    useEffect(() => {
        if (!placeAutocomplete) return;
        
        placeAutocomplete.addListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const formattedAddress = place.formatted_address || place.name || "";
                
                let prov = "";
                let dist = "";
                if (place.address_components) {
                    for (const comp of place.address_components) {
                        if (comp.types.includes('administrative_area_level_1')) prov = comp.long_name;
                        if (comp.types.includes('administrative_area_level_2') || comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) dist = comp.long_name;
                    }
                }
                
                // --- Normalization / Fuzzy Match with turkey_cities.json ---
                const normalize = (str: string) => str.toLocaleLowerCase('tr-TR').trim();
                let exactProv = prov;
                let exactDist = dist;
                
                if (prov) {
                    const matchedProvObj = turkeyData.find(p => normalize(p.name) === normalize(prov));
                    if (matchedProvObj) {
                        exactProv = matchedProvObj.name; // Use exact casing from JSON (e.g. "İstanbul")
                        if (dist) {
                            const matchedDistObj = matchedProvObj.districts.find(d => normalize(d.name) === normalize(dist));
                            if (matchedDistObj) {
                                exactDist = matchedDistObj.name; // Use exact casing from JSON (e.g. "Kadıköy")
                            }
                        }
                    }
                }
                
                setLat(lat);
                setLng(lng);
                setProvince(exactProv);
                setDistrict(exactDist);
                setAddress(formattedAddress);
            } else {
                setLat(null);
                setLng(null);
                setProvince("");
                setDistrict("");
                setAddress(place.name || "");
            }
        });
    }, [placeAutocomplete, setAddress, setLat, setLng, setProvince, setDistrict]);

    return (
        <textarea
            ref={inputRef}
            value={address}
            onChange={(e) => {
                setAddress(e.target.value);
                setLat(null);
                setLng(null);
                setProvince("");
                setDistrict("");
            }}
            placeholder="Google Haritalar'dan Adres Arayın (örn: Kadıköy, İstanbul)"
            className="w-full bg-[#F8F9FC] dark:bg-white/5 border border-zinc-200 dark:border-card-border rounded-xl px-4 py-3 text-sm focus:border-[#5B4D9D] outline-none text-foreground dark:text-white min-h-[80px]"
        />
    );
}
