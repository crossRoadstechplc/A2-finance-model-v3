import { describe, expect, it } from "vitest"

import { runEngine } from "@/engine/runEngine"
import { assumptionsToEngineInput } from "@/engine/adapter"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import { selectConsolidatedPageViewModel } from "@/selectors/consolidated"
import { selectDashboardViewModel } from "@/selectors/dashboard"
import { selectEntityPageViewModel } from "@/selectors/entityPages"
import { selectExportsPageViewModel } from "@/selectors/exports"
import type { EcisSelectorInput } from "@/selectors/input"
import { selectScenariosPageViewModel } from "@/selectors/scenarios"
import { selectSensitivitiesPageViewModel } from "@/selectors/sensitivities"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

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

describe("selectors", () => {
  it("converts USD display amounts at the selector layer", () => {
    const settings = getDefaultEcisDataState().settings
    const ctx = buildSelectorDisplayContext(settings, {
      usdPerUnitDisplayOverride: 1.25,
    })
    const v = convertUsdForDisplay(1250, ctx)
    expect(v.usd).toBe(1250)
    expect(v.display).toBeCloseTo(1000, 8)
  })

  it("falls back to USD numerics when FX is unknown for non-USD codes", () => {
    const settings = {
      ...getDefaultEcisDataState().settings,
      currency: "EUR",
      displayFxUsdPerUnit: 0,
    }
    const ctx = buildSelectorDisplayContext(settings)
    expect(ctx.usedUsdFallback).toBe(true)
    const v = convertUsdForDisplay(500, ctx)
    expect(v.display).toBe(500)
  })

  it("formats non-finite values as an em dash", () => {
    const ctx = buildSelectorDisplayContext(getDefaultEcisDataState().settings)
    expect(formatDisplayNumber(Number.NaN, ctx)).toBe("—")
  })

  it("handles null / missing engine output without throwing", () => {
    const input = baseInput({
      results: {
        status: "idle",
        lastError: null,
        engineOutput: null,
      },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)
    expect(dash.headline.available).toBe(false)
    expect(dash.headline.headlineNpv).toBeNull()
    expect(dash.chart.available).toBe(false)
    expect(dash.model.available).toBe(false)

    const energy = selectEntityPageViewModel("energy", input, ctx)
    expect(energy.scenario.available).toBe(false)
    expect(energy.projection.available).toBe(false)

    const consol = selectConsolidatedPageViewModel(input, ctx)
    expect(consol.model.available).toBe(false)
  })

  it("maps dashboard headline and chart when projection is ok", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: {
        status: "ready",
        lastError: null,
        engineOutput: engine,
      },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)
    expect(dash.headline.available).toBe(true)
    expect(Number.isFinite(dash.headline.headlineNpv?.usd ?? Number.NaN)).toBe(
      true,
    )
    expect(dash.chart.periods.length).toBe(data.system.modelHorizonYears)
    if (engine.projection.status === "ok" && engine.projection.model) {
      expect(dash.model.available).toBe(true)
    }
  })

  it("keeps page DTO top-level keys stable", () => {
    const input = baseInput()
    const ctx = buildSelectorDisplayContext(input.settings)
    expect(Object.keys(selectDashboardViewModel(input, ctx)).sort()).toMatchInlineSnapshot(`
      [
        "alerts",
        "chart",
        "constraintBanners",
        "convergence",
        "corridorName",
        "corridorSummaryCards",
        "entityQuickSummaries",
        "fundingCapacity",
        "headline",
        "lastError",
        "lastRunAt",
        "model",
        "modelHorizonYears",
        "priceStack",
        "recomputeRevision",
        "resultsStatus",
        "snapshotLabel",
        "snapshotStatus",
        "vehicleCount",
        "version",
        "warningBanners",
      ]
    `)
    expect(
      Object.keys(selectEntityPageViewModel("fleet", input, ctx)).sort(),
    ).toMatchInlineSnapshot(`
      [
        "balanceSheet",
        "capexSchedule",
        "cashFlowStatement",
        "constraintItems",
        "constraintsBindingCount",
        "corridorMetrics",
        "corridorName",
        "dataAvailable",
        "debtSchedule",
        "entityId",
        "entityWarnings",
        "equityStatement",
        "incomeStatement",
        "kpis",
        "primaryChart",
        "projection",
        "scenario",
        "sourcesUsesSchedule",
        "title",
        "version",
        "warningsCount",
      ]
    `)
    expect(
      Object.keys(selectConsolidatedPageViewModel(input, ctx)).sort(),
    ).toMatchInlineSnapshot(`
      [
        "businessViability",
        "circularConvergence",
        "corridorName",
        "dieselParity",
        "economicsSummary",
        "fundingTimeline",
        "investmentSummary",
        "model",
        "priceStack",
        "sourcesUses",
        "version",
      ]
    `)
    expect(Object.keys(selectScenariosPageViewModel(input)).sort()).toMatchInlineSnapshot(`
      [
        "activeScenarioId",
        "comparisonScenarioIds",
        "rows",
        "version",
      ]
    `)
    expect(
      Object.keys(
        selectExportsPageViewModel(
          input,
          ctx,
          buildAssumptionsSnapshot({
            ...getDefaultEcisDataState(),
            system: input.system,
            platform: input.platform,
            energy: input.energy,
            fleet: input.fleet,
            controls: input.controls,
          }),
        ),
      ).sort(),
    ).toMatchInlineSnapshot(`
      [
        "assumptionCsvRowCount",
        "availableEntityPackCount",
        "consolidatedPeriodCount",
        "currencyCode",
        "exportJsonVersion",
        "hasModelAnalytics",
        "hasReadyResults",
        "namedScenarioCount",
        "usedUsdFallback",
        "version",
      ]
    `)
    expect(
      Object.keys(selectSensitivitiesPageViewModel(input, ctx)).sort(),
    ).toMatchInlineSnapshot(`
      [
        "breakeven",
        "enginePathNote",
        "monteCarloIterations",
        "runPhase",
        "sensitivityMode",
        "staleVersusRecompute",
        "stressCase",
        "stressGridAvailable",
        "summary",
        "tornado",
        "twoWay",
        "version",
        "warnings",
      ]
    `)
  })

  it("aligns export row count with store exportCsv newline rows", async () => {
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()
    const s = useEcisStore.getState()
    const csv = s.exportCsv()
    const lines = csv.split("\n").filter((l) => l.length > 0).length
    const input: EcisSelectorInput = {
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
    }
    const ctx = buildSelectorDisplayContext(s.settings)
    const snap = buildAssumptionsSnapshot(s)
    const vm = selectExportsPageViewModel(input, ctx, snap)
    expect(vm.assumptionCsvRowCount).toBe(lines)
  })

  it("sorts scenario rows by createdAt", () => {
    const input = baseInput({
      scenarios: {
        named: {
          b: {
            id: "b",
            name: "Second",
            createdAt: "2020-01-02T00:00:00.000Z",
            assumptions: buildAssumptionsSnapshot(getDefaultEcisDataState()),
          },
          a: {
            id: "a",
            name: "First",
            createdAt: "2020-01-01T00:00:00.000Z",
            assumptions: buildAssumptionsSnapshot(getDefaultEcisDataState()),
          },
        },
      },
      workspace: { ...getDefaultEcisDataState().workspace, activeScenarioId: "b" },
    })
    const vm = selectScenariosPageViewModel(input)
    expect(vm.rows.map((r) => r.id)).toEqual(["a", "b"])
    expect(vm.rows.find((r) => r.id === "b")?.isActive).toBe(true)
  })
})
