document.addEventListener('DOMContentLoaded', () => {
    let weather = null, alerts = [];
    let curLat = 41.8781, curLon = -87.6298; // Chicago

    async function update(l1, l2) {
        const data = await NWS_SERVICE.fetchNWS(l1, l2);
        if(!data) {
            alert("NWS API is currently down or busy. Try again in a minute.");
            return;
        }
        weather = data;
        alerts = await NWS_SERVICE.getAlerts(l1, l2);
        document.getElementById('city-name').innerText = weather.city;
        render('current');
    }

    function render(tab) {
        const view = document.getElementById('view-layer');
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
                    <input type="text" class="search-bar" placeholder="Search global cities...">
                    <div id="res" class="search-results"></div>
                </div>
                <section class="hero fade-in">
                    <div class="hero-cond">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="${NWS_SERVICE.getIcon(now.shortForecast, now.isDaytime, now.temperature)}" class="hero-icon">
                    </div>
                    <div class="hero-feels">Feels like ${now.temperature - 2}°</div>
                    <div class="hero-hi-lo">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                ${alertsHTML}
                <div class="card fade-in">
                    <div class="card-head">✨ AI Weather Report</div>
                    <div class="card-body">${weather.daily[0].detailedForecast}</div>
                </div>
                <div class="card fade-in">
                    <div class="card-head">🕒 Hourly</div>
                    <div class="h-strip">
                        ${weather.hourly.slice(0,24).map((h, i) => `
                            <div class="h-item ${i === 0 ? 'active' : ''}">
                                <span>${new Date(h.startTime).getHours()}h</span><br>
                                <img src="${NWS_SERVICE.getIcon(h.shortForecast, h.isDaytime, h.temperature)}"><br>
                                <b>${h.temperature}°</b>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            setupSearch();
        } else if (tab === 'weekly') {
            const list = weather.daily.map(d => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                    <span style="font-weight:500">${d.name}</span>
                    <img src="${NWS_SERVICE.getIcon(d.shortForecast, d.isDaytime, d.temperature)}" width="32">
                    <span style="width:50px; text-align:right"><b>${d.temperature}°</b></span>
                </div>
            `).join('');
            view.innerHTML = `<div class="card fade-in"><div class="card-head">7-Day Forecast</div>${list}</div>`;
        } else if (tab === 'radar') {
            view.innerHTML = `
                <div class="card fade-in" style="padding:0; height:75vh; overflow:hidden">
                    <iframe src="https://www.rainviewer.com/map.html?loc=${curLat},${curLon},6&type=radar&o99=1&eb=0&th=1&sm=1&sn=1" style="width:100%; height:100%; border:none"></iframe>
                </div>`;
        }
    }

    // Search and Tab logic remains the same...
    function setupSearch() {
        const input = document.querySelector('.search-bar');
        const res = document.getElementById('res');
        if(!input) return;
        input.oninput = async (e) => {
            if (e.target.value.length < 3) { res.innerHTML = ''; return; }
            const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&format=json`);
            const data = await r.json();
            res.innerHTML = (data.results || []).map(i => `<div class="search-item" data-lat="${i.latitude}" data-lon="${i.longitude}">${i.name}, ${i.admin1 || i.country}</div>`).join('');
            document.querySelectorAll('.search-item').forEach(el => el.onclick = () => { 
                curLat=el.dataset.lat; curLon=el.dataset.lon; update(curLat, curLon); 
            });
        };
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    window.onscroll = () => {
        const bg = document.getElementById('parallax-container');
        if(bg) bg.style.transform = `translate3d(0, -${window.pageYOffset * 0.25}px, 0)`;
    };

    update(curLat, curLon);
});
