/**
 * Photorealistic metallographic microstructure renderer.
 * Emulates optical microscopy of Nital-etched iron-carbon steels
 * matching authentic laboratory micrographs.
 */

const PHASE_STYLE = {
  ferrite: {
    // Proeutectoid ferrite: warm pale cream/buff with subtle orientation contrast
    baseColor: [244, 238, 224],
    variance: 8,
  },
  pearlite: {
    // Pearlitic ferrite matrix background (warm light buff)
    baseColor: [215, 202, 182],
    // Dark etched Fe3C cementite plates
    cementiteColor: [22, 16, 10],
    variance: 6,
  },
  bainite: {
    // Deep bronze-brown (etched acicular bainite)
    baseColor: [85, 64, 42],
    needleColor: [26, 18, 12],
    highlightColor: [145, 118, 85],
    variance: 14,
  },
  martensite: {
    // Charcoal-slate (diffusionless quenched laths)
    baseColor: [38, 32, 28],
    plateColor: [14, 10, 8],
    highlightColor: [88, 78, 70],
    variance: 8,
  },
  cementite: {
    // Proeutectoid cementite: brilliant white/cream (acid-resistant unetched carbide)
    baseColor: [250, 248, 242],
    networkColor: [255, 255, 255],
    variance: 4,
  },
};

/**
 * Draw a filled polygon on the canvas.
 */
