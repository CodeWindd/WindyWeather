const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";

        // PERFECT NORMALIZATION ENGINE
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("hurricane") || t.includes("tropical storm")) return r + "tropical_storm_hurricane.png";
        if (t.includes("blizzard")) return r + "blizzard.png";
        
        // Thunderstorm logic
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }

        // Rain/Showers normalization
        if (t.includes("showers") || t.includes("rain")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("snow")) return r + "mixed_rain_snow.png";
            if (t.includes("chance") || t.includes("scattered") || t.includes("slight")) {
                return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            }
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }

        // Snow logic
        if (t.includes("snow")) {
            if (t.includes("heavy")) return r + "heavy_snow.png";
            return r + "cloudy_with_snow.png";
        }

        // Clouds & Clear
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly clear") || t.includes("mostly sunny")) {
            return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        }
        if (t.includes("cloudy")) return r + "cloudy.png";
        if (t.includes("fog") || t.includes("haze")) return r + "haze_fog_dust_smoke.png";

        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/8.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            const [d, hr] = await Promise.all([
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json())
            ]);
            return { daily: d.properties.periods, hourly: hr.properties.periods, city: p.properties.relativeLocation.properties.city };
        } catch (e) { return null; }
    },

    async fetchAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
            const data = await r.json();
            return data.features || [];
        } catch { return []; }
    }
};