const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createAppDoc() {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();
  
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const drawText = (text, x, y, size, font, color) => {
    page.drawText(text, { x, y, size, font, color });
  };
  
  const colorPrimary = rgb(16/255, 185/255, 129/255);
  const colorDark = rgb(15/255, 23/255, 42/255);
  const colorGrey = rgb(107/255, 114/255, 128/255);
  
  let currentY = height - 50;
  
  drawText('SMART AGRICULTURE APP', 50, currentY, 20, fontHelveticaBold, colorPrimary);
  currentY -= 20;
  drawText('System Components & Capabilities Overview', 50, currentY, 14, fontHelvetica, colorGrey);
  currentY -= 40;
  
  const components = [
    {
      title: '1. Farm Intelligence Engine (The Brain)',
      desc: 'What it does: Evaluates real-time environmental factors, soil properties, and weather forecasts to generate a mathematically sound "Farm Health Score".',
      how: 'How it works: A unified evaluation pipeline (scoreFarm) acts as the single source of truth. It analyzes conditions to assign base scores, bonuses (e.g. Optimal Moisture), and penalties (e.g. Drought, Waterlogging, Fungal Risk). Contradiction guards prevent logical inconsistencies.'
    },
    {
      title: '2. Interactive Farm Map',
      desc: 'What it does: Provides a geographical overview of all managed fields with color-coded status pins.',
      how: 'How it works: Integrates react-native-maps. Farm pins transition from Green (Excellent) to Red (Critical) based on their Health Score, allowing rapid visual triage of agricultural assets.'
    },
    {
      title: '3. Insights & Alerts Dashboard',
      desc: 'What it does: Surfaces actionable agronomic recommendations based on active crop stressors.',
      how: 'How it works: Analyzes the top negative contributors from the Intelligence Engine (e.g. Heat Stress Penalty, Elevated Pest Risk) and translates them into localized advice like "Switch to drip irrigation early morning".'
    },
    {
      title: '4. Offline Resilience (Local First)',
      desc: 'What it does: Ensures rural farmers can access their data and insights without constant internet connectivity.',
      how: 'How it works: Uses Zustand combined with AsyncStorage to persist farm profiles, weather data, and the latest Health Scores locally on the device.'
    },
    {
      title: '5. Multi-Lingual Support (i18n)',
      desc: 'What it does: Breaks language barriers by supporting local dialects (English, Hindi, Kannada).',
      how: 'How it works: Powered by expo-localization and i18n-js, automatically detecting the device locale and allowing manual overrides via the Settings Profile.'
    },
    {
      title: '6. Developer Test Mode',
      desc: 'What it does: Allows agricultural engineers to simulate extreme weather and soil conditions to validate the Intelligence Engine.',
      how: 'How it works: Activated via a hidden long-press on the Home Header logo. It opens a control panel to override moisture, temperature, humidity, and rainfall.'
    }
  ];
  
  for (const comp of components) {
    if (currentY < 100) {
      page = pdfDoc.addPage([595.27, 841.89]);
      currentY = height - 50;
    }
    
    drawText(comp.title, 50, currentY, 12, fontHelveticaBold, colorDark);
    currentY -= 18;
    
    // Simple text wrapping (naive approach for a clean document)
    const splitText = (text, maxLineLength) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      words.forEach(word => {
        if ((currentLine + word).length > maxLineLength) {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      lines.push(currentLine);
      return lines;
    };
    
    const descLines = splitText(comp.desc, 90);
    for (const line of descLines) {
      drawText(line, 50, currentY, 10, fontHelvetica, colorGrey);
      currentY -= 14;
    }
    
    const howLines = splitText(comp.how, 90);
    for (const line of howLines) {
      drawText(line, 50, currentY, 10, fontHelvetica, colorGrey);
      currentY -= 14;
    }
    
    currentY -= 15;
  }
  
  const pdfBytes = await pdfDoc.save();
  const targetPath = path.join('c:\\Users\\Acer\\Documents\\smart-agri-complete', 'app_features_documentation.pdf');
  fs.writeFileSync(targetPath, pdfBytes);
  console.log('Features PDF generated at:', targetPath);
}

createAppDoc().catch(err => {
  console.error(err);
  process.exit(1);
});
