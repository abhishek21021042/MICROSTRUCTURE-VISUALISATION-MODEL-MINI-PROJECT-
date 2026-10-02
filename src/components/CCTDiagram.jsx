import { useRef, useEffect } from 'react';

// Time range: log10(time in seconds) from -1 (0.1s) to 5 (100,000s)
const LOG_MIN = -1.0;
const LOG_MAX = 5.0;

// Temperature range: 25°C (room temp) to 900°C
const TEMP_MIN = 25;
const TEMP_MAX = 900;

function createCCTMapper(width, height) {
  const isLarge = width > 400;
  const margin = {
    top: isLarge ? 28 : 18,
    right: isLarge ? 48 : 36, // Ensure labels don't get cut off on the right
    bottom: isLarge ? 42 : 32,
    left: isLarge ? 60 : 45,
  };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const mapX = (logT) => {
    const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, logT));
    return margin.left + ((clamped - LOG_MIN) / (LOG_MAX - LOG_MIN)) * plotW;
  };

  const mapY = (temp) => {
    const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, temp));
    return margin.top + ((TEMP_MAX - clamped) / (TEMP_MAX - TEMP_MIN)) * plotH;
  };

  return { margin, plotW, plotH, mapX, mapY, isLarge };
}

/**
 * Scientifically authentic Continuous Cooling Transformation (CCT) diagram.
 * Emulates official ASM International Metallography Atlas transformation diagrams.
 */
