import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import { nearlyEqual } from "@/finance/math"
import { buildSelectorDisplayContext } from "@/selectors/context"
import {
  CONSOLIDATED_DIESEL_BENCHMARK_USD_PER_KWH,
  selectConsolidatedPageViewModel,
} from "@/selectors/consolidated"
import type { EcisSelectorInput } from "@/selectors/input"
import { getDefaultEcisDataState } from "@/store/defaults"
import type { EcisDataState } from "@/store/types"

function selectorInputFromData(
  data: EcisDataState,
  engine: ReturnType<typeof runEngine>,
): EcisSelectorInput {
  return {
    settings: data.settings,
    system: data.system,
    platform: data.platform,
    energy: data.energy,
    fleet: data.fleet,
    controls: data.controls,
    snapshotModel: data.snapshotModel,
    scalingBands: data.scalingBands,
    results: {
      status: "ready",
      lastError: null,
      engineOutput: engine,
    },
    snapshot: data.snapshot,
    recomputeMeta: data.recomputeMeta,
    sensitivityRun: data.sensitivityRun,
    scenarios: data.scenarios,
    workspace: data.workspace,
  }
}

function consolidatedVm(mut?: (d: EcisDataState) => void) {
  const data = getDefaultEcisDataState()
  data.platform.corridorName = data.platform.corridorName.trim() || "A2 Test"
  if (mut) mut(data)
  const engine = runEngine(assumptionsToEngineInput(data))
  const input = selectorInputFromData(data, engine)
  const ctx = buildSelectorDisplayContext(data.settings)
  return {
    vm: selectConsolidatedPageViewModel(input, ctx),
    engine,
    model: engine.projection.status === "ok" ? engine.projection.model : undefined,
  }
}

describe("selectConsolidatedPageViewModel", () => {
  it("ties elimination-adjusted entity revenue to consolidated revenue (tail period)", () => {
    const { vm, model } = consolidatedVm()
    expect(model).toBeDefined()
    const last = model!.consolidated[model!.consolidated.length - 1]!
    const i = last.periodIndex - 1
    const e = model!.entities.energy.incomeStatement[i]!.revenue
    const p = model!.entities.platform.incomeStatement[i]!.revenue
    const f = model!.entities.fleet.incomeStatement[i]!.revenue
    const c = model!.consolidated[i]!.incomeStatement.revenue
    const eliminationAmount = model!.eliminations
      .filter((line) => line.periodIndex === last.periodIndex)
      .reduce((sum, line) => sum + line.amountUsd, 0)
    const adj = e + p + f - eliminationAmount
    expect(nearlyEqual(adj, c, 1e-2)).toBe(true)

    const elimCheck = vm.circularConvergence.checks.find(
      (x) => x.id === "elimination_revenue",
    )
    expect(elimCheck?.ok).toBe(true)
    expect(vm.economicsSummary.lines[0]?.note).toMatch(/Elimination-adjusted/i)
  })

  it("classifies diesel parity crossover: below, at par, and above benchmark", () => {
    const below = consolidatedVm((d) => {
      d.snapshotModel.gridPassThroughUsdPerKwh = 0.1
      d.snapshotModel.a2EnergyUsdPerKwh = 0
      d.snapshotModel.a2PlatformUsdPerKwh = 0
    })
    expect(below.vm.dieselParity.crossover).toBe("a2_below_diesel")
    expect(below.vm.dieselParity.benchmarkUsdPerKwh).toBe(
      CONSOLIDATED_DIESEL_BENCHMARK_USD_PER_KWH,
    )

    const above = consolidatedVm((d) => {
      d.snapshotModel.gridPassThroughUsdPerKwh = 0.35
      d.snapshotModel.a2EnergyUsdPerKwh = 0
      d.snapshotModel.a2PlatformUsdPerKwh = 0
    })
    expect(above.vm.dieselParity.crossover).toBe("a2_above_diesel")

    const bench = CONSOLIDATED_DIESEL_BENCHMARK_USD_PER_KWH
    const atPar = consolidatedVm((d) => {
      d.snapshotModel.gridPassThroughUsdPerKwh = bench
      d.snapshotModel.a2EnergyUsdPerKwh = 0
      d.snapshotModel.a2PlatformUsdPerKwh = 0
    })
    expect(atPar.vm.dieselParity.crossover).toBe("at_par")
  })

  it("separates circular convergence from business viability (binding constraint)", () => {
    const { vm } = consolidatedVm((d) => {
      d.fleet.vehicleCount = 120
      d.snapshotModel.infrastructureOverrides = {
        stations: null,
        sockets: 1,
        bays: null,
      }
      d.snapshotModel.socketOutputKw = 50
      d.snapshotModel.chargingWindowHoursPerDay = 4
      d.snapshotModel.socketEffectiveUtilization = 0.5
    })

    expect(vm.businessViability.available).toBe(true)
    expect(vm.businessViability.viable).toBe(false)
    expect(vm.businessViability.reasons.length).toBeGreaterThan(0)

    expect(vm.circularConvergence.status).not.toBe("not_applicable")
    expect(["ok", "failed_check"]).toContain(vm.circularConvergence.status)
    expect(vm.circularConvergence.checks.map((c) => c.id)).toEqual([
      "bs_identity",
      "elimination_revenue",
    ])
    expect(vm.businessViability).toEqual(
      expect.objectContaining({ available: true, viable: false }),
    )
  })

  it("sums category uses to total uses on each funding timeline row", () => {
    const { vm, model } = consolidatedVm()
    expect(vm.fundingTimeline.available).toBe(true)
    expect(vm.fundingTimeline.rows.length).toBeGreaterThan(0)
    expect(vm.fundingTimeline.rows.every((r) => r.categoriesMatchUses)).toBe(true)
    expect(vm.investmentSummary.rows.map((row) => row.rowKey)).toContain("wacc")
    expect(vm.investmentSummary.rows.map((row) => row.rowKey)).toContain("payback_project")

    const y1EntityUses =
      (model?.entities.energy.sourcesUses[0]?.totalUsesUsd ?? 0) +
      (model?.entities.platform.sourcesUses[0]?.totalUsesUsd ?? 0) +
      (model?.entities.fleet.sourcesUses[0]?.totalUsesUsd ?? 0)
    expect(vm.fundingTimeline.rows[0]?.totalUses).toBeDefined()
    expect(y1EntityUses).toBeGreaterThan(model?.entities.energy.sourcesUses[0]?.totalUsesUsd ?? 0)
  })
})
