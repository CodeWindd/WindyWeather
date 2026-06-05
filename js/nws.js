const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        if (t.includes("thunderstorm")) return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        if (t.includes("rain") || t.includes("showers")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
        if (t.includes("snow")) return r + "cloudy_with_snow.png";
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/13.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            const stationRes = await fetch(p.properties.observationStations, { headers: h });
            const stationData = await stationRes.json();
            const stationId = stationData.features[0].id;

            // Fetching Sunrise/Sunset via Open-Meteo (Fastest accurate astro source)
            const sunRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&timezone=auto`);
            const sunData = await sunRes.json();

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
                city: p.properties.relativeLocation.properties.city,
                astro: { sunrise: sunData.daily.sunrise[0], sunset: sunData.daily.sunset[0] }
            };
        } catch (e) { return null; }
    }
};