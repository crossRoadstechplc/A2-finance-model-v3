import { safeDivide } from "@/finance/math"

export type MoicResult = {
  /** Sum of strictly positive cash flows */
  totalInflows: number
  /** Sum of strictly negative cash flows (negative number) */
  totalOutflows: number
  /** totalInflows / |totalOutflows| when outflows < 0 */
  moic: number
}

/**
 * Multiple on invested capital from a cash-flow series:
 * MOIC = (sum of inflows) / |sum of outflows| (outflows are negative CFs).
 */
export function moicFromCashFlows(cashFlows: readonly number[]): MoicResult {
  let inflows = 0
  let outflows = 0
  for (const cf of cashFlows) {
    if (!Number.isFinite(cf)) {
      return {
        totalInflows: Number.NaN,
        totalOutflows: Number.NaN,
        moic: Number.NaN,
      }
    }
    if (cf > 0) inflows += cf
    if (cf < 0) outflows += cf
  }
  const moic = safeDivide(inflows, Math.abs(outflows), Number.NaN)
  return {
    totalInflows: inflows,
    totalOutflows: outflows,
    moic,
  }
}

/** MOIC when you already know cumulative paid-in (positive number) and distributions (positive). */
export function moicFromTotals(params: {
  cumulativePaidIn: number
  cumulativeDistributions: number
}): MoicResult {
  const { cumulativePaidIn, cumulativeDistributions } = params
  if (!Number.isFinite(cumulativePaidIn) || !Number.isFinite(cumulativeDistributions)) {
    return {
      totalInflows: Number.NaN,
      totalOutflows: Number.NaN,
      moic: Number.NaN,
    }
  }
  if (cumulativePaidIn <= 0) {
    return {
      totalInflows: cumulativeDistributions,
      totalOutflows: -cumulativePaidIn,
      moic: Number.NaN,
    }
  }
  return {
    totalInflows: cumulativeDistributions,
    totalOutflows: -cumulativePaidIn,
    moic: safeDivide(cumulativeDistributions, cumulativePaidIn, Number.NaN),
  }
}
