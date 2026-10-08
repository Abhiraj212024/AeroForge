import React, { useState } from 'react';
import { PARAMETER_CONFIGS, NACA_PRESETS } from '../types/aero.js';
import { parseNacaCode, formatNacaCode } from '../geometry/naca.js';

export function ParameterPanel({
  parameters,
  onChange,
  onReset,
  pointCount,
  onPointCountChange,
  spacing,
  onSpacingChange,
  validation,
}) {
  const [customNacaInput, setCustomNacaInput] = useState('');
  const [nacaParseError, setNacaParseError] = useState('');

  // Handle individual parameter changes with numerical casting
  const handleParamChange = (key, rawValue) => {
    const val = parseFloat(rawValue);
    if (!Number.isNaN(val)) {
      onChange(key, val);
    }
  };

  // Quick preset button handler
  const handleApplyPreset = (preset) => {
    Object.entries(preset.params).forEach(([key, val]) => {
      onChange(key, val);
    });
  };

  // 4-digit code direct input submission
  const handleApplyNacaCode = (e) => {
    e.preventDefault();
    setNacaParseError('');
    const parsed = parseNacaCode(customNacaInput.trim());
    if (parsed) {
      Object.entries(parsed).forEach(([key, val]) => {
        onChange(key, val);
      });
      setCustomNacaInput('');
    } else {
      setNacaParseError('Please enter a valid 4-digit NACA code (e.g. 2412, 0012, 4415).');
    }
  };

  const currentCode = formatNacaCode(
    parameters.naca_m,
    parameters.naca_p,
    parameters.naca_t
  );

  return (
    <div className="parameter-panel-card">
      <div className="panel-header">
        <h2 className="panel-title">AeroForge Parameters</h2>
        <span className="current-profile-pill">{currentCode}</span>
      </div>

      {/* NACA 4-Digit Quick Presets */}
      <div className="presets-section">
        <label className="section-label">NACA 4-Digit Presets</label>
        <div className="preset-buttons-grid">
          {NACA_PRESETS.map((preset) => {
            const isActive =
              Math.abs(parameters.naca_m - preset.params.naca_m) < 0.001 &&
              Math.abs(parameters.naca_p - preset.params.naca_p) < 0.001 &&
              Math.abs(parameters.naca_t - preset.params.naca_t) < 0.001;
            return (
              <button
                key={preset.name}
                type="button"
                className={`preset-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleApplyPreset(preset)}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Direct 4-digit text code input */}
        <form onSubmit={handleApplyNacaCode} className="direct-code-form">
          <input
            type="text"
            className="code-input"
            placeholder="e.g. 2412, 0015, 6409"
            value={customNacaInput}
            onChange={(e) => {
              setCustomNacaInput(e.target.value);
              setNacaParseError('');
            }}
          />
          <button type="submit" className="code-submit-btn">
            Apply Code
          </button>
        </form>
        {nacaParseError && <div className="input-error-msg">{nacaParseError}</div>}
      </div>

      {/* Group 1: 2D Airfoil Geometry Parameters (m, p, t) */}
      <div className="param-group">
        <div className="group-header">
          <span className="group-title">Airfoil Cross-Section (m, p, t)</span>
          <span className="group-tag">Drives 2D Geometry</span>
        </div>

        {/* naca_m */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="naca_m" className="param-label">
              {PARAMETER_CONFIGS.naca_m.label}
            </label>
            <div className="param-value-box">
              <input
                id="naca_m_num"
                type="number"
                min={PARAMETER_CONFIGS.naca_m.min}
                max={PARAMETER_CONFIGS.naca_m.max}
                step={PARAMETER_CONFIGS.naca_m.step}
                value={parameters.naca_m}
                onChange={(e) => handleParamChange('naca_m', e.target.value)}
                className="param-num-input"
              />
              <span className="unit-label">({(parameters.naca_m * 100).toFixed(1)}% c)</span>
            </div>
          </div>
          <input
            id="naca_m"
            type="range"
            min={PARAMETER_CONFIGS.naca_m.min}
            max={PARAMETER_CONFIGS.naca_m.max}
            step={PARAMETER_CONFIGS.naca_m.step}
            value={parameters.naca_m}
            onChange={(e) => handleParamChange('naca_m', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.naca_m.description}</p>
        </div>

        {/* naca_p */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="naca_p" className="param-label">
              {PARAMETER_CONFIGS.naca_p.label}
            </label>
            <div className="param-value-box">
              <input
                id="naca_p_num"
                type="number"
                min={PARAMETER_CONFIGS.naca_p.min}
                max={PARAMETER_CONFIGS.naca_p.max}
                step={PARAMETER_CONFIGS.naca_p.step}
                value={parameters.naca_p}
                onChange={(e) => handleParamChange('naca_p', e.target.value)}
                className="param-num-input"
              />
              <span className="unit-label">({(parameters.naca_p * 100).toFixed(0)}% c)</span>
            </div>
          </div>
          <input
            id="naca_p"
            type="range"
            min={PARAMETER_CONFIGS.naca_p.min}
            max={PARAMETER_CONFIGS.naca_p.max}
            step={PARAMETER_CONFIGS.naca_p.step}
            value={parameters.naca_p}
            onChange={(e) => handleParamChange('naca_p', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.naca_p.description}</p>
        </div>

        {/* naca_t */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="naca_t" className="param-label">
              {PARAMETER_CONFIGS.naca_t.label}
            </label>
            <div className="param-value-box">
              <input
                id="naca_t_num"
                type="number"
                min={PARAMETER_CONFIGS.naca_t.min}
                max={PARAMETER_CONFIGS.naca_t.max}
                step={PARAMETER_CONFIGS.naca_t.step}
                value={parameters.naca_t}
                onChange={(e) => handleParamChange('naca_t', e.target.value)}
                className="param-num-input"
              />
              <span className="unit-label">({(parameters.naca_t * 100).toFixed(1)}% c)</span>
            </div>
          </div>
          <input
            id="naca_t"
            type="range"
            min={PARAMETER_CONFIGS.naca_t.min}
            max={PARAMETER_CONFIGS.naca_t.max}
            step={PARAMETER_CONFIGS.naca_t.step}
            value={parameters.naca_t}
            onChange={(e) => handleParamChange('naca_t', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.naca_t.description}</p>
        </div>
      </div>

      {/* Group 2: Aerodynamic Flow & Wing Planform Parameters */}
      <div className="param-group">
        <div className="group-header">
          <span className="group-title">Wing & Flow State (AR, λ, θt, α)</span>
          <span className="group-tag">Prediction Vector</span>
        </div>

        {/* angle_of_attack */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="angle_of_attack" className="param-label">
              {PARAMETER_CONFIGS.angle_of_attack.label}
            </label>
            <div className="param-value-box">
              <input
                id="angle_of_attack_num"
                type="number"
                min={PARAMETER_CONFIGS.angle_of_attack.min}
                max={PARAMETER_CONFIGS.angle_of_attack.max}
                step={PARAMETER_CONFIGS.angle_of_attack.step}
                value={parameters.angle_of_attack}
                onChange={(e) => handleParamChange('angle_of_attack', e.target.value)}
                className="param-num-input"
              />
              <span className="unit-label">°</span>
            </div>
          </div>
          <input
            id="angle_of_attack"
            type="range"
            min={PARAMETER_CONFIGS.angle_of_attack.min}
            max={PARAMETER_CONFIGS.angle_of_attack.max}
            step={PARAMETER_CONFIGS.angle_of_attack.step}
            value={parameters.angle_of_attack}
            onChange={(e) => handleParamChange('angle_of_attack', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.angle_of_attack.description}</p>
        </div>

        {/* aspect_ratio */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="aspect_ratio" className="param-label">
              {PARAMETER_CONFIGS.aspect_ratio.label}
            </label>
            <div className="param-value-box">
              <input
                id="aspect_ratio_num"
                type="number"
                min={PARAMETER_CONFIGS.aspect_ratio.min}
                max={PARAMETER_CONFIGS.aspect_ratio.max}
                step={PARAMETER_CONFIGS.aspect_ratio.step}
                value={parameters.aspect_ratio}
                onChange={(e) => handleParamChange('aspect_ratio', e.target.value)}
                className="param-num-input"
              />
            </div>
          </div>
          <input
            id="aspect_ratio"
            type="range"
            min={PARAMETER_CONFIGS.aspect_ratio.min}
            max={PARAMETER_CONFIGS.aspect_ratio.max}
            step={PARAMETER_CONFIGS.aspect_ratio.step}
            value={parameters.aspect_ratio}
            onChange={(e) => handleParamChange('aspect_ratio', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.aspect_ratio.description}</p>
        </div>

        {/* taper_ratio */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="taper_ratio" className="param-label">
              {PARAMETER_CONFIGS.taper_ratio.label}
            </label>
            <div className="param-value-box">
              <input
                id="taper_ratio_num"
                type="number"
                min={PARAMETER_CONFIGS.taper_ratio.min}
                max={PARAMETER_CONFIGS.taper_ratio.max}
                step={PARAMETER_CONFIGS.taper_ratio.step}
                value={parameters.taper_ratio}
                onChange={(e) => handleParamChange('taper_ratio', e.target.value)}
                className="param-num-input"
              />
            </div>
          </div>
          <input
            id="taper_ratio"
            type="range"
            min={PARAMETER_CONFIGS.taper_ratio.min}
            max={PARAMETER_CONFIGS.taper_ratio.max}
            step={PARAMETER_CONFIGS.taper_ratio.step}
            value={parameters.taper_ratio}
            onChange={(e) => handleParamChange('taper_ratio', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.taper_ratio.description}</p>
        </div>

        {/* twist_tip_deg */}
        <div className="param-item">
          <div className="param-meta">
            <label htmlFor="twist_tip_deg" className="param-label">
              {PARAMETER_CONFIGS.twist_tip_deg.label}
            </label>
            <div className="param-value-box">
              <input
                id="twist_tip_deg_num"
                type="number"
                min={PARAMETER_CONFIGS.twist_tip_deg.min}
                max={PARAMETER_CONFIGS.twist_tip_deg.max}
                step={PARAMETER_CONFIGS.twist_tip_deg.step}
                value={parameters.twist_tip_deg}
                onChange={(e) => handleParamChange('twist_tip_deg', e.target.value)}
                className="param-num-input"
              />
              <span className="unit-label">°</span>
            </div>
          </div>
          <input
            id="twist_tip_deg"
            type="range"
            min={PARAMETER_CONFIGS.twist_tip_deg.min}
            max={PARAMETER_CONFIGS.twist_tip_deg.max}
            step={PARAMETER_CONFIGS.twist_tip_deg.step}
            value={parameters.twist_tip_deg}
            onChange={(e) => handleParamChange('twist_tip_deg', e.target.value)}
            className="param-slider"
          />
          <p className="param-help">{PARAMETER_CONFIGS.twist_tip_deg.description}</p>
        </div>
      </div>

      {/* Discretization / Mesh Settings */}
      <div className="mesh-settings-section">
        <label className="section-label">Discretization & Resolution</label>
        <div className="mesh-controls-row">
          <div className="control-field">
            <span className="field-title">Points (N):</span>
            <select
              value={pointCount}
              onChange={(e) => onPointCountChange(parseInt(e.target.value, 10))}
              className="mesh-select"
            >
              <option value={50}>50 points</option>
              <option value={100}>100 points (Recommended)</option>
              <option value={150}>150 points</option>
              <option value={200}>200 points (High precision)</option>
            </select>
          </div>

          <div className="control-field">
            <span className="field-title">Spacing:</span>
            <select
              value={spacing}
              onChange={(e) => onSpacingChange(e.target.value)}
              className="mesh-select"
            >
              <option value="cosine">Cosine (Bunched at LE)</option>
              <option value="uniform">Uniform</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validation display */}
      {!validation.isValid && (
        <div className="validation-error-box">
          {validation.errors.map((err, i) => (
            <div key={i} className="validation-item error-item">
              ⚠ {err}
            </div>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="validation-warning-box">
          {validation.warnings.map((warn, i) => (
            <div key={i} className="validation-item warn-item">
              ℹ {warn}
            </div>
          ))}
        </div>
      )}

      {/* Reset button */}
      <div className="panel-footer">
        <button type="button" className="reset-all-btn" onClick={onReset}>
          Reset to AeroForge Defaults
        </button>
      </div>
    </div>
  );
}
