import React, { useState, useMemo, useEffect } from 'react';
import { DEFAULT_AERO_PARAMETERS } from './types/aero.js';
import { generateNacaAirfoilGeometry, validateNacaParams } from './geometry/naca.js';
import { ParameterPanel } from './components/ParameterPanel.jsx';
import { AirfoilPlot } from './components/AirfoilPlot.jsx';
import { PredictionPanel } from './components/PredictionPanel.jsx';
import { GeometrySummary } from './components/GeometrySummary.jsx';
import './App.css';

function App() {
  // Theme state: 'slate' (default), 'paper' (technical light), 'warm' (low blue light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aeroforge_theme') || 'slate';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aeroforge_theme', theme);
  }, [theme]);

  // AeroForge 7-parameter state vector
  const [parameters, setParameters] = useState(DEFAULT_AERO_PARAMETERS);

  // Mesh resolution & spacing configuration
  const [pointCount, setPointCount] = useState(100);
  const [spacing, setSpacing] = useState('cosine');

  // Handle individual parameter change
  const handleParamChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset to default baseline parameters
  const handleReset = () => {
    setParameters(DEFAULT_AERO_PARAMETERS);
    setPointCount(100);
    setSpacing('cosine');
  };

  // Geometry validation for m, p, t
  const validation = useMemo(() => {
    return validateNacaParams({
      m: parameters.naca_m,
      p: parameters.naca_p,
      t: parameters.naca_t,
    });
  }, [parameters.naca_m, parameters.naca_p, parameters.naca_t]);

  // Generate 2D airfoil geometry deterministically (client-side)
  const geometry = useMemo(() => {
    return generateNacaAirfoilGeometry(
      {
        m: parameters.naca_m,
        p: parameters.naca_p,
        t: parameters.naca_t,
      },
      pointCount,
      spacing
    );
  }, [parameters.naca_m, parameters.naca_p, parameters.naca_t, pointCount, spacing]);

  return (
    <div className="aeroforge-app">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="header-branding">
          <div className="logo-icon-box">
            <svg
              className="logo-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 17 4 4 4-4" />
            </svg>
          </div>
          <div className="header-titles">
            <div className="title-row">
              <h1 className="brand-title">AeroForge</h1>
              <span className="brand-badge">Airfoil Studio</span>
            </div>
            <p className="brand-subtitle">
              Parametric Aerodynamic Modeling & 2D Airfoil Cross-Section Visualizer
            </p>
          </div>
        </div>

        <div className="header-controls">
          {/* Theme Switcher Segmented Control */}

          <div className="theme-switcher" role="radiogroup" aria-label="Visual Theme">
            <div>
              <span>Switch Theme:</span>
            </div>
            <div>
              
            </div>
            <button
              type="button"
              className={`theme-pill-btn ${theme === 'slate' ? 'active' : ''}`}
              onClick={() => setTheme('slate')}
              title="Calm Slate — Soothing low-contrast dark mode"
            >
               Dark
            </button>
            <button
              type="button"
              className={`theme-pill-btn ${theme === 'paper' ? 'active' : ''}`}
              onClick={() => setTheme('paper')}
              title="Paper Technical — Clean eggshell blueprint light mode"
            >
              Light
            </button>
            <button
              type="button"
              className={`theme-pill-btn ${theme === 'warm' ? 'active' : ''}`}
              onClick={() => setTheme('warm')}
              title="Warm Charcoal — Low-strain amber night shift mode"
            >
              High Contrast
            </button>
          </div>

          <div className="header-status">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-label">Active</span>
            </div>
            <div className="status-profile-tag">
              {geometry.designation}
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Content Layout */}
      <main className="studio-layout">
        {/* Left Column: Input Controls & Prediction Pipeline */}
        <section className="controls-column">
          <ParameterPanel
            parameters={parameters}
            onChange={handleParamChange}
            onReset={handleReset}
            pointCount={pointCount}
            onPointCountChange={setPointCount}
            spacing={spacing}
            onSpacingChange={setSpacing}
            validation={validation}
          />

          <PredictionPanel parameters={parameters} />
        </section>

        {/* Right Column: Visualization Viewport & Engineering Summary */}
        <section className="viewport-column">
          <AirfoilPlot
            geometry={geometry}
            angleOfAttack={parameters.angle_of_attack}
            validation={validation}
          />

          <GeometrySummary
            geometry={geometry}
            parameters={parameters}
          />
        </section>
      </main>

      {/* Footer & Architectural Principles */}
      <footer className="app-footer">
        <div className="footer-principles">
          <span className="principle-pill">
            <strong>Architecture:</strong> Dual Independent Pipelines (Geometry Engine + ML Inference)
          </span>
          <span className="principle-pill">
            <strong>Formulation:</strong> NACA 4-Digit Series (Cosine Discretization)
          </span>
          <span className="principle-pill">
            <strong>Ref:</strong> WING_REDERER.md
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
