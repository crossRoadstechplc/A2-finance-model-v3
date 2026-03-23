import { clamp, safeDivide } from "@/finance/math"

export type WaccInput = {
  /** Market value of equity */
  marketValueEquity: number
  /** Market value of debt (net of cash optional — caller’s definition) */
  marketValueDebt: number
  /** Cost of equity, decimal per year (Re) */
  costOfEquity: number
  /** Pre-tax cost of debt, decimal per year (Rd) */
  costOfDebtPreTax: number
  /** Corporate income tax rate (Tc), decimal */
  taxRate: number
}

export type WaccResult =
  | {
      ok: true
      wacc: number
      weightEquity: number
      weightDebt: number
      afterTaxCostOfDebt: number
      totalValue: number
    }
  | { ok: false; error: string }

/**
 * WACC = (E/V)·Re + (D/V)·Rd·(1−Tc). Weights from market values.
 */
export function weightedAverageCostOfCapital(input: WaccInput): WaccResult {
  const {
    marketValueEquity,
    marketValueDebt,
    costOfEquity,
    costOfDebtPreTax,
    taxRate,
  } = input
  if (
    !Number.isFinite(marketValueEquity) ||
    !Number.isFinite(marketValueDebt) ||
    !Number.isFinite(costOfEquity) ||
    !Number.isFinite(costOfDebtPreTax) ||
    !Number.isFinite(taxRate)
  ) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (marketValueEquity < 0 || marketValueDebt < 0) {
    return { ok: false, error: "Market values cannot be negative" }
  }
  const v = marketValueEquity + marketValueDebt
  if (v <= 0) {
    return { ok: false, error: "Total capital (E+D) must be positive" }
  }
  const tc = clamp(taxRate, 0, 1)
  const we = safeDivide(marketValueEquity, v, 0)
  const wd = safeDivide(marketValueDebt, v, 0)
  const rdAfter = costOfDebtPreTax * (1 - tc)
  const wacc = we * costOfEquity + wd * rdAfter
  return {
    ok: true,
    wacc,
    weightEquity: we,
    weightDebt: wd,
    afterTaxCostOfDebt: rdAfter,
    totalValue: v,
  }
}
