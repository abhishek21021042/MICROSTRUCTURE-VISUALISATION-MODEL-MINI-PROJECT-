import React from 'react';

export default function TheoryModal({ isOpen = true, onClose }) {
  if (isOpen === false) return null;

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className="app-modal-content app-modal-content--lg" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>📚</span>
            <h3>Metallurgical Theory &amp; Mathematical Formulations</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="app-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Section 1: Fe-C Equilibrium & Lever Rule */}
          <div className="theory-section">
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>1. Iron-Carbon Equilibrium &amp; The Lever Rule</h4>
            <p>
              In hypoeutectoid steels (C &lt; 0.76 wt%), cooling from the austenite region (γ) first leads to proeutectoid ferrite (α) nucleation at austenite grain boundaries.
              At the eutectoid temperature (727°C / A<sub>1</sub>), remaining austenite decomposes into lamellar pearlite (α + Fe<sub>3</sub>C):
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #38bdf8', margin: '8px 0' }}>
              <code>f<sub>pro-ferrite</sub> = (0.76 - %C) / (0.76 - 0.022)</code><br />
              <code>f<sub>pearlite</sub> = 1 - f<sub>pro-ferrite</sub></code>
            </div>
            <p>
              For hypereutectoid steels (%C &gt; 0.76 wt%), proeutectoid cementite (Fe<sub>3</sub>C) precipitates along prior austenite boundaries:
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', margin: '8px 0' }}>
              <code>f<sub>pro-cementite</sub> = (%C - 0.76) / (6.67 - 0.76)</code><br />
              <code>f<sub>pearlite</sub> = 1 - f<sub>pro-cementite</sub></code>
            </div>
          </div>

          {/* Section 2: CCT Kinetic Formulation & C-Curves */}
          <div className="theory-section" style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>2. Continuous Cooling Transformations (CCT Kinetics)</h4>
            <p>
              Transformation start/finish boundaries in temperature vs. log-time space follow the thermodynamic C-curve kinetic formulation (Kirkaldy-Venugopalan &amp; standard ASM kinetics):
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #10b981', margin: '8px 0' }}>
              <code>log<sub>10</sub> t(T) = τ<sub>nose</sub>(C) + ((T - T<sub>nose</sub>) / σ<sub>T</sub>)<sup>2</sup></code>
            </div>
            <p>
              where the incubation time at the nose (τ<sub>nose</sub>) shifts with carbon content due to increased austenite stability and hardenability:
            </p>
            <ul>
              <li><strong>Ferrite Nose (F<sub>s</sub>):</strong> T<sub>nose</sub> ≈ 650°C, τ<sub>nose</sub> = 0.45 + 0.85(C - 0.4) (C &lt; 0.76 wt%)</li>
              <li><strong>Cementite Nose (Fe<sub>3</sub>C<sub>s</sub>):</strong> T<sub>nose</sub> ≈ 760°C, τ<sub>nose</sub> = 0.70 + 0.85(C - 0.76) (C ≥ 0.76 wt%)</li>
              <li><strong>Pearlite Nose (P<sub>s</sub>):</strong> T<sub>nose</sub> ≈ 550°C, τ<sub>nose</sub> = 0.80 + 0.85(C - 0.4)</li>
              <li><strong>Bainite Nose (B<sub>s</sub>):</strong> T<sub>nose</sub> ≈ 430°C, τ<sub>nose</sub> = 1.05 + 0.85(C - 0.4)</li>
            </ul>
            <p>
              Transformation finish curves (P<sub>f</sub>, B<sub>f</sub>) are calculated via the <strong>Johnson-Mehl-Avrami-Kolmogorov (JMAK)</strong> equation:
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #38bdf8', margin: '8px 0' }}>
              <code>X(t) = 1 - exp(-(k · t)<sup>n</sup>) ⟹ Δlog<sub>10</sub> t ≈ 1.25 decades (1% → 99%)</code>
            </div>
          </div>

          {/* Section 3: Continuous Cooling Trajectory */}
          <div className="theory-section" style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>3. Newton-Fourier Continuous Cooling Trajectory</h4>
            <p>
              Cooling from the austenitizing temperature (T<sub>0</sub> = 850°C) to ambient (T<sub>amb</sub> = 25°C) is calibrated to the metallurgical Δt<sub>8/5</sub> standard (Δt from 800°C to 500°C = 300 / CoolingRate):
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #06b6d4', margin: '8px 0' }}>
              <code>T(t) = T<sub>amb</sub> + (T<sub>0</sub> - T<sub>amb</sub>) · exp(-k · t)</code><br />
              <code>k = ln(775/475) / Δt<sub>8/5</sub> = (0.4904 · R) / 300 s<sup>-1</sup></code>
            </div>
          </div>

          {/* Section 4: Martensite Andrews & Koistinen-Marburger */}
          <div className="theory-section" style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>4. Diffusionless Martensitic Transformation</h4>
            <p>
              Martensite start temperature (M<sub>s</sub>) is modeled by the empirical <strong>Andrews</strong> formulation:
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #f43f5e', margin: '8px 0' }}>
              <code>M<sub>s</sub> (°C) = 539 - 423(%C) - 30.4(%Mn) - 17.7(%Ni) - 12.1(%Cr)</code>
            </div>
            <p>
              Below M<sub>s</sub>, athermal martensite transformation follows the <strong>Koistinen-Marburger</strong> equation:
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #f43f5e', margin: '8px 0' }}>
              <code>f<sub>M</sub>(T) = 1 - exp(-0.011 · (M<sub>s</sub> - T)) &nbsp; [T ≤ M<sub>s</sub>]</code>
            </div>
          </div>

          {/* Section 5: Zener-Hillert Pearlite Spacing */}
          <div className="theory-section" style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>5. Zener-Hillert Pearlite Interlamellar Spacing</h4>
            <p>
              Interlamellar spacing (λ) is inversely proportional to undercooling below A<sub>1</sub>:
            </p>
            <div className="formula-box" style={{ background: '#0a0e17', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #8b5cf6', margin: '8px 0' }}>
              <code>λ = (4 · σ<sub>α/θ</sub> · T<sub>E</sub>) / (ΔH<sub>v</sub> · ΔT) ∝ 1 / ΔT</code>
            </div>
          </div>
        </div>

        <div className="app-modal-footer" style={{ padding: '12px 18px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="preset-btn preset-btn--active" onClick={onClose}>Close Theory Guide</button>
        </div>
      </div>
    </div>
  );
}
