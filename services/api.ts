// services/api.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm } from '../types/farm';
import { Insight } from '../types/insight';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.smartagri.example.com';
const API_TIMEOUT = 15000; // 15 seconds
const AUTH_TOKEN_KEY = '@smart_agriculture_auth_token';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Request made but no response — expected when no backend is configured
      console.log('[api] No backend response (using mock data fallback).');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Generic API request wrapper with error handling
 */
const makeRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient[method]<ApiResponse<T>>(url, data, config);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.code,
        details: error.response?.data,
      };
      throw apiError;
    }
    throw error;
  }
};

// ============================================================
// FARM SERVICES
// ============================================================

/**
 * Get nearby farms based on coordinates
 */
export const getNearbyFarms = async (
  latitude: number,
  longitude: number,
  radius: number = 50 // km
): Promise<Farm[]> => {
  return makeRequest<Farm[]>('get', '/farms/nearby', undefined, {
    params: { latitude, longitude, radius },
  });
};

/**
 * Get farm details by ID
 */
export const getFarmDetails = async (farmId: string): Promise<Farm> => {
  return makeRequest<Farm>('get', `/farms/${farmId}`);
};

/**
 * Search farms by name or location
 */
export const searchFarms = async (query: string): Promise<Farm[]> => {
  return makeRequest<Farm[]>('get', '/farms/search', undefined, {
    params: { q: query },
  });
};

/**
 * Add a new farm
 */
export const addFarm = async (farmData: Partial<Farm>): Promise<Farm> => {
  return makeRequest<Farm>('post', '/farms', farmData);
};

/**
 * Update farm data
 */
export const updateFarm = async (farmId: string, farmData: Partial<Farm>): Promise<Farm> => {
  return makeRequest<Farm>('put', `/farms/${farmId}`, farmData);
};

// ============================================================
// INSIGHTS SERVICES
// ============================================================

/**
 * Get insights for a specific farm
 */
export const getFarmInsights = async (farmId: string): Promise<Insight[]> => {
  return makeRequest<Insight[]>('get', `/insights/farm/${farmId}`);
};

/**
 * Get insights for a region
 */
export const getRegionalInsights = async (
  latitude: number,
  longitude: number
): Promise<Insight[]> => {
  return makeRequest<Insight[]>('get', '/insights/regional', undefined, {
    params: { latitude, longitude },
  });
};

/**
 * Get personalized recommendations
 */
export const getRecommendations = async (): Promise<Insight[]> => {
  return makeRequest<Insight[]>('get', '/insights/recommendations');
};

// ============================================================
// WEATHER SERVICES
// ============================================================

/**
 * Get current weather for location
 */
export const getWeather = async (
  latitude: number,
  longitude: number
): Promise<any> => {
  return makeRequest<any>('get', '/weather/current', undefined, {
    params: { latitude, longitude },
  });
};

/**
 * Get weather forecast
 */
export const getWeatherForecast = async (
  latitude: number,
  longitude: number,
  days: number = 7
): Promise<any> => {
  return makeRequest<any>('get', '/weather/forecast', undefined, {
    params: { latitude, longitude, days },
  });
};

// ============================================================
// USER SERVICES
// ============================================================

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<any> => {
  return makeRequest<any>('get', '/user/profile');
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData: any): Promise<any> => {
  return makeRequest<any>('put', '/user/profile', profileData);
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (preferences: any): Promise<any> => {
  return makeRequest<any>('put', '/user/preferences', preferences);
};

// ============================================================
// AUTH SERVICES
// ============================================================

/**
 * Store auth token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Get auth token
 */
export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Clear auth token (logout)
 */
export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

export default apiClient;
