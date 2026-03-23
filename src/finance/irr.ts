import { netPresentValue } from "@/finance/npv"

export type IrrResult =
  | { ok: true; irr: number; iterations: number }
  | { ok: false; reason: "empty_flows" | "no_sign_change" | "did_not_converge" }

function npvAt(periodRate: number, cashFlows: readonly number[]): number {
  return netPresentValue({ periodRate, cashFlows }).npv
}

/**
 * IRR: period rate r such that NPV(r)=0 (same period spacing as cash flows).
 * Uses bisection on [low, high] when endpoint NPV signs differ.
 *
 * Default search: low = -0.9999, high = 10 (i.e. -99.99% to +1000% per period).
 */
export function internalRateOfReturn(
  cashFlows: readonly number[],
  options?: {
    low?: number
    high?: number
    tolerance?: number
    maxIterations?: number
  },
): IrrResult {
  if (cashFlows.length === 0) {
    return { ok: false, reason: "empty_flows" }
  }
  const low = options?.low ?? -0.9999
  const high = options?.high ?? 10
  const tolerance = options?.tolerance ?? 1e-7
  const maxIterations = options?.maxIterations ?? 100

  if (low >= high || !Number.isFinite(low) || !Number.isFinite(high)) {
    return { ok: false, reason: "did_not_converge" }
  }

  const fLow = npvAt(low, cashFlows)
  const fHigh = npvAt(high, cashFlows)
  if (!Number.isFinite(fLow) || !Number.isFinite(fHigh)) {
    return { ok: false, reason: "did_not_converge" }
  }

  if (fLow === 0) return { ok: true, irr: low, iterations: 0 }
  if (fHigh === 0) return { ok: true, irr: high, iterations: 0 }

  if (fLow * fHigh > 0) {
    return { ok: false, reason: "no_sign_change" }
  }

  let a = low
  let b = high
  let fa = fLow
  let mid = 0
  for (let i = 0; i < maxIterations; i++) {
    mid = (a + b) / 2
    const fm = npvAt(mid, cashFlows)
    if (!Number.isFinite(fm)) {
      return { ok: false, reason: "did_not_converge" }
    }
    if (Math.abs(fm) < tolerance) {
      return { ok: true, irr: mid, iterations: i + 1 }
    }
    if (fa * fm <= 0) {
      b = mid
    } else {
      a = mid
      fa = fm
    }
    if (Math.abs(b - a) < tolerance) {
      return { ok: true, irr: mid, iterations: i + 1 }
    }
  }
  return { ok: false, reason: "did_not_converge" }
}
