document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let savedLocations = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    window.loadLoc = async (lat, lon, name) => {
        curLat = lat; curLon = lon;
        if (!savedLocations.some(l => l.name === name)) {
            savedLocations.push({ lat, lon, name });
            localStorage.setItem('saved_pixel_locs', JSON.stringify(savedLocations));
        }
        document.getElementById('results').style.display = 'none';
        document.getElementById('global-search').value = '';
        await update(lat, lon, name);
    };

    async function update(l1, l2, name) {
        weather = await NWS_SERVICE.fetchForecast(l1, l2);
        alerts = await NWS_SERVICE.getAlerts(l1, l2);
        if (!weather) return;
        document.getElementById('city-name').innerText = name || weather.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        const now = new Date();
        const hourlySync = weather.hourly.filter(h => new Date(h.startTime) >= new Date(now.setMinutes(0,0,0)));

        if (tab === 'current') {
            const alertCards = alerts.map(a => `<div class="card" style="border-left:8px solid #ff4b4b; background:rgba(255,0,0,0.1)"><h4>${a.properties.event}</h4></div>`).join('');
            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.4rem">${hourlySync[0].shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${hourlySync[0].temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(hourlySync[0].shortForecast, hourlySync[0].isDaytime)}" class="hero-icon">
                    </div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${alertCards}
                <div class="card fade-in">
                    <div class="card-head">✨ Weather Insight</div>
                    <div class="card-body">Currently ${hourlySync[0].shortForecast.toLowerCase()}. ${weather.daily[0].detailedForecast}</div>
                </div>`;
        } else if (tab === 'hourly') {
            const items = hourlySync.slice(0, 48).map((h, i) => {
                const timeStr = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${timeStr}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}"><b>${h.temperature}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">48-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.map(d => `
                <div class="v-row fade-in">
                    <span style="font-weight:700; width:90px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime)}" width="32">
                    <span style="flex:1; padding-left:15px; color:var(--text-dim); font-size:0.85rem">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="card">${items}</div>`;
        } else if (tab === 'saved') {
            const list = savedLocations.map(loc => `
                <button class="card fade-in" style="width:100%; text-align:left; color:white; display:block; cursor:pointer" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')">
                    <b>${loc.name}</b>
                </button>`).join('') || '<p style="text-align:center">No saved locations.</p>';
            view.innerHTML = list;
        } else if (tab === 'radar') {
            // RAINVIEWER PALETTE 1, 512PX
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden">
                <iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe>
            </div>`;
        }
    }

    const sInput = document.getElementById('global-search');
    sInput.oninput = async (e) => {
        if (e.target.value.length < 3) return;
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            const box = document.getElementById('results');
            box.style.display = 'block';
            box.innerHTML = res.results.map(r => `<button class="search-item" onclick="window.loadLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1 || r.country}</button>`).join('');
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});