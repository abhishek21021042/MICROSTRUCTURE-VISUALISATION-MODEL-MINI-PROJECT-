import { useRef, useEffect, useState, useCallback } from 'react';
import { renderMicrostructure, exportAsPNG } from '../renderer/canvasRenderer';

const CANVAS_BASE_SIZE = 700;

const MAG_OPTIONS = [
  { label: '200×', value: 200 },
  { label: '500×', value: 500 },
  { label: '1000×', value: 1000 },
  { label: '1571×', value: 1571 },
  { label: '2500×', value: 2500 },
  { label: '5000×', value: 5000 },
];

export default function Viewport({ microstructureData, renderSettings, onSettingsChange }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState('microstructure'); // 'microstructure' | 'annotated' | 'grainAnalysis'

  const currentMag = renderSettings.magnification || 1571;

  // Render when data or settings change
  useEffect(() => {
    if (!canvasRef.current || !microstructureData) return;

    const canvas = canvasRef.current;
    const frameId = requestAnimationFrame(() => {
      renderMicrostructure(canvas, microstructureData, {
        ...renderSettings,
        zoom,
        panX: pan.x,
        panY: pan.y,
        viewMode,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [microstructureData, renderSettings, zoom, pan, viewMode]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(8, prev * 1.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev / 1.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.4, Math.min(8, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsPanning(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastMouse]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleExport = () => {
    if (canvasRef.current) {
      exportAsPNG(canvasRef.current, `microstructure-${currentMag}x.png`);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Scale bar calculation (in µm)
  // At 1571x magnification, 100px on screen is approximately 99 µm
  const scaleMicrons = Math.max(1, Math.round((1571 / (currentMag * zoom)) * 99));

  return (
    <div className="center-viewport-col" ref={containerRef}>
      {/* Top View Mode Tabs */}
      <div className="viewport-tabs-bar">
        <button
          type="button"
          className={`viewport-tab ${viewMode === 'microstructure' ? 'viewport-tab--active' : ''}`}
          onClick={() => setViewMode('microstructure')}
        >
          <svg className="viewport-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Microstructure View
        </button>

        <button
          type="button"
          className={`viewport-tab ${viewMode === 'annotated' ? 'viewport-tab--active' : ''}`}
          onClick={() => setViewMode('annotated')}
        >
          <svg className="viewport-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Annotated
        </button>

        <button
          type="button"
          className={`viewport-tab ${viewMode === 'grainAnalysis' ? 'viewport-tab--active' : ''}`}
          onClick={() => setViewMode('grainAnalysis')}
        >
          <svg className="viewport-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="18" r="3" />
            <line x1="6" y1="9" x2="6" y2="15" />
            <line x1="18" y1="9" x2="18" y2="15" />
            <line x1="9" y1="6" x2="15" y2="6" />
            <line x1="9" y1="18" x2="15" y2="18" />
          </svg>
          Grain Analysis
        </button>
      </div>

      {/* Main Canvas Viewport Container */}
      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          className="microstructure-canvas"
          width={CANVAS_BASE_SIZE}
          height={CANVAS_BASE_SIZE}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="viewport-bottom-bar">
        <div className="bottom-bar-tools">
          <button
            type="button"
            className="tool-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            type="button"
            className="tool-btn tool-btn--text"
            onClick={handleResetZoom}
            title="Reset Zoom 1:1"
          >
            1:1
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={handleFullscreen}
            title="Fullscreen / Fit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>

          {/* Magnification dropdown */}
          <div className="mag-select-wrapper">
            <select
              className="mag-select"
              value={currentMag}
              onChange={(e) => onSettingsChange('magnification', parseInt(e.target.value, 10))}
            >
              {MAG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="tool-btn tool-btn--camera"
            onClick={handleExport}
            title="Capture Image Snapshot"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* Scale bar indicator */}
        {(renderSettings.showScaleBar ?? true) && (
          <div className="scale-bar-display">
            <div className="scale-line" />
            <span className="scale-text">{scaleMicrons} µm</span>
          </div>
        )}
      </div>
    </div>
  );
}
