// services/analyticsService.ts
// ─── BHOOMI Agricultural Intelligence Engine v2 ─────────────────────────────
// Multi-factor decision engine: soil type, crop type, weather, moisture,
// temperature, UV, drainage, and risk analysis.
// ─────────────────────────────────────────────────────────────────────────────

import { Farm } from '../types/farm';
import { WeatherData } from '../types/insight';
import { TFunction } from 'i18next';
import { useDevStore } from '../store/devStore';

// ─── Chart types ─────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  value: number;
  label: string;
  frontColor?: string;
  dataPointText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — SOIL & CROP KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────

/** Normalised soil type key */
type SoilKey = 'clay' | 'sandy' | 'loam' | 'silt' | 'black' | 'red' | 'default';

/** Intrinsic characteristics for each soil type */
interface SoilProfile {
  retentionFactor: number;  // 0–1  (1 = very high retention)
  drainageFactor: number;   // 0–1  (1 = very fast drainage)
  waterloggingRisk: number; // 0–1  (1 = very high risk)
  label: string;
}

const SOIL_PROFILES: Record<SoilKey, SoilProfile> = {
  clay:    { retentionFactor: 0.90, drainageFactor: 0.15, waterloggingRisk: 0.85, label: 'Clay' },
  black:   { retentionFactor: 0.85, drainageFactor: 0.20, waterloggingRisk: 0.80, label: 'Black Cotton' },
  silt:    { retentionFactor: 0.75, drainageFactor: 0.30, waterloggingRisk: 0.65, label: 'Silt' },
  loam:    { retentionFactor: 0.55, drainageFactor: 0.50, waterloggingRisk: 0.35, label: 'Loam' },
  red:     { retentionFactor: 0.40, drainageFactor: 0.65, waterloggingRisk: 0.25, label: 'Red Laterite' },
  sandy:   { retentionFactor: 0.20, drainageFactor: 0.90, waterloggingRisk: 0.10, label: 'Sandy' },
  default: { retentionFactor: 0.55, drainageFactor: 0.50, waterloggingRisk: 0.35, label: 'Unknown' },
};

/** Normalised crop type key */
type CropKey =
  | 'rice' | 'wheat' | 'sugarcane' | 'cotton' | 'tomato'
  | 'millets' | 'maize' | 'vegetables' | 'default';

/** Agronomic characteristics per crop */
interface CropProfile {
  waterNeed: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  /** Optimal soil moisture range [min, max] */
  moistureOptimal: [number, number];
  /** Critical lower threshold — below triggers urgent alert */
  moistureCritical: number;
  /** Critical upper threshold — above triggers waterlogging warning */
  moistureMax: number;
  /** Temperature above which heat stress begins */
  heatStressTemp: number;
  /** Temperature above which damage is severe */
  heatCriticalTemp: number;
  /** Relative drought tolerance 0–1 */
  droughtTolerance: number;
  /** Relative overwatering sensitivity 0–1 */
  overwaterSensitivity: number;
  label: string;
}

const CROP_PROFILES: Record<CropKey, CropProfile> = {
  rice: {
    waterNeed: 'very_high',
    moistureOptimal: [70, 95],
    moistureCritical: 55,
    moistureMax: 100,
    heatStressTemp: 35,
    heatCriticalTemp: 40,
    droughtTolerance: 0.15,
    overwaterSensitivity: 0.05,
    label: 'Rice',
  },
  sugarcane: {
    waterNeed: 'high',
    moistureOptimal: [65, 85],
    moistureCritical: 45,
    moistureMax: 92,
    heatStressTemp: 38,
    heatCriticalTemp: 42,
    droughtTolerance: 0.30,
    overwaterSensitivity: 0.20,
    label: 'Sugarcane',
  },
  wheat: {
    waterNeed: 'medium',
    moistureOptimal: [50, 75],
    moistureCritical: 35,
    moistureMax: 85,
    heatStressTemp: 30,
    heatCriticalTemp: 35,
    droughtTolerance: 0.45,
    overwaterSensitivity: 0.40,
    label: 'Wheat',
  },
  maize: {
    waterNeed: 'medium',
    moistureOptimal: [50, 75],
    moistureCritical: 35,
    moistureMax: 80,
    heatStressTemp: 32,
    heatCriticalTemp: 38,
    droughtTolerance: 0.40,
    overwaterSensitivity: 0.35,
    label: 'Maize',
  },
  vegetables: {
    waterNeed: 'medium',
    moistureOptimal: [55, 75],
    moistureCritical: 40,
    moistureMax: 85,
    heatStressTemp: 33,
    heatCriticalTemp: 38,
    droughtTolerance: 0.30,
    overwaterSensitivity: 0.55,
    label: 'Vegetables',
  },
  tomato: {
    waterNeed: 'medium',
    moistureOptimal: [55, 75],
    moistureCritical: 40,
    moistureMax: 80,
    heatStressTemp: 30,
    heatCriticalTemp: 35,
    droughtTolerance: 0.30,
    overwaterSensitivity: 0.75,
    label: 'Tomato',
  },
  cotton: {
    waterNeed: 'low',
    moistureOptimal: [40, 65],
    moistureCritical: 25,
    moistureMax: 75,
    heatStressTemp: 38,
    heatCriticalTemp: 44,
    droughtTolerance: 0.75,
    overwaterSensitivity: 0.65,
    label: 'Cotton',
  },
  millets: {
    waterNeed: 'very_low',
    moistureOptimal: [30, 60],
    moistureCritical: 20,
    moistureMax: 70,
    heatStressTemp: 40,
    heatCriticalTemp: 45,
    droughtTolerance: 0.90,
    overwaterSensitivity: 0.70,
    label: 'Millets',
  },
  default: {
    waterNeed: 'medium',
    moistureOptimal: [50, 75],
    moistureCritical: 35,
    moistureMax: 85,
    heatStressTemp: 33,
    heatCriticalTemp: 38,
    droughtTolerance: 0.45,
    overwaterSensitivity: 0.40,
    label: 'General Crop',
  },
};

/** Resolve a soil profile from a free-text soil type string */
const getSoilProfile = (soilType?: string): SoilProfile => {
  if (!soilType) return SOIL_PROFILES.default;
  const s = soilType.toLowerCase();
  if (s.includes('clay'))   return SOIL_PROFILES.clay;
  if (s.includes('black'))  return SOIL_PROFILES.black;
  if (s.includes('silt'))   return SOIL_PROFILES.silt;
  if (s.includes('loam'))   return SOIL_PROFILES.loam;
  if (s.includes('red') || s.includes('later')) return SOIL_PROFILES.red;
  if (s.includes('sand'))   return SOIL_PROFILES.sandy;
  return SOIL_PROFILES.default;
};

