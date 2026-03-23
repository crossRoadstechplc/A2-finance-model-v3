export type PaybackResult = {
  /** Period index (fractional) from t=0 when cumulative undiscounted CF crosses ≥ 0; null if never */
  undiscountedPaybackPeriod: number | null
  /** Same using discounted cumulative PV at `periodRate` */
  discountedPaybackPeriod: number | null
}

function fractionalCrossing(
  times: readonly number[],
  cumulatives: readonly number[],
): number | null {
  if (times.length === 0 || times.length !== cumulatives.length) return null
  let prevT = times[0]!
  let prevC = cumulatives[0]!
  if (prevC >= 0) return prevT
  for (let i = 1; i < times.length; i++) {
    const t = times[i]!
    const c = cumulatives[i]!
    if (c >= 0 && prevC < 0) {
      const frac = safeLinearCross(prevT, t, prevC, c)
      return frac
    }
    prevT = t
    prevC = c
  }
  return null
}

function safeLinearCross(
  t0: number,
  t1: number,
  c0: number,
  c1: number,
): number {
  const dc = c1 - c0
  if (Math.abs(dc) < 1e-15) return t1
  const w = (0 - c0) / dc
  return t0 + w * (t1 - t0)
}

/**
 * Cash flows indexed by period end: cf[0] at t=0, cf[1] at t=1, ...
 */
export function paybackPeriods(input: {
  cashFlows: readonly number[]
  periodRate: number
}): PaybackResult {
  const { cashFlows, periodRate } = input
  const times: number[] = []
  const undiscounted: number[] = []
  const discounted: number[] = []
  let cu = 0
  let cd = 0
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t]!
    const pv =
      Number.isFinite(cf) && Number.isFinite(periodRate)
        ? cf / Math.pow(1 + periodRate, t)
        : Number.NaN
    cu += Number.isFinite(cf) ? cf : 0
    cd += Number.isFinite(pv) ? pv : 0
    times.push(t)
    undiscounted.push(cu)
    discounted.push(cd)
  }
  return {
    undiscountedPaybackPeriod: fractionalCrossing(times, undiscounted),
    discountedPaybackPeriod: fractionalCrossing(times, discounted),
  }
}
