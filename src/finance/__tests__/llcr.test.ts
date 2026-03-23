import { describe, expect, it } from "vitest"

import { ordinaryAnnuityPvFactor } from "@/finance/math"
import { loanLifeCoverageRatio } from "@/finance/llcr"

describe("loanLifeCoverageRatio", () => {
  it("matches PV / debt for level CFADS", () => {
    const c = 50
    const n = 5
    const r = 0.08
    const expectedPv = c * ordinaryAnnuityPvFactor(r, n)
    const debt = 180
    const res = loanLifeCoverageRatio({
      cfadsByLoanPeriod: Array(n).fill(c),
      periodDiscountRate: r,
      initialDebtOutstanding: debt,
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.pvCfads).toBeCloseTo(expectedPv, 6)
    expect(res.llcr).toBeCloseTo(expectedPv / debt, 6)
  })

  it("rejects non-positive debt", () => {
    const res = loanLifeCoverageRatio({
      cfadsByLoanPeriod: [1],
      periodDiscountRate: 0.01,
      initialDebtOutstanding: 0,
    })
    expect(res.ok).toBe(false)
  })
})
