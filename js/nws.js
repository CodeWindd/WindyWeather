const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = (text || "").toLowerCase();
        const r = "icons/";
        if (t.includes("thunderstorm") || t.includes("t-storm")) return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        if (t.includes("snow")) return r + "cloudy_with_snow.png";
        if (t.includes("rain") || t.includes("showers")) return isDay ? r + "scattered_showers_day.png" : r + "scattered_showers_night.png";
        if (t.includes("cloudy") || t.includes("overcast")) return r + "cloudy.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullWeather(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/11.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            const stationRes = await fetch(p.properties.observationStations, { headers: h });
            const sData = await stationRes.json();
            const stationId = sData.features[0].id;

            const [obs, d, hr, al] = await Promise.all([
                fetch(`${stationId}/observations/latest`, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json()),
                fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: h }).then(r => r.json())
            ]);

            return {
                currentText: obs.properties.textDescription || hr.properties.periods[0].shortForecast,
                currentTemp: obs.properties.temperature.value ? Math.round((obs.properties.temperature.value * 9/5) + 32) : hr.properties.periods[0].temperature,
                isDay: obs.properties.icon ? obs.properties.icon.includes('day') : true,
                daily: d.properties.periods,
                hourly: hr.properties.periods,
                alerts: al.features,
                city: p.properties.relativeLocation.properties.city
            };
        } catch (e) { return null; }
    }
};