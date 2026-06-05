document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298; // Chicago Default

    async function updateWeather(l1, l2) {
        const data = await NWS_SERVICE.fetchNWS(l1, l2);
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
            const alertsHTML = alerts.map(a => `
                <div class="card" style="border-left:8px solid #ff4b4b">
                    <h4 style="margin:0; color:#ff4b4b">${a.properties.event}</h4>
                    <p style="margin:8px 0 0 0; font-size:0.9rem">${a.properties.headline}</p>
                </div>
            `).join('');

            view.innerHTML = `
                <div class="search-box">
                    <input type="text" class="search-bar" placeholder="Search for city...">
                    <div id="results" class="search-dropdown"></div>
                </div>
                <section class="hero fade-in">
                    <div class="hero-cond">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime, now.temperature)}" class="hero-icon">
                    </div>
                    <div class="hero-details">Feels like ${now.temperature - 2}°</div>
                    <div class="hero-hi-lo">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${alertsHTML}
                <div class="card"><div class="card-header">✨ AI Weather Report</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
                <div class="card"><div class="card-header">📈 Weather Insight</div><div class="card-body">Expect ${now.shortForecast.toLowerCase()} conditions to persist.</div></div>
            `;
            setupSearch();
        } 
        
        else if (tab === 'hourly') {
            const list = weather.hourly.slice(0, 48).map(h => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                    <div>
                        <div style="font-weight:500">${new Date(h.startTime).getHours()}:00</div>
                        <div style="color:var(--text-secondary); font-size:0.85rem">${h.shortForecast}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px">
                        <img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime, h.temperature)}" width="32">
                        <span style="font-size:1.2rem; font-weight:700; width:40px; text-align:right">${h.temperature}°</span>
                    </div>
                </div>
            `).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">48-Hour Forecast</div>${list}</div>`;
        } 
        
        else if (tab === 'weekly') {
            const list = weather.daily.map(d => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                    <span style="width:100px; font-weight:500">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime, d.temperature)}" width="32">
                    <span style="width:60px; text-align:right"><b>${d.temperature}°</b></span>
                </div>
            `).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-header">7-Day Forecast</div>${list}</div>`;
        } 
        
        else if (tab === 'radar') {
            view.innerHTML = `
                <div class="card fade-in" style="padding:0; height:75vh; overflow:hidden">
                    <iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe>
                </div>`;
        }
    }

    function setupSearch() {
        const input = document.querySelector('.search-input');
        const box = document.getElementById('results');
        if (!input) return;
        input.oninput = async (e) => {
            if (e.target.value.length < 3) { box.innerHTML = ''; return; }
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`);
            const data = await res.json();
            box.innerHTML = (data.results || []).map(r => `<div class="dropdown-item" data-lat="${r.latitude}" data-lon="${r.longitude}">${r.name}, ${r.admin1 || r.country}</div>`).join('');
            document.querySelectorAll('.dropdown-item').forEach(el => {
                el.onclick = () => { curLat = el.dataset.lat; curLon = el.dataset.lon; updateWeather(curLat, curLon); };
            });
        };
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    window.onscroll = () => {
        document.getElementById('parallax-container').style.transform = `translate3d(0, -${window.pageYOffset * 0.25}px, 0)`;
    };

    updateWeather(curLat, curLon);
});
