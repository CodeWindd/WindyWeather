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

    const isDaylight = (timeStr) => {
        const check = new Date(timeStr);
        return check > new Date(weather.sun.rise) && check < new Date(weather.sun.set);
    };

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        // Sync local system time with forecast
        const nowS = new Date();
        const hourlySync = weather.hourly.filter(h => new Date(h.startTime) >= new Date(nowS.setMinutes(0,0,0)));
        const isDay = isDaylight(new Date());

        if (tab === 'current') {
            const obs = weather.current;
            const temp = obs.temperature.value ? Math.round((obs.temperature.value * 9/5) + 32) : hourlySync[0].temperature;
            const desc = obs.textDescription || hourlySync[0].shortForecast;
            
            // Fixed High/Low Logic (Check isDaytime for Period 0)
            const p0 = weather.daily[0], p1 = weather.daily[1];
            const high = p0.isDaytime ? p0.temperature : "N/A";
            const low = p0.isDaytime ? p1.temperature : p0.temperature;
            const tempString = isDay ? `High ${high}° · Low ${low}°` : `Low ${low}°`;

            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${desc}</div>
                    <div class="hero-row"><span class="hero-temp">${temp}</span><img src="${NWS_SERVICE.getIcon(desc, isDay)}" class="hero-icon"></div>
                    <div style="color:var(--text-dim)">${tempString}</div>
                </section>
                <div class="card fade-in"><div class="card-head">✨ Insight</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>`;
        } else if (tab === 'hourly') {
            const items = hourlySync.slice(0, 92).map((h, i) => {
                const pr = h.probabilityOfPrecipitation?.value || 0;
                return `<div class="h-pill ${i === 0 ? 'active' : ''}"><div>${new Date(h.startTime).toLocaleTimeString([], {hour:'numeric', hour12:true})}</div><img src="${NWS_SERVICE.getIcon(h.shortForecast, isDaylight(h.startTime), pr)}">${pr > 35 ? `<div style="color:#a8c7fa; font-size:0.7rem">${pr}%</div>` : '<div style="height:12px"></div>'}<b>${h.temperature}°</b></div>`;
            }).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">92-Hour Forecast</div><div class="h-scroll">${items}</div></div>`;
        } else if (tab === 'weekly') {
            const items = weather.daily.filter(d => d.isDaytime).map(d => `
                <div class="v-row fade-in">
                    <span style="font-weight:700; width:90px; text-align:left">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, true, d.probabilityOfPrecipitation?.value || 0)}" width="32">
                    <span style="flex:1; padding-left:15px; color:var(--text-dim); font-size:0.85rem; text-align:left">${d.shortForecast}</span>
                    <span style="font-weight:700">${d.temperature}°</span>
                </div>`).join('');
            view.innerHTML = `<div class="fade-in">${items}</div>`;
        } else if (tab === 'saved') {
            const list = saved.map(loc => `<button class="v-row fade-in" onclick="window.loadLoc(${loc.lat}, ${loc.lon}, '${loc.name}')"><b>${loc.name}</b><span>View →</span></button>`).join('') || '<p style="text-align:center">Empty.</p>';
            view.innerHTML = `<div class="card-head">Saved</div>${list}<button class="delete-btn" onclick="window.deleteSaved()">Delete All</button>`;
        } else if (tab === 'radar') {
            view.innerHTML = `<div class="card fade-in" style="padding:0; height:65vh; overflow:hidden"><iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1&p=1&ts=512" style="width:100%; height:100%; border:none"></iframe></div>`;
        }
    }

    window.loadLoc = async (l1, l2, n) => {
        curLat = l1; curLon = l2;
        if (n && !saved.some(l => l.name === n)) { saved.push({lat:l1, lon:l2, name:n}); localStorage.setItem('saved_pixel_locs', JSON.stringify(saved)); }
        document.getElementById('results').style.display='none'; document.getElementById('global-search').value='';
        await update(l1, l2, n);
    };

    window.deleteSaved = () => { if(confirm("Clear All?")){ saved=[]; localStorage.removeItem('saved_pixel_locs'); render('saved'); } };

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