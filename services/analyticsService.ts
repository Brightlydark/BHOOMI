import { Farm } from '../types/farm';
import { WeatherData } from '../types/insight';
import { TFunction } from 'i18next';

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

export const generateAIPrediction = (farm: Farm | null, weather?: WeatherData | null, t?: TFunction): AIPrediction => {
  const translate = t || ((key: string, opts?: any) => key); // fallback if t not provided

  if (weather && weather.forecast && weather.forecast[0]) {
    const todayForecast = weather.forecast[0];
    
    // High precipitation risk
    if (todayForecast.rainfall > 60 || weather.rainfall > 5) {
      return {
        text: translate('analytics.predictions.heavyRain', { rainfall: todayForecast.rainfall }),
        confidence: 94,
        type: 'weather',
        level: 'info',
      };
    }
    
    // High UV / Heat risk
    if (weather.uvIndex && weather.uvIndex >= 8) {
      return {
        text: translate('analytics.predictions.heatStress', { uv: weather.uvIndex }),
        confidence: 89,
        type: 'stress',
        level: 'warning',
      };
    }

    // High humidity
    if (weather.humidity > 85) {
      return {
        text: translate('analytics.predictions.highHumidity'),
        confidence: 82,
        type: 'disease',
        level: 'warning',
      };
    }
  }

  if (!farm) {
    return {
      text: weather ? translate('analytics.predictions.weatherStable', { condition: weather.condition.toLowerCase() }) : translate('analytics.predictions.globalStable'),
      confidence: 92,
      type: 'weather',
      level: 'info',
    };
  }

  if (farm.soilMoisture < 40) {
    return {
      text: translate('analytics.predictions.lowMoisture'),
      confidence: 88,
      type: 'irrigation',
      level: 'critical',
    };
  }

  if (farm.temperature > 32) {
    return {
      text: translate('analytics.predictions.heatWarning', { cropType: farm.cropType }),
      confidence: 76,
      type: 'stress',
      level: 'warning',
    };
  }

  if (farm.cropHealth === 'poor') {
    return {
      text: translate('analytics.predictions.diseaseRisk'),
      confidence: 81,
      type: 'disease',
      level: 'critical',
    };
  }

  return {
    text: translate('analytics.predictions.optimal', { cropType: farm.cropType || translate('analytics.common.thisFarm') }),
    confidence: 95,
    type: 'weather',
    level: 'info',
  };
};

