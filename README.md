# 🔬 Steel Microstructure Visualizer & Kinetic Transformation Simulator

An interactive, scientifically-grounded desktop and web simulation engine for modeling realistic steel microstructures, thermodynamic Fe-C phase partitioning, and continuous cooling transformation (CCT) kinetics.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Electron](https://img.shields.io/badge/Electron-33-47848F.svg)
![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)

---

## 📌 Project Overview

This simulator models non-equilibrium and equilibrium phase transformations in iron-carbon (Fe-C) steels. Given a user-specified **carbon content (wt% C)** and **cooling rate (°C/s)**, the engine:

1. Computes **equilibrium and non-equilibrium phase fractions** (Ferrite, Pearlite, Bainite, Martensite, Proeutectoid Cementite) strictly satisfying thermodynamic mass conservation ($\sum f_i = 100.0\%$).
2. Generates **metallographically authentic micrographs** via background Web Workers utilizing Poisson-relaxed Voronoi tessellation, directional lamellar pearlite rasterization, acicular bainite sheaths, and lenticular martensitic laths.
3. Renders synchronized, expandable **Fe-C Equilibrium Phase Diagram** and **Continuous Cooling Transformation (CCT)** diagrams displaying real-time coordinate crosshairs, analytical boundary curves, and Newton-Fourier cooling trajectories.
4. Provides quantitative **Grain Morphology Analysis Mode** measuring prior austenite grain networks, centroid tags, and **ASTM E112** Grain Size metrics ($G = 4\text{ to }9$).

---

## ⚙️ Key Features

- **Realistic Microstructure Generator**:
  - Continuous geometry using Poisson-jittered Delaunay/Voronoi tessellation for prior austenite polygonal grains.
  - Phase-specific textures:
    - **Ferrite ($\alpha$)**: Light allotriomorphic boundary allotments and polygonal grains.
    - **Pearlite**: Multi-directional colonies with alternating ferrite/cementite lamellae and Zener-Hillert undercooling spacing ($\lambda$).
    - **Bainite**: Acicular needle/feathery morphology oriented along invariant shear planes.
    - **Martensite**: High-density needle-like lenticular laths forming zigzag patterns.
    - **Proeutectoid Cementite**: Continuous boundary network distinctly labeled $\text{Fe}_3\text{C}$ maintaining mass balance.
  - Optical microscopy simulation (2% Nital, 5% Nital, Picral etchants) and post-processing filters (vignetting, sensor noise, focus blur).
- **Interactive Metallurgical Diagrams**:
  - **Fe-C Equilibrium Phase Diagram**: Dynamic composition marker indicating hypoeutectoid, eutectoid ($0.76\text{ wt}\%\text{ C}$), and hypereutectoid regimes with modal expansion.
  - **Continuous Cooling Transformation (CCT) Diagram**: Kirkaldy-Venugopalan analytical C-curves, JMAK finish envelopes, Andrews $M_s/M_f$ lines, and cooling trajectories with modal expansion.
- **Quantitative Grain Morphology Mode**:
  - Grain centroid tags and boundary overlays.
  - **ASTM E112** Grain Size Number ($G$), mean grain diameter ($\mu\text{m}$), and surface-to-volume ratio ($S_v$).
- **Optical Microscope Controls**:
  - Magnification slider ($50\times - 2000\times$).
  - Mouse-wheel zoom & drag-to-pan viewport.
  - Calibrated dynamic micron scale bar.
  - High-resolution PNG micrograph export.

---

## 📐 Scientific Models & Formulations

### 1. Thermodynamic Phase Lever Rule
- **Hypoeutectoid Steels ($C < 0.76\text{ wt\%}$):**
  $$f_{\alpha,\text{pro}} = \frac{0.76 - \%C}{0.76 - 0.022},\quad f_P = 1 - f_{\alpha,\text{pro}}$$
- **Hypereutectoid Steels ($C > 0.76\text{ wt\%}$):**
  $$f_{\text{Fe}_3\text{C},\text{pro}} = \frac{\%C - 0.76}{6.67 - 0.76},\quad f_P = 1 - f_{\text{Fe}_3\text{C},\text{pro}}$$

### 2. Analytical Fe-C Phase Boundaries
- Hypoeutectoid upper critical line: $A_3(C) = 912 - 203\sqrt{C} - 15.2C\ (^\circ\text{C})$
- Hypereutectoid solubility line: $A_{\text{cm}}(C) = 727 + 210(C - 0.76) - 15(C - 0.76)^2\ (^\circ\text{C})$
- Eutectoid invariant: $A_1 = 727^\circ\text{C}$ at $0.76\text{ wt}\%\text{ C}$

### 3. Continuous Cooling Transformation (Kirkaldy Kinetics)
$$\log_{10} t(T) = \tau_{\text{nose}}(C) + \left(\frac{T - T_{\text{nose}}}{\sigma_T}\right)^2$$
Coupled with Johnson-Mehl-Avrami-Kolmogorov (JMAK) transformation progress curves and Newton-Fourier cooling trajectories calibrated to standard $\Delta t_{8/5}$.

### 4. Andrews Formulations for Martensitic Shear
- Martensite Start: $M_s\ (^\circ\text{C}) = 520 - 423(\%C)$
- Martensite Finish: $M_f\ (^\circ\text{C}) = M_s - 215$

### 5. Zener-Hillert Lamellar Pearlite Spacing
$$\lambda = \frac{2\sigma_{\alpha/\theta} \cdot T_{\text{eut}}}{\Delta H_v \cdot \Delta T}$$

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/abhishek21021042/MICROSTRUCTURE-VISUALISATION-MODEL-MINI-PROJECT-.git
cd MICROSTRUCTURE-VISUALISATION-MODEL-MINI-PROJECT-

# Install dependencies
npm install

# Run web application in development mode
npm run dev

# Run desktop application via Electron
npm run electron:dev
```

### Production Build & Packaging
```bash
# Compile web bundle
npm run build

# Package Electron desktop app
npm run electron:pack
```

---

## 📂 Project Architecture

```
├── electron/
│   ├── main.js                  # Electron main process & native window management
│   └── preload.js               # IPC bridge & context isolation
├── public/                      # Static assets & icons
├── screenshots/                 # High-resolution demonstration micrographs (1440x900)
├── scripts/
│   ├── capture_screenshots.cjs  # Headless automated screenshot generator
│   └── generate_pdf.cjs         # Electron printToPDF documentation generator
├── src/
│   ├── components/
│   │   ├── ControlPanel.jsx     # Side panel with parameter sliders & presets
│   │   ├── Viewport.jsx         # 2D Canvas viewport with pan/zoom & scale bar
│   │   ├── InfoPanel.jsx        # Quantitative phase fractions & ASTM metrics
│   │   ├── PhaseDiagram.jsx     # SVG Fe-C phase diagram with live crosshairs & modal expand
│   │   ├── CCTDiagram.jsx       # SVG CCT diagram with cooling curves & modal expand
│   │   └── TheoryModal.jsx      # Scientific background & mathematical equations modal
│   ├── models/
│   │   └── metallurgy.js        # Lever rule, CCT kinetics, and phase fraction solver
│   ├── renderer/
│   │   └── canvasRenderer.js    # Canvas 2D procedural rendering & post-processing
│   ├── workers/
│   │   └── microstructure.worker.js # Voronoi generator & Delaunay triangulation in Web Worker
│   ├── App.jsx                  # Main application state orchestration
│   ├── index.css                # Fluent dark-mode metallurgy design system
│   └── main.jsx                 # React DOM root entrypoint
├── PRESENTATION_SLIDES_GUIDE.md # Comprehensive 14-slide PowerPoint presentation deck guide
├── PROJECT_DOCUMENTATION.md     # In-depth technical and scientific whitepaper
├── presentation_overview.pdf    # Master demonstration & visual verification document
└── vite.config.js               # Vite build configuration
```

---

## 📄 Documentation & Presentation Resources

- **Presentation & Demonstration Guide (PDF):** [`presentation_overview.pdf`](presentation_overview.pdf)
- **PowerPoint Slide Deck Guide:** [`PRESENTATION_SLIDES_GUIDE.md`](PRESENTATION_SLIDES_GUIDE.md)
- **Complete Technical Whitepaper:** [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md)

---

## 🎓 Academic Context

Developed as an engineering mini-project bridging **Materials Science & Engineering (Physical Metallurgy)** with **High-Performance Multi-Threaded Web Graphics (HTML5 Canvas, Web Workers & Electron)**.
