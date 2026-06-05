const WeatherEngine = {
    getIcon: (code, isDay = 1) => {
        const r = "./icons/";
        const map = {
            0: isDay ? "clear_day.png" : "clear_night.png",
            1: isDay ? "mostly_clear_day.png" : "mostly_clear_night.png",
            2: isDay ? "partly_cloudy_day.png" : "partly_cloudy_night.png",
            3: "cloudy.png",
            45: "haze_fog_dust_smoke.png", 48: "haze_fog_dust_smoke.png",
            51: "drizzle.png", 53: "drizzle.png", 55: "drizzle.png",
            56: "icy.png", 57: "icy.png",
            61: "sunny_with_rain.png", 63: "cloudy_with_rain.png", 65: "heavy_rain.png",
            66: "mixed_rain_snow.png", 67: "mixed_rain_hail_sleet.png",
            71: "sunny_with_snow.png", 73: "cloudy_with_snow.png", 75: "heavy_snow.png",
            77: "flurries.png",
            80: isDay ? "scattered_showers_day.png" : "scattered_showers_night.png",
            81: "showers_rain.png", 82: "heavy_rain.png",
            85: isDay ? "scattered_snow_showers_day.png" : "scattered_snow_showers_night.png",
            86: "showers_snow.png",
            95: "isolated_thunderstorms.png",
            96: "strong_thunderstorms.png", 99: "strong_thunderstorms.png"
        };
        return r + (map[code] || "cloudy.png");
    },

    getDesc: (code) => {
        const desc = {
            0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Cloudy",
            45: "Foggy", 51: "Drizzle", 61: "Rainy", 71: "Snowy", 80: "Showers", 95: "Stormy"
        };
        return desc[code] || "Overcast";
    }
};