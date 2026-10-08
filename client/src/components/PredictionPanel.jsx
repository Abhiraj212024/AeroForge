import React, { useState } from 'react';
import { predictAerodynamics } from '../api/aeroForge.js';

export function PredictionPanel({ parameters }) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');
  const [showConfig, setShowConfig] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predictAerodynamics(parameters, apiEndpoint);
      setPrediction(res);
    } catch (err) {
      setPrediction({
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPayload = {
    aspect_ratio: parameters.aspect_ratio,
    taper_ratio: parameters.taper_ratio,
    twist_tip_deg: parameters.twist_tip_deg,
    angle_of_attack: parameters.angle_of_attack,
    naca_m: parameters.naca_m,
    naca_p: parameters.naca_p,
    naca_t: parameters.naca_t,
  };

  const liftToDragRatio =
    prediction?.cl != null && prediction?.cd != null && prediction.cd > 0
      ? (prediction.cl / prediction.cd).toFixed(2)
      : null;

  return (
    <div className="prediction-panel-card">
      <div className="panel-header">
        <div>
          <h3 className="prediction-title">Aerodynamic Prediction Pipeline</h3>
          <p className="prediction-subtitle">
            FastAPI ML Inference ({'AR, λ, θt, α, m, p, t'} → {'CL, CD'})
          </p>
        </div>
        <button
          type="button"
          className="endpoint-toggle-btn"
          onClick={() => setShowConfig(!showConfig)}
          title="Configure API Endpoint"
        >
          ⚙ Endpoint
        </button>
      </div>

      {showConfig && (
        <div className="endpoint-config-box">
          <label className="config-label">ML Backend URL:</label>
          <input
            type="text"
            className="endpoint-input"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="http://localhost:8000"
          />
          <small className="config-hint">
            FastAPI endpoint receiving POST <code>/predict</code>
          </small>
        </div>
      )}

      {/* Main Predict Action */}
      <div className="predict-action-row">
        <button
          type="button"
          className={`predict-btn ${loading ? 'loading' : ''}`}
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-label">
              <span className="btn-spinner"></span> Running Inference...
            </span>
          ) : (
            '⚡ Predict Aerodynamics (CL / CD)'
          )}
        </button>
      </div>

      {/* Results Display */}
      {prediction && (
        <div className="prediction-results">
          {prediction.error ? (
            <div className="prediction-error">
              <strong>Error:</strong> {prediction.error}
            </div>
          ) : (
            <>
              {prediction.offlineNotice && (
                <div className="backend-offline-banner">
                  <span className="offline-icon">ℹ</span>
                  <span>{prediction.offlineNotice}</span>
                </div>
              )}

              <div className="results-grid">
                <div className="result-metric-card lift-card">
                  <span className="metric-label">Lift Coefficient</span>
                  <div className="metric-val-row">
                    <span className="metric-symbol">CL</span>
                    <span className="metric-value">{prediction.cl}</span>
                  </div>
                </div>

                <div className="result-metric-card drag-card">
                  <span className="metric-label">Drag Coefficient</span>
                  <div className="metric-val-row">
                    <span className="metric-symbol">CD</span>
                    <span className="metric-value">{prediction.cd}</span>
                  </div>
                </div>

                <div className="result-metric-card efficiency-card">
                  <span className="metric-label">Aerodynamic Efficiency</span>
                  <div className="metric-val-row">
                    <span className="metric-symbol">L / D</span>
                    <span className="metric-value">{liftToDragRatio ?? '—'}</span>
                  </div>
                </div>
              </div>

              <div className="prediction-meta">
                <span>
                  <strong>Model:</strong> {prediction.model_version}
                </span>
                <span>
                  <strong>Status:</strong> {prediction.isFallback ? 'Analytical Baseline' : 'ML Model Verified'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* API Payload Inspector Toggle */}
      <div className="payload-inspector-container">
        <button
          type="button"
          className="payload-toggle-btn"
          onClick={() => setShowPayload(!showPayload)}
        >
          {showPayload ? '▼ Hide JSON Payload' : '▶ Inspect API Request Payload'}
        </button>
        {showPayload && (
          <pre className="payload-json-block">
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
