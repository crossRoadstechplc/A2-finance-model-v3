import { describe, expect, it, vi } from "vitest"

import { buildTwoWaySensitivityGrid } from "@/sensitivity/twoWay"
import { stubEngineForSensitivity } from "@/sensitivity/__tests__/stubEngineOutput"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"

describe("two-way sensitivity grid", () => {
  it("produces 5×5 labels matching row/col parameters", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    const impl = vi.fn(() => stubEngineForSensitivity({ equityNpv: 42 }))
    const g = buildTwoWaySensitivityGrid(snap, { runEngineImpl: impl })

    expect(g.rowParamId).toBe("fleet_vehicleCount")
    expect(g.colParamId).toBe("system_discountRatePercent")
    expect(g.rowLabels).toHaveLength(5)
    expect(g.colLabels).toHaveLength(5)
    expect(g.cells).toHaveLength(5)
    expect(g.cells.every((row) => row.length === 5)).toBe(true)
    expect(g.colLabels.every((l) => l.endsWith("%"))).toBe(true)
    expect(impl).toHaveBeenCalledTimes(25)
  })
})
