import React, { useState, useRef, useMemo } from 'react';
import { pointsToSvgPath, exportToDat, exportToCsv } from '../geometry/naca.js';

export function AirfoilPlot({ geometry, angleOfAttack = 0, validation }) {
  const svgRef = useRef(null);

  // Display toggles
  const [showCamberLine, setShowCamberLine] = useState(true);
  const [showChordLine, setShowChordLine] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [applyAoARotation, setApplyAoARotation] = useState(false);
  const [showFreestream, setShowFreestream] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Hover inspection state
  const [hoverData, setHoverData] = useState(null);

  // SVG dimensions
  const viewWidth = 920;
  const viewHeight = 440;
  const plotLeft = 85;
  const plotRight = 855;
  const plotTop = 45;
  const plotBottom = 390;
  const plotAreaWidth = plotRight - plotLeft;
  const plotAreaHeight = plotBottom - plotTop;

  // Base scale: 1 unit of chord (c = 1) in screen pixels
  const baseScale = 640;
  const currentScale = baseScale * zoomLevel;

  // Origin (x = 0, y = 0) in SVG coordinates
  const originX = plotLeft + (plotAreaWidth - currentScale) / 2;
  const originY = plotTop + plotAreaHeight / 2;

  // Coordinate transformation: (x, y) normalized -> (X, Y) SVG screen pixels
  const toScreen = React.useCallback(
    (x, y) => {
      const X = originX + x * currentScale;
      const Y = originY - y * currentScale;
      return [X, Y];
    },
    [originX, originY, currentScale]
  );

  // Convert screen coordinates back to normalized aerodynamic coordinates
  const fromScreen = (screenX, screenY) => {
    const x = (screenX - originX) / currentScale;
    const y = (originY - screenY) / currentScale;
    return { x, y };
  };

  // Generate SVG path for the closed airfoil outline
  const airfoilPathD = useMemo(() => {
    if (!geometry || !geometry.points || geometry.points.length === 0) return '';
    return pointsToSvgPath(geometry.points, (p) => toScreen(p.x, p.y), true);
  }, [geometry, toScreen]);

  // Generate SVG path for the mean camber line
  const camberPathD = useMemo(() => {
    if (!geometry || !geometry.camber || geometry.camber.length === 0) return '';
    return pointsToSvgPath(geometry.camber, (p) => toScreen(p.x, p.y), false);
  }, [geometry, toScreen]);

  // Key reference points
  const lePos = toScreen(0, 0);
  const tePos = toScreen(1, 0);
  const maxCamber = geometry?.metrics?.maxCamber;
  const maxCamberPos = maxCamber ? toScreen(maxCamber.x, maxCamber.y) : null;

  // Max thickness marker positions
  const maxThicknessPos = useMemo(() => {
    if (!geometry || !geometry.upper || !geometry.lower) return null;
    // Find point closest to maximum thickness (approx x = 0.3)
    let maxDiff = -1;
    let upperPt = geometry.upper[0];
    let lowerPt = geometry.lower[0];
    for (let i = 0; i < geometry.upper.length; i++) {
      const u = geometry.upper[i];
      const l = geometry.lower[i];
      const diff = u.y - l.y;
      if (diff > maxDiff) {
        maxDiff = diff;
        upperPt = u;
        lowerPt = l;
      }
    }
    return {
      upper: toScreen(upperPt.x, upperPt.y),
      lower: toScreen(lowerPt.x, lowerPt.y),
      mid: toScreen(upperPt.x, (upperPt.y + lowerPt.y) / 2),
      x: upperPt.x,
      tVal: maxDiff,
    };
  }, [geometry, toScreen]);

  // Grid tick definitions (normalized x/c and y/c)
  const xTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const yTicks = [-0.20, -0.15, -0.10, -0.05, 0.0, 0.05, 0.10, 0.15, 0.20];

  // Mouse move handler for interactive crosshair inspection
  const handleMouseMove = (e) => {
    if (!svgRef.current || !geometry) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to SVG viewBox coordinates
    const scaleFactorX = viewWidth / rect.width;
    const scaleFactorY = viewHeight / rect.height;
    const svgX = mouseX * scaleFactorX;
    const svgY = mouseY * scaleFactorY;

    const { x } = fromScreen(svgX, svgY);

    if (x < -0.05 || x > 1.05) {
      setHoverData(null);
      return;
    }

    const clampedX = Math.max(0, Math.min(1, x));

    // Interpolate or find closest point in camber and surfaces
    const { upper, lower, camber } = geometry;
    let closestIdx = 0;
    let minDistance = 999;
    for (let i = 0; i < camber.length; i++) {
      const dist = Math.abs(camber[i].x - clampedX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }

    const u = upper[closestIdx];
    const l = lower[closestIdx];
    const c = camber[closestIdx];
    const thickness = u ? Math.abs(u.y - l.y) : 0;

    setHoverData({
      svgX,
      svgY,
      x: clampedX,
      yu: u?.y ?? 0,
      yl: l?.y ?? 0,
      yc: c?.y ?? 0,
      thickness,
      screenPos: toScreen(clampedX, c?.y ?? 0),
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Center rotation point: Quarter-chord point (x = 0.25, y = 0)
  const quarterChordScreen = toScreen(0.25, 0);
  const rotationTransform = applyAoARotation
    ? `rotate(${-angleOfAttack}, ${quarterChordScreen[0]}, ${quarterChordScreen[1]})`
    : '';

  // Download handlers
  const handleDownloadDat = () => {
    if (!geometry) return;
    const datContent = exportToDat(geometry);
    const blob = new Blob([datContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${geometry.designation.replace(/\s+/g, '_')}.dat`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!geometry) return;
    const csvContent = exportToCsv(geometry);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${geometry.designation.replace(/\s+/g, '_')}_coordinates.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${geometry.designation.replace(/\s+/g, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="airfoil-plot-card">
      {/* Plot Header Bar */}
      <div className="plot-header">
        <div className="plot-title-group">
          <div className="plot-badge-row">
            <span className="airfoil-badge">{geometry?.designation || 'NACA Profile'}</span>
            <span className="spec-badge">Normalized Chord c = 1.0</span>
            {applyAoARotation && (
              <span className="aoa-badge">Rotated α = {angleOfAttack}°</span>
            )}
          </div>
          <p className="plot-subtitle">
            2D Cross-Section Coordinate Map (cosine spacing resolution: {geometry?.points?.length || 0} pts)
          </p>
        </div>

        {/* Action buttons */}
        <div className="plot-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleDownloadDat}
            title="Download Selig / XFOIL coordinate format"
          >
            Export .DAT
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={handleDownloadCsv}
            title="Download CSV table of coordinates"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={handleDownloadSvg}
            title="Export vector SVG drawing"
          >
            Download SVG
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="plot-toolbar">
        <div className="toolbar-toggles">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showCamberLine}
              onChange={(e) => setShowCamberLine(e.target.checked)}
            />
            <span className="toggle-dot dot-camber"></span>
            Camber Line (yc)
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showChordLine}
              onChange={(e) => setShowChordLine(e.target.checked)}
            />
            <span className="toggle-dot dot-chord"></span>
            Chord Axis (y=0)
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
            />
            <span className="toggle-dot dot-markers"></span>
            Extrema & Markers
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Grid
          </label>

          <label className="toggle-label highlight-toggle">
            <input
              type="checkbox"
              checked={applyAoARotation}
              onChange={(e) => setApplyAoARotation(e.target.checked)}
            />
            Apply AoA Rotation (α)
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showFreestream}
              onChange={(e) => setShowFreestream(e.target.checked)}
            />
            Freestream Wind (V∞)
          </label>
        </div>

        <div className="zoom-controls">
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            title="Zoom Out"
          >
            −
          </button>
          <span className="zoom-text">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            className="zoom-btn reset-btn"
            onClick={() => setZoomLevel(1.0)}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Validation Warning Alert */}
      {!validation.isValid && (
        <div className="plot-alert plot-alert-error">
          <strong>Geometry Warning:</strong> {validation.errors.join(' ')}
        </div>
      )}

      {/* Main SVG Graph */}
      <div className="svg-container">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="airfoil-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Airfoil body gradient fill */}
            <linearGradient id="airfoilGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--airfoil-stroke, #58a6ff)" stopOpacity="0.22" />
              <stop offset="50%" stopColor="var(--airfoil-fill-mid, #388bfd)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--airfoil-fill-end, #1f6feb)" stopOpacity="0.06" />
            </linearGradient>

            {/* Marker arrow for Freestream flow */}
            <marker
              id="windArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--wind-stroke, #58a6ff)" />
            </marker>
          </defs>

          {/* Background Grid Lines */}
          {showGrid && (
            <g className="grid-layer" opacity="0.35">
              {/* Vertical x/c grid lines */}
              {xTicks.map((xt) => {
                const [X] = toScreen(xt, 0);
                return (
                  <line
                    key={`x-grid-${xt}`}
                    x1={X}
                    y1={plotTop}
                    x2={X}
                    y2={plotBottom}
                    stroke="var(--plot-grid, #94a3b8)"
                    strokeDasharray={xt === 0 || xt === 1 ? 'none' : '3 3'}
                    strokeWidth={xt === 0 || xt === 1 ? '1.5' : '1'}
                  />
                );
              })}

              {/* Horizontal y/c grid lines */}
              {yTicks.map((yt) => {
                const [, Y] = toScreen(0, yt);
                return (
                  <line
                    key={`y-grid-${yt}`}
                    x1={plotLeft}
                    y1={Y}
                    x2={plotRight}
                    y2={Y}
                    stroke="var(--plot-grid, #94a3b8)"
                    strokeDasharray={yt === 0 ? 'none' : '3 3'}
                    strokeWidth={yt === 0 ? '1.5' : '1'}
                  />
                );
              })}
            </g>
          )}

          {/* Coordinate Axes & Labels */}
          <g className="axes-layer">
            {/* X-axis tick labels */}
            {xTicks.map((xt) => {
              const [X] = toScreen(xt, 0);
              return (
                <g key={`x-tick-${xt}`}>
                  <line
                    x1={X}
                    y1={plotBottom}
                    x2={X}
                    y2={plotBottom + 6}
                    stroke="var(--plot-axis, #64748b)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={X}
                    y={plotBottom + 20}
                    textAnchor="middle"
                    className="axis-tick-text"
                  >
                    {xt.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Y-axis tick labels */}
            {yTicks.map((yt) => {
              const [, Y] = toScreen(0, yt);
              return (
                <g key={`y-tick-${yt}`}>
                  <line
                    x1={plotLeft - 6}
                    y1={Y}
                    x2={plotLeft}
                    y2={Y}
                    stroke="var(--plot-axis, #64748b)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={plotLeft - 10}
                    y={Y + 4}
                    textAnchor="end"
                    className="axis-tick-text"
                  >
                    {yt > 0 ? `+${yt.toFixed(2)}` : yt.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Axis Title Labels */}
            <text
              x={(plotLeft + plotRight) / 2}
              y={plotBottom + 40}
              textAnchor="middle"
              className="axis-title-text"
            >
              Normalized Chord Position (x / c)
            </text>
            <text
              x={plotLeft - 50}
              y={(plotTop + plotBottom) / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${plotLeft - 50}, ${(plotTop + plotBottom) / 2})`}
              className="axis-title-text"
            >
              Vertical Coordinate (y / c)
            </text>
          </g>

          {/* Freestream Vector Flow Indication */}
          {showFreestream && (
            <g className="freestream-layer">
              {/* Relative wind velocity arrows */}
              {[-30, 0, 30].map((offsetY, idx) => {
                const windStartX = plotLeft - 40;
                const windStartY = originY + offsetY;
                const windLen = 65;
                const windAngleRad = ((angleOfAttack || 0) * Math.PI) / 180;
                const windEndX = windStartX + windLen * Math.cos(windAngleRad);
                const windEndY = windStartY + windLen * Math.sin(windAngleRad);

                return (
                  <line
                    key={`wind-${idx}`}
                    x1={windStartX}
                    y1={windStartY}
                    x2={windEndX}
                    y2={windEndY}
                    stroke="var(--wind-stroke, #58a6ff)"
                    strokeWidth="1.8"
                    markerEnd="url(#windArrow)"
                    opacity="0.8"
                  />
                );
              })}
              <text
                x={plotLeft - 35}
                y={originY - 45}
                className="wind-label-text"
                fill="var(--wind-stroke, #58a6ff)"
              >
                V∞ (α = {angleOfAttack}°)
              </text>
            </g>
          )}

          {/* Airfoil & Geometry Elements (Transformed by AoA rotation if enabled) */}
          <g id="airfoil-geometry-group" transform={rotationTransform}>
            {/* Chord Line (y = 0 connecting LE to TE) */}
            {showChordLine && (
              <g className="chord-line-group">
                <line
                  x1={lePos[0]}
                  y1={lePos[1]}
                  x2={tePos[0]}
                  y2={tePos[1]}
                  stroke="var(--chord-stroke, #64748b)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
                <text
                  x={(lePos[0] + tePos[0]) / 2}
                  y={lePos[1] + 16}
                  textAnchor="middle"
                  className="element-label-text chord-label"
                >
                  Chord Line (c)
                </text>
              </g>
            )}

            {/* Mean Camber Line (yc) */}
            {showCamberLine && camberPathD && (
              <path
                d={camberPathD}
                fill="none"
                stroke="var(--camber-stroke, #d29922)"
                strokeWidth="2.2"
                strokeDasharray="5 3"
                className="camber-path"
              />
            )}

            {/* Airfoil Surface Profile (Closed outline) */}
            {airfoilPathD && (
              <path
                d={airfoilPathD}
                fill="url(#airfoilGradient)"
                stroke="var(--airfoil-stroke, #58a6ff)"
                strokeWidth="2.6"
                strokeLinejoin="round"
                className="airfoil-path"
              />
            )}

            {/* Extrema & Key Feature Markers */}
            {showMarkers && (
              <g className="markers-group">
                {/* Leading Edge Marker */}
                <circle cx={lePos[0]} cy={lePos[1]} r="4.5" fill="var(--airfoil-stroke, #58a6ff)" />
                <text
                  x={lePos[0] - 8}
                  y={lePos[1] - 10}
                  textAnchor="end"
                  className="marker-label"
                >
                  LE (0, 0)
                </text>

                {/* Trailing Edge Marker */}
                <circle cx={tePos[0]} cy={tePos[1]} r="4.5" fill="var(--airfoil-stroke, #58a6ff)" />
                <text
                  x={tePos[0] + 8}
                  y={tePos[1] - 10}
                  textAnchor="start"
                  className="marker-label"
                >
                  TE (1, 0)
                </text>

                {/* Quarter Chord Aerodynamic Center */}
                <circle
                  cx={quarterChordScreen[0]}
                  cy={quarterChordScreen[1]}
                  r="4"
                  fill="var(--quarter-chord, #93c5fd)"
                />
                <text
                  x={quarterChordScreen[0]}
                  y={quarterChordScreen[1] - 8}
                  textAnchor="middle"
                  className="marker-label quarter-chord-label"
                >
                  c/4 (0.25)
                </text>

                {/* Max Camber Marker */}
                {maxCamberPos && geometry.params.m > 0 && (
                  <g className="max-camber-marker">
                    <circle
                      cx={maxCamberPos[0]}
                      cy={maxCamberPos[1]}
                      r="5"
                      fill="var(--camber-stroke, #d29922)"
                    />
                    <text
                      x={maxCamberPos[0]}
                      y={maxCamberPos[1] - 10}
                      textAnchor="middle"
                      className="marker-label camber-marker-label"
                    >
                      Max Camber: {(geometry.params.m * 100).toFixed(1)}% @ x ={' '}
                      {(geometry.params.p * 100).toFixed(0)}%
                    </text>
                  </g>
                )}

                {/* Max Thickness Callout */}
                {maxThicknessPos && (
                  <g className="max-thickness-marker">
                    {/* Dimension bar between upper and lower surface */}
                    <line
                      x1={maxThicknessPos.upper[0]}
                      y1={maxThicknessPos.upper[1]}
                      x2={maxThicknessPos.lower[0]}
                      y2={maxThicknessPos.lower[1]}
                      stroke="var(--dim-stroke, #bc8cff)"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={maxThicknessPos.upper[0]}
                      cy={maxThicknessPos.upper[1]}
                      r="3.5"
                      fill="var(--dim-stroke, #bc8cff)"
                    />
                    <circle
                      cx={maxThicknessPos.lower[0]}
                      cy={maxThicknessPos.lower[1]}
                      r="3.5"
                      fill="var(--dim-stroke, #bc8cff)"
                    />
                    <text
                      x={maxThicknessPos.upper[0]}
                      y={maxThicknessPos.lower[1] + 16}
                      textAnchor="middle"
                      className="marker-label thickness-marker-label"
                    >
                      t_max = {(geometry.params.t * 100).toFixed(1)}% c
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>

          {/* Interactive Mouse Hover Crosshair and Inspection Tooltip */}
          {hoverData && (
            <g className="inspection-layer">
              {/* Vertical crosshair line */}
              <line
                x1={hoverData.svgX}
                y1={plotTop}
                x2={hoverData.svgX}
                y2={plotBottom}
                stroke="var(--accent, #58a6ff)"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.85"
              />

              {/* Highlight circle on camber and surfaces */}
              <circle
                cx={hoverData.screenPos[0]}
                cy={toScreen(hoverData.x, hoverData.yu)[1]}
                r="4"
                fill="var(--airfoil-stroke, #58a6ff)"
              />
              <circle
                cx={hoverData.screenPos[0]}
                cy={toScreen(hoverData.x, hoverData.yl)[1]}
                r="4"
                fill="var(--airfoil-stroke, #58a6ff)"
              />
              <circle
                cx={hoverData.screenPos[0]}
                cy={toScreen(hoverData.x, hoverData.yc)[1]}
                r="4"
                fill="var(--camber-stroke, #d29922)"
              />
            </g>
          )}
        </svg>

        {/* Live Hover Coordinates Box */}
        {hoverData && (
          <div
            className="hover-tooltip"
            style={{
              left: `${Math.min(720, Math.max(100, hoverData.svgX))}px`,
              top: '20px',
            }}
          >
            <div className="tooltip-row">
              <strong>x / c:</strong> {hoverData.x.toFixed(4)}
            </div>
            <div className="tooltip-row">
              <span className="tooltip-bullet upper-bullet">●</span>
              <strong>y_upper:</strong> {hoverData.yu > 0 ? `+${hoverData.yu.toFixed(4)}` : hoverData.yu.toFixed(4)}
            </div>
            <div className="tooltip-row">
              <span className="tooltip-bullet lower-bullet">●</span>
              <strong>y_lower:</strong> {hoverData.yl.toFixed(4)}
            </div>
            <div className="tooltip-row">
              <span className="tooltip-bullet camber-bullet">●</span>
              <strong>Camber (yc):</strong> {hoverData.yc.toFixed(4)}
            </div>
            <div className="tooltip-row">
              <strong>Thickness (Δy):</strong> {(hoverData.thickness * 100).toFixed(2)}% c
            </div>
          </div>
        )}
      </div>

      {/* Plot Legend & Key Info Footer */}
      <div className="plot-legend-footer">
        <div className="legend-item">
          <span className="legend-line line-surface"></span>
          <span>Airfoil Outline (Upper & Lower)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line line-camber"></span>
          <span>Mean Camber Line (yc)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line line-chord"></span>
          <span>Chord Reference Line (y=0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker marker-extrema"></span>
          <span>Aerodynamic Extrema (LE, TE, t_max)</span>
        </div>
      </div>
    </div>
  );
}
