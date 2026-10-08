/**
 * AeroForge Aerodynamic Parameter Definitions & Presets
 * Based on WING_REDERER.md specification
 */

/**
 * Default parameter state containing all 7 AeroForge parameters
 */
export const DEFAULT_AERO_PARAMETERS = {
  // Wing planform and flow parameters (retained for prediction & future 3D planform)
  aspect_ratio: 8.0,
  taper_ratio: 0.6,
  twist_tip_deg: -2.0,
  angle_of_attack: 4.0,

  // Airfoil cross-section parameters (used by 2D NACA renderer)
  naca_m: 0.02,
  naca_p: 0.40,
  naca_t: 0.12,
};

/**
 * Configuration and constraints for all parameters
 */
export const PARAMETER_CONFIGS = {
  naca_m: {
    key: 'naca_m',
    label: 'Max Camber (m)',
    symbol: 'm',
    min: 0.0,
    max: 0.095,
    step: 0.005,
    unit: '',
    description: 'Maximum camber as a fraction of chord (e.g., 0.02 = 2% camber)',
    category: 'airfoil',
  },
  naca_p: {
    key: 'naca_p',
    label: 'Camber Position (p)',
    symbol: 'p',
    min: 0.05,
    max: 0.90,
    step: 0.05,
    unit: '',
    description: 'Location of maximum camber along chord (e.g., 0.40 = 40% chord)',
    category: 'airfoil',
  },
  naca_t: {
    key: 'naca_t',
    label: 'Max Thickness (t)',
    symbol: 't',
    min: 0.01,
    max: 0.35,
    step: 0.01,
    unit: '',
    description: 'Maximum thickness as a fraction of chord (e.g., 0.12 = 12% chord)',
    category: 'airfoil',
  },
  angle_of_attack: {
    key: 'angle_of_attack',
    label: 'Angle of Attack (α)',
    symbol: 'α',
    min: -15.0,
    max: 25.0,
    step: 0.5,
    unit: '°',
    description: 'Airfoil orientation relative to oncoming freestream velocity',
    category: 'flow',
  },
  aspect_ratio: {
    key: 'aspect_ratio',
    label: 'Aspect Ratio (AR)',
    symbol: 'AR',
    min: 1.0,
    max: 20.0,
    step: 0.5,
    unit: '',
    description: 'Wing aspect ratio b² / S (wingspan squared over planform area)',
    category: 'wing',
  },
  taper_ratio: {
    key: 'taper_ratio',
    label: 'Taper Ratio (λ)',
    symbol: 'λ',
    min: 0.1,
    max: 1.0,
    step: 0.05,
    unit: '',
    description: 'Ratio of tip chord to root chord (ct / cr)',
    category: 'wing',
  },
  twist_tip_deg: {
    key: 'twist_tip_deg',
    label: 'Tip Twist (θt)',
    symbol: 'θt',
    min: -10.0,
    max: 10.0,
    step: 0.5,
    unit: '°',
    description: 'Geometric washout or twist angle at wing tip',
    category: 'wing',
  },
};

/**
 * Standard NACA 4-Digit Presets
 */
export const NACA_PRESETS = [
  {
    name: 'NACA 2412',
    description: 'Classic general aviation (Cessna 172, Piper Cherokee)',
    params: { naca_m: 0.02, naca_p: 0.40, naca_t: 0.12 },
  },
  {
    name: 'NACA 0012',
    description: 'Symmetric airfoil for vertical tails, aerobatics, rotorcraft',
    params: { naca_m: 0.00, naca_p: 0.40, naca_t: 0.12 },
  },
  {
    name: 'NACA 4412',
    description: 'High-camber general aviation & STOL transport section',
    params: { naca_m: 0.04, naca_p: 0.40, naca_t: 0.12 },
  },
  {
    name: 'NACA 0006',
    description: 'Thin symmetric section for supersonic wings & horizontal stabilizers',
    params: { naca_m: 0.00, naca_p: 0.40, naca_t: 0.06 },
  },
  {
    name: 'NACA 6409',
    description: 'Thin high-camber profile for low Reynolds number & sailplanes',
    params: { naca_m: 0.06, naca_p: 0.40, naca_t: 0.09 },
  },
  {
    name: 'NACA 2415',
    description: 'Moderate camber, thicker root section for structural volume',
    params: { naca_m: 0.02, naca_p: 0.40, naca_t: 0.15 },
  },
];
