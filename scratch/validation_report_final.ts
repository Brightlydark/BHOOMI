import { scoreFarm, calculateFarmHealthScore } from '../services/analyticsService';
import { Farm } from '../types/farm';
import { WeatherData } from '../types/insight';
import fs from 'fs';

const scenarios = [
  {
    name: 'Rice + Clay + Waterlogging',
    farm: {
      id: 'f1', name: 'Field 1', location: { latitude: 0, longitude: 0 }, address: '',
      cropType: 'rice', soilMoisture: 95, temperature: 28, humidity: 90, cropHealth: 'good',
      lastUpdated: new Date()
    } as Farm,
    weather: {
      temperature: 28, humidity: 90, rainfall: 0, windSpeed: 0, condition: '', uvIndex: 4,
      forecast: [{ date: new Date(), minTemp: 24, maxTemp: 28, rainfall: 80, condition: 'rainy' }]
    } as WeatherData,
    soilLabel: 'Clay'
  },
  {
    name: 'Rice + Loam + Healthy',
    farm: {
      id: 'f2', name: 'Field 3', location: { latitude: 0, longitude: 0 }, address: '',
      cropType: 'rice', soilMoisture: 80, temperature: 28, humidity: 60, cropHealth: 'good',
      lastUpdated: new Date()
    } as Farm,
    weather: {
      temperature: 28, humidity: 60, rainfall: 0, windSpeed: 0, condition: '', uvIndex: 4,
      forecast: [{ date: new Date(), minTemp: 24, maxTemp: 28, rainfall: 20, condition: 'cloudy' }]
    } as WeatherData,
    soilLabel: 'Loam'
  },
  {
    name: 'Cotton + Sandy + Drought',
    farm: {
      id: 'f3', name: 'Field 2', location: { latitude: 0, longitude: 0 }, address: '',
      cropType: 'cotton', soilMoisture: 10, temperature: 40, humidity: 40, cropHealth: 'good',
      lastUpdated: new Date()
    } as Farm,
    weather: {
      temperature: 40, humidity: 40, rainfall: 0, windSpeed: 0, condition: '', uvIndex: 10,
      forecast: [{ date: new Date(), minTemp: 30, maxTemp: 40, rainfall: 0, condition: 'sunny' }]
    } as WeatherData,
    soilLabel: 'Sandy'
  },
  {
    name: 'Cotton + Clay + Heat Stress',
    farm: {
      id: 'f4', name: 'Field 4', location: { latitude: 0, longitude: 0 }, address: '',
      cropType: 'cotton', soilMoisture: 60, temperature: 40, humidity: 85, cropHealth: 'good',
      lastUpdated: new Date()
    } as Farm,
    weather: {
      temperature: 40, humidity: 85, rainfall: 0, windSpeed: 0, condition: '', uvIndex: 11,
      forecast: [{ date: new Date(), minTemp: 30, maxTemp: 40, rainfall: 0, condition: 'sunny' }]
    } as WeatherData,
    soilLabel: 'Clay'
  }
];

let totalScenarios = 0;
let totalAssertions = 0;
let totalContradictionsFound = 0;

let report = '# Intelligence Engine Automated Validation Report\n\n';

function assert(condition: boolean, message: string, scenarioName: string) {
  totalAssertions++;
  if (!condition) {
    totalContradictionsFound++;
    console.error(`\n[FAIL] Assertion Failed in Scenario: ${scenarioName}`);
    console.error(`Contradiction: ${message}`);
    process.exit(1);
  }
}

