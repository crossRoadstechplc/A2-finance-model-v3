import { describe, expect, it, vi } from "vitest"

import * as runCell from "@/sensitivity/runCell"
import { runTornadoAnalysis } from "@/sensitivity/tornado"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"

describe("tornado sensitivity", () => {
  it("sorts drivers by impact magnitude (largest first)", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    const seq = [
      1_000, // base
      900,
      1_100, // driver 0 impact 100
      1_000,
      500, // driver 1 impact 500
    ]
    let i = 0
    vi.spyOn(runCell, "runSensitivityCell").mockImplementation(() => {
      const equityNpv = seq[i] ?? 0
      i++
      return {
        metrics: {
          equityNpv,
          equityIrr: 0.1,
          unleveredNpv: equityNpv,
          minDscr: 1.2,
          totalRetailUsdPerKwh: 0.15,
          dieselParityRatio: 0.15 / 0.22,
        },
        warning: null,
      }
    })

    const { bars } = runTornadoAnalysis(snap, { maxDrivers: 2 })
    expect(bars).toHaveLength(2)
    expect(bars[0]!.impactMagnitude).toBeGreaterThanOrEqual(bars[1]!.impactMagnitude)
    expect(bars[0]!.driverId).toBe("system_discountRatePercent")
    expect(bars[1]!.driverId).toBe("fleet_vehicleCount")

    vi.restoreAllMocks()
  })
})
