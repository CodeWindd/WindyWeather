const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "./icons/";
        if (t.includes("tornado")) return r + "tornado.png";
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        if (t.includes("snow")) return r + (t.includes("heavy") ? "heavy_snow.png" : "cloudy_with_snow.png");
        if (t.includes("rain") || t.includes("showers")) return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/7.0' };
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
            const data = await r.json();
            return data.features || [];
        } catch { return []; }
    },

    parseLightning(alerts) {
        // NWS Special Weather Statements often contain "Lightning detected X miles..."
        const lightningAlert = alerts.find(a => 
            a.properties.description.toLowerCase().includes("lightning") || 
            a.properties.description.toLowerCase().includes("thunderstorm")
        );
        if (!lightningAlert) return null;
        
        const desc = lightningAlert.properties.description;
        // Regex to extract distance if mentioned
        const distanceMatch = desc.match(/(\d+)\s*miles/i);
        return {
            event: "Lightning Detected",
            detail: distanceMatch ? `${distanceMatch[1]} miles away` : "Nearby lightning activity reported",
            full: lightningAlert.properties.headline
        };
    }
};