export const generateCropRecommendations = (farm: Farm, weather?: WeatherData | null, t?: TFunction): string[] => {
  const recommendations: string[] = [];
  const translate = t || ((key: string, opts?: any) => key);

  // 1. Weather-based recommendations
  if (weather) {
    if (weather.rainfall > 20 || (weather.forecast[0] && weather.forecast[0].rainfall > 60)) {
      recommendations.push(translate('analytics.recommendations.delayFertilizer'));
      recommendations.push(translate('analytics.recommendations.ensureDrainage'));
    } else if (weather.temperature > 32) {
      recommendations.push(translate('analytics.recommendations.applyMulch'));
      recommendations.push(translate('analytics.recommendations.morningIrrigation'));
    } else if (weather.humidity > 80) {
      recommendations.push(translate('analytics.recommendations.monitorFungal'));
    }
  }

  // 2. Moisture-based recommendations
  if (farm.soilMoisture < 30) {
    recommendations.push(translate('analytics.recommendations.criticalDrip'));
  } else if (farm.soilMoisture > 80) {
    recommendations.push(translate('analytics.recommendations.haltIrrigation'));
  }

  // 3. Health-based recommendations
  if (farm.cropHealth === 'poor') {
    recommendations.push(translate('analytics.recommendations.urgentInspection'));
    recommendations.push(translate('analytics.recommendations.targetedTreatment', { cropType: farm.cropType || translate('analytics.common.affectedCrops') }));
  }

  // 4. Fallback defaults if array is too small
  if (recommendations.length === 0) {
    if (farm.cropType) {
      recommendations.push(translate('analytics.recommendations.continueCare', { cropType: farm.cropType }));
      recommendations.push(translate('analytics.recommendations.weeklyScouting'));
    } else {
      recommendations.push(translate('analytics.recommendations.maintainIrrigation'));
      recommendations.push(translate('analytics.recommendations.monitorNutrients'));
    }
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
};

export const generateRecentActivity = (farm: Farm, weather?: WeatherData | null, t?: TFunction): { action: string; time: string }[] => {
  const activities = [];
  const translate = t || ((key: string, opts?: any) => key);

  // Seed for pseudo-random consistency based on farm ID
  const seed = farm.id.charCodeAt(0) % 3;

  if (farm.soilMoisture > 70) {
    activities.push({ action: translate('analytics.activity.irrigationOn'), time: translate('analytics.time.hoursAgo', { count: 2 }) });
  } else if (weather && weather.rainfall > 10) {
    activities.push({ action: translate('analytics.activity.rainfall'), time: translate('analytics.time.hoursAgo', { count: 1 }) });
  } else {
    activities.push({ action: translate('analytics.activity.sensorUpdate'), time: translate('analytics.time.minsAgo', { count: 15 }) });
  }

  if (farm.cropHealth === 'poor') {
    activities.push({ action: translate('analytics.activity.pathologyScan'), time: translate('analytics.time.daysAgo', { count: 1 }) });
  } else {
    activities.push({ action: translate('analytics.activity.agronomicCheck'), time: seed === 0 ? translate('analytics.time.yesterday') : translate('analytics.time.daysAgo', { count: 2 }) });
  }

  activities.push({ action: translate('analytics.activity.fertilizer'), time: seed === 1 ? translate('analytics.time.daysAgo', { count: 3 }) : translate('analytics.time.daysAgo', { count: 5 }) });

  return activities;
};

export interface HealthBreakdown {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}

export interface FarmHealthScore {
  score: number;
  state: 'Excellent' | 'Stable' | 'Moderate Risk' | 'Critical';
  color: string;
  insight: string;
  trend: 'up' | 'down' | 'stable';
  trendReason: string;
  detailedExplanation: string[];
  recommendations: string[];
  breakdown: HealthBreakdown[];
}

export const calculateFarmHealthScore = (farms: Farm[], selectedFarm: Farm | null, weather?: WeatherData | null, t?: TFunction): FarmHealthScore => {
  const translate = t || ((key: string, opts?: any) => key);
  const targetFarms = selectedFarm ? [selectedFarm] : farms;
  if (targetFarms.length === 0) {
    return {
      score: 100, state: 'Excellent', color: '#10B981', insight: translate('analytics.healthScore.noFarmsInsight'), trend: 'stable', breakdown: [],
      trendReason: translate('analytics.healthScore.noFarmsReason'), detailedExplanation: [translate('analytics.healthScore.noFarmsInsight')], recommendations: [translate('analytics.healthScore.noFarmsRec')]
    };
  }

  let totalScore = 0;
  let worstScore = 100;
  let breakdown: HealthBreakdown[] = [
    { label: translate('analytics.healthScore.metrics.moisture'), value: translate('analytics.healthScore.values.optimal'), status: 'good' },
    { label: translate('analytics.healthScore.metrics.weather'), value: translate('analytics.healthScore.values.clear'), status: 'good' },
    { label: translate('analytics.healthScore.metrics.soil'), value: translate('analytics.healthScore.values.healthy'), status: 'good' },
    { label: translate('analytics.healthScore.metrics.pests'), value: translate('analytics.healthScore.values.lowRisk'), status: 'good' },
  ];

  targetFarms.forEach(farm => {
    let score = 100;
    
    // Moisture penalty
    if (farm.soilMoisture < 30 || farm.soilMoisture > 80) {
      score -= 25;
    } else if (farm.soilMoisture < 40 || farm.soilMoisture > 70) {
      score -= 10;
    }

    // Health penalty
    if (farm.cropHealth === 'poor') score -= 30;
    if (farm.cropHealth === 'moderate') score -= 15;

    // Temperature / Weather penalty
    if (farm.temperature > 35) score -= 15;
    else if (farm.temperature > 30) score -= 5;

    if (weather) {
      if (weather.rainfall > 50) score -= 10;
      if (weather.uvIndex && weather.uvIndex >= 8) score -= 10;
      if (weather.humidity > 85) score -= 5;
    }

    score = Math.max(0, Math.min(100, score));
    totalScore += score;
    if (score < worstScore) worstScore = score;
  });

  // Intelligent aggregation: weight the worst performing farm more heavily in the global view
  const avgScore = totalScore / targetFarms.length;
  const finalScore = targetFarms.length > 1 ? Math.round((avgScore * 0.6) + (worstScore * 0.4)) : Math.round(avgScore);

  // Determine state, color, and trend logically
  let state: FarmHealthScore['state'] = 'Excellent';
  let color = '#10B981'; // Success green
  let insight = translate('analytics.healthScore.insights.excellent');
  
  let detailedExplanation: string[] = [];
  let recommendations: string[] = [];
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendReason = translate('analytics.healthScore.trendReasons.balanced');

  // Helper to add deterministic variance to trend
  const seed = (finalScore + new Date().getDate()) % 2 === 0;

  if (finalScore < 50) {
    state = 'Critical';
    color = '#EF4444'; // Danger red
    insight = translate('analytics.healthScore.insights.critical');
    breakdown[0] = { label: translate('analytics.healthScore.metrics.moisture'), value: translate('analytics.healthScore.values.critical'), status: 'critical' };
    detailedExplanation.push(translate('analytics.healthScore.details.criticalMoisture'));
    recommendations.push(translate('analytics.healthScore.recs.emergencyIrrigation'));
    trend = seed ? 'down' : 'stable';
    trendReason = trend === 'down' ? translate('analytics.healthScore.trendReasons.moistureDropped') : translate('analytics.healthScore.trendReasons.criticalPersisting');

    if (targetFarms.some(f => f.cropHealth === 'poor')) {
      breakdown[3] = { label: translate('analytics.healthScore.metrics.pests'), value: translate('analytics.healthScore.values.highRisk'), status: 'critical' };
      detailedExplanation.push(translate('analytics.healthScore.details.pestActive'));
      recommendations.push(translate('analytics.healthScore.recs.pestControl'));
      if (trend === 'down') trendReason = translate('analytics.healthScore.trendReasons.pestRising');
    }
  } else if (finalScore < 75) {
    state = 'Moderate Risk';
    color = '#F59E0B'; // Warning amber/orange
    insight = translate('analytics.healthScore.insights.moderate');
    detailedExplanation.push(translate('analytics.healthScore.details.metricsDeviated'));
    recommendations.push(translate('analytics.healthScore.recs.increaseScouting'));
    trend = 'down';

    if (weather && weather.temperature > 30) {
      breakdown[1] = { label: translate('analytics.healthScore.metrics.weather'), value: translate('analytics.healthScore.values.heatStress'), status: 'warning' };
      insight = translate('analytics.healthScore.insights.heatStress');
      detailedExplanation.push(translate('analytics.healthScore.details.heatEvaporation'));
      recommendations.push(translate('analytics.healthScore.recs.heatShielding'));
      trendReason = translate('analytics.healthScore.trendReasons.heatStress');
    } else {
      trendReason = translate('analytics.healthScore.trendReasons.suboptimalSoil');
    }

    if (targetFarms.some(f => f.cropHealth === 'moderate')) {
      breakdown[3] = { label: translate('analytics.healthScore.metrics.pests'), value: translate('analytics.healthScore.values.elevated'), status: 'warning' };
      detailedExplanation.push(translate('analytics.healthScore.details.earlyDisease'));
      recommendations.push(translate('analytics.healthScore.recs.monitorFungal'));
      if (!weather || weather.temperature <= 30) trendReason = translate('analytics.healthScore.trendReasons.earlyDisease');
    }
  } else if (finalScore < 90) {
    state = 'Stable';
    color = '#3B82F6'; // Info blue
    insight = translate('analytics.healthScore.insights.stable');
    detailedExplanation.push(translate('analytics.healthScore.details.metricsBaseline'));
    recommendations.push(translate('analytics.healthScore.recs.maintainIrrigation'));
    
    if (weather && weather.rainfall > 10) {
      breakdown[1] = { label: translate('analytics.healthScore.metrics.weather'), value: translate('analytics.healthScore.values.rainfall'), status: 'good' };
      insight = translate('analytics.healthScore.insights.rainfall');
      detailedExplanation.push(translate('analytics.healthScore.details.precipitationSupplementing'));
      recommendations.push(translate('analytics.healthScore.recs.reduceIrrigation'));
      trend = 'up';
      trendReason = translate('analytics.healthScore.trendReasons.rainfallRestored');
    } else {
      trend = seed ? 'up' : 'stable';
      trendReason = trend === 'up' ? translate('analytics.healthScore.trendReasons.tempStabilized') : translate('analytics.healthScore.trendReasons.healthyRange');
    }
  } else {
    // Excellent
    detailedExplanation.push(translate('analytics.healthScore.details.peakEfficiency'));
    detailedExplanation.push(translate('analytics.healthScore.details.perfectlyAligned'));
    recommendations.push(translate('analytics.healthScore.recs.continueOptimal'));
    trend = seed ? 'up' : 'stable';
    trendReason = trend === 'up' ? translate('analytics.healthScore.trendReasons.irrigationEfficiency') : translate('analytics.healthScore.trendReasons.peakEfficiency');
  }

  return {
    score: finalScore,
    state,
    color,
    insight,
    trend,
    trendReason,
    detailedExplanation,
    recommendations,
    breakdown
  };
};
