import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { getDefaultEcisDataState } from "@/store/defaults"
import { buildScenarioRunInput, runScenario } from "@/snapshot/runScenario"
import { selectScalingBand } from "@/snapshot/scalingBands"
import { SNAPSHOT_SCENARIO_VERSION } from "@/snapshot/types"

function baseInput() {
  const data = getDefaultEcisDataState()
  data.platform.corridorName = "A2 Test"
  return assumptionsToEngineInput(data)
}

describe("selectScalingBand", () => {
  it("selects the corridor scaling bands by truck count", () => {
    expect(selectScalingBand(0).id).toBe("1-75")
    expect(selectScalingBand(10).id).toBe("1-75")
    expect(selectScalingBand(75).id).toBe("1-75")
    expect(selectScalingBand(76).id).toBe("76-150")
    expect(selectScalingBand(150).id).toBe("76-150")
    expect(selectScalingBand(151).id).toBe("151-225")
    expect(selectScalingBand(5_500).id).toBe("5001-7500")
  })
})

describe("runScenario", () => {
  it("returns full pipeline and stable scenario version", () => {
    const engine = baseInput()
    const out = runScenario(buildScenarioRunInput(engine))
    expect(out.version).toBe(SNAPSHOT_SCENARIO_VERSION)
    expect(out.pipeline.demand.exogenousFleetVehicles).toBe(engine.fleet.vehicleCount)
    expect(out.pipeline.infrastructure.scalingBandId).toBeDefined()
    expect(out.pipeline.capex.totalCapexUsd).toBeGreaterThan(0)
    expect(out.pipeline.constraints.items).toEqual(out.constraints)
  })

  it("override precedence: non-null overrides replace band baselines", () => {
    const engine = baseInput()
    engine.fleet.vehicleCount = 50
    engine.snapshotModel.infrastructureOverrides = {
      stations: null,
      sockets: 3,
      bays: null,
    }
    const out = runScenario(buildScenarioRunInput(engine))
    expect(out.pipeline.infrastructure.sockets).toBe(3)
    expect(out.warnings.some((w) => w.code === "SNAPSHOT_INFRASTRUCTURE_OVERRIDE_ACTIVE")).toBe(
      true,
    )
    expect(out.warnings.every((w) => typeof w.code === "string")).toBe(true)
    expect(out.warnings.every((w) => w.severity === "info" || w.severity === "warn")).toBe(true)
  })

  it("detects charging socket throughput shortfall", () => {
    const engine = baseInput()
    engine.fleet.vehicleCount = 120
    engine.snapshotModel.fleetChargingShare = 1
    engine.snapshotModel.infrastructureOverrides = {
      stations: null,
      sockets: 1,
      bays: null,
    }
    engine.energy.chargeTimeMinutes = 420
    const out = runScenario(buildScenarioRunInput(engine))
    const c = out.pipeline.constraints.items.find(
      (x) => x.code === "CHARGING_SOCKET_THROUGHPUT_SHORTFALL",
    )
    expect(c).toBeDefined()
    expect(c?.binding).toBe(true)
    expect(c?.shortfall).toBeGreaterThan(0)
    expect(typeof c?.message).toBe("string")
  })

  it("detects swap bay throughput shortfall", () => {
    const engine = baseInput()
    engine.snapshotModel.fleetChargingShare = 0.1
    engine.fleet.vehicleCount = 200
    engine.snapshotModel.infrastructureOverrides = {
      stations: null,
      sockets: null,
      bays: 1,
    }
    engine.energy.swapTimeMinutes = 120
    const out = runScenario(buildScenarioRunInput(engine))
    const c = out.pipeline.constraints.items.find(
      (x) => x.code === "SWAP_BAY_THROUGHPUT_SHORTFALL",
    )
    expect(c).toBeDefined()
    expect(c?.binding).toBe(true)
  })

  it("price stack sums grid + A2 energy + A2 platform", () => {
    const engine = baseInput()
    engine.snapshotModel.gridPassThroughUsdPerKwh = 0.1
    engine.snapshotModel.a2EnergyUsdPerKwh = 0.02
    engine.snapshotModel.a2PlatformUsdPerKwh = 0.03
    const out = runScenario(buildScenarioRunInput(engine))
    expect(out.pipeline.pricing.totalRetailUsdPerKwh).toBeCloseTo(0.15, 10)
  })

  it("returns outputs when non-viable (constraints or negative cash)", () => {
    const engine = baseInput()
    engine.fleet.vehicleCount = 0
    const out = runScenario(buildScenarioRunInput(engine))
    expect(out.pipeline.viability.viable).toBe(false)
    expect(out.pipeline.entityFinancials).toBeDefined()
    expect(out.version).toBe(SNAPSHOT_SCENARIO_VERSION)
  })

  it("keeps stable warning / constraint object shapes", () => {
    const engine = baseInput()
    engine.snapshotModel.infrastructureOverrides = {
      stations: 99,
      sockets: null,
      bays: null,
    }
    const out = runScenario(buildScenarioRunInput(engine))
    for (const w of out.warnings) {
      expect(w).toEqual(
        expect.objectContaining({
          code: expect.any(String),
          severity: expect.stringMatching(/^(info|warn)$/),
          stage: expect.any(String),
          message: expect.any(String),
        }),
      )
    }
    for (const c of out.constraints) {
      expect(c).toEqual(
        expect.objectContaining({
          code: expect.any(String),
          stage: "constraints",
          binding: expect.any(Boolean),
          message: expect.any(String),
        }),
      )
    }
  })
})
