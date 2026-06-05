const NWS_SERVICE = {
    // Perfect Polish Mapping
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        if (t.includes("snow")) return r + (t.includes("heavy") ? "heavy_snow.png" : "cloudy_with_snow.png");
        if (t.includes("rain") || t.includes("showers") || t.includes("drizzle")) {
            if (t.includes("chance") || t.includes("scattered") || t.includes("slight")) {
                return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            }
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("cloudy") || t.includes("overcast")) return r + "cloudy.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/14.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            const stationRes = await fetch(p.properties.observationStations, { headers: h });
            const stationData = await stationRes.json();
            const sId = stationData.features[0].id;

            const sunRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&timezone=auto`);
            const sunData = await sunRes.json();

            const [obs, d, hr, al] = await Promise.all([
                fetch(`${sId}/observations/latest`, { headers: h }).then(r => r.json()),
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
                sun: { rise: sunData.daily.sunrise[0], set: sunData.daily.sunset[0] }
            };
        } catch (e) { return null; }
    }
};