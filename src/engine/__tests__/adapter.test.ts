import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { getDefaultEcisDataState } from "@/store/defaults"
import { ENGINE_INPUT_VERSION } from "@/engine/types"

const EXPECTED_ENGINE_INPUT_VERSION = 3

describe("assumptionsToEngineInput", () => {
  it("maps store percents to decimal rates and copies stable fields", () => {
    const data = getDefaultEcisDataState()
    data.system.discountRatePercent = 8
    data.system.inflationAssumptionPercent = 2.5
    data.system.modelHorizonYears = 12
    data.platform.corridorName = "Test Corridor"
    data.settings.currency = "EUR"

    const input = assumptionsToEngineInput(data)

    expect(ENGINE_INPUT_VERSION).toBe(EXPECTED_ENGINE_INPUT_VERSION)
    expect(input.version).toBe(EXPECTED_ENGINE_INPUT_VERSION)
    expect(input.horizon.periodCount).toBe(12)
    expect(input.horizon.discountRatePerPeriod).toBeCloseTo(0.08, 12)
    expect(input.horizon.inflationRatePerPeriod).toBeCloseTo(0.025, 12)
    expect(input.platform.corridorName).toBe("Test Corridor")
    expect(input.presentation.currency).toBe("EUR")
    expect(input.fleet.vehicleCount).toBe(data.fleet.vehicleCount)
    expect(input.controls.sensitivityMode).toBe(data.controls.sensitivityMode)
    expect(input.scalingBands).toEqual(data.scalingBands)
    expect(input.snapshotModel.gridPassThroughUsdPerKwh).toBe(
      data.snapshotModel.gridPassThroughUsdPerKwh,
    )
    data.snapshotModel.a2EnergyUsdPerKwh = 0.05
    const input2 = assumptionsToEngineInput(data)
    expect(input2.snapshotModel.a2EnergyUsdPerKwh).toBe(0.05)
  })

  it("truncates fractional horizon toward zero", () => {
    const data = getDefaultEcisDataState()
    data.system.modelHorizonYears = 5.9
    const input = assumptionsToEngineInput(data)
    expect(input.horizon.periodCount).toBe(5)
  })

  it("throws on non-positive horizon", () => {
    const data = getDefaultEcisDataState()
    data.system.modelHorizonYears = 0
    expect(() => assumptionsToEngineInput(data)).toThrow(/horizon/i)
  })

  it("throws on horizon above cap", () => {
    const data = getDefaultEcisDataState()
    data.system.modelHorizonYears = 201
    expect(() => assumptionsToEngineInput(data)).toThrow(/200/)
  })
})
