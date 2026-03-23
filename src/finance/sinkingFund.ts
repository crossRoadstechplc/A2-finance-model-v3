import { ordinaryAnnuityFvFactor, safeDivide } from "@/finance/math"

export type SinkingFundPaymentInput = {
  /** Target balance at end of horizon (FV) */
  targetFutureValue: number
  /** Return / earnings rate per contribution period (decimal) */
  periodRate: number
  /** Number of end-of-period contributions */
  numPeriods: number
}

export type SinkingFundPaymentResult =
  | { ok: true; paymentPerPeriod: number; fvFactorUsed: number }
  | { ok: false; error: string }

/**
 * End-of-period contributions to reach FV: PMT = FV / (((1+r)^n - 1) / r).
 */
export function sinkingFundPayment(
  input: SinkingFundPaymentInput,
): SinkingFundPaymentResult {
  const { targetFutureValue, periodRate, numPeriods } = input
  if (
    !Number.isFinite(targetFutureValue) ||
    !Number.isFinite(periodRate) ||
    !Number.isFinite(numPeriods)
  ) {
    return { ok: false, error: "Non-finite inputs" }
  }
  if (targetFutureValue < 0) {
    return { ok: false, error: "targetFutureValue cannot be negative" }
  }
  if (numPeriods <= 0 || !Number.isInteger(numPeriods)) {
    return { ok: false, error: "numPeriods must be a positive integer" }
  }
  const fvFactor = ordinaryAnnuityFvFactor(periodRate, numPeriods)
  if (!Number.isFinite(fvFactor) || fvFactor === 0) {
    return { ok: false, error: "Invalid FV factor" }
  }
  return {
    ok: true,
    paymentPerPeriod: safeDivide(targetFutureValue, fvFactor, 0),
    fvFactorUsed: fvFactor,
  }
}
