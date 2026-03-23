import { presentValueEndOfPeriodFlows, safeDivide } from "@/finance/math"

export type PlcrInput = {
  /**
   * CFADS for each **project** period; index 0 = end of first operating period
   * (discounted with 1/(1+r)^1).
   */
  cfadsByProjectPeriod: readonly number[]
  periodDiscountRate: number
  initialDebtOutstanding: number
}

export type PlcrResult =
  | {
      ok: true
      plcr: number
      pvCfads: number
      initialDebtOutstanding: number
    }
  | { ok: false; error: string }

/**
 * Project Life Coverage Ratio: PV(CFADS over project life) / initial debt outstanding.
 */
export function projectLifeCoverageRatio(input: PlcrInput): PlcrResult {
  const { cfadsByProjectPeriod, periodDiscountRate, initialDebtOutstanding } =
    input
  if (
    !Number.isFinite(periodDiscountRate) ||
    !Number.isFinite(initialDebtOutstanding)
  ) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (initialDebtOutstanding <= 0) {
    return { ok: false, error: "initialDebtOutstanding must be positive" }
  }
  const pvCfads = presentValueEndOfPeriodFlows(
    cfadsByProjectPeriod,
    periodDiscountRate,
  )
  if (!Number.isFinite(pvCfads)) {
    return { ok: false, error: "Non-finite PV" }
  }
  return {
    ok: true,
    plcr: safeDivide(pvCfads, initialDebtOutstanding, Number.NaN),
    pvCfads,
    initialDebtOutstanding,
  }
}
