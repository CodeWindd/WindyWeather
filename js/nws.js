const NWS_SERVICE = {
    // FIX: Force relative path for GitHub Pages
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "./icons/"; 

        if (t.includes("thunderstorm")) return r + (isDay ? "isolated_scattered_thunderstorms_day.png" : "isolated_scattered_thunderstorms_night.png");
        if (t.includes("snow")) return r + (t.includes("heavy") ? "heavy_snow.png" : "cloudy_with_snow.png");
        if (t.includes("rain") || t.includes("showers")) return r + (isDay ? "sunny_with_rain.png" : "cloudy_with_rain.png");
        if (t.includes("mostly cloudy")) return r + (isDay ? "mostly_cloudy_day.png" : "mostly_cloudy_night.png");
        if (t.includes("partly cloudy") || t.includes("partly sunny")) return r + (isDay ? "partly_cloudy_day.png" : "partly_cloudy_night.png");
        if (t.includes("mostly clear") || t.includes("mostly sunny")) return r + (isDay ? "mostly_clear_day.png" : "mostly_clear_night.png");
        if (t.includes("cloudy")) return r + "cloudy.png";
        return r + (isDay ? "clear_day.png" : "clear_night.png");
    },

    async fetchFullWeather(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/1.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            const [d, hr] = await Promise.all([
                fetch(p.properties.forecast, { headers: h }),
                fetch(p.properties.forecastHourly, { headers: h })
            ]);
            const dj = await d.json();
            const hj = await hr.json();
            return { daily: dj.properties.periods, hourly: hj.properties.periods, city: p.properties.relativeLocation.properties.city };
        } catch (e) { return null; }
    }
};