/** Resolve a crop profile from a free-text crop type string */
const getCropProfile = (cropType?: string): CropProfile => {
  if (!cropType) return CROP_PROFILES.default;
  const c = cropType.toLowerCase();
  if (c.includes('rice') || c.includes('paddy')) return CROP_PROFILES.rice;
  if (c.includes('sugarcane') || c.includes('sugar cane')) return CROP_PROFILES.sugarcane;
  if (c.includes('wheat')) return CROP_PROFILES.wheat;
  if (c.includes('maize') || c.includes('corn')) return CROP_PROFILES.maize;
  if (c.includes('tomato')) return CROP_PROFILES.tomato;
  if (c.includes('cotton')) return CROP_PROFILES.cotton;
  if (c.includes('millet') || c.includes('jowar') || c.includes('bajra') || c.includes('ragi')) return CROP_PROFILES.millets;
  if (c.includes('vegetable') || c.includes('veg')) return CROP_PROFILES.vegetables;
  return CROP_PROFILES.default;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — RISK ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export type AgriRiskType =
  | 'drought'
  | 'waterlogging'
  | 'fungal'
  | 'heat_stress'
  | 'rapid_dehydration'
  | 'pest'
  | 'optimal';

export interface AgriRisk {
  type: AgriRiskType;
  level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  score: number; // 0–100
}

interface FarmContext {
  farm: Farm;
  crop: CropProfile;
  soil: SoilProfile;
  weather?: WeatherData | null;
  /** Rainfall probability in next 24 h (0–100) */
  rainProbability24h: number;
  /** Max temperature in next 24 h */
  maxTempForecast: number;
}

/** Build a full farm context from raw data */
const buildContext = (farm: Farm, weather?: WeatherData | null): FarmContext => {
  const devState = useDevStore.getState();
  const isOverridden = devState.overrideEnabled && __DEV__;

  // Use overrides if enabled, else use real data
  const cropTypeStr = isOverridden ? devState.mockCropType : farm.cropType;
  // Check if name has a known field mapping, else fallback to default
  const getMappedSoil = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('field 1')) return 'clay';
    if (lower.includes('field 2')) return 'sandy';
    if (lower.includes('field 3')) return 'loam';
    if (lower.includes('field 4')) return 'clay';
    return undefined;
  };
  const soilTypeStr = isOverridden ? devState.mockSoilType : ((farm as any).soilType || getMappedSoil(farm.name));
  const moistureValue = isOverridden ? devState.mockMoisture : farm.soilMoisture;
  const tempValue = isOverridden ? devState.mockTemp : farm.temperature;
  
  const crop = getCropProfile(cropTypeStr);
  const soil = getSoilProfile(soilTypeStr);
  
  const rainProbability24h = isOverridden 
    ? devState.mockRainfall 
    : (weather?.forecast?.[0]?.rainfall ?? (weather?.rainfall ? Math.min(100, weather.rainfall * 10) : 0));
    
  const maxTempForecast = isOverridden
    ? devState.mockTemp
    : (weather?.forecast?.[0]?.maxTemp ?? weather?.temperature ?? tempValue);

  // Reconstruct farm object if mocked
  const activeFarm = isOverridden ? {
    ...farm,
    soilMoisture: moistureValue,
    temperature: tempValue,
  } : farm;

  // Intercept weather if mocked
  const activeWeather = isOverridden && weather ? {
    ...weather,
    humidity: devState.mockHumidity,
    uvIndex: devState.mockUv,
    temperature: devState.mockTemp,
  } : weather;

  return { farm: activeFarm, crop, soil, weather: activeWeather, rainProbability24h, maxTempForecast };
};

