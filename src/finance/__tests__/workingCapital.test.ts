import { describe, expect, it } from "vitest"

import {
  netWorkingCapitalChange,
  netWorkingCapitalFromDays,
} from "@/finance/workingCapital"

describe("netWorkingCapitalChange", () => {
  it("cash impact is negative of delta NWC", () => {
    const r = netWorkingCapitalChange({ nwcPreviousPeriod: 10, nwcCurrentPeriod: 25 })
    expect(r.changeInNwc).toBe(15)
    expect(r.cashFlowImpact).toBe(-15)
  })
})

describe("netWorkingCapitalFromDays", () => {
  it("builds AR/AP from days ratios", () => {
    const r = netWorkingCapitalFromDays({
      revenueInPeriod: 3650,
      daysSalesOutstanding: 36.5,
      cogsInPeriod: 1825,
      daysPayableOutstanding: 18.25,
      daysInPeriod: 365,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.accountsReceivable).toBeCloseTo(365, 8)
    expect(r.accountsPayable).toBeCloseTo(91.25, 8)
    expect(r.netWorkingCapital).toBeCloseTo(365 - 91.25, 8)
  })

  it("rejects invalid daysInPeriod", () => {
    expect(
      netWorkingCapitalFromDays({
        revenueInPeriod: 1,
        daysSalesOutstanding: 1,
        cogsInPeriod: 1,
        daysPayableOutstanding: 1,
        daysInPeriod: 0,
      }).ok,
    ).toBe(false)
  })
})
