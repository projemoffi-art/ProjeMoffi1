/**
 * MOFFI WEATHER & WALK CONSULTANT SERVICE
 * 
 * Fetches real-time weather data using Open-Meteo (No API Key Required)
 * and provides pet-safety walk recommendations.
 */

export interface WeatherData {
    temp: number;
    condition: string;
    recommendation: string;
    icon: string;
}

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();
        
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        
        let condition = "Güneşli";
        let recommendation = "Hava harika, dostun için mükemmel bir yürüyüş zamanı! 🐾";
        let icon = "Sun";

        // Simple mapping of WMO Weather interpretation codes
        if (code >= 1 && code <= 3) {
            condition = "Parçalı Bulutlu";
            recommendation = "Hava biraz bulutlu ama yürüyüş için hala çok uygun! 🌤️";
            icon = "CloudSun";
        } else if (code >= 45 && code <= 48) {
            condition = "Sisli";
            recommendation = "Görüş mesafesi düşük, dostunu tasmadan ayırma! 🌫️";
            icon = "Cloud";
        } else if (code >= 51 && code <= 67) {
            condition = "Yağmurlu";
            recommendation = "Hava yağışlı, dostunun yağmurluğunu almayı unutma! ☔";
            icon = "CloudRain";
        } else if (code >= 71 && code <= 77) {
            condition = "Karlı";
            recommendation = "Kar yağıyor! Patiler üşüyebilir, kısa bir tur yapalım. ❄️";
            icon = "Snowflake";
        } else if (code >= 80) {
            condition = "Sağanak Yağış";
            recommendation = "Kuvvetli yağış var! Dışarı çıkmak için biraz bekleyebiliriz. ⛈️";
            icon = "CloudLightning";
        }

        // Paw Safety Overrides based on Temperature
        if (temp > 30) {
            recommendation = "Zemin çok sıcak olabilir! Patileri korumak için çimenlik alanları seç. 🌡️🐾";
        } else if (temp < 0) {
            recommendation = "Hava dondurucu! Dostunun pati sağlığı için evde oyun oynamaya ne dersin? 🏠🐾";
        }

        return { temp, condition, recommendation, icon };
    } catch (error) {
        console.error("Weather fetch failed:", error);
        return {
            temp: 22,
            condition: "Bulutlu",
            recommendation: "Hava verileri şu an alınamıyor ama her zaman yürüyüş için iyi bir gün! 🐕",
            icon: "Sun"
        };
    }
};
