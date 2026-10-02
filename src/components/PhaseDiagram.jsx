import { useRef, useEffect } from 'react';

// Scientific coordinate mapping
function createPlotMapper(width, height) {
  const isLarge = width > 400;
  const margin = {
    top: isLarge ? 28 : 18,
    right: isLarge ? 48 : 36,
    bottom: isLarge ? 42 : 32,
    left: isLarge ? 58 : 42,
  };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const mapX = (c) => {
    const clampedC = Math.max(0, Math.min(2.0, c));
    return margin.left + (clampedC / 2.0) * plotW;
  };

  const mapY = (t) => {
    const clampedT = Math.max(200, Math.min(1100, t));
    return margin.top + ((1100 - clampedT) / 900) * plotH;
  };

  return { margin, plotW, plotH, mapX, mapY, isLarge };
}

// A3 temperature curve: G(0, 912°C) -> S(0.76, 727°C)
function getA3(c) {
  if (c <= 0) return 912;
  if (c >= 0.76) return 727;
  return 912 - 370 * c + 166 * (c * c);
}

// Acm temperature curve: S(0.76, 727°C) -> E(2.14, 1148°C)
function getAcm(c) {
  if (c <= 0.76) return 727;
  return 727 + 305 * (c - 0.76);
}

// Ferrite solvus: P(0.022, 727°C) down to (0.005, 200°C)
function getFerriteSolvusC(t) {
  if (t >= 727) return 0.022;
  return 0.005 + 0.017 * ((t - 200) / 527);
}

/**
 * Scientifically accurate Fe-C equilibrium phase diagram (steel region: 0-2.0 wt% C).
 */
