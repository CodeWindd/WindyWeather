document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298; // Chicago Default

    async function update(lat, lon, name) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        try {
            const [wRes, aData] = await Promise.all([
                fetch(url).then(r => r.json()),
                WeatherEngine.fetchAlerts(lat, lon)
            ]);
            weather = wRes;
            alerts = aData;
            if (name) document.getElementById('city-name').innerText = name;
            render(document.querySelector('.tab-btn.active').dataset.tab);
        } catch (e) { console.error("Update Failed", e); }
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';

        if (tab === 'current') {
            const cur = weather.current;
            const daily = weather.daily;
            const alertsHTML = alerts.map(a => `<div class="card" style="border-left:6px solid #ff4b4b; background:rgba(255,0,0,0.1)"><h4>${a.properties.event}</h4></div>`).join('');

            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${WeatherEngine.getDesc(cur.weather_code)}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${Math.round(cur.temperature_2m)}</span>
                        <img src="${WeatherEngine.getIcon(cur.weather_code, cur.is_day, cur.temperature_2m)}" class="hero-icon">
                    </div>
                    <div style="font-size:1.1rem">Feels like ${Math.round(cur.apparent_temperature)}°</div>
                    <div style="color:var(--text-dim); margin-top:8px">High ${Math.round(daily.temperature_2m_max[0])}° · Low ${Math.round(daily.temperature_2m_min[0])}°</div>
                </section>
                ${alertsHTML}
                <div class="card"><div class="card-header">✨ AI Weather Insight</div><div class="card-body">The ${WeatherEngine.getDesc(cur.weather_code).toLowerCase()} conditions will persist. Humidity is at ${cur.relative_humidity_2m}%.</div></div>
            `;
            setupSearch();
        } else if (tab === 'hourly') {
            const list = weather.hourly.time.slice(0, 48).map((t, i) => {
                const time = new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `<div class="hourly-list-item"><span>${time}</span><img src="${WeatherEngine.getIcon(weather.hourly.weather_code[i])}" width="30"><b>${Math.round(weather.hourly.temperature_2m[i])}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div>${list}</div>`;
        } else if (tab === 'weekly') {
            const list = weather.daily.time.map((d, i) => `
                <div class="weekly-row">
                    <span>${new Date(d).toLocaleDateString([], {weekday:'short'})}</span>
                    <img src="${WeatherEngine.getIcon(weather.daily.weather_code[i])}" width="30">
                    <b>${Math.round(weather.daily.temperature_2m_max[i])}° / ${Math.round(weather.daily.temperature_2m_min[i])}°</b>
                </div>
            `).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div>${list}</div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:60vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Search logic using Open-Meteo Geocoding
    function setupSearch() {
        const inp = document.getElementById('global-search');
        const res = document.getElementById('results');
        inp.oninput = async (e) => {
            if (e.target.value.length < 3) { res.style.display = 'none'; return; }
            const data = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
            if (data.results) {
                res.style.display = 'block';
                res.innerHTML = data.results.map(r => `<div class="search-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">${r.name}, ${r.admin1 || r.country}</div>`).join('');
                document.querySelectorAll('.search-item').forEach(el => {
                    el.onclick = () => {
                        curLat = el.dataset.lat; curLon = el.dataset.lon;
                        res.style.display = 'none'; inp.value = '';
                        update(curLat, curLon, el.dataset.name);
                    };
                });
            }
        };
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});