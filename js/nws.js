const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        
        // Priority 1: Storms over Showers
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        
        // Priority 2: Snow
        if (t.includes("snow")) {
            if (t.includes("blizzard")) return r + "blizzard.png";
            if (t.includes("heavy")) return r + "heavy_snow.png";
            if (t.includes("showers")) return isDay ? r + "scattered_snow_showers_day.png" : r + "scattered_snow_showers_night.png";
            return r + "cloudy_with_snow.png";
        }

        // Priority 3: Rain/Showers
        if (t.includes("rain") || t.includes("showers")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("scattered") || t.includes("chance")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }

        // Standard
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("cloudy")) return r + "cloudy.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/2.0' };
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
    }
};