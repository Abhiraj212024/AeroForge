import React from 'react';

export function GeometrySummary({ geometry, parameters }) {
  if (!geometry) return null;

  const { metrics, params, designation } = geometry;
  const { aspect_ratio, taper_ratio, twist_tip_deg, angle_of_attack } = parameters;

  return (
    <div className="geometry-summary-card">
      <h3 className="summary-title">Aerodynamic & Geometric Specifications</h3>

      <div className="specs-columns">
        {/* Airfoil Cross-Section Specs */}
        <div className="specs-block">
          <div className="specs-block-title">2D Airfoil Characteristics ({designation})</div>
          <div className="spec-table">
            <div className="spec-row">
              <span className="spec-name">Maximum Camber (m):</span>
              <span className="spec-val">
                {(params.m * 100).toFixed(2)}% chord ({params.m.toFixed(4)} c)
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Camber Location (p):</span>
              <span className="spec-val">
                {(params.p * 100).toFixed(1)}% chord ({params.p.toFixed(2)} c)
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Maximum Thickness (t):</span>
              <span className="spec-val">
                {(params.t * 100).toFixed(2)}% chord ({params.t.toFixed(4)} c)
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Leading Edge Radius (r_le):</span>
              <span className="spec-val">
                {(metrics.leadingEdgeRadius * 100).toFixed(3)}% chord
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Cross-Section Area (A / c²):</span>
              <span className="spec-val">{metrics.crossSectionArea.toFixed(5)}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Trailing Edge Gap:</span>
              <span className="spec-val">{(metrics.trailingEdgeGap * 100).toFixed(3)}% c</span>
            </div>
          </div>
        </div>

        {/* Wing Planform Vector Specs */}
        <div className="specs-block">
          <div className="specs-block-title">Wing Planform State (Section 1 & 14)</div>
          <div className="spec-table">
            <div className="spec-row">
              <span className="spec-name">Wing Aspect Ratio (AR = b²/S):</span>
              <span className="spec-val">{aspect_ratio.toFixed(1)}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Taper Ratio (λ = ct/cr):</span>
              <span className="spec-val">{taper_ratio.toFixed(2)}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Tip Geometric Twist (θt):</span>
              <span className="spec-val">{twist_tip_deg > 0 ? `+${twist_tip_deg}°` : `${twist_tip_deg}°`}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Freestream Angle of Attack (α):</span>
              <span className="spec-val">{angle_of_attack > 0 ? `+${angle_of_attack}°` : `${angle_of_attack}°`}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Airfoil Symmetry:</span>
              <span className="spec-val">{params.m === 0 ? 'Symmetric Profile' : 'Cambered Profile'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Discretization Resolution:</span>
              <span className="spec-val">{metrics.pointCount} contour coordinates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
