lconst NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        
        // Accurate real-time mapping
        if (t.includes("thunderstorm") || t.includes("t-storm")) return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        if (t.includes("snow")) return r + "cloudy_with_snow.png";
        if (t.includes("rain") || t.includes("showers") || t.includes("drizzle")) return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        if (t.includes("mostly cloudy")) return isDay ? r + "mostly_cloudy_day.png" : r + "mostly_cloudy_night.png";
        if (t.includes("partly cloudy") || t.includes("partly sunny")) return isDay ? r + "partly_cloudy_day.png" : r + "partly_cloudy_night.png";
        if (t.includes("overcast") || t.includes("cloudy")) return r + "cloudy.png";
        if (t.includes("fog") || t.includes("haze") || t.includes("mist")) return r + "haze_fog_dust_smoke.png";
        
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchWeatherData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/10.0' };
            // 1. Get metadata for the location
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            
            // 2. Find the closest observation station
            const stationRes = await fetch(p.properties.observationStations, { headers: h });
            const stationData = await stationRes.json();
            const stationId = stationData.features[0].id; // The nearest station

            // 3. Get REAL TIME current conditions vs Forecast
            const [obs, forecast, hourly, alerts] = await Promise.all([
                fetch(`${stationId}/observations/latest`, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json()),
                fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: h }).then(r => r.json())
            ]);

            return {
                currentText: obs.properties.textDescription, // This will say "Overcast"
                currentTemp: obs.properties.temperature.value ? Math.round((obs.properties.temperature.value * 9/5) + 32) : hourly.properties.periods[0].temperature,
                humidity: Math.round(obs.properties.relativeHumidity.value || 0),
                wind: Math.round((obs.properties.windSpeed.value || 0) / 1.609),
                isDay: obs.properties.icon ? obs.properties.icon.includes('day') : true,
                daily: forecast.properties.periods,
                hourly: hourly.properties.periods,
                alerts: alerts.features,
                city: p.properties.relativeLocation.properties.city
            };
        } catch (e) { return null; }
    }
};