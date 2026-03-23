import type { EngineOutput } from "@/engine/types"

import { SENSITIVITY_DIESEL_BENCHMARK_USD_PER_KWH } from "@/sensitivity/constants"

export type SensitivityEngineMetrics = {
  equityNpv: number | null
  equityIrr: number | null
  unleveredNpv: number | null
  minDscr: number | null
  totalRetailUsdPerKwh: number | null
  /** totalRetail / diesel benchmark; ≤1 means at or below benchmark. */
  dieselParityRatio: number | null
}

export function extractSensitivityMetrics(
  output: EngineOutput,
): SensitivityEngineMetrics {
  if (output.projection.status !== "ok") {
    return {
      equityNpv: null,
      equityIrr: null,
      unleveredNpv: null,
      minDscr: null,
      totalRetailUsdPerKwh: null,
      dieselParityRatio: null,
    }
  }
  const m = output.projection.model
  const retail = output.projection.scenario.pipeline.pricing.totalRetailUsdPerKwh
  const bench = SENSITIVITY_DIESEL_BENCHMARK_USD_PER_KWH
  const ratio =
    Number.isFinite(retail) && bench > 0 ? retail / bench : null
  return {
    equityNpv: m?.returnMetrics.equityNpv ?? null,
    equityIrr: m?.returnMetrics.equityIrr ?? null,
    unleveredNpv: m?.returnMetrics.unleveredNpv ?? null,
    minDscr: m?.coverage.minDscr ?? null,
    totalRetailUsdPerKwh: Number.isFinite(retail) ? retail : null,
    dieselParityRatio: ratio !== null && Number.isFinite(ratio) ? ratio : null,
  }
}
