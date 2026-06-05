const NWS_SERVICE = {
    getIcon: (text, isDay = true, temp = 70) => {
        let t = text.toLowerCase();
        const r = "assets/icons/";

        // 1. Threshold logic for "Very" icons
        if (temp > 100) return r + "very_hot.png";
        if (temp < 10) return r + "very_cold.png";

        // 2. Normalization Logic per request
        if (t.includes("chance showers and thunderstorms")) t = "isolated_thunderstorms";
        
        // 3. Mapping for ALL 42 icons
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("hurricane") || t.includes("tropical storm")) return r + "tropical_storm_hurricane.png";
        if (t.includes("blizzard")) return r + "blizzard.png";
        if (t.includes("blowing snow")) return r + "blowing_snow.png";
        
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            if (t.includes("scattered") || t.includes("isolated")) {
                return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
            }
            return r + "isolated_thunderstorms.png"; // Parent
        }

        if (t.includes("snow")) {
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("mixed") && t.includes("rain")) return r + "mixed_rain_snow.png";
            if (t.includes("scattered")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            if (t.includes("showers")) return r + "showers_snow.png";
            if (isDay && (t.includes("sun") || t.includes("clear"))) return r + "sunny_with_snow.png";
            return r + "cloudy_with_snow.png";
        }

        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("mixed") && (t.includes("sleet") || t.includes("hail"))) return r + "mixed_rain_hail_sleet.png";
            if (t.includes("scattered")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            if (t.includes("showers")) return r + "showers_rain.png"; // Parent
            if (isDay && (t.includes("sun") || t.includes("clear"))) return r + "sunny_with_rain.png";
            return r + "cloudy_with_rain.png";
        }

        if (t.includes("sleet") || t.includes("hail")) return r + "sleet_hail.png";
        if (t.includes("icy") || t.includes("freezing rain")) return r + "icy.png";
        if (t.includes("drizzle")) return r + "drizzle.png";
        if (t.includes("flurries")) return r + "flurries.png";
        if (t.includes("fog") || t.includes("haze") || t.includes("smoke") || t.includes("dust")) return r + "haze_fog_dust_smoke.png";
        if (t.includes("windy") || t.includes("breezy")) return r + "windy_breezy.png";
        
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly cloudy") || t.includes("partly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("mostly clear") || t.includes("mostly sunny")) return isDay ? r + "mostly_clear_day.png" : r + "mostly_clear_night.png";
        if (t.includes("cloudy")) {
            if (isDay && t.includes("sun")) return r + "cloudy_with_sunny.png";
            return r + "cloudy.png";
        }
        if (t.includes("sunny") && t.includes("cloudy")) return r + "sunny_and_cloudy.png";

        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchNWS(lat, lon) {
        const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
        const p = await pRes.json();
        const [d, h] = await Promise.all([fetch(p.properties.forecast), fetch(p.properties.forecastHourly)]);
        return { daily: (await d.json()).properties.periods, hourly: (await h.json()).properties.periods, city: p.properties.relativeLocation.properties.city };
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            return (await r.json()).features || [];
        } catch { return []; }
    }
};