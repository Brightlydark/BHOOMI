// services/mockData.ts
import { Farm, CropHealthStatus, Coordinates } from '../types/farm';
import { Insight, WeatherData, SoilAnalysis, CropSuggestion } from '../types/insight';

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
    'Smart Agri Center',
    'Modern Farming Hub',
    'Eco Farm Solutions',
    'Precision Agri Plot',
    'Digital Farm Zone',
    'Tech Enabled Farm',
    'Innovation Agriculture',
  ];

  for (let i = 0; i < count; i++) {
    // Generate location within ~50km radius
    const angle = randomInRange(0, 360);
    const distance = randomInRange(1, 50);
    
    const latOffset = (distance / 111) * Math.cos(angle * Math.PI / 180);
    const lonOffset = (distance / (111 * Math.cos(userLocation.latitude * Math.PI / 180))) * 
                      Math.sin(angle * Math.PI / 180);

    const farmLocation: Coordinates = {
      latitude: userLocation.latitude + latOffset,
      longitude: userLocation.longitude + lonOffset,
    };

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

/**
 * Generate insights based on farm data and region
 */
export const generateInsights = (
  farms: Farm[],
  region?: string
): Insight[] => {
  const insights: Insight[] = [];
  let idCounter = 1;

  if (farms.length === 0) {
    return insights;
  }

  // Analyze overall farm conditions
  const avgMoisture = farms.reduce((sum, f) => sum + f.soilMoisture, 0) / farms.length;
  const avgTemp = farms.reduce((sum, f) => sum + f.temperature, 0) / farms.length;

  // Temperature-based general alert
  if (avgTemp > 30) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'irrigation_recommendation',
      title: 'High Temperature Alert',
      description: `Average temperature across your farms is ${avgTemp.toFixed(1)}°C, above optimal range.`,
      recommendation: 'Increase irrigation frequency by 20-30%. Consider shade nets for sensitive crops.',
      severity: avgTemp > 35 ? 'high' : 'medium',
      createdAt: new Date(),
      region,
    });
  }

  // Farm-specific alerts
  farms.forEach(farm => {
    // Low moisture alert
    if (farm.soilMoisture < 45) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'irrigation_recommendation',
        title: `Low Moisture — ${farm.name}`,
        description: `${farm.name} is at ${farm.soilMoisture}% soil moisture (optimal: 50-70%). Crops risk wilting.`,
        recommendation: `Immediately irrigate ${farm.name}. Check drip lines for blockages. Apply mulch to reduce evaporation.`,
        severity: farm.soilMoisture < 35 ? 'critical' : 'high',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // High temperature alert per farm
    if (farm.temperature > 33) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'weather_forecast',
        title: `Heat Stress — ${farm.name}`,
        description: `${farm.name} is recording ${farm.temperature}°C. ${farm.cropType ? `${farm.cropType} crop` : 'Crop'} may suffer heat stress above 32°C.`,
        recommendation: `Irrigate ${farm.name} in early morning or evening to reduce heat stress. Avoid overhead irrigation.`,
        severity: farm.temperature > 36 ? 'critical' : 'medium',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Poor health alert
    if (farm.cropHealth === 'poor') {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'fertilizer_recommendation',
        title: `Nutrient Deficiency — ${farm.name}`,
        description: `${farm.name} shows poor crop health likely due to nutrient deficiency or pest damage.`,
        recommendation: `Conduct soil testing at ${farm.name}. Apply NPK fertilizer (19:19:19) at 200 kg/ha. Inspect for pest damage.`,
        severity: 'high',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // High humidity + warmth = pest risk
    if ((farm.humidity ?? 60) > 70 && farm.temperature > 26) {
      insights.push({
        id: `insight_${idCounter++}_${farm.id}`,
        type: 'pest_control',
        title: `Pest Risk — ${farm.name}`,
        description: `High humidity (${farm.humidity ?? '~70'}%) and warmth at ${farm.name} create ideal fungal and pest conditions.`,
        recommendation: `Scout ${farm.name} for aphids, stem borers, and powdery mildew. Apply neem oil or copper fungicide preventively.`,
        severity: 'medium',
        createdAt: new Date(),
        region,
        farmId: farm.id,
      });
    }

    // Crop suggestion based on current type and season
    if (farm.cropType) {
      const month = new Date().getMonth();
      const isMonsoon = month >= 5 && month <= 9;
      if (isMonsoon) {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Monsoon Crop Tip — ${farm.name}`,
          description: `${farm.name} (currently: ${farm.cropType}) is in monsoon season. Optimal time for water-intensive crops.`,
          recommendation: `Consider rice, maize, or sugarcane as companion or next crop at ${farm.name}. Ensure proper field drainage.`,
          severity: 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      }

      // Crop-specific tailored insights
      const typeLower = farm.cropType.toLowerCase();
      if (typeLower === 'rice') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Water Retention — ${farm.name}`,
          description: `Rice requires constant soil saturation. Current moisture is ${farm.soilMoisture}%.`,
          recommendation: `Maintain 3-5cm standing water. Check bunds for leakages to prevent water loss and ensure optimal flooding.`,
          severity: farm.soilMoisture < 60 ? 'high' : 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'wheat') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Heat Stress & Timing — ${farm.name}`,
          description: `Wheat is sensitive to terminal heat stress above 30°C.`,
          recommendation: `Apply light irrigation during grain filling stage to cool the micro-climate. Avoid waterlogging.`,
          severity: farm.temperature > 30 ? 'medium' : 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'tomato') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Fungal & Pest Monitoring — ${farm.name}`,
          description: `Tomatoes are highly susceptible to early blight and fruit borers.`,
          recommendation: `Apply prophylactic fungicides if humidity exceeds 70%. Use pheromone traps for fruit borer monitoring.`,
          severity: (farm.humidity && farm.humidity > 70) ? 'high' : 'medium',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'sugarcane') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Nutrient & Moisture Mgmt — ${farm.name}`,
          description: `Sugarcane has high nutrient and moisture demands during the grand growth phase.`,
          recommendation: `Ensure adequate nitrogen top-dressing and maintain soil moisture above 65%. Earthing up is recommended.`,
          severity: farm.soilMoisture < 65 ? 'medium' : 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'millets') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Drought Handling — ${farm.name}`,
          description: `Millets are drought-tolerant but prolonged dry spells can reduce yield.`,
          recommendation: `Perform inter-cultivation to create soil mulch. Provide life-saving irrigation if available during flowering.`,
          severity: 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'cotton') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Bollworm & Moisture Mgmt — ${farm.name}`,
          description: `Cotton is vulnerable to bollworms and water-logging.`,
          recommendation: `Ensure proper drainage to prevent root rot. Install pheromone traps for pink bollworm monitoring.`,
          severity: farm.soilMoisture > 70 ? 'high' : 'medium',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      } else if (typeLower === 'vegetables') {
        insights.push({
          id: `insight_${idCounter++}_${farm.id}`,
          type: 'crop_suggestion',
          title: `Harvest & Nutrient Tip — ${farm.name}`,
          description: `Vegetables require frequent harvesting and balanced nutrition.`,
          recommendation: `Apply foliar micronutrient spray. Harvest mature produce in the morning to maintain freshness.`,
          severity: 'low',
          createdAt: new Date(),
          region,
          farmId: farm.id,
        });
      }
    }
  });

  // Seasonal general recommendation
  const month = new Date().getMonth();
  if (month >= 5 && month <= 9) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'crop_suggestion',
      title: 'Monsoon Season Opportunity',
      description: 'It is the optimal monsoon planting window for your region.',
      recommendation: 'Primary crops to consider: Rice, Cotton, Maize, Groundnut. Ensure field drainage and bund repair before heavy rains.',
      severity: 'low',
      createdAt: new Date(),
      region,
    });
  }

  // General pest alert
  if (avgTemp > 28 && avgMoisture > 60) {
    insights.push({
      id: `insight_${idCounter++}`,
      type: 'pest_control',
      title: 'Favorable Pest Conditions Across Farms',
      description: 'High temperature and humidity across farms create widespread pest activity risk.',
      recommendation: 'Monitor all fields for stem borer, aphids, and whitefly. Use neem-based pesticides preventively.',
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
    });
  }

  return {
    temperature: Math.round(currentTemp * 10) / 10,
    humidity: Math.round(randomInRange(50, 85)),
    rainfall: Math.round(randomInRange(0, 100)),
    windSpeed: Math.round(randomInRange(5, 25)),
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
