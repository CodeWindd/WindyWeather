document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let lat = 41.8781, lon = -87.6298;

    async function update(l1, l2, name) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${l1}&longitude=${l2}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        
        try {
            const [w, a] = await Promise.all([
                fetch(url).then(r => r.json()),
                WeatherUtils.fetchAlerts(l1, l2)
            ]);
            weather = w; alerts = a;
            if (name) document.getElementById('city-display').innerText = name;
            render(document.querySelector('.tab-btn.active').dataset.tab);
        } catch (e) { console.error("Error loading data", e); }
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';
        const cur = weather.current;

        if (tab === 'current') {
            const alertCards = alerts.map(a => `<div class="card" style="border-left:6px solid #ff4b4b; background:rgba(255,0,0,0.1)"><h4>${a.properties.event}</h4></div>`).join('');
            view.innerHTML = `
                <div class="hero fade-in">
                    <div style="font-size:1.4rem">${WeatherUtils.getDesc(cur.weather_code)}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${Math.round(cur.temperature_2m)}</span>
                        <img src="${WeatherUtils.getIcon(cur.weather_code, cur.is_day)}" class="hero-icon">
                    </div>
                    <div style="font-size:1.1rem">Feels like ${Math.round(cur.apparent_temperature)}°</div>
                    <div style="color:var(--text-dim); margin-top:8px">High ${Math.round(weather.daily.temperature_2m_max[0])}° · Low ${Math.round(weather.daily.temperature_2m_min[0])}°</div>
                </div>
                ${alertCards}
                <div class="card"><div class="card-head">✨ AI Report</div><div class="card-body">Humidity is ${cur.relative_humidity_2m}%. Wind is ${cur.wind_speed_10m} mph.</div></div>
            `;
        } else if (tab === 'hourly') {
            const items = weather.hourly.time.slice(0, 48).map((t, i) => {
                const time = new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `
                    <div class="h-pill ${i === 0 ? 'active' : ''}">
                        <div style="font-size:0.75rem">${time}</div>
                        <img src="${WeatherUtils.getIcon(weather.hourly.weather_code[i], 1)}">
                        <b>${Math.round(weather.hourly.temperature_2m[i])}°</b>
                    </div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">48-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.time.map((d, i) => `
                <div class="v-row">
                    <span style="font-weight:700; width:60px">${new Date(d).toLocaleDateString([], {weekday:'short'})}</span>
                    <img src="${WeatherUtils.getIcon(weather.daily.weather_code[i], 1)}">
                    <span style="color:var(--text-dim); width:120px">${WeatherUtils.getDesc(weather.daily.weather_code[i])}</span>
                    <span style="font-weight:700">${Math.round(weather.daily.temperature_2m_max[i])}°</span>
                </div>`);
            view.innerHTML = `<div class="card fade-in"><div class="card-head">7-Day Forecast</div><div class="v-list">${items.join('')}</div></div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${lat},${lon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Search logic
    const sInput = document.getElementById('loc-search');
    const sBox = document.getElementById('search-results');
    sInput.oninput = async (e) => {
        if (e.target.value.length < 3) { sBox.style.display = 'none'; return; }
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            sBox.style.display = 'block';
            sBox.innerHTML = res.results.map(r => `<div class="search-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">${r.name}, ${r.admin1 || r.country}</div>`).join('');
            document.querySelectorAll('.search-item').forEach(el => el.onclick = () => {
                lat = el.dataset.lat; lon = el.dataset.lon;
                sBox.style.display = 'none'; sInput.value = '';
                update(lat, lon, el.dataset.name);
            });
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(lat, lon, "Chicago");
});