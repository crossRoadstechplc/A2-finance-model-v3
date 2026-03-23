import { presentValueEndOfPeriodFlows, safeDivide } from "@/finance/math"

export type LlcrInput = {
  /**
   * CFADS for each **loan** period; index 0 = end of first period after draw
   * (discounted with 1/(1+r)^1).
   */
  cfadsByLoanPeriod: readonly number[]
  /** Discount rate matching loan period length (decimal per period) */
  periodDiscountRate: number
  /** Opening debt balance for the ratio (same units as PV of CFADS) */
  initialDebtOutstanding: number
}

export type LlcrResult =
  | {
      ok: true
      llcr: number
      pvCfads: number
      initialDebtOutstanding: number
    }
  | { ok: false; error: string }

/**
 * Loan Life Coverage Ratio: PV(CFADS over loan life) / initial debt outstanding.
 */
export function loanLifeCoverageRatio(input: LlcrInput): LlcrResult {
  const { cfadsByLoanPeriod, periodDiscountRate, initialDebtOutstanding } = input
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
    cfadsByLoanPeriod,
    periodDiscountRate,
  )
  if (!Number.isFinite(pvCfads)) {
    return { ok: false, error: "Non-finite PV" }
  }
  return {
    ok: true,
    llcr: safeDivide(pvCfads, initialDebtOutstanding, Number.NaN),
    pvCfads,
    initialDebtOutstanding,
  }
}