for (const s of scenarios) {
  totalScenarios++;
  
  const score = scoreFarm(s.farm, s.weather);
  const health = calculateFarmHealthScore([s.farm], s.farm, s.weather);
  
  const moistureStatus = health.breakdown.find(b => b.label === 'Moisture')?.value;
  const weatherStatus = health.breakdown.find(b => b.label === 'Weather')?.value;
  const soilStatus = health.breakdown.find(b => b.label === 'Soil')?.value;
  const pestStatus = health.breakdown.find(b => b.label === 'Pest Risk')?.value;
  
  const hasCritical = health.breakdown.some(b => b.status === 'critical');
  const hasWarning = health.breakdown.some(b => b.status === 'warning');

  const topContributors = health.topContributors;
  const scoreBreakdown = health.scoreBreakdown;
  const insight = health.insight;
  const fullExplanation = health.detailedExplanation.join(' ');
  
  const checkModifiers = (keywords: string[]) => {
    return topContributors.some(c => keywords.some(k => c.label.toLowerCase().includes(k.toLowerCase())));
  };
  const checkAllModifiers = (keywords: string[]) => {
    return scoreBreakdown.some(c => keywords.some(k => c.label.toLowerCase().includes(k.toLowerCase())));
  };

  // 1. Moisture Consistency
  if (moistureStatus === 'Optimal') {
    assert(!checkAllModifiers(['Critical Drought', 'Severe Moisture Deficit', 'Drought Warning', 'Drought Penalty']), 
      'Moisture Status is Optimal but Drought/Deficit penalty is active', s.name);
  }

  // 2. Waterlogging Consistency
  if (soilStatus === 'Waterlogged' || soilStatus === 'Waterlogging Risk') {
    assert(!checkAllModifiers(['Optimal Moisture Bonus']), 
      'Soil is Waterlogged but Optimal Moisture Bonus is active', s.name);
  }

  // 3. Weather Consistency
  if (weatherStatus === 'Favourable') {
    assert(!checkAllModifiers(['Heat Stress', 'UV Stress', 'Severe Weather']), 
      'Weather is Favourable but Heat/UV/Weather penalty is active', s.name);
  }

  // 4. Pest Consistency
  const humidity = s.weather.humidity;
  const rain = s.weather.forecast[0].rainfall;
  const temp = s.weather.forecast[0].maxTemp;
  const isWaterlogging = soilStatus === 'Waterlogged' || soilStatus === 'Waterlogging Risk';
  const isExcessMoisture = moistureStatus !== 'Optimal' && moistureStatus !== 'Critical' && s.farm.soilMoisture > 75; // Roughly
  
  // Simplification for the assertion: just check the raw values
  const hasEnvironmentalTrigger = humidity > 80 || s.farm.soilMoisture > 80 || s.farm.soilMoisture < 30 || isWaterlogging || rain > 50 || temp > 30;

  if (pestStatus === 'High Risk' || pestStatus === 'Critical' || pestStatus === 'Elevated') {
    if (s.farm.cropHealth !== 'poor') {
      assert(hasEnvironmentalTrigger, 
        'High/Elevated Pest Risk active without valid environmental triggers (humidity/moisture/waterlogging/rain/heat)', s.name);
    }
  }

  // 5. State Consistency Assertions
  assert(health.scoreCategory !== undefined, 'Score Category is undefined', s.name);
  assert(health.riskLevel !== undefined, 'Risk Level is undefined', s.name);
  
  if (health.scoreCategory === 'Excellent') {
    assert(!hasCritical, 'Score is Excellent but critical components exist', s.name);
    assert(!hasWarning, 'Score is Excellent but warning components exist', s.name);
    assert(pestStatus !== 'High Risk' && pestStatus !== 'Critical', 'Score is Excellent but High Pest Risk exists', s.name);
    assert(weatherStatus !== 'Severe Stress', 'Score is Excellent but Severe Weather Stress exists', s.name);
  }

  if (health.scoreCategory === 'Stable') {
    assert(!hasCritical, 'Score is Stable but critical components exist', s.name);
  }

  if (health.scoreCategory === 'Moderate Risk') {
    assert(health.score < 90, 'Score is Moderate Risk but score >= 90', s.name);
  }

  if (health.scoreCategory === 'Critical') {
    assert(health.score < 50, 'Score is Critical but score >= 50', s.name);
  }

  if (health.riskLevel === 'Critical') {
    assert(hasCritical, 'Risk Level is Critical but no critical components exist', s.name);
  }

  // 6. Contributor Validation
  const labels = topContributors.map(c => c.label);
  assert(new Set(labels).size === labels.length, 'Duplicate top contributors found', s.name);
  
  topContributors.forEach(c => {
    assert(c.value !== 0, `Top contributor ${c.label} has 0 value`, s.name);
    // top contributors must belong to score breakdown
    const inBreakdown = scoreBreakdown.some(b => b.label === c.label && b.value === c.value);
    assert(inBreakdown, `Top contributor ${c.label} (${c.value}) not found in score breakdown`, s.name);
  });

  // 7. Explanation Validation
  if (insight.toLowerCase().includes('sub-optimal')) {
    assert(moistureStatus !== 'Optimal' || weatherStatus !== 'Favourable', 
      'Explanation says conditions sub-optimal but Moisture/Weather are Optimal/Favourable', s.name);
  }
  
  if (insight.toLowerCase().includes('drought') || fullExplanation.toLowerCase().includes('drought') || insight.toLowerCase().includes('dehydration')) {
    assert(checkAllModifiers(['Drought', 'Dehydration']), 
      'Explanation references drought/dehydration but no drought penalty exists', s.name);
  }

  if (insight.toLowerCase().includes('waterlog') || fullExplanation.toLowerCase().includes('waterlog')) {
    assert(checkAllModifiers(['Waterlogging']), 
      'Explanation references waterlogging but no waterlogging penalty exists', s.name);
  }

  // 8. Recommendation Validation
  const fullRecommendations = health.recommendations.join(' ').toLowerCase();
  assert(!fullRecommendations.includes('unknown soil'), 
    'Recommendation contains "Unknown soil"', s.name);

  // 9. Soil Validation (dynamic mapping based on environmental conditions)
  if (s.soilLabel === 'Clay' && hasEnvironmentalTrigger && moistureStatus !== 'Optimal' && moistureStatus !== 'Critical') { // Rough check for excess moisture
    assert(soilStatus !== 'Balanced', 
      'Soil is Clay + Excess Moisture + High Rain but Soil Status is Balanced', s.name);
  }

  // Write report for this scenario
  report += `## Scenario: ${s.name}\n\n`;
  report += `**PASS**\n\n`;
  report += `No contradictions detected.\n\n`;
  
  report += `- **Crop:** ${s.farm.cropType}\n`;
  report += `- **Soil:** ${s.soilLabel}\n`;
  report += `- **Moisture:** ${s.farm.soilMoisture}%\n`;
  report += `- **Temperature:** ${s.weather.forecast[0].maxTemp}°C\n`;
  report += `- **Humidity:** ${s.weather.humidity}%\n`;
  report += `- **Rain Probability:** ${s.weather.forecast[0].rainfall}%\n`;
  report += `- **Final Score:** ${health.score}\n`;
  report += `- **Score Category:** ${health.scoreCategory}\n`;
  report += `- **Risk Level:** ${health.riskLevel}\n`;
  report += `- **Moisture Status:** ${moistureStatus}\n`;
  report += `- **Weather Status:** ${weatherStatus}\n`;
  report += `- **Soil Status:** ${soilStatus}\n`;
  report += `- **Pest Status:** ${pestStatus}\n`;
  
  report += `\n### Contributors:\n`;
  health.topContributors.forEach(c => {
    report += `  - ${c.label} (${c.value})\n`;
  });
  
  report += `\n### Explanation:\n`;
  report += `- **Insight:** ${health.insight}\n`;
  health.detailedExplanation.forEach(d => {
    report += `  - ${d}\n`;
  });
  
  report += `\n### Recommendation:\n`;
  health.recommendations.forEach(r => {
    report += `- ${r}\n`;
  });
  
  report += `\n---\n\n`;
}

// Summary
report += `## Validation Summary\n\n`;
report += `- **Total scenarios tested:** ${totalScenarios}\n`;
report += `- **Total assertions executed:** ${totalAssertions}\n`;
report += `- **Total contradictions found:** ${totalContradictionsFound}\n`;
report += `- **Pass rate:** ${totalContradictionsFound === 0 ? '100%' : '0%'}\n`;

fs.writeFileSync('c:/Users/Acer/Documents/smart-agri-complete/scratch/validation_report_final.md', report);
console.log(`Validation Complete: ${totalAssertions} assertions passed across ${totalScenarios} scenarios.`);
