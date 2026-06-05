const NWS_SERVICE = {
    getIcon: (text, isDay = true) => {
        let t = text.toLowerCase();
        const r = "icons/";
        if (t.includes("thunderstorm") || t.includes("t-storm")) {
            if (t.includes("strong") || t.includes("severe")) return r + "strong_thunderstorms.png";
            return isDay ? r + "isolated_scattered_thunderstorms_day.png" : r + "isolated_scattered_thunderstorms_night.png";
        }
        if (t.includes("snow")) return r + "cloudy_with_snow.png";
        if (t.includes("rain") || t.includes("showers")) return isDay ? r + "sunny_with_rain.png" : r + "cloudy_with_rain.png";
        return isDay ? r + "clear_day.png" : r + "clear_night.png";
    },

    async fetchFullData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/16.0' };
            const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: h });
            const p = await pRes.json();
            const [d, hr, al] = await Promise.all([
                fetch(p.properties.forecast, { headers: h }).then(r => r.json()),
                fetch(p.properties.forecastHourly, { headers: h }).then(r => r.json()),
                fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { headers: h }).then(r => r.json())
            ]);
            return { daily: d.properties.periods, hourly: hr.properties.periods, alerts: al.features, city: p.properties.relativeLocation.properties.city };
        } catch (e) { return null; }
    },

    analyzeSevere(weather) {
        const forecastText = weather.daily[0].detailedForecast.toLowerCase();
        const hourly = weather.hourly.slice(0, 24);
        
        // Probabilities Extraction (Mocking percentages based on NWS probability strings)
        const getProb = (keywords) => {
            if (keywords.some(k => forecastText.includes(k))) return Math.floor(Math.random() * 15) + 5; // Base 5-20%
            return 0;
        };

        // Window detection
        const severeHours = hourly.filter(h => h.shortForecast.toLowerCase().includes('thunderstorm'));
        let window = "No severe weather expected";
        if (severeHours.length > 0) {
            const start = new Date(severeHours[0].startTime).toLocaleTimeString([], {hour:'numeric'});
            const end = new Date(severeHours[severeHours.length-1].startTime).toLocaleTimeString([], {hour:'numeric'});
            window = `${start} — ${end}`;
        }

        return {
            window: window,
            tornado: forecastText.includes('tornado') ? 5 : 0,
            wind: forecastText.includes('damaging wind') || forecastText.includes('gusts') ? 15 : 2,
            hail: forecastText.includes('hail') ? 15 : 0,
            hazards: forecastText.split('.').filter(s => s.includes('wind') || s.includes('thunderstorm') || s.includes('hail')).join('.')
        };
    }
};