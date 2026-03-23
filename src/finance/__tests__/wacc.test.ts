import { describe, expect, it } from "vitest"

import { weightedAverageCostOfCapital } from "@/finance/wacc"

describe("weightedAverageCostOfCapital", () => {
  it("matches textbook formula", () => {
    const r = weightedAverageCostOfCapital({
      marketValueEquity: 60,
      marketValueDebt: 40,
      costOfEquity: 0.1,
      costOfDebtPreTax: 0.05,
      taxRate: 0.25,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.weightEquity).toBeCloseTo(0.6, 8)
    expect(r.weightDebt).toBeCloseTo(0.4, 8)
    expect(r.afterTaxCostOfDebt).toBeCloseTo(0.0375, 8)
    expect(r.wacc).toBeCloseTo(0.06 + 0.015, 8)
  })

  it("rejects non-positive capital", () => {
    expect(
      weightedAverageCostOfCapital({
        marketValueEquity: 0,
        marketValueDebt: 0,
        costOfEquity: 0.1,
        costOfDebtPreTax: 0.05,
        taxRate: 0.2,
      }).ok,
    ).toBe(false)
  })
})
