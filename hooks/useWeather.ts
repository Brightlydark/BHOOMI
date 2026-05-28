import { useState, useEffect } from 'react';
import { WeatherData } from '../types/insight';
import { fetchWeather } from '../services/weatherService';

export function useWeather(lat: number | undefined, lon: number | undefined) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      if (lat === undefined || lon === undefined) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchWeather(lat, lon);
        if (isMounted) {
          setWeather(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load weather'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [lat, lon]);

  return { weather, loading, error, refetch: () => fetchWeather(lat!, lon!) };
}
