import { clamp, safeDivide } from "@/finance/math"

export type IncomeTaxInput = {
  /** Pre-tax income (can be negative for loss) */
  taxableIncome: number
  /** Statutory rate as decimal (e.g. 0.21) */
  taxRate: number
}

export type IncomeTaxResult = {
  taxExpense: number
  afterTaxIncome: number
  /** Effective rate = tax / pre-tax when pre-tax ≠ 0 */
  effectiveRate: number
}

/**
 * Simple income tax: tax = max(taxable,0)*rate (no loss carryforward).
 */
export function incomeTaxSimple(input: IncomeTaxInput): IncomeTaxResult {
  const { taxableIncome, taxRate } = input
  if (!Number.isFinite(taxableIncome) || !Number.isFinite(taxRate)) {
    return {
      taxExpense: Number.NaN,
      afterTaxIncome: Number.NaN,
      effectiveRate: Number.NaN,
    }
  }
  const r = clamp(taxRate, 0, 1)
  const taxBase = Math.max(0, taxableIncome)
  const taxExpense = taxBase * r
  const afterTaxIncome = taxableIncome - taxExpense
  const effectiveRate = safeDivide(taxExpense, taxableIncome, 0)
  return { taxExpense, afterTaxIncome, effectiveRate }
}

export type DepreciationTaxShieldInput = {
  depreciationExpense: number
  taxRate: number
}

export type DepreciationTaxShieldResult = {
  taxShield: number
}

/** Tax shield from depreciation: D × Tc */
export function depreciationTaxShield(
  input: DepreciationTaxShieldInput,
): DepreciationTaxShieldResult {
  const { depreciationExpense, taxRate } = input
  if (!Number.isFinite(depreciationExpense) || !Number.isFinite(taxRate)) {
    return { taxShield: Number.NaN }
  }
  const r = clamp(taxRate, 0, 1)
  return { taxShield: Math.max(0, depreciationExpense) * r }
}

export type AfterTaxCashFlowInput = {
  /** Operating cash before tax on that margin (model-specific) */
  preTaxCashFlow: number
  taxRate: number
}

export type AfterTaxCashFlowResult = {
  afterTaxCashFlow: number
}

/**
 * Applies statutory rate to positive pre-tax only (same engine as incomeTaxSimple).
 */
export function afterTaxCashFlowSimple(
  input: AfterTaxCashFlowInput,
): AfterTaxCashFlowResult {
  const t = incomeTaxSimple({
    taxableIncome: input.preTaxCashFlow,
    taxRate: input.taxRate,
  })
  return { afterTaxCashFlow: t.afterTaxIncome }
}
