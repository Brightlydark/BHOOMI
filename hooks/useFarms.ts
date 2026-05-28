// hooks/useFarms.ts
import { useState, useEffect, useCallback } from 'react';
import { Farm, Coordinates } from '../types/farm';
import { fetchNearbyFarms } from '../services/farmService';
import { useFarmStore } from '../store/farmStore';

interface UseFarmsReturn {
  farms: Farm[];
  loading: boolean;
  error: string | null;
  selectedFarm: Farm | null;
  refreshFarms: () => Promise<void>;
  searchFarms: (query: string) => void;
  selectFarm: (farm: Farm | null) => void;
  addFarm: (farm: Farm) => void;
}

export const useFarms = (userLocation: Coordinates | null): UseFarmsReturn => {
  const { farms, selectedFarm, setFarms, selectFarm, addFarm } = useFarmStore();
  const [displayedFarms, setDisplayedFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lat = userLocation?.latitude ?? null;
  const lon = userLocation?.longitude ?? null;

  const loadFarms = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchNearbyFarms(userLocation);
      setFarms(result);          // merges with userFarms inside store
      setDisplayedFarms(useFarmStore.getState().farms);
    } catch (err) {
      setError('Failed to load farms');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, setFarms]);

  // Keep displayedFarms in sync when store changes (e.g. after addFarm)
  useEffect(() => {
    setDisplayedFarms(farms);
  }, [farms]);

  const searchFarms = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setDisplayedFarms(farms);
        return;
      }
      const lower = query.toLowerCase();
      const filtered = farms.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.address.toLowerCase().includes(lower) ||
          f.cropType?.toLowerCase().includes(lower)
      );
      setDisplayedFarms(filtered);
    },
    [farms]
  );

  const refreshFarms = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNearbyFarms(userLocation, false);
      setFarms(result);
      setDisplayedFarms(useFarmStore.getState().farms);
    } catch (err) {
      setError('Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [userLocation, setFarms]);

  useEffect(() => {
    if (lat !== null && lon !== null) {
      loadFarms();
    }
  }, [lat, lon, loadFarms]);

  return {
    farms: displayedFarms,
    loading,
    error,
    selectedFarm,
    refreshFarms,
    searchFarms,
    selectFarm,
    addFarm,
  };
};
