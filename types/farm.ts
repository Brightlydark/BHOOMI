// types/farm.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type CropHealthStatus = 'good' | 'moderate' | 'poor';

export interface Farm {
  id: string;
  name: string;
  location: Coordinates;
  address: string;
  soilMoisture: number; // Percentage 0-100
  temperature: number; // Celsius
  humidity: number; // Percentage 0-100
  cropHealth: CropHealthStatus;
  cropType?: string;
  lastUpdated: Date;
  distance?: number; // Distance from user in km
}

export interface FarmDetails extends Farm {
  owner: string;
  size: number; // Hectares
  irrigationType: 'drip' | 'sprinkler' | 'flood' | 'none';
  soilType: string;
  waterSource: string;
}
