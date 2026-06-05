const NWS_SERVICE = {
    async fetchFullData(lat, lon) {
        try {
            const h = { 'User-Agent': 'PixelWeather/17.0' };
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

    getSevereOutlook(weather) {
        const text = weather.daily[0].detailedForecast.toLowerCase();
        const hourly = weather.hourly.slice(0, 24);
        
        let risk = { level: "NONE", color: "var(--risk-none)", tornado: 0, wind: 2, hail: 0 };

        // Detection Logic for SPC levels
        if (text.includes("high risk")) { risk.level = "HIGH RISK"; risk.color = "var(--risk-high)"; risk.tornado = 15; risk.wind = 60; risk.hail = 45; }
        else if (text.includes("moderate risk")) { risk.level = "MODERATE RISK"; risk.color = "var(--risk-moderate)"; risk.tornado = 10; risk.wind = 45; risk.hail = 30; }
        else if (text.includes("enhanced risk")) { risk.level = "ENHANCED RISK"; risk.color = "var(--risk-enhanced)"; risk.tornado = 5; risk.wind = 30; risk.hail = 15; }
        else if (text.includes("slight risk")) { risk.level = "SLIGHT RISK"; risk.color = "var(--risk-slight)"; risk.tornado = 2; risk.wind = 15; risk.hail = 5; }
        else if (text.includes("marginal risk")) { risk.level = "MARGINAL RISK"; risk.color = "var(--risk-marginal)"; risk.tornado = 0; risk.wind = 5; risk.hail = 2; }

        // Window detection
        const storms = hourly.filter(h => h.shortForecast.toLowerCase().includes("thunderstorm"));
        risk.window = storms.length > 0 ? 
            `${new Date(storms[0].startTime).toLocaleTimeString([], {hour:'numeric'})} - ${new Date(storms[storms.length-1].startTime).toLocaleTimeString([], {hour:'numeric'})}` : 
            "No severe window identified";

        return risk;
    }
};