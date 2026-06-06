document.addEventListener('DOMContentLoaded', () => {
    let weather = null;
    let saved = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    const isDaylight = (timeStr) => {
        const check = new Date(timeStr);
        return check > new Date(weather.sun.rise) && check < new Date(weather.sun.set);
    };

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

        const nowS = new Date();
        const hourly92 = weather.hourly.filter(h => new Date(h.startTime) >= new Date(nowS.setMinutes(0,0,0))).slice(0, 92);

        if (tab === 'current') {
            const obs = weather.current;
            const isNight = !isDaylight(new Date());
            
            // FIX: Dynamic Hero High/Low Logic
            let high = weather.daily[0].isDaytime ? weather.daily[0].temperature : weather.daily[1].temperature;
            let low = !weather.daily[0].isDaytime ? weather.daily[0].temperature : (weather.daily[1] ? weather.daily[1].temperature : '--');
            
            const temp = obs.temperature.value ? Math.round((obs.temperature.value * 9/5) + 32) : hourly92[0].temperature;
            const desc = obs.textDescription || hourly92[0].shortForecast;

            view.innerHTML = `
                <section class="hero fade-in">
                    <div style="font-size:1.4rem; font-weight:400">${desc}</div>
                    <div class="hero-row"><span class="hero-temp">${temp}</span><img src="${NWS_SERVICE.getIcon(desc, 0, !isNight)}" class="hero-icon"></div>
                    <div style="color:var(--text-dim)">${isNight ? `Tonight's Low ${low}°` : `High ${high}° · Low ${low}°`}</div>
                </section>
                <div class="card fade-in"><div class="card-head">✨ Weather Insight</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>
            `;
        } else if (tab === 'hourly') {
            const items = hourly92.map((h, i) => {
                const time = new Date(h.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                const precip = h.probabilityOfPrecipitation?.value || 0;
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${time}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, precip, isDaylight(h.startTime))}">${precip >= 35 ? `<div style="color:#a8c7fa;font-size:0.75rem">${precip}%</div>` : '<div style="height:14px"></div>'}<b>${h.temperature}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">92-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.filter(d => d.isDaytime).map(d => `
                <div class="v-row fade-in">
                    <span style="font-weight:700; width:90px">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.probabilityOfPrecipitation?.value || 0, true)}" width="32">
                    <span style="flex:1; padding-left:15px; color:var(--text-dim); font-size:0.85rem">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="fade-in">${items}</div>`;
        } else if (tab === 'saved') {
            const list = saved.map(loc => `
                <div class="v-row fade-in" style="margin-bottom:12px">
                    <div onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')" style="flex:1"><b>${loc.name}</b></div>
                    <span onclick="window.removeLoc('${loc.name}')" style="color:#ffb4ab; padding:10px">✕</span>
                </div>`).join('') || '<p style="text-align:center">Empty.</p>';
            view.innerHTML = `<div class="card-head">Saved Locations</div>${list}<button class="delete-btn" onclick="window.deleteSaved()">Clear All</button>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    window.loadLoc = async (l1, l2, n) => {
        curLat = l1; curLon = l2;
        if (n && !saved.some(l => l.name === n)) { saved.push({lat:l1, lon:l2, name:n}); localStorage.setItem('saved_pixel_locs', JSON.stringify(saved)); }
        document.getElementById('results').style.display='none'; await update(l1, l2, n);
    };

    window.removeLoc = (name) => {
        saved = saved.filter(l => l.name !== name);
        localStorage.setItem('saved_pixel_locs', JSON.stringify(saved));
        render('saved');
    };

    window.deleteSaved = () => { if(confirm("Clear all?")){ saved=[]; localStorage.removeItem('saved_pixel_locs'); render('saved'); } };

    const sIn = document.getElementById('global-search');
    sIn.oninput = async (e) => {
        if (e.target.value.length < 3) return;
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`).then(r => r.json());
        if (res.results) {
            const box = document.getElementById('results'); box.style.display = 'block';
            box.innerHTML = res.results.map(r => `<button class="search-item" onclick="window.loadLoc(${r.latitude},${r.longitude},'${r.name}')">${r.name}, ${r.admin1 || r.country}</button>`).join('');
        }
    };

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});