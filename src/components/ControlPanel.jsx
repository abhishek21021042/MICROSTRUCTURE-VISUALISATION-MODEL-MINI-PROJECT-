import { STEEL_PRESETS } from '../models/metallurgy';
import PhaseDiagram from './PhaseDiagram';
import CCTDiagram from './CCTDiagram';

/**
 * Slider control component with label and value display.
 */
function Slider({ label, value, min, max, step, unit, onChange }) {
  const displayValue = step < 1 ? value.toFixed(2) : Math.round(value);
  return (
    <div className="control-group">
      <div className="control-group__header">
        <label className="control-group__label">{label}</label>
        <span className="control-group__value">{displayValue}{unit && ` ${unit}`}</span>
      </div>
      <input
        type="range"
        className="control-group__slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/**
 * Left panel with all input controls + diagrams.
 */
export default function ControlPanel({ params, phases, onParamsChange }) {
  const update = (key, value) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="panel" id="control-panel">
      {/* Steel Composition */}
      <div className="panel__section">
        <h3 className="panel__section-title">Steel Composition</h3>

        <div className="composition-presets">
          {STEEL_PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={`preset-chip ${Math.abs(params.carbon - preset.carbon) < 0.01 ? 'preset-chip--active' : ''}`}
              onClick={() => update('carbon', preset.carbon)}
              title={preset.desc}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <Slider
          label="Carbon Content"
          value={params.carbon}
          min={0.02}
          max={1.8}
          step={0.01}
          unit="wt%"
          onChange={(v) => update('carbon', v)}
        />
        <p className="tooltip-text">
          {params.carbon <= 0.022 ? '≈ Pure iron (ferrite)' :
           params.carbon <= 0.3 ? 'Low carbon steel' :
           params.carbon <= 0.6 ? 'Medium carbon steel' :
           params.carbon <= 0.76 ? 'High carbon (near eutectoid)' :
           params.carbon <= 1.0 ? 'Hypereutectoid steel' :
           'Very high carbon steel'}
        </p>
      </div>

      <div className="divider" />

      {/* Fe-C Phase Diagram */}
      <div className="panel__section">
        <h3 className="panel__section-title">Fe-C Phase Diagram</h3>
        <PhaseDiagram carbonContent={params.carbon} />
      </div>

      <div className="divider" />

      {/* Cooling Rate */}
      <div className="panel__section">
        <h3 className="panel__section-title">Heat Treatment</h3>

        <Slider
          label="Cooling Rate"
          value={params.coolingRate}
          min={0.1}
          max={500}
          step={0.1}
          unit="°C/s"
          onChange={(v) => update('coolingRate', v)}
        />
        <p className="tooltip-text">
          {params.coolingRate < 1 ? '🐌 Furnace cooled (equilibrium)' :
           params.coolingRate < 10 ? '💨 Air cooled' :
           params.coolingRate < 100 ? '🌊 Oil quenched' :
           '❄️ Water quenched'}
        </p>
      </div>

      <div className="divider" />

      {/* CCT Diagram */}
      <div className="panel__section">
        <h3 className="panel__section-title">CCT Diagram</h3>
        <CCTDiagram coolingRate={params.coolingRate} carbon={params.carbon} />
      </div>

      <div className="divider" />

      {/* Display Settings */}
      <div className="panel__section">
        <h3 className="panel__section-title">Display Settings</h3>

        <Slider
          label="Magnification"
          value={params.magnification}
          min={50}
          max={2000}
          step={50}
          unit="×"
          onChange={(v) => update('magnification', v)}
        />

        <div className="control-group">
          <div className="control-group__header">
            <label className="control-group__label">Etchant</label>
          </div>
          <select
            className="control-select"
            value={params.etchant}
            onChange={(e) => update('etchant', e.target.value)}
          >
            <option value="nital2">2% Nital (HNO₃ + Ethanol)</option>
            <option value="nital5">5% Nital (stronger etch)</option>
            <option value="picral">Picral (Picric acid)</option>
          </select>
        </div>

        <div className="control-group" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.showBoundaries}
              onChange={(e) => update('showBoundaries', e.target.checked)}
            />
            Boundaries
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={params.postProcessing}
              onChange={(e) => update('postProcessing', e.target.checked)}
            />
            Post-FX
          </label>
        </div>
      </div>

      <div className="divider" />

      <div className="panel__section">
        <button
          className="btn btn--primary"
          style={{ width: '100%' }}
          onClick={() => update('seed', Date.now())}
          id="regenerate-btn"
        >
          🔄 Regenerate Structure
        </button>
      </div>
    </div>
  );
}
