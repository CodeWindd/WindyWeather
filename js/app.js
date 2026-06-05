document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2) {
        weather = await NWS_SERVICE.fetchFullWeather(l1, l2);
        if (!weather) { alert("API Connection Error on Mobile. Try refreshing."); return; }
        alerts = await NWS_SERVICE.getAlerts(l1, l2);
        document.getElementById('city-name').innerText = weather.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';
        const now = weather.hourly[0];

        // CORRECT HIGH/LOW LOGIC:
        // NWS provides High/Low based on daytime periods. 
        let high = weather.daily[0].isDaytime ? weather.daily[0].temperature : weather.daily[1].temperature;
        let low = !weather.daily[0].isDaytime ? weather.daily[0].temperature : weather.daily[1].temperature;

        if (tab === 'current') {
            const alertsHTML = alerts.map(a => `
                <div class="card" style="border-left: 5px solid #ff4b4b; background: rgba(255,0,0,0.1)">
                    <h4 style="margin:0; color:#ff4b4b">${a.properties.event}</h4>
                </div>
            `).join('');

            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.1rem; opacity:0.8">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime)}" class="hero-icon">
                    </div>
                    <div>Feels like ${now.temperature - 2}°</div>
                    <div style="color:var(--text-dim); margin-top:5px">High ${high}° · Low ${low}°</div>
                </section>
                ${alertsHTML}
                <div class="card"><div class="card-header">✨ AI Report</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
            `;
        } 
        else if (tab === 'hourly') {
            const list = weather.hourly.slice(0, 48).map(h => {
                const time = new Date(h.startTime).toLocaleTimeString([], {hour: 'numeric', hour12: true});
                return `
                    <div class="hourly-list-item">
                        <span>${time}</span>
                        <img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}" width="28">
                        <b>${h.temperature}°</b>
                    </div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div>${list}</div>`;
        }
        else if (tab === 'weekly') {
            const list = weather.daily.filter(d => d.isDaytime).map(d => `
                <div class="weekly-row">
                    <span>${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast)}" width="28">
                    <b>${d.temperature}°</b>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div>${list}</div>`;
        }
        else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; overflow:hidden">
                <iframe id="radar-view" src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1"></iframe>
            </div>`;
        }
    }

    // Fixed Search Logic
    const searchInput = document.getElementById('global-search');
    const results = document.getElementById('results');
    searchInput.oninput = async (e) => {
        if (e.target.value.length < 3) { results.innerHTML = ''; return; }
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`);
        const data = await res.json();
        results.innerHTML = (data.results || []).map(r => `<div class="search-item" onclick="window.setLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1 || r.country}</div>`).join('');
    };

    window.setLoc = (lat, lon, name) => {
        curLat = lat; curLon = lon;
        results.innerHTML = ''; searchInput.value = '';
        update(lat, lon);
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon);
});
