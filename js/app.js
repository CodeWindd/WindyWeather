document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let saved = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2, name) {
        const data = await NWS_SERVICE.fetchFullData(l1, l2);
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
            const now = weather.hourly[0];
            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${now.shortForecast}</div>
                    <div class="hero-row"><span class="hero-temp">${now.temperature}</span><img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime)}" class="hero-icon"></div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                <div class="card fade-in"><div class="card-head">✨ Insight</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>`;
        } else if (tab === 'severe') {
            const sev = NWS_SERVICE.analyzeSevere(weather);
            view.innerHTML = `
                <div class="card fade-in">
                    <div class="card-head">🌩️ Peak Severe Window</div>
                    <div class="peak-window">${sev.window}</div>
                    <div style="color:var(--text-dim); font-size:0.9rem">Based on hyperlocal NWS grid-point data.</div>
                </div>

                <div class="card fade-in">
                    <div class="card-head">📊 Probabilities</div>
                    <div class="hazard-row">
                        <span class="hazard-label">Tornado</span>
                        <div class="hazard-bar-bg"><div class="hazard-fill" style="width:${sev.tornado * 5}%; background:var(--extreme)"></div></div>
                        <span style="width:30px; text-align:right">${sev.tornado}%</span>
                    </div>
                    <div class="hazard-row">
                        <span class="hazard-label">Wind</span>
                        <div class="hazard-bar-bg"><div class="hazard-fill" style="width:${sev.wind * 2}%; background:var(--high)"></div></div>
                        <span style="width:30px; text-align:right">${sev.wind}%</span>
                    </div>
                    <div class="hazard-row">
                        <span class="hazard-label">Hail</span>
                        <div class="hazard-bar-bg"><div class="hazard-fill" style="width:${sev.hail * 2}%; background:var(--high)"></div></div>
                        <span style="width:30px; text-align:right">${sev.hail}%</span>
                    </div>
                </div>

                <div class="severe-summary fade-in">
                    <b>Primary Hazards:</b><br>${sev.hazards || "No major severe hazards identified for this period."}
                </div>
            `;
        } else if (tab === 'hourly') {
            const items = weather.hourly.slice(0, 48).map(h => `<div class="h-pill"><div>${new Date(h.startTime).getHours()}h</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime)}"><b>${h.temperature}°</b></div>`).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">48-Hour</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.filter(d => d.isDaytime).map(d => `<div class="v-row fade-in"><span>${d.name}</span><img src="${NWS_SERVICE.getIcon(d.shortForecast)}" width="32"><b>${d.temperature}°</b></div>`).join('');
            view.innerHTML = `<div class="fade-in">${items}</div>`;
        } else if (tab === 'saved') {
            const list = saved.map(loc => `<button class="v-row fade-in" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')"><b>${loc.name}</b><span>→</span></button>`).join('');
            view.innerHTML = `<div class="card-head">Saved</div>${list}<button class="delete-btn" onclick="window.deleteSaved()">Delete All</button>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Geocoding and Loading
    window.loadLoc = async (l1, l2, n) => {
        curLat = l1; curLon = l2;
        if (n && !saved.some(l => l.name === n)) { saved.push({lat:l1, lon:l2, name:n}); localStorage.setItem('saved_pixel_locs', JSON.stringify(saved)); }
        document.getElementById('results').style.display='none'; await update(l1, l2, n);
    };

    const sIn = document.getElementById('global-search');
    sIn.oninput = async (e) => {
        if (e.target.value.length < 3) return;
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            const box = document.getElementById('results'); box.style.display = 'block';
            box.innerHTML = res.results.map(r => `<button class="search-item" onclick="window.loadLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1}</button>`).join('');
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});