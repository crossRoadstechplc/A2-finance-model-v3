import { safeDivide } from "@/finance/math"

export type DscrPeriodInput = {
  /** Cash flow available for debt service (model-defined) */
  cfads: number
  /** Principal + interest due in the same period */
  debtService: number
}

export type DscrPeriodResult = {
  dscr: number
  cfads: number
  debtService: number
}

/**
 * Period DSCR = CFADS / debt service (decimal; 1.25x → 1.25).
 */
export function debtServiceCoverageRatio(
  input: DscrPeriodInput,
): DscrPeriodResult {
  const { cfads, debtService } = input
  return {
    cfads,
    debtService,
    dscr: safeDivide(cfads, debtService, Number.POSITIVE_INFINITY),
  }
}

export type DscrScheduleResult = {
  periods: (DscrPeriodResult & { period: number })[]
  /** Minimum finite DSCR across periods */
  minDscr: number
}

export function debtServiceCoverageSchedule(input: {
  cfadsByPeriod: readonly number[]
  debtServiceByPeriod: readonly number[]
}): DscrScheduleResult | { ok: false; error: string } {
  const { cfadsByPeriod, debtServiceByPeriod } = input
  if (cfadsByPeriod.length === 0) {
    return { ok: false, error: "empty schedule" }
  }
  if (cfadsByPeriod.length !== debtServiceByPeriod.length) {
    return { ok: false, error: "Array length mismatch" }
  }
  const periods = cfadsByPeriod.map((cfads, i) => ({
    period: i + 1,
    ...debtServiceCoverageRatio({
      cfads,
      debtService: debtServiceByPeriod[i]!,
    }),
  }))
  const finite = periods
    .map((p) => p.dscr)
    .filter((d) => Number.isFinite(d) && d !== Number.POSITIVE_INFINITY)
  const minDscr = finite.length ? Math.min(...finite) : Number.NaN
  return { periods, minDscr }
}
