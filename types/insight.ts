// types/insight.ts

export type InsightType = 
  | 'soil_analysis'
  | 'weather_forecast'
  | 'irrigation_recommendation'
  | 'fertilizer_recommendation'
  | 'pest_control'
  | 'crop_suggestion';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  severity: Severity;
  createdAt: Date;
  farmId?: string;
  region?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  date: Date;
  minTemp: number;
  maxTemp: number;
  rainfall: number;
  condition: string; // 'sunny', 'cloudy', 'rainy', etc.
}

export interface SoilAnalysis {
  moisture: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  recommendations: string[];
}

export interface CropSuggestion {
  cropName: string;
  suitability: number; // 0-100
  expectedYield: string;
  growingPeriod: string;
  waterRequirement: 'low' | 'medium' | 'high';
  fertilizers: string[];
}
