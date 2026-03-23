import { describe, expect, it } from "vitest"

import { buildDebtSchedule } from "@/finance/debtSchedule"
import { nearlyEqual } from "@/finance/math"

describe("buildDebtSchedule", () => {
  it("amortizes to zero with positive rate", () => {
    const r = buildDebtSchedule({
      initialPrincipal: 120_000,
      periodInterestRate: 0.01,
      numPeriods: 12,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const last = r.rows[r.rows.length - 1]!
    expect(nearlyEqual(last.endingBalance, 0, 1e-4)).toBe(true)
    let bal = 120_000
    for (const row of r.rows) {
      expect(row.beginningBalance).toBeCloseTo(bal, 4)
      bal = row.endingBalance
    }
    expect(
      nearlyEqual(
        r.totalPrincipalPaid,
        120_000,
        1e-2,
      ),
    ).toBe(true)
  })

  it("zero rate is straight-line principal", () => {
    const r = buildDebtSchedule({
      initialPrincipal: 1000,
      periodInterestRate: 0,
      numPeriods: 4,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.payment).toBe(250)
    expect(r.totalInterest).toBe(0)
    for (const row of r.rows) {
      expect(row.interestPortion).toBe(0)
      expect(row.principalPortion).toBe(250)
    }
  })

  it("single period pays principal + interest", () => {
    const r = buildDebtSchedule({
      initialPrincipal: 100,
      periodInterestRate: 0.05,
      numPeriods: 1,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.rows[0]!.interestPortion).toBeCloseTo(5, 8)
    expect(r.rows[0]!.principalPortion).toBeCloseTo(100, 8)
  })

  it("rejects invalid inputs", () => {
    expect(
      buildDebtSchedule({
        initialPrincipal: -1,
        periodInterestRate: 0.01,
        numPeriods: 5,
      }).ok,
    ).toBe(false)
    expect(
      buildDebtSchedule({
        initialPrincipal: 100,
        periodInterestRate: 0.01,
        numPeriods: 0,
      }).ok,
    ).toBe(false)
  })
})
