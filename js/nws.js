const WeatherEngine = {
    // Icons in root /icons/
    getIcon: (code, isDay = 1, temp = 70) => {
        const r = "./icons/";
        if (temp > 100) return r + "very_hot.png";
        if (temp < 15) return r + "very_cold.png";

        const mapping = {
            0: isDay ? "clear_day.png" : "clear_night.png",
            1: isDay ? "mostly_clear_day.png" : "mostly_clear_night.png",
            2: isDay ? "partly_cloudy_day.png" : "partly_cloudy_night.png",
            3: "cloudy.png",
            45: "haze_fog_dust_smoke.png", 48: "haze_fog_dust_smoke.png",
            51: "drizzle.png", 53: "drizzle.png", 55: "drizzle.png",
            61: "cloudy_with_rain.png", 63: "showers_rain.png", 65: "heavy_rain.png",
            71: "cloudy_with_snow.png", 73: "showers_snow.png", 75: "heavy_snow.png",
            77: "flurries.png",
            80: isDay ? "scattered_showers_day.png" : "scattered_showers_night.png",
            81: "heavy_rain.png", 82: "heavy_rain.png",
            85: isDay ? "scattered_snow_showers_day.png" : "scattered_snow_showers_night.png",
            86: "heavy_snow.png",
            95: "isolated_thunderstorms.png", 96: "strong_thunderstorms.png", 99: "strong_thunderstorms.png"
        };
        return r + (mapping[code] || "cloudy.png");
    },

    getDesc: (code) => {
        const desc = {
            0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Cloudy",
            45: "Foggy", 51: "Drizzle", 61: "Rain", 71: "Snow", 80: "Showers", 95: "Thunderstorm"
        };
        return desc[code] || "Overcast";
    },

    async fetchAlerts(lat, lon) {
        try {
            const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
                headers: { 'User-Agent': 'PixelWeather/1.1' }
            });
            const data = await res.json();
            return data.features || [];
        } catch { return []; }
    }
};