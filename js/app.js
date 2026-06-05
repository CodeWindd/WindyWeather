document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298; // Chicago

    async function refresh(l1, l2, cityName) {
        weather = await NWS_SERVICE.fetchForecast(l1, l2);
        alerts = await NWS_SERVICE.getAlerts(l1, l2);
        if (cityName) document.getElementById('location-name').innerText = cityName;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        if (!view || !weather) return;
        view.innerHTML = '';
        const now = weather.hourly[0];

        if (tab === 'current') {
            const alertCards = alerts.map(a => `<div class="card" style="border-left:8px solid #ff4b4b; background:rgba(255,0,0,0.1)"><h4>${a.properties.event}</h4></div>`).join('');
            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.4rem; font-weight:400">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime)}" class="hero-icon">
                    </div>
                    <div style="font-size:1.1rem">Feels like ${now.temperature - 2}°</div>
                    <div style="color:var(--text-dim); margin-top:10px">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${alertCards}
                <div class="card">
                    <div class="card-head">✨ Weather Insight</div>
                    <div class="card-body">Expect ${now.shortForecast.toLowerCase()} conditions today. ${weather.daily[0].detailedForecast}</div>
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
                <div class="v-row">
                    <span style="font-weight:700; width:100px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime)}" width="32">
                    <span style="width:120px; color:var(--text-dim); font-size:0.9rem">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">7-Day Forecast</div>${items}</div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:70vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Search logic using Open-Meteo Geocoding -> NWS
    const sInput = document.getElementById('global-search');
    const sBox = document.getElementById('results');
    sInput.oninput = async (e) => {
        if (e.target.value.length < 3) { sBox.style.display = 'none'; return; }
        const data = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (data.results) {
            sBox.style.display = 'block';
            sBox.innerHTML = data.results.map(r => `<div class="search-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">${r.name}, ${r.admin1 || r.country}</div>`).join('');
            document.querySelectorAll('.search-item').forEach(el => el.onclick = () => {
                curLat = el.dataset.lat; curLon = el.dataset.lon;
                sBox.style.display = 'none'; sInput.value = '';
                refresh(curLat, curLon, el.dataset.name);
            });
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    window.onscroll = () => { document.getElementById('parallax-container').style.transform = `translate3d(0, -${window.pageYOffset * 0.2}px, 0)`; };
    refresh(curLat, curLon, "Chicago");
});