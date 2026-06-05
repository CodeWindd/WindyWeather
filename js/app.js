document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2, name) {
        weather = await NWS_SERVICE.fetchFullWeather(l1, l2);
        if (!weather) return;
        document.getElementById('city-name').innerText = name || weather.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';
        
        // FIX HIGH/LOW LOGIC: Find the actual max and min in the first 2 periods
        const p0 = weather.daily[0];
        const p1 = weather.daily[1];
        let high = p0.isDaytime ? p0.temperature : p1.temperature;
        let low = !p0.isDaytime ? p0.temperature : p1.temperature;

        if (tab === 'current') {
            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${weather.hourly[0].shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${weather.hourly[0].temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(weather.hourly[0].shortForecast, weather.hourly[0].isDaytime)}" class="hero-icon">
                    </div>
                    <div style="font-size:1.1rem; margin-top: -5px;">Feels like ${weather.hourly[0].temperature - 2}°</div>
                    <div style="color:var(--text-dim); margin-top:10px; font-size:1rem;">High ${high}° · Low ${low}°</div>
                </section>
                <div class="card"><div class="card-header">✨ AI Report</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
            `;
        } else if (tab === 'hourly') {
            const list = weather.hourly.slice(0, 48).map(h => `
                <div class="hourly-list-item">
                    <span>${new Date(h.startTime).toLocaleTimeString([], {hour: 'numeric', hour12: true})}</span>
                    <img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}" width="30">
                    <b>${h.temperature}°</b>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div>${list}</div>`;
        } else if (tab === 'weekly') {
            const list = weather.daily.filter(d => d.isDaytime).map(d => `
                <div class="weekly-row">
                    <span>${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast)}" width="30">
                    <b>${d.temperature}°</b>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div>${list}</div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:60vh; overflow:hidden">
                <iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe>
            </div>`;
        }
    }

    // SEARCH LOGIC FIX
    const sInput = document.getElementById('global-search');
    const sRes = document.getElementById('results');

    sInput.addEventListener('input', async (e) => {
        const val = e.target.value;
        if (val.length < 3) { sRes.style.display = 'none'; return; }
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=5&format=json`);
        const data = await r.json();
        if (data.results) {
            sRes.style.display = 'block';
            sRes.innerHTML = data.results.map(r => `<div class="search-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">${r.name}, ${r.admin1 || r.country}</div>`).join('');
        }
    });

    sRes.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (!item) return;
        curLat = item.dataset.lat; curLon = item.dataset.lon;
        sRes.style.display = 'none'; sInput.value = '';
        update(curLat, curLon, item.dataset.name);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active'); render(e.target.dataset.tab);
        });
    });

    update(curLat, curLon, "Chicago");
});