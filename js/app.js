document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298; // Chicago

    async function update(l1, l2) {
        const data = await NWS_SERVICE.fetchFullWeather(l1, l2);
        if (!data) return;
        weather = data;
        alerts = await NWS_SERVICE.getAlerts(l1, l2);
        document.getElementById('city-name').innerText = weather.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';
        const now = weather.hourly[0];

        if (tab === 'current') {
            const activeAlertsHTML = alerts.length > 0 ? alerts.map(a => `
                <div class="card alert-card" style="border-left: 8px solid #ff4b4b; background: rgba(255, 75, 75, 0.1);">
                    <h4 style="margin:0; color:#ff4b4b">${a.properties.event}</h4>
                    <p style="margin:8px 0 0 0; font-size:0.9rem">${a.properties.headline}</p>
                </div>
            `).join('') : '';

            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime, now.temperature)}" class="hero-icon">
                    </div>
                    <div class="hero-details">Feels like ${now.temperature - 2}°</div>
                    <div class="hero-hi-lo">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${activeAlertsHTML}
                <div class="card"><div class="card-header">✨ AI Weather Report</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
            `;
        } 
        else if (tab === 'hourly') {
            const list = weather.hourly.slice(0, 48).map(h => {
                const date = new Date(h.startTime);
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                return `
                    <div class="hourly-list-item">
                        <div style="font-weight:500">${timeStr}</div>
                        <img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime, h.temperature)}" width="32">
                        <div style="font-weight:700">${h.temperature}°</div>
                    </div>
                `;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div>${list}</div>`;
        } 
        else if (tab === 'weekly') {
            const list = weather.daily.map(d => `
                <div class="weekly-row">
                    <span style="width:100px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime)}" width="30">
                    <span style="width:80px; text-align:right"><b>${d.temperature}°</b></span>
                </div>
            `).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div>${list}</div>`;
        } 
        else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:75vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Global Search Implementation
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('results');
    searchInput.oninput = async (e) => {
        const query = e.target.value;
        if (query.length < 3) { searchResults.innerHTML = ''; return; }
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&format=json`);
        const data = await res.json();
        searchResults.innerHTML = (data.results || []).map(r => `
            <div class="search-item" data-lat="${r.latitude}" data-lon="${r.longitude}">
                ${r.name}, ${r.admin1 || r.country}
            </div>
        `).join('');
        
        document.querySelectorAll('.search-item').forEach(el => {
            el.onclick = () => {
                curLat = el.dataset.lat; curLon = el.dataset.lon;
                searchResults.innerHTML = ''; searchInput.value = '';
                update(curLat, curLon);
            };
        });
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon);
});
