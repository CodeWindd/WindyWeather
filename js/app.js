document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let curLat = 41.8781, curLon = -87.6298;

    async function update(lat, lon, name) {
        // Fetch in Imperial Units: F, MPH, IN
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        
        try {
            const response = await fetch(url);
            weather = await response.json();
            if (name) document.getElementById('city-name').innerText = name;
            render(document.querySelector('.tab-btn.active').dataset.tab);
        } catch (e) { console.error("Fetch failed", e); }
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';

        if (tab === 'current') {
            const cur = weather.current;
            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${WeatherEngine.getDesc(cur.weather_code)}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${Math.round(cur.temperature_2m)}</span>
                        <img src="${WeatherEngine.getIcon(cur.weather_code, cur.is_day)}" class="hero-icon">
                    </div>
                    <div style="font-size:1.1rem">Feels like ${Math.round(cur.apparent_temperature)}°</div>
                    <div style="color:var(--text-dim); margin-top:8px">High ${Math.round(weather.daily.temperature_2m_max[0])}° · Low ${Math.round(weather.daily.temperature_2m_min[0])}°</div>
                </section>
                <div class="card">
                    <div class="card-header">✨ Details</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                        <div>Humidity: ${cur.relative_humidity_2m}%</div>
                        <div>Wind: ${cur.wind_speed_10m} mph</div>
                        <div>Precip: ${cur.precipitation} in</div>
                    </div>
                </div>
            `;
            setupSearch();
        } else if (tab === 'hourly') {
            const pills = weather.hourly.time.slice(0, 48).map((t, i) => {
                const time = new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `
                    <div class="pill-item ${i === 0 ? 'active' : ''}">
                        <div class="pill-label">${time}</div>
                        <img src="${WeatherEngine.getIcon(weather.hourly.weather_code[i], 1)}">
                        <div style="font-weight:700">${Math.round(weather.hourly.temperature_2m[i])}°</div>
                    </div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div><div class="pill-scroll-wrapper">${pills}</div></div>`;
        } else if (tab === 'weekly') {
            const pills = weather.daily.time.map((d, i) => `
                <div class="pill-item">
                    <div class="pill-label">${new Date(d).toLocaleDateString([], {weekday:'short'})}</div>
                    <img src="${WeatherEngine.getIcon(weather.daily.weather_code[i], 1)}">
                    <div style="font-weight:700">${Math.round(weather.daily.temperature_2m_max[i])}°</div>
                    <div style="font-size:0.7rem; opacity:0.6">${Math.round(weather.daily.temperature_2m_min[i])}°</div>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div><div class="pill-scroll-wrapper">${pills}</div></div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:60vh; overflow:hidden">
                <iframe id="radar-view" src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe>
            </div>`;
        }
    }

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