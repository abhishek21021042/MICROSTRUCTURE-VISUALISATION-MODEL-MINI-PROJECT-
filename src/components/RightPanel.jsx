import PhaseDiagram from './PhaseDiagram';
import CCTDiagram from './CCTDiagram';

export default function RightPanel({ params, onExpandDiagram }) {
  return (
    <div className="sidebar-col sidebar-col--right">
      {/* Metallurgical Diagrams Header */}
      <div className="sidebar-main-header">
        <svg className="sidebar-main-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="sidebar-main-header__text">Metallurgical Diagrams</span>
      </div>

      {/* Card 1: Fe-C Equilibrium Phase Diagram */}
      <div className="panel-card panel-card--diagram">
        <div className="panel-card__header panel-card__header--between">
          <div className="panel-card__header-left">
            <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <span className="panel-card__title">Fe-C Phase Diagram</span>
          </div>

          <button
            type="button"
            className="diagram-expand-btn"
            onClick={() => onExpandDiagram('phase')}
            title="Expand Fe-C Phase Diagram"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="expand-icon">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Expand</span>
          </button>
        </div>

        <div className="phase-diagram-container">
          <PhaseDiagram carbonContent={params.carbon} width={280} height={190} />
        </div>

        <div className="diagram-caption">
          <span>Equilibrium phases at <strong>{params.carbon.toFixed(2)} wt% C</strong>: <em>{params.carbon < 0.76 ? 'α + Pearlite' : Math.abs(params.carbon - 0.76) < 0.02 ? '100% Pearlite' : 'Pearlite + Fe₃C'}</em></span>
        </div>
      </div>

      {/* Card 2: Continuous Cooling Transformation (CCT) */}
      <div className="panel-card panel-card--diagram">
        <div className="panel-card__header panel-card__header--between">
          <div className="panel-card__header-left">
            <svg className="panel-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="panel-card__title">CCT Kinetics Diagram</span>
          </div>

          <button
            type="button"
            className="diagram-expand-btn"
            onClick={() => onExpandDiagram('cct')}
            title="Expand CCT Kinetics Diagram"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="expand-icon">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Expand</span>
          </button>
        </div>

        <div className="phase-diagram-container">
          <CCTDiagram coolingRate={params.coolingRate} carbon={params.carbon} width={280} height={190} />
        </div>

        <div className="diagram-caption">
          <span>Trajectory at <strong>{params.coolingRate.toFixed(1)} °C/s</strong></span>
        </div>
      </div>
    </div>
  );
}
