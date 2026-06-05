const WeatherLib = {
    getIcon: (code, isDay = 1) => {
        const r = "./icons/";
        const m = {
            0: isDay ? "clear_day.png" : "clear_night.png",
            1: isDay ? "mostly_clear_day.png" : "mostly_clear_night.png",
            2: isDay ? "partly_cloudy_day.png" : "partly_cloudy_night.png",
            3: "cloudy.png",
            45: "haze_fog_dust_smoke.png", 51: "drizzle.png",
            61: "sunny_with_rain.png", 63: "cloudy_with_rain.png", 65: "heavy_rain.png",
            71: "sunny_with_snow.png", 73: "cloudy_with_snow.png", 75: "heavy_snow.png",
            80: isDay ? "scattered_showers_day.png" : "scattered_showers_night.png",
            95: "isolated_thunderstorms.png", 96: "strong_thunderstorms.png"
        };
        return r + (m[code] || "cloudy.png");
    },
    getDesc: (code) => {
        const d = { 0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Cloudy", 45: "Foggy", 61: "Rainy", 71: "Snowy", 80: "Showers", 95: "Stormy" };
        return d[code] || "Overcast";
    },
    async fetchAlerts(lat, lon) {
        try {
            const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: { 'User-Agent': 'PixelWeather/1.2' }});
            const data = await res.json();
            return data.features || [];
        } catch { return []; }
    }
};