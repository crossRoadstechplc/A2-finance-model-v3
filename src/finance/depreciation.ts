import { safeDivide } from "@/finance/math"

export type StraightLineInput = {
  /** Capitalized cost (USD or model units) */
  cost: number
  salvageValue: number
  /** Number of depreciation periods (e.g. years) */
  lifePeriods: number
}

export type StraightLinePeriod = {
  periodIndex: number
  depreciation: number
  beginningBook: number
  endingBook: number
}

export type StraightLineResult =
  | {
      ok: true
      depreciationPerPeriod: number
      schedule: StraightLinePeriod[]
      totalDepreciation: number
    }
  | { ok: false; error: string }

/**
 * Straight-line over `lifePeriods`; first period starts at full cost.
 */
export function straightLineDepreciation(input: StraightLineInput): StraightLineResult {
  const { cost, salvageValue, lifePeriods } = input
  if (!Number.isFinite(cost) || !Number.isFinite(salvageValue) || !Number.isFinite(lifePeriods)) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (lifePeriods <= 0 || !Number.isInteger(lifePeriods)) {
    return { ok: false, error: "lifePeriods must be a positive integer" }
  }
  if (cost < salvageValue) {
    return { ok: false, error: "cost must be >= salvageValue" }
  }
  const depPer = safeDivide(cost - salvageValue, lifePeriods, 0)
  const schedule: StraightLinePeriod[] = []
  let book = cost
  for (let i = 0; i < lifePeriods; i++) {
    const beginningBook = book
    const isLast = i === lifePeriods - 1
    const depreciation = isLast
      ? beginningBook - salvageValue
      : Math.min(depPer, beginningBook - salvageValue)
    const endingBook = beginningBook - depreciation
    schedule.push({
      periodIndex: i + 1,
      depreciation,
      beginningBook,
      endingBook,
    })
    book = endingBook
  }
  const totalDepreciation = schedule.reduce((a, p) => a + p.depreciation, 0)
  return {
    ok: true,
    depreciationPerPeriod: depPer,
    schedule,
    totalDepreciation,
  }
}

export type BatteryDepreciationInput = {
  cost: number
  salvageValue: number
  /** Total charge/discharge cycles over economic life */
  totalCycles: number
  /** Cycles occurring in each model period (same length as `horizonPeriods`) */
  cyclesPerPeriod: readonly number[]
}

export type BatteryDepreciationPeriod = {
  periodIndex: number
  cyclesInPeriod: number
  depreciation: number
  cumulativeDepreciation: number
  remainingBook: number
}

export type BatteryDepreciationResult =
  | {
      ok: true
      depreciationPerCycle: number
      schedule: BatteryDepreciationPeriod[]
      totalDepreciation: number
    }
  | { ok: false; error: string }

/**
 * Per-cycle SL on (cost - salvage); period depreciation = depPerCycle × cycles in period.
 */
export function batteryDepreciationPerCycle(
  input: BatteryDepreciationInput,
): BatteryDepreciationResult {
  const { cost, salvageValue, totalCycles, cyclesPerPeriod } = input
  if (!Number.isFinite(cost) || !Number.isFinite(salvageValue) || !Number.isFinite(totalCycles)) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (totalCycles <= 0) {
    return { ok: false, error: "totalCycles must be positive" }
  }
  if (cost < salvageValue) {
    return { ok: false, error: "cost must be >= salvageValue" }
  }
  if (cyclesPerPeriod.length === 0) {
    return { ok: false, error: "cyclesPerPeriod must be non-empty" }
  }
  for (const c of cyclesPerPeriod) {
    if (!Number.isFinite(c) || c < 0) {
      return { ok: false, error: "cycles per period must be finite and non-negative" }
    }
  }
  const depPerCycle = safeDivide(cost - salvageValue, totalCycles, 0)
  const schedule: BatteryDepreciationPeriod[] = []
  let cumulative = 0
  let remainingBook = cost
  const maxDep = cost - salvageValue

  for (let i = 0; i < cyclesPerPeriod.length; i++) {
    const cyclesInPeriod = cyclesPerPeriod[i]!
    let depreciation = depPerCycle * cyclesInPeriod
    depreciation = Math.min(depreciation, maxDep - cumulative)
    if (depreciation < 0) depreciation = 0
    cumulative += depreciation
    remainingBook = cost - cumulative
    schedule.push({
      periodIndex: i + 1,
      cyclesInPeriod,
      depreciation,
      cumulativeDepreciation: cumulative,
      remainingBook,
    })
  }

  return {
    ok: true,
    depreciationPerCycle: depPerCycle,
    schedule,
    totalDepreciation: cumulative,
  }
}
