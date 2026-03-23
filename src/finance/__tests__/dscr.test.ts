import { describe, expect, it } from "vitest"

import {
  debtServiceCoverageRatio,
  debtServiceCoverageSchedule,
} from "@/finance/dscr"

describe("debtServiceCoverageRatio", () => {
  it("divides CFADS by debt service", () => {
    const r = debtServiceCoverageRatio({ cfads: 125, debtService: 100 })
    expect(r.dscr).toBeCloseTo(1.25, 8)
  })

  it("zero debt service yields +Infinity by convention", () => {
    const r = debtServiceCoverageRatio({ cfads: 10, debtService: 0 })
    expect(r.dscr).toBe(Number.POSITIVE_INFINITY)
  })
})

describe("debtServiceCoverageSchedule", () => {
  it("computes per-period DSCR", () => {
    const r = debtServiceCoverageSchedule({
      cfadsByPeriod: [100, 80],
      debtServiceByPeriod: [50, 100],
    })
    expect(r).toHaveProperty("periods")
    if (!("periods" in r)) return
    expect(r.periods[0]!.dscr).toBe(2)
    expect(r.periods[1]!.dscr).toBeCloseTo(0.8, 8)
    expect(r.minDscr).toBeCloseTo(0.8, 8)
  })
})
