import { describe, expect, it } from "vitest"

import { foreignToUsd, usdToForeign } from "@/finance/currency"

describe("currency", () => {
  it("foreignToUsd multiplies by usdPerUnitForeign", () => {
    const r = foreignToUsd({ amount: 100, usdPerUnitForeign: 1.1 })
    expect(r.amountUsd).toBeCloseTo(110, 8)
    expect(r.amountForeign).toBe(100)
  })

  it("usdToForeign divides by rate", () => {
    const r = usdToForeign(110, 1.1)
    expect(r.amountForeign).toBeCloseTo(100, 8)
  })

  it("rejects negative FX for foreignToUsd", () => {
    const r = foreignToUsd({ amount: 1, usdPerUnitForeign: -1 })
    expect(r.amountUsd).toBe(Number.NaN)
  })

  it("rejects non-positive FX for usdToForeign", () => {
    expect(usdToForeign(10, 0).amountForeign).toBe(Number.NaN)
  })
})
