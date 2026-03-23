/**
 * Shared numeric helpers — no implicit percent scaling (use decimals: 8% → 0.08).
 */

const EPS = 1e-9

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return Number.NaN
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

/** a / b with fallback when b is 0 or non-finite */
export function safeDivide(
  numerator: number,
  denominator: number,
  fallback: number = Number.NaN,
): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return Number.NaN
  }
  if (Math.abs(denominator) < EPS) {
    return fallback
  }
  return numerator / denominator
}

export function sum(values: readonly number[]): number {
  let s = 0
  for (const v of values) {
    if (Number.isFinite(v)) s += v
  }
  return s
}

/** (1+r)^n — r is period rate */
export function compoundFactor(periodRate: number, periods: number): number {
  return Math.pow(1 + periodRate, periods)
}

/**
 * PV factor for an ordinary annuity: (1 - (1+r)^-n) / r.
 * When r === 0, returns n (each $1 is worth $1 per period undiscounted).
 */
export function ordinaryAnnuityPvFactor(periodRate: number, periods: number): number {
  if (periods < 0 || !Number.isFinite(periods)) return Number.NaN
  if (periods === 0) return 0
  if (Math.abs(periodRate) < EPS) {
    return periods
  }
  return (1 - Math.pow(1 + periodRate, -periods)) / periodRate
}

/**
 * FV factor for end-of-period contributions: ((1+r)^n - 1) / r.
 * r === 0 → n.
 */
export function ordinaryAnnuityFvFactor(periodRate: number, periods: number): number {
  if (periods < 0 || !Number.isFinite(periods)) return Number.NaN
  if (periods === 0) return 0
  if (Math.abs(periodRate) < EPS) {
    return periods
  }
  return (compoundFactor(periodRate, periods) - 1) / periodRate
}

/** Simple (linear) annual → period rate: r_p = r_a / m */
export function annualToPeriodRateSimple(
  annualNominalRate: number,
  periodsPerYear: number,
): number {
  if (periodsPerYear <= 0 || !Number.isFinite(periodsPerYear)) return Number.NaN
  return annualNominalRate / periodsPerYear
}

/**
 * Effective period rate from nominal annual with m compounding periods per year:
 * r_p = (1 + r_a)^(1/m) - 1
 */
export function annualToPeriodRateEffective(
  annualNominalRate: number,
  periodsPerYear: number,
): number {
  if (periodsPerYear <= 0 || !Number.isFinite(periodsPerYear)) return Number.NaN
  return Math.pow(1 + annualNominalRate, 1 / periodsPerYear) - 1
}

export function nearlyEqual(a: number, b: number, tol: number = 1e-7): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return Math.abs(a - b) <= tol * (1 + Math.abs(a) + Math.abs(b))
}

/**
 * PV of flows occurring at **end** of periods 1…n: Σ c_i / (1+r)^i.
 * (Index 0 → discounted one period.)
 */
export function presentValueEndOfPeriodFlows(
  cashFlows: readonly number[],
  periodRate: number,
): number {
  let s = 0
  for (let i = 0; i < cashFlows.length; i++) {
    const cf = cashFlows[i]!
    if (!Number.isFinite(cf)) return Number.NaN
    s += cf / Math.pow(1 + periodRate, i + 1)
  }
  return s
}
