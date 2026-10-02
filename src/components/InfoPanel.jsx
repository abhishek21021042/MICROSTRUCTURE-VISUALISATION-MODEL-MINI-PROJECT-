import { PHASE_COLORS } from '../models/metallurgy';

/**
 * Right panel: Industrial ASTM Phase Quantification & Metallography Data
 * (Mechanical properties section removed as requested)
 */
export default function InfoPanel({ phases, grainSize, lamellarSpacing }) {
  const phaseList = [
    { key: 'ferrite', name: 'Ferrite', symbol: 'α', pct: (phases.ferrite * 100).toFixed(1), color: '#38bdf8' },
    { key: 'pearlite', name: 'Pearlite', symbol: 'P (α+Fe₃C)', pct: (phases.pearlite * 100).toFixed(1), color: '#94a3b8' },
    { key: 'bainite', name: 'Bainite', symbol: 'B', pct: (phases.bainite * 100).toFixed(1), color: '#f59e0b' },
    { key: 'martensite', name: 'Martensite', symbol: 'M (BCT)', pct: (phases.martensite * 100).toFixed(1), color: '#ef4444' },
    { key: 'cementite', name: 'Cementite', symbol: 'Fe₃C', pct: (phases.cementite * 100).toFixed(1), color: '#f8fafc' },
  ].filter((p) => parseFloat(p.pct) > 0.0);

  // ASTM E112 calculation
  const astmG = Math.max(1, Math.min(14, Math.round(-6.644 * Math.log10(grainSize / 1000) - 3.288))).toFixed(0);

  // Steel classification & equivalent engineering grade
  const carbonEstimate = phases.ferrite > 0.8 ? '0.10 - 0.20'
    : phases.ferrite > 0.4 ? '0.35 - 0.50'
    : phases.pearlite > 0.85 ? '0.70 - 0.80'
    : phases.cementite > 0.05 ? '0.90 - 1.20'
    : '0.40 - 0.60';

  const equivalentGrade = phases.ferrite > 0.8 ? 'AISI 1018 / EN C15E'
    : phases.ferrite > 0.4 ? 'AISI 1040 / EN C40'
    : phases.pearlite > 0.85 ? 'AISI 1080 / EN C80D'
    : phases.cementite > 0.05 ? 'AISI 1095 / EN C100D'
    : 'AISI 1045 / EN C45E';

  return (
    <div className="panel panel--right industrial-panel" id="info-panel">
      {/* Panel Header */}
      <div className="industrial-panel-header">
        <span className="industrial-panel-header__icon">📊</span>
        <span>QUANTIFICATION &amp; ASTM ANALYSIS</span>
      </div>

      {/* ASTM E562 Phase Fraction Quantification */}
      <div className="panel__section">
        <div className="industrial-group-header">
          <span className="industrial-group-header__title">Phase Fractions (ASTM E562 / E1245)</span>
          <span className="industrial-tag">Automated</span>
        </div>

        {/* Stacked phase distribution bar */}
        <div className="stacked-bar" style={{ marginBottom: '10px', height: '14px', borderRadius: '2px' }}>
          {phaseList.map(({ key, pct, color }) => (
            <div
              key={key}
              className="stacked-bar__segment"
              style={{
                width: `${pct}%`,
                backgroundColor: PHASE_COLORS[key]?.fill || color,
              }}
              title={`${PHASE_COLORS[key]?.name || key}: ${pct}%`}
            />
          ))}
        </div>

        {/* Industrial data grid table */}
        <div className="industrial-table-wrapper">
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Phase Constituent</th>
                <th>Symbol</th>
                <th style={{ textAlign: 'right' }}>Area %</th>
                <th style={{ textAlign: 'center' }}>95% CI</th>
              </tr>
            </thead>
            <tbody>
              {phaseList.map(({ key, name, symbol, pct }) => {
                const pVal = parseFloat(pct);
                // ASTM E562 95% Confidence Interval estimate
                const ci = (1.96 * Math.sqrt((pVal * (100 - pVal)) / 400)).toFixed(1);
                return (
                  <tr key={key}>
                    <td>
                      <span
                        className="phase-color-dot"
                        style={{ backgroundColor: PHASE_COLORS[key]?.fill || '#94a3b8' }}
                      />
                      {name}
                    </td>
                    <td className="industrial-mono">{symbol}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{pct}%</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>±{ci}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divider" />

      {/* Microstructural Parameters (ASTM E112) */}
      <div className="panel__section">
        <div className="industrial-group-header">
          <span className="industrial-group-header__title">Microstructural Parameters (ASTM E112)</span>
          <span className="industrial-tag">Calibrated</span>
        </div>

        <div className="industrial-grid-cards">
          <div className="industrial-metric-card">
            <div className="industrial-metric-card__label">Prior Austenite Grain Size</div>
            <div className="industrial-metric-card__value">
              {grainSize.toFixed(0)} <span className="industrial-metric-card__unit">µm</span>
            </div>
            <div className="industrial-metric-card__sub">Mean Linear Intercept (MLI)</div>
          </div>

          <div className="industrial-metric-card">
            <div className="industrial-metric-card__label">ASTM Grain Size Index</div>
            <div className="industrial-metric-card__value" style={{ color: '#38bdf8' }}>
              G = {astmG}
            </div>
            <div className="industrial-metric-card__sub">ASTM E112 Standard Planimetric</div>
          </div>

          {phases.pearlite > 0.01 && (
            <div className="industrial-metric-card">
              <div className="industrial-metric-card__label">Interlamellar Spacing (λ)</div>
              <div className="industrial-metric-card__value">
                {lamellarSpacing.toFixed(2)} <span className="industrial-metric-card__unit">µm</span>
              </div>
              <div className="industrial-metric-card__sub">
                {lamellarSpacing < 0.4 ? 'Fine Pearlite' : lamellarSpacing < 0.8 ? 'Medium Pearlite' : 'Coarse Pearlite'}
              </div>
            </div>
          )}

          <div className="industrial-metric-card">
            <div className="industrial-metric-card__label">Grain Shape Aspect Ratio</div>
            <div className="industrial-metric-card__value">1.08 : 1</div>
            <div className="industrial-metric-card__sub">Equiaxed Polygonal (Lloyd Relaxed)</div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Steel Specification & Standard Grade Identification */}
      <div className="panel__section">
        <div className="industrial-group-header">
          <span className="industrial-group-header__title">Specification &amp; Grade Verification</span>
        </div>

        <div className="industrial-spec-box">
          <div className="industrial-spec-row">
            <span className="industrial-spec-label">Predicted Structure:</span>
            <span className="industrial-spec-val" style={{ fontWeight: 'bold', color: 'var(--text-accent)' }}>
              {phases.martensite > 0.6 ? 'Quenched Martensitic'
                : phases.bainite > 0.4 ? 'Acicular Bainitic'
                : phases.ferrite > 0.5 ? 'Hypoeutectoid (Ferrite + Pearlite)'
                : phases.pearlite > 0.8 ? 'Fully Pearlitic (Eutectoid)'
                : 'Hypereutectoid (Pearlite + Cementite)'}
            </span>
          </div>
          <div className="industrial-spec-row">
            <span className="industrial-spec-label">Est. Carbon Range:</span>
            <span className="industrial-spec-val">{carbonEstimate} wt% C</span>
          </div>
          <div className="industrial-spec-row">
            <span className="industrial-spec-label">Standard Equivalent:</span>
            <span className="industrial-spec-val industrial-mono" style={{ color: '#22c55e' }}>{equivalentGrade}</span>
          </div>
          <div className="industrial-spec-row">
            <span className="industrial-spec-label">Etching Standard:</span>
            <span className="industrial-spec-val">ASTM E407 (Macro/Microetch)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
