import { usdToForeign } from "@/finance/currency"

import type { SelectorDisplayContext } from "@/selectors/context"

export type DisplayAmount = {
  /** Value shown in tables/charts (display currency units when FX valid). */
  display: number
  /** Engine/model numeraire (USD). */
  usd: number
}

/**
 * Convert a USD numeraire amount to display currency. Falls back to USD when FX is invalid.
 */
export function convertUsdForDisplay(
  amountUsd: number,
  ctx: SelectorDisplayContext,
): DisplayAmount {
  const usd = amountUsd
  if (!Number.isFinite(amountUsd)) {
    return { display: Number.NaN, usd }
  }
  if (
    !Number.isFinite(ctx.usdPerUnitDisplay) ||
    ctx.usdPerUnitDisplay <= 0 ||
    ctx.usedUsdFallback
  ) {
    return { display: amountUsd, usd }
  }
  const r = usdToForeign(amountUsd, ctx.usdPerUnitDisplay)
  return {
    display: Number.isFinite(r.amountForeign) ? r.amountForeign : amountUsd,
    usd,
  }
}

/**
 * Format a display amount for UI. Pure aside from `Intl` (no mutation of inputs).
 */
export function formatDisplayNumber(
  value: number,
  ctx: SelectorDisplayContext,
): string {
  if (!Number.isFinite(value)) {
    return "—"
  }
  const opts: Intl.NumberFormatOptions =
    ctx.numberFormat === "compact"
      ? { notation: "compact", maximumFractionDigits: 2 }
      : { maximumFractionDigits: 0 }
  return new Intl.NumberFormat(ctx.locale, opts).format(value)
}
