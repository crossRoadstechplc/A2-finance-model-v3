import { describe, expect, it } from "vitest"

import { nearlyEqual } from "@/finance/math"
import { sinkingFundPayment } from "@/finance/sinkingFund"

describe("sinkingFundPayment", () => {
  it("accumulates to target FV with r>0", () => {
    const r = sinkingFundPayment({
      targetFutureValue: 1000,
      periodRate: 0.01,
      numPeriods: 12,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    let acc = 0
    for (let i = 0; i < 12; i++) {
      acc = acc * 1.01 + r.paymentPerPeriod
    }
    expect(nearlyEqual(acc, 1000, 1e-4)).toBe(true)
  })

  it("zero rate spreads evenly", () => {
    const r = sinkingFundPayment({
      targetFutureValue: 100,
      periodRate: 0,
      numPeriods: 5,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.paymentPerPeriod).toBe(20)
  })

  it("rejects bad inputs", () => {
    expect(
      sinkingFundPayment({
        targetFutureValue: 1,
        periodRate: 0.01,
        numPeriods: 0,
      }).ok,
    ).toBe(false)
  })
})