export default function PhaseDiagram({ carbonContent, width = 290, height = 210 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { margin, plotW, plotH, mapX, mapY, isLarge } = createPlotMapper(width, height);

    // Background
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    for (let t = 300; t <= 1100; t += 200) {
      ctx.beginPath();
      ctx.moveTo(margin.left, mapY(t));
      ctx.lineTo(width - margin.right, mapY(t));
      ctx.stroke();
    }
    for (let c = 0.5; c <= 2.0; c += 0.5) {
      ctx.beginPath();
      ctx.moveTo(mapX(c), margin.top);
      ctx.lineTo(mapX(c), height - margin.bottom);
      ctx.stroke();
    }

    // ==========================================
    // 1. PHASE FIELDS (Thermodynamically exact)
    // ==========================================

    // AUSTENITE (γ) field
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.beginPath();
    // Start at G (0, 912)
    ctx.moveTo(mapX(0), mapY(912));
    // Follow A3 curve to S (0.76, 727)
    for (let c = 0.02; c <= 0.76; c += 0.02) {
      ctx.lineTo(mapX(c), mapY(getA3(c)));
    }
    // Follow Acm to right edge (2.0 wt% C)
    for (let c = 0.78; c <= 2.0; c += 0.04) {
      ctx.lineTo(mapX(c), mapY(Math.min(1100, getAcm(c))));
    }
    // Top right and top left
    ctx.lineTo(mapX(2.0), mapY(1100));
    ctx.lineTo(mapX(0), mapY(1100));
    ctx.closePath();
    ctx.fill();

    // FERRITE + AUSTENITE (α + γ) two-phase field
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(912));
    for (let c = 0.02; c <= 0.76; c += 0.02) {
      ctx.lineTo(mapX(c), mapY(getA3(c)));
    }
    // Horizontal A1 line from S(0.76) to P(0.022)
    ctx.lineTo(mapX(0.022), mapY(727));
    // Up to G(0, 912)
    ctx.lineTo(mapX(0), mapY(912));
    ctx.closePath();
    ctx.fill();

    // AUSTENITE + CEMENTITE (γ + Fe3C) two-phase field
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.beginPath();
    ctx.moveTo(mapX(0.76), mapY(727));
    for (let c = 0.78; c <= 2.0; c += 0.04) {
      ctx.lineTo(mapX(c), mapY(Math.min(1100, getAcm(c))));
    }
    ctx.lineTo(mapX(2.0), mapY(727));
    ctx.closePath();
    ctx.fill();

    // HYPOEUTECTOID: FERRITE + PEARLITE (α + P)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.07)';
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(727));
    ctx.lineTo(mapX(0.76), mapY(727));
    ctx.lineTo(mapX(0.76), mapY(200));
    ctx.lineTo(mapX(0), mapY(200));
    ctx.closePath();
    ctx.fill();

    // HYPEREUTECTOID: PEARLITE + CEMENTITE (P + Fe3C)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
    ctx.beginPath();
    ctx.moveTo(mapX(0.76), mapY(727));
    ctx.lineTo(mapX(2.0), mapY(727));
    ctx.lineTo(mapX(2.0), mapY(200));
    ctx.lineTo(mapX(0.76), mapY(200));
    ctx.closePath();
    ctx.fill();

    // ==========================================
    // 2. PHASE BOUNDARIES
    // ==========================================

    // A3 Curve (Green)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(912));
    for (let c = 0.02; c <= 0.76; c += 0.02) {
      ctx.lineTo(mapX(c), mapY(getA3(c)));
    }
    ctx.stroke();

    // Acm Curve (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(mapX(0.76), mapY(727));
    for (let c = 0.78; c <= 2.0; c += 0.04) {
      ctx.lineTo(mapX(c), mapY(Math.min(1100, getAcm(c))));
    }
    ctx.stroke();

    // Eutectoid Isotherm A1 = 727°C (Red dashed)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mapX(0.022), mapY(727));
    ctx.lineTo(mapX(2.0), mapY(727));
    ctx.stroke();
    ctx.setLineDash([]);

    // Ferrite solvus line (left boundary of alpha)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mapX(0.022), mapY(727));
    ctx.lineTo(mapX(0.005), mapY(200));
    ctx.stroke();

    // Vertical boundary separating Hypo / Hyper at Eutectoid
    ctx.strokeStyle = '#47556940';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(mapX(0.76), mapY(727));
    ctx.lineTo(mapX(0.76), mapY(200));
    ctx.stroke();
    ctx.setLineDash([]);

    // Eutectoid Invariant Point S (0.76 wt% C, 727°C)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mapX(0.76), mapY(727), 4, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // 3. ANNOTATIONS & PHASE LABELS
    // ==========================================
    const titleFont = isLarge ? 'bold 13px Inter, sans-serif' : 'bold 9px Inter, sans-serif';
    const bodyFont = isLarge ? '11px Inter, sans-serif' : '8px Inter, sans-serif';

    ctx.font = titleFont;
    ctx.textAlign = 'center';

    // Austenite label
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('γ (Austenite)', mapX(0.6), mapY(960));

    // α + γ label
    ctx.fillStyle = '#22c55ee0';
    ctx.font = bodyFont;
    ctx.fillText('α + γ', mapX(0.28), mapY(800));

    // γ + Fe3C label
    ctx.fillStyle = '#f59e0be0';
    ctx.fillText('γ + Fe₃C', mapX(1.4), mapY(870));

    // Hypoeutectoid (Ferrite + Pearlite)
    ctx.fillStyle = '#94a3b8';
    ctx.font = bodyFont;
    ctx.fillText('α + Pearlite', mapX(0.38), mapY(480));

    // Hypereutectoid (Pearlite + Cementite)
    ctx.fillText('Pearlite + Fe₃C', mapX(1.38), mapY(480));

    // Line labels
    ctx.fillStyle = '#22c55e';
    ctx.font = isLarge ? 'bold 12px Inter, sans-serif' : 'bold 9px Inter, sans-serif';
    ctx.fillText('A₃', mapX(0.12), mapY(890));

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Acm', mapX(1.65), mapY(1040));

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText('A₁ (727°C)', width - margin.right - 4, mapY(727) - 4);

    // Eutectoid point S label
    ctx.textAlign = 'left';
    ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
    ctx.fillText('S (0.76%)', mapX(0.76) + 6, mapY(727) - 5);

    // ==========================================
    // 4. LIVE COMPOSITION MARKER
    // ==========================================
    const currentC = Math.max(0.02, Math.min(2.0, carbonContent));
    const markerX = mapX(currentC);

    // Vertical dashed marker line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(markerX, margin.top);
    ctx.lineTo(markerX, height - margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transformation point on A3 or Acm
    const transTemp = currentC <= 0.76 ? getA3(currentC) : getAcm(currentC);
    const transY = mapY(transTemp);

    // Marker dot with outer glow
    ctx.fillStyle = 'rgba(96, 165, 250, 0.25)';
    ctx.beginPath();
    ctx.arc(markerX, transY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerX, transY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Marker text readout tag
    if (isLarge) {
      const markerTag = `${currentC.toFixed(2)} wt% C | ${transTemp.toFixed(0)}°C (${currentC <= 0.76 ? 'A₃' : 'Acm'})`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const mMetrics = ctx.measureText(markerTag);
      const tagW = mMetrics.width + 12;
      const tagH = 20;
      const tagX = Math.min(width - margin.right - tagW / 2, Math.max(margin.left + tagW / 2, markerX));
      const tagY = Math.max(margin.top + 14, transY - 16);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX - tagW / 2, tagY - tagH / 2, tagW, tagH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(markerTag, tagX, tagY);
      ctx.textBaseline = 'alphabetic';
    }

    // ==========================================
    // 5. AXES & TICK LABELS
    // ==========================================
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // X-axis ticks & labels
    ctx.textAlign = 'center';
    ctx.font = isLarge ? '11px Inter, sans-serif' : '8px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const xTicks = [0.0, 0.5, 0.76, 1.0, 1.5, 2.0];
    for (const c of xTicks) {
      const x = mapX(c);
      const isEutectoid = c === 0.76;
      ctx.fillStyle = isEutectoid ? '#ef4444' : '#94a3b8';
      ctx.fillText(c === 0.76 ? '0.76' : c.toFixed(1), x, height - margin.bottom + (isLarge ? 16 : 12));
      ctx.strokeStyle = isEutectoid ? '#ef4444' : '#475569';
      ctx.beginPath();
      ctx.moveTo(x, height - margin.bottom);
      ctx.lineTo(x, height - margin.bottom + (isEutectoid ? 5 : 3));
      ctx.stroke();
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.font = isLarge ? 'bold 12px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
    ctx.fillText('Carbon Content (wt% C)', margin.left + plotW / 2, height - (isLarge ? 6 : 2));

    // Y-axis ticks & labels
    ctx.textAlign = 'right';
    ctx.font = isLarge ? '11px Inter, sans-serif' : '8px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const yTicks = [200, 400, 600, 727, 800, 1000];
    for (const t of yTicks) {
      const y = mapY(t);
      const isA1 = t === 727;
      ctx.fillStyle = isA1 ? '#ef4444' : '#94a3b8';
      ctx.fillText(`${t}°`, margin.left - 4, y + 3);
      ctx.strokeStyle = isA1 ? '#ef4444' : '#475569';
      ctx.beginPath();
      ctx.moveTo(margin.left - (isA1 ? 5 : 3), y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
    }

    // Y-axis title
    ctx.save();
    ctx.translate(isLarge ? 18 : 10, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = isLarge ? 'bold 12px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
    ctx.fillText('Temperature (°C)', 0, 0);
    ctx.restore();

  }, [carbonContent, width, height]);

  return (
    <div className="phase-diagram">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
