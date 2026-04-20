/**
 * HAL Helicopter Performance — Central Logic / Config Layer
 * ---------------------------------------------------------
 * SOURCE OF TRUTH for:
 *   - Per-aircraft defaults (empty weight, MAUW, defaults)
 *   - Unit definitions & conversion factors
 *   - 7 calculation formulas (editable live via Settings)
 *   - Fit-to-Fly threshold logic (0.01 precision)
 *
 * Formulas match the HAL domain spec:
 *   • Inputs (fixed units): Elevation (ft), QNH (mb), Temp (°C),
 *     AC Weight (lb), Crew (kg), Fuel (litres), Add Eqpt (kg), Load (kg)
 *   • Outputs: PA (ft), ISA_TEMP (°C), DENSITY_ALT (ft),
 *     ABS_TEMP (K), AUW (lb), POWER_AVAIL (0-1), POWER_REQ (0-1)
 *   • Fit-to-Fly: POWER_REQ ≤ POWER_AVAIL AND AUW ≤ MAUW
 *
 * Anything here can be overridden live via the Settings screen
 * (persisted in SQLite, loaded at app boot).
 */

export const DEFAULT_AIRCRAFT = {
  chetak: {
    id: 'chetak',
    name: 'Chetak',
    emptyWeight: 2645,     // lb
    mauw: 4630,            // lb
    defaultCrew: 180,      // kg
    defaultFuel: 575,      // litres (from PPTX spec)
    defaultAddLoad: 0,     // kg
    defaultPayload: 75,    // kg (P, CP WT from PPTX)
    defaultElevation: 0,   // ft
    defaultQNH: 1013,      // mb
    defaultTemp: 15,       // °C
  },
  cheetah: {
    id: 'cheetah',
    name: 'Cheetah',
    emptyWeight: 2469,     // lb  (≈1120 kg)
    mauw: 4299,            // lb  (≈1950 kg)
    defaultCrew: 180,      // kg
    defaultFuel: 500,      // litres
    defaultAddLoad: 0,     // kg
    defaultPayload: 75,    // kg
    defaultElevation: 0,   // ft
    defaultQNH: 1013,      // mb
    defaultTemp: 15,       // °C
  },
  cheetal: {
    id: 'cheetal',
    name: 'Cheetal',
    emptyWeight: 2756,     // lb  (≈1250 kg)
    mauw: 4960,            // lb  (≈2250 kg)
    defaultCrew: 180,      // kg
    defaultFuel: 575,      // litres
    defaultAddLoad: 0,     // kg
    defaultPayload: 75,    // kg
    defaultElevation: 0,   // ft
    defaultQNH: 1013,      // mb
    defaultTemp: 15,       // °C
  },
};

/* ---------------- UNIT CONVERSION ---------------- */
export const CONVERSIONS = {
  ft_to_m: 0.3048,
  m_to_ft: 3.28084,
  kg_to_lb: 2.20462,
  lb_to_kg: 0.453592,
  C_to_F: (c) => (c * 9) / 5 + 32,
  F_to_C: (f) => ((f - 32) * 5) / 9,
  hPa_to_inHg: 0.02953,
  inHg_to_hPa: 33.8639,
  // Aviation fuel (Jet A / Avgas approx): 1 litre ≈ 0.775 kg
  L_to_kg_fuel: 0.775,
  kg_to_L_fuel: 1 / 0.775,
};

export const toBaseUnit = (value, unit) => {
  switch (unit) {
    case 'ft': return value;
    case 'm': return value * CONVERSIONS.m_to_ft;
    case 'C': return value;
    case 'F': return CONVERSIONS.F_to_C(value);
    case 'kg': return value;
    case 'lb': return value;           // lb stays lb (AC weight base is lb)
    case 'L': return value;            // litres stays litres (fuel base)
    case 'hPa': return value;
    case 'mb': return value;
    case 'inHg': return value * CONVERSIONS.inHg_to_hPa;
    default: return value;
  }
};

export const fromBaseUnit = (value, unit) => {
  switch (unit) {
    case 'ft': return value;
    case 'm': return value * CONVERSIONS.ft_to_m;
    case 'C': return value;
    case 'F': return CONVERSIONS.C_to_F(value);
    case 'kg': return value;
    case 'lb': return value;
    case 'L': return value;
    case 'hPa': return value;
    case 'mb': return value;
    case 'inHg': return value * CONVERSIONS.hPa_to_inHg;
    default: return value;
  }
};