/** Evaluate individual risks for a farm */
const evaluateRisks = (ctx: FarmContext): AgriRisk[] => {
  const { farm, crop, soil, weather, rainProbability24h, maxTempForecast } = ctx;
  const risks: AgriRisk[] = [];

  // ── Drought / dehydration risk ───────────────────────────────────────────
  const moistureDeficit = crop.moistureCritical - farm.soilMoisture;
  const dryingRate = soil.drainageFactor; // clay dries slowly, sandy dries fast
  if (farm.soilMoisture < crop.moistureCritical) {
    const score = Math.min(100, (moistureDeficit / crop.moistureCritical) * 100 * (1 + dryingRate * 0.5));
    risks.push({
      type: soil.drainageFactor > 0.6 ? 'rapid_dehydration' : 'drought',
      level: score > 70 ? 'critical' : score > 45 ? 'high' : 'moderate',
      score: Math.round(score),
    });
  } else if (farm.soilMoisture < crop.moistureOptimal[0] && soil.drainageFactor > 0.6) {
    risks.push({ type: 'rapid_dehydration', level: 'low', score: 25 });
  }

  // ── Waterlogging risk ────────────────────────────────────────────────────
  const excessMoisture = farm.soilMoisture - crop.moistureMax;
  const waterlogFactor = soil.waterloggingRisk * crop.overwaterSensitivity;
  const rainAdder = rainProbability24h > 50 ? (rainProbability24h - 50) * 0.4 : 0;
  if (farm.soilMoisture > crop.moistureMax || (farm.soilMoisture > crop.moistureOptimal[1] && rainProbability24h > 60)) {
    const score = Math.min(100, (Math.max(0, excessMoisture) + rainAdder) * waterlogFactor * 2 + 30);
    risks.push({
      type: 'waterlogging',
      level: score > 70 ? 'critical' : score > 45 ? 'high' : 'moderate',
      score: Math.round(score),
    });
  } else if (farm.soilMoisture > crop.moistureOptimal[0] && soil.waterloggingRisk > 0.7 && rainProbability24h > 60) {
    risks.push({ type: 'waterlogging', level: 'low', score: 20 });
  }

  // ── Heat stress risk ─────────────────────────────────────────────────────
  const heatDelta = maxTempForecast - crop.heatStressTemp;
  if (heatDelta > 0) {
    const critDelta = crop.heatCriticalTemp - crop.heatStressTemp;
    const score = Math.min(100, (heatDelta / Math.max(critDelta, 1)) * 100);
    risks.push({
      type: 'heat_stress',
      level: score > 70 ? 'critical' : score > 40 ? 'high' : 'moderate',
      score: Math.round(score),
    });
  }

  // ── Fungal risk ──────────────────────────────────────────────────────────
  const humidity = weather?.humidity ?? farm.humidity;
  if (humidity > 80 && farm.soilMoisture > crop.moistureOptimal[0]) {
    const score = Math.min(100, ((humidity - 80) * 3) + (farm.soilMoisture - crop.moistureOptimal[0]) * 0.5);
    risks.push({
      type: 'fungal',
      level: score > 60 ? 'high' : 'moderate',
      score: Math.round(score),
    });
  }

  // ── Pest / disease risk ──────────────────────────────────────────────────
  if (farm.cropHealth === 'poor') {
    risks.push({ type: 'pest', level: 'high', score: 75 });
  } else if (farm.cropHealth === 'moderate') {
    risks.push({ type: 'pest', level: 'moderate', score: 45 });
  }

  if (risks.length === 0) {
    risks.push({ type: 'optimal', level: 'none', score: 0 });
  }

  return risks.sort((a, b) => b.score - a.score);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — IRRIGATION DECISION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

type IrrigationDecision =
  | 'irrigate_urgent'
  | 'irrigate_scheduled'
  | 'delay_rain'
  | 'reduce_frequency'
  | 'halt_waterlogging'
  | 'maintain_current';

interface IrrigationRecommendation {
  decision: IrrigationDecision;
  urgencyHours: number | null;  // null = not urgent
  reason: string;
  detail: string;
}

const buildIrrigationRecommendation = (ctx: FarmContext): IrrigationRecommendation => {
  const { farm, crop, soil, rainProbability24h, maxTempForecast } = ctx;
  const { soilMoisture, cropType } = farm;
  const cropLabel = crop.label;
  const soilLabel = soil.label;

  // 1. Rain incoming + clay/silt + moisture already high → delay
  if (
    rainProbability24h > 60 &&
    soil.retentionFactor > 0.7 &&
    soilMoisture >= crop.moistureOptimal[0]
  ) {
    return {
      decision: 'delay_rain',
      urgencyHours: null,
      reason: `${cropLabel} on ${soilLabel} soil with ${Math.round(rainProbability24h)}% rain expected`,
      detail: `${soilLabel} soil retains moisture efficiently and rain is expected within 18–24 hours. Irrigating now risks waterlogging. Skip irrigation until after rainfall and re-evaluate soil saturation.`,
    };
  }

  // 2. Waterlogging risk → halt
  if (soilMoisture > crop.moistureMax) {
    return {
      decision: 'halt_waterlogging',
      urgencyHours: null,
      reason: `${cropLabel} soil moisture at ${soilMoisture}% exceeds safe maximum (${crop.moistureMax}%)`,
      detail: `Excess moisture on ${soilLabel} soil is causing poor root aeration. Halt all irrigation immediately. Improve drainage if possible and wait for natural evaporation to reduce saturation.`,
    };
  }

  // 3. Reduce frequency — slightly above optimum + high retention soil
  if (soilMoisture > crop.moistureOptimal[1] && soil.retentionFactor > 0.6) {
    return {
      decision: 'reduce_frequency',
      urgencyHours: null,
      reason: `${cropLabel} moisture at ${soilMoisture}% is above optimal (${crop.moistureOptimal[1]}%) on high-retention ${soilLabel} soil`,
      detail: `${soilLabel} soil is holding adequate moisture. Reduce irrigation frequency by 30–40% to prevent root saturation. Monitor moisture every 48 hours.`,
    };
  }

  // 4. Critical deficit on sandy soil + heat → irrigate urgently
  if (
    soilMoisture < crop.moistureCritical &&
    soil.drainageFactor > 0.6 &&
    maxTempForecast > crop.heatStressTemp
  ) {
    const hrs = soil.drainageFactor > 0.8 ? 4 : 8;
    return {
      decision: 'irrigate_urgent',
      urgencyHours: hrs,
      reason: `${cropLabel} on ${soilLabel} soil at ${soilMoisture}% moisture with ${Math.round(maxTempForecast)}°C heat`,
      detail: `${soilLabel} soil drains rapidly and ${cropLabel} is highly sensitive at these temperatures. Soil moisture is critically low at ${soilMoisture}%. Irrigate within ${hrs} hours using drip or micro-sprinkler to minimise evaporation loss.`,
    };
  }

  // 5. Deficit below critical threshold → irrigate now
  if (soilMoisture < crop.moistureCritical) {
    return {
      decision: 'irrigate_urgent',
      urgencyHours: 12,
      reason: `${cropLabel} moisture at ${soilMoisture}% is below critical threshold (${crop.moistureCritical}%)`,
      detail: `Moisture has dropped below the critical survival threshold for ${cropLabel}. Irrigate within 12 hours. Prefer early morning application to reduce evaporation. Check for root damage if soil has been dry for more than 2 days.`,
    };
  }

  // 6. Below optimum — scheduled irrigation needed
  if (soilMoisture < crop.moistureOptimal[0]) {
    const urgencyHours = soil.drainageFactor > 0.7 ? 18 : 30;
    return {
      decision: 'irrigate_scheduled',
      urgencyHours,
      reason: `${cropLabel} moisture at ${soilMoisture}% is below optimum range (${crop.moistureOptimal[0]}–${crop.moistureOptimal[1]}%)`,
      detail: `${cropLabel} is approaching sub-optimal moisture on ${soilLabel} soil. Schedule next irrigation within ${urgencyHours} hours. ${soil.drainageFactor > 0.7 ? `${soilLabel} soil drains quickly — consider shorter, more frequent irrigation cycles.` : 'Soil moisture should recover well with a single application.'}`,
    };
  }

  // 7. Rain + moderate moisture → maintain
  if (rainProbability24h > 40) {
    return {
      decision: 'maintain_current',
      urgencyHours: null,
      reason: `${cropLabel} at optimal moisture (${soilMoisture}%) with ${Math.round(rainProbability24h)}% rainfall probability`,
      detail: `Current moisture is within the optimal range for ${cropLabel}. With rain expected, maintain current irrigation schedule and re-assess after rainfall.`,
    };
  }

  // 8. Default — conditions balanced
  return {
    decision: 'maintain_current',
    urgencyHours: null,
    reason: `${cropLabel} moisture at ${soilMoisture}% is within optimal range (${crop.moistureOptimal[0]}–${crop.moistureOptimal[1]}%)`,
    detail: `Soil moisture levels are well-balanced for ${cropLabel} on ${soilLabel} soil. Continue current irrigation schedule. Next evaluation recommended in 24–48 hours.`,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — AI PREDICTION (replaces old generateAIPrediction)
// ─────────────────────────────────────────────────────────────────────────────

export interface AIPrediction {
  text: string;
  confidence: number;
  type: 'moisture' | 'disease' | 'irrigation' | 'stress' | 'weather' | 'drainage' | 'pest' | 'fungal';
  level: 'info' | 'warning' | 'critical';
  reason?: string;
}

export const generateAIPrediction = (
  farm: Farm | null,
  weather?: WeatherData | null,
  t?: TFunction
): AIPrediction => {
  // Global (no farm selected) mode
  if (!farm) {
    if (weather) {
      const humidity = weather.humidity;
      const uv = weather.uvIndex ?? 0;
      const rainProb = weather.forecast?.[0]?.rainfall ?? 0;

      if (rainProb > 70) {
        return {
          text: `Heavy rainfall expected (${Math.round(rainProb)}% probability). Pause scheduled irrigation across all farms and check drainage in clay or black soil fields to prevent waterlogging.`,
          confidence: 94, type: 'weather', level: 'warning',
          reason: 'High precipitation probability from weather forecast',
        };
      }
      if (uv >= 9) {
        return {
          text: `Extreme UV index (${uv}). High evapotranspiration risk for all crops today. Prioritise early morning or evening irrigation to reduce moisture loss.`,
          confidence: 89, type: 'stress', level: 'warning',
          reason: 'UV index exceeds 9 — severe evapotranspiration expected',
        };
      }
      if (humidity > 88) {
        return {
          text: `Humidity at ${humidity}% creates high fungal disease risk for all farms. Inspect leaves for early blight, powdery mildew, or rust. Avoid overhead irrigation until humidity drops.`,
          confidence: 83, type: 'fungal', level: 'warning',
          reason: 'Persistent high humidity promotes fungal spore germination',
        };
      }
      return {
        text: `Weather conditions are stable (${weather.condition}, ${weather.temperature}°C). Monitor soil moisture across your farms and maintain standard irrigation schedules.`,
        confidence: 91, type: 'weather', level: 'info',
        reason: 'No significant weather stressors detected',
      };
    }
    return {
      text: 'All farm metrics appear stable. Add farms on the Map to receive personalised AI insights and irrigation recommendations.',
      confidence: 88, type: 'weather', level: 'info',
      reason: 'No farm or weather data available',
    };
  }

  // Farm-specific mode
  const ctx = buildContext(farm, weather);
  const { crop, soil, rainProbability24h, maxTempForecast } = ctx;
  const risks = evaluateRisks(ctx);
  const topRisk = risks[0];
  const irrigation = buildIrrigationRecommendation(ctx);

  // Priority 1 — critical waterlogging
  if (topRisk.type === 'waterlogging' && topRisk.level === 'critical') {
    return {
      text: `Waterlogging alert on ${farm.name}. ${crop.label} on ${soil.label} soil at ${ctx.farm.soilMoisture}% moisture — far above the safe maximum. Halt all irrigation and improve field drainage immediately to prevent root rot.`,
      confidence: 96, type: 'drainage', level: 'critical',
      reason: irrigation.reason,
    };
  }

  // Priority 2 — urgent drought / rapid dehydration
  if ((topRisk.type === 'drought' || topRisk.type === 'rapid_dehydration') && topRisk.level === 'critical') {
    const hrs = irrigation.urgencyHours ?? 12;
    return {
      text: `Critical moisture deficit on ${farm.name}. ${crop.label} requires immediate irrigation within ${hrs} hours. ${soil.drainageFactor > 0.7 ? `${soil.label} soil drains rapidly, compounding the water stress.` : ''} ${irrigation.detail}`,
      confidence: 95, type: 'irrigation', level: 'critical',
      reason: irrigation.reason,
    };
  }

  // Priority 3 — urgent irrigation (scheduled)
  if (irrigation.decision === 'irrigate_urgent') {
    return {
      text: irrigation.detail,
      confidence: 90, type: 'irrigation', level: 'critical',
      reason: irrigation.reason,
    };
  }

  // Priority 4 — heat stress
  if (topRisk.type === 'heat_stress' && topRisk.level === 'high') {
    return {
      text: `Heat stress risk for ${crop.label} on ${farm.name}. Forecast high of ${Math.round(maxTempForecast)}°C exceeds the stress threshold of ${crop.heatStressTemp}°C. Apply mulching to retain soil moisture and irrigate in the early morning or after sunset.`,
      confidence: 88, type: 'stress', level: 'warning',
      reason: `Temperature ${Math.round(maxTempForecast)}°C > ${crop.label} heat stress threshold`,
    };
  }

  // Priority 5 — fungal risk
  if (topRisk.type === 'fungal') {
    const humidity = weather?.humidity ?? farm.humidity;
    return {
      text: `Fungal disease risk detected for ${crop.label} at ${farm.name}. Humidity at ${humidity}% combined with soil moisture ${ctx.farm.soilMoisture}% creates ideal conditions for mildew and blight. Avoid overhead irrigation and apply preventive fungicide if humidity persists above 80%.`,
      confidence: 82, type: 'fungal', level: 'warning',
      reason: `Humidity ${humidity}% + moisture ${ctx.farm.soilMoisture}% — optimal fungal growth window`,
    };
  }

  // Priority 6 — rain forecast → delay irrigation
  if (irrigation.decision === 'delay_rain') {
    return {
      text: irrigation.detail,
      confidence: 87, type: 'irrigation', level: 'info',
      reason: irrigation.reason,
    };
  }

  // Priority 7 — pest / disease
  if (topRisk.type === 'pest' && (topRisk.level === 'high' || topRisk.level === 'critical')) {
    return {
      text: `${crop.label} at ${farm.name} shows signs of poor health. Conduct an immediate field inspection for pest damage, disease lesions, and nutrient deficiencies. Consider targeted foliar treatment for affected sections.`,
      confidence: 80, type: 'pest', level: 'warning',
      reason: 'Crop health reported as poor — likely pest or disease activity',
    };
  }

  // Priority 8 — waterlogging low/moderate
  if (topRisk.type === 'waterlogging') {
    return {
      text: `${soil.label} soil on ${farm.name} is approaching saturation (${ctx.farm.soilMoisture}%). With ${Math.round(rainProbability24h)}% rain expected, waterlogging risk is elevated. ${irrigation.detail}`,
      confidence: 78, type: 'drainage', level: 'warning',
      reason: irrigation.reason,
    };
  }

  // Priority 9 — scheduled irrigation needed
  if (irrigation.decision === 'irrigate_scheduled') {
    return {
      text: irrigation.detail,
      confidence: 85, type: 'irrigation', level: 'info',
      reason: irrigation.reason,
    };
  }

  // Default — optimal
  return {
    text: `${crop.label} at ${farm.name} is in optimal condition. ${irrigation.reason}. Continue monitoring soil moisture every 24–48 hours and maintain current agronomic practices.`,
    confidence: 94, type: 'weather', level: 'info',
    reason: 'All agronomic parameters within optimal range',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — CROP RECOMMENDATIONS (multi-factor)
// ─────────────────────────────────────────────────────────────────────────────

export const generateCropRecommendations = (
  farm: Farm,
  weather?: WeatherData | null,
  _t?: TFunction
): string[] => {
  const ctx = buildContext(farm, weather);
  const { crop, soil, rainProbability24h, maxTempForecast } = ctx;
  const risks = evaluateRisks(ctx);
  const irrigation = buildIrrigationRecommendation(ctx);
  const recs: string[] = [];
  const humidity = weather?.humidity ?? farm.humidity;
  const m = ctx.farm.soilMoisture;

  // Irrigation recommendation (Explainable AI Format: Action because Factors)
  switch (irrigation.decision) {
    case 'irrigate_urgent':
      recs.push(`Start immediate irrigation because ${soil.label} soil drains quickly, ${crop.label} moisture has fallen to a critical ${m}%, temperatures are expected to reach ${Math.round(maxTempForecast)}°C, and rainfall probability is only ${Math.round(rainProbability24h)}%.`);
      break;
    case 'irrigate_scheduled':
      recs.push(`Schedule irrigation within ${irrigation.urgencyHours ?? 24} hours because ${crop.label} moisture is sub-optimal at ${m}% and ${soil.label} soil requires replenishment before drought stress begins.`);
      break;
    case 'delay_rain':
      recs.push(`Delay irrigation because incoming rainfall (${Math.round(rainProbability24h)}% probability) will naturally replenish the ${soil.label} soil, preventing unnecessary waterlogging of the ${crop.label} crop.`);
      break;
    case 'halt_waterlogging':
      recs.push(`Halt irrigation and check field drainage immediately because ${soil.label} soil is highly waterlogged at ${m}% moisture, threatening ${crop.label} root health and causing oxygen deprivation.`);
      break;
    case 'reduce_frequency':
      recs.push(`Reduce irrigation volume because ${soil.label} soil currently retains excessive moisture (${m}%), placing ${crop.label} at risk of mild waterlogging if standard watering continues.`);
      break;
    default:
      recs.push(`Maintain current irrigation schedule because ${crop.label} moisture levels are perfectly stable at ${m}% and ${soil.label} soil is providing balanced water retention.`);
  }

  // Heat-based recommendation
  if (risks.some(r => r.type === 'heat_stress' && (r.level === 'high' || r.level === 'critical'))) {
    recs.push(`Apply organic mulching around ${crop.label} roots because the expected peak temperature of ${Math.round(maxTempForecast)}°C exceeds the crop's heat stress threshold (${crop.heatStressTemp}°C), which will rapidly dehydrate the ${soil.label} soil.`);
  } else if (maxTempForecast > 30) {
    recs.push(`Shift irrigation to early morning (5–7 AM) because daytime temperatures reaching ${Math.round(maxTempForecast)}°C will cause high evaporation losses on ${soil.label} soil.`);
  }

  // Fungal / humidity recommendation
  if (risks.some(r => r.type === 'fungal')) {
    recs.push(`Switch to drip irrigation and inspect ${crop.label} leaves because elevated humidity (${humidity}%) combined with moist soil (${m}%) creates an ideal breeding ground for fungal pathogens.`);
  }

  // Pest / Health
  if (farm.cropHealth === 'poor' || farm.cropHealth === 'moderate') {
    recs.push(`Conduct a targeted field inspection and consider localized treatment because the ${crop.label} crop is showing visible signs of distress and elevated pest/disease vulnerability.`);
  } else if (m >= crop.moistureOptimal[0] && m <= crop.moistureOptimal[1] && farm.cropHealth === 'good' && maxTempForecast < 34) {
    recs.push(`Consider applying a balanced NPK fertiliser top-up because ${crop.label} is currently in excellent health and optimal moisture conditions (${m}%) will maximize nutrient uptake.`);
  }

  return recs.slice(0, 4);
};


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — FARM HEALTH SCORE (multi-factor, soil and crop aware)
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthBreakdown {
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical' | 'bonus' | 'neutral';
}

export interface FarmHealthScore {
  score: number;
  baseScore: number;
  scoreCategory: 'Excellent' | 'Stable' | 'Moderate Risk' | 'Critical';
  riskLevel: 'Low' | 'Elevated' | 'Critical';
  color: string;
  insight: string;
  trend: 'up' | 'down' | 'stable';
  trendReason: string;
  detailedExplanation: string[];
  recommendations: string[];
  breakdown: HealthBreakdown[];
  scoreBreakdown: HealthBreakdown[];
  topContributors: HealthBreakdown[];
}

export interface ScoreResult {
  score: number;
  rawScore: number;
  baseScore: number;
  modifiers: HealthBreakdown[];
  components: {
    moisture: 'good' | 'warning' | 'critical';
    weather: 'good' | 'warning' | 'critical';
    soil: 'good' | 'warning' | 'critical';
    pest: 'good' | 'warning' | 'critical';
  };
}

export const scoreFarm = (farm: Farm, weather?: WeatherData | null): ScoreResult => {
  const ctx = buildContext(farm, weather);
  const { crop, soil, rainProbability24h, maxTempForecast } = ctx;
  const baseScore = 100;
  const modifiers: HealthBreakdown[] = [];
  let currentScore = baseScore;

  const addModifier = (label: string, value: number, status: HealthBreakdown['status']) => {
    modifiers.push({ label, value: value > 0 ? `+${value}` : `${value}`, status });
    currentScore += value;
  };

  let moistureStatus: 'good' | 'warning' | 'critical' = 'good';
  let pestStatus: 'good' | 'warning' | 'critical' = 'good';
  let weatherStatus: 'good' | 'warning' | 'critical' = 'good';
  let soilStatus: 'good' | 'warning' | 'critical' = 'good';

  // ── Moisture scoring (crop-aware) ─────────────────────────────────────────
  const m = ctx.farm.soilMoisture;
  const [optMin, optMax] = crop.moistureOptimal;
  
  if (m < crop.moistureCritical) {
    addModifier('Critical Drought Penalty', -30, 'critical');
    moistureStatus = 'critical';
  } else if (m > crop.moistureMax) {
    addModifier('Severe Waterlogging Penalty', -30, 'critical');
    moistureStatus = 'critical';
  } else if (m < optMin) {
    // Linear penalty based on distance from optimum
    const distFromOpt = optMin - m;
    const rangeSide = optMin - crop.moistureCritical;
    const penalty = Math.round((distFromOpt / rangeSide) * 20);
    if (penalty > 0) addModifier('Moisture Deficit Penalty', -penalty, 'warning');
    moistureStatus = 'warning';
  } else if (m > optMax) {
    // Linear penalty based on distance from optimum
    const distFromOpt = m - optMax;
    const rangeSide = crop.moistureMax - optMax;
    const penalty = Math.round((distFromOpt / rangeSide) * 20);
    if (penalty > 0) addModifier('Excess Moisture Penalty', -penalty, 'warning');
    moistureStatus = 'warning';
  } else {
    // Within optimal range
    const isWaterloggingImminent = m > optMin && rainProbability24h > 60 && soil.waterloggingRisk > 0.7;
    if (!isWaterloggingImminent) {
      addModifier('Optimal Moisture Bonus', +5, 'bonus');
    } else {
      moistureStatus = 'warning'; // Change moisture status if rain is coming and it's already high on clay
    }
  }

  // ── Soil-adjusted moisture penalty ───────────────────────────────────────
  // High retention soils amplify waterlogging, low retention amplifies drought
  if (m > optMax && soil.waterloggingRisk > 0.6) {
    const penalty = Math.round(soil.waterloggingRisk * 10);
    if (penalty > 0) {
      addModifier(`${soil.label} Waterlogging Risk`, -penalty, 'warning');
      soilStatus = moistureStatus === 'critical' ? 'critical' : 'warning';
    }
  }
  if (m < optMin && soil.drainageFactor > 0.7) {
    const penalty = Math.round(soil.drainageFactor * 10);
    if (penalty > 0) {
      addModifier(`${soil.label} Rapid Dehydration`, -penalty, 'warning');
      soilStatus = moistureStatus === 'critical' ? 'critical' : 'warning';
    }
  }

  // ── Pest Risk Refinement (Environmental Model) ────────────────────────────
  const activeHumidity = ctx.weather?.humidity ?? ctx.farm.humidity ?? 50;
  const isWaterlogged = moistureStatus === 'critical' && m > optMax;
  const isMoistureIssue = moistureStatus === 'warning' || moistureStatus === 'critical';

  let pestPenalty = 0;
  let pestName = '';

  if (activeHumidity > 90 && isWaterlogged && rainProbability24h > 50) {
    pestPenalty = 25;
    pestName = 'Critical Fungal Outbreak Risk';
    pestStatus = 'critical';
  } else if (activeHumidity > 85 && isMoistureIssue && maxTempForecast > 30) {
    pestPenalty = 15;
    pestName = 'High Pest Risk Penalty';
    pestStatus = 'critical';
  } else if (activeHumidity > 80 || moistureStatus === 'warning') {
    pestPenalty = 8;
    pestName = 'Elevated Pest Risk';
    pestStatus = 'warning';
  } else {
    pestStatus = 'good';
  }

  // Crop Health Multiplier
  if (pestStatus !== 'good') {
    if (ctx.farm.cropHealth === 'poor') {
      pestPenalty = Math.round(pestPenalty * 1.5);
      pestStatus = 'critical'; // Escalate status if crop is already weak
    } else if (ctx.farm.cropHealth === 'moderate') {
      pestPenalty = Math.round(pestPenalty * 1.2);
    }
    addModifier(pestName, -pestPenalty, pestStatus === 'critical' ? 'critical' : 'warning');
  } else {
    if (ctx.farm.cropHealth === 'poor') {
      addModifier('Poor Crop Health Penalty', -20, 'critical');
    } else {
      addModifier('Low Pest Risk Bonus', +2, 'bonus');
    }
  }

  // ── Temperature / heat stress (crop-aware) ───────────────────────────────
  const tempDelta = maxTempForecast - crop.heatStressTemp;
  if (tempDelta > 0) {
    const critDelta = crop.heatCriticalTemp - crop.heatStressTemp;
    const penalty = Math.round(Math.min(20, (tempDelta / Math.max(critDelta, 1)) * 20));
    if (penalty > 0) {
      addModifier('Heat Stress Penalty', -penalty, 'warning');
      weatherStatus = tempDelta > critDelta ? 'critical' : 'warning';
    }
  }

  // ── Weather penalties ─────────────────────────────────────────────────────
  const activeWeather = ctx.weather;
  if (activeWeather) {
    if (m > optMin && rainProbability24h > 60 && soil.waterloggingRisk > 0.7) {
      addModifier('Rainfall + Clay Waterlogging Risk', -8, 'warning');
      if (soilStatus !== 'critical') soilStatus = 'warning';
    }
    const uvIndex = activeWeather.uvIndex ?? 0;
    if (uvIndex >= 9) {
      addModifier('Extreme UV Stress Penalty', -10, 'critical');
      weatherStatus = 'critical';
    } else if (uvIndex >= 7) {
      addModifier('High UV Stress Penalty', -5, 'warning');
      if (weatherStatus !== 'critical') weatherStatus = 'warning';
    }
    const humidity = activeWeather.humidity;
    if (humidity > 88) {
      addModifier('High Fungal Risk Penalty', -8, 'warning');
      if (weatherStatus !== 'critical') weatherStatus = 'warning';
    } else if (humidity > 80) {
      addModifier('Moderate Fungal Risk', -3, 'neutral');
    }
  }

  // ── Crop-specific drought tolerance modifier ─────────────────────────────
  // Drought-tolerant crops lose fewer points when dry
  if (m < optMin) {
    const rawPenalty = (optMin - m) / optMin;
    const bonus = Math.round(rawPenalty * crop.droughtTolerance * 10);
    if (bonus > 0) addModifier(`${crop.label} Drought Tolerance Bonus`, +bonus, 'bonus');
  }
  
  if (soil.label === 'Loam' || soil.label === 'Silt') {
    // good soils get a tiny flat bonus if health isn't poor
    if (ctx.farm.cropHealth !== 'poor') addModifier('Healthy Soil Bonus', +3, 'bonus');
  }

  const rawScore = Math.max(0, Math.min(100, Math.round(currentScore)));
  let riskAdjustedScore = rawScore;

  const hasCritical = moistureStatus === 'critical' || pestStatus === 'critical' || weatherStatus === 'critical' || soilStatus === 'critical';
  const hasWarning = moistureStatus === 'warning' || pestStatus === 'warning' || weatherStatus === 'warning' || soilStatus === 'warning';

  if (hasCritical) {
    riskAdjustedScore = Math.min(riskAdjustedScore, 74);
  } else if (hasWarning) {
    riskAdjustedScore = Math.min(riskAdjustedScore, 89);
  }

  return {
    rawScore,
    score: riskAdjustedScore,
    baseScore: baseScore,
    modifiers: modifiers,
    components: {
      moisture: moistureStatus,
      weather: weatherStatus,
      soil: soilStatus,
      pest: pestStatus
    }
  };
};

export const calculateFarmHealthScore = (
  farms: Farm[],
  selectedFarm: Farm | null,
  weather?: WeatherData | null,
  _t?: TFunction
): FarmHealthScore => {
  const targetFarms = selectedFarm ? [selectedFarm] : farms;

  if (targetFarms.length === 0) {
    return {
      score: 100,
      baseScore: 100,
      scoreCategory: 'Excellent',
      riskLevel: 'Low',
      color: '#10B981',
      insight: 'No farms added yet. Add your first farm on the Map to begin monitoring.',
      trend: 'stable',
      trendReason: 'No farm data to evaluate',
      detailedExplanation: ['Add farms using the Map tab to start receiving intelligent health scores.'],
      recommendations: ['Tap the + button on the Map tab to add your first farm.'],
      breakdown: [],
      scoreBreakdown: [],
      topContributors: [],
    };
  }

  // Score each farm
  const scores = targetFarms.map(f => ({ farm: f, ...scoreFarm(f, weather) }));
  const avgScore = scores.reduce((s, x) => s + x.score, 0) / scores.length;
  const worstEntry = scores.reduce((a, b) => b.score < a.score ? b : a);
  const worstScore = worstEntry.score;

  // Global view: bias toward worst performer
  let finalScore =
    targetFarms.length > 1
      ? Math.round(avgScore * 0.6 + worstScore * 0.4)
      : Math.round(avgScore);

  // Determine representative farm context for explanations
  const repFarm = selectedFarm ?? worstEntry.farm;
  const repResult = selectedFarm ? scores[0] : worstEntry;
  const ctx = buildContext(repFarm, weather);
  const { crop, soil, rainProbability24h, maxTempForecast } = ctx;
  const risks = evaluateRisks(ctx);
  const topRisk = risks[0];
  const recommendations = generateCropRecommendations(repFarm, weather);

  // Enforce score clamping based on representative farm's component statuses
  const { components } = repResult;
  const hasCritical = components.moisture === 'critical' || components.pest === 'critical' || components.weather === 'critical' || components.soil === 'critical';
  const hasWarning = components.moisture === 'warning' || components.pest === 'warning' || components.weather === 'warning' || components.soil === 'warning';

  if (hasCritical) {
    finalScore = Math.min(finalScore, 74);
  } else if (hasWarning) {
    finalScore = Math.min(finalScore, 89);
  }

  // ── Score Breakdown & Top Contributors ────────────────────────────────────
  const scoreBreakdown: HealthBreakdown[] = [
    { label: 'Base Score', value: repResult.baseScore, status: 'neutral' },
    ...repResult.modifiers
  ];

  if (repResult.rawScore !== repResult.score) {
    scoreBreakdown.push({ label: 'Raw Score (Pre-Adjustment)', value: repResult.rawScore, status: 'neutral' });
    scoreBreakdown.push({ label: 'Risk-Adjusted Cap Applied', value: repResult.score, status: 'warning' });
  }
  
  const sortedModifiers = [...repResult.modifiers]
    .filter(m => {
      const val = parseInt(m.value as string);
      return !isNaN(val) && val !== 0;
    })
    .sort((a, b) => {
      const valA = parseInt(a.value as string);
      const valB = parseInt(b.value as string);
      return Math.abs(valB) - Math.abs(valA); // Sort by absolute impact
    });
  
  const uniqueModifiers: HealthBreakdown[] = [];
  const seenLabels = new Set<string>();
  for (const m of sortedModifiers) {
    if (!seenLabels.has(m.label)) {
      seenLabels.add(m.label);
      uniqueModifiers.push(m);
    }
  }

  const topContributors = uniqueModifiers.slice(0, 3);

  // ── Breakdown panel (the original summary metrics) ────────────────────────
  const breakdown: HealthBreakdown[] = [];
  const humidity = weather?.humidity ?? repFarm.humidity;

  breakdown.push({
    label: 'Moisture',
    value: components.moisture === 'good' ? 'Optimal' : components.moisture === 'warning' ? 'Sub-optimal' : 'Critical',
    status: components.moisture,
  });

  breakdown.push({
    label: 'Weather',
    value: components.weather === 'good' ? 'Favourable' : components.weather === 'warning' ? 'Moderate Stress' : 'Severe Stress',
    status: components.weather,
  });

  let soilValue = 'Balanced';
  if (components.soil === 'critical') {
    soilValue = soil.label === 'Sandy' ? 'Severe Dehydration' : soil.label === 'Loam' ? 'Unstable' : 'Waterlogged';
  } else if (components.soil === 'warning') {
    soilValue = soil.label === 'Sandy' ? 'Rapid Drying' : soil.label === 'Loam' ? 'Sub-optimal' : 'Waterlogging Risk';
  } else {
    soilValue = soil.label === 'Sandy' ? 'Draining Fast' : soil.label === 'Loam' ? 'Balanced' : 'Water Retaining';
  }

  breakdown.push({
    label: 'Soil',
    value: soilValue,
    status: components.soil,
  });

  breakdown.push({
    label: 'Pest Risk',
    value: components.pest === 'good' ? 'Low Risk' : components.pest === 'warning' ? 'Elevated' : 'High Risk',
    status: components.pest,
  });

  // ── Score Category, Risk Level, color, insight ────────────────────────────────
  let scoreCategory: FarmHealthScore['scoreCategory'];
  let riskLevel: FarmHealthScore['riskLevel'];
  let color: string;
  let insight = '';
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendReason = '';
  const detailedExplanation: string[] = [];

  const seedBit = (finalScore + new Date().getDate()) % 2 === 0;

  // Enforce score bucket purely by number
  if (finalScore >= 90) {
    scoreCategory = 'Excellent';
    color = '#10B981';
  } else if (finalScore >= 75) {
    scoreCategory = 'Stable';
    color = '#3B82F6';
  } else if (finalScore >= 50) {
    scoreCategory = 'Moderate Risk';
    color = '#F59E0B';
  } else {
    scoreCategory = 'Critical';
    color = '#EF4444';
  }

  // Enforce risk severity by components
  if (hasCritical) {
    riskLevel = 'Critical';
    color = '#EF4444'; // Override color for critical risk
    trend = 'down';
  } else if (hasWarning) {
    riskLevel = 'Elevated';
    trend = 'down';
  } else {
    riskLevel = 'Low';
    trend = seedBit ? 'up' : 'stable';
  }

  // Generate explanation exactly from evaluated modifiers to prevent desync
  const sortedByImpact = [...repResult.modifiers]
    .filter(m => parseInt(m.value as string) !== 0)
    .sort((a, b) => Math.abs(parseInt(b.value as string)) - Math.abs(parseInt(a.value as string)));
  
  if (sortedByImpact.length > 0) {
    const topMod = sortedByImpact[0];
    const topModLabel = topMod.label.toLowerCase();
    
    if (topModLabel.includes('drought') || topModLabel.includes('dehydration')) {
      insight = `Moisture deficit detected — ${crop.label} requires urgent irrigation.`;
      trendReason = `Soil moisture dropping below critical threshold for ${crop.label}`;
    } else if (topModLabel.includes('waterlogging')) {
      insight = `${crop.label} on ${soil.label} soil is waterlogged — root health at risk.`;
      trendReason = `Field saturation is causing drainage failure`;
    } else if (topModLabel.includes('heat stress')) {
      insight = `Heat stress on ${crop.label} — crop damage risk is elevated.`;
      trendReason = `Heat stress increasing — forecast exceeds ${crop.label} tolerance`;
    } else if (topModLabel.includes('fungal')) {
      insight = `Fungal disease risk is elevated. Humidity and moisture favour pathogen growth.`;
      trendReason = `Environmental conditions are sustaining fungal pressure`;
    } else if (topModLabel.includes('pest')) {
      insight = `Pest risk is elevated based on environmental conditions.`;
      trendReason = `Conditions are favourable for pest development`;
    } else if (topMod.status === 'bonus') {
      insight = `${crop.label} is thriving under ideal conditions.`;
      trendReason = `All conditions remain at peak efficiency`;
    } else {
      insight = `${crop.label} conditions are sub-optimal — minor stress indicators detected.`;
      trendReason = `Multiple stressors are driving the score down`;
    }
  } else {
    insight = `${crop.label} is stable. Conditions are within acceptable range.`;
    trendReason = `Conditions are balanced — no significant changes`;
  }

  // Build detailed explanations from components
  if (components.moisture === 'good') {
    detailedExplanation.push(`Soil moisture (${ctx.farm.soilMoisture}%) is optimal for ${crop.label}.`);
  } else if (components.moisture === 'warning') {
    detailedExplanation.push(`Soil moisture (${ctx.farm.soilMoisture}%) is sub-optimal for ${crop.label}.`);
  } else {
    detailedExplanation.push(`Soil moisture (${ctx.farm.soilMoisture}%) is critical for ${crop.label}.`);
  }

  if (components.weather === 'warning') {
    detailedExplanation.push(`Weather conditions (Temperature: ${Math.round(maxTempForecast)}°C) are causing moderate stress.`);
  } else if (components.weather === 'critical') {
    detailedExplanation.push(`Extreme weather stress detected (Temperature: ${Math.round(maxTempForecast)}°C, UV: ${ctx.weather?.uvIndex ?? 'High'}).`);
  } else {
    detailedExplanation.push(`Weather conditions are favourable for ${crop.label}.`);
  }

  if (components.soil !== 'good') {
    detailedExplanation.push(`${soil.label} soil characteristics are exacerbating current risks.`);
  }
  
  if (components.pest === 'critical') {
    detailedExplanation.push(`High pest or fungal outbreak risk due to compounding environmental factors.`);
  } else if (components.pest === 'warning') {
    detailedExplanation.push(`Elevated pest risk detected.`);
  }

  // ── Automatic Contradiction Guards ──────────────────────────────────────────
  
  // 1. Moisture Consistency
  if (components.moisture === 'good') {
    if (repResult.modifiers.some(m => m.label.toLowerCase().includes('drought penalty') || m.label.toLowerCase().includes('drought warning'))) {
      throw new Error('CONTRADICTION: Optimal Moisture with Drought Penalty');
    }
  }

  // 2. Waterlogging Consistency
  if (components.soil === 'critical' || components.soil === 'warning') {
    if (repResult.modifiers.some(m => m.label.toLowerCase().includes('waterlog'))) {
      if (repResult.modifiers.some(m => m.label === 'Optimal Moisture Bonus')) {
        throw new Error('CONTRADICTION: Waterlogged Soil with Optimal Moisture Bonus');
      }
    }
  }

  // 3. Weather Consistency
  if (components.weather === 'good') {
    if (repResult.modifiers.some(m => m.label.toLowerCase().includes('heat stress penalty') || m.label.toLowerCase().includes('uv stress penalty'))) {
      throw new Error('CONTRADICTION: Favourable Weather with Weather Penalty');
    }
  }

  // 4. Pest Consistency
  if (components.pest === 'critical' || components.pest === 'warning') {
    const activeHumidity = ctx.weather?.humidity ?? ctx.farm.humidity ?? 50;
    const isMoistureIssue = components.moisture !== 'good';
    const isRainy = rainProbability24h > 50;
    const isHot = maxTempForecast > 30;
    
    // Must have at least one environmental trigger if not purely driven by poor crop health
    if (ctx.farm.cropHealth !== 'poor') {
      if (!(activeHumidity > 80 || isMoistureIssue || isRainy || isHot)) {
        throw new Error('CONTRADICTION: Elevated/High Pest Risk without environmental triggers');
      }
    }
  }

  return {
    score: finalScore,
    baseScore: repResult.baseScore,
    scoreCategory,
    riskLevel,
    color,
    insight,
    trend,
    trendReason,
    detailedExplanation,
    recommendations,
    breakdown,
    scoreBreakdown,
    topContributors,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — CHART GENERATORS (unchanged API)
// ─────────────────────────────────────────────────────────────────────────────

const randomInRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const getDaysLabels = (days: number): string[] => {
  const labels: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days <= 7) {
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    } else {
      const interval = days === 30 ? 5 : 15;
      if (i % interval === 0) {
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push('');
      }
    }
  }
  return labels;
};

export const generateMoistureTrends = (currentMoisture: number, days = 7) => {
  const labels = getDaysLabels(days);
  const data = labels.map((label, index) => {
    const distanceToToday = days - 1 - index;
    const variation = randomInRange(-15, 15) * (distanceToToday / days);
    const value = Math.max(0, Math.min(100, Math.round(currentMoisture + variation)));
    return { value, label };
  });
  const diff = data[data.length - 1].value - data[0].value;
  return {
    data,
    trendValue: `${diff > 0 ? '+' : ''}${diff}%`,
    trendDirection: (diff > 2 ? 'up' : diff < -2 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
  };
};

export const generateTemperatureTrends = (currentTemp: number, days = 7) => {
  const labels = getDaysLabels(days);
  const data = labels.map((label, index) => {
    const distanceToToday = days - 1 - index;
    const variation = randomInRange(-8, 8) * (distanceToToday / days);
    const value = Math.round((currentTemp + variation) * 10) / 10;
    return { value, label };
  });
  const diff = Math.round((data[data.length - 1].value - data[0].value) * 10) / 10;
  return {
    data,
    trendValue: `${diff > 0 ? '+' : ''}${diff}°C`,
    trendDirection: (diff > 1 ? 'up' : diff < -1 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
  };
};

export const generateIrrigationTimeline = (days = 7): ChartDataPoint[] => {
  const labels = getDaysLabels(days);
  return labels.map((label) => {
    const watered = Math.random() > 0.4;
    const volume = watered ? Math.round(randomInRange(10, 30)) : 0;
    return { value: volume, label, frontColor: volume > 0 ? '#3B82F6' : '#E5E7EB' };
  });
};

export const generateSoilHealthData = (farmId: string, days = 7): ChartDataPoint[] => {
  const seed = farmId.length + days;
  return [
    { value: Math.round(randomInRange(40, 80) + seed % 20), label: 'N', frontColor: '#10B981' },
    { value: Math.round(randomInRange(30, 70) + seed % 15), label: 'P', frontColor: '#F59E0B' },
    { value: Math.round(randomInRange(50, 90) + seed % 10), label: 'K', frontColor: '#3B82F6' },
    { value: Math.round(randomInRange(60, 100)),             label: 'pH', frontColor: '#8B5CF6' },
    { value: Math.round(randomInRange(40, 70)),              label: 'OM', frontColor: '#14B8A6' },
  ];
};

export const generateFarmComparison = (farms: Farm[], days = 7) => {
  const data = farms.map((farm) => {
    const crop = getCropProfile(farm.cropType);
    const soil = getSoilProfile((farm as any).soilType);
    const s = scoreFarm(farm);
    // Timeframe variance
    const variance = days > 7 ? (days === 30 ? -5 : -10) : 0;
    const score = Math.min(100, Math.max(0, s.score + variance));
    return {
      value: score,
      label: farm.name.substring(0, 3).toUpperCase(),
      frontColor: score > 75 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444',
    };
  });
  return { data };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — RECENT ACTIVITY (context-aware)
// ─────────────────────────────────────────────────────────────────────────────

export const generateRecentActivity = (
  farm: Farm,
  weather?: WeatherData | null,
  _t?: TFunction
): { action: string; time: string }[] => {
  const ctx = buildContext(farm, weather);
  const { crop, soil, rainProbability24h } = ctx;
  const activities: { action: string; time: string }[] = [];
  const seed = farm.id.charCodeAt(0) % 3;

  // Most recent event based on state
  if (ctx.farm.soilMoisture > crop.moistureOptimal[1]) {
    activities.push({ action: `Irrigation paused — ${soil.label} soil saturation at ${ctx.farm.soilMoisture}%`, time: '2 hours ago' });
  } else if (weather && weather.rainfall > 5) {
    activities.push({ action: `Rainfall recorded — ${weather.rainfall.toFixed(1)} mm received`, time: '1 hour ago' });
  } else if (ctx.farm.soilMoisture < crop.moistureCritical) {
    activities.push({ action: `Soil moisture alert triggered — ${ctx.farm.soilMoisture}% (critical for ${crop.label})`, time: '30 minutes ago' });
  } else {
    activities.push({ action: `Sensor data updated — ${crop.label} moisture ${ctx.farm.soilMoisture}%`, time: '15 minutes ago' });
  }

  // Second event
  if (ctx.farm.cropHealth === 'poor') {
    activities.push({ action: `Pathology scan initiated — crop stress indicators detected`, time: '1 day ago' });
  } else if (rainProbability24h > 50) {
    activities.push({ action: `Weather advisory issued — ${Math.round(rainProbability24h)}% rainfall expected`, time: seed === 0 ? 'Yesterday' : '2 days ago' });
  } else {
    activities.push({ action: `Agronomic check completed — ${crop.label} health assessed`, time: seed === 0 ? 'Yesterday' : '2 days ago' });
  }

  // Third event — fertilisation
  activities.push({
    action: `Fertiliser application logged — balanced NPK for ${crop.label}`,
    time: seed === 1 ? '3 days ago' : '5 days ago',
  });

  return activities;
};
