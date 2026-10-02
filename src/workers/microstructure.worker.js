/**
 * Microstructure generation Web Worker.
 * Generates Voronoi-based grain structures with phase assignments.
 * Uses Delaunay triangulation from d3-delaunay with Lloyd relaxation
 * to produce authentic equiaxed polygonal grain morphology.
 */

import { Delaunay } from 'd3-delaunay';

const CANVAS_SIZE = 1000;

/**
 * Simple 2D Perlin-like value noise for organic boundary perturbation.
 */
function createNoiseGenerator(seed) {
  function hash(x, y) {
    let h = (seed * 374761393 + x * 668265263 + y * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    h = Math.imul(h ^ (h >>> 16), 2654435769);
    return ((h ^ (h >>> 13)) & 0x7fffffff) / 0x7fffffff;
  }

  function smoothNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const n00 = hash(ix, iy);
    const n10 = hash(ix + 1, iy);
    const n01 = hash(ix, iy + 1);
    const n11 = hash(ix + 1, iy + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  }

  return function noise(x, y, octaves = 3) {
    let val = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      val += smoothNoise(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  };
}

/**
 * Perturb polygon edges with multi-scale noise to create natural grain boundary curvature.
 */
function perturbPolygon(polygon, noise, perturbAmount, noiseScale) {
  if (!polygon || polygon.length < 3) return polygon;

  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];

    result.push([x1, y1]);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(2, Math.floor(len / 22));

    for (let j = 1; j < steps; j++) {
      const t = j / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;

      const nx = -dy / len;
      const ny = dx / len;

      const n = (noise(px * noiseScale, py * noiseScale) - 0.5) * 2;
      result.push([
        px + nx * n * perturbAmount,
        py + ny * n * perturbAmount,
      ]);
    }
  }
  return result;
}

/**
 * Assign phase types to grains based on calculated fractions.
 */
function assignPhases(numGrains, phases, rand = Math.random) {
  const assignments = [];
  const { ferrite = 0, pearlite = 0, bainite = 0, martensite = 0, cementite = 0 } = phases;

  const thresholds = [
    { type: 'ferrite', threshold: ferrite },
    { type: 'pearlite', threshold: ferrite + pearlite },
    { type: 'bainite', threshold: ferrite + pearlite + bainite },
    { type: 'martensite', threshold: ferrite + pearlite + bainite + martensite },
    { type: 'cementite', threshold: 1.0 },
  ];

  const indices = Array.from({ length: numGrains }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < numGrains; i++) {
    const fraction = (i + 0.5) / numGrains;
    let type = 'pearlite';
    for (const { type: t, threshold } of thresholds) {
      if (fraction <= threshold) {
        type = t;
        break;
      }
    }
    assignments[indices[i]] = type;
  }

  return assignments;
}

/**
 * Generate full microstructure data matching true optical metallography.
 */
