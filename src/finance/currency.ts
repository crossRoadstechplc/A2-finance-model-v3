/**
 * USD is the internal numeraire.
 *
 * `usdPerUnitForeign`: how many USD one unit of foreign currency buys
 * (e.g. 1 EUR → 1.10 USD ⇒ usdPerUnitForeign = 1.10).
 */

export type CurrencyConversionInput = {
  amount: number
  /** USD per 1 unit of the foreign currency */
  usdPerUnitForeign: number
}

export type CurrencyConversionResult = {
  amountUsd: number
  amountForeign: number
  usdPerUnitForeign: number
}

export function foreignToUsd(input: CurrencyConversionInput): CurrencyConversionResult {
  const { amount, usdPerUnitForeign } = input
  if (!Number.isFinite(amount) || !Number.isFinite(usdPerUnitForeign)) {
    return { amountUsd: Number.NaN, amountForeign: amount, usdPerUnitForeign }
  }
  if (usdPerUnitForeign < 0) {
    return { amountUsd: Number.NaN, amountForeign: amount, usdPerUnitForeign }
  }
  return {
    amountUsd: amount * usdPerUnitForeign,
    amountForeign: amount,
    usdPerUnitForeign,
  }
}

export function usdToForeign(
  amountUsd: number,
  usdPerUnitForeign: number,
): CurrencyConversionResult {
  if (
    !Number.isFinite(amountUsd) ||
    !Number.isFinite(usdPerUnitForeign) ||
    usdPerUnitForeign <= 0
  ) {
    return {
      amountUsd,
      amountForeign: Number.NaN,
      usdPerUnitForeign,
    }
  }
  return {
    amountUsd,
    amountForeign: amountUsd / usdPerUnitForeign,
    usdPerUnitForeign,
  }
}
