// hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import { Coordinates } from '../types/farm';
import {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation,
  getLastKnownLocation,
  DEFAULT_LOCATION,
} from '../services/locationService';

interface UseLocationReturn {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  /**
   * Initialize: check permission and get location
   */
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permitted = await checkLocationPermission();
      setHasPermission(permitted);

      if (permitted) {
        // Try current location first, fall back to last known
        try {
          const coords = await getCurrentLocation();
          setLocation(coords);
        } catch {
          const lastKnown = await getLastKnownLocation();
          if (lastKnown) {
            setLocation(lastKnown);
          } else {
            // Use Bengaluru as ultimate fallback
            setLocation(DEFAULT_LOCATION);
          }
        }
      } else {
        // No permission yet — use default so map still renders
        setLocation(DEFAULT_LOCATION);
      }
    } catch (err) {
      setError('Unable to get location');
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request location permission from user
   */
  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      const { granted } = await requestLocationPermission();
      setHasPermission(granted);
      if (granted) {
        const coords = await getCurrentLocation();
        setLocation(coords);
      }
    } catch (err) {
      setError('Permission denied');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually refresh location
   */
  const refreshLocation = useCallback(async () => {
    if (!hasPermission) return;
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      setError(null);
    } catch (err) {
      setError('Could not refresh location');
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { location, loading, error, hasPermission, requestPermission, refreshLocation };
};
