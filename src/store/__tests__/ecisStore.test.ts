import { beforeEach, describe, expect, it, vi } from "vitest"

import * as runFullSensitivity from "@/sensitivity/runFullAnalysis"
import { getDefaultEcisDataState } from "@/store/defaults"
import { defaultSystem } from "@/store/defaults/system"
import {
  ECIS_STORAGE_KEY,
  ECIS_STORAGE_VERSION,
} from "@/store/persistence/constants"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

async function resetStoreAndHydrate() {
  resetEcisStoreForTests()
  await useEcisStore.persist.rehydrate()
}

describe("useEcisStore", () => {
  beforeEach(async () => {
    await resetStoreAndHydrate()
  })

  it("initializes from grouped defaults", () => {
    const fresh = getDefaultEcisDataState()
    const s = useEcisStore.getState()
    expect(s.settings).toEqual(fresh.settings)
    expect(s.system).toEqual(fresh.system)
    expect(s.platform.corridorName).toBe(fresh.platform.corridorName)
    expect(s.energy).toEqual(fresh.energy)
    expect(s.fleet).toEqual(fresh.fleet)
    expect(s.controls).toEqual(fresh.controls)
    expect(s.snapshotModel).toEqual(fresh.snapshotModel)
    expect(s.workspace.panels).toEqual(fresh.workspace.panels)
    expect(s.scenarios.named).toEqual({})
    expect(s.results).toEqual(fresh.results)
    expect(s.snapshot).toBeNull()
    expect(s.recomputeMeta).toEqual(fresh.recomputeMeta)
  })

  it("applies partial updates without clobbering sibling fields", () => {
    useEcisStore.getState().updateSystem({ notes: "stress case" })
    const s = useEcisStore.getState()
    expect(s.system.notes).toBe("stress case")
    expect(s.system.modelHorizonYears).toBe(defaultSystem.modelHorizonYears)
    useEcisStore.getState().updatePlatform({ stagingPhases: 5 })
    expect(useEcisStore.getState().platform.stagingPhases).toBe(5)
    expect(useEcisStore.getState().platform.corridorName).toBe(
      getDefaultEcisDataState().platform.corridorName,
    )
  })

  it("persists settings, assumptions, scaling bands, workspace + named scenarios but never ephemeral slices", () => {
    useEcisStore.setState({
      settings: { ...useEcisStore.getState().settings, locale: "fr" },
      system: { ...useEcisStore.getState().system, notes: "persist-me" },
      results: { status: "ready", lastError: null, engineOutput: null },
      snapshot: { capturedAt: "2099-01-01" },
      recomputeMeta: { revision: 42, lastRunAt: 99 },
    })

    const raw = localStorage.getItem(ECIS_STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state).not.toHaveProperty("results")
    expect(parsed.state).not.toHaveProperty("snapshot")
    expect(parsed.state).not.toHaveProperty("recomputeMeta")
    expect(parsed.state).not.toHaveProperty("sensitivityRun")
    expect(parsed.state).toHaveProperty("settings")
    expect((parsed.state as { settings: { locale: string } }).settings.locale).toBe(
      "fr",
    )
    expect(parsed.state).toHaveProperty("system")
    expect(parsed.state).toHaveProperty("snapshotModel")
    expect(parsed.state).toHaveProperty("scalingBands")
    expect(parsed.state).toHaveProperty("workspace")
    expect(parsed.state).toHaveProperty("scenarios")
  })

  it("rehydrate repairs missing nested fields against defaults", async () => {
    localStorage.setItem(
      ECIS_STORAGE_KEY,
      JSON.stringify({
        state: {
          system: { notes: "partial-disk" },
        },
        version: 1,
      }),
    )
    await useEcisStore.persist.rehydrate()
    const s = useEcisStore.getState()
    expect(s.system.notes).toBe("partial-disk")
    expect(s.system.modelHorizonYears).toBe(defaultSystem.modelHorizonYears)
    expect(s.platform.corridorName).toBe(
      getDefaultEcisDataState().platform.corridorName,
    )
  })

  it("migrates version 0 legacy { assumptions } shape into v1 persisted slice", async () => {
    localStorage.setItem(
      ECIS_STORAGE_KEY,
      JSON.stringify({
        state: {
          assumptions: {
            system: { notes: "from-v0" },
            fleet: { vehicleCount: 12 },
          },
        },
        version: 0,
      }),
    )
    await useEcisStore.persist.rehydrate()
    const s = useEcisStore.getState()
    expect(s.system.notes).toBe("from-v0")
    expect(s.fleet.vehicleCount).toBe(12)
    expect(s.platform.stagingPhases).toBe(
      getDefaultEcisDataState().platform.stagingPhases,
    )
    const stored = JSON.parse(localStorage.getItem(ECIS_STORAGE_KEY)!)
    expect(stored.version).toBe(ECIS_STORAGE_VERSION)
  })

  it("resetToDefaults restores baseline data and clears named scenarios", () => {
    const id = useEcisStore.getState().saveNamedScenario("Baseline A")
    useEcisStore.getState().updateEnergy({ peakDemandMw: 999 })
    useEcisStore.getState().resetToDefaults()
    const s = useEcisStore.getState()
    expect(s.energy.peakDemandMw).toBe(getDefaultEcisDataState().energy.peakDemandMw)
    expect(s.scenarios.named[id]).toBeUndefined()
    expect(s.workspace.activeScenarioId).toBeNull()
  })

  it("supports named scenario CRUD and loadNamedScenario", () => {
    useEcisStore.getState().updateFleet({ vehicleCount: 7 })
    const id = useEcisStore.getState().saveNamedScenario("Fleet-7")

    expect(useEcisStore.getState().scenarios.named[id]?.name).toBe("Fleet-7")
    expect(useEcisStore.getState().workspace.activeScenarioId).toBe(id)

    useEcisStore.getState().updateFleet({ vehicleCount: 0 })
    expect(useEcisStore.getState().loadNamedScenario("missing")).toBe(false)

    expect(useEcisStore.getState().loadNamedScenario(id)).toBe(true)
    expect(useEcisStore.getState().fleet.vehicleCount).toBe(7)
    expect(useEcisStore.getState().results.engineOutput).not.toBeNull()

    useEcisStore.getState().deleteNamedScenario(id)
    expect(useEcisStore.getState().scenarios.named[id]).toBeUndefined()
    expect(useEcisStore.getState().workspace.activeScenarioId).toBeNull()
  })

  it("exportJson only includes persistable payload keys", () => {
    useEcisStore.setState({
      results: { status: "ready", lastError: null, engineOutput: null },
      snapshot: { capturedAt: "x" },
    })
    const doc = JSON.parse(useEcisStore.getState().exportJson()) as {
      payload: Record<string, unknown>
      snapshotSummary?: unknown
      engineOutputSummary?: unknown
    }
    expect(doc.payload.results).toBeUndefined()
    expect(doc.payload.snapshot).toBeUndefined()
    expect(doc.payload.system).toBeDefined()
    expect(doc.snapshotSummary).toBeUndefined()
    expect(doc.engineOutputSummary).toBeUndefined()
  })

  it("recompute bumps revision, fills ephemeral engine output, and does not persist outputs", () => {
    const before = useEcisStore.getState().recomputeMeta.revision
    useEcisStore.getState().recompute()
    const s = useEcisStore.getState()
    expect(s.recomputeMeta.revision).toBe(before + 1)
    expect(s.results.engineOutput).not.toBeNull()
    expect(s.results.status).toBe("ready")
    const raw = localStorage.getItem(ECIS_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).state.recomputeMeta).toBeUndefined()
    expect(JSON.parse(raw!).state.results).toBeUndefined()
  })

  it("loadScenario('default') restores assumption defaults and clears active scenario", () => {
    useEcisStore.getState().updateSystem({ notes: "temp" })
    const id = useEcisStore.getState().saveNamedScenario("keep-named")
    useEcisStore.getState().loadScenario("default")
    expect(useEcisStore.getState().system.notes).toBe("")
    expect(useEcisStore.getState().workspace.activeScenarioId).toBeNull()
    expect(useEcisStore.getState().scenarios.named[id]).toBeDefined()
  })

  it("exportCsv includes assumption rows", () => {
    const csv = useEcisStore.getState().exportCsv()
    expect(csv).toContain("system")
    expect(csv).toContain("modelHorizonYears")
  })

  it("toggleComparisonScenario caps selection and deleteNamedScenario removes compare slots", () => {
    const a = useEcisStore.getState().saveNamedScenario("A")
    const b = useEcisStore.getState().saveNamedScenario("B")
    const c = useEcisStore.getState().saveNamedScenario("C")
    const d = useEcisStore.getState().saveNamedScenario("D")
    const e = useEcisStore.getState().saveNamedScenario("E")
    useEcisStore.getState().toggleComparisonScenario(a)
    useEcisStore.getState().toggleComparisonScenario(b)
    useEcisStore.getState().toggleComparisonScenario(c)
    useEcisStore.getState().toggleComparisonScenario(d)
    expect(useEcisStore.getState().workspace.comparisonScenarioIds).toHaveLength(4)
    useEcisStore.getState().toggleComparisonScenario(e)
    expect(useEcisStore.getState().workspace.comparisonScenarioIds).not.toContain(e)
    useEcisStore.getState().deleteNamedScenario(a)
    expect(useEcisStore.getState().workspace.comparisonScenarioIds).not.toContain(a)
  })

  it("runSensitivityAnalysis does not replace dashboard results or assumptions", async () => {
    const spy = vi.spyOn(runFullSensitivity, "runFullSensitivityAnalysis").mockReturnValue({
      tornado: { bars: [], warnings: [] },
      twoWay: {
        rowParamId: "fleet_vehicleCount",
        rowParamLabel: "Fleet — vehicle count",
        colParamId: "system_discountRatePercent",
        colParamLabel: "System — discount rate (%/yr)",
        colLabels: [],
        rowLabels: [],
        cells: [],
        warnings: [],
      },
      breakeven: { lines: [], warnings: [] },
      warnings: [],
      degraded: false,
    })
    useEcisStore.getState().recompute()
    const resultsRef = useEcisStore.getState().results
    const fleetBefore = useEcisStore.getState().fleet.vehicleCount
    useEcisStore.getState().runSensitivityAnalysis()
    await Promise.resolve()
    await Promise.resolve()
    expect(useEcisStore.getState().results).toBe(resultsRef)
    expect(useEcisStore.getState().fleet.vehicleCount).toBe(fleetBefore)
    expect(useEcisStore.getState().sensitivityRun.phase).toBe("ready")
    spy.mockRestore()
  })
})
