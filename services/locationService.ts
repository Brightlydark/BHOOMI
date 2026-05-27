// services/locationService.ts
import * as Location from 'expo-location';
import { Coordinates } from '../types/farm';

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Request location permission from the user
 */
export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { granted: false, canAskAgain: false };
  }
};

/**
 * Check if location permission is already granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get current user location
 * @throws Error if permission is not granted or location cannot be retrieved
 */
export const getCurrentLocation = async (): Promise<Coordinates> => {
  try {
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

/**
 * Get cached location (last known position)
 */
export const getLastKnownLocation = async (): Promise<Coordinates | null> => {
  try {
    const location = await Location.getLastKnownPositionAsync();
    
    if (!location) {
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
};

/**
 * Watch user location changes
 * @param callback Function to call when location updates
 * @returns Subscription object that can be removed
 */
export const watchLocation = async (
  callback: (location: Coordinates) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100, // Update every 100 meters
        timeInterval: 10000, // Update every 10 seconds
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
};

/**
 * Get address from coordinates (reverse geocoding)
 */
export const getAddressFromCoordinates = async (
  coordinates: Coordinates
): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync(coordinates);
    
    if (results.length > 0) {
      const address = results[0];
      const parts = [
        address.street,
        address.city,
        address.region,
        address.postalCode,
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
  }
};

/**
 * Default location (Bengaluru, Karnataka) for fallback
 */
export const DEFAULT_LOCATION: Coordinates = {
  latitude: 12.9716,
  longitude: 77.5946,
};
