import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import { ENGINE_OUTPUT_VERSION } from "@/engine/types"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { selectDashboardViewModel } from "@/selectors/dashboard"
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

describe("selectDashboardViewModel", () => {
  it("exposes price stack segments and totals from a successful engine fixture", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)

    expect(dash.priceStack.available).toBe(true)
    expect(dash.priceStack.segments).toHaveLength(3)
    expect(dash.priceStack.segments.map((s) => s.key)).toEqual([
      "grid",
      "a2_energy",
      "a2_platform",
    ])
    expect(
      dash.priceStack.segments.every((s) => Number.isFinite(s.usdPerKwh)),
    ).toBe(true)
    expect(Number.isFinite(dash.priceStack.totalDisplayPerKwh)).toBe(true)
  })

  it("maps chart periods to display amounts with stable shape", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    if (engine.projection.status !== "ok") throw new Error("expected ok projection")
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)

    expect(dash.chart.available).toBe(true)
    expect(dash.chart.periods).toHaveLength(engine.projection.periods.length)
    const first = dash.chart.periods[0]
    expect(first).toMatchObject({
      periodIndex: expect.any(Number),
      placeholderNetCash: { display: expect.any(Number), usd: expect.any(Number) },
    })
  })

  it("surfaces projection errors and convergence failure without throwing", () => {
    const input = baseInput({
      results: {
        status: "ready",
        lastError: null,
        engineOutput: {
          version: ENGINE_OUTPUT_VERSION,
          computedAt: "t",
          projection: { status: "failed", error: "Fixture projection failure" },
          engineSnapshot: {
            status: "ok",
            capturedAt: "t",
            label: "x",
          },
        },
      },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)

    expect(dash.alerts.projectionError).toBe("Fixture projection failure")
    expect(dash.convergence.status).toBe("error")
    expect(dash.headline.available).toBe(false)
    expect(dash.priceStack.available).toBe(false)
    expect(dash.warningBanners).toHaveLength(0)
  })

  it("lists scenario warnings and constraints for banners", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)

    expect(Array.isArray(dash.warningBanners)).toBe(true)
    expect(Array.isArray(dash.constraintBanners)).toBe(true)
    expect(dash.constraintBanners.length).toBe(
      engine.projection.status === "ok"
        ? engine.projection.scenario.constraints.length
        : 0,
    )
    if (dash.constraintBanners.length > 0) {
      expect(dash.constraintBanners[0]).toEqual(
        expect.objectContaining({
          explanation: expect.anything(),
          actions: expect.any(Array),
        }),
      )
    }
  })

  it("shows stale hint on the alert strip when results are stale", () => {
    const input = baseInput({
      results: {
        status: "stale",
        lastError: null,
        engineOutput: null,
      },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const dash = selectDashboardViewModel(input, ctx)
    expect(dash.alerts.showStaleHint).toBe(true)
    expect(dash.convergence.status).toBe("stale")
  })
})
