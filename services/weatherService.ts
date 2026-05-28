import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData, DailyForecast } from '../types/insight';

const CACHE_PREFIX = '@weather_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// WMO Weather interpretation codes
const getWeatherCondition = (code: number, isDay: boolean): { text: string; icon: string } => {
  if (code === 0) return { text: 'Clear sky', icon: isDay ? 'Sun' : 'Moon' };
  if (code === 1) return { text: 'Mainly clear', icon: isDay ? 'Sun' : 'Moon' };
  if (code === 2) return { text: 'Partly cloudy', icon: 'Cloud' };
  if (code === 3) return { text: 'Overcast', icon: 'Cloud' };
  if (code >= 45 && code <= 48) return { text: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: 'CloudRain' };
  if (code >= 66 && code <= 67) return { text: 'Freezing Rain', icon: 'CloudSnow' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: 'Snowflake' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: 'CloudRain' };
  if (code >= 85 && code <= 86) return { text: 'Snow Showers', icon: 'Snowflake' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: 'CloudLightning' };
  return { text: 'Unknown', icon: 'Cloud' };
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  // Round to 2 decimal places (~1.1km grid) to share cache for close locations
  const rLat = lat.toFixed(2);
  const rLon = lon.toFixed(2);
  const cacheKey = `${CACHE_PREFIX}${rLat}_${rLon}`;

  try {
    // 1. Check cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        // Hydrate dates properly
        const data = parsed.data as WeatherData;
        data.forecast = data.forecast.map(f => ({ ...f, date: new Date(f.date) }));
        return data;
      }
    }

    // 2. Fetch fresh data from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&hourly=uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // 3. Map to our format
    const condition = getWeatherCondition(data.current.weather_code, data.current.is_day === 1);
    
    // Calculate daily forecasts
    const forecast: DailyForecast[] = [];
    for (let i = 0; i < 7; i++) {
      if (!data.daily.time[i]) break;
      const dailyCond = getWeatherCondition(data.daily.weather_code[i], true);
      forecast.push({
        date: new Date(data.daily.time[i]),
        minTemp: data.daily.temperature_2m_min[i],
        maxTemp: data.daily.temperature_2m_max[i],
        rainfall: data.daily.precipitation_probability_max[i], // We use probability % here for UI
        condition: dailyCond.text,
      });
    }

    // Current UV (take max from today's hourly if available, or just first hour)
    // We can just grab current hour's UV roughly, or daily max
    // Let's use hourly data and find the current hour, or just fallback to 0
    let currentUv = 0;
    if (data.hourly && data.hourly.uv_index && data.hourly.uv_index.length > 0) {
      // Find current hour index
      const now = new Date();
      const currentIso = now.toISOString().slice(0, 13) + ':00'; // YYYY-MM-DDTHH:00
      const index = data.hourly.time.findIndex((t: string) => t.startsWith(currentIso));
      currentUv = index >= 0 ? data.hourly.uv_index[index] : data.hourly.uv_index[0];
    }

    const weatherData: WeatherData = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      rainfall: data.current.precipitation, // actual mm
      windSpeed: data.current.wind_speed_10m,
      condition: condition.text,
      icon: condition.icon,
      uvIndex: currentUv,
      forecast
    };

    // 4. Save to cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: weatherData
    }));

    return weatherData;

  } catch (error) {
    console.error('Failed to fetch weather:', error);
    throw error;
  }
};
