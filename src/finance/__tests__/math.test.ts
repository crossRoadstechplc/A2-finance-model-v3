import { describe, expect, it } from "vitest"

import {
  annualToPeriodRateEffective,
  annualToPeriodRateSimple,
  clamp,
  compoundFactor,
  nearlyEqual,
  ordinaryAnnuityFvFactor,
  ordinaryAnnuityPvFactor,
  presentValueEndOfPeriodFlows,
  safeDivide,
  sum,
} from "@/finance/math"

describe("math", () => {
  it("safeDivide returns fallback on zero denominator", () => {
    expect(safeDivide(10, 0, -1)).toBe(-1)
    expect(safeDivide(10, 0)).toBe(Number.NaN)
  })

  it("clamp respects bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it("sum skips non-finite values", () => {
    expect(sum([1, 2, Number.NaN])).toBe(3)
  })

  it("ordinaryAnnuityPvFactor: r=0 returns n", () => {
    expect(ordinaryAnnuityPvFactor(0, 5)).toBe(5)
  })

  it("ordinaryAnnuityPvFactor matches closed form for r>0", () => {
    const r = 0.01
    const n = 12
    const f = ordinaryAnnuityPvFactor(r, n)
    expect(nearlyEqual(f, (1 - Math.pow(1 + r, -n)) / r)).toBe(true)
  })

  it("ordinaryAnnuityFvFactor: r=0 returns n", () => {
    expect(ordinaryAnnuityFvFactor(0, 4)).toBe(4)
  })

  it("compoundFactor", () => {
    expect(compoundFactor(0.1, 2)).toBeCloseTo(1.21, 8)
  })

  it("annualToPeriodRateSimple divides nominal by periods per year", () => {
    expect(annualToPeriodRateSimple(0.12, 12)).toBeCloseTo(0.01, 12)
    expect(annualToPeriodRateSimple(0.12, 0)).toBe(Number.NaN)
  })

  it("annualToPeriodRateEffective compounds correctly", () => {
    const m = 12
    const ra = 0.12
    const rp = annualToPeriodRateEffective(ra, m)
    expect(Math.pow(1 + rp, m)).toBeCloseTo(1 + ra, 8)
  })

  it("presentValueEndOfPeriodFlows: first flow discounted one period", () => {
    const pv = presentValueEndOfPeriodFlows([100], 0.1)
    expect(pv).toBeCloseTo(100 / 1.1, 8)
    const pv2 = presentValueEndOfPeriodFlows([100, 100], 0)
    expect(pv2).toBe(200)
  })
})
