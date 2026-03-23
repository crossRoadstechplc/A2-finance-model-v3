import { describe, expect, it } from "vitest"

import { paybackPeriods } from "@/finance/payback"

describe("paybackPeriods", () => {
  it("undiscounted crosses at fractional period", () => {
    const r = paybackPeriods({
      cashFlows: [-100, 30, 80],
      periodRate: 0.1,
    })
    expect(r.undiscountedPaybackPeriod).toBeCloseTo(1 + 70 / 80, 6)
  })

  it("returns null when never recovers", () => {
    const r = paybackPeriods({
      cashFlows: [-100, -10, -5],
      periodRate: 0,
    })
    expect(r.undiscountedPaybackPeriod).toBeNull()
  })

  it("discounted payback is not earlier than undiscounted for positive rate", () => {
    const r = paybackPeriods({
      cashFlows: [-100, 120],
      periodRate: 0.1,
    })
    expect(r.discountedPaybackPeriod).not.toBeNull()
    expect(r.undiscountedPaybackPeriod).not.toBeNull()
    if (
      r.discountedPaybackPeriod !== null &&
      r.undiscountedPaybackPeriod !== null
    ) {
      expect(r.discountedPaybackPeriod).toBeGreaterThanOrEqual(
        r.undiscountedPaybackPeriod - 1e-6,
      )
    }
  })
})
