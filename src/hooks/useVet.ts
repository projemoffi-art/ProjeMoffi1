import { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { VetClinic, VetAppointment } from "@/types/domain";
import { supabase } from "@/lib/supabase";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function useVet() {
    const [featuredClinics, setFeaturedClinics] = useState<any[]>([]);
    const [allLocations, setAllLocations] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<'all' | 'clinic' | 'food' | 'toy' | 'care'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [userProvince, setUserProvince] = useState<string>('');
    const [userDistrict, setUserDistrict] = useState<string>('');

    const [gpsDenied, setGpsDenied] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            let initialLat: number | null = null;
            let initialLng: number | null = null;
            
            if (typeof window !== 'undefined') {
                if ("geolocation" in navigator) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                        });
                        initialLat = position.coords.latitude;
                        initialLng = position.coords.longitude;
                        setUserLocation([initialLat, initialLng]);
                    } catch (e) {
                        console.warn("GPS denied or failed");
                        setGpsDenied(true);
                    }
                }
                
                const savedProv = localStorage.getItem('moffi_user_province') || '';
                const savedDist = localStorage.getItem('moffi_user_district') || '';
                setUserProvince(savedProv);
                setUserDistrict(savedDist);
                init('all', savedProv, savedDist, initialLat, initialLng);
            } else {
                init('all');
            }
        };
        
        loadInitialData();
    }, []);

    const init = async (
        category: any = 'all', 
        overrideProv?: string, 
        overrideDist?: string,
        overrideLat?: number | null,
        overrideLng?: number | null
    ) => {
        setIsLoading(true);
        setActiveCategory(category);
        
        const prov = overrideProv !== undefined ? overrideProv : userProvince;
        const dist = overrideDist !== undefined ? overrideDist : userDistrict;
        
        const lat = overrideLat !== undefined ? overrideLat : (userLocation ? userLocation[0] : null);
        const lng = overrideLng !== undefined ? overrideLng : (userLocation ? userLocation[1] : null);

        try {
            // ALWAYS filter by province/district if provided. If not provided, the user hasn't selected a location.
            // In that case, we should return an empty array if they haven't selected a province, unless we want to load all.
            // The user requested: "Eğer boşsa liste boş gösterilip uyarı çıkarılacak."
            if (!prov || !dist) {
                setAllLocations([]);
                setFeaturedClinics([]);
                setIsLoading(false);
                return;
            }

            const rawClinics = await apiService.getNearbyClinics(prov, dist, lat, lng);

            const enrich = (list: any[]) => list.map(c => {
                if (!c.location || lat === null || lng === null) return { ...c, _distVal: 999999, distance: c.distance || 'Konum Belirtilmemiş' };
                const distVal = calculateDistance(lat, lng, c.location.lat, c.location.lng);
                return {
                    ...c,
                    distance: distVal.toFixed(1) + " km",
                    _distVal: distVal
                };
            }).sort((a, b) => a._distVal - b._distVal);

            const allCombined = enrich(rawClinics);
            
            let filtered = allCombined;
            if (category !== 'all') {
                filtered = allCombined.filter(loc => {
                    if (category === 'clinic') return !loc.id.startsWith('sh-');
                    return loc.type === category;
                });
            }

            setFeaturedClinics(filtered.filter(c => c.is_premium || c.rating >= 4.8));
            setAllLocations(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const setLocationFilter = (prov: string, dist: string) => {
        setUserProvince(prov);
        setUserDistrict(dist);
        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_user_province', prov);
            localStorage.setItem('moffi_user_district', dist);
        }
        init(activeCategory, prov, dist);
    };

    const bookAppointment = async (
        clinic: any, 
        date: string, 
        time: string, 
        type: string, 
        sharedPassport?: any, 
        petInfo?: { id: string; name: string; image: string },
        duration_minutes: number = 30
    ) => {
        if (!petInfo?.id) throw new Error("Randevu için bir evcil hayvan seçilmeli");
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Randevu almak için giriş yapmalısınız");
            const appointmentPayload = {
                clinicId: clinic.id,
                clinicName: clinic.name,
                petId: petInfo.id,
                userId: user?.id,
                appointmentDate: `${date}T${time}:00`,
                notes: `Randevu tipi: ${type === 'general' ? 'Genel Muayene' : type}`,
                status: 'pending',
                sharedPassport: sharedPassport,
                paymentId: null,
                paymentAmount: null,
                paymentStatus: null,
                duration_minutes: duration_minutes
            };

            await apiService.createAppointment(appointmentPayload);

            if (typeof window !== 'undefined') {
                try {

                    // Broadcast event for B2B Panel
                    const channel = new BroadcastChannel('moffi_appointments_channel');
                    channel.postMessage({ type: 'APPOINTMENT_CREATED', clinicId: clinic.id });
                    channel.close();
                } catch (e) {
                    console.error("Failed to store pending appointment for business dashboard:", e);
                }
            }
        } catch (error) {
            console.error("Appointment booking failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        featuredClinics,
        allClinics: allLocations,
        userLocation,
        gpsDenied,
        isLoading,
        activeCategory,
        userProvince,
        userDistrict,
        setLocationFilter,
        bookAppointment,
        searchByService: init,
        refresh: () => init(activeCategory, userProvince, userDistrict)
    };
}
