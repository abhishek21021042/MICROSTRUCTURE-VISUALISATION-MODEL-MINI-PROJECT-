/**
 * Metallurgical models for Fe-C steel microstructure prediction.
 * Implements Lever Rule, Hall-Petch, and phase transformation logic.
 */

// Fe-C Phase Diagram key points (wt% C)
export const PHASE_DIAGRAM = {
  EUTECTOID_C: 0.76,        // Eutectoid composition
  MAX_FERRITE_C: 0.022,     // Max carbon in ferrite
  MAX_AUSTENITE_C: 2.14,    // Max carbon in austenite
  CEMENTITE_C: 6.67,        // Carbon in cementite (Fe3C)
  EUTECTOID_TEMP: 727,      // °C
  A3_SLOPE: -450,           // Approximate A3 line slope (°C per wt% C)
  A3_INTERCEPT: 912,        // Pure iron austenite->ferrite temp °C
};

/**
 * Calculate the A3 temperature for a given carbon content (hypoeutectoid).
 * A3(C) ≈ 912 - 450*C  (simplified linear)
 */
export function getA3Temperature(carbonWt) {
  if (carbonWt >= PHASE_DIAGRAM.EUTECTOID_C) return PHASE_DIAGRAM.EUTECTOID_TEMP;
  return PHASE_DIAGRAM.A3_INTERCEPT + PHASE_DIAGRAM.A3_SLOPE * carbonWt;
}

/**
 * Calculate equilibrium phase fractions using the Lever Rule.
 * Returns { ferrite, pearlite, cementite } as fractions (0-1).
 */
export function leverRule(carbonWt) {
  const C = Math.max(0.001, Math.min(carbonWt, 2.0));
  const Ce = PHASE_DIAGRAM.EUTECTOID_C;
  const Cα = PHASE_DIAGRAM.MAX_FERRITE_C;
  const CFe3C = PHASE_DIAGRAM.CEMENTITE_C;

  if (C <= Cα) {
    // Nearly pure ferrite
    return { ferrite: 1, pearlite: 0, cementite: 0 };
  } else if (C <= Ce) {
    // Hypoeutectoid: proeutectoid ferrite + pearlite
    const proeutectoidFerrite = (Ce - C) / (Ce - Cα);
    const pearlite = 1 - proeutectoidFerrite;
    return { ferrite: proeutectoidFerrite, pearlite, cementite: 0 };
  } else {
    // Hypereutectoid: proeutectoid cementite + pearlite
    const proeutectoidCementite = (C - Ce) / (CFe3C - Ce);
    const pearlite = 1 - proeutectoidCementite;
    return { ferrite: 0, pearlite, cementite: proeutectoidCementite };
  }
}

/**
 * Determine phases based on carbon content AND cooling rate.
 * Returns phase fractions: { ferrite, pearlite, bainite, martensite, cementite }
 */