function generateMicrostructure(params) {
  const {
    phases,
    grainSize = 25,
    seed = Date.now(),
  } = params;

  const size = CANVAS_SIZE;
  const pad = 180; // Extend beyond canvas to eliminate edge border artifacts

  // Calibrate field of view:
  // In optical metallography at 500x (~300-400 um FOV), there are 14 to 22 prominent grains
  // visible in the viewing area, exactly matching the reference optical micrograph.
  const baseCount = 16;
  const sizeRatio = 25 / Math.max(10, Math.min(100, grainSize));
  const visibleGrains = Math.max(10, Math.min(26, Math.round(baseCount * Math.pow(sizeRatio, 0.6))));

  // Total grains including padded border region
  const totalGrains = Math.round(visibleGrains * 1.6);

  let rng = seed;
  function random() {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  // 1. Generate initial seed points spanning [-pad, size + pad]
  const points = new Float64Array(totalGrains * 2);
  for (let i = 0; i < totalGrains; i++) {
    points[i * 2] = -pad + random() * (size + 2 * pad);
    points[i * 2 + 1] = -pad + random() * (size + 2 * pad);
  }

  // 2. Lloyd relaxation iterations: moves seeds toward cell centroids,
  // producing authentic equiaxed polygonal grain morphology with ~120° triple junctions
  for (let iter = 0; iter < 2; iter++) {
    const d = new Delaunay(points);
    const v = d.voronoi([-pad, -pad, size + pad, size + pad]);
    for (let i = 0; i < totalGrains; i++) {
      const poly = v.cellPolygon(i);
      if (!poly || poly.length < 3) continue;
      let cx = 0, cy = 0;
      for (const [x, y] of poly) {
        cx += x;
        cy += y;
      }
      points[i * 2] = cx / poly.length;
      points[i * 2 + 1] = cy / poly.length;
    }
  }

  // Final Voronoi tessellation on relaxed equiaxed points
  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([-pad, -pad, size + pad, size + pad]);

  const noise = createNoiseGenerator(seed);
  const avgGrainRadius = size / Math.sqrt(visibleGrains);
  const perturbAmount = avgGrainRadius * 0.055;
  const noiseScale = 0.006;

  // Build grains
  const allGrains = [];
  for (let i = 0; i < totalGrains; i++) {
    const rawPolygon = voronoi.cellPolygon(i);
    if (!rawPolygon) continue;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of rawPolygon) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    // Skip grains entirely outside visible viewport
    if (maxX < -60 || minX > size + 60 || maxY < -60 || minY > size + 60) {
      continue;
    }

    const perturbedPolygon = perturbPolygon(rawPolygon, noise, perturbAmount, noiseScale);

    // Recompute bbox after perturbation
    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
    for (const [x, y] of perturbedPolygon) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    // Generate random micro-pits (etch pits) for ferrite grains
    const numPits = Math.floor(18 + random() * 25);
    const etchPits = [];
    for (let p = 0; p < numPits; p++) {
      etchPits.push({
        rx: 0.15 + 0.7 * random(),
        ry: 0.15 + 0.7 * random(),
        radius: 0.8 + random() * 1.4,
        alpha: 0.25 + random() * 0.35,
      });
    }

    allGrains.push({
      index: i,
      polygon: perturbedPolygon,
      rawPolygon,
      center: [points[i * 2], points[i * 2 + 1]],
      bbox: [minX, minY, maxX, maxY],
      brightnessVariation: (random() - 0.5) * 0.14,
      etchPits,
    });
  }

  // Assign phases to grains
  const numGrains = allGrains.length;
  const phaseAssignments = assignPhases(numGrains, phases, random);

  const grains = [];
  for (let i = 0; i < numGrains; i++) {
    const g = allGrains[i];
    const phase = phaseAssignments[i];
    const [minX, minY, maxX, maxY] = g.bbox;

    // Sub-colonies for pearlite grains
    let colonies = [];
    if (phase === 'pearlite' || phase === 'cementite') {
      const numColonies = Math.floor(3 + random() * 3); // 3 to 5 colonies per grain
      const colonyPoints = new Float64Array(numColonies * 2);
      for (let j = 0; j < numColonies; j++) {
        colonyPoints[j * 2] = minX + (0.15 + 0.7 * random()) * (maxX - minX);
        colonyPoints[j * 2 + 1] = minY + (0.15 + 0.7 * random()) * (maxY - minY);
      }

      try {
        const colonyDelaunay = new Delaunay(colonyPoints);
        const colonyVoronoi = colonyDelaunay.voronoi([minX - 40, minY - 40, maxX + 40, maxY + 40]);

        for (let j = 0; j < numColonies; j++) {
          const colonyPoly = colonyVoronoi.cellPolygon(j);
          if (!colonyPoly) continue;
          colonies.push({
            polygon: colonyPoly,
            angle: random() * Math.PI,
            center: [colonyPoints[j * 2], colonyPoints[j * 2 + 1]],
            toneVariant: random(), // Optical reflectivity variance (dark sepia vs silvery)
          });
        }
      } catch {
        colonies = [];
      }
    }

    // Bainite needles (dense feathery sheaves and acicular laths)
    let needles = [];
    if (phase === 'bainite') {
      const numNeedles = Math.floor(45 + random() * 30);
      const baseAngle = random() * Math.PI;
      for (let j = 0; j < numNeedles; j++) {
        needles.push({
          angle: baseAngle + (random() - 0.5) * 0.45 + (random() > 0.4 ? Math.PI / 3 : 0),
          offset: random(),
          width: 1.2 + random() * 1.6,
        });
      }
    }

    // Martensite plates (dense intersecting lenticular plates and laths)
    let plates = [];
    if (phase === 'martensite') {
      const numPlates = Math.floor(55 + random() * 35);
      const habitAngles = [
        random() * Math.PI,
        0,
        Math.PI / 3,
        (2 * Math.PI) / 3,
        Math.PI / 4,
        (3 * Math.PI) / 4,
      ];
      for (let j = 0; j < numPlates; j++) {
        const baseAngle = habitAngles[Math.floor(random() * habitAngles.length)];
        plates.push({
          angle: baseAngle + (random() - 0.5) * 0.25,
          offset: random(),
          width: 1.1 + random() * 2.2,
          length: 0.5 + random() * 0.5,
        });
      }
    }

    grains.push({
      ...g,
      phase,
      colonies,
      needles,
      plates,
    });
  }

  return {
    grains,
    canvasSize: size,
    numGrains,
    params,
  };
}

// Worker message handler
self.onmessage = (e) => {
  const result = generateMicrostructure(e.data);
  self.postMessage(result);
};
