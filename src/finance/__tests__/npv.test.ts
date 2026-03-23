import { describe, expect, it } from "vitest"

import { netPresentValue } from "@/finance/npv"

describe("netPresentValue", () => {
  it("discounts future flows; t=0 undiscounted", () => {
    const r = netPresentValue({
      periodRate: 0.1,
      cashFlows: [-100, 110],
    })
    expect(r.presentValues[0]).toBe(-100)
    expect(r.presentValues[1]).toBeCloseTo(110 / 1.1, 8)
    expect(r.npv).toBeCloseTo(-100 + 110 / 1.1, 8)
  })

  it("zero rate sums cash flows", () => {
    const r = netPresentValue({ periodRate: 0, cashFlows: [1, 2, 3] })
    expect(r.npv).toBe(6)
  })

  it("empty flows yield 0", () => {
    const r = netPresentValue({ periodRate: 0.05, cashFlows: [] })
    expect(r.npv).toBe(0)
  })

  it("short horizon with negative rate convention still computes", () => {
    const r = netPresentValue({ periodRate: -0.5, cashFlows: [10, 10] })
    expect(Number.isFinite(r.npv)).toBe(true)
  })
})
