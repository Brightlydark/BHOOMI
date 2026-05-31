const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.27, 841.89]); // A4 Size
  const { width, height } = page.getSize();
  
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const drawText = (text, x, y, size, font, color) => {
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color,
    });
  };

  const drawRect = (x, y, w, h, color, borderColor, borderWidth = 0) => {
    const options = {
      x,
      y,
      width: w,
      height: h,
      color,
      borderWidth,
    };
    if (borderColor) options.borderColor = borderColor;
    page.drawRectangle(options);
  };

  const drawLine = (x1, y1, x2, y2, color, thickness) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color,
      thickness,
    });
  };

  // Color Palette
  const colorPrimary = rgb(16/255, 185/255, 129/255); // Emerald Green (#10b981)
  const colorDark = rgb(15/255, 23/255, 42/255);     // Dark Slate (#0f172a)
  const colorGrey = rgb(107/255, 114/255, 128/255);  // Slate Grey (#6b7280)
  const colorBgBox = rgb(248/255, 250/255, 252/255); // Light slate bg (#f8fafc)
  const colorBorder = rgb(226/255, 232/255, 240/255); // Very soft grey (#e2e8f0)

  // 1. Header
  // Logo placeholder / Top bar
  drawRect(40, height - 55, 8, 30, colorPrimary);
  drawText('SMART AGRICULTURE APP', 58, height - 42, 18, fontHelveticaBold, colorDark);
  drawText('WORKSPACE REORGANIZATION & PROJECT LAYOUT', 58, height - 55, 9, fontHelveticaBold, colorGrey);
  drawText('MAY 27, 2026', width - 110, height - 42, 9, fontHelveticaBold, colorPrimary);

  // Separation Line
  drawLine(40, height - 68, width - 40, height - 68, colorBorder, 1.5);

  // 2. Executive Summary / Context
  drawText('Overview', 40, height - 90, 12, fontHelveticaBold, colorPrimary);
  
  const introText = [
    'This document presents the newly reorganized directory structure for the Smart Agriculture App.',
    'Originally, all codebase components were placed flatly in the root directory. To resolve TypeScript',
    'module resolution errors and conform to standard React Native (Expo Router) architecture, the files',
    'have been successfully relocated into standard, modular subfolders. All imports now resolve cleanly.'
  ];
  
  let currentY = height - 105;
  for (const line of introText) {
    drawText(line, 40, currentY, 9.5, fontHelvetica, colorDark);
    currentY -= 14;
  }

  // 3. Project Directory Tree (Inside a styled container)
  drawText('Standard Project Directory Tree', 40, currentY - 10, 12, fontHelveticaBold, colorPrimary);
  
  const boxHeight = 440;
  const boxY = currentY - boxHeight - 25;
  drawRect(40, boxY, width - 80, boxHeight, colorBgBox, colorBorder, 1);

  const treeLines = [
    { text: 'smart-agri-complete/', isHeader: true },
    { text: '|-- app/                             (Expo Router navigation routing folder)' },
    { text: '|   |-- (tabs)/                      (Tab-based main screens & navigation)' },
    { text: '|   |   |-- _layout.tsx               (Tab layout setup & i18n auto-init)' },
    { text: '|   |   |-- index.tsx                 (Home / Farmer Dashboard & aggregated stats)' },
    { text: '|   |   |-- insights.tsx              (Alerts & diagnostic recommendations panel)' },
    { text: '|   |   |-- map.tsx                   (Interactive map view showing farm pins)' },
    { text: '|   |   \\-- profile.tsx               (Settings, language pickers, and support)' },
    { text: '|   \\-- _layout.tsx                   (Root layout loader wrapping app context)' },
    { text: '|-- components/                      (Modular & reusable UI components)' },
    { text: '|   |-- common/                      (Shared components: Card, Loading, EmptyState)' },
    { text: '|   |-- insights/                    (Card views for diagnostic reports)' },
    { text: '|   |-- maps/                        (Interactive Google Maps marker layers)' },
    { text: '|   \\-- settings/                    (Configuration popups: Language selector)' },
    { text: '|-- hooks/                           (Custom React hooks separating logic)' },
    { text: '|   |-- useFarms.ts                  (Farms fetching, sorting, & cache check)' },
    { text: '|   |-- useInsights.ts               (Diagnostics load, refresh & counts)' },
    { text: '|   \\-- useLocation.ts               (GPS coordinate & reverse geocode loader)' },
    { text: '|-- i18n/                            (Internationalization & translations)' },
    { text: '|   |-- en.json / hi.json / kn.json  (English, Hindi, and Kannada modules)' },
    { text: '|   \\-- i18n.config.ts               (Locale detector config using AsyncStorage)' },
    { text: '|-- services/                        (Data query APIs & background simulation)' },
    { text: '|   |-- api.ts                       (Central Axios configuration with auth)' },
    { text: '|   |-- farmService.ts               (Main data requests with offline backup)' },
    { text: '|   |-- locationService.ts           (GPS permission requesting & geocoding)' },
    { text: '|   \\-- mockData.ts                  (Simulation data generator fallback)' },
    { text: '|-- store/                           (Zustand global stores)' },
    { text: '|   |-- farmStore.ts                 (Farms list & detail caching store)' },
    { text: '|   \\-- userStore.ts                 (User preferences, themes, & login state)' },
    { text: '|-- types/                           (Strict TypeScript type definitions)' },
    { text: '|   |-- farm.ts / insight.ts / user.ts' },
    { text: '\\-- package.json                     (Dependencies: Zustand, Expo Router, i18n)' }
  ];

  let treeY = boxY + boxHeight - 20;
  for (const line of treeLines) {
    if (line.isHeader) {
      drawText(line.text, 55, treeY, 9, fontHelveticaBold, colorPrimary);
    } else {
      // Bold folder names for outstanding clarity
      const isFolder = line.text.includes('/') && !line.text.includes('(') && !line.text.includes('.json');
      const fontToUse = isFolder ? fontHelveticaBold : fontHelvetica;
      const colorToUse = isFolder ? colorDark : colorDark;
      drawText(line.text, 55, treeY, 8.5, fontToUse, colorToUse);
    }
    treeY -= 13.5;
  }

  // 4. Document Footer / Footer Note
  const footerY = 40;
  drawLine(40, footerY + 15, width - 40, footerY + 15, colorBorder, 1);
  drawText('Standard React Native / Expo Directory Layout', 40, footerY, 8, fontHelvetica, colorGrey);
  drawText('Smart Agriculture Complete Project Layout Guide', width - 240, footerY, 8, fontHelveticaBold, colorGrey);
  drawText('Page 1 of 1', width / 2 - 20, footerY, 8, fontHelvetica, colorGrey);

  const pdfBytes = await pdfDoc.save();
  const targetPath = path.join('c:\\Users\\Acer\\Documents\\smart-agri-complete', 'project_layout.pdf');
  fs.writeFileSync(targetPath, pdfBytes);
  console.log('PDF generated successfully at:', targetPath);
}

createPdf().catch(err => {
  console.error('Error creating PDF:', err);
  process.exit(1);
});
