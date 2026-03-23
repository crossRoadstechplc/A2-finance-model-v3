import { describe, expect, it } from "vitest"

import { moicFromCashFlows, moicFromTotals } from "@/finance/moic"

describe("moicFromCashFlows", () => {
  it("computes inflows over |outflows|", () => {
    const r = moicFromCashFlows([-100, 50, 80])
    expect(r.totalOutflows).toBe(-100)
    expect(r.totalInflows).toBe(130)
    expect(r.moic).toBeCloseTo(1.3, 8)
  })

  it("returns NaN MOIC when no outflows", () => {
    const r = moicFromCashFlows([10, 20])
    expect(r.moic).toBe(Number.NaN)
  })
})

describe("moicFromTotals", () => {
  it("divides distributions by paid-in", () => {
    const r = moicFromTotals({
      cumulativePaidIn: 50,
      cumulativeDistributions: 125,
    })
    expect(r.moic).toBeCloseTo(2.5, 8)
  })
})
