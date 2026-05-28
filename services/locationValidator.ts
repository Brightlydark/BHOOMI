// services/locationValidator.ts

export type ValidationStatus = 'farmland' | 'urban' | 'water' | 'unknown';

export interface LocationValidationResult {
  isValid: boolean;
  type: ValidationStatus;
  message: string;
}

/**
 * A lightweight deterministic heuristic algorithm that simulates
 * real-world land-use mapping without requiring heavy API calls.
 */
function hashCoordinates(lat: number, lon: number): number {
  // Scale by 1000 gives roughly 111m grid precision
  const scaledLat = Math.round(lat * 1000);
  const scaledLon = Math.round(lon * 1000);
  const seed = (scaledLat * 31337) ^ (scaledLon * 31337);
  return Math.abs(Math.sin(seed) * 10000);
}

/**
 * Calculates distance in km between two coordinates
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Major urban centers in the demo region (Bengaluru area)
const URBAN_CENTERS = [
  { lat: 12.9716, lon: 77.5946, radiusKm: 18, name: 'Bengaluru City Center' }, // Dense core
  { lat: 12.8399, lon: 77.6770, radiusKm: 8, name: 'Electronic City / South' }, // Tech park
  { lat: 13.0068, lon: 77.5813, radiusKm: 10, name: 'Malleswaram / North Core' },
  { lat: 12.9718, lon: 77.7500, radiusKm: 10, name: 'Whitefield' },
  { lat: 13.1986, lon: 77.7065, radiusKm: 4, name: 'Airport Area' },
];

export function validateLocationSync(
  latitude: number,
  longitude: number
): LocationValidationResult {
  // 1. Strict Urban Center Check
  for (const center of URBAN_CENTERS) {
    const dist = getDistanceKm(latitude, longitude, center.lat, center.lon);
    if (dist < center.radiusKm) {
      return {
        isValid: false,
        type: 'urban',
        message: 'Urban region detected — unsuitable for farming.',
      };
    }
  }

  // 2. Highway / Road proximity simulation using deterministic grid lines
  // Every ~0.05 degrees (approx 5.5km) there's a simulated major road
  const latMod = Math.abs(latitude % 0.05);
  const lonMod = Math.abs(longitude % 0.05);
  if (latMod < 0.002 || lonMod < 0.002) {
    return {
      isValid: false,
      type: 'urban',
      message: 'Highway or major road intersection detected.',
    };
  }

  // 3. Micro-variations for water bodies / local unsuitable patches
  const val = hashCoordinates(latitude, longitude);
  const mod = val % 100;
  
  if (mod > 92) {
    return {
      isValid: false,
      type: 'water',
      message: 'Water body or unsuitable terrain detected.',
    };
  } else if (mod > 85) {
    return {
      isValid: false,
      type: 'urban',
      message: 'Commercial or dense building cluster detected.',
    };
  }

  // Valid agricultural land
  return {
    isValid: true,
    type: 'farmland',
    message: 'Suitable agricultural land detected.',
  };
}

export async function validateFarmLocation(
  latitude: number,
  longitude: number
): Promise<LocationValidationResult> {
  // Simulate a slight network delay for realism (100-300ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  return validateLocationSync(latitude, longitude);
}
