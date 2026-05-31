import { Farm, CropHealthStatus, Coordinates } from '../types/farm';
import { Insight, WeatherData, SoilAnalysis, CropSuggestion } from '../types/insight';
import { validateLocationSync } from './locationValidator';

/**
 * Generate random number within range
 */
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate random crop health status based on conditions
 */
const generateCropHealth = (moisture: number, temp: number): CropHealthStatus => {
  if (moisture < 40 || temp > 35) return 'poor';
  if (moisture < 55 || temp > 32) return 'moderate';
  return 'good';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) *
    Math.cos(coord2.latitude * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Generate nearby farm locations based on user's coordinates
 */
export const generateNearbyFarms = (
  userLocation: Coordinates,
  count: number = 15
): Farm[] => {
  const farms: Farm[] = [];
  const farmNames = [
    'Green Valley Farm',
    'Sunrise Orchards',
    'Golden Harvest Estate',
    'River Bend Plantation',
    'Hill View Agriculture',
    'Organic Fields',
    'Krishna Krishi Kendra',
    'Lakshmi Agro Farm',
    'Raita Mitra Farm',
    'Bharat Kheti Bhumi',
    'Suresh Organic Farm',
    'Ganesh Crop Fields',
    'Village Farm House',
    'BHOOMI Demo Farm',
    'Modern Farming Hub',
    'Eco Farm Solutions',
    'Precision Agri Plot',
    'Digital Farm Zone',
    'Tech Enabled Farm',
    'Innovation Agriculture',
  ];

  for (let i = 0; i < count; i++) {
    let farmLocation: Coordinates | null = null;
    let distance = 0;
    
    // Try up to 50 times to find a valid location
    for (let attempt = 0; attempt < 50; attempt++) {
      const angle = randomInRange(0, 360);
      const tempDist = randomInRange(1, 50);
      
      const latOffset = (tempDist / 111) * Math.cos(angle * Math.PI / 180);
      const lonOffset = (tempDist / (111 * Math.cos(userLocation.latitude * Math.PI / 180))) * 
                        Math.sin(angle * Math.PI / 180);
  
      const testLocation = {
        latitude: userLocation.latitude + latOffset,
        longitude: userLocation.longitude + lonOffset,
      };

      const validation = validateLocationSync(testLocation.latitude, testLocation.longitude);
      if (validation.isValid) {
        farmLocation = testLocation;
        distance = tempDist;
        break;
      }
    }

    // Fallback if we somehow fail 50 times (unlikely, but just in case)
    if (!farmLocation) {
      farmLocation = {
        latitude: userLocation.latitude + (randomInRange(20, 50) / 111),
        longitude: userLocation.longitude + (randomInRange(20, 50) / 111),
      };
      distance = calculateDistance(userLocation, farmLocation);
    }

    // Generate realistic environmental data based on location
    const baseTemp = 25; // Base temperature in Celsius
    const tempVariation = randomInRange(-5, 10);
    const temperature = Math.round((baseTemp + tempVariation) * 10) / 10;
    
    const baseMoisture = 60;
    const moistureVariation = randomInRange(-30, 20);
    const soilMoisture = Math.max(20, Math.min(90, baseMoisture + moistureVariation));
    
    const humidity = Math.round(randomInRange(40, 80));
    const cropHealth = generateCropHealth(soilMoisture, temperature);

    const cropTypes = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Tomato', 'Millets', 'Vegetables'];
    
    farms.push({
      id: `farm_${i + 1}`,
      name: farmNames[i % farmNames.length] + ` ${Math.floor(i / farmNames.length) + 1}`,
      location: farmLocation,
      address: `Plot ${i + 1}, Village Area, Karnataka`,
      soilMoisture: Math.round(soilMoisture),
      temperature,
      humidity,
      cropHealth,
      cropType: cropTypes[Math.floor(Math.random() * cropTypes.length)],
      lastUpdated: new Date(),
      distance: calculateDistance(userLocation, farmLocation),
    });
  }

  return farms.sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

// ── Soil profile helpers (mirrors analyticsService for self-contained use) ──
const _soilDrainageFactor = (soilType?: string): number => {
  if (!soilType) return 0.50;
  const s = soilType.toLowerCase();
  if (s.includes('clay') || s.includes('black')) return 0.15;
  if (s.includes('silt')) return 0.30;
  if (s.includes('loam')) return 0.50;
  if (s.includes('red') || s.includes('later')) return 0.65;
  if (s.includes('sand')) return 0.90;
  return 0.50;
};

const _soilWaterlogRisk = (soilType?: string): number => {
  if (!soilType) return 0.35;
  const s = soilType.toLowerCase();
  if (s.includes('clay') || s.includes('black')) return 0.85;
  if (s.includes('silt')) return 0.65;
  if (s.includes('loam')) return 0.35;
  if (s.includes('red') || s.includes('later')) return 0.25;
  if (s.includes('sand')) return 0.10;
  return 0.35;
};

// ── Crop critical moisture thresholds ──────────────────────────────────────
const _cropMoistureCritical = (cropType?: string): number => {
  if (!cropType) return 35;
  const c = cropType.toLowerCase();
  if (c.includes('rice') || c.includes('paddy')) return 55;
  if (c.includes('sugarcane')) return 45;
  if (c.includes('tomato')) return 40;
  if (c.includes('wheat') || c.includes('maize') || c.includes('corn')) return 35;
  if (c.includes('cotton')) return 25;
  if (c.includes('millet') || c.includes('jowar') || c.includes('bajra')) return 20;
  return 35;
};

const _cropHeatStressTemp = (cropType?: string): number => {
  if (!cropType) return 33;
  const c = cropType.toLowerCase();
  if (c.includes('tomato') || c.includes('wheat')) return 30;
  if (c.includes('rice') || c.includes('maize')) return 35;
  if (c.includes('cotton') || c.includes('sugarcane')) return 38;
  if (c.includes('millet') || c.includes('jowar')) return 40;
  return 33;
};

/**
 * Generate insights based on farm data and region — multi-factor soil+crop aware engine
 */
export const generateInsights = (
  farms: Farm[],
  region?: string
): Insight[] => {
  const insights: Insight[] = [];
  let idCounter = 1;

  if (farms.length === 0) return insights;

  const avgMoisture = farms.reduce((sum, f) => sum + f.soilMoisture, 0) / farms.length;
  const avgTemp = farms.reduce((sum, f) => sum + f.temperature, 0) / farms.length;

  // ── Global temperature alert ───────────────────────────────────────────
  if (avgTemp > 30) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'irrigation_recommendation',
      title: 'High Temperature Alert',
      description: `Average temperature across your farms is ${avgTemp.toFixed(1)}°C — above optimal range for most crops.`,
      recommendation: 'Shift irrigation to early morning (5–7 AM) or post-sunset. Apply mulching on drought-sensitive crops to reduce soil surface temperature.',
      severity: avgTemp > 35 ? 'high' : 'medium',
      createdAt: new Date(),
      region,
    });
  }

  // ── Farm-specific alerts ───────────────────────────────────────────────
  farms.forEach(farm => {
    const soilType = (farm as any).soilType as string | undefined;
    const drainageFactor = _soilDrainageFactor(soilType);
    const waterlogRisk = _soilWaterlogRisk(soilType);
    const moistureCritical = _cropMoistureCritical(farm.cropType);
    const heatStress = _cropHeatStressTemp(farm.cropType);
    const cropLabel = farm.cropType ?? 'Crop';
    const soilLabel = soilType ?? 'soil';

    // Critical moisture deficit
    if (farm.soilMoisture < moistureCritical) {
      const urgencyText = drainageFactor > 0.7
        ? `${soilLabel} drains rapidly — moisture will drop further without immediate action.`
        : '';
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'irrigation_recommendation',
        title: `Critical Moisture Deficit — ${farm.name}`,
        description: `${farm.name} (${cropLabel}) is at ${farm.soilMoisture}% moisture — below the critical threshold of ${moistureCritical}% for this crop. ${urgencyText}`,
        recommendation: `Irrigate within 12 hours. Use drip or furrow irrigation to minimise evaporation. Check for blocked emitters or broken lateral lines.`,
        severity: farm.soilMoisture < moistureCritical - 10 ? 'critical' : 'high',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    } else if (farm.soilMoisture < 45 && drainageFactor > 0.65) {
      // Sub-critical on sandy/red soil
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'irrigation_recommendation',
        title: `Rapid Dehydration Risk — ${farm.name}`,
        description: `${farm.name} soil moisture is at ${farm.soilMoisture}% on ${soilLabel}. Fast-draining soil will deplete this quickly in hot weather.`,
        recommendation: `Schedule irrigation within 18–24 hours. Consider mulching and organic matter addition to improve ${soilLabel} water retention.`,
        severity: 'medium',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Waterlogging risk — clay/black soil + high moisture
    if (waterlogRisk > 0.65 && farm.soilMoisture > 80) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'irrigation_recommendation',
        title: `Waterlogging Risk — ${farm.name}`,
        description: `${farm.name} (${cropLabel}) has ${farm.soilMoisture}% soil moisture on ${soilLabel} — a high-retention soil. Waterlogging may impair root respiration.`,
        recommendation: `Halt all irrigation. Clear drainage channels and open furrows to allow water escape. Monitor for wilting or yellowing leaves indicating root suffocation.`,
        severity: farm.soilMoisture > 90 ? 'critical' : 'high',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Heat stress (crop-aware threshold)
    if (farm.temperature > heatStress) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'weather_forecast',
        title: `Heat Stress — ${farm.name}`,
        description: `${farm.name} is recording ${farm.temperature}°C. ${cropLabel} begins experiencing heat stress above ${heatStress}°C — photosynthesis efficiency drops significantly.`,
        recommendation: `Irrigate in early morning or after sunset. Apply kaolin clay spray or shade nets if temperature persists above ${heatStress + 3}°C. Avoid fertiliser application during heat peaks.`,
        severity: farm.temperature > heatStress + 5 ? 'critical' : 'medium',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Poor crop health
    if (farm.cropHealth === 'poor') {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'fertilizer_recommendation',
        title: `Crop Health Alert — ${farm.name}`,
        description: `${farm.name} (${cropLabel}) is showing poor health. Likely causes: nutrient deficiency, pest pressure, or water stress on ${soilLabel}.`,
        recommendation: `Conduct visual scouting for pest damage and disease lesions. Apply foliar NPK (19:19:19) at 1% concentration. Test soil pH and adjust if outside 6.0–7.5 range.`,
        severity: 'high',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // High humidity + warmth = fungal/pest risk
    if ((farm.humidity ?? 60) > 75 && farm.temperature > 26) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'pest_control',
        title: `Fungal & Pest Risk — ${farm.name}`,
        description: `Humidity at ${farm.humidity ?? '~75'}% and ${farm.temperature}°C at ${farm.name} create ideal conditions for fungal pathogens and insect pest outbreaks on ${cropLabel}.`,
        recommendation: `Scout for aphids, whitefly, stem borers, and powdery mildew. Apply copper-based fungicide or neem oil preventively. Avoid overhead irrigation until humidity drops below 70%.`,
        severity: farm.humidity && farm.humidity > 85 ? 'high' : 'medium',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Crop-specific insights
    if (farm.cropType) {
      const month = new Date().getMonth();
      const isMonsoon = month >= 5 && month <= 9;
      const typeLower = farm.cropType.toLowerCase();

      if (isMonsoon && (typeLower === 'rice' || typeLower === 'paddy')) {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Rice Water Management — ${farm.name}`,
          description: `Rice at ${farm.name} requires 70–95% soil saturation. Current moisture is ${farm.soilMoisture}%. Monsoon season — manage standing water carefully.`,
          recommendation: `Maintain 3–5 cm standing water. Inspect bunds for leakages. Drain field for 1–2 days every 10 days to prevent methane build-up and root disease.`,
          severity: farm.soilMoisture < 60 ? 'high' : 'low',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower === 'tomato') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Tomato Stress Monitoring — ${farm.name}`,
          description: `Tomato at ${farm.name} is sensitive to both overwatering (${farm.soilMoisture > 80 ? 'RISK: current moisture ' + farm.soilMoisture + '%' : 'currently safe'}) and heat stress above 30°C.`,
          recommendation: `Use drip irrigation only. Monitor for early blight and blossom drop if temperature exceeds 30°C. Apply calcium nitrate to prevent blossom-end rot.`,
          severity: farm.soilMoisture > 80 || farm.temperature > 32 ? 'high' : 'medium',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower === 'cotton') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Cotton Management — ${farm.name}`,
          description: `Cotton at ${farm.name} is drought-tolerant but highly sensitive to waterlogging. Current moisture: ${farm.soilMoisture}% on ${soilLabel}.`,
          recommendation: `${waterlogRisk > 0.65 ? 'High-retention soil detected — ensure furrow drainage is clear. ' : ''}Install pheromone traps for pink bollworm. Irrigate only when moisture drops below 40%.`,
          severity: farm.soilMoisture > 75 && waterlogRisk > 0.65 ? 'high' : 'medium',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower === 'sugarcane') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Sugarcane Nutrition — ${farm.name}`,
          description: `Sugarcane at ${farm.name} has high water and nitrogen demands. Moisture at ${farm.soilMoisture}% (target: 65–85%).`,
          recommendation: `Maintain moisture above 65%. Apply nitrogen top-dressing at 50 kg/ha. Perform earthing-up to support stalk elongation and improve drainage.`,
          severity: farm.soilMoisture < 65 ? 'medium' : 'low',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower.includes('millet') || typeLower.includes('jowar') || typeLower.includes('bajra')) {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Millet Drought Management — ${farm.name}`,
          description: `Millets at ${farm.name} are drought-resistant. Moisture at ${farm.soilMoisture}% is ${farm.soilMoisture > 30 ? 'adequate' : 'approaching the critical threshold'}.`,
          recommendation: `Perform inter-cultivation to create soil mulch and conserve moisture. Apply life-saving irrigation (${drainageFactor > 0.7 ? 'prioritise due to fast-draining ' + soilLabel + ' soil' : 'if available'}) during the flowering stage.`,
          severity: 'low',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower === 'wheat') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Wheat Heat & Moisture — ${farm.name}`,
          description: `Wheat at ${farm.name} is sensitive to heat above 30°C and waterlogging. Current: ${farm.temperature}°C, ${farm.soilMoisture}% moisture.`,
          recommendation: `Apply light irrigation during grain-filling if temperature exceeds 30°C. Avoid waterlogging — ${soilLabel} has ${waterlogRisk > 0.6 ? 'high' : 'low'} retention.`,
          severity: farm.temperature > 30 ? 'medium' : 'low',
          createdAt: new Date(), region, farmId: farm.id,
        });
      } else if (typeLower === 'vegetables') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Vegetable Nutrient Plan — ${farm.name}`,
          description: `Vegetables at ${farm.name} require consistent moisture (55–75%) and balanced macro/micronutrients. Current moisture: ${farm.soilMoisture}%.`,
          recommendation: `Apply foliar micronutrient spray (zinc + boron). Harvest in early morning. ${farm.soilMoisture > 75 ? 'Reduce irrigation — overwatering risk on current soil.' : 'Maintain drip irrigation cycles.'}`,
          severity: 'low',
          createdAt: new Date(), region, farmId: farm.id,
        });
      }
    }
  });

  // Seasonal advice
  const month = new Date().getMonth();
  if (month >= 5 && month <= 9) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'crop_suggestion',
      title: 'Monsoon Season — Drainage Priority',
      description: 'Monsoon season creates high waterlogging risk on clay and black cotton soils across Karnataka.',
      recommendation: 'Inspect and clear all field drainage channels. Repair damaged bunds. For clay/black soil farms, avoid planting waterlogging-sensitive crops like cotton or tomato without raised-bed preparation.',
      severity: 'low',
      createdAt: new Date(),
      region,
    });
  }

  // Global pest alert
  if (avgTemp > 28 && avgMoisture > 60) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'pest_control',
      title: 'Region-Wide Pest Pressure',
      description: `Warm temperatures (${avgTemp.toFixed(1)}°C avg) and high moisture (${avgMoisture.toFixed(0)}% avg) across farms are creating conditions for widespread pest activity.`,
      recommendation: 'Monitor all fields for stem borer, aphids, and whitefly. Use neem-based pesticides or bio-pesticides preventively. Set up yellow sticky traps in vulnerable plots.',
      severity: 'medium',
      createdAt: new Date(),
      region,
    });
  }

  return insights;
};

/**
 * Generate weather data for location
 */
export const generateWeatherData = (location: Coordinates): WeatherData => {
  const currentTemp = randomInRange(22, 35);
  const forecast = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date,
      minTemp: Math.round(currentTemp - randomInRange(3, 7)),
      maxTemp: Math.round(currentTemp + randomInRange(2, 8)),
      rainfall: Math.random() > 0.7 ? randomInRange(0, 50) : 0,
      condition: Math.random() > 0.7 ? 'rainy' : Math.random() > 0.5 ? 'cloudy' : 'sunny',
      icon: Math.random() > 0.7 ? 'CloudRain' : Math.random() > 0.5 ? 'Cloud' : 'Sun',
    });
  }

  return {
    temperature: Math.round(currentTemp * 10) / 10,
    humidity: Math.round(randomInRange(50, 85)),
    rainfall: Math.round(randomInRange(0, 100)),
    windSpeed: Math.round(randomInRange(5, 25)),
    condition: 'Partly cloudy',
    icon: 'Cloud',
    uvIndex: 5,
    forecast,
  };
};

/**
 * Generate soil analysis for a farm
 */
export const generateSoilAnalysis = (farmId: string): SoilAnalysis => {
  const moisture = randomInRange(30, 80);
  const ph = randomInRange(5.5, 8.0);
  
  const analysis: SoilAnalysis = {
    moisture: Math.round(moisture),
    ph: Math.round(ph * 10) / 10,
    nitrogen: Math.round(randomInRange(150, 350)),
    phosphorus: Math.round(randomInRange(20, 80)),
    potassium: Math.round(randomInRange(100, 300)),
    organicMatter: Math.round(randomInRange(1.5, 4.5) * 10) / 10,
    recommendations: [],
  };

  // Generate recommendations based on values
  if (analysis.moisture < 40) {
    analysis.recommendations.push('Increase irrigation frequency');
  }
  if (analysis.ph < 6.0) {
    analysis.recommendations.push('Apply lime to increase soil pH');
  } else if (analysis.ph > 7.5) {
    analysis.recommendations.push('Add organic matter to reduce pH');
  }
  if (analysis.nitrogen < 200) {
    analysis.recommendations.push('Apply nitrogen-rich fertilizer (Urea)');
  }
  if (analysis.phosphorus < 30) {
    analysis.recommendations.push('Increase phosphorus (Superphosphate)');
  }
  if (analysis.organicMatter < 2.5) {
    analysis.recommendations.push('Add compost or farmyard manure');
  }

  return analysis;
};

/**
 * Generate crop suggestions based on conditions
 */
export const generateCropSuggestions = (
  soilMoisture: number,
  temperature: number,
  season: string
): CropSuggestion[] => {
  const suggestions: CropSuggestion[] = [];

  // Rice
  if (soilMoisture > 60 && temperature >= 20 && temperature <= 35) {
    suggestions.push({
      cropName: 'Rice',
      suitability: 85,
      expectedYield: '5-7 tons/hectare',
      growingPeriod: '120-150 days',
      waterRequirement: 'high',
      fertilizers: ['NPK 20:10:10', 'Urea', 'DAP'],
    });
  }

  // Wheat
  if (temperature >= 15 && temperature <= 25) {
    suggestions.push({
      cropName: 'Wheat',
      suitability: 75,
      expectedYield: '4-5 tons/hectare',
      growingPeriod: '120-130 days',
      waterRequirement: 'medium',
      fertilizers: ['NPK 12:32:16', 'Urea'],
    });
  }

  // Cotton
  if (temperature >= 21 && temperature <= 30 && soilMoisture > 45) {
    suggestions.push({
      cropName: 'Cotton',
      suitability: 80,
      expectedYield: '15-20 quintals/hectare',
      growingPeriod: '180-200 days',
      waterRequirement: 'medium',
      fertilizers: ['NPK 17:17:17', 'Potash'],
    });
  }

  // Vegetables (general)
  suggestions.push({
    cropName: 'Vegetables (Tomato, Beans)',
    suitability: 70,
    expectedYield: 'Varies by crop',
    growingPeriod: '60-90 days',
    waterRequirement: 'medium',
    fertilizers: ['NPK 19:19:19', 'Organic compost'],
  });

  return suggestions.sort((a, b) => b.suitability - a.suitability);
};

/**
 * Generate realistic crop-specific insights for a newly added farm.
 * Used immediately after addFarm to make the app feel intelligent.
 */
export const generateFarmInsights = (farm: Farm): Insight[] => {
  const now = new Date();
  const insights: Insight[] = [];
  const crop = farm.cropType || 'your crop';
  const id = () => `user_insight_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Irrigation insight based on moisture
  if (farm.soilMoisture < 45) {
    insights.push({
      id: id(),
      farmId: farm.id,
      type: 'irrigation_recommendation',
      title: 'Irrigation Recommended',
      description: `Soil moisture at ${farm.soilMoisture}% — below optimal range for ${crop}. Schedule irrigation within the next 24 hours to prevent stress.`,
      recommendation: `Apply 30–40mm of water via drip or sprinkler in the early morning (5–7 AM). Re-check moisture 6 hours after irrigation.`,
      severity: farm.soilMoisture < 35 ? 'critical' : 'high',
      createdAt: now,
    });
  } else if (farm.soilMoisture > 80) {
    insights.push({
      id: id(),
      farmId: farm.id,
      type: 'irrigation_recommendation',
      title: 'Excess Moisture Detected',
      description: `Soil moisture at ${farm.soilMoisture}% — too high for ${crop}. Risk of waterlogging and root rot.`,
      recommendation: `Improve drainage channels around the field. Pause irrigation for at least 48 hours and monitor for early signs of fungal disease.`,
      severity: 'medium',
      createdAt: now,
    });
  }

  // Temperature/heat stress insight
  if (farm.temperature > 33) {
    insights.push({
      id: id(),
      farmId: farm.id,
      type: 'weather_forecast',
      title: 'Heat Stress Alert',
      description: `Temperature at ${farm.temperature}°C is above the stress threshold for ${crop}. Expect reduced photosynthesis and possible leaf scorch.`,
      recommendation: `Apply light shade netting if available. Increase irrigation to 2× per day and irrigate in early morning or evening only.`,
      severity: 'high',
      createdAt: now,
    });
  }

  // Soil health insight
  insights.push({
    id: id(),
    farmId: farm.id,
    type: 'soil_analysis',
    title: 'Initial Soil Assessment',
    description: `Baseline soil analysis for ${farm.name}. Moisture: ${farm.soilMoisture}%, temperature: ${farm.temperature}°C. Crop health is ${farm.cropHealth}.`,
    recommendation: `Conduct a full NPK soil test within the first 2 weeks. Maintain pH between 6.0–7.5. ${crop} responds well to organic matter amendments.`,
    severity: farm.cropHealth === 'good' ? 'low' : farm.cropHealth === 'moderate' ? 'medium' : 'high',
    createdAt: now,
  });

  // Crop-specific fertilizer insight
  const cropFertMap: Record<string, string> = {
    Rice: 'Apply urea at 30 kg/ha at tillering stage. Use DAP at basal.',
    Wheat: 'Use DAP (18:46:0) at sowing; top-dress with urea at crown root initiation.',
    Cotton: 'Apply potash-rich fertilizers at boll formation; monitor for boll weevils.',
    Sugarcane: 'Apply FYM 25 t/ha at planting; split nitrogen into 3 doses.',
    Tomato: 'Use calcium-boron spray weekly to prevent blossom-end rot.',
    Millets: 'Low-input crop — apply compost at 2 t/ha for best results.',
    Vegetables: 'Use 19:19:19 NPK at transplanting; foliar feed fortnightly.',
  };

  const fertTip = cropFertMap[crop] ?? `Follow recommended NPK schedule for ${crop} in your region. Test soil before application.`;
  insights.push({
    id: id(),
    farmId: farm.id,
    type: 'fertilizer_recommendation',
    title: `${crop} Fertilizer Guide`,
    description: `Crop-specific fertilizer recommendations for ${crop} at ${farm.name} to maximise yield.`,
    recommendation: fertTip + ' Avoid over-fertilization — it causes salt burn and soil acidification.',
    severity: 'low',
    createdAt: now,
  });

  // AI-powered crop tip
  insights.push({
    id: id(),
    farmId: farm.id,
    type: 'crop_suggestion',
    title: 'BHOOMI AI Crop Tip',
    description: `Based on current conditions at ${farm.name} (moisture: ${farm.soilMoisture}%, temp: ${farm.temperature}°C), BHOOMI AI recommends proactive field management.`,
    recommendation: `Scout the field every 7 days for early pest detection. Keep a farm diary — log weekly readings to track trends. Pair with a drip irrigation system for up to 40% water savings.`,
    severity: 'low',
    createdAt: now,
  });

  return insights;
};


