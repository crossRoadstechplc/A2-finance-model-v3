import { clamp } from "@/finance/math"

export type ReservePeriodInput = {
  openingBalance: number
  contributions: number
  releases: number
  /** If true, floor closing balance at 0 */
  floorAtZero?: boolean
}

export type ReservePeriodResult = {
  openingBalance: number
  contributions: number
  releases: number
  closingBalance: number
}

/**
 * Reserve ledger: closing = opening + contributions − releases.
 */
export function reservePeriodRollForward(
  input: ReservePeriodInput,
): ReservePeriodResult {
  const { openingBalance, contributions, releases, floorAtZero } = input
  if (
    !Number.isFinite(openingBalance) ||
    !Number.isFinite(contributions) ||
    !Number.isFinite(releases)
  ) {
    return {
      openingBalance,
      contributions,
      releases,
      closingBalance: Number.NaN,
    }
  }
  let closing = openingBalance + contributions - releases
  if (floorAtZero) {
    closing = clamp(closing, 0, Number.POSITIVE_INFINITY)
  }
  return {
    openingBalance,
    contributions,
    releases,
    closingBalance: closing,
  }
}

export type ReserveScheduleInput = {
  openingBalance: number
  contributionsByPeriod: readonly number[]
  releasesByPeriod: readonly number[]
  floorAtZero?: boolean
}

export type ReserveScheduleResult =
  | {
      ok: true
      periods: ReservePeriodResult[]
    }
  | { ok: false; error: string }

export function reserveSchedule(input: ReserveScheduleInput): ReserveScheduleResult {
  const { contributionsByPeriod, releasesByPeriod, floorAtZero } = input
  if (contributionsByPeriod.length !== releasesByPeriod.length) {
    return { ok: false, error: "contributions and releases arrays must match length" }
  }
  if (contributionsByPeriod.length === 0) {
    return { ok: false, error: "empty schedule" }
  }
  const periods: ReservePeriodResult[] = []
  let opening = input.openingBalance
  for (let i = 0; i < contributionsByPeriod.length; i++) {
    const row = reservePeriodRollForward({
      openingBalance: opening,
      contributions: contributionsByPeriod[i]!,
      releases: releasesByPeriod[i]!,
      floorAtZero,
    })
    periods.push(row)
    opening = row.closingBalance
  }
  return { ok: true, periods }
}
