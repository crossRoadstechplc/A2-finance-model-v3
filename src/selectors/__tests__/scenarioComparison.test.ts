import { describe, expect, it } from "vitest"

import { buildSelectorDisplayContext } from "@/selectors/context"
import type { EcisSelectorInput } from "@/selectors/input"
import { selectScenarioComparisonViewModel } from "@/selectors/scenarioComparison"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"
import type { NamedScenario } from "@/store/types"

function baseInput(over?: Partial<EcisSelectorInput>): EcisSelectorInput {
  const s = getDefaultEcisDataState()
  return {
    settings: s.settings,
    system: s.system,
    platform: s.platform,
    energy: s.energy,
    fleet: s.fleet,
    controls: s.controls,
    snapshotModel: s.snapshotModel,
    scalingBands: s.scalingBands,
    results: s.results,
    snapshot: s.snapshot,
    recomputeMeta: s.recomputeMeta,
    sensitivityRun: s.sensitivityRun,
    scenarios: s.scenarios,
    workspace: s.workspace,
    ...over,
  }
}

describe("selectScenarioComparisonViewModel", () => {
  it("builds columns for live + selected named scenarios with deltas vs current inputs", () => {
    const low = getDefaultEcisDataState()
    low.fleet.vehicleCount = 5
    low.platform.corridorName = low.platform.corridorName.trim() || "A2 Test"

    const high = getDefaultEcisDataState()
    high.fleet.vehicleCount = 120
    high.platform.corridorName = high.platform.corridorName.trim() || "A2 Test"

    const sa: NamedScenario = {
      id: "low",
      name: "Low fleet",
      createdAt: "2020-01-01T00:00:00.000Z",
      assumptions: buildAssumptionsSnapshot(low),
    }
    const sb: NamedScenario = {
      id: "high",
      name: "High fleet",
      createdAt: "2020-01-02T00:00:00.000Z",
      assumptions: buildAssumptionsSnapshot(high),
    }

    const live = getDefaultEcisDataState()
    live.fleet.vehicleCount = 40
    live.platform.corridorName = live.platform.corridorName.trim() || "A2 Test"

    const input = baseInput({
      fleet: live.fleet,
      scenarios: { named: { low: sa, high: sb } },
      workspace: {
        ...live.workspace,
        comparisonScenarioIds: ["high", "low"],
      },
    })

    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectScenarioComparisonViewModel(input, ctx)

    expect(vm.columns.map((c) => c.id)).toEqual(["__live__", "low", "high"])

    const headline = vm.rows.find((r) => r.metricId === "headlineNpv")
    expect(headline).toBeDefined()
    expect(headline!.cells).toHaveLength(3)
    expect(headline!.cells[0]!.deltaAbsolute).toBeNull()
    expect(headline!.cells[1]!.deltaAbsolute).not.toBeNull()
    expect(headline!.cells[2]!.deltaAbsolute).not.toBeNull()
    expect(
      headline!.cells[0]!.value === "—" || headline!.cells[0]!.value.length > 0,
    ).toBe(true)
  })

  it("highlights the best retail stack when lower USD/kWh is better", () => {
    const cheap = getDefaultEcisDataState()
    cheap.snapshotModel.gridPassThroughUsdPerKwh = 0.05
    cheap.snapshotModel.a2EnergyUsdPerKwh = 0
    cheap.snapshotModel.a2PlatformUsdPerKwh = 0
    cheap.platform.corridorName = cheap.platform.corridorName.trim() || "A2 Test"

    const pricey = getDefaultEcisDataState()
    pricey.snapshotModel.gridPassThroughUsdPerKwh = 0.4
    pricey.snapshotModel.a2EnergyUsdPerKwh = 0
    pricey.snapshotModel.a2PlatformUsdPerKwh = 0
    pricey.platform.corridorName = pricey.platform.corridorName.trim() || "A2 Test"

    const scCheap: NamedScenario = {
      id: "c",
      name: "Cheap grid",
      createdAt: "2020-01-01T00:00:00.000Z",
      assumptions: buildAssumptionsSnapshot(cheap),
    }
    const scPricey: NamedScenario = {
      id: "p",
      name: "Pricey grid",
      createdAt: "2020-01-02T00:00:00.000Z",
      assumptions: buildAssumptionsSnapshot(pricey),
    }

    const input = baseInput({
      snapshotModel: pricey.snapshotModel,
      scenarios: { named: { c: scCheap, p: scPricey } },
      workspace: {
        ...getDefaultEcisDataState().workspace,
        comparisonScenarioIds: ["c", "p"],
      },
    })

    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectScenarioComparisonViewModel(input, ctx)

    const row = vm.rows.find((r) => r.metricId === "totalRetailUsdPerKwh")
    expect(row).toBeDefined()
    const cheapIdx = vm.columns.findIndex((c) => c.id === "c")
    const priceyIdx = vm.columns.findIndex((c) => c.id === "p")
    expect(row!.cells[cheapIdx]!.highlight).toBe("best")
    expect(row!.cells[priceyIdx]!.highlight).toBe("none")
  })

  it("includes richer corridor comparison metrics with appropriate formatting", () => {
    const input = baseInput()
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectScenarioComparisonViewModel(input, ctx)

    const metricIds = vm.rows.map((row) => row.metricId)
    expect(metricIds).toContain("equityIrr")
    expect(metricIds).toContain("moicEquity")
    expect(metricIds).toContain("projectPayback")
    expect(metricIds).toContain("minDscr")

    expect(vm.enginePathNote).toContain("-> runEngine")
    expect(vm.emptyComparisonHint).toContain('"Compare"')
  })
})
