// ── Unit conversion ───────────────────────────────────────

export function mmToMil(mm) {
  return mm * 39.3701;
}

export function milToMm(mil) {
  return mil / 39.3701;
}

// 1 oz (copper foil) = 1.378 mil (IPC approximation)
export function ozToMil(oz) {
  return oz * 1.378;
}

// ── Microstrip (IPC-2141A) ────────────────────────────────
//
//        ┌──────── W ────────┐
//  ──────┼───────────────────┼──────   ← conductor (thickness T)
//        │                   │
//        └────── dielectric H ───┘
//  ════════════════════════════════    ← reference GND plane
//
// Z0 = 87/√(er+1.41) × ln( 5.98·H / (0.8·W + T) )
// Valid range: 0.1 ≤ W/H ≤ 3.0,  1 ≤ er ≤ 15

/**
 * @param {{ W: number, H: number, T: number, er: number }} params
 *   W  – trace width (mil)
 *   H  – dielectric thickness (mil)
 *   T  – copper thickness (mil)
 *   er – relative dielectric constant
 * @returns {{ Z0: number, eEff: number, tpd: number,
 *             isValidRange: boolean, formulaName: string }}
 */
export function calcMicrostrip({ W, H, T, er }) {
  const Z0 = (87 / Math.sqrt(er + 1.41))
    * Math.log(5.98 * H / (0.8 * W + T));

  // Hammerstad approximation
  const eEff = (er + 1) / 2
    + (er - 1) / 2 * (1 / Math.sqrt(1 + 12 * H / W));

  const tpd = 85 * Math.sqrt(eEff); // ps/inch

  const ratio = W / H;
  const isValidRange = ratio >= 0.1 && ratio <= 3.0
    && er >= 1 && er <= 15;

  return {
    Z0,
    eEff,
    tpd,
    isValidRange,
    formulaName: "IPC-2141A (Microstrip)",
  };
}

// ── Symmetric Stripline (IPC-2141A) ─────────────────────
//
//  ════════════════════════════════    ← GND plane
//        │                   │
//        └────── B/2 ────────┘
//  ──────┼───────────────────┼──────   ← conductor (thickness T), centered
//        ┌────── B/2 ────────┐
//        │                   │
//  ════════════════════════════════    ← GND plane
//
// Z0 = 60/√er × ln( 4·B / (π·(0.8·W + T)) )
// Valid range: W/B < 0.35,  T/B < 0.25

/**
 * @param {{ W: number, B: number, T: number, er: number }} params
 *   W  – trace width (mil)
 *   B  – total dielectric thickness (mil), distance between GND planes
 *   T  – copper thickness (mil)
 *   er – relative dielectric constant
 * @returns {{ Z0: number, eEff: number, tpd: number,
 *             isValidRange: boolean, formulaName: string }}
 */
export function calcStripline({ W, B, T, er }) {
  const Z0 = (60 / Math.sqrt(er))
    * Math.log(4 * B / (Math.PI * (0.8 * W + T)));

  // Symmetric stripline has uniform dielectric → eEff = er
  const eEff = er;

  const tpd = 85 * Math.sqrt(eEff); // ps/inch

  const isValidRange = (W / B) < 0.35 && (T / B) < 0.25;

  return {
    Z0,
    eEff,
    tpd,
    isValidRange,
    formulaName: "IPC-2141A (Symmetric Stripline)",
  };
}

// ── Verification cases (expected results) ────────────────
//
// [Microstrip] W=10mil, H=5mil, T=1.4mil, er=4.3
//   87 / sqrt(4.3 + 1.41)  = 87 / sqrt(5.71)  = 87 / 2.3896 ≈ 36.41
//   ln(5.98×5 / (0.8×10 + 1.4)) = ln(29.9 / 9.4) = ln(3.181) ≈ 1.157
//   Z0  ≈ 36.41 × 1.157 ≈ 42.1 Ω
//   eEff = 2.65 + 1.65 × (1/√7) ≈ 3.27
//   tpd  = 85 × √3.27          ≈ 153.8 ps/inch
//   W/H  = 2.0  → isValidRange: true
//
// [Stripline] W=8mil, B=20mil, T=1.4mil, er=4.3
//   60 / sqrt(4.3)               = 60 / 2.074  ≈ 28.94
//   ln(4×20 / (π×(0.8×8+1.4)))  = ln(80 / (π×7.8))
//                                = ln(80 / 24.50) = ln(3.265) ≈ 1.184
//   Z0  ≈ 28.94 × 1.184 ≈ 34.2 Ω
//   eEff = 4.3  (uniform dielectric)
//   tpd  = 85 × √4.3            ≈ 176.3 ps/inch
//   W/B  = 8/20 = 0.40 > 0.35  → isValidRange: false  (out of range warning)
