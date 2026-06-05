const NWS_SERVICE = {
    // We use a relative path that works on GitHub Pages
    getIcon: (text, isDay = true, temp = 70) => {
        let t = text.toLowerCase();
        // Updated pathing for GitHub Pages sub-folders
        const r = "assets/icons/";

        // Special Temperature Thresholds
        if (temp > 100) return r + "very_hot.png";
        if (temp < 10) return r + "very_cold.png";

        // --- NWS Normalization ---
        if (t.includes("chance showers and thunderstorms")) t = "isolated_thunderstorms";
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            if (t.includes("scattered") || t.includes("isolated")) {
                return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
            }
            return r + "isolated_thunderstorms.png";
        }

        // Snow Mapping
        if (t.includes("snow")) {
            if (t.includes("blizzard")) return r + "blizzard.png";
            if (t.includes("blowing")) return r + "blowing_snow.png";
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("scattered")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            if (t.includes("showers")) return r + "showers_snow.png";
            return r + "cloudy_with_snow.png";
        }

        // Rain Mapping
        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("scattered")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            if (t.includes("showers")) return r + "showers_rain.png";
            if (t.includes("sunny") || t.includes("clear")) return r + "sunny_with_rain.png";
            return r + "cloudy_with_rain.png";
        }

        // Condition Mapping
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly cloudy") || t.includes("partly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("mostly clear") || t.includes("mostly sunny")) return isDay ? r + "mostly_clear_day.png" : r + "mostly_clear_night.png";
        if (t.includes("haze") || t.includes("fog") || t.includes("dust") || t.includes("smoke")) return r + "haze_fog_dust_smoke.png";
        if (t.includes("windy") || t.includes("breezy")) return r + "windy_breezy.png";
        if (t.includes("drizzle")) return r + "drizzle.png";
        if (t.includes("flurries")) return r + "flurries.png";
        if (t.includes("cloudy")) return r + "cloudy.png";
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("hurricane")) return r + "tropical_storm_hurricane.png";

        // Default Clear
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchNWS(lat, lon) {
        // NWS API can be finicky on some hosts, we add a simple error catch
        try {
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
            const p = await pRes.json();
            const [d, h] = await Promise.all([
                fetch(p.properties.forecast),
                fetch(p.properties.forecastHourly)
            ]);
            const dJ = await d.json();
            const hJ = await h.json();
            return { 
                daily: dJ.properties.periods, 
                hourly: hJ.properties.periods, 
                city: p.properties.relativeLocation.properties.city 
            };
        } catch (e) {
            console.error("NWS Fetch Error:", e);
            return null;
        }
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            const j = await r.json();
            return j.features || [];
        } catch { return []; }
    }
};
