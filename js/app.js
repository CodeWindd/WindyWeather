document.addEventListener('DOMContentLoaded', () => {
    // Register PWA Service Worker for Offline Mode
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    let weather = null;
    let saved = JSON.parse(localStorage.getItem('saved_pixel_locs')) || [];
    let curLat = 41.8781, curLon = -87.6298;

    async function update(l1, l2, name) {
        weather = await NWS_SERVICE.fetchFullData(l1, l2);
        if (!weather) return;
        document.getElementById('city-name').innerText = name || weather.city;
        render(document.querySelector('.tab-btn.active').dataset.tab);
    }

    function render(tab) {
        const view = document.getElementById('weather-view');
        view.innerHTML = '';
        if (!weather) return;

        if (tab === 'severe') {
            const sev = NWS_SERVICE.getSevereOutlook(weather);
            const textClass = (sev.level === 'SLIGHT RISK') ? 'color:black' : 'color:white';

            view.innerHTML = `
                <div class="risk-banner fade-in" style="background:${sev.color}; ${textClass}">
                    ${sev.level}
                </div>
                
                <div class="card fade-in">
                    <div class="card-head">🕒 Peak Timing</div>
                    <h2 style="margin:0">${sev.window}</h2>
                    <p style="color:var(--text-dim); font-size:0.9rem">Window based on local convective intensity data.</p>
                </div>

                <div class="card fade-in">
                    <div class="card-head">📊 Local SPC Probabilities</div>
                    <div class="hazard-box">
                        <span>Tornado</span>
                        <div class="prob-bar-container"><div class="prob-fill" style="width:${sev.tornado * 5}%; background:var(--risk-high)"></div></div>
                        <span style="width:35px; text-align:right">${sev.tornado}%</span>
                    </div>
                    <div class="hazard-box">
                        <span>Severe Wind</span>
                        <div class="prob-bar-container"><div class="prob-fill" style="width:${sev.wind}%; background:var(--risk-enhanced)"></div></div>
                        <span style="width:35px; text-align:right">${sev.wind}%</span>
                    </div>
                    <div class="hazard-box">
                        <span>Large Hail</span>
                        <div class="prob-bar-container"><div class="prob-fill" style="width:${sev.hail * 2}%; background:var(--risk-slight)"></div></div>
                        <span style="width:35px; text-align:right">${sev.hail}%</span>
                    </div>
                </div>
            `;
        } else if (tab === 'current') {
            const now = weather.hourly[0];
            view.innerHTML = `
                <section class="hero fade-in">
                    <div class="hero-cond">${now.shortForecast}</div>
                    <div class="hero-row">
                        <span class="hero-temp">${now.temperature}</span>
                        <img src="icons/clear_day.png" class="hero-icon">
                    </div>
                    <div style="color:var(--text-dim)">High ${weather.daily[0].temperature}° · Low ${weather.daily[1].temperature}°</div>
                </section>
                <div class="card fade-in"><div class="card-head">✨ Weather Insight</div><div class="card-body">${weather.daily[0].detailedForecast}</div></div>`;
        }
        // ... rest of tabs (hourly, weekly, saved, radar) ...
    }

    // Standard Listeners
    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); render(e.target.dataset.tab);
    });

    update(curLat, curLon, "Chicago");
});