import { useMemo } from 'react';

const STEEL_PRESETS = [
  { name: 'Low Carbon', carbon: 0.15, desc: 'Hypoeutectoid: predominant proeutectoid ferrite matrix with minor pearlite colonies.' },
  { name: 'Medium Carbon', carbon: 0.40, desc: 'Hypoeutectoid: balanced proeutectoid ferrite network and dense pearlite.' },
  { name: 'High Carbon', carbon: 1.00, desc: 'Hypereutectoid: pearlite colonies with proeutectoid grain boundary cementite.' },
  { name: 'Eutectoid', carbon: 0.76, desc: 'Eutectoid 0.76 wt% C: 100% fine lamellar pearlite colonies.' },
  { name: 'Hypereutectoid', carbon: 1.40, desc: 'Hypereutectoid 1.40 wt% C: coarse pearlite enclosed by continuous Fe3C network.' },
];

const CARBON_TICKS = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6', '1.8', '2.0'];

const COOLING_PRESETS = [
  { name: 'Water (Quenched)', rate: 259.40 },
  { name: 'Oil (Quenched)', rate: 65.00 },
  { name: 'Forced Air (Normalized)', rate: 18.50 },
  { name: 'Still Air (Normalizing)', rate: 2.50 },
  { name: 'Furnace (Annealed)', rate: 0.15 },
];

const COOLING_TICKS = ['0', '10', '50', '100', '500', '1000'];

function rateToSlider(rate) {
  if (rate <= 0.1) return 0;
  const minLog = Math.log10(0.1);
  const maxLog = Math.log10(1000);
  const curLog = Math.log10(Math.max(0.1, rate));
  return ((curLog - minLog) / (maxLog - minLog)) * 100;
}

function sliderToRate(val) {
  const minLog = Math.log10(0.1);
  const maxLog = Math.log10(1000);
  const logVal = minLog + (val / 100) * (maxLog - minLog);
  const rate = Math.pow(10, logVal);
  return rate < 1 ? +rate.toFixed(2) : rate < 100 ? +rate.toFixed(1) : +rate.toFixed(0);
}

function getMediumForRate(rate) {
  if (rate >= 150) return 'Water (Quenched)';
  if (rate >= 40) return 'Oil (Quenched)';
  if (rate >= 10) return 'Forced Air (Normalized)';
  if (rate >= 1) return 'Still Air (Normalizing)';
  return 'Furnace (Annealed)';
}

