import { Farm } from '../types/farm';

export interface ChartDataPoint {
  value: number;
  label: string;
  frontColor?: string;
  dataPointText?: string;
}

const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const getDaysLabels = (days: number): string[] => {
  const labels: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // For 7 days, show short day name. For longer, show short date (e.g., 'May 12') sparsely
    if (days <= 7) {
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    } else {
      // Only show label every 5 days for 30D, and every 15 days for 90D
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

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const diff = lastValue - firstValue;
  const trendDirection = diff > 2 ? 'up' : diff < -2 ? 'down' : 'neutral';
  const trendValue = `${diff > 0 ? '+' : ''}${diff}%`;

  return { data, trendValue, trendDirection: trendDirection as 'up'|'down'|'neutral' };
};

export const generateTemperatureTrends = (currentTemp: number, days = 7) => {
  const labels = getDaysLabels(days);
  const data = labels.map((label, index) => {
    const distanceToToday = days - 1 - index;
    const variation = randomInRange(-8, 8) * (distanceToToday / days);
    const value = Math.round((currentTemp + variation) * 10) / 10;
    return { value, label };
  });

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const diff = Math.round((lastValue - firstValue) * 10) / 10;
  const trendDirection = diff > 1 ? 'up' : diff < -1 ? 'down' : 'neutral';
  const trendValue = `${diff > 0 ? '+' : ''}${diff}°C`;

  return { data, trendValue, trendDirection: trendDirection as 'up'|'down'|'neutral' };
};

export const generateIrrigationTimeline = (days = 7): ChartDataPoint[] => {
  const labels = getDaysLabels(days);
  return labels.map((label) => {
    // Random chance of watering
    const watered = Math.random() > 0.4;
    const volume = watered ? Math.round(randomInRange(10, 30)) : 0;
    return {
      value: volume,
      label,
      frontColor: volume > 0 ? '#3B82F6' : '#E5E7EB',
    };
  });
};

export const generateSoilHealthData = (farmId: string): ChartDataPoint[] => {
  // We simulate data based on farmId string to make it pseudo-deterministic
  const seed = farmId.length;
  
  return [
    { value: Math.round(randomInRange(40, 80) + seed), label: 'N', frontColor: '#10B981' },
    { value: Math.round(randomInRange(30, 70) + seed), label: 'P', frontColor: '#F59E0B' },
    { value: Math.round(randomInRange(50, 90) + seed), label: 'K', frontColor: '#3B82F6' },
    { value: Math.round(randomInRange(60, 100)), label: 'pH', frontColor: '#8B5CF6' },
    { value: Math.round(randomInRange(40, 70)), label: 'OM', frontColor: '#14B8A6' },
  ];
};

export const generateFarmComparison = (farms: Farm[]) => {
  const data = farms.map((farm) => {
    // Productivity score based on health and moisture
    let score = 50;
    if (farm.cropHealth === 'good') score += 30;
    else if (farm.cropHealth === 'moderate') score += 10;
    else score -= 10;

    if (farm.soilMoisture > 50 && farm.soilMoisture < 80) score += 20;

    return {
      value: Math.min(100, Math.max(0, score)),
      label: farm.name.substring(0, 3).toUpperCase(),
      frontColor: score > 75 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444',
    };
  });
  
  return { data };
};

export interface AIPrediction {
  text: string;
  confidence: number;
  type: 'moisture' | 'disease' | 'irrigation' | 'stress' | 'weather';
  level: 'info' | 'warning' | 'critical';
}

export const generateAIPrediction = (farm: Farm | null): AIPrediction => {
  if (!farm) {
    return {
      text: "AI predicts stable overall conditions across all farms. Minor temperature drop expected.",
      confidence: 92,
      type: 'weather',
      level: 'info',
    };
  }

  if (farm.soilMoisture < 40) {
    return {
      text: "Irrigation strongly recommended within next 6 hours to prevent yield loss.",
      confidence: 88,
      type: 'irrigation',
      level: 'critical',
    };
  }

  if (farm.temperature > 32) {
    return {
      text: `Crop stress probability increased by 18% for ${farm.cropType} due to sustained heat.`,
      confidence: 76,
      type: 'stress',
      level: 'warning',
    };
  }

  if (farm.cropHealth === 'poor') {
    return {
      text: "Possible fungal risk detected due to recent humidity spike. Inspect lower leaves.",
      confidence: 81,
      type: 'disease',
      level: 'critical',
    };
  }

  return {
    text: `Optimal conditions for ${farm.cropType}. No immediate interventions required.`,
    confidence: 95,
    type: 'weather',
    level: 'info',
  };
};
