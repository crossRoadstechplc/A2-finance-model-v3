import { safeDivide } from "@/finance/math"

export type NetWorkingCapitalChangeInput = {
  nwcPreviousPeriod: number
  nwcCurrentPeriod: number
}

export type NetWorkingCapitalChangeResult = {
  /** ΔNWC = NWC_t - NWC_{t-1} */
  changeInNwc: number
  /**
   * Cash flow impact (same period convention as the model):
   * an increase in NWC is a use of cash → negative to FCF.
   */
  cashFlowImpact: number
}

export function netWorkingCapitalChange(
  input: NetWorkingCapitalChangeInput,
): NetWorkingCapitalChangeResult {
  const { nwcPreviousPeriod, nwcCurrentPeriod } = input
  if (!Number.isFinite(nwcPreviousPeriod) || !Number.isFinite(nwcCurrentPeriod)) {
    return {
      changeInNwc: Number.NaN,
      cashFlowImpact: Number.NaN,
    }
  }
  const changeInNwc = nwcCurrentPeriod - nwcPreviousPeriod
  return {
    changeInNwc,
    cashFlowImpact: -changeInNwc,
  }
}

export type NwcFromDaysInput = {
  revenueInPeriod: number
  daysSalesOutstanding: number
  cogsInPeriod: number
  daysPayableOutstanding: number
  /** Model period length in days (e.g. 365 for annual) */
  daysInPeriod: number
}

export type NwcFromDaysResult =
  | {
      ok: true
      accountsReceivable: number
      accountsPayable: number
      netWorkingCapital: number
    }
  | { ok: false; error: string }

/**
 * AR ≈ Revenue × DSO / daysInPeriod; AP ≈ COGS × DPO / daysInPeriod; NWC ≈ AR − AP (minimal).
 */
export function netWorkingCapitalFromDays(
  input: NwcFromDaysInput,
): NwcFromDaysResult {
  const {
    revenueInPeriod,
    daysSalesOutstanding,
    cogsInPeriod,
    daysPayableOutstanding,
    daysInPeriod,
  } = input
  if (daysInPeriod <= 0 || !Number.isFinite(daysInPeriod)) {
    return { ok: false, error: "daysInPeriod must be positive" }
  }
  if (
    !Number.isFinite(revenueInPeriod) ||
    !Number.isFinite(daysSalesOutstanding) ||
    !Number.isFinite(cogsInPeriod) ||
    !Number.isFinite(daysPayableOutstanding)
  ) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (
    daysSalesOutstanding < 0 ||
    daysPayableOutstanding < 0 ||
    revenueInPeriod < 0 ||
    cogsInPeriod < 0
  ) {
    return { ok: false, error: "Negative days or negative revenue/cogs not supported" }
  }
  const ar = revenueInPeriod * safeDivide(daysSalesOutstanding, daysInPeriod, 0)
  const ap = cogsInPeriod * safeDivide(daysPayableOutstanding, daysInPeriod, 0)
  return {
    ok: true,
    accountsReceivable: ar,
    accountsPayable: ap,
    netWorkingCapital: ar - ap,
  }
}
