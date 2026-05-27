// hooks/useFarms.ts
import { useState, useEffect, useCallback } from 'react';
import { Farm, Coordinates } from '../types/farm';
import { fetchNearbyFarms, searchFarms as searchFarmsService } from '../services/farmService';
import { useFarmStore } from '../store/farmStore';

interface UseFarmsReturn {
  farms: Farm[];
  loading: boolean;
  error: string | null;
  selectedFarm: Farm | null;
  refreshFarms: () => Promise<void>;
  searchFarms: (query: string) => void;
  selectFarm: (farm: Farm | null) => void;
}

export const useFarms = (userLocation: Coordinates | null): UseFarmsReturn => {
  const { farms, selectedFarm, setFarms, selectFarm } = useFarmStore();
  const [displayedFarms, setDisplayedFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch farms from service (API → cache → mock)
   */
  const loadFarms = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchNearbyFarms(userLocation);
      setFarms(result);
      setDisplayedFarms(result);
    } catch (err) {
      setError('Failed to load farms');
    } finally {
      setLoading(false);
    }
  }, [userLocation, setFarms]);

  /**
   * Filter farms locally by search query
   */
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

  /**
   * Force refresh (bypass cache)
   */
  const refreshFarms = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNearbyFarms(userLocation, false); // skip cache
      setFarms(result);
      setDisplayedFarms(result);
    } catch (err) {
      setError('Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [userLocation, setFarms]);

  // Load farms when user location is available
  useEffect(() => {
    if (userLocation) {
      loadFarms();
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  return {
    farms: displayedFarms,
    loading,
    error,
    selectedFarm,
    refreshFarms,
    searchFarms,
    selectFarm,
  };
};
