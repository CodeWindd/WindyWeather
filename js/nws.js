const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";

        // NORMALIZATION
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        if (t.includes("showers") || t.includes("rain")) {
            if (t.includes("heavy")) return r + "heavy_rain.png";
            if (t.includes("chance") || t.includes("scattered")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly clear") || t.includes("mostly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchForecast(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/9.0' };
            // 1. Get Metadata
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            // 2. Fetch Observations (CURRENT) and Forecasts
            const stationRes = await fetch(p.properties.observationStations, { headers: h });
            const stationData = await stationRes.json();
            const stationId = stationData.features[0].id;

            const [obs, d, hr, al] = await Promise.all([
                fetch(`${stationId}/observations/latest`, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json()),
                fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: h }).then(r => r.json())
            ]);

            return {
                current: obs.properties,
                daily: d.properties.periods,
                hourly: hr.properties.periods,
                alerts: al.features,
                city: p.properties.relativeLocation.properties.city
            };
        } catch (e) { return null; }
    }
};