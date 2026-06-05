const NWS_SERVICE = {
    getIcon: (text, isDay = true, temp = 70) => {
        let t = text.toLowerCase();
        const r = "icons/";

        if (temp > 100) return r + "very_hot.png";
        if (temp < 10) return r + "very_cold.png";

        // Parent extraction logic
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            if (t.includes("scattered") || t.includes("isolated") || t.includes("chance")) {
                return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
            }
            return r + "isolated_thunderstorms.png";
        }
        if (t.includes("snow")) {
            if (t.includes("blizzard")) return r + "blizzard.png";
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("showers")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            return r + "cloudy_with_snow.png";
        }
        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("scattered") || t.includes("chance")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly clear")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("fog") || t.includes("haze")) return r + "haze_fog_dust_smoke.png";
        if (t.includes("cloudy")) return r + "cloudy.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullWeather(lat, lon) {
        try {
            // Step 1: Points
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
            const p = await pRes.json();
            // Step 2: Parallel Forecasts
            const [d, h] = await Promise.all([fetch(p.properties.forecast), fetch(p.properties.forecastHourly)]);
            const dj = await d.json();
            const hj = await h.json();
            return { 
                daily: dj.properties.periods, 
                hourly: hj.properties.periods, 
                city: p.properties.relativeLocation.properties.city,
                timezone: p.properties.timeZone
            };
        } catch (e) { return null; }
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            const j = await r.json();
            return j.features || [];
        } catch { return []; }
    }
};
