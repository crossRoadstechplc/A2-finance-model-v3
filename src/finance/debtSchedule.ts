import { nearlyEqual, safeDivide } from "@/finance/math"

export type DebtScheduleInput = {
  initialPrincipal: number
  /** Interest rate per payment period (decimal) */
  periodInterestRate: number
  /** Number of payment periods */
  numPeriods: number
}

export type DebtScheduleRow = {
  period: number
  beginningBalance: number
  drawdown?: number
  scheduledPayment: number
  interestPortion: number
  principalPortion: number
  endingBalance: number
}

export type DebtScheduleResult =
  | {
      ok: true
      payment: number
      rows: DebtScheduleRow[]
      totalInterest: number
      totalPrincipalPaid: number
    }
  | { ok: false; error: string }

/**
 * Fixed-payment amortization (ordinary annuity). `periodInterestRate` applies each period.
 * Zero rate → equal principal each period.
 */
export function buildDebtSchedule(input: DebtScheduleInput): DebtScheduleResult {
  const { initialPrincipal, periodInterestRate, numPeriods } = input
  if (
    !Number.isFinite(initialPrincipal) ||
    !Number.isFinite(periodInterestRate) ||
    !Number.isFinite(numPeriods)
  ) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (initialPrincipal < 0) {
    return { ok: false, error: "initialPrincipal cannot be negative" }
  }
  if (numPeriods <= 0 || !Number.isInteger(numPeriods)) {
    return { ok: false, error: "numPeriods must be a positive integer" }
  }

  const r = periodInterestRate
  let payment: number

  if (Math.abs(r) < 1e-15) {
    payment = safeDivide(initialPrincipal, numPeriods, 0)
  } else {
    const factor = Math.pow(1 + r, numPeriods)
    payment = (initialPrincipal * r * factor) / (factor - 1)
  }

  const rows: DebtScheduleRow[] = []
  let balance = initialPrincipal
  let totalInterest = 0
  let totalPrincipalPaid = 0

  for (let t = 1; t <= numPeriods; t++) {
    const beginningBalance = balance
    const interestPortion = beginningBalance * r
    let principalPortion: number
    if (t === numPeriods) {
      principalPortion = beginningBalance
    } else {
      principalPortion = payment - interestPortion
      if (principalPortion > beginningBalance) principalPortion = beginningBalance
      if (principalPortion < 0) principalPortion = 0
    }
    const scheduledPayment = interestPortion + principalPortion
    const endingBalance = Math.max(0, beginningBalance - principalPortion)
    totalInterest += interestPortion
    totalPrincipalPaid += principalPortion
    rows.push({
      period: t,
      beginningBalance,
      scheduledPayment,
      interestPortion,
      principalPortion,
      endingBalance,
    })
    balance = endingBalance
  }

  const last = rows[rows.length - 1]!
  if (!nearlyEqual(last!.endingBalance, 0, 1e-2) && last!.endingBalance > 1) {
    return { ok: false, error: "Schedule did not amortize to zero" }
  }

  return {
    ok: true,
    payment,
    rows,
    totalInterest,
    totalPrincipalPaid,
  }
}
