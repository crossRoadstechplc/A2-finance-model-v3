/**
 * NPV at t=0 with optional explicit period-0 undiscounted cash flow.
 *
 * `periodRate` is the discount rate **per period** (same spacing as cash flows).
 * `cashFlows[0]` is usually period 0 (not discounted); `cashFlows[k]` discounted by (1+r)^k.
 */

export type NpvInput = {
  periodRate: number
  /** cashFlows[t] occurs at end of period t (t=0 undiscounted) */
  cashFlows: readonly number[]
}

export type NpvResult = {
  npv: number
  /** Per-period present values aligned with cashFlows indices */
  presentValues: number[]
}

export function netPresentValue(input: NpvInput): NpvResult {
  const { periodRate, cashFlows } = input
  const presentValues: number[] = []
  if (cashFlows.length === 0) {
    return { npv: 0, presentValues: [] }
  }
  let npv = 0
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t]!
    const df = Math.pow(1 + periodRate, -t)
    const pv = cf * df
    presentValues.push(pv)
    if (Number.isFinite(pv)) npv += pv
    else npv = Number.NaN
  }
  return { npv, presentValues }
}
