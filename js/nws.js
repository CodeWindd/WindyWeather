const NWS_SERVICE = {
    // Headers are MANDATORY for NWS API to work on mobile browsers
    headers: { 'User-Agent': 'MyPixelWeather/1.0 (contact@example.com)' },

    getIcon: (text, isDay = true, temp = 70) => {
        let t = text.toLowerCase();
        const r = "icons/";
        if (temp > 95) return r + "very_hot.png";
        if (temp < 20) return r + "very_cold.png";

        if (t.includes("thunderstorm")) return r + (t.includes("strong") ? "strong_thunderstorms.png" : "isolated_thunderstorms.png");
        if (t.includes("snow")) return r + (t.includes("heavy") ? "heavy_snow.png" : "cloudy_with_snow.png");
        if (t.includes("rain") || t.includes("showers")) return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        if (t.includes("cloudy")) return isDay ? r + "mostly_cloudy_day.png" : "cloudy.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullWeather(lat, lon) {
        try {
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: this.headers });
            const p = await pRes.json();
            const [d, h] = await Promise.all([
                fetch(p.properties.forecast, { headers: this.headers }),
                fetch(p.properties.forecastHourly, { headers: this.headers })
            ]);
            const dj = await d.json();
            const hj = await h.json();
            return { daily: dj.properties.periods, hourly: hj.properties.periods, city: p.properties.relativeLocation.properties.city };
        } catch (e) { return null; }
    },

    async getAlerts(lat, lon) {
        try {
            const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: this.headers });
            const j = await r.json();
            return j.features || [];
        } catch { return []; }
    }
};
