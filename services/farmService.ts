// services/farmService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm } from '../types/farm';
import { Insight } from '../types/insight';
import { Coordinates } from '../types/farm';
import * as api from './api';
import { 
  generateNearbyFarms, 
  generateInsights,
  calculateDistance 
} from './mockData';

const FARMS_CACHE_KEY = '@smart_agriculture_farms_cache';
const INSIGHTS_CACHE_KEY = '@smart_agriculture_insights_cache';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Check if cached data is still valid
 */
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_EXPIRY_MS;
};

/**
 * Get farms from cache
 */
const getFarmsFromCache = async (): Promise<Farm[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(FARMS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedData<Farm[]> = JSON.parse(cached);
    
    if (isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading farms cache:', error);
    return null;
  }
};

/**
 * Save farms to cache
 */
const saveFarmsToCache = async (farms: Farm[]): Promise<void> => {
  try {
    const cacheData: CachedData<Farm[]> = {
      data: farms,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(FARMS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving farms to cache:', error);
  }
};

/**
 * Get insights from cache
 */
const getInsightsFromCache = async (): Promise<Insight[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(INSIGHTS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedData<Insight[]> = JSON.parse(cached);
    
    if (isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading insights cache:', error);
    return null;
  }
};

/**
 * Save insights to cache
 */
const saveInsightsToCache = async (insights: Insight[]): Promise<void> => {
  try {
    const cacheData: CachedData<Insight[]> = {
      data: insights,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving insights to cache:', error);
  }
};

/**
 * Fetch nearby farms with offline fallback
 */
export const fetchNearbyFarms = async (
  userLocation: Coordinates,
  useCache: boolean = true
): Promise<Farm[]> => {
  try {
    // Try cache first if enabled
    if (useCache) {
      const cachedFarms = await getFarmsFromCache();
      if (cachedFarms) {
        console.log('Using cached farms data');
        return cachedFarms.map(farm => ({
          ...farm,
          distance: calculateDistance(userLocation, farm.location),
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    }

    // Try API
    const farms = await api.getNearbyFarms(
      userLocation.latitude,
      userLocation.longitude
    );

    // Cache the result
    await saveFarmsToCache(farms);
    
    return farms;
  } catch (error) {
    // API unavailable, falling back to mock farms data
    
    // Fallback to cached data
    const cachedFarms = await getFarmsFromCache();
    if (cachedFarms) {
      console.log('Using stale cached farms data');
      return cachedFarms;
    }

    // Last resort: generate mock data
    console.log('Generating mock farms data');
    const mockFarms = generateNearbyFarms(userLocation, 15);
    await saveFarmsToCache(mockFarms);
    return mockFarms;
  }
};

/**
 * Fetch insights with offline fallback
 */
export const fetchInsights = async (
  farms: Farm[],
  region?: string,
  useCache: boolean = true
): Promise<Insight[]> => {
  try {
    // Try cache first if enabled
    if (useCache) {
      const cachedInsights = await getInsightsFromCache();
      if (cachedInsights) {
        console.log('Using cached insights data');
        return cachedInsights;
      }
    }

    // Try API
    const insights = await api.getRecommendations();

    // Cache the result
    await saveInsightsToCache(insights);
    
    return insights;
  } catch (error) {
    // API unavailable, falling back to mock insights data
    
    // Fallback to cached data
    const cachedInsights = await getInsightsFromCache();
    if (cachedInsights) {
      console.log('Using stale cached insights data');
      return cachedInsights;
    }

    // Last resort: generate mock insights
    console.log('Generating mock insights data');
    const mockInsights = generateInsights(farms, region);
    await saveInsightsToCache(mockInsights);
    return mockInsights;
  }
};

/**
 * Search farms by query
 */
export const searchFarms = async (
  query: string,
  allFarms: Farm[]
): Promise<Farm[]> => {
  try {
    // Try API first
    return await api.searchFarms(query);
  } catch (error) {
    console.log('[farmService] API search unavailable, using local filter.');
    
    // Fallback to local filtering
    const lowerQuery = query.toLowerCase();
    return allFarms.filter(farm => 
      farm.name.toLowerCase().includes(lowerQuery) ||
      farm.address.toLowerCase().includes(lowerQuery) ||
      farm.cropType?.toLowerCase().includes(lowerQuery)
    );
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([FARMS_CACHE_KEY, INSIGHTS_CACHE_KEY]);
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
