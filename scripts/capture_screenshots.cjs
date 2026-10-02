const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  console.log('Loading app on http://localhost:5173...');
  await win.loadURL('http://localhost:5173');
  await delay(3000);

  async function takeScreenshot(filename) {
    const image = await win.capturePage();
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`Saved: ${filePath}`);
  }

  // 1. Capture Hypoeutectoid (0.40 wt% C, Water Quenched, 259.4 °C/s)
  console.log('Capturing State 1: Hypoeutectoid (0.40 wt% C, Water Quench)...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setSimulationParams) {
        window.__setSimulationParams({
          carbon: 0.40,
          coolingRate: 259.40,
          coolingMedium: 'Water (Quenched)',
          showPhaseLabels: true,
        });
      }
    })()
  `);
  await delay(3500);
  await takeScreenshot('01_hypoeutectoid_0.40C_water_quench.png');

  // 2. Capture Eutectoid (0.76 wt% C, Still Air 2.5 °C/s, 100% Pearlite)
  console.log('Capturing State 2: Eutectoid (0.76 wt% C, Still Air, 100% Pearlite)...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setSimulationParams) {
        window.__setSimulationParams({
          carbon: 0.76,
          coolingRate: 2.50,
          coolingMedium: 'Still Air (Normalizing)',
          showPhaseLabels: true,
        });
      }
    })()
  `);
  await delay(3500);
  await takeScreenshot('02_eutectoid_0.76C_pearlite.png');

  // 3. Capture Hypereutectoid (1.40 wt% C, Oil Quenched 65 °C/s, Fe3C network)
  console.log('Capturing State 3: Hypereutectoid (1.40 wt% C, Oil Quench with Fe3C)...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setSimulationParams) {
        window.__setSimulationParams({
          carbon: 1.40,
          coolingRate: 65.00,
          coolingMedium: 'Oil (Quenched)',
          showPhaseLabels: true,
        });
      }
    })()
  `);
  await delay(3500);
  await takeScreenshot('03_hypereutectoid_1.46C_oil_quench.png');

  // 4. Capture Grain Analysis Mode
  console.log('Capturing State 4: Grain Morphology Analysis...');
  await win.webContents.executeJavaScript(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.viewport-tab'));
      const analysisTab = tabs.find(t => t.textContent.includes('Grain Analysis'));
      if (analysisTab) analysisTab.click();
    })()
  `);
  await delay(3000);
  await takeScreenshot('04_grain_analysis_mode.png');

  // Switch back to Microstructure View
  await win.webContents.executeJavaScript(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.viewport-tab'));
      const viewTab = tabs.find(t => t.textContent.includes('Microstructure View'));
      if (viewTab) viewTab.click();
    })()
  `);
  await delay(1200);

  // 5. Open Expanded Fe-C Phase Diagram Modal
  console.log('Capturing State 5: Expanded Fe-C Phase Diagram Modal...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setExpandedDiagram) window.__setExpandedDiagram('phase');
    })()
  `);
  await delay(1500);
  await takeScreenshot('05_expanded_fe_c_phase_diagram.png');

  // 6. Switch to Expanded CCT Kinetics Diagram Modal
  console.log('Capturing State 6: Expanded CCT Kinetics Diagram Modal...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setExpandedDiagram) window.__setExpandedDiagram('cct');
    })()
  `);
  await delay(1500);
  await takeScreenshot('06_expanded_cct_kinetics_diagram.png');

  // Close diagram modal
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setExpandedDiagram) window.__setExpandedDiagram(null);
    })()
  `);
  await delay(800);

  // 7. Open Theory Modal
  console.log('Capturing State 7: Scientific Theory & Formulas Modal...');
  await win.webContents.executeJavaScript(`
    (() => {
      if (window.__setShowTheoryModal) window.__setShowTheoryModal(true);
    })()
  `);
  await delay(1500);
  await takeScreenshot('07_scientific_theory_modal.png');

  console.log('All comprehensive presentation screenshots captured successfully!');
  app.quit();
});
