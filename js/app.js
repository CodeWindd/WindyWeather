document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let savedLocations = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298; // Default Chicago

    async function update(l1, l2, name) {
        const data = await NWS_SERVICE.fetchForecast(l1, l2);
        if (!data) return;
        weather = data;
        document.getElementById('city-name').innerText = name || data.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        const now = weather.hourly[0];

        if (tab === 'current') {
            view.innerHTML = `
                <div class="hero fade-in">
                    <div style="font-size:1.4rem">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime)}" class="hero-icon">
                    </div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </div>
                <div class="card fade-in">
                    <div class="card-head">✨ Weather Insight</div>
                    <div class="card-body">Currently, it's ${now.shortForecast.toLowerCase()}. ${weather.daily[0].detailedForecast}</div>
                </div>
            `;
        } else if (tab === 'hourly') {
            const items = weather.hourly.slice(0, 48).map((h, i) => {
                const time = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${time}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}"><b>${h.temperature}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">48-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.map(d => `
                <div class="v-row fade-in">
                    <span style="font-weight:700; width:100px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime)}" width="32">
                    <span style="flex:1; padding-left:15px; color:var(--text-dim); font-size:0.9rem">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="card">${items}</div>`;
        } else if (tab === 'saved') {
            const list = savedLocations.length ? savedLocations.map(loc => `
                <div class="search-item fade-in" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')">
                    <b>${loc.name}</b>
                </div>`).join('') : '<p style="text-align:center; color:var(--text-dim)">No saved locations yet.</p>';
            view.innerHTML = `<div class="card"><div class="card-head">Saved Locations</div>${list}</div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Search & Storage Logic
    const sInput = document.getElementById('global-search');
    const sBox = document.getElementById('results');
    sInput.oninput = async (e) => {
        if (e.target.value.length < 3) { sBox.style.display = 'none'; return; }
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            sBox.style.display = 'block';
            sBox.innerHTML = res.results.map(r => `<div class="search-item" onclick="window.loadLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1 || r.country}</div>`).join('');
        }
    };

    window.loadLoc = (lat, lon, name) => {
        curLat = lat; curLon = lon;
        if (!savedLocations.some(l => l.name === name)) {
            savedLocations.push({ lat, lon, name });
            localStorage.setItem('saved_pixel_locs', JSON.stringify(savedLocations));
        }
        sBox.style.display = 'none'; sInput.value = '';
        update(lat, lon, name);
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});