import { describe, expect, it } from "vitest"

import { internalRateOfReturn } from "@/finance/irr"
import { netPresentValue } from "@/finance/npv"
import { nearlyEqual } from "@/finance/math"

describe("internalRateOfReturn", () => {
  it("solves two-period project", () => {
    const cfs = [-100, 230] as const
    const r = internalRateOfReturn(cfs)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.irr).toBeCloseTo(1.3, 4)
    const npv = netPresentValue({ periodRate: r.irr, cashFlows: cfs }).npv
    expect(nearlyEqual(npv, 0, 1e-5)).toBe(true)
  })

  it("returns no_sign_change when all flows same sign", () => {
    const r = internalRateOfReturn([100, 200, 300])
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe("no_sign_change")
  })

  it("handles empty flows", () => {
    const r = internalRateOfReturn([])
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe("empty_flows")
  })
})