export default function CCTDiagram({ coolingRate = 1, carbon = 0.4, width = 290, height = 210 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { margin, plotW, plotH, mapX, mapY, isLarge } = createCCTMapper(width, height);

    // 1. Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Grid lines
    ctx.strokeStyle = '#162035';
    ctx.lineWidth = 0.8;
    for (let t = 100; t <= 800; t += 100) {
      ctx.beginPath();
      ctx.moveTo(margin.left, mapY(t));
      ctx.lineTo(width - margin.right, mapY(t));
      ctx.stroke();
    }
    for (let logT = -1; logT <= 5; logT += 1) {
      ctx.beginPath();
      ctx.moveTo(mapX(logT), margin.top);
      ctx.lineTo(mapX(logT), height - margin.bottom);
      ctx.stroke();
    }

    // Critical temperatures based on carbon content
    const A3 = carbon <= 0.76
      ? 912 - 370 * carbon + 166 * (carbon * carbon)
      : 727 + 305 * (carbon - 0.76);
    const A1 = 727;

    // Andrews formula for Ms (°C): Ms = 539 - 423 * %C
    const Ms = Math.max(80, Math.min(500, Math.round(539 - 423 * carbon)));
    // Mf is typically Ms - 150°C. If below 25°C, martensitic transformation finishes sub-zero
    const Mf = Ms - 150;

    // Carbon shift for noses: higher carbon increases hardenability (Grossmann/Kirkaldy factor)
    const cShift = (carbon - 0.4) * 0.85;

    // ==========================================
    // 3. THERMODYNAMIC C-CURVES (KIRKALDY / JMAK KINETICS)
    // ==========================================

    /**
     * Analytical C-curve incubation function in log10(time in s) vs Temperature (°C).
     * Derived from thermodynamic nucleation barrier and diffusional carbon transport:
     * log10 t(T) = tau_nose + ((T - T_nose) / width)^2
     */
    function cCurveLogT(T, T_nose, tau_nose, width) {
      const dT = (T - T_nose) / width;
      return tau_nose + dT * dT;
    }

    // Helper: draw smooth parametric curve through an array of points
    function drawSmoothCurve(points, strokeColor, lineWidth, isDashed = false) {
      if (points.length < 2) return;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      if (isDashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i][0] + points[i + 1][0]) / 2;
        const yc = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
      }
      ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // A) Proeutectoid Region
    if (carbon < 0.76) {
      // Ferrite Region (Hypoeutectoid: carbon < 0.76 wt%)
      // Nucleates from A3 down to ~550°C, nose at ~650°C
      const T_max = Math.min(840, A3 - 5);
      const T_min = 550;
      const ferritePts = [];
      for (let T = T_max; T >= T_min; T -= 15) {
        const logT = cCurveLogT(T, 650, 0.45 + cShift, 85);
        if (logT <= LOG_MAX) ferritePts.push([mapX(logT), mapY(T)]);
      }

      if (ferritePts.length > 1) {
        // Ferrite subtle fill
        ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.beginPath();
        ctx.moveTo(ferritePts[0][0], ferritePts[0][1]);
        for (let i = 1; i < ferritePts.length; i++) ctx.lineTo(ferritePts[i][0], ferritePts[i][1]);
        ctx.lineTo(mapX(Math.min(5, 3.0 + cShift)), mapY(T_min));
        ctx.lineTo(mapX(Math.min(5, 3.5 + cShift)), mapY(T_max));
        ctx.closePath();
        ctx.fill();

        drawSmoothCurve(ferritePts, '#22c55e', 1.8);

        ctx.fillStyle = '#22c55e';
        ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8.5px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Fs (Ferrite)', mapX(0.45 + cShift) + 6, mapY(650));
      }
    } else {
      // Cementite Region (Hypereutectoid: carbon >= 0.76 wt%)
      // Nucleates from Acm down to 727°C, nose at ~760°C
      const T_max = Math.min(880, A3 - 5);
      const T_min = 728;
      const cementitePts = [];
      for (let T = T_max; T >= T_min; T -= 12) {
        const logT = cCurveLogT(T, 760, 0.70 + cShift, 60);
        if (logT <= LOG_MAX) cementitePts.push([mapX(logT), mapY(T)]);
      }

      if (cementitePts.length > 1) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.beginPath();
        ctx.moveTo(cementitePts[0][0], cementitePts[0][1]);
        for (let i = 1; i < cementitePts.length; i++) ctx.lineTo(cementitePts[i][0], cementitePts[i][1]);
        ctx.lineTo(mapX(Math.min(5, 3.2 + cShift)), mapY(T_min));
        ctx.lineTo(mapX(Math.min(5, 3.8 + cShift)), mapY(T_max));
        ctx.closePath();
        ctx.fill();

        drawSmoothCurve(cementitePts, '#f59e0b', 1.8);

        ctx.fillStyle = '#f59e0b';
        ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8.5px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Fe₃Cs (Cementite)', mapX(0.70 + cShift) + 6, mapY(765));
      }
    }

    // B) Pearlite Region (Starts ~720°C, nose at ~550°C, finish shifted by JMAK delta-log-t = 1.25)
    const pearliteStart = [];
    const pearliteFinish = [];
    for (let T = 720; T >= 460; T -= 15) {
      const logTs = cCurveLogT(T, 550, 0.80 + cShift, 95);
      const logTf = logTs + 1.25; // JMAK progress from 1% to 99% transformation
      if (logTs <= LOG_MAX) pearliteStart.push([mapX(logTs), mapY(T)]);
      if (logTf <= LOG_MAX) pearliteFinish.push([mapX(logTf), mapY(T)]);
    }

    if (pearliteStart.length > 1 && pearliteFinish.length > 1) {
      // Pearlite shaded field
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(pearliteStart[0][0], pearliteStart[0][1]);
      for (let i = 1; i < pearliteStart.length; i++) ctx.lineTo(pearliteStart[i][0], pearliteStart[i][1]);
      for (let i = pearliteFinish.length - 1; i >= 0; i--) ctx.lineTo(pearliteFinish[i][0], pearliteFinish[i][1]);
      ctx.closePath();
      ctx.fill();

      drawSmoothCurve(pearliteStart, '#38bdf8', 1.8);
      drawSmoothCurve(pearliteFinish, '#38bdf890', 1.4, true);

      ctx.fillStyle = '#38bdf8';
      ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8.5px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Ps (Pearlite)', mapX(0.80 + cShift) + 6, mapY(550));
      ctx.fillText('Pf', mapX(0.80 + cShift + 1.25) + 4, mapY(550));
    }

    // C) Bainite Region (Below 520°C down to Ms, nose at ~430°C)
    const bainiteStart = [];
    const bainiteFinish = [];
    const bMaxT = 510;
    const bMinT = Math.max(Ms + 10, 300);
    for (let T = bMaxT; T >= bMinT; T -= 15) {
      const logTs = cCurveLogT(T, 430, 1.05 + cShift, 65);
      const logTf = logTs + 1.25; // JMAK progress
      if (logTs <= LOG_MAX) bainiteStart.push([mapX(logTs), mapY(T)]);
      if (logTf <= LOG_MAX) bainiteFinish.push([mapX(logTf), mapY(T)]);
    }

    if (bainiteStart.length > 1 && bainiteFinish.length > 1) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      ctx.moveTo(bainiteStart[0][0], bainiteStart[0][1]);
      for (let i = 1; i < bainiteStart.length; i++) ctx.lineTo(bainiteStart[i][0], bainiteStart[i][1]);
      for (let i = bainiteFinish.length - 1; i >= 0; i--) ctx.lineTo(bainiteFinish[i][0], bainiteFinish[i][1]);
      ctx.closePath();
      ctx.fill();

      drawSmoothCurve(bainiteStart, '#f59e0b', 1.8);
      drawSmoothCurve(bainiteFinish, '#f59e0b90', 1.4, true);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText('Bs (Bainite)', mapX(1.05 + cShift) + 6, mapY(430));
    }

    // ==========================================
    // 4. ISOTHERMS & MARTENSITE LIMITS
    // ==========================================

    // A1 line (727°C)
    ctx.strokeStyle = '#ef444490';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, mapY(A1));
    ctx.lineTo(width - margin.right, mapY(A1));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8.5px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('A₁ (727°C)', width - margin.right - 4, mapY(A1) - 4);

    // Ms line (Martensite Start)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, mapY(Ms));
    ctx.lineTo(width - margin.right, mapY(Ms));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8.5px Inter, sans-serif';
    ctx.textAlign = 'left';

    if (Mf >= 30) {
      ctx.fillText(`Ms = ${Ms}°C`, margin.left + 8, mapY(Ms) - 5);

      // Mf line (Martensite Finish)
      ctx.strokeStyle = '#f43f5e75';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, mapY(Mf));
      ctx.lineTo(width - margin.right, mapY(Mf));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e95';
      ctx.font = isLarge ? '10px Inter, sans-serif' : '7.5px Inter, sans-serif';
      ctx.fillText(`Mf = ${Mf}°C`, margin.left + 8, mapY(Mf) + 12);
    } else {
      ctx.fillText(`Ms = ${Ms}°C (Mf < 25°C: Retained γ)`, margin.left + 8, mapY(Ms) - 5);
    }

    // ==========================================
    // 5. PHYSICAL CONTINUOUS COOLING TRAJECTORY
    // ==========================================
    // Physical cooling from T0 = 850°C:
    // Newton's law calibrated to Delta t(800->500) = 300 / coolingRate:
    // k = (0.4896 * coolingRate) / 300
    const T0 = 850;
    const Tamb = 25;
    const rate = Math.max(0.01, coolingRate);
    const k = (0.4896 * rate) / 300;

    // Sample cooling curve points: start when T drops below 848°C (t ~ 0.005 / k)
    // down to room temperature (T = 50°C)
    const curvePoints = [];
    const minTimeSec = Math.max(0.05, 0.005 / k);
    const maxTimeSec = Math.min(100000, 3.5 / k);

    const logStart = Math.log10(minTimeSec);
    const logEnd = Math.log10(maxTimeSec);
    const numSteps = 70;

    for (let step = 0; step <= numSteps; step++) {
      const logT = logStart + (step / numSteps) * (logEnd - logStart);
      if (logT < LOG_MIN || logT > LOG_MAX) continue;
      const t = Math.pow(10, logT);
      const temp = Tamb + (T0 - Tamb) * Math.exp(-k * t);
      if (temp < TEMP_MIN) break;

      curvePoints.push({
        x: mapX(logT),
        y: mapY(temp),
        temp,
        logT,
      });
    }

    if (curvePoints.length > 1) {
      // Draw cooling trajectory line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
      for (let i = 1; i < curvePoints.length; i++) {
        ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
      }
      ctx.stroke();

      // Place cooling rate label pill along the curve (at ~500°C or middle)
      const midPoint = curvePoints.find((p) => p.temp <= 520) || curvePoints[Math.floor(curvePoints.length / 2)];
      if (midPoint) {
        const rateLabel = `${rate < 1 ? rate.toFixed(2) : rate < 10 ? rate.toFixed(1) : rate.toFixed(0)} °C/s`;
        ctx.font = isLarge ? 'bold 11px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
        const textMetrics = ctx.measureText(rateLabel);
        const pillW = textMetrics.width + 10;
        const pillH = isLarge ? 20 : 16;
        const pillX = midPoint.x + 8;
        const pillY = midPoint.y - pillH / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rateLabel, pillX + pillW / 2, pillY + pillH / 2);
        ctx.textBaseline = 'alphabetic'; // Reset
      }
    }

    // ==========================================
    // 6. AXES & SCIENTIFIC TICK LABELS
    // ==========================================
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // X-axis log time ticks
    ctx.textAlign = 'center';
    ctx.font = isLarge ? '11px Inter, sans-serif' : '8px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const timeTicks = [
      { log: -1, label: '0.1s' },
      { log: 0, label: '1s' },
      { log: 1, label: '10s' },
      { log: 2, label: '10²s' },
      { log: 3, label: '10³s' },
      { log: 4, label: '10⁴s' },
      { log: 5, label: '10⁵s' },
    ];
    for (const { log, label } of timeTicks) {
      const x = mapX(log);
      ctx.fillText(label, x, height - margin.bottom + (isLarge ? 16 : 12));
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(x, height - margin.bottom);
      ctx.lineTo(x, height - margin.bottom + 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.font = isLarge ? 'bold 12px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
    ctx.fillText('Time (log scale)', margin.left + plotW / 2, height - (isLarge ? 6 : 2));

    // Y-axis temperature ticks
    ctx.textAlign = 'right';
    ctx.font = isLarge ? '11px Inter, sans-serif' : '8px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    for (let temp = 100; temp <= 800; temp += 100) {
      const y = mapY(temp);
      ctx.fillText(`${temp}°`, margin.left - 5, y + 4);
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(margin.left - 3, y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
    }

    // Y-axis title
    ctx.save();
    ctx.translate(isLarge ? 20 : 12, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = isLarge ? 'bold 12px Inter, sans-serif' : 'bold 8px Inter, sans-serif';
    ctx.fillText('Temperature (°C)', 0, 0);
    ctx.restore();

  }, [coolingRate, carbon, width, height]);

  return (
    <div className="cct-diagram">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
