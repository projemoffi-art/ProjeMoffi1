import { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { VetClinic, VetAppointment } from "@/types/domain";

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

    useEffect(() => {
        init();
    }, []);

    const simulateShops = (lat: number, lng: number): any[] => {
        const categories = [
            { id: 'sh-1', name: 'Pati Market', type: 'food', icon: '🍖', rating: 4.9 },
            { id: 'sh-2', name: 'Moffi Toys', type: 'toy', icon: '🎾', rating: 4.7 },
            { id: 'sh-3', name: 'Pet Care Center', type: 'care', icon: '✨', rating: 4.8 },
            { id: 'sh-4', name: 'Gurme Mama', type: 'food', icon: '🍖', rating: 4.6 },
        ];

        return categories.map((shop, i) => {
            const sLat = lat + (Math.random() - 0.5) * 0.02;
            const sLng = lng + (Math.random() - 0.5) * 0.02;
            const dist = calculateDistance(lat, lng, sLat, sLng);
            return {
                ...shop,
                location: { lat: sLat, lng: sLng },
                distance: dist.toFixed(1) + " km",
                _distVal: dist,
                is_premium: i === 0,
                address: 'Yakınlarda bir yerde...',
                features: []
            };
        });
    };

    const init = async (category: any = 'all') => {
        setIsLoading(true);
        setActiveCategory(category);
        try {
            let lat = 40.9850;
            let lng = 29.0300;

            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                    setUserLocation([lat, lng]);
                } catch (e) {
                    console.warn("Location access denied");
                }
            }

            const rawClinics = await apiService.getNearbyClinics(lat, lng);
            const shops = simulateShops(lat, lng);

            const enrich = (list: any[]) => list.map(c => {
                const distVal = calculateDistance(lat, lng, c.location.lat, c.location.lng);
                return {
                    ...c,
                    distance: distVal.toFixed(1) + " km",
                    _distVal: distVal
                };
            }).sort((a, b) => a._distVal - b._distVal);

            const allCombined = [...enrich(rawClinics), ...shops];
            
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

    const bookAppointment = async (clinic: any, date: string, time: string, type: string) => {
        setIsLoading(true);
        try {
            await apiService.createAppointment({
                clinicId: clinic.id,
                petId: '349b89f8-c5e5-46e8-abf7-b2e41b29d39a', // Milo
                appointmentDate: `${date}T${time}:00Z`,
                notes: `Randevu tipi: ${type}`,
                status: 'pending'
            });
        } catch (error) {
            console.error("Appointment booking failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        featuredClinics,
        allClinics: allLocations,
        userLocation,
        isLoading,
        activeCategory,
        bookAppointment,
        searchByService: init,
        refresh: () => init(activeCategory)
    };
}
