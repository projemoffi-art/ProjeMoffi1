/**
 * Hava durumu ve yürüyüş önerisi (Open-Meteo, anahtar gerektirmez).
 * Hata hâlinde null döner; uydurma bir hava durumu gösterilmez.
 */

export interface WeatherData {
    temp: number;
    condition: string;
    recommendation: string;
    icon: string;
}

export const getWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data?.current_weather) throw new Error('current_weather yok');

        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;

        let condition = "Açık";
        let recommendation = "Yürüyüş için güzel bir hava.";
        let icon = "Sun";

        // WMO hava kodları
        if (code >= 1 && code <= 3) {
            condition = "Parçalı bulutlu";
            recommendation = "Yürüyüş için uygun bir hava.";
            icon = "CloudSun";
        } else if (code >= 45 && code <= 48) {
            condition = "Sisli";
            recommendation = "Görüş düşük; dostunu tasmadan ayırma.";
            icon = "Cloud";
        } else if (code >= 51 && code <= 67) {
            condition = "Yağmurlu";
            recommendation = "Yağış var; kısa bir tur ve dönüşte patileri kurulamak iyi olur.";
            icon = "CloudRain";
        } else if (code >= 71 && code <= 77) {
            condition = "Karlı";
            recommendation = "Kar var; patiler üşüyebilir, kısa tur yeterli.";
            icon = "Snowflake";
        } else if (code >= 80) {
            condition = "Sağanak";
            recommendation = "Kuvvetli yağış var; biraz beklemek daha iyi.";
            icon = "CloudLightning";
        }

        // Pati güvenliği sıcaklığa göre önce gelir.
        if (temp >= 30) {
            recommendation = "Asfalt çok sıcak olabilir; serin saatleri ve çimenlik yolları seç.";
        } else if (temp >= 25) {
            recommendation = "Sıcak bir gün; yanına su al, gölgeli yolları tercih et.";
        } else if (temp < 0) {
            recommendation = "Hava dondurucu; kısa tur ve dönüşte patileri kontrol et.";
        }

        return { temp, condition, recommendation, icon };
    } catch (error) {
        console.error("Hava durumu alınamadı:", error);
        return null;
    }
};
