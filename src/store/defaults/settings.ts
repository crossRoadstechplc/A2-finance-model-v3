import type { SettingsState } from "@/store/types"

export const defaultSettings: SettingsState = {
  locale: "en",
  numberFormat: "standard",
  currency: "USD",
  fiscalYearStartMonth: 1,
  showDiagnostics: false,
  displayFxUsdPerUnit: 1,
  baseCalculationCurrency: "USD",
  exchangeRateEtbPerUsd: 130,
  exchangeRateDjfPerUsd: 177.72,
  exchangeRateEurPerUsd: 0.92,
  exchangeRateCnyPerUsd: 7.2,
  customCurrencyCode: "AED",
  customCurrencyName: "Custom currency",
  customCurrencyPerUsd: 3.67,
}
