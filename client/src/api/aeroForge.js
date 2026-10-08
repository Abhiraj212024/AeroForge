/**
 * AeroForge API Client
 * Interfaces with the FastAPI ML backend as described in WING_REDERER.md Section 13.
 */

const DEFAULT_API_BASE = 'http://localhost:8000';

/**
 * Calculates a physics-based analytical baseline estimation
 * used as a reliable fallback when the FastAPI ML server is offline.
 * 
 * Based on thin airfoil theory + Prandtl lifting-line finite wing theory.
 */
function calculateAnalyticalBaseline(params) {
  const {
    aspect_ratio = 8.0,
    taper_ratio = 0.6,
    twist_tip_deg = -2.0,
    angle_of_attack = 4.0,
    naca_m = 0.02,
    naca_t = 0.12,
  } = params;

  // Zero-lift angle of attack estimate: alpha_0l ≈ -115 * m (in degrees)
  const alpha0L_deg = -115 * naca_m;
  // Effective angle of attack accounting for tip twist washout
  const alphaEff_deg = angle_of_attack + 0.5 * twist_tip_deg;
  const alphaEff_rad = ((alphaEff_deg - alpha0L_deg) * Math.PI) / 180;

  // 2D lift curve slope: a0 ≈ 2 * pi * (1 + 0.77 * t)
  const a0 = 2 * Math.PI * (1 + 0.77 * naca_t);

  // Oswald efficiency factor e approximation for tapered wing
  const lambdaDelta = Math.abs(taper_ratio - 0.4);
  const e = Math.max(0.7, 0.95 - 0.05 * lambdaDelta);

  // 3D wing lift curve slope: a = a0 / (1 + a0 / (pi * AR * e))
  const liftSlope3D = a0 / (1 + a0 / (Math.PI * aspect_ratio * e));

  // Lift coefficient CL
  let cl = liftSlope3D * alphaEff_rad;

  // Profile drag coefficient: CD0 ≈ 2 * Cf * (1 + 2t + 60t^4)
  const cf = 0.004; // Turbulent flat plate friction at Re ≈ 3e6
  const cd0 = 2 * cf * (1 + 2 * naca_t + 60 * Math.pow(naca_t, 4));

  // Induced drag coefficient: CDi = CL^2 / (pi * AR * e)
  const cdi = (cl * cl) / (Math.PI * aspect_ratio * e);

  // Total drag coefficient
  const cd = Math.max(0.005, cd0 + cdi);

  return {
    cl: Number(cl.toFixed(4)),
    cd: Number(cd.toFixed(4)),
    model_version: 'v1-analytical-baseline (backend offline)',
    isFallback: true,
  };
}

/**
 * Predicts aerodynamic lift and drag coefficients (CL, CD)
 * 
 * @param {Object} params - The 7 AeroForge parameters
 * @param {string} apiBase - Optional API base URL
 * @returns {Promise<{ cl: number, cd: number, model_version: string, isFallback?: boolean }>}
 */
export async function predictAerodynamics(params, apiBase = DEFAULT_API_BASE) {
  const payload = {
    aspect_ratio: Number(params.aspect_ratio),
    taper_ratio: Number(params.taper_ratio),
    twist_tip_deg: Number(params.twist_tip_deg),
    angle_of_attack: Number(params.angle_of_attack),
    naca_m: Number(params.naca_m),
    naca_p: Number(params.naca_p),
    naca_t: Number(params.naca_t),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${apiBase}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      cl: Number(data.cl),
      cd: Number(data.cd),
      model_version: data.model_version || 'v1',
      isFallback: false,
    };
  } catch (err) {
    // Graceful fallback to physics-based analytical baseline estimation
    const fallback = calculateAnalyticalBaseline(payload);
    return {
      ...fallback,
      offlineNotice: `FastAPI server at ${apiBase}/predict was unreachable (${err.message}). Displaying theoretical aerodynamic baseline.`,
    };
  }
}