function fillPolygon(ctx, polygon, color) {
  if (!polygon || polygon.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Clip drawing to a polygon shape.
 */
function clipToPolygon(ctx, polygon) {
  if (!polygon || polygon.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.clip();
}

/**
 * Draw microscopic etch pits and crystallographic stippling on ferrite grains.
 */
function drawFerriteEtchPits(ctx, grain) {
  const { polygon, etchPits, bbox } = grain;
  if (!polygon || !etchPits) return;

  ctx.save();
  clipToPolygon(ctx, polygon);

  const [minX, minY, maxX, maxY] = bbox;
  const w = maxX - minX;
  const h = maxY - minY;

  for (const pit of etchPits) {
    const px = minX + pit.rx * w;
    const py = minY + pit.ry * h;
    ctx.fillStyle = `rgba(45, 35, 25, ${pit.alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, pit.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw dense, fine, authentic pearlite lamellae matching optical microscopy.
 */
function drawColonyLamellae(ctx, colony, lamellarSpacing, toneVariant) {
  const { polygon, angle } = colony;
  if (!polygon || polygon.length < 3) return;

  // Bounding box of colony
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const extent = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2) * 1.4;

  // Interlamellar spacing calibrated to optical microscopy:
  // lamellarSpacing is 0.1 to 2.0 um
  // Produces 35 to 70 dense, fine parallel lamellae per colony
  const step = Math.max(2.6, Math.min(6.2, lamellarSpacing * 3.0));
  const numLines = Math.ceil(extent / step);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nx = -sin;
  const ny = cos;

  // Dark cementite lamellae line
  const isDarkColony = toneVariant > 0.5;
  const lineColor = isDarkColony
    ? 'rgba(20, 14, 10, 0.96)'
    : 'rgba(28, 20, 14, 0.92)';
  const lineWidth = Math.max(1.0, Math.min(1.7, step * 0.35));

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  for (let i = -numLines; i <= numLines; i++) {
    const offset = i * step;
    const bx = cx + nx * offset;
    const by = cy + ny * offset;

    const x1 = bx + cos * extent;
    const y1 = by + sin * extent;
    const x2 = bx - cos * extent;
    const y2 = by - sin * extent;

    // Organic wavy stroke with natural slight curvature
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const segments = 4;
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const wave = Math.sin((offset + t * 60) * 0.14) * (step * 0.08);
      ctx.lineTo(px + nx * wave, py + ny * wave);
    }
    ctx.stroke();
  }
}

/**
 * Draw full pearlite grain with individual colonies and optical reflection tones.
 */
function drawPearliteGrain(ctx, grain, lamellarSpacing) {
  const { polygon, colonies } = grain;
  if (!polygon || polygon.length < 3) return;

  ctx.save();
  clipToPolygon(ctx, polygon);

  if (colonies && colonies.length > 0) {
    for (const colony of colonies) {
      if (!colony.polygon || colony.polygon.length < 3) continue;

      ctx.save();
      clipToPolygon(ctx, colony.polygon);

      // Colony-specific optical reflection background:
      // Real pearlite colonies have warm bronze, sepia, or silvery tones
      if (colony.toneVariant > 0.7) {
        fillPolygon(ctx, colony.polygon, 'rgb(125, 98, 68)');
      } else if (colony.toneVariant > 0.4) {
        fillPolygon(ctx, colony.polygon, 'rgb(168, 142, 110)');
      } else {
        fillPolygon(ctx, colony.polygon, 'rgb(215, 202, 182)');
      }

      // Draw the dense lamellae stripes
      drawColonyLamellae(ctx, colony, lamellarSpacing, colony.toneVariant);
      ctx.restore();
    }

    // Faint natural colony boundary line
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
    ctx.lineWidth = 1.0;
    for (const colony of colonies) {
      if (!colony.polygon) continue;
      ctx.beginPath();
      ctx.moveTo(colony.polygon[0][0], colony.polygon[0][1]);
      for (let k = 1; k < colony.polygon.length; k++) {
        ctx.lineTo(colony.polygon[k][0], colony.polygon[k][1]);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    drawColonyLamellae(ctx, { polygon, angle: 0.6, center: grain.center }, lamellarSpacing, 0.5);
  }

  ctx.restore();
}

/**
 * Draw bainite needle-like and feathery acicular structures matching reference image.
 */
function drawBainiteNeedles(ctx, grain) {
  const { polygon, needles, bbox } = grain;
  if (!needles || needles.length === 0) return;

  ctx.save();
  clipToPolygon(ctx, polygon);

  const [minX, minY, maxX, maxY] = bbox;
  const w = maxX - minX;
  const h = maxY - minY;
  const style = PHASE_STYLE.bainite;

  for (const needle of needles) {
    const cx = minX + needle.offset * w;
    const cy = minY + needle.offset * h;
    const len = Math.min(w, h) * 0.95;
    const cos = Math.cos(needle.angle);
    const sin = Math.sin(needle.angle);

    // Dark needle laths
    ctx.strokeStyle = `rgba(${style.needleColor.join(',')}, 0.92)`;
    ctx.lineWidth = needle.width;
    ctx.beginPath();
    ctx.moveTo(cx - cos * len / 2, cy - sin * len / 2);
    ctx.lineTo(cx + cos * len / 2, cy + sin * len / 2);
    ctx.stroke();

    // Subtle highlight relief along needle
    ctx.strokeStyle = `rgba(${style.highlightColor.join(',')}, 0.4)`;
    ctx.lineWidth = Math.max(0.7, needle.width * 0.45);
    ctx.beginPath();
    ctx.moveTo(cx - cos * len / 2 + 1, cy - sin * len / 2 + 1);
    ctx.lineTo(cx + cos * len / 2 + 1, cy + sin * len / 2 + 1);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw martensite plate/needle structures with sharp lenticular habit planes.
 */
function drawMartensitePlates(ctx, grain) {
  const { polygon, plates, bbox } = grain;
  if (!plates || plates.length === 0) return;

  ctx.save();
  clipToPolygon(ctx, polygon);

  const [minX, minY, maxX, maxY] = bbox;
  const w = maxX - minX;
  const h = maxY - minY;
  const style = PHASE_STYLE.martensite;

  for (const plate of plates) {
    const cx = minX + plate.offset * w;
    const cy = minY + (Math.sin(plate.offset * 13.7) * 0.5 + 0.5) * h;
    const len = Math.min(w, h) * plate.length;
    const cos = Math.cos(plate.angle);
    const sin = Math.sin(plate.angle);

    ctx.strokeStyle = `rgba(${style.plateColor.join(',')}, 0.95)`;
    ctx.lineWidth = plate.width;
    ctx.beginPath();
    ctx.moveTo(cx - cos * len / 2, cy - sin * len / 2);
    ctx.lineTo(cx + cos * len / 2, cy + sin * len / 2);
    ctx.stroke();

    // Relief border
    ctx.strokeStyle = `rgba(${style.highlightColor.join(',')}, 0.35)`;
    ctx.lineWidth = Math.max(0.7, plate.width * 0.45);
    ctx.beginPath();
    ctx.moveTo(cx - cos * len / 2 + 1, cy - sin * len / 2 + 1);
    ctx.lineTo(cx + cos * len / 2 + 1, cy + sin * len / 2 + 1);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw proeutectoid cementite network along prior austenite grain boundaries.
 */
function drawCementiteNetwork(ctx, grain) {
  const { polygon } = grain;
  if (!polygon || polygon.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 252, 245, 0.95)';
  ctx.lineWidth = 3.5;
  ctx.stroke();
}

/**
 * Draw proeutectoid cementite grain: bright carbide with unetched relief and network.
 */
function drawCementiteGrain(ctx, grain) {
  const { polygon } = grain;
  if (!polygon || polygon.length < 3) return;

  ctx.save();
  clipToPolygon(ctx, polygon);
  fillPolygon(ctx, polygon, 'rgb(250, 248, 242)');
  ctx.restore();

  drawCementiteNetwork(ctx, grain);
}

/**
 * Draw prior austenite grain boundaries with authentic etched grooves and etch pits.
 */
function drawGrainBoundaries(ctx, grains, boundaryWidth) {
  ctx.strokeStyle = 'rgba(24, 16, 10, 0.95)';
  ctx.lineWidth = boundaryWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (const grain of grains) {
    const { polygon } = grain;
    if (!polygon || polygon.length < 3) continue;

    ctx.beginPath();
    ctx.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i][0], polygon[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Draw tiny dark etch pits along boundary lines and triple points
  ctx.fillStyle = 'rgba(18, 12, 8, 0.9)';
  for (const grain of grains) {
    const { polygon } = grain;
    if (!polygon) continue;
    for (let i = 0; i < polygon.length; i += 3) {
      const [x, y] = polygon[i];
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Apply optical microscope post-processing: contrast, brightness, lighting noise, vignetting.
 */
function applyPostProcessing(ctx, width, height, settings) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const {
    noiseIntensity = 3.2,
    vignetteStrength = 0.14,
    contrast = 1.0,
    brightness = 0.0,
  } = settings;

  const cx = width / 2;
  const cy = height / 2;

  // Pre-calculate contrast factor
  // contrast typically 0.5 to 2.0. Contrast formula: factor = (259 * (C + 255)) / (255 * (259 - C))
  // or simple linear around 128: factor * (color - 128) + 128
  const factor = Math.max(0.1, contrast);
  const brightOffset = brightness * 80;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    // Subtle sensor noise / photographic emulsion
    const noise = (Math.random() - 0.5) * noiseIntensity * 2;
    let r = data[i] + noise + brightOffset;
    let g = data[i + 1] + noise + brightOffset;
    let b = data[i + 2] + noise + brightOffset;

    // Contrast
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    // Vignetting (darker corners)
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vignette = 1 - dist * dist * vignetteStrength;

    data[i] = Math.max(0, Math.min(255, r * vignette));
    data[i + 1] = Math.max(0, Math.min(255, g * vignette));
    data[i + 2] = Math.max(0, Math.min(255, b * vignette));
  }

  ctx.putImageData(imageData, 0, 0);
}

const OVERLAY_COLORS = {
  ferrite: 'rgba(56, 189, 248, 0.45)',    // Sky blue
  pearlite: 'rgba(251, 146, 60, 0.45)',   // Amber / Orange
  bainite: 'rgba(74, 222, 128, 0.45)',    // Emerald green
  martensite: 'rgba(217, 70, 239, 0.45)', // Fuchsia
  cementite: 'rgba(250, 204, 21, 0.45)',  // Yellow
};

/**
 * Main render function.
 */
export function renderMicrostructure(canvas, microstructureData, settings = {}) {
  if (!canvas || !microstructureData) return;

  const { grains, canvasSize } = microstructureData;
  const {
    zoom = 1,
    panX = 0,
    panY = 0,
    lamellarSpacing = 1,
    showBoundaries = true,
    postProcessing = true,
    etchant = 'nital2',
    contrast = 1.0,
    brightness = 0.0,
    grainBoundaryEnhance = 1.2,
    showPhaseColors = false,
    showPhaseLabels = false,
    viewMode = 'microstructure',
  } = settings;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const displaySize = Math.min(canvas.width, canvas.height);

  // Warm optical microscopy background tone
  ctx.fillStyle = '#f4eee1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set up transform for zoom & pan
  ctx.save();
  const scale = (displaySize / canvasSize) * zoom;
  const offsetX = (canvas.width - canvasSize * scale) / 2 + panX;
  const offsetY = (canvas.height - canvasSize * scale) / 2 + panY;
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Etchant color adjustments
  const etchantMod = etchant === 'picral' ? { r: 6, g: -4, b: -10 }
    : etchant === 'nital5' ? { r: -8, g: -8, b: -6 }
    : { r: 0, g: 0, b: 0 }; // nital2 default

  // 1. Render base polygon fills for all grains
  for (const grain of grains) {
    const style = PHASE_STYLE[grain.phase] || PHASE_STYLE.ferrite;
    const [r, g, b] = style.baseColor;
    const v = grain.brightnessVariation * style.variance * 2.2;

    const finalR = Math.max(0, Math.min(255, r + v + etchantMod.r));
    const finalG = Math.max(0, Math.min(255, g + v + etchantMod.g));
    const finalB = Math.max(0, Math.min(255, b + v + etchantMod.b));

    fillPolygon(ctx, grain.polygon, `rgb(${finalR}, ${finalG}, ${finalB})`);
  }

  // 2. Render phase-specific internal textures
  if (viewMode !== 'grainAnalysis') {
    for (const grain of grains) {
      if (grain.phase === 'ferrite') {
        drawFerriteEtchPits(ctx, grain);
      } else if (grain.phase === 'pearlite') {
        drawPearliteGrain(ctx, grain, lamellarSpacing);
      } else if (grain.phase === 'cementite') {
        drawCementiteGrain(ctx, grain);
      } else if (grain.phase === 'bainite') {
        drawBainiteNeedles(ctx, grain);
      } else if (grain.phase === 'martensite') {
        drawMartensitePlates(ctx, grain);
      }
    }
  }

  // Optional False Color Phase Overlay
  if (showPhaseColors || viewMode === 'grainAnalysis') {
    for (const grain of grains) {
      const color = OVERLAY_COLORS[grain.phase] || 'rgba(100,100,100,0.3)';
      fillPolygon(ctx, grain.polygon, color);
    }
  }

  // 3. Draw prior austenite grain boundaries (with proeutectoid Fe3C network if hypereutectoid)
  if (showBoundaries || viewMode === 'grainAnalysis' || viewMode === 'annotated') {
    if (microstructureData.params?.phases?.cementite > 0.001) {
      ctx.strokeStyle = 'rgba(255, 252, 245, 0.95)';
      ctx.lineWidth = Math.max(2.5, 3.8 / zoom);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const grain of grains) {
        if (!grain.polygon || grain.polygon.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(grain.polygon[0][0], grain.polygon[0][1]);
        for (let i = 1; i < grain.polygon.length; i++) {
          ctx.lineTo(grain.polygon[i][0], grain.polygon[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    const boundaryWidth = Math.max(1.2, (2.0 * grainBoundaryEnhance) / zoom);
    drawGrainBoundaries(ctx, grains, boundaryWidth);
  }

  // 4. Phase Labels or Grain Analysis centroid markers
  if (showPhaseLabels || viewMode === 'annotated' || viewMode === 'grainAnalysis') {
    ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let idx = 0; idx < grains.length; idx++) {
      const grain = grains[idx];
      const [cx, cy] = grain.center;

      // Draw subtle pill tag
      const labelText = viewMode === 'grainAnalysis'
        ? `#${idx + 1} (${grain.phase === 'cementite' ? 'Fe₃C' : grain.phase === 'ferrite' ? 'α' : grain.phase[0].toUpperCase()})`
        : grain.phase === 'ferrite' ? 'α'
        : grain.phase === 'pearlite' ? 'P'
        : grain.phase === 'bainite' ? 'B'
        : grain.phase === 'cementite' ? 'Fe₃C'
        : 'M';

      const metrics = ctx.measureText(labelText);
      const pw = metrics.width + 10;
      const ph = 18;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 4);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(labelText, cx, cy);
    }
  }

  ctx.restore();

  // 5. Post-processing optical microscope illumination effects
  if (postProcessing) {
    applyPostProcessing(ctx, canvas.width, canvas.height, {
      noiseIntensity: 3.2,
      vignetteStrength: 0.14,
      contrast,
      brightness,
    });
  }
}

/**
 * Export canvas as PNG.
 */
export function exportAsPNG(canvas, filename = 'microstructure.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

