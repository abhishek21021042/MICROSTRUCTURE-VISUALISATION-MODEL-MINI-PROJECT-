import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import LeftPanel from './components/LeftPanel';
import Viewport from './components/Viewport';
import RightPanel from './components/RightPanel';
import PhaseDiagram from './components/PhaseDiagram';
import CCTDiagram from './components/CCTDiagram';
import TheoryModal from './components/TheoryModal';
import {
  calculatePhases,
  lamellarSpacing as calcLamellarSpacing,
  austenitGrainSize,
} from './models/metallurgy';
import MicrostructureWorker from './workers/microstructure.worker.js?worker';

const DEFAULT_PARAMS = {
  carbon: 0.40,
  coolingRate: 259.40,
  coolingMedium: 'Water (Quenched)',
  magnification: 1571,
  etchant: 'nital2',
  contrast: 1.0,
  brightness: 0.0,
  grainBoundaryEnhance: 1.2,
  showScaleBar: true,
  showBoundaries: true,
  showPhaseColors: false,
  showPhaseLabels: false,
  highResolution: true,
  postProcessing: true,
  seed: 42,
};

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [microstructureData, setMicrostructureData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDiagram, setExpandedDiagram] = useState(null); // 'phase' | 'cct' | null
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const workerRef = useRef(null);

  // Expose automation helpers for reliable headless screenshot capture
  useEffect(() => {
    window.__setSimulationParams = (newParams) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    };
    window.__setExpandedDiagram = setExpandedDiagram;
    window.__setShowTheoryModal = setShowTheoryModal;
  }, []);

  // Derived metallurgical calculations
  const phases = useMemo(
    () => calculatePhases(params.carbon, params.coolingRate),
    [params.carbon, params.coolingRate]
  );

  const grainSize = useMemo(
    () => austenitGrainSize(900, 1),
    []
  );

  const spacing = useMemo(
    () => calcLamellarSpacing(params.coolingRate),
    [params.coolingRate]
  );

  // Combined render settings for the canvas
  const renderSettings = useMemo(() => ({
    lamellarSpacing: spacing,
    showBoundaries: params.showBoundaries,
    showScaleBar: params.showScaleBar,
    showPhaseColors: params.showPhaseColors,
    showPhaseLabels: params.showPhaseLabels,
    highResolution: params.highResolution,
    postProcessing: params.postProcessing,
    etchant: params.etchant,
    contrast: params.contrast,
    brightness: params.brightness,
    grainBoundaryEnhance: params.grainBoundaryEnhance,
    magnification: params.magnification,
  }), [
    spacing,
    params.showBoundaries,
    params.showScaleBar,
    params.showPhaseColors,
    params.showPhaseLabels,
    params.highResolution,
    params.postProcessing,
    params.etchant,
    params.contrast,
    params.brightness,
    params.grainBoundaryEnhance,
    params.magnification,
  ]);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new MicrostructureWorker();
    workerRef.current.onmessage = (e) => {
      setMicrostructureData(e.data);
      setIsGenerating(false);
    };
    return () => workerRef.current?.terminate();
  }, []);

  // Generate microstructure when metallurgical inputs change
  const generate = useCallback(() => {
    if (!workerRef.current) return;
    setIsGenerating(true);
    workerRef.current.postMessage({
      phases,
      grainSize,
      coolingRate: params.coolingRate,
      seed: params.seed,
    });
  }, [phases, grainSize, params.coolingRate, params.seed]);

  useEffect(() => {
    generate();
  }, [generate]);

  // Window control handlers (Electron or Web)
  const handleMinimize = () => {
    if (window.electronAPI?.minimize) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.close) {
      window.electronAPI.close();
    } else {
      window.close();
    }
  };

  const handleSettingChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const canvas = document.querySelector('.microstructure-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `microstructure-${params.carbon.toFixed(2)}C-${params.coolingRate.toFixed(0)}Cs.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="windows-app-shell">
      {/* Top Application Bar */}
      <header className="windows-topbar">
        {/* Left: App Logo & Title */}
        <div className="windows-topbar__left">
          <div className="app-logo-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="app-logo-icon">
              <path d="M10 2v7.31L4.36 19.3A2 2 0 0 0 6.09 22h11.82a2 2 0 0 0 1.73-2.7L14 9.31V2" />
              <path d="M8.5 2h7" />
              <path d="M14 9.3h-4" />
            </svg>
          </div>
          <div className="app-title-block">
            <span className="app-title-main">Microstructure Visualizer</span>
            <span className="app-title-sub">Fe-C Steel Phase Transformation Simulator</span>
          </div>
        </div>

        {/* Right: Settings & Window Controls */}
        <div className="windows-topbar__right">
          <button
            type="button"
            className="settings-action-btn"
            onClick={() => setShowSettingsModal(true)}
            title="App Settings & Etchant Options"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          <div className="windows-title-controls">
            <button type="button" className="win-ctrl-btn" onClick={handleMinimize} title="Minimize">
              ─
            </button>
            <button type="button" className="win-ctrl-btn" onClick={handleMaximize} title="Maximize">
              □
            </button>
            <button type="button" className="win-ctrl-btn win-ctrl-btn--close" onClick={handleClose} title="Close">
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* Main App 3-Column Workstation Layout */}
      <main className="workstation-container">
        {/* Left Column: Steel Composition, Phase Fractions, Phase Diagram */}
        <LeftPanel
          params={params}
          phases={phases}
          onParamsChange={setParams}
        />

        {/* Center Column: Viewport Tabs, Canvas, Bottom Floating Tools */}
        <Viewport
          microstructureData={microstructureData}
          renderSettings={renderSettings}
          onSettingsChange={handleSettingChange}
        />

        {/* Right Column: Metallurgical Diagrams with Expand Option */}
        <RightPanel
          params={params}
          onExpandDiagram={(diag) => setExpandedDiagram(diag)}
        />
      </main>

      {/* High-Definition Expanded Diagram Modal */}
      {expandedDiagram && (
        <div className="app-modal-backdrop" onClick={() => setExpandedDiagram(null)}>
          <div className="app-modal-content app-modal-content--diagram-expand" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
                  {expandedDiagram === 'phase'
                    ? 'Fe-C Equilibrium Phase Diagram (High-Definition)'
                    : 'Continuous Cooling Transformation (CCT) Kinetics (High-Definition)'}
                </h3>
                <div className="modal-tab-toggle">
                  <button
                    type="button"
                    className={`modal-toggle-btn ${expandedDiagram === 'phase' ? 'modal-toggle-btn--active' : ''}`}
                    onClick={() => setExpandedDiagram('phase')}
                  >
                    Fe-C Phase Diagram
                  </button>
                  <button
                    type="button"
                    className={`modal-toggle-btn ${expandedDiagram === 'cct' ? 'modal-toggle-btn--active' : ''}`}
                    onClick={() => setExpandedDiagram('cct')}
                  >
                    CCT Diagram
                  </button>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setExpandedDiagram(null)} title="Close (Esc)">✕</button>
            </div>
            <div className="app-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              {expandedDiagram === 'phase' ? (
                <>
                  <PhaseDiagram carbonContent={params.carbon} width={740} height={460} />
                  <div className="diagram-expanded-info">
                    <div className="info-badge">Carbon: <strong>{params.carbon.toFixed(2)} wt% C</strong></div>
                    <div className="info-badge">{params.carbon <= 0.76 ? 'A₃ Temperature' : 'Acm Temperature'}: <strong>{(params.carbon <= 0.76 ? 912 - 370 * params.carbon + 166 * params.carbon * params.carbon : 727 + 305 * (params.carbon - 0.76)).toFixed(0)} °C</strong></div>
                    <div className="info-badge">A₁ Eutectoid: <strong>727 °C</strong></div>
                    <div className="info-badge">Equilibrium State: <strong>{params.carbon < 0.76 ? 'Proeutectoid Ferrite (α) + Pearlite' : Math.abs(params.carbon - 0.76) < 0.02 ? '100% Pearlite' : 'Pearlite + Fe₃C network'}</strong></div>
                  </div>
                </>
              ) : (
                <>
                  <CCTDiagram coolingRate={params.coolingRate} carbon={params.carbon} width={740} height={460} />
                  <div className="diagram-expanded-info">
                    <div className="info-badge">Cooling Rate: <strong>{params.coolingRate.toFixed(1)} °C/s</strong></div>
                    <div className="info-badge">Carbon: <strong>{params.carbon.toFixed(2)} wt% C</strong></div>
                    <div className="info-badge">Ms (Andrews): <strong>{Math.max(80, Math.min(500, Math.round(539 - 423 * params.carbon)))} °C</strong></div>
                    <div className="info-badge">Cooling Medium: <strong>{params.coolingMedium || 'Water (Quenched)'}</strong></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="app-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="app-modal-content app-modal-content--sm" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <h3>Application &amp; Metallography Settings</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="app-modal-body">
              <div className="settings-field">
                <label className="input-label">Chemical Etchant Solution</label>
                <select
                  className="styled-select"
                  value={params.etchant}
                  onChange={(e) => handleSettingChange('etchant', e.target.value)}
                >
                  <option value="nital2">2% Nital (Nitric Acid in Ethanol) — Standard Carbon Steel</option>
                  <option value="nital5">5% Nital (Rapid Grain Boundary Etch)</option>
                  <option value="picral">4% Picral (Picric Acid in Ethanol) — Optimal Pearlite Delineation</option>
                </select>
              </div>

              <div className="settings-field" style={{ marginTop: '16px' }}>
                <label className="input-label">Microstructure Random Seed</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="styled-input"
                    value={params.seed}
                    onChange={(e) => handleSettingChange('seed', parseInt(e.target.value, 10) || 1)}
                  />
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleSettingChange('seed', Math.floor(Math.random() * 100000))}
                  >
                    🎲 Re-seed
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowTheoryModal(true);
                  }}
                >
                  📚 Theory &amp; Formulas
                </button>
                <button
                  type="button"
                  className="preset-btn preset-btn--active"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTheoryModal && <TheoryModal onClose={() => setShowTheoryModal(false)} />}
    </div>
  );
}