export function calculatePhases(carbonWt, coolingRate) {
  const equilibrium = leverRule(carbonWt);
  const rate = Math.max(0.1, Math.min(coolingRate, 1000));

  let ferrite = equilibrium.ferrite;
  let pearlite = equilibrium.pearlite;
  let cementite = equilibrium.cementite;
  let bainite = 0;
  let martensite = 0;

  // Diffusion suppression based on continuous cooling rate:
  // 1. Slow cooling & Normalizing (≤ 5 °C/s): full diffusional equilibrium (ferrite + pearlite / 100% pearlite / pearlite + Fe3C)
  if (rate > 5) {
    // Bainite forms when cooling rate bypasses the pearlite nose (starts > 5-10 °C/s)
    const bainiteOnset = Math.min(1, Math.max(0, (Math.log10(rate) - Math.log10(5)) / 1.5));
    const pearliteSuppressed = pearlite * Math.min(0.95, bainiteOnset * 0.95);
    bainite = pearliteSuppressed;
    pearlite -= pearliteSuppressed;
  }

  // 2. Martensite formation when cooling rate bypasses the bainite nose (> 25 °C/s)
  if (rate > 25) {
    const martensiteOnset = Math.min(1, Math.max(0, (Math.log10(rate) - Math.log10(25)) / 1.05));
    const transformable = pearlite + bainite;
    const newMartensite = transformable * martensiteOnset * 0.92;
    martensite += newMartensite;
    pearlite *= (1 - martensiteOnset * 0.92);
    bainite *= (1 - martensiteOnset * 0.92);
  }

  // 3. Proeutectoid ferrite suppression at high cooling rates (suppressed heterogeneous nucleation)
  if (rate > 10 && ferrite > 0) {
    const ferriteSuppression = Math.min(0.95, Math.max(0, (Math.log10(rate) - 1.0) / 1.35));
    const ferriteRemoved = ferrite * ferriteSuppression;
    ferrite -= ferriteRemoved;
    martensite += ferriteRemoved * 0.85;
    bainite += ferriteRemoved * 0.15;
  }

  // 4. Proeutectoid cementite suppression at extreme cooling (> 100 °C/s)
  if (rate > 100 && cementite > 0) {
    const cemSuppression = Math.min(0.5, (Math.log10(rate) - 2.0));
    const cemRemoved = cementite * cemSuppression;
    cementite -= cemRemoved;
    martensite += cemRemoved;
  }

  // Normalize to 1.000 (100.0%)
  const total = ferrite + pearlite + bainite + martensite + cementite;
  if (total > 0) {
    ferrite /= total;
    pearlite /= total;
    bainite /= total;
    martensite /= total;
    cementite /= total;
  }

  return { ferrite, pearlite, bainite, martensite, cementite };
}

/**
 * Estimate lamellar spacing based on cooling rate.
 * Faster cooling → finer pearlite lamellae.
 * Returns spacing in micrometers.
 */
export function lamellarSpacing(coolingRate) {
  // Empirical: S = A / (ΔT)^n where ΔT relates to cooling rate
  // Simplified: spacing decreases logarithmically with cooling rate
  const minSpacing = 0.1; // μm (fine pearlite)
  const maxSpacing = 2.0; // μm (coarse pearlite)
  const t = Math.log10(Math.max(0.1, coolingRate));
  const spacing = maxSpacing * Math.exp(-0.5 * t);
  return Math.max(minSpacing, Math.min(maxSpacing, spacing));
}

/**
 * Estimate prior austenite grain size based on austenitizing temperature and holding time.
 * Returns grain diameter in micrometers.
 */
export function austenitGrainSize(temperature, holdingTime) {
  // Simplified grain growth: d² = d0² + K * t * exp(-Q/(R*T))
  const baseSize = 20; // μm at 900°C, short hold
  const tempFactor = Math.pow((temperature - 700) / 200, 1.5);
  const timeFactor = Math.pow(holdingTime, 0.3);
  return Math.max(10, Math.min(300, baseSize * tempFactor * timeFactor));
}

/** 
 * Steel preset compositions 
 */
export const STEEL_PRESETS = [
  { name: 'Low Carbon', carbon: 0.1, desc: 'AISI 1010' },
  { name: 'Medium Carbon', carbon: 0.4, desc: 'AISI 1040' },
  { name: 'Eutectoid', carbon: 0.76, desc: 'AISI 1078' },
  { name: 'High Carbon', carbon: 1.0, desc: 'AISI 1095' },
  { name: 'Hypereutectoid', carbon: 1.4, desc: 'AISI W1' },
];

/**
 * Phase color map for rendering — returns HSL-based colors
 * that simulate how these phases appear under optical microscopy with Nital etching.
 */
export const PHASE_COLORS = {
  ferrite: { fill: '#e8e4df', name: 'Ferrite (α)', darkBoundary: true },
  pearlite: { fill: '#5c564e', name: 'Pearlite', darkBoundary: false },
  bainite: { fill: '#7a6e4d', name: 'Bainite', darkBoundary: false },
  martensite: { fill: '#2a2520', name: 'Martensite', darkBoundary: false },
  cementite: { fill: '#f0ece6', name: 'Cementite (Fe₃C)', darkBoundary: true },
};