/* ---------------- FORMULAS (Editable via Settings) ---------------- */
/**
 * All formulas below match the HAL Power-Calc spec verbatim.
 * They are TEXT strings so the user can edit them live on the Settings screen.
 * The logic engine uses a scoped Function constructor to evaluate them
 * with the variables named below each formula.
 */
export const DEFAULT_FORMULAS = {
  // 1. Pressure Altitude (ft)
  //    vars: elevation (ft), qnh (mb)
  PA: 'elevation + (1013 - qnh) * 30',

  // 2. ISA Temperature (°C) — spec uses ELEVATION (not PA)
  //    vars: elevation (ft)
  ISA_TEMP: '15 - (elevation / 1000) * 2',

  // 3. Density Altitude (ft)
  //    vars: pa (ft), oat (°C), isa (°C)
  DENSITY_ALT: 'pa + 120 * (oat - isa)',

  // 4. Absolute Temperature (Kelvin)
  //    vars: oat (°C)
  ABS_TEMP: '273 + oat',

  // 5. All Up Weight (lb)
  //    ac_weight is already lb; others are kg/litres → converted here
  //    vars: ac_weight (lb), crew (kg), fuel (L), add_load (kg), load (kg)
  AUW: 'ac_weight + (crew * 2.2) + (fuel * 0.775 * 2.2) + (add_load * 2.2) + (load * 2.2)',

  // 6. Power Available (dimensionless, 0..1) — capped at 1.0
  //    vars: density_alt (ft)
  POWER_AVAIL: 'Math.min(1.0, ((density_alt / 660) * 0.01) + 0.75)',

  // 7. Power Required (dimensionless, hover power fraction)
  //    vars: auw (lb), qnh (mb), abs_temp (K)
  POWER_REQ: '(auw / 6600) * (1013 / qnh) * (abs_temp / 288)',
};

export const FORMULA_META = [
  { key: 'PA', label: 'Pressure Altitude (ft)', vars: 'elevation, qnh' },
  { key: 'ISA_TEMP', label: 'ISA Temperature (°C)', vars: 'elevation' },
  { key: 'DENSITY_ALT', label: 'Density Altitude (ft)', vars: 'pa, oat, isa' },
  { key: 'ABS_TEMP', label: 'Absolute Temperature (K)', vars: 'oat' },
  { key: 'AUW', label: 'All Up Weight (lb)', vars: 'ac_weight, crew, fuel, add_load, load' },
  { key: 'POWER_AVAIL', label: 'Power Available (0..1)', vars: 'density_alt' },
  { key: 'POWER_REQ', label: 'Power Required (0..1)', vars: 'auw, qnh, abs_temp' },
];

/* ---------------- CALC ENGINE ---------------- */
const safeEval = (expr, ctx) => {
  try {
    const keys = Object.keys(ctx);
    const vals = Object.values(ctx);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict"; return (${expr});`);
    const result = fn(...vals);
    if (typeof result !== 'number' || !isFinite(result)) return 0;
    return result;
  } catch {
    return 0;
  }
};

const round = (n, p = 2) => Math.round(n * Math.pow(10, p)) / Math.pow(10, p);

