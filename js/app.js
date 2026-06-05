const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        if (t.includes("snow") || t.includes("flurries")) return r + (t.includes("heavy") ? "heavy_snow.png" : "cloudy_with_snow.png");
        if (t.includes("rain") || t.includes("showers") || t.includes("drizzle")) {
            if (t.includes("scattered") || t.includes("chance") || t.includes("slight")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
            return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        }
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly") || t.includes("mostly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("cloudy") || t.includes("overcast")) return r + "cloudy.png";
        if (t.includes("fog") || t.includes("haze")) return r + "haze_fog_dust_smoke.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/15.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            const [stationData, sunData] = await Promise.all([
                fetch(p.properties.observationStations, { headers: h }).then(r => r.json()),
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&timezone=auto`).then(r => r.json())
            ]);

            const stationId = stationData.features[0].id;
            const [obs, forecast, hourly, alerts] = await Promise.all([
                fetch(`${stationId}/observations/latest`, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json()),
                fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: h }).then(r => r.json())
            ]);

            return {
                current: obs.properties,
                daily: forecast.properties.periods,
                hourly: hourly.properties.periods,
                alerts: alerts.features,
                city: p.properties.relativeLocation.properties.city,
                sun: { rise: sunData.daily.sunrise[0], set: sunData.daily.sunset[0] }
            };
        } catch (e) { return null; }
    }
};