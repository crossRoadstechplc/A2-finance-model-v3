import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { selectEntityPageViewModel } from "@/selectors/entityPages"
import type { EcisSelectorInput } from "@/selectors/input"
import { getDefaultEcisDataState } from "@/store/defaults"

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

describe("selectEntityPageViewModel (detail)", () => {
  it("fills statement tables with expected row keys from engine fixture", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectEntityPageViewModel("energy", input, ctx)

    expect(engine.projection.status).toBe("ok")
    expect(vm.dataAvailable).toBe(true)

    expect(vm.incomeStatement.rows.map((r) => r.rowKey)).toEqual([
      "rev",
      "cogs",
      "opex",
      "ebitda",
      "depr",
      "ebit",
      "int",
      "pretax",
      "tax",
      "ni",
    ])
    expect(vm.balanceSheet.rows.map((r) => r.rowKey)).toContain("sink_asset")
    expect(vm.cashFlowStatement.rows.map((r) => r.rowKey)).toContain("sink_cf")
    expect(
      vm.balanceSheet.rows.find((r) => r.rowKey === "sink_asset")?.rowKind,
    ).toBe("memo")
    expect(
      vm.cashFlowStatement.rows.find((r) => r.rowKey === "sink_cf")?.rowKind,
    ).toBe("memo")
  })

  it("includes debt, capex, and sources & uses columns when model attaches", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    if (engine.projection.status !== "ok" || !engine.projection.model) return
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectEntityPageViewModel("platform", input, ctx)
    expect(vm.debtSchedule.columns.length).toBeGreaterThan(0)
    expect(vm.capexSchedule.columns).toContain("Platform")
    expect(vm.sourcesUsesSchedule.columns).toContain("Total uses")
    expect(vm.corridorMetrics.title).toBe("Entity return & coverage")
    expect(vm.corridorMetrics.lines.map((line) => line.label)).toContain("WACC")
  })

  it("uses stacked bar chart for platform entity", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectEntityPageViewModel("platform", input, ctx)
    if (vm.primaryChart.available) {
      expect(vm.primaryChart.chartKind).toBe("stacked_bar")
    }
  })

  it("does not throw when engine output is missing (optional metrics absent)", () => {
    const input = baseInput({
      results: {
        status: "idle",
        lastError: null,
        engineOutput: null,
      },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    for (const id of ["energy", "platform", "fleet"] as const) {
      const vm = selectEntityPageViewModel(id, input, ctx)
      expect(vm.dataAvailable).toBe(false)
      expect(vm.corridorMetrics.available).toBe(false)
      expect(vm.primaryChart.available).toBe(false)
      expect(vm.incomeStatement.rows).toHaveLength(0)
    }
  })
})