export default function LeftPanel({ params, phases, onParamsChange }) {
  const update = (key, value) => {
    if (key === 'coolingRate') {
      onParamsChange({ ...params, coolingRate: value, coolingMedium: getMediumForRate(value) });
    } else {
      onParamsChange({ ...params, [key]: value });
    }
  };

  const steelClassification = useMemo(() => {
    const c = params.carbon;
    if (c < 0.03) return 'Ultra-low carbon iron (Ferrite)';
    if (c < 0.25) return 'Low carbon mild steel';
    if (c < 0.60) return 'Medium carbon steel';
    if (Math.abs(c - 0.76) <= 0.03) return 'Eutectoid steel (100% Pearlite)';
    if (c < 0.76) return 'High carbon hypoeutectoid steel';
    if (c <= 2.00) return 'Hypereutectoid tool steel';
    return 'Cast iron range';
  }, [params.carbon]);

  const handleMediumChange = (e) => {
    const selected = COOLING_PRESETS.find((p) => p.name === e.target.value);
    if (selected) {
      onParamsChange({ ...params, coolingRate: selected.rate, coolingMedium: selected.name });
    }
  };

  const currentMedium = getMediumForRate(params.coolingRate);

  const phaseList = useMemo(() => {
    const list = [];
    if (params.carbon < 0.76 || phases.ferrite > 0.001) {
      list.push({ name: 'Ferrite (α)', key: 'ferrite', val: phases.ferrite, color: '#f4eee0' });
    }
    list.push({ name: 'Pearlite', key: 'pearlite', val: phases.pearlite, color: '#8b8070' });
    list.push({ name: 'Bainite', key: 'bainite', val: phases.bainite, color: '#b59c77' });
    list.push({ name: 'Martensite', key: 'martensite', val: phases.martensite, color: '#3b322a' });
    if (params.carbon > 0.76 || phases.cementite > 0.001) {
      list.push({ name: 'Cementite (Fe₃C)', key: 'cementite', val: phases.cementite, color: '#fdfbf7' });
    }
    return list;
  }, [params.carbon, phases]);

  return (
    <div className="sidebar-col sidebar-col--left">
      {/* Simulation Controls Header */}
      <div className="sidebar-main-header">
        <svg className="sidebar-main-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <span className="sidebar-main-header__text">Simulation Controls</span>
      </div>

      {/* Card 1: Steel Composition */}
      <div className="panel-card">
        <div className="panel-card__header">
          <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 2v7.31L4.36 19.3A2 2 0 0 0 6.09 22h11.82a2 2 0 0 0 1.73-2.7L14 9.31V2" />
            <path d="M8.5 2h7" />
            <path d="M14 9.3h-4" />
          </svg>
          <span className="panel-card__title">1. Steel Composition</span>
        </div>

        {/* Preset chips */}
        <div className="preset-grid">
          <div className="preset-row">
            {STEEL_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.name}
                type="button"
                className={`preset-btn ${Math.abs(params.carbon - p.carbon) < 0.02 ? 'preset-btn--active' : ''}`}
                onClick={() => update('carbon', p.carbon)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="preset-row preset-row--two">
            {STEEL_PRESETS.slice(3, 5).map((p) => (
              <button
                key={p.name}
                type="button"
                className={`preset-btn ${Math.abs(params.carbon - p.carbon) < 0.02 ? 'preset-btn--active' : ''}`}
                onClick={() => update('carbon', p.carbon)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Carbon input & slider */}
        <div className="input-group">
          <div className="input-group__row">
            <label className="input-label">Carbon Content (wt% C)</label>
            <div className="stepper-box">
              <input
                type="number"
                className="stepper-input"
                min="0.02"
                max="2.00"
                step="0.01"
                value={params.carbon.toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) update('carbon', Math.max(0.02, Math.min(2.0, val)));
                }}
              />
              <div className="stepper-controls">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => update('carbon', Math.min(2.0, +(params.carbon + 0.05).toFixed(2)))}
                >▲</button>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => update('carbon', Math.max(0.02, +(params.carbon - 0.05).toFixed(2)))}
                >▼</button>
              </div>
            </div>
          </div>

          <div className="slider-wrapper">
            <input
              type="range"
              className="styled-slider"
              min="0.0"
              max="2.0"
              step="0.01"
              value={params.carbon}
              onChange={(e) => update('carbon', parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(params.carbon / 2.0) * 100}%, #1e293b ${(params.carbon / 2.0) * 100}%, #1e293b 100%)`
              }}
            />
            <div className="slider-ticks">
              {CARBON_TICKS.map((t) => (
                <span key={t} className="tick-label">{t}</span>
              ))}
            </div>
          </div>

          <div className="steel-class-subtext">
            <em>{steelClassification}</em>
          </div>
        </div>
      </div>

      {/* Card 2: Heat Treatment Parameters */}
      <div className="panel-card">
        <div className="panel-card__header">
          <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </svg>
          <span className="panel-card__title">2. Heat Treatment</span>
        </div>

        <div className="input-group">
          <div className="input-group__row">
            <label className="input-label">Cooling Rate (°C/s)</label>
            <div className="stepper-box">
              <input
                type="number"
                className="stepper-input"
                min="0.1"
                max="1000"
                step="1"
                value={params.coolingRate.toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) update('coolingRate', Math.max(0.1, Math.min(1000, val)));
                }}
              />
              <div className="stepper-controls">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => update('coolingRate', Math.min(1000, +(params.coolingRate * 1.2).toFixed(1)))}
                >▲</button>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => update('coolingRate', Math.max(0.1, +(params.coolingRate / 1.2).toFixed(1)))}
                >▼</button>
              </div>
            </div>
          </div>

          <div className="slider-wrapper">
            <input
              type="range"
              className="styled-slider"
              min="0"
              max="100"
              step="0.5"
              value={rateToSlider(params.coolingRate)}
              onChange={(e) => update('coolingRate', sliderToRate(parseFloat(e.target.value)))}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${rateToSlider(params.coolingRate)}%, #1e293b ${rateToSlider(params.coolingRate)}%, #1e293b 100%)`
              }}
            />
            <div className="slider-ticks">
              {COOLING_TICKS.map((t) => (
                <span key={t} className="tick-label">{t}</span>
              ))}
            </div>
          </div>

          <div className="select-group">
            <label className="input-label">Cooling Medium</label>
            <select
              className="styled-select"
              value={currentMedium}
              onChange={handleMediumChange}
            >
              {COOLING_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Card 3: Phase Fractions */}
      <div className="panel-card">
        <div className="panel-card__header">
          <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="panel-card__title">3. Phase Fractions</span>
        </div>

        <div className="phase-fractions-list">
          {phaseList.map((phase) => (
            <div key={phase.key} className="phase-fraction-row">
              <div className="phase-fraction-row__left">
                <span className="phase-swatch" style={{ backgroundColor: phase.color }} />
                <span className="phase-name">{phase.name}</span>
              </div>
              <span className="phase-percentage">
                {((phase.val || 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: View Options */}
      <div className="panel-card">
        <div className="panel-card__header">
          <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="panel-card__title">4. View Options</span>
        </div>

        <div className="checkbox-list">
          <label className="checkbox-item">
            <input
              type="checkbox"
              className="styled-checkbox"
              checked={params.showScaleBar ?? true}
              onChange={(e) => update('showScaleBar', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">Show Scale Bar</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              className="styled-checkbox"
              checked={params.showBoundaries ?? true}
              onChange={(e) => update('showBoundaries', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">Show Grain Boundaries</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              className="styled-checkbox"
              checked={params.showPhaseColors ?? false}
              onChange={(e) => update('showPhaseColors', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">Show Phase Colors (Overlay)</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              className="styled-checkbox"
              checked={params.showPhaseLabels ?? false}
              onChange={(e) => update('showPhaseLabels', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">Show Phase Labels</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              className="styled-checkbox"
              checked={params.highResolution ?? true}
              onChange={(e) => update('highResolution', e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">High Resolution Rendering</span>
          </label>
        </div>
      </div>
    </div>
  );
}
