import { describe, expect, it } from "vitest"

import {
  afterTaxCashFlowSimple,
  depreciationTaxShield,
  incomeTaxSimple,
} from "@/finance/tax"

describe("incomeTaxSimple", () => {
  it("applies rate to positive taxable income", () => {
    const r = incomeTaxSimple({ taxableIncome: 1000, taxRate: 0.25 })
    expect(r.taxExpense).toBe(250)
    expect(r.afterTaxIncome).toBe(750)
    expect(r.effectiveRate).toBeCloseTo(0.25, 8)
  })

  it("no tax on losses", () => {
    const r = incomeTaxSimple({ taxableIncome: -500, taxRate: 0.25 })
    expect(r.taxExpense).toBe(0)
    expect(r.afterTaxIncome).toBe(-500)
  })

  it("clamps tax rate to [0,1]", () => {
    const r = incomeTaxSimple({ taxableIncome: 100, taxRate: 2 })
    expect(r.taxExpense).toBe(100)
  })
})

describe("depreciationTaxShield", () => {
  it("returns D × Tc", () => {
    expect(
      depreciationTaxShield({ depreciationExpense: 200, taxRate: 0.2 }).taxShield,
    ).toBe(40)
  })
})

describe("afterTaxCashFlowSimple", () => {
  it("mirrors income tax on cash margin", () => {
    const r = afterTaxCashFlowSimple({ preTaxCashFlow: 100, taxRate: 0.3 })
    expect(r.afterTaxCashFlow).toBe(70)
  })
})
