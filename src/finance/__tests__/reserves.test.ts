import { describe, expect, it } from "vitest"

import { reservePeriodRollForward, reserveSchedule } from "@/finance/reserves"

describe("reservePeriodRollForward", () => {
  it("rolls forward balances", () => {
    const r = reservePeriodRollForward({
      openingBalance: 100,
      contributions: 20,
      releases: 50,
    })
    expect(r.closingBalance).toBe(70)
  })

  it("floors at zero when requested", () => {
    const r = reservePeriodRollForward({
      openingBalance: 10,
      contributions: 0,
      releases: 50,
      floorAtZero: true,
    })
    expect(r.closingBalance).toBe(0)
  })
})

describe("reserveSchedule", () => {
  it("chains periods", () => {
    const r = reserveSchedule({
      openingBalance: 0,
      contributionsByPeriod: [10, 10],
      releasesByPeriod: [5, 15],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.periods[0]!.closingBalance).toBe(5)
    expect(r.periods[1]!.openingBalance).toBe(5)
    expect(r.periods[1]!.closingBalance).toBe(0)
  })
})
