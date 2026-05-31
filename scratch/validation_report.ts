import { calculateFarmHealthScore, buildIrrigationRecommendation, generateCropRecommendations, generateAIPrediction } from '../services/analyticsService';
import { Farm, WeatherData } from '../types/farm';
import * as fs from 'fs';

const dummyWeather: WeatherData = {
  temperature: 38,
  humidity: 40,
  condition: 'sunny',
  windSpeed: 10,
  soilMoisture: 30, // unused for farm specific calculations
  forecast: [
    { day: 'Today', temperature: 38, condition: 'sunny', rainfall: 5, humidity: 40 }
  ],
  uvIndex: 10
};

const createMockFarm = (id: string, name: string, cropType: string, soilType: string, moisture: number, health: 'good' | 'moderate' | 'poor'): Farm => ({
  id,
  name,
  location: { latitude: 0, longitude: 0 },
  cropType: cropType as any,
  soilType: soilType as any,
  soilMoisture: moisture,
  temperature: 38,
  humidity: 40,
  nitrogen: 50,
  phosphorus: 30,
  potassium: 40,
  cropHealth: health,
  area: 10,
  plantingDate: new Date().toISOString()
});

const scenarios = [
  {
    name: 'Rice + Clay Soil + Rain Tomorrow (High Moisture)',
    farm: createMockFarm('1', 'Field 1', 'rice', 'clay', 85, 'good'),
    weather: { ...dummyWeather, forecast: [{ day: 'Today', temperature: 28, condition: 'rainy', rainfall: 90, humidity: 80 }] }
  },
  {
    name: 'Tomato + Sandy Soil + 38°C (Low Moisture)',
    farm: createMockFarm('2', 'Field 2', 'tomato', 'sandy', 40, 'good'),
    weather: dummyWeather
  },
  {
    name: 'Cotton + Moderate Moisture + Cloudy Conditions',
    farm: createMockFarm('3', 'Field 3', 'cotton', 'loam', 60, 'good'),
    weather: { ...dummyWeather, temperature: 25, forecast: [{ day: 'Today', temperature: 25, condition: 'cloudy', rainfall: 20, humidity: 50 }] }
  },
  {
    name: 'Rice + Clay + 95% Moisture + 80% Rain + 28°C + 90% Humidity',
    farm: createMockFarm('4', 'Field 4', 'rice', 'clay', 95, 'good'),
    weather: { ...dummyWeather, temperature: 28, humidity: 90, forecast: [{ day: 'Today', temperature: 28, condition: 'rainy', rainfall: 80, humidity: 90 }] }
  }
];

let mdReport = '# Intelligence Engine Validation Report\n\n';

for (const s of scenarios) {
  const healthScore = calculateFarmHealthScore([s.farm], s.farm, s.weather);
  const recs = generateCropRecommendations(s.farm, s.weather);
  const aiPred = generateAIPrediction(s.farm, s.weather);

  mdReport += `## Scenario: ${s.name}\n\n`;
  
  mdReport += `### 1. Health Score Breakdown\n`;
  mdReport += `- **Final Score:** ${healthScore.score}\n`;
  mdReport += `- **Base Score:** ${healthScore.baseScore}\n`;
  mdReport += `- **Modifiers:**\n`;
  healthScore.scoreBreakdown.forEach(m => {
    mdReport += `  - ${m.label}: ${m.value}\n`;
  });
  
  mdReport += `\n### 2. Top Contributors\n`;
  healthScore.topContributors.forEach(c => {
    mdReport += `  - ${c.label} (${c.value})\n`;
  });

  mdReport += `\n### 3. Generated Recommendations\n`;
  recs.forEach(r => {
    mdReport += `- ${r}\n`;
  });

  mdReport += `\n### 4. AI Prediction Alert\n`;
  mdReport += `- **Text:** ${aiPred.text}\n`;
  mdReport += `- **Type/Level:** ${aiPred.type} / ${aiPred.level}\n\n`;
  mdReport += `---\n\n`;
}

fs.writeFileSync('C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\3c66401b-b5e1-41c0-8da0-eb62517c6447\\validation_report.md', mdReport);
console.log('Validation report generated.');
