document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let savedLocations = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2, name) {
        const data = await NWS_SERVICE.fetchFullData(l1, l2);
        if (!data) return;
        weather = data;
        document.getElementById('city-name').innerText = name || data.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function isItActuallyDay(timeStr) {
        const check = new Date(timeStr);
        const rise = new Date(weather.sun.rise);
        const set = new Date(weather.sun.set);
        return check > rise && check < set;
    }

    function renderSunArc() {
        const now = new Date();
        const rise = new Date(weather.sun.rise);
        const set = new Date(weather.sun.set);
        const total = set - rise;
        const current = now - rise;
        let pct = Math.min(Math.max(current / total, 0), 1);
        
        const radius = 80;
        const angle = pct * Math.PI;
        const sunX = 100 - (Math.cos(angle) * radius);
        const sunY = 100 - (Math.sin(angle) * radius);

        return `
            <div class="card fade-in">
                <div class="card-head">🌅 Sun Tracker</div>
                <div class="sun-container">
                    <svg viewBox="0 0 200 110" class="sun-arc-svg">
                        <path d="M 20,100 A 80,80 0 0 1 180,100" class="sun-track" />
                        <circle cx="${sunX}" cy="${sunY}" r="6" class="sun-node" />
                    </svg>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-dim)">
                    <span>Rise: ${rise.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</span>
                    <span>Set: ${set.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</span>
                </div>
            </div>`;
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        const nowSystem = new Date();
        const hourlySync = weather.hourly.filter(h => new Date(h.startTime) >= new Date(nowSystem.setMinutes(0,0,0)));

        if (tab === 'current') {
            const obs = weather.current;
            const temp = obs.temperature.value ? Math.round((obs.temperature.value * 9/5) + 32) : hourlySync[0].temperature;
            const desc = obs.textDescription || hourlySync[0].shortForecast;
            const lightning = weather.alerts.find(a => a.properties.description.toLowerCase().includes('lightning'));

            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.4rem; font-weight:500">${desc}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${temp}</span>
                        <img src="${NWS_SERVICE.getIcon(desc, isItActuallyDay(nowSystem))}" class="hero-icon">
                    </div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${lightning ? `<div class="card fade-in" style="border-left:8px solid #ffeb3b">⚡ Lightning detected nearby.</div>` : ''}
                ${renderSunArc()}
                <div class="card fade-in"><div class="card-head">✨ Insight</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
            `;
        } else if (tab === 'hourly') {
            const items = hourlySync.slice(0, 48).map((h, i) => {
                const timeStr = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                const isDay = isItActuallyDay(h.startTime);
                const precip = h.probabilityOfPrecipitation?.value || 0;
                return `<div class="h-pill ${i === 0 ? 'active' : ''}">
                    <div style="font-size:0.75rem">${timeStr}</div>
                    <img src="${NWS_SERVICE.getIcon(h.shortForecast, isDay)}">
                    ${precip > 0 ? `<div class="precip-badge">${precip}%</div>` : '<div style="height:14px"></div>'}
                    <b>${h.temperature}°</b>
                </div>`;
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
            view.innerHTML = `<div class="fade-in">${items}</div>`;
        } else if (tab === 'saved') {
            const list = savedLocations.map(loc => `
                <button class="v-row" style="width:100%; color:white; margin-bottom:8px" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')">
                    <b>${loc.name}</b><span>View →</span>
                </button>`).join('') || '<p style="text-align:center">No saved locations.</p>';
            view.innerHTML = `<div class="card-head">Saved</div>${list}<button class="delete-btn" onclick="window.deleteSaved()">Delete All</button>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    // Storage Delegation
    window.loadLoc = async (lat, lon, name) => {
        curLat = lat; curLon = lon;
        if (name && !savedLocations.some(l => l.name === name)) {
            savedLocations.push({ lat, lon, name });
            localStorage.setItem('saved_pixel_locs', JSON.stringify(savedLocations));
        }
        document.getElementById('results').style.display = 'none';
        document.getElementById('global-search').value = '';
        await update(lat, lon, name);
    };

    window.deleteSaved = () => { if(confirm("Clear?")){ savedLocations=[]; localStorage.removeItem('saved_pixel_locs'); render('saved'); } };

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