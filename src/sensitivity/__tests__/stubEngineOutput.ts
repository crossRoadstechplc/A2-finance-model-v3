import type { EngineOutput } from "@/engine/types"

/** Minimal successful projection for `extractSensitivityMetrics` in unit tests. */
export function stubEngineForSensitivity(p: {
  equityNpv: number
  equityIrr?: number
  retailUsdPerKwh?: number
  minDscr?: number
}): EngineOutput {
  const retail = p.retailUsdPerKwh ?? 0.15
  return {
    version: 1,
    computedAt: "",
    projection: {
      status: "ok",
      periods: [],
      headlineNpv: 0,
      scenario: {
        pipeline: {
          pricing: { totalRetailUsdPerKwh: retail },
        },
      },
      model: {
        returnMetrics: {
          equityNpv: p.equityNpv,
          equityIrr: p.equityIrr ?? 0.12,
          unleveredNpv: p.equityNpv,
          unleveredIrr: 0.12,
          moicEquity: 1,
          moicUnlevered: 1,
        },
        coverage: {
          minDscr: p.minDscr ?? 1.4,
          dscrByPeriod: [],
          llcr: 1,
          plcr: 1,
        },
      },
    },
    engineSnapshot: { status: "ok", capturedAt: "", label: "stub" },
  } as unknown as EngineOutput
}
