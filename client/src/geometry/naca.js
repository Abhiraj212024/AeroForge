/**
 * NACA 4-Digit Airfoil Geometry Engine
 * Implements the mathematical specification from WING_REDERER.md
 * 
 * Free of DOM or React dependencies.
 */

/**
 * Validates NACA parameters
 * @param {Object} params
 * @param {number} params.m - Maximum camber (0 <= m <= 0.1)
 * @param {number} params.p - Camber position (0 < p < 1)
 * @param {number} params.t - Maximum thickness (0 < t)
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateNacaParams(params) {
  const errors = [];
  const warnings = [];

  const m = Number(params?.m ?? params?.naca_m);
  const p = Number(params?.p ?? params?.naca_p);
  const t = Number(params?.t ?? params?.naca_t);

  if (Number.isNaN(m) || m < 0) {
    errors.push('Max camber (m) must be non-negative (m >= 0).');
  } else if (m > 0.10) {
    warnings.push('Max camber (m) exceeds typical aerodynamic limits (m > 0.10).');
  }

  if (Number.isNaN(p) || p <= 0 || p >= 1) {
    errors.push('Camber position (p) must satisfy 0 < p < 1.');
  }

  if (Number.isNaN(t) || t <= 0) {
    errors.push('Max thickness (t) must be strictly positive (t > 0).');
  } else if (t > 0.40) {
    warnings.push('Airfoil thickness exceeds 40% chord (unusually thick).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Formats m, p, t into the canonical NACA 4-digit designation string
 * Example: m=0.02, p=0.40, t=0.12 -> "NACA 2412"
 */
export function formatNacaCode(m, p, t) {
  const digit1 = Math.round(Math.max(0, m) * 100);
  const digit2 = Math.round(Math.max(0, p) * 10);
  const digit34 = Math.round(Math.max(0, t) * 100);
  const tStr = digit34 < 10 ? `0${digit34}` : `${digit34}`;
  return `NACA ${digit1}${digit2}${tStr}`;
}

/**
 * Parses a 4-digit NACA string (e.g. "2412" or "NACA 2412") into m, p, t
 */
export function parseNacaCode(codeStr) {
  if (!codeStr || typeof codeStr !== 'string') return null;
  const match = codeStr.replace(/\s+/g, '').match(/(?:NACA)?(\d)(\d)(\d{2})/i);
  if (!match) return null;

  const m = parseInt(match[1], 10) / 100;
  const p = parseInt(match[2], 10) / 10;
  const t = parseInt(match[3], 10) / 100;

  return {
    naca_m: m,
    naca_p: p === 0 ? 0.4 : p, // NACA 00xx convention uses symmetric camber
    naca_t: t,
  };
}

/**
 * Generates full airfoil geometry including upper/lower coordinates,
 * camber line, thickness distribution, and aerodynamic metrics.
 * 
 * @param {Object} params - { m, p, t } or { naca_m, naca_p, naca_t }
 * @param {number} n - Number of points along chord (default: 100)
 * @param {string} spacing - 'cosine' (recommended) or 'uniform'
 */
