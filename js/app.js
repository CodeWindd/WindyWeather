document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let savedLocations = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2, name) {
        const data = await NWS_SERVICE.fetchForecast(l1, l2);
        if (!data) return;
        weather = data;
        alerts = await NWS_SERVICE.fetchAlerts(l1, l2);
        document.getElementById('city-name').innerText = name || data.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        const nowSys = new Date();
        const hourlySync = weather.hourly.filter(h => new Date(h.startTime) >= new Date(nowSys.setMinutes(0,0,0)));

        if (tab === 'current') {
            const alertCards = alerts.map(a => `<div class="alert-pill fade-in"><b>NWS:</b> ${a.properties.event}</div>`).join('');
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
                    <div class="card-body">${weather.daily[0].detailedForecast}</div>
                </div>`;
        } else if (tab === 'hourly') {
            const items = hourlySync.slice(0, 48).map((h, i) => {
                const time = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${time}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}"><b>${h.temperature}°</b></div>`;
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
                <div class="card fade-in saved-loc-click" data-lat="${loc.lat}" data-lon="${loc.lon}" data-name="${loc.name}">
                    <div style="display:flex; justify-content:space-between"><b>${loc.name}</b><span>View →</span></div>
                </div>`).join('') || '<p>No saved locations.</p>';
            view.innerHTML = list;
            document.querySelectorAll('.saved-loc-click').forEach(c => c.onclick = () => window.loadLoc(c.dataset.lat, c.dataset.lon, c.dataset.name));
        } else if (tab === 'radar') {
            // Updated to official NWS radar station view
            const station = weather.station || 'KORD';
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden">
                <iframe src="https://radar.weather.gov/station/${station}/standard" style="width:100%; height:100%; border:none"></iframe>
            </div>`;
        }
    }

    window.loadLoc = (lat, lon, name) => {
        curLat = lat; curLon = lon;
        if (!savedLocations.some(l => l.name === name)) {
            savedLocations.push({ lat, lon, name });
            localStorage.setItem('saved_pixel_locs', JSON.stringify(savedLocations));
        }
        document.getElementById('results').style.display = 'none';
        document.getElementById('global-search').value = '';
        update(lat, lon, name);
    };

    const sInput = document.getElementById('global-search');
    sInput.oninput = async (e) => {
        if (e.target.value.length < 3) return;
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            const box = document.getElementById('results');
            box.style.display = 'block';
            box.innerHTML = res.results.map(r => `<div class="search-item" onclick="window.loadLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1 || r.country}</div>`).join('');
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});