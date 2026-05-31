# Intelligence Engine Automated Validation Report

## Scenario: Rice + Clay + Waterlogging

**PASS**

No contradictions detected.

- **Crop:** rice
- **Soil:** Clay
- **Moisture:** 95%
- **Temperature:** 28°C
- **Humidity:** 90%
- **Rain Probability:** 80%
- **Final Score:** 76
- **Score Category:** Stable
- **Risk Level:** Elevated
- **Moisture Status:** Sub-optimal
- **Weather Status:** Moderate Stress
- **Soil Status:** Waterlogging Risk
- **Pest Status:** Elevated

### Contributors:
  - Elevated Pest Risk (-8)
  - Rainfall + Clay Waterlogging Risk (-8)
  - High Fungal Risk Penalty (-8)

### Explanation:
- **Insight:** Pest risk is elevated based on environmental conditions.
  - Soil moisture (95%) is sub-optimal for Rice.
  - Weather conditions (Temperature: 28°C) are causing moderate stress.
  - Clay soil characteristics are exacerbating current risks.
  - Elevated pest risk detected.

### Recommendation:
- Delay irrigation because incoming rainfall (80% probability) will naturally replenish the Clay soil, preventing unnecessary waterlogging of the Rice crop.
- Switch to drip irrigation and inspect Rice leaves because elevated humidity (90%) combined with moist soil (95%) creates an ideal breeding ground for fungal pathogens.
- Consider applying a balanced NPK fertiliser top-up because Rice is currently in excellent health and optimal moisture conditions (95%) will maximize nutrient uptake.

---

## Scenario: Rice + Loam + Healthy

**PASS**

No contradictions detected.

- **Crop:** rice
- **Soil:** Loam
- **Moisture:** 80%
- **Temperature:** 28°C
- **Humidity:** 60%
- **Rain Probability:** 20%
- **Final Score:** 100
- **Score Category:** Excellent
- **Risk Level:** Low
- **Moisture Status:** Optimal
- **Weather Status:** Favourable
- **Soil Status:** Balanced
- **Pest Status:** Low Risk

### Contributors:
  - Optimal Moisture Bonus (+5)
  - Healthy Soil Bonus (+3)
  - Low Pest Risk Bonus (+2)

### Explanation:
- **Insight:** Rice is thriving under ideal conditions.
  - Soil moisture (80%) is optimal for Rice.
  - Weather conditions are favourable for Rice.

### Recommendation:
- Maintain current irrigation schedule because Rice moisture levels are perfectly stable at 80% and Loam soil is providing balanced water retention.
- Consider applying a balanced NPK fertiliser top-up because Rice is currently in excellent health and optimal moisture conditions (80%) will maximize nutrient uptake.

---

## Scenario: Cotton + Sandy + Drought

**PASS**

No contradictions detected.

- **Crop:** cotton
- **Soil:** Sandy
- **Moisture:** 10%
- **Temperature:** 40°C
- **Humidity:** 40%
- **Rain Probability:** 0%
- **Final Score:** 52
- **Score Category:** Moderate Risk
- **Risk Level:** Critical
- **Moisture Status:** Critical
- **Weather Status:** Severe Stress
- **Soil Status:** Severe Dehydration
- **Pest Status:** Low Risk

### Contributors:
  - Critical Drought Penalty (-30)
  - Extreme UV Stress Penalty (-10)
  - Sandy Rapid Dehydration (-9)

### Explanation:
- **Insight:** Moisture deficit detected — Cotton requires urgent irrigation.
  - Soil moisture (10%) is critical for Cotton.
  - Extreme weather stress detected (Temperature: 40°C, UV: 10).
  - Sandy soil characteristics are exacerbating current risks.

### Recommendation:
- Start immediate irrigation because Sandy soil drains quickly, Cotton moisture has fallen to a critical 10%, temperatures are expected to reach 40°C, and rainfall probability is only 0%.
- Shift irrigation to early morning (5–7 AM) because daytime temperatures reaching 40°C will cause high evaporation losses on Sandy soil.

---

## Scenario: Cotton + Clay + Heat Stress

**PASS**

No contradictions detected.

- **Crop:** cotton
- **Soil:** Clay
- **Moisture:** 60%
- **Temperature:** 40°C
- **Humidity:** 85%
- **Rain Probability:** 0%
- **Final Score:** 74
- **Score Category:** Moderate Risk
- **Risk Level:** Critical
- **Moisture Status:** Optimal
- **Weather Status:** Severe Stress
- **Soil Status:** Water Retaining
- **Pest Status:** Elevated

### Contributors:
  - Extreme UV Stress Penalty (-10)
  - Elevated Pest Risk (-8)
  - Heat Stress Penalty (-7)

### Explanation:
- **Insight:** Cotton conditions are sub-optimal — minor stress indicators detected.
  - Soil moisture (60%) is optimal for Cotton.
  - Extreme weather stress detected (Temperature: 40°C, UV: 11).
  - Elevated pest risk detected.

### Recommendation:
- Maintain current irrigation schedule because Cotton moisture levels are perfectly stable at 60% and Clay soil is providing balanced water retention.
- Shift irrigation to early morning (5–7 AM) because daytime temperatures reaching 40°C will cause high evaporation losses on Clay soil.
- Switch to drip irrigation and inspect Cotton leaves because elevated humidity (85%) combined with moist soil (60%) creates an ideal breeding ground for fungal pathogens.

---

## Validation Summary

- **Total scenarios tested:** 4
- **Total assertions executed:** 57
- **Total contradictions found:** 0
- **Pass rate:** 100%
