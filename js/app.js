document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
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
        const data = await NWS_SERVICE.fetchWeatherData(l1, l2);
        if (!data) return;
        weather = data;
        document.getElementById('city-name').innerText = name || data.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        if (tab === 'current') {
            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.4rem; font-weight:500">${weather.currentText}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${weather.currentTemp}</span>
                        <img src="${NWS_SERVICE.getIcon(weather.currentText, weather.isDay)}" class="hero-icon">
                    </div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>

                ${weather.alerts.map(a => `<div class="card alert-pill fade-in"><b>ALERT:</b> ${a.properties.event}</div>`).join('')}

                <div class="card fade-in">
                    <div class="card-head">✨ Weather Insight</div>
                    <div class="card-body">Expect ${weather.currentText.toLowerCase()} conditions. ${weather.daily[0].detailedForecast}</div>
                </div>

                <div class="stats-grid fade-in">
                    <div class="stat-box"><b>Humidity</b><br>${weather.humidity}%</div>
                    <div class="stat-box"><b>Wind</b><br>${weather.wind} mph</div>
                </div>
            `;
        } else if (tab === 'hourly') {
            const items = weather.hourly.slice(0, 48).map((h, i) => {
                const time = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${time}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}"><b>${h.temperature}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">48-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.filter(d => d.isDaytime).map(d => `
                <div class="v-row fade-in">
                    <span style="font-weight:700; width:90px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, true)}" width="32">
                    <span style="flex:1; padding-left:15px; color:var(--text-dim); font-size:0.85rem">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">7-Day Forecast</div><div class="v-list">${items}</div></div>`;
        } else if (tab === 'saved') {
            const list = savedLocations.map(loc => `
                <button class="v-row fade-in" style="width:100%; color:white; margin-bottom:8px" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')">
                    <b>${loc.name}</b><span>View →</span>
                </button>`).join('') || '<p style="text-align:center">No saved locations.</p>';
            view.innerHTML = `<div class="card-head">Saved Locations</div>${list}<button class="delete-btn" onclick="window.deleteSaved()">Delete All Saved</button>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Tab & Search listeners remain same as previous working version
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