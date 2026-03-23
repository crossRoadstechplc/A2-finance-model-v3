import type { SettingsState } from "@/store/types"

export const SELECTOR_DISPLAY_CONTEXT_VERSION = 1 as const

/**
 * Display pipeline for selectors: internal amounts stay USD; UI uses `currencyCode` + FX.
 */
export type SelectorDisplayContext = {
  version: typeof SELECTOR_DISPLAY_CONTEXT_VERSION
  locale: string
  currencyCode: string
  /** USD per 1 unit of display currency (same convention as `finance/currency`). */
  usdPerUnitDisplay: number
  numberFormat: SettingsState["numberFormat"]
  /** When true, FX was invalid / unknown — amounts are still USD numerically. */
  usedUsdFallback: boolean
}

export type BuildSelectorDisplayContextOptions = {
  /** Override USD per 1 unit of display currency; when omitted, USD→1, unknown codes→NaN (fallback). */
  usdPerUnitDisplayOverride?: number
}

export function buildSelectorDisplayContext(
  settings: SettingsState,
  options?: BuildSelectorDisplayContextOptions,
): SelectorDisplayContext {
  const currencyCode = (settings.currency || "USD").toUpperCase()
  const override = options?.usdPerUnitDisplayOverride
  let usdPerUnitDisplay: number
  let usedUsdFallback = false

  if (override !== undefined && Number.isFinite(override) && override > 0) {
    usdPerUnitDisplay = override
  } else if (currencyCode === "USD") {
    usdPerUnitDisplay = 1
  } else if (
    Number.isFinite(settings.displayFxUsdPerUnit) &&
    settings.displayFxUsdPerUnit > 0
  ) {
    usdPerUnitDisplay = settings.displayFxUsdPerUnit
  } else {
    usdPerUnitDisplay = Number.NaN
    usedUsdFallback = true
  }

  return {
    version: SELECTOR_DISPLAY_CONTEXT_VERSION,
    locale: settings.locale,
    currencyCode,
    usdPerUnitDisplay,
    numberFormat: settings.numberFormat,
    usedUsdFallback,
  }
}
