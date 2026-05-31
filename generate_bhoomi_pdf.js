// generate_bhoomi_pdf.js
// Run with: node generate_bhoomi_pdf.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // â”€â”€â”€ Color palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const green    = rgb(0.063, 0.725, 0.506);   // #10B981
  const darkGreen= rgb(0.020, 0.420, 0.235);   // #056038
  const amber    = rgb(0.961, 0.620, 0.043);   // #F59E0B
  const blue     = rgb(0.231, 0.510, 0.965);   // #3B82F6
  const purple   = rgb(0.545, 0.361, 0.965);   // #8B5CF6
  const red      = rgb(0.937, 0.267, 0.267);   // #EF4444
  const dark     = rgb(0.067, 0.067, 0.067);   // near black
  const midGray  = rgb(0.35, 0.35, 0.35);
  const lightGray= rgb(0.93, 0.93, 0.93);
  const white    = rgb(1, 1, 1);
  const pageW    = 595; // A4 width in pt
  const pageH    = 842; // A4 height in pt
  const margin   = 48;
  const col      = pageW - margin * 2;

  let page, y;

  const newPage = () => {
    page = pdfDoc.addPage([pageW, pageH]);
    y = pageH - margin;
    return page;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) {
      newPage();
    }
  };

  // â”€â”€â”€ Helper: draw filled rectangle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const rect = (rx, ry, rw, rh, color) => {
    page.drawRectangle({ x: rx, y: ry, width: rw, height: rh, color });
  };

  // â”€â”€â”€ Helper: draw text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const text = (str, x, ty, { font = helvetica, size = 11, color = dark } = {}) => {
    page.drawText(str, { x, y: ty, size, font, color });
  };

  // â”€â”€â”€ Helper: wrap & draw multi-line text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const drawWrapped = (str, x, ty, maxWidth, { font = helvetica, size = 10, color = dark, lineHeight = 15 } = {}) => {
    const words = str.split(' ');
    let line = '';
    let cy = ty;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
        page.drawText(line, { x, y: cy, size, font, color });
        cy -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) page.drawText(line, { x, y: cy, size, font, color });
    return cy - lineHeight; // return y after last line
  };

  // â”€â”€â”€ Section heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sectionHeading = (title, color = green) => {
    ensureSpace(36);
    y -= 10;
    rect(margin, y - 4, col, 24, color);
    text(title, margin + 10, y + 4, { font: helveticaBold, size: 12, color: white });
    y -= 28;
  };

  // â”€â”€â”€ Sub-heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subHeading = (title, color = darkGreen) => {
    ensureSpace(24);
    y -= 6;
    text(title, margin, y, { font: helveticaBold, size: 11, color });
    y -= 16;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + col, y }, thickness: 0.5, color: lightGray });
    y -= 6;
  };

  // â”€â”€â”€ Bullet item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const bullet = (label, detail, labelColor = dark) => {
    ensureSpace(20);
    text('â€¢', margin + 4, y, { size: 10 });
    text(label, margin + 16, y, { font: helveticaBold, size: 10, color: labelColor });
    const lw = helveticaBold.widthOfTextAtSize(label, 10);
    const remaining = col - 16 - lw - 8;
    if (detail) {
      const detailX = margin + 16 + lw + 8;
      if (remaining > 50) {
        y = drawWrapped(detail, detailX, y, remaining, { size: 10, color: midGray });
      } else {
        y -= 13;
        y = drawWrapped(detail, margin + 28, y, col - 28, { size: 10, color: midGray });
      }
    } else {
      y -= 14;
    }
  };

  // â”€â”€â”€ Simple detail line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const detail = (str, indent = 28) => {
    ensureSpace(14);
    y = drawWrapped(str, margin + indent, y, col - indent, { size: 10, color: midGray });
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  PAGE 1 â€” COVER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  newPage();

  // Deep green header banner
  rect(0, pageH - 180, pageW, 180, darkGreen);
  // Subtle lighter stripe
  rect(0, pageH - 185, pageW, 8, green);

  text('BHOOMI', margin, pageH - 70, { font: helveticaBold, size: 42, color: white });
  text('Intelligent Land. Empowered Farmers.', margin, pageH - 100, { font: helveticaOblique, size: 14, color: rgb(0.6, 0.93, 0.76) });
  text('Comprehensive Feature & Architecture Documentation', margin, pageH - 125, { font: helvetica, size: 11, color: rgb(0.8, 0.95, 0.88) });
  text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, margin, pageH - 148, { font: helvetica, size: 10, color: rgb(0.7, 0.9, 0.8) });

  y = pageH - 220;

  // Executive Summary box
  rect(margin, y - 90, col, 96, rgb(0.93, 0.98, 0.95));
  page.drawRectangle({ x: margin, y: y - 90, width: 4, height: 96, color: green });
  text('Executive Summary', margin + 14, y - 6, { font: helveticaBold, size: 12, color: darkGreen });
  y = drawWrapped(
    'BHOOMI is a cross-platform (iOS / Android / Web) agricultural intelligence mobile application built with React Native + Expo. It empowers Indian farmers with AI-driven farm health scoring, real-time weather integration, interactive farm mapping, multilingual support (English, Hindi, Kannada), and actionable agronomic insights â€” all in one premium, offline-capable application.',
    margin + 14, y - 22, col - 28, { size: 10, color: dark, lineHeight: 15 }
  );
  y -= 30;

  // Key stats row
  const statBoxW = (col - 20) / 4;
  const stats = [
    { label: 'Screens', val: '8+', color: green },
    { label: 'Languages', val: '3', color: blue },
    { label: 'Services', val: '8', color: amber },
    { label: 'Components', val: '25+', color: purple },
  ];
  stats.forEach((s, i) => {
    const bx = margin + i * (statBoxW + 7);
    rect(bx, y - 60, statBoxW, 64, s.color);
    text(s.val, bx + statBoxW / 2 - helveticaBold.widthOfTextAtSize(s.val, 22) / 2, y - 22, { font: helveticaBold, size: 22, color: white });
    text(s.label, bx + statBoxW / 2 - helvetica.widthOfTextAtSize(s.label, 9) / 2, y - 44, { font: helvetica, size: 9, color: white });
  });
  y -= 80;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 1 â€” SCREENS / NAVIGATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('1.  SCREENS & NAVIGATION ARCHITECTURE', green);

  subHeading('1.1  Splash Screen  (app/index.tsx)');
  bullet('Purpose', 'First screen shown on app launch before auth check.');
  detail('Full-screen animated BHOOMI wordmark with a green radial glow, sprout leaf icon, pulsing loading dots, and outer ring animations.');
  detail('Uses React Native Animated API with spring physics + easing curves.');
  detail('Min display duration: 2,400 ms â€” controlled in app/_layout.tsx.');
  y -= 4;

  subHeading('1.2  Authentication â€” Login  (app/(auth)/login.tsx)');
  bullet('Purpose', 'Phone-number entry + OTP mock login flow.');
  detail('Validates Indian 10-digit phone numbers (starts with 6-9).');
  detail('Simulates a 4-digit OTP via 1.5 s mock delay â€” no real network call.');
  detail('Accessible inputs with KeyboardAvoidingView; all labels translated.');
  y -= 4;

  subHeading('1.3  Authentication â€” Account Setup  (app/(auth)/setup.tsx)');
  bullet('Purpose', 'Captures user name + preferred language on first login.');
  detail('Language picker: English, Hindi (Devanagari), Kannada. Changing language instantly re-renders the entire app via react-i18next.');
  detail('Persisted via Zustand + AsyncStorage so preference survives app restarts.');
  y -= 4;

  subHeading('1.4  Home Dashboard  (app/(tabs)/index.tsx)');
  bullet('Purpose', 'The primary command centre of the app.');
  detail('Greeting banner with first name and real-time local time slot (morning / afternoon / evening / night).');
  detail('Farm Selector: horizontal pill tabs to filter all data by a single farm or "All Farms" aggregate.');
  detail('Quick Stats Banner: live Avg Moisture %, Avg Temperature ÂdegC, and Active Alerts count derived from selected farm(s).');
  detail('Timeframe Selector: 7 D / 30 D / 90 D toggle that recalculates charts and AI analytics.');
  detail('Farm Health Score Card: central AI metric (see Section 3).');
  detail('AI Prediction Card: single contextual recommendation card based on weather + farm state.');
  detail('Recent Insights: latest 3 AI insights from the Insights feed.');
  detail('Quick Actions grid: 4 shortcut buttons â†’ Map, Insights, Add Farm, Profile.');
  detail('Pull-to-refresh reloads farms, weather, and insights simultaneously.');
  y -= 4;

  // â”€ continued on new section heading to avoid orphan â”€
  subHeading('1.5  Map  (app/(tabs)/map.tsx)');
  bullet('Purpose', 'Interactive farm map with geo-pinning and place validation.');
  detail('Map engine: react-native-maps with OpenStreetMap tile layer (no Google API key required).');
  detail('Farm Markers: custom animated markers colour-coded by crop health (green/amber/red).');
  detail('Search Bar: live farm name search with debounce â€” filters visible markers.');
  detail('Bottom Sheet: tapping a marker opens a gorhom/bottom-sheet panel showing the QuickAnalysisPanel for that farm.');
  detail('Add Farm flow: FAB (+) activates placement mode â€” crosshair appears, map centre coordinates are continuously validated against urban/water/road heuristics. Confirm triggers the AddFarmModal.');
  detail('Map controls: Locate Me (centre on GPS), Refresh markers.');
  y -= 4;

  subHeading('1.6  Insights  (app/(tabs)/insights.tsx)');
  bullet('Purpose', 'AI-generated agronomic insight feed + weather detail.');
  detail('Real-time weather card: temperature, humidity, UV index, wind speed, condition icon. Sourced from Open-Meteo API (free, no key).');
  detail('7-day forecast scroll: min/max temp + precipitation probability per day.');
  detail('AI insight cards: each card has a severity level badge (info / warning / critical), icon, and contextual message.');
  detail('Filter chips: All / Irrigation / Pest / Weather / Soil â€” filters insight feed live.');
  y -= 4;

  subHeading('1.7  Farm Detail  (app/farm/[id].tsx)');
  bullet('Purpose', 'Deep-dive analytics for a single selected farm.');
  detail('Tabbed layout: Overview | Analytics | Activity.');
  detail('Overview: soil moisture gauge, temperature, humidity, crop health badge, irrigation type, soil type, water source, farm size.');
  detail('Analytics: Moisture trend line chart, Temperature trend line chart, Irrigation timeline bar chart, Soil Nutrition bar chart (N/P/K/pH/OM), Farm Comparison bar chart, AI Prediction Card, Farm Health Score with full breakdown.');
  detail('Activity: Recent activity log with timestamped agronomic events.');
  detail('Expanded Recommended Actions section with up to 4 actionable steps.');
  y -= 4;

  subHeading('1.8  Profile  (app/(tabs)/profile.tsx)');
  bullet('Purpose', 'User account management and app settings.');
  detail('Displays user avatar (initials-based), name, phone number, joined date.');
  detail('Farm summary section: count of farms, total area, average health score.');
  detail('Settings: Language selector, Dark/Light mode toggle, Notification preferences toggle.');
  detail('Danger zone: Delete Account action with confirmation dialog.');
  detail('Logout button with state clear.');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 2 â€” CORE FEATURES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('2.  CORE FEATURES', blue);

  subHeading('2.1  Farm Management');
  bullet('Add Farm', 'Tap the FAB on the Map screen to enter placement mode, drag the map centre to desired coordinates, validate the land, then fill out the modal form (name, crop type, irrigation, soil type, water source).');
  bullet('Farm CRUD', 'Farms are stored via Zustand farmStore (persisted to AsyncStorage). Data includes: coordinates, soil moisture, temperature, humidity, crop health, crop type, last-updated timestamp.');
  bullet('Farm Search', 'Fuzzy search across farm name and address in the Map tab using useFarms hook\'s searchFarms() function.');
  bullet('Farm Selection', 'Selecting a farm on any screen filters the entire dashboard context for that farm.');
  y -= 4;

  subHeading('2.2  Real-Time Weather');
  bullet('Data Source', 'Open-Meteo REST API â€” free, no API key, global coverage.');
  bullet('Fetched Fields', 'temperature_2m, relative_humidity_2m, precipitation, weather_code, wind_speed_10m, is_day, uv_index (hourly), daily forecast (7 days).');
  bullet('Caching', '30-minute cache in AsyncStorage keyed by rounded coordinates (2 d.p. â‰ˆ 1 km grid). Prevents excessive API calls.');
  bullet('WMO Code Mapping', 'weather_code â†’ human-readable condition text + icon name (Clear, Partly Cloudy, Rain, Thunderstorm, etc.).');
  y -= 4;

  subHeading('2.3  Location Services');
  bullet('GPS Permission', 'Requests foreground location permission via expo-location on first use.');
  bullet('Continuous Coords', 'useLocation hook supplies live latitude/longitude used to centre the map and load nearby farms from the mock/API backend.');
  bullet('Land Validation', 'locationValidator.ts applies a 3-layer heuristic: (1) proximity to major Bengaluru urban centres, (2) simulated highway grid lines, (3) deterministic coordinate hash for water bodies/dense patches.');
  y -= 4;

  subHeading('2.4  Internationalization (i18n)');
  bullet('Languages', 'English (en), Hindi (hi), Kannada (kn) â€” covering all screens, modals, errors, and tooltips.');
  bullet('Engine', 'i18next + react-i18next. Locale auto-detected from expo-localization; overridable from Profile settings.');
  bullet('Persistence', 'Selected language stored in userStore and restored on next launch.');
  bullet('Coverage', 'Farm Health Score system, AI interpretation text, recommended actions, trend indicators, prediction cards, weather cards, chart labels, Add Farm flow, validation messages, Auth screens, loading states, empty states, buttons.');
  y -= 4;

  subHeading('2.5  Dark / Light Mode');
  bullet('Detection', 'Reads system preference via useColorScheme and stores user override in userStore.');
  bullet('Theme Engine', 'useAppTheme hook exposes a full ColorPalette object. Every component queries this hook â€” zero hardcoded hex values in production code.');
  bullet('Coverage', 'All screens, cards, modals, overlays, charts, map UI elements, and the bottom sheet respond instantly to theme changes.');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 3 â€” AI SYSTEMS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('3.  AI & INTELLIGENCE SYSTEMS', purple);

  subHeading('3.1  Farm Health Score  (analyticsService.calculateFarmHealthScore)');
  bullet('What it is', 'A 0-100 integer score representing the overall agricultural health of a farm (or all farms in aggregate).');
  bullet('Inputs', 'soilMoisture, cropHealth, temperature, weather.rainfall, weather.uvIndex, weather.humidity.');
  bullet('Algorithm', 'Starts at 100. Deductions: âˆ’25 for extreme moisture (<30 or >80%), âˆ’15 for high crop health penalty (poor), âˆ’15 for extreme heat (>35ÂdegC), âˆ’10 for heavy rain / UVâ‰¥8, âˆ’5 for humidity >85%. Clamped to [0, 100].');
  bullet('Aggregation', 'For All Farms view: finalScore = avgScore Ã— 0.6 + worstScore Ã— 0.4 (biased toward worst performer).');
  bullet('States', 'Excellent (90-100, green) | Stable (75-89, blue) | Moderate Risk (50-74, amber) | Critical (<50, red).');
  bullet('Trend', 'â†‘ Improving | Stable | â†“ Declining â€” driven by actual metric deviations, not random labels.');
  bullet('Breakdown', 'Mini metrics: Moisture | Weather | Soil | Pest Risk â€” each with good / warning / critical status.');
  bullet('Explanation', 'Generates a plain-language array of why the score is what it is (e.g. "Heat is increasing evaporation rates").');
  y -= 4;

  subHeading('3.2  AI Prediction Card  (analyticsService.generateAIPrediction)');
  bullet('What it is', 'A single highest-priority actionable insight shown on the dashboard and farm detail.');
  bullet('Decision tree', '');
  detail('1. Heavy rain incoming (forecast >60% or current >5 mm) â†’ "Pause irrigation" advice.');
  detail('2. High UV (â‰¥8) â†’ Heat stress warning.');
  detail('3. High humidity (>85%) â†’ Fungal disease risk.');
  detail('4. Low soil moisture (<40%) â†’ Critical irrigation alert.');
  detail('5. High temperature (>32ÂdegC) â†’ Crop heat warning.');
  detail('6. Poor crop health â†’ Disease/pest inspection.');
  detail('7. All-clear â†’ "Optimal conditions" confirmation.');
  bullet('Output', 'text, confidence % (76-95%), type (moisture/disease/irrigation/stress/weather), level (info/warning/critical).');
  y -= 4;

  subHeading('3.3  Crop Recommendations  (generateCropRecommendations)');
  bullet('Output', 'Up to 4 prioritised, actionable text recommendations per farm, translated into the active language.');
  detail('Weather-driven: delay fertiliser on rain, apply mulch on heat, monitor fungal on high humidity.');
  detail('Moisture-driven: drip irrigation on critical dry, halt irrigation on waterlogged soil.');
  detail('Health-driven: urgent field inspection and targeted treatment for poor crop health.');
  y -= 4;

  subHeading('3.4  Trend Charts  (generateMoistureTrends, generateTemperatureTrends, etc.)');
  bullet('Charts available', 'Soil Moisture trend (line), Temperature trend (line), Irrigation timeline (bar), Soil Nutrition N/P/K/pH/OM (bar), Farm Productivity Comparison (bar).');
  bullet('Timeframes', '7 Day, 30 Day, 90 Day â€” controlled by the global timeframe selector.');
  bullet('Data generation', 'Pseudo-deterministic seeded generation based on current farm values + random variation scaled by distance from today. Ensures charts look realistic and trend in the correct direction.');
  y -= 4;

  subHeading('3.5  Recent Activity Log  (generateRecentActivity)');
  bullet('What it is', 'A timestamped log of the last 3 agronomic events per farm.');
  detail('Events include: irrigation on/off, rainfall recorded, sensor data update, pathology scan, agronomic check, fertiliser application.');
  detail('Events are contextually driven by current farm state (moisture level, crop health, rainfall).');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 4 â€” COMPONENTS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('4.  UI COMPONENT LIBRARY', amber);

  subHeading('4.1  Common Components  (components/common/)');
  bullet('Card', 'Base card with shadow, border radius, and spring press-scale animation when onPress is provided.');
  bullet('LoadingSkeleton', 'Pulse-animated placeholder bars shown while data loads.');
  bullet('EmptyState', 'Centred icon + title + description for zero-data states.');

  subHeading('4.2  Analytics Components  (components/analytics/)');
  bullet('HealthScoreCard', 'Animated SVG radial ring showing score 0-100, state label, trend indicator (â†‘/â†“/Stable), brief AI insight, optional mini breakdown row (Moisture / Weather / Soil / Pest Risk).');
  bullet('HealthScoreRing', 'Pure SVG animated circular progress ring with glow effect, gradient stroke, and smooth value transitions.');
  bullet('AIPredictionCard', 'Linear gradient card (colour-coded by severity) with confidence badge, type icon, and prediction text. Optimised with React.memo.');
  bullet('AnalyticsCharts', 'Wrapper around react-native-gifted-charts rendering all 5 chart types. Memoised per chart. Axis labels prevent overflow on small screens.');

  subHeading('4.3  Farm Components  (components/farms/)');
  bullet('AddFarmModal', 'Full-screen modal with multi-step form: name, crop type, irrigation type, soil type, water source. Validates required fields; coordinates pre-filled from placement mode. All labels translated.');
  bullet('QuickAnalysisPanel', 'Compact farm summary card used in the map bottom sheet: health score ring, metric pills (moisture, temp, humidity), crop health badge, View Details CTA.');

  subHeading('4.4  Map Components  (components/maps/)');
  bullet('FarmMap / FarmMap.web', 'Platform-aware MapView wrapper. Native: react-native-maps with OpenStreetMap tiles. Web: fallback placeholder.');
  bullet('FarmMarker / FarmMarker.web', 'Custom animated farm pin with pulse ring, health-colour dot, and farm name label. Animated.spring bounce on mount.');
  bullet('MapViewWrapper', 'Forwardable ref wrapper normalising the map API between platforms.');

  subHeading('4.5  Home Components  (components/home/)');
  bullet('WeatherCard', 'Compact widget showing temperature, humidity, wind speed, condition icon + text, UV index. Theme-aware gradient background.');
  bullet('InsightCard', 'Condensed insight row with severity icon, title, and "compact" mode for dashboard use.');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 5 â€” DATA & STATE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('5.  DATA LAYER & STATE MANAGEMENT', red);

  subHeading('5.1  State Management â€” Zustand Stores');
  bullet('farmStore.ts', 'Holds the farms[] array, selectedFarm, and CRUD actions (addFarm, updateFarm, deleteFarm). Persisted to AsyncStorage.');
  bullet('userStore.ts', 'Holds user profile (name, phone, language, theme preference, joined date). Persisted to AsyncStorage. Controls auth gate in _layout.tsx.');

  subHeading('5.2  Custom Hooks');
  bullet('useFarms(location)', 'Fetches nearby farms from farmStore + farmService. Exposes farms[], selectedFarm, selectFarm(), searchFarms(), refreshFarms(), loading state.');
  bullet('useWeather(location)', 'Calls weatherService.fetchWeather(); caches result 30 min. Returns WeatherData | null + loading state.');
  bullet('useInsights(farms, weather)', 'Generates AI insight cards from analyticsService based on current farm and weather context. Returns insights[], loading.');
  bullet('useLocation()', 'Wraps expo-location. Returns current Coordinates, hasPermission, requestPermission(), loading state.');

  subHeading('5.3  Services');
  bullet('weatherService.ts', 'HTTP GET to Open-Meteo /v1/forecast. Maps WMO codes. Returns WeatherData with 7-day DailyForecast[].');
  bullet('analyticsService.ts', 'Pure functions: generateMoistureTrends, generateTemperatureTrends, generateIrrigationTimeline, generateSoilHealthData, generateFarmComparison, generateAIPrediction, generateCropRecommendations, generateRecentActivity, calculateFarmHealthScore.');
  bullet('farmService.ts', 'Adapter between Zustand store and the mock API layer (api.ts). Handles filtering farms by proximity.');
  bullet('locationValidator.ts', 'Deterministic land-use heuristic: urban centre radius check (Bengaluru), highway grid simulation, coordinate hash for water bodies.');
  bullet('mockData.ts', 'Rich seed dataset of farms with realistic Karnataka coordinates, diverse crop types, and varied health states for demo / offline use.');
  bullet('locationService.ts', 'Distance calculation utilities and nearest-farm sorting.');
  bullet('api.ts', 'Axios-based HTTP client configured for the backend base URL with timeout and error interceptors.');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SECTION 6 â€” TECH STACK
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  sectionHeading('6.  TECHNOLOGY STACK', midGray);

  subHeading('6.1  Core Framework');
  bullet('React Native 0.81.5 + Expo 54', 'Cross-platform iOS / Android / Web from a single codebase.');
  bullet('Expo Router 6', 'File-system-based navigation. Stack + Tabs layout. Typed routes.');
  bullet('TypeScript 5.9', 'Strict typing across all services, hooks, stores, and components.');

  subHeading('6.2  Key Libraries');
  bullet('Zustand 4', 'Lightweight global state with AsyncStorage persistence middleware.');
  bullet('i18next + react-i18next', 'Full internationalization: 3 languages, 100% string coverage.');
  bullet('react-native-maps 1.20', 'Native map engine with custom markers and OpenStreetMap tiles.');
  bullet('@gorhom/bottom-sheet 5', 'Performant gesture-driven bottom sheets for the map detail panel.');
  bullet('expo-linear-gradient', 'GPU-accelerated gradients for health score, AI cards, and splash screen.');
  bullet('react-native-gifted-charts', 'Line, bar, and area charts with animation support.');
  bullet('react-native-svg', 'SVG-based animated health score ring.');
  bullet('expo-location', 'GPS coordinates with permission management.');
  bullet('lucide-react-native', 'Consistent icon set across all screens.');
  bullet('@react-native-async-storage/async-storage', 'Offline persistence for farms, user data, weather cache.');
  bullet('moti', 'Declarative animation library (used for skeleton loaders and micro-transitions).');

  subHeading('6.3  Architecture Patterns');
  bullet('File-system routing', 'app/_layout.tsx â†’ (auth)/ â†’ (tabs)/ â†’ farm/[id].tsx.');
  bullet('Atomic design', 'components/common â†’ components/analytics â†’ screen-level components.');
  bullet('Memoization', 'React.memo on chart and card components; useMemo for styles; useCallback for event handlers â€” prevents unnecessary re-renders.');
  bullet('Platform files', '*.web.tsx overrides provide web-safe fallbacks for native-only modules (maps, location).');
  bullet('Theme system', 'useAppTheme() returns a full ColorPalette; all colors flow top-down. Zero hardcoded hex values in component stylesheets.');

  // â”€â”€â”€ Footer on each page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = pdfDoc.getPage(i);
    const pw = p.getWidth();
    const ph = p.getHeight();
    p.drawLine({ start: { x: margin, y: 36 }, end: { x: pw - margin, y: 36 }, thickness: 0.5, color: lightGray });
    p.drawText('BHOOMI â€” Confidential Technical Documentation', { x: margin, y: 22, size: 8, font: helvetica, color: midGray });
    p.drawText(`Page ${i + 1} of ${pageCount}`, { x: pw - margin - 50, y: 22, size: 8, font: helvetica, color: midGray });
  }

  const bytes = await pdfDoc.save();
  const outPath = path.join(__dirname, 'BHOOMI_Feature_Documentation.pdf');
  fs.writeFileSync(outPath, bytes);
  console.log(`âœ…  PDF saved â†’ ${outPath}`);
}

generatePDF().catch(console.error);

