/**
 * Finance layer conventions (all APIs document their own units):
 *
 * - **Decimal rates**: `0.08` means 8% (not 8).
 * - **periodRate**: interest/discount rate for one model period (compounded once per period).
 * - **annualNominalRate**: nominal annual rate; convert with `annualToPeriodRateSimple` /
 *   `annualToPeriodRateEffective` from `./math` when periods per year are known.
 */

/** Money amounts stored in USD when using currency helpers (internal base). */
export type UsdAmount = number
