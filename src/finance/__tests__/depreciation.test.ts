import { describe, expect, it } from "vitest"

import { batteryDepreciationPerCycle, straightLineDepreciation } from "@/finance/depreciation"

describe("straightLineDepreciation", () => {
  it("allocates evenly and ends at salvage", () => {
    const r = straightLineDepreciation({
      cost: 1000,
      salvageValue: 100,
      lifePeriods: 3,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.depreciationPerPeriod).toBeCloseTo(300, 8)
    expect(r.schedule).toHaveLength(3)
    expect(r.schedule[2]!.endingBook).toBe(100)
    expect(r.totalDepreciation).toBe(900)
  })

  it("single period fully depreciates to salvage", () => {
    const r = straightLineDepreciation({
      cost: 500,
      salvageValue: 50,
      lifePeriods: 1,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.schedule[0]!.depreciation).toBe(450)
  })

  it("rejects life <= 0 or non-integer", () => {
    expect(
      straightLineDepreciation({ cost: 1, salvageValue: 0, lifePeriods: 0 }).ok,
    ).toBe(false)
    expect(
      straightLineDepreciation({ cost: 1, salvageValue: 0, lifePeriods: 2.5 }).ok,
    ).toBe(false)
  })

  it("rejects cost < salvage", () => {
    expect(
      straightLineDepreciation({ cost: 1, salvageValue: 2, lifePeriods: 2 }).ok,
    ).toBe(false)
  })
})

describe("batteryDepreciationPerCycle", () => {
  it("spreads (cost-salvage) over total cycles", () => {
    const r = batteryDepreciationPerCycle({
      cost: 1000,
      salvageValue: 0,
      totalCycles: 1000,
      cyclesPerPeriod: [100, 200, 300],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.depreciationPerCycle).toBe(1)
    expect(r.totalDepreciation).toBe(600)
  })

  it("caps at salvage and handles short horizon", () => {
    const r = batteryDepreciationPerCycle({
      cost: 100,
      salvageValue: 40,
      totalCycles: 10,
      cyclesPerPeriod: [10],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.depreciationPerCycle).toBe(6)
    expect(r.totalDepreciation).toBe(60)
    expect(r.schedule[0]!.remainingBook).toBe(40)
  })

  it("rejects negative cycles", () => {
    const r = batteryDepreciationPerCycle({
      cost: 1,
      salvageValue: 0,
      totalCycles: 1,
      cyclesPerPeriod: [-1],
    })
    expect(r.ok).toBe(false)
  })
})