export function generateNacaAirfoilGeometry(params, n = 100, spacing = 'cosine') {
  const m = Number(params?.m ?? params?.naca_m ?? 0.02);
  const p = Number(params?.p ?? params?.naca_p ?? 0.40);
  const t = Number(params?.t ?? params?.naca_t ?? 0.12);

  const numPoints = Math.max(10, Math.floor(n));

  const upper = [];
  const lower = [];
  const camber = [];
  const thicknessProfile = [];

  // Generate coordinates from LE (x=0) to TE (x=1)
  for (let i = 0; i <= numPoints; i++) {
    let x;
    if (spacing === 'cosine') {
      // Cosine spacing: x_i = (1 - cos(i * pi / N)) / 2
      const beta = (i * Math.PI) / numPoints;
      x = (1 - Math.cos(beta)) / 2;
    } else {
      // Uniform spacing: x_i = i / N
      x = i / numPoints;
    }

    // Clamp x to [0, 1] for numerical stability
    x = Math.max(0, Math.min(1, x));

    // NACA 4-digit thickness distribution:
    // yt = 5t * (0.2969 * sqrt(x) - 0.1260 * x - 0.3516 * x^2 + 0.2843 * x^3 - 0.1015 * x^4)
    const sqrtX = Math.sqrt(x);
    const yt =
      5 *
      t *
      (0.2969 * sqrtX -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * Math.pow(x, 3) -
        0.1015 * Math.pow(x, 4));

    // Camber line (yc) and camber gradient (dyc/dx):
    let yc = 0;
    let dyc_dx = 0;

    if (m > 0 && p > 0 && p < 1) {
      if (x < p) {
        // Forward of maximum camber (0 <= x < p):
        // yc = (m / p^2) * (2px - x^2)
        // dyc/dx = (2m / p^2) * (p - x)
        yc = (m / (p * p)) * (2 * p * x - x * x);
        dyc_dx = ((2 * m) / (p * p)) * (p - x);
      } else {
        // Aft of maximum camber (p <= x <= 1):
        // yc = (m / (1-p)^2) * ((1-2p) + 2px - x^2)
        // dyc/dx = (2m / (1-p)^2) * (p - x)
        const oneMinusP = 1 - p;
        yc = (m / (oneMinusP * oneMinusP)) * (1 - 2 * p + 2 * p * x - x * x);
        dyc_dx = ((2 * m) / (oneMinusP * oneMinusP)) * (p - x);
      }
    }

    // Local camber angle: theta = atan(dyc/dx)
    const theta = Math.atan(dyc_dx);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    // Surface coordinates:
    // Upper surface: xu = x - yt * sin(theta), yu = yc + yt * cos(theta)
    // Lower surface: xl = x + yt * sin(theta), yl = yc - yt * cos(theta)
    const xu = x - yt * sinTheta;
    const yu = yc + yt * cosTheta;
    const xl = x + yt * sinTheta;
    const yl = yc - yt * cosTheta;

    upper.push({ x: xu, y: yu });
    lower.push({ x: xl, y: yl });
    camber.push({ x, y: yc, dyc_dx });
    thicknessProfile.push({ x, yt: 2 * yt });
  }

  // Ordered closed sequence around airfoil as specified in WING_REDERER.md:
  // Upper surface: Trailing Edge -> Leading Edge (upper reversed)
  // Lower surface: Leading Edge -> Trailing Edge (lower skipping duplicate LE at index 0)
  const upperReversed = [...upper].reverse();
  const lowerForward = lower.slice(1);
  const closedPoints = [...upperReversed, ...lowerForward];

  // Aerodynamic Metrics
  const nacaDesignation = formatNacaCode(m, p, t);
  const leadingEdgeRadius = 1.1019 * t * t; // Standard NACA LE radius approximation: r_le / c ≈ 1.1019 * t^2

  // Polygon Area calculation via Shoelace formula
  let area = 0;
  for (let j = 0; j < closedPoints.length; j++) {
    const p1 = closedPoints[j];
    const p2 = closedPoints[(j + 1) % closedPoints.length];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  area = Math.abs(area) / 2;

  return {
    params: { m, p, t },
    designation: nacaDesignation,
    upper,
    lower,
    camber,
    chord: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    thicknessProfile,
    points: closedPoints,
    metrics: {
      maxCamber: { x: p, y: m },
      maxThickness: { x: 0.30, t },
      leadingEdgeRadius,
      crossSectionArea: area,
      pointCount: closedPoints.length,
      trailingEdgeGap: Math.abs(upper[upper.length - 1].y - lower[lower.length - 1].y),
    },
  };
}

/**
 * Standard generateNacaAirfoil interface requested in WING_REDERER.md Section 11:
 * Returns Point[] of the closed airfoil outline.
 * 
 * @param {Object} params - { m, p, t }
 * @param {number} n - Number of points
 * @returns {Array<{x: number, y: number}>}
 */
export function generateNacaAirfoil(params, n = 100) {
  const geom = generateNacaAirfoilGeometry(params, n);
  return geom.points;
}

/**
 * Converts an array of points into an SVG path data string
 */
export function pointsToSvgPath(points, transformFn = (p) => [p.x, p.y], close = true) {
  if (!points || points.length === 0) return '';
  const [firstX, firstY] = transformFn(points[0]);
  let d = `M ${firstX.toFixed(3)} ${firstY.toFixed(3)}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = transformFn(points[i]);
    d += ` L ${x.toFixed(3)} ${y.toFixed(3)}`;
  }
  if (close) {
    d += ' Z';
  }
  return d;
}

/**
 * Exports airfoil geometry to Selig-format .DAT file (standard aerodynamic format)
 */
export function exportToDat(geometry) {
  const { designation, points } = geometry;
  const header = `${designation} (AeroForge)\n`;
  const coords = points
    .map((p) => `   ${p.x.toFixed(6).padStart(10)}   ${p.y.toFixed(6).padStart(10)}`)
    .join('\n');
  return header + coords;
}

/**
 * Exports airfoil geometry to CSV format
 */
export function exportToCsv(geometry) {
  const { points } = geometry;
  let csv = 'x_chord,y_chord,surface\n';
  const half = Math.floor(points.length / 2);
  points.forEach((p, index) => {
    const surface = index <= half ? 'upper' : 'lower';
    csv += `${p.x.toFixed(6)},${p.y.toFixed(6)},${surface}\n`;
  });
  return csv;
}
