import { describe, expect, it } from "vitest"

import { presentValueEndOfPeriodFlows } from "@/finance/math"
import { projectLifeCoverageRatio } from "@/finance/plcr"

describe("projectLifeCoverageRatio", () => {
  it("uses longer CFADS window than loan-only case", () => {
    const r = 0.05
    const cfs = [40, 40, 40, 40, 40, 40]
    const pv = presentValueEndOfPeriodFlows(cfs, r)
    const res = projectLifeCoverageRatio({
      cfadsByProjectPeriod: cfs,
      periodDiscountRate: r,
      initialDebtOutstanding: 100,
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.pvCfads).toBeCloseTo(pv, 6)
    expect(res.plcr).toBeCloseTo(pv / 100, 6)
  })
})
