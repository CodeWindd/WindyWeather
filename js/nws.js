const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        const t = text.toLowerCase();
        const r = "icons/";
        
        // Comprehensive mapping of NWS strings to your 42 icon set
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("hurricane")) return r + "tropical_storm_hurricane.png";
        if (t.includes("blizzard")) return r + "blizzard.png";
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            if (t.includes("chance") || t.includes("isolated") || t.includes("scattered")) {
                return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
            }
            return r + "isolated_thunderstorms.png";
        }
        if (t.includes("snow")) {
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("blowing")) return r + "blowing_snow.png";
            if (t.includes("showers")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            return r + "cloudy_with_snow.png";
        }
        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("scattered") || t.includes("chance")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            if (isDay && (t.includes("sun") || t.includes("clear"))) return r + "sunny_with_rain.png";
            return r + "cloudy_with_rain.png";
        }
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly cloudy") || t.includes("partly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("mostly clear") || t.includes("mostly sunny")) return isDay ? r + "mostly_clear_day.png" : r + "mostly_clear_night.png";
        if (t.includes("fog") || t.includes("haze")) return r + "haze_fog_dust_smoke.png";
        if (t.includes("cloudy")) return r + "cloudy.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/1.4' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            const [d, hr] = await Promise.all([
                fetch(p.properties.forecast, { headers: h }),
                fetch(p.properties.forecastHourly, { headers: h })
            ]);
            return {
                daily: (await d.json()).properties.periods,
                hourly: (await hr.json()).properties.periods,
                city: p.properties.relativeLocation.properties.city
            };
        } catch (e) { return null; }
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            return (await r.json()).features || [];
        } catch { return []; }
    }
};