const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "./icons/";

        // PERFECT MAPPING LOGIC
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("hurricane") || t.includes("tropical storm")) return r + "tropical_storm_hurricane.png";
        if (t.includes("blizzard")) return r + "blizzard.png";
        if (t.includes("blowing snow")) return r + "blowing_snow.png";

        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            if (t.includes("scattered") || t.includes("isolated") || t.includes("chance")) {
                return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
            }
            return r + "isolated_thunderstorms.png";
        }

        if (t.includes("snow")) {
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("mixed") && t.includes("rain")) return r + "mixed_rain_snow.png";
            if (t.includes("showers")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            if (t.includes("flurries")) return r + "flurries.png";
            return isDay ? r + "sunny_with_snow.png" : r + "cloudy_with_snow.png";
        }

        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("scattered") || t.includes("chance") || t.includes("slight")) {
                return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            }
            if (t.includes("drizzle")) return r + "drizzle.png";
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }

        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly cloudy") || t.includes("partly sunny") || t.includes("mostly sunny")) {
            return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        }
        if (t.includes("haze") || t.includes("fog") || t.includes("smoke")) return r + "haze_fog_dust_smoke.png";
        if (t.includes("windy") || t.includes("breezy")) return r + "windy_breezy.png";
        if (t.includes("cloudy")) return r + "cloudy.png";

        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/6.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            const [d, hr] = await Promise.all([
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json())
            ]);
            return { daily: d.properties.periods, hourly: hr.properties.periods, city: p.properties.relativeLocation.properties.city };
        } catch (e) { return null; }
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            return (await r.json()).features || [];
        } catch { return []; }
    }
};