export const computePerformance = (inputs, formulas = DEFAULT_FORMULAS) => {
  const { aircraft } = inputs;

  const baseCtx = {
    elevation: Number(inputs.elevation) || 0,
    qnh: Number(inputs.qnh) || 1013,
    oat: Number(inputs.temperature) || 15,
    ac_weight: Number(inputs.acWeight) || aircraft.emptyWeight, // lb
    crew: Number(inputs.crewWeight) || 0,                        // kg
    fuel: Number(inputs.fuel) || 0,                              // litres
    load: Number(inputs.payload) || 0,                           // kg
    add_load: Number(inputs.additionalLoad) || 0,                // kg
    mauw: aircraft.mauw,                                         // lb
  };

  const PA = safeEval(formulas.PA, baseCtx);
  const ISA_TEMP = safeEval(formulas.ISA_TEMP, { ...baseCtx, pa: PA });
  const DENSITY_ALT = safeEval(formulas.DENSITY_ALT, {
    ...baseCtx, pa: PA, isa: ISA_TEMP,
  });
  const ABS_TEMP = safeEval(formulas.ABS_TEMP, baseCtx);
  const AUW = safeEval(formulas.AUW, baseCtx);
  const POWER_AVAIL = safeEval(formulas.POWER_AVAIL, {
    ...baseCtx, density_alt: DENSITY_ALT, auw: AUW, abs_temp: ABS_TEMP,
  });
  const POWER_REQ = safeEval(formulas.POWER_REQ, {
    ...baseCtx, density_alt: DENSITY_ALT, auw: AUW, abs_temp: ABS_TEMP,
  });

  // Power balance as percentage (both fractions, 0..1)
  const POWER_BALANCE_PCT = POWER_AVAIL > 0
    ? Math.round(((POWER_AVAIL - POWER_REQ) / POWER_AVAIL) * 100)
    : 0;

  const AUW_MARGIN = aircraft.mauw - AUW;           // lb
  const powerHeadroomFactor = POWER_REQ > 0
    ? Math.max(0, (POWER_AVAIL - POWER_REQ) / POWER_REQ)
    : 0;
  const PAYLOAD_MARGIN = Math.round(
    Math.min(Math.max(AUW_MARGIN, 0), AUW * powerHeadroomFactor)
  );                                                 // lb

  /* ------------ Fit-to-Fly (0.01 precision) ------------ */
  const reasons = [];
  if (AUW - aircraft.mauw > 0.01) {
    reasons.push(`AUW ${AUW.toFixed(2)} lb exceeds MAUW ${aircraft.mauw} lb`);
  }
  if (POWER_REQ - POWER_AVAIL > 0.01) {
    reasons.push(
      `Power Required ${POWER_REQ.toFixed(3)} > Power Available ${POWER_AVAIL.toFixed(3)} (hover factor)`
    );
  }
  if (DENSITY_ALT > 18000) {
    reasons.push(`Density Altitude ${Math.round(DENSITY_ALT)} ft above service ceiling`);
  }

  return {
    PA: round(PA),
    ISA_TEMP: round(ISA_TEMP),
    DENSITY_ALT: round(DENSITY_ALT),
    ABS_TEMP: round(ABS_TEMP),
    AUW: round(AUW),
    POWER_AVAIL: round(POWER_AVAIL, 3),
    POWER_REQ: round(POWER_REQ, 3),
    POWER_BALANCE_PCT,
    AUW_MARGIN: round(AUW_MARGIN),
    PAYLOAD_MARGIN,
    status: reasons.length === 0 ? 'FIT' : 'NOT_FIT',
    reasons,
  };
};

/* ---------------- AUW vs ALTITUDE CURVE ---------------- */
/**
 * For each density altitude (0..20 kft), find the maximum AUW (lb) such that
 * Power_Req == Power_Avail at standard QNH=1013, assuming ISA temperature.
 *
 *   Power_Avail(DA)   = min(1, (DA/660)*0.01 + 0.75)
 *   Power_Req(AUW,DA) = (AUW/6600) * (1013/1013) * (abs_temp/288)
 *                     = (AUW/6600) * ((288 - DA/500) / 288)
 *
 *   Solve: AUW = Power_Avail × 6600 × 288 / (288 − DA/500)
 */
export const buildAUWvsAltitudeCurve = (aircraft, formulas = DEFAULT_FORMULAS) => {
  const points = [];
  for (let altK = 0; altK <= 20; altK += 1) {
    const da = altK * 1000;
    const pAvail = safeEval(formulas.POWER_AVAIL, { density_alt: da });
    const isa = 15 - (altK * 2);          // °C at altitude
    const absTemp = 273 + isa;            // K
    const powerReqCoeff = (1 / 6600) * (absTemp / 288);
    const maxAUW = powerReqCoeff > 0 ? pAvail / powerReqCoeff : aircraft.mauw;
    const capped = Math.min(maxAUW, aircraft.mauw * 1.05);
    points.push({ x: altK, y: Math.max(1200, Math.round(capped)) });
  }
  return points;
};
